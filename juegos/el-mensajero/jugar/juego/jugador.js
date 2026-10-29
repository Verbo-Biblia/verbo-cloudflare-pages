// Eliab: control de plataformas con aceleración, salto variable, tiempo de coyote, salto guardado, agacharse,
// deslizarse, empujar la caja y subir a los bordes. Sin poderes: solo agilidad.

import * as THREE from 'three';
import { entrada, tomar } from './entrada.js?v=2071f06a';
import { mover, GRAVEDAD, VEL_CAIDA_MAX } from './fisica.js?v=2071f06a';

const ZCUERDA = 0.25;   // profundidad de la cuerda de las tirolesas (nivel.js)
const ZSOGA = -0.3;      // profundidad de las sogas para trepar (nivel.js)

export const AJUSTES = {
  velocidad: 4.8,          // m/s caminando rápido (lo normal)
  velocidadCorrer: 7.0,    // con Shift / «Correr»
  velocidadAgachado: 1.9,
  velocidadEmpujar: 1.4,
  acelSuelo: 38, frenoSuelo: 46, acelAire: 20,
  salto: 10.4,             // m/s → unos 1,8 m de alto
  corteSalto: 0.45,        // al soltar el botón subiendo
  coyote: 0.11, guardarSalto: 0.14,
  alto: 1.7, altoAgachado: 1.0, ancho: 0.55,
  alcanceBorde: 1.95,       // m sobre los pies: hasta dónde llegan las manos para agarrarse
  deslizar: 0.7,           // s
  aguaCorriendo: 9,        // s de carrera rápida con la barra llena
  aguaRecarga: 0.03,       // por segundo, caminando (en las persecuciones no se recarga: hay que tomar cántaros)
  trepar: 1.8,             // m/s en escaleras
  treparSoga: 1.4,         // m/s en sogas
  ritmoEscalera: 0.56,     // m/s que sube la animación de escalera a velocidad 1 (Mixamo «Climbing Ladder»)
  ritmoSoga: 0.19,         // ídem la de soga (Mixamo «Climbing A Rope»)
  compasTrepar: 0.5,       // la animación va a este tanto del ritmo de la subida (Juan: «un 50 % menos de movimientos»)
  tirolesa: 9.5,           // m/s máximos colgado de la cuerda
  rampa: 10,               // m/s máximos resbalando
};

export class Jugador {
  constructor(personaje, mundo) {
    this.p = personaje;
    this.mundo = mundo;
    this.c = { x: 0, y: 0, a: AJUSTES.ancho, h: AJUSTES.alto, vx: 0, vy: 0, enSuelo: false };
    this.estado = 'normal';     // normal | trepando | atrapado | quieto (escenas)
    this.agachado = false;
    this.escondido = false;
    this.coyote = 0;
    this.guardado = 0;
    this.bajandoToldo = 0;
    this.deslizando = 0;
    this.trepar = null;
    this.aterrizaje = 0;
    this.empujando = null;
    this.sombras = [];          // zonas [x0, x1] donde agachado no te ven (detrás de barriles y cajas, portales)
    this.puertas = [];          // [x, y] de los portales donde se entra con «usar» para esconderse
    this.puerta = null;         // portal en el que está metido
    this.cerca = null;          // lo que se puede usar al lado: 'puerta' | 'caja' | 'cobertura' | null (para el aviso)
    this.z = 0;                 // profundidad (solo al meterse en un portal)
    this.entro = false;         // acaba de meterse en un portal (para ver si un soldado lo vio entrar)
    this.descubierto = false;   // lo vieron entrar: el portal no lo esconde
    this.eventos = [];          // 'salto', 'aterrizar', 'paso', 'deslizar', 'trepar'
    this.tiempoPaso = 0;
    this.cajas = [];            // las que se pueden empujar (cuerpos con física propia)
    this.escaleras = [];        // [{x, y0, y1}] escaleras de mano y sogas
    this.tirolesas = [];        // [{x0, y0, x1, y1}]
    this.rampas = [];           // [{x0, y0, x1, y1}]
    this.agua = 1;              // barra de agua (0-1) para correr rápido
    this.sinRecarga = false;    // en persecución: el agua solo vuelve con cántaros
    this.corriendo = false;
  }

