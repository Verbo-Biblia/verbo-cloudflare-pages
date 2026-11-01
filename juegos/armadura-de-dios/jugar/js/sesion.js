// Una partida de un nivel: física, combate, energía y efectos (port de game/GameSession.kt).
// Los valores y reglas son los del original. Enemigos, jefes, trampas y proyectiles: combate.js (fase 2).
import { HEROE_ALTO } from './jugador.js';
import { Balance, Physics, ControlsConfig, K, AIM_DIRS, AIM_PIVOT_X, ESCALA_PERSONAJES, Espada, ZOOM, ZOOM_JEFE } from './config.js';
import { Box, Pickup } from './mundo.js';
import { buildWorld } from './mundo.js';
import { Effects } from './efectos.js';
import { rgb, hex } from './dibujo.js';
import { tr, lang } from './datos.js';
import { Enemy, Bullet, TargetTracker } from './entidades.js';
import { metodosCombate, isSeal, NOISE_SHOT, NOISE_DETONATION, NOISE_DASH, NOISE_RUN, NOISE_LAND, NOISE_LAND_VY, PYLON_H, PYLON_W } from './combate.js';

// Espada de fuego (V): tajo de fuego delante + onda de fuego que avanza (reemplaza el alcance de las flechas).
const ESPADA_ALCANCE = 150;
// Alcances y radios de la espada se pensaron para un héroe de 129 unidades: se ajustan a su tamaño actual.
const KH = Math.max(0.75, HEROE_ALTO / 129);  // mínimo: las cajas de los enemigos no se achican con el dibujo

const R = Math.random;
const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SHOT_VOLUME = 0.7;
const IMPACT_VOLUME = 0.7;

/** Habilidades disponibles en una partida (progress/Progression.kt → PlayerAbilities). */
export class PlayerAbilities {
  constructor(data, initial) { this.data = data; this.unlocked = new Set(initial); }
  has(id) { return this.unlocked.has(id); }
  canUse(id) {
    if (!this.unlocked.has(id)) return false;
    const req = this.data.abilities[id]?.requiresAbility;
    return !req || this.canUse(req);
  }
  grant(id) { const had = this.unlocked.has(id); this.unlocked.add(id); return !had; }
}

/** Barra de energía (game/EnergySystem.kt). */
class EnergySystem {
  constructor(max = Balance.MAX_ENERGY) { this.max = max; this.value = max; this.exhausted = false; this.regenTimer = 0; }
  get ratio() { return this.value / this.max; }
  update(dt) {
    this.regenTimer = Math.max(0, this.regenTimer - dt);
    if (this.regenTimer <= 0 && this.value < this.max) this.value = Math.min(this.max, this.value + Balance.ENERGY_REGEN_RATE * dt);
    if (this.exhausted && this.value >= Balance.ENERGY_EXHAUSTED_RESUME) this.exhausted = false;
  }
  canShoot(cost) { return !this.exhausted && this.value >= cost; }
  spend(amount) {
    if (amount <= 0) return true;
    if (this.value < amount) return false;
    this.value -= amount; this.regenTimer = Balance.ENERGY_REGEN_DELAY;
    if (this.value < Balance.SHOT_ENERGY_COST) this.exhausted = true;
    return true;
  }
  reset() { this.value = this.max; this.exhausted = false; this.regenTimer = 0; }
}

/** Estado del jugador (game/Player.kt). */
class Player {
  constructor() {
    this.x = 0; this.y = 0; this.w = Physics.PLAYER_W; this.h = Physics.PLAYER_STAND_H; this.vx = 0; this.vy = 0; this.face = 1;
    this.grounded = false; this.wasGrounded = false; this.onOneWay = false; this.onMoving = null; this.onLadderTop = null; this.onRamp = null;
    this.climbing = false; this.crouching = false; this.sliding = false; this.slideTimer = 0; this.dropTimer = 0; this.jumps = 0;
    this.gliding = false; this.springLaunch = false; this.wallCling = false; this.wallSide = 0; this.wallClingArmed = false;
    this.hp = Balance.PLAYER_MAX_HP; this.maxHp = Balance.PLAYER_MAX_HP; this.lives = Balance.PLAYER_LIVES; this.invuln = 0; this.hpRegenTimer = 0;
    this.dead = false; this.won = false; this.coyote = 0; this.jumpBuffer = 0; this.jumpTime = 99; this.squash = 0; this.tilt = 0;
    this.shootCooldown = 0; this.shotAnim = 0; this.aim = 0; this.runPhase = 0; this.detonationCharge = 0;
    this.dashing = false; this.dashDir = 0; this.dashT = 0; this.dashWasGrounded = false; this.dashCooldown = 0; this.dashCooldownMax = 0.34;
    this.checkpointIndex = -1;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  overlaps(b) { return this.x < b.x + b.w && this.x + this.w > b.x && this.y < b.y + b.h && this.y + this.h > b.y; }
  resetMotion() {
    this.w = Physics.PLAYER_W; this.h = Physics.PLAYER_STAND_H;
    this.crouching = false; this.sliding = false; this.climbing = false; this.gliding = false;
    this.wallCling = false; this.wallSide = 0; this.wallClingArmed = false;
    this.dashing = false; this.dashDir = 0; this.dashT = 0; this.dashWasGrounded = false; this.dashCooldown = 0.12;
    this.grounded = false; this.onOneWay = false; this.onMoving = null; this.onLadderTop = null; this.onRamp = null;
    this.jumps = 0; this.jumpBuffer = 0; this.coyote = 0; this.springLaunch = false;
    this.vx = 0; this.vy = 0; this.detonationCharge = 0; this.aim = 0;
    this.picada = false; this.golpeT = 0; this.comboCola = false; this.comboVentana = 0; this.golpesAire = 0;
  }
}

export const keyColor = (id) => isSeal(id) ? rgb(255, 70, 150) : ({
  alfa: rgb(255, 196, 64), beta: rgb(80, 220, 255), helix: rgb(200, 110, 255), gamma: rgb(120, 255, 150),
  argos: rgb(90, 160, 255), tarjeta: rgb(255, 120, 200), metro: rgb(255, 150, 60), seguridad: rgb(80, 220, 255),
}[id] ?? rgb(255, 120, 200));
export const keyName = (id) => ({ sello_1: tr('SELLO I'), sello_2: tr('SELLO II'), sello_3: tr('SELLO III') }[id]
  ?? tr('LLAVE {0}', tr(id.toUpperCase().replace(/_/g, ' '))));

export class GameSession {
  constructor(level, data, abilities, events) {
    this.level = level; this.data = data; this.abilities = abilities; this.events = events;
    this.world = buildWorld(level, data);
    this.player = new Player();
    this.enemies = []; this.pickups = []; this.bullets = []; this.enemyBullets = [];
    this.fx = new Effects(); this.energy = new EnergySystem();
    this.time = 0; this.camX = 0; this.shake = 0; this.screenFlash = 0; this.viewWorldW = 1280;
    this.state = 'RUNNING'; this.toastText = null; this.toastTimer = 0; this.tipText = null; this.tipAge = 0;
    this.keysHeld = new Set(); this.lockedHintTimer = 0;
    this.respawnX = this.world.spawnX; this.respawnY = this.world.spawnY; this.respawnTimer = -1; this.endTimer = -1;
    this.kills = 0; this.emptyFeedbackTimer = 0; this.fallVy = 0; this.deathReason = '';
    this.shootDef = data.abilities.shoot; this.dashDef = data.abilities.dash_propulsion;
    // Jefe (y su compañero en el jefe doble), su muerte en cadena y el enlace entre los dos.
    this.boss = null; this.partner = null; this.lastBossDown = null; this.bossDeathTimer = -1;
    this.linkState = 0; this.link = [0, 0, 0, 0];
    this.pendingEnemies = []; this.noise = 0; this.target = new TargetTracker();
    this.recoveredText = null; this.recoveredTimer = 0;
    this.reset(true);
  }

