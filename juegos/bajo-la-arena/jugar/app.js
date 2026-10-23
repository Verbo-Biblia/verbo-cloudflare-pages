import { escapeHtml, docSvg, docCover } from './docs.js';
import { MAX_PINS, MEDIA_EXTENSIONS, SECTIONS, sectionOf, isSuspect } from './reglas.js';
import { t, idioma, cambiarIdioma, fijarTextosJuego } from './textos.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const collectionKey = 'archivo-umbral-coleccion';
const progressKey = 'coldfolio-progreso';
const careerKey = 'coldfolio-carrera';
// Reputación: +1 sello por caso resuelto, −1 por acusación errónea. Una medalla cada 5 sellos.
const SEALS_PER_MEDAL = 5;
const RANKS = () => t('rangos');
const tilts = [-1.1, 0.8, -0.4, 1.2, -0.8, 0.5, -1.3, 0.3];
// Desorden de la pila: desplazamiento x, y, giro y altura de la pestaña de cada carpeta
const pileMess = [[0, 0, -1.4, 6], [16, 12, 2.1, 30], [-9, 22, -2.8, 54], [22, 30, 1.2, 76], [4, 40, -0.6, 18], [-14, 48, 2.6, 42]];
// Carpetas visibles a la vez en la mesa; el resto se recorre con ‹ ›.
const PILE_SIZE = pileMess.length;
const state = { cases: [], caseIndex: null, caseData: null, view: 'home', pilePage: null, section: null, pinned: [], positions: {}, selected: [], connections: [], solved: false, accused: null, stampArmed: false };

const pairKey = (ids) => [...ids].sort().join('+');

/* ---------- Sonido: efectos en assets/sfx/, música en assets/audio/ ----------
   Cualquier archivo puede reemplazarse por otro con el mismo nombre (.mp3, .ogg o .wav). */
const audioExtensions = ['mp3', 'ogg', 'wav'];
const sfxNames = ['click', 'papel', 'carpeta', 'clavar', 'quitar', 'hilo', 'error', 'trampa', 'sello', 'resuelto', 'vhs'];
const sounds = {};
const music = { tracks: {}, current: null, playing: null };
let soundOn = (() => { try { return localStorage.getItem('coldfolio-sonido') !== 'no'; } catch { return true; } })();

async function findAudio(folder, name) {
  for (const extension of audioExtensions) {
    const src = `${folder}${name}.${extension}`;
    const ok = await fetch(src, { method: 'HEAD' }).then((response) => response.ok, () => false);
    if (ok) return src;
  }
  return null;
}

async function loadAudio() {
  await Promise.all([
    ...sfxNames.map(async (name) => { const src = await findAudio('assets/sfx/', name); if (src) sounds[name] = src; }),
    ...['menu', 'caso', 'final'].map(async (name) => {
      const src = await findAudio('assets/audio/', name);
      if (!src) return;
      const track = new Audio(src);
      track.loop = name !== 'final';
      track.volume = 0;
      music.tracks[name] = track;
    })
  ]);
}

function sfx(name, volume = 0.7) {
  if (!soundOn || !sounds[name]) return;
  const sound = new Audio(sounds[name]);
  sound.volume = volume;
  sound.play().catch(() => {});
}

function playMusic(name) {
  music.current = name;
  Object.entries(music.tracks).forEach(([key, track]) => {
    const target = soundOn && key === name ? 0.35 : 0;
    if (target && track.paused) track.play().catch(() => {});
    fadeTo(track, target);
  });
}

function fadeTo(track, target) {
  clearInterval(track.fadeTimer);
  track.fadeTimer = setInterval(() => {
    const next = track.volume + Math.sign(target - track.volume) * 0.03;
    track.volume = Math.max(0, Math.min(1, Math.abs(target - next) < 0.03 ? target : next));
    if (track.volume === target) { clearInterval(track.fadeTimer); if (!target) track.pause(); }
  }, 60);
}

function toggleSound() {
  soundOn = !soundOn;
  try { localStorage.setItem('coldfolio-sonido', soundOn ? 'si' : 'no'); } catch { /* sin almacenamiento */ }
  $('#sound-btn').textContent = soundOn ? t('sonidoSi') : t('sonidoNo');
  playMusic(music.current);
  sfx('click');
}

async function init() {
  let catalog = await fetch('cases.json', { cache: 'no-store' }).then((response) => response.json());
  // En inglés, cases.en.json (solo los textos traducidos) se combina encima: ids, imágenes y respuestas no cambian.
  if (idioma() === 'en') {
    const en = await fetch('cases.en.json', { cache: 'no-store' }).then((response) => response.ok ? response.json() : null, () => null);
    if (en) catalog = combinar(catalog, en);
  }
  state.cases = catalog.cases || [catalog];
  state.game = catalog.game || { title: 'Expedientes' };
  fijarTextosJuego(state.game.textos);
  aplicarTextosFijos();
  await Promise.all([loadAudio(), renderTitle()]);
  bindEvents();
  playMusic('menu');
  // Si el navegador bloquea el autoplay, reintentar con un gesto del jugador.
  const resumeMusic = () => {
    if (soundOn && music.tracks[music.current]?.paused) playMusic(music.current);
  };
  document.addEventListener('pointerup', resumeMusic);
  document.addEventListener('keydown', resumeMusic);
  // Con la app minimizada o la pestaña oculta, la música se calla; al volver, sigue.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Object.values(music.tracks).forEach((track) => track.pause());
    else resumeMusic();
  });
  renderHome();
  renderCollection();
}

// Combina la traducción sobre el original: objetos campo a campo, listas por posición, textos reemplazados.
function combinar(base, extra) {
  if (Array.isArray(base) && Array.isArray(extra)) return base.map((value, i) => (i < extra.length ? combinar(value, extra[i]) : value));
  if (base && extra && typeof base === 'object' && typeof extra === 'object' && !Array.isArray(base)) {
    const result = { ...base };
    for (const [key, value] of Object.entries(extra)) result[key] = key in base ? combinar(base[key], value) : value;
    return result;
  }
  return extra ?? base;
}

