// Dibuja escenas: en el DOM (escenario del editor y del jugador) y en Canvas (miniaturas del mapa).
import { W, H } from './estado.js?v=9cd2360b';
import { globo, formaOnomatopeya, letraOnomatopeya, partirLineas, SIMBOLOS } from './formas.js?v=9cd2360b';

const NS = 'http://www.w3.org/2000/svg';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── DOM ────────────────────────────────────────────────────────────────────────────────────────

export function pintarFondo(capa, escena) {
  capa.style.backgroundColor = escena.colorFondo || '#20242c';
  capa.style.backgroundImage = escena.fondo ? `url("${encodeURI(escena.fondo)}")` : 'none';
}

// Sincroniza los nodos de «contenedor» con los elementos de la escena (reutiliza los que ya existen).
export function pintarElementos(contenedor, escena, nodos = new Map()) {
  const vivos = new Set();
  escena.elementos.forEach((el, i) => {
    let nodo = nodos.get(el.id);
    if (!nodo) {
      nodo = document.createElement('div');
      nodo.className = 'el';
      nodo.dataset.id = el.id;
      nodos.set(el.id, nodo);
    }
    actualizarNodo(nodo, el);
    if (contenedor.children[i] !== nodo) contenedor.insertBefore(nodo, contenedor.children[i] || null);
    vivos.add(el.id);
  });
  for (const [id, nodo] of nodos) if (!vivos.has(id)) { nodo.remove(); nodos.delete(id); }
  return nodos;
}

export function actualizarNodo(nodo, el) {
  nodo.dataset.tipo = el.tipo;
  Object.assign(nodo.style, {
    left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px',
    transform: el.rot ? `rotate(${el.rot}deg)` : '',
    opacity: el.opacidad ?? 1,
  });
  const firma = JSON.stringify(el);
  if (nodo._firma === firma) return;
  nodo._firma = firma;

  if (el.tipo === 'imagen') {
    let img = nodo.querySelector('img');
    if (!img) {
      nodo.innerHTML = '';
      img = document.createElement('img');
      img.draggable = false;
      nodo.appendChild(img);
    }
    if (img.getAttribute('src') !== el.src) img.setAttribute('src', el.src);
    img.style.transform = el.espejo ? 'scaleX(-1)' : '';
  } else if (el.tipo === 'emoji') {
    nodo.innerHTML = `<span class="emoji" style="font-size:${Math.min(el.w, el.h) * 0.86}px;` +
      `${el.espejo ? 'transform:scaleX(-1)' : ''}">${esc(el.texto)}</span>`;
  } else if (el.tipo === 'burbuja') {
    pintarGlobo(nodo, el);
  } else if (el.tipo === 'onomatopeya') {
    pintarOnomatopeya(nodo, el);
  } else if (el.tipo === 'simbolo') {
    pintarSimbolo(nodo, el);
  }
}

const colorParte = (p, el) => p.color === 'color' ? el.color : p.color === 'contorno' ? el.contorno : p.color;

