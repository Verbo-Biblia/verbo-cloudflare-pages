// Carga del contenido data-driven (port de data/GameData.kt). Mismos archivos JSON que la app de Android.

const BASE = 'assets/data/';
const LEVEL_FILES = Array.from({ length: 10 }, (_, i) => `c01_l${i + 1}.json`);

async function json(path) {
  const r = await fetch(BASE + path, { cache: 'no-cache' });  // siempre los datos al día (Juan veía niveles viejos)
  if (!r.ok) throw new Error(`No se pudo cargar ${path} (${r.status})`);
  return r.json();
}

// ---- traducción por texto exacto en español (data/I18n.kt)
let enTable = {};
export let lang = 'es';
export function setLang(l) { lang = l === 'en' ? 'en' : 'es'; }
export function tr(text, ...args) {
  let s = lang === 'en' ? (enTable[text] ?? text) : text;
  args.forEach((a, i) => { s = s.split(`{${i}}`).join(String(a)); });
  return s;
}

// ---- ayudantes de parseo (mismos valores por omisión que el Kotlin)
const f = (o, k, d) => (o && o[k] !== undefined && o[k] !== null ? Number(o[k]) : d);
const rects = (arr) => (arr || []).map((a) => ({ x: +a[0], y: +a[1], w: +a[2], h: a.length > 3 ? +a[3] : 18 }));
const rectOrNull = (a) => (a ? { x: +a[0], y: +a[1], w: a.length > 2 ? +a[2] : 20, h: a.length > 3 ? +a[3] : 70 } : null);
const objs = (arr) => arr || [];

