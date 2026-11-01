import { ESCALA_PERSONAJES } from './config.js';
const TACTIL = matchMedia('(pointer:coarse)').matches;
// Dibujo de las criaturas (sombras), los jefes y sus ataques (fase 2). Reemplaza al arte de EnemyPainter/BossArt
// de Sigrun con el arte de Codex (arte/enemigos, arte/jefes). La lógica, las cajas y los tiempos no cambian.
//  - Criaturas: dos poses (a = moverse, b = atacar) que miran a la izquierda; se reflejan según e.dir.
//  - Copias del jugador (mechas rivales) y soldados: la misma figura del motor como sombra con llamas oscuras.
//  - Jefes: una imagen con animación por código (respirar, inclinarse al cargar, destello al recibir daño, tinte).
import { rgb, argb, css, withAlpha, lerpColor, lrtb, rr, poly, circle, glowCircle, glowRect, line, clamp } from './dibujo.js';
import { CAJAS_CRIATURAS } from './arte_cajas.js';
import { ARTE_JEFES, marcoJefe, puntoJefe } from './anclajes.js';
import { PlayerPainter, HEROE_ALTO } from './jugador.js';
import { LANCE_WARN, LANCE_ON, DOG_SLEEPING, DOG_WAKING } from './entidades.js';
import { SERAPH_LANCE_HALF, PYLON_H, PYLON_W, REGENT_ID, sweepBand } from './combate.js';

const WHITE = rgb(255, 255, 255);
// Caja (x0, y0, x1, y1) del dibujo original dentro del lienzo 768×768 de los cuadros (herramientas/cortar_hoja_jefes.py).
const CAJA_CUADROS = {
  gran_ojo_envidia: [43, 42, 722, 723], goliat_sabueso: [43, 63, 726, 711], falso_angel: [50, 42, 717, 725], behemot: [43, 41, 725, 723],
  duda: [38, 43, 729, 727], desanimo: [71, 48, 721, 721], leviatan: [44, 52, 730, 718],
};
const cache = {};
function img(path) {
  if (!cache[path]) { const im = new Image(); im.src = path; cache[path] = im; }
  return cache[path];
}
const ready = (im) => im && im.complete && im.naturalWidth > 0;

/** Qué criatura dibuja cada enemigo común y a qué tamaño (alto visible = alto de la caja × alto). */
const CRIATURA = {
  walker: { img: 'mentirilla', alto: 1.25 },
  walker_heavy: { img: 'mentirilla', alto: 1.42, filtro: 'brightness(0.6) saturate(1.4) hue-rotate(-14deg)' },
  hopper: { img: 'serpentina', alto: 1.15 },
  turret: { img: 'ojo_envidia', alto: 1.2 },
  eye_drone: { img: 'murcielago_miedo', alto: 1.45, centro: true },
  scrap_dog: { img: 'sabueso', alto: 1.5 },
  mini_behemoth: { img: 'behemotito', alto: 1.35 },
};
/** Color del aura y de los ataques de cada jefe (sombra o fuego oscuro, no tecnología). */
const AURA = {
  crimson_over_eye: rgb(170, 220, 60), warden_goliath: rgb(230, 40, 50), seraph_engine: rgb(200, 170, 255),
  aegis_behemoth: rgb(255, 170, 50), rival_assault: rgb(80, 140, 255), rival_scout: rgb(170, 170, 190), regent_frame: rgb(60, 230, 200),
};

/** El cuerpo del jugador como sombra: todos los colores pasan a violeta casi negro según su luz. */
class SombraPainter extends PlayerPainter {
  constructor(tono) { super(); this.tono = tono; }
  col(c) {
    const l = (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
    const d = lerpColor(rgb(10, 4, 18), this.tono, l * 0.75);
    return this.flashWhite ? lerpColor(d, rgb(230, 220, 255), 0.7) : [d[0], d[1], d[2], c[3]];
  }
  lg(x0, y0, x1, y1, stops) { return super.lg(x0, y0, x1, y1, stops.map(([o, c]) => [o, this.col(c)])); }
  glow() { /* sin luces propias: la sombra brilla solo en los ojos */ }
}

// Filtros de canvas (contorno de luz, destello al recibir daño, enojo…) pintados UNA vez por imagen y guardados:
// aplicar g.filter en cada cuadro era lo que ponía lento el juego en computadora (con la cámara cercana, más aún).
const CACHE_FILTROS = new Map();
const MARGEN_FILTRO = 8;
function conFiltro(im, filtro) {
  if (!filtro) return null;
  let porImagen = CACHE_FILTROS.get(im);
  if (!porImagen) CACHE_FILTROS.set(im, porImagen = new Map());
  let c = porImagen.get(filtro);
  if (!c) {
    c = document.createElement('canvas');
    c.width = im.naturalWidth + MARGEN_FILTRO * 2; c.height = im.naturalHeight + MARGEN_FILTRO * 2;
    const x = c.getContext('2d'); x.filter = filtro; x.drawImage(im, MARGEN_FILTRO, MARGEN_FILTRO);
    porImagen.set(filtro, c);
  }
  return c;
}
/** Dibuja im en (x, y, w, h) con el filtro ya horneado (mismo resultado que g.filter + drawImage). */
function dibujarConFiltro(g, im, filtro, x, y, w, h) {
  const c = conFiltro(im, filtro);
  if (!c) { g.drawImage(im, x, y, w, h); return; }
  const kx = w / im.naturalWidth, ky = h / im.naturalHeight;
  g.drawImage(c, x - MARGEN_FILTRO * kx, y - MARGEN_FILTRO * ky, c.width * kx, c.height * ky);
}

export class PintorCriaturas {
  constructor() {
    this.sombraRival = new SombraPainter(rgb(110, 70, 170));
    this.sombraRoja = new SombraPainter(rgb(160, 40, 60));
  }

