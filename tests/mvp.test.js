// MVP definition-of-done checks (prompt §1–15): static UI + API presence.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

const HTML = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const JS = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const CSS = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');

describe('mvp scope', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('theme toggle (logo only) + offline banner markup', async () => {
    assert.ok(!HTML().includes('id="themeBtn"'), 'button removed');
    assert.ok(HTML().includes('id="brandLogo"'));
    assert.ok(HTML().includes('id="offlineBar"'));
    assert.ok(CSS().includes('[data-theme="light"]'));
    assert.ok(JS().includes('amp-theme'));
    assert.ok(JS().includes('toggleTheme'));
    assert.ok(JS().includes("logo-light.jpeg"));
  });

  it('bookmarks + resume + tools filter + calendar markup', async () => {
    assert.ok(HTML().includes('id="resumeCard"'));
    assert.ok(HTML().includes('id="bookmarkList"'));
    assert.ok(HTML().includes('id="qCat"'));
    assert.ok(JS().includes('amp-bookmarks') && JS().includes('amp-last-lesson'));
    assert.ok(JS().includes('meet-greet.ics'));
  });

  it('video resume + greeting + saved onboarding', async () => {
    assert.ok(JS().includes('amp-video-'));
    assert.ok(JS().includes('Welcome back'));
    assert.ok(JS().includes('amp-onboard'));
  });

  it('privacy/terms/manifest served', async () => {
    for (const p of ['/privacy.html', '/terms.html', '/manifest.json']) {
      assert.equal((await fetch(h.base + p)).status, 200, p);
    }
  });

  it('non-MVP correctly absent (marketplace/mentors/public-directory)', async () => {
    const src = JS() + HTML();
    assert.ok(!/marketplace/i.test(src));
    const r = await api(h.base, 'GET', '/api/arch');
    assert.ok(!r.json.routes.some((x) => /market|mentor|directory/i.test(x)));
  });
});
