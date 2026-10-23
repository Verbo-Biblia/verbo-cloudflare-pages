// Escena 3D: renderizador, cielo de noche con luna llena, luz de luna y de faroles, materiales de piedra y
// adobe pintados en el momento (sin imágenes que descargar) y constructores de casas, tejados y fondo.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export let renderizador, escena, camara;
let calidadAlta = true;

// Ambientes: cielo, niebla, luz principal (luna o sol), cielo/suelo y relleno. 'cueva' = subterráneo sin cielo.
export const AMBIENTES = {
  noche:     { cielo: () => cieloNoche(), niebla: [0x1a2238, 28, 120], sol: [0xbfd0ff, 1.25], hemi: [0x5a6ea8, 0x3a2a1c, 1.0], relleno: [0xffd6a0, 0.18], exp: 1.15, ventanas: true, fondo: [0x3c3d55, 0x1c2140, 0x1b2140, 0x141a33] },
  amanecer:  { cielo: () => cieloGradiente(['#2a2e5e', '#8a5a7a', '#e8986a', '#ffd9a0'], [710, 150], '#fff2d0', 46), niebla: [0x7a6a80, 30, 140], sol: [0xffc48a, 1.6], hemi: [0xa6a8d0, 0x5a4030, 1.0], relleno: [0xffd0a0, 0.25], exp: 1.05, ventanas: false, fondo: [0x9a8478, 0x7a6a84, 0x6a5a7a, 0x5a4a68] },
  dia:       { cielo: () => cieloGradiente(['#3f78c0', '#6fa4dc', '#a9cdeb', '#e2eef2'], [300, 90], '#fffbe8', 40, true), niebla: [0xb7cddd, 40, 170], sol: [0xfff0d8, 2.0], hemi: [0xbcd8f0, 0x7a6040, 1.15], relleno: [0xfff0d0, 0.2], exp: 1.0, ventanas: false, fondo: [0xc0ac8a, 0xa4b0bc, 0x94a6b8, 0x86a0b4] },
  atardecer: { cielo: () => cieloGradiente(['#3a3a7a', '#a0567a', '#f08a4a', '#ffcf7a'], [820, 330], '#ffe0a0', 54), niebla: [0x8a5a60, 30, 140], sol: [0xffa860, 1.7], hemi: [0xb0a0c8, 0x5a3a28, 1.0], relleno: [0xffc890, 0.25], exp: 1.05, ventanas: false, fondo: [0x946a64, 0x74506a, 0x643e60, 0x543452] },
  cueva:     { cielo: () => new THREE.Color(0x07060a), niebla: [0x0a0908, 10, 45], sol: [0x9aa0b8, 0.25], hemi: [0x4a4a60, 0x2a1e14, 0.45], relleno: [0xffb070, 0.12], exp: 1.25, ventanas: false, fondo: [0x2a2420, 0x1a1614, 0x120f0e, 0x0a0908] },
};
export let ambiente = AMBIENTES.noche;
let luzSol, luzHemi, luzRelleno;

export function aplicarAmbiente(nombre) {
  ambiente = AMBIENTES[nombre] ?? AMBIENTES.noche;
  const A = ambiente;
  escena.background = A.cielo();
  escena.fog = new THREE.Fog(...A.niebla);
  luzSol.color.set(A.sol[0]); luzSol.intensity = A.sol[1];
  luzHemi.color.set(A.hemi[0]); luzHemi.groundColor.set(A.hemi[1]); luzHemi.intensity = A.hemi[2];
  luzRelleno.color.set(A.relleno[0]); luzRelleno.intensity = A.relleno[1];
  renderizador.toneMappingExposure = A.exp;
}

export function crearEscena(lienzo, alta) {
  calidadAlta = alta;
  renderizador = new THREE.WebGLRenderer({ canvas: lienzo, antialias: alta, powerPreference: 'high-performance' });
  renderizador.setPixelRatio(Math.min(devicePixelRatio, alta ? 2 : 1));
  renderizador.outputColorSpace = THREE.SRGBColorSpace;
  renderizador.toneMapping = THREE.ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.15;
  escena = new THREE.Scene();
  escena.background = cieloNoche();
  escena.fog = new THREE.Fog(0x1a2238, 28, 120);
  camara = new THREE.PerspectiveCamera(36, 16 / 9, 0.3, 400);
  // luz de luna (fría) + cielo/suelo (azul y tierra) + un relleno cálido muy suave
  luzSol = new THREE.DirectionalLight(0xbfd0ff, 1.25);
  luzSol.position.set(-30, 50, 40);
  escena.add(luzSol);
  luzHemi = new THREE.HemisphereLight(0x5a6ea8, 0x3a2a1c, 1.0);
  escena.add(luzHemi);
  luzRelleno = new THREE.AmbientLight(0xffd6a0, 0.18);
  escena.add(luzRelleno);
  ajustarTamano();
  addEventListener('resize', ajustarTamano);
  return { renderizador, escena, camara };
}

