// Globo de una línea del guion: el mismo para el editor (vista previa y ajuste) y para el jugador.
// Si la línea tiene «globo» guardado (el usuario lo acomodó a mano), se usa ese; si no, se coloca solo
// encima de quien habla, con la cola hacia su cara.
import { W, MODELOS, estado } from './estado.js?v=27d4c754';
import { cabeza, caraDe } from './personajes.js?v=27d4c754';

export const idGloboLinea = l => 'linea-' + l.id;

export function globoAuto(l, quien, escena = null) {
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
    // Varias posiciones posibles (arriba, a los costados, en diagonal): gana la que no tapa ninguna cara de la
    // escena (la de quien habla ni la de los demás), queda dentro de la pantalla y más cerca de quien habla.
    const c = cabeza(quien), yo = caraDe(quien);
    const caras = (escena?.elementos || []).filter(e => e.tipo === 'imagen' && e.personaje).map(caraDe);
    const lado = c.x < W / 2 ? 1 : -1, sep = 34;
    const candidatos = [
      { x: c.x - el.w / 2 + lado * el.w * 0.3, y: yo.y0 - el.h - sep },                 // arriba, hacia el centro
      { x: c.x - el.w / 2, y: yo.y0 - el.h - sep },                                      // arriba, centrado
      { x: yo.x1 + sep, y: yo.y0 - el.h * 0.5 }, { x: yo.x0 - sep - el.w, y: yo.y0 - el.h * 0.5 },   // costados
      { x: yo.x1 + sep, y: yo.y0 - el.h + 20 }, { x: yo.x0 - sep - el.w, y: yo.y0 - el.h + 20 },    // diagonales
      { x: yo.x1 + sep, y: yo.y1 + 10 }, { x: yo.x0 - sep - el.w, y: yo.y1 + 10 },                   // bajo la cara, al lado
    ];
    let mejor = null;
    for (const p of candidatos) {
      const x = Math.max(12, Math.min(W - el.w - 12, p.x)), y = Math.max(12, p.y);
      const caja = { x0: x, y0: y, x1: x + el.w, y1: y + el.h };
      let costo = Math.hypot(x + el.w / 2 - c.x, y + el.h / 2 - c.y) * 0.02;
      for (const f of caras) costo += cruce(caja, f) * (f === caras.find(g => g.el === quien) ? 1 : 0.8);
      costo += Math.max(0, y + el.h - 640) * 3;          // que no baje a la caja de narración
      costo += Math.abs(p.x - x) * 0.5 + Math.abs(p.y - y) * 0.5;   // lo que hubo que correrlo para que cupiera
      if (!mejor || costo < mejor.costo) mejor = { x, y, costo };
    }
    el.x = mejor.x;
    el.y = mejor.y;
    // La cola apunta al borde de la cara que mira al globo.
    const centroX = el.x + el.w / 2;
    el.cola = centroX > yo.x1 ? { x: yo.x1 + 6, y: (yo.y0 + yo.y1) / 2 + 10 }
      : centroX < yo.x0 ? { x: yo.x0 - 6, y: (yo.y0 + yo.y1) / 2 + 10 }
      : { x: c.x, y: yo.y0 - 4 };
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
  if (!l.globo) return globoAuto(l, quien, escena);
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

// Área de la cara que se superpone (en px²): un globo encima de una cara cuesta mucho.
function cruce(a, b) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}
