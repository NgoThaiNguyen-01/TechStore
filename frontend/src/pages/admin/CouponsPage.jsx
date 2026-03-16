import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    createCoupon,
    deleteCoupon,
    getAdminCouponDetail,
    getAdminCoupons,
    updateCoupon,
} from "../../services/couponApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Quản lý voucher",
        subtitle: "Tạo, cập nhật và kiểm soát voucher dùng cho checkout.",
        search: "Tìm theo mã, tên hoặc mô tả",
        loading: "Đang tải danh sách voucher...",
        empty: "Chưa có voucher nào.",
        status: "Trạng thái",
        all: "Tất cả",
        statusActive: "Đang hoạt động",
        statusInactive: "Tạm tắt",
        statusScheduled: "Sắp diễn ra",
        statusExpired: "Hết hạn",
        statusSoldOut: "Hết lượt dùng",
        create: "Tạo voucher",
        update: "Cập nhật voucher",
        reset: "Làm mới form",
        save: "Lưu voucher",
        saving: "Đang lưu...",
        code: "Mã voucher",
        name: "Tên voucher",
        description: "Mô tả",
        type: "Loại giảm giá",
        percent: "Phần trăm",
        fixed: "Số tiền",
        value: "Giá trị",
        minOrderAmount: "Đơn tối thiểu",
        maxDiscountAmount: "Giảm tối đa",
        totalQuantity: "Số lượng voucher",
        usedCount: "Đã dùng",
        remaining: "Còn lại",
        perUserLimit: "Giới hạn mỗi khách",
        startAt: "Bắt đầu",
        endAt: "Kết thúc",
        startsNow: "Bắt đầu ngay",
        noEndDate: "Không có ngày hết hạn",
        unlimited: "Không giới hạn",
        isActive: "Đang hoạt động",
        isPublic: "Cho phép khách nhận",
        publicState: "Khách có thể nhận",
        yes: "Có",
        no: "Không",
        view: "Xem chi tiết",
        details: "Chi tiết voucher",
        close: "Đóng",
        edit: "Sửa",
        remove: "Xóa",
        deleteConfirm: "Xóa voucher này?",
        created: "Tạo voucher thành công",
        updated: "Cập nhật voucher thành công",
        deleted: "Đã xóa voucher",
        loadError: "Không thể tải danh sách voucher",
    },
    en: {
        title: "Voucher Management",
        subtitle: "Create, update, and control vouchers for checkout.",
        search: "Search by code, name, or description",
        loading: "Loading vouchers...",
        empty: "No vouchers yet.",
        status: "Status",
        all: "All",
        statusActive: "Active",
        statusInactive: "Inactive",
        statusScheduled: "Scheduled",
        statusExpired: "Expired",
        statusSoldOut: "Sold out",
        create: "Create voucher",
        update: "Update voucher",
        reset: "Reset form",
        save: "Save voucher",
        saving: "Saving...",
        code: "Voucher code",
        name: "Voucher name",
        description: "Description",
        type: "Discount type",
        percent: "Percent",
        fixed: "Fixed amount",
        value: "Value",
        minOrderAmount: "Minimum order",
        maxDiscountAmount: "Max discount",
        totalQuantity: "Voucher quantity",
        usedCount: "Used",
        remaining: "Remaining",
        perUserLimit: "Per-user limit",
        startAt: "Starts at",
        endAt: "Ends at",
        startsNow: "Starts immediately",
        noEndDate: "No expiry date",
        unlimited: "Unlimited",
        isActive: "Active",
        isPublic: "Customers can claim",
        publicState: "Customer claim",
        yes: "Yes",
        no: "No",
        view: "View details",
        details: "Voucher details",
        close: "Close",
        edit: "Edit",
        remove: "Delete",
        deleteConfirm: "Delete this voucher?",
        created: "Voucher created successfully",
        updated: "Voucher updated successfully",
        deleted: "Voucher deleted",
        loadError: "Failed to load vouchers",
    },
};

const buildInitialForm = () => ({
    code: "",
    name: "",
    description: "",
    type: "percent",
    value: 10,
    minOrderAmount: 0,
    maxDiscountAmount: "",
    totalLimit: "",
    perUserLimit: 1,
    startAt: "",
    endAt: "",
    isActive: true,
    isPublic: true,
});

const toInputDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (item) => String(item).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

