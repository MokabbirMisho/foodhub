import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../../components/common/AuthModal';
import PublicNavbar from '../../components/layout/PublicNavbar';
import HomeRestaurantCard from '../../components/restaurant/HomeRestaurantCard';
import { getRestaurants } from '../../services/restaurantService';

const foodCategories = [
  ['Groceries', '🛍️'],
  ['Convenience', '🥡'],
  ['Bakery', '🥐'],
  ['Drinks', '🥤'],
  ['Sweets', '🍰'],
  ['Coffee & Tea', '☕'],
  ['Pizza', '🍕'],
  ['Burgers', '🍔'],
  ['Indian', '🍛'],
  ['Pasta', '🍝'],
  ['Vegan', '🥗'],
  ['Halal', '🍽️'],
];

const cuisineChips = [
  'Italian',
  'Chinese',
  'Burgers',
  'Indian',
  'Pasta',
  '100% Halal',
  'Vegan',
];

function RestaurantSection({
  badge,
  emptyMessage,
  restaurants,
  title,
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="fh-eyebrow">Discover FoodHub</p>
          <h2 className="fh-section-title mt-2">{title}</h2>
        </div>
        <Link className="font-semibold text-orange-700" to="/restaurants">
          View all
        </Link>
      </div>

      {restaurants.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant, index) => (
            <HomeRestaurantCard
              badge={
                typeof badge === 'function' ? badge(restaurant, index) : badge
              }
              key={restaurant._id}
              restaurant={restaurant}
            />
          ))}
        </div>
      ) : (
        <div className="fh-card mt-6 p-7 text-slate-600">{emptyMessage}</div>
      )}
    </section>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState('delivery');
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionMessage, setCollectionMessage] = useState('');
  const [lowFeeRestaurants, setLowFeeRestaurants] = useState([]);
  const [popularRestaurants, setPopularRestaurants] = useState([]);
  const [highlightRestaurants, setHighlightRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const closeAuth = useCallback(() => setIsAuthOpen(false), []);

  useEffect(() => {
    const loadRestaurantCollections = async () => {
      setIsLoading(true);

      const results = await Promise.allSettled([
        getRestaurants({
          maxDeliveryFee: 2,
          sort: 'delivery_fee_asc',
          limit: 6,
        }),
        getRestaurants({ sort: 'rating_desc', limit: 6 }),
        getRestaurants({ sort: 'newest', limit: 6 }),
      ]);

      const getItems = (result) =>
        result.status === 'fulfilled'
          ? result.value.data.restaurants || []
          : [];

      setLowFeeRestaurants(getItems(results[0]));
      setPopularRestaurants(getItems(results[1]));
      setHighlightRestaurants(getItems(results[2]));
      setIsLoading(false);
    };

    loadRestaurantCollections();
  }, []);

  const goToSearch = (event) => {
    event?.preventDefault();
    const query = searchTerm.trim();
    navigate(
      query
        ? `/restaurants?search=${encodeURIComponent(query)}`
        : '/restaurants',
    );
  };

  const chooseMode = (mode) => {
    setFulfillmentMode(mode);
    setCollectionMessage(
      mode === 'collection' ? 'Collection option coming soon' : '',
    );
  };

  const categoryLink = (category) =>
    `/restaurants?search=${encodeURIComponent(category)}`;

  return (
    <main className="min-h-screen bg-[#FFF8F0] text-stone-900">
      <PublicNavbar onOpenAuth={() => setIsAuthOpen(true)} />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />

      <section className="px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mx-auto flex min-h-[270px] max-w-7xl items-center rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-[#FFF8F0] to-amber-50 px-5 py-7 shadow-sm sm:min-h-[300px] sm:px-8 sm:py-9 lg:min-h-[330px] lg:px-12 lg:py-10">
          <div className="w-full max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
              FoodHub delivery
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-stone-900 md:text-5xl">
              Your favorite food, delivered fast
            </h1>
            <p className="mt-2 text-base text-stone-600 sm:text-lg">
              Discover local restaurants and order in minutes.
            </p>

            <div className="mt-5 max-w-3xl rounded-2xl border border-orange-100 bg-white p-2.5 text-stone-900 shadow-md">
              <form
                className="flex items-center gap-2"
                onSubmit={goToSearch}
              >
                <input
                  aria-label="Search area, restaurants, or food"
                  className="min-w-0 flex-1 rounded-xl border-0 bg-orange-50/70 px-4 py-3 text-sm outline-none placeholder:text-stone-500 focus:ring-2 focus:ring-orange-300 sm:text-base"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Enter your area, restaurant, or food"
                  value={searchTerm}
                />
                <button className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-orange-500 px-4 font-semibold text-white shadow-sm hover:bg-orange-600 sm:px-6" type="submit">
                  Search
                </button>
              </form>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex w-fit rounded-full border border-orange-100 bg-white p-1">
                {[
                  ['delivery', 'Delivery'],
                  ['collection', 'Collection'],
                ].map(([mode, label]) => (
                  <button
                    className={`rounded-full px-5 py-2 text-sm font-semibold ${
                      fulfillmentMode === mode
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-stone-600 hover:bg-orange-50'
                    }`}
                    key={mode}
                    onClick={() => chooseMode(mode)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
                </div>

                {collectionMessage && (
                  <p className="text-xs font-medium text-orange-700">
                    {collectionMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 border-y border-orange-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold">What are you craving?</h2>
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {foodCategories.map(([category, icon]) => (
              <Link
                className="group flex w-28 shrink-0 flex-col items-center rounded-2xl border border-orange-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
                key={category}
                to={categoryLink(category)}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-2xl"
                >
                  {icon}
                </span>
                <span className="mt-3 text-sm font-semibold text-stone-700 group-hover:text-orange-700">
                  {category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cuisineChips.map((cuisine) => (
            <Link
              className="shrink-0 rounded-full border border-orange-100 bg-white px-5 py-2 text-sm font-semibold text-stone-600 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              key={cuisine}
              to={categoryLink(cuisine)}
            >
              {cuisine}
            </Link>
          ))}
          <Link
            className="shrink-0 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            to="/restaurants"
          >
            Show all
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-14 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="fh-card h-72 animate-pulse" key={item} />
            ))}
          </div>
        ) : (
          <>
            <RestaurantSection
              badge="Low delivery fee"
              emptyMessage="No restaurants with delivery under €2 are available right now."
              restaurants={lowFeeRestaurants}
              title="Delivery under €2"
            />
            <RestaurantSection
              badge="Popular"
              emptyMessage="Popular restaurants will appear here as ratings grow."
              restaurants={popularRestaurants}
              title="Popular near you"
            />
            <RestaurantSection
              badge={(restaurant, index) =>
                index % 3 === 0
                  ? 'New'
                  : index % 3 === 1
                    ? 'Popular'
                    : 'Fast delivery'
              }
              emptyMessage="More restaurant highlights are coming soon."
              restaurants={highlightRestaurants}
              title="Offers and highlights"
            />
          </>
        )}
      </div>

      <footer className="border-t border-orange-100 bg-white px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-orange-600">FoodHub</p>
          <p>Local restaurants, one simple delivery platform.</p>
        </div>
      </footer>
    </main>
  );
}

export default HomePage;
