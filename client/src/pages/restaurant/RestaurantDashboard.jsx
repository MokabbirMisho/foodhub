import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import FoodItemForm from '../../components/restaurant/FoodItemForm';
import RestaurantForm from '../../components/restaurant/RestaurantForm';
import { useAuth } from '../../hooks/useAuth';
import {
  createFoodItem,
  deleteFoodItem,
  getMyRestaurantFoodItems,
  toggleFoodAvailability,
  updateFoodItem,
} from '../../services/foodService';
import {
  getMyRestaurantOrders,
  updateOrderStatus,
} from '../../services/orderService';
import {
  createRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
} from '../../services/restaurantService';
import {
  offSocketEvent,
  onSocketEvent,
} from '../../services/socketService';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Restaurant Profile' },
  { id: 'menu', label: 'Menu Items' },
  { id: 'orders', label: 'Orders' },
  { id: 'settings', label: 'Settings' },
];

const orderStatusOptions = [
  'accepted',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

const statusFilterOptions = [
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

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg bg-orange-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-slate-900">{value || 'Not provided'}</p>
    </div>
  );
}

function OverviewCard({ label, value, tone = 'default' }) {
  const toneClasses =
    tone === 'warning'
      ? 'border-orange-200 bg-orange-50 text-orange-900'
      : 'border-slate-200 bg-white text-slate-900';

  return (
    <article className={`rounded-lg border p-5 shadow-sm ${toneClasses}`}>
      <p className="text-sm font-semibold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </article>
  );
}

function PlaceholderCard({ message }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
        Coming Soon
      </p>
      <h2 className="mt-2 text-2xl font-bold">{message}</h2>
    </section>
  );
}

