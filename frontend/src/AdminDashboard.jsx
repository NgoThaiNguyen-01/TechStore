import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDashboardActivity } from "./services/dashboardApi";
import { subscribeRealtime } from "./services/realtime";
import { clearStoredAuth } from "./utils/authStorage";
import { ADMIN_PAGE_IDS, getAdminPageFromPathname, getAdminPagePath } from "./utils/adminRoutes";
import { getAftersalesRequestStatusLabel, getAftersalesRequestTypeLabel } from "./utils/orderHelpers";
import { canAccessAdminPage, getAccessibleAdminPages, getDefaultAdminPage } from "./utils/adminAccess";

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = RAW_API_URL
    ? String(RAW_API_URL).replace(/\/$/, "").replace(/\/api\/?$/, "")
    : "http://localhost:5000";

const T = {
    vi: {
        adminConsole: "Bảng điều hành",
        dashboard: "Tổng quan",
        management: "Quản lý",
        orders: "Đơn hàng",
        aftersales: "Hậu mãi",
        products: "Sản phẩm",
        reviews: "Đánh giá",
        categories: "Danh mục",
        brands: "Thương hiệu",
        posts: "Tin tức",
        postCategories: "Chuyên mục tin tức",
        media: "Truyền thông",
        usersAccess: "Người dùng & Truy cập",
        users: "Người dùng",
        roles: "Phân quyền",
        system: "Hệ thống",
        promotions: "Khuyến mãi",
        flashSale: "Flash Sale",
        vouchers: "Voucher",
        analytics: "Thống kê",
        settings: "Cài đặt",
        superAdmin: "Quản trị viên",
        searchPlaceholder: "Tìm đơn hàng, khách hàng...",
        newOrder: "Tạo đơn hàng",
        viewStore: "Xem cửa hàng",
        home: "Trang chủ",
        totalRevenue: "Doanh thu",
        ordersCount: "Đơn hàng",
        activeUsers: "Người dùng hoạt động",
        lowStock: "Hàng sắp hết",
        vsLastMonth: "so tháng trước",
        revenueOverview: "Biểu đồ doanh thu",
        monthlyEarnings: "Hiệu suất doanh thu hàng tháng",
        last30Days: "30 ngày qua",
        last90Days: "90 ngày qua",
        thisYear: "Năm nay",
        export: "Xuất file",
        recentOrders: "Đơn hàng gần đây",
        viewAll: "Xem tất cả",
        orderId: "Mã đơn",
        customer: "Khách hàng",
        date: "Ngày",
        amount: "Số tiền",
        status: "Trạng thái",
        action: "Thao tác",
        statusCompleted: "Hoàn thành",
        statusProcessing: "Đang xử lý",
        statusCancelled: "Đã hủy",
        recentActivity: "Hoạt động gần đây",
        viewFullLog: "Xem toàn bộ nhật ký",
        act1Title: "Đơn hàng mới #1234",
        act1Desc: "Sarah Smith vừa đặt đơn hàng mới.",
        act1Time: "2 phút trước",
        act2Title: "Chờ thanh toán",
        act2Desc: "Đơn hàng #1230 đang chờ xác nhận thanh toán.",
        act2Time: "45 phút trước",
        act3Title: "Nhập thêm hàng",
        act3Desc: '"Tai nghe không dây" đã được nhập thêm (+50).',
        act3Time: "2 giờ trước",
        act4Title: "Đánh giá mới",
        act4Desc: 'Mike T. đã đánh giá "Đồng hồ thông minh".',
        act4Time: "5 giờ trước",
        act5Title: "Cập nhật hệ thống",
        act5Desc: "Sao lưu tự động hoàn tất thành công.",
        act5Time: "1 ngày trước",
        act6Title: "Đăng nhập thất bại",
        act6Desc: "Nhiều lần đăng nhập thất bại từ IP 192.168.1.1",
        act6Time: "1 ngày trước",
    },
    en: {
        adminConsole: "Admin Console",
        dashboard: "Dashboard",
        management: "Management",
        orders: "Orders",
        aftersales: "Aftersales",
        products: "Products",
        reviews: "Reviews",
        categories: "Categories",
        brands: "Brands",
        posts: "News",
        postCategories: "News Categories",
        media: "Media",
        usersAccess: "Users & Access",
        users: "Users",
        roles: "Roles",
        system: "System",
        promotions: "Promotions",
        flashSale: "Flash Sale",
        vouchers: "Vouchers",
        analytics: "Analytics",
        settings: "Settings",
        superAdmin: "Super Admin",
        searchPlaceholder: "Search orders, customers...",
        newOrder: "New Order",
        viewStore: "View Store",
        home: "Home",
        totalRevenue: "Total Revenue",
        ordersCount: "Orders",
        activeUsers: "Active Users",
        lowStock: "Low Stock",
        vsLastMonth: "vs last month",
        revenueOverview: "Revenue Overview",
        monthlyEarnings: "Monthly earnings performance",
        last30Days: "Last 30 Days",
        last90Days: "Last 90 Days",
        thisYear: "This Year",
        export: "Export",
        recentOrders: "Recent Orders",
        viewAll: "View All",
        orderId: "Order ID",
        customer: "Customer",
        date: "Date",
        amount: "Amount",
        status: "Status",
        action: "Action",
        statusCompleted: "Completed",
        statusProcessing: "Processing",
        statusCancelled: "Cancelled",
        recentActivity: "Recent Activity",
        viewFullLog: "View Full Log",
        act1Title: "New Order #1234",
        act1Desc: "Sarah Smith placed a new order.",
        act1Time: "2 mins ago",
        act2Title: "Payment Pending",
        act2Desc: "Order #1230 is awaiting payment confirmation.",
        act2Time: "45 mins ago",
        act3Title: "Product Restocked",
        act3Desc: '"Wireless Headphones" stock updated (+50).',
        act3Time: "2 hrs ago",
        act4Title: "New User Review",
        act4Desc: 'Mike T. reviewed "Smart Watch".',
        act4Time: "5 hrs ago",
        act5Title: "System Update",
        act5Desc: "Automated backup completed successfully.",
        act5Time: "1 day ago",
        act6Title: "Login Attempt Failed",
        act6Desc: "Multiple failed attempts from IP 192.168.1.1",
        act6Time: "1 day ago",
    },
};

