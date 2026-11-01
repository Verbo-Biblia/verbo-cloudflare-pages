// Dibujo del mundo (port de render/WorldRenderer.kt, Background.kt, GeometryPainter.kt y TileStyle.kt).
// Trampas de la fase 2: trampas_dibujo.js. Criaturas, jefes y sus ataques: criaturas.js.
import { Physics, ESCALA_PERSONAJES, ZOOM } from './config.js';
import { ALTURAS_OBJETOS } from './objetos_alturas.js';

// Píxeles de arte por unidad del mundo para el jugador: 762 px de alto de los fondos / 760 unidades ≈ 1.
const TINTE_AMBIENTE = new URLSearchParams(location.search).has('tinte') ? +new URLSearchParams(location.search).get('tinte') : 0.55;
const PIXEL_ARTE = new URLSearchParams(location.search).has('px') ? +new URLSearchParams(location.search).get('px') : 1;
import {
  rgb, argb, hex, css, withAlpha, lerpColor, lrtb, rr, poly, circle, glowCircle, glowRect, line, linearV, hh, clamp,
} from './dibujo.js';
import { PlayerPainter, HEROE_ALTO } from './jugador.js';
import { keyColor } from './sesion.js';
import { metodosTrampas } from './trampas_dibujo.js';
import { PintorCriaturas } from './criaturas.js';
import { tr } from './datos.js';

// Paleta de época por escenario (antes metal y luces azules de Sigrun): piedra, madera y bronce con luz cálida.
const STYLES = {
  laboratory: { face: hex('#5a5262'), dark: hex('#241f2c'), top: hex('#7a7082'), highlight: hex('#a89ca8'), rail: hex('#c48c40'), lightA: hex('#ffb35a'), lightB: hex('#ffd98a') },
  space: { face: hex('#5e5446'), dark: hex('#241e18'), top: hex('#7e715c'), highlight: hex('#b0a080'), rail: hex('#c48c40'), lightA: hex('#ffb35a'), lightB: hex('#ffd98a') },
  destroyed_city: { face: hex('#6a5e58'), dark: hex('#28201e'), top: hex('#8a7c72'), highlight: hex('#b8a898'), rail: hex('#c2622f'), lightA: hex('#ff8a4a'), lightB: hex('#ffc070') },
  spaceship_interior: { face: hex('#4a4250'), dark: hex('#1c1822'), top: hex('#665c6c'), highlight: hex('#948898'), rail: hex('#c48c40'), lightA: hex('#ffa850'), lightB: hex('#ffd080') },
  floating_wreckage: { face: hex('#55505e'), dark: hex('#211e28'), top: hex('#736c7c'), highlight: hex('#a49cac'), rail: hex('#c48c40'), lightA: hex('#ffb35a'), lightB: hex('#ffe0a0') },
};

const imgCache = {};
export function loadImage(path) {
  if (!path) return null;
  if (imgCache[path]) return imgCache[path];
  const im = new Image(); im.src = 'assets/' + path; imgCache[path] = im;
  return im;
}
const ready = (im) => im && im.complete && im.naturalWidth > 0;
// Materiales de época para los elementos del recorrido.
const MADERA = { luz: rgb(176, 124, 74), base: rgb(132, 86, 48), media: rgb(118, 76, 42), oscura: rgb(58, 36, 22) };
const PIEDRA = { luz: rgb(170, 160, 172), base: rgb(116, 108, 124), media: rgb(98, 90, 108), oscura: rgb(48, 42, 56) };
const BRONCE = rgb(196, 140, 64), CUERDA = rgb(188, 156, 104);
const SUELO_POR_ESCENARIO = { laboratory: 'ciudad', destroyed_city: 'ciudad', space: 'monte', floating_wreckage: 'monte', spaceship_interior: 'cueva' };

export class WorldRenderer {
  constructor(level, data) {
    this.st = STYLES[level.environmentType] || STYLES.laboratory;
    this.bg = loadImage(data.media[level.backgroundId]);
    // Suelo de época (texturas de Codex) en lugar del piso metálico: piedra de ciudad, roca de cueva o tierra de monte.
    const suelo = SUELO_POR_ESCENARIO[level.environmentType] || 'ciudad';
    this.sueloCara = loadImage(`suelo/${suelo}_cara.webp`);
    this.sueloBorde = loadImage(`suelo/${suelo}_borde.webp`);
    this.mid = level.midgroundId ? loadImage(data.media[level.midgroundId]) : null;
    this.midH = level.midgroundH; this.midBase = level.midgroundBase;
    this.data = data;
    this.player = new PlayerPainter();
    this.criaturas = new PintorCriaturas();
  }

  scaleFor(viewH, zoom = ZOOM) { return viewH / Physics.WORLD_HEIGHT * zoom; }

