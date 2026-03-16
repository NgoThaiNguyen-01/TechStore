import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { clearFlashSale, createFlashSale, getAdminFlashSales } from "../../services/flashSaleApi";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const T = {
    vi: {
        title: "Flash Sale",
        subtitle: "Lưu lịch sử Flash Sale và theo dõi người tạo ở mỗi lần đăng.",
        historySubtitle: "Mỗi lần lưu sẽ tạo một bản ghi mới để bạn dễ theo dõi và đối soát.",
        endLabel: "Thời gian kết thúc",
        endHint: "Mỗi lần lưu sẽ tạo một bản ghi Flash Sale mới.",
        save: "Lưu thiết lập",
        clear: "Kết thúc ngay",
        saved: "Đã tạo Flash Sale mới",
        cleared: "Đã kết thúc Flash Sale hiện tại",
        invalid: "Thời gian không hợp lệ",
        futureRequired: "Thời gian kết thúc phải lớn hơn thời gian hiện tại",
        loadError: "Không thể tải dữ liệu Flash Sale",
        noActiveFlashSale: "Hiện không có Flash Sale đang hoạt động",
        noAccess: "Bạn không có quyền cấu hình Flash Sale",
        current: "Flash Sale đang chạy",
        emptyCurrent: "Chưa có Flash Sale đang hoạt động.",
        history: "Lịch sử Flash Sale",
        emptyHistory: "Chưa có lịch sử Flash Sale.",
        createdBy: "Người tạo",
        createdAt: "Tạo lúc",
        endAt: "Kết thúc lúc",
        closedAt: "Đóng lúc",
        status: "Trạng thái",
        clearReason: "Lý do đóng",
        active: "Đang hoạt động",
        clearedStatus: "Đã kết thúc",
        replacedStatus: "Đã thay thế",
        expiredStatus: "Hết hạn",
        clearedReason: "Kết thúc thủ công",
        replacedReason: "Bị thay thế bởi đợt mới",
        expiredReason: "Tự hết hạn",
        unknownUser: "Không rõ",
        loading: "Đang tải lịch sử...",
    },
    en: {
        title: "Flash Sale",
        subtitle: "Keep a Flash Sale history and track who created each publish.",
        historySubtitle: "Every save creates a new record so your team can track each campaign clearly.",
        endLabel: "End time",
        endHint: "Each save creates a new Flash Sale record.",
        save: "Save settings",
        clear: "End current",
        saved: "Created a new Flash Sale",
        cleared: "Current Flash Sale ended",
        invalid: "Invalid time",
        futureRequired: "The end time must be later than the current time",
        loadError: "Failed to load Flash Sale data",
        noActiveFlashSale: "There is no active Flash Sale right now",
        noAccess: "You do not have permission to manage Flash Sale",
        current: "Current Flash Sale",
        emptyCurrent: "There is no active Flash Sale.",
        history: "Flash Sale history",
        emptyHistory: "No Flash Sale history yet.",
        createdBy: "Created by",
        createdAt: "Created at",
        endAt: "Ends at",
        closedAt: "Closed at",
        status: "Status",
        clearReason: "Close reason",
        active: "Active",
        clearedStatus: "Cleared",
        replacedStatus: "Replaced",
        expiredStatus: "Expired",
        clearedReason: "Ended manually",
        replacedReason: "Replaced by a newer campaign",
        expiredReason: "Expired automatically",
        unknownUser: "Unknown",
        loading: "Loading history...",
    },
};

const STATUS_TONE = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cleared: "bg-amber-50 text-amber-700 border-amber-200",
    replaced: "bg-blue-50 text-blue-700 border-blue-200",
    expired: "bg-slate-100 text-slate-600 border-slate-200",
};

const toInputValue = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (v) => String(v).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const getStatusLabel = (status, t) => {
    if (status === "active") return t.active;
    if (status === "cleared") return t.clearedStatus;
    if (status === "replaced") return t.replacedStatus;
    return t.expiredStatus;
};

const getCloseReasonLabel = (reason, t) => {
    if (reason === "cleared") return t.clearedReason;
    if (reason === "replaced") return t.replacedReason;
    if (reason === "expired") return t.expiredReason;
    return "--";
};

const resolveFlashSaleErrorMessage = (error, t) => {
    const message = String(error?.response?.data?.message || "").trim();
    if (!message) return t.invalid;
    if (message === "Invalid flash sale end time") return t.invalid;
    if (message === "Flash sale end time must be in the future") return t.futureRequired;
    if (message === "No active flash sale found") return t.noActiveFlashSale;
    return message;
};

