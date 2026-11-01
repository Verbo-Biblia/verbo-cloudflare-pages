// Medición propia de verbobiblia.com y panel privado de Juan.
//
// POST /v1/m          lotes de eventos de /assets/medir.js (anónimos: id al azar del navegador, sin IP ni cookies).
// GET  /panel         panel privado (pide la clave PANEL_CLAVE, un secreto del Worker:
//                     `npx wrangler secret put PANEL_CLAVE`); la sesión queda en una cookie firmada por 30 días.
// GET  /panel/datos   resúmenes en JSON (?dias=1|7|28|90, opcional &hasta=ms)   ·   GET /panel/sesion?id=…  recorrido de una sesión
// Tabla: medicion.sql (base VOTOS_DB). La IP solo se usa para limitar envíos, nunca se guarda.
// Límites: la Cache API no funciona en *.workers.dev, donde se publica este Worker. Los envíos se limitan con el
// binding de Rate Limiting LIMITE_MEDIR (wrangler.toml) y los intentos de clave del panel, en SYNC_KV por una hora.
// Los días del panel son de Costa Rica (UTC-6 fijo, sin horario de verano): dias=N cuenta desde la medianoche
// de Costa Rica de hace N-1 días. La columna `dia` de la tabla (UTC) no se usa.

const INTENTOS_POR_HORA = 10;
const TIPOS = new Set(['vista', 'fin', 'clic', 'descarga', 'salida', 'juego', 'juego_fin', 'juego_etapa', 'voto', 'busqueda', 'imprimir']);
const ID = /^[a-z0-9]{8,40}$/;

async function sha(texto) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const corto = (v, n) => (v == null ? null : String(v).slice(0, n));

