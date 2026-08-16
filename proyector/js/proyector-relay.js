/* ---------------------------------------------------------
   Relay compartido control.html <-> remoto.html, vía la ruta
   /proyector/estado del Worker existente (Cloudflare KV, sin
   WebRTC ni señalización propia). Ambos lados hacen polling
   (GET) y escriben con POST; el Worker es solo un buzón
   compartido — no hay requisito de latencia real-time para
   play/pausa/detener/volumen. Usado por control.js y remoto.js.
--------------------------------------------------------- */
const PROYECTOR_RELAY_URL = "https://verbo-api-bible.juanjosevenegas78.workers.dev/proyector/estado";
const PROYECTOR_RELAY_POLL_MS = 800;
const PROYECTOR_RELAY_VOLUMEN_DEBOUNCE_MS = 280;

function crearRelayProyector({ onEstado, onError } = {}) {
  let room = null;
  let ultimoTsAplicado = 0;
  let temporizadorPolling = null;
  let temporizadorVolumen = null;
  let volumenPendiente = null;

  async function pedirEstado(codigoSala) {
    const respuesta = await fetch(`${PROYECTOR_RELAY_URL}?room=${encodeURIComponent(codigoSala)}`);
    if (respuesta.status === 404) return null;
    if (!respuesta.ok) throw new Error(`El relay respondió ${respuesta.status}`);
    return respuesta.json();
  }

  async function postearEstado(codigoSala, cambios) {
    const respuesta = await fetch(`${PROYECTOR_RELAY_URL}?room=${encodeURIComponent(codigoSala)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    if (!respuesta.ok) throw new Error(`El relay respondió ${respuesta.status}`);
    return respuesta.json();
  }

  function marcarComoAplicado(ts) {
    if (typeof ts === "number" && ts > ultimoTsAplicado) ultimoTsAplicado = ts;
  }

  function detenerPolling() {
    if (temporizadorPolling) clearInterval(temporizadorPolling);
    temporizadorPolling = null;
  }

  function iniciarPolling(codigoSala) {
    detenerPolling();
    room = codigoSala;
    temporizadorPolling = setInterval(async () => {
      try {
        const estado = await pedirEstado(room);
        if (estado && estado.ts > ultimoTsAplicado) {
          ultimoTsAplicado = estado.ts;
          onEstado?.(estado);
        }
      } catch (error) {
        console.warn("No se pudo consultar el relay de Proyector.", error);
        onError?.(error);
      }
    }, PROYECTOR_RELAY_POLL_MS);
  }

  function enviar(cambios) {
    if (!room) return;
    postearEstado(room, cambios)
      .then((estado) => {
        marcarComoAplicado(estado?.ts);
        // El anti-eco evita que el próximo poll reaplique este mismo cambio
        // (mismo ts) — pero el emisor también necesita ver su propio cambio
        // reflejado ya, no recién cuando llegue otro cambio distinto. Se
        // aplica acá una sola vez con el estado confirmado por el servidor.
        onEstado?.(estado);
      })
      .catch((error) => console.warn("No se pudo enviar el comando al relay de Proyector.", error));
  }

  function enviarVolumenConDebounce(volumen100) {
    volumenPendiente = volumen100;
    if (temporizadorVolumen) return;
    temporizadorVolumen = setTimeout(() => {
      temporizadorVolumen = null;
      if (volumenPendiente !== null) {
        enviar({ volumen: volumenPendiente });
        volumenPendiente = null;
      }
    }, PROYECTOR_RELAY_VOLUMEN_DEBOUNCE_MS);
  }

  function enviarVolumenInmediato(volumen100) {
    volumenPendiente = null;
    if (temporizadorVolumen) {
      clearTimeout(temporizadorVolumen);
      temporizadorVolumen = null;
    }
    enviar({ volumen: volumen100 });
  }

  return {
    iniciarPolling,
    detenerPolling,
    enviar,
    enviarVolumenConDebounce,
    enviarVolumenInmediato,
    marcarComoAplicado,
    pedirEstado,
    postearEstado,
    get room() { return room; },
    set room(valor) { room = valor; },
  };
}

// Genera un código de 6 dígitos libre, reintentando si ya hay una sala viva
// con ese código (colisión poco probable pero posible con 900000 códigos).
async function generarCodigoSalaLibre(intentosMaximos = 5) {
  const relay = crearRelayProyector();
  for (let intento = 0; intento < intentosMaximos; intento += 1) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const estado = await relay.pedirEstado(codigo);
    if (!estado) return codigo; // 404: código libre
  }
  throw new Error("No se encontró un código de sala libre tras varios intentos");
}
