import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Order, {
  ORDER_AFTERSALES_REQUEST_STATUSES,
  ORDER_AFTERSALES_REQUEST_TYPES,
  ORDER_CHECKOUT_STATUSES,
  ORDER_PAYMENT_METHODS,
  ORDER_PAYMENT_STATUSES,
  ORDER_REFUND_REQUEST_STATUSES,
  ORDER_STATUSES
} from '../models/Order.js';
import Product from '../models/Product.js';
import {
  consumeCouponUsageForOrder,
  releaseCouponUsageForOrder,
  reserveCouponUsageForOrder,
  validateCouponForCheckout
} from '../services/couponService.js';
import {
  buildFrontendMomoReturnUrl,
  createMomoPayment,
  isMomoAutoCaptureEnabled,
  isMomoConfigured,
  normalizeMomoResultPayload,
  verifyMomoResultSignature
} from '../services/momoService.js';
import {
  buildOrderShipmentFromEstimate,
  buildShippingEstimateTimelineNote,
  calculateShippingEstimate
} from '../services/shippingService.js';
import {
  applyCompletedOrderLoyalty,
  getLoyaltyTierBenefits,
  reverseOrderLoyalty
} from '../services/loyaltyService.js';
import { emitRealtimeEvent } from '../services/realtimeService.js';

const PRODUCT_VISIBLE_STATUS = 'active';
const PRODUCT_STATUSES = ['active', 'hidden', 'draft', 'archived', 'out_of_stock'];
const PRODUCT_STOCK_SELECTION = 'name stock stockQuantity status previousStatus';
const CHECKOUT_FINAL_STATUSES = ['paid', 'failed', 'cancelled', 'expired'];
const CHECKOUT_ACTIVE_STATUSES = ['created', 'awaiting_payment', 'processing_payment'];
const MOMO_PENDING_RESULT_CODES = new Set([7000, 7002, 9000, 9100, 9101]);
const MOMO_CANCELLED_RESULT_CODES = new Set([1006, 1017]);
const MOMO_EXPIRED_RESULT_CODES = new Set([1005]);
const AFTERSALES_FINAL_STATUSES = ['approved', 'rejected', 'completed'];
const AFTERSALES_SLA_TRACKED_STATUSES = ['submitted', 'under_review', 'received', 'approved', 'refund_processing'];

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBooleanFlag = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const getMomoPaymentExpiryMinutes = () => {
  const minutes = parseNumber(process.env.MOMO_PAYMENT_EXPIRE_MINUTES, 120);
  return Math.min(Math.max(minutes, 5), 24 * 60);
};

const getRefundRequestWindowDays = () => {
  const days = parseNumber(process.env.ORDER_REFUND_REQUEST_DAYS, 7);
  return Math.min(Math.max(days, 1), 30);
};

const getAftersalesSlaHours = () => {
  const hours = parseNumber(process.env.ORDER_AFTERSALES_SLA_HOURS, 48);
  return Math.min(Math.max(hours, 1), 24 * 14);
};

const getAftersalesSlaRiskHours = () => {
  const hours = parseNumber(process.env.ORDER_AFTERSALES_SLA_RISK_HOURS, 12);
  return Math.min(Math.max(hours, 1), getAftersalesSlaHours());
};

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeUrl = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return /^https?:\/\//i.test(normalized) ? normalized.slice(0, 500) : '';
};

const serializeActorName = (user) => normalizeText(user?.name || user?.email || user?.role || '').slice(0, 255);

const normalizeShipmentInput = (value = {}) => {
  const shipment = value && typeof value === 'object' ? value : {};
  return {
    zone: normalizeText(shipment.zone).slice(0, 50),
    carrier: normalizeText(shipment.carrier).slice(0, 120),
    service: normalizeText(shipment.service).slice(0, 120),
    trackingNumber: normalizeText(shipment.trackingNumber).slice(0, 120),
    trackingUrl: normalizeUrl(shipment.trackingUrl),
    estimatedMinDays: Number.isFinite(Number(shipment.estimatedMinDays)) ? Math.max(0, parseNumber(shipment.estimatedMinDays, 0)) : null,
    estimatedMaxDays: Number.isFinite(Number(shipment.estimatedMaxDays)) ? Math.max(0, parseNumber(shipment.estimatedMaxDays, 0)) : null
  };
};

const ensureShipmentState = (order) => {
  if (!order?.shipment || typeof order.shipment !== 'object') {
    order.shipment = {};
  }

  order.shipment.zone = String(order.shipment?.zone || '').trim();
  order.shipment.carrier = String(order.shipment?.carrier || '').trim();
  order.shipment.service = String(order.shipment?.service || '').trim();
  order.shipment.trackingNumber = String(order.shipment?.trackingNumber || '').trim();
  order.shipment.trackingUrl = String(order.shipment?.trackingUrl || '').trim();
  order.shipment.estimatedMinDays = Number.isFinite(Number(order.shipment?.estimatedMinDays))
    ? Math.max(0, Number(order.shipment.estimatedMinDays))
    : null;
  order.shipment.estimatedMaxDays = Number.isFinite(Number(order.shipment?.estimatedMaxDays))
    ? Math.max(0, Number(order.shipment.estimatedMaxDays))
    : null;
  order.shipment.shippedAt = order.shipment?.shippedAt || null;
  order.shipment.deliveredAt = order.shipment?.deliveredAt || null;
  order.shipment.lastUpdatedAt = order.shipment?.lastUpdatedAt || null;
};

const appendOrderTimeline = (order, type, note = '', actorName = '', createdAt = new Date()) => {
  if (!order) return;
  if (!Array.isArray(order.timeline)) {
    order.timeline = [];
  }

  const nextEntry = {
    type: String(type || '').trim(),
    note: normalizeText(note).slice(0, 500),
    actorName: normalizeText(actorName).slice(0, 255),
    createdAt
  };

  if (!nextEntry.type) return;

  const lastEntry = order.timeline[order.timeline.length - 1];
  if (lastEntry?.type === nextEntry.type
    && String(lastEntry?.note || '') === nextEntry.note
    && String(lastEntry?.actorName || '') === nextEntry.actorName
  ) {
    const lastTime = new Date(lastEntry.createdAt || 0).getTime();
    const nextTime = new Date(nextEntry.createdAt || 0).getTime();
    if (Number.isFinite(lastTime) && Number.isFinite(nextTime) && Math.abs(nextTime - lastTime) < 1000) {
      return;
    }
  }

  order.timeline.push(nextEntry);
};

const appendOrderInternalNote = (order, note, actor) => {
  if (!order) return;
  if (!Array.isArray(order.internalNotes)) {
    order.internalNotes = [];
  }

  const nextNote = normalizeText(note).slice(0, 1000);
  if (!nextNote) return;

  order.internalNotes.push({
    note: nextNote,
    author: actor?._id || null,
    authorName: serializeActorName(actor),
    createdAt: new Date()
  });
};

const appendOrderEditHistory = (order, {
  action,
  note = '',
  actor = null,
  changes = [],
  createdAt = new Date()
} = {}) => {
  if (!order) return;
  if (!Array.isArray(order.editHistory)) {
    order.editHistory = [];
  }

  const safeAction = normalizeText(action).slice(0, 120);
  if (!safeAction) return;

  const safeChanges = Array.isArray(changes)
    ? changes
      .map((change) => ({
        field: normalizeText(change?.field).slice(0, 120),
        from: normalizeText(change?.from).slice(0, 500),
        to: normalizeText(change?.to).slice(0, 500)
      }))
      .filter((change) => change.field)
    : [];

  order.editHistory.push({
    action: safeAction,
    note: normalizeText(note).slice(0, 1000),
    actor: actor?._id || null,
    actorName: serializeActorName(actor),
    changes: safeChanges,
    createdAt
  });
};

const normalizeEvidenceItem = (item = {}) => {
  const candidate = item && typeof item === 'object' ? item : {};
  const url = normalizeUrl(candidate.url);
  if (!url) return null;

  return {
    url,
    name: normalizeText(candidate.name).slice(0, 255),
    mimeType: normalizeText(candidate.mimeType).slice(0, 120),
    size: Math.max(0, Number(candidate.size) || 0),
    uploadedAt: candidate.uploadedAt ? new Date(candidate.uploadedAt) : new Date()
  };
};

