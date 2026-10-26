// Sendero del Código: mapa, capítulos, ejercicios, pistas, pergaminos y progreso. El contenido vive en lessons/.
import { cargarIdioma, t, L, idiomaActual } from './i18n.js';
import * as P from './progreso.js';
import * as Py from './python.js';
import { crearEditor } from './editor.js';
import { explicar } from './errores.js';

const vista = document.getElementById('vista');
const TODO_ABIERTO = new URLSearchParams(location.search).has('todo');  // ?todo abre todos los capítulos (pruebas)
const INTENTOS_SOLUCION = 3;
let indice, versiculos, lecciones = {}, limpiar = () => {};

// ── Utilidades ──────────────────────────────────────────────────────────────────────────────────────────────────
function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of hijos.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** Markdown mínimo: párrafos, ```bloques```, listas con «- », `código`, **negrita** y *cursiva*. */
function md(texto) {
  const lineas = esc(texto).split('\n');
  let html = '', enBloque = false, bloque = [], lista = [], parrafo = [];
  const enlinea = (s) => {
    const codigos = [];  // el código se aparta primero para que sus * no se lean como cursiva
    return s.replace(/`([^`]+)`/g, (m, c) => `\u0000${codigos.push(c) - 1}\u0000`)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codigos[i]}</code>`);
  };
  const cerrar = () => {
    if (parrafo.length) html += `<p>${enlinea(parrafo.join(' '))}</p>`;
    if (lista.length) html += `<ul>${lista.map(l => `<li>${enlinea(l)}</li>`).join('')}</ul>`;
    parrafo = []; lista = [];
  };
  for (const l of lineas) {
    if (l.startsWith('```')) {
      if (enBloque) { html += `<pre><code>${bloque.join('\n')}</code></pre>`; bloque = []; } else cerrar();
      enBloque = !enBloque; continue;
    }
    if (enBloque) bloque.push(l);
    else if (l.startsWith('- ')) { if (parrafo.length) { const p = parrafo; parrafo = []; html += `<p>${enlinea(p.join(' '))}</p>`; } lista.push(l.slice(2)); }
    else if (!l.trim()) cerrar();
    else { if (lista.length) cerrar(); parrafo.push(l); }
  }
  cerrar();
  return html;
}
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
function brindis(texto) {
  const b = h('div', { class: 'brindis', role: 'status' }, texto);
  document.body.append(b); setTimeout(() => b.remove(), 2600);
}
const cargarJSON = async (ruta) => (await fetch(ruta)).json();
async function leccion(archivo) { return (lecciones[archivo] ||= await cargarJSON('lessons/' + archivo)); }

function ventana(contenido, { alCerrar } = {}) {
  const anterior = document.activeElement;
  const cerrar = () => { velo.remove(); document.removeEventListener('keydown', tecla); anterior?.focus?.(); alCerrar?.(); };
  const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
  const caja = h('div', { class: 'ventana', role: 'dialog', 'aria-modal': 'true' },
    h('button', { class: 'cerrar', type: 'button', 'aria-label': t('cerrar'), onclick: cerrar }, '✕'), contenido);
  const velo = h('div', { class: 'velo', onclick: (e) => { if (e.target === velo) cerrar(); } }, caja);
  document.body.append(velo); document.addEventListener('keydown', tecla);
  caja.querySelector('.cerrar').focus();
  return cerrar;
}
const rollo = (id) => {
  const v = versiculos[id]?.[idiomaActual()];
  return v ? h('div', { class: 'rollo' }, `«${v.texto}»`, h('small', {}, `${v.ref} — ${v.version}`)) : null;
};
const iconoMedalla = () => h('span', { html: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 2h6l-3 12h-6zM21 2h6l3 12h-6z" fill="#2f4a6d"/><circle cx="20" cy="25" r="12" fill="#e0b862" stroke="#b8862f" stroke-width="2.5"/><path d="M20 18l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z" fill="#fff6dc"/></svg>' });

// ── Ajustes: idioma, tema, tamaño de letra ──────────────────────────────────────────────────────────────────────
function aplicarAjustes() {
  const a = P.ajustes();
  if (a.tema) document.documentElement.dataset.tema = a.tema; else delete document.documentElement.dataset.tema;
  document.documentElement.style.setProperty('--escala', (a.escala || 17) + 'px');
}
function textosBarra() {
  document.title = `${t('titulo')} · ${idiomaActual() === 'es' ? 'Aprende Python con la Biblia' : 'Learn Python with the Bible'}`;
  document.getElementById('titulo-juego').textContent = t('titulo');
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.aria)); el.title = t(el.dataset.aria); });
}
function oscuroAhora() {
  const tema = document.documentElement.dataset.tema;
  return tema ? tema === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches;
}
function botonesBarra() {
  // Enlace de regreso a la web de Verbo (en el sitio, relativo; dentro de la app Android no se muestra)
  const web = document.getElementById('b-web');
  if (/^verboEmbedApp/.test(window.name || '')) web.remove();
  else if (/(^|\.)verbobiblia\.com$/.test(location.hostname)) web.href = '/';
  document.getElementById('b-pergaminos').onclick = () => { location.hash = '#/pergaminos'; };
  document.getElementById('b-progreso').onclick = () => { location.hash = '#/progreso'; };
  document.getElementById('b-libre').onclick = () => { location.hash = '#/libre'; };
  document.getElementById('b-glosario').onclick = () => { location.hash = '#/glosario'; };
  document.getElementById('b-menos').onclick = () => { P.ajustar('escala', Math.max(14, (P.ajustes().escala || 17) - 1)); aplicarAjustes(); };
  document.getElementById('b-mas').onclick = () => { P.ajustar('escala', Math.min(24, (P.ajustes().escala || 17) + 1)); aplicarAjustes(); };
  document.getElementById('b-tema').onclick = () => { P.ajustar('tema', oscuroAhora() ? 'claro' : 'oscuro'); aplicarAjustes(); };
  document.getElementById('b-idioma').onclick = async () => {
    const nuevo = idiomaActual() === 'es' ? 'en' : 'es';
    P.ajustar('idioma', nuevo); await cargarIdioma(nuevo); textosBarra(); mostrar();
  };
}

