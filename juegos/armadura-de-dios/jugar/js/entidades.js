// Enemigos, proyectiles y estado de los jefes (port de game/Enemy.kt). Misma lógica y cajas que el original.
import { Box } from './mundo.js';
import { Balance } from './config.js';

const R = Math.random;
export const LANCE_WARN = 1.05;
export const LANCE_ON = 0.4;
export const DOG_SLEEPING = 3;
export const DOG_WAKING = 4;

/** Estado de un jefe: [t] segundos en el movimiento actual; [charge] (0..1) avisa del próximo ataque. */
export class BossState {
  constructor(groundY) {
    this.groundY = groundY;
    this.move = 'SLEEP'; this.t = 0; this.step = 0; this.cycle = 0; this.vy = 0; this.charge = 0; this.podsOpen = 0; this.enraged = false;
    this.beamAng = 1.2; this.beamState = 0; this.minionTimer = 4; this.squadTimer = 9;
    this.warnings = []; this.lances = [];
    this.fromX = 0; this.fromY = 0; this.toX = 0;
    this.shield = 0; this.turnT = 0; this.mortarAim = 0; this.desperate = false; this.desperateT = 1.5;
    this.phase = 1; this.sweepHigh = 0; this.pylons = []; this.rebuild = 0; this.count = 0;
  }
  go(m) { this.move = m; this.t = 0; this.step = 0; this.count = 0; }
  /** Vuelve al estado de antes del combate (el jugador reaparece en el punto de control). */
  reset() {
    this.go('SLEEP'); this.vy = 0; this.charge = 0; this.podsOpen = 0; this.enraged = false; this.cycle = 0; this.beamState = 0;
    this.warnings.length = 0; this.lances.length = 0;
    this.shield = 0; this.turnT = 0; this.mortarAim = 0; this.desperate = false; this.desperateT = 1.5;
    this.minionTimer = 4; this.squadTimer = 9;
    this.phase = 1; this.sweepHigh = 0; this.pylons.length = 0; this.rebuild = 0;
  }
}

export class Enemy {
  /** minion = refuerzo llamado por un jefe. */
  constructor(def, spawn, minion = false) {
    this.def = def; this.minion = minion;
    this.x = spawn.x; this.y = spawn.y; this.w = def.w; this.h = def.h;
    this.hp = def.hp; this.maxHp = def.hp; this.dir = spawn.dir; this.min = spawn.min; this.max = spawn.max;
    this.dead = false; this.flash = 0; this.shot = def.firstShotDelay;
    this.burst = 0; this.burstT = 0; this.stride = 0; this.flashShot = 0;
    this.dogState = spawn.sleep ? DOG_SLEEPING : 0; this.dogT = 0; this.homeY = spawn.y; this.alert = 0;
    this.airborne = false; this.vx = 0; this.vy = 0; this.hopT = 1.2;
    this.phase = R() * 6;
    this.boss = def.behavior === 'BOSS' ? new BossState(spawn.y) : null;
    if (def.behavior === 'BEHEMOTH') { this.mini = new BossState(spawn.y); this.mini.move = 'AEG_WALK'; this.mini.shield = 1; } else this.mini = null;
    this._hb = new Box(0, 0, 0, 0);
  }
  get sleeping() { return this.dogState === DOG_SLEEPING; }
  /** Caja de golpe como en el original (el rival tiene casco por encima de su caja). */
  get hitbox() {
    const b = this._hb, x = this.x, y = this.y, w = this.w, h = this.h;
    switch (this.def.behavior) {
      case 'RIVAL': b.x = x + 2; b.y = y - 8; b.w = 30; b.h = 46; break;
      case 'WALKER': case 'HOPPER': b.x = x + 1; b.y = y + 2; b.w = w - 2; b.h = h - 2; break;
      case 'TURRET': b.x = x; b.y = y; b.w = w; b.h = h; break;
      case 'BOSS':
        if (w < 80) { b.x = x + 4; b.y = y + 4; b.w = w - 8; b.h = h - 4; } else { b.x = x + 14; b.y = y + 14; b.w = w - 28; b.h = h - 14; }
        break;
      case 'BEHEMOTH': b.x = x + 6; b.y = y + 6; b.w = w - 12; b.h = h - 6; break;
      case 'SOLDIER': b.x = x + 3; b.y = y + 2; b.w = w - 6; b.h = h - 2; break;
      case 'DOG': b.x = x + 2; b.y = y + 5; b.w = w - 4; b.h = h - 5; break;
      case 'DRONE': b.x = x + 3; b.y = y + 3; b.w = w - 6; b.h = h - 6; break;
      default: b.x = x; b.y = y; b.w = w; b.h = h;
    }
    return b;
  }
}

/** Proyectil. kind: ENERGY, MISSILE, SHOCKWAVE, ORB, GRENADE, SHARD. gravity > 0: cae en parábola (granadas). */
export class Bullet {
  constructor(x, y, w, h, vx, life, color, vy = 0, kind = 'ENERGY', damage = 1, gravity = 0) {
    Object.assign(this, { x, y, w, h, vx, life, color, vy, kind, damage, gravity });
  }
}

/** Panel de objetivo: recuerda a qué enemigo está atacando el jugador (vida con retardo). */
export class TargetTracker {
  constructor() { this.enemy = null; this.displayHp = 0; this.alpha = 0; this.timer = 0; this.deathTimer = 0; }
  onHit(e) {
    if (e.boss) return; // el jefe tiene su propia barra
    if (this.enemy !== e) { this.enemy = e; this.displayHp = Math.max(0, e.hp) + 1; }
    this.timer = Balance.TARGET_PANEL_TIMEOUT ?? 4.0; this.deathTimer = Balance.TARGET_PANEL_DEATH_LINGER ?? 0.9;
  }
  update(dt) {
    const e = this.enemy;
    if (!e) { this.alpha = Math.max(0, this.alpha - dt * 4); return; }
    const hp = Math.max(0, e.hp);
    this.displayHp = this.displayHp > hp ? Math.max(hp, this.displayHp - dt * e.maxHp * 0.9) : hp;
    this.timer -= dt;
    let visible;
    if (e.dead) { this.deathTimer -= dt; visible = this.deathTimer > 0; } else visible = this.timer > 0;
    this.alpha = visible ? Math.min(1, this.alpha + dt * 6) : Math.max(0, this.alpha - dt * 3);
    if (!visible && this.alpha <= 0) this.enemy = null;
  }
  reset() { this.enemy = null; this.alpha = 0; }
}
