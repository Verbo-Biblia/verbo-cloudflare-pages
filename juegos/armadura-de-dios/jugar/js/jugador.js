// Dibujo del protagonista (port de render/PlayerPainter.kt + SpriteKit.kt): misma forma, poses y animación.
// Colores: «armadura de luz» (pedido de Juan). Para cambiarlos basta con editar ARMADURA_DE_LUZ.
import { Balance, AIM_PIVOT_X, AIM_ROT_DEG, ESCALA_PERSONAJES } from './config.js';
import { rgb, argb, css, withAlpha, lerpColor } from './dibujo.js';
import { POSES_HEROE } from './heroe_datos.js';

// Poses del protagonista dibujadas por Codex (arte/heroe/), en el mismo pixel art del escenario. Mismo lienzo y
// misma escala en todas: los pies están al 92 % del alto, así que se anclan ahí y se usa una sola escala.
const HEROE_IMG = Object.fromEntries(Object.keys(POSES_HEROE).map((k) => { const im = new Image(); im.src = `assets/heroe/${k}.webp`; return [k, im]; }));
export const HEROE_ALTO = 86 * ESCALA_PERSONAJES;  // Juan: más alto que en Sigrun, a la medida de las casas y los objetos
const  HEROE_ESCALA = HEROE_ALTO / POSES_HEROE.quieto[3], HEROE_PIES = 0.922;
const listo = (im) => im && im.complete && im.naturalWidth > 0;

/** Paleta del héroe (equivale a MechaColors). Blanco perla y plata, dorado, celeste. */
export const ARMADURA_DE_LUZ = {
  // Armadura usada (Juan: el blanco puro se veía demasiado limpio sobre los fondos): hueso envejecido, acero gastado.
  whiteHi: rgb(222, 212, 188), white: rgb(196, 184, 158), whiteShade: rgb(140, 126, 102),   // blanco hueso oxidado
  metalHi: rgb(176, 174, 166), metal: rgb(128, 128, 124), metalShade: rgb(88, 88, 88),      // acero gastado
  metalDark: rgb(62, 60, 62), metalBlack: rgb(34, 32, 34),
  light: rgb(110, 210, 255), lightHi: rgb(230, 248, 255), lightGlow: argb(200, 120, 214, 255), lightDeep: rgb(26, 92, 138), // celeste
  accent: rgb(255, 206, 84), accentGlow: argb(190, 255, 200, 80),                            // dorado
  gold: rgb(170, 122, 56), goldHi: rgb(208, 164, 92),                                        // bronce (antes oro brillante)
  visor: [rgb(232, 250, 255), rgb(124, 212, 255), rgb(40, 126, 196), rgb(18, 70, 120)],
  flameCore: argb(250, 255, 252, 232), flameMid: argb(210, 255, 204, 96),                    // propulsión dorado-blanca
  wingA: argb(190, 255, 236, 170), wingB: argb(0, 255, 214, 120), wingLine: argb(210, 255, 246, 210),
};

