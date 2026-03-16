import express from 'express';
import {
  createProduct,
  bulkDeleteProducts,
  bulkUpdateStatus,
  deleteProduct,
  getProductById,
  getProducts,
  updateProductStatus,
  updateProduct,
  restoreProduct
} from '../controllers/productController.js';
import {
  bulkDeleteAdminProductReviews,
  bulkUpdateAdminProductReviewStatus,
  deleteAdminProductReview,
  getAdminProductReviews,
  updateAdminProductReviewStatus,
  deleteMyProductReview,
  getProductReviews,
  upsertMyProductReview
} from '../controllers/productReviewController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authGuard({ permissions: 'product:create' }), createProduct);
router.get('/', getProducts);
router.get('/reviews/admin', authGuard({ permissions: 'product:update' }), getAdminProductReviews);
router.post('/reviews/bulk-status', authGuard({ permissions: 'product:update' }), bulkUpdateAdminProductReviewStatus);
router.post('/reviews/bulk-delete', authGuard({ permissions: 'product:update' }), bulkDeleteAdminProductReviews);
router.patch('/reviews/:reviewId/status', authGuard({ permissions: 'product:update' }), updateAdminProductReviewStatus);
router.delete('/reviews/:reviewId', authGuard({ permissions: 'product:update' }), deleteAdminProductReview);
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authGuard(), upsertMyProductReview);
router.delete('/:id/reviews/mine', authGuard(), deleteMyProductReview);
router.post('/bulk-status', authGuard({ permissions: 'product:update' }), bulkUpdateStatus);
router.post('/bulk-delete', authGuard({ permissions: 'product:delete' }), bulkDeleteProducts);
router.patch('/:id/status', authGuard({ permissions: 'product:update' }), updateProductStatus);
router.patch('/:id/restore', authGuard({ permissions: 'product:update' }), restoreProduct);
router.get('/:id', getProductById);
router.put('/:id', authGuard({ permissions: 'product:update' }), updateProduct);
router.delete('/:id', authGuard({ permissions: 'product:delete' }), deleteProduct);

export default router;
