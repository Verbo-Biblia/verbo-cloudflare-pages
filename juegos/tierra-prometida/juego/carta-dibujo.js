// Dibuja una carta en un canvas 2D. Lo usan el juego (textura 3D) y el creador de cartas.
// El marco, el color y los valores salen de la definición fija; la temática solo pone nombre, imagen y ambientación.

import { COLOR_TIPO, textoReglas, nombreTipo } from '../nucleo/cartas.js';
import { idioma } from './idioma.js';

export const ANCHO = 400, ALTO = 560;
export const ARTE = { x: 24, y: 72, w: 352, h: 264 }; // 4:3

const FUENTE = "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function aclarar(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
  return `rgb(${c.join(',')})`;
}

function envolver(ctx, texto, x, y, ancho, alto, tam, estilo = '') {
  // Reduce la letra hasta que el texto quepa en la caja.
  for (let t = tam; t >= 11; t--) {
    ctx.font = `${estilo} ${t}px ${FUENTE}`;
    const lineas = [];
    for (const parrafo of texto.split('\n')) {
      let linea = '';
      for (const palabra of parrafo.split(' ')) {
        const prueba = linea ? linea + ' ' + palabra : palabra;
        if (ctx.measureText(prueba).width > ancho && linea) { lineas.push(linea); linea = palabra; }
        else linea = prueba;
      }
      lineas.push(linea);
    }
    const alturaLinea = t * 1.22;
    if (lineas.length * alturaLinea <= alto || t === 11) {
      lineas.forEach((l, i) => ctx.fillText(l, x, y + i * alturaLinea));
      return lineas.length * alturaLinea;
    }
  }
  return 0;
}

