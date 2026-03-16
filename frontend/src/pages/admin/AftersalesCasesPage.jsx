import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Pagination from "../../components/common/Pagination";
import { getOrders } from "../../services/orderApi";
import { subscribeRealtime } from "../../services/realtime";
import {
    AFTERSALES_REQUEST_STATUS_OPTIONS,
    AFTERSALES_SLA_STATUS_OPTIONS,
    formatCurrency,
    formatDateTime,
    getAftersalesRequestStatusClass,
    getAftersalesRequestStatusLabel,
    getAftersalesRequestTypeLabel,
    getAftersalesSlaStatusClass,
    getAftersalesSlaStatusLabel,
} from "../../utils/orderHelpers";

const AFTERSALES_SLA_HOURS = 48;
const AFTERSALES_SLA_RISK_HOURS = 12;
const AFTERSALES_SLA_TRACKED_STATUSES = new Set([
    "submitted",
    "under_review",
    "received",
    "approved",
    "refund_processing",
]);

const T = {
    vi: {
        title: "Tất cả ca hậu mãi",
        subtitle: "Theo dõi tập trung toàn bộ yêu cầu hậu mãi, lọc theo trạng thái và SLA để xử lý nhanh hơn.",
        searchLabel: "Tìm kiếm",
        searchPlaceholder: "Mã đơn, khách hàng, email, số điện thoại, sản phẩm",
        statusLabel: "Trạng thái hậu mãi",
        slaLabel: "SLA",
        all: "Tất cả",
        refresh: "Làm mới",
        summaryTotal: "Tổng ca",
        summaryOpen: "Đang mở",
        summaryOverdue: "Quá SLA",
        summaryAtRisk: "Sắp quá SLA",
        summaryNotTracked: "Không tính SLA",
        requestedAt: "Ngày gửi",
        customer: "Khách hàng",
        order: "Đơn hàng",
        total: "Tổng tiền",
        reason: "Lý do",
        note: "Ghi chú khách",
        adminNote: "Ghi chú xử lý",
        noAdminNote: "Chưa có ghi chú xử lý",
        openAftersales: "Xử lý hậu mãi",
        openOrder: "Chi tiết đơn",
        empty: "Chưa có ca hậu mãi nào phù hợp.",
        loading: "Đang tải danh sách hậu mãi...",
        loadError: "Không thể tải danh sách hậu mãi",
        showing: "Hiển thị",
        to: "đến",
        of: "trên",
        results: "ca hậu mãi",
        previous: "Trước",
        next: "Sau",
        noCases: "Chưa có ca hậu mãi",
    },
    en: {
        title: "All aftersales cases",
        subtitle: "Monitor every aftersales request in one place and filter by status or SLA for faster handling.",
        searchLabel: "Search",
        searchPlaceholder: "Order number, customer, email, phone, product",
        statusLabel: "Aftersales status",
        slaLabel: "SLA",
        all: "All",
        refresh: "Refresh",
        summaryTotal: "Total cases",
        summaryOpen: "Open cases",
        summaryOverdue: "Overdue",
        summaryAtRisk: "At risk",
        summaryNotTracked: "Not tracked",
        requestedAt: "Requested at",
        customer: "Customer",
        order: "Order",
        total: "Total",
        reason: "Reason",
        note: "Customer note",
        adminNote: "Handling note",
        noAdminNote: "No handling note yet",
        openAftersales: "Open aftersales",
        openOrder: "Order detail",
        empty: "No matching aftersales cases.",
        loading: "Loading aftersales cases...",
        loadError: "Failed to load aftersales cases",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "aftersales cases",
        previous: "Previous",
        next: "Next",
        noCases: "No aftersales cases yet",
    },
};

const getAftersalesSlaStatus = (order) => {
    const status = String(order?.aftersalesRequest?.status || "none").trim().toLowerCase();
    if (!AFTERSALES_SLA_TRACKED_STATUSES.has(status)) {
        return "not_tracked";
    }

    const baseTime = order?.aftersalesRequest?.updatedAt || order?.aftersalesRequest?.requestedAt;
    if (!baseTime) {
        return "within_sla";
    }

    const diffHours = (Date.now() - new Date(baseTime).getTime()) / (1000 * 60 * 60);
    if (diffHours >= AFTERSALES_SLA_HOURS) {
        return "overdue";
    }
    if (diffHours >= Math.max(AFTERSALES_SLA_HOURS - AFTERSALES_SLA_RISK_HOURS, 1)) {
        return "at_risk";
    }
    return "within_sla";
};

