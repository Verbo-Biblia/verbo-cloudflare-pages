(function () {
  "use strict";

  // Tamaño de letra ajustable (botones A−/A+ + pellizco con dos dedos) para
  // artículos individuales de /recursos/articulos-y-reflexiones/ y su espejo
  // en inglés. Mismo mecanismo que /libreria/ (ver libreria/assets/reader.js):
  // font-size real vía --reading-font-size (reflow real, no transform:scale).
  // Clave de localStorage propia (no comparte la de /libreria/): son
  // secciones de lectura independientes.
  var article = document.querySelector(".static-page__main article");
  if (!article) return;

  var FONT_SIZE_KEY = "verbo:articulos:fontSize";
  var FONT_SIZE_MIN = 0.85;
  var FONT_SIZE_MAX = 2;
  var FONT_SIZE_DEFAULT = 1;
  var FONT_SIZE_STEP = 0.1;

  function loadJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* almacenamiento no disponible, se ignora silenciosamente */
    }
  }

  function clampFontSize(v) {
    return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, v));
  }

  var fontSize = clampFontSize(parseFloat(loadJSON(FONT_SIZE_KEY, FONT_SIZE_DEFAULT)));
  if (isNaN(fontSize)) fontSize = FONT_SIZE_DEFAULT;

  var decBtn = null;
  var incBtn = null;

  function applyFontSize() {
    article.style.setProperty("--reading-font-size", fontSize.toFixed(2) + "rem");
  }

  function updateButtons() {
    if (decBtn) decBtn.disabled = fontSize <= FONT_SIZE_MIN + 1e-6;
    if (incBtn) incBtn.disabled = fontSize >= FONT_SIZE_MAX - 1e-6;
  }

  // Aplica de inmediato (hasta una vez por frame durante el pellizco), sin
  // tocar localStorage — ver persistFontSize(), guardado deliberadamente
  // aparte para no escribir en cada frame de un gesto.
  function setFontSizeImmediate(v) {
    fontSize = clampFontSize(v);
    applyFontSize();
    updateButtons();
  }

  var persistTimer = null;
  function persistFontSize() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(function () { saveJSON(FONT_SIZE_KEY, fontSize); }, 300);
  }

  function setFontSize(v) {
    setFontSizeImmediate(v);
    persistFontSize();
  }

  applyFontSize();

  function buildControls() {
    var wrap = document.createElement("div");
    wrap.className = "article-textsize";
    wrap.setAttribute("role", "group");

    decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "article-textsize-btn article-textsize-btn--dec";
    decBtn.textContent = "A−";
    decBtn.setAttribute("aria-label", "Reducir tamaño de letra");

    incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "article-textsize-btn article-textsize-btn--inc";
    incBtn.textContent = "A+";
    incBtn.setAttribute("aria-label", "Aumentar tamaño de letra");

    decBtn.addEventListener("click", function () { setFontSize(fontSize - FONT_SIZE_STEP); });
    incBtn.addEventListener("click", function () { setFontSize(fontSize + FONT_SIZE_STEP); });

    wrap.appendChild(decBtn);
    wrap.appendChild(incBtn);
    article.insertBefore(wrap, article.firstChild);

    updateButtons();

    if (window.VerboI18n) {
      window.VerboI18n.ready().then(function () {
        var t = window.VerboI18n.t;
        decBtn.setAttribute("aria-label", t("reader.fontDecrease"));
        incBtn.setAttribute("aria-label", t("reader.fontIncrease"));
      });
    }
  }

  // Pellizco con dos dedos sobre el artículo: cambia --reading-font-size en
  // vivo (font-size real, reflow real — ver recursos.css). touch-action:pan-y
  // en el artículo (recursos.css) ya le quita al navegador el zoom nativo
  // sobre esta zona; el preventDefault de abajo es un refuerzo para
  // navegadores que aun así intenten manejarlo. Igual que en
  // libreria/assets/reader.js: máximo una actualización por frame, y solo se
  // guarda en localStorage al soltar los dedos.
  function installPinchZoom() {
    var startDist = null;
    var startSize = null;
    var pendingSize = null;
    var raf = null;

    function distance(touches) {
      var dx = touches[0].clientX - touches[1].clientX;
      var dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function flush() {
      raf = null;
      if (pendingSize != null) {
        setFontSizeImmediate(pendingSize);
        pendingSize = null;
      }
    }

    article.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) {
        startDist = distance(e.touches);
        startSize = fontSize;
        article.classList.add("is-pinching");
      } else if (startDist != null) {
        endPinch({ touches: [] });
      }
    }, { passive: true });

    article.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 2 || startDist == null) return;
      e.preventDefault();
      var dist = distance(e.touches);
      if (!dist || !startDist) return;
      pendingSize = clampFontSize(startSize * (dist / startDist));
      if (!raf) raf = window.requestAnimationFrame(flush);
    }, { passive: false });

    function endPinch(e) {
      if (startDist == null) return;
      if (!e || e.touches.length < 2) {
        startDist = null;
        article.classList.remove("is-pinching");
        persistFontSize();
      }
    }
    article.addEventListener("touchend", endPinch);
    article.addEventListener("touchcancel", function () { endPinch({ touches: [] }); }, { passive: true });
  }

  buildControls();
  installPinchZoom();
})();
