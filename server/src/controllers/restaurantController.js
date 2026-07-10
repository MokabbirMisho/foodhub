import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Review from '../models/Review.js';
import {
  getRestaurantAvailability,
  restaurantScheduleDays,
} from '../utils/restaurantAvailability.js';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getDeliveryMinutes = (value) => {
  const minutes = String(value || '').match(/\d+/g);
  return minutes
    ? Math.max(...minutes.map(Number))
    : Number.POSITIVE_INFINITY;
};

const withAvailability = (restaurant) => ({
  ...restaurant.toObject(),
  availability: getRestaurantAvailability(restaurant),
});

const sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const handleRestaurantError = (res, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  if (error.code === 11000) {
    return sendErrorResponse(res, 400, 'Restaurant already exists for this owner');
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');

    return sendErrorResponse(res, 400, message);
  }

  return sendErrorResponse(res, 500, 'Server error');
};

export const createRestaurant = async (req, res) => {
  try {
    const existingRestaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (existingRestaurant) {
      return sendErrorResponse(res, 400, 'You already have a restaurant profile');
    }

    // New restaurants must be approved later before customers can see them.
    const restaurant = await Restaurant.create({
      ...req.body,
      owner: req.user._id,
      isApproved: false,
    });

    sendSuccessResponse(res, 201, 'Restaurant created successfully', {
      restaurant,
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant fetched successfully', {
      restaurant: withAvailability(restaurant),
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const updateMyRestaurant = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Restaurant owners cannot approve their own restaurant.
    delete updates.owner;
    delete updates.isApproved;
    delete updates.isOpen;
    delete updates.isTemporarilyClosed;
    delete updates.temporaryClosedReason;
    delete updates.openingHours;
    delete updates.availabilityNote;

    if (updates.deactivationRequest) {
      const reason = updates.deactivationRequest.reason || '';

      updates.deactivationRequest = {
        requested: true,
        reason,
        requestedAt: new Date(),
        status: 'pending',
      };
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: req.user._id },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant updated successfully', {
      restaurant,
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const getAllRestaurants = async (req, res) => {
  try {
    const {
      city,
      cuisine,
      maxDeliveryFee,
      maxDeliveryTime,
      minRating,
      openNow,
      search,
      sort = 'relevance',
    } = req.query;
    const requestedPage = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 12, 1),
      50,
    );

    const filters = {
      isApproved: true,
      isActive: true,
    };

    if (city) {
      filters['address.city'] = new RegExp(city, 'i');
    }

    if (cuisine && cuisine !== 'all') {
      filters.cuisineTypes = new RegExp(escapeRegex(cuisine), 'i');
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      const matchingFoodRestaurantIds = await FoodItem.distinct('restaurant', {
        isAvailable: true,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { tags: searchRegex },
        ],
      });

      filters.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { cuisineTypes: searchRegex },
        { 'address.city': searchRegex },
        { 'address.street': searchRegex },
        { _id: { $in: matchingFoodRestaurantIds } },
      ];
    }

    const numericMinRating = Number(minRating);
    if (minRating && Number.isFinite(numericMinRating)) {
      filters.ratingAverage = { $gte: numericMinRating };
    }

    const numericMaxDeliveryFee = Number(maxDeliveryFee);
    if (maxDeliveryFee !== undefined && Number.isFinite(numericMaxDeliveryFee)) {
      filters.deliveryFee = { $lte: numericMaxDeliveryFee };
    }

    let restaurants = await Restaurant.find(filters);
    let restaurantsWithAvailability = restaurants.map(withAvailability);

    if (openNow === 'true') {
      restaurantsWithAvailability = restaurantsWithAvailability.filter(
        (restaurant) => restaurant.availability.isAvailableNow,
      );
    }

    const numericMaxDeliveryTime = Number(maxDeliveryTime);
    if (maxDeliveryTime && Number.isFinite(numericMaxDeliveryTime)) {
      restaurantsWithAvailability = restaurantsWithAvailability.filter(
        (restaurant) =>
          getDeliveryMinutes(restaurant.estimatedDeliveryTime) <=
          numericMaxDeliveryTime,
      );
    }

    const sorters = {
      rating_desc: (a, b) =>
        b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount,
      delivery_time_asc: (a, b) =>
        getDeliveryMinutes(a.estimatedDeliveryTime) -
        getDeliveryMinutes(b.estimatedDeliveryTime),
      delivery_fee_asc: (a, b) => a.deliveryFee - b.deliveryFee,
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      min_order_asc: (a, b) =>
        a.minimumOrderAmount - b.minimumOrderAmount,
    };

    const defaultSorter = search
      ? (a, b) => {
          const query = search.trim().toLowerCase();
          const aDirectMatch =
            a.name.toLowerCase().includes(query) ||
            a.cuisineTypes.some((value) => value.toLowerCase().includes(query));
          const bDirectMatch =
            b.name.toLowerCase().includes(query) ||
            b.cuisineTypes.some((value) => value.toLowerCase().includes(query));
          return Number(bDirectMatch) - Number(aDirectMatch);
        }
      : sorters.newest;

    restaurantsWithAvailability.sort(sorters[sort] || defaultSorter);

    const total = restaurantsWithAvailability.length;
    const pages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(requestedPage, pages);
    const start = (page - 1) * limit;
    restaurantsWithAvailability = restaurantsWithAvailability.slice(
      start,
      start + limit,
    );

    sendSuccessResponse(res, 200, 'Restaurants fetched successfully', {
      restaurants: restaurantsWithAvailability,
      total,
      page,
      pages,
      filters: {
        search: search || '',
        cuisine: cuisine || 'all',
        openNow: openNow === 'true',
        minRating: minRating || '',
        maxDeliveryFee: maxDeliveryFee ?? '',
        maxDeliveryTime: maxDeliveryTime || '',
        sort,
      },
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const getAllRestaurantsForAdmin = async (req, res) => {
  try {
    const { approvalStatus, city, search } = req.query;
    const filters = {};

    // Simple approval buckets for the first admin approval workflow.
    if (approvalStatus === 'pending') {
      filters.isApproved = false;
      filters.isActive = true;
    }

    if (approvalStatus === 'approved') {
      filters.isApproved = true;
      filters.isActive = true;
    }

    if (approvalStatus === 'rejected') {
      filters.isActive = false;
    }

    if (city) {
      filters['address.city'] = new RegExp(city, 'i');
    }

    if (search) {
      filters.name = new RegExp(search, 'i');
    }

    const restaurants = await Restaurant.find(filters)
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Admin restaurants fetched successfully', {
      restaurants,
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

const getApprovalStatus = (restaurant) => {
  if (restaurant.isApproved && restaurant.isActive) {
    return 'approved';
  }

  if (!restaurant.isApproved && !restaurant.isActive) {
    return 'rejected';
  }

  return 'pending';
};

const buildPerformanceSummary = (orders, reviews) => {
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');
  const activeOrders = orders.filter((order) =>
    ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(
      order.status,
    ),
  );
  const totalRevenue = deliveredOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  return {
    totalOrders: orders.length,
    deliveredOrders: deliveredOrders.length,
    cancelledOrders: cancelledOrders.length,
    activeOrders: activeOrders.length,
    totalRevenue,
    averageOrderValue: deliveredOrders.length
      ? totalRevenue / deliveredOrders.length
      : 0,
    averageRating: reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      : 0,
    totalReviews: reviews.length,
    lastOrderAt: orders[0]?.createdAt || null,
  };
};

export const getAdminRestaurantDetails = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const restaurant = await Restaurant.findById(restaurantId).populate(
      'owner',
      'name email phone role createdAt updatedAt',
    );

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const [orders, reviews] = await Promise.all([
      Order.find({ restaurant: restaurant._id })
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 }),
      Review.find({ restaurant: restaurant._id })
        .populate('customer', 'name email avatar')
        .populate('order', 'status totalAmount createdAt')
        .sort({ createdAt: -1 }),
    ]);

    sendSuccessResponse(res, 200, 'Restaurant details fetched successfully', {
      restaurant: {
        ...withAvailability(restaurant),
        approvalStatus: getApprovalStatus(restaurant),
      },
      owner: restaurant.owner,
      performance: buildPerformanceSummary(orders, reviews),
      recentOrders: orders.slice(0, 10),
      recentReviews: reviews.slice(0, 10),
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const updateRestaurantForAdmin = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const allowedFields = [
      'name',
      'description',
      'phone',
      'email',
      'address',
      'cuisineTypes',
      'minimumOrderAmount',
      'deliveryFee',
      'estimatedDeliveryTime',
      'isOpen',
      'isActive',
      'acceptsOnlineOrders',
      'autoAcceptOrders',
      'bankDetails',
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).populate('owner', 'name email phone role createdAt updatedAt');

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant updated successfully', {
      restaurant: {
        ...withAvailability(restaurant),
        approvalStatus: getApprovalStatus(restaurant),
      },
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const restaurant = await Restaurant.findOne({
      _id: id,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant fetched successfully', {
      restaurant: withAvailability(restaurant),
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const updateMyRestaurantAvailability = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const {
      availabilityNote,
      isTemporarilyClosed,
      openingHours,
      temporaryClosedReason,
    } = req.body;

    if (openingHours !== undefined) {
      if (!openingHours || typeof openingHours !== 'object') {
        return sendErrorResponse(res, 400, 'Opening hours must be an object');
      }

      for (const [day, schedule] of Object.entries(openingHours)) {
        if (!restaurantScheduleDays.includes(day)) {
          return sendErrorResponse(res, 400, `Invalid opening hours day: ${day}`);
        }

        if (!schedule || typeof schedule !== 'object') {
          return sendErrorResponse(res, 400, `Invalid schedule for ${day}`);
        }

        if (!schedule.isClosed) {
          if (
            !timePattern.test(schedule.open) ||
            !timePattern.test(schedule.close)
          ) {
            return sendErrorResponse(
              res,
              400,
              'Opening hours must use HH:mm format',
            );
          }

          if (schedule.open >= schedule.close) {
            return sendErrorResponse(
              res,
              400,
              'Opening time must be before closing time',
            );
          }
        }

        restaurant.openingHours[day] = {
          isClosed: Boolean(schedule.isClosed),
          open: schedule.open || restaurant.openingHours[day]?.open,
          close: schedule.close || restaurant.openingHours[day]?.close,
        };
      }
    }

    if (typeof isTemporarilyClosed === 'boolean') {
      restaurant.isTemporarilyClosed = isTemporarilyClosed;
      restaurant.isOpen = !isTemporarilyClosed;
    }

    if (temporaryClosedReason !== undefined) {
      restaurant.temporaryClosedReason = String(temporaryClosedReason).trim();
    }

    if (availabilityNote !== undefined) {
      restaurant.availabilityNote = String(availabilityNote).trim();
    }

    await restaurant.save();

    sendSuccessResponse(res, 200, 'Restaurant availability updated', {
      restaurant: withAvailability(restaurant),
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      {
        isApproved: true,
        isActive: true,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate('owner', 'name email role');

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant approved successfully', {
      restaurant,
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};

export const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      {
        isApproved: false,
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate('owner', 'name email role');

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    sendSuccessResponse(res, 200, 'Restaurant rejected successfully', {
      restaurant,
    });
  } catch (error) {
    handleRestaurantError(res, error);
  }
};
