// Lo que el lector necesita saber de un personaje de la escena: con qué nombre habla y dónde está su cabeza
// (para apuntar la cola del globo). Antes vivía en acciones.js, junto con el editor.

const titular = t => t.charAt(0).toUpperCase() + t.slice(1).replace(/[-_]/g, ' ');

export function nombreDe(el) {
  if (!el) return '';
  if (el.nombre) return el.nombre;
  const archivo = decodeURIComponent(el.src?.split('/').pop() || '').replace(/\.[^.]+$/, '');
  return titular(archivo.split('_')[0] || '');
}

// Cabeza aproximada de un personaje en la escena (las figuras van recortadas al contorno: la cabeza está arriba,
// centrada, y mide cerca de un séptimo del alto).
const esNino = el => el.h < 540;   // los niños tienen la cabeza más grande respecto del cuerpo
export function cabeza(el) {
  return { x: el.x + el.w / 2, y: el.y + el.h * (esNino(el) ? 0.1 : 0.075) };
}

// Rectángulo de la cara (con un margen), para que los globos no la tapen.
export function caraDe(el) {
  const c = cabeza(el), r = el.h * (esNino(el) ? 0.11 : 0.085);
  return { el, x0: c.x - r, x1: c.x + r, y0: el.y - 8, y1: el.y + el.h * (esNino(el) ? 0.21 : 0.16) };
}
