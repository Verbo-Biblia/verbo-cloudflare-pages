// Geometría de globos y onomatopeyas. Devuelve trazos SVG (cadenas «d») en coordenadas locales del
// elemento, para que el escenario (SVG) y las miniaturas (Canvas con Path2D) dibujen exactamente lo mismo.

const f = n => Math.round(n * 10) / 10;

export function elipse(cx, cy, rx, ry) {
  return `M${f(cx - rx)},${f(cy)}a${f(rx)},${f(ry)} 0 1,0 ${f(2 * rx)},0a${f(rx)},${f(ry)} 0 1,0 ${f(-2 * rx)},0Z`;
}

export function rectRedondo(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${f(x + r)},${f(y)}H${f(x + w - r)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + r)}V${f(y + h - r)}` +
    `Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)}H${f(x + r)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - r)}` +
    `V${f(y + r)}Q${f(x)},${f(y)} ${f(x + r)},${f(y)}Z`;
}

function poligono(puntos) {
  return 'M' + puntos.map(p => `${f(p[0])},${f(p[1])}`).join('L') + 'Z';
}

// Número pseudoaleatorio estable a partir de un texto (para que cada estallido tenga su propia forma
// pero no cambie al redibujar).
export function semilla(texto) {
  let h = 2166136261;
  for (const c of String(texto)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function estrella(cx, cy, rx, ry, picos, interior, azar, irregular = 0) {
  const pts = [];
  const giro = azar() * Math.PI;
  for (let i = 0; i < picos * 2; i++) {
    const a = giro + (i / (picos * 2)) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 - azar() * (0.1 + irregular) : interior * (1 - irregular / 2 + azar() * irregular);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return poligono(pts);
}

export function nube(cx, cy, rx, ry, escalaBulto = 1) {
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const k = Math.max(8, Math.round(perim / (Math.min(rx, ry) * 0.62 * escalaBulto)));
  const rb = Math.min(perim / k * 0.62, Math.min(rx, ry) * 0.45);
  const trazos = [elipse(cx, cy, rx - rb, ry - rb)];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2;
    trazos.push(elipse(cx + Math.cos(a) * (rx - rb), cy + Math.sin(a) * (ry - rb), rb, rb));
  }
  return { trazos, rb };
}

export const ESTILOS_GLOBO = {
  dialogo: 'Diálogo',
  caja: 'Caja',
  pensamiento: 'Pensamiento',
  grito: 'Grito',
  susurro: 'Susurro',
  narracion: 'Narración',
};

// Globo: { cuerpo: [d], cola: [d], texto: {x,y,w,h}, guiones } en coordenadas locales (0,0 = esquina del
// elemento). La punta de la cola llega en coordenadas locales (px, py).
export function globo(estilo, w, h, grosor, px, py, conCola = true) {
  const m = Math.max(2, grosor);
  const cx = w / 2, cy = h / 2;
  const rx = Math.max(10, w / 2 - m), ry = Math.max(10, h / 2 - m);
  const res = { cuerpo: [], cola: [], texto: null, guiones: estilo === 'susurro' ? `${grosor * 3} ${grosor * 2}` : '' };
  const angulo = Math.atan2((py - cy) / ry, (px - cx) / rx);
  const fuera = ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 > 1.05;
  const tieneCola = conCola && estilo !== 'narracion' && fuera;

  const colaTriangular = (dentro, curva) => {
    const radioMedio = (rx + ry) / 2;
    const base = Math.min(rx, ry) * 0.28;
    const d = Math.min(0.6, base / radioMedio);
    const p1 = [cx + Math.cos(angulo - d) * rx * dentro, cy + Math.sin(angulo - d) * ry * dentro];
    const p2 = [cx + Math.cos(angulo + d) * rx * dentro, cy + Math.sin(angulo + d) * ry * dentro];
    if (!curva) return poligono([p1, [px, py], p2]);
    // Cola curva: los dos lados se doblan hacia el mismo lado.
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    const lx = px - mx, ly = py - my, largo = Math.hypot(lx, ly) || 1;
    const nx = -ly / largo * largo * 0.12, ny = lx / largo * largo * 0.12;
    const c1 = [(p1[0] + px) / 2 + nx, (p1[1] + py) / 2 + ny];
    const c2 = [(p2[0] + px) / 2 + nx, (p2[1] + py) / 2 + ny];
    return `M${f(p1[0])},${f(p1[1])}Q${f(c1[0])},${f(c1[1])} ${f(px)},${f(py)}Q${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}Z`;
  };

  if (estilo === 'caja' || estilo === 'narracion') {
    const r = estilo === 'caja' ? Math.min(rx, ry) * 0.35 : 4;
    res.cuerpo.push(rectRedondo(cx - rx, cy - ry, rx * 2, ry * 2, r));
    res.texto = { x: cx - rx + 18, y: cy - ry + 12, w: rx * 2 - 36, h: ry * 2 - 24 };
    if (tieneCola) res.cola.push(colaTriangular(0.8, true));
  } else if (estilo === 'pensamiento') {
    const n = nube(cx, cy, rx, ry);
    res.cuerpo.push(...n.trazos);
    res.texto = { x: cx - (rx - n.rb) * 0.78, y: cy - (ry - n.rb) * 0.74, w: (rx - n.rb) * 1.56, h: (ry - n.rb) * 1.48 };
    if (tieneCola) {
      const ex = cx + Math.cos(angulo) * rx, ey = cy + Math.sin(angulo) * ry;
      const base = Math.min(rx, ry);
      [[0.2, 0.17], [0.52, 0.12], [0.84, 0.075]].forEach(([t, r]) => {
        res.cola.push(elipse(ex + (px - ex) * t, ey + (py - ey) * t, base * r, base * r));
      });
    }
  } else if (estilo === 'grito') {
    const perim = Math.PI * (rx + ry);
    const picos = Math.max(10, Math.round(perim / (Math.min(rx, ry) * 0.42)));
    res.cuerpo.push(estrella(cx, cy, rx, ry, picos, 0.84, semilla(`${w}x${h}`)));
    res.texto = { x: cx - rx * 0.62, y: cy - ry * 0.58, w: rx * 1.24, h: ry * 1.16 };
    if (tieneCola) res.cola.push(colaTriangular(0.7, false));
  } else {
    res.cuerpo.push(elipse(cx, cy, rx, ry));
    res.texto = { x: cx - rx * 0.74, y: cy - ry * 0.7, w: rx * 1.48, h: ry * 1.4 };
    if (tieneCola) res.cola.push(colaTriangular(0.85, true));
  }
  return res;
}

export const FORMAS_ONOMATOPEYA = {
  ninguna: 'Sin forma',
  estallido: 'Estallido',
  explosion: 'Explosión',
  nube: 'Nube',
  ovalo: 'Óvalo',
};

export function formaOnomatopeya(forma, w, h, id) {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 3, ry = h / 2 - 3;
  const azar = semilla(id || 'x');
  if (forma === 'estallido') return [estrella(cx, cy, rx, ry, 12 + Math.floor(azar() * 5), 0.66, azar)];
  if (forma === 'explosion') return [estrella(cx, cy, rx, ry, 9 + Math.floor(azar() * 5), 0.55, azar, 0.35)];
  if (forma === 'nube') return nube(cx, cy, rx, ry, 1.3).trazos;
  if (forma === 'ovalo') return [elipse(cx, cy, rx, ry)];
  return [];
}

// Tamaño de letra para que el texto llene la caja.
const lienzoMedir = document.createElement('canvas').getContext('2d');
export function medirTexto(texto, fuente, px = 100) {
  lienzoMedir.font = `${px}px "${fuente}"`;
  return lienzoMedir.measureText(texto).width;
}

export function letraOnomatopeya(el) {
  const lineas = String(el.texto || ' ').split('\n');
  const conForma = el.forma && el.forma !== 'ninguna';
  const ancho = Math.max(...lineas.map(l => medirTexto(l || ' ', el.fuente))) / 100 || 1;
  const porAncho = (el.w * (conForma ? 0.66 : 0.9)) / ancho;
  const porAlto = (el.h * (conForma ? 0.55 : 0.82)) / (lineas.length * 0.95);
  return { lineas, tam: Math.max(8, Math.min(porAncho, porAlto)) };
}

// Parte un texto en líneas que caben en «ancho» (para las miniaturas en Canvas).
export function partirLineas(ctx, texto, ancho) {
  const salida = [];
  for (const parrafo of String(texto).split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = linea ? linea + ' ' + palabra : palabra;
      if (ctx.measureText(prueba).width > ancho && linea) {
        salida.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    salida.push(linea);
  }
  return salida;
}

// Símbolos de cómic (gota de sudor, vena de enojo, mareo…), dibujados en una caja de 100×100.
// Cada parte es un relleno (con contorno) o un trazo grueso (con contorno). «color» = el color elegido.
const R = (d, color = 'color') => ({ d, relleno: true, color });
const T = (d, ancho = 9, color = 'color') => ({ d, relleno: false, color, ancho });
const gota = (x, y, k) => `M${x},${y - 42 * k}C${x},${y - 42 * k} ${x - 28 * k},${y - 4 * k} ${x - 28 * k},${y + 12 * k}` +
  `A${28 * k},${28 * k} 0 0,0 ${x + 28 * k},${y + 12 * k}C${x + 28 * k},${y - 4 * k} ${x},${y - 42 * k} ${x},${y - 42 * k}Z`;
const espiral = (() => {
  let d = 'M50,50';
  for (let a = 0; a <= Math.PI * 7; a += 0.25) d += `L${f(50 + Math.cos(a) * a * 2.1)},${f(50 + Math.sin(a) * a * 2.1)}`;
  return d;
})();

export const SIMBOLOS = {
  gota: { nombre: 'Gota de sudor', color: '#7fd3ff', partes: [R(gota(50, 52, 1)), R('M38,58 a7,11 -20 1,0 1,0Z', '#ffffff')] },
  nervios: { nombre: 'Nervios', color: '#7fd3ff', partes: [R(gota(24, 40, 0.55)), R(gota(56, 30, 0.7)), R(gota(80, 66, 0.5))] },
  enojo: { nombre: 'Vena de enojo', color: '#ff3b3b', partes: [
    T('M40,10Q44,38 12,42', 11), T('M60,10Q56,38 88,42', 11), T('M40,90Q44,62 12,58', 11), T('M60,90Q56,62 88,58', 11)] },
  corazon: { nombre: 'Corazón', color: '#ff4d6d', partes: [R('M50,90L13,52A21,21 0 0,1 50,24A21,21 0 0,1 87,52Z'), R('M28,40a6,8 30 1,0 1,0Z', '#ffffff')] },
  roto: { nombre: 'Corazón roto', color: '#ff4d6d', partes: [
    R('M47,88L11,52A21,21 0 0,1 45,22L52,38L42,52L50,64Z'), R('M55,88L89,52A21,21 0 0,0 55,22L60,38L50,52L58,64Z')] },
  estrella: { nombre: 'Estrella', color: '#ffd23f', partes: [R(poligonoEstrella(5, 46, 20))] },
  destello: { nombre: 'Destello', color: '#fff27a', partes: [R('M50,4Q56,44 96,50Q56,56 50,96Q44,56 4,50Q44,44 50,4Z')] },
  mareo: { nombre: 'Mareo', color: '#b9a3ff', partes: [T(espiral, 7)] },
  exclamacion: { nombre: '¡!', color: '#ffe14a', partes: [R('M38,6H62L56,66H44Z'), R('M50,73a11,11 0 1,0 0.1,0Z')] },
  pregunta: { nombre: '¿?', color: '#ffe14a', partes: [T('M30,34Q30,10 50,10Q72,10 72,32Q72,48 50,54V66', 13), R('M50,76a10,10 0 1,0 0.1,0Z')] },
  sorpresa: { nombre: 'Sorpresa', color: '#ffe14a', partes: [R('M30,6H48L45,66H33Z'), R('M39,73a10,10 0 1,0 0.1,0Z'),
    T('M62,30Q62,10 76,10Q92,10 92,28Q92,42 76,46V58', 10), R('M76,72a8,8 0 1,0 0.1,0Z')] },
  zzz: { nombre: 'Zzz', color: '#c9b8ff', partes: [T('M8,62H34L8,90H34', 8), T('M44,36H64L44,58H64', 7), T('M72,10H88L72,28H88', 6)] },
  idea: { nombre: 'Idea', color: '#ffe14a', partes: [
    T('M50,2V10M18,14L24,20M82,14L76,20M6,44H14M86,44H94', 5),
    R('M50,16A26,26 0 0,1 66,64V74H34V64A26,26 0 0,1 50,16Z'), R('M36,78H64V86H36Z', '#9aa1b2'), R('M41,89H59V95H41Z', '#9aa1b2')] },
  musica: { nombre: 'Música', color: '#4aa3ff', partes: [T('M38,76V20L82,10V64', 7), R('M28,78a12,9 -20 1,0 1,0Z'), R('M72,66a12,9 -20 1,0 1,0Z')] },
  susto: { nombre: 'Líneas de susto', color: '#111111', partes: [
    T('M24,46L6,36', 6), T('M30,28L18,10', 6), T('M50,22V2', 6), T('M70,28L82,10', 6), T('M76,46L94,36', 6)] },
  velocidad: { nombre: 'Velocidad', color: '#ffffff', partes: [T('M4,28H66', 6), T('M22,50H96', 6), T('M8,72H58', 6)] },
  nube: { nombre: 'Nube negra', color: '#4b4f5c', partes: [...nube(50, 36, 44, 26, 1.2).trazos.map(d => R(d)),
    R('M52,58L40,78H52L44,98L66,70H54L62,58Z', '#ffe14a')] },
  rubor: { nombre: 'Rubor', color: '#ff8fb1', partes: [R('M4,50a20,12 0 1,0 40,0a20,12 0 1,0 -40,0Z'),
    R('M56,50a20,12 0 1,0 40,0a20,12 0 1,0 -40,0Z'),
    { ...T('M16,44L12,56M26,44L22,56M36,44L32,56M68,44L64,56M78,44L74,56M88,44L84,56', 3, 'contorno'), sinContorno: true }] },
};

function poligonoEstrella(picos, exterior, interior) {
  const pts = [];
  for (let i = 0; i < picos * 2; i++) {
    const a = -Math.PI / 2 + (i / (picos * 2)) * Math.PI * 2;
    const r = i % 2 ? interior : exterior;
    pts.push([50 + Math.cos(a) * r, 52 + Math.sin(a) * r]);
  }
  return poligono(pts);
}
