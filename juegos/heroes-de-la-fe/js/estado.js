// Estado compartido del editor, historial de deshacer/rehacer y avisos entre módulos.

export const W = 1600, H = 900;

export const estado = {
  historia: null,     // la historia abierta
  escenaId: null,     // escena que se edita
  selId: null,        // elemento seleccionado («linea-<id>» = el globo de una línea del guion)
  lineaVista: null,   // línea del guion cuyo globo se muestra en la escena del editor
  recursos: [],       // categorías de assets/
  sucio: false,       // hay cambios sin guardar
  miniaturas: {},     // id de escena → dataURL (fuera del historial para que deshacer sea liviano)
  deshacer: [],
  rehacer: [],
  portapapeles: null,
};

export const uid = (p = 'e') => p + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 7);

const oyentes = {};
export function on(evento, fn) { (oyentes[evento] ||= []).push(fn); }
export function emit(evento, dato) { (oyentes[evento] || []).forEach(fn => fn(dato)); }

export const escenaActual = () => estado.historia?.escenas.find(e => e.id === estado.escenaId);
export const escenaPorId = id => estado.historia?.escenas.find(e => e.id === id);
export function lineaPorId(id, escena = escenaActual()) {
  let hallada = null;
  cadaLinea(escena?.guion, l => { if (l.id === id) hallada = l; });
  return hallada;
}

export function elementoSel() {
  const id = estado.selId;
  if (!id) return undefined;
  if (id.startsWith('linea-')) {
    const l = lineaPorId(id.slice(6));
    if (!l || l.forma === 'caja') return undefined;
    // Sin acomodar: un globo temporal en la posición automática; se guarda en la línea al moverlo o editarlo.
    return l.globo || estado.globoTemporal?.(l, escenaActual());
  }
  return escenaActual()?.elementos.find(e => e.id === id);
}

export function marcarSucio(v = true) {
  estado.sucio = v;
  emit('sucio', v);
}

let ultimaClave = null;
// Guarda una foto de la historia en el historial. Con «clave», los cambios seguidos con la misma clave
// (escribir en un campo, mover un deslizador) se juntan en un solo paso de deshacer.
export function instantanea(clave = null) {
  if (clave && clave === ultimaClave) return;
  ultimaClave = clave;
  estado.deshacer.push(JSON.stringify(estado.historia));
  if (estado.deshacer.length > 200) estado.deshacer.shift();
  estado.rehacer = [];
}
export const cortarClave = () => { ultimaClave = null; };

export function cambiar(fn, clave = null) {
  instantanea(clave);
  fn();
  marcarSucio();
  emit('cambio');
}

function restaurar(texto) {
  estado.historia = JSON.parse(texto);
  if (!escenaActual()) estado.escenaId = estado.historia.escenas[0]?.id;
  if (!elementoSel()) estado.selId = null;
  cortarClave();
  marcarSucio();
  emit('cambio');
  emit('seleccion');
}

export function deshacer() {
  if (!estado.deshacer.length) return;
  estado.rehacer.push(JSON.stringify(estado.historia));
  restaurar(estado.deshacer.pop());
}

export function rehacer() {
  if (!estado.rehacer.length) return;
  estado.deshacer.push(JSON.stringify(estado.historia));
  restaurar(estado.rehacer.pop());
}

export function seleccionar(id) {
  if (estado.selId === id) return;
  estado.selId = id;
  cortarClave();
  emit('seleccion');
}

export function irAEscena(id) {
  if (!escenaPorId(id)) return;
  estado.escenaId = id;
  estado.selId = null;
  estado.lineaVista = null;
  cortarClave();
  emit('escena');
  emit('seleccion');
}

// ── Modelos ───────────────────────────────────────────────────────────────────────────────────

