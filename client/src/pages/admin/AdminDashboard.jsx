import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAllOrdersForAdmin } from '../../services/orderService';

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
  preparing: 'bg-orange-50 text-orange-700',
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
    <article className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Order #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.restaurant?.name || 'Restaurant not available'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[order.status] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {order.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {formatPaymentStatus(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="font-semibold text-slate-900">Customer</p>
          <p>{order.customer?.name || 'Not available'}</p>
          <p>{order.customer?.email || 'Email not available'}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Delivery area</p>
          <p>
            {[address?.city, address?.postalCode].filter(Boolean).join(', ') ||
              'Not provided'}
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Payment</p>
          <p>{formatPaymentMethod(order.paymentMethod)}</p>
          <p>{formatPaymentStatus(order.paymentStatus)}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Items</p>
          <p>{order.items?.length || 0} item types</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Subtotal: {formatCurrency(order.subtotal)}</p>
        <p>Delivery fee: {formatCurrency(order.deliveryFee)}</p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <button
        className="mt-5 rounded-md border border-orange-200 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        type="button"
      >
        {isExpanded ? 'Hide Details' : 'View Details'}
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-5 rounded-xl bg-orange-50 p-5">
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900">Full delivery address</p>
              <p className="mt-1 leading-6 text-slate-700">
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
              <p className="font-semibold text-slate-900">IDs</p>
              <p className="mt-1 break-all text-slate-700">Order: {order._id}</p>
              <p className="break-all text-slate-700">
                Restaurant: {order.restaurant?._id || order.restaurant}
              </p>
              <p className="break-all text-slate-700">
                Customer: {order.customer?._id || order.customer}
              </p>
            </div>
          </div>

          {order.orderNote && (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-700">
              Note: {order.orderNote}
            </p>
          )}

          <div>
            <p className="font-semibold text-slate-900">Items</p>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
                <div
                  className="rounded-lg bg-white p-4 text-sm"
                  key={`${order._id}-${item.foodItem}-${item.name}`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-slate-600">{item.category}</p>
                    </div>
                    <p className="text-slate-700">
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

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Order Overview</h1>
            <p className="mt-2 text-slate-700">
              Signed in as {user?.name || 'Admin'}
            </p>
          </div>

          <button
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </header>

        <form
          className="grid gap-3 rounded-xl bg-white p-5 shadow-sm lg:grid-cols-[180px_1fr_1fr_auto_auto]"
          onSubmit={handleApplyFilters}
        >
          <select
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
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
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="restaurantId"
            onChange={handleFilterChange}
            placeholder="Filter by restaurant ID"
            value={filters.restaurantId}
          />
          <input
            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            name="customerId"
            onChange={handleFilterChange}
            placeholder="Filter by customer ID"
            value={filters.customerId}
          />
          <button
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            type="submit"
          >
            Apply Filters
          </button>
          <button
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-orange-50"
            onClick={handleClearFilters}
            type="button"
          >
            Clear
          </button>
        </form>

        {isLoading && (
          <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
            Loading orders...
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
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
      </section>
    </main>
  );
}

export default AdminDashboard;
