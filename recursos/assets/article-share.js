(function () {
  "use strict";

  // Botón "Compartir" para artículos/reflexiones/devocionales individuales.
  // Se inserta en el mismo grupo .article-textsize que arma
  // article-fontsize.js (A−/A+) — mismo contenedor, mismo estilo de pill,
  // así que basta con que este script corra después de ese. Usa
  // navigator.share() cuando está disponible (móvil/la mayoría de
  // navegadores modernos); si no, copia el enlace al portapapeles y avisa
  // con el mismo .verbo-toast que usa el resto del sitio (biblia/assets/
  // style.css, ya cargado en toda página de /recursos/).
  var article = document.querySelector(".static-page__main article");
  if (!article) return;

  function toast(message, duration) {
    duration = duration || 1600;
    var el = document.querySelector(".verbo-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "verbo-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("verbo-toast--show");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.remove("verbo-toast--show"); }, duration);
  }

  function shareTitle() {
    // "Cuando alguien te decepciona — Devocionales | Verbo" -> el trozo
    // antes del guion largo, que es el título real de la pieza.
    var raw = document.title || "";
    var cut = raw.split(" — ")[0];
    return cut || raw;
  }

  async function doShare() {
    var url = location.href;
    var title = shareTitle();
    if (navigator.share) {
      try {
        await navigator.share({ title: title, url: url });
      } catch (e) {
        // AbortError: el usuario cerró la hoja de compartir sin elegir nada.
        // No es un error real, no hace falta avisar ni caer al portapapeles.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(copiedLabel);
    } catch (e) {
      // Sin Web Share ni Clipboard (navegador muy viejo o contexto no
      // seguro): último recurso, deja el enlace seleccionable en el toast.
      toast(url, 4000);
    }
  }

  var shareLabel = "Compartir";
  var copiedLabel = "Enlace copiado";

  function buildButton() {
    var wrap = article.querySelector(".article-textsize");
    if (!wrap) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "article-textsize-btn article-textsize-btn--share";
    btn.setAttribute("aria-label", shareLabel);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M13 5h6v6M19 5 10 14M8 5H5v14h14v-3"/></svg>';
    btn.addEventListener("click", doShare);
    wrap.appendChild(btn);

    if (window.VerboI18n) {
      window.VerboI18n.ready().then(function () {
        var t = window.VerboI18n.t;
        shareLabel = t("articleMeta.share") || shareLabel;
        copiedLabel = t("articleMeta.linkCopied") || copiedLabel;
        btn.setAttribute("aria-label", shareLabel);
      });
    }
  }

  buildButton();
})();
