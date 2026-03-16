import mongoose from 'mongoose'

const couponClaimSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true
    },
    claimedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

couponClaimSchema.index({ user: 1, coupon: 1 }, { unique: true })

const CouponClaim = mongoose.model('CouponClaim', couponClaimSchema)

export default CouponClaim
