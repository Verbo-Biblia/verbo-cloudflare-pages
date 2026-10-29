// /musica/: los reproductores de Spotify y YouTube se cargan solo cuando se toca ▶.
// Antes de eso la página no hace ninguna petición a esos servicios (las portadas son locales).
(() => {
  const en = () => window.VerboI18n?.getUiLang?.() === 'en';
  const fuente = (tipo, id) => {
    const i = encodeURIComponent(id);
    if (tipo === 'youtube') return `https://www.youtube-nocookie.com/embed/${i}?autoplay=1&rel=0`;
    if (tipo === 'spotify-lista') return `https://open.spotify.com/embed/playlist/${i}?utm_source=generator&theme=0`;
    return `https://open.spotify.com/embed/track/${i}?utm_source=generator&theme=0`;
  };
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-tipo][data-id]');
    if (!b) return;
    const caja = b.closest('[data-reproductor]');
    if (!caja) return;
    const tipo = b.dataset.tipo;
    const f = document.createElement('iframe');
    f.src = fuente(tipo, b.dataset.id);
    f.title = (en() ? 'Player: ' : 'Reproductor: ') + (b.dataset.titulo || '');
    f.loading = 'eager';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    caja.classList.add('m-activo', tipo === 'youtube' ? 'm-activo--video' : 'm-activo--spotify');
    if (tipo !== 'youtube') f.height = caja.dataset.alto || '80';
    caja.replaceChildren(f);
    f.focus?.();
  });
})();
