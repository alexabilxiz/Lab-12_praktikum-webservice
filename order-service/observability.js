// Pemantauan dasar untuk satu service: ID permintaan, log JSON, /health, /metrics.
// File yang sama disalin ke product-service dan order-service supaya masing-masing
// tetap mandiri saat di-deploy.
const { randomUUID } = require('crypto');

function pasangObservability(app, namaService, opsi = {}) {
  // opsi.dependencies: { namaDependensi: async () => true/false }
  const dependencies = opsi.dependencies || {};
  const mulai = Date.now();
  const stat = { total: 0, per: { '2xx': 0, '4xx': 0, '5xx': 0 }, totalMs: 0 };

  // 1) beri setiap permintaan sebuah id (pakai yang dikirim pemanggil bila ada)
  //    lalu catat satu baris log JSON ketika respons selesai dikirim
  app.use((req, res, next) => {
    if (req.path === '/health' || req.path === '/metrics') return next();
    req.id = req.get('x-request-id') || randomUUID();
    res.set('X-Request-Id', req.id);
    const awal = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - awal) / 1e6;
      const kelas = `${Math.floor(res.statusCode / 100)}xx`;
      stat.total += 1;
      stat.totalMs += ms;
      if (stat.per[kelas] !== undefined) stat.per[kelas] += 1;
      console.log(JSON.stringify({
        waktu: new Date().toISOString(), service: namaService, id: req.id,
        method: req.method, path: req.originalUrl, status: res.statusCode, ms: Math.round(ms),
      }));
    });
    next();
  });

  // 2) health check: "ok" hanya bila semua dependensi juga menjawab
  app.get('/health', async (req, res) => {
    const hasil = {};
    await Promise.all(Object.entries(dependencies).map(async ([nama, cek]) => {
      try { hasil[nama] = (await cek()) ? 'ok' : 'down'; } catch { hasil[nama] = 'down'; }
    }));
    const sehat = Object.values(hasil).every(v => v === 'ok');
    const body = { status: sehat ? 'ok' : 'degraded', service: namaService,
                   uptimeSec: Math.round((Date.now() - mulai) / 1000) };
    if (Object.keys(hasil).length) body.dependencies = hasil;
    res.status(sehat ? 200 : 503).json(body);
  });

  // 3) metrik sederhana (hanya di memori, hilang saat restart)
  app.get('/metrics', (req, res) => res.json({
    service: namaService,
    startedAt: new Date(mulai).toISOString(),
    requests: stat.total,
    byClass: stat.per,
    errors5xx: stat.per['5xx'],
    avgMs: stat.total ? Math.round(stat.totalMs / stat.total) : 0,
  }));
}

module.exports = pasangObservability;
