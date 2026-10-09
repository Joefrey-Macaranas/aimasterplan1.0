// Meeting API tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

describe('meetings', () => {
  let h, staffTok, stuTok, stuEmail;
  const suf = Date.now().toString(36);
  let mid;

  before(async () => {
    h = await startServer();
    const a = await api(h.base, 'POST', '/api/auth/register', { email: `qa.mt.staff.${suf}@example.com`, password: 'Pass1234' });
    staffTok = a.json.token;
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'users.json'), 'utf8'));
    users[`qa.mt.staff.${suf}@example.com`].role = 'instructor';
    users[`qa.mt.staff.${suf}@example.com`].enrollmentStatus = 'active';
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'users.json'), JSON.stringify(users, null, 2));
    stuEmail = `qa.mt.stu.${suf}@example.com`;
    const s = await api(h.base, 'POST', '/api/auth/register', { email: stuEmail, password: 'Pass1234' });
    stuTok = s.json.token;
  });
  after(() => stopServer(h));

  it('create validates URL + recurring', async () => {
    const bad = await api(h.base, 'POST', '/api/cms/meetings', { title: 'x', url: 'javascript:alert(1)' }, staffTok);
    assert.equal(bad.status, 400);
    const good = await api(h.base, 'POST', '/api/cms/meetings', { title: 'QA Meet', url: 'https://meet.example.com/x', recurring: 'weekly', duration: 60 }, staffTok);
    assert.equal(good.status, 200);
    mid = good.json.meeting.id;
  });

  it('announce + attendance + recording', async () => {
    const an = await api(h.base, 'POST', `/api/cms/meetings/${mid}/announce`, { message: 'hello' }, staffTok);
    assert.equal(an.status, 200);
    const at = await api(h.base, 'POST', `/api/cms/meetings/${mid}/attend`, { email: stuEmail }, staffTok);
    assert.equal(at.status, 200);
    const rec = await api(h.base, 'PUT', `/api/cms/meetings/${mid}`, { recordingUrl: 'https://cdn.example.com/r.mp4' }, staffTok);
    assert.equal(rec.status, 200);
    assert.ok(rec.json.meeting.recordingUrl.includes('cdn.example.com'));
  });

  it('student cannot create meeting', async () => {
    const r = await api(h.base, 'POST', '/api/cms/meetings', { title: 'nope' }, stuTok);
    assert.equal(r.status, 403);
  });
});