  colocar(x, y, dir = 1) {
    Object.assign(this.c, { x, y, vx: 0, vy: 0, h: AJUSTES.alto });
    this.estado = 'normal';
    this.puerta = null;
    this.z = 0;
    this.descubierto = false;
    this.agua = 1;
    this.escalera = null;
    this.cuerda = null;
    this.agachado = false;
    this.deslizando = 0;
    this.trepar = null;
    this.p.alcanzar(null);
    this.p.mirar(dir);
    this.p.animar('quieto', { mezcla: 0 });
    this.sincronizar();
  }

  actualizar(dt) {
    this.eventos.length = 0;
    const c = this.c;
    this.entro = false;
    if (this.estado === 'trepando') return this.actualizarTrepar(dt);
    if (this.estado === 'puerta') return this.actualizarPuerta(dt);
    if (this.estado === 'escalando') return this.actualizarEscalera(dt);
    if (this.estado === 'tirolesa') return this.actualizarTirolesa(dt);
    if (this.estado !== 'normal') { this.sincronizar(); return; }
    this.z += (0 - this.z) * Math.min(1, dt * 10);

    const A = AJUSTES;
    const dir = entrada.x;
    // --- agacharse (no puede pararse si hay techo encima)
    const quiereAgachar = entrada.abajo && c.enSuelo;
    if (quiereAgachar && !this.agachado) {
      this.agachado = true;
      c.h = A.altoAgachado;
      if (Math.abs(c.vx) > A.velocidad + 0.6) { this.deslizando = A.deslizar; this.eventos.push('deslizar'); }   // solo corriendo
    } else if (!entrada.abajo && this.agachado && this.deslizando <= 0) {
      if (!this.mundo.choca(c.x - c.a / 2, c.y, c.x + c.a / 2, c.y + A.alto)) {
        this.agachado = false;
        c.h = A.alto;
      }
    }
    if (!c.enSuelo && this.agachado && this.deslizando <= 0 &&
        !this.mundo.choca(c.x - c.a / 2, c.y, c.x + c.a / 2, c.y + A.alto)) { this.agachado = false; c.h = A.alto; }

    // --- velocidad horizontal
    // correr rápido gasta agua; sin agua, solo se trota
    this.corriendo = entrada.correr && this.agua > 0.01 && !!dir;
    if (this.corriendo && Math.abs(c.vx) > A.velocidad + 0.3) this.agua = Math.max(0, this.agua - dt / A.aguaCorriendo);
    else if (!this.sinRecarga) this.agua = Math.min(1, this.agua + dt * A.aguaRecarga);
    let objetivo = dir * (this.corriendo ? A.velocidadCorrer : A.velocidad);
    if (this.agachado) objetivo = dir * A.velocidadAgachado;
    if (this.deslizando > 0) {
      this.deslizando -= dt;
      objetivo = c.vx;   // conserva el impulso y frena despacio
      c.vx *= Math.pow(0.35, dt);
      if (this.deslizando <= 0 && !entrada.abajo &&
          !this.mundo.choca(c.x - c.a / 2, c.y, c.x + c.a / 2, c.y + A.alto)) { this.agachado = false; c.h = A.alto; }
    } else {
      const acel = c.enSuelo ? (dir && Math.sign(dir) === Math.sign(c.vx || dir) ? A.acelSuelo : A.frenoSuelo) : A.acelAire;
      c.vx = acercar(c.vx, objetivo, acel * dt);
    }

    // --- salto (coyote + guardado); ↓ + saltar sobre un toldo = bajarse
    this.coyote = c.enSuelo ? A.coyote : this.coyote - dt;
    this.guardado = tomar('saltar') ? A.guardarSalto : this.guardado - dt;
    // escalera o soga al alcance: «saltar» (o ↑) sin moverse de lado la agarra
    const esc = this.escaleras.find(e => Math.abs(c.x - e.x) < 0.45 && c.y >= e.y0 - 0.3 && c.y < e.y1 - 0.2);
    this.cerca = null;
    if (esc && ((this.guardado > 0 && !dir) || entrada.arriba || (!c.enSuelo && this.guardado > 0))) {
      this.guardado = 0;
      return this.agarrarEscalera(esc);
    }
    // parado arriba de una escalera: ↓ la agarra para bajar
    const escArriba = c.enSuelo && entrada.abajo && this.escaleras.find(e => Math.abs(c.x - e.x) < 0.6 && Math.abs(c.y - e.y1) < 0.35);
    if (escArriba) { c.y = escArriba.y1 - 0.3; return this.agarrarEscalera(escArriba); }
    if (this.guardado > 0 && this.coyote > 0) {
      if (entrada.abajo && this.sobreToldo) {
        this.bajandoToldo = 0.25;
      } else if (!this.agachado || !this.mundo.choca(c.x - c.a / 2, c.y, c.x + c.a / 2, c.y + A.alto)) {
        this.agachado = false;
        this.deslizando = 0;
        c.h = A.alto;
        c.vy = A.salto;
        this.eventos.push('salto');
        this.p.animar('salto', { mezcla: 0.06, una_vez: true, velocidad: 1.6, desde: 0.12 });
      }
      this.guardado = 0;
      this.coyote = 0;
    }
    if (!entrada.saltar && c.vy > 0 && !this.cortado) { c.vy *= A.corteSalto; this.cortado = true; }
    if (c.enSuelo) this.cortado = false;
    c.vy = Math.max(c.vy - GRAVEDAD * dt, -VEL_CAIDA_MAX);
    this.bajandoToldo -= dt;

    // --- portal cercano: «usar» para meterse (y esconderse)
    const hallado = c.enSuelo ? this.puertas.find(([px, py]) => Math.abs(c.x - px) < 0.75 && Math.abs(c.y - py) < 0.3) : undefined;
    const portal = hallado?.[0];
    if (portal !== undefined && tomar('usar')) {
      this.estado = 'puerta';
      this.puerta = portal;
      this.entro = true;
      this.descubierto = false;
      this.agachado = false;
      c.h = A.alto;
      c.vx = 0;
      this.eventos.push('puerta');
      return this.actualizarPuerta(dt);
    }

    // --- empujar la caja: si camina contra ella en el suelo, la caja avanza (si puede).
    // Jalar: mantener «usar» pegado a la caja y caminar alejándose de ella.
    this.empujando = null;
    this.jalando = null;
    const caja = this.cajas.reduce((m, k) => (!m || Math.abs(k.c.x - c.x) < Math.abs(m.c.x - c.x) ? k : m), null);
    if (caja && c.enSuelo && caja.c.enSuelo && !this.agachado) {
      const ladoDer = caja.c.x - caja.c.a / 2 - (c.x + c.a / 2);   // caja a la derecha
      const ladoIzq = (c.x - c.a / 2) - (caja.c.x + caja.c.a / 2); // caja a la izquierda
      const misma = c.y < caja.c.y + caja.c.h - 0.3 && c.y + c.h > caja.c.y + 0.1;
      const pegadoDer = misma && ladoDer < 0.15 && ladoDer > -0.2, pegadoIzq = misma && ladoIzq < 0.15 && ladoIzq > -0.2;
      if (entrada.usar && dir && ((pegadoDer && dir < 0) || (pegadoIzq && dir > 0))) {
        this.jalando = caja;
        c.vx = dir * A.velocidadEmpujar;
      }
    }
    if (caja && c.enSuelo && dir && !this.agachado && caja.c.enSuelo) {
      const lado = dir > 0 ? caja.c.x - caja.c.a / 2 - (c.x + c.a / 2) : (c.x - c.a / 2) - (caja.c.x + caja.c.a / 2);
      const misma = c.y < caja.c.y + caja.c.h - 0.3 && c.y + c.h > caja.c.y + 0.1;
      if (lado < 0.06 && lado > -0.2 && misma) {
        caja.c.vx = dir * A.velocidadEmpujar;
        const antes = caja.c.x;
        mover(this.mundo, caja.c, dt, { subir: 0 });
        caja.c.vx = 0;
        if (Math.abs(caja.c.x - antes) > 0.0005) {
          this.empujando = caja;
          c.vx = dir * Math.min(Math.abs(c.vx), A.velocidadEmpujar);
          caja.mover?.();
        }
      }
    }

    // --- mover
    const antesSuelo = c.enSuelo, vyAntes = c.vy;
    const xAntes = c.x;
    const r = mover(this.mundo, c, dt, { atravesarToldos: this.bajandoToldo > 0 });
    if (this.jalando) {
      const cj = this.jalando.c;
      cj.vx = (c.x - xAntes) / dt;
      mover(this.mundo, cj, dt, { subir: 0 });
      cj.vx = 0;
      this.jalando.mover?.();
    }
    this.sobreToldo = r.suelo?.tipo === 'toldo';
    if (r.pared && !c.enSuelo && dir && Math.sign(dir) === (r.pared.x0 > c.x ? 1 : -1)) this.intentarBorde(r.pared, dir);
    if (!r.pared && !c.enSuelo && dir && c.vy < 3) {
      // borde justo delante aunque no haya choque exacto (ayuda a no «rozar» el borde)
      const x = c.x + dir * (c.a / 2 + 0.12);
      const s = this.mundo.choca(x - 0.05, c.y + 0.4, x + 0.05, c.y + A.alcanceBorde);
      if (s) this.intentarBorde(s, dir);
    }
    // tirolesa: en el aire, las manos llegan a la cuerda → colgarse
    if (!c.enSuelo) {
      for (const t of this.tirolesas) {
        if (c.x < Math.min(t.x0, t.x1) + 0.2 || c.x > Math.max(t.x0, t.x1) - 1) continue;
        const yCuerda = t.y0 + (t.y1 - t.y0) * (c.x - t.x0) / (t.x1 - t.x0);
        const manos = c.y + 1.95;
        if (Math.abs(manos - yCuerda) < 0.45) {
          this.estado = 'tirolesa';
          this.cuerda = t;
          this.vCuerda = Math.max(2.5, Math.abs(c.vx));
          this.agachado = false; c.h = A.alto;
          this.p.mirar(Math.sign(t.x1 - t.x0));
          this.p.animar('colgado', { mezcla: 0.15 });   // colgado de las manos; alcanzar() las pone en la cuerda
          this.eventos.push('trepar');
          return this.actualizarTirolesa(0);
        }
      }
    }
    // rampa: los pies sobre la ladera → resbalar hacia abajo
    this.enRampa = null;
    for (const r of this.rampas) {
      const xmin = Math.min(r.x0, r.x1), xmax = Math.max(r.x0, r.x1);
      if (c.x < xmin || c.x > xmax) continue;
      const yr = r.y0 + (r.y1 - r.y0) * (c.x - r.x0) / (r.x1 - r.x0);
      if (c.vy <= 0.5 && c.y <= yr + 0.12 && c.y >= yr - 0.7) {
        c.y = yr; c.vy = 0; c.enSuelo = true; this.enRampa = r;
        const bajada = Math.sign((r.y1 < r.y0 ? r.x1 - r.x0 : r.x0 - r.x1));
        const pend = Math.abs(r.y1 - r.y0) / Math.hypot(r.x1 - r.x0, r.y1 - r.y0);
        c.vx += bajada * GRAVEDAD * pend * dt * 0.8;
        c.vx = Math.max(-A.rampa, Math.min(A.rampa, c.vx));
        if (Math.sign(c.vx) !== bajada) c.vx *= 0.9;
        this.coyote = A.coyote;
        this.p.mirar(bajada);
        break;
      }
    }
    // toldo encima: saltando por debajo, Eliab se agarra del borde de la tela y sube (así siempre se puede volver arriba)
    if (!c.enSuelo && c.vy > -3 && this.bajandoToldo < -0.3) {
      for (const t of this.mundo.solidos) {
        if (t.tipo !== 'toldo' || t.inactivo) continue;
        if (c.x > t.x0 + 0.15 && c.x < t.x1 - 0.15 && c.y + c.h + 0.3 >= t.y0 && c.y < t.y1 - 0.4 &&
            !this.mundo.choca(c.x - c.a / 2, t.y1 + 0.01, c.x + c.a / 2, t.y1 + A.alto)) {
          this.estado = 'trepando';
          this.agachado = false;
          c.h = A.alto;
          this.trepar = { t: 0, x0: c.x, y0: c.y, x1: c.x + (this.p.mirando || 1) * 0.25, y1: t.y1 + 0.01, dur: 0.42 };
          c.vx = c.vy = 0;
          this.p.animar('borde', { mezcla: 0.08, una_vez: true, velocidad: this.p.duracion('borde') / 0.42 });
          this.eventos.push('trepar');
          return this.sincronizar();
        }
      }
    }
    if (c.enSuelo && !antesSuelo) {
      this.eventos.push('aterrizar');
      if (vyAntes < -9) this.aterrizaje = 0.18;
    }
    if (this.estado === 'trepando') return;

    // --- escondido: agachado y quieto (o casi) detrás de algo
    const enCobertura = c.enSuelo && c.y < 0.3 && this.sombras.some(z => c.x > z[0] && c.x < z[1]);
    this.escondido = this.agachado && enCobertura && Math.abs(c.vx) < 2.2;
    // qué se puede hacer aquí (para el aviso sobre Eliab)
    const junto = caja && Math.abs(c.x - caja.c.x) < caja.c.a / 2 + c.a / 2 + 0.35 && Math.abs(c.y - caja.c.y) < 0.5;
    const escCerca = this.escaleras.some(e => Math.abs(c.x - e.x) < 0.6 && c.y >= e.y0 - 0.3 && c.y < e.y1 - 0.2);
    this.cerca = portal !== undefined ? 'puerta' : junto ? 'caja' : enCobertura && !this.agachado ? 'cobertura' : escCerca ? 'escalera' : null;

    // --- animación
    if (dir && !this.jalando && !this.enRampa) this.p.mirar(dir);
    this.aterrizaje -= dt;
    const v = Math.abs(c.vx);
    if (this.enRampa) {
      this.p.animar('deslizar', { mezcla: 0.12 });
    } else if (!c.enSuelo) {
      if (this.p.actual !== this.p.acciones.salto || c.vy < 1) this.p.animar('aire', { mezcla: 0.25 });
    } else if (this.deslizando > 0) {
      this.p.animar('deslizar', { mezcla: 0.1 });
    } else if (this.empujando || (this.jalando && Math.abs(c.vx) > 0.1)) {
      if (this.jalando) this.p.mirar(Math.sign(this.jalando.c.x - c.x));
      this.p.animar('empujar', { mezcla: 0.15, velocidad: this.jalando ? -1.9 : 1.9 });   // pasos al ritmo del avance
    } else if (this.agachado) {
      this.p.animar(v > 0.2 ? 'agachado_andar' : 'agachado', { velocidad: v > 0.2 ? 1.4 : 1 });
    } else if (this.aterrizaje > 0) {
      this.p.animar('aterrizar', { mezcla: 0.05, una_vez: true, velocidad: 2.2, desde: 0.2 });
    } else if (v > A.velocidad + 0.4) {
      this.p.animar('correr', { velocidad: v / 7.0 });
    } else if (v > 0.4) {
      this.p.animar('trotar', { velocidad: Math.max(0.6, v / 4.6) });
    } else {
      this.p.animar('quieto', { mezcla: 0.25 });
    }
    // pasos (sonido)
    if (c.enSuelo && v > 0.5 && !this.agachado) {
      this.tiempoPaso -= dt * v;
      if (this.tiempoPaso <= 0) { this.eventos.push('paso'); this.tiempoPaso = 1.55; }
    }
    this.sincronizar();
  }