// Ilustración provisional: figuras geométricas simples por tipo, hasta que la temática ponga su imagen.
function arteProvisional(ctx, tipo) {
  const { x, y, w, h } = ARTE;
  const color = COLOR_TIPO[tipo];
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, aclarar(color, 0.45));
  g.addColorStop(1, aclarar(color, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.strokeStyle = 'rgba(255,255,255,0.82)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  switch (tipo) {
    case 'recolector': // canasta con granos
      ctx.beginPath(); ctx.moveTo(-70, -10); ctx.lineTo(70, -10); ctx.lineTo(50, 70); ctx.lineTo(-50, 70); ctx.closePath(); ctx.fill();
      for (const [cx, cy] of [[-35, -35], [0, -50], [35, -35], [-15, -25], [18, -25]]) { ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 7); ctx.fill(); }
      break;
    case 'constructor': // bloques de muralla
      for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 3; i++) {
        const dx = (fila % 2) * 30;
        ctx.fillRect(-100 + i * 64 + dx, 40 - fila * 40, 56, 32);
      }
      break;
    case 'combatiente': // espada
      ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(14, -70); ctx.lineTo(10, 40); ctx.lineTo(-10, 40); ctx.lineTo(-14, -70); ctx.closePath(); ctx.fill();
      ctx.fillRect(-45, 40, 90, 14); ctx.fillRect(-8, 54, 16, 40);
      break;
    case 'estructura': // torre
      ctx.fillRect(-45, -40, 90, 130);
      for (let i = 0; i < 4; i++) ctx.fillRect(-55 + i * 30, -70, 20, 34);
      ctx.fillStyle = aclarar(color, -0.3); ctx.fillRect(-14, 40, 28, 50);
      break;
    case 'efecto': // destello
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const r = i % 2 ? 30 : 95; const a = i * Math.PI / 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
      break;
    case 'maldicion': // espiral
      ctx.beginPath();
      for (let a = 0; a < 18; a += 0.1) { const r = a * 5.2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function insignia(ctx, cx, cy, r, fondo, texto, borde = '#f3e3b5', colorTexto = '#fff') {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fondo; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = borde; ctx.stroke();
  ctx.fillStyle = colorTexto;
  ctx.font = `bold ${Math.round(r * 1.15)}px ${FUENTE}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texto, cx, cy + 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

/**
 * def: definición fija de la carta · info: { nombre, ambientacion } de la temática · imagen: HTMLImageElement o null
 * actual: { ataque, vida, vidaMax } para mostrar el estado en la mesa (opcional)
 */
export function dibujarCarta(canvas, def, info = {}, imagen = null, terminos = {}, actual = null) {
  canvas.width = ANCHO; canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  const color = COLOR_TIPO[def.tipo];

  // Marco
  ctx.clearRect(0, 0, ANCHO, ALTO);
  rr(ctx, 0, 0, ANCHO, ALTO, 26);
  const g = ctx.createLinearGradient(0, 0, ANCHO, ALTO);
  g.addColorStop(0, aclarar(color, 0.25)); g.addColorStop(0.5, color); g.addColorStop(1, aclarar(color, -0.4));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#1a1410'; ctx.stroke();
  rr(ctx, 12, 12, ANCHO - 24, ALTO - 24, 18);
  ctx.lineWidth = 3; ctx.strokeStyle = aclarar(color, 0.55); ctx.stroke();

  // Nombre
  rr(ctx, 24, 20, ANCHO - 48, 44, 10);
  ctx.fillStyle = '#efe4c8'; ctx.fill();
  ctx.fillStyle = '#1f1710';
  ctx.textAlign = 'center';
  let tn = 28;
  const nombre = info.nombre || '—';
  do { ctx.font = `bold ${tn}px ${FUENTE}`; tn--; } while (ctx.measureText(nombre).width > ANCHO - 140 && tn > 14);
  ctx.fillText(nombre, ANCHO / 2 + 14, 51);
  ctx.textAlign = 'left';

  // Ilustración
  if (imagen && imagen.complete && imagen.naturalWidth) {
    const { x, y, w, h } = ARTE;
    const esc = Math.max(w / imagen.naturalWidth, h / imagen.naturalHeight);
    const sw = w / esc, sh = h / esc;
    ctx.drawImage(imagen, (imagen.naturalWidth - sw) / 2, (imagen.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
  } else arteProvisional(ctx, def.tipo);
  ctx.lineWidth = 4; ctx.strokeStyle = '#1a1410'; ctx.strokeRect(ARTE.x, ARTE.y, ARTE.w, ARTE.h);

  // Línea de tipo
  const yt = ARTE.y + ARTE.h + 6;
  rr(ctx, 24, yt, ANCHO - 48, 30, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
  ctx.fillStyle = '#f4ead2'; ctx.font = `bold 18px ${FUENTE}`;
  ctx.fillText(nombreTipo(def.tipo, terminos), 38, yt + 21);
  const unSoloUso = def.tipo === 'efecto' || def.tipo === 'maldicion';
  if (def.dur || unSoloUso) {
    ctx.textAlign = 'right';
    ctx.font = `italic 16px ${FUENTE}`;
    const en = idioma() === 'en';
    const turnos = def.dur === 1 ? (en ? 'turn' : 'turno') : (en ? 'turns' : 'turnos');
    ctx.fillText(def.dur ? `${en ? 'one use' : 'un uso'} · ${def.dur} ${turnos}` : (en ? 'single use' : 'un solo uso'), ANCHO - 38, yt + 21);
    ctx.textAlign = 'left';
  }

  // Caja de texto
  const yc = yt + 38, hc = ALTO - yc - 64;
  rr(ctx, 24, yc, ANCHO - 48, hc, 8);
  ctx.fillStyle = '#efe4c8'; ctx.fill();
  ctx.fillStyle = '#1f1710';
  const reglas = textoReglas(def, terminos);
  const usado = envolver(ctx, reglas, 36, yc + 24, ANCHO - 72, hc - 16, 19, 'bold');
  if (info.ambientacion) {
    ctx.fillStyle = '#5a4a38';
    envolver(ctx, info.ambientacion, 36, yc + 30 + usado, ANCHO - 72, hc - usado - 22, 16, 'italic');
  }

  // Costo
  insignia(ctx, 44, 44, 30, '#c9a33b', String(def.costo), '#fff3c4', '#2a1d05');

  // Valores de abajo
  const yb = ALTO - 40;
  const vida = actual ? actual.vida : def.vida;
  const vidaMax = actual ? actual.vidaMax : def.vida;
  if (def.tipo === 'combatiente') {
    const atk = actual ? actual.ataque : def.ataque;
    const colA = atk > def.ataque ? '#2f8f3a' : atk < def.ataque ? '#5d5d5d' : '#a8322b';
    insignia(ctx, 50, yb, 30, colA, String(atk));
  }
  if (def.tipo === 'recolector') insignia(ctx, 50, yb, 30, '#3f7d3a', `+${def.prod}`);
  if (def.tipo === 'constructor') insignia(ctx, 50, yb, 30, '#7a5532', `+${def.constr}`);
  if (def.vida) insignia(ctx, ANCHO - 50, yb, 30, vida < vidaMax ? '#b33a2a' : vidaMax > def.vida ? '#2f8f3a' : '#2d6a8a', String(vida));

  return canvas;
}

export function dibujarDorso(canvas, titulo = '') {
  canvas.width = ANCHO; canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  rr(ctx, 0, 0, ANCHO, ALTO, 26);
  const g = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, 20, ANCHO / 2, ALTO / 2, ALTO * 0.7);
  g.addColorStop(0, '#5a3d24'); g.addColorStop(1, '#22150b');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#1a1410'; ctx.stroke();
  rr(ctx, 20, 20, ANCHO - 40, ALTO - 40, 16);
  ctx.lineWidth = 4; ctx.strokeStyle = '#c9a33b'; ctx.stroke();
  ctx.save(); ctx.translate(ANCHO / 2, ALTO / 2);
  ctx.strokeStyle = '#c9a33b'; ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.strokeRect(-70, -70, 140, 140); }
  ctx.restore();
  if (titulo) {
    ctx.fillStyle = '#e9d9a6'; ctx.font = `bold 30px ${FUENTE}`; ctx.textAlign = 'center';
    ctx.fillText(titulo, ANCHO / 2, ALTO - 60);
  }
  return canvas;
}
