import { useEffect, useState } from 'react';
import { getAdminOverviewAnalytics } from '../../services/adminAnalyticsService';

const periods = [
  ['today', 'Today'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['all', 'All time'],
];

const statusClasses = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-stone-50 text-[#FF4F2E]',
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const currency = (value) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));
const number = (value) => new Intl.NumberFormat('de-DE').format(value || 0);
const date = (value) => new Date(value).toLocaleDateString();
const paymentName = (method) =>
  method === 'demo_online' ? 'Demo online' : 'Cash on delivery';

function MetricGroup({ metrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => (
        <article className="fh-card p-5" key={label}>
          <p className="text-sm font-semibold text-zinc-600">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
        </article>
      ))}
    </div>
  );
}

function AdminOverview({ onSelectTab }) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setError('');
        setIsLoading(true);
        const response = await getAdminOverviewAnalytics(period);
        setData(response.data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverview();
  }, [period, retryKey]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div className="fh-card h-28 animate-pulse" key={item} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <section className="fh-card p-7">
        <h2 className="text-xl font-bold">Overview could not be loaded</h2>
        <p className="mt-2 text-zinc-600">{error}</p>
        <button
          className="fh-btn-primary mt-5"
          onClick={() => setRetryKey((current) => current + 1)}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }

  const { metrics } = data;
  const maxRevenue = Math.max(
    ...data.revenueTrend.map((item) => item.revenue),
    1,
  );
  const maxStatus = Math.max(...Object.values(data.orderStatusBreakdown), 1);

  return (
    <div className="space-y-7">
      <section className="fh-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="mt-2 text-zinc-600">
            Monitor platform performance, restaurants, users, and orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map(([value, label]) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                period === value
                  ? 'bg-[#FF4F2E] text-white'
                  : 'border border-stone-200 bg-white text-zinc-700'
              }`}
              key={value}
              onClick={() => setPeriod(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <MetricGroup
        metrics={[
          ['Total Revenue', currency(metrics.totalRevenue)],
          ['Total Orders', number(metrics.totalOrders)],
          ["Today's Orders", number(metrics.todayOrders)],
          ['Active Orders', number(metrics.activeOrders)],
          ['Delivered Orders', number(metrics.deliveredOrders)],
          ['Cancelled Orders', number(metrics.cancelledOrders)],
          ['Average Order Value', currency(metrics.averageOrderValue)],
        ]}
      />

      <div>
        <h3 className="mb-4 text-xl font-bold">Users</h3>
        <MetricGroup
          metrics={[
            ['Total Users', number(metrics.totalUsers)],
            ['Customers', number(metrics.totalCustomers)],
            ['Restaurant Owners', number(metrics.totalRestaurantOwners)],
            ['Riders', number(metrics.totalRiders)],
            ['Blocked Users', number(metrics.blockedUsers)],
          ]}
        />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-bold">Restaurants</h3>
        <MetricGroup
          metrics={[
            ['Total Restaurants', number(metrics.totalRestaurants)],
            ['Approved Restaurants', number(metrics.approvedRestaurants)],
            ['Pending Approvals', number(metrics.pendingRestaurants)],
            ['Inactive / Rejected', number(metrics.rejectedOrInactiveRestaurants)],
            ['Temporarily Closed', number(metrics.temporarilyClosedRestaurants)],
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Platform Revenue Trend</h3>
          {data.revenueTrend.length ? (
            <div className="mt-5 space-y-4">
              {data.revenueTrend.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-zinc-600">
                      {currency(item.revenue)} · {item.orders} orders
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[#FF4F2E]"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-zinc-600">
              No platform data for this period yet.
            </p>
          )}
        </section>

        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Order Status Breakdown</h3>
          <div className="mt-5 space-y-3">
            {Object.entries(data.orderStatusBreakdown).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm capitalize">
                  <span>{status.replaceAll('_', ' ')}</span>
                  <strong>{count}</strong>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-stone-500"
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Payment Summary</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(data.paymentMethodSummary).map(([method, summary]) => (
              <div className="rounded-lg bg-stone-50 p-5" key={method}>
                <p className="font-semibold">{paymentName(method)}</p>
                <p className="mt-2 text-2xl font-black">
                  {currency(summary.amount)}
                </p>
                <p className="text-sm text-zinc-600">{summary.count} orders</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fh-card overflow-hidden">
          <h3 className="p-6 text-xl font-bold">Top Restaurants</h3>
          {data.topRestaurants.length ? (
            <div className="divide-y divide-stone-200">
              {data.topRestaurants.map((restaurant, index) => (
                <div
                  className="grid grid-cols-[40px_1fr_auto] gap-3 px-6 py-3"
                  key={restaurant.restaurantId}
                >
                  <span>{index + 1}</span>
                  <span className="font-semibold">{restaurant.name}</span>
                  <span className="text-right text-sm">
                    {currency(restaurant.revenue)}
                    <br />
                    {restaurant.orders} orders
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 pb-6 text-zinc-600">No sales data yet.</p>
          )}
        </section>
      </div>

      {data.topCustomers.length > 0 && (
        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Top Customers</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.topCustomers.map((customer) => (
              <article className="rounded-lg bg-stone-50 p-4" key={customer.customerId}>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-zinc-600">{customer.email}</p>
                <p className="mt-2 text-sm">
                  {customer.orders} orders · {currency(customer.spent)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="fh-card overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <h3 className="text-xl font-bold">Recent Orders</h3>
          <button className="fh-btn-secondary" onClick={() => onSelectTab('orders')} type="button">
            View all orders
          </button>
        </div>
        <div className="divide-y divide-stone-200">
          {data.recentOrders.map((order) => (
            <div
              className="grid gap-2 px-6 py-4 md:grid-cols-[1fr_1fr_auto_auto]"
              key={order._id}
            >
              <div>
                <p>{order.customer?.name || 'Customer'}</p>
                <p className="text-xs text-zinc-500">{date(order.createdAt)}</p>
              </div>
              <div>
                <p>{order.restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-zinc-500">
                  {paymentName(order.paymentMethod)}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  statusClasses[order.status] || 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {order.status.replaceAll('_', ' ')}
              </span>
              <span className="font-semibold">{currency(order.totalAmount)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="fh-card p-6">
          <div className="flex justify-between gap-3">
            <h3 className="text-xl font-bold">Recent Users</h3>
            <button className="text-sm font-semibold text-[#FF4F2E]" onClick={() => onSelectTab('users')} type="button">
              View all users
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {data.recentUsers.map((user) => (
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-3" key={user._id}>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-zinc-600">{user.email}</p>
                </div>
                <div className="text-right text-xs text-zinc-600">
                  <p>{user.role.replaceAll('_', ' ')}</p>
                  <p>{user.isBlocked ? 'Blocked' : 'Active'} · {date(user.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="fh-card p-6">
          <div className="flex justify-between gap-3">
            <h3 className="text-xl font-bold">Recent Restaurants</h3>
            <button className="text-sm font-semibold text-[#FF4F2E]" onClick={() => onSelectTab('restaurants')} type="button">
              View restaurants
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {data.recentRestaurants.map((restaurant) => (
              <div className="border-t border-stone-200 pt-3" key={restaurant._id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    <p className="text-sm text-zinc-600">
                      {restaurant.owner?.name || 'Owner unavailable'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold">
                    {restaurant.isApproved && restaurant.isActive
                      ? 'Approved'
                      : restaurant.isActive
                        ? 'Pending'
                        : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {restaurant.isTemporarilyClosed
                    ? 'Temporarily closed'
                    : restaurant.isActive
                      ? 'Active'
                      : 'Inactive'}{' '}
                  · {date(restaurant.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminOverview;
