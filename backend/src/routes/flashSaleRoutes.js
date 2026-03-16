import express from 'express';
import authGuard from '../middlewares/authMiddleware.js';
import {
  clearFlashSale,
  createFlashSale,
  getAdminFlashSales,
  getPublicFlashSale
} from '../controllers/flashSaleController.js';

const router = express.Router();

router.get('/public', getPublicFlashSale);
router.get('/admin', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), getAdminFlashSales);
router.post('/', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), createFlashSale);
router.post('/clear', authGuard({ roles: ['SUPER_ADMIN', 'ADMIN'] }), clearFlashSale);

export default router;
