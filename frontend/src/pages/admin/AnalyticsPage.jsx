import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getOrderAnalyticsSummary } from "../../services/orderApi";
import { getDashboardReviewAnalytics } from "../../services/dashboardApi";
import {
    formatCurrency,
    formatDateTime,
    getOrderStatusClass,
    getOrderStatusLabel,
} from "../../utils/orderHelpers";

const T = {
    vi: {
        title: "Phân tích đơn hàng",
        subtitle: "Tổng hợp nhanh doanh thu và hiệu suất vận hành theo đơn hàng.",
        orderColumn: "Đơn hàng",
        customerColumn: "Khách hàng",
        dateColumn: "Ngày",
        amountColumn: "Tổng tiền",
        statusColumn: "Trạng thái",
        totalRevenue: "Doanh thu hoàn thành",
        grossRevenue: "Doanh thu gộp",
        totalOrders: "Tổng đơn hàng",
        averageOrderValue: "Giá trị đơn trung bình",
        completedOrders: "Đơn hoàn thành",
        cancelledOrders: "Đơn hủy",
        pendingOrders: "Đơn chờ xác nhận",
        statusBreakdown: "Phân bổ trạng thái",
        dailyRevenue: "Doanh thu 7 ngày gần nhất",
        recentOrders: "Đơn hàng gần đây",
        refresh: "Làm mới",
        orders: "đơn",
        loading: "Đang tải dữ liệu...",
        loadError: "Không thể tải dữ liệu thống kê",
        empty: "Chưa có dữ liệu đơn hàng để thống kê",
        noRevenue: "Chưa phát sinh doanh thu",
    },
    en: {
        title: "Order Analytics",
        subtitle: "A quick view of revenue and fulfillment performance by order.",
        orderColumn: "Order",
        customerColumn: "Customer",
        dateColumn: "Date",
        amountColumn: "Amount",
        statusColumn: "Status",
        totalRevenue: "Completed revenue",
        grossRevenue: "Gross revenue",
        totalOrders: "Total orders",
        averageOrderValue: "Average order value",
        completedOrders: "Completed orders",
        cancelledOrders: "Cancelled orders",
        pendingOrders: "Pending orders",
        statusBreakdown: "Status breakdown",
        dailyRevenue: "Last 7 days revenue",
        recentOrders: "Recent orders",
        refresh: "Refresh",
        orders: "orders",
        loading: "Loading analytics...",
        loadError: "Failed to load analytics",
        empty: "No order data available yet",
        noRevenue: "No revenue yet",
    },
};

const ANALYTICS_TEXT = {
    vi: {
        ...T.vi,
        title: "Phân tích đơn hàng & đánh giá",
        subtitle: "Tổng hợp nhanh doanh thu, hiệu suất đơn hàng và chất lượng đánh giá sản phẩm.",
        reviewsTitle: "Phân tích đánh giá",
        reviewsSubtitle: "Theo dõi chất lượng phản hồi, đánh giá bị ẩn và các sản phẩm cần chú ý.",
        reviewAverage: "Điểm trung bình",
        approvedReviews: "Đánh giá đang hiển thị",
        hiddenReviews: "Đánh giá đã ẩn",
        verifiedReviews: "Đã xác thực mua",
        ratingDistribution: "Phân bố số sao",
        moderationOverview: "Tỷ lệ kiểm duyệt",
        attentionProducts: "Sản phẩm cần chú ý",
        latestReviews: "Đánh giá mới nhất",
        noReviewsYet: "Chưa có dữ liệu đánh giá",
        noAttentionProducts: "Chưa có sản phẩm nào cần chú ý",
        viewReviews: "Xem đánh giá",
        share: "Tỷ lệ",
        verifiedPurchase: "Đã mua hàng",
        hiddenReview: "Đang ẩn",
        visibleReview: "Đang hiển thị",
        product: "Sản phẩm",
        reviewer: "Người đánh giá",
        ratingLabel: "Số sao",
    },
    en: {
        ...T.en,
        title: "Order & Review Analytics",
        subtitle: "A quick view of revenue, fulfillment performance, and product review quality.",
        reviewsTitle: "Review Analytics",
        reviewsSubtitle: "Monitor review quality, hidden feedback, and products that need attention.",
        reviewAverage: "Average rating",
        approvedReviews: "Visible reviews",
        hiddenReviews: "Hidden reviews",
        verifiedReviews: "Verified buyers",
        ratingDistribution: "Rating distribution",
        moderationOverview: "Moderation overview",
        attentionProducts: "Products needing attention",
        latestReviews: "Latest reviews",
        noReviewsYet: "No review data yet",
        noAttentionProducts: "No products need attention right now",
        viewReviews: "View reviews",
        share: "Share",
        verifiedPurchase: "Verified purchase",
        hiddenReview: "Hidden",
        visibleReview: "Visible",
        product: "Product",
        reviewer: "Reviewer",
        ratingLabel: "Rating",
    },
};

