import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import { getDashboardActivity } from "../../services/dashboardApi";
import { formatDateTime, getAftersalesRequestStatusLabel, getAftersalesRequestTypeLabel, getPaymentStatusLabel } from "../../utils/orderHelpers";

const T = {
    vi: {
        home: "Trang chủ",
        dashboard: "Tổng quan",
        title: "Nhật ký hoạt động",
        subtitle: "Theo dõi đầy đủ các hoạt động gần đây từ đơn hàng, voucher, kho và quản trị người dùng.",
        refresh: "Làm mới",
        allTypes: "Tất cả loại",
        audit: "Quản trị người dùng",
        orders: "Đơn hàng",
        coupons: "Voucher",
        inventory: "Kho hàng",
        aftersales: "Hậu mãi",
        openRelated: "Mở liên quan",
        loading: "Đang tải nhật ký hoạt động...",
        loadError: "Không thể tải nhật ký hoạt động",
        empty: "Chưa có hoạt động nào",
        showing: "Hiển thị",
        to: "đến",
        of: "trên",
        results: "hoạt động",
        previous: "Trước",
        next: "Sau",
        all: "Tất cả",
        justNow: "Vừa xong",
        minAgo: "phút trước",
        hourAgo: "giờ trước",
        dayAgo: "ngày trước",
        auditLog: "Cập nhật hệ thống",
        orderCreated: "Đơn hàng mới",
        couponCreated: "Voucher mới",
        lowStock: "Sắp hết hàng",
        unknownCustomer: "Khách vãng lai",
        stockRemaining: "Còn",
        units: "sản phẩm",
        by: "bởi",
        actionUserDelete: "Xóa người dùng",
        actionUserUpdateRole: "Cập nhật vai trò",
        actionUserUpdateStatus: "Cập nhật trạng thái",
        actionGrantSuperAdmin: "Cấp quyền quản trị tối cao",
        actionRevokeSuperAdmin: "Thu hồi quản trị tối cao",
        actionDeleteSelf: "Xóa tài khoản cá nhân",
        actionOrderUpdate: "Cập nhật đơn hàng",
        actionOrderCreated: "Tạo đơn hàng",
        actionOrderNote: "Thêm ghi chú đơn hàng",
        actionOrderAftersales: "Cập nhật hậu mãi",
        actionFlashSaleCreate: "Tạo flash sale",
        actionFlashSaleClear: "Kết thúc flash sale",
        actionPaymentCancelled: "Hủy thanh toán",
        actionPaymentMomoResult: "Cập nhật kết quả thanh toán",
        actionRefundRequested: "Yêu cầu hoàn tiền",
        actionRefundApproved: "Duyệt hoàn tiền",
        actionRefundRejected: "Từ chối hoàn tiền",
    },
    en: {
        home: "Home",
        dashboard: "Dashboard",
        title: "Activity Log",
        subtitle: "Review recent activity across orders, vouchers, inventory, and user administration.",
        refresh: "Refresh",
        allTypes: "All types",
        audit: "User administration",
        orders: "Orders",
        coupons: "Vouchers",
        inventory: "Inventory",
        aftersales: "Aftersales",
        openRelated: "Open related",
        loading: "Loading activity log...",
        loadError: "Failed to load activity log",
        empty: "No activity yet",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "activities",
        previous: "Previous",
        next: "Next",
        all: "All",
        justNow: "Just now",
        minAgo: "mins ago",
        hourAgo: "hrs ago",
        dayAgo: "days ago",
        auditLog: "System update",
        orderCreated: "New order",
        couponCreated: "New voucher",
        lowStock: "Low stock",
        unknownCustomer: "Guest customer",
        stockRemaining: "Remaining",
        units: "items",
        by: "by",
        actionUserDelete: "Delete user",
        actionUserUpdateRole: "Update role",
        actionUserUpdateStatus: "Update status",
        actionGrantSuperAdmin: "Grant super admin",
        actionRevokeSuperAdmin: "Revoke super admin",
        actionDeleteSelf: "Delete own account",
        actionOrderUpdate: "Update order",
        actionOrderCreated: "Create order",
        actionOrderNote: "Add order note",
        actionOrderAftersales: "Update aftersales",
        actionFlashSaleCreate: "Create flash sale",
        actionFlashSaleClear: "Clear flash sale",
        actionPaymentCancelled: "Cancel payment",
        actionPaymentMomoResult: "Update payment result",
        actionRefundRequested: "Request refund",
        actionRefundApproved: "Approve refund",
        actionRefundRejected: "Reject refund",
    },
};

