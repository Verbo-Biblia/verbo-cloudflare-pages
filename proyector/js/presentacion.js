const stage = document.getElementById("stage");
const slideEl = document.getElementById("slide");
const slideText = document.getElementById("slide-text");
const slideTextEn = document.getElementById("slide-text-en");
const referenceEl = document.getElementById("reference");
const idleMark = document.getElementById("idle-mark");
const backgroundVideo = document.getElementById("background-video");
const foregroundMedia = document.getElementById("foreground-media");
const foregroundVideo = document.getElementById("foreground-video");
const foregroundImage = document.getElementById("foreground-image");
const foregroundAudio = document.getElementById("foreground-audio");
let mediaVolume = 0.7;

function avisarErrorMultimedia(tipo, error) {
  if (window.opener) {
    window.opener.postMessage({
      type: "media-error",
      payload: { tipo, mensaje: error?.message || String(error) },
    }, "*");
  }
}

function ocultarContenidoVisual() {
  foregroundVideo.pause();
  foregroundMedia.classList.remove("visible");
  foregroundVideo.style.display = "none";
  foregroundImage.style.display = "none";
}

function mostrarDiapositiva(datos) {
  ocultarContenidoVisual();
  idleMark.style.display = "none";
  const esBilingue = typeof datos.textoEs === "string" || typeof datos.textoEn === "string";
  slideText.textContent = esBilingue ? (datos.textoEs || "") : (datos.texto || "");
  slideTextEn.textContent = esBilingue ? (datos.textoEn || "") : "";
  slideEl.classList.toggle("bilingual", esBilingue);
  referenceEl.textContent = datos.referencia || "";
  referenceEl.classList.toggle("visible", !!datos.referencia);
  slideEl.classList.add("visible");
}

function pantallaNegra() {
  ocultarContenidoVisual();
  slideEl.classList.remove("visible");
  referenceEl.classList.remove("visible");
}

function limpiar() {
  ocultarContenidoVisual();
  slideEl.classList.remove("visible");
  referenceEl.classList.remove("visible");
  idleMark.style.display = "flex";
}

function aplicarFondo(datos) {
  const tipo = datos?.tipo || (datos?.dataUrl ? "imagen" : "ninguno");
  const url = datos?.url || datos?.dataUrl || "";
  backgroundVideo.pause();
  backgroundVideo.removeAttribute("src");
  backgroundVideo.style.display = "none";
  if (tipo === "video" && url) {
    stage.style.backgroundImage = "none";
    backgroundVideo.src = url;
    backgroundVideo.style.display = "block";
    backgroundVideo.play().catch(() => {});
  } else if (tipo === "imagen" && url) {
    stage.style.backgroundImage =
      `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${url})`;
  } else if (tipo === "css" && datos.css) {
    stage.style.backgroundImage = datos.css === "#000000" ? "none" : datos.css;
  } else {
    stage.style.backgroundImage = "none";
  }
}

function establecerTiempoAlCargar(elemento, tiempo) {
  const valor = Number(tiempo);
  if (!Number.isFinite(valor) || valor <= 0) return;
  const aplicar = () => {
    try { elemento.currentTime = valor; } catch (_) { /* El navegador aún no permite buscar. */ }
  };
  if (elemento.readyState >= 1) aplicar();
  else elemento.addEventListener("loadedmetadata", aplicar, { once: true });
}

function establecerAudio(datos) {
  const id = datos?.id || "";
  const url = datos?.url || "";
  if (!url) {
    foregroundAudio.pause();
    foregroundAudio.removeAttribute("src");
    foregroundAudio.dataset.mediaId = "";
    foregroundAudio.load();
    return;
  }
  if (foregroundAudio.dataset.mediaId !== id || foregroundAudio.src !== url) {
    foregroundAudio.pause();
    foregroundAudio.src = url;
    foregroundAudio.dataset.mediaId = id;
    foregroundAudio.load();
    establecerTiempoAlCargar(foregroundAudio, datos.currentTime);
  }
}

function controlarAudio(datos) {
  if (datos?.accion === "play" && foregroundAudio.src) {
    foregroundAudio.play().catch((error) => avisarErrorMultimedia("audio", error));
  } else if (datos?.accion === "pause") {
    foregroundAudio.pause();
  }
  aplicarVolumen(datos?.volumen);
}

