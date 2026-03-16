import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
    addOrderInternalNote,
    getOrderById,
    reviewOrderAftersalesRequest,
    reviewOrderRefundRequest,
    updateOrderStatus,
} from "../../services/orderApi";
import { subscribeRealtime } from "../../services/realtime";
import { hasAdminPermission } from "../../utils/adminAccess";
import {
    AFTERSALES_REQUEST_STATUS_OPTIONS,
    formatCurrency,
    formatDateTime,
    getAftersalesRequestStatusClass,
    getAftersalesRequestStatusLabel,
    getAftersalesRequestTypeLabel,
    getCheckoutStatusClass,
    getCheckoutStatusLabel,
    getOrderStatusClass,
    getOrderStatusLabel,
    getOrderTimelineMeta,
    getPaymentMethodLabel,
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
        back: "Quay lại",
        title: "Chi tiết đơn hàng",
        subtitle: "Theo dõi đầy đủ trạng thái, hậu mãi, vận chuyển và lịch sử xử lý của đơn hàng.",
        loading: "Đang tải chi tiết đơn hàng...",
        loadError: "Không thể tải chi tiết đơn hàng",
        notFound: "Không tìm thấy đơn hàng",
        total: "Tổng cộng",
        save: "Lưu",
        saving: "Đang lưu...",
        noChanges: "Không có thay đổi để lưu",
        saveSuccess: "Cập nhật đơn hàng thành công",
        printInvoice: "In hóa đơn",
        printShippingSlip: "In phiếu giao",
        items: "Sản phẩm",
        customer: "Khách hàng",
        paymentSummary: "Tóm tắt thanh toán",
        shipment: "Vận chuyển",
        orderControl: "Điều khiển đơn hàng",
        refund: "Hoàn tiền",
        aftersales: "Hậu mãi",
        internalNotes: "Ghi chú nội bộ",
        editHistory: "Lịch sử chỉnh sửa",
        historyActor: "Người xử lý",
        historyActionOrderCreated: "Tạo đơn hàng",
        historyActionOrderUpdate: "Cập nhật đơn hàng",
        historyActionOrderNote: "Thêm ghi chú nội bộ",
        historyActionRefundRequested: "Yêu cầu hoàn tiền",
        historyActionRefundApproved: "Duyệt hoàn tiền",
        historyActionRefundRejected: "Từ chối hoàn tiền",
        historyActionAftersalesSubmitted: "Khách gửi yêu cầu hậu mãi",
        historyActionAftersalesReviewed: "Cập nhật trạng thái hậu mãi",
        historyActionLoyaltyAwarded: "Cộng điểm thưởng",
        historyActionLoyaltyReversed: "Điều chỉnh điểm thưởng",
        historyFieldOrderStatus: "Trạng thái đơn",
        historyFieldPaymentStatus: "Trạng thái thanh toán",
        historyFieldCheckoutStatus: "Tiến trình thanh toán",
        historyFieldRefundStatus: "Trạng thái hoàn tiền",
        historyFieldAftersalesStatus: "Trạng thái hậu mãi",
        historyFieldAftersalesType: "Loại yêu cầu",
        historyFieldNote: "Ghi chú",
        historyFieldLoyaltyAwardedPoints: "Điểm cộng",
        historyFieldLoyaltyReversedPoints: "Điểm đã điều chỉnh",
        historyFieldMemberTier: "Hạng thành viên",
        loyalty: "Điểm thưởng",
        createdAt: "Ngày tạo",
        customerName: "Khách hàng",
        email: "Email",
        phone: "Số điện thoại",
        address: "Địa chỉ",
        note: "Ghi chú",
        subtotal: "Tạm tính",
        discount: "Giảm giá",
        shippingFee: "Phí vận chuyển",
        paymentMethod: "Phương thức thanh toán",
        paymentStatus: "Trạng thái thanh toán",
        checkoutStatus: "Tiến trình thanh toán",
        carrier: "Đơn vị vận chuyển",
        service: "Dịch vụ",
        zone: "Khu vực",
        eta: "Dự kiến giao",
        shippedAt: "Ngày gửi hàng",
        deliveredAt: "Ngày giao hàng",
        trackingNumber: "Mã vận đơn",
        trackingLink: "Liên kết theo dõi",
        trackingOpen: "Mở liên kết",
        noShipment: "Chưa có dữ liệu vận chuyển",
        orderStatus: "Trạng thái đơn",
        refundStatus: "Trạng thái hoàn tiền",
        refundReason: "Lý do hoàn tiền",
        refundNote: "Ghi chú xử lý",
        approveRefund: "Duyệt hoàn tiền",
        rejectRefund: "Từ chối hoàn tiền",
        refundApprovePrompt: "Ghi chú hoàn tiền (không bắt buộc)",
        refundRejectPrompt: "Lý do từ chối hoàn tiền (không bắt buộc)",
        refundApproveSuccess: "Đã duyệt yêu cầu hoàn tiền",
        refundRejectSuccess: "Đã từ chối yêu cầu hoàn tiền",
        noRefund: "Chưa có yêu cầu hoàn tiền",
        aftersalesType: "Loại yêu cầu",
        aftersalesStatus: "Trạng thái hậu mãi",
        customerReason: "Lý do khách gửi",
        customerNote: "Mô tả thêm",
        adminNote: "Ghi chú nội bộ hậu mãi",
        requestedAt: "Ngày gửi yêu cầu",
        reviewedAt: "Ngày xem xét",
        completedAt: "Ngày hoàn tất",
        evidence: "Bằng chứng đính kèm",
        aftersalesPlaceholder: "Nhập ghi chú xử lý hậu mãi...",
        noAftersales: "Chưa có yêu cầu hậu mãi",
        saveAftersales: "Cập nhật hậu mãi",
        aftersalesUpdated: "Đã cập nhật yêu cầu hậu mãi",
        internalNotePlaceholder: "Thêm ghi chú nội bộ cho bộ phận xử lý...",
        addNote: "Thêm ghi chú",
        noteAdded: "Đã thêm ghi chú nội bộ",
        noNotes: "Chưa có ghi chú nội bộ",
        noHistory: "Chưa có lịch sử chỉnh sửa",
        timeline: "Hành trình đơn hàng",
        timelineHint: "Lọc theo nhóm sự kiện và tìm trong ghi chú hoặc người xử lý.",
        searchTimeline: "Tìm trong timeline...",
        newest: "Mới nhất",
        oldest: "Cũ nhất",
        all: "Tất cả",
        orderGroup: "Đơn hàng",
        paymentGroup: "Thanh toán",
        shipmentGroup: "Vận chuyển",
        refundGroup: "Hoàn tiền",
        aftersalesGroup: "Hậu mãi",
        loyaltyGroup: "Điểm thưởng",
        adminGroup: "Nội bộ",
        noTimeline: "Chưa có mốc cập nhật phù hợp.",
        memberTier: "Hạng thành viên",
        awardedPoints: "Điểm cộng",
        reversedPoints: "Điểm đã điều chỉnh",
        lifetimeSnapshot: "Ảnh chụp đơn",
        invoiceTitle: "Hóa đơn đơn hàng",
        shippingSlipTitle: "Phiếu giao hàng",
        requestedBy: "Khách yêu cầu",
        reviewedBy: "Người xử lý",
    },
    en: {
        back: "Back",
        title: "Order detail",
        subtitle: "Review the full order lifecycle, aftersales flow, shipment, and processing history.",
        loading: "Loading order detail...",
        loadError: "Failed to load order detail",
        notFound: "Order not found",
        total: "Total",
        save: "Save",
        saving: "Saving...",
        noChanges: "No changes to save",
        saveSuccess: "Order updated successfully",
        printInvoice: "Print invoice",
        printShippingSlip: "Print shipping slip",
        items: "Items",
        customer: "Customer",
        paymentSummary: "Payment summary",
        shipment: "Shipment",
        orderControl: "Order controls",
        refund: "Refund",
        aftersales: "Aftersales",
        internalNotes: "Internal notes",
        editHistory: "Edit history",
        historyActor: "Handled by",
        historyActionOrderCreated: "Order created",
        historyActionOrderUpdate: "Order updated",
        historyActionOrderNote: "Internal note added",
        historyActionRefundRequested: "Refund requested",
        historyActionRefundApproved: "Refund approved",
        historyActionRefundRejected: "Refund rejected",
        historyActionAftersalesSubmitted: "Aftersales request submitted",
        historyActionAftersalesReviewed: "Aftersales status updated",
        historyActionLoyaltyAwarded: "Loyalty points awarded",
        historyActionLoyaltyReversed: "Loyalty points adjusted",
        historyFieldOrderStatus: "Order status",
        historyFieldPaymentStatus: "Payment status",
        historyFieldCheckoutStatus: "Checkout status",
        historyFieldRefundStatus: "Refund status",
        historyFieldAftersalesStatus: "Aftersales status",
        historyFieldAftersalesType: "Request type",
        historyFieldNote: "Note",
        historyFieldLoyaltyAwardedPoints: "Points awarded",
        historyFieldLoyaltyReversedPoints: "Points adjusted",
        historyFieldMemberTier: "Member tier",
        loyalty: "Loyalty",
        createdAt: "Created at",
        customerName: "Customer",
        email: "Email",
        phone: "Phone",
        address: "Address",
        note: "Note",
        subtotal: "Subtotal",
        discount: "Discount",
        shippingFee: "Shipping fee",
        paymentMethod: "Payment method",
        paymentStatus: "Payment status",
        checkoutStatus: "Checkout status",
        carrier: "Carrier",
        service: "Service",
        zone: "Zone",
        eta: "Estimated delivery",
        shippedAt: "Shipped at",
        deliveredAt: "Delivered at",
        trackingNumber: "Tracking number",
        trackingLink: "Tracking link",
        trackingOpen: "Open link",
        noShipment: "No shipment data yet",
        orderStatus: "Order status",
        refundStatus: "Refund status",
        refundReason: "Refund reason",
        refundNote: "Review note",
        approveRefund: "Approve refund",
        rejectRefund: "Reject refund",
        refundApprovePrompt: "Refund note (optional)",
        refundRejectPrompt: "Refund rejection note (optional)",
        refundApproveSuccess: "Refund request approved",
        refundRejectSuccess: "Refund request rejected",
        noRefund: "No refund request",
        aftersalesType: "Request type",
        aftersalesStatus: "Aftersales status",
        customerReason: "Customer reason",
        customerNote: "Customer note",
        adminNote: "Aftersales admin note",
        requestedAt: "Requested at",
        reviewedAt: "Reviewed at",
        completedAt: "Completed at",
        evidence: "Evidence",
        aftersalesPlaceholder: "Write an update note for aftersales handling...",
        noAftersales: "No aftersales request",
        saveAftersales: "Update aftersales",
        aftersalesUpdated: "Aftersales request updated",
        internalNotePlaceholder: "Add an internal note for operations...",
        addNote: "Add note",
        noteAdded: "Internal note added",
        noNotes: "No internal notes yet",
        noHistory: "No edit history yet",
        timeline: "Order timeline",
        timelineHint: "Filter by event group and search notes or actors.",
        searchTimeline: "Search timeline...",
        newest: "Newest",
        oldest: "Oldest",
        all: "All",
        orderGroup: "Order",
        paymentGroup: "Payment",
        shipmentGroup: "Shipment",
        refundGroup: "Refund",
        aftersalesGroup: "Aftersales",
        loyaltyGroup: "Loyalty",
        adminGroup: "Internal",
        noTimeline: "No matching timeline entries yet.",
        memberTier: "Member tier",
        awardedPoints: "Points awarded",
        reversedPoints: "Points adjusted",
        lifetimeSnapshot: "Order snapshot",
        invoiceTitle: "Order invoice",
        shippingSlipTitle: "Shipping slip",
        requestedBy: "Requested by",
        reviewedBy: "Handled by",
    },
};

