import express from 'express';
import {
  getDashboardActivity,
  getDashboardReviewAnalytics,
  getDashboardSummary
} from '../controllers/dashboardController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get(
  '/summary',
  authGuard({ roles: ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'INVENTORY'] }),
  getDashboardSummary
);
router.get(
  '/activity',
  authGuard({ roles: ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'INVENTORY'] }),
  getDashboardActivity
);
router.get(
  '/reviews',
  authGuard({ roles: ['SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_MANAGER', 'INVENTORY'] }),
  getDashboardReviewAnalytics
);

export default router;
