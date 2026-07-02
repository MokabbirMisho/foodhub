import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';

const getNotificationLink = (notification, role) => {
  if (role === 'customer') {
    return notification.orderId
      ? `/orders/${notification.orderId}/tracking`
      : '/my-orders';
  }

  if (role === 'restaurant_owner') {
    return '/restaurant/dashboard';
  }

  if (role === 'rider') {
    return '/rider/dashboard';
  }

  return '/admin/dashboard';
};

function NotificationBell() {
  const { user } = useAuth();
  const {
    clearNotifications,
    markAllAsRead,
    notifications,
    unreadCount,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label="Open notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-orange-200 bg-white text-xl text-orange-700 hover:bg-orange-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-orange-100 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-orange-100 p-3">
            <p className="font-bold text-slate-900">Recent updates</p>
            <button
              className="text-xs font-semibold text-orange-700"
              onClick={markAllAsRead}
              type="button"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-600">No updates yet.</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  className={`block border-b border-slate-100 p-4 hover:bg-orange-50 ${
                    notification.read ? 'bg-white' : 'bg-orange-50/60'
                  }`}
                  key={notification.id}
                  onClick={() => {
                    markAllAsRead();
                    setIsOpen(false);
                  }}
                  to={getNotificationLink(notification, user.role)}
                >
                  <p className="text-sm font-bold text-slate-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </Link>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              className="w-full p-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              onClick={clearNotifications}
              type="button"
            >
              Clear notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
