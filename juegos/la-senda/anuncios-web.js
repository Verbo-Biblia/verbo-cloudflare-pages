/* La Senda en la web: pausas de anuncio al terminar una ronda, sin tocar el código compartido con la app Android.
   Se engancha a los botones de la pantalla de resultados («Jugar otra vez» y «Volver al inicio»). Mientras
   /juegos/comun/anuncios.js esté apagado, todo sigue igual que antes. */
(() => {
  'use strict';
  if (!window.VerboAds) return;
  VerboAds.init({ juego: 'la-senda' });
  const envolver = (id, nombre, tipo) => {
    const b = document.getElementById(id);
    if (!b || typeof b.onclick !== 'function') return;
    const original = b.onclick;
    b.onclick = ev => { VerboAds.pausa(nombre, tipo).then(() => original.call(b, ev)); };
  };
  envolver('again', 'senda-otra-ronda', 'next');
  envolver('toHome', 'senda-volver-inicio', 'browse');
})();
