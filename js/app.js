/* TPTV · Te pesco TV — app de pesca recreativa del Campo de Gibraltar y Tarifa.
   Vanilla JS, sin dependencias. Datos de tiempo y mar: Open-Meteo (gratis, sin clave). Todo lo tuyo se guarda en el móvil. */
(() => {
'use strict';
const D = window.TPTV;
const VERSION = '1.0.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n) => String(n).padStart(2, '0');
const TZ = 'Europe/Madrid';
const nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
const n1 = (v) => (v == null || isNaN(v) ? '—' : nf1.format(v));
const n2 = (v) => (v == null || isNaN(v) ? '—' : nf2.format(v));
const n0 = (v) => (v == null || isNaN(v) ? '—' : nf0.format(v));
const th = (ctx, v) => n2(Math.max(0, v - ctx.base)) + ' m'; // altura sobre la bajamar más baja de la semana
const haptic = () => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(8); } catch (e) { /* nada */ } };
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const darkMQ = matchMedia('(prefers-color-scheme: dark)');

/* ---------------- Iconos (trazo, estilo SF Symbols) ---------------- */
const IC = {
  today: '<path class="f" d="M5 15.5a7 7 0 0 1 14 0z"/><path d="M2 19.5h20M5 15.5a7 7 0 0 1 14 0M12 3.5v3M4.6 8.1l1.8 1.8M19.4 8.1l-1.8 1.8"/>',
  tide: '<path d="M2 8c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 13c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 18c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  pin: '<path class="f" d="M12 21.5s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9.5" r="2.6"/>',
  fish: '<path class="f" d="M2.5 12c2.8-4.6 8.6-6 13-2.6L20.5 6v12l-5-3.4C11.1 18 5.3 16.6 2.5 12z"/><circle cx="7.4" cy="11" r=".6" fill="currentColor"/>',
  book: '<path class="f" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3M9 7h6M9 10.5h4"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  chev: '<path d="M1.5 1.5 6.5 6.5 1.5 11.5"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>',
  loc: '<path d="M20.5 3.5 3.5 10.6l7.2 2.7 2.7 7.2z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>',
  wave: '<path d="M2 16c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6M3 11.5C5 5 12 3.5 15.5 7c-3.2-.5-5 1.8-4 4.5"/>',
  temp: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  gauge: '<path d="M4.5 18a9 9 0 1 1 15 0"/><path d="M12 13l4-4"/><circle cx="12" cy="13" r="1.3"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  sunrise: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 3v6M9 6l3-3 3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  warn: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.3v.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  ruler: '<path d="M3 15 15 3l6 6L9 21z"/><path d="M7 11l2 2M10 8l2 2M13 5l2 2"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  nav: '<path d="M12 2.5 4.5 20.5 12 16.8l7.5 3.7z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  bag: '<path d="M6 8.5a6 6 0 0 1 12 0V20H6z"/><path d="M9.5 3.5h5M9 13h6v4H9z"/>',
  download: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  upload: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 20h14"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  hook: '<path d="M15 3v10.5a5 5 0 0 1-10 0V11l3 2.2"/><circle cx="15" cy="3" r="1.2"/>',
  phone: '<path d="M7 3h10v18H7zM11 18h2"/>',
  current: '<path d="M3 12h14M13 7l5 5-5 5"/>',
  beach: '<path d="M3 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5"/><path d="M12 16.5V7"/><path d="M4 9.5a8.2 8.2 0 0 1 16 0z"/>',
  rock: '<path d="M2.5 19.5 7 11l3 3.5 3.5-7.5 8 12z"/><path d="M7 11l1.5 4"/>',
  pier: '<path d="M3 8.5h18M6 8.5V20M12 8.5V20M18 8.5V20M3 15c1.5 0 1.5 1 3 1s1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M4.5 13a7.5 7.5 0 0 0 15 0M8 10.5h8"/>',
  leaf: '<path d="M5 19.5c0-8.5 5.5-14 14.5-14.5-.5 9-6 14.5-14.5 14.5z"/><path d="M5 19.5l8.5-8.5"/>',
  dex: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M3.5 12h5.5M15 12h5.5"/><circle cx="12" cy="12" r="3"/>',
  layers: '<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const chev = `<span class="chev"><svg viewBox="0 0 8 13" class="ic">${IC.chev}</svg></span>`;
const arrowSVG = (deg, size = 11) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="transform:rotate(${deg}deg)"><path d="M12 2l6.5 18-6.5-4-6.5 4z" fill="currentColor"/></svg>`;

/* ---------------- Fechas (siempre hora de Madrid) ---------------- */
const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function mParts(d = new Date()) {
  const p = {};
  for (const x of dtf.formatToParts(d)) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute };
}
const localKey = (d = new Date()) => { const p = mParts(d); return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:00`; };
const dayKey = (d = new Date()) => { const p = mParts(d); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
function tzOff(d) { const p = mParts(d); return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(d.getTime() / 60000) * 60000) / 60000; }
function fromLocal(s) {
  const [a, b = '00:00'] = s.split('T');
  const [y, m, d] = a.split('-').map(Number);
  const [h, mi] = b.split(':').map(Number);
  const base = Date.UTC(y, m - 1, d, h, mi);
  let t = base - tzOff(new Date(base)) * 60000;
  const o2 = tzOff(new Date(t));
  t = base - o2 * 60000;
  return new Date(t);
}
const hmFmt = new Intl.DateTimeFormat('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const fmtHM = (d) => (d ? hmFmt.format(d) : '—');
const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WDL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESL = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function dayInfo(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const wdI = dt.getUTCDay();
  const today = dayKey();
  const tomorrow = dayKey(new Date(Date.now() + 864e5));
  return { y, m, d, wd: WD[wdI], wdl: WDL[wdI], mes: MES[m - 1], mesl: MESL[m - 1], rel: key === today ? 'Hoy' : key === tomorrow ? 'Mañana' : null };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function agoText(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora mismo';
  if (m < 60) return `hace ${m} min`;
  return `a las ${fmtHM(new Date(t))}`;
}

/* ---------------- Almacenamiento ---------------- */
const LS = {
  get(k, def) { try { const v = localStorage.getItem('tptv.' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('tptv.' + k, JSON.stringify(v)); return true; } catch (e) { toast('El móvil no tiene más espacio para guardar'); return false; } },
  del(k) { try { localStorage.removeItem('tptv.' + k); } catch (e) { /* nada */ } },
};
const S = Object.assign({ spot: null, favs: [], colegas: [], yo: 'Yo', installHidden: 0 }, LS.get('settings', {}));
if (!D.spots.some((s) => s.id === S.spot)) S.spot = (D.spots.find((s) => s.id === D.defaultSpot) || D.spots[0]).id;
const saveS = () => LS.set('settings', S);
let catches = LS.get('catches', []);
const saveC = () => LS.set('catches', catches);

const idb = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('tptv', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('photos', mode);
      const req = fn(t.objectStore('photos'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    put: (k, v) => run('readwrite', (s) => s.put(v, k)),
    get: (k) => run('readonly', (s) => s.get(k)),
    del: (k) => run('readwrite', (s) => s.delete(k)),
    clear: () => run('readwrite', (s) => s.clear()),
  };
})();
const photoURLs = new Map();
async function photoURL(id) {
  if (photoURLs.has(id)) return photoURLs.get(id);
  try {
    const b = await idb.get(id);
    if (!b) return null;
    const u = URL.createObjectURL(b);
    photoURLs.set(id, u);
    return u;
  } catch (e) { return null; }
}
async function fillPhotos(root) {
  for (const el of $$('[data-photo]', root)) {
    const u = await photoURL(el.dataset.photo);
    if (u) el.innerHTML = `<img src="${u}" alt="">`;
  }
}

/* ---------------- Utilidades de datos ---------------- */
const spotById = (id) => D.spots.find((s) => s.id === id) || D.spots[0];
const fishById = (id) => D.species.find((f) => f.id === id);
const region = (sp) => (sp && sp.lon < D.limiteMarroqui ? 'atl' : 'med');
const tallaFor = (f, sp) => (f ? (region(sp) === 'atl' ? f.tallaAtl : f.tallaMed) : null); // talla legal en ese caladero
const tallaRec = (f, sp) => (f ? (region(sp) === 'atl' ? f.tallaMed : f.tallaAtl) : null); // la del otro caladero, como referencia
const TIPOS = {
  playa: { n: 'Playa', i: 'beach', c: '#FF9F0A' },
  roca: { n: 'Rocas', i: 'rock', c: '#8E8E93' },
  espigon: { n: 'Espigón', i: 'pier', c: '#5E5CE6' },
  puerto: { n: 'Puerto', i: 'anchor', c: '#0A84FF' },
  estuario: { n: 'Río / estuario', i: 'leaf', c: '#30B158' },
};
const tipoIc = (sp, cls = '') => ic(tipoOf(sp).i, cls);
const tipoOf = (sp) => TIPOS[sp.tipo] || TIPOS.playa;
function haversine(a, b, c, d) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const SECT = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const sect = (deg) => SECT[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
function windName(dir) {
  // En el Estrecho el viento se encajona: casi todo lo que tiene componente este es Levante y lo de oeste, Poniente
  const t = windType(dir);
  if (t) return t === 'levante' ? 'Levante' : 'Poniente';
  const names = ['Norte', 'Nordeste', 'Levante', 'Sureste', 'Sur', 'Suroeste', 'Poniente', 'Noroeste'];
  return names[Math.round(((dir % 360) + 360) % 360 / 45) % 8];
}
function windType(dir) {
  const d = ((dir % 360) + 360) % 360;
  if (d >= 40 && d <= 140) return 'levante';
  if (d >= 220 && d <= 320) return 'poniente';
  return null;
}
const BEAU = [[2, 'calma'], [6, 'ventolina'], [12, 'flojito'], [20, 'flojo'], [29, 'bonancible'], [39, 'fresquito'], [50, 'fresco'], [62, 'frescachón'], [75, 'temporal'], [89, 'temporal fuerte'], [103, 'temporal duro'], [118, 'temporal muy duro'], [999, 'huracanado']];
const beaufort = (k) => { for (let i = 0; i < BEAU.length; i++) if (k < BEAU[i][0]) return { n: i, name: BEAU[i][1] }; return { n: 12, name: 'huracanado' }; };
function windText(spd, dir) {
  const b = beaufort(spd);
  if (b.n === 0) return 'Calma';
  return `${windName(dir)} ${b.name}`;
}
function seaState(h) {
  if (h == null) return '—';
  if (h < 0.1) return 'Mar rizada';
  if (h < 0.5) return 'Marejadilla';
  if (h < 1.25) return 'Marejada';
  if (h < 2.5) return 'Fuerte marejada';
  if (h < 4) return 'Mar gruesa';
  if (h < 6) return 'Muy gruesa';
  return 'Arbolada';
}
// Tiempo: icono propio (g), emoji solo para mensajes de WhatsApp (em) y texto
const WX = [
  [(c) => c === 0, 'sun', 'moon', '☀️', 'Despejado'], [(c) => c === 1, 'sun-cloud', 'moon-cloud', '🌤️', 'Casi despejado'],
  [(c) => c === 2, 'sun-cloud', 'moon-cloud', '⛅', 'Nubes y claros'], [(c) => c === 3, 'cloud', 'cloud', '☁️', 'Nublado'],
  [(c) => c === 45 || c === 48, 'fog', 'fog', '🌫️', 'Niebla'], [(c) => c >= 51 && c <= 57, 'drizzle', 'rain', '🌦️', 'Llovizna'],
  [(c) => c >= 61 && c <= 67, 'rain', 'rain', '🌧️', 'Lluvia'], [(c) => c >= 71 && c <= 77, 'snow', 'snow', '🌨️', 'Nieve'],
  [(c) => c >= 80 && c <= 82, 'drizzle', 'rain', '🌦️', 'Chubascos'], [(c) => c >= 85 && c <= 86, 'snow', 'snow', '🌨️', 'Nieve'],
  [(c) => c >= 95, 'storm', 'storm', '⛈️', 'Tormenta'],
];
function wx(code, day = 1) {
  const c = code ?? 0;
  const r = WX.find((x) => x[0](c)) || WX[1];
  const g = day ? r[1] : r[2];
  return { g, e: gl(g), em: r[3], t: r[4] };
}
function scoreColor(s) {
  if (s >= 8.5) return '#2BD9A6';
  if (s >= 7) return '#34C759';
  if (s >= 5.5) return '#FFD60A';
  if (s >= 4) return '#FF9F0A';
  return '#FF453A';
}
function verdict(s) {
  if (s >= 8.5) return 'Día épico';
  if (s >= 7) return 'Buena pesca';
  if (s >= 5.5) return 'Pesca regular';
  if (s >= 4) return 'Floja';
  return 'Mejor otro día';
}

/* ---------------- Datos en vivo (Open-Meteo) ---------------- */
const API_F = 'https://api.open-meteo.com/v1/forecast';
const API_M = 'https://marine-api.open-meteo.com/v1/marine';
const TTL = 30 * 60e3;
function seaPoint(sp, mult = 1) {
  const dist = (sp.mar === 'bahia' || sp.tipo === 'puerto' ? 0.9 : 1.6) * mult;
  const br = (sp.orientacion ?? 180) * Math.PI / 180;
  const dLat = dist / 111.2 * Math.cos(br);
  const dLon = dist / (111.2 * Math.cos(sp.lat * Math.PI / 180)) * Math.sin(br);
  return { lat: +(sp.lat + dLat).toFixed(4), lon: +(sp.lon + dLon).toFixed(4) };
}
async function getJSON(url) {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(tm); }
}
const F_HOURLY = 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day';
const F_DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant';
const M_HOURLY = 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature,sea_level_height_msl,ocean_current_velocity,ocean_current_direction';
async function fetchMarine(sp) {
  for (const mult of [1, 2.5, 5]) {
    const sea = seaPoint(sp, mult);
    try {
      const m = await getJSON(`${API_M}?latitude=${sea.lat}&longitude=${sea.lon}&timezone=Europe%2FMadrid&past_days=1&forecast_days=7&hourly=${M_HOURLY}`);
      const ok = m.hourly && (m.hourly.wave_height || []).some((v) => v != null) && (m.hourly.sea_level_height_msl || []).some((v) => v != null);
      if (ok) return m;
    } catch (e) { /* prueba más lejos */ }
  }
  return null;
}
async function loadSpot(sp, force) {
  const key = 'wx.' + sp.id;
  const c = LS.get(key);
  if (!force && c && Date.now() - c.t < TTL) return c;
  try {
    const [f, m] = await Promise.all([
      getJSON(`${API_F}?latitude=${sp.lat}&longitude=${sp.lon}&timezone=Europe%2FMadrid&past_days=1&forecast_days=7&wind_speed_unit=kmh&hourly=${F_HOURLY}&daily=${F_DAILY}`),
      fetchMarine(sp),
    ]);
    const data = { t: Date.now(), f, m };
    const keys = LS.get('wxkeys', []).filter((k) => k !== key);
    keys.unshift(key);
    while (keys.length > 5) LS.del(keys.pop());
    LS.set('wxkeys', keys);
    if (!LS.set(key, data)) { keys.slice(1).forEach((k) => LS.del(k)); LS.set(key, data); }
    return data;
  } catch (e) {
    if (c) { c.stale = true; return c; }
    throw e;
  }
}
let allNow = LS.get('now.all', null);
async function loadAllNow(force) {
  if (!force && allNow && Date.now() - allNow.t < TTL && D.spots.every((s) => allNow.list[s.id])) return allNow;
  const lats = D.spots.map((s) => s.lat).join(','), lons = D.spots.map((s) => s.lon).join(',');
  const seas = D.spots.map((s) => seaPoint(s, 1.6));
  const [f, m] = await Promise.all([
    getJSON(`${API_F}?latitude=${lats}&longitude=${lons}&timezone=Europe%2FMadrid&wind_speed_unit=kmh&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,temperature_2m`),
    getJSON(`${API_M}?latitude=${seas.map((s) => s.lat).join(',')}&longitude=${seas.map((s) => s.lon).join(',')}&timezone=Europe%2FMadrid&current=wave_height,wave_period,sea_surface_temperature`).catch(() => null),
  ]);
  const fa = Array.isArray(f) ? f : [f], ma = m ? (Array.isArray(m) ? m : [m]) : [];
  allNow = { t: Date.now(), list: {} };
  D.spots.forEach((s, i) => { allNow.list[s.id] = { w: fa[i] && fa[i].current, s: ma[i] && ma[i].current }; });
  LS.set('now.all', allNow);
  return allNow;
}

/* ---------------- Análisis: mareas e índice de pesca ---------------- */
function tideExtremes(T, lv) {
  const out = [];
  for (let i = 1; i < lv.length - 1; i++) {
    const a = lv[i - 1], b = lv[i], c = lv[i + 1];
    if (a == null || b == null || c == null) continue;
    const hi = b > a && b >= c, lo = b < a && b <= c;
    if (!hi && !lo) continue;
    const den = a - 2 * b + c;
    const off = den ? 0.5 * (a - c) / den : 0;
    out.push({ type: hi ? 'hi' : 'lo', t: new Date(T[i].getTime() + off * 3600e3), h: b - 0.25 * (a - c) * off });
  }
  return out;
}
function levelAt(ctx, t) {
  const T = ctx.T, lv = ctx.lvl;
  for (let i = 0; i < T.length - 1; i++) {
    if (t >= T[i] && t < T[i + 1]) {
      const a = lv[i], b = lv[i + 1];
      if (a == null || b == null) return null;
      // interpolación coseno entre horas: curva más natural
      const f = (t - T[i]) / (T[i + 1] - T[i]);
      const g = (1 - Math.cos(f * Math.PI)) / 2;
      return a + (b - a) * (f * 0.5 + g * 0.5);
    }
  }
  return null;
}
function windFac(spd, gust, dir, sp) {
  if (spd == null) return 0.8;
  const wt = windType(dir);
  let eff = spd;
  if (sp.abrigo && sp.abrigo.length) {
    if (wt && sp.abrigo.includes(wt)) eff = spd * 0.45;
    else if (wt) eff = spd * 1.08;
  } else if (sp.orientacion != null) {
    const diff = Math.abs(((dir - sp.orientacion) % 360 + 540) % 360 - 180); // 0 = viento del mar
    if (diff < 50) eff = spd * 1.1; else if (diff > 130) eff = spd * 0.6;
  }
  let f = eff <= 8 ? 1 : eff <= 15 ? 0.93 : eff <= 22 ? 0.8 : eff <= 30 ? 0.6 : eff <= 38 ? 0.4 : eff <= 48 ? 0.22 : 0.1;
  const g = gust || spd;
  if (g > 65) f = Math.min(f, 0.15); else if (g > 50) f = Math.min(f, 0.35);
  return f;
}
function waveFac(h, sp) {
  if (h == null) return 0.85;
  const t = sp.tipo;
  if (t === 'playa') return h < 0.15 ? 0.62 : h < 0.35 ? 0.82 : h <= 1.2 ? 1 : h <= 1.8 ? 0.62 : h <= 2.5 ? 0.32 : 0.12;
  if (t === 'roca') return h < 0.25 ? 0.78 : h <= 0.9 ? 1 : h <= 1.4 ? 0.58 : h <= 2 ? 0.25 : 0.08;
  if (t === 'espigon') return h < 0.2 ? 0.85 : h <= 1.1 ? 1 : h <= 1.7 ? 0.6 : 0.2;
  return h <= 1.5 ? 1 : h <= 2.5 ? 0.72 : 0.45; // puerto, estuario
}
function tideFac(ctx, i) {
  const r = ctx.rate[i];
  if (r == null) return 0.75;
  let f = 0.45 + 0.55 * Math.min(1, Math.abs(r) / ctx.maxRate);
  if (r > 0) f = Math.min(1, f + 0.06); // la llenante suele dar más
  return f;
}
function lightFac(ctx, t) {
  const d = ctx.dayBy[dayKey(t)];
  if (!d) return 0.75;
  const h = 3600e3;
  if ((t >= d.sr - h && t <= d.sr.getTime() + 1.5 * h) || (t >= d.ss - 1.5 * h && t <= d.ss.getTime() + h)) return 1;
  if (t < d.sr || t > d.ss) return 0.82;
  return 0.66;
}
function solFac(ctx, t) {
  let best = 0.72;
  for (const e of ctx.sol) {
    const dm = Math.abs(t - e.t) / 60000;
    if (e.k === 'maj' && dm <= 60) return 1;
    if (e.k === 'min' && dm <= 40) best = 0.9;
  }
  return best;
}
function moonFac(ctx, t) {
  const d = ctx.dayBy[dayKey(t)];
  const p = d ? d.ill.phase : 0.25;
  return 0.8 + 0.2 * Math.abs(Math.cos(2 * Math.PI * p));
}
function presFac(P, i) {
  if (!P || i < 3 || P[i] == null || P[i - 3] == null) return 0.88;
  const d = P[i] - P[i - 3];
  if (d <= -3.5) return 0.75;
  if (d < -0.8) return 1;
  if (d <= 0.8) return 0.9;
  if (d <= 3) return 0.8;
  return 0.68;
}
const WEIGHTS = { wind: 0.30, waves: 0.20, tide: 0.20, light: 0.10, sol: 0.08, moon: 0.06, pres: 0.06 };
function scoreAt(ctx, i, sp = ctx.sp) {
  const H = ctx.H, M = ctx.M, t = ctx.T[i];
  const fx = {
    wind: windFac(H.wind_speed_10m[i], H.wind_gusts_10m[i], H.wind_direction_10m[i], sp),
    waves: waveFac(M.wave_height ? M.wave_height[i] : null, sp),
    tide: tideFac(ctx, i),
    light: lightFac(ctx, t),
    sol: solFac(ctx, t),
    moon: moonFac(ctx, t),
    pres: presFac(H.pressure_msl, i),
  };
  let s = 1;
  for (const k in WEIGHTS) s *= Math.pow(Math.max(0.05, fx[k]), WEIGHTS[k]);
  const code = H.weather_code[i];
  if (code >= 95) s *= 0.35; else if ((H.precipitation[i] || 0) > 2) s *= 0.85;
  s = Math.pow(s, 1.5); // estira la escala: el «épico» tiene que ser raro
  return { s: Math.round(s * 100) / 10, fx };
}
function buildCtx(data, sp) {
  const f = data.f, m = data.m, H = f.hourly, keys = H.time;
  const T = keys.map(fromLocal);
  const M = {};
  if (m && m.hourly) {
    const idx = new Map(m.hourly.time.map((k, i) => [k, i]));
    for (const name of Object.keys(m.hourly)) {
      if (name === 'time') continue;
      M[name] = keys.map((k) => { const j = idx.get(k); return j == null ? null : m.hourly[name][j]; });
    }
  }
  const lvl = M.sea_level_height_msl || keys.map(() => null);
  const hasTide = lvl.some((v) => v != null);
  const ext = hasTide ? tideExtremes(T, lvl) : [];
  const days = f.daily.time.map((k, di) => {
    const mid = fromLocal(k + 'T00:00');
    return {
      key: k, di, mid,
      sr: fromLocal(f.daily.sunrise[di]), ss: fromLocal(f.daily.sunset[di]),
      moon: Astro.moonDay(mid, sp.lat, sp.lon),
      ill: Astro.moonIllumination(new Date(mid.getTime() + 12 * 3600e3)),
      code: f.daily.weather_code[di], tmax: f.daily.temperature_2m_max[di], tmin: f.daily.temperature_2m_min[di],
      wmax: f.daily.wind_speed_10m_max[di], gmax: f.daily.wind_gusts_10m_max[di], wdir: f.daily.wind_direction_10m_dominant[di],
      rain: f.daily.precipitation_probability_max[di], uv: f.daily.uv_index_max[di],
      ext: ext.filter((e) => dayKey(e.t) === k),
    };
  });
  const dayBy = {};
  days.forEach((d) => { dayBy[d.key] = d; });
  const sol = [];
  days.forEach((d) => {
    if (d.moon.upper) sol.push({ t: d.moon.upper, k: 'maj', n: 'Luna en lo alto' });
    if (d.moon.lower) sol.push({ t: d.moon.lower, k: 'maj', n: 'Luna en el antimeridiano' });
    if (d.moon.rise) sol.push({ t: d.moon.rise, k: 'min', n: 'Sale la luna' });
    if (d.moon.set) sol.push({ t: d.moon.set, k: 'min', n: 'Se pone la luna' });
  });
  const rate = keys.map((_, i) => (lvl[i + 1] != null && lvl[i - 1] != null ? (lvl[i + 1] - lvl[i - 1]) / 2 : null));
  const ctx = { sp, f, m, H, M, keys, T, lvl, hasTide, ext, days, dayBy, sol, rate, t: data.t, stale: !!data.stale };
  ctx.maxRate = Math.max(0.01, ...rate.filter((v) => v != null).map(Math.abs));
  ctx.base = hasTide ? Math.min(...lvl.filter((v) => v != null)) : 0;
  ctx.scores = keys.map((_, i) => scoreAt(ctx, i));
  const nk = localKey();
  ctx.now = Math.max(0, keys.indexOf(nk));
  days.forEach((d) => { d.best = bestWindows(ctx, d.key); d.max = d.best.length ? d.best[0].max : 0; });
  return ctx;
}
function bestWindows(ctx, key, from = 5, to = 23) {
  const idx = [];
  ctx.keys.forEach((k, i) => { if (k.startsWith(key)) { const h = +k.slice(11, 13); if (h >= from && h <= to) idx.push(i); } });
  if (!idx.length) return [];
  const max = Math.max(...idx.map((i) => ctx.scores[i].s));
  const thr = Math.max(max - 0.35, 0);
  const wins = [];
  let cur = null;
  for (const i of idx) {
    if (ctx.scores[i].s >= thr) {
      if (cur && i === cur.end + 1) { cur.end = i; cur.max = Math.max(cur.max, ctx.scores[i].s); } else { cur = { start: i, end: i, max: ctx.scores[i].s }; wins.push(cur); }
    } else cur = null;
  }
  // Un rato bueno es de unas horas: si sale muy largo, se queda con las 4 mejores seguidas
  for (const w of wins) {
    if (w.end - w.start + 1 <= 4) continue;
    let best = w.start, bs = -1;
    for (let a = w.start; a + 3 <= w.end; a++) { const sum = [0, 1, 2, 3].reduce((t, k) => t + ctx.scores[a + k].s, 0); if (sum > bs) { bs = sum; best = a; } }
    w.start = best; w.end = best + 3;
  }
  wins.sort((a, b) => b.max - a.max || (b.end - b.start) - (a.end - a.start));
  return wins.slice(0, 3).map((w) => ({ ...w, from: ctx.T[w.start], to: new Date(ctx.T[w.end].getTime() + 3600e3) }));
}
function tideState(ctx, i) {
  const r = ctx.rate[i];
  if (r == null) return null;
  const next = ctx.ext.find((e) => e.t > ctx.T[i]);
  if (Math.abs(r) < ctx.maxRate * 0.18) return { t: next && next.type === 'lo' ? 'Repunte de pleamar' : 'Repunte de bajamar', up: r > 0, next };
  return { t: r > 0 ? 'Subiendo' : 'Bajando', up: r > 0, next };
}
function quickScore(sp, nowItem, ctx) {
  if (!nowItem || !nowItem.w) return null;
  const w = nowItem.w;
  const wf = windFac(w.wind_speed_10m, w.wind_gusts_10m, w.wind_direction_10m, sp);
  const vf = waveFac(nowItem.s ? nowItem.s.wave_height : null, sp);
  let common = 0.82;
  if (ctx) {
    const fx = ctx.scores[ctx.now].fx;
    common = 1;
    for (const k of ['tide', 'light', 'sol', 'moon', 'pres']) common *= Math.pow(Math.max(0.05, fx[k]), WEIGHTS[k] / 0.5);
  }
  const s = Math.pow(wf, 0.3) * Math.pow(vf, 0.2) * Math.pow(common, 0.5);
  return Math.round(Math.pow(s, 1.5) * 100) / 10;
}

/* ---------------- Ilustraciones de peces (SVG generado) ---------------- */
let uid = 0;
function fishSVG(f, cls = '') {
  const c = f.color || {};
  const body = c.body || '#8aa4bd', belly = c.belly || '#eef3f7', fin = c.fin || body, pc = c.pc || 'rgba(20,24,30,.55)';
  const id = 'g' + (++uid);
  const forma = f.forma || 'esparido';
  const defs = `<defs><linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${body}" stop-opacity="1"/><stop offset=".5" stop-color="${body}"/><stop offset="1" stop-color="${belly}"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  const wrap = (inner) => `<svg class="${cls}" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${inner}</svg>`;
  const eye = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x - 0.4}" cy="${y}" r="${r * 0.62}" fill="#15171c"/><circle cx="${x - 1.4}" cy="${y - 1.2}" r="${r * 0.22}" fill="#fff"/>`;

  if (forma === 'calamar') {
    const tent = [0, 1, 2, 3, 4].map((k) => `<path d="M62 ${46 + k * 2} C ${40 - k * 3} ${40 + k * 5}, ${30} ${44 + k * 4}, ${10 + k * 2} ${36 + k * 7}" stroke="${fin}" stroke-width="${k === 2 ? 3 : 2.2}" fill="none" stroke-linecap="round" opacity=".9"/>`).join('');
    return wrap(`${tent}<path d="M178 50 L194 30 L196 70 Z" fill="${fin}" opacity=".85"/><path d="M60 50 C60 38 90 34 120 36 C150 38 175 44 190 50 C175 56 150 62 120 64 C90 66 60 62 60 50Z" fill="url(#${id}b)"/><path d="M60 50 C60 38 90 34 120 36 C150 38 175 44 190 50" fill="url(#${id}s)"/>${[80, 96, 112, 128, 144, 160].map((x, k) => `<circle cx="${x}" cy="${46 + (k % 2) * 7}" r="2.2" fill="${pc}"/>`).join('')}${eye(66, 47, 5)}`);
  }
  if (forma === 'sepia') {
    const arms = [0, 1, 2, 3].map((k) => `<path d="M48 ${44 + k * 4} q -16 ${-6 + k * 4} -30 ${-4 + k * 5}" stroke="${fin}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
    const zebra = [70, 84, 98, 112, 126, 140, 154].map((x) => `<path d="M${x} 30 q 5 8 0 16" stroke="${pc}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
    return wrap(`${arms}<ellipse cx="116" cy="50" rx="74" ry="27" fill="${fin}" opacity=".55"/><path d="M50 50 C50 30 80 26 115 26 C155 26 180 36 182 50 C180 64 155 74 115 74 C80 74 50 70 50 50Z" fill="url(#${id}b)"/><clipPath id="${id}c"><path d="M50 50 C50 30 80 26 115 26 C155 26 180 36 182 50 C180 64 155 74 115 74 C80 74 50 70 50 50Z"/></clipPath><g clip-path="url(#${id}c)">${zebra}</g><path d="M50 50 C50 30 80 26 115 26 C155 26 180 36 182 50" fill="url(#${id}s)"/>${eye(58, 44, 5)}`);
  }
  if (forma === 'pulpo') {
    const arms = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
      const x0 = 70 + k * 9, dir = k < 4 ? -1 : 1, len = 30 + (k % 3) * 8;
      return `<path d="M${x0} 58 c ${dir * 6} 12, ${dir * (len * 0.6)} 22, ${dir * len} 18 c ${dir * 8} -2, ${dir * 6} -10, ${dir * -2} -8" stroke="${body}" stroke-width="${7 - Math.abs(3.5 - k) * 0.6}" fill="none" stroke-linecap="round"/>`;
    }).join('');
    return wrap(`${arms}<path d="M66 60 C 56 24, 140 10, 140 46 C 142 58, 128 64, 100 64 C 84 64, 70 64, 66 60Z" fill="url(#${id}b)"/><path d="M66 60 C 56 24, 140 10, 140 46" fill="url(#${id}s)"/>${[88, 104, 120].map((x) => `<circle cx="${x}" cy="${34 + (x % 3)}" r="2.4" fill="${pc}"/>`).join('')}${eye(84, 52, 4.5)}${eye(112, 52, 4.5)}`);
  }
  if (forma === 'plano') {
    const outline = 'M18 50 C18 24 66 14 108 16 C150 18 166 36 168 50 C166 64 150 82 108 84 C66 86 18 76 18 50Z';
    const spots = [[70, 40], [96, 30], [120, 44], [90, 60], [130, 64], [60, 64], [140, 34], [110, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${c.pattern === 'puntos' ? 3.4 : 2}" fill="${pc}" opacity=".7"/>`).join('');
    return wrap(`<path d="M166 44 L194 30 L190 50 L194 70 L166 56Z" fill="${fin}"/><path d="${outline}" fill="none" stroke="${fin}" stroke-width="9" stroke-dasharray="1.5 2.5" opacity=".8"/><path d="${outline}" fill="url(#${id}b)"/>${spots}<path d="${outline}" fill="url(#${id}s)"/>${eye(38, 40, 3.6)}${eye(46, 50, 3.6)}`);
  }
  if (forma === 'raya') {
    const spots = [[80, 40], [100, 32], [120, 44], [92, 58], [118, 62], [104, 48], [70, 54], [134, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${pc}" opacity=".6"/>`).join('');
    return wrap(`<path d="M150 50 L196 47 L196 53 Z" fill="${fin}"/><path d="M22 50 Q 60 30 100 10 Q 130 32 160 50 Q 130 68 100 90 Q 60 70 22 50Z" fill="url(#${id}b)"/>${spots}<path d="M22 50 Q 60 30 100 10 Q 130 32 160 50" fill="url(#${id}s)"/>${eye(52, 44, 3)}${eye(52, 56, 3)}`);
  }
  if (forma === 'anguila') {
    const outline = 'M8 52 C 26 38, 60 38, 100 44 C 140 50, 170 46, 196 44 L 196 56 C 170 58, 140 62, 100 60 C 60 58, 26 64, 8 52Z';
    const blot = c.pattern === 'jaspeado' ? [20, 40, 60, 80, 100, 120, 140, 160, 180].map((x, k) => `<ellipse cx="${x}" cy="${46 + (k % 3) * 4}" rx="6" ry="3.5" fill="${pc}" opacity=".55"/>`).join('') : '';
    return wrap(`<path d="M30 40 C 80 30, 150 38, 196 40 L196 44 C 150 42, 80 36, 30 44Z" fill="${fin}" opacity=".8"/><path d="${outline}" fill="url(#${id}b)"/><clipPath id="${id}c"><path d="${outline}"/></clipPath><g clip-path="url(#${id}c)">${blot}</g><path d="M8 52 C 26 38, 60 38, 100 44 C 140 50, 170 46, 196 44" fill="url(#${id}s)"/>${eye(22, 47, 3.4)}<path d="M8 53 q 6 3 12 1" stroke="rgba(0,0,0,.35)" stroke-width="1.2" fill="none"/>`);
  }

  // Pez de silueta clásica: parámetros por forma
  const P = {
    esparido: { H: 29, hx: 76, T: 23, tail: 'fork', dorsal: 'long', nose: 54 },
    alargado: { H: 19, hx: 82, T: 20, tail: 'fork', dorsal: 'two', nose: 52 },
    corvina: { H: 22, hx: 84, T: 17, tail: 'square', dorsal: 'two', nose: 54 },
    fusiforme: { H: 17, hx: 82, T: 24, tail: 'lunate', dorsal: 'small', nose: 51 },
    lisa: { H: 17, hx: 80, T: 18, tail: 'fork', dorsal: 'two', nose: 53 },
    escorpora: { H: 25, hx: 64, T: 15, tail: 'round', dorsal: 'spiky', nose: 56 },
    aguja: { H: 8, hx: 96, T: 13, tail: 'fork', dorsal: 'back', nose: 50 },
    serrano: { H: 22, hx: 74, T: 16, tail: 'square', dorsal: 'long', nose: 54 },
  }[forma] || { H: 26, hx: 76, T: 22, tail: 'fork', dorsal: 'long', nose: 53 };
  const { H, hx, T } = P;
  const y0 = 50, ny = P.nose;
  const nx = forma === 'aguja' ? 34 : 14;
  const top = `M${nx},${ny} C ${nx + 8},${y0 - H * 0.92} ${hx - 22},${y0 - H} ${hx},${y0 - H} C ${hx + 42},${y0 - H} 142,${y0 - H * 0.34} 157,${y0 - 3}`;
  let tail;
  if (P.tail === 'lunate') tail = `L 191,${y0 - T * 1.15} Q 174,${y0} 191,${y0 + T * 1.15} L 157,${y0 + 3}`;
  else if (P.tail === 'square') tail = `L 184,${y0 - T} Q 188,${y0} 184,${y0 + T} L 157,${y0 + 3}`;
  else if (P.tail === 'round') tail = `C 176,${y0 - T * 1.2} 192,${y0 - T * 0.6} 190,${y0} C 192,${y0 + T * 0.6} 176,${y0 + T * 1.2} 157,${y0 + 3}`;
  else tail = `L 187,${y0 - T} Q 174,${y0} 187,${y0 + T} L 157,${y0 + 3}`;
  const bottom = `C 142,${y0 + H * 0.36} ${hx + 42},${y0 + H * 0.96} ${hx},${y0 + H * 0.96} C ${hx - 24},${y0 + H * 0.96} ${nx + 8},${ny + H * 0.62} ${nx},${ny} Z`;
  const bodyPath = `${top} ${tail} ${bottom}`;
  let fins = '';
  if (P.dorsal === 'long' || P.dorsal === 'spiky') {
    fins += `<path d="M${hx - 30},${y0 - H * 0.95} C ${hx - 18},${y0 - H - 15} ${hx + 30},${y0 - H - 12} ${hx + 52},${y0 - H * 0.6} L ${hx + 40},${y0 - H * 0.82} Z" fill="${fin}" opacity=".9"/>`;
    if (P.dorsal === 'spiky') fins += [0, 1, 2, 3, 4, 5].map((k) => `<path d="M${hx - 26 + k * 9},${y0 - H * 0.95} l 2,-${14 - k}" stroke="${fin}" stroke-width="2" stroke-linecap="round"/>`).join('');
  } else if (P.dorsal === 'two') {
    fins += `<path d="M${hx - 26},${y0 - H * 0.96} C ${hx - 18},${y0 - H - 13} ${hx - 2},${y0 - H - 12} ${hx + 6},${y0 - H * 0.98} Z" fill="${fin}" opacity=".9"/><path d="M${hx + 14},${y0 - H * 0.95} C ${hx + 24},${y0 - H - 10} ${hx + 44},${y0 - H - 6} ${hx + 54},${y0 - H * 0.62} Z" fill="${fin}" opacity=".9"/>`;
  } else if (P.dorsal === 'small') {
    fins += `<path d="M${hx - 20},${y0 - H * 0.96} C ${hx - 14},${y0 - H - 13} ${hx},${y0 - H - 10} ${hx + 10},${y0 - H * 0.98} Z" fill="${fin}" opacity=".9"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M${118 + k * 7},${y0 - H * 0.62 + k * 1.6} l 3,-4 l 2,4 Z" fill="${fin}"/><path d="M${118 + k * 7},${y0 + H * 0.62 - k * 1.6} l 3,4 l 2,-4 Z" fill="${fin}"/>`).join('')}`;
  } else if (P.dorsal === 'back') {
    fins += `<path d="M128,${y0 - H * 0.6} C 134,${y0 - H - 8} 146,${y0 - H - 6} 150,${y0 - 3} Z" fill="${fin}"/><path d="M128,${y0 + H * 0.6} C 134,${y0 + H + 8} 146,${y0 + H + 6} 150,${y0 + 3} Z" fill="${fin}"/>`;
  }
  if (P.dorsal !== 'back') fins += `<path d="M${hx + 30},${y0 + H * 0.88} C ${hx + 42},${y0 + H + 11} ${hx + 58},${y0 + H + 6} ${hx + 64},${y0 + H * 0.52} Z" fill="${fin}" opacity=".85"/><path d="M${hx - 22},${y0 + H * 0.94} c 4,11 12,12 18,4 Z" fill="${fin}" opacity=".85"/>`;
  let pat = '';
  const pt = c.pattern || '';
  if (pt.includes('bandas-finas')) pat += Array.from({ length: 11 }, (_, k) => `<rect x="${44 + k * 10}" y="0" width="3.6" height="100" fill="${pc}" opacity=".5"/>`).join('');
  else if (pt.includes('bandas')) pat += [52, 72, 92, 112, 132].map((x, k) => `<rect x="${x}" y="0" width="${k % 2 ? 5 : 8}" height="100" fill="${pc}" opacity="${k % 2 ? 0.35 : 0.6}"/>`).join('');
  if (pt.includes('lineas')) pat += Array.from({ length: 7 }, (_, k) => `<path d="M20 ${y0 - H + 6 + k * (H * 2 - 8) / 7} L 160 ${y0 - H + 8 + k * (H * 2 - 8) / 7}" stroke="${c.pc2 || pc}" stroke-width="2.2" opacity=".75"/>`).join('');
  if (pt.includes('atigrado')) pat += Array.from({ length: 7 }, (_, k) => `<path d="M${70 + k * 12} ${y0 - H} l -14 ${H * 0.9}" stroke="${pc}" stroke-width="3" opacity=".6"/>`).join('');
  if (pt.includes('ondas')) pat += Array.from({ length: 9 }, (_, k) => `<path d="M${50 + k * 12} ${y0 - H} q 6 6 0 12 q -6 6 0 10" stroke="${pc}" stroke-width="2.4" fill="none" opacity=".7"/>`).join('');
  if (pt.includes('puntos')) pat += Array.from({ length: 22 }, (_, k) => `<circle cx="${50 + (k * 37) % 100}" cy="${y0 - H * 0.7 + ((k * 23) % 100) / 100 * H * 1.3}" r="1.7" fill="${c.pc2 || pc}" opacity=".8"/>`).join('');
  if (pt.includes('jaspeado')) pat += [[60, 40], [86, 54], [110, 38], [130, 56], [74, 62], [100, 48], [146, 44]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="${pc}" opacity=".45"/>`).join('');
  if (pt.includes('mancha-cola')) pat += `<ellipse cx="151" cy="${y0}" rx="6" ry="${Math.min(8, H * 0.4)}" fill="#14161b" opacity=".85"/>`;
  if (pt.includes('mancha-axila')) pat += `<circle cx="58" cy="${y0 - H * 0.35}" r="3.2" fill="#14161b" opacity=".75"/>`;
  if (pt.includes('dorada')) pat += `<path d="M30 ${y0 - H * 0.86} Q 36 ${y0 - H * 0.4} 34 ${y0 - 2}" stroke="#f5c542" stroke-width="3.4" fill="none"/><path d="M48 ${y0 - H * 0.52} q 4 4 0 9" stroke="#1d2027" stroke-width="3.2" fill="none" opacity=".75"/>`;
  if (pt.includes('franja')) pat += `<path d="M18 ${y0 - 2} L 158 ${y0 - 1}" stroke="${c.pc2 || pc}" stroke-width="5" opacity=".8"/>`;
  const lateral = `<path d="M42 ${y0 - H * 0.52} C ${hx} ${y0 - H * 0.72}, 130 ${y0 - H * 0.3}, 156 ${y0 - 1}" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/>`;
  const gill = `<path d="M${nx + 30},${y0 - H * 0.55} Q ${nx + 38},${y0 + 2} ${nx + 30},${y0 + H * 0.58}" stroke="rgba(0,0,0,.22)" stroke-width="1.4" fill="none"/>`;
  const pect = `<path d="M${nx + 38},${y0 + 4} c 10,-2 18,4 20,10 c -8,0 -16,-2 -20,-10 Z" fill="${fin}" opacity=".8"/>`;
  const beak = forma === 'aguja' ? `<path d="M36 51 L 4 50 L 36 53 Z" fill="${body}"/>` : '';
  const mouth = forma === 'aguja' ? '' : `<path d="M${nx},${ny + 1} q 5,2 9,0" stroke="rgba(0,0,0,.4)" stroke-width="1.3" fill="none"/>`;
  return wrap(`${fins}${beak}<path d="${bodyPath}" fill="url(#${id}b)"/><clipPath id="${id}c"><path d="${bodyPath}"/></clipPath><g clip-path="url(#${id}c)">${pat}<path d="${top} L 157,${y0} L ${nx},${ny} Z" fill="url(#${id}s)"/></g>${lateral}${gill}${pect}${mouth}${eye(nx + 19, y0 - H * 0.2 - 1, forma === 'escorpora' ? 5 : 4.2)}`);
}

/* ---------------- Dibujos de indicadores ---------------- */
function compassSVG(dir, spd, gust) {
  let ticks = '';
  for (let a = 0; a < 360; a += 10) {
    const r1 = a % 90 === 0 ? 40 : 43, r = 47, rad = (a - 90) * Math.PI / 180;
    ticks += `<line x1="${60 + r1 * Math.cos(rad)}" y1="${60 + r1 * Math.sin(rad)}" x2="${60 + r * Math.cos(rad)}" y2="${60 + r * Math.sin(rad)}" stroke="rgba(255,255,255,${a % 90 === 0 ? 0.8 : 0.35})" stroke-width="${a % 90 === 0 ? 2 : 1.2}"/>`;
  }
  const L = [['N', 0], ['E', 90], ['S', 180], ['O', 270]].map(([t, a]) => { const rad = (a - 90) * Math.PI / 180; return `<text x="${60 + 31 * Math.cos(rad)}" y="${60 + 31 * Math.sin(rad) + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="rgba(255,255,255,.75)">${t}</text>`; }).join('');
  const rot = (dir + 180) % 360;
  return `<svg viewBox="0 0 120 120">${ticks}${L}<g transform="rotate(${rot} 60 60)"><line x1="60" y1="104" x2="60" y2="24" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M60 13 l8 14 h-16z" fill="#fff"/><circle cx="60" cy="104" r="4.5" fill="none" stroke="#fff" stroke-width="2.5"/></g><circle cx="60" cy="60" r="20" fill="rgba(20,40,70,.55)"/><text x="60" y="62" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${n0(spd)}</text><text x="60" y="73" text-anchor="middle" font-size="7.5" font-weight="600" fill="rgba(255,255,255,.75)">km/h</text></svg>`;
}
function moonSVG(p, size = 58, id = 'm' + (++uid)) {
  const k = Math.cos(2 * Math.PI * p);
  const rx = Math.abs(k) * 48;
  const waxing = p < 0.5;
  const outer = waxing ? 1 : 0;
  const term = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  const lit = `M50 2 A48 48 0 0 ${outer} 50 98 A${rx.toFixed(2)} 48 0 0 ${term} 50 2Z`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}" cx="40%" cy="35%"><stop offset="0" stop-color="#fffdf2"/><stop offset="1" stop-color="#d9d3bf"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="rgba(30,36,52,.75)"/><path d="${lit}" fill="url(#${id})"/><circle cx="38" cy="36" r="6" fill="rgba(0,0,0,.06)"/><circle cx="62" cy="62" r="9" fill="rgba(0,0,0,.05)"/><circle cx="60" cy="30" r="4" fill="rgba(0,0,0,.05)"/></svg>`;
}
function sunArcSVG(d, now = new Date()) {
  const f = clamp((now - d.sr) / (d.ss - d.sr), -0.15, 1.15);
  const x = 12 + 136 * f;
  const yy = (t) => 58 - 46 * Math.sin(Math.PI * clamp(t, 0, 1));
  const y = f < 0 || f > 1 ? 66 : yy(f);
  let path = '';
  for (let i = 0; i <= 40; i++) { const t = i / 40; path += `${i ? 'L' : 'M'}${12 + 136 * t},${yy(t)}`; }
  const done = Array.from({ length: 41 }, (_, i) => i / 40).filter((t) => t <= clamp(f, 0, 1)).map((t, i) => `${i ? 'L' : 'M'}${12 + 136 * t},${yy(t)}`).join('');
  return `<svg viewBox="0 0 160 76"><path d="${path}" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none" stroke-dasharray="3 4"/><path d="${done}" stroke="rgba(255,214,10,.9)" stroke-width="2.4" fill="none"/><line x1="4" y1="58" x2="156" y2="58" stroke="rgba(255,255,255,.35)" stroke-width="1"/><circle cx="${x}" cy="${y}" r="7" fill="${f < 0 || f > 1 ? 'rgba(255,255,255,.35)' : '#FFD60A'}" ${f >= 0 && f <= 1 ? 'style="filter:drop-shadow(0 0 6px #ffd60a)"' : ''}/></svg>`;
}
function gaugeSVG(p) {
  const min = 985, max = 1040;
  const f = clamp((p - min) / (max - min), 0, 1);
  const a0 = 150, a1 = 390, a = a0 + (a1 - a0) * f;
  const pt = (ang, r) => [60 + r * Math.cos(ang * Math.PI / 180), 60 + r * Math.sin(ang * Math.PI / 180)];
  const [x0, y0] = pt(a0, 44), [x1, y1] = pt(a1, 44), [xa, ya] = pt(a, 44), [xn, yn] = pt(a, 30);
  return `<svg viewBox="0 0 120 100"><path d="M${x0} ${y0} A44 44 0 1 1 ${x1} ${y1}" stroke="rgba(255,255,255,.22)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x0} ${y0} A44 44 0 ${a - a0 > 180 ? 1 : 0} 1 ${xa} ${ya}" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><line x1="60" y1="60" x2="${xn}" y2="${yn}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="60" cy="60" r="4" fill="#fff"/><text x="60" y="88" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${n0(p)}</text><text x="60" y="99" text-anchor="middle" font-size="8" font-weight="600" fill="rgba(255,255,255,.7)">hPa</text></svg>`;
}
function tideMiniSVG(ctx, key) {
  const idx = []; ctx.keys.forEach((k, i) => { if (k.startsWith(key)) idx.push(i); });
  const vals = idx.map((i) => ctx.lvl[i]).filter((v) => v != null);
  if (vals.length < 4) return '';
  const lo = Math.min(...vals) - 0.05, hi = Math.max(...vals) + 0.05;
  const W = 300, Hh = 70;
  const X = (i) => (i / (idx.length - 1)) * W, Y = (v) => Hh - 6 - ((v - lo) / (hi - lo)) * (Hh - 14);
  let d = '';
  idx.forEach((ii, i) => { const v = ctx.lvl[ii]; if (v != null) d += `${d ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`; });
  const area = `${d}L${W},${Hh}L0,${Hh}Z`;
  const now = new Date();
  const i0 = idx[0];
  const fnow = (now - ctx.T[i0]) / 3600e3;
  const lvNow = levelAt(ctx, now);
  const dot = key === dayKey() && lvNow != null ? `<line x1="${X(fnow)}" y1="0" x2="${X(fnow)}" y2="${Hh}" stroke="rgba(255,255,255,.4)" stroke-width="1" stroke-dasharray="2 3"/><circle cx="${X(fnow)}" cy="${Y(lvNow)}" r="5" fill="#fff" style="filter:drop-shadow(0 0 5px rgba(255,255,255,.8))"/>` : '';
  const id = 'tg' + (++uid);
  return `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff" stop-opacity=".55"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#${id})"/><path d="${d}" stroke="#bfeaff" stroke-width="2.5" fill="none"/>${dot}</svg>`;
}

/* ---------------- Interfaz: hojas modales, avisos ---------------- */
const sheets = [];
let toastT;
function toast(msg, icon = 'check') {
  const t = $('#toast');
  t.firstElementChild.innerHTML = `${icon ? ic(icon, 'sm') : ''}<span>${esc(msg)}</span>`;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2400);
}
function openSheet({ title = '', left = null, right = null, body = '', onOpen, onClose, cls = '' }) {
  const el = document.createElement('div');
  el.className = 'sheet ' + cls;
  el.innerHTML = `<div class="grab"></div><div class="shead">${left ? `<button class="nbtn l" data-act="left">${left}</button>` : '<span style="min-width:70px"></span>'}<h2>${esc(title)}</h2>${right ? `<button class="nbtn r" data-act="right">${right}</button>` : `<button class="nbtn r" data-act="close" aria-label="Cerrar"><span class="nbtn circle">${ic('x')}</span></button>`}</div><div class="sbody">${body}</div>`;
  $('#sheets').appendChild(el);
  const rec = { el, onClose };
  sheets.push(rec);
  history.pushState({ sheet: sheets.length }, '');
  void el.offsetHeight; // fuerza el primer pintado fuera de pantalla para que la entrada se anime
  el.classList.add('on');
  $('#backdrop').classList.add('on');
  $('#app').classList.add('behind');
  $('[data-act="close"]', el)?.addEventListener('click', () => closeSheet());
  dragToClose(el);
  if (onOpen) onOpen(el);
  return el;
}
function closeSheet(fromPop) {
  const rec = sheets.pop();
  if (!rec) return;
  rec.el.classList.remove('on');
  if (!sheets.length) { $('#backdrop').classList.remove('on'); $('#app').classList.remove('behind'); }
  setTimeout(() => rec.el.remove(), 520);
  if (rec.onClose) rec.onClose();
  if (!fromPop) { skipPop++; history.back(); }
}
let skipPop = 0;
window.addEventListener('popstate', () => {
  if (skipPop) { skipPop--; return; }
  if (sheets.length) closeSheet(true);
});
$('#backdrop').addEventListener('click', () => closeSheet());
function dragToClose(el) {
  const handles = [$('.grab', el), $('.shead', el)];
  let y0 = null, dy = 0, t0 = 0;
  const down = (e) => {
    if (e.target.closest('button')) return;
    y0 = e.clientY; dy = 0; t0 = Date.now();
    el.classList.add('dragging');
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.clientY - y0);
    el.style.transform = `translateY(${dy}px)`;
  };
  const up = () => {
    if (y0 == null) return;
    el.classList.remove('dragging');
    el.style.transform = '';
    const v = dy / Math.max(1, Date.now() - t0);
    if (dy > 140 || (dy > 40 && v > 0.6)) closeSheet();
    y0 = null;
  };
  handles.forEach((h) => { h.addEventListener('pointerdown', down); h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up); });
}

