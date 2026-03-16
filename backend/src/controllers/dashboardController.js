import AuditLog from '../models/AuditLog.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ProductReview from '../models/ProductReview.js';
import User from '../models/User.js';

const LOW_STOCK_THRESHOLD = 5;
const DASHBOARD_PERIODS = [30, 90, 365];
const APPROVED_REVIEW_MATCH = {
  $or: [
    { status: 'approved' },
    { status: { $exists: false } },
    { status: null },
    { status: '' }
  ]
};

const parseDashboardPeriod = (value) => {
  const parsed = Number.parseInt(value, 10);
  return DASHBOARD_PERIODS.includes(parsed) ? parsed : 30;
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date, amount) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const startOfMonth = (date) => {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTrend = (current, previous) => {
  const safeCurrent = Number(current) || 0;
  const safePrevious = Number(previous) || 0;

  if (safePrevious === 0) {
    if (safeCurrent === 0) {
      return { value: 0, direction: 'flat' };
    }
    return { value: 100, direction: 'up' };
  }

  const raw = ((safeCurrent - safePrevious) / Math.abs(safePrevious)) * 100;
  if (Math.abs(raw) < 0.01) {
    return { value: 0, direction: 'flat' };
  }

  return {
    value: Math.round(Math.abs(raw) * 10) / 10,
    direction: raw > 0 ? 'up' : 'down'
  };
};

const buildOrderRangeMatch = (start, end, extraMatch = {}) => ({
  createdAt: { $gte: start, $lte: end },
  ...extraMatch
});

const buildDateRangeMatch = (field, start, end, extraMatch = {}) => ({
  [field]: { $gte: start, $lte: end },
  ...extraMatch
});

const roundRating = (value) => Math.round(Number(value || 0) * 10) / 10;

const roundPercent = (value) => Math.round(Number(value || 0) * 10) / 10;

const sumOrderAmount = async (match = {}) => {
  const [result] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);

  return Number(result?.total || 0);
};

const countOrders = (match = {}) => Order.countDocuments(match);

const countReviews = (match = {}) => ProductReview.countDocuments(match);

const averageReviewRating = async (match = {}) => {
  const [result] = await ProductReview.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' }
      }
    }
  ]);

  return roundRating(result?.average || 0);
};

const buildRevenueSeries = async ({ now, periodDays }) => {
  const rangeStart = startOfDay(addDays(now, -(periodDays - 1)));

  const dailyRows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: rangeStart, $lte: now },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const dailyMap = new Map(dailyRows.map((entry) => [entry._id, Number(entry.revenue || 0)]));

  if (periodDays <= 30) {
    const points = Array.from({ length: periodDays }, (_, index) => {
      const date = addDays(rangeStart, index);
      const key = date.toISOString().slice(0, 10);
      return { key, revenue: dailyMap.get(key) || 0 };
    });

    return { bucket: 'day', points };
  }

  if (periodDays <= 90) {
    const points = [];
    const bucketCount = Math.ceil(periodDays / 7);

    for (let index = 0; index < bucketCount; index += 1) {
      const bucketStart = addDays(rangeStart, index * 7);
      const bucketEnd = addDays(bucketStart, 6);
      let revenue = 0;

      for (let cursor = new Date(bucketStart); cursor <= bucketEnd && cursor <= now; cursor = addDays(cursor, 1)) {
        const key = cursor.toISOString().slice(0, 10);
        revenue += dailyMap.get(key) || 0;
      }

      points.push({
        key: bucketStart.toISOString().slice(0, 10),
        revenue
      });
    }

    return { bucket: 'week', points };
  }

  const monthStart = startOfMonth(addMonths(now, -11));
  const monthlyRows = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: monthStart, $lte: now },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthMap = new Map(monthlyRows.map((entry) => [entry._id, Number(entry.revenue || 0)]));
  const points = Array.from({ length: 12 }, (_, index) => {
    const bucket = addMonths(monthStart, index);
    const key = bucket.toISOString().slice(0, 7);
    return {
      key,
      revenue: monthMap.get(key) || 0
    };
  });

  return { bucket: 'month', points };
};

const getAuditTargetPage = (log) => {
  const resource = String(log?.resource || '').trim().toLowerCase();
  if (resource === 'order') return 'orders';
  if (resource === 'coupon') return 'coupons';
  if (resource === 'product' || resource === 'inventory') return 'products';
  if (resource === 'flash_sale') return 'flash-sale';
  if (resource === 'review') return 'reviews';
  return 'users';
};

