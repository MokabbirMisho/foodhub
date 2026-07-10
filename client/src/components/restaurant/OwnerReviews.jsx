import { useEffect, useState } from 'react';
import {
  deleteOwnerReply,
  getMyRestaurantReviews,
  replyToReview,
} from '../../services/reviewService';

const ratingOptions = ['all', 5, 4, 3, 2, 1];
const replyOptions = [
  ['all', 'All'],
  ['true', 'Replied'],
  ['false', 'Not replied'],
];

const renderStars = (rating) => {
  return '★'.repeat(Number(rating || 0)) + '☆'.repeat(5 - Number(rating || 0));
};

function OwnerReviews() {
  const [reviews, setReviews] = useState([]);
  const [filters, setFilters] = useState({
    rating: 'all',
    replied: 'all',
    search: '',
  });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadReviews = async (nextFilters = filters) => {
    try {
      setError('');
      setIsLoading(true);

      const params = {};

      if (nextFilters.rating !== 'all') {
        params.rating = nextFilters.rating;
      }

      if (nextFilters.replied !== 'all') {
        params.replied = nextFilters.replied;
      }

      if (nextFilters.search.trim()) {
        params.search = nextFilters.search.trim();
      }

      const response = await getMyRestaurantReviews(params);
      setReviews(response.data.reviews || []);
    } catch (requestError) {
      setError(requestError.message);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const applyFilters = (event) => {
    event?.preventDefault();
    loadReviews(filters);
  };

  const startReply = (review) => {
    setEditingReviewId(review._id);
    setReplyMessage(review.ownerReply?.message || '');
    setError('');
    setSuccessMessage('');
  };

  const cancelReply = () => {
    setEditingReviewId(null);
    setReplyMessage('');
  };

  const saveReply = async (reviewId) => {
    if (!replyMessage.trim()) {
      setError('Reply message is required');
      return;
    }

    if (replyMessage.trim().length > 500) {
      setError('Reply message cannot exceed 500 characters');
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setIsSaving(true);
      const response = await replyToReview(reviewId, replyMessage);
      const updatedReview = response.data.review;

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review._id === updatedReview._id ? updatedReview : review,
        ),
      );
      setEditingReviewId(null);
      setReplyMessage('');
      setSuccessMessage('Reply saved successfully');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeReply = async (reviewId) => {
    const shouldRemove = window.confirm('Remove this reply?');

    if (!shouldRemove) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setIsSaving(true);
      const response = await deleteOwnerReply(reviewId);
      const updatedReview = response.data.review;

      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review._id === updatedReview._id ? updatedReview : review,
        ),
      );
      setSuccessMessage('Reply removed successfully');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="fh-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="fh-eyebrow">Customer feedback</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-900">Reviews</h2>
            <p className="mt-2 text-sm text-zinc-600">
              View customer feedback and reply to reviews for your restaurant.
            </p>
          </div>

          <form
            className="grid gap-3 md:grid-cols-[160px_160px_minmax(180px,1fr)_auto]"
            onSubmit={applyFilters}
          >
            <label>
              <span className="text-xs font-semibold text-zinc-600">Rating</span>
              <select
                className="fh-input mt-1"
                onChange={(event) => updateFilter('rating', event.target.value)}
                value={filters.rating}
              >
                {ratingOptions.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating === 'all' ? 'All ratings' : `${rating} stars`}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">Reply</span>
              <select
                className="fh-input mt-1"
                onChange={(event) => updateFilter('replied', event.target.value)}
                value={filters.replied}
              >
                {replyOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold text-zinc-600">Search</span>
              <input
                className="fh-input mt-1"
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search review comments"
                value={filters.search}
              />
            </label>

            <button className="fh-btn-primary self-end" type="submit">
              Apply
            </button>
          </form>
        </div>

        {error && <p className="fh-alert-error mt-5">{error}</p>}
        {successMessage && (
          <p className="fh-alert-success mt-5">{successMessage}</p>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div className="fh-card h-40 animate-pulse" key={item} />
          ))}
        </div>
      )}

      {!isLoading && !error && reviews.length === 0 && (
        <div className="fh-card p-8 text-center text-zinc-600">
          No reviews yet.
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => {
            const hasReply = Boolean(review.ownerReply?.message);
            const isEditing = editingReviewId === review._id;

            return (
              <article className="fh-card p-6" key={review._id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {review.customer?.name || 'Customer'}
                    </p>
                    {review.customer?.email && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {review.customer.email}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-zinc-500">
                      {new Date(review.createdAt).toLocaleString()}
                      {review.order?._id
                        ? ` · Order #${String(review.order._id).slice(-8)}`
                        : ''}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-amber-400">
                    {renderStars(review.rating)}
                  </span>
                </div>

                <p className="mt-4 leading-7 text-zinc-700">
                  {review.comment || 'No written comment.'}
                </p>

                {hasReply && !isEditing && (
                  <div className="mt-5 rounded-2xl border border-stone-200 bg-[#F8F7F4] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#FF4F2E]">
                      Owner reply
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-700">
                      {review.ownerReply.message}
                    </p>
                    {review.ownerReply.repliedAt && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Replied{' '}
                        {new Date(review.ownerReply.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <div className="mt-5 rounded-2xl border border-stone-200 bg-[#F8F7F4] p-4">
                    <label>
                      <span className="text-sm font-semibold text-zinc-700">
                        Reply message
                      </span>
                      <textarea
                        className="fh-input mt-2 min-h-28"
                        maxLength={500}
                        onChange={(event) => setReplyMessage(event.target.value)}
                        value={replyMessage}
                      />
                    </label>
                    <p className="mt-2 text-xs text-zinc-500">
                      {replyMessage.length}/500 characters
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        className="fh-btn-primary"
                        disabled={isSaving}
                        onClick={() => saveReply(review._id)}
                        type="button"
                      >
                        {isSaving ? 'Saving...' : 'Save Reply'}
                      </button>
                      <button
                        className="fh-btn-secondary"
                        onClick={cancelReply}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      className="fh-btn-secondary"
                      onClick={() => startReply(review)}
                      type="button"
                    >
                      {hasReply ? 'Edit Reply' : 'Reply'}
                    </button>
                    {hasReply && (
                      <button
                        className="fh-btn-danger"
                        disabled={isSaving}
                        onClick={() => removeReply(review._id)}
                        type="button"
                      >
                        Remove Reply
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default OwnerReviews;
