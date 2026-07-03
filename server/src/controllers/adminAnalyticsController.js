import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

const periods = ['today', '7d', '30d', 'all'];
const statuses = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];
const activeStatuses = statuses.slice(0, 5);

const getStartDate = (period) => {
  if (period === 'all') return null;

  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (period !== 'today') {
    date.setDate(date.getDate() - (period === '7d' ? 6 : 29));
  }

  return date;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const trendLabel = (date, period) =>
  date.toISOString().slice(0, period === 'all' ? 7 : 10);

export const getAdminOverviewAnalytics = async (req, res) => {
  try {
    const period = periods.includes(req.query.period) ? req.query.period : '30d';
    const startDate = getStartDate(period);
    const orderFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const orders = await Order.find(orderFilter)
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 });

    const [
      roleCounts,
      blockedUsers,
      totalRestaurants,
      approvedRestaurants,
      pendingRestaurants,
      rejectedOrInactiveRestaurants,
      temporarilyClosedRestaurants,
      totalFoodItems,
      totalReviews,
      todayOrders,
      recentUsers,
      recentRestaurants,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ isBlocked: true }),
      Restaurant.countDocuments(),
      Restaurant.countDocuments({ isApproved: true, isActive: true }),
      Restaurant.countDocuments({ isApproved: false, isActive: true }),
      Restaurant.countDocuments({ isActive: false }),
      Restaurant.countDocuments({ isTemporarilyClosed: true }),
      FoodItem.countDocuments(),
      Review.countDocuments(),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      User.find()
        .select('name email role isBlocked authProvider createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Restaurant.find()
        .populate('owner', 'name email')
        .select(
          'name owner isApproved isActive isTemporarilyClosed createdAt',
        )
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const userCounts = Object.fromEntries(
      roleCounts.map(({ _id, count }) => [_id, count]),
    );
    const statusBreakdown = Object.fromEntries(
      statuses.map((status) => [status, 0]),
    );
    const paymentMethodSummary = {
      cash_on_delivery: { count: 0, amount: 0 },
      demo_online: { count: 0, amount: 0 },
    };
    const trends = new Map();
    const restaurantTotals = new Map();
    const customerTotals = new Map();
    let totalRevenue = 0;

    orders.forEach((order) => {
      statusBreakdown[order.status] += 1;
      const payment = paymentMethodSummary[order.paymentMethod];
      if (payment) payment.count += 1;

      if (order.status !== 'delivered') return;

      const revenue = Number(order.totalAmount || 0);
      totalRevenue += revenue;
      if (payment) payment.amount += revenue;

      const label = trendLabel(order.createdAt, period);
      const trend = trends.get(label) || { label, revenue: 0, orders: 0 };
      trend.revenue += revenue;
      trend.orders += 1;
      trends.set(label, trend);

      const restaurantId = String(order.restaurant?._id || order.restaurant);
      const restaurant = restaurantTotals.get(restaurantId) || {
        restaurantId,
        name: order.restaurant?.name || 'Unknown restaurant',
        orders: 0,
        revenue: 0,
      };
      restaurant.orders += 1;
      restaurant.revenue += revenue;
      restaurantTotals.set(restaurantId, restaurant);

      const customerId = String(order.customer?._id || order.customer);
      const customer = customerTotals.get(customerId) || {
        customerId,
        name: order.customer?.name || 'Unknown customer',
        email: order.customer?.email || '',
        orders: 0,
        spent: 0,
      };
      customer.orders += 1;
      customer.spent += revenue;
      customerTotals.set(customerId, customer);
    });

    const deliveredOrders = statusBreakdown.delivered;
    const totalUsers = Object.values(userCounts).reduce(
      (total, count) => total + count,
      0,
    );

    res.status(200).json({
      success: true,
      message: 'Admin overview fetched successfully',
      data: {
        period,
        metrics: {
          totalRevenue: roundMoney(totalRevenue),
          totalOrders: orders.length,
          todayOrders,
          activeOrders: activeStatuses.reduce(
            (total, status) => total + statusBreakdown[status],
            0,
          ),
          deliveredOrders,
          cancelledOrders: statusBreakdown.cancelled,
          averageOrderValue: deliveredOrders
            ? roundMoney(totalRevenue / deliveredOrders)
            : 0,
          totalUsers,
          totalCustomers: userCounts.customer || 0,
          totalRestaurantOwners: userCounts.restaurant_owner || 0,
          totalRiders: userCounts.rider || 0,
          totalAdmins: userCounts.admin || 0,
          blockedUsers,
          totalRestaurants,
          approvedRestaurants,
          pendingRestaurants,
          rejectedOrInactiveRestaurants,
          temporarilyClosedRestaurants,
          totalFoodItems,
          totalReviews,
        },
        orderStatusBreakdown: statusBreakdown,
        paymentMethodSummary: Object.fromEntries(
          Object.entries(paymentMethodSummary).map(([method, summary]) => [
            method,
            { ...summary, amount: roundMoney(summary.amount) },
          ]),
        ),
        revenueTrend: [...trends.values()]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((item) => ({ ...item, revenue: roundMoney(item.revenue) })),
        topRestaurants: [...restaurantTotals.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
          .map((item) => ({ ...item, revenue: roundMoney(item.revenue) })),
        topCustomers: [...customerTotals.values()]
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 5)
          .map((item) => ({ ...item, spent: roundMoney(item.spent) })),
        recentOrders: orders.slice(0, 10),
        recentUsers,
        recentRestaurants,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};
