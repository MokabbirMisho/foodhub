import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { getPublicRestaurantFoodItems } from '../../services/foodService';
import { getRestaurantById } from '../../services/restaurantService';
import { getRestaurantReviews } from '../../services/reviewService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const getEffectivePrice = (item) => {
  if (item.discountPrice !== null && item.discountPrice !== undefined) {
    return Number(item.discountPrice);
  }

  return Number(item.price || 0);
};

const formatOpeningHours = (hours) => {
  if (typeof hours === 'string') {
    return hours || 'Not provided';
  }

  if (!hours) {
    return 'Not provided';
  }

  return hours.isClosed ? 'Closed' : `${hours.open} - ${hours.close}`;
};

const renderStars = (rating) => {
  const roundedRating = Math.round(Number(rating || 0));
  return '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
};

const makeCategoryId = (category) =>
  `menu-category-${String(category || 'menu')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

const getRestaurantAvailability = (restaurant) => {
  const availability = restaurant?.availability;
  const isOpen =
    availability?.isAvailableNow !== undefined
      ? availability.isAvailableNow
      : restaurant?.isOpen !== false;

  return {
    isOpen,
    label: availability?.reason || (isOpen ? 'Open now' : 'Closed'),
    todayHours: availability?.todayHours,
    temporaryReason:
      restaurant?.temporaryClosedReason ||
      availability?.temporaryClosedReason ||
      restaurant?.availabilityNote,
  };
};

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-stone-100/70 ${className}`}
    />
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-lg">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <p className="text-sm font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function FoodImage({ image, name, className = '' }) {
  if (image) {
    return (
      <img
        alt={name}
        className={`bg-stone-50 object-cover ${className}`}
        src={image}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-white to-stone-100 text-center text-xs font-bold text-[#FF4F2E] ${className}`}
    >
      FoodHub
    </div>
  );
}

function FoodItemCard({
  foodItem,
  cartItem,
  isOrderingAvailable,
  onAddToCart,
  onDecrease,
  onIncrease,
}) {
  const isAvailable = foodItem.isAvailable !== false;
  const discountPrice =
    foodItem.discountPrice !== null && foodItem.discountPrice !== undefined;

  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="grid min-h-full grid-cols-[1fr_132px] gap-4 p-4 sm:grid-cols-[1fr_168px] sm:p-5">
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#FF4F2E]">
              {foodItem.category || 'Menu'}
            </span>
            {foodItem.isVegetarian && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Vegetarian
              </span>
            )}
            {!isAvailable && (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-zinc-600">
                Unavailable
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-black text-zinc-900">
            {foodItem.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
            {foodItem.description || 'Freshly prepared by this restaurant.'}
          </p>

          {foodItem.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {foodItem.tags.slice(0, 4).map((tag) => (
                <span
                  className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-semibold text-zinc-500"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-4">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-xl font-black text-zinc-900">
                {formatCurrency(getEffectivePrice(foodItem))}
              </span>
              {discountPrice && (
                <span className="pb-0.5 text-sm font-semibold text-zinc-400 line-through">
                  {formatCurrency(foodItem.price)}
                </span>
              )}
              <span className="pb-0.5 text-sm text-zinc-500">
                {foodItem.preparationTime || 20} min
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <FoodImage
            className="h-32 w-full rounded-2xl sm:h-40"
            image={foodItem.image}
            name={foodItem.name}
          />

          {cartItem ? (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-stone-200 bg-white p-1 shadow-lg">
              <button
                aria-label={`Decrease ${foodItem.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-50 text-lg font-black text-[#FF4F2E] hover:bg-stone-100"
                onClick={() => onDecrease(foodItem._id)}
                type="button"
              >
                -
              </button>
              <span className="min-w-6 text-center text-sm font-black text-zinc-900">
                {cartItem.quantity}
              </span>
              <button
                aria-label={`Increase ${foodItem.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF4F2E] text-lg font-black text-white hover:bg-[#E63E22] disabled:bg-stone-300"
                disabled={!isOrderingAvailable || !isAvailable}
                onClick={() => onIncrease(foodItem._id)}
                type="button"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="absolute bottom-2 right-2 inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#FF4F2E] px-3 text-sm font-black text-white shadow-lg hover:bg-[#E63E22] disabled:bg-stone-300"
              disabled={!isOrderingAvailable || !isAvailable}
              onClick={() => onAddToCart(foodItem)}
              type="button"
            >
              {!isAvailable
                ? 'Unavailable'
                : isOrderingAvailable
                  ? '+'
                  : 'Restaurant closed'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CartSummary({ cartCount, cartRestaurant, getSubtotal, getDeliveryFee, getTotal }) {
  return (
    <aside className="sticky top-28 hidden h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:block">
      <h2 className="text-lg font-black text-zinc-900">Your order</h2>

      {cartCount > 0 ? (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {cartRestaurant?.name || 'Selected restaurant'}
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Items</span>
              <span className="font-bold text-zinc-900">{cartCount}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-bold text-zinc-900">
                {formatCurrency(getSubtotal())}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Delivery fee</span>
              <span className="font-bold text-zinc-900">
                {formatCurrency(getDeliveryFee())}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-black text-zinc-900">
              <span>Total</span>
              <span>{formatCurrency(getTotal())}</span>
            </div>
          </div>
          <Link className="fh-btn-primary mt-5 w-full rounded-full" to="/cart">
            View cart
          </Link>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm text-zinc-600">
          <p className="font-bold text-zinc-900">Your cart is empty</p>
          <p className="mt-1">Add items to start your order.</p>
        </div>
      )}
    </aside>
  );
}

function RestaurantDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    addToCart,
    cartItems,
    decreaseQuantity,
    getCartCount,
    getDeliveryFee,
    getSubtotal,
    getTotal,
    increaseQuantity,
    restaurant: cartRestaurant,
  } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Popular');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuError, setMenuError] = useState('');
  const [reviewsError, setReviewsError] = useState('');
  const [cartMessage, setCartMessage] = useState(null);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setError('');
        setIsLoading(true);
        const response = await getRestaurantById(id);
        setRestaurant(response.data.restaurant);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurant();
  }, [id]);

  const loadReviews = async (rating = reviewRatingFilter) => {
    try {
      setReviewsError('');
      setIsReviewsLoading(true);
      const params = rating === 'all' ? undefined : { rating };
      const response = await getRestaurantReviews(id, params);
      setReviews(response.data.reviews || []);
    } catch (error) {
      setReviewsError(error.message);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews('all');
  }, [id]);

  const handleReviewFilterChange = (event) => {
    const nextRating = event.target.value;
    setReviewRatingFilter(nextRating);
    loadReviews(nextRating);
  };

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setMenuError('');
        setIsMenuLoading(true);
        setActiveCategory('Popular');
        const response = await getPublicRestaurantFoodItems(id);
        setFoodItems(response.data.foodItems || []);
      } catch (error) {
        setMenuError(error.message);
      } finally {
        setIsMenuLoading(false);
      }
    };

    loadMenu();
  }, [id]);

  const availability = useMemo(
    () => getRestaurantAvailability(restaurant),
    [restaurant],
  );

  const isOrderingAvailable = availability.isOpen;
  const cartCount = getCartCount();

  const filteredFoodItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();

    if (!query) {
      return foodItems;
    }

    return foodItems.filter((foodItem) => {
      const searchable = [
        foodItem.name,
        foodItem.description,
        foodItem.category,
        ...(foodItem.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [foodItems, menuSearch]);

  const popularFoodItems = filteredFoodItems.slice(0, 6);

  const groupedFoodItems = useMemo(() => {
    return filteredFoodItems.reduce((groups, foodItem) => {
      const category = foodItem.category || 'Menu';
      groups[category] = groups[category] || [];
      groups[category].push(foodItem);
      return groups;
    }, {});
  }, [filteredFoodItems]);

  const categoryNames = Object.keys(groupedFoodItems);
  const categoryNavItems = [
    ...(popularFoodItems.length > 0 ? ['Popular'] : []),
    ...categoryNames,
  ];

  const menuSections = [
    ...(popularFoodItems.length > 0
      ? [{ title: 'Popular', items: popularFoodItems }]
      : []),
    ...categoryNames.map((category) => ({
      title: category,
      items: groupedFoodItems[category],
    })),
  ];

  const getCartItem = (foodItemId) => {
    return cartItems.find((item) => item._id === foodItemId);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/restaurants');
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    document.getElementById(makeCategoryId(category))?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleAddToCart = (foodItem) => {
    if (!isOrderingAvailable) {
      setCartMessage({
        type: 'error',
        text: 'This restaurant is currently closed. You can browse the menu, but ordering is unavailable.',
      });
      return;
    }

    const result = addToCart(foodItem, {
      _id: restaurant._id,
      name: restaurant.name,
      deliveryFee: restaurant.deliveryFee,
    });

    setCartMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });
  };

  return (
    <main className="min-h-screen bg-[#F8F7F4] pb-24 text-zinc-900">
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="space-y-5">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-32 w-full" />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <SkeletonBlock className="h-44 w-full" key={item} />
                ))}
              </div>
              <SkeletonBlock className="hidden h-64 w-full lg:block" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-black text-red-700">
              Restaurant could not be loaded
            </p>
            <p className="mt-2 text-zinc-600">{error}</p>
            <Link className="fh-btn-primary mt-5 rounded-full" to="/restaurants">
              Browse restaurants
            </Link>
          </div>
        )}

        {!isLoading && !error && restaurant && (
          <>
            <header className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
              <div className="relative h-48 bg-gradient-to-br from-white via-stone-50 to-stone-100 sm:h-56 lg:h-72">
                <button
                  className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-zinc-900"
                  onClick={handleBack}
                  type="button"
                >
                  &larr; Back
                </button>
                {restaurant.coverImage ? (
                  <img
                    alt={`${restaurant.name} cover`}
                    className="h-full w-full object-cover"
                    src={restaurant.coverImage}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 via-white to-stone-100 text-xl font-black text-[#FF4F2E]">
                    FoodHub Restaurant
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                <span
                  className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-black shadow-sm ${
                    availability.isOpen
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {availability.label}
                </span>
              </div>

              <div className="relative px-5 pb-6 pt-5 sm:px-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="-mt-16 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-stone-50 shadow-lg">
                      {restaurant.logo ? (
                        <img
                          alt={`${restaurant.name} logo`}
                          className="h-full w-full object-cover"
                          src={restaurant.logo}
                        />
                      ) : (
                        <span className="text-3xl font-black text-[#FF4F2E]">
                          {restaurant.name?.charAt(0) || 'F'}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-2">
                        {restaurant.cuisineTypes?.slice(0, 4).map((cuisine) => (
                          <span
                            className="rounded-full bg-stone-50 px-3 py-1 text-xs font-bold text-[#FF4F2E]"
                            key={cuisine}
                          >
                            {cuisine}
                          </span>
                        ))}
                      </div>
                      <h1 className="mt-3 text-3xl font-black text-zinc-900 sm:text-4xl">
                        {restaurant.name}
                      </h1>
                      <p className="mt-3 max-w-3xl leading-7 text-zinc-600">
                        {restaurant.description ||
                          'Fresh meals, local flavor, and easy ordering with FoodHub.'}
                      </p>
                    </div>
                  </div>
                </div>

                {availability.todayHours && (
                  <p className="mt-5 text-sm capitalize text-zinc-600">
                    Today ({availability.todayHours.day}):{' '}
                    {availability.todayHours.isClosed
                      ? 'Closed'
                      : `${availability.todayHours.open} - ${availability.todayHours.close}`}
                  </p>
                )}
              </div>
            </header>

            <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <InfoPill
                icon="⏱"
                label="Delivery time"
                value={restaurant.estimatedDeliveryTime || '25-35 min'}
              />
              <InfoPill
                icon="🚚"
                label="Delivery fee"
                value={formatCurrency(restaurant.deliveryFee)}
              />
              <InfoPill
                icon="🧾"
                label="Minimum order"
                value={formatCurrency(restaurant.minimumOrderAmount)}
              />
              <InfoPill
                icon="★"
                label="Rating"
                value={`${Number(restaurant.ratingAverage || 0).toFixed(1)} (${restaurant.ratingCount || 0})`}
              />
              <InfoPill
                icon={availability.isOpen ? '🟢' : '🔴'}
                label="Status"
                value={availability.isOpen ? 'Open now' : 'Closed'}
              />
            </section>

            {!availability.isOpen && (
              <section className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-5 text-zinc-900 shadow-sm">
                <p className="font-black">
                  This restaurant is currently closed. You can browse the menu,
                  but ordering is unavailable.
                </p>
                {availability.temporaryReason && (
                  <p className="mt-2 text-sm text-zinc-900">
                    {availability.temporaryReason}
                  </p>
                )}
              </section>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-6">
                <section className="sticky top-[73px] z-20 rounded-3xl border border-stone-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <label className="relative flex-1">
                      <span className="sr-only">Search menu items</span>
                      <input
                        className="w-full rounded-full border border-stone-200 bg-stone-50 px-5 py-3 pr-11 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
                        onChange={(event) => setMenuSearch(event.target.value)}
                        placeholder="Search menu items..."
                        value={menuSearch}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      >
                        🔍
                      </span>
                    </label>

                    {categoryNavItems.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-xl">
                        {categoryNavItems.map((category) => (
                          <button
                            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black capitalize ${
                              activeCategory === category
                                ? 'border-[#FF4F2E] bg-[#FF4F2E] text-white shadow-sm'
                                : 'border-stone-200 bg-white text-zinc-600 hover:bg-stone-50'
                            }`}
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            type="button"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {cartMessage && (
                  <p
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                      cartMessage.type === 'success'
                        ? 'border-green-100 bg-green-50 text-green-700'
                        : 'border-red-100 bg-red-50 text-red-700'
                    }`}
                  >
                    {cartMessage.text}
                  </p>
                )}

                {isMenuLoading && (
                  <section className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <SkeletonBlock className="h-44 w-full" key={item} />
                    ))}
                  </section>
                )}

                {menuError && (
                  <p className="rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
                    {menuError}
                  </p>
                )}

                {!isMenuLoading && !menuError && foodItems.length === 0 && (
                  <p className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-zinc-600 shadow-sm">
                    No menu items available right now.
                  </p>
                )}

                {!isMenuLoading &&
                  !menuError &&
                  foodItems.length > 0 &&
                  filteredFoodItems.length === 0 && (
                    <p className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-zinc-600 shadow-sm">
                      No menu items match your search.
                    </p>
                  )}

                {!isMenuLoading &&
                  !menuError &&
                  filteredFoodItems.length > 0 &&
                  menuSections.map((section) => (
                    <section
                      className="scroll-mt-40"
                      id={makeCategoryId(section.title)}
                      key={section.title}
                    >
                      <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black text-zinc-900">
                            {section.title}
                          </h2>
                          <p className="mt-1 text-sm text-zinc-500">
                            {section.items.length} item
                            {section.items.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        {section.items.map((foodItem) => (
                          <FoodItemCard
                            cartItem={getCartItem(foodItem._id)}
                            foodItem={foodItem}
                            isOrderingAvailable={isOrderingAvailable}
                            key={`${section.title}-${foodItem._id}`}
                            onAddToCart={handleAddToCart}
                            onDecrease={decreaseQuantity}
                            onIncrease={increaseQuantity}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-zinc-900">
                        Reviews
                      </h2>
                      <p className="mt-2 text-zinc-600">
                        {restaurant.ratingCount
                          ? `Average rating ${Number(restaurant.ratingAverage || 0).toFixed(1)} from ${restaurant.ratingCount} reviews`
                          : 'No ratings yet'}
                      </p>
                    </div>

                    <label className="block w-full md:w-48">
                      <span className="text-sm font-bold text-zinc-700">
                        Filter by rating
                      </span>
                      <select
                        className="fh-input mt-1"
                        onChange={handleReviewFilterChange}
                        value={reviewRatingFilter}
                      >
                        <option value="all">all</option>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>
                            {rating} stars
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {isReviewsLoading && (
                    <p className="mt-4 text-zinc-600">Loading reviews...</p>
                  )}

                  {reviewsError && (
                    <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {reviewsError}
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length === 0 && (
                    <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-zinc-900">
                      No reviews yet.
                    </p>
                  )}

                  {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                    <div className="mt-5 space-y-4">
                      {reviews.map((review) => (
                        <article
                          className="rounded-2xl border border-stone-200 bg-[#F8F7F4] p-5"
                          key={review._id}
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-center gap-3">
                              {review.customer?.avatar ? (
                                <img
                                  alt={review.customer.name}
                                  className="h-11 w-11 rounded-full object-cover"
                                  src={review.customer.avatar}
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-[#FF4F2E]">
                                  {(review.customer?.name || 'C').charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-zinc-900">
                                  {review.customer?.name || 'Customer'}
                                </p>
                                <p className="text-sm text-zinc-500">
                                  {new Date(
                                    review.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <span className="text-sm font-bold text-[#FF4F2E]">
                              {renderStars(review.rating)}
                            </span>
                          </div>

                          {review.comment && (
                            <p className="mt-4 leading-6 text-zinc-600">
                              {review.comment}
                            </p>
                          )}

                          {review.ownerReply?.message && (
                            <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#FF4F2E]">
                                Response from restaurant
                              </p>
                              <p className="mt-2 text-sm leading-6 text-zinc-700">
                                {review.ownerReply.message}
                              </p>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <CartSummary
                cartCount={cartCount}
                cartRestaurant={cartRestaurant}
                getDeliveryFee={getDeliveryFee}
                getSubtotal={getSubtotal}
                getTotal={getTotal}
              />
            </div>

            {cartCount > 0 && (
              <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(120,72,24,0.12)] backdrop-blur lg:hidden">
                <Link
                  className="mx-auto flex max-w-xl items-center justify-between rounded-full bg-[#FF4F2E] px-5 py-3 font-black text-white shadow-lg"
                  to="/cart"
                >
                  <span>
                    View cart • {cartCount} item{cartCount === 1 ? '' : 's'}
                  </span>
                  <span>{formatCurrency(getTotal())}</span>
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default RestaurantDetailsPage;
