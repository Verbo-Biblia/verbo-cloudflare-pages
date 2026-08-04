/* Modal de "nota rápida" para el panel de lectura de Historia de la Iglesia.
   Componente aditivo y autocontenido: no toca module-loader.js. Se expone
   como window.VerboHistoriaNotaRapida.openForCurrentEntry() para que el
   ícono lateral "Notas de Historia" (listener en app.js) lo dispare cuando
   hay un libro abierto en lectura, en vez de navegar al panel de notas
   guardadas — ese es hoy el único punto de entrada a este modal.
   Reutiliza window.VerboBackup.setNota()/getNotaObj() — mismo array 'notas'
   (tipo:'historia') que ya usa el panel "Notas de Historia" — así que una
   nota guardada acá aparece igual ahí, sin estructura de datos nueva.

   ref/obra/capítulo de la entrada actual se leen del DOM ya renderizado
   (data-entry-id, .dict-entry__source, título) en vez de llamar a las
   funciones internas de app.js (churchHistoryBookLabel/churchHistoryTocRowLabel),
   que viven dentro de su propia IIFE y no están expuestas fuera de ella. */
(() => {
  const TIPO = 'historia';

  function tr(key, fallback) {
    return (window.VerboI18n && window.VerboI18n.t(key)) || fallback;
  }

  // Deriva el mismo "capítulo" que churchHistoryTocRowLabel(entry) en app.js:
  // el título completo trae el patrón "Obra — Capítulo…"; si no hay em dash
  // (título corto/atípico), se usa el título entero tal cual (mismo fallback).
  function splitCapitulo(rawTitle) {
    const parts = String(rawTitle || '').split(' — ');
    return parts.length > 1 ? parts.slice(1).join(' — ') : rawTitle;
  }

  function currentEntryInfo() {
    const termEl = document.querySelector('#panelBody .dict-entry__term[data-entry-id]');
    if (!termEl) return null;
    const ref = termEl.getAttribute('data-entry-id');
    if (!ref) return null;
    const sourceEl = document.querySelector('#panelBody .dict-entry__source');
    const obra = sourceEl ? sourceEl.textContent.trim() : '';
    const capitulo = splitCapitulo(termEl.textContent || '');
    return { ref, obra, capitulo };
  }

  let overlay = null, titleInput, textArea, statusEl, contextEl, saveBtn, closeBtn, headingEl;
  let lastFocused = null, currentRef = null, currentContexto = null;

  function applyLabels() {
    if (!overlay) return;
    headingEl.textContent = tr('historiaNotas.notaRapida', 'Nota rápida');
    closeBtn.setAttribute('aria-label', tr('historiaNotas.cerrarAria', 'Cerrar nota rápida'));
    titleInput.placeholder = tr('historiaNotas.tituloPlaceholder', 'Título de la nota (opcional)');
    textArea.placeholder = tr('historiaNotas.notaPlaceholder', 'Escribe aquí tu observación…');
    saveBtn.textContent = tr('historiaNotas.guardar', 'Guardar');
  }

  function buildOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'hnr-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="hnr-modal" role="dialog" aria-modal="true" aria-labelledby="hnrModalTitle">
        <div class="hnr-modal__header">
          <h3 id="hnrModalTitle"></h3>
          <button type="button" class="hnr-modal__close" id="hnrCloseBtn">×</button>
        </div>
        <div class="hnr-modal__context" id="hnrContext"></div>
        <input type="text" id="hnrTitleInput" class="hnr-modal__title-input">
        <textarea id="hnrTextArea" class="hnr-modal__textarea"></textarea>
        <div class="hnr-modal__footer">
          <span class="hnr-modal__status" id="hnrStatus"></span>
          <button type="button" class="hnr-modal__save" id="hnrSaveBtn"></button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    headingEl = overlay.querySelector('#hnrModalTitle');
    titleInput = overlay.querySelector('#hnrTitleInput');
    textArea = overlay.querySelector('#hnrTextArea');
    statusEl = overlay.querySelector('#hnrStatus');
    contextEl = overlay.querySelector('#hnrContext');
    saveBtn = overlay.querySelector('#hnrSaveBtn');
    closeBtn = overlay.querySelector('#hnrCloseBtn');

    saveBtn.addEventListener('click', save);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });

    applyLabels();
  }

  function save() {
    if (!currentRef) return;
    window.VerboBackup.setNota(currentRef, textArea.value, {
      tipo: TIPO, titulo: titleInput.value, contexto: currentContexto,
    });
    statusEl.textContent = tr('historiaNotas.guardado', 'Guardado');
  }

  function open(info) {
    buildOverlay();
    applyLabels(); // por si cambió el idioma desde la última apertura
    currentRef = info.ref;
    currentContexto = { obra: info.obra, capitulo: info.capitulo };
    const existing = window.VerboBackup.getNotaObj(info.ref, TIPO);
    titleInput.value = (existing && existing.titulo) || '';
    textArea.value = (existing && existing.texto) || '';
    statusEl.textContent = (existing && existing.texto) ? tr('historiaNotas.guardado', 'Guardado') : '';
    contextEl.textContent = [info.obra, info.capitulo].filter(Boolean).join(' · ');
    lastFocused = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => titleInput.focus());
  }

  function close() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // Punto de entrada único: app.js llama a esto desde el listener del ícono
  // lateral "Notas de Historia" cuando detecta un libro abierto en lectura.
  function openForCurrentEntry() {
    const info = currentEntryInfo();
    if (info) open(info);
  }
  window.VerboHistoriaNotaRapida = { openForCurrentEntry };

  function init() {
    document.addEventListener('verbo:uilang-changed', applyLabels);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
