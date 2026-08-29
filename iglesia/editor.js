/* Verbo · Iglesia — editor de publicaciones del publicador. Un archivo
   nuevo, no listado en el árbol original del bloque 1 (que solo preveía
   panel.js/feed.js) — lo separo de publicador.html porque el editor
   (picker de fondos + texto arrastrable/escalable/rotable) es
   suficiente lógica propia como para no vivir en el <script> inline de
   esa página.

   Editor de texto libre sobre el fondo elegido (corrección de Juan al
   bloque 3): el texto se arrastra, escala y rota con Pointer Events
   nativos — mismo patrón que biblia/assets/atlas/map.js (pan de 1 dedo,
   pinch de 2, sin ninguna librería de gestos). textZone/textContrast/
   brightness del manifest solo sugieren el punto de partida (ver
   panel.js:sugerenciaInicial) — nunca bloquean ni fuerzan nada.
   Nunca se hornea a imagen: se guarda como dato puro
   (fondoId/texto/fontFamily/fontSize/color/x/y/scale/rotation) y se
   reconstruye en cada render, tanto acá como en feed.js. */
window.VerboIglesiaEditor = (() => {
  const P = window.VerboIglesiaPanel;

  function t(key, vars) { return window.VerboI18n?.t(key, vars) || key; }
  function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  const DEFAULT_STATE = () => ({
    tipo: 'texto', // 'texto' | 'fondo-svg' | 'embed'
    texto: '',
    fondo: null, // item del manifest, no solo el id — evita un fetch extra al publicar
    fontFamily: 'system',
    fontSize: 64, // unidades relativas al canvas lógico de 1080 (ver fondos/manifest.json)
    color: '#FFF8EA',
    x: 50, y: 84, scale: 1, rotation: 0,
    embedUrl: '',
  });

  let root = null;
  let onPublished = null;
  let state = DEFAULT_STATE();
  let pickerCategory = null;
  let pickerSearchQuery = '';
  let pickerVisibleCount = 60;
  let searchDebounce = null;

  function isValidToPublish() {
    if (state.tipo === 'texto') return Boolean(state.texto.trim());
    if (state.tipo === 'embed') return P.embedUrlValida(state.embedUrl);
    if (state.tipo === 'fondo-svg') return Boolean(state.fondo) && Boolean(state.texto.trim());
    return false;
  }

  function buildPostPayload() {
    if (state.tipo === 'texto') return { tipo: 'texto', texto: state.texto.trim() };
    if (state.tipo === 'embed') return { tipo: 'embed', embedUrl: state.embedUrl.trim(), texto: state.texto.trim() || null };
    return {
      tipo: 'fondo-svg',
      fondoId: state.fondo.id,
      texto: state.texto,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      color: state.color,
      x: state.x, y: state.y, scale: state.scale, rotation: state.rotation,
    };
  }

  function updatePublishState() {
    const btn = root?.querySelector('#iglesiaEditorPublishBtn');
    if (btn) btn.disabled = !isValidToPublish();
  }

  // ---- Lienzo: transform en vivo (sin re-render completo) ------------
  function applyTextTransform(textEl) {
    const fontStack = window.IGLESIA_FONT_STACK_BY_ID?.[state.fontFamily] || window.IGLESIA_FONT_STACK_BY_ID?.system;
    const fontSizeCqw = (state.fontSize / 1080 * 100).toFixed(2);
    textEl.style.left = state.x + '%';
    textEl.style.top = state.y + '%';
    textEl.style.transform = `translate(-50%,-50%) rotate(${state.rotation}deg) scale(${state.scale})`;
    textEl.style.fontFamily = fontStack;
    textEl.style.fontSize = fontSizeCqw + 'cqw';
    textEl.style.color = state.color;
  }

  // Un solo dedo/mouse sobre el texto = mover. Dos dedos sobre el texto
  // = pinch (distancia -> escala, ángulo -> rotación). El handle en la
  // esquina ofrece el equivalente de escala+rotación con mouse (sin
  // gesto de dos dedos posible). Mismo Map de pointers activos que usa
  // Atlas — ver comentario de archivo.
  function attachGestures(canvasEl, textEl, handleEl) {
    const activePointers = new Map();
    let mode = null; // 'move' | 'pinch' | 'handle'
    let startState = null;

    function rect() { return canvasEl.getBoundingClientRect(); }
    function toPct(clientX, clientY) {
      const r = rect();
      return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
    }
    function centerClient() {
      const r = rect();
      return { x: r.left + (state.x / 100) * r.width, y: r.top + (state.y / 100) * r.height };
    }

    function beginMove(clientX, clientY) {
      mode = 'move';
      startState = { pointer: toPct(clientX, clientY), x: state.x, y: state.y };
    }
    function updateMove(clientX, clientY) {
      const cur = toPct(clientX, clientY);
      state.x = clamp(startState.x + (cur.x - startState.pointer.x), -20, 120);
      state.y = clamp(startState.y + (cur.y - startState.pointer.y), -20, 120);
      applyTextTransform(textEl);
    }

    function beginPinch() {
      mode = 'pinch';
      const [a, b] = Array.from(activePointers.values()).slice(0, 2);
      startState = {
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        scale: state.scale, rotation: state.rotation,
      };
    }
    function updatePinch() {
      const [a, b] = Array.from(activePointers.values()).slice(0, 2);
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      state.scale = clamp(startState.scale * (distance / startState.distance), 0.3, 4);
      state.rotation = clamp(startState.rotation + (angle - startState.angle) * 180 / Math.PI, -180, 180);
      applyTextTransform(textEl);
    }

    function beginHandle(clientX, clientY) {
      mode = 'handle';
      const c = centerClient();
      startState = {
        distance: Math.hypot(clientX - c.x, clientY - c.y),
        angle: Math.atan2(clientY - c.y, clientX - c.x),
        scale: state.scale, rotation: state.rotation, center: c,
      };
    }
    function updateHandle(clientX, clientY) {
      const c = startState.center;
      const distance = Math.hypot(clientX - c.x, clientY - c.y);
      const angle = Math.atan2(clientY - c.y, clientX - c.x);
      state.scale = clamp(startState.scale * (distance / startState.distance), 0.3, 4);
      state.rotation = clamp(startState.rotation + (angle - startState.angle) * 180 / Math.PI, -180, 180);
      applyTextTransform(textEl);
    }

    textEl.addEventListener('pointerdown', (e) => {
      if (e.target === handleEl) return;
      textEl.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size >= 2) beginPinch();
      else beginMove(e.clientX, e.clientY);
    });
    textEl.addEventListener('pointermove', (e) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size >= 2) updatePinch();
      else if (mode === 'move') updateMove(e.clientX, e.clientY);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => {
      textEl.addEventListener(name, (e) => {
        activePointers.delete(e.pointerId);
        if (activePointers.size === 0) { mode = null; startState = null; }
        else if (activePointers.size === 1 && mode === 'pinch') {
          const [only] = Array.from(activePointers.values());
          beginMove(only.x, only.y);
        }
      });
    });

    handleEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      handleEl.setPointerCapture(e.pointerId);
      beginHandle(e.clientX, e.clientY);
    });
    handleEl.addEventListener('pointermove', (e) => {
      if (mode !== 'handle') return;
      updateHandle(e.clientX, e.clientY);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => {
      handleEl.addEventListener(name, () => { if (mode === 'handle') { mode = null; startState = null; } });
    });
  }

  // ---- Picker de fondos: categorías -> miniaturas, o búsqueda global -
  function renderThumbGrid(items) {
    return `<div class="iglesia-picker-grid">${items.map(it => `
      <button class="iglesia-picker-thumb" type="button" data-fondo-id="${escapeHTML(it.id)}" aria-label="${escapeHTML(it.id)}">
        <img src="${escapeHTML(P.fondoSrc(it))}" alt="" loading="lazy">
      </button>`).join('')}</div>`;
  }

  function wireThumbClicks(scope) {
    scope.querySelectorAll('[data-fondo-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const fondo = await P.getFondoById(btn.dataset.fondoId);
        if (!fondo) return;
        selectFondo(fondo);
      });
    });
  }

  async function refreshPickerBody() {
    const body = root.querySelector('#iglesiaPickerBody');
    if (!body) return;

    if (pickerSearchQuery.trim()) {
      const manifest = await P.fondosManifest();
      const q = pickerSearchQuery.trim().toLowerCase();
      const matches = manifest.items.filter(it =>
        it.id.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        (it.primaryMotif || '').toLowerCase().includes(q) ||
        (it.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
      const visible = matches.slice(0, pickerVisibleCount);
      body.innerHTML = renderThumbGrid(visible) +
        (matches.length > visible.length ? `<button class="iglesia-btn iglesia-btn--ghost iglesia-picker-more" type="button" id="iglesiaPickerMore">${escapeHTML(t('iglesia.picker.loadMore'))}</button>` : '');
      wireThumbClicks(body);
      body.querySelector('#iglesiaPickerMore')?.addEventListener('click', () => { pickerVisibleCount += 60; refreshPickerBody(); });
      return;
    }

    if (pickerCategory) {
      const [categories, manifest] = await Promise.all([P.fondosCategories(), P.fondosManifest()]);
      const ids = categories[pickerCategory] || [];
      const items = ids.map(id => manifest.items.find(it => it.id === id)).filter(Boolean);
      body.innerHTML = `
        <div class="iglesia-picker-crumb"><button type="button" id="iglesiaPickerBack"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:3px"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>${escapeHTML(t('iglesia.picker.categorias'))}</button></div>
        ${renderThumbGrid(items)}`;
      wireThumbClicks(body);
      body.querySelector('#iglesiaPickerBack')?.addEventListener('click', () => { pickerCategory = null; refreshPickerBody(); });
      return;
    }

    const categories = await P.fondosCategories();
    body.innerHTML = `<div class="iglesia-picker-categories">${Object.keys(categories).map(cat => `
      <button class="iglesia-picker-category-card" type="button" data-category="${escapeHTML(cat)}">
        ${escapeHTML(t('iglesia.categorias.' + cat))}
      </button>`).join('')}</div>`;
    body.querySelectorAll('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => { pickerCategory = btn.dataset.category; refreshPickerBody(); });
    });
  }

  function selectFondo(fondo) {
    const sug = P.sugerenciaInicial(fondo);
    state.fondo = fondo;
    state.x = sug.x; state.y = sug.y; state.color = sug.color;
    state.scale = 1; state.rotation = 0;
    render();
  }

  // ---- Render por tipo -------------------------------------------------
  function renderCanvas() {
    return `
      <div class="iglesia-editor-canvas" id="iglesiaEditorCanvas">
        <img class="iglesia-editor-canvas__bg" src="${escapeHTML(P.fondoSrc(state.fondo))}" alt="">
        <div class="iglesia-editor-text" id="iglesiaEditorText">
          <span id="iglesiaEditorTextEcho" style="${state.texto ? '' : 'opacity:.45'}">${escapeHTML(state.texto || t('iglesia.editor.textPlaceholder'))}</span>
          <div class="iglesia-editor-handle iglesia-editor-handle--transform" id="iglesiaEditorHandle"></div>
        </div>
      </div>
      <button class="iglesia-btn iglesia-btn--ghost" type="button" id="iglesiaEditorChangeFondo">${escapeHTML(t('iglesia.editor.changeFondo'))}</button>
      <div class="iglesia-editor-controls">
        <div>
          <label>${escapeHTML(t('iglesia.editor.font'))}</label>
          <select id="iglesiaEditorFont">${(window.IGLESIA_FONTS || []).map(f => `<option value="${f.id}" ${f.id === state.fontFamily ? 'selected' : ''}>${escapeHTML(t(f.labelKey))}</option>`).join('')}</select>
        </div>
        <div>
          <label>${escapeHTML(t('iglesia.editor.color'))}</label>
          <input type="color" id="iglesiaEditorColor" value="${escapeHTML(state.color)}">
        </div>
        <div class="iglesia-editor-controls__full">
          <label>${escapeHTML(t('iglesia.editor.size'))}</label>
          <input type="range" id="iglesiaEditorSize" min="16" max="200" value="${state.fontSize}">
        </div>
        <div class="iglesia-editor-controls__full">
          <label>${escapeHTML(t('iglesia.editor.text'))}</label>
          <textarea class="iglesia-editor-textarea" id="iglesiaEditorTexto" rows="2" placeholder="${escapeHTML(t('iglesia.editor.textPlaceholder'))}">${escapeHTML(state.texto)}</textarea>
        </div>
      </div>`;
  }

  function wireCanvas(bodyEl) {
    const canvas = bodyEl.querySelector('#iglesiaEditorCanvas');
    const textEl = bodyEl.querySelector('#iglesiaEditorText');
    const handleEl = bodyEl.querySelector('#iglesiaEditorHandle');
    const echoEl = bodyEl.querySelector('#iglesiaEditorTextEcho');
    if (!canvas || !textEl || !handleEl) return;

    applyTextTransform(textEl);
    attachGestures(canvas, textEl, handleEl);

    bodyEl.querySelector('#iglesiaEditorChangeFondo')?.addEventListener('click', () => { state.fondo = null; render(); });
    bodyEl.querySelector('#iglesiaEditorFont')?.addEventListener('change', (e) => { state.fontFamily = e.target.value; applyTextTransform(textEl); });
    bodyEl.querySelector('#iglesiaEditorColor')?.addEventListener('input', (e) => { state.color = e.target.value; applyTextTransform(textEl); });
    bodyEl.querySelector('#iglesiaEditorSize')?.addEventListener('input', (e) => { state.fontSize = Number(e.target.value); applyTextTransform(textEl); });
    bodyEl.querySelector('#iglesiaEditorTexto')?.addEventListener('input', (e) => {
      state.texto = e.target.value;
      echoEl.textContent = state.texto || t('iglesia.editor.textPlaceholder');
      echoEl.style.opacity = state.texto ? '1' : '.45';
      updatePublishState();
    });
  }

  function renderFondoTipo(bodyEl) {
    if (state.fondo) {
      bodyEl.innerHTML = renderCanvas();
      wireCanvas(bodyEl);
      return;
    }
    bodyEl.innerHTML = `
      <input class="iglesia-input iglesia-picker-search" type="search" id="iglesiaPickerSearch"
        placeholder="${escapeHTML(t('iglesia.picker.searchPlaceholder'))}" value="${escapeHTML(pickerSearchQuery)}">
      <div id="iglesiaPickerBody"></div>`;
    bodyEl.querySelector('#iglesiaPickerSearch')?.addEventListener('input', (e) => {
      pickerSearchQuery = e.target.value;
      pickerVisibleCount = 60;
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(refreshPickerBody, 200);
    });
    refreshPickerBody();
  }

  function renderEmbedTipo(bodyEl) {
    bodyEl.innerHTML = `
      <input class="iglesia-input" type="url" id="iglesiaEditorEmbedUrl" placeholder="${escapeHTML(t('iglesia.editor.embedUrlPlaceholder'))}" value="${escapeHTML(state.embedUrl)}">
      <div id="iglesiaEditorEmbedPreview"></div>
      <textarea class="iglesia-editor-textarea" id="iglesiaEditorEmbedTexto" placeholder="${escapeHTML(t('iglesia.editor.captionPlaceholder'))}">${escapeHTML(state.texto)}</textarea>`;
    const refreshPreview = () => {
      const src = P.embedSrc(state.embedUrl);
      bodyEl.querySelector('#iglesiaEditorEmbedPreview').innerHTML = src
        ? `<div class="iglesia-editor-embed-preview"><iframe src="${escapeHTML(src)}" loading="lazy" allowfullscreen></iframe></div>`
        : '';
    };
    refreshPreview();
    bodyEl.querySelector('#iglesiaEditorEmbedUrl').addEventListener('input', (e) => {
      state.embedUrl = e.target.value;
      refreshPreview();
      updatePublishState();
    });
    bodyEl.querySelector('#iglesiaEditorEmbedTexto').addEventListener('input', (e) => { state.texto = e.target.value; });
  }

  function renderTextoTipo(bodyEl) {
    bodyEl.innerHTML = `<textarea class="iglesia-editor-textarea" id="iglesiaEditorTextoLibre" placeholder="${escapeHTML(t('iglesia.editor.textPlaceholder'))}">${escapeHTML(state.texto)}</textarea>`;
    bodyEl.querySelector('#iglesiaEditorTextoLibre').addEventListener('input', (e) => { state.texto = e.target.value; updatePublishState(); });
  }

  async function onPublishClick() {
    if (!isValidToPublish()) return;
    const btn = root.querySelector('#iglesiaEditorPublishBtn');
    const errorEl = root.querySelector('#iglesiaEditorError');
    btn.disabled = true;
    errorEl.hidden = true;
    try {
      const result = await P.publishPost(buildPostPayload());
      state = DEFAULT_STATE();
      pickerCategory = null;
      pickerSearchQuery = '';
      render();
      onPublished?.(result.feed || []);
    } catch (error) {
      console.warn('[iglesia] no se pudo publicar', error);
      errorEl.hidden = false;
      btn.disabled = false;
    }
  }

  function render() {
    root.innerHTML = `
      <div class="iglesia-editor-tipos">
        <button class="iglesia-editor-tipo-btn ${state.tipo === 'texto' ? 'is-active' : ''}" type="button" data-tipo="texto">${escapeHTML(t('iglesia.editor.tipoTexto'))}</button>
        <button class="iglesia-editor-tipo-btn ${state.tipo === 'fondo-svg' ? 'is-active' : ''}" type="button" data-tipo="fondo-svg">${escapeHTML(t('iglesia.editor.tipoFondo'))}</button>
        <button class="iglesia-editor-tipo-btn ${state.tipo === 'embed' ? 'is-active' : ''}" type="button" data-tipo="embed">${escapeHTML(t('iglesia.editor.tipoEmbed'))}</button>
      </div>
      <div id="iglesiaEditorBody"></div>
      <button class="iglesia-btn" type="button" id="iglesiaEditorPublishBtn" ${isValidToPublish() ? '' : 'disabled'}>${escapeHTML(t('iglesia.editor.publishBtn'))}</button>
      <p class="iglesia-error" id="iglesiaEditorError" hidden>${escapeHTML(t('iglesia.editor.error'))}</p>`;

    root.querySelectorAll('[data-tipo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tipo = btn.dataset.tipo;
        render();
      });
    });

    const bodyEl = root.querySelector('#iglesiaEditorBody');
    if (state.tipo === 'texto') renderTextoTipo(bodyEl);
    else if (state.tipo === 'embed') renderEmbedTipo(bodyEl);
    else renderFondoTipo(bodyEl);

    root.querySelector('#iglesiaEditorPublishBtn').addEventListener('click', onPublishClick);
  }

  function mount(rootEl, opts = {}) {
    root = rootEl;
    onPublished = opts.onPublished || null;
    state = DEFAULT_STATE();
    pickerCategory = null;
    pickerSearchQuery = '';
    render();
  }

  return { mount };
})();
