import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductReview, { PRODUCT_REVIEW_STATUSES } from '../models/ProductReview.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { syncProductRatingSummary } from '../services/productReviewService.js';
import { verifyAccessToken } from '../utils/token.js';

const normalizeText = (value, maxLength) => {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  return raw.slice(0, maxLength);
};

const normalizeComment = (value, maxLength) =>
  String(value || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .slice(0, maxLength);

const normalizeReviewStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (PRODUCT_REVIEW_STATUSES.includes(raw)) return raw;
  return 'approved';
};

const buildReviewPayload = (review) => ({
  _id: review._id,
  rating: review.rating,
  title: review.title || '',
  comment: review.comment || '',
  isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
  status: normalizeReviewStatus(review.status),
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  isEdited: Boolean(
    review.updatedAt
      && review.createdAt
      && new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 1500
  ),
  user: review.user
    ? {
      _id: review.user._id,
      name: review.user.name,
      avatar: review.user.avatar || ''
    }
    : null
});

const findEligibleOrder = async ({ productId, userId }) => {
  if (!productId || !userId) return null;

  return Order.findOne({
    user: userId,
    'items.productId': productId,
    status: 'completed'
  })
    .sort({ createdAt: -1 })
    .select('_id orderNumber status paymentStatus');
};

const getViewerFromRequest = async (req) => {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  try {
    const decoded = verifyAccessToken(parts[1]);
    if (!decoded?.userId) return null;
    const user = await User.findById(decoded.userId).select('_id name avatar role isActive');
    if (!user?.isActive) return null;
    return user;
  } catch {
    return null;
  }
};

const getActiveProduct = async (productId) => Product.findOne({
  _id: productId,
  isActive: { $ne: false },
  isDeleted: { $ne: true }
}).select('_id name ratingAverage reviewCount');

