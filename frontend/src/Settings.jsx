import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Footer from "./components/Footer";
import { subscribeRealtime } from "./services/realtime";
import axiosInstance from "./services/axiosConfig";
import { changeMyPassword, deleteMyAccount, getMyProfile, updateMyProfile, uploadAvatar } from "./services/userApi";
import { clearStoredAuth, getStoredAccessToken } from "./utils/authStorage";
import { passwordIssues, validateConfirmPassword } from "./utils/registerValidation";
import {
    normalizeUserProfile,
    readStoredUserProfile,
    removeContactItem,
    setDefaultContact,
    upsertContactItem,
    writeStoredUserProfile,
} from "./utils/userProfile";

const T = {
    vi: {
        back: "Quay lại",
        title: "Cài đặt",
        subtitle: "Quản lý hồ sơ giao hàng và bảo mật tài khoản.",
        tabs: { profile: "Hồ sơ", password: "Mật khẩu", danger: "Xóa tài khoản" },
        save: "Lưu thay đổi",
        saving: "Đang lưu...",
        loading: "Đang tải...",
        name: "Họ và tên",
        avatar: "Avatar URL",
        avatarPlaceholder: "Dán URL ảnh (https://...)",
        chooseFile: "Chọn file",
        emails: "Email nhận hàng",
        phones: "Số điện thoại",
        addresses: "Địa chỉ nhận hàng",
        emailPlaceholder: "Nhập email mới",
        phonePlaceholder: "Nhập số điện thoại mới",
        addressPlaceholder: "Nhập địa chỉ mới",
        add: "Thêm",
        remove: "Xóa",
        setDefault: "Đặt mặc định",
        default: "Mặc định",
        pwdCurrent: "Mật khẩu hiện tại",
        pwdNext: "Mật khẩu mới",
        pwdConfirm: "Xác nhận mật khẩu mới",
        pwdSave: "Cập nhật mật khẩu",
        deleteTitle: "Vùng nguy hiểm",
        deleteDesc: "Thao tác này sẽ xóa vĩnh viễn tài khoản.",
        deleteBtn: "Xóa tài khoản",
        deleteConfirm: "Bạn có chắc chắn muốn xóa tài khoản không?",
        updated: "Đã cập nhật hồ sơ",
        passwordUpdated: "Đổi mật khẩu thành công",
        deleted: "Đã xóa tài khoản",
        required: "Bắt buộc",
        invalidEmail: "Email không đúng định dạng",
        invalidPhone: "Số điện thoại không hợp lệ",
        invalidUrl: "URL không hợp lệ",
        max: "Vượt quá giới hạn ký tự",
        pendingDraft: "Bạn còn dữ liệu mới chưa thêm vào danh sách.",
        needEmail: "Cần ít nhất 1 email mặc định.",
        generic: "Có lỗi xảy ra",
        needLogin: "Vui lòng đăng nhập",
        loyaltyTitle: "Thành viên TechStore",
        loyaltySubtitle: "Theo dõi hạng thành viên, điểm thưởng và ưu đãi hiện tại.",
        loyaltyPoints: "Điểm thưởng",
        loyaltySpent: "Chi tiêu tích lũy",
        loyaltyTier: "Hạng hiện tại",
        loyaltyPerks: "Ưu đãi theo hạng",
    },
    en: {
        back: "Back",
        title: "Settings",
        subtitle: "Manage shipping profile and account security.",
        tabs: { profile: "Profile", password: "Password", danger: "Delete account" },
        save: "Save changes",
        saving: "Saving...",
        loading: "Loading...",
        name: "Full name",
        avatar: "Avatar URL",
        avatarPlaceholder: "Paste image URL (https://...)",
        chooseFile: "Choose file",
        emails: "Order emails",
        phones: "Phone numbers",
        addresses: "Shipping addresses",
        emailPlaceholder: "Enter a new email",
        phonePlaceholder: "Enter a new phone number",
        addressPlaceholder: "Enter a new address",
        add: "Add",
        remove: "Remove",
        setDefault: "Set default",
        default: "Default",
        pwdCurrent: "Current password",
        pwdNext: "New password",
        pwdConfirm: "Confirm new password",
        pwdSave: "Update password",
        deleteTitle: "Danger zone",
        deleteDesc: "This action permanently deletes your account.",
        deleteBtn: "Delete account",
        deleteConfirm: "Are you sure you want to delete your account?",
        updated: "Profile updated",
        passwordUpdated: "Password updated",
        deleted: "Account deleted",
        required: "Required",
        invalidEmail: "Invalid email format",
        invalidPhone: "Invalid phone number",
        invalidUrl: "Invalid URL",
        max: "Value is too long",
        pendingDraft: "You still have a new value not added to the list.",
        needEmail: "At least one email is required.",
        generic: "Something went wrong",
        needLogin: "Please sign in",
        loyaltyTitle: "TechStore membership",
        loyaltySubtitle: "Track your tier, reward points, and current perks.",
        loyaltyPoints: "Reward points",
        loyaltySpent: "Lifetime spend",
        loyaltyTier: "Current tier",
        loyaltyPerks: "Tier perks",
    },
};

