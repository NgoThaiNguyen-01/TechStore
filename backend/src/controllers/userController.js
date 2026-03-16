import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { canAffectUser } from '../middlewares/superAdminPolicy.js';
import {
  extractUserContactValues,
  formatUserProfileResponse,
  normalizeUserContactProfile
} from '../utils/userContactProfile.js';
import { getRolePermissionNames } from '../services/rbacService.js';

const buildDateRange = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

const sanitizeUser = (user) => formatUserProfileResponse(user);

const sanitizeCurrentUser = async (user) => {
  const data = formatUserProfileResponse(user);
  return {
    ...data,
    permissions: await getRolePermissionNames(data?.role)
  };
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || '').trim());
const isValidPhone = (phone) => /^(03|05|07|08|09)\d{8}$/.test(String(phone || '').trim());

const validatePassword = (password) => {
  const raw = String(password || '');
  const issues = [];
  if (raw.length < 8) issues.push('Mật khẩu phải có ít nhất 8 ký tự');
  if (!/[A-Z]/.test(raw)) issues.push('Mật khẩu phải có chữ hoa');
  if (!/[a-z]/.test(raw)) issues.push('Mật khẩu phải có chữ thường');
  if (!/\d/.test(raw)) issues.push('Mật khẩu phải có số');
  if (!/[^A-Za-z0-9]/.test(raw)) issues.push('Mật khẩu phải có ký tự đặc biệt');
  return issues;
};

const pickField = (value) => (value === undefined ? undefined : String(value).trim());

const buildMergedContactProfile = (user, payload = {}) => {
  const current = typeof user?.toObject === 'function' ? user.toObject() : user || {};

  return normalizeUserContactProfile({
    email: payload.email !== undefined ? payload.email : current.email,
    phone: payload.phone !== undefined ? payload.phone : current.phone,
    address: payload.address !== undefined ? payload.address : current.address,
    emails: payload.emails !== undefined ? payload.emails : current.emails,
    phones: payload.phones !== undefined ? payload.phones : current.phones,
    addresses: payload.addresses !== undefined ? payload.addresses : current.addresses
  });
};

const validateContactProfile = (profile, { requirePhone = false, requireAddress = false } = {}) => {
  if (!profile.email) return 'Email is required';

  const emailValues = (profile.emails || []).map((item) => String(item?.value || ''));
  const phoneValues = (profile.phones || []).map((item) => String(item?.value || ''));
  const addressValues = (profile.addresses || []).map((item) => String(item?.value || ''));

  if (emailValues.some((value) => value.length > 255)) return 'Max length exceeded';
  if (emailValues.some((value) => !isValidEmail(value))) return 'Invalid email';

  if (requirePhone && !profile.phone) return 'Phone is required';
  if (phoneValues.some((value) => !isValidPhone(value))) return 'Invalid phone';

  if (requireAddress && !profile.address) return 'Address is required';
  if (addressValues.some((value) => value.length > 500)) return 'Max length exceeded';

  return null;
};

const ensureUniqueContactOwnership = async ({ userId, profile }) => {
  const filter = userId ? { _id: { $ne: userId } } : {};
  const { emails, phones } = extractUserContactValues(profile);

  if (emails.length > 0) {
    const emailConflict = await User.findOne({
      ...filter,
      $or: [
        { email: { $in: emails } },
        { 'emails.value': { $in: emails } }
      ]
    }).select('_id');

    if (emailConflict) {
      throw new Error('Email already exists');
    }
  }

  if (phones.length > 0) {
    const phoneConflict = await User.findOne({
      ...filter,
      $or: [
        { phone: { $in: phones } },
        { 'phones.value': { $in: phones } }
      ]
    }).select('_id');

    if (phoneConflict) {
      throw new Error('Phone already exists');
    }
  }
};

