import { decideCanAffect } from '../services/superAdminRules.js';

const SA_F = { role: 'SUPER_ADMIN', superAdminType: 'FOUNDING', email: 'founder@t.dev' };
const SA_F2 = { role: 'SUPER_ADMIN', superAdminType: 'FOUNDING', email: 'founder2@t.dev' };
const SA_R = { role: 'SUPER_ADMIN', superAdminType: 'REGULAR', email: 'regular@t.dev' };
const ADMIN = { role: 'ADMIN', email: 'admin@t.dev' };
const CUST = { role: 'CUSTOMER', email: 'cust@t.dev' };

const run = () => {
  const failures = [];

  const assert = (cond, msg) => { if (!cond) failures.push(msg); };

  // 1) Non-SA cannot affect SA
  assert(decideCanAffect({ actor: ADMIN, target: SA_R }).allow === false, 'ADMIN should not affect SA');

  // 2) Founding cannot affect Founding by default
  assert(decideCanAffect({ actor: SA_F, target: SA_F2, env: {} }).allow === false, 'Founding should not affect Founding');

  // 3) Founding can affect Regular
  assert(decideCanAffect({ actor: SA_F, target: SA_R }).allow === true, 'Founding should affect Regular');

  // 4) Regular cannot affect Founding
  assert(decideCanAffect({ actor: SA_R, target: SA_F }).allow === false, 'Regular should not affect Founding');

  // 5) Founder mutual edit when flag set
  assert(decideCanAffect({ actor: SA_F, target: SA_F2, env: { FOUNDER_MUTUAL_EDIT: 'true' } }).allow === true, 'Founding mutual allowed by flag');

  // 6) Master list override
  assert(decideCanAffect({ actor: { ...ADMIN, email: 'm@t.dev' }, target: SA_F, env: { MASTER_SUPER_ADMIN_EMAILS: 'm@t.dev' } }).allow === true, 'Master override should allow');

  if (failures.length) {
    console.error('SuperAdmin policy tests failed:');
    failures.forEach((f) => console.error('- ' + f));
    process.exit(1);
  } else {
    console.log('SuperAdmin policy tests passed');
  }
};

run();