export function fijarCalidad(alta) {
  calidadAlta = alta;
  renderizador?.setPixelRatio(Math.min(devicePixelRatio, alta ? 2 : 1));
  ajustarTamano();
}

export function ajustarTamano() {
  if (!renderizador) return;
  const w = innerWidth, h = innerHeight;
  renderizador.setSize(w, h, false);
  camara.aspect = w / h;
  // en vertical se aleja la cámara un poco (ver lo que viene) sin que el personaje quede diminuto
  camara.fov = w / h < 1 ? 52 : 36;
  camara.updateProjectionMatrix();
}

// ---------- cielo
function cieloNoche() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#060a1c');
  g.addColorStop(0.55, '#16214a');
  g.addColorStop(0.85, '#3b3f6a');
  g.addColorStop(1, '#5a4a62');
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);
  // estrellas (semilla fija: el cielo es siempre el mismo)
  let s = 7;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 420; i++) {
    const px = azar() * 1024, py = azar() * 360, r = azar() < 0.08 ? 1.4 : 0.7;
    x.globalAlpha = 0.35 + azar() * 0.65 * (1 - py / 420);
    x.fillStyle = azar() < 0.2 ? '#ffe9c4' : '#dfe8ff';
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  x.globalAlpha = 1;
  // luna llena de Pascua, con halo
  const lx = 760, ly = 120;
  const halo = x.createRadialGradient(lx, ly, 20, lx, ly, 150);
  halo.addColorStop(0, 'rgba(255,240,210,0.55)');
  halo.addColorStop(1, 'rgba(255,240,210,0)');
  x.fillStyle = halo;
  x.fillRect(lx - 150, ly - 150, 300, 300);
  const disco = x.createRadialGradient(lx - 8, ly - 8, 4, lx, ly, 34);
  disco.addColorStop(0, '#fffaf0');
  disco.addColorStop(1, '#f1e2c2');
  x.fillStyle = disco;
  x.beginPath(); x.arc(lx, ly, 34, 0, 7); x.fill();
  x.fillStyle = 'rgba(190,170,140,0.35)';
  for (const [dx, dy, r] of [[-10, -6, 9], [8, 6, 7], [-4, 14, 5], [12, -12, 4]]) { x.beginPath(); x.arc(lx + dx, ly + dy, r, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cielo de día, amanecer o atarde: degradado + sol (o su resplandor) + nubes suaves.
function cieloGradiente(colores, [sx, sy], colorSol, radio, nubesBlancas = false) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  colores.forEach((col, i) => g.addColorStop(i / (colores.length - 1), col));
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  const h = x.createRadialGradient(sx, sy, 4, sx, sy, radio * 5);
  h.addColorStop(0, colorSol); h.addColorStop(0.2, colorSol + '88'); h.addColorStop(1, colorSol + '00');
  x.fillStyle = h; x.fillRect(0, 0, 1024, 512);
  x.fillStyle = colorSol; x.beginPath(); x.arc(sx, sy, radio * 0.45, 0, 7); x.fill();
  let s = 5;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) {
    const nx = azar() * 1024, ny = 40 + azar() * 260, w = 80 + azar() * 220;
    x.globalAlpha = nubesBlancas ? 0.5 : 0.28;
    x.fillStyle = nubesBlancas ? '#ffffff' : '#ffe6d0';
    for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(nx + k * w / 5, ny + Math.sin(k) * 6, w / 4, 12 + azar() * 10, 0, 0, 7); x.fill(); }
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- texturas pintadas
function lienzo(w, h, pintar) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  pintar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function ruido(x, w, h, cant, colores, tam = [1, 3]) {
  let s = 13;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < cant; i++) {
    x.fillStyle = colores[Math.floor(azar() * colores.length)];
    x.globalAlpha = 0.08 + azar() * 0.18;
    const r = tam[0] + azar() * (tam[1] - tam[0]);
    x.fillRect(azar() * w, azar() * h, r, r);
  }
  x.globalAlpha = 1;
}

// Piedra de Jerusalén: sillares claros con juntas (1 textura = 2 m × 2 m).
const texPiedra = () => lienzo(256, 256, (x, w, h) => {
  x.fillStyle = '#d9c7a4'; x.fillRect(0, 0, w, h);
  const filas = 6, alto = h / filas;
  let s = 3;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let f = 0; f < filas; f++) {
    let px = f % 2 ? -40 : 0;
    while (px < w) {
      const largo = 60 + azar() * 50;
      const tono = 200 + azar() * 30;
      x.fillStyle = `rgb(${tono + 15},${tono},${tono - 30})`;
      x.fillRect(px + 2, f * alto + 2, largo - 4, alto - 4);
      px += largo;
    }
  }
  ruido(x, w, h, 900, ['#8a7350', '#fff3dc', '#6e5a3c']);
});

