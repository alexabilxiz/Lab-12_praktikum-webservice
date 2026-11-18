![CI](https://github.com/alexabilxiz/Lab-12_praktikum-webservice/actions/workflows/ci.yml/badge.svg?branch=main)

# Toko Microservices (Lab 12: Automated Testing & Monitoring)

Komponen: `gateway` (:8080) -> `product-service` (:3000) dan `order-service` (:3001).

## Menjalankan
```bash
npm ci --prefix product-service && npm ci --prefix order-service && npm ci --prefix gateway
node product-service/product-service.js &
node order-service/order-service.js &
RATE_LIMIT=1000 node gateway/gateway.js &
npm test            # 18 test otomatis
node monitor.js     # pantau /health tiap 3 detik (ALERT / RECOVERED)
```

## Endpoint tambahan
- `GET /health` di ketiga komponen. Di `order-service`, health ikut memeriksa `product-service` (503 bila down).
- `GET /metrics` di `product-service` dan `order-service`.
- Log JSON per permintaan dengan `id` yang sama lintas service (header `X-Request-Id`).

## Catatan
- Data hanya di memori: bila stok habis setelah banyak `npm test`, restart service.
- `RATE_LIMIT` (default 20 per 10 detik) bisa dilonggarkan lewat env.
