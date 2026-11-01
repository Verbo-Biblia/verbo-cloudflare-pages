// Enemigos, jefes, trampas y proyectiles (port de game/GameSession.kt, fase 2). Misma lógica, tiempos, cajas y
// vidas que el original. Se instala como métodos de GameSession (Object.assign en sesion.js).
// Diferencias: los puntos de disparo de los jefes salen de su dibujo nuevo (anclajes.js); sin sangre.
import { Balance, Physics } from './config.js';
import { Box, Meteor, Pickup } from './mundo.js';
import { Enemy, Bullet, LANCE_WARN, LANCE_ON, DOG_SLEEPING, DOG_WAKING } from './entidades.js';
import { rgb, hex } from './dibujo.js';
import { tr } from './datos.js';
import { puntoJefe } from './anclajes.js';

const R = Math.random;
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const PI = Math.PI;
const WHITE = rgb(255, 255, 255);

export const EYE_ID = 'crimson_over_eye';
export const SERAPH_ID = 'seraph_engine';
export const AEGIS_ID = 'aegis_behemoth';
export const SCOUT_ID = 'rival_scout';
export const ASSAULT_ID = 'rival_assault';
export const REGENT_ID = 'regent_frame';
const GRENADE_G = 1500, GRENADE_TIME = 1.0, GRENADE_R = 58;
export const LINK_WARN = 1.2, LINK_ON = 0.8;
const REGENT_STEP = 80, PYLON_HP = 10;
export const PYLON_H = 120, PYLON_W = 44;
const REGENT_STUN = 3.2, REGENT_REBUILD = 9;
const DESPERATE_HP = 0.25, DESPERATE_SPEED = 0.3;
const HOPPER_JUMP = -820, HOPPER_AIR_TIME = 0.8;
const AEGIS_TURN = 1.1, AEGIS_TURN_RAGE = 0.7, AEGIS_RAM_SPEED = 560, AEGIS_STUN = 1.8;
const MORTAR_START_Y = 96;
const AUTO_DOOR_RANGE = 150, SHOCK_WARN = 0.7;
const SHOT_VOLUME = 0.7, IMPACT_VOLUME = 0.7;
const SERAPH_WALK = 95, SERAPH_NEAR = 150, SERAPH_STEP = 70, SERAPH_JET = 110;
export const SERAPH_LANCE_HALF = 26;
const EYE_HOVER = 230;
const CRUMBLE_DELAY = 0.5, CRUMBLE_RESPAWN = 3.2, LASER_WARN = 0.7, LASER_WAKE_RANGE = 520, METEOR_WAKE_RANGE = 900;
const DOG_SIGHT = 420, SAW_DAMAGE = 1.5, DOG_RUN = 300, DOG_RELEASE = 0.75;
export const NOISE_RUN = 280, NOISE_DASH = 360, NOISE_LAND = 230, NOISE_LAND_VY = 780, NOISE_SHOT = 560, NOISE_DETONATION = 1000;
const DOG_PACK_RANGE = 520, DOG_ALERT_RANGE = 240, DOG_WAKE_TIME = 0.5;
const METEOR_WARN = 1.1, METEOR_SPEED = 900;
export const METEOR_R = 11;
const GUILLO_DROP = 0.14, GUILLO_HOLD = 0.35, GUILLO_RISE = 0.9, GUILLO_WARN = 0.4;
const DOOR_OPEN_TIME = 0.9;

/** Banda vertical del barrido del jefe final: baja (saltar) o alta (agacharse). */
export const sweepBand = (floorY, high) => (high === 1 ? [floorY - 80, floorY - 40] : [floorY - 44, floorY - 14]);
export const isSeal = (id) => id.startsWith('sello');
const bc = (e) => hex(e.def.bulletColor);
const wrapPi = (d) => { while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d; };

