// Landing structure (layout/UX cloning): static sections + anonymous demo.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

const HTML = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const JS = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

describe('landing', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('sticky nav + hero + features + demo + showcase sections', async () => {
    for (const id of ['statBand', 'features', 'demo', 'demoEditor', 'demoRunBtn', 'demoOut', 'showcase', 'showcaseStrip']) {
      assert.ok(HTML().includes(`id="${id}"`), 'missing #' + id);
    }
    assert.ok(!HTML().includes('nav-cta'), 'Start-free CTA removed');
  });

  it('anonymous demo runs small snippets, rejects large', async () => {
    const ok = await api(h.base, 'POST', '/api/challenges/run', { code: 'console.log(1)' });
    assert.equal(ok.status, 200);
    assert.ok(ok.json.passed);
    const big = await api(h.base, 'POST', '/api/challenges/run', { code: 'x'.repeat(600) });
    assert.equal(big.status, 401);
  });

  it('stats come from live overview (no hardcoded claims)', async () => {
    assert.ok(JS().includes('/api/overview'));
    assert.ok(!/50,?000 graduates|hired at Google/i.test(HTML()), 'no fabricated endorsements');
  });
});
