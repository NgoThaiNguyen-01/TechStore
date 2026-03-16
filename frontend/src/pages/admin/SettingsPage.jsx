import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { changeMyPassword, getMyProfile, updateMyProfile, uploadAvatar } from "../../services/userApi";
import { deleteMyAccount } from "../../services/userApi";
import { clearStoredAuth } from "../../utils/authStorage";
import { hasAdminPermission } from "../../utils/adminAccess";
import { readStoredUserProfile } from "../../utils/userProfile";

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_ORIGIN = RAW_API_URL
    ? String(RAW_API_URL).replace(/\/$/, "").replace(/\/api\/?$/, "")
    : "http://localhost:5000";

const T = {
    vi: {
        profileTitle: "Thông tin cá nhân",
        profileSubtitle: "Cập nhật thông tin tài khoản của bạn.",
        passwordTitle: "Đổi mật khẩu",
        passwordSubtitle: "Cập nhật mật khẩu đăng nhập của bạn.",
        fieldName: "Họ và tên",
        fieldEmail: "Email",
        fieldPhone: "Số điện thoại",
        fieldAddress: "Địa chỉ",
        fieldAvatar: "Avatar",
        fieldAvatarFile: "Chọn file",
        fieldAvatarUrlHelp: "Hoặc dán URL ảnh (https://...) để dùng avatar từ link.",
        fieldCurrentPassword: "Mật khẩu hiện tại",
        fieldNewPassword: "Mật khẩu mới",
        fieldConfirmPassword: "Xác nhận mật khẩu",
        placeholderName: "Nhập họ và tên",
        placeholderEmail: "Nhập email",
        placeholderPhone: "Nhập số điện thoại",
        placeholderAddress: "Nhập địa chỉ",
        placeholderCurrentPassword: "Nhập mật khẩu hiện tại",
        placeholderNewPassword: "Nhập mật khẩu mới",
        placeholderConfirmPassword: "Nhập xác nhận mật khẩu",
        saveProfile: "Lưu thông tin",
        saving: "Đang lưu...",
        updateProfileSuccess: "Cập nhật thông tin thành công",
        updatePasswordSuccess: "Đổi mật khẩu thành công",
        required: "Bắt buộc nhập",
        invalidEmail: "Chưa đúng định dạng email.",
        phoneInvalid: "Số điện thoại không hợp lệ",
        phoneRuleLength: "10 chữ số",
        phoneRulePrefix: "Bắt đầu bằng 03, 05, 07, 08, 09",
        phoneRuleUnique: "1 số điện thoại = 1 tài khoản",
        emailDuplicate: "Không được trùng email",
        maxLengthExceeded: "Vượt quá giới hạn độ dài",
        passwordInvalid: "Mật khẩu không hợp lệ",
        passwordRuleMin: "Ít nhất 8 ký tự",
        passwordRuleUpper: "Phải có chữ hoa",
        passwordRuleLower: "Phải có chữ thường",
        passwordRuleNumber: "Phải có số",
        passwordRuleSpecial: "Phải có ký tự đặc biệt",
        passwordConfirmMismatch: "Xác nhận mật khẩu không khớp",
        currentPasswordWrong: "Mật khẩu hiện tại không đúng",
        loadProfileError: "Lỗi tải thông tin cá nhân",
        uploadAvatarError: "Tải avatar thất bại",
        dangerTitle: "Vùng nguy hiểm",
        dangerSubtitle: "Xóa tài khoản sẽ không thể hoàn tác.",
        deleteAccount: "Xóa tài khoản",
        deleting: "Đang xóa...",
        deleteAccountConfirm: "Bạn có chắc muốn xóa tài khoản?",
        deleteAccountError: "Không thể xóa tài khoản",
        noPermission: "Bạn không có quyền cập nhật cài đặt",
    },
    en: {
        profileTitle: "Profile",
        profileSubtitle: "Update your account information.",
        passwordTitle: "Change password",
        passwordSubtitle: "Update your login password.",
        fieldName: "Name",
        fieldEmail: "Email",
        fieldPhone: "Phone",
        fieldAddress: "Address",
        fieldAvatar: "Avatar",
        fieldAvatarFile: "Choose file",
        fieldAvatarUrlHelp: "Or paste an image URL (https://...) to use an avatar from a link.",
        fieldCurrentPassword: "Current password",
        fieldNewPassword: "New password",
        fieldConfirmPassword: "Confirm password",
        placeholderName: "Enter full name",
        placeholderEmail: "Enter email",
        placeholderPhone: "Enter phone number",
        placeholderAddress: "Enter address",
        placeholderCurrentPassword: "Enter current password",
        placeholderNewPassword: "Enter new password",
        placeholderConfirmPassword: "Confirm new password",
        saveProfile: "Save profile",
        saving: "Saving...",
        updateProfileSuccess: "Profile updated",
        updatePasswordSuccess: "Password changed",
        required: "Required",
        invalidEmail: "Invalid email format.",
        phoneInvalid: "Phone is invalid",
        phoneRuleLength: "10 digits",
        phoneRulePrefix: "Starts with 03, 05, 07, 08, 09",
        phoneRuleUnique: "One phone number = one account",
        emailDuplicate: "Email must be unique",
        maxLengthExceeded: "Max length exceeded",
        passwordInvalid: "Password is invalid",
        passwordRuleMin: "At least 8 characters",
        passwordRuleUpper: "Must include uppercase",
        passwordRuleLower: "Must include lowercase",
        passwordRuleNumber: "Must include number",
        passwordRuleSpecial: "Must include special character",
        passwordConfirmMismatch: "Confirm password does not match",
        currentPasswordWrong: "Current password is incorrect",
        loadProfileError: "Failed to load profile",
        uploadAvatarError: "Avatar upload failed",
        dangerTitle: "Danger zone",
        dangerSubtitle: "Deleting your account cannot be undone.",
        deleteAccount: "Delete account",
        deleting: "Deleting...",
        deleteAccountConfirm: "Are you sure you want to delete your account?",
        deleteAccountError: "Unable to delete account",
        noPermission: "You do not have permission to update settings",
    },
};