// ── Desbloqueo ──────────────────────────────────────────────────────────────────────────────────────────────────
function abierto(cap) {
  if (!cap.archivo) return false;
  if (TODO_ABIERTO || cap.numero === 1) return true;
  const previo = indice.capitulos.find(c => c.numero === cap.numero - 1);
  return !!(previo && P.capitulo(idCap(previo)).completo);
}
const idCap = (cap) => cap.archivo ? cap.archivo.replace(/\.json$/, '') : 'cap-' + cap.numero;

// ── Mapa ────────────────────────────────────────────────────────────────────────────────────────────────────────
const ICONOS = {
  eden: '<path d="M0 18c-8 0-12-6-10-12 2-6 8-8 10-8s8 2 10 8-2 12-10 12z" fill="#5f9a57"/><rect x="-2" y="14" width="4" height="12" fill="#8a5a33"/><circle cx="-4" cy="4" r="2" fill="#c44"/><circle cx="4" cy="8" r="2" fill="#c44"/>',
  arca: '<path d="M-18 8h36l-6 10h-24z" fill="#8a5a33"/><rect x="-10" y="-2" width="20" height="10" fill="#b07a45"/><path d="M-12-2h24l-12-8z" fill="#6b4426"/><path d="M-22 22q6-4 11 0t11 0 11 0 11 0" stroke="#4b7fb0" stroke-width="2.5" fill="none"/>',
  desierto: '<path d="M-22 20q11-14 22 0t22 0z" fill="#d9b36c"/><path d="M-6 20q8-10 16 0z" fill="#c79a52"/><circle cx="12" cy="-6" r="6" fill="#e9b949"/>',
  jerico: '<rect x="-20" y="0" width="40" height="18" fill="#c7a174"/><rect x="-20" y="-6" width="8" height="8" fill="#b28a5c"/><rect x="-4" y="-6" width="8" height="8" fill="#b28a5c"/><rect x="12" y="-6" width="8" height="8" fill="#b28a5c"/><rect x="-4" y="8" width="8" height="10" fill="#6b4426"/>',
  jerusalen: '<rect x="-18" y="4" width="36" height="14" fill="#e0cfa6"/><path d="M-12 4V-4h24V4" fill="#d1bc8c"/><path d="M-14-4h28l-14-10z" fill="#b8862f"/><rect x="-3" y="8" width="6" height="10" fill="#8a5a33"/>',
  galilea: '<path d="M-24 14q12-6 24 0t24 0v8h-48z" fill="#5d8fbf"/><path d="M-10 8h20l-4 6h-12z" fill="#8a5a33"/><path d="M0 8V-10l10 14z" fill="#f4ead3"/>',
  roma: '<rect x="-20" y="2" width="40" height="16" fill="#d8c8a6"/><path d="M-22 2h44l-22-12z" fill="#b8862f"/><rect x="-16" y="4" width="4" height="14" fill="#f4ead3"/><rect x="-6" y="4" width="4" height="14" fill="#f4ead3"/><rect x="4" y="4" width="4" height="14" fill="#f4ead3"/><rect x="14" y="4" width="4" height="14" fill="#f4ead3"/>',
  patmos: '<path d="M-24 16q12-5 24 0t24 0v6h-48z" fill="#4b7fb0"/><path d="M-16 16q6-16 16-18t16 18z" fill="#9a8a6a"/><circle cx="-14" cy="-8" r="2" fill="#e9b949"/><circle cx="-4" cy="-12" r="2" fill="#e9b949"/><circle cx="6" cy="-12" r="2" fill="#e9b949"/><circle cx="16" cy="-8" r="2" fill="#e9b949"/>',
  nueva_jerusalen: '<rect x="-20" y="-2" width="40" height="20" fill="#e9d48f"/><rect x="-24" y="-8" width="8" height="26" fill="#d9bd6a"/><rect x="16" y="-8" width="8" height="26" fill="#d9bd6a"/><path d="M-4 18v-10a4 4 0 0 1 8 0v10z" fill="#fff6dc"/><circle cx="0" cy="-14" r="6" fill="#fff6dc" opacity=".8"/>',
  pablo: '<path d="M-24 16q12-5 24 0t24 0v6h-48z" fill="#4b7fb0"/><path d="M-16 8h32l-6 8h-20z" fill="#6b4426"/><path d="M-2 8V-14l14 18z" fill="#f4ead3"/><path d="M-4 8V-10l-10 14z" fill="#e9dcbc"/>',
};
function mostrarMapa() {
  const caps = indice.capitulos, ANCHO = 600, PASO = 118, ARRIBA = 150, CARTEL = 170;
  // antes del primer capítulo de cada nivel queda un hueco para su cartel
  const inicioNivel = (i) => i === 0 || caps[i].nivel !== caps[i - 1].nivel;
  let y = ARRIBA - PASO;
  const pts = caps.map((c, i) => { y += PASO + (i > 0 && inicioNivel(i) ? CARTEL : 0); return { x: ANCHO / 2 + Math.sin(i * 1.05) * 150, y }; });
  const alto = y + 70;
  const curva = (lista) => lista.map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`;
    const a = lista[i - 1], dy = (p.y - a.y) / 2;
    return `C${a.x} ${a.y + dy} ${p.x} ${p.y - dy} ${p.x} ${p.y}`;
  }).join('');
  let ultimoAbierto = 0;
  caps.forEach((c, i) => { if (abierto(c)) ultimoAbierto = i; });
  // franjas de cada lugar
  let franjas = '', i0 = 0;
  caps.forEach((c, i) => {
    if (i === caps.length - 1 || caps[i + 1].lugar !== c.lugar) {
      const y0 = i0 === 0 ? ARRIBA - 70 : inicioNivel(i0) ? pts[i0].y - 70 : (pts[i0 - 1].y + pts[i0].y) / 2, y1 = i === caps.length - 1 ? alto : (pts[i].y + pts[i + 1].y) / 2;
      const par = franjas.split('<rect').length % 2;
      const lado = par ? 70 : ANCHO - 70;
      franjas += `<rect x="0" y="${y0}" width="${ANCHO}" height="${y1 - y0}" fill="${par ? 'var(--fondo-2)' : 'transparent'}" opacity=".6"/>`
        + `<g transform="translate(${lado} ${y0 + 40}) scale(1.3)">${ICONOS[c.lugar] || ''}</g>`
        + `<text x="${lado}" y="${y0 + 90}" text-anchor="middle" font-family="var(--serif)" font-weight="700" font-size="20" fill="var(--tierra)">${esc(t('lugares.' + c.lugar))}</text>`;
      i0 = i + 1;
    }
  });
  const svg = `<svg viewBox="0 0 ${ANCHO} ${alto}" aria-hidden="true">${franjas}
    <path d="${curva(pts)}" fill="none" stroke="var(--borde)" stroke-width="16" stroke-linecap="round"/>
    <path d="${curva(pts)}" fill="none" stroke="var(--tierra)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".55"/>
    <path d="${curva(pts.slice(0, ultimoAbierto + 1))}" fill="none" stroke="var(--dorado)" stroke-width="6" stroke-linecap="round"/></svg>`;
  const mapa = h('div', { class: 'mapa', html: svg });
  // carteles de nivel sobre el sendero
  caps.forEach((c, i) => {
    if (!inicioNivel(i)) return;
    const nivel = indice.niveles.find(n => n.id === c.nivel);
    const delNivel = caps.filter(x => x.nivel === c.nivel && x.archivo);
    const completo = delNivel.length && caps.filter(x => x.nivel === c.nivel).every(x => P.capitulo(idCap(x)).completo);
    mapa.append(h('div', { class: 'cartel-nivel', style: `top:${(i === 0 ? 42 : (pts[i - 1].y + pts[i].y) / 2) / alto * 100}%` },
      h('b', {}, L(nivel.titulo)), h('span', {}, completo ? '★ ' + t('nivel_completo') : L(nivel.lema))));
  });
  const actual = caps.findIndex(c => abierto(c) && !P.capitulo(idCap(c)).completo);
  caps.forEach((c, i) => {
    const ok = abierto(c), completo = P.capitulo(idCap(c)).completo;
    const clases = ['parada', ok ? '' : 'cerrada', completo ? 'completa' : '', i === actual ? 'actual' : ''].join(' ');
    const ayuda = !c.archivo ? t('proximamente') : ok ? '' : t('bloqueado');
    mapa.append(h('button', {
      type: 'button', class: clases, style: `left:${pts[i].x / ANCHO * 100}%;top:${pts[i].y / alto * 100}%`,
      'aria-disabled': ok ? null : 'true', title: ayuda || null,
      'aria-label': `${t('capitulo')} ${c.numero}: ${L(c.titulo)}${ayuda ? ' — ' + ayuda : ''}`,
      onclick: () => { if (ok) location.hash = `#/cap/${idCap(c)}`; else brindis(ayuda); },
    }, h('span', { class: 'sello' }, completo ? '✓' : c.numero), h('span', { class: 'nombre' }, L(c.titulo))));
  });
  vista.replaceChildren(h('section', { class: 'portada' },
    h('h1', {}, t('titulo')), h('p', { class: 'lema' }, t('lema')),
    h('div', { class: 'saludo' }, h('img', { src: 'assets/svg/sofer.svg', alt: '' }),
      h('div', { class: 'globo' }, h('b', {}, `${t('guia_nombre')}, ${t('guia_rol')}`), h('br'), t('guia_hola'))),
    h('section', { class: 'niveles', 'aria-labelledby': 'niveles-t' },
      h('h2', { id: 'niveles-t' }, t('niveles_titulo')), h('p', {}, t('niveles_texto')),
      h('div', { class: 'niveles-fila' }, indice.niveles.map((n, k) => {
        const caps = indice.capitulos.filter(c => c.nivel === n.id);
        const hechos = caps.filter(c => P.capitulo(idCap(c)).completo).length;
        return h('article', { class: 'nivel nivel-' + n.id },
          h('div', { class: 'etiqueta' }, `${t('nivel')} ${k + 1}`), h('h3', {}, L(n.titulo)), h('p', { class: 'lema-nivel' }, L(n.lema)),
          h('div', { class: 'barra-nivel', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': caps.length, 'aria-valuenow': hechos,
            'aria-label': L(n.titulo) }, h('span', { style: `width:${hechos / caps.length * 100}%` })),
          h('b', { class: 'aprenderas' }, t('aprenderas')), h('ul', {}, L(n.aprenderas).map(x => h('li', {}, x))));
      }))),
    mapa,
    /(^|\.)verbobiblia\.com$/.test(location.hostname) && !/^verboEmbedApp/.test(window.name || '')
      ? h('p', { class: 'mas-juegos' }, h('a', { class: 'boton', href: '/juegos/' }, '← ' + t('mas_juegos'))) : null));
}