const getAuditTone = (log) => {
  const resource = String(log?.resource || '').trim().toLowerCase();
  if (resource === 'order') return 'primary';
  if (resource === 'coupon' || resource === 'flash_sale') return 'purple';
  if (resource === 'product' || resource === 'inventory') return 'amber';
  if (resource === 'review') return 'violet';
  return 'slate';
};

const buildAuditActivity = (log) => {
  const actorName = log?.actor?.name || log?.actor?.email || 'Unknown user';
  const targetName = log?.targetUser?.name || log?.targetUser?.email || log?.details?.email || '';

  return {
    id: `audit:${log?._id}`,
    kind: 'audit',
    action: log?.action || 'audit.unknown',
    actorName,
    targetName,
    details: log?.details || {},
    createdAt: log?.createdAt,
    tone: getAuditTone(log),
    targetPage: getAuditTargetPage(log)
  };
};

const buildOrderActivity = (order) => ({
  id: `order:${order?._id}`,
  kind: 'order_created',
  orderNumber: order?.orderNumber || '',
  customerName: order?.customer?.name || order?.user?.name || '',
  paymentStatus: order?.paymentStatus || '',
  createdAt: order?.createdAt,
  tone: 'primary',
  targetPage: 'orders'
});

const buildCouponActivity = (coupon) => ({
  id: `coupon:${coupon?._id}`,
  kind: 'coupon_created',
  couponCode: coupon?.code || '',
  couponName: coupon?.name || '',
  createdAt: coupon?.createdAt,
  tone: 'purple',
  targetPage: 'coupons'
});

const buildLowStockActivity = (product) => ({
  id: `inventory:${product?._id}`,
  kind: 'low_stock',
  productName: product?.name || '',
  stock: Number(product?.stock || 0),
  createdAt: product?.updatedAt || product?.createdAt,
  tone: 'amber',
  targetPage: 'products'
});

const buildReviewActivity = (review) => ({
  id: `review:${review?._id}`,
  kind: 'review_created',
  productName: review?.product?.name || '',
  reviewerName: review?.user?.name || review?.user?.email || '',
  rating: Number(review?.rating || 0),
  isVerifiedPurchase: Boolean(review?.isVerifiedPurchase),
  status: review?.status || 'approved',
  createdAt: review?.createdAt,
  tone: review?.status === 'hidden' ? 'rose' : 'violet',
  targetPage: 'reviews'
});

const buildAftersalesActivity = (order) => ({
  id: `aftersales:${order?._id}:${order?.aftersalesRequest?.status || 'unknown'}`,
  kind: 'aftersales',
  orderNumber: order?.orderNumber || '',
  customerName: order?.customer?.name || order?.user?.name || order?.user?.email || '',
  aftersalesStatus: order?.aftersalesRequest?.status || '',
  aftersalesType: order?.aftersalesRequest?.type || '',
  createdAt: order?.aftersalesRequest?.updatedAt || order?.aftersalesRequest?.requestedAt || order?.updatedAt || order?.createdAt,
  tone: 'amber',
  targetPage: 'aftersales'
});

const buildActivityFeed = ({
  auditLogs = [],
  orders = [],
  coupons = [],
  lowStockProducts = [],
  reviews = [],
  aftersalesOrders = []
}) => (
  [
    ...auditLogs.map(buildAuditActivity),
    ...orders.map(buildOrderActivity),
    ...coupons.map(buildCouponActivity),
    ...lowStockProducts.map(buildLowStockActivity),
    ...reviews.map(buildReviewActivity),
    ...aftersalesOrders.map(buildAftersalesActivity)
  ]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

const parsePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 12;
  return Math.min(parsed, 50);
};

const ACTIVITY_TYPES = ['all', 'audit', 'orders', 'coupons', 'inventory', 'reviews', 'aftersales'];

const parseActivityType = (value) => {
  const raw = String(value || 'all').trim().toLowerCase();
  return ACTIVITY_TYPES.includes(raw) ? raw : 'all';
};

const filterActivityFeed = (activities = [], type = 'all') => {
  if (type === 'all') return activities;
  if (type === 'audit') return activities.filter((item) => item.kind === 'audit');
  if (type === 'orders') return activities.filter((item) => item.kind === 'order_created');
  if (type === 'coupons') return activities.filter((item) => item.kind === 'coupon_created');
  if (type === 'inventory') return activities.filter((item) => item.kind === 'low_stock');
  if (type === 'reviews') return activities.filter((item) => item.kind === 'review_created');
  if (type === 'aftersales') return activities.filter((item) => item.kind === 'aftersales');
  return activities;
};

