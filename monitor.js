// Monitor sederhana: memanggil /health tiap beberapa detik dan memberi tahu saat status berubah.
// Pakai:  node monitor.js            (terus-menerus)
//         node monitor.js --once     (sekali cek; exit code 1 bila ada yang DOWN)
const TARGETS = [
  { name: 'gateway',         url: process.env.GATEWAY_URL || 'http://localhost:8080' },
  { name: 'product-service', url: process.env.PRODUCT_URL || 'http://localhost:3000' },
  { name: 'order-service',   url: process.env.ORDER_URL   || 'http://localhost:3001' },
];
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 3000;
const TIMEOUT_MS = 2000;
const sebelumnya = {};

async function cek(target) {
  const mulai = Date.now();
  try {
    const res = await fetch(`${target.url}/health`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { up: res.ok, ms: Date.now() - mulai };
  } catch {
    return { up: false, ms: Date.now() - mulai };
  }
}

async function putaran() {
  const hasil = await Promise.all(TARGETS.map(cek));
  const jam = new Date().toTimeString().slice(0, 8);
  const ringkas = TARGETS.map((t, i) => `${t.name}=${hasil[i].up ? 'UP' : 'DOWN'}(${hasil[i].ms}ms)`);
  console.log(`${jam}  ${ringkas.join('  ')}`);

  TARGETS.forEach((t, i) => {
    const naik = hasil[i].up;
    if (sebelumnya[t.name] === true && !naik) console.log(`ALERT: ${t.name} DOWN`);
    if (sebelumnya[t.name] === false && naik) console.log(`RECOVERED: ${t.name}`);
    sebelumnya[t.name] = naik;
  });
  return hasil;
}

if (process.argv.includes('--once')) {
  putaran().then(h => process.exit(h.every(x => x.up) ? 0 : 1));
} else {
  putaran();
  setInterval(putaran, INTERVAL_MS);
}
