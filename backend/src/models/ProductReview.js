import mongoose from 'mongoose';

export const PRODUCT_REVIEW_STATUSES = ['approved', 'hidden'];

const productReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: ''
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    verifiedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    status: {
      type: String,
      enum: PRODUCT_REVIEW_STATUSES,
      default: 'approved'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderatedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

productReviewSchema.index({ product: 1, user: 1 }, { unique: true });
productReviewSchema.index({ product: 1, createdAt: -1 });

const ProductReview = mongoose.model('ProductReview', productReviewSchema);

export default ProductReview;
