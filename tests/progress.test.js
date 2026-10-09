// Course progress + analytics tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('progress + analytics', () => {
  let h, tok;
  const suf = Date.now().toString(36);
  const email = `qa.prog.${suf}@example.com`;

  before(async () => {
    h = await startServer();
    const r = await api(h.base, 'POST', '/api/auth/register', { email, password: 'Pass1234' });
    tok = r.json.token;
  });
  after(() => stopServer(h));

  it('lesson progress write + aggregate', async () => {
    const w = await api(h.base, 'POST', '/api/lesson-progress', { lessonId: 'L1M1L1', completed: true }, tok);
    assert.equal(w.status, 200);
    const g = await api(h.base, 'GET', `/api/progress?email=${encodeURIComponent(email)}`);
    assert.equal(g.status, 200);
    assert.ok(g.json.done >= 1);
  });

  it('module progress write', async () => {
    const w = await api(h.base, 'POST', '/api/module-progress', { moduleId: 'L1M1', pct: 50 }, tok);
    assert.equal(w.status, 200);
  });

  it('student analytics self', async () => {
    const r = await api(h.base, 'GET', '/api/analytics/student', null, tok);
    assert.equal(r.status, 200);
    for (const k of ['learningHours', 'completedLessons', 'currentStreakDays', 'projects', 'skills']) {
      assert.ok(k in r.json, 'missing ' + k);
    }
    assert.ok(r.json.completedLessons >= 1);
  });

  it('student cannot view others analytics', async () => {
    const r = await api(h.base, 'GET', '/api/analytics/student?email=other@example.com', null, tok);
    assert.equal(r.status, 403);
  });
});
