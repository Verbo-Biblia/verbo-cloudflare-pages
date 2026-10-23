// Reto «¡Dilo en voz alta!»: escucha al alumno, compara lo que entendió el reconocedor con la frase esperada y
// guarda su voz para que la oiga junto a la nativa.
// En el APK usa el puente nativo (Android.escuchar → HABLAR_RESP). En Chrome, webkitSpeechRecognition + MediaRecorder.
// Resultado: { alternativas: [{ t, c }], audio: url | null, error: null | 'permiso' | 'nada' | 'red' | 'otro' }
'use strict';

const Hablar = (() => {
  const pend = {};
  let sec = 0;
  window.HABLAR_ESTADO = (id, e) => pend[id] && pend[id].estado(e);
  window.HABLAR_RESP = (id, json) => { const p = pend[id]; if (!p) return; delete pend[id]; p.ok(JSON.parse(json)); };
  const nativo = () => !!(window.Android && Android.escuchar);
  const Web = window.SpeechRecognition || window.webkitSpeechRecognition;

  function disponible() {
    if (nativo()) { try { return Android.puedeEscuchar(); } catch (e) { return false; } }
    return !!Web && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  function escuchar(estado = () => {}) {
    if (nativo()) return new Promise(ok => { const id = ++sec; pend[id] = { ok, estado }; Android.escuchar(id); });
    return escucharWeb(estado);
  }
  async function escucharWeb(estado) {
    let stream = null, rec = null;
    const trozos = [];
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(stream);
      rec.ondataavailable = e => trozos.push(e.data);
      rec.start();
    } catch (e) {
      if (e.name === 'NotAllowedError') return { alternativas: [], audio: null, error: 'permiso' };
    }
    return new Promise(ok => {
      const R = new Web();
      R.lang = 'en-US'; R.maxAlternatives = 5; R.interimResults = false; R.continuous = false;
      let alts = [], err = null;
      R.onstart = () => estado('escuchando');
      R.onspeechend = () => estado('procesando');
      R.onresult = e => { alts = [...e.results[0]].map(a => ({ t: a.transcript, c: a.confidence })); };
      R.onerror = e => {
        err = { 'not-allowed': 'permiso', 'service-not-allowed': 'permiso', 'no-speech': 'nada', network: 'red' }[e.error] || 'otro';
      };
      R.onend = () => {
        const fin = audio => {
          if (stream) stream.getTracks().forEach(t => t.stop());
          ok({ alternativas: alts, audio, error: alts.length ? null : err || 'nada' });
        };
        if (rec && rec.state !== 'inactive') {
          rec.onstop = () => fin(trozos.length ? URL.createObjectURL(new Blob(trozos, { type: rec.mimeType })) : null);
          rec.stop();
        } else fin(null);
      };
      try { R.start(); } catch (e) { err = 'otro'; R.onend(); }
    });
  }

  // ---------- Evaluación ----------
  // Palabras que suenan igual: el reconocedor escribe la que le parece, no la que dijiste.
  const IGUALES = [['to', 'two', 'too', '2'], ['for', 'four', '4'], ['one', 'won', '1'], ['son', 'sun'], ['no', 'know'],
    ['i', 'eye'], ['right', 'write'], ['see', 'sea'], ['be', 'bee'], ['by', 'buy', 'bye'], ['here', 'hear'],
    ['there', 'their'], ['new', 'knew'], ['in', 'inn'], ['red', 'read'], ['made', 'maid'], ['peace', 'piece'],
    ['prophet', 'profit'], ['week', 'weak'], ['eight', 'ate', '8'], ['our', 'hour'], ['would', 'wood'],
    ['flower', 'flour'], ['grey', 'gray'], ['ok', 'okay'], ['color', 'colour']];
  const GRUPO = {};
  IGUALES.forEach((g, k) => g.forEach(w => { GRUPO[w] = k; }));
  const CONTR = { "he's": 'he is', "she's": 'she is', "it's": 'it is', "that's": 'that is', "you're": 'you are',
    "they're": 'they are', "i'm": 'i am', "we're": 'we are', "what's": 'what is', "there's": 'there is' };
  const palabras = s => normal(s).replace(/[’`]/g, "'").split(' ').filter(Boolean)
    .flatMap(w => (CONTR[w] || w).split(' ')).map(w => w.replace(/'/g, ''));
  const igual = (a, b) => a === b || (GRUPO[a] !== undefined && GRUPO[a] === GRUPO[b]);
  // Alinea lo dicho con lo esperado (subsecuencia común más larga) y marca cada palabra esperada.
  function marcar(esp, dicho) {
    const n = esp.length, m = dicho.length, T = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      T[i][j] = igual(esp[i], dicho[j]) ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
    const ok = new Array(n).fill(false);
    for (let i = 0, j = 0; i < n && j < m;) {
      if (igual(esp[i], dicho[j])) { ok[i] = true; i++; j++; } else if (T[i + 1][j] >= T[i][j + 1]) i++; else j++;
    }
    return ok;
  }
  function evaluar(esperado, alternativas) {
    const esp = palabras(esperado);
    let mejor = { marcas: esp.map(() => false), nota: 0, dicho: '' };
    for (const a of alternativas) {
      const marcas = marcar(esp, palabras(a.t));
      const nota = marcas.filter(Boolean).length / (esp.length || 1);
      if (nota > mejor.nota) mejor = { marcas, nota, dicho: a.t };
    }
    // Una o dos palabras: tienen que salir todas. Frases: basta con tres de cada cuatro.
    mejor.bien = esp.length <= 2 ? mejor.nota === 1 : mejor.nota >= 0.75;
    mejor.esp = palabrasDe(esperado);
    return mejor;
  }
  return { disponible, escuchar, evaluar };
})();
