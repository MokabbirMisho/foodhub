import mongoose from 'mongoose';
import Restaurant from '../models/Restaurant.js';

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
      restaurant,
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
    const { city, cuisine, search } = req.query;

    const filters = {
      isApproved: true,
      isActive: true,
    };

    if (city) {
      filters['address.city'] = new RegExp(city, 'i');
    }

    if (cuisine) {
      filters.cuisineTypes = new RegExp(cuisine, 'i');
    }

    if (search) {
      filters.name = new RegExp(search, 'i');
    }

    const restaurants = await Restaurant.find(filters).sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Restaurants fetched successfully', {
      restaurants,
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
      restaurant,
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
