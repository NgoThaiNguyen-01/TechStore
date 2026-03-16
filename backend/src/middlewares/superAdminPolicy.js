import User from '../models/User.js';
import { decideCanAffect } from '../services/superAdminRules.js';

const loadUser = async (id) => {
  if (!id) return null;
  try {
    return await User.findById(id).select('_id role superAdminType isActive email');
  } catch {
    return null;
  }
};

export const canAffectUser = async ({ actorId, targetId }) => {
  const actor = await loadUser(actorId);
  const target = await loadUser(targetId);
  return decideCanAffect({ actor, target, env: process.env });
};

export const requireFoundingSA = async (req, res, next) => {
  const actor = req.user;
  if (!actor || actor.role !== 'SUPER_ADMIN' || actor.superAdminType !== 'FOUNDING') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};
