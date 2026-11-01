// Arranque y flujo de la versión web (port de AppFlow.kt + ui/GameScreen.kt): título → niveles → escena previa →
// nivel (radio y escenas de jefe encima del juego) → resultado → escena posterior → poderes nuevos → niveles.
import { GameConfig, VELOCIDAD } from './config.js';
import { loadGameData, tr, setLang, lang } from './datos.js';
import { GameSession, PlayerAbilities } from './sesion.js';
import { WorldRenderer } from './escenario.js';
import { initControls, readInput, clearInput, sfx, sfxStop, setSound, touchScreen, joystickMenu, precargarSfx, precargarVoces, voz } from './controles.js';
import { Historia, Radio, escena } from './historia.js';
import { Progreso, ajustes } from './progreso.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#juego'), g = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
if (params.has('todo')) window.PRUEBA_TODO = true;
let data, progreso, historia, radio, session = null, renderer = null, mode = 'menu', last = 0, nivelActual = null;
let pantalla = 'titulo';

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}
window.addEventListener('resize', resize);

const campana = () => data.campaign(GameConfig.DEFAULT_CAMPAIGN);
const sonido = (id, v = 1, r = 1) => (id.startsWith('voz_') ? voz(id, v) : sfx(id, v, r));
const ruta = (mediaId) => (data.media[mediaId] ? 'assets/' + data.media[mediaId] : null);

// ------------------------------------------------------------------ música
// Subir VERSION_AUDIO cada vez que cambie la música o los sonidos (Juan seguía oyendo la música vieja guardada).
export const VERSION_AUDIO = '2026-10-31b';
const musica = new Audio(); musica.loop = true; let pistaActual = null;
function tocarMusica(id) {
  const vol = ajustes.get('musica', 55) / 100;
  musica.volume = vol;
  if (!id || id === pistaActual) { if (vol > 0 && musica.paused && pistaActual) musica.play().catch(() => {}); return; }
  const src = ruta(id);
  pistaActual = id;
  if (!src) { musica.pause(); return; }
  musica.src = src + '?v=' + VERSION_AUDIO;  // la versión obliga al navegador a bajar la música nueva
  if (vol > 0) musica.play().catch(() => {});
}

// ------------------------------------------------------------------ pantallas
const PANELES = ['#menu', '#niveles', '#ajustes', '#pausa-menu', '#fin'];
function mostrar(id) { for (const p of PANELES) $(p).classList.toggle('oculto', p !== id); pantalla = id; }

function traducirInterfaz() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = tr(el.dataset.t);
  for (const b of document.querySelectorAll('[data-lang]')) b.classList.toggle('activo', b.dataset.lang === lang);
  document.title = tr('La Armadura de Dios');
  // Logo en el idioma del juego (en inglés: «THE ARMOR OF GOD», Codex pedido 017).
  const logo = $('#titulo-logo'); if (logo) { logo.src = lang === 'en' ? 'assets/ui/logo-en.webp' : 'assets/ui/logo.webp'; logo.alt = tr('La Armadura de Dios'); }
}

function titulo() {
  mode = 'menu'; session = null; radio.reiniciar(null);
  tocarMusica('music_menu');
  const empezada = progreso.empezada(campana());
  $('#jugar').textContent = empezada ? tr('CONTINUAR') : tr('JUGAR');
  $('#nueva-partida').classList.toggle('oculto', !empezada);
  $('#nueva-partida').textContent = tr('NUEVA PARTIDA'); nuevaHasta = 0;
  mostrar('#menu');
}

function niveles(destacar) {
  mode = 'menu'; session = null; radio.reiniciar(null);
  tocarMusica('music_menu');
  const c = campana(), sug = destacar ?? progreso.sugerido(c);
  $('#niveles-titulo').textContent = c.title;
  const lista = $('#lista-niveles'); lista.innerHTML = '';
  for (const l of c.levels) {
    const b = document.createElement('button');
    b.className = 'nivel' + (progreso.completado(l) ? ' hecho' : '') + (sug && l.levelNumber === sug.levelNumber ? ' sugerido' : '');
    b.disabled = !progreso.desbloqueado(l);
    const [lugar, nombre] = l.title.split(' · ');
    b.innerHTML = `<b>${l.levelNumber}</b><span>${nombre ?? lugar}</span><span style="color:#93a3ba">${nombre ? lugar : ''}</span>`;
    b.onclick = () => { sonido('ui_click'); fullScreen(); empezarNivel(l); };
    lista.append(b);
  }
  mostrar('#niveles');
}

