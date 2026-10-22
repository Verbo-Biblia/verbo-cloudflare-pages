(() => {
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const Cap = window.Capacitor;
const Plugins = (Cap && Cap.Plugins) || {};
const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

// ───────── Bancos de preguntas por idioma ─────────
// Los ids son los mismos en ambos idiomas, así el progreso se comparte al cambiar de idioma.
const SOURCES = {
  facil:   { es: window.PREGUNTAS_FACIL,   en: window.QUESTIONS_EASY_EN,       p: "f" },
  dificil: { es: window.PREGUNTAS_DIFICIL, en: window.QUESTIONS_HARD_EN,       p: "d" },
  teologo: { es: window.PREGUNTAS_TEOLOGO, en: window.QUESTIONS_THEOLOGIAN_EN, p: "t" },
};
function buildBank(mode, lang) {
  const src = SOURCES[mode];
  return src.es.map((q, i) => {
    const base = { id: src.p + i, mode, correct: q.correct };
    if (lang !== "en") return { ...base, section: q.section, q: q.q, a: q.a, ex: q.ex, refs: q.refs };
    const [section, text, a, ex, refTexts] = src.en[i];
    return { ...base, section, q: text, a, ex, refs: q.refs.map((r, k) => [I18N.cite(r[0], "en"), refTexts[k]]) };
  });
}
let BANKS = {};
function buildBanks(lang) {
  BANKS = {};
  Object.keys(SOURCES).forEach(m => BANKS[m] = { list: buildBank(m, lang) });
  BANKS.mixto = { list: [].concat(...Object.keys(SOURCES).map(m => BANKS[m].list)) };
}

// ───────── Almacenamiento ─────────
const KEY = "lasenda.v1";
const store = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  return {
    get: (k, def) => (k in d ? d[k] : def),
    set(k, v) { d[k] = v; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} },
    clear() { d = {}; try { localStorage.removeItem(KEY); } catch {} },
  };
})();
const settings = () => ({ lang: I18N.detect(), music: true, sound: true, haptic: true, font: 0, round: 10, ...store.get("settings", {}) });
const setSetting = (k, v) => store.set("settings", { ...settings(), [k]: v });
const t = () => I18N.T[settings().lang] || I18N.T.es;
const stats = () => ({ games: 0, answered: 0, correct: 0, bestStreak: 0, ...store.get("stats", {}) });

// ───────── Utilidades ─────────
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const LETTERS = ["A", "B", "C", "D"];

function buzz(ok) {
  if (!settings().haptic) return;
  try {
    if (Plugins.Haptics) ok ? Plugins.Haptics.impact({ style: "LIGHT" }) : Plugins.Haptics.vibrate({ duration: 180 });
    else if (navigator.vibrate) navigator.vibrate(ok ? 25 : [60, 50, 60]);
  } catch {}
}

// ───────── Audio: música de fondo y efectos ─────────
// WebAudio para que la música se repita sin huecos y los efectos suenen sin retraso.
const Sound = (() => {
  const FX = ["correcto", "racha", "incorrecto", "toque", "cerrar", "pagina", "barajar", "victoria", "final"];
  const FX_VOL = { toque: 0.5, cerrar: 0.5, pagina: 0.6, barajar: 0.5 };
  const MUSIC_VOL = 0.32;
  let ctx, musicGain, fxGain, musicBuf, musicSrc, wantMusic = false;
  const bufs = {}, fallback = {};

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(ctx.destination);
      fxGain = ctx.createGain(); fxGain.gain.value = 0.8; fxGain.connect(ctx.destination);
      FX.forEach(n => load(`audio/fx/${n}.mp3`).then(b => bufs[n] = b).catch(() => {}));
      load("audio/musica.ogg").then(b => { musicBuf = b; if (wantMusic) startMusic(); }).catch(() => {});
    } catch {}
  }
  async function load(url) {
    const r = await fetch(url);
    return await ctx.decodeAudioData(await r.arrayBuffer());
  }
  function startMusic() {
    if (!ctx || !musicBuf || musicSrc) return;
    ctx.resume();
    musicSrc = ctx.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
    musicSrc.connect(musicGain); musicSrc.start();
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(MUSIC_VOL, t + 2.5);
  }
  function stopMusic(fade = 0.6) {
    if (!musicSrc) return;
    const src = musicSrc, t = ctx.currentTime; musicSrc = null;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => { try { src.stop(); } catch {} }, fade * 1000 + 50);
  }
  return {
    unlock() { init(); if (ctx && ctx.state === "suspended") ctx.resume(); this.music(); },
    music() {
      wantMusic = settings().music && !document.hidden;
      if (wantMusic) startMusic(); else stopMusic();
    },
    pause() { wantMusic = false; stopMusic(0.3); },
    fx(name) {
      if (!settings().sound) return;
      const vol = FX_VOL[name] || 1;
      if (ctx && bufs[name]) {
        if (ctx.state === "suspended") ctx.resume();
        const s = ctx.createBufferSource(), g = ctx.createGain();
        g.gain.value = vol; s.buffer = bufs[name]; s.connect(g).connect(fxGain); s.start();
      } else {
        // Respaldo (p. ej. al abrir el HTML directamente desde el disco)
        try { const a = fallback[name] || (fallback[name] = new Audio(`audio/fx/${name}.mp3`)); a.volume = vol * 0.8; a.currentTime = 0; a.play(); } catch {}
      }
    },
  };
})();
// El sistema solo permite reproducir audio después de un toque del usuario.
document.addEventListener("pointerdown", () => Sound.unlock(), { once: true });
document.addEventListener("visibilitychange", () => document.hidden ? Sound.pause() : Sound.music());

