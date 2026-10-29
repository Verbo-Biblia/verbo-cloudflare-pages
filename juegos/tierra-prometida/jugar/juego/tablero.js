// La mesa en 3D (three.js). Solo dibuja y anima: el estado viene del motor de reglas.
// El jugador humano siempre es el 0 (abajo, cerca de la cámara); la máquina es el 1 (arriba).

import * as THREE from '../lib/three/three.module.min.js';
import { CARTAS, LIMITES, COLOR_TIPO } from '../nucleo/cartas.js';
import { ataqueDe } from '../nucleo/reglas.js';
import { dibujarCarta, dibujarDorso } from './carta-dibujo.js';

import { materiales } from './escenario/texturas.js';
import { crearMesa } from './escenario/mesa.js';
import { crearMurallas, actualizarMurallas } from './escenario/muralla.js';
import { crearFortalezas, animarTorres } from './escenario/torres.js';
import { ParticulasEscenario } from './escenario/particulas.js';
import { Edificios } from './escenario/edificios.js';

import { CARTA, Z, FORTALEZA, MAZO, CASILLERO } from './escenario/disposicion.js';

// Todas las medidas salen de escenario/disposicion.js (la misma fuente que el tapete y su plantilla).
const W = CARTA.ancho, H = CARTA.alto;
const X_FORTALEZA = -FORTALEZA.x, Z_FORTALEZA = FORTALEZA.z;
const X_MAZO = MAZO.x;

const suave = (actual, meta, dt, k = 10) => actual + (meta - actual) * (1 - Math.exp(-dt * k));