const OUTLINE = rgb(7, 11, 18);
const EDGE = argb(185, 9, 13, 22);
const FLASH = rgb(250, 252, 255);
const THIGH = 7.5, SHIN = 6.8, BOOT = 3.4, STAND_HIP = 17.6;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class PlayerPainter {
  constructor(k = ARMADURA_DE_LUZ) {
    this.k = k; this.pass = 'FILL'; this.tint = rgb(255, 255, 255); this.flashWhite = false; this.outlineW = 1.25;
    this.path = new Path2D();
    this.bt = 0; this.bk = 0; this.bf = 0; this.ft = 0; this.fk = 0; this.ff = 0;
    this.hipY = -STAND_HIP; this.upperDy = 0; this.lean = 0; this.sway = 0; this.recoil = 0;
  }

  // ---------------- base SpriteKit
  col(c) { return this.flashWhite ? lerpColor(c, FLASH, 0.82) : c; }
  // Igual que CornerPathEffect(2.2f) de SpriteKit: cada esquina se recorta hasta 2,2 unidades por lado (o media
  // arista si es más corta) y se une con una curva que pasa cerca del vértice. Sin esto el casco y las piezas salen
  // en punta y el personaje cambia de forma.
  poly(...pts) {
    const n = pts.length / 2, p = new Path2D(), R = 2.2;
    const cut = (i, j) => {
      const x = pts[i * 2], y = pts[i * 2 + 1], dx = pts[j * 2] - x, dy = pts[j * 2 + 1] - y, d = Math.hypot(dx, dy) || 1, r = Math.min(R, d / 2);
      return [x + dx / d * r, y + dy / d * r];
    };
    for (let i = 0; i < n; i++) {
      const prev = (i + n - 1) % n, next = (i + 1) % n, a = cut(i, prev), b = cut(i, next);
      if (i === 0) p.moveTo(a[0], a[1]); else p.lineTo(a[0], a[1]);
      p.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], b[0], b[1]);
    }
    p.closePath(); this.path = p;
  }
  rrect(l, t, r, b, rad) { const p = new Path2D(); p.roundRect(l, t, r - l, b - t, Math.min(rad, (r - l) / 2, (b - t) / 2)); this.path = p; }
  circle(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); this.path = p; }
  fill(color, gradient = null, edge = true) {
    const g = this.g;
    if (this.pass === 'OUTLINE' || this.pass === 'GHOST') {
      const c = this.pass === 'GHOST' ? this.tint : OUTLINE;
      g.fillStyle = css(c); g.strokeStyle = css(c); g.lineWidth = this.outlineW * 2; g.lineJoin = 'round';
      g.fill(this.path); g.stroke(this.path);
      return;
    }
    g.fillStyle = gradient && !this.flashWhite ? gradient : css(this.col(color));
    g.fill(this.path);
    if (edge) { g.strokeStyle = css(EDGE); g.lineWidth = 0.75; g.lineJoin = 'round'; g.stroke(this.path); }
  }
  detail(color) { if (this.pass !== 'FILL') return; this.g.fillStyle = css(this.col(color)); this.g.fill(this.path); }
  seam(x1, y1, x2, y2, color, w = 0.7) {
    if (this.pass !== 'FILL') return;
    const g = this.g; g.strokeStyle = css(this.col(color)); g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  stick(x1, y1, x2, y2, w, color) {
    const g = this.g;
    if (this.pass === 'FILL') { g.strokeStyle = css(this.col(color)); g.lineWidth = w; }
    else { g.strokeStyle = css(this.pass === 'GHOST' ? this.tint : OUTLINE); g.lineWidth = w + this.outlineW * 2; }
    g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  glow(x, y, r, color, strength = 1) {
    if (this.pass !== 'FILL' || this.flashWhite || strength <= 0) return;
    const g = this.g, a = color[3] * clamp(strength, 0, 1);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, css([color[0], color[1], color[2], a]));
    gr.addColorStop(0.4, css([color[0], color[1], color[2], a / 3]));
    gr.addColorStop(1, css([color[0], color[1], color[2], 0]));
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
  }
  lg(x0, y0, x1, y1, stops) {
    const gr = this.g.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => gr.addColorStop(o, css(c)));
    return gr;
  }

  // ---------------- dibujo
  draw(g, pl, time) {
    if (pl.dead && Math.floor(time * 14) % 2 !== 0) return;
    this.g = g;
    this.drawChargeAura(g, pl, time);
    this.computePose(pl, time);
    let sx = 1 - pl.squash * 0.6, sy = 1 + pl.squash * 0.6;
    if (pl.sliding) { sx = 1.08; sy = 0.92; }
    if (pl.dashing) { sx = 1.12; sy = 0.9; }
    const f = pl.face > 0 ? 1 : -1;
    g.save();
    g.translate(pl.cx, pl.y + pl.h);
    g.rotate(pl.tilt);
    // Caminar agachado: balanceo de paso (sube y baja, se mece y el cuerpo se estira un poco en cada paso).
    if (pl.crouching && pl.grounded && !pl.sliding && Math.abs(pl.vx) > 10 && !listo(HEROE_IMG.agachado_andar1)) {
      const fase = pl.runPhase * 2.4, paso = Math.sin(fase);
      g.translate(0, -Math.abs(paso) * 4);
      g.rotate(paso * 0.06 * (pl.face > 0 ? 1 : -1));
      sx *= 1 + Math.cos(fase * 2) * 0.04; sy *= 1 - Math.cos(fase * 2) * 0.03;
    }
    g.scale(sx, sy);
    const blink = pl.invuln > 0 && Math.floor(time * 18) % 2 === 0;
    if (blink) g.globalAlpha = 92 / 255;
    g.scale(f, 1);
    const im = HEROE_IMG[this.poseSprite(pl, time)];
    if (listo(im)) {
      // Con sprites: estela del impulso con copias tenues, alas de águila detrás y la pose encima.
      if (pl.dashing) for (let i = 3; i >= 1; i--) { g.save(); g.globalAlpha *= (34 + (3 - i) * 22) / 255; g.translate(-i * 13, 0); this.sprite(g, im); g.restore(); }
      this.behindEffects(pl, time);
      this.sprite(g, im);
      g.restore();
      return;
    }
    if (pl.dashing) {
      for (let i = 3; i >= 1; i--) {
        g.save(); g.globalAlpha = (34 + (3 - i) * 22) / 255; g.translate(-i * 13, 0);
        this.pass = 'GHOST'; this.tint = this.k.flameMid; this.body(pl, time);
        g.restore();
      }
    }
    this.behindEffects(pl, time);
    this.pass = 'OUTLINE'; this.body(pl, time);
    this.pass = 'FILL'; this.body(pl, time);
    this.frontEffects(pl, time, f);
    g.restore();
  }

  /** Dibuja una pose con los pies en el origen (el suelo del jugador). */
  sprite(g, im) {
    const s = HEROE_ESCALA, w = im.naturalWidth * s, h = im.naturalHeight * s;
    let fuente = im;
    if (this.tono) {
      // Copias del jugador como sombras (SombraPainter): la misma pose, teñida de oscuro con su tono.
      const c = this._silueta ??= document.createElement('canvas');
      if (c.width !== im.naturalWidth) { c.width = im.naturalWidth; c.height = im.naturalHeight; }
      const x = c.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      const t = this.tono, gr = x.createLinearGradient(0, 0, 0, c.height);
      gr.addColorStop(0, this.flashWhite ? 'rgba(230,220,255,0.85)' : `rgba(${Math.round(t[0] * 0.55)},${Math.round(t[1] * 0.45)},${Math.round(t[2] * 0.6)},0.92)`);
      gr.addColorStop(1, this.flashWhite ? 'rgba(230,220,255,0.85)' : 'rgba(10,4,18,0.95)');
      x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
      fuente = c;
    }
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(fuente, -w / 2, -h * HEROE_PIES, w, h); g.restore();
  }

  /** Elige la pose según lo que hace el jugador (no cambia la física). */
  poseSprite(pl, time) {
    if (this._cargaPrev > 0 && pl.detonationCharge === 0 && !pl.dead) this._sueltaHasta = time + 0.5;
    this._cargaPrev = pl.detonationCharge;
    if (pl.invuln > (this._invPrev ?? 0) + 0.05 && Math.abs(pl.invuln - Balance.INVULN_AFTER_HIT) < 0.05) this._golpeHasta = time + 0.35;
    this._invPrev = pl.invuln;
    const speed = Math.abs(pl.vx), paso = (n) => Math.floor(pl.runPhase / (Math.PI * 2 / n)) % n;
    if (time < (this._sueltaHasta ?? 0)) return 'oracion_suelta';
    if (pl.detonationCharge > 0) return 'oracion_carga';
    if (time < (this._golpeHasta ?? 0)) return 'golpe';
    // Espada de fuego: preparación, tajo y remate en 0,28 s (en el aire, el tajo aéreo).
    // Corriendo en el suelo no se usa la pose del tajo (dejaba las piernas quietas): sigue la carrera y se ve el arco de fuego.
    // Espada del Espíritu (hack and slash): cada golpe del combo con su secuencia de poses.
    if (pl.picada) return 'tajo3';
    if ((pl.golpeT ?? 0) > 0) {
      const k = 1 - pl.golpeT / (pl.golpeDur || 0.2), tipo = pl.golpeTipo;
      if (!pl.grounded && tipo !== 'arriba') return 'tajo4';
      if (tipo === 'arriba') return k < 0.35 ? 'tajo2' : 'tajo1';
      if (tipo === 0) return k < 0.3 ? 'tajo1' : 'tajo2';
      if (tipo === 1) return k < 0.3 ? 'tajo3' : k < 0.7 ? 'tajo2' : 'tajo1';
      return k < 0.2 ? 'tajo1' : k < 0.5 ? 'tajo2' : 'tajo3';  // remate y espada de fuego
    }
    if (pl.dashing) return 'impulso';
    if (pl.sliding) return 'deslizar';
    if (pl.climbing) return paso(2) ? 'escalar_2' : 'escalar_1';
    if (pl.gliding) return 'planeo';
    if (!pl.grounded) return pl.vy < 0 ? (pl.jumps >= 2 ? 'doble_salto' : 'salto') : 'caida';
    if (pl.crouching) {
      // Caminar agachado: ciclo de 4 cuadros (hoja de Codex); quieto o sin las imágenes, la pose fija.
      const andar = `agachado_andar${Math.floor(pl.runPhase * 1.6 / (Math.PI / 2)) % 4 + 1}`;
      return speed > 10 && listo(HEROE_IMG[andar]) ? andar : 'agachado';
    }
    if (speed > 25) return `correr_${Math.floor(pl.runPhase * 1.4 / (Math.PI / 2)) % 4 + 1}`;  // al doble de tamaño, pasos más rápidos
    if (pl.shotAnim > 0) return pl.aim === 2 ? 'disparo_arriba' : pl.aim === 1 ? 'disparo_diagonal' : 'disparo';
    return 'quieto';
  }

  computePose(pl, time) {
    const speed = Math.abs(pl.vx), breathe = Math.sin(time * 2.6);
    this.lean = 0; this.upperDy = 0; this.sway = Math.sin(time * 2.2) * 0.7; this.recoil = pl.shotAnim * 2.4;
    this.bf = 0; this.ff = 0;
    let planted = true;
    if (pl.dashing) {
      this.bt = 1.05; this.bk = 0.45; this.ft = -0.25; this.fk = 1.25; this.lean = 0.3; this.upperDy = 1.5;
      planted = pl.dashWasGrounded; this.sway = -2.5;
    } else if (pl.sliding) {
      this.ft = -1.35; this.fk = 0.25; this.ff = 0.2; this.bt = -0.2; this.bk = 2.1; this.lean = -0.12; this.upperDy = 3.5; this.sway = -2;
    } else if (pl.crouching) {
      this.bt = -0.55; this.bk = 1.9; this.ft = -1.05; this.fk = 1.95; this.lean = 0.1; this.upperDy = 3 + breathe * 0.35;
    } else if (pl.climbing) {
      const a = pl.runPhase;
      this.bt = -0.55 + Math.sin(a) * 0.45; this.bk = 1.15 - Math.sin(a) * 0.35;
      this.ft = -0.55 - Math.sin(a) * 0.45; this.fk = 1.15 + Math.sin(a) * 0.35; planted = false;
    } else if (pl.wallCling) {
      this.bt = 0.15; this.bk = 0.75; this.ft = -0.75; this.fk = 1.35; this.bf = 0.2; planted = false;
    } else if (pl.gliding) {
      this.bt = 0.5; this.bk = 0.45; this.ft = 0.2; this.fk = 0.55; this.bf = 0.35; this.ff = 0.25; this.lean = 0.08; planted = false;
    } else if (!pl.grounded) {
      const t = clamp((pl.vy + 250) / 600, 0, 1);
      this.bt = lerp(0.6, 0.28, t); this.bk = lerp(1.05, 0.35, t);
      this.ft = lerp(-1.0, -0.35, t); this.fk = lerp(1.4, 0.5, t);
      this.bf = lerp(0.35, 0.15, t); this.ff = lerp(0.1, -0.1, t);
      this.sway = lerp(-2, 2.5, t); planted = false;
    } else if (speed > 25) {
      const amp = Math.min(1, speed / 230), runK = clamp((speed - 340) / 50, 0, 1);
      const a = pl.runPhase, b = a + Math.PI, stride = 0.78 + runK * 0.3;
      this.ft = -Math.sin(a) * stride * amp; this.fk = (0.18 + Math.max(0, Math.cos(a)) * (1.25 + runK * 0.35)) * amp;
      this.bt = -Math.sin(b) * stride * amp; this.bk = (0.18 + Math.max(0, Math.cos(b)) * (1.25 + runK * 0.35)) * amp;
      this.ff = Math.cos(a) > 0 ? -0.25 * amp : 0; this.bf = Math.cos(b) > 0 ? -0.25 * amp : 0;
      this.lean = 0.1 * amp + runK * 0.12;
      this.sway = -Math.cos(a * 2) * 1.5 * amp - amp;
    } else {
      this.bt = 0.07; this.bk = 0.06; this.ft = -0.1; this.fk = 0.14; this.upperDy = breathe * 0.45;
    }
    const drop = (th, kn) => THIGH * Math.cos(th) + SHIN * Math.cos(th + kn) + BOOT;
    this.hipY = planted ? -Math.max(drop(this.bt, this.bk), drop(this.ft, this.fk)) : -STAND_HIP;
  }

  body(pl, time) {
    this.leg(-2.6, this.bt, this.bk, this.bf, true);
    // Sin mochila propulsora (pedido de Juan): la armadura no lleva propulsores. backpack() queda por si se quiere volver.
    this.upper(() => { this.torso(); });
    this.leg(2.4, this.ft, this.fk, this.ff, false);
    this.upper(() => { this.helmet(time); this.cannon(pl); });
  }
  upper(block) {
    const g = this.g; g.save();
    g.translate(0, this.hipY + STAND_HIP + this.upperDy);
    g.translate(0, -STAND_HIP); g.rotate(this.lean); g.translate(0, STAND_HIP);
    block(); g.restore();
  }

  leg(hx, th, kn, foot, back) {
    const g = this.g, k = this.k; g.save();
    g.translate(hx, this.hipY); g.rotate(th);
    this.rrect(-3, -2, 3, THIGH + 1, 2.6); this.fill(back ? k.metalDark : k.metalShade);
    this.rrect(0.6, -0.5, 2.2, THIGH - 0.8, 0.8); this.detail(back ? k.metalShade : k.metal);
    g.translate(0, THIGH); g.rotate(kn);
    this.rrect(-3.4, -0.5, 3.7, SHIN + 0.8, 2.2); this.fill(back ? k.metalShade : k.metal);
    this.rrect(0.4, 1.4, 3.1, SHIN - 0.6, 1); this.detail(back ? k.metal : k.metalHi);
    this.seam(1.2, 2.2, 1.2, SHIN - 1.4, back ? k.metalHi : k.whiteShade, 0.6);
    this.circle(0.7, 0, 3.1); this.fill(back ? k.gold : k.goldHi);            // rodillera dorada
    this.circle(1.2, -0.6, 1.2); this.detail(back ? k.goldHi : k.white);
    g.translate(0, SHIN); g.rotate(-(th + kn) + foot);
    this.poly(-3.9, -1.9, 2.8, -2.3, 6.9, 0.6, 6.9, BOOT, -4.7, BOOT, -4.9, 0.6); this.fill(back ? k.metalShade : k.metal);
    this.poly(-3.3, -1.3, 2.5, -1.7, 5.5, 0.5, -3.6, 0.8); this.detail(back ? k.metal : k.metalHi);
    this.rrect(-4.7, BOOT - 1.1, 6.9, BOOT, 0.5); this.detail(k.gold);
    if (!back) {
      this.rrect(-2.8, 1.1, -0.2, 1.9, 0.4); this.detail(k.light);
      this.glow(-1.5, 1.5, 3.2, k.lightGlow, 0.7);
    }
    g.restore();
  }

  backpack() {
    const k = this.k;
    this.rrect(-17.5, -34, -7.5, -15.5, 3); this.fill(k.metalShade, this.lg(-17.5, 0, -7.5, 0, [[0, k.metalDark], [1, k.metalShade]]));
    this.rrect(-16.6, -33.2, -8.6, -30.2, 1.4); this.detail(k.gold);
    this.seam(-15.8, -32.6, -9.6, -32.6, k.goldHi, 0.6);
    this.rrect(-14.3, -28.6, -11.8, -19.2, 1.2); this.detail(k.lightDeep);
    this.rrect(-13.8, -28, -12.3, -19.8, 0.8); this.detail(k.lightHi);
    this.glow(-13, -24, 7, k.lightGlow, 0.8);
    this.rrect(-15.6, -16.8, -10.1, -13.6, 1); this.fill(k.metalDark);
  }

  torso() {
    const k = this.k;
    this.poly(-8, -32.5, 7, -33, 10, -28.5, 9, -21.5, 6, -17.5, -6.5, -17.5, -9, -22.5);
    this.fill(k.white, this.lg(0, -33, 0, -17, [[0, k.whiteHi], [0.4, k.white], [1, k.whiteShade]]));
    this.poly(-2, -31, 6.5, -31.3, 8.3, -28, 7.5, -23, -1, -22.5); this.detail(k.metalHi);   // coraza
    this.seam(-1.2, -30.4, 6.2, -30.7, k.gold, 0.7);
    // Cruz de bronce grabada en la coraza (en lugar de la gema de luz) y desgaste: rayones y óxido.
    this.seam(2.6, -29.2, 2.6, -24.4, k.gold, 1.1); this.seam(0.8, -27.6, 4.4, -27.6, k.gold, 1.1);
    this.seam(-6, -28, -3.5, -25.5, k.whiteShade, 0.5); this.seam(5.5, -21.5, 8, -24, k.whiteShade, 0.5);
    this.circle(-4.5, -21.6, 0.9); this.detail(argb(150, 120, 70, 40)); this.circle(7.2, -26.4, 0.6); this.detail(argb(140, 120, 70, 40));
    this.rrect(-5.5, -22, 6.2, -19.8, 1); this.detail(k.metalShade);
    this.rrect(-7.6, -20.2, 7.6, -15.5, 2); this.fill(rgb(108, 72, 44));                  // cinturón de cuero
    this.rrect(3.6, -19.2, 6.6, -16.6, 0.6); this.detail(k.gold);                           // hebilla de bronce
  }

  // Cabeza sencilla de caricatura en lugar del casco (pedido de Juan: el casco se veía futurista). Mira hacia
  // delante (+x) como el resto del cuerpo; ocupa el mismo lugar que el casco original.
  helmet(time) {
    const g = this.g, k = this.k; g.save(); g.translate(0, -1.2);
    const piel = rgb(236, 192, 152), pielSombra = rgb(212, 160, 120), pelo = rgb(86, 54, 34), peloLuz = rgb(124, 82, 52);
    // Cuello
    this.rrect(-3.5, -33, 3.5, -27.5, 1.5); this.fill(pielSombra);
    // Cara (óvalo) y oreja
    this.poly(-9, -46, -5, -51, 5, -51.5, 11, -48, 13, -41, 12, -35, 8, -30.5, 0, -29.5, -6, -31.5, -10, -37);
    this.fill(piel, this.lg(0, -51, 0, -30, [[0, rgb(244, 206, 170)], [1, pielSombra]]));
    this.circle(-4, -40, 2.8); this.fill(pielSombra);
    this.circle(-4, -40, 1.3); this.detail(rgb(196, 140, 104));
    // Cabello corto castaño con flequillo hacia delante
    this.poly(-11, -42, -10.5, -49, -6, -54, 2, -55.5, 9, -53.5, 13.5, -49, 12, -46.5, 8, -48.5, 5, -46, 1.5, -48.5, -2, -46.5, -6, -45, -8, -41);
    this.fill(pelo, this.lg(0, -56, 0, -42, [[0, peloLuz], [1, pelo]]));
    this.seam(-6, -51.5, 4, -53.4, peloLuz, 0.7);
    // Casco romano abierto (galea): calota plateada, ceja dorada, carrillera, cubrenuca y cresta roja.
    const cola = this.sway * 0.8;
    this.poly(-11.5, -42.5, -15, -38.5, -14.5, -36.6, -9.5, -39.5, -7.5, -44);                    // cubrenuca
    this.fill(k.metalShade);
    this.poly(-11.8, -43.5, -11, -50.5, -6, -56, 2, -57.6, 9, -55.6, 13.6, -50.5, 14.2, -46.6, 4, -46.2, -3, -45.4, -8, -44);
    this.fill(k.metal, this.lg(0, -58, 0, -44, [[0, k.metalHi], [0.6, k.metal], [1, k.metalShade]]));
    this.seam(-4, -55, 8, -55.4, k.metalHi, 0.8);
    this.seam(-7, -51, -3.5, -48.5, k.metalShade, 0.5); this.circle(6.5, -51.5, 0.8); this.detail(argb(150, 120, 70, 40));  // rayón y óxido
    this.rrect(1.5, -47.6, 14.6, -45.6, 1); this.fill(k.gold);                                  // ceja dorada
    this.poly(-0.5, -46, 5, -46, 4.6, -37.5, 2, -34.4, -1.2, -37.8); this.fill(k.metal);          // carrillera
    this.circle(1.9, -42.5, 0.9); this.detail(k.gold); this.circle(2, -38.5, 0.9); this.detail(k.gold);
    this.poly(11, -55.5, 7, -60.3, 0, -62.8, -7, -62.4 + cola * 0.3, -13 + cola * 0.4, -59.4, -15.5 + cola * 0.5, -55.3,
      -11.5, -55.4, -6, -57.2, 1, -57.9, 7, -56.6);                                                    // cresta
    this.fill(rgb(170, 36, 48), this.lg(0, -63, 0, -55, [[0, rgb(214, 70, 78)], [1, rgb(122, 22, 36)]]));
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const x = 9 - t * 23, y1 = -59.5 - Math.sin(t * Math.PI) * 3, y2 = -56.6 - Math.sin(t * Math.PI) * 1.4;
      this.seam(x, y1, x - 1.2, y2, rgb(110, 18, 32), 0.55);
    }
    this.seam(9.5, -56.3, -12.5, -56.3, k.gold, 1.1);
    // Ojo, ceja, nariz y sonrisa
    if (this.pass === 'FILL') {
      const parpadeo = (time % 4.2) < 0.12;
      if (parpadeo) this.seam(5.6, -41, 9, -41, rgb(40, 28, 24), 1);
      else { this.circle(7.3, -41.2, 1.7); this.detail(rgb(40, 28, 24)); this.circle(7.8, -41.9, 0.55); this.detail(rgb(255, 255, 255)); }
      this.seam(5, -44.6, 9.4, -45, pelo, 1);
      this.seam(12, -39.5, 13.2, -37, pielSombra, 0.8);
      g.strokeStyle = css(rgb(140, 70, 60)); g.lineWidth = 0.9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(6.5, -34.6); g.quadraticCurveTo(9, -32.8, 11.2, -34.8); g.stroke();
      this.circle(4.5, -36.3, 1.6); this.detail(argb(70, 240, 120, 110));
    }
    g.restore();
  }

  visorGlint(time, visorPath) {
    const t = (time % 3.4) / 0.45;
    if (t >= 1) return;
    const g = this.g; g.save(); g.clip(visorPath);
    const x = -6 + t * 24;
    g.globalCompositeOperation = 'lighter'; g.fillStyle = css(argb(120, 220, 245, 255));
    g.beginPath(); g.moveTo(x, -48); g.lineTo(x + 3, -48); g.lineTo(x - 4, -32); g.lineTo(x - 7, -32); g.closePath(); g.fill();
    g.restore();
  }

  cannon(pl) {
    const g = this.g, k = this.k;
    this.poly(-3.8, -34.6, 4.4, -35, 7.2, -31, 5.6, -26.4, -2.6, -26.4, -4.6, -30.2); this.fill(k.whiteHi); // hombrera
    this.poly(-2.8, -34, 4, -34.3, 5.8, -31.6, -3.6, -31.2); this.detail(k.goldHi);
    this.seam(-2.2, -33.9, 3.8, -34.2, k.gold, 0.6);
    g.save();
    this.aimTransform(pl);
    g.translate(-this.recoil, 0);
    this.rrect(3, -32.8, 17, -26.2, 2.2);
    this.fill(k.metal, this.lg(0, -32.8, 0, -26.2, [[0, k.metalHi], [0.45, k.metal], [1, k.metalDark]]));
    this.rrect(8, -32.8, 9.4, -26.2, 0.3); this.detail(k.gold);
    this.rrect(10.6, -31.8, 13.8, -30.2, 0.6); this.detail(k.accent);
    this.glow(12.2, -31, 3.5, k.accentGlow, 0.7);
    this.rrect(4.4, -28.3, 14.6, -27.3, 0.5); this.detail(withAlpha(k.light, 0.8));
    this.rrect(16, -33.6, 22.6, -25.4, 1.8); this.fill(k.gold);
    this.seam(16.8, -33, 21.6, -33, k.goldHi, 0.6);
    this.circle(22.3, -29.5, 2.4); this.fill(k.metalBlack);
    this.circle(22.4, -29.5, 1.5); this.detail(k.light);
    this.glow(22.6, -29.5, 4.5, k.lightGlow, 0.8 + pl.shotAnim);
    g.restore();
  }
  aimTransform(pl) {
    const a = clamp(pl.aim, 0, 2);
    if (a === 0) return;
    const g = this.g;
    g.translate(AIM_PIVOT_X[a] - 3, 0);
    g.translate(3, -29.5); g.rotate(AIM_ROT_DEG[a] * Math.PI / 180); g.translate(-3, 29.5);
  }

  behindEffects(pl, time) {
    this.pass = 'FILL';
    this.upper(() => {
      // Sin llamas de propulsión (pedido de Juan).
    });
    // Alas de águila al planear y al hacer el impulso: «los que esperan a Jehová tendrán nuevas fuerzas;
    // levantarán las alas como las águilas» (Isaías 40:31).
    // Para que parezca ir a toda velocidad: líneas de velocidad que corren hacia atrás y estela de copias tenues.
    if (pl.gliding) {
      // Al planear, el águila se posa en su espalda y sus alas abiertas son las alas de Cristian (pedido de Juan).
      const aleteo = 0.7 + Math.sin(time * 3.2) * 0.3;
      this.speedLines(-14, -40, 0.5, time, 5);
      this.alasDeAguila(-21, -40, 1.35, aleteo - 0.15, 0.14, 0);
      this.alasDeAguila(-7, -40, 1.35, aleteo, 0.8, 0);
    } else if (pl.dashing) {
      this.speedLines(0, -50, 1, time, 8);
      for (let i = 4; i >= 1; i--) this.alasDeAguila(10 - i * 14, -50, 0.85, 0, 0.3 / i, 1);
      this.alasDeAguila(12, -50, 0.85, 0, 0.8, 1);
    }
  }

  /** Líneas de luz horizontales detrás del águila; corren hacia atrás con el tiempo. */
  speedLines(x, y, fuerza, time, n) {
    const g = this.g;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const fase = ((time * (2.2 + fuerza * 1.6) + i * 0.37) % 1), dy = ((i * 37) % 23) - 11, largo = (18 + (i * 13) % 22) * (0.6 + fuerza);
      const x1 = x - 18 - fase * 50 * (0.6 + fuerza), a = (1 - fase) * (0.35 + 0.4 * fuerza);
      const gr = g.createLinearGradient(x1, 0, x1 - largo, 0);
      gr.addColorStop(0, `rgba(230,246,255,${a})`); gr.addColorStop(1, 'rgba(150,215,255,0)');
      g.strokeStyle = gr; g.lineWidth = i % 3 === 0 ? 1.6 : 1;
      g.beginPath(); g.moveTo(x1, y + dy); g.lineTo(x1 - largo, y + dy); g.stroke();
    }
    g.restore();
  }

  /** Alas de águila: águila de luz translúcida, blanca y celeste, DE PERFIL (pico hacia delante, como el personaje).
   * flap: -1 ala abajo … 1 ala arriba. lunge: 1 = alas plegadas hacia atrás y cuerpo estirado (impulso). */
  alasDeAguila(x, y, s, flap, alpha, lunge) {
    const g = this.g;
    g.save(); g.translate(x, y); g.rotate(lunge * 0.14); g.scale(s * (1 + lunge * 0.35), s * (1 - lunge * 0.12));
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha;
    const grad = g.createLinearGradient(0, -34, 0, 12);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)'); grad.addColorStop(0.55, 'rgba(205,236,255,0.85)'); grad.addColorStop(1, 'rgba(120,200,255,0.25)');
    g.shadowColor = 'rgba(150,215,255,0.9)'; g.shadowBlur = 10;  // blanco y celeste (pedido de Juan)
    // Ala de perfil: nace en el hombro y termina en plumas separadas («dedos»). Plegada en el impulso.
    const ala = (f, escala) => {
      const up = lunge ? 0.15 : f, tipX = lunge ? -34 : -20 + up * 2, tipY = -3 - 30 * up * escala;
      g.beginPath(); g.moveTo(7, -3);
      g.quadraticCurveTo(-2, -3 - 22 * up * escala, tipX, tipY);
      // Plumas primarias en la punta y borde de salida festoneado de vuelta al lomo.
      for (let k = 1; k <= 4; k++) {
        const t = k / 4, fx = tipX + (lunge ? 6 : 5) * t + 2, fy = tipY + (lunge ? 3 : 8) * t * Math.sign(up || 1);
        g.lineTo(fx - 4, fy - 2 * Math.sign(up || 1)); g.lineTo(fx, fy);
      }
      g.quadraticCurveTo(-8, -3 - 8 * up * escala, -10, 0);
      g.closePath();
    };
    g.fillStyle = grad;
    g.save(); g.globalAlpha = alpha * 0.45; g.translate(3, -1); ala(Math.sin(Math.asin(Math.max(-1, Math.min(1, flap))) - 0.5), 0.85); g.fill(); g.restore();
    // Cola en abanico detrás, cuerpo alargado, cabeza con pico ganchudo.
    g.beginPath(); g.moveTo(-12, -2); g.lineTo(-29, -7); g.lineTo(-31, -1); g.lineTo(-28, 4); g.lineTo(-12, 3); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, 0, 15, 6.5, -0.08, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(15, -5, 5.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(225,244,255,0.95)';
    g.beginPath(); g.moveTo(19, -8); g.quadraticCurveTo(26, -8, 26.5, -3.5); g.lineTo(24, -4.5); g.lineTo(19.5, -3); g.closePath(); g.fill();
    g.fillStyle = grad; ala(flap, 1); g.fill();
    g.shadowBlur = 0; g.fillStyle = 'rgba(40,70,110,0.85)'; g.beginPath(); g.arc(16.6, -6.2, 1, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(5, -3); g.quadraticCurveTo(-4, -3 - 18 * (lunge ? 0.15 : flap), lunge ? -28 : -16, lunge ? -6 : -3 - 26 * flap); g.stroke();
    g.restore();
  }
  flame(x0, y0, x1, y1, wdt) {
    const g = this.g, k = this.k;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = this.lg(x0, y0, x1, y1, [[0, k.flameCore], [0.4, k.flameMid], [1, withAlpha(k.flameMid, 0)]]);
    const dx = x1 - x0, dy = y1 - y0, len = Math.max(0.01, Math.hypot(dx, dy));
    const nx = -dy / len * wdt / 2, ny = dx / len * wdt / 2;
    g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x1, y1); g.lineTo(x0 - nx, y0 - ny); g.closePath(); g.fill();
    const rg = g.createRadialGradient(x0, y0, 0, x0, y0, wdt * 1.6);
    rg.addColorStop(0, css(withAlpha(k.flameCore, 0.8))); rg.addColorStop(1, css(withAlpha(k.flameMid, 0)));
    g.fillStyle = rg; g.beginPath(); g.arc(x0, y0, wdt * 1.6, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  wing() {
    const g = this.g, k = this.k;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = this.lg(-10, -30, -48, -22, [[0, k.wingA], [1, k.wingB]]);
    g.beginPath(); g.moveTo(-12, -32); g.quadraticCurveTo(-34, -50, -50, -30); g.lineTo(-36, -28); g.lineTo(-44, -21); g.lineTo(-14, -22); g.closePath(); g.fill();
    g.strokeStyle = css(k.wingLine); g.lineWidth = 1; g.beginPath(); g.moveTo(-13, -31); g.lineTo(-46, -30); g.stroke();
    g.restore();
  }
  frontEffects(pl, time, f) {
    const k = this.k;
    this.pass = 'FILL';
    if (pl.shotAnim > 0) {
      this.upper(() => {
        const g = this.g; g.save();
        this.aimTransform(pl);
        const r = 4 + 9 * pl.shotAnim, x = 24.5 - this.recoil;
        g.globalCompositeOperation = 'lighter';
        const rg = g.createRadialGradient(x, -29.5, 0, x, -29.5, r);
        rg.addColorStop(0, 'rgba(255,250,225,1)'); rg.addColorStop(0.35, 'rgba(255,209,102,0.86)'); rg.addColorStop(1, 'rgba(255,150,40,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(x, -29.5, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = css(argb(230 * pl.shotAnim, 255, 245, 210));
        g.beginPath(); g.moveTo(x, -30.6); g.lineTo(x + r * 1.5, -29.5); g.lineTo(x, -28.4); g.closePath(); g.fill();
        g.restore();
      });
    }
    if (pl.wallCling) {
      const side = pl.wallSide * f > 0 ? 1 : -1, wx = side * 18.5;
      for (const y of [-38, -9]) {
        this.pass = 'OUTLINE'; this.rrect(wx - 2.6, y - 3.6, wx + 2.6, y + 3.6, 1.2); this.fill(k.metal);
        this.pass = 'FILL'; this.fill(k.gold);
        this.rrect(wx + side * 1.2 - 0.8, y - 2.4, wx + side * 1.2 + 0.8, y + 2.4, 0.4); this.detail(k.lightHi);
        this.glow(wx + side * 2, y, 5.5, k.lightGlow, 0.7 + 0.3 * Math.sin(time * 12));
      }
    }
  }
  drawChargeAura(g, pl, time) {
    const ratio = clamp(pl.detonationCharge / Balance.DETONATION_CHARGE_MAX, 0, 1);
    if (ratio <= 0) return;
    const cx = pl.cx, cy = pl.cy, auraR = (30 + ratio * 28) * (1 + Math.sin(time * 16) * 0.06);
    g.save(); g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, auraR);
    rg.addColorStop(0, `rgba(255,250,230,${0.12 + 0.2 * ratio})`);
    rg.addColorStop(0.52, `rgba(255,214,110,${0.12 + 0.24 * ratio})`);
    rg.addColorStop(1, 'rgba(255,214,110,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, auraR, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(255,240,200,${0.32 + 0.55 * ratio})`; g.lineWidth = 1.5 + ratio * 2.5;
    g.beginPath(); g.arc(cx, cy, 22 + ratio * 18, 0, Math.PI * 2); g.stroke();
    g.restore();
  }
}
