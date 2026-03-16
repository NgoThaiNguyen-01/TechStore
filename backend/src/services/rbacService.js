import Permission from '../models/Permission.js';
import Role from '../models/Role.js';

export const DEFAULT_PERMISSIONS = [
  'product:create',
  'product:update',
  'product:delete',
  'product:view',
  'brand:create',
  'brand:update',
  'brand:delete',
  'brand:view',
  'category:create',
  'category:update',
  'category:delete',
  'post:create',
  'post:update',
  'post:delete',
  'post-category:create',
  'post-category:update',
  'post-category:delete',
  'order:view',
  'order:update_status',
  'order:delete',
  'user:view',
  'user:manage',
  'report:view',
  'inventory:update',
  'coupon:view',
  'coupon:create',
  'coupon:update',
  'coupon:delete',
  'settings:update',
  'role:create'
];

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: DEFAULT_PERMISSIONS,
  ADMIN: [
    'product:create',
    'product:update',
    'product:delete',
    'product:view',
    'brand:create',
    'brand:update',
    'brand:delete',
    'brand:view',
    'category:create',
    'category:update',
    'category:delete',
    'post:create',
    'post:update',
    'post:delete',
    'post-category:create',
    'post-category:update',
    'post-category:delete',
    'order:view',
    'order:update_status',
    'order:delete',
    'user:view',
    'user:manage',
    'report:view',
    'inventory:update',
    'coupon:view',
    'coupon:create',
    'coupon:update',
    'coupon:delete',
    'settings:update'
  ],
  PRODUCT_MANAGER: [
    'product:create',
    'product:update',
    'product:delete',
    'product:view',
    'brand:create',
    'brand:update',
    'brand:delete',
    'brand:view',
    'category:create',
    'category:update',
    'category:delete'
  ],
  ORDER_MANAGER: ['order:view', 'order:update_status', 'order:delete'],
  INVENTORY: ['inventory:update', 'product:view'],
  CUSTOMER: ['product:view', 'order:view']
};

export const DEFAULT_ROLE_ORDER = Object.keys(DEFAULT_ROLE_PERMISSIONS);

export const ensureDefaultRbacData = async () => {
  const permissionDocs = await Promise.all(
    DEFAULT_PERMISSIONS.map((name) =>
      Permission.findOneAndUpdate(
        { name },
        { name },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  const permissionMap = permissionDocs.reduce((acc, perm) => {
    acc[perm.name] = perm._id;
    return acc;
  }, {});

  for (const roleName of DEFAULT_ROLE_ORDER) {
    const rolePerms = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
    const permIds = rolePerms.map((perm) => permissionMap[perm]).filter(Boolean);
    await Role.findOneAndUpdate(
      { name: roleName },
      { name: roleName, permissions: permIds },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const [roles, permissions] = await Promise.all([
    Role.find({}).populate('permissions').sort({ name: 1 }),
    Permission.find({}).sort({ name: 1 })
  ]);

  return {
    roles,
    permissions
  };
};

export const getRolePermissionNames = async (roleName) => {
  const normalizedRole = String(roleName || '').trim().toUpperCase();
  if (!normalizedRole) return [];

  const roleDoc = await Role.findOne({ name: normalizedRole }).populate('permissions');
  return (roleDoc?.permissions || [])
    .map((permission) => permission?.name)
    .filter(Boolean);
};
