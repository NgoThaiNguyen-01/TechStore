import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/common/Pagination";
import { getOrders, reviewOrderRefundRequest, updateOrderStatus } from "../../services/orderApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import {
    CHECKOUT_STATUS_OPTIONS,
    formatCurrency,
    formatDateTime,
    getCheckoutStatusClass,
    getCheckoutStatusLabel,
    getOrderStatusClass,
    getOrderStatusLabel,
    getOrderTimelineMeta,
    getPaymentStatusClass,
    getPaymentStatusLabel,
    getRefundRequestStatusClass,
    getRefundRequestStatusLabel,
    ORDER_STATUS_OPTIONS,
    PAYMENT_STATUS_OPTIONS,
} from "../../utils/orderHelpers";
import { formatOrderTimelineNote, formatShippingEta, getShippingZoneLabel } from "../../utils/shippingHelpers";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Quản lý đơn hàng",
        subtitle: "Theo dõi, lọc và cập nhật trạng thái đơn hàng theo thời gian thực.",
        search: "Tìm theo mã đơn, tên khách, email, số điện thoại",
        status: "Trạng thái đơn",
        paymentStatus: "Trạng thái thanh toán",
        checkoutStatus: "Tiến trình thanh toán",
        all: "Tất cả",
        customer: "Khách hàng",
        order: "Đơn hàng",
        createdAt: "Ngày tạo",
        total: "Tổng tiền",
        items: "Sản phẩm",
        address: "Địa chỉ",
        note: "Ghi chú",
        action: "Thao tác",
        save: "Lưu",
        saving: "Đang lưu...",
        loading: "Đang tải đơn hàng...",
        loadError: "Không thể tải danh sách đơn hàng",
        saveSuccess: "Cập nhật đơn hàng thành công",
        noChanges: "Không có thay đổi để lưu",
        empty: "Chưa có đơn hàng nào phù hợp",
        showing: "Hiển thị",
        to: "đến",
        of: "trên",
        results: "đơn hàng",
        previous: "Trước",
        next: "Sau",
        refundStatus: "Trạng thái hoàn tiền",
        refundReason: "Lý do hoàn tiền",
        refundNote: "Ghi chú xử lý",
        approveRefund: "Duyệt",
        rejectRefund: "Từ chối",
        refundApprovePrompt: "Ghi chú hoàn tiền (không bắt buộc)",
        refundRejectPrompt: "Lý do từ chối hoàn tiền (không bắt buộc)",
        refundApproveSuccess: "Đã duyệt yêu cầu hoàn tiền",
        refundRejectSuccess: "Đã từ chối yêu cầu hoàn tiền",
        shipmentTitle: "Vận chuyển",
        carrier: "Đơn vị vận chuyển",
        shippingService: "Dịch vụ",
        shippingZone: "Khu vực",
        shippingEta: "Dự kiến giao",
        trackingNumber: "Mã vận đơn",
        trackingLink: "Liên kết theo dõi",
        shippingFee: "Phí vận chuyển",
        timelineTitle: "Hành trình đơn hàng",
        timelineEmpty: "Chưa có mốc cập nhật nào.",
        noShipment: "Chưa có dữ liệu vận chuyển",
        searchLabel: "Tìm kiếm",
        searchPlaceholder: "Mã đơn, khách hàng, email, số điện thoại",
        trackingOpen: "Mở link",
        subtotalLabel: "Tạm tính",
        viewDetail: "Chi tiết",
        viewAftersales: "Hậu mãi",
    },
    en: {
        title: "Order Management",
        subtitle: "Review, filter, and update order statuses in real time.",
        search: "Search by order number, customer, email, phone",
        status: "Order status",
        paymentStatus: "Payment status",
        checkoutStatus: "Checkout status",
        all: "All",
        customer: "Customer",
        order: "Order",
        createdAt: "Created at",
        total: "Total",
        items: "Items",
        address: "Address",
        note: "Note",
        action: "Action",
        save: "Save",
        saving: "Saving...",
        loading: "Loading orders...",
        loadError: "Failed to load orders",
        saveSuccess: "Order updated successfully",
        noChanges: "No changes to save",
        empty: "No matching orders",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "orders",
        previous: "Previous",
        next: "Next",
        refundStatus: "Refund status",
        refundReason: "Refund reason",
        refundNote: "Review note",
        approveRefund: "Approve",
        rejectRefund: "Reject",
        refundApprovePrompt: "Refund note (optional)",
        refundRejectPrompt: "Refund rejection note (optional)",
        refundApproveSuccess: "Refund request approved",
        refundRejectSuccess: "Refund request rejected",
        shipmentTitle: "Shipment",
        carrier: "Carrier",
        shippingService: "Service",
        shippingZone: "Zone",
        shippingEta: "Estimated delivery",
        trackingNumber: "Tracking number",
        trackingLink: "Tracking link",
        shippingFee: "Shipping fee",
        timelineTitle: "Order timeline",
        timelineEmpty: "No timeline updates yet.",
        noShipment: "No shipment data yet",
        searchLabel: "Search",
        searchPlaceholder: "Order number, customer, email, phone",
        trackingOpen: "Open link",
        subtotalLabel: "Subtotal",
        viewDetail: "Details",
        viewAftersales: "Aftersales",
    },
};