const normalizeEvidenceList = (value) => (
  Array.isArray(value)
    ? value.map((item) => normalizeEvidenceItem(item)).filter(Boolean)
    : []
);

const ensureOrderInternalCollections = (order) => {
  if (!Array.isArray(order?.internalNotes)) {
    order.internalNotes = [];
  }
  if (!Array.isArray(order?.editHistory)) {
    order.editHistory = [];
  }
};

const ensureAftersalesState = (order) => {
  if (!order) return;
  if (!order.aftersalesRequest || typeof order.aftersalesRequest !== 'object') {
    order.aftersalesRequest = {};
  }

  const nextStatus = String(order.aftersalesRequest.status || 'none').trim();
  order.aftersalesRequest.type = String(order.aftersalesRequest.type || '').trim();
  order.aftersalesRequest.status = ORDER_AFTERSALES_REQUEST_STATUSES.includes(nextStatus) ? nextStatus : 'none';
  order.aftersalesRequest.reason = String(order.aftersalesRequest.reason || '').trim();
  order.aftersalesRequest.customerNote = String(order.aftersalesRequest.customerNote || '').trim();
  order.aftersalesRequest.adminNote = String(order.aftersalesRequest.adminNote || '').trim();
  order.aftersalesRequest.requestedAt = order.aftersalesRequest.requestedAt || null;
  order.aftersalesRequest.updatedAt = order.aftersalesRequest.updatedAt || null;
  order.aftersalesRequest.reviewedAt = order.aftersalesRequest.reviewedAt || null;
  order.aftersalesRequest.completedAt = order.aftersalesRequest.completedAt || null;
  order.aftersalesRequest.requestedBy = order.aftersalesRequest.requestedBy || null;
  order.aftersalesRequest.reviewedBy = order.aftersalesRequest.reviewedBy || null;
  order.aftersalesRequest.evidence = normalizeEvidenceList(order.aftersalesRequest.evidence);
};

const getAftersalesStatus = (order) => String(order?.aftersalesRequest?.status || 'none').trim().toLowerCase();

const canCustomerCreateAftersalesRequest = (order) => {
  if (!order) return false;
  if (order.status !== 'completed') return false;
  if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') return false;
  if (!order.completedAt) return false;
  if (!['none', 'rejected', 'completed'].includes(getAftersalesStatus(order))) return false;

  const completedAt = new Date(order.completedAt).getTime();
  if (!Number.isFinite(completedAt)) return false;
  const expiresAt = completedAt + (getRefundRequestWindowDays() * 24 * 60 * 60 * 1000);
  return expiresAt > Date.now();
};

const syncLegacyRefundStateFromAftersales = (order, actorId = null) => {
  if (!order) return;
  const type = String(order?.aftersalesRequest?.type || '').trim();
  if (!['refund', 'return_refund'].includes(type)) return;

  const aftersalesStatus = getAftersalesStatus(order);
  if (['submitted', 'under_review', 'awaiting_return', 'received', 'refund_processing'].includes(aftersalesStatus)) {
    order.refundRequest.status = 'pending';
    order.refundRequest.reason = order.aftersalesRequest.reason || order.refundRequest.reason || '';
    order.refundRequest.requestedAt = order.aftersalesRequest.requestedAt || order.refundRequest.requestedAt || new Date();
    order.refundRequest.reviewedAt = null;
    order.refundRequest.reviewedBy = null;
    order.refundRequest.reviewNote = '';
    order.refundRequest.evidence = normalizeEvidenceList(order.aftersalesRequest.evidence);
    return;
  }

  if (['approved', 'completed'].includes(aftersalesStatus)) {
    order.refundRequest.status = 'approved';
    order.refundRequest.reason = order.aftersalesRequest.reason || order.refundRequest.reason || '';
    order.refundRequest.reviewNote = order.aftersalesRequest.adminNote || order.refundRequest.reviewNote || '';
    order.refundRequest.reviewedAt = order.aftersalesRequest.reviewedAt || order.refundRequest.reviewedAt || new Date();
    order.refundRequest.reviewedBy = actorId || order.aftersalesRequest.reviewedBy || order.refundRequest.reviewedBy || null;
    order.refundRequest.evidence = normalizeEvidenceList(order.aftersalesRequest.evidence);
    return;
  }

  if (aftersalesStatus === 'rejected') {
    order.refundRequest.status = 'rejected';
    order.refundRequest.reason = order.aftersalesRequest.reason || order.refundRequest.reason || '';
    order.refundRequest.reviewNote = order.aftersalesRequest.adminNote || order.refundRequest.reviewNote || '';
    order.refundRequest.reviewedAt = order.aftersalesRequest.reviewedAt || order.refundRequest.reviewedAt || new Date();
    order.refundRequest.reviewedBy = actorId || order.aftersalesRequest.reviewedBy || order.refundRequest.reviewedBy || null;
    order.refundRequest.evidence = normalizeEvidenceList(order.aftersalesRequest.evidence);
  }
};

const emitOrderRealtimeUpdate = (order, type, extra = {}) => {
  if (!order) return;
  emitRealtimeEvent({
    type,
    audience: 'admins',
    data: { orderId: String(order._id), orderNumber: order.orderNumber, ...extra }
  });
  emitRealtimeEvent({
    type,
    audience: 'user',
    userId: String(order.user?._id || order.user || ''),
    data: { orderId: String(order._id), orderNumber: order.orderNumber, ...extra }
  });
};

const seedOrderTimelineFromState = (order) => {
  if (!order || (Array.isArray(order.timeline) && order.timeline.length > 0)) return false;

  const actorName = normalizeText(order.customer?.name || '').slice(0, 255);
  const createdAt = order.createdAt || new Date();
  appendOrderTimeline(order, 'order_created', '', actorName, createdAt);

  if (order.paymentMethod === 'bank_transfer') {
    appendOrderTimeline(order, 'payment_link_created', '', actorName, createdAt);
  }

  if (order.shippingFee > 0 || order.shipment?.zone || order.shipment?.carrier || order.shipment?.service) {
    appendOrderTimeline(
      order,
      'shipping_estimated',
      buildShippingEstimateTimelineNote({
        zone: order.shipment?.zone,
        carrier: order.shipment?.carrier,
        service: order.shipment?.service,
        estimatedMinDays: order.shipment?.estimatedMinDays,
        estimatedMaxDays: order.shipment?.estimatedMaxDays,
        shippingFee: order.shippingFee
      }),
      actorName,
      createdAt
    );
  }

  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    appendOrderTimeline(order, 'payment_paid', '', actorName, order.updatedAt || createdAt);
  } else if (order.paymentStatus === 'failed') {
    appendOrderTimeline(order, 'payment_failed', order.paymentMessage || '', actorName, order.updatedAt || createdAt);
  }

  if (order.shipment?.carrier || order.shipment?.trackingNumber || order.shipment?.trackingUrl) {
    appendOrderTimeline(
      order,
      'shipment_updated',
      buildShipmentTimelineNote(order.shipment),
      actorName,
      order.shipment?.lastUpdatedAt || order.updatedAt || createdAt
    );
  }

  const statusTypeMap = {
    confirmed: 'order_confirmed',
    processing: 'order_processing',
    packing: 'order_packing',
    shipping: 'order_shipping',
    completed: 'order_completed',
    cancelled: 'order_cancelled'
  };
  if (statusTypeMap[order.status]) {
    appendOrderTimeline(
      order,
      statusTypeMap[order.status],
      '',
      actorName,
      order.completedAt || order.cancelledAt || order.shipment?.shippedAt || order.updatedAt || createdAt
    );
  }

  if (order.refundRequest?.status === 'pending') {
    appendOrderTimeline(order, 'refund_requested', order.refundRequest.reason || '', actorName, order.refundRequest.requestedAt || order.updatedAt || createdAt);
  } else if (order.refundRequest?.status === 'approved') {
    appendOrderTimeline(order, 'refund_approved', order.refundRequest.reviewNote || '', actorName, order.refundRequest.reviewedAt || order.updatedAt || createdAt);
  } else if (order.refundRequest?.status === 'rejected') {
    appendOrderTimeline(order, 'refund_rejected', order.refundRequest.reviewNote || '', actorName, order.refundRequest.reviewedAt || order.updatedAt || createdAt);
  }

  if (order.aftersalesRequest?.status && order.aftersalesRequest.status !== 'none') {
    appendOrderTimeline(
      order,
      `aftersales_${order.aftersalesRequest.status}`,
      order.aftersalesRequest.adminNote || order.aftersalesRequest.customerNote || order.aftersalesRequest.reason || '',
      actorName,
      order.aftersalesRequest.updatedAt || order.aftersalesRequest.requestedAt || order.updatedAt || createdAt
    );
  }

  if (order.loyalty?.awardedAt) {
    appendOrderTimeline(
      order,
      'loyalty_awarded',
      `points:${Number(order.loyalty.awardedPoints || 0)} | tier:${order.loyalty.tierAfterAward || ''}`,
      actorName,
      order.loyalty.awardedAt
    );
  }

  if (order.loyalty?.reversedAt) {
    appendOrderTimeline(
      order,
      'loyalty_reversed',
      `points:${Number(order.loyalty.reversedPoints || 0)} | tier:${order.loyalty.tierAfterAward || ''}`,
      actorName,
      order.loyalty.reversedAt
    );
  }

  return true;
};