const syncAffectedProductSummaries = async (productIds = []) => {
  const uniqueIds = [...new Set(productIds.map((id) => String(id || '')).filter(Boolean))];
  await Promise.all(uniqueIds.map((productId) => syncProductRatingSummary(productId)));
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const product = await getActiveProduct(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await ProductReview.find({
      product: id,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .lean();

    const viewer = await getViewerFromRequest(req);
    let eligibleOrder = null;
    let viewerReview = null;
    if (viewer?._id) {
      eligibleOrder = await findEligibleOrder({ productId: id, userId: viewer._id });
      viewerReview = await ProductReview.findOne({ product: id, user: viewer._id })
        .populate('user', 'name avatar')
        .lean();
    }

    const normalizedReviews = reviews.map(buildReviewPayload);
    const hasViewerReview = viewerReview && normalizedReviews.some((review) => String(review._id) === String(viewerReview._id));
    if (viewerReview && !hasViewerReview) {
      normalizedReviews.unshift(buildReviewPayload(viewerReview));
    }

    return res.json({
      success: true,
      data: normalizedReviews,
      summary: {
        ratingAverage: Number(product.ratingAverage || 0),
        reviewCount: Number(product.reviewCount || 0)
      },
      viewer: {
        canReview: Boolean(eligibleOrder),
        isAuthenticated: Boolean(viewer?._id),
        isVerifiedPurchase: Boolean(eligibleOrder),
        orderNumber: eligibleOrder?.orderNumber || '',
        reason: viewer?._id && !eligibleOrder ? 'purchase_required' : '',
        reviewStatus: viewerReview ? normalizeReviewStatus(viewerReview.status) : ''
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const upsertMyProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const product = await getActiveProduct(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const eligibleOrder = await findEligibleOrder({ productId: id, userId: req.user._id });
    if (!eligibleOrder) {
      return res.status(403).json({
        success: false,
        message: 'Only customers who purchased this product can review it'
      });
    }

    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const title = normalizeText(req.body?.title, 120);
    const comment = normalizeComment(req.body?.comment, 1500);

    const existing = await ProductReview.findOne({ product: id, user: req.user._id }).select('_id');
    const review = await ProductReview.findOneAndUpdate(
      { product: id, user: req.user._id },
      {
        rating,
        title,
        comment,
        isVerifiedPurchase: true,
        verifiedOrder: eligibleOrder._id
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    ).populate('user', 'name avatar');

    const summary = await syncProductRatingSummary(id);

    return res.json({
      success: true,
      message: existing ? 'Review updated successfully' : 'Review submitted successfully',
      data: buildReviewPayload(review),
      summary
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }
    return next(error);
  }
};

export const deleteMyProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const removed = await ProductReview.findOneAndDelete({ product: id, user: req.user._id });
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const summary = await syncProductRatingSummary(id);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      summary
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminProductReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(20, Number.parseInt(req.query.limit, 10) || 10));
    const search = String(req.query.search || '').trim().toLowerCase();
    const rawStatus = String(req.query.status || '').trim().toLowerCase();
    const rating = Number.parseInt(req.query.rating, 10);
    const productId = String(req.query.productId || '').trim();
    const brandId = String(req.query.brandId || '').trim();
    const categoryId = String(req.query.categoryId || '').trim();

    const query = {};
    if (rawStatus && rawStatus !== 'all') {
      if (!PRODUCT_REVIEW_STATUSES.includes(rawStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid review status' });
      }
      query.status = rawStatus;
    }
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      query.rating = rating;
    }

    const productFilter = {};
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product id' });
      }
      productFilter._id = productId;
    }
    if (brandId) {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res.status(400).json({ success: false, message: 'Invalid brand id' });
      }
      productFilter.brand = brandId;
    }
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ success: false, message: 'Invalid category id' });
      }
      productFilter.$or = [
        { category: categoryId },
        { categories: categoryId }
      ];
    }

    if (Object.keys(productFilter).length > 0) {
      const matchedProducts = await Product.find(productFilter).select('_id').lean();
      if (matchedProducts.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            totalPages: 0,
            totalItems: 0
          }
        });
      }
      query.product = { $in: matchedProducts.map((product) => product._id) };
    }

    const rows = await ProductReview.find(query)
      .sort({ createdAt: -1 })
      .populate('product', 'name slug images')
      .populate('user', 'name email avatar')
      .populate('moderatedBy', 'name')
      .lean();

    const filtered = search
      ? rows.filter((review) => {
        const haystack = [
          review.product?.name,
          review.user?.name,
          review.user?.email,
          review.title,
          review.comment
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      })
      : rows;

    const totalItems = filtered.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const pageItems = filtered.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: pageItems.map((review) => ({
        ...buildReviewPayload(review),
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
          : null,
        moderatedAt: review.moderatedAt || null
      })),
      pagination: {
        page,
        totalPages,
        totalItems
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminProductReviewStatus = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const requestedStatus = String(req.body?.status || '').trim().toLowerCase();
    if (!PRODUCT_REVIEW_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid review status' });
    }
    const nextStatus = requestedStatus;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.status = nextStatus;
    review.moderatedBy = req.user?._id || null;
    review.moderatedAt = new Date();
    await review.save();

    const summary = await syncProductRatingSummary(review.product);
    const populated = await ProductReview.findById(reviewId)
      .populate('product', 'name slug images')
      .populate('user', 'name email avatar')
      .populate('moderatedBy', 'name');

    return res.json({
      success: true,
      message: 'Review status updated successfully',
      data: {
        ...buildReviewPayload(populated),
        product: populated.product
          ? {
            _id: populated.product._id,
            name: populated.product.name,
            slug: populated.product.slug,
            image: populated.product.images?.[0] || ''
          }
          : null,
        user: populated.user
          ? {
            _id: populated.user._id,
            name: populated.user.name,
            email: populated.user.email,
            avatar: populated.user.avatar || ''
          }
          : null,
        moderatedBy: populated.moderatedBy
          ? {
            _id: populated.moderatedBy._id,
            name: populated.moderatedBy.name
          }
          : null,
        moderatedAt: populated.moderatedAt || null
      },
      summary
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAdminProductReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const removed = await ProductReview.findByIdAndDelete(reviewId);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const summary = await syncProductRatingSummary(removed.product);

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      summary
    });
  } catch (error) {
    return next(error);
  }
};

export const bulkUpdateAdminProductReviewStatus = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const requestedStatus = String(req.body?.status || '').trim().toLowerCase();

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Ids must be a non-empty array' });
    }
    if (!PRODUCT_REVIEW_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid review status' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (objectIds.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'Invalid review ids' });
    }

    const reviews = await ProductReview.find({ _id: { $in: objectIds } }).select('_id product');
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: 'Reviews not found' });
    }

    await ProductReview.updateMany(
      { _id: { $in: reviews.map((review) => review._id) } },
      {
        status: requestedStatus,
        moderatedBy: req.user?._id || null,
        moderatedAt: new Date()
      }
    );

    await syncAffectedProductSummaries(reviews.map((review) => review.product));

    return res.json({
      success: true,
      message: 'Review statuses updated successfully',
      affectedCount: reviews.length
    });
  } catch (error) {
    return next(error);
  }
};

export const bulkDeleteAdminProductReviews = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Ids must be a non-empty array' });
    }

    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (objectIds.length !== ids.length) {
      return res.status(400).json({ success: false, message: 'Invalid review ids' });
    }

    const reviews = await ProductReview.find({ _id: { $in: objectIds } }).select('_id product');
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: 'Reviews not found' });
    }

    await ProductReview.deleteMany({ _id: { $in: reviews.map((review) => review._id) } });
    await syncAffectedProductSummaries(reviews.map((review) => review.product));

    return res.json({
      success: true,
      message: 'Reviews deleted successfully',
      affectedCount: reviews.length
    });
  } catch (error) {
    return next(error);
  }
};
