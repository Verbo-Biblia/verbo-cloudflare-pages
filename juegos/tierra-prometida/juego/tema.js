// Carga una temática: textos, términos, fondos e imágenes de las cartas.

import { CARTAS, TERMINOS_BASE, TERMINOS_BASE_EN, fijarIdiomaReglas } from '../nucleo/cartas.js';
import { idioma } from './idioma.js';

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

// Combina la traducción sobre el original: objetos campo a campo, listas por posición, textos reemplazados.
function combinar(base, extra) {
  if (Array.isArray(base) && Array.isArray(extra)) return base.map((v, i) => i < extra.length ? combinar(v, extra[i]) : v);
  if (base && extra && typeof base === 'object' && typeof extra === 'object' && !Array.isArray(base)) {
    const r = { ...base };
    for (const [k, v] of Object.entries(extra)) r[k] = k in base ? combinar(base[k], v) : v;
    return r;
  }
  return extra ?? base;
}

export async function cargarTema(id) {
  const base = `${RAIZ}tematicas/${id}/`;
  let datos = await (await fetch(base + 'tema.json', { cache: 'no-store' })).json();
  // En inglés: tema.en.json (solo los textos traducidos) se combina sobre el tema en español.
  const lang = idioma();
  fijarIdiomaReglas(lang);
  if (lang === 'en') {
    try {
      const r = await fetch(base + 'tema.en.json', { cache: 'no-store' });
      if (r.ok) datos = combinar(datos, await r.json());
    } catch {}
  }
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
    idioma: lang,
    terminos: { ...(lang === 'en' ? TERMINOS_BASE_EN : TERMINOS_BASE), ...(datos.terminos || {}) },
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
