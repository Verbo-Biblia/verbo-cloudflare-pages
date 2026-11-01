// Dibujo de las trampas y piezas que faltaban en la fase 1 (port de render/GeometryPainter.kt y WorldRenderer.kt).
// Se instalan como métodos de WorldRenderer; usan su paleta de escenario (this.st).
import { rgb, argb, css, withAlpha, lerpColor, lrtb, rr, poly, circle, glowCircle, glowRect, line, linearV, hh, clamp } from './dibujo.js';
import { Meteor } from './mundo.js';
import { METEOR_R } from './combate.js';

const WHITE = rgb(255, 255, 255);
// Materiales de época (como en escenario.js).
const MADERA = { luz: rgb(176, 124, 74), base: rgb(132, 86, 48), oscura: rgb(58, 36, 22) };
const HIERRO = { luz: rgb(150, 132, 120), base: rgb(98, 84, 78), oscuro: rgb(40, 32, 30), oxido: rgb(150, 86, 46) };
const CUERDA = rgb(188, 156, 104), FUEGO = rgb(255, 130, 40);

export const metodosTrampas = {
  /** Corriente de viento (antes zona sin gravedad): ráfagas blancas y hojas que suben. */
  drawGravityZone(g, z, time) {
    const col = rgb(200, 235, 230);
    const gr = g.createLinearGradient(0, z.y, 0, z.y + z.h);
    gr.addColorStop(0, css(withAlpha(col, 0))); gr.addColorStop(0.4, css(withAlpha(col, 0.06))); gr.addColorStop(1, css(withAlpha(col, 0.14)));
    g.fillStyle = gr; g.fillRect(z.x, z.y, z.w, z.h);
    g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const ph = ((time * 0.6 + i / 6) % 1), y = z.y + z.h - ph * z.h, x = z.x + z.w * ((i * 0.37) % 1);
      g.strokeStyle = css(withAlpha(rgb(235, 250, 245), 0.4 * Math.sin(ph * Math.PI))); g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y + 30); g.quadraticCurveTo(x + 14 * Math.sin(time * 2 + i), y + 15, x, y); g.stroke();
    }
    const n = clamp(Math.trunc(z.w * z.h / 12000), 5, 24);
    for (let i = 0; i < n; i++) {
      const seed = i * 97.31 + z.x, fx = z.x + (((seed * 13.7) % z.w) + z.w) % z.w, fy = z.y + z.h - ((time * (50 + (i % 5) * 16) + seed * 7) % z.h);
      g.save(); g.translate(fx + Math.sin(time * 3 + i) * 8, fy); g.rotate(time * 3 + i);
      g.fillStyle = css(i % 3 ? rgb(150, 170, 80) : rgb(200, 150, 70)); g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
  },

  drawBackWall(g, b, time) {
    // Muro de piedra con antorchas.
    const st = this.st;
    lrtb(g, b.x, b.y, b.x + b.w, b.y + b.h, withAlpha(st.dark, 0.93));
    const junta = withAlpha(st.face, 0.4);
    for (let fy = b.y + 28, f = 0; fy < b.y + b.h; fy += 28, f++) {
      lrtb(g, b.x, fy - 1, b.x + b.w, fy + 1, junta);
      for (let gx = b.x + ((f % 2) ? 32 : 0); gx < b.x + b.w; gx += 64) lrtb(g, gx - 1, fy - 28, gx + 1, fy, junta);
    }
    for (let lx = Math.floor(b.x / 256) * 256 + 64; lx < b.x + b.w - 20; lx += 256) {
      if (lx <= b.x + 10) continue;
      const a = 0.4 + 0.15 * Math.sin(time * 9 + lx);
      lrtb(g, lx + 7, b.y + 14, lx + 11, b.y + 34, MADERA.oscura);
      poly(g, FUEGO, lx + 4, b.y + 15, lx + 9, b.y + 2 - 3 * a, lx + 14, b.y + 15);
      glowCircle(g, lx + 9, b.y + 10, 30, withAlpha(rgb(255, 170, 70), 0.2 * a));
    }
  },

  drawDuct(g, d, time) {
    // Viga de madera (antes conducto).
    lrtb(g, d.x, d.y, d.x + d.w, d.y + d.h, MADERA.oscura);
    lrtb(g, d.x, d.y + 2, d.x + d.w, d.y + d.h - 2, MADERA.base);
    lrtb(g, d.x, d.y + 2, d.x + d.w, d.y + 4, MADERA.luz);
    for (let rx = d.x + 20; rx < d.x + d.w; rx += 60) lrtb(g, rx, d.y, rx + 5, d.y + d.h, CUERDA);
  },

  drawWindow(g, wi) {
    // Ventana de piedra con postigos de madera abiertos (sin vidrio).
    const st = this.st;
    lrtb(g, wi.x - 8, wi.y - 8, wi.x + wi.w + 8, wi.y + wi.h + 8, st.dark);
    lrtb(g, wi.x - 8, wi.y - 8, wi.x + wi.w + 8, wi.y - 5, st.highlight);
    lrtb(g, wi.x - 22, wi.y, wi.x - 8, wi.y + wi.h, MADERA.base); lrtb(g, wi.x + wi.w + 8, wi.y, wi.x + wi.w + 22, wi.y + wi.h, MADERA.base);
    for (const x of [wi.x - 18, wi.x + wi.w + 12]) for (let y = wi.y + 8; y < wi.y + wi.h - 4; y += 12) lrtb(g, x, y, x + 6, y + 2, MADERA.oscura);
  },

  drawAutoDoor(g, d, time) {
    // Reja de hierro (antes compuerta automática): sube y baja; la antorcha encima avisa si está abierta.
    const st = this.st;
    lrtb(g, d.x - 8, d.y - 10, d.x + d.w + 8, d.y, st.dark); lrtb(g, d.x - 8, d.y - 10, d.x + d.w + 8, d.y - 7, st.highlight);
    lrtb(g, d.x - 8, d.y, d.x, d.y + d.fullH, st.dark); lrtb(g, d.x + d.w, d.y, d.x + d.w + 8, d.y + d.fullH, st.dark);
    const abierta = d.open > 0.02, a = 0.5 + 0.2 * Math.sin(time * 9 + d.x);
    poly(g, abierta ? rgb(255, 210, 90) : FUEGO, d.x + d.w / 2 - 5, d.y - 10, d.x + d.w / 2, d.y - 22 - 3 * a, d.x + d.w / 2 + 5, d.y - 10);
    glowCircle(g, d.x + d.w / 2, d.y - 14, 18, withAlpha(rgb(255, 170, 70), 0.25 * a));
    if (d.h <= 2.5) return;
    const bottom = d.y + d.h;
    g.save(); g.beginPath(); g.rect(d.x, d.y, d.w, d.h); g.clip();
    for (let x = d.x + 4; x < d.x + d.w; x += 12) { lrtb(g, x, d.y, x + 4, bottom, HIERRO.oscuro); lrtb(g, x + 0.5, d.y, x + 2, bottom, HIERRO.base); }
    for (let y = bottom - 10; y > d.y; y -= 34) { lrtb(g, d.x, y, d.x + d.w, y + 4, HIERRO.oscuro); lrtb(g, d.x, y, d.x + d.w, y + 1.5, HIERRO.oxido); }
    for (let x = d.x + 4; x < d.x + d.w; x += 12) poly(g, HIERRO.base, x - 1, bottom - 2, x + 2, bottom + 6, x + 5, bottom - 2);
    g.restore();
  },

  drawConveyor(g, cv, time) {
    // Troncos rodantes (antes cinta transportadora).
    const st = this.st, l = cv.x, r = cv.x + cv.w, t = cv.y, b = cv.y + cv.h;
    lrtb(g, l, t + cv.h / 2, r, b, st.dark);
    const rad = cv.h / 2 - 1, spin = time * cv.speed / rad;
    for (let rx = l + rad; rx < r - rad + 1; rx += rad * 2 + 1) {
      circle(g, rx, t + cv.h / 2, rad, MADERA.oscura); circle(g, rx, t + cv.h / 2, rad - 2, MADERA.base);
      g.strokeStyle = css(MADERA.oscura); g.lineWidth = 1.2; g.beginPath(); g.arc(rx, t + cv.h / 2, rad * 0.55, spin, spin + 4.5); g.stroke();
      circle(g, rx, t + cv.h / 2, rad * 0.18, MADERA.luz);
    }
  },

  drawShock(g, sh, time) {
    // Brasas (antes suelo eléctrico): avisan con chispas y luego arden.
    const y = sh.floorY;
    lrtb(g, sh.x, y - 5, sh.x + sh.w, y, rgb(40, 22, 16));
    for (let bx = sh.x + 4; bx < sh.x + sh.w - 4; bx += 9) circle(g, bx, y - 4, 3, lerpColor(rgb(90, 40, 20), rgb(255, 120, 40), sh.state ? 0.4 + 0.3 * Math.sin(time * 9 + bx) : 0.15));
    if (sh.state === 1) {
      const n = Math.trunc(2 + sh.k * 6);
      for (let i = 0; i < n; i++) glowCircle(g, sh.x + hh(Math.trunc(time * 20) + i * 17 + Math.trunc(sh.x)) * sh.w, y - 8 - hh(i + Math.trunc(time * 9)) * 10, 2.5, withAlpha(rgb(255, 180, 80), 0.7));
    } else if (sh.state === 2) {
      glowRect(g, sh.x, y - 30, sh.x + sh.w, y, withAlpha(rgb(255, 110, 40), 0.25));
      for (let i = 0; i < Math.max(3, Math.trunc(sh.w / 18)); i++) {
        const x = sh.x + (i + 0.5) * sh.w / Math.max(3, Math.trunc(sh.w / 18)), h = 12 + 8 * Math.sin(time * 14 + i * 2);
        poly(g, rgb(255, 120, 40), x - 6, y - 3, x + Math.sin(time * 9 + i) * 2, y - 3 - h, x + 6, y - 3);
        poly(g, rgb(255, 225, 140), x - 3, y - 3, x, y - 3 - h * 0.5, x + 3, y - 3);
      }
    }
  },

  drawGuillotine(g, gu, time) {
    // Cuchilla de hierro oxidado en un marco de madera; la antorcha de arriba aviso antes de caer.
    const cx = gu.x + gu.w / 2, jitter = gu.warn > 0 ? Math.sin(time * 80) * 1.8 : 0, bladeTop = gu.blade.y;
    lrtb(g, gu.x - 8, gu.top - 70, gu.x - 1, gu.bottom, MADERA.oscura); lrtb(g, gu.x - 7, gu.top - 70, gu.x - 4, gu.bottom, MADERA.base);
    lrtb(g, gu.x + gu.w + 1, gu.top - 70, gu.x + gu.w + 8, gu.bottom, MADERA.oscura); lrtb(g, gu.x + gu.w + 2, gu.top - 70, gu.x + gu.w + 5, gu.bottom, MADERA.base);
    lrtb(g, cx - 2, gu.top - 70, cx + 2, bladeTop + 4, CUERDA);
    rr(g, gu.x - 14, gu.top - 90, gu.w + 28, 22, 3, MADERA.oscura); rr(g, gu.x - 11, gu.top - 87, gu.w + 22, 16, 2, MADERA.base);
    const aviso = gu.warn > 0 ? 0.6 + 0.4 * Math.sin(time * 45) : 0.25;
    poly(g, FUEGO, cx - 6, gu.top - 90, cx, gu.top - 104 - 4 * aviso, cx + 6, gu.top - 90);
    glowCircle(g, cx, gu.top - 96, 24, withAlpha(rgb(255, 150, 60), 0.3 * aviso));
    const bx = gu.x + jitter, bh = gu.blade.h;
    lrtb(g, bx, bladeTop, bx + gu.w, bladeTop + 14, MADERA.oscura);
    poly(g, HIERRO.base, bx, bladeTop + 12, bx + gu.w, bladeTop + 12, bx + gu.w, bladeTop + bh - 12, bx, bladeTop + bh);
    poly(g, HIERRO.luz, bx, bladeTop + bh - 6, bx + gu.w, bladeTop + bh - 18, bx + gu.w, bladeTop + bh - 12, bx, bladeTop + bh);
    for (let i = 0; i < 4; i++) circle(g, bx + 6 + ((i * 37) % Math.max(8, gu.w - 12)), bladeTop + 22 + i * 9, 2.5, HIERRO.oxido);
    glowRect(g, gu.x, gu.bottom - 4, gu.x + gu.w, gu.bottom, withAlpha(rgb(255, 90, 60), 0.12 + 0.25 * gu.warn));
  },

  drawRamp(g, r, time) {
    const st = this.st, th = 16, base = Math.max(r.y1, r.y2);
    for (let sx = r.x1 + 30; sx < r.x2 - 20; sx += 80) { const y = r.yAt(sx); if (base - y > th + 6) lrtb(g, sx - 3, y + th, sx + 3, base, withAlpha(st.dark, 0.95)); }
    poly(g, st.dark, r.x1, r.y1 + 3, r.x2, r.y2 + 3, r.x2, r.y2 + th + 3, r.x1, r.y1 + th + 3);
    poly(g, st.face, r.x1, r.y1, r.x2, r.y2, r.x2, r.y2 + th, r.x1, r.y1 + th);
    poly(g, st.top, r.x1, r.y1, r.x2, r.y2, r.x2, r.y2 + 5, r.x1, r.y1 + 5);
    poly(g, st.highlight, r.x1, r.y1, r.x2, r.y2, r.x2, r.y2 + 1.5, r.x1, r.y1 + 1.5);
    if (!r.slide) return;
    const len = r.x2 - r.x1, d = r.downhill, step = 70;
    for (let t = (time * 140) % step; t < len - 10; t += step) {
      const ax = d > 0 ? r.x1 + t : r.x2 - t, ay = r.yAt(ax) + th * 0.55;
      const a = (0.55 + 0.45 * Math.sin(time * 6 + t * 0.05)) * (1 - (t / len) * 0.4);
      poly(g, withAlpha(st.rail, a), ax - d * 8, ay - 4, ax + d * 2, ay, ax - d * 8, ay + 4, ax - d * 4, ay);
    }
  },

  drawSpring(g, s, time) {
    // Tabla elástica de madera sobre cuerdas tensas (antes resorte).
    const floorY = s.y + s.h, squash = s.squash;
    const ext = squash > 0.8 ? 0.45 : 1 + 0.45 * squash * Math.sin(squash * 14);
    const topY = floorY - 6 - (s.h - 6) * ext, oro = rgb(255, 204, 90);
    glowCircle(g, s.cx, topY, 30, withAlpha(oro, 0.14 + 0.06 * Math.sin(time * 5) + 0.35 * squash));
    rr(g, s.x - 4, floorY - 7, s.w + 8, 9, 2, MADERA.oscura);
    line(g, s.x + 6, floorY - 6, s.x + 6, topY + 4, CUERDA, 2.4); line(g, s.x + s.w - 6, floorY - 6, s.x + s.w - 6, topY + 4, CUERDA, 2.4);
    line(g, s.x + 6, floorY - 6, s.x + s.w - 6, topY + 4, CUERDA, 1.6); line(g, s.x + s.w - 6, floorY - 6, s.x + 6, topY + 4, CUERDA, 1.6);
    rr(g, s.x - 3, topY - 1, s.w + 6, 8, 2, MADERA.oscura); rr(g, s.x - 2, topY - 2, s.w + 4, 6, 2, MADERA.base);
    lrtb(g, s.x + 1, topY - 2, s.x + s.w - 1, topY - 0.5, MADERA.luz);
    const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * 7));
    for (let k = 0; k <= 1; k++) {
      const ay = topY - 14 - k * 10 - ((time * 18) % 10);
      poly(g, withAlpha(oro, a * (1 - k * 0.45)), s.cx - 8, ay + 5, s.cx, ay - 3, s.cx + 8, ay + 5, s.cx, ay + 1);
    }
  },

  /** Cristal que bloquea un paso: prismas violetas que se agrietan con los impactos. */
  drawBreakable(g, b, time) {
    const x = b.x, y = b.y, w = b.w, h = b.h, dmg = 1 - clamp(b.hp / b.maxHp, 0, 1);
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + x * 0.02);
    glowRect(g, x - 10, y - 10, x + w + 10, y + h + 10, withAlpha(rgb(170, 90, 255), 0.18 * pulse));
    const cols = Math.max(1, Math.trunc(w / 22)), cw = w / cols, flash = b.flash > 0;
    for (let i = 0; i < cols; i++) {
      const cx0 = x + i * cw, tip = y - 8 + ((i * 37) % 3) * 6;
      poly(g, rgb(34, 16, 58), cx0, y + h, cx0, y + 10, cx0 + cw / 2, tip, cx0 + cw, y + 10, cx0 + cw, y + h);
      poly(g, flash ? WHITE : rgb(128, 72, 210), cx0 + 2, y + h, cx0 + 2, y + 12, cx0 + cw / 2, tip + 5, cx0 + cw - 2, y + 12, cx0 + cw - 2, y + h);
      poly(g, rgb(196, 150, 255), cx0 + 3, y + h - 4, cx0 + 3, y + 14, cx0 + cw / 2 - 1, tip + 8, cx0 + cw / 2 - 1, y + h - 4);
    }
    glowCircle(g, x + w / 2, y + h * 0.55, Math.min(w, h) * 0.3, withAlpha(rgb(230, 190, 255), 0.35 * pulse));
    if (dmg > 0) {
      const cx = x + w / 2, cy = y + h * 0.5, n = Math.trunc(dmg * 6) + 1, l1 = Math.min(w, h) * 0.25, l2 = Math.min(w, h) * 0.5;
      for (let i = 0; i < n; i++) {
        const a = i * 2.2 + x * 0.01;
        line(g, cx, cy, cx + Math.cos(a) * l1, cy + Math.sin(a) * l1, rgb(250, 235, 255), 1.8);
        line(g, cx + Math.cos(a) * l1, cy + Math.sin(a) * l1, cx + Math.cos(a + 0.4) * l2, cy + Math.sin(a + 0.4) * l2, rgb(250, 235, 255), 1.8);
      }
    }
  },

  drawSaw(g, sw, time) {
    // Rueda de hierro oxidado con dientes (antes sierra de metal).
    if (sw.speed > 0) {
      if (sw.axisX) rr(g, sw.min - 6, sw.y - 3, sw.max - sw.min + 12, 6, 3, withAlpha(MADERA.oscura, 0.95));
      else rr(g, sw.x - 3, sw.min - 6, 6, sw.max - sw.min + 12, 3, withAlpha(MADERA.oscura, 0.95));
    }
    const r = sw.r;
    g.save(); g.translate(sw.x, sw.y); g.rotate(sw.angle);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a0 = i * 2 * Math.PI / n, a1 = a0 + 0.24, a2 = a0 + 0.46;
      poly(g, HIERRO.oscuro, Math.cos(a0) * r * 0.84, Math.sin(a0) * r * 0.84, Math.cos(a1) * r * 1.1, Math.sin(a1) * r * 1.1, Math.cos(a2) * r * 0.84, Math.sin(a2) * r * 0.84);
    }
    circle(g, 0, 0, r * 0.9, HIERRO.oscuro); circle(g, 0, 0, r * 0.84, HIERRO.base); circle(g, 0, 0, r * 0.62, HIERRO.oxido);
    for (let i = 0; i < 6; i++) { g.rotate(Math.PI / 3); lrtb(g, -r * 0.05, r * 0.2, r * 0.05, r * 0.62, HIERRO.oscuro); }
    circle(g, 0, 0, r * 0.2, MADERA.oscura); circle(g, 0, 0, r * 0.08, HIERRO.luz);
    g.restore();
  },

  drawMeteor(g, m, time) {
    const red = rgb(255, 70, 60);
    if (m.warn > 0 && !m.flying) {
      const blink = 0.5 + 0.5 * Math.sin(time * (18 + 30 * m.warn)), a = (0.25 + 0.5 * m.warn) * (0.55 + 0.45 * blink);
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let y = Meteor.START_Y; y < m.endY; y += 40) { const y2 = Math.min(y + 22, m.endY); line(g, m.xAt(y), y, m.xAt(y2), y2, withAlpha(red, a), 2.5); }
      const r = 22 - 10 * m.warn;
      g.strokeStyle = css(withAlpha(red, a)); g.lineWidth = 2.5; g.beginPath(); g.arc(m.endX, m.endY - 4, r, 0, Math.PI * 2); g.stroke();
      line(g, m.endX - r - 6, m.endY - 4, m.endX - r + 4, m.endY - 4, withAlpha(red, a), 2.5);
      line(g, m.endX + r - 4, m.endY - 4, m.endX + r + 6, m.endY - 4, withAlpha(red, a), 2.5);
      g.restore();
    }
    if (!m.flying) return;
    const x = m.px, y = m.py, bx = -m.dir * Meteor.SLOPE, by = -1, len = 110;
    for (let i = 6; i >= 1; i--) {
      const k = i / 6;
      glowCircle(g, x + bx * len * k, y + by * len * k, METEOR_R * (1.25 - 0.9 * k), withAlpha(lerpColor(rgb(255, 230, 150), rgb(255, 90, 30), k), 0.55 * (1 - k) + 0.12));
    }
    glowCircle(g, x, y, METEOR_R * 2.2, withAlpha(rgb(255, 140, 50), 0.45));
    circle(g, x, y, METEOR_R, rgb(70, 50, 44)); circle(g, x - 3, y - 3, METEOR_R * 0.55, rgb(120, 86, 70)); circle(g, x + m.dir * 4, y + 5, METEOR_R * 0.35, rgb(255, 180, 80));
  },

  /** Láser azul que baja del techo. */
  /** Fuego que cae del techo (antes láser azul): brasas que gotean de aviso y luego una cortina de llamas. */
  drawCeilingLaser(g, l, time) {
    const y0 = l.floorY;
    rr(g, l.x - 16, y0 - 2, 32, 10, 2, HIERRO.oscuro);
    for (let i = 0; i < 4; i++) lrtb(g, l.x - 12 + i * 7, y0 + 2, l.x - 8 + i * 7, y0 + 8, HIERRO.base);
    if (l.state === 1) {
      for (let i = 0; i < 4; i++) { const ph = (time * 2 + i * 0.25) % 1; glowCircle(g, l.x + Math.sin(i * 2.1) * 6, y0 + 8 + ph * 40, 3 - ph * 2, withAlpha(FUEGO, (1 - ph) * 0.6 * l.k)); }
    } else if (l.state === 2) {
      const grow = clamp(l.k * l.on / 0.1, 0, 1), fade = l.k > 0.85 ? (1 - l.k) / 0.15 : 1, bot = y0 + l.h * grow;
      for (let i = 0; i < 16; i++) {
        const ph = (time * 3.2 + i / 16) % 1, yy = y0 + 8 + (bot - y0 - 8) * ph;
        const rad = (16 * (1 - ph * 0.5) + 5) * (0.8 + 0.2 * Math.sin(time * 25 + i)), xx = l.x + Math.sin(time * 9 + i * 1.7) * 5;
        glowCircle(g, xx, yy, rad, withAlpha(lerpColor(rgb(255, 240, 170), rgb(255, 70, 20), ph), 0.55 * fade * (1 - ph * 0.4)));
      }
    }
  },

  /** Chorro de fuego desde una rejilla del suelo (mismo ritmo que el láser). */
  drawFire(g, l, time) {
    const st = this.st, orange = rgb(255, 130, 40);
    rr(g, l.x - 20, l.floorY - 6, 40, 8, 2, st.dark);
    for (let i = 0; i < 5; i++) lrtb(g, l.x - 17 + i * 7.5, l.floorY - 5, l.x - 13 + i * 7.5, l.floorY, rgb(70, 60, 55));
    const lamp = l.state === 2 ? 1 : l.state === 1 ? 0.5 + 0.5 * Math.sin(time * 30) : 0.15;
    glowCircle(g, l.x, l.floorY - 3, 20, withAlpha(orange, 0.3 * lamp));
    if (l.state === 1) {
      for (let i = 0; i < 4; i++) {
        const ph = (time * 2.2 + i * 0.25) % 1;
        glowCircle(g, l.x + Math.sin(i * 2.1 + time * 5) * 6, l.floorY - 6 - ph * 34, 3 - ph * 2, withAlpha(orange, (1 - ph) * 0.5 * l.k));
      }
    } else if (l.state === 2) {
      const grow = clamp(l.k * l.on / 0.1, 0, 1), fade = l.k > 0.85 ? (1 - l.k) / 0.15 : 1, top = l.floorY - l.h * grow;
      for (let i = 0; i < 16; i++) {
        const ph = (time * 3.2 + i / 16) % 1, yy = l.floorY - 6 - (l.floorY - 6 - top) * ph;
        const rad = (16 * (1 - ph) + 5) * (0.8 + 0.2 * Math.sin(time * 25 + i)), xx = l.x + Math.sin(time * 9 + i * 1.7) * 5 * ph;
        glowCircle(g, xx, yy, rad, withAlpha(lerpColor(rgb(255, 240, 170), rgb(255, 70, 20), ph), 0.55 * fade * (1 - ph * 0.6)));
      }
      glowRect(g, l.x - 4, top + 20, l.x + 4, l.floorY - 6, withAlpha(rgb(255, 250, 220), 0.7 * fade));
    }
  },
};