// Roca tallada (túneles y cisternas): grietas y vetas.
const texRoca = () => lienzo(256, 256, (x, w, h) => {
  x.fillStyle = '#7a6a5a'; x.fillRect(0, 0, w, h);
  ruido(x, w, h, 700, ['#5a4a3e', '#9a8a72', '#4a3e34'], [6, 30]);
  x.strokeStyle = '#3a3028'; x.globalAlpha = 0.5;
  for (let i = 0; i < 14; i++) { x.beginPath(); const y = (i * 37) % h; x.moveTo(0, y); x.lineTo(w, y + ((i * 13) % 20) - 10); x.stroke(); }
  x.globalAlpha = 1;
  ruido(x, w, h, 900, ['#2e2620', '#b0a088'], [1, 2]);
});

// Mar: olas cortas y brillos, para que el agua no sea un azul liso (se desplaza despacio en moverCapas).
let texOlas = null;
const texMar = () => (texOlas = lienzo(256, 256, (x, w, h) => {
  x.fillStyle = '#3f86b4'; x.fillRect(0, 0, w, h);
  let s = 7;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {     // crestas: arcos cortos horizontales, claros y oscuros
    const cx = azar() * w, cy = azar() * h, l = 8 + azar() * 26;
    x.strokeStyle = azar() < 0.55 ? 'rgba(220,240,255,0.55)' : 'rgba(20,60,95,0.5)';
    x.lineWidth = 1 + azar() * 1.5;
    for (const dx of [0, -w, w]) for (const dy of [0, -h, h]) {
      x.beginPath(); x.moveTo(cx - l / 2 + dx, cy + dy); x.quadraticCurveTo(cx + dx, cy - 3 + dy, cx + l / 2 + dx, cy + dy); x.stroke();
    }
  }
}));

// Revoque de adobe (casas comunes): liso con manchas.
const texRevoque = () => lienzo(256, 256, (x, w, h) => {
  x.fillStyle = '#cbb08a'; x.fillRect(0, 0, w, h);
  ruido(x, w, h, 500, ['#a88a62', '#e6d2ae', '#8f7450'], [4, 22]);
  ruido(x, w, h, 900, ['#7a6244', '#f4e4c4'], [1, 2]);
});

// Madera de vigas, cajas y rejas.
const texMadera = () => lienzo(128, 128, (x, w, h) => {
  x.fillStyle = '#7a5532'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = i % 3 ? '#5e3f22' : '#946a42';
    x.globalAlpha = 0.5;
    x.beginPath(); const y = Math.random() * h; x.moveTo(0, y); x.bezierCurveTo(w / 3, y + 4, w * 2 / 3, y - 4, w, y); x.stroke();
  }
  x.globalAlpha = 1;
});

// Tela de toldo a rayas.
const texToldo = (a, b) => lienzo(64, 64, (x, w, h) => {
  for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? a : b; x.fillRect(i * 16, 0, 16, h); }
  ruido(x, w, h, 200, ['#000', '#fff'], [1, 2]);
});

// Texturas pintadas por Codex (arte/fondos/tex_*.webp, ver herramientas/preparar_texturas.py): reemplazan a las de
// lienzo en cuanto cargan; si faltan, queda la de lienzo.
const cargadorTex = new THREE.TextureLoader();
const texPintadas = {};
function pintada(m, archivo, color = 0xffffff) {
  texPintadas[archivo] ??= new Promise((listo) => cargadorTex.load(`arte/fondos/${archivo}.webp`, (tx) => {
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 4;
    listo(tx);
  }, undefined, () => listo(null)));
  texPintadas[archivo].then((tx) => { if (tx) { m.map = tx; m.color.set(color); m.needsUpdate = true; } });
  return m;
}
const lambert = (map, color, archivo, colorPintada) =>
  pintada(new THREE.MeshLambertMaterial({ map, color: color ?? 0xffffff }), archivo, colorPintada);

