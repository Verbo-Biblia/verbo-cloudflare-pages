// Entrada: teclado y controles táctiles (palanca + botones), convertidos al InputFrame del motor.
// La palanca copia el enfoque de Camino al Cielo (#stick / #knob, clase «tactil» con pointer:coarse).
import { ControlsConfig } from './config.js';

export const touchScreen = matchMedia('(pointer:coarse)').matches;

const held = { left: false, right: false, up: false, down: false, jump: false, shoot: false, dash: false, detonate: false };
const stick = { x: 0, y: 0 };
let prev = { jump: false, shoot: false, dash: false, detonate: false };

const CODES = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyK: 'jump', KeyX: 'shoot', KeyJ: 'shoot', KeyC: 'dash', KeyL: 'dash', KeyV: 'detonate', KeyI: 'detonate',
};

export function initControls(onPause) {
  onPauseRef = onPause;
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' || e.code === 'KeyP') { onPause(); return; }
    const k = CODES[e.code];
    if (k) { e.preventDefault(); held[k] = true; }
  });
  document.addEventListener('keyup', (e) => { const k = CODES[e.code]; if (k) held[k] = false; });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

  // Botones táctiles
  document.querySelectorAll('[data-btn]').forEach((b) => {
    const k = b.dataset.btn;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); held[k] = true; b.classList.add('on'); if (k === 'jump') navigator.vibrate?.(12); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => { held[k] = false; b.classList.remove('on'); });
  });

  // Palanca: vector normalizado con zona muerta (como TouchControls.kt)
  const base = document.querySelector('#stick'), knob = document.querySelector('#knob');
  let id = null;
  const aim = (e) => {
    const r = base.getBoundingClientRect(), max = r.width * 0.36;
    let dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
    const d = Math.hypot(dx, dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const nx = dx / max, ny = dy / max, len = Math.hypot(nx, ny), dz = ControlsConfig.JOYSTICK_DEADZONE;
    if (len > dz) { const s = Math.min(1, (len - dz) / (1 - dz)) / len; stick.x = nx * s; stick.y = ny * s; }
    else { stick.x = 0; stick.y = 0; }
  };
  const release = (e) => { if (e.pointerId !== id) return; id = null; base.classList.remove('activo'); knob.style.transform = ''; stick.x = 0; stick.y = 0; };
  base.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; base.setPointerCapture(id); base.classList.add('activo'); aim(e); });
  base.addEventListener('pointermove', (e) => { if (e.pointerId === id) aim(e); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) base.addEventListener(ev, release);
}

// ------------------------------------------------------------------ joystick (Gamepad API, mapeo estándar)
// A = saltar (salto de fe / alas de águila) · X = Espada del Espíritu · B o RB = calzado del evangelio ·
// Y o LB = espada de fuego · palanca izquierda o cruceta = mover · START = pausa.
const pad = { x: 0, y: 0, jump: false, shoot: false, dash: false, detonate: false, start: false };
let startPrev = false, onPauseRef = null;
function leerJoystick() {
  pad.x = 0; pad.y = 0; pad.jump = pad.shoot = pad.dash = pad.detonate = pad.start = false;
  const lista = navigator.getGamepads?.() ?? [];
  for (const g of lista) {
    if (!g || !g.connected) continue;
    const b = (i) => !!g.buttons[i]?.pressed;
    let x = g.axes[0] ?? 0, y = g.axes[1] ?? 0;
    const len = Math.hypot(x, y), dz = 0.22;
    if (len < dz) { x = 0; y = 0; } else { const s = Math.min(1, (len - dz) / (1 - dz)) / len; x *= s; y *= s; }
    if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1;
    if (Math.abs(x) > Math.abs(pad.x)) pad.x = x;
    if (Math.abs(y) > Math.abs(pad.y)) pad.y = y;
    pad.jump ||= b(0); pad.shoot ||= b(2); pad.dash ||= b(1) || b(5) || b(7); pad.detonate ||= b(3) || b(4) || b(6); pad.start ||= b(9);
  }
  if (pad.start && !startPrev) onPauseRef?.();
  startPrev = pad.start;
}
let menuPrev = {};
/** Para menús y escenas: flancos de A, B, START y la cruceta/palanca (arriba/abajo/izquierda/derecha). */
export function joystickMenu() {
  leerJoystick();
  const lista = [...(navigator.getGamepads?.() ?? [])].filter((g) => g?.connected);
  const ahora = { a: false, b: false, arriba: pad.y < -0.6, abajo: pad.y > 0.6, izq: pad.x < -0.6, der: pad.x > 0.6 };
  for (const g of lista) { ahora.a ||= !!g.buttons[0]?.pressed; ahora.b ||= !!g.buttons[1]?.pressed; }
  const flanco = {}; for (const k in ahora) flanco[k] = ahora[k] && !menuPrev[k];
  menuPrev = ahora;
  return flanco;
}
export const joystickConectado = () => [...(navigator.getGamepads?.() ?? [])].some((g) => g?.connected);

