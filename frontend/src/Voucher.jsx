import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { claimCoupon, getMyCoupons, getPublicCoupons } from "./services/couponApi";
import { readStoredUserProfile } from "./utils/userProfile";

const T = {
    vi: {
        back: "Quay lại",
        title: "Voucher",
        subtitle: "Lưu voucher vào tài khoản và dùng trực tiếp khi thanh toán.",
        codeLabel: "Mã voucher",
        codePlaceholder: "Nhập mã voucher",
        claim: "Nhận voucher",
        claiming: "Đang nhận...",
        available: "Voucher đang có",
        myVouchers: "Voucher của tôi",
        emptyAvailable: "Chưa có voucher công khai nào.",
        emptyAvailableClaimed: "Bạn đã nhận hết voucher hiện có.",
        emptyMine: "Bạn chưa nhận voucher nào.",
        copied: "Đã sao chép mã",
        invalid: "Không thể nhận voucher",
        claimed: "Đã nhận voucher",
        already: "Voucher đã có trong tài khoản",
        loginRequired: "Vui lòng đăng nhập để nhận voucher",
        minOrder: "Đơn tối thiểu",
        expiry: "Hết hạn",
        noExpiry: "Không giới hạn",
        publicBadge: "Công khai",
        addedBadge: "Đã lưu",
        copy: "Sao chép",
        useNow: "Dùng tại giỏ hàng",
        loading: "Đang tải voucher...",
        valueOff: "Giảm",
    },
    en: {
        back: "Back",
        title: "Vouchers",
        subtitle: "Save vouchers to your account and use them directly at checkout.",
        codeLabel: "Voucher code",
        codePlaceholder: "Enter voucher code",
        claim: "Claim voucher",
        claiming: "Claiming...",
        available: "Available vouchers",
        myVouchers: "My vouchers",
        emptyAvailable: "No public vouchers available.",
        emptyAvailableClaimed: "You have already claimed all available vouchers.",
        emptyMine: "You have not claimed any vouchers yet.",
        copied: "Copied code",
        invalid: "Could not claim voucher",
        claimed: "Voucher claimed",
        already: "Voucher already in your account",
        loginRequired: "Please sign in to claim vouchers",
        minOrder: "Minimum order",
        expiry: "Expires",
        noExpiry: "No expiry",
        publicBadge: "Public",
        addedBadge: "Saved",
        copy: "Copy",
        useNow: "Use in cart",
        loading: "Loading vouchers...",
        valueOff: "Off",
    },
};

const formatCurrency = (value) => {
    try {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Number(value) || 0);
    } catch {
        return String(value || 0);
    }
};

const formatCouponValue = (coupon, lang) => {
    if (!coupon) return "";
    if (coupon.type === "percent") {
        return `${Number(coupon.value || 0)}% ${lang === "vi" ? "OFF" : "OFF"}`;
    }
    return `${lang === "vi" ? "Giảm" : "Save"} ${formatCurrency(coupon.value)}`;
};