export default function OrdersPage({ lang }) {
    const t = T[lang] || T.vi;
    const navigate = useNavigate();
    const currentUser = readStoredUserProfile();
    const canUpdateOrders = hasAdminPermission(currentUser, "order:update_status");
    const searchLabel = t.searchLabel;
    const searchPlaceholder = t.searchPlaceholder;
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [checkoutStatus, setCheckoutStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: 0 });
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState("");
    const [refundActionId, setRefundActionId] = useState("");
    const [drafts, setDrafts] = useState({});

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const response = await getOrders({
                    page,
                    limit: 8,
                    search: search.trim() || undefined,
                    status: status === "all" ? undefined : status,
                    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
                    checkoutStatus: checkoutStatus === "all" ? undefined : checkoutStatus,
                });
                if (cancelled) return;
                const nextOrders = response?.data || [];
                setOrders(nextOrders);
                setPagination(response?.pagination || { page: 1, totalPages: 0, totalItems: 0 });
                setDrafts(
                    nextOrders.reduce((acc, order) => {
                        acc[order._id] = {
                            status: order.status,
                            paymentStatus: order.paymentStatus,
                            shipment: {
                                carrier: order?.shipment?.carrier || "",
                                trackingNumber: order?.shipment?.trackingNumber || "",
                                trackingUrl: order?.shipment?.trackingUrl || "",
                            },
                        };
                        return acc;
                    }, {})
                );
            } catch (error) {
                if (cancelled) return;
                setOrders([]);
                setPagination({ page: 1, totalPages: 0, totalItems: 0 });
                toast.error(error?.response?.data?.message || t.loadError);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [checkoutStatus, lang, page, paymentStatus, search, status, t.loadError]);

    const updateDraft = (orderId, field, value) => {
        setDrafts((prev) => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                [field]: value,
            },
        }));
    };

    const updateShipmentDraft = (orderId, field, value) => {
        setDrafts((prev) => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                shipment: {
                    ...(prev[orderId]?.shipment || {}),
                    [field]: value,
                },
            },
        }));
    };

    const handleSave = async (order) => {
        if (!canUpdateOrders) return;
        const draft = drafts[order._id];
        if (!draft) return;
        const shipment = draft.shipment || {};
        const shipmentChanged =
            (shipment.carrier || "") !== (order?.shipment?.carrier || "")
            || (shipment.trackingNumber || "") !== (order?.shipment?.trackingNumber || "")
            || (shipment.trackingUrl || "") !== (order?.shipment?.trackingUrl || "");

        if (draft.status === order.status && draft.paymentStatus === order.paymentStatus && !shipmentChanged) {
            toast.message(t.noChanges);
            return;
        }

        setSavingId(order._id);
        try {
            const response = await updateOrderStatus(order._id, {
                status: draft.status,
                paymentStatus: draft.paymentStatus,
                shipment,
            });
            const nextOrder = response?.data;
            setOrders((prev) => prev.map((entry) => (entry._id === order._id ? nextOrder : entry)));
            setDrafts((prev) => ({
                ...prev,
                [order._id]: {
                    status: nextOrder.status,
                    paymentStatus: nextOrder.paymentStatus,
                    shipment: {
                        carrier: nextOrder?.shipment?.carrier || "",
                        trackingNumber: nextOrder?.shipment?.trackingNumber || "",
                        trackingUrl: nextOrder?.shipment?.trackingUrl || "",
                    },
                },
            }));
            toast.success(response?.message || t.saveSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.loadError);
        } finally {
            setSavingId("");
        }
    };

    const handleRefundReview = async (order, action) => {
        if (!canUpdateOrders) return;
        if (!order?._id) return;

        const reviewNote = window.prompt(
            action === "approve" ? t.refundApprovePrompt : t.refundRejectPrompt,
            order?.refundRequest?.reviewNote || ""
        );
        if (reviewNote === null) return;

        const actionKey = `${order._id}:${action}`;
        setRefundActionId(actionKey);
        try {
            const response = await reviewOrderRefundRequest(order._id, action, reviewNote);
            const nextOrder = response?.data;
            if (nextOrder?._id) {
                setOrders((prev) => prev.map((entry) => (entry._id === nextOrder._id ? nextOrder : entry)));
                setDrafts((prev) => ({
                    ...prev,
                    [nextOrder._id]: {
                        status: nextOrder.status,
                        paymentStatus: nextOrder.paymentStatus,
                        shipment: {
                            carrier: nextOrder?.shipment?.carrier || "",
                            trackingNumber: nextOrder?.shipment?.trackingNumber || "",
                            trackingUrl: nextOrder?.shipment?.trackingUrl || "",
                        },
                    },
                }));
            }
            toast.success(action === "approve" ? t.refundApproveSuccess : t.refundRejectSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setRefundActionId("");
        }
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1600px]">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                <p className="text-slate-500">{t.subtitle}</p>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,1.5fr)_repeat(3,minmax(240px,1fr))] xl:items-end">
                    <label className="min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                            {searchLabel}
                        </span>
                        <input
                            value={search}
                            onChange={(event) => {
                                setPage(1);
                                setSearch(event.target.value);
                            }}
                            placeholder={searchPlaceholder}
                            className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </label>

                    <label className="min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t.status}
                        </span>
                        <div>
                            <select
                                value={status}
                                onChange={(event) => {
                                    setPage(1);
                                    setStatus(event.target.value);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="all">{t.all}</option>
                                {ORDER_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {getOrderStatusLabel(option, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <label className="min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t.paymentStatus}
                        </span>
                        <div>
                            <select
                                value={paymentStatus}
                                onChange={(event) => {
                                    setPage(1);
                                    setPaymentStatus(event.target.value);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="all">{t.all}</option>
                                {PAYMENT_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {getPaymentStatusLabel(option, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </label>

                    <label className="min-w-0">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
                            {t.checkoutStatus}
                        </span>
                        <div>
                            <select
                                value={checkoutStatus}
                                onChange={(event) => {
                                    setPage(1);
                                    setCheckoutStatus(event.target.value);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="all">{t.all}</option>
                                {CHECKOUT_STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {getCheckoutStatusLabel(option, lang)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </label>
                </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-slate-500">{t.loading}</div>
                ) : orders.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">{t.empty}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4">{t.order}</th>
                                    <th className="px-6 py-4">{t.customer}</th>
                                    <th className="px-6 py-4">{t.createdAt}</th>
                                    <th className="px-6 py-4">{t.total}</th>
                                    <th className="px-6 py-4">{t.status}</th>
                                    <th className="px-6 py-4">{t.paymentStatus}</th>
                                    <th className="px-6 py-4">{t.checkoutStatus}</th>
                                    <th className="px-6 py-4 text-right">{t.action}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const draft = drafts[order._id] || {
                                        status: order.status,
                                        paymentStatus: order.paymentStatus,
                                        shipment: {
                                            carrier: order?.shipment?.carrier || "",
                                            trackingNumber: order?.shipment?.trackingNumber || "",
                                            trackingUrl: order?.shipment?.trackingUrl || "",
                                        },
                                    };
                                    const timelineItems = Array.isArray(order?.timeline)
                                        ? [...order.timeline].sort(
                                            (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
                                        )
                                        : [];
                                    return (
                                        <tr key={order._id} className="align-top hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-slate-900">{order.orderNumber}</div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusClass(order.status)}`}>
                                                        {getOrderStatusLabel(order.status, lang)}
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusClass(order.paymentStatus)}`}>
                                                        {getPaymentStatusLabel(order.paymentStatus, lang)}
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getCheckoutStatusClass(order.checkoutStatus)}`}>
                                                        {getCheckoutStatusLabel(order.checkoutStatus, lang)}
                                                    </span>
                                                    {order?.refundRequest?.status && order.refundRequest.status !== "none" && (
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRefundRequestStatusClass(order.refundRequest.status)}`}>
                                                            {getRefundRequestStatusLabel(order.refundRequest.status, lang)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-3 text-sm text-slate-500">
                                                    {t.items}: {(order.items || []).length}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-semibold text-slate-900">{order.customer?.name || "-"}</div>
                                                <div className="mt-1 text-sm text-slate-500">{order.customer?.email || "-"}</div>
                                                <div className="mt-1 text-sm text-slate-500">{order.customer?.phone || "-"}</div>
                                                <div className="mt-3 text-sm text-slate-600">{t.address}: {order.customer?.address || "-"}</div>
                                                {order.note && (
                                                    <div className="mt-2 text-sm text-slate-500">{t.note}: {order.note}</div>
                                                )}
                                                {order?.refundRequest?.reason && (
                                                    <div className="mt-2 text-sm text-slate-500">
                                                        {t.refundReason}: <span className="font-medium text-slate-700">{order.refundRequest.reason}</span>
                                                    </div>
                                                )}
                                                {order?.refundRequest?.reviewNote && (
                                                    <div className="mt-2 text-sm text-slate-500">
                                                        {t.refundNote}: <span className="font-medium text-slate-700">{order.refundRequest.reviewNote}</span>
                                                    </div>
                                                )}
                                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                        {t.shipmentTitle}
                                                    </div>
                                                    <div className="mt-3 space-y-2">
                                                        <input
                                                            value={draft.shipment?.carrier || ""}
                                                            onChange={(event) => updateShipmentDraft(order._id, "carrier", event.target.value)}
                                                            disabled={!canUpdateOrders}
                                                            placeholder={t.carrier}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                        />
                                                        <input
                                                            value={draft.shipment?.trackingNumber || ""}
                                                            onChange={(event) => updateShipmentDraft(order._id, "trackingNumber", event.target.value)}
                                                            disabled={!canUpdateOrders}
                                                            placeholder={t.trackingNumber}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                        />
                                                        <input
                                                            value={draft.shipment?.trackingUrl || ""}
                                                            onChange={(event) => updateShipmentDraft(order._id, "trackingUrl", event.target.value)}
                                                            disabled={!canUpdateOrders}
                                                            placeholder={t.trackingLink}
                                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                        />
                                                    </div>
                                                    {order?.shipment?.trackingUrl && (
                                                        <div className="mt-3">
                                                            <a
                                                                href={order.shipment.trackingUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                                {t.trackingOpen}
                                                            </a>
                                                        </div>
                                                    )}
                                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                                        {order?.shipment?.service && (
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-slate-500">{t.shippingService}</span>
                                                                <span className="font-medium text-slate-800">{order.shipment.service}</span>
                                                            </div>
                                                        )}
                                                        {order?.shipment?.zone && (
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-slate-500">{t.shippingZone}</span>
                                                                <span className="font-medium text-slate-800">{getShippingZoneLabel(order.shipment.zone, lang)}</span>
                                                            </div>
                                                        )}
                                                        {(order?.shipment?.estimatedMinDays || order?.shipment?.estimatedMaxDays) && (
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="text-slate-500">{t.shippingEta}</span>
                                                                <span className="font-medium text-slate-800">
                                                                    {formatShippingEta(order.shipment.estimatedMinDays, order.shipment.estimatedMaxDays, lang)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                        {t.timelineTitle}
                                                    </div>
                                                    {timelineItems.length === 0 ? (
                                                        <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                                                            {t.timelineEmpty}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                                                            {timelineItems.map((entry, index) => {
                                                                const meta = getOrderTimelineMeta(entry?.type, lang);
                                                                const formattedNote = formatOrderTimelineNote(entry?.note, lang);
                                                                return (
                                                                    <div key={`${order._id}-timeline-${index}-${entry?.type || "entry"}`} className="flex gap-3">
                                                                        <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                                                                            <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                                                                        </div>
                                                                        <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                                <div className="min-w-0">
                                                                                    <div className="font-semibold text-slate-900">{meta.label}</div>
                                                                                    {formattedNote && (
                                                                                        <div className="mt-1 text-sm text-slate-500 break-words">{formattedNote}</div>
                                                                                    )}
                                                                                    {entry?.actorName && (
                                                                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                                                                            {entry.actorName}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs font-semibold text-slate-400">
                                                                                    {formatDateTime(entry?.createdAt, lang)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                {formatDateTime(order.createdAt, lang)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-lg font-black text-slate-900">{formatCurrency(order.totalAmount)}</div>
                                                <div className="mt-1 text-sm text-slate-500">{formatCurrency(order.subtotal)} {t.subtotalLabel}</div>
                                                <div className="mt-1 text-sm text-slate-500">
                                                    {formatCurrency(order.shippingFee || 0)} {t.shippingFee}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <select
                                                    value={draft.status}
                                                    onChange={(event) => updateDraft(order._id, "status", event.target.value)}
                                                    disabled={!canUpdateOrders}
                                                    className="w-full min-w-40 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    {ORDER_STATUS_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>
                                                            {getOrderStatusLabel(option, lang)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-5">
                                                <select
                                                    value={draft.paymentStatus}
                                                    onChange={(event) => updateDraft(order._id, "paymentStatus", event.target.value)}
                                                    disabled={!canUpdateOrders}
                                                    className="w-full min-w-40 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/30"
                                                >
                                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                        <option key={option} value={option}>
                                                            {getPaymentStatusLabel(option, lang)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getCheckoutStatusClass(order.checkoutStatus)}`}>
                                                    {getCheckoutStatusLabel(order.checkoutStatus, lang)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col items-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        {t.viewDetail}
                                                    </button>
                                                    {order?.aftersalesRequest?.status && order.aftersalesRequest.status !== "none" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/admin/aftersales/${order._id}`)}
                                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                                                            {t.viewAftersales}
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSave(order)}
                                                        disabled={!canUpdateOrders || savingId === order._id}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">
                                                            {savingId === order._id ? "progress_activity" : "save"}
                                                        </span>
                                                        {savingId === order._id ? t.saving : t.save}
                                                    </button>
                                                    {canUpdateOrders && order?.refundRequest?.status === "pending" && (
                                                        <div className="flex flex-wrap justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRefundReview(order, "approve")}
                                                                disabled={refundActionId === `${order._id}:approve` || refundActionId === `${order._id}:reject`}
                                                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {refundActionId === `${order._id}:approve` ? t.saving : t.approveRefund}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRefundReview(order, "reject")}
                                                                disabled={refundActionId === `${order._id}:approve` || refundActionId === `${order._id}:reject`}
                                                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {refundActionId === `${order._id}:reject` ? t.saving : t.rejectRefund}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <Pagination
                        page={pagination.page || page}
                        limit={8}
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
                )}
            </div>
        </div>
    );
}

