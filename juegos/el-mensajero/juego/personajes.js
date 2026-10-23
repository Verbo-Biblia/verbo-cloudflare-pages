// Personajes 3D: modelos de Quaternius (los del Peregrino) con las animaciones de modelos/animaciones.glb
// (Universal Animation Library 1 y 2, ya renombradas al esqueleto de los personajes por herramientas/preparar_modelos.py).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as clonarEsqueleto } from 'three/addons/utils/SkeletonUtils.js';

const cargador = new GLTFLoader();
const modelos = {};      // nombre -> gltf
let clips = {};          // nombre -> AnimationClip
const ALTURA = 1.78;     // m: todos los personajes quedan de esta altura

export function cargarGlb(ruta, alProgreso) {
  return new Promise((ok, mal) => cargador.load(ruta, ok, alProgreso, mal));
}

export async function cargarAnimaciones(ruta) {
  const g = await cargarGlb(ruta);
  clips = Object.fromEntries(g.animations.map(c => [c.name, c]));
}

export async function cargarModelo(nombre, ruta) {
  modelos[nombre] = await cargarGlb(ruta);
}

// Giro del cuerpo: de perfil, pero algo vuelto hacia la cámara (se le ve la cara).
const GIRO_CAMARA = 0.42;

export class Personaje {
  constructor(nombre, opciones = {}) {
    const g = modelos[nombre];
    this.raiz = new THREE.Group();
    this.cuerpo = clonarEsqueleto(g.scene);
    this.raiz.add(this.cuerpo);
    // tamaño: medir en la pose de reposo y escalar a ALTURA
    // medir con los huesos aplicados (precise): la caja de la malla sola viene en otra escala
    this.cuerpo.updateMatrixWorld(true);
    this.cuerpo.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
    const caja = new THREE.Box3().setFromObject(this.cuerpo, true);
    const alto = caja.max.y - caja.min.y || 1.8;
    this.cuerpo.scale.setScalar((opciones.altura ?? ALTURA) / alto);
    this.cuerpo.position.y = -caja.min.y * this.cuerpo.scale.y;
    this.cuerpo.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;   // las mallas con esqueleto calculan mal su caja al animarse
        o.castShadow = false;
        o.material = o.material.clone();
        if (opciones.tinte) {
          const nombreTex = o.material.map?.name ?? '';
          const t = opciones.tinte(o.material.name, nombreTex);
          if (t) o.material.color.multiply(new THREE.Color(t));
        }
        o.material.roughness = Math.max(o.material.roughness ?? 1, 0.85);
        o.material.metalness = 0;
      }
    });
    this.huesos = {};
    this.cuerpo.traverse(o => { if (o.isBone) this.huesos[o.name] = o; });
    this.mixer = new THREE.AnimationMixer(this.cuerpo);
    this.acciones = {};
    // la pelvis de cada cuerpo está a otra altura que la del maniquí de las animaciones: se ajusta su posición
    const pelvis = this.huesos.pelvis;
    const factor = pelvis ? pelvis.position.length() / 0.9180 : 1;   // 0.918 = pelvis del maniquí de UAL
    for (const [n, c] of Object.entries(clips)) {
      const clip = c.clone();
      for (const pista of clip.tracks) {
        if (pista.name.endsWith('.position')) for (let i = 0; i < pista.values.length; i++) pista.values[i] *= factor;
      }
      this.acciones[n] = this.mixer.clipAction(clip);
    }
    this.actual = null;
    this.mirando = 1;
    this.anguloObjetivo = this.angulo = Math.PI / 2 - GIRO_CAMARA;
    this.raiz.rotation.y = this.angulo;
    this.raiz.add(sombraRedonda());
  }

  // Cambia de animación con fundido. una_vez: no repite y se queda en el último cuadro.
  animar(nombre, { mezcla = 0.18, velocidad = 1, una_vez = false, desde = 0 } = {}) {
    const a = this.acciones[nombre];
    if (!a) return;
    a.timeScale = velocidad;
    if (this.actual === a) return;
    a.reset();
    a.time = desde;
    a.setLoop(una_vez ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = una_vez;
    a.enabled = true;
    a.setEffectiveWeight(1);
    if (this.actual) a.crossFadeFrom(this.actual, mezcla, false);
    a.play();
    this.actual = a;
  }

  duracion(nombre) { return this.acciones[nombre]?.getClip().duration ?? 0; }

  mirar(dir) {
    if (!dir) return;
    this.mirando = Math.sign(dir);
    this.anguloObjetivo = this.mirando * (Math.PI / 2 - GIRO_CAMARA);
  }

  mirarCamara() { this.anguloObjetivo = 0; }

  // De perfil puro (sin el giro hacia la cámara): trepando una soga, de frente a ella.
  mirarPerfil(dir) { this.mirando = Math.sign(dir); this.anguloObjetivo = this.mirando * Math.PI / 2; }

  // De espaldas a la cámara (de frente a una palanca o a una puerta), girando por el lado al que mira.
  mirarAtras() { this.anguloObjetivo = this.angulo >= 0 ? Math.PI : -Math.PI; }

  // Un objeto (hijo de raiz) que sigue la posición de un hueso: farol en la mano, casco en la cabeza.
  // No copia el giro del hueso: el farol cuelga derecho y la lanza queda vertical.
  seguir(hueso, objeto, desfase = new THREE.Vector3()) {
    if (!this.huesos[hueso]) return;
    (this.seguidores ??= []).push({ h: this.huesos[hueso], objeto, desfase });
    this.raiz.add(objeto);
  }

  // 0 = normal, 1 = en sombra (escondido)
  oscurecer(k) {
    if (Math.abs((this._oscuro ?? 0) - k) < 0.01) return;
    this._oscuro = k;
    this.cuerpo.traverse(o => {
      if (!o.isMesh) return;
      o.material.userData.base ??= o.material.color.clone();
      o.material.color.copy(o.material.userData.base).multiplyScalar(1 - k * 0.72);
    });
  }

  // Pose encima de la animación: cada mano (l, r) o pie (pl, pr) estirado hacia un punto, en el espacio del padre de
  // raiz: colgado de la tirolesa, trepando la soga o la escalera. null = soltar (la pose se desvanece).
  alcanzar(puntos) {
    if (puntos) this.alcance = puntos;
    this.alcanceActivo = !!puntos;
  }

  aplicarAlcance(dt) {
    this.pesoAlcance = acercarA(this.pesoAlcance ?? 0, this.alcanceActivo ? 1 : 0, dt * 8);
    if (this.pesoAlcance <= 0 || !this.alcance) return;
    this.raiz.updateMatrixWorld(true);
    const qI = new THREE.Quaternion(), q = new THREE.Quaternion(), qp = new THREE.Quaternion();
    const a = new THREE.Vector3(), m = new THREE.Vector3(), obj = new THREE.Vector3();
    // l, r: manos; pl, pr: pies
    for (const [clave, punta, medio, base] of CADENAS) {
      const mano = this.huesos[punta];
      if (!mano || !this.alcance[clave]) continue;
      obj.copy(this.alcance[clave]);
      this.raiz.parent?.localToWorld(obj);
      // dos pasadas de CCD: antebrazo y brazo (o pantorrilla y muslo) apuntan la mano (o el pie) al punto
      for (let k = 0; k < 2; k++) {
        for (const h of [this.huesos[medio], this.huesos[base]]) {
          if (!h) continue;
          h.getWorldPosition(a);
          mano.getWorldPosition(m);
          q.setFromUnitVectors(m.sub(a).normalize(), obj.clone().sub(a).normalize());
          q.slerp(qI, 1 - this.pesoAlcance);
          h.getWorldQuaternion(qp);
          qp.premultiply(q);
          h.parent.getWorldQuaternion(q);
          h.quaternion.copy(q.invert().multiply(qp));
          h.updateMatrixWorld(true);
        }
      }
    }
  }

  actualizar(dt) {
    this.mixer.update(dt);
    this.aplicarAlcance(dt);
    if (this.seguidores) {
      this.raiz.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      for (const s of this.seguidores) {
        s.h.getWorldPosition(v);
        this.raiz.worldToLocal(v);
        s.objeto.position.copy(v).add(s.desfase);
      }
    }
    // giro rápido pero no instantáneo (se ve, y no se siente lento)
    const d = this.anguloObjetivo - this.angulo;
    this.angulo += d * Math.min(1, dt * 18);
    this.raiz.rotation.y = this.angulo;
  }

  // Cuelga un objeto de un hueso (mano, cabeza). El objeto conserva su tamaño en metros.
  colgar(hueso, objeto) {
    const h = this.huesos[hueso];
    if (!h) return;
    this.raiz.updateMatrixWorld(true);
    const escala = new THREE.Vector3();
    h.getWorldScale(escala);
    objeto.scale.divideScalar(escala.x / (this.raiz.parent ? this.raiz.parent.getWorldScale(new THREE.Vector3()).x : 1));
    h.add(objeto);
  }
}

const CADENAS = [['l', 'hand_l', 'lowerarm_l', 'upperarm_l'], ['r', 'hand_r', 'lowerarm_r', 'upperarm_r'],
  ['pl', 'foot_l', 'calf_l', 'thigh_l'], ['pr', 'foot_r', 'calf_r', 'thigh_r']];

function acercarA(v, objetivo, paso) {
  return v < objetivo ? Math.min(v + paso, objetivo) : Math.max(v - paso, objetivo);
}

let geoSombra, matSombra;
function sombraRedonda() {
  if (!geoSombra) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    geoSombra = new THREE.PlaneGeometry(1.1, 1.1);
    geoSombra.rotateX(-Math.PI / 2);
    matSombra = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  }
  const m = new THREE.Mesh(geoSombra, matSombra);
  m.position.y = 0.02;
  m.renderOrder = 1;
  m.name = 'sombra';
  return m;
}