// ── Capítulo ────────────────────────────────────────────────────────────────────────────────────────────────────
async function mostrarCapitulo(id, paso) {
  const cap = indice.capitulos.find(c => idCap(c) === id);
  if (!cap || !abierto(cap)) { location.hash = '#/'; return; }
  const lec = await leccion(cap.archivo);
  Py.preparar().catch(() => {});
  const ejercicios = lec.ejercicios;
  const hecho = (i) => P.ejercicio(id, ejercicios[i].id).hecho;
  const permitido = (k) => k <= 1 || hecho(k - 2) || (k > 0 && hecho(k - 1));
  if (!permitido(paso)) paso = 0;

  const pasos = h('ol', { class: 'pasos', 'aria-label': t('capitulo') },
    h('li', {}, h('button', { type: 'button', class: 'paso' + (paso === 0 ? ' activo' : ''), 'aria-current': paso === 0 ? 'step' : null,
      onclick: () => { location.hash = `#/cap/${id}/0`; } }, t('leccion'))),
    ejercicios.map((ej, i) => h('li', {}, h('button', {
      type: 'button', class: ['paso', hecho(i) ? 'hecho' : '', paso === i + 1 ? 'activo' : '', ej.reto ? 'reto' : ''].join(' '),
      disabled: !permitido(i + 1), 'aria-current': paso === i + 1 ? 'step' : null,
      'aria-label': ej.reto ? t('reto') : `${t('ejercicio')} ${i + 1}`,
      onclick: () => { location.hash = `#/cap/${id}/${i + 1}`; },
    }, ej.reto ? '★' : i + 1))));

  const cabeza = h('div', { class: 'cabeza-cap' },
    h('a', { class: 'boton chico', href: '#/' }, '← ' + t('mapa')),
    h('div', {}, h('div', { class: 'etiqueta' }, `${L(indice.niveles.find(n => n.id === cap.nivel)?.titulo) || ''} · ${t('capitulo')} ${lec.numero} · ${t('lugares.' + lec.lugar)}`),
      h('h1', {}, L(lec.titulo))),
    h('span', { class: 'tema' }, L(lec.tema)));

  const mesa = h('div', { class: 'mesa' });
  vista.replaceChildren(h('section', { class: 'capitulo' }, cabeza, pasos, mesa));
  if (paso === 0) armarLeccion(mesa, lec, id);
  else armarEjercicio(mesa, lec, id, paso - 1);
}