/** Lee el estado actual y devuelve un InputFrame (con flancos de pulsación). */
export function readInput() {
  leerJoystick();
  const kx = (held.right ? 1 : 0) - (held.left ? 1 : 0), ky = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  let moveX = kx, moveY = ky;
  if (kx === 0 && ky === 0) { moveX = stick.x || pad.x; moveY = stick.y || pad.y; }
  else if (kx !== 0 && ky !== 0) { moveX = kx * 0.7071; moveY = ky * 0.7071; }   // diagonal de teclado (apuntar a 45°)
  const jump = held.jump || pad.jump, shoot = held.shoot || pad.shoot, dash = held.dash || pad.dash, detonate = held.detonate || pad.detonate;
  const f = {
    moveX, moveY,
    jumpHeld: jump, jumpPressed: jump && !prev.jump,
    shootHeld: shoot, shootPressed: shoot && !prev.shoot,
    dashPressed: dash && !prev.dash,
    detonateHeld: detonate, detonateReleased: !detonate && prev.detonate, detonatePressed: detonate && !prev.detonate,
  };
  prev = { jump, shoot, dash, detonate };
  return f;
}
export function clearInput() { for (const k in held) held[k] = false; stick.x = 0; stick.y = 0; }

// ------------------------------------------------------------------ sonido (assets/audio/sfx/*.ogg)
let audioOn = true;
// Igual que VERSION_AUDIO en principal.js: cambiarla cuando cambien los sonidos.
const VERSION_SFX = '2026-10-31b';
const pools = {};
export function setSound(on) { audioOn = on; }
// Voces de los poderes con Web Audio (Juan: la primera vez no sonaba): ya decodificadas en memoria, suenan al instante
// y cada vez; si se repite antes de acabar, la anterior se corta y vuelve a empezar.
const ctxVoz = new (window.AudioContext || window.webkitAudioContext)();
const voces = {}, vocesActivas = {};
const despertar = () => { if (ctxVoz.state === 'suspended') ctxVoz.resume().catch(() => {}); };
for (const ev of ['keydown', 'pointerdown', 'touchstart']) addEventListener(ev, despertar, { capture: true });
export function precargarVoces(ids) {
  for (const id of ids) fetch(`assets/audio/sfx/${id}.ogg?v=${VERSION_SFX}`).then((r) => r.arrayBuffer()).then((b) => ctxVoz.decodeAudioData(b)).then((buf) => { voces[id] = buf; }).catch(() => {});
}
export function voz(id, volume = 1) {
  if (!audioOn) return;
  const buf = voces[id];
  if (!buf) { sfx(id, volume); return; }
  despertar();
  try { vocesActivas[id]?.stop(); } catch { /* ya terminó */ }
  const s = ctxVoz.createBufferSource(), g = ctxVoz.createGain();
  s.buffer = buf; g.gain.value = volume; s.connect(g).connect(ctxVoz.destination); s.start();
  vocesActivas[id] = s;
}
/** Carga sonidos de antemano para que suenen al instante la primera vez (voces de los poderes). */
export function precargarSfx(ids) {
  for (const id of ids) pools[id] ??= Array.from({ length: 4 }, () => { const a = new Audio(`assets/audio/sfx/${id}.ogg?v=${VERSION_SFX}`); a.preload = 'auto'; return a; });
}
export function sfx(id, volume = 1, rate = 1) {
  if (!audioOn) return;
  const pool = pools[id] ??= Array.from({ length: 4 }, () => { const a = new Audio(`assets/audio/sfx/${id}.ogg?v=${VERSION_SFX}`); a.preload = 'auto'; return a; });
  const a = pool.find((s) => s.paused || s.ended) ?? pool[0];
  try { a.pause(); a.currentTime = 0; a.volume = Math.min(1, Math.max(0, volume)); a.playbackRate = rate; a.play().catch(() => {}); } catch { /* sin sonido */ }
}
/** Corta un sonido que esté sonando (por ejemplo, la carga de la Oración al soltar o cancelar). */
export function sfxStop(id) { for (const a of pools[id] ?? []) { try { a.pause(); a.currentTime = 0; } catch { /* nada */ } } }