// Textos fijos de index.html: llevan data-t (contenido) o data-t-title / data-t-aria (atributos).
function aplicarTextosFijos() {
  document.documentElement.lang = idioma();
  $$('[data-t]').forEach((element) => { element.textContent = t(element.dataset.t); });
  $$('[data-t-title]').forEach((element) => { element.title = t(element.dataset.tTitle); });
  $$('[data-t-aria]').forEach((element) => { element.setAttribute('aria-label', t(element.dataset.tAria)); });
  // Fuera de la computadora de desarrollo, enlace de vuelta a la sección de juegos de Verbo.
  const local = ['127.0.0.1', 'localhost', ''].includes(location.hostname) || location.protocol === 'file:';
  $('#back-site')?.classList.toggle('hidden', local || !state.game.volverA);
  if (state.game.volverA) $('#back-site')?.setAttribute('href', state.game.volverA);
  // En la web «Salir del juego» no puede cerrar la pestaña: si hay enlace de vuelta al sitio, ese hace de salida.
  if (state.game.volverA && !window.ColdfolioApp) $('#quit-btn')?.classList.add('hidden');
}

// El caso se resuelve con el sello sobre «answer» (cualquier prueba con imagen: objeto, lugar, persona…) o, en
// los casos de detective, sobre «culprit» (solo personas).
const answerOf = (data) => data.answer || data.culprit;
const isCandidate = (data, item) => Boolean(item?.id) && !item.doc && (data.answer ? true : isSuspect(item));

/* ==========================================================================
   Material de cada caso: assets/casos/<código>/<nombre>.(jpg|jpeg|png|mp4)
   perfil, lugar1, objeto1, galeria1… y recompensa1… para la colección.
   ========================================================================== */
const caseFolder = (data) => `assets/casos/${encodeURIComponent(data.folder || data.code)}/`;
const assetCache = new Map();

function resolveAsset(folder, name) {
  const key = folder + name;
  if (!assetCache.has(key)) {
    const hasExtension = /\.(jpe?g|png|mp4)$/i.test(name);
    const files = hasExtension ? [name] : MEDIA_EXTENSIONS.map((extension) => `${name}.${extension}`);
    assetCache.set(key, Promise.all(files.map((file) => fetch(folder + encodeURIComponent(file), { method: 'HEAD' }).then((response) => response.ok, () => false)))
      .then((found) => {
        const file = files[found.indexOf(true)];
        if (!file) return { kind: 'missing', path: folder + name };
        return { kind: /\.mp4$/i.test(file) ? 'video' : 'image', src: folder + encodeURIComponent(file) };
      }));
  }
  return assetCache.get(key);
}

/* El material se busca solo cuando hace falta (con 100 casos serían miles de
   peticiones al arrancar): portadas al mostrar su página de la pila, pruebas al
   abrir el caso y recompensas al resolverlo o abrir la colección. */
async function prepareCover(data) {
  data.coverMedia ||= await resolveAsset(caseFolder(data), data.cover || 'perfil');
}

async function prepareEvidence(data) {
  const folder = caseFolder(data);
  await Promise.all(data.evidence.filter((item) => !item.doc && !item.media).map(async (item) => { item.media = await resolveAsset(folder, item.asset || item.id); }));
}

async function prepareReward(data) {
  data.rewardMedia ||= await Promise.all((data.reward?.assets || []).map((name) => resolveAsset(caseFolder(data), name)));
}

function mediaHtml(media, { thumb = false } = {}) {
  if (!media || media.kind === 'missing') return missingHtml(media);
  if (media.kind === 'video') {
    return thumb
      ? `<video src="${media.src}#t=0.5" muted playsinline preload="metadata"></video>`
      : `<video src="${media.src}" controls playsinline></video>`;
  }
  return `<img src="${media.src}" alt="" ${thumb ? 'loading="lazy"' : ''}>`;
}

function missingHtml(media) {
  const path = media ? decodeURIComponent(media.path) : '';
  return `<div class="missing"><span class="label">${t('faltaArchivo')}</span><code>${escapeHtml(path)}</code><small>.jpg · .jpeg · .png · .mp4</small></div>`;
}

