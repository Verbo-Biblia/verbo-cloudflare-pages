/* Anuncios de los juegos de Verbo (H5 Games Ads de Google, «Ad Placement API»). PREPARADO Y APAGADO.

   API propia, la misma en todos los juegos:
     VerboAds.init({ juego, infantil })            → una vez, al cargar el juego.
     VerboAds.pausa(nombre, tipo?)                 → pausa natural (entre niveles, fin de partida, volver al menú).
                                                     Devuelve una promesa que se cumple cuando el juego puede seguir.
     VerboAds.recompensa(nombre, alObtener, alCancelar) → anuncio opcional que el jugador elige (pista, vida extra).
     VerboAds.recompensaDisponible()               → true solo si se puede ofrecer; si es false, ocultar el botón.
     VerboAds.sonido(activo)                       → avisar a Google si el juego tiene el sonido encendido.
   Eventos en window: «verboads:inicio» (pausar y silenciar el juego) y «verboads:fin» (reanudar).

   Mientras VERBO_H5_ACTIVO sea false no se carga nada de Google: pausa() sigue de inmediato y recompensa() llama a
   alCancelar. Para encenderlo, cambiar SOLO esa constante (ver juegos/LEEME.md).

   Documentación seguida (consultada el 2026-10-23):
   https://developers.google.com/ad-placement/docs/html5-game-structure  (etiqueta y adBreak/adConfig)
   https://developers.google.com/ad-placement/apis/adbreak               (tipos, callbacks, breakStatus)
   https://developers.google.com/ad-placement/apis/adconfig              (preloadAdBreaks, sound, onReady)
   https://developers.google.com/ad-placement/docs/placement-types       (reglas de cada tipo)
   Contenido infantil: AdSense usa hoy «tag for age treatment» (data-tag-for-age-treatment="1") en los bloques de
   anuncio (support.google.com/adsense/answer/3248194), pero la Ad Placement API no documenta una opción equivalente.
   Por eso, mientras VERBO_H5_INFANTIL sea false, los juegos marcados como infantiles NO muestran anuncios. */
(function () {
  'use strict';
  // ─── Interruptores ───────────────────────────────────────────────────────────────────────────────────────────
  const VERBO_H5_ACTIVO = false;     // ← el único cambio para encender los anuncios de juegos
  const VERBO_H5_INFANTIL = false;   // anuncios en juegos infantiles: solo si Google documenta cómo marcarlos
  const VERBO_H5_PRUEBA = false;     // true: anuncios de prueba de Google (data-adbreak-test="on")
  const CLIENTE = 'ca-pub-4810728953852074';
  const FRECUENCIA = '60s';          // data-ad-frequency-hint: tiempo mínimo entre anuncios de pausa

  let encendido = false, listo = false, enCurso = false, iniciado = false;
  const emitir = (tipo, detalle) => window.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));

  // Dentro de la app Android (iframe con window.name «verboEmbedApp…») no hay anuncios de AdSense.
  const enApp = () => /^verboEmbedApp/.test(window.name || '') || /[?&]verboEmbed=app\b/.test(location.search);

  async function esInfantil(juego) {
    try {
      const r = await fetch('/juegos/catalogo.json', { cache: 'force-cache' });
      const c = await r.json();
      const g = (c.juegos || []).find(x => x.id === juego);
      return g ? !!g.infantil : true;   // si no se encuentra, se trata como infantil (lo más prudente)
    } catch (e) { return true; }
  }

  function cargarGoogle() {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENTE;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-ad-frequency-hint', FRECUENCIA);
    if (VERBO_H5_PRUEBA) s.setAttribute('data-adbreak-test', 'on');
    document.head.appendChild(s);
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on', onReady: () => { listo = true; } });
  }

  const VerboAds = {
    async init(opciones) {
      if (iniciado) return;
      iniciado = true;
      const o = opciones || {};
      if (!VERBO_H5_ACTIVO || enApp()) return;
      const infantil = typeof o.infantil === 'boolean' ? o.infantil : await esInfantil(o.juego);
      if (infantil && !VERBO_H5_INFANTIL) return;
      encendido = true;
      cargarGoogle();
    },

    // tipo: 'next' (entre niveles, por defecto), 'pause' (el jugador pausa), 'start' (antes de jugar, con la
    // interfaz ya visible) o 'browse' (mirando menús). Nunca en medio del juego.
    pausa(nombre, tipo) {
      if (!encendido || enCurso) return Promise.resolve(false);
      return new Promise(resolver => {
        enCurso = true;
        window.adBreak({
          type: tipo || 'next',
          name: nombre,
          beforeAd: () => emitir('verboads:inicio', { nombre }),
          afterAd: () => emitir('verboads:fin', { nombre }),
          adBreakDone: info => { enCurso = false; resolver(info && info.breakStatus === 'viewed'); }
        });
      });
    },

    recompensaDisponible() { return encendido && listo; },

    // Solo se llama cuando el jugador tocó el botón de la recompensa (opcional, siempre a elección del jugador).
    recompensa(nombre, alObtener, alCancelar) {
      const cancelar = typeof alCancelar === 'function' ? alCancelar : () => {};
      if (!encendido || enCurso) { cancelar(); return; }
      let resuelto = false;
      const fin = f => { if (!resuelto) { resuelto = true; f(); } };
      enCurso = true;
      window.adBreak({
        type: 'reward',
        name: nombre,
        beforeAd: () => emitir('verboads:inicio', { nombre }),
        afterAd: () => emitir('verboads:fin', { nombre }),
        beforeReward: mostrar => mostrar(),   // el jugador ya lo pidió con su toque
        adDismissed: () => fin(cancelar),
        adViewed: () => fin(typeof alObtener === 'function' ? alObtener : () => {}),
        adBreakDone: () => { enCurso = false; fin(cancelar); }
      });
    },

    sonido(activo) { if (encendido) window.adConfig({ sound: activo ? 'on' : 'off' }); },

    get activo() { return encendido; }
  };

  window.VerboAds = VerboAds;
})();