const applyProfilePayload = async (user, payload = {}, options = {}) => {
  const {
    requirePhone = false,
    requireAddress = false,
    requireAvatar = false,
    userId = user?._id
  } = options;

  if (payload.name !== undefined) {
    const nextName = String(payload.name).trim();
    if (!nextName) return { error: 'Name is required' };
    if (nextName.length > 255) return { error: 'Max length exceeded' };
    user.name = nextName;
  } else if (!String(user.name || '').trim()) {
    return { error: 'Name is required' };
  }

  if (payload.avatar !== undefined) {
    const nextAvatar = String(payload.avatar).trim();
    if (!nextAvatar) return { error: 'Avatar is required' };
    if (nextAvatar.length > 2048) return { error: 'Max length exceeded' };
    user.avatar = nextAvatar;
  } else if (requireAvatar && !String(user.avatar || '').trim()) {
    return { error: 'Avatar is required' };
  }

  const hasContactPayload = ['email', 'phone', 'address', 'emails', 'phones', 'addresses']
    .some((key) => payload[key] !== undefined);

  const nextProfile = hasContactPayload
    ? buildMergedContactProfile(user, payload)
    : normalizeUserContactProfile(user.toObject ? user.toObject() : user);

  const contactError = validateContactProfile(nextProfile, { requirePhone, requireAddress });
  if (contactError) return { error: contactError };

  await ensureUniqueContactOwnership({ userId, profile: nextProfile });

  user.email = nextProfile.email;
  user.phone = nextProfile.phone || undefined;
  user.address = nextProfile.address || undefined;
  user.emails = nextProfile.emails;
  user.phones = nextProfile.phones;
  user.addresses = nextProfile.addresses;

  return { ok: true, profile: nextProfile };
};