/* ---------- Portada ---------- */
async function renderTitle() {
  const game = state.game;
  document.title = game.title;
  $('#title-name').textContent = game.title;
  $('#title-sub').textContent = game.subtitle || '';
  $$('.brand-name').forEach((element) => { element.textContent = game.title; });
  const [logo, deskBackground, titleBackground] = await Promise.all(['logo', 'fondo-mesa', 'fondo-portada'].map((name) => resolveAsset('assets/ui/', name)));
  if (deskBackground.kind === 'image') document.documentElement.style.setProperty('--bg-mesa', `url('${deskBackground.src}')`);
  if (titleBackground.kind === 'image') document.documentElement.style.setProperty('--bg-portada', `url('${titleBackground.src}')`);
  if (logo.kind === 'image') {
    $('#title-logo').src = logo.src;
    $('#title-logo').classList.remove('hidden');
    $('#title-name').classList.add('visually-hidden');
  }
  $('#sound-btn').textContent = soundOn ? t('sonidoSi') : t('sonidoNo');
  const clock = () => { const t = Math.floor(performance.now() / 1000); $('#osd-time').textContent = `SP ${String(Math.floor(t / 3600))}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  clock();
  setInterval(clock, 1000);
}

function startGame() {
  if ($('#title-screen').classList.contains('leaving')) return;
  sfx('vhs');
  $('#title-screen').classList.add('leaving');
  setTimeout(() => $('#title-screen').classList.add('hidden'), 700);
  playMusic('menu');
  enterMobileFullscreen();
}

/* En el móvil el juego va a pantalla completa y en horizontal: la barra del
   navegador se come demasiada altura. Donde no se puede (iPhone), no pasa nada. */
function enterMobileFullscreen() {
  if (!matchMedia('(pointer: coarse)').matches || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => { /* sin pantalla completa: se juega igual */ });
}

function backToTitle() {
  closeModals();
  sfx('vhs');
  showView('home');
  const screen = $('#title-screen');
  screen.classList.remove('hidden');
  requestAnimationFrame(() => screen.classList.remove('leaving'));
}

function quitGame() {
  sfx('click');
  // En la app de Android, el puente nativo cierra la actividad; en el navegador, window.close().
  if (window.ColdfolioApp?.salir) {
    Object.values(music.tracks).forEach((track) => track.pause());
    return window.ColdfolioApp.salir();
  }
  window.close();
  setTimeout(() => $('#quit-note').classList.remove('hidden'), 300);
}

/* ---------- Guardado ---------- */
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(collectionKey) || '[]').map((item) => item.code); } catch { return []; }
}

function saveCurrentCase() {
  const saved = loadSaved();
  if (!saved.includes(state.caseData.code)) saved.push(state.caseData.code);
  try { localStorage.setItem(collectionKey, JSON.stringify(saved.map((code) => ({ code })))); } catch { /* sin almacenamiento: la partida sigue */ }
  renderCollection();
}

const isSolved = (code) => loadSaved().includes(code);

/* ---------- Carrera: sellos de reconocimiento, rango y casos devueltos al fondo de la pila ---------- */
function loadCareer() {
  let career = null;
  try { career = JSON.parse(localStorage.getItem(careerKey) || 'null'); } catch { /* sin almacenamiento */ }
  // Partidas anteriores a la reputación: cada caso ya resuelto cuenta como un sello.
  return { seals: career ? career.seals || 0 : loadSaved().length, failed: career?.failed || {}, buried: career?.buried || {} };
}

function saveCareer(career) {
  try { localStorage.setItem(careerKey, JSON.stringify(career)); } catch { /* sin almacenamiento: la partida sigue */ }
}

function rankOf(seals) {
  const medals = Math.floor(seals / SEALS_PER_MEDAL);
  const ranks = RANKS();
  return { seals, medals, name: seals > 0 ? ranks[Math.min(medals + 1, ranks.length - 1)] : ranks[0] };
}

// Suma o resta sellos y devuelve el rango antes y después.
function changeSeals(career, delta) {
  const before = rankOf(career.seals);
  career.seals = Math.max(0, career.seals + delta);
  return { before, after: rankOf(career.seals) };
}

function careerLine({ before, after }, delta) {
  const lost = delta < 0 && before.seals === 0;
  const parts = [lost ? t('sinSellos') : delta > 0 ? t('masSello') : t('menosSello')];
  if (after.medals > before.medals) parts.push(t('nuevaMedalla'));
  if (after.medals < before.medals) parts.push(t('pierdesMedalla'));
  parts.push(after.name !== before.name ? `${after.medals >= before.medals ? t('ascenso') : t('degradado')}: ${after.name}` : `${t('rango')}: ${after.name}`);
  return parts.join(' · ');
}

// Orden de la mesa: el de cases.json; debajo, los fallidos (el último fallo, el último) y al fondo los resueltos.
function orderedCases() {
  const { buried } = loadCareer();
  const open = state.cases.filter((item) => !buried[item.code] && !isSolved(item.code));
  const sunk = state.cases.filter((item) => buried[item.code] && !isSolved(item.code)).sort((a, b) => buried[a.code] - buried[b.code]);
  // Los resueltos se archivan debajo de todo, en el orden en que se cerraron.
  const saved = loadSaved();
  const solved = state.cases.filter((item) => isSolved(item.code)).sort((a, b) => saved.indexOf(a.code) - saved.indexOf(b.code));
  return [...open, ...sunk, ...solved];
}

function renderReputation() {
  const rank = rankOf(loadCareer().seals);
  const filled = rank.seals % SEALS_PER_MEDAL;
  const tilts = [-14, 9, -4, 16, -9];
  $('#reputation').innerHTML = `
    <p class="label rep-title">${t('hojaServicio')}</p>
    <p class="rep-rank">${escapeHtml(rank.name)}</p>
    <div class="rep-bar" title="${escapeHtml(t('sellosBarra', filled, SEALS_PER_MEDAL))}">${tilts.map((tilt, i) => `<span class="rep-seal ${i < filled ? 'on' : ''}" style="--r:${tilt}deg">${i < filled ? `<span>${t('merito')}</span>` : ''}</span>`).join('')}</div>
    <div class="rep-medals">${rank.medals ? Array.from({ length: rank.medals }, () => `<span class="medal" title="${escapeHtml(t('medallaMerito'))}"></span>`).join('') : `<small>${t('sinMedallas')}</small>`}</div>
    <small class="rep-next">${t('sellosFaltan', rank.seals, SEALS_PER_MEDAL - filled)}</small>`;
}

/* Progreso del caso abierto (pizarra, posiciones e hilos), guardado por código. */
function loadAllProgress() {
  try { return JSON.parse(localStorage.getItem(progressKey) || '{}') || {}; } catch { return {}; }
}

function writeAllProgress(all) {
  try { localStorage.setItem(progressKey, JSON.stringify(all)); } catch { /* sin almacenamiento: la partida sigue */ }
}

function saveProgress() {
  if (!state.caseData) return;
  const all = loadAllProgress();
  all[state.caseData.code] = { pinned: state.pinned, positions: state.positions, connections: state.connections, section: state.section, accused: state.accused };
  writeAllProgress(all);
}

function clearProgress(code) {
  const all = loadAllProgress();
  delete all[code];
  writeAllProgress(all);
}

// Restaura lo guardado descartando ids que ya no existan en el caso (por si se editó).
function restoreProgress(data) {
  const saved = loadAllProgress()[data.code];
  if (!saved) return;
  const ids = new Set(data.evidence.map((item) => item.id));
  state.pinned = (saved.pinned || []).filter((id) => ids.has(id)).slice(0, MAX_PINS);
  state.connections = (saved.connections || []).filter((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((id) => state.pinned.includes(id)));
  state.positions = Object.fromEntries(Object.entries(saved.positions || {}).filter(([id]) => state.pinned.includes(id)));
  if (sectionList(data).some(([key]) => key === saved.section)) state.section = saved.section;
  state.solved = Boolean(answerOf(data)) && saved.accused === answerOf(data) && state.pinned.includes(answerOf(data));
  state.accused = state.solved ? answerOf(data) : null;
  if (state.solved) setNote(t('casoResueltoNota'), 'ok');
  else if (state.pinned.length) setNote(t('progresoRecuperado'), 'ok');
}

/* ---------- Navegación entre escenas ---------- */
function showView(view) {
  if (view !== 'home' && !state.caseData) return;
  if (view !== state.view) sfx('click', 0.5);
  playMusic(view === 'home' ? 'menu' : 'caso');
  state.view = view;
  if (view !== 'board') armStamp(false);
  ['home', 'case', 'board'].forEach((name) => $(`#${name}-view`).classList.toggle('active-view', name === view));
  $$('.scene-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.go === view);
    if (tab.dataset.go !== 'home') tab.disabled = !state.caseData;
  });
  $('#progress-box').classList.toggle('hidden', view === 'home');
  if (view === 'home') renderHome();
  if (view === 'board') requestAnimationFrame(() => { layoutBoard(); drawLines(); });
}

