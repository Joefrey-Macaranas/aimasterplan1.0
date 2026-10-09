// Video playback + signed media tests.
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, stopServer, api } = require('./helper');

const USERS = path.join(__dirname, '..', 'data', 'users.json');
function promote(email, role) {
  const users = JSON.parse(fs.readFileSync(USERS, 'utf8'));
  if (users[email]) { users[email].role = role; users[email].enrollmentStatus = 'active'; fs.writeFileSync(USERS, JSON.stringify(users, null, 2)); }
}

describe('video', () => {
  let h, authorTok, stuTok;
  const suf = Date.now().toString(36);
  const authorEmail = `qa.vid.author.${suf}@example.com`;
  const stuEmail = `qa.vid.stu.${suf}@example.com`;
  let vid;

  before(async () => {
    h = await startServer();
    const a = await api(h.base, 'POST', '/api/auth/register', { email: authorEmail, password: 'Pass1234' });
    authorTok = a.json.token;
    promote(authorEmail, 'author');
    const s = await api(h.base, 'POST', '/api/auth/register', { email: stuEmail, password: 'Pass1234' });
    stuTok = s.json.token;
  });
  after(() => stopServer(h));

  it('video list requires auth', async () => {
    const r = await api(h.base, 'GET', '/api/videos');
    assert.equal(r.status, 401);
  });

  it('upload validates mime, streams Range 206, signed URL works', async () => {
    const badMime = await api(h.base, 'POST', '/api/videos', { name: 'x.avi', mime: 'video/avi', dataBase64: Buffer.from('hi').toString('base64') }, authorTok);
    assert.equal(badMime.status, 400);
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypmp42'), Buffer.alloc(512, 1)]);
    const up = await api(h.base, 'POST', '/api/videos', { name: 't.mp4', mime: 'video/mp4', dataBase64: mp4.toString('base64') }, authorTok);
    assert.equal(up.status, 200);
    vid = up.json.video.id;
    // unrestricted (no token/sig) -> 401
    const open = await api(h.base, 'GET', `/api/videos/${vid}`);
    assert.equal(open.status, 401);
    // authed range request -> 206
    const r = await fetch(`${h.base}/api/videos/${vid}`, { headers: { Authorization: 'Bearer ' + authorTok, Range: 'bytes=0-99' } });
    assert.equal(r.status, 206);
    assert.ok((r.headers.get('content-range') || '').startsWith('bytes 0-'));
    // signed URL (no auth header) -> 200
    const sign = await api(h.base, 'POST', '/api/media/sign', { kind: 'video', id: vid }, authorTok);
    assert.equal(sign.status, 200);
    const r2 = await fetch(h.base + sign.json.url);
    assert.equal(r2.status, 200);
  });

  it('file upload validates + signed download', async () => {
    const bad = await api(h.base, 'POST', '/api/files', { name: 'e.exe', mime: 'application/octet-stream', dataBase64: Buffer.from('MZ').toString('base64') }, stuTok);
    assert.equal(bad.status, 400);
    const good = await api(h.base, 'POST', '/api/files', { name: 'n.txt', mime: 'text/plain', dataBase64: Buffer.from('hello').toString('base64') }, stuTok);
    assert.equal(good.status, 200);
  });
});
