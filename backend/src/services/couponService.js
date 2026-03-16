import Coupon from '../models/Coupon.js'
import CouponClaim from '../models/CouponClaim.js'
import Order, { ORDER_COUPON_RESERVATION_STATUSES } from '../models/Order.js'

const ACTIVE_RESERVATION_STATUSES = [
  ORDER_COUPON_RESERVATION_STATUSES[1],
  ORDER_COUPON_RESERVATION_STATUSES[3]
]

export const normalizeCouponCode = (value) => String(value || '').trim().toUpperCase()

export const getCouponState = (coupon, now = new Date()) => {
  if (!coupon) return 'invalid'
  if (!coupon.isActive) return 'inactive'
  if (coupon.startAt && new Date(coupon.startAt).getTime() > now.getTime()) return 'scheduled'
  if (coupon.endAt && new Date(coupon.endAt).getTime() < now.getTime()) return 'expired'
  if (Number.isFinite(coupon.totalLimit) && coupon.totalLimit > 0 && Number(coupon.usedCount || 0) >= coupon.totalLimit) {
    return 'sold_out'
  }
  return 'active'
}

export const calculateCouponDiscount = ({ coupon, subtotal }) => {
  const amount = Number(subtotal) || 0
  if (!coupon || amount <= 0) return 0

  if (coupon.type === 'fixed') {
    return Math.max(0, Math.min(amount, Math.round(Number(coupon.value) || 0)))
  }

  let discount = Math.round(amount * ((Number(coupon.value) || 0) / 100))
  if (Number.isFinite(Number(coupon.maxDiscountAmount)) && Number(coupon.maxDiscountAmount) > 0) {
    discount = Math.min(discount, Number(coupon.maxDiscountAmount))
  }
  return Math.max(0, Math.min(amount, discount))
}

export const serializeCoupon = (coupon, extras = {}) => ({
  _id: coupon?._id || '',
  code: coupon?.code || '',
  name: coupon?.name || '',
  description: coupon?.description || '',
  type: coupon?.type || 'percent',
  value: Number(coupon?.value || 0),
  minOrderAmount: Number(coupon?.minOrderAmount || 0),
  maxDiscountAmount: Number(coupon?.maxDiscountAmount || 0),
  totalLimit: Number.isFinite(Number(coupon?.totalLimit)) ? Number(coupon.totalLimit) : null,
  usedCount: Number(coupon?.usedCount || 0),
  perUserLimit: Number(coupon?.perUserLimit || 1),
  startAt: coupon?.startAt || null,
  endAt: coupon?.endAt || null,
  isActive: Boolean(coupon?.isActive),
  isPublic: Boolean(coupon?.isPublic),
  status: getCouponState(coupon),
  ...extras
})

const countUserCouponReservations = async ({ couponId, userId, excludeOrderId = null }) => {
  if (!couponId || !userId) return 0
  const query = {
    couponId,
    user: userId,
    couponReservationStatus: { $in: ACTIVE_RESERVATION_STATUSES }
  }
  if (excludeOrderId) {
    query._id = { $ne: excludeOrderId }
  }
  return Order.countDocuments(query)
}

export const validateCouponForCheckout = async ({ code, subtotal, userId, excludeOrderId = null }) => {
  const normalizedCode = normalizeCouponCode(code)
  if (!normalizedCode) {
    return { valid: false, message: 'Invalid coupon code', coupon: null, discountAmount: 0 }
  }

  const coupon = await Coupon.findOne({ code: normalizedCode })
  if (!coupon) {
    return { valid: false, message: 'Coupon not found', coupon: null, discountAmount: 0 }
  }

  const state = getCouponState(coupon)
  if (state === 'inactive') {
    return { valid: false, message: 'Voucher is inactive', coupon, discountAmount: 0 }
  }
  if (state === 'scheduled') {
    return { valid: false, message: 'Voucher is not active yet', coupon, discountAmount: 0 }
  }
  if (state === 'expired') {
    return { valid: false, message: 'Voucher has expired', coupon, discountAmount: 0 }
  }
  if (state === 'sold_out') {
    return { valid: false, message: 'Voucher usage limit reached', coupon, discountAmount: 0 }
  }

  const orderSubtotal = Number(subtotal) || 0
  if (orderSubtotal < Number(coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      message: `Order does not meet the minimum amount for ${coupon.code}`,
      coupon,
      discountAmount: 0
    }
  }

  if (userId && Number(coupon.perUserLimit || 0) > 0) {
    const usageCount = await countUserCouponReservations({ couponId: coupon._id, userId, excludeOrderId })
    if (usageCount >= Number(coupon.perUserLimit)) {
      return { valid: false, message: 'You have reached this voucher usage limit', coupon, discountAmount: 0 }
    }
  }

  return {
    valid: true,
    message: 'Coupon applied successfully',
    coupon,
    discountAmount: calculateCouponDiscount({ coupon, subtotal: orderSubtotal })
  }
}

export const reserveCouponUsageForOrder = async (order) => {
  if (!order?.couponId) return order
  if (order.couponReservationStatus === 'reserved' || order.couponReservationStatus === 'consumed') return order

  const coupon = await Coupon.findById(order.couponId)
  if (!coupon) {
    throw new Error('Voucher no longer exists')
  }

  const state = getCouponState(coupon)
  if (state !== 'active') {
    throw new Error('Voucher is no longer available')
  }

  coupon.usedCount = Number(coupon.usedCount || 0) + 1
  await coupon.save()
  order.couponReservationStatus = 'reserved'
  await order.save()
  return order
}

export const releaseCouponUsageForOrder = async (order) => {
  if (!order?.couponId) return order
  if (order.couponReservationStatus !== 'reserved') return order

  const coupon = await Coupon.findById(order.couponId)
  if (coupon) {
    coupon.usedCount = Math.max(0, Number(coupon.usedCount || 0) - 1)
    await coupon.save()
  }

  order.couponReservationStatus = 'released'
  await order.save()
  return order
}

export const consumeCouponUsageForOrder = async (order) => {
  if (!order?.couponId) return order
  if (order.couponReservationStatus === 'consumed') return order
  if (order.couponReservationStatus === 'released') {
    await reserveCouponUsageForOrder(order)
  }
  order.couponReservationStatus = 'consumed'
  await order.save()
  return order
}

export const getMyClaimedCoupons = async (userId) => {
  if (!userId) return []
  const claims = await CouponClaim.find({ user: userId })
    .populate('coupon')
    .sort({ claimedAt: -1 })

  return claims
    .filter((claim) => claim.coupon)
    .map((claim) => serializeCoupon(claim.coupon, {
      claimId: claim._id,
      claimedAt: claim.claimedAt,
      isClaimed: true
    }))
}
