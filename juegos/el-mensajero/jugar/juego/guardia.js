// Soldados de Herodes. Estados: patrulla → sospecha (?) → persigue (!) → busca → vuelve → patrulla.
// No hay combate: si alcanzan a Eliab, se vuelve al último punto de control.
// modo 'cazador': no patrulla; persigue desde que se activa hasta la línea de escape.

import * as THREE from 'three';
import { mover, GRAVEDAD } from './fisica.js?v=28b478bc';

export const AJUSTES_GUARDIA = {
  velocidadPatrulla: 1.5, velocidadPersigue: 4.6, velocidadAgachado: 1.6,
  alcanceVista: 6.5, alcanceVistaAlerta: 10, toleranciaAltura: 1.35,
  sospechaSube: 1.5,        // por segundo, de cerca (de lejos, menos)
  sospechaBaja: 0.45,
  tiempoPerder: 2.2,        // s sin verte para dejar de perseguir
  tiempoBuscar: 2.4,
  distanciaAtrapar: 0.75,
  saltoObstaculo: 1.45,     // m: lo más alto que salta
};

export class Guardia {
  constructor(personaje, mundo, { x, y = 0, ruta = null, dir = -1, modo = 'patrulla', escape = Infinity, ajustes = {} }) {
    this.p = personaje;
    this.mundo = mundo;
    this.A = { ...AJUSTES_GUARDIA, ...ajustes };
    this.inicial = { x, y, dir };
    this.ruta = ruta;
    this.modo = modo;
    this.escape = escape;         // x a partir de la cual el cazador se rinde
    this.c = { x, y, a: 0.6, h: 1.75, vx: 0, vy: 0, enSuelo: true };
    this.cono = conoDeVista();
    this.p.raiz.add(this.cono);   // el cono gira con el cuerpo: se recoloca cada cuadro en coordenadas del mundo
    this.reiniciar();
  }

  reiniciar() {
    Object.assign(this.c, { x: this.inicial.x, y: this.inicial.y, vx: 0, vy: 0, h: 1.75 });
    this.dir = this.inicial.dir;
    this.estado = this.modo === 'cazador' || this.modo === 'huidor' ? 'dormido' : 'patrulla';
    this.sospecha = 0;
    this.sinVerte = 0;
    this.espera = 0;
    this.buscar = 0;
    this.activo = this.modo === 'patrulla';
    this.p.raiz.visible = this.activo;
    this.p.mirar(this.dir);
    this.p.animar(this.modo === 'patrulla' ? 'caminar' : 'quieto', { mezcla: 0 });
    if (this.modo === 'huidor') { this.activo = true; this.p.raiz.visible = true; }   // espera a que Eliab se acerque
    this.sincronizar();
  }

  // El cazador sale por una puerta y arranca tras una pausa corta.
  despertar(x, y, demora = 0.9) {
    this.inicial = { x, y, dir: 1 };
    Object.assign(this.c, { x, y, vx: 0, vy: 0 });
    this.activo = true;
    this.p.raiz.visible = true;
    this.estado = 'alerta';
    this.espera = demora;
    this.dir = 1;
    this.p.mirar(1);
    this.p.animar('llamar', { mezcla: 0.1 });
    this.sincronizar();
  }