const cache = {};
export function material(nombre) {
  if (cache[nombre]) return cache[nombre];
  const m = {
    piedra: () => lambert(texPiedra(), null, 'tex_sillares'),
    revoque: () => lambert(texRevoque(), null, 'tex_revoque'),
    revoqueOscuro: () => lambert(texRevoque(), 0x9a8a78, 'tex_revoque', 0x9a8a78),
    madera: () => lambert(texMadera(), null, 'tex_madera'),
    toldoRojo: () => new THREE.MeshLambertMaterial({ map: texToldo('#9c3b2a', '#d9b98a'), side: THREE.DoubleSide }),
    toldoAzul: () => new THREE.MeshLambertMaterial({ map: texToldo('#2f4f7a', '#d9c8a0'), side: THREE.DoubleSide }),
    toldoVerde: () => new THREE.MeshLambertMaterial({ map: texToldo('#4f6b3a', '#dccca0'), side: THREE.DoubleSide }),
    hueco: () => new THREE.MeshBasicMaterial({ color: 0x07060a }),
    ventana: () => new THREE.MeshBasicMaterial({ color: ambiente.ventanas ? 0xffb35a : 0x2a2018 }),
    ventanaApagada: () => new THREE.MeshBasicMaterial({ color: 0x1a1420 }),
    suelo: () => lambert(texPiedra(), 0xb8a68a, 'tex_sillares', 0xd8ccb8),
    losas: () => lambert(texPiedra(), 0xb8a68a, 'tex_losas'),
    muelle: () => lambert(texPiedra(), null, 'tex_muelle'),
    // dentro de una casa, en penumbra (la casa de María): revoque y losas oscuros en vez de negro liso
    interior: () => lambert(texRevoque(), 0x4a3a2e, 'tex_revoque', 0x5a4636),
    pisoInterior: () => lambert(texPiedra(), 0x5a4a3a, 'tex_losas', 0x6a5848),
    fondoCerca: () => new THREE.MeshLambertMaterial({ color: ambiente.fondo[0] }),
    fondoMedio: () => new THREE.MeshBasicMaterial({ color: ambiente.fondo[1], fog: true }),
    fondoLejos: () => new THREE.MeshBasicMaterial({ color: ambiente.fondo[2], fog: false }),
    cerro: () => new THREE.MeshBasicMaterial({ color: ambiente.fondo[3], fog: false }),
    mar: () => { const m = texMar(); m.repeat.set(70, 40); return new THREE.MeshLambertMaterial({ map: m, color: 0xa8d0ec, emissive: 0x0a2438 }); },
    hierro: () => new THREE.MeshLambertMaterial({ color: 0x2b2a2e }),
    // en la cisterna, sillares grises como los de la pintura; afuera, roca de acantilado
    roca: () => ambiente === AMBIENTES.cueva ? lambert(texRoca(), null, 'tex_sillares', 0xa49c94) : lambert(texRoca(), null, 'tex_roca'),
    rocaOscura: () => lambert(texRoca(), 0x6a6070, 'tex_roca_cueva', 0x8a8090),
    maderaVieja: () => lambert(texMadera(), 0xa08a70, 'tex_madera_barco'),
    agua: () => new THREE.MeshLambertMaterial({ color: 0x2a5a7a, transparent: true, opacity: 0.78, emissive: 0x0a2030 }),
    cuerda: () => new THREE.MeshLambertMaterial({ color: 0xb89a6a }),
    tierra: () => lambert(texRevoque(), 0xb09070, 'tex_tierra'),
    hierba: () => new THREE.MeshLambertMaterial({ color: 0x6a8a4a }),
  }[nombre]();
  cache[nombre] = m;
  return m;
}

// ---------- geometría: cajas con UV a escala del mundo (la textura no se estira) que se juntan por material
const TEX_M = 2;   // metros que cubre una repetición de textura
const ARRIBA = { suelo: 'losas', piedra: 'losas', revoque: 'losas', muelle: 'losas' };   // material de la cara de arriba
export class Constructor {
  constructor() { this.partes = {}; }

