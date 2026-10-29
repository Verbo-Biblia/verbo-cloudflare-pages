/* Medición propia de Verbo (para el panel privado de Juan). Anónima: sin cookies, sin nombres, sin IP.
 * - visitante: un id al azar en localStorage (solo distingue visitas nuevas de recurrentes);
 * - sesión: otro id al azar que dura mientras haya actividad (30 min sin actividad = sesión nueva).
 * Registra: la vista de cada página (con su origen: Google, Pinterest, Facebook…), los clics (qué y dónde),
 * las descargas, el tiempo visible y hasta dónde se leyó, los juegos (inicio, duración, si hubo interacción),
 * los «Me gustó», las búsquedas y la impresión de lecciones. Los eventos se juntan y se mandan en lotes al
 * Worker verbo-api-bible (/v1/m), que los guarda en D1. Lo carga el pie común y el modo de juego.
 * Otros scripts pueden registrar un evento con window.VerboMedir('tipo', {objetivo, detalle}).
 */
(function () {
  'use strict';
  if (window.VerboMedir) return;
  var API = 'https://verbo-api-bible.juanjosevenegas78.workers.dev/v1/m';
  var local = /^(localhost|127\.|\[::1\])/.test(location.hostname);
  // Juan puede excluir sus propios aparatos: abrir una vez verbobiblia.com/?no-medir (y ?medir para volver a contar).
  var q0 = new URLSearchParams(location.search);
  try {
    if (q0.has('no-medir')) localStorage.setItem('verbo-no-medir', '1');
    if (q0.has('medir')) localStorage.removeItem('verbo-no-medir');
  } catch (e) {}
  var excluido = false;
  try { excluido = localStorage.getItem('verbo-no-medir') === '1'; } catch (e) {}
  if (local || excluido || navigator.webdriver || /bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) {
    window.VerboMedir = function () {};
    return;
  }

  function azar() {
    return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 24);
  }
  function leer(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function guardar(s, k, v) { try { s.setItem(k, v); } catch (e) {} }

  var visitante = leer(localStorage, 'verbo-v');
  var nuevo = !visitante;
  if (nuevo) { visitante = azar(); guardar(localStorage, 'verbo-v', visitante); }
  var ahora = Date.now();
  var sesion = leer(sessionStorage, 'verbo-s'), ultima = +leer(localStorage, 'verbo-s-t') || 0;
  if (!sesion || ahora - ultima > 30 * 60 * 1000) { sesion = azar(); guardar(sessionStorage, 'verbo-s', sesion); }
  guardar(localStorage, 'verbo-s-t', String(ahora));

  var ruta = location.pathname;
  var juego = (ruta.match(/^\/juegos\/([a-z0-9-]+)\/jugar\//) || [])[1] || null;
  var ancho = Math.min(screen.width, screen.height);
  var disp = /iPad|Tablet/i.test(navigator.userAgent) || (ancho >= 600 && 'ontouchstart' in window) ? 'tableta'
    : (/Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'movil' : 'pc');
  var idioma = (navigator.language || '').slice(0, 2);

  function origen() {
    var q = new URLSearchParams(location.search);
    var utm = q.get('utm_source');
    if (utm) return utm.toLowerCase().slice(0, 40);
    if (!document.referrer) return '';
    try {
      var h = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (h === location.hostname.replace(/^www\./, '')) return '';
      return h.slice(0, 60);
    } catch (e) { return ''; }
  }

  var cola = [];
  function medir(tipo, datos) {
    datos = datos || {};
    cola.push({ t: Date.now(), tipo: String(tipo).slice(0, 20), ruta: datos.ruta || ruta,
      objetivo: datos.objetivo ? String(datos.objetivo).slice(0, 200) : null,
      detalle: datos.detalle || null, ms: datos.ms != null ? Math.round(datos.ms) : null });
    guardar(localStorage, 'verbo-s-t', String(Date.now()));
    if (cola.length >= 20) enviar();
  }
  function enviar() {
    if (!cola.length) return;
    var lote = JSON.stringify({ v: visitante, s: sesion, nuevo: nuevo, disp: disp, idioma: idioma, e: cola.splice(0, 50) });
    nuevo = false;
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(API, new Blob([lote], { type: 'text/plain' }))) return;
    } catch (e) {}
    try { fetch(API, { method: 'POST', body: lote, keepalive: true, headers: { 'Content-Type': 'text/plain' } }); } catch (e) {}
  }
  window.VerboMedir = medir;

  // Vista de la página, solo cuando de verdad se ve: Facebook y los navegadores precargan páginas en segundo plano
  // (prerender) y esas cargas no son visitas. Si nunca se llega a ver, no se manda nada.
  var visto = false;
  function vista() {
    if (visto || document.visibilityState !== 'visible' || document.prerendering) return;
    visto = true;
    visibleDesde = Date.now();
    medir('vista', { objetivo: document.title.slice(0, 160), detalle: { ref: origen(), w: innerWidth, h: innerHeight } });
    if (juego) medir('juego', { objetivo: juego });
  }

  // Tiempo visible, profundidad de lectura e interacción (para saber si un juego se jugó de verdad)
  var visibleDesde = null, visible = 0, hondo = 0, toques = 0;
  vista();
  document.addEventListener('prerenderingchange', vista);
  function sumar() { if (visibleDesde) { visible += Date.now() - visibleDesde; visibleDesde = null; } }
  addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0) hondo = Math.max(hondo, Math.round(100 * scrollY / h));
  }, { passive: true });
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { toques++; }, { passive: true, capture: true });
  });
  var cerrado = false;
  function cerrar() {
    if (cerrado || !visto) return;
    sumar();
    cerrado = true;
    medir(juego ? 'juego_fin' : 'fin', { objetivo: juego, ms: visible, detalle: { hondo: hondo, toques: toques } });
    enviar();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { sumar(); enviar(); }
    else if (!visto) vista();
    else visibleDesde = Date.now();
  });
  addEventListener('pagehide', cerrar);

  // Clics: qué se tocó y en qué zona de la página
  function zona(el) {
    var z = el.closest('header,nav,footer,aside,main,section,article,dialog,form');
    if (!z) return '';
    return z.tagName.toLowerCase() + (z.id ? '#' + z.id : (z.classList[0] ? '.' + z.classList[0] : ''));
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('a,button,[role="button"],summary,[data-medir]');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var texto = (el.getAttribute('data-medir') || el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    var tipo = 'clic', objetivo = texto;
    if (href) {
      var u;
      try { u = new URL(href, location.href); } catch (e) { u = null; }
      if (u) {
        objetivo = u.origin === location.origin ? u.pathname + (u.hash || '') : u.href;
        if (el.hasAttribute('download') || /\.(jpe?g|png|webp|pdf|zip|apk|exe|deb|appimage|dmg)$/i.test(u.pathname)) tipo = 'descarga';
        else if (u.origin !== location.origin) tipo = 'salida';
      }
    }
    if (/imprimir|print/i.test(texto) && !href) tipo = 'imprimir';
    var x = Math.round(100 * ev.clientX / innerWidth), y = Math.round(100 * (ev.pageY || 0) / Math.max(1, document.documentElement.scrollHeight));
    medir(tipo, { objetivo: objetivo, detalle: { texto: texto, zona: zona(el), x: x, y: y } });
    if (tipo === 'descarga' || tipo === 'salida') enviar();
  }, true);

  // Búsquedas (buscador del banco, juegos, etc.)
  var buscando = null;
  document.addEventListener('input', function (ev) {
    var el = ev.target;
    if (!el.matches || !el.matches('input[type="search"], input[name="q"], input[role="searchbox"], [data-medir-busqueda]')) return;
    clearTimeout(buscando);
    buscando = setTimeout(function () {
      var q = (el.value || '').trim().toLowerCase().slice(0, 80);
      if (q.length >= 3) medir('busqueda', { objetivo: q });
    }, 1500);
  }, true);

  setInterval(enviar, 15000);
})();