  // Devuelve un evento: 'visto' | 'perdido' | 'atrapado' | 'rinde' | null
  actualizar(dt, jugador) {
    if (!this.activo) return null;
    const A = this.A, c = this.c, j = jugador.c;
    let evento = null;
    const dx = j.x - c.x, dy = (j.y + j.h * 0.6) - (c.y + 1.55);
    const meVe = this.modo === 'huidor' ? false : this.puedeVer(jugador);
    // el ladrón: arranca cuando Eliab se acerca; si Eliab lo toca, suelta lo robado; si llega a su salida, se escapa
    if (this.modo === 'huidor') {
      if (this.estado === 'dormido') {
        this.p.animar('brazos');
        if (Math.abs(dx) < 7) { this.estado = 'persigue'; return 'huye'; }
        this.sincronizar();
        return null;
      }
      if (this.estado === 'persigue' && Math.abs(dx) < 0.9 && Math.abs(j.y - c.y) < 1.2) { this.estado = 'rendido'; return 'alcanzado'; }
      if (this.estado === 'persigue' && c.x >= this.escape) { this.estado = 'rendido'; this.activo = false; this.p.raiz.visible = false; return 'escapo'; }
    }

    switch (this.estado) {
      case 'patrulla': {
        const [a, b] = this.ruta;
        if (this.espera > 0) {
          this.espera -= dt;
          c.vx = 0;
          this.p.animar('farol', { mezcla: 0.3 });
          if (this.espera <= 0) this.dir = -this.dir;
        } else {
          this.p.animar('caminar', { velocidad: 0.85, mezcla: 0.3 });
          c.vx = this.dir * A.velocidadPatrulla;
          if ((this.dir > 0 && c.x >= b) || (this.dir < 0 && c.x <= a)) { this.espera = 1.6; c.vx = 0; }
        }
        if (meVe) this.subirSospecha(dt, Math.abs(dx));
        else this.sospecha = Math.max(0, this.sospecha - A.sospechaBaja * dt);
        if (this.sospecha > 0.35 && this.estado === 'patrulla') { this.estado = 'sospecha'; }
        break;
      }
      case 'sospecha': {
        c.vx = 0;
        this.dir = Math.sign(dx) || this.dir;
        this.p.animar('farol', { mezcla: 0.2 });
        if (meVe) this.subirSospecha(dt, Math.abs(dx));
        else this.sospecha -= A.sospechaBaja * dt;
        if (this.sospecha <= 0.1) { this.estado = 'patrulla'; this.sospecha = 0; }
        break;
      }
      case 'alerta': {   // «¡Alto!» antes de correr
        c.vx = 0;
        this.espera -= dt;
        if (this.espera <= 0) { this.estado = 'persigue'; this.sinVerte = 0; evento = 'visto'; }
        break;
      }
      case 'persigue': {
        const huye = this.modo === 'huidor';
        this.dir = huye ? 1 : (Math.sign(dx) || this.dir);
        const lejosArriba = !huye && dy > 1.9;
        let vel = A.velocidadPersigue;
        // el ladrón corre algo más lento cuando Eliab se queda lejos (para que siempre se lo pueda alcanzar corriendo)
        if (huye) vel = Math.abs(dx) > 9 ? A.velocidadPersigue * 0.75 : A.velocidadPersigue * 1.05;
        // agacharse bajo una viga
        const frente = c.x + this.dir * 0.5;
        const viga = this.mundo.choca(frente - 0.3, c.y + 1.05, frente + 0.3, c.y + 1.75);
        const bajo = viga && !this.mundo.choca(frente - 0.3, c.y + 0.05, frente + 0.3, c.y + 1.0);
        c.h = bajo || this.mundo.choca(c.x - 0.3, c.y + 1.05, c.x + 0.3, c.y + 1.75) ? 1.0 : 1.75;
        if (c.h < 1.5) vel = A.velocidadAgachado;
        if (lejosArriba && Math.abs(dx) < 1.2) vel = 0;   // está arriba: espera debajo
        c.vx = this.dir * vel;
        // saltar obstáculos bajos y huecos
        if (c.enSuelo && vel > 0) {
          const obst = this.mundo.choca(frente - 0.3, c.y + 0.05, frente + 0.3, c.y + A.saltoObstaculo);
          const pared = this.mundo.choca(frente - 0.3, c.y + A.saltoObstaculo, frente + 0.3, c.y + A.saltoObstaculo + 0.6);
          const hueco = !this.mundo.sueloEn(c.x + this.dir * 0.4, c.y, 1.5);
          if ((obst && !pared && !bajo) || hueco) { c.vy = hueco ? 10 : 9.2; }
        }
        if (meVe) this.sinVerte = 0;
        else this.sinVerte += dt;
        if (this.modo === 'patrulla' && (this.sinVerte > A.tiempoPerder || (lejosArriba && this.sinVerte > 0.6))) {
          this.estado = 'busca'; this.buscar = A.tiempoBuscar; evento = 'perdido';
        }
        if (this.modo === 'cazador' && j.x > this.escape) { this.estado = 'rendido'; evento = 'rinde'; }
        if (!huye && Math.abs(dx) < A.distanciaAtrapar && Math.abs(j.y - c.y) < 1.0 && !jugador.escondido) evento = 'atrapado';
        const v = Math.abs(c.vx);
        if (!c.enSuelo) this.p.animar('aire', { mezcla: 0.15 });
        else if (c.h < 1.5) this.p.animar('agachado_andar', { velocidad: 1.3 });
        else if (v > 0.1) this.p.animar('correr', { velocidad: v / 6.2 });
        else this.p.animar('farol');
        break;
      }
      case 'busca': {
        c.vx = 0;
        c.h = 1.75;
        this.buscar -= dt;
        // mira a un lado y al otro
        this.dir = Math.sin(this.buscar * 2.6) > 0 ? 1 : -1;
        this.p.animar('farol', { mezcla: 0.25 });
        if (meVe) { this.estado = 'persigue'; this.sinVerte = 0; evento = 'visto'; }
        else if (this.buscar <= 0) this.estado = 'vuelve';
        break;
      }
      case 'vuelve': {
        const [a, b] = this.ruta;
        const destino = c.x < a ? a : c.x > b ? b : null;
        if (destino === null) { this.estado = 'patrulla'; break; }
        this.dir = Math.sign(destino - c.x);
        c.vx = this.dir * A.velocidadPatrulla * 1.3;
        this.p.animar('caminar');
        if (meVe) this.subirSospecha(dt, Math.abs(dx));
        if (this.sospecha > 0.35) this.estado = 'sospecha';
        break;
      }
      case 'rendido': {
        c.vx = 0;
        this.p.animar(this.modo === 'huidor' ? 'si' : 'no', { mezcla: 0.3 });
        break;
      }
    }

    if (this.estado === 'sospecha' && this.sospecha >= 1) {
      this.estado = 'persigue'; this.sinVerte = 0; evento = 'visto';
    }
    c.vy -= GRAVEDAD * dt;
    mover(this.mundo, c, dt, { subir: 0.35 });
    if (c.y < -6) {
      if (this.modo !== 'cazador') this.reiniciar();
      else { this.activo = false; this.p.raiz.visible = false; this.estado = 'rendido'; return 'rinde'; }   // cayó al callejón
    }
    this.p.mirar(this.dir);
    this.sincronizar();
    this.pintarCono();
    return evento;
  }