const syncShipmentMilestones = (order) => {
  if (!order) return;
  ensureShipmentState(order);

  if (order.status === 'shipping' && !order.shipment.shippedAt) {
    order.shipment.shippedAt = new Date();
  }

  if (order.status === 'completed') {
    order.shipment.shippedAt = order.shipment.shippedAt || new Date();
    order.shipment.deliveredAt = order.shipment.deliveredAt || new Date();
  }
};

const buildShipmentTimelineNote = (shipment = {}) => (
  [
    shipment.zone ? `zone:${shipment.zone}` : '',
    shipment.carrier ? `carrier:${shipment.carrier}` : '',
    shipment.service ? `service:${shipment.service}` : '',
    shipment.trackingNumber ? `tracking:${shipment.trackingNumber}` : '',
    shipment.trackingUrl ? `link:${shipment.trackingUrl}` : '',
    Number.isFinite(Number(shipment.estimatedMinDays)) || Number.isFinite(Number(shipment.estimatedMaxDays))
      ? `eta:${Number(shipment.estimatedMinDays) || 0}-${Number(shipment.estimatedMaxDays) || Number(shipment.estimatedMinDays) || 0}`
      : ''
  ]
    .filter(Boolean)
    .join(' | ')
);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isAdminUser = (user) => ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'].includes(user?.role);

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim());

const isValidPhone = (value) => /^(03|05|07|08|09)\d{8}$/.test(String(value || '').trim());

const isCheckoutFinalStatus = (status) => CHECKOUT_FINAL_STATUSES.includes(String(status || '').trim());

const buildPaymentExpiryDate = (paymentMethod) => (
  paymentMethod === 'bank_transfer'
    ? new Date(Date.now() + (getMomoPaymentExpiryMinutes() * 60 * 1000))
    : null
);

const buildHistoricPaymentExpiryDate = (createdAt) => (
  createdAt
    ? new Date(new Date(createdAt).getTime() + (getMomoPaymentExpiryMinutes() * 60 * 1000))
    : buildPaymentExpiryDate('bank_transfer')
);

const getUnitPrice = (product) => {
  const salePrice = Number(product?.salePrice);
  const price = Number(product?.price) || 0;
  if (Number.isFinite(salePrice) && salePrice >= 0 && salePrice <= price) {
    return salePrice;
  }
  return price;
};

const getProductStock = (product) => {
  const stock = Number(product?.stock);
  if (Number.isFinite(stock)) return stock;
  const stockQuantity = Number(product?.stockQuantity);
  return Number.isFinite(stockQuantity) ? stockQuantity : 0;
};

const buildOrderNumber = async () => {
  for (let index = 0; index < 6; index += 1) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    const orderNumber = `ORD-${stamp}-${random}`;
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  return `ORD-${Date.now()}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
};

const mergeRequestedItems = (items) => {
  if (!Array.isArray(items)) return [];

  const merged = new Map();

  items.forEach((item) => {
    const productId = String(item?.productId || '').trim();
    const quantity = Math.max(1, parseNumber(item?.quantity, 1));
    const variant = normalizeText(item?.variant);

    if (!productId) return;

    const key = `${productId}::${variant}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += quantity;
      return;
    }
    merged.set(key, { productId, quantity, variant });
  });

  return Array.from(merged.values());
};

const ensureOrderAccess = (order, user) => {
  if (!order || !user) return false;
  if (isAdminUser(user) || user.role === 'SUPER_ADMIN') return true;
  return String(order.user?._id || order.user) === String(user._id);
};

const buildProductStockUpdates = (product, nextStock) => {
  const updates = {
    stock: nextStock,
    stockQuantity: nextStock
  };

  if (nextStock === 0) {
    if (product.status !== 'out_of_stock') {
      updates.previousStatus = product.status && product.status !== 'out_of_stock'
        ? product.status
        : product.previousStatus;
    }
    updates.status = 'out_of_stock';
    return updates;
  }

  if (product.status === 'out_of_stock') {
    updates.status = product.previousStatus && PRODUCT_STATUSES.includes(product.previousStatus)
      ? product.previousStatus
      : 'active';
    updates.previousStatus = null;
  }

  return updates;
};

const applyStockChange = async (product, quantityDelta) => {
  const currentStock = getProductStock(product);
  const nextStock = currentStock + quantityDelta;
  if (nextStock < 0) {
    throw new Error('Insufficient stock');
  }

  const updates = buildProductStockUpdates(product, nextStock);
  return Product.findByIdAndUpdate(product._id, updates, { new: true, runValidators: true });
};

const loadOrderProducts = async (order) => {
  const ids = [...new Set((order?.items || []).map((item) => String(item?.productId || '')).filter(Boolean))];
  if (ids.length === 0) return new Map();

  const products = await Product.find({ _id: { $in: ids } }).select(PRODUCT_STOCK_SELECTION);
  return new Map(products.map((product) => [String(product._id), product]));
};

const reserveOrderItems = async (order) => {
  const productMap = await loadOrderProducts(order);

  for (const item of order.items || []) {
    const product = productMap.get(String(item.productId));
    if (!product) {
      throw new Error('One or more products are no longer available');
    }
    const required = Number(item.quantity) || 0;
    if (getProductStock(product) < required) {
      throw new Error(`${item.name} has insufficient stock to continue`);
    }
  }

  for (const item of order.items || []) {
    const product = productMap.get(String(item.productId));
    const updated = await applyStockChange(product, -(Number(item.quantity) || 0));
    productMap.set(String(updated._id), updated);
  }
};

const restockOrderItems = async (order) => {
  const productMap = await loadOrderProducts(order);

  for (const item of order.items || []) {
    const product = productMap.get(String(item.productId));
    if (!product) continue;
    const updated = await applyStockChange(product, Number(item.quantity) || 0);
    productMap.set(String(updated._id), updated);
  }
};

const syncCouponReservationForOrder = async (order) => {
  if (!order?.couponId) return order;

  if (order.status === 'cancelled' || order.paymentStatus === 'failed' || order.checkoutStatus === 'expired') {
    await releaseCouponUsageForOrder(order);
    return order;
  }

  if (order.status === 'completed' || order.paymentStatus === 'paid') {
    await consumeCouponUsageForOrder(order);
    return order;
  }

  if (order.couponReservationStatus === 'released') {
    await reserveCouponUsageForOrder(order);
    return order;
  }

  return order;
};

const syncCheckoutStatusFromOrderState = (order) => {
  if (!order) return;

  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    order.checkoutStatus = 'paid';
    return;
  }

  if (order.checkoutStatus === 'expired') return;

  if (order.status === 'cancelled') {
    order.checkoutStatus = order.paymentStatus === 'failed' && order.checkoutStatus !== 'cancelled'
      ? 'failed'
      : 'cancelled';
    return;
  }

  if (order.paymentStatus === 'failed') {
    order.checkoutStatus = 'failed';
    return;
  }

  if (order.paymentMethod === 'bank_transfer') {
    if (order.checkoutStatus === 'processing_payment') return;
    order.checkoutStatus = order.paymentRequestId || order.paymentRedirectUrl ? 'awaiting_payment' : 'created';
    return;
  }

  order.checkoutStatus = 'awaiting_payment';
};

