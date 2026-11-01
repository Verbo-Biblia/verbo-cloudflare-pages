// Partículas y explosiones (adaptación de game/Effects.kt). Sin sangre: este juego no la usa.
import { rgb, css, withAlpha, glowCircle } from './dibujo.js';

const MAX_PARTICLES = 700;
const DUST = rgb(150, 160, 178);
const SPARK_A = rgb(255, 230, 150);
const SPARK_B = rgb(255, 180, 90);
const EMBER = rgb(255, 150, 60);
const SMOKE = rgb(60, 62, 70);
const R = Math.random;

export class Effects {
  constructor() { this.particles = []; this.explosions = []; this.detonations = []; this.tajos = []; this.arcos = []; this.destellos = []; this.choques = []; }
  clear() { this.particles.length = 0; this.explosions.length = 0; this.detonations.length = 0; this.tajos.length = 0; this.arcos.length = 0; this.destellos.length = 0; this.choques.length = 0; }

  spawn(kind, x, y, vx, vy, life, size, color) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({ kind, x, y, vx, vy, life, max: life, size, color, rot: R() * 6.28, vrot: (R() - 0.5) * 18 });
  }
  burst(x, y, n, color, speed = 150) {
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, s = R() * speed;
      this.spawn('DOT', x, y, Math.cos(a) * s, Math.sin(a) * s, 0.3 + R() * 0.45, 2 + R() * 4, color);
    }
  }
  dust(x, y, dir = 0) {
    for (let i = 0; i < 5; i++) {
      this.spawn('DOT', x + (R() - 0.5) * 12, y, (R() - 0.5) * 80 - dir * 35, -20 - R() * 80, 0.25 + R() * 0.25, 3 + R() * 4, DUST);
    }
  }
  /** Explosión por capas; devuelve la sacudida de cámara sugerida. */
  explosion(x, y, scale) {
    const r = (70 + R() * 14) * scale;
    this.explosions.push({ x, y, radius: r, t: 0, duration: 0.75 });
    for (let i = 0; i < 26 * scale; i++) {
      const a = R() * Math.PI * 2, s = (260 + R() * 420) * scale;
      this.spawn('SPARK', x, y, Math.cos(a) * s, Math.sin(a) * s - 60, 0.25 + R() * 0.35, 1.4 + R() * 1.4, R() < 0.5 ? SPARK_A : SPARK_B);
    }
    this.burst(x, y, (18 * scale) | 0, EMBER, 245 * scale);
    this.burst(x, y, (10 * scale) | 0, rgb(244, 247, 250), 175 * scale);
    for (let i = 0; i < 9 * scale; i++) {
      this.spawn('SMOKE', x + (R() - 0.5) * r * 0.6, y + (R() - 0.5) * r * 0.4, (R() - 0.5) * 60, -30 - R() * 60,
        1.1 + R() * 0.9, r * (0.22 + R() * 0.18), SMOKE);
    }
    return 15 * scale;
  }
  /** Una sombra vencida se disipa: humo oscuro violeta, chispas y un destello de luz (en lugar de la explosión de
   *  las máquinas de Sigrun). Misma sacudida que explosion(). */
  disipar(x, y, scale) {
    const r = (70 + R() * 14) * scale;
    for (let i = 0; i < 22 * scale; i++) {
      const a = R() * Math.PI * 2, s = (180 + R() * 320) * scale;
      this.spawn('SPARK', x, y, Math.cos(a) * s, Math.sin(a) * s - 80, 0.25 + R() * 0.35, 1.2 + R() * 1.4, R() < 0.5 ? rgb(190, 140, 255) : rgb(255, 240, 210));
    }
    this.burst(x, y, (14 * scale) | 0, rgb(150, 90, 230), 220 * scale);
    this.burst(x, y, (8 * scale) | 0, rgb(255, 250, 230), 150 * scale);
    for (let i = 0; i < 12 * scale; i++) {
      this.spawn('SMOKE', x + (R() - 0.5) * r * 0.6, y + (R() - 0.5) * r * 0.5, (R() - 0.5) * 70, -40 - R() * 70,
        0.9 + R() * 0.8, r * (0.2 + R() * 0.18), rgb(40, 22, 58));
    }
    return 15 * scale;
  }
  /** Tajo de la espada de fuego: arco de llama que barre delante del jugador. */
  tajo(x, y, f) {
    this.tajos.push({ x, y, f, life: 0.26, max: 0.26 });
    for (let i = 0; i < 10; i++) this.spawn('SPARK', x + f * (40 + R() * 70), y + (R() - 0.5) * 90, f * (120 + R() * 200), -80 - R() * 160, 0.35 + R() * 0.3, 2 + R() * 2, rgb(255, 170 + R() * 60, 60));
  }

  /** Estela de la Espada del Espíritu (hack and slash): media luna de luz que barre rápido y se desvanece.
   *  tipo: 0 tajo (arriba → abajo), 1 revés (abajo → arriba), 2 remate (ancho y grueso), 'arriba', 'aire' (giro), 'picada'. */
  arco(x, y, f, tipo, r) {
    const T = {
      0: [-2.1, 0.75, 1], 1: [0.95, -1.75, 1], 2: [-2.3, 1.15, 1.6], arriba: [0.35, -3.5, 1.2], aire: [-2.6, 2.6, 1.15], picada: [-3.0, 0.15, 1.3],
    }[tipo] ?? [-2.1, 0.75, 1];
    const vida = tipo === 2 ? 0.26 : 0.2;
    this.arcos.push({ x, y, f, r, ini: T[0], fin: T[1], grueso: T[2], life: vida, max: vida, fuerte: tipo === 2 });
    const n = tipo === 2 ? 10 : 5;
    for (let i = 0; i < n; i++) {
      const a = T[1] + (R() - 0.5) * 0.6;
      this.spawn('SPARK', x + f * Math.cos(a) * r, y + Math.sin(a) * r, f * Math.cos(a + 1.57 * Math.sign(T[1] - T[0])) * (160 + R() * 160), Math.sin(a) * 120 - 60, 0.2 + R() * 0.2, 1.6 + R() * 1.4, R() < 0.5 ? rgb(255, 250, 225) : rgb(255, 214, 120));
    }
  }
  /** Chispa de impacto: destello en cruz, anillo y chispas hacia delante. fuego = colores de la espada de fuego. */
  impacto(x, y, f, fuego = false, fuerte = false) {
    this.destellos.push({ x, y, f, life: fuerte ? 0.2 : 0.14, max: fuerte ? 0.2 : 0.14, s: fuerte ? 1.5 : 1, fuego });
    const n = fuerte ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const a = (R() - 0.5) * 2.2 + (f > 0 ? 0 : Math.PI), s = 220 + R() * (fuerte ? 380 : 240);
      this.spawn('SPARK', x, y, Math.cos(a) * s, Math.sin(a) * s - 80, 0.18 + R() * 0.22, 1.5 + R() * 1.5,
        fuego ? (R() < 0.5 ? rgb(255, 150, 50) : rgb(255, 220, 120)) : (R() < 0.6 ? rgb(255, 252, 235) : rgb(255, 210, 110)));
    }
  }
  /** Onda de choque al caer de la picada. */
  choque(x, y, r) {
    this.choques.push({ x, y, r, life: 0.3, max: 0.3 });
    for (let i = 0; i < 14; i++) {
      const s = (R() < 0.5 ? -1 : 1);
      this.spawn('SPARK', x + s * R() * 20, y - 4, s * (200 + R() * 260), -120 - R() * 220, 0.3 + R() * 0.25, 2 + R() * 1.5, R() < 0.5 ? rgb(255, 240, 190) : rgb(255, 196, 90));
    }
    this.dust(x - 20, y, 1); this.dust(x + 20, y, -1);
  }

  detonation(x, y, radius, ratio) {
    this.detonations.push({ x, y, radius, life: 0.62, max: 0.62 });
    // Oración: chispas doradas (antes azules).
    this.burst(x, y, 30, rgb(255, 246, 214), 310 + ratio * 130);
    this.burst(x, y, 18, rgb(255, 200, 84), 220 + ratio * 100);
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vrot * dt;
      if (p.kind === 'SMOKE') { p.vx *= 0.96; p.vy *= 0.97; p.size += dt * 14; }
      else if (p.kind === 'SPARK') { p.vy += 900 * dt; p.vx *= 0.98; }
      else { p.vy += 420 * dt; p.vx *= 0.985; }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const e of this.explosions) e.t += dt;
    this.explosions = this.explosions.filter((e) => e.t < e.duration);
    for (const d of this.detonations) d.life -= dt;
    for (const t of this.tajos) t.life -= dt;
    for (const a of this.arcos) a.life -= dt;
    for (const d of this.destellos) d.life -= dt;
    for (const c of this.choques) c.life -= dt;
    this.arcos = this.arcos.filter((a) => a.life > 0);
    this.destellos = this.destellos.filter((d) => d.life > 0);
    this.choques = this.choques.filter((c) => c.life > 0);
    this.tajos = this.tajos.filter((t) => t.life > 0);
    this.detonations = this.detonations.filter((d) => d.life > 0);
  }

  /** Humo detrás de los personajes. */
  drawBack(g) {
    for (const p of this.particles) {
      if (p.kind !== 'SMOKE') continue;
      const a = Math.min(1, p.life / p.max) * 0.45;
      g.fillStyle = css(withAlpha(p.color, a)); g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill();
    }
  }
  drawFront(g) {
    // Estelas de la espada: el filo barre en el primer 40 % de la vida y luego la media luna se desvanece.
    for (const s of this.arcos) {
      const k = 1 - s.life / s.max, barrido = Math.min(1, k / 0.4), a = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6;
      const cur = s.ini + (s.fin - s.ini) * barrido, dir = Math.sign(s.fin - s.ini) || 1;
      g.save(); g.translate(s.x, s.y); g.scale(s.f, 1); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      // Media luna continua: borde exterior en el radio del filo; el grosor crece hacia la punta (cola fina).
      const N = 24, G = 26 * s.grueso, ext = [], int = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, ang = s.ini + (cur - s.ini) * u, g2 = G * (0.08 + 0.92 * u * u);
        ext.push([Math.cos(ang) * s.r, Math.sin(ang) * s.r]);
        int.push([Math.cos(ang) * (s.r - g2), Math.sin(ang) * (s.r - g2)]);
      }
      const forma = () => { g.beginPath(); g.moveTo(...ext[0]); for (const q of ext) g.lineTo(...q); for (let i = int.length - 1; i >= 0; i--) g.lineTo(...int[i]); g.closePath(); };
      // Resplandor sin shadowBlur (caro): la misma forma con un trazo ancho y tenue detrás.
      forma(); g.lineJoin = 'round'; g.lineWidth = 10 * s.grueso; g.strokeStyle = `rgba(255,170,60,${(s.fuerte ? 0.3 : 0.2) * a})`; g.stroke();
      g.fillStyle = `rgba(255,196,90,${0.55 * a})`; g.fill();
      g.lineWidth = 3 * s.grueso; g.strokeStyle = `rgba(255,252,235,${0.95 * a})`;
      g.beginPath(); g.moveTo(...ext[Math.floor(N * 0.35)]); for (const q of ext.slice(Math.floor(N * 0.35))) g.lineTo(...q); g.stroke();
      // Punta del filo: un brillo blanco.
      if (k < 0.45) {
        const px = Math.cos(cur) * s.r, py = Math.sin(cur) * s.r;
        glowCircle(g, px, py, 16 * s.grueso, withAlpha(rgb(255, 250, 230), 0.9 * a));
      }
      g.restore();
    }
    for (const d of this.destellos) {
      const k = 1 - d.life / d.max, a = 1 - k, L = (18 + 34 * k) * d.s;
      g.save(); g.translate(d.x, d.y); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      glowCircle(g, 0, 0, 26 * d.s * (0.6 + k), withAlpha(d.fuego ? rgb(255, 150, 60) : rgb(255, 230, 160), 0.7 * a));
      g.strokeStyle = d.fuego ? `rgba(255,220,150,${a})` : `rgba(255,255,245,${a})`;
      for (const [ang, largo] of [[0.25, 1], [0.25 + Math.PI / 2, 0.6]]) {
        g.lineWidth = 3.2 * a * d.s + 0.5;
        g.beginPath(); g.moveTo(-Math.cos(ang) * L * largo, -Math.sin(ang) * L * largo); g.lineTo(Math.cos(ang) * L * largo, Math.sin(ang) * L * largo); g.stroke();
      }
      g.strokeStyle = `rgba(255,236,190,${0.8 * a})`; g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, L * 0.7, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    for (const c of this.choques) {
      const k = 1 - c.life / c.max, a = 1 - k;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(255,236,180,${0.9 * a})`; g.lineWidth = 6 * a + 1;
      g.beginPath(); g.ellipse(c.x, c.y - 2, c.r * (0.3 + k), 14 * (0.4 + k * 0.6), 0, Math.PI, Math.PI * 2); g.stroke();
      glowCircle(g, c.x, c.y - 6, c.r * 0.6 * (1 - k * 0.5), withAlpha(rgb(255, 214, 120), 0.45 * a));
      g.restore();
    }
    for (const t of this.tajos) {
      const k = 1 - t.life / t.max, a = 1 - k, r = 70 + 40 * k, ini = -1.25 + k * 0.6, fin = ini + 2.2 * Math.min(1, k * 3);
      g.save(); g.translate(t.x, t.y); g.scale(t.f, 1); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const [ancho, color] of [[26, `rgba(255,90,30,${0.5 * a})`], [14, `rgba(255,170,60,${0.85 * a})`], [5, `rgba(255,245,200,${a})`]]) {
        g.strokeStyle = color; g.lineWidth = ancho; g.beginPath(); g.arc(0, 0, r, ini, fin); g.stroke();
      }
      g.restore();
    }
    for (const e of this.explosions) {
      const k = e.t / e.duration;
      glowCircle(g, e.x, e.y, e.radius * (0.3 + k * 0.7), withAlpha(rgb(255, 170, 70), (1 - k) * 0.55));
      glowCircle(g, e.x, e.y, e.radius * 0.35 * (1 - k * 0.5), withAlpha(rgb(255, 245, 210), (1 - k) * 0.8));
      g.strokeStyle = css(withAlpha(rgb(255, 230, 190), (1 - k) * 0.6)); g.lineWidth = 3;
      g.beginPath(); g.arc(e.x, e.y, e.radius * (0.4 + k), 0, Math.PI * 2); g.stroke();
    }
    // Oración: onda dorada con rayos de luz alrededor (resplandor), aro interior blanco y destellos en cruz.
    // Mismo radio y duración que antes; solo cambia el dibujo.
    for (const d of this.detonations) {
      const k = 1 - d.life / d.max, R = d.radius * (0.2 + k * 0.8), a = 1 - k;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const onda = g.createRadialGradient(d.x, d.y, 0, d.x, d.y, R * 1.05);
      onda.addColorStop(0, 'rgba(255,214,110,0)'); onda.addColorStop(0.62, `rgba(255,206,96,${a * 0.08})`);
      onda.addColorStop(0.9, `rgba(255,200,80,${a * 0.38})`); onda.addColorStop(1, 'rgba(255,200,80,0)');
      g.fillStyle = onda; g.beginPath(); g.arc(d.x, d.y, R * 1.05, 0, Math.PI * 2); g.fill();
      g.strokeStyle = css(withAlpha(rgb(255, 214, 110), a * 0.95)); g.lineWidth = 5 * a + 1;
      g.beginPath(); g.arc(d.x, d.y, R, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = css(withAlpha(rgb(255, 252, 236), a * 0.8)); g.lineWidth = 1.5;
      g.beginPath(); g.arc(d.x, d.y, R * 0.82, 0, Math.PI * 2); g.stroke();
      const giro = k * 0.6;
      g.strokeStyle = css(withAlpha(rgb(255, 240, 180), Math.min(1, a * 1.2)));
      for (let i = 0; i < 16; i++) {
        const t = giro + i * Math.PI / 8, largo = i % 2 ? 0.1 : 0.2;
        g.lineWidth = (i % 2 ? 1.5 : 2.8) * a + 0.5;
        g.beginPath(); g.moveTo(d.x + Math.cos(t) * R * 0.92, d.y + Math.sin(t) * R * 0.92);
        g.lineTo(d.x + Math.cos(t) * R * (1.02 + largo), d.y + Math.sin(t) * R * (1.02 + largo)); g.stroke();
      }
      g.fillStyle = css(withAlpha(rgb(255, 255, 240), a));
      for (let i = 0; i < 4; i++) {
        const t = giro + Math.PI / 4 + i * Math.PI / 2, x = d.x + Math.cos(t) * R, y = d.y + Math.sin(t) * R, s = 7 * a + 2;
        g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.25, y - s * 0.25); g.lineTo(x + s, y); g.lineTo(x + s * 0.25, y + s * 0.25);
        g.lineTo(x, y + s); g.lineTo(x - s * 0.25, y + s * 0.25); g.lineTo(x - s, y); g.lineTo(x - s * 0.25, y - s * 0.25); g.closePath(); g.fill();
      }
      g.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      if (p.kind === 'SMOKE') continue;
      const a = Math.min(1, p.life / p.max * 1.5);
      g.fillStyle = css(withAlpha(p.color, a));
      if (p.kind === 'SPARK') {
        g.strokeStyle = g.fillStyle; g.lineWidth = p.size;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); g.stroke();
      } else {
        g.beginPath(); g.arc(p.x, p.y, p.size * 0.5 * (0.5 + 0.5 * a), 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
  }
}
