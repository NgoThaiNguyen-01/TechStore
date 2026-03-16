﻿import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getDashboardSummary } from "../../services/dashboardApi";
import {
    formatCurrency,
    formatDateTime,
    getAftersalesRequestStatusLabel,
    getAftersalesRequestTypeLabel,
    getOrderStatusClass,
    getOrderStatusLabel,
    getPaymentStatusLabel,
} from "../../utils/orderHelpers";

const T = {
    vi: {
        home: "Trang chủ",
        title: "Tổng quan",
        subtitle: "Theo dõi nhanh doanh thu, đơn hàng và hoạt động vận hành theo dữ liệu thật.",
        totalRevenue: "Doanh thu",
        ordersCount: "Đơn hàng",
        activeUsers: "Người dùng hoạt động",
        lowStock: "Hàng sắp hết",
        revenueOverview: "Biểu đồ doanh thu",
        revenueHint: "Doanh thu theo thời gian của các đơn hoàn tất.",
        last30Days: "30 ngày qua",
        last90Days: "90 ngày qua",
        thisYear: "Năm nay",
        export: "Xuất file",
        recentOrders: "Đơn hàng gần đây",
        recentActivity: "Hoạt động gần đây",
        viewAll: "Xem tất cả",
        viewLog: "Xem toàn bộ nhật ký",
        order: "Mã đơn",
        customer: "Khách hàng",
        date: "Ngày",
        amount: "Số tiền",
        status: "Trạng thái",
        action: "Thao tác",
        loading: "Đang tải dữ liệu tổng quan...",
        loadError: "Không thể tải dữ liệu tổng quan",
        emptyOrders: "Chưa có đơn hàng gần đây",
        emptyActivity: "Chưa có hoạt động gần đây",
        emptyDashboard: "Chưa có dữ liệu tổng quan",
        noChartData: "Chưa có dữ liệu doanh thu trong khoảng thời gian này",
        previousPeriod: "so với kỳ trước",
        trendFlat: "Không đổi",
        orderCreated: "Đơn hàng mới",
        paymentPending: "Chờ thanh toán",
        couponCreated: "Voucher mới",
        lowStockNotice: "Sắp hết hàng",
        auditLog: "Cập nhật hệ thống",
        by: "bởi",
        stockRemaining: "còn",
        units: "sản phẩm",
        minAgo: "phút trước",
        hourAgo: "giờ trước",
        dayAgo: "ngày trước",
        justNow: "Vừa xong",
        unknownCustomer: "Khách vãng lai",
        aftersalesActivity: "Hậu mãi",
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
    },
    en: {
        home: "Home",
        title: "Dashboard",
        subtitle: "A live view of revenue, orders, and operational activity from the database.",
        totalRevenue: "Revenue",
        ordersCount: "Orders",
        activeUsers: "Active users",
        lowStock: "Low stock",
        revenueOverview: "Revenue overview",
        revenueHint: "Revenue across completed orders over time.",
        last30Days: "Last 30 days",
        last90Days: "Last 90 days",
        thisYear: "This year",
        export: "Export",
        recentOrders: "Recent orders",
        recentActivity: "Recent activity",
        viewAll: "View all",
        viewLog: "View full log",
        order: "Order",
        customer: "Customer",
        date: "Date",
        amount: "Amount",
        status: "Status",
        action: "Action",
        loading: "Loading dashboard data...",
        loadError: "Failed to load dashboard data",
        emptyOrders: "No recent orders",
        emptyActivity: "No recent activity yet",
        emptyDashboard: "No dashboard data available",
        noChartData: "No revenue data available for this range",
        previousPeriod: "vs previous period",
        trendFlat: "No change",
        orderCreated: "New order",
        paymentPending: "Awaiting payment",
        couponCreated: "New voucher",
        lowStockNotice: "Low stock",
        auditLog: "System update",
        by: "by",
        stockRemaining: "remaining",
        units: "items",
        minAgo: "mins ago",
        hourAgo: "hrs ago",
        dayAgo: "days ago",
        justNow: "Just now",
        unknownCustomer: "Guest customer",
        aftersalesActivity: "Aftersales",
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
    },
};

