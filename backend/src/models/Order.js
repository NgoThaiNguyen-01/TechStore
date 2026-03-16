import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'packing',
  'shipping',
  'completed',
  'cancelled'
];

export const ORDER_PAYMENT_METHODS = ['cod', 'bank_transfer'];

export const ORDER_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
export const ORDER_PAYMENT_PROVIDERS = ['manual', 'momo'];
export const ORDER_REFUND_REQUEST_STATUSES = ['none', 'pending', 'approved', 'rejected'];
export const ORDER_AFTERSALES_REQUEST_TYPES = ['refund', 'return_refund', 'exchange'];
export const ORDER_AFTERSALES_REQUEST_STATUSES = [
  'none',
  'submitted',
  'under_review',
  'awaiting_return',
  'received',
  'approved',
  'rejected',
  'refund_processing',
  'completed'
];
export const ORDER_CHECKOUT_STATUSES = [
  'created',
  'awaiting_payment',
  'processing_payment',
  'paid',
  'failed',
  'cancelled',
  'expired'
];
export const ORDER_COUPON_RESERVATION_STATUSES = ['none', 'reserved', 'released', 'consumed']

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '', trim: true },
    variant: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderCustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 500 }
  },
  { _id: false }
);

const orderRefundEvidenceSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    },
    name: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    mimeType: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    size: {
      type: Number,
      default: 0,
      min: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const orderRefundRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_REFUND_REQUEST_STATUSES,
      default: 'none'
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    requestedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    evidence: {
      type: [orderRefundEvidenceSchema],
      default: []
    }
  },
  { _id: false }
);

const orderInternalNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    authorName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const orderEditHistoryChangeSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    from: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    to: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    }
  },
  { _id: false }
);

const orderEditHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    changes: {
      type: [orderEditHistoryChangeSchema],
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const orderLoyaltySchema = new mongoose.Schema(
  {
    awardedPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    awardedAt: {
      type: Date,
      default: null
    },
    reversedPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    reversedAt: {
      type: Date,
      default: null
    },
    tierAtAward: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40
    },
    tierAfterAward: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40
    }
  },
  { _id: false }
);

const orderAftersalesRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [...ORDER_AFTERSALES_REQUEST_TYPES, ''],
      default: ''
    },
    status: {
      type: String,
      enum: ORDER_AFTERSALES_REQUEST_STATUSES,
      default: 'none'
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    customerNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    requestedAt: {
      type: Date,
      default: null
    },
    updatedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    evidence: {
      type: [orderRefundEvidenceSchema],
      default: []
    }
  },
  { _id: false }
);

const orderShipmentSchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 50
    },
    carrier: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    service: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    trackingNumber: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    trackingUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    estimatedMinDays: {
      type: Number,
      default: null,
      min: 0
    },
    estimatedMaxDays: {
      type: Number,
      default: null,
      min: 0
    },
    shippedAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    lastUpdatedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const orderTimelineEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    actorName: {
      type: String,
      default: '',
      trim: true,
      maxlength: 255
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    customer: {
      type: orderCustomerSchema,
      required: true
    },
    items: {
      type: [orderItemSchema],
      default: []
    },
    promoCode: {
      type: String,
      default: '',
      trim: true,
      uppercase: true
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
      index: true
    },
    couponType: {
      type: String,
      enum: ['percent', 'fixed', ''],
      default: ''
    },
    couponValue: {
      type: Number,
      default: 0,
      min: 0
    },
    couponReservationStatus: {
      type: String,
      enum: ORDER_COUPON_RESERVATION_STATUSES,
      default: 'none'
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ORDER_PAYMENT_METHODS,
      default: 'cod'
    },
    paymentProvider: {
      type: String,
      enum: ORDER_PAYMENT_PROVIDERS,
      default: 'manual'
    },
    paymentStatus: {
      type: String,
      enum: ORDER_PAYMENT_STATUSES,
      default: 'pending'
    },
    checkoutStatus: {
      type: String,
      enum: ORDER_CHECKOUT_STATUSES,
      default: 'created'
    },
    paymentRequestId: {
      type: String,
      default: '',
      trim: true
    },
    paymentTransactionId: {
      type: String,
      default: '',
      trim: true
    },
    paymentResponseTime: {
      type: Number,
      default: null
    },
    paymentMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    paymentPayType: {
      type: String,
      default: '',
      trim: true
    },
    paymentRedirectUrl: {
      type: String,
      default: '',
      trim: true
    },
    paymentExpiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending'
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    completedAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    shipment: {
      type: orderShipmentSchema,
      default: () => ({})
    },
    timeline: {
      type: [orderTimelineEntrySchema],
      default: []
    },
    internalNotes: {
      type: [orderInternalNoteSchema],
      default: []
    },
    editHistory: {
      type: [orderEditHistorySchema],
      default: []
    },
    loyalty: {
      type: orderLoyaltySchema,
      default: () => ({})
    },
    refundRequest: {
      type: orderRefundRequestSchema,
      default: () => ({ status: 'none' })
    },
    aftersalesRequest: {
      type: orderAftersalesRequestSchema,
      default: () => ({ status: 'none' })
    }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ checkoutStatus: 1, createdAt: -1 });
orderSchema.index({ 'refundRequest.status': 1, updatedAt: -1 });
orderSchema.index({ 'aftersalesRequest.status': 1, updatedAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
