import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getMyAddresses,
  getMyProfile,
} from '../../services/customerProfileService';
import { getMyOrders } from '../../services/orderService';
import { getRestaurants } from '../../services/restaurantService';

const categories = [
  'Pizza',
  'Burger',
  'Biryani',
  'Sushi',
  'Pasta',
  'Desserts',
  'Drinks',
  'Vegan',
  'Chicken',
  'Fast Food',
];

const activeStatuses = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
];

const statusClasses = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-stone-50 text-[#FF4F2E]',
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
};

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

function RestaurantCard({ restaurant }) {
  return (
    <Link
      className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      to={`/restaurants/${restaurant._id}`}
    >
      {restaurant.coverImage || restaurant.logo ? (
        <img
          alt={restaurant.name}
          className="h-40 w-full object-cover"
          src={restaurant.coverImage || restaurant.logo}
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-stone-100 font-semibold text-[#FF4F2E]">
          FoodHub Restaurant
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold group-hover:text-[#FF4F2E]">
            {restaurant.name}
          </h3>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              restaurant.isOpen
                ? 'bg-green-50 text-green-700'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-zinc-600">
          {restaurant.cuisineTypes?.join(', ') || 'Cuisine details coming soon'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-zinc-600">
          <p>
            {restaurant.ratingCount
              ? `★ ${restaurant.ratingAverage}`
              : 'No ratings yet'}
          </p>
          <p>{restaurant.estimatedDeliveryTime || 'Time not provided'}</p>
          <p>Delivery {formatCurrency(restaurant.deliveryFee)}</p>
          <p>Min. {formatCurrency(restaurant.minimumOrderAmount)}</p>
        </div>
      </div>
    </Link>
  );
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      const results = await Promise.allSettled([
        getMyProfile(),
        getMyAddresses(),
        getRestaurants(),
        getMyOrders(),
      ]);

      if (results[0].status === 'fulfilled') {
        setProfile(results[0].value.data.user);
      }

      if (results[1].status === 'fulfilled') {
        const addresses = results[1].value.data.addresses || [];
        setDefaultAddress(
          addresses.find((address) => address.isDefault) || addresses[0] || null,
        );
      }

      if (results[2].status === 'fulfilled') {
        setRestaurants((results[2].value.data.restaurants || []).slice(0, 8));
      }

      if (results[3].status === 'fulfilled') {
        setOrders(results[3].value.data.orders || []);
      }

      if (results.some((result) => result.status === 'rejected')) {
        setError('Some dashboard information could not be loaded.');
      }

      setIsLoading(false);
    };

    loadDashboard();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/restaurants?search=${encodeURIComponent(query)}` : '/restaurants');
  };

  const activeOrder = orders.find((order) =>
    activeStatuses.includes(order.status),
  );
  const deliveredOrders = orders
    .filter((order) => order.status === 'delivered')
    .slice(0, 3);
  const accountAddressState = {
    section: 'addresses',
    addAddress: !defaultAddress,
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-zinc-900">
      <section className="bg-stone-100 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-[#FF4F2E]">
            {getGreeting()}, {profile?.name || user?.name || 'Food lover'}
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black sm:text-5xl">
            What would you like to eat today?
          </h1>

          <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-700 sm:flex-row sm:items-center">
            <p>
              {defaultAddress
                ? `Delivering to: ${defaultAddress.street}, ${defaultAddress.city}`
                : 'Add your delivery address to find better restaurants near you'}
            </p>
            <Link
              className="w-fit font-semibold text-[#FF4F2E] underline decoration-[#FF4F2E]/40 underline-offset-4"
              state={accountAddressState}
              to="/customer/account"
            >
              {defaultAddress ? 'Change address' : 'Add address'}
            </Link>
            {!defaultAddress && (
              <Link
                className="w-fit rounded-md border border-stone-300 px-3 py-1.5 font-semibold text-[#FF4F2E] hover:bg-stone-50"
                state={{ section: 'addresses', addAddress: true }}
                to="/customer/account"
              >
                Use current location
              </Link>
            )}
          </div>

          <form
            className="mt-7 flex max-w-3xl overflow-hidden rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#FF4F2E]/30"
            onSubmit={handleSearch}
          >
            <input
              className="min-w-0 flex-1 px-5 py-4 outline-none"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search restaurants, cuisines, or dishes..."
              value={searchTerm}
            />
            <button
              className="bg-[#FF4F2E] px-6 font-semibold text-white hover:bg-[#E63E22]"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-8 sm:px-8">
        <section>
          <h2 className="text-xl font-bold">Explore categories</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                className="shrink-0 rounded-full border border-stone-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 hover:border-[#FF4F2E] hover:text-[#FF4F2E]"
                key={category}
                onClick={() =>
                  navigate(
                    `/restaurants?search=${encodeURIComponent(category)}`,
                  )
                }
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {activeOrder && (
          <section className="flex flex-col gap-5 rounded-xl border border-indigo-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">Track your order</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusClasses[activeOrder.status] ||
                    'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {activeOrder.status}
                </span>
              </div>
              <p className="mt-2 font-semibold text-zinc-800">
                {activeOrder.restaurant?.name || 'Restaurant'}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Your order is {activeOrder.status.replaceAll('_', ' ')}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                to={`/orders/${activeOrder._id}/tracking`}
              >
                Track order
              </Link>
              <Link
                className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
                to="/my-orders"
              >
                View orders
              </Link>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-5 rounded-xl bg-[#FF4F2E] p-7 text-white shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black">
              Hungry? Your next favorite meal is waiting.
            </h2>
            <p className="mt-2 text-white/80">
              Discover local restaurants and order in minutes.
            </p>
          </div>
          <Link
            className="w-fit rounded-md bg-white px-5 py-3 font-bold text-[#FF4F2E] hover:bg-stone-50"
            to="/restaurants"
          >
            Browse restaurants
          </Link>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-[#FF4F2E]">
                Discover
              </p>
              <h2 className="mt-1 text-3xl font-bold">Restaurants near you</h2>
            </div>
            <Link className="font-semibold text-[#FF4F2E]" to="/restaurants">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  className="h-72 animate-pulse rounded-xl bg-white"
                  key={item}
                />
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-white p-6 text-zinc-600 shadow-sm">
              Restaurants are not available right now.
            </p>
          )}
        </section>

        {deliveredOrders.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold">Order again</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {deliveredOrders.map((order) => (
                <article className="rounded-xl bg-white p-5 shadow-sm" key={order._id}>
                  <h3 className="text-xl font-bold">
                    {order.restaurant?.name || 'Restaurant'}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    Total {formatCurrency(order.totalAmount)}
                  </p>
                  {order.restaurant?._id && (
                    <Link
                      className="mt-5 inline-flex rounded-xl bg-[#FF4F2E] px-4 py-2 font-semibold text-white hover:bg-[#E63E22]"
                      to={`/restaurants/${order.restaurant._id}`}
                    >
                      Order again
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {error && (
          <p className="rounded-xl bg-white p-4 text-sm text-[#FF4F2E] shadow-sm">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

export default CustomerDashboard;
