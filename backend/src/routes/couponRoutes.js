import express from 'express'
import authGuard, { optionalAuthGuard } from '../middlewares/authMiddleware.js'
import {
  claimCoupon,
  createCoupon,
  deleteCoupon,
  getAdminCouponDetail,
  getAdminCoupons,
  getMyCoupons,
  getPublicCoupons,
  updateCoupon,
  validateCoupon
} from '../controllers/couponController.js'

const router = express.Router()

router.get('/public', getPublicCoupons)
router.get('/my', authGuard(), getMyCoupons)
router.post('/claim', authGuard(), claimCoupon)
router.post('/validate', optionalAuthGuard(), validateCoupon)
router.get('/admin', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), getAdminCoupons)
router.get('/admin/:id', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), getAdminCouponDetail)
router.post('/', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), createCoupon)
router.put('/:id', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), updateCoupon)
router.delete('/:id', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), deleteCoupon)

export default router
