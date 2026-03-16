import Coupon from '../models/Coupon.js'
import CouponClaim from '../models/CouponClaim.js'
import {
  getCouponState,
  getMyClaimedCoupons,
  normalizeCouponCode,
  serializeCoupon,
  validateCouponForCheckout
} from '../services/couponService.js'
import { emitRealtimeEvent } from '../services/realtimeService.js'

const COUPON_TYPES = ['percent', 'fixed']

const parseNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ')

const parseNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseNullableDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const serializeCouponClaim = (claim) => ({
  _id: claim?._id || '',
  claimedAt: claim?.claimedAt || null,
  user: claim?.user
    ? {
        _id: claim.user._id,
        name: claim.user.name || '',
        email: claim.user.email || '',
        phone: claim.user.phone || '',
        avatar: claim.user.avatar || ''
      }
    : null
})

const buildCouponPayload = (body) => {
  const code = normalizeCouponCode(body?.code)
  const name = normalizeText(body?.name)
  const description = normalizeText(body?.description)
  const type = String(body?.type || 'percent').trim()
  const value = parseNumber(body?.value, NaN)
  const minOrderAmount = parseNumber(body?.minOrderAmount, 0)
  const maxDiscountAmount = parseNullableNumber(body?.maxDiscountAmount)
  const totalLimit = parseNullableNumber(body?.totalLimit)
  const perUserLimit = parseNumber(body?.perUserLimit, 1)
  const startAt = parseNullableDate(body?.startAt)
  const endAt = parseNullableDate(body?.endAt)
  const isActive = body?.isActive !== undefined ? Boolean(body.isActive) : true
  const isPublic = body?.isPublic !== undefined ? Boolean(body.isPublic) : true

  if (!code) return { error: 'Voucher code is required' }
  if (!name) return { error: 'Voucher name is required' }
  if (!COUPON_TYPES.includes(type)) return { error: 'Invalid voucher type' }
  if (!Number.isFinite(value) || value <= 0) return { error: 'Voucher value must be greater than 0' }
  if (type === 'percent' && value > 100) return { error: 'Percent voucher cannot exceed 100' }
  if (minOrderAmount < 0) return { error: 'Minimum order amount is invalid' }
  if (maxDiscountAmount !== null && maxDiscountAmount < 0) return { error: 'Maximum discount amount is invalid' }
  if (totalLimit !== null && totalLimit < 1) return { error: 'Total usage limit is invalid' }
  if (!Number.isFinite(perUserLimit) || perUserLimit < 1) return { error: 'Per-user limit is invalid' }
  if ((body?.startAt && !startAt) || (body?.endAt && !endAt)) return { error: 'Voucher time range is invalid' }
  if (startAt && endAt && startAt.getTime() >= endAt.getTime()) return { error: 'Voucher end time must be after start time' }

  return {
    payload: {
      code,
      name,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      totalLimit,
      perUserLimit,
      startAt,
      endAt,
      isActive,
      isPublic
    }
  }
}

export const getPublicCoupons = async (req, res, next) => {
  try {
    const now = new Date()
    const coupons = await Coupon.find({
      isPublic: true,
      isActive: true,
      $or: [{ startAt: null }, { startAt: { $lte: now } }],
      $and: [{ $or: [{ endAt: null }, { endAt: { $gte: now } }] }]
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: coupons.map((coupon) => serializeCoupon(coupon))
    })
  } catch (error) {
    next(error)
  }
}

export const getMyCoupons = async (req, res, next) => {
  try {
    const items = await getMyClaimedCoupons(req.user?._id)
    res.json({ success: true, data: items })
  } catch (error) {
    next(error)
  }
}

export const claimCoupon = async (req, res, next) => {
  try {
    const code = normalizeCouponCode(req.body?.code)
    if (!code) {
      return res.status(400).json({ success: false, message: 'Voucher code is required' })
    }

    const coupon = await Coupon.findOne({ code, isPublic: true })
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Voucher not found' })
    }

    const existing = await CouponClaim.findOne({ user: req.user._id, coupon: coupon._id })
    if (existing) {
      return res.json({
        success: true,
        message: 'Voucher already added to your account',
        data: serializeCoupon(coupon, { claimId: existing._id, claimedAt: existing.claimedAt, isClaimed: true })
      })
    }

    const state = getCouponState(coupon)
    if (state === 'inactive') {
      return res.status(400).json({ success: false, message: 'Voucher is inactive' })
    }
    if (state === 'scheduled') {
      return res.status(400).json({ success: false, message: 'Voucher is not active yet' })
    }
    if (state === 'expired') {
      return res.status(400).json({ success: false, message: 'Voucher has expired' })
    }
    if (state === 'sold_out') {
      return res.status(400).json({ success: false, message: 'Voucher usage limit reached' })
    }

    const claim = await CouponClaim.create({
      user: req.user._id,
      coupon: coupon._id
    })

    res.status(201).json({
      success: true,
      message: 'Voucher claimed successfully',
      data: serializeCoupon(coupon, { claimId: claim._id, claimedAt: claim.claimedAt, isClaimed: true })
    })
    emitRealtimeEvent({
      type: 'coupon.claimed',
      audience: 'user',
      userId: String(req.user?._id || ''),
      data: { couponId: String(coupon._id), code: coupon.code }
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.json({ success: true, message: 'Voucher already added to your account' })
    }
    next(error)
  }
}

