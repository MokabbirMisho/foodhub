import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchFoods } from "../../services/foodService";
import { getRestaurants } from "../../services/restaurantService";

const cuisines = [
  "all",
  "Pizza",
  "Burger",
  "Biryani",
  "Sushi",
  "Pasta",
  "Desserts",
  "Drinks",
  "Vegan",
  "Chicken",
  "Fast Food",
];

const defaultFilters = {
  search: "",
  cuisine: "all",
  openNow: false,
  minRating: "",
  maxDeliveryFee: "",
  maxDeliveryTime: "",
  sort: "relevance",
  page: 1,
};

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const readFilters = (searchParams) => ({
  search: searchParams.get("search") || "",
  cuisine: searchParams.get("cuisine") || "all",
  openNow: searchParams.get("openNow") === "true",
  minRating: searchParams.get("minRating") || "",
  maxDeliveryFee: searchParams.get("maxDeliveryFee") || "",
  maxDeliveryTime: searchParams.get("maxDeliveryTime") || "",
  sort: searchParams.get("sort") || "relevance",
  page: Math.max(Number(searchParams.get("page")) || 1, 1),
});

const toSearchParams = (filters) => {
  const params = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== false &&
      value !== "all" &&
      !(key === "sort" && value === "relevance") &&
      !(key === "page" && value === 1)
    ) {
      params[key] = String(value);
    }
  });

  return params;
};

