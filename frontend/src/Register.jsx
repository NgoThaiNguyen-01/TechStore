import { useEffect, useMemo, useState } from "react";
import "./register.css";
import { checkEmailExists, registerUser } from "./services/authApi";
import {
    logValidationErrors,
    passwordStrength,
    sanitizeFullName,
    validateEmail,
} from "./utils/registerValidation";

/* ─── Translation dictionary ─── */
const T = {
    vi: {
        alreadyMember: "Đã có tài khoản?",
        loginLink: "Đăng nhập",
        heading: "Tạo tài khoản",
        subheading: "Nhập thông tin của bạn để bắt đầu với tài khoản mới.",
        fullNameLabel: "Họ và tên",
        fullNamePlaceholder: "Nhập họ và tên",
        emailLabel: "Địa chỉ Email",
        emailPlaceholder: "Nhập địa chỉ email",
        passwordLabel: "Mật khẩu",
        passwordPlaceholder: "Nhập mật khẩu",
        confirmPasswordLabel: "Xác nhận mật khẩu",
        confirmPasswordPlaceholder: "Nhập lại mật khẩu",
        strength: { weak: "Yếu", medium: "Trung bình", strong: "Mạnh" },
        termsText: "Tôi đồng ý với",
        termsLink: "Điều khoản dịch vụ",
        andText: "và",
        privacyLink: "Chính sách bảo mật",
        createBtn: "Tạo tài khoản",
        creatingBtn: "Đang tạo...",
        orText: "HOẶC",
        googleBtn: "Đăng ký bằng Google",
        copyright: "© 2024 TechStore Inc. Bảo lưu mọi quyền.",
        leftHeading: "Gia nhập tương lai của",
        leftHighlight: "Công Nghệ",
        leftDesc: "Truy cập độc quyền vào những thiết bị mới nhất, giải pháp phần mềm và cộng đồng những người đam mê công nghệ.",
        badge1: "Nền tảng an toàn",
        badge2: "Giao hàng nhanh",
        badge3: "Hỗ trợ 24/7",
        emailChecking: "Đang kiểm tra...",
        errors: {
            fullName: {
                required: "Vui lòng nhập họ và tên",
                min: "Họ và tên phải có ít nhất 2 ký tự",
                max: "Họ và tên tối đa 50 ký tự",
                invalid: "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
            },
            email: {
                required: "Vui lòng nhập email",
                whitespace: "Email không được chứa khoảng trắng",
                missingAt: "Email phải chứa ký tự '@'",
                invalid: "Email không đúng định dạng",
                maxLength: "Email tối đa 254 ký tự",
                duplicate: "Email đã tồn tại",
            },
            password: {
                required: "Vui lòng nhập mật khẩu",
                min: "Mật khẩu phải có ít nhất 8 ký tự",
                max: "Mật khẩu tối đa 32 ký tự",
                upper: "Mật khẩu phải có ít nhất 1 chữ cái in hoa",
                lower: "Mật khẩu phải có ít nhất 1 chữ cái thường",
                number: "Mật khẩu phải có ít nhất 1 chữ số",
                special: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
            },
            confirmPassword: {
                required: "Vui lòng nhập xác nhận mật khẩu",
                mismatch: "Xác nhận mật khẩu không khớp",
            },
            acceptTerms: {
                required: "Bạn cần đồng ý điều khoản dịch vụ để tiếp tục",
            },
            generic: "Có lỗi xảy ra",
        },
    },
    en: {
        alreadyMember: "Already a member?",
        loginLink: "Login",
        heading: "Create Account",
        subheading: "Enter your details to get started with your new account.",
        fullNameLabel: "Full Name",
        fullNamePlaceholder: "Enter full name",
        emailLabel: "Email Address",
        emailPlaceholder: "Enter email address",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter password",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Enter confirm password",
        strength: { weak: "Weak", medium: "Medium", strong: "Strong" },
        termsText: "I agree to the",
        termsLink: "Terms of Service",
        andText: "and",
        privacyLink: "Privacy Policy",
        createBtn: "Create Account",
        creatingBtn: "Creating...",
        orText: "OR",
        googleBtn: "Sign up with Google",
        copyright: "© 2024 TechStore Inc. All rights reserved.",
        leftHeading: "Join the future of",
        leftHighlight: "Tech",
        leftDesc: "Get exclusive access to the latest gadgets, software solutions, and a community of tech enthusiasts.",
        badge1: "Secure Platform",
        badge2: "Fast Shipping",
        badge3: "24/7 Support",
        emailChecking: "Checking...",
        errors: {
            fullName: {
                required: "Please enter full name",
                min: "Full name must be at least 2 characters",
                max: "Full name must be at most 50 characters",
                invalid: "Full name may contain letters and spaces only",
            },
            email: {
                required: "Please enter email",
                whitespace: "Email must not contain whitespace",
                missingAt: "Email must include '@'",
                invalid: "Invalid email format",
                maxLength: "Email must be at most 254 characters",
                duplicate: "Email already exists",
            },
            password: {
                required: "Please enter password",
                min: "Password must be at least 8 characters",
                max: "Password must be at most 32 characters",
                upper: "Password must include at least 1 uppercase letter",
                lower: "Password must include at least 1 lowercase letter",
                number: "Password must include at least 1 number",
                special: "Password must include at least 1 special character",
            },
            confirmPassword: {
                required: "Please confirm password",
                mismatch: "Passwords do not match",
            },
            acceptTerms: {
                required: "You must accept the Terms of Service to continue",
            },
            generic: "Something went wrong",
        },
    },
};