  caja(x0, y0, z0, x1, y1, z1, mat) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv, n = g.attributes.normal, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
      const px = p.getX(i) + (x0 + x1) / 2, py = p.getY(i) + (y0 + y1) / 2, pz = p.getZ(i) + (z0 + z1) / 2;
      let u, v;
      if (nx > 0.5) { u = pz; v = py; } else if (ny > 0.5) { u = px; v = pz; } else { u = px; v = py; }
      uv.setXY(i, u / TEX_M, v / TEX_M);
    }
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    (this.partes[mat] ??= []).push(g);
    // cara de arriba con otra textura (losas en calles y azoteas; los costados siguen siendo muro)
    if (ARRIBA[mat] && w > 0.3 && d > 0.3) {
      const a = new THREE.PlaneGeometry(w, d);
      a.rotateX(-Math.PI / 2);
      a.translate((x0 + x1) / 2, y1 + 0.004, (z0 + z1) / 2);
      const pa = a.attributes.position, ua = a.attributes.uv;
      for (let i = 0; i < ua.count; i++) ua.setXY(i, pa.getX(i) / TEX_M, pa.getZ(i) / TEX_M);
      (this.partes[ARRIBA[mat]] ??= []).push(a);
    }
    return g;
  }

  // Juntar todo en una malla por material (pocas llamadas de dibujo: va bien en teléfonos).
  terminar(padre) {
    for (const [mat, geos] of Object.entries(this.partes)) {
      const m = new THREE.Mesh(mergeGeometries(geos), material(mat));
      m.matrixAutoUpdate = false;
      padre.add(m);
    }
    this.partes = {};
  }
}

// Casa de piedra o adobe: bloque, pretil en la azotea, ventanas y puerta opcionales.
// La cara de enfrente (z1) queda detrás del jugador si z1 < 0 (casas del fondo de la calle).
export function casa(b, { x0, x1, alto, z0 = -4, z1 = 1.2, mat = 'revoque', pretil = true, ventanas = [], puertas = [], base = 0 }) {
  b.caja(x0, base, z0, x1, alto, z1, mat);
  if (pretil) {
    const p = 0.35, g = 0.18;
    b.caja(x0, alto, z0, x1, alto + p, z0 + g, mat);
    b.caja(x0, alto, z0, x0 + g, alto + p, z1, mat);
    b.caja(x1 - g, alto, z0, x1, alto + p, z1, mat);
  }
  // borde de piedra que remata la azotea
  b.caja(x0 - 0.05, alto - 0.12, z1 - 0.02, x1 + 0.05, alto, z1 + 0.06, 'piedra');
  for (const v of ventanas) {
    const [vx, vy, ancho = 0.5, altoV = 0.7, encendida = true] = v;
    b.caja(vx - ancho / 2, vy, z1, vx + ancho / 2, vy + altoV, z1 + 0.02, encendida ? 'ventana' : 'ventanaApagada');
    b.caja(vx - ancho / 2 - 0.08, vy - 0.08, z1, vx + ancho / 2 + 0.08, vy, z1 + 0.08, 'madera');
  }
  for (const [px, ancho = 1.1, altoP = 2.0] of puertas) {
    b.caja(px - ancho / 2, base, z1 - 0.01, px + ancho / 2, base + altoP, z1 + 0.02, 'hueco');
    b.caja(px - ancho / 2 - 0.12, base + altoP, z1, px + ancho / 2 + 0.12, base + altoP + 0.18, z1 + 0.12, 'madera');
  }
}