function FoodItemCard({ foodItem, onDelete, onEdit, onToggleAvailability }) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      {foodItem.image ? (
        <img
          alt={foodItem.name}
          className="h-44 w-full object-cover"
          src={foodItem.image}
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-orange-50 text-sm font-semibold text-orange-700">
          No food image
        </div>
      )}
      <div className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            {foodItem.category}
          </p>
          <h3 className="mt-1 text-2xl font-bold">{foodItem.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {foodItem.description || 'No description provided.'}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            foodItem.isAvailable
              ? 'bg-green-50 text-green-700'
              : 'bg-orange-50 text-slate-600'
          }`}
        >
          {foodItem.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <p>Price: {formatCurrency(foodItem.price)}</p>
        <p>
          Discount:{' '}
          {foodItem.discountPrice !== null
            ? formatCurrency(foodItem.discountPrice)
            : 'None'}
        </p>
        <p>Preparation: {foodItem.preparationTime || 20} min</p>
        <p>{foodItem.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}</p>
      </div>

      {foodItem.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {foodItem.tags.map((tag) => (
            <span
              className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          onClick={() => onEdit(foodItem)}
          type="button"
        >
          Edit
        </button>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50"
          onClick={() => onToggleAvailability(foodItem._id)}
          type="button"
        >
          {foodItem.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        </button>
        <button
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          onClick={() => onDelete(foodItem._id)}
          type="button"
        >
          Delete
        </button>
      </div>
      </div>
    </article>
  );
}

function OrderCard({ onStatusChange, order }) {
  const address = order.deliveryAddress;

  return (
    <article className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Order #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.customer?.name || address?.fullName || 'Customer'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {order.customer?.email || 'Email not provided'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[order.status] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Delivery address
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-800">
            {address?.fullName}
            <br />
            {address?.phone}
            <br />
            {[address?.street, address?.postalCode, address?.city, address?.country]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment
          </p>
          <p className="mt-2 text-sm text-slate-800">
            Method: {formatPaymentMethod(order.paymentMethod)}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            Status: {formatPaymentStatus(order.paymentStatus)}
          </p>
        </div>
      </div>

      {order.orderNote && (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          Note: {order.orderNote}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {order.items.map((item) => (
          <div
            className="flex flex-col gap-2 border-b border-slate-100 pb-3 text-sm md:flex-row md:items-center md:justify-between"
            key={`${order._id}-${item.foodItem?._id || item.name}`}
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
        <p>Subtotal: {formatCurrency(order.subtotal)}</p>
        <p>Delivery fee: {formatCurrency(order.deliveryFee)}</p>
        <p className="font-bold text-slate-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <div className="mt-5">
        <label className="block max-w-xs">
          <span className="text-sm font-medium text-slate-700">Update status</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
            onChange={(event) => onStatusChange(order._id, event.target.value)}
            value=""
          >
            <option value="" disabled>
              Choose status
            </option>
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [foodError, setFoodError] = useState('');
  const [editingFoodItem, setEditingFoodItem] = useState(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isFoodLoading, setIsFoodLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const pageTitle = restaurant?.name || 'Restaurant Dashboard';

  const handleLogout = () => {
    navigate('/', { replace: true });
    logout();
  };

  const loadRestaurant = async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getMyRestaurant();
      setRestaurant(response.data.restaurant);
    } catch (error) {
      if (error.message === 'Restaurant not found') {
        setRestaurant(null);
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadFoodItems = async () => {
    try {
      setFoodError('');
      setIsFoodLoading(true);
      const response = await getMyRestaurantFoodItems();
      setFoodItems(response.data.foodItems || []);
    } catch (error) {
      if (error.message === 'Create a restaurant profile first') {
        setFoodItems([]);
      } else {
        setFoodError(error.message);
      }
    } finally {
      setIsFoodLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'menu' && restaurant) {
      loadFoodItems();
    }
  }, [activeTab, restaurant?._id]);

  const loadOrders = async (status = orderStatusFilter) => {
    try {
      setOrderError('');
      setIsOrdersLoading(true);
      const params = status === 'all' ? undefined : { status };
      const response = await getMyRestaurantOrders(params);
      setOrders(response.data.orders || []);
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders' && restaurant) {
      loadOrders(orderStatusFilter);
    }
  }, [activeTab, restaurant?._id, orderStatusFilter]);

  useEffect(() => {
    const handleNewOrder = () => {
      setNewOrderCount((current) => current + 1);

      if (restaurant) {
        loadOrders(orderStatusFilter);
      }
    };

    onSocketEvent('new_order', handleNewOrder);
    return () => offSocketEvent('new_order', handleNewOrder);
  }, [restaurant?._id, orderStatusFilter]);

  const handleCreateRestaurant = async (data) => {
    await createRestaurant(data);
    await loadRestaurant();
    await loadFoodItems();
    setActiveTab('profile');
  };

  const handleUpdateRestaurant = async (data) => {
    await updateMyRestaurant(data);
    await loadRestaurant();
    setIsEditing(false);
    setActiveTab('profile');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === 'orders') {
      setNewOrderCount(0);
    }

    if (tabId !== 'profile') {
      setIsEditing(false);
    }

    if (tabId !== 'menu') {
      setIsAddingFood(false);
      setEditingFoodItem(null);
    }

    if (tabId !== 'orders') {
      setOrderError('');
      setOrderSuccess('');
    }
  };

  const handleCreateFoodItem = async (data) => {
    await createFoodItem(data);
    await loadFoodItems();
    setIsAddingFood(false);
  };

  const handleUpdateFoodItem = async (data) => {
    await updateFoodItem(editingFoodItem._id, data);
    await loadFoodItems();
    setEditingFoodItem(null);
  };

  const handleDeleteFoodItem = async (id) => {
    const shouldDelete = window.confirm('Delete this food item?');

    if (!shouldDelete) {
      return;
    }

    try {
      setFoodError('');
      await deleteFoodItem(id);
      await loadFoodItems();
    } catch (error) {
      setFoodError(error.message);
    }
  };

  const handleToggleFoodAvailability = async (id) => {
    try {
      setFoodError('');
      await toggleFoodAvailability(id);
      await loadFoodItems();
    } catch (error) {
      setFoodError(error.message);
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    try {
      setOrderError('');
      setOrderSuccess('');
      const response = await updateOrderStatus(orderId, status);
      const updatedOrder = response.data.order;

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order,
        ),
      );
      setOrderSuccess('Order status updated successfully');
    } catch (error) {
      setOrderError(error.message);
    }
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Approval Status"
          tone={restaurant?.isApproved ? 'default' : 'warning'}
          value={
            restaurant
              ? restaurant.isApproved
                ? 'Approved'
                : 'Pending'
              : 'Profile needed'
          }
        />
        <OverviewCard
          label="Restaurant Status"
          value={restaurant?.isOpen ? 'Open' : 'Closed'}
        />
        <OverviewCard label="Menu Items" value={foodItems.length || 'None yet'} />
        <OverviewCard label="Orders" value={orders.length || 'None yet'} />
      </div>

      {restaurant && !restaurant.isApproved && (
        <section className="rounded-lg border border-orange-200 bg-orange-50 p-5 text-orange-900 shadow-sm">
          <h2 className="text-lg font-bold">Pending admin approval</h2>
          <p className="mt-2 text-sm leading-6">
            Your restaurant is pending admin approval. It will be visible to
            customers after approval.
          </p>
        </section>
      )}

      {!restaurant && (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Create your restaurant profile</h2>
          <p className="mt-2 text-slate-700">
            You have not created a restaurant profile yet.
          </p>
          <button
            className="mt-5 rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
            onClick={() => setActiveTab('profile')}
            type="button"
          >
            Create Restaurant
          </button>
        </section>
      )}
    </div>
  );

  const renderProfileDetails = () => (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      {restaurant.coverImage ? (
        <img
          alt={`${restaurant.name} cover`}
          className="mb-6 h-56 w-full rounded-xl object-cover"
          src={restaurant.coverImage}
        />
      ) : (
        <div className="mb-6 flex h-56 w-full items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-700">
          No cover image uploaded
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {restaurant.logo ? (
            <img
              alt={`${restaurant.name} logo`}
              className="h-20 w-20 rounded-full object-cover"
              src={restaurant.logo}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-xs font-semibold text-orange-700">
              No logo
            </div>
          )}
          <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Restaurant Profile
          </p>
          <h2 className="mt-2 text-3xl font-bold">{restaurant.name}</h2>
          <p className="mt-3 max-w-3xl text-slate-700">
            {restaurant.description || 'No description provided.'}
          </p>
          </div>
        </div>

        <button
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit Profile
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Phone" value={restaurant.phone} />
        <DetailItem label="Email" value={restaurant.email} />
        <DetailItem label="City" value={restaurant.address?.city} />
        <DetailItem
          label="Cuisine types"
          value={restaurant.cuisineTypes?.join(', ')}
        />
        <DetailItem label="Delivery fee" value={formatCurrency(restaurant.deliveryFee)} />
        <DetailItem
          label="Minimum order"
          value={formatCurrency(restaurant.minimumOrderAmount)}
        />
        <DetailItem
          label="Estimated delivery"
          value={restaurant.estimatedDeliveryTime}
        />
        <DetailItem
          label="Approval status"
          value={restaurant.isApproved ? 'Approved' : 'Pending admin approval'}
        />
        <DetailItem
          label="Open status"
          value={restaurant.isOpen ? 'Open' : 'Closed'}
        />
      </div>

      {!restaurant.isApproved && (
        <p className="mt-6 rounded-md bg-orange-50 px-3 py-2 text-sm font-medium text-orange-800">
          Approval status: Pending admin approval
        </p>
      )}
    </section>
  );

  const renderProfileTab = () => {
    if (!restaurant) {
      return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Create restaurant profile</h2>
          <p className="mt-2 text-slate-700">
            You have not created a restaurant profile yet.
          </p>

          <div className="mt-6">
            <RestaurantForm onSubmit={handleCreateRestaurant} />
          </div>
        </section>
      );
    }

    if (isEditing) {
      return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Edit restaurant profile</h2>
              <p className="mt-2 text-slate-700">
                Update your restaurant details. Approval status cannot be
                changed here.
              </p>
            </div>
            <button
              className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-orange-50"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6">
            <RestaurantForm
              mode="edit"
              onSubmit={handleUpdateRestaurant}
              restaurant={restaurant}
            />
          </div>
        </section>
      );
    }

    return renderProfileDetails();
  };

  const renderMenuTab = () => {
    if (!restaurant) {
      return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Create a restaurant first</h2>
          <p className="mt-2 text-slate-700">
            You need a restaurant profile before adding menu items.
          </p>
        </section>
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                Menu Items
              </p>
              <h2 className="mt-2 text-2xl font-bold">Manage your menu</h2>
            </div>
            {!isAddingFood && !editingFoodItem && (
              <button
                className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                onClick={() => setIsAddingFood(true)}
                type="button"
              >
                Add Food Item
              </button>
            )}
          </div>

          {foodError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {foodError}
            </p>
          )}

          {isAddingFood && (
            <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
              <FoodItemForm
                onCancel={() => setIsAddingFood(false)}
                onSubmit={handleCreateFoodItem}
              />
            </div>
          )}

          {editingFoodItem && (
            <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
              <FoodItemForm
                foodItem={editingFoodItem}
                mode="edit"
                onCancel={() => setEditingFoodItem(null)}
                onSubmit={handleUpdateFoodItem}
              />
            </div>
          )}
        </section>

        {isFoodLoading && (
          <p className="rounded-lg bg-white p-6 text-slate-700 shadow-sm">
            Loading menu items...
          </p>
        )}

        {!isFoodLoading && foodItems.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-slate-700 shadow-sm">
            No menu items yet.
          </p>
        )}

        {!isFoodLoading && foodItems.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            {foodItems.map((foodItem) => (
              <FoodItemCard
                foodItem={foodItem}
                key={foodItem._id}
                onDelete={handleDeleteFoodItem}
                onEdit={(nextFoodItem) => {
                  setIsAddingFood(false);
                  setEditingFoodItem(nextFoodItem);
                }}
                onToggleAvailability={handleToggleFoodAvailability}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (!restaurant) {
      return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Create a restaurant first</h2>
          <p className="mt-2 text-slate-700">
            Orders will appear here after your restaurant profile exists.
          </p>
        </section>
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                Orders
              </p>
              <h2 className="mt-2 text-2xl font-bold">Restaurant orders</h2>
            </div>

            <label className="block w-full md:w-64">
              <span className="text-sm font-medium text-slate-700">
                Filter by status
              </span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
                onChange={(event) => setOrderStatusFilter(event.target.value)}
                value={orderStatusFilter}
              >
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {orderSuccess && (
            <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {orderSuccess}
            </p>
          )}

          {orderError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {orderError}
            </p>
          )}
        </section>

        {isOrdersLoading && (
          <p className="rounded-lg bg-white p-6 text-slate-700 shadow-sm">
            Loading orders...
          </p>
        )}

        {!isOrdersLoading && !orderError && orders.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-slate-700 shadow-sm">
            No orders yet.
          </p>
        )}

        {!isOrdersLoading && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                onStatusChange={handleOrderStatusChange}
                order={order}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === 'profile') {
      return renderProfileTab();
    }

    if (activeTab === 'menu') {
      return renderMenuTab();
    }

    if (activeTab === 'orders') {
      return renderOrdersTab();
    }

    if (activeTab === 'settings') {
      return <PlaceholderCard message="Restaurant settings will be added later." />;
    }

    return renderDashboardTab();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-orange-50 px-6 py-12 text-slate-900">
        <p className="mx-auto max-w-6xl text-slate-700">Loading restaurant...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-foodhub-cream text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="fh-card p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-64">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              FoodHub
            </p>
            <h2 className="mt-1 text-xl font-bold">Owner Panel</h2>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <button
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-left text-sm font-semibold ${
                  activeTab === item.id
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-700 hover:bg-orange-50 hover:text-orange-700'
                }`}
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                type="button"
              >
                {item.label}
                {item.id === 'orders' && newOrderCount > 0 && (
                  <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-orange-700">
                    {newOrderCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="fh-card flex flex-col gap-4 p-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                Restaurant Owner Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-black">{pageTitle}</h1>
              <p className="mt-2 text-slate-700">
                Signed in as {user?.name || 'Restaurant Owner'}
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

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {renderActiveTab()}
        </section>
      </div>
    </main>
  );
}

export default RestaurantDashboard;
