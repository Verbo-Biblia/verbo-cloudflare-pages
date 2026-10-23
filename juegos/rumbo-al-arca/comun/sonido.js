// Efectos de sonido de los mini juegos (licencias en sonidos/LICENCIAS.md). Se pueden silenciar; se recuerda.

const CARPETA = new URL('./sonidos/', import.meta.url).href;
const SONIDOS = {
  voltear: ['bookFlip1.ogg', 'bookFlip2.ogg'],
  par: ['combo-1.mp3'],
  fallo: ['descartar-1.mp3'],
  boton: ['seleccion-1.mp3'],
  victoria: ['victoria-1.mp3'],
  premio: ['bendicion.ogg'],
};
const CLAVE = 'mini:sonido';
const cache = {};

export function sonidoActivo() {
  try { return localStorage.getItem(CLAVE) !== 'no'; } catch { return true; }
}

export function fijarSonido(si) {
  try { localStorage.setItem(CLAVE, si ? 'si' : 'no'); } catch { /* sin almacenamiento */ }
}

export function sonar(nombre, volumen = 0.7) {
  if (!sonidoActivo()) return;
  const lista = SONIDOS[nombre];
  if (!lista) return;
  const archivo = lista[Math.floor(Math.random() * lista.length)];
  const base = cache[archivo] ??= new Audio(CARPETA + archivo);
  const a = base.cloneNode();
  a.volume = volumen;
  a.play().catch(() => { /* el navegador aún no deja sonar */ });
}

// Carga los sonidos al primer toque para que el primero no llegue tarde.
export function precargar() {
  for (const lista of Object.values(SONIDOS)) for (const f of lista) (cache[f] ??= new Audio(CARPETA + f)).load();
}
