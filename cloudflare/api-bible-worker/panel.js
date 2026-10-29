// Medición propia de verbobiblia.com y panel privado de Juan.
//
// POST /v1/m          lotes de eventos de /assets/medir.js (anónimos: id al azar del navegador, sin IP ni cookies).
// GET  /panel         panel privado (pide la clave PANEL_CLAVE, un secreto del Worker:
//                     `npx wrangler secret put PANEL_CLAVE`); la sesión queda en una cookie firmada por 30 días.
// GET  /panel/datos   resúmenes en JSON (?dias=1|7|28|90)   ·   GET /panel/sesion?id=…  recorrido de una sesión
// Tabla: medicion.sql (base VOTOS_DB). La IP solo se usa para limitar envíos por hora, nunca se guarda.

const EVENTOS_POR_HORA = 1500;
const TIPOS = new Set(['vista', 'fin', 'clic', 'descarga', 'salida', 'juego', 'juego_fin', 'voto', 'busqueda', 'imprimir']);
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
  if (!lote || !ID.test(lote.v || '') || !ID.test(lote.s || '') || !Array.isArray(lote.e)) return vacio;

  const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
  const clave = new Request(`https://medir.verbo.internal/${encodeURIComponent(ip)}`);
  const previo = await caches.default.match(clave);
  const usados = previo ? Number(await previo.text()) || 0 : 0;
  if (usados >= EVENTOS_POR_HORA) return vacio;
  const eventos = lote.e.slice(0, 50).filter(x => x && TIPOS.has(x.tipo));
  await caches.default.put(clave, new Response(String(usados + eventos.length), { headers: { 'Cache-Control': 'max-age=3600' } }));
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
async function firma(env, vence) { return sha(`panel:${env.PANEL_CLAVE}:${vence}`); }
async function autorizado(request, env) {
  if (!env.PANEL_CLAVE) return false;
  const m = (request.headers.get('Cookie') || '').match(new RegExp(`${COOKIE}=(\\d+)\\.([a-f0-9]{64})`));
  if (!m || Number(m[1]) < Date.now()) return false;
  return (await firma(env, m[1])) === m[2];
}
const html = (cuerpo, extra = {}) => new Response(cuerpo, { headers: { 'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', ...extra } });
const datosJson = (obj) => new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function handlePanel(request, url, env) {
  if (!env.PANEL_CLAVE) return html(pagina('<p class="aviso">Falta configurar la clave del panel. En la carpeta del Worker: <code>npx wrangler secret put PANEL_CLAVE</code></p>'));
  if (url.pathname === '/panel/entrar' && request.method === 'POST') {
    const form = await request.formData();
    const clave = String(form.get('clave') || '');
    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    const k = new Request(`https://panel.verbo.internal/${encodeURIComponent(ip)}`);
    const intentos = Number(await (await caches.default.match(k))?.text() || 0);
    if (intentos >= 10) return html(pagina(login('Demasiados intentos. Espera una hora.')));
    if ((await sha(clave)) !== (await sha(env.PANEL_CLAVE))) {
      await caches.default.put(k, new Response(String(intentos + 1), { headers: { 'Cache-Control': 'max-age=3600' } }));
      return html(pagina(login('Clave incorrecta.')));
    }
    const vence = Date.now() + 30 * 86400000;
    return new Response(null, { status: 303, headers: { Location: '/panel', 'Set-Cookie':
      `${COOKIE}=${vence}.${await firma(env, vence)}; Path=/panel; Max-Age=${30 * 86400}; HttpOnly; Secure; SameSite=Strict` } });
  }
  if (url.pathname === '/panel/salir') {
    return new Response(null, { status: 303, headers: { Location: '/panel', 'Set-Cookie': `${COOKIE}=; Path=/panel; Max-Age=0; HttpOnly; Secure; SameSite=Strict` } });
  }
  if (!(await autorizado(request, env))) return html(pagina(login('')));
  if (url.pathname === '/panel/datos') return datosJson(await resumen(env, Math.min(365, Math.max(1, Number(url.searchParams.get('dias')) || 7))));
  if (url.pathname === '/panel/sesion') {
    const id = String(url.searchParams.get('id') || '');
    const { results } = await env.VOTOS_DB.prepare('SELECT t, tipo, ruta, objetivo, detalle, ms FROM eventos WHERE sesion = ? ORDER BY t LIMIT 500').bind(id).all();
    return datosJson({ eventos: results });
  }
  return html(PANEL);
}