function abrirAjustes(volver) {
  $('#aj-sonido').checked = ajustes.get('sonido', true);
  $('#aj-musica').value = ajustes.get('musica', 55);
  $('#aj-volver').onclick = () => { sonido('ui_back'); volver(); };
  mostrar('#ajustes');
}

async function cambiarIdioma(nuevo) {
  if (nuevo === lang) return;
  setLang(nuevo); ajustes.set('idioma', nuevo); try { localStorage.setItem('verbo:uiLang', nuevo); } catch { /* nada */ }
  data = await loadGameData();
  progreso.setData(data); historia.data = data; radio.data = data;
  traducirInterfaz();
  if (pantalla === '#niveles') niveles(); else if (pantalla === '#menu') titulo();
}

// ------------------------------------------------------------------ escenas
function fondoDelNivel(level) { return level ? ruta(level.backgroundId) : null; }

/** Muestra una escena si existe; si no, sigue sin error (AppFlow.narrative). Pausa el juego mientras dura. */
function narrativa(ids, level, despues) {
  const pasos = escena(data, ids);
  if (!pasos) return despues();
  const antes = mode; mode = 'historia'; clearInput();
  historia.reproducir(pasos, fondoDelNivel(level), () => { mode = antes; clearInput(); despues(); });
}

// ------------------------------------------------------------------ nivel
function empezarNivel(level) {
  if (!progreso.empezada(campana())) progreso.nuevaPartida(campana());
  for (const p of PANELES) $(p).classList.add('oculto');
  narrativa(level.narrativeBefore, level, () => lanzar(level));
}

function lanzar(level) {
  nivelActual = level;
  const abilities = new PlayerAbilities(data, level.campaignId === 'tutorial' ? level.unlockOnStart : progreso.habilidadesPara(level));
  session = new GameSession(level, data, abilities, {
    sfx: sonido,
    sfxStop,
    onLevelComplete: (stats) => nivelCompletado(level, stats),
    onGameOver: () => sinVidas(),
    onAbilityGranted: (id) => { progreso.ganarEnNivel(level, id); actualizarBotones(); },
    onBossIntro: () => { if (level.narrativeBoss) narrativa(level.narrativeBoss, level, () => {}); },
    onBossDefeated: () => { if (level.narrativeBossDefeated) narrativa(level.narrativeBossDefeated, level, () => {}); },
    onRadio: (on) => radio.evento(on),
  });
  renderer = new WorldRenderer(level, data);
  radio.reiniciar(level);
  $('#titulo-nivel').textContent = level.title;
  actualizarBotones();
  for (const p of PANELES) $(p).classList.add('oculto');
  pantalla = 'juego';
  clearInput(); mode = 'play';
  tocarMusica(level.musicTrack);
  window.__juego = { session, data, flujo: { titulo, niveles, empezarNivel, lanzar, historia, radio, progreso, modo: () => mode } };
}

function actualizarBotones() {
  document.body.classList.toggle('con-dash', session.abilities.canUse('dash_propulsion'));
  document.body.classList.toggle('con-deton', session.abilities.canUse('detonation'));
}

function fullScreen() {
  if (!touchScreen || document.fullscreenElement) return;
  try { document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); } catch { /* sin pantalla completa */ }
}

function botonesFin(cuales) {
  for (const id of ['adelante', 'seguir', 'repetir', 'salir']) $('#fin-' + id).classList.toggle('oculto', !cuales.includes(id));
}

