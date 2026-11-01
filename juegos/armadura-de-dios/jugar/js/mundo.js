// Geometría en tiempo de ejecución de un nivel (port de game/LevelWorld.kt). Se construye encadenando segmentos.
import { K } from './config.js';

export class Box {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  overlaps(o) { return this.x < o.x + o.w && this.x + this.w > o.x && this.y < o.y + o.h && this.y + this.h > o.y; }
  overlapsR(ox, oy, ow, oh) { return this.x < ox + ow && this.x + this.w > ox && this.y < oy + oh && this.y + this.h > oy; }
  contains(px, py) { return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

export class MovingPlatform extends Box {
  constructor(x, y, w, axisX, min, max, speed, elevator = false, pause = 0) {
    super(x, y, w, 18);
    Object.assign(this, { axisX, min, max, speed, elevator, pause });
    this.wait = 0; this.dir = axisX ? 1 : -1; this.dx = 0; this.dy = 0; this.startX = x; this.startY = y;
  }
}
export class Checkpoint extends Box { constructor(x, y, w, h) { super(x, y, w, h); this.active = false; } }
export class Pickup extends Box {
  constructor(type, x, y) { super(x, y, 24, 24); this.type = type; this.taken = false; }
  get abilityId() { return this.type.startsWith('ability:') ? this.type.slice(8) : null; }
}
export class Crumble extends Box {
  constructor(x, y, w, h) { super(x, y, w, h); this.homeY = y; this.timer = -1; this.falling = false; this.vy = 0; this.respawn = 0; }
  restore() { this.y = this.homeY; this.timer = -1; this.falling = false; this.vy = 0; this.respawn = 0; }
}
export class Ramp {
  constructor(x1, y1, x2, y2, slide) { Object.assign(this, { x1, y1, x2, y2, slide }); this.downhill = y2 >= y1 ? 1 : -1; }
  yAt(x) { return this.y1 + (this.y2 - this.y1) * Math.min(1, Math.max(0, (x - this.x1) / (this.x2 - this.x1))); }
  covers(x) { return x >= this.x1 && x <= this.x2; }
}
export class Laser {
  constructor(x, floorY, h, period, on, offset, fire = false, ceiling = false) {
    Object.assign(this, { x, floorY, h, period, on, offset, fire, ceiling });
    this.state = 0; this.k = 0; this.clock = 0; this.active = false;
    this.beam = ceiling ? new Box(x - 7, floorY, 14, h) : new Box(x - 7, floorY - h, 14, h);
  }
}
export class KeyItem extends Box { constructor(id, x, y) { super(x - 14, y - 14, 28, 28); this.id = id; this.taken = false; } }
export class Door extends Box { constructor(key, x, y, w, h) { super(x, y, w, h); this.key = key; this.open = 0; this.opening = false; } }
export class Target extends Box {
  constructor(x, y, w, h, maxHp) { super(x, y, w, h); this.maxHp = maxHp; this.hp = maxHp; this.dead = false; this.flash = 0; }
}
export class Barrier extends Box { constructor(x, y, w, h) { super(x, y, w, h); this.off = 0; this.disabled = false; } }
export class Breakable extends Box {
  constructor(x, y, w, h, maxHp) { super(x, y, w, h); this.maxHp = maxHp; this.hp = maxHp; this.dead = false; this.flash = 0; }
  restore() { this.hp = this.maxHp; this.dead = false; this.flash = 0; }
}
export class GravityZone extends Box { constructor(x, y, w, h, lift) { super(x, y, w, h); this.lift = lift; } }
/** Compuerta automática: el panel sube (se acorta h) al acercarse el jugador y baja al alejarse. */
export class AutoDoor extends Box {
  constructor(x, y, w, fullH) { super(x, y, w, fullH); this.fullH = fullH; this.open = 0; }
  reset() { this.open = 0; this.h = this.fullH; }
}
/** Suelo electrificado sobre la superficie floorY: aviso con chispas y luego descarga. */
export class Shock extends Box {
  constructor(x, floorY, w, period, on, offset) { super(x, floorY - 26, w, 26); Object.assign(this, { floorY, period, on, offset }); this.state = 0; this.k = 0; }
}
/** Guillotina: y = borde inferior actual de la cuchilla. */
export class Guillotine {
  constructor(x, top, bottom, w, period, offset) {
    Object.assign(this, { x, top, bottom, w, period, offset }); this.y = top; this.warn = 0; this.blade = new Box(x, top - 44, w, 44);
  }
}
/** Meteorito: carril fijo con aviso antes de cada caída; mata de un golpe y revienta contra lo sólido. */
export class Meteor {
  constructor(x, period, offset, dir) { Object.assign(this, { x, period, offset, dir }); this.reset(); this.px = 0; this.py = 0; this.endX = 0; this.endY = 0; }
  reset() { this.clock = 0; this.active = false; this.warn = 0; this.flying = false; this.cycle = 0; }
  xAt(y) { return this.x + this.dir * Meteor.SLOPE * (y - 660); }
}
Meteor.SLOPE = 0.55;
Meteor.START_Y = -80;
/** Cinta transportadora (sólida): arrastra a quien esté encima a speed px/s. */
export class Conveyor extends Box { constructor(x, y, w, speed) { super(x, y, w, 22); this.speed = speed; } }
/** Sierra circular (centro x, y); vaivén entre min y max si speed > 0. */
export class Saw {
  constructor(x, y, r, axisX, min, max, speed) { Object.assign(this, { x, y, r, axisX, min, max, speed }); this.dir = 1; this.angle = 0; }
}

export class Spring extends Box {
  constructor(x, floorY, power) { super(x, floorY - 18, 48, 18); this.power = power; this.squash = 0; }
}

/** String.hashCode() de Java (entero de 32 bits con signo). */
function javaHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
/** Igual que LevelWorld.hash01: decide qué huecos de enemigo se rellenan. */
function hash01(seed, i) {
  let h = (Math.imul(javaHash(seed), 31) + Math.imul(i, 7919)) | 0;
  h = h ^ (h >>> 16);
  h = Math.imul(h, 0x45d9f3b);
  h = h ^ (h >>> 16);
  return (h & 0xffff) / 65536;
}

export function buildWorld(level, data) {
  const w = {
    solids: [], oneWays: [], ladders: [], hazards: [], moving: [], checkpoints: [], enemySpawns: [], pickupSpawns: [],
    tips: [], crumbles: [], ramps: [], lasers: [], keys: [], doors: [], targets: [], barriers: [], springs: [], backs: [],
    props: [], gravityZones: [], breakables: [], segmentStarts: [], goal: null, bossSpawn: null, bossGate: null, partnerSpawn: null,
    guillotines: [], saws: [], autoDoors: [], shocks: [], windows: [], ducts: [], conveyors: [], meteors: [],
    spawnX: 95, spawnY: 570, width: 0,
  };
  const bossDef = level.bossId ? data.enemies[level.bossId] : null;
  let offset = 0;
  const slotCounters = {};
  let slotIndex = 0;
  level.segments.forEach((segId, segIndex) => {
    w.segmentStarts.push(offset);
    const seg = data.segments[segId];
    if (!seg) { console.warn('Segmento desconocido:', segId); return; }
    const box = (r) => new Box(r.x + offset, r.y, r.w, r.h);
    seg.solids.forEach((r) => w.solids.push(box(r)));
    seg.oneWays.forEach((r) => w.oneWays.push(new Box(r.x + offset, r.y, r.w, 18)));
    // Escaleras a la altura exacta del muro o plataforma que tienen al lado (Juan): en los datos de Sigrun algunas
    // sobresalían 60 por encima y otra quedaba 30 corta. Se ajusta el extremo de arriba; el de abajo no cambia.
    seg.ladders.forEach((r) => {
      const bordes = [...seg.solids, ...seg.oneWays.map((o) => ({ x: o.x, y: o.y, w: o.w }))]
        .filter((b) => b.x - 40 <= r.x + r.w && b.x + b.w + 40 >= r.x && b.y >= r.y - 80 && b.y <= r.y + r.h - 20);
      const L = box(r);
      if (bordes.length) {
        const top = bordes.reduce((m, b) => (Math.abs(b.y - r.y) < Math.abs(m.y - r.y) ? b : m)).y;
        L.h += L.y - top; L.y = top;
      }
      w.ladders.push(L);
    });
    seg.hazards.forEach((r) => w.hazards.push(box(r)));
    seg.moving.forEach((m) => w.moving.push(new MovingPlatform(m.x + offset, m.y, m.w, m.axisX,
      m.min + (m.axisX ? offset : 0), m.max + (m.axisX ? offset : 0), m.speed, m.elevator, m.pause)));
    seg.crumbles.forEach((r) => w.crumbles.push(new Crumble(r.x + offset, r.y, r.w, r.h)));
    seg.ramps.forEach((r) => {
      const [ax, ay, bx, by] = r.x1 <= r.x2 ? [r.x1, r.y1, r.x2, r.y2] : [r.x2, r.y2, r.x1, r.y1];
      w.ramps.push(new Ramp(ax + offset, ay, bx + offset, by, r.slide));
    });
    seg.lasers.forEach((l) => w.lasers.push(new Laser(l.x + offset, l.y, l.h, l.period, l.on, l.offset, l.fire, l.ceiling)));
    seg.keys.forEach((k) => w.keys.push(new KeyItem(k.id, k.x + offset, k.y)));
    seg.doors.forEach((d) => w.doors.push(new Door(d.key, d.rect.x + offset, d.rect.y, d.rect.w, d.rect.h)));
    seg.targets.forEach((t) => w.targets.push(new Target(t.rect.x + offset, t.rect.y, t.rect.w, t.rect.h, t.hp)));
    seg.barriers.forEach((r) => w.barriers.push(new Barrier(r.x + offset, r.y, r.w, r.h)));
    seg.springs.forEach((s) => w.springs.push(new Spring(s.x + offset, s.y, s.power)));
    seg.backs.forEach((r) => w.backs.push(box(r)));
    seg.props.forEach((p) => w.props.push({ id: p.id, x: p.x + offset, y: p.y, scale: p.scale, flip: p.flip }));
    seg.gravityZones.forEach((z) => w.gravityZones.push(new GravityZone(z.rect.x + offset, z.rect.y, z.rect.w, z.rect.h, z.lift)));
    seg.breakables.forEach((b) => w.breakables.push(new Breakable(b.rect.x + offset, b.rect.y, b.rect.w, b.rect.h, b.hp)));
    seg.autoDoors.forEach((r) => w.autoDoors.push(new AutoDoor(r.x + offset, r.y, r.w, r.h)));
    seg.shocks.forEach((h) => w.shocks.push(new Shock(h.x + offset, h.y, h.w, h.period, h.on, h.offset)));
    seg.windows.forEach((r) => w.windows.push(box(r)));
    seg.ducts.forEach((r) => w.ducts.push(box(r)));
    seg.conveyors.forEach((c) => w.conveyors.push(new Conveyor(c.x + offset, c.y, c.w, c.speed)));
    seg.guillotines.forEach((g) => w.guillotines.push(new Guillotine(g.x + offset, g.top, g.bottom, g.w, g.period, g.offset)));
    seg.saws.forEach((v) => w.saws.push(new Saw(v.x + offset, v.y, v.r, v.axisX, v.min + (v.axisX ? offset : 0), v.max + (v.axisX ? offset : 0), v.speed)));
    seg.meteors.forEach((m) => w.meteors.push(new Meteor(m.x + offset, m.period, m.offset, m.dir)));
    if (seg.checkpoint) w.checkpoints.push(new Checkpoint(seg.checkpoint.x + offset, seg.checkpoint.y, seg.checkpoint.w, seg.checkpoint.h));
    if (seg.goal) w.goal = box(seg.goal);
    if (segIndex === 0 && seg.spawnX !== null) { w.spawnX = seg.spawnX + offset; w.spawnY = seg.spawnY ?? w.spawnY; }
    seg.pickups.forEach((p) => w.pickupSpawns.push(new Pickup(p.type, p.x + offset, p.y)));
    seg.tips.forEach((t) => w.tips.push({ x: t.x + offset, text: t.text }));
    if (bossDef && seg.bossX !== null && !w.bossSpawn) {
      const gate = seg.bossGate ? box(seg.bossGate) : null;
      const right = (gate ? gate.x : offset + seg.width) - bossDef.w - 20;
      const floor = seg.solids[0]?.y ?? 660;
      w.bossSpawn = { def: bossDef, x: seg.bossX + offset, y: floor - bossDef.h, min: offset + 140, max: right, dir: -1 };
      if (gate) { gate.y -= K.GATE_EXTRA_UP; gate.h += K.GATE_EXTRA_UP; w.bossGate = gate; w.solids.push(gate); }
      const pd = bossDef.partner ? data.enemies[bossDef.partner] : null;
      if (pd) {
        const px = (seg.partnerX ?? (seg.bossX - 320)) + offset;
        w.partnerSpawn = { def: pd, x: px, y: floor - pd.h, min: offset + 140, max: (gate ? gate.x : offset + seg.width) - pd.w - 20, dir: -1 };
      }
    }
    // Huecos de enemigo: el nivel decide qué tipo ocupa cada hueco (enemySet) y la proporción (enemyDensity).
    for (const slot of seg.enemies) {
      slotIndex++;
      const fixed = slot.id ? data.enemies[slot.id] : null;
      if (fixed) {
        const y = slot.kind === 'AIR' ? slot.y : slot.y - fixed.h;
        w.enemySpawns.push({ def: fixed, x: slot.x + offset, y, min: slot.rangeMin + offset, max: slot.rangeMax + offset,
          dir: slotIndex % 2 === 0 ? -1 : 1, sleep: slot.sleep });
        continue;
      }
      const pool = level.enemySet[slot.kind] || [];
      if (!pool.length) continue;
      if (hash01(level.levelId, slotIndex) >= level.enemyDensity) continue;
      const n = slotCounters[slot.kind] ?? 0;
      slotCounters[slot.kind] = n + 1;
      const def = data.enemies[pool[n % pool.length]];
      if (!def) continue;
      const y = slot.kind === 'AIR' ? slot.y : slot.y - def.h;
      w.enemySpawns.push({ def, x: slot.x + offset, y, min: slot.rangeMin + offset, max: slot.rangeMax + offset, dir: n % 2 === 0 ? -1 : 1 });
    }
    offset += seg.width;
  });
  level.unlockDuringLevel.forEach((p) => w.pickupSpawns.push(new Pickup(p.type, p.x, p.y)));
  w.width = offset;
  if (!w.goal) w.goal = new Box(offset - 120, 560, 60, 100);
  w.solids.push(...w.crumbles, ...w.doors, ...w.barriers, ...w.autoDoors, ...w.conveyors, ...w.breakables);
  w.tips.sort((a, b) => a.x - b.x);
  w.isDynamicSolid = (b) => b instanceof Door || b instanceof Barrier || b instanceof Crumble || b instanceof AutoDoor || b instanceof Conveyor || b instanceof Breakable;
  w.resetDynamic = () => {
    const add = (b) => { if (!w.solids.includes(b)) w.solids.push(b); };
    w.crumbles.forEach((c) => { c.restore(); add(c); });
    w.keys.forEach((k) => { k.taken = false; });
    w.doors.forEach((d) => { d.open = 0; d.opening = false; add(d); });
    w.targets.forEach((t) => { t.hp = t.maxHp; t.dead = false; t.flash = 0; });
    w.barriers.forEach((b) => { b.off = 0; b.disabled = false; add(b); });
    w.autoDoors.forEach((d) => d.reset());
    w.breakables.forEach((b) => { b.restore(); add(b); });
  };
  // Objetos (props) apoyados sobre lo que tienen debajo (Juan: estandartes y columnas flotaban en los pasillos).
  // Se busca la superficie (sólido o plataforma fina) bajo el pie del objeto, desde 60 arriba hasta 260 abajo.
  for (const pr of w.props) {
    let tope = null;
    for (const b of [...w.solids, ...w.oneWays]) {
      if (pr.x < b.x + 4 || pr.x > b.x + b.w - 4 || b.y < pr.y - 60 || b.y > pr.y + 260) continue;
      if (tope === null || b.y < tope) tope = b.y;
    }
    if (tope !== null) pr.y = tope;
  }
  return w;
}
