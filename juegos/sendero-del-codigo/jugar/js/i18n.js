// Textos de la interfaz (i18n/es.json, i18n/en.json). Las lecciones traen sus dos idiomas dentro.
const textos = {};
let idioma = 'es';

export async function cargarIdioma(id) {
  if (!textos[id]) textos[id] = await (await fetch(`i18n/${id}.json`)).json();
  idioma = id;
  document.documentElement.lang = id;
}
export const idiomaActual = () => idioma;

/** t('clave.sub', {n: 2}) → texto con {n} reemplazado. Si falta la clave, devuelve la clave. */
export function t(clave, vars) {
  let v = clave.split('.').reduce((o, k) => (o == null ? o : o[k]), textos[idioma]);
  if (v == null) return clave;
  if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return v;
}

/** Elige el idioma de un campo bilingüe {es, en}; si es un texto simple lo devuelve igual. */
export const L = (campo) => (campo && typeof campo === 'object' && !Array.isArray(campo) ? (campo[idioma] ?? campo.es) : campo);