  // ===================================================================== Ciclo
  update(dt, input) {
    // Pausa de impacto (hack and slash): el mundo se congela un instante al acertar con la espada.
    // Las pulsaciones de ese instante se guardan para no perderlas.
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      const p = this.player;
      if (input.shootPressed) p.comboCola = true;
      if (input.jumpPressed) p.jumpBuffer = Physics.JUMP_BUFFER;
      if (input.dashPressed) this.dashCola = true;
      if (input.detonatePressed) this.fuegoCola = true;
      this.fx.update(dt * 0.3);
      this.shake = Math.max(0, this.shake - dt * 10);
      return;
    }
    this.time += dt;
    this.noise = 0;
    this.updateMovingPlatforms(dt);
    this.updatePlayer(dt, input);
    this.updateTraps(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateBossDeath(dt);
    this.fx.update(dt);
    this.energy.update(dt);
    this.target.update(dt);
    this.updateCamera(dt);
    this.screenFlash = Math.max(0, this.screenFlash - dt * 3.8);
    this.emptyFeedbackTimer = Math.max(0, this.emptyFeedbackTimer - dt);
    if (this.toastTimer > 0) { this.toastTimer -= dt; if (this.toastTimer <= 0) this.toastText = null; }
    if (this.recoveredTimer > 0) { this.recoveredTimer -= dt; if (this.recoveredTimer <= 0) this.recoveredText = null; }
    this.updateTip(dt);
    if (this.respawnTimer > 0) { this.respawnTimer -= dt; if (this.respawnTimer <= 0) this.respawn(); }
    if (this.endTimer > 0) {
      this.endTimer -= dt;
      if (this.endTimer <= 0) {
        if (this.state === 'WON') this.events.onLevelComplete({ time: this.time, kills: this.kills, totalEnemies: this.enemies.length, livesLeft: this.player.lives });
        else if (this.state === 'GAME_OVER') this.events.onGameOver();
      }
    }
  }

  reset(full) {
    const w = this.world, p = this.player;
    if (full) {
      p.lives = Balance.PLAYER_LIVES; p.checkpointIndex = -1;
      this.respawnX = w.spawnX; this.respawnY = w.spawnY;
      this.pickups = w.pickupSpawns.map((s) => new Pickup(s.type, s.x, s.y)).filter((pk) => !(pk.abilityId && this.abilities.has(pk.abilityId)));
      this.enemies = w.enemySpawns.map((s) => new Enemy(s.def, s));
      this.boss = w.bossSpawn ? new Enemy(w.bossSpawn.def, w.bossSpawn) : null;
      if (this.boss) this.enemies.push(this.boss);
      this.partner = w.partnerSpawn ? new Enemy(w.partnerSpawn.def, w.partnerSpawn) : null;
      if (this.partner) this.enemies.push(this.partner);
      if (w.bossGate && !w.solids.includes(w.bossGate)) w.solids.push(w.bossGate);
      this.bossDeathTimer = -1; this.lastBossDown = null; this.linkState = 0;
      w.checkpoints.forEach((c) => { c.active = false; });
      w.moving.forEach((m) => { m.x = m.startX; m.y = m.startY; m.dir = m.axisX ? 1 : -1; });
      this.kills = 0; this.time = 0; this.state = 'RUNNING'; this.endTimer = -1;
      w.resetDynamic();
      this.keysHeld = new Set(this.level.startKeys);
    } else {
      w.crumbles.forEach((c) => { c.restore(); if (!w.solids.includes(c)) w.solids.push(c); });
    }
    w.lasers.forEach((l) => { l.active = false; l.state = 0; });
    w.meteors.forEach((m) => m.reset());
    this.placeAtRespawn(full ? this.inicioVisible(w) : this.respawnX, full ? w.spawnY : this.respawnY);
    p.dead = false; p.won = false; p.invuln = 0; p.hp = p.maxHp; p.hpRegenTimer = 0;
    this.energy.reset();
    this.bullets.length = 0; this.enemyBullets.length = 0; this.fx.clear(); this.target.reset();
    this.screenFlash = 0; this.shake = 0; this.respawnTimer = -1;
    this.camX = clamp(p.x - this.viewWorldW * Physics.CAMERA_FOLLOW_X, 0, Math.max(0, w.width - this.viewWorldW));
  }

  // ===================================================================== Jugador
  /** En celular la palanca tapa la esquina izquierda: el inicio se corre hasta 340 unidades si sigue habiendo el
   * mismo suelo debajo (si no, se queda donde estaba). Se corre el 30 % del ancho visible. */
  inicioVisible(w) {
    if (!document.body.classList.contains('tactil')) return w.spawnX;
    const pie = w.spawnY + Physics.PLAYER_STAND_H, suelo = (x) => w.solids.find((s) => x >= s.x && x + Physics.PLAYER_W <= s.x + s.w && Math.abs(s.y - pie) < 40);
    const base = suelo(w.spawnX);
    // Distancia según la pantalla real: la palanca ocupa ~1/4 del ancho visible (menos en pantallas anchas).
    const anchoVista = innerHeight > 0 ? innerWidth / innerHeight * Physics.WORLD_HEIGHT : 1280, libre = Math.max(340, Math.round(anchoVista * 0.3));
    for (let x = libre; x > w.spawnX; x -= 20) {
      const s = suelo(x);
      if (s && (!base || s.y === base.y) && !w.solids.some((o) => o !== s && x + Physics.PLAYER_W > o.x && x < o.x + o.w && o.y < s.y && o.y + o.h > s.y - Physics.PLAYER_STAND_H)) return x;
    }
    return w.spawnX;
  }

  placeAtRespawn(px, py) {
    const p = this.player;
    p.resetMotion();
    const test = new Box(px, py - 8, p.w, Physics.PLAYER_STAND_H);
    let tries = 0;
    while (this.world.solids.some((s) => test.overlaps(s)) && tries < 30) { test.y -= 6; tries++; }
    p.x = test.x; p.y = test.y;
  }

  continueFromCheckpoint() {
    if (this.state !== 'GAME_OVER') return;
    this.state = 'RUNNING'; this.endTimer = -1;
    this.player.lives = Balance.PLAYER_LIVES;
    this.world.crumbles.forEach((c) => { c.restore(); if (!this.world.solids.includes(c)) this.world.solids.push(c); });
    this.world.lasers.forEach((l) => { l.active = false; l.state = 0; });
    this.world.meteors.forEach((m) => m.reset());
    this.respawnTimer = -1;
    this.respawn();
    this.toast(this.player.checkpointIndex >= 0 ? 'Continúas desde el punto de control' : 'Continúas desde el inicio');
    this.camX = clamp(this.player.x - this.viewWorldW * Physics.CAMERA_FOLLOW_X, 0, Math.max(0, this.world.width - this.viewWorldW));
  }

