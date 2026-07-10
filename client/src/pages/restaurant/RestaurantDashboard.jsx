import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from '../../components/common/NotificationBell';
import FoodItemForm from '../../components/restaurant/FoodItemForm';
import OwnerReviews from '../../components/restaurant/OwnerReviews';
import OwnerSettings from '../../components/restaurant/OwnerSettings';
import RestaurantAnalytics from '../../components/restaurant/RestaurantAnalytics';
import RestaurantAvailabilityForm from '../../components/restaurant/RestaurantAvailabilityForm';
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
  { id: 'dashboard', label: 'Overview' },
  { id: 'profile', label: 'Restaurant Profile' },
  { id: 'menu', label: 'Menu Items' },
  { id: 'orders', label: 'Orders' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'availability', label: 'Availability' },
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

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-zinc-900">{value || 'Not provided'}</p>
    </div>
  );
}

function PlaceholderCard({ message }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
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
        <div className="flex h-44 w-full items-center justify-center bg-stone-50 text-sm font-semibold text-[#FF4F2E]">
          No food image
        </div>
      )}
      <div className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
            {foodItem.category}
          </p>
          <h3 className="mt-1 text-2xl font-bold">{foodItem.name}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            {foodItem.description || 'No description provided.'}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            foodItem.isAvailable
              ? 'bg-green-50 text-green-700'
              : 'bg-stone-50 text-zinc-600'
          }`}
        >
          {foodItem.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-700 md:grid-cols-2">
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
              className="rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-[#FF4F2E]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="rounded-xl bg-[#FF4F2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E63E22]"
          onClick={() => onEdit(foodItem)}
          type="button"
        >
          Edit
        </button>
        <button
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
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
          <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Order #{order._id.slice(-8)}
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            {order.customer?.name || address?.fullName || 'Customer'}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            {order.customer?.email || 'Email not provided'}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            statusClasses[order.status] || 'bg-zinc-100 text-zinc-700'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Delivery address
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-800">
            {address?.fullName}
            <br />
            {address?.phone}
            <br />
            {[address?.street, address?.postalCode, address?.city, address?.country]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        <div className="rounded-lg bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Payment
          </p>
          <p className="mt-2 text-sm text-zinc-800">
            Method: {formatPaymentMethod(order.paymentMethod)}
          </p>
          <p className="mt-1 text-sm text-zinc-800">
            Status: {formatPaymentStatus(order.paymentStatus)}
          </p>
        </div>
      </div>

      {order.orderNote && (
        <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm text-zinc-700">
          Note: {order.orderNote}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {order.items.map((item) => (
          <div
            className="flex flex-col gap-2 border-b border-zinc-100 pb-3 text-sm md:flex-row md:items-center md:justify-between"
            key={`${order._id}-${item.foodItem?._id || item.name}`}
          >
            <div>
              <p className="font-semibold text-zinc-900">{item.name}</p>
              <p className="text-zinc-600">
                Qty {item.quantity} x {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-zinc-700 md:grid-cols-3">
        <p>Subtotal: {formatCurrency(order.subtotal)}</p>
        <p>Delivery fee: {formatCurrency(order.deliveryFee)}</p>
        <p className="font-bold text-zinc-900">
          Total: {formatCurrency(order.totalAmount)}
        </p>
      </div>

      <div className="mt-5">
        <label className="block max-w-xs">
          <span className="text-sm font-medium text-zinc-700">Update status</span>
          <select
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
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

function OwnerSidebarContent({
  activeTab,
  newOrderCount,
  onClose,
  onSelectTab,
  sidebarInitial,
  sidebarTitle,
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF4F2E] text-lg font-black text-white">
            {sidebarInitial}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-zinc-900">
              {sidebarTitle}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-zinc-500">
              Owner Panel
            </p>
          </div>
        </div>

        {onClose && (
          <button
            aria-label="Close owner menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xl font-semibold text-zinc-700 hover:bg-stone-50"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        )}
      </div>

      <nav className="mt-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            className={`rounded-lg px-4 py-2 text-left text-sm font-semibold ${
              activeTab === item.id
                ? 'bg-[#FF4F2E] text-white'
                : 'text-zinc-700 hover:bg-stone-50 hover:text-[#FF4F2E]'
            }`}
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            type="button"
          >
            {item.label}
            {item.id === 'orders' && newOrderCount > 0 && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === item.id
                    ? 'bg-white text-[#FF4F2E]'
                    : 'bg-[#FF4F2E] text-white'
                }`}
              >
                {newOrderCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

function RestaurantDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [foodError, setFoodError] = useState('');
  const [foodSuccess, setFoodSuccess] = useState('');
  const [editingFoodItem, setEditingFoodItem] = useState(null);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
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

  const sidebarTitle = isLoading
    ? 'Loading...'
    : restaurant?.name || 'Restaurant Setup';
  const sidebarInitial = sidebarTitle.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
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
      setEditingFoodItem(null);
      setIsFoodModalOpen(false);
      setFoodError('');
      setFoodSuccess('');
    }

    if (tabId !== 'orders') {
      setOrderError('');
      setOrderSuccess('');
    }
  };

  const handleSidebarTabChange = (tabId) => {
    handleTabChange(tabId);
    setIsSidebarOpen(false);
  };

  const handleOpenAddFoodModal = () => {
    setFoodError('');
    setFoodSuccess('');
    setEditingFoodItem(null);
    setIsFoodModalOpen(true);
  };

  const handleOpenEditFoodModal = (foodItem) => {
    setFoodError('');
    setFoodSuccess('');
    setEditingFoodItem(foodItem);
    setIsFoodModalOpen(true);
  };

  const handleCloseFoodModal = () => {
    setIsFoodModalOpen(false);
    setEditingFoodItem(null);
  };

  const handleCreateFoodItem = async (data) => {
    await createFoodItem(data);
    await loadFoodItems();
    setFoodSuccess('Food item created successfully');
    handleCloseFoodModal();
  };

  const handleUpdateFoodItem = async (data) => {
    await updateFoodItem(editingFoodItem._id, data);
    await loadFoodItems();
    setFoodSuccess('Food item updated successfully');
    handleCloseFoodModal();
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
      setFoodSuccess('');
      await toggleFoodAvailability(id);
      await loadFoodItems();
    } catch (error) {
      setFoodError(error.message);
    }
  };

  useEffect(() => {
    if (!isFoodModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseFoodModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFoodModalOpen]);

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

  const renderDashboardTab = () => {
    if (!restaurant) {
      return (
        <section className="fh-card p-7">
          <h2 className="text-2xl font-bold">Create your restaurant profile first.</h2>
          <p className="mt-2 text-zinc-700">
            Your business overview will appear after your restaurant profile is
            created.
          </p>
          <button
            className="fh-btn-primary mt-5"
            onClick={() => setActiveTab('profile')}
            type="button"
          >
            Create Restaurant
          </button>
        </section>
      );
    }

    return (
      <div className="space-y-6">
        {!restaurant.isApproved && (
          <section className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-bold">Pending admin approval</h2>
            <p className="mt-2 text-sm leading-6">
              Your restaurant will become visible to customers after approval.
            </p>
          </section>
        )}
        <RestaurantAnalytics onViewOrders={() => handleTabChange('orders')} />
      </div>
    );
  };

  const renderProfileDetails = () => (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      {restaurant.coverImage ? (
        <img
          alt={`${restaurant.name} cover`}
          className="mb-6 h-56 w-full rounded-xl object-cover"
          src={restaurant.coverImage}
        />
      ) : (
        <div className="mb-6 flex h-56 w-full items-center justify-center rounded-xl bg-stone-50 text-sm font-semibold text-[#FF4F2E]">
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
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-50 text-xs font-semibold text-[#FF4F2E]">
              No logo
            </div>
          )}
          <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Restaurant Profile
          </p>
          <h2 className="mt-2 text-3xl font-bold">{restaurant.name}</h2>
          <p className="mt-3 max-w-3xl text-zinc-700">
            {restaurant.description || 'No description provided.'}
          </p>
          </div>
        </div>

        <button
          className="rounded-xl bg-[#FF4F2E] px-4 py-2 font-semibold text-white hover:bg-[#E63E22]"
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
        <p className="mt-6 rounded-md bg-stone-50 px-3 py-2 text-sm font-medium text-zinc-700">
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
          <p className="mt-2 text-zinc-700">
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
              <p className="mt-2 text-zinc-700">
                Update your restaurant details. Approval status cannot be
                changed here.
              </p>
            </div>
            <button
              className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
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

  const renderFoodItemModal = () => {
    if (!isFoodModalOpen) {
      return null;
    }

    const isEditMode = Boolean(editingFoodItem);

    return (
      <div
        aria-labelledby="food-item-modal-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
      >
        <button
          aria-label="Close food item form"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleCloseFoodModal}
          type="button"
        />

        <section className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-black text-zinc-900"
                id="food-item-modal-title"
              >
                {isEditMode ? 'Edit Food Item' : 'Add Food Item'}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Add menu details, price, category, and image.
              </p>
            </div>

            <button
              aria-label="Close food item form"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xl font-semibold text-zinc-700 transition hover:bg-stone-50"
              onClick={handleCloseFoodModal}
              type="button"
            >
              ×
            </button>
          </header>

          <FoodItemForm
            foodItem={editingFoodItem}
            key={editingFoodItem?._id || 'new-food-item'}
            mode={isEditMode ? 'edit' : 'create'}
            onCancel={handleCloseFoodModal}
            onSubmit={isEditMode ? handleUpdateFoodItem : handleCreateFoodItem}
          />
        </section>
      </div>
    );
  };

  const renderMenuTab = () => {
    if (!restaurant) {
      return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Create a restaurant first</h2>
          <p className="mt-2 text-zinc-700">
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
              <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
                Menu Items
              </p>
              <h2 className="mt-2 text-2xl font-bold">Manage your menu</h2>
            </div>
            <button
              className="rounded-xl bg-[#FF4F2E] px-4 py-2 font-semibold text-white hover:bg-[#E63E22]"
              onClick={handleOpenAddFoodModal}
              type="button"
            >
              Add Food Item
            </button>
          </div>

          {foodError && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {foodError}
            </p>
          )}

          {foodSuccess && (
            <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {foodSuccess}
            </p>
          )}
        </section>

        {isFoodLoading && (
          <p className="rounded-lg bg-white p-6 text-zinc-700 shadow-sm">
            Loading menu items...
          </p>
        )}

        {!isFoodLoading && foodItems.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-zinc-700 shadow-sm">
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
                onEdit={handleOpenEditFoodModal}
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
          <p className="mt-2 text-zinc-700">
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
              <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
                Orders
              </p>
              <h2 className="mt-2 text-2xl font-bold">Restaurant orders</h2>
            </div>

            <label className="block w-full md:w-64">
              <span className="text-sm font-medium text-zinc-700">
                Filter by status
              </span>
              <select
                className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
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
          <p className="rounded-lg bg-white p-6 text-zinc-700 shadow-sm">
            Loading orders...
          </p>
        )}

        {!isOrdersLoading && !orderError && orders.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-zinc-700 shadow-sm">
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

    if (activeTab === 'availability') {
      return restaurant ? (
        <RestaurantAvailabilityForm
          onUpdated={setRestaurant}
          restaurant={restaurant}
        />
      ) : (
        <PlaceholderCard message="Create a restaurant profile before managing availability." />
      );
    }

    if (activeTab === 'orders') {
      return renderOrdersTab();
    }

    if (activeTab === 'reviews') {
      return restaurant ? (
        <OwnerReviews />
      ) : (
        <PlaceholderCard message="Create a restaurant profile before viewing reviews." />
      );
    }

    if (activeTab === 'settings') {
      return (
        <OwnerSettings
          onRestaurantUpdated={setRestaurant}
          restaurant={restaurant}
        />
      );
    }

    return renderDashboardTab();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] px-6 py-12 text-zinc-900">
        <p className="mx-auto max-w-6xl text-zinc-700">Loading restaurant...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open owner menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-xl font-semibold text-zinc-700 hover:bg-stone-50 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              ☰
            </button>
            <Link
              className="truncate text-2xl font-black text-[#FF4F2E]"
              to="/restaurant/dashboard"
            >
              FoodHub
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      {isSidebarOpen && (
        <>
          <button
            aria-label="Close owner menu overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] border-r border-stone-200 bg-white shadow-xl lg:hidden">
            <OwnerSidebarContent
              activeTab={activeTab}
              newOrderCount={newOrderCount}
              onClose={() => setIsSidebarOpen(false)}
              onSelectTab={handleSidebarTabChange}
              sidebarInitial={sidebarInitial}
              sidebarTitle={sidebarTitle}
            />
          </aside>
        </>
      )}

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:w-64 lg:shrink-0">
          <div className="fh-card h-full overflow-y-auto">
            <OwnerSidebarContent
              activeTab={activeTab}
              newOrderCount={newOrderCount}
              onSelectTab={handleTabChange}
              sidebarInitial={sidebarInitial}
              sidebarTitle={sidebarTitle}
            />
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {renderActiveTab()}
        </section>
      </div>

      {renderFoodItemModal()}
    </main>
  );
}

export default RestaurantDashboard;