  // ------------------------------------------------------------------ enemigos comunes
  drawEnemy(g, e, s, time) {
    const beh = e.def.behavior;
    if (ESCALA_PERSONAJES !== 1 && !e.boss) {
      // Agranda el dibujo desde los pies (centro abajo de la caja); la caja de choque no cambia.
      const k = ESCALA_PERSONAJES, cx = e.x + e.w / 2, pie = e.y + e.h;
      g.save(); g.translate(cx, pie); g.scale(k, k); g.translate(-cx, -pie);
      this._dibujarEnemigo(g, e, s, time, beh); g.restore(); return;
    }
    this._dibujarEnemigo(g, e, s, time, beh);
  }

  _dibujarEnemigo(g, e, s, time, beh) {
    if (e.boss) { this.drawBoss(g, e, s, time); return; }
    if (beh === 'RIVAL') this.drawRival(g, e, s, time);
    else if (beh === 'SOLDIER') this.drawSoldier(g, e, time);
    else this.drawCreature(g, e, s, time);
    if (beh === 'DOG') this.drawDogMood(g, e, time);
    // Barra de vida discreta
    rr(g, e.x, e.y - 10, e.w, 4, 2, argb(173, 4, 8, 12));
    rr(g, e.x + 1, e.y - 9, Math.max(0, (e.w - 2) * (e.hp / e.maxHp)), 2, 1, rgb(170, 90, 255));
  }

  /** Imagen de la criatura con la misma escala y posición en sus dos poses (la «a» manda). */
  drawCreature(g, e, s, time) {
    const c = CRIATURA[e.def.id] ?? CRIATURA[{ WALKER: 'walker', HOPPER: 'hopper', TURRET: 'turret', DRONE: 'eye_drone', DOG: 'scrap_dog', BEHEMOTH: 'mini_behemoth' }[e.def.behavior]] ?? CRIATURA.walker;
    const beh = e.def.behavior, shotAge = e.def.shotInterval - e.shot;
    let pose = 'a';
    if (beh === 'WALKER' || beh === 'TURRET') pose = shotAge >= 0 && shotAge < 0.3 ? 'b' : 'a';
    else if (beh === 'HOPPER') pose = e.airborne ? 'b' : (shotAge >= 0 && shotAge < 0.3 ? 'b' : 'a');
    else if (beh === 'DRONE') pose = e.flashShot > 0 ? 'b' : 'a';
    else if (beh === 'DOG') pose = (e.dogState === 1 || e.flashShot > 0) ? 'b' : 'a';
    else if (beh === 'BEHEMOTH') pose = e.mini?.move === 'AEG_BARRAGE' ? 'b' : 'a';
    // Ciclo de movimiento de 4 cuadros (arte/enemigos_anim/ de Codex) en lugar de la pose fija «a»: los que caminan
    // avanzan el cuadro con la distancia recorrida; los que flotan o están fijos, con el tiempo. Si falta, pose «a».
    let im = img(`assets/criaturas/${c.img}_${pose}.webp`);
    if (pose === 'a' && !(beh === 'DOG' && e.sleeping)) {
      const anda = beh === 'WALKER' || beh === 'DOG' || beh === 'BEHEMOTH' || beh === 'HOPPER';
      const n = 1 + (Math.floor(anda ? Math.abs(e.stride || e.x) / 14 + e.phase * 4 : time * 7 + e.phase * 4) % 4 + 4) % 4;
      const cuadro = img(`assets/criaturas/${c.img}_mov${n}.webp`);
      if (ready(cuadro)) im = cuadro;
    }
    const base = CAJAS_CRIATURAS[`${c.img}_a`];
    const bw = base[2] - base[0], bh = base[3] - base[1];
    const k = e.h * c.alto / bh;
    const sleeping = beh === 'DOG' && e.sleeping;
    // Paso: rebote al caminar y algo de aplastamiento al aterrizar.
    const moving = beh === 'WALKER' || beh === 'DOG' || beh === 'BEHEMOTH' || (beh === 'HOPPER' && !e.airborne);
    const step = moving ? Math.abs(Math.sin((e.stride || e.x) * 0.09 + e.phase)) : 0;
    const bob = beh === 'DRONE' || beh === 'TURRET' ? Math.sin(time * 3 + e.phase) * 1.5 : -step * 2.5;
    const cx = e.x + e.w / 2, footY = c.centro ? e.y + e.h / 2 + (bh * k) / 2 : e.y + e.h;
    // Sombra en el suelo
    if (!c.centro) { g.fillStyle = css(argb(80, 10, 4, 18)); g.beginPath(); g.ellipse(cx, e.y + e.h + 2, bw * k * 0.32, 5, 0, 0, Math.PI * 2); g.fill(); }
    if (!ready(im)) { rr(g, e.x, e.y, e.w, e.h, 8, rgb(48, 30, 70)); return; }
    g.save();
    g.translate(cx, footY + bob);
    if (e.dir > 0) g.scale(-1, 1);
    if (sleeping) g.scale(1.05, 0.72);
    // Contorno de luz tenue: las sombras se leen sobre cualquier fondo, también los oscuros.
    // (en la imagen original, de 256: el contorno de 1,5 px en pantalla equivale a unos 3 px allí).
    const filtros = ['drop-shadow(0 0 3px rgba(205,175,255,0.85))'];
    if (c.filtro) filtros.push(c.filtro);
    if (e.flash > 0) filtros.push('brightness(2.4) saturate(0.4)');
    if (sleeping) filtros.push('brightness(0.7)');
    // (0,0) = centro inferior del recorte «a» de la pose.
    dibujarConFiltro(g, im, filtros.join(' '), -((base[0] + base[2]) / 2) * k, -base[3] * k, 256 * k, 256 * k);
    g.restore();
    // Escudo del Behemotito (para las flechas de frente).
    if (beh === 'BEHEMOTH' && e.mini && e.mini.shield > 0.05) this.drawPrideShield(g, e, e.mini.shield, time, 0.6);
    // La serpentina en el aire deja una estela de sombra.
    if (beh === 'HOPPER' && e.airborne) glowCircle(g, cx, e.y + e.h, 14, withAlpha(rgb(60, 200, 190), 0.25));
  }

