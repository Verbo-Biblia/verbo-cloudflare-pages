/* ============================================================
   Verbo — Recursos: layout de descubrimiento (3 zonas).
   Archivo nuevo y separado de filters.js a propósito: no se toca la lógica
   show/hide existente (sigue siendo 100% de filters.js), esto solo prepara
   el DOM antes/alrededor de ella —
     1) clona los primeros 5 <a data-item> del grid original (ya vienen en
        orden reverse-cronológico, no se reordena ni se toca fecha) dentro
        de la sidebar "Agregados recientemente";
     2) del resto, oculta todos salvo 10 elegidos al azar (re-mezclados en
        cada carga, sin persistir el sorteo) para la zona central "Para
        leer";
     3) genera las pills de "Temas" a partir de los valores únicos de
        data-tema ya presentes en la página, dentro del mismo contenedor
        [data-filter-group="tema"] que ya trae el HTML — filters.js ya ató
        su listener por delegación de eventos sobre ese contenedor en su
        propio DOMContentLoaded, así que pills agregadas después siguen
        funcionando sin tocar filters.js (mismo patrón que el grupo
        "idioma" de Librería, que ya usa botones en vez de <select>).
   Requiere que este <script> se cargue DESPUÉS de filters.js en el HTML:
   su apply() inicial (que muestra todo, estado por defecto "todos") debe
   correr antes de que este script oculte el resto — ambos listeners de
   DOMContentLoaded corren en el mismo tick síncrono, sin parpadeo visible.
   ============================================================ */