/* ---------- 01 · Mesa: pila de expedientes ---------- */
function renderHome() {
  const count = state.cases.length;
  const solved = state.cases.filter((item) => isSolved(item.code)).length;
  const pages = Math.max(1, Math.ceil(count / PILE_SIZE));
  const ordered = orderedCases();
  const { failed } = loadCareer();
  if (state.pilePage === null) {
    // Al entrar, la página del primer caso sin resolver.
    const firstOpen = ordered.findIndex((item) => !isSolved(item.code));
    state.pilePage = Math.floor(Math.max(0, firstOpen) / PILE_SIZE);
  }
  state.pilePage = Math.min(Math.max(0, state.pilePage), pages - 1);
  const start = state.pilePage * PILE_SIZE;
  const visible = ordered.slice(start, start + PILE_SIZE);
  $('#home-count').textContent = `${solved} / ${count}`;
  renderReputation();
  $('#pile-nav').classList.toggle('hidden', pages < 2);
  $('#pile-range').textContent = t('rangoDe', start + 1, start + visible.length, count);
  $('#pile-prev').disabled = state.pilePage === 0;
  $('#pile-next').disabled = state.pilePage === pages - 1;
  const pile = $('#case-pile');
  pile.style.setProperty('--n', visible.length);
  // El primer caso de la página queda arriba; los siguientes se apilan debajo y asoman por su pestaña.
  pile.innerHTML = visible.map((item, k) => {
    const caseIndex = state.cases.indexOf(item);
    const done = isSolved(item.code);
    const stamp = done ? t('estadoResuelto') : failed[item.code] ? t('estadoFallido', failed[item.code]) : item.stamp || t('estadoAbierto');
    const cover = !item.coverMedia || item.coverMedia.kind === 'missing' ? '' : `<span class="pile-photo">${mediaHtml(item.coverMedia, { thumb: true })}</span>`;
    const mess = pileMess[k % pileMess.length];
    return `<button class="pile-folder" data-case-index="${caseIndex}" style="--k:${k};--dx:${mess[0]}px;--dy:${mess[1]}px;--tilt:${mess[2]}deg;--tab:${mess[3]}%">
      <span class="pile-tab">${escapeHtml(item.code)}</span>
      <span class="pile-cover">
        <span class="label">${t('expediente')} ${escapeHtml(item.code)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="pile-summary">${escapeHtml(item.summary)}</span>
        ${cover}
        <span class="pile-meta">${t('resumenPila', item.evidence.length, item.evidence.filter((evidence) => isSuspect(evidence)).length)}</span>
        <span class="stamp ${done ? 'done' : failed[item.code] ? 'failed' : ''}">${escapeHtml(stamp)}</span>
      </span>
    </button>`;
  }).join('');
  const missingCovers = visible.filter((item) => !item.coverMedia);
  if (missingCovers.length) Promise.all(missingCovers.map(prepareCover)).then(() => { if (state.view === 'home') renderHome(); });
}

function turnPile(step) {
  state.pilePage += step;
  sfx('papel', 0.4);
  renderHome();
}

async function openCase(index) {
  await prepareEvidence(state.cases[index]);
  state.caseIndex = index;
  state.caseData = state.cases[index];
  resetProgress();
  sfx('carpeta');
  state.section = sectionList(state.caseData)[0]?.[0];
  restoreProgress(state.caseData);
  renderCase();
  showView('case');
}

/* ---------- 02 · Expediente abierto: secciones + clavar en la pizarra ---------- */

const sectionList = (data) => SECTIONS.filter(([key]) => data.evidence.some((item) => sectionOf(item) === key));

function gridSize(count) {
  const cols = count <= 2 ? 2 : count <= 6 ? 3 : count <= 12 ? 4 : 5;
  const colsMobile = count > 12 ? 4 : count > 4 ? 3 : 2;
  return { cols, rows: Math.max(1, Math.ceil(count / cols)), colsMobile, rowsMobile: Math.max(1, Math.ceil(count / colsMobile)) };
}

function applyGrid(grid, count) {
  const { cols, rows, colsMobile, rowsMobile } = gridSize(count);
  grid.style.setProperty('--cols', cols);
  grid.style.setProperty('--rows', rows);
  grid.style.setProperty('--cols-m', colsMobile);
  grid.style.setProperty('--rows-m', rowsMobile);
  grid.classList.toggle('dense', rows >= 3);
  grid.classList.toggle('single', rows === 1);
}

function renderCase() {
  const data = state.caseData;
  const subject = data.subject;
  const solved = isSolved(data.code);
  $('#file-number').textContent = data.code;
  $('#case-title').textContent = data.title;
  $('#case-subject').textContent = subject ? `${subject.name} · ${subject.role} · ${subject.period}` : '';
  $('#case-brief').textContent = data.brief;
  $('#case-objective').textContent = data.objective;
  $('#case-stamp').textContent = solved ? t('estadoResuelto') : data.stamp || t('estadoConfidencial');
  $('#case-stamp').classList.toggle('done', solved);
  $('#case-meta').innerHTML = (data.meta || []).map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('');
  renderSection();
  renderBoard();
  updateProgress();
  updateStampBtn();
}

function renderSection() {
  const data = state.caseData;
  $('#section-tabs').innerHTML = sectionList(data).map(([key]) => {
    const label = t(`secciones.${key}`);
    const count = data.evidence.filter((item) => sectionOf(item) === key).length;
    return `<button class="section-tab ${key === state.section ? 'active' : ''}" data-section="${key}" role="tab">${label} <span>${count}</span></button>`;
  }).join('');
  const items = data.evidence.filter((item) => sectionOf(item) === state.section);
  applyGrid($('#evidence-grid'), items.length);
  $('#evidence-grid').innerHTML = items.map(evidenceCard).join('');
  $('#pin-count').textContent = `${state.pinned.length} / ${MAX_PINS}`;
  updateProgress();
}

function evidenceCard(item, index) {
  const pinned = state.pinned.includes(item.id);
  return `<article class="evidence-card ${pinned ? 'pinned' : ''}" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="${escapeHtml(t('examinar', item.title))}" style="--tilt:${tilts[index % tilts.length]}deg">
    ${artifactVisual(item)}
    <span class="card-type">${escapeHtml(item.type)}</span>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
    <button class="pin-btn" data-pin="${escapeHtml(item.id)}" aria-pressed="${pinned}">${pinned ? t('enPizarra') : t('clavar')}</button>
  </article>`;
}

function togglePin(id) {
  if (state.pinned.includes(id)) {
    if (id === state.accused) return flashHint(t('personaConSello'));
    // Al descolgar una prueba se cortan también sus hilos.
    state.connections = state.connections.filter((pair) => !pair.includes(id));
    state.pinned = state.pinned.filter((pinnedId) => pinnedId !== id);
    delete state.positions[id];
    sfx('quitar');
    state.selected = state.selected.filter((selectedId) => selectedId !== id);
  } else {
    if (state.pinned.length >= MAX_PINS) return flashHint(t('pizarraLlena', MAX_PINS));
    state.pinned.push(id);
    sfx('clavar');
  }
  renderSection();
  renderBoard();
  syncMediaPin(id);
  saveProgress();
}