/* ---------------- Pestañas ---------------- */
const state = { tab: 'hoy', ctx: null, rendered: {}, tideDay: null, spotFilter: 'todos', spotSort: 'mejor', spotQ: '', fishFilter: 'todos', fishQ: '', fishSort: 'num', diarioSeg: 'pescados', whoFilter: 'todos', me: null };
$$('[data-ic]').forEach((el) => { el.outerHTML = ic(el.dataset.ic); });
$('#fab').innerHTML = ic('plus');
$('#fab').addEventListener('click', () => openCatchForm());
$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  if (b.dataset.tab === state.tab) { $('#v-' + state.tab).scrollTo({ top: 0, behavior: 'smooth' }); return; }
  goTab(b.dataset.tab);
});
function goTab(tab) {
  state.tab = tab;
  haptic();
  $$('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $$('.view').forEach((v) => v.classList.toggle('on', v.dataset.view === tab));
  document.body.className = document.body.className.replace(/\btab-\w+/g, '').trim() + ' tab-' + tab;
  document.body.classList.toggle('dark-tab', tab === 'hoy');
  render(tab);
}
function render(tab) {
  if (tab === 'hoy') renderHoy();
  if (tab === 'mareas') renderMareas();
  if (tab === 'spots') renderSpots();
  if (tab === 'peces') renderPeces();
  if (tab === 'diario') renderDiario();
}
$$('.view').forEach((v) => v.addEventListener('scroll', () => v.classList.toggle('scrolled', v.scrollTop > (v.id === 'v-hoy' ? 8 : 36)), { passive: true }));
function navbar(title, right = '', left = '') {
  return `<div class="navbar"><div class="nleft">${left}</div><div class="ntitle">${esc(title)}</div><div class="nact">${right}</div></div><h1 class="ltitle">${esc(title)}</h1>`;
}

/* ---------------- HOY ---------------- */
function skyFor(ctx) {
  const i = ctx.now, t = new Date();
  const d = ctx.dayBy[dayKey()];
  const code = ctx.H.weather_code[i] || 0;
  const h = 3600e3;
  let sky;
  if (d && Math.abs(t - d.sr) < h) sky = ['#34407a', '#b4668c', '#f2a98a', '#ffd2a1'];
  else if (d && Math.abs(t - d.ss) < h * 1.1) sky = ['#26285e', '#7e4b8b', '#e2787c', '#f7b27a'];
  else if (d && (t < d.sr || t > d.ss)) sky = ['#070c1f', '#111d3d', '#1d2f5a', '#2a4373'];
  else if (code >= 95) sky = ['#20242e', '#323a4a', '#4a5568', '#606c80'];
  else if (code >= 51) sky = ['#3a4859', '#52637a', '#6f8399', '#8ea1b6'];
  else if (code === 3 || code === 45 || code === 48) sky = ['#4f6175', '#6f8299', '#93a5b9', '#b3c2d1'];
  else sky = ['#1765c8', '#3c8be0', '#6aade9', '#9fcdf1'];
  return { bg: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 32%, ${sky[2]} 70%, ${sky[3]} 100%)`, orb: sky[3] };
}
function hoySkeleton() {
  const sp = spotById(S.spot);
  return `<div class="hoy-top"><div class="brand"><img class="logo" src="icons/icon.svg" alt=""><div>TPTV<small>Te pesco TV</small></div></div><div style="display:flex;gap:8px"><button class="glass-btn" data-act="settings" aria-label="Ajustes">${ic('sliders')}</button></div></div><div class="hero"><button class="place" data-act="pick-spot">${esc(sp.nombre)}${ic('down')}</button><div class="muni">${esc(sp.municipio)}</div><div class="score" style="opacity:.4">–</div><div class="verdict">Mirando el mar…</div></div><div class="wgrid">${'<div class="wcard skeleton" style="height:130px"></div>'.repeat(6)}</div>`;
}
async function renderHoy(force) {
  const v = $('#v-hoy');
  const sp = spotById(S.spot);
  if (!v.dataset.spot || v.dataset.spot !== sp.id || !state.ctx) { v.innerHTML = hoySkeleton(); bindHoy(v); }
  v.dataset.spot = sp.id;
  let data;
  try { data = await loadSpot(sp, force); } catch (e) {
    v.innerHTML = `${hoySkeleton().split('<div class="wgrid">')[0]}<div class="wcard full" style="margin:0 16px;text-align:center;padding:30px 20px"><div class="gl-hero">${gl('signal')}</div><div class="sub" style="margin-top:8px">No hay conexión con el parte</div><div class="foot" style="margin-top:6px">Comprueba que tienes internet y vuelve a intentarlo.</div><button class="gbtn solid" style="margin:16px auto 0;width:200px" data-act="retry">${ic('refresh', 'sm')} Reintentar</button></div>`;
    bindHoy(v);
    return;
  }
  const ctx = buildCtx(data, sp);
  state.ctx = ctx;
  state.rendered.mareas = false;
  const html = hoyHTML(ctx);
  const sky = skyFor(ctx);
  v.style.setProperty('--sky', sky.bg);
  const st = v.scrollTop;
  v.innerHTML = html;
  v.scrollTop = st;
  // La nota cuenta hasta su valor al aparecer
  const scEl = $('.hero .score', v);
  if (scEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const target = ctx.scores[ctx.now].s, t0 = performance.now();
    const tick = (now) => { const p = Math.min(1, (now - t0) / 900); scEl.firstChild.textContent = n1(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  bindHoy(v);
  loadAllNow(force).then(() => { const r = $('#reco', v); if (r) r.innerHTML = recoHTML(ctx); if (state.tab === 'spots') renderSpots(); }).catch(() => { const r = $('#reco', v); if (r) r.innerHTML = '<div class="foot">Sin conexión para comparar pesqueros.</div>'; });
}
function hoyHTML(ctx) {
  const sp = ctx.sp, i = ctx.now, H = ctx.H, M = ctx.M;
  const sc = ctx.scores[i];
  const spd = H.wind_speed_10m[i], dir = H.wind_direction_10m[i], gust = H.wind_gusts_10m[i];
  const wave = M.wave_height ? M.wave_height[i] : null;
  const ts = ctx.hasTide ? tideState(ctx, i) : null;
  const today = ctx.dayBy[dayKey()] || ctx.days[1];
  const line = [windText(spd, dir) + ` · ${n0(spd)} km/h`, wave != null ? `Mar ${n1(wave)} m` : null, ts ? `Marea ${ts.t.toLowerCase()}` : null].filter(Boolean).join(' · ');
  // Avisos
  const alerts = [];
  const next12 = Array.from({ length: 12 }, (_, k) => i + k).filter((k) => k < ctx.keys.length);
  const maxG = Math.max(...next12.map((k) => H.wind_gusts_10m[k] || 0));
  const maxW = M.wave_height ? Math.max(...next12.map((k) => M.wave_height[k] || 0)) : 0;
  const storm = next12.some((k) => (H.weather_code[k] || 0) >= 95);
  const wtNow = windType(dir);
  if (storm) alerts.push(['r', 'Tormenta cerca: con la caña eres un pararrayos.']);
  if (spd > 50 || maxG > 70) alerts.push(['r', `Temporal${wtNow ? ' de ' + cap(wtNow) : ''}: rachas de ${n0(maxG)} km/h. Ni rocas ni espigones.`]);
  else if (maxG > 50) alerts.push(['o', `Rachas de ${n0(maxG)} km/h en las próximas horas.`]);
  if (maxW > 2 && (sp.tipo === 'roca' || sp.tipo === 'espigon')) alerts.push(['r', `Mar de ${n1(maxW)} m: peligro en rocas y espigones.`]);
  // Horas
  const hrs = [];
  const win24 = Array.from({ length: 25 }, (_, k) => i + k).filter((k) => k < ctx.keys.length);
  const topThr = Math.max(...win24.map((k) => ctx.scores[k].s)) - 0.5;
  win24.forEach((k, n) => {
    const s = ctx.scores[k].s;
    const w = wx(H.weather_code[k], H.is_day[k]);
    const hh = n === 0 ? 'Ahora' : ctx.keys[k].slice(11, 13);
    hrs.push(`<div class="hour ${s >= topThr ? 'best' : ''} ${n === 0 ? 'now' : ''}" style="--i:${n}"><span class="hh">${hh}</span><span class="em">${w.e}</span><span class="sc" style="color:${scoreColor(s)}">${n1(s)}</span><span class="bar"><i style="height:${s * 10}%;background:${scoreColor(s)}"></i></span><span class="wd">${arrowSVG((H.wind_direction_10m[k] + 180) % 360)}${n0(H.wind_speed_10m[k])}</span></div>`);
  });
  const bestToday = (today.best || []).filter((b) => b.to > new Date());
  const bestTxt = bestToday.length ? `Mejor rato hoy: <b>${fmtHM(bestToday[0].from)}–${fmtHM(bestToday[0].to)}</b> (${n1(bestToday[0].max)})` : (() => { const tm = ctx.days.find((d) => d.key > dayKey()); return tm && tm.best[0] ? `Mañana, mejor de <b>${fmtHM(tm.best[0].from)} a ${fmtHM(tm.best[0].to)}</b> (${n1(tm.best[0].max)})` : ''; })();
  // Viento
  const sheltered = wtNow && sp.abrigo && sp.abrigo.includes(wtNow);
  const exposed = wtNow && sp.abrigo && sp.abrigo.length && !sp.abrigo.includes(wtNow);
  const windFoot = sheltered ? `Resguardado del ${cap(wtNow)}` : exposed ? `Expuesto al ${cap(wtNow)}` : `Rachas ${n0(gust)} km/h`;
  // Oleaje
  const wper = M.wave_period ? M.wave_period[i] : null, wdir = M.wave_direction ? M.wave_direction[i] : null;
  // Marea
  const nextExt = ctx.ext.filter((e) => e.t > new Date()).slice(0, 2);
  const lvNow = levelAt(ctx, new Date());
  // Agua
  const sst = M.sea_surface_temperature ? M.sea_surface_temperature[i] : null;
  const cur = M.ocean_current_velocity ? M.ocean_current_velocity[i] : null, curDir = M.ocean_current_direction ? M.ocean_current_direction[i] : null;
  const curTxt = cur != null ? `Corriente ${n1(cur)} km/h hacia el ${sect(curDir)}${curDir > 45 && curDir < 135 ? ' (entrante)' : curDir > 225 && curDir < 315 ? ' (saliente)' : ''}` : '';
  const waterTip = sst == null ? '' : sst < 14 ? 'Fría: pesca lenta y fina' : sst < 17 ? 'Fresca: lubina y sargo' : sst < 21 ? 'Templada: se mueve todo' : sst < 24 ? 'Cálida: pelágicos y doradas' : 'Muy cálida: alba y noche';
  // Luna
  const ill = Astro.moonIllumination(new Date());
  const phaseN = Astro.phaseName(ill.phase);
  const tk = Astro.tideKind(ill.phase);
  const solToday = ctx.sol.filter((e) => dayKey(e.t) === today.key).sort((a, b) => a.t - b.t);
  const maj = solToday.filter((e) => e.k === 'maj').map((e) => fmtHM(e.t)).join(' · ');
  // Sol
  const dayLen = (today.ss - today.sr) / 60000;
  // Tiempo
  const w = wx(H.weather_code[i], H.is_day[i]);
  // Presión
  const pr = H.pressure_msl[i], pr3 = H.pressure_msl[i - 3];
  const pd = pr3 != null ? pr - pr3 : 0;
  const prTxt = pd <= -3.5 ? 'Cae rápido: cambio de tiempo' : pd < -0.8 ? 'Bajando: activa a los peces' : pd <= 0.8 ? 'Estable' : pd <= 3 ? 'Subiendo: se lo piensan' : 'Sube fuerte: cuesta más';
  // Factores
  const FX = [
    ['wind', 'Viento', sheltered ? 'Resguardado en este pesquero' : windText(spd, dir) + ` (${n0(spd)} km/h)`, sc.fx.wind],
    ['wave', 'Estado del mar', wave != null ? `${seaState(wave)} · ${n1(wave)} m` : 'Sin dato de oleaje', sc.fx.waves],
    ['tide', 'Movimiento de marea', ts ? ts.t : 'Sin dato', sc.fx.tide],
    ['sunrise', 'Luz', sc.fx.light === 1 ? 'Alba o atardecer: hora punta' : sc.fx.light > 0.8 ? 'De noche' : 'Pleno día', sc.fx.light],
    ['solunar', 'Solunar', sc.fx.sol === 1 ? 'Periodo mayor ahora' : sc.fx.sol > 0.8 ? 'Periodo menor ahora' : 'Fuera de periodo', sc.fx.sol],
    ['fullmoon', 'Fase lunar', `${phaseN} (${n0(ill.fraction * 100)} %)`, sc.fx.moon],
    ['gauge', 'Presión', prTxt, sc.fx.pres],
  ];
  // Días
  const futureDays = ctx.days.filter((d) => d.key >= dayKey()).slice(0, 7);
  const dayRows = futureDays.map((d) => {
    const di = dayInfo(d.key);
    const b = d.best[0];
    return `<button class="day" data-day="${d.key}" style="width:100%;text-align:left;color:#fff"><span class="dname">${di.rel || di.wd}</span><span class="dem">${wx(d.code).e}</span><span class="range"><i style="left:0;width:${d.max * 10}%;background:linear-gradient(90deg, ${scoreColor(d.max - 2.5)}, ${scoreColor(d.max)})"></i></span><span class="dsc">${b ? `<small>${fmtHM(b.from).slice(0, 2)}–${fmtHM(b.to).slice(0, 2)}h</small>` : ''}${n1(d.max)}</span></button>`;
  }).join('');
  const install = !standalone && Date.now() - (S.installHidden || 0) > 5 * 864e5
    ? `<div class="install-banner"><img src="icons/apple-touch-icon.png" alt=""><div class="grow" style="flex:1"><div class="t">Instala TPTV en el móvil</div><div class="s">${isIOS ? 'Pulsa Compartir y «Añadir a pantalla de inicio»' : 'Ábrela como una app, a pantalla completa'}</div></div>${isIOS ? '' : '<button class="btn small" data-act="install">Instalar</button>'}<button class="x" data-act="hide-install" aria-label="Ocultar">${ic('x', 'sm')}</button></div>` : '';

  return `
  <div class="sky-fx"><div class="orb" style="background:${skyFor(ctx).orb};left:-120px;top:-60px"></div><div class="orb" style="background:#ffffff;right:-160px;top:120px;opacity:.12"></div>
  <svg class="wave-deco" viewBox="0 0 1600 120" preserveAspectRatio="none"><path d="M0 60 Q 100 20 200 60 T 400 60 T 600 60 T 800 60 T 1000 60 T 1200 60 T 1400 60 T 1600 60 V120 H0Z" fill="#fff"/><path d="M0 80 Q 100 50 200 80 T 400 80 T 600 80 T 800 80 T 1000 80 T 1200 80 T 1400 80 T 1600 80 V120 H0Z" fill="#fff"/></svg></div>
  <div class="hoy-top"><div class="brand"><img class="logo" src="icons/icon.svg" alt=""><div>TPTV<small>Te pesco TV</small></div></div><div style="display:flex;gap:8px"><button class="glass-btn" data-act="refresh" aria-label="Actualizar">${ic('refresh')}</button><button class="glass-btn" data-act="settings" aria-label="Ajustes">${ic('sliders')}</button></div></div>
  <div class="hero">
    <button class="place" data-act="pick-spot">${esc(sp.nombre)}${ic('down')}</button>
    <div class="muni">${esc(sp.municipio)} · ${esc(D.zonas[sp.mar] || '')}</div>
    <div class="score">${n1(sc.s)}<small>/10</small></div>
    <div class="verdict">${verdict(sc.s)}</div>
    <div class="line">${esc(line)}</div>
    <div class="updated">Índice de pesca TPTV · ${ctx.stale ? 'Sin conexión, datos de ' : 'Actualizado '}${agoText(ctx.t)}</div>
  </div>
  ${install}
  ${alerts.map(([k, t]) => `<div class="alert-glass ${k === 'o' ? 'warn' : ''}">${ic('warn')}<span>${esc(t)}</span></div>`).join('')}
  <div class="wgrid">
    <div class="wcard full"><h3 class="line">${ic('clock')} Próximas 24 horas</h3><div class="hours">${hrs.join('')}</div>${bestTxt ? `<div class="legend-best">${gl('star', 'in')} ${bestTxt}</div>` : ''}</div>
    <div class="wcard sq"><h3>${ic('wind')} Viento</h3><div class="compass">${compassSVG(dir, spd, gust)}</div><div class="foot">${esc(windFoot)}</div></div>
    <div class="wcard sq"><h3>${ic('wave')} Oleaje</h3><div class="big">${n1(wave)}<small> m</small></div><div class="sub">${seaState(wave)}</div><div class="foot">${wper != null ? `Periodo ${n0(wper)} s · del ${sect(wdir)}` : 'Sin dato de oleaje en este punto'}</div></div>
    ${ctx.hasTide ? `<div class="wcard full"><button class="wbtn" data-goto="mareas" aria-label="Ver mareas"></button><h3>${ic('tide')} Marea</h3><div style="display:grid;grid-template-columns:1fr 112px;gap:12px;align-items:center"><div class="tide-mini">${tideMiniSVG(ctx, today.key)}</div><div>${nextExt.map((e) => `<div style="margin-bottom:6px"><div style="font-size:12px;opacity:.7;font-weight:600">${e.type === 'hi' ? 'PLEAMAR' : 'BAJAMAR'}</div><div style="font-size:20px;font-weight:600;font-family:var(--round)">${fmtHM(e.t)}</div></div>`).join('')}</div></div><div class="foot">${ts ? ts.t : ''}${lvNow != null ? ` · altura ${th(ctx, lvNow)}` : ''} · Mareas ${tk}</div></div>` : ''}
    <div class="wcard sq"><h3>${ic('temp')} Agua</h3><div class="big">${sst != null ? n0(sst) + '°' : '—'}</div><div class="sub">${sst != null ? 'en superficie' : 'sin dato'}</div><div class="foot">${esc(waterTip)}</div></div>
    <div class="wcard sq"><h3>${ic('moon')} Luna</h3><div class="moon-ill">${moonSVG(ill.phase)}<div><div class="sub" style="margin:0">${phaseN}</div><div style="font-size:13px;opacity:.8">${n0(ill.fraction * 100)} % iluminada</div></div></div><div class="foot">${maj ? `Periodos mayores: ${maj}` : `Mareas ${tk}`}</div></div>
    <div class="wcard sq"><h3>${ic('sunrise')} Sol</h3><div class="sun-arc">${sunArcSVG(today)}</div><div class="foot" style="display:flex;justify-content:space-between"><span>↑ ${fmtHM(today.sr)}</span><span>↓ ${fmtHM(today.ss)}</span></div><div style="font-size:12px;opacity:.7;margin-top:2px">${Math.floor(dayLen / 60)} h ${n0(dayLen % 60)} min de luz</div></div>
    <div class="wcard sq"><h3>${ic('sun')} Tiempo</h3><div style="display:flex;align-items:center;gap:8px"><span style="font-size:40px;line-height:1">${w.e}</span><span class="big">${n0(H.temperature_2m[i])}°</span></div><div class="sub">${w.t}</div><div class="foot">Sensación ${n0(H.apparent_temperature[i])}° · Lluvia ${n0(H.precipitation_probability[i] || 0)} %<br>UV ${n0(H.uv_index[i])} · Máx ${n0(today.tmax)}° mín ${n0(today.tmin)}°</div></div>
    <div class="wcard sq"><h3>${ic('gauge')} Presión</h3><div class="gauge">${gaugeSVG(pr)}</div><div class="foot">${esc(prTxt)}</div></div>
    <div class="wcard sq"><h3>${ic('current')} Corriente</h3><div class="big">${cur != null ? n1(cur) : '—'}<small> km/h</small></div><div class="sub">${cur != null ? 'hacia el ' + sect(curDir) : 'sin dato'}</div><div class="foot">${curDir != null ? (curDir > 45 && curDir < 135 ? 'Entra agua del Atlántico al Mediterráneo' : curDir > 225 && curDir < 315 ? 'Sale hacia el Atlántico' : 'Corriente cruzada') : ''}</div></div>
    <div class="wcard full"><h3 class="line">${ic('info')} Por qué este ${n1(sc.s)}</h3><div class="factors">${FX.map(([e, n, d, f]) => `<div class="fx"><span class="em">${gl(e)}</span><div><div class="n">${n}</div><div class="d">${esc(d)}</div></div><span class="meter"><i style="width:${f * 100}%;background:${scoreColor(f * 10)}"></i></span></div>`).join('')}</div></div>
    <div class="wcard full"><h3 class="line">${ic('pin')} Con este viento, mejor en…</h3><div class="reco" id="reco">${allNow ? recoHTML(ctx) : '<div class="foot">Comparando pesqueros…</div>'}</div></div>
    <div class="wcard full days"><h3 class="line">${ic('cal')} Próximos 7 días</h3>${dayRows}</div>
    <div class="wcard full"><h3>${ic('users')} Plan con los colegas</h3><div style="font-size:16px;font-weight:600;margin-bottom:4px">¿Quedada?</div><div class="foot" style="margin-bottom:12px">Manda el mejor rato al grupo.</div><div class="glass-actions"><button class="gbtn solid" data-act="plan">${ic('share', 'sm')} Compartir plan</button><button class="gbtn" data-act="kit">${ic('bag', 'sm')} Checklist</button></div></div>
  </div>
  <div class="disclaimer">Índice orientativo. Previsión de Open-Meteo (ECMWF, DWD, Météo-France). La marea es un modelo: no sirve para navegar.<br><a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Avisos oficiales de AEMET</a> · <a href="https://www.puertos.es/es-es/oceanografia/Paginas/portus.aspx" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Mareas oficiales</a></div>`;
}
function recoHTML(ctx) {
  if (!allNow) return '';
  const list = D.spots.map((s) => ({ s, q: quickScore(s, allNow.list[s.id], ctx) })).filter((x) => x.q != null).sort((a, b) => b.q - a.q).slice(0, 4);
  const wt = windType(ctx.H.wind_direction_10m[ctx.now]);
  return list.map(({ s, q }) => `<button data-spot="${s.id}"><span class="rk" style="color:${scoreColor(q)}">${n1(q)}</span><div style="flex:1;min-width:0"><div class="rn ell">${esc(s.nombre)}</div><div class="rs ell">${esc(s.municipio)} · ${tipoOf(s).n}${wt && s.abrigo && s.abrigo.includes(wt) ? ' · resguardado del ' + cap(wt) : ''}</div></div>${chev}</button>`).join('');
}
function bindHoy(v) {
  v.onclick = (e) => {
    const a = e.target.closest('[data-act],[data-day],[data-spot],[data-goto]');
    if (!a) return;
    if (a.dataset.goto) return goTab(a.dataset.goto);
    if (a.dataset.day) return openDaySheet(a.dataset.day);
    if (a.dataset.spot) { setSpot(a.dataset.spot); return; }
    const act = a.dataset.act;
    if (act === 'pick-spot') openSpotPicker();
    if (act === 'settings') openSettings();
    if (act === 'refresh') { a.style.transition = 'transform .6s'; a.style.transform = 'rotate(360deg)'; renderHoy(true).then(() => toast('Parte actualizado')); }
    if (act === 'retry') renderHoy(true);
    if (act === 'plan') openPlan();
    if (act === 'kit') openKit();
    if (act === 'install') doInstall();
    if (act === 'hide-install') { S.installHidden = Date.now(); saveS(); a.closest('.install-banner').remove(); }
  };
}
function setSpot(id, go = true) {
  S.spot = id; saveS();
  state.ctx = null;
  state.rendered.mareas = false;
  haptic();
  if (sheets.length) { while (sheets.length) closeSheet(); }
  if (go && state.tab !== 'hoy' && state.tab !== 'mareas') goTab('hoy'); else render(state.tab);
  $('#v-hoy').scrollTo({ top: 0 });
}

function openDaySheet(key) {
  const ctx = state.ctx;
  if (!ctx) return;
  const d = ctx.dayBy[key], di = dayInfo(key);
  const rows = ctx.keys.map((k, i) => ({ k, i })).filter(({ k }) => k.startsWith(key) && +k.slice(11, 13) >= 5).map(({ k, i }) => {
    const s = ctx.scores[i].s, w = wx(ctx.H.weather_code[i], ctx.H.is_day[i]);
    const tst = ctx.hasTide ? (ctx.rate[i] > 0 ? '↑' : '↓') : '';
    return `<div class="cell"><span style="width:44px;font-weight:600;font-family:var(--round)">${k.slice(11, 16)}</span><span style="font-size:22px">${w.e}</span><div class="grow"><div class="t" style="font-size:15px">${windText(ctx.H.wind_speed_10m[i], ctx.H.wind_direction_10m[i])} ${n0(ctx.H.wind_speed_10m[i])} km/h</div><div class="s">${ctx.M.wave_height ? 'Mar ' + n1(ctx.M.wave_height[i]) + ' m · ' : ''}${tst ? 'Marea ' + tst + ' ' : ''}${n0(ctx.H.temperature_2m[i])}°</div></div><span class="live" style="background:${scoreColor(s)}">${n1(s)}</span></div>`;
  }).join('');
  const ext = d.ext.map((e) => `<div class="ext-card"><div class="ei ${e.type}">${ic(e.type === 'hi' ? 'tide' : 'tide')}</div><div><div class="et">${e.type === 'hi' ? 'Pleamar' : 'Bajamar'}</div><div class="ev">${fmtHM(e.t)}</div><div class="eh">${th(ctx, e.h)}</div></div></div>`).join('');
  openSheet({
    title: `${cap(di.wdl)} ${di.d}`,
    body: `<div class="stitle">${di.rel || cap(di.wdl)} ${di.d} de ${di.mesl}</div><div class="ssub">${esc(ctx.sp.nombre)} · ${wx(d.code).t} · ${n0(d.tmin)}–${n0(d.tmax)}° · viento hasta ${n0(d.wmax)} km/h</div>
    ${d.best.length ? `<div class="callout g">${ic('star')}<div><b>Mejor rato: ${fmtHM(d.best[0].from)}–${fmtHM(d.best[0].to)}</b> con un ${n1(d.best[0].max)}${d.best[1] ? `<br>También ${fmtHM(d.best[1].from)}–${fmtHM(d.best[1].to)} (${n1(d.best[1].max)})` : ''}</div></div>` : ''}
    ${ext ? `<div class="sec-h">Mareas</div><div class="extremes">${ext}</div>` : ''}
    <div class="sec-h">Hora a hora</div><div class="group">${rows}</div>
    <div style="padding:20px 16px 0"><button class="btn" data-plan="${key}">${ic('share', 'sm')} Compartir plan de este día</button></div>`,
    onOpen: (el) => { $('[data-plan]', el).onclick = () => openPlan(key); },
  });
}

/* ---------------- Selector de pesquero ---------------- */
function spotRowsByZone(list, current, extra = () => '') {
  const zones = Object.keys(D.zonas);
  return zones.map((z) => {
    const items = list.filter((s) => s.mar === z).sort((a, b) => a.lon - b.lon);
    if (!items.length) return '';
    return `<div class="sec-h">${esc(D.zonas[z])}</div><div class="group icons">${items.map((s) => `<button class="cell" data-pick="${s.id}"><span class="ibox" style="background:${tipoOf(s).c}">${tipoIc(s)}</span><div class="grow"><div class="t ell">${esc(s.nombre)}</div><div class="s ell">${esc(s.municipio)} · ${tipoOf(s).n}</div></div>${extra(s)}${s.id === current ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button>`).join('')}</div>`;
  }).join('');
}
function openSpotPicker() {
  openSheet({
    title: 'Elige pesquero',
    body: `<div class="search" style="margin-top:6px">${ic('search', 'sm')}<input type="search" placeholder="Buscar pesquero o pueblo" id="sp-q"></div><div class="group icons"><button class="cell" data-near="1"><span class="ibox" style="background:var(--tint)">${ic('loc')}</span><div class="grow"><div class="t">El más cercano a mí</div><div class="s">Usa la ubicación del móvil</div></div></button></div><div id="sp-list">${spotRowsByZone(D.spots, S.spot)}</div>`,
    onOpen: (el) => {
      const q = $('#sp-q', el);
      q.oninput = () => {
        const t = norm(q.value);
        $('#sp-list', el).innerHTML = spotRowsByZone(D.spots.filter((s) => norm(s.nombre + ' ' + s.municipio).includes(t)), S.spot);
      };
      el.onclick = (e) => {
        const p = e.target.closest('[data-pick]');
        if (p) setSpot(p.dataset.pick);
        if (e.target.closest('[data-near]')) nearestSpot().then((s) => s && setSpot(s.id));
      };
    },
  });
}
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function locate() {
  return new Promise((res) => {
    if (!navigator.geolocation) { toast('Este móvil no da la ubicación', 'warn'); return res(null); }
    navigator.geolocation.getCurrentPosition((p) => { state.me = { lat: p.coords.latitude, lon: p.coords.longitude }; res(state.me); },
      () => { toast('No se pudo obtener la ubicación', 'warn'); res(null); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
}
async function nearestSpot() {
  const me = await locate();
  if (!me) return null;
  const s = D.spots.map((x) => ({ x, d: haversine(me.lat, me.lon, x.lat, x.lon) })).sort((a, b) => a.d - b.d)[0];
  if (s.d > 80) toast(`Estás a ${n0(s.d)} km del Estrecho: te pongo el más cercano`, 'info');
  return s.x;
}

/* ---------------- MAREAS ---------------- */
async function renderMareas() {
  const v = $('#v-mareas');
  const sp = spotById(S.spot);
  if (!state.ctx || state.ctx.sp.id !== sp.id) {
    v.innerHTML = navbar('Mareas') + `<div class="lsub">${esc(sp.nombre)}</div><div class="tide-card"><div class="skeleton" style="height:220px;background-color:var(--fill)"></div></div>`;
    try { const data = await loadSpot(sp); state.ctx = buildCtx(data, sp); } catch (e) { v.innerHTML = navbar('Mareas') + '<div class="empty"><div class="big">' + gl('signal') + '</div><b>Sin conexión</b>Hace falta internet la primera vez.</div>'; return; }
  }
  const ctx = state.ctx;
  const futureDays = ctx.days.filter((d) => d.key >= dayKey()).slice(0, 7);
  if (!state.tideDay || !futureDays.some((d) => d.key === state.tideDay)) state.tideDay = futureDays[0].key;
  const d = ctx.dayBy[state.tideDay];
  const ill = d.ill, tk = Astro.tideKind(ill.phase);
  const isToday = d.key === dayKey();
  const lvNow = isToday ? levelAt(ctx, new Date()) : null;
  const ts = isToday ? tideState(ctx, ctx.now) : null;
  const dayIdx = ctx.keys.map((k, i) => (k.startsWith(d.key) ? i : -1)).filter((i) => i >= 0);
  const vals = dayIdx.map((i) => ctx.lvl[i]).filter((x) => x != null);
  const amp = vals.length ? Math.max(...vals) - Math.min(...vals) : null;
  const sol = ctx.sol.filter((e) => dayKey(e.t) === d.key).sort((a, b) => a.t - b.t);
  const pct = (t) => clamp((t - d.mid) / 864e5 * 100, 0, 100);
  const solBar = sol.map((e) => {
    const w = e.k === 'maj' ? 120 : 80;
    const a = pct(new Date(e.t.getTime() - w / 2 * 60000)), b = pct(new Date(e.t.getTime() + w / 2 * 60000));
    return `<i class="${e.k === 'maj' ? 'maj' : 'min'}" style="left:${a}%;width:${b - a}%"></i>`;
  }).join('') + (isToday ? `<i class="nowl" style="left:${pct(new Date())}%"></i>` : '');
  const zoneNote = D.mareasZona[ctx.sp.mar] || '';
  v.innerHTML = navbar('Mareas', `<button class="nbtn" data-act="pick-spot">${ic('pin', 'sm')}</button>`) + `
    <button class="lsub" data-act="pick-spot" style="display:flex;align-items:center;gap:4px;color:var(--tint);font-weight:500">${esc(ctx.sp.nombre)} ${ic('down', 'xs')}</button>
    <div class="days-scroll">${futureDays.map((x) => { const di = dayInfo(x.key); return `<button class="dpill ${x.key === d.key ? 'on' : ''}" data-tday="${x.key}"><span class="w">${di.rel === 'Hoy' ? 'Hoy' : di.wd}</span><span class="n">${di.d}</span><span class="m">${x.ill && Astro.tideKind(x.ill.phase) === 'vivas' ? gl('wave', 'in') : '·'}</span></button>`; }).join('')}</div>
    ${ctx.hasTide ? `<div class="tide-card">
      <div class="th"><div><div class="state">${isToday ? 'Ahora' : cap(dayInfo(d.key).wdl) + ' ' + dayInfo(d.key).d}</div><div class="now">${isToday && lvNow != null ? th(ctx, lvNow) : (amp != null ? n2(amp) + ' m' : '—')}</div></div><div class="state" style="text-align:right">${isToday && ts ? `${ts.up ? '↑' : '↓'} ${ts.t}` : 'amplitud del día'}<br>Mareas ${tk}</div></div>
      <div class="tide-chart" id="tchart">${tideChartSVG(ctx, d)}</div>
      <div class="tide-read" id="tread">Desliza el dedo por la curva para ver la altura</div>
    </div>
    <div class="sec-h">Pleamares y bajamares</div>
    <div class="extremes">${d.ext.map((e) => `<div class="ext-card ${isToday && e.t < new Date() ? 'past' : ''}"><div class="ei ${e.type}">${e.type === 'hi' ? arrowSVG(0, 16) : arrowSVG(180, 16)}</div><div><div class="et">${e.type === 'hi' ? 'Pleamar' : 'Bajamar'}</div><div class="ev">${fmtHM(e.t)}</div><div class="eh">${th(ctx, e.h)}</div></div></div>`).join('') || '<div class="empty" style="grid-column:1/-1">Sin extremos claros este día</div>'}</div>` : `<div class="callout o">${ic('warn')}<div>No hay datos de marea del modelo para este punto. Prueba con otro pesquero cercano.</div></div>`}
    <div class="sec-h">Luna y sol</div>
    <div class="info-grid">
      <div class="info-tile" style="display:flex;gap:10px;align-items:center"><div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.2))">${moonSVG(ill.phase, 46)}</div><div><div class="k">Fase</div><div style="font-weight:600;font-size:15px;margin-top:2px">${Astro.phaseName(ill.phase)}</div><div class="x">${n0(ill.fraction * 100)} % iluminada</div></div></div>
      <div class="info-tile"><div class="k">${ic('tide', 'xs')} Coeficiente</div><div class="val">${tk === 'vivas' ? 'Vivas' : tk === 'muertas' ? 'Muertas' : 'Medias'}</div><div class="x">${tk === 'vivas' ? 'Más corriente y más movimiento' : tk === 'muertas' ? 'Poca corriente, agua más tranquila' : 'Movimiento normal'}</div></div>
      <div class="info-tile"><div class="k">${ic('moon', 'xs')} Luna</div><div class="val" style="font-size:18px">↑ ${fmtHM(d.moon.rise)}</div><div class="x">↓ ${fmtHM(d.moon.set)}</div></div>
      <div class="info-tile"><div class="k">${ic('sunrise', 'xs')} Sol</div><div class="val" style="font-size:18px">↑ ${fmtHM(d.sr)}</div><div class="x">↓ ${fmtHM(d.ss)}</div></div>
    </div>
    <div class="sec-h">Tabla solunar</div>
    <div class="tide-card"><div class="solunar">${solBar}</div><div class="sol-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      <div style="margin-top:10px">${sol.map((e) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:.5px solid var(--sep);font-size:15px"><span>${e.k === 'maj' ? '<i class="sdot maj"></i>Periodo mayor' : '<i class="sdot min"></i>Periodo menor'} <span style="color:var(--label2);font-size:13px">· ${e.n}</span></span><b style="font-family:var(--round)">${fmtHM(new Date(e.t.getTime() - (e.k === 'maj' ? 60 : 40) * 60000))}–${fmtHM(new Date(e.t.getTime() + (e.k === 'maj' ? 60 : 40) * 60000))}</b></div>`).join('')}</div>
    </div>
    <div class="sec-f">Mayor: luna arriba o abajo (2 h). Menor: sale o se pone (1 h). Sirve para elegir entre dos ratos buenos.</div>
    ${zoneNote ? `<div class="sec-h">La marea en ${esc(D.zonas[ctx.sp.mar])}</div><div class="group"><div class="prose">${zoneNote}</div></div>` : ''}
    <div class="sec-f" style="padding-bottom:10px">Modelo de Open-Meteo (~8 km). Alturas desde la bajamar más baja de la semana. Horas oficiales: Puertos del Estado.</div>`;
  v.onclick = (e) => {
    const t = e.target.closest('[data-tday]');
    if (t) { state.tideDay = t.dataset.tday; haptic(); renderMareas(); return; }
    if (e.target.closest('[data-act="pick-spot"]')) openSpotPicker();
  };
  scrubChart(ctx, d);
  state.rendered.mareas = true;
}
function tideChartSVG(ctx, d) {
  const W = 340, Hh = 190, pt = 26, pb = 22;
  const start = d.mid.getTime(), end = start + 864e5;
  const idx = ctx.T.map((t, i) => [t.getTime(), i]).filter(([t]) => t >= start - 3600e3 && t <= end + 3600e3).map(([, i]) => i);
  const vals = idx.map((i) => ctx.lvl[i]).filter((v) => v != null);
  if (!vals.length) return '';
  const lo = Math.min(...vals) - 0.08, hi = Math.max(...vals) + 0.08;
  const X = (t) => ((t - start) / 864e5) * W;
  const Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (Hh - pt - pb);
  let path = '';
  for (let m = 0; m <= 24 * 60; m += 10) {
    const t = new Date(start + m * 60000);
    const v = levelAt(ctx, t);
    if (v != null) path += `${path ? 'L' : 'M'}${X(t).toFixed(1)},${Y(v).toFixed(1)}`;
  }
  const id = 'tc' + (++uid);
  const night = `<rect x="0" y="0" width="${X(d.sr)}" height="${Hh - pb}" fill="var(--fill)"/><rect x="${X(d.ss)}" y="0" width="${W - X(d.ss)}" height="${Hh - pb}" fill="var(--fill)"/>`;
  const grid = [0, 6, 12, 18, 24].map((h) => `<line x1="${W * h / 24}" y1="${pt - 8}" x2="${W * h / 24}" y2="${Hh - pb}" stroke="var(--sep)" stroke-width=".6"/><text class="lbl" x="${clamp(W * h / 24, 8, W - 8)}" y="${Hh - 6}" text-anchor="middle">${pad(h)}</text>`).join('');
  const zero = lo < 0 && hi > 0 ? `<line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--label3)" stroke-dasharray="3 4" stroke-width=".8"/>` : '';
  const ext = d.ext.map((e) => { const x = X(e.t), y = Y(e.h); const up = e.type === 'hi'; return `<circle cx="${x}" cy="${y}" r="4" fill="var(--bg2)" stroke="${up ? 'var(--tint)' : 'var(--orange)'}" stroke-width="2.5"/><text class="ext" x="${clamp(x, 18, W - 18)}" y="${up ? y - 10 : y + 18}" text-anchor="middle" fill="${up ? 'var(--tint)' : 'var(--orange)'}">${fmtHM(e.t)}</text>`; }).join('');
  const now = new Date();
  const nowL = now >= start && now <= end ? (() => { const v = levelAt(ctx, now); return `<line x1="${X(now)}" x2="${X(now)}" y1="${pt - 8}" y2="${Hh - pb}" stroke="var(--label)" stroke-width="1.2"/>${v != null ? `<circle cx="${X(now)}" cy="${Y(v)}" r="6" fill="var(--tint)" stroke="var(--bg2)" stroke-width="2.5"/>` : ''}`; })() : '';
  return `<svg viewBox="0 0 ${W} ${Hh}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tint)" stop-opacity=".45"/><stop offset="1" stop-color="var(--tint2)" stop-opacity=".04"/></linearGradient></defs>${night}${grid}${zero}<path d="${path}L${W},${Hh - pb}L0,${Hh - pb}Z" fill="url(#${id})"/><path d="${path}" stroke="var(--tint)" stroke-width="2.6" fill="none" stroke-linecap="round"/>${ext}${nowL}<g id="scrub" style="display:none"><line y1="${pt - 8}" y2="${Hh - pb}" stroke="var(--label2)" stroke-width="1" stroke-dasharray="2 2"/><circle r="5.5" fill="var(--bg2)" stroke="var(--label)" stroke-width="2"/></g></svg>`;
}
function scrubChart(ctx, d) {
  const box = $('#tchart');
  if (!box) return;
  const svg = $('svg', box), g = $('#scrub', box), read = $('#tread');
  if (!svg || !g) return;
  const W = 340, Hh = 190, pt = 26, pb = 22;
  const vals = ctx.keys.map((k, i) => (k.startsWith(d.key) ? ctx.lvl[i] : null)).filter((v) => v != null);
  const lo = Math.min(...vals) - 0.08, hi = Math.max(...vals) + 0.08;
  const Y = (v) => pt + (1 - (v - lo) / (hi - lo)) * (Hh - pt - pb);
  const show = (e) => {
    const r = svg.getBoundingClientRect();
    const fx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const t = new Date(d.mid.getTime() + fx * 864e5);
    const v = levelAt(ctx, t);
    if (v == null) return;
    const x = fx * W;
    g.style.display = '';
    $('line', g).setAttribute('x1', x); $('line', g).setAttribute('x2', x);
    $('circle', g).setAttribute('cx', x); $('circle', g).setAttribute('cy', Y(v));
    const up = levelAt(ctx, new Date(t.getTime() + 600000)) > v;
    read.innerHTML = `<b>${fmtHM(t)}</b> · ${th(ctx, v)} · ${up ? 'subiendo ↑' : 'bajando ↓'}`;
  };
  svg.addEventListener('pointerdown', show);
  svg.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType !== 'mouse') show(e); else show(e); });
  svg.addEventListener('pointerleave', () => { g.style.display = 'none'; });
}

