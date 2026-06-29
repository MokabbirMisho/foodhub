import { useState } from 'react';

function ReviewForm({
  initialComment = '',
  initialRating = 5,
  mode = 'create',
  onCancel,
  onSubmit,
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        rating,
        comment: comment.trim(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 rounded-xl bg-orange-50 p-4" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-700">Rating</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                rating === value
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-orange-100'
              }`}
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              {'★'.repeat(value)}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Comment</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-orange-500"
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share what you liked about your order"
          value={comment}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? 'Submitting...'
            : mode === 'edit'
              ? 'Update Review'
              : 'Submit Review'}
        </button>

        {onCancel && (
          <button
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-white"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReviewForm;