function texturaTexto(texto, { tam = 64, color = '#fff', borde = '#000', ancho = 256, alto = 128 } = {}) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  const ctx = c.getContext('2d');
  ctx.font = `bold ${tam}px Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = tam / 6; ctx.strokeStyle = borde; ctx.strokeText(texto, ancho / 2, alto / 2);
  ctx.fillStyle = color; ctx.fillText(texto, ancho / 2, alto / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export class Tablero {
  constructor(contenedor, tema) {
    this.tema = tema;
    this.contenedor = contenedor;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // En el teléfono, resolución 1,5× como máximo: se ve igual de nítido y la mesa 3D gasta menos batería.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(this.renderer.domElement);

    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color('#120d0a');
    this.camara = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.escena.add(new THREE.HemisphereLight('#fff4dd', '#3a2a1c', 1.6));
    const sol = new THREE.DirectionalLight('#ffe7c0', 1.8);
    sol.position.set(-6, 14, 8);
    this.escena.add(sol);

    this.cartas = new Map();   // uid -> grupo
    this.efimeros = [];        // números flotantes, partículas
    this.reloj = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.puntero = new THREE.Vector2(-9, -9);
    this.hoverUid = null;
    this.resaltes = { jugables: new Set(), objetivos: [], seleccion: null, listos: new Set(), declarados: new Set() };
    this.flechas = [];
    this.pendientes = new Set();
    this.sombraTex = texturaSombra();
    this.dorsoTex = new THREE.CanvasTexture(dibujarDorso(document.createElement('canvas'), tema.datos.titulo));
    this.dorsoTex.colorSpace = THREE.SRGBColorSpace;
    this.geoCarta = new THREE.PlaneGeometry(W, H);
    // Partículas de Kenney (CC0), blancas con transparencia: se tiñen del color de cada efecto.
    const cargador = new THREE.TextureLoader();
    this.fx = {};
    for (const n of ['circle_05', 'star_06', 'magic_02', 'light_03', 'spark_01']) {
      this.fx[n] = cargador.load(new URL(`./fx/${n}.png`, import.meta.url).href);
      this.fx[n].colorSpace = THREE.SRGBColorSpace;
    }
    this.tiempo = 0;

    this.materialesEscenario = materiales();
    this.polvo = new ParticulasEscenario(this, this.materialesEscenario);
    this.crearMesa();
    this.crearMurallas();
    this.crearFortalezas();
    this.crearMazos();
    this.edificios = new Edificios(this, this.materialesEscenario, Z);

    this.alHover = () => {};
    this.alClic = () => {};
    const el = this.renderer.domElement;
    el.addEventListener('pointermove', e => this.moverPuntero(e));
    el.addEventListener('pointerdown', e => { this.moverPuntero(e); const h = this.tocar(); this.alClic(h, e); });
    el.addEventListener('pointerleave', () => { this.puntero.set(-9, -9); });
    window.addEventListener('resize', () => this.ajustar());
    this.ajustar();
    this.renderer.setAnimationLoop(() => this.cuadro());
  }

  ajustar() {
    const w = this.contenedor.clientWidth, h = this.contenedor.clientHeight;
    this.renderer.setSize(w, h);
    this.camara.aspect = w / h;
    // En pantallas angostas (teléfono vertical) la cámara se aleja para que quepa la mesa.
    const lejos = Math.max(1, 1.6 / this.camara.aspect);
    this.camara.position.set(0, 18.5 * lejos, 8.2 * lejos);
    this.camara.lookAt(0, 0, 0.75);
    this.camara.updateProjectionMatrix();
  }

  // ---------- escenario ----------

  crearMesa() { crearMesa(this, this.materialesEscenario, Z); }

  crearMurallas() { crearMurallas(this, this.materialesEscenario, Z, LIMITES.muralla); }

  crearFortalezas() { crearFortalezas(this, this.materialesEscenario, X_FORTALEZA, Z_FORTALEZA); }

  crearMazos() {
    this.mazos = [];
    for (const j of [0, 1]) {
      const g = new THREE.Group();
      g.position.set(X_MAZO, 0, Z.aldea[j]);
      this.escena.add(g);
      this.mazos.push(g);
    }
  }

  // ---------- cartas ----------

  texturaFrente(id, actual, j = 0) {
    const c = dibujarCarta(document.createElement('canvas'), CARTAS[id], this.tema.info(id, j), this.tema.imagen(id, j), this.tema.terminos, actual);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  crearCarta(uid, id, desde, j = 0) {
    const g = new THREE.Group();
    const frente = new THREE.Mesh(this.geoCarta, new THREE.MeshBasicMaterial({ map: this.texturaFrente(id, null, j), transparent: true }));
    frente.rotation.x = -Math.PI / 2; frente.position.y = 0.012;
    const dorso = new THREE.Mesh(this.geoCarta, new THREE.MeshBasicMaterial({ map: this.dorsoTex, transparent: true }));
    dorso.rotation.x = Math.PI / 2; dorso.position.y = 0.006;
    const brillo = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.22, H + 0.22), new THREE.MeshBasicMaterial({ color: '#ffd04a', transparent: true, opacity: 0.85, depthWrite: false }));
    brillo.rotation.x = -Math.PI / 2; brillo.position.y = 0.002; brillo.visible = false;
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.7, H * 1.5), new THREE.MeshBasicMaterial({ map: this.sombraTex, transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.position.y = -0.004;
    g.add(sombra, brillo, dorso, frente);
    for (const m of [frente, dorso]) m.userData = { tipo: 'carta', uid };
    g.userData = { uid, id, frente, dorso, brillo, sombra, claveTex: '', objetivo: null, golpe: null, sacudir: 0, salida: null, opacidad: 1, giroZ: 0 };
    if (desde) g.position.copy(desde);
    this.escena.add(g);
    this.cartas.set(uid, g);
    return g;
  }

  // La mano se detecta con una zona fija en la posición de reposo: así la carta que se levanta
  // no se escapa del puntero (antes parpadeaba al apuntar a un borde).
  zonaToque(g, x, y, z) {
    let t = g.userData.toque;
    if (!t) {
      t = new THREE.Mesh(new THREE.PlaneGeometry(W, H * 1.25), new THREE.MeshBasicMaterial({ visible: false }));
      t.userData = { tipo: 'carta', uid: g.userData.uid };
      this.escena.add(t);
      g.userData.toque = t;
    }
    t.position.set(x, y, z + H * 0.12);
    t.rotation.set(-Math.PI / 2 + 0.6, 0, 0);
    t.updateMatrixWorld();
  }

  // Número de atajo (1-9) sobre las cartas de tu mano; solo con ratón (en pantallas táctiles no aporta).
  numeroMano(g, n) {
    const tactil = window.matchMedia?.('(pointer: coarse)').matches;
    if (g.userData.numero === n) return;
    if (g.userData.etiquetaNum) { g.remove(g.userData.etiquetaNum); g.userData.etiquetaNum.material.dispose(); g.userData.etiquetaNum = null; }
    g.userData.numero = n;
    if (!n || tactil) return;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaTexto(String(n), { tam: 70, color: '#ffe7a6' }), depthTest: false, transparent: true }));
    sp.scale.set(0.7, 0.35, 1);
    sp.position.set(0, 0.05, -H / 2 - 0.12);
    sp.renderOrder = 12;
    g.add(sp);
    g.userData.etiquetaNum = sp;
  }

  poner(g, x, y, z, { rotX = 0, giroZ = 0, escala = 1 } = {}) {
    g.userData.objetivo = { x, y, z, rotX, giroZ, escala };
  }

  // Coloca todo según el estado. eventos: los de la última acción (para saber qué animar al salir).
  sync(st, eventos = []) {
    this.ultimoSt = st;
    this.edificios.sync(st);
    const vistos = new Set();
    const jugadas = new Map(eventos.filter(e => e.tipo === 'juega').map(e => [e.uid, e]));

    for (const j of [0, 1]) {
      const p = st.jugadores[j];
      const filas = [['frente', p.frente], ['aldea', p.aldea], ['estructuras', p.estructuras]];
      for (const [zona, lista] of filas) {
        lista.forEach((u, i) => {
          vistos.add(u.uid);
          let g = this.cartas.get(u.uid) || this.crearCarta(u.uid, u.id, new THREE.Vector3(0, 3, Z.mano[j]), j);
          let x;
          if (zona === 'frente') x = CASILLERO.frente(i, lista.length);
          else if (zona === 'aldea') x = CASILLERO.aldea(i);
          else x = CASILLERO.estructuras(i);
          this.poner(g, x, 0.02, j === 0 ? Z[zona === 'estructuras' ? 'aldea' : zona][0] : Z[zona === 'estructuras' ? 'aldea' : zona][1]);
          const d = CARTAS[u.id];
          const actual = { ataque: ataqueDe(st, u, j), vida: u.vida, vidaMax: u.vidaMax };
          const clave = `${actual.ataque}|${actual.vida}|${actual.vidaMax}`;
          if (g.userData.claveTex !== clave) {
            const vieja = g.userData.frente.material.map;
            g.userData.frente.material.map = this.texturaFrente(u.id, actual, j);
            g.userData.frente.material.needsUpdate = true;
            if (g.userData.claveTex) vieja.dispose();
            g.userData.claveTex = clave;
          }
          g.userData.zona = zona; g.userData.j = j;
          // Los combatientes que ya atacaron se ven girados, como en Magic.
          g.userData.objetivo.giroY = (d.tipo === 'combatiente' && !u.listo && st.turno === j && st.fase === 'ataque') ? 0.35 : 0;
        });
      }
      // zona de efectos (cartas azules y negras que siguen activas)
      p.mesaEfectos.forEach((m, i) => {
        vistos.add(m.uid);
        const g = this.cartas.get(m.uid) || this.crearCarta(m.uid, m.id, new THREE.Vector3(0, 3, Z.mano[j]), j);
        g.userData.zona = 'efectos'; g.userData.j = j;
        this.poner(g, CASILLERO.efectos(i), 0.02 + i * 0.01, Z.frente[j]);
      });
      // mano
      const n = p.mano.length;
      p.mano.forEach((c, i) => {
        vistos.add(c.uid);
        const desde = new THREE.Vector3(X_MAZO, 0.3, Z.aldea[j]);
        const g = this.cartas.get(c.uid) || this.crearCarta(c.uid, c.id, desde, j);
        g.userData.zona = 'mano'; g.userData.j = j;
        if (j === 0) {
          const sep = Math.min(1.12, 10 / Math.max(n, 1));
          const hover = this.hoverUid === c.uid;
          this.zonaToque(g, (i - (n - 1) / 2) * sep, 0.8 + i * 0.01, Z.mano[0]);
          this.numeroMano(g, i < 9 ? i + 1 : 0);
          this.poner(g, (i - (n - 1) / 2) * sep, 0.8 + i * 0.01 + (hover ? 1.2 : 0), Z.mano[0] + (hover ? -1.1 : 0), { rotX: 0.6, escala: hover ? 1.3 : 1 });
        } else {
          const sep = Math.min(0.75, 7 / Math.max(n, 1));
          this.poner(g, (i - (n - 1) / 2) * sep, 0.05 + i * 0.01, Z.mano[1], { giroZ: Math.PI, escala: 0.8 });
        }
      });
      // mazo: una pila con altura proporcional
      const pila = this.mazos[j];
      const alto = Math.min(p.mazo.length, 30);
      if (pila.userData.n !== alto) {
        pila.clear();
        if (alto) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(W, alto * 0.025, H), [
            new THREE.MeshStandardMaterial({ color: '#d9c9a2' }), new THREE.MeshStandardMaterial({ color: '#d9c9a2' }),
            new THREE.MeshBasicMaterial({ map: this.dorsoTex }), new THREE.MeshStandardMaterial({ color: '#2a1b10' }),
            new THREE.MeshStandardMaterial({ color: '#d9c9a2' }), new THREE.MeshStandardMaterial({ color: '#d9c9a2' })]);
          m.position.y = alto * 0.0125;
          pila.add(m);
        }
        pila.userData.n = alto;
      }
    }

    // cartas que salieron de la mesa o de la mano
    for (const g of this.cartas.values()) {
      if (g.userData.toque && g.userData.zona !== 'mano') { this.escena.remove(g.userData.toque); g.userData.toque = null; }
      if (g.userData.etiquetaNum && g.userData.zona !== 'mano') this.numeroMano(g, 0);
    }
    for (const [uid, g] of this.cartas) {
      if (vistos.has(uid) || g.userData.salida) continue;
      if (g.userData.toque) { this.escena.remove(g.userData.toque); g.userData.toque = null; }
      const jug = jugadas.get(uid);
      if (jug && g.userData.zona === 'mano') {
        // efecto o maldición: se muestra en el centro y se desvanece
        this.poner(g, jug.j === 0 ? -1.5 : 1.5, 3.2, 0.2, { rotX: 0.9, escala: 1.8 });
        g.userData.salida = { t: 0, espera: 1.8 };
      } else {
        g.userData.salida = { t: 0, espera: 0.15 };
        g.userData.objetivo.y += 0.6;
      }
    }

    // murallas y fortalezas
    for (const j of [0, 1]) {
      const p = st.jugadores[j];
      this.murallas[j].forEach((b, i) => { b.userData.meta = i < p.muralla ? 1 : 0.02; });
      const f = this.fortalezas[j];
      if (f.userData.valor !== p.fortaleza) {
        f.userData.valor = p.fortaleza;
        const m = f.userData.etiqueta.material;
        if (m.map) m.map.dispose();
        m.map = texturaTexto(`♜ ${Math.max(0, p.fortaleza)}`, { color: p.fortaleza <= 6 ? '#ff8a7a' : '#fff4d6' });
        m.needsUpdate = true;
      }
    }
    this.pendientes = new Set(st.jugadores.flatMap(p => p.mesaEfectos.filter(m => m.pendiente).map(m => m.uid)));
    this.dibujarFlechas(st);
    this.aplicarResaltes();
  }

  // Rayos de lo preparado: naranja = ataque de un combatiente, azul = efecto que se disparará.
  // Pulsos de luz viajan por el rayo, unas lucecitas lo recorren y un círculo mágico gira bajo el objetivo.
  dibujarFlechas(st) {
    for (const f of this.flechas) {
      this.escena.remove(f.grupo);
      f.grupo.traverse(m => { m.geometry?.dispose(); m.material?.dispose(); });
    }
    this.flechas = [];
    if (st.fase !== 'preparacion') return;
    const j = st.turno, r = 1 - j;
    // En el orden del plan: ese número se muestra sobre cada rayo.
    const lista = [];
    for (const x of st.plan) {
      if (x.tipo === 'atacar') { lista.push({ desde: x.uid, objetivo: x.objetivo, color: '#ff9a3a' }); continue; }
      const m = st.jugadores[j].mesaEfectos.find(y => y.uid === x.uid);
      if (!m) continue;
      const d = CARTAS[m.id], acc = d.efecto.accion;
      const objetivo = m.objetivo || (acc === 'derribar' || acc === 'asedioMuralla' ? { tipo: 'muralla' }
        : acc === 'dañoTodos' || acc === 'debilidad' ? { tipo: 'frente' } : { tipo: 'aldea' });
      lista.push({ desde: m.uid, objetivo, color: d.tipo === 'maldicion' ? '#b46cff' : '#5aa8ff' });
    }
    lista.forEach((f, i) => { f.numero = i + 1; });
    for (const f of lista) {
      const g = this.cartas.get(f.desde);
      if (!g) continue;
      const o = g.userData.objetivo;
      const a = new THREE.Vector3(o.x, 0.3, o.z);
      const b = f.objetivo.tipo === 'frente' ? new THREE.Vector3(0, 0.3, Z.frente[r])
        : f.objetivo.tipo === 'aldea' ? new THREE.Vector3(-1.5, 0.3, Z.aldea[r]) : this.posicionDe({ ...f.objetivo, j: r }, r);
      b.y = Math.max(0.3, b.y - 0.2);
      const medio = a.clone().lerp(b, 0.5); medio.y += 1.4 + a.distanceTo(b) * 0.12;
      const curva = new THREE.QuadraticBezierCurve3(a, medio, b);
      const color = new THREE.Color(f.color);
      const grupo = new THREE.Group();
      grupo.renderOrder = 8;

      const nucleo = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.05, 8), new THREE.ShaderMaterial({
        uniforms: { color: { value: color }, t: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 color; uniform float t; varying vec2 vUv;
          void main(){
            float pulso = pow(0.5 + 0.5 * sin(vUv.x * 16.0 - t * 7.0), 5.0);
            float borde = smoothstep(0.0, 0.06, vUv.x);
            vec3 c = color * (0.7 + 1.3 * pulso) + vec3(1.0) * pulso * 0.5;
            gl_FragColor = vec4(c, (0.55 + 0.45 * pulso) * borde);
          }`,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      const halo = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.17, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      grupo.add(halo, nucleo);

      const sprite = (tex, tam, opacidad = 1) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.fx[tex], color, transparent: true, opacity: opacidad,
          depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
        sp.scale.setScalar(tam);
        sp.renderOrder = 9;
        grupo.add(sp);
        return sp;
      };
      const luces = [0, 1, 2, 3].map(() => sprite('circle_05', 0.42));
      const punta = sprite('star_06', 1.3);
      punta.position.copy(b);
      const origen = sprite('light_03', 1.2, 0.6);
      origen.position.copy(a);
      const anillo = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: this.fx.magic_02, color,
        transparent: true, opacity: 0.85, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      anillo.rotation.x = -Math.PI / 2;
      anillo.position.set(b.x, 0.05, b.z);
      anillo.renderOrder = 7;
      grupo.add(anillo);

      // Número del paso, en lo alto del rayo
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texturaNumero(f.numero, f.color), depthTest: false, transparent: true }));
      num.scale.setScalar(0.85);
      num.position.copy(curva.getPoint(0.18)).add(new THREE.Vector3(0, 0.35, 0));
      num.renderOrder = 12;
      grupo.add(num);

      this.escena.add(grupo);
      this.flechas.push({ grupo, curva, nucleo, luces, punta, anillo });
    }
  }

  texturaNumero(n, color) {
    this.cacheNumeros ||= {};
    const clave = n + color;
    if (this.cacheNumeros[clave]) return this.cacheNumeros[clave];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const k = c.getContext('2d');
    k.beginPath(); k.arc(64, 64, 54, 0, Math.PI * 2);
    k.fillStyle = '#1a120b'; k.fill();
    k.lineWidth = 10; k.strokeStyle = color; k.stroke();
    k.fillStyle = '#fff4d6'; k.font = 'bold 72px Georgia, serif';
    k.textAlign = 'center'; k.textBaseline = 'middle';
    k.fillText(String(n), 64, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (this.cacheNumeros[clave] = t);
  }

  animarFlechas(dt) {
    this.tiempo += dt;
    const t = this.tiempo;
    for (const f of this.flechas) {
      f.nucleo.material.uniforms.t.value = t;
      f.luces.forEach((l, i) => {
        const k = (t * 0.55 + i / f.luces.length) % 1;
        l.position.copy(f.curva.getPoint(k));
        l.material.opacity = Math.sin(k * Math.PI);
      });
      f.punta.scale.setScalar(1.1 + Math.sin(t * 6) * 0.25);
      f.punta.material.rotation = t * 0.8;
      f.anillo.rotation.z = t * 0.9;
    }
  }

  // Destello de impacto (estrella + chispa eléctrica) en el punto del golpe.
  destello(pos, color = '#ffd08a', tam = 2.2) {
    for (const [tex, k, vida] of [['star_06', 1, 0.45], ['spark_01', 0.9, 0.35]]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.fx[tex], color, transparent: true,
        depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.position.copy(pos);
      sp.material.rotation = Math.random() * Math.PI;
      sp.renderOrder = 11;
      this.escena.add(sp);
      this.efimeros.push({ obj: sp, vida, t: 0, tipo: 'destello', tam: tam * k });
    }
  }

  posicionDe(objetivo, jDefecto) {
    if (objetivo.tipo === 'muralla') return new THREE.Vector3(0, 0.5, Z.muralla[objetivo.j ?? jDefecto]);
    if (objetivo.tipo === 'fortaleza') return new THREE.Vector3(-X_FORTALEZA, 1, Z_FORTALEZA[objetivo.j ?? jDefecto]);
    const g = this.cartas.get(objetivo.uid);
    if (!g) return new THREE.Vector3();
    const o = g.userData.objetivo;
    return new THREE.Vector3(o.x, o.y + 0.3, o.z);
  }

  // ---------- resaltes ----------

  resaltar(r) {
    this.resaltes = { jugables: new Set(), objetivos: [], seleccion: null, listos: new Set(), declarados: new Set(), ...r };
    this.aplicarResaltes();
  }

  aplicarResaltes() {
    const { jugables, objetivos, seleccion, listos, declarados } = this.resaltes;
    const uidsObj = new Set(objetivos.filter(o => o.tipo === 'unidad').map(o => o.uid));
    for (const [uid, g] of this.cartas) {
      const b = g.userData.brillo;
      let color = null;
      if (uid === seleccion) color = '#fff6c8';
      else if (uidsObj.has(uid)) color = '#ff4a3a';
      else if (declarados.has(uid)) color = '#ff9a3a';
      else if (listos.has(uid)) color = '#58d36a';
      else if (this.pendientes.has(uid)) color = '#5aa8ff';
      else if (jugables.has(uid)) color = '#ffc23a';
      b.visible = !!color;
      if (color) b.material.color.set(color);
    }
    for (const j of [0, 1]) {
      const objMur = objetivos.some(o => o.tipo === 'muralla' && (o.j ?? 1) === j);
      const objFor = objetivos.some(o => o.tipo === 'fortaleza' && (o.j ?? 1) === j);
      this.murallas[j].forEach(b => b.material.emissive?.set(objMur ? '#7a1408' : '#000'));
      this.fortalezas[j].userData.piedra.emissive.set(objFor ? '#7a1408' : '#000');
    }
  }

  // ---------- puntero ----------

  moverPuntero(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  tocar() {
    this.raycaster.setFromCamera(this.puntero, this.camara);
    const objs = [];
    for (const g of this.cartas.values()) {
      if (g.userData.salida) continue;
      if (g.userData.toque && g.userData.zona === 'mano') {
        objs.push(g.userData.toque);
        if (g.userData.uid === this.hoverUid) objs.push(g.userData.frente);
      } else objs.push(g.userData.frente, g.userData.dorso);
    }
    objs.push(...this.golpeMuralla);
    for (const f of this.fortalezas) f.traverse(m => { if (m.userData.tipo === 'fortaleza' && m.isMesh) objs.push(m); });
    const hit = this.raycaster.intersectObjects(objs, false)[0];
    if (!hit) return null;
    const d = hit.object.userData;
    if (d.tipo === 'carta') {
      const g = this.cartas.get(d.uid);
      const tipo = g.userData.zona === 'mano' ? 'mano' : g.userData.zona === 'efectos' ? 'efecto' : 'unidad';
      return { tipo, uid: d.uid, j: g.userData.j, id: g.userData.id };
    }
    return { tipo: d.tipo, j: d.j };
  }

  // ---------- animaciones ----------

  numero(pos, texto, color) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaTexto(texto, { color, tam: 80 }), depthTest: false, transparent: true }));
    s.scale.set(1.8, 0.9, 1);
    s.position.copy(pos).add(new THREE.Vector3(0, 0.8, 0));
    s.renderOrder = 10;
    this.escena.add(s);
    this.efimeros.push({ obj: s, vida: 1.2, t: 0, tipo: 'numero' });
  }

  chispas(pos, color, n = 26, fuerza = 3) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) {
      p.set([pos.x, pos.y, pos.z], i * 3);
      v.push(new THREE.Vector3((Math.random() - 0.5) * fuerza, Math.random() * fuerza, (Math.random() - 0.5) * fuerza));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.16, transparent: true, depthWrite: false }));
    this.escena.add(pts);
    this.efimeros.push({ obj: pts, vida: 0.9, t: 0, tipo: 'chispas', v });
  }

  // Anima los eventos de una acción. Devuelve cuánto dura (segundos) para esperar antes de la siguiente.
  animar(eventos, st) {
    let dur = 0.25;
    for (const e of eventos) {
      switch (e.tipo) {
        case 'ataca': {
          const g = this.cartas.get(e.uid);
          if (g) {
            const destino = this.posicionDe({ ...e.objetivo, j: 1 - e.j }, 1 - e.j);
            const o = g.userData.objetivo;
            g.userData.golpe = { t: 0, dir: new THREE.Vector3(destino.x - o.x, 0, destino.z - o.z) };
          }
          dur = Math.max(dur, 0.6);
          break;
        }
        case 'daño': {
          const g = this.cartas.get(e.uid);
          if (g) {
            g.userData.sacudir = 0.35;
            const o = g.userData.objetivo;
            const pos = new THREE.Vector3(o.x, o.y + 0.2, o.z);
            this.numero(pos, `-${e.n}`, '#ff6b5a');
            this.chispas(pos, e.fuente === 'peste' ? '#8fd14f' : '#ff8a3a');
            this.destello(pos.clone().add(new THREE.Vector3(0, 0.4, 0)), e.fuente === 'peste' ? '#8fd14f' : '#ffb35a');
          }
          dur = Math.max(dur, 0.7);
          break;
        }
        case 'cura': {
          const g = this.cartas.get(e.uid);
          if (g) { const o = g.userData.objetivo; this.numero(new THREE.Vector3(o.x, o.y, o.z), `+${e.n}`, '#7dff8a'); }
          break;
        }
        case 'dañoFortaleza': {
          const f = this.fortalezas[e.j];
          f.userData.sacudir = 0.5;
          for (const x of [X_FORTALEZA, -X_FORTALEZA]) {
            this.chispas(new THREE.Vector3(x, 1.2, Z_FORTALEZA[e.j]), '#ffb04a', 30);
            this.destello(new THREE.Vector3(x, 1.4, Z_FORTALEZA[e.j]), '#ffb04a', 2.4);
          }
          this.numero(new THREE.Vector3(-X_FORTALEZA, 2.2, Z_FORTALEZA[e.j]), `-${e.n}`, '#ff6b5a');
          dur = Math.max(dur, 0.8);
          break;
        }
        case 'muralla': {
          const pos = new THREE.Vector3(0, 0.6, Z.muralla[e.j]);
          if (e.n < 0) { this.numero(pos, `${e.n}`, '#ffb08a'); this.chispas(pos, '#c9bba0', 40, 4); this.destello(pos, '#ffd9a0', 2.6); }
          else this.numero(pos, `+${e.n}`, '#e8d9b0');
          dur = Math.max(dur, 0.5);
          break;
        }
        case 'recursos':
          this.numero(new THREE.Vector3(-4, 0.8, Z.aldea[e.j]), `+${e.n} ◆`, '#ffd76a');
          break;
        case 'maldicion':
          this.chispas(new THREE.Vector3(0, 1, Z.aldea[e.j]), '#b46cff', 80, 6);
          dur = Math.max(dur, 1.1);
          break;
        case 'disparo': {
          this.edificios.disparo(e);
          const g = this.cartas.get(e.uid);
          if (g) this.chispas(this.posicionDe({ tipo: 'unidad', uid: e.uid }), '#ffe08a', 20, 2);
          break;
        }
        case 'juega': {
          const d = CARTAS[e.id];
          if (d.tipo === 'efecto' || d.tipo === 'maldicion') dur = Math.max(dur, 1.8);
          break;
        }
      }
    }
    return dur;
  }

  cuadro() {
    const dt = Math.min(this.reloj.getDelta(), 0.05);
    // hover
    const h = this.tocar();
    const clave = h ? `${h.tipo}:${h.uid ?? h.j}` : '';
    if (clave !== this.claveHover) {
      this.claveHover = clave;
      this.hoverUid = h && h.tipo === 'mano' && h.j === 0 ? h.uid : null;
      if (this.ultimoSt) this.sync(this.ultimoSt);
      this.alHover(h);
    }

    for (const [uid, g] of this.cartas) {
      const u = g.userData, o = u.objetivo;
      if (!o) continue;
      let ox = 0, oz = 0;
      if (u.golpe) {
        u.golpe.t += dt;
        const k = Math.sin(Math.min(u.golpe.t / 0.45, 1) * Math.PI);
        ox = u.golpe.dir.x * 0.55 * k; oz = u.golpe.dir.z * 0.55 * k;
        if (u.golpe.t > 0.45) u.golpe = null;
      }
      if (u.sacudir > 0) { u.sacudir -= dt; ox += (Math.random() - 0.5) * 0.15; oz += (Math.random() - 0.5) * 0.15; }
      g.position.x = suave(g.position.x, o.x, dt) + ox * 0.5;
      g.position.y = suave(g.position.y, o.y + (u.golpe ? 0.4 : 0), dt);
      g.position.z = suave(g.position.z, o.z, dt) + oz * 0.5;
      g.rotation.x = suave(g.rotation.x, o.rotX, dt);
      g.rotation.y = suave(g.rotation.y, o.giroY || 0, dt);
      u.giroZ = suave(u.giroZ, o.giroZ, dt, 7);
      g.rotation.z = u.giroZ;
      const e = suave(g.scale.x, o.escala, dt);
      g.scale.set(e, e, e);
      u.sombra.visible = o.y < 0.5;
      if (u.brillo.visible) u.brillo.material.opacity = 0.55 + Math.sin(performance.now() / 180) * 0.3;
      if (u.salida) {
        u.salida.t += dt;
        if (u.salida.t > u.salida.espera) {
          u.opacidad -= dt * 2.5;
          for (const m of [u.frente, u.dorso, u.sombra]) m.material.opacity = Math.max(0, u.opacidad);
          if (u.opacidad <= 0) {
            this.escena.remove(g);
            u.frente.material.map?.dispose();
            this.cartas.delete(uid);
          }
        }
      }
    }
    this.polvo.cuadro(dt);
    actualizarMurallas(this, dt);
    animarTorres(this, dt, LIMITES.fortaleza);
    this.edificios.cuadro(dt);
    this.animarFlechas(dt);
    for (const ef of this.efimeros) {
      ef.t += dt;
      const k = ef.t / ef.vida;
      if (ef.tipo === 'numero') { ef.obj.position.y += dt * 1.1; ef.obj.material.opacity = 1 - k * k; }
      else if (ef.tipo === 'destello') { ef.obj.scale.setScalar(ef.tam * (0.4 + k * 0.8)); ef.obj.material.opacity = 1 - k; }
      else if (ef.tipo === 'proyectil') { ef.obj.position.copy(ef.desde).lerp(ef.hasta, k); }
      else {
        const pos = ef.obj.geometry.attributes.position;
        ef.v.forEach((v, i) => {
          v.y -= dt * 6;
          pos.setXYZ(i, pos.getX(i) + v.x * dt, Math.max(0.02, pos.getY(i) + v.y * dt), pos.getZ(i) + v.z * dt);
        });
        pos.needsUpdate = true;
        ef.obj.material.opacity = 1 - k;
      }
      if (k >= 1) { this.escena.remove(ef.obj); if (ef.tipo === 'numero') ef.obj.material.map?.dispose(); ef.obj.material.dispose(); ef.obj.geometry?.dispose(); }
    }
    this.efimeros = this.efimeros.filter(ef => ef.t < ef.vida);
    this.renderer.render(this.escena, this.camara);
  }

  destruir() {
    this.renderer.setAnimationLoop(null);
    this.polvo.destruir();
    const geometrias = new Set(), materiales = new Set(), texturas = new Set();
    this.escena.traverse(o => { if (o.geometry) geometrias.add(o.geometry); for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m) materiales.add(m); });
    for (const m of materiales) for (const v of Object.values(m)) if (v?.isTexture) texturas.add(v);
    for (const t of Object.values(this.fx)) texturas.add(t);
    for (const t of [this.sombraTex, this.dorsoTex, ...Object.values(this.cacheNumeros || {})]) texturas.add(t);
    geometrias.forEach(g => g.dispose()); materiales.forEach(m => m.dispose()); texturas.forEach(t => t.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