export const metodosCombate = {
  // ===================================================================== Enemigos comunes
  /** Behemotito (Mini Behemoth): patrulla con el escudo delante; al ver al jugador de frente baja el escudo y
   *  dispara una bala baja (saltar) y otra alta (agacharse). */
  updateMiniBehemoth(e, dt, canSee) {
    const st = e.mini; if (!st) return;
    const p = this.player;
    st.t += dt;
    const ex = e.x + e.w / 2, floorY = e.y + e.h;
    const behind = (p.cx - ex) * e.dir < -10;
    if (st.move === 'AEG_BARRAGE') {
      st.shield = Math.max(0, st.shield - dt * 4);
      st.charge = Math.min(1, st.t / 0.6);
      if (st.step < 2 && st.t >= 0.6 + st.step * 0.35) {
        const low = st.step === 0, bh = low ? 16 : 12, by = low ? floorY - 22 : floorY - 50;
        const bx = ex + e.dir * (e.w / 2 + 4);
        const [fx0, fy0] = this.titanShot(e, bx, by, 24, bh, e.def.bulletSpeed, 3, low);
        this.fx.burst(fx0, fy0, 6, rgb(255, 170, 80), 120);
        this.enemyShotSfx(e, 0.75);
        st.step++;
      }
      if (st.t > 1.4) { st.go('AEG_WALK'); st.charge = 0; e.shot = e.def.shotInterval; }
      return;
    }
    st.shield = Math.min(1, st.shield + dt * 4);
    st.charge = Math.max(0, st.charge - dt * 3);
    st.turnT = behind && canSee ? st.turnT + dt : 0;
    if (st.turnT > 1.0) { e.dir = -e.dir; st.turnT = 0; this.fx.dust(ex, floorY); }
    if (canSee && !behind) {
      if (e.shot <= 0) st.go('AEG_BARRAGE');
    } else {
      e.x += e.dir * e.def.speed * dt;
      if (e.x < e.min) { e.x = e.min; e.dir = 1; }
      if (e.x > e.max) { e.x = e.max; e.dir = -1; }
    }
  },

  /** Saltador (Serpentina): espera plantado (dispara si ve al jugador) y salta a otro punto de su tramo. */
  updateHopper(e, dt, canSee, aim) {
    const w = this.world;
    if (!e.airborne) {
      const feet = e.y + e.h;
      const supported = w.solids.some((s) => s.overlapsR(e.x + 4, feet, e.w - 8, 2)) ||
        w.oneWays.some((o) => e.x + e.w - 4 > o.x && e.x + 4 < o.x + o.w && Math.abs(feet - o.y) < 3) ||
        w.moving.some((m) => e.x + e.w - 4 > m.x && e.x + 4 < m.x + m.w && Math.abs(feet - m.y) < 3);
      if (!supported) { e.airborne = true; e.vx = 0; e.vy = 0; }
    }
    if (!e.airborne) {
      if (canSee) {
        e.dir = aim;
        if (e.shot <= 0) {
          e.shot = e.def.shotInterval;
          const sy = e.y + 14;
          this.enemyBullets.push(new Bullet(e.x + e.w / 2 + aim * (e.w / 2 + 5), sy, 9, 6, aim * e.def.bulletSpeed, 3, bc(e)));
          this.fx.burst(e.x + e.w / 2 + aim * (e.w / 2 + 6), sy, 4, bc(e), 95);
          this.enemyShotSfx(e, 0.8);
        }
      }
      e.hopT -= dt;
      if (e.hopT <= 0 && e.max > e.min + 20) {
        const side0 = R() < 0.5 ? -1 : 1;
        let tx = NaN;
        for (let k = 0; k < 8; k++) {
          const side = k % 2 === 0 ? side0 : -side0;
          const cand = clamp(e.x + side * (120 + R() * 220), e.min, e.max);
          if (Math.abs(cand - e.x) < 60) continue;
          const cx = cand + e.w / 2, feet = e.y + e.h;
          const ok = [...w.solids, ...w.oneWays].some((it) => cx > it.x + 6 && cx < it.x + it.w - 6 && it.y > feet - 150 && it.y < feet + 260 &&
            !w.solids.some((o) => o.overlapsR(cand, it.y - e.h - 2, e.w, e.h)));
          if (ok) { tx = cand; break; }
        }
        if (Number.isNaN(tx)) { e.hopT = 0.8; return; }
        e.vy = HOPPER_JUMP;
        e.vx = clamp((tx - e.x) / HOPPER_AIR_TIME, -360, 360);
        e.dir = e.vx < 0 ? -1 : 1;
        e.airborne = true;
        this.fx.dust(e.x + e.w / 2, e.y + e.h);
        this.events.sfx('jump', 0.35, 0.7);
      }
      return;
    }
    const prevBottom = e.y + e.h;
    e.vy = Math.min(e.vy + Physics.GRAVITY * dt, Physics.MAX_FALL_SPEED);
    const nx = clamp(e.x + e.vx * dt, e.min, e.max);
    if (!w.solids.some((s) => s.overlapsR(nx, e.y, e.w, e.h))) e.x = nx; else e.vx = 0;
    e.y += e.vy * dt;
    if (e.vy < 0) {
      const s = w.solids.find((o) => o.overlapsR(e.x, e.y, e.w, e.h));
      if (s) { e.y = s.y + s.h; e.vy = 0; }
    } else {
      const bottom = e.y + e.h;
      const span = (it) => it.x < e.x + e.w - 4 && it.x + it.w > e.x + 4;
      const land = [
        ...w.solids.filter((it) => span(it) && it.y >= prevBottom - 8 && it.y <= bottom).map((it) => it.y),
        ...w.oneWays.filter((it) => span(it) && it.y >= prevBottom - 1 && it.y <= bottom).map((it) => it.y),
        ...w.moving.filter((it) => span(it) && it.y >= prevBottom - 1 && it.y <= bottom).map((it) => it.y),
      ];
      if (land.length) {
        const top = Math.min(...land);
        e.y = top - e.h; e.vy = 0; e.vx = 0; e.airborne = false;
        e.hopT = 1.0 + R() * 0.9;
        this.fx.dust(e.x + e.w / 2, top);
      }
    }
    if (e.y > Physics.WORLD_HEIGHT + 100) e.dead = true;
  },

  killEnemy(e) {
    if (e.dead) return;
    e.dead = true; this.kills++;
    const hb = e.hitbox, soldier = e.def.behavior === 'SOLDIER';
    const scale = e.boss ? 2.6 : e.def.behavior === 'TURRET' ? 1.2 : soldier ? 0.55 : 1;
    this.shake = Math.max(this.shake, this.fx.disipar ? this.fx.disipar(hb.cx, hb.cy, scale) : this.fx.explosion(hb.cx, hb.cy, scale));
    if (e.def.piloted) this.humanDeathSfx();
    else {
      // Grito de la criatura con reverberación (uno de 3, tono al azar) y debajo, suave, la sombra que se disipa.
      this.events.sfx(`muerte_sombra_${1 + Math.floor(Math.random() * 3)}`, 0.85, 0.9 + Math.random() * 0.2);
      this.events.sfx('sombra_disipa', 0.45, 0.92 + Math.random() * 0.16);
    }
    if (e.boss) {
      e.boss.warnings.length = 0; e.boss.lances.length = 0; e.boss.pylons.length = 0;
      const other = e === this.boss ? this.partner : e === this.partner ? this.boss : null;
      if (other && !other.dead) {
        this.linkState = 0;
        const st = other.boss;
        if (st) { this.enrage(other, st); if (st.move === 'EL_LINK') st.go(this.eliteIdle(other)); }
        this.screenFlash = 0.6;
        this.toast(tr('¡{0} DERRIBADO! {1} SE ENFURECE', e.def.name, other.def.name));
        return;
      }
      this.lastBossDown = e; this.linkState = 0;
      this.enemyBullets.length = 0;
      const gate = this.world.bossGate;
      if (gate) { const i = this.world.solids.indexOf(gate); if (i >= 0) this.world.solids.splice(i, 1); }
      this.bossDeathTimer = 1.6; this.screenFlash = 1;
      this.toast(this.partner ? tr('¡{0}: VENCIDOS!', this.boss?.def.introTitle ?? tr('GUARDIA')) : tr('¡{0}: VENCIDO!', e.def.name));
    }
  },

  /** Explosiones encadenadas tras derrotar al jefe; al final suelta su objeto de historia (si lo hay). */
  updateBossDeath(dt) {
    if (this.bossDeathTimer <= 0) return;
    const b = this.lastBossDown ?? this.boss;
    if (!b) return;
    const before = this.bossDeathTimer;
    this.bossDeathTimer -= dt;
    if (this.bossDeathTimer <= 0) {
      this.events.onBossDefeated?.(); this.events.onRadio?.('bossDefeated');
      if (this.level.bossDrop) {
        const floorY = (b.boss?.groundY ?? b.y) + b.h;
        const pieza = new Pickup('item:' + this.level.bossDrop, b.x + b.w / 2 - 12, floorY - 70);
        // Cada jefe suelta su pieza de la armadura (arte/armadura/, pedido 013): se dibuja con su imagen.
        pieza.icono = { 2: 'cinturon', 4: 'coraza', 6: 'escudo', 8: 'yelmo', 9: 'sellos' }[this.level.levelNumber] ?? null;
        this.pickups.push(pieza);
        this.fx.burst(b.x + b.w / 2, floorY - 58, 30, rgb(255, 214, 120), 220);
      }
      return;
    }
    if (Math.floor(before / 0.22) !== Math.floor(this.bossDeathTimer / 0.22)) {
      const hb = b.hitbox;
      const x = hb.x + R() * hb.w, y = hb.y + R() * hb.h, s = 1.1 + R() * 0.6;
      this.shake = Math.max(this.shake, this.fx.disipar ? this.fx.disipar(x, y, s) : this.fx.explosion(x, y, s));
      this.events.sfx('explosion', 0.7);
    }
  },

  updateEnemies(dt) {
    const p = this.player;
    if (this.pendingEnemies.length) { this.enemies.push(...this.pendingEnemies); this.pendingEnemies.length = 0; }
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.flashShot = Math.max(0, e.flashShot - dt);
      e.shot -= dt; e.phase += dt;
      const dx = p.x - e.x, dy = p.cy - (e.y + e.h / 2);
      const canSee = !p.dead && Math.abs(dx) < 650 && Math.abs(dy) < 150 && this.lineClear(e.x + e.w / 2, e.y + e.h * 0.35, p.cx, p.y + p.h * 0.4);
      const aim = dx < 0 ? -1 : 1;
      switch (e.def.behavior) {
        case 'WALKER': case 'RIVAL': {
          e.x += e.dir * e.def.speed * dt;
          if (e.x < e.min) { e.x = e.min; e.dir = 1; }
          if (e.x > e.max) { e.x = e.max; e.dir = -1; }
          if (canSee) {
            e.dir = aim;
            if (e.shot <= 0) {
              const rival = e.def.behavior === 'RIVAL';
              e.shot = e.def.shotInterval;
              const sy = e.y + (rival ? 15 : 14);
              this.enemyBullets.push(new Bullet(e.x + e.w / 2 + aim * (e.w / 2 + 5), sy, rival ? 10 : 9, rival ? 5 : 6, aim * e.def.bulletSpeed, 3, bc(e)));
              this.fx.burst(e.x + e.w / 2 + aim * (e.w / 2 + 6), sy, 4, bc(e), 95);
              this.enemyShotSfx(e, rival ? 0.85 : 0.72);
            }
          } else if (e.def.behavior === 'RIVAL' && !p.dead && Math.abs(dx) < 650 && dy > 60 && dy < 480 &&
            !this.world.solids.some((s) => s.overlapsR(e.x + 4, e.y + e.h + 1, e.w - 8, 3))) {
            // Por encima del jugador: dispara en diagonal hacia abajo.
            e.dir = aim;
            if (e.shot <= 0) {
              e.shot = e.def.shotInterval;
              const v = e.def.bulletSpeed * 0.7071, bx = e.x + e.w / 2 + aim * (e.w / 2 + 2), by = e.y + e.h - 6;
              this.enemyBullets.push(new Bullet(bx - 4, by - 4, 8, 8, aim * v, 3, bc(e), v));
              this.fx.burst(bx, by, 4, bc(e), 95);
              this.enemyShotSfx(e, 0.85);
            }
          }
          break;
        }
        case 'BOSS': this.updateBoss(e, dt); break;
        case 'HOPPER': this.updateHopper(e, dt, canSee, aim); break;
        case 'BEHEMOTH': this.updateMiniBehemoth(e, dt, canSee); break;
        case 'SOLDIER': {
          // Patrulla; al ver al jugador se planta y dispara ráfagas cortas de 3.
          if (!canSee && e.burst === 0) {
            const before = e.x;
            e.x += e.dir * e.def.speed * dt;
            if (e.x < e.min) { e.x = e.min; e.dir = 1; }
            if (e.x > e.max) { e.x = e.max; e.dir = -1; }
            e.stride += Math.abs(e.x - before);
          }
          if (canSee) { e.dir = aim; if (e.shot <= 0 && e.burst === 0) { e.burst = 3; e.burstT = 0; e.shot = e.def.shotInterval; } }
          if (e.burst > 0) {
            e.burstT -= dt;
            if (e.burstT <= 0) {
              e.burst--; e.burstT = 0.14;
              const k = e.h / 46, mx = e.x + e.w / 2 + e.dir * 15 * k, sy = e.y + 18 * k;
              this.enemyBullets.push(new Bullet(e.dir > 0 ? mx : mx - 8, sy, 8, 4, e.dir * e.def.bulletSpeed, 2.5, bc(e), 0, 'ENERGY', e.def.bulletDamage));
              this.fx.burst(mx, sy + 2, 3, bc(e), 90);
              this.enemyShotSfx(e, 1.15, 0.4);
              e.flashShot = 0.1;
            }
          }
          break;
        }
        case 'DOG': this.updateDog(e, dt, dx, dy); break;
        case 'DRONE': {
          e.x += e.dir * e.def.speed * dt;
          if (e.x < e.min) { e.x = e.min; e.dir = 1; }
          if (e.x > e.max) { e.x = e.max; e.dir = -1; }
          e.y = e.homeY + Math.sin(this.time * 2.3 + e.min * 0.01) * 10;
          const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
          const sees = !p.dead && Math.abs(p.cx - ex) < 560 && Math.abs(p.cy - ey) < 380 && this.lineClear(ex, ey, p.cx, p.cy);
          if (sees) {
            e.dir = aim;
            if (e.shot <= 0) {
              e.shot = e.def.shotInterval;
              const a = Math.atan2(p.cy - ey, p.cx - ex);
              this.enemyBullets.push(new Bullet(ex - 6, ey - 6, 12, 12, Math.cos(a) * e.def.bulletSpeed, 4, bc(e), Math.sin(a) * e.def.bulletSpeed, 'ORB'));
              this.fx.burst(ex, ey, 5, bc(e), 90);
              this.enemyShotSfx(e, 1.3, 0.35);
              e.flashShot = 0.2;
            }
          }
          break;
        }
        case 'TURRET': {
          e.dir = aim;
          if (canSee && e.shot <= 0) {
            e.shot = e.def.shotInterval;
            const sy = e.y + 18;
            this.enemyBullets.push(new Bullet(e.x + e.w / 2 + e.dir * 22, sy, 9, 6, e.dir * e.def.bulletSpeed, 3, bc(e)));
            this.fx.burst(e.x + e.w / 2 + e.dir * 22, sy, 4, rgb(255, 141, 122), 90);
            this.enemyShotSfx(e, 0.62);
          }
          break;
        }
      }
      const hb = e.hitbox;
      if (!p.dead && !p.won && p.overlaps(hb)) {
        if (p.vy > Physics.STOMP_MIN_VY && p.y + p.h - hb.y < 24 && ((e.boss && e.def.id !== EYE_ID) || e.mini)) {
          // Jefes blindados: pisarlos no les hace daño; despiden al jugador hacia un lado.
          const side = p.cx < hb.cx ? -1 : 1;
          this.damage(1, side * 420, Physics.STOMP_BOUNCE * 1.3);
          p.vy = Math.min(p.vy, Physics.STOMP_BOUNCE * 1.3); p.vx = side * 420;
          for (let k = 0; k < 14; k++) {
            const a = R() * 6.283, sp = 120 + R() * 220;
            this.fx.spawn('SPARK', p.cx, p.y + p.h, Math.cos(a) * sp, Math.sin(a) * sp - 80, 0.3, 2, rgb(190, 140, 255));
          }
          this.fx.burst(p.cx, p.y + p.h, 10, rgb(170, 120, 255), 200);
          this.screenFlash = Math.max(this.screenFlash, 0.25);
          this.events.sfx('espada_escudo', 0.6);
        } else if (p.vy > Physics.STOMP_MIN_VY && p.y + p.h - hb.y < 24) {
          e.hp -= Physics.STOMP_DAMAGE; e.flash = 0.12; p.vy = Physics.STOMP_BOUNCE;
          this.target.onHit(e);
          this.fx.burst(hb.cx, hb.y + 4, 8, rgb(255, 209, 102), 130);
          this.events.sfx('espada_golpe', 0.8);
          if (e.hp <= 0) this.killEnemy(e);
        } else if (e.def.behavior !== 'DOG') this.damage(1, (p.x < e.x ? -1 : 1) * 330, -330);
      }
    }
  },

  makeNoise(r) { this.noise = Math.max(this.noise, r); },

  /** ¿Hay vista directa entre dos puntos? Paredes, compuertas cerradas y techos la cortan. */
  lineClear(x1, y1, x2, y2) {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2), top = Math.min(y1, y2), bot = Math.max(y1, y2);
    const cand = this.world.solids.filter((s) => s.x < hi && s.x + s.w > lo && s.y < bot && s.y + s.h > top && s.h > 6);
    if (!cand.length) return true;
    const n = Math.max(1, Math.trunc(Math.hypot(x2 - x1, y2 - y1) / 20));
    for (let i = 1; i < n; i++) {
      const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (cand.some((s) => s.contains(x, y))) return false;
    }
    return true;
  },

  humanDeathSfx() { this.events.sfx('hit', 0.7 * IMPACT_VOLUME); this.events.sfx('explosion_piloted'); },
  /** Disparo enemigo: el mismo sonido que el del jugador pero más grave y bajo (solo si se ve). */
  enemyShotSfx(e, rate, volume = 0.5) { if (this.onScreen(e.x, 40)) this.events.sfx('shoot', volume * SHOT_VOLUME, rate); },

  /** Despierta al perro y a los dormidos de su jauría, con un pequeño desfase. */
  wakePack(e) {
    if (e.dogState === DOG_SLEEPING) { e.dogState = DOG_WAKING; e.dogT = 0; }
    let n = 0;
    for (const o of this.enemies) {
      if (o.dead || o.dogState !== DOG_SLEEPING || Math.abs(o.x - e.x) > DOG_PACK_RANGE || Math.abs(o.y - e.y) > 90) continue;
      o.dogState = DOG_WAKING; o.dogT = -0.08 * (++n % 5);
    }
    if (this.onScreen(e.x)) { this.events.sfx('dash', 0.5); this.toast(tr('¡LA JAURÍA DESPERTÓ!')); }
  },

  updateDog(e, dt, dx, dy) {
    const p = this.player;
    e.dogT += dt;
    const before = e.x;
    const near = !p.dead && Math.abs(dx) < DOG_SIGHT && Math.abs(dy) < 80 && p.cx > e.min - 60 && p.cx < e.max + e.w + 60;
    if (e.dogState === DOG_SLEEPING) {
      const dist = Math.hypot(dx, dy);
      e.alert = !p.dead && dist < DOG_ALERT_RANGE && Math.abs(dy) < 120 ? Math.min(1, e.alert + dt * 3) : Math.max(0, e.alert - dt * 1.5);
      if (e.hp < e.maxHp || (!p.dead && this.noise > 0 && dist < this.noise)) this.wakePack(e);
      return;
    }
    if (e.dogState === DOG_WAKING) {
      e.alert = 0;
      if (e.dogT > DOG_WAKE_TIME) { e.dogState = near ? 1 : 0; e.dogT = 0; }
    } else if (e.dogState === 0) {
      e.x += e.dir * e.def.speed * dt;
      if (e.x < e.min) { e.x = e.min; e.dir = 1; }
      if (e.x > e.max) { e.x = e.max; e.dir = -1; }
      if (near) { e.dogState = 1; e.dogT = 0; if (this.onScreen(e.x)) this.events.sfx('dash', 0.3); }
    } else if (e.dogState === 1) {
      const target = p.cx - e.w / 2 + ((Math.trunc(e.min) + Math.trunc(Math.trunc(e.x) / 400)) % 3 - 1) * 12;
      e.dir = target < e.x ? -1 : 1;
      if (Math.abs(target - e.x) > 4) e.x += e.dir * Math.min(DOG_RUN * dt, Math.abs(target - e.x));
      e.x = clamp(e.x, e.min, e.max);
      if (!p.dead && p.invuln <= 0 && p.overlaps(e.hitbox)) {
        this.damage(e.def.bulletDamage, e.dir * 200, -160);
        e.flashShot = 0.25;
        this.fx.burst(e.dir > 0 ? e.x + e.w : e.x, e.y + 12, 8, rgb(190, 120, 255), 120);
        this.events.sfx('hit', 0.8);
        e.dogState = 2; e.dogT = 0;
      } else if (!near && e.dogT > 1.2) { e.dogState = 0; e.dogT = 0; }
    } else {
      // Se suelta: salto corto hacia atrás y vuelve a atacar.
      if (e.dogT < 0.25) e.x = clamp(e.x - e.dir * 260 * dt, e.min, e.max);
      if (e.dogT > DOG_RELEASE) { e.dogState = near ? 1 : 0; e.dogT = 0; }
    }
    e.stride += Math.abs(e.x - before);
  },

  // ===================================================================== Trampas, llaves, puertas y objetivos
  meteorPath(m) {
    let y = Meteor.START_Y;
    while (y < Physics.WORLD_HEIGHT + 60) {
      const x = m.xAt(y);
      if (this.world.solids.some((s) => s.contains(x, y))) break;
      y += 8;
    }
    m.endY = y; m.endX = m.xAt(y);
  },
  meteorBlast(m) {
    m.flying = false;
    if (m.py > Physics.WORLD_HEIGHT) return;
    if (this.onScreen(m.px)) {
      this.shake = Math.max(this.shake, this.fx.explosion(m.px, m.py, 0.55) * 0.6);
      this.events.sfx('explosion', 0.4);
    }
  },

  updateTraps(dt) {
    const p = this.player, w = this.world;
    const alive = !p.dead && !p.won;
    this.lockedHintTimer = Math.max(0, this.lockedHintTimer - dt);
    // ---- Plataformas que caen
    for (const cr of w.crumbles) {
      if (cr.falling) {
        cr.vy = Math.min(cr.vy + Physics.GRAVITY * 0.7 * dt, 900);
        cr.y += cr.vy * dt; cr.respawn += dt;
        if (cr.respawn > CRUMBLE_RESPAWN && !p.overlaps(new Box(cr.x, cr.homeY - 4, cr.w, cr.h + 4))) {
          cr.restore(); w.solids.push(cr);
          this.fx.burst(cr.cx, cr.y + cr.h / 2, 10, rgb(120, 200, 255), 90);
        }
        continue;
      }
      if (cr.timer < 0) {
        const standing = alive && p.grounded && Math.abs(p.y + p.h - cr.y) < 2 && p.x + p.w > cr.x && p.x < cr.x + cr.w;
        if (standing) { cr.timer = 0; this.events.sfx('hit', 0.35); this.fx.dust(p.cx, cr.y); }
      } else {
        cr.timer += dt;
        if (R() < dt * 20) this.fx.spawn('DOT', cr.x + R() * cr.w, cr.y + cr.h, 0, 60 + R() * 60, 0.4, 2, rgb(150, 160, 180));
        if (cr.timer >= CRUMBLE_DELAY) {
          cr.falling = true;
          const i = w.solids.indexOf(cr); if (i >= 0) w.solids.splice(i, 1);
          this.fx.burst(cr.cx, cr.y + cr.h, 12, rgb(150, 160, 180), 120);
          if (this.onScreen(cr.cx)) this.events.sfx('explosion', 0.25);
        }
      }
    }
    // ---- Resortes
    for (const sp of w.springs) {
      sp.squash = Math.max(0, sp.squash - dt * 4);
      if (!alive || p.climbing || p.vy < 0 || !p.overlaps(sp)) continue;
      if (p.y + p.h > sp.y + sp.h + 4) continue;
      p.y = sp.y - p.h; p.vy = -sp.power * Physics.PLAYER_VERT;
      p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; p.jumps = 1; p.jumpTime = 0; p.springLaunch = true;
      p.gliding = false; p.wallCling = false; p.wallClingArmed = false;
      if (p.sliding) p.sliding = false;
      sp.squash = 1;
      this.fx.burst(sp.cx, sp.y, 12, rgb(255, 214, 90), 170);
      this.events.sfx('jump', 1);
    }
    // ---- Láseres (y chorros de fuego) que brotan del suelo o del techo
    for (const l of w.lasers) {
      const dist = Math.abs(p.cx - l.x);
      if (!l.active && dist < LASER_WAKE_RANGE) { l.active = true; l.clock = 0; }
      else if (l.active && dist > LASER_WAKE_RANGE + 200) l.active = false;
      if (!l.active) { l.state = 0; l.k = 0; continue; }
      l.clock += dt;
      const t = (((l.clock + l.offset) % l.period) + l.period) % l.period;
      const warnStart = l.period - l.on - LASER_WARN;
      const prev = l.state;
      if (t < warnStart) { l.state = 0; l.k = t / warnStart; }
      else if (t < l.period - l.on) { l.state = 1; l.k = (t - warnStart) / LASER_WARN; }
      else { l.state = 2; l.k = (t - (l.period - l.on)) / l.on; }
      if (l.state === 2 && prev !== 2 && this.onScreen(l.x)) {
        this.events.sfx('dash', 0.45);
        this.fx.burst(l.x, l.floorY - 4, 8, rgb(255, 80, 90), 160);
      }
      if (l.state === 2 && alive && p.overlaps(l.beam)) {
        if (this.damage(1, (p.cx < l.x ? -1 : 1) * 300, -380) && l.fire) {
          this.fx.burst(p.cx, p.y + p.h * 0.6, 16, rgb(255, 150, 40), 220);
          this.fx.burst(p.cx, p.y + p.h * 0.4, 8, rgb(255, 230, 120), 150);
          for (let i = 0; i < 6; i++) {
            this.fx.spawn('SMOKE', p.x + R() * p.w, p.y + R() * p.h, (R() - 0.5) * 40, -40 - R() * 50, 0.8, 7 + R() * 6, rgb(60, 56, 54));
          }
          this.events.sfx('detonation', 0.35, 1.6);
        }
      }
    }
    // ---- Meteoritos
    for (const m of w.meteors) {
      const dist = Math.abs(p.cx - m.x);
      if (!m.active && dist < METEOR_WAKE_RANGE) { m.active = true; m.clock = 0; m.cycle = 0; }
      else if (m.active && !m.flying && dist > METEOR_WAKE_RANGE + 300) { m.active = false; m.warn = 0; }
      if (m.active) {
        m.clock += dt;
        const phase = m.clock + m.offset;
        const t = ((phase % m.period) + m.period) % m.period;
        const warnFrom = m.period - METEOR_WARN;
        const wasWarn = m.warn;
        m.warn = t >= warnFrom ? (t - warnFrom) / METEOR_WARN : 0;
        if (m.warn > 0 && wasWarn === 0) this.meteorPath(m);
        const cycle = Math.floor(phase / m.period);
        if (cycle > m.cycle) {
          m.cycle = cycle;
          if (!m.flying) {
            m.flying = true; m.py = Meteor.START_Y; m.px = m.xAt(m.py);
            if (this.onScreen(m.x, 300)) this.events.sfx('dash', 0.4);
          }
        }
      }
      if (!m.flying) continue;
      const step = METEOR_SPEED * dt, n = Math.ceil(step / 10);
      for (let i = 0; i < n; i++) {
        m.py += step / n; m.px = m.xAt(m.py);
        if (alive && p.invuln <= 0 && m.px > p.x - METEOR_R && m.px < p.x + p.w + METEOR_R && m.py > p.y - METEOR_R && m.py < p.y + p.h + METEOR_R) {
          this.meteorBlast(m); this.die('Te alcanzó un meteorito'); break;
        }
        if (w.solids.some((s) => s.contains(m.px, m.py)) || m.py > Physics.WORLD_HEIGHT + 60) { this.meteorBlast(m); break; }
      }
      if (m.flying && R() < dt * 60) {
        this.fx.spawn('DOT', m.px, m.py, -m.dir * 40 + (R() - 0.5) * 60, -60 - R() * 60, 0.35, 2.5, R() < 0.5 ? rgb(255, 170, 60) : rgb(255, 230, 150));
      }
    }
    // ---- Compuertas automáticas
    for (const d of w.autoDoors) {
      const nearX = p.cx > d.x - AUTO_DOOR_RANGE && p.cx < d.x + d.w + AUTO_DOOR_RANGE;
      const nearY = p.y < d.y + d.fullH + 10 && p.y + p.h > d.y - 30;
      const inside = p.x < d.x + d.w && p.x + p.w > d.x && p.y < d.y + d.fullH && p.y + p.h > d.y;
      const want = (alive && nearX && nearY) || inside ? 1 : 0;
      if (want > 0 && d.open === 0 && this.onScreen(d.x)) this.events.sfx('dash', 0.35, 0.55);
      d.open = want > d.open ? Math.min(1, d.open + dt * 3.2) : Math.max(0, d.open - dt * 2.2);
      d.h = Math.max(2, d.fullH * (1 - d.open));
    }
    // ---- Suelos electrificados
    for (const sh of w.shocks) {
      const t = (((this.time + sh.offset) % sh.period) + sh.period) % sh.period;
      const warnStart = sh.period - sh.on - SHOCK_WARN;
      const prev = sh.state;
      if (t < warnStart) { sh.state = 0; sh.k = t / warnStart; }
      else if (t < sh.period - sh.on) { sh.state = 1; sh.k = (t - warnStart) / SHOCK_WARN; }
      else { sh.state = 2; sh.k = (t - (sh.period - sh.on)) / sh.on; }
      if (sh.state === 2 && prev !== 2 && this.onScreen(sh.x)) this.events.sfx('energy_empty', 0.5, 1.4);
      if (sh.state === 2 && alive && p.overlaps(sh) && p.grounded) {
        if (this.damage(1, (p.cx < sh.x + sh.w / 2 ? -1 : 1) * 240, -420)) {
          this.fx.burst(p.cx, p.y + p.h, 18, rgb(150, 220, 255), 260);
          this.fx.burst(p.cx, p.cy, 10, WHITE, 180);
        }
      }
    }
    // ---- Sierras
    for (const sw of w.saws) {
      sw.angle += dt * 14;
      if (sw.speed > 0) {
        if (sw.axisX) { sw.x += sw.dir * sw.speed * dt; if (sw.x > sw.max) { sw.x = sw.max; sw.dir = -1; } if (sw.x < sw.min) { sw.x = sw.min; sw.dir = 1; } }
        else { sw.y += sw.dir * sw.speed * dt; if (sw.y > sw.max) { sw.y = sw.max; sw.dir = -1; } if (sw.y < sw.min) { sw.y = sw.min; sw.dir = 1; } }
      }
      if (!alive) continue;
      const nx = clamp(sw.x, p.x, p.x + p.w), ny = clamp(sw.y, p.y, p.y + p.h);
      if (Math.hypot(nx - sw.x, ny - sw.y) < sw.r * 0.85) {
        // Corta (sin sangre en este juego: chispas).
        if (R() < dt * 30) this.fx.burst(nx, ny, 3, rgb(255, 210, 120), 200);
        if (this.damage(SAW_DAMAGE, (p.cx < sw.x ? -1 : 1) * 360, -360, false)) {
          this.fx.burst(nx, ny, 16, rgb(255, 210, 120), 320);
          this.fx.burst(nx, ny, 10, rgb(255, 240, 200), 220);
          this.humanDeathSfx();
        }
      }
    }
    // ---- Guillotinas
    for (const g of w.guillotines) {
      const t = (((this.time + g.offset) % g.period) + g.period) % g.period;
      const prevY = g.y, travel = g.bottom - g.top;
      g.warn = 0;
      if (t < GUILLO_DROP) { const k = t / GUILLO_DROP; g.y = g.top + travel * k * k; }
      else if (t < GUILLO_DROP + GUILLO_HOLD) g.y = g.bottom;
      else if (t < GUILLO_DROP + GUILLO_HOLD + GUILLO_RISE) g.y = g.bottom - travel * ((t - GUILLO_DROP - GUILLO_HOLD) / GUILLO_RISE);
      else { if (t > g.period - GUILLO_WARN) g.warn = (t - (g.period - GUILLO_WARN)) / GUILLO_WARN; g.y = g.top; }
      g.blade.y = g.y - g.blade.h;
      if (prevY < g.bottom && g.y >= g.bottom && this.onScreen(g.x + g.w / 2)) {
        this.shake = Math.max(this.shake, 6);
        this.events.sfx('explosion', 0.3);
        this.fx.burst(g.x + 6, g.bottom - 2, 6, rgb(255, 200, 120), 180);
        this.fx.burst(g.x + g.w - 6, g.bottom - 2, 6, rgb(255, 200, 120), 180);
        this.fx.dust(g.x + g.w / 2, g.bottom);
      }
      if (alive && g.y > g.top + 6 && p.overlaps(g.blade)) this.damage(2, (p.cx < g.x + g.w / 2 ? -1 : 1) * 360, -300);
    }
    // ---- Llaves
    for (const k of w.keys) {
      if (k.taken || !alive || !p.overlaps(k)) continue;
      k.taken = true; this.keysHeld.add(k.id);
      if (isSeal(k.id)) {
        this.recoveredText = this.keyNameOf(k.id); this.recoveredTimer = 3.6;
        this.toast(tr('SELLOS CORONA {0}/3', [...this.keysHeld].filter(isSeal).length));
      } else this.toast(tr('{0} OBTENIDA', this.keyNameOf(k.id)));
      this.fx.burst(k.cx, k.cy, 22, this.keyColorOf(k.id), 200);
      this.screenFlash = Math.max(this.screenFlash, 0.35);
      this.events.sfx('pickup');
    }
    // ---- Puertas
    for (const d of w.doors) {
      if (d.opening) {
        const before = d.open;
        d.open = Math.min(1, d.open + dt / DOOR_OPEN_TIME);
        if (before < 0.45 && d.open >= 0.45) { const i = w.solids.indexOf(d); if (i >= 0) w.solids.splice(i, 1); }
        if (d.open < 1 && R() < dt * 25) this.fx.dust(d.x + R() * d.w, d.y + d.h);
        continue;
      }
      if (!alive || !p.overlaps(new Box(d.x - 26, d.y, d.w + 52, d.h))) continue;
      if (this.hasKey(d.key)) {
        d.opening = true; this.shake = Math.max(this.shake, 5);
        this.toast(isSeal(d.key) ? 'LOS SELLOS CORONA ABREN EL PASO' : 'PUERTA ABIERTA');
        this.events.sfx('checkpoint');
        this.fx.burst(d.cx, d.y + 30, 14, this.keyColorOf(d.key), 160);
      } else if (this.lockedHintTimer <= 0) {
        this.lockedHintTimer = 2.5;
        const need = d.key.split('+');
        this.toast(need.length > 1 ? tr('Necesitas los {0} SELLOS CORONA ({1}/{0})', need.length, need.filter((k) => this.keysHeld.has(k)).length)
          : tr('Necesitas la {0}', this.keyNameOf(d.key)));
        this.events.sfx('energy_empty', 0.7);
      }
    }
    for (const tg of w.targets) tg.flash = Math.max(0, tg.flash - dt);
    for (const br of w.breakables) br.flash = Math.max(0, br.flash - dt);
    for (const b of w.barriers) if (b.disabled) b.off = Math.min(1, b.off + dt * 1.6);
  },

  hasKey(key) { return key.split('+').every((k) => this.keysHeld.has(k)); },

  /** Cristal que bloquea un paso: se agrieta con cada impacto y estalla en esquirlas al romperse. */
  hitBreakable(br, amount, x, y) {
    br.hp -= amount; br.flash = 0.1;
    this.fx.burst(x, y, 5, rgb(210, 150, 255), 120);
    this.events.sfx('romper', 0.45, 1.3);
    if (br.hp > 0) return;
    br.dead = true;
    const i = this.world.solids.indexOf(br); if (i >= 0) this.world.solids.splice(i, 1);
    for (let k = 0; k < 3; k++) this.fx.burst(br.x + R() * br.w, br.y + R() * br.h, 10, rgb(200, 130, 255), 240);
    this.fx.burst(br.cx, br.cy, 16, rgb(255, 230, 255), 200);
    this.shake = Math.max(this.shake, 5);
    this.events.sfx('romper', 0.8);
  },

  hitTarget(tg, amount, x, y) {
    tg.hp -= amount; tg.flash = 0.1;
    this.fx.burst(x, y, 6, rgb(255, 209, 102), 110);
    this.events.sfx('romper', 0.5, 1.2);
    if (tg.hp > 0) return;
    tg.dead = true;
    // Ídolo de piedra: se parte en cascajo y la sombra que lo habitaba se disipa (antes, explosión de fuego).
    for (let k = 0; k < 4; k++) this.fx.burst(tg.x + R() * tg.w, tg.y + R() * tg.h, 8, rgb(150, 140, 125), 260);
    this.shake = Math.max(this.shake, this.fx.disipar(tg.cx, tg.cy, 1.2));
    this.events.sfx('romper', 1, 0.75); this.events.sfx('sombra_disipa', 0.7);
    const w = this.world;
    const done = w.targets.filter((t) => t.dead).length, total = w.targets.length;
    const label = this.level.objectives.find((o) => o.type === 'targets')?.label ?? tr('OBJETIVOS');
    if (done < total) { this.toast(`${label} ${done}/${total}`); return; }
    this.toast(w.barriers.length ? 'BARRERA DESACTIVADA' : `${label} ${done}/${total}`);
    this.screenFlash = Math.max(this.screenFlash, 0.7);
    for (const b of w.barriers) {
      b.disabled = true;
      const i = w.solids.indexOf(b); if (i >= 0) w.solids.splice(i, 1);
      this.fx.burst(b.cx, b.cy, 30, rgb(120, 220, 255), 260);
    }
  },

  /** Texto del objetivo actual (primer paso sin cumplir) o null si el nivel no define objetivos. */
  objectiveText() {
    const w = this.world;
    for (const o of this.level.objectives) {
      if (o.type === 'key') { if (!this.keysHeld.has(o.id)) return o.label; }
      else if (o.type === 'keys') {
        const need = (o.id ?? '').split('+'), n = need.filter((k) => this.keysHeld.has(k)).length;
        if (n < need.length) return `${o.label} ${n}/${need.length}`;
      } else if (o.type === 'targets') {
        const done = w.targets.filter((t) => t.dead).length;
        if (done < w.targets.length) return `${o.label} ${done}/${w.targets.length}`;
      } else if (o.type === 'boss') { if (this.boss?.dead === false || this.partner?.dead === false) return o.label; }
      else if (o.type === 'goal') return o.label;
    }
    return null;
  },

  // ===================================================================== Jefes
  /** Goliat (Warden Goliath): camina, ráfaga baja/alta, lluvia sobre marcas y salto pesado con ondas. */
  updateBoss(e, dt) {
    const st = e.boss; if (!st) return;
    const p = this.player, floorY = st.groundY + e.h;
    st.t += dt;
    st.warnings.forEach((wv) => { wv[1] -= dt; });
    st.warnings = st.warnings.filter((wv) => wv[1] > 0);
    if (st.move !== 'CANNON') st.charge = Math.max(0, st.charge - dt * 3);
    if (st.move !== 'MISSILES') st.podsOpen = Math.max(0, st.podsOpen - dt * 2.5);
    const ownFacing = [AEGIS_ID, SCOUT_ID, ASSAULT_ID, REGENT_ID].includes(e.def.id);
    if (st.move !== 'STOMP' && st.move !== 'SLEEP' && !ownFacing) e.dir = p.cx < e.x + e.w / 2 ? -1 : 1;
    if (!st.enraged && e.hp <= e.maxHp / 2 && e.def.id !== REGENT_ID) this.enrage(e, st);
    const rage = st.enraged;
    const awake = st.move !== 'SLEEP' && st.move !== 'INTRO';
    if (awake && !st.desperate && e.hp <= e.maxHp * DESPERATE_HP) {
      st.desperate = true; st.desperateT = 1.2;
      this.shake = Math.max(this.shake, 16); this.screenFlash = Math.max(this.screenFlash, 0.4);
      this.fx.burst(e.x + e.w / 2, e.y + e.h * 0.4, 30, rgb(255, 60, 40), 300);
      this.toast(tr('¡{0} AL LÍMITE!', e.def.name));
    }
    if (awake && st.desperate) {
      st.t += dt * DESPERATE_SPEED;
      st.desperateT -= dt;
      if (st.desperateT <= 0) { st.desperateT = 3.2 + R() * 1.3; if (e.def.id !== REGENT_ID) this.desperateRain(e, st); }
    }
    if (awake) this.callMinions(e, st, dt);
    if (e.def.id === EYE_ID) { this.updateEye(e, st, dt); return; }
    if (e.def.id === SERAPH_ID) { this.updateSeraph(e, st, dt); return; }
    if (e.def.id === AEGIS_ID) { this.updateAegis(e, st, dt); return; }
    if (e.def.id === SCOUT_ID || e.def.id === ASSAULT_ID) { this.updateElite(e, st, dt); return; }
    if (e.def.id === REGENT_ID) { this.updateRegent(e, st, dt); return; }

    switch (st.move) {
      case 'SLEEP':
        if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        break;
      case 'INTRO':
        st.podsOpen = Math.min(1, st.t / 0.8);
        if (st.t > 0.9) this.shake = Math.max(this.shake, 6);
        if (st.t > 1.8) st.go('WALK');
        break;
      case 'WALK': {
        const side = p.cx < e.x + e.w / 2 ? 1 : -1;
        const goalX = p.cx + side * 330 - e.w / 2;
        const speed = e.def.speed * (rage ? 1.5 : 1);
        if (Math.abs(goalX - e.x) > 12) e.x += sign(goalX - e.x) * speed * dt;
        e.x = clamp(e.x, e.min, e.max);
        if (st.t > (rage ? 0.75 : 1.3)) {
          const order = ['CANNON', 'MISSILES', 'CANNON', 'STOMP'];
          st.go(order[st.cycle % order.length]); st.cycle++;
        }
        break;
      }
      case 'CANNON': {
        const windup = 0.6, gap = rage ? 0.34 : 0.46, shots = rage ? 5 : 3;
        st.charge = Math.min(1, st.t / windup);
        if (st.t >= windup + st.step * gap && st.step < shots) {
          const low = st.step % 2 === 0, bh = low ? 18 : 14, by = low ? floorY - 24 : floorY - 50;
          const bx = e.x + e.w / 2 + e.dir * (e.w / 2 + 4);
          const [fx0, fy0] = this.titanShot(e, bx, by, 30, bh, e.def.bulletSpeed * (rage ? 1.15 : 1), 4, low);
          this.fx.burst(fx0, fy0, 7, rgb(255, 150, 90), 140);
          this.shake = Math.max(this.shake, 4);
          this.events.sfx('shoot', 0.9 * SHOT_VOLUME);
          st.step++;
        }
        if (st.step >= shots && st.t > windup + shots * gap + 0.3) st.go('WALK');
        break;
      }
      case 'MISSILES': {
        st.podsOpen = Math.min(1, st.t / 0.45);
        if (st.t >= 0.55 && st.step === 0) {
          st.step = 1;
          const offsets = rage ? [-260, -130, 0, 130, 260] : [-170, 0, 170];
          offsets.forEach((off, i) => {
            const x = clamp(p.cx + off + (R() - 0.5) * 40, e.min - 100, e.max + e.w + 10);
            const delay = 1.05 + i * 0.12, startY = -60;
            st.warnings.push([x, delay]);
            this.enemyBullets.push(new Bullet(x - 8, startY, 16, 30, 0, delay + 1, rgb(255, 120, 60), (floorY - 30 - startY) / delay, 'MISSILE'));
          });
          for (let k = 0; k < 4; k++) this.fx.burst(e.x + e.w * (0.3 + 0.15 * k), e.y + 4, 5, rgb(255, 170, 90), 160);
          this.shake = Math.max(this.shake, 5);
          this.events.sfx('dash', 0.8);
        }
        if (st.t > 1.9) st.go('WALK');
        break;
      }
      case 'STOMP': {
        const crouch = 0.5;
        if (st.step === 0) {
          st.charge = Math.min(1, st.t / crouch);
          if (st.t >= crouch) { st.step = 1; st.vy = -760; st.charge = 0; this.fx.dust(e.x + e.w / 2, floorY); }
        } else if (st.step === 1) {
          st.vy += Physics.GRAVITY * dt;
          e.y += st.vy * dt;
          const targetX = p.cx - e.w / 2, air = rage ? 360 : 270;
          if (Math.abs(targetX - e.x) > 8) e.x += sign(targetX - e.x) * air * dt;
          e.x = clamp(e.x, e.min, e.max);
          if (e.y >= st.groundY) { e.y = st.groundY; st.vy = 0; st.step = 2; st.t = 0; this.shockwaves(e, floorY); }
        } else {
          if (rage && st.step === 2 && st.t > 0.45) { st.step = 3; this.shockwaves(e, floorY); }
          if (st.t > 0.9) st.go('WALK');
        }
        break;
      }
      default: st.go('WALK');
    }
  },

  /** Gran Ojo de la Envidia (Crimson Over-Eye): flota, rayo apuntado, abanico de esferas y caída con ondas. */
  updateEye(e, st, dt) {
    const p = this.player, floorY = st.groundY + e.h, hoverY = st.groundY - EYE_HOVER, rage = st.enraged;
    // El rayo y las esferas salen de la pupila del dibujo (antes, del centro de la caja).
    const [ex, ey] = puntoJefe(e, 'ojo') ?? [e.x + e.w / 2, e.y + e.h * 0.52];
    if (st.move !== 'EYE_BEAM') st.beamState = 0;
    switch (st.move) {
      case 'SLEEP':
        e.y = hoverY - 420;
        if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        break;
      case 'INTRO': {
        const k = clamp(st.t / 1.6, 0, 1);
        e.y = hoverY - 420 + 420 * (1 - (1 - k) * (1 - k));
        if (st.t > 1.2) this.shake = Math.max(this.shake, 4);
        if (st.t > 2) st.go('EYE_HOVER');
        break;
      }
      case 'EYE_HOVER': {
        const goalX = clamp(p.cx - e.w / 2 + Math.sin(st.t * 1.3) * 140, e.min, e.max);
        const speed = e.def.speed * (rage ? 1.4 : 1);
        if (Math.abs(goalX - e.x) > 6) e.x += sign(goalX - e.x) * speed * dt;
        e.y += (hoverY + Math.sin(this.time * 2) * 10 - e.y) * Math.min(1, dt * 4);
        if (st.t > (rage ? 0.9 : 1.4)) {
          const order = ['EYE_BEAM', 'EYE_ORBS', 'EYE_BEAM', 'EYE_DIVE'];
          st.go(order[st.cycle % order.length]); st.cycle++;
        }
        break;
      }
      case 'EYE_BEAM': {
        const aim = 1.0, lock = 0.3, fire = 0.5, cycle = aim + lock + fire, shots = rage ? 2 : 1;
        const tt = st.t - st.step * cycle;
        const want = Math.atan2(p.cy - ey, p.cx - ex);
        if (tt < aim) { st.beamState = 1; st.charge = tt / aim; st.beamAng += wrapPi(want - st.beamAng) * Math.min(1, dt * 7); }
        else if (tt < aim + lock) { if (st.beamState !== 2) this.events.sfx('energy_empty', 0.8); st.beamState = 2; }
        else if (tt < cycle) {
          if (st.beamState !== 3) { this.events.sfx('detonation', 0.7); this.shake = Math.max(this.shake, 7); }
          st.beamState = 3; st.charge = 1;
          if (!p.dead && this.beamHits(ex, ey, st.beamAng)) this.damage(1, (Math.cos(st.beamAng) > 0 ? 1 : -1) * 260, -300);
        } else { st.beamState = 0; st.step++; if (st.step >= shots) st.go('EYE_HOVER'); }
        break;
      }
      case 'EYE_ORBS': {
        st.charge = Math.min(1, st.t / 0.6);
        const waves = rage ? 2 : 1;
        if (st.step < waves && st.t >= 0.6 + st.step * 0.7) {
          const n = rage ? 9 : 7, skew = st.step % 2 === 0 ? 0 : 0.5;
          for (let i = 0; i < n; i++) {
            const a = (0.18 + (i + skew) / (n - 1) * 0.64) * PI;
            this.enemyBullets.push(new Bullet(ex - 8, ey - 8, 16, 16, Math.cos(a) * 230, 6, bc(e), Math.sin(a) * 230, 'ORB'));
          }
          this.fx.burst(ex, ey + 20, 12, bc(e), 160);
          this.events.sfx('shoot', 0.9 * SHOT_VOLUME);
          st.step++;
        }
        if (st.t > 0.6 + waves * 0.7 + 0.4) st.go('EYE_HOVER');
        break;
      }
      case 'EYE_DIVE': {
        if (st.step === 0) {
          if (st.t < 0.02) st.warnings.push([p.cx, 0.95]);
          const tx = (st.warnings.length ? st.warnings[st.warnings.length - 1][0] : p.cx) - e.w / 2;
          e.x += (clamp(tx, e.min, e.max) - e.x) * Math.min(1, dt * 5);
          e.y += (hoverY - 60 - e.y) * Math.min(1, dt * 4);
          st.charge = Math.min(1, st.t / 0.9);
          if (st.t >= 0.95) { st.step = 1; st.vy = 200; }
        } else if (st.step === 1) {
          st.vy += Physics.GRAVITY * 1.5 * dt;
          e.y += st.vy * dt;
          if (e.y >= st.groundY) { e.y = st.groundY; st.vy = 0; st.step = 2; st.t = 0; st.charge = 0; this.shockwaves(e, floorY); }
        } else if (st.step === 2) {
          if (R() < dt * 12) this.fx.burst(e.x + R() * e.w, e.y + e.h * 0.4, 2, rgb(190, 230, 90), 120);
          if (st.t > (rage ? 0.9 : 1.4)) { st.step = 3; st.t = 0; }
        } else {
          e.y += (hoverY - e.y) * Math.min(1, dt * 3.5);
          if (st.t > 0.9) st.go('EYE_HOVER');
        }
        break;
      }
      default: st.go('EYE_HOVER');
    }
  },

  /** Falso Ángel de Luz (Seraph Engine): en tierra; pasos y pisotón, rayo del rostro, plumas y lanzas. */
  updateSeraph(e, st, dt) {
    const p = this.player, floorY = st.groundY + e.h, rage = st.enraged, ex = e.x + e.w / 2;
    const face = p.cx < ex ? -1 : 1;
    this.updateLances(st, floorY, dt, rgb(200, 170, 255));
    if (st.move !== 'SER_EYES') st.beamState = 0;
    if (!['SER_FEATHERS', 'SER_STOMP', 'SER_LANCES', 'SER_EYES'].includes(st.move)) st.charge = Math.max(0, st.charge - dt * 3);
    if (st.move !== 'SER_FEATHERS') e.y = st.groundY;
    const backToWalk = () => st.go('SER_WALK');
    switch (st.move) {
      case 'SLEEP':
        e.dir = face;
        if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        break;
      case 'INTRO':
        e.dir = face;
        st.charge = Math.min(1, st.t / 1.6);
        if (st.t > 0.9 && st.step === 0) {
          st.step = 1; this.shake = Math.max(this.shake, 8); this.events.sfx('explosion', 0.5, 0.8);
          this.fx.dust(ex - 30, floorY, -1); this.fx.dust(ex + 30, floorY, 1);
        }
        if (st.t > 1.9) { st.charge = 0; backToWalk(); }
        break;
      case 'SER_WALK':
        e.dir = face;
        if (Math.abs(p.cx - ex) > SERAPH_NEAR) { e.x += e.dir * SERAPH_WALK * (rage ? 1.4 : 1) * dt; e.x = clamp(e.x, e.min, e.max); }
        if (st.t > (rage ? 0.9 : 1.4)) {
          const order = ['SER_EYES', 'SER_STOMP', 'SER_FEATHERS', 'SER_LANCES', 'SER_STOMP'];
          st.go(order[st.cycle % order.length]); st.cycle++;
        }
        break;
      case 'SER_STOMP': {
        const stepT = rage ? 0.38 : 0.46;
        if (st.step < 2) {
          if (st.t < 0.02) e.dir = face;
          const k = st.t / stepT;
          if (k < 0.7) { e.x += e.dir * (SERAPH_STEP / (stepT * 0.7)) * dt; e.x = clamp(e.x, e.min, e.max); }
          if (k >= 1) { this.shake = Math.max(this.shake, 6); this.events.sfx('explosion', 0.35, 1.1); this.fx.dust(ex, floorY, e.dir); st.step++; st.t = 0; }
        } else if (st.step === 2) {
          st.charge = Math.min(1, st.t / 0.4);
          if (st.t >= 0.4) { this.shockwaves(e, floorY); st.step = 3; st.t = 0; st.charge = 0; }
        } else {
          if (rage && st.step === 3 && st.t > 0.45) { st.step = 4; this.shockwaves(e, floorY); }
          if (st.t > (rage ? 0.9 : 0.7)) backToWalk();
        }
        break;
      }
      case 'SER_EYES': {
        const aim = 0.9, lock = 0.3, fire = 0.45, cycle = aim + lock + fire, shots = rage ? 2 : 1;
        const tt = st.t - st.step * cycle;
        if (st.t < 0.02) { e.dir = face; st.beamAng = e.dir > 0 ? 0 : PI; }
        const [bx, by] = this.seraphEye(e);
        const want = Math.atan2(p.cy - by, p.cx - bx);
        if (tt < aim) { st.beamState = 1; st.charge = tt / aim; st.beamAng += wrapPi(want - st.beamAng) * Math.min(1, dt * 7); }
        else if (tt < aim + lock) { if (st.beamState !== 2) this.events.sfx('energy_empty', 0.8); st.beamState = 2; }
        else if (tt < cycle) {
          if (st.beamState !== 3) { this.events.sfx('detonation', 0.7); this.shake = Math.max(this.shake, 7); }
          st.beamState = 3; st.charge = 1;
          if (!p.dead && this.beamHits(bx, by, st.beamAng)) this.damage(1, (Math.cos(st.beamAng) > 0 ? 1 : -1) * 260, -300);
        } else { st.beamState = 0; st.step++; if (st.step >= shots) backToWalk(); }
        break;
      }
      case 'SER_FEATHERS': {
        const windup = 0.6, gap = rage ? 0.38 : 0.5, volleys = rage ? 4 : 3, end = windup + volleys * gap + 0.3;
        const jetY = st.groundY - SERAPH_JET;
        e.dir = face;
        if (st.t < end) { e.y += (jetY + Math.sin(this.time * 2.4) * 6 - e.y) * Math.min(1, dt * 4); st.charge = Math.min(1, st.t / windup); }
        else { e.y += (st.groundY - e.y) * Math.min(1, dt * 6); st.charge = Math.max(0, st.charge - dt * 3); }
        if (R() < dt * 30) this.fx.burst(ex, e.y + e.h, 1, rgb(170, 150, 200), 60);
        if (st.step < volleys && st.t >= windup + st.step * gap) {
          const arma = puntoJefe(e, 'armaJet');
          const sx = arma ? arma[0] : ex + e.dir * 30, sy = arma ? arma[1] : e.y + e.h * 0.34;
          const base = Math.atan2(p.cy - sy, p.cx - sx);
          for (let k = -1; k <= 1; k++) {
            const a = base + k * 0.2;
            this.enemyBullets.push(new Bullet(sx - 7, sy - 3, 14, 6, Math.cos(a) * e.def.bulletSpeed, 3.5, bc(e), Math.sin(a) * e.def.bulletSpeed));
          }
          this.fx.burst(sx, sy, 6, bc(e), 120);
          this.events.sfx('shoot', 0.8 * SHOT_VOLUME);
          st.step++;
        }
        if (st.t > end + 0.6) {
          e.y = st.groundY; this.shake = Math.max(this.shake, 5);
          this.fx.dust(ex - 20, floorY, -1); this.fx.dust(ex + 20, floorY, 1);
          backToWalk();
        }
        break;
      }
      case 'SER_LANCES':
        e.dir = face;
        st.charge = Math.min(1, st.t / 0.5);
        if (st.step === 0 && st.t > 0.5) { this.castLances(e, st, rage ? 5 : 4, rage ? 0.12 : 0.18); st.step = 1; }
        if (st.step === 1 && !st.lances.length) backToWalk();
        break;
      default: backToWalk();
    }
  },

  /** Rostro del Falso Ángel (de donde sale su rayo). */
  seraphEye(e) { return puntoJefe(e, 'visor') ?? [e.x + e.w / 2 + e.dir * 12 * e.w / 96, e.y + e.h * 22 / 150]; },

  /** Lanzas (Falso Ángel, Leviatán): avanzan aunque el jefe cambie de ataque. */
  updateLances(st, floorY, dt, color) {
    const p = this.player;
    for (const l of st.lances) {
      const before = l[1];
      l[1] += dt;
      if (before < LANCE_WARN && l[1] >= LANCE_WARN) {
        this.shake = Math.max(this.shake, 5); this.events.sfx('detonation', 0.35);
        this.fx.burst(l[0], floorY - 6, 10, color, 200);
      }
      if (l[1] >= LANCE_WARN && l[1] <= LANCE_WARN + LANCE_ON && !p.dead && Math.abs(p.cx - l[0]) < SERAPH_LANCE_HALF + p.w / 2) {
        this.damage(1, (p.cx < l[0] ? -1 : 1) * 260, -320);
      }
    }
    st.lances = st.lances.filter((l) => l[1] <= LANCE_WARN + LANCE_ON);
  },

  /** Columnas de lanzas: una sobre el jugador y el resto repartidas, siempre con huecos. */
  castLances(e, st, n, stagger) {
    const left = e.min + 40, right = e.max + e.w - 40;
    const xs = [clamp(this.player.cx, left, right)];
    let tries = 0;
    while (xs.length < n && tries < 40) {
      tries++;
      const x = left + R() * (right - left);
      if (xs.every((v) => Math.abs(v - x) > SERAPH_LANCE_HALF * 2 + 110)) xs.push(x);
    }
    xs.forEach((x, i) => st.lances.push([x, -i * stagger]));
    this.events.sfx('energy_empty', 0.8);
  },

  enrage(e, st) {
    if (st.enraged) return;
    st.enraged = true;
    this.shake = Math.max(this.shake, 14);
    this.fx.burst(e.x + e.w / 2, e.y + e.h * 0.4, 24, rgb(255, 90, 60), 260);
    this.toast(tr('¡{0} SE ENFURECE!', e.def.name));
  },

  // ------------------------------------------------------------------ Duda y Desánimo (guardia de élite, N9)
  eliteIdle(e) { return e.def.id === SCOUT_ID ? 'EL_RUN' : 'EL_WALK'; },

  updateElite(e, st, dt) {
    const p = this.player, scout = e.def.id === SCOUT_ID, rage = st.enraged, ex = e.x + e.w / 2, floorY = st.groundY + e.h;
    const other = e === this.boss ? this.partner : this.boss;
    const face = p.cx < ex ? -1 : 1;
    const flying = scout && ((st.move === 'EL_JET' && st.step < 2) || st.move === 'EL_LINK' || st.move === 'INTRO' || st.move === 'SLEEP');
    if (!flying && (e.y < st.groundY || st.vy < 0)) {
      st.vy = Math.min(st.vy + Physics.GRAVITY * dt, Physics.MAX_FALL_SPEED);
      e.y += st.vy * dt;
      if (e.y >= st.groundY) { e.y = st.groundY; st.vy = 0; this.fx.dust(ex, floorY); }
    }
    const grounded = e.y >= st.groundY - 0.5;
    const before = e.x;
    const moveToward = (goalX, speed) => {
      const gx = clamp(goalX, e.min, e.max);
      if (Math.abs(gx - e.x) > 6) e.x += sign(gx - e.x) * Math.min(speed * dt, Math.abs(gx - e.x));
    };
    const aimedShot = (sx, sy, spread, maxAng, w, h, speed) => {
      let a = Math.atan2(p.cy - sy, p.cx - sx);
      const base = e.dir > 0 ? 0 : PI;
      a = base + clamp(wrapPi(a - base), -maxAng, maxAng) + spread;
      this.enemyBullets.push(new Bullet(sx - w / 2, sy - h / 2, w, h, Math.cos(a) * speed, 3.5, bc(e), Math.sin(a) * speed));
    };
    // Los disparos salen del arma del dibujo (lanza de la Duda, mano del Desánimo).
    const arma = () => puntoJefe(e, 'arma');
    switch (st.move) {
      case 'SLEEP':
        e.dir = face;
        if (e === this.boss) {
          if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.introTitle ?? e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        } else if (this.boss?.boss?.move !== 'SLEEP') st.go('INTRO');
        if (scout) e.y = -e.h - 40;
        break;
      case 'INTRO':
        e.dir = face;
        if (scout) {
          e.y = Math.min(st.groundY, e.y + 720 * dt);
          if (e.y >= st.groundY && st.step === 0) { st.step = 1; this.fx.dust(ex, floorY); this.shake = Math.max(this.shake, 5); }
        } else if (st.t > 0.6 && st.step === 0) { st.step = 1; this.shake = Math.max(this.shake, 8); this.fx.dust(ex, floorY); this.events.sfx('explosion', 0.4, 0.8); }
        if (st.t > 1.5) st.go(this.eliteIdle(e));
        break;
      case 'EL_RUN': {
        e.dir = face;
        const side = p.cx < ex ? 1 : -1;
        moveToward(p.cx + side * 280 - e.w / 2, e.def.speed * (rage ? 1.3 : 1));
        if (grounded && R() < dt * 0.9) st.vy = -560;
        if (st.t > (rage ? 0.55 : 1.0) && grounded) {
          const order = ['EL_SHOOT', 'EL_DASH', 'EL_JET', 'EL_SHOOT', 'EL_DASH'];
          st.go(order[st.cycle % order.length]); st.cycle++;
        }
        break;
      }
      case 'EL_SHOOT': {
        e.dir = face;
        const windup = 0.4, gap = 0.2, shots = rage ? 4 : 3;
        st.charge = Math.min(1, st.t / windup);
        if (st.t >= windup + st.step * gap && st.step < shots) {
          const a = arma() ?? [ex + e.dir * 22, e.y + e.h * 0.4];
          aimedShot(a[0], a[1], 0, 0.6, 12, 6, e.def.bulletSpeed);
          this.fx.burst(a[0], a[1], 4, bc(e), 100);
          this.enemyShotSfx(e, 0.95, 0.6);
          e.shot = e.def.shotInterval; st.step++;
        }
        if (st.step >= shots && st.t > windup + shots * gap + 0.25) { st.charge = 0; st.go('EL_RUN'); }
        break;
      }
      case 'EL_DASH':
        if (st.step === 0) {
          if (st.t < 0.02) {
            e.dir = face; st.fromX = e.x;
            st.toX = clamp(p.cx - e.w / 2 + e.dir * 240, e.min, e.max);
            this.events.sfx('energy_empty', 0.6, 1.3);
          }
          st.charge = Math.min(1, st.t / 0.65);
          if (R() < dt * 14) this.fx.dust(ex - e.dir * 12, floorY, -e.dir);
          if (st.t >= 0.65) { st.step = 1; st.t = 0; this.events.sfx('dash', 0.9, 1.2); }
        } else if (st.step === 1) {
          moveToward(st.toX, rage ? 1050 : 900);
          if (R() < dt * 40) this.fx.spawn('DOT', ex - e.dir * 20, e.y + R() * e.h, -e.dir * 200, 0, 0.2, 2.5, bc(e));
          if (Math.abs(e.x - st.toX) < 8 || e.x <= e.min || e.x >= e.max) { st.step = 2; st.t = 0; st.charge = 0; this.fx.dust(ex, floorY, e.dir); }
        } else if (st.t > (rage ? 0.3 : 0.5)) st.go('EL_RUN');
        break;
      case 'EL_JET': {
        const hoverY = st.groundY - 210;
        if (st.step === 0) {
          e.y += (hoverY - e.y) * Math.min(1, dt * 5);
          if (st.t < 0.02) this.events.sfx('dash', 0.7, 0.8);
          if (Math.abs(e.y - hoverY) < 12) { st.step = 1; st.t = 0; }
        } else if (st.step === 1) {
          e.dir = face;
          moveToward(p.cx - (p.cx < ex ? -1 : 1) * 170 - e.w / 2, 260);
          e.y = hoverY + Math.sin(this.time * 3) * 6;
          const volleys = rage ? 3 : 2;
          st.charge = Math.min(1, (st.t % 0.5) / 0.4);
          if (st.count < volleys && st.t >= 0.5 * (st.count + 1)) {
            const a = arma() ?? [ex + e.dir * 14, e.y + e.h * 0.55];
            for (let k = -1; k <= 1; k++) aimedShot(a[0], a[1], k * 0.22, 1.3, 10, 10, e.def.bulletSpeed * 0.8);
            this.fx.burst(a[0], a[1], 5, bc(e), 110);
            this.enemyShotSfx(e, 1.1, 0.6);
            st.count++;
          }
          if (st.count >= volleys && st.t > 0.5 * (volleys + 1) + 0.3) { st.step = 2; st.vy = 0; st.charge = 0; }
        } else if (grounded) st.go('EL_RUN');
        break;
      }
      case 'EL_WALK':
        e.dir = face;
        if (Math.abs(p.cx - ex) > 420 || Math.abs(p.cx - ex) < 300) {
          const side = p.cx < ex ? 1 : -1;
          moveToward(p.cx + side * 380 - e.w / 2, e.def.speed * (rage ? 1.5 : 1));
        }
        if (st.t > (rage ? 1.0 : 1.6)) {
          const scoutReady = other && !other.dead && other.boss?.move === 'EL_RUN' && other.y >= (other.boss?.groundY ?? 0) - 1;
          if (st.cycle % 3 === 2 && scoutReady) this.startLink(e, st, other);
          else {
            const order = ['EL_BURST', 'EL_GRENADE', 'EL_CHARGE', 'EL_BURST', 'EL_GRENADE'];
            st.go(order[st.cycle % order.length]);
          }
          st.cycle++;
        }
        break;
      case 'EL_BURST': {
        e.dir = face;
        const windup = 0.55, gap = rage ? 0.22 : 0.28, shots = rage ? 4 : 3;
        st.charge = Math.min(1, st.t / windup);
        if (st.t >= windup + st.step * gap && st.step < shots) {
          const a = arma() ?? [ex + e.dir * 28, e.y + e.h * 0.42];
          aimedShot(a[0], a[1], 0, 0.45, 16, 8, e.def.bulletSpeed);
          this.fx.burst(a[0], a[1], 6, bc(e), 120);
          this.enemyShotSfx(e, 0.7, 0.7);
          e.shot = e.def.shotInterval; this.shake = Math.max(this.shake, 3); st.step++;
        }
        if (st.step >= shots && st.t > windup + shots * gap + 0.35) { st.charge = 0; st.go('EL_WALK'); }
        break;
      }
      case 'EL_GRENADE': {
        e.dir = face;
        const windup = 0.55, n = rage ? 4 : 3;
        st.mortarAim = Math.min(1, st.t / windup);
        if (st.t >= windup + st.step * 0.18 && st.step < n) {
          const offs = [-150, 0, 150, 280 * e.dir];
          const tx = clamp(p.cx + offs[st.step] + (R() - 0.5) * 40, e.min - 80, e.max + e.w + 80);
          const sx = ex + e.dir * 18, sy = e.y + 8, tf = GRENADE_TIME;
          const vy0 = (floorY - 10 - sy - 0.5 * GRENADE_G * tf * tf) / tf;
          this.enemyBullets.push(new Bullet(sx - 8, sy - 8, 16, 16, (tx - sx) / tf, tf + 1, bc(e), vy0, 'GRENADE', 1, GRENADE_G));
          st.warnings.push([tx, tf]);
          this.events.sfx('jump', 0.5, 0.6);
          st.step++;
        }
        if (st.step >= n && st.t > windup + n * 0.18 + 0.5) { st.mortarAim = 0; st.go('EL_WALK'); }
        break;
      }
      case 'EL_CHARGE': {
        e.dir = face;
        const windup = 1.0, orbs = rage ? 2 : 1;
        st.charge = Math.min(1, st.t / windup);
        if (R() < dt * 25 * st.charge) {
          const a = R() * 6.283;
          this.fx.spawn('DOT', ex + e.dir * 26 + Math.cos(a) * 30, e.y + e.h * 0.45 + Math.sin(a) * 30, -Math.cos(a) * 60, -Math.sin(a) * 60, 0.3, 2.5, bc(e));
        }
        if (st.t >= windup + st.step * 0.45 && st.step < orbs) {
          const by = floorY - 48;
          this.enemyBullets.push(new Bullet(ex + e.dir * 30 - 14, by, 28, 28, e.dir * 300, 5, bc(e), 0, 'ORB'));
          this.fx.burst(ex + e.dir * 30, by + 14, 14, bc(e), 180);
          this.shake = Math.max(this.shake, 6);
          this.events.sfx('detonation', 0.5, 1.2);
          st.step++;
        }
        if (st.step >= orbs && st.t > windup + orbs * 0.45 + 0.4) { st.charge = 0; st.go('EL_WALK'); }
        break;
      }
      case 'EL_LINK': this.updateLink(e, st, dt); break;
      default: st.go(this.eliteIdle(e));
    }
    e.vx = (e.x - before) / Math.max(dt, 1e-4);
  },

  startLink(a, st, s) {
    const sst = s.boss; if (!sst) return;
    st.go('EL_LINK'); sst.go('EL_LINK');
    const left = a.min + 60, right = a.max + a.w - 60;
    sst.toX = (a.x + a.w / 2 < (left + right) / 2 ? right : left) - s.w / 2;
    this.toast(tr('¡ENLACE DE SOMBRA!'));
    this.events.sfx('energy_empty', 0.9, 0.6);
  },

  updateLink(e, st, dt) {
    const scout = e.def.id === SCOUT_ID, ex = e.x + e.w / 2;
    if (scout) {
      e.x += (st.toX - e.x) * Math.min(1, dt * 3.5);
      e.y += (st.groundY - 150 + Math.sin(this.time * 3) * 4 - e.y) * Math.min(1, dt * 4);
      const a = this.boss;
      e.dir = a && a.x + a.w / 2 < ex ? -1 : 1;
      st.charge = st.t > LINK_WARN ? 1 : st.t / LINK_WARN;
      if (st.t > LINK_WARN + LINK_ON + 0.1) { st.charge = 0; st.vy = 0; st.go('EL_RUN'); }
      return;
    }
    const s = this.partner && !this.partner.dead ? this.partner : null;
    if (!s) { this.linkState = 0; st.go('EL_WALK'); return; }
    e.dir = s.x + s.w / 2 < ex ? -1 : 1;
    st.charge = Math.min(1, st.t / LINK_WARN);
    const l = this.link;
    l[0] = ex + e.dir * 26; l[1] = e.y + e.h * 0.4; l[2] = s.x + s.w / 2; l[3] = s.y + s.h * 0.45;
    const prev = this.linkState;
    this.linkState = st.t < LINK_WARN ? 1 : st.t < LINK_WARN + LINK_ON ? 2 : 0;
    if (this.linkState === 2 && prev !== 2) { this.shake = Math.max(this.shake, 8); this.events.sfx('detonation', 0.7, 0.9); this.screenFlash = Math.max(this.screenFlash, 0.2); }
    if (this.linkState === 2 && !this.player.dead && this.segmentHitsPlayer(l[0], l[1], l[2], l[3], 12)) {
      this.damage(1, (this.player.cx < (l[0] + l[2]) / 2 ? -1 : 1) * 260, -300);
    }
    if (st.t > LINK_WARN + LINK_ON) { this.linkState = 0; st.charge = 0; st.go('EL_WALK'); }
  },

  segmentHitsPlayer(x1, y1, x2, y2, half) {
    const p = this.player, n = Math.max(1, Math.trunc(Math.hypot(x2 - x1, y2 - y1) / 10));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (x + half > p.x && x - half < p.x + p.w && y + half > p.y && y - half < p.y + p.h) return true;
    }
    return false;
  },

  // ------------------------------------------------------------------ Leviatán (Regent Frame, N10)
  regentShielded(e) { return e.def.id === REGENT_ID && (e.boss?.shield ?? 0) > 0.5; },
  shieldSpark(x, y) { this.fx.burst(x, y, 7, rgb(120, 230, 210), 170); this.events.sfx('espada_escudo', 0.6, 1.1); },

  hitPylon(b, st, py, amount) {
    const fy = st.groundY + b.h;
    py[1] -= amount; py[2] = 0.1;
    this.fx.burst(py[0], fy - PYLON_H * 0.6, 6, rgb(120, 230, 210), 130);
    this.events.sfx('romper', 0.55, 1.1);
    if (py[1] > 0) return;
    py[1] = 0;
    this.shake = Math.max(this.shake, this.fx.disipar ? this.fx.disipar(py[0], fy - PYLON_H / 2, 1.4) : this.fx.explosion(py[0], fy - PYLON_H / 2, 1.4));
    this.events.sfx('sombra_disipa', 1, 0.8);
    const left = st.pylons.filter((it) => it[1] > 0).length;
    if (left > 0) { this.toast(tr('PILAR DE SOMBRA DESTRUIDO · QUEDA {0}', left)); return; }
    st.shield = 0; st.go('RG_STUN'); st.rebuild = REGENT_REBUILD; st.warnings.length = 0;
    this.screenFlash = 0.8;
    this.toast(tr('¡EL LEVIATÁN QUEDA EXPUESTO!'));
  },

  updateRegent(e, st, dt) {
    const p = this.player, floorY = st.groundY + e.h, ex = e.x + e.w / 2;
    const face = p.cx < ex ? -1 : 1;
    const center = (e.min + e.max) / 2;
    this.updateLances(st, floorY, dt, rgb(90, 220, 200));
    for (const py of st.pylons) { py[2] = Math.max(0, py[2] - dt); if (py[1] > 0) py[3] = Math.min(1, py[3] + dt * 1.2); }
    st.enraged = st.phase >= 2;
    if (st.move !== 'RG_SWEEP') st.beamState = 0;
    if (!['RG_SWEEP', 'RG_SHARDS', 'RG_SLAM'].includes(st.move)) st.charge = Math.max(0, st.charge - dt * 3);
    if (st.phase === 3) {
      const alive = st.pylons.filter((it) => it[1] > 0).length;
      if (alive > 0) st.shield = Math.min(1, st.shield + dt * 2);
      else if (st.move !== 'RG_STUN') {
        st.rebuild -= dt;
        if (st.rebuild <= 0) { this.raisePylons(e, st); this.toast(tr('¡LOS PILARES DE SOMBRA SE LEVANTAN!')); }
      }
    }
    // Golpes de sombra: caen cuando se agota el aviso.
    st.warnings = st.warnings.filter((wv) => {
      if (wv[1] > dt) return true; // updateBoss ya descontó el tiempo de la marca
      const x = wv[0];
      this.shake = Math.max(this.shake, this.fx.explosion(x, floorY - 30, 1.1));
      this.events.sfx('explosion', 0.6, 0.8);
      if (!p.dead && Math.abs(p.cx - x) < 64 && p.y + p.h > floorY - 120) this.damage(1, (p.cx < x ? -1 : 1) * 320, -380);
      for (const d of [-1, 1]) this.enemyBullets.push(new Bullet(x + d * 30 - 17, floorY - 24, 34, 24, d * 340, 2.4, rgb(90, 220, 200), 0, 'SHOCKWAVE'));
      return false;
    });
    const busy = ['SLEEP', 'INTRO', 'RG_RISE', 'RG_CORE'].includes(st.move);
    if (!busy && st.phase === 1 && e.hp <= e.maxHp * 0.66) {
      st.phase = 2; st.go('RG_RISE');
      this.toast(tr('¡EL LEVIATÁN DESPLIEGA LAS ALAS!')); this.events.onRadio?.('bossPhase2');
      this.shake = Math.max(this.shake, 12); this.screenFlash = Math.max(this.screenFlash, 0.5);
    } else if (!busy && st.phase === 2 && e.hp <= e.maxHp * 0.33) {
      st.phase = 3; st.go('RG_CORE'); st.lances.length = 0;
      this.toast(tr('¡EL LEVIATÁN SE ENROSCA ENTRE PILARES DE SOMBRA!'));
      this.shake = Math.max(this.shake, 14); this.screenFlash = Math.max(this.screenFlash, 0.6);
    }
    const nextMove = () => {
      const order = st.phase === 1 ? ['RG_SWEEP', 'RG_SLAM', 'RG_SWEEP', 'RG_SLAM']
        : st.phase === 2 ? ['RG_SHARDS', 'RG_STEPS', 'RG_RAIN', 'RG_SWEEP', 'RG_STEPS']
          : ['RG_SWEEP', 'RG_SLAM', 'RG_SHARDS', 'RG_SWEEP', 'RG_RAIN'];
      st.go(order[st.cycle % order.length]); st.cycle++;
    };
    e.y = st.groundY;
    switch (st.move) {
      case 'SLEEP':
        e.dir = face;
        if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        break;
      case 'INTRO':
        e.dir = face;
        st.charge = Math.min(1, st.t / 1.6);
        if (st.t > 1.0 && st.step === 0) { st.step = 1; this.shake = Math.max(this.shake, 12); this.events.sfx('explosion', 0.6, 0.6); this.fx.dust(ex - 60, floorY, -1); this.fx.dust(ex + 60, floorY, 1); }
        if (st.t > 2.0) { st.charge = 0; st.go('RG_WALK'); }
        break;
      case 'RG_WALK': {
        e.dir = face;
        const near = st.phase === 2 ? 170 : 300;
        if (st.phase !== 3 && Math.abs(p.cx - ex) > near) {
          e.x += sign(p.cx - ex) * e.def.speed * (st.phase === 2 ? 1.6 : 1) * dt;
          e.x = clamp(e.x, e.min, e.max);
        }
        if (st.t > (st.phase === 3 ? 0.9 : 1.4)) nextMove();
        break;
      }
      case 'RG_SWEEP': {
        const warn = st.phase === 3 ? 0.75 : 0.9, on = 0.55, sweeps = st.phase === 3 ? 2 : 1, cyc = warn + on + 0.25;
        const k = st.step, tt = st.t - k * cyc;
        if (tt < 0.02 && st.beamState === 0) {
          e.dir = face;
          st.sweepHigh = k === 0 ? (R() < 0.5 ? 0 : 1) : 1 - st.sweepHigh;
          this.events.sfx('energy_empty', 0.8, st.sweepHigh === 1 ? 1.2 : 0.8);
        }
        if (tt < warn) { st.beamState = 1; st.charge = tt / warn; }
        else if (tt < warn + on) {
          if (st.beamState !== 3) { this.shake = Math.max(this.shake, 9); this.events.sfx('detonation', 0.8, 0.8); }
          st.beamState = 3; st.charge = 1;
          const [top, bot] = sweepBand(floorY, st.sweepHigh);
          const side = (p.cx - ex) * e.dir > 0;
          if (!p.dead && side && p.y < bot && p.y + p.h > top) this.damage(1, e.dir * 280, -320);
        } else if (tt < cyc) st.beamState = 0;
        else { st.step++; st.beamState = 0; if (st.step >= sweeps) st.go('RG_WALK'); }
        break;
      }
      case 'RG_SLAM': {
        st.charge = Math.min(1, st.t / 0.6);
        const fists = st.phase === 3 ? 3 : 2;
        if (st.step < fists && st.t >= 0.35 + st.step * 0.35) {
          const off = st.step === 0 ? 0 : (st.step % 2 === 1 ? 1 : -1) * 190;
          st.warnings.push([clamp(p.cx + off, e.min, e.max + e.w), 1.05]);
          this.events.sfx('energy_empty', 0.6, 0.7);
          st.step++;
        }
        if (st.t > 0.35 + fists * 0.35 + 0.9) st.go('RG_WALK');
        break;
      }
      case 'RG_RISE':
        e.dir = face;
        st.charge = Math.min(1, st.t / 1.2);
        if (st.t > 1.2 && st.step === 0) { st.step = 1; this.shake = Math.max(this.shake, 10); this.fx.dust(ex - 60, floorY, -1); this.fx.dust(ex + 60, floorY, 1); }
        if (st.t > 1.8) { st.charge = 0; st.go('RG_WALK'); }
        break;
      case 'RG_SHARDS': {
        e.dir = face;
        const volleys = st.desperate ? 3 : 2;
        st.charge = Math.min(1, st.t / 0.6);
        if (st.step < volleys && st.t >= 0.6 + st.step * 0.55) {
          const arma = puntoJefe(e, 'arma');
          const sx = arma ? arma[0] : ex - e.dir * 30, sy = arma ? arma[1] : e.y + e.h * 0.25;
          const base = Math.atan2(p.cy - sy, p.cx - sx), skew = st.step % 2 === 0 ? 0 : 0.09;
          for (let k = -2; k <= 2; k++) {
            const a = base + k * 0.18 + skew;
            this.enemyBullets.push(new Bullet(sx - 8, sy - 4, 16, 8, Math.cos(a) * 360, 4, bc(e), Math.sin(a) * 360, 'SHARD'));
          }
          this.fx.burst(sx, sy, 10, bc(e), 160);
          this.events.sfx('shoot', 0.9 * SHOT_VOLUME, 0.7);
          st.step++;
        }
        if (st.t > 0.6 + volleys * 0.55 + 0.4) st.go('RG_WALK');
        break;
      }
      case 'RG_RAIN':
        st.charge = Math.min(1, st.t / 0.5);
        if (st.step === 0 && st.t > 0.5) { this.castLances(e, st, st.desperate ? 6 : 5, 0.14); st.step = 1; }
        if (st.step === 1 && !st.lances.length) st.go('RG_WALK');
        break;
      case 'RG_STEPS': {
        const stepT = 0.5;
        if (st.step < 2) {
          if (st.t < 0.02) e.dir = face;
          const k = st.t / stepT;
          if (k < 0.7) { e.x += e.dir * (REGENT_STEP / (stepT * 0.7)) * dt; e.x = clamp(e.x, e.min, e.max); }
          if (k >= 1) { this.shake = Math.max(this.shake, 8); this.events.sfx('explosion', 0.45, 0.7); this.fx.dust(ex, floorY, e.dir); st.step++; st.t = 0; }
        } else if (st.step === 2) {
          st.charge = Math.min(1, st.t / 0.55);
          if (st.t >= 0.55) { this.shockwaves(e, floorY); st.step = 3; st.t = 0; st.charge = 0; }
        } else {
          if (R() < dt * 12) this.fx.burst(e.x + R() * e.w, e.y + e.h * 0.3, 2, rgb(90, 220, 200), 120);
          if (st.t > 1.3) st.go('RG_WALK');
        }
        break;
      }
      case 'RG_CORE':
        e.dir = face;
        e.x += (center - e.x) * Math.min(1, dt * 2.5);
        e.y += (st.groundY - e.y) * Math.min(1, dt * 3);
        st.charge = Math.min(1, st.t / 1.5);
        if (st.t > 1.2 && st.step === 0) {
          st.step = 1; e.y = st.groundY;
          this.raisePylons(e, st);
          this.shake = Math.max(this.shake, 12); this.events.sfx('explosion', 0.7, 0.6);
        }
        if (st.t > 2.2) { st.charge = 0; st.go('RG_WALK'); }
        break;
      case 'RG_STUN':
        if (R() < dt * 14) this.fx.burst(e.x + R() * e.w, e.y + e.h * 0.35, 3, rgb(120, 230, 210), 120);
        if (st.t > REGENT_STUN) st.go('RG_WALK');
        break;
      default: st.go('RG_WALK');
    }
  },

  raisePylons(e, st) {
    st.pylons.length = 0;
    const left = e.min + 30, right = e.max + e.w - 30;
    for (const x of [left, right]) st.pylons.push([x, PYLON_HP, 0, 0]);
    st.shield = 1; st.rebuild = 0;
    this.events.onRadio?.('bossCore');
  },

  // ------------------------------------------------------------------ Behemot del Orgullo (Aegis Behemoth, N8)
  updateAegis(e, st, dt) {
    const p = this.player, floorY = st.groundY + e.h, rage = st.enraged, ex = e.x + e.w / 2;
    const shieldGoal = ['AEG_WALK', 'AEG_RAM', 'INTRO'].includes(st.move) ? 1 : 0;
    st.shield += clamp(shieldGoal - st.shield, -dt * 3, dt * 4);
    if (st.move !== 'AEG_MORTAR') st.mortarAim = Math.max(0, st.mortarAim - dt * 2);
    if (st.move !== 'AEG_BARRAGE' && st.move !== 'AEG_RAM') st.charge = Math.max(0, st.charge - dt * 3);
    const behind = (p.cx - ex) * e.dir < -10;
    if (st.move === 'AEG_WALK' || st.move === 'AEG_MORTAR') {
      st.turnT = behind ? st.turnT + dt : 0;
      if (st.turnT > (rage ? AEGIS_TURN_RAGE : AEGIS_TURN)) { e.dir = -e.dir; st.turnT = 0; this.shake = Math.max(this.shake, 4); this.fx.dust(ex, floorY); }
    }
    switch (st.move) {
      case 'SLEEP':
        e.dir = p.cx < ex ? -1 : 1;
        if (!p.dead && e.x < this.camX + this.viewWorldW - 40) { st.go('INTRO'); this.toast(e.def.name); this.events.onBossIntro?.(); this.events.onRadio?.('boss'); }
        break;
      case 'INTRO':
        if (st.t > 0.8 && st.step === 0) { st.step = 1; this.shake = Math.max(this.shake, 10); this.fx.dust(ex - 60, floorY, -1); this.fx.dust(ex + 60, floorY, 1); this.events.sfx('explosion', 0.5, 0.7); }
        if (st.t > 1.6) st.go('AEG_WALK');
        break;
      case 'AEG_WALK':
        if (!behind && Math.abs(p.cx - ex) > 200) { e.x += e.dir * e.def.speed * (rage ? 1.4 : 1) * dt; e.x = clamp(e.x, e.min, e.max); }
        if (st.t > (rage ? 1.3 : 1.9)) {
          const order = ['AEG_BARRAGE', 'AEG_RAM', 'AEG_MORTAR', 'AEG_RAM'];
          const next = order[st.cycle % order.length]; st.cycle++;
          st.go(next === 'AEG_RAM' && behind ? 'AEG_MORTAR' : next);
        }
        break;
      case 'AEG_BARRAGE': {
        const windup = 0.7, gap = rage ? 0.32 : 0.42, shots = rage ? 6 : 4;
        st.charge = Math.min(1, st.t / windup);
        if (st.t >= windup + st.step * gap && st.step < shots) {
          const low = st.step % 2 === 0, bh = low ? 18 : 14, by = low ? floorY - 24 : floorY - 50;
          const bx = ex + e.dir * (e.w / 2 + 4);
          const [fx0, fy0] = this.titanShot(e, bx, by, 30, bh, e.def.bulletSpeed * (rage ? 1.15 : 1), 4, low);
          this.fx.burst(fx0, fy0, 7, rgb(255, 170, 80), 140);
          this.shake = Math.max(this.shake, 4);
          this.events.sfx('shoot', 0.9 * SHOT_VOLUME, 0.8);
          st.step++;
        }
        if (st.step >= shots && st.t > windup + shots * gap + 0.5) st.go('AEG_WALK');
        break;
      }
      case 'AEG_MORTAR': {
        st.mortarAim = Math.min(1, st.t / 0.5);
        const volleys = rage ? 2 : 1;
        if (st.step < volleys && st.t >= 0.6 + st.step * 1.1) {
          st.step++;
          const offsets = rage ? [-220, -110, 0, 110, 220] : [-180, -60, 60, 180];
          offsets.forEach((off, i) => {
            const x = clamp(p.cx + off + (R() - 0.5) * 50, e.min - 100, e.max + e.w + 10);
            const delay = 1.1 + i * 0.1, startY = MORTAR_START_Y;
            st.warnings.push([x, delay]);
            this.enemyBullets.push(new Bullet(x - 8, startY, 16, 30, 0, delay + 1, rgb(255, 150, 60), (floorY - 30 - startY) / delay, 'MISSILE'));
          });
          for (let k = 0; k < 4; k++) this.fx.burst(e.x + e.w * (0.25 + 0.17 * k), e.y + 6, 6, rgb(255, 180, 90), 170);
          this.shake = Math.max(this.shake, 6);
          this.events.sfx('explosion', 0.45, 1.3);
        }
        if (st.t > 0.6 + volleys * 1.1 + 0.6) st.go('AEG_WALK');
        break;
      }
      case 'AEG_RAM': {
        const windup = 0.8;
        if (st.step === 0) {
          st.charge = Math.min(1, st.t / windup);
          if (R() < dt * 14) this.fx.dust(ex - e.dir * 70, floorY, -e.dir);
          if (st.t >= windup) { st.step = 1; this.shake = Math.max(this.shake, 6); this.events.sfx('dash', 0.9, 0.6); }
        } else {
          e.x += e.dir * AEGIS_RAM_SPEED * (rage ? 1.2 : 1) * dt;
          if (R() < dt * 20) this.fx.dust(ex - e.dir * 80, floorY, -e.dir);
          if (e.x <= e.min || e.x >= e.max) {
            e.x = clamp(e.x, e.min, e.max);
            this.shake = Math.max(this.shake, 18);
            this.events.sfx('explosion', 0.7, 0.8);
            this.fx.burst(ex + e.dir * e.w / 2, floorY - e.h / 2, 26, rgb(255, 196, 90), 260);
            this.toast(tr('¡SU ORGULLO SE ESTRELLA!'));
            st.go('AEG_STUN');
          }
        }
        break;
      }
      case 'AEG_STUN':
        if (R() < dt * 10) this.fx.burst(ex + (R() - 0.5) * e.w * 0.6, e.y + 20, 3, rgb(255, 214, 120), 90);
        if (st.t > AEGIS_STUN * (rage ? 0.8 : 1)) { st.go('AEG_WALK'); e.dir = p.cx < ex ? -1 : 1; }
        break;
      default: st.go('AEG_WALK');
    }
  },

  desperateRain(e, st) {
    const floorY = st.groundY + e.h, n = e.def.id === EYE_ID ? 2 : 3, spread = 150, first = -spread * (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const x = clamp(this.player.cx + first + i * spread + (R() - 0.5) * 40, e.min - 100, e.max + e.w + 10);
      const delay = 1.15 + i * 0.12;
      const startY = this.world.solids.some((s) => s.overlapsR(x - 8, 0, 16, 90)) ? MORTAR_START_Y : -60;
      st.warnings.push([x, delay]);
      this.enemyBullets.push(new Bullet(x - 8, startY, 16, 30, 0, delay + 1, rgb(255, 90, 60), (floorY - 30 - startY) / delay, 'MISSILE'));
    }
    this.events.sfx('energy_empty', 0.6, 0.8);
  },

  /** ¿El escudo del Behemot para una bala que viene desde x = fromX? (Solo por delante y alzado.) */
  aegisBlocks(e, fromX) {
    const st = e.boss ?? e.mini;
    if (!st || (e.def.id !== AEGIS_ID && !e.mini) || st.shield < 0.5) return false;
    return (fromX - (e.x + e.w / 2)) * e.dir > 0;
  },

  beamHits(ex, ey, a) {
    const dx = Math.cos(a), dy = Math.sin(a), px = this.player.cx - ex, py = this.player.cy - ey;
    if (px * dx + py * dy < 0) return false;
    return Math.abs(px * dy - py * dx) < 16 + this.player.w / 2;
  },

  /** El jefe no pelea solo: cada cierto tiempo entra un refuerzo por el lado contrario al jugador. */
  callMinions(boss, st, dt) {
    this.callSquad(boss, st, dt);
    if (boss.def.id === REGENT_ID && st.phase >= 3) return;
    const pool = boss.def.minions;
    if (!pool.length) return;
    st.minionTimer -= dt * (st.enraged ? 1.4 : 1);
    if (st.minionTimer > 0) return;
    st.minionTimer = boss.def.minionInterval;
    const squadId = boss.def.squad;
    if (this.enemies.filter((m) => m.minion && !m.dead && m.def.id !== squadId).length +
      this.pendingEnemies.filter((m) => m.def.id !== squadId).length >= boss.def.minionMax) return;
    const def = this.data.enemies[pool[st.cycle % pool.length]];
    if (!def) return;
    const left = boss.min - 100, right = boss.max + boss.w + 10;
    const fromRight = this.player.cx < (left + right) / 2;
    const x = fromRight ? right - def.w - 20 : left + 20;
    const floorY = st.groundY + boss.h;
    const y = def.behavior === 'RIVAL' ? floorY - def.h - 120 : floorY - def.h;
    const m = new Enemy(def, { x, y, min: left + 10, max: right - def.w - 10, dir: fromRight ? -1 : 1 }, true);
    m.shot = 1.2;
    this.pendingEnemies.push(m);
    this.fx.burst(x + def.w / 2, y + def.h / 2, 20, rgb(170, 90, 255), 180);
    this.fx.dust(x + def.w / 2, floorY);
    this.events.sfx('dash', 0.6);
  },

  /** Ráfaga de sombras (def.squad): entran 3-4 juntas por el lado contrario al jugador. */
  callSquad(boss, st, dt) {
    const def = boss.def.squad ? this.data.enemies[boss.def.squad] : null;
    if (!def) return;
    st.squadTimer -= dt * (st.enraged ? 1.3 : 1);
    if (st.squadTimer > 0) return;
    st.squadTimer = boss.def.squadInterval;
    if (this.enemies.some((m) => m.minion && !m.dead && m.def.id === def.id) || this.pendingEnemies.some((m) => m.def.id === def.id)) return;
    const n = boss.def.squadMin + Math.floor(R() * (boss.def.squadMax - boss.def.squadMin + 1));
    const left = boss.min - 100, right = boss.max + boss.w + 10;
    const fromRight = this.player.cx < (left + right) / 2;
    const floorY = st.groundY + boss.h, y = floorY - def.h;
    for (let i = 0; i < n; i++) {
      const x = fromRight ? right - def.w - 20 - i * 46 : left + 20 + i * 46;
      const m = new Enemy(def, { x, y, min: left + 10, max: right - def.w - 10, dir: fromRight ? -1 : 1 }, true);
      m.shot = 1.4 + i * 0.35;
      this.pendingEnemies.push(m);
      this.fx.burst(x + def.w / 2, y + def.h / 2, 12, rgb(170, 90, 255), 150);
      this.fx.dust(x + def.w / 2, floorY);
    }
    this.events.sfx('dash', 0.7);
    this.toast(tr('¡LLEGAN MÁS SOMBRAS!'));
  },

  /** Bala de las bestias (Goliat, Behemot): sale de la boca del dibujo y baja en diagonal para pasar a la altura
   *  de siempre donde está el jugador (la baja se salta, la alta se esquiva agachado). Sin boca: recta desde bx. */
  titanShot(e, bx, by, bw, bh, speed, life, near) {
    const vx = e.dir * speed;
    const boca = e.boss ? puntoJefe(e, 'boca') : null;
    if (!boca) {
      this.enemyBullets.push(new Bullet(e.dir > 0 ? bx : bx - bw, by, bw, bh, vx, life, bc(e)));
      return [bx, by + bh / 2];
    }
    const [ox, oy] = boca;
    const ahead = (this.player.cx - ox) * e.dir, dist = ahead > 60 ? ahead : 160;
    const vy = ((by + bh / 2) - oy) * speed / dist;
    this.enemyBullets.push(new Bullet(e.dir > 0 ? ox : ox - bw, oy - bh / 2, bw, bh, vx, life, bc(e), vy));
    return [ox, oy];
  },

  shockwaves(e, floorY) {
    this.shake = Math.max(this.shake, 16);
    this.events.sfx('explosion', 0.6);
    const cx = e.x + e.w / 2;
    this.fx.dust(cx - e.w * 0.35, floorY, -1); this.fx.dust(cx + e.w * 0.35, floorY, 1);
    for (const d of [-1, 1]) this.enemyBullets.push(new Bullet(cx + d * (e.w / 2 - 10) - 17, floorY - 24, 34, 24, d * 360, 3.2, rgb(150, 80, 230), 0, 'SHOCKWAVE'));
  },

  grenadeBlast(b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    this.shake = Math.max(this.shake, this.fx.explosion(cx, cy - 6, 0.7) * 0.5);
    this.events.sfx('explosion', 0.45, 1.2);
    const p = this.player;
    if (!p.dead && Math.hypot(p.cx - cx, p.cy - cy) < GRENADE_R + p.w / 2) this.damage(1, (p.cx < cx ? -1 : 1) * 300, -340);
  },
  missileBlast(b) {
    const cx = b.x + b.w / 2, cy = b.y + b.h;
    this.shake = Math.max(this.shake, this.fx.explosion(cx, cy - 10, 0.55) * 0.5);
    this.events.sfx('explosion', 0.35);
  },

  updateBullets(dt) {
    const w = this.world;
    for (const b of this.bullets) {
      const prevX = b.x, prevY = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      const sx = Math.min(prevX, b.x), sw = Math.abs(b.x - prevX) + b.w, sy = Math.min(prevY, b.y), sh = Math.abs(b.y - prevY) + b.h;
      let hit = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const hb = e.hitbox;
        if (hb.overlapsR(b.x, b.y, b.w, b.h) || hb.overlapsR(sx, sy, sw, sh)) {
          if (b.golpeados) {
            // Onda de la espada de fuego: atraviesa y golpea una vez a cada enemigo (los escudos la detienen).
            if (b.golpeados.has(e)) continue;
            b.golpeados.add(e);
            if (this.aegisBlocks(e, prevX + b.w / 2) || this.regentShielded(e)) { b.life = 0; this.fx.burst(hb.cx, hb.cy, 9, rgb(255, 200, 120), 170); this.events.sfx('espada_escudo', 0.7); hit = true; break; }
            e.hp -= b.damage; e.flash = 0.14; this.target.onHit(e);
            this.fx.impacto(hb.cx, hb.cy, b.dir ?? 1, true, false);
            this.events.sfx('espada_golpe_fuego', 0.75);
            if (e.hp <= 0) this.killEnemy(e);
            continue;
          }
          if (this.aegisBlocks(e, prevX + b.w / 2)) {
            b.life = 0;
            this.fx.burst(b.x + b.w / 2, b.y + b.h / 2, 7, rgb(255, 196, 90), 160);
            this.events.sfx('hit', 0.5 * IMPACT_VOLUME, 1.6);
            hit = true; break;
          }
          if (this.regentShielded(e)) { b.life = 0; this.shieldSpark(b.x + b.w / 2, b.y + b.h / 2); hit = true; break; }
          b.life = 0; e.hp -= 1; e.flash = 0.09;
          this.target.onHit(e);
          this.fx.burst(b.x, b.y, 6, rgb(200, 238, 255), 110);
          this.events.sfx('hit', 0.7 * IMPACT_VOLUME);
          if (e.hp <= 0) this.killEnemy(e);
          hit = true; break;
        }
      }
      if (hit) continue;
      for (const tg of w.targets) {
        if (tg.dead || !(tg.overlapsR(b.x, b.y, b.w, b.h) || tg.overlapsR(sx, sy, sw, sh))) continue;
        if (b.golpeados) { if (!b.golpeados.has(tg)) { b.golpeados.add(tg); this.hitTarget(tg, b.damage, tg.cx, tg.cy); } continue; }
        b.life = 0; this.hitTarget(tg, 1, b.x, b.y); hit = true; break;
      }
      if (hit) continue;
      for (const br of w.breakables) {
        if (br.dead || !(br.overlapsR(b.x, b.y, b.w, b.h) || br.overlapsR(sx, sy, sw, sh))) continue;
        if (b.golpeados) { if (!b.golpeados.has(br)) { b.golpeados.add(br); this.hitBreakable(br, b.damage, br.cx, br.cy); } continue; }
        b.life = 0; this.hitBreakable(br, 1, b.x, b.y); hit = true; break;
      }
      if (hit) continue;
      const bo = this.boss, st = bo?.boss;
      if (st) {
        const fy = st.groundY + bo.h;
        for (const py of st.pylons) {
          if (py[1] <= 0 || py[3] < 1) continue;
          const px = py[0] - PYLON_W / 2, pt = fy - PYLON_H;
          if (!(b.x < px + PYLON_W && b.x + b.w > px && b.y < fy && b.y + b.h > pt) &&
            !(sx < px + PYLON_W && sx + sw > px && sy < fy && sy + sh > pt)) continue;
          if (b.golpeados) { if (!b.golpeados.has(py)) { b.golpeados.add(py); this.hitPylon(bo, st, py, b.damage); } continue; }
          b.life = 0; this.hitPylon(bo, st, py, 1); hit = true; break;
        }
      }
      if (hit) continue;
      // Con el muro se choca donde se VE la flecha (a la altura de la mano del dibujo), no en su caja baja: si no, las
      // gradas bajas la detenían «en lo invisible». Con los enemigos sigue chocando con la caja de siempre.
      if (b.golpeados) for (const eb of this.enemyBullets) if (eb.life > 0 && eb.x < b.x + b.w && eb.x + eb.w > b.x && eb.y < b.y + b.h && eb.y + eb.h > b.y) { eb.life = 0; this.fx.burst(eb.x, eb.y, 5, rgb(255, 200, 120), 100); }
      const ox = b.dibujoDx ?? 0, oy = -(b.dibujoDy ?? 0);
      if (w.solids.some((s) => s.overlapsR(b.x + ox, b.y + oy, b.w, b.h) || s.overlapsR(sx + ox, sy + oy, sw, sh))) {
        b.life = 0; this.fx.burst(b.x + ox, b.y + oy, 4, rgb(200, 238, 255), 90);
      }
    }
    this.bullets = this.bullets.filter((b) => !(b.life <= 0 || b.x < -50 || b.x > w.width + 50 || b.y < -400));
    const p = this.player;
    for (const b of this.enemyBullets) {
      b.vy += b.gravity * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (w.solids.some((s) => s.overlapsR(b.x, b.y, b.w, b.h))) {
        b.life = 0;
        if (b.kind === 'MISSILE') this.missileBlast(b);
        if (b.kind === 'GRENADE') this.grenadeBlast(b);
        continue;
      }
      if (!p.dead && p.overlaps(new Box(b.x, b.y, b.w, b.h))) {
        b.life = 0;
        if (b.kind === 'MISSILE') this.missileBlast(b);
        if (b.kind === 'GRENADE') { this.grenadeBlast(b); continue; }
        this.damage(b.damage, (b.vx !== 0 ? sign(b.vx) : p.cx < b.x ? -1 : 1) * 240, -220);
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => b.life > 0);
  },
};