(function () {
  "use strict";

  var RECIENTES_COUNT = 5;
  var CENTRO_COUNT = 10;

  var STRINGS = {
    // "sugeridos" es la única excepción: sermones-historicos/index.html usa
    // esta clave en vez de "recientes" en su data-discovery-text porque ahí
    // los primeros 5 del DOM no son un orden cronológico de agregado (no
    // hay fecha_agregado en sermones-historicos.json; el DOM está agrupado
    // por autor) — "Agregados recientemente" sería engañoso en esa página.
    es: { recientes: "Agregados recientemente", sugeridos: "Sugeridos", centro: "Para leer", temas: "Temas", todos: "Todos los temas" },
    en: { recientes: "Recently added", sugeridos: "Suggested", centro: "To read", temas: "Topics", todos: "All topics" }
  };

  // Mismas etiquetas que TEMA_LABEL en tools/build_content_taxonomy.py,
  // para que la pill no dependa de que el diccionario i18n ya haya cargado
  // (data-i18n la corrige después si hace falta, igual que ya hacían los
  // <option>/<span> estáticos que esta pill reemplaza).
  var TEMA_LABEL = {
    "apologetica": "Apologética", "teologia": "Teología", "vida-cristiana": "Vida cristiana",
    "historia-de-la-biblia": "Historia de la Biblia", "gracia": "Gracia", "fe": "Fe",
    "esperanza": "Esperanza", "sufrimiento": "Sufrimiento", "identidad-en-cristo": "Identidad en Cristo",
    "santidad": "Santidad", "seguridad-en-cristo": "Seguridad en Cristo", "escatologia": "Escatología",
    "vida-en-cristo": "Vida en Cristo", "fidelidad-de-dios": "Fidelidad de Dios",
    "patristica": "Patrística", "chapel-library": "Chapel Library", "salmos": "Salmos",
    "devocional": "Devocional", "familia": "Familia", "evangelismo": "Evangelismo",
    "evangelios": "Evangelios", "armonia-evangelica": "Armonía evangélica",
    "comentario-biblico": "Comentario bíblico", "ministerio": "Ministerio", "unidad": "Unidad",
    "oracion": "Oración", "perseverancia": "Perseverancia", "juventud": "Juventud",
    "predicacion": "Predicación", "iglesia": "Iglesia", "doctrina": "Doctrina",
    "escritura": "Escritura", "cultura": "Cultura", "liderazgo": "Liderazgo",
    "siglo-1": "Siglo I", "siglo-2": "Siglo II", "siglo-17": "Siglo XVII", "siglo-19": "Siglo XIX",
    "john-bunyan": "John Bunyan", "clasicos-cristianos": "Clásicos cristianos", "biblia": "Biblia"
  };

  function temaLabel(slug) {
    if (TEMA_LABEL[slug]) return TEMA_LABEL[slug];
    var s = slug.replace(/-/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // kebab-case -> camelCase, igual que tema_i18n_key() en
  // tools/build_content_taxonomy.py (namespace "temas." de i18n/{es,en}.json).
  function temaI18nKey(slug) {
    var parts = slug.split("-");
    var out = parts[0];
    for (var i = 1; i < parts.length; i++) out += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    return "temas." + out;
  }

  function uniqueTemas(items) {
    var seen = {};
    var out = [];
    items.forEach(function (it) {
      var raw = it.getAttribute("data-tema") || "";
      raw.split(",").forEach(function (t) {
        t = t.trim();
        if (t && !seen[t]) { seen[t] = true; out.push(t); }
      });
    });
    out.sort(function (a, b) { return temaLabel(a).localeCompare(temaLabel(b), "es"); });
    return out;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function currentLang() {
    return (window.VerboI18n && window.VerboI18n.getUiLang && window.VerboI18n.getUiLang() === "en") ? "en" : "es";
  }

  function applyHeadingText(root) {
    var lang = currentLang();
    var dict = STRINGS[lang];
    root.querySelectorAll("[data-discovery-text]").forEach(function (el) {
      var key = el.getAttribute("data-discovery-text");
      if (dict[key]) el.textContent = dict[key];
    });
  }

  // Título/ruta de un <a data-item>: articulos/devocionales/sermones traen
  // data-titulo-es/data-ruta-es; Librería no (sus <a> solo tienen href y un
  // <p class="r-book-title"> hijo), de ahí el fallback en dos pasos.
  function itemTitle(item) {
    var attr = item.getAttribute("data-titulo-es");
    if (attr) return attr;
    var el = item.querySelector(".r-article-row-title, .r-book-title");
    return el ? el.textContent.trim() : item.textContent.trim();
  }
  function itemHref(item) {
    return item.getAttribute("data-ruta-es") || item.getAttribute("href");
  }

  // Tarjetas pequeñas para "recientes" (solo título, sin la portada grande
  // de .article-cover/.sermon-cover/.book-cover) en vez de clonar la fila
  // completa — misma idea que un elemento de menú, no una tarjeta de grid.
  // Conserva data-item + data-titulo-es/en + data-ruta-es/en y la clase
  // .r-article-row-title en el título: son los ganchos que ya usa
  // lang-aware-list.js (selector ".r-article-list [data-item]"), así que el
  // toggle de idioma sigue funcionando sin tocar ese archivo.
  function buildRecientes(root, recientes) {
    var list = root.querySelector("[data-discovery-recientes-list]");
    if (!list) return;
    recientes.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "r-discovery-recientes-item";
      a.setAttribute("data-item", "");
      var rutaEs = itemHref(item);
      var tituloEs = itemTitle(item);
      a.setAttribute("data-ruta-es", rutaEs);
      a.setAttribute("data-titulo-es", tituloEs);
      var rutaEn = item.getAttribute("data-ruta-en");
      var tituloEn = item.getAttribute("data-titulo-en");
      if (rutaEn) a.setAttribute("data-ruta-en", rutaEn);
      if (tituloEn) a.setAttribute("data-titulo-en", tituloEn);
      var title = document.createElement("span");
      title.className = "r-article-row-title";
      // Ítem recién creado: lang-aware-list.js ya corrió una vez antes de
      // que este <a> existiera (su applyLang() inicial es síncrono, se
      // ejecuta al parsear el <script> al pie de la página, antes del
      // DOMContentLoaded donde corre este archivo) — sin esto, el primer
      // render quedaría en español aunque la UI ya esté en inglés.
      var useEn = currentLang() === "en" && rutaEn && tituloEn;
      a.href = useEn ? rutaEn : rutaEs;
      title.textContent = useEn ? tituloEn : tituloEs;
      a.appendChild(title);
      list.appendChild(a);
    });
  }

  // Botón hamburguesa: solo tiene efecto visual/interactivo en móvil (CSS
  // deja el botón como <h2> normal en escritorio, sin ícono ni "cursor:
  // pointer"); en escritorio el click simplemente no cambia nada visible
  // porque .r-discovery-recientes-list no está colapsada ahí.
  function wireRecientesToggle(root) {
    var toggle = root.querySelector("[data-discovery-recientes-toggle]");
    var list = root.querySelector("[data-discovery-recientes-list]");
    if (!toggle || !list) return;
    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function buildCentro(grid, resto) {
    var shuffled = shuffle(resto);
    var visible = shuffled.slice(0, CENTRO_COUNT);
    var hidden = shuffled.slice(CENTRO_COUNT);
    // Reordena físicamente los visibles (no solo oculta) para que "para
    // leer" también aparezca remezclado, no solo recortado — filters.js no
    // depende del orden del DOM (guarda referencias directas a cada
    // elemento), así que mover nodos aquí no rompe su filtrado posterior.
    visible.forEach(function (item) {
      item.hidden = false;
      grid.appendChild(item);
    });
    hidden.forEach(function (item) { item.hidden = true; });
  }

  function buildTemasPills(root, allItems) {
    var group = root.querySelector('[data-filter-group="tema"]');
    if (!group) return;
    var lang = currentLang();
    var todos = document.createElement("button");
    todos.type = "button";
    todos.className = "r-filter-pill is-active";
    todos.setAttribute("data-value", "todos");
    todos.setAttribute("data-i18n", "filtros.todosLosTemas");
    todos.textContent = STRINGS[lang].todos;
    group.appendChild(todos);

    uniqueTemas(allItems).forEach(function (slug) {
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "r-filter-pill";
      pill.setAttribute("data-value", slug);
      pill.setAttribute("data-i18n", temaI18nKey(slug));
      pill.textContent = temaLabel(slug);
      group.appendChild(pill);
    });

    if (window.VerboI18n && window.VerboI18n.applyStatic) window.VerboI18n.applyStatic(group);
  }

  function initRoot(root) {
    var gridSel = root.getAttribute("data-discovery-grid");
    var grid = gridSel ? document.querySelector(gridSel) : null;
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll("[data-item]"));
    if (items.length <= RECIENTES_COUNT) return; // muy pocos ítems: no vale la pena partir en zonas

    var recientes = items.slice(0, RECIENTES_COUNT);
    var resto = items.slice(RECIENTES_COUNT);

    buildRecientes(root, recientes);
    // Los originales se ocultan en el grid (ya viven, clonados, en la
    // sidebar) para que la zona central solo muestre el sorteo de 10 sobre
    // "el resto" — igual que cualquier otro ítem del pool, vuelven a
    // aparecer ahí si el usuario filtra por un tema que les correspondería.
    recientes.forEach(function (item) { item.hidden = true; });
    buildCentro(grid, resto);
    buildTemasPills(root, items);
    applyHeadingText(root);
    wireRecientesToggle(root);
  }

  function init() {
    var roots = document.querySelectorAll("[data-discovery-layout]");
    roots.forEach(initRoot);
    document.addEventListener("verbo:uilang-changed", function () {
      roots.forEach(applyHeadingText);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