function parseSegments(root) {
  const out = {};
  for (const [id, o] of Object.entries(root.segments || {})) {
    out[id] = {
      id,
      width: f(o, 'width', 400),
      requires: o.requires || [],
      solids: rects(o.solids),
      oneWays: rects(o.oneWays),
      ladders: rects(o.ladders),
      hazards: rects(o.hazards),
      moving: objs(o.moving).map((m) => ({
        x: f(m, 'x', 0), y: f(m, 'y', 0), w: f(m, 'w', 130), axisX: (m.axis ?? 'x') === 'x',
        min: f(m, 'min', 0), max: f(m, 'max', 0), speed: f(m, 'speed', 80), elevator: !!m.elevator, pause: f(m, 'pause', 0),
      })),
      enemies: objs(o.enemies).map((e) => {
        const x = f(e, 'x', 0);
        const range = e.range;
        return {
          kind: (e.kind ?? 'ground').toUpperCase(), x, y: f(e, 'y', 660),
          rangeMin: range ? +range[0] : x, rangeMax: range ? +range[1] : x, id: e.id || null, sleep: !!e.sleep,
        };
      }),
      pickups: objs(o.pickups).map((p) => ({ type: p.type, x: f(p, 'x', 0), y: f(p, 'y', 0) })),
      checkpoint: rectOrNull(o.checkpoint),
      goal: rectOrNull(o.goal),
      spawnX: o.spawn ? +o.spawn[0] : null,
      spawnY: o.spawn ? +o.spawn[1] : null,
      tips: objs(o.tips).map((t) => ({ x: f(t, 'x', 0), text: tr(t.text) })),
      bossX: o.bossX !== undefined ? +o.bossX : null,
      bossGate: rectOrNull(o.bossGate),
      crumbles: rects(o.crumbles),
      ramps: objs(o.ramps).map((r) => ({ x1: f(r, 'x1', 0), y1: f(r, 'y1', 0), x2: f(r, 'x2', 0), y2: f(r, 'y2', 0), slide: r.slide ?? true })),
      lasers: objs(o.lasers).map((l) => ({
        x: f(l, 'x', 0), y: f(l, 'y', 660), h: f(l, 'h', 200), period: f(l, 'period', 2.6), on: f(l, 'on', 0.9),
        offset: f(l, 'offset', 0), fire: !!l.fire, ceiling: !!l.ceiling,
      })),
      keys: objs(o.keys).map((k) => ({ id: k.id, x: f(k, 'x', 0), y: f(k, 'y', 0) })),
      doors: objs(o.doors).map((d) => ({ key: d.key, rect: rectOrNull(d.rect) })),
      targets: objs(o.targets).map((t) => ({ rect: rectOrNull(t.rect), hp: t.hp ?? 8 })),
      barriers: rects(o.barriers),
      backs: rects(o.backs),
      springs: objs(o.springs).map((s) => ({ x: f(s, 'x', 0), y: f(s, 'y', 660), power: f(s, 'power', 1300) })),
      props: objs(o.props).map((p) => ({ id: p.id, x: f(p, 'x', 0), y: f(p, 'y', 660), scale: f(p, 's', 0.34), flip: !!p.flip })),
      gravityZones: objs(o.gravityZones).map((z) => ({ rect: rectOrNull(z.rect), lift: f(z, 'lift', 2600) })),
      breakables: objs(o.breakables).map((b) => ({ rect: rectOrNull(b.rect), hp: b.hp ?? 4 })),
      partnerX: o.partnerX !== undefined ? +o.partnerX : null,
      guillotines: objs(o.guillotines).map((g) => ({ x: f(g, 'x', 0), top: f(g, 'top', 380), bottom: f(g, 'bottom', 660), w: f(g, 'w', 64), period: f(g, 'period', 2.8), offset: f(g, 'offset', 0) })),
      saws: objs(o.saws).map((w) => {
        const x = f(w, 'x', 0), y = f(w, 'y', 600), axisX = (w.axis ?? 'x') === 'x';
        return { x, y, r: f(w, 'r', 28), axisX, min: f(w, 'min', axisX ? x : y), max: f(w, 'max', axisX ? x : y), speed: f(w, 'speed', 0) };
      }),
      autoDoors: rects(o.autoDoors),
      shocks: objs(o.shocks).map((h) => ({ x: f(h, 'x', 0), y: f(h, 'y', 660), w: f(h, 'w', 120), period: f(h, 'period', 3), on: f(h, 'on', 1), offset: f(h, 'offset', 0) })),
      windows: rects(o.windows),
      ducts: rects(o.ducts),
      conveyors: objs(o.conveyors).map((c) => ({ x: f(c, 'x', 0), y: f(c, 'y', 660), w: f(c, 'w', 200), speed: f(c, 'speed', 160) })),
      meteors: objs(o.meteors).map((m) => ({ x: f(m, 'x', 0), period: f(m, 'period', 6), offset: f(m, 'offset', 0), dir: (m.dir ?? -1) >= 0 ? 1 : -1 })),
    };
  }
  return out;
}

function parseCampaign(root) {
  const cid = root.campaignId;
  const levels = root.levels.map((o) => ({
    campaignId: cid,
    levelId: o.levelId,
    levelNumber: o.levelNumber,
    title: tr(o.title ?? `NIVEL ${o.levelNumber}`),
    backgroundId: o.backgroundId,
    environmentType: o.environmentType ?? '',
    environmentName: tr(o.environmentName ?? ''),
    unlockOnStart: o.unlockOnStart || [],
    unlockDuringLevel: (o.unlockDuringLevel || []).map((p) => ({ type: 'ability:' + p.ability, x: f(p, 'x', 0), y: f(p, 'y', 0) })),
    unlockOnComplete: o.unlockOnComplete || [],
    objectives: (o.objectives || []).map((x) => ({ type: x.type, id: x.id || null, label: tr(x.label ?? '') })),
    musicTrack: o.musicTrack || null,
    bossId: o.bossId || null,
    segments: o.segments,
    enemySet: Object.fromEntries(Object.entries(o.enemySet || {}).map(([k, v]) => [k.toUpperCase(), v])),
    enemyDensity: f(o, 'enemyDensity', 1),
    midgroundId: o.midground || null,
    midgroundH: f(o, 'midgroundH', 300),
    midgroundBase: f(o, 'midgroundBase', 668),
    shotCostMult: f(o, 'shotCostMult', 1),
    ambient: o.ambient || [],
    startKeys: o.startKeys || [],
    bossDrop: o.bossDrop ? tr(o.bossDrop) : null,
    // Historia y radio (fase 3).
    narrativeBefore: o.narrativeBefore || null, narrativeAfter: o.narrativeAfter || null,
    narrativeBoss: o.narrativeBoss || null, narrativeBossDefeated: o.narrativeBossDefeated || null,
    radio: (o.radio || []).map((r) => ({ id: r.id, segment: r.segment ?? null, on: r.on ?? null })),
    isCampaignFinal: !!o.isCampaignFinal, galleryUnlocks: o.galleryUnlocks || [],
  })).sort((a, b) => a.levelNumber - b.levelNumber);
  return { id: cid, title: tr(root.title ?? cid), startAbilities: root.startAbilities || [], levels };
}