const TIMELINE_FILTERS = ["all", "order", "payment", "shipment", "refund", "aftersales", "loyalty", "admin"];

const hasValue = (value) => value || value === 0;

const getTimelineGroup = (type) => {
    const safeType = String(type || "");
    if (safeType.startsWith("payment_")) return "payment";
    if (safeType.startsWith("refund_")) return "refund";
    if (safeType.startsWith("aftersales_")) return "aftersales";
    if (safeType.startsWith("loyalty_")) return "loyalty";
    if (safeType === "internal_note_added") return "admin";
    if (["shipping_estimated", "shipment_updated", "order_shipping"].includes(safeType)) return "shipment";
    return "order";
};

const formatChangeValue = (value) => String(value || "").trim() || "—";

const getHistoryActionLabel = (action, t) => {
    const mapping = {
        "order.created": t.historyActionOrderCreated,
        "order.update": t.historyActionOrderUpdate,
        "order.updated": t.historyActionOrderUpdate,
        "order.note": t.historyActionOrderNote,
        "order.note_added": t.historyActionOrderNote,
        "refund.requested": t.historyActionRefundRequested,
        "refund.approved": t.historyActionRefundApproved,
        "refund.rejected": t.historyActionRefundRejected,
        "aftersales.submitted": t.historyActionAftersalesSubmitted,
        "aftersales.reviewed": t.historyActionAftersalesReviewed,
        "order.aftersales": t.historyActionAftersalesReviewed,
        "order.loyalty_awarded": t.historyActionLoyaltyAwarded,
        "order.loyalty_reversed": t.historyActionLoyaltyReversed,
    };
    return mapping[action] || action || t.historyActionOrderUpdate;
};

