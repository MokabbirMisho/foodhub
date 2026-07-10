import { Link } from 'react-router-dom';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

function HomeRestaurantCard({ badge, restaurant }) {
  const availability = restaurant.availability;

  return (
    <Link
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
      to={`/restaurants/${restaurant._id}`}
    >
      <div className="relative">
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
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#FF4F2E] shadow-sm">
            {badge}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#FF4F2E]">
            {restaurant.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              availability?.isAvailableNow
                ? 'bg-green-50 text-green-700'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {availability?.isAvailableNow ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-zinc-600">
          {restaurant.cuisineTypes?.join(', ') || 'Local restaurant'}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500">
          <span>
            {restaurant.ratingCount
              ? `★ ${restaurant.ratingAverage}`
              : 'New'}
          </span>
          <span>{restaurant.estimatedDeliveryTime || 'Delivery time varies'}</span>
          <span>Delivery {formatCurrency(restaurant.deliveryFee)}</span>
        </div>
      </div>
    </Link>
  );
}

export default HomeRestaurantCard;
