// Authentication + RBAC tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('auth', () => {
  let h;
  const suf = Date.now().toString(36);
  const adminEmail = `qa.admin.${suf}@example.com`;
  const stuEmail = `qa.stu.${suf}@example.com`;
  let adminTok, stuTok;

  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('password policy enforced', async () => {
    const r1 = await api(h.base, 'POST', '/api/auth/register', { email: `w1.${suf}@example.com`, password: 'short' });
    assert.equal(r1.status, 400);
    const r2 = await api(h.base, 'POST', '/api/auth/register', { email: `w2.${suf}@example.com`, password: 'password' });
    assert.equal(r2.status, 400);
  });

  it('register + login + sessions', async () => {
    const r = await api(h.base, 'POST', '/api/auth/register', { email: adminEmail, password: 'Pass1234', name: 'QA Admin' });
    assert.equal(r.status, 200);
    assert.ok(r.json.token);
    adminTok = r.json.token;
    // promote via direct admin? use /api/me as admin-only fails for student; bootstrap first user via file? instead login then check sessions
    const s = await api(h.base, 'GET', '/api/auth/sessions', null, adminTok);
    assert.equal(s.status, 200);
    assert.ok(s.json.sessions.length >= 1);
  });

  it('student cannot escalate role', async () => {
    const r = await api(h.base, 'POST', '/api/auth/register', { email: stuEmail, password: 'Pass1234' });
    stuTok = r.json.token;
    const esc = await api(h.base, 'PUT', '/api/me', { role: 'admin' }, stuTok);
    assert.equal(esc.status, 403);
  });

  it('lockout after 5 bad logins', async () => {
    const em = `qa.lock.${suf}@example.com`;
    await api(h.base, 'POST', '/api/auth/register', { email: em, password: 'Pass1234' });
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const r = await api(h.base, 'POST', '/api/auth/login', { email: em, password: 'Wrong1234' });
      last = r.status;
    }
    assert.equal(last, 429);
  });

  it('RBAC: student blocked from course create', async () => {
    const r = await api(h.base, 'POST', '/api/courses', { title: 'x', courseId: 'y' }, stuTok);
    // courses needs title+? actually /api/courses needs title; student role -> 403 regardless
    assert.equal(r.status, 403);
  });
});