const getHistoryFieldLabel = (field, t) => {
    const mapping = {
        status: t.historyFieldOrderStatus,
        paymentStatus: t.historyFieldPaymentStatus,
        checkoutStatus: t.historyFieldCheckoutStatus,
        "refundRequest.status": t.historyFieldRefundStatus,
        "aftersalesRequest.status": t.historyFieldAftersalesStatus,
        "aftersalesRequest.type": t.historyFieldAftersalesType,
        note: t.historyFieldNote,
        "loyalty.awardedPoints": t.historyFieldLoyaltyAwardedPoints,
        "loyalty.reversedPoints": t.historyFieldLoyaltyReversedPoints,
        "user.memberTier": t.historyFieldMemberTier,
    };
    return mapping[field] || field || "-";
};

const formatHistoryValue = (field, value, lang) => {
    if (field === "status") return getOrderStatusLabel(value, lang);
    if (field === "paymentStatus") return getPaymentStatusLabel(value, lang);
    if (field === "checkoutStatus") return getCheckoutStatusLabel(value, lang);
    if (field === "refundRequest.status") return getRefundRequestStatusLabel(value, lang);
    if (field === "aftersalesRequest.status") return getAftersalesRequestStatusLabel(value, lang);
    if (field === "aftersalesRequest.type") return getAftersalesRequestTypeLabel(value, lang);
    return formatChangeValue(value);
};

