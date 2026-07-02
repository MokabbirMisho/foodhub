import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  connectSocket,
  disconnectSocket,
  offSocketEvent,
  onSocketEvent,
} from '../services/socketService';

const NotificationContext = createContext(null);

const eventTitles = {
  new_order: 'New Order',
  delivery_available: 'New Delivery',
  order_status_updated: 'Order Update',
  order_created: 'Order Placed',
  admin_new_order: 'New Platform Order',
  admin_order_updated: 'Order Updated',
};

const socketEvents = Object.keys(eventTitles);

const createNotificationId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);

  const addNotification = useCallback((notification) => {
    const nextNotification = {
      id: notification.id || createNotificationId(),
      type: notification.type || 'info',
      title: notification.title || 'FoodHub Update',
      message: notification.message || 'You have a new update.',
      createdAt: notification.createdAt || new Date().toISOString(),
      orderId: notification.orderId,
      read: false,
    };

    setNotifications((current) => [nextNotification, ...current].slice(0, 30));
    setToast(nextNotification);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setToast(null);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      disconnectSocket();
      clearNotifications();
      return undefined;
    }

    connectSocket({ token, user });
    const listeners = socketEvents.map((eventName) => {
      const listener = (payload = {}) => {
        addNotification({
          ...payload,
          type: eventName,
          title: eventTitles[eventName],
        });
      };

      onSocketEvent(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        offSocketEvent(eventName, listener);
      });
      disconnectSocket();
    };
  }, [addNotification, clearNotifications, token, user]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
      clearNotifications,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAllAsRead,
      clearNotifications,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed right-4 top-20 z-50 max-w-sm rounded-lg border border-orange-200 bg-white p-4 shadow-lg">
          <p className="font-bold text-slate-900">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
};