  respawn() {
    const p = this.player;
    if (p.lives <= 0) return;
    p.dead = false; p.hp = p.maxHp; p.hpRegenTimer = 0;
    this.energy.reset();
    this.placeAtRespawn(this.respawnX, this.respawnY);
    p.invuln = Balance.RESPAWN_INVULN;
    // El jefe (si sigue vivo) recupera toda su vida, vuelve a su sitio y espera a que el jugador regrese.
    // Jefe doble: si queda alguno en pie, vuelven los dos (el combate se repite entero).
    const fight = [[this.boss, this.world.bossSpawn], [this.partner, this.world.partnerSpawn]].filter(([b]) => b);
    const fightOn = fight.some(([b]) => !b.dead);
    for (const [b, sp] of fight) {
      const st = b.boss; if (!st) continue;
      if (fightOn) { b.dead = false; b.x = sp.x; b.y = st.groundY; b.dir = sp.dir; b.hp = b.maxHp; b.flash = 0; st.reset(); }
      else { st.warnings.length = 0; st.lances.length = 0; st.pylons.length = 0; }
    }
    this.linkState = 0;
    // Al volver al punto de control, los enemigos normales reviven (el jefe no: ver arriba).
    this.enemies = this.enemies.filter((e) => e === this.boss || e === this.partner);
    this.world.enemySpawns.forEach((s) => this.enemies.push(new Enemy(s.def, s)));
    this.target.reset();
    this.pendingEnemies.length = 0;
    this.enemyBullets.length = 0;
    this.toast(tr('{0} · Vidas: {1}', tr(this.deathReason), p.lives));
  }

  die(reason) {
    const p = this.player;
    if (p.dead || p.won) return;
    this.deathReason = reason;
    p.dead = true; p.detonationCharge = 0; p.lives--;
    // El soldado cae: destello de luz y polvo, sin explosión (eso era de los robots de Sigrun).
    this.fx.burst(p.cx, p.cy - 20, 22, rgb(255, 240, 200), 220); this.fx.dust(p.cx, p.y + p.h);
    this.shake = Math.max(this.shake, 9); this.screenFlash = Math.max(this.screenFlash, 0.3);
    this.events.sfx('espada_golpe_fuerte', 0.7, 0.6);
    if (p.lives <= 0) { this.state = 'GAME_OVER'; this.endTimer = Balance.GAME_OVER_DELAY; }
    else this.respawnTimer = Balance.RESPAWN_DELAY;
  }

  damage(amount, knockX, knockY, sound = true) {
    const p = this.player;
    if (p.invuln > 0 || p.dead || p.won) return false;
    p.hp -= amount; p.hpRegenTimer = Balance.HP_REGEN_DELAY;
    p.wallCling = false; p.wallSide = 0; p.dashing = false; p.dashCooldown = 0.12;
    p.invuln = Balance.INVULN_AFTER_HIT;
    p.vx += knockX; p.vy = knockY;
    this.shake = 8;
    this.fx.burst(p.cx, p.cy, 8, rgb(255, 107, 120), 180);
    if (sound) { this.events.sfx('player_hit', IMPACT_VOLUME); this.events.sfx('espada_golpe_fuerte', 0.6, 0.7); }
    if (p.hp <= 0) this.die('Te quedaste sin vida');
    return true;
  }

  updateTip(dt) {
    let tip = null;
    for (const t of this.world.tips) if (t.x <= this.player.cx) tip = t.text;
    if (tip !== this.tipText) { this.tipText = tip; this.tipAge = 0; } else this.tipAge += dt;
  }
  toast(text) { this.toastText = tr(text); this.toastTimer = 1.7; }

  // ===================================================================== Espada del Espíritu (hack and slash)
  // X: combo de tres golpes (tajo, revés, remate). ↑ + X: tajo hacia arriba. En el aire: tajo aéreo que lo
  // mantiene suspendido (hasta Espada.AIRE_GOLPES). ↓ + X en el aire: picada; al acertar rebota y recupera el salto de fe.
  actualizarEspada(dt, inp, down, up, move) {
    const p = this.player;
    p.golpeT = Math.max(0, (p.golpeT ?? 0) - dt);
    p.comboVentana = Math.max(0, (p.comboVentana ?? 0) - dt);
    if (p.picada) this.actualizarPicada();
    if (!this.abilities.canUse('shoot') || p.dead || p.won || p.climbing) { p.comboCola = false; return; }
    if (!(inp.shootPressed || p.comboCola)) return;
    if (p.golpeT > Espada.CANCELABLE || p.picada) { p.comboCola = true; return; }
    p.comboCola = false;
    if (move !== 0) p.face = move;
    if (!p.grounded && down) this.iniciarPicada();
    else this.golpeEspada(up);
  }

  /** Grito con eco del poder (Juan, 2026-10-31): «¡Alas de águila!» al planear y «¡El apresto del evangelio!» con el
   *  impulso, en el idioma del juego (assets/audio/sfx/voz_<poder>_<es|en>.ogg). Suena cada vez (Juan); si se repite, vuelve a empezar. */
  vozPoder(poder) {
    this.events.sfx(`voz_${poder}_${lang}`, 1);
  }

  /** Zona de golpe en coordenadas del mundo, medida desde los pies del dibujo (el dibujo es más alto que la caja). */
  zonaEspada(tipo, alcance) {
    const p = this.player, f = p.face > 0 ? 1 : -1, pies = p.y + p.h, alto = HEROE_ALTO;
    if (tipo === 'arriba') return { x: p.cx - 75 * KH, y: pies - alto - 105 * KH, w: 150 * KH, h: 105 * KH + alto * 0.55 };
    if (tipo === 'aire') return { x: f > 0 ? p.cx - 45 : p.cx - alcance, y: pies - alto * 1.05, w: alcance + 45, h: alto * 1.05 + 40 };
    const x0 = f > 0 ? p.cx - 18 : p.cx - alcance, y0 = pies - alto * 1.0;
    return { x: x0, y: y0, w: alcance + 18, h: alto * 1.0 + 12 };
  }

  /** Golpea todo lo que toque la zona. Devuelve cuántas cosas acertó. */
  golpearZona(z, dano, empuje, f, opciones = {}) {
    const dentro = (b) => b.x < z.x + z.w && b.x + b.w > z.x && b.y < z.y + z.h && b.y + b.h > z.y;
    const yaGolpeados = opciones.golpeados;
    let n = 0;
    const chispa = (x, y) => this.fx.impacto(x, y, f, opciones.fuego, opciones.fuerte);
    for (const e of this.enemies) {
      if (e.dead || yaGolpeados?.has(e)) continue;
      const hb = e.hitbox;
      if (!dentro(hb)) continue;
      yaGolpeados?.add(e);
      const hx = clamp(hb.cx, z.x, z.x + z.w), hy = clamp(hb.cy, z.y, z.y + z.h);
      // Los blindados (escudo del frente) y el escudo del regente detienen la espada: hay que rodearlos.
      if (this.aegisBlocks(e, this.player.cx) || this.regentShielded(e)) {
        this.fx.burst(hx, hy, 9, rgb(255, 236, 190), 190); this.events.sfx('espada_escudo', 0.8, 0.95 + Math.random() * 0.1); this.player.vx -= f * 120; n++; continue;
      }
      e.hp -= dano; e.flash = 0.16;
      this.target.onHit(e);
      if (e.def.behavior !== 'TURRET' && !e.boss) e.x += f * empuje;
      chispa(hx, hy);
      if (e.hp <= 0) this.killEnemy(e);
      n++;
    }
    for (const tg of this.world.targets) if (!tg.dead && !yaGolpeados?.has(tg) && dentro(tg)) { yaGolpeados?.add(tg); this.hitTarget(tg, dano, tg.cx, tg.cy); chispa(tg.cx, tg.cy); n++; }
    for (const br of this.world.breakables) if (!br.dead && !yaGolpeados?.has(br) && dentro(br)) { yaGolpeados?.add(br); this.hitBreakable(br, dano, br.cx, br.cy); n++; }
    const bo = this.boss, st = bo?.boss;
    if (st) {
      const fy = st.groundY + bo.h;
      for (const py of st.pylons) {
        if (py[1] <= 0 || py[3] < 1 || yaGolpeados?.has(py)) continue;
        if (!dentro({ x: py[0] - PYLON_W / 2, y: fy - PYLON_H, w: PYLON_W, h: PYLON_H })) continue;
        yaGolpeados?.add(py); this.hitPylon(bo, st, py, dano); chispa(py[0], fy - PYLON_H / 2); n++;
      }
    }
    // La espada corta los disparos enemigos que atraviesa.
    for (const b of this.enemyBullets) if (b.life > 0 && dentro(b)) { b.life = 0; this.fx.burst(b.x + b.w / 2, b.y + b.h / 2, 6, rgb(255, 236, 170), 120); }
    return n;
  }