export function nuevaEscena(titulo = 'Escena nueva', x = 40, y = 40) {
  return {
    id: uid('s'),
    titulo,
    fondo: '',
    colorFondo: '#2a3140',
    elementos: [],
    guion: [],
    salida: { modo: 'una', pregunta: '', opciones: [{ texto: 'Continuar', destino: null }, { texto: '', destino: null }] },
    mapa: { x, y },
  };
}

export function nuevaHistoria(titulo = 'Historia nueva') {
  const base = titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'historia';
  const primera = nuevaEscena('Inicio');
  return {
    id: `${base}-${uid('').slice(-5)}`,
    titulo,
    inicio: primera.id,
    revelar: true,
    escenas: [primera],
  };
}

export const MODELOS = {
  burbuja: () => ({
    tipo: 'burbuja', estilo: 'dialogo', texto: 'Escribe aquí…', w: 420, h: 220, rot: 0,
    relleno: '#ffffff', borde: '#111111', grosor: 4, colorTexto: '#111111', fuente: 'Nunito', tam: 34,
    negrita: true, cursiva: false, alinear: 'center', conCola: true,
  }),
  onomatopeya: () => ({
    tipo: 'onomatopeya', texto: '¡POW!', w: 380, h: 230, rot: -8, fuente: 'Bangers',
    relleno: '#ffe14a', contorno: '#111111', grosor: 14, sombra: true,
    forma: 'estallido', colorForma: '#e8352b', bordeForma: '#111111', espejo: false,
  }),
  simbolo: () => ({ tipo: 'simbolo', simbolo: 'gota', color: '#7fd3ff', contorno: '#111111', w: 130, h: 130, rot: 0, espejo: false }),
  emoji: () => ({ tipo: 'emoji', texto: '😀', w: 160, h: 160, rot: 0, espejo: false }),
  imagen: () => ({ tipo: 'imagen', src: '', w: 300, h: 300, rot: 0, espejo: false }),
};

// Guion: la cadena de diálogo de una escena. Cada paso es una línea o una elección.
// Línea: quién habla (id de un personaje de la escena, '' = narrador), qué dice, con qué cara y cómo se muestra.
// Elección: 2 a 4 respuestas; cada una tiene sus propias líneas de reacción y luego sigue el guion o salta a
// otra escena.
export const FORMAS_LINEA = { globo: '💬 Globo', pensamiento: '💭 Pensado', caja: '▭ Caja abajo' };

export const nuevaLinea = (quien = '', forma = 'globo') =>
  ({ id: uid('l'), tipo: 'linea', quien, texto: '', expresion: '', forma });

export const nuevaOpcion = (texto = '') => ({ id: uid('o'), texto, lineas: [], destino: 'seguir' });

export const nuevaEleccion = (textos = ['Sí', 'No']) =>
  ({ id: uid('c'), tipo: 'eleccion', pregunta: '', opciones: textos.map(nuevaOpcion) });

// Recorre todas las líneas del guion (también las de dentro de las respuestas).
export function cadaLinea(guion, fn) {
  for (const p of guion || []) {
    if (p.tipo === 'linea') fn(p);
    else for (const o of p.opciones) o.lineas.forEach(fn);
  }
}

// Rellena campos que falten (historias guardadas con versiones viejas del editor).
export function normalizar(h) {
  h.revelar ??= true;
  for (const s of h.escenas) {
    s.elementos ||= [];
    s.guion ||= [];
    s.mapa ||= { x: 40, y: 40 };
    s.salida ||= { modo: 'fin', pregunta: '', opciones: [] };
    while (s.salida.opciones.length < 2) s.salida.opciones.push({ texto: '', destino: null });
    for (const el of s.elementos) {
      const modelo = MODELOS[el.tipo]?.();
      if (modelo) for (const k in modelo) el[k] ??= modelo[k];
      if (el.tipo === 'burbuja') el.cola ||= { x: el.x + el.w * 0.3, y: el.y + el.h + 100 };
    }
  }
  if (!h.escenas.some(s => s.id === h.inicio)) h.inicio = h.escenas[0]?.id;
  return h;
}
