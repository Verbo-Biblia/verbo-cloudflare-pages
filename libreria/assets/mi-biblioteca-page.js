/* ============================================================
   Verbo — Librería: página "Mi biblioteca" (/libreria/mi-biblioteca/).
   No mantiene una segunda lista de libros: pide el catálogo real
   (/libreria/, el mismo index.html que ve cualquier visitante) por fetch,
   y clona de ahí las tarjetas de los libros guardados -- así título, autor,
   portada e idioma siempre coinciden con Librería sin duplicar datos acá.
   Los <a> clonados conservan su href original ("el-peregrino-bunyan-es/",
   relativo a /libreria/) sin reescribir: <base href="/libreria/"> en el
   <head> de esta página los resuelve igual, y así no se rompen los
   selectores de portada por href exacto de reader.css.
   ============================================================ */
(function () {
  "use strict";

  var CATALOG_URL = "/libreria/";

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.VerboMiBiblioteca) return;

    var grid = document.getElementById("mibiblioteca-grid");
    var searchRow = document.getElementById("mibiblioteca-search-row");
    var filterBar = document.querySelector("[data-filter-bar-manual]");
    var emptyState = document.getElementById("mibiblioteca-empty");
    var loadError = document.getElementById("mibiblioteca-loaderror");
    if (!grid || !emptyState) return;

    function t(key, vars) {
      return window.VerboI18n ? window.VerboI18n.t(key, vars) : key;
    }

    // Ningún hijo real quedó en la cuadrícula (biblioteca vacía, o todos los
    // ids guardados apuntan a libros que ya no existen -- ver #17 de la
    // tarea: se ignoran en silencio, nunca un error visible).
    function showEmptyState() {
      grid.hidden = true;
      if (searchRow) searchRow.hidden = true;
      emptyState.hidden = false;
    }

    function buildCard(id, sourceEl) {
      var clone = sourceEl.cloneNode(true);
      clone.removeAttribute("data-item"); // el data-item vive en el wrapper, no acá (ver más abajo)

      var titleEl = clone.querySelector(".r-book-title");
      var title = titleEl ? titleEl.textContent.trim() : id;

      var wrapper = document.createElement("div");
      wrapper.className = "r-mibiblioteca-item";
      wrapper.setAttribute("data-item", "");
      wrapper.appendChild(clone);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "r-mibiblioteca-remove-btn";
      removeBtn.innerHTML = "×";
      removeBtn.setAttribute("aria-label", t("miBiblioteca.removeAria", { title: title }));
      // Botón hermano del <a>, no anidado dentro -- un <button> dentro de un
      // <a> es HTML inválido y confunde lectores de pantalla/foco. Igual
      // hace falta cortar el click para que no dispare navegación si algún
      // navegador lo burbujea igual.
      removeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.VerboMiBiblioteca.remove(id);
        wrapper.remove();
        if (!grid.querySelector("[data-item]")) showEmptyState();
      });
      wrapper.appendChild(removeBtn);

      return wrapper;
    }

    // window.VerboMiBiblioteca.ready() = VerboBackup.init() (IndexedDB) --
    // sortedIds() antes de esto devolvería [] aunque sí haya libros
    // guardados y mostraría el estado vacío por error. También dispara la
    // sincronización en segundo plano de esta página (no-op si el
    // dispositivo nunca vinculó su email en /ajustes/), igual que reader.js.
    var mibibReady = window.VerboMiBiblioteca.ready();
    mibibReady.then(function () {
      if (window.VerboSync) window.VerboSync.init().catch(function () {});
    });

    // Espera el diccionario antes de armar las tarjetas para que el
    // aria-label de "Quitar…" nazca traducido (t() devuelve la clave cruda
    // si el diccionario todavía no cargó) -- el fetch del catálogo tarda de
    // sobra como para que esto no sume demora perceptible.
    var i18nReady = window.VerboI18n ? window.VerboI18n.ready() : Promise.resolve();

    Promise.all([mibibReady, i18nReady])
      .then(function () {
        var ids = window.VerboMiBiblioteca.sortedIds();
        if (!ids.length) {
          showEmptyState();
          return Promise.reject({ handled: true });
        }
        return fetch(CATALOG_URL).then(function (r) {
          if (!r.ok) throw new Error("catalog fetch failed");
          return r.text();
        }).then(function (html) { return { html: html, ids: ids }; });
      })
      .then(function (result) {
        var doc = new DOMParser().parseFromString(result.html, "text/html");
        var bySlug = {};
        Array.prototype.forEach.call(doc.querySelectorAll("#libreria-grid [data-item]"), function (el) {
          var href = el.getAttribute("href") || "";
          var slug = href.replace(/\/$/, "");
          if (slug) bySlug[slug] = el;
        });

        var added = 0;
        result.ids.forEach(function (id) {
          var sourceEl = bySlug[id];
          if (!sourceEl) return; // libro guardado que ya no existe en el catálogo -- se ignora
          grid.appendChild(buildCard(id, sourceEl));
          added++;
        });

        if (!added) {
          showEmptyState();
          return;
        }

        grid.hidden = false;
        if (searchRow) searchRow.hidden = false;
        if (window.VerboBookMetaI18n) window.VerboBookMetaI18n.localize();
        if (filterBar && window.VerboFilters) window.VerboFilters.initBar(filterBar);
      })
      .catch(function (err) {
        if (err && err.handled) return; // ya se mostró el estado vacío, no es un error real
        grid.hidden = true;
        if (searchRow) searchRow.hidden = true;
        if (loadError) loadError.hidden = false;
      });
  });
})();