function AvailabilityBadge({ availability }) {
  const isOpen = availability?.isAvailableNow;
  const opensLater = availability?.reason?.startsWith("Opens at");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isOpen
          ? "bg-green-50 text-green-700"
          : opensLater
            ? "bg-stone-50 text-[#FF4F2E]"
            : "bg-red-50 text-red-700"
      }`}
    >
      {availability?.reason || "Availability unknown"}
    </span>
  );
}

function RestaurantCard({ restaurant }) {
  return (
    <article className="fh-card fh-card-hover flex flex-col overflow-hidden">
      {restaurant.coverImage || restaurant.logo ? (
        <img
          alt={restaurant.name}
          className="h-44 w-full object-cover"
          src={restaurant.coverImage || restaurant.logo}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-stone-100 font-semibold text-[#FF4F2E]">
          FoodHub Restaurant
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{restaurant.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {restaurant.address?.city || "City not provided"}
            </p>
          </div>
          <AvailabilityBadge availability={restaurant.availability} />
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-700">
          {restaurant.description || "No description provided."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {restaurant.cuisineTypes?.map((cuisine) => (
            <span
              className="rounded-full bg-stone-50 px-3 py-1 text-xs font-semibold text-[#FF4F2E]"
              key={cuisine}
            >
              {cuisine}
            </span>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-zinc-700">
          <p>
            {restaurant.ratingCount
              ? `★ ${restaurant.ratingAverage} (${restaurant.ratingCount})`
              : "No ratings yet"}
          </p>
          <p>{restaurant.estimatedDeliveryTime || "Time unavailable"}</p>
          <p>Delivery {formatCurrency(restaurant.deliveryFee)}</p>
          <p>Min. {formatCurrency(restaurant.minimumOrderAmount)}</p>
        </div>

        <Link
          className="fh-btn-primary mt-5 w-full"
          to={`/restaurants/${restaurant._id}`}
        >
          View restaurant
        </Link>
      </div>
    </article>
  );
}

function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlKey = searchParams.toString();
  const [filters, setFilters] = useState(() => readFilters(searchParams));
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [resultInfo, setResultInfo] = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const nextFilters = readFilters(searchParams);
    setFilters(nextFilters);

    const loadResults = async () => {
      try {
        setError("");
        setIsLoading(true);
        const params = toSearchParams({ ...nextFilters, limit: 12 });
        const requests = [getRestaurants(params)];

        if (nextFilters.search) {
          requests.push(
            searchFoods({
              search: nextFilters.search,
              page: 1,
              limit: 6,
            }),
          );
        }

        const [restaurantResponse, foodResponse] = await Promise.all(requests);
        setRestaurants(restaurantResponse.data.restaurants || []);
        setResultInfo({
          total: restaurantResponse.data.total || 0,
          page: restaurantResponse.data.page || 1,
          pages: restaurantResponse.data.pages || 1,
        });
        setDishes(foodResponse?.data.foodItems || []);
      } catch (requestError) {
        setError(requestError.message);
        setRestaurants([]);
        setDishes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [urlKey]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const applyFilters = (event) => {
    event?.preventDefault();
    setSearchParams(toSearchParams({ ...filters, page: 1 }));
    setShowFilters(false);
  };

  const applyImmediateFilter = (name, value) => {
    const nextFilters = { ...filters, [name]: value, page: 1 };
    setFilters(nextFilters);
    setSearchParams(toSearchParams(nextFilters));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setSearchParams({});
  };

  const changePage = (page) => {
    const nextFilters = { ...filters, page };
    setFilters(nextFilters);
    setSearchParams(toSearchParams(nextFilters));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-4 pb-8 pt-4 text-zinc-900 sm:px-6 lg:px-8">
      <section className="fh-container space-y-6">
        <section className="fh-card p-5">
          <div className="mb-4">
            <p className="fh-eyebrow ">FoodHub discovery</p>
            <p className="mt-1 text-sm text-zinc-600">
              {filters.search
                ? `Results for: ${filters.search}`
                : "Find a restaurant for your next meal."}
            </p>
          </div>

          <form className="flex gap-3" onSubmit={applyFilters}>
            <input
              className="fh-input flex-1"
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search restaurants or food..."
              value={filters.search}
            />
            <button className="fh-btn-primary" type="submit">
              Search
            </button>
            <button
              className="fh-btn-secondary md:hidden"
              onClick={() => setShowFilters((current) => !current)}
              type="button"
            >
              Filters
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {cuisines.map((cuisine) => (
              <button
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                  filters.cuisine === cuisine
                    ? "border-[#FF4F2E] bg-[#FF4F2E] text-white"
                    : "border-stone-200 bg-white text-zinc-700 hover:border-[#FF4F2E]"
                }`}
                key={cuisine}
                onClick={() => applyImmediateFilter("cuisine", cuisine)}
                type="button"
              >
                {cuisine === "all" ? "All cuisines" : cuisine}
              </button>
            ))}
          </div>

          <div
            className={`${showFilters ? "grid" : "hidden"} mt-5 gap-4 border-t border-stone-200 pt-5 md:grid md:grid-cols-6`}
          >
            <label className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2">
              <input
                checked={filters.openNow}
                className="accent-[#FF4F2E]"
                onChange={(event) =>
                  updateFilter("openNow", event.target.checked)
                }
                type="checkbox"
              />
              <span className="text-sm font-medium">Open now</span>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">
                Minimum rating
              </span>
              <select
                className="fh-input mt-1"
                onChange={(event) =>
                  updateFilter("minRating", event.target.value)
                }
                value={filters.minRating}
              >
                <option value="">Any rating</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">
                Max delivery fee
              </span>
              <select
                className="fh-input mt-1"
                onChange={(event) =>
                  updateFilter("maxDeliveryFee", event.target.value)
                }
                value={filters.maxDeliveryFee}
              >
                <option value="">Any fee</option>
                <option value="0">Free</option>
                <option value="2">Up to €2</option>
                <option value="5">Up to €5</option>
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">
                Max delivery time
              </span>
              <select
                className="fh-input mt-1"
                onChange={(event) =>
                  updateFilter("maxDeliveryTime", event.target.value)
                }
                value={filters.maxDeliveryTime}
              >
                <option value="">Any time</option>
                {[20, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    Up to {minutes} min
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">
                Sort by
              </span>
              <select
                className="fh-input mt-1"
                onChange={(event) =>
                  applyImmediateFilter("sort", event.target.value)
                }
                value={filters.sort}
              >
                <option value="relevance">Recommended</option>
                <option value="rating_desc">Highest rated</option>
                <option value="delivery_time_asc">Fastest delivery</option>
                <option value="delivery_fee_asc">Lowest delivery fee</option>
                <option value="newest">Newest</option>
                <option value="min_order_asc">Lowest minimum order</option>
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                className="fh-btn-primary flex-1"
                onClick={applyFilters}
                type="button"
              >
                Apply
              </button>
              <button
                className="fh-btn-secondary"
                onClick={clearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Restaurant results</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {resultInfo.total} restaurants found
            </p>
          </div>
        </div>

        {filters.search && dishes.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold">Matching dishes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish) => (
                <Link
                  className="fh-card fh-card-hover flex overflow-hidden"
                  key={dish._id}
                  to={`/restaurants/${dish.restaurant._id}`}
                >
                  {dish.image ? (
                    <img
                      alt={dish.name}
                      className="h-32 w-32 object-cover"
                      src={dish.image}
                    />
                  ) : (
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center bg-stone-100 text-xs font-semibold text-[#FF4F2E]">
                      FoodHub dish
                    </div>
                  )}
                  <div className="min-w-0 p-4">
                    <p className="text-xs font-semibold uppercase text-[#FF4F2E]">
                      {dish.category}
                    </p>
                    <h3 className="mt-1 truncate font-bold">{dish.name}</h3>
                    <p className="mt-1 truncate text-sm text-zinc-600">
                      {dish.restaurant.name}
                    </p>
                    <p className="mt-3 font-semibold">
                      {formatCurrency(dish.discountPrice ?? dish.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="fh-card h-96 animate-pulse" key={item} />
            ))}
          </div>
        )}

        {error && <p className="fh-alert-error">{error}</p>}

        {!isLoading && !error && restaurants.length === 0 && (
          <div className="fh-card p-8 text-center">
            <h2 className="text-2xl font-bold">No restaurants found</h2>
            <p className="mt-2 text-zinc-600">
              Try changing filters or searching another dish.
            </p>
            <button
              className="fh-btn-primary mt-5"
              onClick={clearFilters}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}

        {!isLoading && !error && restaurants.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        )}

        {!isLoading && resultInfo.pages > 1 && (
          <nav
            aria-label="Restaurant result pages"
            className="flex items-center justify-center gap-4"
          >
            <button
              className="fh-btn-secondary"
              disabled={resultInfo.page <= 1}
              onClick={() => changePage(resultInfo.page - 1)}
              type="button"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-zinc-700">
              Page {resultInfo.page} of {resultInfo.pages}
            </span>
            <button
              className="fh-btn-secondary"
              disabled={resultInfo.page >= resultInfo.pages}
              onClick={() => changePage(resultInfo.page + 1)}
              type="button"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default RestaurantsPage;
