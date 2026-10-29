// Prueba un juego como en un TELÉFONO (pantalla táctil emulada) en Chrome sin ventana, por el protocolo de DevTools.
// Basado en Retorno-al-Reino/herramientas/probar.mjs. Por defecto 844×390 (horizontal); ANCHO/ALTO lo cambian.
// Uso: node tools/probar_movil.mjs <url> <pasos.json> [carpeta de capturas]
// Pasos: {"esperar": 2} {"js": "..."} {"captura": "nombre"} {"tecla": "Space"}
//        {"toque": [x, y]}                         toque corto con un dedo
//        {"arrastre": [x1, y1, x2, y2], "ms": 600} arrastrar un dedo
//        {"mantener": [x1, y1, x2, y2], "ms": 1500, "toques": [[x, y], …]}  un dedo arrastra y lo deja apretado
//                                                   (palanca) mientras otro dedo da los toques indicados
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, archivoPasos, salida = join(tmpdir(), 'retorno-capturas')] = process.argv.slice(2);
const pasos = JSON.parse(readFileSync(archivoPasos, 'utf8'));
mkdirSync(salida, { recursive: true });
const perfil = mkdtempSync(join(tmpdir(), 'movil-chrome-'));
const puerto = 9300 + Math.floor(Math.random() * 400);
const ancho = +(process.env.ANCHO || 844), alto = +(process.env.ALTO || 390);
const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`,
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
  `--window-size=${ancho},${alto}`, '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const dormir = (ms) => new Promise(r => setTimeout(r, ms));

let ws, id = 0;
const pendientes = new Map();
function enviar(method, params = {}) {
  return new Promise((ok, mal) => {
    const n = ++id;
    pendientes.set(n, { ok, mal });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
}

try {
  let paginas;
  for (let i = 0; i < 50; i++) {
    try { paginas = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json(); break; } catch { await dormir(200); }
  }
  const pagina = paginas.find(p => p.type === 'page');
  ws = new WebSocket(pagina.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pendientes.has(m.id)) {
      const p = pendientes.get(m.id); pendientes.delete(m.id);
      m.error ? p.mal(new Error(m.error.message)) : p.ok(m.result);
    } else if (m.method === 'Runtime.consoleAPICalled') {
      const t = m.params.args.map(a => a.value ?? a.description ?? '').join(' ');
      if (['error', 'warning'].includes(m.params.type) || process.env.TODO) console.log(`[consola ${m.params.type}] ${t}`);
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      console.log(`[EXCEPCIÓN] ${d.exception?.description ?? d.text} (${d.url ?? ''}:${d.lineNumber})`);
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      console.log(`[log] ${m.params.entry.text} ${m.params.entry.url ?? ''}`);
    }
  });
  await enviar('Runtime.enable');
  await enviar('Log.enable');
  await enviar('Page.enable');
  await enviar('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: true });
  await enviar('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await enviar('Page.navigate', { url });
  const CODIGOS = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32, ShiftLeft: 16, KeyE: 69, Escape: 27, KeyD: 68, KeyA: 65 };
  const tecla = (type, code) => enviar('Input.dispatchKeyEvent', { type, code, key: code === 'Space' ? ' ' : code.replace(/^Key/, '').toLowerCase(), windowsVirtualKeyCode: CODIGOS[code] ?? 0 });
  for (const p of pasos) {
    if (p.esperar) await dormir(p.esperar * 1000);
    if (p.js) {
      const r = await enviar('Runtime.evaluate', { expression: p.js, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) console.log('[js error]', r.exceptionDetails.exception?.description);
      else if (r.result.value !== undefined) console.log('[js]', JSON.stringify(r.result.value));
    }
    if (p.tecla) {
      const teclas = [].concat(p.tecla);
      for (const k of teclas) await tecla('keyDown', k);
      await dormir(p.ms ?? 100);
      for (const k of teclas.reverse()) await tecla('keyUp', k);
    }
    const tp = (type, puntos) => enviar('Input.dispatchTouchEvent', { type, touchPoints: puntos.map(([x, y], i) => ({ x, y, id: i + 1, radiusX: 8, radiusY: 8, force: 1 })) });
    if (p.toque) { await tp('touchStart', [p.toque]); await dormir(80); await tp('touchEnd', []); }
    if (p.arrastre || p.mantener) {
      const [x1, y1, x2, y2] = p.arrastre || p.mantener, n = 12, ms = p.ms ?? 600;
      await tp('touchStart', [[x1, y1]]);
      for (let i = 1; i <= n; i++) { await dormir(ms / n / 2); await tp('touchMove', [[x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]]); }
      for (const t of p.toques || []) { await tp('touchStart', [[x2, y2], t]); await dormir(90); await tp('touchEnd', [[x2, y2]]); await dormir(120); }
      if (p.mantener) { const fin = Date.now() + ms / 2; while (Date.now() < fin) { await dormir(100); await tp('touchMove', [[x2, y2]]); } }
      await tp('touchEnd', []);
    }
    if (p.clic) {
      const [x, y] = p.clic;
      for (const type of ['mousePressed', 'mouseReleased']) await enviar('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
    if (p.captura) {
      const r = await enviar('Page.captureScreenshot', { format: 'png' });
      const f = join(salida, p.captura + '.png');
      writeFileSync(f, Buffer.from(r.data, 'base64'));
      console.log('[captura]', f);
    }
  }
} finally {
  chrome.kill();
  await dormir(500);
  rmSync(perfil, { recursive: true, force: true });   // el perfil de Chrome ocupa bastante: no dejarlo en /tmp
}
process.exit(0);