const DASHBOARD_TEXT = {
    vi: {
        ...T.vi,
        subtitle: "Theo dõi nhanh doanh thu, đơn hàng, đánh giá và hoạt động vận hành theo dữ liệu thật.",
        reviewInsights: "Tín hiệu đánh giá",
        reviewAverage: "Điểm trung bình",
        newReviews: "Đánh giá mới",
        hiddenReviews: "Đánh giá đã ẩn",
        verifiedReviews: "Đã xác thực mua",
        recentReviews: "Đánh giá gần đây",
        viewReviews: "Xem đánh giá",
        emptyReviews: "Chưa có đánh giá nào gần đây",
        verifiedPurchase: "Đã mua hàng",
        hiddenReview: "Đang ẩn",
        reviewCreated: "Đánh giá mới",
        rated: "đã đánh giá",
        outOfFive: "/5",
    },
    en: {
        ...T.en,
        subtitle: "A live view of revenue, orders, reviews, and operational activity from the database.",
        reviewInsights: "Review signals",
        reviewAverage: "Average rating",
        newReviews: "New reviews",
        hiddenReviews: "Hidden reviews",
        verifiedReviews: "Verified buyers",
        recentReviews: "Recent reviews",
        viewReviews: "View reviews",
        emptyReviews: "No recent reviews yet",
        verifiedPurchase: "Verified purchase",
        hiddenReview: "Hidden",
        reviewCreated: "New review",
        rated: "rated",
        outOfFive: "/5",
    },
};

const PERIOD_OPTIONS = [30, 90, 365];

const CARD_META = {
    totalRevenue: {
        icon: "attach_money",
        iconClass: "bg-emerald-50 text-emerald-600",
    },
    ordersCount: {
        icon: "shopping_bag",
        iconClass: "bg-blue-50 text-primary",
    },
    activeUsers: {
        icon: "group",
        iconClass: "bg-violet-50 text-violet-600",
    },
    lowStock: {
        icon: "warning",
        iconClass: "bg-amber-50 text-amber-600",
    },
};

const ACTIVITY_TONE_CLASS = {
    primary: "bg-primary",
    purple: "bg-violet-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    slate: "bg-slate-400",
};

const REVIEW_CARD_META = {
    averageRating: {
        icon: "star",
        iconClass: "bg-amber-50 text-amber-600",
    },
    newReviews: {
        icon: "rate_review",
        iconClass: "bg-sky-50 text-sky-600",
    },
    hiddenReviews: {
        icon: "visibility_off",
        iconClass: "bg-rose-50 text-rose-600",
    },
    verifiedReviews: {
        icon: "verified",
        iconClass: "bg-emerald-50 text-emerald-600",
    },
};

function formatTrend(trend, t) {
    if (!trend || trend.direction === "flat") {
        return t.trendFlat;
    }

    return `${trend.direction === "up" ? "+" : "-"}${trend.value}%`;
}

function formatReviewMetricValue(key, value, lang, t) {
    if (key === "averageRating") {
        return `${Number(value || 0).toFixed(1)}${t.outOfFive}`;
    }

    return Number(value || 0).toLocaleString(lang === "vi" ? "vi-VN" : "en-US");
}

function getTrendClass(trend) {
    if (!trend || trend.direction === "flat") {
        return "bg-slate-100 text-slate-600";
    }

    return trend.direction === "up"
        ? "bg-emerald-50 text-emerald-600"
        : "bg-rose-50 text-rose-600";
}

function getTrendIcon(trend) {
    if (!trend || trend.direction === "flat") {
        return "trending_flat";
    }

    return trend.direction === "up" ? "trending_up" : "trending_down";
}

function getChartLabel(point, bucket, lang) {
    const locale = lang === "vi" ? "vi-VN" : "en-US";

    if (bucket === "month") {
        return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(`${point.key}-01T00:00:00`));
    }

    const date = new Date(`${point.key}T00:00:00`);
    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
    }).format(date);
}