// Fondo en capas: casas medianas con ventanas, la ciudad lejana con el templo y los cerros.
// tipo: 'ciudad' (Jerusalén: con templo si templo = true), 'campo', 'puerto' o 'cueva'.
export function fondo(padre, x0, x1, tipo = 'ciudad', { templo = true, pintado = false } = {}) {
  if (tipo === 'cueva') return fondoCueva(padre, x0, x1, pintado);
  if (tipo === 'campo') return pintado ? undefined : fondoCampo(padre, x0, x1);   // con pintura, el campo lo pone ella
  const b = new Constructor();
  let s = 11;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  if (tipo === 'puerto') {
    // el mar a lo lejos, barcos con vela cuadrada y la ciudad del otro lado de la bahía
    // llega hasta delante del camino: entre los muelles y el agua de juego no queda ningún hueco
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 400, 216), material('mar'));
    mar.rotation.x = -Math.PI / 2; mar.position.set((x0 + x1) / 2, -0.6, -100);
    padre.add(mar);
    for (let x = x0; x < x1 && !pintado; x += 30 + azar() * 30) {
      const z = -30 - azar() * 50;
      b.caja(x, -0.6, z - 1.5, x + 7, 0.8, z, 'fondoCerca');
      b.caja(x + 3.3, 0.8, z - 0.9, x + 3.6, 9, z - 0.6, 'fondoCerca');
      b.caja(x + 1.2, 3.5, z - 0.8, x + 5.8, 8, z - 0.7, 'fondoMedio');
    }
    for (let x = x0 - 40; x < x1 + 40 && !pintado;) {
      const ancho = 6 + azar() * 10, alto = 3 + azar() * 6;
      b.caja(x, -1, -150, x + ancho, alto, -140, 'fondoLejos');
      x += ancho + azar() * 3;
    }
    if (!pintado) cerros(padre, x0, x1, azar);
    b.terminar(padre);
    return;
  }
  // capa 1: casas detrás de la calle (z -9 a -14), con ventanas cálidas (con pintura, lo hace la capa pintada)
  for (let x = x0; x < x1 && !pintado;) {
    const ancho = 4 + azar() * 5, alto = 5 + azar() * 4.5, z = -9 - azar() * 4;
    b.caja(x, -1, z - 5, x + ancho, alto, z, azar() < 0.5 ? 'revoqueOscuro' : 'fondoCerca');
    if (azar() < 0.7) {
      const vx = x + 0.8 + azar() * (ancho - 1.6), vy = 1.5 + azar() * (alto - 2.5);
      b.caja(vx, vy, z, vx + 0.45, vy + 0.6, z + 0.02, azar() < 0.75 ? 'ventana' : 'ventanaApagada');
    }
    if (azar() < 0.25) b.caja(x + ancho * 0.3, alto, z - 3, x + ancho * 0.3 + 1.4, alto + 1.2, z - 1.8, 'fondoCerca');
    x += ancho + azar() * 1.5;
  }
  if (pintado) { b.terminar(padre); return; }   // lo lejano lo ponen las capas pintadas
  // capa 2: ciudad media (siluetas con algunas luces)
  for (let x = x0 - 20; x < x1 + 20;) {
    const ancho = 5 + azar() * 8, alto = 6 + azar() * 10, z = -30 - azar() * 10;
    b.caja(x, -2, z - 6, x + ancho, alto, z, 'fondoMedio');
    if (azar() < 0.5) {
      const vx = x + 1 + azar() * (ancho - 2), vy = 2 + azar() * (alto - 4);
      b.caja(vx, vy, z, vx + 0.6, vy + 0.7, z + 0.05, 'ventana');
    }
    x += ancho + azar() * 2;
  }
  // capa 3: el monte del templo, murallas y cerros (muy lejos, sin niebla para que se recorten contra el cielo)
  const zT = -110;
  if (!templo) { cerros(padre, x0, x1, azar); b.terminar(padre); return; }
  b.caja(x0 + 40, -5, zT - 30, x0 + 150, 18, zT, 'fondoLejos');           // explanada del templo
  b.caja(x0 + 78, 18, zT - 22, x0 + 112, 34, zT - 8, 'fondoLejos');         // santuario
  b.caja(x0 + 70, 18, zT - 20, x0 + 120, 24, zT - 6, 'fondoLejos');
  b.caja(x0 + 150, -5, zT - 30, x0 + 168, 28, zT - 4, 'fondoLejos');       // torre Antonia
  for (let x = x0 - 60; x < x1 + 60; x += 14) b.caja(x, -5, zT + 8, x + 12, 9 + (x % 3), zT + 10, 'fondoLejos');  // muralla
  cerros(padre, x0, x1, azar);
  b.terminar(padre);
}

function cerros(padre, x0, x1, azar, z = -170, alto = 1) {
  for (let i = 0; i < 9; i++) {
    const cx = x0 - 80 + i * ((x1 - x0 + 160) / 8), r = 30 + azar() * 25;
    const cerro = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), material('cerro'));
    cerro.scale.set(2.2, (0.5 + azar() * 0.4) * alto, 1);
    cerro.position.set(cx, -6, z - azar() * 20);
    padre.add(cerro);
  }
}

// Campo: colinas en capas, terrazas, olivos en silueta y una aldea lejana.
function fondoCampo(padre, x0, x1) {
  const b = new Constructor();
  let s = 23;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (const [z, mat, esc] of [[-40, 'fondoCerca', 0.35], [-80, 'fondoMedio', 0.55], [-130, 'fondoLejos', 0.8]]) {
    for (let x = x0 - 60; x < x1 + 60; x += 25 + azar() * 20) {
      const r = 18 + azar() * 20;
      const loma = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), material(mat));
      loma.scale.set(1.8, esc, 0.6);
      loma.position.set(x, -4, z);
      padre.add(loma);
    }
  }
  // olivos (copa redonda) y una aldea en la ladera media
  const copa = new THREE.SphereGeometry(1.4, 8, 6);
  for (let x = x0 - 20; x < x1 + 20; x += 6 + azar() * 10) {
    const z = -14 - azar() * 14;
    b.caja(x - 0.15, -1, z - 0.15, x + 0.15, 1.6, z + 0.15, 'fondoCerca');
    const m = new THREE.Mesh(copa, material('hierba'));
    m.position.set(x, 2.4, z); m.scale.set(1.3, 0.9, 1);
    padre.add(m);
  }
  for (let x = x0 + 30; x < x1; x += 90 + azar() * 60) {
    for (let k = 0; k < 6; k++) { const hx = x + k * 3.2 + azar(); b.caja(hx, 4 + azar() * 3, -64, hx + 2.6, 7 + azar() * 3, -60, 'fondoMedio'); }
  }
  cerros(padre, x0, x1, azar, -180, 1.3);
  b.terminar(padre);
}

