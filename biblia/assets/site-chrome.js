/* Wiring compartido del selector de idioma de interfaz (#uiLangSwitcher)
   para páginas fuera de /biblia/ (portal, misión, fundador, seminario,
   librería, recursos): activa VerboI18n + VerboSiteTranslate al cargar y
   cuando cambia el idioma. Cada página solo necesita incluir este script
   después de i18n.js (y site-translate.js si tiene contenido con
   data-i18n-live). */
(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', async () => {
    if(!window.VerboI18n) return;
    await VerboI18n.ready();
    const buttons = [...document.querySelectorAll('#uiLangSwitcher [data-lang]')];
    const markActive = () => {
      const current = VerboI18n.getUiLang();
      buttons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === current));
    };
    markActive();
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
