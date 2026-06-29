import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { useCart } from '../../context/CartContext';
import { getPublicRestaurantFoodItems } from '../../services/foodService';
import { getRestaurantById } from '../../services/restaurantService';
import { getRestaurantReviews } from '../../services/reviewService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;

const renderStars = (rating) => {
  return '★'.repeat(Number(rating || 0)) + '☆'.repeat(5 - Number(rating || 0));
};

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

function RestaurantDetailsPage() {
  const { id } = useParams();
  const {
    addToCart,
    cartItems,
    decreaseQuantity,
    getCartCount,
    increaseQuantity,
  } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [reviews, setReviews] = useState([]);
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

  const getCartItem = (foodItemId) => {
    return cartItems.find((item) => item._id === foodItemId);
  };

  const handleAddToCart = (foodItem) => {
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
    <main className="min-h-screen bg-orange-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <BackButton />
          <Link
            className="inline-flex w-fit rounded-md bg-white px-4 py-2 font-semibold text-slate-900 shadow-sm hover:bg-orange-50"
            to="/cart"
          >
            Cart ({getCartCount()})
          </Link>
        </div>

        {isLoading && (
          <p className="rounded-lg bg-white p-6 text-slate-700 shadow-sm">
            Loading restaurant...
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {!isLoading && !error && restaurant && (
          <>
            <header className="rounded-xl bg-white p-6 shadow-sm">
              {restaurant.coverImage ? (
                <img
                  alt={`${restaurant.name} cover`}
                  className="mb-6 h-64 w-full rounded-xl object-cover"
                  src={restaurant.coverImage}
                />
              ) : (
                <div className="mb-6 flex h-64 w-full items-center justify-center rounded-xl bg-orange-100 text-lg font-semibold text-orange-700">
                  FoodHub Restaurant
                </div>
              )}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {restaurant.logo && (
                    <img
                      alt={`${restaurant.name} logo`}
                      className="h-20 w-20 rounded-full object-cover"
                      src={restaurant.logo}
                    />
                  )}
                  <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
                    Restaurant Details
                  </p>
                  <h1 className="mt-2 text-4xl font-bold">{restaurant.name}</h1>
                  <p className="mt-4 max-w-3xl leading-7 text-slate-700">
                    {restaurant.description || 'No description provided.'}
                  </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    restaurant.isOpen
                      ? 'bg-green-50 text-green-700'
                      : 'bg-orange-50 text-slate-600'
                  }`}
                >
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </header>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Information</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Phone" value={restaurant.phone} />
                <DetailItem label="Email" value={restaurant.email} />
                <DetailItem
                  label="Address"
                  value={[
                    restaurant.address?.street,
                    restaurant.address?.postalCode,
                    restaurant.address?.city,
                    restaurant.address?.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                />
                <DetailItem
                  label="Cuisine types"
                  value={restaurant.cuisineTypes?.join(', ')}
                />
                <DetailItem
                  label="Delivery fee"
                  value={formatCurrency(restaurant.deliveryFee)}
                />
                <DetailItem
                  label="Minimum order"
                  value={formatCurrency(restaurant.minimumOrderAmount)}
                />
                <DetailItem
                  label="Estimated delivery"
                  value={restaurant.estimatedDeliveryTime}
                />
                <DetailItem label="Rating" value={restaurant.ratingAverage || 0} />
                <DetailItem
                  label="Review count"
                  value={`${restaurant.ratingCount || 0} reviews`}
                />
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Opening hours</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  'monday',
                  'tuesday',
                  'wednesday',
                  'thursday',
                  'friday',
                  'saturday',
                  'sunday',
                ].map((day) => (
                  <DetailItem
                    key={day}
                    label={day}
                    value={restaurant.openingHours?.[day]}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">Menu</h2>

              {cartMessage && (
                <p
                  className={`mt-4 rounded-md px-3 py-2 text-sm ${
                    cartMessage.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {cartMessage.text}
                </p>
              )}

              {isMenuLoading && (
                <p className="mt-4 text-slate-700">Loading menu...</p>
              )}

              {menuError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {menuError}
                </p>
              )}

              {!isMenuLoading && !menuError && foodItems.length === 0 && (
                <p className="mt-4 rounded-lg bg-orange-50 p-4 text-orange-900">
                  Menu will be available soon.
                </p>
              )}

              {!isMenuLoading && !menuError && foodItems.length > 0 && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {foodItems.map((foodItem) => (
                    <article
                      className="overflow-hidden rounded-xl border border-orange-100 bg-orange-50"
                      key={foodItem._id}
                    >
                      {foodItem.image ? (
                        <img
                          alt={foodItem.name}
                          className="h-40 w-full object-cover"
                          src={foodItem.image}
                        />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-white text-sm font-semibold text-orange-700">
                          Food image coming soon
                        </div>
                      )}
                      <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                        {foodItem.category}
                      </p>
                      <h3 className="mt-2 text-xl font-bold">{foodItem.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {foodItem.description || 'No description provided.'}
                      </p>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700">
                        <p>Price: {formatCurrency(foodItem.price)}</p>
                        <p>
                          Discount:{' '}
                          {foodItem.discountPrice !== null
                            ? formatCurrency(foodItem.discountPrice)
                            : 'None'}
                        </p>
                        <p>Preparation: {foodItem.preparationTime || 20} min</p>
                        <p>
                          {foodItem.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
                        </p>
                      </div>

                      {foodItem.tags?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {foodItem.tags.map((tag) => (
                            <span
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700"
                              key={tag}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {getCartItem(foodItem._id) ? (
                        <div className="mt-5 flex w-fit items-center gap-2 rounded-md bg-white p-1">
                          <button
                            className="h-9 w-9 rounded-md border border-slate-300 font-bold hover:bg-orange-50"
                            onClick={() => decreaseQuantity(foodItem._id)}
                            type="button"
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center font-semibold">
                            {getCartItem(foodItem._id).quantity}
                          </span>
                          <button
                            className="h-9 w-9 rounded-md border border-slate-300 font-bold hover:bg-orange-50"
                            onClick={() => increaseQuantity(foodItem._id)}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          className="mt-5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                          onClick={() => handleAddToCart(foodItem)}
                          type="button"
                        >
                          Add to Cart
                        </button>
                      )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  <p className="mt-2 text-slate-700">
                    {restaurant.ratingCount
                      ? `Average rating ${restaurant.ratingAverage} from ${restaurant.ratingCount} reviews`
                      : 'No ratings yet'}
                  </p>
                </div>

                <label className="block w-full md:w-48">
                  <span className="text-sm font-medium text-slate-700">
                    Filter by rating
                  </span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
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
                <p className="mt-4 text-slate-700">Loading reviews...</p>
              )}

              {reviewsError && (
                <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {reviewsError}
                </p>
              )}

              {!isReviewsLoading && !reviewsError && reviews.length === 0 && (
                <p className="mt-4 rounded-lg bg-orange-50 p-4 text-orange-900">
                  No reviews yet.
                </p>
              )}

              {!isReviewsLoading && !reviewsError && reviews.length > 0 && (
                <div className="mt-5 space-y-4">
                  {reviews.map((review) => (
                    <article
                      className="rounded-xl border border-orange-100 bg-orange-50 p-5"
                      key={review._id}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-center gap-3">
                          {review.customer?.avatar ? (
                            <img
                              alt={review.customer.name}
                              className="h-10 w-10 rounded-full object-cover"
                              src={review.customer.avatar}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-orange-700">
                              {(review.customer?.name || 'C').charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">
                              {review.customer?.name || 'Customer'}
                            </p>
                            <p className="text-sm text-slate-600">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-orange-700">
                          {renderStars(review.rating)}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="mt-4 leading-6 text-slate-700">
                          {review.comment}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default RestaurantDetailsPage;