function buildChartPath(points, width, height, maxValue) {
    if (!points.length) return "";

    const safeMax = maxValue > 0 ? maxValue : 1;
    const step = points.length > 1 ? width / (points.length - 1) : 0;

    return points
        .map((point, index) => {
            const x = index * step;
            const y = height - (point.revenue / safeMax) * (height - 24) - 12;
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
}

function buildAreaPath(points, width, height, maxValue) {
    if (!points.length) return "";

    const linePath = buildChartPath(points, width, height, maxValue);
    if (!linePath) return "";

    const safeWidth = points.length > 1 ? width : 0;
    return `${linePath} L ${safeWidth} ${height} L 0 ${height} Z`;
}

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
            title: `${t.orderCreated} ${activity.orderNumber || ""}`.trim(),
            description: `${customerName}${paymentStatus}`,
        };
    }

    if (activity.kind === "coupon_created") {
        return {
            title: `${t.couponCreated} ${activity.couponCode || ""}`.trim(),
            description: activity.couponName || "-",
        };
    }

    if (activity.kind === "low_stock") {
        return {
            title: `${t.lowStockNotice}: ${activity.productName || "-"}`,
            description: `${t.stockRemaining} ${activity.stock || 0} ${t.units}`,
        };
    }

    if (activity.kind === "review_created") {
        const reviewer = activity.reviewerName || t.unknownCustomer;
        const productName = activity.productName || "-";
        const verifiedBadge = activity.isVerifiedPurchase ? ` · ${t.verifiedPurchase}` : "";
        return {
            title: `${t.reviewCreated} ${activity.rating || 0}${t.outOfFive}`,
            description: `${reviewer} ${t.rated} ${productName}${verifiedBadge}`,
        };
    }

    if (activity.kind === "aftersales") {
        const customerName = activity.customerName || t.unknownCustomer;
        const typeLabel = getAftersalesRequestTypeLabel(activity.aftersalesType, lang);
        const statusLabel = getAftersalesRequestStatusLabel(activity.aftersalesStatus, lang);
        return {
            title: `${t.aftersalesActivity} ${activity.orderNumber || ""}`.trim(),
            description: `${customerName} · ${typeLabel} · ${statusLabel}`,
        };
    }

    const actorName = activity.actorName || "-";
    const targetName = activity.targetName ? ` · ${activity.targetName}` : "";
    const auditActionLabel = getAuditActionLabel(activity.action, t);
    return {
        title: t.auditLog,
        description: `${actorName} ${auditActionLabel}${targetName}`,
    };
}

function StatCard({ title, value, trend, meta, t }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">{title}</p>
                    <h3 className="mt-3 text-3xl font-black text-slate-900">{value}</h3>
                </div>
                <div className={`rounded-2xl p-3 ${meta.iconClass}`}>
                    <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${getTrendClass(trend)}`}>
                    <span className="material-symbols-outlined text-[14px]">{getTrendIcon(trend)}</span>
                    {formatTrend(trend, t)}
                </span>
                <span className="text-xs text-slate-400">{t.previousPeriod}</span>
            </div>
        </div>
    );
}

function ReviewInsightCard({ title, valueKey, value, trend, meta, t, lang }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">{title}</p>
                    <h3 className="mt-3 text-2xl font-black text-slate-900">
                        {formatReviewMetricValue(valueKey, value, lang, t)}
                    </h3>
                </div>
                <div className={`rounded-2xl p-3 ${meta.iconClass}`}>
                    <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${getTrendClass(trend)}`}>
                    <span className="material-symbols-outlined text-[14px]">{getTrendIcon(trend)}</span>
                    {formatTrend(trend, t)}
                </span>
                <span className="text-xs text-slate-400">{t.previousPeriod}</span>
            </div>
        </div>
    );
}

