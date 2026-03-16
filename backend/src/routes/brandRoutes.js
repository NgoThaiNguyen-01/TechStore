import express from 'express';
import {
  createBrand,
  deleteBrand,
  getBrandById,
  getBrands,
  updateBrand
} from '../controllers/brandController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getBrands);
router.post('/', authGuard({ permissions: 'brand:create' }), createBrand);
router.get('/:id', getBrandById);
router.put('/:id', authGuard({ permissions: 'brand:update' }), updateBrand);
router.delete('/:id', authGuard({ permissions: 'brand:delete' }), deleteBrand);

export default router;