// Subterráneo: pared de roca al fondo, arcos tallados y estalactitas; el techo lo pone cada nivel.
function fondoCueva(padre, x0, x1, pintado) {
  const b = new Constructor();
  let s = 31;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  if (!pintado) b.caja(x0 - 20, -10, -9, x1 + 20, 14, -4, 'rocaOscura');
  for (let x = x0; x < x1; x += 7 + azar() * 6) {
    const ancho = 3 + azar() * 2, alto = 3 + azar() * 2.5;
    b.caja(x, -2, -4.1, x + 0.8, alto + 1, -3.4, 'roca');                 // pilar
    b.caja(x + ancho, -2, -4.1, x + ancho + 0.8, alto + 1, -3.4, 'roca');
    b.caja(x, alto + 0.4, -4.1, x + ancho + 0.8, alto + 1.2, -3.4, 'roca');  // dintel del arco
    b.caja(x + 0.8, -2, -4.05, x + ancho, alto + 0.4, -4.0, 'hueco');       // oscuridad tras el arco
  }
  b.terminar(padre);
}

// Luz de farol (pocas: en teléfonos cada luz cuesta). Devuelve la luz para animar su parpadeo.
export function luzCalida(padre, x, y, z, intensidad = 6, alcance = 9) {
  const l = new THREE.PointLight(0xffa24a, intensidad, alcance, 1.6);
  l.position.set(x, y, z);
  padre.add(l);
  const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color: 0xffb060, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  brillo.scale.set(1.4, 1.4, 1);
  brillo.position.set(x, y, z + 0.05);
  padre.add(brillo);
  l.userData.base = intensidad;
  return l;
}

let texHalo;
export function halo() {
  texHalo ??= lienzo(64, 64, (x) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,220,160,0.5)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  });
  return texHalo;
}

// ---------- capas pintadas (Codex) con parallax: arte/fondos/fondo_<lugar>.webp (lejos) y capa_<lugar>.webp (medio)
// Cada capa es un plano que acompaña a la cámara; la textura se corre más despacio que el mundo (parallax) y se
// repite a los lados (las pinturas empalman).
const capas = [];
export function capasPintadas(lugar, { cueva = false } = {}) {
  const cargador = new THREE.TextureLoader();
  const definir = (archivo, z, alto, factor, yCentro, transparente) => {
    const ancho = alto * 7;   // mucho más ancho que lo que ve la cámara (en pantallas anchas se veía el borde)
    const mat = new THREE.MeshBasicMaterial({ transparent: transparente, depthWrite: false, fog: false, color: 0xffffff });
    mat.visible = false;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);
    m.renderOrder = -10;
    m.position.set(0, yCentro, z);
    escena.add(m);
    cargador.load(archivo, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      const proporcion = tex.image.width / tex.image.height;
      tex.repeat.set(ancho / (alto * proporcion), 1);
      mat.map = tex; mat.visible = true; mat.needsUpdate = true;
      if (transparente) capa.colorPie = colorDelPie(tex.image);
    }, undefined, () => { /* sin pintura: queda el fondo 3D */ });
    const capa = { m, factor, ancho, yCentro };
    capas.push(capa);
    if (!transparente || cueva) return;
    // neblina en el borde de abajo de la capa: la pintura se funde con la calle en vez de cortarse en una línea
    const fundido = 7, debajo = 30;
    const g = document.createElement('canvas');
    g.width = 4; g.height = 64;
    const x = g.getContext('2d');
    const grad = x.createLinearGradient(0, 0, 0, 64);
    const corte = fundido / (fundido + debajo);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(corte * 0.55, 'rgba(255,255,255,0.55)');
    grad.addColorStop(corte, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    x.fillStyle = grad; x.fillRect(0, 0, 4, 64);
    const alto2 = fundido + debajo, base = yCentro - alto / 2;
    const niebla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(g), transparent: true, depthWrite: false, fog: false }));
    niebla.renderOrder = -9;
    const yN = base + fundido * 0.75 - alto2 / 2;   // un cuarto del fundido queda bajo el borde de la pintura
    niebla.position.set(0, yN, z + 0.5);
    escena.add(niebla);
    capas.push({ m: niebla, factor, ancho, yCentro: yN, niebla: true, de: capa });
  };
  if (cueva) {
    // en la cueva solo el fondo: la capa media, encima, se cortaba en una línea a la mitad de los arcos
    definir(`arte/fondos/fondo_${lugar}.webp`, -40, 34, 0.35, 4, false);
  } else {
    definir(`arte/fondos/fondo_${lugar}.webp`, -220, 150, 0.04, 34, false);
    definir(`arte/fondos/capa_${lugar}.webp`, -60, 42, 0.2, 6, true);   // baja hasta y -15: desde los tejados no se ve debajo
  }
}