  // ¿Llegan las manos al borde de este sólido y hay sitio arriba? → subir.
  intentarBorde(s, dir) {
    const c = this.c, A = AJUSTES;
    const alturaBorde = s.y1 - c.y;
    if (alturaBorde < 0.55 || alturaBorde > A.alcanceBorde || c.vy > 4) return;
    const xArriba = dir > 0 ? s.x0 + c.a / 2 + 0.08 : s.x1 - c.a / 2 - 0.08;
    if (this.mundo.choca(xArriba - c.a / 2, s.y1 + 0.01, xArriba + c.a / 2, s.y1 + A.alto)) return;
    if (s.tipo !== 'solido') return;
    this.estado = 'trepando';
    this.agachado = false;
    c.h = A.alto;
    this.trepar = { t: 0, x0: c.x, y0: c.y, x1: xArriba, y1: s.y1 + 0.01, dur: 0.32 + alturaBorde * 0.14 };
    c.vx = c.vy = 0;
    this.p.mirar(dir);
    this.p.animar('borde', { mezcla: 0.08, una_vez: true, velocidad: this.p.duracion('borde') / this.trepar.dur });   // Mixamo: de colgado a agachado arriba
    this.eventos.push('trepar');
  }

  // Metido en un portal: oscuro y quieto, mirando a la calle. Sale con «usar», saltar o moviéndose.
  actualizarPuerta(dt) {
    const c = this.c;
    c.x += (this.puerta - c.x) * Math.min(1, dt * 10);
    this.z += (-1.0 - this.z) * Math.min(1, dt * 10);
    this.escondido = !this.descubierto;
    this.cerca = 'dentro';
    this.p.mirarCamara();
    this.p.animar('quieto', { mezcla: 0.2 });
    if (!this.entro && (tomar('usar') || tomar('saltar') || entrada.x)) {
      this.estado = 'normal';
      this.puerta = null;
      this.escondido = false;
      this.descubierto = false;
      this.p.mirar(entrada.x || 1);
      this.eventos.push('puerta');
    }
    this.sincronizar();
  }

