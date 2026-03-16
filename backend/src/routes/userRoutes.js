import express from 'express';
import authGuard from '../middlewares/authMiddleware.js';
import {
  changeMyPassword,
  createUser,
  deleteUser,
  deleteMyAccount,
  getUserById,
  getMyProfile,
  getUsers,
  grantSuperAdmin,
  revokeSuperAdmin,
  updateMyProfile,
  updateUser,
  updateUserRole,
  updateUserStatus,
  verifyMyPassword
} from '../controllers/userController.js';
import {
  getMyCart,
  getMyWishlist,
  mergeMyCart,
  mergeMyWishlist,
  replaceMyCart,
  replaceMyWishlist
} from '../controllers/userCollectionController.js';
import { requireFoundingSA } from '../middlewares/superAdminPolicy.js';

const router = express.Router();

router.get('/me', authGuard(), getMyProfile);
router.put('/me', authGuard(), updateMyProfile);
router.get('/me/cart', authGuard(), getMyCart);
router.put('/me/cart', authGuard(), replaceMyCart);
router.post('/me/cart/merge', authGuard(), mergeMyCart);
router.get('/me/wishlist', authGuard(), getMyWishlist);
router.put('/me/wishlist', authGuard(), replaceMyWishlist);
router.post('/me/wishlist/merge', authGuard(), mergeMyWishlist);
router.post('/me/verify-password', authGuard(), verifyMyPassword);
router.put('/me/password', authGuard(), changeMyPassword);
router.delete('/me', authGuard(), deleteMyAccount);
router.get('/', authGuard({ permissions: 'user:view' }), getUsers);
router.get('/:id', authGuard({ permissions: 'user:view' }), getUserById);
router.post('/', authGuard({ roles: 'SUPER_ADMIN' }), createUser);
router.put('/:id', authGuard({ permissions: 'user:manage' }), updateUser);
router.delete('/:id', authGuard({ roles: 'SUPER_ADMIN' }), deleteUser);
router.patch('/:id/role', authGuard({ permissions: 'user:manage' }), updateUserRole);
router.patch('/:id/status', authGuard({ permissions: 'user:manage' }), updateUserStatus);
router.post('/:id/grant-super-admin', authGuard({ roles: 'SUPER_ADMIN' }), requireFoundingSA, grantSuperAdmin);
router.post('/:id/revoke-super-admin', authGuard({ roles: 'SUPER_ADMIN' }), requireFoundingSA, revokeSuperAdmin);

export default router;