const STRENGTH_STYLES = {
    weak: { bars: 1, color: "bg-red-500", label: "weak" },
    medium: { bars: 2, color: "bg-yellow-400", label: "medium" },
    strong: { bars: 3, color: "bg-primary", label: "strong" },
};

export default function Register({ lang, setLang, onNavigateLogin, onNavigateTerms, onNavigatePrivacy }) {
    const t = T[lang];

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [emailCheck, setEmailCheck] = useState({ status: "idle", exists: false });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const strength = passwordStrength(password);
    const strengthInfo = strength ? STRENGTH_STYLES[strength] : null;

    const getFullNameErrorCode = (rawValue) => {
        const raw = String(rawValue || "");
        const collapsed = raw.replace(/\s+/g, " ").trim();
        if (!collapsed) return "required";
        const sanitized = sanitizeFullName(raw);
        if (sanitized.length < 2) return "min";
        if (sanitized.length > 50) return "max";
        if (sanitized !== collapsed) return "invalid";
        return null;
    };

    const getEmailErrorCode = (rawValue) => {
        const raw = String(rawValue || "");
        const trimmed = raw.trim();
        if (!trimmed) return "required";
        if (/\s/.test(raw)) return "whitespace";
        if (!trimmed.includes("@")) return "missingAt";
        const { error } = validateEmail(trimmed);
        if (!error) return null;
        if (String(error).includes("254")) return "maxLength";
        return "invalid";
    };

    const getPasswordIssueCodes = (rawValue) => {
        const pwd = String(rawValue || "");
        const issues = [];
        if (!pwd) return ["required"];
        if (pwd.length < 8) issues.push("min");
        if (pwd.length > 32) issues.push("max");
        if (!/[A-Z]/.test(pwd)) issues.push("upper");
        if (!/[a-z]/.test(pwd)) issues.push("lower");
        if (!/\d/.test(pwd)) issues.push("number");
        if (!/[^A-Za-z0-9]/.test(pwd)) issues.push("special");
        return issues;
    };

    const getConfirmPasswordErrorCode = (pwd, confirm) => {
        const c = String(confirm || "");
        if (!c) return "required";
        if (String(pwd || "") !== c) return "mismatch";
        return null;
    };

    const getTermsErrorCode = (checked) => (checked ? null : "required");

    const mapApiErrorsToCodes = (apiErrors) => {
        const next = {};
        const fullNameMsg = apiErrors?.fullName;
        const emailMsg = apiErrors?.email;
        const confirmMsg = apiErrors?.confirmPassword;
        const termsMsg = apiErrors?.acceptTerms;
        const pwdList = apiErrors?.password;

        if (typeof fullNameMsg === "string") {
            if (fullNameMsg.includes("ít nhất 2")) next.fullName = "min";
            else if (fullNameMsg.includes("tối đa 50")) next.fullName = "max";
            else if (fullNameMsg.toLowerCase().includes("vui lòng")) next.fullName = "required";
            else next.fullName = "invalid";
        }

        if (typeof emailMsg === "string") {
            if (emailMsg.toLowerCase().includes("tồn tại")) next.email = "duplicate";
            else if (emailMsg.includes("254")) next.email = "maxLength";
            else if (emailMsg.includes("@")) next.email = "missingAt";
            else if (emailMsg.toLowerCase().includes("vui lòng")) next.email = "required";
            else next.email = "invalid";
        }

        if (Array.isArray(pwdList)) {
            const codes = [];
            pwdList.forEach((m) => {
                const msg = String(m || "");
                if (msg.includes("ít nhất 8")) codes.push("min");
                else if (msg.includes("tối đa 32")) codes.push("max");
                else if (msg.includes("in hoa")) codes.push("upper");
                else if (msg.includes("thường")) codes.push("lower");
                else if (msg.includes("chữ số")) codes.push("number");
                else if (msg.includes("đặc biệt")) codes.push("special");
            });
            next.password = Array.from(new Set(codes));
        } else if (typeof pwdList === "string") {
            next.password = ["required"];
        }

        if (typeof confirmMsg === "string") {
            if (confirmMsg.toLowerCase().includes("vui lòng")) next.confirmPassword = "required";
            else next.confirmPassword = "mismatch";
        }

        if (typeof termsMsg === "string") {
            next.acceptTerms = "required";
        }

        return next;
    };

    useEffect(() => {
        const { value, error } = validateEmail(email);
        if (!email) {
            setEmailCheck({ status: "idle", exists: false });
            if (touched.email) setErrors((prev) => ({ ...prev, email: getEmailErrorCode(email) || undefined }));
            return;
        }
        if (error) {
            setEmailCheck({ status: "idle", exists: false });
            if (touched.email) setErrors((prev) => ({ ...prev, email: getEmailErrorCode(email) || undefined }));
            return;
        }

        setEmailCheck({ status: "checking", exists: false });
        const handle = setTimeout(async () => {
            try {
                const res = await checkEmailExists(value);
                const exists = Boolean(res?.data?.exists);
                setEmailCheck({ status: "done", exists });
                if (touched.email) setErrors((prev) => ({ ...prev, email: exists ? "duplicate" : undefined }));
            } catch {
                setEmailCheck({ status: "idle", exists: false });
            }
        }, 400);
        return () => clearTimeout(handle);
    }, [email, touched.email]);

    useEffect(() => {
        if (!confirmPassword && !touched.confirmPassword) return;
        const errCode = getConfirmPasswordErrorCode(password, confirmPassword);
        if (touched.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: errCode || undefined }));
    }, [confirmPassword, password, touched.confirmPassword]);

    const canSubmit = useMemo(() => {
        const requiredFilled = Boolean(fullName.trim()) && Boolean(email.trim()) && Boolean(password) && Boolean(confirmPassword);
        const confirmErrCode = getConfirmPasswordErrorCode(password, confirmPassword);
        const termsErrCode = getTermsErrorCode(acceptTerms);
        const hasErrors =
            Boolean(errors.fullName) ||
            Boolean(errors.email) ||
            Boolean(errors.confirmPassword) ||
            Boolean(errors.acceptTerms) ||
            Array.isArray(errors.password) ||
            Boolean(confirmErrCode) ||
            Boolean(termsErrCode);
        return requiredFilled && !hasErrors && !submitting && !(emailCheck.status === "done" && emailCheck.exists);
    }, [acceptTerms, confirmPassword, email, emailCheck, errors, fullName, password, submitting]);

    const validateAll = () => {
        const next = {};
        const fullNameCode = getFullNameErrorCode(fullName);
        if (fullNameCode) next.fullName = fullNameCode;
        const emailCode = getEmailErrorCode(email);
        if (emailCode) next.email = emailCode;
        const pwdCodes = getPasswordIssueCodes(password);
        if (pwdCodes.length > 0) next.password = pwdCodes;
        const confirmCode = getConfirmPasswordErrorCode(password, confirmPassword);
        if (confirmCode) next.confirmPassword = confirmCode;
        const termsCode = getTermsErrorCode(acceptTerms);
        if (termsCode) next.acceptTerms = termsCode;
        if (emailCheck.status === "done" && emailCheck.exists) next.email = "duplicate";
        return next;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = validateAll();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            logValidationErrors("register.frontend", { ...nextErrors, password: nextErrors.password ? ["..."] : undefined });
            return;
        }
        try {
            setSubmitting(true);
            const payload = {
                fullName: sanitizeFullName(fullName),
                email: String(email).trim(),
                password,
                confirmPassword,
                acceptTerms,
            };
            await registerUser(payload);
            onNavigateLogin?.();
        } catch (err) {
            const apiErrors = err?.response?.data?.errors;
            if (apiErrors && typeof apiErrors === "object") {
                setErrors((prev) => ({ ...prev, ...mapApiErrorsToCodes(apiErrors) }));
                logValidationErrors("register.backend", { ...apiErrors, password: apiErrors.password ? ["..."] : undefined });
            } else {
                setErrors((prev) => ({ ...prev, _form: "generic" }));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4 md:p-8">
            <div className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#172136] rounded-xl shadow-2xl overflow-hidden min-h-[800px]">

                {/* ── Left Side: Illustration ── */}
                <div className="hidden lg:flex flex-col justify-center items-center relative p-12 bg-gradient-to-br from-primary/20 via-background-dark to-background-dark overflow-hidden border-r border-slate-800">
                    {/* Blobs */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-primary rounded-full blur-[120px] animate-blob"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full blur-[150px] animate-blob animation-delay-3000"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="mb-8 inline-flex items-center justify-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-6xl">devices</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight mb-4">
                            {t.leftHeading} <span className="text-primary">{t.leftHighlight}</span>.
                        </h2>
                        <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">{t.leftDesc}</p>
                    </div>

                    {/* Tech image */}
                    <div
                        className="mt-12 w-full max-w-sm aspect-square rounded-xl overflow-hidden shadow-2xl border border-white/5 relative"
                        style={{
                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQB-1i_jfq_2I15Ra4uB4c7SMXO0Nv2FAiMwQJNeGICOJajIJ9tXcGM5oiEa4K46lmzPugoDI09Pcl9x1zVKizl_zJUdfAl0RsZR1j1hnhRaC2YXSvAWTOUy9LJG-GXcnR1HM7j1aot96zsUnKoSVZHUGZH15T932R9B6rm0oJL_qbLCiCIR4zNNmg3emiV2Tnmg47r53iukjXC1f_271w21Y7o7tozgmvKzkcfp4KQcCOzhuKRYnv7RANJRsBIwMS002oHtDeM93o')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-60"></div>
                    </div>

                    {/* Badges */}
                    <div className="mt-8 flex gap-6 text-slate-500 font-medium">
                        {[
                            { icon: "verified_user", label: t.badge1 },
                            { icon: "bolt", label: t.badge2 },
                            { icon: "support_agent", label: t.badge3 },
                        ].map((b) => (
                            <div key={b.label} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">{b.icon}</span>
                                <span className="text-xs">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right Side: Register Form ── */}
                <div className="flex flex-col p-8 md:p-12 lg:p-16 overflow-y-auto">

                    {/* Top bar */}
                    <div className="mb-10 flex items-center justify-between">
                        <button onClick={onNavigateLogin} className="flex items-center gap-2 group">
                            <div className="size-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                                <span className="material-symbols-outlined text-white text-lg">bolt</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight">TechStore</span>
                        </button>
                        <p className="text-sm text-slate-500">
                            {t.alreadyMember}{" "}
                            <button onClick={onNavigateLogin} className="text-primary font-semibold hover:underline">{t.loginLink}</button>
                        </p>
                    </div>

                    <div className="max-w-md mx-auto w-full">
                        {/* Heading */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-black mb-2">{t.heading}</h1>
                            <p className="text-slate-500 dark:text-slate-400">{t.subheading}</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>

                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.fullNameLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">person</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                        placeholder={t.fullNamePlaceholder}
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => {
                                            setTouched((p) => ({ ...p, fullName: true }));
                                            const raw = e.target.value;
                                            setFullName(raw);
                                            setErrors((prev) => ({ ...prev, fullName: getFullNameErrorCode(raw) || undefined }));
                                        }}
                                        onBlur={() => {
                                            setTouched((p) => ({ ...p, fullName: true }));
                                            const sanitized = sanitizeFullName(fullName);
                                            setFullName(sanitized);
                                            setErrors((prev) => ({ ...prev, fullName: getFullNameErrorCode(sanitized) || undefined }));
                                        }}
                                    />
                                </div>
                                {touched.fullName && errors.fullName && <div className="text-sm text-red-600">{t.errors.fullName[errors.fullName]}</div>}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.emailLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                        placeholder={t.emailPlaceholder}
                                        type="text"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => {
                                            setTouched((p) => ({ ...p, email: true }));
                                            const next = e.target.value;
                                            setEmail(next);
                                            setErrors((prev) => ({ ...prev, email: getEmailErrorCode(next) || undefined }));
                                        }}
                                        onBlur={() => {
                                            setTouched((p) => ({ ...p, email: true }));
                                            setErrors((prev) => ({ ...prev, email: getEmailErrorCode(email) || undefined }));
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    {touched.email && errors.email ? <div className="text-sm text-red-600">{t.errors.email[errors.email]}</div> : <div className="text-sm text-slate-500">&nbsp;</div>}
                                    {emailCheck.status === "checking" && <div className="text-xs text-slate-500">{t.emailChecking}</div>}
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.passwordLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">lock</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                        placeholder={t.passwordPlaceholder}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => {
                                            setTouched((p) => ({ ...p, password: true }));
                                            const next = e.target.value;
                                            setPassword(next);
                                            const codes = getPasswordIssueCodes(next);
                                            setErrors((prev) => ({ ...prev, password: codes.length ? codes : undefined }));
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        aria-label="Toggle password visibility"
                                    >
                                        <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                                {/* Password Strength */}
                                {strength && (
                                    <div className="flex items-center gap-1 mt-2 px-1">
                                        {[1, 2, 3].map((n) => (
                                            <div
                                                key={n}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= strengthInfo.bars ? strengthInfo.color : "bg-slate-200 dark:bg-slate-800"
                                                    }`}
                                            />
                                        ))}
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ml-2 ${strengthInfo.color.replace("bg-", "text-")}`}>
                                            {t.strength[strengthInfo.label]}
                                        </span>
                                    </div>
                                )}
                                {touched.password && Array.isArray(errors.password) && errors.password.length > 0 && (
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {errors.password.map((x) => (
                                            <li key={x}>{t.errors.password[x]}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.confirmPasswordLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">lock_reset</span>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-[#0f1523] border border-slate-200 dark:border-slate-800 rounded-xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                        placeholder={t.confirmPasswordPlaceholder}
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setTouched((p) => ({ ...p, confirmPassword: true }));
                                            const next = e.target.value;
                                            setConfirmPassword(next);
                                            setErrors((prev) => ({ ...prev, confirmPassword: getConfirmPasswordErrorCode(password, next) || undefined }));
                                        }}
                                        onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        aria-label="Toggle confirm password visibility"
                                    >
                                        <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                                {touched.confirmPassword && errors.confirmPassword && <div className="text-sm text-red-600">{t.errors.confirmPassword[errors.confirmPassword]}</div>}
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-3 py-2">
                                <div className="flex items-center h-5">
                                    <input
                                        id="terms"
                                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary bg-transparent cursor-pointer"
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => {
                                            setTouched((p) => ({ ...p, acceptTerms: true }));
                                            setAcceptTerms(e.target.checked);
                                            setErrors((prev) => ({ ...prev, acceptTerms: getTermsErrorCode(e.target.checked) || undefined }));
                                        }}
                                    />
                                </div>
                                <label className="text-sm text-slate-500 dark:text-slate-400 leading-snug cursor-pointer" htmlFor="terms">
                                    {t.termsText}{" "}
                                    <button type="button" onClick={onNavigateTerms} className="text-primary font-medium hover:underline">{t.termsLink}</button>{" "}
                                    {t.andText}{" "}
                                    <button type="button" onClick={onNavigatePrivacy} className="text-primary font-medium hover:underline">{t.privacyLink}</button>.
                                </label>
                            </div>
                            {touched.acceptTerms && errors.acceptTerms && <div className="text-sm text-red-600">{t.errors.acceptTerms[errors.acceptTerms]}</div>}

                            {errors._form && <div className="text-sm text-red-600">{t.errors.generic}</div>}

                            {/* Submit */}
                            <button
                                className="w-full bg-primary hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                                type="submit"
                                disabled={!canSubmit}
                            >
                                {submitting ? t.creatingBtn : t.createBtn}
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>

                            {/* Divider */}
                            <div className="relative flex py-4 items-center">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                <span className="flex-shrink mx-4 text-slate-500 text-sm font-medium">{t.orText}</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            </div>

                            {/* Google */}
                            <button
                                className="w-full bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                                type="button"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 48 48">
                                    <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335" />
                                    <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4" />
                                    <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05" />
                                    <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853" />
                                </svg>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{t.googleBtn}</span>
                            </button>
                        </form>

                        {/* Language Toggle */}
                        <div className="mt-8 flex justify-center items-center gap-3">
                            <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                                <button
                                    onClick={() => setLang("vi")}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "vi" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />
                                    VI
                                </button>
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "en" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />
                                    EN
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 text-center text-xs text-slate-500">{t.copyright}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
