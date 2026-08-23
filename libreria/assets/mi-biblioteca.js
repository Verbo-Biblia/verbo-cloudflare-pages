/* ============================================================
   Verbo — Librería: "Mi biblioteca" (capa personal de lectura).
   Guarda solo el id/slug del libro (como marcador tipo "libreria-libro" en
   el sistema de respaldo/sincronización ya existente, biblia/assets/
   backup.js + sync.js) -- nunca título, autor ni portada: esos siempre se
   leen del catálogo real (/libreria/), nunca se duplican acá.

   Reutiliza la capa común de persistencia de Verbo a propósito (no una
   clave de localStorage aparte): así, si el usuario ya vinculó su email en
   /ajustes/, Mi biblioteca sincroniza sola entre sus dispositivos junto con
   sus notas/resaltados/marcadores, sin pedirle nada nuevo. Si no vinculó
   nada, VerboBackup sigue guardando en IndexedDB de este dispositivo -- la
   función no depende de que exista sincronización.

   Requiere que biblia/assets/backup.js (y opcionalmente sync.js, para que
   además viaje entre dispositivos) estén cargados ANTES que este script.
   ============================================================ */
(function () {
  "use strict";

  var TIPO = "libreria-libro";

  function backupReady() {
    return window.VerboBackup ? window.VerboBackup.init() : Promise.resolve(null);
  }

  function has(id) {
    return !!(window.VerboBackup && window.VerboBackup.isMarcado(TIPO, id));
  }

  function add(id) {
    if (!window.VerboBackup || has(id)) return;
    window.VerboBackup.toggleMarcador(TIPO, id, { lastOpenedAt: new Date().toISOString() });
  }

  function remove(id) {
    if (!window.VerboBackup || !has(id)) return;
    window.VerboBackup.toggleMarcador(TIPO, id);
  }

  // true = quedó guardado, false = se quitó.
  function toggle(id) {
    if (!window.VerboBackup) return false;
    return window.VerboBackup.toggleMarcador(TIPO, id, { lastOpenedAt: new Date().toISOString() });
  }

  // Se llama cada vez que se reabre un libro YA guardado (no al guardarlo
  // por primera vez, eso ya sella lastOpenedAt vía add()/toggle()).
  function touchOpened(id) {
    if (!window.VerboBackup) return;
    window.VerboBackup.updateMarcadorContexto(TIPO, id, { lastOpenedAt: new Date().toISOString() });
  }

  // Ids ordenados para "continuar leyendo": libro abierto más recientemente
  // primero y, si nunca se reabrió desde que se guardó, por fecha de
  // guardado. No hay progreso de lectura real todavía -- no se inventa uno.
  function sortedIds() {
    if (!window.VerboBackup) return [];
    return window.VerboBackup.getMarcadores(TIPO)
      .slice()
      .sort(function (a, b) {
        var av = Date.parse((a.contexto && a.contexto.lastOpenedAt) || a.fecha || 0) || 0;
        var bv = Date.parse((b.contexto && b.contexto.lastOpenedAt) || b.fecha || 0) || 0;
        return bv - av;
      })
      .map(function (m) { return m.ubicacion.ref; });
  }

  window.VerboMiBiblioteca = {
    ready: backupReady,
    has: has,
    add: add,
    remove: remove,
    toggle: toggle,
    touchOpened: touchOpened,
    sortedIds: sortedIds
  };
})();
