/* TPTV · Iconos de color propios (sustituyen a los emojis). Hechos a mano en SVG con la paleta de la app.
   Uso: gl('sun') devuelve <svg class="gl"><use href="#g-sun"/></svg>. */
(function () {
  const D = `
  <linearGradient id="gSun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE57F"/><stop offset="1" stop-color="#FFA41B"/></linearGradient>
  <linearGradient id="gCloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D3E0EE"/></linearGradient>
  <linearGradient id="gCloudD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C3CEDC"/><stop offset="1" stop-color="#7D8CA3"/></linearGradient>
  <linearGradient id="gMoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF8DE"/><stop offset="1" stop-color="#E6D29A"/></linearGradient>
  <linearGradient id="gDrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FDBFF"/><stop offset="1" stop-color="#1E7BFF"/></linearGradient>
  <linearGradient id="gBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FF9500"/></linearGradient>
  <linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ED6FF"/><stop offset="1" stop-color="#0A6FE0"/></linearGradient>
  <linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE98A"/><stop offset=".55" stop-color="#FFC21A"/><stop offset="1" stop-color="#E89400"/></linearGradient>
  <linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#A3AEBD"/></linearGradient>
  <linearGradient id="gBronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FAD2AE"/><stop offset="1" stop-color="#B86E36"/></linearGradient>
  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EF0B4"/><stop offset="1" stop-color="#18B35F"/></linearGradient>
  <linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8F85"/><stop offset="1" stop-color="#F0362B"/></linearGradient>
  <linearGradient id="gFish" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9EE3FF"/><stop offset="1" stop-color="#2A86E8"/></linearGradient>
  <linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2FBFF"/><stop offset="1" stop-color="#9FD8F2"/></linearGradient>
  <linearGradient id="gPurple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C8B6FF"/><stop offset="1" stop-color="#6C4CE0"/></linearGradient>`;
  const cloud = (f = 'url(#gCloud)', t = '') => `<path transform="${t}" d="M9.2 25h13.6a5.6 5.6 0 0 0 .7-11.15A7.6 7.6 0 0 0 9.6 15.2 4.9 4.9 0 0 0 9.2 25z" fill="${f}"/>`;
  const sun = (t = '', r = 6.2) => `<g transform="${t}">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="15" y="${16 - r - 5.2}" width="2" height="3.4" rx="1" fill="#FFC12E" transform="rotate(${a} 16 16)"/>`).join('')}<circle cx="16" cy="16" r="${r}" fill="url(#gSun)"/></g>`;
  const moon = (t = '') => `<path transform="${t}" d="M19.5 5.5a10.5 10.5 0 1 0 7 17.6A9 9 0 0 1 19.5 5.5z" fill="url(#gMoon)"/>`;
  const S = {
    sun: sun('', 6.6),
    moon: moon('') + '<circle cx="12" cy="19" r="1.4" fill="#E0CB8C" opacity=".7"/><circle cx="16" cy="24" r="1" fill="#E0CB8C" opacity=".7"/>',
    'sun-cloud': sun('translate(-4 -4) scale(.85)') + cloud('url(#gCloud)', 'translate(2 2)'),
    'moon-cloud': moon('translate(-3 -3) scale(.8)') + cloud('url(#gCloud)', 'translate(2 2)'),
    cloud: cloud('url(#gCloudD)', 'translate(-3 -4) scale(.95)') + cloud('url(#gCloud)', 'translate(2 1)'),
    rain: cloud('url(#gCloudD)', 'translate(0 -4)') + [9, 15, 21].map((x) => `<path d="M${x + 1.5} 23.5l-1.8 4.5" stroke="url(#gDrop)" stroke-width="2.4" stroke-linecap="round"/>`).join(''),
    drizzle: sun('translate(-5 -6) scale(.75)') + cloud('url(#gCloud)', 'translate(1 -3)') + [11, 18].map((x) => `<path d="M${x + 1.5} 24l-1.4 3.6" stroke="url(#gDrop)" stroke-width="2.4" stroke-linecap="round"/>`).join(''),
    storm: cloud('url(#gCloudD)', 'translate(0 -5)') + '<path d="M17.5 17l-5 7h4l-2 6 6.5-8.5h-4l2.2-4.5z" fill="url(#gBolt)"/>',
    fog: cloud('url(#gCloud)', 'translate(0 -5)') + [22, 26].map((y, i) => `<rect x="${6 + i * 3}" y="${y}" width="${20 - i * 3}" height="2.4" rx="1.2" fill="#C7D3E0"/>`).join(''),
    snow: cloud('url(#gCloud)', 'translate(0 -5)') + [10, 16, 22].map((x, i) => `<circle cx="${x}" cy="${25 + (i % 2) * 2}" r="1.6" fill="#BFE6FF"/>`).join(''),
    wind: '<path d="M4 12h14a3.6 3.6 0 1 0-3.6-3.6" stroke="#8FD3FF" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 18h19a3.8 3.8 0 1 1-3.8 3.8" stroke="#3E9BFF" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M4 24h8" stroke="#BFE6FF" stroke-width="2.6" stroke-linecap="round"/>',
    wave: '<path d="M3 20c3.5 0 4-3 7-3s3.5 3 7 3 3.5-3 7-3 3.5 3 5 3v7H3z" fill="url(#gSea)"/><path d="M4 15C6 7 15 4.5 20 9c-4-1-7 1.6-5.5 5.4" stroke="#7FDBFF" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
    tide: '<path d="M3 21c3.5 0 4-2.5 7-2.5s3.5 2.5 7 2.5 3.5-2.5 7-2.5 3.5 2.5 5 2.5v6H3z" fill="url(#gSea)"/><path d="M10 15V5M6.5 8.5 10 5l3.5 3.5" stroke="#34C759" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 5v10M17.5 11.5 21 15l3.5-3.5" stroke="#FF9F0A" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    sunrise: '<path d="M7 22a9 9 0 0 1 18 0z" fill="url(#gSun)"/><rect x="3" y="22" width="26" height="2.6" rx="1.3" fill="#FF9F0A"/><path d="M16 4v7M12.5 7.5 16 4l3.5 3.5" stroke="#FFB31A" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="7" y="27" width="18" height="2" rx="1" fill="#FFD27A"/>',
    temp: '<rect x="13" y="3" width="6" height="18" rx="3" fill="#EEF3F8"/><circle cx="16" cy="23.5" r="5.5" fill="url(#gRed)"/><rect x="14.6" y="10" width="2.8" height="13" rx="1.4" fill="url(#gRed)"/>',
    gauge: '<path d="M5 22a11 11 0 1 1 22 0" stroke="#D9E3EE" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M5 22a11 11 0 0 1 6.5-10" stroke="url(#gGreen)" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M16 22l5.5-7" stroke="#FF3B30" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="22" r="2.6" fill="#2C3A4E"/>',
    star: '<path d="M16 3.5l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L16 22.6l-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2z" fill="url(#gGold)" stroke="#E89400" stroke-width=".8" stroke-linejoin="round"/><path d="M12.5 11.5 16 5.5l2 4" stroke="#FFF6C9" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>',
    shield: '<path d="M16 3l10 4v8c0 6.5-4.3 11.3-10 14C10.3 26.3 6 21.5 6 15V7z" fill="url(#gGreen)"/><path d="M11 16l3.5 3.5L21.5 12" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    cal: '<rect x="4" y="6" width="24" height="22" rx="5" fill="#fff" stroke="#D9E1EA"/><path d="M4 11a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v1H4z" fill="url(#gRed)"/><rect x="9" y="3" width="2.6" height="6" rx="1.3" fill="#7D8CA3"/><rect x="20.4" y="3" width="2.6" height="6" rx="1.3" fill="#7D8CA3"/><rect x="9" y="16" width="4" height="4" rx="1" fill="#0A84FF"/><rect x="15" y="16" width="4" height="4" rx="1" fill="#C9D3DE"/><rect x="21" y="16" width="3" height="4" rx="1" fill="#C9D3DE"/>',
    plate: '<circle cx="17" cy="17" r="11" fill="#fff" stroke="#D9E1EA"/><circle cx="17" cy="17" r="7" fill="#F2F5F9"/><path d="M5 5v8M3 5v5a2 2 0 0 0 4 0V5M5 13v14" stroke="#8E9AAB" stroke-width="1.8" stroke-linecap="round"/>',
    home: '<path d="M5 15L16 5l11 10" stroke="#0A84FF" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14v12h16V14L16 7z" fill="url(#gGold)"/><rect x="13.5" y="18" width="5" height="8" rx="1.2" fill="#8A5A2B"/>',
    release: '<path d="M3 22c3.5 0 4-2.5 7-2.5s3.5 2.5 7 2.5 3.5-2.5 7-2.5 3.5 2.5 5 2.5v6H3z" fill="url(#gSea)"/><path d="M8 18c2-5 7-8 12-6l4-3-1 5 2 4-4.5-1.5C17 19 11 20 8 18z" fill="url(#gFish)"/><circle cx="11.5" cy="16.5" r="1" fill="#fff"/>',
    ice: '<path d="M16 4l10 5v12l-10 5-10-5V9z" fill="url(#gIce)" stroke="#8ACCEB" stroke-width=".8"/><path d="M6 9l10 5 10-5M16 14v12" stroke="#8ACCEB" stroke-width="1.2" fill="none"/><path d="M10 11.5l3 1.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>',
    rod: '<path d="M5 28L24 4" stroke="#8A5A2B" stroke-width="2.6" stroke-linecap="round"/><path d="M24 4c3 6 2 12 0 16" stroke="#9FB3C8" stroke-width="1.2" fill="none"/><path d="M24 20v3a2 2 0 0 1-4 0" stroke="#5B6B7E" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="9.5" cy="22.5" r="3" fill="url(#gSea)"/>',
    chart: '<rect x="4" y="16" width="6" height="12" rx="2" fill="url(#gSea)"/><rect x="13" y="9" width="6" height="19" rx="2" fill="url(#gGreen)"/><rect x="22" y="4" width="6" height="24" rx="2" fill="url(#gGold)"/>',
    signal: '<circle cx="16" cy="22" r="3" fill="#0A84FF"/><path d="M10.5 16.5a8 8 0 0 1 11 0M6.5 12.5a13.5 13.5 0 0 1 19 0" stroke="#8FD3FF" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M5 27L27 5" stroke="#FF3B30" stroke-width="2.6" stroke-linecap="round"/>',
    fish: '<path d="M3 16c3.5-6.5 11-8.5 17-4l6.5-4.5V25L20 20.5C14 25 6.5 22.5 3 16z" fill="url(#gFish)"/><circle cx="9.5" cy="14.5" r="1.6" fill="#fff"/><circle cx="9.5" cy="14.5" r=".8" fill="#123"/><path d="M14 11.5c1.2 3 1.2 6 0 9" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6"/>',
    pin: '<path d="M16 29s-9-8-9-15a9 9 0 0 1 18 0c0 7-9 15-9 15z" fill="url(#gRed)"/><circle cx="16" cy="14" r="3.6" fill="#fff"/>',
    phone: '<rect x="9" y="3" width="14" height="26" rx="3.5" fill="#2C3A4E"/><rect x="11" y="6" width="10" height="18" rx="1.5" fill="url(#gSea)"/><circle cx="23" cy="6" r="4.2" fill="url(#gRed)" stroke="#fff" stroke-width="1.4"/>',
    solunar: moon('translate(-2 0) scale(.9)') + '<path d="M24 5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="url(#gGold)"/>',
    fullmoon: '<circle cx="16" cy="16" r="11" fill="url(#gMoon)"/><circle cx="12" cy="13" r="2" fill="#E0CB8C" opacity=".6"/><circle cx="19" cy="19" r="2.8" fill="#E0CB8C" opacity=".5"/><circle cx="19" cy="10.5" r="1.2" fill="#E0CB8C" opacity=".6"/>',
    medal1: '<path d="M10 3h4l3 8h-4zM22 3h-4l-3 8h4z" fill="#0A84FF"/><circle cx="16" cy="20" r="9" fill="url(#gGold)" stroke="#E89400"/><text x="16" y="24.2" text-anchor="middle" font-size="11" font-weight="800" fill="#8A5A00" font-family="system-ui,sans-serif">1</text>',
    medal2: '<path d="M10 3h4l3 8h-4zM22 3h-4l-3 8h4z" fill="#FF3B30"/><circle cx="16" cy="20" r="9" fill="url(#gSilver)" stroke="#8E9AAB"/><text x="16" y="24.2" text-anchor="middle" font-size="11" font-weight="800" fill="#4F5B6B" font-family="system-ui,sans-serif">2</text>',
    medal3: '<path d="M10 3h4l3 8h-4zM22 3h-4l-3 8h4z" fill="#34C759"/><circle cx="16" cy="20" r="9" fill="url(#gBronze)" stroke="#9C5A28"/><text x="16" y="24.2" text-anchor="middle" font-size="11" font-weight="800" fill="#6B3A12" font-family="system-ui,sans-serif">3</text>',
    lock: '<rect x="7" y="14" width="18" height="14" rx="4" fill="url(#gPurple)"/><path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="#8E7BE8" stroke-width="2.6" fill="none"/><circle cx="16" cy="21" r="2" fill="#fff"/>',
    trophy: '<path d="M10 4h12v6a6 6 0 0 1-12 0z" fill="url(#gGold)"/><path d="M10 6H6a4 4 0 0 0 4 5M22 6h4a4 4 0 0 1-4 5" stroke="#E89400" stroke-width="2" fill="none"/><rect x="14.5" y="15" width="3" height="6" fill="#E89400"/><rect x="10" y="21" width="12" height="5" rx="1.6" fill="#8A5A2B"/>',
    sparkle: '<path d="M16 3l2.6 7.4L26 13l-7.4 2.6L16 23l-2.6-7.4L6 13l7.4-2.6z" fill="url(#gGold)"/><path d="M25 21l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#8FD3FF"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>${D}</defs>${Object.entries(S).map(([k, v]) => `<symbol id="g-${k}" viewBox="0 0 32 32">${v}</symbol>`).join('')}</svg>`;
  document.body.insertAdjacentHTML('afterbegin', svg);
  window.gl = (name, cls = '') => `<svg class="gl ${cls}" viewBox="0 0 32 32" aria-hidden="true"><use href="#g-${name}"/></svg>`;
})();