function flashHint(text) {
  const hint = $('#case-hint');
  hint.textContent = text;
  hint.classList.add('warn');
  sfx('error', 0.4);
  clearTimeout(flashHint.timer);
  flashHint.timer = setTimeout(() => { hint.textContent = t('pistaExaminar'); hint.classList.remove('warn'); }, 2600);
}

function artifactVisual(item) {
  if (item.doc) return `<div class="artifact artifact-doc">${docCover(item.doc)}</div>`;
  const media = item.media;
  if (!media || media.kind === 'missing') return `<div class="artifact artifact-missing">${missingHtml(media)}</div>`;
  const content = mediaHtml(media, { thumb: true });
  if (media.kind === 'video') return `<div class="artifact artifact-vhs">${content}<span class="vhs-rec">● PLAY</span><span class="vhs-play">▶</span><span class="vhs-label">${escapeHtml(item.title)}</span></div>`;
  if (sectionOf(item) === 'objetos') return `<div class="artifact artifact-object"><div class="bag">${content}</div><span class="bag-tag">${escapeHtml(t('pruebaN', (item.id.replace(/\D/g, '') || item.id).toUpperCase()))}</span></div>`;
  return `<div class="artifact artifact-photo">${content}</div>`;
}

/* ---------- 03 · Pizarra: solo lo clavado ---------- */
function renderBoard() {
  const items = state.caseData.evidence.filter((item) => state.pinned.includes(item.id));
  applyGrid($('#board-cards'), items.length);
  // Con más de 12 pruebas las tarjetas se compactan para que quepan hasta MAX_PINS.
  $('#board-cards').classList.toggle('crowded', items.length > 12);
  $('#board-cards').innerHTML = items.map(boardCard).join('');
  $('#board-empty').classList.toggle('hidden', items.length > 0);
  $$('.board-card').forEach((card) => card.classList.toggle('selected', state.selected.includes(card.dataset.id)));
  layoutBoard();
  updateProgress();
  drawLines();
}

/* La rejilla solo da la posición inicial: cada prueba guarda su centro
   (en fracción de la pizarra) y a partir de ahí se arrastra libremente. */
function layoutBoard() {
  const grid = $('#board-cards');
  if (state.view !== 'board') return;
  const cards = $$('.board-card');
  grid.classList.remove('free');
  cards.forEach((card) => { card.style.width = ''; });
  if (!grid.clientWidth) return;
  cards.forEach((card) => {
    const id = card.dataset.id;
    if (!state.positions[id]) {
      state.positions[id] = { x: (card.offsetLeft + card.offsetWidth / 2) / grid.clientWidth, y: (card.offsetTop + card.offsetHeight / 2) / grid.clientHeight };
    }
    card.style.width = `${card.offsetWidth}px`;
  });
  grid.classList.add('free');
  cards.forEach((card) => placeCard(card, state.positions[card.dataset.id]));
  saveProgress();
}

function placeCard(card, { x, y }) {
  const grid = $('#board-cards');
  const halfW = card.offsetWidth / 2 / grid.clientWidth;
  const halfH = card.offsetHeight / 2 / grid.clientHeight;
  const clamp = (value, half) => Math.min(Math.max(value, half), Math.max(half, 1 - half));
  const position = { x: clamp(x, halfW), y: clamp(y, halfH) };
  state.positions[card.dataset.id] = position;
  card.style.setProperty('--x', position.x);
  card.style.setProperty('--y', position.y);
}

function bindBoardDrag() {
  const grid = $('#board-cards');
  let drag = null;
  let justDragged = false;
  let topLayer = 10;
  grid.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('.board-card');
    const position = card && state.positions[card.dataset.id];
    if (!position || (event.pointerType === 'mouse' && event.button !== 0)) return;
    drag = { card, startX: event.clientX, startY: event.clientY, ...position, moved: false };
    // En táctil, evitar que el WebView lo tome como desplazamiento o arrastre nativo de la imagen.
    if (event.pointerType !== 'mouse') event.preventDefault();
    try { card.setPointerCapture(event.pointerId); } catch { /* algunos WebView no lo admiten */ }
  });
  grid.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.card.classList.add('dragging');
      drag.card.style.zIndex = ++topLayer;
    }
    placeCard(drag.card, { x: drag.x + dx / grid.clientWidth, y: drag.y + dy / grid.clientHeight });
    drawLines();
  });
  let lastTap = { id: null, time: 0 };
  const end = (event) => {
    // Doble toque en una ficha (táctil): examinarla, como el doble clic con ratón.
    if (drag && !drag.moved && event?.type === 'pointerup' && event.pointerType !== 'mouse') {
      const now = Date.now();
      if (lastTap.id === drag.card.dataset.id && now - lastTap.time < 350) {
        lastTap = { id: null, time: 0 };
        const id = drag.card.dataset.id;
        drag = null;
        justDragged = true;
        setTimeout(() => { justDragged = false; });
        return examineEvidence(id);
      }
      lastTap = { id: drag.card.dataset.id, time: now };
    }
    if (drag?.moved) {
      drag.card.classList.remove('dragging');
      justDragged = true;
      setTimeout(() => { justDragged = false; });
      sfx('papel', 0.25);
      saveProgress();
    }
    drag = null;
  };
  grid.addEventListener('pointerup', end);
  grid.addEventListener('pointercancel', end);
  grid.addEventListener('dragstart', (event) => event.preventDefault());
  // Respaldo para WebView que no envían pointermove al arrastrar con el dedo.
  grid.addEventListener('touchmove', (event) => { if (drag) event.preventDefault(); }, { passive: false });
  // Soltar tras arrastrar no debe contar como clic de selección.
  grid.addEventListener('click', (event) => { if (justDragged) event.stopPropagation(); }, true);
}

function boardThumb(item) {
  if (item.doc) return `<span class="board-thumb">${docCover(item.doc)}</span>`;
  if (!item.media || item.media.kind === 'missing') return '<span class="board-thumb is-missing">?</span>';
  return `<span class="board-thumb">${mediaHtml(item.media, { thumb: true })}</span>`;
}

function boardCard(item) {
  return `<article class="board-card${isCandidate(state.caseData, item) ? ' suspect' : ''}" data-id="${escapeHtml(item.id)}" tabindex="0" role="button">${boardThumb(item)}<span class="card-type">${escapeHtml(item.type)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>${state.accused === item.id ? `<span class="guilty-stamp">${escapeHtml(t('marcaSello'))}</span>` : ''}</article>`;
}