/** Resultado → escena posterior → poderes nuevos → selección de niveles (AppFlow.levelCompleted). */
function nivelCompletado(level, stats) {
  mode = 'end'; radio.ocultar();
  if (level.campaignId === 'tutorial') {
    $('#fin-titulo').textContent = tr('ENTRENAMIENTO SUPERADO');
    $('#fin-texto').textContent = tr('Ya conoces la armadura: Espada del Espíritu, Salto de fe, Alas de águila y Calzado del evangelio.');
    $('#fin-recompensas').textContent = '';
    botonesFin(['adelante']);
    $('#fin-adelante').onclick = () => { sonido('ui_click'); $('#fin').classList.add('oculto'); titulo(); };
    mostrar('#fin');
    return;
  }
  const r = progreso.completar(level);
  $('#fin-titulo').textContent = tr('NIVEL COMPLETADO');
  $('#fin-texto').textContent = `${tr('Tiempo')}: ${Math.round(stats.time)} s · ${tr('Enemigos')}: ${stats.kills}/${stats.totalEnemies}`;
  $('#fin-recompensas').textContent = level.bossDrop ? tr('RECUPERADO: {0}', level.bossDrop) : '';
  botonesFin(['adelante']);
  $('#fin-adelante').onclick = () => {
    sonido('ui_click');
    $('#fin').classList.add('oculto');
    narrativa(level.narrativeAfter, level, () => poderes(r));
  };
  mostrar('#fin');
}

function poderes(r) {
  if (!r.nuevas.length) return r.campanaTerminada ? titulo() : niveles(r.siguiente);
  $('#fin-titulo').textContent = r.nuevas.length > 1 ? tr('RECIBISTE NUEVOS PODERES') : tr('RECIBISTE UN NUEVO PODER');
  $('#fin-texto').textContent = '';
  $('#fin-recompensas').innerHTML = '';
  for (const a of r.nuevas) {
    const d = document.createElement('div');
    d.textContent = tr('RECIBISTE EL PODER: {0}', data.abilityName(a).toUpperCase());
    const s = document.createElement('small'); s.textContent = data.abilities[a]?.hint ?? ''; d.append(document.createElement('br'), s);
    $('#fin-recompensas').append(d);
  }
  botonesFin(['adelante']);
  $('#fin-adelante').onclick = () => { sonido('ui_click'); niveles(r.siguiente); };
  mostrar('#fin');
}

function sinVidas() {
  mode = 'end'; radio.ocultar();
  $('#fin-titulo').textContent = tr('SIN VIDAS');
  $('#fin-texto').textContent = tr('Puedes seguir desde el último punto de control.');
  $('#fin-recompensas').textContent = '';
  botonesFin(['seguir', 'repetir', 'salir']);
  mostrar('#fin');
}

function pause() {
  if (mode === 'historia') { historia.saltar(); return; }
  if (mode === 'play') { mode = 'pause'; mostrar('#pausa-menu'); clearInput(); musica.pause(); }
  else if (mode === 'pause') { mode = 'play'; $('#pausa-menu').classList.add('oculto'); pantalla = 'juego'; tocarMusica(nivelActual?.musicTrack); }
}

// ------------------------------------------------------------------ HUD (DOM encima del canvas)
function hud() {
  const s = session, p = s.player;
  $('#vida').style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
  $('#energia').style.width = `${s.energy.ratio * 100}%`;
  $('#energia').classList.toggle('agotada', s.energy.exhausted);
  $('#vidas').textContent = '♥'.repeat(Math.max(0, p.lives));
  $('#objetivo').textContent = s.objectiveText() ?? '';
  const t = $('#aviso');
  if (s.toastText) { t.textContent = s.toastText; t.classList.add('visible'); } else t.classList.remove('visible');
  const rec = $('#recuperado');
  if (s.recoveredText) { rec.textContent = tr('RECUPERADO: {0}', s.recoveredText); rec.classList.remove('oculto'); } else rec.classList.add('oculto');
}

