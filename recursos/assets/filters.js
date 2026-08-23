/* ============================================================
   Verbo — filtro combinable (tipo / idioma / tema / búsqueda) para listas
   de contenido ya renderizadas en el HTML (Artículos y Reflexiones,
   Librería, Mi biblioteca). No depende de fetch: filtra por atributos
   data-* y por texto ya impresos en cada tarjeta/fila. Progresivo: sin JS
   se ve la lista completa sin filtrar.
   ============================================================ */
(function () {
  "use strict";

  // Quita acentos (NFD + strip de diacríticos) y normaliza espacios/mayúsculas
  // para que "santificacion" encuentre "Santificación" y "  Spurgeon " se
  // compare igual que "spurgeon".
  function normalizeSearch(s) {
    var UNICODE_COMBINING_MARKS = new RegExp("[̀-ͯ]", "g");
    return (s == null ? "" : String(s))
      .normalize("NFD").replace(UNICODE_COMBINING_MARKS, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function itemSearchText(it) {
    if (it.__verboSearchText === undefined) it.__verboSearchText = normalizeSearch(it.textContent);
    return it.__verboSearchText;
  }

  function initBar(bar) {
    var targetSel = bar.getAttribute("data-filter-target");
    var container = targetSel ? document.querySelector(targetSel) : null;
    if (!container) return;
    var items = Array.prototype.slice.call(container.querySelectorAll("[data-item]"));
    var groups = Array.prototype.slice.call(bar.querySelectorAll("[data-filter-group]"));

    // Un control puede vivir fuera de la barra visual (ej. el buscador de
    // Librería, arriba de la página, lejos de los pills de "Idioma"/"Temas")
    // y seguir participando del mismo filtro combinado — se enlaza por
    // selector en vez de por posición en el DOM.
    var extraSel = bar.getAttribute("data-filter-extra");
    if (extraSel) {
      Array.prototype.forEach.call(document.querySelectorAll(extraSel), function (g) {
        if (groups.indexOf(g) === -1) groups.push(g);
      });
    }

    var state = {};

    groups.forEach(function (g) {
      var key = g.getAttribute("data-filter-group");
      if (g.tagName === "INPUT" || g.tagName === "TEXTAREA") {
        state[key] = "";
        g.addEventListener("input", function () {
          state[key] = g.value;
          apply();
        });
      } else if (g.tagName === "SELECT") {
        state[key] = "todos";
        g.addEventListener("change", function () {
          state[key] = g.value;
          apply();
        });
      } else {
        state[key] = "todos";
        g.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-value]");
          if (!btn || !g.contains(btn)) return;
          state[key] = btn.getAttribute("data-value");
          Array.prototype.forEach.call(g.querySelectorAll("[data-value]"), function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          apply();
        });
      }
    });

    // .r-filter-empty vive junto a la cuadrícula (hermano de #container), no
    // necesariamente junto a la barra de filtros — en el layout de 3 zonas
    // (Librería, Artículos, Devocionales, Sermones Históricos) la barra vive
    // en una columna lateral aparte. Puede haber dos: el mensaje genérico de
    // "sin coincidencias" y, solo en páginas con buscador, uno específico
    // para "sin resultados de búsqueda".
    var emptyScope = container.parentElement || bar.parentElement;
    var emptyEls = emptyScope ? Array.prototype.slice.call(emptyScope.querySelectorAll(".r-filter-empty")) : [];
    var emptyDefault = null, emptySearch = null;
    emptyEls.forEach(function (e) {
      if (e.classList.contains("r-filter-empty--search")) emptySearch = e;
      else emptyDefault = e;
    });

    function apply() {
      var visible = 0;
      var query = state.q ? normalizeSearch(state.q) : "";
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (key) {
          var val = state[key];
          if (!val || val === "todos") return true;
          if (key === "q") return itemSearchText(it).indexOf(query) !== -1;
          var raw = it.getAttribute("data-" + key) || "";
          var vals = raw.split(",").map(function (s) { return s.trim(); });
          return vals.indexOf(val) !== -1;
        });
        it.hidden = !ok;
        if (ok) visible++;
      });
      var searching = query.length > 0;
      if (emptyDefault) emptyDefault.hidden = visible !== 0 || searching;
      if (emptySearch) emptySearch.hidden = visible !== 0 || !searching;
    }

    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-filter-bar]"), initBar);
  });

  // Expuesto para Mi biblioteca (libreria/mi-biblioteca/): su cuadrícula se
  // llena de forma asíncrona (fetch del catálogo real) después de
  // DOMContentLoaded, así que initBar() tiene que volver a correr una vez
  // poblada -- si se dejara el data-item de la barra estándar, el
  // auto-init de arriba capturaría 0 tarjetas y quedaría obsoleto. Esa
  // página marca su barra con data-filter-bar-manual (no data-filter-bar)
  // para que el auto-init la ignore y solo initBar() manual la inicialice.
  window.VerboFilters = { initBar: initBar, normalizeSearch: normalizeSearch };
})();
