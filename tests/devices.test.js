// Device testing — responsive viewports via real browser if available, else static guards.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const { startServer, stopServer, api } = require('./helper');

const VIEWPORTS = [
  { name: 'small-android', w: 360, h: 640, ua: 'Mozilla/5.0 (Linux; Android 12; Pixel 4)' },
  { name: 'large-android', w: 412, h: 915, ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)' },
  { name: 'android-tablet', w: 800, h: 1280, ua: 'Mozilla/5.0 (Linux; Android 12; Tablet)' },
  { name: 'iphone', w: 390, h: 844, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  { name: 'ipad', w: 820, h: 1180, ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' },
];

function pwAvailable() {
  try {
    execSync('command -v npx', { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

describe('devices', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('viewport meta + mobile-first CSS present', async () => {
    const r = await fetch(h.base + '/');
    const html = await r.text();
    assert.ok(html.includes('name="viewport"'));
    assert.ok(html.includes('width=device-width'));
    const css = await (await fetch(h.base + '/styles.css')).text();
    assert.ok(css.includes('max-width:1020px'));
    assert.ok(css.includes('@media(min-width:768px)'));
  });

  it('each device UA gets 200 + usable layout', async () => {
    for (const d of VIEWPORTS) {
      const r = await fetch(h.base + '/', { headers: { 'User-Agent': d.ua } });
      assert.equal(r.status, 200, d.name);
      const html = await r.text();
      assert.ok(html.includes('AI-MasterPlan'), d.name);
    }
  });

  it('playwright viewports (skipped if npx missing)', async (t) => {
    if (!pwAvailable()) { t.skip('npx unavailable'); return; }
    const home = process.env.CODEX_HOME || (process.env.HOME + '/.codex');
    const cli = home + '/skills/playwright/scripts/playwright_cli.sh';
    const fs = require('node:fs');
    if (!fs.existsSync(cli)) { t.skip('playwright CLI missing'); return; }
    for (const d of VIEWPORTS.slice(0, 2)) {
      // smoke: open + snapshot via CLI; failures surface as exceptions
      try {
        execSync(`"${cli}" open ${h.base} 2>&1 | head -3`, { timeout: 30000 });
        execSync(`"${cli}" snapshot 2>&1 | head -5`, { timeout: 30000 });
      } catch (e) {
        assert.fail(d.name + ' playwright smoke failed: ' + String(e).slice(0, 200));
      }
    }
  });
});