export default function SettingsPage({ lang = "vi" }) {
    const t = T[lang] || T.vi;
    const currentUser = readStoredUserProfile();
    const canUpdateSettings = hasAdminPermission(currentUser, "settings:update");
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        avatar: "",
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState("");
    const [objectPreviewUrl, setObjectPreviewUrl] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [pwd, setPwd] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [pwdErrors, setPwdErrors] = useState({});
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const emailOk = (v) => /^\S+@\S+\.\S+$/.test(String(v || "").trim());
    const phoneOk = (v) => /^(03|05|07|08|09)\d{8}$/.test(String(v || "").trim());
    const passwordIssues = (value) => {
        const raw = String(value || "");
        const issues = [];
        if (raw.length < 8) issues.push(t.passwordRuleMin);
        if (!/[A-Z]/.test(raw)) issues.push(t.passwordRuleUpper);
        if (!/[a-z]/.test(raw)) issues.push(t.passwordRuleLower);
        if (!/\d/.test(raw)) issues.push(t.passwordRuleNumber);
        if (!/[^A-Za-z0-9]/.test(raw)) issues.push(t.passwordRuleSpecial);
        return issues;
    };

    const mapErrorMessage = useCallback((err) => {
        const raw = err?.response?.data?.message || err?.message || "";
        if (String(raw).includes("Email already exists")) return t.emailDuplicate;
        if (String(raw).includes("Phone already exists")) return t.phoneRuleUnique;
        if (String(raw).includes("Invalid email")) return t.invalidEmail;
        if (String(raw).includes("Invalid phone")) return t.phoneInvalid;
        if (String(raw).includes("Max length exceeded")) return t.maxLengthExceeded;
        if (String(raw).includes("Invalid credentials")) return t.currentPasswordWrong;
        return raw || t.loadProfileError;
    }, [t]);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            try {
                setLoadingProfile(true);
                const res = await getMyProfile();
                const data = res?.data || {};
                if (!mounted) return;
                setProfile({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address: data.address || "",
                    avatar: data.avatar || "",
                });
            } catch (err) {
                toast.error(mapErrorMessage(err));
            } finally {
                if (mounted) setLoadingProfile(false);
            }
        };
        run();
        return () => {
            mounted = false;
        };
    }, [mapErrorMessage]);

    useEffect(() => {
        if (objectPreviewUrl) return;
        const raw = String(profile.avatar || "").trim();
        if (!raw) {
            setAvatarPreview("");
            return;
        }
        if (/^https?:\/\//i.test(raw)) {
            setAvatarPreview(raw);
            return;
        }
        if (raw.startsWith("/")) {
            setAvatarPreview(`${API_ORIGIN}${raw}`);
            return;
        }
        setAvatarPreview(`${API_ORIGIN}/${raw}`);
    }, [objectPreviewUrl, profile.avatar]);

    useEffect(() => {
        return () => {
            if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        };
    }, [objectPreviewUrl]);

    const validateProfile = () => {
        const next = {};
        const name = profile.name.trim();
        const email = profile.email.trim();
        const phone = profile.phone.trim();
        const address = profile.address.trim();
        const avatar = profile.avatar.trim();

        if (!name) next.name = t.required;
        else if (name.length > 255) next.name = t.maxLengthExceeded;

        if (!email) next.email = t.required;
        else if (email.length > 255) next.email = t.maxLengthExceeded;
        else if (!emailOk(email)) next.email = t.invalidEmail;

        if (!phone) next.phone = t.required;
        else if (!phoneOk(phone)) next.phone = [t.phoneRuleLength, t.phoneRulePrefix];

        if (!address) next.address = t.required;
        else if (address.length > 500) next.address = t.maxLengthExceeded;

        if (!avatar) next.avatar = t.required;
        else if (avatar.length > 2048) next.avatar = t.maxLengthExceeded;

        setProfileErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSaveProfile = async () => {
        if (!canUpdateSettings) {
            toast.error(t.noPermission);
            return;
        }
        if (!validateProfile()) return;
        try {
            setSavingProfile(true);
            const res = await updateMyProfile({
                name: profile.name.trim(),
                email: profile.email.trim(),
                phone: profile.phone.trim(),
                address: profile.address.trim(),
                avatar: profile.avatar.trim(),
            });
            const data = res?.data || {};
            setProfile((prev) => ({
                ...prev,
                name: data.name || prev.name,
                email: data.email || prev.email,
                phone: data.phone || prev.phone,
                address: data.address || prev.address,
                avatar: data.avatar || prev.avatar,
            }));
            try {
                const stored = JSON.parse(localStorage.getItem("user") || "{}");
                const nextStored = { ...stored };
                if (data.name) nextStored.name = data.name;
                if (data.email) nextStored.email = data.email;
                if (data.avatar) nextStored.avatar = data.avatar;
                localStorage.setItem("user", JSON.stringify(nextStored));
            } catch {
                void 0;
            }
            try {
                window.dispatchEvent(new Event("user:updated"));
            } catch {
                void 0;
            }
            toast.success(t.updateProfileSuccess);
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (String(msg).includes("Email already exists")) {
                setProfileErrors((prev) => ({ ...prev, email: t.emailDuplicate }));
            }
            if (String(msg).includes("Phone already exists")) {
                setProfileErrors((prev) => ({ ...prev, phone: [t.phoneRuleUnique] }));
            }
            toast.error(mapErrorMessage(err));
        } finally {
            setSavingProfile(false);
        }
    };

    const onPickAvatar = async (e) => {
        if (!canUpdateSettings) {
            toast.error(t.noPermission);
            return;
        }
        const file = e.target.files?.[0];
        if (!file) return;
        if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        const localUrl = URL.createObjectURL(file);
        setObjectPreviewUrl(localUrl);
        setAvatarPreview(localUrl);
        try {
            setUploadingAvatar(true);
            const res = await uploadAvatar(file);
            const url = res?.data?.url;
            if (url) {
                setProfile((prev) => ({ ...prev, avatar: url }));
            }
        } catch (err) {
            toast.error(mapErrorMessage(err) || t.uploadAvatarError);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const validatePasswordForm = () => {
        const next = {};
        if (!pwd.currentPassword) next.currentPassword = t.required;
        if (!pwd.newPassword) next.newPassword = t.required;
        else {
            const issues = passwordIssues(pwd.newPassword);
            if (issues.length > 0) next.newPassword = issues;
        }
        if (!pwd.confirmPassword) next.confirmPassword = t.required;
        else if (pwd.confirmPassword !== pwd.newPassword) next.confirmPassword = t.passwordConfirmMismatch;
        setPwdErrors(next);
        return Object.keys(next).length === 0;
    };

    const onChangePassword = async () => {
        if (!validatePasswordForm()) return;
        try {
            setSavingPassword(true);
            await changeMyPassword({
                currentPassword: pwd.currentPassword,
                newPassword: pwd.newPassword,
            });
            setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setPwdErrors({});
            toast.success(t.updatePasswordSuccess);
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (String(msg).includes("Invalid credentials")) {
                setPwdErrors((prev) => ({ ...prev, currentPassword: t.currentPasswordWrong }));
            }
            toast.error(mapErrorMessage(err));
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="p-5 lg:p-8 mx-auto max-w-[1200px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{t.profileTitle}</h2>
                            <p className="text-sm text-slate-500">{t.profileSubtitle}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldName} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={profile.name}
                                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${profileErrors.name ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                placeholder={t.placeholderName}
                                disabled={loadingProfile || !canUpdateSettings}
                            />
                            {profileErrors.name && <p className="text-xs text-red-600 mt-1">{profileErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldEmail} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={profile.email}
                                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${profileErrors.email ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                placeholder={t.placeholderEmail}
                                disabled={loadingProfile || !canUpdateSettings}
                            />
                            {profileErrors.email && <p className="text-xs text-red-600 mt-1">{profileErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldPhone} <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={profile.phone}
                                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${profileErrors.phone ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                placeholder={t.placeholderPhone}
                                disabled={loadingProfile || !canUpdateSettings}
                            />
                            {Array.isArray(profileErrors.phone) ? (
                                <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                    <div>{t.phoneInvalid}:</div>
                                    {profileErrors.phone.map((line) => (
                                        <div key={line}>• {line}</div>
                                    ))}
                                </div>
                            ) : (
                                profileErrors.phone && <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldAddress} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                value={profile.address}
                                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none ${profileErrors.address ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                placeholder={t.placeholderAddress}
                                disabled={loadingProfile || !canUpdateSettings}
                            />
                            {profileErrors.address && <p className="text-xs text-red-600 mt-1">{profileErrors.address}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldAvatar} <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.fieldAvatarFile}</div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onPickAvatar}
                                    disabled={loadingProfile || uploadingAvatar || !canUpdateSettings}
                                    className={`block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:bg-white file:text-slate-700 hover:file:bg-slate-50 ${profileErrors.avatar ? "file:border-red-300" : "file:border-slate-200"}`}
                                />
                                {uploadingAvatar && <div className="text-xs text-slate-500">{t.saving}</div>}
                            </div>
                            <input
                                value={profile.avatar}
                                onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value }))}
                                className={`mt-2 w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${profileErrors.avatar ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                placeholder="https://..."
                                disabled={loadingProfile || !canUpdateSettings}
                            />
                            <p className="text-xs text-slate-500 mt-1">{t.fieldAvatarUrlHelp}</p>
                            {profileErrors.avatar && <p className="text-xs text-red-600 mt-1">{profileErrors.avatar}</p>}
                            {avatarPreview && (
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 text-xs text-slate-500 truncate">{profile.avatar || avatarPreview}</div>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onSaveProfile}
                            disabled={loadingProfile || savingProfile || uploadingAvatar || !canUpdateSettings}
                            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-primary/20 disabled:opacity-60"
                        >
                            {savingProfile ? t.saving : t.saveProfile}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                            <span className="material-symbols-outlined">lock</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{t.passwordTitle}</h2>
                            <p className="text-sm text-slate-500">{t.passwordSubtitle}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldCurrentPassword} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    value={pwd.currentPassword}
                                    onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                                    className={`w-full pr-11 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${pwdErrors.currentPassword ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    placeholder={t.placeholderCurrentPassword}
                                />
                                <button
                                    onClick={() => setShowCurrent((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showCurrent ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {pwdErrors.currentPassword && <p className="text-xs text-red-600 mt-1">{pwdErrors.currentPassword}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldNewPassword} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    value={pwd.newPassword}
                                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                                    className={`w-full pr-11 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${pwdErrors.newPassword ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    placeholder={t.placeholderNewPassword}
                                />
                                <button
                                    onClick={() => setShowNew((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showNew ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {Array.isArray(pwdErrors.newPassword) ? (
                                <div className="text-xs text-red-600 mt-1 space-y-0.5">
                                    <div>{t.passwordInvalid}:</div>
                                    {pwdErrors.newPassword.map((line) => (
                                        <div key={line}>â€¢ {line}</div>
                                    ))}
                                </div>
                            ) : (
                                pwdErrors.newPassword && <p className="text-xs text-red-600 mt-1">{pwdErrors.newPassword}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                {t.fieldConfirmPassword} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={pwd.confirmPassword}
                                    onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                                    className={`w-full pr-11 px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none ${pwdErrors.confirmPassword ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                                    placeholder={t.placeholderConfirmPassword}
                                />
                                <button
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showConfirm ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                            {pwdErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{pwdErrors.confirmPassword}</p>}
                        </div>

                        <button
                            type="button"
                            onClick={onChangePassword}
                            disabled={savingPassword}
                            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-60"
                        >
                            {savingPassword ? t.saving : t.passwordTitle}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                        <span className="material-symbols-outlined">report</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{t.dangerTitle}</h2>
                        <p className="text-sm text-slate-500">{t.dangerSubtitle}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={async () => {
                        const ok = window.confirm(t.deleteAccountConfirm);
                        if (!ok) return;
                        try {
                            setDeleting(true);
                            await deleteMyAccount();
                            try {
                                clearStoredAuth();
                            } catch (e) {
                                void e;
                            }
                            window.location.href = "/";
                        } catch (err) {
                            toast.error(err?.response?.data?.message || t.deleteAccountError);
                        } finally {
                            setDeleting(false);
                        }
                    }}
                    disabled={deleting}
                    className="px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-60"
                >
                    {deleting ? t.deleting : t.deleteAccount}
                </button>
            </div>
        </div>
    );
}
