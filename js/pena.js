/* TPTV · Cuentas y peña online con Firebase (Auth con contraseña + Firestore) por su API REST, sin librerías.
   - Cada persona se registra con un nombre de usuario y una contraseña. Por dentro, Firebase usa un correo inventado
     «usuario@usuarios.tptv.app» (nadie tiene que dar su email), así que Firebase garantiza que el usuario es único.
   - users/{uid}: ficha pública para los amigos (nombre, capturas, ranking). La leen él y su lista «viewers».
   - usernames/{usuario}: para buscar gente por nombre de usuario.
   - requests/{para}_{de}: solicitudes de amistad. Reglas en firestore.rules. */
(function () {
  const C = (window.TPTV_CONFIG && window.TPTV_CONFIG.firebase) || {};
  const enabled = !!(C.apiKey && C.projectId);
  const ROOT = `https://firestore.googleapis.com/v1/projects/${C.projectId}/databases/(default)/documents`;
  const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts';
  const DOMAIN = 'usuarios.tptv.app';
  const LSK = 'tptv.pena.session';
  let auth = null;
  try { auth = JSON.parse(localStorage.getItem(LSK) || 'null'); } catch (e) { auth = null; }
  const saveAuth = () => { try { if (auth) localStorage.setItem(LSK, JSON.stringify(auth)); else localStorage.removeItem(LSK); } catch (e) { /* lleno */ } };

  // --- Valores de Firestore <-> JS ---
  function enc(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: v.length ? { values: v.map(enc) } : {} };
    return { mapValue: { fields: encF(v) } };
  }
  const encF = (o) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, enc(x)]));
  function dec(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
    if ('mapValue' in v) return decF(v.mapValue.fields || {});
    return null;
  }
  const decF = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, x]) => [k, dec(x)]));

  class PenaError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
  const AUTH_MSG = {
    EMAIL_EXISTS: 'Ese nombre de usuario ya existe',
    INVALID_LOGIN_CREDENTIALS: 'Usuario o contraseña incorrectos',
    EMAIL_NOT_FOUND: 'Usuario o contraseña incorrectos',
    INVALID_PASSWORD: 'Usuario o contraseña incorrectos',
    USER_DISABLED: 'Esta cuenta está desactivada',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Espera un rato',
    OPERATION_NOT_ALLOWED: 'Falta activar «Correo y contraseña» en Firebase',
    WEAK_PASSWORD: 'La contraseña tiene que tener al menos 6 caracteres',
  };
  const authErr = (j) => { const m = ((j.error && j.error.message) || '').split(' ')[0].split(':')[0]; return new PenaError(AUTH_MSG[m] || 'No se pudo conectar. Revisa la conexión', m); };

  // --- Nombre de usuario ---
  const normUser = (u) => String(u || '').trim().toLowerCase().replace(/^@/, '');
  function checkUser(u) {
    if (u.length < 3) return 'Mínimo 3 caracteres';
    if (u.length > 20) return 'Máximo 20 caracteres';
    if (!/^[a-z0-9._]+$/.test(u)) return 'Solo letras sin tildes, números, punto y guion bajo';
    return null;
  }

  // --- Sesión ---
  async function idt(path, body) {
    if (!enabled) throw new PenaError('Las cuentas no están activadas en esta versión', 'off');
    let r;
    try { r = await fetch(`${IDT}:${path}?key=${C.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (e) { throw new PenaError('Sin conexión a internet', 'net'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw authErr(j);
    return j;
  }
  function setSession(j, username) {
    auth = { uid: j.localId, idToken: j.idToken, refresh: j.refreshToken, exp: Date.now() + (+j.expiresIn - 120) * 1000, username };
    saveAuth();
  }
  async function register(user, pass, pass2) {
    const u = normUser(user);
    const bad = checkUser(u);
    if (bad) throw new PenaError(bad, 'user');
    if ((pass || '').length < 6) throw new PenaError('La contraseña tiene que tener al menos 6 caracteres', 'pass');
    if (pass !== pass2) throw new PenaError('Las contraseñas no coinciden', 'pass2');
    const j = await idt('signUp', { email: `${u}@${DOMAIN}`, password: pass, returnSecureToken: true });
    setSession(j, u);
    me = null;
    await api(`usernames/${u}`, { method: 'PATCH', body: { fields: encF({ uid: auth.uid, u }) } });
    await ensure();
    return me;
  }
  async function login(user, pass) {
    const u = normUser(user);
    if (!u || !pass) throw new PenaError('Escribe tu usuario y tu contraseña', 'empty');
    const j = await idt('signInWithPassword', { email: `${u}@${DOMAIN}`, password: pass, returnSecureToken: true });
    setSession(j, u);
    me = null;
    await ensure();
    return me;
  }
  function logout() { auth = null; me = null; saveAuth(); }
  async function changePassword(pass, pass2) {
    if ((pass || '').length < 6) throw new PenaError('La contraseña tiene que tener al menos 6 caracteres', 'pass');
    if (pass !== pass2) throw new PenaError('Las contraseñas no coinciden', 'pass2');
    const j = await idt('update', { idToken: await token(), password: pass, returnSecureToken: true });
    setSession(j, auth.username);
  }
  async function refresh() {
    let r;
    try { r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${C.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(auth.refresh)}` }); } catch (e) { throw new PenaError('Sin conexión a internet', 'net'); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { logout(); throw new PenaError('Tu sesión ha caducado. Vuelve a entrar', 'noauth'); }
    auth = { ...auth, uid: j.user_id, idToken: j.id_token, refresh: j.refresh_token, exp: Date.now() + (+j.expires_in - 120) * 1000 };
    saveAuth();
  }
  async function token() {
    if (!enabled) throw new PenaError('Las cuentas no están activadas en esta versión', 'off');
    if (!auth) throw new PenaError('Entra con tu usuario', 'noauth');
    if (Date.now() > auth.exp) await refresh();
    return auth.idToken;
  }
  async function api(path, { method = 'GET', body, query = '' } = {}) {
    const t = await token();
    const url = path.startsWith('http') ? path : `${ROOT}/${path}${query}`;
    let r;
    try { r = await fetch(url, { method, headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); } catch (e) { throw new PenaError('Sin conexión a internet', 'net'); }
    if (r.status === 204) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new PenaError((j.error && j.error.message) || 'Error de la peña', r.status);
    return j;
  }
  const mask = (keys) => '?' + keys.map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const runQuery = (structuredQuery) => api(`${ROOT}:runQuery`, { method: 'POST', body: { structuredQuery } });

  // --- Mi ficha ---
  let me = null;
  async function ensure() {
    if (me) return me;
    await token();
    try {
      const d = await api(`users/${auth.uid}`);
      me = { uid: auth.uid, ...decF(d.fields) };
    } catch (e) {
      if (e.code !== 404) throw e;
      const data = { name: auth.username, username: auth.username, friends: [], viewers: [auth.uid], catches: [], stats: { piezas: 0, especies: [] }, updated: Date.now() };
      await api(`users/${auth.uid}`, { method: 'PATCH', body: { fields: encF(data) } });
      me = { uid: auth.uid, ...data };
    }
    me.friends = me.friends || []; me.viewers = me.viewers || [auth.uid];
    return me;
  }
  async function saveMe(fields) {
    await api(`users/${auth.uid}`, { method: 'PATCH', query: mask(Object.keys(fields)), body: { fields: encF(fields) } });
    Object.assign(me, fields);
  }

  // --- Buscar gente y amigos ---
  async function search(q) {
    const s = normUser(q).replace(/[^a-z0-9._]/g, '');
    if (s.length < 2) return [];
    await ensure();
    const res = await runQuery({
      from: [{ collectionId: 'usernames' }],
      where: { compositeFilter: { op: 'AND', filters: [
        { fieldFilter: { field: { fieldPath: 'u' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: s } } },
        { fieldFilter: { field: { fieldPath: 'u' }, op: 'LESS_THAN', value: { stringValue: s + '' } } },
      ] } },
      orderBy: [{ field: { fieldPath: 'u' }, direction: 'ASCENDING' }],
      limit: 12,
    });
    return (res || []).filter((x) => x.document).map((x) => decF(x.document.fields)).filter((x) => x.uid !== auth.uid)
      .map((x) => ({ ...x, state: me.friends.includes(x.uid) ? 'sent' : 'none' }));
  }
  async function userToUid(user) {
    const u = normUser(user);
    try { const d = await api(`usernames/${u}`); return decF(d.fields).uid; } catch (e) { if (e.code === 404) throw new PenaError(`No hay nadie con el usuario @${u}`, 'nf'); throw e; }
  }
  async function addUser(user) {
    await ensure();
    const uid = await userToUid(user);
    if (uid === auth.uid) throw new PenaError('Ese eres tú', 'self');
    if (!me.friends.includes(uid)) await saveMe({ friends: [...me.friends, uid], viewers: [...new Set([...me.viewers, uid])] });
    await api('requests', { method: 'POST', query: `?documentId=${uid}_${auth.uid}`, body: { fields: encF({ from: auth.uid, to: uid, fromName: auth.username, t: Date.now() }) } }).catch((e) => { if (e.code !== 409) throw e; });
    return uid;
  }
  async function incoming() {
    await ensure();
    const res = await runQuery({ from: [{ collectionId: 'requests' }], where: { fieldFilter: { field: { fieldPath: 'to' }, op: 'EQUAL', value: { stringValue: auth.uid } } }, limit: 50 });
    return (res || []).filter((x) => x.document).map((x) => decF(x.document.fields)).filter((r) => !me.friends.includes(r.from));
  }
  async function accept(fromUid) {
    await saveMe({ friends: [...new Set([...me.friends, fromUid])], viewers: [...new Set([...me.viewers, fromUid])] });
    await api(`requests/${auth.uid}_${fromUid}`, { method: 'DELETE' }).catch(() => {});
  }
  async function reject(fromUid) { await api(`requests/${auth.uid}_${fromUid}`, { method: 'DELETE' }).catch(() => {}); }
  async function remove(uid) {
    await saveMe({ friends: me.friends.filter((x) => x !== uid), viewers: me.viewers.filter((x) => x !== uid) });
    await api(`requests/${uid}_${auth.uid}`, { method: 'DELETE' }).catch(() => {});
  }
  async function friends() {
    await ensure();
    return Promise.all(me.friends.map(async (uid) => {
      try { const d = await api(`users/${uid}`); return { uid, ok: true, ...decF(d.fields) }; } catch (e) { return { uid, ok: false }; }
    }));
  }
  // Gente que quizá conozcas: primero amigos de tus amigos (con cuántos tenéis en común) y, si faltan, gente de TPTV
  const rows = (res) => (res || []).filter((x) => x.document).map((x) => decF(x.document.fields));
  async function suggest(friendList, exclude = []) {
    await ensure();
    const skip = new Set([auth.uid, ...me.friends, ...exclude]);
    const fof = {};
    (friendList || await friends()).filter((x) => x.ok).forEach((x) => (x.friends || []).forEach((u) => {
      if (!skip.has(u)) (fof[u] = fof[u] || []).push(x.username || x.name);
    }));
    const out = [];
    const ids = Object.keys(fof).sort((a, b) => fof[b].length - fof[a].length).slice(0, 20);
    if (ids.length) {
      const res = await runQuery({ from: [{ collectionId: 'usernames' }], where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'IN', value: { arrayValue: { values: ids.map(enc) } } } }, limit: 20 });
      rows(res).forEach((x) => out.push({ ...x, via: fof[x.uid] || [] }));
      out.sort((a, b) => b.via.length - a.via.length);
    }
    if (out.length < 8) {
      const start = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
      const q = (where) => runQuery({ from: [{ collectionId: 'usernames' }], ...(where ? { where } : {}), orderBy: [{ field: { fieldPath: 'u' }, direction: 'ASCENDING' }], limit: 20 });
      let more = rows(await q({ fieldFilter: { field: { fieldPath: 'u' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: start } } }));
      if (more.length < 12) more = more.concat(rows(await q(null)));
      more.sort(() => Math.random() - 0.5).forEach((x) => { if (!skip.has(x.uid) && !out.some((o) => o.uid === x.uid)) out.push({ ...x, via: [] }); });
    }
    return out.slice(0, 10);
  }  // --- Checklists compartidas: listas/{id}; las leen y escriben sus miembros (uid en «members») ---
  // Cada cosa de la lista es un campo del mapa «items» y se guarda sola (updateMask items.{id}): dos colegas pueden
  // marcar a la vez sin pisarse.
  const listOut = (d) => ({ id: d.name.split('/').pop(), ...decF(d.fields), remote: true });
  async function myLists() {
    await ensure();
    const res = await runQuery({ from: [{ collectionId: 'listas' }], where: { fieldFilter: { field: { fieldPath: 'members' }, op: 'ARRAY_CONTAINS', value: { stringValue: auth.uid } } }, limit: 50 });
    return (res || []).filter((x) => x.document).map((x) => listOut(x.document));
  }
  async function getList(id) { return listOut(await api(`listas/${id}`)); }
  async function createList(l) {
    await ensure();
    const data = { title: l.title, owner: auth.uid, members: [...new Set([auth.uid, ...(l.members || [])])], names: { ...(l.names || {}), [auth.uid]: auth.username }, items: l.items || {}, spot: l.spot || '', date: l.date || '', updated: Date.now() };
    return listOut(await api('listas', { method: 'POST', body: { fields: encF(data) } }));
  }
  async function setItem(id, itemId, item) {
    const fields = { updated: Date.now() };
    if (item) fields.items = { [itemId]: item };
    await api(`listas/${id}`, { method: 'PATCH', query: mask(['updated', `items.${itemId}`]), body: { fields: encF(fields) } });
  }
  async function setListMeta(id, fields) {
    const f = { ...fields, updated: Date.now() };
    await api(`listas/${id}`, { method: 'PATCH', query: mask(Object.keys(f)), body: { fields: encF(f) } });
  }
  async function leaveList(l) { await setListMeta(l.id, { members: (l.members || []).filter((u) => u !== auth.uid) }); }
  async function deleteList(id) { await api(`listas/${id}`, { method: 'DELETE' }); }

  // Publica capturas y perfil (nombre, bio, foto, tema, favoritos y expositor con sus fotos)
  async function publish(catches, profile = {}) {
    if (!enabled || !auth) return;
    await ensure();
    const especies = [...new Set(catches.map((c) => c.sp))];
    const piezas = catches.reduce((a, c) => a + (c.n || 1), 0);
    const p = { name: profile.name || auth.username, bio: profile.bio || '', avatar: profile.avatar || '', theme: profile.theme || 'mar', fav: profile.fav || '', tec: profile.tec || '', showcase: (profile.showcase || []).slice(0, 6) };
    await saveMe({ ...p, catches: catches.slice(0, 150), stats: { piezas, especies }, updated: Date.now() });
  }

  window.Pena = {
    enabled, register, login, logout, changePassword, ensure, search, addUser, incoming, accept, reject, remove, friends, suggest, publish, myLists, getList, createList, setItem, setListMeta, leaveList, deleteList, checkUser, normUser,
    get loggedIn() { return !!auth; }, get username() { return auth && auth.username; }, get uid() { return auth && auth.uid; }, get me() { return me; },
  };
})();
