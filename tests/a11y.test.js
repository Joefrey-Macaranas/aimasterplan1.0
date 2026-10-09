// Accessibility testing — static HTML/contracts.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer } = require('./helper');

describe('a11y', () => {
  let h, html;
  before(async () => {
    h = await startServer();
    html = await (await fetch(h.base + '/')).text();
  });
  after(() => stopServer(h));

  it('lang + title + meta description', async () => {
    assert.ok(html.includes('<html lang="en"'));
    assert.ok(html.includes('<title>AI-MasterPlan</title>'));
    assert.ok(html.includes('name="description"'));
  });

  it('buttons have accessible names + min touch size', async () => {
    const css = await (await fetch(h.base + '/styles.css')).text();
    assert.ok(css.includes('min-height:44px'), 'touch target 44px');
    const btns = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/gs)];
    assert.ok(btns.length > 5);
    for (const [, label] of btns.slice(0, 20)) {
      assert.ok(label.trim().length > 0, 'empty button label');
    }
  });

  it('images have alt path + inputs labeled via placeholder', async () => {
    // app renders images dynamically; static shell must not contain bare <img> without alt
    const bare = [...html.matchAll(/<img(?![^>]*alt=)[^>]*>/g)];
    assert.equal(bare.length, 0);
    assert.ok(html.includes('placeholder='));
  });

  it('nav links are keyboard-focusable anchors', async () => {
    assert.ok(html.includes('<nav'));
    assert.ok(html.includes('href="#/roadmap"'));
  });
});
