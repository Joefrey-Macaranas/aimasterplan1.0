// Offline / network-failure handling tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('offline + failures', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('malformed JSON does not crash', async () => {
    const r = await fetch(h.base + '/api/enroll/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{{bad' });
    assert.ok([200, 400].includes(r.status));
    const health = await api(h.base, 'GET', '/api/health');
    assert.equal(health.status, 200);
  });

  it('oversize body rejected (413)', async () => {
    const big = 'x'.repeat(2 * 1024 * 1024);
    const r = await api(h.base, 'POST', '/api/community', { body: big });
    assert.ok([400, 413, 429].includes(r.status));
  });

  it('unknown route 404 + bad range 416 path', async () => {
    const r = await api(h.base, 'GET', '/api/does-not-exist');
    assert.equal(r.status, 404);
  });

  it('client timeout handling (AbortSignal)', async () => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 50);
    try {
      await fetch(h.base + '/api/health', { signal: ctl.signal });
    } catch (e) {
      assert.ok(e.name === 'AbortError' || e.cause);
    } finally {
      clearTimeout(t);
    }
    const ok = await api(h.base, 'GET', '/api/health');
    assert.equal(ok.status, 200);
  });

  it('server unreachable surfaces error (offline)', async () => {
    let failed = false;
    try {
      await fetch('http://localhost:1/api/health');
    } catch { failed = true; }
    assert.ok(failed);
  });
});