function setNote(text, tone = '') {
  const note = $('#board-note');
  note.textContent = text;
  note.className = `board-note ${tone}`;
}

function selectEvidence(id) {
  if (state.stampArmed) return accuse(id);
  if (state.solved) return;
  if (state.selected.includes(id)) state.selected = state.selected.filter((selectedId) => selectedId !== id);
  else if (state.selected.length < 2) state.selected.push(id);
  else state.selected = [id];
  sfx('click', 0.4);
  $$('.board-card').forEach((card) => card.classList.toggle('selected', state.selected.includes(card.dataset.id)));
  $('#solve-btn').disabled = state.selected.length !== 2;
  const joined = state.selected.length === 2 && hasConnection(state.selected);
  $('#solve-btn').textContent = joined ? t('cortar') : t('unir');
  if (state.selected.length === 2) setNote(joined ? t('ya_hilo') : t('tiendeHilo'));
  else if (state.selected.length === 1) setNote(t('segunda'));
  else setNote(t('eligeDos'));
  drawLines();
}

function drawLines() {
  const svg = $('#connections');
  svg.innerHTML = '';
  if (state.view !== 'board') return;
  state.connections.forEach(([from, to]) => drawLine(from, to));
  if (state.selected.length === 2) drawLine(state.selected[0], state.selected[1], true);
}

function drawLine(fromId, toId, preview = false) {
  const from = document.querySelector(`.board-card[data-id="${fromId}"]`);
  const to = document.querySelector(`.board-card[data-id="${toId}"]`);
  if (!from || !to) return;
  const board = $('.board-wrap').getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', a.left + a.width / 2 - board.left);
  line.setAttribute('y1', a.top + a.height / 2 - board.top);
  line.setAttribute('x2', b.left + b.width / 2 - board.left);
  line.setAttribute('y2', b.top + b.height / 2 - board.top);
  line.classList.add('connection-line');
  if (preview) line.classList.add('preview');
  $('#connections').appendChild(line);
}

function hasConnection(pair) {
  const key = pairKey(pair);
  return state.connections.some((connection) => pairKey(connection) === key);
}

// Los hilos son del jugador: se quedan donde los ponga, encajen o no. La pizarra no dice
// cuáles son buenos; eso solo se comprueba al poner el sello de culpable.
function solveHypothesis() {
  if (state.selected.length !== 2) return;
  const pair = [...state.selected];
  const key = pairKey(pair);
  state.selected = [];
  $$('.board-card.selected').forEach((card) => card.classList.remove('selected'));
  $('#solve-btn').disabled = true;
  $('#solve-btn').textContent = t('unir');

  if (hasConnection(pair)) {
    state.connections = state.connections.filter((connection) => pairKey(connection) !== key);
    sfx('quitar');
    setNote(t('hiloCortado'));
  } else {
    state.connections.push(pair);
    sfx('hilo');
    setNote(t('hiloTendido'));
  }
  saveProgress();
  updateProgress();
  drawLines();
}

/* ---------- Sello de culpable: el caso se resuelve señalando a la persona correcta ---------- */
function updateStampBtn() {
  const button = $('#stamp-btn');
  button.disabled = state.solved;
  button.textContent = state.solved ? t('casoCerrado') : t('sello');
  button.title = state.solved ? t('casoCerradoTitulo') : t('selloTitulo');
}

function armStamp(armed = !state.stampArmed) {
  if (state.solved) armed = false;
  state.stampArmed = armed;
  $('#stamp-btn').classList.toggle('armed', armed);
  $('#stamp-btn').setAttribute('aria-pressed', armed);
  $('#board-cards').classList.toggle('stamping', armed);
  if (!armed) return;
  sfx('click', 0.5);
  const suspects = state.caseData.evidence.filter((item) => isCandidate(state.caseData, item) && state.pinned.includes(item.id));
  setNote(suspects.length ? t('selloEnMano') : t('sinCandidatos'), suspects.length ? '' : 'error');
}

function accuse(id) {
  const data = state.caseData;
  const item = data.evidence.find((evidence) => evidence.id === id);
  if (!isCandidate(data, item)) return setNote(t('soloPersonas'), 'error');
  armStamp(false);
  state.selected = [];
  $$('.board-card.selected').forEach((card) => card.classList.remove('selected'));
  $('#solve-btn').disabled = true;
  if (id !== answerOf(data)) return failCase(item);
  state.solved = true;
  state.accused = id;
  saveProgress();
  renderBoard();
  sfx('clavar');
  setNote(t('selloPuesto'), 'ok');
  updateStampBtn();
  setTimeout(showReward, 900);
}

function updateProgress() {
  const found = state.connections.length;
  const linked = new Set(state.connections.flat());
  $('#progress-count').textContent = found;
  $('#connection-count').textContent = t('hilos', found);
  $$('.evidence-card, .board-card').forEach((card) => card.classList.toggle('linked', linked.has(card.dataset.id)));
}

function resetProgress() {
  state.pinned = [];
  state.positions = {};
  state.selected = [];
  state.connections = [];
  state.solved = false;
  state.accused = null;
  armStamp(false);
  $('#solve-btn').disabled = true;
  $('#solve-btn').textContent = t('unir');
  updateStampBtn();
  setNote(t('notaReinicio'));
}

function resetCase() {
  clearProgress(state.caseData.code);
  resetProgress();
  renderCase();
}

// Acusación errónea: el caso se cierra mal, pierde un sello y vuelve al fondo de la pila.
function failCase(item) {
  const data = state.caseData;
  // Modo amable (game.amable, para niños): el error no quita nada; la pizarra queda como estaba y se reintenta.
  if (state.game.amable) {
    sfx('error');
    state.accused = null;
    saveProgress();
    renderBoard();
    openMedia({ eyebrow: t('errorCabecera', data.code), title: t('errorTitulo', item.title), copy: `${data.wrongAccusation || t('errorPorDefecto')} ${t('errorAmable')}` });
    return;
  }
  // Repetir un caso ya resuelto es práctica: fallar no quita sellos ni lo manda al fondo.
  const replay = isSolved(data.code);
  const career = loadCareer();
  const change = replay ? null : changeSeals(career, -1);
  if (!replay) {
    career.failed[data.code] = (career.failed[data.code] || 0) + 1;
    career.buried[data.code] = Date.now();
    saveCareer(career);
  }
  clearProgress(data.code);
  resetProgress();
  renderCase();
  sfx('error');
  setTimeout(() => sfx('sello', 0.7), 250);
  state.pilePage = null;
  showView('home');
  openMedia({
    eyebrow: t('errorCabecera', data.code),
    title: t('errorTitulo', item.title),
    copy: `${data.wrongAccusation || t('errorPorDefecto')} ${replay ? t('errorRepeticion') : t('errorFondo')}`,
    meta: replay ? t('errorSinCambios') : careerLine(change, -1),
    action: true
  });
}

