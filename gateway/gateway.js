const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const { randomUUID } = require('crypto');

const app = express();
app.set('trust proxy', 1); // diperlukan saat di-deploy di balik proxy (mis. Render)

// ID permintaan dibuat di sini (pintu masuk) dan ikut diteruskan oleh proxy ke service
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
  res.set('X-Request-Id', req.headers['x-request-id']);
  next();
});

// health check gateway: sengaja sebelum rate limit dan proxy
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'gateway' }));

// rate limit: default 20 request per 10 detik per IP; bisa diubah lewat env (mis. untuk CI)
app.use(rateLimit({
  windowMs: 10 * 1000,
  limit: Number(process.env.RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
}));

// routing: /product-service/* diteruskan ke product-service (lokal, port 3000)
app.use(createProxyMiddleware({
  pathFilter: '/product-service',
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: { '^/product-service': '' },
}));

// routing: /order-service/* diteruskan ke order-service (lokal, port 3001)
app.use(createProxyMiddleware({
  pathFilter: '/order-service',
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/order-service': '' },
}));

app.use((req, res) => res.status(404).json({ error: 'Route tidak ditemukan' }));

app.listen(process.env.PORT || 8080, () => console.log('Gateway berjalan'));