async function resumen(env, dias) {
  const desde = Date.now() - dias * 86400000;
  const q = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(desde, ...p).all().then(r => r.results);
  const uno = (sql, ...p) => env.VOTOS_DB.prepare(sql).bind(desde, ...p).first();
  const [total, porDia, origenes, paginas, juegos, descargas, imagenes, lecciones, clics, busquedas, salidas, paises,
    dispositivos, sesiones, votosEv] = await Promise.all([
    uno(`SELECT SUM(tipo='vista') vistas, COUNT(DISTINCT sesion) sesiones, COUNT(DISTINCT visitante) visitantes,
           SUM(nuevo) nuevos, SUM(CASE WHEN tipo IN ('fin','juego_fin') THEN ms END) ms,
           SUM(tipo='descarga') descargas, SUM(tipo='juego') juegos FROM eventos WHERE t >= ?`),
    q(`SELECT dia, SUM(tipo='vista') vistas, COUNT(DISTINCT sesion) sesiones FROM eventos WHERE t >= ? GROUP BY dia ORDER BY dia`),
    q(`SELECT COALESCE(ref,'') ref, COUNT(DISTINCT sesion) sesiones FROM eventos WHERE t >= ? AND tipo='vista' GROUP BY 1 ORDER BY 2 DESC LIMIT 40`),
    q(`SELECT v.ruta, v.objetivo titulo, v.n vistas, f.ms, f.hondo FROM
         (SELECT ruta, MAX(objetivo) objetivo, COUNT(*) n FROM eventos WHERE t >= ? AND tipo='vista' GROUP BY ruta) v
         LEFT JOIN (SELECT ruta, AVG(ms) ms, AVG(json_extract(detalle,'$.hondo')) hondo FROM eventos WHERE t >= ? AND tipo='fin' GROUP BY ruta) f
         ON f.ruta = v.ruta ORDER BY v.n DESC LIMIT 60`, desde),
    q(`SELECT j.objetivo juego, j.n partidas, j.ses sesiones, f.total, f.media, f.reales FROM
         (SELECT objetivo, COUNT(*) n, COUNT(DISTINCT sesion) ses FROM eventos WHERE t >= ? AND tipo='juego' GROUP BY objetivo) j
         LEFT JOIN (SELECT objetivo, SUM(ms) total, AVG(ms) media, SUM(json_extract(detalle,'$.toques') >= 5) reales
           FROM eventos WHERE t >= ? AND tipo='juego_fin' GROUP BY objetivo) f ON f.objetivo = j.objetivo ORDER BY j.n DESC`, desde),
    q(`SELECT objetivo, ruta, COUNT(*) n FROM eventos WHERE t >= ? AND tipo='descarga' GROUP BY objetivo ORDER BY n DESC LIMIT 60`),
    q(`SELECT ruta, MAX(objetivo) titulo, COUNT(*) vistas FROM eventos WHERE t >= ? AND tipo='vista' AND ruta LIKE '/imagenes/%' GROUP BY ruta ORDER BY vistas DESC LIMIT 60`),
    q(`SELECT ruta, MAX(objetivo) titulo, SUM(tipo='vista') vistas, SUM(tipo='imprimir') impresiones FROM eventos
         WHERE t >= ? AND ruta LIKE '/recursos/escuela-dominical/%' GROUP BY ruta ORDER BY vistas DESC LIMIT 60`),
    q(`SELECT ruta, objetivo, json_extract(detalle,'$.zona') zona, COUNT(*) n FROM eventos WHERE t >= ? AND tipo IN ('clic','descarga','salida','imprimir')
         GROUP BY ruta, objetivo, zona ORDER BY n DESC LIMIT 80`),
    q(`SELECT ruta, objetivo, COUNT(*) n FROM eventos WHERE t >= ? AND tipo='busqueda' GROUP BY ruta, objetivo ORDER BY n DESC LIMIT 50`),
    q(`SELECT objetivo, COUNT(*) n FROM eventos WHERE t >= ? AND tipo='salida' GROUP BY objetivo ORDER BY n DESC LIMIT 40`),
    q(`SELECT COALESCE(pais,'?') pais, COUNT(DISTINCT sesion) sesiones FROM eventos WHERE t >= ? GROUP BY 1 ORDER BY 2 DESC LIMIT 30`),
    q(`SELECT COALESCE(disp,'?') disp, COUNT(DISTINCT sesion) sesiones FROM eventos WHERE t >= ? GROUP BY 1 ORDER BY 2 DESC`),
    q(`SELECT sesion, MIN(t) inicio, MAX(t) fin, SUM(tipo='vista') paginas, SUM(CASE WHEN tipo IN ('fin','juego_fin') THEN ms END) ms,
         MAX(ref) ref, MAX(pais) pais, MAX(disp) disp, MAX(nuevo) nuevo, GROUP_CONCAT(DISTINCT CASE WHEN tipo='juego' THEN objetivo END) juegos
         FROM eventos WHERE t >= ? GROUP BY sesion ORDER BY inicio DESC LIMIT 80`),
    q(`SELECT objetivo juego, SUM(json_extract(detalle,'$.gusta') = 1) si, SUM(json_extract(detalle,'$.gusta') = 0) no FROM eventos
         WHERE t >= ? AND tipo='voto' GROUP BY objetivo`),
  ]);
  const votos = (await env.VOTOS_DB.prepare('SELECT juego, COUNT(*) n FROM votos GROUP BY juego').all()).results;
  const sugerencias = (await env.VOTOS_DB.prepare('SELECT imagen, texto, creado, estado FROM sugerencias_imagenes ORDER BY creado DESC LIMIT 20').all()).results;
  return { dias, total, porDia, origenes, paginas, juegos, descargas, imagenes, lecciones, clics, busquedas, salidas, paises,
    dispositivos, sesiones, votos, votosEv, sugerencias };
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
.rejilla{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:18px}
section{background:var(--papel);border:1px solid var(--linea);border-radius:16px;padding:16px 18px;min-width:0}
section h2{margin:0 0 10px;font:600 16px Georgia,serif}section p.nota{margin:-4px 0 10px;color:var(--suave);font-size:12.5px}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--linea);vertical-align:top}
th{color:var(--suave);font-weight:600;font-size:12px}td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td a{color:var(--azul);text-decoration:none;word-break:break-all}.barra{height:6px;border-radius:3px;background:var(--oro);opacity:.75}
.tabla{max-height:420px;overflow:auto}svg text{fill:var(--suave);font-size:11px}.vacio{color:var(--suave);font-style:italic}
tr.ses{cursor:pointer}tr.ses:hover td{background:var(--fondo)}#recorrido{font-size:12.5px}#recorrido li{margin:2px 0}
`;

const PANEL = pagina(`<header><h1>Panel de Verbo</h1><div class="rango" id="rango">
<button data-d="1">Hoy</button><button data-d="7">7 días</button><button data-d="28">28 días</button><button data-d="90">90 días</button>
<a href="/panel/salir" style="margin-left:10px;color:var(--suave);align-self:center">Salir</a></div></header>
<main id="m"><p class="vacio">Cargando…</p></main>
<script>
const $=s=>document.querySelector(s), e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const n=x=>(+x||0).toLocaleString('es'), dur=ms=>{ms=+ms||0;const s=Math.round(ms/1000);return s<60?s+' s':s<3600?Math.floor(s/60)+' min '+(s%60)+' s':(s/3600).toFixed(1)+' h'};
const sitio='https://verbobiblia.com';
const fuente=r=>!r?'Directo / sin origen':/google/.test(r)?'Google':/pinterest|pin\\.it/.test(r)?'Pinterest':/facebook|fb\\.|m\\.facebook/.test(r)?'Facebook':/bing/.test(r)?'Bing':/youtube/.test(r)?'YouTube':/whatsapp|wa\\.me/.test(r)?'WhatsApp':/instagram/.test(r)?'Instagram':/chatgpt|openai|perplexity|gemini|claude/.test(r)?'Asistentes de IA':r;
function tabla(cols,filas,vacio='Sin datos todavía.'){if(!filas.length)return '<p class="vacio">'+vacio+'</p>';
 const max=Math.max(1,...filas.map(f=>+f[cols.find(c=>c.barra)?.k]||0));
 return '<div class="tabla"><table><tr>'+cols.map(c=>'<th>'+c.t+'</th>').join('')+'</tr>'+filas.map(f=>'<tr'+(f._attr||'')+'>'+cols.map(c=>{let v=c.f?c.f(f[c.k],f):e(f[c.k]);
 if(c.barra)v+='<div class="barra" style="width:'+Math.round(100*(+f[c.k]||0)/max)+'%"></div>';return '<td'+(c.num?' class="n"':'')+'>'+v+'</td>'}).join('')+'</tr>').join('')+'</table></div>'}