const expireOrderCheckoutIfNeeded = async (order) => {
  if (!order) return order;
  if (order.paymentMethod !== 'bank_transfer') return order;
  if (isCheckoutFinalStatus(order.checkoutStatus)) return order;
  if (order.paymentStatus === 'paid') return order;
  if (!order.paymentExpiresAt) return order;
  if (new Date(order.paymentExpiresAt).getTime() > Date.now()) return order;

  if (order.status !== 'cancelled') {
    await restockOrderItems(order);
    order.status = 'cancelled';
    order.cancelledAt = order.cancelledAt || new Date();
    order.completedAt = null;
    appendOrderTimeline(order, 'order_cancelled', 'Payment expired', 'System', order.cancelledAt);
  }

  order.paymentStatus = 'failed';
  order.checkoutStatus = 'expired';
  appendOrderTimeline(order, 'payment_failed', order.paymentMessage || 'Payment expired', 'System', new Date());
  await order.save();
  await syncCouponReservationForOrder(order);
  return order;
};

const expireOnlineOrderFromCustomerReturn = async (order, message = '') => {
  if (!order) return order;
  if (order.paymentMethod !== 'bank_transfer') return order;
  if (isCheckoutFinalStatus(order.checkoutStatus) || order.paymentStatus === 'paid') return order;

  if (order.status !== 'cancelled') {
    await restockOrderItems(order);
    order.status = 'cancelled';
    order.cancelledAt = order.cancelledAt || new Date();
    order.completedAt = null;
    appendOrderTimeline(order, 'order_cancelled', message || 'Customer returned without completing payment', 'Customer', order.cancelledAt);
  }

  order.paymentStatus = 'failed';
  order.checkoutStatus = 'expired';
  if (message) {
    order.paymentMessage = message;
  }
  appendOrderTimeline(order, 'payment_failed', order.paymentMessage || 'Payment cancelled', 'Customer', new Date());
  await order.save();
  await syncCouponReservationForOrder(order);
  return order;
};

const expireStaleOnlineOrders = async () => {
  const staleOrders = await Order.find({
    $or: [
      {
        paymentMethod: 'bank_transfer',
        paymentStatus: { $ne: 'paid' },
        checkoutStatus: { $in: CHECKOUT_ACTIVE_STATUSES }
      },
      { checkoutStatus: { $exists: false } },
      { checkoutStatus: null },
      { checkoutStatus: '' }
    ]
  });

  for (const order of staleOrders) {
    await normalizeOrderLifecycleState(order);
  }
};

const normalizeOrderLifecycleState = async (order) => {
  if (!order) return order;

  let changed = false;

  ensureShipmentState(order);
  ensureOrderInternalCollections(order);
  ensureAftersalesState(order);

  if (order.paymentMethod === 'bank_transfer' && !order.paymentExpiresAt) {
    order.paymentExpiresAt = buildHistoricPaymentExpiryDate(order.createdAt);
    changed = true;
  }

  if (!ORDER_CHECKOUT_STATUSES.includes(order.checkoutStatus)) {
    syncCheckoutStatusFromOrderState(order);
    changed = true;
  }

  if (!ORDER_REFUND_REQUEST_STATUSES.includes(order?.refundRequest?.status)) {
    order.refundRequest = {
      status: 'none',
      reason: '',
      requestedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: ''
    };
    changed = true;
  }

  if (order.status === 'completed' && !order.completedAt) {
    order.completedAt = order.updatedAt || order.createdAt || new Date();
    changed = true;
  }

  if (!order.loyalty || typeof order.loyalty !== 'object') {
    order.loyalty = {};
    changed = true;
  }

  syncShipmentMilestones(order);

  if (seedOrderTimelineFromState(order)) {
    changed = true;
  }

  if (changed) {
    await order.save();
  }

  await expireOrderCheckoutIfNeeded(order);
  await syncCouponReservationForOrder(order);
  const loyaltyAward = await applyCompletedOrderLoyalty(order);
  if (loyaltyAward) {
    appendOrderTimeline(
      order,
      'loyalty_awarded',
      `points:${loyaltyAward.awardedPoints} | tier:${loyaltyAward.nextTier}`,
      'System',
      new Date()
    );
    appendOrderEditHistory(order, {
      action: 'order.loyalty_awarded',
      actor: null,
      note: `Awarded ${loyaltyAward.awardedPoints} loyalty points`,
      changes: [
        { field: 'loyalty.awardedPoints', from: '0', to: String(loyaltyAward.awardedPoints) },
        { field: 'user.memberTier', from: loyaltyAward.previousTier, to: loyaltyAward.nextTier }
      ]
    });
    await order.save();
  }

  const loyaltyReversal = await reverseOrderLoyalty(order);
  if (loyaltyReversal) {
    appendOrderTimeline(
      order,
      'loyalty_reversed',
      `points:${loyaltyReversal.reversedPoints} | tier:${loyaltyReversal.nextTier}`,
      'System',
      new Date()
    );
    appendOrderEditHistory(order, {
      action: 'order.loyalty_reversed',
      actor: null,
      note: `Reversed ${loyaltyReversal.reversedPoints} loyalty points`,
      changes: [
        { field: 'loyalty.reversedPoints', from: '0', to: String(loyaltyReversal.reversedPoints) },
        { field: 'user.memberTier', from: loyaltyReversal.previousTier, to: loyaltyReversal.nextTier }
      ]
    });
    await order.save();
  }
  return order;
};

const populateOrderQuery = (query) =>
  query
    .populate('user', 'name email avatar role')
    .populate('refundRequest.reviewedBy', 'name email avatar role')
    .populate('internalNotes.author', 'name email avatar role')
    .populate('editHistory.actor', 'name email avatar role')
    .populate('aftersalesRequest.requestedBy', 'name email avatar role')
    .populate('aftersalesRequest.reviewedBy', 'name email avatar role');

const getRefundRequestStatus = (order) => String(order?.refundRequest?.status || 'none').trim().toLowerCase();

const canCustomerRequestRefund = (order) => {
  if (!order) return false;
  if (order.status !== 'completed') return false;
  if (order.paymentStatus !== 'paid') return false;
  if (!order.completedAt) return false;
  if (getRefundRequestStatus(order) === 'pending') return false;
  if (getRefundRequestStatus(order) === 'approved') return false;
  if (!['none', 'rejected', 'completed'].includes(getAftersalesStatus(order))) return false;

  const completedAt = new Date(order.completedAt).getTime();
  if (!Number.isFinite(completedAt)) return false;
  const expiresAt = completedAt + (getRefundRequestWindowDays() * 24 * 60 * 60 * 1000);
  return expiresAt > Date.now();
};

const getRefundDeadline = (order) => {
  if (!order?.completedAt) return null;
  const completedAt = new Date(order.completedAt).getTime();
  if (!Number.isFinite(completedAt)) return null;
  return new Date(completedAt + (getRefundRequestWindowDays() * 24 * 60 * 60 * 1000));
};