const formatNumber = (value, lang) => {
    try {
        return new Intl.NumberFormat(lang === "vi" ? "vi-VN" : "en-US", {
            maximumFractionDigits: 0,
        }).format(Number(value) || 0);
    } catch {
        return String(value || 0);
    }
};

const formatDateTime = (value, lang, fallback) => {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getStatusClass = (status) => {
    switch (status) {
        case "active":
            return "bg-emerald-100 text-emerald-700";
        case "scheduled":
            return "bg-sky-100 text-sky-700";
        case "expired":
            return "bg-rose-100 text-rose-700";
        case "sold_out":
            return "bg-amber-100 text-amber-700";
        default:
            return "bg-slate-100 text-slate-600";
    }
};

const getStatusLabel = (status, t) => {
    switch (status) {
        case "active":
            return t.statusActive;
        case "scheduled":
            return t.statusScheduled;
        case "expired":
            return t.statusExpired;
        case "sold_out":
            return t.statusSoldOut;
        case "inactive":
            return t.statusInactive;
        default:
            return status;
    }
};

const getCouponQuantity = (coupon) => {
    const total = Number.isFinite(Number(coupon?.totalLimit)) ? Number(coupon.totalLimit) : null;
    const used = Number(coupon?.usedCount || 0);

    return {
        total,
        used,
        remaining: total === null ? null : Math.max(total - used, 0),
    };
};

function DetailStat({ label, value, tone = "slate" }) {
    const tones = {
        slate: "border-slate-200 bg-white text-slate-900",
        blue: "border-blue-200 bg-blue-50/80 text-blue-900",
        emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
        amber: "border-amber-200 bg-amber-50/80 text-amber-900",
    };

    return (
        <div className={`rounded-2xl border px-4 py-4 shadow-sm ${tones[tone] || tones.slate}`}>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</div>
            <div className="mt-2 text-xl font-black leading-none">{value}</div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
            <div className="text-right text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function ClaimedUserItem({ claim, lang, claimedAtLabel }) {
    const user = claim?.user || {};
    const initials = String(user.name || user.email || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((item) => item.charAt(0).toUpperCase())
        .join("");

    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name || user.email || "user"} className="h-full w-full object-cover" />
                    ) : (
                        initials
                    )}
                </div>
                <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">{user.name || user.email || "-"}</div>
                    <div className="truncate text-sm text-slate-500">{user.email || "-"}</div>
                    {user.phone ? <div className="truncate text-xs text-slate-400">{user.phone}</div> : null}
                </div>
            </div>
            <div className="text-right text-xs font-semibold text-slate-500">
                <div>{claimedAtLabel}</div>
                <div className="mt-1 text-slate-900">{formatDateTime(claim.claimedAt, lang, "-")}</div>
            </div>
        </div>
    );
}

