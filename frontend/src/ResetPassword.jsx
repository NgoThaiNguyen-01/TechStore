import { useState } from "react";
import { passwordIssues, passwordStrength, validateConfirmPassword } from "./utils/registerValidation";
import { resetPassword } from "./services/authApi";

const T = {
  vi: {
    step: "BƯỚC 2 / 2",
    title: "Tạo mật khẩu mới",
    newPassword: "Mật khẩu mới",
    confirm: "Xác nhận mật khẩu",
    submit: "Đặt lại mật khẩu",
    back: "Quay lại đăng nhập",
    strength: "Độ mạnh",
    strengthLabels: { weak: "Yếu", medium: "Trung bình", strong: "Mạnh" },
    sending: "Đang gửi...",
    success: "Đặt lại mật khẩu thành công",
    genericError: "Có lỗi xảy ra",
    sessionExpired: "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng quay lại và thử lại.",
  },
  en: {
    step: "STEP 2 / 2",
    title: "Create a new password",
    newPassword: "New password",
    confirm: "Confirm password",
    submit: "Reset password",
    back: "Back to login",
    strength: "Strength",
    strengthLabels: { weak: "Weak", medium: "Medium", strong: "Strong" },
    sending: "Submitting...",
    success: "Password reset successfully",
    genericError: "Something went wrong",
    sessionExpired: "Reset session expired. Please go back and try again.",
  },
};

const STRENGTH = {
  weak: { bars: 1, color: "bg-red-500" },
  medium: { bars: 2, color: "bg-yellow-400" },
  strong: { bars: 3, color: "bg-primary" },
};

export default function ResetPassword({ lang, setLang, onNavigateLogin }) {
  const t = T[lang];
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const translatePasswordIssue = (issue) => {
    if (lang !== "en") return issue;
    const map = {
      "Vui lòng nhập mật khẩu": "Please enter password",
      "Mật khẩu phải có ít nhất 8 ký tự": "Password must be at least 8 characters",
      "Mật khẩu tối đa 32 ký tự": "Password must be at most 32 characters",
      "Mật khẩu phải có ít nhất 1 chữ cái in hoa": "Password must include at least 1 uppercase letter",
      "Mật khẩu phải có ít nhất 1 chữ cái thường": "Password must include at least 1 lowercase letter",
      "Mật khẩu phải có ít nhất 1 chữ số": "Password must include at least 1 number",
      "Mật khẩu phải có ít nhất 1 ký tự đặc biệt": "Password must include at least 1 special character",
    };
    return map[issue] || issue;
  };

  const translateConfirmError = (msg) => {
    if (!msg) return msg;
    if (lang !== "en") return msg;
    const map = {
      "Vui lòng nhập xác nhận mật khẩu": "Please confirm password",
      "Xác nhận mật khẩu không khớp": "Passwords do not match",
    };
    return map[msg] || msg;
  };

  const translateApiMessage = (msg) => {
    if (!msg || lang !== "en") return msg;
    const map = {
      "Token không hợp lệ hoặc đã hết hạn": "Invalid or expired token",
      "Mật khẩu không hợp lệ": "Password is invalid",
      "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.": "Reset session expired. Please try again.",
      "Đặt lại mật khẩu thành công": "Password reset successfully",
    };
    return map[msg] || msg;
  };

  const strength = passwordStrength(password);
  const sInfo = strength ? STRENGTH[strength] : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const next = {};
    const list = passwordIssues(password);
    if (list.length) next.password = list.map(translatePasswordIssue);
    const cErr = validateConfirmPassword(password, confirmPassword);
    if (cErr) next.confirmPassword = translateConfirmError(cErr);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      setLoading(true);
      await resetPassword({ password, confirmPassword });
      setMessage(t.success);
      setTimeout(() => onNavigateLogin?.(), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setMessage(translateApiMessage(msg) || t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-md bg-slate-900/70 text-white rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="flex flex-col gap-2 mb-6">
          <span className="text-[11px] tracking-widest font-bold text-slate-300">{t.step}</span>
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">{t.newPassword}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  const next = e.target.value;
                  setPassword(next);
                  const list = passwordIssues(next);
                  setErrors((prev) => ({ ...prev, password: list.length ? list.map(translatePasswordIssue) : undefined }));
                }}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-500"
                placeholder=""
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {Array.isArray(errors.password) && (
              <ul className="text-sm text-red-400 space-y-1">{errors.password.map((x) => <li key={x}>{translatePasswordIssue(x)}</li>)}</ul>
            )}
            {sInfo && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`${sInfo.color} h-1.5`} style={{ width: `${sInfo.bars * 33.33}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-1">{t.strength}: {t.strengthLabels?.[strength] || strength}</div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-300">{t.confirm}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  const next = e.target.value;
                  setConfirmPassword(next);
                  const cErr = validateConfirmPassword(password, next);
                  setErrors((prev) => ({ ...prev, confirmPassword: cErr ? translateConfirmError(cErr) : undefined }));
                }}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-500"
                placeholder=""
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {errors.confirmPassword && <div className="text-sm text-red-400">{translateConfirmError(errors.confirmPassword)}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? t.sending : t.submit}
            <span className="material-symbols-outlined text-lg">lock_open</span>
          </button>
        </form>

        {message && <div className="mt-4 text-center text-slate-300">{message}</div>}

        <button onClick={onNavigateLogin} className="mt-6 text-sm text-orange-500 hover:text-orange-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t.back}
        </button>
      </div>
      {/* Language toggle */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full shadow">
          <button
            onClick={() => setLang?.("vi")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "vi" ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-800"}`}
          >
            <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-4 h-3 object-cover rounded-sm" />
            VI
          </button>
          <button
            onClick={() => setLang?.("en")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:text-slate-800"}`}
          >
            <img src="https://flagcdn.com/w20/gb.png" alt="GB" className="w-4 h-3 object-cover rounded-sm" />
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