export default function AftersalesCasesPage({ lang }) {
    const t = T[lang] || T.vi;
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [slaStatus, setSlaStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: 0 });
    const [loading, setLoading] = useState(false);

    const loadCases = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOrders({
                page,
                limit: 12,
                search: search.trim() || undefined,
                aftersalesOnly: true,
                aftersalesStatus: status === "all" ? undefined : status,
                aftersalesSlaStatus: slaStatus === "all" ? undefined : slaStatus,
            });
            const nextCases = Array.isArray(response?.data) ? response.data : [];
            setCases(nextCases);
            setPagination(response?.pagination || { page: 1, totalPages: 0, totalItems: 0 });
        } catch (error) {
            setCases([]);
            setPagination({ page: 1, totalPages: 0, totalItems: 0 });
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [page, search, slaStatus, status, t.loadError]);

    useEffect(() => {
        loadCases();
    }, [loadCases]);

    useEffect(() => {
        const unsubscribe = subscribeRealtime((payload) => {
            if (!String(payload?.type || "").startsWith("order.")) return;
            loadCases();
        });
        return unsubscribe;
    }, [loadCases]);

    const summary = useMemo(() => {
        const counts = {
            total: cases.length,
            open: 0,
            overdue: 0,
            atRisk: 0,
            notTracked: 0,
        };

        cases.forEach((order) => {
            const currentStatus = String(order?.aftersalesRequest?.status || "none");
            const currentSla = getAftersalesSlaStatus(order);
            if (currentStatus !== "completed" && currentStatus !== "rejected" && currentStatus !== "none") {
                counts.open += 1;
            }
            if (currentSla === "overdue") counts.overdue += 1;
            if (currentSla === "at_risk") counts.atRisk += 1;
            if (currentSla === "not_tracked") counts.notTracked += 1;
        });

        return counts;
    }, [cases]);

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                    <p className="mt-2 text-slate-500">{t.subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={loadCases}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    {t.refresh}
                </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{t.summaryTotal}</div>
                    <div className="mt-3 text-3xl font-black text-slate-900">{summary.total}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{t.summaryOpen}</div>
                    <div className="mt-3 text-3xl font-black text-slate-900">{summary.open}</div>
                </div>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-rose-500">{t.summaryOverdue}</div>
                    <div className="mt-3 text-3xl font-black text-rose-700">{summary.overdue}</div>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-amber-500">{t.summaryAtRisk}</div>
                    <div className="mt-3 text-3xl font-black text-amber-700">{summary.atRisk}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{t.summaryNotTracked}</div>
                    <div className="mt-3 text-3xl font-black text-slate-900">{summary.notTracked}</div>
                </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,1.5fr)_minmax(260px,1fr)_minmax(220px,0.85fr)] xl:items-end">
                    <label className="min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{t.searchLabel}</span>
                        <input
                            value={search}
                            onChange={(event) => {
                                setPage(1);
                                setSearch(event.target.value);
                            }}
                            placeholder={t.searchPlaceholder}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{t.statusLabel}</span>
                        <select
                            value={status}
                            onChange={(event) => {
                                setPage(1);
                                setStatus(event.target.value);
                            }}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">{t.all}</option>
                            {AFTERSALES_REQUEST_STATUS_OPTIONS.filter((option) => option !== "none").map((option) => (
                                <option key={option} value={option}>
                                    {getAftersalesRequestStatusLabel(option, lang)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">{t.slaLabel}</span>
                        <select
                            value={slaStatus}
                            onChange={(event) => {
                                setPage(1);
                                setSlaStatus(event.target.value);
                            }}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">{t.all}</option>
                            {AFTERSALES_SLA_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {getAftersalesSlaStatusLabel(option, lang)}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
                        {t.loading}
                    </div>
                ) : cases.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
                        {pagination.totalItems === 0 ? t.noCases : t.empty}
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {cases.map((order) => {
                            const currentSla = getAftersalesSlaStatus(order);
                            const aftersales = order?.aftersalesRequest || {};
                            return (
                                <div key={order._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate text-xl font-black text-slate-900">{order.orderNumber}</h2>
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(aftersales.status)}`}>
                                                    {getAftersalesRequestStatusLabel(aftersales.status, lang)}
                                                </span>
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAftersalesSlaStatusClass(currentSla)}`}>
                                                    {getAftersalesSlaStatusLabel(currentSla, lang)}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                                <span>{getAftersalesRequestTypeLabel(aftersales.type, lang)}</span>
                                                <span>•</span>
                                                <span>{t.requestedAt}: {formatDateTime(aftersales.requestedAt, lang)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.total}</div>
                                            <div className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(order.totalAmount)}</div>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.customer}</div>
                                            <div className="mt-2 font-semibold text-slate-900">{order?.customer?.name || "-"}</div>
                                            <div className="mt-1 text-sm text-slate-500">{order?.customer?.email || "-"}</div>
                                            <div className="mt-1 text-sm text-slate-500">{order?.customer?.phone || "-"}</div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.reason}</div>
                                            <div className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-slate-900">{aftersales.reason || "-"}</div>
                                            <div className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">{t.note}</div>
                                            <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{aftersales.customerNote || "-"}</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.adminNote}</div>
                                        <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                                            {aftersales.adminNote || t.noAdminNote}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                        <div className="min-w-0 text-sm text-slate-500">
                                            {order?.items?.[0]?.name || "-"}
                                            {order?.items?.length > 1 ? ` +${order.items.length - 1}` : ""}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                                {t.openOrder}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/admin/aftersales/${order._id}`)}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                                                {t.openAftersales}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 ? (
                <div className="mt-6">
                    <Pagination
                        page={pagination.page || page}
                        limit={12}
                        total={pagination.totalItems || 0}
                        totalPages={pagination.totalPages || 0}
                        onPageChange={setPage}
                        showingText={t.showing}
                        toText={t.to}
                        ofText={t.of}
                        resultsText={t.results}
                        prevText={t.previous}
                        nextText={t.next}
                    />
                </div>
            ) : null}
        </div>
    );
}
