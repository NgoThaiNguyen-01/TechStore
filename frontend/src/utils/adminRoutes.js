export const ADMIN_PAGE_IDS = [
    "dashboard",
    "activityLog",
    "categories",
    "products",
    "reviews",
    "brands",
    "orders",
    "aftersales",
    "posts",
    "postCategories",
    "roles",
    "users",
    "analytics",
    "coupons",
    "flashSale",
    "settings",
];

export const ADMIN_PAGE_SEGMENTS = {
    dashboard: "",
    activityLog: "activity-log",
    categories: "categories",
    products: "products",
    reviews: "reviews",
    brands: "brands",
    orders: "orders",
    aftersales: "aftersales",
    posts: "posts",
    postCategories: "post-categories",
    roles: "roles",
    users: "users",
    analytics: "analytics",
    coupons: "coupons",
    flashSale: "flash-sale",
    settings: "settings",
};

const ADMIN_SEGMENT_TO_PAGE = Object.fromEntries(
    Object.entries(ADMIN_PAGE_SEGMENTS).map(([page, segment]) => [segment, page])
);

export const getAdminPagePath = (page) => {
    const segment = ADMIN_PAGE_SEGMENTS[page] ?? "";
    return segment ? `/admin/${segment}` : "/admin";
};

export const getAdminPageFromPathname = (pathname) => {
    const normalized = String(pathname || "").replace(/\/+$/, "");
    const stripped = normalized.replace(/^\/admin\/?/, "");
    if (stripped.startsWith(`${ADMIN_PAGE_SEGMENTS.aftersales}/`)) return "aftersales";
    if (stripped.startsWith(`${ADMIN_PAGE_SEGMENTS.orders}/`)) return "orders";
    return ADMIN_SEGMENT_TO_PAGE[stripped] || (stripped ? null : "dashboard");
};