  /** Dibuja con `dibujar(ctx)` en un búfer de baja resolución y lo pega ampliado sin suavizar (pixel art). */
  pixelado(g, x0, y0, w, h, dibujar) {
    const r = PIXEL_ARTE, off = this._pix ??= document.createElement('canvas');
    const cw = Math.ceil(w * r), ch = Math.ceil(h * r);
    if (off.width !== cw || off.height !== ch) { off.width = cw; off.height = ch; }
    const o = off.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, cw, ch);
    o.setTransform(r, 0, 0, r, -x0 * r, -y0 * r);
    dibujar(o);
    // Luz del escenario sobre el personaje (Juan: la luz caía distinto en él que en el fondo): se tiñe con el color
    // medio del fondo del nivel, solo donde hay dibujo.
    const amb = this.ambiente();
    if (amb) {
      // Multiplica por el color de la luz ambiente (normalizado y mezclado con blanco) y repone la transparencia
      // con una copia: así tiñe y oscurece como al escenario sin aclarar los contornos.
      const m = Math.max(1, ...amb), mezcla = (c) => Math.round(255 + ((c / m) * 235 - 255) * TINTE_AMBIENTE);
      const copia = this._pixCopia ??= document.createElement('canvas');
      copia.width = cw; copia.height = ch; copia.getContext('2d').drawImage(off, 0, 0);
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'multiply'; o.fillStyle = `rgb(${mezcla(amb[0])},${mezcla(amb[1])},${mezcla(amb[2])})`; o.fillRect(0, 0, cw, ch);
      o.globalCompositeOperation = 'destination-in'; o.drawImage(copia, 0, 0);
      o.globalCompositeOperation = 'source-over';
    }
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(off, x0, y0, cw / r, ch / r); g.restore();
  }

  /** Color medio del fondo del nivel (se calcula una vez cuando la imagen ya cargó). */
  ambiente() {
    const img = this.bg;
    if (this._amb && this._ambDe === img) return this._amb;
    if (!ready(img)) return null;
    try {
      const c = document.createElement('canvas'); c.width = 16; c.height = 8;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, 16, 8);
      const d = x.getImageData(0, 0, 16, 8).data; let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; this._amb = [Math.round(r / n), Math.round(gg / n), Math.round(b / n)];
    } catch { this._amb = null; }
    this._ambDe = img;
    return this._amb;
  }

  draw(g, s, viewW, viewH) {
    const scale = this.scaleFor(viewH, s.zoom ?? ZOOM), worldViewW = viewW / scale;
    s.viewWorldW = worldViewW; s.viewWorldH = viewH / scale;
    const shakeX = (Math.random() - 0.5) * s.shake, shakeY = (Math.random() - 0.5) * s.shake;
    const camX = s.camX, time = s.time, w = s.world;
    g.save();
    g.translate(shakeX * scale, shakeY * scale);
    g.scale(scale, scale);
    g.translate(-camX, -(s.camY ?? 0));
    this.background(g, camX, worldViewW, time);
    const left = camX - 60, right = camX + worldViewW + 60;
    const visible = (x, bw) => x + bw > left && x < right;

    this.drawAbyss(g, camX, worldViewW, time);
    for (const z of w.gravityZones) if (visible(z.x, z.w)) this.drawGravityZone(g, z, time);
    for (const b of w.backs) if (visible(b.x, b.w)) this.drawBackWall(g, b, time);
    for (const d of w.ducts) if (visible(d.x, d.w)) this.drawDuct(g, d, time);
    for (const l of w.ladders) if (visible(l.x, l.w)) this.drawLadder(g, l);
    for (const sd of w.solids) if (!w.isDynamicSolid(sd) && visible(sd.x, sd.w)) this.drawSolid(g, sd, time);
    for (const wi of w.windows) if (visible(wi.x - 10, wi.w + 20)) this.drawWindow(g, wi);
    for (const d of w.autoDoors) if (visible(d.x - 10, d.w + 20)) this.drawAutoDoor(g, d, time);
    for (const sh of w.shocks) if (visible(sh.x, sh.w)) this.drawShock(g, sh, time);
    for (const cv of w.conveyors) if (visible(cv.x - 20, cv.w + 40)) this.drawConveyor(g, cv, time);
    for (const pr of w.props) if (visible(pr.x - 150, 300)) this.drawProp(g, pr, time);
    for (const cr of w.crumbles) if (visible(cr.x, cr.w)) this.drawCrumble(g, cr, time);
    const nodesLeft = w.targets.filter((t) => !t.dead).length;
    for (const b of w.barriers) if (visible(b.x - 10, b.w + 20)) this.drawBarrier(g, b, time, nodesLeft);
    for (const d of w.doors) if (visible(d.x - 12, d.w + 24)) this.drawDoor(g, d, time, s.hasKey(d.key));
    for (const tg of w.targets) if (visible(tg.x - 40, tg.w + 80)) this.drawTarget(g, tg, time);
    for (const br of w.breakables) if (!br.dead && visible(br.x - 10, br.w + 20)) this.drawBreakable(g, br, time);
    for (const gu of w.guillotines) if (visible(gu.x - 20, gu.w + 40)) this.drawGuillotine(g, gu, time);
    for (const o of w.oneWays) if (visible(o.x, o.w)) this.drawOneWay(g, o);
    for (const r of w.ramps) if (visible(r.x1, r.x2 - r.x1)) this.drawRamp(g, r, time);
    for (const sp of w.springs) if (visible(sp.x - 30, sp.w + 60)) this.drawSpring(g, sp, time);
    for (const m of w.moving) this.drawMoving(g, m, time);
    for (const hz of w.hazards) if (visible(hz.x, hz.w)) this.drawHazard(g, hz, time);
    for (const l of w.lasers) if (visible(l.x - 20, 40)) this.drawLaser(g, l, time);
    for (const sw of w.saws) if (visible(sw.x - sw.r - 10, sw.r * 2 + 20) || (sw.axisX && visible(sw.min - sw.r, sw.max - sw.min + sw.r * 2))) this.drawSaw(g, sw, time);
    for (const m of w.meteors) if (m.active && visible(m.x - 440, 880)) this.drawMeteor(g, m, time);
    for (const k of w.keys) if (!k.taken && visible(k.x - 30, 90)) this.drawKey(g, k, time);
    for (const cp of w.checkpoints) if (visible(cp.x - 30, 60)) this.drawCheckpoint(g, cp, time);
    for (const pk of s.pickups) if (!pk.taken && visible(pk.x, pk.w)) this.drawPickup(g, pk, time);
    this.drawGoal(g, w.goal, time);
    s.fx.drawBack(g);
    // Pilares de sombra del Leviatán (detrás de los personajes).
    const bst = s.boss?.boss;
    if (bst && bst.pylons.length) this.criaturas.drawPylons(g, s.boss, bst, time);
    for (const e of s.enemies) if (!e.dead && visible(e.x - 60, e.w + 120)) this.criaturas.drawEnemy(g, e, s, time);
    this.criaturas.drawBossAttacks(g, s, time);
    for (const b of s.bullets) if (b.kind === 'ONDA') this.drawOndaFuego(g, b, time); else this.drawLightArrow(g, b);
    for (const b of s.enemyBullets) this.criaturas.drawEnemyBullet(g, b, time);
    // El jugador se dibuja en pixel art (Juan: con trazos suaves no lucía sobre los fondos de pixel art): se pinta en
    // una imagen pequeña de PIXEL_ARTE píxeles por unidad y se amplía sin suavizar.
    const pl = s.player;
    const k = ESCALA_PERSONAJES;  // el búfer crece con el dibujo para no cortarle la cabeza
    this.pixelado(g, pl.cx - 120 * k, pl.y + pl.h - 150 * k, 240 * k, 170 * k, (o) => this.player.draw(o, pl, time));
    s.fx.drawFront(g);
    g.restore();
    if (s.screenFlash > 0) { g.fillStyle = css(argb(Math.min(0.48, s.screenFlash * 0.48) * 255, 190, 238, 255)); g.fillRect(0, 0, viewW, viewH); }
    this.drawBossBar(g, s, viewW, viewH);
  }

  /** Barra de vida del jefe (arriba, al centro de la pantalla) mientras pelea. */
  drawBossBar(g, s, viewW, viewH) {
    const bosses = [s.boss, s.partner].filter((b) => b && !b.dead && b.boss && b.boss.move !== 'SLEEP');
    if (!bosses.length) return;
    const k = viewH / 760, w = Math.min(viewW * 0.5, 520 * k), x = (viewW - w) / 2;
    let y = 46 * k;
    g.save(); g.textAlign = 'center'; g.font = `bold ${Math.round(13 * k)}px system-ui, sans-serif`;
    g.fillStyle = css(rgb(235, 225, 255));
    g.fillText(s.partner ? (s.boss.def.introTitle ?? s.boss.def.name) : s.boss.def.name, viewW / 2, y - 6 * k);
    for (const b of bosses) {
      rr(g, x, y, w, 10 * k, 5 * k, argb(190, 8, 4, 16));
      rr(g, x + 2 * k, y + 2 * k, (w - 4 * k) * Math.max(0, b.hp / b.maxHp), 6 * k, 3 * k, b.boss.desperate ? rgb(255, 70, 70) : rgb(170, 90, 255));
      y += 14 * k;
    }
    g.restore();
  }
  // ------------------------------------------------------------------ fondo con parallax (Background.kt)
  background(g, camX, viewW, time) {
    const h = Physics.WORLD_HEIGHT;
    lrtb(g, camX, 0, camX + viewW, h, rgb(7, 16, 24));
    const img = this.bg;
    if (!ready(img)) this.fallback(g, camX, viewW);
    else {
      const drawW = h * img.naturalWidth / img.naturalHeight, base = camX * (1 - 0.3);
      let k = Math.floor((camX - base) / drawW), x = base + k * drawW;
      while (x < camX + viewW) {
        if ((k & 1) === 0) g.drawImage(img, x, 0, drawW, h);
        else { g.save(); g.translate(x + drawW / 2, 0); g.scale(-1, 1); g.drawImage(img, -drawW / 2, 0, drawW, h); g.restore(); }
        x += drawW; k++;
      }
      lrtb(g, camX, 0, camX + viewW, h, argb(46, 5, 8, 15));
    }
    if (ready(this.mid)) {
      const img2 = this.mid, drawW = this.midH * img2.naturalWidth / img2.naturalHeight, base = camX * (1 - 0.6);
      const ih = img2.naturalHeight, bajo = Physics.WORLD_HEIGHT - this.midBase;
      let k = Math.floor((camX - base) / drawW) - 1, x = base + k * drawW;
      while (x < camX + viewW) {
        g.drawImage(img2, x, this.midBase - this.midH, drawW, this.midH);
        // La capa va pegada al suelo; sobre los fosos se prolonga su última franja hasta abajo (sin corte ni difuminado).
        if (bajo > 0) g.drawImage(img2, 0, ih - 3, img2.naturalWidth, 3, x, this.midBase - 1, drawW, bajo + 1);
        x += drawW; k++;
      }
    }
    g.fillStyle = linearV(g, 430, 760, argb(0, 8, 14, 20), argb(133, 5, 8, 12));
    g.fillRect(camX, 430, viewW, 330);
  }
  fallback(g, camX, viewW) {
    let x = Math.floor(camX / 280) * 280 - 280;
    while (x < camX + viewW + 300) {
      const bh = 90 + Math.trunc((((x / 280) % 4) + 4) % 4) * 30;
      lrtb(g, x, 660 - bh, x + 190, 660, rgb(20, 39, 67)); x += 280;
    }
  }

  // ------------------------------------------------------------------ geometría (GeometryPainter.kt)
  drawAbyss(g, camX, viewW, time) {
    g.fillStyle = linearV(g, 600, 675, argb(0, 4, 6, 12), argb(245, 4, 6, 12)); g.fillRect(camX, 600, viewW, 160);
    const a = 0.35 + 0.12 * Math.sin(time * 3);
    g.fillStyle = linearV(g, 630, 760, argb(0, 255, 60, 40), withAlpha(rgb(255, 60, 40), a)); g.fillRect(camX, 630, viewW, 130);
  }

  drawSolid(g, s, time) {
    if (ready(this.sueloCara) && ready(this.sueloBorde)) { this.drawSolidEpoca(g, s); return; }
    const st = this.st, x = s.x, y = s.y, w = s.w, h = s.h;
    lrtb(g, x, y, x + w, y + h, st.face);
    g.fillStyle = linearV(g, y + 12, y + Math.max(40, h), argb(0, 0, 0, 0), withAlpha(st.dark, 0.85)); g.fillRect(x, y + 12, w, h - 12);
    lrtb(g, x, y, x + 3, y + h, withAlpha(st.dark, 0.9)); lrtb(g, x + w - 3, y, x + w, y + h, withAlpha(st.dark, 0.9));
    let gx = Math.floor(x / 96) * 96 + 96;
    while (gx < x + w - 8) { lrtb(g, gx - 1, y + 12, gx + 1, y + h, withAlpha(st.dark, 0.7)); gx += 96; }
    let gy = y + 40;
    while (gy < y + h - 12) { lrtb(g, x + 3, gy, x + w - 3, gy + 2, withAlpha(st.dark, 0.7)); gy += 64; }
    if (h >= 34) {
      let lx = Math.floor(x / 192) * 192 + 60;
      while (lx < x + w - 30) {
        if (lx > x + 8) {
          const col = (Math.floor(lx / 192) & 1) === 0 ? st.lightA : st.lightB;
          let ly = y + 22;
          while (ly < y + h - 10) {
            rr(g, lx - 2, ly - 2, 30, 8, 2, withAlpha(st.dark, 0.9));
            rr(g, lx, ly, 26, 4, 2, col);
            glowCircle(g, lx + 13, ly + 2, 16, withAlpha(col, 0.18 + 0.06 * Math.sin(time * 2 + lx * 0.01)));
            ly += 64;
          }
        }
        lx += 192;
      }
    }
    lrtb(g, x, y, x + w, y + 10, st.top);
    lrtb(g, x + 2, y, x + w - 2, y + 2, st.highlight);
    lrtb(g, x, y + 10, x + w, y + 13, withAlpha(st.dark, 0.8));
    poly(g, st.dark, x, y, x + 5, y, x, y + 5);
    poly(g, st.dark, x + w, y, x + w - 5, y, x + w, y + 5);
    let rx = Math.floor(x / 48) * 48 + 24;
    while (rx < x + w - 6) { if (rx > x + 6) circle(g, rx, y + 5.5, 1.8, withAlpha(st.dark, 0.85)); rx += 48; }
  }

  /** Suelo de época: textura repetida (1 píxel por unidad, como los fondos), oscurecida hacia abajo, con su borde
   * de losas/musgo/pasto arriba y bordes laterales oscuros. Sin las luces ni remaches del piso metálico. */
  drawSolidEpoca(g, s) {
    const st = this.st, x = s.x, y = s.y, w = s.w, h = s.h;
    const cara = this._patCara ??= g.createPattern(this.sueloCara, 'repeat');
    const borde = this._patBorde ??= g.createPattern(this.sueloBorde, 'repeat-x');
    g.save(); g.imageSmoothingEnabled = false;
    g.fillStyle = cara; g.fillRect(x, y, w, h);
    g.fillStyle = linearV(g, y + 6, y + Math.max(60, Math.min(h, 220)), argb(40, 6, 6, 14), argb(215, 6, 6, 14)); g.fillRect(x, y + 6, w, h - 6);
    const bh = Math.min(h, this.sueloBorde.naturalHeight);
    g.translate(0, y); g.fillStyle = borde; g.fillRect(x, 0, w, bh); g.translate(0, -y);
    lrtb(g, x, y, x + 3, y + h, argb(160, 8, 8, 16)); lrtb(g, x + w - 3, y, x + w, y + h, argb(160, 8, 8, 16));
    g.restore();
  }

  // ── Elementos del recorrido de época (madera, cuerda, piedra, bronce) en lugar del metal de Sigrun ──
  drawLadder(g, l) {
    const railW = 6;
    for (const rx of [l.x, l.x + l.w - railW]) {
      lrtb(g, rx - 1, l.y, rx + railW + 1, l.y + l.h, MADERA.oscura);
      lrtb(g, rx, l.y, rx + railW, l.y + l.h, MADERA.base);
      lrtb(g, rx, l.y, rx + 1.5, l.y + l.h, MADERA.luz);
    }
    let ry = l.y + 12;
    while (ry < l.y + l.h - 4) {
      lrtb(g, l.x + railW - 1, ry + 1, l.x + l.w - railW + 1, ry + 6, MADERA.oscura);
      lrtb(g, l.x + railW, ry, l.x + l.w - railW, ry + 4, MADERA.base);
      lrtb(g, l.x + railW, ry, l.x + l.w - railW, ry + 1.2, MADERA.luz);
      for (const rx of [l.x + railW - 1, l.x + l.w - railW - 2]) lrtb(g, rx, ry - 1, rx + 3, ry + 5, CUERDA);  // amarres
      ry += 24;
    }
  }

  drawOneWay(g, o) {
    // Puente de tablones con barandal de cuerda.
    let px = o.x + 4;
    while (px < o.x + o.w - 2) { lrtb(g, px, o.y - 14, px + 3, o.y, MADERA.oscura); px += 40; }
    lrtb(g, o.x + o.w - 5, o.y - 14, o.x + o.w - 2, o.y, MADERA.oscura);
    g.strokeStyle = css(CUERDA); g.lineWidth = 1.6; g.beginPath(); g.moveTo(o.x + 5, o.y - 12);
    for (let x = o.x + 5; x <= o.x + o.w - 4; x += 40) g.quadraticCurveTo(x + 20, o.y - 7, Math.min(x + 40, o.x + o.w - 4), o.y - 12);
    g.stroke();
    lrtb(g, o.x, o.y, o.x + o.w, o.y + o.h, MADERA.oscura);
    let tx = o.x;
    while (tx < o.x + o.w) {
      const tw = Math.min(22, o.x + o.w - tx);
      lrtb(g, tx + 1, o.y, tx + tw - 1, o.y + o.h - 2, (Math.trunc(tx / 22) & 1) ? MADERA.base : MADERA.media);
      lrtb(g, tx + 1, o.y, tx + tw - 1, o.y + 1.5, MADERA.luz);
      tx += 22;
    }
  }

  drawMoving(g, m, time) {
    // Losa de piedra que flota sostenida por una luz dorada suave.
    const brillo = 0.7 + 0.3 * Math.sin(time * 3 + m.x);
    const rg = g.createRadialGradient(m.x + m.w / 2, m.y + m.h + 6, 0, m.x + m.w / 2, m.y + m.h + 6, m.w * 0.6);
    rg.addColorStop(0, `rgba(255,214,120,${0.35 * brillo})`); rg.addColorStop(1, 'rgba(255,214,120,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rg; g.fillRect(m.x - m.w * 0.2, m.y, m.w * 1.4, m.h + 30); g.restore();
    rr(g, m.x, m.y, m.w, m.h, 3, PIEDRA.oscura);
    rr(g, m.x + 1, m.y + 1, m.w - 2, m.h - 3, 3, PIEDRA.base);
    lrtb(g, m.x + 2, m.y + 1, m.x + m.w - 2, m.y + 3, PIEDRA.luz);
    for (let x = m.x + 18; x < m.x + m.w - 8; x += 28) lrtb(g, x, m.y + 3, x + 1.5, m.y + m.h - 2, PIEDRA.oscura);
  }

  drawHazard(g, hz, time) {
    const n = Math.max(1, Math.trunc(hz.w / 16)), sw = hz.w / n;
    lrtb(g, hz.x, hz.y + hz.h - 5, hz.x + hz.w, hz.y + hz.h + 2, this.st.dark);
    for (let i = 0; i < n; i++) {
      const x = hz.x + i * sw;
      poly(g, rgb(96, 104, 124), x, hz.y + hz.h - 4, x + sw / 2, hz.y - 4, x + sw, hz.y + hz.h - 4);
      poly(g, rgb(150, 160, 182), x + sw * 0.3, hz.y + hz.h - 4, x + sw / 2, hz.y - 4, x + sw * 0.5, hz.y + hz.h - 4);
      poly(g, rgb(255, 70, 60), x + sw * 0.38, hz.y + 2, x + sw / 2, hz.y - 4, x + sw * 0.62, hz.y + 2);
    }
    glowRect(g, hz.x, hz.y - 8, hz.x + hz.w, hz.y + hz.h, withAlpha(rgb(255, 60, 40), 0.2 + 0.1 * Math.sin(time * 5)));
  }

  drawCheckpoint(g, cp, time) {
    // Punto de descanso: lámpara de aceite sobre un pedestal; se enciende al pasar.
    const cx = cp.x + 5, base = cp.y + cp.h;
    rr(g, cx - 10, base - 8, 20, 8, 2, PIEDRA.oscura);
    lrtb(g, cx - 5, cp.y + 14, cx + 5, base - 7, PIEDRA.base); lrtb(g, cx - 5, cp.y + 14, cx - 3, base - 7, PIEDRA.luz);
    rr(g, cx - 8, cp.y + 8, 16, 7, 3, rgb(150, 92, 52));  // lámpara de barro
    if (cp.active) {
      const f = 1 + 0.15 * Math.sin(time * 14);
      glowCircle(g, cx + 4, cp.y + 2, 30, withAlpha(rgb(255, 170, 70), 0.35 + 0.1 * Math.sin(time * 6)));
      poly(g, rgb(255, 150, 50), cx + 1, cp.y + 8, cx + 4, cp.y + 8 - 9 * f, cx + 7, cp.y + 8);
      poly(g, rgb(255, 236, 160), cx + 3, cp.y + 8, cx + 4, cp.y + 8 - 5 * f, cx + 5, cp.y + 8);
    }
  }

  drawGoal(g, gl, time) {
    // Salida: arco de piedra con luz cálida que invita a seguir adelante.
    const a = 0.55 + 0.15 * Math.sin(time * 3);
    g.fillStyle = linearV(g, gl.y, gl.y + gl.h, withAlpha(rgb(255, 230, 160), a), withAlpha(rgb(255, 170, 70), a * 0.6));
    g.fillRect(gl.x + 4, gl.y + 2, gl.w - 8, gl.h - 2);
    glowCircle(g, gl.x + gl.w / 2, gl.y + gl.h / 2, Math.min(110, gl.h), withAlpha(rgb(255, 210, 120), 0.28));
    lrtb(g, gl.x - 10, gl.y - 6, gl.x + 4, gl.y + gl.h, PIEDRA.base); lrtb(g, gl.x + gl.w - 4, gl.y - 6, gl.x + gl.w + 10, gl.y + gl.h, PIEDRA.base);
    lrtb(g, gl.x - 10, gl.y - 6, gl.x - 7, gl.y + gl.h, PIEDRA.luz); lrtb(g, gl.x + gl.w + 7, gl.y - 6, gl.x + gl.w + 10, gl.y + gl.h, PIEDRA.oscura);
    g.fillStyle = css(PIEDRA.base); g.beginPath(); g.moveTo(gl.x - 12, gl.y - 4);
    g.quadraticCurveTo(gl.x + gl.w / 2, gl.y - 48, gl.x + gl.w + 12, gl.y - 4); g.lineTo(gl.x + gl.w + 12, gl.y + 4);
    g.quadraticCurveTo(gl.x + gl.w / 2, gl.y - 32, gl.x - 12, gl.y + 4); g.closePath(); g.fill();
    let ly = gl.y + ((time * 30) % 18);
    while (ly < gl.y + gl.h) { lrtb(g, gl.x + 6, ly, gl.x + gl.w - 6, ly + 1.2, withAlpha(rgb(255, 255, 230), 0.22)); ly += 18; }
  }

  drawCrumble(g, cr, time) {
    // Losa de piedra agrietada que se desmorona al pisarla.
    const shakeX = cr.timer >= 0 && !cr.falling ? Math.sin(time * 70) * 2.2 : 0;
    const x = cr.x + shakeX, y = cr.y, w = cr.w, h = cr.h;
    const alpha = cr.falling ? clamp(1 - cr.respawn / 0.9, 0, 1) : 1;
    if (alpha <= 0) return;
    const a = (c) => withAlpha(c, alpha * c[3] / 255);
    lrtb(g, x, y, x + w, y + h, a(PIEDRA.oscura));
    lrtb(g, x + 1, y + 1, x + w - 1, y + h - 2, a(PIEDRA.media));
    lrtb(g, x + 1, y, x + w - 1, y + 2, a(PIEDRA.luz));
    let gx = x + 14, i = 0;
    while (gx < x + w - 8) {
      const d = i % 2 === 0 ? 6 : -5, grieta = cr.timer >= 0 ? rgb(255, 120, 60) : PIEDRA.oscura;
      line(g, gx, y + 1, gx + d, y + h * 0.5, a(grieta), 1.5); line(g, gx + d, y + h * 0.5, gx + d * 0.3, y + h - 2, a(grieta), 1.5);
      gx += 30; i++;
    }
  }

  drawLaser(g, l, time) {
    // De época: los láseres del suelo son chorros de fuego y los del techo, fuego que cae.
    if (!l.ceiling) { this.drawFire(g, l, time); return; }
    if (l.ceiling) { this.drawCeilingLaser(g, l, time); return; }
    const st = this.st, red = rgb(255, 60, 80);
    rr(g, l.x - 16, l.floorY - 7, 32, 9, 3, st.dark);
    const lamp = l.state === 2 ? 1 : l.state === 1 ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 40)) : 0.18;
    rr(g, l.x - 10, l.floorY - 5, 20, 4, 2, lerpColor(rgb(90, 30, 40), red, lamp));
    glowCircle(g, l.x, l.floorY - 3, 22, withAlpha(red, 0.35 * lamp));
    if (l.state === 1) glowRect(g, l.x - 1, l.floorY - l.h, l.x + 1, l.floorY - 6, withAlpha(red, 0.18 + 0.22 * l.k));
    else if (l.state === 2) {
      const grow = clamp(l.k * l.on / 0.06, 0, 1), fade = l.k > 0.85 ? (1 - l.k) / 0.15 : 1;
      const top = l.floorY - l.h * grow, wob = 1 + 0.18 * Math.sin(time * 60);
      glowRect(g, l.x - 13 * wob, top, l.x + 13 * wob, l.floorY - 4, withAlpha(red, 0.35 * fade));
      glowRect(g, l.x - 5, top, l.x + 5, l.floorY - 4, withAlpha(red, 0.8 * fade));
      lrtb(g, l.x - 1.8, top, l.x + 1.8, l.floorY - 4, withAlpha(rgb(255, 225, 230), fade));
      glowCircle(g, l.x, top, 10 * wob, withAlpha(red, 0.5 * fade));
    }
  }

  drawKey(g, k, time) {
    // Llave de bronce con una piedra del color de su puerta.
    const col = keyColor(k.id), bob = Math.sin(time * 3.5 + k.x * 0.01) * 5, cx = k.cx, cy = k.cy + bob;
    glowCircle(g, cx, cy, 30, withAlpha(col, 0.22 + 0.1 * Math.sin(time * 5)));
    g.save(); g.translate(cx, cy); g.rotate(Math.sin(time * 2) * 12 * Math.PI / 180);
    g.lineWidth = 4; g.strokeStyle = css(rgb(60, 36, 16)); g.beginPath(); g.arc(-8, 0, 7, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2.6; g.strokeStyle = css(BRONCE); g.beginPath(); g.arc(-8, 0, 7, 0, Math.PI * 2); g.stroke();
    lrtb(g, -2, -2, 16, 2, BRONCE); lrtb(g, 10, 2, 13, 7, BRONCE); lrtb(g, 14, 2, 16, 6, BRONCE);
    circle(g, -8, 0, 3, col);
    g.restore();
  }

  drawDoor(g, d, time, hasKey) {
    // Puerta de madera con bandas de bronce; la cerradura lleva la piedra del color de su llave. Sube al abrirse.
    const col = keyColor(d.key);
    lrtb(g, d.x - 10, d.y - 14, d.x + d.w + 10, d.y, PIEDRA.oscura);
    lrtb(g, d.x - 10, d.y - 14, d.x + d.w + 10, d.y - 9, PIEDRA.base);
    const slide = d.open * d.h, top = d.y, bottom = d.y + d.h - slide;
    if (bottom <= top + 1) return;
    g.save(); g.beginPath(); g.rect(d.x, top, d.w, bottom - top); g.clip();
    const oy = -slide;
    lrtb(g, d.x, top, d.x + d.w, bottom, MADERA.base);
    for (let x = d.x + 7; x < d.x + d.w - 2; x += 8) lrtb(g, x, top, x + 1.2, bottom, MADERA.oscura);
    lrtb(g, d.x, top, d.x + 3, bottom, MADERA.oscura); lrtb(g, d.x + d.w - 3, top, d.x + d.w, bottom, MADERA.oscura);
    for (let yy = d.y + oy + 18; yy < d.y + oy + d.h - 8; yy += 52) { lrtb(g, d.x, yy, d.x + d.w, yy + 5, BRONCE); circle(g, d.x + 6, yy + 2.5, 1.6, MADERA.oscura); circle(g, d.x + d.w - 6, yy + 2.5, 1.6, MADERA.oscura); }
    const ly = d.y + oy + d.h * 0.45;
    rr(g, d.x + d.w / 2 - 9, ly - 12, 18, 24, 4, BRONCE);
    const blink = hasKey ? 0.6 + 0.4 * Math.sin(time * 8) : 0.85;
    circle(g, d.x + d.w / 2, ly - 2, 5, withAlpha(d.opening ? rgb(255, 230, 150) : col, blink));
    lrtb(g, d.x + d.w / 2 - 1.5, ly + 2, d.x + d.w / 2 + 1.5, ly + 8, rgb(40, 24, 12));
    g.restore();
    glowCircle(g, d.x + d.w / 2, d.y + d.h * 0.45 - slide, 34, withAlpha(col, 0.12 + 0.06 * Math.sin(time * 3)));
  }

  drawTarget(g, t, time) {
    // Ídolo de Baal (Codex, arte/idolo/): entero, agrietado desde la mitad de la vida y derribado. Si las imágenes
    // no cargaron, queda el ídolo dibujado por código de abajo.
    const est = t.dead ? 3 : t.hp <= t.maxHp / 2 ? 2 : 1, im = loadImage(`props/idolo_baal_${est}.webp`);
    if (ready(im)) {
      const x = t.x, y = t.y, w = t.w, h = t.h, alto = h * 1.45, ancho = alto * im.naturalWidth / im.naturalHeight;
      const temblor = t.flash > 0 ? (Math.random() - 0.5) * 5 : 0;
      if (!t.dead) {  // resplandor rojo de los ojos que late
        const pulso = 0.7 + 0.3 * Math.sin(time * 5 + x * 0.1);
        glowCircle(g, x + w / 2, y + h - alto * 0.78, w * 0.7, withAlpha(rgb(255, 60, 40), (est === 1 ? 0.28 : 0.16) * pulso));
      }
      g.drawImage(im, x + w / 2 - ancho / 2 + temblor, y + h - alto, ancho, alto);
      if (t.flash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(0.6, t.flash * 4); g.drawImage(im, x + w / 2 - ancho / 2 + temblor, y + h - alto, ancho, alto); g.restore(); }
      if (!t.dead) {
        const ratio = clamp(t.hp / t.maxHp, 0, 1);
        rr(g, x - 4, y + h - alto - 12, w + 8, 5, 2, argb(173, 4, 8, 12));
        rr(g, x - 3, y + h - alto - 11, (w + 6) * ratio, 3, 1.5, rgb(255, 70, 90));
      }
      return;
    }
    const x = t.x, y = t.y, w = t.w, h = t.h, core = rgb(255, 70, 90);
    if (t.dead) {
      poly(g, PIEDRA.oscura, x - 4, y + h, x + 6, y + h * 0.7, x + w * 0.4, y + h * 0.78, x + w * 0.65, y + h * 0.62, x + w + 4, y + h * 0.8, x + w + 6, y + h);
      poly(g, PIEDRA.base, x + 2, y + h, x + 10, y + h * 0.8, x + w * 0.5, y + h * 0.84, x + w - 2, y + h);
      return;
    }
    rr(g, x - 6, y + h - 12, w + 12, 12, 2, PIEDRA.oscura);
    poly(g, t.flash > 0 ? rgb(255, 255, 255) : PIEDRA.base, x + 2, y + h - 12, x + 4, y + 18, x + w / 2, y + 2, x + w - 4, y + 18, x + w - 2, y + h - 12);
    poly(g, PIEDRA.luz, x + 4, y + h - 12, x + 6, y + 18, x + w / 2, y + 4, x + w / 2 - 2, y + 20, x + 8, y + h - 12);
    lrtb(g, x + 6, y + h * 0.62, x + w - 6, y + h * 0.62 + 2, PIEDRA.oscura);
    const pulse = 0.75 + 0.25 * Math.sin(time * 5 + x * 0.1), cy = y + h * 0.36;
    glowCircle(g, x + w / 2, cy, w * 0.8, withAlpha(core, 0.3 * pulse));
    g.fillStyle = css(rgb(20, 10, 16)); g.beginPath(); g.ellipse(x + w / 2, cy, w * 0.26, w * 0.15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = css(core); g.beginPath(); g.ellipse(x + w / 2, cy, w * 0.2 * pulse, w * 0.11, 0, 0, Math.PI * 2); g.fill();
    const ratio = clamp(t.hp / t.maxHp, 0, 1);
    rr(g, x - 4, y - 14, w + 8, 5, 2, argb(173, 4, 8, 12));
    rr(g, x - 3, y - 13, (w + 6) * ratio, 3, 1.5, core);
  }

  drawBarrier(g, b, time, nodesLeft) {
    // Velo de sombra que se disipa al derribar los ídolos.
    const col = rgb(140, 90, 220);
    lrtb(g, b.x - 8, b.y - 10, b.x + b.w + 8, b.y + 6, PIEDRA.oscura);
    lrtb(g, b.x - 8, b.y - 10, b.x + b.w + 8, b.y - 5, PIEDRA.base);
    for (let i = 0; i < nodesLeft; i++) circle(g, b.x + b.w / 2 + (i - (nodesLeft - 1) / 2) * 10, b.y - 2, 3, rgb(255, 70, 90));
    const a = 1 - b.off;
    if (a <= 0) return;
    const top = b.y + 6 + (b.h - 6) * b.off;
    glowRect(g, b.x - 8, top, b.x + b.w + 8, b.y + b.h, withAlpha(rgb(30, 10, 50), 0.55 * a));
    for (let i = 0; i < 5; i++) {
      const fx = b.x + b.w * (i + 0.5) / 5 + Math.sin(time * 2 + i) * 3, fy = b.y + b.h - ((time * 40 + i * 37) % (b.y + b.h - top));
      glowCircle(g, fx, fy, 10, withAlpha(col, 0.35 * a));
    }
  }

  drawProp(g, pr, time) {
    const im = loadImage(this.data.media['prop_' + pr.id]);
    if (!ready(im)) return;
    // Los objetos de época tienen altura real (tabla ALTURAS_OBJETOS); los demás, su tamaño natural × escala.
    const alto = ALTURAS_OBJETOS[pr.id], k = alto ? alto / im.naturalHeight * (0.9 + 0.2 * (pr.scale % 1)) : pr.scale;
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    if (pr.flip) { g.save(); g.translate(pr.x, 0); g.scale(-1, 1); g.drawImage(im, -w / 2, pr.y - h, w, h); g.restore(); }
    else g.drawImage(im, pr.x - w / 2, pr.y - h, w, h);
    if (pr.id === 'lab_alarm') {
      const v = (Math.sin(time * 5 + pr.x * 0.013) + 1) / 2, a = v * v, cx = pr.x + (pr.flip ? 1 : -1) * h * 0.1;
      glowCircle(g, cx, pr.y - h * 0.8, 16, withAlpha(rgb(255, 170, 70), 0.35 + 0.15 * a));  // ahora es una antorcha
      glowCircle(g, cx, pr.y - h * 0.8, 56, withAlpha(rgb(255, 150, 60), 0.14 + 0.06 * a));
    } else if (pr.id === 'lab_spotlight') glowCircle(g, pr.x, pr.y - h * 0.62, h * 0.9, withAlpha(rgb(255, 200, 90), 0.16));
    else if (pr.id === 'lab_holo_table') {
      const k = Math.trunc(pr.x), flick = Math.sin(time * 13 + k) + Math.sin(time * 3.1 + hh(k) * 6) > 1.6 ? 0.35 : 1;
      void flick;  // la mesa holográfica ahora es de piedra: sin brillo azul
    }
  }

  drawPickup(g, pk, time) {
    const bob = Math.sin(time * 4 + pk.x * 0.01) * 4;
    g.save(); g.translate(pk.cx, pk.cy + bob);
    const piezaIm = pk.icono ? loadImage(`props/pieza_${pk.icono}.webp`) : null;
    if (pk.type.startsWith('item:') && ready(piezaIm)) {
      // Pieza de la armadura: flota con resplandor dorado y rayitos de luz que giran.
      glowCircle(g, 0, 0, 52, argb(90 + 50 * Math.sin(time * 4), 255, 226, 140));
      g.save(); g.globalCompositeOperation = 'lighter'; g.rotate(time * 0.6);
      for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillStyle = `rgba(255,236,170,${0.16 + 0.08 * Math.sin(time * 3 + i)})`; g.beginPath(); g.moveTo(-3, 0); g.lineTo(3, 0); g.lineTo(0, 64); g.closePath(); g.fill(); }
      g.restore();
      const lado = 74, k = lado / Math.max(piezaIm.naturalWidth, piezaIm.naturalHeight);
      g.drawImage(piezaIm, -piezaIm.naturalWidth * k / 2, -piezaIm.naturalHeight * k / 2, piezaIm.naturalWidth * k, piezaIm.naturalHeight * k);
    } else if (pk.type.startsWith('item:')) {
      glowCircle(g, 0, 0, 30, argb(110 + 60 * Math.sin(time * 4), 255, 230, 140));
      g.rotate(Math.sin(time * 1.5) * 0.17);
      poly(g, rgb(7, 11, 18), 0, -20, 11, -3, 5, 18, -6, 18, -12, -2);
      poly(g, rgb(255, 214, 110), 0, -17, 9, -3, 4, 15, -5, 15, -10, -2);
      poly(g, rgb(255, 248, 220), 0, -17, 3, -3, 0, 15, -5, 15, -10, -2);
    } else if (pk.type === 'heal' && ready(loadImage('props/pan.webp'))) {
      // Vida: un pan de época (Codex, pedido 015) en lugar de la cruz verde; flota con un brillo cálido.
      const pan = loadImage('props/pan.webp'), lado = 40, k = lado / Math.max(pan.naturalWidth, pan.naturalHeight);
      glowCircle(g, 0, 2, 30, argb(80 + 40 * Math.sin(time * 4), 255, 210, 130));
      g.rotate(Math.sin(time * 2) * 0.08);
      g.drawImage(pan, -pan.naturalWidth * k / 2, -pan.naturalHeight * k / 2, pan.naturalWidth * k, pan.naturalHeight * k);
    } else if (pk.type === 'heal') {
      g.rotate(time * 0.8);
      lrtb(g, -5, -12, 5, 12, rgb(113, 245, 161)); lrtb(g, -12, -5, 12, 5, rgb(113, 245, 161));
    } else if (pk.type === 'energy') {
      // Llamita de energía (antes un rayo): «se les aparecieron lenguas repartidas, como de fuego» (Hechos 2:3).
      const t = time * 9 + pk.x * 0.05, vaiven = Math.sin(t) * 1.6, punta = -17 - Math.sin(t * 1.7) * 2.5;
      const brillo = g.createRadialGradient(0, 0, 2, 0, 0, 26), k = 0.32 + 0.1 * Math.sin(t * 0.7);
      brillo.addColorStop(0, `rgba(255,190,90,${k})`); brillo.addColorStop(1, 'rgba(255,150,60,0)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = brillo; g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.fill(); g.restore();
      const llama = (escala, color) => {
        g.beginPath(); g.moveTo(0, 11 * escala);
        g.bezierCurveTo(-11 * escala, 9 * escala, -10 * escala, -4 * escala, (-2 + vaiven) * escala, (punta + 6) * escala);
        g.quadraticCurveTo((1 + vaiven) * escala, punta * escala, (2 + vaiven * 1.3) * escala, punta * escala);
        g.bezierCurveTo((4 + vaiven) * escala, -6 * escala, 10 * escala, 0, 9 * escala, 5 * escala);
        g.quadraticCurveTo(7 * escala, 11 * escala, 0, 11 * escala); g.closePath();
        g.fillStyle = css(color); g.fill();
      };
      llama(1.12, rgb(40, 14, 10)); llama(1, rgb(232, 84, 36)); llama(0.72, rgb(255, 176, 52)); llama(0.4, rgb(255, 246, 210));
      for (let i = 0; i < 2; i++) {
        const f = ((time * 1.3 + i * 0.5 + pk.x * 0.003) % 1), sx = Math.sin(t * 0.5 + i * 3) * 6;
        circle(g, sx, -14 - f * 16, 1.6 * (1 - f) + 0.4, argb(255 * (1 - f), 255, 200, 90));
      }
    } else {
      g.rotate(time * 0.8);
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 === 1 ? 6 : 12; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
      poly(g, rgb(255, 209, 102), ...pts);
    }
    g.restore();
  }

  /** Flecha de luz del jugador (en lugar del disparo de energía de Sigrun): estela, asta, punta y plumas,
   * orientada según su velocidad. Blanca con resplandor celeste, como las alas de águila. */

  /** Onda de la espada de fuego: media luna de llamas que avanza (la caja va del suelo al pecho del dibujo). */
  drawOndaFuego(g, b, time) {
    // Media luna de llamas (Juan, 2026-10-31: antes eran aros gruesos y parecía una cápsula). El filo delantero es
    // blanco-amarillo; detrás salen lenguas de fuego que se mueven y se apagan hacia el rojo. Sin shadowBlur.
    const f = b.dir ?? (b.vx >= 0 ? 1 : -1), cx = b.x + b.w / 2, cy = b.y + b.h * 0.5, h = b.h * 0.7;
    const a = Math.min(1, b.life / 0.2), rx = h * 0.38, N = 22, A = 1.2;
    const filo = [], cola = [];
    for (let i = 0; i <= N; i++) {
      const th = -A + (2 * A * i) / N, c = Math.cos(th);
      const x = rx * c - rx + 8, y = h * Math.sin(th);
      // Media luna fina (grosor T) y, cada dos puntos, una lengua de fuego larga que ondula hacia atrás.
      const T = 8 + 14 * c;
      const lengua = i % 2 ? (26 + 48 * c) * (0.6 + 0.4 * Math.sin(time * 29 + i * 1.9)) : 0;
      filo.push([x, y]); cola.push([x - T - lengua, y + (i % 2 ? Math.sin(time * 21 + i) * 5 : 0)]);
    }
    const forma = (esc) => {
      g.beginPath(); g.moveTo(filo[0][0], filo[0][1] * esc);
      for (const q of filo) g.lineTo(q[0], q[1] * esc);
      for (let i = cola.length - 1; i >= 0; i--) g.lineTo(cola[i][0], cola[i][1] * esc);
      g.closePath();
    };
    g.save(); g.translate(cx, cy); g.scale(f, 1); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
    const grad = g.createLinearGradient(8, 0, -rx - 80, 0);
    grad.addColorStop(0, `rgba(255,240,190,${0.95 * a})`); grad.addColorStop(0.18, `rgba(255,170,50,${0.85 * a})`);
    grad.addColorStop(0.5, `rgba(230,70,20,${0.5 * a})`); grad.addColorStop(1, 'rgba(160,20,10,0)');
    forma(1.08); g.fillStyle = `rgba(255,90,20,${0.22 * a})`; g.fill();  // resplandor
    forma(1); g.fillStyle = grad; g.fill();
    // Filo blanco ardiente.
    g.strokeStyle = `rgba(255,250,225,${a})`; g.lineWidth = 4;
    g.beginPath(); filo.forEach((q, i) => (i ? g.lineTo(q[0], q[1] * 0.92) : g.moveTo(q[0], q[1] * 0.92))); g.stroke();
    // Brasas que se desprenden hacia atrás.
    for (let i = 0; i < 8; i++) {
      const t = (time * 7 + i * 0.37) % 1, yy = Math.sin(i * 2.3) * h * 0.8;
      g.fillStyle = `rgba(255,${140 + (i % 4) * 25},50,${(1 - t) * 0.8 * a})`;
      g.beginPath(); g.arc(-rx - 20 - t * 70, yy - t * 18, 3.5 * (1 - t) + 1, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  drawLightArrow(g, b) {
    let cx = b.x + b.w / 2, cy = b.y + b.h / 2, ang = Math.atan2(b.vy || 0, b.vx || 1);
    // Personajes al doble: la flecha se dibuja recta, desplazada a la mano del dibujo (el choque sigue en b.x/b.y).
    if (b.dibujoDy) { cy -= b.dibujoDy; cx += b.dibujoDx ?? 0; }
    g.save(); g.translate(cx, cy); g.rotate(ang); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const estela = g.createLinearGradient(-40, 0, -6, 0);
    estela.addColorStop(0, 'rgba(120,200,255,0)'); estela.addColorStop(1, 'rgba(170,225,255,0.55)');
    g.strokeStyle = estela; g.lineWidth = 5; g.beginPath(); g.moveTo(-40, 0); g.lineTo(-6, 0); g.stroke();
    g.shadowColor = 'rgba(140,215,255,0.95)'; g.shadowBlur = 9;
    g.strokeStyle = 'rgba(235,248,255,0.95)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-14, 0); g.lineTo(9, 0); g.stroke();
    g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.moveTo(16, 0); g.lineTo(7, -4.2); g.lineTo(9, 0); g.lineTo(7, 4.2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(190,232,255,0.9)';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(-9, 0); g.lineTo(-15, s * 4.5); g.lineTo(-11, s * 4.5); g.lineTo(-5, 0); g.closePath(); g.fill(); }
    g.restore();
  }


}

// Trampas de la fase 2 (guillotinas, sierras, cintas, meteoritos…).
Object.assign(WorldRenderer.prototype, metodosTrampas);