export async function loadGameData() {
  try { enTable = await json('i18n/en.json'); } catch { enTable = {}; }
  const abilitiesRoot = await json('abilities.json');
  const abilities = {};
  for (const o of abilitiesRoot.abilities) {
    abilities[o.id] = { id: o.id, name: tr(o.name ?? o.id), hint: tr(o.hint ?? ''), energyCost: o.energyCost, cooldown: o.cooldown ?? 0, requiresAbility: o.requiresAbility || null };
  }
  const enemiesRoot = await json('enemies.json');
  const enemies = {};
  for (const o of enemiesRoot.enemies) {
    enemies[o.id] = {
      id: o.id, name: tr(o.name ?? o.id.toUpperCase()), behavior: o.behavior.toUpperCase(), hp: o.hp,
      speed: f(o, 'speed', 0), w: f(o, 'w', 34), h: f(o, 'h', 45), piloted: !!o.piloted,
      shotInterval: f(o, 'shotInterval', 1.05), bulletSpeed: f(o, 'bulletSpeed', 340), bulletDamage: f(o, 'bulletDamage', 1),
      bulletColor: o.bulletColor || '#ff7e73', firstShotDelay: f(o, 'firstShotDelay', 0.5), partner: o.partner || null,
      minions: o.minions || [], minionInterval: f(o, 'minionInterval', 7), minionMax: o.minionMax ?? 2,
      squad: o.squad || null, squadInterval: f(o, 'squadInterval', 14), squadMin: o.squadMin ?? 3, squadMax: o.squadMax ?? 4,
      introTitle: o.introTitle ? tr(o.introTitle) : null,
    };
  }
  const segments = parseSegments(await json('segments.json'));
  for (const file of LEVEL_FILES) {
    try { Object.assign(segments, parseSegments(await json('levels/' + file))); } catch (e) { console.warn(e.message); }
  }
  const index = await json('campaigns/index.json');
  const campaigns = [];
  for (const file of index.campaigns) campaigns.push(parseCampaign(await json('campaigns/' + file)));
  // Entrenamiento (nivel aparte con todos los poderes; se abre con ENTRENAMIENTO en el menú).
  let tutorial = null;
  try { tutorial = parseCampaign(await json('campaigns/tutorial.json')).levels[0]; } catch (e) { console.warn(e.message); }
  // Historia del idioma activo (si falta, la de español).
  let story;
  try { story = await json(`story/campaign01.${lang}.json`); } catch { story = await json('story/campaign01.es.json'); }
  const mediaRoot = await json('media_catalog.json');
  const media = Object.fromEntries(mediaRoot.media.map((m) => [m.mediaId, m.path]));
  return {
    abilities, enemies, segments, campaigns, media, story, tutorial,
    campaign: (id) => campaigns.find((c) => c.id === id),
    abilityName: (id) => abilities[id]?.name ?? id,
  };
}
