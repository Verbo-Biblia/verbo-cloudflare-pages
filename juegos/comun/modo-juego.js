/* Modo juego de Verbo: el entorno común de todos los juegos en /juegos/<id>/jugar/.
 *
 * Uso (en el index.html del juego, al final del <body>):
 *   <script src="/juegos/comun/modo-juego.js" data-ficha="/juegos/<id>/" data-orientacion="horizontal" defer></script>
 *
 * - data-ficha: a dónde lleva «Salir» (la ficha del juego en la web). Por defecto, /juegos/.
 * - data-orientacion: horizontal | vertical | libre (por defecto libre).
 * - data-salir: arriba-izquierda (por defecto) | arriba-derecha | abajo-izquierda | abajo-derecha, para no tapar
 *   botones del propio juego.
 *
 * En teléfonos y tabletas: al primer toque pasa a pantalla completa y, si el juego es horizontal o vertical, fija
 * esa orientación (Android); si no se puede fijar y el teléfono está al revés, pide girarlo. Siempre hay un botón
 * «✕» para salir a la web. Evita el zoom por doble toque y el «tirar para recargar». En computadora solo agrega el
 * botón de salir. El juego puede consultar window.VerboModoJuego (movil, pantallaCompleta()).
 */
(function () {
  'use strict';
  if (window.VerboModoJuego) return;
  var script = document.currentScript || document.querySelector('script[src*="modo-juego.js"]');
  var ds = (script && script.dataset) || {};
  var ficha = ds.ficha || '/juegos/';
  var orientacion = ds.orientacion || 'libre';
  var lugar = ds.salir || 'arriba-izquierda';
  var ingles = /^en\b/i.test(document.documentElement.lang || '') || /[?&]lang=en\b/.test(location.search);
  var movil = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  var T = ingles
    ? { salir: 'Exit to Verbo', girar: 'Turn your phone', girarH: 'This game is played in landscape.', girarV: 'This game is played in portrait.', seguir: 'Play anyway' }
    : { salir: 'Salir a Verbo', girar: 'Gira tu teléfono', girarH: 'Este juego se juega en horizontal.', girarV: 'Este juego se juega en vertical.', seguir: 'Jugar así' };

  var css = document.createElement('style');
  css.textContent =
    '.mj-salir{position:fixed;z-index:2147483000;display:flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 10px;' +
    'border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(10,20,35,.55);color:#fff;' +
    'font:600 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none;-webkit-backdrop-filter:blur(6px);' +
    'backdrop-filter:blur(6px);opacity:.78;-webkit-tap-highlight-color:transparent;cursor:pointer}' +
    '.mj-salir:hover,.mj-salir:focus-visible{opacity:1}.mj-salir b{font-size:16px;font-weight:700}' +
    '.mj-movil .mj-salir span{display:none}.mj-movil .mj-salir{width:40px;height:40px;padding:0;justify-content:center}' +
    '.mj-arriba-izquierda{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left))}' +
    '.mj-arriba-derecha{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right))}' +
    '.mj-abajo-izquierda{bottom:max(8px,env(safe-area-inset-bottom));left:max(8px,env(safe-area-inset-left))}' +
    '.mj-abajo-derecha{bottom:max(8px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right))}' +
    '.mj-girar{position:fixed;inset:0;z-index:2147482999;display:none;flex-direction:column;align-items:center;' +
    'justify-content:center;gap:14px;padding:24px;text-align:center;background:#0a1423;color:#fff;' +
    'font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.mj-girar.mj-ver{display:flex}.mj-girar i{font-style:normal;font-size:56px;animation:mj-gira 2.4s ease-in-out infinite}' +
    '.mj-girar strong{font-size:22px}.mj-girar button{margin-top:6px;border:1px solid rgba(255,255,255,.4);' +
    'background:none;color:#fff;border-radius:999px;padding:9px 18px;font:inherit;font-size:14px}' +
    '@keyframes mj-gira{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(90deg)}}' +
    // Sin touch-action en el body: los juegos que manejan arrastres o pellizcos ponen el suyo (none) y no se pisa.
    'html.mj-movil,html.mj-movil body{overscroll-behavior:none;-webkit-text-size-adjust:100%}' +
    '.mj-salir,.mj-girar{touch-action:manipulation}';
  document.head.appendChild(css);
  if (movil) document.documentElement.classList.add('mj-movil');

  function pantallaCompleta() {
    var el = document.documentElement;
    var pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!pedir || document.fullscreenElement || document.webkitFullscreenElement) return Promise.resolve();
    try {
      return Promise.resolve(pedir.call(el, { navigationUI: 'hide' })).then(fijarOrientacion).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }
  function fijarOrientacion() {
    if (orientacion === 'libre' || !screen.orientation || !screen.orientation.lock) return;
    screen.orientation.lock(orientacion === 'horizontal' ? 'landscape' : 'portrait').catch(function () {});
  }
  function salirPantallaCompleta() {
    var salir = document.exitFullscreen || document.webkitExitFullscreen;
    if (salir && (document.fullscreenElement || document.webkitFullscreenElement)) {
      try { salir.call(document); } catch (e) {}
    }
  }

  var aviso = null, ignorarGiro = false;
  function revisarGiro() {
    if (!aviso) return;
    var horizontal = window.innerWidth > window.innerHeight;
    var mal = !ignorarGiro && ((orientacion === 'horizontal' && !horizontal) || (orientacion === 'vertical' && horizontal));
    aviso.classList.toggle('mj-ver', mal);
  }

  function montar() {
    var a = document.createElement('a');
    a.className = 'mj-salir mj-' + lugar;
    a.href = ficha;
    a.setAttribute('aria-label', T.salir);
    a.title = T.salir;
    a.innerHTML = '<b aria-hidden="true">✕</b><span>' + T.salir + '</span>';
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      salirPantallaCompleta();
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      location.href = ficha;
    });
    document.body.appendChild(a);

    if (movil && orientacion !== 'libre') {
      aviso = document.createElement('div');
      aviso.className = 'mj-girar';
      aviso.setAttribute('role', 'dialog');
      aviso.innerHTML = '<i aria-hidden="true">📱</i><strong>' + T.girar + '</strong><span>' +
        (orientacion === 'horizontal' ? T.girarH : T.girarV) + '</span><button type="button">' + T.seguir + '</button>';
      aviso.querySelector('button').addEventListener('click', function () { ignorarGiro = true; revisarGiro(); });
      aviso.addEventListener('pointerdown', function () { pantallaCompleta(); });
      document.body.appendChild(aviso);
      window.addEventListener('resize', revisarGiro);
      window.addEventListener('orientationchange', revisarGiro);
      revisarGiro();
    }

    if (movil) {
      // El primer toque (un gesto del jugador) es el único momento en que el navegador permite pantalla completa.
      var primero = function () {
        pantallaCompleta();
        document.removeEventListener('pointerup', primero, true);
        document.removeEventListener('touchend', primero, true);
      };
      document.addEventListener('pointerup', primero, true);
      document.addEventListener('touchend', primero, true);
      // Evitar el zoom con dos dedos fuera del juego en iOS (que ignora user-scalable=no).
      document.addEventListener('gesturestart', function (ev) { ev.preventDefault(); }, { passive: false });
    }
  }

  window.VerboModoJuego = { movil: movil, pantallaCompleta: pantallaCompleta, orientacion: orientacion };
  // Medición anónima para el panel privado (qué juego, cuánto tiempo, si hubo interacción).
  if (!window.VerboMedir && !document.querySelector('script[src*="/assets/medir.js"]')) {
    var m = document.createElement('script'); m.src = '/assets/medir.js?v=20261029'; m.defer = true; document.head.appendChild(m);
  }
  if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