const formatDate = (value, lang) => {
    if (!value) return lang === "vi" ? "Không giới hạn" : "No expiry";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return lang === "vi" ? "Không giới hạn" : "No expiry";
    return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

function VoucherCard({ coupon, lang, t, actionLabel, onAction, actionDisabled, secondaryAction, badge }) {
    return (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{coupon.code}</div>
                    <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{coupon.name}</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 min-h-[42px]">
                        {coupon.description || coupon.code}
                    </p>
                </div>
                <div className="rounded-2xl bg-primary/10 text-primary px-3 py-2 text-sm font-black whitespace-nowrap">
                    {formatCouponValue(coupon, lang)}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {badge ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold">
                        {badge}
                    </span>
                ) : null}
                {coupon.isPublic ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-bold">
                        {t.publicBadge}
                    </span>
                ) : null}
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between gap-4">
                    <span>{t.minOrder}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                        {coupon.minOrderAmount ? formatCurrency(coupon.minOrderAmount) : formatCurrency(0)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span>{t.expiry}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                        {coupon.endAt ? formatDate(coupon.endAt, lang) : t.noExpiry}
                    </span>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={onAction}
                    disabled={actionDisabled}
                    className="flex-1 min-w-[140px] h-11 rounded-2xl bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold transition-colors"
                >
                    {actionLabel}
                </button>
                {secondaryAction ? (
                    <button
                        type="button"
                        onClick={secondaryAction.onClick}
                        className="h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                        {secondaryAction.label}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default function Voucher({ lang, setLang, onNavigateHome, onNavigateLogin, onNavigateCart }) {
    const t = T[lang] || T.vi;
    const [currentUser, setCurrentUser] = useState(() => readStoredUserProfile());
    const [code, setCode] = useState("");
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [myCoupons, setMyCoupons] = useState([]);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [loadingMine, setLoadingMine] = useState(false);
    const [claimingCode, setClaimingCode] = useState("");

    const claimedCodeSet = useMemo(
        () => new Set(myCoupons.map((item) => String(item?.code || "").toUpperCase()).filter(Boolean)),
        [myCoupons]
    );
    const availableUnclaimedCoupons = useMemo(
        () => availableCoupons.filter((coupon) => !claimedCodeSet.has(String(coupon?.code || "").toUpperCase())),
        [availableCoupons, claimedCodeSet]
    );

    useEffect(() => {
        const syncUser = () => setCurrentUser(readStoredUserProfile());
        window.addEventListener("user:updated", syncUser);
        window.addEventListener("storage", syncUser);
        return () => {
            window.removeEventListener("user:updated", syncUser);
            window.removeEventListener("storage", syncUser);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingAvailable(true);
            try {
                const response = await getPublicCoupons();
                if (cancelled) return;
                setAvailableCoupons(response?.data || []);
            } catch {
                if (cancelled) return;
                setAvailableCoupons([]);
            } finally {
                if (!cancelled) setLoadingAvailable(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!currentUser?.id) {
            setMyCoupons([]);
            return undefined;
        }

        let cancelled = false;
        const load = async () => {
            setLoadingMine(true);
            try {
                const response = await getMyCoupons();
                if (cancelled) return;
                setMyCoupons(response?.data || []);
            } catch {
                if (cancelled) return;
                setMyCoupons([]);
            } finally {
                if (!cancelled) setLoadingMine(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id]);

    const handleClaim = async (value) => {
        const nextCode = String(value || code || "").trim().toUpperCase();
        if (!currentUser?.id) {
            toast.error(t.loginRequired);
            onNavigateLogin?.();
            return;
        }
        if (!nextCode) {
            toast.error(t.invalid);
            return;
        }

        setClaimingCode(nextCode);
        try {
            const response = await claimCoupon(nextCode);
            const claimed = response?.data;
            if (claimed?.code) {
                setMyCoupons((prev) => {
                    const exists = prev.some((item) => String(item?.code || "").toUpperCase() === claimed.code);
                    return exists ? prev : [claimed, ...prev];
                });
            }
            toast.success(response?.message || `${t.claimed}: ${nextCode}`);
            setCode("");
        } catch (error) {
            toast.error(error?.response?.data?.message || t.invalid);
        } finally {
            setClaimingCode("");
        }
    };

    const copyCode = async (value) => {
        try {
            await navigator.clipboard.writeText(String(value || ""));
            toast.success(t.copied);
        } catch {
            toast.success(`${t.copied}: ${value}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-10">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onNavigateHome}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        {t.back}
                    </button>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t.title}</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">{t.subtitle}</p>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
                        <div>
                            <label className="text-sm font-bold">{t.codeLabel}</label>
                            <input
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                placeholder={t.codePlaceholder}
                                className="mt-2 w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleClaim(code)}
                            disabled={claimingCode === String(code || "").trim().toUpperCase()}
                            className="h-12 mt-[30px] rounded-2xl bg-primary hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold transition-colors"
                        >
                            {claimingCode === String(code || "").trim().toUpperCase() ? t.claiming : t.claim}
                        </button>
                    </div>
                </div>

                <section className="mt-8">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-black">{t.available}</h2>
                    </div>
                    {loadingAvailable ? (
                        <div className="mt-4 text-sm text-slate-500">{t.loading}</div>
                    ) : availableCoupons.length === 0 ? (
                        <div className="mt-4 text-sm text-slate-500">{t.emptyAvailable}</div>
                    ) : availableUnclaimedCoupons.length === 0 ? (
                        <div className="mt-4 text-sm text-slate-500">{t.emptyAvailableClaimed}</div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {availableUnclaimedCoupons.map((coupon) => {
                                const isClaiming = claimingCode === String(coupon.code || "").toUpperCase();
                                return (
                                    <VoucherCard
                                        key={coupon._id || coupon.code}
                                        coupon={coupon}
                                        lang={lang}
                                        t={t}
                                        badge=""
                                        actionLabel={isClaiming ? t.claiming : t.claim}
                                        actionDisabled={isClaiming}
                                        onAction={() => handleClaim(coupon.code)}
                                        secondaryAction={{
                                            label: t.copy,
                                            onClick: () => copyCode(coupon.code),
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="mt-10">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-black">{t.myVouchers}</h2>
                    </div>
                    {loadingMine ? (
                        <div className="mt-4 text-sm text-slate-500">{t.loading}</div>
                    ) : myCoupons.length === 0 ? (
                        <div className="mt-4 text-sm text-slate-500">{t.emptyMine}</div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {myCoupons.map((coupon) => (
                                <VoucherCard
                                    key={coupon.claimId || coupon._id || coupon.code}
                                    coupon={coupon}
                                    lang={lang}
                                    t={t}
                                    badge={t.addedBadge}
                                    actionLabel={t.copy}
                                    actionDisabled={false}
                                    onAction={() => copyCode(coupon.code)}
                                    secondaryAction={{
                                        label: t.useNow,
                                        onClick: onNavigateCart || onNavigateHome,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
