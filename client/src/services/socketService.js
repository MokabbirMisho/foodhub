import { io } from "socket.io-client";

let socket = null;

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

export const connectSocket = ({ token, user }) => {
  if (!token || !user) {
    return null;
  }

  if (socket && (socket.connected || socket.connecting || socket.active)) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  const socketUrl = getSocketUrl();

  socket = io(socketUrl, {
    auth: { token },
    withCredentials: true,
    transports: ["polling", "websocket"],
  });

  socket.on("connect", () => {
    // console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connect error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onSocketEvent = (eventName, callback) => {
  if (!socket) return;
  socket.on(eventName, callback);
};

export const offSocketEvent = (eventName, callback) => {
  if (!socket) return;
  socket.off(eventName, callback);
};
