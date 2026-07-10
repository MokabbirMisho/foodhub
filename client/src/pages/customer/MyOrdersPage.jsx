import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import ReviewForm from '../../components/reviews/ReviewForm';
import { cancelMyOrder, getMyOrders } from '../../services/orderService';
import { createReview, getMyReviews } from '../../services/reviewService';
import {
  offSocketEvent,
  onSocketEvent,
} from '../../services/socketService';

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo Online Payment' : 'Cash on Delivery';
const formatPaymentStatus = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unpaid';

const statusClasses = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-stone-50 text-[#FF4F2E]',
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeReviewOrderId, setActiveReviewOrderId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      setError('');
      setIsLoading(true);
      const [ordersResponse, reviewsResponse] = await Promise.all([
        getMyOrders(),
        getMyReviews(),
      ]);
      setOrders(ordersResponse.data.orders || []);
      setReviews(reviewsResponse.data.reviews || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getReviewedOrderIds = () => {
    return new Set(
      reviews
        .map((review) => review.order?._id || review.order)
        .filter(Boolean)
        .map(String),
    );
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const handleOrderStatusUpdate = () => {
      loadOrders();
    };

    onSocketEvent('order_status_updated', handleOrderStatusUpdate);
    return () =>
      offSocketEvent('order_status_updated', handleOrderStatusUpdate);
  }, []);

  const handleCancelOrder = async (orderId) => {
    const shouldCancel = window.confirm('Cancel this order?');

    if (!shouldCancel) {
      return;
    }

    try {
      setError('');
      await cancelMyOrder(orderId);
      await loadOrders();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateReview = async (orderId, formData) => {
    setError('');
    setSuccessMessage('');

    const response = await createReview({
      orderId,
      rating: formData.rating,
      comment: formData.comment,
    });

    setReviews((currentReviews) => [response.data.review, ...currentReviews]);
    setActiveReviewOrderId(null);
    setSuccessMessage('Review submitted successfully');
  };

  const reviewedOrderIds = getReviewedOrderIds();

  return (
    <main className="fh-page">
      <section className="mx-auto max-w-6xl space-y-6">
        <BackButton />
        <header className="fh-card flex flex-col gap-4 p-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
              FoodHub Orders
            </p>
            <h1 className="mt-2 text-4xl font-black">My Orders</h1>
          </div>

          <Link
            className="fh-btn-primary"
            to="/restaurants"
          >
            Browse Restaurants
          </Link>
        </header>

        {isLoading && (
          <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
            Loading orders...
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-6 text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-xl bg-green-50 p-6 text-green-700 shadow-sm">
            {successMessage}
          </p>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <section className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
            <p>You have no orders yet.</p>
          </section>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <article className="fh-card p-6" key={order._id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#FF4F2E]">
                      Order #{order._id.slice(-8)}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      {order.restaurant?.name || 'Restaurant'}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[order.status] || 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      Payment: {formatPaymentStatus(order.paymentStatus)}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                      {formatPaymentMethod(order.paymentMethod)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {order.items.map((item) => (
                    <div
                      className="flex justify-between gap-3 border-b border-zinc-100 pb-2 text-sm"
                      key={`${order._id}-${item.foodItem}`}
                    >
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
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

                {order.status === 'pending' && (
                  <button
                    className="mt-5 rounded-md border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => handleCancelOrder(order._id)}
                    type="button"
                  >
                    Cancel Order
                  </button>
                )}

                {['out_for_delivery', 'delivered'].includes(order.status) && (
                  <Link
                    className="mt-5 inline-flex rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                    to={`/orders/${order._id}/tracking`}
                  >
                    Track Order
                  </Link>
                )}

                {['pending', 'accepted', 'preparing', 'ready'].includes(
                  order.status,
                ) && (
                  <p className="mt-5 text-sm text-zinc-600">
                    Tracking will be available after rider accepts delivery.
                  </p>
                )}

                {order.status === 'delivered' && (
                  <div className="mt-5">
                    {reviewedOrderIds.has(String(order._id)) ? (
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                        Reviewed
                      </span>
                    ) : activeReviewOrderId === order._id ? (
                      <ReviewForm
                        onCancel={() => setActiveReviewOrderId(null)}
                        onSubmit={(formData) => handleCreateReview(order._id, formData)}
                      />
                    ) : (
                      <button
                        className="fh-btn-primary"
                        onClick={() => setActiveReviewOrderId(order._id)}
                        type="button"
                      >
                        Write Review
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyOrdersPage;