export default function DashboardPage({ lang, onNavigateHome, onSelectPage }) {
    const t = DASHBOARD_TEXT[lang] || DASHBOARD_TEXT.vi;
    const [period, setPeriod] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getDashboardSummary({ period });
            setData(response?.data || null);
        } catch (error) {
            setData(null);
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [period, t.loadError]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const chart = useMemo(() => {
        const points = data?.revenueSeries?.points || [];
        const bucket = data?.revenueSeries?.bucket || "day";
        const maxRevenue = Math.max(...points.map((point) => Number(point.revenue || 0)), 0);
        const width = 900;
        const height = 260;

        return {
            points,
            bucket,
            maxRevenue,
            width,
            height,
            linePath: buildChartPath(points, width, height, maxRevenue),
            areaPath: buildAreaPath(points, width, height, maxRevenue),
        };
    }, [data]);

    const cards = data?.cards || {};
    const reviewSummary = data?.reviewSummary || {};
    const reviewOverview = reviewSummary?.overview || {};
    const reviewTrends = reviewSummary?.trends || {};
    const reviewCards = [
        {
            key: "averageRating",
            title: t.reviewAverage,
            value: reviewOverview.averageRating || 0,
            trend: reviewTrends.averageRating?.trend,
        },
        {
            key: "newReviews",
            title: t.newReviews,
            value: reviewTrends.newReviews?.value || 0,
            trend: reviewTrends.newReviews?.trend,
        },
        {
            key: "hiddenReviews",
            title: t.hiddenReviews,
            value: reviewOverview.hiddenReviews || 0,
            trend: reviewTrends.hiddenReviews?.trend,
        },
        {
            key: "verifiedReviews",
            title: t.verifiedReviews,
            value: reviewOverview.verifiedReviews || 0,
            trend: reviewTrends.verifiedReviews?.trend,
        },
    ];
    const recentReviewItems = reviewSummary?.recentReviews || [];
    const recentOrders = data?.recentOrders || [];
    const recentActivity = data?.recentActivity || [];

    const handleExport = () => {
        if (!data) return;

        const payload = {
            generatedAt: new Date().toISOString(),
            periodDays: data.periodDays,
            cards,
            reviewSummary,
            revenueSeries: data.revenueSeries,
            recentOrders: recentOrders.map((order) => ({
                orderNumber: order.orderNumber,
                customerName: order.customer?.name || "",
                email: order.customer?.email || "",
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dashboard-summary-${data.periodDays || period}d.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                    type="button"
                    onClick={onNavigateHome}
                    className="transition-colors hover:text-primary"
                >
                    {t.home}
                </button>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="font-semibold text-slate-900">{t.title}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                    <p className="mt-2 text-slate-500">{t.subtitle}</p>
                </div>
            </div>

            {loading && !data ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                    {t.loading}
                </div>
            ) : !data ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                    {t.emptyDashboard}
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-4">
                    <div className="xl:col-span-3 flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {Object.entries(CARD_META).map(([key, meta]) => (
                                <StatCard
                                    key={key}
                                    title={t[key]}
                                    value={
                                        key === "totalRevenue"
                                            ? formatCurrency(cards[key]?.value || 0)
                                            : (cards[key]?.value || 0).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")
                                    }
                                    trend={cards[key]?.trend}
                                    meta={meta}
                                    t={t}
                                />
                            ))}
                        </div>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{t.reviewInsights}</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {Number(reviewOverview.totalReviews || 0).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")} {t.recentReviews.toLowerCase()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectPage("reviews")}
                                    className="text-sm font-semibold text-primary transition-colors hover:underline"
                                >
                                    {t.viewReviews}
                                </button>
                            </div>
                            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {reviewCards.map((card) => (
                                    <ReviewInsightCard
                                        key={card.key}
                                        title={card.title}
                                        valueKey={card.key}
                                        value={card.value}
                                        trend={card.trend}
                                        meta={REVIEW_CARD_META[card.key]}
                                        t={t}
                                        lang={lang}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{t.revenueOverview}</h2>
                                    <p className="mt-1 text-sm text-slate-500">{t.revenueHint}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={period}
                                        onChange={(event) => setPeriod(Number(event.target.value))}
                                        className="h-11 min-w-[170px] rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        {PERIOD_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option === 30 ? t.last30Days : option === 90 ? t.last90Days : t.thisYear}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        disabled={!data}
                                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                        {t.export}
                                    </button>
                                </div>
                            </div>

                            {chart.points.length === 0 ? (
                                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                    {t.noChartData}
                                </div>
                            ) : (
                                <>
                                    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-primary/5 via-sky-50/60 to-white p-4">
                                        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-72 w-full">
                                            <defs>
                                                <linearGradient id="dashboard-chart-fill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
                                                </linearGradient>
                                            </defs>
                                            <path d={chart.areaPath} fill="url(#dashboard-chart-fill)" />
                                            <path
                                                d={chart.linePath}
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                    <div className={`mt-4 grid gap-3 text-xs font-semibold text-slate-500 ${chart.points.length > 8 ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12" : "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"}`}>
                                        {chart.points.map((point) => (
                                            <div key={point.key} className="rounded-2xl bg-slate-50 px-3 py-2 text-center">
                                                <div className="truncate text-slate-600">
                                                    {getChartLabel(point, chart.bucket, lang)}
                                                </div>
                                                <div className="mt-1 truncate text-[11px] text-slate-400">
                                                    {formatCurrency(point.revenue || 0)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                <h2 className="text-xl font-black text-slate-900">{t.recentReviews}</h2>
                                <button
                                    type="button"
                                    onClick={() => onSelectPage("reviews")}
                                    className="text-sm font-semibold text-primary transition-colors hover:underline"
                                >
                                    {t.viewReviews}
                                </button>
                            </div>

                            {recentReviewItems.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">{t.emptyReviews}</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentReviewItems.map((review) => (
                                        <button
                                            key={review._id}
                                            type="button"
                                            onClick={() => onSelectPage("reviews")}
                                            className="flex w-full flex-col gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 lg:flex-row lg:items-start lg:justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="text-base font-bold text-slate-900">
                                                        {review.user?.name || t.unknownCustomer}
                                                    </div>
                                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                                        {review.rating}{t.outOfFive}
                                                    </span>
                                                    {review.isVerifiedPurchase && (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                            {t.verifiedPurchase}
                                                        </span>
                                                    )}
                                                    {review.status === "hidden" && (
                                                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                                                            {t.hiddenReview}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                                    {review.title || review.product?.name || "-"}
                                                </div>
                                                <div className="mt-1 text-sm leading-6 text-slate-500">
                                                    {review.comment || review.product?.name || "-"}
                                                </div>
                                                <div className="mt-2 text-xs text-slate-400">
                                                    {review.product?.name || "-"} Â· {formatDateTime(review.createdAt, lang)}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm font-semibold text-primary">
                                                {t.viewReviews}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                <h2 className="text-xl font-black text-slate-900">{t.recentOrders}</h2>
                                <button
                                    type="button"
                                    onClick={() => onSelectPage("orders")}
                                    className="text-sm font-semibold text-primary transition-colors hover:underline"
                                >
                                    {t.viewAll}
                                </button>
                            </div>

                            {recentOrders.length === 0 ? (
                                <div className="p-10 text-center text-slate-500">{t.emptyOrders}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                <th className="px-6 py-4">{t.order}</th>
                                                <th className="px-6 py-4">{t.customer}</th>
                                                <th className="px-6 py-4">{t.date}</th>
                                                <th className="px-6 py-4">{t.amount}</th>
                                                <th className="px-6 py-4">{t.status}</th>
                                                <th className="px-6 py-4 text-right">{t.action}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentOrders.map((order) => (
                                                <tr key={order._id} className="transition-colors hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{order.orderNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-900">{order.customer?.name || t.unknownCustomer}</div>
                                                        <div className="text-sm text-slate-500">{order.customer?.email || "-"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {formatDateTime(order.createdAt, lang)}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900">
                                                        {formatCurrency(order.totalAmount)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(order.status)}`}>
                                                            {getOrderStatusLabel(order.status, lang)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelectPage("orders")}
                                                            className="inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="xl:col-span-1">
                        <section className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-xl font-black text-slate-900">{t.recentActivity}</h2>
                                <button
                                    type="button"
                                    onClick={() => onSelectPage("activityLog")}
                                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                                >
                                    <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                                </button>
                            </div>

                            {recentActivity.length === 0 ? (
                                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                                    {t.emptyActivity}
                                </div>
                            ) : (
                                <div className="mt-6 relative border-l-2 border-slate-100 pl-4 space-y-6">
                                    {recentActivity.map((activity) => {
                                        const content = describeActivity(activity, lang, t);
                                        return (
                                            <button
                                                key={activity.id}
                                                type="button"
                                                onClick={() => onSelectPage(activity.targetPage || "dashboard")}
                                                className="relative block w-full text-left"
                                            >
                                                <span
                                                    className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ring-slate-200 ${ACTIVITY_TONE_CLASS[activity.tone] || ACTIVITY_TONE_CLASS.slate}`}
                                                />
                                                <div className="text-sm font-semibold text-slate-900">{content.title}</div>
                                                <div className="mt-1 text-xs leading-5 text-slate-500">{content.description}</div>
                                                <div className="mt-2 text-xs text-slate-400">
                                                    {formatRelativeTime(activity.createdAt, t)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => onSelectPage("activityLog")}
                                className="mt-6 w-full rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                            >
                                {t.viewLog}
                            </button>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