/* ---------- Ventana de examen / recompensa ---------- */
function openMedia({ eyebrow, title, subject = '', copy = '', media = [], meta = '', action = false }) {
  $('#media-eyebrow').textContent = eyebrow;
  $('#media-title').textContent = title;
  $('#media-subject').textContent = subject;
  $('#media-copy').textContent = copy;
  $('#media-meta').textContent = meta;
  $('#media-row').innerHTML = media.join('');
  $('#media-action').classList.toggle('hidden', !action);
  $('#media-pin').classList.add('hidden');
  $('#media-modal').classList.remove('hidden');
}

function examineEvidence(id) {
  const item = state.caseData.evidence.find((evidence) => evidence.id === id);
  if (!item) return;
  sfx(item.media?.kind === 'video' ? 'vhs' : 'papel');
  const media = item.doc ? `<div class="media-doc" role="button" aria-label="${escapeHtml(t('docAmpliado'))}">${docSvg(item.doc)}<span class="zoom-badge">${t('tocaAmpliar')}</span></div>` : mediaHtml(item.media);
  openMedia({ eyebrow: t('examen', item.type), title: item.title, copy: item.description, media: [media], meta: `${t('expediente')} ${state.caseData.code}` });
  $('#media-pin').dataset.pin = item.id;
  syncMediaPin(item.id);
  $('#media-pin').classList.remove('hidden');
  $('#media-row video')?.play().catch(() => {});
}

async function showReward() {
  const data = state.caseData;
  await prepareReward(data);
  const reward = data.reward;
  const subject = data.subject;
  let gain = '';
  if (!isSolved(data.code)) {
    const career = loadCareer();
    gain = ` · ${careerLine(changeSeals(career, 1), 1)}`;
    saveCareer(career);
  }
  saveCurrentCase();
  state.pilePage = null;
  sfx('sello', 0.9);
  setTimeout(() => sfx('resuelto', 0.6), 350);
  playMusic('final');
  openMedia({
    eyebrow: t('resueltoCabecera'),
    title: reward.title,
    subject: subject ? `${subject.name} · ${subject.role} · ${subject.period}` : '',
    copy: subject ? `${subject.details} ${reward.copy}` : reward.copy,
    media: data.rewardMedia.map((media) => mediaHtml(media)),
    meta: `${t('guardadoColeccion', reward.collection)}${gain}`,
    action: true
  });
  setNote(t('resueltoNota'), 'ok');
}

function syncMediaPin(id) {
  const button = $('#media-pin');
  if (button.dataset.pin !== id) return;
  const pinned = state.pinned.includes(id);
  button.textContent = pinned ? t('quitarPizarra') : t('clavarPizarra');
  button.classList.toggle('is-pinned', pinned);
}

/* ---------- Documentos: ninguna línea se sale del papel ----------
   El ancho real de la letra depende de la fuente del dispositivo; se mide cada línea ya dibujada
   y, si no cabe, se comprime lo justo (textLength). */
function fitDocSvg(svg) {
  const box = svg.viewBox?.baseVal;
  if (!box || !box.width || !svg.getBoundingClientRect().width) return false;
  svg.querySelectorAll('text').forEach((text) => {
    if (text.closest('.doc-stamp') || text.hasAttribute('textLength')) return;
    const length = text.getComputedTextLength();
    const x = parseFloat(text.getAttribute('x')) || 0;
    const middle = text.getAttribute('text-anchor') === 'middle';
    const room = middle ? Math.min(x, box.width - x) * 2 - 16 : box.width - x - 10;
    if (length > room && room > 20) {
      text.setAttribute('textLength', room.toFixed(1));
      text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  });
  svg.dataset.fit = '1';
  return true;
}

let fitQueued = false;
function fitAllDocs() {
  fitQueued = false;
  $$('.doc-svg:not([data-fit])').forEach(fitDocSvg);
}
function queueFitDocs() {
  if (fitQueued) return;
  fitQueued = true;
  requestAnimationFrame(() => requestAnimationFrame(fitAllDocs));
}

/* ---------- Visor de documentos: pantalla completa con zoom (pellizco, doble toque, botones) ---------- */
const docZoom = { scale: 1, fit: 1, base: 0, ratio: 1 };

function openDocZoom(html) {
  const page = $('#doc-zoom-page');
  page.innerHTML = html;
  const svg = page.querySelector('svg');
  const box = svg?.viewBox?.baseVal;
  docZoom.ratio = box && box.width ? box.height / box.width : 0.75;
  $('#doc-zoom').classList.remove('hidden');
  sfx('papel', 0.4);
  const scroller = $('#doc-zoom-scroll');
  // Escala 1 = el documento ocupa el ancho de la pantalla; «Ajustar» lo muestra entero.
  docZoom.base = Math.max(200, scroller.clientWidth - 24);
  docZoom.fit = Math.min(1, (scroller.clientHeight - 24) / (docZoom.base * docZoom.ratio));
  // Arranque cómodo: unas 600 px de ancho (letra 2-3 veces mayor que en el examen).
  setDocZoom(Math.max(docZoom.fit, Math.min(1, 600 / docZoom.base)));
  scroller.scrollTo(0, 0);
}

function closeDocZoom() {
  $('#doc-zoom').classList.add('hidden');
  $('#doc-zoom-page').innerHTML = '';
}

function setDocZoom(scale, clientX, clientY) {
  const scroller = $('#doc-zoom-scroll');
  const page = $('#doc-zoom-page');
  const next = Math.min(4, Math.max(docZoom.fit, scale));
  const rect = scroller.getBoundingClientRect();
  const cx = clientX === undefined ? rect.width / 2 : clientX - rect.left;
  const cy = clientY === undefined ? rect.height / 2 : clientY - rect.top;
  // Mantener bajo el dedo el mismo punto del documento.
  const px = (scroller.scrollLeft + cx) / Math.max(1, page.offsetWidth);
  const py = (scroller.scrollTop + cy) / Math.max(1, page.offsetHeight);
  docZoom.scale = next;
  page.style.width = `${docZoom.base * next}px`;
  scroller.scrollLeft = px * page.offsetWidth - cx;
  scroller.scrollTop = py * page.offsetHeight - cy;
}

function bindDocZoom() {
  const scroller = $('#doc-zoom-scroll');
  let pinch = null;
  let lastTap = 0;
  let moved = false;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  scroller.addEventListener('touchstart', (event) => {
    moved = false;
    if (event.touches.length === 2) pinch = { d: dist(event.touches), scale: docZoom.scale };
  }, { passive: true });
  scroller.addEventListener('touchmove', (event) => {
    moved = true;
    if (!pinch || event.touches.length !== 2) return;
    event.preventDefault();
    const [a, b] = event.touches;
    setDocZoom(pinch.scale * dist(event.touches) / pinch.d, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
  }, { passive: false });
  scroller.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) pinch = null;
    if (moved || event.touches.length) return;
    const now = Date.now();
    if (now - lastTap < 320) {
      const t = event.changedTouches[0];
      setDocZoom(docZoom.scale < 1.6 ? 2.2 : 1, t.clientX, t.clientY);
      lastTap = 0;
    } else lastTap = now;
  });
  scroller.addEventListener('dblclick', (event) => setDocZoom(docZoom.scale < 1.6 ? 2.2 : 1, event.clientX, event.clientY));
  scroller.addEventListener('wheel', (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setDocZoom(docZoom.scale * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX, event.clientY);
  }, { passive: false });
  $('#doc-zoom').addEventListener('click', (event) => {
    const button = event.target.closest('[data-zoom]');
    if (button) {
      const step = Number(button.dataset.zoom);
      setDocZoom(step === 0 ? docZoom.fit : docZoom.scale * (step > 0 ? 1.4 : 1 / 1.4));
    }
    if (event.target.closest('.doc-zoom-close')) closeDocZoom();
  });
}

