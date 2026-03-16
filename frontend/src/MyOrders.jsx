import { useEffect, useState } from "react";
import { useCallback } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import Pagination from "./components/common/Pagination";
import { cancelMomoCheckout, confirmMomoReturn, getOrders, submitOrderAftersalesRequest } from "./services/orderApi";
import { subscribeRealtime } from "./services/realtime";
import { uploadOrderEvidence } from "./services/userApi";
import {
    getAftersalesRequestStatusClass,
    getAftersalesRequestStatusLabel,
    getAftersalesRequestTypeLabel,
    formatCurrency,
    formatDateTime,
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
} from "./utils/orderHelpers";
import { formatOrderTimelineNote, formatShippingEta, getShippingZoneLabel } from "./utils/shippingHelpers";

const T = {
    vi: {
        title: "Đơn hàng của tôi",
        subtitle: "Theo dõi trạng thái các đơn hàng bạn đã đặt.",
        back: "Quay lại",
        search: "Tìm theo mã đơn",
        all: "Tất cả",
        emptyTitle: "Chưa có đơn hàng nào",
        emptyDesc: "Sau khi đặt hàng, đơn của bạn sẽ xuất hiện tại đây.",
        loginTitle: "Cần đăng nhập",
        loginDesc: "Vui lòng đăng nhập để xem lịch sử đơn hàng.",
        signIn: "Đăng nhập",
        continueShopping: "Tiếp tục mua sắm",
        items: "Sản phẩm",
        subtotal: "Tạm tính",
        discount: "Giảm giá",
        shipping: "Vận chuyển",
        total: "Tổng cộng",
        paymentMethod: "Thanh toán",
        paymentStatus: "Trạng thái thanh toán",
        checkoutStatus: "Tiến trình thanh toán",
        paymentExpiresAt: "Hạn thanh toán",
        shippingAddress: "Địa chỉ nhận hàng",
        shipmentTitle: "Vận chuyển",
        shippingZone: "Khu vực",
        shippingService: "Dịch vụ",
        shippingEta: "Dự kiến giao",
        carrier: "Đơn vị vận chuyển",
        trackingNumber: "Mã vận đơn",
        trackingLink: "Liên kết theo dõi",
        shippedAt: "Thời gian gửi hàng",
        deliveredAt: "Thời gian giao thành công",
        trackingOpen: "Mở liên kết",
        timelineTitle: "Hành trình đơn hàng",
        timelineEmpty: "Đơn hàng này chưa có cập nhật mới.",
        note: "Ghi chú",
        resumePayment: "Tiếp tục thanh toán",
        resumePaymentHint: "Bạn có thể quay lại cổng thanh toán trước khi hết hạn.",
        refundStatus: "Hoàn tiền",
        refundReason: "Lý do hoàn tiền",
        refundNote: "Phản hồi xử lý",
        reviewProduct: "Đánh giá sản phẩm",
        requestRefund: "Yêu cầu hậu mãi",
        refundRequestHint: "Bạn có thể gửi yêu cầu đổi trả, hoàn tiền hoặc đổi sản phẩm trong 7 ngày sau khi đơn hoàn thành.",
        refundModalTitle: "Yêu cầu hậu mãi",
        refundModalDesc: "Gửi lý do, mô tả thêm và bằng chứng để đội ngũ hỗ trợ xử lý yêu cầu của bạn.",
        refundReasonPlaceholder: "Nhập lí do",
        submitRefund: "Gửi yêu cầu",
        cancel: "Hủy",
        refundSubmitted: "Đã gửi yêu cầu hoàn tiền",
        refundReasonRequired: "Vui lòng nhập lý do hoàn tiền",
        refundRequestUnavailable: "Đơn hàng này hiện không thể yêu cầu hoàn tiền",
        aftersalesType: "Loại yêu cầu",
        aftersalesNote: "Mô tả thêm",
        aftersalesEvidence: "Bằng chứng đính kèm",
        aftersalesUpload: "Tải ảnh lên",
        aftersalesUploading: "Đang tải ảnh...",
        aftersalesRemoveEvidence: "Xóa ảnh",
        aftersalesTypeRefund: "Hoàn tiền",
        aftersalesTypeReturnRefund: "Trả hàng và hoàn tiền",
        aftersalesTypeExchange: "Đổi sản phẩm",
        aftersalesStatus: "Hậu mãi",
        aftersalesSubmitted: "Đã gửi yêu cầu hậu mãi",
        aftersalesReasonRequired: "Vui lòng nhập lý do hậu mãi",
        aftersalesRequestUnavailable: "Đơn hàng này hiện không thể gửi yêu cầu hậu mãi",
        aftersalesUploadError: "Không thể tải bằng chứng lên",
        loading: "Đang tải đơn hàng...",
        loadError: "Không thể tải danh sách đơn hàng",
        showing: "Hiển thị",
        to: "đến",
        of: "trên",
        results: "đơn hàng",
        previous: "Trước",
        next: "Sau",
    },
    en: {
        title: "My Orders",
        subtitle: "Track the status of the orders you have placed.",
        back: "Back",
        search: "Search by order number",
        all: "All",
        emptyTitle: "No orders yet",
        emptyDesc: "Your orders will appear here after checkout.",
        loginTitle: "Sign in required",
        loginDesc: "Please sign in to view your order history.",
        signIn: "Sign in",
        continueShopping: "Continue shopping",
        items: "Items",
        subtotal: "Subtotal",
        discount: "Discount",
        shipping: "Shipping",
        total: "Total",
        paymentMethod: "Payment method",
        paymentStatus: "Payment status",
        checkoutStatus: "Checkout status",
        paymentExpiresAt: "Payment expires at",
        shippingAddress: "Shipping address",
        shipmentTitle: "Shipment",
        shippingZone: "Zone",
        shippingService: "Service",
        shippingEta: "Estimated delivery",
        carrier: "Carrier",
        trackingNumber: "Tracking number",
        trackingLink: "Tracking link",
        shippedAt: "Shipped at",
        deliveredAt: "Delivered at",
        trackingOpen: "Open link",
        timelineTitle: "Order timeline",
        timelineEmpty: "No timeline updates yet.",
        note: "Note",
        resumePayment: "Continue payment",
        resumePaymentHint: "You can return to the payment gateway before the link expires.",
        refundStatus: "Refund",
        refundReason: "Refund reason",
        refundNote: "Review note",
        reviewProduct: "Review product",
        requestRefund: "Request aftersales",
        refundRequestHint: "You can request an exchange, return and refund, or refund within 7 days after the order is completed.",
        refundModalTitle: "Request aftersales support",
        refundModalDesc: "Share the reason, extra details, and evidence so the support team can review your request.",
        refundReasonPlaceholder: "For example: defective item, wrong item delivered, not as described...",
        submitRefund: "Submit request",
        cancel: "Cancel",
        refundSubmitted: "Refund request submitted",
        refundReasonRequired: "Please enter a refund reason",
        refundRequestUnavailable: "This order is not eligible for a refund request",
        aftersalesType: "Request type",
        aftersalesNote: "Extra details",
        aftersalesEvidence: "Attached evidence",
        aftersalesUpload: "Upload image",
        aftersalesUploading: "Uploading image...",
        aftersalesRemoveEvidence: "Remove image",
        aftersalesTypeRefund: "Refund",
        aftersalesTypeReturnRefund: "Return and refund",
        aftersalesTypeExchange: "Exchange item",
        aftersalesStatus: "Aftersales",
        aftersalesSubmitted: "Aftersales request submitted",
        aftersalesReasonRequired: "Please enter an aftersales reason",
        aftersalesRequestUnavailable: "This order is not eligible for aftersales support",
        aftersalesUploadError: "Failed to upload evidence",
        loading: "Loading orders...",
        loadError: "Failed to load orders",
        showing: "Showing",
        to: "to",
        of: "of",
        results: "orders",
        previous: "Previous",
        next: "Next",
    },
};

