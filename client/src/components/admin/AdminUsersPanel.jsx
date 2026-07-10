import { useEffect, useState } from 'react';
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  toggleUserBlockStatus,
} from '../../services/adminUserService';

const emptyFilters = {
  search: '',
  role: 'all',
  status: 'all',
};

const roleClasses = {
  customer: 'bg-blue-50 text-blue-700',
  restaurant_owner: 'bg-stone-50 text-[#FF4F2E]',
  rider: 'bg-indigo-50 text-indigo-700',
  admin: 'bg-purple-50 text-purple-700',
};

const formatRole = (role) =>
  role
    ?.split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Unknown';

function UserDetails({ user }) {
  return (
    <div className="mt-5 grid gap-4 rounded-lg bg-stone-50 p-5 text-sm md:grid-cols-2">
      <div>
        <p className="font-semibold text-zinc-900">User ID</p>
        <p className="mt-1 break-all text-zinc-600">{user._id}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Phone</p>
        <p className="mt-1 text-zinc-600">{user.phone || 'Not provided'}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Authentication</p>
        <p className="mt-1 capitalize text-zinc-600">{user.authProvider}</p>
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Status</p>
        <p className="mt-1 text-zinc-600">
          {user.isBlocked ? 'Blocked' : 'Active'}
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
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);
  const [actionUserId, setActionUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const buildParams = (nextFilters) => {
    const params = {};

    if (nextFilters.search.trim()) {
      params.search = nextFilters.search.trim();
    }

    if (nextFilters.role !== 'all') {
      params.role = nextFilters.role;
    }

    if (nextFilters.status !== 'all') {
      params.status = nextFilters.status;
    }

    return params;
  };

  const loadUsers = async (nextFilters = filters) => {
    try {
      setError('');
      setIsLoading(true);
      const response = await getAllUsersForAdmin(buildParams(nextFilters));
      setUsers(response.data.users || []);
      setTotal(response.data.total || 0);
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
      setError('');
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
    const action = nextBlockedStatus ? 'block' : 'unblock';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this user?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      setActionUserId(user._id);
      const response = await toggleUserBlockStatus(
        user._id,
        nextBlockedStatus,
      );
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

  return (
    <section className="space-y-6">
      <form
        className="fh-card grid gap-3 p-5 lg:grid-cols-[1fr_200px_180px_auto_auto]"
        onSubmit={handleApplyFilters}
      >
        <input
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
          name="search"
          onChange={handleFilterChange}
          placeholder="Search by name or email"
          value={filters.search}
        />
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
          name="role"
          onChange={handleFilterChange}
          value={filters.role}
        >
          <option value="all">All roles</option>
          <option value="customer">Customer</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-[#FF4F2E]"
          name="status"
          onChange={handleFilterChange}
          value={filters.status}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button
          className="fh-btn-primary"
          type="submit"
        >
          Apply Filters
        </button>
        <button
          className="rounded-md border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-stone-50"
          onClick={handleClearFilters}
          type="button"
        >
          Clear
        </button>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users</h2>
        <p className="text-sm text-zinc-600">{total} total</p>
      </div>

      {error && (
        <p className="fh-alert-error">{error}</p>
      )}
      {successMessage && (
        <p className="fh-alert-success">
          {successMessage}
        </p>
      )}
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
          {users.map((user) => {
            const isCurrentAdmin = String(user._id) === String(currentUserId);
            const displayedDetails = userDetails[user._id] || user;

            return (
              <article
                className="fh-card p-5"
                key={user._id}
              >
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
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        roleClasses[user.role] || 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {formatRole(user.role)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isBlocked
                          ? 'bg-red-50 text-red-700'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {user.isBlocked ? 'Blocked' : 'Active'}
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
                        ? 'Hide Details'
                        : 'View Details'}
                    </button>

                    {isCurrentAdmin ? (
                      <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-500">
                        Current account
                      </span>
                    ) : (
                      <button
                        className={`rounded-md px-3 py-2 text-sm font-semibold ${
                          user.isBlocked
                            ? 'border border-green-200 text-green-700 hover:bg-green-50'
                            : 'border border-red-200 text-red-700 hover:bg-red-50'
                        }`}
                        disabled={actionUserId === user._id}
                        onClick={() => handleToggleBlock(user)}
                        type="button"
                      >
                        {actionUserId === user._id
                          ? 'Updating...'
                          : user.isBlocked
                            ? 'Unblock User'
                            : 'Block User'}
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
        </div>
      )}
    </section>
  );
}

export default AdminUsersPanel;
