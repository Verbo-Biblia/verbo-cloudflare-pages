// Lo que el lector necesita saber de un personaje de la escena: con qué nombre habla y dónde está su cabeza
// (para apuntar la cola del globo). Antes vivía en acciones.js, junto con el editor.

const titular = t => t.charAt(0).toUpperCase() + t.slice(1).replace(/[-_]/g, ' ');

export function nombreDe(el) {
  if (!el) return '';
  if (el.nombre) return el.nombre;
  const archivo = decodeURIComponent(el.src?.split('/').pop() || '').replace(/\.[^.]+$/, '');
  return titular(archivo.split('_')[0] || '');
}

// Cabeza aproximada de un personaje en la escena.
export function cabeza(el) {
  return { x: el.x + el.w / 2, y: el.y + el.h * 0.16 };
}
