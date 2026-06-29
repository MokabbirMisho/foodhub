import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  acceptDelivery,
  getAvailableDeliveriesForRider,
  getMyDeliveriesForRider,
  markDeliveryAsDelivered,
} from '../../services/orderService';

const deliveryStatusOptions = [
  'all',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const statusClasses = {
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const formatAddress = (address) => {
  if (!address) {
    return 'Address not provided';
  }

  return [address.street, address.postalCode, address.city, address.country]
    .filter(Boolean)
    .join(', ');
};

function StatusBadge({ status }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
        statusClasses[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function DeliveryAddress({ address }) {
  return (
    <p className="mt-2 text-sm leading-6 text-slate-800">
      {address?.fullName}
      <br />
      {address?.phone}
      <br />
      {formatAddress(address)}
    </p>
  );
}

function AvailableDeliveryCard({ onAccept, order }) {
  const restaurantAddress = order.restaurant?.address;
  const deliveryAddress = order.deliveryAddress;

  return (
    <article className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Order #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.restaurant?.name || 'Restaurant'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pickup
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            {order.restaurant?.phone || 'Phone not provided'}
            <br />
            {[restaurantAddress?.street, restaurantAddress?.postalCode, restaurantAddress?.city]
              .filter(Boolean)
              .join(', ') || 'Restaurant address not provided'}
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dropoff
          </p>
          <DeliveryAddress address={deliveryAddress} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Items: {order.items?.length || 0} item types</p>
        <p>
          Delivery area:{' '}
          {[deliveryAddress?.city, deliveryAddress?.postalCode].filter(Boolean).join(', ') ||
            'Not provided'}
        </p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <button
        className="mt-5 rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
        onClick={() => onAccept(order._id)}
        type="button"
      >
        Accept Delivery
      </button>
    </article>
  );
}

function MyDeliveryCard({ onMarkDelivered, order }) {
  const restaurantAddress = order.restaurant?.address;
  const deliveryAddress = order.deliveryAddress;

  return (
    <article className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Delivery #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.restaurant?.name || 'Restaurant'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Restaurant
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            {order.restaurant?.phone || 'Phone not provided'}
            <br />
            {[restaurantAddress?.street, restaurantAddress?.postalCode, restaurantAddress?.city]
              .filter(Boolean)
              .join(', ') || 'Restaurant address not provided'}
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Customer delivery address
          </p>
          <DeliveryAddress address={deliveryAddress} />
        </div>
      </div>

      {order.orderNote && (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          Note: {order.orderNote}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {order.items?.map((item) => (
          <div
            className="flex flex-col gap-2 border-b border-slate-100 pb-3 text-sm md:flex-row md:items-center md:justify-between"
            key={`${order._id}-${item.foodItem?._id || item.foodItem || item.name}`}
          >
            <div>
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-slate-600">
                Qty {item.quantity} x {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Payment: {order.paymentMethod}</p>
        <p>Payment status: {order.paymentStatus}</p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      {order.status === 'out_for_delivery' && (
        <button
          className="mt-5 rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          onClick={() => onMarkDelivered(order._id)}
          type="button"
        >
          Mark as Delivered
        </button>
      )}
    </article>
  );
}

function RiderDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('available');
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [isAvailableLoading, setIsAvailableLoading] = useState(false);
  const [isMyDeliveriesLoading, setIsMyDeliveriesLoading] = useState(false);
  const [availableError, setAvailableError] = useState('');
  const [myDeliveriesError, setMyDeliveriesError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  const loadAvailableDeliveries = async () => {
    try {
      setAvailableError('');
      setIsAvailableLoading(true);
      const response = await getAvailableDeliveriesForRider();
      setAvailableDeliveries(response.data.orders || []);
    } catch (error) {
      setAvailableError(error.message);
    } finally {
      setIsAvailableLoading(false);
    }
  };

  const loadMyDeliveries = async (status = deliveryStatusFilter) => {
    try {
      setMyDeliveriesError('');
      setIsMyDeliveriesLoading(true);
      const params = status === 'all' ? undefined : { status };
      const response = await getMyDeliveriesForRider(params);
      setMyDeliveries(response.data.orders || []);
    } catch (error) {
      setMyDeliveriesError(error.message);
    } finally {
      setIsMyDeliveriesLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableDeliveries();
    loadMyDeliveries();
  }, []);

  const handleAcceptDelivery = async (orderId) => {
    try {
      setSuccessMessage('');
      setAvailableError('');
      await acceptDelivery(orderId);
      setAvailableDeliveries((currentDeliveries) =>
        currentDeliveries.filter((order) => order._id !== orderId),
      );
      setSuccessMessage('Delivery accepted successfully');
      await loadMyDeliveries();
    } catch (error) {
      setAvailableError(error.message);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      setSuccessMessage('');
      setMyDeliveriesError('');
      const response = await markDeliveryAsDelivered(orderId);
      const updatedOrder = response.data.order;

      setMyDeliveries((currentDeliveries) =>
        currentDeliveries.map((order) =>
          order._id === orderId ? updatedOrder : order,
        ),
      );
      setSuccessMessage('Delivery marked as delivered');
    } catch (error) {
      setMyDeliveriesError(error.message);
    }
  };

  const handleFilterChange = (event) => {
    const nextStatus = event.target.value;
    setDeliveryStatusFilter(nextStatus);
    loadMyDeliveries(nextStatus);
  };

  return (
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Rider Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold">Delivery Workspace</h1>
            <p className="mt-2 text-slate-700">
              Signed in as {user?.name || 'Rider'}
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

        <nav className="grid gap-3 rounded-xl bg-white p-3 shadow-sm md:w-fit md:grid-cols-2">
          <button
            className={`rounded-lg px-4 py-3 text-sm font-semibold ${
              activeTab === 'available'
                ? 'bg-orange-600 text-white'
                : 'text-slate-700 hover:bg-orange-50'
            }`}
            onClick={() => setActiveTab('available')}
            type="button"
          >
            Available Deliveries
          </button>
          <button
            className={`rounded-lg px-4 py-3 text-sm font-semibold ${
              activeTab === 'mine'
                ? 'bg-orange-600 text-white'
                : 'text-slate-700 hover:bg-orange-50'
            }`}
            onClick={() => setActiveTab('mine')}
            type="button"
          >
            My Deliveries
          </button>
        </nav>

        {successMessage && (
          <p className="rounded-xl bg-green-50 p-4 text-green-700 shadow-sm">
            {successMessage}
          </p>
        )}

        {activeTab === 'available' && (
          <section className="space-y-5">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Available Deliveries</h2>
              <p className="mt-2 text-slate-700">
                Ready orders without an assigned rider appear here.
              </p>
            </div>

            {isAvailableLoading && (
              <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                Loading available deliveries...
              </p>
            )}

            {availableError && (
              <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
                {availableError}
              </p>
            )}

            {!isAvailableLoading && !availableError && availableDeliveries.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                No available deliveries right now.
              </p>
            )}

            {!isAvailableLoading && !availableError && availableDeliveries.length > 0 && (
              <div className="grid gap-5 xl:grid-cols-2">
                {availableDeliveries.map((order) => (
                  <AvailableDeliveryCard
                    key={order._id}
                    onAccept={handleAcceptDelivery}
                    order={order}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'mine' && (
          <section className="space-y-5">
            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Deliveries</h2>
                <p className="mt-2 text-slate-700">
                  Track deliveries you accepted and mark them delivered.
                </p>
              </div>

              <label className="block w-full md:w-56">
                <span className="text-sm font-medium text-slate-700">
                  Filter by status
                </span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                  onChange={handleFilterChange}
                  value={deliveryStatusFilter}
                >
                  {deliveryStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isMyDeliveriesLoading && (
              <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                Loading your deliveries...
              </p>
            )}

            {myDeliveriesError && (
              <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
                {myDeliveriesError}
              </p>
            )}

            {!isMyDeliveriesLoading && !myDeliveriesError && myDeliveries.length === 0 && (
              <p className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                You have no deliveries yet.
              </p>
            )}

            {!isMyDeliveriesLoading && !myDeliveriesError && myDeliveries.length > 0 && (
              <div className="space-y-5">
                {myDeliveries.map((order) => (
                  <MyDeliveryCard
                    key={order._id}
                    onMarkDelivered={handleMarkDelivered}
                    order={order}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default RiderDashboard;
