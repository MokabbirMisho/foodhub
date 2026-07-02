import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import { useAuth } from '../../hooks/useAuth';
import {
  acceptDelivery,
  getAvailableDeliveriesForRider,
  getMyDeliveriesForRider,
  markDeliveryAsDelivered,
  updateRiderLocation,
} from '../../services/orderService';
import {
  offSocketEvent,
  onSocketEvent,
} from '../../services/socketService';

const DeliveryMap = lazy(() => import('../../components/map/DeliveryMap'));

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
const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

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
    <article className="fh-card p-6">
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
          <p className="mt-2 text-sm text-slate-700">
            Customer: {order.customer?.name || deliveryAddress?.fullName}
          </p>
          <p className="text-sm text-slate-700">
            Phone: {order.customer?.phone || deliveryAddress?.phone || 'Not provided'}
          </p>
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
            className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"
            key={`${order._id}-${item.foodItem || item.name}`}
          >
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>{formatPaymentMethod(order.paymentMethod)}</p>
        <p>Payment: {formatPaymentStatus(order.paymentStatus)}</p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <p className="mt-4 text-sm font-semibold text-indigo-700">
        {order.deliveryLocation ? 'Map location available' : 'Address only'}
      </p>

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

function MyDeliveryCard({
  isHighlighted,
  isUpdatingLocation,
  onMarkDelivered,
  onUpdateLocation,
  order,
}) {
  const restaurantAddress = order.restaurant?.address;
  const deliveryAddress = order.deliveryAddress;

  return (
    <article
      className={`fh-card p-6 ${
        isHighlighted ? 'ring-2 ring-orange-500' : ''
      }`}
    >
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
          <p className="mt-2 text-sm text-slate-700">
            Customer: {order.customer?.name || deliveryAddress?.fullName}
          </p>
          <p className="text-sm text-slate-700">
            Phone: {order.customer?.phone || deliveryAddress?.phone || 'Not provided'}
          </p>
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
        <p>Payment: {formatPaymentMethod(order.paymentMethod)}</p>
        <p>Payment status: {formatPaymentStatus(order.paymentStatus)}</p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      {(order.deliveryLocation || order.riderLocation) && (
        <div className="mt-5">
          <Suspense
            fallback={<p className="text-sm text-slate-600">Loading map...</p>}
          >
            <DeliveryMap
              deliveryLocation={order.deliveryLocation}
              height="300px"
              riderLocation={order.riderLocation}
            />
          </Suspense>
        </div>
      )}

      {order.riderLocation?.updatedAt && (
        <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
          Location last updated:{' '}
          {new Date(order.riderLocation.updatedAt).toLocaleString()}
        </p>
      )}

      {order.status === 'out_for_delivery' && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
            disabled={isUpdatingLocation}
            onClick={() => onUpdateLocation(order._id)}
            type="button"
          >
            {isUpdatingLocation ? 'Updating location...' : 'Update My Location'}
          </button>
          <button
            className="rounded-md border border-green-200 px-4 py-2 font-semibold text-green-700 hover:bg-green-50"
            onClick={() => onMarkDelivered(order._id)}
            type="button"
          >
            Mark as Delivered
          </button>
        </div>
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
  const [updatingLocationOrderId, setUpdatingLocationOrderId] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
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

  useEffect(() => {
    const handleDeliveryAvailable = () => {
      loadAvailableDeliveries();
    };

    onSocketEvent('delivery_available', handleDeliveryAvailable);
    return () =>
      offSocketEvent('delivery_available', handleDeliveryAvailable);
  }, []);

  const handleAcceptDelivery = async (orderId) => {
    try {
      setSuccessMessage('');
      setAvailableError('');
      await acceptDelivery(orderId);
      setAvailableDeliveries((currentDeliveries) =>
        currentDeliveries.filter((order) => order._id !== orderId),
      );
      setActiveTab('mine');
      setHighlightedOrderId(orderId);
      setUpdatingLocationOrderId(orderId);

      let locationMessage = 'Delivery accepted successfully';

      try {
        if (!navigator.geolocation) {
          throw new Error('LOCATION_UNAVAILABLE');
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        await updateRiderLocation(orderId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        locationMessage = 'Delivery accepted and your location was updated';
      } catch (locationError) {
        locationMessage =
          locationError.code === locationError.PERMISSION_DENIED
            ? 'Delivery accepted. Location permission denied. You can update location manually.'
            : 'Delivery accepted. You can update your location manually.';
      } finally {
        setUpdatingLocationOrderId(null);
      }

      setSuccessMessage(locationMessage);
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

  const handleUpdateLocation = (orderId) => {
    setSuccessMessage('');
    setMyDeliveriesError('');

    if (!navigator.geolocation) {
      setMyDeliveriesError('Location is not supported by this browser.');
      return;
    }

    setUpdatingLocationOrderId(orderId);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await updateRiderLocation(orderId, {
            lat: coords.latitude,
            lng: coords.longitude,
          });
          const riderLocation = response.data.riderLocation;

          setMyDeliveries((currentDeliveries) =>
            currentDeliveries.map((order) =>
              order._id === orderId ? { ...order, riderLocation } : order,
            ),
          );
          setSuccessMessage('Location updated successfully');
        } catch (error) {
          setMyDeliveriesError(error.message);
        } finally {
          setUpdatingLocationOrderId(null);
        }
      },
      (geolocationError) => {
        setUpdatingLocationOrderId(null);
        setMyDeliveriesError(
          geolocationError.code === geolocationError.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access.'
            : 'Unable to get your location. Please try again.',
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleFilterChange = (event) => {
    const nextStatus = event.target.value;
    setDeliveryStatusFilter(nextStatus);
    loadMyDeliveries(nextStatus);
  };

  return (
    <main className="fh-page">
      <section className="fh-container space-y-6">
        <header className="fh-card flex flex-col gap-4 p-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Rider Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-black">Delivery Workspace</h1>
            <p className="mt-2 text-slate-700">
              Signed in as {user?.name || 'Rider'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NotificationBell />
            <button
              className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <nav className="fh-card grid gap-3 p-3 md:w-fit md:grid-cols-2">
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
            {availableDeliveries.length > 0 && (
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-orange-700">
                {availableDeliveries.length}
              </span>
            )}
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
            <div className="fh-card p-6">
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
            <div className="fh-card flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
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
                    isHighlighted={highlightedOrderId === order._id}
                    isUpdatingLocation={updatingLocationOrderId === order._id}
                    key={order._id}
                    onMarkDelivered={handleMarkDelivered}
                    onUpdateLocation={handleUpdateLocation}
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