const syncOrderWithMomoResult = async (payload) => {
  const normalized = normalizeMomoResultPayload(payload);
  if (!normalized.orderId) {
    return { status: 'invalid', resultCode: null, message: 'Missing orderId', order: null };
  }
  if (!verifyMomoResultSignature(normalized)) {
    return { status: 'invalid_signature', resultCode: normalized.resultCode, message: 'Invalid signature', order: null };
  }

  const order = await Order.findOne({ orderNumber: normalized.orderId });
  if (!order) {
    return { status: 'not_found', resultCode: normalized.resultCode, message: 'Order not found', order: null };
  }

  if (String(Math.round(Number(order.totalAmount) || 0)) !== String(Math.round(Number(normalized.amount) || 0))) {
    return { status: 'amount_mismatch', resultCode: normalized.resultCode, message: 'Amount mismatch', order };
  }

  order.paymentProvider = 'momo';
  const previousStatus = order.status;
  const previousPaymentStatus = order.paymentStatus;
  const previousCheckoutStatus = order.checkoutStatus;
  order.paymentRequestId = normalized.requestId || order.paymentRequestId;
  order.paymentTransactionId = normalized.transId || order.paymentTransactionId;
  order.paymentResponseTime = Number(normalized.responseTime || 0) || order.paymentResponseTime;
  order.paymentMessage = normalized.message || order.paymentMessage;
  order.paymentPayType = normalized.payType || order.paymentPayType;

  const resultCode = Number(normalized.resultCode);
  const autoCaptureEnabled = isMomoAutoCaptureEnabled();

  if (resultCode === 0 || (resultCode === 9000 && autoCaptureEnabled)) {
    order.paymentStatus = 'paid';
    order.checkoutStatus = 'paid';
    appendOrderTimeline(order, 'payment_paid', normalized.message || '', 'MoMo', new Date());

    if (order.status === 'cancelled') {
      try {
        await reserveOrderItems(order);
        order.status = 'confirmed';
        order.cancelledAt = null;
        appendOrderTimeline(order, 'order_confirmed', 'Inventory re-reserved after successful payment', 'MoMo', new Date());
      } catch {
        order.paymentMessage = [normalized.message, 'Paid on MoMo. Inventory requires manual review']
          .filter(Boolean)
          .join(' | ');
      }
    } else if (order.status === 'pending') {
      order.status = 'confirmed';
      appendOrderTimeline(order, 'order_confirmed', '', 'MoMo', new Date());
    }
  } else if (MOMO_PENDING_RESULT_CODES.has(resultCode)) {
    order.paymentStatus = 'pending';
    order.checkoutStatus = 'processing_payment';
  } else if (MOMO_EXPIRED_RESULT_CODES.has(resultCode)) {
    order.paymentStatus = 'failed';
    order.checkoutStatus = 'expired';
    appendOrderTimeline(order, 'payment_failed', normalized.message || 'Payment expired', 'MoMo', new Date());
    if (order.status !== 'cancelled') {
      await restockOrderItems(order);
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.completedAt = null;
      appendOrderTimeline(order, 'order_cancelled', 'Payment expired', 'MoMo', order.cancelledAt);
    }
  } else if (MOMO_CANCELLED_RESULT_CODES.has(resultCode)) {
    order.paymentStatus = 'failed';
    order.checkoutStatus = 'cancelled';
    appendOrderTimeline(order, 'payment_failed', normalized.message || 'Payment cancelled', 'MoMo', new Date());
    if (order.status !== 'cancelled') {
      await restockOrderItems(order);
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.completedAt = null;
      appendOrderTimeline(order, 'order_cancelled', 'Payment cancelled', 'MoMo', order.cancelledAt);
    }
  } else if (order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
    order.checkoutStatus = 'failed';
    appendOrderTimeline(order, 'payment_failed', normalized.message || 'Payment failed', 'MoMo', new Date());
    if (order.status !== 'cancelled') {
      await restockOrderItems(order);
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.completedAt = null;
      appendOrderTimeline(order, 'order_cancelled', 'Payment failed', 'MoMo', order.cancelledAt);
    }
  }

  appendOrderEditHistory(order, {
    action: 'payment.momo_result',
    actor: null,
    note: normalized.message || `MoMo result ${resultCode}`,
    changes: [
      { field: 'status', from: previousStatus, to: order.status },
      { field: 'paymentStatus', from: previousPaymentStatus, to: order.paymentStatus },
      { field: 'checkoutStatus', from: previousCheckoutStatus, to: order.checkoutStatus }
    ].filter((item) => item.from !== item.to)
  });

  await order.save();
  await syncCouponReservationForOrder(order);
  emitOrderRealtimeUpdate(order, 'order.payment_updated', {
    status: order.status,
    paymentStatus: order.paymentStatus,
    checkoutStatus: order.checkoutStatus
  });
  return {
    status:
      order.checkoutStatus === 'paid'
        ? 'success'
        : order.checkoutStatus === 'processing_payment'
          ? 'pending'
          : order.checkoutStatus,
    resultCode,
    message: normalized.message,
    order
  };
};

const buildMomoConfirmResponse = (result) => ({
  success:
    result.status !== 'invalid'
    && result.status !== 'invalid_signature'
    && result.status !== 'not_found'
    && result.status !== 'amount_mismatch',
  data: {
    status: result.status,
    orderNumber: result.order?.orderNumber || '',
    checkoutStatus: result.order?.checkoutStatus || '',
    paymentCode: result.resultCode ?? '',
    paymentMessage: result.message || '',
    paymentResult:
      result.status === 'success'
        ? 'success'
        : result.status === 'pending' || result.order?.checkoutStatus === 'processing_payment'
          ? 'pending'
          : 'failed'
  }
});

const getRequestedItemCount = (items = []) => items.reduce(
  (sum, item) => sum + Math.max(1, parseNumber(item?.quantity, 1)),
  0
);

