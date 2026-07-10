import { useEffect, useState } from "react";
import {
  getAdminRiderDetails,
  getAllUsersForAdmin,
  toggleUserBlockStatus,
} from "../../services/adminUserService";

const emptyFilters = {
  search: "",
  status: "all",
};

const itemsPerPage = 10;

function MetricCard({ label, value }) {
  return (
    <article className="fh-card p-5">
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-900">{value}</p>
    </article>
  );
}

const formatCurrency = (value) => `€${Number(value || 0).toFixed(2)}`;
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "Not available";
const getOrderNumber = (order) =>
  order.orderNumber || order._id?.slice(-6) || order.id?.slice(-6) || "Order";
const getShortAddress = (order) =>
  [
    order.deliveryAddress?.city,
    order.deliveryAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(", ") || "Address not provided";
const getDeliveryStatus = (rider, activeDeliveries = 0) => {
  if (rider?.isBlocked) {
    return "Blocked";
  }

  return activeDeliveries > 0 ? "On Delivery" : "Available";
};

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-zinc-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function AdminRidersPanel() {
  const [riders, setRiders] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [riderDetails, setRiderDetails] = useState(null);
  const [actionUserId, setActionUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const buildParams = (nextFilters) => {
    const params = {
      role: "rider",
    };

    if (nextFilters.search.trim()) {
      params.search = nextFilters.search.trim();
    }

    if (nextFilters.status !== "all") {
      params.status = nextFilters.status;
    }

    return params;
  };

  const loadRiders = async (nextFilters = filters) => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getAllUsersForAdmin(buildParams(nextFilters));
      setRiders(response.data.users || []);
      setTotal(response.data.total || 0);
      setCurrentPage(1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiders(emptyFilters);
  }, []);

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setCurrentPage(1);
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    loadRiders(filters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    loadRiders(emptyFilters);
  };

  const handleToggleBlock = async (rider) => {
    const nextBlockedStatus = !rider.isBlocked;
    const action = nextBlockedStatus ? "block" : "unblock";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this rider?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setActionUserId(rider._id);
      const response = await toggleUserBlockStatus(
        rider._id,
        nextBlockedStatus,
      );
      const updatedRider = response.data.user;

      setRiders((current) =>
        current.map((item) =>
          item._id === rider._id ? updatedRider : item,
        ),
      );
      setRiderDetails((current) =>
        current?.rider?._id === rider._id
          ? { ...current, rider: updatedRider }
          : current,
      );
      setSuccessMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionUserId(null);
    }
  };

  const openRiderDetails = async (riderId) => {
    try {
      setDetailsError("");
      setSuccessMessage("");
      setSelectedRiderId(riderId);
      setIsDetailsLoading(true);
      const response = await getAdminRiderDetails(riderId);
      setRiderDetails(response.data);
    } catch (requestError) {
      setDetailsError(requestError.message);
      setRiderDetails(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeRiderDetails = () => {
    setSelectedRiderId(null);
    setRiderDetails(null);
    setDetailsError("");
  };

  const totalRiders = riders.length;
  const totalPages = Math.max(Math.ceil(totalRiders / itemsPerPage), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalRiders);
  const currentRiders = riders.slice(startIndex, endIndex);
  const activeRiders = riders.filter((rider) => !rider.isBlocked).length;
  const blockedRiders = riders.filter((rider) => rider.isBlocked).length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderOrderSummary = (order) => (
    <article
      className="rounded-2xl border border-stone-200 bg-white p-4"
      key={order._id}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-zinc-900">
            Order #{getOrderNumber(order)}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {order.restaurant?.name || "Restaurant unavailable"} ·{" "}
            {order.customer?.name || "Customer unavailable"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{getShortAddress(order)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {order.status}
          </span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>
    </article>
  );

  const renderDetails = () => {
    if (isDetailsLoading) {
      return <p className="fh-card p-6 text-zinc-700">Loading rider details...</p>;
    }

    if (detailsError || !riderDetails) {
      return (
        <section className="fh-card p-6">
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
            onClick={closeRiderDetails}
            type="button"
          >
            ← Back to Riders
          </button>
          <p className="mt-4 text-red-700">
            {detailsError || "Rider details could not be loaded."}
          </p>
        </section>
      );
    }

    const { activeOrders, recentOrders, rider, summary } = riderDetails;
    const deliveryStatus = getDeliveryStatus(rider, summary.activeDeliveries);

    return (
      <div className="space-y-6">
        <section className="fh-card p-6">
          <div className="mb-5">
            <button
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50"
              onClick={closeRiderDetails}
              type="button"
            >
              ← Back to Riders
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-zinc-900">
                {rider.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">{rider.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    rider.isBlocked
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {rider.isBlocked ? "Blocked" : "Active"}
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {deliveryStatus}
                </span>
              </div>
            </div>

            <button
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                rider.isBlocked
                  ? "border border-green-200 text-green-700 hover:bg-green-50"
                  : "border border-red-200 text-red-700 hover:bg-red-50"
              }`}
              disabled={actionUserId === rider._id}
              onClick={() => handleToggleBlock(rider)}
              type="button"
            >
              {actionUserId === rider._id
                ? "Updating..."
                : rider.isBlocked
                  ? "Unblock Rider"
                  : "Block Rider"}
            </button>
          </div>
        </section>

        {successMessage && <p className="fh-alert-success">{successMessage}</p>}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total Assigned" value={summary.totalDeliveries} />
          <MetricCard label="Completed" value={summary.completedDeliveries} />
          <MetricCard label="Active" value={summary.activeDeliveries} />
          <MetricCard label="Cancelled" value={summary.cancelledDeliveries} />
          <MetricCard
            label="Delivered Value"
            value={formatCurrency(summary.totalDeliveredValue)}
          />
          <MetricCard
            label="Average Value"
            value={formatCurrency(summary.averageDeliveryValue)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="fh-card p-6">
            <h3 className="text-xl font-bold text-zinc-900">Account Details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailItem label="Name" value={rider.name} />
              <DetailItem label="Email" value={rider.email} />
              <DetailItem label="Phone" value={rider.phone} />
              <DetailItem label="Role" value="Rider" />
              <DetailItem
                label="Account status"
                value={rider.isBlocked ? "Blocked" : "Active"}
              />
              <DetailItem label="Joined" value={formatDateTime(rider.createdAt)} />
              <DetailItem
                label="Last updated"
                value={formatDateTime(rider.updatedAt)}
              />
            </div>
          </section>

          <section className="fh-card p-6">
            <h3 className="text-xl font-bold text-zinc-900">
              Delivery Status
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailItem label="Current status" value={deliveryStatus} />
              <DetailItem
                label="Active deliveries"
                value={summary.activeDeliveries}
              />
              <DetailItem
                label="Completed deliveries"
                value={summary.completedDeliveries}
              />
              <DetailItem
                label="Cancelled deliveries"
                value={summary.cancelledDeliveries}
              />
              <DetailItem
                label="Last delivery"
                value={formatDateTime(summary.lastDeliveryAt)}
              />
            </div>
          </section>
        </div>

        <section className="fh-card p-6">
          <h3 className="text-xl font-bold text-zinc-900">Active Delivery</h3>
          {activeOrders.length === 0 ? (
            <p className="mt-4 text-zinc-600">No active delivery right now.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {activeOrders.map(renderOrderSummary)}
            </div>
          )}
        </section>

        <section className="fh-card p-6">
          <h3 className="text-xl font-bold text-zinc-900">Recent Deliveries</h3>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-zinc-600">No delivery history found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentOrders.map(renderOrderSummary)}
            </div>
          )}
        </section>
      </div>
    );
  };

  if (selectedRiderId) {
    return renderDetails();
  }

  return (
    <section className="space-y-6">
      <form
        className="fh-card grid gap-3 p-5 lg:grid-cols-[1fr_180px_auto_auto]"
        onSubmit={handleApplyFilters}
      >
        <div className="mb-1 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#FF4F2E]">
            Admin Panel
          </p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900">Riders</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Manage rider accounts and delivery activity.
          </p>
        </div>
        <input
          className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
          name="search"
          onChange={handleFilterChange}
          placeholder="Search rider name or email..."
          value={filters.search}
        />
        <select
          className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
          name="status"
          onChange={handleFilterChange}
          value={filters.status}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button className="fh-btn-primary" type="submit">
          Apply Filters
        </button>
        <button
          className="rounded-xl border border-stone-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
          onClick={handleClearFilters}
          type="button"
        >
          Clear
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Riders" value={total} />
        <MetricCard label="Active Riders" value={activeRiders} />
        <MetricCard label="Blocked Riders" value={blockedRiders} />
      </div>

      {error && <p className="fh-alert-error">{error}</p>}
      {successMessage && <p className="fh-alert-success">{successMessage}</p>}
      {isLoading && (
        <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
          Loading riders...
        </p>
      )}
      {!isLoading && !error && riders.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
          No riders found.
        </p>
      )}

      {!isLoading && riders.length > 0 && (
        <div className="space-y-4">
          {currentRiders.map((rider) => (
            <article
              className="fh-card cursor-pointer p-5 transition hover:shadow-md"
              key={rider._id}
              onClick={() => openRiderDetails(rider._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openRiderDetails(rider._id);
                }
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold">{rider.name}</h3>
                  <p className="mt-1 break-all text-sm text-zinc-600">
                    {rider.email}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {rider.phone || "Phone not provided"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Joined {new Date(rider.createdAt).toLocaleDateString()} ·
                    click rider to view details
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Rider
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      rider.isBlocked
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {rider.isBlocked ? "Blocked" : "Active"}
                  </span>
                </div>

                <button
                  className={`rounded-md px-3 py-2 text-sm font-semibold ${
                    rider.isBlocked
                      ? "border border-green-200 text-green-700 hover:bg-green-50"
                      : "border border-red-200 text-red-700 hover:bg-red-50"
                  }`}
                  disabled={actionUserId === rider._id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleBlock(rider);
                  }}
                  type="button"
                >
                  {actionUserId === rider._id
                    ? "Updating..."
                    : rider.isBlocked
                      ? "Unblock Rider"
                      : "Block Rider"}
                </button>
              </div>
            </article>
          ))}

          {totalRiders > itemsPerPage && (
            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                Showing {startIndex + 1}-{endIndex} of {totalRiders} riders
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  type="button"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        safeCurrentPage === pageNumber
                          ? "border-[#FF4F2E] bg-[#FF4F2E] text-white"
                          : "border-stone-200 bg-white text-zinc-700 hover:bg-stone-50"
                      }`}
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ),
                )}

                <button
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          )}
        </div>
      )}
    </section>
  );
}

export default AdminRidersPanel;
