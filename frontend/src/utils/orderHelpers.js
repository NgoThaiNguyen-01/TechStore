export const ORDER_STATUS_OPTIONS = [
    "pending",
    "confirmed",
    "processing",
    "packing",
    "shipping",
    "completed",
    "cancelled",
];

export const PAYMENT_METHOD_OPTIONS = ["cod", "bank_transfer"];

export const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];

export const CHECKOUT_STATUS_OPTIONS = [
    "created",
    "awaiting_payment",
    "processing_payment",
    "paid",
    "failed",
    "cancelled",
    "expired",
];

export const REFUND_REQUEST_STATUS_OPTIONS = ["none", "pending", "approved", "rejected"];

export const AFTERSALES_REQUEST_TYPE_OPTIONS = ["refund", "return_refund", "exchange"];

export const AFTERSALES_REQUEST_STATUS_OPTIONS = [
    "none",
    "submitted",
    "under_review",
    "awaiting_return",
    "received",
    "approved",
    "rejected",
    "refund_processing",
    "completed",
];

export const AFTERSALES_SLA_STATUS_OPTIONS = [
    "within_sla",
    "at_risk",
    "overdue",
    "not_tracked",
];

const DEFAULT_BADGE_CLASS = "bg-slate-100 text-slate-700";

const STATUS_META = {
    pending: { label: { vi: "Chờ xác nhận", en: "Pending" }, className: "bg-amber-100 text-amber-700" },
    confirmed: { label: { vi: "Đã xác nhận", en: "Confirmed" }, className: "bg-sky-100 text-sky-700" },
    processing: { label: { vi: "Đang xử lý", en: "Processing" }, className: "bg-indigo-100 text-indigo-700" },
    packing: { label: { vi: "Đang đóng gói", en: "Packing" }, className: "bg-violet-100 text-violet-700" },
    shipping: { label: { vi: "Đang giao", en: "Shipping" }, className: "bg-cyan-100 text-cyan-700" },
    completed: { label: { vi: "Hoàn thành", en: "Completed" }, className: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: { vi: "Đã hủy", en: "Cancelled" }, className: "bg-rose-100 text-rose-700" },
};

const PAYMENT_STATUS_META = {
    pending: { label: { vi: "Chờ thanh toán", en: "Pending" }, className: "bg-amber-100 text-amber-700" },
    paid: { label: { vi: "Đã thanh toán", en: "Paid" }, className: "bg-emerald-100 text-emerald-700" },
    failed: { label: { vi: "Thất bại", en: "Failed" }, className: "bg-rose-100 text-rose-700" },
    refunded: { label: { vi: "Đã hoàn tiền", en: "Refunded" }, className: "bg-slate-200 text-slate-700" },
};

const CHECKOUT_STATUS_META = {
    created: { label: { vi: "Khởi tạo đơn hàng", en: "Created" }, className: "bg-slate-200 text-slate-700" },
    awaiting_payment: { label: { vi: "Chờ thanh toán", en: "Awaiting payment" }, className: "bg-amber-100 text-amber-700" },
    processing_payment: { label: { vi: "Đang xử lý thanh toán", en: "Payment processing" }, className: "bg-sky-100 text-sky-700" },
    paid: { label: { vi: "Thanh toán thành công", en: "Paid successfully" }, className: "bg-emerald-100 text-emerald-700" },
    failed: { label: { vi: "Thanh toán thất bại", en: "Payment failed" }, className: "bg-rose-100 text-rose-700" },
    cancelled: { label: { vi: "Đã hủy thanh toán", en: "Payment cancelled" }, className: "bg-orange-100 text-orange-700" },
    expired: { label: { vi: "Hết hạn thanh toán", en: "Payment expired" }, className: "bg-slate-300 text-slate-700" },
};

const PAYMENT_METHOD_META = {
    cod: { label: { vi: "Thanh toán khi nhận hàng", en: "Cash on delivery" } },
    bank_transfer: { label: { vi: "Thanh toán chuyển khoản", en: "Bank transfer" } },
};

const REFUND_REQUEST_STATUS_META = {
    none: { label: { vi: "Chưa yêu cầu", en: "No request" }, className: DEFAULT_BADGE_CLASS },
    pending: { label: { vi: "Chờ duyệt hoàn tiền", en: "Refund pending" }, className: "bg-orange-100 text-orange-700" },
    approved: { label: { vi: "Đã duyệt hoàn tiền", en: "Refund approved" }, className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: { vi: "Từ chối hoàn tiền", en: "Refund rejected" }, className: "bg-rose-100 text-rose-700" },
};

