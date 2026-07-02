import { io } from 'socket.io-client';

let socket;
const registeredListeners = new Map();

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export const connectSocket = ({ token, user }) => {
  if (!token) {
    return null;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(getSocketUrl(), {
    auth: {
      token,
      user,
    },
    transports: ['websocket', 'polling'],
  });

  registeredListeners.forEach((callbacks, eventName) => {
    callbacks.forEach((callback) => socket.on(eventName, callback));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};

export const onSocketEvent = (eventName, callback) => {
  if (!registeredListeners.has(eventName)) {
    registeredListeners.set(eventName, new Set());
  }

  registeredListeners.get(eventName).add(callback);
  socket?.on(eventName, callback);
};

export const offSocketEvent = (eventName, callback) => {
  registeredListeners.get(eventName)?.delete(callback);
  socket?.off(eventName, callback);
};