  golpeEspada(up) {
    const p = this.player, f = p.face > 0 ? 1 : -1;
    const tipo = up ? 'arriba' : p.grounded ? null : 'aire';
    const paso = p.comboVentana > 0 ? ((p.comboPaso ?? -1) + 1) % 3 : 0;
    p.comboPaso = paso; p.golpeTipo = tipo ?? paso;
    const dur = tipo === 'arriba' ? 0.22 : tipo === 'aire' ? 0.24 : Espada.DURACION[paso];
    p.golpeT = dur; p.golpeDur = dur; p.comboVentana = dur + Espada.VENTANA; p.shotAnim = 0;
    p.golpeId = (p.golpeId ?? 0) + 1;
    if (p.grounded && !tipo) p.vx = f * Math.max(Math.abs(p.vx) * 0.5, Espada.AVANCE[paso]);
    const alcance = Espada.ALCANCE[paso] * KH;
    const z = this.zonaEspada(tipo, alcance);
    // Dibujo del arco: nace a la altura del pecho del dibujo.
    const pies = p.y + p.h, pecho = pies - HEROE_ALTO * 0.55;
    if (tipo === 'arriba') this.fx.arco(p.cx, pies - HEROE_ALTO * 0.75, f, 'arriba', 110 * KH);
    else if (tipo === 'aire') this.fx.arco(p.cx + f * 10, pecho, f, 'aire', 105 * KH);
    else this.fx.arco(p.cx + f * 18 * KH, pecho, f, paso, (paso === 2 ? 125 : 100) * KH);
    this.makeNoise(NOISE_SHOT);
    this.events.sfx(`espada_${tipo === 'arriba' ? 2 : tipo === 'aire' ? 3 : paso + 1}`, 0.75);
    const fuerte = paso === 2 && !tipo;
    const dano = tipo === 'arriba' ? Espada.ARRIBA_DANO : tipo === 'aire' ? Espada.DANO[0] : Espada.DANO[paso];
    const n = this.golpearZona(z, dano, Espada.EMPUJE[tipo ? 0 : paso], f, { fuerte });
    if (!p.grounded) {
      p.golpesAire = (p.golpesAire ?? 0) + 1;
      if (p.golpesAire <= Espada.AIRE_GOLPES) p.vy = Math.min(p.vy, n > 0 ? Espada.AIRE_VY : 40);
      p.gliding = false;
    }
    if (n > 0) {
      this.hitstop = tipo ? 0.05 : Espada.PAUSA[paso];
      this.shake = Math.max(this.shake, fuerte ? 9 : 4);
      this.events.sfx(fuerte ? 'espada_golpe_fuerte' : 'espada_golpe', fuerte ? 0.95 : 0.8, 0.94 + Math.random() * 0.12);
      if (fuerte) this.screenFlash = Math.max(this.screenFlash, 0.18);
    }
  }

  iniciarPicada() {
    const p = this.player;
    p.picada = true; p.golpeT = 0; p.golpeTipo = 'picada'; p.comboVentana = 0;
    p.gliding = false; p.vx *= 0.25; p.vy = Espada.PICADA_VY;
    p.picadaGolpeados = new Set();
    this.fx.burst(p.cx, p.y, 8, rgb(255, 240, 190), 120);
    this.events.sfx('espada_3', 0.8, 0.8);
  }

  /** Durante la picada: golpea lo que hay bajo los pies; al acertar rebota (y recupera el salto de fe); al tocar el
   *  suelo, onda de choque corta. */
  actualizarPicada() {
    const p = this.player, f = p.face > 0 ? 1 : -1, pies = p.y + p.h;
    if (p.dashing || p.climbing || p.dead) { p.picada = false; return; }
    p.vy = Math.max(p.vy, Espada.PICADA_VY);
    if (Math.random() < 0.7) this.fx.spawn('SPARK', p.cx + (Math.random() - 0.5) * 20, pies - HEROE_ALTO * 0.5, 0, -260, 0.18, 3, rgb(255, 236, 170));
    const z = { x: p.cx - 42, y: pies - 30, w: 84, h: 60 };
    const n = this.golpearZona(z, Espada.PICADA_DANO, 0, f, { golpeados: p.picadaGolpeados, fuerte: true });
    if (n > 0) {
      p.picada = false; p.vy = Espada.REBOTE_VY; p.jumps = 1; p.golpesAire = 0;
      p.invuln = Math.max(p.invuln, 0.3);
      this.hitstop = 0.07; this.shake = Math.max(this.shake, 8);
      this.fx.arco(p.cx, pies, f, 'picada', 70 * KH);
      this.events.sfx('espada_golpe_fuerte', 0.95);
      return;
    }
    if (p.grounded) {
      p.picada = false;
      const r = Espada.CHOQUE_RADIO;
      this.golpearZona({ x: p.cx - r, y: pies - 50, w: r * 2, h: 60 }, Espada.CHOQUE_DANO, 30, f, { golpeados: p.picadaGolpeados });
      this.fx.choque(p.cx, pies, r);
      this.shake = Math.max(this.shake, 7);
      this.events.sfx('espada_golpe_fuerte', 0.7, 0.8);
    }
  }

  detonationCostFor(charge) {
    const ratio = clamp(charge / Balance.DETONATION_CHARGE_MAX, 0, 1);
    const full = this.data.abilities.detonation?.energyCost ?? Balance.DETONATION_ENERGY_COST;
    return full * (Balance.DETONATION_MIN_COST_RATIO + (1 - Balance.DETONATION_MIN_COST_RATIO) * ratio);
  }

  /** Espada de fuego (V): tajo de fuego delante y una onda de fuego que avanza y atraviesa enemigos (el alcance que
   *  antes daban las flechas). Gasta energía. */
  tajoFuego() {
    const p = this.player;
    if (p.dead || p.won) return false;
    if (!this.energy.spend(Espada.FUEGO_COSTO)) { this.events.sfx('energy_empty'); this.toast(tr('Te falta energía para la espada de fuego')); return false; }
    this.vozPoder('fuego');  // «¡Espada de doble filo!» (Hebreos 4:12)
    p.swordCooldown = Espada.FUEGO_ESPERA; p.slashAnim = 0.28; p.golpeT = 0.28; p.golpeDur = 0.28; p.golpeTipo = 'fuego'; p.comboVentana = 0;
    const f = p.face > 0 ? 1 : -1, pies = p.y + p.h, pecho = pies - HEROE_ALTO * 0.55;
    this.fx.tajo(p.cx + f * 26, pecho, f);
    this.events.sfx('espada_fuego');
    this.shake = Math.max(this.shake, 6);
    const z = this.zonaEspada(null, ESPADA_ALCANCE * KH);
    const n = this.golpearZona(z, Espada.FUEGO_DANO, 40, f, { fuego: true, fuerte: true });
    if (n > 0) { this.hitstop = 0.07; this.events.sfx('espada_golpe_fuego', 0.9); }
    // Onda: caja alta (cubre del suelo al pecho del dibujo); se dibuja como media luna de fuego.
    const h = HEROE_ALTO * 0.9, b = new Bullet(p.cx + f * 40 - 18, pies - h, 36, h, f * Espada.ONDA_VEL, Espada.ONDA_VIDA, rgb(255, 150, 60), 0, 'ONDA', Espada.ONDA_DANO);
    b.golpeados = new Set(); b.dir = f; b.dibujoDy = 30; b.dibujoDx = 0;  // con muros choca su parte alta: las gradas bajas no la frenan
    this.bullets.push(b);
    if (!p.grounded) p.vy = Math.min(p.vy, 30);
    return true;
  }

