import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getRestaurants } from '../../services/restaurantService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const cuisineShortcuts = [
  'Pizza',
  'Burger',
  'Biryani',
  'Sushi',
  'Pasta',
  'Vegan',
];

function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const { getCartCount } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({
    search: urlSearch,
    city: '',
    cuisine: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRestaurants = async (nextFilters = filters) => {
    try {
      setError('');
      setIsLoading(true);

      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value.trim()),
      );
      const response = await getRestaurants(params);

      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const nextFilters = {
      ...filters,
      search: urlSearch,
    };

    setFilters(nextFilters);
    loadRestaurants(nextFilters);
  }, [urlSearch]);

  const handleChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearch = filters.search.trim();

    if (nextSearch !== urlSearch) {
      setSearchParams(nextSearch ? { search: nextSearch } : {});
    } else {
      loadRestaurants(filters);
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      city: '',
      cuisine: '',
    };

    setFilters(emptyFilters);
    setSearchParams({});
    loadRestaurants(emptyFilters);
  };

  const handleCuisineShortcut = (cuisine) => {
    const nextFilters = {
      ...filters,
      cuisine,
    };
    setFilters(nextFilters);
    loadRestaurants(nextFilters);
  };

  return (
    <main className="fh-page">
      <section className="fh-container space-y-7">
        <header className="fh-card flex flex-col gap-4 p-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              FoodHub Restaurants
            </p>
            <h1 className="mt-2 text-4xl font-black">Browse restaurants</h1>
            <p className="mt-3 max-w-2xl text-slate-700">
              Discover approved restaurants that are active on FoodHub.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="font-semibold text-orange-600" to="/">
              Back to home
            </Link>
            <Link className="font-semibold text-orange-600" to="/cart">
              Cart ({getCartCount()})
            </Link>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {cuisineShortcuts.map((cuisine) => (
            <button
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                filters.cuisine === cuisine
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-orange-200 bg-white text-slate-700 hover:border-orange-400'
              }`}
              key={cuisine}
              onClick={() => handleCuisineShortcut(cuisine)}
              type="button"
            >
              {cuisine}
            </button>
          ))}
        </div>

        <form
          className="fh-card grid gap-3 p-5 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
          onSubmit={handleSearch}
        >
          <input
            className="fh-input"
            name="search"
            onChange={handleChange}
            placeholder="Search by name"
            value={filters.search}
          />
          <input
            className="fh-input"
            name="city"
            onChange={handleChange}
            placeholder="City"
            value={filters.city}
          />
          <input
            className="fh-input"
            name="cuisine"
            onChange={handleChange}
            placeholder="Cuisine"
            value={filters.cuisine}
          />
          <button
            className="fh-btn-primary"
            type="submit"
          >
            Search
          </button>
          <button
            className="fh-btn-secondary"
            onClick={handleClearFilters}
            type="button"
          >
            Clear
          </button>
        </form>

        {isLoading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                className="fh-card h-96 animate-pulse bg-white"
                key={item}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="fh-alert-error">
            {error}
          </p>
        )}

        {!isLoading && !error && restaurants.length === 0 && (
          <p className="fh-card p-8 text-center text-slate-700">
            No restaurants found.
          </p>
        )}

        {!isLoading && !error && restaurants.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <article
                className="fh-card fh-card-hover flex flex-col overflow-hidden"
                key={restaurant._id}
              >
                {restaurant.coverImage || restaurant.logo ? (
                  <img
                    alt={restaurant.name}
                    className="h-40 w-full object-cover"
                    src={restaurant.coverImage || restaurant.logo}
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-orange-100 text-sm font-semibold text-orange-700">
                    FoodHub Restaurant
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      {restaurant.logo && (
                        <img
                          alt={`${restaurant.name} logo`}
                          className="h-12 w-12 rounded-full object-cover"
                          src={restaurant.logo}
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {restaurant.address?.city || 'City not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      restaurant.isOpen
                        ? 'bg-green-50 text-green-700'
                        : 'bg-orange-50 text-slate-600'
                    }`}
                  >
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-700">
                  {restaurant.description || 'No description provided.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {restaurant.cuisineTypes?.length ? (
                    restaurant.cuisineTypes.map((cuisine) => (
                      <span
                        className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
                        key={cuisine}
                      >
                        {cuisine}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      Cuisine not provided
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-700">
                  <p>Delivery fee: {formatCurrency(restaurant.deliveryFee)}</p>
                  <p>
                    Minimum order:{' '}
                    {formatCurrency(restaurant.minimumOrderAmount)}
                  </p>
                  <p>
                    Delivery time:{' '}
                    {restaurant.estimatedDeliveryTime || 'Not provided'}
                  </p>
                  <p>
                    {restaurant.ratingCount
                      ? `★ ${restaurant.ratingAverage} (${restaurant.ratingCount} reviews)`
                      : 'No ratings yet'}
                  </p>
                </div>

                <Link
                  className="fh-btn-primary mt-5 w-full"
                  to={`/restaurants/${restaurant._id}`}
                >
                  View details
                </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default RestaurantsPage;