const AFTERSALES_REQUEST_TYPE_META = {
    refund: { label: { vi: "Hoàn tiền", en: "Refund" } },
    return_refund: { label: { vi: "Trả hàng và hoàn tiền", en: "Return and refund" } },
    exchange: { label: { vi: "Đổi hàng", en: "Exchange" } },
};

const AFTERSALES_REQUEST_STATUS_META = {
    none: { label: { vi: "Chưa yêu cầu", en: "No request" }, className: DEFAULT_BADGE_CLASS },
    submitted: { label: { vi: "Đã gửi yêu cầu", en: "Submitted" }, className: "bg-orange-100 text-orange-700" },
    under_review: { label: { vi: "Đang xem xét", en: "Under review" }, className: "bg-sky-100 text-sky-700" },
    awaiting_return: { label: { vi: "Chờ khách gửi hàng", en: "Awaiting return" }, className: "bg-violet-100 text-violet-700" },
    received: { label: { vi: "Đã nhận hàng hoàn", en: "Return received" }, className: "bg-indigo-100 text-indigo-700" },
    approved: { label: { vi: "Đã duyệt", en: "Approved" }, className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: { vi: "Từ chối", en: "Rejected" }, className: "bg-rose-100 text-rose-700" },
    refund_processing: { label: { vi: "Đang hoàn tiền", en: "Refund processing" }, className: "bg-amber-100 text-amber-700" },
    completed: { label: { vi: "Hoàn tất hậu mãi", en: "Completed" }, className: "bg-emerald-100 text-emerald-700" },
};

const AFTERSALES_SLA_STATUS_META = {
    within_sla: { label: { vi: "Trong SLA", en: "Within SLA" }, className: "bg-emerald-100 text-emerald-700" },
    at_risk: { label: { vi: "Sắp quá SLA", en: "At risk" }, className: "bg-amber-100 text-amber-700" },
    overdue: { label: { vi: "Quá SLA", en: "Overdue" }, className: "bg-rose-100 text-rose-700" },
    not_tracked: { label: { vi: "Không tính SLA", en: "Not tracked" }, className: DEFAULT_BADGE_CLASS },
};

const TIMELINE_META = {
    order_created: { label: { vi: "Đã tạo đơn hàng", en: "Order created" }, icon: "receipt_long", className: DEFAULT_BADGE_CLASS },
    payment_link_created: { label: { vi: "Đã tạo liên kết thanh toán", en: "Payment link created" }, icon: "link", className: "bg-blue-100 text-blue-700" },
    shipping_estimated: { label: { vi: "Đã ước tính vận chuyển", en: "Shipping estimated" }, icon: "local_shipping", className: "bg-orange-100 text-orange-700" },
    payment_paid: { label: { vi: "Đã thanh toán", en: "Payment completed" }, icon: "payments", className: "bg-emerald-100 text-emerald-700" },
    payment_failed: { label: { vi: "Thanh toán thất bại", en: "Payment failed" }, icon: "error", className: "bg-rose-100 text-rose-700" },
    order_confirmed: { label: { vi: "Đã xác nhận đơn", en: "Order confirmed" }, icon: "verified", className: "bg-sky-100 text-sky-700" },
    order_processing: { label: { vi: "Đang xử lý đơn", en: "Order processing" }, icon: "sync", className: "bg-indigo-100 text-indigo-700" },
    order_packing: { label: { vi: "Đang đóng gói", en: "Packing order" }, icon: "inventory_2", className: "bg-violet-100 text-violet-700" },
    shipment_updated: { label: { vi: "Đã cập nhật vận chuyển", en: "Shipment updated" }, icon: "local_shipping", className: "bg-cyan-100 text-cyan-700" },
    order_shipping: { label: { vi: "Đơn đang giao", en: "Order is shipping" }, icon: "local_shipping", className: "bg-cyan-100 text-cyan-700" },
    order_completed: { label: { vi: "Đã giao thành công", en: "Order completed" }, icon: "task_alt", className: "bg-emerald-100 text-emerald-700" },
    order_cancelled: { label: { vi: "Đơn đã hủy", en: "Order cancelled" }, icon: "cancel", className: "bg-rose-100 text-rose-700" },
    refund_requested: { label: { vi: "Đã gửi yêu cầu hoàn tiền", en: "Refund requested" }, icon: "undo", className: "bg-orange-100 text-orange-700" },
    refund_approved: { label: { vi: "Đã duyệt hoàn tiền", en: "Refund approved" }, icon: "check_circle", className: "bg-emerald-100 text-emerald-700" },
    refund_rejected: { label: { vi: "Từ chối hoàn tiền", en: "Refund rejected" }, icon: "block", className: "bg-rose-100 text-rose-700" },
    internal_note_added: { label: { vi: "Đã thêm ghi chú nội bộ", en: "Internal note added" }, icon: "sticky_note_2", className: DEFAULT_BADGE_CLASS },
    aftersales_submitted: { label: { vi: "Đã gửi yêu cầu hậu mãi", en: "Aftersales submitted" }, icon: "assignment_return", className: "bg-orange-100 text-orange-700" },
    aftersales_under_review: { label: { vi: "Hậu mãi đang xem xét", en: "Aftersales under review" }, icon: "manage_search", className: "bg-sky-100 text-sky-700" },
    aftersales_awaiting_return: { label: { vi: "Chờ khách gửi hàng", en: "Awaiting return shipment" }, icon: "move_to_inbox", className: "bg-violet-100 text-violet-700" },
    aftersales_received: { label: { vi: "Đã nhận hàng hoàn", en: "Return received" }, icon: "inventory_2", className: "bg-indigo-100 text-indigo-700" },
    aftersales_approved: { label: { vi: "Đã duyệt hậu mãi", en: "Aftersales approved" }, icon: "check_circle", className: "bg-emerald-100 text-emerald-700" },
    aftersales_rejected: { label: { vi: "Từ chối hậu mãi", en: "Aftersales rejected" }, icon: "cancel", className: "bg-rose-100 text-rose-700" },
    aftersales_refund_processing: { label: { vi: "Đang hoàn tiền", en: "Refund processing" }, icon: "payments", className: "bg-amber-100 text-amber-700" },
    aftersales_completed: { label: { vi: "Hoàn tất hậu mãi", en: "Aftersales completed" }, icon: "task_alt", className: "bg-emerald-100 text-emerald-700" },
    loyalty_awarded: { label: { vi: "Đã cộng điểm thưởng", en: "Loyalty points awarded" }, icon: "stars", className: "bg-fuchsia-100 text-fuchsia-700" },
    loyalty_reversed: { label: { vi: "Đã điều chỉnh điểm thưởng", en: "Loyalty points adjusted" }, icon: "remove_circle", className: "bg-slate-200 text-slate-700" },
};