const fetchActivitySources = async (limit) => {
  const sourceLimit = Math.max(limit, 20);

  const [auditLogs, orders, coupons, lowStockProducts, reviews, aftersalesOrders] = await Promise.all([
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(sourceLimit)
      .populate('actor', 'name email')
      .populate('targetUser', 'name email'),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(sourceLimit)
      .populate('user', 'name email avatar'),
    Coupon.find({})
      .sort({ createdAt: -1 })
      .limit(sourceLimit)
      .select('code name createdAt'),
    Product.find({
      isDeleted: { $ne: true },
      isActive: { $ne: false },
      stock: { $lte: LOW_STOCK_THRESHOLD }
    })
      .sort({ updatedAt: -1 })
      .limit(sourceLimit)
      .select('name stock updatedAt createdAt'),
    ProductReview.find({})
      .sort({ createdAt: -1 })
      .limit(sourceLimit)
      .populate('product', 'name')
      .populate('user', 'name email')
      .select('product user rating isVerifiedPurchase status createdAt'),
    Order.find({
      'aftersalesRequest.status': { $exists: true, $ne: 'none' }
    })
      .sort({ 'aftersalesRequest.updatedAt': -1, 'aftersalesRequest.requestedAt': -1, updatedAt: -1 })
      .limit(sourceLimit)
      .populate('user', 'name email')
      .select('orderNumber customer user aftersalesRequest updatedAt createdAt')
  ]);

  return { auditLogs, orders, coupons, lowStockProducts, reviews, aftersalesOrders };
};

