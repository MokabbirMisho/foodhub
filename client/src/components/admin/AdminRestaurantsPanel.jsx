import { useEffect, useMemo, useState } from 'react';
import {
  approveRestaurant,
  getAdminRestaurantDetails,
  getAdminRestaurants,
  rejectRestaurant,
  updateRestaurantForAdmin,
} from '../../services/adminRestaurantService';

const itemsPerPage = 10;

const filtersInitialState = {
  search: '',
  approvalStatus: 'all',
  currentStatus: 'all',
  cuisine: '',
};

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : 'Not available';

const getApprovalStatus = (restaurant) => {
  if (restaurant.isApproved && restaurant.isActive) {
    return 'approved';
  }

  if (!restaurant.isApproved && !restaurant.isActive) {
    return 'rejected';
  }

  return 'pending';
};

const getCurrentStatus = (restaurant) => {
  if (restaurant.isTemporarilyPaused) {
    return 'paused';
  }

  if (restaurant.acceptsOnlineOrders === false) {
    return 'not_accepting';
  }

  if (restaurant.availability?.isAvailableNow || restaurant.isOpen) {
    return 'open';
  }

  return 'closed';
};

const approvalLabels = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
};

const currentStatusLabels = {
  open: 'Open',
  closed: 'Closed',
  paused: 'Paused',
  not_accepting: 'Not accepting orders',
};

const approvalClasses = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
};

const currentStatusClasses = {
  open: 'bg-green-50 text-green-700',
  closed: 'bg-zinc-100 text-zinc-700',
  paused: 'bg-amber-50 text-amber-700',
  not_accepting: 'bg-amber-50 text-amber-700',
};

function Badge({ children, className }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-zinc-900">
        {value || 'Not provided'}
      </p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="fh-card p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-900">{value}</p>
    </div>
  );
}

function maskIban(iban = '') {
  if (!iban) {
    return 'Not provided';
  }

  const compactIban = iban.replace(/\s/g, '');
  if (compactIban.length <= 8) {
    return compactIban;
  }

  return `${compactIban.slice(0, 4)} **** **** **** ${compactIban.slice(-4)}`;
}

