const EMAIL_MAX_LENGTH = 254;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 32;

const collapseSpaces = (value) => String(value || "").replace(/\s+/g, " ").trim();

export const sanitizeFullName = (value) => {
    const collapsed = collapseSpaces(value);
    const stripped = collapsed.replace(/[^\p{L}\p{M}\s]/gu, "");
    return collapseSpaces(stripped);
};

export const validateFullName = (rawValue) => {
    const collapsed = collapseSpaces(rawValue);
    if (!collapsed) return { value: "", error: "Vui lòng nhập họ và tên" };
    const sanitized = sanitizeFullName(rawValue);
    if (sanitized.length < NAME_MIN_LENGTH) return { value: sanitized, error: "Họ và tên phải có ít nhất 2 ký tự" };
    if (sanitized.length > NAME_MAX_LENGTH) return { value: sanitized, error: "Họ và tên tối đa 50 ký tự" };
    if (sanitized !== collapsed) return { value: sanitized, error: "Họ và tên chỉ được chứa chữ cái và khoảng trắng" };
    return { value: sanitized, error: null };
};

export const validateEmail = (rawEmail) => {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!email) return { value: "", error: "Vui lòng nhập email" };
    if (email.length > EMAIL_MAX_LENGTH) return { value: email, error: "Email tối đa 254 ký tự" };
    if (email.includes("\n") || email.includes("\r")) return { value: email, error: "Email không đúng định dạng" };
    const re =
        /^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)+[A-Za-z]{2,63}$/;
    if (!re.test(email)) return { value: email, error: "Email không đúng định dạng" };
    return { value: email, error: null };
};

export const passwordIssues = (rawPassword) => {
    const pwd = String(rawPassword || "");
    const issues = [];
    if (!pwd) return ["Vui lòng nhập mật khẩu"];
    if (pwd.length < PASSWORD_MIN_LENGTH) issues.push("Mật khẩu phải có ít nhất 8 ký tự");
    if (pwd.length > PASSWORD_MAX_LENGTH) issues.push("Mật khẩu tối đa 32 ký tự");
    if (!/[A-Z]/.test(pwd)) issues.push("Mật khẩu phải có ít nhất 1 chữ cái in hoa");
    if (!/[a-z]/.test(pwd)) issues.push("Mật khẩu phải có ít nhất 1 chữ cái thường");
    if (!/\d/.test(pwd)) issues.push("Mật khẩu phải có ít nhất 1 chữ số");
    if (!/[^A-Za-z0-9]/.test(pwd)) issues.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
    return issues;
};

export const passwordStrength = (rawPassword) => {
    const pwd = String(rawPassword || "");
    if (!pwd) return null;
    const issues = passwordIssues(pwd);
    if (issues.length > 2) return "weak";
    if (issues.length > 0) return "medium";
    if (pwd.length >= 12) return "strong";
    return "medium";
};

export const validateConfirmPassword = (password, confirmPassword) => {
    const confirm = String(confirmPassword || "");
    if (!confirm) return "Vui lòng nhập xác nhận mật khẩu";
    if (String(password || "") !== confirm) return "Xác nhận mật khẩu không khớp";
    return null;
};

export const validateTerms = (checked) => {
    return checked ? null : "Bạn cần đồng ý điều khoản dịch vụ để tiếp tục";
};

export const logValidationErrors = (scope, errors) => {
    try {
        const fields = Object.keys(errors || {});
        console.warn(JSON.stringify({ type: "validation_error", scope, fields, time: new Date().toISOString() }));
    } catch {
        void 0;
    }
};

