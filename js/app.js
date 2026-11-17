/* TPTV · Te pesco TV — app de pesca recreativa del Campo de Gibraltar y Tarifa.
   Vanilla JS, sin dependencias. Datos de tiempo y mar: Open-Meteo (gratis, sin clave). Todo lo tuyo se guarda en el móvil. */
(() => {
'use strict';
const D = window.TPTV;
const VERSION = '1.1.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
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
  back: '<path d="M15 5l-7 7 7 7"/>',
  list: '<rect class="f" x="4" y="3" width="16" height="18" rx="3.5"/><path d="M8 8.5l1.3 1.3L12 7.2M8 14l1.3 1.3 2.7-2.6M14.5 9h2M14.5 14.5h2"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
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
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  layers: '<path d="M12 3 2.5 8 12 13l9.5-5z"/><path d="M2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
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
let dataVer = 0;
const saveC = () => { dataVer++; LS.set('catches', catches); syncPenaSoon(); };

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
    if (d.moon.upper) sol.push({ t: d.moon.upper, k: 'maj', n: 'Luna arriba' });
    if (d.moon.lower) sol.push({ t: d.moon.lower, k: 'maj', n: 'Luna abajo' });
    if (d.moon.rise) sol.push({ t: d.moon.rise, k: 'min', n: 'Sale' });
    if (d.moon.set) sol.push({ t: d.moon.set, k: 'min', n: 'Se pone' });
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
function fishMarkup(f, cls = '') {
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

// Cada especie se dibuja una sola vez en un <symbol> oculto y luego se reutiliza con <use>: la Pecedex y las listas van
// mucho más ligeras que generando 56 dibujos completos en cada filtro.
const fishDone = new Set();
function fishSVG(f, cls = '') {
  const key = (f.id || ('x-' + norm(f.nombre || 'pez'))).replace(/[^a-z0-9-]/g, '');
  if (!fishDone.has(key)) {
    fishDone.add(key);
    const full = fishMarkup(f);
    const inner = full.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const defs = [];
    const body = inner.replace(/<defs>[\s\S]*?<\/defs>|<clipPath[\s\S]*?<\/clipPath>/g, (m) => { defs.push(m.replace(/^<defs>|<\/defs>$/g, '')); return ''; });
    document.body.insertAdjacentHTML('beforeend', `<svg class="fx-def" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden"><defs>${defs.join('')}</defs><symbol id="fx-${key}" viewBox="0 0 200 100">${body}</symbol></svg>`);
  }
  return `<svg class="fx ${cls}" viewBox="0 0 200 100" aria-hidden="true"><use href="#fx-${key}"/></svg>`;
}
/* ---------------- Dibujos de indicadores ----------------
   Todo se pinta una vez como SVG/HTML y se anima solo con CSS (transform, opacity y trazos):
   las animaciones arrancan cuando la tarjeta entra en pantalla (animateHoy). */
function smoothPath(p) {
  let d = `M${p[0][0]},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1].toFixed(1)}`;
  }
  return d;
}
// Próximas 24 h: curva de la nota que se dibuja, franja del mejor rato y el «ahora» latiendo
function hours24HTML(ctx, idx, topThr) {
  const H = ctx.H, CW = 58, CH = 62, n = idx.length, W = n * CW;
  const sc = idx.map((k) => ctx.scores[k].s);
  // Escala ajustada a lo que se mueve la nota (mínimo 3 puntos de margen) para que la curva se lea
  const mx = Math.max(...sc), mn = Math.min(...sc), lo = Math.max(0, Math.min(mn - 0.4, mx - 3)), hi = Math.min(10, Math.max(mx + 0.3, lo + 3));
  const pts = sc.map((s, j) => [j * CW + CW / 2, CH - 9 - (s - lo) / (hi - lo) * (CH - 20)]);
  const d = smoothPath(pts);
  const id = 'h' + (++uid);
  const stops = sc.map((s, j) => `<stop offset="${(pts[j][0] / W).toFixed(3)}" stop-color="${scoreColor(s)}"/>`).join('');
  let bands = '', run = null;
  sc.forEach((s, j) => {
    const b = s >= topThr;
    if (b && run == null) run = j;
    if ((!b || j === n - 1) && run != null) { const e = b ? j : j - 1; bands += `<i class="hband" style="left:${run * CW + 3}px;width:${(e - run + 1) * CW - 6}px;animation-delay:${0.5 + run * 0.03}s"></i>`; run = null; }
  });
  const top = idx.map((k, j) => `<div class="hc"><span class="hh">${j === 0 ? 'Ahora' : ctx.keys[k].slice(11, 13)}</span><span class="em">${wx(H.weather_code[k], H.is_day[k]).e}</span></div>`).join('');
  const bot = idx.map((k, j) => `<div class="hc"><span class="sc" style="color:${scoreColor(sc[j])}">${n1(sc[j])}</span><span class="wd">${arrowSVG((H.wind_direction_10m[k] + 180) % 360)}${n0(H.wind_speed_10m[k])}</span></div>`).join('');
  const dots = pts.map(([x, y], j) => { const b = sc[j] >= topThr; return `<circle class="hd${b ? ' b' : ''}" cx="${x}" cy="${y.toFixed(1)}" r="${b ? 4.2 : 2.6}" fill="${b ? '#fff' : scoreColor(sc[j])}" style="animation-delay:${(0.2 + Math.min(j, 12) * 0.06).toFixed(2)}s"/>`; }).join('');
  return `<div class="hours"><div class="h24" style="width:${W}px">${bands}<div class="hrow">${top}</div><svg class="hcurve" width="${W}" height="${CH}" viewBox="0 0 ${W} ${CH}"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" x2="${W}" y1="0" y2="0">${stops}</linearGradient></defs><path class="harea" d="${d}L${pts[n - 1][0]},${CH}L${pts[0][0]},${CH}Z" fill="url(#${id})"/><path class="hline" d="${d}" pathLength="1" stroke="url(#${id})"/>${dots}<circle class="hnow" cx="${pts[0][0]}" cy="${pts[0][1].toFixed(1)}" r="5"/></svg><div class="hrow">${bot}</div></div></div>`;
}
// Viento: aguja que entra con muelle y tiembla con las rachas, arco de rachas y estelas que cruzan la tarjeta
function compassSVG(dir, spd, gust) {
  let ticks = '';
  for (let a = 0; a < 360; a += 10) {
    const q = a % 90 === 0, r1 = q ? 37 : 40, r = 44, rad = (a - 90) * Math.PI / 180;
    ticks += `<line x1="${(60 + r1 * Math.cos(rad)).toFixed(1)}" y1="${(60 + r1 * Math.sin(rad)).toFixed(1)}" x2="${(60 + r * Math.cos(rad)).toFixed(1)}" y2="${(60 + r * Math.sin(rad)).toFixed(1)}" stroke="rgba(255,255,255,${q ? 0.85 : 0.3})" stroke-width="${q ? 2 : 1.1}"/>`;
  }
  const L = [['N', 0], ['E', 90], ['S', 180], ['O', 270]].map(([t, a]) => { const rad = (a - 90) * Math.PI / 180; return `<text x="${(60 + 28.5 * Math.cos(rad)).toFixed(1)}" y="${(60 + 28.5 * Math.sin(rad) + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="rgba(255,255,255,.7)">${t}</text>`; }).join('');
  const rot = (dir + 180) % 360;
  const g = gust || spd || 0;
  const gcol = g > 60 ? '#FF453A' : g > 40 ? '#FF9F0A' : g > 25 ? '#FFD60A' : '#30D158';
  const gf = clamp(g / 90, 0.03, 1) * 100, sf = clamp((spd || 0) / 90, 0.02, 1) * 100;
  const wob = clamp((g - (spd || 0)) / 5, 1.2, 7).toFixed(1);
  return `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4.5"/><circle class="garc" cx="60" cy="60" r="52" fill="none" stroke="${gcol}" stroke-opacity=".55" stroke-width="4.5" stroke-linecap="round" pathLength="100" style="--a:${gf.toFixed(1)}" transform="rotate(-90 60 60)"/><circle class="garc s" cx="60" cy="60" r="52" fill="none" stroke="${gcol}" stroke-width="4.5" stroke-linecap="round" pathLength="100" style="--a:${sf.toFixed(1)}" transform="rotate(-90 60 60)"/>${ticks}${L}<g class="ndl" style="--r:${rot}deg"><g class="ndl-w" style="--w:${wob}deg"><line x1="60" y1="100" x2="60" y2="26" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M60 15 l8 14 h-16z" fill="#fff"/><circle cx="60" cy="100" r="4.2" fill="none" stroke="#fff" stroke-width="2.4"/></g></g><circle cx="60" cy="60" r="19" fill="rgba(12,30,56,.6)"/><text x="60" y="62" text-anchor="middle" font-size="16" font-weight="700" fill="#fff">${n0(spd)}</text><text x="60" y="72.5" text-anchor="middle" font-size="7" font-weight="600" fill="rgba(255,255,255,.75)">km/h</text></svg>`;
}
const windStreaks = (dir, spd) => `<div class="wstreaks" style="--r:${((dir + 180) % 360) - 90}deg;--v:${clamp(3.2 - (spd || 0) / 22, 0.9, 3.2).toFixed(2)}s" aria-hidden="true">${'<i></i>'.repeat(6)}</div>`;
// Oleaje: dos capas de ola cuya altura y ritmo salen del parte
function waveSVG(h, per) {
  const A = clamp((h || 0) * 7, 1.4, 11), L = 100;
  const mk = (amp, yb) => { let d = `M0 ${yb}`; for (let x = 0; x < 400; x += L) d += ` q${L / 4} ${(-amp).toFixed(1)} ${L / 2} 0 t${L / 2} 0`; return d + ' V70 H0Z'; };
  const dur = clamp(per || 7, 4, 14) * 0.85;
  return `<div class="wavebox" aria-hidden="true"><svg viewBox="0 0 400 70" preserveAspectRatio="none" style="animation-duration:${dur.toFixed(1)}s"><path class="wv b" d="${mk(A * 0.7, 30)}"/><path class="wv" d="${mk(A, 38)}"/></svg></div>`;
}
// Agua: escala de 12 a 26 °C con el punto deslizándose y burbujas que suben
const waterBar = (t) => t == null ? '' : `<div class="tbar"><b style="--x:${(clamp((t - 12) / 14, 0, 1) * 100).toFixed(1)}%"><i></i></b></div><div class="tbar-l"><span>12°</span><span>19°</span><span>26°</span></div>`;
const bubbles = () => `<div class="bubs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
// Corriente: flechas que fluyen hacia donde va el agua
const curFlow = (dir) => dir == null ? '' : `<div class="cflow" style="--r:${dir - 90}deg" aria-hidden="true">${[0, 1, 2].map((r) => `<div>${[0, 1, 2].map((k) => `<svg viewBox="0 0 10 14" style="animation-delay:${(k * 0.35 + r * 0.18).toFixed(2)}s"><path d="M2 2l6 5-6 5"/></svg>`).join('')}</div>`).join('')}</div>`;
function moonSVG(p, size = 58, id = 'm' + (++uid)) {
  const k = Math.cos(2 * Math.PI * p);
  const rx = Math.abs(k) * 48;
  const waxing = p < 0.5;
  const outer = waxing ? 1 : 0;
  const term = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  const lit = `M50 2 A48 48 0 0 ${outer} 50 98 A${rx.toFixed(2)} 48 0 0 ${term} 50 2Z`;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><defs><radialGradient id="${id}" cx="40%" cy="35%"><stop offset="0" stop-color="#fffdf2"/><stop offset="1" stop-color="#d9d3bf"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="rgba(30,36,52,.75)"/><path d="${lit}" fill="url(#${id})"/><circle cx="38" cy="36" r="6" fill="rgba(0,0,0,.06)"/><circle cx="62" cy="62" r="9" fill="rgba(0,0,0,.05)"/><circle cx="60" cy="30" r="4" fill="rgba(0,0,0,.05)"/></svg>`;
}
// Luna: la luna con su halo, el anillo de iluminación que se rellena y estrellas que titilan
function moonWidget(ill) {
  return `<div class="moonw"><svg class="mring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3"/><circle class="mfill" cx="40" cy="40" r="36" fill="none" stroke="#fff4c2" stroke-width="3" stroke-linecap="round" pathLength="100" style="--a:${(ill.fraction * 100).toFixed(1)}" transform="rotate(-90 40 40)"/></svg><div class="mglow"></div>${moonSVG(ill.phase, 56)}<i class="st s1"></i><i class="st s2"></i><i class="st s3"></i></div>`;
}
// Sol: el arco se dibuja y el sol viaja desde el alba hasta donde está ahora, con sus rayos girando
function sunArcSVG(d, now = new Date()) {
  const f = clamp((now - d.sr) / (d.ss - d.sr), -0.15, 1.15);
  const up = f >= 0 && f <= 1;
  const yy = (t) => 60 - 46 * Math.sin(Math.PI * clamp(t, 0, 1));
  let path = '';
  for (let i = 0; i <= 40; i++) { const t = i / 40; path += `${i ? 'L' : 'M'}${(12 + 136 * t).toFixed(1)},${yy(t).toFixed(1)}`; }
  const ff = clamp(f, 0, 1);
  const done = Array.from({ length: 41 }, (_, i) => i / 40).filter((t) => t <= ff).map((t, i) => `${i ? 'L' : 'M'}${(12 + 136 * t).toFixed(1)},${yy(t).toFixed(1)}`).join('');
  const ex = 12 + 136 * ff, ey = up ? yy(ff) : 60;
  const sun = up
    ? `<g class="sunm"><animateMotion dur="1.6s" begin="indefinite" fill="freeze" keyPoints="0;${ff.toFixed(3)}" keyTimes="0;1" calcMode="spline" keySplines=".2 .8 .2 1" path="${path}"/><g class="rays">${Array.from({ length: 8 }, (_, k) => `<line x1="0" y1="-10" x2="0" y2="-13" transform="rotate(${k * 45})"/>`).join('')}</g><circle r="6.5" fill="#FFD60A"/></g>`
    : `<circle cx="${ex.toFixed(1)}" cy="${ey}" r="5.5" fill="rgba(255,255,255,.35)"/>`;
  return `<svg viewBox="0 0 160 74"><defs><linearGradient id="sg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD60A" stop-opacity=".35"/><stop offset="1" stop-color="#FFD60A" stop-opacity="0"/></linearGradient></defs><path d="${path}" stroke="rgba(255,255,255,.28)" stroke-width="1.8" fill="none" stroke-dasharray="3 4"/>${done ? `<path class="sdone-a" d="${done}L${ex.toFixed(1)},60L12,60Z" fill="url(#sg${uid})"/><path class="sdone" d="${done}" pathLength="1" stroke="#FFD60A" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : ''}<line x1="4" y1="60" x2="156" y2="60" stroke="rgba(255,255,255,.35)" stroke-width="1"/>${sun}</svg>`;
}
// Presión: el arco se rellena y la aguja barre hasta el valor
function gaugeSVG(p) {
  const min = 985, max = 1040;
  const f = clamp((p - min) / (max - min), 0, 1);
  const a0 = 150, a1 = 390, a = a0 + (a1 - a0) * f;
  const pt = (ang, r) => [60 + r * Math.cos(ang * Math.PI / 180), 60 + r * Math.sin(ang * Math.PI / 180)];
  const [x0, y0] = pt(a0, 44), [x1, y1] = pt(a1, 44), [xa, ya] = pt(a, 44);
  const tk = [0, 0.25, 0.5, 0.75, 1].map((t) => { const an = a0 + (a1 - a0) * t, [ax, ay] = pt(an, 35), [bx, by] = pt(an, 31); return `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>`; }).join('');
  return `<svg viewBox="0 0 120 100"><path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A44 44 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="rgba(255,255,255,.18)" stroke-width="7" fill="none" stroke-linecap="round"/>${f > 0.01 ? `<path class="garc2" d="M${x0.toFixed(1)} ${y0.toFixed(1)} A44 44 0 ${a - a0 > 180 ? 1 : 0} 1 ${xa.toFixed(1)} ${ya.toFixed(1)}" pathLength="1" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>` : ''}${tk}<g class="gndl" style="--a0:${a0}deg;--a:${a.toFixed(1)}deg"><line x1="60" y1="60" x2="89" y2="60" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></g><circle cx="60" cy="60" r="4.5" fill="#fff"/><text x="60" y="88" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${n0(p)}</text><text x="60" y="99" text-anchor="middle" font-size="8" font-weight="600" fill="rgba(255,255,255,.7)">hPa</text></svg>`;
}
// Marea del día: la curva se dibuja, pleamares y bajamares marcadas y el nivel de ahora latiendo
function tideMiniSVG(ctx, key) {
  const idx = []; ctx.keys.forEach((k, i) => { if (k.startsWith(key)) idx.push(i); });
  const vals = idx.map((i) => ctx.lvl[i]).filter((v) => v != null);
  if (vals.length < 4) return '';
  const lo = Math.min(...vals) - 0.05, hi = Math.max(...vals) + 0.05;
  const W = 300, Hh = 80;
  const X = (i) => (i / (idx.length - 1)) * W, Y = (v) => Hh - 8 - ((v - lo) / (hi - lo)) * (Hh - 20);
  const pts = [];
  idx.forEach((ii, i) => { const v = ctx.lvl[ii]; if (v != null) pts.push([+X(i).toFixed(1), Y(v)]); });
  const d = smoothPath(pts);
  const area = `${d}L${pts[pts.length - 1][0]},${Hh}L${pts[0][0]},${Hh}Z`;
  const now = new Date();
  const i0 = idx[0];
  const fx = (t) => X((t - ctx.T[i0]) / 3600e3);
  const lvNow = levelAt(ctx, now);
  const ext = ctx.ext.filter((e) => dayKey(e.t) === key).map((e, k) => `<circle class="tx ${e.type}" cx="${fx(e.t).toFixed(1)}" cy="${Y(e.h).toFixed(1)}" r="3.6" style="animation-delay:${(0.7 + k * 0.12).toFixed(2)}s"/>`).join('');
  const dot = key === dayKey() && lvNow != null ? `<line x1="${fx(now).toFixed(1)}" y1="0" x2="${fx(now).toFixed(1)}" y2="${Hh}" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="2 3"/><circle class="tnow-r" cx="${fx(now).toFixed(1)}" cy="${Y(lvNow).toFixed(1)}" r="5"/><circle cx="${fx(now).toFixed(1)}" cy="${Y(lvNow).toFixed(1)}" r="5" fill="#fff"/>` : '';
  const id = 'tg' + (++uid);
  return `<svg viewBox="0 0 ${W} ${Hh}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff" stop-opacity=".6"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/></linearGradient></defs><path class="tarea" d="${area}" fill="url(#${id})"/><path class="tline" d="${d}" pathLength="1" stroke="#bfeaff" stroke-width="2.6" fill="none" stroke-linecap="round"/>${ext}${dot}</svg>`;
}
const untilTxt = (t) => { const m = Math.max(0, Math.round((t - new Date()) / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`; };
// Arranca las animaciones de cada tarjeta cuando entra en pantalla (y cuenta los números hasta su valor)
let hoyIO = null;
function animateHoy(v) {
  const still = (matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim/.test(location.search));
  const go = (card) => {
    card.classList.add('in');
    $$('animateMotion', card).forEach((a) => { try { a.beginElement(); } catch (e) { /* sin SMIL */ } });
    if (still) return;
    $$('[data-cnt]', card).forEach((el) => {
      const to = parseFloat(el.dataset.cnt), dec = +el.dataset.dec || 0, t0 = performance.now();
      if (!isFinite(to)) return;
      const tick = (now) => { const p = Math.min(1, Math.max(0, now - t0) / 900); el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec).replace('.', ','); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  };
  if (hoyIO) hoyIO.disconnect();
  if (!('IntersectionObserver' in window)) { $$('.wcard', v).forEach(go); return; }
  hoyIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { go(e.target); hoyIO.unobserve(e.target); } }), { root: v, rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
  $$('.wcard', v).forEach((c) => hoyIO.observe(c));
  // Red de seguridad: si el observador no avisa (algunos móviles al volver a la app), se comprueba a mano al hacer scroll
  const check = () => {
    const H = v.clientHeight;
    $$('.wcard:not(.in):not(.sk)', v).forEach((c) => { const r = c.getBoundingClientRect(); if (r.top < H && r.bottom > 0) { go(c); hoyIO.unobserve(c); } });
  };
  let raf = 0;
  v.onscroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; check(); }); };
  setTimeout(check, 120);
  setTimeout(check, 900);
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
  else if (pages.length) closePage(true);
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

// Barras del sistema (hora/batería arriba y botones abajo en Android) del mismo color que la pantalla
function setBars() {
  const m = document.querySelector('meta[name="theme-color"]');
  if (!m) return;
  const c = '#000000';
  if (m.content !== c) m.content = c;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => setBars());