// Menús con joystick: cruceta para elegir botón, A para aceptar, B para volver. En las escenas, A avanza.
function menuConJoystick() {
  const j = joystickMenu();
  if (mode === 'historia' || historia?.activa) { if (j.a) historia.tocar(); if (j.b) historia.saltar(); return; }
  const panel = PANELES.map((s) => $(s)).find((el) => el && !el.classList.contains('oculto'));
  if (!panel) return;
  const botones = [...panel.querySelectorAll('button')].filter((b) => b.offsetParent !== null && !b.disabled);
  if (!botones.length) return;
  let i = botones.indexOf(document.activeElement);
  if (j.abajo || j.der) { i = (i + 1) % botones.length; botones[i].focus(); }
  else if (j.arriba || j.izq) { i = i <= 0 ? botones.length - 1 : i - 1; botones[i].focus(); }
  else if (j.a) { (i >= 0 ? botones[i] : botones[0]).click(); }
  else if (j.b) { const volver = botones.find((b) => /volver|atr|salir|back/i.test(b.id + b.textContent)); volver?.click(); }
}

function loop(now) {
  const dt = Math.min((now - (last || now)) / 1000, GameConfig.MAX_FRAME_DT);
  last = now;
  if (session) {
    if (mode === 'play') { session.update(dt * VELOCIDAD, readInput()); radio.actualizar(dt, session); }
    else menuConJoystick();
    g.setTransform(1, 0, 0, 1, 0, 0);
    renderer.draw(g, session, canvas.width, canvas.height);
    hud();
  } else {
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#070d16'; g.fillRect(0, 0, canvas.width, canvas.height);
    if (data) menuConJoystick();
  }
  historia?.actualizar();
  document.body.classList.toggle('jugando', mode === 'play' || mode === 'pause');
  document.body.classList.toggle('en-juego', !!session);
  requestAnimationFrame(loop);
}

/** Confirmación sin cuadros del navegador: segundo toque dentro de 3 s. */
// NUEVA PARTIDA desde el título: se toca dos veces (sin ventanas de confirmación del navegador) y empieza del prólogo.
let nuevaHasta = 0;
function nuevaPartida() {
  const ahora = performance.now();
  if (ahora >= nuevaHasta) {
    nuevaHasta = ahora + 3000; $('#nueva-partida').textContent = tr('TOCA OTRA VEZ: SE BORRA TU AVANCE');
    setTimeout(() => { if (nuevaHasta && performance.now() >= nuevaHasta) { nuevaHasta = 0; $('#nueva-partida').textContent = tr('NUEVA PARTIDA'); } }, 3100);
    return;
  }
  nuevaHasta = 0; sonido('ui_click'); fullScreen();
  progreso.nuevaPartida(campana());
  empezarNivel(campana().levels[0]);
}
let borrarHasta = 0;
function confirmarBorrado() {
  const ahora = performance.now();
  if (ahora < borrarHasta) { borrarHasta = 0; $('#aj-borrar').textContent = tr('BORRAR PROGRESO'); return true; }
  borrarHasta = ahora + 3000; $('#aj-borrar').textContent = tr('TOCA OTRA VEZ PARA BORRAR');
  setTimeout(() => { if (borrarHasta) $('#aj-borrar').textContent = tr('BORRAR PROGRESO'); }, 3000);
  return false;
}

