import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { getMyCoupons, validateCoupon as validateCouponCode } from "./services/couponApi";
import { createOrder, estimateOrderShipping } from "./services/orderApi";
import { getMyProfile } from "./services/userApi";
import { clearCart, loadCart, removeFromCart, updateCartQty } from "./utils/cartStorage";
import {
    formatCurrency,
    getPaymentMethodLabel,
    PAYMENT_METHOD_OPTIONS,
} from "./utils/orderHelpers";
import {
    normalizeUserProfile,
    readStoredUserProfile,
    writeStoredUserProfile,
} from "./utils/userProfile";
import { formatShippingEta, getShippingZoneLabel } from "./utils/shippingHelpers";

const T = {
    vi: {
        title: "Giỏ hàng",
        subtitle: (count) => `Bạn có ${count} sản phẩm trong giỏ hàng`,
        back: "Quay lại",
        emptyTitle: "Giỏ hàng trống",
        emptyDesc: "Hãy thêm vài sản phẩm trước khi thanh toán.",
        continueShopping: "Tiếp tục mua sắm",
        viewOrders: "Đơn hàng của tôi",
        orderSummary: "Tóm tắt đơn hàng",
        subtotal: "Tạm tính",
        discount: "Giảm giá",
        shipping: "Vận chuyển",
        free: "Miễn phí",
        shippingCalculating: "Đang tính",
        shippingPending: "Nhập địa chỉ để tính phí vận chuyển",
        shippingCarrier: "Đơn vị dự kiến",
        shippingService: "Dịch vụ",
        shippingZone: "Khu vực",
        shippingEta: "Dự kiến giao",
        shippingFreeAt: "Miễn phí từ",
        shippingTierPerk: "Ưu đãi thành viên",
        shippingTierRate: "Giảm phí ship",
        shippingTierDiscount: "Đã giảm",
        shippingFeeNote: "Phí vận chuyển sẽ được khóa theo địa chỉ giao hàng.",
        loyaltyTier: "Hạng thành viên",
        total: "Tổng cộng",
        promoCode: "Mã giảm giá",
        promoPlaceholder: "Nhập mã",
        apply: "Áp dụng",
        applyingCoupon: "Đang áp dụng...",
        applied: "Đã áp dụng",
        emptyPromoCode: "Chưa nhập mã giảm giá",
        invalidCode: "Mã không hợp lệ",
        savedVouchers: "Voucher đã lưu",
        voucherUnavailable: "Voucher không còn phù hợp với giỏ hàng hiện tại",
        removed: "Đã xóa sản phẩm khỏi giỏ",
        cleared: "Đã xóa toàn bộ giỏ hàng",
        checkout: "Đặt hàng ngay",
        secureTitle: "Thanh toán an toàn",
        secureDesc: "Đơn hàng sẽ được xác nhận bằng tài khoản đang đăng nhập của bạn.",
        qty: "SL",
        remove: "Xóa",
        clearAll: "Xóa giỏ hàng",
        each: "Giá",
        checkoutInfo: "Thông tin nhận hàng",
        fullName: "Họ và tên",
        email: "Email",
        phone: "Số điện thoại",
        address: "Địa chỉ",
        note: "Ghi chú",
        notePlaceholder: "Ghi chú cho shop hoặc người giao hàng",
        paymentMethod: "Phương thức thanh toán",
        savedOptions: "Dữ liệu đã lưu",
        customOption: "Nhập mới",
        rememberChoice: "Lưu lựa chọn này làm mặc định",
        syncingProfile: "Đang cập nhật hồ sơ...",
        loginRequired: "Vui lòng đăng nhập để đặt hàng",
        checkoutFieldsRequired: "Vui lòng nhập đầy đủ thông tin nhận hàng",
        orderPlaced: "Đặt hàng thành công",
        placingOrder: "Đang tạo đơn hàng...",
        checkoutError: "Không thể tạo đơn hàng",
        cartItems: "Sản phẩm",
    },
    en: {
        title: "Shopping Cart",
        subtitle: (count) => `You have ${count} item(s) in your cart`,
        back: "Back",
        emptyTitle: "Your cart is empty",
        emptyDesc: "Add a few products before checking out.",
        continueShopping: "Continue shopping",
        viewOrders: "My Orders",
        orderSummary: "Order Summary",
        subtotal: "Subtotal",
        discount: "Discount",
        shipping: "Shipping",
        free: "Free",
        shippingCalculating: "Calculating",
        shippingPending: "Enter a delivery address to calculate shipping",
        shippingCarrier: "Estimated carrier",
        shippingService: "Service",
        shippingZone: "Zone",
        shippingEta: "Estimated delivery",
        shippingFreeAt: "Free from",
        shippingTierPerk: "Member perk",
        shippingTierRate: "Shipping discount",
        shippingTierDiscount: "Discount applied",
        shippingFeeNote: "Shipping fee is locked using the current delivery address.",
        loyaltyTier: "Member tier",
        total: "Total",
        promoCode: "Promo Code",
        promoPlaceholder: "Enter code",
        apply: "Apply",
        applyingCoupon: "Applying...",
        applied: "Applied",
        emptyPromoCode: "Please enter a promo code",
        invalidCode: "Invalid promo code",
        savedVouchers: "Saved vouchers",
        voucherUnavailable: "This voucher is no longer valid for the current cart",
        removed: "Removed from cart",
        cleared: "Cart cleared",
        checkout: "Place order",
        secureTitle: "Secure checkout",
        secureDesc: "Your order will be created for the currently signed-in account.",
        qty: "Qty",
        remove: "Remove",
        clearAll: "Clear cart",
        each: "Price",
        checkoutInfo: "Shipping details",
        fullName: "Full name",
        email: "Email",
        phone: "Phone",
        address: "Address",
        note: "Note",
        notePlaceholder: "Add a delivery note for the store",
        paymentMethod: "Payment method",
        savedOptions: "Saved data",
        customOption: "Enter a new value",
        rememberChoice: "Save this choice as default",
        syncingProfile: "Updating profile...",
        loginRequired: "Please sign in to place an order",
        checkoutFieldsRequired: "Please complete the shipping form",
        orderPlaced: "Order placed successfully",
        placingOrder: "Creating your order...",
        checkoutError: "Failed to create order",
        cartItems: "Items",
    },
};

