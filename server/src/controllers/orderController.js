import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

const allowedRestaurantStatuses = [
  'accepted',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

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

const handleOrderError = (res, error) => {
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

const getEffectivePrice = (foodItem) => {
  if (foodItem.discountPrice !== null && foodItem.discountPrice !== undefined) {
    return Number(foodItem.discountPrice);
  }

  return Number(foodItem.price);
};

const populateOrder = (query) => {
  return query
    .populate('customer', 'name email role')
    .populate('restaurant', 'name address phone deliveryFee')
    .populate('rider', 'name email phone')
    .populate('items.foodItem', 'name category image isAvailable');
};

const getOwnedRestaurant = async (ownerId) => {
  return Restaurant.findOne({ owner: ownerId });
};

export const createOrder = async (req, res) => {
  try {
    const { deliveryAddress, items, orderNote, restaurantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return sendErrorResponse(res, 400, 'Invalid restaurant id');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return sendErrorResponse(res, 400, 'Order items are required');
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      isApproved: true,
      isActive: true,
    });

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const { foodItemId, quantity } = item;
      const orderQuantity = Number(quantity);

      if (!mongoose.Types.ObjectId.isValid(foodItemId)) {
        return sendErrorResponse(res, 400, 'Invalid food item id');
      }

      if (!orderQuantity || orderQuantity < 1) {
        return sendErrorResponse(res, 400, 'Item quantity must be at least 1');
      }

      const foodItem = await FoodItem.findById(foodItemId);

      if (!foodItem) {
        return sendErrorResponse(res, 404, 'Food item not found');
      }

      if (String(foodItem.restaurant) !== String(restaurantId)) {
        return sendErrorResponse(
          res,
          400,
          'All order items must belong to the selected restaurant',
        );
      }

      if (!foodItem.isAvailable) {
        return sendErrorResponse(res, 400, `${foodItem.name} is not available`);
      }

      const effectivePrice = getEffectivePrice(foodItem);
      subtotal += effectivePrice * orderQuantity;

      // Snapshot item details so the order stays accurate if menu data changes later.
      orderItems.push({
        foodItem: foodItem._id,
        name: foodItem.name,
        price: effectivePrice,
        quantity: orderQuantity,
        image: foodItem.image,
        category: foodItem.category,
      });
    }

    const deliveryFee = Number(restaurant.deliveryFee || 0);
    const totalAmount = subtotal + deliveryFee;

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      deliveryAddress,
      orderNote,
      subtotal,
      deliveryFee,
      totalAmount,
    });

    const populatedOrder = await populateOrder(Order.findById(order._id));

    sendSuccessResponse(res, 201, 'Order created successfully', {
      order: populatedOrder,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name address')
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Orders fetched successfully', {
      orders,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getMyRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const filters = {
      restaurant: restaurant._id,
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const orders = await Order.find(filters)
      .populate('customer', 'name email')
      .populate('rider', 'name email phone')
      .populate('items.foodItem', 'name category image')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Restaurant orders fetched successfully', {
      orders,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid order id');
    }

    const order = await populateOrder(Order.findById(id));

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (req.user.role === 'customer' && String(order.customer._id) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You do not have permission to view this order');
    }

    if (req.user.role === 'restaurant_owner') {
      const restaurant = await getOwnedRestaurant(req.user._id);

      if (!restaurant || String(order.restaurant._id) !== String(restaurant._id)) {
        return sendErrorResponse(res, 403, 'You do not have permission to view this order');
      }
    }

    if (req.user.role === 'rider' && String(order.rider?._id) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You do not have permission to view this order');
    }

    sendSuccessResponse(res, 200, 'Order fetched successfully', {
      order,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid order id');
    }

    if (!allowedRestaurantStatuses.includes(status)) {
      return sendErrorResponse(res, 400, 'Invalid order status');
    }

    const restaurant = await getOwnedRestaurant(req.user._id);

    if (!restaurant) {
      return sendErrorResponse(res, 404, 'Restaurant not found');
    }

    const order = await populateOrder(
      Order.findOneAndUpdate(
        {
          _id: id,
          restaurant: restaurant._id,
        },
        { status },
        {
          new: true,
          runValidators: true,
        },
      ),
    );

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    sendSuccessResponse(res, 200, 'Order status updated successfully', {
      order,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid order id');
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (order.status !== 'pending') {
      return sendErrorResponse(res, 400, 'Only pending orders can be cancelled');
    }

    order.status = 'cancelled';
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    sendSuccessResponse(res, 200, 'Order cancelled successfully', {
      order: populatedOrder,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getAllOrdersForAdmin = async (req, res) => {
  try {
    const { customerId, restaurantId, status } = req.query;
    const filters = {};

    if (status) {
      filters.status = status;
    }

    if (restaurantId) {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return sendErrorResponse(res, 400, 'Invalid restaurant id');
      }

      filters.restaurant = restaurantId;
    }

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return sendErrorResponse(res, 400, 'Invalid customer id');
      }

      filters.customer = customerId;
    }

    const orders = await Order.find(filters)
      .populate('customer', 'name email role')
      .populate('restaurant', 'name address')
      .populate('rider', 'name email phone')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Admin orders fetched successfully', {
      orders,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getAvailableDeliveriesForRider = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'ready',
      $or: [{ rider: null }, { rider: { $exists: false } }],
    })
      .populate('restaurant', 'name address phone')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'Available deliveries fetched successfully', {
      orders,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const getMyDeliveriesForRider = async (req, res) => {
  try {
    const filters = {
      rider: req.user._id,
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const orders = await Order.find(filters)
      .populate('restaurant', 'name address phone')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, 'My deliveries fetched successfully', {
      orders,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid order id');
    }

    const order = await Order.findById(id);

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (order.status !== 'ready') {
      return sendErrorResponse(res, 400, 'Only ready orders can be accepted');
    }

    if (order.rider) {
      return sendErrorResponse(res, 400, 'Order is already assigned to another rider');
    }

    // Assign this delivery to the logged-in rider and move it into delivery.
    order.rider = req.user._id;
    order.status = 'out_for_delivery';
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    sendSuccessResponse(res, 200, 'Delivery accepted successfully', {
      order: populatedOrder,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};

export const markDeliveryAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid order id');
    }

    const order = await Order.findById(id);

    if (!order) {
      return sendErrorResponse(res, 404, 'Order not found');
    }

    if (String(order.rider) !== String(req.user._id)) {
      return sendErrorResponse(res, 403, 'You can only update your own delivery');
    }

    if (order.status !== 'out_for_delivery') {
      return sendErrorResponse(res, 400, 'Only out for delivery orders can be marked delivered');
    }

    order.status = 'delivered';
    await order.save();

    const populatedOrder = await populateOrder(Order.findById(order._id));

    sendSuccessResponse(res, 200, 'Delivery marked as delivered successfully', {
      order: populatedOrder,
    });
  } catch (error) {
    handleOrderError(res, error);
  }
};
