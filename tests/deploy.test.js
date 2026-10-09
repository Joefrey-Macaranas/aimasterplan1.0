// Production deployment checks — metrics, error beacon, cache, legal/PWA.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

describe('deploy', () => {
  let h, adminTok;
  const em = `qa.dep.${Date.now().toString(36)}@example.com`;
  before(async () => {
    h = await startServer();
    const r = await api(h.base, 'POST', '/api/auth/register', { email: em, password: 'Pass1234' });
    adminTok = r.json.token;
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8'));
    users[em].role = 'admin';
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(users, null, 2));
  });
  after(() => stopServer(h));

  it('metrics requires admin, errors beacon works', async () => {
    assert.equal((await api(h.base, 'GET', '/api/metrics')).status, 401);
    const m = await api(h.base, 'GET', '/api/metrics', null, adminTok);
    assert.equal(m.status, 200);
    assert.ok(m.json.uptimeSec >= 0 && m.json.requests >= 1);
    assert.equal((await api(h.base, 'POST', '/api/errors', { message: 'qa' })).status, 200);
    assert.equal((await api(h.base, 'GET', '/api/errors', null, adminTok)).status, 200);
  });

  it('immutable cache + legal + manifest + CI files', async () => {
    const im = await fetch(h.base + '/styles.css?v=99');
    assert.equal(im.status, 200);
    assert.ok((im.headers.get('cache-control') || '').includes('immutable'));
    for (const p of ['/privacy.html', '/terms.html', '/manifest.json']) {
      assert.equal((await fetch(h.base + p)).status, 200, p);
    }
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'deploy', 'backup.sh')));
    assert.ok(fs.existsSync(path.join(__dirname, '..', '.github', 'workflows', 'ci.yml')));
  });
});