const getLabel = (meta, key, lang) => meta?.[key]?.[lang] || meta?.[key]?.vi || "-";

export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    try {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Number(value));
    } catch {
        return String(value);
    }
};

export const formatDateTime = (value, lang = "vi") => {
    if (!value) return "";
    try {
        return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
};

export const getOrderStatusLabel = (status, lang = "vi") => getLabel(STATUS_META[status], "label", lang) || status || "-";
export const getOrderStatusClass = (status) => STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getPaymentStatusLabel = (status, lang = "vi") => getLabel(PAYMENT_STATUS_META[status], "label", lang) || status || "-";
export const getPaymentStatusClass = (status) => PAYMENT_STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getPaymentMethodLabel = (method, lang = "vi") => getLabel(PAYMENT_METHOD_META[method], "label", lang) || method || "-";

export const getCheckoutStatusLabel = (status, lang = "vi") => getLabel(CHECKOUT_STATUS_META[status], "label", lang) || status || "-";
export const getCheckoutStatusClass = (status) => CHECKOUT_STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getRefundRequestStatusLabel = (status, lang = "vi") =>
    getLabel(REFUND_REQUEST_STATUS_META[status], "label", lang) || status || "-";

export const getRefundRequestStatusClass = (status) =>
    REFUND_REQUEST_STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getAftersalesRequestTypeLabel = (type, lang = "vi") =>
    getLabel(AFTERSALES_REQUEST_TYPE_META[type], "label", lang) || type || "-";

export const getAftersalesRequestStatusLabel = (status, lang = "vi") =>
    getLabel(AFTERSALES_REQUEST_STATUS_META[status], "label", lang) || status || "-";

export const getAftersalesRequestStatusClass = (status) =>
    AFTERSALES_REQUEST_STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getAftersalesSlaStatusLabel = (status, lang = "vi") =>
    getLabel(AFTERSALES_SLA_STATUS_META[status], "label", lang) || status || "-";

export const getAftersalesSlaStatusClass = (status) =>
    AFTERSALES_SLA_STATUS_META[status]?.className || DEFAULT_BADGE_CLASS;

export const getOrderTimelineMeta = (type, lang = "vi") => ({
    label: getLabel(TIMELINE_META[type], "label", lang) || type || "-",
    icon: TIMELINE_META[type]?.icon || "history",
    className: TIMELINE_META[type]?.className || DEFAULT_BADGE_CLASS,
});
