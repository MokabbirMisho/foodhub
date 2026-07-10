import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Review from '../models/Review.js';

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

const handleReviewError = (res, error) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  if (error.code === 11000) {
    return sendErrorResponse(res, 400, 'This order has already been reviewed');
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(', ');

    return sendErrorResponse(res, 400, message);
  }

  return sendErrorResponse(res, 500, 'Server error');
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidRating = (rating) => {
  const numericRating = Number(rating);
  return numericRating >= 1 && numericRating <= 5;
};

export const updateRestaurantRatingStats = async (restaurantId) => {
  const stats = await Review.aggregate([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
    {
      $group: {
        _id: '$restaurant',
        ratingAverage: { $avg: '$rating' },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  if (!stats.length) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      ratingAverage: 0,
      ratingCount: 0,
    });
    return;
  }

  await Restaurant.findByIdAndUpdate(restaurantId, {
    ratingAverage: Math.round(stats[0].ratingAverage * 10) / 10,
    ratingCount: stats[0].ratingCount,
  });
};

export const createReview = async (req, res) => {
  try {
    const { comment = '', orderId, rating } = req.body;

    if (!orderId || !isValidObjectId(orderId)) {
      return sendErrorResponse(res, 400, 'Valid order id is required');
    }

    if (!isValidRating(rating)) {
      return sendErrorResponse(res, 400, 'Rating must be between 1 and 5');
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (String(order.customer) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You can review only your own orders');
    }

    if (order.status !== 'delivered') {
      return sendErrorResponse(res, 400, 'Only delivered orders can be reviewed');
    }

    const existingReview = await Review.findOne({ order: order._id });

    if (existingReview) {
      return sendErrorResponse(res, 400, 'This order has already been reviewed');
    }

    const review = await Review.create({
      customer: req.user._id,
      restaurant: order.restaurant,
      order: order._id,
      rating: Number(rating),
      comment,
    });

    await updateRestaurantRatingStats(order.restaurant);

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'name avatar')
      .populate('restaurant', 'name');

    sendSuccessResponse(res, 201, 'Review created successfully', {
      review: populatedReview,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { rating } = req.query;

    if (!isValidObjectId(restaurantId)) {
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

    const filters = { restaurant: restaurantId };

    if (rating) {
      if (!isValidRating(rating)) {
        return sendErrorResponse(res, 400, 'Rating filter must be between 1 and 5');
      }

      filters.rating = Number(rating);
    }

    const reviews = await Review.find(filters)
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Restaurant reviews fetched successfully', {
      reviews,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate('restaurant', 'name logo coverImage')
      .populate('order', 'status totalAmount createdAt')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'My reviews fetched successfully', {
      reviews,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const updateMyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    if (!isValidObjectId(id)) {
      return sendErrorResponse(res, 400, 'Invalid review id');
    }

    const review = await Review.findById(id);

    if (!review) {
      return sendErrorResponse(res, 404, 'Review not found');
    }

    if (String(review.customer) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You can update only your own review');
    }

    if (rating !== undefined) {
      if (!isValidRating(rating)) {
        return sendErrorResponse(res, 400, 'Rating must be between 1 and 5');
      }

      review.rating = Number(rating);
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();
    await updateRestaurantRatingStats(review.restaurant);

    const updatedReview = await Review.findById(review._id)
      .populate('customer', 'name avatar')
      .populate('restaurant', 'name');

    sendSuccessResponse(res, 200, 'Review updated successfully', {
      review: updatedReview,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const deleteMyReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendErrorResponse(res, 400, 'Invalid review id');
    }

    const review = await Review.findById(id);

    if (!review) {
      return sendErrorResponse(res, 404, 'Review not found');
    }

    if (String(review.customer) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You can delete only your own review');
    }

    const restaurantId = review.restaurant;
    await review.deleteOne();
    await updateRestaurantRatingStats(restaurantId);

    sendSuccessResponse(res, 200, 'Review deleted successfully', null);
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const getAllReviewsForAdmin = async (req, res) => {
  try {
    const { customerId, rating, restaurantId } = req.query;
    const filters = {};

    if (restaurantId) {
      if (!isValidObjectId(restaurantId)) {
        return sendErrorResponse(res, 400, 'Invalid restaurant id');
      }

      filters.restaurant = restaurantId;
    }

    if (customerId) {
      if (!isValidObjectId(customerId)) {
        return sendErrorResponse(res, 400, 'Invalid customer id');
      }

      filters.customer = customerId;
    }

    if (rating) {
      if (!isValidRating(rating)) {
        return sendErrorResponse(res, 400, 'Rating filter must be between 1 and 5');
      }

      filters.rating = Number(rating);
    }

    const reviews = await Review.find(filters)
      .populate('customer', 'name email role')
      .populate('restaurant', 'name')
      .populate('order', 'status totalAmount createdAt')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Admin reviews fetched successfully', {
      reviews,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const getMyRestaurantReviews = async (req, res) => {
  try {
    const { rating, replied, search } = req.query;

    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant profile not found');
    }

    const filters = { restaurant: restaurant._id };

    if (rating) {
      if (!isValidRating(rating)) {
        return sendErrorResponse(res, 400, 'Rating filter must be between 1 and 5');
      }

      filters.rating = Number(rating);
    }

    if (replied === 'true') {
      filters['ownerReply.message'] = { $exists: true, $ne: '' };
    }

    if (replied === 'false') {
      filters.$or = [
        { 'ownerReply.message': { $exists: false } },
        { 'ownerReply.message': '' },
      ];
    }

    if (search?.trim()) {
      filters.comment = { $regex: search.trim(), $options: 'i' };
    }

    const reviews = await Review.find(filters)
      .populate('customer', 'name email avatar')
      .populate('order', 'status totalAmount createdAt')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Reviews fetched successfully', {
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { message = '' } = req.body;
    const trimmedMessage = message.trim();

    if (!isValidObjectId(reviewId)) {
      return sendErrorResponse(res, 400, 'Invalid review id');
    }

    if (!trimmedMessage) {
      return sendErrorResponse(res, 400, 'Reply message is required');
    }

    if (trimmedMessage.length > 500) {
      return sendErrorResponse(res, 400, 'Reply message cannot exceed 500 characters');
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant profile not found');
    }

    const review = await Review.findOne({
      _id: reviewId,
      restaurant: restaurant._id,
    });

    if (!review) {
      return sendErrorResponse(res, 404, 'Review not found');
    }

    review.ownerReply = {
      message: trimmedMessage,
      repliedAt: new Date(),
    };

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('customer', 'name email avatar')
      .populate('order', 'status totalAmount createdAt');

    sendSuccessResponse(res, 200, 'Reply saved successfully', {
      review: updatedReview,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};

export const deleteOwnerReply = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!isValidObjectId(reviewId)) {
      return sendErrorResponse(res, 400, 'Invalid review id');
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant profile not found');
    }

    const review = await Review.findOne({
      _id: reviewId,
      restaurant: restaurant._id,
    });

    if (!review) {
      return sendErrorResponse(res, 404, 'Review not found');
    }

    review.ownerReply = {
      message: '',
      repliedAt: undefined,
    };

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate('customer', 'name email avatar')
      .populate('order', 'status totalAmount createdAt');

    sendSuccessResponse(res, 200, 'Reply removed successfully', {
      review: updatedReview,
    });
  } catch (error) {
    handleReviewError(res, error);
  }
};