const countActivitySources = async () => {
  const [audit, orders, coupons, inventory, reviews, aftersales] = await Promise.all([
    AuditLog.countDocuments({}),
    Order.countDocuments({}),
    Coupon.countDocuments({}),
    Product.countDocuments({
      isDeleted: { $ne: true },
      isActive: { $ne: false },
      stock: { $lte: LOW_STOCK_THRESHOLD }
    }),
    ProductReview.countDocuments({}),
    Order.countDocuments({ 'aftersalesRequest.status': { $exists: true, $ne: 'none' } })
  ]);

  return { audit, orders, coupons, inventory, reviews, aftersales };
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const periodDays = parseDashboardPeriod(req.query.period);
    const currentStart = startOfDay(addDays(now, -(periodDays - 1)));
    const previousEnd = addDays(currentStart, -1);
    const previousStart = startOfDay(addDays(previousEnd, -(periodDays - 1)));

    const completedRevenueMatchCurrent = buildOrderRangeMatch(currentStart, now, { status: 'completed' });
    const completedRevenueMatchPrevious = buildOrderRangeMatch(previousStart, previousEnd, { status: 'completed' });
    const ordersMatchCurrent = buildOrderRangeMatch(currentStart, now);
    const ordersMatchPrevious = buildOrderRangeMatch(previousStart, previousEnd);
    const reviewsMatchCurrent = buildDateRangeMatch('createdAt', currentStart, now);
    const reviewsMatchPrevious = buildDateRangeMatch('createdAt', previousStart, previousEnd);
    const approvedReviewsMatchCurrent = buildDateRangeMatch('createdAt', currentStart, now, APPROVED_REVIEW_MATCH);
    const approvedReviewsMatchPrevious = buildDateRangeMatch('createdAt', previousStart, previousEnd, APPROVED_REVIEW_MATCH);
    const hiddenReviewsMatchCurrent = buildDateRangeMatch('moderatedAt', currentStart, now, { status: 'hidden' });
    const hiddenReviewsMatchPrevious = buildDateRangeMatch('moderatedAt', previousStart, previousEnd, { status: 'hidden' });

    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      activeUsers,
      activeUsersCurrent,
      activeUsersPrevious,
      lowStockCount,
      lowStockCurrent,
      lowStockPrevious,
      recentOrders,
      auditLogs,
      recentCoupons,
      lowStockProducts,
      revenueSeries,
      totalReviews,
      approvedReviews,
      hiddenReviews,
      verifiedReviews,
      currentReviewCount,
      previousReviewCount,
      currentAverageRating,
      previousAverageRating,
      totalAverageRating,
      currentHiddenReviews,
      previousHiddenReviews,
      currentVerifiedReviews,
      previousVerifiedReviews,
      recentReviewRows,
      aftersalesOrders
    ] = await Promise.all([
      sumOrderAmount(completedRevenueMatchCurrent),
      sumOrderAmount(completedRevenueMatchPrevious),
      countOrders(ordersMatchCurrent),
      countOrders(ordersMatchPrevious),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, createdAt: { $gte: currentStart, $lte: now } }),
      User.countDocuments({ isActive: true, createdAt: { $gte: previousStart, $lte: previousEnd } }),
      Product.countDocuments({
        isDeleted: { $ne: true },
        isActive: { $ne: false },
        stock: { $lte: LOW_STOCK_THRESHOLD }
      }),
      Product.countDocuments({
        isDeleted: { $ne: true },
        isActive: { $ne: false },
        stock: { $lte: LOW_STOCK_THRESHOLD },
        updatedAt: { $gte: currentStart, $lte: now }
      }),
      Product.countDocuments({
        isDeleted: { $ne: true },
        isActive: { $ne: false },
        stock: { $lte: LOW_STOCK_THRESHOLD },
        updatedAt: { $gte: previousStart, $lte: previousEnd }
      }),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email avatar'),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('actor', 'name email')
        .populate('targetUser', 'name email'),
      Coupon.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .select('code name createdAt'),
      Product.find({
        isDeleted: { $ne: true },
        isActive: { $ne: false },
        stock: { $lte: LOW_STOCK_THRESHOLD }
      })
        .sort({ updatedAt: -1 })
        .limit(4)
        .select('name stock updatedAt createdAt'),
      buildRevenueSeries({ now, periodDays }),
      countReviews({}),
      countReviews(APPROVED_REVIEW_MATCH),
      countReviews({ status: 'hidden' }),
      countReviews({ isVerifiedPurchase: true }),
      countReviews(reviewsMatchCurrent),
      countReviews(reviewsMatchPrevious),
      averageReviewRating(approvedReviewsMatchCurrent),
      averageReviewRating(approvedReviewsMatchPrevious),
      averageReviewRating(APPROVED_REVIEW_MATCH),
      countReviews(hiddenReviewsMatchCurrent),
      countReviews(hiddenReviewsMatchPrevious),
      countReviews(buildDateRangeMatch('createdAt', currentStart, now, { isVerifiedPurchase: true })),
      countReviews(buildDateRangeMatch('createdAt', previousStart, previousEnd, { isVerifiedPurchase: true })),
      ProductReview.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('product', 'name slug images')
        .populate('user', 'name email avatar')
        .select('rating title comment isVerifiedPurchase status createdAt'),
      Order.find({
        'aftersalesRequest.status': { $exists: true, $ne: 'none' }
      })
        .sort({ 'aftersalesRequest.updatedAt': -1, 'aftersalesRequest.requestedAt': -1, updatedAt: -1 })
        .limit(4)
        .populate('user', 'name email')
        .select('orderNumber customer user aftersalesRequest updatedAt createdAt')
    ]);

    const activities = buildActivityFeed({
      auditLogs,
      orders: recentOrders.slice(0, 4),
      coupons: recentCoupons,
      lowStockProducts,
      reviews: recentReviewRows,
      aftersalesOrders
    }).slice(0, 8);

    res.json({
      success: true,
      data: {
        periodDays,
        cards: {
          totalRevenue: {
            value: currentRevenue,
            trend: buildTrend(currentRevenue, previousRevenue)
          },
          ordersCount: {
            value: currentOrders,
            trend: buildTrend(currentOrders, previousOrders)
          },
          activeUsers: {
            value: activeUsers,
            trend: buildTrend(activeUsersCurrent, activeUsersPrevious)
          },
          lowStock: {
            value: lowStockCount,
            trend: buildTrend(lowStockCurrent, lowStockPrevious)
          }
        },
        reviewSummary: {
          overview: {
            totalReviews,
            approvedReviews,
            hiddenReviews,
            verifiedReviews,
            averageRating: totalAverageRating
          },
          trends: {
            newReviews: {
              value: currentReviewCount,
              trend: buildTrend(currentReviewCount, previousReviewCount)
            },
            averageRating: {
              value: currentAverageRating,
              trend: buildTrend(currentAverageRating, previousAverageRating)
            },
            hiddenReviews: {
              value: hiddenReviews,
              trend: buildTrend(currentHiddenReviews, previousHiddenReviews)
            },
            verifiedReviews: {
              value: verifiedReviews,
              trend: buildTrend(currentVerifiedReviews, previousVerifiedReviews)
            }
          },
          recentReviews: recentReviewRows.map((review) => ({
            _id: review._id,
            rating: review.rating,
            title: review.title || '',
            comment: review.comment || '',
            isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
            status: review.status || 'approved',
            createdAt: review.createdAt,
            product: review.product
              ? {
                _id: review.product._id,
                name: review.product.name,
                slug: review.product.slug,
                image: review.product.images?.[0] || ''
              }
              : null,
            user: review.user
              ? {
                _id: review.user._id,
                name: review.user.name,
                email: review.user.email,
                avatar: review.user.avatar || ''
              }
              : null
          }))
        },
        revenueSeries,
        recentOrders,
        recentActivity: activities
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardReviewAnalytics = async (req, res, next) => {
  try {
    const [
      totalReviews,
      approvedReviews,
      hiddenReviews,
      verifiedReviews,
      averageRating,
      distributionRows,
      recentReviews,
      lowRatedProducts
    ] = await Promise.all([
      countReviews({}),
      countReviews(APPROVED_REVIEW_MATCH),
      countReviews({ status: 'hidden' }),
      countReviews({ isVerifiedPurchase: true }),
      averageReviewRating(APPROVED_REVIEW_MATCH),
      ProductReview.aggregate([
        { $match: APPROVED_REVIEW_MATCH },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      ProductReview.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('product', 'name slug images')
        .populate('user', 'name email avatar')
        .populate('moderatedBy', 'name')
        .select('rating title comment isVerifiedPurchase status createdAt moderatedAt moderatedBy'),
      Product.find({
        isDeleted: { $ne: true },
        isActive: { $ne: false },
        reviewCount: { $gt: 0 }
      })
        .sort({ ratingAverage: 1, reviewCount: -1, updatedAt: -1 })
        .limit(5)
        .select('name slug images ratingAverage reviewCount')
    ]);

    const distributionMap = new Map(distributionRows.map((entry) => [Number(entry._id), Number(entry.count || 0)]));
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const count = distributionMap.get(rating) || 0;
      return {
        rating,
        count,
        share: approvedReviews > 0 ? roundPercent((count / approvedReviews) * 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalReviews,
          approvedReviews,
          hiddenReviews,
          verifiedReviews,
          averageRating
        },
        moderation: {
          approvedRate: totalReviews > 0 ? roundPercent((approvedReviews / totalReviews) * 100) : 0,
          hiddenRate: totalReviews > 0 ? roundPercent((hiddenReviews / totalReviews) * 100) : 0,
          verifiedRate: totalReviews > 0 ? roundPercent((verifiedReviews / totalReviews) * 100) : 0
        },
        distribution,
        lowRatedProducts: lowRatedProducts.map((product) => ({
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || '',
          ratingAverage: roundRating(product.ratingAverage),
          reviewCount: Number(product.reviewCount || 0)
        })),
        recentReviews: recentReviews.map((review) => ({
          _id: review._id,
          rating: review.rating,
          title: review.title || '',
          comment: review.comment || '',
          isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
          status: review.status || 'approved',
          createdAt: review.createdAt,
          moderatedAt: review.moderatedAt || null,
          product: review.product
            ? {
              _id: review.product._id,
              name: review.product.name,
              slug: review.product.slug,
              image: review.product.images?.[0] || ''
            }
            : null,
          user: review.user
            ? {
              _id: review.user._id,
              name: review.user.name,
              email: review.user.email,
              avatar: review.user.avatar || ''
            }
            : null,
          moderatedBy: review.moderatedBy
            ? {
              _id: review.moderatedBy._id,
              name: review.moderatedBy.name
            }
            : null
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardActivity = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const type = parseActivityType(req.query.type);
    const fetchLimit = Math.max(page * limit * 2, 50);

    const [sources, counts] = await Promise.all([
      fetchActivitySources(fetchLimit),
      countActivitySources()
    ]);

    const activities = filterActivityFeed(buildActivityFeed(sources), type);
    const total =
      type === 'all'
        ? counts.audit + counts.orders + counts.coupons + counts.inventory + counts.reviews + counts.aftersales
        : counts[type] || 0;
    const skip = (page - 1) * limit;

    res.json({
      success: true,
      data: activities.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      },
      filters: {
        type
      }
    });
  } catch (error) {
    next(error);
  }
};
