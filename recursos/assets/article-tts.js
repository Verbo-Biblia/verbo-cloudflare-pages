(function () {
  "use strict";

  // Botón "Escuchar" para artículos/reflexiones/devocionales individuales.
  // Se inserta en el mismo grupo .article-textsize que arman
  // article-fontsize.js (A−/A+) y article-share.js (Compartir) — mismo
  // contenedor, mismo estilo de pill; basta con que este script corra
  // después de esos dos. Usa el módulo compartido window.VerboTTS
  // (biblia/assets/tts-player.js), que debe cargarse antes que este script.
  var article = document.querySelector(".static-page__main article");
  if (!article) return;
  if (!window.VerboTTS) return;

  // Solo el texto que corresponde leer: el párrafo de "Texto base" dentro
  // del blockquote, y los párrafos directos del artículo (reflexión +
  // oración) — nunca el badge de metadata ni el enlace "Siguiente"
  // (.lesson-nav), que son hijos directos de <article> igual que ellos, ni
  // el <p> de atribución de autor (vive dentro de <footer>, así que
  // ":scope > p" ya lo excluye sin necesidad de nombrarlo aparte).
  var CUERPO_SELECTOR = ":scope > p:not(.article-badge):not(.lesson-nav), :scope > blockquote > p";

  var idioma = article.dataset.pageLang === "en" ? "en" : "es";

  var ETIQUETAS = {
    es: { escuchar: "Escuchar", pausar: "Pausar", reanudar: "Reanudar", aria: "Escuchar este artículo" },
    en: { escuchar: "Listen", pausar: "Pause", reanudar: "Resume", aria: "Listen to this article" }
  };
  var t = ETIQUETAS[idioma];

  var estado = "detenido"; // detenido | reproduciendo | pausado
  var controlador = null;
  var btn = null;

  function actualizarBoton() {
    if (!btn) return;
    if (estado === "reproduciendo") {
      btn.textContent = t.pausar;
      btn.classList.add("is-active");
    } else if (estado === "pausado") {
      btn.textContent = t.reanudar;
      btn.classList.add("is-active");
    } else {
      btn.textContent = t.escuchar;
      btn.classList.remove("is-active");
    }
  }

  function alTerminar() {
    controlador = null;
    estado = "detenido";
    actualizarBoton();
  }

  function detener() {
    if (controlador) controlador.stop();
    alTerminar();
  }

  function alHacerClic() {
    if (estado === "detenido") {
      controlador = window.VerboTTS.leerBloque(article, {
        idioma: idioma,
        tituloSelector: "h1",
        cuerpoSelector: CUERPO_SELECTOR,
        onFinished: alTerminar
      });
      estado = "reproduciendo";
    } else if (estado === "reproduciendo") {
      controlador.pause();
      estado = "pausado";
    } else if (estado === "pausado") {
      controlador.resume();
      estado = "reproduciendo";
    }
    actualizarBoton();
  }

  function buildButton() {
    var wrap = article.querySelector(".article-textsize");
    if (!wrap) return;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "article-textsize-btn article-textsize-btn--tts";
    btn.setAttribute("aria-label", t.aria);
    btn.textContent = t.escuchar;
    btn.addEventListener("click", alHacerClic);
    wrap.appendChild(btn);
  }

  buildButton();

  // Al salir de la página no queda voz sonando en segundo plano.
  window.addEventListener("pagehide", detener);
})();