const formatHistoryChange = (action, change, lang) => {
    const field = change?.field || "";
    const baseFrom = formatHistoryValue(field, change?.from, lang);
    const baseTo = formatHistoryValue(field, change?.to, lang);
    if (action === "order.loyalty_reversed" && field === "loyalty.reversedPoints") {
        return { from: baseTo, to: baseFrom };
    }
    return { from: baseFrom, to: baseTo };
};

const buildEvidencePreviewName = (item, index) => item?.name || `evidence-${index + 1}`;

const buildPrintStyles = () => `
    <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1, h2, h3 { margin: 0 0 12px; }
        .muted { color: #64748b; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
        .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border-bottom: 1px solid #e2e8f0; text-align: left; padding: 10px 0; }
        .right { text-align: right; }
        .section { margin-top: 24px; }
        .total { font-size: 20px; font-weight: 700; }
    </style>
`;

const openPrintWindow = (title, html) => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                ${buildPrintStyles()}
            </head>
            <body>${html}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};

export default function OrderDetailPage({ lang }) {
    const t = T[lang] || T.vi;
    const navigate = useNavigate();
    const { orderId } = useParams();
    const currentUser = readStoredUserProfile();
    const canUpdateOrders = hasAdminPermission(currentUser, "order:update_status");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refundAction, setRefundAction] = useState("");
    const [timelineFilter, setTimelineFilter] = useState("all");
    const [timelineSort, setTimelineSort] = useState("newest");
    const [timelineSearch, setTimelineSearch] = useState("");
    const [internalNote, setInternalNote] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);
    const [aftersalesSaving, setAftersalesSaving] = useState(false);
    const [draft, setDraft] = useState({
        status: "pending",
        paymentStatus: "pending",
        shipment: { carrier: "", trackingNumber: "", trackingUrl: "" },
    });
    const [aftersalesDraft, setAftersalesDraft] = useState({
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
                status: nextOrder?.status || "pending",
                paymentStatus: nextOrder?.paymentStatus || "pending",
                shipment: {
                    carrier: nextOrder?.shipment?.carrier || "",
                    trackingNumber: nextOrder?.shipment?.trackingNumber || "",
                    trackingUrl: nextOrder?.shipment?.trackingUrl || "",
                },
            });
            setAftersalesDraft({
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
        if (!order) return false;
        return (
            draft.status !== order.status
            || draft.paymentStatus !== order.paymentStatus
            || (draft.shipment?.carrier || "") !== (order?.shipment?.carrier || "")
            || (draft.shipment?.trackingNumber || "") !== (order?.shipment?.trackingNumber || "")
            || (draft.shipment?.trackingUrl || "") !== (order?.shipment?.trackingUrl || "")
        );
    }, [draft, order]);

    const timelineItems = useMemo(() => {
        const items = Array.isArray(order?.timeline) ? [...order.timeline] : [];
        const keyword = timelineSearch.trim().toLowerCase();
        return items
            .sort((a, b) => {
                const aTime = new Date(a?.createdAt || 0).getTime();
                const bTime = new Date(b?.createdAt || 0).getTime();
                return timelineSort === "oldest" ? aTime - bTime : bTime - aTime;
            })
            .filter((entry) => {
                if (timelineFilter !== "all" && getTimelineGroup(entry?.type) !== timelineFilter) {
                    return false;
                }
                if (!keyword) return true;
                const meta = getOrderTimelineMeta(entry?.type, lang);
                const text = [
                    meta.label,
                    formatOrderTimelineNote(entry?.note, lang),
                    entry?.actorName,
                    entry?.type,
                ].filter(Boolean).join(" ").toLowerCase();
                return text.includes(keyword);
            });
    }, [lang, order?.timeline, timelineFilter, timelineSearch, timelineSort]);

    const handleSave = async () => {
        if (!canUpdateOrders || !order) return;
        if (!hasChanges) {
            toast.message(t.noChanges);
            return;
        }

        setSaving(true);
        try {
            const response = await updateOrderStatus(order._id, {
                status: draft.status,
                paymentStatus: draft.paymentStatus,
                shipment: draft.shipment,
            });
            const nextOrder = response?.data || order;
            setOrder(nextOrder);
            setDraft({
                status: nextOrder.status,
                paymentStatus: nextOrder.paymentStatus,
                shipment: {
                    carrier: nextOrder?.shipment?.carrier || "",
                    trackingNumber: nextOrder?.shipment?.trackingNumber || "",
                    trackingUrl: nextOrder?.shipment?.trackingUrl || "",
                },
            });
            toast.success(response?.message || t.saveSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setSaving(false);
        }
    };

    const handleRefundReview = async (action) => {
        if (!canUpdateOrders || !order?._id) return;
        const reviewNote = window.prompt(
            action === "approve" ? t.refundApprovePrompt : t.refundRejectPrompt,
            order?.refundRequest?.reviewNote || ""
        );
        if (reviewNote === null) return;

        setRefundAction(action);
        try {
            const response = await reviewOrderRefundRequest(order._id, action, reviewNote);
            setOrder(response?.data || order);
            toast.success(action === "approve" ? t.refundApproveSuccess : t.refundRejectSuccess);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setRefundAction("");
        }
    };

    const handleAddInternalNote = async () => {
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

    const handleUpdateAftersales = async () => {
        if (!canUpdateOrders || !order?._id || !order?.aftersalesRequest || order.aftersalesRequest.status === "none") return;

        setAftersalesSaving(true);
        try {
            const response = await reviewOrderAftersalesRequest(order._id, {
                status: aftersalesDraft.status,
                adminNote: aftersalesDraft.adminNote,
            });
            const nextOrder = response?.data || order;
            setOrder(nextOrder);
            setAftersalesDraft({
                status: nextOrder?.aftersalesRequest?.status || aftersalesDraft.status,
                adminNote: nextOrder?.aftersalesRequest?.adminNote || "",
            });
            toast.success(response?.message || t.aftersalesUpdated);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setAftersalesSaving(false);
        }
    };

    const handlePrintInvoice = () => {
        if (!order) return;
        const itemsHtml = (order.items || [])
            .map((item) => `
                <tr>
                    <td>${item?.name || "-"}</td>
                    <td>${item?.variant || "-"}</td>
                    <td class="right">${item?.quantity || 0}</td>
                    <td class="right">${formatCurrency(item?.price || 0)}</td>
                    <td class="right">${formatCurrency(item?.lineTotal || 0)}</td>
                </tr>
            `)
            .join("");

        openPrintWindow(
            `${t.invoiceTitle} ${order.orderNumber}`,
            `
                <h1>${t.invoiceTitle}</h1>
                <div class="muted">${order.orderNumber}</div>
                <div class="grid section">
                    <div class="card">
                        <h3>${t.customer}</h3>
                        <div>${order?.customer?.name || "-"}</div>
                        <div>${order?.customer?.email || "-"}</div>
                        <div>${order?.customer?.phone || "-"}</div>
                        <div>${order?.customer?.address || "-"}</div>
                    </div>
                    <div class="card">
                        <h3>${t.paymentSummary}</h3>
                        <div>${t.createdAt}: ${formatDateTime(order.createdAt, lang)}</div>
                        <div>${t.paymentMethod}: ${getPaymentMethodLabel(order.paymentMethod, lang)}</div>
                        <div>${t.paymentStatus}: ${getPaymentStatusLabel(order.paymentStatus, lang)}</div>
                        <div>${t.orderStatus}: ${getOrderStatusLabel(order.status, lang)}</div>
                    </div>
                </div>
                <div class="section">
                    <table>
                        <thead>
                            <tr>
                                <th>${t.items}</th>
                                <th>Variant</th>
                                <th class="right">Qty</th>
                                <th class="right">${t.subtotal}</th>
                                <th class="right">${t.total}</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>
                <div class="section card">
                    <div>${t.subtotal}: ${formatCurrency(order.subtotal)}</div>
                    <div>${t.discount}: ${formatCurrency(order.discountAmount || 0)}</div>
                    <div>${t.shippingFee}: ${formatCurrency(order.shippingFee || 0)}</div>
                    <div class="total">${t.total}: ${formatCurrency(order.totalAmount)}</div>
                </div>
            `
        );
    };

    const handlePrintShippingSlip = () => {
        if (!order) return;
        openPrintWindow(
            `${t.shippingSlipTitle} ${order.orderNumber}`,
            `
                <h1>${t.shippingSlipTitle}</h1>
                <div class="muted">${order.orderNumber}</div>
                <div class="grid section">
                    <div class="card">
                        <h3>${t.customer}</h3>
                        <div><strong>${order?.customer?.name || "-"}</strong></div>
                        <div>${order?.customer?.phone || "-"}</div>
                        <div>${order?.customer?.address || "-"}</div>
                    </div>
                    <div class="card">
                        <h3>${t.shipment}</h3>
                        <div>${t.carrier}: ${order?.shipment?.carrier || "-"}</div>
                        <div>${t.service}: ${order?.shipment?.service || "-"}</div>
                        <div>${t.zone}: ${getShippingZoneLabel(order?.shipment?.zone, lang)}</div>
                        <div>${t.trackingNumber}: ${order?.shipment?.trackingNumber || "-"}</div>
                        <div>${t.eta}: ${formatShippingEta(order?.shipment?.estimatedMinDays, order?.shipment?.estimatedMaxDays, lang) || "-"}</div>
                    </div>
                </div>
                <div class="section card">
                    <h3>${t.items}</h3>
                    ${(order.items || [])
                        .map((item) => `<div>${item?.name || "-"} - ${item?.variant || "-"} x ${item?.quantity || 0}</div>`)
                        .join("")}
                </div>
            `
        );
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[1800px] p-5 lg:p-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                    {t.loading}
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-[1800px] p-5 lg:p-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="text-lg font-bold text-slate-900">{t.notFound}</div>
                    <button type="button" onClick={() => navigate("/admin/orders")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {t.back}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1800px] p-5 lg:p-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <button type="button" onClick={() => navigate("/admin/orders")} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {t.back}
                    </button>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">{order.orderNumber}</h1>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusClass(order.status)}`}>{getOrderStatusLabel(order.status, lang)}</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getPaymentStatusClass(order.paymentStatus)}`}>{getPaymentStatusLabel(order.paymentStatus, lang)}</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getCheckoutStatusClass(order.checkoutStatus)}`}>{getCheckoutStatusLabel(order.checkoutStatus, lang)}</span>
                        {order?.refundRequest?.status && order.refundRequest.status !== "none" ? <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getRefundRequestStatusClass(order.refundRequest.status)}`}>{getRefundRequestStatusLabel(order.refundRequest.status, lang)}</span> : null}
                        {order?.aftersalesRequest?.status && order.aftersalesRequest.status !== "none" ? <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(order.aftersalesRequest.status)}`}>{getAftersalesRequestStatusLabel(order.aftersalesRequest.status, lang)}</span> : null}
                    </div>
                    <p className="mt-2 max-w-3xl text-slate-500">{t.subtitle}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={handlePrintInvoice} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        {t.printInvoice}
                    </button>
                    <button type="button" onClick={handlePrintShippingSlip} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        {t.printShippingSlip}
                    </button>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.total}</div>
                        <div className="mt-1 text-2xl font-black text-primary">{formatCurrency(order.totalAmount)}</div>
                    </div>
                    {canUpdateOrders ? (
                        <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                            <span className="material-symbols-outlined text-[18px]">{saving ? "progress_activity" : "save"}</span>
                            {saving ? t.saving : t.save}
                        </button>
                    ) : null}
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black tracking-tight text-slate-900">{t.items}</h2>
                        <div className="mt-4 space-y-4">
                            {(order.items || []).map((item, index) => (
                                <div key={`${order._id}-item-${index}`} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="size-20 overflow-hidden rounded-2xl bg-slate-200">
                                        {item?.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-lg font-bold text-slate-900">{item.name}</div>
                                                <div className="mt-1 text-sm text-slate-500">{item.variant || "-"} • {item.quantity}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-900">{formatCurrency(item.lineTotal)}</div>
                                                <div className="mt-1 text-sm text-slate-500">{formatCurrency(item.price)} × {item.quantity}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-slate-900">{t.timeline}</h2>
                                <p className="mt-1 text-sm text-slate-500">{t.timelineHint}</p>
                            </div>
                            <select value={timelineSort} onChange={(event) => setTimelineSort(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30">
                                <option value="newest">{t.newest}</option>
                                <option value="oldest">{t.oldest}</option>
                            </select>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {TIMELINE_FILTERS.map((filterKey) => (
                                    <button key={filterKey} type="button" onClick={() => setTimelineFilter(filterKey)} className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${timelineFilter === filterKey ? "bg-primary text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                                        {{
                                            all: t.all,
                                            order: t.orderGroup,
                                            payment: t.paymentGroup,
                                            shipment: t.shipmentGroup,
                                            refund: t.refundGroup,
                                            aftersales: t.aftersalesGroup,
                                            loyalty: t.loyaltyGroup,
                                            admin: t.adminGroup,
                                        }[filterKey]}
                                    </button>
                                ))}
                            </div>
                            <input value={timelineSearch} onChange={(event) => setTimelineSearch(event.target.value)} placeholder={t.searchTimeline} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        {timelineItems.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t.noTimeline}</div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {timelineItems.map((entry, index) => {
                                    const meta = getOrderTimelineMeta(entry?.type, lang);
                                    const groupLabel = {
                                        order: t.orderGroup,
                                        payment: t.paymentGroup,
                                        shipment: t.shipmentGroup,
                                        refund: t.refundGroup,
                                        aftersales: t.aftersalesGroup,
                                        loyalty: t.loyaltyGroup,
                                        admin: t.adminGroup,
                                    }[getTimelineGroup(entry?.type)];
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
                                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-600">{groupLabel}</span>
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
                        )}
                    </section>
                </div>
                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-black tracking-tight text-slate-900">{t.aftersales}</h2>
                            {order?.aftersalesRequest?.status && order.aftersalesRequest.status !== "none" ? (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/aftersales/${order._id}`)}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                                    {lang === "vi" ? "Trang hậu mãi" : "Aftersales page"}
                                </button>
                            ) : null}
                        </div>
                        {order?.aftersalesRequest?.status && order.aftersalesRequest.status !== "none" ? (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.aftersalesType}</div>
                                        <div className="mt-2 font-semibold text-slate-900">{getAftersalesRequestTypeLabel(order.aftersalesRequest.type, lang)}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.aftersalesStatus}</div>
                                        <div className="mt-2">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(order.aftersalesRequest.status)}`}>
                                                {getAftersalesRequestStatusLabel(order.aftersalesRequest.status, lang)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                    {hasValue(order?.aftersalesRequest?.reason) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.customerReason}</span><span className="break-words text-right font-semibold text-slate-900">{order.aftersalesRequest.reason}</span></div> : null}
                                    {hasValue(order?.aftersalesRequest?.customerNote) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.customerNote}</span><span className="break-words text-right font-semibold text-slate-900">{order.aftersalesRequest.customerNote}</span></div> : null}
                                    {hasValue(order?.aftersalesRequest?.requestedAt) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.requestedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(order.aftersalesRequest.requestedAt, lang)}</span></div> : null}
                                    {hasValue(order?.aftersalesRequest?.reviewedAt) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.reviewedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(order.aftersalesRequest.reviewedAt, lang)}</span></div> : null}
                                    {hasValue(order?.aftersalesRequest?.completedAt) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.completedAt}</span><span className="text-right font-semibold text-slate-900">{formatDateTime(order.aftersalesRequest.completedAt, lang)}</span></div> : null}
                                </div>
                                <div>
                                    <div className="mb-2 text-sm font-bold text-slate-900">{t.evidence}</div>
                                    {(order?.aftersalesRequest?.evidence || []).length ? (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {order.aftersalesRequest.evidence.map((item, index) => (
                                                <a key={`${item?.url || "evidence"}-${index}`} href={item?.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                                                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                                                        {String(item?.mimeType || "").startsWith("image/") ? <img src={item.url} alt={buildEvidencePreviewName(item, index)} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">{buildEvidencePreviewName(item, index)}</div>}
                                                    </div>
                                                    <div className="mt-3 truncate text-sm font-semibold text-slate-900">{buildEvidencePreviewName(item, index)}</div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">—</div>
                                    )}
                                </div>
                                {canUpdateOrders ? (
                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <select value={aftersalesDraft.status} onChange={(event) => setAftersalesDraft((prev) => ({ ...prev, status: event.target.value }))} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30">
                                            {AFTERSALES_REQUEST_STATUS_OPTIONS.filter((option) => option !== "none").map((option) => <option key={option} value={option}>{getAftersalesRequestStatusLabel(option, lang)}</option>)}
                                        </select>
                                        <textarea value={aftersalesDraft.adminNote} onChange={(event) => setAftersalesDraft((prev) => ({ ...prev, adminNote: event.target.value }))} rows={4} placeholder={t.aftersalesPlaceholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30" />
                                        <button type="button" onClick={handleUpdateAftersales} disabled={aftersalesSaving} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300">
                                            <span className="material-symbols-outlined text-[18px]">{aftersalesSaving ? "progress_activity" : "save"}</span>
                                            {aftersalesSaving ? t.saving : t.saveAftersales}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t.noAftersales}</div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black tracking-tight text-slate-900">{t.refund}</h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-4"><span className="text-slate-500">{t.refundStatus}</span><span className="text-right font-semibold text-slate-900">{getRefundRequestStatusLabel(order?.refundRequest?.status || "none", lang)}</span></div>
                            {hasValue(order?.refundRequest?.reason) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.refundReason}</span><span className="break-words text-right font-semibold text-slate-900">{order.refundRequest.reason}</span></div> : null}
                            {hasValue(order?.refundRequest?.reviewNote) ? <div className="flex justify-between gap-4"><span className="text-slate-500">{t.refundNote}</span><span className="break-words text-right font-semibold text-slate-900">{order.refundRequest.reviewNote}</span></div> : null}
                            {!(order?.refundRequest?.status && order.refundRequest.status !== "none") ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">{t.noRefund}</div> : null}
                            {canUpdateOrders && order?.refundRequest?.status === "pending" ? (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button type="button" onClick={() => handleRefundReview("approve")} disabled={refundAction === "approve" || refundAction === "reject"} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">{refundAction === "approve" ? t.saving : t.approveRefund}</button>
                                    <button type="button" onClick={() => handleRefundReview("reject")} disabled={refundAction === "approve" || refundAction === "reject"} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">{refundAction === "reject" ? t.saving : t.rejectRefund}</button>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-black tracking-tight text-slate-900">{t.loyalty}</h2>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.memberTier}</div><div className="mt-2 text-lg font-black text-slate-900">{order?.loyalty?.tierAfterAward || order?.loyalty?.tierAtAward || "BRONZE"}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.awardedPoints}</div><div className="mt-2 text-lg font-black text-slate-900">{Number(order?.loyalty?.awardedPoints || 0)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.reversedPoints}</div><div className="mt-2 text-lg font-black text-slate-900">{Number(order?.loyalty?.reversedPoints || 0)}</div></div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-widest text-slate-500">{t.lifetimeSnapshot}</div><div className="mt-2 text-lg font-black text-slate-900">{formatCurrency(order.totalAmount)}</div></div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black tracking-tight text-slate-900">{t.internalNotes}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{(order?.internalNotes || []).length}</span></div>
                        <div className="mt-4 space-y-3">
                            {(order?.internalNotes || []).length ? order.internalNotes.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()).map((item, index) => (
                                <div key={`${order._id}-note-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900">{item?.authorName || item?.author?.name || item?.author?.email || "-"}</div>
                                            <div className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">{item?.note}</div>
                                        </div>
                                        <div className="shrink-0 text-xs font-semibold text-slate-400">{formatDateTime(item?.createdAt, lang)}</div>
                                    </div>
                                </div>
                            )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t.noNotes}</div>}
                            {canUpdateOrders ? (
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={3} placeholder={t.internalNotePlaceholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30" />
                                    <button type="button" onClick={handleAddInternalNote} disabled={noteSaving || !String(internalNote || "").trim()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300">
                                        <span className="material-symbols-outlined text-[18px]">{noteSaving ? "progress_activity" : "note_add"}</span>
                                        {noteSaving ? t.saving : t.addNote}
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </section>

                </div>
                <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg font-black tracking-tight text-slate-900">{t.editHistory}</h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{(order?.editHistory || []).length}</span>
                        </div>
                        <div className="mt-4 space-y-3 overflow-x-auto">
                            {(order?.editHistory || []).length ? order.editHistory.slice().sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()).map((entry, index) => (
                                <div key={`${order._id}-history-${index}`} className="min-w-[520px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                                                        {formatHistoryChange(entry?.action, change, lang).from} → {formatHistoryChange(entry?.action, change, lang).to}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{t.noHistory}</div>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
