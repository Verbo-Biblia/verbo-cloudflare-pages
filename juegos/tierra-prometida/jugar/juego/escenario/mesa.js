import * as THREE from '../../lib/three/three.module.min.js';
import { caja, azar } from './texturas.js';
import { MESA, MURALLA, zonas } from './disposicion.js';

// La mesa: tapete de cuero repujado con las zonas cosidas en hilo dorado, sobre una mesa de madera con marco
// biselado. Todo se pinta en canvas al abrir la mesa (sin imágenes externas).
// Tapete de la temática (fondos.mesa): se pinta sobre la plantilla (plantillas/mesa-plantilla.png, como un atlas UV)
// y se dibuja a 2048 px; encima van siempre los rótulos. Las costuras doradas se pueden quitar con
// fondos.mesaCosturas = false, si el tapete pintado ya trae sus propios marcos.

const ANCHO_MESA = MESA.ancho, FONDO_MESA = MESA.fondo;
const PX_ANCHO = 1024, PX_FONDO = Math.round(1024 * FONDO_MESA / ANCHO_MESA); // 838: el tapete no se deforma

// Pasa de coordenadas de la mesa (x, z) a píxeles del tapete.
const aPx = (x, z) => [((x + ANCHO_MESA / 2) / ANCHO_MESA) * PX_ANCHO, ((z + FONDO_MESA / 2) / FONDO_MESA) * PX_FONDO];
const escalaPx = PX_ANCHO / ANCHO_MESA;

function lienzoTapete(k = 1) {
  const c = document.createElement('canvas');
  c.width = PX_ANCHO * k; c.height = PX_FONDO * k;
  return c;
}

// Cuero: base cálida con manchas de curtido, poro fino y arrugas suaves.
function pintarCuero(ctx, imagenFondo) {
  if (imagenFondo) { ctx.drawImage(imagenFondo, 0, 0, PX_ANCHO, PX_FONDO); return; }
  ctx.fillStyle = '#4b2e1d';
  ctx.fillRect(0, 0, PX_ANCHO, PX_FONDO);
  for (let i = 0; i < 260; i++) {
    const x = azar() * PX_ANCHO, y = azar() * PX_FONDO, r = 20 + azar() * 90;
    const mancha = ctx.createRadialGradient(x, y, 0, x, y, r);
    const claro = azar() > 0.5;
    mancha.addColorStop(0, claro ? 'rgba(140,92,58,0.10)' : 'rgba(25,12,6,0.12)');
    mancha.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mancha;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 26000; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,220,170,0.035)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(azar() * PX_ANCHO, azar() * PX_FONDO, 1 + azar() * 1.5, 1);
  }
}

