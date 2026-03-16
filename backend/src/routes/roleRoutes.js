import express from 'express';
import { bootstrapRbac, createRole, getPermissions, getRoles, updateRole } from '../controllers/roleController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/permissions', authGuard({ permissions: 'role:create' }), getPermissions);
router.get('/', authGuard({ permissions: 'role:create' }), getRoles);
router.post('/bootstrap', authGuard({ permissions: 'role:create' }), bootstrapRbac);
router.post('/', authGuard({ permissions: 'role:create' }), createRole);
router.put('/:id', authGuard({ permissions: 'role:create' }), updateRole);

export default router;
