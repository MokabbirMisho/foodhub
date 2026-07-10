import { useEffect, useState } from 'react';
import {
  approveRestaurant,
  getAdminRestaurants,
  rejectRestaurant,
} from '../../services/adminRestaurantService';

function AdminRestaurantsPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRestaurants = async (status = approvalStatus) => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getAdminRestaurants(
        status ? { approvalStatus: status } : undefined,
      );
      setRestaurants(response.data.restaurants || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants('');
  }, []);

  const updateRestaurant = async (restaurant, action) => {
    try {
      setError('');
      setMessage('');
      if (action === 'approve') {
        await approveRestaurant(restaurant._id);
      } else {
        await rejectRestaurant(restaurant._id);
      }
      setMessage(
        action === 'approve'
          ? 'Restaurant approved successfully'
          : 'Restaurant rejected successfully',
      );
      await loadRestaurants();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="space-y-5">
      <section className="fh-card flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Admin Panel
          </p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900">
            Restaurants
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Review, approve, and manage restaurant partners.
          </p>
        </div>
        <label className="w-full sm:w-56">
          <span className="text-sm font-medium text-zinc-700">Status</span>
          <select
            className="fh-input mt-1"
            onChange={(event) => {
              setApprovalStatus(event.target.value);
              loadRestaurants(event.target.value);
            }}
            value={approvalStatus}
          >
            <option value="">All restaurants</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Inactive / rejected</option>
          </select>
        </label>
      </section>

      {message && <p className="fh-alert-success">{message}</p>}
      {error && <p className="fh-alert-error">{error}</p>}
      {isLoading && <p className="fh-card p-6">Loading restaurants...</p>}

      {!isLoading && !error && restaurants.length === 0 && (
        <p className="fh-card p-6 text-zinc-600">No restaurants found.</p>
      )}

      {!isLoading && restaurants.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {restaurants.map((restaurant) => (
            <article className="fh-card p-6" key={restaurant._id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {restaurant.owner?.name || 'Owner unavailable'} ·{' '}
                    {restaurant.owner?.email || 'Email unavailable'}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    restaurant.isApproved && restaurant.isActive
                      ? 'bg-green-50 text-green-700'
                      : restaurant.isActive
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-red-50 text-red-700'
                  }`}
                >
                  {restaurant.isApproved && restaurant.isActive
                    ? 'Approved'
                    : restaurant.isActive
                      ? 'Pending'
                      : 'Inactive'}
                </span>
              </div>
              <p className="mt-4 text-sm text-zinc-700">
                {[restaurant.address?.city, restaurant.address?.country]
                  .filter(Boolean)
                  .join(', ') || 'Address unavailable'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="fh-btn-primary"
                  onClick={() => updateRestaurant(restaurant, 'approve')}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="rounded-md border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                  onClick={() => updateRestaurant(restaurant, 'reject')}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminRestaurantsPanel;