  agarrarEscalera(e) {
    const c = this.c;
    this.estado = 'escalando';
    this.escalera = e;
    this.agachado = false; this.deslizando = 0;
    c.h = AJUSTES.alto; c.vx = 0; c.vy = 0;
    // escalera: de espaldas a la cámara; soga: de perfil, al lado de la soga y mirándola (misma animación)
    if (e.tipo === 'cuerda') {
      const libre = (l) => !this.mundo.choca(e.x + l * 0.3 - c.a / 2, c.y + 0.3, e.x + l * 0.3 + c.a / 2, c.y + c.h);
      const desde = Math.sign(c.x - e.x) || -this.p.mirando || -1;
      this.ladoSoga = libre(desde) || !libre(-desde) ? desde : -desde;
    } else this.ladoSoga = 0;
    if (this.ladoSoga) this.p.mirarPerfil(-this.ladoSoga); else this.p.mirarAtras();
    this.eventos.push('trepar');
    return this.actualizarEscalera(0);
  }

  // En la escalera: saltar (o ↑) sube, ↓ baja; saltar + ← → se suelta de un salto. Arriba del todo, se sube al borde.
  actualizarEscalera(dt) {
    const c = this.c, e = this.escalera, A = AJUSTES;
    c.x += (e.x + this.ladoSoga * 0.24 - c.x) * Math.min(1, dt * 12);
    if (this.ladoSoga) this.z += (ZSOGA - this.z) * Math.min(1, dt * 12);   // a la misma profundidad que la soga
    const sube = entrada.saltar || entrada.arriba, baja = entrada.abajo;
    const vel = this.ladoSoga ? A.treparSoga : A.trepar;
    const v = (sube ? vel : 0) - (baja ? vel : 0);
    const ny = c.y + v * dt;
    if (v > 0 && this.mundo.choca(c.x - c.a / 2, ny, c.x + c.a / 2, ny + c.h)) { /* techo */ } else c.y = ny;
    this.cerca = 'dentro_escalera';
    // animaciones de Mixamo (escalera y soga); su ritmo sigue a la velocidad con que sube o baja
    const soga = this.ladoSoga !== 0;
    const natural = soga ? A.ritmoSoga : A.ritmoEscalera;
    this.p.animar(soga ? 'soga' : 'escalera', { mezcla: 0.15, velocidad: v / natural * A.compasTrepar });
    const soltar = () => { this.estado = 'normal'; this.escalera = null; this.p.alcanzar(null); this.p.mirar(entrada.x || this.p.mirando || 1); };
    if (entrada.x && tomar('saltar')) {   // salto hacia un lado
      soltar(); c.vx = entrada.x * A.velocidad; c.vy = A.salto * 0.85; this.eventos.push('salto');
      this.p.animar('salto', { mezcla: 0.06, una_vez: true, velocidad: 1.6, desde: 0.12 });
    } else if (c.y >= e.y1 - 0.05 && sube) {      // arriba: subir al borde (hacia el lado donde hay piso)
      const lado = this.mundo.sueloEn(e.x + 0.65, e.y1 + 0.05, 0.3) ? 1 : this.mundo.sueloEn(e.x - 0.65, e.y1 + 0.05, 0.3) ? -1 : 0;
      c.y = e.y1 + 0.02; c.x = e.x + lado * 0.65; soltar(); c.vy = 0;
      if (lado) this.p.mirar(lado);
    } else if (c.y <= e.y0 && baja) {     // abajo del todo
      c.y = e.y0; soltar();
    } else if (entrada.x && !sube && !baja) {
      soltar();                            // se suelta y cae
    }
    tomar('saltar');
    this.sincronizar();
  }

