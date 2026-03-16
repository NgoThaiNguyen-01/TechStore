import { useState } from "react";
import "./login.css";
import { loginUser } from "./services/authApi";
import { validateEmail } from "./utils/registerValidation";
import { persistAuthSession } from "./utils/authStorage";
import { migrateGuestCartToCurrentUser } from "./utils/cartStorage";
import { migrateGuestWishlistToCurrentUser } from "./utils/wishlistStorage";
import { canAccessAdminApp } from "./utils/adminAccess";

/* ─── Translation dictionary ─── */
const T = {
    vi: {
        welcome: "Chào mừng trở lại",
        subtitle: "Vui lòng nhập thông tin để đăng nhập vào tài khoản.",
        backHome: "Quay lại trang chủ",
        emailLabel: "Địa chỉ Email",
        emailPlaceholder: "Nhập email",
        passwordLabel: "Mật khẩu",
        passwordPlaceholder: "Nhập mật khẩu",
        remember: "Ghi nhớ đăng nhập",
        forgot: "Quên mật khẩu?",
        signIn: "Đăng nhập",
        orWith: "Hoặc tiếp tục bằng",
        google: "Google",
        noAccount: "Chưa có tài khoản?",
        createAccount: "Tạo tài khoản",
        tagline: "Chào mừng bạn quay trở lại TechStore.",
        taglineDesc: "Đăng nhập để tiếp tục mua sắm và theo dõi đơn hàng của bạn.",
        copyright: "© 2024 TechStore Inc. Bảo lưu mọi quyền.",
        signingIn: "Đang đăng nhập...",
        errEmail: {
            required: "Vui lòng nhập email",
            whitespace: "Email không được chứa khoảng trắng",
            missingAt: "Email phải chứa ký tự '@'",
            invalid: "Email không đúng định dạng",
            maxLength: "Email tối đa 254 ký tự",
        },
        errPassword: {
            required: "Vui lòng nhập mật khẩu",
            length: "Mật khẩu 8–32 ký tự",
            trim: "Không chứa khoảng trắng đầu/cuối",
        },
        apiError: {
            emailNotRegistered: "Email chưa được đăng ký",
            passwordIncorrect: "Mật khẩu không chính xác",
            accountLocked: (minutes) => `Tài khoản tạm khóa. Thử lại sau ${minutes} phút`,
            cannotConnect: "Không thể kết nối máy chủ",
            loginFailed: "Đăng nhập thất bại",
        },
    },
    en: {
        welcome: "Welcome Back",
        subtitle: "Please enter your details to sign in to your account.",
        backHome: "Back to home",
        emailLabel: "Email Address",
        emailPlaceholder: "Enter email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter password",
        remember: "Remember me",
        forgot: "Forgot password?",
        signIn: "Sign In",
        orWith: "Or continue with",
        google: "Google",
        noAccount: "Don't have an account?",
        createAccount: "Create an account",
        tagline: "Welcome back to TechStore.",
        taglineDesc: "Login to continue shopping and track your orders.",
        copyright: "© 2024 TechStore Inc. All rights reserved.",
        signingIn: "Signing in...",
        errEmail: {
            required: "Please enter email",
            whitespace: "Email must not contain whitespace",
            missingAt: "Email must include '@'",
            invalid: "Invalid email format",
            maxLength: "Email must be at most 254 characters",
        },
        errPassword: {
            required: "Please enter password",
            length: "Password must be 8–32 characters",
            trim: "Password must not have leading/trailing spaces",
        },
        apiError: {
            emailNotRegistered: "Email is not registered",
            passwordIncorrect: "Incorrect password",
            accountLocked: (minutes) => `Account locked. Try again in ${minutes} minutes`,
            cannotConnect: "Cannot connect to server",
            loginFailed: "Login failed",
        },
    },
};