const formatDateTime = (value, lang) => {
    if (!value) return "--";
    try {
        return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(new Date(value));
    } catch {
        return "--";
    }
};

const InfoItem = ({ label, value }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-semibold text-slate-900 break-words">{value || "--"}</p>
    </div>
);

export default function FlashSaleSettings({ lang = "vi" }) {
    const t = T[lang] || T.vi;
    const [value, setValue] = useState("");
    const currentUser = readStoredUserProfile();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([]);
    const [current, setCurrent] = useState(null);

    const canEdit = useMemo(
        () => hasAdminPermission(currentUser, "settings:update"),
        [currentUser]
    );

    const loadFlashSales = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAdminFlashSales();
            const nextCurrent = response?.data?.current || null;
            setCurrent(nextCurrent);
            setItems(response?.data?.items || []);
            setValue(nextCurrent?.endAt ? toInputValue(nextCurrent.endAt) : "");
        } catch (error) {
            console.error("Failed to load flash sales", error);
            toast.error(t.loadError);
        } finally {
            setLoading(false);
        }
    }, [t.loadError]);

    useEffect(() => {
        void loadFlashSales();
    }, [loadFlashSales]);

    const handleSave = async () => {
        if (!canEdit) {
            toast.error(t.noAccess);
            return;
        }
        if (!value) {
            toast.error(t.invalid);
            return;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            toast.error(t.invalid);
            return;
        }

        setSaving(true);
        try {
            const response = await createFlashSale({ endAt: date.toISOString() });
            const nextCurrent = response?.data || null;
            setCurrent(nextCurrent);
            setValue(nextCurrent?.endAt ? toInputValue(nextCurrent.endAt) : value);
            toast.success(t.saved);
            await loadFlashSales();
        } catch (error) {
            toast.error(resolveFlashSaleErrorMessage(error, t));
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!canEdit) {
            toast.error(t.noAccess);
            return;
        }

        setSaving(true);
        try {
            await clearFlashSale();
            setCurrent(null);
            setValue("");
            toast.success(t.cleared);
            await loadFlashSales();
        } catch (error) {
            toast.error(resolveFlashSaleErrorMessage(error, t));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1280px] space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <span className="material-symbols-outlined">local_fire_department</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{t.title}</h2>
                            <p className="mt-1 max-w-2xl text-sm text-slate-500">{t.subtitle}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 min-w-[280px]">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t.current}</p>
                        {current ? (
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_TONE[current.status] || STATUS_TONE.expired}`}>
                                        {getStatusLabel(current.status, t)}
                                    </span>
                                    <span className="text-xs text-slate-500">{formatDateTime(current.endAt, lang)}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {t.createdBy}: {current?.createdBy?.name || current?.createdBy?.email || t.unknownUser}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">{t.emptyCurrent}</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            {t.endLabel}
                        </label>
                        <input
                            type="datetime-local"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3.5 py-3 text-sm border rounded-2xl transition-all outline-none border-slate-200 focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                            disabled={!canEdit || saving}
                        />
                        <p className="text-xs text-slate-400 mt-2">{t.endHint}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-5 py-3 text-sm font-semibold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors disabled:opacity-60"
                        disabled={!canEdit || saving}
                    >
                        {t.clear}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-3 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-2xl transition-colors shadow-sm shadow-primary/20 disabled:opacity-60"
                        disabled={!canEdit || saving}
                    >
                        {t.save}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-7">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{t.history}</h3>
                        <p className="mt-1 text-sm text-slate-500">{t.historySubtitle}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                        {t.loading}
                    </div>
                ) : items.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                        {t.emptyHistory}
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {items.map((item) => (
                            <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${STATUS_TONE[item.status] || STATUS_TONE.expired}`}>
                                                {getStatusLabel(item.status, t)}
                                            </span>
                                            <span className="text-xs font-medium text-slate-400">
                                                {t.createdAt}: {formatDateTime(item.createdAt, lang)}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-base font-bold text-slate-900">
                                            {item?.createdBy?.name || item?.createdBy?.email || t.unknownUser}
                                        </p>
                                        <p className="text-sm text-slate-500">{item?.createdBy?.email || "--"}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                                    <InfoItem label={t.endAt} value={formatDateTime(item.endAt, lang)} />
                                    <InfoItem label={t.createdBy} value={item?.createdBy?.name || item?.createdBy?.email || t.unknownUser} />
                                    <InfoItem label={t.createdAt} value={formatDateTime(item.createdAt, lang)} />
                                    <InfoItem label={t.closedAt} value={formatDateTime(item.closedAt, lang)} />
                                    <InfoItem label={t.clearReason} value={getCloseReasonLabel(item.closeReason, t)} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