function guia(texto) {
  const globo = h('div', { class: 'globo', role: 'status' }, texto);
  return { el: h('div', { class: 'guia' }, h('img', { src: 'assets/svg/sofer.svg', alt: t('guia_nombre') }), globo), decir: (x) => { globo.textContent = x; } };
}

function armarLeccion(mesa, lec, id) {
  const izq = h('div', { class: 'tarjeta' },
    h('div', { class: 'etiqueta' }, t('leccion')),
    rollo(lec.versiculo) ? h('div', { class: 'versiculo-cap' }, `«${versiculos[lec.versiculo][idiomaActual()].texto}»`,
      h('small', {}, `${versiculos[lec.versiculo][idiomaActual()].ref} — ${versiculos[lec.versiculo][idiomaActual()].version}`)) : null,
    h('div', { html: L(lec.leccion).map(md).join('') }),
    guia(lec.numero === 1 ? t('guia_hola') : azar(t('guia_animo'))).el,
    h('div', { class: 'acciones', style: 'margin-top:1rem' },
      h('a', { class: 'boton dorado', href: `#/cap/${id}/1` }, (P.ejercicio(id, lec.ejercicios[0].id).hecho ? t('continuar') : t('comenzar')) + ' →')));
  const zona = armarZona({ codigo: L(lec.ejemplo), soloEjecutar: true, archivos: L(lec.archivos_ejemplo) });
  mesa.append(izq, zona.el);
}

