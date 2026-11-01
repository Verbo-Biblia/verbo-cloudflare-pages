/* Wiring compartido del selector de idioma de interfaz (#uiLangSwitcher)
   para páginas fuera de /biblia/ (portal, misión, fundador, seminario,
   librería, recursos): activa VerboI18n + VerboSiteTranslate al cargar y
   cuando cambia el idioma. Cada página solo necesita incluir este script
   después de i18n.js (y site-translate.js si tiene contenido con
   data-i18n-live). */
(function(){
  'use strict';
  // Selector ES/EN en TODAS las páginas: las que no lo traen en su HTML (Historias, Preguntas, libros de la
  // Librería, Privacidad…) lo reciben aquí, al final de su encabezado (o fijo arriba a la derecha si no hay
  // encabezado). Dentro de la app Android no se pone: ahí el idioma sale del teléfono.
  // Juan: «el botón es/en debe estar siempre visible». Cuando el selector del encabezado sale de la pantalla
  // (al bajar), aparece una copia fija arriba a la derecha; al volver arriba, se esconde.
  window.selectorSiempreVisible = function(){
    const original=document.getElementById('uiLangSwitcher');
    if(!original || document.getElementById('uiLangFlotante') || !('IntersectionObserver' in window)) return;
    if(/^\/juegos\/[^/]+\/jugar\//.test(location.pathname)) return;
    const css=document.createElement('style');
    css.textContent='#uiLangFlotante{position:fixed;top:10px;right:12px;z-index:9000;display:flex;gap:2px;padding:3px;border-radius:999px;background:#fffdf8;color:#1f2a37;box-shadow:0 2px 12px rgba(0,0,0,.2);font:600 13px/1 system-ui,sans-serif;transition:opacity .2s,transform .2s}'+
      '#uiLangFlotante[hidden]{display:flex;opacity:0;transform:translateY(-8px);pointer-events:none}'+
      '#uiLangFlotante button{all:unset;cursor:pointer;padding:7px 10px;border-radius:999px;opacity:.6}'+
      '#uiLangFlotante button.is-active{opacity:1;background:#1f2a37;color:#fffdf8}'+
      '#uiLangFlotante button:focus-visible{outline:2px solid #1f2a37;outline-offset:2px}'+
      '@media (prefers-color-scheme:dark){#uiLangFlotante{background:#1f2a37;color:#f4efe4}#uiLangFlotante button.is-active{background:#f4efe4;color:#1f2a37}}';
    document.head.appendChild(css);
    const f=document.createElement('div');
    f.id='uiLangFlotante';f.setAttribute('role','group');f.setAttribute('aria-label','Idioma / Language');f.hidden=true;
    f.innerHTML='<button type="button" data-lang="es" lang="es">ES</button><button type="button" data-lang="en" lang="en">EN</button>';
    document.body.appendChild(f);
    const marcar=()=>{ const l=window.VerboI18n?.getUiLang?.()||'es'; f.querySelectorAll('button').forEach(b=>b.classList.toggle('is-active',b.dataset.lang===l)); };
    f.addEventListener('click',ev=>{ const b=ev.target.closest('[data-lang]'); if(b&&window.VerboI18n) VerboI18n.setUiLang(b.dataset.lang); });
    document.addEventListener('verbo:uilang-changed',marcar); marcar();
    const visible=el=>{ const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return r.width>0 && s.display!=='none' && s.visibility!=='hidden'; };
    new IntersectionObserver(([e])=>{ f.hidden = e.isIntersecting && visible(original); }).observe(original);
  };
  window.ponerSelectorSiFalta = function(){
    if(document.getElementById('uiLangSwitcher')) return;
    if((window.name||'').split('|')[0]==='verboEmbedApp') return;
    if(/^\/(studio|biblia)\//.test(location.pathname)) return;
    if(/^\/juegos\/[^/]+\/jugar\//.test(location.pathname)) return;  // los juegos traen su propio idioma
    const css=document.createElement('style');
    css.textContent='.verbo-idioma{display:inline-flex;gap:2px;align-items:center;margin-left:auto;flex:none;font:600 13px/1 system-ui,sans-serif;color:inherit}'+
      '.verbo-idioma button{all:unset;cursor:pointer;padding:6px 9px;border-radius:999px;color:inherit;opacity:.65;border:1px solid transparent}'+
      '.verbo-idioma button:hover{opacity:1}.verbo-idioma button:focus-visible{outline:2px solid currentColor;outline-offset:2px}'+
      '.verbo-idioma button.is-active{opacity:1;border-color:currentColor}'+
      '.verbo-idioma--fijo{position:fixed;top:10px;right:12px;z-index:50;background:#fffdf8;color:#1f2a37;border-radius:999px;padding:2px;box-shadow:0 2px 10px rgba(0,0,0,.18)}';
    document.head.appendChild(css);
    const el=document.createElement('div');
    el.id='uiLangSwitcher';el.className='verbo-idioma';el.setAttribute('role','group');
    el.setAttribute('aria-label','Idioma / Language');
    el.innerHTML='<button type="button" data-lang="es" lang="es">ES</button><button type="button" data-lang="en" lang="en">EN</button>';
    const header=document.querySelector('body > header, header.site-header, header.q-header, header.static-page__header, body header');
    if(header) header.appendChild(el); else { el.classList.add('verbo-idioma--fijo'); document.body.appendChild(el); }
  };
})();

(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if(!window.VerboI18n) return;
    ponerSelectorSiFalta();
    await VerboI18n.ready();
    const buttons = [...document.querySelectorAll('#uiLangSwitcher [data-lang]')];
    const markActive = () => {
      const current = VerboI18n.getUiLang();
      buttons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === current));
    };
    markActive();
    if((window.name||'').split('|')[0]!=='verboEmbedApp') selectorSiempreVisible();
    const sourceLang = () => document.querySelector('article[data-source-lang]')?.dataset.sourceLang || 'es';
    if(window.VerboSiteTranslate) await VerboSiteTranslate.applyLiveTranslation(document, sourceLang());
    buttons.forEach(btn => btn.addEventListener('click', () => VerboI18n.setUiLang(btn.dataset.lang)));
    document.addEventListener('verbo:uilang-changed', async () => {
      markActive();
      if(window.VerboSiteTranslate) await VerboSiteTranslate.applyLiveTranslation(document, sourceLang());
    });
  });
})();

