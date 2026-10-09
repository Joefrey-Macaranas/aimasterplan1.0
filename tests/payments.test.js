// Payment / enrollment commerce tests (demo, no charge).
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, stopServer, api } = require('./helper');

describe('payments', () => {
  let h;
  const suf = Date.now().toString(36);
  before(async () => { h = await startServer(); });
  after(() => stopServer(h));

  it('products + quote + coupon + purchase + billing', async () => {
    const p = await api(h.base, 'GET', '/api/products');
    assert.equal(p.status, 200);
    assert.ok(p.json.products.length >= 3);
    const q = await api(h.base, 'POST', '/api/enroll/quote', { productId: 'lifetime', coupon: 'WELCOME20' });
    assert.equal(q.status, 200);
    assert.ok(q.json.ok && q.json.quote.total < q.json.quote.subtotal);
    const bad = await api(h.base, 'POST', '/api/enroll/quote', { productId: 'lifetime', coupon: 'NOPE' });
    assert.equal(bad.json.ok, false);
    const email = `qa.pay.${suf}@example.com`;
    const buy = await api(h.base, 'POST', '/api/enroll/purchase', { email, productId: 'monthly' });
    assert.equal(buy.status, 200);
    assert.ok(buy.json.invoice.id.startsWith('INV-'));
    const bill = await api(h.base, 'GET', `/api/billing?email=${encodeURIComponent(email)}`);
    assert.equal(bill.status, 200);
    assert.ok(bill.json.purchases.length >= 1);
  });

  it('invalid email rejected', async () => {
    const r = await api(h.base, 'POST', '/api/enroll/purchase', { email: 'bad', productId: 'monthly' });
    assert.equal(r.status, 400);
  });
});
