/* Sistema de respaldo local unificado de Verbo.
   Una sola capa automática y silenciosa: IndexedDB, sin ningún diálogo de
   permiso. Exportar/importar sigue disponible como respaldo manual explícito
   (botón en el panel de Ajustes). Sin cuentas, sin backend — todo vive en la
   máquina del usuario. */
window.VerboBackup = (() => {
  const DB_NAME = 'verbo-db';
  const DB_VERSION = 1;
  const STORE = 'kv';
  const DATA_KEY = 'unified-data';
  const FILE_NAME = 'verbo-datos.json';

  let dbPromise = null;
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function idbGet(key) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch { return null; }
  }
  async function idbSet(key, value) {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch { return false; }
  }

  function emptyData() {
    return { version: '1.0', fecha_guardado: null, notas: [], resaltados: [], marcadores: [], posicion_lectura: {}, ultima_exportacion: null, predicas: [] };
  }

  // Migración única desde el localStorage disperso que ya existía antes de
  // este sistema (resaltados, nota:BOOK-CAP, última posición de lectura).
  function migrateFromLocalStorage() {
    const data = emptyData();
    try {
      const rawHl = JSON.parse(localStorage.getItem('verbo:highlights') || '{}');
      data.resaltados = Object.entries(rawHl).map(([ref, color]) => ({
        id: ref, ubicacion: { tipo: 'biblia', ref }, color, texto: ''
      }));
    } catch {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nota:')) {
          const ref = key.slice('nota:'.length);
          const texto = localStorage.getItem(key) || '';
          if (texto.trim()) data.notas.push({ id: ref, ubicacion: { tipo: 'biblia', ref }, texto, fecha: null });
        }
      }
    } catch {}
    const libro = localStorage.getItem('verbo:lastBook');
    const capitulo = localStorage.getItem('verbo:lastChapter');
    if (libro) data.posicion_lectura.biblia = { libro, capitulo: capitulo ? Number(capitulo) : 1 };
    // Si de verdad se migró contenido real (resaltados/notas de antes de que
    // existiera este sistema), hay que sellar fecha_guardado: si se deja en
    // null, sync.js (push()) lo trata como "dispositivo sin datos todavía" y
    // nunca lo sube. Sin contenido real, se deja null a propósito.
    if (data.resaltados.length || data.notas.length) data.fecha_guardado = new Date().toISOString();
    return data;
  }

  let cached = null;
  let persistSubscribers = [];

  // Permite que otros módulos (ej. sync.js) se enteren de cada guardado local
  // para disparar una sincronización, sin acoplar backup.js a la red.
  function onPersist(cb) { persistSubscribers.push(cb); }

  async function init() {
    cached = await idbGet(DATA_KEY);
    if (!cached) {
      cached = migrateFromLocalStorage();
      await idbSet(DATA_KEY, cached);
    }
    for (const campo of ['notas', 'resaltados', 'marcadores', 'predicas']) if (!Array.isArray(cached[campo])) cached[campo] = [];
    if (!cached.posicion_lectura) cached.posicion_lectura = {};
    return cached;
  }

  function getData() { return cached; }

  // No toca fecha_guardado aquí: ese campo es el reloj que sync.js usa para
  // decidir qué dispositivo "gana" al reconciliar (último en escribir gana,
  // sin fusión). Si persist() lo bumpeara en cada llamada, cualquier guardado
  // sin cambios de contenido real —posición de lectura al cambiar de
  // capítulo, o el flush de "salir" en visibilitychange/pagehide— haría que
  // ESE dispositivo pareciera el más reciente y sobrescribiera un cambio
  // genuino más nuevo hecho en otro dispositivo. Bug real en producción
  // (2026-07-30): un resaltado nuevo en el celular se perdió porque la PC,
  // solo por seguir leyendo capítulos, quedó con fecha_guardado más nueva.
  // Los únicos que deben mover el reloj son los cambios de contenido real:
  // setAllResaltados/setNota lo hacen explícitamente antes de llamar aquí.
  async function persist() {
    await idbSet(DATA_KEY, cached);
    scheduleCapacitorWrite();
    persistSubscribers.forEach(cb => { try { cb(cached); } catch {} });
  }

  // Reemplaza los datos locales con un blob remoto más nuevo (sync). A
  // diferencia de persist(), no notifica a persistSubscribers: viene de la
  // red, no de un cambio local que haya que reenviar.
  async function replaceData(newData) {
    cached = { ...emptyData(), ...newData };
    for (const campo of ['notas', 'resaltados', 'marcadores', 'predicas']) if (!Array.isArray(cached[campo])) cached[campo] = [];
    if (!cached.posicion_lectura) cached.posicion_lectura = {};
    await idbSet(DATA_KEY, cached);
    scheduleCapacitorWrite();
    return cached;
  }

  // ---- Resaltados (mapa BOOK:CAP:VERSO -> clase de color, igual forma que ya usaba app.js) ----
  function getResaltadosMap() {
    const map = {};
    cached.resaltados.forEach(r => { if (r.ubicacion?.tipo === 'biblia') map[r.ubicacion.ref] = r.color; });
    return map;
  }
  function setAllResaltados(map) {
    cached.resaltados = Object.entries(map).map(([ref, color]) => ({
      id: ref, ubicacion: { tipo: 'biblia', ref }, color, texto: ''
    }));
    cached.fecha_guardado = new Date().toISOString();
    persist();
  }

  // ---- Notas (una por ubicación: libro+capítulo en Biblia, id de entrada en
  // Historia/Padres). tipo por defecto 'biblia' para no romper las llamadas
  // existentes (VerboBackup.getNota(ref)/setNota(ref,texto) siguen funcionando
  // igual). titulo/contexto son aditivos: notas viejas simplemente no los
  // tienen hasta que el usuario las edite o hasta que Notas de Historia/Padres
  // los use para no tener que recargar todo el volumen solo para listar. ----
  function getNota(ref, tipo = 'biblia') {
    return cached.notas.find(n => n.ubicacion?.tipo === tipo && n.ubicacion.ref === ref)?.texto || '';
  }
  // Objeto completo (incluye titulo/contexto) — getNota() solo devuelve el
  // texto para no romper las llamadas existentes que esperan un string.
  function getNotaObj(ref, tipo = 'biblia') {
    return cached.notas.find(n => n.ubicacion?.tipo === tipo && n.ubicacion.ref === ref) || null;
  }
  function setNota(ref, texto, { tipo = 'biblia', titulo, contexto } = {}) {
    const existing = cached.notas.find(n => n.ubicacion?.tipo === tipo && n.ubicacion.ref === ref);
    if (existing) {
      existing.texto = texto;
      existing.fecha = new Date().toISOString();
      if (titulo !== undefined) existing.titulo = titulo;
      if (contexto !== undefined) existing.contexto = contexto;
    } else {
      cached.notas.push({
        id: tipo === 'biblia' ? ref : `${tipo}:${ref}`,
        ubicacion: { tipo, ref }, texto, fecha: new Date().toISOString(),
        ...(titulo !== undefined ? { titulo } : {}),
        ...(contexto !== undefined ? { contexto } : {}),
      });
    }
    cached.fecha_guardado = new Date().toISOString();
    persist();
  }
  // Lista de notas con texto real (para el índice de "Notas de Historia y
  // Padres" — nunca se usa para Biblia, que sigue siendo un textarea único).
  function getNotas(tipos = null) {
    return cached.notas.filter(n => n.texto?.trim() && (!tipos || tipos.includes(n.ubicacion?.tipo)));
  }
  function deleteNota(ref, tipo = 'biblia') {
    const idx = cached.notas.findIndex(n => n.ubicacion?.tipo === tipo && n.ubicacion.ref === ref);
    if (idx < 0) return;
    cached.notas.splice(idx, 1);
    cached.fecha_guardado = new Date().toISOString();
    persist();
  }
  // ---- Notas rápidas (varias por ubicación — a diferencia de setNota/getNota
  // de arriba, que son "una nota por ubicación" para Biblia y el editor
  // embebido de Padres). Usado por el modal "Nota rápida" de Historia de la
  // Iglesia: cada Guardar agrega un registro nuevo con id propio en vez de
  // sobreescribir el que ya existiera para ese ref. ----
  function addNota(ref, texto, { tipo = 'historia', titulo, contexto } = {}) {
    const nota = {
      id: `${tipo}:${ref}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      ubicacion: { tipo, ref }, texto, fecha: new Date().toISOString(),
      ...(titulo !== undefined ? { titulo } : {}),
      ...(contexto !== undefined ? { contexto } : {}),
    };
    cached.notas.push(nota);
    cached.fecha_guardado = new Date().toISOString();
    persist();
    return nota;
  }
  function getNotaById(id) {
    return cached.notas.find(n => n.id === id) || null;
  }
  function deleteNotaById(id) {
    const idx = cached.notas.findIndex(n => n.id === id);
    if (idx < 0) return;
    cached.notas.splice(idx, 1);
    cached.fecha_guardado = new Date().toISOString();
    persist();
  }

  // ---- Marcadores (capítulo/sección completo, sin texto — Historia/Padres).
  // Reusa el array 'marcadores' ya reservado en emptyData/init/replaceData,
  // sin usar todavía por ningún getter/setter antes de esto. ----
  // Guardas defensivas contra cached===null (init() todavía no resolvió):
  // devuelven el default más seguro en vez de tirar, para quien llame antes
  // de tiempo por error -- las llamadas normales siempre esperan init() y
  // nunca deberían pasar por acá.
  function getMarcadores(tipo = null) {
    if (!cached) return [];
    return tipo ? cached.marcadores.filter(m => m.ubicacion?.tipo === tipo) : [...cached.marcadores];
  }
  function isMarcado(tipo, ref) {
    return !!cached && cached.marcadores.some(m => m.ubicacion?.tipo === tipo && m.ubicacion.ref === ref);
  }
  // Devuelve true si quedó marcado, false si se desmarcó (o si cached
  // todavía no cargó -- ver comentario de arriba).
  function toggleMarcador(tipo, ref, contexto) {
    if (!cached) return false;
    const idx = cached.marcadores.findIndex(m => m.ubicacion?.tipo === tipo && m.ubicacion.ref === ref);
    if (idx >= 0) cached.marcadores.splice(idx, 1);
    else cached.marcadores.push({ id: `${tipo}:${ref}`, ubicacion: { tipo, ref }, fecha: new Date().toISOString(), ...(contexto ? { contexto } : {}) });
    cached.fecha_guardado = new Date().toISOString();
    persist();
    return idx < 0;
  }
  // Actualiza el contexto de un marcador YA existente sin tocar si está
  // marcado o no (a diferencia de toggleMarcador). Pensado para "Mi
  // biblioteca" (Librería): cada vez que se reabre un libro ya guardado se
  // pisa contexto.lastOpenedAt, así /libreria/mi-biblioteca/ puede ordenar
  // por lectura más reciente sin inventar un progreso de lectura real. No
  // hace nada si el marcador no existe.
  // A propósito NO mueve fecha_guardado: guardar/borrar el libro (vía
  // toggleMarcador) ya sella el reloj de sync una sola vez, como cualquier
  // otro cambio de contenido real. Reabrir un libro es una acción pasiva
  // (pasa cada vez que se entra al lector) y no debe competir por el
  // "último en escribir gana" contra ediciones reales en otro dispositivo
  // -- mismo bug de fondo que el de fecha_guardado documentado arriba en
  // persist(), 2026-07-30.
  function updateMarcadorContexto(tipo, ref, contexto) {
    if (!cached) return false;
    const m = cached.marcadores.find(m => m.ubicacion?.tipo === tipo && m.ubicacion.ref === ref);
    if (!m) return false;
    m.contexto = { ...(m.contexto || {}), ...contexto };
    persist();
    return true;
  }

  // ---- Prédicas (modo Preparación de Bosquejo/Estudio) ----
  function firstLineFromHtml(html) {
    const text = String(html || '')
      .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines[0] || '';
  }
  function defaultPredicaTitulo(contenido) {
    const first = firstLineFromHtml(contenido);
    if (first) return first.slice(0, 120);
    const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    return `Prédica sin título — ${fecha}`;
  }
  function getPredicas() {
    return [...cached.predicas].sort((a, b) => (b.fecha_edicion || '').localeCompare(a.fecha_edicion || ''));
  }
  function getPredica(id) {
    return cached.predicas.find(p => p.id === id) || null;
  }
  // Upsert: si viene id y existe, actualiza esa entrada; si no, crea una nueva.
  // Es la única vía de escritura para prédicas — la llama el botón "Guardar"
  // explícito del modo sermón, nunca un autoguardado (no existe todavía).
  function savePredica({ id, titulo, contenido, pasaje_base }) {
    const now = new Date().toISOString();
    let entry = id ? cached.predicas.find(p => p.id === id) : null;
    if (!entry) {
      entry = {
        id: id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        fecha_creacion: now
      };
      cached.predicas.push(entry);
    }
    entry.contenido = contenido || '';
    entry.pasaje_base = pasaje_base || '';
    entry.titulo = (titulo && String(titulo).trim()) || defaultPredicaTitulo(entry.contenido);
    entry.fecha_edicion = now;
    cached.fecha_guardado = now;
    persist();
    return entry;
  }
  function deletePredica(id) {
    cached.predicas = cached.predicas.filter(p => p.id !== id);
    cached.fecha_guardado = new Date().toISOString();
    persist();
  }

  // ---- Posición de lectura ----
  // `version` (id de Biblia activa) viaja junto a libro/capítulo desde 2026-08:
  // es la forma más simple de sincronizar la Biblia elegida entre dispositivos
  // sin un mecanismo nuevo, reusando el mismo campo que ya sincroniza posición
  // de lectura (ver VerboSync push/pull + reconcile).
  function getPosicionBiblia() { return cached.posicion_lectura?.biblia || null; }
  function setPosicionBiblia(libro, capitulo, version) {
    cached.posicion_lectura.biblia = { libro, capitulo, version: version || cached.posicion_lectura?.biblia?.version || null };
    persist();
  }

  // ---- Puente Filesystem nativo (solo dentro del wrapper Capacitor de
  // iOS/Android, NO es File System Access API). IndexedDB puede ser purgado
  // por iOS tras ~7 días sin uso (política antitracking de WKWebView); este
  // escrito en el sandbox nativo de la app no está sujeto a esa purga. No
  // pide ningún permiso ni muestra diálogo — es el sandbox propio de la app,
  // no una carpeta arbitraria del usuario.
  let capacitorSaveTimer = null;
  function isCapacitorNative() {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  }
  async function writeToCapacitorFS() {
    const FS = window.Capacitor?.Plugins?.Filesystem;
    if (!FS) return false;
    try {
      await FS.writeFile({
        path: FILE_NAME,
        data: JSON.stringify(cached, null, 2),
        directory: 'DOCUMENTS',
        encoding: 'utf8'
      });
      return true;
    } catch { return false; }
  }
  function scheduleCapacitorWrite() {
    if (!isCapacitorNative()) return;
    clearTimeout(capacitorSaveTimer);
    capacitorSaveTimer = setTimeout(() => { writeToCapacitorFS().catch(() => {}); }, 3000);
  }

  async function saveNow() {
    await persist();
    if (isCapacitorNative()) return writeToCapacitorFS();
    return true;
  }

  // ---- Exportar / Importar (respaldo manual explícito, universal) ----
  function exportDownload() {
    // Se sella ANTES de armar el blob para que el propio archivo descargado
    // quede con su fecha de exportación correcta (útil si luego se importa
    // en otro dispositivo). No mueve fecha_guardado: exportar no es una
    // edición de contenido, mismo criterio que posicion_lectura.
    cached.ultima_exportacion = new Date().toISOString();
    const blob = new Blob([JSON.stringify(cached, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = FILE_NAME;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    persist();
  }

  async function importFromFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    cached = { ...emptyData(), ...parsed };
    for (const campo of ['notas', 'resaltados', 'marcadores', 'predicas']) if (!Array.isArray(cached[campo])) cached[campo] = [];
    await idbSet(DATA_KEY, cached);
    return cached;
  }

  return {
    init, getData, saveNow,
    getResaltadosMap, setAllResaltados,
    getNota, setNota, getNotas, getNotaObj, deleteNota,
    addNota, getNotaById, deleteNotaById,
    getMarcadores, isMarcado, toggleMarcador, updateMarcadorContexto,
    getPredicas, getPredica, savePredica, deletePredica,
    getPosicionBiblia, setPosicionBiblia,
    exportDownload, importFromFile,
    isCapacitorNative,
    onPersist, replaceData
  };
})();
