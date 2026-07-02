import mongoose from 'mongoose';
import User from '../models/User.js';

const allowedRoles = ['customer', 'restaurant_owner', 'rider', 'admin'];
const allowedStatuses = ['active', 'blocked'];

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
      User.find(filters).select('-password').sort({ createdAt: -1 }),
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

    const user = await User.findById(id).select('-password');

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

    const updatedUser = await User.findById(user._id).select('-password');

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
