import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { checkEmail, forgotPassword, getMe, login, logout, refresh, register, resetPassword } from '../controllers/authController.js';
import authGuard from '../middlewares/authMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

const checkEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', registerLimiter, register);
router.get('/check-email', checkEmailLimiter, checkEmail);
router.post('/forgot-password', checkEmailLimiter, forgotPassword);
router.post('/reset-password', registerLimiter, resetPassword);

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  login
);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authGuard(), getMe);

export default router;