  detonate() {
    const p = this.player;
    if (p.dead || p.won || p.detonationCharge < Balance.DETONATION_MIN_CHARGE) return false;
    this.makeNoise(NOISE_DETONATION);
    const ratio = clamp(p.detonationCharge / Balance.DETONATION_CHARGE_MAX, 0, 1);
    const cost = this.detonationCostFor(p.detonationCharge);
    if (!this.energy.spend(cost)) { this.toast(tr('Te falta energía para orar así')); this.events.sfx('energy_empty'); return false; }
    const cx = p.cx, cy = p.cy;
    const radius = Balance.DETONATION_RADIUS_BASE + ratio * Balance.DETONATION_RADIUS_BONUS;
    const power = Balance.DETONATION_DAMAGE_BASE + Math.trunc(ratio * Balance.DETONATION_DAMAGE_BONUS);
    p.vx *= 0.45; p.vy *= 0.35;
    this.shake = 18 + ratio * 10; this.screenFlash = 1;
    this.fx.detonation(cx, cy, radius, ratio);
    this.events.sfx('detonation_boom');
    for (const e of this.enemies) {
      if (e.dead) continue;
      const hb = e.hitbox, ex = hb.cx, ey = hb.cy, dist = Math.hypot(ex - cx, ey - cy);
      if (dist <= radius) {
        if (this.regentShielded(e)) { this.shieldSpark(ex, ey); continue; }
        e.hp -= power; e.flash = 0.18;
        this.target.onHit(e);
        const push = (1 - dist / radius) * (55 + ratio * 90);
        if (e.def.behavior !== 'TURRET' && !e.boss) e.x += (ex - cx === 0 ? 1 : sign(ex - cx)) * push;
        this.fx.burst(ex, ey, 10, rgb(189, 239, 255), 180);
        if (e.hp <= 0) this.killEnemy(e);
      }
    }
    for (const tg of this.world.targets) if (!tg.dead && Math.hypot(tg.cx - cx, tg.cy - cy) <= radius) this.hitTarget(tg, power, tg.cx, tg.cy);
    for (const br of this.world.breakables) if (!br.dead && Math.hypot(br.cx - cx, br.cy - cy) <= radius + br.w / 2) this.hitBreakable(br, power, br.cx, br.cy);
    const st = this.boss?.boss;
    if (st) {
      const fy = st.groundY + this.boss.h;
      for (const py of st.pylons) if (py[1] > 0 && py[3] >= 1 && Math.hypot(py[0] - cx, fy - PYLON_H / 2 - cy) <= radius + 20) this.hitPylon(this.boss, st, py, power);
    }
    for (const b of this.enemyBullets) {
      if (Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy) <= radius) { b.life = 0; this.fx.burst(b.x, b.y, 5, rgb(223, 250, 255), 100); }
    }
    this.toast(tr('¡ORACIÓN! El lugar tiembla · fuerza {0}%', Math.trunc(ratio * 100)));
    return true;
  }

  tryDash(dir) {
    const p = this.player;
    if (!this.abilities.canUse('dash_propulsion')) return;
    if (p.dashing || p.dashCooldown > 0 || p.climbing || p.wallCling || p.dead || p.won) return;
    if (!this.energy.spend(this.dashDef?.energyCost ?? 0)) return;
    p.dashing = true; p.dashDir = dir; p.dashT = 0; p.dashWasGrounded = p.grounded;
    p.dashCooldownMax = this.dashDef?.cooldown > 0 ? this.dashDef.cooldown : 0.34;
    p.dashCooldown = p.dashCooldownMax;
    p.wallCling = false; p.wallSide = 0; p.gliding = false; p.climbing = false;
    p.face = dir; p.jumpBuffer = 0;
    p.vy = p.grounded ? 55 : p.vy * 0.12;
    p.vx = dir * Physics.DASH_SPEED;
    this.shake = Math.max(this.shake, 3.5);
    this.fx.burst(p.cx, p.cy, 8, rgb(185, 243, 255), 150);
    this.events.sfx('dash');
    this.vozPoder('calzado');
  }

  updateDash(dt) {
    const p = this.player;
    p.dashT = Math.min(1, p.dashT + dt / Physics.DASH_DURATION);
    const t = p.dashT;
    p.vx = p.dashDir * (Physics.DASH_SPEED - Physics.DASH_SPEED_DROP * t);
    if (p.dashWasGrounded) p.vy = 55;
    else { p.vy += Physics.GRAVITY * 0.10 * dt; p.vy = clamp(p.vy, -80, 150); }
    p.gliding = false; p.wallCling = false; p.tilt = p.dashDir * 0.035;
    const intendedVx = p.vx;
    this.collide(dt);
    const hitWall = intendedVx !== 0 && p.vx === 0;
    if (t >= 1 || hitWall) {
      p.dashing = false;
      p.vx = hitWall ? 0 : p.dashDir * Physics.DASH_EXIT_SPEED;
      p.vy = p.dashWasGrounded ? 0 : Math.max(p.vy, 20);
      p.dashWasGrounded = false; p.tilt = 0;
      this.fx.burst(p.cx, p.cy, hitWall ? 5 : 9, hitWall ? rgb(216, 247, 255) : rgb(140, 236, 255), 150);
    }
  }

