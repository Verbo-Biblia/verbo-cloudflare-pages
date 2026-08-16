/* ---------------------------------------------------------
   Control remoto (celular): play/pausa/detener/volumen sobre
   el mismo relay que usa control.js (ver js/proyector-relay.js).
   Este lado nunca reproduce nada — solo refleja y comanda el
   estado de la PC.
--------------------------------------------------------- */
const pantallaCodigo = document.getElementById("pantalla-codigo");
const pantallaControl = document.getElementById("pantalla-control");
const formCodigo = document.getElementById("form-codigo");
const inputCodigo = document.getElementById("input-codigo");
const estadoConexionCodigo = document.getElementById("estado-conexion-codigo");
const estadoConexionControl = document.getElementById("estado-conexion-control");
const itemActivoEl = document.getElementById("item-activo");
const btnPlayPausa = document.getElementById("btn-play-pausa");
const btnDetener = document.getElementById("btn-detener");
const inputVolumen = document.getElementById("input-volumen");
const outputVolumen = document.getElementById("output-volumen");
const btnCambiarSala = document.getElementById("btn-cambiar-sala");

let aplicandoRemoto = false;
let reproduciendoActual = false;

function aplicarEstadoRemoto(estado) {
  aplicandoRemoto = true;
  try {
    if ("itemActivo" in estado) {
      itemActivoEl.textContent = estado.itemActivo || "Nada seleccionado";
    }
    if (typeof estado.reproduciendo === "boolean") {
      reproduciendoActual = estado.reproduciendo;
      btnPlayPausa.textContent = reproduciendoActual ? "❚❚ Pausar" : "▶ Reproducir";
    }
    if (typeof estado.volumen === "number") {
      inputVolumen.value = String(estado.volumen);
      outputVolumen.textContent = `${estado.volumen}%`;
    }
    estadoConexionControl.classList.remove("error");
    estadoConexionControl.textContent = "";
  } finally {
    aplicandoRemoto = false;
  }
}

const relay = crearRelayProyector({
  onEstado: aplicarEstadoRemoto,
  onError: () => {
    estadoConexionControl.classList.add("error");
    estadoConexionControl.textContent = "Sin conexión con la PC, reintentando…";
  },
});

async function conectarSala(codigo) {
  estadoConexionCodigo.classList.remove("error");
  estadoConexionCodigo.textContent = "Conectando…";
  try {
    const estado = await relay.pedirEstado(codigo);
    if (!estado) {
      estadoConexionCodigo.classList.add("error");
      estadoConexionCodigo.textContent = "Ese código no existe o venció. Verificalo en la pantalla de la PC.";
      return;
    }
    relay.room = codigo;
    aplicarEstadoRemoto(estado);
    relay.marcarComoAplicado(estado.ts);
    relay.iniciarPolling(codigo);
    pantallaCodigo.hidden = true;
    pantallaControl.hidden = false;
  } catch (error) {
    console.error(error);
    estadoConexionCodigo.classList.add("error");
    estadoConexionCodigo.textContent = "No se pudo conectar. Revisá tu conexión e intentá de nuevo.";
  }
}

formCodigo.addEventListener("submit", (event) => {
  event.preventDefault();
  const codigo = inputCodigo.value.trim();
  if (!/^\d{6}$/.test(codigo)) {
    estadoConexionCodigo.classList.add("error");
    estadoConexionCodigo.textContent = "El código debe tener 6 dígitos.";
    return;
  }
  conectarSala(codigo);
});

btnPlayPausa.addEventListener("click", () => {
  if (aplicandoRemoto) return;
  reproduciendoActual = !reproduciendoActual;
  btnPlayPausa.textContent = reproduciendoActual ? "❚❚ Pausar" : "▶ Reproducir";
  relay.enviar({ reproduciendo: reproduciendoActual, origen: "remoto" });
});

btnDetener.addEventListener("click", () => {
  if (aplicandoRemoto) return;
  reproduciendoActual = false;
  btnPlayPausa.textContent = "▶ Reproducir";
  relay.enviar({ reproduciendo: false, origen: "remoto" });
});

inputVolumen.addEventListener("input", () => {
  if (aplicandoRemoto) return;
  outputVolumen.textContent = `${inputVolumen.value}%`;
  relay.enviarVolumenConDebounce(Number(inputVolumen.value));
});
inputVolumen.addEventListener("change", () => {
  if (aplicandoRemoto) return;
  relay.enviarVolumenInmediato(Number(inputVolumen.value));
});

btnCambiarSala.addEventListener("click", () => {
  relay.detenerPolling();
  relay.room = null;
  pantallaControl.hidden = true;
  pantallaCodigo.hidden = false;
  inputCodigo.value = "";
  estadoConexionCodigo.textContent = "";
});

// Auto-conectar si la URL trae ?room=XXXXXX (vino del QR).
const paramsUrl = new URLSearchParams(location.search);
const roomDesdeUrl = paramsUrl.get("room");
if (roomDesdeUrl && /^\d{6}$/.test(roomDesdeUrl)) {
  inputCodigo.value = roomDesdeUrl;
  conectarSala(roomDesdeUrl);
}
