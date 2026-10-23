// Idioma de los mini juegos. Es el mismo valor que guarda Verbo (verbo:uiLang): el juego abre en el idioma que la
// persona eligió en el sitio. Cada juego trae sus textos { es: {...}, en: {...} } y los pide con t('clave').

const CLAVE = 'verbo:uiLang';
let textos = { es: {}, en: {} };

export function idioma() {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE); } catch { /* sin almacenamiento */ }
  if (guardado === 'es' || guardado === 'en') return guardado;
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function cambiarIdioma(lang) {
  try { localStorage.setItem(CLAVE, lang); } catch { /* sin almacenamiento */ }
  document.documentElement.lang = lang;
}

export function fijarTextos(t) { textos = t; }

// t('clave', {n: 3}) → texto con {n} reemplazado.
export function t(clave, vars = {}) {
  const s = textos[idioma()]?.[clave] ?? textos.es[clave] ?? clave;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Pone los textos en los elementos con data-t="clave" (y data-t-aria para aria-label).
export function traducirPagina(raiz = document) {
  document.documentElement.lang = idioma();
  raiz.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  raiz.querySelectorAll('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
}
