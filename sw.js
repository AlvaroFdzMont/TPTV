// TPTV · funciona sin conexión con la última versión guardada.
// Con internet se sirve siempre lo más nuevo; si la red tarda o no hay, la copia guardada.
// Al cambiar archivos, sube el número para forzar la actualización.
const CACHE = 'tptv-v11';
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
  'js/badges.js',
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

/* ---------- Avisos de la peña con la app cerrada ----------
   La app le pasa al service worker lo justo (clave pública del proyecto, usuario y token de refresco) y, en Android con
   la app instalada, el sistema lo despierta de vez en cuando (Periodic Background Sync) para mirar si hay solicitudes
   nuevas. Se guarda en una caché aparte («tptvcfg», que no borra la limpieza de versiones). */
const CFG = 'tptvcfg';
async function cfgGet() { const r = await (await caches.open(CFG)).match('/cfg'); return r ? r.json() : null; }
async function cfgSet(v) { const c = await caches.open(CFG); if (v) await c.put('/cfg', new Response(JSON.stringify(v))); else await c.delete('/cfg'); }
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'pena') e.waitUntil(cfgGet().then((old) => cfgSet(d.s ? { ...d.s, seen: [...new Set([...((old && old.seen) || []), ...(d.s.seen || [])])].slice(-200) } : null)));
});
async function checkPena() {
  const s = await cfgGet();
  if (!s || !s.refresh || !s.apiKey) return;
  const tk = await fetch(`https://securetoken.googleapis.com/v1/token?key=${s.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refresh)}` }).then((r) => r.json()).catch(() => null);
  if (!tk || !tk.id_token) return;
  const q = { structuredQuery: { from: [{ collectionId: 'requests' }], where: { fieldFilter: { field: { fieldPath: 'to' }, op: 'EQUAL', value: { stringValue: s.uid } } }, limit: 20 } };
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${s.projectId}/databases/(default)/documents:runQuery`, { method: 'POST', headers: { Authorization: `Bearer ${tk.id_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(q) }).then((r) => r.json()).catch(() => null);
  if (!Array.isArray(res)) return;
  const reqs = res.filter((x) => x.document).map((x) => ({ from: x.document.fields.from.stringValue, name: (x.document.fields.fromName || {}).stringValue || '' }));
  const seen = s.seen || [];
  const fresh = reqs.filter((r) => !seen.includes(r.from));
  for (const r of fresh) {
    await self.registration.showNotification('Solicitud de amistad', { body: `@${r.name || 'alguien'} quiere unirse a tu peña`, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'req:' + r.from, data: { url: './?avisos=1' } });
  }
  if (fresh.length) await cfgSet({ ...s, refresh: tk.refresh_token || s.refresh, seen: [...seen, ...fresh.map((r) => r.from)].slice(-200) });
  try { if (self.navigator.setAppBadge && reqs.length) await self.navigator.setAppBadge(reqs.length); } catch (err) { /* nada */ }
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'tptv-pena') e.waitUntil(checkPena()); });
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const w of list) { if ('focus' in w) { w.postMessage({ type: 'avisos' }); return w.focus(); } }
    return self.clients.openWindow(url);
  }));
});