const buildCheckoutForm = (user) => ({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    note: "",
    paymentMethod: "cod",
});

const buildContactSelections = (user) => ({
    email: user?.emails?.find((item) => item.isDefault)?._id || user?.emails?.[0]?._id || "",
    phone: user?.phones?.find((item) => item.isDefault)?._id || user?.phones?.[0]?._id || "",
    address: user?.addresses?.find((item) => item.isDefault)?._id || user?.addresses?.[0]?._id || "",
});

const getContactById = (items = [], id) => items.find((item) => String(item?._id) === String(id)) || null;

const formatAddressOptionLabel = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const firstPart = raw.split(",")[0]?.trim() || raw;
    if (firstPart.length >= raw.length) return raw;
    return `${firstPart},...`;
};

const getCheckoutPaymentMethodLabel = (method, lang) => {
    if (method === "bank_transfer") {
        return lang === "vi" ? "Thanh toán chuyển khoản" : "Bank transfer";
    }
    return getPaymentMethodLabel(method, lang);
};

const getLoyaltyTierLabel = (tier, lang) => {
    const normalized = String(tier || "BRONZE").trim().toUpperCase();
    const labels = {
        BRONZE: { vi: "Đồng", en: "Bronze" },
        SILVER: { vi: "Bạc", en: "Silver" },
        GOLD: { vi: "Vàng", en: "Gold" },
        PLATINUM: { vi: "Bạch kim", en: "Platinum" },
    };

    return labels[normalized]?.[lang] || labels.BRONZE[lang] || normalized;
};

