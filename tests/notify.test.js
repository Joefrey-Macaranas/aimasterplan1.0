// Notification service tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

describe('notifications', () => {
  let h, staffTok, stuTok, stuEmail;
  const suf = Date.now().toString(36);

  before(async () => {
    h = await startServer();
    const a = await api(h.base, 'POST', '/api/auth/register', { email: `qa.nt.staff.${suf}@example.com`, password: 'Pass1234' });
    staffTok = a.json.token;
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8'));
    users[`qa.nt.staff.${suf}@example.com`].role = 'author';
    users[`qa.nt.staff.${suf}@example.com`].enrollmentStatus = 'active';
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(users, null, 2));
    stuEmail = `qa.nt.stu.${suf}@example.com`;
    const s = await api(h.base, 'POST', '/api/auth/register', { email: stuEmail, password: 'Pass1234' });
    stuTok = s.json.token;
  });
  after(() => stopServer(h));

  it('subscribe + send + inbox + read', async () => {
    const sub = await api(h.base, 'POST', '/api/notify/subscribe', { email: stuEmail, endpoint: 'inapp-qa' });
    assert.equal(sub.status, 200);
    const send = await api(h.base, 'POST', '/api/notify/send', { title: 'QA Hi', body: 'hello', email: stuEmail }, staffTok);
    assert.equal(send.status, 200);
    const inbox = await api(h.base, 'GET', `/api/notify/inbox?email=${encodeURIComponent(stuEmail)}`);
    assert.equal(inbox.status, 200);
    assert.ok(inbox.json.total >= 1);
    const id = inbox.json.items[0].id;
    const read = await api(h.base, 'POST', '/api/notify/read', { id }, stuTok);
    assert.equal(read.status, 200);
  });

  it('student cannot broadcast', async () => {
    const r = await api(h.base, 'POST', '/api/notify/send', { title: 'x', body: 'y' }, stuTok);
    assert.equal(r.status, 403);
  });
});