  /** Escudo frontal de orgullo (Behemot y Behemotito): arco dorado opaco que para las flechas de frente. */
  drawPrideShield(g, e, k, time, size = 1) {
    const cx = e.x + e.w / 2 + e.dir * e.w * 0.48, cy = e.y + e.h * 0.55, r = e.h * 0.6 * size + 10;
    g.save(); g.globalCompositeOperation = 'lighter';
    const a0 = e.dir > 0 ? -1.1 : Math.PI - 1.1, a1 = a0 + 2.2;
    g.strokeStyle = css(withAlpha(rgb(255, 196, 90), 0.55 * k * (0.75 + 0.25 * Math.sin(time * 6))));
    g.lineWidth = 6; g.beginPath(); g.arc(cx - e.dir * r * 0.55, cy, r, a0, a1); g.stroke();
    g.strokeStyle = css(withAlpha(rgb(255, 240, 200), 0.6 * k)); g.lineWidth = 1.5; g.stroke();
    g.restore();
  }

  /** Llamas y humo oscuros alrededor de una figura de sombra. */
  shadowFlames(g, cx, top, bottom, w, time, seed, tono) {
    g.save();
    for (let i = 0; i < 9; i++) {
      const ph = (time * 1.6 + i / 9 + seed) % 1, x = cx + Math.sin(seed * 3 + i * 2.3) * w * 0.45, y = bottom - (bottom - top) * (0.15 + ph * 1.0);
      const r = (6 + (1 - ph) * 7) * (0.8 + 0.2 * Math.sin(time * 9 + i));
      g.fillStyle = css(argb(Math.trunc(110 * (1 - ph)), 14, 6, 22)); g.beginPath(); g.arc(x, y - ph * 10, r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const ph = (time * 2.2 + i / 7 + seed * 0.7) % 1, x = cx + Math.sin(seed * 5 + i * 1.9 + time * 3) * w * 0.4;
      const y = bottom - (bottom - top) * ph * 0.95, r = 5 * (1 - ph) + 2;
      circle(g, x, y, r, withAlpha(tono, 0.35 * (1 - ph)));
    }
    g.restore();
  }

  /** Copia del jugador (mecha rival): su misma figura hecha sombra, con llamas oscuras y ojos encendidos. */
  drawRival(g, e, s, time) {
    const red = e.def.id === 'red_rival', painter = red ? this.sombraRoja : this.sombraRival;
    const airborne = !s.world.solids.some((o) => o.overlapsR(e.x + 4, e.y + e.h + 1, e.w - 8, 3));
    // El dibujo del jugador ya viene a ESCALA_PERSONAJES y drawEnemy vuelve a escalar: se compensa una vez.
    const feetY = e.y + 40, k = (red ? 1 : 0.88) / ESCALA_PERSONAJES, cx = e.x + e.w / 2;
    const shotAge = e.def.shotInterval - e.shot;
    const b = { w: 34, h: 52, x: cx - 17, y: feetY - 52, face: e.dir >= 0 ? 1 : -1, grounded: !airborne, vx: airborne ? 0 : 95,
      vy: airborne ? -120 : 0, runPhase: e.x * 0.045, shotAnim: shotAge >= 0 && shotAge < 0.15 ? 1 - shotAge / 0.15 : 0 };
    b.cx = b.x + b.w / 2; b.cy = b.y + b.h / 2;
    const pl = new Proxy(b, { get: (t, key) => (key in t ? t[key] : 0) });
    const tono = red ? rgb(255, 60, 60) : rgb(170, 90, 255);
    this.shadowFlames(g, cx, feetY - 60 * k, feetY, 34 * k, time, e.phase, tono);
    painter.flashWhite = e.flash > 0;
    g.save(); g.translate(cx, feetY); g.scale(k, k); g.translate(-cx, -feetY);
    g.globalAlpha = 0.92;
    painter.draw(g, pl, time);
    g.restore();
    painter.flashWhite = false;
    // Ojos encendidos donde estaba la cara.
    const ex = cx + b.face * HEROE_ALTO * 0.07 * k, ey = feetY - HEROE_ALTO * 0.86 * k;  // ojos a la altura de la cara del dibujo
    glowCircle(g, ex, ey, 3.2, withAlpha(tono, 0.7)); circle(g, ex, ey, 1.1, rgb(255, 230, 240));
  }

  /** Soldado (humano en el original): su figura como sombra con llamas oscuras. */
  drawSoldier(g, e, time) {
    const p = this.sombraRoja, k = e.h / 46, f = e.dir >= 0 ? 1 : -1, cx = e.x + e.w / 2, tono = rgb(255, 80, 70);
    this.shadowFlames(g, cx, e.y, e.y + e.h, e.w, time, e.phase, tono);
    p.flashWhite = e.flash > 0; p.g = g;
    g.save(); g.translate(cx, e.y); g.scale(f * k, k); g.globalAlpha = 0.92;
    for (const ps of ['OUTLINE', 'FILL']) { p.pass = ps; soldado(p, time, e.stride); }
    g.restore();
    p.flashWhite = false;
    const ex = cx + f * 4 * k, ey = e.y + 8 * k;
    glowCircle(g, ex, ey, 3, withAlpha(tono, 0.7)); circle(g, ex, ey, 1.1, rgb(255, 230, 220));
    if (e.flashShot > 0) glowCircle(g, cx + f * 15.5 * k, e.y + 20 * k, 8 * e.flashShot / 0.1, withAlpha(tono, 0.7));
  }

  /** Encima del perro: «z» si duerme, «?» si nota al jugador, «!» al despertar. */
  drawDogMood(g, e, time) {
    const cx = e.x + e.w / 2;
    g.save(); g.textAlign = 'center'; g.font = 'bold 12px system-ui';
    if (e.dogState === DOG_SLEEPING) {
      const ph = e.x * 0.013;
      for (let i = 0; i < 3; i++) {
        const k = (time * 0.55 + ph + i / 3) % 1;
        g.font = `bold ${9 + k * 7}px system-ui`; g.fillStyle = css(argb(Math.trunc(Math.sin(k * Math.PI) * 200), 200, 180, 255));
        g.fillText('z', cx + 6 + k * 12 + Math.sin(time * 2 + i) * 2, e.y + 12 - k * 30);
      }
      if (e.alert > 0.05) { g.font = 'bold 22px system-ui'; g.fillStyle = css(argb(e.alert * 255, 255, 214, 90)); g.fillText('?', cx - 10, e.y - 8 - Math.sin(time * 8) * 2); }
    } else if (e.dogState === DOG_WAKING) {
      g.font = 'bold 26px system-ui'; g.fillStyle = css(rgb(255, 70, 60)); g.fillText('!', cx, e.y - 10 - Math.min(10, Math.max(0, e.dogT) * 30));
    }
    g.restore();
  }

  // ------------------------------------------------------------------ jefes
  drawBoss(g, e, s, time) {
    const a = ARTE_JEFES[e.def.id], st = e.boss, m = marcoJefe(e);
    if (!a || !m) { rr(g, e.x, e.y, e.w, e.h, 12, rgb(40, 20, 60)); return; }
    // Ciclo de 4 cuadros del jefe (arte/jefes_anim/, alineados con la imagen original); si falta, la imagen fija.
    const cuadroJefe = img(`assets/jefes/${a.img}_mov${1 + (Math.floor(time * 6 + (e.phase || 0) * 4) % 4 + 4) % 4}.webp`);
    const im = ready(cuadroJefe) ? cuadroJefe : img(`assets/jefes/${a.img}.webp`), aura = AURA[e.def.id] ?? rgb(170, 90, 255);
    const cx = m.x + m.w / 2, bottom = m.y + m.h;
    // Sombra y aura (más intensa al cargar un ataque, roja al límite).
    if (a.pie) { g.fillStyle = css(argb(90, 8, 4, 14)); g.beginPath(); g.ellipse(e.x + e.w / 2, st.groundY + e.h + 3, e.w * 0.5, 9, 0, 0, Math.PI * 2); g.fill(); }
    const charge = st.charge ?? 0, pulse = 0.5 + 0.5 * Math.sin(time * 5);
    const auraCol = st.desperate ? lerpColor(aura, rgb(255, 40, 40), 0.5 + 0.5 * pulse) : aura;
    glowCircle(g, cx, m.y + m.h * 0.55, m.w * 0.45, withAlpha(auraCol, 0.08 + 0.18 * charge + (st.enraged ? 0.06 : 0)));
    if (!ready(im)) return;
    // Animación: respirar, inclinarse hacia delante al cargar, sacudida al recibir daño; aturdido = agachado.
    const breathe = 1 + Math.sin(time * 2.2 + e.phase) * 0.015;
    const lean = charge * 0.06 * (e.dir > 0 ? 1 : -1);
    const stunned = st.move === 'AEG_STUN' || st.move === 'RG_STUN';
    const shakeX = e.flash > 0 ? (Math.random() - 0.5) * 6 : 0;
    g.save();
    g.translate(cx + shakeX, bottom);
    g.rotate(lean);
    g.scale(e.dir > 0 ? -1 : 1, (stunned ? 0.86 : breathe));
    const filtros = [];
    if (e.flash > 0) filtros.push('brightness(2.2) saturate(0.5)');
    if (st.enraged && !stunned) filtros.push('saturate(1.35) contrast(1.08)');
    if (stunned) filtros.push('brightness(0.75)');
    if (im === cuadroJefe && CAJA_CUADROS[a.img]) {
      // Los cuadros de animación son lienzos de 768 con margen; la caja del dibujo original va justo sobre el marco
      // (antes se estiraba el lienzo entero y el jefe quedaba flotando sobre el suelo).
      const [b0, b1, b2] = CAJA_CUADROS[a.img], k = m.w / (b2 - b0);
      dibujarConFiltro(g, im, filtros.join(' '), -m.w / 2 - b0 * k, -m.h - b1 * k, im.naturalWidth * k, im.naturalHeight * k);
    } else dibujarConFiltro(g, im, filtros.join(' '), -m.w / 2, -m.h, m.w, m.h);
    g.restore();
    // Brillo del punto de ataque al cargar (ojo, boca, arma).
    const nombre = Object.keys(a.puntos)[0], pt = puntoJefe(e, nombre);
    if (pt && charge > 0.02) {
      glowCircle(g, pt[0], pt[1], 8 + 22 * charge, withAlpha(auraCol, 0.25 + 0.4 * charge));
      glowCircle(g, pt[0], pt[1], 3 + 6 * charge, withAlpha(WHITE, 0.5 * charge));
    }
    // Escudo de orgullo del Behemot y cúpula del Leviatán entre sus pilares.
    if (e.def.id === 'aegis_behemoth' && st.shield > 0.05) this.drawPrideShield(g, e, st.shield, time);
    if (e.def.id === REGENT_ID && st.shield > 0.05) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const r = Math.max(m.w, m.h) * 0.55;
      const gr = g.createRadialGradient(cx, m.y + m.h * 0.55, r * 0.6, cx, m.y + m.h * 0.55, r);
      gr.addColorStop(0, css(withAlpha(aura, 0))); gr.addColorStop(1, css(withAlpha(aura, 0.28 * st.shield * (0.8 + 0.2 * pulse))));
      g.fillStyle = gr; g.beginPath(); g.arc(cx, m.y + m.h * 0.55, r, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }

  /** Lo que se dibuja de los jefes encima del escenario: marcas, golpes, rayos, lanzas, barrido, enlace. */
  drawBossAttacks(g, s, time) {
    for (const bo of [s.boss, s.partner]) {
      const st = bo?.boss; if (!st) continue;
      const fy = st.groundY + bo.h, regent = bo.def.id === REGENT_ID;
      for (const wv of st.warnings) {
        if (regent) this.drawFist(g, wv[0], fy, wv[1], time);
        const a = 0.55 + 0.45 * Math.sin(time * 22);
        g.fillStyle = css(withAlpha(rgb(255, 60, 50), 0.28 * a)); g.beginPath(); g.ellipse(wv[0], fy, 34, 8, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = css(withAlpha(rgb(255, 90, 70), a)); g.lineWidth = 2.5; g.beginPath(); g.ellipse(wv[0], fy, 26, 5, 0, 0, Math.PI * 2); g.stroke();
        line(g, wv[0], fy - 60, wv[0], fy - 12, withAlpha(rgb(255, 90, 70), a), 2.5);
      }
    }
    const bo = s.boss, st = bo?.boss;
    if (bo && st && !bo.dead) {
      if (bo.def.id === 'crimson_over_eye') { const pt = puntoJefe(bo, 'ojo') ?? [bo.x + bo.w / 2, bo.y + bo.h * 0.52]; this.drawEyeBeam(g, pt[0], pt[1], st, time, rgb(170, 230, 40)); }
      if (bo.def.id === 'seraph_engine') { const [x, y] = s.seraphEye(bo); this.drawEyeBeam(g, x, y, st, time, rgb(200, 160, 255)); }
    }
    if (bo && st) this.drawLances(g, st, st.groundY + bo.h, time, bo.def.id === REGENT_ID ? rgb(60, 230, 200) : rgb(200, 170, 255));
    if (bo && st && !bo.dead && bo.def.id === REGENT_ID) this.drawSweep(g, bo, st, time);
    for (const b of [s.boss, s.partner]) {
      const bs = b?.boss;
      if (b && bs && !b.dead && bs.move === 'EL_DASH' && bs.step === 0) this.drawDashWarning(g, b, bs, time);
    }
    if (s.linkState !== 0) this.drawLink(g, s, time);
  }

  /** Rayo de un jefe (envidia: verde enfermizo; falso ángel: luz violeta falsa): aviso, fijado y haz. */
  drawEyeBeam(g, ex, ey, st, time, col) {
    if (st.beamState <= 0) return;
    const len = 1600, tx = ex + Math.cos(st.beamAng) * len, ty = ey + Math.sin(st.beamAng) * len;
    g.save(); g.lineCap = 'round';
    if (st.beamState === 1) { g.setLineDash([8, 8]); line(g, ex, ey, tx, ty, withAlpha(col, 0.25 + 0.35 * st.charge), 1.5); }
    else if (st.beamState === 2) line(g, ex, ey, tx, ty, withAlpha(col, 0.5 + 0.5 * Math.sin(time * 50)), 3);
    else {
      line(g, ex, ey, tx, ty, argb(150, 12, 4, 20), 30 + 6 * Math.sin(time * 60));
      g.globalCompositeOperation = 'lighter';
      line(g, ex, ey, tx, ty, withAlpha(col, 0.35), 34 + 6 * Math.sin(time * 60));
      line(g, ex, ey, tx, ty, withAlpha(col, 0.8), 14);
      g.globalCompositeOperation = 'source-over';
      line(g, ex, ey, tx, ty, lerpColor(col, WHITE, 0.6), 4);
    }
    g.restore();
  }

  /** Lanzas: aviso parpadeante y luego la columna (violeta del falso ángel, verde azulada del Leviatán). */
  drawLances(g, st, fy, time, col) {
    const hi = lerpColor(col, WHITE, 0.45), half = SERAPH_LANCE_HALF;
    for (const l of st.lances) {
      const x = l[0], t = l[1];
      if (t < 0) continue;
      if (t < LANCE_WARN) {
        const k = t / LANCE_WARN, a = (0.35 + 0.65 * k) * (0.6 + 0.4 * Math.sin(time * (14 + k * 20)));
        lrtb(g, x - half, 0, x + half, fy, withAlpha(col, 0.1 + 0.12 * k));
        line(g, x - half, 0, x - half, fy, withAlpha(hi, a), 2); line(g, x + half, 0, x + half, fy, withAlpha(hi, a), 2);
        g.strokeStyle = css(withAlpha(hi, a)); g.lineWidth = 2; g.beginPath(); g.ellipse(x, fy, half + 8, 6, 0, 0, Math.PI * 2); g.stroke();
      } else {
        const k = clamp((t - LANCE_WARN) / LANCE_ON, 0, 1), a = 1 - k * k;
        lrtb(g, x - half * 0.9, 0, x + half * 0.9, fy, argb(120 * a, 12, 4, 20));
        glowRect(g, x - half * 1.8, 0, x + half * 1.8, fy, withAlpha(col, 0.35 * a));
        glowRect(g, x - half, 0, x + half, fy, withAlpha(hi, 0.85 * a));
        lrtb(g, x - half * 0.35, 0, x + half * 0.35, fy, withAlpha(WHITE, 0.9 * a));
        g.fillStyle = css(withAlpha(hi, 0.6 * a)); g.beginPath(); g.ellipse(x, fy - 1, half * 2.4, 9, 0, 0, Math.PI * 2); g.fill();
      }
    }
  }

  /** Golpe de sombra del Leviatán cayendo sobre su marca (left = segundos que faltan). */
  drawFist(g, x, fy, left, time) {
    if (left > 0.75) return;
    const k = 1 - left / 0.75, y = fy - 40 - (1 - k * k) * 640, col = rgb(60, 230, 200);
    glowRect(g, x - 14, y - 180, x + 14, y, withAlpha(col, 0.3));
    glowCircle(g, x, y, 40, withAlpha(col, 0.45));
    poly(g, rgb(6, 20, 22), x - 30, y - 34, x + 30, y - 34, x + 34, y + 10, x + 18, y + 28, x - 18, y + 28, x - 34, y + 10);
    poly(g, rgb(20, 110, 100), x - 26, y - 30, x + 26, y - 30, x + 29, y + 8, x + 15, y + 24, x - 15, y + 24, x - 29, y + 8);
    for (let i = -1; i <= 1; i++) poly(g, rgb(200, 255, 240), x + i * 14 - 4, y + 12, x + i * 14 + 4, y + 12, x + i * 14, y + 30);
  }

  /** Barrido del Leviatán: aviso (banda baja o alta) y luego el chorro de sombra desde su pecho. */
  drawSweep(g, bo, st, time) {
    if (st.beamState === 0) return;
    const fy = st.groundY + bo.h, [top, bot] = sweepBand(fy, st.sweepHigh);
    const sx = bo.x + bo.w / 2 + bo.dir * bo.w * 0.2, ex = bo.dir > 0 ? bo.max + bo.w + 400 : bo.min - 400;
    const l = Math.min(sx, ex), r = Math.max(sx, ex), col = rgb(60, 230, 200);
    if (st.beamState === 1) {
      lrtb(g, l, top, r, bot, withAlpha(col, 0.08 + 0.1 * st.charge));
      g.save(); g.setLineDash([8, 8]);
      const a = withAlpha(col, 0.4 + 0.5 * st.charge * (0.6 + 0.4 * Math.sin(time * 30)));
      line(g, l, top, r, top, a, 2); line(g, l, bot, r, bot, a, 2);
      g.restore();
    } else {
      const mid = (top + bot) / 2, hh = (bot - top) / 2;
      lrtb(g, l, mid - hh * 1.2, r, mid + hh * 1.2, argb(130, 6, 20, 22));
      glowRect(g, l, mid - hh * 1.6, r, mid + hh * 1.6, withAlpha(col, 0.35));
      glowRect(g, l, mid - hh, r, mid + hh, withAlpha(col, 0.8));
      lrtb(g, l, mid - hh * 0.3, r, mid + hh * 0.3, rgb(220, 255, 245));
    }
  }

  drawDashWarning(g, bo, st, time) {
    const fy = st.groundY + bo.h, from = bo.x + bo.w / 2, to = st.toX + bo.w / 2, dir = to >= from ? 1 : -1;
    let x = from, i = 0;
    while ((to - x) * dir > 0) {
      const a = (0.35 + 0.5 * st.charge) * (0.5 + 0.5 * Math.sin(time * 16 - i * 0.9));
      line(g, x, fy - 16, x + dir * 12, fy - 8, withAlpha(rgb(255, 70, 80), a), 3); line(g, x + dir * 12, fy - 8, x, fy, withAlpha(rgb(255, 70, 80), a), 3);
      x += dir * 34; i++;
    }
  }

  /** Enlace de sombra entre la Duda y el Desánimo: aviso discontinuo y luego el rayo. */
  drawLink(g, s, time) {
    const l = s.link, col = rgb(110, 140, 255);
    g.save(); g.lineCap = 'round';
    if (s.linkState === 1) { g.setLineDash([8, 8]); line(g, l[0], l[1], l[2], l[3], withAlpha(col, 0.45 + 0.45 * Math.sin(time * 24)), 2); }
    else {
      line(g, l[0], l[1], l[2], l[3], argb(140, 8, 6, 22), 26);
      g.globalCompositeOperation = 'lighter';
      line(g, l[0], l[1], l[2], l[3], withAlpha(col, 0.35), 30 + 5 * Math.sin(time * 50));
      line(g, l[0], l[1], l[2], l[3], withAlpha(col, 0.85), 14);
      g.globalCompositeOperation = 'source-over';
      line(g, l[0], l[1], l[2], l[3], rgb(225, 230, 255), 4);
    }
    g.restore();
    for (const [x, y] of [[l[0], l[1]], [l[2], l[3]]]) glowCircle(g, x, y, 12 + 4 * Math.sin(time * 20), withAlpha(col, 0.5));
  }

  /** Pilares de sombra del Leviatán (fase 3): obeliscos oscuros con núcleo verde azulado y cordón hasta él. */
  drawPylons(g, bo, st, time) {
    const fy = st.groundY + bo.h, H = PYLON_H, W = PYLON_W, col = rgb(60, 230, 200);
    const chestX = bo.x + bo.w / 2, chestY = bo.y + bo.h * 0.38;
    for (const py of st.pylons) {
      const x = py[0], alive = py[1] > 0, rise = py[3], top = fy - H * rise;
      if (!alive) {
        poly(g, rgb(14, 12, 20), x - W / 2, fy, x - W / 2 + 6, fy - 30, x - 4, fy - 22, x + 8, fy - 40, x + W / 2, fy - 20, x + W / 2, fy);
        glowCircle(g, x, fy - 20, 20, withAlpha(col, 0.15 + 0.1 * Math.sin(time * 9 + x)));
        continue;
      }
      if (rise >= 1) {
        const mx = (x + chestX) / 2, my = Math.min(top, chestY) - 90;
        g.save(); g.lineCap = 'round';
        g.strokeStyle = css(argb(140, 8, 20, 22)); g.lineWidth = 10; g.beginPath(); g.moveTo(x, top + 10); g.quadraticCurveTo(mx, my, chestX, chestY); g.stroke();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = css(withAlpha(col, 0.25 + 0.1 * Math.sin(time * 12))); g.lineWidth = 12; g.stroke();
        g.globalCompositeOperation = 'source-over';
        g.strokeStyle = css(withAlpha(rgb(200, 255, 245), 0.8)); g.lineWidth = 3; g.stroke();
        g.restore();
      }
      const hit = py[2] > 0;
      poly(g, rgb(6, 6, 12), x - W / 2 - 3, fy, x - W / 2 + 2, top + 20, x, top - 4, x + W / 2 - 2, top + 20, x + W / 2 + 3, fy);
      poly(g, hit ? WHITE : rgb(28, 22, 40), x - W / 2, fy, x - W / 2 + 4, top + 22, x, top, x + W / 2 - 4, top + 22, x + W / 2, fy);
      poly(g, rgb(48, 40, 66), x - W / 2 + 4, fy, x - W / 2 + 7, top + 24, x - 4, top + 8, x - 4, fy);
      const pulse = 0.7 + 0.3 * Math.sin(time * 8 + x), cy = top + H * 0.35;
      glowCircle(g, x, cy, 24, withAlpha(col, 0.4 * pulse));
      poly(g, col, x, cy - 14, x + 8, cy, x, cy + 14, x - 8, cy);
      poly(g, rgb(220, 255, 245), x, cy - 6, x + 3, cy, x, cy + 6, x - 3, cy);
      const ratio = clamp(py[1] / 10, 0, 1);
      rr(g, x - 26, top - 18, 52, 6, 2, argb(173, 4, 8, 12)); rr(g, x - 25, top - 17, 50 * ratio, 4, 1.5, col);
    }
  }

  // ------------------------------------------------------------------ proyectiles enemigos: sombra y fuego oscuro
  drawEnemyBullet(g, b, time) {
    const c = b.color;
    switch (b.kind) {
      case 'MISSILE': return this.darkFireball(g, b, c, time);
      case 'SHOCKWAVE': return this.darkWave(g, b, c, time);
      case 'GRENADE': return this.darkGrenade(g, b, c);
      case 'SHARD': return this.darkShard(g, b, c);
      default: return this.darkOrb(g, b, c, time);
    }
  }
  /** Bola de sombra: núcleo negro violeta, borde y halo del color del enemigo, estela. */
  darkOrb(g, b, c, time) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.max(b.w, b.h) / 2 + 1;
    const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp;
    for (let i = 3; i >= 1; i--) circle(g, cx - ux * i * r * 0.9, cy - uy * i * r * 0.9, r * (1 - i * 0.2), argb(70 - i * 15, 20, 8, 30));
    glowCircle(g, cx, cy, r * 2, withAlpha(c, 0.3));
    circle(g, cx, cy, r + 1.2, withAlpha(c, 0.9));
    circle(g, cx, cy, r * 0.75, rgb(18, 6, 26));
    glowCircle(g, cx - r * 0.25, cy - r * 0.25, r * 0.3, withAlpha(lerpColor(c, WHITE, 0.5), 0.7 + 0.3 * Math.sin(time * 30 + cx)));
  }
  /** Fuego oscuro que cae (antes misiles): bola negra con llamas del color del ataque. */
  darkFireball(g, b, c, time) {
    const cx = b.x + b.w / 2, by = b.y + b.h - 6;
    for (let i = 0; i < 6; i++) {
      const k = i / 6;
      glowCircle(g, cx + Math.sin(time * 20 + i) * 3, by - 8 - k * 34, 10 * (1 - k * 0.7), withAlpha(lerpColor(c, rgb(120, 30, 160), k), 0.55 * (1 - k)));
    }
    glowCircle(g, cx, by, 16, withAlpha(c, 0.45));
    circle(g, cx, by, 8.5, rgb(16, 6, 22)); circle(g, cx - 2, by - 2, 3, withAlpha(lerpColor(c, WHITE, 0.4), 0.9));
  }
  /** Onda de sombra que corre por el suelo. */
  darkWave(g, b, c, time) {
    const dir = b.vx >= 0 ? 1 : -1, front = dir > 0 ? b.x + b.w : b.x, back = dir > 0 ? b.x - 10 : b.x + b.w + 10, bottom = b.y + b.h;
    glowCircle(g, (front + back) / 2, b.y + b.h * 0.6, b.w * 0.8, withAlpha(c, 0.3));
    poly(g, rgb(16, 6, 24), back, bottom, front, bottom, front - dir * 6, b.y + 2, (front + back) / 2, b.y + b.h * 0.55);
    poly(g, withAlpha(c, 0.9), back + dir * 8, bottom, front - dir * 2, bottom, front - dir * 7, b.y + 8);
    for (let i = 0; i < 3; i++) circle(g, back - dir * (6 + i * 8), bottom - 6 - Math.sin(time * 15 + i) * 3, 4 - i, argb(120 - i * 30, 30, 12, 44));
  }
  darkGrenade(g, b, c) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    glowCircle(g, cx, cy, b.w, withAlpha(c, 0.3));
    circle(g, cx, cy, b.w / 2 + 1.5, rgb(6, 4, 12)); circle(g, cx, cy, b.w / 2, rgb(28, 14, 44));
    circle(g, cx + 2, cy - 3, 2.5, withAlpha(c, Math.sin(b.life * 40) > 0 ? 1 : 0.3));
  }
  darkShard(g, b, c) {
    g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); g.rotate(Math.atan2(b.vy, b.vx));
    g.save(); g.globalCompositeOperation = 'lighter'; poly(g, withAlpha(c, 0.35), -14, 0, 0, -8, 16, 0, 0, 8); g.restore();
    poly(g, rgb(10, 4, 16), -11, 0, 0, -5.5, 13, 0, 0, 5.5);
    poly(g, c, -9, 0, 0, -4, 11, 0, 0, 4);
    poly(g, lerpColor(c, WHITE, 0.6), -2, 0, 0, -1.6, 9, 0, 0, 1.6);
    g.restore();
  }
}

/** Figura del soldado (EnemyPainter.soldier) dibujada con el kit del jugador; dibujada para 46 de alto. */
function soldado(p, time, stride) {
  const s = Math.sin(stride * 0.16), breathe = Math.sin(time * 3) * 0.4;
  const S = rgb(120, 110, 100), S_DK = rgb(70, 64, 60), S_HI = rgb(160, 150, 140), M = rgb(110, 116, 128), M_DK = rgb(60, 64, 74), M_BK = rgb(30, 32, 40);
  const leg = (hx, hy, th, back) => {
    const g = p.g; g.save(); g.translate(hx, hy); g.rotate(th);
    p.rrect(-2.4, -1, 2.4, 9, 1.8); p.fill(back ? S_DK : S);
    g.translate(0, 8.5); g.rotate(-th * 0.6);
    p.rrect(-2.2, -0.5, 2.2, 8, 1.6); p.fill(back ? S_DK : S_HI);
    p.poly(-3, 7, 4.5, 7, 5, 9, -3, 9); p.fill(M_BK);
    g.restore();
  };
  leg(-2, 29, -s * 0.5, true);
  p.rrect(-10, 15 + breathe, -4, 28 + breathe, 2); p.fill(S_DK);
  p.poly(-6, 13 + breathe, 5, 13 + breathe, 6.5, 22, 4.5, 31, -5.5, 31, -6.5, 22); p.fill(S);
  p.poly(-4.5, 15 + breathe, 3.5, 15 + breathe, 4.5, 22, -4.5, 22); p.detail(S_HI);
  p.stick(-1, 17 + breathe, 7, 21, 3.2, S_DK);
  p.rrect(-3, 18.5, 13, 22, 1); p.fill(M_DK);
  p.rrect(8, 19, 16, 21, 0.6); p.fill(M_BK);
  p.rrect(1, 22, 4, 26, 0.6); p.fill(M_BK);
  p.stick(2, 15 + breathe, 3.5, 21, 3.6, S);
  p.circle(2, 15 + breathe, 2.8); p.fill(S_HI);
  p.circle(0.5, 8 + breathe, 6.2); p.fill(S);
  p.poly(-6, 8 + breathe, 7, 8 + breathe, 7.5, 10.5 + breathe, -5, 11 + breathe); p.fill(S_DK);
  leg(2, 29, s * 0.5, false);
}