function closeModals() {
  closeDocZoom();
  $$('.modal-backdrop').forEach((modal) => modal.classList.add('hidden'));
  $$('.modal-backdrop video').forEach((video) => video.pause());
}

async function renderCollection() {
  const solved = state.cases.filter((item) => isSolved(item.code));
  $('#collection-count').textContent = solved.length;
  await Promise.all(solved.map(prepareReward));
  $('#collection-grid').innerHTML = solved.length
    ? solved.map((item) => `<article class="collection-item">
        <span class="label">${escapeHtml(item.code)} · ${escapeHtml(item.reward.collection)}</span>
        <h3>${escapeHtml(item.reward.title)}</h3>
        <div class="collection-media">${item.rewardMedia.map((media) => mediaHtml(media)).join('')}</div>
      </article>`).join('')
    : `<div class="empty-collection"><p>${t('coleccionVacia')}</p><small>${t('coleccionVaciaPista')}</small></div>`;
}

/* ---------- Eventos ---------- */
function bindEvents() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('#doc-zoom')) return;
    const pin = event.target.closest('[data-pin]');
    if (pin) return togglePin(pin.dataset.pin);
    const tab = event.target.closest('[data-section]');
    if (tab) { state.section = tab.dataset.section; sfx('click', 0.5); saveProgress(); return renderSection(); }
    const go = event.target.closest('[data-go]');
    if (go && !go.disabled) return showView(go.dataset.go);
    const turn = event.target.closest('[data-pile]');
    if (turn && !turn.disabled) return turnPile(Number(turn.dataset.pile));
    const folder = event.target.closest('.pile-folder');
    if (folder) return openCase(Number(folder.dataset.caseIndex));
    const evidence = event.target.closest('.evidence-card');
    if (evidence) return examineEvidence(evidence.dataset.id);
    const boardItem = event.target.closest('.board-card');
    if (boardItem) return selectEvidence(boardItem.dataset.id);
    const doc = event.target.closest('.media-doc');
    if (doc) return openDocZoom(doc.querySelector('svg')?.outerHTML || '');
    if (event.target.closest('.modal-close') || event.target.classList.contains('modal-backdrop')) closeModals();
  });
  document.addEventListener('dblclick', (event) => {
    const boardItem = event.target.closest('.board-card');
    if (boardItem) examineEvidence(boardItem.dataset.id);
  });
  document.addEventListener('keydown', (event) => {
    if (!$('#title-screen').classList.contains('hidden')) return;
    if (event.key === 'Escape' && !$('#doc-zoom').classList.contains('hidden')) return closeDocZoom();
    if (event.key === 'Escape') { armStamp(false); return closeModals(); }
    if (state.view === 'home' && $('#collection-modal').classList.contains('hidden') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const button = $(event.key === 'ArrowLeft' ? '#pile-prev' : '#pile-next');
      if (!$('#pile-nav').classList.contains('hidden') && !button.disabled) turnPile(event.key === 'ArrowLeft' ? -1 : 1);
    }
    if (event.key === 'Enter' && event.target.matches('.evidence-card, .board-card')) event.target.click();
  });
  $('#board-btn').addEventListener('click', () => showView('board'));
  $('#start-btn').addEventListener('click', startGame);
  $('#title-collection').addEventListener('click', () => { startGame(); $('#collection-btn').click(); });
  $('#sound-btn').addEventListener('click', toggleSound);
  $('#exit-btn').addEventListener('click', backToTitle);
  $('#brand-btn').addEventListener('click', backToTitle);
  $('#quit-btn').addEventListener('click', quitGame);
  // Cambiar de idioma recarga: así casos, textos e imágenes salen en el idioma nuevo.
  $('#lang-btn')?.addEventListener('click', () => { cambiarIdioma(idioma() === 'en' ? 'es' : 'en'); location.reload(); });
  $('#solve-btn').addEventListener('click', solveHypothesis);
  $('#stamp-btn').addEventListener('click', () => armStamp());
  $('#reset-btn').addEventListener('click', resetCase);
  $('#media-action').addEventListener('click', () => { closeModals(); showView('home'); });
  $('#collection-btn').addEventListener('click', async () => { await renderCollection(); $('#collection-modal').classList.remove('hidden'); });
  bindBoardDrag();
  bindDocZoom();
  // Ajustar documentos cuando aparecen o se hacen visibles, y cuando terminan de cargar las fuentes.
  new MutationObserver(queueFitDocs).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.fonts?.ready.then(() => { $$('.doc-svg[data-fit]').forEach((svg) => delete svg.dataset.fit); queueFitDocs(); });
  window.addEventListener('resize', () => { layoutBoard(); drawLines(); });
  window.addEventListener('pagehide', saveProgress);
}

init().catch((error) => { document.body.innerHTML = `<p style="padding:2rem;font-family:monospace;color:#eee">${escapeHtml(t('noCarga', error.message))}</p>`; });
