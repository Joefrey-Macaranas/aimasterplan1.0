// Challenge workspace emulation (freeCodeCamp usage loop): static wiring + API.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

const HTML = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const JS = () => fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');

describe('workspace', () => {
  let h, tok;
  const em = `qa.ws.${Date.now().toString(36)}@example.com`;
  before(async () => {
    h = await startServer();
    const r = await api(h.base, 'POST', '/api/auth/register', { email: em, password: 'Pass1234' });
    tok = r.json.token;
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8'));
    users[em].enrollmentStatus = 'active';
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(users, null, 2));
  });
  after(() => stopServer(h));

  it('workspace markup: 3 panes + run/submit/reset/prev-next', async () => {
    for (const id of ['wsView', 'wsInstr', 'wsEditor', 'wsRunBtn', 'wsResetBtn', 'wsSubmitBtn', 'wsConsole', 'wsTests', 'wsPrevBtn', 'wsNextBtn', 'wsCrumb', 'lessonWorkspaceBtn']) {
      assert.ok(HTML().includes(`id="${id}"`), 'missing #' + id);
    }
  });

  it('workspace engine functions present', async () => {
    for (const fn of ['openWorkspace', 'wsRun', 'wsSubmit', 'closeWorkspace', 'paintWsTests', 'flatLessonIds']) {
      assert.ok(JS().includes('function ' + fn), 'missing ' + fn);
    }
    assert.ok(JS().includes('metaKey') && HTML().includes('Ctrl+Enter'));
  });

  it('lesson payload carries everything workspace needs', async () => {
    const r = await api(h.base, 'GET', '/api/curriculum/lesson/L4M1L4', null, tok);
    assert.equal(r.status, 200);
    const l = r.json.lesson;
    assert.ok(l.levelId && l.moduleId && Array.isArray(l.blocks));
    assert.ok(l.blocks.some((b) => b.type === 'code'), 'needs starter code');
  });

  it('submit-gating inputs exist server-side (progress + quizzes)', async () => {
    const w = await api(h.base, 'POST', '/api/lesson-progress', { lessonId: 'L4M1L4', completed: true }, tok);
    assert.equal(w.status, 200);
    const q = await api(h.base, 'POST', '/api/quizzes', { lessonId: 'L4M1L4', question: 'WS?', options: ['a', 'b'], answer: 0 }, tok);
    assert.ok([200, 403].includes(q.status));
  });
});
