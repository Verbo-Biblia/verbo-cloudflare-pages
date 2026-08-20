/* Verbo · Iglesia — rol miembro: feed de solo lectura de una iglesia,
   vía el código de invitación guardado en localStorage (ver panel.js).
   Usado por iglesia/index.html cuando ya hay un código vinculado. */
window.VerboIglesiaFeed = (() => {
  const P = window.VerboIglesiaPanel;

  function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  async function renderPost(post) {
    const fecha = post.fecha ? new Date(post.fecha).toLocaleDateString(P && window.VerboI18n?.getUiLang?.() === 'en' ? 'en-US' : 'es') : '';

    if (post.tipo === 'embed') {
      const src = P.embedSrc(post.embedUrl);
      return `<article class="iglesia-feed-post" id="post-${escapeHTML(post.id)}">
        <div class="iglesia-feed-post__embed">${src ? `<iframe src="${escapeHTML(src)}" loading="lazy" allowfullscreen></iframe>` : ''}</div>
        <div class="iglesia-feed-post__body">
          <p class="iglesia-feed-post__meta">${escapeHTML(fecha)}</p>
          ${post.texto ? `<p class="iglesia-feed-post__text">${escapeHTML(post.texto)}</p>` : ''}
        </div>
      </article>`;
    }

    if (post.tipo === 'fondo-svg' && post.fondoId) {
      const fondo = await P.getFondoById(post.fondoId);
      const src = P.fondoSrc(fondo);
      // Reconstruido en el momento de mostrarlo a partir de datos puros
      // (x/y/scale/rotation/fontFamily/fontSize/color) — nunca una imagen
      // horneada, igual que el patrón del Atlas para sus etiquetas sobre
      // el mapa. El contenedor usa container-type:inline-size (iglesia.css)
      // para que fontSize (autorado contra el canvas lógico de 1080) se
      // vea proporcional sin importar el ancho real en pantalla.
      const fontStack = window.IGLESIA_FONT_STACK_BY_ID?.[post.fontFamily] || window.IGLESIA_FONT_STACK_BY_ID?.system || 'sans-serif';
      const fontSizeCqw = ((post.fontSize || 64) / 1080 * 100).toFixed(2);
      const style = [
        `left:${post.x ?? 50}%`, `top:${post.y ?? 84}%`,
        `font-family:${fontStack}`, `font-size:${fontSizeCqw}cqw`,
        `color:${post.color || '#FFF8EA'}`,
        `transform:translate(-50%,-50%) rotate(${post.rotation || 0}deg) scale(${post.scale || 1})`,
      ].join(';');
      return `<article class="iglesia-feed-post" id="post-${escapeHTML(post.id)}">
        <div class="iglesia-feed-post__bg">
          ${src ? `<img src="${escapeHTML(src)}" alt="" loading="lazy">` : ''}
          ${post.texto ? `<div class="iglesia-feed-post__overlay-text" style="${escapeHTML(style)}">${escapeHTML(post.texto)}</div>` : ''}
        </div>
        <div class="iglesia-feed-post__body">
          <p class="iglesia-feed-post__meta">${escapeHTML(fecha)}</p>
        </div>
      </article>`;
    }

    // tipo === 'texto'
    return `<article class="iglesia-feed-post" id="post-${escapeHTML(post.id)}">
      <div class="iglesia-feed-post__body">
        <p class="iglesia-feed-post__meta">${escapeHTML(fecha)}</p>
        <p class="iglesia-feed-post__text">${escapeHTML(post.texto || post.contenido || '')}</p>
      </div>
    </article>`;
  }

  // El Worker devuelve el array más reciente al final (ver bloque 2 —
  // mismo orden que la rotación FIFO al insertar). El feed se recorre
  // en reversa para mostrar lo más nuevo primero y poder abrir ahí.
  async function mount(container, posts) {
    if (!posts || !posts.length) {
      container.innerHTML = `<p class="iglesia-post-list__empty">${window.VerboI18n?.t('iglesia.feed.emptyMsg') || ''}</p>`;
      return;
    }
    const ordered = [...posts].reverse();
    const html = await Promise.all(ordered.map(renderPost));
    container.innerHTML = html.join('');
    const first = container.querySelector('.iglesia-feed-post');
    first?.scrollIntoView({ block: 'start' });
  }

  // renderPost expuesto para publicador.html: la vista propia del
  // publicador reusa esta misma función para su lista "Tus publicaciones"
  // — así el render (fondo+overlay con x/y/scale/rotation/fontFamily/
  // color reales) es idéntico al que ve el miembro, nunca una vista
  // aparte de solo texto con posición por defecto.
  return { mount, renderPost };
})();
