import express from 'express';
import {
  addOrderInternalNote,
  cancelMomoCheckout,
  confirmMomoReturn,
  createOrder,
  estimateOrderShipping,
  getOrderAnalyticsSummary,
  getOrderById,
  getOrders,
  handleMomoIpn,
  handleMomoReturn,
  reviewOrderAftersalesRequest,
  requestOrderRefund,
  reviewOrderRefundRequest,
  submitOrderAftersalesRequest,
  updateOrderStatus
} from '../controllers/orderController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/payment/momo/ipn', handleMomoIpn);
router.post('/payment/momo/cancel', authGuard(), cancelMomoCheckout);
router.get('/payment/momo/confirm', confirmMomoReturn);
router.get('/payment/momo/return', handleMomoReturn);

router.post('/shipping-estimate', authGuard(), estimateOrderShipping);
router.post('/', authGuard(), createOrder);
router.get('/analytics/summary', authGuard({ permissions: 'report:view' }), getOrderAnalyticsSummary);
router.get('/', authGuard({ permissions: 'order:view' }), getOrders);
router.post('/:id/internal-notes', authGuard({ permissions: 'order:update_status' }), addOrderInternalNote);
router.post('/:id/aftersales-request', authGuard({ permissions: 'order:view' }), submitOrderAftersalesRequest);
router.patch('/:id/aftersales-request', authGuard({ permissions: 'order:update_status' }), reviewOrderAftersalesRequest);
router.post('/:id/refund-request', authGuard({ permissions: 'order:view' }), requestOrderRefund);
router.patch('/:id/refund-request', authGuard({ permissions: 'order:update_status' }), reviewOrderRefundRequest);
router.get('/:id', authGuard({ permissions: 'order:view' }), getOrderById);
router.put('/:id/status', authGuard({ permissions: 'order:update_status' }), updateOrderStatus);

export default router;
