import express from 'express';
import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
} from '../controllers/postController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', getPostById);

// Protected routes
router.post('/', authGuard({ permissions: 'post:create' }), createPost);
router.put('/:id', authGuard({ permissions: 'post:update' }), updatePost);
router.delete('/:id', authGuard({ permissions: 'post:delete' }), deletePost);

export default router;