const saveUserWithDuplicateGuard = async (user, res) => {
  try {
    await user.save();
    return true;
  } catch (error) {
    if (error?.code === 11000) {
      const key = Object.keys(error?.keyPattern || {})[0];
      if (key === 'phone') {
        res.status(409).json({ success: false, message: 'Phone already exists', fields: ['phone'] });
        return false;
      }
      res.status(409).json({ success: false, message: 'Email already exists' });
      return false;
    }
    throw error;
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const role = req.query.role;
    const status = req.query.status;
    const sortParam = req.query.sort;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const createdRange = buildDateRange(req.query.createdDate);
    if (createdRange) {
      query.createdAt = createdRange;
    }
    const updatedRange = buildDateRange(req.query.updatedDate);
    if (updatedRange) {
      query.updatedAt = updatedRange;
    }

    let sort = { createdAt: -1 };
    if (sortParam) {
      const [field, order] = String(sortParam).split(':');
      if (field) {
        sort = { [field]: order === 'asc' ? 1 : -1 };
      }
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: users.map(sanitizeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (req, res) => {
  res.json({ success: true, data: await sanitizeCurrentUser(req.user) });
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const id = req.user?._id?.toString();
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await applyProfilePayload(user, req.body || {}, { userId: id });
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const saved = await saveUserWithDuplicateGuard(user, res);
    if (!saved) return;

    const reloaded = await User.findById(id);
    res.json({ success: true, data: await sanitizeCurrentUser(reloaded) });
  } catch (error) {
    if (String(error?.message || '').includes('Phone already exists')) {
      return res.status(409).json({ success: false, message: 'Phone already exists', fields: ['phone'] });
    }
    if (String(error?.message || '').includes('Email already exists')) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(error);
  }
};

export const verifyMyPassword = async (req, res, next) => {
  try {
    const id = req.user?._id?.toString();
    const { password } = req.body || {};
    const rawPassword = String(password || '');
    if (!rawPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(rawPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({ success: true, message: 'Password is correct' });
  } catch (error) {
    next(error);
  }
};

export const changeMyPassword = async (req, res, next) => {
  try {
    const id = req.user?._id?.toString();
    const { currentPassword, newPassword } = req.body || {};
    const rawCurrent = String(currentPassword || '');
    const rawNew = String(newPassword || '');
    if (!rawCurrent || !rawNew) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(rawCurrent);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const pwdIssues = validatePassword(rawNew);
    if (pwdIssues.length > 0) {
      return res.status(400).json({ success: false, message: 'Password invalid', details: pwdIssues });
    }

    user.password = rawNew;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      address,
      avatar,
      status,
      emails,
      phones,
      addresses
    } = req.body || {};

    const trimmedName = pickField(name);
    const trimmedAvatar = pickField(avatar);
    const rawPassword = String(password || '');
    const initialProfile = normalizeUserContactProfile({ email, phone, address, emails, phones, addresses });

    const missingFields = [];
    if (!trimmedName) missingFields.push('name');
    if (!initialProfile.email) missingFields.push('email');
    if (!initialProfile.phone) missingFields.push('phone');
    if (!initialProfile.address) missingFields.push('address');
    if (!trimmedAvatar) missingFields.push('avatar');
    if (!rawPassword) missingFields.push('password');
    if (!role) missingFields.push('role');
    if (status === undefined || status === null || status === '') missingFields.push('status');
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields', fields: missingFields });
    }

    const pwdIssues = validatePassword(rawPassword);
    if (pwdIssues.length > 0) {
      return res.status(400).json({ success: false, message: 'Password invalid', details: pwdIssues });
    }

    const doc = new User({
      name: trimmedName,
      avatar: trimmedAvatar,
      password: rawPassword,
      role: String(role).toUpperCase(),
      isActive: String(status).toLowerCase() === 'active'
    });

    const result = await applyProfilePayload(doc, { email, phone, address, emails, phones, addresses, avatar }, {
      requirePhone: true,
      requireAddress: true,
      requireAvatar: true
    });
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const saved = await saveUserWithDuplicateGuard(doc, res);
    if (!saved) return;

    res.status(201).json({ success: true, data: sanitizeUser(doc) });
  } catch (error) {
    if (String(error?.message || '').includes('Phone already exists')) {
      return res.status(409).json({ success: false, message: 'Phone already exists', fields: ['phone'] });
    }
    if (String(error?.message || '').includes('Email already exists')) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    if (String(error?.message || '').includes('`role`')) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (String(error?.message || '').includes('Password does not meet')) {
      return res.status(400).json({ success: false, message: 'Password invalid' });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user?._id?.toString() === id && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'SUPER_ADMIN' && req.user?._id?.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { password, status } = req.body || {};
    const result = await applyProfilePayload(user, req.body || {}, { userId: id });
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    if (status !== undefined) {
      if (req.user?._id?.toString() === id) {
        return res.status(400).json({ success: false, message: 'Cannot change your own status' });
      }
      user.isActive = String(status).toLowerCase() === 'active';
    }
    if (password !== undefined && String(password)) {
      const pwdIssues = validatePassword(password);
      if (pwdIssues.length > 0) {
        return res.status(400).json({ success: false, message: 'Password invalid', details: pwdIssues });
      }
      user.password = String(password);
    }

    const saved = await saveUserWithDuplicateGuard(user, res);
    if (!saved) return;

    const reloaded = await User.findById(id);
    res.json({ success: true, data: sanitizeUser(reloaded) });
  } catch (error) {
    if (String(error?.message || '').includes('Phone already exists')) {
      return res.status(409).json({ success: false, message: 'Phone already exists', fields: ['phone'] });
    }
    if (String(error?.message || '').includes('Email already exists')) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'SUPER_ADMIN') {
      const check = await canAffectUser({ actorId: req.user?._id, targetId: id });
      if (!check.allow) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    await user.deleteOne();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.delete',
      targetUser: user._id,
      details: { email: user.email },
      ip: req.ip
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const nextRole = String(req.body.role || '').toUpperCase();
    const allowedRoles = User.schema.path('role').enumValues;
    if (!allowedRoles.includes(nextRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (req.user?._id?.toString() === id && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'SUPER_ADMIN' || nextRole === 'SUPER_ADMIN') {
      const check = await canAffectUser({ actorId: req.user?._id, targetId: id });
      if (!check.allow) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    user.role = nextRole;
    if (nextRole === 'SUPER_ADMIN' && !user.superAdminType) {
      user.superAdminType = 'REGULAR';
    }
    if (nextRole !== 'SUPER_ADMIN') {
      user.superAdminType = null;
    }
    await user.save();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.updateRole',
      targetUser: user._id,
      details: { role: nextRole },
      ip: req.ip
    });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (req.user?._id?.toString() === id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'SUPER_ADMIN') {
      const check = await canAffectUser({ actorId: req.user?._id, targetId: id });
      if (!check.allow) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }
    user.isActive = Boolean(isActive);
    await user.save();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.updateStatus',
      targetUser: user._id,
      details: { isActive: Boolean(isActive) },
      ip: req.ip
    });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const grantSuperAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await canAffectUser({ actorId: req.user?._id, targetId: id });
    if (!check.allow) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user?.superAdminType !== 'FOUNDING') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.role = 'SUPER_ADMIN';
    user.superAdminType = 'REGULAR';
    await user.save();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.grantSuperAdmin',
      targetUser: user._id,
      details: {},
      ip: req.ip
    });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const revokeSuperAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.superAdminType === 'FOUNDING') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (req.user?.superAdminType !== 'FOUNDING') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    user.role = 'ADMIN';
    user.superAdminType = null;
    await user.save();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.revokeSuperAdmin',
      targetUser: user._id,
      details: {},
      ip: req.ip
    });
    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const deleteMyAccount = async (req, res, next) => {
  try {
    const id = req.user?._id?.toString();
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await user.deleteOne();
    await AuditLog.create({
      actor: req.user?._id,
      action: 'user.deleteSelf',
      targetUser: user._id,
      details: {},
      ip: req.ip
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
