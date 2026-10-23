// Globo de una línea del guion: el mismo para el editor (vista previa y ajuste) y para el jugador.
// Si la línea tiene «globo» guardado (el usuario lo acomodó a mano), se usa ese; si no, se coloca solo
// encima de quien habla, con la cola hacia su cara.
import { W, MODELOS, estado } from './estado.js?v=9cd2360b';
import { cabeza } from './personajes.js?v=9cd2360b';

export const idGloboLinea = l => 'linea-' + l.id;

export function globoAuto(l, quien) {
  const el = { ...MODELOS.burbuja(), id: idGloboLinea(l), linea: l.id, texto: l.texto };
  const largo = l.texto.length;
  if (l.quien === '*') {
    // Otra voz (alguien que no está en la escena): globo arriba, con la cola hacia abajo para apuntarla.
    el.w = Math.min(600, 300 + largo * 4.2);
    el.h = Math.max(150, Math.ceil(largo / ((el.w * 0.7) / (el.tam * 0.56))) * el.tam * 1.25 / 0.68 + 30);
    el.x = W - el.w - 60;
    el.y = 40;
    el.cola = { x: el.x + el.w * 0.6, y: el.y + el.h + 130 };
    if (l.forma === 'pensamiento') Object.assign(el, { estilo: 'pensamiento', cursiva: true, negrita: false });
  } else if (!quien) {
    Object.assign(el, { estilo: 'narracion', relleno: '#fff3b0', fuente: 'Alegreya', tam: 32, negrita: false,
      alinear: 'left', conCola: false });
    el.w = Math.min(1100, 260 + largo * 15);
    el.h = 70 + Math.ceil(largo * 15 / (el.w - 40)) * 40;
    el.x = (W - el.w) / 2;
    el.y = 24;
    el.cola = { x: el.x, y: el.y };
  } else {
    if (l.forma === 'pensamiento') Object.assign(el, { estilo: 'pensamiento', cursiva: true, negrita: false, tam: 32 });
    el.w = Math.min(600, 300 + largo * 4.2);
    const porLinea = (el.w * 0.7) / (el.tam * 0.56);
    const lineas = Math.max(1, Math.ceil(largo / porLinea));
    el.h = Math.max(150, lineas * el.tam * 1.25 / 0.68 + 30);
    const c = cabeza(quien);
    const lado = c.x < W / 2 ? 1 : -1;
    el.x = Math.max(12, Math.min(W - el.w - 12, c.x - el.w / 2 + lado * el.w * 0.35));
    el.y = Math.max(12, c.y - el.h - 70);
    // Si no cabe arriba, va al costado de la cabeza.
    if (c.y - el.h - 70 < 12) {
      el.y = Math.max(12, c.y - el.h * 0.6);
      el.x = lado > 0 ? Math.min(W - el.w - 12, c.x + quien.w * 0.35) : Math.max(12, c.x - quien.w * 0.35 - el.w);
    }
    el.cola = { x: c.x + lado * quien.w * 0.08, y: c.y - quien.h * 0.03 };
  }
  el.x = Math.round(el.x);
  el.y = Math.round(el.y);
  el.w = Math.round(el.w);
  el.h = Math.round(el.h);
  return el;
}

// El globo que corresponde a la línea en la escena (el guardado, al día con el texto y la forma, o el automático).
export function globoDeLinea(l, escena) {
  if (l.forma === 'caja') return null;
  const quien = escena.elementos.find(e => e.id === l.quien);
  if (!l.globo) return globoAuto(l, quien);
  return sincronizar(l);
}

// El estado pide el globo temporal por aquí (así estado.js no depende de este módulo).
estado.globoTemporal = (l, escena) => globoDeLinea(l, escena);

function sincronizar(l) {
  const g = l.globo;
  g.texto = l.texto;
  g.id = idGloboLinea(l);
  g.linea = l.id;
  if (l.forma === 'pensamiento') g.estilo = 'pensamiento';
  else if (g.estilo === 'pensamiento') g.estilo = 'dialogo';
  return g;
}
