import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/postCategoryController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getCategories);

router.post('/', authGuard({ permissions: 'post-category:create' }), createCategory);
router.put('/:id', authGuard({ permissions: 'post-category:update' }), updateCategory);
router.delete('/:id', authGuard({ permissions: 'post-category:delete' }), deleteCategory);

export default router;