const LOYALTY_TIER_CONFIG = {
    BRONZE: {
        viLabel: "Đồng",
        enLabel: "Bronze",
        perks: {
            vi: ["Tích điểm cơ bản", "Chưa có ưu đãi phí ship"],
            en: ["Base point earning", "No shipping discount yet"],
        },
    },
    SILVER: {
        viLabel: "Bạc",
        enLabel: "Silver",
        perks: {
            vi: ["Nhận thêm 10% điểm thưởng", "Giảm 5% phí vận chuyển", "Voucher sinh nhật 50.000đ"],
            en: ["Earn 10% more reward points", "5% shipping discount", "Birthday voucher worth 50,000 VND"],
        },
    },
    GOLD: {
        viLabel: "Vàng",
        enLabel: "Gold",
        perks: {
            vi: ["Nhận thêm 25% điểm thưởng", "Giảm 10% phí vận chuyển", "Voucher sinh nhật 100.000đ"],
            en: ["Earn 25% more reward points", "10% shipping discount", "Birthday voucher worth 100,000 VND"],
        },
    },
    PLATINUM: {
        viLabel: "Bạch kim",
        enLabel: "Platinum",
        perks: {
            vi: ["Nhận thêm 50% điểm thưởng", "Giảm 15% phí vận chuyển", "Voucher sinh nhật 200.000đ"],
            en: ["Earn 50% more reward points", "15% shipping discount", "Birthday voucher worth 200,000 VND"],
        },
    },
};

const EMPTY_DRAFTS = {
    emails: { value: "" },
    phones: { value: "" },
    addresses: { value: "" },
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^(03|05|07|08|09)\d{8}$/;

const normalizeUploadUrl = (url) => {
    const raw = String(url || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) {
        const base = String(axiosInstance?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
        return base ? `${base}${raw}` : raw;
    }
    return raw;
};

const mapApiMessage = (lang, error, fallback) => {
    const message = String(error?.response?.data?.message || error?.message || "");
    const map = {
        "Email already exists": { vi: "Email đã tồn tại", en: "Email already exists" },
        "Phone already exists": { vi: "Số điện thoại đã tồn tại", en: "Phone already exists" },
        "Invalid email": { vi: "Email không đúng định dạng", en: "Invalid email" },
        "Invalid phone": { vi: "Số điện thoại không hợp lệ", en: "Invalid phone" },
        "Invalid credentials": { vi: "Mật khẩu hiện tại không đúng", en: "Current password is incorrect" },
    };
    return map[message]?.[lang] || message || fallback;
};

function ContactEditor({ title, items, draft, onDraftChange, onAdd, onRemove, onSetDefault, placeholder, t, disabled = false }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 p-4">
            <div className="mb-3 text-base font-extrabold">{title}</div>
            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item._id || item.value} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/40 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold break-words">{item.value}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.isDefault ? (
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">{t.default}</span>
                                ) : (
                                    <button type="button" onClick={() => onSetDefault(item._id)} disabled={disabled} className="rounded-full border px-3 py-1 text-xs font-bold hover:border-primary hover:text-primary transition-colors disabled:opacity-60">
                                        {t.setDefault}
                                    </button>
                                )}
                                <button type="button" onClick={() => onRemove(item._id)} disabled={disabled} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-60">
                                    {t.remove}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <input value={draft.value} onChange={(event) => onDraftChange(event.target.value)} placeholder={placeholder} disabled={disabled} className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 px-4 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
                <button type="button" onClick={onAdd} disabled={disabled} className="h-11 rounded-xl bg-primary px-5 font-extrabold text-white hover:bg-blue-700 transition-colors disabled:opacity-60">{t.add}</button>
            </div>
        </div>
    );
}