const ACTIVITY_TEXT = {
    vi: {
        ...T.vi,
        subtitle: "Theo dõi đầy đủ các hoạt động gần đây từ đơn hàng, voucher, kho, đánh giá và quản trị người dùng.",
        reviews: "Đánh giá",
        aftersales: "Hậu mãi",
        aftersalesTitle: "Yêu cầu hậu mãi",
        reviewCreated: "Đánh giá mới",
        verifiedPurchase: "Đã mua hàng",
        rated: "đã đánh giá",
    },
    en: {
        ...T.en,
        subtitle: "Review recent activity across orders, vouchers, inventory, reviews, and user administration.",
        reviews: "Reviews",
        aftersales: "Aftersales",
        aftersalesTitle: "Aftersales request",
        reviewCreated: "New review",
        verifiedPurchase: "Verified purchase",
        rated: "rated",
    },
};

const TYPE_OPTIONS = ["all", "audit", "orders", "coupons", "inventory", "reviews", "aftersales"];

const TYPE_META = {
    audit: "bg-slate-100 text-slate-700",
    orders: "bg-blue-100 text-blue-700",
    coupons: "bg-violet-100 text-violet-700",
    inventory: "bg-amber-100 text-amber-700",
    reviews: "bg-fuchsia-100 text-fuchsia-700",
    aftersales: "bg-orange-100 text-orange-700",
};

const TARGET_PAGE_LABEL = {
    audit: "users",
    orders: "orders",
    coupons: "coupons",
    inventory: "products",
    reviews: "reviews",
    aftersales: "aftersales",
};

function formatRelativeTime(value, t) {
    if (!value) return "";

    const diffMs = Date.now() - new Date(value).getTime();
    const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

    if (diffMinutes < 1) return t.justNow;
    if (diffMinutes < 60) return `${diffMinutes} ${t.minAgo}`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ${t.hourAgo}`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ${t.dayAgo}`;
}

function getAuditActionLabel(action, t) {
    const mapping = {
        "user.delete": t.actionUserDelete,
        "user.updateRole": t.actionUserUpdateRole,
        "user.updateStatus": t.actionUserUpdateStatus,
        "user.grantSuperAdmin": t.actionGrantSuperAdmin,
        "user.revokeSuperAdmin": t.actionRevokeSuperAdmin,
        "user.deleteSelf": t.actionDeleteSelf,
        "order.update": t.actionOrderUpdate,
        "order.updated": t.actionOrderUpdate,
        "order.created": t.actionOrderCreated,
        "order.note": t.actionOrderNote,
        "order.note_added": t.actionOrderNote,
        "order.aftersales": t.actionOrderAftersales,
        "flashSale.create": t.actionFlashSaleCreate,
        "flashSale.clear": t.actionFlashSaleClear,
        "payment.cancelled": t.actionPaymentCancelled,
        "payment.momo_result": t.actionPaymentMomoResult,
        "refund.requested": t.actionRefundRequested,
        "refund.approved": t.actionRefundApproved,
        "refund.rejected": t.actionRefundRejected,
    };

    return mapping[action] || action || "audit";
}

function describeActivity(activity, lang, t) {
    if (activity.kind === "order_created") {
        const customerName = activity.customerName || t.unknownCustomer;
        const paymentStatus = activity.paymentStatus
            ? ` · ${getPaymentStatusLabel(activity.paymentStatus, lang)}`
            : "";
        return {
            category: t.orders,
            title: `${t.orderCreated} ${activity.orderNumber || ""}`.trim(),
            description: `${customerName}${paymentStatus}`,
        };
    }

    if (activity.kind === "coupon_created") {
        return {
            category: t.coupons,
            title: `${t.couponCreated} ${activity.couponCode || ""}`.trim(),
            description: activity.couponName || "-",
        };
    }

    if (activity.kind === "low_stock") {
        return {
            category: t.inventory,
            title: `${t.lowStock}: ${activity.productName || "-"}`,
            description: `${t.stockRemaining} ${activity.stock || 0} ${t.units}`,
        };
    }

    if (activity.kind === "review_created") {
        const reviewer = activity.reviewerName || t.unknownCustomer;
        const productName = activity.productName || "-";
        const verifiedBadge = activity.isVerifiedPurchase ? ` · ${t.verifiedPurchase}` : "";
        return {
            category: t.reviews,
            title: `${t.reviewCreated} ${activity.rating || 0}/5`,
            description: `${reviewer} ${t.rated} ${productName}${verifiedBadge}`,
        };
    }

    if (activity.kind === "aftersales") {
        const customerName = activity.customerName || t.unknownCustomer;
        const typeLabel = getAftersalesRequestTypeLabel(activity.aftersalesType, lang);
        const statusLabel = getAftersalesRequestStatusLabel(activity.aftersalesStatus, lang);
        return {
            category: t.aftersales,
            title: `${t.aftersalesTitle} ${activity.orderNumber || ""}`.trim(),
            description: `${customerName} · ${typeLabel} · ${statusLabel}`,
        };
    }

    const actorName = activity.actorName || "-";
    const targetName = activity.targetName ? ` · ${activity.targetName}` : "";
    const actionLabel = getAuditActionLabel(activity.action, t);

    return {
        category: t.audit,
        title: actionLabel,
        description: `${actorName} ${actionLabel}${targetName}`,
    };
}