// Recorre el contorno de un rectángulo redondeado con puntadas (para el color y para el relieve).
function puntadas(ctx, x, y, w, h, r, color, grosor, largo = 5, hueco = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = grosor;
  ctx.lineCap = 'round';
  ctx.setLineDash([largo, hueco]);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

// Esquinero de filigrana: hojas y volutas en las cuatro esquinas de cada zona.
function esquinero(ctx, cx, cy, giro, color, tam = 14) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(giro);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, tam);
  ctx.quadraticCurveTo(0, 0, tam, 0);
  ctx.stroke();
  for (const [a, b] of [[tam * 0.55, tam * 0.15], [tam * 0.15, tam * 0.55]]) {
    ctx.beginPath();
    ctx.arc(a, b, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(3, 3);
  ctx.quadraticCurveTo(tam * 0.5, tam * 0.1, tam * 0.35, tam * 0.45);
  ctx.quadraticCurveTo(tam * 0.1, tam * 0.5, 3, 3);
  ctx.fill();
  ctx.restore();
}

// Medallón central entre los dos frentes: rosa de los vientos con nudos (genérico, sin símbolos de ninguna fe).
function medallon(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  for (const k of [1, 0.82]) { ctx.beginPath(); ctx.arc(0, 0, r * k, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, largo = i % 2 ? r * 0.55 : r * 0.78;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -largo); ctx.lineTo(r * 0.09, 0); ctx.lineTo(0, r * 0.12); ctx.lineTo(-r * 0.09, 0); ctx.closePath();
    i % 2 ? ctx.stroke() : ctx.fill();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// Dibuja costuras, esquineros, rótulos y medallón. modo 'color' para el mapa de color, 'relieve' para el bump:
// en el relieve, lo cosido sobresale (claro) y los paneles de las zonas quedan hundidos (oscuro).
function pintarDibujos(ctx, terminos, Z, modo, costuras = true) {
  const relieve = modo === 'relieve';
  const oro = relieve ? '#ffffff' : 'rgba(201,163,98,0.85)';
  const oroSuave = relieve ? '#d0d0d0' : 'rgba(190,152,92,0.55)';
  const zona = (x0, z0, x1, z1, rotulo, tinte) => {
    const [a, b] = aPx(x0, z0), [c, d] = aPx(x1, z1);
    const w = c - a, h = d - b;
    if (!costuras) {
      // Tapete pintado por la temática: solo el rótulo, con una sombra suave para que se lea sobre cualquier fondo.
      if (rotulo && !relieve) {
        ctx.font = `bold 17px Georgia, 'Palatino Linotype', serif`;
        ctx.textBaseline = 'top';
        const texto = rotulo.toUpperCase().split('').join(String.fromCharCode(8202));
        ctx.fillStyle = 'rgba(10,4,2,0.8)'; ctx.fillText(texto, a + 24, b + 12);
        ctx.fillStyle = 'rgba(234,204,140,0.95)'; ctx.fillText(texto, a + 24, b + 13.5);
      }
      return;
    }
    // Panel hundido con un tinte leve por función de la zona.
    ctx.fillStyle = relieve ? '#5a5a5a' : tinte;
    ctx.beginPath(); ctx.roundRect(a, b, w, h, 10); ctx.fill();
    if (!relieve) {
      // Sombra interior: el borde superior del hundido se oscurece, el inferior recibe luz.
      const sombra = ctx.createLinearGradient(0, b, 0, b + h);
      sombra.addColorStop(0, 'rgba(0,0,0,0.30)');
      sombra.addColorStop(0.12, 'rgba(0,0,0,0)');
      sombra.addColorStop(0.92, 'rgba(0,0,0,0)');
      sombra.addColorStop(1, 'rgba(255,220,160,0.10)');
      ctx.fillStyle = sombra;
      ctx.beginPath(); ctx.roundRect(a, b, w, h, 10); ctx.fill();
    }
    // Doble costura: una exterior más marcada y una interior fina.
    puntadas(ctx, a + 3, b + 3, w - 6, h - 6, 9, oro, relieve ? 2.2 : 1.5, 5, 4);
    puntadas(ctx, a + 9, b + 9, w - 18, h - 18, 6, oroSuave, 1.1, 3, 3);
    esquinero(ctx, a + 7, b + 7, 0, oro);
    esquinero(ctx, c - 7, b + 7, Math.PI / 2, oro);
    esquinero(ctx, c - 7, d - 7, Math.PI, oro);
    esquinero(ctx, a + 7, d - 7, -Math.PI / 2, oro);
    if (rotulo) {
      // Rótulo repujado en dorado viejo, con sombra de hundido arriba.
      ctx.font = `bold 17px Georgia, 'Palatino Linotype', serif`;
      ctx.textBaseline = 'top';
      const texto = rotulo.toUpperCase().split('').join(String.fromCharCode(8202));
      if (relieve) { ctx.fillStyle = '#ffffff'; ctx.fillText(texto, a + 24, b + 13); }
      else {
        ctx.fillStyle = 'rgba(10,4,2,0.75)';
        ctx.fillText(texto, a + 24, b + 12);
        ctx.fillStyle = 'rgba(214,178,112,0.92)';
        ctx.fillText(texto, a + 24, b + 13.5);
      }
    }
  };
  for (const j of [0, 1]) {
    const mz = Z.muralla[j];
    for (const z of zonas(j)) zona(z.x0, z.z0, z.x1, z.z1, terminos[z.clave], z.tinte);
    if (!costuras) continue;
    // Carril de la muralla: franja de piedra dibujada bajo los tramos.
    const [a, b] = aPx(MURALLA.carril[0], mz - 0.42), [c, d] = aPx(MURALLA.carril[1], mz + 0.42);
    ctx.fillStyle = relieve ? '#4a4a4a' : 'rgba(20,12,8,0.45)';
    ctx.beginPath(); ctx.roundRect(a, b, c - a, d - b, 6); ctx.fill();
    puntadas(ctx, a + 2, b + 2, c - a - 4, d - b - 4, 5, oroSuave, 1.2, 3, 3);
  }
  if (!costuras) return;
  // Medallón al centro y cenefa de todo el tapete.
  const [mx, my] = aPx(0, (Z.frente[0] + Z.frente[1]) / 2);
  medallon(ctx, mx, my, 34, relieve ? '#ffffff' : 'rgba(217,181,106,0.55)');
  puntadas(ctx, 14, 14, PX_ANCHO - 28, PX_FONDO - 28, 16, oro, 3, 8, 5);
  puntadas(ctx, 24, 24, PX_ANCHO - 48, PX_FONDO - 48, 12, oroSuave, 1.3, 4, 4);
  for (const [x, y, g] of [[30, 30, 0], [PX_ANCHO - 30, 30, Math.PI / 2], [PX_ANCHO - 30, PX_FONDO - 30, Math.PI], [30, PX_FONDO - 30, -Math.PI / 2]])
    esquinero(ctx, x, y, g, oro, 26);
}

// Viñeta y foco cálido pintados en el color (luz horneada, sin sombras de tiempo real).
function pintarLuz(ctx) {
  const foco = ctx.createRadialGradient(PX_ANCHO * 0.5, PX_FONDO * 0.5, 40, PX_ANCHO * 0.5, PX_FONDO * 0.5, PX_ANCHO * 0.62);
  foco.addColorStop(0, 'rgba(255,200,130,0.16)');
  foco.addColorStop(0.55, 'rgba(0,0,0,0)');
  foco.addColorStop(1, 'rgba(8,4,2,0.62)');
  ctx.fillStyle = foco;
  ctx.fillRect(0, 0, PX_ANCHO, PX_FONDO);
}

function texturaTapete(terminos, Z, imagenFondo, renderer, costuras = true) {
  // Con tapete propio se trabaja a 2048 px para no perder el detalle de la pintura.
  const k = imagenFondo ? 2 : 1;
  const color = lienzoTapete(k);
  const ctx = color.getContext('2d');
  if (imagenFondo) ctx.drawImage(imagenFondo, 0, 0, color.width, color.height);
  ctx.scale(k, k);
  if (!imagenFondo) pintarCuero(ctx, null);
  pintarDibujos(ctx, terminos, Z, 'color', costuras);
  pintarLuz(ctx);
  const mapa = new THREE.CanvasTexture(color);
  mapa.colorSpace = THREE.SRGBColorSpace;
  mapa.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const alto = lienzoTapete();
  const h = alto.getContext('2d');
  h.fillStyle = '#808080';
  h.fillRect(0, 0, PX_ANCHO, PX_FONDO);
  // Poro y arrugas del cuero en el relieve.
  for (let i = 0; i < 18000; i++) {
    h.fillStyle = azar() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
    h.fillRect(azar() * PX_ANCHO, azar() * PX_FONDO, 1 + azar() * 2, 1 + azar());
  }
  for (let i = 0; i < 70; i++) {
    h.strokeStyle = 'rgba(0,0,0,0.10)';
    h.lineWidth = 1 + azar() * 2;
    h.beginPath();
    let x = azar() * PX_ANCHO, y = azar() * PX_FONDO;
    h.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += (azar() - 0.5) * 60; y += (azar() - 0.5) * 30; h.lineTo(x, y); }
    h.stroke();
  }
  pintarDibujos(h, terminos, Z, 'relieve', costuras);
  const relieve = new THREE.CanvasTexture(alto);
  relieve.colorSpace = THREE.NoColorSpace;
  return { mapa, relieve };
}

// Madera de la mesa: veta larga con nudos, en una sola textura que se repite a lo largo del marco.
function texturaMadera() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#6a3b1f'); base.addColorStop(0.5, '#7d4826'); base.addColorStop(1, '#5e341b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 120; i++) {
    const y0 = azar() * 256, amp = 2 + azar() * 6, frec = 120 + azar() * 260;
    ctx.strokeStyle = i % 4 ? 'rgba(40,18,8,0.28)' : 'rgba(230,170,110,0.18)';
    ctx.lineWidth = 0.6 + azar() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= 1024; x += 8) ctx.lineTo(x, y0 + Math.sin(x / frec + i) * amp + Math.sin(x / 31 + i * 3) * 0.8);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const x = azar() * 1024, y = azar() * 256;
    for (let k = 7; k > 0; k--) {
      ctx.strokeStyle = `rgba(35,15,6,${0.08 + k * 0.03})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y, k * 5, k * 2.2, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Marco biselado alrededor del tapete: un anillo extruido con bordes redondeados.
function marco(material) {
  const ext = new THREE.Shape();
  const W = ANCHO_MESA / 2 + 0.75, D = FONDO_MESA / 2 + 0.75;
  ext.moveTo(-W, -D); ext.lineTo(W, -D); ext.lineTo(W, D); ext.lineTo(-W, D); ext.closePath();
  const hueco = new THREE.Path();
  const w = ANCHO_MESA / 2, d = FONDO_MESA / 2;
  hueco.moveTo(-w, -d); hueco.lineTo(-w, d); hueco.lineTo(w, d); hueco.lineTo(w, -d); hueco.closePath();
  ext.holes.push(hueco);
  const geo = new THREE.ExtrudeGeometry(ext, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.1, bevelSegments: 4, steps: 1 });
  geo.rotateX(-Math.PI / 2);
  // Coordenadas de textura en planta para que la veta corra a lo largo del marco.
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const lateral = Math.abs(x) > w - 0.01 && Math.abs(z) < d + 0.01;
    // En los largueros laterales la veta corre a lo largo de z; en los frontales, a lo largo de x.
    if (lateral) uv.setXY(i, z / 6, x / 1.5 + y);
    else uv.setXY(i, x / 6, z / 1.5 + y);
  }
  const m = new THREE.Mesh(geo, material);
  m.position.y = -0.04;
  return m;
}

export function crearMesa(tablero, materiales, Z) {
  const grupo = new THREE.Group();
  tablero.escena.add(grupo);

  // Tablero de la mesa debajo de todo, más ancho que el marco.
  const madera = texturaMadera();
  const matMadera = new THREE.MeshStandardMaterial({ map: madera, roughness: 0.7, metalness: 0.02 });
  const cuerpo = caja(grupo, matMadera, 0, -0.36, 0, ANCHO_MESA + 3.2, 0.6, FONDO_MESA + 3.2);
  cuerpo.userData.compartida = true;
  grupo.add(marco(matMadera));

  // Moldura dorada fina entre el marco y el tapete.
  const oro = new THREE.MeshStandardMaterial({ color: '#c49a55', metalness: 0.75, roughness: 0.35 });
  for (const z of [-FONDO_MESA / 2, FONDO_MESA / 2]) caja(grupo, oro, 0, 0.02, z, ANCHO_MESA, 0.035, 0.05);
  for (const x of [-ANCHO_MESA / 2, ANCHO_MESA / 2]) caja(grupo, oro, x, 0.02, 0, 0.05, 0.035, FONDO_MESA);
  // Clavos de latón a lo largo del marco.
  const clavo = new THREE.SphereGeometry(0.045, 8, 5);
  const posiciones = [];
  for (let x = -ANCHO_MESA / 2; x <= ANCHO_MESA / 2 + 0.01; x += 0.9) posiciones.push([x, -FONDO_MESA / 2 - 0.42], [x, FONDO_MESA / 2 + 0.42]);
  for (let z = -FONDO_MESA / 2 + 0.9; z < FONDO_MESA / 2; z += 0.9) posiciones.push([-ANCHO_MESA / 2 - 0.42, z], [ANCHO_MESA / 2 + 0.42, z]);
  const clavos = new THREE.InstancedMesh(clavo, oro, posiciones.length);
  const molde = new THREE.Object3D();
  posiciones.forEach(([x, z], i) => { molde.position.set(x, 0.205, z); molde.updateMatrix(); clavos.setMatrixAt(i, molde.matrix); });
  grupo.add(clavos);

  // Tapete.
  const { mapa, relieve } = texturaTapete(tablero.tema.terminos, Z, null, tablero.renderer);
  const material = new THREE.MeshStandardMaterial({ map: mapa, bumpMap: relieve, bumpScale: 1.6, roughness: 0.78, metalness: 0 });
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_MESA, FONDO_MESA), material);
  tapete.rotation.x = -Math.PI / 2;
  grupo.add(tapete);
  if (tablero.tema.fondos.mesa) {
    new THREE.TextureLoader().load(tablero.tema.fondos.mesa, t => {
      const nuevo = texturaTapete(tablero.tema.terminos, Z, t.image, tablero.renderer, tablero.tema.datos.fondos?.mesaCosturas !== false);
      material.map.dispose(); material.bumpMap.dispose();
      material.map = nuevo.mapa; material.bumpMap = nuevo.relieve;
      material.needsUpdate = true;
      t.dispose();
    });
  }

  // Luz cálida: foco suave sobre el centro y cuatro velas en las esquinas de la mesa (sin sombras duras).
  const foco = new THREE.SpotLight('#ffd9a8', 40, 40, 0.75, 0.85, 1.6);
  foco.position.set(0, 16, 3);
  foco.target.position.set(0, 0, 0);
  grupo.add(foco, foco.target);
  for (const x of [-12.3, 12.3])
    for (const z of [-10.2, 10.2]) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.12, 12), oro);
      base.position.set(x, 0.06, z);
      const vela = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.55, 10), new THREE.MeshStandardMaterial({ color: '#eadcbc', roughness: 0.9 }));
      vela.position.set(x, 0.39, z);
      const llama = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffe0a0' }));
      llama.position.set(x, 0.74, z);
      llama.scale.y = 1.8;
      const luz = new THREE.PointLight('#ffb35a', 2.2, 7, 2);
      luz.position.set(x, 1.1, z);
      grupo.add(base, vela, llama, luz);
    }
  tablero.escena.fog = new THREE.FogExp2('#140d0a', 0.012);
}
