/* TPTV · Sol y Luna calculados en el móvil (sin internet).
   Fórmulas de posición de la Luna y del Sol de baja precisión (método de SunCalc / Meeus simplificado):
   sobran para saber fase, salida, puesta y tránsito con un error de pocos minutos. */
(function () {
  const PI = Math.PI, rad = PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545;
  const e = rad * 23.4397;
  const toDays = (date) => date.valueOf() / dayMs - 0.5 + J1970 - J2000;
  const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const altitude = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
  const refraction = (h) => {
    if (h < 0) h = 0;
    return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
  };
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) => {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    return M + C + rad * 102.9372 + PI;
  };
  function sunCoords(d) {
    const L = eclipticLongitude(solarMeanAnomaly(d));
    return { dec: declination(L, 0), ra: rightAscension(L, 0) };
  }
  function moonCoords(d) {
    const L = rad * (218.316 + 13.176396 * d);
    const M = rad * (134.963 + 13.064993 * d);
    const F = rad * (93.272 + 13.229350 * d);
    const l = L + rad * 6.289 * Math.sin(M);
    const b = rad * 5.128 * Math.sin(F);
    const dt = 385001 - 20905 * Math.cos(M);
    return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
  }
  function moonAltitude(date, lat, lng) {
    const lw = rad * -lng, phi = rad * lat, d = toDays(date);
    const c = moonCoords(d);
    const H = siderealTime(d, lw) - c.ra;
    const h = altitude(H, phi, c.dec);
    return h + refraction(h);
  }
  function sunAltitude(date, lat, lng) {
    const lw = rad * -lng, phi = rad * lat, d = toDays(date);
    const c = sunCoords(d);
    return altitude(siderealTime(d, lw) - c.ra, phi, c.dec);
  }
  function moonIllumination(date) {
    const d = toDays(date || new Date());
    const s = sunCoords(d), m = moonCoords(d), sdist = 149598000;
    const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
    const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - m.ra),
      Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
    return {
      fraction: (1 + Math.cos(inc)) / 2,
      phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / PI,
    };
  }

  // Muestrea la altura de la Luna cada 6 minutos durante 24 h desde `start` (Date UTC de la medianoche local)
  function moonDay(start, lat, lng) {
    const step = 6 * 60000, n = 240, h0 = 0.133 * rad;
    const alts = [];
    for (let i = 0; i <= n; i++) alts.push(moonAltitude(new Date(start.valueOf() + i * step), lat, lng));
    let rise = null, set = null, upper = null, lower = null;
    for (let i = 1; i <= n; i++) {
      const a = alts[i - 1] - h0, b = alts[i] - h0;
      if (a < 0 && b >= 0 && !rise) rise = new Date(start.valueOf() + (i - 1 + a / (a - b)) * step);
      if (a >= 0 && b < 0 && !set) set = new Date(start.valueOf() + (i - 1 + a / (a - b)) * step);
    }
    // Tránsitos (culminación superior e inferior): máximos y mínimos con ajuste parabólico
    for (let i = 1; i < n; i++) {
      const p = alts[i - 1], c = alts[i], q = alts[i + 1];
      const den = p - 2 * c + q;
      const off = den !== 0 ? 0.5 * (p - q) / den : 0;
      const t = new Date(start.valueOf() + (i + off) * step);
      if (c > p && c >= q && !upper) upper = t;
      if (c < p && c <= q && !lower) lower = t;
    }
    return { rise, set, upper, lower };
  }

  const PHASES = [
    [0.03, 'Luna nueva', 'nueva'], [0.22, 'Luna creciente', 'creciente'], [0.28, 'Cuarto creciente', 'cuarto'],
    [0.47, 'Gibosa creciente', 'gibosa'], [0.53, 'Luna llena', 'llena'], [0.72, 'Gibosa menguante', 'gibosa'],
    [0.78, 'Cuarto menguante', 'cuarto'], [0.97, 'Luna menguante', 'menguante'], [1.01, 'Luna nueva', 'nueva'],
  ];
  function phaseName(p) {
    for (const [lim, name] of PHASES) if (p < lim) return name;
    return 'Luna nueva';
  }
  // Mareas vivas unos dos días después de luna nueva o llena; muertas tras los cuartos
  function tideKind(p) {
    const dist = Math.min(Math.abs(p - 0.06), Math.abs(p - 0.56), Math.abs(p - 1.06));
    if (dist < 0.1) return 'vivas';
    const q = Math.min(Math.abs(p - 0.31), Math.abs(p - 0.81));
    if (q < 0.09) return 'muertas';
    return 'medias';
  }

  window.Astro = { moonAltitude, sunAltitude, moonIllumination, moonDay, phaseName, tideKind };
})();
