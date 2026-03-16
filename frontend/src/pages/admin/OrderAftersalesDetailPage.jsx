import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { addOrderInternalNote, getOrderById, reviewOrderAftersalesRequest } from "../../services/orderApi";
import { subscribeRealtime } from "../../services/realtime";
import { hasAdminPermission } from "../../utils/adminAccess";
import {
    AFTERSALES_REQUEST_STATUS_OPTIONS,
    formatCurrency,
    formatDateTime,
    getAftersalesRequestStatusClass,
    getAftersalesRequestStatusLabel,
    getAftersalesRequestTypeLabel,
    getOrderStatusLabel,
    getOrderTimelineMeta,
    getPaymentMethodLabel,
    getPaymentStatusLabel,
    getRefundRequestStatusLabel,
} from "../../utils/orderHelpers";
import { formatOrderTimelineNote, formatShippingEta, getShippingZoneLabel } from "../../utils/shippingHelpers";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        backToOrders: "Quay lại đơn hàng",
        backToOrderDetail: "Chi tiết đơn",
        title: "Chi tiết hậu mãi",
        subtitle: "Theo dõi hồ sơ hậu mãi, bằng chứng, lịch sử xử lý và cập nhật tiến trình trên một màn riêng.",
        loading: "Đang tải hồ sơ hậu mãi...",
        loadError: "Không thể tải chi tiết hậu mãi",
        notFound: "Không tìm thấy đơn hàng",
        noAftersales: "Đơn này chưa có yêu cầu hậu mãi.",
        openOrder: "Mở chi tiết đơn",
        requestOverview: "Hồ sơ yêu cầu",
        requestType: "Loại yêu cầu",
        requestStatus: "Trạng thái hậu mãi",
        requestedAt: "Ngày gửi yêu cầu",
        reviewedAt: "Ngày xem xét",
        completedAt: "Ngày hoàn tất",
        requestedBy: "Khách gửi yêu cầu",
        reviewedBy: "Người xử lý",
        customerReason: "Lý do khách gửi",
        customerNote: "Mô tả thêm",
        evidence: "Bằng chứng đính kèm",
        noEvidence: "Chưa có bằng chứng đính kèm",
        handling: "Xử lý hậu mãi",
        save: "Lưu",
        saving: "Đang lưu...",
        noChanges: "Không có thay đổi để lưu",
        saveSuccess: "Đã cập nhật hồ sơ hậu mãi",
        adminNote: "Ghi chú xử lý",
        adminNotePlaceholder: "Nhập ghi chú xử lý cho bộ phận hậu mãi...",
        orderContext: "Ngữ cảnh đơn hàng",
        orderNumber: "Mã đơn",
        orderStatus: "Trạng thái đơn",
        paymentStatus: "Trạng thái thanh toán",
        paymentMethod: "Phương thức thanh toán",
        refundStatus: "Trạng thái hoàn tiền",
        total: "Tổng cộng",
        customerInfo: "Khách hàng",
        customerName: "Họ và tên",
        email: "Email",
        phone: "Số điện thoại",
        address: "Địa chỉ",
        shipment: "Vận chuyển",
        carrier: "Đơn vị vận chuyển",
        service: "Dịch vụ",
        zone: "Khu vực",
        eta: "Dự kiến giao",
        trackingNumber: "Mã vận đơn",
        trackingLink: "Liên kết theo dõi",
        openLink: "Mở link",
        noShipment: "Chưa có dữ liệu vận chuyển",
        internalNotes: "Ghi chú nội bộ",
        internalNotePlaceholder: "Thêm ghi chú nội bộ cho ca hậu mãi này...",
        addNote: "Thêm ghi chú",
        noteAdded: "Đã thêm ghi chú nội bộ",
        noNotes: "Chưa có ghi chú nội bộ",
        handlingHistory: "Lịch sử xử lý",
        noHistory: "Chưa có lịch sử xử lý liên quan hậu mãi",
        historyActor: "Người xử lý",
        historyActionAftersalesSubmitted: "Khách gửi yêu cầu hậu mãi",
        historyActionAftersalesReviewed: "Cập nhật trạng thái hậu mãi",
        historyActionRefundRequested: "Khách yêu cầu hoàn tiền",
        historyActionRefundApproved: "Duyệt hoàn tiền",
        historyActionRefundRejected: "Từ chối hoàn tiền",
        historyActionOrderNote: "Thêm ghi chú nội bộ",
        historyActionOrderUpdate: "Cập nhật đơn hàng",
        historyActionOrderCreated: "Tạo đơn hàng",
        historyFieldAftersalesType: "Loại yêu cầu",
        historyFieldAftersalesStatus: "Trạng thái hậu mãi",
        historyFieldRefundStatus: "Trạng thái hoàn tiền",
        historyFieldPaymentStatus: "Trạng thái thanh toán",
        historyFieldOrderStatus: "Trạng thái đơn",
        historyFieldNote: "Ghi chú",
        timeline: "Timeline hậu mãi",
        timelineHint: "Lọc các mốc liên quan đến hậu mãi, hoàn tiền, vận chuyển hoặc ghi chú nội bộ.",
        searchTimeline: "Tìm trong timeline...",
        newest: "Mới nhất",
        oldest: "Cũ nhất",
        filterAll: "Tất cả",
        filterAftersales: "Hậu mãi",
        filterRefund: "Hoàn tiền",
        filterShipment: "Vận chuyển",
        filterAdmin: "Nội bộ",
        noTimeline: "Chưa có mốc phù hợp.",
        items: "Sản phẩm",
    },
    en: {
        backToOrders: "Back to orders",
        backToOrderDetail: "Order detail",
        title: "Aftersales detail",
        subtitle: "Review the aftersales case, evidence, handling history, and progress in a dedicated screen.",
        loading: "Loading aftersales detail...",
        loadError: "Failed to load aftersales detail",
        notFound: "Order not found",
        noAftersales: "This order does not have an aftersales request yet.",
        openOrder: "Open order detail",
        requestOverview: "Request overview",
        requestType: "Request type",
        requestStatus: "Aftersales status",
        requestedAt: "Requested at",
        reviewedAt: "Reviewed at",
        completedAt: "Completed at",
        requestedBy: "Requested by",
        reviewedBy: "Handled by",
        customerReason: "Customer reason",
        customerNote: "Customer note",
        evidence: "Evidence",
        noEvidence: "No evidence attached",
        handling: "Aftersales handling",
        save: "Save",
        saving: "Saving...",
        noChanges: "No changes to save",
        saveSuccess: "Aftersales case updated",
        adminNote: "Handling note",
        adminNotePlaceholder: "Add an internal handling note for this aftersales case...",
        orderContext: "Order context",
        orderNumber: "Order number",
        orderStatus: "Order status",
        paymentStatus: "Payment status",
        paymentMethod: "Payment method",
        refundStatus: "Refund status",
        total: "Total",
        customerInfo: "Customer",
        customerName: "Full name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        shipment: "Shipment",
        carrier: "Carrier",
        service: "Service",
        zone: "Zone",
        eta: "ETA",
        trackingNumber: "Tracking number",
        trackingLink: "Tracking link",
        openLink: "Open link",
        noShipment: "No shipment data yet",
        internalNotes: "Internal notes",
        internalNotePlaceholder: "Add an internal note for this aftersales case...",
        addNote: "Add note",
        noteAdded: "Internal note added",
        noNotes: "No internal notes yet",
        handlingHistory: "Handling history",
        noHistory: "No aftersales-related history yet",
        historyActor: "Handled by",
        historyActionAftersalesSubmitted: "Aftersales request submitted",
        historyActionAftersalesReviewed: "Aftersales status updated",
        historyActionRefundRequested: "Refund requested",
        historyActionRefundApproved: "Refund approved",
        historyActionRefundRejected: "Refund rejected",
        historyActionOrderNote: "Internal note added",
        historyActionOrderUpdate: "Order updated",
        historyActionOrderCreated: "Order created",
        historyFieldAftersalesType: "Request type",
        historyFieldAftersalesStatus: "Aftersales status",
        historyFieldRefundStatus: "Refund status",
        historyFieldPaymentStatus: "Payment status",
        historyFieldOrderStatus: "Order status",
        historyFieldNote: "Note",
        timeline: "Aftersales timeline",
        timelineHint: "Filter milestones related to aftersales, refund, shipment, or internal handling.",
        searchTimeline: "Search timeline...",
        newest: "Newest",
        oldest: "Oldest",
        filterAll: "All",
        filterAftersales: "Aftersales",
        filterRefund: "Refund",
        filterShipment: "Shipment",
        filterAdmin: "Internal",
        noTimeline: "No matching timeline entries yet.",
        items: "Items",
    },
};

