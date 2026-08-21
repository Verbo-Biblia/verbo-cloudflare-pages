/* Modal de "tutorial en video" para los 4 íconos fijos de tutorial (portada,
   área de lectura, barra lateral izquierda, barra lateral derecha — ver
   tutorial-video.css). Mismo patrón que historia-nota-rapida.js: overlay
   position:fixed autocontenido, z-index 3000, cierre con backdrop/×/Escape.
   Componente aditivo: no depende de app.js más allá de leer botones por id,
   así que también puede cargarse desde index.html (portada), donde app.js
   no existe.

   Cada ícono declara su propio par de IDs de YouTube vía data-video-es/
   data-video-en en el HTML; el ID correcto se resuelve recién al hacer clic,
   según VerboI18n.getUiLang() en ese momento — no hay que pre-renderizar
   ambos ni reaccionar a cambios de idioma mientras el modal está abierto. */
(() => {
  function tr(key, fallback) {
    return (window.VerboI18n && window.VerboI18n.t(key)) || fallback;
  }

  let overlay = null, frame = null, closeBtn = null, lastFocused = null;

  function buildOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'tv-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="tv-modal" role="dialog" aria-modal="true" aria-label="${tr('tutorial.modalAria', 'Tutorial en video')}">
        <button type="button" class="tv-modal__close" id="tvModalCloseBtn">×</button>
        <div class="tv-modal__frame">
          <iframe id="tvModalIframe" src="" title="${tr('tutorial.modalAria', 'Tutorial en video')}"
            frameborder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen></iframe>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    frame = overlay.querySelector('#tvModalIframe');
    closeBtn = overlay.querySelector('#tvModalCloseBtn');
    closeBtn.setAttribute('aria-label', tr('tutorial.cerrarAria', 'Cerrar'));

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  }

  function open(videoIdEs, videoIdEn) {
    buildOverlay();
    const lang = (window.VerboI18n && window.VerboI18n.getUiLang()) || 'es';
    const videoId = (lang === 'en' && videoIdEn) ? videoIdEn : videoIdEs;
    if (!videoId) return;
    closeBtn.setAttribute('aria-label', tr('tutorial.cerrarAria', 'Cerrar'));
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => closeBtn.focus());
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    // Vacía el src (no solo oculta el overlay) para que el video deje de
    // sonar/reproducirse en segundo plano tras cerrar.
    frame.src = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function wireTrigger(btn) {
    btn.addEventListener('click', () => open(btn.dataset.videoEs, btn.dataset.videoEn));
  }

  function init() {
    document.querySelectorAll('.tv-trigger[data-video-es]').forEach(wireTrigger);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VerboTutorialVideo = { open };
})();
