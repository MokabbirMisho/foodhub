import { useEffect, useState } from "react";
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  toggleUserBlockStatus,
} from "../../services/adminUserService";

const emptyFilters = {
  search: "",
  status: "all",
};

const itemsPerPage = 10;

function UserDetails({ user }) {
  return (
    <div className="mt-5 grid gap-4 rounded-lg bg-stone-50 p-5 text-sm md:grid-cols-2">
      <div>
        <p className="font-semibold text-zinc-900">User ID</p>
        <p className="mt-1 break-all text-zinc-600">{user._id}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Phone</p>
        <p className="mt-1 text-zinc-600">{user.phone || "Not provided"}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Authentication</p>
        <p className="mt-1 capitalize text-zinc-600">{user.authProvider}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Status</p>
        <p className="mt-1 text-zinc-600">
          {user.isBlocked ? "Blocked" : "Active"}
        </p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Created</p>
        <p className="mt-1 text-zinc-600">
          {new Date(user.createdAt).toLocaleString()}
        </p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Last updated</p>
        <p className="mt-1 text-zinc-600">
          {new Date(user.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function AdminUsersPanel({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [actionUserId, setActionUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const buildParams = (nextFilters) => {
    const params = {
      role: "customer",
    };

    if (nextFilters.search.trim()) {
      params.search = nextFilters.search.trim();
    }

    if (nextFilters.status !== "all") {
      params.status = nextFilters.status;
    }

    return params;
  };

  const loadUsers = async (nextFilters = filters) => {
    try {
      setError("");
      setIsLoading(true);
      const response = await getAllUsersForAdmin(buildParams(nextFilters));
      setUsers(response.data.users || []);
      setTotal(response.data.total || 0);
      setCurrentPage(1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(emptyFilters);
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
    loadUsers(filters);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
    loadUsers(emptyFilters);
  };

  const handleViewDetails = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);

    if (userDetails[userId]) {
      return;
    }

    try {
      setError("");
      setDetailsLoadingId(userId);
      const response = await getUserByIdForAdmin(userId);
      setUserDetails((current) => ({
        ...current,
        [userId]: response.data.user,
      }));
    } catch (requestError) {
      setError(requestError.message);
      setExpandedUserId(null);
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const handleToggleBlock = async (user) => {
    const nextBlockedStatus = !user.isBlocked;
    const action = nextBlockedStatus ? "block" : "unblock";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setActionUserId(user._id);
      const response = await toggleUserBlockStatus(user._id, nextBlockedStatus);
      const updatedUser = response.data.user;

      setUsers((current) =>
        current.map((item) => (item._id === user._id ? updatedUser : item)),
      );
      setUserDetails((current) => ({
        ...current,
        [user._id]: updatedUser,
      }));
      setSuccessMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionUserId(null);
    }
  };

  const totalUsers = users.length;
  const totalPages = Math.max(Math.ceil(totalUsers / itemsPerPage), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
  const currentUsers = users.slice(startIndex, endIndex);
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          <h2 className="mt-1 text-2xl font-bold text-zinc-900">Users</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Manage customer accounts and account status.
          </p>
        </div>
        <input
          className="rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-[#FF4F2E] focus:ring-4 focus:ring-[#FF4F2E]/20"
          name="search"
          onChange={handleFilterChange}
          placeholder="Search customer name or email..."
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

      <div className="flex items-center justify-end">
        <p className="text-sm text-zinc-600">{total} customers</p>
      </div>

      {error && <p className="fh-alert-error">{error}</p>}
      {successMessage && <p className="fh-alert-success">{successMessage}</p>}
      {isLoading && (
        <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
          Loading users...
        </p>
      )}
      {!isLoading && !error && users.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-zinc-700 shadow-sm">
          No users found.
        </p>
      )}

      {!isLoading && users.length > 0 && (
        <div className="space-y-4">
          {currentUsers.map((user) => {
            const isCurrentAdmin = String(user._id) === String(currentUserId);
            const displayedDetails = userDetails[user._id] || user;

            return (
              <article className="fh-card p-5" key={user._id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-bold">{user.name}</h3>
                    <p className="mt-1 break-all text-sm text-zinc-600">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Customer
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isBlocked
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold capitalize text-zinc-700">
                      {user.authProvider}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-[#FF4F2E] hover:bg-stone-50"
                      onClick={() => handleViewDetails(user._id)}
                      type="button"
                    >
                      {expandedUserId === user._id
                        ? "Hide Details"
                        : "View Details"}
                    </button>

                    {isCurrentAdmin ? (
                      <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-500">
                        Current account
                      </span>
                    ) : (
                      <button
                        className={`rounded-md px-3 py-2 text-sm font-semibold ${
                          user.isBlocked
                            ? "border border-green-200 text-green-700 hover:bg-green-50"
                            : "border border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                        disabled={actionUserId === user._id}
                        onClick={() => handleToggleBlock(user)}
                        type="button"
                      >
                        {actionUserId === user._id
                          ? "Updating..."
                          : user.isBlocked
                            ? "Unblock User"
                            : "Block User"}
                      </button>
                    )}
                  </div>
                </div>

                {expandedUserId === user._id &&
                  (detailsLoadingId === user._id ? (
                    <p className="mt-5 text-sm text-zinc-600">
                      Loading user details...
                    </p>
                  ) : (
                    <UserDetails user={displayedDetails} />
                  ))}
              </article>
            );
          })}

          {totalUsers > itemsPerPage && (
            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">
                Showing {startIndex + 1}-{endIndex} of {totalUsers} customers
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

                {pageNumbers.map((pageNumber) => (
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
                ))}

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

export default AdminUsersPanel;