/** Zona de código: editor (o hueco / ordenar), botones, consola y avisos. */
function armarZona({ codigo = '', ej = null, estado = null, soloEjecutar = false, alComprobar, alGuardar, archivos = null, textoEjecutar = null }) {
  const archivosEj = (ej && L(ej.archivos)) || archivos || null;
  const tipo = ej?.tipo || 'escribir';
  const idioma = idiomaActual();
  let editor = null, leerCodigo, ultimoFoco = null;
  const contenedor = h('div');
  const simbolos = h('div', { class: 'simbolos', role: 'toolbar', 'aria-label': t('simbolos') });

  if (tipo === 'escribir') {
    const caja = h('div', { class: 'editor' });
    contenedor.append(caja);
    editor = crearEditor(caja, {
      texto: estado?.codigo?.[idioma] ?? codigo,
      alCambiar: (v) => alGuardar?.({ codigo: v }),
      atajos: [
        { key: 'Mod-Enter', run: () => { ejecutar(); return true; } },
        { key: 'Mod-Shift-Enter', run: () => { comprobar?.(); return true; } },
      ],
    });
    leerCodigo = () => editor.valor();
  } else if (tipo === 'hueco') {
    const partes = L(ej.plantilla).split('___');
    const guardados = estado?.huecos?.[idioma] || [];
    const entradas = partes.slice(1).map((_, i) => h('input', {
      type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': `${t('ejercicio')}: ${i + 1}`,
      value: guardados[i] || '', size: Math.max(4, (guardados[i] || '').length + 1),
      oninput: (e) => { e.target.size = Math.max(4, e.target.value.length + 1); alGuardar?.({ huecos: entradas.map(x => x.value) }); },
      onfocus: (e) => { ultimoFoco = e.target; },
      onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); (e.ctrlKey || e.metaKey) ? ejecutar() : comprobar(); } },
    }));
    const codigoEl = h('div', { class: 'hueco-codigo' });
    partes.forEach((p, i) => { codigoEl.append(p); if (entradas[i]) codigoEl.append(entradas[i]); });
    contenedor.append(h('p', { class: 'ayuda' }, t('hueco_ayuda')), codigoEl);
    leerCodigo = () => partes.reduce((s, p, i) => s + p + (entradas[i] ? entradas[i].value : ''), '');
    contenedor.ponerSolucion = () => {
      const patron = new RegExp('^' + L(ej.plantilla).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/___/g, '(.+?)') + '$', 's');
      const m = L(ej.solucion).match(patron);
      if (m) entradas.forEach((x, i) => { x.value = m[i + 1]; x.size = Math.max(4, x.value.length + 1); });
      alGuardar?.({ huecos: entradas.map(x => x.value) });
    };
  } else if (tipo === 'ordenar') {
    const lineas = L(ej.lineas);
    const mezcla = barajar(lineas.map((_, i) => i), ej.id);
    let armado = (estado?.orden?.[idioma] || []).filter(i => i < lineas.length);
    const lista = h('ol', { class: 'lineas armado', 'aria-label': t('ordenar_ayuda') });
    const disponibles = h('ul', { class: 'lineas disponibles' });
    const pintar = () => {
      lista.replaceChildren(...(armado.length ? armado.map((i, pos) => h('li', {}, h('button', { type: 'button', title: t('ordenar_quitar'),
        onclick: () => { armado.splice(pos, 1); pintar(); alGuardar?.({ orden: armado }); } }, lineas[i])))
        : [h('li', { class: 'vacia' }, t('ordenar_vacio'))]));
      disponibles.replaceChildren(...mezcla.filter(i => !armado.includes(i)).map(i => h('li', {}, h('button', { type: 'button',
        onclick: () => { armado.push(i); pintar(); alGuardar?.({ orden: armado }); } }, lineas[i]))));
    };
    pintar();
    contenedor.append(h('div', { class: 'ordenar' }, h('p', { class: 'ayuda' }, t('ordenar_ayuda')), lista, disponibles));
    leerCodigo = () => armado.map(i => lineas[i]).join('\n');
    contenedor.ponerSolucion = () => { armado = lineas.map((_, i) => i); pintar(); alGuardar?.({ orden: armado }); };
  }

  // Barra de símbolos para el teléfono
  if (tipo !== 'ordenar') {
    const insertar = (s) => {
      if (editor) editor.insertar(s);
      else if (ultimoFoco) {
        const x = ultimoFoco, a = x.selectionStart, b = x.selectionEnd;
        x.value = x.value.slice(0, a) + s + x.value.slice(b); x.selectionStart = x.selectionEnd = a + s.length;
        x.dispatchEvent(new Event('input')); x.focus();
      }
    };
    for (const s of [':', '(', ')', '"', "'", '=', '[', ']', '{', '}', '_', '#', '+', '*', ',', '.', 'tab']) {
      simbolos.append(h('button', { type: 'button', 'aria-label': s,
        onpointerdown: (e) => e.preventDefault(),
        onclick: () => insertar(s === 'tab' ? '    ' : s) }, s === 'tab' ? '⇥' : s));
    }
    flotarSimbolos(simbolos, editor ? editor.vista.dom : contenedor);
  }

  // Botones y consola
  const estadoPy = h('span');
  const salida = h('div');
  const avisos = h('div', { 'aria-live': 'polite' });
  const consola = h('div', { class: 'consola' }, h('div', { class: 'titulo' }, h('span', {}, t('consola')), estadoPy), salida);
  const bEjecutar = h('button', { type: 'button', class: 'boton principal', onclick: () => ejecutar() },
    '▶ ' + (textoEjecutar || (soloEjecutar ? t('probar_ejemplo') : t('ejecutar'))), h('span', { class: 'atajo' }, ' ' + t('ejecutar_tecla')));
  const bComprobar = soloEjecutar ? null : h('button', { type: 'button', class: 'boton dorado', onclick: () => comprobar() }, '✓ ' + t('comprobar'));
  const bReiniciar = soloEjecutar || tipo !== 'escribir' ? null : h('button', { type: 'button', class: 'boton chico derecha',
    onclick: () => confirmar(t('reiniciar_confirmar'), () => { editor.poner(codigo); avisos.replaceChildren(); }) }, '↺ ' + t('reiniciar'));

  const vacia = () => salida.replaceChildren(h('div', { class: 'vacia' }, t('consola_vacia')));
  vacia();
  const quitar = Py.alCambiar((e) => {
    const ocupado = e.estado === 'cargando' || e.estado === 'corriendo';
    bEjecutar.disabled = ocupado; if (bComprobar) bComprobar.disabled = ocupado;
    if (e.estado === 'cargando') {
      salida.replaceChildren(h('div', { class: 'cargando' }, h('img', { class: 'pluma', src: 'assets/svg/pluma.svg', alt: '' }),
        t(e.paso === 'arnes' ? 'py_arnes' : 'py_descargando')));
      estadoPy.textContent = '';
    } else if (e.estado === 'listo') {
      if (salida.querySelector('.cargando')) vacia();
      estadoPy.textContent = '';
    } else if (e.estado === 'corriendo') estadoPy.textContent = t('py_corriendo');
    else if (e.estado === 'error') {
      salida.replaceChildren(h('div', {}, t('py_error'), ' ', h('button', { type: 'button', class: 'boton chico', onclick: () => location.reload() }, t('reintentar'))));
    }
  });
  const limpiarAnterior = limpiar;
  limpiar = () => { quitar(); limpiarAnterior(); };

  function mostrarSalida(texto, extra) {
    salida.replaceChildren(texto ? h('pre', {}, texto) : extra ? '' : h('div', { class: 'vacia' }, t('sin_salida')));
    if (extra) salida.append(extra);
  }
  function avisoError(err, cod) {
    const x = explicar(err, t);
    editor?.marcarLinea(err.linea);
    return h('div', { class: 'aviso mal' }, h('h3', {}, x.titulo), h('div', {}, x.explicacion),
      err.texto ? h('div', { class: 'codigo-linea' }, err.texto.trim()) : null,
      x.pista ? h('div', { class: 'pista-error' }, '💡 ', x.pista) : null);
  }
  function avisoTiempo() {
    return h('div', { class: 'aviso mal' }, h('h3', {}, '⏳ ' + t('tiempo')), h('div', {}, t('tiempo_pista')));
  }

  // Ejecutar: con input() interactivo. Cuando el programa pide un dato, se vuelve a correr con las respuestas dadas.
  let respuestas = [];
  async function ejecutar(seguir = false) {
    if (!seguir) respuestas = [];
    avisos.replaceChildren(); editor?.marcarLinea(null);
    const cod = leerCodigo();
    const r = await Py.correr({ codigo: cod, entradas: respuestas, pruebas: null, semilla: 7, archivos: archivosEj });
    if (r.tiempo) { salida.replaceChildren(); avisos.append(avisoTiempo()); return r; }
    if (r.fallo) { salida.replaceChildren(h('div', {}, t('py_error'))); return r; }
    if (r.pide_entrada !== null && r.pide_entrada !== undefined) {
      const campo = h('input', { type: 'text', autocomplete: 'off', 'aria-label': t('entrada_pide') });
      const enviar = () => { respuestas.push(campo.value); ejecutar(true); };
      campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') enviar(); });
      salida.replaceChildren(h('pre', {}, r.salida), h('div', { class: 'entrada' }, h('label', {}, t('entrada_pide')), campo,
        h('button', { type: 'button', class: 'boton chico', onclick: enviar }, t('entrada_enviar'))));
      campo.focus();
      return r;
    }
    mostrarSalida(r.salida, r.dibujo && pintarDibujo(r.dibujo));
    if (r.error) avisos.append(avisoError(r.error, cod));
    return r;
  }

  async function comprobar() {
    if (!ej) return;
    avisos.replaceChildren(); editor?.marcarLinea(null);
    const cod = leerCodigo();
    const pruebas = Array.isArray(ej.pruebas) ? ej.pruebas : ej.pruebas[idioma];
    const r = await Py.correr({ codigo: cod, entradas: ej.entradas?.[idioma] || [], pruebas, semilla: 7, archivos: archivosEj });
    let ok = false;
    if (r.tiempo) { salida.replaceChildren(); avisos.append(avisoTiempo()); }
    else if (r.fallo) salida.replaceChildren(h('div', {}, t('py_error')));
    else {
      mostrarSalida(r.salida, r.dibujo && pintarDibujo(r.dibujo));
      if (r.error) avisos.append(avisoError(r.error, cod));
      else if (r.pide_entrada != null) avisos.append(h('div', { class: 'aviso mal' }, h('h3', {}, t('casi')), t('faltan_entradas')));
      else {
        const malas = r.pruebas.filter(x => !x.ok);
        ok = !malas.length;
        if (ok) avisos.append(h('div', { class: 'aviso bien' }, h('h3', {}, '✓ ' + t('bien')), t('bien_texto')));
        else {
          const primera = malas[0];
          const texto = (m) => (typeof m === 'string' ? t(m) : L(m));
          avisos.append(h('div', { class: 'aviso mal' }, h('h3', {}, t('casi')), h('div', {}, t('falta_pruebas')),
            h('ul', {}, malas.slice(0, 3).map(m => h('li', {}, texto(m.msg)))),
            'esperada' in primera ? h('div', { class: 'comparar' },
              h('div', {}, h('b', {}, t('esperado')), h('pre', {}, primera.esperada || ' ')),
              h('div', {}, h('b', {}, t('obtenido')), h('pre', {}, primera.obtenida || ' '))) : null));
        }
      }
    }
    alComprobar?.(ok, avisos);
  }

  const el = h('div', { class: 'zona' }, contenedor, simbolos,
    h('div', { class: 'acciones' }, bEjecutar, bComprobar, bReiniciar), consola, avisos);
  return { el, editor, ponerSolucion: (sol) => { if (editor) editor.poner(sol); else contenedor.ponerSolucion?.(); } };
}