  updatePlayer(dt, inp) {
    const p = this.player, w = this.world;
    if (p.dead || p.won) return;
    p.wasGrounded = p.grounded;
    this.fallVy = p.vy;
    p.invuln = Math.max(0, p.invuln - dt);
    p.hpRegenTimer = Math.max(0, p.hpRegenTimer - dt);
    if (p.hp > 0 && p.hp < p.maxHp && p.hpRegenTimer <= 0) p.hp = Math.min(p.maxHp, p.hp + Balance.HP_REGEN_RATE * dt);
    p.shootCooldown = Math.max(0, p.shootCooldown - dt);
    p.slideTimer = Math.max(0, p.slideTimer - dt);
    p.dropTimer = Math.max(0, p.dropTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.coyote = p.grounded ? Physics.COYOTE_TIME : Math.max(0, p.coyote - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.jumpTime += dt;
    p.squash += (0 - p.squash) * Math.min(1, dt * 10);
    p.shotAnim = Math.max(0, p.shotAnim - dt * 7);
    if (p.grounded) {
      const before = p.runPhase;
      p.runPhase += Math.abs(p.vx) * dt * 0.045;
      if (Math.abs(p.vx) > Physics.RUN_SPEED - 60 && !p.sliding && !p.dashing &&
        Math.floor(before / Math.PI) !== Math.floor(p.runPhase / Math.PI)) this.fx.dust(p.cx - p.face * 8, p.y + p.h, p.face);
    } else if (p.climbing) p.runPhase += Math.abs(p.vy) * dt * 0.06;
    p.tilt += (0 - p.tilt) * Math.min(1, dt * 8);

    const canJump = this.abilities.canUse('basic_jump');
    const jumpHeld = inp.jumpHeld && canJump;
    if (inp.jumpPressed && canJump) p.jumpBuffer = Physics.JUMP_BUFFER;

    // ---- Detonación: mantener = cargar (solo en el suelo), soltar = detonar.
    if (this.abilities.canUse('detonation')) {
      // Espada de fuego (Juan: reemplaza a la Oración): un tajo en arco delante, en el suelo o en el aire.
      p.swordCooldown = Math.max(0, (p.swordCooldown ?? 0) - dt);
      p.slashAnim = Math.max(0, (p.slashAnim ?? 0) - dt);
      if ((inp.detonatePressed || this.fuegoCola) && p.swordCooldown <= 0 && !p.picada) this.tajoFuego();
      this.fuegoCola = false;
      p.detonationCharge = 0;
    } else p.detonationCharge = 0;

    // ---- Apuntar estilo Contra
    p.aim = this.aimFor(inp);
    const aimPlanted = p.aim === 2 && p.grounded && p.onRamp?.slide !== true;
    if (p.aim !== 0 && Math.abs(inp.moveX) > 0.05) p.face = inp.moveX > 0 ? 1 : -1;


    // ---- Stick: direcciones por ángulo
    const stickLen = Math.hypot(inp.moveX, inp.moveY);
    const stickDownDeg = inp.moveY > 0 ? Math.atan2(inp.moveY, Math.abs(inp.moveX)) * 180 / Math.PI : 0;
    const down = stickLen > K.STICK_DOWN_MIN && stickDownDeg > K.STICK_DOWN_DEG;
    const crouchStill = down && stickDownDeg > K.STICK_CROUCH_STILL_DEG;
    const move = (!this.abilities.canUse('move') || aimPlanted) ? 0
      : (crouchStill && p.grounded) ? 0 : inp.moveX > 0.01 ? 1 : inp.moveX < -0.01 ? -1 : 0;
    if (crouchStill && inp.moveX !== 0) p.face = inp.moveX > 0 ? 1 : -1;
    const up = inp.moveY < -ControlsConfig.JOYSTICK_UP_THRESHOLD;

    this.actualizarEspada(dt, inp, down, up || p.aim === 2, move);
    if (inp.dashPressed || this.dashCola) { this.dashCola = false; this.tryDash(move !== 0 ? move : p.face); }

    // ---- Escaleras (siempre disponibles)
    const topLadder = p.onLadderTop;
    if (topLadder && down && !p.climbing && !p.dashing) { p.y += 6; p.climbing = true; }
    const ladder = this.currentLadder();
    if (ladder && (up || down) && !p.sliding && !p.dashing && !p.climbing) {
      p.climbing = true; p.vx = 0; p.gliding = false; p.wallCling = false; p.wallSide = 0;
    }
    if (p.climbing && !ladder) p.climbing = false;

    // ---- Agacharse y deslizarse
    const wantsCrouch = down && !p.climbing;
    if (wantsCrouch && p.grounded && Math.abs(p.vx) > Physics.SLIDE_MIN_SPEED && !p.sliding) {
      p.sliding = true; p.slideTimer = Physics.SLIDE_TIME;
      if (p.h !== Physics.PLAYER_CROUCH_H) { p.h = Physics.PLAYER_CROUCH_H; p.y += Physics.PLAYER_STAND_H - Physics.PLAYER_CROUCH_H; }
      p.vx *= Physics.SLIDE_BOOST;
      this.fx.dust(p.cx, p.y + p.h, p.face);
    }
    if (p.sliding && (p.slideTimer <= 0 || Math.abs(p.vx) < Physics.SLIDE_END_SPEED)) p.sliding = false;
    if ((wantsCrouch || p.sliding) && p.grounded) {
      if (p.h !== Physics.PLAYER_CROUCH_H) { p.y += Physics.PLAYER_STAND_H - Physics.PLAYER_CROUCH_H; p.h = Physics.PLAYER_CROUCH_H; }
      p.crouching = true;
    } else if (p.h !== Physics.PLAYER_STAND_H && this.canStand()) {
      p.y -= Physics.PLAYER_STAND_H - Physics.PLAYER_CROUCH_H; p.h = Physics.PLAYER_STAND_H; p.crouching = false;
    }

    // ---- Bajar por plataforma atravesable: abajo + salto
    if (down && inp.jumpPressed && (p.onOneWay || p.onMoving)) {
      p.dropTimer = Physics.DROP_THROUGH_TIME; p.grounded = false; p.y += 8; p.vy = 90; p.jumpBuffer = 0;
    }

    const maxJumps = this.abilities.canUse('double_jump') ? Physics.MAX_JUMPS : 1;

    if (p.dashing) {
      this.updateDash(dt);
    } else if (p.climbing && ladder) {
      const climbUp = inp.moveY < -ControlsConfig.JOYSTICK_LADDER_THRESHOLD;
      const climbDown = inp.moveY > ControlsConfig.JOYSTICK_LADDER_THRESHOLD;
      p.x += (ladder.cx - p.w / 2 - p.x) * Math.min(1, dt * 18);
      p.vx = 0;
      p.vy = ((climbDown ? 1 : 0) - (climbUp ? 1 : 0)) * Physics.LADDER_SPEED;
      if (move !== 0) p.face = move;
      if (inp.jumpPressed && canJump) {
        p.climbing = false; p.vy = Physics.LADDER_JUMP_VY; p.vx = p.face * Physics.LADDER_JUMP_VX; p.jumps = 1;
        this.fx.burst(p.cx, p.y + p.h, 5, rgb(139, 233, 253), 90);
        this.collide(dt);
      } else {
        this.collide(dt);
        if (p.y + p.h <= ladder.y + 2 && climbUp) {
          p.y = ladder.y - p.h; p.vy = 0; p.climbing = false; p.grounded = true; p.onLadderTop = ladder;
        } else if (p.grounded && climbDown) p.climbing = false;
        else p.grounded = false;
      }
    } else {
      const chute = p.onRamp && p.onRamp.slide && p.grounded ? p.onRamp : null;
      if (chute) {
        const d = chute.downhill;
        const target = d * (move === d ? K.RAMP_FAST : move === -d ? K.RAMP_SLOW : K.RAMP_SPEED);
        p.vx += clamp(target - p.vx, -K.RAMP_ACCEL * dt, K.RAMP_ACCEL * dt);
        p.face = move !== 0 ? move : d; p.sliding = false;
      }
      // Horizontal: el héroe siempre corre (el sigilo es ir agachado)
      const maxSpeed = p.sliding ? Physics.SLIDE_SPEED : (p.crouching && p.grounded) ? K.CROUCH_SPEED : Physics.RUN_SPEED;
      const accel = p.grounded ? Physics.ACCEL_GROUND : Physics.ACCEL_AIR;
      const decel = p.grounded ? Physics.DECEL_GROUND : Physics.DECEL_AIR;
      if (chute) { /* ya resuelto */ }
      else if (move !== 0 && !p.sliding && !(p.grounded && p.golpeT > 0)) { p.vx += move * accel * dt; p.vx = clamp(p.vx, -maxSpeed, maxSpeed); p.face = move; }
      else if (!p.sliding) { const d = decel * dt; if (Math.abs(p.vx) <= d) p.vx = 0; else p.vx -= sign(p.vx) * d; }
      else p.vx *= Math.pow(0.55, dt);

      // Sin adhesión a pared ni gancho (Juan los quitó: no servían ni se veían).

      // Salto y doble salto
      if (p.jumpBuffer > 0 && !p.wallCling) {
        if (p.grounded || p.coyote > 0) {
          p.jumpBuffer = 0; p.coyote = 0;
          p.vy = Physics.JUMP_VELOCITY; p.grounded = false; p.jumps = 1; p.gliding = false; p.jumpTime = 0;
          p.wallClingArmed = true; p.squash = -0.22;
          this.fx.dust(p.cx, p.y + p.h);
          this.events.sfx('jump', 0.7);
        } else if (p.jumps < maxJumps) {
          p.jumpBuffer = 0;
          p.vy = p.springLaunch ? Math.min(p.vy, Physics.DOUBLE_JUMP_VELOCITY) : Physics.DOUBLE_JUMP_VELOCITY;
          p.jumps += 1; p.gliding = false; p.jumpTime = 0; p.squash = -0.16; p.picada = false;
          this.fx.burst(p.cx, p.cy, 8, rgb(126, 231, 255), 130);
          this.events.sfx('jump', 0.6);
        }
      } else if (p.wallCling) p.jumpBuffer = 0;

      p.gliding = this.abilities.canUse('glide') && !p.wallCling && !p.picada && p.jumps >= 2 && !p.grounded && jumpHeld && p.vy > Physics.GLIDE_MIN_VY;
      let gravity = Physics.GRAVITY * Physics.PLAYER_GRAVITY_MULT;
      if (p.gliding) {
        gravity *= Physics.GLIDE_GRAVITY_MULT;
        if (p.vy > Physics.GLIDE_MAX_FALL) p.vy = Physics.GLIDE_MAX_FALL;
        p.tilt = p.face * 0.10;
        // Voz con eco cuando las alas ya sostienen (Juan): al acabar la subida del segundo salto, ya bajando
        // despacio con SALTO mantenido; no durante el impulso del doble salto. Una vez por cada planeo.
        if (p.vy >= 0) p.glideT = (p.glideT ?? 0) + dt;
        if (p.glideT > 0.08 && !p.vozAlas) { p.vozAlas = true; this.vozPoder('alas'); }
      } else { p.glideT = 0; p.vozAlas = false; }  // cada vez que vuelve a planear, vuelve a sonar
      const zone = p.wallCling ? null : w.gravityZones.find((z) => p.overlaps(z));
      if (zone) {
        p.gliding = false; p.springLaunch = false;
        p.vy += (down ? Physics.GRAVITY * 0.3 : Physics.GRAVITY * 0.2 - zone.lift) * dt;
        if (p.vy < -K.ZONE_MAX_RISE) p.vy += (-K.ZONE_MAX_RISE - p.vy) * Math.min(1, dt * 6);
        p.vy = Math.min(p.vy, K.ZONE_MAX_SINK);
        if (p.jumps > 1) p.jumps = 1;
      } else if (!p.wallCling) {
        if (p.springLaunch && (p.vy >= 0 || p.jumps >= 2)) p.springLaunch = false;
        if (!jumpHeld && p.vy < 0 && p.jumpTime > Physics.JUMP_MIN_HOLD && !p.springLaunch) gravity *= Physics.VARIABLE_JUMP_GRAVITY_MULT;
        if (p.vy > 0 && !p.gliding) gravity *= Physics.PLAYER_FALL_GRAVITY_MULT / Physics.PLAYER_GRAVITY_MULT;  // bajada más suave
        p.vy += gravity * dt;
        if (!p.picada) p.vy = Math.min(p.vy, Physics.PLAYER_MAX_FALL);
      }

      if (p.onMoving) { p.x += p.onMoving.dx; p.y += p.onMoving.dy; }
      this.collide(dt);
      this.rideConveyor(dt);

    }

    // ---- Aterrizaje
    if (p.grounded && !p.wasGrounded) {
      p.jumps = 0; p.gliding = false; p.climbing = false; p.wallCling = false; p.wallSide = 0; p.wallClingArmed = false; p.golpesAire = 0;
      p.squash = 0.25;
      this.fx.dust(p.cx, p.y + p.h);
      if (this.fallVy > NOISE_LAND_VY) this.makeNoise(NOISE_LAND);
    }
    // ---- Ruido (perros dormidos): caminar es silencioso; correr, deslizarse o el impulso no.
    if (p.dashing) this.makeNoise(NOISE_DASH);
    else if (p.grounded && (p.sliding || (!p.crouching && Math.abs(p.vx) > 60))) this.makeNoise(NOISE_RUN);

    // ---- Límites y peligros
    p.x = clamp(p.x, 0, w.width - p.w);
    if (p.y > Physics.WORLD_HEIGHT + Physics.FALL_DEATH_MARGIN) { this.die('Caíste al vacío'); return; }
    for (const hz of w.hazards) if (p.overlaps(hz)) this.damage(1, (p.x < hz.cx ? -1 : 1) * 280, -360);

    // ---- Puntos de control
    w.checkpoints.forEach((c, i) => {
      // Se activa al pasarlo, a cualquier altura (Juan: saltando o planeando por encima no se encendía y al morir
      // volvía muy atrás, lejos del jefe).
      if (!p.dead && p.x + p.w >= c.x && p.x <= c.x + c.w + 400 && p.checkpointIndex < i) {
        p.checkpointIndex = i; c.active = true;
        this.respawnX = c.x + 36; this.respawnY = c.y + c.h - Physics.PLAYER_STAND_H - 2;
        this.toast(tr('Punto de descanso: aquí vuelves si caes'));
        this.fx.burst(c.x + 10, c.y + 15, 14, rgb(124, 255, 171), 160);
        this.events.sfx('checkpoint');
      }
    });

    // ---- Objetos
    for (const pk of this.pickups) {
      if (pk.taken || !p.overlaps(pk)) continue;
      pk.taken = true;
      const ability = pk.abilityId;
      if (ability) {
        if (this.abilities.grant(ability)) this.events.onAbilityGranted?.(ability);
        this.toast(tr('RECIBISTE EL PODER: {0}', this.data.abilityName(ability).toUpperCase()));
        this.fx.burst(pk.cx, pk.cy, 24, rgb(127, 228, 255), 200);
      } else if (pk.type === 'heal') {
        p.hp = Math.min(p.maxHp, p.hp + Balance.HEAL_PICKUP_AMOUNT);
        this.toast(tr('+{0} de vida', Balance.HEAL_PICKUP_AMOUNT));
        this.fx.burst(pk.cx, pk.cy, 12, rgb(255, 214, 140), 140);  // migas doradas (antes verde)
      } else if (pk.type.startsWith('item:')) {
        this.recoveredText = pk.type.slice(5); this.recoveredTimer = K.RECOVERED_TIME;
        this.screenFlash = Math.max(this.screenFlash, 0.6);
        this.fx.burst(pk.cx, pk.cy, 30, rgb(255, 214, 120), 220);
        this.events.sfx('checkpoint');
      } else if (pk.type === 'energy') {
        this.energy.reset(); this.toast(tr('Energía renovada'));
        this.fx.burst(pk.cx, pk.cy, 12, rgb(64, 214, 255), 140);
      } else {
        p.lives++; this.toast(tr('+1 vida extra'));
        this.fx.burst(pk.cx, pk.cy, 15, rgb(255, 209, 102), 150);
      }
      this.events.sfx('pickup');
    }

    // ---- Meta (solo cuenta con el jefe y su compañero vencidos)
    const bossAlive = this.boss?.dead === false || this.partner?.dead === false;
    if (p.overlaps(w.goal) && bossAlive) {
      if (this.toastTimer <= 0) this.toast(tr('Vence a la sombra grande para seguir'));
    } else if (p.overlaps(w.goal)) {
      p.won = true; this.state = 'WON'; this.endTimer = 1.1;
      this.fx.burst(w.goal.cx, w.goal.cy, 30, rgb(114, 255, 166), 250);
      this.events.sfx('level_complete');
    }
  }

  // ===================================================================== Colisiones (idénticas al original)
  collide(dt) {
    const p = this.player, w = this.world;
    const prevX = p.x;
    p.x += p.vx * dt;
    for (const s of w.solids) {
      if (!p.overlaps(s)) continue;
      if (s.overlapsR(prevX, p.y, p.w, p.h)) {
        const penL = p.x + p.w - s.x, penR = s.x + s.w - p.x;
        const penV = Math.min(p.y + p.h - s.y, s.y + s.h - p.y);
        const penH = Math.min(penL, penR);
        if (penH < penV) { p.x = penL < penR ? s.x - p.w : s.x + s.w; p.vx = 0; }
        continue;
      }
      if (p.vx > 0) p.x = s.x - p.w; else if (p.vx < 0) p.x = s.x + s.w;
      p.vx = 0;
    }
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    p.grounded = false; p.onOneWay = false; p.onMoving = null; p.onLadderTop = null;
    const prevRamp = p.onRamp;
    p.onRamp = null;
    for (const s of w.solids) {
      if (!p.overlaps(s)) continue;
      if (p.vy > 0 && prevBottom <= s.y + 8) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; }
      else if (p.vy < 0) { p.y = s.y + s.h; p.vy = 0; }
      else {
        const topPen = (p.y + p.h) - s.y, botPen = (s.y + s.h) - p.y;
        if (topPen < botPen) { p.y = s.y - p.h; p.vy = 0; p.grounded = true; } else { p.y = s.y + s.h; p.vy = 0; }
      }
    }
    if (p.dropTimer <= 0 && p.vy >= 0) {
      for (const o of w.oneWays) {
        const bottom = p.y + p.h;
        if (p.x + p.w > o.x && p.x < o.x + o.w && bottom >= o.y && bottom <= o.y + 18 && prevBottom <= o.y + 8) {
          p.y = o.y - p.h; p.vy = 0; p.grounded = true; p.onOneWay = true;
        }
      }
      for (const m of w.moving) {
        const bottom = p.y + p.h;
        if (p.x + p.w > m.x && p.x < m.x + m.w && bottom >= m.y && bottom <= m.y + 18 && prevBottom <= m.y + 8) {
          p.y = m.y - p.h; p.vy = 0; p.grounded = true; p.onMoving = m;
        }
      }
      if (!p.climbing) {
        const fxp = p.cx;
        for (const r of w.ramps) {
          if (!r.covers(fxp)) continue;
          const sy = r.yAt(fxp), bottom = p.y + p.h;
          const stick = prevRamp && p.vy >= 0 && bottom >= sy - 26 && bottom <= sy + 26;
          const land = prevBottom <= r.yAt(fxp - p.vx * dt) + 10 && bottom >= sy;
          if (stick || land) { p.y = sy - p.h; p.vy = 0; p.grounded = true; p.onRamp = r; break; }
        }
        for (const l of w.ladders) {
          const bottom = p.y + p.h;
          if (p.x + p.w > l.x + 4 && p.x < l.x + l.w - 4 && bottom >= l.y && bottom <= l.y + 12 && prevBottom <= l.y + 4) {
            p.y = l.y - p.h; p.vy = 0; p.grounded = true; p.onLadderTop = l;
          }
        }
      }
    }
  }

  /** Cinta transportadora bajo los pies: arrastra al jugador (sin atravesar paredes). */
  rideConveyor(dt) {
    const p = this.player;
    if (!p.grounded || p.onMoving) return;
    const belt = this.world.conveyors.find((c) => Math.abs(p.y + p.h - c.y) < 2 && p.x + p.w > c.x + 2 && p.x < c.x + c.w - 2);
    if (!belt) return;
    const dx = belt.speed * dt;
    p.x += dx;
    for (const s of this.world.solids) {
      if (s === belt || !p.overlaps(s)) continue;
      if (dx > 0) p.x = s.x - p.w; else p.x = s.x + s.w;
    }
  }
  keyNameOf(id) { return keyName(id); }
  keyColorOf(id) { return keyColor(id); }

  canStand() {
    const p = this.player;
    const ty = p.y - (Physics.PLAYER_STAND_H - p.h);
    return !this.world.solids.some((s) => s.overlapsR(p.x, ty, p.w, Physics.PLAYER_STAND_H));
  }
  currentLadder() {
    const p = this.player;
    return this.world.ladders.find((l) => l.overlapsR(p.x + 5, p.y + 3, p.w - 10, p.h - 4)) || null;
  }
  aimFor(inp) {
    const p = this.player;
    if (p.climbing || p.wallCling || p.dashing || p.sliding || p.crouching) return 0;
    if (Math.hypot(inp.moveX, inp.moveY) < ControlsConfig.AIM_MIN_TILT || inp.moveY >= 0) return 0;
    if (this.currentLadder()) return 0;
    const deg = Math.atan2(-inp.moveY, Math.abs(inp.moveX)) * 180 / Math.PI;
    return deg >= ControlsConfig.AIM_UP_DEG ? 2 : deg >= ControlsConfig.AIM_DIAGONAL_DEG ? 1 : 0;
  }
  wallContactSide(margin) {
    // Solo cuentan como pared los muros que llegan al pecho del dibujo (personajes más grandes que su caja): las gradas
    // y muros bajos ya no lo «pegan» al saltar, y al trepar, cuando el borde baja del pecho, se sube solo encima.
    const p = this.player, inset = 5, h = Math.max(8, p.h - inset * 2), pecho = p.y + p.h - HEROE_ALTO * 0.6;
    const alto = (s) => s.y < pecho;
    const muroL = this.world.solids.find((s) => s.overlapsR(p.x - margin, p.y + inset, margin + 1, h));
    const muroR = this.world.solids.find((s) => s.overlapsR(p.x + p.w - 1, p.y + inset, margin + 1, h));
    if (muroL || muroR) p.muroTope = Math.min(muroL?.y ?? Infinity, muroR?.y ?? Infinity);
    const left = !!muroL && alto(muroL), right = !!muroR && alto(muroR);
    if (left && right) return p.face > 0 ? 1 : -1;
    return right ? 1 : left ? -1 : 0;
  }

  // ===================================================================== Mundo dinámico
  updateMovingPlatforms(dt) {
    for (const m of this.world.moving) {
      const px = m.x, py = m.y;
      if (m.axisX) {
        m.x += m.dir * m.speed * dt;
        if (m.x < m.min) { m.x = m.min; m.dir = 1; }
        if (m.x > m.max) { m.x = m.max; m.dir = -1; }
      } else if (m.wait > 0) m.wait -= dt;
      else {
        m.y += m.dir * m.speed * dt;
        if (m.y < m.min) { m.y = m.min; m.dir = 1; m.wait = m.pause; }
        if (m.y > m.max) { m.y = m.max; m.dir = -1; m.wait = m.pause; }
      }
      m.dx = m.x - px; m.dy = m.y - py;
    }
  }

  onScreen(x, margin = 120) { return x > this.camX - margin && x < this.camX + this.viewWorldW + margin; }

  updateCamera(dt) {
    const targetX = clamp(this.player.x - this.viewWorldW * Physics.CAMERA_FOLLOW_X, 0, Math.max(0, this.world.width - this.viewWorldW));
    this.camX += (targetX - this.camX) * (1 - Math.pow(0.002, dt));
    // Duelo con jefe: la cámara se aleja un poco para ver la pelea completa.
    const jefe = [this.boss, this.partner].find((b) => b && !b.dead && b.boss && b.boss.move !== 'SLEEP');
    const zObj = jefe ? ZOOM_JEFE : ZOOM;
    this.zoom = this.zoom === undefined ? zObj : this.zoom + (zObj - this.zoom) * (1 - Math.pow(0.15, dt));
    // Con la cámara acercada (ZOOM > 1) también sigue al jugador en vertical.
    const vh = this.viewWorldH ?? Physics.WORLD_HEIGHT;
    const targetY = clamp(this.player.y + this.player.h - vh * 0.7, 0, Math.max(0, Physics.WORLD_HEIGHT - vh));
    this.camY = this.camY === undefined ? targetY : this.camY + (targetY - this.camY) * (1 - Math.pow(0.004, dt));
    this.shake = Math.max(0, this.shake - dt * 30);
  }
}

// Enemigos, jefes, trampas y proyectiles completos (fase 2).
Object.assign(GameSession.prototype, metodosCombate);