export const estimateOrderShipping = async (req, res, next) => {
  try {
    const address = normalizeText(req.body?.address || req.user?.address);
    if (!address) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const subtotal = Math.max(0, Number(req.body?.subtotal) || 0);
    const itemCount = Math.max(1, parseNumber(req.body?.itemCount, 1));
    const paymentMethod = String(req.body?.paymentMethod || 'cod').trim();

    if (!ORDER_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const loyaltyBenefits = getLoyaltyTierBenefits(req.user?.memberTier);
    const estimate = calculateShippingEstimate({
      address,
      subtotal,
      itemCount,
      paymentMethod,
      shippingDiscountPercent: loyaltyBenefits.shippingDiscountPercent
    });

    return res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const requestedItems = mergeRequestedItems(req.body?.items);
    if (requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const customer = {
      name: normalizeText(req.body?.customer?.name || req.user?.name),
      email: normalizeEmail(req.body?.customer?.email || req.user?.email),
      phone: normalizeText(req.body?.customer?.phone || req.user?.phone),
      address: normalizeText(req.body?.customer?.address || req.user?.address)
    };

    if (!customer.name || !customer.email || !customer.phone || !customer.address) {
      return res.status(400).json({ success: false, message: 'Missing required checkout fields' });
    }
    if (!isValidEmail(customer.email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (!isValidPhone(customer.phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone' });
    }

    const paymentMethod = String(req.body?.paymentMethod || 'cod').trim();
    if (!ORDER_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
    if (paymentMethod === 'bank_transfer' && !isMomoConfigured()) {
      return res.status(503).json({ success: false, message: 'Thanh toan chuyen khoan chua duoc cau hinh' });
    }

    const note = String(req.body?.note || '').trim();
    const promoCode = String(req.body?.promoCode || '').trim().toUpperCase();

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: { $ne: false },
      isDeleted: { $ne: true }
    }).select('name price salePrice stock stockQuantity status previousStatus images');

    if (products.length !== productIds.length) {
      return res.status(404).json({ success: false, message: 'One or more products were not found' });
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const stockPlan = [];
    const orderItems = [];
    let coupon = null;
    let subtotal = 0;

    for (const item of requestedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'One or more products were not found' });
      }
      if (product.status !== PRODUCT_VISIBLE_STATUS) {
        return res.status(409).json({ success: false, message: `${product.name} is not available for checkout` });
      }

      const quantity = Math.max(1, parseNumber(item.quantity, 1));
      const stock = getProductStock(product);
      if (stock < quantity) {
        return res.status(409).json({ success: false, message: `${product.name} has insufficient stock` });
      }

      const price = getUnitPrice(product);
      const lineTotal = price * quantity;
      subtotal += lineTotal;
      stockPlan.push({ product, quantity });
      orderItems.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        variant: item.variant || '',
        quantity,
        price,
        lineTotal
      });
    }

    let discountAmount = 0;
    if (promoCode) {
      const couponValidation = await validateCouponForCheckout({
        code: promoCode,
        subtotal,
        userId: req.user._id
      });

      if (!couponValidation.valid) {
        return res.status(400).json({ success: false, message: couponValidation.message });
      }

      coupon = couponValidation.coupon;
      discountAmount = couponValidation.discountAmount;
    }

    for (const entry of stockPlan) {
      await applyStockChange(entry.product, -entry.quantity);
    }

    const loyaltyBenefits = getLoyaltyTierBenefits(req.user?.memberTier);
    const shippingEstimate = calculateShippingEstimate({
      address: customer.address,
      subtotal,
      itemCount: getRequestedItemCount(orderItems),
      paymentMethod,
      shippingDiscountPercent: loyaltyBenefits.shippingDiscountPercent
    });
    const shippingFee = shippingEstimate.shippingFee;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
    const paymentExpiresAt = buildPaymentExpiryDate(paymentMethod);

    const created = await Order.create({
      orderNumber: await buildOrderNumber(),
      user: req.user._id,
      customer,
      items: orderItems,
      promoCode: coupon?.code || promoCode,
      couponId: coupon?._id || null,
      couponType: coupon?.type || '',
      couponValue: Number(coupon?.value || 0),
      couponReservationStatus: 'none',
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentProvider: paymentMethod === 'bank_transfer' ? 'momo' : 'manual',
      paymentStatus: 'pending',
      checkoutStatus: paymentMethod === 'bank_transfer' ? 'created' : 'awaiting_payment',
      paymentExpiresAt,
      status: 'pending',
      note,
      shipment: buildOrderShipmentFromEstimate(shippingEstimate),
      timeline: [
        {
          type: 'order_created',
          note: '',
          actorName: serializeActorName(req.user) || customer.name,
          createdAt: new Date()
        },
        {
          type: 'shipping_estimated',
          note: buildShippingEstimateTimelineNote(shippingEstimate),
          actorName: serializeActorName(req.user) || customer.name,
          createdAt: new Date()
        },
        ...(paymentMethod === 'bank_transfer'
          ? [{
              type: 'payment_link_created',
              note: '',
              actorName: serializeActorName(req.user) || customer.name,
              createdAt: new Date()
            }]
          : [])
      ]
    });

    appendOrderEditHistory(created, {
      action: 'order.created',
      actor: req.user,
      note: 'Order created from checkout',
      changes: [
        { field: 'status', from: '', to: created.status },
        { field: 'paymentStatus', from: '', to: created.paymentStatus },
        { field: 'totalAmount', from: '0', to: String(created.totalAmount) }
      ],
      createdAt: created.createdAt || new Date()
    });
    await created.save();

    if (coupon) {
      try {
        await reserveCouponUsageForOrder(created);
      } catch (error) {
        await restockOrderItems(created).catch(() => null);
        await Order.findByIdAndDelete(created._id).catch(() => null);
        return res.status(409).json({ success: false, message: error?.message || 'Voucher is no longer available' });
      }
    }

    let payment = null;

    if (paymentMethod === 'bank_transfer') {
      try {
        const momoPayment = await createMomoPayment({
          order: created,
          lang: req.body?.lang || 'vi'
        });
        created.paymentProvider = 'momo';
        created.paymentRequestId = momoPayment.requestId;
        created.paymentRedirectUrl = momoPayment.payUrl;
        created.paymentMessage = momoPayment.message || created.paymentMessage;
        created.paymentResponseTime = Number(momoPayment.responseTime || 0) || created.paymentResponseTime;
        created.checkoutStatus = 'awaiting_payment';
        await created.save();

        payment = {
          provider: 'momo',
          payUrl: momoPayment.payUrl,
          deeplink: momoPayment.deeplink,
          qrCodeUrl: momoPayment.qrCodeUrl
        };
      } catch (error) {
        await releaseCouponUsageForOrder(created).catch(() => null);
        await restockOrderItems(created).catch(() => null);
        await Order.findByIdAndDelete(created._id).catch(() => null);
        return res.status(502).json({ success: false, message: error?.message || 'Khong the khoi tao thanh toan chuyen khoan' });
      }
    }

    const populated = await populateOrderQuery(Order.findById(created._id));
    emitOrderRealtimeUpdate(created, 'order.created', {
      status: created.status,
      paymentStatus: created.paymentStatus
    });
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populated,
      payment
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    await expireStaleOnlineOrders();

    const page = Math.max(1, parseNumber(req.query.page, 1));
    const limit = Math.max(1, Math.min(50, parseNumber(req.query.limit, 10)));
    const mineOnly = parseBooleanFlag(req.query.mine);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const paymentStatus = String(req.query.paymentStatus || '').trim();
    const checkoutStatus = String(req.query.checkoutStatus || '').trim();
    const aftersalesStatus = String(req.query.aftersalesStatus || '').trim();
    const aftersalesSlaStatus = String(req.query.aftersalesSlaStatus || '').trim().toLowerCase();
    const aftersalesOnly = parseBooleanFlag(req.query.aftersalesOnly);
    const query = {};

    if (mineOnly || (!isAdminUser(req.user) && req.user?.role !== 'SUPER_ADMIN')) {
      query.user = req.user._id;
    }

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      query.status = status;
    }

    if (paymentStatus) {
      if (!ORDER_PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid payment status' });
      }
      query.paymentStatus = paymentStatus;
    }

    if (checkoutStatus) {
      if (!ORDER_CHECKOUT_STATUSES.includes(checkoutStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid checkout status' });
      }
      query.checkoutStatus = checkoutStatus;
    }

    if (aftersalesStatus) {
      if (!ORDER_AFTERSALES_REQUEST_STATUSES.includes(aftersalesStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid aftersales status' });
      }
      query['aftersalesRequest.status'] = aftersalesStatus;
    } else if (aftersalesOnly || aftersalesSlaStatus) {
      query['aftersalesRequest.status'] = { $ne: 'none' };
    }

    if (aftersalesSlaStatus) {
      const validSlaStatuses = ['within_sla', 'at_risk', 'overdue', 'not_tracked'];
      if (!validSlaStatuses.includes(aftersalesSlaStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid aftersales SLA status' });
      }

      const now = Date.now();
      const overdueThreshold = new Date(now - getAftersalesSlaHours() * 60 * 60 * 1000);
      const riskThreshold = new Date(now - Math.max(getAftersalesSlaHours() - getAftersalesSlaRiskHours(), 1) * 60 * 60 * 1000);
      const trackedStatuses = aftersalesStatus && AFTERSALES_SLA_TRACKED_STATUSES.includes(aftersalesStatus)
        ? [aftersalesStatus]
        : AFTERSALES_SLA_TRACKED_STATUSES;
      const slaBaseExpr = {
        $ifNull: ['$aftersalesRequest.updatedAt', '$aftersalesRequest.requestedAt']
      };

      if (aftersalesSlaStatus === 'not_tracked') {
        query['aftersalesRequest.status'] = aftersalesStatus
          ? aftersalesStatus
          : { $nin: AFTERSALES_SLA_TRACKED_STATUSES };
      } else {
        query['aftersalesRequest.status'] = trackedStatuses.length === 1
          ? trackedStatuses[0]
          : { $in: trackedStatuses };

        if (aftersalesSlaStatus === 'within_sla') {
          query.$expr = { $gt: [slaBaseExpr, riskThreshold] };
        }

        if (aftersalesSlaStatus === 'at_risk') {
          query.$expr = {
            $and: [
              { $lte: [slaBaseExpr, riskThreshold] },
              { $gt: [slaBaseExpr, overdueThreshold] }
            ]
          };
        }

        if (aftersalesSlaStatus === 'overdue') {
          query.$expr = { $lte: [slaBaseExpr, overdueThreshold] };
        }
      }
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { orderNumber: regex },
        { 'customer.name': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex },
        { 'items.name': regex }
      ];
    }

    const totalItems = await Order.countDocuments(query);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const orders = await populateOrderQuery(
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    );
    for (const order of orders) {
      await normalizeOrderLifecycleState(order);
    }

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        totalPages,
        totalItems
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    await expireStaleOnlineOrders();

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const order = await populateOrderQuery(Order.findById(id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const requestOrderRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const order = await populateOrderQuery(Order.findById(id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!canCustomerRequestRefund(order)) {
      return res.status(409).json({
        success: false,
        message: 'This order is not eligible for a refund request'
      });
    }

    const reason = normalizeText(req.body?.reason).slice(0, 500);
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Refund reason is required' });
    }

    order.refundRequest = {
      status: 'pending',
      reason,
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: '',
      evidence: normalizeEvidenceList(req.body?.evidence)
    };
    appendOrderTimeline(order, 'refund_requested', reason, serializeActorName(req.user) || order.customer?.name, order.refundRequest.requestedAt);
    appendOrderEditHistory(order, {
      action: 'refund.requested',
      actor: req.user,
      note: reason,
      changes: [
        { field: 'refundRequest.status', from: 'none', to: 'pending' }
      ],
      createdAt: order.refundRequest.requestedAt
    });
    await order.save();

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.refund_requested', {
      refundStatus: order.refundRequest.status
    });
    return res.json({
      success: true,
      message: 'Refund request submitted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const reviewOrderRefundRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const action = String(req.body?.action || '').trim().toLowerCase();
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid refund action' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    if (getRefundRequestStatus(order) !== 'pending') {
      return res.status(409).json({ success: false, message: 'There is no pending refund request for this order' });
    }

    const reviewNote = normalizeText(req.body?.reviewNote).slice(0, 500);
    order.refundRequest.reviewedAt = new Date();
    order.refundRequest.reviewedBy = req.user?._id || null;
    order.refundRequest.reviewNote = reviewNote;

    if (action === 'approve') {
      order.refundRequest.status = 'approved';
      order.paymentStatus = 'refunded';
      appendOrderTimeline(order, 'refund_approved', reviewNote, serializeActorName(req.user), order.refundRequest.reviewedAt);
    } else {
      order.refundRequest.status = 'rejected';
      appendOrderTimeline(order, 'refund_rejected', reviewNote, serializeActorName(req.user), order.refundRequest.reviewedAt);
    }

    appendOrderEditHistory(order, {
      action: action === 'approve' ? 'refund.approved' : 'refund.rejected',
      actor: req.user,
      note: reviewNote,
      changes: [
        { field: 'refundRequest.status', from: 'pending', to: order.refundRequest.status },
        ...(action === 'approve' ? [{ field: 'paymentStatus', from: 'paid', to: 'refunded' }] : [])
      ],
      createdAt: order.refundRequest.reviewedAt
    });

    syncCheckoutStatusFromOrderState(order);
    await order.save();

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.refund_reviewed', {
      refundStatus: order.refundRequest.status,
      paymentStatus: order.paymentStatus
    });
    return res.json({
      success: true,
      message: action === 'approve' ? 'Refund request approved' : 'Refund request rejected',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const addOrderInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const note = normalizeText(req.body?.note).slice(0, 1000);
    if (!note) {
      return res.status(400).json({ success: false, message: 'Internal note is required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    appendOrderInternalNote(order, note, req.user);
    appendOrderEditHistory(order, {
      action: 'order.note_added',
      actor: req.user,
      note
    });
    appendOrderTimeline(order, 'internal_note_added', note, serializeActorName(req.user), new Date());
    await order.save();

    await AuditLog.create({
      actor: req.user?._id,
      action: 'order.note',
      resource: 'order',
      details: { orderId: order._id, orderNumber: order.orderNumber, note },
      ip: req.ip
    }).catch(() => null);

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.note_added');
    return res.json({
      success: true,
      message: 'Internal note added successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const submitOrderAftersalesRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const order = await populateOrderQuery(Order.findById(id));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!canCustomerCreateAftersalesRequest(order)) {
      return res.status(409).json({ success: false, message: 'This order is not eligible for aftersales support' });
    }

    const type = String(req.body?.type || '').trim();
    if (!ORDER_AFTERSALES_REQUEST_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid aftersales request type' });
    }

    const reason = normalizeText(req.body?.reason).slice(0, 500);
    const customerNote = normalizeText(req.body?.customerNote).slice(0, 1000);
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Aftersales reason is required' });
    }

    const evidence = normalizeEvidenceList(req.body?.evidence);
    order.aftersalesRequest = {
      type,
      status: 'submitted',
      reason,
      customerNote,
      adminNote: '',
      requestedAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      completedAt: null,
      requestedBy: req.user?._id || null,
      reviewedBy: null,
      evidence
    };

    syncLegacyRefundStateFromAftersales(order, req.user?._id || null);
    appendOrderTimeline(
      order,
      'aftersales_submitted',
      [type, reason, customerNote].filter(Boolean).join(' | '),
      serializeActorName(req.user),
      order.aftersalesRequest.requestedAt
    );
    appendOrderEditHistory(order, {
      action: 'aftersales.submitted',
      actor: req.user,
      note: customerNote || reason,
      changes: [
        { field: 'aftersalesRequest.type', from: '', to: type },
        { field: 'aftersalesRequest.status', from: 'none', to: 'submitted' }
      ],
      createdAt: order.aftersalesRequest.requestedAt
    });
    await order.save();

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.aftersales_submitted', {
      aftersalesStatus: order.aftersalesRequest.status,
      aftersalesType: order.aftersalesRequest.type
    });
    return res.status(201).json({
      success: true,
      message: 'Aftersales request submitted successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const reviewOrderAftersalesRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const nextStatus = String(req.body?.status || '').trim();
    if (!ORDER_AFTERSALES_REQUEST_STATUSES.includes(nextStatus) || nextStatus === 'none') {
      return res.status(400).json({ success: false, message: 'Invalid aftersales status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    ensureAftersalesState(order);

    const currentStatus = getAftersalesStatus(order);
    if (currentStatus === 'none') {
      return res.status(409).json({ success: false, message: 'There is no aftersales request for this order' });
    }

    const adminNote = normalizeText(req.body?.adminNote).slice(0, 1000);
    const previousPaymentStatus = order.paymentStatus;
    order.aftersalesRequest.status = nextStatus;
    order.aftersalesRequest.adminNote = adminNote;
    order.aftersalesRequest.updatedAt = new Date();
    order.aftersalesRequest.reviewedAt = order.aftersalesRequest.reviewedAt || new Date();
    order.aftersalesRequest.reviewedBy = req.user?._id || null;

    if (AFTERSALES_FINAL_STATUSES.includes(nextStatus)) {
      order.aftersalesRequest.completedAt = nextStatus === 'completed' ? new Date() : order.aftersalesRequest.completedAt;
    }

    if (nextStatus === 'completed' && ['refund', 'return_refund'].includes(order.aftersalesRequest.type)) {
      order.paymentStatus = 'refunded';
    }

    syncLegacyRefundStateFromAftersales(order, req.user?._id || null);
    syncCheckoutStatusFromOrderState(order);
    appendOrderTimeline(
      order,
      `aftersales_${nextStatus}`,
      adminNote || order.aftersalesRequest.reason || '',
      serializeActorName(req.user),
      order.aftersalesRequest.updatedAt
    );
    appendOrderEditHistory(order, {
      action: 'aftersales.reviewed',
      actor: req.user,
      note: adminNote,
      changes: [
        { field: 'aftersalesRequest.status', from: currentStatus, to: nextStatus },
        ...(previousPaymentStatus !== order.paymentStatus
          ? [{ field: 'paymentStatus', from: previousPaymentStatus, to: order.paymentStatus }]
          : [])
      ],
      createdAt: order.aftersalesRequest.updatedAt
    });
    await order.save();

    await AuditLog.create({
      actor: req.user?._id,
      action: 'order.aftersales',
      resource: 'order',
      details: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        previousStatus: currentStatus,
        nextStatus,
        paymentStatus: order.paymentStatus
      },
      ip: req.ip
    }).catch(() => null);

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.aftersales_updated', {
      aftersalesStatus: nextStatus,
      aftersalesType: order.aftersalesRequest.type,
      paymentStatus: order.paymentStatus
    });
    return res.json({
      success: true,
      message: 'Aftersales request updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderAnalyticsSummary = async (req, res, next) => {
  try {
    await expireStaleOnlineOrders();

    const [overviewRaw] = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          grossRevenue: {
            $sum: {
              $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalAmount', 0]
            }
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1, _id: 1 } }
    ]);

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const dailyRevenueRaw = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRevenueMap = new Map(dailyRevenueRaw.map((entry) => [entry._id, entry]));
    const dailyRevenue = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      const entry = dailyRevenueMap.get(key);
      return {
        date: key,
        revenue: entry?.revenue || 0,
        orders: entry?.orders || 0
      };
    });

    const recentOrders = await populateOrderQuery(
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
    );
    for (const order of recentOrders) {
      await normalizeOrderLifecycleState(order);
    }

    const grossRevenue = overviewRaw?.grossRevenue || 0;
    const totalOrders = overviewRaw?.totalOrders || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders,
          completedOrders: overviewRaw?.completedOrders || 0,
          cancelledOrders: overviewRaw?.cancelledOrders || 0,
          pendingOrders: overviewRaw?.pendingOrders || 0,
          grossRevenue,
          totalRevenue: overviewRaw?.totalRevenue || 0,
          averageOrderValue: totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0
        },
        statusBreakdown: statusBreakdown.map((entry) => ({
          status: entry._id,
          count: entry.count,
          totalAmount: entry.totalAmount
        })),
        dailyRevenue,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    await expireStaleOnlineOrders();

    const { id } = req.params;
    const nextStatus = String(req.body?.status || '').trim();
    const nextPaymentStatus = String(req.body?.paymentStatus || '').trim();
    const shipmentProvided = Boolean(req.body && Object.prototype.hasOwnProperty.call(req.body, 'shipment'));
    const nextShipment = normalizeShipmentInput(req.body?.shipment);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    if (!nextStatus && !nextPaymentStatus && !shipmentProvided) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }
    if (nextStatus && !ORDER_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    if (nextPaymentStatus && !ORDER_PAYMENT_STATUSES.includes(nextPaymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    await normalizeOrderLifecycleState(order);
    ensureShipmentState(order);

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    const previousShipment = {
      carrier: order.shipment?.carrier || '',
      trackingNumber: order.shipment?.trackingNumber || '',
      trackingUrl: order.shipment?.trackingUrl || ''
    };
    const changeSet = [];
    let finalStatus = nextStatus || order.status;
    let finalPaymentStatus = nextPaymentStatus || order.paymentStatus;

    if (order.paymentMethod === 'bank_transfer' && finalPaymentStatus === 'failed' && finalStatus !== 'completed') {
      finalStatus = 'cancelled';
    }

    const shipmentChanged = shipmentProvided
      && (
        nextShipment.carrier !== previousShipment.carrier
        || nextShipment.trackingNumber !== previousShipment.trackingNumber
        || nextShipment.trackingUrl !== previousShipment.trackingUrl
      );

    if (finalStatus === order.status && finalPaymentStatus === order.paymentStatus && !shipmentChanged) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }

    const wasCancelled = order.status === 'cancelled';
    const willBeCancelled = finalStatus === 'cancelled';

    if (!wasCancelled && willBeCancelled) {
      await restockOrderItems(order);
      order.cancelledAt = new Date();
      order.completedAt = null;
    }

    if (wasCancelled && !willBeCancelled) {
      await reserveOrderItems(order);
      order.cancelledAt = null;
    }

    order.status = finalStatus;
    order.paymentStatus = finalPaymentStatus;

    if (shipmentProvided) {
      order.shipment.carrier = nextShipment.carrier;
      order.shipment.trackingNumber = nextShipment.trackingNumber;
      order.shipment.trackingUrl = nextShipment.trackingUrl;
      order.shipment.lastUpdatedAt = new Date();
      changeSet.push(
        { field: 'shipment.carrier', from: previousShipment.carrier, to: order.shipment.carrier },
        { field: 'shipment.trackingNumber', from: previousShipment.trackingNumber, to: order.shipment.trackingNumber },
        { field: 'shipment.trackingUrl', from: previousShipment.trackingUrl, to: order.shipment.trackingUrl }
      );
    }

    if (finalStatus === 'completed') {
      order.completedAt = order.completedAt || new Date();
      if (order.paymentStatus === 'pending' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    } else {
      order.completedAt = null;
    }

    if (finalPaymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed';
    }

    syncShipmentMilestones(order);

    if (shipmentChanged) {
      appendOrderTimeline(order, 'shipment_updated', buildShipmentTimelineNote(order.shipment), serializeActorName(req.user), order.shipment.lastUpdatedAt || new Date());
    }

    if (previousPaymentStatus !== order.paymentStatus) {
      changeSet.push({ field: 'paymentStatus', from: previousPaymentStatus, to: order.paymentStatus });
      if (order.paymentStatus === 'paid') {
        appendOrderTimeline(order, 'payment_paid', '', serializeActorName(req.user), new Date());
      } else if (order.paymentStatus === 'failed') {
        appendOrderTimeline(order, 'payment_failed', '', serializeActorName(req.user), new Date());
      } else if (order.paymentStatus === 'refunded') {
        appendOrderTimeline(order, 'refund_approved', order.refundRequest?.reviewNote || '', serializeActorName(req.user), new Date());
      }
    }

    if (previousStatus !== order.status) {
      changeSet.push({ field: 'status', from: previousStatus, to: order.status });
      const statusTimelineType = {
        confirmed: 'order_confirmed',
        processing: 'order_processing',
        packing: 'order_packing',
        shipping: 'order_shipping',
        completed: 'order_completed',
        cancelled: 'order_cancelled'
      };
      if (statusTimelineType[order.status]) {
        appendOrderTimeline(order, statusTimelineType[order.status], '', serializeActorName(req.user), new Date());
      }
    }

    appendOrderEditHistory(order, {
      action: 'order.updated',
      actor: req.user,
      note: shipmentChanged ? 'Order status or shipment updated' : 'Order status updated',
      changes: changeSet.filter((item) => item.from !== item.to)
    });

    syncCheckoutStatusFromOrderState(order);

    await order.save();
    await syncCouponReservationForOrder(order);

    await AuditLog.create({
      actor: req.user?._id,
      action: 'order.update',
      resource: 'order',
      details: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        previousStatus,
        nextStatus: order.status,
        previousPaymentStatus,
        nextPaymentStatus: order.paymentStatus,
        shipmentChanged,
        shipment: shipmentChanged ? order.shipment : undefined
      },
      ip: req.ip
    }).catch(() => null);

    const populated = await populateOrderQuery(Order.findById(order._id));
    emitOrderRealtimeUpdate(order, 'order.updated', {
      status: order.status,
      paymentStatus: order.paymentStatus,
      shipmentChanged
    });
    res.json({ success: true, message: 'Order updated successfully', data: populated });
  } catch (error) {
    if (error?.message === 'Insufficient stock') {
      return res.status(409).json({ success: false, message: 'Insufficient stock' });
    }
    if (String(error?.message || '').includes('insufficient stock')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const handleMomoIpn = async (req, res) => {
  try {
    await syncOrderWithMomoResult(req.body || {});
  } catch {
    void 0;
  }
  res.status(204).end();
};

export const handleMomoReturn = async (req, res) => {
  const payload = req.query || {};
  let resultCode = payload.resultCode;
  let message = payload.message;
  let orderId = payload.orderId;

  try {
    const result = await syncOrderWithMomoResult(payload);
    resultCode = result.resultCode ?? resultCode;
    message = result.message || message;
    orderId = result.order?.orderNumber || orderId;
  } catch {
    void 0;
  }

  res.redirect(buildFrontendMomoReturnUrl({ orderId, resultCode, message }));
};

export const cancelMomoCheckout = async (req, res, next) => {
  try {
    const orderNumber = String(req.body?.orderNumber || req.query?.orderNumber || '').trim();

    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'Missing order number' });
    }

    const order = await populateOrderQuery(Order.findOne({ orderNumber }));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await normalizeOrderLifecycleState(order);
    if (!ensureOrderAccess(order, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (order.paymentMethod !== 'bank_transfer') {
      return res.status(400).json({ success: false, message: 'Order does not use bank transfer' });
    }

    const cancelledMessage = 'Customer returned from MoMo without completing payment';
    await expireOnlineOrderFromCustomerReturn(order, cancelledMessage);
    appendOrderEditHistory(order, {
      action: 'payment.cancelled',
      actor: req.user,
      note: cancelledMessage,
      changes: [
        { field: 'status', from: 'pending', to: order.status },
        { field: 'paymentStatus', from: 'pending', to: order.paymentStatus },
        { field: 'checkoutStatus', from: 'awaiting_payment', to: order.checkoutStatus }
      ].filter((item) => item.from !== item.to)
    });
    await order.save();
    emitOrderRealtimeUpdate(order, 'order.payment_cancelled', {
      status: order.status,
      paymentStatus: order.paymentStatus,
      checkoutStatus: order.checkoutStatus
    });

    return res.json({
      success: true,
      data: {
        status: order.checkoutStatus,
        orderNumber: order.orderNumber,
        checkoutStatus: order.checkoutStatus,
        paymentCode: '',
        paymentMessage: order.paymentMessage || cancelledMessage,
        paymentResult: order.checkoutStatus === 'paid' ? 'success' : order.checkoutStatus === 'processing_payment' ? 'pending' : 'failed'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmMomoReturn = async (req, res) => {
  const payload = req.query || {};

  try {
    const result = await syncOrderWithMomoResult(payload);
    const statusCode =
      result.status === 'invalid' || result.status === 'invalid_signature' || result.status === 'amount_mismatch'
        ? 400
        : result.status === 'not_found'
          ? 404
          : 200;

    return res.status(statusCode).json(buildMomoConfirmResponse(result));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'Khong the xac nhan giao dich thanh toan chuyen khoan'
    });
  }
};