export default function Login({ lang, setLang, onNavigateHome, onNavigateRegister, onNavigateAdmin, onNavigateForgot }) {
    const t = T[lang];
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({ email: null, password: null });
    const [authError, setAuthError] = useState(null);

    const getEmailErrorCode = (value) => {
        const raw = String(value || "");
        const trimmed = raw.trim();
        if (!trimmed) return "required";
        if (/\s/.test(raw)) return "whitespace";
        if (!trimmed.includes("@")) return "missingAt";
        const { error } = validateEmail(trimmed);
        if (!error) return null;
        if (String(error).includes("254")) return "maxLength";
        return "invalid";
    };

    const getPasswordErrorCode = (value) => {
        const raw = String(value || "");
        if (!raw) return "required";
        if (raw.length < 8 || raw.length > 32) return "length";
        if (raw !== raw.trim()) return "trim";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        const nextFormErrors = {
            email: getEmailErrorCode(email),
            password: getPasswordErrorCode(password),
        };
        setFormErrors(nextFormErrors);
        if (nextFormErrors.email || nextFormErrors.password) return;
        setLoading(true);
        try {
            const data = await loginUser({ email, password, remember });
            if (!data?.success) {
                setAuthError({ code: "loginFailed" });
                return;
            }
            persistAuthSession({
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken,
                user: data.data.user,
                remember,
            });
            await Promise.all([
                migrateGuestCartToCurrentUser(),
                migrateGuestWishlistToCurrentUser(),
            ]);
            try {
                window.dispatchEvent(new Event("user:updated"));
                window.dispatchEvent(new Event("cart:updated"));
                window.dispatchEvent(new Event("wishlist:updated"));
            } catch {
                void 0;
            }
            // Route by role
            if (canAccessAdminApp(data.data.user)) {
                onNavigateAdmin();
            } else {
                onNavigateHome();
            }
        } catch (err) {
            const status = err?.response?.status;
            const msg = String(err?.response?.data?.message || "");
            if (status === 404) setAuthError({ code: "emailNotRegistered" });
            else if (status === 401) setAuthError({ code: "passwordIncorrect" });
            else if (status === 423) {
                const minutes = Number((msg.match(/\d+/) || [])[0] || 10);
                setAuthError({ code: "accountLocked", minutes });
            } else {
                setAuthError({ code: "cannotConnect" });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-6xl w-full bg-white dark:bg-slate-900/50 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">

                {/* ── Left Side: Illustration ── */}
                <div className="hidden md:flex w-1/2 bg-primary/10 relative overflow-hidden items-center justify-center p-12">
                    {/* Animated blobs */}
                    <div className="absolute inset-0 z-0 opacity-40">
                        <div className="absolute top-0 -left-20 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        {/* Logo */}
                        <button
                            onClick={onNavigateHome}
                            className="flex items-center gap-3 w-fit group"
                        >
                            <div className="bg-primary p-2 rounded-lg text-white group-hover:bg-blue-700 transition-colors">
                                <span className="material-symbols-outlined text-3xl">bolt</span>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">TechStore</span>
                        </button>

                        {/* Card */}
                        <div className="space-y-6">
                            <div className="rounded-xl border border-primary/20 bg-white/5 backdrop-blur-md p-8 shadow-inner">
                                <div
                                    className="aspect-square w-full rounded-lg bg-slate-800 mb-6"
                                    style={{
                                        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtmwkO5xWiqeAlCMLIENuT8N3SuGQs1zvEmqz5gXNPf8t5HEpSMwH2wqGxw1JojdJ4eK5wdTiKOAxNHl1e1gzH43PFSTci97iD_YsJLSnpTDZVerBFqy02SpKN5DRCJCkCDgsWGS7TQf0JsJBTDeP3YujfbjXR-fXc044eSKKyvCikGoVA8dkj_yZFb1Lc9UhTZnVGP4axVqQ5vvjvNzRAJCcQ6j8QN_AkGKmfoPNlko277XcmPz-E62mt6C84YrUVtDNDRWCg48eG')",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t.tagline}</h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">{t.taglineDesc}</p>
                            </div>
                        </div>

                        <p className="text-slate-500 text-sm font-medium">{t.copyright}</p>
                    </div>
                </div>

                {/* ── Right Side: Login Form ── */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-[#111827]">
                    <div className="max-w-md w-full mx-auto">

                        {/* Mobile logo */}
                        <button onClick={onNavigateHome} className="flex items-center gap-2 mb-8 md:hidden">
                            <div className="bg-primary p-1.5 rounded-lg text-white">
                                <span className="material-symbols-outlined">bolt</span>
                            </div>
                            <span className="text-xl font-black text-primary">TechStore</span>
                        </button>

                        {/* Heading */}
                        <div className="mb-10">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{t.welcome}</h1>
                            <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.emailLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                    <input
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400"
                                        placeholder={t.emailPlaceholder}
                                        type="text"
                                        inputMode="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                {formErrors.email && <div className="mt-1 text-sm text-red-600">{t.errEmail[formErrors.email]}</div>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.passwordLabel}</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                    <input
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-400"
                                        placeholder={t.passwordPlaceholder}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? "visibility_off" : "visibility"}
                                        </span>
                                    </button>
                                </div>
                                {formErrors.password && <div className="mt-1 text-sm text-red-600">{t.errPassword[formErrors.password]}</div>}
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-primary focus:ring-primary"
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{t.remember}</span>
                                </label>
                                <button type="button" onClick={onNavigateForgot} className="text-sm font-semibold text-primary hover:underline underline-offset-4">{t.forgot}</button>
                            </div>

                            {/* Error message */}
                            {authError?.code && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {authError.code === "accountLocked"
                                        ? t.apiError.accountLocked(authError.minutes || 10)
                                        : t.apiError[authError.code]}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                className="w-full bg-primary hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        {t.signingIn}
                                    </>
                                ) : (
                                    <>
                                        {t.signIn}
                                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">{t.orWith}</span>
                                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            </div>

                            {/* Google */}
                            <button
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
                                type="button"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                {t.google}
                            </button>
                        </form>

                        {/* Sign up link */}
                        <div className="mt-10 text-center">
                            <p className="text-slate-500 dark:text-slate-400">
                                {t.noAccount}{" "}
                                <a className="text-primary font-bold hover:underline underline-offset-4 ml-1" onClick={onNavigateRegister} style={{ cursor: 'pointer' }}>{t.createAccount}</a>
                            </p>
                        </div>

                        {/* ── Language Toggle ── */}
                        <div className="mt-8 flex justify-center items-center gap-3">
                            <span className="material-symbols-outlined text-slate-400 text-lg">language</span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setLang("vi")}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "vi"
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />
                                    VI
                                </button>
                                <button
                                    onClick={() => setLang("en")}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${lang === "en"
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />
                                    EN
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