/* Enlaces externos cuando el sitio corre embebido en la app Android
   (sección Libros, dentro de un <iframe>). La app carga la primera página
   con "?verboEmbed=app" en la URL; aquí lo guardamos en window.name porque
   sobrevive a la navegación interna dentro del mismo iframe (a diferencia
   de la query string, que se pierde en cuanto el usuario hace clic a otra
   página). Con eso marcado, cualquier <a> a un dominio distinto de este
   mismo host se cancela y se le pide a la app (vía postMessage) que lo
   abra con el navegador del sistema en vez de navegar el iframe fuera del
   sitio. Los enlaces al mismo dominio no se tocan — deben seguir
   navegando el iframe con normalidad. No tiene ningún efecto fuera de la
   app: en una visita normal por navegador esto queda completamente
   inactivo. */
(function(){
  'use strict';
  if (window.top === window.self) return; // no estamos en un iframe, no aplica

  // window.name = "verboEmbedApp|<carpeta de la sección>": la sección es la
  // carpeta de la primera página que abrió la app (/libreria/,
  // /recursos/devocionales/...), ver ocultarSalidas() más abajo.
  try {
    const params = new URLSearchParams(location.search);
    if (params.get('verboEmbed') === 'app') {
      // La app puede indicar la sección (?verboSeccion=/libreria/) cuando
      // abre directo un libro desde su "Mi biblioteca"; si no, es la
      // carpeta de esta primera página.
      const indicada = params.get('verboSeccion') || '';
      const seccion = /^\/[a-z0-9/-]*\/$/.test(indicada) ? indicada : location.pathname.replace(/[^/]*$/, '');
      window.name = 'verboEmbedApp|' + seccion;
    }
  } catch (e) { /* URLSearchParams no disponible: ignorar */ }

  if (window.name.split('|')[0] !== 'verboEmbedApp') return;
  const seccion = window.name.split('|')[1] || '/';

  // Dentro de la app se ocultan el logo "Verbo" del encabezado (lleva a la
  // portada) y las flechas de volver y accesos rápidos que saldrían de la
  // sección que abrió la app. La flecha que vuelve del libro al índice de su sección se
  // queda, para no dejar a nadie sin salida. En la web normal no aplica.
  function ocultarSalidas() {
    // El pie público incluye salidas de la sección y no pertenece al lector Android.
    document.querySelectorAll('.verbo-pie, .section-bar, .portal-bar').forEach((el) => {
      el.hidden = true;
      el.style.display = 'none';
    });
    // Idioma: dentro de la app sale del teléfono (i18n.js), sin botón ES/EN.
    document.querySelectorAll('#uiLangSwitcher').forEach((el) => { el.style.display = 'none'; });
    document.querySelectorAll('.static-page__brand, .app-header__brand, .static-page__back, .app-header__portal-back, .quick-nav a, a[href*="mi-biblioteca"]').forEach((a) => {
      let destino;
      try {
        destino = new URL(a.getAttribute('href') || '', location.href);
      } catch (e) {
        return;
      }
      const esLogo = a.matches('.static-page__brand, .app-header__brand');
      // "Mi biblioteca" de la web tampoco: dentro de la app vive en la app.
      const esMiBiblioteca = destino.pathname.startsWith('/libreria/mi-biblioteca');
      if (esLogo || esMiBiblioteca || destino.hostname !== location.hostname || !destino.pathname.startsWith(seccion)) {
        a.style.display = 'none';
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ocultarSalidas);
  else ocultarSalidas();

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return;

    let target;
    try {
      target = new URL(href, location.href);
    } catch (e) {
      return; // href no parseable, dejar que el navegador decida
    }

    if (target.hostname === location.hostname) {
      // Mismo sitio: si abría en pestaña nueva, forzar que navegue el
      // propio iframe en vez de una pestaña nueva que el WebView no
      // puede mostrar.
      if (anchor.target && anchor.target !== '_self') {
        event.preventDefault();
        location.href = target.href;
      }
      return;
    }

    event.preventDefault();
    window.parent.postMessage({ type: 'verbo:open-external', url: target.href }, '*');
  }, true);
})();

/* Capa de profundidad (3D) para todas las páginas que cargan este script:
   recursos, librería, devocionales, sermones, artículos, lecciones y páginas
   institucionales. La portada, Historias y Preguntas ya traen depth.js con su
   propia configuración y se saltean. Fuera: la app bíblica, el
   studio y ajustes. Dentro de la app Android depth.js corre en modo liviano
   solo; con "reducir movimiento" no hace nada. Ver /assets/depth/depth.js. */
(function(){
  'use strict';
  if (document.querySelector('script[src*="/assets/depth/depth.js"]')) return;
  if (/^\/(biblia|studio|ajustes)\//.test(location.pathname)) return;
  const V = '20261015-3d3';
  const list = document.querySelector('.r-card, .r-article-row, .r-book-row, .r-sermon-row');
  const article = !list && document.querySelector('main article');
  const config = list ? {
    enter: '.r-discovery-heading, .r-section-label, .r-card, .r-article-row, .r-book-row',
    tilt: '.r-card, .sermon-cover, .book-cover',
    sky: '0.6'
  } : article ? {
    /* Para leer: sin animar el texto, solo luz tenue y línea de lectura. */
    enter: '.lesson-nav, .quick-nav',
    progress: '',
    sky: '0.3'
  } : {
    enter: 'main > section, .static-page__main > section',
    sky: '0.5'
  };
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = `/assets/depth/depth.css?v=${V}`;
  document.head.append(css);
  const js = document.createElement('script');
  js.src = `/assets/depth/depth.js?v=${V}`;
  Object.entries(config).forEach(([k, v]) => { js.dataset[k] = v; });
  if (document.body) document.body.append(js);
  else document.addEventListener('DOMContentLoaded', () => document.body.append(js));
})();
