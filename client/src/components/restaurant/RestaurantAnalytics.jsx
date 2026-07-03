import { useEffect, useState } from 'react';
import { getMyRestaurantAnalytics } from '../../services/restaurantAnalyticsService';

const periods = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const statusClasses = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  preparing: 'bg-orange-50 text-orange-700',
  ready: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat('de-DE').format(Number(value || 0));

const formatPaymentMethod = (method) =>
  method === 'demo_online' ? 'Demo online' : 'Cash on delivery';

function MetricCard({ label, value }) {
  return (
    <article className="fh-card p-5">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </article>
  );
}

function RestaurantAnalytics({ onViewOrders }) {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setError('');
        setIsLoading(true);
        const response = await getMyRestaurantAnalytics(period);
        setAnalytics(response.data);
      } catch (requestError) {
        setError(requestError.message);
        setAnalytics(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [period, requestKey]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div className="fh-card h-28 animate-pulse" key={item} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <section className="fh-card p-7">
        <h2 className="text-xl font-bold">
          {error === 'Restaurant profile not found'
            ? 'Create your restaurant profile first.'
            : 'Overview could not be loaded'}
        </h2>
        <p className="mt-2 text-slate-600">{error}</p>
        <button
          className="fh-btn-primary mt-5"
          onClick={() => setRequestKey((current) => current + 1)}
          type="button"
        >
          Retry
        </button>
      </section>
    );
  }

  const { metrics } = analytics;
  const maxTrendRevenue = Math.max(
    ...analytics.revenueTrend.map((entry) => entry.revenue),
    1,
  );
  const maxStatusCount = Math.max(
    ...Object.values(analytics.orderStatusBreakdown),
    1,
  );
  const hasData = metrics.totalOrders > 0;

  return (
    <div className="space-y-6">
      <section className="fh-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="mt-2 text-slate-600">
            Track your restaurant performance and recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((option) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                period === option.value
                  ? 'bg-orange-600 text-white'
                  : 'border border-orange-200 bg-white text-slate-700 hover:border-orange-500'
              }`}
              key={option.value}
              onClick={() => setPeriod(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total revenue"
          value={formatCurrency(metrics.totalRevenue)}
        />
        <MetricCard label="Total orders" value={formatNumber(metrics.totalOrders)} />
        <MetricCard label="Today's orders" value={formatNumber(metrics.todayOrders)} />
        <MetricCard label="Active orders" value={formatNumber(metrics.activeOrders)} />
        <MetricCard
          label="Delivered orders"
          value={formatNumber(metrics.deliveredOrders)}
        />
        <MetricCard
          label="Cancelled orders"
          value={formatNumber(metrics.cancelledOrders)}
        />
        <MetricCard
          label="Average order value"
          value={formatCurrency(metrics.averageOrderValue)}
        />
      </section>

      {!hasData && (
        <p className="fh-card p-6 text-center text-slate-600">
          No data for this period yet.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Revenue trend</h3>
          <p className="mt-1 text-sm text-slate-600">
            Revenue is delivered orders; order count includes every status.
          </p>
          {analytics.revenueTrend.length ? (
            <div className="mt-5 space-y-4">
              {analytics.revenueTrend.map((entry) => (
                <div key={entry.label}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="font-semibold">{entry.label}</span>
                    <span className="text-slate-600">
                      {formatCurrency(entry.revenue)} · {entry.orders} orders
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
                    <div
                      className="h-full rounded-full bg-orange-600"
                      style={{
                        width: `${Math.max(
                          (entry.revenue / maxTrendRevenue) * 100,
                          entry.revenue ? 3 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-slate-600">No revenue data yet.</p>
          )}
        </section>

        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Order status breakdown</h3>
          <div className="mt-5 space-y-4">
            {Object.entries(analytics.orderStatusBreakdown).map(
              ([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">
                      {status.replaceAll('_', ' ')}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-500"
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="fh-card overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold">Top selling items</h3>
          </div>
          {analytics.topSellingItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-orange-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Item</th>
                    <th className="px-5 py-3">Sold</th>
                    <th className="px-5 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topSellingItems.map((item, index) => (
                    <tr className="border-t border-orange-100" key={item.name}>
                      <td className="px-5 py-3">{index + 1}</td>
                      <td className="px-5 py-3 font-semibold">{item.name}</td>
                      <td className="px-5 py-3">{item.quantity}</td>
                      <td className="px-5 py-3">{formatCurrency(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 pb-6 text-slate-600">No sales data yet.</p>
          )}
        </section>

        <section className="fh-card p-6">
          <h3 className="text-xl font-bold">Payment methods</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(analytics.paymentMethodSummary).map(
              ([method, summary]) => (
                <article className="rounded-lg bg-orange-50 p-5" key={method}>
                  <p className="font-semibold">{formatPaymentMethod(method)}</p>
                  <p className="mt-3 text-2xl font-black">
                    {formatCurrency(summary.amount)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {summary.count} orders
                  </p>
                </article>
              ),
            )}
          </div>
        </section>
      </div>

      <section className="fh-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-6">
          <h3 className="text-xl font-bold">Recent orders</h3>
          <button className="fh-btn-secondary" onClick={onViewOrders} type="button">
            View orders
          </button>
        </div>
        {analytics.recentOrders.length ? (
          <div className="divide-y divide-orange-100">
            {analytics.recentOrders.map((order) => (
              <article
                className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={order._id}
              >
                <div>
                  <p className="font-semibold">
                    {order.customer?.name || 'Customer'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    statusClasses[order.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {order.status.replaceAll('_', ' ')}
                </span>
                <div className="sm:text-right">
                  <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-slate-600">
                    {formatPaymentMethod(order.paymentMethod)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-6 pb-6 text-slate-600">No recent orders.</p>
        )}
      </section>
    </div>
  );
}

export default RestaurantAnalytics;
