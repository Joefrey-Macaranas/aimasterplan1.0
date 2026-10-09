// API tests — public contract + arch manifest.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('api', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('health/overview/curriculum', async () => {
    const he = await api(h.base, 'GET', '/api/health');
    assert.equal(he.status, 200);
    assert.equal(he.json.program, 'ai-masterplan');
    const ov = await api(h.base, 'GET', '/api/overview');
    assert.equal(ov.status, 200);
    assert.ok(ov.json.levels >= 10 && ov.json.lessons >= 100);
    const cu = await api(h.base, 'GET', '/api/curriculum');
    assert.equal(cu.status, 200);
    assert.ok(Array.isArray(cu.json.levels));
  });

  it('arch lists 22 entities', async () => {
    const r = await api(h.base, 'GET', '/api/arch');
    assert.equal(r.status, 200);
    assert.equal(r.json.entities.length, 22);
    for (const e of ['users', 'lesson_progress', 'meetings', 'certificates']) {
      assert.ok(r.json.entities.includes(e));
    }
    assert.ok(r.json.routes.includes('/api/videos'));
    assert.ok(r.json.routes.includes('/api/files'));
  });

  it('protected routes deny anonymous', async () => {
    for (const p of ['/api/cms', '/api/cms/course', '/api/lesson-resources', '/api/videos']) {
      const r = await api(h.base, 'GET', p);
      assert.ok([401, 402].includes(r.status), p + ' got ' + r.status);
    }
  });

  it('malformed JSON + 404 handled', async () => {
    const r = await fetch(h.base + '/api/enroll/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{{bad' });
    assert.ok([200, 400].includes(r.status));
    const nf = await api(h.base, 'GET', '/api/nope-xyz');
    assert.equal(nf.status, 404);
  });
});