function CouponDetailModal({ coupon, detailLoading, lang, t, onClose, onEdit, onDelete }) {
    if (!coupon && !detailLoading) return null;
    if (detailLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
                <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
                    <div className="text-sm font-semibold text-slate-500">{t.loadingDetail || "Dang tai chi tiet voucher..."}</div>
                </div>
            </div>
        );
    }

    const quantity = getCouponQuantity(coupon);
    const voucherValue = coupon.type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value);
    const claimedUsers = coupon.claimedUsers || [];
    const claimedCustomersLabel = t.claimedCustomers || (lang === "vi" ? "Khach da nhan" : "Claimed customers");
    const claimedUsersTitle = t.claimedUsersTitle || (lang === "vi" ? "Khach hang da nhan voucher" : "Customers who claimed this voucher");
    const claimedAtLabel = t.claimedAt || (lang === "vi" ? "Thoi gian nhan" : "Claimed at");
    const noClaimedUsers = t.noClaimedUsers || (lang === "vi" ? "Chua co khach hang nao nhan voucher nay." : "No customer has claimed this voucher yet.");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
                <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
                <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_38%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#1e293b_100%)] px-6 py-6 text-white">
                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.26em] text-white/75">
                                {coupon.code}
                            </div>
                            <h3 className="mt-4 text-2xl font-black tracking-tight">{coupon.name}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                {coupon.description || coupon.code}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getStatusClass(coupon.status)}`}
                            >
                                {getStatusLabel(coupon.status, t)}
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <DetailStat label={t.value} value={voucherValue} tone="blue" />
                        <DetailStat
                            label={t.totalQuantity}
                            value={quantity.total === null ? t.unlimited : formatNumber(quantity.total, lang)}
                            tone="slate"
                        />
                        <DetailStat
                            label={claimedCustomersLabel}
                            value={formatNumber(coupon.claimedCount || claimedUsers.length, lang)}
                            tone="blue"
                        />
                        <DetailStat label={t.usedCount} value={formatNumber(quantity.used, lang)} tone="amber" />
                        <DetailStat
                            label={t.remaining}
                            value={quantity.remaining === null ? t.unlimited : formatNumber(quantity.remaining, lang)}
                            tone="emerald"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-slate-50 px-6 py-5 lg:grid-cols-2">
                    <div className="space-y-3">
                        <DetailRow label={t.minOrderAmount} value={formatCurrency(coupon.minOrderAmount)} />
                        <DetailRow
                            label={t.maxDiscountAmount}
                            value={Number(coupon.maxDiscountAmount) > 0 ? formatCurrency(coupon.maxDiscountAmount) : t.unlimited}
                        />
                        <DetailRow label={t.perUserLimit} value={formatNumber(coupon.perUserLimit, lang)} />
                    </div>

                    <div className="space-y-3">
                        <DetailRow label={t.startAt} value={formatDateTime(coupon.startAt, lang, t.startsNow)} />
                        <DetailRow label={t.endAt} value={formatDateTime(coupon.endAt, lang, t.noEndDate)} />
                        <DetailRow label={t.publicState} value={coupon.isPublic ? t.yes : t.no} />
                    </div>
                </div>

                <div className="border-t border-slate-200 bg-white px-6 py-5">
                    <div className="flex items-center justify-between gap-3">
                        <h4 className="text-lg font-black text-slate-900">{claimedUsersTitle}</h4>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {formatNumber(coupon.claimedCount || claimedUsers.length, lang)}
                        </span>
                    </div>

                    {claimedUsers.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            {noClaimedUsers}
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {claimedUsers.map((claim) => (
                                <ClaimedUserItem
                                    key={claim._id}
                                    claim={claim}
                                    lang={lang}
                                    claimedAtLabel={claimedAtLabel}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                    {onEdit ? (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-5 font-bold text-slate-900 transition-colors hover:bg-slate-50"
                        >
                            {t.edit}
                        </button>
                    ) : null}
                    {onDelete ? (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="h-11 rounded-2xl bg-rose-50 px-5 font-bold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                            {t.remove}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-2xl bg-slate-900 px-5 font-bold text-white transition-opacity hover:opacity-90"
                    >
                        {t.close}
                    </button>
                </div>
                </div>
            </div>
        </div>
    );
}

export default function CouponsPage({ lang }) {
    const t = T[lang] || T.vi;
    const currentUser = readStoredUserProfile();
    const canCreateCoupon = hasAdminPermission(currentUser, "coupon:create");
    const canUpdateCoupon = hasAdminPermission(currentUser, "coupon:update");
    const canDeleteCoupon = hasAdminPermission(currentUser, "coupon:delete");

    const [form, setForm] = useState(buildInitialForm);
    const [editingId, setEditingId] = useState("");
    const [coupons, setCoupons] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [detailCoupon, setDetailCoupon] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const formTitle = editingId ? t.update : t.create;
    const canSubmitCoupon = editingId ? canUpdateCoupon : canCreateCoupon;
    const accessDeniedMessage =
        lang === "vi"
            ? "Bạn không có quyền thực hiện thao tác này"
            : "You do not have permission to perform this action";

    const resetForm = () => {
        setEditingId("");
        setForm(buildInitialForm());
    };

    const loadCoupons = useCallback(async () => {
        setLoading(true);

        try {
            const response = await getAdminCoupons({
                search: search.trim() || undefined,
                limit: 50,
            });
            setCoupons(response?.data || []);
        } catch (error) {
            setCoupons([]);
            toast.error(error?.response?.data?.message || t.loadError);
        } finally {
            setLoading(false);
        }
    }, [search, t.loadError]);

    useEffect(() => {
        void loadCoupons();
    }, [loadCoupons]);

    const displayedCoupons = useMemo(() => {
        if (statusFilter === "all") return coupons;
        return coupons.filter((coupon) => coupon.status === statusFilter);
    }, [coupons, statusFilter]);

    const openEditForm = (coupon) => {
        if (!coupon) return;
        if (!canUpdateCoupon) {
            toast.error(accessDeniedMessage);
            return;
        }

        setDetailCoupon(null);
        setDetailLoading(false);
        setEditingId(coupon._id);
        setForm({
            code: coupon.code || "",
            name: coupon.name || "",
            description: coupon.description || "",
            type: coupon.type || "percent",
            value: Number(coupon.value) || 0,
            minOrderAmount: Number(coupon.minOrderAmount) || 0,
            maxDiscountAmount: Number(coupon.maxDiscountAmount) > 0 ? Number(coupon.maxDiscountAmount) : "",
            totalLimit: Number.isFinite(Number(coupon.totalLimit)) ? Number(coupon.totalLimit) : "",
            perUserLimit: Number(coupon.perUserLimit) || 1,
            startAt: toInputDateTime(coupon.startAt),
            endAt: toInputDateTime(coupon.endAt),
            isActive: Boolean(coupon.isActive),
            isPublic: Boolean(coupon.isPublic),
        });
    };

    const openDetail = async (couponId) => {
        if (!couponId) return;

        setDetailLoading(true);
        setDetailCoupon(null);

        try {
            const response = await getAdminCouponDetail(couponId);
            setDetailCoupon(response?.data || null);
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.loadError);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!canSubmitCoupon) {
            toast.error(accessDeniedMessage);
            return;
        }
        const payload = {
            code: form.code,
            name: form.name,
            description: form.description,
            type: form.type,
            value: Number(form.value) || 0,
            minOrderAmount: Number(form.minOrderAmount) || 0,
            maxDiscountAmount: form.maxDiscountAmount === "" ? "" : Number(form.maxDiscountAmount) || 0,
            totalLimit: form.totalLimit === "" ? "" : Number(form.totalLimit) || 0,
            perUserLimit: Number(form.perUserLimit) || 1,
            startAt: form.startAt || "",
            endAt: form.endAt || "",
            isActive: Boolean(form.isActive),
            isPublic: Boolean(form.isPublic),
        };

        setSaving(true);
        try {
            const response = editingId
                ? await updateCoupon(editingId, payload)
                : await createCoupon(payload);

            toast.success(response?.message || (editingId ? t.updated : t.created));

            if (editingId && detailCoupon?._id === response?.data?._id) {
                setDetailCoupon(response.data);
            }

            resetForm();
            await loadCoupons();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.loadError);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (couponId) => {
        if (!canDeleteCoupon) {
            toast.error(accessDeniedMessage);
            return;
        }
        if (!couponId || !window.confirm(t.deleteConfirm)) return;

        try {
            const response = await deleteCoupon(couponId);
            toast.success(response?.message || t.deleted);

            if (detailCoupon?._id === couponId) {
                setDetailCoupon(null);
            }

            if (editingId === couponId) {
                resetForm();
            }

            await loadCoupons();
        } catch (error) {
            toast.error(error?.response?.data?.message || error?.message || t.loadError);
        }
    };

    return (
        <div className="mx-auto max-w-[1600px] p-5 lg:p-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{t.title}</h1>
                <p className="text-slate-500">{t.subtitle}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
                <section className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-extrabold text-slate-900">{formTitle}</h2>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="text-sm font-semibold text-slate-500 transition-colors hover:text-primary"
                        >
                            {t.reset}
                        </button>
                    </div>

                    <fieldset
                        className={`mt-5 grid grid-cols-1 gap-4 ${canSubmitCoupon ? "" : "opacity-60"}`}
                        disabled={!canSubmitCoupon || saving}
                    >
                        <input
                            value={form.code}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    code: event.target.value.toUpperCase(),
                                }))
                            }
                            placeholder={t.code}
                            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                            value={form.name}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            placeholder={t.name}
                            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))
                            }
                            placeholder={t.description}
                            rows={4}
                            className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={form.type}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        type: event.target.value,
                                    }))
                                }
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="percent">{t.percent}</option>
                                <option value="fixed">{t.fixed}</option>
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={form.value}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        value: event.target.value,
                                    }))
                                }
                                placeholder={t.value}
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                min="0"
                                value={form.minOrderAmount}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        minOrderAmount: event.target.value,
                                    }))
                                }
                                placeholder={t.minOrderAmount}
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <input
                                type="number"
                                min="0"
                                value={form.maxDiscountAmount}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        maxDiscountAmount: event.target.value,
                                    }))
                                }
                                placeholder={t.maxDiscountAmount}
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                min="1"
                                value={form.totalLimit}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        totalLimit: event.target.value,
                                    }))
                                }
                                placeholder={t.totalQuantity}
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <input
                                type="number"
                                min="1"
                                value={form.perUserLimit}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        perUserLimit: event.target.value,
                                    }))
                                }
                                placeholder={t.perUserLimit}
                                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {t.startAt}
                                </div>
                                <input
                                    type="datetime-local"
                                    value={form.startAt}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            startAt: event.target.value,
                                        }))
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                                    {t.endAt}
                                </div>
                                <input
                                    type="datetime-local"
                                    value={form.endAt}
                                    onChange={(event) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            endAt: event.target.value,
                                        }))
                                    }
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        isActive: event.target.checked,
                                    }))
                                }
                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t.isActive}
                        </label>

                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.isPublic}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        isPublic: event.target.checked,
                                    }))
                                }
                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t.isPublic}
                        </label>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmitCoupon || saving}
                            className="h-12 rounded-2xl bg-primary font-extrabold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                        >
                            {saving ? t.saving : t.save}
                        </button>
                    </fieldset>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t.search}
                            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="all">
                                {t.status}: {t.all}
                            </option>
                            <option value="active">{t.statusActive}</option>
                            <option value="scheduled">{t.statusScheduled}</option>
                            <option value="sold_out">{t.statusSoldOut}</option>
                            <option value="expired">{t.statusExpired}</option>
                            <option value="inactive">{t.statusInactive}</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="mt-6 text-sm text-slate-500">{t.loading}</div>
                    ) : displayedCoupons.length === 0 ? (
                        <div className="mt-6 text-sm text-slate-500">{t.empty}</div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {displayedCoupons.map((coupon) => {
                                const quantity = getCouponQuantity(coupon);

                                return (
                                    <article
                                        key={coupon._id}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                                                    {coupon.code}
                                                </div>
                                                <h3 className="mt-2 text-xl font-black text-slate-900">
                                                    {coupon.name}
                                                </h3>
                                                <p className="mt-2 min-h-[42px] text-sm text-slate-500">
                                                    {coupon.description || coupon.code}
                                                </p>
                                            </div>

                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(coupon.status)}`}
                                            >
                                                {getStatusLabel(coupon.status, t)}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600 xl:grid-cols-4">
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.value}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {coupon.type === "percent"
                                                        ? `${coupon.value}%`
                                                        : formatCurrency(coupon.value)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.totalQuantity}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {quantity.total === null
                                                        ? t.unlimited
                                                        : formatNumber(quantity.total, lang)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.claimedCustomers || (lang === "vi" ? "Khach da nhan" : "Claimed customers")}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {formatNumber(coupon.claimedCount || 0, lang)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.usedCount}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {formatNumber(quantity.used, lang)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.remaining}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {quantity.remaining === null
                                                        ? t.unlimited
                                                        : formatNumber(quantity.remaining, lang)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.minOrderAmount}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {formatCurrency(coupon.minOrderAmount)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase tracking-widest text-slate-400">
                                                    {t.perUserLimit}
                                                </div>
                                                <div className="mt-1 font-bold">
                                                    {formatNumber(coupon.perUserLimit, lang)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => openDetail(coupon._id)}
                                                className="h-10 rounded-2xl border border-slate-200 px-4 font-bold transition-colors hover:bg-white"
                                            >
                                                {t.view}
                                            </button>
                                            {canUpdateCoupon ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(coupon)}
                                                    className="h-10 rounded-2xl border border-slate-200 px-4 font-bold transition-colors hover:bg-white"
                                                >
                                                    {t.edit}
                                                </button>
                                            ) : null}
                                            {canDeleteCoupon ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(coupon._id)}
                                                    className="h-10 rounded-2xl bg-rose-50 px-4 font-bold text-rose-700 transition-colors hover:bg-rose-100"
                                                >
                                                    {t.remove}
                                                </button>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <CouponDetailModal
                coupon={detailCoupon}
                detailLoading={detailLoading}
                lang={lang}
                t={t}
                onClose={() => {
                    setDetailCoupon(null);
                    setDetailLoading(false);
                }}
                onEdit={canUpdateCoupon ? () => openEditForm(detailCoupon) : null}
                onDelete={canDeleteCoupon ? () => handleDelete(detailCoupon?._id) : null}
            />
        </div>
    );
}
