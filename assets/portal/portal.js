/* Portal de juegos: insignia «Nuevo» por fecha, filtros por categoría y buscador por nombre.
   Todo el texto ya viene en el HTML; este script solo filtra y actualiza insignias. */
(function(){
  'use strict';
  const DIAS_NUEVO = 21;
  const en = () => window.VerboI18n?.getUiLang?.() === 'en';

  // «Nuevo» durante 21 días desde la fecha de publicación (el HTML trae la del día de compilación).
  function insignias(){
    const hoy = Date.now();
    document.querySelectorAll('[data-publicado]').forEach(card => {
      const t = Date.parse(card.dataset.publicado + 'T12:00:00');
      const nuevo = !isNaN(t) && (hoy - t) / 864e5 < DIAS_NUEVO;
      const marca = card.querySelector('.v-insignia--nuevo');
      if (marca) marca.hidden = !nuevo;
    });
  }

  function filtros(){
    const caja = document.querySelector('[data-portal-filtros]');
    if (!caja) return;
    const botones = [...caja.querySelectorAll('[data-filtro]')];
    const entrada = caja.querySelector('input[type="search"]');
    const tarjetas = [...document.querySelectorAll('[data-portal-rejilla] > li')];
    const vacio = document.querySelector('[data-portal-vacio]');
    let cat = '';
    const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    function aplicar(){
      const q = norm(entrada && entrada.value);
      let visibles = 0;
      tarjetas.forEach(li => {
        const ok = (!cat || li.dataset.cat === cat) && (!q || norm(li.dataset.buscar).includes(q));
        li.hidden = !ok; if (ok) visibles++;
      });
      if (vacio) vacio.hidden = visibles > 0;
    }
    botones.forEach(b => b.addEventListener('click', () => {
      cat = b.dataset.filtro === cat ? '' : b.dataset.filtro;
      botones.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filtro === cat || (!cat && !x.dataset.filtro))));
      aplicar();
    }));
    if (entrada) {
      entrada.addEventListener('input', aplicar);
      entrada.form?.addEventListener('submit', e => e.preventDefault());
    }
    aplicar();
  }

  // Punto de conexión para «Más jugados» con estadísticas reales (pendiente): hoy el orden viene del
  // catálogo (orden_mas_jugados). Cuando exista un endpoint, devolver aquí una lista de ids ordenada.
  window.VerboPortal = { masJugados: null, en };

  const iniciar = () => { insignias(); filtros(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