const readStoredUser = () => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const readPaymentReturnParams = () => {
    if (typeof window === "undefined") {
        return {
            orderNumber: "",
            paymentResult: "",
            paymentMessage: "",
            momoParams: null,
            shouldCancelPendingReturn: false,
        };
    }
    try {
        const params = new URLSearchParams(window.location.search);
        const rawEntries = Object.fromEntries(params.entries());
        const hasMomoPayload = Boolean(rawEntries.orderId && rawEntries.requestId && rawEntries.signature);
        const orderNumber = params.get("orderNumber") || params.get("orderId") || "";
        const resultCode = params.get("resultCode") || params.get("paymentCode") || "";
        const pendingCodes = new Set(["7000", "7002", "9000", "9100", "9101"]);
        const paymentResult = params.get("paymentResult")
            || (resultCode === "0" ? "success" : pendingCodes.has(resultCode) ? "pending" : resultCode ? "failed" : "");
        return {
            orderNumber,
            paymentResult,
            paymentMessage: params.get("paymentMessage") || params.get("message") || "",
            momoParams: hasMomoPayload ? rawEntries : null,
            shouldCancelPendingReturn: Boolean(!hasMomoPayload && params.get("momoReturn") === "1" && orderNumber),
        };
    } catch {
        return {
            orderNumber: "",
            paymentResult: "",
            paymentMessage: "",
            momoParams: null,
            shouldCancelPendingReturn: false,
        };
    }
};

