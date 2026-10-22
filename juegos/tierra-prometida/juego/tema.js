// Carga una temática: textos, términos, fondos e imágenes de las cartas.

import { CARTAS, TERMINOS_BASE } from '../nucleo/cartas.js';

export const RAIZ = new URL('../', import.meta.url).href;

function cargarImagen(src) {
  return new Promise(res => {
    if (!src) return res(null);
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

export async function listaTemas() {
  try { return await (await fetch(RAIZ + 'tematicas/lista.json', { cache: 'no-store' })).json(); }
  catch { return ['generica']; }
}

export async function cargarTema(id) {
  const base = `${RAIZ}tematicas/${id}/`;
  const datos = await (await fetch(base + 'tema.json', { cache: 'no-store' })).json();
  const imagenes = {}, imagenesRival = {}, imagenesNacion = {};
  await Promise.all(Object.keys(CARTAS).map(async cid => {
    const c = datos.cartas?.[cid] || {};
    imagenes[cid] = c.imagen ? await cargarImagen(base + c.imagen) : null;
    imagenesRival[cid] = c.rival?.imagen ? await cargarImagen(base + c.rival.imagen) : null;
  }));
  // Las imágenes de cada nación rival se cargan recién cuando toca enfrentarla (cargarNacion), no al empezar.
  async function cargarNacion(pers) {
    if (!pers || imagenesNacion[pers]) return;
    const lista = {};
    await Promise.all(Object.keys(CARTAS).map(async cid => {
      const ruta = datos.cartas?.[cid]?.rival?.por?.[pers]?.imagen;
      if (ruta) lista[cid] = await cargarImagen(base + ruta);
    }));
    imagenesNacion[pers] = lista;
  }
  const fondos = {};
  for (const [k, ruta] of Object.entries(datos.fondos || {})) fondos[k] = ruta ? base + ruta : '';
  const tema = {
    id, datos, base, imagenes, imagenesRival, fondos,
    rivalActual: null, // personalidad del rival de la partida en curso (la pone main.js)
    cargarNacion,
    terminos: { ...TERMINOS_BASE, ...(datos.terminos || {}) },
    // j = 1: la carta en manos del rival puede tener otro nombre, imagen y ambientación (cartas[id].rival).
    info: (cid, j = 0) => {
      const c = datos.cartas?.[cid] || { nombre: cid };
      if (j !== 1 || !c.rival) return c;
      const n = c.rival.por?.[tema.rivalActual] || {};
      return { ...c, nombre: n.nombre || c.rival.nombre || c.nombre, ambientacion: n.ambientacion ?? c.rival.ambientacion ?? c.ambientacion };
    },
    imagen: (cid, j = 0) => (j === 1 && (imagenesNacion[tema.rivalActual]?.[cid] || imagenesRival[cid])) || imagenes[cid],
    nombreRival: p => datos.rivales?.[p] || p,
  };
  return tema;
}