const ROLE_LABELS = {
    vi: {
        SUPER_ADMIN: "Quản trị tối cao",
        ADMIN: "Quản trị viên",
        PRODUCT_MANAGER: "Quản lý sản phẩm",
        ORDER_MANAGER: "Quản lý đơn hàng",
        INVENTORY: "Kho vận",
        CUSTOMER: "Khách hàng",
    },
    en: {
        SUPER_ADMIN: "SUPER_ADMIN",
        ADMIN: "ADMIN",
        PRODUCT_MANAGER: "Product Manager",
        ORDER_MANAGER: "Order Manager",
        INVENTORY: "Inventory",
        CUSTOMER: "Customer",
    },
};

const ADMIN_NOTIFICATION_STORAGE_PREFIX = "admin-notification-seen";
const ADMIN_NOTIFICATION_POLL_INTERVAL_MS = 60000;
const ADMIN_PAGES_WITHOUT_TOPBAR_ACTIONS = [
    "dashboard",
    "categories",
    "products",
    "reviews",
    "brands",
    "orders",
    "posts",
    "postCategories",
    "roles",
    "users",
    "coupons",
    "flashSale",
    "analytics",
    "settings",
    "activityLog",
];

const ADMIN_TOPBAR_I18N = {
    vi: {
        notifications: "Thông báo",
        loadingNotifications: "Đang tải thông báo...",
        emptyNotifications: "Chưa có thông báo mới.",
        markAllRead: "Đã xem tất cả",
        viewFullLog: "Xem toàn bộ nhật ký",
        quickHelp: "Trợ giúp nhanh",
        helpSubtitle: "Tóm tắt nhanh những gì bạn có thể làm ở trang hiện tại.",
        currentPage: "Trang hiện tại",
        shortcuts: "Phím tắt",
        shortcutHelp: "Mở trợ giúp",
        shortcutSearch: "Tập trung ô tìm kiếm",
        shortcutClose: "Đóng popup hiện tại",
        close: "Đóng",
        openPage: "Mở trang",
        activityOrders: "Đơn hàng mới",
        activityCoupon: "Voucher mới",
        activityInventory: "Sản phẩm sắp hết hàng",
        activityReview: "Đánh giá mới",
        activityAftersales: "Hậu mãi",
        activityAudit: "Cập nhật hệ thống",
        actionUserDelete: "xóa người dùng",
        actionUserUpdateRole: "cập nhật vai trò",
        actionUserUpdateStatus: "cập nhật trạng thái",
        actionGrantSuperAdmin: "cấp quyền quản trị tối cao",
        actionRevokeSuperAdmin: "thu hồi quản trị tối cao",
        actionDeleteSelf: "xóa tài khoản cá nhân",
        actionOrderUpdate: "cập nhật đơn hàng",
        actionOrderCreated: "tạo đơn hàng",
        actionOrderNote: "thêm ghi chú đơn hàng",
        actionOrderAftersales: "cập nhật hậu mãi",
        actionFlashSaleCreate: "tạo flash sale",
        actionFlashSaleClear: "kết thúc flash sale",
        actionPaymentCancelled: "hủy thanh toán",
        actionPaymentMomoResult: "cập nhật kết quả thanh toán",
        actionRefundRequested: "yêu cầu hoàn tiền",
        actionRefundApproved: "duyệt hoàn tiền",
        actionRefundRejected: "từ chối hoàn tiền",
        dashboardTitle: "Tổng quan",
        dashboardTips: [
            "Theo dõi doanh thu, đơn hàng, người dùng hoạt động và hàng sắp hết.",
            "Mở nhật ký hoạt động để xem chi tiết các biến động gần đây.",
        ],
        ordersTitle: "Đơn hàng",
        ordersTips: [
            "Lọc và cập nhật trạng thái đơn, thanh toán và tiến trình thanh toán.",
            "Duyệt hoặc từ chối yêu cầu hoàn tiền trực tiếp từ danh sách.",
        ],
        productsTitle: "Sản phẩm",
        productsTips: [
            "Quản lý giá, tồn kho, trạng thái hiển thị và thông tin sản phẩm.",
            "Theo dõi sản phẩm sắp hết hàng từ chuông thông báo.",
        ],
        reviewsTitle: "Đánh giá",
        reviewsTips: [
            "Lọc đánh giá theo sản phẩm, thương hiệu và danh mục.",
            "Ẩn, hiện hoặc xử lý nhiều đánh giá cùng lúc.",
        ],
        couponsTitle: "Voucher",
        couponsTips: [
            "Tạo voucher, giới hạn lượt dùng và theo dõi khách đã nhận.",
            "Theo dõi trạng thái hoạt động và số lượng còn lại ngay trong danh sách.",
        ],
        flashSaleTitle: "Flash Sale",
        flashSaleTips: [
            "Thiết lập thời gian chạy và xem lịch sử từng đợt Flash Sale.",
            "Theo dõi ai đã tạo đợt sale gần nhất và thời gian kết thúc.",
        ],
        rolesTitle: "Phân quyền",
        rolesTips: [
            "Bật hoặc tắt quyền theo nhóm chức năng cho từng vai trò.",
            "Dùng ô tìm kiếm để lọc nhanh quyền khi danh sách lớn.",
        ],
        defaultTitle: "Quản trị",
        defaultTips: [
            "Dùng menu trái để chuyển nhanh giữa các khu vực quản lý.",
            "Mở chuông để xem đơn mới, tồn kho thấp, voucher và đánh giá mới.",
        ],
    },
    en: {
        notifications: "Notifications",
        loadingNotifications: "Loading notifications...",
        emptyNotifications: "No new notifications.",
        markAllRead: "Mark all as read",
        viewFullLog: "View full log",
        quickHelp: "Quick help",
        helpSubtitle: "A short summary of what you can do on the current page.",
        currentPage: "Current page",
        shortcuts: "Shortcuts",
        shortcutHelp: "Open help",
        shortcutSearch: "Focus search",
        shortcutClose: "Close current popup",
        close: "Close",
        openPage: "Open page",
        activityOrders: "New order",
        activityCoupon: "New voucher",
        activityInventory: "Low stock",
        activityReview: "New review",
        activityAftersales: "Aftersales",
        activityAudit: "System update",
        actionUserDelete: "deleted user",
        actionUserUpdateRole: "updated role",
        actionUserUpdateStatus: "updated status",
        actionGrantSuperAdmin: "granted super admin",
        actionRevokeSuperAdmin: "revoked super admin",
        actionDeleteSelf: "deleted own account",
        actionOrderUpdate: "updated order",
        actionOrderCreated: "created order",
        actionOrderNote: "added order note",
        actionOrderAftersales: "updated aftersales",
        actionFlashSaleCreate: "created flash sale",
        actionFlashSaleClear: "cleared flash sale",
        actionPaymentCancelled: "cancelled payment",
        actionPaymentMomoResult: "updated payment result",
        actionRefundRequested: "requested refund",
        actionRefundApproved: "approved refund",
        actionRefundRejected: "rejected refund",
        dashboardTitle: "Dashboard",
        dashboardTips: [
            "Track revenue, orders, active users, and low-stock products.",
            "Open the activity log to inspect recent operational changes.",
        ],
        ordersTitle: "Orders",
        ordersTips: [
            "Filter and update order, payment, and checkout statuses.",
            "Approve or reject refund requests directly from the list.",
        ],
        productsTitle: "Products",
        productsTips: [
            "Manage pricing, stock, visibility, and product details.",
            "Use notifications to spot low-stock products quickly.",
        ],
        reviewsTitle: "Reviews",
        reviewsTips: [
            "Filter reviews by product, brand, and category.",
            "Moderate reviews individually or in bulk.",
        ],
        couponsTitle: "Vouchers",
        couponsTips: [
            "Create vouchers, control usage limits, and track claimed users.",
            "Monitor status and remaining quantity directly in the list.",
        ],
        flashSaleTitle: "Flash Sale",
        flashSaleTips: [
            "Set the active period and review flash sale history.",
            "Track who created the latest campaign and when it ends.",
        ],
        rolesTitle: "Roles",
        rolesTips: [
            "Enable or disable permissions by feature group for each role.",
            "Use search to quickly filter permissions in large lists.",
        ],
        defaultTitle: "Administration",
        defaultTips: [
            "Use the left sidebar to move quickly across admin areas.",
            "Open notifications to see new orders, low stock, vouchers, and reviews.",
        ],
    },
};