  // Colgado de la tirolesa: baja por la cuerda acelerando; saltar se suelta con el impulso.
  actualizarTirolesa(dt) {
    const c = this.c, t = this.cuerda, A = AJUSTES;
    const dir = Math.sign(t.x1 - t.x0);
    const pend = Math.abs(t.y1 - t.y0) / Math.abs(t.x1 - t.x0);
    this.vCuerda = Math.min(A.tirolesa, this.vCuerda + (3 + pend * 18) * dt);
    c.x += dir * this.vCuerda * dt;
    const yCuerda = t.y0 + (t.y1 - t.y0) * (c.x - t.x0) / (t.x1 - t.x0);
    c.y = yCuerda - 1.95;
    c.vx = dir * this.vCuerda; c.vy = -pend * this.vCuerda;
    this.z += (ZCUERDA - this.z) * Math.min(1, dt * 12);   // debajo de la cuerda, no delante
    // las dos manos en la cuerda, una delante de la otra
    const enCuerda = (dx) => new THREE.Vector3(c.x + dx, t.y0 + (t.y1 - t.y0) * (c.x + dx - t.x0) / (t.x1 - t.x0), ZCUERDA);
    this.p.alcanzar({ r: enCuerda(dir * 0.13), l: enCuerda(-dir * 0.05) });
    const fin = dir > 0 ? c.x >= t.x1 - 0.4 : c.x <= t.x1 + 0.4;
    if (tomar('saltar') || fin) {
      this.estado = 'normal'; this.cuerda = null;
      this.p.alcanzar(null);
      c.vy = fin ? 2 : A.salto * 0.7;
      this.eventos.push('salto');
    }
    this.cerca = 'tirolesa';
    this.sincronizar();
  }

  actualizarTrepar(dt) {
    const t = this.trepar, c = this.c;
    t.t += dt;
    const k = Math.min(1, t.t / t.dur);
    // primero sube (las manos en el borde), después avanza sobre él
    const ky = Math.min(1, k / 0.7), kx = Math.max(0, (k - 0.45) / 0.55);
    c.y = t.y0 + (t.y1 - t.y0) * suave(ky);
    c.x = t.x0 + (t.x1 - t.x0) * suave(kx);
    if (k >= 1) {
      this.estado = 'normal';
      c.enSuelo = true;
      c.vx = entrada.x * AJUSTES.velocidad * 0.5;
      this.p.animar('quieto', { mezcla: 0.15 });
    }
    this.sincronizar();
  }

  sincronizar() {
    this.p.raiz.position.set(this.c.x, this.c.y, this.z);
  }
}

function acercar(v, objetivo, paso) {
  return v < objetivo ? Math.min(v + paso, objetivo) : Math.max(v - paso, objetivo);
}
function suave(t) { return t * t * (3 - 2 * t); }
