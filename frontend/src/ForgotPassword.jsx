import { useCallback, useEffect, useState } from "react";
import { validateEmail } from "./utils/registerValidation";
import { forgotPassword } from "./services/authApi";

const T = {
  vi: {
    step: "BÆ¯á»šC 1 / 2",
    title: "QuÃªn máº­t kháº©u?",
    desc: "Nháº­p email Ä‘Ã£ Ä‘Äƒng kÃ½ Ä‘á»ƒ chÃºng tÃ´i gá»­i hÆ°á»›ng dáº«n Ä‘áº·t láº¡i máº­t kháº©u.",
    emailLabel: "Äá»‹a chá»‰ Email",
    emailPlaceholder: "Nháº­p email Ä‘Ã£ Ä‘Äƒng kÃ­",
    continue: "Tiáº¿p tá»¥c",
    back: "Quay láº¡i Ä‘Äƒng nháº­p",
    sending: "Äang gá»­i...",
    neutralSuccess: "Náº¿u email tá»“n táº¡i trong há»‡ thá»‘ng, chÃºng tÃ´i Ä‘Ã£ gá»­i hÆ°á»›ng dáº«n Ä‘áº·t láº¡i máº­t kháº©u.",
    emailNotRegistered: "Email chÆ°a Ä‘Æ°á»£c Ä‘Äƒng kÃ½",
    tooManyRequests: "Báº¡n Ä‘Ã£ yÃªu cáº§u quÃ¡ nhiá»u láº§n. Vui lÃ²ng thá»­ láº¡i sau.",
  },
  en: {
    step: "STEP 1 / 2",
    title: "Forgot Password?",
    desc: "Enter your registered email so we can send reset instructions.",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your registered email",
    continue: "Continue",
    back: "Back to login",
    sending: "Sending...",
    neutralSuccess: "If the email exists in our system, we sent password reset instructions.",
    emailNotRegistered: "Email is not registered",
    tooManyRequests: "Too many requests. Please try again later.",
  },
};

export default function ForgotPassword({ lang, setLang, onNavigateLogin, onNavigateReset }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const emailErrorMessage = useCallback((raw) => {
    const value = String(raw || "");
    const trimmed = value.trim();
    if (!trimmed) return lang === "vi" ? "Vui lÃ²ng nháº­p email" : "Please enter email";
    if (/\s/.test(value)) return lang === "vi" ? "Email khÃ´ng Ä‘Æ°á»£c chá»©a khoáº£ng tráº¯ng" : "Email must not contain whitespace";
    if (!trimmed.includes("@")) return lang === "vi" ? "Email pháº£i chá»©a kÃ½ tá»± '@'" : "Email must include '@'";
    const { error } = validateEmail(trimmed);
    if (!error) return lang === "vi" ? "Email khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng" : "Invalid email format";
    if (lang === "en") {
      const map = {
        "Email tá»‘i Ä‘a 254 kÃ½ tá»±": "Email must be at most 254 characters",
        "Email khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng": "Invalid email format",
        "Vui lÃ²ng nháº­p email": "Please enter email"
      };
      return map[error] || "Invalid email format";
    }
    return error;
  }, [lang]);

  useEffect(() => {
    if (error) {
      setError(emailErrorMessage(email));
    }
  }, [email, emailErrorMessage, error]); // re-localize existing error when user switches language

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    const { error } = validateEmail(email);
    if (error || /\s/.test(email)) {
      setError(emailErrorMessage(email));
      return;
    }
    try {
      setLoading(true);
      await forgotPassword(email);
      onNavigateReset?.();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setError(t.emailNotRegistered);
      else if (status === 429) setError(t.tooManyRequests);
      else setError(lang === "vi" ? "KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u" : "Cannot create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-md bg-slate-900/70 text-white rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-primary">history</span>
          </div>
          <span className="text-[11px] tracking-widest font-bold text-slate-300">{t.step}</span>
          <h1 className="text-2xl font-extrabold">{t.title}</h1>
          <p className="text-slate-300 text-sm text-center">{t.desc}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1">
            <label className="text-sm text-slate-300">{t.emailLabel}</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-500"
              />
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            {info && <div className="text-sm text-slate-300">{info}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? t.sending : t.continue}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </form>

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