/* ---------------- Pestañas ---------------- */
const state = { tab: 'hoy', ctx: null, rendered: {}, tideDay: null, spotFilter: 'todos', spotSort: 'mejor', spotQ: '', fishFilter: 'todos', fishQ: '', fishSort: 'num', diarioSeg: 'pescados', whoFilter: 'todos', me: null };
$$('[data-ic]').forEach((el) => { el.outerHTML = ic(el.dataset.ic); });
$('#fab').innerHTML = ic('plus');
$('#fab').addEventListener('click', () => openCatchForm());
$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  if (b.dataset.tab === state.tab) { if (pages.length) { closeAllPages(); return; } $('#v-' + state.tab).scrollTo({ top: 0, behavior: 'smooth' }); return; }
  goTab(b.dataset.tab);
});
function goTab(tab) {
  if (pages.length) closeAllPages();
  state.tab = tab;
  haptic();
  $$('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $$('.view').forEach((v) => v.classList.toggle('on', v.dataset.view === tab));
  document.body.className = document.body.className.replace(/\btab-\w+/g, '').trim() + ' tab-' + tab;
  document.body.classList.toggle('dark-tab', tab === 'hoy');
  setBars();
  render(tab);
}
// Volver a una pestaña no la rehace si nada ha cambiado (antes se repintaba entera en cada cambio de pestaña)
const lastSig = {};
function tabSig(tab) {
  if (tab === 'peces') return [dataVer, S.spot, JSON.stringify(state.dexF), state.fishSort, state.fishQ, curMonth()].join('|');
  if (tab === 'spots') return [dataVer, S.spot, allNow && allNow.t, state.spotFilter, state.spotSort, state.spotQ, S.favs.join(','), state.me && state.me.lat, state.ctx && state.ctx.t].join('|');
  if (tab === 'diario') return [dataVer, state.diarioSeg, state.whoFilter, window.Pena && Pena.loggedIn, PROFILE.name, PROFILE.avatar.length, state.diarioSeg === 'pena' ? Math.floor(Date.now() / 120000) : 0].join('|');
  return null;
}
function render(tab) {
  const sig = tabSig(tab);
  if (sig && lastSig[tab] === sig) return;
  lastSig[tab] = sig;
  if (tab === 'hoy') renderHoy();
  if (tab === 'kit') renderKit();
  if (tab === 'spots') renderSpots();
  if (tab === 'peces') renderPeces();
  if (tab === 'diario') renderDiario();
}
$$('.view').forEach((v) => v.addEventListener('scroll', () => v.classList.toggle('scrolled', v.scrollTop > (v.id === 'v-hoy' ? 8 : 36)), { passive: true }));
// Cabecera de cada pestaña: su acción propia a la izquierda y siempre ajustes y perfil a la derecha
function navbar(title, extra = '') {
  return `<div class="navbar"><div class="nleft">${extra}</div><div class="ntitle">${esc(title)}</div><div class="nact">${topActs()}</div></div><h1 class="ltitle">${esc(title)}</h1>`;
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
  return { bg: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 32%, ${sky[2]} 70%, ${sky[3]} 100%)`, orb: sky[3], top: sky[0] };
}
// Ajustes y perfil: un solo oyente para la cabecera de todas las pantallas
document.addEventListener('click', (e) => {
  const b = e.target.closest('.hoy-acts [data-act]');
  if (!b) return;
  e.stopPropagation();
  if (b.dataset.act === 'settings') openSettings();
  if (b.dataset.act === 'perfil') openProfile();
  if (b.dataset.act === 'avisos') openInbox();
}, true);
function topActs() {
  const n = unread();
  const bell = window.Pena && Pena.enabled && Pena.loggedIn ? `<button class="glass-btn bell" data-act="avisos" aria-label="Avisos">${ic('bell')}<b class="bell-b" ${n ? '' : 'hidden'}>${n > 9 ? '9+' : n}</b></button>` : '';
  return `<div class="hoy-acts">${bell}<button class="glass-btn" data-act="settings" aria-label="Ajustes">${ic('sliders')}</button>${hoyAvatar()}</div>`;
}
function hoyAvatar() {
  return `<button class="hoy-av pf-mini" data-act="perfil" aria-label="Mi perfil">${avatarHTML(PROFILE, window.Pena && Pena.uid, 'sm')}</button>`;
}
function hoySkeleton() {
  const sp = spotById(S.spot);
  const sq = (h = 176) => `<div class="wcard sq sk" style="min-height:${h}px"><span class="skl" style="width:46%"></span><span class="skc"></span><span class="skl" style="width:70%;margin-top:auto"></span></div>`;
  return `<div class="hoy-top"><div class="brand"><img class="logo" src="icons/icon.svg" alt=""><div>TPTV<small>Te pesco TV</small></div></div>${topActs()}</div>
  <div class="hero"><button class="place" data-act="pick-spot">${esc(sp.nombre)}${ic('down')}</button><div class="muni">${esc(sp.municipio)}</div><div class="sk-score skeleton"></div><div class="verdict sk-t">Mirando el mar…</div><span class="skl" style="width:62%;margin:10px auto 0;display:block"></span></div>
  <div class="wgrid sk-grid"><div class="wcard full sk"><span class="skl" style="width:38%"></span><div class="sk-hours">${'<i></i>'.repeat(7)}</div></div>${sq()}${sq()}<div class="wcard full sk" style="min-height:150px"><span class="skl" style="width:30%"></span><span class="skb" style="height:74px;margin-top:14px"></span></div>${sq()}${sq()}</div>`;
}async function renderHoy(force) {
  const v = $('#v-hoy');
  const sp = spotById(S.spot);
  // Ya pintado y con el parte al día: no se rehace (volver a Hoy es instantáneo)
  if (!force && state.ctx && state.ctx.sp.id === sp.id && v.dataset.done === sp.id && Date.now() - state.ctx.t < AUTO) return;
  if (!v.dataset.spot || v.dataset.spot !== sp.id || !state.ctx) { v.innerHTML = hoySkeleton(); v.scrollTop = 0; bindHoy(v); }
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
  state.sky0 = sky.top; document.body.style.setProperty('--sky0', sky.top); setBars();
  const st = v.scrollTop;
  v.innerHTML = html;
  v.scrollTop = st;
  // La nota cuenta hasta su valor al aparecer
  const scEl = $('.hero .score', v);
  if (scEl && !(matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim/.test(location.search))) {
    const target = ctx.scores[ctx.now].s, t0 = performance.now();
    const tick = (now) => { const p = Math.min(1, Math.max(0, now - t0) / 900); scEl.firstChild.textContent = n1(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  bindHoy(v);
  animateHoy(v);
  v.dataset.done = sp.id;
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
  const win24 = Array.from({ length: 25 }, (_, k) => i + k).filter((k) => k < ctx.keys.length);
  const topThr = Math.max(...win24.map((k) => ctx.scores[k].s)) - 0.5;
  const bestToday = (today.best || []).filter((b) => b.to > new Date());
  const bestTxt = bestToday.length ? `Mejor rato hoy: <b>${fmtHM(bestToday[0].from)}–${fmtHM(bestToday[0].to)}</b> (${n1(bestToday[0].max)})` : (() => { const tm = ctx.days.find((d) => d.key > dayKey()); return tm && tm.best[0] ? `Mañana, mejor de <b>${fmtHM(tm.best[0].from)} a ${fmtHM(tm.best[0].to)}</b> (${n1(tm.best[0].max)})` : ''; })();
  // Viento
  const sheltered = wtNow && sp.abrigo && sp.abrigo.includes(wtNow);
  const exposed = wtNow && sp.abrigo && sp.abrigo.length && !sp.abrigo.includes(wtNow);
  const windFoot = (sheltered ? `Resguardado del ${cap(wtNow)} · ` : exposed ? `Expuesto al ${cap(wtNow)} · ` : '') + `Rachas ${n0(gust)} km/h`;
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
  <div class="sky-fx"><div class="orb" style="--c:${skyFor(ctx).orb};left:-120px;top:-60px"></div><div class="orb" style="--c:#ffffff;right:-160px;top:120px;opacity:.12"></div>
  <svg class="wave-deco" viewBox="0 0 800 120" preserveAspectRatio="none"><path d="M0 60 Q 100 20 200 60 T 400 60 T 600 60 T 800 60 T 1000 60 T 1200 60 T 1400 60 T 1600 60 V120 H0Z" fill="#fff"/><path d="M0 80 Q 100 50 200 80 T 400 80 T 600 80 T 800 80 T 1000 80 T 1200 80 T 1400 80 T 1600 80 V120 H0Z" fill="#fff"/></svg></div>
  <div class="hoy-top"><div class="brand"><img class="logo" src="icons/icon.svg" alt=""><div>TPTV<small>Te pesco TV</small></div></div>${topActs()}</div>
  <div class="hero">
    <button class="place" data-act="pick-spot">${esc(sp.nombre)}${ic('down')}</button>
    <div class="muni">${esc(sp.municipio)} · ${esc(D.zonas[sp.mar] || '')}</div>
    <div class="score">${n1(sc.s)}<small>/10</small></div>
    <div class="verdict">${verdict(sc.s)}</div>
    <div class="hpills">${hpill('wind', `${esc(windName(dir))} ${n0(spd)} km/h`)}${wave != null ? hpill('wave', `${n1(wave)} m`) : ''}${ts ? hpill('tide', esc(ts.t)) : ''}</div>
    ${bestTxt ? `<div class="hbest">${gl('star', 'in')}<span>${bestTxt}</span></div>` : ''}
    <div class="updated">Índice de pesca TPTV · ${ctx.stale ? 'Sin conexión, datos de ' : 'Actualizado '}${agoText(ctx.t)}</div>
  </div>
  ${install}
  ${alerts.map(([k, t]) => `<div class="alert-glass ${k === 'o' ? 'warn' : ''}">${ic('warn')}<span>${esc(t)}</span></div>`).join('')}
  <div class="wgrid">
    <div class="wcard full"><h3 class="line">${ic('clock')} Próximas 24 horas</h3>${hours24HTML(ctx, win24, topThr)}</div>
    <div class="wcard sq w-wind"><button class="wbtn" data-det="viento" aria-label="Ver detalle"></button>${windStreaks(dir, spd)}<h3>${ic('wind')} Viento</h3><div class="compass">${compassSVG(dir, spd, gust)}</div><div class="foot">${esc(windFoot)}</div></div>
    <div class="wcard sq w-wave"><button class="wbtn" data-det="oleaje" aria-label="Ver detalle"></button>${waveSVG(wave, wper)}<h3>${ic('wave')} Oleaje</h3><div class="big"><span data-cnt="${wave}" data-dec="1">${n1(wave)}</span><small> m</small></div><div class="sub">${seaState(wave)}</div><div class="foot">${wper != null ? `Periodo ${n0(wper)} s · del ${sect(wdir)}` : 'Sin dato de oleaje en este punto'}</div></div>
    ${ctx.hasTide ? `<div class="wcard full"><button class="wbtn" data-det="mareas" aria-label="Ver mareas"></button><h3>${ic('tide')} Marea</h3><div class="tide-w"><div class="tide-mini">${tideMiniSVG(ctx, today.key)}</div>${nextExt[0] ? `<div class="tnext"><div class="tk">${nextExt[0].type === 'hi' ? 'Pleamar' : 'Bajamar'} en</div><div class="tcd">${untilTxt(nextExt[0].t)}</div><div class="tat">a las ${fmtHM(nextExt[0].t)}</div>${nextExt[1] ? `<div class="tn2"><span class="tdot ${nextExt[1].type}"></span>${nextExt[1].type === 'hi' ? 'Pleamar' : 'Bajamar'} ${fmtHM(nextExt[1].t)}</div>` : ''}</div>` : ''}</div><div class="foot">${ts ? ts.t : ''}${lvNow != null ? ` · altura ${th(ctx, lvNow)}` : ''} · Mareas ${tk}</div></div>` : ''}
    <div class="wcard sq w-water"><button class="wbtn" data-det="agua" aria-label="Ver detalle"></button>${sst != null ? bubbles() : ''}<h3>${ic('temp')} Agua</h3><div class="big">${sst != null ? `<span data-cnt="${sst}">${n0(sst)}</span>°` : '—'}</div><div class="sub">${sst != null ? 'en superficie' : 'sin dato'}</div>${waterBar(sst)}<div class="foot">${esc(waterTip)}</div></div>
    <div class="wcard sq"><button class="wbtn" data-det="luna" aria-label="Ver luna"></button><h3>${ic('moon')} Luna</h3><div class="moon-ill">${moonWidget(ill)}<div><div class="sub" style="margin:0">${phaseN}</div><div style="font-size:13px;opacity:.8">${n0(ill.fraction * 100)} % iluminada</div></div></div><div class="foot">${maj ? `Periodos mayores: ${maj}` : `Mareas ${tk}`}</div></div>
    <div class="wcard sq"><button class="wbtn" data-det="sol" aria-label="Ver sol"></button><h3>${ic('sunrise')} Sol</h3><div class="sun-arc">${sunArcSVG(today)}</div><div class="foot" style="display:flex;justify-content:space-between"><span>↑ ${fmtHM(today.sr)}</span><span>↓ ${fmtHM(today.ss)}</span></div><div style="font-size:12px;opacity:.7;margin-top:2px">${Math.floor(dayLen / 60)} h ${n0(dayLen % 60)} min de luz</div></div>
    <div class="wcard sq"><button class="wbtn" data-det="tiempo" aria-label="Ver tiempo"></button><h3>${ic('sun')} Tiempo</h3><div style="display:flex;align-items:center;gap:8px"><span class="wx-ic">${w.e}</span><span class="big">${n0(H.temperature_2m[i])}°</span></div><div class="sub">${w.t}</div><div class="foot">Sensación ${n0(H.apparent_temperature[i])}° · Lluvia ${n0(H.precipitation_probability[i] || 0)} %<br>UV ${n0(H.uv_index[i])} · Máx ${n0(today.tmax)}° mín ${n0(today.tmin)}°</div></div>
    <div class="wcard sq"><button class="wbtn" data-det="presion" aria-label="Ver presión"></button><h3>${ic('gauge')} Presión</h3><div class="gauge">${gaugeSVG(pr)}</div><div class="foot"><span class="trend" style="--d:${pd <= -0.8 ? 135 : pd >= 0.8 ? 45 : 90}deg">${arrowSVG(0, 12)}</span>${esc(prTxt)}</div></div>
    <div class="wcard sq w-cur"><button class="wbtn" data-det="corriente" aria-label="Ver detalle"></button>${curFlow(curDir)}<h3>${ic('current')} Corriente</h3><div class="big">${cur != null ? `<span data-cnt="${cur}" data-dec="1">${n1(cur)}</span>` : '—'}<small> km/h</small></div><div class="sub">${cur != null ? 'hacia el ' + sect(curDir) : 'sin dato'}</div><div class="foot">${curDir != null ? (curDir > 45 && curDir < 135 ? 'Entra agua del Atlántico al Mediterráneo' : curDir > 225 && curDir < 315 ? 'Sale hacia el Atlántico' : 'Corriente cruzada') : ''}</div></div>
    <div class="wcard full"><h3 class="line">${ic('info')} Por qué este ${n1(sc.s)}</h3><div class="factors">${FX.map(([e, n, d, f]) => `<div class="fx"><span class="em">${gl(e)}</span><div><div class="n">${n}</div><div class="d">${esc(d)}</div></div><span class="meter"><i style="width:${f * 100}%;background:${scoreColor(f * 10)}"></i></span></div>`).join('')}</div></div>
    <div class="wcard full"><h3>${ic('wind')} Windguru</h3><div class="foot" style="margin:2px 0 12px">Su previsión para ${esc(WG_NAMES[wgFor(sp)] || 'la zona')}, al lado de la nuestra.</div><div class="glass-actions"><button class="gbtn solid" data-act="wg">Ver Windguru</button><a class="gbtn" href="https://www.windguru.cz/${wgFor(sp)}" target="_blank" rel="noopener">Abrir web</a></div></div>
    <div class="wcard full"><h3 class="line">${ic('pin')} Con este viento, mejor en…</h3><div class="reco" id="reco">${allNow ? recoHTML(ctx) : '<div class="foot">Comparando pesqueros…</div>'}</div></div>
    <div class="wcard full days"><h3 class="line">${ic('cal')} Próximos 7 días</h3>${dayRows}</div>
    <div class="wcard full"><h3>${ic('users')} Plan con los colegas</h3><div style="font-size:16px;font-weight:600;margin-bottom:4px">¿Quedada?</div><div class="foot" style="margin-bottom:12px">Manda el mejor rato al grupo.</div><div class="glass-actions"><button class="gbtn solid" data-act="plan">${ic('share', 'sm')} Compartir plan</button><button class="gbtn" data-act="kit">${ic('bag', 'sm')} Checklist</button></div></div>
  </div>
  <div class="disclaimer">Índice orientativo. Previsión de Open-Meteo (ECMWF, DWD, Météo-France). La marea es un modelo: no sirve para navegar.<br><a href="https://www.aemet.es/es/eltiempo/prediccion/avisos" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Avisos oficiales de AEMET</a> · <a href="https://www.puertos.es/es-es/oceanografia/Paginas/portus.aspx" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline">Mareas oficiales</a></div>`;
}
// Pastilla de cristal del hero de Hoy
const hpill = (g, txt) => `<span class="hpill">${gl(g, 'in')}<span>${txt}</span></span>`;
function recoHTML(ctx) {
  if (!allNow) return '';
  const list = D.spots.map((s) => ({ s, q: quickScore(s, allNow.list[s.id], ctx) })).filter((x) => x.q != null).sort((a, b) => b.q - a.q).slice(0, 4);
  const wt = windType(ctx.H.wind_direction_10m[ctx.now]);
  return list.map(({ s, q }) => `<button data-spot="${s.id}"><span class="rk" style="color:${scoreColor(q)}">${n1(q)}</span><div style="flex:1;min-width:0"><div class="rn ell">${esc(s.nombre)}</div><div class="rs ell">${esc(s.municipio)} · ${tipoOf(s).n}${wt && s.abrigo && s.abrigo.includes(wt) ? ' · resguardado del ' + cap(wt) : ''}</div></div>${chev}</button>`).join('');
}
function bindHoy(v) {
  v.onclick = (e) => {
    const a = e.target.closest('[data-act],[data-day],[data-spot],[data-goto],[data-det]');
    if (!a) return;
    if (a.dataset.det) return openDetail(a.dataset.det);
    if (a.dataset.goto) return goTab(a.dataset.goto);
    if (a.dataset.day) return openDaySheet(a.dataset.day);
    if (a.dataset.spot) { setSpot(a.dataset.spot); return; }
    const act = a.dataset.act;
    if (act === 'pick-spot') openSpotPicker();
    if (act === 'refresh') { a.style.transition = 'transform .6s'; a.style.transform = 'rotate(360deg)'; renderHoy(true).then(() => toast('Parte actualizado')); }
    if (act === 'retry') renderHoy(true);
    if (act === 'plan') openPlan();
    if (act === 'kit') openKit();
    if (act === 'wg') openWindguru(state.ctx ? state.ctx.sp : spotById(S.spot));
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
  if (go && state.tab !== 'hoy') goTab('hoy'); else render(state.tab);
  $('#v-hoy').scrollTo({ top: 0 });
  // Si hay una página de detalle abierta (p. ej. Mareas), se rehace con el pesquero nuevo cuando llega su parte
  if (pages.length) {
    const pg = pages[pages.length - 1], b = $('.pg-body', pg), det = DETAILS[pg.dataset.kind];
    b.innerHTML = `<div class="wcard in full sk" style="min-height:220px"><span class="skl" style="width:40%"></span><span class="skb" style="height:150px;margin-top:14px"></span></div>`;
    const t0 = Date.now();
    const wait = () => { if (state.ctx && state.ctx.sp.id === id) { det.render(b, state.ctx); bindCharts(b); } else if (Date.now() - t0 < 20000) setTimeout(wait, 250); };
    wait();
  }
}

// Un día entero, como las páginas de detalle: la nota, los mejores ratos y por qué, la marea, el viento, el mar, el agua,
// el cielo, la presión, el sol, la luna (y su tabla solunar), qué puede salir y la tabla hora a hora
function openDaySheet(key) {
  const ctx = state.ctx;
  if (!ctx) { toast('Esperando el parte…', 'clock'); return; }
  if (!ctx.dayBy[key]) return;
  const di = dayInfo(key);
  haptic();
  openPage({ title: `${di.rel || cap(di.wdl)} ${di.d} ${di.mes}`, kind: 'dia', render: (b) => renderDay(b, ctx, key) });
}
function renderDay(b, ctx, key) {
  const d = ctx.dayBy[key], di = dayInfo(key), sp = ctx.sp, H = ctx.H, M = ctx.M;
  const idx = ctx.keys.map((k, i) => (k.startsWith(key) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) { b.innerHTML = '<div class="wcard in full"><div class="sub">Sin datos de este día.</div></div>'; return; }
  const i0 = idx[0], n = idx.length;
  const vals = (arr) => (arr ? idx.map((i) => arr[i]).filter((x) => x != null) : []);
  const mx = (arr) => { const v = vals(arr); return v.length ? Math.max(...v) : null; };
  const mn = (arr) => { const v = vals(arr); return v.length ? Math.min(...v) : null; };
  const avg = (arr) => { const v = vals(arr); return v.length ? v.reduce((a, x) => a + x, 0) / v.length : null; };
  const sum = (arr) => vals(arr).reduce((a, x) => a + x, 0);
  const argmax = (arr) => idx.reduce((a, i) => (arr && arr[i] != null && (a == null || arr[i] > arr[a]) ? i : a), null);
  const isToday = key === dayKey();
  // Viento
  const wmax = mx(H.wind_speed_10m), gmax = mx(H.wind_gusts_10m), wmin = mn(H.wind_speed_10m);
  const wdir = d.wdir, wt = windType(wdir);
  const shelter = wt && sp.abrigo ? (sp.abrigo.includes(wt) ? `Resguardado del ${cap(wt)}` : `Expuesto al ${cap(wt)}`) : 'Sin viento dominante del Estrecho';
  // Mar
  const hmax = mx(M.wave_height), hmin = mn(M.wave_height), per = avg(M.wave_period), swell = mx(M.swell_wave_height), swp = avg(M.swell_wave_period);
  const wvDir = M.wave_direction ? M.wave_direction[idx[Math.min(12, n - 1)]] : null;
  // Agua y corriente
  const sst = avg(M.sea_surface_temperature), sstMin = mn(M.sea_surface_temperature), sstMax = mx(M.sea_surface_temperature);
  const cI = argmax(M.ocean_current_velocity), cur = cI != null ? M.ocean_current_velocity[cI] : null, curDir = cI != null && M.ocean_current_direction ? M.ocean_current_direction[cI] : null;
  // Cielo
  const rainMm = sum(H.precipitation), clouds = avg(H.cloud_cover), feelMin = mn(H.apparent_temperature), feelMax = mx(H.apparent_temperature);
  const storm = idx.some((i) => (H.weather_code[i] || 0) >= 95);
  // Presión
  const p0 = H.pressure_msl[i0], p1 = H.pressure_msl[idx[n - 1]], pd = p0 != null && p1 != null ? p1 - p0 : 0;
  const pTxt = pd <= -4 ? 'Cae con fuerza: llega un cambio de tiempo' : pd < -1 ? 'Baja a lo largo del día: suele activar a los peces' : pd <= 1 ? 'Estable todo el día' : pd <= 4 ? 'Sube despacio: pueden costar las picadas' : 'Sube fuerte tras el mal tiempo';
  // Marea
  const ext = d.ext || [];
  const lv = vals(ctx.lvl), amp = lv.length ? Math.max(...lv) - Math.min(...lv) : null;
  const ill = d.ill, tk = Astro.tideKind(ill.phase);
  // Sol y luna
  const len = (d.ss - d.sr) / 60000;
  const w = (t, m) => new Date(t.getTime() + m * 60000);
  const sol = ctx.sol.filter((e) => dayKey(e.t) === key).sort((a, c) => a.t - c.t);
  // Mejores ratos y por qué
  const why = (i) => {
    const fx = ctx.scores[i].fx, out = [];
    if (fx.tide >= 0.85) out.push('marea con movimiento'); if (fx.light === 1) out.push(fx.light === 1 && ctx.T[i] < new Date(d.mid.getTime() + 12 * 3600e3) ? 'alba' : 'atardecer');
    if (fx.sol === 1) out.push('periodo solunar mayor'); else if (fx.sol > 0.8) out.push('periodo solunar menor');
    if (fx.wind >= 0.85) out.push('poco viento'); if (fx.waves >= 0.85) out.push('mar a gusto'); if (fx.pres >= 0.9) out.push('presión a favor');
    return out.slice(0, 3);
  };
  const best = (d.best || []).map((x) => `<div class="bw"><div class="bw-h"><b>${fmtHM(x.from)}–${fmtHM(x.to)}</b><span class="bw-s" style="background:${scoreColor(x.max)}">${n1(x.max)}</span></div><div class="bw-y">${why(x.start).map((t) => `<span>${esc(cap(t))}</span>`).join('') || '<span>Lo mejor del día</span>'}</div></div>`).join('');
  // Avisos del día
  const al = [];
  if (storm) al.push(['r', 'Tormentas: con la caña eres un pararrayos.']);
  if (gmax > 70 || wmax > 50) al.push(['r', `Temporal: rachas de hasta ${n0(gmax)} km/h.`]); else if (gmax > 50) al.push(['o', `Rachas fuertes, hasta ${n0(gmax)} km/h.`]);
  if (hmax > 2 && (sp.tipo === 'roca' || sp.tipo === 'espigon')) al.push(['r', `Mar de ${n1(hmax)} m: peligro en rocas y espigones.`]);
  if (d.rain >= 70) al.push(['o', `Lluvia casi segura (${d.rain} %).`]);
  if (d.uv >= 7) al.push(['o', `UV muy alto (${n0(d.uv)}): gorra y crema.`]);
  // Qué puede salir ese mes en este pesquero
  const month = +key.slice(5, 7);
  const fish = (sp.especies || []).map(fishById).filter((f) => f && !f.prohibida && (f.meses || []).includes(month)).sort((a, c) => c.rareza - a.rareza).slice(0, 10);
  // Hora a hora
  const hrs = idx.filter((i) => +ctx.keys[i].slice(11, 13) >= 5);
  const hourRows = hrs.map((i) => {
    const s = ctx.scores[i].s, ww = wx(H.weather_code[i], H.is_day[i]);
    const r = ctx.rate[i];
    const isB = (d.best || []).some((x) => i >= x.start && i <= x.end);
    const now = isToday && i === ctx.now;
    return `<div class="dhr ${isB ? 'best' : ''} ${now ? 'now' : ''}"><b>${ctx.keys[i].slice(11, 13)}h</b><span class="hr-wx">${ww.e}</span><span class="hr-w"><span class="darr">${arrowSVG(((H.wind_direction_10m[i] || 0) + 180) % 360, 12)}</span>${n0(H.wind_speed_10m[i])}<small>/${n0(H.wind_gusts_10m[i])}</small></span><span class="hr-m">${M.wave_height ? n1(M.wave_height[i]) + '<small> m</small>' : '—'}</span><span class="hr-t">${ctx.hasTide && r != null ? (Math.abs(r) < ctx.maxRate * 0.18 ? '·' : r > 0 ? '↑' : '↓') : ''}</span><span class="hr-c">${n0(H.temperature_2m[i])}°</span><span class="hr-s" style="background:${scoreColor(s)}">${n1(s)}</span></div>`;
  }).join('');
  state.tideDay = key;
  b.innerHTML = `
    <div class="wcard in full dday"><div class="dd-top"><div><div class="dd-k">${esc(sp.nombre)}</div><div class="dd-n" style="color:${scoreColor(d.max)}">${n1(d.max)}<small>/10</small></div><div class="dd-v">${verdict(d.max)}</div></div><div class="dd-wx">${wx(d.code).e}<span>${n0(d.tmin)}° / ${n0(d.tmax)}°</span></div></div>
      <div class="dd-line">${esc(wx(d.code).t)} · ${esc(windName(wdir))} ${n0(wmax)} km/h${hmax != null ? ` · mar ${n1(hmax)} m` : ''} · mareas ${tk}</div>
      <div class="dd-chips"><span>${gl('sunrise', 'in')} ${fmtHM(d.sr)}</span><span>${gl('fullmoon', 'in')} ${n0(ill.fraction * 100)} %</span>${sst != null ? `<span>${gl('temp', 'in')} agua ${n0(sst)}°</span>` : ''}<span>${gl('rain', 'in')} ${d.rain || 0} %</span></div></div>
    ${al.map(([k, t]) => `<div class="alert-glass ${k === 'o' ? 'warn' : ''}">${ic('warn')}<span>${esc(t)}</span></div>`).join('')}
    ${dcard('Índice hora a hora', 'clock', dChart(ctx, [{ v: ctx.scores.map((s) => s.s), c: '#FFD60A', name: 'Índice', area: true }], { i0, n, hours: true, min: 0, max: 10, dec: 1, h: 120 }) + (best ? `<div class="bws">${best}</div>` : '<div class="foot">Sin un rato que destaque.</div>'))}
    ${ctx.hasTide ? dcard('Marea', 'tide', `<div class="tide-mini dd-tide">${tideMiniSVG(ctx, key)}</div><div class="dd-ext">${ext.map((e) => `<div class="${e.type}"><span>${e.type === 'hi' ? 'Pleamar' : 'Bajamar'}</span><b>${fmtHM(e.t)}</b><small>${th(ctx, e.h)}</small></div>`).join('') || '<div class="foot">Sin extremos claros</div>'}</div><div class="dkv">${kv('Mareas', cap(tk))}${kv('Amplitud', amp != null ? n2(amp) + ' m' : '—')}</div><div class="glass-actions" style="margin-top:12px"><button class="gbtn solid" data-det="mareas">Curva y tabla solunar</button></div>`) : ''}
    ${dcard('Viento', 'wind', `<div class="dd-2"><div class="compass">${compassSVG(wdir, wmax, gmax)}</div><div>${kv('Máximo', n0(wmax) + ' km/h')}${kv('Rachas', n0(gmax) + ' km/h')}${kv('Mínimo', n0(wmin) + ' km/h')}${kv('Del', `${sect(wdir)}${wt ? ' · ' + cap(wt) : ''}`)}</div></div><div class="dd-note">${gl('pin', 'in')} ${esc(shelter)} en ${esc(sp.nombre)}</div>` + dChart(ctx, [{ v: H.wind_speed_10m, c: '#7fd8ff', name: 'Viento', area: true }, { v: H.wind_gusts_10m, c: '#FFB340', name: 'Rachas', dash: true }], { i0, n, hours: true, unit: ' km/h', min: 0, h: 100 }))}
    ${M.wave_height ? dcard('Estado del mar', 'wave', `<div class="dkv">${kv('Ola máx.', n1(hmax) + ' m')}${kv('Ola mín.', n1(hmin) + ' m')}${kv('Periodo', per != null ? n0(per) + ' s' : '—')}${kv('Viene del', wvDir != null ? sect(wvDir) : '—')}${kv('Mar de fondo', swell != null ? `${n1(swell)} m${swp ? ' · ' + n0(swp) + ' s' : ''}` : '—')}${kv('Estado', seaState(hmax))}</div>` + dChart(ctx, [{ v: M.wave_height, c: '#7fd8ff', name: 'Ola', area: true }], { i0, n, hours: true, unit: ' m', dec: 1, min: 0, h: 90 })) : ''}
    <div class="dd-grid">
      ${dcard('Agua', 'temp', `<div class="big sm">${sst != null ? n1(sst) + '°' : '—'}</div><div class="foot">${sstMin != null ? `Entre ${n1(sstMin)}° y ${n1(sstMax)}°` : 'Sin dato'}</div>${cur != null ? `<div class="dd-sub">${ic('current', 'xs')} Corriente hasta ${n1(cur)} km/h hacia el ${sect(curDir)}</div>` : ''}`, 'half')}
      ${dcard('Cielo', 'sun', `<div class="big sm">${n0(d.tmax)}°<small> / ${n0(d.tmin)}°</small></div><div class="foot">Sensación ${n0(feelMin)}°–${n0(feelMax)}°</div><div class="dd-sub">Lluvia ${d.rain || 0} %${rainMm ? ` · ${n1(rainMm)} mm` : ''}<br>Nubes ${n0(clouds)} % · UV ${n0(d.uv)}</div>`, 'half')}
      ${dcard('Presión', 'gauge', `<div class="big sm">${n0(p1)}<small> hPa</small></div><div class="foot">${pd >= 0 ? '+' : ''}${n1(pd)} hPa en el día</div><div class="dd-sub">${esc(pTxt)}</div>`, 'half')}
      ${dcard('Sol', 'sunrise', `<div class="big sm">${Math.floor(len / 60)}<small> h </small>${pad(Math.round(len % 60))}<small> min</small></div><div class="foot">↑ ${fmtHM(d.sr)} · ↓ ${fmtHM(d.ss)}</div><div class="dd-sub">Alba ${fmtHM(w(d.sr, -45))}–${fmtHM(w(d.sr, 75))}<br>Tarde ${fmtHM(w(d.ss, -75))}–${fmtHM(w(d.ss, 45))}</div>`, 'half')}
    </div>
    ${dcard('Luna', 'moon', `<div class="dd-2"><div class="dd-moon">${moonSVG(ill.phase, 74)}</div><div>${kv('Fase', Astro.phaseName(ill.phase))}${kv('Iluminada', n0(ill.fraction * 100) + ' %')}${kv('Sale', fmtHM(d.moon.rise))}${kv('Se pone', fmtHM(d.moon.set))}</div></div>${sol.map((e) => `<div class="drow sol"><b>${e.k === 'maj' ? 'Mayor' : 'Menor'}</b><span>${e.n}</span><span class="dv">${fmtHM(new Date(e.t.getTime() - (e.k === 'maj' ? 60 : 40) * 60000))}–${fmtHM(new Date(e.t.getTime() + (e.k === 'maj' ? 60 : 40) * 60000))}</span></div>`).join('')}`)}
    ${fish.length ? dcard(`Qué puede salir en ${esc(sp.nombre)}`, 'fish', `<div class="dd-fish">${fish.map((f) => `<button data-fish="${f.id}"><span class="ddf-img ${fotoURL(f) ? 'ph' : ''}">${fotoImg(f, 200)}${fishSVG(f)}</span><span class="ell">${esc(f.nombre)}</span></button>`).join('')}</div><div class="foot">Especies de este pesquero que andan en ${MESL[month - 1]}.</div>`) : ''}
    ${dcard('Hora a hora', 'cal', `<div class="hhead"><span></span><span></span><span>Viento</span><span>Ola</span><span>Marea</span><span>Temp</span><span>Índice</span></div><div class="hrows">${hourRows}</div><div class="foot">Viento y rachas en km/h. En verde, los mejores ratos.</div>`)}
    <div class="glass-actions dd-acts"><button class="gbtn solid" data-dplan="${key}">${ic('share', 'sm')} Compartir plan</button><button class="gbtn" data-dkit="1">${ic('bag', 'sm')} Checklist</button></div>
    <div class="disclaimer">Previsión de Open-Meteo. La marea es un modelo: no sirve para navegar.</div>`;
  fillPhotos(b);
  b.addEventListener('click', (e) => {
    if (e.target.closest('[data-dplan]')) openPlan(key);
    if (e.target.closest('[data-dkit]')) { closeAllPages(); openKit(); }
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
async function renderMareas(v) {
  if (!v || !v.isConnected) return;
  const sp = spotById(S.spot);
  if (!state.ctx || state.ctx.sp.id !== sp.id) {
    v.innerHTML = `<div class="lsub">${esc(sp.nombre)}</div><div class="tide-card"><span class="skel" style="width:40%;height:14px"></span><span class="skel" style="height:190px;margin-top:14px;border-radius:14px"></span></div><div class="sec-h"><span class="skel" style="width:90px;height:12px"></span></div><div class="extremes">${'<div class="ext-card"><span class="skel" style="width:100%;height:46px"></span></div>'.repeat(4)}</div>`;
    try { const data = await loadSpot(sp); state.ctx = buildCtx(data, sp); } catch (e) { v.innerHTML = '<div class="empty"><div class="big">' + gl('signal') + '</div><b>Sin conexión</b>Hace falta internet la primera vez.</div>'; return; }
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
  v.innerHTML = `
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
    if (t) { state.tideDay = t.dataset.tday; haptic(); renderMareas(v); }
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

/* ---------------- PÁGINAS DE DETALLE ----------------
   Cada widget de Hoy abre su página a pantalla completa (se desliza desde la derecha, con su entrada en el historial
   para que el botón «atrás» del móvil vuelva a Hoy). Mismo cielo que Hoy y tarjetas de cristal. */
const pages = [];
function openPage({ title, kind, render }) {
  const el = document.createElement('section');
  el.className = 'page page-sky';
  el.style.setProperty('--sky', $('#v-hoy').style.getPropertyValue('--sky') || '');
  el.innerHTML = `<header class="pg-top"><button class="pg-back" data-pg="back" aria-label="Volver">${ic('back')}<span>Hoy</span></button><div class="pg-t">${esc(title)}</div>${topActs()}</header><div class="pg-body"></div>`;
  $('#app').appendChild(el);
  pages.push(el);
  history.pushState({ page: pages.length }, '');
  void el.offsetHeight;
  el.classList.add('on');
  $('#v-hoy').classList.add('under');
  const body = $('.pg-body', el);
  body.addEventListener('scroll', () => el.classList.toggle('scrolled', body.scrollTop > 6), { passive: true });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-pg="back"]')) { closePage(); return; }
    const sp = e.target.closest('[data-spot]');
    if (sp) { closeAllPages(); setSpot(sp.dataset.spot); return; }
    const d = e.target.closest('[data-det]');
    if (d) { openDetail(d.dataset.det); return; }
    const f = e.target.closest('[data-fish]');
    if (f) { openFishSheet(f.dataset.fish); return; }
    if (e.target.closest('[data-act="wg"]')) openWindguru(state.ctx ? state.ctx.sp : spotById(S.spot));
    if (e.target.closest('[data-act="pick-spot"]')) openSpotPicker();
  });
  el.dataset.kind = kind || '';
  render(body);
  bindCharts(body);
  return el;
}
function closePage(fromPop) {
  const el = pages.pop();
  if (!el) return;
  el.classList.remove('on');
  setTimeout(() => el.remove(), 450);
  if (!pages.length) $('#v-hoy').classList.remove('under');
  if (!fromPop) { skipPop++; history.back(); }
}
function closeAllPages() {
  const n = pages.length;
  if (!n) return;
  while (pages.length) { const el = pages.pop(); el.classList.remove('on'); setTimeout(() => el.remove(), 450); }
  $('#v-hoy').classList.remove('under');
  skipPop++; history.go(-n);
}

// Gráfica de los próximos 7 días, hora a hora: noches sombreadas, días marcados y lectura con el dedo
const chartReg = {};
// Con «i0» y «n» pinta solo un tramo (un día: «hours» pone las horas debajo en vez de los días)
function dChart(ctx, sets, { unit = '', dec = 0, min, max, h = 150, i0: from, n: len, hours = false } = {}) {
  const i0 = from != null ? from : ctx.now, n = Math.min(ctx.keys.length - i0, len || 168);
  if (n < 6) return '';
  const W = n - 1;
  const vals = sets.flatMap((s) => s.v.slice(i0, i0 + n)).filter((v) => v != null);
  if (!vals.length) return '<div class="foot">Sin datos en este punto.</div>';
  let lo = min != null ? min : Math.min(...vals), hi = max != null ? max : Math.max(...vals);
  if (hi - lo < 1e-6) hi = lo + 1;
  const padv = (hi - lo) * 0.14;
  if (min == null) lo -= padv;
  if (max == null) hi += padv;
  const Y = (v) => (1 - (v - lo) / (hi - lo)) * 100;
  const X = (t) => (t - ctx.T[i0]) / 3600e3;
  const nights = ctx.days.map((d, k) => { const nx = ctx.days[k + 1]; return nx ? [X(d.ss), X(nx.sr)] : null; }).filter((x) => x && x[1] > 0 && x[0] < W)
    .map(([a, b]) => `<rect x="${Math.max(0, a).toFixed(2)}" y="0" width="${(Math.min(W, b) - Math.max(0, a)).toFixed(2)}" height="100" fill="rgba(0,10,40,.12)"/>`).join('');
  const mids = ctx.days.map((d) => X(d.mid)).filter((x) => x > 0 && x < W);
  const grid = mids.map((x) => `<line x1="${x.toFixed(2)}" x2="${x.toFixed(2)}" y1="0" y2="100" stroke="rgba(255,255,255,.22)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('');
  const lines = sets.map((s, k) => {
    const pts = [];
    for (let j = 0; j < n; j++) { const v = s.v[i0 + j]; if (v != null) pts.push(`${j},${Y(v).toFixed(2)}`); }
    if (!pts.length) return '';
    if (s.bars) return s.v.slice(i0, i0 + n).map((v, j) => v ? `<rect x="${(j - 0.4).toFixed(1)}" y="${Y(v).toFixed(2)}" width=".8" height="${(100 - Y(v)).toFixed(2)}" fill="${s.c}" opacity=".75"/>` : '').join('');
    const d = 'M' + pts.join('L');
    const first = pts[0].split(',')[0], last = pts[pts.length - 1].split(',')[0];
    return `${s.area ? `<path d="${d}L${last},100L${first},100Z" fill="${s.c}" opacity=".18"/>` : ''}<path class="dline" d="${d}" fill="none" stroke="${s.c}" stroke-width="${s.dash ? 1.6 : 2.6}" ${s.dash ? 'stroke-dasharray="4 4"' : ''} stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  }).join('');
  const id = 'c' + (++uid);
  chartReg[id] = { ctx, sets, i0, n, unit, dec, lo, hi };
  const lab = (v) => (dec ? n1(v) : n0(v));
  const days = hours ? [0, 6, 12, 18].filter((hh) => hh < n).map((hh) => `<span style="left:${(hh / W * 100).toFixed(2)}%">${pad(+ctx.keys[i0 + hh].slice(11, 13))}h</span>`).join('')
    : ctx.days.map((d) => ({ x: X(d.mid) + 12, di: dayInfo(d.key) })).filter((x) => x.x > 2 && x.x < W - 2)
    .map((x) => `<span style="left:${(x.x / W * 100).toFixed(2)}%">${x.di.rel === 'Hoy' ? 'Hoy' : x.di.rel === 'Mañana' ? 'Mañ' : x.di.wd}</span>`).join('');
  const nowF = (Date.now() - ctx.T[i0]) / 3600e3 / W;
  const nowStyle = from == null ? '' : nowF >= 0 && nowF <= 1 ? `style="left:${(nowF * 100).toFixed(2)}%"` : 'hidden';
  return `<div class="dchart" data-chart="${id}">
    <div class="dc-read"><b>${from == null ? 'Ahora' : ctx.keys[i0].slice(11, 16)}</b> · ${sets.map((s) => `<i style="background:${s.c}"></i>${esc(s.name)} ${s.v[i0] != null ? lab(s.v[i0]) + unit : '—'}`).join(' · ')}</div>
    <div class="dc-plot" style="height:${h}px"><span class="dc-y t">${lab(hi)}</span><span class="dc-y b">${lab(lo)}</span>
      <svg viewBox="0 0 ${W} 100" preserveAspectRatio="none">${nights}${grid}${lines}</svg><i class="dc-now" ${nowStyle}></i><i class="dc-cur" hidden></i></div>
    <div class="dc-days">${days}</div></div>`;
}
function bindCharts(root) {
  $$('.dchart', root).forEach((box) => {
    const R = chartReg[box.dataset.chart];
    if (!R) return;
    const plot = $('.dc-plot', box), cur = $('.dc-cur', box), read = $('.dc-read', box);
    const lab = (v) => (R.dec ? n1(v) : n0(v));
    const show = (e) => {
      const r = plot.getBoundingClientRect();
      const fx = clamp((e.clientX - r.left) / r.width, 0, 1);
      const j = Math.round(fx * (R.n - 1)), i = R.i0 + j;
      cur.hidden = false;
      cur.style.left = (j / (R.n - 1) * 100) + '%';
      const di = dayInfo(R.ctx.keys[i].slice(0, 10));
      read.innerHTML = `<b>${di.rel || di.wd} ${R.ctx.keys[i].slice(11, 16)}</b> · ${R.sets.map((s) => `<i style="background:${s.c}"></i>${esc(s.name)} ${s.v[i] != null ? lab(s.v[i]) + R.unit : '—'}`).join(' · ')}`;
    };
    plot.addEventListener('pointerdown', (e) => { show(e); plot.setPointerCapture(e.pointerId); });
    plot.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) show(e); });
  });
}
const dcard = (title, icon, inner, cls = '') => `<div class="wcard in full dcard ${cls}"><h3 class="line">${ic(icon)} ${title}</h3>${inner}</div>`;
const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
const futureDays = (ctx) => ctx.days.filter((d) => d.key >= dayKey()).slice(0, 7);
const dayName = (key) => { const di = dayInfo(key); return di.rel || di.wd; };
function dayAgg(ctx, arr, key, fn = Math.max) {
  const v = ctx.keys.map((k, i) => (k.startsWith(key) ? arr[i] : null)).filter((x) => x != null);
  return v.length ? fn(...v) : null;
}
function dayRows(rows) { return `<div class="drows">${rows.join('')}</div>`; }
const bar = (f, c) => `<span class="dbar"><i style="width:${(clamp(f, 0.03, 1) * 100).toFixed(1)}%;background:${c}"></i></span>`;

const DETAILS = {
  viento: { t: 'Viento', render(b, ctx) {
    const i = ctx.now, H = ctx.H, spd = H.wind_speed_10m[i], dir = H.wind_direction_10m[i], gust = H.wind_gusts_10m[i], wt = windType(dir);
    const bf = beaufort(spd);
    const tip = wt === 'levante' ? 'Con Levante, en el lado atlántico (Tarifa, Bolonia, Barbate) sopla de tierra y el agua suele quedar más calmada en la orilla; la bahía de Algeciras y la costa mediterránea se mueven más.'
      : wt === 'poniente' ? 'Con Poniente entra mar por el Atlántico; la bahía de Algeciras y la costa mediterránea quedan más resguardadas.'
        : 'Viento de componente norte o sur: busca el pesquero que te lo dé de espaldas.';
    b.innerHTML = `
      <div class="wcard in full dhero w-wind">${windStreaks(dir, spd)}<div class="dh-l"><div class="compass">${compassSVG(dir, spd, gust)}</div></div>
        <div class="dh-r"><div class="big">${n0(spd)}<small> km/h</small></div><div class="sub">${esc(windText(spd, dir))}</div>${kv('Rachas', n0(gust) + ' km/h')}${kv('Viene del', `${sect(dir)} · ${n0(dir)}°`)}${kv('Fuerza', `${bf.n} Beaufort`)}</div></div>
      ${dcard('Próximos 7 días', 'wind', dChart(ctx, [{ v: H.wind_speed_10m, c: '#7fd8ff', name: 'Viento', area: true }, { v: H.wind_gusts_10m, c: '#FFB340', name: 'Rachas', dash: true }], { unit: ' km/h', min: 0 }))}
      ${dcard('Día a día', 'cal', dayRows(futureDays(ctx).map((d) => `<div class="drow"><b>${dayName(d.key)}</b><span class="darr">${arrowSVG((d.wdir + 180) % 360, 14)}</span><span>${sect(d.wdir)}${windType(d.wdir) ? ' · ' + cap(windType(d.wdir)) : ''}</span>${bar(d.wmax / 70, d.gmax > 50 ? '#FF9F0A' : '#7fd8ff')}<span class="dv">${n0(d.wmax)}<small>/${n0(d.gmax)}</small></span></div>`)) + '<div class="foot">Máximo de viento / rachas en km/h.</div>')}
      ${dcard('Con este viento, mejor en…', 'pin', `<div class="reco">${allNow ? recoHTML(ctx) : '<div class="foot">Comparando pesqueros…</div>'}</div>`)}
      ${dcard('Cómo afecta a la pesca', 'info', `<p class="dtxt">${tip}</p><div class="dscale">${[['0-12', 'Ideal para todo, también para lances finos'], ['12-25', 'Bien. De cara, sube el plomo'], ['25-40', 'Incómodo. Busca abrigo'], ['+40', 'Peligroso en rocas y espigones']].map(([a, t]) => `<div><b>${a}</b><span>${t}</span></div>`).join('')}</div>`)}
      ${dcard('Windguru', 'wind', `<div class="glass-actions"><button class="gbtn solid" data-act="wg">Ver su previsión</button><a class="gbtn" href="https://www.windguru.cz/${wgFor(ctx.sp)}" target="_blank" rel="noopener">Abrir web</a></div>`)}`;
    if (!allNow) loadAllNow().then(() => { const r = $('.reco', b); if (r) r.innerHTML = recoHTML(ctx); }).catch(() => {});
  } },
  oleaje: { t: 'Oleaje', render(b, ctx) {
    const i = ctx.now, M = ctx.M;
    if (!M.wave_height) { b.innerHTML = '<div class="wcard in full"><div class="sub">Sin datos de oleaje en este punto.</div></div>'; return; }
    const h = M.wave_height[i], per = M.wave_period && M.wave_period[i], dir = M.wave_direction && M.wave_direction[i];
    const sw = M.swell_wave_height && M.swell_wave_height[i], swp = M.swell_wave_period && M.swell_wave_period[i];
    b.innerHTML = `
      <div class="wcard in full dhero w-wave">${waveSVG(h, per)}<div class="dh-r" style="grid-column:1/-1"><div class="big">${n1(h)}<small> m</small></div><div class="sub">${seaState(h)}</div><div class="dkv">${kv('Periodo', per != null ? n0(per) + ' s' : '—')}${kv('Viene del', dir != null ? sect(dir) : '—')}${kv('Mar de fondo', sw != null ? `${n1(sw)} m${swp ? ' · ' + n0(swp) + ' s' : ''}` : '—')}</div></div></div>
      ${dcard('Próximos 7 días', 'wave', dChart(ctx, [{ v: M.wave_height, c: '#7fd8ff', name: 'Ola', area: true }, ...(M.swell_wave_height ? [{ v: M.swell_wave_height, c: '#D0A6FF', name: 'Fondo', dash: true }] : [])], { unit: ' m', dec: 1, min: 0 }))}
      ${dcard('Día a día', 'cal', dayRows(futureDays(ctx).map((d) => { const mx = dayAgg(ctx, M.wave_height, d.key); return `<div class="drow"><b>${dayName(d.key)}</b><span></span><span>${seaState(mx)}</span>${bar((mx || 0) / 2.5, mx > 1.5 ? '#FF9F0A' : '#7fd8ff')}<span class="dv">${n1(mx)}<small> m</small></span></div>`; })) + '<div class="foot">Ola máxima de cada día.</div>')}
      ${dcard('Cómo afecta a la pesca', 'info', `<div class="dscale">${[['0-0,3 m', 'Agua clara y quieta: pesca fina, spinning y corcheo'], ['0,3-1 m', 'Lo mejor para surfcasting: remueve el fondo'], ['1-1,5 m', 'Mucha espuma: lubina en la rompiente, ojo con las rocas'], ['+1,5 m', 'Ni rocas ni espigones. Peligro']].map(([a, t]) => `<div><b>${a}</b><span>${t}</span></div>`).join('')}</div><p class="dtxt">El periodo cuenta: con olas de más de 10 s llegan series grandes de golpe aunque la altura media parezca pequeña.</p>`)}`;
  } },
  agua: { t: 'Agua', render(b, ctx) {
    const i = ctx.now, M = ctx.M, sst = M.sea_surface_temperature ? M.sea_surface_temperature[i] : null;
    const m = curMonth();
    const sp = D.species.filter((f) => (f.meses || []).includes(m) && !f.prohibida).sort((a, b2) => b2.rareza - a.rareza).slice(0, 12);
    const rng = [['-14°', 'Fría', 'Peces lentos: cebo natural y pesca fina'], ['14-17°', 'Fresca', 'Lubina, sargo y mojarra'], ['17-21°', 'Templada', 'Se mueve casi todo'], ['21-24°', 'Cálida', 'Pelágicos, doradas y palometas'], ['+24°', 'Muy cálida', 'Mejor al alba y de noche']];
    const k = sst == null ? -1 : sst < 14 ? 0 : sst < 17 ? 1 : sst < 21 ? 2 : sst < 24 ? 3 : 4;
    b.innerHTML = `
      <div class="wcard in full dhero w-water">${bubbles()}<div class="dh-r" style="grid-column:1/-1"><div class="big">${sst != null ? n1(sst) + '°' : '—'}</div><div class="sub">${k >= 0 ? rng[k][1] + ' · ' + rng[k][2] : 'Sin dato'}</div>${waterBar(sst)}</div></div>
      ${dcard('Próximos 7 días', 'temp', dChart(ctx, [{ v: M.sea_surface_temperature || [], c: '#64D2FF', name: 'Agua', area: true }], { unit: '°', dec: 1 }))}
      ${dcard('Qué se mueve con esta agua', 'fish', `<div class="dscale">${rng.map(([a, n, t], j) => `<div class="${j === k ? 'on' : ''}"><b>${a}</b><span><b>${n}.</b> ${t}</span></div>`).join('')}</div>`)}
      ${sp.length ? dcard(`En temporada en ${MESL[m - 1]}`, 'cal', `<div class="dchips">${sp.map((f) => `<button class="chip" data-fish="${f.id}">${esc(f.nombre)}</button>`).join('')}</div>`) : ''}`;
  } },
  luna: { t: 'Luna', render(b, ctx) {
    const now = new Date(), ill = Astro.moonIllumination(now), tk = Astro.tideKind(ill.phase), today = ctx.dayBy[dayKey()] || ctx.days[1];
    // Próxima luna llena y nueva (buscando cada 2 h en los próximos 32 días)
    let full = null, nw = null, prev = ill.phase;
    for (let h = 2; h <= 32 * 24 && (!full || !nw); h += 2) {
      const t = new Date(now.getTime() + h * 3600e3), p = Astro.moonIllumination(t).phase;
      if (!full && prev < 0.5 && p >= 0.5) full = t;
      if (!nw && p < prev) nw = t;
      prev = p;
    }
    const fd = (t) => { if (!t) return '—'; const di = dayInfo(dayKey(t)); return `${di.wd} ${di.d} ${di.mes}`; };
    const sol = ctx.sol.filter((e) => dayKey(e.t) === today.key).sort((a, c) => a.t - c.t);
    b.innerHTML = `
      <div class="wcard in full dhero"><div class="dh-l"><div class="moonw big">${moonWidget(ill).replace(/^<div class="moonw">|<\/div>$/g, '')}</div></div>
        <div class="dh-r"><div class="sub" style="font-size:20px">${Astro.phaseName(ill.phase)}</div>${kv('Iluminada', n0(ill.fraction * 100) + ' %')}${kv('Sale', fmtHM(today.moon.rise))}${kv('Se pone', fmtHM(today.moon.set))}${kv('Mareas', cap(tk))}</div></div>
      ${dcard('Próximas fases', 'moon', `<div class="dkv">${kv('Luna llena', fd(full))}${kv('Luna nueva', fd(nw))}</div><p class="dtxt">Con luna llena y nueva hay mareas vivas: más corriente y más movimiento. En cuarto creciente y menguante, mareas muertas.</p>`)}
      ${dcard('Semana', 'cal', `<div class="mweek">${futureDays(ctx).map((d) => `<div><span>${dayName(d.key)}</span>${moonSVG(d.ill.phase, 34)}<small>${n0(d.ill.fraction * 100)}%</small><em class="${Astro.tideKind(d.ill.phase)}">${cap(Astro.tideKind(d.ill.phase))}</em></div>`).join('')}</div>`)}
      ${dcard('Periodos solunares de hoy', 'clock', sol.map((e) => `<div class="drow sol"><b>${e.k === 'maj' ? 'Mayor' : 'Menor'}</b><span>${e.n}</span><span class="dv">${fmtHM(new Date(e.t.getTime() - (e.k === 'maj' ? 60 : 40) * 60000))}–${fmtHM(new Date(e.t.getTime() + (e.k === 'maj' ? 60 : 40) * 60000))}</span></div>`).join('') + '<div class="foot">Mayor: luna arriba o abajo (2 h). Menor: sale o se pone (1 h).</div>')}`;
  } },
  sol: { t: 'Sol', render(b, ctx) {
    const today = ctx.dayBy[dayKey()] || ctx.days[1];
    const len = (d) => (d.ss - d.sr) / 60000;
    const tm = ctx.days[today.di + 1];
    const diff = tm ? Math.round(len(tm) - len(today)) : 0;
    const w = (t, m) => new Date(t.getTime() + m * 60000);
    b.innerHTML = `
      <div class="wcard in full dhero"><div class="dh-r" style="grid-column:1/-1"><div class="sun-arc big">${sunArcSVG(today)}</div><div class="dkv">${kv('Amanece', fmtHM(today.sr))}${kv('Anochece', fmtHM(today.ss))}${kv('Horas de luz', `${Math.floor(len(today) / 60)} h ${n0(len(today) % 60)} min`)}${kv('Mañana', `${diff >= 0 ? '+' : ''}${diff} min`)}</div></div></div>
      ${dcard('Las mejores horas de luz', 'sunrise', `<div class="drow"><b>Alba</b><span>Hora punta</span><span class="dv">${fmtHM(w(today.sr, -45))}–${fmtHM(w(today.sr, 75))}</span></div><div class="drow"><b>Atardecer</b><span>Hora punta</span><span class="dv">${fmtHM(w(today.ss, -75))}–${fmtHM(w(today.ss, 45))}</span></div><p class="dtxt">Con poca luz los peces se acercan a la orilla y pierden la desconfianza. Pleno sol: mejor fondo o agua movida.</p>`)}
      ${dcard('Índice UV', 'sun', dChart(ctx, [{ v: ctx.H.uv_index, c: '#FFD60A', name: 'UV', area: true }], { dec: 1, min: 0, h: 110 }) + `<div class="foot">Hoy máximo ${n1(today.uv)}${today.uv >= 6 ? ': gorra, gafas y crema' : ''}.</div>`)}
      ${dcard('Semana', 'cal', dayRows(futureDays(ctx).map((d) => `<div class="drow"><b>${dayName(d.key)}</b><span></span><span>↑ ${fmtHM(d.sr)}</span><span>↓ ${fmtHM(d.ss)}</span><span class="dv">${Math.floor(len(d) / 60)}h ${pad(Math.round(len(d) % 60))}</span></div>`)))}`;
  } },
  tiempo: { t: 'Tiempo', render(b, ctx) {
    const i = ctx.now, H = ctx.H, w = wx(H.weather_code[i], H.is_day[i]), today = ctx.dayBy[dayKey()] || ctx.days[1];
    const fd = futureDays(ctx), tmin = Math.min(...fd.map((d) => d.tmin)), tmax = Math.max(...fd.map((d) => d.tmax));
    b.innerHTML = `
      <div class="wcard in full dhero"><div class="dh-l"><span class="wx-ic big">${w.e}</span></div><div class="dh-r"><div class="big">${n0(H.temperature_2m[i])}°</div><div class="sub">${w.t}</div>${kv('Sensación', n0(H.apparent_temperature[i]) + '°')}${kv('Lluvia', n0(H.precipitation_probability[i] || 0) + ' %')}${kv('Nubes', n0(H.cloud_cover[i]) + ' %')}${kv('Hoy', `${n0(today.tmin)}° / ${n0(today.tmax)}°`)}</div></div>
      ${dcard('Temperatura', 'temp', dChart(ctx, [{ v: H.temperature_2m, c: '#FFB340', name: 'Temp.', area: true }, { v: H.apparent_temperature, c: '#ffffff', name: 'Sensación', dash: true }], { unit: '°' }))}
      ${dcard('Probabilidad de lluvia', 'rain', dChart(ctx, [{ v: H.precipitation_probability, c: '#64D2FF', name: 'Lluvia', bars: true }], { unit: ' %', min: 0, max: 100, h: 100 }))}
      ${dcard('Próximos 7 días', 'cal', dayRows(fd.map((d) => `<div class="drow"><b>${dayName(d.key)}</b><span class="dic">${wx(d.code).e}</span><span class="dv l">${n0(d.tmin)}°</span><span class="trng"><i style="left:${((d.tmin - tmin) / Math.max(1, tmax - tmin) * 100).toFixed(1)}%;right:${((tmax - d.tmax) / Math.max(1, tmax - tmin) * 100).toFixed(1)}%"></i></span><span class="dv">${n0(d.tmax)}°</span><span class="dv rp">${d.rain ? d.rain + '%' : ''}</span></div>`)))}`;
  } },
  presion: { t: 'Presión', render(b, ctx) {
    const i = ctx.now, H = ctx.H, pr = H.pressure_msl[i], p3 = H.pressure_msl[i - 3], pd = p3 != null ? pr - p3 : 0;
    const trend = pd <= -3.5 ? 'Cae rápido' : pd < -0.8 ? 'Bajando' : pd <= 0.8 ? 'Estable' : pd <= 3 ? 'Subiendo' : 'Sube fuerte';
    b.innerHTML = `
      <div class="wcard in full dhero"><div class="dh-l"><div class="gauge">${gaugeSVG(pr)}</div></div><div class="dh-r"><div class="big">${n0(pr)}<small> hPa</small></div><div class="sub">${trend}</div>${kv('En 3 horas', `${pd >= 0 ? '+' : ''}${n1(pd)} hPa`)}</div></div>
      ${dcard('Próximos 7 días', 'gauge', dChart(ctx, [{ v: H.pressure_msl, c: '#ffffff', name: 'Presión', area: true }], { unit: ' hPa' }))}
      ${dcard('Cómo afecta a la pesca', 'info', `<div class="dscale">${[['Bajando', 'Antes de un cambio de tiempo los peces suelen comer con ganas'], ['Estable', 'Pesca normal: manda la marea y la luz'], ['Subiendo', 'Tras un temporal cuesta más que piquen'], ['Cae rápido', 'Se acerca mal tiempo: mira los avisos']].map(([a, t]) => `<div class="${a === trend ? 'on' : ''}"><b>${a}</b><span>${t}</span></div>`).join('')}</div>`)}`;
  } },
  corriente: { t: 'Corriente', render(b, ctx) {
    const i = ctx.now, M = ctx.M, cur = M.ocean_current_velocity ? M.ocean_current_velocity[i] : null, dir = M.ocean_current_direction ? M.ocean_current_direction[i] : null;
    const txt = dir == null ? '' : dir > 45 && dir < 135 ? 'Entra agua del Atlántico al Mediterráneo' : dir > 225 && dir < 315 ? 'Sale hacia el Atlántico' : 'Corriente cruzada';
    b.innerHTML = `
      <div class="wcard in full dhero w-cur">${curFlow(dir)}<div class="dh-r" style="grid-column:1/-1"><div class="big">${n1(cur)}<small> km/h</small></div><div class="sub">${dir != null ? 'Hacia el ' + sect(dir) : 'Sin dato'}</div><div class="foot">${txt}</div></div></div>
      ${dcard('Próximos 7 días', 'current', dChart(ctx, [{ v: M.ocean_current_velocity || [], c: '#30D158', name: 'Corriente', area: true }], { unit: ' km/h', dec: 1, min: 0 }))}
      ${dcard('La corriente en el Estrecho', 'info', `<p class="dtxt">Por arriba entra casi siempre agua del Atlántico hacia el Mediterráneo, y la marea la acelera o la frena. Con mareas vivas la corriente es más fuerte y en algunos puntos de la costa llega a cambiar de sentido.</p><p class="dtxt">Mucha corriente: plomo más pesado o pesca a favor. Muy poca: mejor cebo que se mueva.</p><div class="glass-actions"><button class="gbtn solid" data-det="mareas">Ver mareas</button></div>`)}`;
  } },
  mareas: { t: 'Mareas', render(b) { renderMareas(b); } },
};
function openDetail(kind) {
  const D2 = DETAILS[kind];
  if (!D2) return;
  if (!state.ctx) { toast('Esperando el parte…', 'clock'); return; }
  haptic();
  openPage({ title: D2.t, kind, render: (b) => D2.render(b, state.ctx) });
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
// Miniatura de satélite (tesela de Esri del punto; el service worker la guarda para verla sin cobertura)
function satTile(lat, lon, z = 15) {
  const n = 2 ** z, r = lat * Math.PI / 180;
  const x = Math.floor((lon + 180) / 360 * n), y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}
// Cabecera visual de las pestañas claras: la misma escena animada de las portadas del perfil, con su dato clave
function tabHero({ cover, kicker, title, sub = '', stats = [], cta = '', img = '' }) {
  return `<div class="thero"><div class="th-cv">${img ? `<div class="cv"><img class="cv-img" src="${img}" alt="" loading="lazy"></div>` : coverHTML({ cover })}</div><div class="th-in"><div class="th-k">${kicker}</div><div class="th-t">${title}</div>${sub ? `<div class="th-s">${sub}</div>` : ''}${stats.length ? `<div class="th-st">${stats.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : ''}${cta}</div></div>`;
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
  const cell = ({ s, q: sc, d }) => `<button class="cell spc" data-spot="${s.id}"><span class="sp-th"><img src="${satTile(s.lat, s.lon)}" alt="" loading="lazy" decoding="async"><i style="background:${tipoOf(s).c}">${tipoIc(s, 'xs')}</i></span><div class="grow"><div class="t ell">${S.favs.includes(s.id) ? gl('star', 'in') + ' ' : ''}${esc(s.nombre)}</div><div class="s ell">${esc(s.municipio)} · ${tipoOf(s).n}${d != null ? ` · ${n1(d)} km` : ''}</div>${wt && s.abrigo && s.abrigo.includes(wt) ? `<div class="s" style="color:var(--green);font-weight:600">Resguardado del ${cap(wt)}</div>` : ''}</div>${sc != null ? `<span class="live" style="background:${scoreColor(sc)}">${n1(sc)}</span>` : !allNow ? '<span class="live wait">0,0</span>' : ''}${chev}</button>`;
  let listHTML;
  if (!withQ.length) listHTML = `<div class="empty"><div class="big">${gl('rod')}</div><b>Nada por aquí</b>${F === 'favs' ? 'Marca pesqueros con la estrella para tenerlos a mano.' : 'Prueba con otro filtro.'}</div>`;
  else if (state.spotSort === 'zona') {
    listHTML = Object.keys(D.zonas).map((z) => { const it = withQ.filter((x) => x.s.mar === z).sort((a, b) => a.s.lon - b.s.lon); return it.length ? `<div class="sec-h">${esc(D.zonas[z])}</div><div class="group">${it.map(cell).join('')}</div>` : ''; }).join('');
  } else listHTML = `<div class="group" style="margin-top:12px">${withQ.map(cell).join('')}</div>`;
  const filters = [['todos', 'Todos'], ['favs', gl('star', 'in') + ' Favoritos'], ['abrigo', wt ? `${gl('shield', 'in')} Sin ${cap(wt)}` : gl('shield', 'in') + ' Resguardados'], ...Object.entries(TIPOS).map(([k, t]) => [k, `${ic(t.i, 'xs')} ${t.n}`])];
  const firstRender = !v.dataset.built;
  if (firstRender) {
    v.innerHTML = navbar('Pesqueros', `<button class="nbtn" data-act="near">${ic('loc', 'sm')}</button>`) + `
      <div id="sphero"></div>
      <div class="search">${ic('search', 'sm')}<input type="search" placeholder="Pesquero, pueblo o especie" id="spq" value="${esc(state.spotQ)}"></div>
      <div class="map" id="map"></div>
      <div class="chips" id="spf" style="margin-top:12px"></div>
      <div class="seg" id="sps" style="margin-top:8px"></div>
      <div id="splist"></div>
      <div class="sec-f" style="padding-top:14px">Nota de ahora mismo. Respeta las zonas protegidas y llévate tu basura.</div>`;
    v.dataset.built = '1';
    state.map = makeMap($('#map', v), { center: [36.07, -5.55], zoom: 10, pins: [], onPin: (id) => openSpotSheet(id) });
    $('#spq', v).addEventListener('input', debounce((e) => { state.spotQ = e.target.value; renderSpots(); }, 140));
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
  // El mejor sitio ahora mismo (con el viento de hoy), con su foto de satélite
  const top = D.spots.map((s) => ({ s, q: spotLive(s, ctx) })).filter((x) => x.q != null).sort((a, b) => b.q - a.q)[0];
  $('#sphero', v).innerHTML = top ? tabHero({ img: satTile(top.s.lat, top.s.lon, 14), kicker: `Mejor ahora${wt ? ' · sopla ' + cap(wt) : ''}`, title: `<span class="ell">${esc(top.s.nombre)}</span><span class="th-sc" style="background:${scoreColor(top.q)}">${n1(top.q)}</span>`, sub: `${esc(top.s.municipio)} · ${tipoOf(top.s).n}${wt && top.s.abrigo && top.s.abrigo.includes(wt) ? ' · resguardado del ' + cap(wt) : ''}`, cta: `<button class="th-btn" data-spot="${top.s.id}">Ver pesquero ${chev}</button>` })
    : tabHero({ cover: 'faro', kicker: 'Del Estrecho', title: `${D.spots.length} pesqueros`, sub: 'De Caños de Meca a Sabinillas, con su nota en vivo.', stats: [[S.favs.length, 'favoritos'], [Object.keys(D.zonas).length, 'zonas']] });
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
    <div class="btn-row" style="margin-top:20px"><button class="btn" data-use="1">${ic('today', 'sm')} Ver su parte</button><a class="btn gray" href="${dirUrl}" target="_blank" rel="noopener">${ic('nav', 'sm')} Cómo llegar</a></div>
    <div style="padding:10px 16px 0"><button class="btn gray" data-wg="1">${ic('wind', 'sm')} Windguru · ${esc(WG_NAMES[wgFor(s)] || '')}</button></div>`,
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
      $('[data-wg]', el).onclick = () => openWindguru(s);
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
// Filtros rápidos de la Pecedex (se combinan entre sí)
function dexQuick(m, st, sp) {
  return {
    temporada: { n: 'En temporada', f: (f) => (f.meses || []).includes(m) && !f.prohibida },
    aqui: { n: `En ${sp.nombre.length > 16 ? 'tu pesquero' : sp.nombre}`, f: (f) => (sp.especies || []).includes(f.id) },
    faltan: { n: 'Por capturar', f: (f) => !st[f.id] },
    capturadas: { n: 'Capturadas', f: (f) => !!st[f.id] },
    comer: { n: 'Para comer', f: (f) => (f.mesa || 0) >= 4 && !f.prohibida },
    llevar: { n: 'Te la puedes llevar', f: (f) => !f.prohibida },
    raras: { n: '4-5★', f: (f) => f.rareza >= 4 },
  };
}
const HAB_N = { playa: 'Playa', roca: 'Rocas', puerto: 'Puerto y espigón', estuario: 'Río y estuario', 'pelágico': 'Pelágico (de paso)', fondo: 'Fondo', cefalopodo: 'Calamares y pulpos' };
function dexOptions(k) {
  const count = (fn) => D.species.filter(fn).length;
  if (k === 'hab') return Object.keys(HAB_N).map((h) => [h, HAB_N[h], count((f) => (f.habitat || []).includes(h) || (h === 'cefalopodo' && f.grupo === 'cefalopodos'))]).filter((x) => x[2]);
  const m = {};
  D.species.forEach((f) => ((k === 'tec' ? f.tecnicas : f.cebos) || []).forEach((t) => { const key = norm(t); m[key] = m[key] || [key, cap(t), 0]; m[key][2]++; }));
  return Object.values(m).sort((a, b) => b[2] - a[2]).slice(0, k === 'cebo' ? 16 : 14);
}
function openDexPick(k) {
  const DF = state.dexF;
  const opts = dexOptions(k);
  openSheet({
    title: { tec: 'Técnica', hab: 'Dónde', cebo: 'Cebo' }[k],
    body: `<div class="ssub" style="padding-top:8px">${{ tec: 'Qué especies salen con cada técnica.', hab: 'Dónde suele estar cada especie.', cebo: 'Qué especies entran a cada cebo.' }[k]}</div><div class="group">
      <button class="cell" data-pk=""><span class="t grow">Todas</span>${!DF[k] ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button>
      ${opts.map(([v, n, c]) => `<button class="cell" data-pk="${esc(v)}"><span class="t grow">${esc(n)}</span><span class="v">${c}</span>${DF[k] === v ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button>`).join('')}</div>`,
    onOpen: (el) => el.addEventListener('click', (e) => { const b = e.target.closest('[data-pk]'); if (!b) return; DF[k] = b.dataset.pk; haptic(); closeSheet(); renderPeces(); }),
  });
}
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
  if (q) list = list.filter((f) => norm(`${f.nombre} ${(f.otros || []).join(' ')} ${f.cientifico}`).includes(q));
  // Filtros combinables: rápidos (sí/no) + qué técnica, dónde y con qué cebo
  const DF = state.dexF || (state.dexF = { on: [], tec: '', hab: '', cebo: '' });
  const spHere = spotById(S.spot);
  const QUICK = dexQuick(m, st, spHere);
  DF.on.forEach((k) => { if (QUICK[k]) list = list.filter(QUICK[k].f); });
  if (DF.tec) list = list.filter((f) => (f.tecnicas || []).some((t) => norm(t) === DF.tec));
  if (DF.hab) list = list.filter((f) => (f.habitat || []).includes(DF.hab) || (DF.hab === 'cefalopodo' && f.grupo === 'cefalopodos'));
  if (DF.cebo) list = list.filter((f) => (f.cebos || []).some((t) => norm(t).includes(DF.cebo)));
  if (state.fishSort === 'rareza') list.sort((a, b) => b.rareza - a.rareza || a.num - b.num);
  if (state.fishSort === 'az') list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const sp = spotById(S.spot);
  const cards = list.map((f, k) => {
    const s = st[f.id];
    const t = tallaFor(f, sp);
    return `<button class="dex-card t${f.rareza} ${s ? '' : 'unseen'}" data-fish="${f.id}" style="--tc:${typeColor(f)};${k < 10 ? `animation-delay:${k * 0.03}s` : 'animation:none'}">
      <div class="dex-top">${starsHTML(f.rareza, 'sm')}</div>
      <div class="art${fotoURL(f) ? ' ph' : ''}">${fotoImg(f, 330)}${fishSVG(f)}${s ? '' : `<span class="q">${gl('lock', 'in')}</span>`}${(f.meses || []).includes(m) && !f.prohibida ? '<span class="season">EN TEMPORADA</span>' : ''}</div>
      <div class="dex-name ell">${esc(f.nombre)}</div>
      <div class="dex-foot">${f.prohibida ? `<span class="tag r">${esc(f.veto)}</span>` : t ? `<span class="tag b">${t} cm</span>` : f.tallaPend ? '<span class="tag o">Ver tabla</span>' : '<span class="tag">Sin talla</span>'}<span class="dex-got">${s ? `×${s.n}` : gl('lock', 'in')}</span></div>
    </button>`;
  }).join('');
  if (!v.dataset.built) {
    v.innerHTML = navbar('Pecedex', `<button class="nbtn" data-act="normas">${ic('scale', 'sm')} Normas</button>`) + `
      <div class="lsub">Todas las especies del Estrecho. Las capturas del Diario las desbloquean.</div>
      <div id="dexhero"></div>
      <div class="search">${ic('search', 'sm')}<input type="search" placeholder="Especie o nombre local" id="fq"></div>
      <div class="chips" id="ff"></div>
      <div class="seg" id="fsort" style="margin-top:6px"></div>
      <div class="sec-h" id="fcount"></div>
      <div class="dex-grid" id="fgrid"></div>`;
    v.dataset.built = '1';
    $('#fq', v).addEventListener('input', debounce((e) => { state.fishQ = e.target.value; renderPeces(); }, 140));
    v.addEventListener('click', (e) => {
      const f = e.target.closest('[data-ff]');
      if (f) { const DF = state.dexF, k = f.dataset.ff; DF.on = DF.on.includes(k) ? DF.on.filter((x) => x !== k) : [...DF.on, k]; if (k === 'capturadas') DF.on = DF.on.filter((x) => x !== 'faltan'); if (k === 'faltan') DF.on = DF.on.filter((x) => x !== 'capturadas'); haptic(); renderPeces(); return; }
      const dd = e.target.closest('[data-fdd]');
      if (dd) { openDexPick(dd.dataset.fdd); return; }
      if (e.target.closest('[data-fclear]')) { state.dexF = { on: [], tec: '', hab: '', cebo: '' }; haptic(); renderPeces(); return; }
      const so = e.target.closest('[data-fsort]');
      if (so) { state.fishSort = so.dataset.fsort; haptic(); renderPeces(); return; }
      const fi = e.target.closest('[data-fish]');
      if (fi) { openFishSheet(fi.dataset.fish); return; }
      if (e.target.closest('[data-act="normas"]')) openNormas();
    });
  }
  const tiers = [5, 4, 3, 2, 1].map((r) => { const all = D.species.filter((f) => f.rareza === r); return { r, all: all.length, got: all.filter((f) => st[f.id]).length }; }).filter((x) => x.all);
  const pct = got / total;
  $('#dexhero', v).innerHTML = `<div class="dex-hero"><div class="dh-cv">${coverHTML({ cover: 'fondo' })}</div><div class="ring big"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,.18)" stroke-width="8" fill="none"/><circle cx="40" cy="40" r="34" stroke="url(#gGold)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${213.6 * pct} 300" class="ring-anim"/></svg><b>${got}<small>/${total}</small></b></div><div class="dex-hero-r"><div class="dh-t">Tu colección</div>${tiers.map((x) => `<div class="dh-row">${starsHTML(x.r, 'xs')}<span>${x.got}/${x.all}</span></div>`).join('')}</div></div>`;
  const DFv = state.dexF, nAct = DFv.on.length + (DFv.tec ? 1 : 0) + (DFv.hab ? 1 : 0) + (DFv.cebo ? 1 : 0);
  const ddLabel = (k, t) => { const val = DFv[k]; const o = val && dexOptions(k).find((x) => x[0] === val); return `<button class="chip dd ${val ? 'on' : ''}" data-fdd="${k}">${o ? esc(o[1]) : t} ${ic('down', 'xs')}</button>`; };
  $('#ff', v).innerHTML = (nAct ? `<button class="chip clear" data-fclear="1">${ic('x', 'xs')} ${nAct}</button>` : '')
    + Object.entries(QUICK).map(([k, x]) => `<button class="chip ${DFv.on.includes(k) ? 'on' : ''}" data-ff="${k}">${x.n}</button>`).join('')
    + ddLabel('tec', 'Técnica') + ddLabel('hab', 'Dónde') + ddLabel('cebo', 'Cebo');
  const sorts = [['num', 'Familia'], ['rareza', 'Rareza'], ['az', 'A-Z']];
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
    title: 'Pecedex',
    body: `<div class="dex-entry" style="--tc:${tc}">
      <div class="dex-entry-art t${f.rareza}${fotoURL(f) ? ' ph' : ''}">${fotoImg(f, 960)}${fishSVG(f)}<span class="tier-pill">${starsHTML(f.rareza, 'xs')} ${esc(f.tier || '')}</span></div>
      <div class="stitle">${esc(f.nombre)}</div>
      <div class="ssub"><i>${esc(f.cientifico || '')}</i>${f.otros && f.otros.length ? ` · ${esc(f.otros.slice(0, 2).join(', '))}` : ''}</div>
      ${fotoURL(f) ? `<div class="credit">${fotoCredit(f)}</div>` : ''}
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
function showUnlock(f, after) {
  const st = dexStats();
  const got = D.species.filter((x) => st[x.id]).length;
  const el = document.createElement('div');
  el.className = 'unlock';
  const colors = ['#FFD60A', '#0A84FF', '#34C759', '#FF375F', '#64D2FF', '#BF5AF2'];
  el.innerHTML = `<div class="rays"></div>${Array.from({ length: 36 }, (_, i) => `<i class="conf" style="--x:${(i * 37) % 100}vw;--d:${(i % 7) * 0.12}s;--r:${(i * 53) % 360}deg;background:${colors[i % colors.length]}"></i>`).join('')}
    <div class="unlock-card t${f.rareza}" style="--tc:${typeColor(f)}"><div class="u-kicker">${gl('sparkle', 'in')} ¡Nueva especie!</div><div class="u-art${fotoURL(f) ? ' ph' : ''}">${fotoImg(f, 500)}${fishSVG(f)}</div><div class="u-name">${esc(f.nombre)}</div>${starsHTML(f.rareza)}<div class="u-tier">${esc(f.tier || '')}</div><div class="u-prog">Llevas ${got} de ${D.species.length}</div><button class="btn" data-u="dex">Ver en la Pecedex</button></div>`;
  document.body.appendChild(el);
  haptic();
  void el.offsetHeight;
  el.classList.add('on');
  const close = () => { el.classList.remove('on'); setTimeout(() => { el.remove(); if (after) after(); }, 400); };
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
  const segs = [['pescados', 'Pescados'], ['casa', 'A casa'], ['pena', 'Peña'], ['stats', 'Stats']];
  const si = segs.findIndex(([k]) => k === seg);
  const ppl = people();
  const whoChips = ppl.length > 1 ? `<div class="chips" style="padding-top:12px">${[['todos', 'Toda la peña'], ...ppl.map((p) => [p, p])].map(([k, t]) => `<button class="chip ${state.whoFilter === k ? 'on' : ''}" data-who="${esc(k)}">${esc(t)}</button>`).join('')}</div>` : '';
  let body = '';
  if (seg === 'stats') body = statsHTML();
  else if (seg === 'pena') body = '<div id="pena-box"><div class="empty"><div class="big">' + gl('signal') + '</div><b>Conectando con la peña…</b></div></div>';
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
  v.innerHTML = navbar('Diario') + `<div class="lsub">Lo que sale del agua, tuyo y de la peña</div>
    <div class="seg" id="dseg"><span class="thumb" style="width:calc((100% - 4px)/4);transform:translateX(${si * 100}%)"></span>${segs.map(([k, t]) => `<button class="${k === seg ? 'on' : ''}" data-seg="${k}">${t}</button>`).join('')}</div>
    ${body}`;
  fillPhotos(v);
  if (seg === 'pena') renderPena($('#pena-box', v));
  v.onclick = (e) => {
    const s = e.target.closest('[data-seg]');
    if (s) { state.diarioSeg = s.dataset.seg; haptic(); renderDiario(); return; }
    const w = e.target.closest('[data-who]');
    if (w) { state.whoFilter = w.dataset.who; renderDiario(); return; }
    const c = e.target.closest('[data-catch]');
    if (c) { openCatchDetail(c.dataset.catch); return; }
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
// Regla de talla de 5 a 200 cm: escala más fina en los peces pequeños (donde se juega la talla mínima)
const SL_K = 1.7;
const slToCm = (v) => { const cm = 5 + 195 * Math.pow(clamp(v, 0, 1000) / 1000, SL_K); return cm < 40 ? Math.round(cm * 2) / 2 : Math.round(cm); };
const cmToSl = (cm) => Math.round(1000 * Math.pow((clamp(+cm || 5, 5, 200) - 5) / 195, 1 / SL_K));
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
    <div class="group" style="padding:6px 16px 22px"><div class="big-num"><input type="number" inputmode="decimal" id="cf-cm" min="1" max="300" value="${c.cm || ''}"><span>cm</span></div><input type="range" class="slider" id="cf-sl" min="0" max="1000" step="1" value="${cmToSl(c.cm || 25)}" aria-label="Talla en centímetros"><div class="sl-ticks">${[10, 25, 50, 100, 150, 200].map((x) => `<span style="left:${cmToSl(x) / 10}%">${x}</span>`).join('')}</div><div class="measure" id="cf-meas"></div></div>
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
        meas.innerHTML = t ? `<span class="lim" style="left:${cmToSl(t) / 10}%"><span>mín. ${t}</span></span>` : rec ? `<span class="lim" style="background:var(--orange);left:${cmToSl(rec) / 10}%"><span style="color:var(--orange)">ref. ${rec}</span></span>` : '';
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
      $('#cf-cm', el).oninput = (e) => { const v = parseFloat(e.target.value); if (v) $('#cf-sl', el).value = cmToSl(v); c.cm = v; update(); };
      $('#cf-sl', el).oninput = (e) => { const v = slToCm(+e.target.value); $('#cf-cm', el).value = v; c.cm = v; update(); };
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
          if (!edit && f && f.tamCm) { $('#cf-cm', el).value = f.tamCm; $('#cf-sl', el).value = cmToSl(f.tamCm); c.cm = f.tamCm; }
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
        if (!edit) setTimeout(() => { if (isNew) showUnlock(f, celebrateBadges); else celebrateBadges(); }, 550);
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

/* ---------------- Fotos reales (Wikimedia Commons) ---------------- */
const FOTOS = window.TPTV_FOTOS || {};
const fotoURL = (f, w = 500) => { const x = f && FOTOS[f.id]; return x ? x.u.replace('{w}', w) : null; };
const fotoImg = (f, w) => { const u = fotoURL(f, w); return u ? `<img class="foto fade" src="${u}" alt="${esc(f.nombre)}" loading="lazy" decoding="async" onload="this.classList.add('ok');this.parentNode.classList.add('ok')" onerror="this.parentNode.classList.remove('ph');this.remove()">` : ''; };
const fotoCredit = (f) => { const x = FOTOS[f.id]; return x ? `Foto: <a href="${esc(x.p)}" target="_blank" rel="noopener">${esc(x.a)}</a> · ${esc(x.l)} · ${esc(x.s || 'Wikimedia Commons')}` : ''; };

/* ---------------- Windguru (widget oficial) ---------------- */
const WG_NAMES = { 43: 'Tarifa', 504258: 'Valdevaqueros', 48784: 'Getares', 127951: 'La Alcaidesa', 6730: 'Sotogrande', 146885: 'Zahora', 146227: 'La Hierbabuena', 145448: 'Barbate', 113353: 'Zahara de los Atunes' };
const WG_SPOT = {
  146885: ['faro-trafalgar', 'canos-de-meca'], 146227: ['hierbabuena'], 145448: ['espigon-barbate', 'playa-carmen-barbate', 'rio-barbate'],
  113353: ['playa-zahara-barbate', 'rio-cachon-zahara', 'atlanterra', 'bunker-zahara', 'los-alemanes'], 504258: ['punta-paloma', 'valdevaqueros', 'punta-la-pena'],
  43: ['lances-rio-jara', 'lances-sur', 'isla-tarifa', 'guadalmesi'],
  48784: ['pelayo-cala-arenas', 'faro-punta-carnero', 'ballenera-getares', 'playa-getares', 'rinconcillo', 'desembocadura-palmones', 'playa-palmones', 'desembocadura-guadarranque', 'espigon-la-linea', 'poniente-la-linea'],
  127951: ['santa-barbara', 'levante-la-linea', 'atunara-el-burgo', 'alcaidesa', 'punta-carbonera', 'guadalquiton'],
  6730: ['sotogrande-espigones', 'desembocadura-guadiaro', 'torreguadiaro', 'punta-chullera', 'castillo-duquesa', 'puerto-duquesa', 'sabinillas'],
};
const WG_BY = {};
Object.entries(WG_SPOT).forEach(([id, list]) => list.forEach((s) => { WG_BY[s] = +id; }));
const wgFor = (sp) => WG_BY[sp.id] || ({ atlantico: 145448, estrecho: 43, bahia: 48784, mediterraneo: 127951 })[sp.mar] || 43;
function openWindguru(sp) {
  const id = wgFor(sp);
  const uid = 'wg_fwdg_' + id + '_3_' + Date.now();
  openSheet({
    title: 'Windguru',
    body: `<div class="stitle">Windguru · ${esc(WG_NAMES[id] || '')}</div><div class="ssub">El punto de Windguru más cercano a ${esc(sp.nombre)}. Viento y rachas en km/h.</div>
    <div class="wg-box" id="wgbox"><div class="wg-load">${gl('wind')}<span>Cargando Windguru…</span></div></div>
    <div class="sec-f">Filas, de arriba abajo: viento, rachas (km/h), dirección, temperatura, nubes (%) y lluvia (mm). Desliza a los lados para ver más días. Modelo GFS de 13 km.</div>
    <div style="padding:16px 16px 0"><a class="btn gray" href="https://www.windguru.cz/${id}" target="_blank" rel="noopener">${ic('wind', 'sm')} Abrir en windguru.cz</a></div>`,
    onOpen: (el) => {
      const box = $('#wgbox', el);
      const anchor = document.createElement('script');
      anchor.type = 'text/plain'; anchor.id = uid;
      box.appendChild(anchor);
      const args = [`s=${id}`, 'm=3', `uid=${uid}`, 'wj=kmh', 'tj=c', 'waj=m', 'odh=0', 'doh=24', 'fhours=180', 'hrsm=1', 'vt=forecasts', 'lng=es', 'idbs=1', 'p=WINDSPD,GUST,SMER,TMPE,CDC,APCP1s'];
      const sc = document.createElement('script');
      sc.src = 'https://www.windguru.cz/js/widget.php?' + args.join('&');
      sc.async = true;
      sc.onload = () => setTimeout(() => { const l = $('.wg-load', box); if (l && box.children.length > 2) l.remove(); else if (l) l.innerHTML = 'Windguru no ha respondido. Prueba con «Abrir en windguru.cz».'; }, 1500);
      sc.onerror = () => { $('.wg-load', box).innerHTML = 'Sin conexión con Windguru. Prueba con «Abrir en windguru.cz».'; };
      document.body.appendChild(sc);
      new MutationObserver(() => { const l = $('.wg-load', box); if (l && box.querySelector('table, .wgfcst, div:not(.wg-load)')) l.remove(); }).observe(box, { childList: true, subtree: true });
    },
  });
}

/* ---------------- Cuentas y peña online ---------------- */
let penaTimer = 0;
function myPublicCatches() {
  return catches.filter((c) => (c.who || S.yo) === S.yo).sort((a, b) => b.t.localeCompare(a.t))
    .map((c) => ({ sp: c.sp, cm: c.cm || 0, g: c.g || 0, n: c.n || 1, keep: !!c.keep, t: c.t, spot: c.spot, cebo: c.cebo || '' }));
}
function syncPenaSoon() {
  if (!window.Pena || !Pena.enabled || !Pena.loggedIn) return;
  clearTimeout(penaTimer);
  penaTimer = setTimeout(() => Pena.publish(myPublicCatches(), publicProfile()).catch(() => {}), 2500);
}
const inviteLink = (u) => `${location.origin}${location.pathname}?amigo=${encodeURIComponent(u)}`;
function afterLogin() {
  if (S.yo === 'Yo' || !S.yo) { S.yo = Pena.username; saveS(); }
  syncPenaSoon();
  penaCache.fr = null; penaCache.t = 0; inbox = []; saveInbox();
  setTimeout(() => pollPena(true), 800);
  $$('.hoy-acts').forEach((a) => { a.outerHTML = topActs(); });
  if (state.tab === 'diario') renderDiario();
}
// Pantalla de entrar / crear cuenta (estilo iOS, a pantalla completa)
function openAuth(mode = 'login', then) {
  if (!window.Pena || !Pena.enabled) { toast('Las cuentas no están activadas en esta versión', 'warn'); return; }
  const old = $('.auth'); if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'auth';
  const draw = () => {
    const reg = mode === 'register';
    el.innerHTML = `<div class="auth-card">
      <img class="auth-logo" src="icons/apple-touch-icon.png" alt="">
      <div class="auth-t">${reg ? 'Crea tu cuenta' : 'Entra en TPTV'}</div>
      <div class="auth-s">${reg ? 'Elige un nombre de usuario: así te encontrarán tus colegas.' : 'Con tu usuario ves y compartes las capturas de tu peña.'}</div>
      <div class="seg auth-seg"><span class="thumb" style="width:calc((100% - 4px)/2);transform:translateX(${reg ? 100 : 0}%)"></span><button class="${reg ? '' : 'on'}" data-m="login">Entrar</button><button class="${reg ? 'on' : ''}" data-m="register">Crear cuenta</button></div>
      <form class="auth-form" novalidate>
        <label class="af"><span>Usuario</span><div class="af-in"><b>@</b><input name="u" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="20" placeholder="tu_usuario" required></div></label>
        <label class="af"><span>Contraseña</span><div class="af-in"><input name="p" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" placeholder="${reg ? 'Mínimo 6 caracteres' : 'Tu contraseña'}" required><button type="button" class="eye" aria-label="Ver contraseña">${ic('eye', 'sm')}</button></div></label>
        ${reg ? '<label class="af"><span>Repite la contraseña</span><div class="af-in"><input name="p2" type="password" autocomplete="new-password" minlength="6" placeholder="Otra vez la misma" required></div></label>' : ''}
        <div class="auth-err" role="alert"></div>
        <button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Entrar'}</button>
      </form>
      ${reg ? '<div class="auth-note">No hace falta email. Apunta tu contraseña: si la olvidas no se puede recuperar.</div>' : ''}
      <button class="auth-skip" data-skip="1">Ahora no</button>
    </div>`;
    const form = $('form', el), err = $('.auth-err', el), u = form.elements.u;
    u.addEventListener('input', () => {
      const v = Pena.normUser(u.value);
      if (u.value !== v) u.value = v;
      err.textContent = reg && v.length >= 1 ? (Pena.checkUser(v) || '') : '';
    });
    $('.eye', el).onclick = () => { const p = form.elements.p; p.type = p.type === 'password' ? 'text' : 'password'; if (form.elements.p2) form.elements.p2.type = p.type; };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button[type=submit]', form);
      err.textContent = '';
      btn.disabled = true; btn.textContent = reg ? 'Creando…' : 'Entrando…';
      try {
        if (reg) await Pena.register(u.value, form.elements.p.value, form.elements.p2.value);
        else await Pena.login(u.value, form.elements.p.value);
        close();
        toast(reg ? `Bienvenido, @${Pena.username}` : `Hola, @${Pena.username}`);
        afterLogin();
        if (then) then();
      } catch (er) {
        err.textContent = er.message;
        btn.disabled = false; btn.textContent = reg ? 'Crear cuenta' : 'Entrar';
        el.querySelector('.auth-card').classList.remove('shake'); void el.offsetWidth; el.querySelector('.auth-card').classList.add('shake');
      }
    };
    setTimeout(() => u.focus(), 350);
  };
  const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', (e) => {
    const m = e.target.closest('[data-m]');
    if (m && m.dataset.m !== mode) { mode = m.dataset.m; haptic(); draw(); return; }
    if (e.target.closest('[data-skip]')) { LS.set('auth.skip', Date.now()); close(); }
  });
  draw();
  document.body.appendChild(el);
  void el.offsetHeight;
  el.classList.add('on');
}
async function addFriendFlow(user) {
  try {
    const uid = await Pena.addUser(user); const names = LS.get('pena.names', {}); names[uid] = Pena.normUser(user); LS.set('pena.names', names);
    // Pendiente desde ya: así, cuando acepte, llega el aviso aunque la app no haya vuelto a mirar la peña
    const st = LS.get('pena.state', {}); if (st[uid] !== 'ok') { st[uid] = 'pend'; LS.set('pena.state', st); } toast(`Solicitud enviada a @${Pena.normUser(user)}`); syncPenaSoon(); return true; } catch (e) { toast(e.message || 'No se pudo añadir', 'warn'); return false; }
}
/* ---------------- Peña: avisos ----------------
   Sin servidor propio: la app mira la peña cada minuto mientras está abierta (solicitudes) y cada 3 minutos
   repasa a los colegas (si te aceptan, si sacan algo, si baten un récord, si te meten en una lista).
   Con la app en segundo plano avisa con una notificación del sistema (si la has permitido) y en Android, con la app
   instalada, el service worker revisa las solicitudes aunque esté cerrada (Periodic Background Sync). */
const penaCache = { fr: null, inc: [], out: null, t: 0 };
let inbox = LS.get('pena.inbox', []);
const unread = () => inbox.filter((n) => !n.read).length;
function paintBell() {
  const n = unread();
  $$('.bell-b').forEach((b) => { b.textContent = n > 9 ? '9+' : String(n); b.hidden = !n; });
  const tab = $('#tabbar [data-tab="diario"]');
  if (tab) tab.classList.toggle('dot', penaCache.inc.length > 0);
  try { if (navigator.setAppBadge) { if (n) navigator.setAppBadge(n); else navigator.clearAppBadge(); } } catch (e) { /* sin insignia */ }
}
function saveInbox() { inbox = inbox.sort((a, b) => b.t - a.t).slice(0, 60); LS.set('pena.inbox', inbox); paintBell(); }
// Añade un aviso (sin duplicar) y, si es nuevo y se pide, lo enseña
function addNote(n, show) {
  if (inbox.some((x) => x.id === n.id)) return false;
  inbox.unshift({ read: false, t: Date.now(), ...n });
  if (show) alertNote(n);
  return true;
}
function noteText(n) {
  const who = `@${n.name || 'alguien'}`;
  const f = n.sp ? fishById(n.sp) : null;
  if (n.k === 'req') return { title: 'Solicitud de amistad', body: `${who} quiere unirse a tu peña` };
  if (n.k === 'acc') return { title: 'Solicitud aceptada', body: `${who} ya está en tu peña` };
  if (n.k === 'catch') return { title: n.rec ? '¡Récord de la peña!' : 'Nueva captura', body: `${who}: ${f ? f.nombre : 'captura nueva'}${n.cm ? ` de ${n.cm} cm` : ''}${n.n > 1 ? ` y ${n.n - 1} más` : ''}` };
  if (n.k === 'list') return { title: 'Lista compartida', body: `${who} te ha añadido a «${n.title || 'una lista'}»` };
  if (n.k === 'left') return { title: 'Peña', body: `${who} ya no está en tu peña` };
  return { title: 'TPTV', body: '' };
}
const NOTE_IC = { req: 'users', acc: 'check', catch: 'fish', list: 'list', left: 'x' };
let bannerT = 0;
function alertNote(n) {
  const tx = noteText(n);
  // Con la app en segundo plano: notificación del sistema (si hay permiso)
  if (document.visibilityState !== 'visible') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const opts = { body: tx.body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: n.id, data: { url: './?avisos=1' } };
      (navigator.serviceWorker && navigator.serviceWorker.controller ? navigator.serviceWorker.ready.then((r) => r.showNotification(tx.title, opts)) : Promise.reject()).catch(() => { try { new Notification(tx.title, opts); } catch (e) { /* nada */ } });
    }
    return;
  }
  // Con la app delante: aviso que baja desde arriba, como en iOS
  let el = $('#nbanner');
  if (!el) { el = document.createElement('div'); el.id = 'nbanner'; document.body.appendChild(el); }
  el.innerHTML = `<div class="nb-card" data-nb="open"><span class="nb-ic k-${n.k}">${avatarHTML({ name: n.name || '?' }, n.uid, 'sm')}<i>${ic(NOTE_IC[n.k] || 'info', 'xs')}</i></span><div class="nb-t"><b>${esc(tx.title)}</b><span>${esc(tx.body)}</span></div>${n.k === 'req' ? `<button class="btn small" data-nb="acc">Aceptar</button>` : ''}</div>`;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  haptic();
  clearTimeout(bannerT);
  bannerT = setTimeout(() => el.classList.remove('on'), 5200);
  el.onclick = async (e) => {
    const b = e.target.closest('[data-nb]');
    el.classList.remove('on');
    if (!b) return;
    if (b.dataset.nb === 'acc') { try { await Pena.accept(n.uid); dropReq(n.uid); toast(`@${n.name} ya está en tu peña`); pollPena(true); } catch (er) { toast(er.message || 'Error', 'warn'); } return; }
    openInbox();
  };
  let y0 = null;
  el.onpointerdown = (e) => { y0 = e.clientY; };
  el.onpointerup = (e) => { if (y0 != null && y0 - e.clientY > 20) el.classList.remove('on'); y0 = null; };
}
function dropReq(uid) {
  penaCache.inc = penaCache.inc.filter((r) => r.from !== uid);
  inbox = inbox.filter((x) => !(x.k === 'req' && x.uid === uid));
  saveInbox();
}
// Récords de cada especie en toda la peña (para marcar las capturas que los baten)
function penaRecords(people) {
  const rec = {};
  people.forEach((p) => (p.catches || []).forEach((c) => { if (c.cm && (!rec[c.sp] || c.cm > rec[c.sp].cm)) rec[c.sp] = { cm: c.cm, t: c.t, who: p.uid }; }));
  return rec;
}
let pollBusy = false, pollN = 0;
async function pollPena(full) {
  if (!window.Pena || !Pena.enabled || !Pena.loggedIn || pollBusy) return;
  const visible = document.visibilityState === 'visible';
  pollBusy = true;
  try {
    const inc = await Pena.incoming();
    penaCache.inc = inc;
    const seen = LS.get('pena.reqseen', []);
    inc.forEach((r) => { if (addNote({ id: 'req:' + r.from, k: 'req', uid: r.from, name: r.fromName, t: r.t || Date.now() }, !seen.includes(r.from))) { /* nuevo */ } });
    if (inc.some((r) => !seen.includes(r.from))) LS.set('pena.reqseen', [...new Set([...seen, ...inc.map((r) => r.from)])].slice(-200));
    inbox = inbox.filter((n) => n.k !== 'req' || inc.some((r) => r.from === n.uid));
    if (visible && (full || ++pollN % 3 === 0 || !penaCache.fr)) await pollFriends();
    saveInbox();
    swSync();
  } catch (e) { /* sin conexión: ya lo intentará */ } finally { pollBusy = false; }
}
async function pollFriends(noUI) {
  const [fr, out] = await Promise.all([Pena.friends(), Pena.outgoing().catch(() => null)]);
  const st = LS.get('pena.state', {}), names = LS.get('pena.names', {}), seenT = LS.get('pena.seenT', {});
  const ok = [], gone = new Set();
  const meP = { uid: Pena.uid, catches: myPublicCatches() };
  const rec = penaRecords([meP, ...fr.filter((x) => x.ok)]);
  for (const x of fr) {
    if (x.ok) {
      ok.push(x.uid);
      const name = x.username || x.name;
      names[x.uid] = name;
      if (st[x.uid] === 'pend') addNote({ id: 'acc:' + x.uid, k: 'acc', uid: x.uid, name }, true);
      st[x.uid] = 'ok';
      const cs = (x.catches || []).slice().sort((a, b) => b.t.localeCompare(a.t));
      if (seenT[x.uid] == null) seenT[x.uid] = cs[0] ? cs[0].t : '';
      else {
        const nw = cs.filter((c) => c.t > seenT[x.uid]);
        if (nw.length) {
          const best = nw.reduce((a, c) => ((c.cm || 0) > (a.cm || 0) ? c : a), nw[0]);
          const isRec = !!(best.cm && rec[best.sp] && rec[best.sp].who === x.uid && rec[best.sp].t === best.t);
          addNote({ id: `catch:${x.uid}:${nw[0].t}`, k: 'catch', uid: x.uid, name, sp: best.sp, cm: best.cm, n: nw.reduce((a, c) => a + (c.n || 1), 0), rec: isRec, spot: best.spot }, true);
          seenT[x.uid] = nw[0].t;
        }
      }
    } else if (x.code === 403 || x.code === 404) {
      if (st[x.uid] === 'ok') {
        // Me quitó de su peña: dejo de enseñarle lo mío
        await Pena.remove(x.uid).catch(() => {});
        delete st[x.uid]; gone.add(x.uid);
        addNote({ id: `left:${x.uid}:${Date.now()}`, k: 'left', uid: x.uid, name: names[x.uid] }, false);
      } else if (out && !out.some((r) => r.to === x.uid) && st[x.uid] === 'pend') {
        // La solicitud ya no existe y no me aceptó: la rechazó. Se limpia sin avisar
        await Pena.remove(x.uid).catch(() => {});
        delete st[x.uid]; gone.add(x.uid);
      } else st[x.uid] = 'pend';
    }
  }
  penaCache.fr = fr.filter((x) => !gone.has(x.uid));
  penaCache.out = out; penaCache.t = Date.now();
  LS.set('pena.state', st); LS.set('pena.names', names); LS.set('pena.seenT', seenT); LS.set('pena.ok', ok);
  // Listas compartidas a las que me han añadido
  try {
    const ls = await Pena.myLists();
    const seenL = LS.get('pena.listseen', null);
    const others = ls.filter((l) => l.owner !== Pena.uid);
    if (seenL) others.filter((l) => !seenL.includes(l.id)).forEach((l) => addNote({ id: 'list:' + l.id, k: 'list', uid: l.owner, name: (l.names || {})[l.owner], title: l.title, lid: l.id }, true));
    LS.set('pena.listseen', [...new Set([...(seenL || []), ...others.map((l) => l.id)])].slice(-100));
  } catch (e) { /* sin listas */ }
  saveInbox();
  if (!noUI && state.tab === 'diario' && state.diarioSeg === 'pena') { const box = $('#pena-box'); if (box && !box.contains(document.activeElement)) renderPena(box, true); }
}
// Credenciales mínimas para que el service worker mire las solicitudes con la app cerrada
async function swSync() {
  try {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    const reg = await navigator.serviceWorker.ready;
    const s = Pena.loggedIn ? { ...Pena.session(), seen: LS.get('pena.reqseen', []) } : null;
    reg.active && reg.active.postMessage({ type: 'pena', s });
    if (s && 'periodicSync' in reg && 'Notification' in window && Notification.permission === 'granted') {
      const p = navigator.permissions ? await navigator.permissions.query({ name: 'periodic-background-sync' }).catch(() => null) : null;
      if (!p || p.state === 'granted') await reg.periodicSync.register('tptv-pena', { minInterval: 30 * 60e3 }).catch(() => {});
    }
  } catch (e) { /* sin service worker */ }
}
async function enablePush() {
  if (!('Notification' in window)) { toast(isIOS && !standalone ? 'En iPhone, instala la app para recibir avisos' : 'Este navegador no permite avisos', 'warn'); return false; }
  const p = await Notification.requestPermission();
  if (p !== 'granted') { toast('Has bloqueado los avisos en el navegador', 'warn'); return false; }
  toast('Avisos activados', 'bell');
  swSync();
  return true;
}
const pushOff = () => 'Notification' in window ? Notification.permission === 'default' : (isIOS && !standalone);
function openInbox() {
  if (!window.Pena || !Pena.loggedIn) { openAuth('login', openInbox); return; }
  const draw = (el) => {
    const reqs = penaCache.inc;
    const notes = inbox.filter((n) => n.k !== 'req');
    $('.sbody', el).innerHTML = `
      ${pushOff() ? `<div class="push-cta"><span class="pc-ic">${ic('bell')}</span><div class="grow"><b>Avisos en el móvil</b><span>Que te avise cuando te llegue una solicitud o un colega saque algo.</span></div><button class="btn small" data-ib="push">Activar</button></div>` : ''}
      ${reqs.length ? `<div class="sec-h">Solicitudes<span class="more" style="text-transform:none">${reqs.length}</span></div><div class="group">${reqs.map((r) => `<div class="cell"><span class="avatar" style="--h:${hue(r.from)}">${esc((r.fromName || '?').charAt(0).toUpperCase())}</span><div class="grow"><div class="t">@${esc(r.fromName || 'pescador')}</div><div class="s">Quiere unirse a tu peña</div></div><button class="btn small" data-acc="${r.from}" data-n="${esc(r.fromName || '')}">Aceptar</button><button class="nbtn" data-rej="${r.from}" aria-label="Rechazar">${ic('x', 'sm')}</button></div>`).join('')}</div>` : ''}
      <div class="sec-h">Novedades${notes.length ? `<button class="more" data-ib="clear" style="text-transform:none">Borrar</button>` : ''}</div>
      ${notes.length ? `<div class="group inbox">${notes.map((n) => { const tx = noteText(n); return `<button class="cell ${n.read ? '' : 'unread'}" data-note="${esc(n.id)}"><span class="nb-ic k-${n.k}">${avatarHTML({ name: n.name || '?' }, n.uid, 'sm')}<i>${ic(NOTE_IC[n.k] || 'info', 'xs')}</i></span><div class="grow"><div class="t">${esc(tx.title)}</div><div class="s" style="white-space:normal">${esc(tx.body)}</div></div><span class="ib-t">${ago(n.t)}</span></button>`; }).join('')}</div>` : `<div class="empty" style="padding-top:24px"><div class="big">${gl('signal')}</div><b>Todo al día</b>Aquí verás solicitudes, capturas de tu peña y listas compartidas.</div>`}`;
  };
  const el = openSheet({
    title: 'Avisos',
    cls: 'sheet-inbox',
    body: '',
    onOpen: (sh) => {
      draw(sh);
      sh.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-ib],[data-acc],[data-rej],[data-note]');
        if (!b) return;
        try {
          if (b.dataset.ib === 'push') { if (await enablePush()) draw(sh); return; }
          if (b.dataset.ib === 'clear') { inbox = inbox.filter((n) => n.k === 'req'); saveInbox(); draw(sh); return; }
          if (b.dataset.acc) { b.disabled = true; await Pena.accept(b.dataset.acc); dropReq(b.dataset.acc); toast(`@${b.dataset.n || 'Tu colega'} ya está en tu peña`); draw(sh); pollPena(true); return; }
          if (b.dataset.rej) { await Pena.reject(b.dataset.rej); dropReq(b.dataset.rej); draw(sh); return; }
          if (b.dataset.note) {
            const n = inbox.find((x) => x.id === b.dataset.note);
            if (!n) return;
            if (n.k === 'list' && n.lid) { closeSheet(); goTab('kit'); setTimeout(() => openList(n.lid, true), 300); return; }
            const fr = (penaCache.fr || []).find((x) => x.uid === n.uid && x.ok);
            if (fr && (n.k === 'acc' || n.k === 'catch')) { openProfile(fr); return; }
            closeSheet(); state.diarioSeg = 'pena'; state.penaSeg = 'feed'; goTab('diario');
          }
        } catch (er) { toast(er.message || 'Error', 'warn'); }
      });
    },
    onClose: () => { inbox.forEach((n) => { n.read = true; }); saveInbox(); },
  });
  return el;
}
function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.round(m / 60)} h`;
  if (m < 10080) return `${Math.round(m / 1440)} d`;
  const di = dayInfo(dayKey(new Date(t)));
  return `${di.d} ${di.mes}`;
}
// Hace cuánto de una captura (sus horas van en hora de aquí, «AAAA-MM-DDTHH:MM»)
function agoCatch(t, sameDay) {
  if (!t || t.length < 16) return '';
  const d = fromLocal(t.slice(0, 16));
  const m = (Date.now() - d) / 60000;
  if (m >= 0 && m < 1440) return m < 60 ? `hace ${Math.max(1, Math.round(m))} min` : `hace ${Math.round(m / 60)} h`;
  if (sameDay) return 'a las ' + t.slice(11, 16);
  const di = dayInfo(t.slice(0, 10));
  return di.rel ? di.rel.toLowerCase() : `${di.wd.toLowerCase()} ${di.d} ${di.mes}`;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pollPena(); });
setInterval(() => pollPena(), 60e3);
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'avisos') openInbox(); });

/* ---------------- Peña: la pantalla ----------------
   Tarjeta propia, solicitudes, y tres vistas: Actividad (lo último de todos, la pieza de la semana, récords y
   especies nuevas), Ranking (semana, mes, año o siempre; por piezas, especies o la mayor) y Miembros (colegas,
   solicitudes enviadas, buscar y sugerencias). */
const RK_P = [['week', 'Semana'], ['month', 'Mes'], ['year', 'Año'], ['all', 'Siempre']];
const RK_M = [['n', 'Piezas'], ['sp', 'Especies'], ['big', 'La mayor']];
function rkCut(p) {
  if (p === 'all') return '';
  const d = new Date(Date.now() - (p === 'week' ? 7 : p === 'month' ? 30 : 365) * 864e5);
  return dayKey(d);
}
function penaPeople() {
  const fr = (penaCache.fr || []).filter((x) => x.ok);
  return [{ uid: Pena.uid, name: Pena.username, catches: myPublicCatches(), yo: true, p: PROFILE }, ...fr.map((x) => ({ uid: x.uid, name: x.username || x.name, catches: x.catches || [], p: x }))];
}
function feedHTML(people) {
  const rec = penaRecords(people);
  // Primera vez que cada uno saca cada especie
  const firsts = new Set();
  // (las primeras capturas de cada uno no cuentan: al empezar, todo es nuevo)
  people.forEach((p) => { const got = new Set(); [...p.catches].sort((a, b) => a.t.localeCompare(b.t)).forEach((c, k) => { if (!got.has(c.sp)) { got.add(c.sp); if (k >= 3) firsts.add(p.uid + '|' + c.t + '|' + c.sp); } }); });
  // Un récord solo lo es si hay con qué compararlo
  const perSp = {}; people.forEach((p) => p.catches.forEach((c) => { if (c.cm) perSp[c.sp] = (perSp[c.sp] || 0) + 1; }));
  const all = people.flatMap((p) => p.catches.map((c) => ({ ...c, who: p }))).sort((a, b) => b.t.localeCompare(a.t));
  const weekCut = rkCut('week');
  const wk = all.filter((c) => c.t >= weekCut && c.cm).sort((a, b) => b.cm - a.cm)[0];
  const card = (c) => {
    const f = fishById(c.sp) || { nombre: c.sp, id: c.sp };
    const isRec = rec[c.sp] && rec[c.sp].who === c.who.uid && rec[c.sp].t === c.t && c.cm && perSp[c.sp] > 1;
    const isNew = firsts.has(c.who.uid + '|' + c.t + '|' + c.sp);
    const sp = D.spots.find((s) => s.id === c.spot);
    return `<div class="feedc">
      <button class="fc-h" data-fp="${c.who.uid}">${avatarHTML(c.who.p || {}, c.who.uid, 'sm')}<div class="grow"><b>${c.who.yo ? 'Tú' : '@' + esc(c.who.name)}</b><span>${agoCatch(c.t, true)}${sp ? ' · ' + esc(sp.nombre) : ''}</span></div></button>
      <button class="fc-b" data-fish="${esc(f.id)}"><span class="fc-img ${fotoURL(f) ? 'ph' : ''}">${fotoImg(f, 330)}${fishSVG(f)}</span>
        <div class="fc-i"><div class="fc-n">${esc(f.nombre)}${c.n > 1 ? ` <small>×${c.n}</small>` : ''}</div><div class="fc-m">${c.cm ? `<b>${c.cm}</b> cm` : ''}${c.g ? `${c.cm ? ' · ' : ''}${c.g >= 1000 ? n1(c.g / 1000) + ' kg' : c.g + ' g'}` : ''}${!c.cm && !c.g ? 'Sin medir' : ''}</div>
        <div class="fc-tags">${isRec ? `<span class="tag o">${gl('trophy', 'in')} Récord</span>` : ''}${isNew ? `<span class="tag p">${gl('sparkle', 'in')} Especie nueva</span>` : ''}<span class="tag ${c.keep ? 'g' : 'b'}">${c.keep ? 'A casa' : 'Suelta'}</span></div>${c.cebo ? `<div class="fc-c">Con ${esc(c.cebo)}</div>` : ''}</div></button></div>`;
  };
  let lastDay = '';
  const rows = all.slice(0, 40).map((c) => { const d = c.t.slice(0, 10); const di = dayInfo(d); const h = d !== lastDay ? `<div class="sec-h fd-h">${di.rel || cap(di.wdl) + ' ' + di.d + ' ' + di.mes}</div>` : ''; lastDay = d; return h + card(c); }).join('');
  return `${wk ? (() => { const f = fishById(wk.sp) || { nombre: wk.sp, id: wk.sp }; return `<button class="potw" data-fp="${wk.who.uid}"><span class="potw-img ${fotoURL(f) ? 'ph' : ''}">${fotoImg(f, 500)}${fishSVG(f)}</span><span class="potw-k">${gl('trophy', 'in')} Pieza de la semana</span><span class="potw-t"><b>${esc(f.nombre)} de ${wk.cm} cm</b><span>${wk.who.yo ? 'Tuya' : '@' + esc(wk.who.name)} · ${agoCatch(wk.t)}</span></span>${avatarHTML(wk.who.p || {}, wk.who.uid, 'big')}</button>`; })() : ''}
    ${rows || `<div class="empty"><div class="big">${gl('rod')}</div><b>Aún no hay capturas</b>Cuando tú o tus colegas apuntéis algo, sale aquí.</div>`}`;
}
function rankHTML(people) {
  const cut = rkCut(state.rkP || 'month'), m = state.rkM || 'n';
  const rows = people.map((p) => {
    const cs = p.catches.filter((c) => c.t >= cut);
    const big = cs.reduce((a, c) => ((c.cm || 0) > (a ? a.cm || 0 : 0) ? c : a), null);
    return { ...p, n: cs.reduce((a, c) => a + (c.n || 1), 0), sp: new Set(cs.map((c) => c.sp)).size, big, v: m === 'n' ? cs.reduce((a, c) => a + (c.n || 1), 0) : m === 'sp' ? new Set(cs.map((c) => c.sp)).size : big ? big.cm || 0 : 0, rk: rankOf(p.catches) };
  }).sort((a, b) => b.v - a.v || b.n - a.n);
  const unit = m === 'big' ? ' cm' : '';
  const sub = (r) => m === 'big' ? (r.big ? esc((fishById(r.big.sp) || {}).nombre || '') : 'Sin piezas medidas') : `${r.n} ${r.n === 1 ? 'pieza' : 'piezas'} · ${r.sp} ${r.sp === 1 ? 'especie' : 'especies'}`;
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const pod = rows.length > 1 && rows[0].v ? `<div class="podium2">${order.map((r) => { const k = rows.indexOf(r); return `<button class="pd pd${k + 1}" data-fp="${r.uid}"><span class="pd-av">${avatarHTML(r.p || {}, r.uid, k === 0 ? 'xl' : 'big')}<span class="pd-m">${gl(['medal1', 'medal2', 'medal3'][k])}</span></span><b class="ell">${r.yo ? 'Tú' : '@' + esc(r.name)}</b><span class="pd-v">${r.v}${unit}</span><span class="pd-base">${k + 1}</span></button>`; }).join('')}</div>` : '';
  return `<div class="chips rk-chips">${RK_P.map(([k, t]) => `<button class="chip ${(state.rkP || 'month') === k ? 'on' : ''}" data-rkp="${k}">${t}</button>`).join('')}</div>
    <div class="seg mini" id="rkm"><span class="thumb" style="width:calc((100% - 4px)/3);transform:translateX(${RK_M.findIndex(([k]) => k === m) * 100}%)"></span>${RK_M.map(([k, t]) => `<button class="${k === m ? 'on' : ''}" data-rkm="${k}">${t}</button>`).join('')}</div>
    ${pod}
    <div class="group rk-list">${rows.map((r, k) => `<button class="cell ${r.yo ? 'me' : ''}" data-fp="${r.uid}"><span class="rk-n">${k + 1}</span>${avatarHTML(r.p || {}, r.uid, 'sm')}<div class="grow"><div class="t ell">${r.yo ? 'Tú' : '@' + esc(r.name)} <small class="rk-lv">Nv ${r.rk.lvl}</small></div><div class="s ell">${sub(r)}</div></div><b class="rk-v">${r.v}${unit}</b></button>`).join('')}</div>
    ${rows.length < 2 ? '<div class="sec-f">El ranking se pone interesante con colegas: añádelos en «Miembros».</div>' : ''}`;
}
function membersHTML(people) {
  const fr = penaCache.fr || [];
  const st = LS.get('pena.state', {}), names = LS.get('pena.names', {});
  const pend = fr.filter((x) => !x.ok);
  const mem = people.filter((p) => !p.yo);
  return `<div class="search pena-search">${ic('search', 'sm')}<input id="pn-q" type="search" placeholder="Buscar colegas por usuario" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
    <div id="pn-res"></div>
    <div class="sec-h">En tu peña<span class="more" style="text-transform:none">${mem.length}</span></div>
    ${mem.length ? `<div class="group">${mem.map((p) => { const last = [...p.catches].sort((a, b) => b.t.localeCompare(a.t))[0]; const rk = rankOf(p.catches); return `<button class="cell" data-fp="${p.uid}">${avatarHTML(p.p || {}, p.uid, 'sm')}<div class="grow"><div class="t ell">@${esc(p.name)} <small class="rk-lv">${esc(rk.name)}</small></div><div class="s ell">${last ? `${esc((fishById(last.sp) || {}).nombre || '')} · ${agoCatch(last.t)}` : 'Sin capturas todavía'}</div></div>${chev}</button>`; }).join('')}</div>` : '<div class="sec-f">Busca a tus colegas por su usuario o mándales «Invitar».</div>'}
    ${pend.length ? `<div class="sec-h">Solicitudes enviadas</div><div class="group">${pend.map((x) => `<div class="cell">${avatarHTML({ name: names[x.uid] || '?' }, x.uid, 'sm')}<div class="grow"><div class="t">@${esc(names[x.uid] || 'pescador')}</div><div class="s">${st[x.uid] === 'pend' || !x.code ? 'Esperando respuesta' : 'Pendiente'}</div></div><button class="btn small gray" data-cancel="${x.uid}">Cancelar</button></div>`).join('')}</div>` : ''}
    <div id="pn-sug"></div>
    <div class="sec-h">Cuenta</div>
    <div class="group icons">
      <button class="cell" data-pn="push"><span class="ibox" style="background:var(--red)">${ic('bell')}</span><span class="t grow">Avisos en el móvil</span><span class="v">${'Notification' in window && Notification.permission === 'granted' ? 'Activados' : 'No'}</span>${chev}</button>
      <button class="cell" data-pn="pass"><span class="ibox" style="background:var(--indigo)">${ic('edit')}</span><span class="t grow">Cambiar contraseña</span>${chev}</button>
      <button class="cell" data-pn="logout"><span class="ibox" style="background:var(--gray, #8E8E93)">${ic('x')}</span><span class="t grow" style="color:var(--red)">Cerrar sesión</span></button>
    </div>`;
}
async function renderPena(box, soft) {
  if (!box) return;
  if (!window.Pena || !Pena.enabled) {
    box.innerHTML = `<div class="callout b">${gl('signal', 'md')}<div><b>Peña online sin activar.</b> En esta versión la peña solo funciona en este móvil. Mira el ranking local en «Stats».</div></div>`;
    return;
  }
  if (!Pena.loggedIn) {
    box.innerHTML = `<div class="pena-hero"><div class="ph-art">${['medal1', 'fish', 'trophy'].map((g) => `<span>${gl(g)}</span>`).join('')}</div><div class="ph-t">Pesca con tu peña</div><div class="ph-s">Crea tu cuenta, busca a tus colegas por su usuario y compartid capturas, récords y ranking. Te avisamos cuando alguien quiera unirse.</div>
      <button class="btn" data-auth="register">Crear cuenta</button><button class="btn gray" data-auth="login" style="margin-top:10px">Ya tengo cuenta</button></div>`;
    box.onclick = (e) => { const b = e.target.closest('[data-auth]'); if (b) openAuth(b.dataset.auth, () => renderPena(box)); };
    return;
  }
  const seg = state.penaSeg || 'feed';
  // Con datos de hace menos de 2 minutos se pinta al momento; si no, esqueleto y a por ellos
  if (!penaCache.fr || Date.now() - penaCache.t > 120e3) {
    if (!penaCache.fr) box.innerHTML = `<div class="pcard sk"><span class="skel" style="width:56px;height:56px;border-radius:50%"></span><div style="flex:1"><span class="skel" style="width:50%;height:16px"></span><span class="skel" style="width:70%;height:11px;margin-top:8px"></span></div></div><div class="group" style="margin-top:16px">${'<div class="cell"><span class="skel" style="width:32px;height:32px;border-radius:50%"></span><div class="grow"><span class="skel" style="width:55%;height:12px"></span><span class="skel" style="width:35%;height:10px;margin-top:6px"></span></div></div>'.repeat(4)}</div>`;
    try { await Pena.ensure(); penaCache.inc = await Pena.incoming(); await pollFriends(true); paintBell(); } catch (e) {
      if (e.code === 'noauth') { renderPena(box); return; }
      if (!penaCache.fr) {
        box.innerHTML = `<div class="empty"><div class="big">${gl('signal')}</div><b>Sin conexión con la peña</b>${esc(e.message || '')}</div><div class="btn-row"><button class="btn gray" data-pn="reload">${ic('refresh', 'sm')} Reintentar</button></div>`;
        box.onclick = (ev) => { if (ev.target.closest('[data-pn="reload"]')) { penaCache.t = 0; renderPena(box); } };
        return;
      }
    }
    if (!box.isConnected) return;
  }
  const people = penaPeople();
  const inc = penaCache.inc;
  const mineCl = myPublicCatches();
  const rk = rankOf(mineCl);
  const L = lookOf(PROFILE);
  const segs = [['feed', 'Actividad'], ['rank', 'Ranking'], ['members', 'Miembros']];
  const si = segs.findIndex(([k]) => k === seg);
  const body = seg === 'rank' ? rankHTML(people) : seg === 'members' ? membersHTML(people) : feedHTML(people);
  const yScroll = $('#v-diario').scrollTop;
  box.innerHTML = `
    <div class="pcard" style="--acc:${esc(L.accent)}"><div class="pc-cv">${coverHTML(L)}</div>
      <button class="pc-me" data-pn="me"><span class="pf-ring fr-${frameOK(L.frame, rk.lvl) ? L.frame : 'arco'}">${avatarHTML(PROFILE.avatar || PROFILE.name ? PROFILE : { name: Pena.username }, Pena.uid, 'big')}</span><span class="pc-who"><b class="ell">@${esc(Pena.username)}</b><span>Nivel ${rk.lvl} · ${esc(rk.name)}</span></span></button>
      <div class="pc-stats"><div><b>${people.length - 1}</b><span>${people.length === 2 ? 'colega' : 'colegas'}</span></div><div><b>${people.reduce((a, p) => a + p.catches.reduce((x, c) => x + (c.n || 1), 0), 0)}</b><span>piezas</span></div><div><b>${new Set(people.flatMap((p) => p.catches.map((c) => c.sp))).size}</b><span>especies</span></div></div>
      <div class="pc-acts"><button class="btn small" data-pn="share">${ic('share', 'sm')} Invitar</button><button class="btn small gray bell-btn" data-pn="inbox">${ic('bell', 'sm')} Avisos<b class="bell-b" ${unread() ? '' : 'hidden'}>${unread()}</b></button></div></div>
    ${pushOff() && !LS.get('push.later', 0) ? `<div class="push-cta"><span class="pc-ic">${ic('bell')}</span><div class="grow"><b>Que no se te escape nada</b><span>Activa los avisos y te enteras al momento de cada solicitud.</span></div><button class="btn small" data-pn="push">Activar</button><button class="nbtn" data-pn="later" aria-label="Ahora no">${ic('x', 'sm')}</button></div>` : ''}
    ${inc.length ? `<div class="sec-h">Quieren unirse<span class="more" style="text-transform:none">${inc.length}</span></div><div class="group req-list">${inc.map((r) => `<div class="cell"><span class="avatar" style="--h:${hue(r.from)}">${esc((r.fromName || '?').charAt(0).toUpperCase())}</span><div class="grow"><div class="t">@${esc(r.fromName || 'pescador')}</div><div class="s">${r.t ? ago(r.t) : 'Solicitud'} · quiere unirse a tu peña</div></div><button class="btn small" data-acc="${r.from}" data-n="${esc(r.fromName || '')}">Aceptar</button><button class="nbtn" data-rej="${r.from}" aria-label="Rechazar">${ic('x', 'sm')}</button></div>`).join('')}</div>` : ''}
    <div class="seg" id="pseg"><span class="thumb" style="width:calc((100% - 4px)/3);transform:translateX(${si * 100}%)"></span>${segs.map(([k, t]) => `<button class="${k === seg ? 'on' : ''}" data-pseg="${k}">${t}</button>`).join('')}</div>
    <div class="pena-body">${body}</div>`;
  box.dataset.pn = '1';
  if (soft) $('#v-diario').scrollTop = yScroll;
  fillPhotos(box);
  if (seg === 'members') bindMembers(box);
  box.onclick = async (e) => {
    const fp = e.target.closest('[data-fp]');
    if (fp) { const p = people.find((y) => y.uid === fp.dataset.fp); if (p && p.yo) openProfile(); else if (p) openProfile({ ...p.p, uid: p.uid, username: p.name, catches: p.catches }); return; }
    const fi = e.target.closest('[data-fish]');
    if (fi) { openFishSheet(fi.dataset.fish); return; }
    const b = e.target.closest('[data-pn],[data-acc],[data-rej],[data-add],[data-pseg],[data-rkp],[data-rkm],[data-cancel]');
    if (!b) return;
    try {
      if (b.dataset.pseg) { state.penaSeg = b.dataset.pseg; haptic(); renderPena(box, true); return; }
      if (b.dataset.rkp) { state.rkP = b.dataset.rkp; haptic(); renderPena(box, true); return; }
      if (b.dataset.rkm) { state.rkM = b.dataset.rkm; haptic(); renderPena(box, true); return; }
      if (b.dataset.add) {
        b.disabled = true;
        const okAdd = await addFriendFlow(b.dataset.add);
        if (okAdd) { b.outerHTML = `<span class="tag b sug-ok">${ic('check', 'xs')} Enviada</span>`; penaCache.t = 0; } else b.disabled = false;
        return;
      }
      if (b.dataset.cancel) { if (!confirm('¿Cancelar la solicitud?')) return; await Pena.remove(b.dataset.cancel); const st = LS.get('pena.state', {}); delete st[b.dataset.cancel]; LS.set('pena.state', st); penaCache.fr = (penaCache.fr || []).filter((x) => x.uid !== b.dataset.cancel); toast('Solicitud cancelada'); renderPena(box, true); return; }
      if (b.dataset.acc) { b.disabled = true; await Pena.accept(b.dataset.acc); dropReq(b.dataset.acc); toast(`@${b.dataset.n || 'Tu colega'} ya está en tu peña`); penaCache.t = 0; renderPena(box, true); return; }
      if (b.dataset.rej) { await Pena.reject(b.dataset.rej); dropReq(b.dataset.rej); renderPena(box, true); return; }
      const k = b.dataset.pn;
      if (k === 'share') share(`Únete a mi peña en TPTV, la app de pesca del Estrecho. Búscame como @${Pena.username}\n${inviteLink(Pena.username)}`);
      if (k === 'inbox') openInbox();
      if (k === 'me') openProfile();
      if (k === 'push') { if (await enablePush()) renderPena(box, true); }
      if (k === 'later') { LS.set('push.later', Date.now()); b.closest('.push-cta').remove(); }
      if (k === 'reload') { penaCache.t = 0; renderPena(box); }
      if (k === 'pass') openPassword();
      if (k === 'logout') { if (confirm('¿Cerrar sesión? Tus capturas siguen en este móvil.')) { Pena.logout(); penaCache.fr = null; penaCache.inc = []; inbox = []; saveInbox(); swSync(); $$('.hoy-acts').forEach((a) => { a.outerHTML = topActs(); }); renderPena(box); toast('Sesión cerrada'); } }
    } catch (er) { toast(er.message || 'Error', 'warn'); }
  };
}
function bindMembers(box) {
  // Perfiles recomendados (amigos de tus amigos primero), con esqueleto mientras llegan
  const sugBox = $('#pn-sug', box);
  const fr = penaCache.fr || [];
  const skSug = '<div class="sug sk"><span class="skel" style="width:56px;height:56px;border-radius:50%"></span><span class="skel" style="width:74%;height:12px"></span><span class="skel" style="width:54%;height:10px"></span><span class="skel" style="width:86%;height:32px;border-radius:16px;margin-top:4px"></span></div>';
  sugBox.innerHTML = `<div class="sec-h">Quizá los conozcas</div><div class="sug-row">${skSug.repeat(3)}</div>`;
  Pena.suggest(fr, penaCache.inc.map((r) => r.from)).then((l) => {
    if (!sugBox.isConnected) return;
    sugBox.innerHTML = l.length ? `<div class="sec-h">Quizá los conozcas<span class="more" style="text-transform:none">${l.length} perfiles</span></div><div class="sug-row">${l.map((x, k) => `<div class="sug" style="animation-delay:${k * 0.05}s">${avatarHTML({ name: x.u }, x.uid, 'sgav')}<div class="sug-u ell">@${esc(x.u)}</div><div class="sug-v ell">${x.via.length ? (x.via.length === 1 ? `Amigo de @${esc(x.via[0])}` : `${x.via.length} amigos en común`) : 'Pescador de TPTV'}</div><button class="btn small" data-add="${esc(x.u)}">${ic('plus', 'sm')} Añadir</button></div>`).join('')}</div>` : '';
  }).catch(() => { sugBox.innerHTML = ''; });
  const q = $('#pn-q', box), res = $('#pn-res', box);
  q.addEventListener('input', debounce(async () => {
    const v = q.value.trim();
    if (Pena.normUser(v).length < 2) { res.innerHTML = ''; return; }
    res.innerHTML = '<div class="sec-f">Buscando…</div>';
    try {
      const list = await Pena.search(v);
      const st = LS.get('pena.state', {});
      const incF = new Set(penaCache.inc.map((r) => r.from));
      res.innerHTML = list.length ? `<div class="group" style="margin-top:8px">${list.map((x) => { const s = st[x.uid] === 'ok' ? 'ok' : incF.has(x.uid) ? 'in' : x.state; return `<div class="cell"><span class="avatar" style="--h:${hue(x.uid)}">${esc(x.u.charAt(0).toUpperCase())}</span><div class="grow"><div class="t">@${esc(x.u)}</div>${s === 'in' ? '<div class="s">Te ha mandado una solicitud</div>' : ''}</div>${s === 'ok' ? `<span class="tag g">${ic('check', 'xs')} En tu peña</span>` : s === 'in' ? `<button class="btn small" data-acc="${x.uid}" data-n="${esc(x.u)}">Aceptar</button>` : s === 'sent' ? '<span class="tag">Enviada</span>' : `<button class="btn small" data-add="${esc(x.u)}">Añadir</button>`}</div>`; }).join('')}</div>` : '<div class="sec-f">Nadie con ese usuario.</div>';
    } catch (e) { res.innerHTML = `<div class="sec-f">${esc(e.message)}</div>`; }
  }, 300));
}
function openPassword() {
  openSheet({
    title: 'Contraseña',
    body: `<div class="stitle">Cambiar contraseña</div><div class="ssub">Para @${esc(Pena.username)}.</div>
      <div class="group form"><label class="cell"><span class="t">Nueva</span><input id="np1" type="password" autocomplete="new-password" placeholder="Mínimo 6"></label><label class="cell"><span class="t">Repítela</span><input id="np2" type="password" autocomplete="new-password" placeholder="Otra vez"></label></div>
      <div class="sec-f" id="np-err" style="color:var(--red)"></div>
      <div style="padding:16px 16px 0"><button class="btn" id="np-go">Guardar</button></div>`,
    onOpen: (el) => {
      $('#np-go', el).onclick = async () => {
        try { await Pena.changePassword($('#np1', el).value, $('#np2', el).value); closeSheet(); toast('Contraseña cambiada'); } catch (e) { $('#np-err', el).textContent = e.message; }
      };
    },
  });
}/* ---------------- Perfil y expositor ---------------- */
/* Personalización (inspirada en Strava, Discord, Steam y Xbox): portada animada o foto propia, color de acento,
   marco del avatar (algunos se ganan subiendo de nivel), título (sale de las insignias), hasta 3 insignias
   destacadas, técnicas y especie objetivo. Todo viaja a la peña dentro del campo «theme» como JSON
   (las reglas de Firestore ya lo permiten: no hace falta tocarlas). */
const COVERS = [
  { id: 'mar', n: 'Mar abierto', bg: 'linear-gradient(160deg,#3a9cf5 0%,#0b4f8f 55%,#062a4f 100%)' },
  { id: 'atardecer', n: 'Atardecer en el Estrecho', bg: 'linear-gradient(180deg,#2d1b55 0%,#8a3b7a 36%,#e9677a 58%,#ffb46a 73.6%,#2a2f63 74%,#141c45 100%)' },
  { id: 'noche', n: 'Noche de luna', bg: 'linear-gradient(180deg,#060b24 0%,#142257 59.6%,#0c1846 60%,#050b22 100%)' },
  { id: 'faro', n: 'Faro de Trafalgar', bg: 'linear-gradient(180deg,#1b2350 0%,#4b3b7a 42%,#d9787a 71.6%,#253058 72%,#121a3a 100%)' },
  { id: 'alba', n: 'Surfcasting al alba', bg: 'linear-gradient(180deg,#5e86d9 0%,#b9a6e0 38%,#ffc9a3 61.6%,#9fc6e6 62%,#5c8fbf 77.6%,#e8cf9f 78%,#c9a46a 100%)' },
  { id: 'levante', n: 'Levante', bg: 'linear-gradient(150deg,#46d6c0 0%,#139c96 45%,#0a4f5e 100%)' },
  { id: 'fondo', n: 'Fondo marino', bg: 'linear-gradient(180deg,#38b6e8 0%,#0f5fa8 42%,#082a5e 100%)' },
  { id: 'temporal', n: 'Temporal', bg: 'linear-gradient(180deg,#2b313d 0%,#4a5466 52%,#1d2633 100%)' },
  { id: 'dorada', n: 'Escamas de oro', bg: 'linear-gradient(135deg,#ffe9a0 0%,#f2b82a 45%,#a86c00 100%)' },
  { id: 'coral', n: 'Coral', bg: 'linear-gradient(160deg,#ff9a8b 0%,#ff4f7b 50%,#7a1747 100%)' },
];
const coverById = (id) => COVERS.find((x) => x.id === id) || COVERS[0];
const wavesD = (y, a, w = 1600) => { let d = `M0 ${y}`; for (let x = 0; x < w; x += 100) d += ` q25 ${-a} 50 0 t50 0`; return d + ' V200 H0Z'; };
const SCENES = {
  mar: () => `<circle cx="330" cy="26" r="70" fill="rgba(255,255,255,.14)"/><g class="cv-drift"><path d="${wavesD(132, 10)}" fill="rgba(255,255,255,.12)"/><path d="${wavesD(150, 8)}" fill="rgba(255,255,255,.12)"/></g>`,
  atardecer: () => `<circle class="cv-pulse" cx="262" cy="130" r="58" fill="rgba(255,214,140,.28)"/><circle cx="262" cy="130" r="30" fill="#ffd88a"/><path d="M226 134 L262 120 L300 108 L318 101 L338 110 L364 104 L400 115 V134Z" fill="#5b2c63" opacity=".85"/><path d="M14 134 L34 133 L48 104 L57 86 L68 79 L92 83 L122 96 L152 112 L178 126 L200 134Z" fill="#2a1638"/>${[0, 1, 2, 3, 4].map((k) => `<rect class="cv-shim" style="animation-delay:${k * 0.4}s" x="${240 - k * 5}" y="${140 + k * 7}" width="${44 + k * 10}" height="2.2" rx="1.1" fill="#ffd88a" opacity=".55"/>`).join('')}`,
  noche: () => `<circle cx="300" cy="48" r="38" fill="rgba(255,246,216,.12)"/><circle cx="300" cy="48" r="20" fill="#fff6d8"/><circle cx="293" cy="44" r="3.4" fill="#e9dfbd"/><circle cx="306" cy="54" r="2.4" fill="#e9dfbd"/>${[[40, 30], [80, 62], [120, 22], [160, 48], [200, 18], [236, 70], [360, 24], [378, 86], [24, 84], [140, 86], [260, 30], [340, 92]].map(([x, y], k) => `<circle class="cv-tw" style="animation-delay:${(k * 0.37) % 2.4}s" cx="${x}" cy="${y}" r="${1 + (k % 3) * 0.4}" fill="#fff"/>`).join('')}${[0, 1, 2, 3, 4, 5].map((k) => `<rect class="cv-shim" style="animation-delay:${k * 0.3}s" x="${292 - k * 3}" y="${114 + k * 10}" width="${16 + k * 6}" height="2" rx="1" fill="#fff6d8" opacity=".45"/>`).join('')}`,
  faro: () => `<path class="cv-beam" d="M328 74 L90 40 L90 112Z" fill="rgba(255,240,180,.2)"/><path d="M226 130 Q290 108 336 112 L400 104 V200 H210Z" fill="#141a33"/><path d="M322 112 L325 76 L333 76 L336 112Z" fill="#f2efe8"/><rect x="321" y="70" width="16" height="7" rx="2" fill="#2b2b3a"/><circle cx="329" cy="73" r="5" fill="#ffe9a8"/><circle class="cv-pulse" cx="329" cy="73" r="14" fill="rgba(255,233,168,.35)"/>`,
  alba: () => `<circle class="cv-rise" cx="110" cy="112" r="22" fill="#ffe2a6"/><circle cx="110" cy="112" r="40" fill="rgba(255,226,166,.25)"/><g stroke="#1f1f2a" stroke-width="2.4" stroke-linecap="round"><path d="M286 178 L298 150 L310 178M298 150 V182"/><path d="M296 168 L246 34" stroke-width="2"/><path d="M302 168 L348 30" stroke-width="2"/></g><path d="M246 34 Q190 70 150 113" stroke="rgba(255,255,255,.7)" stroke-width=".9" fill="none"/><path d="M348 30 Q260 80 190 113" stroke="rgba(255,255,255,.7)" stroke-width=".9" fill="none"/>`,
  levante: () => `${[[22, 90], [48, 130], [74, 70], [100, 110], [126, 150], [150, 80], [176, 120]].map(([y, w], k) => `<rect class="cv-streak" style="animation-delay:${(k * 0.53) % 3}s;animation-duration:${2.2 + (k % 3) * 0.5}s" x="0" y="${y}" width="${w}" height="2.4" rx="1.2" fill="rgba(255,255,255,.4)"/>`).join('')}<g class="cv-drift fast"><path d="${wavesD(150, 12)}" fill="rgba(255,255,255,.14)"/><path d="${wavesD(164, 8)}" fill="rgba(255,255,255,.12)"/></g>`,
  fondo: () => `<g class="cv-sway">${[60, 150, 250, 340].map((x) => `<path d="M${x} -10 L${x + 40} -10 L${x + 90} 200 L${x + 10} 200Z" fill="rgba(255,255,255,.07)"/>`).join('')}</g>${[[30, 1], [70, 1.3], [330, 1.1], [368, .9]].map(([x, s]) => `<path class="cv-weed" d="M${x} 200 C ${x - 14 * s} 160, ${x + 14 * s} 140, ${x - 4 * s} ${200 - 90 * s}" stroke="#1f8a5f" stroke-width="${5 * s}" fill="none" stroke-linecap="round" opacity=".85"/>`).join('')}${[[110, 0], [180, 1.2], [250, 2.1], [300, .6]].map(([x, d]) => `<circle class="cv-bub" style="animation-delay:${d}s" cx="${x}" cy="196" r="3.5" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.2"/>`).join('')}<g class="cv-swim"><path d="M0 80c8-8 20-9 28-2l6-5v15l-6-5c-8 7-20 6-28-3z" fill="rgba(0,20,50,.35)"/><path d="M40 100c6-6 15-7 21-1.5l4.5-4v11l-4.5-3.8c-6 5.3-15 4.5-21-1.7z" fill="rgba(0,20,50,.3)"/></g>`,
  temporal: () => `<rect class="cv-flash" x="0" y="0" width="400" height="200" fill="#fff"/><ellipse cx="90" cy="20" rx="140" ry="40" fill="rgba(18,22,30,.55)"/><ellipse cx="300" cy="10" rx="160" ry="44" fill="rgba(18,22,30,.6)"/><path class="cv-bolt" d="M258 30 L240 74 L256 74 L242 112 L276 62 L260 62 L272 30Z" fill="#fff6a0"/><g class="cv-rain" stroke="rgba(255,255,255,.28)" stroke-width="1.4">${Array.from({ length: 16 }, (_, k) => `<path d="M${k * 27} ${(k * 53) % 170} l-8 20"/>`).join('')}</g><g class="cv-drift fast"><path d="${wavesD(140, 18)}" fill="rgba(255,255,255,.12)"/><path d="${wavesD(158, 14)}" fill="rgba(10,14,20,.35)"/></g>`,
  dorada: () => `<g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.4">${Array.from({ length: 9 }, (_, r) => Array.from({ length: 15 }, (__, c) => `<path d="M${c * 30 + (r % 2) * 15 - 15} ${r * 22 + 10} a15 15 0 0 0 30 0"/>`).join('')).join('')}</g><rect class="cv-shine" x="-120" y="-40" width="80" height="300" fill="rgba(255,255,255,.28)" transform="rotate(20)"/>`,
  coral: () => `<g stroke="rgba(255,226,214,.55)" stroke-width="5" stroke-linecap="round" fill="none"><path d="M60 200 V150 M60 168 L40 140 M60 160 L82 128 M82 128 L92 112"/><path d="M330 200 V140 M330 160 L352 132 M330 150 L306 120 M352 132 L360 112"/></g>${[[120, 0], [200, 1], [270, 2]].map(([x, d]) => `<circle class="cv-bub" style="animation-delay:${d}s" cx="${x}" cy="196" r="4" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="1.2"/>`).join('')}`,
};
function coverHTML(L) {
  if (L.cover === 'foto' && L.coverImg) return `<div class="cv"><img class="cv-img" src="${esc(L.coverImg)}" alt=""></div>`;
  const c = coverById(L.cover);
  return `<div class="cv cv-${c.id}" style="background:${c.bg}"><svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${(SCENES[c.id] || SCENES.mar)()}</svg></div>`;
}
const ACCENTS = ['#0A84FF', '#30B0C7', '#34C759', '#FFB000', '#FF9500', '#FF375F', '#AF52DE', '#8E8E93'];
// Marcos del avatar: unos libres y otros se desbloquean con el nivel (rango)
const FRAMES = [
  { id: 'none', n: 'Sin marco', lvl: 1 }, { id: 'arco', n: 'Arcoíris', lvl: 1 }, { id: 'ola', n: 'Ola', lvl: 1 }, { id: 'coral', n: 'Coral', lvl: 1 },
  { id: 'neon', n: 'Neón', lvl: 2 }, { id: 'oro', n: 'Oro', lvl: 3 }, { id: 'escamas', n: 'Escamas', lvl: 4 }, { id: 'leyenda', n: 'Leyenda', lvl: 5 },
];
const TECNICAS = ['Surfcasting', 'Spinning', 'Rockfishing', 'Corcheo', 'Eging', 'LRF', 'Jigging', 'Fondo', 'Curricán'];
let PROFILE = Object.assign({ name: '', bio: '', avatar: '', theme: 'mar', fav: '', tec: '', showcase: [] }, LS.get('profile', {}));
// Perfiles antiguos: el tema pasa a ser la portada y la técnica, la primera de la lista
if (!PROFILE.cover) PROFILE.cover = coverById(PROFILE.theme).id;
if (!PROFILE.tecs) PROFILE.tecs = PROFILE.tec ? [PROFILE.tec] : [];
PROFILE = Object.assign({ coverImg: '', accent: ACCENTS[0], frame: 'arco', title: '', pins: [], target: '' }, PROFILE);
// Lo que se ve de un perfil (el mío o el de un colega, que llega empaquetado en «theme»)
function lookOf(p) {
  let L = {};
  if (typeof p.theme === 'string' && p.theme.charAt(0) === '{') { try { L = JSON.parse(p.theme); } catch (e) { L = {}; } } else if (p.theme) L.c = p.theme;
  return {
    cover: p.cover || L.c || 'mar', coverImg: p.coverImg || L.i || '', accent: p.accent || L.a || ACCENTS[0], frame: p.frame || L.f || 'arco',
    title: p.title != null && p.cover ? p.title : (L.t || ''), pins: (p.pins && p.cover ? p.pins : L.p) || [], target: p.target || L.g || '',
    tecs: p.tecs || (p.tec ? String(p.tec).split(/,\s*/).filter(Boolean) : []),
  };
}
const packLook = (p) => JSON.stringify({ v: 2, c: p.cover, i: p.cover === 'foto' ? p.coverImg : '', a: p.accent, f: p.frame, t: p.title, p: (p.pins || []).slice(0, 3), g: p.target });
const publicProfile = () => ({ ...PROFILE, name: PROFILE.name || S.yo, theme: packLook(PROFILE), tec: (PROFILE.tecs || []).join(', ') });
function saveProfile() {
  if (!LS.set('profile', PROFILE)) { toast('No cabe: quita alguna foto', 'warn'); return; }
  $$('.pf-mini').forEach((b) => { b.innerHTML = avatarHTML(PROFILE, window.Pena && Pena.uid, 'sm'); });
  syncPenaSoon();
}
// Imagen del móvil → dataURL comprimida (cuadrada para la foto de perfil)
async function imgToData(blob, max = 480, square = false, q = 0.72) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(blob); });
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
  const k = Math.min(1, max / Math.max(sw, sh));
  const cv = document.createElement('canvas');
  cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
  cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  URL.revokeObjectURL(img.src);
  return cv.toDataURL('image/jpeg', q);
}
const pickImage = () => new Promise((res) => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => res(inp.files[0] || null);
  inp.click();
});
const avatarHTML = (p, uid, cls = '') => p.avatar
  ? `<span class="pf-av ${cls}"><img src="${esc(p.avatar)}" alt=""></span>`
  : (p.name || p.username || '').trim() ? `<span class="pf-av ${cls}" style="--h:${hue(uid || p.username || p.name || 'x')}">${esc((p.name || p.username).trim().charAt(0).toUpperCase())}</span>`
  : `<span class="pf-av anon ${cls}"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4.2"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg></span>`;
function trophyHTML(t, i, own) {
  const f = fishById(t.sp) || { nombre: t.sp };
  const di = t.t ? dayInfo(t.t.slice(0, 10)) : null;
  return `<button class="trophy t${f.rareza || 1}" ${own ? `data-tr="${i}"` : 'disabled'} style="--tc:${typeColor(f)}">
    <div class="tr-art">${t.photo ? `<img src="${esc(t.photo)}" alt="">` : fotoURL(f, 330) ? `<img src="${fotoURL(f, 330)}" alt="" class="tr-stock"><span class="tr-badge">Foto de la especie</span>` : fishSVG(f)}</div>
    <div class="tr-plate"><div class="tr-n ell">${esc(f.nombre)}</div><div class="tr-m">${t.cm ? `${t.cm} cm` : ''}${t.g ? ` · ${t.g >= 1000 ? n1(t.g / 1000) + ' kg' : t.g + ' g'}` : ''}</div>${di ? `<div class="tr-d ell">${di.d} ${di.mes} ${di.y}${t.spot ? ' · ' + esc(spotById(t.spot).nombre) : ''}</div>` : ''}</div>
  </button>`;
}
// Rango por experiencia (piezas, especies y rareza) e insignias que se ganan pescando
const RANKS = [[0, 'Novato'], [10, 'Grumete'], [30, 'Marinero'], [70, 'Patrón'], [140, 'Capitán'], [250, 'Leyenda del Estrecho']];
function rankOf(cl) {
  const piezas = cl.reduce((a, c) => a + (c.n || 1), 0);
  const sp = [...new Set(cl.map((c) => c.sp))];
  const xp = piezas + sp.length * 5 + sp.reduce((a, id) => a + Math.max(0, ((fishById(id) || {}).rareza || 1) - 2) * 4, 0);
  let i = 0;
  RANKS.forEach(([min], k) => { if (xp >= min) i = k; });
  const cur = RANKS[i], nx = RANKS[i + 1];
  return { xp, lvl: i + 1, name: cur[1], next: nx && nx[1], p: nx ? (xp - cur[0]) / (nx[0] - cur[0]) : 1, left: nx ? nx[0] - xp : 0 };
}
// Insignias: se cuentan con las capturas (las mías o las públicas de un colega). Dibujo y fichas en badges.js
const BG = window.TPTV_BADGES;
const FAROS = ['faro-trafalgar', 'faro-punta-carnero', 'isla-tarifa'];
const DIPLO = ['sargo', 'sargo-picudo', 'sargo-breado', 'mojarra', 'raspallon'];
const TIBU = D.species.filter((f) => /raya|pintarroja|musola|cazon|tintorera/.test(f.id) && !f.prohibida).map((f) => f.id);
const SEASON = (m) => (m >= 3 && m <= 5 ? 0 : m >= 6 && m <= 8 ? 1 : m >= 9 && m <= 11 ? 2 : 3);
const badgeMemo = new Map();
function badgeValues(cl, friendsN = 0) {
  const key = cl.length + '|' + (cl[0] && cl[0].t) + '|' + (cl[cl.length - 1] && cl[cl.length - 1].t) + '|' + cl.reduce((a, c) => a + (c.cm || 0) + (c.n || 1), 0) + '|' + friendsN;
  if (badgeMemo.has(key)) return badgeMemo.get(key);
  const v = { piezas: 0, maxCm: 0, maxKg: 0, sueltas: 0, alba: 0, noche: 0, luna: 0, vivas: 0, levante: 0, fotos: 0, lub: 0, cef: 0, pel: 0, tib: 0, rare: 0 };
  const sp = new Set(), regs = new Set(), zonas = new Set(), spots = new Set(), diplo = new Set(), seasons = new Set(), faros = new Set(), days = new Set();
  for (const c of cl) {
    const n = c.n || 1, f = fishById(c.sp) || {};
    v.piezas += n; sp.add(c.sp);
    if ((c.cm || 0) > v.maxCm) v.maxCm = c.cm;
    if (c.g && c.g / 1000 > v.maxKg) v.maxKg = c.g / 1000;
    if (!c.keep) v.sueltas += n;
    if ((f.rareza || 0) > v.rare) v.rare = f.rareza;
    const t = String(c.t || '');
    const h = +t.slice(11, 13);
    if (h >= 5 && h < 8) v.alba += n;
    if (h >= 22 || h < 5) v.noche += n;
    if (t.length >= 16) {
      const ill = Astro.moonIllumination(fromLocal(t.slice(0, 16)));
      if (ill.fraction > 0.92) v.luna += n;
      if (Astro.tideKind(ill.phase) === 'vivas') v.vivas += n;
      seasons.add(SEASON(+t.slice(5, 7)));
      days.add(t.slice(0, 10));
    }
    const lv = c.cond && /Levante/.test(c.cond.viento || '') && (String(c.cond.viento).match(/(\d+) km/) || [])[1];
    if (lv && +lv >= 30) v.levante += n;
    if (c.spot && D.spots.some((s) => s.id === c.spot)) { const s = spotById(c.spot); regs.add(region(s)); zonas.add(s.mar); spots.add(s.id); if (FAROS.includes(s.id)) faros.add(s.id); }
    if (c.photo) v.fotos++;
    if (c.sp === 'lubina') v.lub += n;
    if (f.grupo === 'cefalopodos') v.cef += n;
    if (f.grupo === 'pelagicos') v.pel += n;
    if (TIBU.includes(c.sp)) v.tib += n;
    if (DIPLO.includes(c.sp)) diplo.add(c.sp);
  }
  // Días seguidos con capturas (la racha más larga)
  let streak = 0, run = 0, prev = null;
  [...days].sort().forEach((d) => { const t = Date.parse(d + 'T12:00:00Z'); run = prev != null && t - prev === 864e5 ? run + 1 : 1; prev = t; streak = Math.max(streak, run); });
  const out = {
    bautismo: v.piezas, incansable: v.piezas, coleccionista: sp.size, monstruo: v.maxCm, peso: Math.floor(v.maxKg * 10) / 10, raro: v.rare >= 4 ? 1 : 0, mito: v.rare >= 5 ? 1 : 0,
    lubinero: v.lub, sargos: diplo.size, eging: v.cef, velocista: v.pel, tiburonero: v.tib, madrugador: v.alba, lechuza: v.noche, luna: v.luna, vivas: v.vivas,
    levante: v.levante, racha: streak, estaciones: seasons.size, dosmares: regs.size, ruta: zonas.size, trotamar: spots.size, faros: faros.size,
    suelta: v.sueltas, fotografo: v.fotos, pena: friendsN,
  };
  if (badgeMemo.size > 30) badgeMemo.clear();
  badgeMemo.set(key, out);
  return out;
}
// Cada insignia con su nivel (0 = bloqueada), su valor y lo que falta para el siguiente
function badgesOf(cl, friendsN = 0) {
  const val = badgeValues(cl, friendsN);
  return BG.DEFS.map((b) => {
    const x = val[b.id] || 0;
    const t = b.g.filter((g) => x >= g).length;
    const next = b.g[t];
    return { b, v: x, t, max: b.g.length, next, p: next ? clamp(x / next, 0, 1) : 1 };
  });
}
const friendsAccepted = () => (LS.get('pena.ok', []) || []).length;
const badgeArt = (x, opts) => BG.art(x.b, x.t, opts);
const tierName = (x) => (!x.t ? 'Bloqueada' : x.max === 1 ? 'Conseguida' : BG.TIER[x.t]);
const fmtV = (b, v) => (b.u === 'kg' ? n1(v) : n0(v));
function countUp(root) {
  if ((matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim/.test(location.search))) return;
  $$('[data-cnt]', root).forEach((el) => {
    const to = parseFloat(el.dataset.cnt), t0 = performance.now();
    if (!isFinite(to) || !to) return;
    const tick = (now) => { const p = Math.min(1, Math.max(0, now - t0) / 1000); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}
const frameOK = (id, lvl) => { const f = FRAMES.find((x) => x.id === id); return !!f && lvl >= f.lvl; };
const pinMini = (x) => `<span class="pin-b" title="${esc(x.b.n)}">${badgeArt(x)}</span>`;
function profileHTML(p, { own, uid, username, catchesList, dexCount, friendsN = 0 }) {
  const cl = catchesList || [];
  const L = lookOf(p);
  const piezas = cl.reduce((a, c) => a + (c.n || 1), 0);
  const big = cl.reduce((a, c) => (c.cm > (a ? a.cm : 0) ? c : a), null);
  const dias = new Set(cl.map((c) => (c.t || '').slice(0, 10))).size;
  const show = p.showcase || [];
  const slots = own ? Math.min(6, show.length + 1) : show.length;
  const fav = p.fav && D.spots.some((s) => s.id === p.fav) ? spotById(p.fav) : null;
  const rk = rankOf(cl);
  const bd = badgesOf(cl, friendsN);
  const won = bd.filter((x) => x.t).length;
  const pins = (L.pins || []).map((id) => bd.find((x) => x.b.id === id && x.t)).filter(Boolean).slice(0, 3);
  const titleB = L.title ? bd.find((x) => x.b.id === L.title && x.t) : null;
  const frame = frameOK(L.frame, rk.lvl) ? L.frame : 'arco';
  const target = L.target ? fishById(L.target) : null;
  const top = (() => { const m = {}; cl.forEach((c) => { m[c.sp] = (m[c.sp] || 0) + (c.n || 1); }); const k = Object.keys(m).sort((a, b) => m[b] - m[a])[0]; return k ? fishById(k) : null; })();
  // Primero las ganadas (las de más nivel), luego las que están más cerca
  const shown = [...bd].sort((a, b) => (b.t > 0) - (a.t > 0) || b.t / b.max - a.t / a.max || b.p - a.p).slice(0, 8);
  const R = 25, C = 2 * Math.PI * R;
  const stat = (g, v, l, cnt) => `<div><span class="ps-ic">${gl(g)}</span><b ${cnt ? `data-cnt="${cnt}"` : ''}>${v}</b><span>${l}</span></div>`;
  return `<div class="pf" style="--acc:${esc(L.accent)}">
    <div class="pf-cover">${coverHTML(L)}<div class="pf-rank"><span>Nivel ${rk.lvl}</span>${esc(rk.name)}</div>${own && username ? `<button class="pf-share" data-pf="share" aria-label="Compartir perfil">${ic('share', 'sm')}</button>` : ''}</div>
    <div class="pf-head"><div class="pf-ring fr-${frame}">${avatarHTML(p, uid, 'xl')}<span class="pf-lvl">${rk.lvl}</span></div>${own ? `<button class="btn small pf-edit" data-pf="edit">${ic('edit', 'sm')} Editar perfil</button>` : ''}</div>
    <div class="pf-name"><span class="ell">${esc(p.name || username || 'Pescador')}</span>${pins.length ? `<span class="pf-pins">${pins.map(pinMini).join('')}</span>` : ''}</div>
    <div class="pf-user">${username ? `@${esc(username)}<i>·</i>` : ''}<span class="pf-title">${esc(titleB ? titleB.b.n : rk.name)}</span></div>
    ${p.bio ? `<div class="pf-bio">${esc(p.bio)}</div>` : own ? '<div class="pf-bio muted">Cuéntale algo a la peña en «Editar perfil».</div>' : ''}
    <div class="pf-chips">${fav ? `<span class="chip">${tipoIc(fav, 'xs')} ${esc(fav.nombre)}</span>` : ''}${L.tecs.map((t) => `<span class="chip">${ic('hook', 'xs')} ${esc(t)}</span>`).join('')}${target ? `<span class="chip acc">${gl('star', 'in')} Busca: ${esc(target.nombre)}</span>` : top ? `<span class="chip">${gl('fish', 'in')} Más pescado: ${esc(top.nombre)}</span>` : ''}</div>
    <div class="pf-stats4">${stat('fish', piezas, 'Piezas', piezas)}${stat('trophy', `${dexCount}<small>/${D.species.length}</small>`, 'Pecedex')}${stat('star', big ? `${big.cm}<small> cm</small>` : '—', 'Récord', 0)}${stat('cal', dias, 'Días', dias)}</div>
    <div class="pf-level"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="${R}" class="pl-bg"/><circle cx="30" cy="30" r="${R}" class="pl-fg" stroke-dasharray="${(C * Math.max(0.03, rk.p)).toFixed(1)} ${C.toFixed(1)}"/><text x="30" y="35.5">${rk.lvl}</text></svg>
      <div class="pl-t"><div class="pl-k">Rango</div><div class="pl-n">${esc(rk.name)}</div><div class="pl-s">${rk.next ? `${rk.left} XP para ${esc(rk.next)}` : 'Has llegado a lo más alto'}</div></div>
      <div class="pl-xp"><b data-cnt="${rk.xp}">${rk.xp}</b><span>XP</span></div></div>
    <button class="pf-shelf-h" data-pf="badges"><span>Insignias</span><small>${won} de ${bd.length} ${chev}</small></button>
    <div class="bgrid">${shown.map((x, k) => `<button class="bcell ${x.t ? 'on' : ''}" data-bd="${x.b.id}" style="animation-delay:${k * 0.035}s">${badgeArt(x)}<span class="bn">${esc(x.b.n)}</span><span class="bt">${x.t ? tierName(x) : `${fmtV(x.b, x.v)}/${fmtV(x.b, x.next)}`}</span></button>`).join('')}</div>
    <div class="pf-shelf-h static"><span>Expositor</span><small>${show.length}/6</small></div>
    <div class="pf-shelf">${Array.from({ length: Math.max(slots, own ? 1 : 0) }, (_, i) => show[i] ? trophyHTML(show[i], i, own) : `<button class="trophy add" data-pf="add">${ic('plus')}<span>Añadir trofeo</span></button>`).join('')}${!own && !show.length ? '<div class="sec-f" style="grid-column:1/-1">Aún no ha colgado trofeos.</div>' : ''}</div>
  </div>`;
}
function openProfile(other) {
  const own = !other;
  const p = own ? PROFILE : other;
  const cl = own ? catches.filter((c) => (c.who || S.yo) === S.yo) : (other.catches || []);
  const friendsN = own ? friendsAccepted() : (other.friends || []).length;
  const dexCount = new Set(cl.map((c) => c.sp)).size;
  const uname = own ? (window.Pena && Pena.loggedIn ? Pena.username : '') : (other.username || other.name);
  const uid = own ? (window.Pena && Pena.uid) : other.uid;
  openSheet({
    title: own ? 'Mi perfil' : '@' + (uname || ''),
    cls: 'sheet-pf',
    body: profileHTML(p, { own, uid, username: uname, catchesList: cl, dexCount, friendsN }) + (own ? `
      <div class="sec-h">Más</div><div class="group icons">
        ${window.Pena && Pena.loggedIn ? `<button class="cell" data-pf="pena"><span class="ibox" style="background:var(--tint)">${ic('users')}</span><span class="t grow">Mi peña</span>${chev}</button>` : ''}
        <button class="cell" data-pf="colegas"><span class="ibox" style="background:var(--orange)">${ic('users')}</span><span class="t grow">Colegas sin la app</span>${chev}</button>
        ${window.Pena && Pena.enabled && !Pena.loggedIn ? `<button class="cell" data-pf="login"><span class="ibox" style="background:var(--tint)">${ic('users')}</span><span class="t grow">Entrar o crear cuenta</span>${chev}</button>` : ''}
      </div>` : window.Pena && Pena.loggedIn && other.uid && (LS.get('pena.state', {})[other.uid] === 'ok') ? `<div class="group icons" style="margin-top:22px"><button class="cell" data-pf="unfriend"><span class="ibox" style="background:var(--red)">${ic('x')}</span><span class="t grow" style="color:var(--red)">Quitar de mi peña</span></button></div>` : ''),
    onOpen: (el) => {
      countUp(el);
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-pf],[data-tr],[data-bd]');
        if (!b) return;
        if (b.dataset.bd) { openBadge(b.dataset.bd, cl, { own, friendsN, refresh: () => refresh(el) }); return; }
        if (b.dataset.pf === 'badges') { openBadges(cl, { own, friendsN, name: own ? 'Mis insignias' : '@' + uname, refresh: () => refresh(el) }); return; }
        if (b.dataset.pf === 'unfriend') {
          if (!confirm(`¿Quitar a @${uname} de tu peña? Dejaréis de ver vuestras capturas.`)) return;
          try { await Pena.remove(other.uid); const st = LS.get('pena.state', {}); delete st[other.uid]; LS.set('pena.state', st); LS.set('pena.ok', (LS.get('pena.ok', []) || []).filter((u) => u !== other.uid)); penaCache.fr = (penaCache.fr || []).filter((x) => x.uid !== other.uid); closeSheet(); toast(`@${uname} ya no está en tu peña`); const box = $('#pena-box'); if (box) renderPena(box, true); } catch (er) { toast(er.message || 'Error', 'warn'); }
          return;
        }
        if (!own) return;
        if (b.dataset.pf === 'edit') openEditProfile(() => refresh(el));
        if (b.dataset.pf === 'add') openTrophyPicker(() => refresh(el));
        if (b.dataset.pf === 'colegas') openPena();
        if (b.dataset.pf === 'pena') { while (sheets.length) closeSheet(); state.diarioSeg = 'pena'; goTab('diario'); }
        if (b.dataset.pf === 'share') share(`Mi perfil de pescador en TPTV: búscame como @${Pena.username} y únete a mi peña.\n${inviteLink(Pena.username)}`);
        if (b.dataset.pf === 'login') { closeSheet(); openAuth('register'); }
        if (b.dataset.tr) openTrophyMenu(+b.dataset.tr, () => refresh(el));
      });
    },
  });
  function refresh(el) {
    const pf = $('.sbody .pf', el);
    const mine = catches.filter((c) => (c.who || S.yo) === S.yo);
    if (pf && own) { pf.outerHTML = profileHTML(PROFILE, { own: true, uid, username: uname, catchesList: mine, dexCount: new Set(mine.map((c) => c.sp)).size, friendsN }); countUp(el); }
  }
}
// Todas las insignias, por categorías, con su progreso
function openBadges(cl, { own, friendsN, name, refresh }) {
  const bd = badgesOf(cl, friendsN);
  const won = bd.filter((x) => x.t).length;
  const lv = bd.reduce((a, x) => a + x.t, 0), lvMax = bd.reduce((a, x) => a + x.max, 0);
  const cats = [...new Set(BG.DEFS.map((b) => b.cat))];
  const R = 34, C = 2 * Math.PI * R;
  openSheet({
    title: 'Insignias',
    body: `<div class="bsum"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="${R}" class="pl-bg"/><circle cx="40" cy="40" r="${R}" class="pl-fg" stroke-dasharray="${(C * won / bd.length).toFixed(1)} ${C.toFixed(1)}"/></svg><div class="bsum-n"><b>${won}</b><small>/${bd.length}</small></div>
        <div class="bsum-t"><div class="stitle" style="padding:0">${esc(name)}</div><div class="ssub" style="padding:2px 0 0">${lv} de ${lvMax} niveles · ${bd.filter((x) => x.t === x.max && x.max > 1).length} al máximo</div></div></div>
      ${cats.map((cat) => `<div class="sec-h">${esc(cat)}</div><div class="group blist">${bd.filter((x) => x.b.cat === cat).map((x) => `<button class="cell" data-bd="${x.b.id}"><span class="bl-art">${badgeArt(x)}</span><div class="grow"><div class="t">${esc(x.b.n)} <span class="btag t${x.max === 1 ? (x.t ? 3 : 0) : x.t}">${tierName(x)}</span></div><div class="s">${esc(x.b.d)}</div>${x.next ? `<div class="bprog"><i style="width:${(x.p * 100).toFixed(1)}%"></i></div><div class="bprog-t">${fmtV(x.b, x.v)} de ${fmtV(x.b, x.next)} ${esc(x.b.u)}</div>` : '<div class="bprog-t ok">Completada</div>'}</div></button>`).join('')}</div>`).join('')}
      <div class="sec-f">Bronce, plata, oro y leyenda: cada nivel pide más. Se cuentan con tus capturas del Diario.</div>`,
    onOpen: (el) => { el.addEventListener('click', (e) => { const b = e.target.closest('[data-bd]'); if (b) openBadge(b.dataset.bd, cl, { own, friendsN, refresh }); }); },
  });
}
// Ficha de una insignia: dibujo grande, escalera de niveles y, si es tuya, destacarla o usarla de título
function openBadge(id, cl, { own, friendsN, refresh }) {
  const x = badgesOf(cl, friendsN).find((y) => y.b.id === id);
  if (!x) return;
  const pinned = (PROFILE.pins || []).includes(id), titled = PROFILE.title === id;
  const ladder = x.max > 1 ? x.b.g.map((g, k) => `<div class="bl-step ${x.t > k ? 'on' : ''}"><span class="bl-dot m${k + 1}"></span><span class="grow">${BG.TIER[k + 1]}</span><b>${fmtV(x.b, g)} ${esc(x.b.u)}</b>${x.t > k ? `<span class="bl-ok">${ic('check', 'xs')}</span>` : ''}</div>`).join('') : '';
  openSheet({
    title: x.b.n,
    body: `<div class="bdet"><div class="bdet-art${x.t ? ' on' : ''}">${badgeArt(x, { big: true })}</div><div class="bdet-n">${esc(x.b.n)}</div><div class="bdet-t">${tierName(x)}</div><div class="bdet-d">${esc(x.b.d)}</div>
      ${x.next ? `<div class="bdet-p"><div class="bprog big"><i style="width:${(x.p * 100).toFixed(1)}%"></i></div><span>${fmtV(x.b, x.v)} de ${fmtV(x.b, x.next)} ${esc(x.b.u)}${x.t && x.max > 1 ? ` para ${BG.TIER[x.t + 1]}` : ''}</span></div>` : ''}</div>
      ${ladder ? `<div class="sec-h">Niveles</div><div class="group bladder">${ladder}</div>` : ''}
      ${own && x.t ? `<div class="group icons" style="margin-top:16px">
        <button class="cell" data-bo="pin"><span class="ibox" style="background:var(--orange)">${ic('star')}</span><span class="t grow">${pinned ? 'Quitar de destacadas' : 'Destacar en mi perfil'}</span>${pinned ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button>
        <button class="cell" data-bo="title"><span class="ibox" style="background:var(--indigo)">${ic('edit')}</span><span class="t grow">${titled ? 'Quitar como título' : 'Usar como título'}</span>${titled ? `<span style="color:var(--tint)">${ic('check')}</span>` : ''}</button></div>` : ''}`,
    onOpen: (el) => {
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-bo]');
        if (!b) return;
        if (b.dataset.bo === 'pin') {
          const p = (PROFILE.pins || []).filter((y) => y !== id);
          if (!pinned) { if (p.length >= 3) p.shift(); p.push(id); }
          PROFILE.pins = p;
          toast(pinned ? 'Quitada de destacadas' : 'Destacada en tu perfil', 'star');
        } else { PROFILE.title = titled ? '' : id; toast(titled ? 'Título quitado' : `Ahora eres «${x.b.n}»`, 'star'); }
        saveProfile(); closeSheet(); if (refresh) refresh();
      });
    },
  });
}
// Editar perfil con vista previa en directo (como Discord): cada cambio se ve arriba al momento
function openEditProfile(done) {
  const d = { ...PROFILE, pins: [...(PROFILE.pins || [])], tecs: [...(PROFILE.tecs || [])] };
  const mine = catches.filter((c) => (c.who || S.yo) === S.yo);
  const rk = rankOf(mine);
  const bd = badgesOf(mine, friendsAccepted());
  const earned = bd.filter((x) => x.t);
  const uid = window.Pena && Pena.uid;
  if (!frameOK(d.frame, rk.lvl)) d.frame = 'arco';
  const preview = () => {
    const tb = d.title ? earned.find((x) => x.b.id === d.title) : null;
    const pins = d.pins.map((id) => earned.find((x) => x.b.id === id)).filter(Boolean);
    return `<div class="ep-prev" style="--acc:${esc(d.accent)}"><div class="ep-cv">${coverHTML(d)}</div><div class="ep-row"><div class="pf-ring fr-${d.frame}">${avatarHTML(d, uid, 'big')}</div>
      <div class="ep-who"><b class="ell">${esc(d.name || S.yo || 'Tu nombre')}</b><span class="ell">${esc(tb ? tb.b.n : rk.name)}</span></div><div class="ep-pins">${pins.map(pinMini).join('')}</div></div></div>`;
  };
  const species = [...D.species].filter((f) => !f.prohibida).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  openSheet({
    title: 'Editar perfil',
    left: 'Cancelar',
    right: 'Guardar',
    cls: 'sheet-ep',
    body: `${preview()}
      <div class="ep-av"><button data-ep="photo">${avatarHTML(d, uid, 'xl')}<span class="ep-cam">${ic('camera', 'sm')}</span></button>${d.avatar ? '<button class="nbtn" data-ep="rmphoto" style="color:var(--red)">Quitar foto</button>' : ''}</div>
      <div class="group form">
        <label class="cell"><span class="t">Nombre</span><input id="ep-name" maxlength="24" placeholder="Cómo te llaman" value="${esc(d.name || S.yo || '')}"></label>
        <div class="cell" style="align-items:flex-start"><span class="t" style="padding-top:2px">Bio</span><textarea id="ep-bio" maxlength="140" placeholder="Pesquero de Getares, fan del surfcasting nocturno…" style="text-align:left;min-height:64px">${esc(d.bio || '')}</textarea></div>
      </div>
      <div class="sec-h">Portada</div>
      <div class="ep-covers">${COVERS.map((c) => `<button class="ep-cvb ${d.cover === c.id ? 'on' : ''}" data-cv="${c.id}"><span class="ep-cvt">${coverHTML({ cover: c.id })}</span><span class="ep-cvn">${esc(c.n)}</span></button>`).join('')}
        <button class="ep-cvb ${d.cover === 'foto' ? 'on' : ''}" data-cv="foto"><span class="ep-cvt">${d.coverImg ? coverHTML({ cover: 'foto', coverImg: d.coverImg }) : `<span class="ep-cvup">${ic('camera')}</span>`}</span><span class="ep-cvn">Tu foto</span></button></div>
      <div class="sec-h">Color</div>
      <div class="ep-accents">${ACCENTS.map((a) => `<button class="ep-acc ${d.accent === a ? 'on' : ''}" data-acc="${a}" style="--c:${a}" aria-label="Color"></button>`).join('')}</div>
      <div class="sec-h">Marco <span class="more" style="text-transform:none">Nivel ${rk.lvl} · ${esc(rk.name)}</span></div>
      <div class="ep-frames">${FRAMES.map((f) => { const ok = rk.lvl >= f.lvl; return `<button class="ep-fr ${d.frame === f.id ? 'on' : ''} ${ok ? '' : 'lock'}" data-fr="${f.id}" ${ok ? '' : `data-need="${f.lvl}"`}><span class="pf-ring fr-${f.id}">${avatarHTML(d, uid, 'big')}</span><span class="ep-frn">${ok ? esc(f.n) : `${ic('x', 'xs')} Nivel ${f.lvl}`}</span></button>`; }).join('')}</div>
      <div class="sec-h">Título</div>
      <div class="chips ep-titles" style="flex-wrap:wrap;overflow:visible"><button class="chip ${!d.title ? 'on' : ''}" data-ti="">${esc(rk.name)}</button>${earned.map((x) => `<button class="chip ${d.title === x.b.id ? 'on' : ''}" data-ti="${x.b.id}">${esc(x.b.n)}</button>`).join('')}</div>
      ${earned.length ? '' : '<div class="sec-f">Cada insignia que ganes te da un título nuevo.</div>'}
      <div class="sec-h">Insignias destacadas <span class="more" style="text-transform:none">hasta 3</span></div>
      ${earned.length ? `<div class="ep-pinsel">${earned.map((x) => `<button class="ep-pb ${d.pins.includes(x.b.id) ? 'on' : ''}" data-pin="${x.b.id}">${badgeArt(x)}<span>${esc(x.b.n)}</span><i>${ic('check', 'xs')}</i></button>`).join('')}</div>` : '<div class="sec-f">Aún no tienes insignias. La primera llega con tu primera captura.</div>'}
      <div class="sec-h">Tu pesca</div>
      <div class="group form">
        <label class="cell"><span class="t">Pesquero</span><select id="ep-fav"><option value="">—</option>${D.spots.map((s) => `<option value="${s.id}" ${s.id === d.fav ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
        <label class="cell"><span class="t">Especie objetivo</span><select id="ep-target"><option value="">—</option>${species.map((f) => `<option value="${f.id}" ${f.id === d.target ? 'selected' : ''}>${esc(f.nombre)}</option>`).join('')}</select></label>
      </div>
      <div class="sec-h">Técnicas <span class="more" style="text-transform:none">hasta 3</span></div>
      <div class="chips" style="flex-wrap:wrap;overflow:visible">${TECNICAS.map((t) => `<button class="chip ${d.tecs.includes(t) ? 'on' : ''}" data-tec="${t}">${t}</button>`).join('')}</div>`,
    onOpen: (el) => {
      const prev = () => { const p = $('.ep-prev', el); if (p) p.outerHTML = preview(); };
      $('[data-act="left"]', el).onclick = () => closeSheet();
      $('#ep-name', el).addEventListener('input', (e) => { d.name = e.target.value.trim(); prev(); });
      el.addEventListener('click', async (e) => {
        const t = e.target.closest('[data-cv],[data-acc],[data-fr],[data-ti],[data-pin],[data-tec],[data-ep]');
        if (!t) return;
        haptic();
        if (t.dataset.cv) {
          if (t.dataset.cv === 'foto' && (!d.coverImg || d.cover === 'foto')) {
            const file = await pickImage(); if (!file) return;
            try { d.coverImg = await imgToData(file, 820, false, 0.62); } catch (er) { toast('No se pudo leer la foto', 'warn'); return; }
            $('.ep-cvt', t).innerHTML = coverHTML({ cover: 'foto', coverImg: d.coverImg });
          }
          d.cover = t.dataset.cv;
          $$('.ep-cvb', el).forEach((x) => x.classList.toggle('on', x === t));
        }
        if (t.dataset.acc) { d.accent = t.dataset.acc; $$('.ep-acc', el).forEach((x) => x.classList.toggle('on', x === t)); }
        if (t.dataset.fr) {
          if (t.dataset.need) { toast(`Se desbloquea en el nivel ${t.dataset.need}`, 'info'); return; }
          d.frame = t.dataset.fr; $$('.ep-fr', el).forEach((x) => x.classList.toggle('on', x === t));
        }
        if (t.dataset.ti != null && t.matches('[data-ti]')) { d.title = t.dataset.ti; $$('[data-ti]', el).forEach((x) => x.classList.toggle('on', x === t)); }
        if (t.dataset.pin) {
          const id = t.dataset.pin;
          if (d.pins.includes(id)) d.pins = d.pins.filter((x) => x !== id);
          else { if (d.pins.length >= 3) { toast('Máximo 3: quita una antes', 'info'); return; } d.pins.push(id); }
          t.classList.toggle('on', d.pins.includes(id));
        }
        if (t.dataset.tec) {
          const v = t.dataset.tec;
          if (d.tecs.includes(v)) d.tecs = d.tecs.filter((x) => x !== v);
          else { if (d.tecs.length >= 3) { toast('Máximo 3 técnicas', 'info'); return; } d.tecs.push(v); }
          t.classList.toggle('on', d.tecs.includes(v));
        }
        if (t.dataset.ep === 'photo') { const file = await pickImage(); if (!file) return; try { d.avatar = await imgToData(file, 240, true, 0.8); $('.ep-av button', el).innerHTML = avatarHTML(d, '', 'xl') + `<span class="ep-cam">${ic('camera', 'sm')}</span>`; $$('.ep-fr .pf-ring', el).forEach((r) => { r.innerHTML = avatarHTML(d, uid, 'big'); }); } catch (er) { toast('No se pudo leer la foto', 'warn'); } }
        if (t.dataset.ep === 'rmphoto') { d.avatar = ''; $('.ep-av button', el).innerHTML = avatarHTML(d, uid, 'xl') + `<span class="ep-cam">${ic('camera', 'sm')}</span>`; t.remove(); }
        prev();
      });
      $('[data-act="right"]', el).onclick = () => {
        d.name = $('#ep-name', el).value.trim();
        d.bio = $('#ep-bio', el).value.trim().slice(0, 140);
        d.fav = $('#ep-fav', el).value; d.target = $('#ep-target', el).value;
        d.tec = d.tecs[0] || '';
        if (d.cover === 'foto' && !d.coverImg) d.cover = 'mar';
        if (d.cover !== 'foto') d.coverImg = d.coverImg || '';
        PROFILE = d; saveProfile();
        closeSheet(); toast('Perfil guardado');
        if (done) done();
      };
    },
  });
}
// Celebración cuando una captura te da una insignia o la sube de nivel
function badgeUpgrades() {
  const mine = catches.filter((c) => (c.who || S.yo) === S.yo);
  const bd = badgesOf(mine, friendsAccepted());
  const seen = LS.get('badges.seen', null);
  const now = Object.fromEntries(bd.map((x) => [x.b.id, x.t]));
  LS.set('badges.seen', now);
  if (!seen) return [];
  return bd.filter((x) => x.t > (seen[x.b.id] || 0));
}
function celebrateBadges() {
  const up = badgeUpgrades();
  if (!up.length) return;
  up.sort((a, b) => b.t - a.t);
  const x = up[0];
  const el = document.createElement('div');
  el.className = 'unlock bunlock';
  const colors = ['#FFD60A', '#0A84FF', '#34C759', '#FF375F', '#64D2FF', '#BF5AF2'];
  el.innerHTML = `<div class="rays"></div>${Array.from({ length: 30 }, (_, i) => `<i class="conf" style="--x:${(i * 37) % 100}vw;--d:${(i % 7) * 0.12}s;--r:${(i * 53) % 360}deg;background:${colors[i % colors.length]}"></i>`).join('')}
    <div class="unlock-card"><div class="u-kicker">${x.t > 1 ? '¡Subes de nivel!' : '¡Nueva insignia!'}</div><div class="bu-art">${badgeArt(x, { big: true })}</div><div class="u-name">${esc(x.b.n)}</div><div class="u-tier">${tierName(x)}</div><div class="u-prog">${esc(x.b.d)}${up.length > 1 ? `<br>Y ${up.length - 1} más` : ''}</div><button class="btn" data-u="b">Ver mis insignias</button></div>`;
  document.body.appendChild(el);
  haptic();
  void el.offsetHeight;
  el.classList.add('on');
  const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', (e) => {
    close();
    if (e.target.closest('[data-u]')) setTimeout(() => openBadges(catches.filter((c) => (c.who || S.yo) === S.yo), { own: true, friendsN: friendsAccepted(), name: 'Mis insignias' }), 300);
  });
}
function openTrophyPicker(done) {
  const mine = catches.filter((c) => (c.who || S.yo) === S.yo).sort((a, b) => (b.cm || 0) - (a.cm || 0));
  const used = new Set((PROFILE.showcase || []).map((x) => x.id));
  openSheet({
    title: 'Añadir trofeo',
    body: `<div class="stitle">Elige una captura</div><div class="ssub">Las más grandes, arriba. Puedes poner tu foto o la de la captura.</div>
      ${mine.length ? `<div class="group">${mine.map((c) => { const f = fishById(c.sp) || { nombre: c.sp }; const di = dayInfo(c.t.slice(0, 10)); return `<button class="cell" data-pick="${c.id}" ${used.has(c.id) ? 'disabled style="opacity:.45"' : ''}><span class="catch-photo" ${c.photo ? `data-photo="${c.id}"` : ''}>${fishSVG(f)}</span><div class="grow"><div class="t ell">${esc(f.nombre)}${c.cm ? ` · ${c.cm} cm` : ''}</div><div class="s ell">${di.d} ${di.mes} · ${esc(spotById(c.spot).nombre)}</div></div>${used.has(c.id) ? '<span class="tag">Ya está</span>' : chev}</button>`; }).join('')}</div>`
      : `<div class="empty"><div class="big">${gl('rod')}</div><b>Aún no tienes capturas</b>Apunta una en el Diario y cuélgala aquí.</div>`}`,
    onOpen: (el) => {
      fillPhotos(el);
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-pick]');
        if (!b || b.disabled) return;
        const c = catches.find((x) => x.id === b.dataset.pick);
        let photo = null;
        if (c.photo) { try { const blob = await idb.get(c.id); if (blob) photo = await imgToData(blob, 520, false, 0.7); } catch (er) { /* sin foto */ } }
        if (!photo && confirm('¿Quieres subir una foto para este trofeo?')) { const file = await pickImage(); if (file) photo = await imgToData(file, 520, false, 0.7); }
        PROFILE.showcase = [...(PROFILE.showcase || []), { id: c.id, sp: c.sp, cm: c.cm || 0, g: c.g || 0, t: c.t, spot: c.spot, photo: photo || '' }].slice(0, 6);
        saveProfile();
        closeSheet(); toast('Trofeo colgado', 'star');
        if (done) done();
      });
    },
  });
}
function openTrophyMenu(i, done) {
  const t = PROFILE.showcase[i];
  if (!t) return;
  const f = fishById(t.sp) || { nombre: t.sp };
  openSheet({
    title: f.nombre,
    body: `<div class="pf-shelf single">${trophyHTML(t, i, false)}</div>
      <div class="group icons" style="margin-top:16px">
        <button class="cell" data-tm="photo"><span class="ibox" style="background:var(--tint)">${ic('camera')}</span><span class="t grow">${t.photo ? 'Cambiar foto' : 'Subir foto'}</span>${chev}</button>
        ${i > 0 ? `<button class="cell" data-tm="first"><span class="ibox" style="background:var(--orange)">${ic('star')}</span><span class="t grow">Poner el primero</span>${chev}</button>` : ''}
        <button class="cell" data-tm="rm"><span class="ibox" style="background:var(--red)">${ic('trash')}</span><span class="t grow" style="color:var(--red)">Quitar del expositor</span></button>
      </div>`,
    onOpen: (el) => {
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-tm]');
        if (!b) return;
        if (b.dataset.tm === 'photo') { const file = await pickImage(); if (!file) return; t.photo = await imgToData(file, 520, false, 0.7); }
        if (b.dataset.tm === 'first') { PROFILE.showcase.splice(i, 1); PROFILE.showcase.unshift(t); }
        if (b.dataset.tm === 'rm') PROFILE.showcase.splice(i, 1);
        saveProfile(); closeSheet();
        if (done) done();
      });
    },
  });
}
const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
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
/* ---------------- CHECKLIST ----------------
   Varias listas (una por salida o un kit fijo). Las locales viven en el móvil; las compartidas, en Firebase
   (listas/{id}) y las ven y marcan todos sus miembros. Cada cosa sabe quién la ha marcado y quién la lleva. */
const KIT_TPL = {
  base: { n: 'Lo básico', items: { Papeles: ['Licencia de pesca', 'DNI', 'PescaREC en el móvil'], Pescado: ['Regla', 'Nevera con hielo', 'Bolsas'], 'Tú': ['Agua y comida', 'Botiquín', 'Batería del móvil', 'Bolsa de basura'] } },
  surf: { n: 'Surfcasting', items: { Equipo: ['Cañas de surf', 'Carretes cargados', 'Trípode o piquetas', 'Plomos de 100-150 g', 'Bajos y anzuelos', 'Luces o cascabeles'], Cebo: ['Gusana', 'Navaja o cangrejo', 'Hilo elástico'], 'Tú': ['Silla', 'Frontal'] } },
  spin: { n: 'Spinning', items: { Equipo: ['Caña de spinning', 'Carrete con trenzado', 'Bajo de fluorocarbono', 'Caja de señuelos', 'Grapas y emerillones', 'Alicates'], 'Tú': ['Gafas polarizadas', 'Mochila o riñonera'] } },
  rock: { n: 'Rockfishing', items: { Equipo: ['Caña ligera', 'Vinilos pequeños', 'Cabezas plomadas', 'Bajo de fluorocarbono'], Seguridad: ['Botas que agarren', 'Chaleco salvavidas', 'Mirar el oleaje antes'] } },
  eging: { n: 'Eging', items: { Equipo: ['Caña de eging', 'Poteras', 'Trenzado fino', 'Bajo de fluorocarbono', 'Salabre'], 'Tú': ['Frontal', 'Trapo (la tinta mancha)'] } },
  corcheo: { n: 'Corcheo', items: { Equipo: ['Caña larga', 'Boyas y plomillos', 'Anzuelos pequeños', 'Engodo'], Cebo: ['Gamba, pan o sardina'] } },
  noche: { n: 'De noche', items: { Luz: ['Frontal con pilas', 'Luces químicas', 'Linterna de repuesto'], 'Tú': ['Abrigo de más', 'Termo caliente'] } },
};
const KIT_CATS = ['Papeles', 'Equipo', 'Cebo', 'Seguridad', 'Luz', 'Pescado', 'Tú', 'Otros'];
const newId = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function itemsFrom(tpls) {
  const out = {}, seen = new Set();
  let o = 0;
  tpls.forEach((k) => Object.entries(KIT_TPL[k].items).forEach(([c, arr]) => arr.forEach((t) => {
    const key = norm(t);
    if (seen.has(key)) return;
    seen.add(key);
    out[newId() + (o++)] = { t, c, d: false, by: '', w: '', o };
  })));
  return out;
}
function kitLocal() {
  let L = LS.get('lists', null);
  if (!L) {
    // Primera vez: la checklist antigua pasa a ser «Mi kit»
    const old = LS.get('kit', null) || { done: [], extra: [] };
    const items = {};
    let o = 0;
    D.kit.forEach((g) => g.items.forEach((t) => { items[newId() + (o++)] = { t, c: g.grupo, d: old.done.includes(t), by: '', w: '', o }; }));
    (old.extra || []).forEach((t) => { items[newId() + (o++)] = { t, c: 'Otros', d: old.done.includes(t), by: '', w: '', o }; });
    L = [{ id: 'l' + Date.now().toString(36), title: 'Mi kit', items, spot: '', date: '', created: Date.now() }];
    LS.set('lists', L);
  }
  return L;
}
const saveLocal = (L) => LS.set('lists', L);
const kitStats = (l) => { const it = Object.values(l.items || {}); return { n: it.length, d: it.filter((x) => x.d).length }; };
function ringSVG(f, size = 44, c = 'var(--tint)') {
  const r = 18, C = 2 * Math.PI * r;
  return `<svg class="kring" viewBox="0 0 44 44" width="${size}" height="${size}"><circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--fill)" stroke-width="5"/><circle cx="22" cy="22" r="${r}" fill="none" stroke="${f >= 1 ? 'var(--green)' : c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(C * f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 22 22)" class="kring-a"/></svg>`;
}
const memberAvs = (l) => (l.members || []).slice(0, 5).map((u) => avatarHTML({ name: (l.names || {})[u] || '?' }, u, 'kav')).join('');
function listCard(l, k) {
  const s = kitStats(l), f = s.n ? s.d / s.n : 0;
  const di = l.date ? dayInfo(l.date) : null;
  const meta = [di ? (di.rel || `${di.wd} ${di.d} ${di.mes}`) : '', l.spot ? spotById(l.spot).nombre : ''].filter(Boolean).join(' · ');
  return `<button class="kcard ${f >= 1 ? 'done' : ''}" data-list="${l.id}" data-r="${l.remote ? 1 : ''}" style="animation-delay:${k * 0.04}s">
    <div class="kc-ring">${ringSVG(f)}<b>${s.n ? Math.round(f * 100) : 0}<small>%</small></b></div>
    <div class="kc-main"><div class="kc-t ell">${esc(l.title)}</div><div class="kc-s ell">${s.d} de ${s.n} listos${meta ? ' · ' + esc(meta) : ''}</div>
    ${l.remote ? `<div class="kc-m">${memberAvs(l)}<span>${(l.members || []).length} en la lista</span></div>` : '<div class="kc-m"><span class="tag">Solo en este móvil</span></div>'}</div>${chev}</button>`;
}
let kitPoll = null;
async function renderKit() {
  const v = $('#v-kit');
  const local = kitLocal();
  const cached = LS.get('lists.r', []);
  const logged = window.Pena && Pena.enabled && Pena.loggedIn;
  const draw = (remote, loading) => {
    const all = [...remote, ...local];
    $('#k-lists', v).innerHTML = (loading && !remote.length ? '<div class="kcard sk"><span class="skel" style="width:44px;height:44px;border-radius:50%"></span><div style="flex:1"><span class="skel" style="width:60%;height:14px"></span><span class="skel" style="width:40%;height:11px;margin-top:8px"></span></div></div>' : '')
      + all.map(listCard).join('') + `<button class="kcard add" data-k="new">${ic('plus')}<span>Nueva lista</span></button>`;
  };
  if (!v.dataset.built) {
    v.innerHTML = navbar('Checklist', `<button class="nbtn" data-k="new">${ic('plus', 'sm')} Nueva</button>`) + `
      <div id="k-hero"></div>
      <div class="sec-h">Empezar desde</div>
      <div class="chips ktpl">${Object.entries(KIT_TPL).filter(([k]) => k !== 'base').map(([k, x]) => `<button class="chip" data-ktpl="${k}">${ic(KIT_IC[k] || 'bag', 'xs')} ${x.n}</button>`).join('')}</div>
      <div class="sec-h">Tus listas</div>
      <div id="k-lists" class="klists"></div><div id="k-note"></div>`;
    v.dataset.built = '1';
    v.addEventListener('click', (e) => {
      if (e.target.closest('[data-k="new"]')) { openNewList(); return; }
      const tp = e.target.closest('[data-ktpl]');
      if (tp) { openNewList({ tpl: tp.dataset.ktpl }); return; }
      const pl = e.target.closest('[data-k="plan"]');
      if (pl) { openNewList({ date: pl.dataset.date }); return; }
      if (e.target.closest('[data-k="login"]')) { openAuth('register', () => renderKit()); return; }
      const c = e.target.closest('[data-list]');
      if (c) openList(c.dataset.list, !!c.dataset.r);
    });
  }
  // Próxima salida: el mejor rato de la semana en tu pesquero, para preparar la lista con su fecha
  const bd = state.ctx ? futureDays(state.ctx).filter((d) => d.best && d.best[0]).sort((a, b) => b.max - a.max)[0] : null;
  const ready = local.reduce((a, l) => a + kitStats(l).d, 0);
  $('#k-hero', v).innerHTML = tabHero({ cover: 'alba', kicker: 'Próxima salida', title: bd ? `${cap(dayName(bd.key))} · ${fmtHM(bd.best[0].from)}–${fmtHM(bd.best[0].to)}` : 'Que no falte nada', sub: bd ? `El mejor rato de la semana en ${esc(state.ctx.sp.nombre)}: ${n1(bd.max)} de 10` : 'Prepara la lista antes de salir y compártela con tu peña.', stats: [[local.length + (logged ? cached.length : 0), 'listas'], [ready, 'cosas listas']], cta: `<button class="th-btn" data-k="plan" data-date="${bd ? bd.key : ''}">Preparar la lista ${chev}</button>` });
  $('#k-note', v).innerHTML = logged ? '' : `<div class="callout b" style="margin-top:16px">${ic('users')}<div><b>Listas con tu peña.</b> Entra en tu cuenta para hacer listas compartidas: cada colega ve lo que falta y marca lo que lleva.<div style="margin-top:10px"><button class="btn small" data-k="login">Entrar o crear cuenta</button></div></div></div>`;
  draw(logged ? cached : [], logged);
  if (!logged) return;
  try {
    const r = await Pena.myLists();
    r.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    LS.set('lists.r', r);
    if (state.tab === 'kit') draw(r, false);
  } catch (e) { draw(cached, false); }
}
function kitSuggest(l) {
  const ctx = state.ctx;
  if (!ctx) return [];
  const d = (l.date && ctx.dayBy[l.date]) || ctx.dayBy[dayKey()];
  if (!d) return [];
  const have = new Set(Object.values(l.items || {}).map((x) => norm(x.t)));
  const out = [];
  const add = (t, c, why) => { if (!have.has(norm(t))) out.push({ t, c, why }); };
  if ((d.rain || 0) >= 40) add('Chubasquero', 'Tú', `${d.rain} % de lluvia`);
  if ((d.gmax || 0) >= 40) add('Plomos de más peso', 'Equipo', `rachas de ${n0(d.gmax)} km/h`);
  if ((d.tmin || 99) <= 12) add('Abrigo de más', 'Tú', `mínima de ${n0(d.tmin)}°`);
  if ((d.uv || 0) >= 6) add('Gorra y crema solar', 'Tú', `UV ${n0(d.uv)}`);
  const wv = ctx.M.wave_height ? dayAgg(ctx, ctx.M.wave_height, d.key) : null;
  if (wv != null && wv >= 1.5) add('Botas que agarren', 'Seguridad', `olas de ${n1(wv)} m`);
  if (Astro.tideKind(d.ill.phase) === 'vivas') add('Plomos de garra', 'Equipo', 'mareas vivas');
  return out.slice(0, 4);
}
function listSheetHTML(l) {
  const s = kitStats(l), f = s.n ? s.d / s.n : 0;
  const me = window.Pena && Pena.username;
  const owner = l.remote && window.Pena && l.owner === Pena.uid;
  const its = Object.entries(l.items || {}).sort((a, b) => (a[1].o || 0) - (b[1].o || 0));
  const cats = KIT_CATS.filter((c) => its.some(([, x]) => (x.c || 'Otros') === c)).concat([...new Set(its.map(([, x]) => x.c || 'Otros'))].filter((c) => !KIT_CATS.includes(c)));
  const sug = kitSuggest(l);
  const di = l.date ? dayInfo(l.date) : null;
  return `<div class="khero ${f >= 1 ? 'done' : ''}"><div class="kh-ring">${ringSVG(f, 92)}<b>${s.d}<small>/${s.n}</small></b></div>
      <div><div class="kh-t">${f >= 1 ? '¡Listos para salir!' : s.n - s.d === 1 ? 'Falta 1 cosa' : `Faltan ${s.n - s.d} cosas`}</div><div class="kh-s">${[di ? (di.rel || `${di.wd} ${di.d} ${di.mes}`) : '', l.spot ? spotById(l.spot).nombre : ''].filter(Boolean).map(esc).join(' · ') || 'Sin fecha'}</div></div></div>
    ${l.remote ? `<div class="kmembers">${(l.members || []).map((u) => `<span class="km">${avatarHTML({ name: (l.names || {})[u] || '?' }, u, 'kav')}<small>${u === (window.Pena && Pena.uid) ? 'Tú' : '@' + esc((l.names || {})[u] || '…')}</small></span>`).join('')}${owner ? `<button class="km add" data-kl="invite"><span class="pf-av kav">${ic('plus', 'sm')}</span><small>Invitar</small></button>` : ''}</div>`
      : (window.Pena && Pena.enabled ? `<button class="kshare" data-kl="share">${ic('users', 'sm')}<span><b>Hacerla con la peña</b><small>Elige colegas y la veis y marcáis todos</small></span>${chev}</button>` : '')}
    ${sug.length ? `<div class="sec-h">Para el parte de ${di ? (di.rel || di.wd).toLowerCase() : 'hoy'}</div><div class="ksug">${sug.map((x) => `<button class="chip" data-ksug="${esc(x.t)}" data-kc="${esc(x.c)}">${ic('plus', 'xs')} ${esc(x.t)} <small>${esc(x.why)}</small></button>`).join('')}</div>` : ''}
    ${cats.map((c) => `<div class="sec-h">${esc(c)}<span class="more" style="text-transform:none">${its.filter(([, x]) => (x.c || 'Otros') === c && x.d).length}/${its.filter(([, x]) => (x.c || 'Otros') === c).length}</span></div><div class="group">${its.filter(([, x]) => (x.c || 'Otros') === c).map(([id, x]) => `<div class="cell check-row krow ${x.d ? 'done' : ''}" data-ki="${id}"><span class="box">${x.d ? ic('check', 'xs') : ''}</span><span class="t grow">${esc(x.t)}${x.d && x.by && l.remote ? `<small class="kby">✓ @${esc(x.by)}</small>` : ''}</span>${l.remote ? `<button class="kwho ${x.w ? (x.w === me ? 'me' : 'other') : ''}" data-kw="${id}">${x.w ? (x.w === me ? 'Lo llevo yo' : '@' + esc(x.w)) : '¿Quién?'}</button>` : ''}<button class="kdel" data-kd="${id}" aria-label="Quitar">${ic('x', 'xs')}</button></div>`).join('')}</div>`).join('')}
    <div class="group form kadd"><div class="cell"><input id="k-new" placeholder="Añadir algo" maxlength="60"><select id="k-cat">${KIT_CATS.map((c) => `<option ${c === 'Otros' ? 'selected' : ''}>${c}</option>`).join('')}</select><button class="btn small" data-kl="add">Añadir</button></div></div>
    <div class="btn-row" style="margin-top:18px"><button class="btn gray" data-kl="reset">${ic('refresh', 'sm')} Desmarcar todo</button></div>
    <div class="btn-row" style="margin-top:10px"><button class="btn red" data-kl="del">${ic('trash', 'sm')} ${l.remote && !owner ? 'Salir de la lista' : 'Borrar lista'}</button></div>`;
}
function openList(id, remote) {
  const find = () => (remote ? LS.get('lists.r', []) : kitLocal()).find((x) => x.id === id);
  let l = find();
  if (!l) return;
  let editing = false;
  const persist = (itemId) => {
    if (remote) {
      const all = LS.get('lists.r', []).map((x) => (x.id === id ? l : x)); LS.set('lists.r', all);
      return Pena.setItem(id, itemId, l.items[itemId] || null).catch((e) => toast(e.message || 'No se pudo guardar', 'warn'));
    }
    saveLocal(kitLocal().map((x) => (x.id === id ? l : x)));
    return Promise.resolve();
  };
  const draw = (el) => {
    const sb = $('.sbody', el), st = sb.scrollTop;
    $('.klist', el).innerHTML = listSheetHTML(l);
    $('.klist', el).classList.toggle('editing', editing);
    sb.scrollTop = st;
  };
  openSheet({
    title: l.title,
    left: 'Editar',
    cls: 'sheet-kit',
    body: '<div class="klist"></div>',
    onClose: () => { clearInterval(kitPoll); if (state.tab === 'kit') renderKit(); },
    onOpen: (el) => {
      draw(el);
      $('[data-act="left"]', el).onclick = () => { editing = !editing; $('[data-act="left"]', el).textContent = editing ? 'Hecho' : 'Editar'; draw(el); };
      // Compartida: se actualiza sola mientras está abierta
      clearInterval(kitPoll);
      if (remote) {
        kitPoll = setInterval(async () => {
          if (document.visibilityState !== 'visible' || !el.isConnected) return;
          try { const r = await Pena.getList(id); if ((r.updated || 0) > (l.updated || 0)) { l = r; LS.set('lists.r', LS.get('lists.r', []).map((x) => (x.id === id ? l : x))); draw(el); } } catch (e) { /* sin red */ }
        }, 6000);
      }
      el.addEventListener('click', async (e) => {
        const w = e.target.closest('[data-kw]');
        if (w) { e.stopPropagation(); const it = l.items[w.dataset.kw]; it.w = it.w === Pena.username ? '' : Pena.username; l.updated = Date.now(); haptic(); draw(el); persist(w.dataset.kw); return; }
        const dl = e.target.closest('[data-kd]');
        if (dl) { e.stopPropagation(); delete l.items[dl.dataset.kd]; l.updated = Date.now(); draw(el); persist(dl.dataset.kd); return; }
        const r = e.target.closest('[data-ki]');
        if (r && !editing) {
          const it = l.items[r.dataset.ki];
          it.d = !it.d; it.by = it.d && window.Pena && Pena.username ? Pena.username : '';
          l.updated = Date.now(); haptic(); draw(el); persist(r.dataset.ki);
          const s = kitStats(l);
          if (it.d && s.d === s.n) toast('¡Todo listo! A pescar', 'check');
          return;
        }
        const sg = e.target.closest('[data-ksug]');
        if (sg) { const iid = newId(); l.items[iid] = { t: sg.dataset.ksug, c: sg.dataset.kc, d: false, by: '', w: '', o: Date.now() }; l.updated = Date.now(); draw(el); persist(iid); return; }
        const b = e.target.closest('[data-kl]');
        if (!b) return;
        const a = b.dataset.kl;
        if (a === 'add') {
          const inp = $('#k-new', el), t = inp.value.trim();
          if (!t) { inp.focus(); return; }
          const iid = newId(); l.items[iid] = { t, c: $('#k-cat', el).value, d: false, by: '', w: '', o: Date.now() };
          l.updated = Date.now(); draw(el); persist(iid); $('#k-new', el).focus(); return;
        }
        if (a === 'reset') {
          const ch = Object.keys(l.items).filter((k) => l.items[k].d);
          ch.forEach((k) => { l.items[k].d = false; l.items[k].by = ''; });
          l.updated = Date.now(); draw(el);
          if (remote) { for (const k of ch) await persist(k); } else persist();
          toast('Lista a cero'); return;
        }
        if (a === 'del') {
          const owner = !remote || l.owner === Pena.uid;
          if (!confirm(owner ? `¿Borrar «${l.title}»?${remote ? ' Desaparece para todos.' : ''}` : `¿Salir de «${l.title}»?`)) return;
          try {
            if (!remote) saveLocal(kitLocal().filter((x) => x.id !== id));
            else { if (owner) await Pena.deleteList(id); else await Pena.leaveList(l); LS.set('lists.r', LS.get('lists.r', []).filter((x) => x.id !== id)); }
            closeSheet();
          } catch (er) { toast(er.message || 'No se pudo', 'warn'); }
          return;
        }
        if (a === 'share') {
          if (!Pena.loggedIn) { openAuth('register', () => {}); return; }
          openFriendPicker([], async (sel) => {
            if (!sel.length) return;
            try {
              const r = await Pena.createList({ title: l.title, members: sel.map((x) => x.uid), names: Object.fromEntries(sel.map((x) => [x.uid, x.u])), items: l.items, spot: l.spot, date: l.date });
              saveLocal(kitLocal().filter((x) => x.id !== id));
              LS.set('lists.r', [r, ...LS.get('lists.r', [])]);
              closeSheet(); toast('Lista compartida con la peña');
              setTimeout(() => openList(r.id, true), 450);
            } catch (er) { toast(er.message || 'No se pudo compartir', 'warn'); }
          });
          return;
        }
        if (a === 'invite') {
          openFriendPicker(l.members || [], async (sel) => {
            const members = [...new Set([...(l.members || []), ...sel.map((x) => x.uid)])];
            const names = { ...(l.names || {}), ...Object.fromEntries(sel.map((x) => [x.uid, x.u])) };
            try { await Pena.setListMeta(id, { members, names }); l.members = members; l.names = names; draw(el); toast('Invitados'); } catch (er) { toast(er.message || 'No se pudo', 'warn'); }
          });
        }
      });
      $('#k-new', el)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('[data-kl="add"]', el).click(); });
    },
  });
}
// Elegir colegas de la peña (solo los que ya te han aceptado)
function openFriendPicker(already, done) {
  const sel = new Map();
  openSheet({
    title: 'Con quién',
    left: 'Cancelar',
    right: 'Listo',
    body: `<div class="ssub" style="padding-top:8px">Elige con quién compartes la lista. Solo salen los colegas que ya están en tu peña.</div><div id="fp-list"><div class="group">${'<div class="cell"><span class="skel" style="width:32px;height:32px;border-radius:50%"></span><span class="skel" style="width:50%;height:12px"></span></div>'.repeat(3)}</div></div>`,
    onOpen: async (el) => {
      $('[data-act="left"]', el).onclick = () => closeSheet();
      $('[data-act="right"]', el).onclick = () => { closeSheet(); done([...sel.values()]); };
      let fr = [];
      try { fr = (await Pena.friends()).filter((x) => x.ok); } catch (e) { $('#fp-list', el).innerHTML = `<div class="sec-f">${esc(e.message || 'Sin conexión')}</div>`; return; }
      $('#fp-list', el).innerHTML = fr.length ? `<div class="group">${fr.map((x) => { const inl = already.includes(x.uid); return `<button class="cell check-row ${inl ? 'done' : ''}" data-fu="${x.uid}" data-fn="${esc(x.username || x.name)}" ${inl ? 'disabled' : ''}>${avatarHTML(x, x.uid, 'sm')}<span class="t grow">@${esc(x.username || x.name)}</span><span class="box">${inl ? ic('check', 'xs') : ''}</span></button>`; }).join('')}</div>`
        : `<div class="empty"><div class="big">${gl('fish')}</div><b>Aún no tienes peña</b>Añade colegas en Diario → Peña y luego invítalos aquí.</div>`;
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fu]');
        if (!b || b.disabled) return;
        const on = !sel.has(b.dataset.fu);
        if (on) sel.set(b.dataset.fu, { uid: b.dataset.fu, u: b.dataset.fn }); else sel.delete(b.dataset.fu);
        b.classList.toggle('done', on); $('.box', b).innerHTML = on ? ic('check', 'xs') : ''; haptic();
      });
    },
  });
}
const KIT_IC = { surf: 'beach', spin: 'hook', rock: 'rock', eging: 'moon', corcheo: 'pier', noche: 'moon' };
function openNewList(pre = {}) {
  const st = { tpl: new Set(['base', ...(pre.tpl ? [pre.tpl] : [])]), date: pre.date || '', spot: S.spot, friends: [] };
  const days = state.ctx ? futureDays(state.ctx) : [];
  const logged = window.Pena && Pena.enabled && Pena.loggedIn;
  openSheet({
    title: 'Nueva lista',
    left: 'Cancelar',
    right: 'Crear',
    body: `<div class="group form" style="margin-top:8px"><label class="cell"><span class="t">Nombre</span><input id="nl-t" maxlength="40" placeholder="Sábado en Getares"></label></div>
      <div class="sec-h">Qué vas a hacer</div><div class="chips wrap" id="nl-tpl">${Object.entries(KIT_TPL).map(([k, x]) => `<button class="chip ${st.tpl.has(k) ? 'on' : ''}" data-tpl="${k}">${x.n}</button>`).join('')}</div>
      <div class="sec-f">Se rellena sola con lo típico de cada modalidad. Luego quitas o añades lo que quieras.</div>
      ${days.length ? `<div class="sec-h">Cuándo</div><div class="chips" id="nl-d"><button class="chip ${st.date ? '' : 'on'}" data-d="">Sin fecha</button>${days.map((d) => `<button class="chip ${st.date === d.key ? 'on' : ''}" data-d="${d.key}">${dayName(d.key)} ${dayInfo(d.key).d}</button>`).join('')}</div><div class="sec-f">Con fecha te sugiere lo que pide el parte de ese día.</div>` : ''}
      <div class="group form" style="margin-top:14px"><label class="cell"><span class="t">Pesquero</span><select id="nl-s"><option value="">—</option>${D.spots.map((s) => `<option value="${s.id}" ${s.id === st.spot ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label></div>
      <div class="sec-h">Con quién</div>
      ${logged ? `<button class="kshare" data-nl="friends">${ic('users', 'sm')}<span><b id="nl-fr">Solo yo</b><small>Elige colegas de tu peña para hacerla juntos</small></span>${chev}</button>` : `<div class="sec-f">Entra en tu cuenta (Diario → Peña) para hacer listas con tus colegas.</div>`}`,
    onOpen: (el) => {
      $('[data-act="left"]', el).onclick = () => closeSheet();
      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-tpl]');
        if (t) { const k = t.dataset.tpl; if (st.tpl.has(k)) st.tpl.delete(k); else st.tpl.add(k); t.classList.toggle('on'); haptic(); return; }
        const d = e.target.closest('[data-d]');
        if (d) { st.date = d.dataset.d; $$('[data-d]', el).forEach((x) => x.classList.toggle('on', x === d)); haptic(); return; }
        if (e.target.closest('[data-nl="friends"]')) openFriendPicker([], (sel) => { st.friends = sel; $('#nl-fr', el).textContent = sel.length ? sel.map((x) => '@' + x.u).join(', ') : 'Solo yo'; });
      });
      $('[data-act="right"]', el).onclick = async () => {
        const di = st.date ? dayInfo(st.date) : null;
        const title = $('#nl-t', el).value.trim() || (di ? `${cap(di.rel || di.wdl)}${$('#nl-s', el).value ? ' en ' + spotById($('#nl-s', el).value).nombre : ''}` : 'Mi lista');
        const items = itemsFrom(st.tpl.size ? [...st.tpl] : ['base']);
        const spot = $('#nl-s', el).value;
        const btn = $('[data-act="right"]', el);
        btn.disabled = true;
        try {
          if (st.friends.length) {
            const r = await Pena.createList({ title, members: st.friends.map((x) => x.uid), names: Object.fromEntries(st.friends.map((x) => [x.uid, x.u])), items, spot, date: st.date });
            LS.set('lists.r', [r, ...LS.get('lists.r', [])]);
            closeSheet(); renderKit(); setTimeout(() => openList(r.id, true), 450);
          } else {
            const l = { id: 'l' + Date.now().toString(36), title, items, spot, date: st.date, created: Date.now() };
            saveLocal([l, ...kitLocal()]);
            closeSheet(); renderKit(); setTimeout(() => openList(l.id, false), 450);
          }
        } catch (er) { btn.disabled = false; toast(er.message || 'No se pudo crear', 'warn'); }
      };
    },
  });
}
function openKit() { goTab('kit'); }
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
      <button class="cell" data-a="pena-on"><span class="ibox" style="background:var(--orange)">${ic('users')}</span><span class="t grow">Mi peña</span><span class="v">${window.Pena && Pena.loggedIn ? '@' + esc(Pena.username) : 'Sin cuenta'}</span>${chev}</button>
      <button class="cell" data-a="push"><span class="ibox" style="background:var(--red)">${ic('bell')}</span><span class="t grow">Avisos en el móvil</span><span class="v">${'Notification' in window && Notification.permission === 'granted' ? 'Activados' : 'Desactivados'}</span>${chev}</button>
      <button class="cell" data-a="pena"><span class="ibox" style="background:var(--brown)">${ic('users')}</span><span class="t grow">Colegas sin la app</span><span class="v">${S.colegas.length}</span>${chev}</button>
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
        if (k === 'pena-on') { while (sheets.length) closeSheet(); state.diarioSeg = 'pena'; goTab('diario'); }
        if (k === 'push') enablePush();
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
// El parte se refresca solo: al volver a la app y cada 10 minutos mientras está abierta
const AUTO = 10 * 60e3;
const autoRefresh = () => { if (document.visibilityState === 'visible' && state.ctx && Date.now() - state.ctx.t > AUTO) renderHoy(true); };
document.addEventListener('visibilitychange', autoRefresh);
setInterval(autoRefresh, 60e3);
// Entrada: el icono aparece con un pulso de sonar, debajo el nombre, y el icono se abre hacia la app.
// Breve (≈1,8 s), solo transform y opacidad, una vez por arranque, se salta con un toque. Mientras, el parte carga.
let introEnd = 0;
(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('noanim') || q.has('nointro') || sessionStorage.getItem('tptv.intro')) return;
  sessionStorage.setItem('tptv.intro', '1');
  const still = (matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]noanim/.test(location.search));
  const T = still ? 500 : 1650;
  introEnd = Date.now() + T + 550;
  const el = document.createElement('div');
  el.id = 'intro';
  el.className = 'v2' + (still ? ' still' : '');
  el.innerHTML = `<div class="i2-bg"></div><div class="i2-stage"><i class="i2-ring"></i><i class="i2-ring r2"></i><i class="i2-glow"></i><img class="i2-icon" src="icons/icon-512.png" alt=""></div><div class="i2-tag">Te pesco TV</div>`;
  document.body.appendChild(el);
  document.body.classList.add('intro-on');
  const end = () => {
    if (!el.isConnected || el.classList.contains('out')) return;
    el.classList.add('out');
    document.body.classList.remove('intro-on');
    document.body.classList.add('intro-reveal');
    setTimeout(() => { el.remove(); document.body.classList.remove('intro-reveal'); }, 650);
  };
  el.addEventListener('pointerdown', end);
  setTimeout(end, T);
})();renderHoy();
// Enlace de invitación: ?amigo=usuario. Si no hay sesión, primero entrar o crear cuenta
(() => {
  const amigo = new URLSearchParams(location.search).get('amigo');
  if (amigo || new URLSearchParams(location.search).has('avisos')) setTimeout(() => history.replaceState(null, '', location.pathname), 2600);
  if (!LS.get('badges.seen', null)) badgeUpgrades();
  if (!window.Pena || !Pena.enabled) { if (amigo) setTimeout(() => toast('La peña online no está activada', 'warn'), 1200); return; }
  const go = () => { if (confirm(`¿Añadir a @${Pena.normUser(amigo)} a tu peña?`)) addFriendFlow(amigo).then(() => { state.diarioSeg = 'pena'; goTab('diario'); }); };
  if (Pena.loggedIn) {
    paintBell();
    setTimeout(() => pollPena(true), 1500 + Math.max(0, introEnd - Date.now()));
    if (new URLSearchParams(location.search).has('avisos')) setTimeout(openInbox, 900 + Math.max(0, introEnd - Date.now()));
    if (amigo) setTimeout(go, 1000);
    return;
  }
  const skipped = Date.now() - (LS.get('auth.skip', 0) || 0) < 3 * 864e5;
  if (amigo || !skipped) setTimeout(() => openAuth(amigo ? 'register' : 'login', amigo ? go : null), 900 + Math.max(0, introEnd - Date.now()));
})();syncPenaSoon();// Para capturas de prueba: ?tab=peces&y=600&sheet=fish:dorada
(() => {
  const q = new URLSearchParams(location.search);
  if (q.has('noanim')) document.head.insertAdjacentHTML('beforeend', '<style>*{animation:none!important;transition:none!important}</style>');
  if (q.get('tab') && q.get('tab') !== 'hoy') goTab(q.get('tab'));
  const y = +q.get('y') || 0, sh = q.get('sheet');
  setTimeout(() => {
    if (y) $('#v-' + state.tab).scrollTop = y;
    if (sh) {
      const [k, id] = sh.split(':');
      ({ fish: openFishSheet, spot: openSpotSheet, day: openDaySheet, catch: () => openCatchForm(id ? { sp: id } : {}), plan: () => openPlan(), kit: openKit, normas: openNormas, ajustes: openSettings, perfil: () => openProfile(), editar: () => openEditProfile(), insignias: () => openBadges(catches, { own: true, friendsN: friendsAccepted(), name: 'Mis insignias' }), badge: (b) => openBadge(b, catches, { own: true, friendsN: friendsAccepted() }) })[k]?.(id || dayKey());
    }
  }, 2500);
})();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
window.TPTVdebug = { state, buildCtx, fishSVG, get inbox() { return inbox; }, penaCache, pollPena, openInbox, renderPena };
})();