function pintarSimbolo(nodo, el) {
  const def = SIMBOLOS[el.simbolo] || SIMBOLOS.gota;
  const partes = def.partes.map(p => p.relleno
    ? `<path d="${p.d}" fill="${colorParte(p, el)}" stroke="${el.contorno}" stroke-width="4.5" stroke-linejoin="round"/>`
    : (p.sinContorno ? '' : `<path d="${p.d}" fill="none" stroke="${el.contorno}" stroke-width="${p.ancho + 7}" stroke-linecap="round" stroke-linejoin="round"/>`) +
      `<path d="${p.d}" fill="none" stroke="${colorParte(p, el)}" stroke-width="${p.ancho}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  nodo.innerHTML = `<svg class="forma" width="${el.w}" height="${el.h}" viewBox="-6 -6 112 112" preserveAspectRatio="none">` +
    `<g${el.espejo ? ' transform="translate(100,0) scale(-1,1)"' : ''}>${partes}</g></svg>`;
}

function pintarGlobo(nodo, el) {
  const g = globo(el.estilo, el.w, el.h, el.grosor, el.cola.x - el.x, el.cola.y - el.y, el.conCola);
  const trazos = [...g.cuerpo, ...g.cola].map(d => `<path d="${d}"/>`).join('');
  const t = g.texto;
  const editando = nodo.querySelector('.texto[contenteditable="true"]');
  nodo.innerHTML =
    `<svg class="forma" width="${el.w}" height="${el.h}">` +
    `<g fill="${el.borde}" stroke="${el.borde}" stroke-width="${el.grosor * 2}" stroke-linejoin="round"` +
    `${g.guiones ? ` stroke-dasharray="${g.guiones}" fill-opacity="0"` : ''}>${trazos}</g>` +
    `<g fill="${el.relleno}">${trazos}</g></svg>` +
    `<div class="texto" style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px;` +
    `font-family:'${el.fuente}';font-size:${el.tam}px;color:${el.colorTexto};text-align:${el.alinear};` +
    `font-weight:${el.negrita ? 800 : 500};font-style:${el.cursiva ? 'italic' : 'normal'};` +
    `justify-content:${{ left: 'flex-start', right: 'flex-end' }[el.alinear] || 'center'}">` +
    `<span>${esc(el.texto)}</span></div>`;
  if (editando) nodo.querySelector('.texto').replaceWith(editando);
}

function pintarOnomatopeya(nodo, el) {
  const { lineas, tam } = letraOnomatopeya(el);
  const formas = formaOnomatopeya(el.forma, el.w, el.h, el.id)
    .map(d => `<path d="${d}"/>`).join('');
  const espejo = el.espejo ? ` transform="translate(${el.w},0) scale(-1,1)"` : '';
  const alto = tam * 0.95;
  const y0 = el.h / 2 - (alto * (lineas.length - 1)) / 2;
  const tspans = lineas.map((l, i) =>
    `<tspan x="${el.w / 2}" y="${y0 + i * alto}">${esc(l)}</tspan>`).join('');
  const comun = `text-anchor="middle" dominant-baseline="central" font-family="${el.fuente}" font-size="${tam}"` +
    ` stroke-linejoin="round" paint-order="stroke" letter-spacing="${tam * 0.02}"`;
  const sombra = el.sombra
    ? `<text ${comun} transform="translate(${tam * 0.06},${tam * 0.07})" fill="${el.contorno}" stroke="${el.contorno}"` +
      ` stroke-width="${tam * el.grosor / 50}">${tspans}</text>` : '';
  nodo.innerHTML =
    `<svg class="forma" width="${el.w}" height="${el.h}">` +
    (formas ? `<g${espejo} fill="${el.colorForma}" stroke="${el.bordeForma}" stroke-width="5" stroke-linejoin="round">${formas}</g>` : '') +
    sombra +
    `<text ${comun} fill="${el.relleno}" stroke="${el.contorno}" stroke-width="${tam * el.grosor / 50}">${tspans}</text></svg>`;
}

// ── Canvas (miniaturas) ────────────────────────────────────────────────────────────────────────

const imagenes = new Map();
export function cargarImagen(src) {
  if (!imagenes.has(src)) {
    imagenes.set(src, new Promise(listo => {
      const i = new Image();
      i.onload = () => listo(i);
      i.onerror = () => listo(null);
      i.src = src;
    }));
  }
  return imagenes.get(src);
}

function cubrir(ctx, img, x, y, w, h, contener) {
  const k = (contener ? Math.min : Math.max)(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * k, ih = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function capas(ctx, trazos, borde, grosor, relleno, guiones) {
  const caminos = trazos.map(d => new Path2D(d));
  ctx.lineJoin = 'round';
  if (grosor > 0) {
    ctx.strokeStyle = borde;
    ctx.fillStyle = borde;
    ctx.lineWidth = grosor * 2;
    if (guiones) ctx.setLineDash(guiones.split(' ').map(Number));
    for (const c of caminos) { if (!guiones) ctx.fill(c); ctx.stroke(c); }
    ctx.setLineDash([]);
  }
  ctx.fillStyle = relleno;
  for (const c of caminos) ctx.fill(c);
}

export async function dibujarEscena(lienzo, escena) {
  const ctx = lienzo.getContext('2d');
  const s = lienzo.width / W;
  const fondo = escena.fondo ? await cargarImagen(escena.fondo) : null;
  const fotos = await Promise.all(escena.elementos.map(el => el.tipo === 'imagen' ? cargarImagen(el.src) : null));
  ctx.save();
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.fillStyle = escena.colorFondo || '#20242c';
  ctx.fillRect(0, 0, W, H);
  if (fondo) cubrir(ctx, fondo, 0, 0, W, H);
  escena.elementos.forEach((el, i) => {
    ctx.save();
    ctx.globalAlpha = el.opacidad ?? 1;
    ctx.translate(el.x + el.w / 2, el.y + el.h / 2);
    ctx.rotate((el.rot || 0) * Math.PI / 180);
    ctx.translate(-el.w / 2, -el.h / 2);
    if (el.tipo === 'imagen' && fotos[i]) {
      if (el.espejo) { ctx.translate(el.w, 0); ctx.scale(-1, 1); }
      cubrir(ctx, fotos[i], 0, 0, el.w, el.h, true);
    } else if (el.tipo === 'emoji') {
      ctx.font = `${Math.min(el.w, el.h) * 0.86}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (el.espejo) { ctx.translate(el.w, 0); ctx.scale(-1, 1); }
      ctx.fillText(el.texto, el.w / 2, el.h / 2);
    } else if (el.tipo === 'simbolo') {
      const def = SIMBOLOS[el.simbolo] || SIMBOLOS.gota;
      ctx.scale(el.w / 112, el.h / 112);
      ctx.translate(6, 6);
      if (el.espejo) { ctx.translate(100, 0); ctx.scale(-1, 1); }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const p of def.partes) {
        const camino = new Path2D(p.d);
        if (p.relleno) {
          ctx.fillStyle = colorParte(p, el);
          ctx.fill(camino);
          ctx.strokeStyle = el.contorno;
          ctx.lineWidth = 4.5;
          ctx.stroke(camino);
        } else {
          ctx.strokeStyle = el.contorno;
          ctx.lineWidth = p.sinContorno ? 0 : p.ancho + 7;
          if (!p.sinContorno) ctx.stroke(camino);
          ctx.strokeStyle = colorParte(p, el);
          ctx.lineWidth = p.ancho;
          ctx.stroke(camino);
        }
      }
    } else if (el.tipo === 'burbuja') {
      const g = globo(el.estilo, el.w, el.h, el.grosor, el.cola.x - el.x, el.cola.y - el.y, el.conCola);
      capas(ctx, [...g.cuerpo, ...g.cola], el.borde, el.grosor, el.relleno, g.guiones);
      ctx.fillStyle = el.colorTexto;
      ctx.font = `${el.cursiva ? 'italic ' : ''}${el.negrita ? 800 : 500} ${el.tam}px "${el.fuente}"`;
      ctx.textAlign = el.alinear || 'center';
      ctx.textBaseline = 'middle';
      const t = g.texto;
      const lineas = partirLineas(ctx, el.texto, t.w);
      const alto = el.tam * 1.2;
      const x = el.alinear === 'left' ? t.x : el.alinear === 'right' ? t.x + t.w : t.x + t.w / 2;
      lineas.forEach((l, k) => ctx.fillText(l, x, t.y + t.h / 2 + (k - (lineas.length - 1) / 2) * alto));
    } else if (el.tipo === 'onomatopeya') {
      ctx.save();
      if (el.espejo) { ctx.translate(el.w, 0); ctx.scale(-1, 1); }
      const formas = formaOnomatopeya(el.forma, el.w, el.h, el.id);
      if (formas.length) capas(ctx, formas, el.bordeForma, 2.5, el.colorForma);
      ctx.restore();
      const { lineas, tam } = letraOnomatopeya(el);
      ctx.font = `${tam}px "${el.fuente}"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = tam * el.grosor / 50;
      const alto = tam * 0.95;
      const y0 = el.h / 2 - (alto * (lineas.length - 1)) / 2;
      lineas.forEach((l, k) => {
        if (el.sombra) {
          ctx.fillStyle = ctx.strokeStyle = el.contorno;
          ctx.strokeText(l, el.w / 2 + tam * 0.06, y0 + k * alto + tam * 0.07);
          ctx.fillText(l, el.w / 2 + tam * 0.06, y0 + k * alto + tam * 0.07);
        }
        ctx.strokeStyle = el.contorno;
        if (el.grosor > 0) ctx.strokeText(l, el.w / 2, y0 + k * alto);
        ctx.fillStyle = el.relleno;
        ctx.fillText(l, el.w / 2, y0 + k * alto);
      });
    }
    ctx.restore();
  });
  ctx.restore();
}

export async function miniatura(escena, ancho = 320) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = Math.round(ancho * H / W);
  await dibujarEscena(c, escena);
  return c.toDataURL('image/jpeg', 0.72);
}

export { NS };