const getCancelledMomoReturnToast = (lang) => (
    lang === "vi"
        ? "Bạn đã quay về từ cổng thanh toán. Đơn hàng đã được hủy."
        : "You returned from the payment gateway. The order has been cancelled."
);

const getCheckoutPaymentToast = (result, lang, message) => {
    const cleanedMessage = String(message || "")
        .replaceAll("MoMo", lang === "vi" ? "thanh toán chuyển khoản" : "bank transfer")
        .replaceAll("momo", lang === "vi" ? "thanh toán chuyển khoản" : "bank transfer")
        .trim();

    if (cleanedMessage) return cleanedMessage;

    if (result === "success") {
        return lang === "vi" ? "Thanh toán chuyển khoản thành công" : "Bank transfer payment completed";
    }
    if (result === "pending") {
        return lang === "vi" ? "Giao dịch chuyển khoản đang chờ xác nhận" : "Bank transfer payment is pending";
    }
    return lang === "vi" ? "Thanh toán chuyển khoản thất bại" : "Bank transfer payment failed";
};

const ACTIVE_ONLINE_CHECKOUT_STATUSES = new Set(["created", "awaiting_payment", "processing_payment"]);
const AFTERSALES_REQUEST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const isPaymentLinkExpired = (order) => {
    if (!order?.paymentExpiresAt) return false;
    const expiresAt = new Date(order.paymentExpiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt <= Date.now();
};

const canResumeOnlinePayment = (order) => (
    order?.paymentMethod === "bank_transfer"
    && order?.paymentStatus !== "paid"
    && ACTIVE_ONLINE_CHECKOUT_STATUSES.has(order?.checkoutStatus)
    && Boolean(order?.paymentRedirectUrl)
    && !isPaymentLinkExpired(order)
);

const getRefundStatus = (order) => String(order?.refundRequest?.status || "none").trim().toLowerCase();
const getAftersalesStatus = (order) => String(order?.aftersalesRequest?.status || "none").trim().toLowerCase();

const getRefundDeadline = (order) => {
    if (!order?.completedAt) return null;
    const completedAt = new Date(order.completedAt).getTime();
    if (!Number.isFinite(completedAt)) return null;
    return completedAt + (7 * 24 * 60 * 60 * 1000);
};

const canCreateAftersalesRequest = (order) => {
    if (order?.status !== "completed") return false;
    if (!["paid", "refunded"].includes(order?.paymentStatus)) return false;
    if (!["none", "rejected", "completed"].includes(getAftersalesStatus(order))) return false;

    const deadline = getRefundDeadline(order);
    return Number.isFinite(deadline) && deadline > Date.now();
};

export default function MyOrders({ lang, setLang, onNavigateHome, onNavigateLogin, onNavigateProduct }) {
    const t = T[lang] || T.vi;
    const [paymentReturn] = useState(() => readPaymentReturnParams());
    const [currentUser, setCurrentUser] = useState(() => readStoredUser());
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState(() => paymentReturn.orderNumber || "");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalItems: 0 });
    const [loading, setLoading] = useState(false);
    const [aftersalesModalOrder, setAftersalesModalOrder] = useState(null);
    const [aftersalesForm, setAftersalesForm] = useState({ type: "refund", reason: "", customerNote: "" });
    const [aftersalesEvidence, setAftersalesEvidence] = useState([]);
    const [aftersalesSubmitting, setAftersalesSubmitting] = useState(false);
    const [aftersalesUploading, setAftersalesUploading] = useState(false);

    const fetchOrders = useCallback(async ({ silent = false } = {}) => {
        if (!currentUser) {
            setOrders([]);
            setPagination({ page: 1, totalPages: 0, totalItems: 0 });
            return;
        }

        if (!silent) setLoading(true);
        try {
            const response = await getOrders({
                page,
                limit: 6,
                mine: true,
                search: search.trim() || undefined,
                status: status === "all" ? undefined : status,
            });
            setOrders(response?.data || []);
            setPagination(response?.pagination || { page: 1, totalPages: 0, totalItems: 0 });
        } catch (error) {
            setOrders([]);
            setPagination({ page: 1, totalPages: 0, totalItems: 0 });
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [currentUser, page, search, status, t.loadError]);

    const handleResumePayment = (order) => {
        if (!order?.paymentRedirectUrl) {
            toast.error(lang === "vi" ? "Không còn liên kết thanh toán cho đơn này" : "This order no longer has a payment link");
            return;
        }
        if (isPaymentLinkExpired(order)) {
            toast.error(lang === "vi" ? "Liên kết thanh toán này đã hết hạn" : "This payment link has expired");
            return;
        }
        window.location.assign(order.paymentRedirectUrl);
    };

    const handleOpenAftersalesModal = (order) => {
        if (!canCreateAftersalesRequest(order)) {
            toast.error(t.aftersalesRequestUnavailable);
            return;
        }
        setAftersalesModalOrder(order);
        setAftersalesForm({ type: "refund", reason: "", customerNote: "" });
        setAftersalesEvidence([]);
    };

    const handleEvidenceUpload = async (files) => {
        // Convert FileList to Array properly
        const fileArray = files ? Array.from(files) : [];
        if (fileArray.length === 0) {
            console.warn("No files selected");
            return;
        }

        console.log(`Starting upload of ${fileArray.length} file(s)...`);
        setAftersalesUploading(true);

        const uploadResults = [];

        try {
            // Upload each file individually
            for (const file of fileArray) {
                console.log(`Uploading file: ${file.name} (${file.type}, ${file.size} bytes)`);
                try {
                    const response = await uploadOrderEvidence(file);
                    console.log(`Upload successful for ${file.name}:`, response);

                    // Extract the file data from response
                    const fileData = response?.data || response;
                    if (fileData?.url) {
                        uploadResults.push(fileData);
                    } else {
                        console.warn(`Invalid response for ${file.name}:`, response);
                    }
                } catch (fileError) {
                    console.error(`Error uploading ${file.name}:`, fileError);
                    toast.error(`Failed to upload ${file.name}: ${fileError?.response?.data?.message || fileError?.message || "Unknown error"}`);
                }
            }

            if (uploadResults.length > 0) {
                console.log(`Successfully uploaded ${uploadResults.length}/${fileArray.length} files`);
                setAftersalesEvidence((prev) => [...prev, ...uploadResults]);
                toast.success(`Uploaded ${uploadResults.length} image${uploadResults.length !== 1 ? "s" : ""}`);
            } else {
                console.error("No files were successfully uploaded");
                toast.error(t.aftersalesUploadError);
            }
        } catch (error) {
            console.error("Upload process error:", error);
            toast.error(error?.response?.data?.message || t.aftersalesUploadError);
        } finally {
            setAftersalesUploading(false);
        }
    };

    const handleSubmitAftersalesRequest = async () => {
        if (!aftersalesModalOrder?._id) return;
        const reason = String(aftersalesForm.reason || "").trim();
        if (!reason) {
            toast.error(t.aftersalesReasonRequired);
            return;
        }

        setAftersalesSubmitting(true);
        try {
            const response = await submitOrderAftersalesRequest(aftersalesModalOrder._id, {
                type: aftersalesForm.type,
                reason,
                customerNote: String(aftersalesForm.customerNote || "").trim(),
                evidence: aftersalesEvidence,
            });
            const nextOrder = response?.data;
            setOrders((prev) => prev.map((entry) => (entry._id === nextOrder?._id ? nextOrder : entry)));
            toast.success(t.aftersalesSubmitted);
            setAftersalesModalOrder(null);
            setAftersalesForm({ type: "refund", reason: "", customerNote: "" });
            setAftersalesEvidence([]);
        } catch (error) {
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setAftersalesSubmitting(false);
        }
    };

    useEffect(() => {
        const syncUser = () => setCurrentUser(readStoredUser());
        window.addEventListener("user:updated", syncUser);
        window.addEventListener("storage", syncUser);
        return () => {
            window.removeEventListener("user:updated", syncUser);
            window.removeEventListener("storage", syncUser);
        };
    }, []);

    useEffect(() => {
        if (!paymentReturn.paymentResult && !paymentReturn.momoParams && !paymentReturn.shouldCancelPendingReturn) return;
        let cancelled = false;

        const finalizePaymentReturn = (paymentResult, paymentMessage) => {
            const paymentToast = getCheckoutPaymentToast(paymentResult, lang, paymentMessage);

            if (paymentResult === "success") {
                toast.success(paymentToast);
            } else if (paymentResult === "pending") {
                toast.message(paymentToast);
            } else {
                toast.error(paymentToast);
            }

            try {
                window.history.replaceState({}, "", window.location.pathname);
            } catch {
                void 0;
            }
        };

        const syncMomoReturn = async () => {
            if (paymentReturn.shouldCancelPendingReturn && paymentReturn.orderNumber && !paymentReturn.momoParams) {
                try {
                    const response = await cancelMomoCheckout(paymentReturn.orderNumber);
                    if (cancelled) return;
                    const synced = response?.data || {};
                    finalizePaymentReturn(
                        synced.paymentResult || "failed",
                        synced.paymentMessage || getCancelledMomoReturnToast(lang)
                    );
                } catch (error) {
                    if (cancelled) return;
                    finalizePaymentReturn(
                        "failed",
                        error?.response?.data?.data?.paymentMessage
                        || error?.response?.data?.message
                        || getCancelledMomoReturnToast(lang)
                    );
                }
                return;
            }

            if (!paymentReturn.momoParams) {
                finalizePaymentReturn(paymentReturn.paymentResult, paymentReturn.paymentMessage);
                return;
            }

            try {
                const response = await confirmMomoReturn(paymentReturn.momoParams);
                if (cancelled) return;
                const synced = response?.data || {};
                finalizePaymentReturn(
                    synced.paymentResult || paymentReturn.paymentResult,
                    synced.paymentMessage || paymentReturn.paymentMessage
                );
            } catch (error) {
                if (cancelled) return;
                finalizePaymentReturn(
                    paymentReturn.paymentResult,
                    error?.response?.data?.data?.paymentMessage
                    || error?.response?.data?.message
                    || paymentReturn.paymentMessage
                );
            }
        };

        syncMomoReturn();
        return () => {
            cancelled = true;
        };
    }, [
        lang,
        paymentReturn.momoParams,
        paymentReturn.orderNumber,
        paymentReturn.paymentMessage,
        paymentReturn.paymentResult,
        paymentReturn.shouldCancelPendingReturn,
    ]);

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (!currentUser) return undefined;

        let timerId = null;
        const unsubscribe = subscribeRealtime((payload) => {
            const type = String(payload?.type || "");
            if (!type.startsWith("order.")) return;

            if (timerId) window.clearTimeout(timerId);
            timerId = window.setTimeout(() => {
                void fetchOrders({ silent: true });
            }, 250);
        });

        return () => {
            if (timerId) window.clearTimeout(timerId);
            unsubscribe();
        };
    }, [currentUser, fetchOrders]);

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <button
                            type="button"
                            onClick={onNavigateHome}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            {t.back}
                        </button>
                        <h1 className="mt-5 text-3xl md:text-4xl font-black tracking-tight">{t.title}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.subtitle}</p>
                    </div>
                </div>

                {!currentUser ? (
                    <div className="mt-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-10 text-center">
                        <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                            <span className="material-symbols-outlined text-3xl">lock</span>
                        </div>
                        <h2 className="text-xl font-extrabold">{t.loginTitle}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.loginDesc}</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={onNavigateLogin}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">login</span>
                                {t.signIn}
                            </button>
                            <button
                                type="button"
                                onClick={onNavigateHome}
                                className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">storefront</span>
                                {t.continueShopping}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-5">
                            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                                <input
                                    value={search}
                                    onChange={(event) => {
                                        setPage(1);
                                        setSearch(event.target.value);
                                    }}
                                    placeholder={t.search}
                                    className="w-full lg:max-w-sm h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPage(1);
                                            setStatus("all");
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                            status === "all"
                                                ? "bg-primary text-white"
                                                : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        }`}
                                    >
                                        {t.all}
                                    </button>
                                    {ORDER_STATUS_OPTIONS.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => {
                                                setPage(1);
                                                setStatus(option);
                                            }}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                                status === option
                                                    ? "bg-primary text-white"
                                                    : "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            }`}
                                        >
                                            {getOrderStatusLabel(option, lang)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-10 text-center text-slate-500 dark:text-slate-400">
                                {t.loading}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-10 text-center">
                                <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                </div>
                                <h2 className="text-xl font-extrabold">{t.emptyTitle}</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">{t.emptyDesc}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mt-8 space-y-5">
                                    {orders.map((order) => {
                                        const hasShipmentInfo = Boolean(
                                            order?.shipment?.zone
                                            || order?.shipment?.carrier
                                            || order?.shipment?.service
                                            || order?.shipment?.trackingNumber
                                            || order?.shipment?.trackingUrl
                                            || order?.shipment?.estimatedMinDays
                                            || order?.shipment?.estimatedMaxDays
                                            || order?.shipment?.shippedAt
                                            || order?.shipment?.deliveredAt
                                        );
                                        const timelineItems = Array.isArray(order?.timeline)
                                            ? [...order.timeline].sort(
                                                (a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime()
                                            )
                                            : [];

                                        return (
                                        <article
                                            key={order._id}
                                            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-5 md:p-6 shadow-sm"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="text-xl font-black">{order.orderNumber}</h2>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusClass(order.status)}`}>
                                                            {getOrderStatusLabel(order.status, lang)}
                                                        </span>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getCheckoutStatusClass(order.checkoutStatus)}`}>
                                                            {getCheckoutStatusLabel(order.checkoutStatus, lang)}
                                                        </span>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusClass(order.paymentStatus)}`}>
                                                            {getPaymentStatusLabel(order.paymentStatus, lang)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                        {formatDateTime(order.createdAt, lang)}
                                                    </p>
                                                </div>
                                                <div className="text-left lg:text-right">
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{t.total}</div>
                                                    <div className="text-2xl font-black text-primary">{formatCurrency(order.totalAmount)}</div>
                                                    {canResumeOnlinePayment(order) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleResumePayment(order)}
                                                            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                            {t.resumePayment}
                                                        </button>
                                                    )}
                                                    {canCreateAftersalesRequest(order) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAftersalesModal(order)}
                                                            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">undo</span>
                                                            {t.requestRefund}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                                                <div>
                                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                        {t.items}
                                                    </h3>
                                                    <div className="mt-3 space-y-3">
                                                        {(order.items || []).map((item) => (
                                                            <div
                                                                key={`${order._id}-${item.productId}-${item.variant}-${item.name}`}
                                                                className="flex gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-3"
                                                            >
                                                                <div className="size-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                                                                    {item.image ? (
                                                                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                                                                    ) : (
                                                                        <span className="material-symbols-outlined text-slate-400">image</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold line-clamp-2">{item.name}</div>
                                                                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                                        {item.variant || "-"} - {t.items}: {item.quantity}
                                                                    </div>
                                                                    <div className="mt-2 text-sm font-semibold">
                                                                        {formatCurrency(item.price)} x {item.quantity}
                                                                    </div>
                                                                    {order.status === "completed" && item.productId && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onNavigateProduct?.(item.productId)}
                                                                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">rate_review</span>
                                                                            {t.reviewProduct}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm font-black">{formatCurrency(item.lineTotal)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                                        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                                            <span>{t.subtotal}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(order.subtotal)}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                                            <span>{t.discount}</span>
                                                            <span className="font-semibold text-emerald-600">
                                                                {order.discountAmount ? `-${formatCurrency(order.discountAmount)}` : formatCurrency(0)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                                                            <span>{t.shipping}</span>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                {Number(order.shippingFee || 0) > 0 ? formatCurrency(order.shippingFee) : formatCurrency(0)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                                            <span className="font-bold">{t.total}</span>
                                                            <span className="text-lg font-black text-primary">{formatCurrency(order.totalAmount)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-sm">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-500 dark:text-slate-400">{t.paymentMethod}</span>
                                                            <span className="font-semibold">{getPaymentMethodLabel(order.paymentMethod, lang)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-500 dark:text-slate-400">{t.paymentStatus}</span>
                                                            <span className="font-semibold">{getPaymentStatusLabel(order.paymentStatus, lang)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-slate-500 dark:text-slate-400">{t.checkoutStatus}</span>
                                                            <span className="font-semibold">{getCheckoutStatusLabel(order.checkoutStatus, lang)}</span>
                                                        </div>
                                                        {getAftersalesStatus(order) !== "none" && (
                                                            <>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-slate-500 dark:text-slate-400">{t.aftersalesStatus}</span>
                                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getAftersalesRequestStatusClass(getAftersalesStatus(order))}`}>
                                                                        {getAftersalesRequestStatusLabel(getAftersalesStatus(order), lang)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-slate-500 dark:text-slate-400">{t.aftersalesType}</span>
                                                                    <span className="font-semibold">{getAftersalesRequestTypeLabel(order?.aftersalesRequest?.type, lang)}</span>
                                                                </div>
                                                                {order?.aftersalesRequest?.reason && (
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400">{t.refundReason}</div>
                                                                        <div className="mt-1 font-semibold">{order.aftersalesRequest.reason}</div>
                                                                    </div>
                                                                )}
                                                                {order?.aftersalesRequest?.customerNote && (
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400">{t.aftersalesNote}</div>
                                                                        <div className="mt-1 font-semibold">{order.aftersalesRequest.customerNote}</div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {getRefundStatus(order) !== "none" && (
                                                            <>
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <span className="text-slate-500 dark:text-slate-400">{t.refundStatus}</span>
                                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getRefundRequestStatusClass(getRefundStatus(order))}`}>
                                                                        {getRefundRequestStatusLabel(getRefundStatus(order), lang)}
                                                                    </span>
                                                                </div>
                                                                {order.refundRequest?.reason && (
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400">{t.refundReason}</div>
                                                                        <div className="mt-1 font-semibold">{order.refundRequest.reason}</div>
                                                                    </div>
                                                                )}
                                                                {order.refundRequest?.reviewNote && (
                                                                    <div>
                                                                        <div className="text-slate-500 dark:text-slate-400">{t.refundNote}</div>
                                                                        <div className="mt-1 font-semibold">{order.refundRequest.reviewNote}</div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                        {order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid" && order.paymentExpiresAt && (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-slate-500 dark:text-slate-400">{t.paymentExpiresAt}</span>
                                                                <span className="font-semibold">{formatDateTime(order.paymentExpiresAt, lang)}</span>
                                                            </div>
                                                        )}
                                                        {canResumeOnlinePayment(order) && (
                                                            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                                                {t.resumePaymentHint}
                                                            </div>
                                                        )}
                                                        {canCreateAftersalesRequest(order) && (
                                                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                                {t.refundRequestHint}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-slate-500 dark:text-slate-400">{t.shippingAddress}</div>
                                                            <div className="mt-1 font-semibold">{order.customer?.address || "-"}</div>
                                                        </div>
                                                        {order.note && (
                                                            <div>
                                                                <div className="text-slate-500 dark:text-slate-400">{t.note}</div>
                                                                <div className="mt-1 font-semibold">{order.note}</div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {(hasShipmentInfo || timelineItems.length > 0) && (
                                                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 text-sm">
                                                            {hasShipmentInfo && (
                                                                <div>
                                                                    <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                        {t.shipmentTitle}
                                                                    </div>
                                                                    <div className="mt-3 space-y-3">
                                                                        {order.shipment?.carrier && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.carrier}</span>
                                                                                <span className="font-semibold">{order.shipment.carrier}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.service && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.shippingService}</span>
                                                                                <span className="font-semibold">{order.shipment.service}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.zone && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.shippingZone}</span>
                                                                                <span className="font-semibold">{getShippingZoneLabel(order.shipment.zone, lang)}</span>
                                                                            </div>
                                                                        )}
                                                                        {(order.shipment?.estimatedMinDays || order.shipment?.estimatedMaxDays) && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.shippingEta}</span>
                                                                                <span className="font-semibold">
                                                                                    {formatShippingEta(order.shipment.estimatedMinDays, order.shipment.estimatedMaxDays, lang)}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.trackingNumber && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.trackingNumber}</span>
                                                                                <span className="font-semibold">{order.shipment.trackingNumber}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.shippedAt && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.shippedAt}</span>
                                                                                <span className="font-semibold">{formatDateTime(order.shipment.shippedAt, lang)}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.deliveredAt && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.deliveredAt}</span>
                                                                                <span className="font-semibold">{formatDateTime(order.shipment.deliveredAt, lang)}</span>
                                                                            </div>
                                                                        )}
                                                                        {order.shipment?.trackingUrl && (
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="text-slate-500 dark:text-slate-400">{t.trackingLink}</span>
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
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <div className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                    {t.timelineTitle}
                                                                </div>
                                                                {timelineItems.length === 0 ? (
                                                                    <div className="mt-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-500 dark:text-slate-400">
                                                                        {t.timelineEmpty}
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-3 space-y-3">
                                                                        {timelineItems.map((entry, index) => {
                                                                            const meta = getOrderTimelineMeta(entry?.type, lang);
                                                                            const formattedNote = formatOrderTimelineNote(entry?.note, lang);

                                                                            return (
                                                                                <div key={`${order._id}-timeline-${index}-${entry?.type || "item"}`} className="flex gap-3">
                                                                                    <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${meta.className}`}>
                                                                                        <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                                                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                                                            <div>
                                                                                                <div className="font-semibold text-slate-900 dark:text-slate-100">{meta.label}</div>
                                                                                                {formattedNote && (
                                                                                                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formattedNote}</div>
                                                                                                )}
                                                                                                {entry?.actorName && (
                                                                                                    <div className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400">{entry.actorName}</div>
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
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                        );
                                    })}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur overflow-hidden">
                                        <Pagination
                                            page={pagination.page || page}
                                            limit={6}
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
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {aftersalesModalOrder && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4">
                    <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{t.refundModalTitle}</h3>
                                <p className="mt-2 text-sm text-slate-500">{t.refundModalDesc}</p>
                                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    {aftersalesModalOrder.orderNumber}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (aftersalesSubmitting) return;
                                    setAftersalesModalOrder(null);
                                    setAftersalesForm({ type: "refund", reason: "", customerNote: "" });
                                    setAftersalesEvidence([]);
                                }}
                                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {t.aftersalesType}
                                </label>
                                <select
                                    value={aftersalesForm.type}
                                    onChange={(event) => setAftersalesForm((prev) => ({ ...prev, type: event.target.value }))}
                                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="refund">{t.aftersalesTypeRefund}</option>
                                    <option value="return_refund">{t.aftersalesTypeReturnRefund}</option>
                                    <option value="exchange">{t.aftersalesTypeExchange}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {t.aftersalesEvidence}
                                </label>
                                <label className={`mt-2 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 ${aftersalesUploading ? "opacity-60" : ""}`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        disabled={aftersalesUploading}
                                        className="hidden"
                                        onChange={(event) => {
                                            const files = event.target.files;
                                            if (files && files.length > 0) {
                                                void handleEvidenceUpload(files);
                                                // Reset input after upload completes
                                                event.target.value = "";
                                            }
                                        }}
                                    />
                                    {aftersalesUploading ? t.aftersalesUploading : t.aftersalesUpload}
                                </label>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                {t.refundReason}
                            </label>
                            <textarea
                                rows={4}
                                value={aftersalesForm.reason}
                                onChange={(event) => setAftersalesForm((prev) => ({ ...prev, reason: event.target.value }))}
                                placeholder={t.refundReasonPlaceholder}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                {t.aftersalesNote}
                            </label>
                            <textarea
                                rows={4}
                                value={aftersalesForm.customerNote}
                                onChange={(event) => setAftersalesForm((prev) => ({ ...prev, customerNote: event.target.value }))}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {aftersalesEvidence.length > 0 && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {aftersalesEvidence.map((item, index) => (
                                    <div key={`${item?.url || "evidence"}-${index}`} className="relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group">
                                        {/* Image Preview */}
                                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {item?.url ? (
                                                <img
                                                    src={item.url}
                                                    alt={item?.name || "Evidence"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-300 text-5xl">image</span>
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className="p-3">
                                            <p className="truncate text-sm font-bold text-slate-900">
                                                {item?.name ? item.name.slice(0, 40) : "Evidence Image"}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item?.mimeType ? item.mimeType.replace("image/", "").toUpperCase() : "Image"}
                                                {item?.size ? ` • ${(item.size / 1024).toFixed(1)}KB` : ""}
                                            </p>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            type="button"
                                            onClick={() => setAftersalesEvidence((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                                            className="m-3 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-100"
                                        >
                                            {t.aftersalesRemoveEvidence}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    if (aftersalesSubmitting) return;
                                    setAftersalesModalOrder(null);
                                    setAftersalesForm({ type: "refund", reason: "", customerNote: "" });
                                    setAftersalesEvidence([]);
                                }}
                                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitAftersalesRequest}
                                disabled={aftersalesSubmitting || aftersalesUploading}
                                className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {aftersalesSubmitting ? "progress_activity" : "send"}
                                </span>
                                {t.submitRefund}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}