function establecerContenidoVisual(datos) {
  const id = datos?.id || "";
  const tipo = datos?.tipo || "";
  const url = datos?.url || "";
  if (!id || !url || !["video", "imagen"].includes(tipo)) {
    ocultarContenidoVisual();
    foregroundVideo.removeAttribute("src");
    foregroundVideo.dataset.mediaId = "";
    foregroundVideo.load();
    foregroundImage.removeAttribute("src");
    foregroundImage.dataset.mediaId = "";
    return;
  }
  if (tipo === "video") {
    foregroundImage.style.display = "none";
    if (foregroundVideo.dataset.mediaId !== id || foregroundVideo.src !== url) {
      foregroundVideo.pause();
      foregroundVideo.src = url;
      foregroundVideo.dataset.mediaId = id;
      foregroundVideo.load();
      establecerTiempoAlCargar(foregroundVideo, datos.currentTime);
    }
  } else {
    foregroundVideo.pause();
    foregroundVideo.style.display = "none";
    if (foregroundImage.dataset.mediaId !== id || foregroundImage.src !== url) {
      foregroundImage.src = url;
      foregroundImage.dataset.mediaId = id;
    }
  }
}

function controlarContenidoVisual(datos) {
  const accion = datos?.accion;
  aplicarVolumen(datos?.volumen);
  if (accion === "hide") {
    ocultarContenidoVisual();
    return;
  }
  slideEl.classList.remove("visible");
  referenceEl.classList.remove("visible");
  idleMark.style.display = "none";
  foregroundMedia.classList.add("visible");
  if (accion === "show") {
    foregroundVideo.style.display = "none";
    foregroundImage.style.display = "block";
  } else if (accion === "play") {
    foregroundImage.style.display = "none";
    foregroundVideo.style.display = "block";
    foregroundVideo.play().catch((error) => avisarErrorMultimedia("video", error));
  } else if (accion === "pause") {
    foregroundImage.style.display = "none";
    foregroundVideo.style.display = "block";
    foregroundVideo.pause();
  }
}

function aplicarVolumen(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return;
  mediaVolume = Math.min(1, Math.max(0, numero));
  foregroundAudio.volume = mediaVolume;
  foregroundVideo.volume = mediaVolume;
}

function aplicarTamanoLetra(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return;
  const limitado = Math.min(10, Math.max(3.8, numero));
  document.documentElement.style.setProperty("--fs", `${limitado}vh`);
  document.documentElement.style.setProperty("--fs-bible-es", `${limitado * 0.76}vh`);
  document.documentElement.style.setProperty("--fs-bible-en", `${limitado * 0.66}vh`);
}

function manejarMensaje(msg) {
  if (!msg || !msg.type) return;
  switch (msg.type) {
    case "slide": mostrarDiapositiva(msg.payload); break;
    case "blank": pantallaNegra(); break;
    case "clear": limpiar(); break;
    case "fondo": aplicarFondo(msg.payload); break;
    case "fontSize": aplicarTamanoLetra(msg.payload.valor); break;
    case "mediaAudioSource": establecerAudio(msg.payload); break;
    case "mediaAudioControl": controlarAudio(msg.payload); break;
    case "mediaVisualSource": establecerContenidoVisual(msg.payload); break;
    case "mediaVisualControl": controlarContenidoVisual(msg.payload); break;
    case "mediaVolume": aplicarVolumen(msg.payload?.volumen); break;
  }
}

function informarTiempo(tipo, elemento) {
  if (!window.opener || !elemento.dataset.mediaId) return;
  window.opener.postMessage({
    type: "media-time",
    payload: { tipo, id: elemento.dataset.mediaId, currentTime: elemento.currentTime },
  }, "*");
}

foregroundAudio.addEventListener("timeupdate", () => informarTiempo("audio", foregroundAudio));
foregroundVideo.addEventListener("timeupdate", () => informarTiempo("video", foregroundVideo));
window.addEventListener("message", (event) => manejarMensaje(event.data));

if (window.opener) window.opener.postMessage({ type: "presentacion-lista" }, "*");

aplicarVolumen(mediaVolume);
limpiar();
