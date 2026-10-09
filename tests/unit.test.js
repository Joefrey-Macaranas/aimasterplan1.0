// Unit tests — pure helpers from server.js (no network).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const srv = require('../server.js');

describe('unit: validators + hashing + media', () => {
  it('norm/emailOk', () => {
    assert.equal(srv.norm('  A@B.com '), 'a@b.com');
    assert.ok(srv.emailOk('a@b.co'));
    assert.ok(!srv.emailOk('bad'));
  });
  it('passwordPolicy', () => {
    assert.ok(srv.passwordPolicy('short'));
    assert.ok(srv.passwordPolicy('password'));
    assert.equal(srv.passwordPolicy('Pass1234'), null);
  });
  it('scrypt hash + verify + legacy migrate', () => {
    const h = srv.hashPassword('Pass1234');
    assert.ok(h.startsWith('scrypt$'));
    assert.ok(srv.verifyPassword(h, 'x@y.co', 'Pass1234'));
    assert.ok(!srv.verifyPassword(h, 'x@y.co', 'Wrong1234'));
    const legacy = srv.devHash('x@y.co:Pass1234');
    assert.ok(srv.verifyPassword(legacy, 'x@y.co', 'Pass1234'));
  });
  it('vStr/vUrl/vEnum', () => {
    assert.ok(srv.vStr('a'.repeat(600), 500, 'f').err);
    assert.ok(srv.vUrl('javascript:alert(1)', 'u').err);
    assert.equal(srv.vUrl('https://example.com/x', 'u').val, 'https://example.com/x');
    assert.ok(srv.vEnum('x', ['a', 'b'], 'f').err);
    assert.equal(srv.vEnum('a', ['a', 'b']).val, 'a');
  });
  it('fileCheck whitelist + magic', () => {
    assert.ok(srv.fileCheck('application/octet-stream', Buffer.from('hi'), 'a.bin'));
    assert.ok(srv.fileCheck('text/plain', Buffer.from('hi'), 'evil.exe'));
    assert.ok(srv.fileCheck('image/png', Buffer.from('notpng'), 'a.png'));
    assert.equal(srv.fileCheck('text/plain', Buffer.from('hi'), 'ok.txt'), null);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.from('rest')]);
    assert.equal(srv.fileCheck('image/png', png, 'a.png'), null);
  });
  it('signed media round-trip + expiry', () => {
    const exp = String(Date.now() + 60000);
    const sig = srv.signMedia('video', 'vid-1', exp);
    assert.ok(srv.verifyMedia('video', 'vid-1', exp, sig));
    assert.ok(!srv.verifyMedia('video', 'vid-1', exp, sig + 'x'));
    assert.ok(!srv.verifyMedia('video', 'vid-1', String(Date.now() - 1000), sig));
  });
  it('streak helper', () => {
    const today = new Date().toISOString();
    const y = new Date(Date.now() - 864e5).toISOString();
    assert.equal(srv.streakFromDates([]), 0);
    assert.equal(srv.streakFromDates([today]), 1);
    assert.ok(srv.streakFromDates([today, y]) >= 2);
  });
  it('paginate', () => {
    const pg = srv.paginate([1, 2, 3, 4], { searchParams: new URLSearchParams('limit=2&offset=1') });
    assert.deepEqual(pg.items, [2, 3]);
    assert.equal(pg.total, 4);
  });
});
