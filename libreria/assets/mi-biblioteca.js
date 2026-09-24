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

  // ---- Dentro de la app Android: Mi biblioteca vive en la APP ----
  // (Nueva App Android, src/libros/biblioteca.ts). Guardar el libro y el
  // marcador de capítulo se le avisan por postMessage y la app los guarda
  // como enlaces (y los respalda en el Google Drive del usuario); aquí no
  // se toca VerboBackup. site-chrome.js (cargado antes) deja marcado
  // window.name al abrir la primera página dentro de la app.
  var libroActual = window.__LIBRERIA_BOOK__;
  var enApp = window.top !== window.self && String(window.name).split("|")[0] === "verboEmbedApp";
  if (enApp && libroActual && libroActual.id) {
    var ORIGEN_APP = "https://localhost";
    var estado = { guardado: false, marcador: null };
    var avisar = function (extra) {
      var msg = { type: "verbo:biblioteca-libro", id: libroActual.id, titulo: libroActual.title || "", url: location.pathname + location.hash };
      for (var k in extra) msg[k] = extra[k];
      window.parent.postMessage(msg, ORIGEN_APP);
    };
    var listo = new Promise(function (resolve) {
      window.addEventListener("message", function (e) {
        if (e.source !== window.parent || e.origin !== ORIGEN_APP) return;
        var d = e.data;
        if (!d || d.type !== "verbo:biblioteca-estado" || d.id !== libroActual.id) return;
        estado = { guardado: !!d.guardado, marcador: typeof d.marcador === "number" ? d.marcador : null };
        resolve();
      });
      window.parent.postMessage({ type: "verbo:biblioteca-pedir", id: libroActual.id }, ORIGEN_APP);
      setTimeout(resolve, 1500); // app vieja o sin respuesta: se sigue sin datos
    });
    // Cada cambio de capítulo actualiza el enlace de "seguir leyendo".
    window.addEventListener("hashchange", function () { avisar({}); });

    window.VerboMiBiblioteca = {
      enApp: true,
      ready: function () { return listo; },
      has: function () { return estado.guardado; },
      add: function () { estado.guardado = true; avisar({ guardado: true }); },
      remove: function () { estado.guardado = false; avisar({ guardado: false }); },
      toggle: function () { estado.guardado = !estado.guardado; avisar({ guardado: estado.guardado }); return estado.guardado; },
      touchOpened: function () { avisar({}); },
      sortedIds: function () { return []; },
      // bookmark del lector ({ chapter } desde 0) o null.
      marcador: function (id, bookmark) {
        estado.marcador = bookmark ? bookmark.chapter + 1 : null;
        avisar({ marcador: estado.marcador });
      },
      // Capítulo marcado según la app (desde 1), o null.
      marcadorGuardado: function () { return estado.marcador; }
    };
    return;
  }

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
