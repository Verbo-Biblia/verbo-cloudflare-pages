// Música de fondo de los mini juegos (temas de Juan, ver musica/LICENCIAS.md). Un tema a la vez, con fundido.
// Los navegadores no dejan sonar nada antes del primer toque: el tema pedido arranca con ese toque.
// Se puede apagar aparte de los efectos; la elección se recuerda.

const CARPETA = new URL('./musica/', import.meta.url).href;
const CLAVE = 'mini:musica';
const VOLUMEN = 0.32;
const FUNDIDO = 900; // ms

let actual = null;   // { nombre, audio }
let pedido = null;   // { nombre, repetir }
let desbloqueado = false;

export function musicaActiva() {
  try { return localStorage.getItem(CLAVE) !== 'no'; } catch { return true; }
}

export function fijarMusica(si) {
  try { localStorage.setItem(CLAVE, si ? 'si' : 'no'); } catch { /* sin almacenamiento */ }
  if (!si) apagar(actual);
  else if (pedido) arrancar(pedido.nombre, pedido.repetir);
}

// musica('menu') pone ese tema en bucle; musica('final', false) lo toca una vez; musica(null) la calla.
export function musica(nombre, repetir = true) {
  pedido = nombre ? { nombre, repetir } : null;
  if (!nombre) return apagar(actual);
  if (actual?.nombre === nombre && !actual.audio.paused) return;
  if (desbloqueado && musicaActiva()) arrancar(nombre, repetir);
}

function arrancar(nombre, repetir) {
  if (actual?.nombre === nombre && !actual.audio.paused) return;
  apagar(actual);
  const audio = new Audio(CARPETA + nombre + '.mp3');
  audio.loop = repetir;
  audio.volume = 0;
  actual = { nombre, audio };
  audio.play().then(() => fundir(audio, VOLUMEN)).catch(() => { /* aún sin permiso para sonar */ });
}

function apagar(pista) {
  if (!pista) return;
  if (pista === actual) actual = null;
  fundir(pista.audio, 0, () => pista.audio.pause());
}

function fundir(audio, destino, alTerminar) {
  const desde = audio.volume, inicio = performance.now();
  clearInterval(audio._fundido);
  audio._fundido = setInterval(() => {
    const k = Math.min(1, (performance.now() - inicio) / FUNDIDO);
    audio.volume = desde + (destino - desde) * k;
    if (k === 1) { clearInterval(audio._fundido); alTerminar?.(); }
  }, 40);
}

// Primer toque en la página: arranca el tema que se haya pedido.
addEventListener('pointerdown', () => {
  desbloqueado = true;
  if (pedido && musicaActiva()) arrancar(pedido.nombre, pedido.repetir);
}, { once: true, capture: true });

// Al cambiar de pestaña o bloquear el teléfono, la música se pausa; al volver, sigue.
document.addEventListener('visibilitychange', () => {
  if (!actual) return;
  if (document.hidden) actual.audio.pause();
  else if (musicaActiva()) actual.audio.play().catch(() => {});
});