const TIMELINE_FILTER_OPTIONS = ["all", "aftersales", "refund", "shipment", "admin"];

const getTimelineGroup = (type) => {
    const safeType = String(type || "");
    if (safeType.startsWith("aftersales_")) return "aftersales";
    if (safeType.startsWith("refund_")) return "refund";
    if (safeType === "internal_note_added") return "admin";
    if (["shipping_estimated", "shipment_updated", "order_shipping"].includes(safeType)) return "shipment";
    return "order";
};

const getHistoryText = (entry) =>
    [
        entry?.action,
        entry?.note,
        ...(entry?.changes || []).flatMap((change) => [change?.field, change?.from, change?.to]),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

const isAftersalesHistoryEntry = (entry) => {
    const action = String(entry?.action || "").toLowerCase();
    if (action.includes("aftersales") || action.includes("refund") || action.includes("order.note")) return true;
    const fields = (entry?.changes || []).map((change) => String(change?.field || "").toLowerCase());
    if (fields.some((field) => field.startsWith("aftersalesrequest") || field.startsWith("refundrequest") || field.includes("paymentstatus"))) {
        return true;
    }
    const text = getHistoryText(entry);
    return ["aftersales", "refund", "return", "exchange", "order.note"].some((keyword) => text.includes(keyword));
};

const getHistoryActionLabel = (action, t) => {
    const mapping = {
        "aftersales.submitted": t.historyActionAftersalesSubmitted,
        "aftersales.reviewed": t.historyActionAftersalesReviewed,
        "order.aftersales": t.historyActionAftersalesReviewed,
        "refund.requested": t.historyActionRefundRequested,
        "refund.approved": t.historyActionRefundApproved,
        "refund.rejected": t.historyActionRefundRejected,
        "order.note": t.historyActionOrderNote,
        "order.note_added": t.historyActionOrderNote,
        "order.update": t.historyActionOrderUpdate,
        "order.updated": t.historyActionOrderUpdate,
        "order.created": t.historyActionOrderCreated,
    };
    return mapping[action] || action || t.historyActionOrderUpdate;
};

const getHistoryFieldLabel = (field, t) => {
    const mapping = {
        "aftersalesRequest.type": t.historyFieldAftersalesType,
        "aftersalesRequest.status": t.historyFieldAftersalesStatus,
        "refundRequest.status": t.historyFieldRefundStatus,
        paymentStatus: t.historyFieldPaymentStatus,
        status: t.historyFieldOrderStatus,
        note: t.historyFieldNote,
    };
    return mapping[field] || field || "-";
};

const formatHistoryValue = (field, value, lang) => {
    if (field === "aftersalesRequest.type") return getAftersalesRequestTypeLabel(value, lang);
    if (field === "aftersalesRequest.status") return getAftersalesRequestStatusLabel(value, lang);
    if (field === "refundRequest.status") return getRefundRequestStatusLabel(value, lang);
    if (field === "paymentStatus") return getPaymentStatusLabel(value, lang);
    if (field === "status") return getOrderStatusLabel(value, lang);
    return value === null || value === undefined || value === "" ? "—" : String(value);
};

const buildEvidenceName = (item, index) => item?.name || `evidence-${index + 1}`;

export default function OrderAftersalesDetailPage({ lang }) {
    const t = T[lang] || T.vi;
    const navigate = useNavigate();
    const { orderId } = useParams();
    const currentUser = readStoredUserProfile();
    const canUpdateOrders = hasAdminPermission(currentUser, "order:update_status");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [noteSaving, setNoteSaving] = useState(false);
    const [internalNote, setInternalNote] = useState("");
    const [timelineFilter, setTimelineFilter] = useState("all");
    const [timelineSort, setTimelineSort] = useState("newest");
    const [timelineSearch, setTimelineSearch] = useState("");
    const [draft, setDraft] = useState({
        status: "under_review",
        adminNote: "",
    });

    const loadOrder = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOrderById(orderId);
            const nextOrder = response?.data || null;
            setOrder(nextOrder);
            setDraft({
                status: nextOrder?.aftersalesRequest?.status && nextOrder.aftersalesRequest.status !== "none"
                    ? nextOrder.aftersalesRequest.status
                    : "under_review",
                adminNote: nextOrder?.aftersalesRequest?.adminNote || "",
            });
        } catch (error) {
            setOrder(null);
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [orderId, t.loadError]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    useEffect(() => {
        const unsubscribe = subscribeRealtime((payload) => {
            const eventOrderId = String(payload?.data?.orderId || "");
            if (!eventOrderId || eventOrderId !== String(orderId || "")) return;
            loadOrder();
        });
        return unsubscribe;
    }, [loadOrder, orderId]);

    const hasChanges = useMemo(() => {
        const currentStatus = order?.aftersalesRequest?.status && order.aftersalesRequest.status !== "none"
            ? order.aftersalesRequest.status
            : "under_review";
        const currentNote = order?.aftersalesRequest?.adminNote || "";
        return draft.status !== currentStatus || draft.adminNote !== currentNote;
    }, [draft.adminNote, draft.status, order?.aftersalesRequest?.adminNote, order?.aftersalesRequest?.status]);

    const timelineItems = useMemo(() => {
        const items = Array.isArray(order?.timeline) ? [...order.timeline] : [];
        const keyword = timelineSearch.trim().toLowerCase();

        return items
            .filter((entry) => {
                const group = getTimelineGroup(entry?.type);
                if (timelineFilter !== "all" && group !== timelineFilter) {
                    return false;
                }
                if (group === "order") return false;
                if (!keyword) return true;
                const text = [entry?.type, entry?.note, entry?.actorName].filter(Boolean).join(" ").toLowerCase();
                return text.includes(keyword);
            })
            .sort((a, b) => {
                const aTime = new Date(a?.createdAt || 0).getTime();
                const bTime = new Date(b?.createdAt || 0).getTime();
                return timelineSort === "oldest" ? aTime - bTime : bTime - aTime;
            });
    }, [order?.timeline, timelineFilter, timelineSearch, timelineSort]);

    const relatedHistory = useMemo(() => {
        const items = Array.isArray(order?.editHistory) ? order.editHistory.filter(isAftersalesHistoryEntry) : [];
        return items.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    }, [order?.editHistory]);

    const internalNotes = useMemo(() => {
        const items = Array.isArray(order?.internalNotes) ? [...order.internalNotes] : [];
        return items.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
    }, [order?.internalNotes]);

    const handleSaveAftersales = async () => {
        if (!canUpdateOrders || !order?._id || !order?.aftersalesRequest || order.aftersalesRequest.status === "none") return;
        if (!hasChanges) {
            toast.message(t.noChanges);
            return;
        }

        setSaving(true);
        try {
            const response = await reviewOrderAftersalesRequest(order._id, {
                status: draft.status,
                adminNote: draft.adminNote,
            });
            const nextOrder = response?.data || order;
            setOrder(nextOrder);
            setDraft({
                status: nextOrder?.aftersalesRequest?.status || draft.status,
                adminNote: nextOrder?.aftersalesRequest?.adminNote || "",
            });
            toast.success(response?.message || t.saveSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async () => {
        if (!canUpdateOrders || !order?._id) return;
        const note = String(internalNote || "").trim();
        if (!note) return;

        setNoteSaving(true);
        try {
            const response = await addOrderInternalNote(order._id, note);
            setOrder(response?.data || order);
            setInternalNote("");
            toast.success(response?.message || t.noteAdded);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setNoteSaving(false);
        }
    };

    const filterLabelMap = {
        all: t.filterAll,
        aftersales: t.filterAftersales,
        refund: t.filterRefund,
        shipment: t.filterShipment,
        admin: t.filterAdmin,
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                    {t.loading}
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
                <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
                    {t.notFound}
                </div>
            </div>
        );
    }

    const aftersalesRequest = order?.aftersalesRequest || {};

    return (
        <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => navigate("/admin/orders")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    {t.backToOrders}
                </button>
                <button
                    type="button"
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    {t.backToOrderDetail}
                </button>
            </div>

            <div className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary">
                            <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                            {t.title}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">{order.orderNumber}</h1>
                            <p className="mt-2 max-w-3xl text-sm text-slate-500">{t.subtitle}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(aftersalesRequest.status || "none")}`}>
                                {getAftersalesRequestStatusLabel(aftersalesRequest.status || "none", lang)}
                            </span>
                            {aftersalesRequest.type ? (
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                    {getAftersalesRequestTypeLabel(aftersalesRequest.type, lang)}
                                </span>
                            ) : null}
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {t.total}: {formatCurrency(order.totalAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:min-w-72">
                        <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{t.items}</div>
                        <div className="mt-3 space-y-3">
                            {(order.items || []).map((item, index) => (
                                <div key={`${item?.productId || "item"}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={item?.image || "https://via.placeholder.com/72x72?text=Item"}
                                            alt={item?.name || "item"}
                                            className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold text-slate-900">{item?.name || "-"}</div>
                                            <div className="mt-1 text-sm text-slate-500">{item?.variant || "-"}</div>
                                            <div className="mt-2 text-sm font-semibold text-slate-900">
                                                {formatCurrency(item?.price || 0)} x {item?.quantity || 0}
                                            </div>
                                        </div>
                                        <div className="text-sm font-black text-slate-900">{formatCurrency(item?.lineTotal || 0)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {aftersalesRequest?.status && aftersalesRequest.status !== "none" ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)]">
                    <div className="space-y-6">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black tracking-tight text-slate-900">{t.requestOverview}</h2>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    {t.openOrder}
                                </button>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.requestType}</div>
                                    <div className="mt-2 text-base font-black text-slate-900">{getAftersalesRequestTypeLabel(aftersalesRequest.type, lang)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.requestStatus}</div>
                                    <div className="mt-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(aftersalesRequest.status)}`}>
                                            {getAftersalesRequestStatusLabel(aftersalesRequest.status, lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    <div className="space-y-3">
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">{t.requestedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(aftersalesRequest.requestedAt, lang) || "—"}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">{t.reviewedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(aftersalesRequest.reviewedAt, lang) || "—"}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">{t.completedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(aftersalesRequest.completedAt, lang) || "—"}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">{t.requestedBy}</span><span className="text-right font-semibold text-slate-900">{aftersalesRequest?.requestedBy?.name || aftersalesRequest?.requestedBy?.email || order.customer?.name || "—"}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-slate-500">{t.reviewedBy}</span><span className="text-right font-semibold text-slate-900">{aftersalesRequest?.reviewedBy?.name || aftersalesRequest?.reviewedBy?.email || "—"}</span></div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.customerReason}</div>
                                            <div className="mt-2 whitespace-pre-wrap break-words font-semibold text-slate-900">{aftersalesRequest.reason || "—"}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.customerNote}</div>
                                            <div className="mt-2 whitespace-pre-wrap break-words font-semibold text-slate-900">{aftersalesRequest.customerNote || "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="mb-3 text-sm font-bold text-slate-900">{t.evidence}</div>
                                {(aftersalesRequest.evidence || []).length ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {aftersalesRequest.evidence.map((item, index) => (
                                            <a
                                                key={`${item?.url || "evidence"}-${index}`}
                                                href={item?.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                                            >
                                                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                                                    {String(item?.mimeType || "").startsWith("image/") ? (
                                                        <img src={item.url} alt={buildEvidenceName(item, index)} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">{buildEvidenceName(item, index)}</div>
                                                    )}
                                                </div>
                                                <div className="mt-3 truncate text-sm font-semibold text-slate-900">{buildEvidenceName(item, index)}</div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t.noEvidence}</div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900">{t.timeline}</h2>
                                    <p className="mt-2 text-sm text-slate-500">{t.timelineHint}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <input
                                        value={timelineSearch}
                                        onChange={(event) => setTimelineSearch(event.target.value)}
                                        placeholder={t.searchTimeline}
                                        className="h-11 min-w-60 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <select
                                        value={timelineSort}
                                        onChange={(event) => setTimelineSort(event.target.value)}
                                        className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="newest">{t.newest}</option>
                                        <option value="oldest">{t.oldest}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {TIMELINE_FILTER_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setTimelineFilter(option)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                            timelineFilter === option
                                                ? "bg-primary text-white shadow-sm shadow-primary/20"
                                                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        {filterLabelMap[option]}
                                    </button>
                                ))}
                            </div>

                            {timelineItems.length ? (
                                <div className="mt-5 space-y-3">
                                    {timelineItems.map((entry, index) => {
                                        const meta = getOrderTimelineMeta(entry?.type, lang);
                                        const group = getTimelineGroup(entry?.type);
                                        return (
                                            <div key={`${order._id}-timeline-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                                                    <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-slate-900">{meta.label}</span>
                                                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-600">{filterLabelMap[group] || group}</span>
                                                            </div>
                                                            {entry?.note ? <div className="mt-1 break-words text-sm text-slate-500">{formatOrderTimelineNote(entry.note, lang)}</div> : null}
                                                            {entry?.actorName ? <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{entry.actorName}</div> : null}
                                                        </div>
                                                        <div className="text-xs font-semibold text-slate-400">{formatDateTime(entry?.createdAt, lang)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                    {t.noTimeline}
                                </div>
                            )}
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black tracking-tight text-slate-900">{t.internalNotes}</h2>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{internalNotes.length}</span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {internalNotes.length ? internalNotes.map((item, index) => (
                                    <div key={`${order._id}-note-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-900">{item?.authorName || item?.author?.name || item?.author?.email || "-"}</div>
                                                <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{item?.note}</div>
                                            </div>
                                            <div className="shrink-0 text-xs font-semibold text-slate-400">{formatDateTime(item?.createdAt, lang)}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t.noNotes}</div>
                                )}

                                {canUpdateOrders ? (
                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <textarea
                                            value={internalNote}
                                            onChange={(event) => setInternalNote(event.target.value)}
                                            rows={3}
                                            placeholder={t.internalNotePlaceholder}
                                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddNote}
                                            disabled={noteSaving || !String(internalNote || "").trim()}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{noteSaving ? "progress_activity" : "note_add"}</span>
                                            {noteSaving ? t.saving : t.addNote}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight text-slate-900">{t.handling}</h2>
                            <div className="mt-5 space-y-3">
                                <select
                                    value={draft.status}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                                    disabled={!canUpdateOrders}
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    {AFTERSALES_REQUEST_STATUS_OPTIONS.filter((option) => option !== "none").map((option) => (
                                        <option key={option} value={option}>
                                            {getAftersalesRequestStatusLabel(option, lang)}
                                        </option>
                                    ))}
                                </select>
                                <textarea
                                    value={draft.adminNote}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, adminNote: event.target.value }))}
                                    rows={5}
                                    disabled={!canUpdateOrders}
                                    placeholder={t.adminNotePlaceholder}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveAftersales}
                                    disabled={!canUpdateOrders || saving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{saving ? "progress_activity" : "save"}</span>
                                    {saving ? t.saving : t.save}
                                </button>
                            </div>
                        </section>
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight text-slate-900">{t.orderContext}</h2>
                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.orderNumber}</span><span className="text-right font-semibold text-slate-900">{order.orderNumber}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.orderStatus}</span><span className="text-right font-semibold text-slate-900">{getOrderStatusLabel(order.status, lang)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.paymentStatus}</span><span className="text-right font-semibold text-slate-900">{getPaymentStatusLabel(order.paymentStatus, lang)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.paymentMethod}</span><span className="text-right font-semibold text-slate-900">{getPaymentMethodLabel(order.paymentMethod, lang)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.refundStatus}</span><span className="text-right font-semibold text-slate-900">{getRefundRequestStatusLabel(order?.refundRequest?.status || "none", lang)}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.total}</span><span className="text-right text-lg font-black text-slate-900">{formatCurrency(order.totalAmount)}</span></div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight text-slate-900">{t.customerInfo}</h2>
                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.customerName}</span><span className="text-right font-semibold text-slate-900">{order?.customer?.name || "-"}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.email}</span><span className="text-right font-semibold text-slate-900">{order?.customer?.email || "-"}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.phone}</span><span className="text-right font-semibold text-slate-900">{order?.customer?.phone || "-"}</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-500">{t.address}</span><span className="text-right font-semibold text-slate-900">{order?.customer?.address || "-"}</span></div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-black tracking-tight text-slate-900">{t.shipment}</h2>
                            {order?.shipment?.carrier || order?.shipment?.trackingNumber || order?.shipment?.trackingUrl ? (
                                <div className="mt-5 space-y-3 text-sm">
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t.carrier}</span><span className="text-right font-semibold text-slate-900">{order?.shipment?.carrier || "—"}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t.service}</span><span className="text-right font-semibold text-slate-900">{order?.shipment?.service || "—"}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t.zone}</span><span className="text-right font-semibold text-slate-900">{getShippingZoneLabel(order?.shipment?.zone, lang) || "—"}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t.eta}</span><span className="text-right font-semibold text-slate-900">{formatShippingEta(order?.shipment?.estimatedMinDays, order?.shipment?.estimatedMaxDays, lang) || "—"}</span></div>
                                    <div className="flex justify-between gap-4"><span className="text-slate-500">{t.trackingNumber}</span><span className="text-right font-semibold text-slate-900">{order?.shipment?.trackingNumber || "—"}</span></div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">{t.trackingLink}</span>
                                        {order?.shipment?.trackingUrl ? (
                                            <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:text-blue-700">
                                                {t.openLink}
                                            </a>
                                        ) : (
                                            <span className="text-right font-semibold text-slate-900">—</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t.noShipment}</div>
                            )}
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-black tracking-tight text-slate-900">{t.handlingHistory}</h2>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{relatedHistory.length}</span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {relatedHistory.length ? relatedHistory.map((entry, index) => (
                                    <div key={`${order._id}-history-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-900">{getHistoryActionLabel(entry?.action, t)}</div>
                                                <div className="mt-1 text-sm text-slate-500">
                                                    {t.historyActor}: {entry?.actorName || entry?.actor?.name || entry?.actor?.email || "-"}
                                                </div>
                                                {entry?.note ? <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{entry.note}</div> : null}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-400">{formatDateTime(entry?.createdAt, lang)}</div>
                                        </div>
                                        {(entry?.changes || []).length ? (
                                            <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                                {entry.changes.map((change, changeIndex) => (
                                                    <div key={`${entry?.action || "change"}-${changeIndex}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                                        <div className="font-semibold text-slate-800">{getHistoryFieldLabel(change?.field, t)}</div>
                                                        <div className="mt-1 text-slate-500">
                                                            {formatHistoryValue(change?.field, change?.from, lang)} → {formatHistoryValue(change?.field, change?.to, lang)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{t.noHistory}</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                    {t.noAftersales}
                </div>
            )}
        </div>
    );
}