function RestaurantEditForm({ onCancel, onSubmit, restaurant }) {
  const [formData, setFormData] = useState(() => ({
    name: restaurant.name || '',
    description: restaurant.description || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    street: restaurant.address?.street || '',
    city: restaurant.address?.city || '',
    postalCode: restaurant.address?.postalCode || '',
    country: restaurant.address?.country || 'Germany',
    cuisineTypes: restaurant.cuisineTypes?.join(', ') || '',
    minimumOrderAmount: restaurant.minimumOrderAmount ?? 0,
    deliveryFee: restaurant.deliveryFee ?? 0,
    estimatedDeliveryTime: restaurant.estimatedDeliveryTime || '',
    isOpen: restaurant.isOpen ?? true,
    isActive: restaurant.isActive ?? true,
    acceptsOnlineOrders: restaurant.acceptsOnlineOrders ?? true,
    autoAcceptOrders: restaurant.autoAcceptOrders ?? false,
    accountHolderName: restaurant.bankDetails?.accountHolderName || '',
    bankName: restaurant.bankDetails?.bankName || '',
    iban: restaurant.bankDetails?.iban || '',
    bic: restaurant.bankDetails?.bic || '',
    payoutEmail: restaurant.bankDetails?.payoutEmail || '',
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim() || 'Germany',
        },
        cuisineTypes: formData.cuisineTypes
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        minimumOrderAmount: Number(formData.minimumOrderAmount) || 0,
        deliveryFee: Number(formData.deliveryFee) || 0,
        estimatedDeliveryTime: formData.estimatedDeliveryTime.trim(),
        isOpen: formData.isOpen,
        isActive: formData.isActive,
        acceptsOnlineOrders: formData.acceptsOnlineOrders,
        autoAcceptOrders: formData.autoAcceptOrders,
        bankDetails: {
          accountHolderName: formData.accountHolderName.trim(),
          bankName: formData.bankName.trim(),
          iban: formData.iban.trim(),
          bic: formData.bic.trim(),
          payoutEmail: formData.payoutEmail.trim(),
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="fh-card space-y-5 p-6" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4F2E]">
          Admin Panel
        </p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">
          Edit Restaurant
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Update restaurant profile, operational status, and bank details.
        </p>
      </div>

      {error && <p className="fh-alert-error">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['name', 'Restaurant name'],
          ['phone', 'Phone'],
          ['email', 'Email'],
          ['estimatedDeliveryTime', 'Estimated delivery time'],
          ['street', 'Street'],
          ['city', 'City'],
          ['postalCode', 'Postal code'],
          ['country', 'Country'],
          ['cuisineTypes', 'Cuisine types'],
          ['minimumOrderAmount', 'Minimum order amount'],
          ['deliveryFee', 'Delivery fee'],
          ['accountHolderName', 'Account holder name'],
          ['bankName', 'Bank name'],
          ['iban', 'IBAN'],
          ['bic', 'BIC'],
          ['payoutEmail', 'Payout email'],
        ].map(([name, label]) => (
          <label className="block" key={name}>
            <span className="text-sm font-semibold text-zinc-700">{label}</span>
            <input
              className="fh-input mt-2"
              min={['minimumOrderAmount', 'deliveryFee'].includes(name) ? '0' : undefined}
              name={name}
              onChange={handleChange}
              step={['minimumOrderAmount', 'deliveryFee'].includes(name) ? '0.01' : undefined}
              type={['minimumOrderAmount', 'deliveryFee'].includes(name) ? 'number' : 'text'}
              value={formData[name]}
            />
          </label>
        ))}

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-zinc-700">
            Description
          </span>
          <textarea
            className="fh-input mt-2 min-h-24"
            name="description"
            onChange={handleChange}
            value={formData.description}
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['isOpen', 'Open'],
          ['isActive', 'Active'],
          ['acceptsOnlineOrders', 'Accepts online orders'],
          ['autoAcceptOrders', 'Auto-accept orders'],
        ].map(([name, label]) => (
          <label
            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-semibold text-zinc-700"
            key={name}
          >
            <input
              checked={formData[name]}
              className="h-4 w-4 accent-[#FF4F2E]"
              name={name}
              onChange={handleChange}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="fh-btn-primary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save Restaurant'}
        </button>
        <button
          className="rounded-xl border border-stone-200 px-5 py-3 font-semibold text-zinc-700 hover:bg-stone-50"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AdminRestaurantsPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState(filtersInitialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [details, setDetails] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [isIbanRevealed, setIsIbanRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRestaurants = async () => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getAdminRestaurants();
      setRestaurants(response.data.restaurants || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRestaurantDetails = async (restaurantId) => {
    try {
      setError('');
      setIsDetailsLoading(true);
      const response = await getAdminRestaurantDetails(restaurantId);
      setDetails(response.data);
      setSelectedRestaurantId(restaurantId);
      setActiveDetailTab('overview');
      setIsIbanRevealed(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();
    const cuisineValue = filters.cuisine.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const owner = restaurant.owner || {};
      const approvalStatus = getApprovalStatus(restaurant);
      const currentStatus = getCurrentStatus(restaurant);
      const searchable = [
        restaurant.name,
        owner.name,
        owner.email,
        restaurant.address?.city,
        ...(restaurant.cuisineTypes || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!searchValue || searchable.includes(searchValue)) &&
        (filters.approvalStatus === 'all' ||
          approvalStatus === filters.approvalStatus) &&
        (filters.currentStatus === 'all' ||
          currentStatus === filters.currentStatus) &&
        (!cuisineValue ||
          restaurant.cuisineTypes?.some((item) =>
            item.toLowerCase().includes(cuisineValue),
          ))
      );
    });
  }, [filters, restaurants]);

  const totalPages = Math.max(
    Math.ceil(filteredRestaurants.length / itemsPerPage),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredRestaurants.length,
  );
  const currentRestaurants = filteredRestaurants.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(filtersInitialState);
    setCurrentPage(1);
  };

  const updateRestaurantApproval = async (restaurant, action) => {
    try {
      setError('');
      setMessage('');
      if (action === 'approve') {
        await approveRestaurant(restaurant._id);
      } else if (window.confirm('Reject this restaurant?')) {
        await rejectRestaurant(restaurant._id);
      } else {
        return;
      }

      setMessage(
        action === 'approve'
          ? 'Restaurant approved successfully'
          : 'Restaurant rejected successfully',
      );
      await loadRestaurants();

      if (selectedRestaurantId === restaurant._id) {
        await loadRestaurantDetails(restaurant._id);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleAdminUpdate = async (payload) => {
    const response = await updateRestaurantForAdmin(selectedRestaurantId, payload);
    setMessage('Restaurant updated successfully');
    setDetails((current) => ({
      ...current,
      restaurant: response.data.restaurant,
    }));
    await loadRestaurants();
    await loadRestaurantDetails(selectedRestaurantId);
    setActiveDetailTab('details');
  };

  const renderPagination = () => {
    if (filteredRestaurants.length <= itemsPerPage) {
      return null;
    }

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          Showing {startIndex + 1}-{endIndex} of {filteredRestaurants.length}{' '}
          restaurants
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50 disabled:opacity-50"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            type="button"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  safeCurrentPage === page
                    ? 'border-[#FF4F2E] bg-[#FF4F2E] text-white'
                    : 'border-stone-200 bg-white text-zinc-700 hover:bg-stone-50'
                }`}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ),
          )}
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50 disabled:opacity-50"
            disabled={safeCurrentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="space-y-5">
      <section className="fh-card p-6">
        <div className="mb-4">
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

        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_160px_auto]">
          <input
            className="fh-input"
            name="search"
            onChange={handleFilterChange}
            placeholder="Search restaurant, owner email, or city"
            value={filters.search}
          />
          <select
            className="fh-input"
            name="approvalStatus"
            onChange={handleFilterChange}
            value={filters.approvalStatus}
          >
            <option value="all">All approvals</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="fh-input"
            name="currentStatus"
            onChange={handleFilterChange}
            value={filters.currentStatus}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="paused">Paused</option>
          </select>
          <input
            className="fh-input"
            name="cuisine"
            onChange={handleFilterChange}
            placeholder="Cuisine"
            value={filters.cuisine}
          />
          <button
            className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
            onClick={clearFilters}
            type="button"
          >
            Clear
          </button>
        </div>
      </section>

      {message && <p className="fh-alert-success">{message}</p>}
      {error && <p className="fh-alert-error">{error}</p>}
      {isLoading && <p className="fh-card p-6">Loading restaurants...</p>}

      {!isLoading && !error && filteredRestaurants.length === 0 && (
        <p className="fh-card p-6 text-zinc-600">No restaurants found.</p>
      )}

      {!isLoading && currentRestaurants.length > 0 && (
        <div className="space-y-3">
          {currentRestaurants.map((restaurant) => {
            const approvalStatus = getApprovalStatus(restaurant);
            const currentStatus = getCurrentStatus(restaurant);

            return (
              <article className="fh-card p-5" key={restaurant._id}>
                <div className="grid gap-4 lg:grid-cols-[1.5fr_150px_180px_1fr_auto] lg:items-center">
                  <button
                    className="flex min-w-0 items-center gap-3 text-left"
                    onClick={() => loadRestaurantDetails(restaurant._id)}
                    type="button"
                  >
                    {restaurant.logo ? (
                      <img
                        alt={`${restaurant.name} logo`}
                        className="h-12 w-12 rounded-2xl object-cover"
                        src={restaurant.logo}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-50 text-lg font-black text-[#FF4F2E]">
                        {restaurant.name?.charAt(0) || 'R'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-zinc-900">
                        {restaurant.name}
                      </h3>
                      <p className="truncate text-sm text-zinc-600">
                        {restaurant.cuisineTypes?.join(', ') || 'Cuisine not set'}
                      </p>
                    </div>
                  </button>

                  <Badge className={approvalClasses[approvalStatus]}>
                    {approvalLabels[approvalStatus]}
                  </Badge>
                  <Badge className={currentStatusClasses[currentStatus]}>
                    {currentStatusLabels[currentStatus]}
                  </Badge>
                  <div className="min-w-0 text-sm text-zinc-600">
                    <p className="truncate font-semibold text-zinc-900">
                      {restaurant.owner?.name || 'Owner unavailable'}
                    </p>
                    <p className="truncate">{restaurant.owner?.email}</p>
                    <p className="truncate">{restaurant.address?.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {approvalStatus !== 'approved' ? (
                      <button
                        className="fh-btn-primary"
                        onClick={() => updateRestaurantApproval(restaurant, 'approve')}
                        type="button"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => updateRestaurantApproval(restaurant, 'reject')}
                        type="button"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
                      onClick={() => loadRestaurantDetails(restaurant._id)}
                      type="button"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {renderPagination()}
    </div>
  );

  const renderDetails = () => {
    if (isDetailsLoading || !details) {
      return <p className="fh-card p-6">Loading restaurant details...</p>;
    }

    const { owner, performance, recentOrders, recentReviews, restaurant } =
      details;
    const approvalStatus = getApprovalStatus(restaurant);
    const currentStatus = getCurrentStatus(restaurant);
    const bankDetails = restaurant.bankDetails || {};
    const tabs = [
      ['overview', 'Overview'],
      ['details', 'Details'],
      ['orders', 'Orders'],
      ['reviews', 'Reviews'],
      ['edit', 'Edit'],
    ];

    return (
      <div className="space-y-5">
        <section className="fh-card p-6">
          <div className="mb-5">
            <button
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
              onClick={() => {
                setSelectedRestaurantId(null);
                setDetails(null);
                setMessage('');
                setError('');
              }}
              type="button"
            >
              ← Back to Restaurants
            </button>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              {restaurant.logo ? (
                <img
                  alt={`${restaurant.name} logo`}
                  className="h-16 w-16 rounded-2xl object-cover"
                  src={restaurant.logo}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 text-2xl font-black text-[#FF4F2E]">
                  {restaurant.name?.charAt(0) || 'R'}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4F2E]">
                  Restaurant Management
                </p>
                <h2 className="mt-1 text-3xl font-black text-zinc-900">
                  {restaurant.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {owner?.name || 'Owner unavailable'} · {owner?.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={approvalClasses[approvalStatus]}>
                    {approvalLabels[approvalStatus]}
                  </Badge>
                  <Badge className={currentStatusClasses[currentStatus]}>
                    {currentStatusLabels[currentStatus]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {approvalStatus !== 'approved' ? (
                <button
                  className="fh-btn-primary"
                  onClick={() => updateRestaurantApproval(restaurant, 'approve')}
                  type="button"
                >
                  Approve
                </button>
              ) : (
                <button
                  className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                  onClick={() => updateRestaurantApproval(restaurant, 'reject')}
                  type="button"
                >
                  Reject
                </button>
              )}
              <button
                className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
                onClick={() => setActiveDetailTab('edit')}
                type="button"
              >
                Edit
              </button>
            </div>
          </div>
        </section>

        {message && <p className="fh-alert-success">{message}</p>}
        {error && <p className="fh-alert-error">{error}</p>}

        <nav className="fh-card flex gap-2 overflow-x-auto p-2">
          {tabs.map(([tabId, label]) => (
            <button
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${
                activeDetailTab === tabId
                  ? 'bg-[#FF4F2E] text-white'
                  : 'text-zinc-700 hover:bg-stone-50 hover:text-[#FF4F2E]'
              }`}
              key={tabId}
              onClick={() => setActiveDetailTab(tabId)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {activeDetailTab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total orders" value={performance.totalOrders} />
            <MetricCard label="Delivered" value={performance.deliveredOrders} />
            <MetricCard label="Cancelled" value={performance.cancelledOrders} />
            <MetricCard label="Active orders" value={performance.activeOrders} />
            <MetricCard
              label="Delivered revenue"
              value={formatCurrency(performance.totalRevenue)}
            />
            <MetricCard
              label="Average order"
              value={formatCurrency(performance.averageOrderValue)}
            />
            <MetricCard
              label="Average rating"
              value={Number(performance.averageRating || 0).toFixed(1)}
            />
            <MetricCard label="Reviews" value={performance.totalReviews} />
          </div>
        )}

        {activeDetailTab === 'details' && (
          <div className="space-y-5">
            <section className="fh-card p-6">
              <h3 className="text-xl font-bold text-zinc-900">
                Account Details
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Restaurant ID" value={restaurant._id} />
                <DetailItem label="Owner" value={owner?.name} />
                <DetailItem label="Owner email" value={owner?.email} />
                <DetailItem label="Created" value={formatDate(restaurant.createdAt)} />
                <DetailItem label="Updated" value={formatDate(restaurant.updatedAt)} />
                <DetailItem
                  label="Online orders"
                  value={restaurant.acceptsOnlineOrders ? 'Enabled' : 'Disabled'}
                />
              </div>
            </section>

            <section className="fh-card p-6">
              <h3 className="text-xl font-bold text-zinc-900">
                Contact & Address
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Restaurant phone" value={restaurant.phone} />
                <DetailItem label="Restaurant email" value={restaurant.email} />
                <DetailItem label="Owner phone" value={owner?.phone} />
                <DetailItem label="Street" value={restaurant.address?.street} />
                <DetailItem label="City" value={restaurant.address?.city} />
                <DetailItem
                  label="Postal code"
                  value={restaurant.address?.postalCode}
                />
                <DetailItem label="Country" value={restaurant.address?.country} />
              </div>
            </section>

            <section className="fh-card p-6">
              <h3 className="text-xl font-bold text-zinc-900">Bank Details</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailItem
                  label="Account holder"
                  value={bankDetails.accountHolderName}
                />
                <DetailItem label="Bank name" value={bankDetails.bankName} />
                <DetailItem label="BIC" value={bankDetails.bic} />
                <DetailItem label="Payout email" value={bankDetails.payoutEmail} />
                <div className="rounded-2xl border border-stone-200 bg-white p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    IBAN
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-zinc-900">
                    {isIbanRevealed
                      ? bankDetails.iban || 'Not provided'
                      : maskIban(bankDetails.iban)}
                  </p>
                  {bankDetails.iban && (
                    <button
                      className="mt-3 text-sm font-semibold text-[#FF4F2E]"
                      onClick={() => setIsIbanRevealed((current) => !current)}
                      type="button"
                    >
                      {isIbanRevealed ? 'Hide IBAN' : 'Reveal IBAN'}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeDetailTab === 'orders' && (
          <section className="fh-card p-6">
            <h3 className="text-xl font-bold text-zinc-900">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <p className="mt-4 text-zinc-600">No orders found for this restaurant.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentOrders.map((order) => (
                  <div className="rounded-2xl border border-stone-200 p-4" key={order._id}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">
                          Order #{order._id.slice(-8)}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {order.customer?.name || 'Customer unavailable'} ·{' '}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-zinc-100 text-zinc-700">
                          {order.status}
                        </Badge>
                        <Badge className="bg-green-50 text-green-700">
                          {formatCurrency(order.totalAmount)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeDetailTab === 'reviews' && (
          <section className="fh-card p-6">
            <h3 className="text-xl font-bold text-zinc-900">Recent Reviews</h3>
            {recentReviews.length === 0 ? (
              <p className="mt-4 text-zinc-600">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentReviews.map((review) => (
                  <div className="rounded-2xl border border-stone-200 p-4" key={review._id}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">
                          {review.customer?.name || 'Customer'}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {review.comment || 'No comment provided.'}
                        </p>
                        {review.ownerReply?.message && (
                          <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-zinc-700">
                            Owner reply: {review.ownerReply.message}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-amber-50 text-amber-700">
                        {review.rating}/5
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeDetailTab === 'edit' && (
          <RestaurantEditForm
            onCancel={() => setActiveDetailTab('details')}
            onSubmit={handleAdminUpdate}
            restaurant={restaurant}
          />
        )}
      </div>
    );
  };

  return selectedRestaurantId ? renderDetails() : renderList();
}

export default AdminRestaurantsPanel;
