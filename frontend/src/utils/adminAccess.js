import { ADMIN_PAGE_IDS } from "./adminRoutes";

const DEFAULT_PERMISSIONS = [
    "product:create",
    "product:update",
    "product:delete",
    "product:view",
    "brand:create",
    "brand:update",
    "brand:delete",
    "brand:view",
    "category:create",
    "category:update",
    "category:delete",
    "post:create",
    "post:update",
    "post:delete",
    "post-category:create",
    "post-category:update",
    "post-category:delete",
    "order:view",
    "order:update_status",
    "order:delete",
    "user:view",
    "user:manage",
    "report:view",
    "inventory:update",
    "coupon:view",
    "coupon:create",
    "coupon:update",
    "coupon:delete",
    "settings:update",
    "role:create",
];

export const ROLE_PERMISSION_FALLBACK = {
    SUPER_ADMIN: DEFAULT_PERMISSIONS,
    ADMIN: DEFAULT_PERMISSIONS.filter((permission) => permission !== "role:create"),
    PRODUCT_MANAGER: [
        "product:create",
        "product:update",
        "product:delete",
        "product:view",
        "brand:create",
        "brand:update",
        "brand:delete",
        "brand:view",
        "category:create",
        "category:update",
        "category:delete",
    ],
    ORDER_MANAGER: ["order:view", "order:update_status", "order:delete"],
    INVENTORY: ["inventory:update", "product:view"],
    CUSTOMER: ["product:view", "order:view"],
};

export const ADMIN_APP_ROLES = [
    "SUPER_ADMIN",
    "ADMIN",
    "PRODUCT_MANAGER",
    "ORDER_MANAGER",
    "INVENTORY",
];

export const canAccessAdminApp = (user) =>
    ADMIN_APP_ROLES.includes(String(user?.role || "").toUpperCase());

export const ADMIN_PAGE_ROLE_ACCESS = {
    dashboard: ADMIN_APP_ROLES,
    activityLog: ADMIN_APP_ROLES,
    categories: ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"],
    products: ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "INVENTORY"],
    reviews: ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"],
    brands: ["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"],
    orders: ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"],
    aftersales: ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"],
    posts: ["SUPER_ADMIN", "ADMIN"],
    postCategories: ["SUPER_ADMIN", "ADMIN"],
    roles: ["SUPER_ADMIN"],
    users: ["SUPER_ADMIN", "ADMIN"],
    analytics: ["SUPER_ADMIN", "ADMIN"],
    coupons: ["SUPER_ADMIN", "ADMIN"],
    flashSale: ["SUPER_ADMIN", "ADMIN"],
    settings: ["SUPER_ADMIN", "ADMIN"],
};

export const ADMIN_PAGE_PERMISSION_ACCESS = {
    dashboard: null,
    activityLog: null,
    categories: ["category:create", "category:update", "category:delete"],
    products: [
        "product:view",
        "product:create",
        "product:update",
        "product:delete",
        "inventory:update",
    ],
    reviews: ["product:update"],
    brands: ["brand:view", "brand:create", "brand:update", "brand:delete"],
    orders: ["order:view"],
    aftersales: ["order:view"],
    posts: ["post:create", "post:update", "post:delete"],
    postCategories: [
        "post-category:create",
        "post-category:update",
        "post-category:delete",
    ],
    roles: ["role:create"],
    users: ["user:view", "user:manage"],
    analytics: ["report:view"],
    coupons: ["coupon:view", "coupon:create", "coupon:update", "coupon:delete"],
    flashSale: ["settings:update"],
    settings: ["settings:update"],
};

export const getUserPermissionSet = (user) => {
    const explicitPermissions = Array.isArray(user?.permissions)
        ? user.permissions
        : [];

    const normalizedExplicit = explicitPermissions
        .map((permission) => String(permission || "").trim())
        .filter(Boolean);

    if (normalizedExplicit.length > 0) {
        return new Set(normalizedExplicit);
    }

    const normalizedRole = String(user?.role || "").toUpperCase();
    return new Set(ROLE_PERMISSION_FALLBACK[normalizedRole] || []);
};

export const hasAdminPermission = (user, permission) =>
    getUserPermissionSet(user).has(String(permission || "").trim());

export const hasAnyAdminPermission = (user, permissions = []) => {
    const permissionSet = getUserPermissionSet(user);
    return permissions.some((permission) =>
        permissionSet.has(String(permission || "").trim())
    );
};

export const canAccessAdminPage = (user, page) => {
    const normalizedRole = String(user?.role || "").toUpperCase();
    if (!normalizedRole || !canAccessAdminApp(user)) return false;

    const allowedRoles = ADMIN_PAGE_ROLE_ACCESS[page] || [];
    if (!allowedRoles.includes(normalizedRole)) return false;

    const requiredPermissions = ADMIN_PAGE_PERMISSION_ACCESS[page];
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    return hasAnyAdminPermission(user, requiredPermissions);
};

export const getAccessibleAdminPages = (user) =>
    ADMIN_PAGE_IDS.filter((page) => canAccessAdminPage(user, page));

export const getDefaultAdminPage = (user) => {
    const accessiblePages = getAccessibleAdminPages(user);
    if (accessiblePages.includes("dashboard")) return "dashboard";
    return accessiblePages[0] || null;
};
