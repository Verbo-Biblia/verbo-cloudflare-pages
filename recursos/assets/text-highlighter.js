/* Resaltador de texto libre para lecciones de Escuela Dominical.
   Deliberadamente excluye marcadores, referencias y funciones de copiado. */
(function () {
  "use strict";

  var COLORS = ["yellow", "green", "blue", "pink", "coral", "violet"];
  var MARK_CLASS = "lesson-highlight";

  function uiLanguage() {
    return window.VerboI18n ? VerboI18n.getUiLang() : "es";
  }

  function pageLanguage(root) {
    return root.getAttribute("data-page-lang") || "es";
  }

  function textNodes(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!node.nodeValue || !node.nodeValue.length || !parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("." + MARK_CLASS)) return NodeFilter.FILTER_ACCEPT;
        if (parent.closest("script,style,button,.lesson-nav,.lesson-highlight-palette")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function unwrapMarks(root) {
    root.querySelectorAll("." + MARK_CLASS).forEach(function (mark) {
      mark.replaceWith(document.createTextNode(mark.textContent || ""));
    });
    root.normalize();
  }

  function pointOffset(root, target, localOffset) {
    var total = 0;
    var nodes = textNodes(root);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] === target) return total + localOffset;
      total += nodes[i].nodeValue.length;
    }
    return null;
  }

  function selectionOffsets(root, range) {
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
    var start = pointOffset(root, range.startContainer, range.startOffset);
    var end = pointOffset(root, range.endContainer, range.endOffset);
    if (start === null || end === null || end <= start) return null;
    return { start: start, end: end };
  }

  function normalize(items) {
    return items
      .filter(function (item) {
        return Number.isInteger(item.start) && Number.isInteger(item.end) && item.end > item.start && COLORS.indexOf(item.color) !== -1;
      })
      .sort(function (a, b) { return a.start - b.start || a.end - b.end; });
  }

  function paint(root, items) {
    unwrapMarks(root);
    var nodes = textNodes(root);
    var spans = [], cursor = 0;
    nodes.forEach(function (node) {
      var start = cursor;
      cursor += node.nodeValue.length;
      spans.push({ node: node, start: start, end: cursor });
    });
    normalize(items).slice().reverse().forEach(function (item) {
      spans.slice().reverse().forEach(function (span) {
        var from = Math.max(item.start, span.start);
        var to = Math.min(item.end, span.end);
        if (to <= from || !span.node.isConnected) return;
        var range = document.createRange();
        range.setStart(span.node, from - span.start);
        range.setEnd(span.node, to - span.start);
        var mark = document.createElement("mark");
        mark.className = MARK_CLASS + " " + MARK_CLASS + "--" + item.color;
        mark.setAttribute("data-highlight-color", item.color);
        try { range.surroundContents(mark); } catch (_) {}
      });
    });
  }

  function replaceInterval(items, start, end, color) {
    var next = [];
    items.forEach(function (item) {
      if (item.end <= start || item.start >= end) { next.push(item); return; }
      if (item.start < start) next.push({ start: item.start, end: start, color: item.color });
      if (item.end > end) next.push({ start: end, end: item.end, color: item.color });
    });
    if (color) next.push({ start: start, end: end, color: color });
    return normalize(next);
  }

  function init(root) {
    var slug = root.getAttribute("data-highlight-slug");
    if (!slug) return;
    var storageKey = "highlight:leccion-12-14:" + slug;
    var isEnglish = pageLanguage(root) === "en";
    var colorNames = isEnglish
      ? { yellow: "yellow", green: "green", blue: "blue", pink: "pink", coral: "coral", violet: "violet" }
      : { yellow: "amarillo", green: "verde", blue: "azul", pink: "rosa", coral: "coral", violet: "violeta" };
    var items = [];
    try { items = normalize(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch (_) {}

    var palette = document.createElement("div");
    palette.className = "lesson-highlight-palette";
    palette.hidden = true;
    palette.setAttribute("role", "toolbar");
    palette.setAttribute("aria-label", isEnglish ? "Highlighter colors" : "Colores del resaltador");
    COLORS.forEach(function (color) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "lesson-highlight-palette__swatch";
      button.dataset.color = color;
      button.setAttribute("aria-label", (isEnglish ? "Highlight in " : "Resaltar en ") + colorNames[color]);
      palette.appendChild(button);
    });
    var erase = document.createElement("button");
    erase.type = "button";
    erase.className = "lesson-highlight-palette__swatch lesson-highlight-palette__swatch--erase";
    erase.dataset.color = "";
    erase.setAttribute("aria-label", isEnglish ? "Remove highlight" : "Quitar resaltado");
    erase.textContent = "×";
    palette.appendChild(erase);
    document.body.appendChild(palette);

    var pending = null;
    function hide() { palette.hidden = true; pending = null; }
    function showForSelection() {
      if (uiLanguage() !== pageLanguage(root)) { hide(); return; }
      var selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) { hide(); return; }
      var range = selection.getRangeAt(0);
      var offsets = selectionOffsets(root, range);
      if (!offsets || !selection.toString().trim()) { hide(); return; }
      pending = offsets;
      var rect = range.getBoundingClientRect();
      var x = Math.max(155, Math.min(window.innerWidth - 155, rect.left + rect.width / 2));
      var y = Math.max(62, rect.top);
      palette.style.left = x + "px";
      palette.style.top = y + "px";
      palette.hidden = false;
    }

    palette.addEventListener("pointerdown", function (event) { event.preventDefault(); });
    palette.addEventListener("click", function (event) {
      var button = event.target.closest("[data-color]");
      if (!button || !pending) return;
      items = replaceInterval(items, pending.start, pending.end, button.dataset.color || null);
      try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch (_) {}
      window.getSelection().removeAllRanges();
      hide();
      paint(root, items);
    });

    var selectionTimer = null;
    function scheduleSelectionCheck(delay) {
      window.clearTimeout(selectionTimer);
      selectionTimer = window.setTimeout(showForSelection, delay || 0);
    }
    // `mouseup` es el disparador principal en PC. `pointerup` cubre lápiz y
    // dispositivos híbridos; `selectionchange` sirve de respaldo para
    // selección por teclado y navegadores que no entregan el evento al article.
    root.addEventListener("mouseup", function () { scheduleSelectionCheck(0); });
    root.addEventListener("pointerup", function (event) {
      if (event.pointerType && event.pointerType !== "mouse") scheduleSelectionCheck(0);
    });
    document.addEventListener("selectionchange", function () {
      var selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount && root.contains(selection.anchorNode)) {
        scheduleSelectionCheck(120);
      }
    });
    root.addEventListener("keyup", function (event) {
      if (event.key === "Shift" || String(event.key || "").indexOf("Arrow") !== -1) scheduleSelectionCheck(0);
    });
    document.addEventListener("pointerdown", function (event) {
      if (!palette.contains(event.target) && !root.contains(event.target)) hide();
    });
    document.addEventListener("verbo:uilang-changed", function () {
      hide();
      unwrapMarks(root);
      window.setTimeout(function () {
        if (uiLanguage() === pageLanguage(root)) paint(root, items);
      }, 0);
    });

    if (uiLanguage() === pageLanguage(root)) paint(root, items);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("article[data-highlight-slug]").forEach(init);
  });
})();
