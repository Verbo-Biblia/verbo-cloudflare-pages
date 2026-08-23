/* Verbo · Librería — traduce el conteo de las tarjetas del catálogo
   ("10 fragmentos", "12 capítulos"...) sin pasar por /translate.

   Antes tenían data-i18n-live y se mandaban a la traducción por LLM junto
   con el resto de la página — un texto de 2 palabras sin contexto ("10
   fragmentos") es exactamente el caso que le rompía la traducción a la
   tarjeta de "Fragmentos de Papías" (bug reportado por Juan). El conjunto
   de palabras posibles acá es chico y cerrado (fragmentos/salmos/
   capítulos/secciones) — no hace falta un LLM para esto, alcanza con el
   diccionario estático reader.unidades de biblia/assets/i18n/{es,en}.json. */
(function () {
  "use strict";

  var WORD_TO_KEY = {
    "fragmentos": "fragmentos",
    "salmos": "salmos",
    "capítulos": "capitulos",
    "secciones": "secciones"
  };

  function localize() {
    if (!window.VerboI18n) return;
    var t = window.VerboI18n.t;
    document.querySelectorAll("[data-meta-count]").forEach(function (el) {
      if (!el.dataset.metaCountOriginal) el.dataset.metaCountOriginal = el.textContent.trim();
      var original = el.dataset.metaCountOriginal;
      var match = original.match(/^(\d+)\s+(\S+)$/);
      if (!match) return;
      var key = WORD_TO_KEY[match[2]];
      if (!key) { el.textContent = original; return; }
      var translated = t("reader.unidades." + key);
      el.textContent = match[1] + " " + (translated === "reader.unidades." + key ? match[2] : translated);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.VerboI18n) return;
    window.VerboI18n.ready().then(localize);
    document.addEventListener("verbo:uilang-changed", localize);
  });

  // Expuesto para Mi biblioteca (libreria/mi-biblioteca/): sus tarjetas se
  // clonan del catálogo real después de DOMContentLoaded (fetch), así que
  // el recorrido de arriba ya terminó antes de que existan -- se vuelve a
  // llamar a mano una vez insertadas.
  window.VerboBookMetaI18n = { localize: localize };
})();
