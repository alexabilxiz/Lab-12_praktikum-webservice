const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PRODUCT, ORDER, kirim, ambil } = require('./helper');

test('order: GET /health ok dan melaporkan status product-service', async () => {
  const res = await ambil(ORDER, '/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.dependencies['product-service'], 'ok');
});

test('order: POST /orders (sukses) membuat pesanan 201 dengan total benar', async () => {
  const produk = await (await ambil(PRODUCT, '/products/2')).json();
  const res = await kirim(ORDER, '/orders', { productId: 2, qty: 2 });
  assert.equal(res.status, 201);
  const o = await res.json();
  assert.equal(o.productId, 2);
  assert.equal(o.qty, 2);
  assert.equal(o.total, produk.price * 2);
});

test('order: input tidak valid mengembalikan 400', async () => {
  assert.equal((await kirim(ORDER, '/orders', { productId: 1, qty: 0 })).status, 400);
  assert.equal((await kirim(ORDER, '/orders', { productId: 1, qty: 'abc' })).status, 400);
  assert.equal((await kirim(ORDER, '/orders', {})).status, 400);
});

test('order: produk tak dikenal -> 404, stok kurang -> 409 (diteruskan dari product-service)', async () => {
  assert.equal((await kirim(ORDER, '/orders', { productId: 9999, qty: 1 })).status, 404);
  assert.equal((await kirim(ORDER, '/orders', { productId: 3, qty: 100000 })).status, 409);
});

// Produk 3 khusus dipakai test order untuk membandingkan stok (lihat catatan di product.test.js)
test('order: pesanan sukses mengurangi stok dan muncul di GET /orders', async () => {
  const sebelum = await (await ambil(PRODUCT, '/products/3')).json();
  const buat = await kirim(ORDER, '/orders', { productId: 3, qty: 1 });
  assert.equal(buat.status, 201);
  const o = await buat.json();
  const sesudah = await (await ambil(PRODUCT, '/products/3')).json();
  assert.equal(sesudah.stock, sebelum.stock - 1);
  const daftar = await (await ambil(ORDER, '/orders')).json();
  assert.ok(daftar.some(x => x.id === o.id));
});

test('order: pesanan gagal (409) tidak mengurangi stok maupun tercatat sebagai order', async () => {
  const stokAwal = (await (await ambil(PRODUCT, '/products/3')).json()).stock;
  const qtyBerlebih = stokAwal + 7777;   // angka unik agar tidak tertukar dengan order lain
  assert.equal((await kirim(ORDER, '/orders', { productId: 3, qty: qtyBerlebih })).status, 409);
  assert.equal((await (await ambil(PRODUCT, '/products/3')).json()).stock, stokAwal);
  const daftar = await (await ambil(ORDER, '/orders')).json();
  assert.ok(!daftar.some(o => o.productId === 3 && o.qty === qtyBerlebih));
});

test('order: ID permintaan dari pemanggil dikembalikan di header respons', async () => {
  const res = await kirim(ORDER, '/orders', { productId: 2, qty: 1 }, { 'X-Request-Id': 'tes-order-456' });
  assert.equal(res.headers.get('x-request-id'), 'tes-order-456');
});