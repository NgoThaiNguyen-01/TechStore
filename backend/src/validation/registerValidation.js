const EMAIL_MAX_LENGTH = 254;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 32;

const collapseSpaces = (value) => String(value || '').replace(/\s+/g, ' ').trim();

export const sanitizeFullName = (value) => {
  const collapsed = collapseSpaces(value);
  const stripped = collapsed.replace(/[^\p{L}\p{M}\s]/gu, '');
  return collapseSpaces(stripped);
};

const isValidEmailRfc5322Like = (value) => {
  const email = String(value || '');
  if (!email) return false;
  if (email.length > EMAIL_MAX_LENGTH) return false;
  if (email.includes('\n') || email.includes('\r')) return false;
  const re = /^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)+[A-Za-z]{2,63}$/;
  return re.test(email);
};

export const validateEmail = (rawEmail) => {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) return { email: '', error: 'Vui lòng nhập email' };
  if (email.length > EMAIL_MAX_LENGTH) return { email, error: 'Email tối đa 254 ký tự' };
  if (!isValidEmailRfc5322Like(email)) return { email, error: 'Email không đúng định dạng' };
  return { email, error: null };
};

export const passwordIssues = (password) => {
  const raw = String(password || '');
  const issues = [];
  if (!raw) return ['Mật khẩu là bắt buộc'];
  if (raw.length < PASSWORD_MIN_LENGTH) issues.push('Mật khẩu phải có ít nhất 8 ký tự');
  if (raw.length > PASSWORD_MAX_LENGTH) issues.push('Mật khẩu tối đa 32 ký tự');
  if (!/[A-Z]/.test(raw)) issues.push('Mật khẩu phải có ít nhất 1 chữ cái in hoa');
  if (!/[a-z]/.test(raw)) issues.push('Mật khẩu phải có ít nhất 1 chữ cái thường');
  if (!/\d/.test(raw)) issues.push('Mật khẩu phải có ít nhất 1 chữ số');
  if (!/[^A-Za-z0-9]/.test(raw)) issues.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  return issues;
};

export const validateRegisterPayload = (payload = {}) => {
  const errors = {};

  const rawName = payload.fullName ?? payload.name ?? '';
  const rawEmail = payload.email ?? '';
  const rawPassword = payload.password ?? '';
  const rawConfirm = payload.confirmPassword ?? '';
  const rawTerms = payload.acceptTerms ?? payload.termsAccepted ?? payload.terms ?? false;

  const collapsedName = collapseSpaces(rawName);
  const sanitizedName = sanitizeFullName(rawName);
  if (!collapsedName) {
    errors.fullName = 'Vui lòng nhập họ và tên';
  } else if (sanitizedName.length < NAME_MIN_LENGTH) {
    errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
  } else if (sanitizedName.length > NAME_MAX_LENGTH) {
    errors.fullName = 'Họ và tên tối đa 50 ký tự';
  } else if (sanitizedName !== collapsedName) {
    errors.fullName = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
  }

  const { email, error: emailError } = validateEmail(rawEmail);
  if (emailError) errors.email = emailError;

  const pwdIssues = passwordIssues(rawPassword);
  if (pwdIssues.length > 0) {
    errors.password = pwdIssues;
  }

  const confirm = String(rawConfirm || '');
  if (!confirm) {
    errors.confirmPassword = 'Vui lòng nhập xác nhận mật khẩu';
  } else if (String(rawPassword || '') !== confirm) {
    errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
  }

  const acceptTerms = rawTerms === true || rawTerms === 'true' || rawTerms === 1 || rawTerms === '1' || rawTerms === 'on';
  if (!acceptTerms) {
    errors.acceptTerms = 'Bạn cần đồng ý điều khoản dịch vụ để tiếp tục';
  }

  const sanitized = {
    name: sanitizedName,
    email,
    password: String(rawPassword || ''),
    acceptTerms
  };

  return { ok: Object.keys(errors).length === 0, errors, sanitized };
};