/** Confirmación dentro de la página (sin diálogos del navegador). */
/** Pinta en un <canvas> lo que el programa dibujó con el módulo lienzo. */
function pintarDibujo(d) {
  const c = h('canvas', { class: 'lienzo', width: d.ancho, height: d.alto, role: 'img', 'aria-label': 'lienzo' });
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, d.ancho, d.alto);
  for (const o of d.ordenes) {
    g.fillStyle = o.color; g.strokeStyle = o.borde || o.color;
    if (o.tipo === 'fondo') g.fillRect(0, 0, d.ancho, d.alto);
    else if (o.tipo === 'rect') { g.fillRect(o.x, o.y, o.w, o.h); if (o.borde) { g.lineWidth = 2; g.strokeRect(o.x, o.y, o.w, o.h); } }
    else if (o.tipo === 'circulo') { g.beginPath(); g.arc(o.x, o.y, Math.max(0, o.r), 0, Math.PI * 2); g.fill(); if (o.borde) { g.lineWidth = 2; g.stroke(); } }
    else if (o.tipo === 'linea') { g.lineWidth = o.grosor; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); }
    else if (o.tipo === 'texto') {
      g.font = `${o.tam}px 'Cormorant Garamond', Georgia, serif`; g.textBaseline = 'top'; g.textAlign = o.centrado ? 'center' : 'left';
      g.fillText(o.texto, o.x, o.y);
    }
  }
  return c;
}

/** Archivos que el ejercicio pone en la carpeta del programa (para abrir con open()). */
function verArchivos(archivos) {
  if (!archivos || !Object.keys(archivos).length) return null;
  return h('div', { class: 'archivos' }, h('div', { class: 'etiqueta' }, t('archivos')),
    Object.entries(archivos).map(([n, c]) => h('details', {}, h('summary', {}, '📄 ' + n), h('pre', {}, c))));
}

function confirmar(pregunta, siAcepta) {
  const cerrar = ventana(h('div', {}, h('h2', {}, pregunta), h('div', { class: 'botones' },
    h('button', { type: 'button', class: 'boton', onclick: () => cerrar() }, t('cancelar')),
    h('button', { type: 'button', class: 'boton dorado', onclick: () => { cerrar(); siAcepta(); } }, t('aceptar')))));
}

function barajar(lista, semilla) {
  let s = [...semilla].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  let x;
  do { x = [...lista]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } }
  while (x.length > 1 && x.every((v, i) => v === lista[i]));
  return x;
}

