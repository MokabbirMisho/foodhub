import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import User from '../models/User.js';
import { getAllowedOrigins } from '../config/corsOptions.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || !process.env.JWT_SECRET) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select(
        'name email role isBlocked',
      );

      if (!user || user.isBlocked) {
        return next(new Error('Authentication failed'));
      }

      socket.user = {
        id: String(user._id),
        name: user.name,
        role: user.role,
      };
      next();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Socket authentication failed');
      }
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;

    socket.join(`user:${id}`);

    if (role === 'restaurant_owner') {
      socket.join(`restaurant_owner:${id}`);
    }

    if (role === 'rider') {
      socket.join('riders');
    }

    if (role === 'admin') {
      socket.join('admin');
    }
  });

  return io;
};

export const getIO = () => io;

const emitToRoom = (room, eventName, payload) => {
  if (!io) {
    return false;
  }

  io.to(room).emit(eventName, payload);
  return true;
};

export const emitToUser = (userId, eventName, payload) =>
  emitToRoom(`user:${userId}`, eventName, payload);

export const emitToRestaurantOwner = (ownerId, eventName, payload) =>
  emitToRoom(`restaurant_owner:${ownerId}`, eventName, payload);

export const emitToRiders = (eventName, payload) =>
  emitToRoom('riders', eventName, payload);

export const emitToAdmin = (eventName, payload) =>
  emitToRoom('admin', eventName, payload);
