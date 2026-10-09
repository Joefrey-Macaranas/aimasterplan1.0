// freeCodeCamp-style challenge runner + gated certificate claims.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('challenges + claims', () => {
  let h, tok;
  const em = `qa.ch.${Date.now().toString(36)}@example.com`;
  before(async () => {
    h = await startServer();
    const r = await api(h.base, 'POST', '/api/auth/register', { email: em, password: 'Pass1234' });
    tok = r.json.token;
    const fs = require('node:fs');
    const path = require('node:path');
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8'));
    users[em].enrollmentStatus = 'active';
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(users, null, 2));
  });
  after(() => stopServer(h));

  it('runs JS and captures output', async () => {
    const r = await api(h.base, 'POST', '/api/challenges/run', { code: "console.log('hi'); console.log(1+1);" }, tok);
    assert.equal(r.status, 200);
    assert.equal(r.json.passed, true);
    assert.ok(r.json.output.includes('hi') && r.json.output.includes('2'));
  });

  it('syntax errors + checks reported, not crashed', async () => {
    const bad = await api(h.base, 'POST', '/api/challenges/run', { code: 'this is not js(((' }, tok);
    assert.equal(bad.status, 200);
    assert.ok(bad.json.error);
    const chk = await api(h.base, 'POST', '/api/challenges/run', { code: "console.log('nope')", checks: [{ contains: 'hello' }] }, tok);
    assert.equal(chk.json.passed, false);
    assert.equal(chk.json.checks[0].pass, false);
  });

  it('sandbox blocks process/require + kills loops', async () => {
    const evil = await api(h.base, 'POST', '/api/challenges/run', { code: 'console.log(typeof process); console.log(typeof require);' }, tok);
    assert.ok(evil.json.output.includes('undefined'));
    const loop = await api(h.base, 'POST', '/api/challenges/run', { code: 'while(true){}' }, tok);
    assert.ok(loop.json.error, 'infinite loop must time out');
  });

  it('anonymous demo runs tiny snippets; authed validation holds', async () => {
    const tiny = await api(h.base, 'POST', '/api/challenges/run', { code: 'x' });
    assert.equal(tiny.status, 200);
    assert.equal((await api(h.base, 'POST', '/api/challenges/run', { code: '' }, tok)).status, 400);
  });

  it('claim gated until module done, then issues', async () => {
    const early = await api(h.base, 'POST', '/api/certificates/claim', { kind: 'module', refId: 'L1M2' }, tok);
    assert.equal(early.status, 402);
    assert.ok(early.json.missingCount > 0);
    // finish L1M2 (5 lessons)
    for (const id of ['L1M2L1', 'L1M2L2', 'L1M2L3', 'L1M2L4', 'L1M2L5']) {
      assert.equal((await api(h.base, 'POST', '/api/lesson-progress', { lessonId: id, completed: true }, tok)).status, 200);
    }
    const claim = await api(h.base, 'POST', '/api/certificates/claim', { kind: 'module', refId: 'L1M2' }, tok);
    assert.equal(claim.status, 200);
    assert.ok(claim.json.certificate.certId.startsWith('AMP-'));
  });
});