export async function handleMedir(request, env, headers) {
  const vacio = new Response(null, { status: 204, headers });
  if (request.method !== 'POST' || !env.VOTOS_DB) return vacio;
  if (/bot|crawl|spider|headless|lighthouse/i.test(request.headers.get('User-Agent') || '')) return vacio;
  let lote;
  try { lote = JSON.parse(await request.text()); } catch { return vacio; }
  if (!lote || !ID.test(lote.v || '')) return vacio;
  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  if (env.LIMITE_MEDIR && !(await env.LIMITE_MEDIR.limit({ key: ip })).success) return vacio;
  // Un aparato de Juan (abrió verbobiblia.com/?no-medir): medir.js avisa una vez y el panel deja de contarlo,
  // también lo que ese aparato visitó antes. Quien lo haga con su propio id solo se excluye a sí mismo.
  if (lote.yo === 1) {
    await env.VOTOS_DB.prepare('INSERT OR IGNORE INTO yo (visitante, desde) VALUES (?, ?)')
      .bind((await sha(`v:${lote.v}`)).slice(0, 20), Date.now()).run();
    return vacio;
  }
  if (!ID.test(lote.s || '') || !Array.isArray(lote.e)) return vacio;

  const eventos = lote.e.slice(0, 50).filter(x => x && TIPOS.has(x.tipo));
  if (!eventos.length) return vacio;

  const visitante = (await sha(`v:${lote.v}`)).slice(0, 20);
  const sesion = (await sha(`s:${lote.s}`)).slice(0, 20);
  const pais = corto(request.cf?.country, 2);
  const disp = ['movil', 'tableta', 'pc'].includes(lote.disp) ? lote.disp : null;
  const idioma = /^[a-z]{2}$/.test(lote.idioma || '') ? lote.idioma : null;
  const ahora = Date.now();
  const stmt = env.VOTOS_DB.prepare(`INSERT INTO eventos (t, dia, visitante, sesion, nuevo, tipo, ruta, objetivo, detalle, ms, ref, pais, disp, idioma)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const filas = eventos.map((x, i) => {
    const t = Math.min(ahora, Math.max(ahora - 86400000, Number(x.t) || ahora));
    const detalle = x.detalle && typeof x.detalle === 'object' ? JSON.stringify(x.detalle).slice(0, 600) : null;
    const ref = x.tipo === 'vista' ? corto(x.detalle?.ref, 60) || null : null;
    const ms = Number.isFinite(x.ms) ? Math.max(0, Math.min(x.ms, 6 * 3600000)) : null;
    return stmt.bind(t, new Date(t).toISOString().slice(0, 10), visitante, sesion, lote.nuevo && i === 0 ? 1 : 0,
      x.tipo, corto(x.ruta, 200), corto(x.objetivo, 200), detalle, ms, ref, pais, disp, idioma);
  });
  await env.VOTOS_DB.batch(filas);
  return vacio;
}

// ---------- Panel privado ----------

const COOKIE = 'verbo_panel';
const texto = (v) => new TextEncoder().encode(v);
// Firma de la cookie: HMAC-SHA256 con la clave del panel (cambiar la clave cierra todas las sesiones).
async function firma(env, vence) {
  const k = await crypto.subtle.importKey('raw', texto(env.PANEL_CLAVE), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, texto(`panel:${vence}`)))].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Comparación en tiempo constante (no deja adivinar la firma o la clave por lo que tarda la respuesta).
function iguales(a, b) { const x = texto(a), y = texto(b); return x.length === y.length && crypto.subtle.timingSafeEqual(x, y); }
async function autorizado(request, env) {
  if (!env.PANEL_CLAVE) return false;
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`${COOKIE}=(\\d+)\\.([a-f0-9]{64})`));
  if (!m || Number(m[1]) < Date.now()) return false;
  return iguales(await firma(env, m[1]), m[2]);
}
// same-origin y no no-referrer: con no-referrer el navegador manda el formulario de la clave con «Origin: null» y la
// comprobación de origen lo rechazaba. A otros sitios (los enlaces a verbobiblia.com) no se les manda nada.
const PRIVADO = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' };
// El panel solo usa su propio HTML, estilo y script en línea, y pide datos a /panel/*; no se puede meter en un marco.
const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; " +
  "form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
const html = (cuerpo, extra = {}) => new Response(cuerpo, { headers: { 'Content-Type': 'text/html; charset=utf-8', ...PRIVADO,
  'Content-Security-Policy': CSP, 'X-Frame-Options': 'DENY', ...extra } });
const datosJson = (obj) => new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json; charset=utf-8', ...PRIVADO } });

export async function handlePanel(request, url, env) {
  if (!env.PANEL_CLAVE) return html(pagina('<p class="aviso">Falta configurar la clave del panel. En la carpeta del Worker: <code>npx wrangler secret put PANEL_CLAVE</code></p>'));
  if (url.pathname === '/panel/entrar' && request.method === 'POST') {
    const origen = request.headers.get('Origin');
    if (origen && origen !== url.origin) return html(pagina(login('Este formulario solo funciona desde la página del panel. Vuelve a abrirla e intenta de nuevo.')));
    const form = await request.formData();
    const clave = String(form.get('clave') || '');
    const k = `panel-intentos:${request.headers.get('CF-Connecting-IP') || 'desconocida'}`;
    const intentos = Number(await env.SYNC_KV.get(k)) || 0;
    if (intentos >= INTENTOS_POR_HORA) return html(pagina(login('Demasiados intentos. Espera una hora.')));
    if (!iguales(await sha(clave), await sha(env.PANEL_CLAVE))) {
      await env.SYNC_KV.put(k, String(intentos + 1), { expirationTtl: 3600 });
      return html(pagina(login('Clave incorrecta.')));
    }
    if (intentos) await env.SYNC_KV.delete(k);
    const vence = Date.now() + 30 * 86400000;
    return new Response(null, { status: 303, headers: { Location: '/panel', 'Set-Cookie':
      `${COOKIE}=${vence}.${await firma(env, vence)}; Path=/panel; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict` } });
  }
  if (url.pathname === '/panel/salir') {
    return new Response(null, { status: 303, headers: { Location: '/panel', 'Set-Cookie': `${COOKIE}=; Path=/panel; Max-Age=0; HttpOnly; Secure; SameSite=Strict` } });
  }
  if (!(await autorizado(request, env))) return html(pagina(login('')));
  if (url.pathname === '/panel/datos') {
    const dias = Math.min(365, Math.max(1, Number(url.searchParams.get('dias')) || 7));
    const hasta = Math.min(Date.now(), Number(url.searchParams.get('hasta')) || Date.now());
    return datosJson(await resumen(env, dias, hasta));
  }
  if (url.pathname === '/panel/direccion') {
    // El cron diario guarda el catálogo; si hoy aún no hay foto (o el cron falló), se toma al abrir el panel.
    const hoy = await env.VOTOS_DB.prepare('SELECT 1 FROM catalogo WHERE dia = ?').bind(diaCR(Date.now())).first();
    if (!hoy) await fotoCatalogo(env).catch(error => console.error('catálogo', error));
    return datosJson(await direccion(env, url.searchParams.get('grano')));
  }
  // Cambios desde el panel: solo POST y desde la misma página (la cookie ya es SameSite=Strict).
  if ((url.pathname === '/panel/hito' || url.pathname === '/panel/yo') && request.method === 'POST') {
    const origen = request.headers.get('Origin');
    if (origen && origen !== url.origin) return datosJson({ error: 'origen' });
    let d = {};
    try { d = await request.json(); } catch {}
    if (url.pathname === '/panel/yo') {
      const s = String(d.sesion || '').slice(0, 40);
      await env.VOTOS_DB.prepare('INSERT OR IGNORE INTO yo (visitante, desde) SELECT visitante, ? FROM eventos WHERE sesion = ? AND visitante IS NOT NULL LIMIT 1')
        .bind(Date.now(), s).run();
    } else if (d.borrar) {
      await env.VOTOS_DB.prepare('DELETE FROM hitos WHERE id = ?').bind(Number(d.borrar) || 0).run();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(d.dia || '') && String(d.texto || '').trim()) {
      await env.VOTOS_DB.prepare('INSERT INTO hitos (dia, texto) VALUES (?, ?)').bind(d.dia, String(d.texto).trim().slice(0, 120)).run();
    }
    return datosJson({ ok: true });
  }
  if (url.pathname === '/panel/sesion') {
    const id = String(url.searchParams.get('id') || '');
    const { results } = await env.VOTOS_DB.prepare('SELECT t, tipo, ruta, objetivo, detalle, ms FROM eventos WHERE sesion = ? ORDER BY t LIMIT 500').bind(id).all();
    return datosJson({ eventos: results });
  }
  return html(PANEL);
}

const DIA = 86400000;
const CR = 6 * 3600000;                                   // Costa Rica: UTC-6 fijo, sin horario de verano
const diaCR = (ms) => new Date(ms - CR).toISOString().slice(0, 10);
// Origen de cada sesión: el de su primera vista (las páginas siguientes llegan desde el mismo sitio, sin origen).
// SQLite toma `ref` de la fila con MIN(t).
const PRIMERA_VISTA = `SELECT sesion, ref, MIN(t) t0 FROM ev WHERE t >= ? AND t < ? AND tipo='vista' GROUP BY sesion`;
// Cierres de cada vista: medir.js manda un «fin» cada vez que la página se oculta, con el tiempo acumulado y el id
// de la vista (pv); vale el mayor. Los eventos sin pv (anteriores) cuentan uno por uno.
const FINES = `SELECT sesion, ruta, objetivo, tipo, MAX(ms) ms, MAX(json_extract(detalle,'$.hondo')) hondo,
  MAX(json_extract(detalle,'$.toques')) toques FROM ev WHERE t >= ? AND t < ? AND tipo IN ('fin','juego_fin')
  GROUP BY COALESCE(json_extract(detalle,'$.pv'), id)`;

// Sección de cada página, para ver qué contenido retiene a la gente.
const SECCION = (c) => `CASE WHEN ${c} LIKE '/juegos/%' THEN 'juegos' WHEN ${c} LIKE '/imagenes/%' THEN 'imagenes'
  WHEN ${c} LIKE '/historias/%' THEN 'historias' WHEN ${c} LIKE '/recursos/escuela-dominical/%' THEN 'lecciones'
  WHEN ${c} LIKE '/recursos/devocionales/%' OR ${c} LIKE '/libreria/%' THEN 'lectura'
  WHEN ${c} LIKE '/software/%' OR ${c} LIKE '/verbo-desktop/%' OR ${c} LIKE '/apps/%' THEN 'software'
  WHEN ${c} LIKE '/musica/%' THEN 'musica' WHEN ${c} = '/' THEN 'portada' ELSE 'otros' END`;

// ¿Se quedan? Por sección: tiempo, si siguen navegando tras entrar por ahí, si vuelven otro día y cómo crece
// semana a semana (las últimas 4 semanas, sea cual sea el rango elegido).
async function seQuedan(env, desde, hasta) {
  const todas = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(...p).all().then(r => r.results);
  const V = `SELECT visitante, sesion, t, ${SECCION('ruta')} sec FROM ev WHERE t >= ? AND t < ? AND tipo='vista'`;
  const [base, tiempo, entradas, vuelven, semanas] = await Promise.all([
    todas(`SELECT sec, COUNT(DISTINCT visitante) visitantes, COUNT(DISTINCT sesion) sesiones, COUNT(*) vistas FROM (${V}) GROUP BY sec`, desde, hasta),
    todas(`SELECT sec, AVG(ms) ms FROM (SELECT sesion, ${SECCION('ruta')} sec, SUM(ms) ms FROM (${FINES}) GROUP BY sesion, sec) GROUP BY sec`, desde, hasta),
    todas(`SELECT ${SECCION('p.ruta')} sec, COUNT(*) entradas, SUM(c.n > 1) siguieron FROM
        (SELECT sesion, ruta, MIN(t) t0 FROM ev WHERE t >= ? AND t < ? AND tipo='vista' GROUP BY sesion) p
        JOIN (SELECT sesion, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo='vista' GROUP BY sesion) c ON c.sesion = p.sesion
        GROUP BY 1`, desde, hasta, desde, hasta),
    todas(`SELECT sec, SUM(dias > 1) volvieron FROM
        (SELECT visitante, sec, COUNT(DISTINCT date(t/1000 - 21600, 'unixepoch')) dias FROM (${V}) GROUP BY visitante, sec) GROUP BY sec`, desde, hasta),
    todas(`SELECT sec, CAST((? - t) / ${7 * DIA} AS INTEGER) atras, COUNT(DISTINCT visitante) visitantes FROM (${V}) GROUP BY sec, atras`,
      hasta, hasta - 28 * DIA, hasta),
  ]);
  const por = {};
  const fila = (sec) => (por[sec] ??= { sec, semanas: [0, 0, 0, 0] });
  base.forEach(r => Object.assign(fila(r.sec), r));
  tiempo.forEach(r => { fila(r.sec).ms = r.ms; });
  entradas.forEach(r => Object.assign(fila(r.sec), { entradas: r.entradas, siguieron: r.siguieron }));
  vuelven.forEach(r => { fila(r.sec).volvieron = r.volvieron; });
  semanas.forEach(r => { if (r.atras >= 0 && r.atras < 4) fila(r.sec).semanas[3 - r.atras] = r.visitantes; });
  return Object.values(por).sort((a, b) => (b.visitantes || 0) - (a.visitantes || 0));
}

async function resumen(env, dias, hasta) {
  const desde = Math.floor((hasta - CR) / DIA) * DIA + CR - (dias - 1) * DIA;   // medianoche de Costa Rica
  const q = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(desde, hasta, ...p).all().then(r => r.results);
  const uno = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(desde, hasta, ...p).first();
  const [total, porDia, origenes, paginas, juegos, descargas, imagenes, lecciones, clics, busquedas, salidas, paises,
    dispositivos, sesiones, votosEv] = await Promise.all([
    uno(`SELECT SUM(tipo='vista') vistas, COUNT(DISTINCT sesion) sesiones, COUNT(DISTINCT visitante) visitantes,
           SUM(nuevo) nuevos, (SELECT SUM(ms) FROM (${FINES})) ms,
           (SELECT COUNT(DISTINCT sesion) FROM (${FINES}) WHERE ms IS NOT NULL) sesiones_ms,
           SUM(tipo='descarga') descargas, SUM(tipo='juego') juegos,
           SUM(tipo='salida' AND objetivo LIKE '%pinterest.com/pin/create%') pinterest,
           SUM(tipo='clic' AND objetivo LIKE 'Crear tarjeta%') tarjetas FROM ev WHERE t >= ? AND t < ?`, desde, hasta, desde, hasta),
    q(`SELECT date(t/1000 - 21600, 'unixepoch') dia, SUM(tipo='vista') vistas, COUNT(DISTINCT sesion) sesiones
         FROM ev WHERE t >= ? AND t < ? GROUP BY 1 ORDER BY 1`),
    q(`SELECT COALESCE(ref,'') ref, COUNT(*) sesiones FROM (${PRIMERA_VISTA}) GROUP BY 1 ORDER BY 2 DESC LIMIT 40`),
    q(`SELECT v.ruta, v.objetivo titulo, v.n vistas, f.ms, f.hondo FROM
         (SELECT ruta, MAX(objetivo) objetivo, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo='vista' GROUP BY ruta) v
         LEFT JOIN (SELECT ruta, AVG(ms) ms, AVG(hondo) hondo FROM (${FINES}) GROUP BY ruta) f
         ON f.ruta = v.ruta ORDER BY v.n DESC LIMIT 60`, desde, hasta),
    // Etapas: lo informan los juegos con VerboModoJuego.etapa(n, total); por sesión vale la más alta terminada.
    q(`SELECT j.objetivo juego, j.n partidas, j.ses sesiones, f.total, f.media, f.reales, e.etapas, e.media_etapa, e.terminaron FROM
         (SELECT objetivo, COUNT(*) n, COUNT(DISTINCT sesion) ses FROM ev WHERE t >= ? AND t < ? AND tipo='juego' GROUP BY objetivo) j
         LEFT JOIN (SELECT objetivo, SUM(ms) total, AVG(ms) media, SUM(toques >= 5) reales
           FROM (${FINES}) WHERE tipo='juego_fin' GROUP BY objetivo) f ON f.objetivo = j.objetivo
         LEFT JOIN (SELECT objetivo, MAX(total) etapas, AVG(alcanzada) media_etapa, SUM(alcanzada >= total) terminaron FROM
           (SELECT objetivo, sesion, MAX(json_extract(detalle,'$.etapa')) alcanzada, MAX(json_extract(detalle,'$.total')) total
             FROM ev WHERE t >= ? AND t < ? AND tipo='juego_etapa' GROUP BY objetivo, sesion) GROUP BY objetivo) e ON e.objetivo = j.objetivo
         ORDER BY j.n DESC`, desde, hasta, desde, hasta),
    q(`SELECT objetivo, ruta, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo='descarga' GROUP BY objetivo ORDER BY n DESC LIMIT 60`),
    q(`SELECT ruta, MAX(objetivo) titulo, COUNT(*) vistas FROM ev WHERE t >= ? AND t < ? AND tipo='vista' AND ruta LIKE '/imagenes/%' GROUP BY ruta ORDER BY vistas DESC LIMIT 60`),
    q(`SELECT ruta, MAX(objetivo) titulo, SUM(tipo='vista') vistas, SUM(tipo='imprimir') impresiones FROM ev
         WHERE t >= ? AND t < ? AND ruta LIKE '/recursos/escuela-dominical/%' GROUP BY ruta ORDER BY vistas DESC LIMIT 60`),
    q(`SELECT ruta, objetivo, json_extract(detalle,'$.zona') zona, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo IN ('clic','descarga','salida','imprimir')
         GROUP BY ruta, objetivo, zona ORDER BY n DESC LIMIT 80`),
    q(`SELECT ruta, objetivo, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo='busqueda' GROUP BY ruta, objetivo ORDER BY n DESC LIMIT 50`),
    q(`SELECT objetivo, COUNT(*) n FROM ev WHERE t >= ? AND t < ? AND tipo='salida' GROUP BY objetivo ORDER BY n DESC LIMIT 40`),
    q(`SELECT COALESCE(pais,'?') pais, COUNT(DISTINCT sesion) sesiones FROM ev WHERE t >= ? AND t < ? GROUP BY 1 ORDER BY 2 DESC LIMIT 30`),
    q(`SELECT COALESCE(disp,'?') disp, COUNT(DISTINCT sesion) sesiones FROM ev WHERE t >= ? AND t < ? GROUP BY 1 ORDER BY 2 DESC`),
    q(`SELECT s.*, o.ref, m.ms FROM
         (SELECT sesion, MIN(t) inicio, MAX(t) fin, SUM(tipo='vista') paginas, MAX(pais) pais, MAX(disp) disp, MAX(nuevo) nuevo, GROUP_CONCAT(DISTINCT CASE WHEN tipo='juego' THEN objetivo END) juegos
           FROM ev WHERE t >= ? AND t < ? GROUP BY sesion ORDER BY inicio DESC LIMIT 80) s
         LEFT JOIN (${PRIMERA_VISTA}) o ON o.sesion = s.sesion
         LEFT JOIN (SELECT sesion, SUM(ms) ms FROM (${FINES}) GROUP BY sesion) m ON m.sesion = s.sesion ORDER BY s.inicio DESC`,
      desde, hasta, desde, hasta),
    q(`SELECT objetivo juego, SUM(json_extract(detalle,'$.gusta') = 1) si, SUM(json_extract(detalle,'$.gusta') = 0) no FROM ev
         WHERE t >= ? AND t < ? AND tipo='voto' GROUP BY objetivo`),
  ]);
  // Un punto por día, también los días sin visitas (si no, la gráfica junta días separados).
  const porFecha = Object.fromEntries(porDia.map(r => [r.dia, r]));
  const serie = [];
  for (let d = desde; d < hasta; d += DIA) serie.push(porFecha[diaCR(d)] || { dia: diaCR(d), vistas: 0, sesiones: 0 });
  const quedan = await seQuedan(env, desde, hasta);
  const votos = (await env.VOTOS_DB.prepare('SELECT juego, COUNT(*) n FROM votos GROUP BY juego').all()).results;
  const sugerencias = (await env.VOTOS_DB.prepare('SELECT imagen, texto, creado, estado FROM sugerencias_imagenes ORDER BY creado DESC LIMIT 20').all()).results;
  return { dias, desde, hasta, total, quedan, porDia: serie, origenes, paginas, juegos, descargas, imagenes, lecciones, clics, busquedas, salidas, paises,
    dispositivos, sesiones, votos, votosEv, sugerencias };
}

// ---------- Dirección: ¿va bien el camino? ----------
// Tendencias por semana (lunes a domingo de Costa Rica) o por día, desde que empezó la medición. Responden:
// ¿nos conocen? (visitantes únicos acumulados), ¿vuelven?, ¿nos encuentran solos? (buscadores), ¿rinde cada
// pieza publicada? (vistas por imagen, aperturas por juego) y ¿se meten de verdad? (partidas, tiempo, páginas).

const SITIO = 'https://verbobiblia.com';
const BUSCADOR = `(ref LIKE '%google%' OR ref LIKE '%bing%' OR ref LIKE '%yahoo%' OR ref LIKE '%duckduckgo%'
  OR ref LIKE '%ecosia%' OR ref LIKE '%yandex%' OR ref LIKE '%brave%' OR ref LIKE '%qwant%')`;
const APP = `(objetivo LIKE '%/releases/download/%' OR objetivo LIKE '%play.google.com/store/apps%' OR objetivo LIKE '%apps.apple.com%')`;

// Cuánto contenido hay publicado, contado de lo que ve Google: imágenes del sitemap de imágenes, juegos publicados
// del catálogo, historias que ya son libro interactivo y lecciones de Escuela Dominical del sitemap.
export function contarCatalogo({ sitemap = '', imagenes = '', juegos = '{}', historias = '' }, hoy) {
  let nJuegos = null;
  try { nJuegos = (JSON.parse(juegos).juegos || []).filter(j => j.publicado && String(j.publicado) <= hoy).length; } catch {}
  return {
    imagenes: (imagenes.match(/<url>/g) || []).length || null,
    juegos: nJuegos,
    historias: (historias.match(/class="libro-tarjeta"/g) || []).length,
    lecciones: (sitemap.match(/<loc>[^<]*\/recursos\/escuela-dominical\/[^/<]+\/[^/<]+\/<\/loc>/g) || []).length || null,
  };
}
export async function fotoCatalogo(env) {
  const hoy = diaCR(Date.now());
  const leer = (p) => fetch(SITIO + p, { cf: { cacheTtl: 0 } }).then(r => (r.ok ? r.text() : '')).catch(() => '');
  const [sitemap, imagenes, juegos, historias] = await Promise.all(['/sitemap.xml', '/sitemap-imagenes.xml', '/juegos/catalogo.json', '/historias/'].map(leer));
  const c = contarCatalogo({ sitemap, imagenes, juegos, historias }, hoy);
  if (c.imagenes == null && c.juegos == null) return null;     // el sitio no respondió: mejor no guardar ceros
  await env.VOTOS_DB.prepare(`INSERT INTO catalogo (dia, imagenes, juegos, historias, lecciones) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(dia) DO UPDATE SET imagenes=excluded.imagenes, juegos=excluded.juegos, historias=excluded.historias, lecciones=excluded.lecciones`)
    .bind(hoy, c.imagenes, c.juegos, c.historias, c.lecciones).run();
  return c;
}

async function direccion(env, grano) {
  const semana = grano !== 'dia';
  const tam = semana ? 7 * DIA : DIA, corr = semana ? 3 * DIA : 0;   // el 1-1-1970 fue jueves: +3 días = semanas de lunes
  const B = (c) => `CAST((${c} - ${CR} + ${corr}) / ${tam} AS INTEGER)`;
  const inicio = (b) => b * tam - corr + CR;
  const ahora = Date.now(), desde = inicio(Math.floor((ahora - CR + corr) / tam) - (semana ? 51 : 89));
  const todas = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(...p).all().then(r => r.results);
  const [vistas, primeras, sesiones, juegos, finesJ, apps, catalogo, hitos, yo] = await Promise.all([
    // Visitantes y páginas por periodo; «vuelven» = ya habían venido en un periodo anterior.
    todas(`SELECT ${B('v.t')} b, COUNT(DISTINCT v.visitante) visitantes, COUNT(DISTINCT v.sesion) sesiones, COUNT(*) vistas,
        COUNT(DISTINCT CASE WHEN p.t0 < ${B('v.t')} * ${tam} - ${corr} + ${CR} THEN v.visitante END) vuelven,
        SUM(v.ruta LIKE '/imagenes/%') v_imagenes, SUM(v.ruta LIKE '/historias/%') v_historias, SUM(v.ruta LIKE '/recursos/escuela-dominical/%') v_lecciones
      FROM ev v JOIN (SELECT visitante, MIN(t) t0 FROM ev WHERE tipo='vista' GROUP BY visitante) p ON p.visitante = v.visitante
      WHERE v.tipo='vista' AND v.t >= ? GROUP BY 1`, desde),
    // Visitantes nuevos por periodo (la primera vez que se les ve), para el total acumulado.
    todas(`SELECT ${B('t0')} b, COUNT(*) nuevos FROM (SELECT visitante, MIN(t) t0 FROM ev WHERE tipo='vista' GROUP BY visitante) GROUP BY 1`),
    // Origen y duración de cada sesión, por el periodo en que empezó.
    todas(`SELECT ${B('o.t0')} b, SUM(${BUSCADOR.replace(/ref/g, 'o.ref')}) buscadores, SUM(o.ref IS NULL OR o.ref = '') directo,
        AVG(m.ms) ms FROM (${PRIMERA_VISTA}) o LEFT JOIN (SELECT sesion, SUM(ms) ms FROM (${FINES}) GROUP BY sesion) m ON m.sesion = o.sesion GROUP BY 1`,
      desde, ahora, desde, ahora),
    todas(`SELECT ${B('t')} b, COUNT(*) aperturas FROM ev WHERE tipo='juego' AND t >= ? GROUP BY 1`, desde),
    todas(`SELECT ${B('t')} b, COUNT(*) partidas, SUM(toques >= 5) reales FROM
        (SELECT MIN(t) t, MAX(json_extract(detalle,'$.toques')) toques FROM ev WHERE tipo='juego_fin' AND t >= ?
          GROUP BY COALESCE(json_extract(detalle,'$.pv'), id)) GROUP BY 1`, desde),
    todas(`SELECT ${B('t')} b, COUNT(*) apps FROM ev WHERE tipo IN ('descarga','salida') AND ${APP} AND t >= ? GROUP BY 1`, desde),
    todas(`SELECT * FROM catalogo ORDER BY dia`),
    todas(`SELECT id, dia, texto FROM hitos ORDER BY dia, id`),
    env.VOTOS_DB.prepare('SELECT COUNT(*) n FROM yo').first(),
  ]);
  // Una fila por periodo, también los vacíos, desde el primero con datos.
  const por = (l) => Object.fromEntries(l.map(r => [r.b, r]));
  const V = por(vistas), P = por(primeras), S = por(sesiones), J = por(juegos), F = por(finesJ), A = por(apps);
  const conDatos = vistas.map(r => r.b);
  const b0 = Math.max(Math.min(...conDatos, Infinity), Math.floor((desde - CR + corr) / tam)), b1 = Math.floor((ahora - CR + corr) / tam);
  let acumulado = primeras.filter(r => r.b < b0).reduce((s, r) => s + r.nuevos, 0);
  const serie = [];
  if (Number.isFinite(b0)) for (let b = b0; b <= b1; b++) {
    const v = V[b] || {}, s = S[b] || {}, f = F[b] || {}, fin = diaCR(Math.min(ahora, inicio(b + 1) - 1));
    acumulado += P[b]?.nuevos || 0;
    const cat = catalogo.filter(c => c.dia <= fin).pop() || {};
    serie.push({ b, desde: diaCR(inicio(b)), hasta: fin, actual: b === b1, visitantes: v.visitantes || 0, conocen: acumulado,
      nuevos: P[b]?.nuevos || 0, vuelven: v.vuelven || 0, sesiones: v.sesiones || 0, vistas: v.vistas || 0,
      buscadores: s.buscadores || 0, directo: s.directo || 0, ms: s.ms || 0, aperturas: J[b]?.aperturas || 0,
      partidas: f.partidas || 0, reales: f.reales || 0, apps: A[b]?.apps || 0,
      v_imagenes: v.v_imagenes || 0, v_historias: v.v_historias || 0, v_lecciones: v.v_lecciones || 0,
      imagenes: cat.imagenes ?? null, juegos: cat.juegos ?? null, historias: cat.historias ?? null, lecciones: cat.lecciones ?? null });
  }
  return { grano: semana ? 'semana' : 'dia', serie, hitos, excluidos: yo?.n || 0 };
}

function login(error) {
  return `<form method="post" action="/panel/entrar" class="login"><h1>Panel de Verbo</h1>
  ${error ? `<p class="error">${error}</p>` : ''}<label>Clave<input type="password" name="clave" autocomplete="current-password" autofocus required></label>
  <button>Entrar</button></form>`;
}
function pagina(cuerpo) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Panel de Verbo</title><style>${ESTILO}</style></head><body>${cuerpo}</body></html>`;
}

const ESTILO = `
:root{--fondo:#f6f1e7;--papel:#fffdf8;--tinta:#0a2037;--suave:#5c6a78;--oro:#98703c;--linea:#e2d8c6;--azul:#2f5d8a}
@media (prefers-color-scheme:dark){:root{--fondo:#0e1622;--papel:#152131;--tinta:#e9eef4;--suave:#9fb0c2;--oro:#d9ae6a;--linea:#253548;--azul:#7fb0e0}}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--tinta);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.login{max-width:340px;margin:12vh auto;padding:28px;background:var(--papel);border:1px solid var(--linea);border-radius:16px;display:grid;gap:14px}
.login h1{margin:0;font:600 22px Georgia,serif}.login label{display:grid;gap:6px}.login input{padding:10px;border:1px solid var(--linea);border-radius:10px;font:inherit;background:var(--fondo);color:var(--tinta)}
.login button,.rango button{padding:9px 16px;border:0;border-radius:999px;background:var(--tinta);color:var(--papel);font:inherit;font-weight:600;cursor:pointer}
.error{color:#b3412e;margin:0}.aviso{max-width:560px;margin:12vh auto;padding:20px}
header{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--linea);background:var(--papel);position:sticky;top:0;z-index:2}
header h1{margin:0;font:600 20px Georgia,serif}.rango{display:flex;gap:6px;flex-wrap:wrap}.rango button{background:none;color:var(--tinta);border:1px solid var(--linea)}
.rango button.activo{background:var(--tinta);color:var(--papel)}main{max-width:1400px;margin:0 auto;padding:20px 24px 60px;display:grid;gap:18px}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.cifra{background:var(--papel);border:1px solid var(--linea);border-radius:14px;padding:14px 16px}
.cifra b{display:block;font-size:26px;font-weight:700}.cifra span{color:var(--suave);font-size:12.5px}
.semana{margin-top:12px;border-top:1px solid var(--linea);padding-top:8px;font-size:13px}.semana summary{cursor:pointer;font-weight:600}.semana summary small{font-weight:400;color:var(--suave)}.cifras-s{display:flex;flex-wrap:wrap;gap:6px 16px;margin:8px 0 4px}.cifras-s b{font-size:15px}.semana i{font-style:normal;font-size:11.5px}.semana .sube{color:#5cb85c}.semana .baja{color:#d9534f}.semana ul{margin:6px 0 0;padding-left:18px}.semana li{margin:3px 0}
.rejilla{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:18px}
section{background:var(--papel);border:1px solid var(--linea);border-radius:16px;padding:16px 18px;min-width:0}
section h2{margin:0 0 10px;font:600 16px Georgia,serif}section p.nota{margin:-4px 0 10px;color:var(--suave);font-size:12.5px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--linea);vertical-align:top}
th{color:var(--suave);font-weight:600;font-size:12px}td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td a{color:var(--azul);text-decoration:none;word-break:break-all}.barra{height:6px;border-radius:3px;background:var(--oro);opacity:.75}
#direccion a{color:var(--azul)}.dir-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:12px;margin-top:6px}.dir{border:1px solid var(--linea);border-radius:12px;padding:10px 12px;background:var(--fondo)}.dir h3{margin:0;font-size:13.5px}.dir .v{font-size:22px;font-weight:700;margin:2px 0 0}.dir .v small{font-size:12px;font-weight:400;color:var(--suave);margin-left:6px}.dir p{margin:2px 0 4px;color:var(--suave);font-size:12px}.dir svg{display:block}.dir-cab{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}.dir-cab .rango button{padding:5px 12px;font-size:12.5px}.hitos{margin:10px 0 0;padding-left:18px;font-size:12.5px}.hitos button{border:0;background:none;color:var(--suave);cursor:pointer}.hito-form{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hito-form input{padding:6px 8px;border:1px solid var(--linea);border-radius:8px;background:var(--papel);color:var(--tinta);font:inherit;font-size:12.5px}.hito-form input[type=text]{flex:1;min-width:160px}.hito-form button,.yo-btn{padding:6px 12px;border:1px solid var(--linea);border-radius:999px;background:var(--papel);color:var(--tinta);font:inherit;font-size:12.5px;cursor:pointer}.tabla{max-height:420px;overflow:auto;-webkit-overflow-scrolling:touch}svg text{fill:var(--suave);font-size:11px}.vacio{color:var(--suave);font-style:italic}
@media (max-width:640px){header{padding:12px 14px;position:static}header h1{font-size:18px}.rango button{padding:7px 11px;font-size:13px}main{padding:12px 10px 40px;gap:12px}section{padding:12px;border-radius:12px}.cifras{grid-template-columns:repeat(2,1fr);gap:8px}.cifra{padding:10px 12px}.cifra b{font-size:21px}table{font-size:12px}th,td{padding:5px 6px}td{max-width:52vw;overflow-wrap:anywhere}#sesiones table{min-width:620px}#sesiones td{max-width:none;white-space:nowrap}.tabla table{min-width:100%}}tr.ses{cursor:pointer}tr.ses:hover td{background:var(--fondo)}#recorrido{font-size:12.5px}#recorrido li{margin:2px 0}
`;

const PANEL = pagina(`<header><h1>Panel de Verbo</h1><div class="rango" id="rango">
<button data-d="1">Hoy</button><button data-d="7">7 días</button><button data-d="28">28 días</button><button data-d="90">90 días</button>
<a href="/panel/salir" style="margin-left:10px;color:var(--suave);align-self:center">Salir</a></div></header>
<main id="m"><p class="vacio">Cargando…</p></main>
<script>
const $=s=>document.querySelector(s), e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n=x=>(+x||0).toLocaleString('es'), dur=ms=>{ms=+ms||0;const s=Math.round(ms/1000);return s<60?s+' s':s<3600?Math.floor(s/60)+' min '+(s%60)+' s':(s/3600).toFixed(1)+' h'};
const sitio='https://verbobiblia.com',ZONA='America/Costa_Rica';
const SECCIONES={juegos:'Juegos',imagenes:'Banco de imágenes',historias:'Historias',lecciones:'Lecciones (Escuela Dominical)',lectura:'Librería y devocionales',software:'Software y apps',musica:'Música',portada:'Portada',otros:'Otros (artículos, preguntas…)'};
const pct=(x,de)=>de?Math.round(100*(+x||0)/de)+' %':'';
const fuente=r=>!r?'Directo / sin origen':r==='localhost'?'App de Verbo (Android)':/^fb-/.test(r)?'Facebook · '+r.slice(3).replace(/-/g,' '):/google/.test(r)?'Google':/pinterest|pin\\.it/.test(r)?'Pinterest':/facebook|fb\\.|m\\.facebook/.test(r)?'Facebook':/bing/.test(r)?'Bing':/youtube/.test(r)?'YouTube':/whatsapp|wa\\.me/.test(r)?'WhatsApp':/instagram/.test(r)?'Instagram':/chatgpt|openai|perplexity|gemini|claude/.test(r)?'Asistentes de IA':r;
function tabla(cols,filas,vacio='Sin datos todavía.'){if(!filas.length)return '<p class="vacio">'+vacio+'</p>';
 const max=Math.max(1,...filas.map(f=>+f[cols.find(c=>c.barra)?.k]||0));
 return '<div class="tabla"><table><tr>'+cols.map(c=>'<th>'+c.t+'</th>').join('')+'</tr>'+filas.map(f=>'<tr'+(f._attr||'')+'>'+cols.map(c=>{let v=c.f?c.f(f[c.k],f):e(f[c.k]);
 if(c.barra)v+='<div class="barra" style="width:'+Math.round(100*(+f[c.k]||0)/max)+'%"></div>';return '<td'+(c.num?' class="n"':'')+'>'+v+'</td>'}).join('')+'</tr>').join('')+'</table></div>'}
const enlace=r=>'<a href="'+sitio+e(r)+'" target="_blank" rel="noopener">'+e(r)+'</a>';
function linea(d){if(!d.length)return '<p class="vacio">Sin datos todavía.</p>';const W=Math.max(320,Math.min(900,(document.querySelector('main')?.clientWidth||900)-40)),H=W<600?160:180,p=28,max=Math.max(1,...d.map(x=>x.vistas));
 const x=i=>d.length<2?W/2:p+i*(W-2*p)/(d.length-1),y=v=>H-p-(H-2*p)*v/max;
 const camino=k=>d.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(r[k]).toFixed(1)).join(' ');
 return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Visitas por día"><path d="'+camino('vistas')+'" fill="none" stroke="var(--oro)" stroke-width="2.5"/><path d="'+camino('sesiones')+'" fill="none" stroke="var(--azul)" stroke-width="2"/>'
 +d.map((r,i)=>'<circle cx="'+x(i).toFixed(1)+'" cy="'+y(r.vistas).toFixed(1)+'" r="4" fill="var(--oro)"><title>'+r.dia+': '+r.vistas+' páginas</title></circle><circle cx="'+x(i).toFixed(1)+'" cy="'+y(r.sesiones).toFixed(1)+'" r="3.5" fill="var(--azul)"><title>'+r.dia+': '+r.sesiones+' sesiones</title></circle>').join('')
 +d.map((r,i)=>i%Math.ceil(d.length/10)?'':'<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle">'+r.dia.slice(5)+'</text>').join('')+'<text x="'+p+'" y="14">'+max+'</text></svg><p class="nota"><span style="color:var(--oro)">●</span> páginas vistas · <span style="color:var(--azul)">●</span> sesiones</p>'}
// Esta semana (7 días de Costa Rica hasta ahora) frente a la anterior cortada a la misma hora, para comparar tramos iguales.
async function semana(){const el=$('#semana');if(!el)return;const ahora=Date.now();
 const [a,b]=await Promise.all([ahora,ahora-7*864e5].map(h=>fetch('/panel/datos?dias=7&hasta='+h).then(r=>r.ok?r.json():null)));if(!a||!b)return;
 const A=a.total||{},B=b.total||{},prev=k=>+B[k]||0,hay=(+B.visitantes||0)>0;
 const flecha=(x,y)=>!hay?'':y===0?(x?' <i class="sube">nuevo</i>':''):' <i class="'+(x>=y?'sube':'baja')+'">'+(x>=y?'▲':'▼')+' '+Math.abs(Math.round(100*(x-y)/y))+' %</i>';
 const cifra=(k,t)=>'<span><b>'+n(A[k])+'</b> '+t+flecha(+A[k]||0,prev(k))+'</span>';
 const mapa=(l,k,v)=>Object.fromEntries(l.map(x=>[x[k],+x[v]||0]));
 const pa=mapa(a.paginas,'ruta','vistas'),pb=mapa(b.paginas,'ruta','vistas');
 const suben=Object.entries(pa).map(([r,x])=>[r,x-(pb[r]||0)]).filter(x=>x[1]>0).sort((x,y)=>y[1]-x[1]).slice(0,3);
 const fa={};a.origenes.forEach(o=>{const f=fuente(o.ref);fa[f]=(fa[f]||0)+o.sesiones});
 const top=Object.entries(fa).sort((x,y)=>y[1]-x[1])[0];
 const ideas=[];
 if(hay&&suben.length)ideas.push('Lo que más creció: <a href="'+sitio+e(suben[0][0])+'" target="_blank" rel="noopener">'+e(suben[0][0])+'</a>. Conviene hacer más contenido de ese tipo.');
 if(top)ideas.push('La mayoría llega por <b>'+e(top[0])+'</b> ('+top[1]+' sesiones).');
 const libros={};a.descargas.forEach(x=>{const m=(x.objetivo||'').split('/')[2];if(m)libros[m]=(libros[m]||0)+x.n});
 const lib=Object.entries(libros).sort((x,y)=>y[1]-x[1])[0];if(lib)ideas.push('Las descargas vienen sobre todo de <b>'+e(lib[0])+'</b> ('+lib[1]+'). Ese libro merece más imágenes.');
 const flojo=a.juegos.find(j=>j.partidas>=3&&(+j.reales||0)/j.partidas<0.4);if(flojo)ideas.push('<b>'+e(flojo.juego)+'</b>: muchos lo abren pero pocos lo juegan de verdad. Revisar el inicio.');
 el.innerHTML='<details class="semana"><summary>Resumen de la semana <small>'+(hay?'frente a la anterior hasta la misma hora':'(todavía no hay una semana anterior para comparar)')+'</small></summary>'
  +'<p class="cifras-s">'+cifra('visitantes','visitantes')+cifra('vistas','páginas')+cifra('juegos','aperturas')+cifra('descargas','descargas')+'</p>'
  +(ideas.length?'<ul>'+ideas.map(x=>'<li>'+x+'</li>').join('')+'</ul>':'')+'</details>'}
// ---------- Dirección ----------
let RANGO=7,GRANO='semana',DIR_DATOS={};
const pctN=(a,b)=>b?100*a/b:null;
const DIR=[
 {t:'¿Nos conocen?',v:r=>r.conocen,f:n,nota:'Personas distintas que han venido alguna vez (total acumulado).',x:r=>'+'+n(r.nuevos)+' nuevas'},
 {t:'¿Vuelven?',v:r=>pctN(r.vuelven,r.visitantes),f:v=>Math.round(v)+' %',nota:'De quienes vinieron en el periodo, cuántos ya habían venido antes. La señal más importante.',x:r=>n(r.vuelven)+' de '+n(r.visitantes)},
 {t:'¿Nos encuentran solos?',v:r=>r.buscadores,f:n,nota:'Sesiones que llegan desde Google, Bing y otros buscadores. Crece con el catálogo.',x:r=>pctN(r.buscadores,r.sesiones)==null?'':Math.round(pctN(r.buscadores,r.sesiones))+' % de las sesiones'},
 {t:'Páginas vistas',v:r=>r.vistas,f:n,nota:'El espacio para anuncios: cada página vista es una oportunidad.',x:r=>(r.sesiones?(r.vistas/r.sesiones).toFixed(1):'0')+' por sesión'},
 {t:'¿Rinde cada imagen?',v:r=>r.imagenes?1000*r.v_imagenes/r.imagenes:null,f:v=>Math.round(v),nota:'Vistas del banco por cada 1.000 imágenes publicadas. Si se mantiene mientras crece el banco, vale la pena seguir.',x:r=>r.imagenes==null?'':n(r.imagenes)+' imágenes'},
 {t:'¿Rinde cada juego?',v:r=>r.juegos?r.aperturas/r.juegos:null,f:v=>v.toFixed(1),nota:'Aperturas por juego publicado.',x:r=>r.juegos==null?'':n(r.juegos)+' juegos · '+n(r.aperturas)+' aperturas'},
 {t:'¿Juegan de verdad?',v:r=>pctN(r.reales,r.partidas),f:v=>Math.round(v)+' %',nota:'Partidas con 5 toques o más.',x:r=>n(r.reales)+' de '+n(r.partidas)},
 {t:'Tiempo por sesión',v:r=>r.ms||null,f:dur,nota:'Promedio de las sesiones con tiempo medido.'},
 {t:'Historias y lecciones',v:r=>r.v_historias+r.v_lecciones,f:n,nota:'Páginas vistas de historias interactivas y lecciones.',x:r=>n(r.v_historias)+' historias · '+n(r.v_lecciones)+' lecciones'},
 {t:'Descargas de apps',v:r=>r.apps,f:n,nota:'Verbo Desktop, Play Store y App Store.'}];
function mini(serie,c,hitos){const W=300,H=70,p=6,vals=serie.map(c.v),ok=vals.filter(v=>v!=null);if(!ok.length)return '<p class="vacio">Sin datos todavía.</p>';
 const max=Math.max(1e-9,...ok),x=i=>serie.length<2?W/2:p+i*(W-2*p)/(serie.length-1),y=v=>H-p-(H-2*p)*v/max;
 let d='',m=false;vals.forEach((v,i)=>{if(v==null){m=false;return}d+=(m?'L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1)+' ';m=true});
 const marcas=hitos.map(h=>{const i=serie.findIndex(r=>h.dia>=r.desde&&h.dia<=r.hasta);return i<0?'':'<line x1="'+x(i)+'" x2="'+x(i)+'" y1="0" y2="'+H+'" stroke="var(--azul)" stroke-dasharray="3 3" opacity=".6"><title>'+e(h.dia+': '+h.texto)+'</title></line>'}).join('');
 return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="'+H+'">'+marcas+'<path d="'+d+'" fill="none" stroke="var(--oro)" stroke-width="2"/>'
  +vals.map((v,i)=>v==null?'':'<circle cx="'+x(i).toFixed(1)+'" cy="'+y(v).toFixed(1)+'" r="'+(serie[i].actual?2.5:3.5)+'" fill="'+(serie[i].actual?'var(--suave)':'var(--oro)')+'"><title>'+e(serie[i].desde+(serie[i].desde!==serie[i].hasta?' a '+serie[i].hasta:'')+': '+c.f(v)+(serie[i].actual?' (en curso)':''))+'</title></circle>').join('')+'</svg>'}
async function direccion(){const el=$('#direccion');if(!el)return;
 const D=DIR_DATOS[GRANO]||(DIR_DATOS[GRANO]=await fetch('/panel/direccion?grano='+GRANO).then(r=>r.ok?r.json():null));
 if(!D){el.innerHTML='<p>No se pudo cargar la dirección.</p>';return}
 const S=D.serie,ult=S[S.length-1],ant=S[S.length-2],que=GRANO==='semana'?'semana':'día';
 const tarjeta=c=>{const v=ult?c.v(ult):null,a=ant?c.v(ant):null;
  return '<div class="dir"><h3>'+c.t+'</h3><div class="v">'+(v==null?'—':c.f(v))+'<small>'+(c.x&&ult?e(c.x(ult)):'')+'</small></div>'
   +'<p>'+(a!=null?'Anterior '+que+': '+c.f(a)+' · ':'')+c.nota+'</p>'+mini(S,c,D.hitos)+'</div>'};
 const cat=[['imagenes','Imágenes'],['juegos','Juegos'],['historias','Historias interactivas'],['lecciones','Lecciones']];
 const primero=k=>(S.find(r=>r[k]!=null)||{})[k];
 el.innerHTML='<div class="dir-cab"><h2>Dirección: ¿va bien el camino?</h2><div class="rango" id="grano"><button data-g="semana">Por semana</button><button data-g="dia">Por día</button></div></div>'
  +'<p class="nota">Tendencia desde que empezó la medición, sin contar tus aparatos ('+n(D.excluidos)+' excluidos). El último punto (gris) es la '+que+' en curso. Las líneas azules son los hitos: pasa el dedo o el ratón por encima.</p>'
  +'<div class="dir-grid">'+DIR.map(tarjeta).join('')
  +'<div class="dir"><h3>Catálogo publicado</h3>'+tabla([{t:'',k:'t'},{t:'Al inicio',k:'a',num:1,f:n},{t:'Ahora',k:'b',num:1,f:n}],cat.map(([k,t])=>({t,a:primero(k),b:ult?ult[k]:null})))+'<p>Se cuenta cada día de los sitemaps y del catálogo de juegos.</p></div></div>'
  +'<ol class="hitos">'+D.hitos.map(h=>'<li>'+e(h.dia)+' · '+e(h.texto)+' <button data-borrar="'+h.id+'" title="Quitar hito">×</button></li>').join('')+'</ol>'
  +'<form class="hito-form" id="hito"><input type="date" name="dia" required value="'+new Date(Date.now()-216e5).toISOString().slice(0,10)+'"><input type="text" name="texto" required maxlength="120" placeholder="Nuevo hito: lanzamiento, cambio, campaña…"><button>Agregar hito</button></form>'
  +'<p class="nota" style="margin-top:8px">Para no contar un aparato tuyo: abre en él <a href="https://verbobiblia.com/?no-medir" target="_blank" rel="noopener">verbobiblia.com/?no-medir</a> una vez, o toca una de tus visitas en «Sesiones recientes» y marca «Esta visita fui yo».</p>';
 el.querySelectorAll('#grano button').forEach(b=>{b.classList.toggle('activo',b.dataset.g===GRANO);b.onclick=()=>{GRANO=b.dataset.g;direccion()}});
 const enviar=async d=>{await fetch('/panel/hito',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});DIR_DATOS={};direccion()};
 el.querySelectorAll('[data-borrar]').forEach(b=>b.onclick=()=>enviar({borrar:+b.dataset.borrar}));
 $('#hito').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.target);enviar({dia:f.get('dia'),texto:f.get('texto')})}}
async function cargar(d){RANGO=d;document.querySelectorAll('#rango button').forEach(b=>b.classList.toggle('activo',+b.dataset.d===d));
 const r=await fetch('/panel/datos?dias='+d);if(!r.ok){$('#m').innerHTML='<p>No se pudieron cargar los datos.</p>';return}const D=await r.json(),T=D.total||{};
 const fuentes={};D.origenes.forEach(o=>{const f=fuente(o.ref);fuentes[f]=(fuentes[f]||0)+o.sesiones});
 const votos=Object.fromEntries(D.votos.map(v=>[v.juego,v.n]));
 const juegos=D.juegos.map(j=>({...j,votos:votos[j.juego]||0}));
 $('#m').innerHTML='<div class="cifras">'+[[n(T.visitantes),'visitantes'],[n(T.nuevos),'nuevos'],[n(T.sesiones),'sesiones'],[n(T.vistas),'páginas vistas'],
  [dur(T.ms/Math.max(1,T.sesiones_ms)),'tiempo medio por sesión (de '+n(T.sesiones_ms)+' con tiempo medido)'],[n(T.juegos),'aperturas de juegos'],[n(T.descargas),'descargas'],[n(T.pinterest),'clics en «Guardar en Pinterest»'],[n(T.tarjetas),'clics en «Crear tarjeta»']]
  .map(c=>'<div class="cifra"><b>'+c[0]+'</b><span>'+c[1]+'</span></div>').join('')+'</div>'
 +'<section id="direccion"><p class="vacio">Cargando la dirección…</p></section>'
 +'<section><h2>¿Se quedan? Por sección</h2><p class="nota">«Entraron por aquí»: sesiones que empezaron en esa sección; «Siguieron»: cuántas de ellas vieron otra página. «Volvieron»: visitantes que vinieron a esa sección en más de un día. «Últimas 4 semanas»: visitantes por semana, de la más antigua a la actual (no depende del rango elegido).</p>'
  +tabla([{t:'Sección',k:'sec',f:v=>e(SECCIONES[v]||v)},{t:'Visitantes',k:'visitantes',num:1,barra:1},{t:'Páginas por sesión',k:'vistas',num:1,f:(v,r)=>((+v||0)/Math.max(1,r.sesiones)).toFixed(1)},{t:'Tiempo por sesión',k:'ms',num:1,f:dur},{t:'Entraron por aquí',k:'entradas',num:1,f:v=>n(v)},{t:'Siguieron',k:'siguieron',num:1,f:(v,r)=>pct(v,r.entradas)},{t:'Volvieron',k:'volvieron',num:1,f:(v,r)=>pct(v,r.visitantes)},{t:'Últimas 4 semanas',k:'semanas',f:v=>v.join(' · ')}],D.quedan)+'</section>'
 +'<section><h2>Visitas por día</h2>'+linea(D.porDia)+'<div id="semana"></div></section><div class="rejilla">'
 +'<section><h2>De dónde llegan</h2><p class="nota">Sesiones por origen (Google, Pinterest, Facebook, enlaces de otros sitios…).</p>'+tabla([{t:'Origen',k:'f'},{t:'Sesiones',k:'n',num:1,barra:1}],Object.entries(fuentes).map(([f,x])=>({f,n:x})).sort((a,b)=>b.n-a.n))+'</section>'
 +'<section><h2>Juegos</h2><p class="nota">«Aperturas»: veces que se abrió el juego. «De verdad»: con 5 toques o teclas o más. «Etapas»: promedio de la etapa más alta terminada por sesión; «Terminaron»: sesiones que llegaron al final (solo los juegos que lo informan). «Me gustó»: total acumulado.</p>'+tabla([{t:'Juego',k:'juego'},{t:'Aperturas',k:'partidas',num:1,barra:1},{t:'De verdad',k:'reales',num:1},{t:'Etapas',k:'media_etapa',num:1,f:(v,j)=>j.etapas?(+v).toFixed(1)+' de '+j.etapas:''},{t:'Terminaron',k:'terminaron',num:1,f:(v,j)=>j.etapas?n(v):''},{t:'Tiempo total',k:'total',num:1,f:dur},{t:'Promedio',k:'media',num:1,f:dur},{t:'👍',k:'votos',num:1}],juegos)+'</section>'
 +'<section><h2>Páginas más vistas</h2><p class="nota">Con el tiempo medio en la página y hasta dónde se lee (%).</p>'+tabla([{t:'Página',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1},{t:'Tiempo',k:'ms',num:1,f:dur},{t:'Lectura',k:'hondo',num:1,f:v=>v==null?'':Math.round(v)+'%'}],D.paginas)+'</section>'
 +'<section><h2>Banco de imágenes</h2><p class="nota">Páginas de imágenes más vistas.</p>'+tabla([{t:'Imagen',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1}],D.imagenes)+'</section>'
 +'<section><h2>Descargas</h2><p class="nota">Imágenes y archivos descargados.</p>'+tabla([{t:'Archivo',k:'objetivo',f:enlace},{t:'Desde',k:'ruta',f:v=>e(v)},{t:'Veces',k:'n',num:1,barra:1}],D.descargas)+'</section>'
 +'<section><h2>Lecciones de Escuela Dominical</h2>'+tabla([{t:'Lección',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1},{t:'Impresas',k:'impresiones',num:1}],D.lecciones)+'</section>'
 +'<section><h2>Dónde hacen clic</h2><p class="nota">Qué se tocó, en qué página y en qué parte de ella.</p>'+tabla([{t:'Página',k:'ruta',f:v=>e(v)},{t:'Clic en',k:'objetivo',f:v=>e(v)},{t:'Zona',k:'zona'},{t:'Veces',k:'n',num:1,barra:1}],D.clics)+'</section>'
 +'<section><h2>Búsquedas</h2>'+tabla([{t:'Buscaron',k:'objetivo'},{t:'Dónde',k:'ruta'},{t:'Veces',k:'n',num:1,barra:1}],D.busquedas)+'</section>'
 +'<section><h2>Enlaces de salida</h2><p class="nota">A qué otros sitios se van (Play Store, YouTube, Pinterest…).</p>'+tabla([{t:'Destino',k:'objetivo',f:v=>e(v)},{t:'Veces',k:'n',num:1,barra:1}],D.salidas)+'</section>'
 +'<section><h2>Países y dispositivos</h2>'+tabla([{t:'País',k:'pais'},{t:'Sesiones',k:'sesiones',num:1,barra:1}],D.paises)+tabla([{t:'Dispositivo',k:'disp'},{t:'Sesiones',k:'sesiones',num:1,barra:1}],D.dispositivos)+'</section>'
 +'<section><h2>Sugerencias de imágenes</h2>'+tabla([{t:'Imagen',k:'imagen'},{t:'Sugerencia',k:'texto'},{t:'Fecha',k:'creado',f:v=>new Date(v).toLocaleDateString('es',{timeZone:ZONA})}],D.sugerencias,'No hay sugerencias.')+'</section>'
 +'</div><section id="sesiones"><h2>Sesiones recientes</h2><p class="nota">Cada fila es una visita anónima. Tócala para ver su recorrido.</p>'
 +tabla([{t:'Inicio',k:'inicio',f:v=>new Date(v).toLocaleString('es',{timeZone:ZONA,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})},{t:'Origen',k:'ref',f:v=>e(fuente(v))},{t:'Páginas',k:'paginas',num:1},{t:'Duración',k:'ms',num:1,f:dur},{t:'Juegos',k:'juegos'},{t:'País',k:'pais'},{t:'Disp.',k:'disp'},{t:'Nuevo',k:'nuevo',f:v=>v?'sí':''}],
   D.sesiones.map(s=>({...s,_attr:' class="ses" data-s="'+e(s.sesion)+'"'})))+'<ol id="recorrido"></ol></section>';
 document.querySelectorAll('tr.ses').forEach(tr=>tr.onclick=async()=>{const r=await (await fetch('/panel/sesion?id='+tr.dataset.s)).json();
  $('#recorrido').innerHTML=r.eventos.map(x=>'<li>'+new Date(x.t).toLocaleTimeString('es',{timeZone:ZONA})+' · <b>'+e(x.tipo)+'</b> '+e(x.ruta)+(x.objetivo?' → '+e(x.objetivo):'')+(x.ms?' ('+dur(x.ms)+')':'')+'</li>').join('');
  $('#recorrido').innerHTML+='<li style="list-style:none;margin-top:8px"><button class="yo-btn" id="soy-yo">Esta visita fui yo: no contar este aparato</button></li>';
  $('#soy-yo').onclick=async()=>{await fetch('/panel/yo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sesion:tr.dataset.s})});DIR_DATOS={};cargar(RANGO)};
  $('#recorrido').scrollIntoView({behavior:'smooth',block:'nearest'})});
 semana(); direccion();
}
document.querySelectorAll('#rango button').forEach(b=>b.onclick=()=>cargar(+b.dataset.d));cargar(7);
</script>`);