async function main() {
  if (touchScreen) document.body.classList.add('tactil');
  resize();
  // Idioma: ?lang=, el elegido en el juego, o el de Verbo (localStorage «verbo:uiLang», el selector ES/EN del sitio).
  let idiomaVerbo = null; try { idiomaVerbo = localStorage.getItem('verbo:uiLang'); } catch { /* sin almacenamiento */ }
  setLang(params.get('lang') ?? ajustes.get('idioma', null) ?? idiomaVerbo ?? 'es');
  setSound(ajustes.get('sonido', true));
  initControls(pause);
  $('#cargando').textContent = 'Cargando…';
  data = await loadGameData();
  progreso = new Progreso(data);
  historia = new Historia(data, sonido);
  radio = new Radio(data, sonido);
  traducirInterfaz();
  $('#cargando').textContent = '';
  $('#jugar').disabled = false;

  $('#jugar').onclick = () => { sonido('ui_click'); fullScreen(); niveles(); };
  $('#nueva-partida').onclick = nuevaPartida;
  $('#entrenar').onclick = () => { sonido('ui_click'); fullScreen(); if (data.tutorial) lanzar(data.tutorial); };
  $('#abrir-ajustes').onclick = () => { sonido('ui_click'); abrirAjustes(titulo); };
  $('#niveles-volver').onclick = () => { sonido('ui_back'); titulo(); };
  for (const b of document.querySelectorAll('[data-lang]')) b.onclick = () => { sonido('ui_click'); cambiarIdioma(b.dataset.lang); };
  $('#aj-sonido').onchange = (e) => { ajustes.set('sonido', e.target.checked); setSound(e.target.checked); };
  $('#aj-musica').oninput = (e) => { ajustes.set('musica', +e.target.value); musica.volume = +e.target.value / 100; if (+e.target.value > 0 && musica.paused && pistaActual) musica.play().catch(() => {}); };
  $('#aj-borrar').onclick = () => { if (confirmarBorrado()) { progreso.borrarTodo(); sonido('ui_back'); titulo(); } };
  $('#fin-repetir').onclick = () => { sonido('ui_click'); fullScreen(); lanzar(nivelActual); };
  $('#fin-seguir').onclick = () => { session.continueFromCheckpoint(); $('#fin').classList.add('oculto'); pantalla = 'juego'; mode = 'play'; };
  $('#fin-salir').onclick = () => { sonido('ui_back'); niveles(nivelActual); };
  $('#pausa').onclick = pause;
  $('#pausa-seguir').onclick = pause;
  $('#pausa-reiniciar').onclick = () => { $('#pausa-menu').classList.add('oculto'); lanzar(nivelActual); };
  $('#pausa-salir').onclick = () => { sonido('ui_back'); niveles(nivelActual); };
  // Escenas: avanzar con toque, clic o teclas de acción; SALTAR con su botón o ESC.
  $('#historia').addEventListener('pointerdown', (e) => { if (e.target.id !== 'historia-saltar') historia.tocar(); });
  $('#historia-saltar').addEventListener('pointerdown', (e) => { e.stopPropagation(); historia.saltar(); });
  document.addEventListener('keydown', (e) => {
    if (!historia.activa) return;
    if (['Space', 'Enter', 'KeyX', 'KeyZ', 'KeyJ', 'KeyK'].includes(e.code)) { e.preventDefault(); historia.tocar(); }
  });
  $('#radio-omitir').addEventListener('pointerdown', (e) => { e.stopPropagation(); sonido('ui_back'); radio.omitir(); });

  precargarVoces(['voz_alas_es', 'voz_alas_en', 'voz_calzado_es', 'voz_calzado_en', 'voz_fuego_es', 'voz_fuego_en']);
  precargarSfx(['muerte_sombra_1', 'muerte_sombra_2', 'muerte_sombra_3']);
  // Prueba: ?nivel=N entra directo a jugar ese nivel, sin escenas.
  const n = +params.get('nivel');
  if (params.has('entrenar') && data.tutorial) lanzar(data.tutorial);
  else if (n) lanzar(campana().levels.find((l) => l.levelNumber === n) ?? campana().levels[0]);
  // Prueba: ?nivel=N&jefe pone al soldado justo antes del jefe (y reaparece ahí).
  if (n && params.has('jefe')) {
    const ir = () => {
      const b = session?.world?.bossSpawn;
      if (!b) return setTimeout(ir, 200);
      const p = session.player, suelo = b.y + b.def.h;
      p.x = Math.max(b.min, b.x - 520); p.y = suelo - p.h - 2; p.vx = p.vy = 0;
      session.respawnX = p.x; session.respawnY = p.y;
    };
    ir();
  }
  if (!params.has('entrenar') && !n) titulo();
  window.__juego ??= { data, flujo: { titulo, niveles, empezarNivel, lanzar, historia, radio, progreso, modo: () => mode } };
  requestAnimationFrame(loop);
}

main().catch((e) => { $('#cargando').textContent = 'Error al cargar: ' + e.message; console.error(e); });
