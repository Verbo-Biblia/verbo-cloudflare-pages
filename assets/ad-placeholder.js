/* ============================================================
 * PROTOTIPO VISUAL TEMPORAL — placeholders de futuras ubicaciones de
 * publicidad. NO carga AdSense ni ningún script publicitario real,
 * NO envía datos a ningún servicio externo.
 *
 * Para DESACTIVAR todos los placeholders del sitio: cambiar la
 * constante SHOW_AD_PLACEHOLDERS de abajo a `false`.
 *
 * Para ELIMINAR el prototipo por completo: borrar este archivo,
 * assets/ad-placeholder.css, las etiquetas <link>/<script> que los
 * cargan en cada página, y el marcado con clase "ad-placeholder"
 * insertado en cada plantilla (fácil de ubicar con un grep).
 * ============================================================ */
(function () {
  var SHOW_AD_PLACEHOLDERS = true;

  window.SHOW_AD_PLACEHOLDERS = SHOW_AD_PLACEHOLDERS;
  document.documentElement.setAttribute('data-ad-preview', SHOW_AD_PLACEHOLDERS ? 'on' : 'off');

  if (!SHOW_AD_PLACEHOLDERS) return;

  // Espacio libre mínimo (px) para mostrar un slot "micro" dentro de un
  // encabezado compartido con otros controles (p. ej. título + botón
  // cerrar). El slot mide 120px + 14px de margen a cada lado = 148px de
  // huella real (120x50 = tamaño MÍNIMO real de AdSense, ver
  // .ad-placeholder--micro en ad-placeholder.css); el umbral deja
  // además ~24px de aire de cada lado una vez que
  // justify-content:space-between reparte el resto, para no terminar
  // pegado al título ni al botón de cerrar. Si no alcanza, el slot se
  // oculta en vez de invadir al control vecino.
  var MIN_MICRO_GAP = 196;

  function fitMicroSlots() {
    document.querySelectorAll('[data-ad-fit-container]').forEach(function (container) {
      var slot = container.querySelector(':scope > .ad-placeholder[data-ad-fit]');
      if (!slot) return;
      var used = 0;
      Array.prototype.forEach.call(container.children, function (child) {
        if (child !== slot) used += child.getBoundingClientRect().width;
      });
      var gap = container.getBoundingClientRect().width - used;
      slot.hidden = !(gap >= MIN_MICRO_GAP);
    });
  }

  // Slots "title-row" (Librería/Devocionales): no compiten en una fila
  // flex medible como los de arriba, flotan junto a un <h1> cuyo largo
  // de texto varía por página/idioma. En vez de estimar anchos de
  // fuente a mano (poco confiable), se deja que el navegador renderice
  // el <h1> CON el flotante puesto y se mide si de verdad se partió a
  // más de una línea — si se partió, el hueco no alcanzaba y se oculta.
  function fitTitleFloats() {
    document.querySelectorAll('.ad-placeholder--title-row[data-ad-fit]').forEach(function (slot) {
      var heading = slot.nextElementSibling;
      if (!heading) return;
      slot.hidden = false;
      var lineHeight = parseFloat(getComputedStyle(heading).lineHeight);
      if (!lineHeight || isNaN(lineHeight)) {
        lineHeight = parseFloat(getComputedStyle(heading).fontSize) * 1.3;
      }
      var wrapped = heading.getBoundingClientRect().height > lineHeight * 1.4;
      slot.hidden = wrapped;
    });
  }

  // Banners "in-feed" (Librería/Devocionales, EXPERIMENTAL — ver
  // ad-placeholder.css): recursos/assets/discovery-layout.js reordena el
  // grid en cada carga (oculta la mayoría de las tarjetas y muestra solo
  // 12 elegidas AL AZAR, re-mezcladas en cada visita), así que "el 6to
  // <a> en el HTML" casi nunca es "la 3ra fila que de verdad se ve" — la
  // mayoría de las veces varias de esas 6 están hidden. En vez de contar
  // posiciones en el HTML crudo, se cuentan solo los ítems VISIBLES del
  // grid (mismo criterio .hidden que usan discovery-layout.js/filters.js)
  // y se mueve el propio nodo del anuncio al final de la 3ra fila real,
  // usando el número de columnas ya calculado por el navegador
  // (getComputedStyle) — así funciona igual en 2 columnas (móvil) o
  // 3-4 (tablet/desktop) sin hardcodear breakpoints acá.
  function positionInfeedAds() {
    document.querySelectorAll('.ad-placeholder--infeed[data-ad-infeed]').forEach(function (ad) {
      var grid = ad.parentElement;
      if (!grid) return;
      var items = Array.prototype.filter.call(grid.children, function (el) {
        return el !== ad && !el.hidden;
      });
      var colTracks = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      var cols = colTracks.length || 2;
      var targetCount = cols * 3; // después de 3 filas completas
      if (items.length <= targetCount) {
        // No hay 3 filas completas de contenido visible todavía (p. ej.
        // filtro activo con pocos resultados) — no forzar el anuncio a
        // mitad de una fila incompleta, se oculta.
        ad.hidden = true;
        return;
      }
      ad.hidden = false;
      var afterEl = items[targetCount - 1];
      if (afterEl && afterEl.nextElementSibling !== ad) {
        afterEl.insertAdjacentElement('afterend', ad);
      }
    });
  }

  var scheduled = false;
  function scheduleFit() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      fitMicroSlots();
      fitTitleFloats();
      positionInfeedAds();
    });
  }

  function start() {
    fitMicroSlots();
    fitTitleFloats();
    positionInfeedAds();
    // Observador único sobre <body> (no sobre cada contenedor): algunos
    // encabezados (p. ej. el Asistente de estudio en /biblia/) se
    // reconstruyen enteros con replaceChildren() en cada render, así que
    // el nodo contenedor concreto cambia con el tiempo — observar <body>
    // con subtree:true sigue viendo los reemplazos sin tener que
    // re-suscribirse. attributes+attributeFilter:['hidden'] además
    // detecta cuando filters.js/discovery-layout.js muestran/ocultan
    // tarjetas (usan el atributo "hidden", no agregan/quitan nodos), que
    // es justo lo que necesita positionInfeedAds() para recalcular.
    var mo = new MutationObserver(scheduleFit);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('load', scheduleFit);
})();
