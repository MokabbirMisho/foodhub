import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

const allowedPeriods = ['today', '7d', '30d', 'all'];
const activeStatuses = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
];
const orderStatuses = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const getStartDate = (period) => {
  const now = new Date();

  if (period === 'all') {
    return null;
  }

  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const days = period === '7d' ? 7 : 30;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  return startDate;
};

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const getTrendLabel = (date, period) => {
  if (period === 'all') {
    return date.toISOString().slice(0, 7);
  }

  return date.toISOString().slice(0, 10);
};

export const getMyRestaurantAnalytics = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
        data: null,
      });
    }

    const period = allowedPeriods.includes(req.query.period)
      ? req.query.period
      : '30d';
    const startDate = getStartDate(period);
    const periodFilter = {
      restaurant: restaurant._id,
      ...(startDate ? { createdAt: { $gte: startDate } } : {}),
    };
    const orders = await Order.find(periodFilter).sort({ createdAt: -1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      restaurant: restaurant._id,
      createdAt: { $gte: todayStart },
    });

    const statusBreakdown = Object.fromEntries(
      orderStatuses.map((status) => [status, 0]),
    );
    const paymentMethodSummary = {
      cash_on_delivery: { count: 0, amount: 0 },
      demo_online: { count: 0, amount: 0 },
    };
    const itemSales = new Map();
    const trend = new Map();
    let totalRevenue = 0;

    orders.forEach((order) => {
      statusBreakdown[order.status] += 1;

      const payment = paymentMethodSummary[order.paymentMethod];
      if (payment) {
        payment.count += 1;
      }

      const trendLabel = getTrendLabel(order.createdAt, period);
      const trendEntry = trend.get(trendLabel) || {
        label: trendLabel,
        revenue: 0,
        orders: 0,
      };

      if (order.status === 'delivered') {
        const orderRevenue = Number(order.totalAmount || 0);
        totalRevenue += orderRevenue;
        trendEntry.revenue += orderRevenue;
        trendEntry.orders += 1;

        // Counts include every order, while payment amounts are delivered revenue.
        if (payment) {
          payment.amount += orderRevenue;
        }

        order.items.forEach((item) => {
          const itemName = item.name || item.foodName || 'Food item';
          const quantity = Number(item.quantity || 1);
          const itemRevenue = Number(
            item.total ?? Number(item.price || 0) * quantity,
          );
          const current = itemSales.get(itemName) || {
            name: itemName,
            quantity: 0,
            revenue: 0,
          };
          current.quantity += quantity;
          current.revenue += itemRevenue;
          itemSales.set(itemName, current);
        });
      }

      trend.set(trendLabel, trendEntry);
    });

    const deliveredOrders = statusBreakdown.delivered;
    const recentOrders = await Order.find(periodFilter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'customer totalAmount status paymentMethod paymentStatus createdAt',
      );

    res.status(200).json({
      success: true,
      message: 'Restaurant analytics fetched successfully',
      data: {
        period,
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
        metrics: {
          totalRevenue: roundMoney(totalRevenue),
          totalOrders: orders.length,
          todayOrders,
          pendingOrders: statusBreakdown.pending,
          activeOrders: activeStatuses.reduce(
            (total, status) => total + statusBreakdown[status],
            0,
          ),
          deliveredOrders,
          cancelledOrders: statusBreakdown.cancelled,
          averageOrderValue: deliveredOrders
            ? roundMoney(totalRevenue / deliveredOrders)
            : 0,
        },
        orderStatusBreakdown: statusBreakdown,
        paymentMethodSummary: Object.fromEntries(
          Object.entries(paymentMethodSummary).map(([method, summary]) => [
            method,
            { ...summary, amount: roundMoney(summary.amount) },
          ]),
        ),
        topSellingItems: [...itemSales.values()]
          .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
          .slice(0, 10)
          .map((item) => ({ ...item, revenue: roundMoney(item.revenue) })),
        revenueTrend: [...trend.values()]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map((entry) => ({
            ...entry,
            revenue: roundMoney(entry.revenue),
          })),
        recentOrders,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      data: null,
    });
  }
};