/* ---------------- PESQUEROS (mapa + lista) ---------------- */
function makeMap(el, { center, zoom = 10, pins = [], onPin, selected, small = false }) {
  // Capas sin clave: satélite de Esri con nombres encima, o el mapa de OpenStreetMap
  const LAYERS = {
    sat: { url: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`, over: (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`, attr: 'Imágenes © Esri, Maxar, Earthstar Geographics' },
    map: { url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`, attr: '© colaboradores de OpenStreetMap' },
  };
  let layer = LAYERS[S.mapLayer] ? S.mapLayer : 'sat';
  const world = document.createElement('div');
  world.className = 'world';
  el.innerHTML = '';
  el.appendChild(world);
  el.insertAdjacentHTML('beforeend', `${small ? '' : '<div class="map-ctl"><button data-z="1" aria-label="Acercar">+</button><button data-z="-1" aria-label="Alejar">−</button><button data-z="me" aria-label="Mi ubicación" style="font-size:0">' + ic('loc', 'sm') + '</button><button data-z="layer" aria-label="Cambiar capa" style="font-size:0">' + ic('layers', 'sm') + '</button></div>'}<div class="map-attr"></div>`);
  const attrEl = $('.map-attr', el);
  attrEl.textContent = LAYERS[layer].attr;
  const proj = (lat, lon, z) => { const s = 256 * 2 ** z, sin = Math.sin(lat * Math.PI / 180); return [(lon + 180) / 360 * s, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s]; };
  let z = zoom;
  let [cx, cy] = proj(center[0], center[1], z);
  const tiles = new Map();
  const clearTiles = () => { tiles.forEach((imgs) => imgs.forEach((i) => i.remove())); tiles.clear(); };
  let raf = 0;
  const draw = () => {
    raf = 0;
    const w = el.clientWidth, h = el.clientHeight;
    const left = cx - w / 2, top = cy - h / 2;
    world.style.transform = `translate(${-left}px, ${-top}px)`;
    const x0 = Math.floor(left / 256), x1 = Math.floor((left + w) / 256), y0 = Math.floor(top / 256), y1 = Math.floor((top + h) / 256);
    const need = new Set();
    const n = 2 ** z;
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      const key = `${z}/${x}/${y}`;
      need.add(key);
      if (!tiles.has(key)) {
        const L = LAYERS[layer], xx = ((x % n) + n) % n;
        const imgs = [L.url(z, xx, y)].concat(L.over ? [L.over(z, xx, y)] : []).map((src) => {
          const img = new Image();
          img.decoding = 'async';
          img.alt = '';
          img.src = src;
          img.style.left = x * 256 + 'px'; img.style.top = y * 256 + 'px';
          world.insertBefore(img, world.querySelector('.pin'));
          return img;
        });
        tiles.set(key, imgs);
      }
    }
    for (const [k, imgs] of tiles) if (!need.has(k)) { imgs.forEach((i) => i.remove()); tiles.delete(k); }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const pinEls = [];
  const placePins = () => {
    pinEls.forEach((p) => p.remove());
    pinEls.length = 0;
    for (const p of pins) {
      const [x, y] = proj(p.lat, p.lon, z);
      const d = document.createElement('button');
      d.className = 'pin' + (p.id === selected ? ' sel' : '') + (p.me ? ' me' : '');
      d.style.left = x + 'px'; d.style.top = y + 'px';
      d.innerHTML = `<b style="background:${p.color || 'var(--tint)'}"><span>${p.label || ''}</span></b>`;
      d.setAttribute('aria-label', p.name || '');
      if (p.id && onPin) d.addEventListener('click', (e) => { e.stopPropagation(); onPin(p.id); });
      world.appendChild(d);
      pinEls.push(d);
    }
  };
  const setZoom = (nz, fx = el.clientWidth / 2, fy = el.clientHeight / 2) => {
    nz = clamp(nz, 8, 16);
    if (nz === z) return;
    const left = cx - el.clientWidth / 2, top = cy - el.clientHeight / 2;
    const k = 2 ** (nz - z);
    const wx0 = (left + fx) * k, wy0 = (top + fy) * k;
    cx = wx0 - fx + el.clientWidth / 2; cy = wy0 - fy + el.clientHeight / 2;
    z = nz;
    clearTiles();
    placePins(); draw();
  };
  // Arrastrar y pellizcar
  const ptrs = new Map();
  let pinch0 = null, moved = false;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.map-ctl,.pin')) return;
    el.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    moved = false;
    el.classList.add('grabbing');
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z }; }
  });
  el.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    const prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 1) { cx -= e.clientX - prev[0]; cy -= e.clientY - prev[1]; moved = true; schedule(); }
    else if (ptrs.size === 2 && pinch0) {
      const [a, b] = [...ptrs.values()];
      const dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const nz = Math.round(pinch0.z + Math.log2(dd / pinch0.d));
      if (nz !== z) { const rc = el.getBoundingClientRect(); setZoom(nz, (a[0] + b[0]) / 2 - rc.left, (a[1] + b[1]) / 2 - rc.top); }
    }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; if (!ptrs.size) el.classList.remove('grabbing'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); const rc = el.getBoundingClientRect(); setZoom(z + (e.deltaY < 0 ? 1 : -1), e.clientX - rc.left, e.clientY - rc.top); }, { passive: false });
  el.addEventListener('dblclick', (e) => { const rc = el.getBoundingClientRect(); setZoom(z + 1, e.clientX - rc.left, e.clientY - rc.top); });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-z]');
    if (!b) return;
    e.stopPropagation();
    if (b.dataset.z === 'layer') { layer = layer === 'sat' ? 'map' : 'sat'; S.mapLayer = layer; saveS(); attrEl.textContent = LAYERS[layer].attr; clearTiles(); draw(); return; }
    if (b.dataset.z === 'me') {
      const me = await locate();
      if (!me) return;
      pins = pins.filter((p) => !p.me).concat([{ lat: me.lat, lon: me.lon, me: true, name: 'Tú' }]);
      [cx, cy] = proj(me.lat, me.lon, z);
      placePins(); draw();
      return;
    }
    setZoom(z + +b.dataset.z);
  });
  placePins();
  requestAnimationFrame(draw);
  new ResizeObserver(schedule).observe(el);
  return { setPins(p, sel) { pins = p; selected = sel; placePins(); }, center(lat, lon, nz) { if (nz) { z = nz; clearTiles(); } [cx, cy] = proj(lat, lon, z); placePins(); draw(); } };
}
function spotLive(s, ctx) {
  const q = allNow ? quickScore(s, allNow.list[s.id], ctx) : null;
  return q;
}
function renderSpots() {
  const v = $('#v-spots');
  const ctx = state.ctx && state.ctx.sp ? state.ctx : null;
  const wt = ctx ? windType(ctx.H.wind_direction_10m[ctx.now]) : null;
  let list = D.spots.slice();
  const q = norm(state.spotQ);
  if (q) list = list.filter((s) => norm(`${s.nombre} ${s.municipio} ${s.tipo} ${(s.especies || []).join(' ')}`).includes(q));
  const F = state.spotFilter;
  if (F === 'favs') list = list.filter((s) => S.favs.includes(s.id));
  else if (F === 'abrigo') list = list.filter((s) => wt && s.abrigo && s.abrigo.includes(wt));
  else if (TIPOS[F]) list = list.filter((s) => s.tipo === F);
  const withQ = list.map((s) => ({ s, q: spotLive(s, ctx), d: state.me ? haversine(state.me.lat, state.me.lon, s.lat, s.lon) : null }));
  if (state.spotSort === 'mejor') withQ.sort((a, b) => (b.q ?? -1) - (a.q ?? -1));
  if (state.spotSort === 'cerca') withQ.sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9));
  const cell = ({ s, q: sc, d }) => `<button class="cell" data-spot="${s.id}"><span class="spot-ic" style="background:${tipoOf(s).c}">${tipoIc(s)}</span><div class="grow"><div class="t ell">${S.favs.includes(s.id) ? gl('star', 'in') + ' ' : ''}${esc(s.nombre)}</div><div class="s ell">${esc(s.municipio)} · ${tipoOf(s).n}${d != null ? ` · ${n1(d)} km` : ''}</div>${wt && s.abrigo && s.abrigo.includes(wt) ? `<div class="s" style="color:var(--green);font-weight:600">Resguardado del ${cap(wt)}</div>` : ''}</div>${sc != null ? `<span class="live" style="background:${scoreColor(sc)}">${n1(sc)}</span>` : ''}${chev}</button>`;
  let listHTML;
  if (!withQ.length) listHTML = `<div class="empty"><div class="big">${gl('rod')}</div><b>Nada por aquí</b>${F === 'favs' ? 'Marca pesqueros con la estrella para tenerlos a mano.' : 'Prueba con otro filtro.'}</div>`;
  else if (state.spotSort === 'zona') {
    listHTML = Object.keys(D.zonas).map((z) => { const it = withQ.filter((x) => x.s.mar === z).sort((a, b) => a.s.lon - b.s.lon); return it.length ? `<div class="sec-h">${esc(D.zonas[z])}</div><div class="group">${it.map(cell).join('')}</div>` : ''; }).join('');
  } else listHTML = `<div class="group" style="margin-top:12px">${withQ.map(cell).join('')}</div>`;
  const filters = [['todos', 'Todos'], ['favs', gl('star', 'in') + ' Favoritos'], ['abrigo', wt ? `${gl('shield', 'in')} Sin ${cap(wt)}` : gl('shield', 'in') + ' Resguardados'], ...Object.entries(TIPOS).map(([k, t]) => [k, `${ic(t.i, 'xs')} ${t.n}`])];
  const firstRender = !v.dataset.built;
  if (firstRender) {
    v.innerHTML = navbar('Pesqueros', `<button class="nbtn" data-act="near">${ic('loc', 'sm')}</button>`) + `
      <div class="lsub">${D.spots.length} pesqueros de Zahara a Manilva${wt && ctx ? ` · hoy sopla ${cap(wt)}` : ''}</div>
      <div class="search">${ic('search', 'sm')}<input type="search" placeholder="Pesquero, pueblo o especie" id="spq" value="${esc(state.spotQ)}"></div>
      <div class="map" id="map"></div>
      <div class="chips" id="spf" style="margin-top:12px"></div>
      <div class="seg" id="sps" style="margin-top:8px"></div>
      <div id="splist"></div>
      <div class="sec-f" style="padding-top:14px">Nota de ahora mismo. Respeta las zonas protegidas y llévate tu basura.</div>`;
    v.dataset.built = '1';
    state.map = makeMap($('#map', v), { center: [36.07, -5.55], zoom: 10, pins: [], onPin: (id) => openSpotSheet(id) });
    $('#spq', v).addEventListener('input', (e) => { state.spotQ = e.target.value; renderSpots(); });
    v.addEventListener('click', (e) => {
      const f = e.target.closest('[data-f]');
      if (f) { state.spotFilter = f.dataset.f; haptic(); renderSpots(); return; }
      const so = e.target.closest('[data-sort]');
      if (so) { state.spotSort = so.dataset.sort; haptic(); if (state.spotSort === 'cerca' && !state.me) locate().then(() => renderSpots()); renderSpots(); return; }
      const s = e.target.closest('[data-spot]');
      if (s) { openSpotSheet(s.dataset.spot); return; }
      if (e.target.closest('[data-act="near"]')) { state.spotSort = 'cerca'; locate().then(() => renderSpots()); }
    });
    if (!allNow || Date.now() - allNow.t > TTL || !D.spots.every((s) => allNow.list[s.id])) loadAllNow().then(() => renderSpots()).catch(() => {});
  }
  $('#spf', v).innerHTML = filters.map(([k, t]) => `<button class="chip ${F === k ? 'on' : ''}" data-f="${k}">${t}</button>`).join('');
  const sorts = [['mejor', 'Mejor ahora'], ['zona', 'Por zona'], ['cerca', 'Cerca de mí']];
  const si = sorts.findIndex(([k]) => k === state.spotSort);
  $('#sps', v).innerHTML = `<span class="thumb" style="width:calc((100% - 4px)/3);transform:translateX(${si * 100}%)"></span>` + sorts.map(([k, t]) => `<button class="${k === state.spotSort ? 'on' : ''}" data-sort="${k}">${t}</button>`).join('');
  $('#splist', v).innerHTML = listHTML;
  state.map.setPins(list.map((s) => { const sc = spotLive(s, ctx); return { id: s.id, lat: s.lat, lon: s.lon, name: s.nombre, color: sc != null ? scoreColor(sc) : tipoOf(s).c, label: sc != null ? Math.round(sc) : '' }; }), S.spot);
}
function openSpotSheet(id) {
  const s = spotById(id);
  const ctx = state.ctx;
  const live = allNow && allNow.list[s.id];
  const sc = spotLive(s, ctx);
  const fav = S.favs.includes(s.id);
  const species = (s.especies || []).map(fishById).filter(Boolean);
  const dirUrl = isIOS ? `https://maps.apple.com/?daddr=${s.lat},${s.lon}&dirflg=d` : `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`;
  const w = live && live.w;
  const tide = D.zonas[s.mar];
  openSheet({
    title: '',
    left: `<span style="display:flex;align-items:center;gap:4px">${ic('star', 'sm')}${fav ? 'Quitar' : 'Favorito'}</span>`,
    body: `<div class="stitle">${esc(s.nombre)}</div><div class="ssub">${esc(s.municipio)} · ${esc(tide || '')} · ${tipoOf(s).n}</div>
    <div class="map" id="smap" style="height:200px"></div>
    ${sc != null ? `<div class="callout ${sc >= 7 ? 'g' : sc >= 5 ? 'b' : 'o'}"><span class="live" style="background:${scoreColor(sc)}">${n1(sc)}</span><div><b>${verdict(sc)} ahora</b><br>${w ? `${windText(w.wind_speed_10m, w.wind_direction_10m)} · ${n0(w.wind_speed_10m)} km/h` : ''}${live.s && live.s.wave_height != null ? ` · Mar ${n1(live.s.wave_height)} m` : ''}</div></div>` : ''}
    <div class="sec-h">Ficha</div>
    <div class="info-grid">
      <div class="info-tile"><div class="k">Fondo</div><div class="val" style="font-size:18px">${esc(cap(s.fondo || '—'))}</div></div>
      <div class="info-tile"><div class="k">Mira al</div><div class="val" style="font-size:18px">${s.orientacion != null ? sect(s.orientacion) : '—'}</div><div class="x">${s.orientacion != null ? n0(s.orientacion) + '°' : ''}</div></div>
      <div class="info-tile" style="grid-column:1/-1"><div class="k">Resguardado con</div><div class="val" style="font-size:18px">${s.abrigo && s.abrigo.length ? s.abrigo.map(cap).join(' y ') : 'Expuesto a los dos'}</div><div class="x">${s.abrigo && s.abrigo.length === 1 ? `Con ${s.abrigo[0] === 'levante' ? 'Poniente' : 'Levante'} fuerte, mejor otro sitio` : ''}</div></div>
    </div>
    ${s.desc ? `<div class="sec-h">Del lugar</div><div class="group"><div class="prose">${esc(s.desc)}</div></div>` : ''}
    ${s.aviso ? `<div class="callout r">${ic('warn')}<div>${esc(s.aviso)}</div></div>` : ''}
    ${species.length ? `<div class="sec-h">Qué se pesca</div><div class="chips" style="flex-wrap:wrap;padding-top:0">${species.map((f) => `<button class="chip" data-fish="${f.id}" style="padding-left:4px"><span style="width:36px;display:block">${fishSVG(f)}</span>${esc(f.nombre)}</button>`).join('')}</div>` : ''}
    <div class="group" style="margin-top:14px">
      ${s.tecnicas && s.tecnicas.length ? `<div class="cell"><span class="t">Técnicas</span><span class="grow"></span><span class="v" style="white-space:normal;text-align:right;font-size:15px">${s.tecnicas.map(cap).join(', ')}</span></div>` : ''}
      ${s.marea ? `<div class="cell"><span class="t">Marea</span><span class="grow"></span><span class="v" style="white-space:normal;text-align:right;font-size:15px">${esc(s.marea)}</span></div>` : ''}
      ${s.acceso ? `<div class="cell"><span class="t">Acceso</span><span class="grow"></span><span class="v" style="white-space:normal;text-align:right;font-size:15px">${esc(s.acceso)}</span></div>` : ''}
      <div class="cell"><span class="t">Tallas</span><span class="grow"></span><span class="v" style="font-size:15px">${region(s) === 'atl' ? 'Golfo de Cádiz (Atlántico)' : 'Mediterráneo'}</span></div>
    </div>
    <div class="btn-row" style="margin-top:20px"><button class="btn" data-use="1">${ic('today', 'sm')} Ver su parte</button><a class="btn gray" href="${dirUrl}" target="_blank" rel="noopener">${ic('nav', 'sm')} Cómo llegar</a></div>`,
    onOpen: (el) => {
      makeMap($('#smap', el), { center: [s.lat, s.lon], zoom: 14, pins: [{ id: s.id, lat: s.lat, lon: s.lon, color: tipoOf(s).c, label: '' }], small: true, selected: s.id });
      $('[data-act="left"]', el).onclick = () => {
        const i = S.favs.indexOf(s.id);
        if (i >= 0) S.favs.splice(i, 1); else S.favs.push(s.id);
        saveS(); haptic();
        toast(i >= 0 ? 'Quitado de favoritos' : 'Guardado en favoritos', 'star');
        $('[data-act="left"]', el).innerHTML = `<span style="display:flex;align-items:center;gap:4px">${ic('star', 'sm')}${i >= 0 ? 'Favorito' : 'Quitar'}</span>`;
        if (state.tab === 'spots') renderSpots();
      };
      $('[data-use]', el).onclick = () => { setSpot(s.id); goTab('hoy'); };
      el.addEventListener('click', (e) => { const f = e.target.closest('[data-fish]'); if (f) openFishSheet(f.dataset.fish); });
    },
  });
}

/* ---------------- PECEDEX ---------------- */
const GRUPOS = { esparidos: 'Espáridos', costeros: 'Lubinas y corvinas', pelagicos: 'Pelágicos', fondo: 'Fondo', roca: 'Roca', cefalopodos: 'Cefalópodos' };
const TYPES = {
  cefalopodo: { n: 'Cefalópodo', c: '#AF52DE' }, 'pelágico': { n: 'Pelágico', c: '#00A7D1' }, roca: { n: 'Roca', c: '#7C7C84' },
  playa: { n: 'Arena', c: '#F08A00' }, puerto: { n: 'Puerto', c: '#0A84FF' }, estuario: { n: 'Río', c: '#2FA84F' }, fondo: { n: 'Fondo', c: '#A2845E' },
};
const curMonth = () => mParts().m;
const dexNum = (f) => '#' + String(f.num).padStart(3, '0');
function typesOf(f) {
  const h = (f.habitat || []).filter((x) => TYPES[x]);
  let t = f.grupo === 'cefalopodos' ? ['cefalopodo', ...h] : h.includes('pelágico') ? ['pelágico', ...h.filter((x) => x !== 'pelágico')] : h;
  return [...new Set(t)].slice(0, 2);
}
const typeColor = (f) => TYPES[typesOf(f)[0]]?.c || '#0A84FF';
const typeBadges = (f, cls = '') => typesOf(f).map((k) => `<span class="ttag ${cls}" style="--tc:${TYPES[k].c}">${TYPES[k].n}</span>`).join('');
const starsHTML = (n, cls = '') => `<span class="stars-g ${cls}">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}">${gl('star')}</i>`).join('')}</span>`;
function dexStats() {
  const m = {};
  catches.slice().sort((a, b) => a.t.localeCompare(b.t)).forEach((c) => {
    const s = m[c.sp] || (m[c.sp] = { n: 0, best: 0, first: c });
    s.n += c.n || 1;
    if ((c.cm || 0) > s.best) s.best = c.cm;
  });
  return m;
}
function renderPeces() {
  const v = $('#v-peces');
  const m = curMonth();
  const st = dexStats();
  const total = D.species.length, got = D.species.filter((f) => st[f.id]).length;
  let list = D.species.slice();
  const q = norm(state.fishQ);
  if (q) list = list.filter((f) => norm(`${f.nombre} ${(f.otros || []).join(' ')} ${f.cientifico} ${f.num}`).includes(q));
  const F = state.fishFilter;
  if (F === 'capturadas') list = list.filter((f) => st[f.id]);
  else if (F === 'faltan') list = list.filter((f) => !st[f.id]);
  else if (F === 'temporada') list = list.filter((f) => (f.meses || []).includes(m));
  else if (F === 'top') list = list.filter((f) => f.rareza >= 4);
  else if (GRUPOS[F]) list = list.filter((f) => f.grupo === F);
  if (state.fishSort === 'rareza') list.sort((a, b) => b.rareza - a.rareza || a.num - b.num);
  if (state.fishSort === 'az') list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sp = spotById(S.spot);
  const cards = list.map((f, k) => {
    const s = st[f.id];
    const t = tallaFor(f, sp);
    return `<button class="dex-card t${f.rareza} ${s ? '' : 'unseen'}" data-fish="${f.id}" style="--tc:${typeColor(f)};animation-delay:${Math.min(k, 14) * 0.022}s">
      <div class="dex-top"><span class="dex-num">${dexNum(f)}</span>${starsHTML(f.rareza, 'sm')}</div>
      <div class="art">${fishSVG(f)}${(f.meses || []).includes(m) && !f.prohibida ? '<span class="season">EN TEMPORADA</span>' : ''}</div>
      <div class="dex-name ell">${esc(f.nombre)}</div>
      <div class="dex-foot">${f.prohibida ? `<span class="tag r">${esc(f.veto)}</span>` : t ? `<span class="tag b">${t} cm</span>` : f.tallaPend ? '<span class="tag o">Ver tabla</span>' : '<span class="tag">Sin talla</span>'}<span class="dex-got">${s ? `×${s.n}` : gl('lock', 'in')}</span></div>
    </button>`;
  }).join('');
  if (!v.dataset.built) {
    v.innerHTML = navbar('Pecedex', `<button class="nbtn" data-act="normas">${ic('scale', 'sm')} Normas</button>`) + `
      <div class="lsub">Todas las especies del Estrecho. Las capturas del Diario las desbloquean.</div>
      <div id="dexhero"></div>
      <div class="search">${ic('search', 'sm')}<input type="search" placeholder="Especie, nombre local o número" id="fq"></div>
      <div class="chips" id="ff"></div>
      <div class="seg" id="fsort" style="margin-top:6px"></div>
      <div class="sec-h" id="fcount"></div>
      <div class="dex-grid" id="fgrid"></div>`;
    v.dataset.built = '1';
    $('#fq', v).addEventListener('input', (e) => { state.fishQ = e.target.value; renderPeces(); });
    v.addEventListener('click', (e) => {
      const f = e.target.closest('[data-ff]');
      if (f) { state.fishFilter = f.dataset.ff; haptic(); renderPeces(); return; }
      const so = e.target.closest('[data-fsort]');
      if (so) { state.fishSort = so.dataset.fsort; haptic(); renderPeces(); return; }
      const fi = e.target.closest('[data-fish]');
      if (fi) { openFishSheet(fi.dataset.fish); return; }
      if (e.target.closest('[data-act="normas"]')) openNormas();
    });
  }
  const tiers = [5, 4, 3, 2, 1].map((r) => { const all = D.species.filter((f) => f.rareza === r); return { r, all: all.length, got: all.filter((f) => st[f.id]).length }; }).filter((x) => x.all);
  const pct = got / total;
  $('#dexhero', v).innerHTML = `<div class="dex-hero"><div class="ring big"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,.18)" stroke-width="8" fill="none"/><circle cx="40" cy="40" r="34" stroke="url(#gGold)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${213.6 * pct} 300" class="ring-anim"/></svg><b>${got}<small>/${total}</small></b></div><div class="dex-hero-r"><div class="dh-t">Tu colección</div>${tiers.map((x) => `<div class="dh-row">${starsHTML(x.r, 'xs')}<span>${x.got}/${x.all}</span></div>`).join('')}</div></div>`;
  const filters = [['todos', 'Todas'], ['capturadas', 'Capturadas'], ['faltan', 'Por capturar'], ['temporada', 'En temporada'], ['top', gl('star', 'in') + ' Raras'], ...Object.entries(GRUPOS)];
  $('#ff', v).innerHTML = filters.map(([k, t]) => `<button class="chip ${F === k ? 'on' : ''}" data-ff="${k}">${t}</button>`).join('');
  const sorts = [['num', 'Número'], ['rareza', 'Rareza'], ['az', 'A-Z']];
  const si = Math.max(0, sorts.findIndex(([k]) => k === (state.fishSort || 'num')));
  $('#fsort', v).innerHTML = `<span class="thumb" style="width:calc((100% - 4px)/3);transform:translateX(${si * 100}%)"></span>` + sorts.map(([k, t], i) => `<button class="${i === si ? 'on' : ''}" data-fsort="${k}">${t}</button>`).join('');
  $('#fcount', v).innerHTML = `<span>${list.length} especies</span><span style="text-transform:none">Tallas: ${region(sp) === 'atl' ? 'Atlántico' : 'Mediterráneo'}</span>`;
  $('#fgrid', v).innerHTML = cards || `<div class="empty" style="grid-column:1/-1"><div class="big">${gl('fish')}</div><b>Nada por aquí</b>Prueba otro filtro.</div>`;
}
function openFishSheet(id) {
  const f = fishById(id);
  if (!f) return;
  const m = curMonth();
  const where = D.spots.filter((s) => (s.especies || []).includes(f.id));
  const s = dexStats()[f.id];
  const tc = typeColor(f);
  const first = s && s.first;
  openSheet({
    title: dexNum(f),
    body: `<div class="dex-entry" style="--tc:${tc}">
      <div class="dex-entry-art t${f.rareza}"><span class="big-num">${dexNum(f)}</span>${fishSVG(f)}<span class="tier-pill">${starsHTML(f.rareza, 'xs')} ${esc(f.tier || '')}</span></div>
      <div class="stitle">${esc(f.nombre)}</div>
      <div class="ssub"><i>${esc(f.cientifico || '')}</i>${f.otros && f.otros.length ? ` · ${esc(f.otros.slice(0, 2).join(', '))}` : ''}</div>
      <div class="tags" style="padding:0 16px 12px">${typeBadges(f, 'lg')}${f.pescarec ? '<span class="tag o">PescaREC</span>' : ''}</div>
    </div>
    ${s ? `<div class="reg"><div><span>Capturas</span><b>${s.n}</b></div><div><span>Récord</span><b>${s.best ? s.best + ' cm' : '—'}</b></div><div><span>Primera</span><b>${dayInfo(first.t.slice(0, 10)).d} ${dayInfo(first.t.slice(0, 10)).mes}</b></div></div>`
      : f.prohibida ? '' : `<div class="callout b">${gl('lock', 'md')}<div><b>Sin capturar.</b> Apúntala en el Diario para desbloquearla.</div></div>`}
    ${f.prohibida ? `<div class="callout r">${ic('warn')}<div><b>${esc(f.veto)}.</b> ${esc(f.notaTalla || '')}</div></div>` : `
    <div class="talla-box">
      <div class="talla"><div class="k">Mediterráneo</div><div class="val">${f.tallaMed != null ? f.tallaMed + '<small> cm</small>' : `<small>${f.tallaPend ? 'Ver tabla' : 'Sin talla'}</small>`}</div></div>
      <div class="talla"><div class="k">Golfo de Cádiz</div><div class="val">${f.tallaAtl != null ? f.tallaAtl + '<small> cm</small>' : `<small>${f.tallaPend ? 'Ver tabla' : 'Sin talla'}</small>`}</div></div>
    </div>
    ${f.notaTalla ? `<div class="callout o">${ic('info')}<div>${esc(f.notaTalla)}</div></div>` : ''}`}
    ${f.peligro ? `<div class="callout r">${ic('warn')}<div>${esc(f.peligro)}</div></div>` : ''}
    ${(f.meses || []).length ? `<div class="sec-h">Mejores meses</div><div style="padding:0 16px"><div class="months">${MES.map((x, k) => `<span class="${f.meses.includes(k + 1) ? 'on' : ''} ${k + 1 === m ? 'cur' : ''}">${x.charAt(0).toUpperCase()}</span>`).join('')}</div></div>` : ''}
    ${f.momento || (f.cebos || []).length ? `<div class="group" style="margin-top:16px">
      ${f.momento ? `<div class="cell"><span class="ibox" style="background:var(--indigo)">${ic('clock')}</span><div class="grow"><div class="s" style="margin:0">Cuándo</div><div class="t" style="font-size:15px">${esc(f.momento)}</div></div></div>` : ''}
      ${(f.cebos || []).length ? `<div class="cell"><span class="ibox" style="background:var(--orange)">${ic('hook')}</span><div class="grow"><div class="s" style="margin:0">Cebo</div><div class="t" style="font-size:15px">${esc(f.cebos.join(', '))}</div></div></div>` : ''}
      ${(f.tecnicas || []).length ? `<div class="cell"><span class="ibox" style="background:var(--tint)">${ic('fish')}</span><div class="grow"><div class="s" style="margin:0">Técnica</div><div class="t" style="font-size:15px">${esc(f.tecnicas.map(cap).join(', '))}</div></div></div>` : ''}
      ${f.tam ? `<div class="cell"><span class="ibox" style="background:var(--green)">${ic('ruler')}</span><div class="grow"><div class="s" style="margin:0">Tamaño</div><div class="t" style="font-size:15px">${esc(f.tam)}</div></div>${f.mesa ? `<span class="v">${starsHTML(f.mesa, 'xs')}</span>` : ''}</div>` : ''}
    </div>` : ''}
    ${f.consejo ? `<div class="callout g">${gl('sparkle', 'md')}<div>${esc(f.consejo)}</div></div>` : ''}
    ${where.length ? `<div class="sec-h">Dónde</div><div class="chips" style="flex-wrap:wrap;padding-top:0">${where.map((x) => `<button class="chip" data-spot="${x.id}">${tipoIc(x, 'xs')} ${esc(x.nombre)}</button>`).join('')}</div>` : ''}
    ${f.fuenteTalla && !f.prohibida ? `<div class="sec-f">Talla: ${esc(f.fuenteTalla)}.</div>` : ''}
    ${f.prohibida && f.id !== 'atun-rojo' ? '' : `<div style="padding:20px 16px 0"><button class="btn" data-add="1">${ic('plus', 'sm')} Apuntar captura</button></div>`}`,
    onOpen: (el) => {
      el.addEventListener('click', (e) => {
        const sp = e.target.closest('[data-spot]');
        if (sp) openSpotSheet(sp.dataset.spot);
        if (e.target.closest('[data-add]')) openCatchForm({ sp: f.id });
      });
    },
  });
}
function showUnlock(f) {
  const st = dexStats();
  const got = D.species.filter((x) => st[x.id]).length;
  const el = document.createElement('div');
  el.className = 'unlock';
  const colors = ['#FFD60A', '#0A84FF', '#34C759', '#FF375F', '#64D2FF', '#BF5AF2'];
  el.innerHTML = `<div class="rays"></div>${Array.from({ length: 36 }, (_, i) => `<i class="conf" style="--x:${(i * 37) % 100}vw;--d:${(i % 7) * 0.12}s;--r:${(i * 53) % 360}deg;background:${colors[i % colors.length]}"></i>`).join('')}
    <div class="unlock-card t${f.rareza}" style="--tc:${typeColor(f)}"><div class="u-kicker">${gl('sparkle', 'in')} ¡Nueva especie!</div><div class="u-art">${fishSVG(f)}</div><div class="u-num">${dexNum(f)}</div><div class="u-name">${esc(f.nombre)}</div>${starsHTML(f.rareza)}<div class="u-tier">${esc(f.tier || '')}</div><div class="u-prog">Llevas ${got} de ${D.species.length}</div><button class="btn" data-u="dex">Ver en la Pecedex</button></div>`;
  document.body.appendChild(el);
  haptic();
  void el.offsetHeight;
  el.classList.add('on');
  const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', (e) => { if (e.target.closest('[data-u]')) { close(); goTab('peces'); setTimeout(() => openFishSheet(f.id), 350); } else close(); });
}
function openNormas() {
  const R = D.normas;
  openSheet({
    title: 'Normativa',
    body: `<div class="stitle">Normas de pesca</div><div class="ssub">Pesca recreativa desde costa en Andalucía. Resumen orientativo: la norma que vale es la del BOJA/BOE vigente.</div>
    ${R.secciones.map((s) => `<div class="sec-h">${esc(s.titulo)}</div><div class="group"><div class="prose">${s.html}</div></div>`).join('')}
    <div class="sec-h">Tallas mínimas</div>
    <div class="group">${D.species.filter((f) => f.tallaMed || f.tallaAtl || f.notaTalla).map((f) => `<button class="cell" data-fish="${f.id}"><span class="mini-fish">${fishSVG(f)}</span><div class="grow"><div class="t" style="font-size:15px">${esc(f.nombre)}</div>${f.notaTalla ? `<div class="s ell">${esc(f.notaTalla)}</div>` : ''}</div><span class="v" style="font-size:14px;text-align:right">${f.tallaMed != null ? `<span class="rule-num">${f.tallaMed}</span> Med` : ''}${f.tallaMed != null && f.tallaAtl != null ? '<br>' : ''}${f.tallaAtl != null ? `<span class="rule-num">${f.tallaAtl}</span> Atl` : ''}</span></button>`).join('')}</div>
    <div class="sec-f">Medida: de la punta del hocico al extremo de la aleta caudal. En cefalópodos, longitud del manto.</div>
    <div class="sec-h">Fuentes</div><div class="group"><div class="prose" style="font-size:13px">${R.fuentes.map((u) => `<a href="${esc(u[1])}" target="_blank" rel="noopener">${esc(u[0])}</a>`).join('<br>')}</div></div>`,
    onOpen: (el) => el.addEventListener('click', (e) => { const f = e.target.closest('[data-fish]'); if (f) openFishSheet(f.dataset.fish); }),
  });
}