export default function ActivityLogPage({ lang, onNavigateHome, onSelectPage }) {
    const t = ACTIVITY_TEXT[lang] || ACTIVITY_TEXT.vi;
    const [type, setType] = useState("all");
    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0, limit: 12 });
    const [loading, setLoading] = useState(false);

    const loadActivity = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDashboardActivity({ page, limit: 12, type });
            setData(response?.data || []);
            setPagination(response?.pagination || { page: 1, totalPages: 0, total: 0, limit: 12 });
        } catch (error) {
            setData([]);
            setPagination({ page: 1, totalPages: 0, total: 0, limit: 12 });
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [page, t.loadError, type]);

    useEffect(() => {
        void loadActivity();
    }, [loadActivity]);

    useEffect(() => {
        setPage(1);
    }, [type]);

    const renderedItems = useMemo(
        () =>
            data.map((activity) => ({
                ...activity,
                content: describeActivity(activity, lang, t),
            })),
        [data, lang, t]
    );

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button type="button" onClick={onNavigateHome} className="transition-colors hover:text-primary">
                    {t.home}
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <button type="button" onClick={() => onSelectPage("dashboard")} className="transition-colors hover:text-primary">
                    {t.dashboard}
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="font-semibold text-slate-900">{t.title}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                    <p className="mt-2 text-slate-500">{t.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={type}
                        onChange={(event) => setType(event.target.value)}
                        className="h-11 min-w-[190px] rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {TYPE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === "all"
                                    ? t.allTypes
                                    : option === "audit"
                                        ? t.audit
                                        : option === "orders"
                                            ? t.orders
                                            : option === "coupons"
                                                ? t.coupons
                                                : option === "inventory"
                                                    ? t.inventory
                                                    : option === "reviews"
                                                        ? t.reviews
                                                        : t.aftersales}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={loadActivity}
                        disabled={loading}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {loading ? "progress_activity" : "refresh"}
                        </span>
                        {t.refresh}
                    </button>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="p-10 text-center text-slate-500">{t.loading}</div>
                ) : renderedItems.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">{t.empty}</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {renderedItems.map((activity) => {
                            const typeKey =
                                activity.kind === "audit"
                                    ? "audit"
                                    : activity.kind === "order_created"
                                        ? "orders"
                                        : activity.kind === "coupon_created"
                                            ? "coupons"
                                            : activity.kind === "review_created"
                                                ? "reviews"
                                                : activity.kind === "aftersales"
                                                    ? "aftersales"
                                                    : "inventory";
                            const relatedPage = activity.targetPage || TARGET_PAGE_LABEL[typeKey] || "dashboard";

                            return (
                                <div key={activity.id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TYPE_META[typeKey] || TYPE_META.audit}`}>
                                                {activity.content.category}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400">
                                                {formatRelativeTime(activity.createdAt, t)}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatDateTime(activity.createdAt, lang)}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-base font-bold text-slate-900">
                                            {activity.content.title}
                                        </div>
                                        <div className="mt-1 text-sm leading-6 text-slate-500">
                                            {activity.content.description}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => onSelectPage(relatedPage)}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
                                            {t.openRelated}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <Pagination
                        page={pagination.page || page}
                        limit={pagination.limit || 12}
                        total={pagination.total || 0}
                        totalPages={pagination.totalPages || 0}
                        onPageChange={setPage}
                        showingText={t.showing}
                        toText={t.to}
                        ofText={t.of}
                        resultsText={t.results}
                        prevText={t.previous}
                        nextText={t.next}
                    />
                )}
            </div>
        </div>
    );
}
