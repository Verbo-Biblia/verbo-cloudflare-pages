/* Verbo · Iglesia — lógica compartida entre publicador.html e index.html
   (rol miembro): sesión local del publicador, llamadas al Worker, y
   utilidades de render reusadas por feed.js.

   Contrato con el Worker (cloudflare/api-bible-worker/worker.js) — ver
   bloque 2 de esta implementación. Autenticación del publicador vía
   handlers propios, TOTALMENTE separados de /v1/sync/* (que siguen
   intactos): mismo mecanismo de magic link, pero con sus propios
   prefijos de clave en SYNC_KV (iglesia-link:/iglesia-session:, no
   link:/session:) — así el KV es inequívoco a simple vista sobre qué
   es de usuario y qué es de iglesia, y el flujo de iglesia puede
   divergir a futuro (TTL, validación) sin tocar el código de usuario.
     POST /v1/iglesia/link-request   { email, deviceId, lang }
     POST /v1/iglesia/link-confirm   { token } -> { sessionToken, emailMasked }
     POST /v1/iglesia/unlink          (Bearer sessionToken)
     GET  /v1/iglesia/mine            (Bearer sessionToken)  -> { feed, invite }
     POST /v1/iglesia/post            (Bearer sessionToken) { tipo, texto?, fondoId?, embedUrl? } -> { feed }
     POST /v1/iglesia/post-delete     (Bearer sessionToken) { id } -> { feed }
     POST /v1/iglesia/invite          (Bearer sessionToken) -> { code }
     GET  /v1/iglesia/feed?code=<código>   (público, sin sesión) -> { posts } | 404

   Deliberadamente NO reutiliza VerboSync (biblia/assets/sync.js): esa
   sesión está atada a VerboBackup (datos bíblicos personales). El
   publicador es una identidad distinta, con su propia clave de
   localStorage y su propia tabla de sesión en KV. */
