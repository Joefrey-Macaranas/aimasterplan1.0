// Performance testing — latency budgets for hot endpoints.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./helper');

async function timeIt(base, p, n = 10) {
  const ds = [];
  for (let i = 0; i < n; i++) {
    const t0 = Date.now();
    const r = await fetch(base + p);
    await r.arrayBuffer();
    ds.push(Date.now() - t0);
    assert.equal(r.status, 200, p);
  }
  ds.sort((a, b) => a - b);
  return { p50: ds[Math.floor(ds.length / 2)], p95: ds[Math.min(ds.length - 1, Math.floor(ds.length * 0.95))], max: ds[ds.length - 1] };
}

describe('perf', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('hot endpoints within budget', async () => {
    const budgets = { '/api/health': 200, '/api/overview': 300, '/api/curriculum': 500, '/': 500 };
    for (const [p, budget] of Object.entries(budgets)) {
      const { p50, p95 } = await timeIt(h.base, p, 5);
      assert.ok(p95 < budget, `${p} p95=${p95}ms over ${budget}ms (p50=${p50})`);
    }
  }, { timeout: 60000 });
});