/* ---------------- DIARIO ---------------- */
function catchesFor(seg) {
  let l = catches.slice().sort((a, b) => b.t.localeCompare(a.t));
  if (seg === 'casa') l = l.filter((c) => c.keep);
  if (state.whoFilter !== 'todos') l = l.filter((c) => (c.who || S.yo) === state.whoFilter);
  return l;
}
const people = () => [S.yo, ...S.colegas.filter((c) => c && c !== S.yo)];
function renderDiario() {
  const v = $('#v-diario');
  const seg = state.diarioSeg;
  const segs = [['pescados', 'Pescados'], ['casa', 'A casa'], ['stats', 'Estadísticas']];
  const si = segs.findIndex(([k]) => k === seg);
  const ppl = people();
  const whoChips = ppl.length > 1 ? `<div class="chips" style="padding-top:12px">${[['todos', 'Toda la peña'], ...ppl.map((p) => [p, p])].map(([k, t]) => `<button class="chip ${state.whoFilter === k ? 'on' : ''}" data-who="${esc(k)}">${esc(t)}</button>`).join('')}</div>` : '';
  let body = '';
  if (seg === 'stats') body = statsHTML();
  else {
    const list = catchesFor(seg);
    const pieces = list.reduce((a, c) => a + (c.n || 1), 0);
    const nsp = new Set(list.map((c) => c.sp)).size;
    const big = list.reduce((a, c) => (c.cm > (a ? a.cm : 0) ? c : a), null);
    const kg = list.reduce((a, c) => a + (c.g || 0) * (c.n || 1), 0) / 1000;
    const stats = seg === 'casa'
      ? `<div class="stats"><div class="stat"><div class="k">Piezas</div><div class="val">${pieces}</div><div class="x">a la nevera</div></div><div class="stat"><div class="k">Peso</div><div class="val">${n1(kg)}</div><div class="x">kg en total</div></div><div class="stat"><div class="k">Especies</div><div class="val">${nsp}</div><div class="x">distintas</div></div></div>${cupoHTML()}`
      : `<div class="stats"><div class="stat"><div class="k">Piezas</div><div class="val">${pieces}</div><div class="x">${list.filter((c) => !c.keep).reduce((a, c) => a + (c.n || 1), 0)} sueltas</div></div><div class="stat"><div class="k">Especies</div><div class="val">${nsp}</div><div class="x">distintas</div></div><div class="stat"><div class="k">La mayor</div><div class="val">${big ? big.cm : '—'}<small style="font-size:14px">${big ? ' cm' : ''}</small></div><div class="x ell">${big ? esc((fishById(big.sp) || {}).nombre || '') : 'aún nada'}</div></div></div>`;
    const byDay = {};
    list.forEach((c) => { (byDay[c.t.slice(0, 10)] = byDay[c.t.slice(0, 10)] || []).push(c); });
    const groups = Object.keys(byDay).sort().reverse().map((k) => {
      const di = dayInfo(k);
      const spots = [...new Set(byDay[k].map((c) => c.spot))];
      return `<div class="sec-h"><span>${di.rel || cap(di.wdl)} ${di.d} ${di.mes}</span><span style="text-transform:none">${spots.length === 1 ? esc(spotById(spots[0]).nombre) : spots.length + ' pesqueros'}</span></div><div class="group">${byDay[k].map(catchRow).join('')}</div>`;
    }).join('');
    body = stats + whoChips + (list.length ? groups : `<div class="empty"><div class="big">${gl(seg === 'casa' ? 'ice' : 'rod')}</div><b>${seg === 'casa' ? 'La nevera está vacía' : 'Aún no hay capturas'}</b>${seg === 'casa' ? 'Aquí sale lo que te llevas.' : 'Pulsa + cuando saques el primero.'}</div>`);
  }
  v.innerHTML = navbar('Diario', `<button class="nbtn" data-act="peña">${ic('users', 'sm')}</button>`) + `<div class="lsub">Lo que sale del agua, tuyo y de la peña</div>
    <div class="seg" id="dseg"><span class="thumb" style="width:calc((100% - 4px)/3);transform:translateX(${si * 100}%)"></span>${segs.map(([k, t]) => `<button class="${k === seg ? 'on' : ''}" data-seg="${k}">${t}</button>`).join('')}</div>
    <div style="height:14px"></div>${body}`;
  fillPhotos(v);
  v.onclick = (e) => {
    const s = e.target.closest('[data-seg]');
    if (s) { state.diarioSeg = s.dataset.seg; haptic(); renderDiario(); return; }
    const w = e.target.closest('[data-who]');
    if (w) { state.whoFilter = w.dataset.who; renderDiario(); return; }
    const c = e.target.closest('[data-catch]');
    if (c) { openCatchDetail(c.dataset.catch); return; }
    if (e.target.closest('[data-act="peña"]')) openPena();
  };
}
function catchRow(c) {
  const f = fishById(c.sp) || { nombre: c.sp, forma: 'esparido' };
  const t = c.t.slice(11, 16);
  return `<button class="cell" data-catch="${c.id}"><span class="catch-photo" ${c.photo ? `data-photo="${c.id}"` : ''}>${fishSVG(f)}</span><div class="grow"><div class="t ell">${esc(f.nombre)}${c.n > 1 ? ` ×${c.n}` : ''}${c.cm ? ` · ${c.cm} cm` : ''}${c.g ? ` · ${c.g >= 1000 ? n1(c.g / 1000) + ' kg' : n0(c.g) + ' g'}` : ''}</div><div class="s ell">${t} · ${esc(spotById(c.spot).nombre)}${c.cebo ? ' · ' + esc(c.cebo) : ''}</div>${people().length > 1 ? `<div class="who">${esc(c.who || S.yo)}</div>` : ''}</div><span class="tag ${c.keep ? 'g' : 'b'}">${c.keep ? gl('home', 'in') + ' A casa' : gl('release', 'in') + ' Suelta'}</span></button>`;
}
function cupoHTML() {
  const today = dayKey();
  const ppl = people();
  const rows = ppl.map((p) => {
    const kg = catches.filter((c) => c.keep && c.t.slice(0, 10) === today && (c.who || S.yo) === p).reduce((a, c) => a + (c.g || 0) * (c.n || 1), 0) / 1000;
    return { p, kg };
  }).filter((r) => r.kg > 0 || r.p === S.yo);
  const me = rows.find((r) => r.p === S.yo) || { kg: 0 };
  const lim = D.normas.cupoKg || 5;
  const f = clamp(me.kg / lim, 0, 1);
  const col = f >= 1 ? 'var(--red)' : f > 0.75 ? 'var(--orange)' : 'var(--green)';
  return `<div class="cupo"><div class="ring"><svg viewBox="0 0 62 62"><circle cx="31" cy="31" r="26" stroke="var(--fill)" stroke-width="7" fill="none"/><circle cx="31" cy="31" r="26" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${163.4 * f} 200"/></svg><b>${n0(f * 100)}%</b></div><div style="flex:1"><div style="font-weight:600">Cupo de hoy: ${n1(me.kg)} de ${lim} kg</div><div style="font-size:13px;color:var(--label2);margin-top:2px">${esc(D.normas.cupoTexto || '')}</div>${rows.length > 1 ? `<div style="font-size:13px;margin-top:6px">${rows.filter((r) => r.p !== S.yo).map((r) => `${esc(r.p)}: <b>${n1(r.kg)} kg</b>`).join(' · ')}</div>` : ''}</div></div>`;
}
function statsHTML() {
  if (!catches.length) return '<div class="empty"><div class="big">' + gl('chart') + '</div><b>Sin datos todavía</b>Apunta capturas y verás qué te funciona.</div>';
  const pieces = catches.reduce((a, c) => a + (c.n || 1), 0);
  const days = new Set(catches.map((c) => c.t.slice(0, 10))).size;
  const kg = catches.filter((c) => c.keep).reduce((a, c) => a + (c.g || 0) * (c.n || 1), 0) / 1000;
  const count = (key) => { const m = {}; catches.forEach((c) => { const k = key(c); if (k) m[k] = (m[k] || 0) + (c.n || 1); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const bySp = count((c) => c.sp).slice(0, 8);
  const bySpot = count((c) => c.spot).slice(0, 5);
  const byCebo = count((c) => (c.cebo || '').trim().toLowerCase()).slice(0, 5);
  const byHour = {};
  catches.forEach((c) => { const h = +c.t.slice(11, 13); const band = h < 6 ? 'Noche (0–6)' : h < 10 ? 'Alba (6–10)' : h < 14 ? 'Mañana (10–14)' : h < 18 ? 'Tarde (14–18)' : h < 22 ? 'Atardecer (18–22)' : 'Noche (22–24)'; byHour[band] = (byHour[band] || 0) + (c.n || 1); });
  const hours = Object.entries(byHour).sort((a, b) => b[1] - a[1]);
  const months = Array(12).fill(0);
  catches.forEach((c) => { months[+c.t.slice(5, 7) - 1] += c.n || 1; });
  const mmax = Math.max(1, ...months);
  const bars = (arr, label) => { const mx = Math.max(1, ...arr.map((x) => x[1])); return `<div class="bars">${arr.map(([k, n]) => `<div class="brow"><span class="ell">${esc(label(k))}</span><span class="bt"><i style="width:${n / mx * 100}%"></i></span><span class="bn">${n}</span></div>`).join('')}</div>`; };
  const ppl = people();
  const rank = ppl.map((p) => { const mine = catches.filter((c) => (c.who || S.yo) === p); return { p, n: mine.reduce((a, c) => a + (c.n || 1), 0), big: mine.reduce((a, c) => (c.cm > (a ? a.cm : 0) ? c : a), null) }; }).filter((r) => r.n).sort((a, b) => b.n - a.n);
  const records = {};
  catches.forEach((c) => { if (c.cm && (!records[c.sp] || c.cm > records[c.sp].cm)) records[c.sp] = c; });
  return `<div class="stats"><div class="stat"><div class="k">Piezas</div><div class="val">${pieces}</div></div><div class="stat"><div class="k">Días</div><div class="val">${days}</div><div class="x">de pesca</div></div><div class="stat"><div class="k">A casa</div><div class="val">${n1(kg)}</div><div class="x">kg</div></div></div>
  ${rank.length > 1 ? `<div class="sec-h">Ranking de la peña</div><div class="group" style="padding:0 16px"><div class="podium">${rank.map((r, k) => `<div class="pr"><span class="medal">${gl(['medal1', 'medal2', 'medal3'][k] || 'fish')}</span><div style="flex:1"><div style="font-weight:600">${esc(r.p)}</div><div style="font-size:13px;color:var(--label2)">${r.big ? `Mayor: ${esc((fishById(r.big.sp) || {}).nombre || '')} de ${r.big.cm} cm` : ''}</div></div><b style="font-family:var(--round);font-size:20px">${r.n}</b></div>`).join('')}</div></div>` : ''}
  <div class="sec-h">Especies</div><div class="group" style="padding:8px 16px">${bars(bySp, (k) => (fishById(k) || {}).nombre || k)}</div>
  <div class="sec-h">Pesqueros que más dan</div><div class="group" style="padding:8px 16px">${bars(bySpot, (k) => spotById(k).nombre)}</div>
  ${byCebo.length ? `<div class="sec-h">Cebos que funcionan</div><div class="group" style="padding:8px 16px">${bars(byCebo, cap)}</div>` : ''}
  <div class="sec-h">A qué hora pican</div><div class="group" style="padding:8px 16px">${bars(hours, (k) => k)}</div>
  <div class="sec-h">Por meses</div><div class="group" style="padding:14px 16px"><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;align-items:end;height:90px">${months.map((n) => `<div style="height:${Math.max(4, n / mmax * 100)}%;border-radius:4px;background:${n ? 'linear-gradient(180deg,var(--tint2),var(--tint))' : 'var(--fill)'}"></div>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:4px;font-size:11px;color:var(--label2);text-align:center;font-weight:600">${MES.map((x) => x.charAt(0).toUpperCase()).join('</div><div>').replace(/^/, '<div>') + '</div>'}</div></div>
  <div class="sec-h">Récords por especie</div><div class="group">${Object.values(records).sort((a, b) => b.cm - a.cm).map((c) => `<button class="cell" data-catch="${c.id}"><span class="mini-fish">${fishSVG(fishById(c.sp) || {})}</span><div class="grow"><div class="t" style="font-size:15px">${esc((fishById(c.sp) || {}).nombre || c.sp)}</div><div class="s">${esc(c.who || S.yo)} · ${esc(spotById(c.spot).nombre)} · ${dayInfo(c.t.slice(0, 10)).d} ${dayInfo(c.t.slice(0, 10)).mes}</div></div><b style="font-family:var(--round)">${c.cm} cm</b></button>`).join('')}</div>`;
}
function snapshot(spotId) {
  const ctx = state.ctx;
  if (!ctx || ctx.sp.id !== spotId) return null;
  const i = ctx.now;
  const ill = Astro.moonIllumination(new Date());
  const ts = ctx.hasTide ? tideState(ctx, i) : null;
  return { viento: `${windText(ctx.H.wind_speed_10m[i], ctx.H.wind_direction_10m[i])} ${n0(ctx.H.wind_speed_10m[i])} km/h`, mar: ctx.M.wave_height ? n1(ctx.M.wave_height[i]) + ' m' : null, marea: ts ? ts.t : null, luna: Astro.phaseName(ill.phase), agua: ctx.M.sea_surface_temperature ? n0(ctx.M.sea_surface_temperature[i]) + '°' : null, indice: ctx.scores[i].s };
}
function nowLocalInput() { const p = mParts(); return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`; }
async function compress(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 1280, k = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  URL.revokeObjectURL(img.src);
  return new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.78));
}
function openCatchForm(pre = {}) {
  const edit = pre.id ? catches.find((c) => c.id === pre.id) : null;
  const c = Object.assign({ sp: null, cm: 25, g: '', n: 1, keep: false, who: S.yo, spot: S.spot, t: nowLocalInput(), cebo: '', tec: '', notas: '' }, edit || pre);
  let photoBlob = null, photoChanged = false;
  const tecs = ['surfcasting', 'spinning', 'rockfishing', 'corcheo', 'eging', 'fondo', 'LRF', 'jigging', 'curricán', 'a mano'];
  const ceboSugs = [...new Set(D.species.flatMap((f) => f.cebos || []))].slice(0, 60);
  const body = `
    <div class="sec-h" style="padding-top:8px">Especie</div>
    <div class="group"><button class="cell" id="cf-sp"><span class="mini-fish" id="cf-spart"></span><div class="grow"><div class="t" id="cf-spname">Elige qué has pescado</div><div class="s" id="cf-spsub"></div></div>${chev}</button></div>
    <div id="cf-picker" hidden><div class="search" style="margin-top:10px">${ic('search', 'sm')}<input type="search" placeholder="Buscar especie" id="cf-q"></div><div class="group picker-list" id="cf-plist"></div></div>
    <div class="sec-h">Talla</div>
    <div class="group" style="padding:6px 16px 22px"><div class="big-num"><input type="number" inputmode="decimal" id="cf-cm" min="1" max="300" value="${c.cm || ''}"><span>cm</span></div><input type="range" class="slider" id="cf-sl" min="5" max="120" value="${clamp(c.cm || 25, 5, 120)}"><div class="measure" id="cf-meas" style="margin:0"></div></div>
    <div class="sec-f" id="cf-tallamsg"></div>
    <div class="sec-h">¿Qué has hecho con él?</div>
    <div class="keep-toggle"><button data-keep="0" class="${!c.keep ? 'on' : ''}"><div class="e">${gl('release')}</div><div class="t">Lo solté</div><div class="s">Vuelve al agua</div></button><button data-keep="1" class="home ${c.keep ? 'on' : ''}"><div class="e">${gl('home')}</div><div class="t">Me lo llevo</div><div class="s">Cuenta para el cupo</div></button></div>
    <div id="cf-keepwarn"></div>
    <div class="sec-h">Quién lo ha sacado</div>
    <div class="who-chips" id="cf-who"></div>
    <div class="sec-h">Detalles</div>
    <div class="group form">
      <label class="cell"><span class="t">Peso</span><input type="number" inputmode="numeric" id="cf-g" placeholder="gramos" value="${c.g || ''}"></label>
      <div class="cell"><span class="t">Cantidad</span><span class="grow"></span><span class="v" id="cf-nv" style="margin-right:10px;font-weight:600;color:var(--label)">${c.n}</span><span class="stepper"><button type="button" data-n="-1">−</button><button type="button" data-n="1">+</button></span></div>
      <label class="cell"><span class="t">Pesquero</span><select id="cf-spot">${Object.keys(D.zonas).map((z) => `<optgroup label="${esc(D.zonas[z])}">${D.spots.filter((s) => s.mar === z).sort((a, b) => a.lon - b.lon).map((s) => `<option value="${s.id}" ${s.id === c.spot ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <label class="cell"><span class="t">Cuándo</span><input type="datetime-local" id="cf-t" value="${c.t.slice(0, 16)}"></label>
      <label class="cell"><span class="t">Cebo</span><input type="text" id="cf-cebo" list="cf-cebos" placeholder="Gusana, coreana…" value="${esc(c.cebo)}"></label>
      <label class="cell"><span class="t">Técnica</span><select id="cf-tec"><option value="">—</option>${tecs.map((t) => `<option ${t === c.tec ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    </div>
    <datalist id="cf-cebos">${ceboSugs.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
    <div class="sec-h">Foto</div>
    <label class="photo-pick" id="cf-photo">${ic('camera')}<span>Hacer o elegir foto</span><input type="file" accept="image/*" id="cf-file"></label>
    <div class="sec-h">Notas</div>
    <div class="group form"><div class="cell"><textarea id="cf-notas" placeholder="Cómo picó, dónde exactamente, lo que sea…">${esc(c.notas)}</textarea></div></div>
    ${edit ? `<div style="padding:24px 16px 0"><button class="btn red" id="cf-del">${ic('trash', 'sm')} Borrar captura</button></div>` : ''}`;
  openSheet({
    title: edit ? 'Editar captura' : 'Nueva captura',
    left: 'Cancelar',
    right: 'Guardar',
    body,
    onOpen: async (el) => {
      $('[data-act="left"]', el).onclick = () => closeSheet();
      const spBtn = $('#cf-sp', el), picker = $('#cf-picker', el);
      const update = () => {
        const f = fishById(c.sp);
        $('#cf-spart', el).innerHTML = f ? fishSVG(f) : gl('fish');
        $('#cf-spname', el).textContent = f ? f.nombre : 'Elige qué has pescado';
        $('#cf-spsub', el).textContent = f ? f.cientifico || '' : '';
        const sp = spotById($('#cf-spot', el).value);
        const t = tallaFor(f, sp);
        const cm = parseFloat($('#cf-cm', el).value) || 0;
        const meas = $('#cf-meas', el);
        const rec = !t && f ? tallaRec(f, sp) : null;
        meas.innerHTML = t ? `<span class="lim" style="left:calc(${(clamp(t, 5, 120) - 5) / 115 * 100}% )"><span>mín. ${t}</span></span>` : rec ? `<span class="lim" style="background:var(--orange);left:calc(${(clamp(rec, 5, 120) - 5) / 115 * 100}% )"><span style="color:var(--orange)">ref. ${rec}</span></span>` : '';
        const msg = $('#cf-tallamsg', el), warn = $('#cf-keepwarn', el);
        const forbidden = !!(f && f.prohibida);
        const zona = region(sp) === 'atl' ? 'en el Golfo de Cádiz' : 'en el Mediterráneo';
        if (!f) msg.innerHTML = '';
        else if (forbidden) msg.innerHTML = `<span style="color:var(--red);font-weight:600">${esc(f.notaTalla || 'Especie prohibida')}</span>`;
        else if (t) msg.innerHTML = cm >= t ? `<span style="color:var(--green);font-weight:600">✓ Supera la talla mínima (${t} cm ${zona})</span>` : `<span style="color:var(--red);font-weight:600">✗ Por debajo de la talla mínima: ${t} cm ${zona}. Al agua con cuidado.</span>`;
        else if (rec) msg.innerHTML = cm >= rec ? `Sin talla legal ${zona}. Supera los ${rec} cm de referencia del otro caladero.` : `<span style="color:var(--orange);font-weight:600">Sin talla legal ${zona}, pero no llega a los ${rec} cm de referencia: lo suyo es soltarlo.</span>`;
        else msg.innerHTML = f.tallaPend ? esc(f.notaTalla) : 'Esta especie no tiene talla mínima legal. Los chicos, al agua.';
        if (f && f.pescarec) msg.innerHTML += `<div style="margin-top:6px;color:var(--orange);font-weight:600">${gl('phone', 'in')} Decláralo en PescaREC en 24 h (también si lo sueltas).</div>`;
        const under = f && t && cm < t;
        warn.innerHTML = c.keep && (under || forbidden) ? `<div class="callout r">${ic('warn')}<div><b>${forbidden ? 'Especie prohibida en la pesca recreativa.' : `No llega a los ${t} cm.`}</b> Llevártelo es ilegal y te pueden multar. Márcalo como suelto.</div></div>` : '';
        const ppl = people();
        $('#cf-who', el).innerHTML = ppl.map((p) => `<button class="chip ${p === c.who ? 'on' : ''}" data-whoc="${esc(p)}">${esc(p)}</button>`).join('') + '<button class="chip" data-whoc="+">＋ Colega</button>';
      };
      const renderPicker = (q = '') => {
        const t = norm(q);
        const m = curMonth();
        const used = count((x) => x.sp);
        function count(fn) { const r = {}; catches.forEach((x) => { r[fn(x)] = (r[fn(x)] || 0) + 1; }); return r; }
        const list = D.species.filter((f) => !t || norm(`${f.nombre} ${(f.otros || []).join(' ')}`).includes(t)).sort((a, b) => (used[b.id] || 0) - (used[a.id] || 0) || ((b.meses || []).includes(m) - (a.meses || []).includes(m)) || a.nombre.localeCompare(b.nombre));
        $('#cf-plist', el).innerHTML = list.map((f) => `<button class="cell" data-pickf="${f.id}"><span class="mini-fish">${fishSVG(f)}</span><div class="grow"><div class="t" style="font-size:16px">${esc(f.nombre)}</div><div class="s ell">${esc((f.otros || []).slice(0, 2).join(', '))}</div></div>${f.id === c.sp ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button>`).join('');
      };
      spBtn.onclick = () => { picker.hidden = !picker.hidden; if (!picker.hidden) { renderPicker(); setTimeout(() => $('#cf-q', el).focus(), 50); } };
      $('#cf-q', el).oninput = (e) => renderPicker(e.target.value);
      $('#cf-cm', el).oninput = (e) => { const v = parseFloat(e.target.value); if (v) $('#cf-sl', el).value = clamp(v, 5, 120); c.cm = v; update(); };
      $('#cf-sl', el).oninput = (e) => { $('#cf-cm', el).value = e.target.value; c.cm = +e.target.value; update(); };
      $('#cf-spot', el).onchange = update;
      $('#cf-file', el).onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try { photoBlob = await compress(file); photoChanged = true; const u = URL.createObjectURL(photoBlob); $('#cf-photo', el).insertAdjacentHTML('afterbegin', `<img src="${u}" alt="">`); } catch (er) { toast('No se pudo leer la foto', 'warn'); }
      };
      if (edit && edit.photo) { const u = await photoURL(edit.id); if (u) $('#cf-photo', el).insertAdjacentHTML('afterbegin', `<img src="${u}" alt="">`); }
      el.addEventListener('click', (e) => {
        const pf = e.target.closest('[data-pickf]');
        if (pf) {
          c.sp = pf.dataset.pickf; picker.hidden = true; haptic();
          const f = fishById(c.sp);
          if (!edit && f && f.tamCm) { $('#cf-cm', el).value = f.tamCm; $('#cf-sl', el).value = clamp(f.tamCm, 5, 120); c.cm = f.tamCm; }
          update(); return;
        }
        const k = e.target.closest('[data-keep]');
        if (k) { c.keep = k.dataset.keep === '1'; $$('[data-keep]', el).forEach((b) => b.classList.toggle('on', b === k)); haptic(); update(); return; }
        const n = e.target.closest('[data-n]');
        if (n) { c.n = clamp((c.n || 1) + +n.dataset.n, 1, 99); $('#cf-nv', el).textContent = c.n; haptic(); return; }
        const w = e.target.closest('[data-whoc]');
        if (w) {
          if (w.dataset.whoc === '+') { const name = (prompt('Nombre del colega') || '').trim(); if (name && !S.colegas.includes(name)) { S.colegas.push(name); saveS(); c.who = name; } }
          else c.who = w.dataset.whoc;
          update(); return;
        }
      });
      if ($('#cf-del', el)) $('#cf-del', el).onclick = async () => {
        if (!confirm('¿Borrar esta captura?')) return;
        catches = catches.filter((x) => x.id !== edit.id); saveC();
        if (edit.photo) idb.del(edit.id).catch(() => {});
        while (sheets.length) closeSheet();
        renderDiario(); toast('Captura borrada', 'trash');
      };
      $('[data-act="right"]', el).onclick = async () => {
        const f = fishById(c.sp);
        if (!f) { toast('Elige la especie', 'warn'); picker.hidden = false; renderPicker(); return; }
        const cm = parseFloat($('#cf-cm', el).value) || null;
        const sp = spotById($('#cf-spot', el).value);
        const t = tallaFor(f, sp);
        const forbidden = !!f.prohibida;
        if (c.keep && ((t && cm && cm < t) || forbidden)) { toast(forbidden ? 'Especie prohibida: márcala como suelta' : `No llega a ${t} cm: márcalo como suelto`, 'warn'); $('#cf-keepwarn', el).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        const rec = {
          id: edit ? edit.id : 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          sp: f.id, cm, g: parseInt($('#cf-g', el).value, 10) || null, n: c.n || 1, keep: !!c.keep, who: c.who || S.yo,
          spot: sp.id, t: $('#cf-t', el).value || nowLocalInput(), cebo: $('#cf-cebo', el).value.trim(), tec: $('#cf-tec', el).value,
          notas: $('#cf-notas', el).value.trim(), photo: edit ? edit.photo : false, cond: edit ? edit.cond : snapshot(sp.id),
        };
        if (photoChanged && photoBlob) { try { await idb.put(rec.id, photoBlob); rec.photo = true; photoURLs.delete(rec.id); } catch (er) { toast('La foto no se pudo guardar', 'warn'); } }
        const isNew = !catches.some((x) => x.sp === rec.sp && x.id !== rec.id);
        if (edit) catches = catches.map((x) => (x.id === rec.id ? rec : x)); else catches.push(rec);
        saveC();
        while (sheets.length) closeSheet();
        state.diarioSeg = rec.keep ? 'casa' : 'pescados';
        if (state.tab !== 'diario') goTab('diario'); else renderDiario();
        toast(edit ? 'Captura actualizada' : `${f.nombre} apuntada`);
        if (isNew) setTimeout(() => showUnlock(f), 550);
      };
      update();
      if (!c.sp) { picker.hidden = false; renderPicker(); }
    },
  });
}
async function openCatchDetail(id) {
  const c = catches.find((x) => x.id === id);
  if (!c) return;
  const f = fishById(c.sp) || { nombre: c.sp };
  const sp = spotById(c.spot);
  const di = dayInfo(c.t.slice(0, 10));
  const u = c.photo ? await photoURL(c.id) : null;
  const cond = c.cond;
  openSheet({
    title: '',
    left: 'Editar',
    body: `${u ? `<div style="margin:0 16px;border-radius:20px;overflow:hidden;max-height:340px"><img src="${u}" alt="" style="width:100%;display:block;object-fit:cover"></div>` : `<div class="fish-hero" style="background:radial-gradient(120% 120% at 20% 0%, color-mix(in srgb, ${(f.color && f.color.body) || '#8aa4bd'} 25%, #fff), color-mix(in srgb, ${(f.color && f.color.body) || '#8aa4bd'} 55%, #9fd3ec))">${fishSVG(f)}</div>`}
    <div class="stitle">${esc(f.nombre)}${c.n > 1 ? ` ×${c.n}` : ''}</div><div class="ssub">${cap(di.wdl)} ${di.d} de ${di.mesl} · ${c.t.slice(11, 16)} · ${esc(c.who || S.yo)}</div>
    <div class="info-grid">
      <div class="info-tile"><div class="k">Talla</div><div class="val">${c.cm ? c.cm + ' cm' : '—'}</div></div>
      <div class="info-tile"><div class="k">Peso</div><div class="val">${c.g ? (c.g >= 1000 ? n1(c.g / 1000) + ' kg' : n0(c.g) + ' g') : '—'}</div></div>
    </div>
    <div class="callout ${c.keep ? 'g' : 'b'}">${gl(c.keep ? 'home' : 'release', 'md')}<div><b>${c.keep ? 'Para casa' : 'Devuelto al agua'}</b><br><span style="font-size:14px;color:var(--label2)">${c.keep ? 'Cuenta en tu cupo del día' : '¡Bien hecho! Así hay pesca el año que viene'}</span></div></div>
    <div class="group" style="margin-top:14px">
      <button class="cell" data-spot="${sp.id}"><span class="t">Pesquero</span><span class="grow"></span><span class="v">${esc(sp.nombre)}</span>${chev}</button>
      ${c.cebo ? `<div class="cell"><span class="t">Cebo</span><span class="grow"></span><span class="v">${esc(c.cebo)}</span></div>` : ''}
      ${c.tec ? `<div class="cell"><span class="t">Técnica</span><span class="grow"></span><span class="v">${esc(cap(c.tec))}</span></div>` : ''}
    </div>
    ${cond ? `<div class="sec-h">Condiciones de ese momento</div><div class="group">${[['Viento', cond.viento], ['Mar', cond.mar], ['Marea', cond.marea], ['Agua', cond.agua], ['Luna', cond.luna], ['Índice TPTV', cond.indice != null ? n1(cond.indice) : null]].filter((x) => x[1]).map(([k, val]) => `<div class="cell"><span class="t">${k}</span><span class="grow"></span><span class="v">${esc(val)}</span></div>`).join('')}</div>` : ''}
    ${c.notas ? `<div class="sec-h">Notas</div><div class="group"><div class="prose">${esc(c.notas)}</div></div>` : ''}
    <div class="btn-row" style="margin-top:20px"><button class="btn" data-share="1">${ic('share', 'sm')} Presumir</button><button class="btn gray" data-fishinfo="1">${ic('fish', 'sm')} Ficha</button></div>`,
    onOpen: (el) => {
      $('[data-act="left"]', el).onclick = () => openCatchForm({ id: c.id });
      el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-spot]')) openSpotSheet(sp.id);
        if (e.target.closest('[data-fishinfo]')) openFishSheet(c.sp);
        if (e.target.closest('[data-share]')) {
          const text = `🎣 ${c.who && c.who !== S.yo ? c.who + ' ha sacado' : 'He sacado'} ${c.n > 1 ? c.n + ' ' : 'un'} ${f.nombre.toLowerCase()}${c.cm ? ` de ${c.cm} cm` : ''}${c.g ? ` (${c.g >= 1000 ? n1(c.g / 1000) + ' kg' : n0(c.g) + ' g'})` : ''} en ${sp.nombre}${c.cebo ? ' a ' + c.cebo.toLowerCase() : ''}. ${c.keep ? 'Para la cena 🍽️' : 'Y de vuelta al agua 🌊'}\n— TPTV · Te pesco TV`;
          const files = [];
          if (c.photo) { try { const b = await idb.get(c.id); if (b) files.push(new File([b], 'captura.jpg', { type: 'image/jpeg' })); } catch (er) { /* sin foto */ } }
          share(text, files);
        }
      });
    },
  });
}
function openPena() {
  const draw = (el) => {
    $('#pena-list', el).innerHTML = S.colegas.map((n, k) => `<div class="cell"><span class="ibox" style="background:hsl(${(k * 67) % 360} 65% 55%)">${esc(n.charAt(0).toUpperCase())}</span><span class="t grow">${esc(n)}</span><button class="nbtn" data-rm="${k}" style="color:var(--red)">${ic('trash', 'sm')}</button></div>`).join('') || '<div class="cell"><span class="s">Aún no has añadido a nadie</span></div>';
  };
  openSheet({
    title: 'La peña',
    body: `<div class="stitle">La peña</div><div class="ssub">Apunta quién saca cada pez y mirad el ranking.</div>
    <div class="group form"><label class="cell"><span class="t">Tu nombre</span><input id="pena-yo" value="${esc(S.yo)}" maxlength="20"></label></div>
    <div class="sec-h">Colegas</div><div class="group icons" id="pena-list"></div>
    <div class="group form" style="margin-top:12px"><div class="cell"><input id="pena-new" placeholder="Nombre del colega" style="text-align:left;color:var(--label)" maxlength="20"><button class="btn small" id="pena-add">Añadir</button></div></div>`,
    onOpen: (el) => {
      draw(el);
      $('#pena-yo', el).onchange = (e) => {
        const old = S.yo, nw = e.target.value.trim() || 'Yo';
        catches.forEach((c) => { if ((c.who || old) === old) c.who = nw; });
        S.yo = nw; saveS(); saveC();
      };
      $('#pena-add', el).onclick = () => { const v = $('#pena-new', el).value.trim(); if (v && !S.colegas.includes(v) && v !== S.yo) { S.colegas.push(v); saveS(); $('#pena-new', el).value = ''; draw(el); haptic(); } };
      el.addEventListener('click', (e) => { const r = e.target.closest('[data-rm]'); if (r) { S.colegas.splice(+r.dataset.rm, 1); saveS(); draw(el); } });
    },
    onClose: () => { if (state.tab === 'diario') renderDiario(); },
  });
}

/* ---------------- Compartir plan, checklist, ajustes ---------------- */
function share(text, files = []) {
  if (navigator.share) {
    const data = { text, title: 'TPTV' };
    if (files.length && navigator.canShare && navigator.canShare({ files })) data.files = files;
    navigator.share(data).catch(() => {});
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
}
function planText(key) {
  const ctx = state.ctx;
  const d = ctx.dayBy[key], di = dayInfo(key);
  const b = d.best[0];
  const i = b ? b.start : ctx.keys.findIndex((k) => k.startsWith(key + 'T08'));
  const H = ctx.H, M = ctx.M;
  const ill = d.ill;
  const ext = d.ext.filter((e) => !b || (e.t > new Date(b.from.getTime() - 3 * 3600e3) && e.t < new Date(b.to.getTime() + 3 * 3600e3)));
  const lines = [
    `🎣 *Plan de pesca · TPTV*`,
    `📍 ${ctx.sp.nombre} (${ctx.sp.municipio})`,
    `📅 ${di.rel ? di.rel + ', ' : ''}${di.wdl} ${di.d} de ${di.mesl}${b ? `, de ${fmtHM(b.from)} a ${fmtHM(b.to)}` : ''}`,
    `💨 ${windText(H.wind_speed_10m[i], H.wind_direction_10m[i])} · ${n0(H.wind_speed_10m[i])} km/h (rachas ${n0(H.wind_gusts_10m[i])})`,
    M.wave_height ? `🌊 ${seaState(M.wave_height[i])} · ${n1(M.wave_height[i])} m${M.sea_surface_temperature && M.sea_surface_temperature[i] != null ? ` · agua a ${n0(M.sea_surface_temperature[i])}°` : ''}` : null,
    ext.length ? `↕️ ${ext.map((e) => `${e.type === 'hi' ? 'Pleamar' : 'Bajamar'} ${fmtHM(e.t)}`).join(' · ')}` : null,
    `🌙 ${Astro.phaseName(ill.phase)} (${n0(ill.fraction * 100)} %) · ${wx(H.weather_code[i], H.is_day[i]).em} ${n0(H.temperature_2m[i])}°`,
    `⭐ Índice TPTV: *${n1(b ? b.max : ctx.scores[i].s)}/10* · ${verdict(b ? b.max : ctx.scores[i].s)}`,
    ``,
    `¿Quién se apunta? 🙋‍♂️`,
  ];
  return lines.filter((l) => l != null).join('\n');
}
function openPlan(key0) {
  const ctx = state.ctx;
  if (!ctx) return;
  const days = ctx.days.filter((d) => d.key >= dayKey()).slice(0, 7);
  let key = key0 || (days.slice(0, 3).sort((a, b) => b.max - a.max)[0] || days[0]).key;
  const draw = (el) => {
    $('#plan-days', el).innerHTML = days.map((d) => { const di = dayInfo(d.key); return `<button class="dpill ${d.key === key ? 'on' : ''}" data-pday="${d.key}"><span class="w">${di.rel === 'Hoy' ? 'Hoy' : di.wd}</span><span class="n">${di.d}</span><span class="m" style="font-weight:700;color:${d.key === key ? '#fff' : scoreColor(d.max)}">${n1(d.max)}</span></button>`; }).join('');
    $('#plan-txt', el).textContent = planText(key);
  };
  openSheet({
    title: 'Plan con los colegas',
    body: `<div class="stitle">¿Cuándo vamos?</div><div class="ssub">El mejor rato de cada día en ${esc(ctx.sp.nombre)}.</div>
    <div class="days-scroll" id="plan-days"></div>
    <div class="sec-h">Mensaje</div>
    <div class="group"><div class="prose" id="plan-txt" style="white-space:pre-wrap;font-size:15px"></div></div>
    <div style="padding:20px 16px 0;display:grid;gap:10px"><button class="btn" id="plan-wa" style="background:#25D366">Enviar por WhatsApp</button>${navigator.share ? `<button class="btn gray" id="plan-more">${ic('share', 'sm')} Más opciones</button>` : ''}<button class="btn gray" id="plan-copy">Copiar texto</button></div>`,
    onOpen: (el) => {
      draw(el);
      el.addEventListener('click', (e) => { const p = e.target.closest('[data-pday]'); if (p) { key = p.dataset.pday; haptic(); draw(el); } });
      $('#plan-wa', el).onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(planText(key)), '_blank', 'noopener');
      if ($('#plan-more', el)) $('#plan-more', el).onclick = () => share(planText(key));
      $('#plan-copy', el).onclick = () => { navigator.clipboard && navigator.clipboard.writeText(planText(key)).then(() => toast('Copiado')); };
    },
  });
}
function openKit() {
  let kit = LS.get('kit', null) || { done: [], extra: [] };
  const all = () => [...D.kit.map((g) => ({ ...g, items: g.items })), ...(kit.extra.length ? [{ grupo: 'Lo mío', items: kit.extra }] : [])];
  const draw = (el) => {
    const items = all().flatMap((g) => g.items);
    const done = items.filter((x) => kit.done.includes(x)).length;
    $('#kit-prog', el).innerHTML = `<i style="width:${items.length ? done / items.length * 100 : 0}%"></i>`;
    $('#kit-count', el).textContent = `${done} de ${items.length} listos`;
    $('#kit-groups', el).innerHTML = all().map((g) => `<div class="sec-h">${esc(g.grupo)}</div><div class="group">${g.items.map((x) => `<button class="cell check-row ${kit.done.includes(x) ? 'done' : ''}" data-kit="${esc(x)}"><span class="box">${kit.done.includes(x) ? ic('check', 'xs') : ''}</span><span class="t grow" style="font-size:16px">${esc(x)}</span></button>`).join('')}</div>`).join('');
  };
  openSheet({
    title: 'Checklist',
    right: 'Desmarcar',
    body: `<div class="stitle">Que no se te olvide nada</div><div class="ssub" id="kit-count"></div><div class="progress" id="kit-prog"></div><div id="kit-groups"></div>
    <div class="group form" style="margin-top:14px"><div class="cell"><input id="kit-new" placeholder="Añadir algo tuyo" style="text-align:left;color:var(--label)"><button class="btn small" id="kit-add">Añadir</button></div></div>`,
    onOpen: (el) => {
      draw(el);
      el.addEventListener('click', (e) => {
        const k = e.target.closest('[data-kit]');
        if (k) { const x = k.dataset.kit; const i = kit.done.indexOf(x); if (i >= 0) kit.done.splice(i, 1); else kit.done.push(x); LS.set('kit', kit); haptic(); draw(el); }
      });
      $('[data-act="right"]', el).onclick = () => { kit.done = []; LS.set('kit', kit); draw(el); toast('Lista a cero'); };
      $('#kit-add', el).onclick = () => { const v = $('#kit-new', el).value.trim(); if (v) { kit.extra.push(v); LS.set('kit', kit); $('#kit-new', el).value = ''; draw(el); } };
    },
  });
}
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
function doInstall() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.finally(() => { deferredPrompt = null; }); return; }
  openInstallHelp();
}
function openInstallHelp() {
  openSheet({
    title: 'Instalar',
    body: `<div style="text-align:center;padding:10px 16px 0"><img src="icons/apple-touch-icon.png" alt="" style="width:96px;height:96px;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.2)"></div><div class="stitle" style="text-align:center">TPTV en tu pantalla de inicio</div><div class="ssub" style="text-align:center">A pantalla completa y sin cobertura.</div>
    <div class="sec-h">iPhone (Safari)</div><div class="group"><div class="prose"><p>1. Abre la web en <b>Safari</b>.</p><p>2. Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).</p><p>3. Baja y toca <b>«Añadir a pantalla de inicio»</b> y luego <b>Añadir</b>.</p></div></div>
    <div class="sec-h">Android (Chrome)</div><div class="group"><div class="prose"><p>1. Abre la web en <b>Chrome</b>.</p><p>2. Menú <b>⋮</b> → <b>«Instalar aplicación»</b> (o «Añadir a pantalla de inicio»).</p></div></div>`,
  });
}
function openSettings() {
  const sp = spotById(S.spot);
  openSheet({
    title: 'Ajustes',
    body: `<div class="stitle">Ajustes</div>
    <div class="sec-h">Pesca</div>
    <div class="group icons">
      <button class="cell" data-a="spot"><span class="ibox" style="background:var(--tint)">${ic('pin')}</span><span class="t grow">Mi pesquero</span><span class="v ell" style="max-width:150px">${esc(sp.nombre)}</span>${chev}</button>
      <button class="cell" data-a="pena"><span class="ibox" style="background:var(--orange)">${ic('users')}</span><span class="t grow">La peña</span><span class="v">${S.colegas.length} colegas</span>${chev}</button>
      <button class="cell" data-a="kit"><span class="ibox" style="background:var(--green)">${ic('bag')}</span><span class="t grow">Checklist del kit</span>${chev}</button>
      <button class="cell" data-a="normas"><span class="ibox" style="background:var(--red)">${ic('scale')}</span><span class="t grow">Normativa y tallas</span>${chev}</button>
    </div>
    <div class="sec-h">App</div>
    <div class="group icons">
      <button class="cell" data-a="install"><span class="ibox" style="background:var(--indigo)">${ic('phone')}</span><span class="t grow">Instalar en el móvil</span>${chev}</button>
      <button class="cell" data-a="export"><span class="ibox" style="background:var(--teal)">${ic('download')}</span><span class="t grow">Guardar copia de seguridad</span>${chev}</button>
      <label class="cell" style="cursor:pointer"><span class="ibox" style="background:var(--teal)">${ic('upload')}</span><span class="t grow">Restaurar copia</span>${chev}<input type="file" accept="application/json,.json" id="imp" hidden></label>
      <button class="cell" data-a="wipe"><span class="ibox" style="background:var(--red)">${ic('trash')}</span><span class="t grow" style="color:var(--red)">Borrar mi diario</span></button>
    </div>
    <div class="sec-f">Todo se guarda solo en este móvil: haz una copia de vez en cuando.</div>
    <div class="sec-h">Fuentes</div>
    <div class="group"><div class="prose" style="font-size:14px"><p><b>Tiempo, viento, oleaje, temperatura del agua y marea:</b> <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> (CC BY 4.0): ECMWF, DWD, Météo-France y Copernicus Marine.</p><p><b>Mapa:</b> Esri y OpenStreetMap.</p><p><b>Sol y luna:</b> calculados en el móvil.</p><p><b>Peces, tallas y pesqueros:</b> recopilación de la normativa andaluza, estatal y europea y de la experiencia de pescadores de la zona (ver Normativa).</p></div></div>
    <div class="sec-f" style="text-align:center;padding:20px 32px">TPTV · Te pesco TV · v${VERSION}<br>Pesca responsable: tallas, cupos y zonas protegidas.</div>`,
    onOpen: (el) => {
      el.addEventListener('click', (e) => {
        const a = e.target.closest('[data-a]');
        if (!a) return;
        const k = a.dataset.a;
        if (k === 'spot') openSpotPicker();
        if (k === 'pena') openPena();
        if (k === 'kit') openKit();
        if (k === 'normas') openNormas();
        if (k === 'install') doInstall();
        if (k === 'export') exportBackup();
        if (k === 'wipe') {
          if (!confirm('¿Borrar todas tus capturas y fotos? No se puede deshacer.')) return;
          catches = []; saveC(); idb.clear().catch(() => {}); toast('Diario borrado', 'trash');
        }
      });
      $('#imp', el).onchange = (e) => importBackup(e.target.files[0]);
    },
  });
}
const blobToData = (b) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function exportBackup() {
  const photos = {};
  for (const c of catches) if (c.photo) { try { const b = await idb.get(c.id); if (b) photos[c.id] = await blobToData(b); } catch (e) { /* sin foto */ } }
  const data = { app: 'TPTV', v: 1, fecha: new Date().toISOString(), settings: S, catches, kit: LS.get('kit', null), photos };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const name = `tptv-copia-${dayKey()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Copia de TPTV' }).catch(() => {}); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Copia guardada');
}
async function importBackup(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'TPTV' || !Array.isArray(data.catches)) throw new Error('formato');
    if (!confirm(`La copia tiene ${data.catches.length} capturas. ¿Añadirlas a tu diario?`)) return;
    const have = new Set(catches.map((c) => c.id));
    for (const c of data.catches) if (!have.has(c.id)) catches.push(c);
    for (const [id, du] of Object.entries(data.photos || {})) { const b = await (await fetch(du)).blob(); await idb.put(id, b); }
    if (data.settings) { S.colegas = [...new Set([...S.colegas, ...(data.settings.colegas || [])])]; S.favs = [...new Set([...S.favs, ...(data.settings.favs || [])])]; saveS(); }
    if (data.kit) LS.set('kit', data.kit);
    saveC();
    toast('Copia restaurada');
    if (state.tab === 'diario') renderDiario();
  } catch (e) { toast('Ese archivo no es una copia de TPTV', 'warn'); }
}

/* ---------------- Arranque ---------------- */
darkMQ.addEventListener && darkMQ.addEventListener('change', () => { const sv = $('#v-spots'); if (sv.dataset.built) { delete sv.dataset.built; if (state.tab === 'spots') renderSpots(); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && state.ctx && Date.now() - state.ctx.t > TTL && state.tab === 'hoy') renderHoy(); });
renderHoy();
// Para capturas de prueba: ?tab=peces&y=600&sheet=fish:dorada
(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('noanim')) document.head.insertAdjacentHTML('beforeend', '<style>*{animation:none!important;transition:none!important}</style>');
  if (q.get('tab') && q.get('tab') !== 'hoy') goTab(q.get('tab'));
  const y = +q.get('y') || 0, sh = q.get('sheet');
  setTimeout(() => {
    if (y) $('#v-' + state.tab).scrollTop = y;
    if (sh) {
      const [k, id] = sh.split(':');
      ({ fish: openFishSheet, spot: openSpotSheet, day: openDaySheet, catch: () => openCatchForm(id ? { sp: id } : {}), plan: () => openPlan(), kit: openKit, normas: openNormas, ajustes: openSettings })[k]?.(id || dayKey());
    }
  }, 2500);
})();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
window.TPTVdebug = { state, buildCtx, fishSVG };
})();
