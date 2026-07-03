import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem.js';
import Restaurant from '../models/Restaurant.js';
import { getRestaurantAvailability } from '../utils/restaurantAvailability.js';

const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

const handleFoodError = (res, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');

    return sendErrorResponse(res, 400, message);
  }

  return sendErrorResponse(res, 500, 'Server error');
};

const getOwnedRestaurant = async (ownerId) => {
  return Restaurant.findOne({ owner: ownerId });
};

const buildFoodFilters = (query) => {
  const { category, isAvailable, search } = query;
  const filters = {};

  if (category) {
    filters.category = new RegExp(category, 'i');
  }

  if (search) {
    filters.name = new RegExp(search, 'i');
  }

  if (isAvailable === 'true') {
    filters.isAvailable = true;
  }

  if (isAvailable === 'false') {
    filters.isAvailable = false;
  }

  return filters;
};

export const createFoodItem = async (req, res) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Create a restaurant profile first');
    }

    // Food items always belong to the logged-in owner's restaurant.
    const foodItem = await FoodItem.create({
      ...req.body,
      restaurant: restaurant._id,
    });

    sendSuccessResponse(res, 201, 'Food item created successfully', {
      foodItem,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const getMyRestaurantFoodItems = async (req, res) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Create a restaurant profile first');
    }

    const filters = {
      restaurant: restaurant._id,
      ...buildFoodFilters(req.query),
    };

    const foodItems = await FoodItem.find(filters).sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Food items fetched successfully', {
      foodItems,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const getPublicRestaurantFoodItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const filters = {
      restaurant: restaurantId,
      ...buildFoodFilters(req.query),
      isAvailable: true,
    };

    const foodItems = await FoodItem.find(filters).sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Restaurant menu fetched successfully', {
      foodItems,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const searchPublicFoodItems = async (req, res) => {
  try {
    const { category, maxPrice, search, sort = 'newest' } = req.query;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 8, 1),
      50,
    );
    const publicRestaurants = await Restaurant.find({
      isApproved: true,
      isActive: true,
    });
    const restaurantIds = publicRestaurants.map((restaurant) => restaurant._id);
    const restaurantAvailability = new Map(
      publicRestaurants.map((restaurant) => [
        String(restaurant._id),
        getRestaurantAvailability(restaurant),
      ]),
    );
    const filters = {
      restaurant: { $in: restaurantIds },
      isAvailable: true,
    };

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filters.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (category && category !== 'all') {
      filters.category = new RegExp(escapeRegex(category), 'i');
    }

    const numericMaxPrice = Number(maxPrice);
    if (maxPrice && Number.isFinite(numericMaxPrice)) {
      filters.price = { $lte: numericMaxPrice };
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      name_asc: { name: 1 },
    };
    const total = await FoodItem.countDocuments(filters);
    const pages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, pages);
    const foodItems = await FoodItem.find(filters)
      .populate(
        'restaurant',
        'name cuisineTypes deliveryFee estimatedDeliveryTime isApproved isActive',
      )
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((safePage - 1) * limit)
      .limit(limit);
    const results = foodItems.map((foodItem) => {
      const item = foodItem.toObject();
      return {
        ...item,
        restaurant: {
          ...item.restaurant,
          availability: restaurantAvailability.get(
            String(foodItem.restaurant._id),
          ),
        },
      };
    });

    sendSuccessResponse(res, 200, 'Food search completed successfully', {
      foodItems: results,
      total,
      page: safePage,
      pages,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid food item id');
    }

    const foodItem = await FoodItem.findOne({
      _id: id,
      isAvailable: true,
    }).populate('restaurant', 'name address isApproved isActive');

    if (
      !foodItem ||
      !foodItem.restaurant?.isApproved ||
      !foodItem.restaurant?.isActive
    ) {
      return sendErrorResponse(res, 404, 'Food item not found');
    }

    sendSuccessResponse(res, 200, 'Food item fetched successfully', {
      foodItem,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid food item id');
    }

    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Create a restaurant profile first');
    }

    const updates = { ...req.body };

    // Owners cannot move a food item to another restaurant.
    delete updates.restaurant;

    const foodItem = await FoodItem.findOneAndUpdate(
      {
        _id: id,
        restaurant: restaurant._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!foodItem) {
      return sendErrorResponse(res, 404, 'Food item not found');
    }

    sendSuccessResponse(res, 200, 'Food item updated successfully', {
      foodItem,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid food item id');
    }

    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Create a restaurant profile first');
    }

    const foodItem = await FoodItem.findOneAndDelete({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!foodItem) {
      return sendErrorResponse(res, 404, 'Food item not found');
    }

    sendSuccessResponse(res, 200, 'Food item deleted successfully', {
      foodItem,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};

export const toggleFoodAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid food item id');
    }

    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Create a restaurant profile first');
    }

    const foodItem = await FoodItem.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!foodItem) {
      return sendErrorResponse(res, 404, 'Food item not found');
    }

    foodItem.isAvailable = !foodItem.isAvailable;
    await foodItem.save();

    sendSuccessResponse(res, 200, 'Food availability updated successfully', {
      foodItem,
    });
  } catch (error) {
    handleFoodError(res, error);
  }
};