export const validateCoupon = async (req, res, next) => {
  try {
    const subtotal = parseNumber(req.body?.subtotal, 0)
    const result = await validateCouponForCheckout({
      code: req.body?.code,
      subtotal,
      userId: req.user?._id
    })

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message })
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        ...serializeCoupon(result.coupon),
        discountAmount: result.discountAmount,
        subtotal
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getAdminCoupons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseNumber(req.query.page, 1))
    const limit = Math.max(1, Math.min(50, parseNumber(req.query.limit, 10)))
    const search = normalizeText(req.query.search)
    const status = String(req.query.status || '').trim()
    const query = {}

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i')
      query.$or = [{ code: regex }, { name: regex }, { description: regex }]
    }

    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const totalItems = await Coupon.countDocuments(query)
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit)
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    const couponIds = coupons.map((coupon) => coupon._id)
    const claimCounts = couponIds.length
      ? await CouponClaim.aggregate([
          { $match: { coupon: { $in: couponIds } } },
          { $group: { _id: '$coupon', count: { $sum: 1 } } }
        ])
      : []
    const claimCountMap = new Map(claimCounts.map((entry) => [String(entry._id), Number(entry.count || 0)]))

    res.json({
      success: true,
      data: coupons.map((coupon) =>
        serializeCoupon(coupon, {
          claimedCount: claimCountMap.get(String(coupon._id)) || 0
        })
      ),
      pagination: {
        page,
        totalPages,
        totalItems
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getAdminCouponDetail = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Voucher not found' })
    }

    const claims = await CouponClaim.find({ coupon: coupon._id })
      .sort({ claimedAt: -1 })
      .populate('user', 'name email phone avatar')

    const claimedUsers = claims
      .map(serializeCouponClaim)
      .filter((claim) => claim.user)

    res.json({
      success: true,
      data: serializeCoupon(coupon, {
        claimedCount: claimedUsers.length,
        claimedUsers
      })
    })
  } catch (error) {
    next(error)
  }
}

export const createCoupon = async (req, res, next) => {
  try {
    const { payload, error } = buildCouponPayload(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error })
    }

    const exists = await Coupon.findOne({ code: payload.code })
    if (exists) {
      return res.status(409).json({ success: false, message: 'Voucher code already exists' })
    }

    const coupon = await Coupon.create({
      ...payload,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    })

    res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: serializeCoupon(coupon)
    })
    emitRealtimeEvent({ type: 'coupon.updated', audience: 'all', data: { couponId: String(coupon._id), action: 'created' } })
  } catch (error) {
    next(error)
  }
}

export const updateCoupon = async (req, res, next) => {
  try {
    const { payload, error } = buildCouponPayload(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error })
    }

    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Voucher not found' })
    }

    const duplicate = await Coupon.findOne({ code: payload.code, _id: { $ne: coupon._id } }).select('_id')
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Voucher code already exists' })
    }

    Object.assign(coupon, payload, { updatedBy: req.user?._id || coupon.updatedBy })
    await coupon.save()

    res.json({
      success: true,
      message: 'Voucher updated successfully',
      data: serializeCoupon(coupon)
    })
    emitRealtimeEvent({ type: 'coupon.updated', audience: 'all', data: { couponId: String(coupon._id), action: 'updated' } })
  } catch (error) {
    next(error)
  }
}

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Voucher not found' })
    }

    await CouponClaim.deleteMany({ coupon: coupon._id })
    await Coupon.findByIdAndDelete(coupon._id)

    res.json({ success: true, message: 'Voucher deleted successfully' })
    emitRealtimeEvent({ type: 'coupon.updated', audience: 'all', data: { couponId: String(coupon._id), action: 'deleted' } })
  } catch (error) {
    next(error)
  }
}