  subirSospecha(dt, distancia) {
    const alcance = this.estado === 'patrulla' ? this.A.alcanceVista : this.A.alcanceVistaAlerta;
    const cerca = 1 - Math.min(1, distancia / alcance);
    this.sospecha = Math.min(1, this.sospecha + this.A.sospechaSube * (0.45 + cerca * 1.6) * dt);
  }

  puedeVer(jugador) {
    if (jugador.escondido) return false;
    const c = this.c, j = jugador.c;
    if (jugador.sobreToldo && j.y > c.y + 1.2) return false;   // la tela del toldo lo tapa desde la calle
    const alcance = this.estado === 'patrulla' ? this.A.alcanceVista : this.A.alcanceVistaAlerta;
    const ojoY = c.y + (c.h < 1.5 ? 0.9 : 1.55);
    const jx = j.x, jy = j.y + j.h * 0.6;
    const dx = jx - c.x;
    const persiguiendo = this.estado === 'persigue' || this.estado === 'busca';
    if (Math.abs(dx) < 0.9 && Math.abs(j.y - c.y) < 1.2) return true;   // pegado a él: lo nota aunque esté de espaldas
    if (!persiguiendo && Math.sign(dx) !== this.dir) return false;
    if (Math.abs(dx) > alcance) return false;
    const tolerancia = this.A.toleranciaAltura + (persiguiendo ? 1.2 : 0);
    if (Math.abs(jy - ojoY) > tolerancia + Math.abs(dx) * 0.08) return false;
    return this.mundo.vista(c.x, ojoY, jx, jy);
  }

  sincronizar() {
    this.p.raiz.position.set(this.c.x, this.c.y, -0.05);
  }

  pintarCono() {
    // el cono vive en coordenadas del cuerpo, que gira: se deshace el giro para dibujarlo en el plano del juego
    const cono = this.cono;
    cono.visible = this.activo && this.estado !== 'rendido' && this.modo === 'patrulla';
    if (!cono.visible) return;
    cono.rotation.y = -this.p.raiz.rotation.y;
    cono.scale.x = this.dir;
    const alcance = this.estado === 'patrulla' ? this.A.alcanceVista : this.A.alcanceVistaAlerta;
    cono.scale.y = 1;
    cono.children[0].scale.set(alcance, 1, 1);
    const k = this.estado === 'persigue' ? 1 : this.sospecha;
    cono.children[0].material.color.setRGB(1, 0.85 - k * 0.6, 0.45 - k * 0.35);
    cono.children[0].material.opacity = 0.16 + k * 0.14;
  }
}

// Abanico de luz del farol en el plano del juego (de 0 a 1 en x; se escala al alcance).
function conoDeVista() {
  const g = new THREE.BufferGeometry();
  const angulo = 0.22;
  const pts = [0, 0, 0];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = -angulo + (2 * angulo * i) / n;
    pts.push(Math.cos(a), Math.sin(a), 0);
  }
  const idx = [];
  for (let i = 1; i <= n; i++) idx.push(0, i, i + 1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const colores = [1, 1, 1];
  for (let i = 0; i <= n; i++) colores.push(0, 0, 0);
  g.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    color: 0xffd27a, transparent: true, opacity: 0.18, depthWrite: false, vertexColors: true,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  const grupo = new THREE.Group();
  grupo.add(m);
  grupo.position.y = 1.45;
  grupo.renderOrder = 2;
  return grupo;
}
