// Sample roadmap: original 7-day taster path over real lessons.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

const HTML = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const JS = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

describe('sample road', () => {
  let h;
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('endpoint serves 7-day path of real lessons', async () => {
    const r = await api(h.base, 'GET', '/api/sample-road');
    assert.equal(r.status, 200);
    assert.equal(r.json.days.length, 7);
    const cur = await api(h.base, 'GET', '/api/curriculum');
    const valid = new Set();
    cur.json.levels.forEach((lv) => lv.modules.forEach((m) => m.lessons.forEach(([id]) => valid.add(id))));
    let n = 0;
    r.json.days.forEach((d, i) => {
      assert.equal(d.day, i + 1);
      assert.ok(d.theme && d.items.length >= 1);
      d.items.forEach((x) => {
        assert.ok(valid.has(x.lessonId), 'unknown lesson ' + x.lessonId);
        assert.ok(x.title && x.minutes > 0 && x.why);
        n++;
      });
    });
    assert.ok(n >= 7);
  });

  it('section markup + local progress wiring present', async () => {
    for (const id of ['sampleroad', 'sampleRoad', 'sampleFill', 'sampleCount']) {
      assert.ok(HTML().includes(`id="${id}"`), 'missing #' + id);
    }
    assert.ok(JS().includes('paintSampleRoad') && JS().includes('amp-sample-done'));
  });

  it('workspace opens without account (run still guarded by size)', async () => {
    assert.ok(JS().includes('async function openWorkspace'));
    assert.ok(!JS().includes('Sign in + enroll to use the workspace'));
    const anon = await api(h.base, 'POST', '/api/challenges/run', { code: 'console.log(1)' });
    assert.equal(anon.status, 200);
  });
});
