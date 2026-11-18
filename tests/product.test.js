const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCT, kirim, ambil } = require('./helper');

test('product: GET /health menjawab 200 dengan status ok', async () => {
  const res = await ambil(PRODUCT, '/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'product-service');
});

test('product: GET /products/1 (sukses) mengembalikan produk lengkap', async () => {
  const res = await ambil(PRODUCT, '/products/1');
  assert.equal(res.status, 200);
  const p = await res.json();
  assert.equal(p.id, 1);
  assert.equal(typeof p.name, 'string');
  assert.equal(typeof p.price, 'number');
  assert.equal(typeof p.stock, 'number');
});

test('product: GET /products/9999 (error) mengembalikan 404 + pesan error', async () => {
  const res = await ambil(PRODUCT, '/products/9999');
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

test('product: reserve stok melebihi persediaan mengembalikan 409', async () => {
  const res = await kirim(PRODUCT, '/products/3/reserve', { qty: 100000 });
  assert.equal(res.status, 409);
});

test('product: reserve (efek samping) mengurangi stok tepat sebesar qty', async () => {
  const sebelum = await (await ambil(PRODUCT, '/products/2')).json();
  const res = await kirim(PRODUCT, '/products/2/reserve', { qty: 2 });
  assert.equal(res.status, 200);
  const sesudah = await (await ambil(PRODUCT, '/products/2')).json();
  assert.equal(sesudah.stock, sebelum.stock - 2);
});

test('product: respons memuat header X-Request-Id dan /metrics bisa dibaca', async () => {
  const res = await ambil(PRODUCT, '/products', { 'X-Request-Id': 'tes-product-123' });
  assert.equal(res.headers.get('x-request-id'), 'tes-product-123');
  const m = await (await ambil(PRODUCT, '/metrics')).json();
  assert.ok(m.requests >= 1);
  assert.equal(typeof m.avgMs, 'number');
});