const ADMIN_ACTIVITY_TONE_CLASS = {
    primary: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-violet-50 text-violet-700 border-violet-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
};

const getAdminNotificationStorageKey = (user) =>
    `${ADMIN_NOTIFICATION_STORAGE_PREFIX}:${user?._id || user?.email || "guest"}`;

const readSeenAdminNotificationIds = (user) => {
    if (!user?._id && !user?.email) return [];
    try {
        const raw = localStorage.getItem(getAdminNotificationStorageKey(user));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeSeenAdminNotificationIds = (user, ids) => {
    if (!user?._id && !user?.email) return;
    try {
        localStorage.setItem(getAdminNotificationStorageKey(user), JSON.stringify(ids));
    } catch {
        void 0;
    }
};

const formatAdminRelativeTime = (value, lang) => {
    if (!value) return "";
    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

    if (diffMinutes < 1) return lang === "vi" ? "Vừa xong" : "Just now";
    if (diffMinutes < 60) return lang === "vi" ? `${diffMinutes} phút trước` : `${diffMinutes} mins ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return lang === "vi" ? `${diffHours} giờ trước` : `${diffHours} hrs ago`;

    const diffDays = Math.round(diffHours / 24);
    return lang === "vi" ? `${diffDays} ngày trước` : `${diffDays} days ago`;
};

const getAuditActionLabel = (action, ui) => {
    const mapping = {
        "user.delete": ui.actionUserDelete,
        "user.updateRole": ui.actionUserUpdateRole,
        "user.updateStatus": ui.actionUserUpdateStatus,
        "user.grantSuperAdmin": ui.actionGrantSuperAdmin,
        "user.revokeSuperAdmin": ui.actionRevokeSuperAdmin,
        "user.deleteSelf": ui.actionDeleteSelf,
        "order.update": ui.actionOrderUpdate,
        "order.updated": ui.actionOrderUpdate,
        "order.created": ui.actionOrderCreated,
        "order.note": ui.actionOrderNote,
        "order.note_added": ui.actionOrderNote,
        "order.aftersales": ui.actionOrderAftersales,
        "flashSale.create": ui.actionFlashSaleCreate,
        "flashSale.clear": ui.actionFlashSaleClear,
        "payment.cancelled": ui.actionPaymentCancelled,
        "payment.momo_result": ui.actionPaymentMomoResult,
        "refund.requested": ui.actionRefundRequested,
        "refund.approved": ui.actionRefundApproved,
        "refund.rejected": ui.actionRefundRejected,
    };

    return mapping[action] || action || ui.activityAudit;
};

const describeAdminActivity = (activity, ui, lang) => {
    switch (activity?.kind) {
        case "order_created":
            return {
                title: ui.activityOrders,
                description: activity?.customerName
                    ? `${activity.orderNumber} • ${activity.customerName}`
                    : activity?.orderNumber || ui.activityOrders,
            };
        case "coupon_created":
            return {
                title: ui.activityCoupon,
                description: activity?.couponName || activity?.couponCode || ui.activityCoupon,
            };
        case "low_stock":
            return {
                title: ui.activityInventory,
                description: lang === "vi"
                    ? `${activity?.productName || "-"} • còn ${activity?.stock ?? 0}`
                    : `${activity?.productName || "-"} • ${activity?.stock ?? 0} left`,
            };
        case "review_created":
            return {
                title: ui.activityReview,
                description: activity?.productName
                    ? `${activity?.reviewerName || "-"} • ${activity.productName}`
                    : ui.activityReview,
            };
        case "aftersales": {
            const typeLabel = getAftersalesRequestTypeLabel(activity?.aftersalesType, lang);
            const statusLabel = getAftersalesRequestStatusLabel(activity?.aftersalesStatus, lang);
            const orderLabel = activity?.orderNumber ? `${activity.orderNumber} • ` : "";
            return {
                title: ui.activityAftersales,
                description: `${orderLabel}${typeLabel} • ${statusLabel}`,
            };
        }
        case "audit":
        default:
            return {
                title: ui.activityAudit,
                description: `${activity?.actorName || "-"} ${getAuditActionLabel(activity?.action, ui)}`,
            };
    }
};

const getAdminHelpContent = (activePage, t, ui) => {
    const contentMap = {
        dashboard: { title: ui.dashboardTitle || t.dashboard, tips: ui.dashboardTips },
        orders: { title: ui.ordersTitle || t.orders, tips: ui.ordersTips },
        products: { title: ui.productsTitle || t.products, tips: ui.productsTips },
        reviews: { title: ui.reviewsTitle || t.reviews, tips: ui.reviewsTips },
        coupons: { title: ui.couponsTitle || t.vouchers, tips: ui.couponsTips },
        flashSale: { title: ui.flashSaleTitle || t.flashSale, tips: ui.flashSaleTips },
        roles: { title: ui.rolesTitle || t.roles, tips: ui.rolesTips },
    };
    return contentMap[activePage] || { title: ui.defaultTitle, tips: ui.defaultTips };
};

function AdminPageLoader({ lang }) {
    return (
        <div className="p-5 lg:p-8">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm w-fit">
                <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                <span className="text-sm font-semibold text-slate-700">{lang === "vi" ? "Dang tai..." : "Loading..."}</span>
            </div>
        </div>
    );
}

function LangToggle({ lang, setLang }) {
    return (
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
            <div className="flex bg-slate-100 p-1 rounded-full">
                <button
                    onClick={() => setLang("vi")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "vi" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />VI
                </button>
                <button
                    onClick={() => setLang("en")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />EN
                </button>
            </div>
        </div>
    );
}

function Sidebar({
    mobile = false,
    t,
    navItems,
    activePage,
    onNavigateHome,
    onSelectPage,
    onClose,
    currentUser,
    roleLabels,
    onLogout,
    apiOrigin,
}) {
    const userName = currentUser?.name || "—";
    const userRole = currentUser?.role || "";
    const userRoleLabel = roleLabels?.[userRole] || userRole || "—";
    const avatarUrl = currentUser?.avatar || "";
    const resolvedAvatarUrl = useMemo(() => {
        const raw = String(avatarUrl || "").trim();
        if (!raw) return "";
        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith("/")) return `${apiOrigin}${raw}`;
        return `${apiOrigin}/${raw}`;
    }, [apiOrigin, avatarUrl]);
    const [failedAvatars, setFailedAvatars] = useState({});
    const avatarFailed = resolvedAvatarUrl ? Boolean(failedAvatars[resolvedAvatarUrl]) : false;
    const initials = String(userName || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s.charAt(0).toUpperCase())
        .join("");

    return (
        <div className={`${mobile ? "flex" : "hidden lg:flex"} flex-col w-64 bg-white border-r border-slate-200 h-full flex-shrink-0`}>
            <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 flex-shrink-0">
                <button onClick={onNavigateHome} className="flex items-center gap-2.5 group">
                    <div className="bg-primary p-1.5 rounded-lg text-white group-hover:bg-blue-700 transition-colors">
                        <span className="material-symbols-outlined text-xl">bolt</span>
                    </div>
                    <div className="flex flex-col leading-none text-left">
                        <span className="text-base font-black text-slate-900">TechStore</span>
                        <span className="text-xs text-slate-400 font-medium mt-0.5">{t.adminConsole}</span>
                    </div>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-0.5 mt-2">
                {navItems.map((item, index) => {
                    const prevGroup = navItems[index - 1]?.group;
                    const showGroup = item.group && item.group !== prevGroup;
                    return (
                        <div key={item.id}>
                            {showGroup && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-5 pb-1.5">{item.group}</p>
                            )}
                            <button
                                onClick={() => { onSelectPage(item.id); onClose(); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activePage === item.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                {item.label}
                            </button>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3 w-full p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="size-9 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                        {resolvedAvatarUrl && !avatarFailed ? (
                            <img
                                src={resolvedAvatarUrl}
                                alt="avatar"
                                className="w-full h-full object-cover"
                                onError={() => {
                                    setFailedAvatars((prev) => ({ ...prev, [resolvedAvatarUrl]: true }));
                                }}
                            />
                        ) : (
                            <div className="text-xs font-bold text-slate-500">{initials}</div>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
                        <p className="text-xs text-slate-400 truncate">{userRoleLabel}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="mt-3 w-full px-3 py-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-semibold transition-colors"
                    type="button"
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

export default function AdminDashboard({ lang, setLang, onNavigateHome, children }) {
    const t = T[lang];
    const topbarText = ADMIN_TOPBAR_I18N[lang] || ADMIN_TOPBAR_I18N.vi;
    const navigate = useNavigate();
    const location = useLocation();
    const activePage = useMemo(() => getAdminPageFromPathname(location.pathname), [location.pathname]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const roleLabels = ROLE_LABELS[lang] || ROLE_LABELS.vi;
    const showTopbarSearchActions = !ADMIN_PAGES_WITHOUT_TOPBAR_ACTIONS.includes(activePage || "dashboard");

    const readUser = useMemo(() => () => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);
    const [currentUser, setCurrentUser] = useState(() => readUser());
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [seenNotificationIds, setSeenNotificationIds] = useState(() => readSeenAdminNotificationIds(readUser()));
    const searchInputRef = useRef(null);
    const notificationsRef = useRef(null);
    const helpModalRef = useRef(null);
    const accessiblePages = useMemo(() => getAccessibleAdminPages(currentUser), [currentUser]);
    const defaultAdminPage = useMemo(() => getDefaultAdminPage(currentUser) || "dashboard", [currentUser]);
    const loadAdminNotifications = useCallback(async () => {
        if (!currentUser?._id && !currentUser?.email) {
            setAdminNotifications([]);
            return;
        }

        setNotificationLoading(true);
        try {
            const response = await getDashboardActivity({ page: 1, limit: 8, type: "all" });
            setAdminNotifications(Array.isArray(response?.data) ? response.data : []);
        } catch {
            setAdminNotifications([]);
        } finally {
            setNotificationLoading(false);
        }
    }, [currentUser?._id, currentUser?.email]);

    useEffect(() => {
        const legacyRequestedPage = new URLSearchParams(location.search).get("page");
        if (legacyRequestedPage && ADMIN_PAGE_IDS.includes(legacyRequestedPage)) {
            const redirectedPage = canAccessAdminPage(currentUser, legacyRequestedPage)
                ? legacyRequestedPage
                : defaultAdminPage;
            navigate(getAdminPagePath(redirectedPage), { replace: true });
            return;
        }

        if (legacyRequestedPage || activePage === null) {
            navigate(getAdminPagePath(defaultAdminPage), { replace: true });
        }
    }, [activePage, currentUser, defaultAdminPage, location.search, navigate]);

    const setActivePage = (nextPage, options = {}) => {
        const requestedPage = ADMIN_PAGE_IDS.includes(nextPage) ? nextPage : defaultAdminPage;
        const resolvedPage = canAccessAdminPage(currentUser, requestedPage) ? requestedPage : defaultAdminPage;
        navigate(getAdminPagePath(resolvedPage), { replace: options.replace ?? false });
    };

    useEffect(() => {
        const onUserUpdated = () => setCurrentUser(readUser());
        window.addEventListener("user:updated", onUserUpdated);
        window.addEventListener("storage", onUserUpdated);
        return () => {
            window.removeEventListener("user:updated", onUserUpdated);
            window.removeEventListener("storage", onUserUpdated);
        };
    }, [readUser]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (currentUser?.avatar) return;
            try {
                const { getMyProfile } = await import("./services/userApi");
                const res = await getMyProfile();
                const data = res?.data || {};
                const avatar = data.avatar ? String(data.avatar).trim() : "";
                if (!mounted || !avatar) return;
                const nextUser = { ...readUser(), avatar };
                if (data.name) nextUser.name = data.name;
                if (data.email) nextUser.email = data.email;
                try {
                    localStorage.setItem("user", JSON.stringify(nextUser));
                    window.dispatchEvent(new Event("user:updated"));
                } catch {
                    void 0;
                }
                setCurrentUser(nextUser);
            } catch {
                void 0;
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [currentUser?.avatar, readUser]);

    useEffect(() => {
        setSeenNotificationIds(readSeenAdminNotificationIds(currentUser));
    }, [currentUser]);

    useEffect(() => {
        let mounted = true;
        const safeLoad = async () => {
            if (!mounted) return;
            await loadAdminNotifications();
        };

        void safeLoad();
        const timer = window.setInterval(() => {
            void safeLoad();
        }, ADMIN_NOTIFICATION_POLL_INTERVAL_MS);

        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, [loadAdminNotifications]);

    useEffect(() => {
        if (!currentUser?._id && !currentUser?.email) return undefined;

        let timerId = null;
        const queueRefresh = () => {
            if (timerId) window.clearTimeout(timerId);
            timerId = window.setTimeout(() => {
                void loadAdminNotifications();
            }, 250);
        };

        const unsubscribe = subscribeRealtime((payload) => {
            const type = String(payload?.type || "");
            if (
                type.startsWith("order.")
                || type.startsWith("coupon.")
                || type.startsWith("flashsale.")
                || type.startsWith("review.")
                || type.startsWith("system.")
            ) {
                queueRefresh();
            }
        });

        return () => {
            if (timerId) window.clearTimeout(timerId);
            unsubscribe();
        };
    }, [currentUser?._id, currentUser?.email, loadAdminNotifications]);

    useEffect(() => {
        const handlePointerDown = (event) => {
            const target = event.target;
            if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
                setNotificationsOpen(false);
            }
            if (helpOpen && helpModalRef.current && !helpModalRef.current.contains(target)) {
                setHelpOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [helpOpen, notificationsOpen]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setNotificationsOpen(false);
                setHelpOpen(false);
                return;
            }

            const target = event.target;
            const isTypingTarget =
                target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target?.isContentEditable;

            if (!isTypingTarget && event.key === "?") {
                event.preventDefault();
                setHelpOpen(true);
            }

            if (!isTypingTarget && event.key === "/" && showTopbarSearchActions && searchInputRef.current) {
                event.preventDefault();
                searchInputRef.current.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showTopbarSearchActions]);

    const mappedNotifications = useMemo(
        () => adminNotifications.map((activity) => {
            const content = describeAdminActivity(activity, topbarText, lang);
            return {
                id: activity?.id || `${activity?.kind || "activity"}:${activity?.createdAt || "0"}:${activity?.targetPage || "activityLog"}`,
                title: content.title,
                description: content.description,
                meta: formatAdminRelativeTime(activity?.createdAt, lang),
                targetPage: activity?.targetPage || "activityLog",
                toneClass: ADMIN_ACTIVITY_TONE_CLASS[activity?.tone] || ADMIN_ACTIVITY_TONE_CLASS.slate,
            };
        }),
        [adminNotifications, lang, topbarText]
    );

    const unreadNotificationCount = useMemo(
        () => mappedNotifications.filter((item) => !seenNotificationIds.includes(item.id)).length,
        [mappedNotifications, seenNotificationIds]
    );

    const quickHelp = useMemo(
        () => getAdminHelpContent(activePage, t, topbarText),
        [activePage, t, topbarText]
    );

    const markNotificationAsSeen = (id) => {
        if (!id || seenNotificationIds.includes(id)) return;
        const next = [...seenNotificationIds, id];
        setSeenNotificationIds(next);
        writeSeenAdminNotificationIds(currentUser, next);
    };

    const handleMarkAllNotificationsRead = () => {
        const ids = mappedNotifications.map((item) => item.id);
        setSeenNotificationIds(ids);
        writeSeenAdminNotificationIds(currentUser, ids);
    };

    const handleOpenNotification = (item) => {
        if (!item) return;
        markNotificationAsSeen(item.id);
        setNotificationsOpen(false);
        setActivePage(item.targetPage || "activityLog");
    };

    const handleLogout = () => {
        try {
            clearStoredAuth();
        } catch {
            void 0;
        }
        try {
            window.dispatchEvent(new Event("user:updated"));
            window.dispatchEvent(new Event("cart:updated"));
            window.dispatchEvent(new Event("wishlist:updated"));
        } catch {
            void 0;
        }
        onNavigateHome();
    };

    const navItems = [
        { id: "dashboard", icon: "dashboard", label: t.dashboard, group: null },
        // Quản lý
        { id: "categories", icon: "category", label: t.categories, group: t.management },
        { id: "brands", icon: "verified", label: t.brands, group: t.management },
        { id: "products", icon: "inventory_2", label: t.products, group: t.management },
        { id: "reviews", icon: "reviews", label: t.reviews, group: t.management },
        { id: "orders", icon: "shopping_cart", label: t.orders, group: t.management },
        { id: "aftersales", icon: "assignment_return", label: t.aftersales, group: t.management },
        // Truyền thông
        { id: "postCategories", icon: "topic", label: t.postCategories, group: t.media },
        { id: "posts", icon: "article", label: (t.posts === "Tin bài" ? "Tin tức" : t.posts), group: t.media },
        // Khác
        { id: "roles", icon: "verified_user", label: t.roles, group: t.usersAccess },
        { id: "users", icon: "group", label: t.users, group: null },
        { id: "coupons", icon: "sell", label: t.vouchers, group: t.promotions },
        { id: "flashSale", icon: "local_fire_department", label: t.flashSale, group: t.promotions },
        { id: "analytics", icon: "bar_chart", label: t.analytics, group: t.system },
        { id: "settings", icon: "settings", label: t.settings, group: t.system },
    ].filter((item) => accessiblePages.includes(item.id));

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-display antialiased">

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/40" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-50 flex flex-col w-64 h-full">
                        <Sidebar
                            mobile
                            t={t}
                            navItems={navItems}
                            activePage={activePage}
                            onNavigateHome={onNavigateHome}
                            onSelectPage={setActivePage}
                            onClose={() => setSidebarOpen(false)}
                            currentUser={currentUser}
                            roleLabels={roleLabels}
                            onLogout={handleLogout}
                            apiOrigin={API_ORIGIN}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <Sidebar
                t={t}
                navItems={navItems}
                activePage={activePage}
                onNavigateHome={onNavigateHome}
                onSelectPage={setActivePage}
                onClose={() => setSidebarOpen(false)}
                currentUser={currentUser}
                roleLabels={roleLabels}
                onLogout={handleLogout}
                apiOrigin={API_ORIGIN}
            />

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-5 lg:px-6 bg-white border-b border-slate-200 flex-shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-primary">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        {showTopbarSearchActions && (
                            <div className="hidden sm:flex relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors material-symbols-outlined text-[20px]">search</span>
                                <input
                                    ref={searchInputRef}
                                    className="w-64 pl-10 pr-4 py-2 text-sm bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:text-slate-400 text-slate-900 outline-none"
                                    placeholder={t.searchPlaceholder}
                                    type="text"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <LangToggle lang={lang} setLang={setLang} />
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div ref={notificationsRef} className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setNotificationsOpen((prev) => !prev);
                                    setHelpOpen(false);
                                }}
                                className={`relative p-2 rounded-lg transition-colors ${notificationsOpen ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}
                            >
                                <span className="material-symbols-outlined">notifications</span>
                                {unreadNotificationCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                                        {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-30">
                                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{topbarText.notifications}</p>
                                            <p className="text-xs text-slate-400">
                                                {mappedNotifications.length === 0
                                                    ? topbarText.emptyNotifications
                                                    : unreadNotificationCount > 0
                                                        ? `${unreadNotificationCount} ${String(topbarText.new || (lang === "vi" ? "mới" : "new")).toLowerCase()}`
                                                        : topbarText.markAllRead}
                                            </p>
                                        </div>
                                        {mappedNotifications.length > 0 && unreadNotificationCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleMarkAllNotificationsRead}
                                                className="text-xs font-bold text-primary transition-colors hover:text-blue-700"
                                            >
                                                {topbarText.markAllRead}
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[420px] overflow-y-auto">
                                        {notificationLoading ? (
                                            <div className="px-4 py-8 text-center text-sm text-slate-500">{topbarText.loadingNotifications}</div>
                                        ) : mappedNotifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-sm text-slate-500">{topbarText.emptyNotifications}</div>
                                        ) : (
                                            mappedNotifications.map((item) => {
                                                const unread = !seenNotificationIds.includes(item.id);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => handleOpenNotification(item)}
                                                        className="w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-0.5 flex size-10 items-center justify-center rounded-2xl border ${item.toneClass}`}>
                                                                <span className="material-symbols-outlined text-[18px]">notifications</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                                                    {unread && (
                                                                        <span className="mt-1 inline-flex size-2 rounded-full bg-red-500" />
                                                                    )}
                                                                </div>
                                                                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                                                                <div className="mt-2 flex items-center justify-between gap-3">
                                                                    <span className="text-xs text-slate-400">{item.meta}</span>
                                                                    <span className="text-xs font-bold text-primary">{topbarText.openPage}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 p-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleMarkAllNotificationsRead();
                                                setNotificationsOpen(false);
                                                setActivePage("activityLog");
                                            }}
                                            className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                                        >
                                            {topbarText.viewFullLog}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setHelpOpen(true);
                                setNotificationsOpen(false);
                            }}
                            className={`hidden sm:block p-2 rounded-lg transition-colors ${helpOpen ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}
                        >
                            <span className="material-symbols-outlined">help</span>
                        </button>
                        <button
                            onClick={onNavigateHome}
                            className="hidden sm:flex items-center gap-2 border border-slate-200 hover:border-primary text-slate-700 hover:text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">storefront</span>
                            {t.viewStore}
                        </button>
                        {showTopbarSearchActions && (
                            <>
                                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                                <button onClick={() => setActivePage("orders")} className="hidden sm:flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-primary/20">
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    {t.newOrder}
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {/* Scrollable content */}
                <div className="flex-1 overflow-auto">
                    <Suspense fallback={<AdminPageLoader lang={lang} />}>{children}</Suspense>
                </div>
            </main>

            {helpOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
                    <div
                        ref={helpModalRef}
                        className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{topbarText.quickHelp}</p>
                                <h3 className="mt-2 text-2xl font-black text-slate-900">{quickHelp.title}</h3>
                                <p className="mt-2 text-sm text-slate-500">{topbarText.helpSubtitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHelpOpen(false)}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.15fr_0.85fr]">
                            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{topbarText.currentPage}</p>
                                <h4 className="mt-3 text-lg font-black text-slate-900">{quickHelp.title}</h4>
                                <div className="mt-4 space-y-3">
                                    {(quickHelp.tips || []).map((tip) => (
                                        <div key={tip} className="flex gap-3 rounded-2xl bg-white px-4 py-3">
                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                            <p className="text-sm text-slate-700">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="rounded-3xl border border-slate-200 p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{topbarText.shortcuts}</p>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                            <span>{topbarText.shortcutHelp}</span>
                                            <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">?</kbd>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                            <span>{topbarText.shortcutClose}</span>
                                            <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">Esc</kbd>
                                        </div>
                                        {showTopbarSearchActions && (
                                            <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                                <span>{topbarText.shortcutSearch}</span>
                                                <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">/</kbd>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{topbarText.notifications}</p>
                                    <p className="mt-3 text-sm text-slate-600">
                                        {lang === "vi"
                                            ? "Mở icon chuông để xem đơn mới, voucher mới, tồn kho thấp và đánh giá mới."
                                            : "Open the bell icon to review new orders, new vouchers, low stock, and fresh reviews."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHelpOpen(false);
                                            setNotificationsOpen(true);
                                        }}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                                        {topbarText.notifications}
                                    </button>
                                </div>
                            </section>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setHelpOpen(false)}
                                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                {topbarText.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
