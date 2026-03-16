import mongoose from 'mongoose'

export const COUPON_TYPES = ['percent', 'fixed']

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },
    type: {
      type: String,
      enum: COUPON_TYPES,
      required: true,
      default: 'percent'
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0
    },
    totalLimit: {
      type: Number,
      default: null,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    startAt: {
      type: Date,
      default: null
    },
    endAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
)

couponSchema.index({ isActive: 1, isPublic: 1, startAt: 1, endAt: 1 })
couponSchema.index({ createdAt: -1 })

const Coupon = mongoose.model('Coupon', couponSchema)

export default Coupon