// Color promedio de la franja de abajo de una pintura con transparencia (solo lo pintado, no lo transparente).
function colorDelPie(img) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, 64, 32);
  const d = x.getImageData(0, 26, 64, 6).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  if (!n) return null;
  return new THREE.Color(`rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`).multiplyScalar(0.8);
}

export function moverCapas() {
  if (texOlas) { const k = performance.now() / 1000; texOlas.offset.set(k * 0.012, Math.sin(k * 0.5) * 0.004); }
  for (const c of capas) {
    c.m.position.x = camara.position.x;
    c.m.position.y = c.yCentro + camara.position.y * (c.factor * 0.6);
    if (c.niebla) {
      // del color del pie de la pintura (con la niebla del ambiente, desde los techos se veía una franja lisa)
      if (c.de.colorPie) c.m.material.color.copy(c.de.colorPie);
      else if (escena.fog) c.m.material.color.copy(escena.fog.color);
      continue;
    }
    const tex = c.m.material.map;
    if (tex) tex.offset.x = (camara.position.x * (1 - c.factor)) / c.ancho * tex.repeat.x * 0.5;
  }
}

// Objetos pintados sueltos (palmeras, olivos, puestos…) como planos detrás de las casas: [nombre, x, y, z, alto].
// Los que van en el suelo (y = 0) se apoyan donde empieza el dibujo (cada pintura trae su margen transparente abajo;
// el carro de bueyes, casi un 20 %) y llevan una sombra suave debajo, para que no parezcan flotar.
let texSombra = null;
function sombraSuave() {
  if (texSombra) return texSombra;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 128;
  const g = lienzo.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,0.55)'); r.addColorStop(0.6, 'rgba(0,0,0,0.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return (texSombra = new THREE.CanvasTexture(lienzo));
}
// Margen transparente abajo y ancho que ocupa el dibujo (fracciones de la imagen).
function medirDibujo(img) {
  const n = 128, lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = n;
  const g = lienzo.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, n, n);
  const a = g.getImageData(0, 0, n, n).data;
  let abajo = 0, x0 = n, x1 = 0;
  for (let y = n - 1; y >= 0 && !abajo; y--) for (let x = 0; x < n; x++) if (a[(y * n + x) * 4 + 3] > 90) { abajo = (n - 1 - y) / n; break; }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (a[(y * n + x) * 4 + 3] > 90) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return { abajo, ancho: Math.max(0.2, (x1 - x0) / n) };
}
export function objetosPintados(padre, lista) {
  const cargador = new THREE.TextureLoader();
  const cache = {};
  for (const [nombre, x, y, z, alto] of lista) {
    const c = cache[nombre] ??= { mat: new THREE.MeshLambertMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide }), mallas: [] };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(alto, alto), c.mat);
    m.position.set(x, y + alto / 2 - alto * 0.02, z);
    padre.add(m);
    let sombra = null;
    if (y === 0) {
      sombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: sombraSuave(), transparent: true, depthWrite: false }));
      sombra.rotation.x = -Math.PI / 2;
      sombra.position.set(x, 0.02, z + 0.05);
      sombra.scale.set(alto * 0.8, alto * 0.22, 1);
      sombra.visible = false;
      padre.add(sombra);
    }
    c.mallas.push({ m, sombra, y, alto });
    if (c.mallas.length > 1) continue;
    c.mat.visible = false;
    cargador.load(`arte/fondos/obj_${nombre}.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; c.mat.map = tex; c.mat.visible = true; c.mat.needsUpdate = true;
      let medida = { abajo: 0.02, ancho: 0.8 };
      try { medida = medirDibujo(tex.image); } catch { /* sin lienzo: queda como estaba */ }
      for (const o of c.mallas) {
        if (o.y !== 0) continue;
        o.m.position.y = o.alto / 2 - o.alto * medida.abajo + 0.03;
        o.sombra.scale.x = o.alto * medida.ancho * 0.95;
        o.sombra.visible = true;
      }
    });
  }
}