const StatCard = ({ title, value, accent }) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-500">{title}</div>
        <div className={`mt-3 text-3xl font-black ${accent}`}>{value}</div>
    </div>
);

const getReviewStatusClass = (status) =>
    status === "hidden"
        ? "bg-rose-100 text-rose-700"
        : "bg-emerald-100 text-emerald-700";

export default function AnalyticsPage({ lang, onSelectPage }) {
    const t = ANALYTICS_TEXT[lang] || ANALYTICS_TEXT.vi;
    const [data, setData] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersResponse, reviewsResponse] = await Promise.all([
                getOrderAnalyticsSummary(),
                getDashboardReviewAnalytics(),
            ]);
            setData(ordersResponse?.data || null);
            setReviewData(reviewsResponse?.data || null);
        } catch (error) {
            setData(null);
            setReviewData(null);
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [t.loadError]);

    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    const maxRevenue = useMemo(() => {
        const values = (data?.dailyRevenue || []).map((entry) => entry.revenue || 0);
        return Math.max(...values, 0);
    }, [data]);

    const overview = data?.overview;
    const reviewOverview = reviewData?.overview;
    const reviewDistribution = reviewData?.distribution || [];
    const reviewModeration = reviewData?.moderation || {};
    const lowRatedProducts = reviewData?.lowRatedProducts || [];
    const latestReviews = reviewData?.recentReviews || [];

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                    <p className="mt-2 text-slate-500">{t.subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={loadAnalytics}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {loading ? "progress_activity" : "refresh"}
                    </span>
                    {t.refresh}
                </button>
            </div>

            {!overview ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                    {loading ? t.loading : t.empty}
                </div>
            ) : (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard title={t.totalRevenue} value={formatCurrency(overview.totalRevenue)} accent="text-emerald-600" />
                        <StatCard title={t.grossRevenue} value={formatCurrency(overview.grossRevenue)} accent="text-primary" />
                        <StatCard title={t.totalOrders} value={overview.totalOrders || 0} accent="text-slate-900" />
                        <StatCard title={t.averageOrderValue} value={formatCurrency(overview.averageOrderValue)} accent="text-indigo-600" />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <StatCard title={t.completedOrders} value={overview.completedOrders || 0} accent="text-emerald-600" />
                        <StatCard title={t.pendingOrders} value={overview.pendingOrders || 0} accent="text-amber-600" />
                        <StatCard title={t.cancelledOrders} value={overview.cancelledOrders || 0} accent="text-rose-600" />
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900">{t.statusBreakdown}</h2>
                            <div className="mt-5 space-y-4">
                                {(data?.statusBreakdown || []).map((entry) => (
                                    <div key={entry.status} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(entry.status)}`}>
                                                {getOrderStatusLabel(entry.status, lang)}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-500">
                                                {entry.count} {t.orders}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-2xl font-black text-slate-900">
                                            {formatCurrency(entry.totalAmount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900">{t.dailyRevenue}</h2>
                            <div className="mt-6 grid min-h-[260px] grid-cols-1 items-end gap-3 md:grid-cols-7">
                                {(data?.dailyRevenue || []).map((entry) => {
                                    const height = maxRevenue > 0 ? Math.max(18, (entry.revenue / maxRevenue) * 220) : 18;
                                    return (
                                        <div key={entry.date} className="flex flex-col items-center gap-3">
                                            <div className="text-xs text-slate-500">{formatCurrency(entry.revenue) || t.noRevenue}</div>
                                            <div className="flex min-h-[220px] w-full max-w-20 items-end justify-center rounded-3xl bg-slate-100 px-2 py-2">
                                                <div
                                                    className="w-full rounded-2xl bg-gradient-to-t from-primary to-sky-300"
                                                    style={{ height }}
                                                />
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500">{entry.date.slice(5)}</div>
                                            <div className="text-xs text-slate-400">
                                                {entry.orders} {t.orders}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <h2 className="text-xl font-black text-slate-900">{t.recentOrders}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-6 py-4">{t.orderColumn}</th>
                                        <th className="px-6 py-4">{t.customerColumn}</th>
                                        <th className="px-6 py-4">{t.dateColumn}</th>
                                        <th className="px-6 py-4">{t.amountColumn}</th>
                                        <th className="px-6 py-4">{t.statusColumn}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(data?.recentOrders || []).map((order) => (
                                        <tr key={order._id} className="transition-colors hover:bg-slate-50">
                                            <td className="px-6 py-4 font-bold text-slate-900">{order.orderNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{order.customer?.name || "-"}</div>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{t.reviewsTitle}</h2>
                                <p className="mt-2 text-slate-500">{t.reviewsSubtitle}</p>
                            </div>
                            {onSelectPage && (
                                <button
                                    type="button"
                                    onClick={() => onSelectPage("reviews")}
                                    className="text-sm font-semibold text-primary transition-colors hover:underline"
                                >
                                    {t.viewReviews}
                                </button>
                            )}
                        </div>

                        {!reviewOverview ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                                {t.noReviewsYet}
                            </div>
                        ) : (
                            <>
                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <StatCard title={t.reviewAverage} value={`${Number(reviewOverview.averageRating || 0).toFixed(1)}/5`} accent="text-amber-600" />
                                    <StatCard title={t.approvedReviews} value={reviewOverview.approvedReviews || 0} accent="text-emerald-600" />
                                    <StatCard title={t.hiddenReviews} value={reviewOverview.hiddenReviews || 0} accent="text-rose-600" />
                                    <StatCard title={t.verifiedReviews} value={reviewOverview.verifiedReviews || 0} accent="text-sky-600" />
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                                    <section className="rounded-3xl border border-slate-200 p-6">
                                        <h3 className="text-lg font-black text-slate-900">{t.ratingDistribution}</h3>
                                        <div className="mt-5 space-y-4">
                                            {reviewDistribution.map((entry) => (
                                                <div key={entry.rating}>
                                                    <div className="flex items-center justify-between gap-4 text-sm">
                                                        <div className="font-semibold text-slate-700">
                                                            {entry.rating} {t.ratingLabel}
                                                        </div>
                                                        <div className="text-slate-500">
                                                            {entry.count} · {entry.share}%
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                                                            style={{ width: `${Math.max(entry.share || 0, entry.count > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.approvedReviews}</div>
                                                <div className="mt-2 text-2xl font-black text-slate-900">{reviewModeration.approvedRate || 0}%</div>
                                                <div className="text-xs text-slate-500">{t.share}</div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.hiddenReviews}</div>
                                                <div className="mt-2 text-2xl font-black text-slate-900">{reviewModeration.hiddenRate || 0}%</div>
                                                <div className="text-xs text-slate-500">{t.share}</div>
                                            </div>
                                            <div className="rounded-2xl bg-slate-50 p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.verifiedReviews}</div>
                                                <div className="mt-2 text-2xl font-black text-slate-900">{reviewModeration.verifiedRate || 0}%</div>
                                                <div className="text-xs text-slate-500">{t.share}</div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-3xl border border-slate-200 p-6">
                                        <h3 className="text-lg font-black text-slate-900">{t.attentionProducts}</h3>
                                        {lowRatedProducts.length === 0 ? (
                                            <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                                                {t.noAttentionProducts}
                                            </div>
                                        ) : (
                                            <div className="mt-5 space-y-4">
                                                {lowRatedProducts.map((product) => (
                                                    <div key={product._id} className="rounded-2xl border border-slate-200 p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <div className="truncate text-base font-bold text-slate-900">{product.name}</div>
                                                                <div className="mt-1 text-sm text-slate-500">
                                                                    {product.reviewCount} {t.approvedReviews.toLowerCase()}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                                                                {Number(product.ratingAverage || 0).toFixed(1)}/5
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </div>

                                <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                        <h3 className="text-lg font-black text-slate-900">{t.latestReviews}</h3>
                                        {onSelectPage && (
                                            <button
                                                type="button"
                                                onClick={() => onSelectPage("reviews")}
                                                className="text-sm font-semibold text-primary transition-colors hover:underline"
                                            >
                                                {t.viewReviews}
                                            </button>
                                        )}
                                    </div>

                                    {latestReviews.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500">{t.noReviewsYet}</div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {latestReviews.map((review) => (
                                                <div key={review._id} className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="font-semibold text-slate-900">{review.user?.name || "-"}</div>
                                                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                                                {review.rating}/5
                                                            </span>
                                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${getReviewStatusClass(review.status)}`}>
                                                                {review.status === "hidden" ? t.hiddenReview : t.visibleReview}
                                                            </span>
                                                            {review.isVerifiedPurchase && (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                                    {t.verifiedPurchase}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 text-sm font-semibold text-slate-900">
                                                            {review.title || review.product?.name || "-"}
                                                        </div>
                                                        <div className="mt-1 text-sm leading-6 text-slate-500">
                                                            {review.comment || review.product?.name || "-"}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-500 lg:text-right">
                                                        <div className="font-semibold text-slate-700">{review.product?.name || "-"}</div>
                                                        <div className="mt-1">{formatDateTime(review.createdAt, lang)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
