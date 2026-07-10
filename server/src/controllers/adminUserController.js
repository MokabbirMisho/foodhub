import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';

const allowedRoles = ['customer', 'restaurant_owner', 'rider', 'admin'];
const allowedStatuses = ['active', 'blocked'];
const adminUserFields =
  'name email role phone avatar authProvider isBlocked createdAt updatedAt';

const sendErrorResponse = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getAllUsersForAdmin = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const filters = {};

    if (role) {
      if (!allowedRoles.includes(role)) {
        return sendErrorResponse(res, 400, 'Invalid user role');
      }

      filters.role = role;
    }

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return sendErrorResponse(res, 400, 'Invalid user status');
      }

      filters.isBlocked = status === 'blocked';
    }

    if (search?.trim()) {
      const searchPattern = new RegExp(escapeRegExp(search.trim()), 'i');
      filters.$or = [{ name: searchPattern }, { email: searchPattern }];
    }

    const [users, total] = await Promise.all([
      User.find(filters).select(adminUserFields).sort({ createdAt: -1 }),
      User.countDocuments(filters),
    ]);

    res.json({
      success: true,
      message: 'Users fetched successfully',
      data: {
        users,
        total,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 500, 'Server error');
  }
};

export const getUserByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid user id');
    }

    const user = await User.findById(id).select(adminUserFields);

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    res.json({
      success: true,
      message: 'User fetched successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 500, 'Server error');
  }
};

export const toggleUserBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendErrorResponse(res, 400, 'Invalid user id');
    }

    if (String(id) === String(req.user._id)) {
      return sendErrorResponse(res, 400, 'You cannot block your own account');
    }

    const user = await User.findById(id);

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    user.isBlocked =
      typeof req.body.isBlocked === 'boolean'
        ? req.body.isBlocked
        : !user.isBlocked;
    await user.save();

    const updatedUser = await User.findById(user._id).select(adminUserFields);

    res.json({
      success: true,
      message: updatedUser.isBlocked
        ? 'User blocked successfully'
        : 'User unblocked successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 500, 'Server error');
  }
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export const getRiderDetailsForAdmin = async (req, res) => {
  try {
    const { riderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(riderId)) {
      return sendErrorResponse(res, 400, 'Invalid rider id');
    }

    const rider = await User.findOne({ _id: riderId, role: 'rider' }).select(
      adminUserFields,
    );

    if (!rider) {
      return sendErrorResponse(res, 404, 'Rider not found');
    }

    const orders = await Order.find({ rider: rider._id })
      .populate('restaurant', 'name email phone address')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    const activeOrders = orders.filter(
      (order) => order.status === 'out_for_delivery',
    );
    const completedOrders = orders.filter((order) => order.status === 'delivered');
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled');
    const totalDeliveredValue = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    res.json({
      success: true,
      message: 'Rider details fetched successfully',
      data: {
        rider,
        summary: {
          totalDeliveries: orders.length,
          completedDeliveries: completedOrders.length,
          activeDeliveries: activeOrders.length,
          cancelledDeliveries: cancelledOrders.length,
          totalDeliveredValue: roundMoney(totalDeliveredValue),
          averageDeliveryValue: completedOrders.length
            ? roundMoney(totalDeliveredValue / completedOrders.length)
            : 0,
          lastDeliveryAt: orders[0]?.createdAt || null,
        },
        activeOrders,
        recentOrders: orders.slice(0, 10),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    sendErrorResponse(res, 500, 'Server error');
  }
};