export default function Cart({ lang, setLang, onNavigateHome, onNavigateLogin, onNavigateOrders }) {
    const t = T[lang] || T.vi;
    const initialUser = readStoredUserProfile();
    const [items, setItems] = useState(() => loadCart());
    const [currentUser, setCurrentUser] = useState(() => initialUser);
    const [profile, setProfile] = useState(() => normalizeUserProfile(initialUser || {}));
    const [promo, setPromo] = useState("");
    const [myCoupons, setMyCoupons] = useState([]);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [shippingEstimate, setShippingEstimate] = useState(null);
    const [isShippingLoading, setIsShippingLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState(() => buildCheckoutForm(initialUser));
    const [contactSelections, setContactSelections] = useState(() => buildContactSelections(initialUser));
    const currentUserId = currentUser?.id || currentUser?._id || profile?.id || profile?._id || "";

    const applyProfileToCheckout = (nextUser) => {
        const nextProfile = normalizeUserProfile(nextUser || {});
        setCurrentUser(nextProfile.id ? nextProfile : null);
        setProfile(nextProfile);
        setForm((prev) => ({
            ...buildCheckoutForm(nextProfile),
            note: prev.note || "",
            paymentMethod: prev.paymentMethod || "cod",
        }));
        setContactSelections(buildContactSelections(nextProfile));
        return nextProfile;
    };

    useEffect(() => {
        const onUpdate = () => setItems(loadCart());
        window.addEventListener("cart:updated", onUpdate);
        window.addEventListener("storage", onUpdate);
        return () => {
            window.removeEventListener("cart:updated", onUpdate);
            window.removeEventListener("storage", onUpdate);
        };
    }, []);

    useEffect(() => {
        const syncUser = () => {
            applyProfileToCheckout(readStoredUserProfile());
        };

        window.addEventListener("user:updated", syncUser);
        window.addEventListener("storage", syncUser);
        return () => {
            window.removeEventListener("user:updated", syncUser);
            window.removeEventListener("storage", syncUser);
        };
    }, []);

    useEffect(() => {
        if (!currentUserId) return;
        let mounted = true;

        const syncProfile = async () => {
            try {
                const res = await getMyProfile();
                const nextProfile = normalizeUserProfile(res?.data || {});
                if (!mounted) return;
                writeStoredUserProfile(nextProfile);
                applyProfileToCheckout(nextProfile);
            } catch {
                void 0;
            }
        };

        syncProfile();
        return () => {
            mounted = false;
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) {
            setMyCoupons([]);
            return undefined;
        }

        let cancelled = false;
        const loadCoupons = async () => {
            try {
                const response = await getMyCoupons();
                if (cancelled) return;
                setMyCoupons(response?.data || []);
            } catch {
                if (cancelled) return;
                setMyCoupons([]);
            }
        };

        loadCoupons();
        return () => {
            cancelled = true;
        };
    }, [currentUserId]);

    const itemCount = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0),
        [items]
    );
    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item?.unitPrice) || 0) * (Number(item?.qty) || 0), 0),
        [items]
    );
    const discountAmount = Number(appliedCoupon?.discountAmount || 0);
    const shipping = Number(shippingEstimate?.shippingFee || 0);
    const shippingDiscountAmount = Number(shippingEstimate?.loyaltyDiscountAmount || 0);
    const total = useMemo(
        () => Math.max(0, subtotal - discountAmount + shipping),
        [subtotal, discountAmount, shipping]
    );

    useEffect(() => {
        if (!currentUserId || items.length === 0) {
            setShippingEstimate(null);
            setIsShippingLoading(false);
            return undefined;
        }

        const address = String(form.address || "").trim();
        if (!address) {
            setShippingEstimate(null);
            setIsShippingLoading(false);
            return undefined;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setIsShippingLoading(true);
            try {
                const response = await estimateOrderShipping({
                    address,
                    subtotal,
                    itemCount,
                    paymentMethod: form.paymentMethod || "cod",
                });
                if (cancelled) return;
                setShippingEstimate(response?.data || null);
            } catch {
                if (cancelled) return;
                setShippingEstimate(null);
            } finally {
                if (!cancelled) {
                    setIsShippingLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [currentUserId, form.address, form.paymentMethod, itemCount, items.length, subtotal]);

    const setQty = (key, nextQty) => {
        const nextItems = updateCartQty(key, nextQty);
        setItems(nextItems);
    };

    const removeItem = (key) => {
        const nextItems = removeFromCart(key);
        setItems(nextItems);
        toast.success(t.removed);
    };

    const clearAll = () => {
        clearCart();
        setItems([]);
        setPromo("");
        setAppliedCoupon(null);
        toast.success(t.cleared);
    };

    const applyPromo = async (nextCode = promo) => {
        const code = String(nextCode || "").trim().toUpperCase();
        if (!code) {
            setAppliedCoupon(null);
            toast.error(t.emptyPromoCode);
            return;
        }

        setIsApplyingCoupon(true);
        try {
            const response = await validateCouponCode({
                code,
                subtotal,
            });
            const coupon = response?.data || null;
            setAppliedCoupon(coupon);
            setPromo(coupon?.code || code);
            toast.success(response?.message || `${t.applied}: ${code}`);
        } catch (error) {
            setAppliedCoupon(null);
            toast.error(error?.response?.data?.message || t.invalidCode);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    useEffect(() => {
        if (!appliedCoupon?.code || subtotal <= 0) return undefined;

        let cancelled = false;
        const syncAppliedCoupon = async () => {
            try {
                const response = await validateCouponCode({
                    code: appliedCoupon.code,
                    subtotal,
                });
                if (cancelled) return;
                setAppliedCoupon(response?.data || null);
            } catch {
                if (cancelled) return;
                setAppliedCoupon(null);
                toast.error(t.voucherUnavailable);
            }
        };

        syncAppliedCoupon();
        return () => {
            cancelled = true;
        };
    }, [appliedCoupon?.code, subtotal, t.voucherUnavailable]);

    const inc = (key) => {
        const item = items.find((entry) => entry?.key === key);
        if (!item) return;
        setQty(key, (Number(item.qty) || 1) + 1);
    };

    const dec = (key) => {
        const item = items.find((entry) => entry?.key === key);
        if (!item) return;
        setQty(key, Math.max(1, (Number(item.qty) || 1) - 1));
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const selectSavedContact = (field, listKey, id) => {
        setContactSelections((prev) => ({ ...prev, [field]: id }));
        const selected = getContactById(profile[listKey], id);
        setForm((prev) => ({ ...prev, [field]: selected?.value || "" }));
    };

    const checkout = async () => {
        if (!currentUser) {
            toast.error(t.loginRequired);
            onNavigateLogin?.();
            return;
        }
        if (items.length === 0) {
            toast.error(t.emptyTitle);
            return;
        }

        const payload = {
            lang,
            customer: {
                name: String(form.name || "").trim(),
                email: String(form.email || "").trim(),
                phone: String(form.phone || "").trim(),
                address: String(form.address || "").trim(),
            },
            note: String(form.note || "").trim(),
            paymentMethod: form.paymentMethod || "cod",
            promoCode: appliedCoupon?.code || undefined,
            items: items.map((item) => ({
                productId: item.productId,
                quantity: Number(item.qty) || 1,
                variant: item.variant || "",
            })),
        };

        if (!payload.customer.name || !payload.customer.email || !payload.customer.phone || !payload.customer.address) {
            toast.error(t.checkoutFieldsRequired);
            return;
        }

        setIsSubmitting(true);
        try {
            toast.message(t.placingOrder);
            const response = await createOrder(payload);
            clearCart();
            setItems([]);
            setPromo("");
            setAppliedCoupon(null);
            if (response?.payment?.provider === "momo" && response?.payment?.payUrl) {
                toast.message(
                    lang === "vi"
                        ? "Đang chuyển sang cổng thanh toán chuyển khoản..."
                        : "Redirecting to the bank transfer gateway..."
                );
                window.location.href = response.payment.payUrl;
                return;
            }
            toast.success(response?.message || t.orderPlaced);
            onNavigateOrders?.();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.checkoutError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10">
                <div className="flex flex-col gap-5 sm:gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onNavigateHome}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            {t.back}
                        </button>

                        <div className="flex items-center gap-3">
                            {currentUser && (
                                <button
                                    type="button"
                                    onClick={onNavigateOrders}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-semibold"
                                >
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    {t.viewOrders}
                                </button>
                            )}
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-semibold"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                    {t.clearAll}
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t.title}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.subtitle(itemCount)}</p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="mt-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-10 text-center">
                        <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                            <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                        </div>
                        <h2 className="text-xl font-extrabold">{t.emptyTitle}</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t.emptyDesc}</p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={onNavigateHome}
                                className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                {t.continueShopping}
                            </button>
                            {currentUser && (
                                <button
                                    onClick={onNavigateOrders}
                                    className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                    {t.viewOrders}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8">
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.key}
                                    className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-5 md:p-6 shadow-sm hover:shadow-xl transition-all"
                                >
                                    <div className="flex gap-4">
                                        <div className="h-20 w-24 md:h-24 md:w-28 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400">image</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {item.brand && (
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                                {item.brand}
                                                            </span>
                                                        )}
                                                        {item.variant && (
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                                {item.variant}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 font-extrabold text-lg md:text-xl truncate">{item.name}</div>
                                                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {t.each}:{" "}
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">
                                                            {formatCurrency(item.unitPrice)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xl font-black">
                                                        {formatCurrency((Number(item.unitPrice) || 0) * (Number(item.qty) || 0))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.key)}
                                                        className="mt-2 inline-flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                        aria-label={t.remove}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 px-2 py-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => dec(item.key)}
                                                        disabled={item.qty <= 1}
                                                        className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">remove</span>
                                                    </button>
                                                    <div className="w-8 text-center text-sm font-bold">{item.qty}</div>
                                                    <button
                                                        type="button"
                                                        onClick={() => inc(item.key)}
                                                        disabled={item.qty >= (item.stock || 99)}
                                                        className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm h-fit">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-extrabold">{t.orderSummary}</h2>
                                {appliedCoupon?.code && (
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                                        {t.applied} {appliedCoupon.code}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t.cartItems}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{itemCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t.subtotal}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t.discount}</span>
                                    <span className="font-semibold text-emerald-600">
                                        {discountAmount ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>{t.shipping}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {isShippingLoading
                                            ? t.shippingCalculating
                                            : shippingEstimate
                                                ? (shipping === 0 ? t.free : formatCurrency(shipping))
                                                : t.shippingPending}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-lg font-extrabold">{t.total}</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                            </div>

                            <div className="mt-5">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {t.promoCode}
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        value={promo}
                                        onChange={(event) => {
                                            const nextValue = event.target.value;
                                            setPromo(nextValue);
                                            if (appliedCoupon?.code && nextValue.trim().toUpperCase() !== appliedCoupon.code) {
                                                setAppliedCoupon(null);
                                            }
                                        }}
                                        placeholder={t.promoPlaceholder}
                                        className="flex-1 h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => applyPromo()}
                                        disabled={isApplyingCoupon}
                                        className="h-11 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                                    >
                                        {isApplyingCoupon ? t.applyingCoupon : t.apply}
                                    </button>
                                </div>
                                {currentUserId && myCoupons.length > 0 && (
                                    <div className="mt-3">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.savedVouchers}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {myCoupons.slice(0, 4).map((coupon) => {
                                                const active = appliedCoupon?.code === coupon.code;
                                                return (
                                                    <button
                                                        key={coupon.claimId || coupon._id || coupon.code}
                                                        type="button"
                                                        onClick={() => applyPromo(coupon.code)}
                                                        className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                                                            active
                                                                ? "bg-primary text-white"
                                                                : "bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        }`}
                                                    >
                                                        {coupon.code}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {shippingEstimate && (
                                    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-sm">
                                        {currentUser?.memberTier && (
                                            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-3">
                                                <span className="font-semibold text-slate-600 dark:text-slate-300">{t.loyaltyTier}</span>
                                                <span className="font-black text-primary">{getLoyaltyTierLabel(currentUser.memberTier, lang)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-bold">{t.shippingCarrier}</div>
                                            <div className="font-semibold">{shippingEstimate.carrier || "-"}</div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                                            <span>{t.shippingService}</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{shippingEstimate.service || "-"}</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                                            <span>{t.shippingZone}</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{getShippingZoneLabel(shippingEstimate.zone, lang)}</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                                            <span>{t.shippingEta}</span>
                                            <span className="font-medium text-slate-800 dark:text-slate-200">
                                                {formatShippingEta(shippingEstimate.estimatedMinDays, shippingEstimate.estimatedMaxDays, lang) || "-"}
                                            </span>
                                        </div>
                                        {!shippingEstimate.isFreeShipping && Number(shippingEstimate.freeThreshold) > 0 && (
                                            <div className="mt-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                                {t.shippingFreeAt} {formatCurrency(shippingEstimate.freeThreshold)}
                                            </div>
                                        )}
                                        {shippingDiscountAmount > 0 && (
                                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-bold">{t.shippingTierPerk}</span>
                                                    <span className="font-bold">{getLoyaltyTierLabel(currentUser?.memberTier, lang)}</span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between gap-3">
                                                    <span>{t.shippingTierRate}</span>
                                                    <span>{Number(shippingEstimate.shippingDiscountPercent || 0)}%</span>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between gap-3">
                                                    <span>{t.shippingTierDiscount}</span>
                                                    <span>-{formatCurrency(shippingDiscountAmount)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                            {t.shippingFeeNote}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-4">
                                <div>
                                    <h3 className="font-extrabold text-base">{t.checkoutInfo}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.secureDesc}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.fullName}
                                        </label>
                                        <input
                                            value={form.name}
                                            onChange={(event) => updateField("name", event.target.value)}
                                            className="mt-1 w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.email}
                                        </label>
                                        <select
                                            value={contactSelections.email}
                                            onChange={(event) => selectSavedContact("email", "emails", event.target.value)}
                                            disabled={!profile.emails?.length}
                                            className="mt-1 w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                        >
                                            {profile.emails?.length ? (
                                                profile.emails.map((item) => (
                                                    <option key={item._id || item.value} value={item._id}>
                                                        {item.value}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">{t.email}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.phone}
                                        </label>
                                        <select
                                            value={contactSelections.phone}
                                            onChange={(event) => selectSavedContact("phone", "phones", event.target.value)}
                                            disabled={!profile.phones?.length}
                                            className="mt-1 w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                        >
                                            {profile.phones?.length ? (
                                                profile.phones.map((item) => (
                                                    <option key={item._id || item.value} value={item._id}>
                                                        {item.value}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">{t.phone}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.address}
                                        </label>
                                        <select
                                            value={contactSelections.address}
                                            onChange={(event) => selectSavedContact("address", "addresses", event.target.value)}
                                            disabled={!profile.addresses?.length}
                                            title={form.address || ""}
                                            className="mt-1 w-full h-11 px-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                                        >
                                            {profile.addresses?.length ? (
                                                profile.addresses.map((item) => (
                                                    <option key={item._id || item.value} value={item._id}>
                                                        {formatAddressOptionLabel(item.value)}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">{t.address}</option>
                                            )}
                                        </select>
                                        {form.address && (
                                            <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/30 px-3 py-2.5 text-sm font-medium leading-6 break-words whitespace-normal">
                                                {form.address}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            {t.note}
                                        </label>
                                        <textarea
                                            value={form.note}
                                            onChange={(event) => updateField("note", event.target.value)}
                                            rows={3}
                                            placeholder={t.notePlaceholder}
                                            className="mt-1 w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        {t.paymentMethod}
                                    </label>
                                    <div className="mt-2 grid gap-2">
                                        {PAYMENT_METHOD_OPTIONS.map((method) => {
                                            const active = form.paymentMethod === method;
                                            return (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => updateField("paymentMethod", method)}
                                                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                                                        active
                                                            ? "border-primary bg-primary/10 text-primary"
                                                            : "border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900/40"
                                                    }`}
                                                >
                                                    <span className="font-semibold">{getCheckoutPaymentMethodLabel(method, lang)}</span>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {active ? "check_circle" : "radio_button_unchecked"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={checkout}
                                disabled={isSubmitting || isShippingLoading}
                                className="mt-6 w-full h-12 rounded-2xl bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold flex items-center justify-center gap-2 transition-colors"
                            >
                                {t.checkout}
                                <span className="material-symbols-outlined text-[20px]">
                                    {isSubmitting ? "progress_activity" : "arrow_forward"}
                                </span>
                            </button>

                            <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                                    </div>
                                    <div>
                                        <div className="font-bold">{t.secureTitle}</div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{t.secureDesc}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