const enlace=r=>'<a href="'+sitio+e(r)+'" target="_blank" rel="noopener">'+e(r)+'</a>';
function linea(d){if(!d.length)return '<p class="vacio">Sin datos todavía.</p>';const W=900,H=180,p=28,max=Math.max(1,...d.map(x=>x.vistas));
 const x=i=>p+i*(W-2*p)/Math.max(1,d.length-1),y=v=>H-p-(H-2*p)*v/max;
 const camino=k=>d.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(r[k]).toFixed(1)).join(' ');
 return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Visitas por día"><path d="'+camino('vistas')+'" fill="none" stroke="var(--oro)" stroke-width="2.5"/><path d="'+camino('sesiones')+'" fill="none" stroke="var(--azul)" stroke-width="2"/>'
 +d.map((r,i)=>i%Math.ceil(d.length/10)?'':'<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle">'+r.dia.slice(5)+'</text>').join('')+'<text x="'+p+'" y="14">'+max+'</text></svg><p class="nota"><span style="color:var(--oro)">●</span> páginas vistas · <span style="color:var(--azul)">●</span> sesiones</p>'}
async function cargar(d){document.querySelectorAll('#rango button').forEach(b=>b.classList.toggle('activo',+b.dataset.d===d));
 const r=await fetch('/panel/datos?dias='+d);if(!r.ok){$('#m').innerHTML='<p>No se pudieron cargar los datos.</p>';return}const D=await r.json(),T=D.total||{};
 const fuentes={};D.origenes.forEach(o=>{const f=fuente(o.ref);fuentes[f]=(fuentes[f]||0)+o.sesiones});
 const votos=Object.fromEntries(D.votos.map(v=>[v.juego,v.n]));
 const juegos=D.juegos.map(j=>({...j,votos:votos[j.juego]||0}));
 const pinterest=D.clics.filter(c=>/pinterest/i.test(c.objetivo||'')).reduce((a,c)=>a+c.n,0),tarjetas=D.clics.filter(c=>/tarjeta/i.test(c.objetivo||'')).reduce((a,c)=>a+c.n,0);
 $('#m').innerHTML='<div class="cifras">'+[[n(T.visitantes),'visitantes'],[n(T.nuevos),'nuevos'],[n(T.sesiones),'sesiones'],[n(T.vistas),'páginas vistas'],
  [dur(T.ms/Math.max(1,T.sesiones)),'tiempo medio por sesión'],[n(T.juegos),'partidas de juegos'],[n(T.descargas),'descargas'],[n(pinterest),'guardados en Pinterest'],[n(tarjetas),'tarjetas creadas']]
  .map(c=>'<div class="cifra"><b>'+c[0]+'</b><span>'+c[1]+'</span></div>').join('')+'</div>'
 +'<section><h2>Visitas por día</h2>'+linea(D.porDia)+'</section><div class="rejilla">'
 +'<section><h2>De dónde llegan</h2><p class="nota">Sesiones por origen (Google, Pinterest, Facebook, enlaces de otros sitios…).</p>'+tabla([{t:'Origen',k:'f'},{t:'Sesiones',k:'n',num:1,barra:1}],Object.entries(fuentes).map(([f,x])=>({f,n:x})).sort((a,b)=>b.n-a.n))+'</section>'
 +'<section><h2>Juegos</h2><p class="nota">«Jugadas de verdad»: partidas con 5 toques o teclas o más. «Me gustó»: total acumulado.</p>'+tabla([{t:'Juego',k:'juego'},{t:'Partidas',k:'partidas',num:1,barra:1},{t:'De verdad',k:'reales',num:1},{t:'Tiempo total',k:'total',num:1,f:dur},{t:'Promedio',k:'media',num:1,f:dur},{t:'👍',k:'votos',num:1}],juegos)+'</section>'
 +'<section><h2>Páginas más vistas</h2><p class="nota">Con el tiempo medio en la página y hasta dónde se lee (%).</p>'+tabla([{t:'Página',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1},{t:'Tiempo',k:'ms',num:1,f:dur},{t:'Lectura',k:'hondo',num:1,f:v=>v==null?'':Math.round(v)+'%'}],D.paginas)+'</section>'
 +'<section><h2>Banco de imágenes</h2><p class="nota">Páginas de imágenes más vistas.</p>'+tabla([{t:'Imagen',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1}],D.imagenes)+'</section>'
 +'<section><h2>Descargas</h2><p class="nota">Imágenes y archivos descargados.</p>'+tabla([{t:'Archivo',k:'objetivo',f:enlace},{t:'Desde',k:'ruta',f:v=>e(v)},{t:'Veces',k:'n',num:1,barra:1}],D.descargas)+'</section>'
 +'<section><h2>Lecciones de Escuela Dominical</h2>'+tabla([{t:'Lección',k:'ruta',f:enlace},{t:'Vistas',k:'vistas',num:1,barra:1},{t:'Impresas',k:'impresiones',num:1}],D.lecciones)+'</section>'
 +'<section><h2>Dónde hacen clic</h2><p class="nota">Qué se tocó, en qué página y en qué parte de ella.</p>'+tabla([{t:'Página',k:'ruta',f:v=>e(v)},{t:'Clic en',k:'objetivo',f:v=>e(v)},{t:'Zona',k:'zona'},{t:'Veces',k:'n',num:1,barra:1}],D.clics)+'</section>'
 +'<section><h2>Búsquedas</h2>'+tabla([{t:'Buscaron',k:'objetivo'},{t:'Dónde',k:'ruta'},{t:'Veces',k:'n',num:1,barra:1}],D.busquedas)+'</section>'
 +'<section><h2>Enlaces de salida</h2><p class="nota">A qué otros sitios se van (Play Store, YouTube, Pinterest…).</p>'+tabla([{t:'Destino',k:'objetivo',f:v=>e(v)},{t:'Veces',k:'n',num:1,barra:1}],D.salidas)+'</section>'
 +'<section><h2>Países y dispositivos</h2>'+tabla([{t:'País',k:'pais'},{t:'Sesiones',k:'sesiones',num:1,barra:1}],D.paises)+tabla([{t:'Dispositivo',k:'disp'},{t:'Sesiones',k:'sesiones',num:1,barra:1}],D.dispositivos)+'</section>'
 +'<section><h2>Sugerencias de imágenes</h2>'+tabla([{t:'Imagen',k:'imagen'},{t:'Sugerencia',k:'texto'},{t:'Fecha',k:'creado',f:v=>new Date(v).toLocaleDateString('es')}],D.sugerencias,'No hay sugerencias.')+'</section>'
 +'</div><section><h2>Sesiones recientes</h2><p class="nota">Cada fila es una visita anónima. Tócala para ver su recorrido.</p>'
 +tabla([{t:'Inicio',k:'inicio',f:v=>new Date(v).toLocaleString('es')},{t:'Origen',k:'ref',f:v=>e(fuente(v))},{t:'Páginas',k:'paginas',num:1},{t:'Duración',k:'ms',num:1,f:dur},{t:'Juegos',k:'juegos'},{t:'País',k:'pais'},{t:'Disp.',k:'disp'},{t:'Nuevo',k:'nuevo',f:v=>v?'sí':''}],
   D.sesiones.map(s=>({...s,_attr:' class="ses" data-s="'+e(s.sesion)+'"'})))+'<ol id="recorrido"></ol></section>';
 document.querySelectorAll('tr.ses').forEach(tr=>tr.onclick=async()=>{const r=await (await fetch('/panel/sesion?id='+tr.dataset.s)).json();
  $('#recorrido').innerHTML=r.eventos.map(x=>'<li>'+new Date(x.t).toLocaleTimeString('es')+' · <b>'+e(x.tipo)+'</b> '+e(x.ruta)+(x.objetivo?' → '+e(x.objetivo):'')+(x.ms?' ('+dur(x.ms)+')':'')+'</li>').join('');
  $('#recorrido').scrollIntoView({behavior:'smooth',block:'nearest'})});
}
document.querySelectorAll('#rango button').forEach(b=>b.onclick=()=>cargar(+b.dataset.d));cargar(7);
</script>`);
