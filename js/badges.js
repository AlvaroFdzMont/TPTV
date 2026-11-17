/* TPTV · Insignias propias: cada una con su forma, su esmalte y su emblema dibujados a mano en SVG.
   Las que tienen niveles pasan por bronce, plata, oro y (algunas) leyenda. Las condiciones se cuentan en app.js
   (BADGE_VALUE); aquí solo vive el dibujo y la ficha de cada una.
   Uso: TPTV_BADGES.art(def, nivel) → <svg>. nivel 0 = bloqueada. */
(function () {
  // Emblemas en una cuadrícula de 24×24, en blanco (trazo) sobre el esmalte
  const E = {
    hook: '<path d="M14.5 3.5v9a4.6 4.6 0 0 1-9.2 0V10l2.8 2.2"/><circle cx="14.5" cy="3.4" r="1.4"/><path d="M14.5 16.5l3.5 3.5"/>',
    school: '<path d="M2.5 9c2-3 6-3.8 9-1.6L14.5 5v8l-3-2.4C8.5 12.8 4.5 12 2.5 9z" class="w"/><path d="M9.5 16.5c2-3 6-3.8 9-1.6l3-2.4v8l-3-2.4c-3 2.2-7 1.4-9-1.6z" class="w"/>',
    dex: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" class="w"/>',
    gem: '<path d="M6 4h12l4 5-10 12L2 9z"/><path d="M2 9h20M9 4l-1.5 5L12 21l4.5-12L15 4"/>',
    crown: '<path d="M3.5 18 2.5 8l5.5 4L12 4.5 16 12l5.5-4-1 10z" class="w"/><path d="M4 21h16"/><circle cx="12" cy="14" r="1.6" class="e"/>',
    sunrise: '<path d="M5 16a7 7 0 0 1 14 0z" class="w"/><path d="M2 16h20M5 19.5h14M12 3v3.5M4.8 6.8l2 2M19.2 6.8l-2 2"/>',
    owl: '<path d="M5 9.5 4 4l4.5 2.8a8 8 0 0 1 7 0L20 4l-1 5.5c1 1.4 1.5 3 1.5 4.8 0 4.6-3.8 7.2-8.5 7.2S3.5 18.9 3.5 14.3c0-1.8.5-3.4 1.5-4.8z"/><circle cx="8.8" cy="12" r="2.6"/><circle cx="15.2" cy="12" r="2.6"/><circle cx="8.8" cy="12" r=".9" class="w"/><circle cx="15.2" cy="12" r=".9" class="w"/><path d="M11 15.5l1 1.4 1-1.4"/>',
    twoseas: '<path d="M2.5 9c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.8-2 2.4 2 4.7 2"/><path d="M2.5 15c2.4 0 2.4 2 4.8 2s2.4-2 4.7-2 2.4 2 4.8 2 2.4-2 4.7-2"/><circle cx="12" cy="12" r="1.5" class="w"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M12 5.5l2.4 6.5L12 18.5 9.6 12z" class="w"/><path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2"/>',
    map: '<path d="M3 6.5l5.5-2.5 7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z"/><path d="M8.5 4v13.5M15.5 6.5V20"/><circle cx="12" cy="10.5" r="1.8" class="w"/>',
    wind: '<path d="M3 8h10.5a3 3 0 1 0-3-3"/><path d="M3 12.5h15.5a3 3 0 1 1-3 3"/><path d="M3 17h7"/>',
    fullmoon: '<circle cx="12.5" cy="12.5" r="8" class="w"/><circle cx="10" cy="10" r="1.6" class="e"/><circle cx="15" cy="14.5" r="2.1" class="e"/><circle cx="10.5" cy="16" r="1" class="e"/><path d="M3.5 4.5v2.4M2.3 5.7h2.4"/>',
    tide: '<path d="M2.5 17c2.4 0 2.4-2 4.8-2s2.4 2 4.7 2 2.4-2 4.8-2 2.4 2 4.7 2"/><path d="M8 12V3.5M5.2 6.3 8 3.5l2.8 2.8M16 3.5V12M13.2 9.2 16 12l2.8-2.8"/>',
    release: '<path d="M4 11.5c2.2-3.4 6.6-4.4 10-1.8L18 7v9l-4-2.7c-3.4 2.6-7.8 1.6-10-1.8z" class="w"/><path d="M20 19.5a7.5 7.5 0 0 1-12.5.5M7.5 20l-.3-3 3 .6"/>',
    ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21z"/><path d="M7 12.5l2 2M10 9.5l1.4 1.4M13 6.5l2 2"/>',
    weight: '<path d="M8 8.5a4 4 0 1 1 8 0"/><path d="M5.5 10h13l1.8 10.5H3.7z" class="w"/><path d="M9 15.5h6"/>',
    flame: '<path d="M12 2.5c1 3.5 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.2 2.6-5.4.2 1.8 1 2.8 2 3.2-.6-3 .2-6.2.9-8.8z" class="w"/><path d="M12 20.5c-1.6 0-2.8-1.2-2.8-2.8 0-1.6 1.6-2.8 2.8-4.2 1.2 1.4 2.8 2.6 2.8 4.2 0 1.6-1.2 2.8-2.8 2.8z" class="e"/>',
    seasons: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><circle cx="7.8" cy="7.8" r="1.6" class="w"/><path d="M16.2 5.6v4.4M14 7.8h4.4"/><path d="M5.6 16.5c1.3-1.8 3.2-1.8 4.4-1"/><path d="M14.5 18.3c.8-2.4 2.6-3.2 4-3"/>',
    squid: '<path d="M12 2.5c3.2 2 4.5 5 4.5 8.5v2.5h-9V11c0-3.5 1.3-6.5 4.5-8.5z" class="w"/><path d="M8.5 13.5c-.5 3-2.2 4.5-3.5 6M10.5 13.5c0 3-.8 5.5-1.6 7.5M13.5 13.5c0 3 .8 5.5 1.6 7.5M15.5 13.5c.5 3 2.2 4.5 3.5 6"/><circle cx="10.4" cy="9.5" r=".9" class="e"/><circle cx="13.6" cy="9.5" r=".9" class="e"/>',
    tuna: '<path d="M6.5 12c3-4.2 9-5 13-1.2l2.5-2.3v7l-2.5-2.3c-4 3.8-10 3-13-1.2z" class="w"/><path d="M1.5 9h3.5M.8 12h4M1.5 15h3.5M12 8.2l1.6-3M12 15.8l1.6 3"/>',
    bass: '<path d="M2 13c3-4.2 9.6-5.5 14.5-2.4L21 7.5v10l-4.5-3.1C11.6 17.5 5 17.2 2 13z" class="w"/><path d="M6.5 9.4 8 5.5l1.6 3.4 1.4-3.2 1.4 3.4 1.4-3"/><circle cx="5.6" cy="12.4" r=".9" class="e"/>',
    sargo: '<path d="M2.5 12c2.4-5.4 9-7.4 13.2-3.6L20.5 5v14l-4.8-3.4C11.5 19.4 4.9 17.4 2.5 12z" class="w"/><path d="M8.5 7.6v8.8M12.6 7.4v9.2" class="e2"/><circle cx="5.8" cy="11" r=".9" class="e"/>',
    camera: '<path d="M3.5 7.5h3.6l2-2.8h5.8l2 2.8h3.6v12h-17z"/><circle cx="12" cy="13" r="3.6" class="w"/><circle cx="12" cy="13" r="1.5" class="e"/>',
    people: '<circle cx="8.5" cy="8" r="3.3" class="w"/><circle cx="16.3" cy="9" r="2.7"/><path d="M2.5 20a6 6 0 0 1 12 0z" class="w"/><path d="M15.5 14.2a5.2 5.2 0 0 1 6 5.3"/>',
    shark: '<path d="M4 16.5c3.6-1 6-4.4 7.5-12 2.6 3.6 5.8 8.4 8.5 12z" class="w"/><path d="M2 19.5c2.5 0 2.5-1.6 5-1.6s2.5 1.6 5 1.6 2.5-1.6 5-1.6 2.5 1.6 5 1.6"/>',
    lighthouse: '<path d="M9 21.5 10.2 9h3.6L15 21.5z" class="w"/><path d="M9.6 8.2h4.8l-.6-3.2h-3.6z"/><path d="M12 2.5V5M14.5 6.5l6.5-2.5v5zM9.5 6.5 3 4v5z" class="b"/><path d="M6.5 21.5h11M9.7 13.5h4.6M9.4 17.5h5.2" class="e2"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" class="w"/>',
  };
  // Formas (64×64, centro 32,32). r = contorno exterior; el esmalte es la misma forma reducida
  const SH = {
    round: '<circle cx="32" cy="32" r="29"/>',
    hex: '<path d="M32 2.5 57.5 17.2v29.6L32 61.5 6.5 46.8V17.2z" stroke-linejoin="round"/>',
    shield: '<path d="M32 3 56 10.5v19c0 15-10.4 26.6-24 31.5C18.4 56.1 8 44.5 8 29.5v-19z"/>',
    burst: (() => { let d = ''; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 26.5 : 30.5; d += `${i ? 'L' : 'M'}${(32 + Math.cos(a) * r).toFixed(2)} ${(32 + Math.sin(a) * r).toFixed(2)}`; } return `<path d="${d}Z" stroke-linejoin="round"/>`; })(),
    diamond: '<path d="M32 2.5 61.5 32 32 61.5 2.5 32z" stroke-linejoin="round"/>',
    drop: '<path d="M32 2.5c9.5 10.5 25 22.5 25 36.5a25 25 0 0 1-50 0C7 25 22.5 13 32 2.5z"/>',
  };
  const TIER = ['Bloqueada', 'Bronce', 'Plata', 'Oro', 'Leyenda'];
  // Ficha de cada insignia. g = umbrales por nivel (1 = sin niveles, con progreso hasta el objetivo)
  const DEFS = [
    { id: 'bautismo', n: 'Bautismo de sal', d: 'Tu primera captura apuntada en el Diario.', s: 'round', c: ['#5EE7DF', '#0E8A9A'], e: 'hook', g: [1], u: 'captura', cat: 'Capturas' },
    { id: 'incansable', n: 'Incansable', d: 'Piezas sacadas del agua.', s: 'hex', c: ['#64D2FF', '#0A5BD0'], e: 'school', g: [10, 50, 150, 400], u: 'piezas', cat: 'Capturas' },
    { id: 'coleccionista', n: 'Coleccionista', d: 'Especies distintas en tu Pecedex.', s: 'shield', c: ['#B8A2FF', '#5B3CC4'], e: 'dex', g: [5, 15, 30, 50], u: 'especies', cat: 'Capturas' },
    { id: 'monstruo', n: 'Monstruo', d: 'Tu pieza más larga.', s: 'diamond', c: ['#FF8A7A', '#C21E3A'], e: 'ruler', g: [40, 60, 80, 100], u: 'cm', cat: 'Capturas' },
    { id: 'peso', n: 'Peso pesado', d: 'Tu pieza más pesada.', s: 'hex', c: ['#D9B48A', '#7A4E22'], e: 'weight', g: [1, 3, 6], u: 'kg', cat: 'Capturas' },
    { id: 'raro', n: 'Ojo de lince', d: 'Una especie rara (4 estrellas) en tu Pecedex.', s: 'diamond', c: ['#E0A2FF', '#8A2BD8'], e: 'gem', g: [1], u: 'especie rara', cat: 'Especies' },
    { id: 'mito', n: 'Cazador de mitos', d: 'Una especie de leyenda (5 estrellas).', s: 'burst', c: ['#FFD36B', '#E0531F'], e: 'crown', g: [1], u: 'especie de leyenda', cat: 'Especies' },
    { id: 'lubinero', n: 'Lubinero', d: 'Lubinas sacadas.', s: 'shield', c: ['#A9C7DB', '#3B6680'], e: 'bass', g: [1, 10, 25], u: 'lubinas', cat: 'Especies' },
    { id: 'sargos', n: 'Familia sargo', d: 'Los cinco Diplodus del Estrecho: sargo, picudo, breado, mojarra y raspallón.', s: 'hex', c: ['#FFE08A', '#C98A12'], e: 'sargo', g: [5], u: 'especies', cat: 'Especies' },
    { id: 'eging', n: 'Maestro del eging', d: 'Calamares, chocos y compañía.', s: 'drop', c: ['#FF9EC4', '#C2185B'], e: 'squid', g: [1, 10, 30], u: 'cefalópodos', cat: 'Especies' },
    { id: 'velocista', n: 'Velocista', d: 'Pelágicos: bonitos, caballas, palometas, jureles…', s: 'diamond', c: ['#7FB8FF', '#1E3F8C'], e: 'tuna', g: [1, 10, 30], u: 'pelágicos', cat: 'Especies' },
    { id: 'tiburonero', n: 'Tiburonero', d: 'Pintarrojas, musolas y rayas (las permitidas).', s: 'burst', c: ['#9FB3C8', '#37475A'], e: 'shark', g: [1, 5, 15], u: 'piezas', cat: 'Especies' },
    { id: 'madrugador', n: 'Madrugador', d: 'Capturas entre las 5 y las 8 de la mañana.', s: 'round', c: ['#FFC37A', '#E86A1C'], e: 'sunrise', g: [1, 10, 30], u: 'al alba', cat: 'Momentos' },
    { id: 'lechuza', n: 'Lechuza', d: 'Capturas de noche, entre las 22 y las 5.', s: 'round', c: ['#7D86FF', '#1F2470'], e: 'owl', g: [1, 10, 30], u: 'de noche', cat: 'Momentos' },
    { id: 'luna', n: 'Hijo de la luna', d: 'Capturas con luna llena.', s: 'round', c: ['#C9D4FF', '#3E4C8F'], e: 'fullmoon', g: [1, 5, 15], u: 'con luna llena', cat: 'Momentos' },
    { id: 'vivas', n: 'Marea viva', d: 'Capturas con mareas vivas (luna nueva o llena).', s: 'drop', c: ['#6FE3FF', '#0B6FA8'], e: 'tide', g: [5, 25, 75], u: 'con mareas vivas', cat: 'Momentos' },
    { id: 'levante', n: 'Domador del Levante', d: 'Capturas con Levante de 30 km/h o más.', s: 'burst', c: ['#8FF0E0', '#0F8C80'], e: 'wind', g: [1, 5, 15], u: 'con Levante', cat: 'Momentos' },
    { id: 'racha', n: 'En racha', d: 'Días seguidos con alguna captura.', s: 'burst', c: ['#FFB36B', '#D8261E'], e: 'flame', g: [2, 3, 5, 7], u: 'días seguidos', cat: 'Momentos' },
    { id: 'estaciones', n: 'Cuatro estaciones', d: 'Capturas en primavera, verano, otoño e invierno.', s: 'round', c: ['#9BE88F', '#2F8F5B'], e: 'seasons', g: [4], u: 'estaciones', cat: 'Momentos' },
    { id: 'dosmares', n: 'Dos mares', d: 'Una captura en el Atlántico y otra en el Mediterráneo.', s: 'drop', c: ['#5FD0FF', '#14549C'], e: 'twoseas', g: [2], u: 'mares', cat: 'Lugares' },
    { id: 'ruta', n: 'Ruta del Estrecho', d: 'Pesca en las cuatro zonas: Atlántico, Estrecho, bahía y Mediterráneo.', s: 'shield', c: ['#7FE8C8', '#137A6A'], e: 'compass', g: [4], u: 'zonas', cat: 'Lugares' },
    { id: 'trotamar', n: 'Trotamar', d: 'Pesqueros distintos con alguna captura.', s: 'hex', c: ['#A4E86F', '#3F7F1A'], e: 'map', g: [5, 15, 30], u: 'pesqueros', cat: 'Lugares' },
    { id: 'faros', n: 'Guardián de los faros', d: 'Captura junto a los faros de Trafalgar, Punta Carnero y la Isla de Tarifa.', s: 'shield', c: ['#FFD2A1', '#B4532A'], e: 'lighthouse', g: [3], u: 'faros', cat: 'Lugares' },
    { id: 'suelta', n: 'Guardián del mar', d: 'Piezas devueltas al agua.', s: 'shield', c: ['#8FF0A8', '#16884A'], e: 'release', g: [5, 25, 100], u: 'sueltas', cat: 'Peña' },
    { id: 'fotografo', n: 'Fotógrafo', d: 'Capturas con foto.', s: 'round', c: ['#FFA3C0', '#B8326A'], e: 'camera', g: [1, 10, 50], u: 'con foto', cat: 'Peña' },
    { id: 'pena', n: 'Peña completa', d: 'Colegas en tu peña online.', s: 'hex', c: ['#FFC48A', '#C4561A'], e: 'people', g: [1, 5, 10], u: 'colegas', cat: 'Peña' },
  ];
  // Metales (aro) y esmaltes (centro) compartidos: se pintan una sola vez en el documento
  const metal = {
    bm0: ['#E3E6EB', '#A7AEB9', '#7C8593'], bm1: ['#FFD9B3', '#C47B3C', '#7E431A'], bm2: ['#FFFFFF', '#B7C1CE', '#6E7B8C'],
    bm3: ['#FFF3B0', '#F2B32A', '#A86A00'],
  };
  let defs = '<defs>';
  Object.entries(metal).forEach(([k, s]) => { defs += `<linearGradient id="${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s[0]}"/><stop offset=".5" stop-color="${s[1]}"/><stop offset="1" stop-color="${s[2]}"/></linearGradient>`; });
  defs += '<linearGradient id="bm4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6C2"/><stop offset=".25" stop-color="#FF9BD2"/><stop offset=".5" stop-color="#9FA8FF"/><stop offset=".75" stop-color="#7FF0E0"/><stop offset="1" stop-color="#FFD36B"/></linearGradient>';
  defs += '<linearGradient id="be-lock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C5CBD3"/><stop offset="1" stop-color="#8D96A3"/></linearGradient>';
  defs += '<radialGradient id="bshine" cx=".3" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
  DEFS.forEach((b) => { defs += `<linearGradient id="be-${b.id}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${b.c[0]}"/><stop offset="1" stop-color="${b.c[1]}"/></linearGradient>`; });
  defs += '</defs>';
  const mount = () => {
    if (document.getElementById('tptv-bdefs')) return;
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.id = 'tptv-bdefs'; s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    s.innerHTML = defs;
    document.body.appendChild(s);
  };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  const maxTier = (b) => (b.g.length > 1 ? b.g.length : 1);
  // Nivel del rim: bronce, plata, oro y leyenda; las de un solo paso salen en oro
  const rimOf = (b, t) => (!t ? 'bm0' : b.g.length === 1 ? 'bm3' : `bm${Math.min(4, t)}`);
  function art(b, t, { big = false } = {}) {
    const sh = SH[b.s] || SH.round;
    const rim = rimOf(b, t);
    const top = t && t >= Math.min(3, maxTier(b)) && b.g.length > 1;
    const ribbons = t ? `<path d="M20 50 14 70l7-3.5 4 6 5-18z" fill="url(#be-${b.id})" opacity=".95"/><path d="M44 50l6 20-7-3.5-4 6-5-18z" fill="url(#be-${b.id})" opacity=".85"/>` : '';
    const pips = b.g.length > 1 ? `<g class="bpips">${b.g.map((_, k) => `<circle cx="${32 + (k - (b.g.length - 1) / 2) * 6}" cy="50.4" r="1.8" fill="${k < t ? '#fff' : 'rgba(0,0,0,.3)'}"/>`).join('')}</g>` : '';
    return `<svg class="bart${t ? '' : ' lock'}${top ? ' top' : ''}" viewBox="0 0 64 74" aria-hidden="true">
      ${ribbons}
      <g fill="url(#${rim})" stroke="rgba(0,0,0,.18)" stroke-width="1">${sh}</g>
      <g transform="translate(32 32) scale(.8) translate(-32 -32)" fill="url(#${t ? 'be-' + b.id : 'be-lock'})" stroke="rgba(255,255,255,.55)" stroke-width="1.6">${sh}</g>
      <g transform="translate(32 32) scale(.8) translate(-32 -32)" fill="url(#bshine)">${sh}</g>
      <g class="bem" transform="translate(18.4 17.6) scale(1.13)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" opacity="${t ? 1 : 0.55}">${E[b.e] || E.star}</g>
      ${pips}${t === 4 ? '<path class="bspark" d="M52 8l1.4 3.6L57 13l-3.6 1.4L52 18l-1.4-3.6L47 13l3.6-1.4z" fill="#fff"/>' : ''}
    </svg>`;
  }
  window.TPTV_BADGES = { DEFS, TIER, art, maxTier, emblems: E };
})();
