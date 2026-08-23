(function () {
  "use strict";

  var cfg = window.__LIBRERIA_BOOK__;
  if (!cfg) return;

  var root = document.getElementById("reader-root");
  if (!root) return;

  // ":hl2" — formato con rangos de texto libres (start/end de caracteres).
  // Distinto del formato viejo (":hl", párrafo completo sí/no) para no
  // heredar datos incompatibles de la primera versión del lector.
  var HL_KEY = "verbo:libreria:" + cfg.id + ":hl2";
  var BM_KEY = "verbo:libreria:" + cfg.id + ":bookmark";
  // Solo la marca de "ya se mostró el glow para este libro" es puramente
  // local a este dispositivo (cosmético, no vale la pena sincronizarlo). El
  // guardado real del libro ("Mi biblioteca") vive en window.VerboMiBiblioteca
  // (libreria/assets/mi-biblioteca.js), que a su vez usa VerboBackup/VerboSync
  // -- la misma capa de respaldo y sincronización por email que ya usan
  // notas/resaltados/marcadores de la Biblia, en vez de una clave propia.
  var MIBIB_SEEN_KEY = "verbo:libreria:miBiblioteca:seenGlow";
  // Se resuelve cuando VerboBackup (IndexedDB) terminó de cargar -- ningún
  // isSavedToMiBiblioteca()/toggle real puede consultarse antes de esto.
  var mibibReady = (window.VerboMiBiblioteca ? window.VerboMiBiblioteca.ready() : Promise.resolve(null));
  // Arranca la sincronización en segundo plano (pull inicial + intervalo)
  // si este dispositivo ya vinculó su email en /ajustes/ -- VerboSync.init()
  // es un no-op silencioso si nunca se vinculó. No condicionado a que este
  // libro en particular se guarde: cualquier página con backup.js+sync.js
  // cargados participa del mismo ciclo de sync, igual que /biblia/ y /ajustes/.
  mibibReady.then(function () {
    if (window.VerboSync) window.VerboSync.init().catch(function () {});
  });

  var chapters = [];
  var current = 0;
  var highlights = loadJSON(HL_KEY, {});
  var bookmark = loadJSON(BM_KEY, null);
  var paraTexts = []; // texto plano de cada párrafo del capítulo actual

  // ---------- tamaño de letra (pellizco + botones A−/A+) ----------
  // Preferencia compartida por todo /libreria/ (sin cfg.id en la clave, a
  // diferencia de HL_KEY/BM_KEY): un solo tamaño para toda la sección, igual
  // que pide la tarea. --reading-font-size es font-size real sobre
  // .reader-para (reader.css), no transform:scale — el texto se reacomoda.
  var FONT_SIZE_KEY = "verbo:libreria:fontSize";
  var FONT_SIZE_MIN = 0.85;
  var FONT_SIZE_MAX = 2;
  var FONT_SIZE_DEFAULT = 1.05;
  var FONT_SIZE_STEP = 0.1;
  var uiRef = null;
  var fontSize = clampFontSize(parseFloat(loadJSON(FONT_SIZE_KEY, FONT_SIZE_DEFAULT)));
  if (isNaN(fontSize)) fontSize = FONT_SIZE_DEFAULT;

  function clampFontSize(v) {
    return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, v));
  }

  function applyFontSize() {
    root.style.setProperty("--reading-font-size", fontSize.toFixed(2) + "rem");
  }

  function updateFontSizeButtons() {
    if (!uiRef) return;
    if (uiRef.fontDecBtn) uiRef.fontDecBtn.disabled = fontSize <= FONT_SIZE_MIN + 1e-6;
    if (uiRef.fontIncBtn) uiRef.fontIncBtn.disabled = fontSize >= FONT_SIZE_MAX - 1e-6;
  }

  // Aplica el nuevo tamaño de inmediato (llamado hasta una vez por frame
  // durante el pellizco vía requestAnimationFrame) sin tocar localStorage —
  // ver persistFontSize() para el guardado, deliberadamente separado para no
  // escribir en cada frame de un gesto.
  function setFontSizeImmediate(v) {
    fontSize = clampFontSize(v);
    applyFontSize();
    updateFontSizeButtons();
  }

  var persistFontSizeTimer = null;
  function persistFontSize() {
    clearTimeout(persistFontSizeTimer);
    persistFontSizeTimer = setTimeout(function () { saveJSON(FONT_SIZE_KEY, fontSize); }, 300);
  }

  function setFontSize(v) {
    setFontSizeImmediate(v);
    persistFontSize();
  }

  applyFontSize();

  // ---------- traducción ES->EN on-demand (estrategia_traduccion) ----------
  // "auto" (default): se traduce el capítulo completo vía el mismo
  // mecanismo que usa el resto del sitio (Google Translate no oficial +
  // caché en localStorage), cuando el idioma de interfaz activo no es
  // español. "manual": nunca se traduce, se muestra un aviso discreto.
  var strategy = cfg.estrategiaTraduccion || "auto";
  var translatedMode = false; // true si el capítulo actual se está mostrando traducido
  var renderToken = 0; // evita que una traducción vieja pise una más nueva al cambiar de capítulo/idioma rápido

  function currentLang() {
    return window.VerboI18n ? window.VerboI18n.getUiLang() : "es";
  }

  // ---------- texto a voz (window.VerboTTS, biblia/assets/tts-player.js) ----------
  var ttsController = null;
  var ttsEstado = "detenido"; // detenido | reproduciendo | pausado
  var TTS_ETIQUETAS = {
    es: { escuchar: "Escuchar", pausar: "Pausar", reanudar: "Reanudar" },
    en: { escuchar: "Listen", pausar: "Pause", reanudar: "Resume" }
  };

  function actualizarBotonTTS(ui) {
    if (!ui.ttsBtn) return;
    var t = TTS_ETIQUETAS[currentLang() === "en" ? "en" : "es"];
    if (ttsEstado === "reproduciendo") {
      ui.ttsBtn.textContent = t.pausar;
      ui.ttsBtn.classList.add("is-active");
    } else if (ttsEstado === "pausado") {
      ui.ttsBtn.textContent = t.reanudar;
      ui.ttsBtn.classList.add("is-active");
    } else {
      ui.ttsBtn.textContent = t.escuchar;
      ui.ttsBtn.classList.remove("is-active");
    }
  }

  // Se llama al cambiar de capítulo/idioma (render() reconstruye
  // .reader-content) y al salir de la página, para no dejar una voz leyendo
  // párrafos que ya no están en pantalla.
  function detenerTTS(ui) {
    if (ttsController) ttsController.stop();
    ttsController = null;
    ttsEstado = "detenido";
    if (ui) actualizarBotonTTS(ui);
  }

  // Solo el título del capítulo actual y sus párrafos — nunca el título del
  // libro (.reader-title, se anuncia una vez, no en cada capítulo), la
  // licencia, la barra de progreso ni la navegación de capítulo.
  function alClicTTS(ui) {
    if (!window.VerboTTS) return;
    if (ttsEstado === "detenido") {
      ttsController = window.VerboTTS.leerBloque(root, {
        idioma: currentLang() === "en" ? "en" : "es",
        tituloSelector: ".reader-chapter-title",
        cuerpoSelector: ".reader-content .reader-para",
        omitirPrefijoNumerico: !!cfg.bibleManifestUrl,
        onFinished: function () { detenerTTS(ui); }
      });
      ttsEstado = "reproduciendo";
    } else if (ttsEstado === "reproduciendo") {
      ttsController.pause();
      ttsEstado = "pausado";
    } else if (ttsEstado === "pausado") {
      ttsController.resume();
      ttsEstado = "reproduciendo";
    }
    actualizarBotonTTS(ui);
  }

  function canAutoTranslate() {
    return strategy === "auto" && currentLang() !== "es" && !!window.VerboSiteTranslate;
  }

  function resolveChapterText(ch) {
    if (!canAutoTranslate()) return Promise.resolve({ text: ch.text, title: ch.title, translated: false });
    var lang = currentLang();
    var idBase = cfg.id + ":" + ch.n;
    return Promise.all([
      window.VerboSiteTranslate.translateText(ch.text, idBase, "es", lang),
      window.VerboSiteTranslate.translateText(ch.title, idBase + ":title", "es", lang)
    ]).then(function (r) {
      return { text: r[0], title: r[1], translated: r[0] !== ch.text };
    });
  }

  // Título del libro, autor y la palabra de unidad ("Capítulo" -> "Chapter")
  // — se traducen una sola vez por idioma (cacheadas), independiente de en
  // qué capítulo esté el lector.
  function resolveBookStrings() {
    if (!canAutoTranslate()) return Promise.resolve({ title: cfg.title, author: cfg.author, unitLabel: cfg.unitLabel });
    var lang = currentLang();
    return Promise.all([
      window.VerboSiteTranslate.translateText(cfg.title, cfg.id + ":booktitle", "es", lang),
      window.VerboSiteTranslate.translateText(cfg.author, cfg.id + ":author", "es", lang),
      window.VerboSiteTranslate.translateText(cfg.unitLabel, cfg.id + ":unitlabel", "es", lang)
    ]).then(function (r) {
      return { title: r[0], author: r[1], unitLabel: r[2] };
    });
  }

  function updateManualBanner(ui) {
    if (!ui.manualNote) return;
    var show = strategy === "manual" && currentLang() !== "es";
    ui.manualNote.hidden = !show;
    if (show && window.VerboI18n) {
      window.VerboI18n.ready().then(function () {
        ui.manualNote.textContent = window.VerboI18n.t("site.translationPending");
      });
    }
  }

  // Chrome fijo del lector (título del libro, autor, textos de ayuda,
  // botones) — se resuelve aparte del cuerpo del capítulo porque no cambia
  // al navegar entre capítulos, solo al cambiar de idioma.
  var ICON_BOOKMARK_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"/><path d="M9.5 9h4M11.5 7v4"/></svg>';
  var ICON_BOOKMARK_SAVED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"/><path d="m9 11 1.8 1.8L15 9"/></svg>';

  // Botón "Guardar para continuar leyendo" — guarda EL LIBRO COMPLETO,
  // distinto del marcador de capítulo (bmBtn/★, arriba) y del resaltado de
  // texto. Se actualiza en cada applyChrome() (init + cambio de idioma) y
  // justo después de alternar el guardado, para que texto/aria-label/ícono
  // nunca queden desincronizados del estado real en localStorage.
  function updateSaveBookUI(ui) {
    if (!ui.saveBookBtn) return;
    var t = window.VerboI18n ? window.VerboI18n.t : function (k) { return k; };
    var saved = isSavedToMiBiblioteca();
    ui.saveBookBtn.classList.toggle("is-saved", saved);
    ui.saveBookBtn.setAttribute("aria-pressed", saved ? "true" : "false");
    var label = saved ? t("reader.savedToLibrary") : t("reader.saveToLibrary");
    ui.saveBookIcon.innerHTML = saved ? ICON_BOOKMARK_SAVED : ICON_BOOKMARK_PLUS;
    ui.saveBookLabel.textContent = label;
    ui.saveBookBtn.setAttribute("aria-label", label);
  }

  // Llamada de atención breve (CSS, ver .reader-savebook-btn--attn en
  // reader.css) para enseñar que existe Mi biblioteca -- una sola vez por
  // libro (markSeenSaveGlow) y nunca si el libro ya estaba guardado o si el
  // usuario pidió menos movimiento.
  function maybeShowSaveGlow(ui) {
    if (!ui.saveBookBtn || isSavedToMiBiblioteca() || hasSeenSaveGlow()) return;
    markSeenSaveGlow();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ui.saveBookBtn.classList.add("reader-savebook-btn--attn");
    window.setTimeout(function () {
      ui.saveBookBtn.classList.remove("reader-savebook-btn--attn");
    }, 2600);
  }

  function applyChrome(ui) {
    var t = window.VerboI18n ? window.VerboI18n.t : function (k) { return k; };
    ui.hint.textContent = t("reader.hint");
    ui.resumeLink.textContent = t("reader.continue");
    ui.resumeDismiss.textContent = t("reader.discard");
    ui.bmBtn.textContent = (bookmark && bookmark.chapter === current) ? t("reader.marked") : t("reader.markChapter");
    if (ui.fontDecBtn) ui.fontDecBtn.setAttribute("aria-label", t("reader.fontDecrease"));
    if (ui.fontIncBtn) ui.fontIncBtn.setAttribute("aria-label", t("reader.fontIncrease"));
    updateSaveBookUI(ui);
    return resolveBookStrings().then(function (book) {
      ui.badge.textContent = "Librería · " + book.author;
      ui.title.textContent = book.title;
      ui.unitLabel = book.unitLabel; // usado por render()/foot/resume/opciones
      buildChapterOptions(ui);
      if (ui.resume && !ui.resume.hidden && bookmark) {
        ui.resumeText.textContent = t("reader.resumeBookmark", { unit: book.unitLabel.toLowerCase(), n: bookmark.chapter + 1 });
      }
    });
  }

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

  // ---------- Mi biblioteca (guardar el libro completo) ----------
  // Delegado por completo a window.VerboMiBiblioteca (libreria/assets/
  // mi-biblioteca.js), que a su vez guarda vía VerboBackup/VerboSync -- ver
  // el comentario junto a mibibReady más arriba. Estas son solo envolturas
  // finas para no repetir "if (!window.VerboMiBiblioteca) return" en cada
  // sitio donde se usan.
  function isSavedToMiBiblioteca() {
    return !!(window.VerboMiBiblioteca && window.VerboMiBiblioteca.has(cfg.id));
  }
  // true = quedó guardado, false = se quitó.
  function toggleMiBiblioteca() {
    return window.VerboMiBiblioteca ? window.VerboMiBiblioteca.toggle(cfg.id) : false;
  }
  // Se llama una vez al abrir el lector si el libro ya estaba guardado, para
  // que /libreria/mi-biblioteca/ pueda ordenar por lectura más reciente sin
  // inventar un progreso de lectura que no existe.
  function touchMiBibliotecaOpened() {
    if (window.VerboMiBiblioteca) window.VerboMiBiblioteca.touchOpened(cfg.id);
  }
  function hasSeenSaveGlow() {
    var seen = loadJSON(MIBIB_SEEN_KEY, []);
    return Array.isArray(seen) && seen.indexOf(cfg.id) !== -1;
  }
  // Se marca "visto" apenas se decide mostrar (o no) el glow, no cuando
  // termina la animación -- así un libro con prefers-reduced-motion activo
  // también queda marcado y no se re-evalúa en cada visita.
  function markSeenSaveGlow() {
    var seen = loadJSON(MIBIB_SEEN_KEY, []);
    if (!Array.isArray(seen)) seen = [];
    if (seen.indexOf(cfg.id) === -1) {
      seen.push(cfg.id);
      if (seen.length > 400) seen = seen.slice(-400); // evita crecer sin límite
      saveJSON(MIBIB_SEEN_KEY, seen);
    }
  }

  // Agrupa el texto continuo de una sección/capítulo en "párrafos" de
  // tamaño legible, dividiendo por oraciones. El agrupamiento es
  // determinista (mismo texto de entrada -> mismos párrafos siempre),
  // así los índices de párrafo sirven como clave estable para el resaltado.
  function splitIntoParagraphs(text) {
    if (!text) return [];
    // Biblia: cada versículo ya viene separado por "\n\n" en loadBibleContent
    // (uno por línea, en vez de reflow por oraciones) — así se lee como
    // texto bíblico normal, no como prosa corrida.
    if (cfg.bibleManifestUrl) return text.split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean);
    var sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [text];
    var paras = [];
    var buf = "";
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i].trim();
      if (!s) continue;
      buf = buf ? buf + " " + s : s;
      if (buf.length >= 320) {
        paras.push(buf);
        buf = "";
      }
    }
    if (buf) paras.push(buf);
    return paras.length ? paras : [text];
  }

  // Convierte HTML de origen (ej. Matthew Henry, con <p>/<b>/<i>) a texto
  // plano legible, conservando saltos de párrafo. El resaltado por rangos
  // de caracteres (ver más abajo) solo funciona sobre texto plano, así que
  // el marcado se descarta aquí en vez de intentar resaltar dentro de HTML.
  function htmlToPlainText(html) {
    var withBreaks = html.replace(/<\/p>|<br\s*\/?>|<BR\s*\/?>/gi, "\n\n");
    var div = document.createElement("div");
    div.innerHTML = withBreaks;
    return (div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function normalize(raw) {
    var arr = raw[cfg.dataKey] || [];
    return arr.map(function (item, i) {
      var text = item[cfg.textField] || "";
      if (cfg.htmlSource) text = htmlToPlainText(text);
      return {
        n: item.n || i + 1,
        title: item[cfg.titleField] || (cfg.unitLabel + " " + (item.n || i + 1)),
        text: text
      };
    });
  }

  function loadBibleContent(manifestUrl) {
    return fetch(manifestUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("No se pudo cargar la edición bíblica.");
        return r.json();
      })
      .then(function (manifest) {
        var base = new URL(".", new URL(manifestUrl, window.location.href));
        return Promise.all(manifest.books.map(function (book) {
          return fetch(new URL(book.file, base))
            .then(function (r) {
              if (!r.ok) throw new Error("No se pudo cargar " + book.name + ".");
              return r.json();
            })
            .then(function (data) {
              return Object.keys(data.chapters).map(function (chapter) {
                var verses = data.chapters[chapter];
                return {
                  n: book.number + "." + chapter,
                  title: book.name + " " + chapter,
                  content: Object.keys(verses).map(function (verse) {
                    var v = verses[verse];
                    return verse + " " + (typeof v === "string" ? v : v.text);
                  }).join("\n\n")
                };
              });
            });
        })).then(function (books) {
          return { sections: books.reduce(function (all, book) { return all.concat(book); }, []) };
        });
      });
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // ---------- resaltado por rangos de texto libres ----------
  // Mismos 6 colores que el resaltador de versículos de la Biblia
  // (.verse.hl-* en biblia/assets/style.css) y el de las lecciones de
  // Escuela Dominical (recursos/assets/text-highlighter.js), para que se
  // sienta igual en todo el sitio.
  var HL_COLORS = ["yellow", "green", "blue", "pink", "coral", "violet"];

  function hlKey(paraIndex) { return current + ":" + paraIndex; }

  // Los datos viejos (antes de agregar color) guardaban pares [start, end]
  // sin tercer elemento; se tratan como amarillo, el único color que existía.
  function loadRanges(paraIndex) {
    return (highlights[hlKey(paraIndex)] || []).map(function (r) {
      return { start: r[0], end: r[1], color: r[2] || "yellow" };
    });
  }

  function saveRanges(paraIndex, ranges) {
    var key = hlKey(paraIndex);
    if (ranges.length) {
      highlights[key] = ranges.map(function (r) { return [r.start, r.end, r.color]; });
    } else {
      delete highlights[key];
    }
    saveJSON(HL_KEY, highlights);
  }

  // Recorta [start, end) de una lista de rangos, partiendo los que se
  // solapan parcialmente. Se usa tanto para reemplazar/borrar un resaltado
  // guardado como para abrir un hueco visual donde se dibuja la selección
  // "pendiente" (ver renderParaContent) sin tocar localStorage todavía.
  function punchRanges(ranges, start, end) {
    var next = [];
    ranges.forEach(function (r) {
      if (r.end <= start || r.start >= end) { next.push(r); return; }
      if (r.start < start) next.push({ start: r.start, end: start, color: r.color });
      if (r.end > end) next.push({ start: end, end: r.end, color: r.color });
    });
    return next;
  }

  // color === null borra el resaltado en ese rango.
  function replaceRange(paraIndex, start, end, color) {
    var next = punchRanges(loadRanges(paraIndex), start, end);
    if (color) next.push({ start: start, end: end, color: color });
    next.sort(function (a, b) { return a.start - b.start; });
    saveRanges(paraIndex, next);
  }

  // Reconstruye el contenido de un <p> a partir del texto plano y sus
  // rangos resaltados, intercalando <mark> para las zonas resaltadas.
  // `pending`, si viene, es la selección recién hecha que todavía no se ha
  // guardado (el usuario está eligiendo color) — se dibuja encima de
  // cualquier resaltado guardado que se solape, sin persistirla.
  function renderParaContent(pEl, text, paraIndex, pending) {
    pEl.innerHTML = "";
    // En modo traducido no se aplican los rangos guardados: los offsets de
    // caracteres corresponden al texto original en español y no coinciden
    // con el texto traducido (el resaltado no se pierde, solo no se dibuja
    // mientras se ve la traducción).
    var ranges = translatedMode ? [] : loadRanges(paraIndex);
    if (pending && !translatedMode) {
      ranges = punchRanges(ranges, pending.start, pending.end);
      ranges.push({ start: pending.start, end: pending.end, color: "pending" });
      ranges.sort(function (a, b) { return a.start - b.start; });
    }
    var pos = 0;
    ranges.forEach(function (r) {
      var start = Math.max(0, Math.min(r.start, text.length));
      var end = Math.max(start, Math.min(r.end, text.length));
      if (start > pos) pEl.appendChild(document.createTextNode(text.slice(pos, start)));
      var mark = document.createElement("mark");
      mark.className = "reader-hl reader-hl--" + r.color;
      mark.textContent = text.slice(start, end);
      if (r.color !== "pending") {
        mark.title = "Toca para quitar el resaltado";
        mark.addEventListener("click", function (e) {
          e.stopPropagation();
          replaceRange(paraIndex, start, end, null);
          renderParaContent(pEl, text, paraIndex);
        });
      }
      pEl.appendChild(mark);
      pos = end;
    });
    if (pos < text.length) pEl.appendChild(document.createTextNode(text.slice(pos)));
  }

  // Calcula el offset (en caracteres, sobre el texto plano) de un punto
  // (node, offset) de un Range, relativo a un contenedor dado.
  function textOffsetInContainer(container, node, offset) {
    var total = 0;
    var found = -1;
    function walk(n) {
      if (found !== -1) return;
      if (n.nodeType === Node.TEXT_NODE) {
        if (n === node) {
          found = total + offset;
          return;
        }
        total += n.textContent.length;
      } else {
        for (var i = 0; i < n.childNodes.length; i++) {
          walk(n.childNodes[i]);
          if (found !== -1) return;
        }
      }
    }
    walk(container);
    return found;
  }

  // ---------- paleta de colores para el resaltado ----------
  // Igual que recursos/assets/text-highlighter.js: en cuanto se conoce el
  // rango elegido se limpia la Selection nativa (para que el navegador no
  // dibuje su propia barra de Copiar/Cortar encima) y se muestra un
  // resaltado "pending" temporal mientras el usuario elige color.
  var pendingSel = null; // { paraIndex, start, end, pEl, text }
  var hlPalette = null;

  function dismissPending() {
    if (hlPalette) hlPalette.hidden = true;
    if (pendingSel) {
      var sel = pendingSel;
      pendingSel = null;
      renderParaContent(sel.pEl, sel.text, sel.paraIndex);
    }
  }

  function buildHighlightPalette() {
    var palette = document.createElement("div");
    palette.className = "reader-hl-palette";
    palette.hidden = true;
    palette.setAttribute("role", "toolbar");
    var isEnglish = currentLang() === "en";
    palette.setAttribute("aria-label", isEnglish ? "Highlighter colors" : "Colores del resaltador");
    var colorNames = isEnglish
      ? { yellow: "yellow", green: "green", blue: "blue", pink: "pink", coral: "coral", violet: "violet" }
      : { yellow: "amarillo", green: "verde", blue: "azul", pink: "rosa", coral: "coral", violet: "violeta" };
    HL_COLORS.forEach(function (color) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "reader-hl-palette__swatch";
      button.dataset.color = color;
      button.setAttribute("aria-label", (isEnglish ? "Highlight in " : "Resaltar en ") + colorNames[color]);
      palette.appendChild(button);
    });
    var erase = document.createElement("button");
    erase.type = "button";
    erase.className = "reader-hl-palette__swatch reader-hl-palette__swatch--erase";
    erase.dataset.color = "";
    erase.setAttribute("aria-label", isEnglish ? "Remove highlight" : "Quitar resaltado");
    erase.textContent = "×";
    palette.appendChild(erase);
    document.body.appendChild(palette);

    palette.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    palette.addEventListener("click", function (e) {
      var button = e.target.closest("[data-color]");
      if (!button || !pendingSel) return;
      var sel = pendingSel;
      pendingSel = null;
      palette.hidden = true;
      replaceRange(sel.paraIndex, sel.start, sel.end, button.dataset.color || null);
      renderParaContent(sel.pEl, sel.text, sel.paraIndex);
    });
    document.addEventListener("pointerdown", function (e) {
      if (!palette.hidden && !palette.contains(e.target)) dismissPending();
    });
    return palette;
  }

  function handleSelection(contentEl) {
    // El resaltado se guarda como rangos de caracteres sobre el texto en
    // español; en modo traducido esos offsets no significarían nada al
    // volver a español, así que se deshabilita mientras se ve la traducción.
    if (translatedMode) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    var range = sel.getRangeAt(0);
    if (!contentEl.contains(range.commonAncestorContainer)) return;

    var startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer;
    var endEl = range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer;
    var startPara = startEl && startEl.closest(".reader-para");
    var endPara = endEl && endEl.closest(".reader-para");
    if (!startPara || !endPara || startPara !== endPara) {
      sel.removeAllRanges();
      return; // solo se admite resaltar dentro de un mismo párrafo
    }

    var paraIndex = parseInt(startPara.dataset.para, 10);
    var a = textOffsetInContainer(startPara, range.startContainer, range.startOffset);
    var b = textOffsetInContainer(startPara, range.endContainer, range.endOffset);
    var rect = range.getBoundingClientRect();
    sel.removeAllRanges();
    if (a < 0 || b < 0 || a === b) return;
    var start = Math.min(a, b), end = Math.max(a, b);
    var text = paraTexts[paraIndex];

    if (!hlPalette) hlPalette = buildHighlightPalette();
    pendingSel = { paraIndex: paraIndex, start: start, end: end, pEl: startPara, text: text };
    renderParaContent(startPara, text, paraIndex, { start: start, end: end });
    var x = Math.max(155, Math.min(window.innerWidth - 155, rect.left + rect.width / 2));
    var y = Math.max(62, rect.top);
    hlPalette.style.left = x + "px";
    hlPalette.style.top = y + "px";
    hlPalette.hidden = false;
  }

  function buildSkeleton() {
    root.innerHTML = "";

    var headTop = el("div", "reader-head-top");
    var headLeft = el("div", "reader-head-left");
    var badge = el("span", "reader-badge", "Librería · " + cfg.author);
    headLeft.appendChild(badge);

    var textsize = el("div", "reader-textsize");
    textsize.setAttribute("role", "group");
    var fontDecBtn = document.createElement("button");
    fontDecBtn.type = "button";
    fontDecBtn.className = "reader-textsize-btn reader-textsize-btn--dec";
    fontDecBtn.textContent = "A−";
    var fontIncBtn = document.createElement("button");
    fontIncBtn.type = "button";
    fontIncBtn.className = "reader-textsize-btn reader-textsize-btn--inc";
    fontIncBtn.textContent = "A+";
    textsize.appendChild(fontDecBtn);
    textsize.appendChild(fontIncBtn);

    var ttsBtn = null;
    if (window.VerboTTS) {
      ttsBtn = document.createElement("button");
      ttsBtn.type = "button";
      ttsBtn.className = "reader-textsize-btn reader-textsize-btn--tts";
      ttsBtn.textContent = "Escuchar";
      textsize.appendChild(ttsBtn);
    }

    headLeft.appendChild(textsize);

    headTop.appendChild(headLeft);
    var bmBtn = el("button", "reader-bookmark-btn", "☆ Marcar este capítulo");
    bmBtn.type = "button";
    headTop.appendChild(bmBtn);
    root.appendChild(headTop);

    var manualNote = el("p", "reader-manual-note");
    manualNote.hidden = true;
    root.appendChild(manualNote);

    var title = el("h1", "reader-title", cfg.title);
    root.appendChild(title);

    // "Guardar para continuar leyendo": guarda EL LIBRO COMPLETO en Mi
    // biblioteca. Deliberadamente su propia fila (no metido en headTop junto
    // al marcador de capítulo ☆) para que no se confunda con él, y pegado al
    // título para que sea lo primero visible al abrir el libro, en móvil
    // incluido (ver reader-savebook-row en reader.css).
    var saveBookRow = el("div", "reader-savebook-row");
    var saveBookBtn = document.createElement("button");
    saveBookBtn.type = "button";
    saveBookBtn.className = "reader-savebook-btn";
    var saveBookIcon = el("span", "reader-savebook-btn-icon");
    saveBookIcon.innerHTML = ICON_BOOKMARK_PLUS;
    var saveBookLabel = el("span", "reader-savebook-btn-label", "Guardar para continuar leyendo");
    saveBookBtn.appendChild(saveBookIcon);
    saveBookBtn.appendChild(saveBookLabel);
    saveBookRow.appendChild(saveBookBtn);
    root.appendChild(saveBookRow);

    if (cfg.licenseNotice) {
      var licenseNotice = el("p", "reader-license", cfg.licenseNotice);
      root.appendChild(licenseNotice);
    }

    var progress = el("div", "reader-progress");
    var progressBar = el("div", "reader-progress-bar");
    progress.appendChild(progressBar);
    root.appendChild(progress);

    var resume = el("div", "reader-resume-banner");
    resume.hidden = true;
    var resumeText = el("span");
    var resumeLink = el("a", null, "Continuar →");
    resumeLink.href = "#";
    var resumeDismiss = el("button", null, "Descartar");
    resumeDismiss.type = "button";
    resume.appendChild(resumeText);
    var resumeActions = el("span");
    resumeActions.appendChild(resumeLink);
    resumeActions.appendChild(document.createTextNode("  "));
    resumeActions.appendChild(resumeDismiss);
    resume.appendChild(resumeActions);
    root.appendChild(resume);

    var nav = el("div", "reader-chapternav");
    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.innerHTML = '←<span class="chapternav-label"> Anterior</span>';
    var select = document.createElement("select");
    select.className = "reader-chapter-select";
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.innerHTML = '<span class="chapternav-label">Siguiente </span>→';
    nav.appendChild(prevBtn);
    nav.appendChild(select);
    nav.appendChild(nextBtn);
    root.appendChild(nav);

    var hint = el("p", "reader-hint", "Selecciona el texto que quieras resaltar (arrastra el dedo o el mouse). Toca un resaltado para quitarlo. Se guarda en este dispositivo.");
    root.appendChild(hint);

    var chapterTitle = el("h2", "reader-chapter-title");
    root.appendChild(chapterTitle);

    var content = el("div", "reader-content");
    content.addEventListener("mouseup", function () { handleSelection(content); });
    root.appendChild(content);

    var foot = el("div", "reader-foot");
    root.appendChild(foot);

    return {
      badge: badge, title: title, hint: hint, unitLabel: cfg.unitLabel,
      bmBtn: bmBtn, progressBar: progressBar, manualNote: manualNote,
      saveBookBtn: saveBookBtn, saveBookIcon: saveBookIcon, saveBookLabel: saveBookLabel,
      resume: resume, resumeText: resumeText, resumeLink: resumeLink, resumeDismiss: resumeDismiss,
      prevBtn: prevBtn, select: select, nextBtn: nextBtn,
      chapterTitle: chapterTitle, content: content, foot: foot,
      fontDecBtn: fontDecBtn, fontIncBtn: fontIncBtn, ttsBtn: ttsBtn
    };
  }

  // Reconstruye las opciones del selector de capítulos. Se llama al iniciar
  // y de nuevo cuando cambia el idioma, para que al menos la palabra de
  // unidad ("Capítulo" -> "Chapter") quede traducida; el resto del título
  // (descriptivo) se deja en español para no disparar decenas de llamadas
  // de traducción por cada cambio de idioma.
  function buildChapterOptions(ui) {
    var unitLabel = ui.unitLabel || cfg.unitLabel;
    ui.select.innerHTML = "";
    chapters.forEach(function (ch, i) {
      var opt = document.createElement("option");
      opt.value = String(i);
      var alreadyLabeled = /^(Libro|Cap[ií]tulo|Secci[oó]n|Fragmento|Visi[oó]n|Mandamiento|S[ií]mil|Salmo)/i.test(ch.title);
      var label = alreadyLabeled ? ch.title : (unitLabel + " " + (i + 1) + " — " + ch.title);
      opt.textContent = label.slice(0, 70);
      ui.select.appendChild(opt);
    });
    ui.select.value = String(current);
  }

  function render(ui) {
    // El contenido del capítulo se reconstruye por completo más abajo, así
    // que cualquier selección "pendiente" (paleta de color abierta, ver
    // handleSelection) quedaría apuntando a nodos huérfanos -- y si el
    // usuario navegó de capítulo, replaceRange escribiría en el capítulo
    // equivocado (usa el `current` global, ya actualizado). Se descarta sin
    // guardar, igual que un toque afuera de la paleta.
    pendingSel = null;
    if (hlPalette) hlPalette.hidden = true;
    detenerTTS(ui); // el capítulo/idioma que se estaba leyendo va a desaparecer del DOM
    var ch = chapters[current];
    var token = ++renderToken;
    // El usuario deja atrás el capítulo/idioma anterior: cualquier traducción
    // suya que siga en curso sigue corriendo (calienta el caché igual), pero
    // ya no debe mantener visible el indicador "Traduciendo…" — ver
    // abandonPendingTranslations en site-translate.js.
    if (window.VerboSiteTranslate && window.VerboSiteTranslate.abandonPendingTranslations) {
      window.VerboSiteTranslate.abandonPendingTranslations();
    }
    var t = window.VerboI18n ? window.VerboI18n.t : function (k) { return k; };
    updateManualBanner(ui);

    ui.progressBar.style.width = Math.round(((current + 1) / chapters.length) * 100) + "%";
    ui.select.value = String(current);
    ui.prevBtn.disabled = current === 0;
    ui.nextBtn.disabled = current === chapters.length - 1;

    ui.content.innerHTML = '<p class="reader-hint">' + t("reader.loading") + '</p>';

    resolveChapterText(ch).then(function (resolved) {
      if (token !== renderToken) return; // el usuario ya navegó a otro capítulo/idioma
      translatedMode = resolved.translated;
      ui.chapterTitle.textContent = resolved.title;
      ui.content.innerHTML = "";
      paraTexts = splitIntoParagraphs(resolved.text);
      paraTexts.forEach(function (text, pi) {
        var p = el("p", "reader-para" + (cfg.bibleManifestUrl ? " reader-para--verse" : ""));
        p.dataset.para = String(pi);
        renderParaContent(p, text, pi);
        ui.content.appendChild(p);
      });
    });

    ui.bmBtn.classList.toggle("is-active", !!(bookmark && bookmark.chapter === current));
    ui.bmBtn.textContent = (bookmark && bookmark.chapter === current) ? t("reader.marked") : t("reader.markChapter");

    var unitLabel = ui.unitLabel || cfg.unitLabel;
    ui.foot.textContent = t("reader.footOf", { unit: unitLabel, current: current + 1, total: chapters.length });

    window.location.hash = String(current + 1);
    // El contenedor que de verdad scrollea en estas páginas es <body>
    // (body.static-page tiene overflow-y:auto; <html> se queda con
    // overflow:hidden global — ver biblia/assets/style.css:50-58 y :3225),
    // así que window.scrollTo aquí era un no-op. No hay header fijo/sticky
    // que tape el contenido, por eso el reset va directo a 0.
    document.body.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(ui, index) {
    if (index < 0 || index >= chapters.length) return;
    current = index;
    render(ui);
  }

  // Navegación táctil del lector independiente de /libreria/. La aplicación
  // bíblica tiene su propio swipe, pero estos libros usan reader.js y por eso
  // necesitan el gesto aquí. Solo responde en móvil y a un movimiento
  // claramente horizontal, para no interferir con el scroll vertical ni con
  // la selección de texto usada por los resaltados.
  function installSwipeNavigation(ui) {
    var startX = null;
    var startY = null;
    var singleTouch = false;

    ui.content.addEventListener("touchstart", function (e) {
      singleTouch = e.touches.length === 1;
      if (!singleTouch) {
        startX = null;
        startY = null;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    ui.content.addEventListener("touchend", function (e) {
      if (!singleTouch || startX === null || !e.changedTouches.length) {
        startX = null;
        startY = null;
        singleTouch = false;
        handleSelection(ui.content);
        return;
      }

      var dx = e.changedTouches[0].clientX - startX;
      var dy = Math.abs(e.changedTouches[0].clientY - startY);
      var selection = window.getSelection();
      var hasTextSelection = selection && !selection.isCollapsed && selection.rangeCount > 0 &&
        ui.content.contains(selection.getRangeAt(0).commonAncestorContainer);
      var isHorizontalSwipe = window.innerWidth <= 760 &&
        Math.abs(dx) >= 60 && dy <= Math.abs(dx) / 2;

      startX = null;
      startY = null;
      singleTouch = false;

      if (hasTextSelection || !isHorizontalSwipe) {
        handleSelection(ui.content);
        return;
      }

      // Un swipe no debe convertirse accidentalmente en un resaltado.
      if (selection) selection.removeAllRanges();
      goTo(ui, current + (dx < 0 ? 1 : -1));
    });

    ui.content.addEventListener("touchcancel", function () {
      startX = null;
      startY = null;
      singleTouch = false;
    }, { passive: true });
  }

  // Pellizco con dos dedos sobre el texto: cambia --reading-font-size en
  // vivo (font-size real vía setFontSizeImmediate — reader.css usa esa
  // variable en .reader-para, así que el texto se reacomoda, no es un
  // transform:scale). touch-action:pan-y en .reader-content (reader.css) ya
  // le quita al navegador el zoom nativo sobre esta zona; el preventDefault
  // de abajo es un refuerzo para navegadores que aun así intenten manejarlo.
  // Actualiza como máximo una vez por frame (requestAnimationFrame) para no
  // recalcular estilos en cada touchmove, y solo escribe en localStorage al
  // soltar los dedos (persistFontSize), no en cada frame del gesto.
  function installPinchZoom(ui) {
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

    ui.content.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) {
        startDist = distance(e.touches);
        startSize = fontSize;
        ui.content.classList.add("is-pinching");
      } else if (startDist != null) {
        // Se sumó un tercer dedo durante el pellizco — se corta el gesto
        // en vez de intentar reinterpretarlo con más de dos toques.
        endPinch({ touches: [] });
      }
    }, { passive: true });

    ui.content.addEventListener("touchmove", function (e) {
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
        ui.content.classList.remove("is-pinching");
        persistFontSize();
      }
    }
    ui.content.addEventListener("touchend", endPinch);
    ui.content.addEventListener("touchcancel", function () { endPinch({ touches: [] }); }, { passive: true });
  }

  function init(raw) {
    chapters = normalize(raw);
    if (!chapters.length) {
      root.innerHTML = '<p class="reader-hint">No se pudo cargar el contenido de este libro.</p>';
      return;
    }

    var ui = buildSkeleton();
    uiRef = ui;
    updateFontSizeButtons();
    ui.fontDecBtn.addEventListener("click", function () { setFontSize(fontSize - FONT_SIZE_STEP); });
    ui.fontIncBtn.addEventListener("click", function () { setFontSize(fontSize + FONT_SIZE_STEP); });
    if (ui.ttsBtn) ui.ttsBtn.addEventListener("click", function () { alClicTTS(ui); });
    window.addEventListener("pagehide", function () { detenerTTS(ui); });
    buildChapterOptions(ui);
    installSwipeNavigation(ui);
    installPinchZoom(ui);

    var hashChapter = parseInt((window.location.hash || "").replace("#", ""), 10);
    if (hashChapter && hashChapter >= 1 && hashChapter <= chapters.length) {
      current = hashChapter - 1;
    } else if (bookmark && bookmark.chapter >= 0 && bookmark.chapter < chapters.length) {
      ui.resume.hidden = false;
      ui.resumeText.textContent = "Tienes un marcador en " + cfg.unitLabel.toLowerCase() + " " + (bookmark.chapter + 1) + ".";
      ui.resumeLink.addEventListener("click", function (e) {
        e.preventDefault();
        ui.resume.hidden = true;
        goTo(ui, bookmark.chapter);
      });
      ui.resumeDismiss.addEventListener("click", function () {
        ui.resume.hidden = true;
      });
    }

    ui.prevBtn.addEventListener("click", function () { goTo(ui, current - 1); });
    ui.nextBtn.addEventListener("click", function () { goTo(ui, current + 1); });
    ui.select.addEventListener("change", function () { goTo(ui, parseInt(ui.select.value, 10)); });
    ui.bmBtn.addEventListener("click", function () {
      if (bookmark && bookmark.chapter === current) {
        bookmark = null;
      } else {
        bookmark = { chapter: current, ts: Date.now() };
      }
      saveJSON(BM_KEY, bookmark);
      var t = window.VerboI18n ? window.VerboI18n.t : function (k) { return k; };
      ui.bmBtn.classList.toggle("is-active", !!bookmark);
      ui.bmBtn.textContent = bookmark ? t("reader.marked") : t("reader.markChapter");
    });

    ui.saveBookBtn.addEventListener("click", function () {
      toggleMiBiblioteca();
      ui.saveBookBtn.classList.remove("reader-savebook-btn--attn");
      updateSaveBookUI(ui);
    });
    // El estado real (guardado o no) depende de VerboBackup/IndexedDB, que
    // carga en paralelo al contenido del capítulo -- se resuelve el botón
    // recién cuando mibibReady confirma que ya se puede consultar sin
    // arriesgar un falso "no guardado" (ver mibibReady más arriba).
    mibibReady.then(function () {
      if (isSavedToMiBiblioteca()) touchMiBibliotecaOpened();
      updateSaveBookUI(ui);
      maybeShowSaveGlow(ui);
    });

    document.addEventListener("verbo:uilang-changed", function () {
      applyChrome(ui).then(function () { render(ui); });
    });
    if (window.VerboI18n) {
      window.VerboI18n.ready().then(function () { applyChrome(ui).then(function () { render(ui); }); });
    } else {
      render(ui);
    }
  }

  root.innerHTML = '<p class="reader-hint">Cargando…</p>';
  var contentPromise = cfg.bibleManifestUrl
    ? loadBibleContent(cfg.bibleManifestUrl)
    : fetch(cfg.dataUrl).then(function (r) { return r.json(); });
  contentPromise
    .then(init)
    .catch(function () {
      root.innerHTML = '<p class="reader-hint">No se pudo cargar el contenido de este libro.</p>';
    });
})();
