// TPTV · funciona sin conexión con la última versión guardada.
// Con internet se sirve siempre lo más nuevo; si la red tarda o no hay, la copia guardada.
// Al cambiar archivos, sube el número para forzar la actualización.
const CACHE = 'tptv-v7';
const TILES = 'tptv-mapa';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'js/config.js',
  'js/spots.js',
  'js/visual.js',
  'js/data.js',
  'js/photos.js',
  'js/glyphs.js',
  'js/astro.js',
  'js/pena.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];
const NET_WAIT = 3500;
const MAX_TILES = 500;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tptv-') && k !== CACHE && k !== TILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Teselas del mapa: primero la copia (no cambian), si no la red
  if (url.hostname === 'server.arcgisonline.com' || url.hostname === 'tile.openstreetmap.org' || url.hostname === 'upload.wikimedia.org') {
    e.respondWith((async () => {
      const c = await caches.open(TILES);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trimTiles(); }
      return res;
    })());
    return;
  }

  // Las previsiones (Open-Meteo) las guarda la propia app: aquí no se tocan
  if (url.origin !== location.origin) return;

  const key = req.mode === 'navigate' ? 'index.html' : req;
  const network = fetch(req, { cache: 'no-cache' });
  e.waitUntil(network.then(async (res) => { if (res.ok) await (await caches.open(CACHE)).put(key, res.clone()); }).catch(() => {}));
  e.respondWith((async () => {
    const timeout = new Promise((r) => setTimeout(r, NET_WAIT));
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res.clone();
    } catch (err) { /* sin conexión */ }
    const cached = await (await caches.open(CACHE)).match(key, { ignoreSearch: true });
    return cached || network.then((r) => r.clone());
  })());
});