// Whitelist de fuentes del sistema — 10 ids, sin cargar ningún archivo de
// fuente nuevo (ni Google Fonts ni local). Cada id mapea a un stack CSS
// con fallback nativo por plataforma; el post solo guarda el id. DEBE
// mantenerse sincronizada a mano con IGLESIA_FONT_IDS en
// cloudflare/api-bible-worker/worker.js — mismos 10 ids exactos.
window.IGLESIA_FONTS = [
  { id: 'system',     labelKey: 'iglesia.fonts.system',    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { id: 'arial',      labelKey: 'iglesia.fonts.arial',     stack: 'Arial, Helvetica, sans-serif' },
  { id: 'helvetica',  labelKey: 'iglesia.fonts.helvetica', stack: 'Helvetica, Arial, sans-serif' },
  { id: 'georgia',    labelKey: 'iglesia.fonts.georgia',   stack: 'Georgia, "Times New Roman", serif' },
  { id: 'times',      labelKey: 'iglesia.fonts.times',     stack: '"Times New Roman", Times, serif' },
  { id: 'verdana',    labelKey: 'iglesia.fonts.verdana',   stack: 'Verdana, Geneva, sans-serif' },
  { id: 'trebuchet',  labelKey: 'iglesia.fonts.trebuchet', stack: '"Trebuchet MS", Verdana, sans-serif' },
  { id: 'courier',    labelKey: 'iglesia.fonts.courier',   stack: '"Courier New", Courier, monospace' },
  { id: 'palatino',   labelKey: 'iglesia.fonts.palatino',  stack: 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif' },
  { id: 'comic-sans', labelKey: 'iglesia.fonts.comicSans', stack: '"Comic Sans MS", "Comic Sans", cursive' },
];
window.IGLESIA_FONT_STACK_BY_ID = Object.fromEntries(window.IGLESIA_FONTS.map(f => [f.id, f.stack]));

window.VerboIglesiaPanel = (() => {
  const SESSION_KEY = 'verbo:iglesia:publicadorSession';
  const EMAIL_MASKED_KEY = 'verbo:iglesia:publicadorEmailMasked';
  const DEVICE_KEY = 'verbo:iglesia:deviceId'; // separado del deviceId de VerboSync a propósito: identidades distintas.
  const MEMBER_CODE_KEY = 'verbo:iglesia:memberCode';

  const REGISTRY_URL = (() => {
    const src = (document.currentScript && document.currentScript.src) || '';
    const scriptDir = src ? src.split('?')[0].replace(/[^/]+$/, '') : './';
    return scriptDir + '../biblia/modules/registry.json';
  })();

  let baseUrlPromise = null;
  async function baseUrl() {
    if (!baseUrlPromise) {
      baseUrlPromise = fetch(REGISTRY_URL).then(r => r.json())
        .then(registry => String(registry.apiBible?.proxyUrl || '').trim().replace(/\/+$/, ''));
    }
    return baseUrlPromise;
  }

  async function requestJSON(path, options = {}) {
    const base = await baseUrl();
    if (!base) throw new Error('iglesia-no-base-url');
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `iglesia-http-${response.status}`);
    return body;
  }

  function deviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function currentLang() {
    return window.VerboI18n?.getUiLang?.() === 'en' ? 'en' : 'es';
  }

  // ---- Sesión de publicador (localStorage) --------------------------
  function getSession() { return localStorage.getItem(SESSION_KEY) || ''; }
  function getEmailMasked() { return localStorage.getItem(EMAIL_MASKED_KEY) || ''; }
  function isLinked() { return Boolean(getSession()); }
  function setLinked(sessionToken, emailMasked) {
    localStorage.setItem(SESSION_KEY, sessionToken);
    localStorage.setItem(EMAIL_MASKED_KEY, emailMasked || '');
  }
  function clearLinked() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(EMAIL_MASKED_KEY);
  }

  async function requestLink(email) {
    await requestJSON('/v1/iglesia/link-request', {
      method: 'POST',
      body: JSON.stringify({ email, deviceId: deviceId(), lang: currentLang() })
    });
  }

  async function confirmLinkFromToken(token) {
    const result = await requestJSON('/v1/iglesia/link-confirm', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    setLinked(result.sessionToken, result.emailMasked);
    return result;
  }

  async function unlink() {
    const token = getSession();
    clearLinked();
    if (token) {
      try { await requestJSON('/v1/iglesia/unlink', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }
      catch {}
    }
  }
  // (Ambos endpoints son handlers propios de /v1/iglesia/*, no los
  // genéricos /v1/sync/* — ver nota de arriba: prefijos de KV separados.)

  async function consumeTokenFromUrl() {
    const url = new URL(location.href);
    const token = url.searchParams.get('syncToken');
    if (!token) return false;
    url.searchParams.delete('syncToken');
    history.replaceState(null, '', url.toString());
    await confirmLinkFromToken(token);
    return true;
  }

  // ---- Datos del publicador (feed propio + invitación) --------------
  async function fetchMine() {
    const token = getSession();
    if (!token) throw new Error('iglesia-not-linked');
    return requestJSON('/v1/iglesia/mine', { headers: { Authorization: `Bearer ${token}` } });
  }

  async function publishPost(post) {
    const token = getSession();
    if (!token) throw new Error('iglesia-not-linked');
    return requestJSON('/v1/iglesia/post', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(post)
    });
  }

  async function deletePost(id) {
    const token = getSession();
    if (!token) throw new Error('iglesia-not-linked');
    // POST, no DELETE: corsHeaders() del Worker no lista DELETE entre los
    // métodos permitidos y ese es código existente compartido — más
    // simple no tocarlo que agregarle un método por esta función.
    return requestJSON('/v1/iglesia/post-delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id })
    });
  }

  async function getOrCreateInvite() {
    const token = getSession();
    if (!token) throw new Error('iglesia-not-linked');
    return requestJSON('/v1/iglesia/invite', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  }

  async function setPerfil(nombre) {
    const token = getSession();
    if (!token) throw new Error('iglesia-not-linked');
    return requestJSON('/v1/iglesia/perfil', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre })
    });
  }

  function inviteUrl(code) {
    return `${location.origin}/iglesia/?invite=${encodeURIComponent(code)}`;
  }

  // ---- Rol miembro (localStorage, sin sesión de servidor) ------------
  function getMemberCode() { return localStorage.getItem(MEMBER_CODE_KEY) || ''; }
  function setMemberCode(code) { localStorage.setItem(MEMBER_CODE_KEY, code); }
  function clearMemberCode() { localStorage.removeItem(MEMBER_CODE_KEY); }

  async function fetchPublicFeed(code) {
    return requestJSON(`/v1/iglesia/feed?code=${encodeURIComponent(code)}`);
  }

  // ---- Catálogo de fondos SVG (manifest.json, ver bloque 0) ----------
  // Un solo fetch perezoso del manifest (metadata liviana) — nunca se
  // cargan todos los SVG de una: cada fondo se resuelve a su ruta y se
  // pinta con <img src="...svg">
  // (safe: sin <script>/base64 verificado en el bloque 0) solo cuando
  // hace falta mostrarlo (picker con scroll/lazy en bloque 3, feed
  // renderizando solo las publicaciones visibles).
  const FONDOS_BASE = (() => {
    const src = (document.currentScript && document.currentScript.src) || '';
    const scriptDir = src ? src.split('?')[0].replace(/[^/]+$/, '') : './';
    return scriptDir + 'assets/fondos/';
  })();
  let fondosManifestPromise = null;
  let fondosById = null;
  async function fondosManifest() {
    if (!fondosManifestPromise) {
      fondosManifestPromise = fetch(FONDOS_BASE + 'manifest.json').then(r => r.json());
    }
    const manifest = await fondosManifestPromise;
    if (!fondosById) {
      fondosById = new Map(manifest.items.map(item => [item.id, item]));
    }
    return manifest;
  }
  async function fondosCategories() {
    const res = await fetch(FONDOS_BASE + 'categories.json');
    return res.json();
  }
  async function getFondoById(id) {
    await fondosManifest();
    return fondosById?.get(id) || null;
  }
  function fondoSrc(item) {
    return item ? FONDOS_BASE + item.file : '';
  }

  // textZone/textContrast del manifest -> punto de partida sugerido del
  // editor de texto libre (bloque 3, corrección de Juan: nunca fija ni
  // bloquea, solo evita arrancar con el texto en blanco o ilegible).
  // x/y en % del canvas 1080x1350 del manifest; el publicador los mueve
  // libremente después.
  const ZONE_XY = {
    'upper-left': [22, 16], 'upper-center': [50, 16], 'upper-right': [78, 16],
    'center': [50, 50],
    'lower-left': [22, 84], 'lower-center': [50, 84], 'lower-right': [78, 84],
  };
  function sugerenciaInicial(fondo) {
    return {
      x: ZONE_XY[fondo?.textZone]?.[0] ?? 50,
      y: ZONE_XY[fondo?.textZone]?.[1] ?? 84,
      color: fondo?.textContrast === 'dark' ? '#2A1D12' : '#FFF8EA',
    };
  }

  // Solo YouTube/Facebook, misma regla que valida el Worker
  // (IGLESIA_EMBED_RE) — usado tanto por el editor (validar antes de
  // publicar) como por feed.js (armar el <iframe> al mostrar). fb.watch
  // es el dominio de enlaces cortos de Facebook (lo que la gente copia
  // desde la app móvil) — Facebook resuelve el href del lado de ellos,
  // el plugin de iframe lo acepta igual que la URL larga.
  const EMBED_RE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|facebook\.com\/|fb\.watch\/)/;
  function embedSrc(embedUrl) {
    const url = String(embedUrl || '');
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{6,})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    if (/^https:\/\/(www\.)?(facebook\.com\/|fb\.watch\/)/.test(url)) {
      // No hace falta el SDK de Facebook (script externo) para esto: el
      // iframe de sus plugins públicos alcanza. video.php para links de
      // video (facebook.com/.../videos/... o fb.watch/...), post.php para
      // cualquier otro post público — mismo patrón, sin dependencia nueva.
      const esVideo = /facebook\.com\/[^/]+\/videos\//.test(url) || /fb\.watch\//.test(url);
      const plugin = esVideo ? 'video.php' : 'post.php';
      return `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(url)}&show_text=false`;
    }
    return '';
  }
  function embedUrlValida(embedUrl) {
    return EMBED_RE.test(String(embedUrl || ''));
  }

  return {
    // sesión publicador
    isLinked, getEmailMasked, requestLink, confirmLinkFromToken, unlink, consumeTokenFromUrl,
    // datos publicador
    fetchMine, publishPost, deletePost, getOrCreateInvite, inviteUrl, setPerfil,
    // rol miembro
    getMemberCode, setMemberCode, clearMemberCode, fetchPublicFeed,
    // catálogo de fondos
    fondosManifest, fondosCategories, getFondoById, fondoSrc, sugerenciaInicial,
    // embeds
    embedSrc, embedUrlValida,
  };
})();