function applyFont() { document.documentElement.style.setProperty("--fs", [1, 1.1, 1.22][settings().font] || 1); }


// ───────── Navegación ─────────
let current = "home";
function show(id) {
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  current = id;
}
const openSheets = () => $$(".sheet.open");
function openSheet(el) { Sound.fx("toque"); el.classList.add("open"); el.setAttribute("aria-hidden", "false"); }
function closeSheet(el) { if (el.classList.contains("open")) Sound.fx("cerrar"); el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
$$(".sheet").forEach(s => s.addEventListener("click", e => { if (e.target === s) closeSheet(s); }));

function confirmDialog(title, text, yes, no) {
  return new Promise(res => {
    $("#dialogTitle").textContent = title; $("#dialogText").textContent = text;
    $("#dialogYes").textContent = yes; $("#dialogNo").textContent = no;
    const d = $("#dialog");
    const done = v => { closeSheet(d); $("#dialogYes").onclick = $("#dialogNo").onclick = null; res(v); };
    $("#dialogYes").onclick = () => done(true);
    $("#dialogNo").onclick = () => done(false);
    openSheet(d);
  });
}

// ───────── Idioma ─────────
function applyLang() {
  const lang = settings().lang, T = t();
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => { el.textContent = T[el.dataset.i18n]; });
  $$("#langToggle button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  $("#openSettings").setAttribute("aria-label", T.settings);
  $("#quit").setAttribute("aria-label", T.quit);
  buildBanks(lang);
}
$$("#langToggle button").forEach(b => b.onclick = () => {
  if (settings().lang === b.dataset.lang) return;
  Sound.fx("toque"); setSetting("lang", b.dataset.lang); applyLang(); renderHome();
});

// ───────── Inicio ─────────
function renderHome() {
  const s = stats();
  const pct = s.answered ? Math.round(100 * s.correct / s.answered) + "%" : "—";
  $("#homeStats").innerHTML =
    `<div class="stat"><b>${s.games}</b><span>${t().games}</span></div>` +
    `<div class="stat"><b>${pct}</b><span>${t().accuracy}</span></div>` +
    `<div class="stat"><b>${s.bestStreak}</b><span>${t().bestStreak}</span></div>`;
  $("#countFacil").textContent = BANKS.facil.list.length;
  $("#countDificil").textContent = BANKS.dificil.list.length;
  $("#countTeologo").textContent = BANKS.teologo.list.length;
  $("#countMixto").textContent = BANKS.mixto.list.length;
  const r = String(settings().round);
  $$("#roundSize button").forEach(b => b.classList.toggle("on", b.dataset.n === r));
}
$$("#roundSize button").forEach(b => b.onclick = () => { setSetting("round", +b.dataset.n); renderHome(); });
$$(".mode").forEach(b => b.onclick = () => startGame(b.dataset.mode));

// ───────── Selección de preguntas ─────────
// Prioriza preguntas que aún no has visto; cuando se agotan, el ciclo vuelve a empezar.
function pickQuestions(mode, n) {
  const list = BANKS[mode].list;
  const seen = new Set(store.get("seen", []));
  let fresh = shuffle(list.filter(q => !seen.has(q.id)));
  const old = shuffle(list.filter(q => seen.has(q.id)));
  if (!n || n > list.length) n = list.length;
  if (fresh.length < n) {
    // reinicia el ciclo de este modo
    store.set("seen", [...seen].filter(id => !list.some(q => q.id === id)));
    fresh = fresh.concat(old);
  }
  return fresh.slice(0, n);
}
function markSeen(id) {
  const seen = store.get("seen", []);
  if (!seen.includes(id)) { seen.push(id); store.set("seen", seen); }
}

// ───────── Juego ─────────
let G = null;
function startGame(mode) {
  Sound.fx("barajar");
  G = { mode, qs: pickQuestions(mode, settings().round), i: 0, score: 0, streak: 0, best: 0, wrong: [], answered: false };
  show("game");
  renderQ();
}

function renderQ() {
  const q = G.qs[G.i];
  G.answered = false;
  G.order = shuffle(q.a.map((_, n) => n));
  $("#counter").textContent = t().question(G.i + 1, G.qs.length);
  $("#progress").style.width = `${(G.i / G.qs.length) * 100}%`;
  $("#scorePill").textContent = G.score;
  $("#section").textContent = q.section;
  $("#question").textContent = q.q;
  // Si alguna opción menciona una cita (p. ej. «Isaías 7:14»), mostrar la cita antes de responder delataría la respuesta.
  const books = q.refs.map(r => r[0].replace(/\s+\d[\d:,\-–]*$/, ""));
  const giveaway = q.a.some(txt => books.some(b => new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+\\d").test(txt)));
  $("#refline").textContent = giveaway ? "" : "📖 " + q.refs.map(r => r[0]).join(" · ");
  $("#feedback").className = "feedback";
  $("#dock").className = "dock";
  const box = $("#answers"); box.innerHTML = "";
  G.order.forEach((orig, pos) => {
    const b = document.createElement("button");
    b.className = "answer";
    b.innerHTML = `<span class="badge">${LETTERS[pos]}</span><span class="t"></span>`;
    b.querySelector(".t").textContent = q.a[orig];
    b.onclick = () => choose(orig, b);
    box.appendChild(b);
  });
  $("#gameScroll").scrollTop = 0;
}

function choose(orig, btn) {
  if (G.answered) return;
  G.answered = true;
  const q = G.qs[G.i], ok = orig === q.correct;
  const btns = $$(".answer");
  const correctPos = G.order.indexOf(q.correct);
  btns.forEach((b, pos) => {
    b.disabled = true;
    if (pos === correctPos) b.classList.add("correct");
    else if (b !== btn) b.classList.add("faded");
  });

  const s = stats(); s.answered++;
  if (ok) {
    G.score++; G.streak++; G.best = Math.max(G.best, G.streak); s.correct++;
    $("#scorePill").textContent = G.score;
    $("#scorePill").classList.remove("bump"); void $("#scorePill").offsetWidth; $("#scorePill").classList.add("bump");
  } else {
    btn.classList.add("wrong");
    G.streak = 0;
    G.wrong.push(q);
  }
  s.bestStreak = Math.max(s.bestStreak, G.best);
  store.set("stats", s);
  markSeen(q.id);
  Sound.fx(ok ? (G.streak >= 3 && G.streak % 3 === 0 ? "racha" : "correcto") : "incorrecto"); buzz(ok);

  const st = $("#streak");
  st.textContent = G.streak >= 3 ? t().streak(G.streak) : "";
  st.classList.toggle("show", G.streak >= 3);

  $("#result").className = "result " + (ok ? "ok" : "no");
  $("#result").textContent = ok ? t().correct : t().wrong;
  const ca = $("#correctAnswer");
  ca.className = "correct-answer" + (ok ? "" : " show");
  ca.textContent = ok ? "" : `${t().correctAnswer}: ${LETTERS[correctPos]}. ${q.a[q.correct]}`;
  $("#explanation").textContent = q.ex;
  $("#quoteRef").textContent = q.refs[0][0];
  $("#quoteText").textContent = q.refs[0][1];
  const refs = $("#refs"); refs.innerHTML = "";
  q.refs.forEach(r => {
    const b = document.createElement("button");
    b.className = "ref"; b.textContent = "📖 " + r[0];
    b.onclick = () => openVerse(r);
    refs.appendChild(b);
  });
  $("#feedback").className = "feedback show";
  $("#next").textContent = G.i < G.qs.length - 1 ? t().next : t().seeResult;
  $("#dock").className = "dock show";
  $("#progress").style.width = `${((G.i + 1) / G.qs.length) * 100}%`;
  setTimeout(() => $("#feedback").scrollIntoView({ behavior: "smooth", block: "start" }), 120);
}

function openVerse(r) {
  Sound.fx("pagina");
  $("#sheetTitle").textContent = r[0];
  $("#sheetText").textContent = r[1];
  openSheet($("#sheet"));
}
$("#sheetClose").onclick = () => closeSheet($("#sheet"));

$("#next").onclick = () => {
  if (!G.answered) return;
  if (G.i < G.qs.length - 1) { Sound.fx("toque"); G.i++; renderQ(); } else finish();
};

async function quitGame() {
  if (G && G.i === 0 && !G.answered) { show("home"); renderHome(); return; }
  const T = t(), leave = await confirmDialog(T.quitTitle, T.quitText, T.quitYes, T.quitNo);
  if (leave) { G = null; show("home"); renderHome(); }
}
$("#quit").onclick = quitGame;

// ───────── Resultados ─────────
function finish() {
  const s = stats(); s.games++; store.set("stats", s);
  const total = G.qs.length, pct = Math.round(100 * G.score / total);
  show("results");
  setTimeout(() => Sound.fx(pct >= 70 ? "victoria" : "final"), 350);
  $("#pct").textContent = pct + "%";
  $("#frac").textContent = t().of(G.score, total);
  const fg = $("#ringFg");
  fg.style.transition = "none"; fg.style.strokeDashoffset = 326.7; void fg.getBoundingClientRect();
  fg.style.transition = ""; fg.style.strokeDashoffset = 326.7 * (1 - pct / 100);

  const [title, sub] = pct === 100 ? t().res100 : pct >= 80 ? t().res80 : pct >= 50 ? t().res50 : t().res0;
  $("#resTitle").textContent = title;
  $("#resSub").textContent = sub;
  $("#resStats").innerHTML =
    `<div class="stat"><b>${G.score}</b><span>${t().rCorrect}</span></div>` +
    `<div class="stat"><b>${total - G.score}</b><span>${t().rWrong}</span></div>` +
    `<div class="stat"><b>${G.best}</b><span>${t().bestStreak}</span></div>`;

  const rv = $("#review"); rv.innerHTML = "";
  if (G.wrong.length) {
    const h = document.createElement("h3"); h.textContent = t().review; rv.appendChild(h);
    G.wrong.forEach(q => {
      const d = document.createElement("div"); d.className = "rv";
      d.innerHTML = `<div class="rq"></div><div class="ra"></div><button class="rr"></button>`;
      d.querySelector(".rq").textContent = q.q;
      d.querySelector(".ra").textContent = q.a[q.correct];
      const r = d.querySelector(".rr"); r.textContent = "📖 " + q.refs.map(x => x[0]).join(" · ");
      r.onclick = () => openVerse(q.refs[0]);
      rv.appendChild(d);
    });
  }
  $("#results .scroll").scrollTop = 0;
}
$("#toHome").onclick = () => { G = null; show("home"); renderHome(); };
$("#again").onclick = () => startGame(G.mode);

// ───────── Ajustes ─────────
function renderSettings() {
  const s = settings();
  $("#optMusic").checked = s.music;
  $("#optSound").checked = s.sound;
  $("#optHaptic").checked = s.haptic;
  $$("#optFont button").forEach(b => b.classList.toggle("on", +b.dataset.f === s.font));
}
$("#openSettings").onclick = () => { renderSettings(); openSheet($("#settings")); };
$("#settingsClose").onclick = () => closeSheet($("#settings"));
$("#optMusic").onchange = e => { setSetting("music", e.target.checked); Sound.music(); };
$("#optSound").onchange = e => setSetting("sound", e.target.checked);
$("#optHaptic").onchange = e => setSetting("haptic", e.target.checked);
$$("#optFont button").forEach(b => b.onclick = () => { setSetting("font", +b.dataset.f); applyFont(); renderSettings(); });
$("#resetProgress").onclick = async () => {
  closeSheet($("#settings"));
  const T = t(), ok = await confirmDialog(T.resetTitle, T.resetText, T.resetYes, T.cancel);
  if (ok) { const s = settings(); store.clear(); store.set("settings", s); renderHome(); }
};

// ───────── Android: botón Atrás, barra de estado ─────────
if (isNative) {
  const { App, StatusBar, SplashScreen } = Plugins;
  App && App.addListener("pause", () => Sound.pause());
  App && App.addListener("resume", () => Sound.music());
  App && App.addListener("backButton", () => {
    const open = openSheets();
    if (open.length) {
      if (open.some(s => s.id === "dialog")) $("#dialogNo").click();
      else open.forEach(closeSheet);
      return;
    }
    if (current === "game") quitGame();
    else if (current === "results") { G = null; show("home"); renderHome(); }
    else App.exitApp();
  });
  try { StatusBar && StatusBar.setStyle({ style: "DARK" }); } catch {}
  try { StatusBar && StatusBar.setBackgroundColor({ color: "#06101d" }); } catch {}
  setTimeout(() => { try { SplashScreen && SplashScreen.hide(); } catch {} }, 250);
}

applyFont();
applyLang();
renderHome();
})();
