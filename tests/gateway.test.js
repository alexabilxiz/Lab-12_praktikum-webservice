const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GATEWAY, kirim, ambil } = require('./helper');

test('gateway: GET /health menjawab ok', async () => {
  const res = await ambil(GATEWAY, '/health');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).service, 'gateway');
});

test('gateway: meneruskan /product-service/products ke product-service', async () => {
  const res = await ambil(GATEWAY, '/product-service/products');
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(Array.isArray(list) && list.length > 0);
});

test('gateway: route tak dikenal mengembalikan 404 JSON', async () => {
  const res = await ambil(GATEWAY, '/tidak-ada');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

test('gateway: membuat X-Request-Id bila klien tidak mengirim, dan menghormati yang dikirim', async () => {
  const otomatis = await ambil(GATEWAY, '/product-service/products');
  assert.ok(otomatis.headers.get('x-request-id'));
  const manual = await ambil(GATEWAY, '/product-service/products', { 'X-Request-Id': 'tes-gw-789' });
  assert.equal(manual.headers.get('x-request-id'), 'tes-gw-789');
});

test('gateway: order lewat gateway berhasil dan membawa X-Request-Id', async () => {
  const res = await kirim(GATEWAY, '/order-service/orders', { productId: 2, qty: 1 });
  assert.equal(res.status, 201);
  assert.ok(res.headers.get('x-request-id'));
});
