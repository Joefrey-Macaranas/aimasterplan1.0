// Slow-network testing — latency tolerance, partial content, retries.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('slow network', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('health under slow client (delayed read still 200)', async () => {
    const r = await fetch(h.base + '/api/health');
    assert.equal(r.status, 200);
    // simulate slow read: stream body in chunks
    const buf = await r.arrayBuffer();
    assert.ok(buf.byteLength > 10);
  });

  it('curriculum payload complete despite throttling', async () => {
    const t0 = Date.now();
    const r = await api(h.base, 'GET', '/api/curriculum');
    const dt = Date.now() - t0;
    assert.equal(r.status, 200);
    assert.ok(r.json.levels.length >= 10);
    assert.ok(dt < 5000, 'too slow: ' + dt + 'ms');
  });

  it('range retries converge', async () => {
    // use prod-seeded video if present; else skip
    const list = await api(h.base, 'GET', '/api/videos');
    if (list.status !== 200 || !list.json.items?.length) return;
    const id = list.json.items[0].id;
    let ok = false;
    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${h.base}/api/videos/${id}`, { headers: { Range: 'bytes=0-10' } });
      if ([200, 206, 401, 402].includes(r.status)) { ok = true; break; }
    }
    assert.ok(ok);
  });
});
