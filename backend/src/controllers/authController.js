import { validationResult } from 'express-validator';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/token.js';
import { logValidationErrors } from '../utils/validationLog.js';
import { formatUserProfileResponse } from '../utils/userContactProfile.js';
import { passwordIssues, validateEmail, validateRegisterPayload } from '../validation/registerValidation.js';
import crypto from 'crypto';
import { getRolePermissionNames } from '../services/rbacService.js';

const buildUserResponse = async (user) => {
  const data = formatUserProfileResponse(user);
  const permissions = await getRolePermissionNames(data?.role);
  return {
    id: data._id,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    address: data.address || '',
    avatar: data.avatar || '',
    emails: data.emails || [],
    phones: data.phones || [],
    addresses: data.addresses || [],
    role: data.role,
    superAdminType: data.superAdminType,
    loyaltyPoints: Number(data.loyaltyPoints || 0),
    lifetimeSpent: Number(data.lifetimeSpent || 0),
    memberTier: data.memberTier || 'BRONZE',
    permissions
  };
};

export const register = async (req, res, next) => {
  try {
    const validation = validateRegisterPayload(req.body);
    if (!validation.ok) {
      logValidationErrors({ scope: 'auth.register', errors: validation.errors, req });
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validation.errors });
    }

    const { name, email, password } = validation.sanitized;
    const existing = await User.exists({ email });
    if (existing) {
      const errors = { email: 'Email đã tồn tại' };
      logValidationErrors({ scope: 'auth.register', errors, req });
      return res.status(409).json({ success: false, message: 'Email đã tồn tại', errors });
    }

    const user = await User.create({
      name,
      email,
      password
    });
    res.status(201).json({ success: true, message: 'Registered', data: await buildUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

export const checkEmail = async (req, res, next) => {
  try {
    const { email, error } = validateEmail(req.query.email);
    if (error) {
      const errors = { email: error };
      logValidationErrors({ scope: 'auth.checkEmail', errors, req });
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
    }
    const exists = await User.exists({ email });
    res.json({ success: true, data: { exists: Boolean(exists) } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email: rawEmail, password: rawPassword, remember } = req.body || {};
    const { email, error } = validateEmail(rawEmail);
    if (error) {
      logValidationErrors({ scope: 'auth.login', errors: { email: error }, req });
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: { email: error } });
    }
    const password = String(rawPassword || '');
    if (!password) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: { password: 'Vui lòng nhập mật khẩu' } });
    }
    if (password.length < 8 || password.length > 32) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: { password: 'Mật khẩu 8-32 ký tự' } });
    }
    if (password !== password.trim()) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: { password: 'Không chứa khoảng trắng đầu/cuối' } });
    }

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email chưa được đăng ký' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const remainMs = user.lockUntil.getTime() - Date.now();
      return res.status(423).json({ success: false, message: `Tài khoản tạm khóa. Thử lại sau ${Math.ceil(remainMs / 60000)} phút` });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const attempts = (user.loginAttempts || 0) + 1;
      const updates = { loginAttempts: attempts };
      if (attempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 10 * 60 * 1000);
        updates.loginAttempts = 0;
      }
      await User.updateOne({ _id: user._id }, updates);
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    if (user.loginAttempts || user.lockUntil) {
      await User.updateOne({ _id: user._id }, { loginAttempts: 0, lockUntil: null });
    }

    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id, role: user.role });
    const days = remember ? 30 : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user: user._id, token: refreshToken, expiresAt });
    res.status(200).json({
      success: true,
      message: 'Logged in',
      data: { accessToken, refreshToken, user: await buildUserResponse(user) }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, revoked: false });
    if (!tokenDoc) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    if (tokenDoc.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }
    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken, refreshToken }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({ success: true, message: 'Profile', data: await buildUserResponse(req.user) });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, error } = validateEmail(req.body?.email);
    if (error) {
      const errors = { email: error };
      logValidationErrors({ scope: 'auth.forgotPassword', errors, req });
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
    }
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires +resetPasswordRequestWindowStart +resetPasswordRequestCount');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email chưa được đăng ký' });
    }

    const windowMs = 15 * 60 * 1000;
    const now = Date.now();
    const windowStart = user.resetPasswordRequestWindowStart?.getTime?.() || 0;
    const inWindow = windowStart && now - windowStart < windowMs;
    const count = inWindow ? (user.resetPasswordRequestCount || 0) : 0;
    if (inWindow && count >= 5) {
      return res.status(429).json({ success: false, message: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    user.resetPasswordRequestWindowStart = inWindow ? user.resetPasswordRequestWindowStart : new Date(now);
    user.resetPasswordRequestCount = count + 1;
    await user.save({ validateBeforeSave: false });

    const secure = req.secure || String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    res.cookie('reset_session', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 15 * 60 * 1000,
      path: '/api/auth'
    });
    res.status(200).json({ success: true, message: 'Bạn có thể đặt lại mật khẩu ngay bây giờ.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');
    const cookieHeader = String(req.headers?.cookie || '');
    const cookiePart = cookieHeader.split(';').map((s) => s.trim()).find((s) => s.startsWith('reset_session='));
    const sessionToken = cookiePart ? decodeURIComponent(cookiePart.split('=').slice(1).join('=')) : '';
    if (!sessionToken) {
      return res.status(400).json({ success: false, message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.' });
    }
    const issues = passwordIssues(password);
    if (issues.length > 0) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không hợp lệ', errors: { password: issues } });
    }
    if (!confirmPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập xác nhận mật khẩu', errors: { confirmPassword: 'Vui lòng nhập xác nhận mật khẩu' } });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu không khớp', errors: { confirmPassword: 'Xác nhận mật khẩu không khớp' } });
    }
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } }).select('+password +resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.clearCookie('reset_session', { path: '/api/auth' });
    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
};
