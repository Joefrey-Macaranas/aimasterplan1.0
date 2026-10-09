// Student lesson viewer API tests (MVP: video/tutorials/copyable).
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('lesson viewer', () => {
  let h, stuTok;
  const suf = Date.now().toString(36);
  const em = `qa.les.${suf}@example.com`;
  before(async () => {
    h = await startServer();
    const r = await api(h.base, 'POST', '/api/auth/register', { email: em, password: 'Pass1234' });
    stuTok = r.json.token;
    // enroll the student so premium content is reachable
    const users = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'data', 'users.json'), 'utf8');
    const u = JSON.parse(users);
    u[em].enrollmentStatus = 'active';
    require('node:fs').writeFileSync(require('node:path').join(__dirname, '..', 'data', 'users.json'), JSON.stringify(u, null, 2));
  });
  after(() => stopServer(h));

  it('published lessons open (anonymous reads, no progress leaked)', async () => {
    const anon = await api(h.base, 'GET', '/api/curriculum/lesson/L1M1L1');
    assert.equal(anon.status, 200);
    assert.ok(Array.isArray(anon.json.lesson.blocks) && anon.json.lesson.blocks.length >= 1);
    assert.equal(anon.json.lesson.completed, false);
    const r = await api(h.base, 'GET', '/api/curriculum/lesson/L1M1L1', null, stuTok);
    assert.equal(r.status, 200);
    assert.ok(r.json.lesson.levelId && r.json.lesson.moduleId);
  });

  it('unknown lesson 404', async () => {
    assert.equal((await api(h.base, 'GET', '/api/curriculum/lesson/NOPE', null, stuTok)).status, 404);
  });

  it('complete flow persists', async () => {
    const w = await api(h.base, 'POST', '/api/lesson-progress', { lessonId: 'L1M1L1', completed: true }, stuTok);
    assert.equal(w.status, 200);
    const r = await api(h.base, 'GET', '/api/curriculum/lesson/L1M1L1', null, stuTok);
    assert.equal(r.json.lesson.completed, true);
  });
});
