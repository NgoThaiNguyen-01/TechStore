import { passwordIssues, sanitizeFullName, validateEmail, validateRegisterPayload } from '../validation/registerValidation.js';

const run = () => {
  const failures = [];
  const assert = (cond, msg) => { if (!cond) failures.push(msg); };
  const eq = (a, b, msg) => assert(a === b, `${msg} (expected: ${b}, got: ${a})`);

  eq(sanitizeFullName('  Nguyễn   Văn   A  '), 'Nguyễn Văn A', 'fullName trims and collapses spaces');
  eq(sanitizeFullName('Nguyễn Văn A 123 @@'), 'Nguyễn Văn A', 'fullName strips digits/special');

  {
    const v = validateRegisterPayload({ fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
    assert(v.ok === false, 'empty payload should be invalid');
    assert(Boolean(v.errors.fullName), 'fullName required error');
    assert(Boolean(v.errors.email), 'email required error');
    assert(Boolean(v.errors.password), 'password required error');
    assert(Boolean(v.errors.confirmPassword), 'confirmPassword required error');
    assert(Boolean(v.errors.acceptTerms), 'acceptTerms required error');
  }

  {
    const v = validateRegisterPayload({ fullName: 'A', email: 'a@b.com', password: 'Aa1!aaaa', confirmPassword: 'Aa1!aaaa', acceptTerms: true });
    assert(v.ok === false, 'fullName length < 2 should be invalid');
    assert(String(v.errors.fullName || '').includes('ít nhất 2'), 'fullName min length message');
  }

  {
    const name51 = 'A'.repeat(51);
    const v = validateRegisterPayload({ fullName: name51, email: 'a@b.com', password: 'Aa1!aaaa', confirmPassword: 'Aa1!aaaa', acceptTerms: true });
    assert(v.ok === false, 'fullName length > 50 should be invalid');
    assert(String(v.errors.fullName || '').includes('tối đa 50'), 'fullName max length message');
  }

  {
    const v = validateRegisterPayload({ fullName: 'Nguyễn Văn 123', email: 'a@b.com', password: 'Aa1!aaaa', confirmPassword: 'Aa1!aaaa', acceptTerms: true });
    assert(v.ok === false, 'fullName with digits should be invalid');
    assert(String(v.errors.fullName || '').includes('chữ cái'), 'fullName invalid chars message');
  }

  {
    const { error } = validateEmail('not-an-email');
    assert(Boolean(error), 'invalid email should error');
  }

  {
    const longEmail = `${'a'.repeat(245)}@a.com`;
    const { error } = validateEmail(longEmail);
    assert(Boolean(error), 'email > 254 should error');
  }

  {
    const { error, email } = validateEmail('TeSt.User+tag@Example.COM');
    assert(!error, 'valid email should pass');
    eq(email, 'test.user+tag@example.com', 'email normalized to lowercase');
  }

  {
    const issues = passwordIssues('');
    eq(Array.isArray(issues), true, 'passwordIssues returns array');
    eq(issues[0], 'Mật khẩu là bắt buộc', 'password required returns message');
  }

  {
    const issues = passwordIssues('aaaaaaaa');
    assert(issues.some((x) => x.includes('in hoa')), 'password requires uppercase');
    assert(issues.some((x) => x.includes('chữ số')), 'password requires digit');
    assert(issues.some((x) => x.includes('đặc biệt')), 'password requires special');
  }

  {
    const issues = passwordIssues('Aa1!aaaa');
    eq(issues.length, 0, 'valid password has no issues');
  }

  {
    const issues = passwordIssues('Aa1!' + 'a'.repeat(40));
    assert(issues.some((x) => x.includes('tối đa 32')), 'password max length enforced');
  }

  {
    const v = validateRegisterPayload({ fullName: 'Nguyễn Văn A', email: 'a@b.com', password: 'Aa1!aaaa', confirmPassword: 'Aa1!aaab', acceptTerms: true });
    assert(v.ok === false, 'confirm mismatch should be invalid');
    assert(String(v.errors.confirmPassword || '').includes('khớp'), 'confirm mismatch message');
  }

  if (failures.length) {
    console.error('Register validation tests failed:');
    failures.forEach((f) => console.error('- ' + f));
    process.exit(1);
  } else {
    console.log('Register validation tests passed');
  }
};

run();