/** En pantallas táctiles, la barra de símbolos se pega encima del teclado mientras se escribe. */
function flotarSimbolos(barra, zona) {
  if (!matchMedia('(pointer: coarse)').matches || !window.visualViewport) return;
  const vv = window.visualViewport;
  const ajustar = () => barra.style.setProperty('--teclado', Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px');
  zona.addEventListener('focusin', () => { barra.classList.add('flotante'); ajustar(); });
  zona.addEventListener('focusout', () => setTimeout(() => { if (!zona.contains(document.activeElement)) barra.classList.remove('flotante'); }, 150));
  vv.addEventListener('resize', ajustar); vv.addEventListener('scroll', ajustar);
}

function armarEjercicio(mesa, lec, id, n) {
  const ej = lec.ejercicios[n], est = P.ejercicio(id, ej.id), idioma = idiomaActual();
  const pistas = L(ej.pistas) || [];
  const guiaEj = guia(est.hecho ? azar(t('guia_animo')) : ej.reto ? t('guia_reto') : azar(t('guia_empezar')));

  const cajaPistas = h('div', { class: 'pistas' });
  const bPista = h('button', { type: 'button', class: 'boton chico' });
  const bSolucion = h('button', { type: 'button', class: 'boton chico' }, '🔑 ' + t('ver_solucion'));
  const notaSol = h('div', { class: 'nota-solucion' });
  const pintarPistas = () => {
    cajaPistas.replaceChildren(...pistas.slice(0, est.pistas).map((p, i) => h('div', { class: 'pista', html: `<b>${esc(t('pista_n', { n: i + 1 }))}:</b> ` + md(p).replace(/^<p>|<\/p>$/g, '') })));
    bPista.textContent = '💡 ' + t('pista_n', { n: Math.min(est.pistas + 1, pistas.length) });
    bPista.classList.toggle('oculto', est.pistas >= pistas.length);
    const faltan = Math.max(0, INTENTOS_SOLUCION - est.intentos);
    const puede = est.hecho || (est.pistas >= pistas.length && faltan === 0);
    bSolucion.disabled = !puede;
    notaSol.textContent = puede ? '' : t('solucion_falta', { n: faltan || 0 });
  };
  bPista.onclick = () => { est.pistas = Math.min(pistas.length, est.pistas + 1); P.guardar(); pintarPistas(); };

  const siguiente = h('div', { class: 'acciones' });
  const pintarSiguiente = () => {
    siguiente.replaceChildren();
    if (!est.hecho) return;
    const ultimo = n === lec.ejercicios.length - 1;
    siguiente.append(ultimo
      ? h('button', { type: 'button', class: 'boton dorado', onclick: () => terminarCapitulo(lec, id) }, '★ ' + t('capitulo_completo'))
      : h('a', { class: 'boton dorado', href: `#/cap/${id}/${n + 2}` }, t('siguiente') + ' →'));
  };

  const izq = h('div', { class: 'tarjeta' },
    h('div', { class: 'etiqueta' }, ej.reto ? '★ ' + t('reto') : `${t('ejercicio')} ${n + 1} ${t('de')} ${lec.ejercicios.length}`),
    h('div', { html: md(L(ej.enunciado)) }),
    verArchivos(L(ej.archivos)),
    cajaPistas, h('div', { class: 'acciones', style: 'margin-top:.6rem' }, pistas.length ? bPista : null, bSolucion),
    notaSol, guiaEj.el, h('div', { style: 'margin-top:1rem' }, siguiente));

  let guardarReloj;
  const zona = armarZona({
    codigo: L(ej.inicial) ?? '', ej, estado: est,
    alGuardar: (cambio) => {
      if ('codigo' in cambio) (est.codigo ||= {})[idioma] = cambio.codigo;
      if ('huecos' in cambio) (est.huecos ||= {})[idioma] = cambio.huecos;
      if ('orden' in cambio) (est.orden ||= {})[idioma] = cambio.orden;
      clearTimeout(guardarReloj); guardarReloj = setTimeout(P.guardar, 400);
    },
    alComprobar: (ok) => {
      if (ok) {
        const nuevo = !est.hecho;
        est.hecho = true; P.guardar();
        guiaEj.decir(azar(t('guia_animo')));
        pintarSiguiente(); pintarPistas();
        const paso = document.querySelectorAll('.paso')[n + 1];
        paso?.classList.add('hecho');
        const prox = document.querySelectorAll('.paso')[n + 2];
        if (prox) prox.disabled = false;
        if (nuevo && n === lec.ejercicios.length - 1) setTimeout(() => terminarCapitulo(lec, id), 700);
      } else {
        est.intentos++; P.guardar();
        guiaEj.decir(azar(t('guia_error')));
        pintarPistas();
      }
    },
  });
  bSolucion.onclick = () => {
    const sol = ej.tipo === 'ordenar' ? L(ej.lineas).join('\n') : L(ej.solucion);
    const cerrar = ventana(h('div', {}, h('h2', {}, t('solucion_titulo')), h('pre', {}, h('code', {}, sol)),
      h('div', { class: 'botones' }, h('button', { type: 'button', class: 'boton dorado', onclick: () => { zona.ponerSolucion(sol); cerrar(); } }, t('usar_solucion')))));
  };
  pintarPistas(); pintarSiguiente();
  mesa.append(izq, zona.el);
}

async function terminarCapitulo(lec, id) {
  const todos = lec.ejercicios.every(e => P.ejercicio(id, e.id).hecho);
  if (!todos) return;
  P.completarCapitulo(id, lec.versiculo, true);
  const cerrar = ventana(h('div', {},
    h('h2', {}, '★ ' + t('capitulo_completo')),
    h('p', {}, t('pergamino_nuevo')), rollo(lec.versiculo),
    h('p', { class: 'medalla' }, iconoMedalla(), `${t('medalla_nueva')} ${L(lec.medalla)}`),
    h('div', { class: 'botones' }, h('button', { type: 'button', class: 'boton dorado', onclick: () => cerrar() }, t('volver_mapa')))),
  { alCerrar: async () => {
    // Pausa natural al terminar un capítulo: aquí, y solo aquí, puede ir un anuncio (H5 Games Ads de Verbo).
    try { await window.VerboAds?.pausa('fin-capitulo', 'next'); } catch (e) { /* sin anuncios */ }
    location.hash = '#/';
  } });
}

// ── Pergaminos y progreso ───────────────────────────────────────────────────────────────────────────────────────
async function mostrarPergaminos() {
  const tarjetas = [];
  for (const c of indice.capitulos) {
    const lec = c.archivo ? await leccion(c.archivo) : null;
    const ganado = lec && P.pergaminos().includes(lec.versiculo);
    tarjetas.push(ganado ? rollo(lec.versiculo)
      : h('div', { class: 'rollo sellado' }, `${t('pergamino_bloqueado')} · ${t('capitulo')} ${c.numero}`, h('small', {}, L(c.titulo))));
  }
  const medallas = indice.capitulos.filter(c => c.archivo && P.capitulo(idCap(c)).completo);
  vista.replaceChildren(h('section', { class: 'pagina' }, h('a', { class: 'boton chico', href: '#/' }, '← ' + t('mapa')),
    h('h1', {}, t('pergaminos_titulo')),
    P.pergaminos().length ? null : h('p', {}, t('pergaminos_vacio')),
    medallas.length ? h('div', { class: 'fila' }, await Promise.all(medallas.map(async c => h('span', { class: 'medalla' }, iconoMedalla(), L((await leccion(c.archivo)).medalla))))) : null,
    h('div', { class: 'coleccion' }, tarjetas)));
}

function mostrarProgreso() {
  const archivo = h('input', { type: 'file', accept: 'application/json,.json', class: 'oculto', onchange: async (e) => {
    try { await P.importar(e.target.files[0]); brindis(t('importado')); aplicarAjustes(); } catch (err) { brindis(t('importar_mal')); }
  } });
  vista.replaceChildren(h('section', { class: 'pagina' }, h('a', { class: 'boton chico', href: '#/' }, '← ' + t('mapa')),
    h('h1', {}, t('progreso')), h('p', {}, t('progreso_texto')),
    h('div', { class: 'fila' },
      h('button', { type: 'button', class: 'boton principal', onclick: () => P.exportar() }, '⬇ ' + t('exportar')),
      h('button', { type: 'button', class: 'boton', onclick: () => archivo.click() }, '⬆ ' + t('importar')), archivo),
    h('div', { class: 'fila' }, h('button', { type: 'button', class: 'boton chico', onclick: () => {
      confirmar(t('borrar_confirmar'), () => { P.borrar(); location.hash = '#/'; });
    } }, t('borrar_progreso')))));
}

// ── Modo libre y glosario ───────────────────────────────────────────────────────────────────────────────────
function mostrarLibre() {
  Py.preparar().catch(() => {});
  const inicial = P.ajustes().libre ?? t('libre_inicial');
  let reloj;
  const zona = armarZona({ codigo: inicial, soloEjecutar: true, textoEjecutar: t('ejecutar'),
    estado: { codigo: { [idiomaActual()]: inicial } },
    alGuardar: ({ codigo }) => { clearTimeout(reloj); reloj = setTimeout(() => P.ajustar('libre', codigo), 400); } });
  vista.replaceChildren(h('section', { class: 'capitulo' },
    h('div', { class: 'cabeza-cap' }, h('a', { class: 'boton chico', href: '#/' }, '← ' + t('mapa')), h('h1', {}, t('libre'))),
    h('div', { class: 'mesa' }, h('div', { class: 'tarjeta', html: md(t('libre_texto')) }), zona.el)));
}

let glosario = null;
async function mostrarGlosario() {
  glosario ||= await cargarJSON('data/glosario.json');
  const lista = h('div', { class: 'glosario' });
  const pintar = (q = '') => {
    const n = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    lista.replaceChildren(...glosario.terminos
      .filter(x => !q || n(L(x.termino) + ' ' + L(x.definicion)).includes(n(q)))
      .sort((a, b) => n(L(a.termino)).localeCompare(n(L(b.termino))))
      .map(x => h('article', { class: 'termino' }, h('h3', {}, L(x.termino)), h('div', { html: md(L(x.definicion)) }),
        x.ejemplo ? h('pre', {}, h('code', {}, L(x.ejemplo))) : null,
        x.capitulo ? h('small', {}, `${t('capitulo')} ${x.capitulo}`) : null)));
  };
  const buscar = h('input', { type: 'search', class: 'buscar', placeholder: t('glosario_buscar'), 'aria-label': t('glosario_buscar'),
    oninput: (e) => pintar(e.target.value) });
  pintar();
  vista.replaceChildren(h('section', { class: 'pagina' }, h('a', { class: 'boton chico', href: '#/' }, '← ' + t('mapa')),
    h('h1', {}, t('glosario')), buscar, lista));
}

// ── Rutas ───────────────────────────────────────────────────────────────────────────────────────────────────────
function mostrar() {
  limpiar(); limpiar = () => {};
  document.querySelectorAll('.velo').forEach(v => v.remove());
  const [, ruta, id, paso] = (location.hash || '#/').split('/');
  if (ruta === 'cap') mostrarCapitulo(id, Number(paso) || 0);
  else if (ruta === 'pergaminos') mostrarPergaminos();
  else if (ruta === 'progreso') mostrarProgreso();
  else if (ruta === 'libre') mostrarLibre();
  else if (ruta === 'glosario') mostrarGlosario();
  else mostrarMapa();
  window.scrollTo(0, 0);
}

async function iniciar() {
  P.cargar();
  aplicarAjustes();
  const idioma = P.ajustes().idioma || (/^es\b/i.test(navigator.language || 'es') ? 'es' : 'en');
  await cargarIdioma(idioma);
  [indice, versiculos] = await Promise.all([cargarJSON('lessons/indice.json'), cargarJSON('data/versiculos.json')]);
  textosBarra(); botonesBarra();
  addEventListener('hashchange', mostrar);
  mostrar();
}
iniciar();
