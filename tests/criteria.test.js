// PRIMARY SUCCESS CRITERIA — every outcome maps to real course content.
// A zero-experience student must be able to do each via lessons/projects/APIs.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

// criterion -> anchor lesson(s) with starter content
const MAP = {
  'structure': ['L1M2L4'],
  'communicate-agent': ['L1M1L3'],
  'prompts': ['L1M1L5'],
  'run-modify': ['L2M2L5'],
  'files': ['L1M2L2'],
  'debug': ['L3M2L5'],
  'apis': ['L4M1L4'],
  'databases': ['L5M1L1'],
  'auth': ['L5M2L1'],
  'integrate-ai': ['L6M1L1'],
  'automations': ['L7M1L1'],
  'agents': ['L8M1L1'],
  'web': ['L3M1L1'],
  'mobile': ['L9M1L3'],
  'test': ['L9M2L6'],
  'deploy': ['L10M2L5'],
  'idea-to-plan': ['L10M1L1'],
  'mvp': ['L10M2L7'],
};

describe('success criteria', () => {
  let h, tok;
  const suf = Date.now().toString(36);
  const em = `qa.crit.${suf}@example.com`;
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

  it('every criterion has a readable lesson with tutorial + copyable', async () => {
    for (const [crit, ids] of Object.entries(MAP)) {
      const id = ids[0];
      const r = await api(h.base, 'GET', `/api/curriculum/lesson/${id}`, null, tok);
      assert.equal(r.status, 200, crit + ' ' + id);
      const blocks = r.json.lesson.blocks;
      const kinds = new Set(blocks.map((b) => b.type));
      assert.ok(blocks.length >= 3, crit + ' needs >=3 blocks');
      assert.ok(kinds.has('text') || kinds.has('heading'), crit + ' needs tutorial text');
      assert.ok(kinds.has('prompt') || kinds.has('code') || kinds.has('terminal'), crit + ' needs copyable');
    }
  });

  it('debug flow: ask tutor answers errors', async () => {
    const r = await api(h.base, 'GET', '/api/ask?q=' + encodeURIComponent('Why am I getting this error?') + '&lesson=L3M2L5');
    assert.equal(r.status, 200);
    assert.ok(r.json.answer.length > 20);
  });

  it('idea-to-plan: planner converts idea to todos', async () => {
    const r = await api(h.base, 'GET', '/api/plan?idea=' + encodeURIComponent('An app that tracks my plants and reminds me to water them'));
    assert.equal(r.status, 200);
    assert.ok(r.json.todos.length >= 5);
    assert.ok(r.json.architecture.length > 10);
  });

  it('projects exist for web/mobile/ai/automation/agent/saas/mvp', async () => {
    const r = await api(h.base, 'GET', '/api/projects');
    const titles = r.json.projects.map((p) => p.title).join('|');
    for (const need of ['Website', 'Mobile', 'CRUD', 'AI Chat', 'Automation', 'Agent', 'SaaS']) {
      assert.ok(titles.includes(need), 'missing project ' + need);
    }
  });

  it('onboarding routes a zero-experience student to L1', async () => {
    const r = await api(h.base, 'GET', '/api/onboard?coded=never&ai=never&goal=website');
    assert.equal(r.json.startLessonId, 'L1M1L1');
  });
});
