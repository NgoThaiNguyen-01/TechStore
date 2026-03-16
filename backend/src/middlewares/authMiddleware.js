import User from '../models/User.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { verifyAccessToken } from '../utils/token.js';

const normalizeList = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const authGuard =
  ({ roles, permissions } = {}) =>
    async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization || '';
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const decoded = verifyAccessToken(parts[1]);
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!user.isActive) {
          return res.status(403).json({ success: false, message: 'Account disabled' });
        }

        const requiredRoles = normalizeList(roles);
        const requiredPermissions = normalizeList(permissions);

        if (requiredRoles.length > 0) {
          if (user.role !== 'SUPER_ADMIN' && !requiredRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }

        if (requiredPermissions.length > 0 && user.role !== 'SUPER_ADMIN') {
          const roleDoc = await Role.findOne({ name: user.role }).populate('permissions');
          const userPermissions = (roleDoc?.permissions || []).map((p) => p.name);
          const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));
          if (!hasAll) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
          req.userPermissions = userPermissions;
        }

        req.user = user;
        next();
      } catch (error) {
        if (error?.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: 'Token expired' });
        }
        if (error?.name === 'JsonWebTokenError') {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    };

export const optionalAuthGuard =
  () =>
    async (req, _res, next) => {
      try {
        const authHeader = req.headers.authorization || '';
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          req.user = null;
          return next();
        }

        const decoded = verifyAccessToken(parts[1]);
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
          req.user = null;
          return next();
        }

        req.user = user;
        return next();
      } catch {
        req.user = null;
        return next();
      }
    };

export default authGuard;
