// URL tiap komponen; bisa diganti lewat env bila port berbeda
const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:8080';
const PRODUCT = process.env.PRODUCT_URL || 'http://localhost:3000';
const ORDER   = process.env.ORDER_URL   || 'http://localhost:3001';

const kirim = (base, path, body, headers = {}) => fetch(base + path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});
const ambil = (base, path, headers = {}) => fetch(base + path, { headers });

module.exports = { GATEWAY, PRODUCT, ORDER, kirim, ambil };
