import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminOverview from '../../components/admin/AdminOverview';
import AdminRestaurantsPanel from '../../components/admin/AdminRestaurantsPanel';
import AdminUsersPanel from '../../components/admin/AdminUsersPanel';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import { getAllOrdersForAdmin } from '../../services/orderService';
import {
  offSocketEvent,
  onSocketEvent,
} from '../../services/socketService';

const statusOptions = [
  'all',
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const statusClasses = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-stone-50 text-[#FF4F2E]',
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

function AdminOrderCard({ order }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const address = order.deliveryAddress;

  return (
    <article className="fh-card p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Order #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.restaurant?.name || 'Restaurant not available'}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[order.status] || 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {order.status}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {formatPaymentStatus(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-zinc-700 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="font-semibold text-zinc-900">Customer</p>
          <p>{order.customer?.name || 'Not available'}</p>
          <p>{order.customer?.email || 'Email not available'}</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Delivery area</p>
          <p>
            {[address?.city, address?.postalCode].filter(Boolean).join(', ') ||
              'Not provided'}
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Payment</p>
          <p>{formatPaymentMethod(order.paymentMethod)}</p>
          <p>{formatPaymentStatus(order.paymentStatus)}</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Items</p>
          <p>{order.items?.length || 0} item types</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-zinc-700 md:grid-cols-3">
        <p>Subtotal: {formatCurrency(order.subtotal)}</p>
        <p>Delivery fee: {formatCurrency(order.deliveryFee)}</p>
        <p className="font-bold text-zinc-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <button
        className="mt-5 rounded-md border border-stone-200 px-4 py-2 font-semibold text-[#FF4F2E] hover:bg-stone-50"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        type="button"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-5 rounded-xl bg-stone-50 p-5">
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-zinc-900">Full delivery address</p>
              <p className="mt-1 leading-6 text-zinc-700">
                {address?.fullName}
                <br />
                {address?.phone}
                <br />
                {[address?.street, address?.postalCode, address?.city, address?.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900">IDs</p>
              <p className="mt-1 break-all text-zinc-700">Order: {order._id}</p>
              <p className="break-all text-zinc-700">
                Restaurant: {order.restaurant?._id || order.restaurant}
              </p>
              <p className="break-all text-zinc-700">
                Customer: {order.customer?._id || order.customer}
              </p>
            </div>
          </div>

          {order.orderNote && (
            <p className="rounded-lg bg-white p-4 text-sm text-zinc-700">
              Note: {order.orderNote}
            </p>
          )}

          <div>
            <p className="font-semibold text-zinc-900">Items</p>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
                <div
                  className="rounded-lg bg-white p-4 text-sm"
                  key={`${order._id}-${item.foodItem}-${item.name}`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-zinc-600">{item.category}</p>
                    </div>
                    <p className="text-zinc-700">
                      {item.quantity} x {formatCurrency(item.price)} ={' '}
                      <span className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    restaurantId: '',
    customerId: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  const buildParams = (nextFilters) => {
    const params = {};

    if (nextFilters.status !== 'all') {
      params.status = nextFilters.status;
    }

    if (nextFilters.restaurantId.trim()) {
      params.restaurantId = nextFilters.restaurantId.trim();
    }

    if (nextFilters.customerId.trim()) {
      params.customerId = nextFilters.customerId.trim();
    }

    return params;
  };

  const loadOrders = async (nextFilters = filters) => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getAllOrdersForAdmin(buildParams(nextFilters));
      setOrders(response.data.orders || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const handleOrderUpdate = () => {
      loadOrders(filters);
    };

    onSocketEvent('admin_new_order', handleOrderUpdate);
    onSocketEvent('admin_order_updated', handleOrderUpdate);

    return () => {
      offSocketEvent('admin_new_order', handleOrderUpdate);
      offSocketEvent('admin_order_updated', handleOrderUpdate);
    };
  }, [filters.status, filters.restaurantId, filters.customerId]);

  const handleFilterChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    loadOrders(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      status: 'all',
      restaurantId: '',
      customerId: '',
    };

    setFilters(emptyFilters);
    loadOrders(emptyFilters);
  };

  const pageTitles = {
    overview: 'Overview',
    restaurants: 'Restaurant Management',
    orders: 'Order Overview',
    users: 'User Management',
    settings: 'Settings',
  };
  const navigationItems = [
    ['overview', 'Overview'],
    ['restaurants', 'Restaurants'],
    ['orders', 'Orders'],
    ['users', 'Users'],
    ['settings', 'Settings'],
  ];

  const selectSection = (section) => {
    setActiveTab(section);
    setIsSidebarOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-zinc-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div>
          <p className="text-lg font-black text-[#FF4F2E]">FoodHub Admin</p>
          <p className="text-xs font-medium text-zinc-500">
            {pageTitles[activeTab]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            aria-expanded={isSidebarOpen}
            aria-label="Open admin menu"
            className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-[#FF4F2E] hover:bg-stone-50"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            Menu
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <button
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-zinc-950/35 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200 bg-white p-5 shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-sm ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-start justify-between border-b border-stone-200 pb-5">
            <div>
              <p className="text-xl font-black text-[#FF4F2E]">FoodHub Admin</p>
              <p className="mt-1 text-sm text-zinc-500">Admin Panel</p>
            </div>
            <button
              aria-label="Close admin menu"
              className="rounded-md px-2 py-1 text-xl text-zinc-500 hover:bg-stone-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <nav aria-label="Admin sections" className="mt-6 space-y-2">
            {navigationItems.map(([tabId, label]) => (
              <button
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                  activeTab === tabId
                    ? 'bg-[#FF4F2E] text-white shadow-sm'
                    : 'text-zinc-700 hover:bg-stone-50 hover:text-[#FF4F2E]'
                }`}
                key={tabId}
                onClick={() => selectSection(tabId)}
                type="button"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-stone-200 pt-5">
            <p className="truncate text-sm font-semibold text-zinc-800">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-zinc-500">Administrator</p>
            <button
              className="mt-4 w-full rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <header className="fh-card hidden items-center justify-between gap-4 p-7 lg:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl font-black">{pageTitles[activeTab]}</h1>
            <p className="mt-2 text-zinc-700">
              Signed in as {user?.name || 'Admin'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
              <p className="text-xs text-zinc-500">Administrator</p>
            </div>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <AdminOverview onSelectTab={selectSection} />
        ) : activeTab === 'restaurants' ? (
          <AdminRestaurantsPanel />
        ) : activeTab === 'users' ? (
          <AdminUsersPanel currentUserId={user?.id || user?._id} />
        ) : activeTab === 'settings' ? (
          <section className="fh-card p-7">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="mt-2 text-zinc-600">
              Platform settings will be added later.
            </p>
          </section>
        ) : (
          <>
            <form
              className="fh-card grid gap-3 p-5 lg:grid-cols-[180px_1fr_1fr_auto_auto]"
              onSubmit={handleApplyFilters}
            >
              <select
                className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
                name="status"
                onChange={handleFilterChange}
                value={filters.status}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
                name="restaurantId"
                onChange={handleFilterChange}
                placeholder="Filter by restaurant ID"
                value={filters.restaurantId}
              />
              <input
                className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
                name="customerId"
                onChange={handleFilterChange}
                placeholder="Filter by customer ID"
                value={filters.customerId}
              />
              <button
                className="fh-btn-primary"
                type="submit"
              >
                Apply Filters
              </button>
              <button
                className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </form>

            {isLoading && (
              <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
                Loading orders...
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
                {error}
              </p>
            )}

            {!isLoading && !error && orders.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
                No orders found.
              </p>
            )}

            {!isLoading && !error && orders.length > 0 && (
              <div className="space-y-5">
                {orders.map((order) => (
                  <AdminOrderCard key={order._id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
