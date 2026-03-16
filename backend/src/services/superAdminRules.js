export const decideCanAffect = ({ actor, target, env = process.env }) => {
  if (!actor) return { allow: false, reason: 'Unauthorized' };
  if (!target) return { allow: true };

  const actorIsSA = actor.role === 'SUPER_ADMIN';
  const targetIsSA = target.role === 'SUPER_ADMIN';

  const masterList = String(env.MASTER_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (actor?.email && masterList.includes(String(actor.email).toLowerCase())) {
    return { allow: true };
  }

  if (!actorIsSA) {
    if (targetIsSA) return { allow: false, reason: 'Access denied' };
    return { allow: true };
  }

  const founderMutualEdit = String(env.FOUNDER_MUTUAL_EDIT || 'false').toLowerCase() === 'true';
  if (actor.superAdminType === 'FOUNDING' && target.superAdminType === 'FOUNDING') {
    return founderMutualEdit ? { allow: true } : { allow: false, reason: 'Founding Super Admins cannot affect each other' };
  }

  if (actor.superAdminType === 'REGULAR' && target.superAdminType === 'FOUNDING') {
    return { allow: false, reason: 'Regular Super Admin cannot affect Founding Super Admins' };
  }

  return { allow: true };
};

export default decideCanAffect;