export default function Settings({ lang, setLang, onNavigateHome, onNavigateLogin }) {
    const t = T[lang] || T.vi;
    const [tab, setTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [profile, setProfile] = useState(() => readStoredUserProfile() || normalizeUserProfile({ name: "", avatar: "", emails: [], phones: [], addresses: [] }));
    const [drafts, setDrafts] = useState(EMPTY_DRAFTS);
    const [errors, setErrors] = useState({});
    const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [pwdErrors, setPwdErrors] = useState({});
    const avatarPreview = useMemo(() => normalizeUploadUrl(profile.avatar), [profile.avatar]);
    const loyaltyTierInfo = useMemo(() => {
        const key = String(profile.memberTier || "BRONZE").trim().toUpperCase();
        return LOYALTY_TIER_CONFIG[key] || LOYALTY_TIER_CONFIG.BRONZE;
    }, [profile.memberTier]);
    const loyaltyPerks = useMemo(
        () => loyaltyTierInfo.perks?.[lang] || loyaltyTierInfo.perks?.vi || [],
        [lang, loyaltyTierInfo]
    );

    const loadProfile = useCallback(async () => {
        const res = await getMyProfile();
        const nextProfile = normalizeUserProfile(res?.data || {});
        setProfile(nextProfile);
        writeStoredUserProfile(nextProfile);
        return nextProfile;
    }, []);

    useEffect(() => {
        if (!getStoredAccessToken()) {
            toast.error(t.needLogin);
            onNavigateLogin?.();
            return;
        }
        let mounted = true;
        const run = async () => {
            try {
                setProfileLoading(true);
                const nextProfile = await loadProfile();
                if (!mounted) return;
                setProfile(nextProfile);
            } catch (error) {
                if (!mounted) return;
                toast.error(mapApiMessage(lang, error, t.generic));
            } finally {
                if (mounted) setProfileLoading(false);
            }
        };
        run();
        return () => { mounted = false; };
    }, [lang, loadProfile, onNavigateLogin, t.generic, t.needLogin]);

    useEffect(() => {
        if (!getStoredAccessToken()) return undefined;

        const unsubscribe = subscribeRealtime((payload) => {
            const type = String(payload?.type || "");
            if (!type.startsWith("order.")) return;

            loadProfile().catch(() => null);
        });

        return unsubscribe;
    }, [loadProfile]);

    const updateDraft = (key, value) => setDrafts((prev) => ({ ...prev, [key]: { value } }));

    const persistContactSection = async (nextProfile, preservedProfile = profile) => {
        const res = await updateMyProfile({
            emails: nextProfile.emails,
            phones: nextProfile.phones,
            addresses: nextProfile.addresses,
        });
        const savedProfile = normalizeUserProfile(res?.data || nextProfile);
        const mergedProfile = {
            ...savedProfile,
            name: preservedProfile.name,
            avatar: preservedProfile.avatar,
        };
        setProfile(mergedProfile);
        writeStoredUserProfile(savedProfile);
        window.dispatchEvent(new Event("user:updated"));
        return savedProfile;
    };

    const addContact = (key, type) => {
        const value = String(drafts[key].value || "").trim();
        if (!value) return toast.error(t.required);
        if (type === "email" && !EMAIL_RE.test(value)) return toast.error(t.invalidEmail);
        if (type === "phone" && !PHONE_RE.test(value)) return toast.error(t.invalidPhone);
        if (type === "address" && value.length > 500) return toast.error(t.max);
        const preservedProfile = profile;
        const nextProfile = normalizeUserProfile({
            ...profile,
            [key]: upsertContactItem(profile[key], type, value, { makeDefault: profile[key].length === 0 }),
        });

        setLoading(true);
        persistContactSection(nextProfile, preservedProfile)
            .then(() => {
                setDrafts((prev) => ({ ...prev, [key]: { value: "" } }));
            })
            .catch((error) => {
                toast.error(mapApiMessage(lang, error, t.generic));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const removeContact = (key, id) => {
        if (key === "emails" && profile.emails.length <= 1) return toast.error(t.needEmail);
        const preservedProfile = profile;
        const nextProfile = normalizeUserProfile({
            ...profile,
            [key]: removeContactItem(profile[key], id),
        });

        setLoading(true);
        persistContactSection(nextProfile, preservedProfile)
            .catch((error) => {
                toast.error(mapApiMessage(lang, error, t.generic));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const makeDefaultContact = (key, id) => {
        const preservedProfile = profile;
        const nextProfile = normalizeUserProfile({
            ...profile,
            [key]: setDefaultContact(profile[key], id),
        });

        setLoading(true);
        persistContactSection(nextProfile, preservedProfile)
            .catch((error) => {
                toast.error(mapApiMessage(lang, error, t.generic));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const validateProfile = () => {
        const next = {};
        if (!String(profile.name || "").trim()) next.name = t.required;
        if ((profile.emails || []).length === 0) next.emails = t.needEmail;
        if ((profile.emails || []).some((item) => !EMAIL_RE.test(String(item?.value || "")))) next.emails = t.invalidEmail;
        if ((profile.phones || []).some((item) => !PHONE_RE.test(String(item?.value || "")))) next.phones = t.invalidPhone;
        if ((profile.addresses || []).some((item) => String(item?.value || "").trim().length > 500)) next.addresses = t.max;
        if (profile.avatar && !/^https?:\/\/\S+/i.test(profile.avatar) && !String(profile.avatar).startsWith("/uploads/")) next.avatar = t.invalidUrl;
        if (Object.values(drafts).some((entry) => String(entry?.value || "").trim())) next.drafts = t.pendingDraft;
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const saveProfile = async () => {
        if (!validateProfile()) return;
        try {
            setLoading(true);
            const res = await updateMyProfile({ name: profile.name, avatar: profile.avatar, emails: profile.emails, phones: profile.phones, addresses: profile.addresses });
            const nextProfile = normalizeUserProfile(res?.data || profile);
            setProfile(nextProfile);
            writeStoredUserProfile(nextProfile);
            window.dispatchEvent(new Event("user:updated"));
            toast.success(t.updated);
        } catch (error) {
            toast.error(mapApiMessage(lang, error, t.generic));
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatarFile = async (file) => {
        if (!file) return;
        try {
            setUploadingAvatar(true);
            const res = await uploadAvatar(file);
            const url = normalizeUploadUrl(res?.data?.url || "");
            if (url) setProfile((prev) => ({ ...prev, avatar: url }));
        } catch (error) {
            toast.error(mapApiMessage(lang, error, t.generic));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const savePassword = async () => {
        const next = {};
        const issues = passwordIssues(pwd.newPassword);
        if (!pwd.currentPassword) next.currentPassword = t.required;
        if (issues.length > 0) next.newPassword = issues;
        if (!pwd.confirmPassword) next.confirmPassword = t.required;
        else if (validateConfirmPassword(pwd.newPassword, pwd.confirmPassword)) next.confirmPassword = validateConfirmPassword(pwd.newPassword, pwd.confirmPassword);
        setPwdErrors(next);
        if (Object.keys(next).length > 0) return;
        try {
            setLoading(true);
            await changeMyPassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
            setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPwdErrors({});
            toast.success(t.passwordUpdated);
        } catch (error) {
            toast.error(mapApiMessage(lang, error, t.generic));
        } finally {
            setLoading(false);
        }
    };

    const removeAccount = async () => {
        if (!window.confirm(t.deleteConfirm)) return;
        try {
            setLoading(true);
            await deleteMyAccount();
            clearStoredAuth();
            window.dispatchEvent(new Event("user:updated"));
            toast.success(t.deleted);
            onNavigateHome?.();
        } catch (error) {
            toast.error(mapApiMessage(lang, error, t.generic));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="max-w-[1160px] mx-auto px-4 md:px-8 py-10">
                <button type="button" onClick={onNavigateHome} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 font-extrabold text-white hover:bg-orange-600 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>{t.back}
                </button>

                <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 p-6 backdrop-blur">
                    <h1 className="text-3xl font-black tracking-tight">{t.title}</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">{t.subtitle}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {["profile", "password", "danger"].map((key) => (
                            <button key={key} type="button" onClick={() => setTab(key)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition-colors ${tab === key ? "border-primary/20 bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40"}`}>
                                {t.tabs[key]}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === "profile" && (
                    <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 p-6 backdrop-blur">
                        {profileLoading ? <div className="text-sm text-slate-500">{t.loading}</div> : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="mb-2 text-sm font-bold">{t.name}</div>
                                            <input value={profile.name} onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 outline-none focus:ring-2 focus:ring-primary/30" />
                                            {errors.name && <div className="mt-2 text-sm text-rose-600">{errors.name}</div>}
                                        </div>
                                        <div>
                                            <div className="mb-2 text-sm font-bold">{t.avatar}</div>
                                            <input value={profile.avatar || ""} onChange={(event) => setProfile((prev) => ({ ...prev, avatar: event.target.value }))} placeholder={t.avatarPlaceholder} className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 outline-none focus:ring-2 focus:ring-primary/30" />
                                            {errors.avatar && <div className="mt-2 text-sm text-rose-600">{errors.avatar}</div>}
                                        </div>
                                        <input id="settings-avatar-file" type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; uploadAvatarFile(file); }} />
                                        <label htmlFor="settings-avatar-file" className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 px-4 font-extrabold ${uploadingAvatar || loading ? "opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-800"} transition-colors`}>
                                            {uploadingAvatar ? t.saving : t.chooseFile}
                                        </label>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-5">
                                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400">Preview</div>
                                        <div className="mt-4 flex items-center gap-4">
                                            <div className="size-20 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40">
                                                {avatarPreview ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><span className="material-symbols-outlined text-3xl">person</span></div>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold">{profile.name || "—"}</div>
                                                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400 break-all">{profile.email || "—"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900/40 dark:to-slate-900/40">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-[0.24em] text-amber-500">{t.loyaltyTitle}</div>
                                            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{loyaltyTierInfo[lang === "vi" ? "viLabel" : "enLabel"]}</div>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.loyaltySubtitle}</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.loyaltyTier}</div>
                                                <div className="mt-2 text-lg font-black text-primary">{loyaltyTierInfo[lang === "vi" ? "viLabel" : "enLabel"]}</div>
                                            </div>
                                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.loyaltyPoints}</div>
                                                <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{Number(profile.loyaltyPoints || 0).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}</div>
                                            </div>
                                            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                                                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.loyaltySpent}</div>
                                                <div className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">{Number(profile.lifetimeSpent || 0).toLocaleString("vi-VN")}đ</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.loyaltyPerks}</div>
                                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            {loyaltyPerks.map((perk) => (
                                                <div key={perk} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
                                                    <span className="material-symbols-outlined text-[18px] text-amber-500">workspace_premium</span>
                                                    <span>{perk}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <ContactEditor title={t.emails} items={profile.emails} draft={drafts.emails} onDraftChange={(value) => updateDraft("emails", value)} onAdd={() => addContact("emails", "email")} onRemove={(id) => removeContact("emails", id)} onSetDefault={(id) => makeDefaultContact("emails", id)} placeholder={t.emailPlaceholder} t={t} disabled={loading || uploadingAvatar} />
                                {errors.emails && <div className="text-sm text-rose-600">{errors.emails}</div>}

                                <ContactEditor title={t.phones} items={profile.phones} draft={drafts.phones} onDraftChange={(value) => updateDraft("phones", value)} onAdd={() => addContact("phones", "phone")} onRemove={(id) => removeContact("phones", id)} onSetDefault={(id) => makeDefaultContact("phones", id)} placeholder={t.phonePlaceholder} t={t} disabled={loading || uploadingAvatar} />
                                {errors.phones && <div className="text-sm text-rose-600">{errors.phones}</div>}

                                <ContactEditor title={t.addresses} items={profile.addresses} draft={drafts.addresses} onDraftChange={(value) => updateDraft("addresses", value)} onAdd={() => addContact("addresses", "address")} onRemove={(id) => removeContact("addresses", id)} onSetDefault={(id) => makeDefaultContact("addresses", id)} placeholder={t.addressPlaceholder} t={t} disabled={loading || uploadingAvatar} />
                                {errors.addresses && <div className="text-sm text-rose-600">{errors.addresses}</div>}
                                {errors.drafts && <div className="text-sm text-rose-600">{errors.drafts}</div>}

                                <button type="button" onClick={saveProfile} disabled={loading || uploadingAvatar} className="h-12 w-full rounded-xl bg-primary font-extrabold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                                    {loading ? t.saving : t.save}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {tab === "password" && (
                    <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/40 p-6 backdrop-blur space-y-4">
                        <div><div className="mb-2 text-sm font-bold">{t.pwdCurrent}</div><input type="password" value={pwd.currentPassword} onChange={(event) => setPwd((prev) => ({ ...prev, currentPassword: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 outline-none focus:ring-2 focus:ring-primary/30" />{pwdErrors.currentPassword && <div className="mt-2 text-sm text-rose-600">{pwdErrors.currentPassword}</div>}</div>
                        <div><div className="mb-2 text-sm font-bold">{t.pwdNext}</div><input type="password" value={pwd.newPassword} onChange={(event) => setPwd((prev) => ({ ...prev, newPassword: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 outline-none focus:ring-2 focus:ring-primary/30" />{Array.isArray(pwdErrors.newPassword) && <ul className="mt-2 space-y-1 text-sm text-rose-600">{pwdErrors.newPassword.map((issue) => <li key={issue}>{issue}</li>)}</ul>}</div>
                        <div><div className="mb-2 text-sm font-bold">{t.pwdConfirm}</div><input type="password" value={pwd.confirmPassword} onChange={(event) => setPwd((prev) => ({ ...prev, confirmPassword: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 outline-none focus:ring-2 focus:ring-primary/30" />{pwdErrors.confirmPassword && <div className="mt-2 text-sm text-rose-600">{pwdErrors.confirmPassword}</div>}</div>
                        <button type="button" onClick={savePassword} disabled={loading} className="h-12 w-full rounded-xl bg-primary font-extrabold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">{loading ? t.saving : t.pwdSave}</button>
                    </div>
                )}

                {tab === "danger" && (
                    <div className="mt-6 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/20 p-6 backdrop-blur">
                        <div className="text-lg font-extrabold">{t.deleteTitle}</div>
                        <div className="mt-1 text-sm text-rose-700/90 dark:text-rose-200/80">{t.deleteDesc}</div>
                        <button type="button" onClick={removeAccount} disabled={loading} className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-5 font-extrabold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors">{loading ? t.saving : t.deleteBtn}</button>
                    </div>
                )}
            </div>

            <Footer lang={lang} setLang={setLang} />
        </div>
    );
}
