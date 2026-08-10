document.addEventListener('DOMContentLoaded', async () => {
  if (window.VerboI18n) await window.VerboI18n.ready();
  const t = (key, vars) => (window.VerboI18n ? window.VerboI18n.t(key, vars) : key);
  const els = {
    body: document.body,
    book: document.getElementById('bookSelect'),
    chapter: document.getElementById('chapterSelect'),
    prev: document.getElementById('prevChapter'),
    next: document.getElementById('nextChapter'),
    innerPrev: document.getElementById('innerPrev'),
    innerNext: document.getElementById('innerNext'),
    versionInput: document.getElementById('mainVersionInput'),
    versionDropdown: document.getElementById('versionDropdown'),
    nativeVersionSelect: document.getElementById('nativeVersionSelect'),
    list: document.getElementById('verseList'),
    attribution: document.getElementById('bibleAttribution'),
    eyebrow: document.querySelector('.chapter-eyebrow'),
    title: document.querySelector('.chapter-title'),
    side: document.getElementById('sidePanel'),
    panelTitle: document.getElementById('panelTitle'),
    panelToolbar: document.getElementById('panelToolbar'),
    panelBody: document.getElementById('panelBody'),
    strongDefPopup: document.getElementById('strongDefPopup'),
    strongDefPopupCode: document.getElementById('strongDefPopupCode'),
    strongDefPopupBody: document.getElementById('strongDefPopupBody'),
    strongDefPopupClose: document.getElementById('strongDefPopupClose'),
    close: document.getElementById('panelClose'),
    search: document.getElementById('searchTrigger'),
    tabs: [...document.querySelectorAll('.tab-rail__btn, .library-rail__btn')],
    verseActionBar: document.getElementById('verseActionBar'),
    copyVerseText: document.getElementById('copyVerseText'),
    copyVerseRef: document.getElementById('copyVerseRef'),
    closeVerseAction: document.getElementById('closeVerseAction'),
    backdrop: document.getElementById('sheetBackdrop'),
    sermonToggle: document.getElementById('sermonModeToggle'),
    readingPane: document.getElementById('readingPane'),
    editorPane: document.getElementById('editorPane'),
    editorSurface: document.getElementById('editorSurface'),
    editorToolbar: document.getElementById('editorToolbar'),
    predicaBuscarInput: document.getElementById('predicaBuscarInput'),
    predicaBuscarResults: document.getElementById('predicaBuscarResults'),
    sermonComparePanel: document.getElementById('sermonComparePanel'),
    sermonPanelTitle: document.getElementById('sermonPanelTitle'),
    sermonComparePanelToolbar: document.getElementById('sermonComparePanelToolbar'),
    sermonComparePanelBody: document.getElementById('sermonComparePanelBody'),
    sermonComparePanelClose: document.getElementById('sermonComparePanelClose'),
    sermonStrongDefPopup: document.getElementById('sermonStrongDefPopup'),
    sermonStrongDefPopupCode: document.getElementById('sermonStrongDefPopupCode'),
    sermonStrongDefPopupBody: document.getElementById('sermonStrongDefPopupBody'),
    sermonStrongDefPopupClose: document.getElementById('sermonStrongDefPopupClose'),
    sermonResizeHandle1: document.getElementById('sermonResizeHandle1'),
    sermonResizeHandle2: document.getElementById('sermonResizeHandle2')
  };

  const backupData = await VerboBackup.init();

  // Contenedor común para avisos discretos apilables (ver .app-banner-stack
  // en style.css) — evita que el recordatorio de exportación y el aviso de
  // actualización disponible se dibujen encima uno del otro si coinciden.
  function getBannerStack() {
    let stack = document.getElementById('appBannerStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'appBannerStack';
      stack.className = 'app-banner-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }

  // ---- Recordatorio de exportación mensual (red de seguridad aparte de la
  // sincronización en la nube). "Descartado" solo dura esta carga de página
  // (variable en memoria, no localStorage/sessionStorage): si sigue vencido,
  // vuelve a aparecer en la siguiente carga. ----
  let exportReminderDismissed = false;
  const EXPORT_REMINDER_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  function isExportOverdue(data) {
    const last = data?.ultima_exportacion;
    if (!last) return true;
    const elapsed = Date.now() - Date.parse(last);
    return !(elapsed < EXPORT_REMINDER_DAYS_MS);
  }
  function renderExportReminderBanner() {
    if (document.getElementById('exportReminder')) return;
    const el = document.createElement('div');
    el.id = 'exportReminder';
    el.className = 'export-reminder';
    el.innerHTML = `
      <div class="export-reminder__row">
        <p class="export-reminder__msg">${t('ajustes.exportReminderMsg')}</p>
        <button type="button" class="export-reminder__close" aria-label="${t('ajustes.exportReminderDismissAria')}">&times;</button>
      </div>
      <button type="button" class="export-reminder__btn">${t('ajustes.exportReminderBtn')}</button>`;
    getBannerStack().appendChild(el);
    el.querySelector('.export-reminder__close').addEventListener('click', () => {
      exportReminderDismissed = true;
      el.remove();
    });
    el.querySelector('.export-reminder__btn').addEventListener('click', () => {
      VerboBackup.exportDownload();
      toast(t('toast.descargando'));
      exportReminderDismissed = true;
      el.remove();
    });
  }
  if (!exportReminderDismissed && isExportOverdue(backupData)) renderExportReminderBanner();

  // ---- Service Worker: shell offline real + aviso de actualización no
  // intrusivo. El nuevo SW se queda "esperando" a propósito (no hay
  // skipWaiting() automático en service-worker.js) hasta que el usuario
  // acepta desde este aviso — así nunca se le cambia la app debajo de los
  // pies mientras escribe una prédica sin guardar. Si lo descarta, sigue
  // trabajando con la versión actual; el aviso vuelve a aparecer en la
  // próxima carga si la actualización sigue pendiente. ----
  if ('serviceWorker' in navigator) {
    let swReloadingForUpdate = false;
    function renderUpdateBanner(registration) {
      if (document.getElementById('swUpdateBanner')) return;
      const el = document.createElement('div');
      el.id = 'swUpdateBanner';
      el.className = 'export-reminder';
      el.innerHTML = `
        <div class="export-reminder__row">
          <p class="export-reminder__msg">${t('app.updateAvailableMsg')}</p>
          <button type="button" class="export-reminder__close" aria-label="${t('app.updateAvailableDismissAria')}">&times;</button>
        </div>
        <button type="button" class="export-reminder__btn">${t('app.updateAvailableBtn')}</button>`;
      getBannerStack().appendChild(el);
      el.querySelector('.export-reminder__close').addEventListener('click', () => el.remove());
      el.querySelector('.export-reminder__btn').addEventListener('click', () => {
        // Recién aquí, con un clic explícito del usuario, se le pide al SW en
        // espera que tome control — controllerchange (abajo) es lo único que
        // dispara el reload, y solo si esta bandera está en true.
        swReloadingForUpdate = true;
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        el.remove();
      });
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!swReloadingForUpdate) return;
      swReloadingForUpdate = false;
      location.reload();
    });
    const setupServiceWorker = async () => {
      try {
        // updateViaCache: 'none' es necesario porque GitHub Pages sirve
        // service-worker.js con Cache-Control: max-age=600 y no hay forma
        // de cambiar ese header ahí (sin backend/CDN propio) — sin esto, el
        // navegador podía comparar contra una copia de HASTA 10 minutos de
        // antigüedad guardada en su caché HTTP normal en vez de ir a la red.
        const registration = await navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' });
        const checkWaiting = () => {
          if (registration.waiting && navigator.serviceWorker.controller) renderUpdateBanner(registration);
        };
        checkWaiting();
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) checkWaiting();
          });
        });
        // En Android, al reabrir la app instalada (TWA) desde segundo plano,
        // Chrome muchas veces reanuda la página congelada en vez de
        // recargarla — no dispara 'load' de nuevo, así que sin esto la app
        // podía quedar pegada en una versión vieja por días aunque el
        // usuario la reabriera seguido (solo borrar los datos de la app
        // forzaba una carga 100% desde cero y arreglaba el problema). Con
        // esto, cada vez que la app vuelve a primer plano se pregunta
        // activamente si hay una versión nueva.
        // Debounce: 'visibilitychange' y 'focus' suelen dispararse juntos en
        // un mismo resume, y cambiar de app varias veces seguidas (ej. al
        // revisar notificaciones) puede disparar el evento muchas veces en
        // segundos — sin este mínimo, cada una lanzaría su propia petición
        // de red redundante.
        const RECHECK_MIN_INTERVAL_MS = 60000;
        let lastRecheckAt = 0;
        const recheckOnResume = () => {
          if (document.visibilityState !== 'visible') return;
          const now = Date.now();
          if (now - lastRecheckAt < RECHECK_MIN_INTERVAL_MS) return;
          lastRecheckAt = now;
          registration.update().then(checkWaiting).catch(() => {});
        };
        document.addEventListener('visibilitychange', recheckOnResume);
        window.addEventListener('pageshow', recheckOnResume);
        window.addEventListener('focus', recheckOnResume);
      } catch {}
    };
    // 'load' puede haber disparado YA para cuando llegamos hasta acá — este
    // código corre dentro de un handler de DOMContentLoaded con varios
    // await (i18n, backup) antes de este punto, y en la práctica esa espera
    // alcanza para que 'load' ya haya pasado (confirmado: en una carga real,
    // domContentLoadedEventEnd y loadEventEnd quedaron a menos de 150ms de
    // diferencia). Un listener agregado a un evento que ya ocurrió nunca se
    // ejecuta, así que todo este bloque —incluido el aviso de actualización—
    // podía quedar como código muerto en cada carga. Por eso se corre de
    // inmediato si el documento ya terminó de cargar.
    if (document.readyState === 'complete') setupServiceWorker();
    else window.addEventListener('load', setupServiceWorker, { once: true });
  }

  if (window.VerboSync) {
    VerboSync.on('data-updated', () => location.reload());
    VerboSync.on('linked', () => { syncPending = false; if (activeTab === 'ajustes') renderAjustes(); });
    VerboSync.on('unlinked', () => { if (activeTab === 'ajustes') renderAjustes(); });
    VerboSync.on('link-error', () => { toast(t('toast.errorSync')); if (activeTab === 'ajustes') renderAjustes(); });
    VerboSync.init().catch(err => console.warn('[sync] init falló', err));
  }
  // Si este dispositivo no tiene 'verbo:lastVersion' (localStorage, nunca
  // sincronizado) pero sí llegó una posición de lectura sincronizada de otro
  // dispositivo (VerboBackup, ver Fase 1 sync), usar esa versión — así la
  // Biblia elegida viaja entre dispositivos sin duplicar el mecanismo de sync.
  let catalog, data, activeTab = null, currentVersion = localStorage.getItem('verbo:lastVersion') || VerboBackup.getPosicionBiblia()?.version || null, compareVersion = null;
  let xrefTarget = null, xrefData = null;
  function resetXrefMode(){ xrefTarget = null; xrefData = null; }
  let sermonMode = false;
  let sermonEditor = null;
  let sermonEditorContent = null;
  let sermonBible = null;
  let currentPredicaId = null;
  let selectedVerses = new Set();
  let highlights = VerboBackup.getResaltadosMap();
  let suppressCommentSync = false;
  let commentSyncTimer = null;
  let searchState = null;
  let currentCommentary = localStorage.getItem('verbo:lastCommentary') || null;
  let currentDictionary = localStorage.getItem('verbo:lastDictionary') || null;
  let currentExegesis = localStorage.getItem('verbo:lastExegesis') || null;
  let gospelData=null;
  let gospelOpenChapter=null;
  let patristicCatalog=null;
  let patristicShelf=null;
  let patristicOpenDoc=null;
  let patristicOpenSection=null;
  let patristicMode=localStorage.getItem('verbo:patristicMode') || 'docs';
  let patristicByVerseCatalog=null;
  let currentPatristicByVerse=null;
  // Fuente(s) que sí tienen fragmento para el versículo que el usuario acaba de
  // clickear (ver indicador 📜 por versículo) — se consume una sola vez al
  // abrir el panel, para saltar directo al documento correcto en vez de dejar
  // al usuario adivinar en el selector "Fuente".
  let pendingPatristicSources=null;
  // Costumbres y Tradiciones: mismo patrón de 3 niveles que Padres Apostólicos
  // (estante → índice de la obra → entrada), pero el estante se agrupa por
  // categoría (ver renderCostumbresPanel).
  let costumbresShelf=null;
  let costumbresOpenWork=null;
  let costumbresDocData=null;
  let costumbresOpenId=null;
  // Conversor de medidas: datos fijos cargados una sola vez (no hay estados
  // de navegación tipo estante/índice, es una calculadora de una sola vista).
  let conversorData=null;
  let conversorCategoria=null;
  let conversorUnidadOrigen=null;
  const posicionBiblia = VerboBackup.getPosicionBiblia();
  let currentBook = posicionBiblia?.libro || 'ROM';
  let currentChapter = Number(posicionBiblia?.capitulo) || 7;
  const themes = [
    { id:'paper', sample:'#F1E3C8' },
    { id:'cream', sample:'#F5E7C8' },
    { id:'sage', sample:'#DDE8D1' },
    { id:'mist', sample:'#DDEAF1' },
    { id:'pearl', sample:'#ECE9E2' },
    { id:'sand', sample:'#F1DCD6' },
    { id:'mint', sample:'#D8F3EA' },
    { id:'rosewood', sample:'#F2D7DF' }
  ];

  const emptyState = (icon, text) => `<div class="panel-empty"><div class="panel-empty__icon">${icon}</div><div class="panel-empty__text">${text}</div></div>`;
  const activeVerse = () => Number(document.querySelector('.verse--active')?.dataset.verseN) || null;
  const hlKey = (book, chapter, n) => `${book}:${chapter}:${n}`;
  const saveHighlights = () => { VerboBackup.setAllResaltados(highlights); };
  const HL_COLORS = ['hl-yellow','hl-green','hl-blue','hl-pink','hl-coral','hl-violet'];
  // Las Biblias con etiquetas Strong viven únicamente dentro del panel
  // "Biblia Strong", nunca en el selector principal. La fuente sigue el mismo
  // idioma activo que comentarios/diccionarios (contentLang): Biblia Verbo +
  // Strong en español y KJV + Strong en inglés. loadBible() acepta la ruta
  // directa y no necesita que estos módulos estén en el catálogo público.
  const STRONG_BIBLE_PATHS = {
    es: 'modules/bibles/rv-verbo-strong-provisional/manifest.json',
    en: 'modules/bibles/kjv-strong/manifest.json'
  };
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const bibleCatalog = () => catalog.bibles.map(item => ({ id:item.manifest.id, label:item.manifest.abbreviation || item.manifest.name, full:item.manifest.name, path:item.path, lang:item.manifest.language || 'es', remote:Boolean(item.remote || item.manifest.remote), manifest:item.manifest }));
  // Idioma de Strong/comentarios/Padres sigue al botón ES/EN de la interfaz
  // (VerboI18n.getUiLang()), no a la Biblia seleccionada — decisión de Juan
  // 2026-08-04: la Biblia activa puede quedarse en español mientras el usuario
  // quiere leer el resto del contenido traducido, o viceversa.
  const contentLang = () => window.VerboI18n?.getUiLang() || 'es';
  const strongBiblePath = () => STRONG_BIBLE_PATHS[contentLang()] || STRONG_BIBLE_PATHS.es;
  const commentaryCatalog = () => (catalog.commentaries || []).map(item => ({ id:item.manifest.id, label:item.manifest.abbreviation || item.manifest.name, full:item.manifest.name, path:item.path, manifest:item.manifest }));
  // Léxico Strong: módulos numéricos (G1234 / H1234) consultados al tocar una etiqueta Strong en el texto.
  const isStrongLexicon = item => Boolean(item.manifest.strong);
  const dictionaryCatalog = () => (catalog.dictionaries || []).filter(isStrongLexicon).map(item => ({ id:item.manifest.id, label:item.manifest.abbreviation || item.manifest.name, full:item.manifest.name, path:item.path, manifest:item.manifest, linked:Boolean(item.manifest.books?.length) }));
  const exegesisCatalog = () => (catalog.exegesis || []).map(item => ({ id:item.manifest.id, label:item.manifest.abbreviation || item.manifest.name, full:item.manifest.name, path:item.path, manifest:item.manifest }));
  const bookAbbr = { GEN:'Gn', EXO:'Ex', LEV:'Lv', NUM:'Nm', DEU:'Dt', JOS:'Jos', JDG:'Jue', RUT:'Rt', '1SA':'1 S', '2SA':'2 S', '1KI':'1 R', '2KI':'2 R', '1CH':'1 Cr', '2CH':'2 Cr', EZR:'Esd', NEH:'Neh', EST:'Est', JOB:'Job', PSA:'Sal', PRO:'Pr', ECC:'Ec', SNG:'Cnt', ISA:'Is', JER:'Jer', LAM:'Lm', EZK:'Ez', DAN:'Dn', HOS:'Os', JOL:'Jl', AMO:'Am', OBA:'Abd', JON:'Jon', MIC:'Mi', NAM:'Nah', HAB:'Hab', ZEP:'Sof', HAG:'Hag', ZEC:'Zac', MAL:'Mal', MAT:'Mt', MRK:'Mc', LUK:'Lc', JHN:'Jn', ACT:'Hch', ROM:'Ro', '1CO':'1 Cor', '2CO':'2 Cor', GAL:'Gá', EPH:'Ef', PHP:'Fil', COL:'Col', '1TH':'1 Tes', '2TH':'2 Tes', '1TI':'1 Ti', '2TI':'2 Ti', TIT:'Tit', PHM:'Flm', HEB:'Heb', JAS:'Stg', '1PE':'1 P', '2PE':'2 P', '1JN':'1 Jn', '2JN':'2 Jn', '3JN':'3 Jn', JUD:'Jud', REV:'Ap' };
  const compactRef = (bookId=currentBook, chapter=currentChapter, verses=[]) => {
    const sorted=[...new Set(verses.map(Number))].sort((a,b)=>a-b);
    if(!sorted.length) return `${bookAbbr[bookId] || data?.meta?.book || bookId} ${chapter}`;
    const ranges=[]; let start=sorted[0], prev=sorted[0];
    for(const n of sorted.slice(1)){ if(n===prev+1){ prev=n; continue; } ranges.push(start===prev?`${start}`:`${start}-${prev}`); start=prev=n; }
    ranges.push(start===prev?`${start}`:`${start}-${prev}`);
    return `${bookAbbr[bookId] || data?.meta?.book || bookId} ${chapter}:${ranges.join(',')}`;
  };
  const copyToClipboard = async (text) => {
    // Dentro de la app nativa (Capacitor), usar la hoja de compartir del
    // sistema en vez de solo el portapapeles: incluye "Copiar" como una de
    // sus opciones, más Mensajes/Mail/etc. — integración nativa real, no solo
    // un sitio envuelto (Apple Guideline 4.2). En el sitio web normal
    // `window.Capacitor` no existe y este bloque no hace nada.
    if (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Share) {
      try { await window.Capacitor.Plugins.Share.share({ text }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(text); toast(t('toast.copiado')); }
    catch { const area=document.createElement('textarea'); area.value=text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); toast(t('toast.copiado')); }
  };
  const toast = (message, duration=1400) => {
    let el=document.querySelector('.verbo-toast');
    if(!el){ el=document.createElement('div'); el.className='verbo-toast'; document.body.appendChild(el); }
    el.textContent=message; el.classList.add('verbo-toast--show');
    clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('verbo-toast--show'),duration);
  };

  applyTheme(localStorage.getItem('verbo:theme') || 'paper');

  try {
    catalog = await VerboModules.getCatalog();
    // Primera visita (sin `verbo:lastVersion` guardado ni versión sincronizada
    // todavía): usar el idioma detectado/guardado de interfaz (ver
    // assets/i18n.js) para elegir la Biblia POR DEFECTO CANÓNICA de Verbo en
    // ese idioma — Biblia Verbo en español, NASB en inglés (remota vía
    // API.Bible, ya soportada como versión activa por ensureVersionLoaded) —
    // no simplemente "la primera Biblia que coincida con el idioma" del
    // catálogo, que antes caía en RVA 1909 / ASV por orden de listado. Si la
    // canónica no está disponible (ej. registry.json editado a mano sin esa
    // entrada, o API.Bible caída), cae a cualquier Biblia en ese idioma y
    // luego a RVA 1909. Es una decisión de arranque única: en cuanto el
    // usuario elige una Biblia (o esta corrida guarda una), queda fijada en
    // `verbo:lastVersion` como siempre y esta lógica no vuelve a correr. No
    // toca contentLang() ni el idioma de interfaz.
    if (!currentVersion && window.VerboI18n) {
      const detectedLang = window.VerboI18n.getUiLang();
      const canonicalDefaults = { es: 'rv-verbo', en: 'api-nasb2020' };
      const all = bibleCatalog();
      const canonical = all.find(v => v.id === canonicalDefaults[detectedLang]);
      const bySameLang = all.find(v => v.lang === detectedLang);
      const fallback = detectedLang !== 'es' ? all.find(v => v.id === 'rva-1909') : null;
      const preferred = canonical || bySameLang || fallback;
      if (preferred) currentVersion = preferred.id;
    }
    await populateBooks();
    if (!commentaryCatalog().some(c => c.id === currentCommentary)) currentCommentary = commentaryCatalog()[0]?.id || null;
    if (!dictionaryCatalog().some(c => c.id === currentDictionary)) currentDictionary = dictionaryCatalog()[0]?.id || null;
    if (!exegesisCatalog().some(c => c.id === currentExegesis)) currentExegesis = exegesisCatalog()[0]?.id || null;
    if (!catalog.books.some(b => b.id === currentBook)) currentBook = catalog.books[0].id;
    els.book.value = currentBook;
    await refreshChapters();
    await loadPassage();
  } catch (error) {
    console.error(error);
    showFatal(error);
    return;
  }

  async function populateBooks() {
    // catalog.books es la lista canónica de IDs/orden (fija a la Biblia por
    // defecto) — el NOMBRE mostrado debe venir del manifiesto de la Biblia
    // activa (ej. ASV/KJV listan "Revelation", no "Apocalipsis"), si no,
    // el desplegable siempre muestra los nombres en español sin importar
    // qué versión esté seleccionada. Algunas Biblias (ej. kjv/manifest.json)
    // no listan "books" directamente, sino vía "dataManifest" — ver
    // VerboModules.resolveBibleBooks.
    const activeEntry = catalog.bibles.find(b => b.manifest.id === currentVersion);
    const activeManifestBooks = activeEntry ? await VerboModules.resolveBibleBooks(activeEntry) : null;
    const nameById = Array.isArray(activeManifestBooks)
      ? new Map(activeManifestBooks.map(b => [b.id, b.name]))
      : null;
    els.book.innerHTML = catalog.books.map(b => `<option value="${b.id}">${escapeHTML(nameById?.get(b.id) || b.name)}</option>`).join('');
  }

  async function refreshChapters() {
    const info = await VerboModules.getBookInfo(currentBook);
    currentChapter = Math.max(1, Math.min(currentChapter, info.chapterCount));
    els.chapter.innerHTML = Array.from({length: info.chapterCount}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('');
    els.chapter.value = String(currentChapter);
    updateNavButtons();
  }

  async function loadPassage({preserveVersion=true}={}) {
    setLoading(true);
    resetXrefMode();
    try {
      const previous = preserveVersion ? currentVersion : null;
      data = await VerboModules.buildChapterData({bookId: currentBook, chapter: currentChapter, commentaryId: currentCommentary, bibleId: previous || currentVersion});
      if (previous && bibleCatalog().some(version => version.id === previous)) {
        try { await ensureVersionLoaded(previous); }
        catch (error) { console.warn(`No se pudo restaurar ${previous}; se usará la Biblia local.`, error); }
      }
      currentVersion = previous && data.versions[previous] ? previous : data.meta.version;
      localStorage.setItem('verbo:lastVersion', currentVersion);
      const availableCompare = bibleCatalog();
      const preferredCompare = availableCompare.find(v => v.id !== currentVersion)?.id || currentVersion;
      compareVersion = compareVersion && availableCompare.some(v => v.id === compareVersion)
        ? compareVersion : preferredCompare;
      populateVersions();
      selectedVerses.clear();
      renderChapter();
      updateActionBar();
      VerboBackup.setPosicionBiblia(currentBook, currentChapter, currentVersion);
      gospelOpenChapter=null;
      if (activeTab) renderPanel(activeTab);
      window.scrollTo({top:0, behavior:'smooth'});
    } catch (error) {
      console.error(error);
      els.list.innerHTML = emptyState('⚠️', t('biblia.loadError'));
    } finally { setLoading(false); }
  }

  // targetData/bookId/chapter son parametrizables porque el modo sermón necesita
  // cargar bajo demanda una versión sobre sermonBible.data (su propio libro/capítulo),
  // no sobre la Biblia principal — ver loadSermonBibleData.
  async function ensureVersionLoaded(versionId, {targetData=null, bookId=currentBook, chapter=currentChapter}={}) {
    const target = targetData || data;
    if (target.versions[versionId]) return true;
    const selected = bibleCatalog().find(version => version.id === versionId);
    if (!selected) return false;
    let loaded, rawVerses=null, hasStrongs=false;
    if (selected.remote) {
      loaded = await VerboModules.loadRemoteBible(versionId, bookId, chapter);
    } else {
      const raw = await VerboModules.loadBible(selected.path, bookId, chapter);
      if (!raw) throw new Error(`Esta versión no contiene ${bookId} ${chapter}`);
      hasStrongs = Boolean(raw.manifest.hasStrongs);
      rawVerses = raw.verses;
      loaded = { manifest: raw.manifest, copyright:'', fumsToken:'' };
    }
    target.versions[versionId] = {
      label: loaded.manifest.abbreviation,
      full: loaded.manifest.name,
      hasStrongs,
      remote: Boolean(selected.remote),
      copyright: loaded.copyright,
      fumsToken: loaded.fumsToken
    };
    target.verses.forEach(verse => {
      if (rawVerses) {
        // Biblia local: puede traer texto plano o {text,segments} (Strong).
        const raw = rawVerses[String(verse.n)];
        verse.text[versionId] = raw ? (typeof raw === 'string' ? raw : raw.text) : '';
        if (hasStrongs && raw?.segments) { verse.segments = verse.segments || {}; verse.segments[versionId] = raw.segments; }
      } else {
        verse.text[versionId] = loaded.verses[String(verse.n)] || '';
      }
    });
    return true;
  }

  // buildChapterData() solo trae el texto completo (con HTML) del comentario
  // activo al momento de construir el capítulo; el resto quedan como índice
  // liviano (notes[id] con title/author/body vacíos). Al cambiar de comentario
  // en el panel hay que traer su contenido completo bajo demanda — mismo
  // patrón que ensureVersionLoaded para Biblias.
  async function ensureCommentaryLoaded(commentaryId, {targetData=null, bookId=currentBook, chapter=currentChapter}={}) {
    const target = targetData || data;
    target.loadedCommentaries = target.loadedCommentaries || new Set();
    if (!commentaryId || target.loadedCommentaries.has(commentaryId)) return true;
    const entry = commentaryCatalog().find(c => c.id === commentaryId);
    if (!entry) return false;
    const { entries } = await VerboModules.loadCommentary(entry.path, bookId, chapter);
    entries.forEach(e => {
      if (!e.id) return;
      const id = `${commentaryId}::${e.id}`;
      target.notes[id] = { ...(target.notes[id]||{}), title:e.title||'', author:e.author||entry.manifest.author||entry.manifest.name||'', body:e.content||'', commentaryId };
    });
    target.loadedCommentaries.add(commentaryId);
    return true;
  }

  function populateVersions() {
    const all = bibleCatalog();
    const cur = all.find(v => v.id === currentVersion);
    els.versionInput.value = cur?.label || currentVersion || '';
    // Select nativo en móvil
    if (els.nativeVersionSelect) {
      els.nativeVersionSelect.innerHTML = all.map(v =>
        `<option value="${escapeHTML(v.id)}"${v.id===currentVersion?' selected':''}>${escapeHTML(v.label)}</option>`
      ).join('');
    }
  }

  function openVersionDropdown() {
    const all = bibleCatalog(); // mostrar todas las versiones sin filtrar por idioma
    const raw = els.versionInput.value.toLowerCase();
    const list = raw ? all.filter(v => v.label.toLowerCase().includes(raw) || v.full.toLowerCase().includes(raw)) : all;
    els.versionDropdown.innerHTML = list.map(v =>
      `<li class="version-picker__option${v.id===currentVersion?' version-picker__option--active':''}" data-id="${escapeHTML(v.id)}">${escapeHTML(v.label)}<span class="version-picker__option-full">${escapeHTML(v.full)}</span></li>`
    ).join('');
    // En móvil el header tiene overflow:hidden — posicionar con fixed via JS para no ser recortado
    if (window.innerWidth <= 760) {
      const rect = els.versionInput.getBoundingClientRect();
      Object.assign(els.versionDropdown.style, {
        position: 'fixed',
        top: (rect.bottom + 4) + 'px',
        bottom: '',
        left: '8px',
        right: '8px',
        minWidth: 'auto',
        maxHeight: '50vh',
        zIndex: '2100'
      });
    } else {
      els.versionDropdown.style.cssText = '';
    }
    els.versionDropdown.hidden = !list.length;
    els.versionDropdown.querySelectorAll('li').forEach(li => {
      li.addEventListener('mousedown', e => { e.preventDefault(); selectBibleVersion(li.dataset.id); });
      li.addEventListener('touchend', e => { e.preventDefault(); selectBibleVersion(li.dataset.id); });
    });
  }

  function closeVersionDropdown() {
    els.versionDropdown.hidden = true;
    els.versionDropdown.style.cssText = '';
    const cur = bibleCatalog().find(v => v.id === currentVersion);
    els.versionInput.value = cur?.label || currentVersion || '';
    els.versionInput.readOnly = true;
  }

  async function selectBibleVersion(id) {
    const v = activeVerse();
    closeVersionDropdown();
    // Si la versión seleccionada no tiene el libro actual, navegar a su primer libro
    const bibleEntry = catalog.bibles.find(b => b.manifest.id === id);
    if (bibleEntry?.manifest.books?.length) {
      const hasCurrentBook = bibleEntry.manifest.books.some(b => b.id === currentBook);
      if (!hasCurrentBook) {
        currentBook = bibleEntry.manifest.books[0].id;
        currentChapter = 1;
        els.book.value = currentBook;
        refreshChapters().then(() => loadPassage());
        return;
      }
    }
    setLoading(true);
    try {
      await ensureVersionLoaded(id);
      currentVersion = id;
      localStorage.setItem('verbo:lastVersion', currentVersion);
      VerboBackup.setPosicionBiblia(currentBook, currentChapter, currentVersion);
      if (compareVersion === currentVersion) compareVersion = bibleCatalog().find(x => x.id !== currentVersion)?.id || currentVersion;
      populateVersions();
      await populateBooks();
      els.book.value = currentBook;
      renderChapter(v);
      if (activeTab === 'comparar') await renderCompare(v);
      if (activeTab === 'comentario') renderPanel('comentario');
    } catch (error) {
      console.error(error);
      toast(error.message || t('toast.noBibleOnline'));
      populateVersions();
    } finally { setLoading(false); }
  }

  function renderChapter(restoreVerse=null) {
    els.eyebrow.textContent = data.versions[currentVersion]?.full || data.meta.versionFull;
    els.title.textContent = `${data.meta.book} ${data.meta.chapter}`;
    els.list.innerHTML = '';
    data.verses.forEach(v => {
      const row = document.createElement('div'); row.className='verse'; row.dataset.verseN=v.n;
      if (v.n === restoreVerse) row.classList.add('verse--active');
      if (selectedVerses.has(v.n)) row.classList.add('verse--selected');
      const savedHl = highlights[hlKey(currentBook, currentChapter, v.n)];
      if (savedHl) row.classList.add(savedHl);
      const num=document.createElement('span'); num.className='verse__num'; num.textContent=v.n;
      const text=document.createElement('span'); text.className='verse__text'+(v.hasNote?' verse__text--has-note':''); text.tabIndex=0;
      const verseSegments=v.segments?.[currentVersion];
      if(verseSegments?.length){
        verseSegments.forEach((seg,index)=>{
          const word=document.createElement('span'); word.className='word-segment'; word.textContent=(index?' ':'')+(seg.text||'');
          text.appendChild(word);
          const strongCodes=[...(seg.strong?[seg.strong]:[]),...(Array.isArray(seg.strongs)?seg.strongs:[])].filter((code,pos,all)=>code&&all.indexOf(code)===pos);
          strongCodes.forEach((code,codeIndex)=>{ const tag=document.createElement('button'); tag.type='button'; tag.className='strongs-tag'; tag.textContent=code; tag.dataset.strongCode=code; const morphs=[...(seg.morph?[seg.morph]:[]),...(Array.isArray(seg.morphs)?seg.morphs:[])]; tag.title=morphs[codeIndex]?t('biblia.morfologiaTitle',{value:morphs[codeIndex]}):t('biblia.abrirDiccionarioTitle'); text.appendChild(tag); });
        });
      } else text.textContent=v.text[currentVersion] || Object.values(v.text)[0] || '';
      const margin=document.createElement('span'); margin.className='marginalia';
      row.append(num,text);
      row.appendChild(margin); els.list.appendChild(row);
      // Íconos de comentario/biblioteca/padres apostólicos: en vez de flotar
      // encimados sobre el texto del versículo (posición absoluta en el margen,
      // problemática en móvil por traslape con líneas envueltas), viven en la
      // misma fila que las referencias cruzadas, justo después del botón "+N
      // más" — fila que ya vive en flujo normal debajo del texto.
      const indicatorButtons=[];
      if(v.hasNote && (v.commentaries||[]).length){
        const indicator=document.createElement('button');
        indicator.type='button';
        indicator.className='verse__comment-indicator';
        const count=v.commentaries.length;
        indicator.innerHTML=`<span class="verse__comment-indicator__icon" aria-hidden="true">💬</span><span class="verse__comment-indicator__count">${count}</span>`;
        const plural=t(count===1?'biblia.comentarioSingular':'biblia.comentarioPlural');
        indicator.title=t('biblia.comentariosTitle',{count,plural});
        indicator.setAttribute('aria-label',t('biblia.verComentariosAria',{count,plural,ref:`${data.meta.book} ${data.meta.chapter}:${v.n}`}));
        indicator.addEventListener('click',(e)=>{
          e.stopPropagation();
          document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active'));
          row.classList.add('verse--active');
          openPanel('comentario', null, v.commentaries);
        });
        indicatorButtons.push(indicator);
      }
      if(v.patristicCount>0){
        const patristicIndicator=document.createElement('button');
        patristicIndicator.type='button';
        patristicIndicator.className='verse__comment-indicator verse__comment-indicator--patristic';
        patristicIndicator.innerHTML=`<span class="verse__comment-indicator__icon" aria-hidden="true">📜</span><span class="verse__comment-indicator__count">${v.patristicCount}</span>`;
        const patristicPlural=t(v.patristicCount===1?'biblia.fragmentoSingular':'biblia.fragmentoPlural');
        patristicIndicator.title=t('biblia.verPadresTitle',{count:v.patristicCount,plural:patristicPlural});
        patristicIndicator.setAttribute('aria-label',t('biblia.verPadresAria',{count:v.patristicCount,plural:patristicPlural,ref:`${data.meta.book} ${data.meta.chapter}:${v.n}`}));
        patristicIndicator.addEventListener('click',(e)=>{
          e.stopPropagation();
          document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active'));
          row.classList.add('verse--active');
          patristicMode='verse';
          localStorage.setItem('verbo:patristicMode','verse');
          pendingPatristicSources=(v.patristicSources && v.patristicSources.length) ? v.patristicSources : null;
          openPanel('padres', v.n);
        });
        indicatorButtons.push(patristicIndicator);
      }
      if((v.crossrefs||[]).length || indicatorButtons.length){
        const XREF_LIMIT=5;
        const xrefRow=document.createElement('div'); xrefRow.className='verse__xrefs';
        // Los íconos de comentario/biblioteca/padres van primero, en posición fija:
        // si se agregan DESPUÉS de las referencias, el botón "+N más" los deja
        // atravesados en medio de la fila al expandir (las nuevas chips se agregan
        // al final, detrás de los íconos que ya estaban ahí).
        indicatorButtons.forEach(btn=>xrefRow.appendChild(btn));
        const addChip=ref=>{
          const chip=document.createElement('button');
          chip.type='button'; chip.className='verse__xref-chip'; chip.textContent=ref.label;
          chip.title=t('biblia.verXrefTitle',{ref:ref.label});
          chip.addEventListener('click',(e)=>{ e.stopPropagation(); openCrossref(ref); });
          xrefRow.appendChild(chip);
        };
        (v.crossrefs||[]).slice(0,XREF_LIMIT).forEach(addChip);
        if((v.crossrefs||[]).length>XREF_LIMIT){
          const rest=v.crossrefs.slice(XREF_LIMIT);
          const more=document.createElement('button');
          more.type='button'; more.className='verse__xref-more'; more.textContent=t('biblia.masReferencias',{n:rest.length});
          more.addEventListener('click',(e)=>{
            e.stopPropagation();
            rest.forEach(addChip);
            more.remove();
          });
          xrefRow.appendChild(more);
        }
        els.list.appendChild(xrefRow);
      }
      text.addEventListener('click',()=>{ selectVerse(row,v); });
      text.addEventListener('contextmenu',(e)=>{ e.preventDefault(); selectVerse(row,v); });
      text.querySelectorAll('.strongs-tag').forEach(tag=>tag.addEventListener('click',e=>{e.stopPropagation(); openDictionary(tag.dataset.strongCode);}));
    });
    const version = data.versions[currentVersion];
    if (els.attribution) {
      els.attribution.hidden = !version?.copyright;
      els.attribution.textContent = version?.copyright || '';
    }
    if (version?.fumsToken && !version.fumsReported) {
      window.fums('trackView', version.fumsToken);
      version.fumsReported = true;
    }
  }

  function selectVerse(row, verse) {
    document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active'));
    row.classList.add('verse--active');
    if(selectedVerses.has(verse.n)) selectedVerses.delete(verse.n); else selectedVerses.add(verse.n);
    row.classList.toggle('verse--selected', selectedVerses.has(verse.n));
    updateActionBar();
    resetXrefMode();
    const firstNote=verse.commentaries?.find(c=>c.commentaryId===currentCommentary)?.noteIds?.[0]||null;
    if (activeTab === 'comentario') renderPanel('comentario', firstNote);
    if (activeTab === 'comparar') renderCompare(verse.n);
    if (activeTab === 'diccionario') renderPanel('diccionario', verse.n);
    if (activeTab === 'exegesis') renderPanel('exegesis', verse.n);
    if (activeTab === 'padres') renderPanel('padres', verse.n);
  }

  function updateActionBar(){
    if(!els.verseActionBar) return;
    els.verseActionBar.hidden = selectedVerses.size === 0;
  }

  function selectedVerseNumbers(){ return [...selectedVerses].sort((a,b)=>a-b); }

  // En modo sermón, "copiar" debe leer de la Biblia de la pestaña Biblia
  // (sermonBible), no de la Biblia principal, que queda oculta/congelada.
  function activeBibleContext(){
    if(sermonMode && sermonBible?.data) return { data: sermonBible.data, book: sermonBible.book, chapter: sermonBible.chapter, version: sermonBible.version };
    return { data, book: currentBook, chapter: currentChapter, version: currentVersion };
  }

  function copySelectedReferences(){
    const nums=selectedVerseNumbers();
    if(!nums.length) return;
    const ctx=activeBibleContext();
    copyToClipboard(compactRef(ctx.book,ctx.chapter,nums));
  }

  function copySelectedText(){
    const nums=selectedVerseNumbers();
    if(!nums.length) return;
    const ctx=activeBibleContext();
    const lines=nums.map(n=>{
      const verse=ctx.data.verses.find(v=>v.n===n);
      const text=verse?.text?.[ctx.version] || Object.values(verse?.text || {})[0] || '';
      return `${compactRef(ctx.book,ctx.chapter,[n])} ${String(text).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`;
    });
    copyToClipboard(lines.join('\n'));
  }

  // Antes solo Comentario/Comparar/Diccionario usaban la hoja parcial (72vh);
  // Biblioteca ya usaba el panel completo y a Juan le pareció que se veía mejor,
  // así que en mobile los tres pasan a comportarse igual que Biblioteca (2026-07-24).
  const SHEET_TABS = [];
  function isMobileSheet(){ return window.innerWidth<=760 && SHEET_TABS.includes(activeTab); }

  function openPanel(tab, focus=null, verseCommentaries=null) {
    const panelWasClosed=!els.side.classList.contains('side-panel--open');
    // El pop-up de definición Strong nunca debe quedar flotando sobre OTRO
    // panel (Cambio 3) — se cierra acá al salir de 'diccionario', pero no al
    // reabrir la misma pestaña (openDictionary ya evita llamar a openPanel en
    // ese caso).
    if(activeTab==='diccionario' && tab!=='diccionario') closeStrongPopup();
    activeTab=tab;
    if(tab!=='historia') els.side.classList.remove('side-panel--history-expanded');
    const isSheet=window.innerWidth<=760 && SHEET_TABS.includes(tab);
    els.side.classList.toggle('side-panel--left', ['historia','padres','licencias','historia-notas','costumbres','conversor'].includes(tab));
    if(isSheet){
      els.side.dataset.sheet='1';  // CSS aplica translateY(105%) inmediatamente
      els.side.offsetHeight;       // fuerza reflow para que el estado inicial esté fijo
    } else {
      delete els.side.dataset.sheet;
      els.side.style.transform='';
    }
    els.side.classList.add('side-panel--open'); // CSS transiciona a translateY(0) para sheets
    els.backdrop?.classList.toggle('sheet-backdrop--visible', isSheet);
    els.tabs.forEach(b=>b.classList.toggle('tab-rail__btn--active', b.dataset.tab===tab));
    renderPanel(tab,focus,verseCommentaries,panelWasClosed);
  }
  function closePanel(){
    const wasSheet=!!els.side.dataset.sheet;
    if(activeTab==='diccionario') closeStrongPopup();
    // Al cerrar el panel completo (no al cambiar de tab y volver), Historia
    // vuelve siempre al estante de libros — pedido explícito de Juan, revierte
    // el "conserva posición" que sí se mantiene al solo cambiar de tab.
    if(activeTab==='historia'){
      churchHistoryOpenId=null;
      churchHistoryOpenVolume=null;
      churchHistoryOpenFromShelf=false;
      churchHistorySearchActive=false;
    }
    activeTab=null;
    // El visor de mapas usa position:fixed (pantalla completa) fuera del flujo
    // del panel: si se cierra el panel sin salir antes del fullscreen, hay que
    // forzar la limpieza aquí o el mapa queda "pegado" cubriendo la pantalla.
    document.getElementById('mapViewer')?.classList.remove('map-viewer--fullscreen');
    document.body.classList.remove('map-viewer-fullscreen-active');
    // CSS: translateY(105%) para sheets. side-panel--left se quita en un
    // frame aparte a propósito: .side-panel--left tiene transition:none (el
    // panel izquierdo desaparece al instante, sin animar), pero si se quita
    // en el mismo classList.remove() que side-panel--open, el navegador ya
    // no ve esa clase al calcular la transición y aplica en su lugar la
    // regla base .side-panel{transition:width 0.28s} — se veía la animación
    // de "colapso de ancho" del panel derecho al cerrar Historia/Padres en
    // vez de desaparecer al instante (bug reportado por Juan, 2026-08-06).
    els.side.classList.remove('side-panel--open','side-panel--history-expanded');
    requestAnimationFrame(()=>{ els.side.classList.remove('side-panel--left'); });
    els.backdrop?.classList.remove('sheet-backdrop--visible');
    els.tabs.forEach(b=>b.classList.remove('tab-rail__btn--active'));
    if(wasSheet){
      // Esperar la animación de bajada (transform) antes de limpiar data-sheet.
      // Se deshabilita la transición de width antes de eliminar el atributo para
      // evitar que el colapso de width sea visible al volver al estado base.
      setTimeout(()=>{
        els.side.style.transition='none';
        delete els.side.dataset.sheet;
        els.side.style.transform='';
        requestAnimationFrame(()=>requestAnimationFrame(()=>{ els.side.style.transition=''; }));
      }, 310);
    } else {
      delete els.side.dataset.sheet;
      els.side.style.transform='';
    }
  }

  // ── Drag-to-dismiss para bottom sheet ────────────────────────────────────────
  let sheetDragY=null;
  els.side.addEventListener('touchstart',e=>{
    if(!isMobileSheet()) return;
    if(els.panelBody.scrollTop>2) return;
    sheetDragY=e.touches[0].clientY;
  },{passive:true});
  els.side.addEventListener('touchmove',e=>{
    if(!isMobileSheet()||sheetDragY===null) return;
    if(els.panelBody.scrollTop>2){ sheetDragY=null; return; }
    const dy=e.touches[0].clientY-sheetDragY;
    if(dy>0){ els.side.style.transform=`translateY(${dy}px)`; e.preventDefault(); }
  },{passive:false});
  els.side.addEventListener('touchend',e=>{
    if(sheetDragY===null) return;
    const dy=e.changedTouches[0].clientY-sheetDragY;
    sheetDragY=null;
    if(dy>110) closePanel(); else els.side.style.transform='';
  });
  els.backdrop?.addEventListener('click',()=>closePanel());
  // ─────────────────────────────────────────────────────────────────────────────

  // Redirección genérica de destino de renderizado: en modo sermón, el
  // segundo panel (ver "Segundo panel del modo sermón" más abajo) comparte
  // las mismas funciones de renderizado que usa #sidePanel (renderPanel para
  // 'comentario', renderNotes, renderMapsPanel/renderMapViewer,
  // renderPredicasPanel) en vez de duplicarlas. sermonPanelTarget apunta a
  // sus nodos mientras ese panel esté abierto; si es null (todo el resto de
  // la app, siempre) estas funciones devuelven los nodos de siempre de
  // #sidePanel — cero cambio de comportamiento fuera de ese caso.
  let sermonPanelTarget = null;
  function panelTitleEl(){ return sermonPanelTarget ? sermonPanelTarget.title : els.panelTitle; }
  function panelToolbarEl(){ return sermonPanelTarget ? sermonPanelTarget.toolbar : els.panelToolbar; }
  function panelBodyEl(){ return sermonPanelTarget ? sermonPanelTarget.body : els.panelBody; }
  // Mismo par de nodos que panelBodyEl()/etc, pero para el popup de definición
  // Strong (ver "Biblia Strong" más abajo): vive como hermano de #panelBody/
  // #sermonComparePanelBody a propósito, nunca dentro de su innerHTML, para
  // que re-pintar la lista de versículos (cambio de capítulo, clic en otro
  // versículo) no lo borre ni lo tape — el popup solo se abre/cierra por su
  // cuenta (ver openStrongPopup/closeStrongPopup).
  function strongPopupEls(){
    return sermonPanelTarget
      ? { root: els.sermonStrongDefPopup, code: els.sermonStrongDefPopupCode, body: els.sermonStrongDefPopupBody }
      : { root: els.strongDefPopup, code: els.strongDefPopupCode, body: els.strongDefPopupBody };
  }

  function renderPanel(tab, focus=null, verseCommentaries=null, delayScroll=false) {
    panelToolbarEl().innerHTML='';
    if(tab==='comentario'){
      // Si el usuario seleccionó un versículo con el panel cerrado, al abrir Comentario
      // usamos ese versículo activo para ubicar el comentario correspondiente.
      // En modo sermón, "activo" es el versículo elegido en la pestaña Biblia (sermonBible),
      // no el de la Biblia principal, que queda oculta/congelada mientras se escribe.
      const commentCtx = commentaryContext();
      if(!focus && !verseCommentaries){
        const selectedVerseNumber = commentCtx.activeVerseN;
        const selectedVerse = commentCtx.data?.verses?.find(v => v.n === selectedVerseNumber);
        const moduleInfo=selectedVerse?.commentaries?.find(c=>c.commentaryId===currentCommentary);
        focus = moduleInfo?.noteIds?.[0] || null;
      }
      panelTitleEl().textContent=t('comentario.title');
      const installed=commentaryCatalog();
      const currentManifest=catalog?.commentaries?.find(c=>c.manifest.id===currentCommentary)?.manifest;
      const commentarySourceLang=currentManifest?.language||null;
      const needsCommentaryTranslation=Boolean(commentarySourceLang) && commentarySourceLang!==contentLang();
      if(installed.length){
        const options=installed.map(c=>`<option value="${c.id}" ${c.id===currentCommentary?'selected':''}>${escapeHTML(c.label)}</option>`).join('');
        panelToolbarEl().innerHTML=`<div class="compare-toolbar"><select class="compare-toolbar__select" id="commentarySelect">${options}</select></div>`;
        document.getElementById('commentarySelect')?.addEventListener('change', async e=>{
          currentCommentary=e.target.value;
          localStorage.setItem('verbo:lastCommentary', currentCommentary);
          const freshCtx = commentaryContext();
          try {
            await ensureCommentaryLoaded(currentCommentary, {
              targetData: freshCtx.data,
              bookId: sermonMode ? sermonBible.book : currentBook,
              chapter: sermonMode ? sermonBible.chapter : currentChapter
            });
          } catch (error) { console.warn(error); }
          const selectedVerse=freshCtx.data?.verses?.find(v=>v.n===freshCtx.activeVerseN);
          const moduleInfo=selectedVerse?.commentaries?.find(c=>c.commentaryId===currentCommentary);
          renderPanel('comentario', moduleInfo?.noteIds?.[0] || null);
        });
      }
      if(verseCommentaries && verseCommentaries.length && !focus){
        const curNote=verseCommentaries.find(c=>c.commentaryId===currentCommentary);
        focus=curNote?.noteIds?.[0]||null;
      }
      const entries=Object.entries(commentCtx.data.notes).filter(([,note])=>note.commentaryId===currentCommentary);
      panelBodyEl().innerHTML=entries.length?entries.map(([id,n])=>{
        const cachedTranslation=needsCommentaryTranslation ? tcacheGet(translationCacheKey(id,n.body,contentLang())) : null;
        const cachedTitle=needsCommentaryTranslation ? tcacheGet(translationCacheKey(`${id}:title`,n.title,contentLang())) : null;
        const cachedAuthor=needsCommentaryTranslation ? tcacheGet(translationCacheKey(`${id}:author`,n.author,contentLang())) : null;
        const bodyHtml=needsCommentaryTranslation
          ? `${cachedTranslation||`<p class="note-card__translating">${t('comentario.traduciendo')}</p>`}${originalSourceDetailsHtml(n.body,commentarySourceLang)}`
          : n.body;
        return `<div class="note-card" data-note-id="${id}"><div class="note-card__ref">${commentCtx.data.meta.book} ${commentCtx.data.meta.chapter}</div><div class="note-card__title" data-commentary-header="title"${cachedTitle?` data-translated="${contentLang()}"`:''}>${escapeHTML(cachedTitle||n.title)}</div><div class="note-card__author" data-commentary-header="author"${cachedAuthor?` data-translated="${contentLang()}"`:''}>${escapeHTML(cachedAuthor||n.author)}</div><button class="note-card__copy" type="button" data-copy-note="${id}">${t('comentario.copiarComentario')}</button><div class="note-card__body">${bodyHtml}</div></div>`;
      }).join(''):emptyState('📖',t('comentario.sinComentarios'));
      panelBodyEl().querySelectorAll('[data-copy-note]').forEach(btn=>btn.addEventListener('click',()=>{ const note=commentCtx.data.notes[btn.dataset.copyNote]; if(note) copyToClipboard(`${note.title}\n${String(note.body).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`); }));
      if(focus){ if(delayScroll) setTimeout(()=>scrollCommentToNote(focus),320); else scrollCommentToNote(focus); }
      if(needsCommentaryTranslation) setTimeout(()=>applyCommentaryTranslation(focus, commentarySourceLang), 150);
    }
    if(tab==='comparar'){ els.panelTitle.textContent='Comparar versiones'; renderCompare(focus||activeVerse()); }
    if(tab==='sermon-biblia') renderSermonBiblePanel(focus||activeVerse());
    if(tab==='diccionario') renderDictionaryPanel(focus || activeVerse());
    if(tab==='historia') renderChurchHistoryPanel();
    if(tab==='padres') renderPadresPanel(focus || activeVerse());
    if(tab==='notas') renderNotes();
    if(tab==='predicas') renderPredicasPanel();
    if(tab==='historia-notas') renderHistoriaNotasPanel();
    if(tab==='costumbres') renderCostumbresPanel();
    if(tab==='conversor') renderConversorPanel();
    if(tab==='exegesis') renderExegesis(focus || activeVerse());
    if(tab==='ajustes') renderAjustes();
    if(tab==='mapas') renderMapsPanel();
    if(tab==='licencias') renderLicensesPanel();
    if(tab==='buscar') renderSearch();
  }

  function renderLicensesPanel(){
    els.panelTitle.textContent='Fuentes y licencias';
    els.panelToolbar.innerHTML='';
    els.panelBody.innerHTML=`
      <section class="license-page">
        <div class="license-page__intro">
          <div class="license-page__seal" aria-hidden="true">V</div>
          <div>
            <h2>Verbo: fuentes y licencias</h2>
            <p>Verbo reúne textos bíblicos, datos lingüísticos y recursos de estudio respetando sus condiciones de uso. La integración Strong de esta aplicación fue preparada como una capa técnica propia sobre el texto bíblico.</p>
          </div>
        </div>

        <article class="license-card">
          <h3>King James Version con Strong</h3>
          <p>La versión <strong>KJV+</strong> procede del módulo KJV 3.1 de CrossWire Bible Society e incluye sus números Strong y datos morfológicos originales.</p>
          <p>CrossWire distribuye el módulo bajo GPL y concede una licencia pública general para utilizar el texto y su etiquetado para cualquier propósito.</p>
          <a href="https://wiki.crosswire.org/CrossWire_KJV" target="_blank" rel="noopener noreferrer">Consultar información de CrossWire KJV</a>
        </article>

        <article class="license-card">
          <h3>Biblia Verbo</h3>
          <p>Edición bíblica propia en español contemporáneo, con procedencia histórica en la Reina-Valera 1909 de dominio público. Actualmente se publica sin una capa Strong española.</p>
        </article>

        <article class="license-card">
          <h3>Biblias en línea de API.Bible</h3>
          <p>LBLA, NTV y NASB 2020 se consultan bajo demanda mediante API.Bible. Cada capítulo muestra junto al texto el aviso de copyright devuelto por el proveedor y reporta su visualización mediante FUMS.</p>
          <a href="https://api.bible" target="_blank" rel="noopener noreferrer">Consultar API.Bible</a>
        </article>

        <article class="license-card">
          <h3>Diccionarios Strong</h3>
          <p>Los diccionarios hebreo y griego de James Strong proceden de obras de dominio público. Los módulos base de CrossWire se distribuyen como <strong>Public Domain</strong>.</p>
          <div class="license-card__links">
            <a href="https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsHebrew" target="_blank" rel="noopener noreferrer">Strong hebreo</a>
            <a href="https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsGreek" target="_blank" rel="noopener noreferrer">Strong griego</a>
          </div>
        </article>

        <article class="license-card">
          <h3>Mapas bíblicos</h3>
          <p>14 de los 18 mapas del panel "Mapas bíblicos" fueron creados por <strong>churchmaps.info</strong> y publicados en dominio público. Se muestran en la versión recortada y en inglés distribuida por <strong>FreeBibleimages.org</strong> bajo licencia <strong>CC0 1.0 Universal</strong> (Public Domain Dedication).</p>
          <div class="license-card__links">
            <a href="https://churchmaps.info" target="_blank" rel="noopener noreferrer">churchmaps.info</a>
            <a href="https://www.freebibleimages.org/illustrations/church-maps/" target="_blank" rel="noopener noreferrer">FreeBibleimages.org</a>
          </div>
          <p>Los otros 4 mapas (reino dividido, doce tribus, tabernáculo y templo de Herodes) proceden de Wikimedia Commons. El reino dividido, las doce tribus y el tabernáculo están bajo licencia <strong>CC BY-SA 3.0</strong> (atribución visible en el propio visor de cada mapa; las dos primeras ya venían/se tradujeron al español, el tabernáculo se tradujo del diagrama original en polaco). El templo de Herodes es dominio público real, tomado de la <em>Encyclopædia Britannica</em> de 1911.</p>
          <div class="license-card__links">
            <a href="https://commons.wikimedia.org/wiki/File:Kingdoms_of_Israel_and_Judah_map_830-es.svg" target="_blank" rel="noopener noreferrer">Reino dividido (Commons)</a>
            <a href="https://commons.wikimedia.org/wiki/File:12_Tribes_of_Israel_Map.svg" target="_blank" rel="noopener noreferrer">Doce tribus (Commons)</a>
            <a href="https://commons.wikimedia.org/wiki/File:Przybytek_Moj%C5%BCeszowy.svg" target="_blank" rel="noopener noreferrer">Tabernáculo (Commons)</a>
            <a href="https://commons.wikimedia.org/wiki/File:EB1911_Temple_-_Plan_of_Herod%27s_Temple_and_Courts.jpg" target="_blank" rel="noopener noreferrer">Templo de Herodes (Commons)</a>
          </div>
        </article>

        <article class="license-card license-card--notice">
          <h3>Aviso de precisión</h3>
          <p>Los números Strong constituyen una ayuda de estudio y no sustituyen el análisis directo de los textos hebreo y griego. Si se detecta una asociación que necesite corrección, puede informarse al equipo de Verbo.</p>
        </article>

        <p class="license-page__footer">Verbo reconoce y agradece el trabajo de traductores, editores y proyectos bíblicos que hacen posible el estudio responsable de las Escrituras.</p>
      </section>`;
  }

  // ── Translation (EN→ES) ────────────────────────────────────────────────────
  const T_PREFIX = 'verbo:t:';
  function tcacheGet(key){ try{ return JSON.parse(localStorage.getItem(T_PREFIX+key)); }catch{ return null; } }
  function tcacheSet(key,val){ try{ localStorage.setItem(T_PREFIX+key, JSON.stringify(val)); }catch{} }
  // v4: la clave incluye el idioma destino y fuerza regenerar traducciones
  // con preservacion basica de bloques + acceso al original.
  // v3: la clave incluye el idioma destino — antes de agregar traduccion ES->EN
  // (Biblioteca Patristica + comentarios en espanol como Ireneo) solo existia una
  // direccion (EN->ES) y el destino era implicito. Las entradas v2 quedan huerfanas
  // (se regeneran solas), no rompe nada.
  function translationCacheKey(noteId, htmlContent, targetLang='es'){
    let hash=2166136261;
    const value=String(htmlContent||'');
    for(let i=0;i<value.length;i++){
      hash^=value.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return `v4:${targetLang}:${noteId}:${(hash>>>0).toString(16)}`;
  }
  function htmlToPlainText(html){ return html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim(); }
  function htmlToTranslationBlocks(html){
    const box=document.createElement('div');
    box.innerHTML=html;
    const nodes=[...box.querySelectorAll('p,li,blockquote,h1,h2,h3,h4,h5,h6')].filter(node=>node.textContent.trim());
    const blocks=nodes.length ? nodes.map(node=>htmlToPlainText(node.innerHTML)) : [htmlToPlainText(html)];
    return blocks.map(block=>block.trim()).filter(block=>block.length>=2);
  }
  function translatedBlocksToHtml(blocks){
    return blocks.map(block=>`<p>${escapeHTML(block)}</p>`).join('');
  }
  function originalSourceDetailsHtml(htmlContent, sourceLang='en'){
    const label=sourceLang==='en'?t('comentario.originalIngles'):t('comentario.textoOriginal');
    return `<details class="note-card__original"><summary>${label}</summary><div class="note-card__original-body">${htmlContent}</div></details>`;
  }
  function splitTextIntoChunks(text, maxLen=4500){
    const chunks=[];
    while(text.length>maxLen){
      let idx=text.lastIndexOf('. ',maxLen);
      if(idx<maxLen/2) idx=text.lastIndexOf(' ',maxLen);
      if(idx<0) idx=maxLen;
      chunks.push(text.slice(0,idx+1).trim());
      text=text.slice(idx+1).trim();
    }
    if(text) chunks.push(text);
    return chunks;
  }

  // Quirk observado con el motor de traducción anterior (Google Translate):
  // traducía "Apocalipsis" (ES) literalmente como "Apocalypse" en vez del
  // nombre canónico del libro bíblico en inglés, "Revelation". Se mantiene
  // como red de seguridad tras la Fase 2 (Claude Haiku vía /translate) por si
  // el mismo error apareciera con otro motor — corrección puntual aplicada a
  // toda traducción ES→EN (comentarios, diccionario, Padres Apostólicos
  // comparten este mismo punto de entrada).
  const ES_EN_BOOK_NAME_FIXES=[[/\bApocalypse\b/g,'Revelation']];
  function fixKnownBookNameMistranslations(text, targetLang){
    if(targetLang!=='en' || !text) return text;
    return ES_EN_BOOK_NAME_FIXES.reduce((acc,[pattern,replacement])=>acc.replace(pattern,replacement), text);
  }

  // URL base del Worker verbo-api-bible, reutilizada aquí tal como ya hacen
  // apiBibleProxy() (module-loader.js) y VerboSync (assets/sync.js) — mismo
  // registry.json -> apiBible.proxyUrl, sin duplicar la URL a mano.
  function translateWorkerBase(){
    return String(catalog?.registry?.apiBible?.proxyUrl || '').trim().replace(/\/+$/, '');
  }

  async function verboTranslate(text, sourceLang='en', targetLang='es'){
    // Fase 2 (2026-08-07): reemplaza el endpoint no oficial de Google
    // Translate por POST /translate en el Worker verbo-api-bible (Claude
    // Haiku 4.5 + caché compartido en Cloudflare KV — ver
    // cloudflare/api-bible-worker/README.md). A veces falla o tarda de forma
    // transitoria (mismo comportamiento que ya se observaba con Google en
    // Historia de la Iglesia) — reintenta un par de veces con espera breve
    // antes de rendirse y mostrar el original sin traducir.
    async function fetchTranslateOnce(chunk){
      const base=translateWorkerBase();
      if(!base) return null;
      const controller=new AbortController();
      const timeoutId=setTimeout(()=>controller.abort(), 12000);
      try{
        const resp=await fetch(`${base}/translate`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ text:chunk, targetLang }),
          signal:controller.signal
        });
        if(!resp.ok) return null;
        const json=await resp.json();
        return typeof json?.translation==='string' ? json.translation : null;
      }catch{ return null; }
      finally{ clearTimeout(timeoutId); }
    }
    async function fetchTranslate(chunk, attempts=3){
      for(let i=0;i<attempts;i++){
        const result=await fetchTranslateOnce(chunk);
        if(result!==null) return result;
        if(i<attempts-1) await new Promise(resolve=>setTimeout(resolve,300*(i+1)));
      }
      console.error(`[traducción] /translate no respondió tras ${attempts} intentos — se muestra el texto original sin traducir.`);
      return null;
    }
    if(text.length<=4500){
      const result=await fetchTranslate(text);
      return fixKnownBookNameMistranslations(result, targetLang);
    }
    // Long text: translate in chunks sequentially — ya no hace falta por el
    // límite de una URL (esto ahora es un POST con body JSON), pero se
    // conserva: trocear en paralelo por bloque sigue siendo más rápido y más
    // resiliente a que un solo fragmento falle que mandar todo el texto de
    // una entrada larga como una sola llamada.
    const chunks=splitTextIntoChunks(text);
    const parts=[];
    for(const chunk of chunks){
      const r=await fetchTranslate(chunk);
      if(r===null) return null;
      parts.push(r);
    }
    return fixKnownBookNameMistranslations(parts.join(' '), targetLang);
  }

  // Traduce bloque por bloque con un pool de workers concurrentes (mismo patrón
  // que applyChurchHistoryResultsTranslation/applyChurchHistoryTocTranslation)
  // en vez de un for..await secuencial: capítulos largos de Historia (decenas
  // de párrafos) tardaban demasiado traduciendo de a uno. Antes, además, si
  // fallaban los 3 reintentos de UN solo bloque (ver comentario en
  // verboTranslate sobre el endpoint público siendo intermitente), se
  // descartaba TODA la traducción y se mostraba el capítulo completo en el
  // idioma original — ahora ese bloque puntual cae a su propio texto sin
  // traducir y el resto del capítulo sí se ve traducido.
  async function translateEntry(noteId, htmlContent, sourceLang='en', targetLang='es'){
    const cacheKey=translationCacheKey(noteId,htmlContent,targetLang);
    const cached=tcacheGet(cacheKey); if(cached) return cached;
    const blocks=htmlToTranslationBlocks(htmlContent);
    const text=blocks.join('\n\n');
    if(!text || text.length<10) return htmlContent;
    try{
      const translatedBlocks=new Array(blocks.length);
      let index=0;
      async function worker(){
        while(index<blocks.length){
          const i=index++;
          const translated=await verboTranslate(blocks[i], sourceLang, targetLang);
          translatedBlocks[i]=translated!=null ? translated : blocks[i];
        }
      }
      await Promise.all(Array.from({length:Math.min(4,blocks.length)},worker));
      const result=translatedBlocksToHtml(translatedBlocks);
      tcacheSet(cacheKey, result);
      return result;
    }catch{ return htmlContent; }
  }

  async function translateCommentaryHeader(noteId, field, text, sourceLang='en', targetLang='es'){
    if(!text) return text;
    const cacheKey=translationCacheKey(`${noteId}:${field}`,text,targetLang);
    const cached=tcacheGet(cacheKey);
    if(cached) return cached;
    const translated=await verboTranslate(text,sourceLang,targetLang);
    if(!translated) return text;
    tcacheSet(cacheKey,translated);
    return translated;
  }

  async function applyCommentaryTranslation(focusNoteId=null, sourceLang=null){
    const manifest=catalog?.commentaries?.find(c=>c.manifest.id===currentCommentary)?.manifest;
    const source=sourceLang||manifest?.language;
    const target=contentLang();
    if(!source || source===target) return;
    const cards=[...panelBodyEl().querySelectorAll('.note-card[data-note-id]')];
    // Translate focused card first for immediate feedback
    const sorted = focusNoteId
      ? [...cards.filter(c=>c.dataset.noteId===focusNoteId), ...cards.filter(c=>c.dataset.noteId!==focusNoteId)]
      : cards;
    for(const card of sorted){
      const noteId=card.dataset.noteId;
      const bodyEl=card.querySelector('.note-card__body');
      if(!bodyEl||bodyEl.dataset.translated===target) continue;
      const note=commentaryContext().data.notes[noteId];
      if(!note) continue;
      for(const field of ['title','author']){
        const headerEl=card.querySelector(`[data-commentary-header="${field}"]`);
        if(!headerEl||headerEl.dataset.translated===target||!note[field]) continue;
        headerEl.dataset.translated='pending';
        const translatedHeader=await translateCommentaryHeader(noteId,field,note[field],source,target);
        if(headerEl.dataset.translated==='pending'){
          headerEl.textContent=translatedHeader;
          headerEl.dataset.translated=target;
        }
      }
      bodyEl.dataset.translated='pending';
      const translated=await translateEntry(noteId, note.body, source, target);
      if(bodyEl.dataset.translated==='pending'){
        const prevTop = noteId===focusNoteId ? card.getBoundingClientRect().top : null;
        bodyEl.innerHTML=`${translated}${originalSourceDetailsHtml(note.body,source)}`;
        bodyEl.dataset.translated=target;
        // Re-anchor scroll to keep focused card in place
        if(prevTop!==null){
          const newTop=card.getBoundingClientRect().top;
          panelBodyEl().scrollTop += (newTop - prevTop);
        }
      }
    }
  }

  async function translateDictionaryEntry(code, htmlContent){
    const cacheKey=translationCacheKey(`strong:${code}`,htmlContent);
    const cached=tcacheGet(cacheKey); if(cached) return cached;
    const box=document.createElement('div'); box.innerHTML=htmlContent;
    const paragraphs=[...box.querySelectorAll('.lexicon-section > p')];
    for(const paragraph of paragraphs){
      // Traducir solo el texto fuente. Los enlaces Strong quedan como nodos
      // independientes para que sigan abriendo sus respectivas entradas.
      const textNodes=[];
      const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) if(walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
      for(const node of textNodes){
        const translated=await verboTranslate(node.textContent);
        if(translated) node.textContent=translated;
      }
    }
    const result=`<p class="note-card__translation-note">Traducción automática al español.</p>${box.innerHTML}`;
    tcacheSet(cacheKey,result);
    return result;
  }
  // ─────────────────────────────────────────────────────────────────────────

  function scrollCommentToNote(noteId){
    const card = noteId ? panelBodyEl().querySelector(`[data-note-id="${noteId}"]`) : null;
    if(!card) return;
    suppressCommentSync = true;
    const panelRect = panelBodyEl().getBoundingClientRect();
    const cardRect  = card.getBoundingClientRect();
    panelBodyEl().scrollTop += (cardRect.top - panelRect.top) - 8;
    setTimeout(()=>{ suppressCommentSync=false; }, 400);
  }

  function syncCommentToReading(){
    if(activeTab !== 'comentario' || suppressCommentSync || !data?.verses?.length) return;
    const rows=[...document.querySelectorAll('.verse')];
    const targetLine = window.innerHeight * 0.38;
    let best=null, bestDist=Infinity;
    rows.forEach(row=>{ const rect=row.getBoundingClientRect(); const dist=Math.abs(rect.top-targetLine); if(rect.bottom>90 && rect.top<window.innerHeight && dist<bestDist){ best=row; bestDist=dist; }});
    const n=Number(best?.dataset.verseN);
    if(!n) return;
    const verse=data.verses.find(v=>v.n===n);
    const noteId=verse?.commentaries?.find(c=>c.commentaryId===currentCommentary)?.noteIds?.[0];
    if(noteId) scrollCommentToNote(noteId);
  }

  async function renderCrossrefCompare() {
    const installed=bibleCatalog();
    if(!installed.length){ els.panelToolbar.innerHTML=''; els.panelBody.innerHTML=emptyState('📚','No hay otra Biblia instalada para comparar.'); return; }
    if(!installed.some(v=>v.id===compareVersion)) compareVersion=installed[0].id;
    const {book,chapter,verseStart,verseEnd,label}=xrefTarget;
    if(!xrefData){
      els.panelToolbar.innerHTML='';
      els.panelBody.innerHTML=emptyState('⌛','Cargando referencia cruzada…');
      try { xrefData=await VerboModules.buildChapterData({bookId:book,chapter}); }
      catch(error){ console.error(error); els.panelBody.innerHTML=emptyState('⚠️','No se pudo cargar la referencia cruzada.'); return; }
    }
    const options=installed.map(v=>`<option value="${v.id}" ${v.id===compareVersion?'selected':''}>${escapeHTML(v.label)}${v.id===currentVersion?' (actual)':''}</option>`).join('');
    els.panelToolbar.innerHTML=`<div class="compare-toolbar"><span class="compare-toolbar__label">Ref · ${escapeHTML(label)}</span><select class="compare-toolbar__select" id="compareVersionSelect">${options}</select></div>`;
    let verses=xrefData.verses;
    if(!xrefData.versions[compareVersion]){
      els.panelBody.innerHTML=emptyState('⌛','Cargando versión para comparar…');
      const selected=installed.find(v=>v.id===compareVersion);
      if (selected?.remote) {
        try {
          const loaded=await VerboModules.loadRemoteBible(compareVersion,book,chapter);
          xrefData.versions[compareVersion]={label:loaded.manifest.abbreviation,full:loaded.manifest.name,hasStrongs:false,remote:true,copyright:loaded.copyright,fumsToken:loaded.fumsToken};
          xrefData.verses.forEach(v=>{ v.text[compareVersion]=loaded.verses[String(v.n)]||''; });
          verses=xrefData.verses;
        } catch (error) { console.error(error); els.panelBody.innerHTML=emptyState('⚠️',escapeHTML(error.message || 'No se pudo cargar la versión en línea.')); return; }
      } else {
        const loaded=selected ? await VerboModules.loadBible(selected.path,book,chapter) : null;
        if(!loaded){ els.panelBody.innerHTML=emptyState('⚠️','Esta versión no contiene el pasaje referenciado.'); return; }
        verses=xrefData.verses.map(v=>({ ...v, text:{...v.text,[compareVersion]:(typeof loaded.verses[String(v.n)]==='string'?loaded.verses[String(v.n)]:loaded.verses[String(v.n)]?.text)||''} }));
        xrefData.verses=verses;
      }
    }
    els.panelBody.innerHTML=verses.map(v=>`<div class="compare-verse${v.n>=verseStart&&v.n<=(verseEnd||verseStart)?' compare-verse--active':''}" data-verse-n="${v.n}"><span class="compare-verse__num">${v.n}</span><span class="compare-verse__text">${escapeHTML(v.text[compareVersion]||'')}</span></div>`).join('');
    document.getElementById('compareVersionSelect')?.addEventListener('change',async e=>{compareVersion=e.target.value;await renderCrossrefCompare();});
    els.panelBody.querySelector(`[data-verse-n="${verseStart}"]`)?.scrollIntoView({block:'center'});
  }

  // toolbarEl/bodyEl/selectId permiten reusar esta misma función para el
  // panel "Comparar" lado a lado del modo sermón (ver renderSermonCompare),
  // que necesita su propio contenedor y su propio <select> (ids únicos) en
  // vez de escribir sobre els.panelToolbar/panelBody del panel único.
  // `context` es de dónde sale el pasaje a comparar — por defecto la Biblia
  // principal (data/currentBook/currentChapter). renderSermonCompare() pasa
  // activeBibleContext() en su lugar, para comparar el capítulo que esté
  // abierto en la pestaña Biblia del modo sermón en vez de la Biblia
  // principal (que en modo sermón queda congelada, ver activeBibleContext()).
  async function renderCompare(focus, toolbarEl=els.panelToolbar, bodyEl=els.panelBody, selectId='compareVersionSelect', context={data, book:currentBook, chapter:currentChapter}) {
    if(xrefTarget){ await renderCrossrefCompare(); return; }
    const installed=bibleCatalog();
    if(!installed.length){ toolbarEl.innerHTML=''; bodyEl.innerHTML=emptyState('📚','No hay otra Biblia instalada para comparar.'); return; }
    if(!installed.some(v=>v.id===compareVersion)) compareVersion=installed[0].id;
    const options=installed.map(v=>`<option value="${v.id}" ${v.id===compareVersion?'selected':''}>${escapeHTML(v.label)}${v.id===currentVersion?' (actual)':''}</option>`).join('');
    toolbarEl.innerHTML=`<div class="compare-toolbar"><span class="compare-toolbar__label">Biblia alterna</span><select class="compare-toolbar__select" id="${selectId}">${options}</select></div>`;
    let verses=context.data.verses;
    if(!context.data.versions[compareVersion]){
      bodyEl.innerHTML=emptyState('⌛','Cargando versión para comparar…');
      const selected=installed.find(v=>v.id===compareVersion);
      if (selected?.remote) {
        try { await ensureVersionLoaded(compareVersion, {targetData: context.data, bookId: context.book, chapter: context.chapter}); verses=context.data.verses; }
        catch (error) { console.error(error); bodyEl.innerHTML=emptyState('⚠️',escapeHTML(error.message || 'No se pudo cargar la versión en línea.')); return; }
      } else {
        const loaded=selected ? await VerboModules.loadBible(selected.path,context.book,context.chapter) : null;
        if(!loaded){ bodyEl.innerHTML=emptyState('⚠️','Esta versión no contiene el pasaje seleccionado.'); return; }
        verses=context.data.verses.map(v=>({ ...v, text:{...v.text,[compareVersion]:(typeof loaded.verses[String(v.n)]==='string'?loaded.verses[String(v.n)]:loaded.verses[String(v.n)]?.text)||''} }));
      }
    }
    bodyEl.innerHTML=verses.map(v=>`<div class="compare-verse${v.n===focus?' compare-verse--active':''}" data-verse-n="${v.n}"><span class="compare-verse__num">${v.n}</span><span class="compare-verse__text">${escapeHTML(v.text[compareVersion]||'')}</span></div>`).join('');
    document.getElementById(selectId)?.addEventListener('change',async e=>{compareVersion=e.target.value;await renderCompare(activeVerse(),toolbarEl,bodyEl,selectId,context);});
    if(focus) bodyEl.querySelector(`[data-verse-n="${focus}"]`)?.scrollIntoView({block:'center'});
  }

  // ── Segundo panel del modo sermón: Comparar / Comentarios / Notas / Mapas /
  // Mis prédicas ───────────────────────────────────────────────────────────
  // Panel independiente de #sidePanel (ver .sermon-compare-panel en
  // style.css) — abre/cierra con su propio toggle de ancho, no pasa por
  // openPanel/closePanel ni por activeTab (ese sistema es del panel único
  // del resto de la app y no se toca). Empuja la Biblia (pestaña
  // "sermon-biblia" de #sidePanel) hacia la izquierda sin reemplazarla, y
  // deja el Editor siempre visible como tercera columna.
  //
  // Nació (2026-08) como un panel dedicado únicamente a "Comparar
  // versiones". A pedido de Juan, que quería el mismo comportamiento para
  // Comentarios/Notas/Mapas/Mis prédicas (hasta entonces reemplazaban el
  // contenido de #sidePanel, tapando la Biblia), se generalizó para que las
  // cinco pestañas compartan este mismo panel — mutuamente excluyentes entre
  // sí — reutilizando las funciones de renderizado que ya existían para
  // #sidePanel (renderPanel('comentario',…), renderNotes, renderMapsPanel,
  // renderPredicasPanel) a través del redirect panelTitleEl()/
  // panelToolbarEl()/panelBodyEl() (ver justo antes de renderPanel), en vez
  // de duplicar esa lógica.
  const SERMON_SIDE_PANEL_TABS = ['comparar','comentario','notas','mapas','predicas','diccionario'];
  let sermonPanelTab = null; // pestaña mostrada en este panel; null = cerrado

  // Sincronización de referencia (libro/capítulo/versículo) con la pestaña
  // Biblia del modo sermón: activeBibleContext() ya resuelve a sermonBible en
  // modo sermón (ver esa función arriba), así que basta con pasarlo como
  // context — sin eso, este panel comparaba contra la Biblia principal
  // (congelada), no contra lo que el usuario esté leyendo en la pestaña
  // Biblia. Los puntos donde sermonBible cambia de libro/capítulo/versículo
  // llaman a esta función de nuevo cuando el panel está abierto (ver
  // renderSermonBiblePanel y el click de versículo en renderSermonBibleVerses).
  function renderSermonCompare(focus){
    return renderCompare(focus, els.sermonComparePanelToolbar, els.sermonComparePanelBody, 'sermonCompareVersionSelect', activeBibleContext());
  }
  function sermonPanelTitleFor(tab){
    if(tab==='comparar') return t('nav.compararVersiones');
    if(tab==='comentario') return t('comentario.title');
    if(tab==='notas') return t('notas.title');
    if(tab==='mapas') return 'Mapas bíblicos';
    if(tab==='predicas') return t('predicas.title');
    if(tab==='diccionario') return t('nav.diccionario');
    return '';
  }
  function renderSermonSidePanel(tab){
    if(els.sermonPanelTitle) els.sermonPanelTitle.textContent = sermonPanelTitleFor(tab);
    // Notas y Mis prédicas no tienen toolbar propio y nunca lo limpian (en
    // #sidePanel eso lo hacía siempre renderPanel antes de despachar) — sin
    // esto, el toolbar de la pestaña anterior (ej. el <select> de
    // comentarista) queda pegado arriba al cambiar de pestaña dentro de este
    // panel. Los demás (comparar/comentario/mapas) igual fijan el suyo, así
    // que este reset previo es redundante pero inofensivo para ellos.
    panelToolbarEl().innerHTML='';
    if(tab==='comparar') renderSermonCompare(activeVerse());
    else if(tab==='comentario') renderPanel('comentario');
    else if(tab==='notas') renderNotes();
    else if(tab==='mapas') renderMapsPanel();
    else if(tab==='predicas') renderPredicasPanel();
    else if(tab==='diccionario') renderPanel('diccionario');
  }
  function isSermonSidePanelOpen(){
    return !!els.sermonComparePanel?.classList.contains('sermon-compare-panel--open');
  }
  function openSermonSidePanel(tab){
    if(sermonPanelTab==='diccionario' && tab!=='diccionario') closeStrongPopup();
    sermonPanelTab = tab;
    sermonPanelTarget = { title: els.sermonPanelTitle, toolbar: els.sermonComparePanelToolbar, body: els.sermonComparePanelBody };
    els.sermonComparePanel?.classList.add('sermon-compare-panel--open');
    els.tabs.forEach(btn=>{ if(SERMON_SIDE_PANEL_TABS.includes(btn.dataset.tab)) btn.classList.toggle('tab-rail__btn--active', btn.dataset.tab===tab); });
    renderSermonSidePanel(tab);
  }
  function closeSermonSidePanel(){
    if(sermonPanelTab==='diccionario') closeStrongPopup();
    els.sermonComparePanel?.classList.remove('sermon-compare-panel--open');
    els.tabs.forEach(btn=>{ if(SERMON_SIDE_PANEL_TABS.includes(btn.dataset.tab)) btn.classList.remove('tab-rail__btn--active'); });
    sermonPanelTab = null;
    sermonPanelTarget = null;
  }
  function toggleSermonSidePanel(tab){
    sermonPanelTab===tab ? closeSermonSidePanel() : openSermonSidePanel(tab);
  }
  els.sermonComparePanelClose?.addEventListener('click', closeSermonSidePanel);

  function openCrossref(ref){
    xrefTarget=ref; xrefData=null;
    openPanel('comparar');
  }

  // ── Modo Preparación de Bosquejo/Estudio ───────────────────────────────────

  async function toggleSermonMode(){
    sermonMode = !sermonMode;
    if(!sermonMode) closeSermonSidePanel(); // no arrastrar el panel abierto a la próxima vez que entre a modo sermón
    selectedVerses.clear();
    document.querySelectorAll('.verse--selected').forEach(x=>x.classList.remove('verse--selected'));
    updateActionBar();
    els.sermonToggle?.classList.toggle('sermon-mode-toggle--active', sermonMode);
    els.sermonToggle?.setAttribute('aria-pressed', String(sermonMode));
    document.body.classList.toggle('sermon-mode', sermonMode);
    if(els.readingPane) els.readingPane.hidden = sermonMode;
    if(els.editorPane) els.editorPane.hidden = !sermonMode;
    if(sermonMode) await initSermonEditor();
    if(data) renderChapter(activeVerse());
    if(activeTab) renderPanel(activeTab);
  }

  // ── Divisores arrastrables entre paneles (modo Predicación) ────────────────
  // Redimensionan #sidePanel ("Biblia") y #sermonComparePanel ("Comentario")
  // fijando --sermon-bible-panel-w / --sermon-compare-panel-w en :root (ver
  // style.css, "Divisores arrastrables entre paneles"). .editor-pane nunca se
  // toca directamente: al ser flex:1 absorbe el espacio que le sobra o le
  // falta a los paneles vecinos.
  const SERMON_PANEL_MIN = 260; // px — por debajo de esto un panel deja de ser útil
  const SERMON_EDITOR_MIN = 320; // px — debe coincidir con .editor-pane{min-width} en style.css
  const rootStyle = document.documentElement.style;

  function clampNum(n,min,max){ return Math.min(Math.max(n,min), Math.max(min,max)); }

  function loadSavedPanelWidth(key){
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && n>0 ? n : null;
  }
  (function applySavedSermonPanelWidths(){
    const bibleW = loadSavedPanelWidth('verbo:sermonPanelWidth:biblia');
    if(bibleW) rootStyle.setProperty('--sermon-bible-panel-w', bibleW+'px');
    const compareW = loadSavedPanelWidth('verbo:sermonPanelWidth:comentario');
    if(compareW) rootStyle.setProperty('--sermon-compare-panel-w', compareW+'px');
  })();

  function sermonRailsWidth(){
    const rail1 = document.querySelector('.library-rail')?.getBoundingClientRect().width || 0;
    const rail2 = document.querySelector('.tab-rail')?.getBoundingClientRect().width || 0;
    return rail1 + rail2;
  }

  // Soporta mouse y touch con la misma lógica (onMove.start/move/end reciben
  // dx en px desde el punto donde empezó el arrastre).
  function wireResizeDrag(handle, onMove){
    if(!handle) return;
    let dragging=false, startX=0;
    const pointerX = e => e.touches ? e.touches[0].clientX : e.clientX;
    function start(e){
      dragging=true; startX=pointerX(e);
      handle.classList.add('sermon-resize-handle--dragging');
      document.body.style.userSelect='none';
      onMove.start?.();
      e.preventDefault();
    }
    function move(e){
      if(!dragging) return;
      onMove.move(pointerX(e)-startX);
      e.preventDefault();
    }
    function end(){
      if(!dragging) return;
      dragging=false;
      handle.classList.remove('sermon-resize-handle--dragging');
      document.body.style.userSelect='';
      onMove.end?.();
    }
    handle.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    handle.addEventListener('touchstart', start, {passive:false});
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
  }

  // Divisor 1 (editor ↔ Biblia): solo mueve el panel Biblia — el editor
  // (flex:1) cede o recupera espacio automáticamente.
  let dragStartBibleW=0;
  wireResizeDrag(els.sermonResizeHandle1, {
    start(){ dragStartBibleW = els.side.getBoundingClientRect().width; },
    move(dx){
      const compareOpen = els.sermonComparePanel?.classList.contains('sermon-compare-panel--open');
      const compareW = compareOpen ? els.sermonComparePanel.getBoundingClientRect().width : 0;
      const appBodyW = document.querySelector('.app-body')?.getBoundingClientRect().width || 0;
      const handlesW = (els.sermonResizeHandle1.getBoundingClientRect().width) + (compareOpen ? els.sermonResizeHandle2.getBoundingClientRect().width : 0);
      const available = appBodyW - sermonRailsWidth() - handlesW - compareW;
      const maxBibleW = Math.max(SERMON_PANEL_MIN, available - SERMON_EDITOR_MIN);
      const newW = clampNum(dragStartBibleW - dx, SERMON_PANEL_MIN, maxBibleW);
      rootStyle.setProperty('--sermon-bible-panel-w', newW+'px');
    },
    end(){
      const w = parseFloat(rootStyle.getPropertyValue('--sermon-bible-panel-w'));
      if(Number.isFinite(w)) localStorage.setItem('verbo:sermonPanelWidth:biblia', String(Math.round(w)));
    }
  });

  // Divisor 2 (Biblia ↔ Comentario): mueve ambos paneles en sentido opuesto,
  // manteniendo constante la suma de sus anchos (el editor no participa).
  let dragStartLeftW=0, dragStartRightW=0;
  wireResizeDrag(els.sermonResizeHandle2, {
    start(){
      dragStartLeftW = els.side.getBoundingClientRect().width;
      dragStartRightW = els.sermonComparePanel.getBoundingClientRect().width;
    },
    move(dx){
      const total = dragStartLeftW + dragStartRightW;
      const newLeftW = clampNum(dragStartLeftW + dx, SERMON_PANEL_MIN, total - SERMON_PANEL_MIN);
      const newRightW = total - newLeftW;
      rootStyle.setProperty('--sermon-bible-panel-w', newLeftW+'px');
      rootStyle.setProperty('--sermon-compare-panel-w', newRightW+'px');
    },
    end(){
      const leftW = parseFloat(rootStyle.getPropertyValue('--sermon-bible-panel-w'));
      const rightW = parseFloat(rootStyle.getPropertyValue('--sermon-compare-panel-w'));
      if(Number.isFinite(leftW)) localStorage.setItem('verbo:sermonPanelWidth:biblia', String(Math.round(leftW)));
      if(Number.isFinite(rightW)) localStorage.setItem('verbo:sermonPanelWidth:comentario', String(Math.round(rightW)));
    }
  });

  els.sermonToggle?.addEventListener('click', toggleSermonMode);

  // ── Editor de texto (TinyMCE autoalojado, cargado vía CDN) ─────────────────

  // El toolbar de TinyMCE usa toolbar_mode:'sliding' (una sola fila con botón
  // "»" para el resto) en vez de envolverse en varias filas — importante en
  // paneles angostos (modo Predicación con 2-3 paneles) para no comerse
  // espacio vertical del editor. Igual medimos su alto real para que la barra
  // de Guardar/Exportar (sticky) se pegue justo debajo sin taparlo ni dejar hueco.
  if(els.editorToolbar && els.editorPane){
    const syncToolbarHeight = ()=>{
      els.editorPane.style.setProperty('--editor-toolbar-h', els.editorToolbar.offsetHeight + 'px');
    };
    new ResizeObserver(syncToolbarHeight).observe(els.editorToolbar);
    syncToolbarHeight();
  }

  function loadScriptOnce(src){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[data-src="${src}"]`);
      if(existing){ existing.addEventListener('load',()=>resolve()); existing.addEventListener('error',()=>reject(new Error('No se pudo cargar '+src))); return; }
      const script=document.createElement('script');
      script.src=src; script.async=true; script.dataset.src=src;
      script.addEventListener('load',()=>resolve());
      script.addEventListener('error',()=>reject(new Error('No se pudo cargar '+src)));
      document.head.appendChild(script);
    });
  }

  async function initSermonEditor(){
    if(sermonEditor) return sermonEditor;
    if(!els.editorSurface) return null;
    try{
      const editorLang = window.VerboI18n?.getUiLang() === 'es' ? 'es' : 'en';
      if(!window.tinymce) await loadScriptOnce('https://cdn.jsdelivr.net/npm/tinymce@7.9.3/tinymce.min.js');
      if(editorLang === 'es') await loadScriptOnce('https://cdn.jsdelivr.net/npm/tinymce-i18n@26.7.13/langs7/es.js');
      await new Promise((resolve,reject)=>{
        window.tinymce.init({
          target: els.editorSurface,
          inline: true,
          license_key: 'gpl',
          language: editorLang === 'es' ? 'es' : undefined,
          menubar: false,
          statusbar: false,
          branding: false,
          promotion: false,
          plugins: 'lists link table',
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | align | bullist numlist outdent indent | link table removeformat',
          toolbar_mode: 'sliding',
          fixed_toolbar_container_target: els.editorToolbar,
          toolbar_persist: true,
          // Menú propio de clic derecho desactivado: sin esto, TinyMCE lo reemplaza
          // por uno reducido (solo "Link..." del plugin de enlaces) sin Cortar/Copiar/
          // Pegar. Con contextmenu:false se usa el menú nativo del navegador.
          contextmenu: false,
          init_instance_callback: editor=>{
            sermonEditor=editor;
            if(sermonEditorContent) editor.setContent(sermonEditorContent);
            // Cierra el buscador propio de la prédica en cualquier cambio de
            // contenido: los resultados guardan referencias directas a nodos
            // de texto (ver sermonSearchMatches) que quedarían apuntando a
            // posiciones equivocadas si el usuario sigue escribiendo.
            editor.on('input change undo redo', ()=>{ sermonEditorContent=editor.getContent(); closeSermonSearchResults(); });
            resolve();
          }
        });
      });
    }catch(error){
      console.error('No se pudo cargar el editor de texto', error);
      els.editorSurface.innerHTML = emptyState('⚠️','No se pudo cargar el editor de texto. Verifica tu conexión a internet.');
    }
    return sermonEditor;
  }

  // ── Exportar el bosquejo (Word y PDF, sin backend ni librerías nuevas) ─────

  function sermonDocTitle(){
    const h1 = sermonEditor?.getBody()?.querySelector('h1');
    return h1?.textContent?.trim() || 'Bosquejo';
  }

  function sermonFileSlug(title){
    return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'') || 'bosquejo';
  }

  function exportSermonToWord(){
    if(!sermonEditor) return;
    const title = sermonDocTitle();
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHTML(title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;} h1{font-size:22pt;} h2{font-size:16pt;} table,td,th{border:1px solid #999;border-collapse:collapse;padding:4px;}</style>
</head><body>${sermonEditor.getContent()}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sermonFileSlug(title)}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function exportSermonToPDF(){
    if(!sermonEditor) return;
    const previousTitle = document.title;
    document.title = sermonDocTitle();
    document.body.classList.add('sermon-print-mode');
    const cleanup = ()=>{
      document.body.classList.remove('sermon-print-mode');
      document.title = previousTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  els.editorPane?.querySelector('#exportWordBtn')?.addEventListener('click', exportSermonToWord);
  els.editorPane?.querySelector('#exportPdfBtn')?.addEventListener('click', exportSermonToPDF);

  // ── Buscador propio de la prédica actual (no busca en la Biblia ni en
  // comentarios) — pensado para saltar dentro de un bosquejo largo sin
  // depender de que el usuario haya estructurado el texto con encabezados
  // ni del Ctrl+F del navegador, que no sabe hacer scroll dentro de un
  // panel angosto ni resaltar temporalmente. Ver informe de evaluación de
  // opciones (índice de encabezados vs. este buscador) en el resumen de
  // la tarea.
  const SERMON_SEARCH_DIACRITICS = { 'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u','ñ':'n' };
  // Solo pliega minúsculas/tildes, char-por-char — a propósito NO usa
  // normalize('NFD') como el resto de la app (ver normalizeSemanticText):
  // acá los índices resultantes se usan para cortar el texto ORIGINAL
  // (Range.setStart/setEnd sobre el nodo real), así que necesitan la MISMA
  // longitud que el texto sin plegar carácter a carácter, cosa que NFD no
  // garantiza en todos los casos.
  function foldSermonSearchText(value){
    return String(value||'').toLowerCase().replace(/[áéíóúüñ]/g, ch => SERMON_SEARCH_DIACRITICS[ch]);
  }

  // Busca dentro de los nodos de texto reales del editor (TreeWalker sobre
  // editor.getBody() — TinyMCE está en modo inline, así que ese body vive en
  // el `document` de la página, no en un iframe aparte). Cada coincidencia
  // guarda el nodo + offsets exactos para poder ubicarla de verdad (no solo
  // el texto plano), y no cruza límites de nodo — una frase partida a la
  // mitad por una negrita/cursiva no aparece como coincidencia única; ver
  // limitación documentada en el resumen de la tarea.
  function sermonSearchMatches(rawQuery, limit=6){
    if(!sermonEditor) return [];
    const query = foldSermonSearchText(String(rawQuery||'').trim());
    if(query.length<2) return [];
    const body = sermonEditor.getBody();
    if(!body) return [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => (node.nodeValue && node.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const matches = [];
    let node;
    while((node = walker.nextNode())){
      const text = node.nodeValue;
      const folded = foldSermonSearchText(text);
      let from = 0, idx;
      while((idx = folded.indexOf(query, from)) !== -1){
        const start = idx, end = idx + query.length;
        const ctxStart = Math.max(0, start - 28);
        const ctxEnd = Math.min(text.length, end + 28);
        matches.push({
          node, start, end,
          before: (ctxStart > 0 ? '…' : '') + text.slice(ctxStart, start),
          hit: text.slice(start, end),
          after: text.slice(end, ctxEnd) + (ctxEnd < text.length ? '…' : '')
        });
        if(matches.length >= limit) return matches;
        from = end;
      }
    }
    return matches;
  }

  function closeSermonSearchResults(){
    if(!els.predicaBuscarResults) return;
    els.predicaBuscarResults.hidden = true;
    els.predicaBuscarResults.innerHTML = '';
  }

  // Resalta la coincidencia elegida SIN dejarla marcada en el contenido
  // guardado: envuelve el rango en un <mark data-mce-bogus="1"> (TinyMCE
  // excluye siempre los nodos "bogus" de editor.getContent(), aunque el
  // usuario guarde justo en ese instante) dentro de undoManager.ignore()
  // (no genera un paso de deshacer ni ensucia el documento), y lo retira
  // solo después de un momento.
  function flashSermonSearchHit(match){
    if(!sermonEditor || !match?.node?.isConnected) return;
    try{
      const rng = document.createRange();
      rng.setStart(match.node, match.start);
      rng.setEnd(match.node, match.end);
      const mark = document.createElement('mark');
      mark.className = 'predica-search-hit';
      mark.setAttribute('data-mce-bogus', '1');
      sermonEditor.undoManager.ignore(() => { rng.surroundContents(mark); });
      mark.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => {
        sermonEditor.undoManager.ignore(() => {
          const parent = mark.parentNode;
          if(!parent) return;
          while(mark.firstChild) parent.insertBefore(mark.firstChild, mark);
          parent.removeChild(mark);
          parent.normalize();
        });
      }, 1500);
    }catch(error){ console.warn('No se pudo resaltar la coincidencia en la prédica', error); }
  }

  function renderSermonSearchResults(matches){
    if(!els.predicaBuscarResults) return;
    if(!matches.length){
      els.predicaBuscarResults.innerHTML = `<div class="editor-pane__search-empty">${t('predicas.buscarSinResultados')}</div>`;
      els.predicaBuscarResults.hidden = false;
      return;
    }
    els.predicaBuscarResults.innerHTML = matches.map((m,i) =>
      `<button type="button" class="editor-pane__search-hit" data-hit="${i}">${escapeHTML(m.before)}<mark>${escapeHTML(m.hit)}</mark>${escapeHTML(m.after)}</button>`
    ).join('');
    els.predicaBuscarResults.hidden = false;
    els.predicaBuscarResults.querySelectorAll('[data-hit]').forEach(btn => {
      // mousedown, no click: dispara antes de que el input pierda foco y el
      // handler de "blur" (más abajo) vacíe la lista.
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        flashSermonSearchHit(matches[Number(btn.dataset.hit)]);
      });
    });
  }

  let sermonSearchDebounce = null;
  els.predicaBuscarInput?.addEventListener('input', () => {
    clearTimeout(sermonSearchDebounce);
    const query = els.predicaBuscarInput.value;
    if(query.trim().length < 2){ closeSermonSearchResults(); return; }
    sermonSearchDebounce = setTimeout(() => renderSermonSearchResults(sermonSearchMatches(query)), 250);
  });
  els.predicaBuscarInput?.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    els.predicaBuscarInput.value = '';
    closeSermonSearchResults();
    els.predicaBuscarInput.blur();
  });
  els.predicaBuscarInput?.addEventListener('blur', () => {
    // Retraso corto: el mousedown de un resultado (ver renderSermonSearchResults)
    // necesita alcanzar a dispararse antes de que la lista desaparezca.
    setTimeout(closeSermonSearchResults, 150);
  });

  // ── Guardar (persistencia real de la prédica: local + push inmediato) ─────
  // Única vía de guardado hoy: no hay autoguardado por inactividad ni botón
  // "Salir" todavía (confirmado con Juan 2026-08-01) — mientras tanto, si el
  // pastor recarga sin haber tocado "Guardar", el contenido en el editor se
  // pierde (sermonEditorContent es solo memoria volátil).
  function setSermonSaveBtnState(state){
    const btn = document.getElementById('guardarSermonBtn');
    if(!btn) return;
    const labels = { idle:t('predicas.guardarBtn'), saving:t('predicas.guardandoBtn'), syncing:t('predicas.sincronizandoBtn'), saved:t('predicas.guardadoBtn') };
    btn.textContent = labels[state] || labels.idle;
    btn.disabled = state==='saving' || state==='syncing';
  }
  async function handleSaveSermon(){
    const btn = document.getElementById('guardarSermonBtn');
    if(!sermonEditor || btn?.disabled) return;
    setSermonSaveBtnState('saving');
    try{
      const contenido = sermonEditor.getContent();
      const tituloInput = document.getElementById('predicaTituloInput');
      const saved = VerboBackup.savePredica({ id: currentPredicaId, titulo: tituloInput?.value || '', contenido, pasaje_base: '' });
      currentPredicaId = saved.id;
      if(tituloInput && !tituloInput.value) tituloInput.value = saved.titulo;
      if(window.VerboSync?.isLinked?.()){
        const result = await VerboSync.forcePush().catch(error=>{ console.warn('[sermon] no se pudo forzar la sincronización', error); return { synced:false, reason:'error' }; });
        if(result?.reason === 'pending-initial-pull'){
          setSermonSaveBtnState('syncing');
          await new Promise(resolve=>setTimeout(resolve, 900));
        }
      }
    } finally {
      setSermonSaveBtnState('saved');
      setTimeout(()=>setSermonSaveBtnState('idle'), 1500);
      if(sermonPanelTab==='predicas') renderPredicasPanel();
    }
  }
  els.editorPane?.querySelector('#guardarSermonBtn')?.addEventListener('click', handleSaveSermon);

  // ── Panel "Mis prédicas" (guardar/abrir/eliminar, modo sermón) ─────────────

  function newPredica(){
    if(!sermonEditor) return;
    currentPredicaId = null;
    sermonEditorContent = '';
    sermonEditor.setContent('');
    const tituloInput = document.getElementById('predicaTituloInput');
    if(tituloInput) tituloInput.value = '';
    closeSermonSidePanel();
  }

  function openPredica(id){
    const p = VerboBackup.getPredica(id);
    if(!p || !sermonEditor) return;
    currentPredicaId = p.id;
    sermonEditorContent = p.contenido || '';
    sermonEditor.setContent(sermonEditorContent);
    const tituloInput = document.getElementById('predicaTituloInput');
    if(tituloInput) tituloInput.value = p.titulo || '';
    closeSermonSidePanel();
  }

  function deletePredicaWithConfirm(id){
    const p = VerboBackup.getPredica(id);
    if(!p) return;
    if(!window.confirm(t('predicas.eliminarConfirm'))) return;
    VerboBackup.deletePredica(id);
    if(currentPredicaId === id) currentPredicaId = null;
    renderPredicasPanel();
  }

  function renderPredicasPanel(){
    panelTitleEl().textContent = t('predicas.title');
    const list = VerboBackup.getPredicas();
    const locale = window.VerboI18n?.getUiLang() === 'en' ? 'en-US' : 'es-ES';
    const fmtDate = (iso) => { try{ return iso ? new Date(iso).toLocaleDateString(locale, {day:'numeric',month:'short',year:'numeric'}) : ''; } catch { return ''; } };
    panelBodyEl().innerHTML = `
      <button type="button" class="predicas-panel__new" id="predicasNewBtn">${t('predicas.nuevaBtn')}</button>
      ${list.length ? list.map(p=>`
        <div class="predicas-list__item" data-predica-id="${p.id}">
          <div class="predicas-list__info">
            <p class="predicas-list__title">${escapeHTML(p.titulo || '')}</p>
            <span class="predicas-list__date">${fmtDate(p.fecha_edicion)}</span>
          </div>
          <div class="predicas-list__actions">
            <button type="button" class="predicas-list__btn" data-open-predica="${p.id}">${t('predicas.abrirBtn')}</button>
            <button type="button" class="predicas-list__btn predicas-list__btn--danger" data-delete-predica="${p.id}">${t('predicas.eliminarBtn')}</button>
          </div>
        </div>`).join('') : emptyState('📝', t('predicas.vacio'))}
    `;
    document.getElementById('predicasNewBtn')?.addEventListener('click', newPredica);
    panelBodyEl().querySelectorAll('[data-open-predica]').forEach(btn=>btn.addEventListener('click', ()=>openPredica(btn.dataset.openPredica)));
    panelBodyEl().querySelectorAll('[data-delete-predica]').forEach(btn=>btn.addEventListener('click', ()=>deletePredicaWithConfirm(btn.dataset.deletePredica)));
  }

  // ── "Notas de Historia" (Tarea 3): notas + marcadores combinados de Historia
  // de la Iglesia y Padres Apostólicos. El buscador filtra la lista en vivo en
  // vez de un dropdown de predicción aparte — la lista de un usuario es chica
  // (sus propias notas), así que filtrar la lista misma da el mismo resultado
  // práctico con menos UI que mantener. ──
  let historiaNotasQuery='';
  let historiaNotasOpenNoteId=null; // id de la nota en vista de detalle (null = lista)
  function historiaNotasContextoLabel(item){
    const c=item.contexto;
    if(c?.obra && c?.capitulo) return `${c.obra} — ${c.capitulo}`;
    return item.ubicacion?.tipo==='padres' ? t('padres.title') : t('historia.title');
  }
  function historiaNotasMatches(item, displayTitle, query){
    if(!query) return true;
    const haystack=normalizeSearchText(`${displayTitle} ${historiaNotasContextoLabel(item)} ${htmlToPlainText(item.texto||'')}`);
    return normalizeSearchText(query).split(/\s+/).filter(Boolean).every(word=>haystack.includes(word));
  }
  function historiaNotasOpen(tipo, ref){
    if(tipo==='padres'){
      const lastDash=ref.lastIndexOf('-');
      patristicMode='docs'; // la nota/marcador apunta a documento+sección, no al modo "por versículo"
      patristicOpenDoc=ref.slice(0,lastDash);
      patristicOpenSection=Number(ref.slice(lastDash+1));
      patristicDocData=null;
      openPanel('padres');
    } else {
      churchHistoryOpenId=ref;
      churchHistoryOpenFromShelf=true;
      openPanel('historia');
    }
  }
  function historiaNotasRowHTML(item, kind){
    const displayTitle=item.titulo || historiaNotasContextoLabel(item);
    const snippet=kind==='nota' ? htmlToPlainText(item.texto||'').slice(0,140) : historiaNotasContextoLabel(item);
    return `<div class="predicas-list__item" data-historia-nota-id="${escapeHTML(item.id)}" data-historia-nota-kind="${kind}" data-historia-nota-tipo="${escapeHTML(item.ubicacion.tipo)}" data-historia-nota-ref="${escapeHTML(item.ubicacion.ref)}">
      <div class="predicas-list__info">
        <p class="predicas-list__title">${kind==='nota'?'✎':'★'} ${escapeHTML(displayTitle)}</p>
        <span class="predicas-list__date">${escapeHTML(snippet)}</span>
      </div>
      <div class="predicas-list__actions">
        <button type="button" class="predicas-list__btn" data-historia-nota-open="1">${t('historiaNotas.abrir')}</button>
        ${kind==='nota'?`<button type="button" class="predicas-list__btn predicas-list__btn--danger" data-historia-nota-delete="1">${t('historiaNotas.eliminarNota')}</button>`:''}
      </div>
    </div>`;
  }
  // Vista de detalle de una nota guardada (Bug 3: "Abrir" mostraba el
  // libro/capítulo completo en vez del contenido de la nota). El link "Ver
  // en contexto" es el único punto que sigue navegando al libro completo,
  // ahora explícito y opcional en vez de ser el comportamiento por defecto.
  function historiaNotaDetailHTML(item){
    const displayTitle=item.titulo || historiaNotasContextoLabel(item);
    const textoHTML=escapeHTML(item.texto||'').replace(/\n/g,'<br>');
    return `<button type="button" class="note-card__copy" id="historiaNotaDetailBack">← ${t('historiaNotas.volver')}</button>
      <article class="dict-entry">
        <div class="dict-entry__term">${escapeHTML(displayTitle)}</div>
        <div class="dict-entry__source">${escapeHTML(historiaNotasContextoLabel(item))}</div>
        <div class="dict-entry__def">${textoHTML}</div>
        <div class="history-entry-actions">
          <button type="button" class="note-card__copy" id="historiaNotaDetailCopy">${t('historiaNotas.copiar')}</button>
          <button type="button" class="note-card__copy" id="historiaNotaDetailContext">${t('historiaNotas.verContexto')}</button>
        </div>
      </article>`;
  }
  function renderHistoriaNotasBody(){
    if(historiaNotasOpenNoteId){
      const item=VerboBackup.getNotaById(historiaNotasOpenNoteId);
      if(item){
        els.panelBody.innerHTML=historiaNotaDetailHTML(item);
        document.getElementById('historiaNotaDetailBack')?.addEventListener('click',()=>{ historiaNotasOpenNoteId=null; renderHistoriaNotasBody(); });
        document.getElementById('historiaNotaDetailCopy')?.addEventListener('click',()=>{
          const titulo=item.titulo?`${item.titulo}\n\n`:'';
          copyToClipboard(`${titulo}${item.texto||''}`);
        });
        document.getElementById('historiaNotaDetailContext')?.addEventListener('click',()=>historiaNotasOpen(item.ubicacion.tipo, item.ubicacion.ref));
        return;
      }
      historiaNotasOpenNoteId=null; // la nota ya no existe (borrada en otra pestaña/sesión) — cae a la lista
    }
    const notas=VerboBackup.getNotas(['historia','padres']);
    const marcadores=VerboBackup.getMarcadores().filter(m=>['historia','padres'].includes(m.ubicacion?.tipo));
    const query=historiaNotasQuery.trim();
    const notasFiltradas=notas.filter(n=>historiaNotasMatches(n, n.titulo||historiaNotasContextoLabel(n), query));
    const marcadoresFiltrados=marcadores.filter(m=>historiaNotasMatches(m, historiaNotasContextoLabel(m), query));
    if(!notas.length && !marcadores.length){ els.panelBody.innerHTML=emptyState('📑',t('historiaNotas.vacio')); return; }
    if(!notasFiltradas.length && !marcadoresFiltrados.length){ els.panelBody.innerHTML=emptyState('🔎',t('historiaNotas.sinResultados',{query:escapeHTML(query)})); return; }
    els.panelBody.innerHTML=`
      ${notasFiltradas.length?`<div class="dictionary-library__count">${escapeHTML(t('historiaNotas.seccionNotas'))} (${notasFiltradas.length})</div><div class="dictionary-library">${notasFiltradas.map(n=>historiaNotasRowHTML(n,'nota')).join('')}</div>`:''}
      ${marcadoresFiltrados.length?`<div class="dictionary-library__count">${escapeHTML(t('historiaNotas.seccionMarcadores'))} (${marcadoresFiltrados.length})</div><div class="dictionary-library">${marcadoresFiltrados.map(m=>historiaNotasRowHTML(m,'marcador')).join('')}</div>`:''}
    `;
    els.panelBody.querySelectorAll('[data-historia-nota-open]').forEach(btn=>{
      const row=btn.closest('[data-historia-nota-ref]');
      if(row.dataset.historiaNotaKind==='nota'){
        btn.addEventListener('click',()=>{ historiaNotasOpenNoteId=row.dataset.historiaNotaId; renderHistoriaNotasBody(); });
      } else {
        btn.addEventListener('click',()=>historiaNotasOpen(row.dataset.historiaNotaTipo, row.dataset.historiaNotaRef));
      }
    });
    els.panelBody.querySelectorAll('[data-historia-nota-delete]').forEach(btn=>{
      const row=btn.closest('[data-historia-nota-ref]');
      btn.addEventListener('click',()=>deleteHistoriaNotaWithConfirm(row.dataset.historiaNotaId));
    });
  }
  function deleteHistoriaNotaWithConfirm(id){
    if(!window.confirm(t('historiaNotas.eliminarNotaConfirm'))) return;
    VerboBackup.deleteNotaById(id);
    renderHistoriaNotasBody();
  }
  function renderHistoriaNotasPanel(){
    els.panelTitle.textContent=t('historiaNotas.title');
    els.panelToolbar.innerHTML=`<input type="search" class="search-panel-input" id="historiaNotasSearch" placeholder="${t('historiaNotas.buscarPlaceholder')}" autocomplete="off" value="${escapeHTML(historiaNotasQuery)}">`;
    document.getElementById('historiaNotasSearch')?.addEventListener('input',e=>{ historiaNotasQuery=e.target.value; historiaNotasOpenNoteId=null; renderHistoriaNotasBody(); });
    renderHistoriaNotasBody();
  }

  // Control de nota embebido en la vista de lectura de Padres Apostólicos
  // (ver historiaNotasOpen/renderHistoriaNotasBody arriba, que abre directo a
  // esta misma vista). Historia de la Iglesia usaba este mismo componente en
  // modo "solo marcador" hasta que se quitó el botón de marcador (sin uso
  // real) — Historia ya no lo llama.
  function historiaNotaControlHTML(tipo, ref){
    const existing=VerboBackup.getNotaObj(ref, tipo);
    return `<div class="history-note-control">
      <details class="history-note-control__details"${existing?.texto?' open':''}>
        <summary>${t('notas.title')}</summary>
        <input type="text" class="editor-pane__title-input" id="historiaNotaTitulo" placeholder="${t('historiaNotas.tituloPlaceholder')}" value="${escapeHTML(existing?.titulo||'')}">
        <textarea id="historiaNotaTexto" class="personal-note-form__area" placeholder="${t('historiaNotas.notaPlaceholder')}">${escapeHTML(existing?.texto||'')}</textarea>
        <div class="personal-note-form__status" id="historiaNotaStatus">${existing?.texto?t('historiaNotas.guardado'):''}</div>
      </details>
    </div>`;
  }
  function wireHistoriaNotaControl(tipo, ref, contexto){
    const tituloInput=document.getElementById('historiaNotaTitulo');
    const textoArea=document.getElementById('historiaNotaTexto');
    const status=document.getElementById('historiaNotaStatus');
    let timer;
    const save=()=>{
      VerboBackup.setNota(ref, textoArea.value, { tipo, titulo: tituloInput.value, contexto });
      if(status) status.textContent=t('historiaNotas.guardado');
    };
    const scheduleSave=()=>{ if(status) status.textContent=t('historiaNotas.escribiendo'); clearTimeout(timer); timer=setTimeout(save,400); };
    textoArea?.addEventListener('input',scheduleSave);
    tituloInput?.addEventListener('input',scheduleSave);
  }

  // ── Panel lateral "Biblia" del modo sermón (con historial de referencias) ──

  function initSermonBibleState(){
    if(sermonBible) return;
    sermonBible = { book:currentBook, chapter:currentChapter, version:currentVersion, chapterCount:null, data:null, history:[], future:[], activeVerse:null };
  }

  // En modo sermón, Comentario debe seguir el libro/capítulo/versículo de la pestaña
  // Biblia (sermonBible), no el de la Biblia principal (que queda oculta/congelada).
  function commentaryContext(){
    if(sermonMode && sermonBible?.data) return { data: sermonBible.data, activeVerseN: sermonBible.activeVerse };
    return { data, activeVerseN: activeVerse() };
  }

  async function sermonRefreshChapterCount(){
    const info = await VerboModules.getBookInfo(sermonBible.book);
    sermonBible.chapterCount = info.chapterCount;
    if(sermonBible.chapter > info.chapterCount) sermonBible.chapter = info.chapterCount;
  }

  async function loadSermonBibleData(){
    sermonBible.data = await VerboModules.buildChapterData({bookId: sermonBible.book, chapter: sermonBible.chapter, bibleId: sermonBible.version, commentaryId: currentCommentary});
    if(!sermonBible.data.versions[sermonBible.version]){
      try{ await ensureVersionLoaded(sermonBible.version, {targetData: sermonBible.data, bookId: sermonBible.book, chapter: sermonBible.chapter}); }
      catch(error){ console.warn(error); sermonBible.version = sermonBible.data.meta.version; }
    }
  }

  function sermonBibleToolbarHtml(){
    const books = catalog.books.map(b=>`<option value="${b.id}" ${b.id===sermonBible.book?'selected':''}>${escapeHTML(b.name)}</option>`).join('');
    const chapters = Array.from({length: sermonBible.chapterCount||1}, (_,i)=>`<option value="${i+1}" ${i+1===sermonBible.chapter?'selected':''}>${i+1}</option>`).join('');
    const versions = bibleCatalog().map(v=>`<option value="${v.id}" ${v.id===sermonBible.version?'selected':''}>${escapeHTML(v.label)}</option>`).join('');
    return `<div class="sermon-bible-toolbar">
      <select class="sermon-bible-toolbar__select" id="sermonBookSelect" aria-label="Libro">${books}</select>
      <select class="sermon-bible-toolbar__select" id="sermonChapterSelect" aria-label="Capítulo">${chapters}</select>
      <select class="sermon-bible-toolbar__select" id="sermonVersionSelect" aria-label="Versión">${versions}</select>
      <div class="sermon-bible-toolbar__nav">
        <button type="button" class="sermon-bible-toolbar__navbtn" id="sermonBibleBack" title="Atrás" ${sermonBible.history.length?'':'disabled'}>‹</button>
        <button type="button" class="sermon-bible-toolbar__navbtn" id="sermonBibleForward" title="Adelante" ${sermonBible.future.length?'':'disabled'}>›</button>
      </div>
    </div>`;
  }

  function wireSermonBibleToolbar(){
    document.getElementById('sermonBookSelect')?.addEventListener('change', async e=>{
      sermonBible.book=e.target.value; sermonBible.chapter=1; sermonBible.chapterCount=null; sermonBible.activeVerse=null;
      await renderSermonBiblePanel();
    });
    document.getElementById('sermonChapterSelect')?.addEventListener('change', async e=>{
      sermonBible.chapter=Number(e.target.value); sermonBible.activeVerse=null;
      await renderSermonBiblePanel();
    });
    document.getElementById('sermonVersionSelect')?.addEventListener('change', async e=>{
      sermonBible.version=e.target.value;
      await loadSermonBibleData();
      els.panelToolbar.innerHTML=sermonBibleToolbarHtml();
      wireSermonBibleToolbar();
      renderSermonBibleVerses();
    });
    document.getElementById('sermonBibleBack')?.addEventListener('click', sermonGoBack);
    document.getElementById('sermonBibleForward')?.addEventListener('click', sermonGoForward);
  }

  async function renderSermonBiblePanel(focusVerse=null){
    els.panelTitle.textContent='Biblia';
    initSermonBibleState();
    // Se recalcula SIEMPRE que haga falta (no solo cuando cambia de capítulo):
    // una referencia cruzada al mismo capítulo pone chapterCount en null sin
    // que needsLoad se active, y si esto quedara adentro del "if(needsLoad)"
    // el selector de capítulo del toolbar se queda con un solo option falso.
    if(sermonBible.chapterCount==null || sermonBible.data?.meta?.bookId!==sermonBible.book) await sermonRefreshChapterCount();
    const needsLoad = !sermonBible.data || sermonBible.data.meta.bookId!==sermonBible.book || sermonBible.data.meta.chapter!==sermonBible.chapter;
    if(needsLoad){
      selectedVerses.clear();
      updateActionBar();
      els.panelToolbar.innerHTML=sermonBibleToolbarHtml();
      wireSermonBibleToolbar();
      els.panelBody.innerHTML=emptyState('⌛','Cargando pasaje…');
      await loadSermonBibleData();
    }
    els.panelToolbar.innerHTML=sermonBibleToolbarHtml();
    wireSermonBibleToolbar();
    renderSermonBibleVerses(focusVerse);
    if(sermonPanelTab==='comparar') renderSermonCompare(sermonBible.activeVerse);
    else if(sermonPanelTab==='comentario') renderPanel('comentario');
  }

  function renderSermonBibleVerses(focusVerse=null){
    const version = sermonBible.version;
    if(focusVerse) sermonBible.activeVerse = focusVerse;
    const container = document.createElement('div');
    container.className = 'sermon-bible-verses';
    sermonBible.data.verses.forEach(v=>{
      const row=document.createElement('div'); row.className='verse'; row.dataset.verseN=v.n;
      if(v.n===focusVerse) row.classList.add('verse--active');
      const num=document.createElement('span'); num.className='verse__num'; num.textContent=v.n;
      const text=document.createElement('span'); text.className='verse__text'; text.tabIndex=0;
      const segments=v.segments?.[version];
      if(segments?.length){
        segments.forEach((seg,index)=>{
          const word=document.createElement('span'); word.className='word-segment'; word.textContent=(index?' ':'')+(seg.text||'');
          text.appendChild(word);
          const codes=[...(seg.strong?[seg.strong]:[]),...(Array.isArray(seg.strongs)?seg.strongs:[])].filter((c,p,all)=>c&&all.indexOf(c)===p);
          codes.forEach(code=>{ const tag=document.createElement('button'); tag.type='button'; tag.className='strongs-tag'; tag.textContent=code; tag.dataset.strongCode=code; text.appendChild(tag); });
        });
      } else text.textContent = v.text[version] || Object.values(v.text)[0] || '';
      row.append(num,text);
      container.appendChild(row);
      text.querySelectorAll('.strongs-tag').forEach(tag=>tag.addEventListener('click',e=>{ e.stopPropagation(); openDictionary(tag.dataset.strongCode); }));
      if((v.crossrefs||[]).length){
        const xrefRow=document.createElement('div'); xrefRow.className='verse__xrefs';
        v.crossrefs.slice(0,10).forEach(ref=>{
          const chip=document.createElement('button');
          chip.type='button'; chip.className='verse__xref-chip'; chip.textContent=ref.label;
          chip.title=`Ver referencia cruzada: ${ref.label}`;
          chip.addEventListener('click',(e)=>{ e.stopPropagation(); sermonNavigateToXref(ref); });
          xrefRow.appendChild(chip);
        });
        container.appendChild(xrefRow);
      }
      text.addEventListener('click',()=>{
        document.querySelectorAll('.sermon-bible-verses .verse--active').forEach(x=>x.classList.remove('verse--active'));
        row.classList.add('verse--active');
        sermonBible.activeVerse = v.n;
        if(selectedVerses.has(v.n)) selectedVerses.delete(v.n); else selectedVerses.add(v.n);
        row.classList.toggle('verse--selected', selectedVerses.has(v.n));
        updateActionBar();
        if(sermonPanelTab==='comparar') renderSermonCompare(v.n);
        else if(sermonPanelTab==='comentario') renderPanel('comentario');
      });
    });
    els.panelBody.innerHTML='';
    els.panelBody.appendChild(container);
    if(focusVerse) container.querySelector(`[data-verse-n="${focusVerse}"]`)?.scrollIntoView({block:'center'});
  }

  // Guarda también el versículo activo de origen (no solo libro/capítulo/versión):
  // una referencia cruzada frecuentemente apunta al MISMO capítulo (ej. Mt 18:21→Mt
  // 18:15) — sin el versículo, "volver" no tenía nada que restaurar y parecía no
  // responder aunque el historial sí se movía internamente.
  function sermonPushHistory(){
    sermonBible.history.push({book:sermonBible.book, chapter:sermonBible.chapter, version:sermonBible.version, verse:sermonBible.activeVerse});
    if(sermonBible.history.length>10) sermonBible.history.shift();
    sermonBible.future=[];
  }

  async function sermonNavigateToXref(ref){
    sermonPushHistory();
    sermonBible.book=ref.book; sermonBible.chapter=ref.chapter; sermonBible.chapterCount=null;
    await renderSermonBiblePanel(ref.verseStart);
  }

  async function sermonGoBack(){
    if(!sermonBible.history.length) return;
    sermonBible.future.push({book:sermonBible.book, chapter:sermonBible.chapter, version:sermonBible.version, verse:sermonBible.activeVerse});
    if(sermonBible.future.length>10) sermonBible.future.shift();
    const prev=sermonBible.history.pop();
    sermonBible.book=prev.book; sermonBible.chapter=prev.chapter; sermonBible.version=prev.version;
    sermonBible.chapterCount=null; sermonBible.activeVerse=null;
    await renderSermonBiblePanel(prev.verse);
  }

  async function sermonGoForward(){
    if(!sermonBible.future.length) return;
    sermonBible.history.push({book:sermonBible.book, chapter:sermonBible.chapter, version:sermonBible.version, verse:sermonBible.activeVerse});
    if(sermonBible.history.length>10) sermonBible.history.shift();
    const next=sermonBible.future.pop();
    sermonBible.book=next.book; sermonBible.chapter=next.chapter; sermonBible.version=next.version;
    sermonBible.chapterCount=null; sermonBible.activeVerse=null;
    await renderSermonBiblePanel(next.verse);
  }

  // El buscador semántico usa una Biblia base fija para encontrar referencias
  // (Biblia Verbo en español, BSB en inglés — ver semanticSearch.basePaths en
  // module-loader.js), pero abrir un resultado NUNCA debe cambiar la Biblia
  // que el usuario está leyendo: solo navega al libro/capítulo/versículo
  // encontrado y lo muestra en `currentVersion`, sea cual sea.
  async function openSearchResult(r){
    currentBook=r.bookId; currentChapter=r.chapter;
    els.book.value=currentBook; await refreshChapters(); els.chapter.value=String(currentChapter); await loadPassage();
    openPanel('buscar');
    const row=document.querySelector(`[data-verse-n="${r.verse}"]`);
    if(row){ document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active')); row.classList.add('verse--active'); row.scrollIntoView({behavior:'smooth',block:'center'}); }
  }

  // La lista de resultados debe mostrar el texto en la Biblia ACTIVA del
  // usuario, no en la Biblia base del índice — salvo que la activa sea
  // remota (API.Bible), donde traer el texto de hasta ~90 resultados
  // dispararía demasiadas peticiones y podría chocar con el límite de la
  // API; en ese caso se deja el texto de la Biblia base como vista previa
  // (marcado con previewSource) y se resuelve a la Biblia real recién al
  // abrir un resultado puntual (openSearchResult ya usa currentVersion).
  async function resolveResultsToActiveVersion(results, versionId, previewLabel){
    const active=bibleCatalog().find(v=>v.id===versionId);
    if(!active || active.remote){ results.forEach(r=>{ r.previewSource=previewLabel; }); return results; }
    const chapterCache=new Map();
    const getChapterVerses=(bookId,chapter)=>{
      const key=`${bookId}.${chapter}`;
      if(!chapterCache.has(key)) chapterCache.set(key, VerboModules.loadBible(active.path, bookId, chapter).then(raw=>raw?.verses||null).catch(()=>null));
      return chapterCache.get(key);
    };
    await Promise.all(results.map(async r=>{
      if(r.chapterStart!==r.chapterEnd) return;
      const verses=await getChapterVerses(r.bookId, r.chapterStart);
      if(!verses) return;
      const parts=[];
      for(let v=r.verseStart; v<=r.verseEnd; v++){
        const raw=verses[String(v)];
        const text=raw==null ? null : (typeof raw==='string' ? raw : raw.text);
        if(!text){ parts.length=0; break; }
        parts.push(r.verseEnd>r.verseStart ? `${v}. ${text}` : text);
      }
      if(parts.length) r.text=parts.join(' ');
    }));
    return results;
  }

  function renderSavedSearchResults(){
    if(!searchState?.results?.length) return;
    const {results, scopeLabel, semantic}=searchState;
    const pageSize=semantic ? 30 : 100;
    let page=searchState.page || 0;
    const totalPages=Math.ceil(results.length/pageSize);
    const start=page*pageSize;
    const end=Math.min(start+pageSize,results.length);
    const visible=results.slice(start,end);
    els.panelBody.innerHTML=`
      <div class="search-summary">
        <strong>${t('busqueda.resultadosCount',{count:results.length})}</strong>
        <span>${t('busqueda.mostrando',{scope:escapeHTML(scopeLabel),start:start+1,end})}</span>
      </div>
      <div class="search-results-list">
        ${visible.map((r,i)=>`<button class="search-result" type="button" data-result="${start+i}"><span class="search-result__ref">${escapeHTML(r.book)} ${r.chapter}:${r.verse}${r.verseEnd && r.verseEnd!==r.verse ? `-${r.verseEnd}` : ''}${semantic ? ` · ${(r.score*100).toFixed(1)}%` : ''}${r.previewSource ? ` · ${escapeHTML(t('busqueda.vistaPrevia',{fuente:r.previewSource}))}` : ''}</span><span class="search-result__text">${escapeHTML(r.text)}</span></button>`).join('')}
      </div>
      <nav class="search-pagination" aria-label="${t('busqueda.paginasAria')}">
        <button class="search-page-button" id="searchPrevPage" type="button" ${page===0?'disabled':''}>${t('busqueda.anterior')}</button>
        <span class="search-page-status">${t('busqueda.paginaEstado',{page:page+1,total:totalPages})}</span>
        <button class="search-page-button" id="searchNextPage" type="button" ${page>=totalPages-1?'disabled':''}>${t('busqueda.siguiente')}</button>
      </nav>`;
    els.panelBody.querySelectorAll('.search-result').forEach(btn=>btn.addEventListener('click',()=>openSearchResult(results[Number(btn.dataset.result)])));
    document.getElementById('searchPrevPage')?.addEventListener('click',()=>{ if(page>0){ searchState.page=page-1; renderSavedSearchResults(); els.panelBody.scrollTop=0;} });
    document.getElementById('searchNextPage')?.addEventListener('click',()=>{ if(page<totalPages-1){ searchState.page=page+1; renderSavedSearchResults(); els.panelBody.scrollTop=0;} });
  }

  function renderSearch(){
    els.panelTitle.textContent=t('busqueda.title');
    // "Perícopas" (bloques de ~6 versículos) es el modo por defecto porque el
    // modelo de embeddings da una similitud mucho más confiable a bloques con
    // contexto que a versículos sueltos muy cortos, que suelen quedar mal
    // rankeados (ver evaluación con "chisme": el versículo correcto quedaba
    // en el puesto ~9500/31000, pero la perícopa correcta en el puesto ~400/5700).
    const saved = searchState || { query:'', indexType:'pericopes', results:[], page:0, scopeLabel:t('busqueda.scopeInicial'), semantic:true };
    els.panelToolbar.innerHTML=`<form class="search-panel-form" id="searchForm">
      <input id="searchInput" class="search-panel-input" type="search" minlength="2" placeholder="${t('busqueda.placeholder')}" autocomplete="off" value="${escapeHTML(saved.query)}">
      <select id="searchIndexType" class="search-panel-select" aria-label="${t('busqueda.tipoIndiceAria')}">
        <option value="pericopes" ${saved.indexType!=='verses'?'selected':''}>${t('busqueda.bloques')}</option>
        <option value="verses" ${saved.indexType==='verses'?'selected':''}>${t('busqueda.versiculoIndividual')}</option>
      </select>
      <button class="search-panel-button" type="submit">${t('busqueda.boton')}</button>
    </form>`;
    els.panelBody.innerHTML=emptyState('⌕',t('busqueda.intro'));

    const form=document.getElementById('searchForm');
    const input=document.getElementById('searchInput');
    const indexTypeSelect=document.getElementById('searchIndexType');

    const clearWhenChanged=()=>{
      const q=input.value.trim();
      const indexType=indexTypeSelect.value;
      if(searchState && (q!==searchState.query || indexType!==searchState.indexType)){
        searchState=null;
        els.panelBody.innerHTML=q.length?emptyState('⌕',t('busqueda.pulsaBuscar')):emptyState('⌕',t('busqueda.minCaracteres'));
      }
    };

    input?.addEventListener('input', clearWhenChanged);
    indexTypeSelect?.addEventListener('change', clearWhenChanged);

    if(searchState?.results?.length) renderSavedSearchResults();
    setTimeout(()=>input?.focus(),0);

    form?.addEventListener('submit',async e=>{
      e.preventDefault();
      const query=input.value.trim();
      const indexType=indexTypeSelect.value === 'pericopes' ? 'pericopes' : 'verses';
      if(query.length<2){ searchState=null; els.panelBody.innerHTML=emptyState('⌕',t('busqueda.minCaracteres')); return; }
      // Una referencia directa ("Juan 3:16", "Jn 3 16", "Romanos 8", "John 3:16")
      // no necesita búsqueda semántica: se navega directo, sin gastar una
      // consulta al modelo (ver Fase 9 del pedido de auditoría del buscador).
      const directRef=parseSearchReference(query);
      if(directRef){
        searchState=null;
        closePanel();
        await goToBibleReference(directRef);
        return;
      }
      const lang=contentLang();
      const indexSourceLabel=lang==='en' ? 'BSB' : 'Biblia Verbo';
      els.panelBody.innerHTML=emptyState('⌛',t('busqueda.preparando'));
      try{
        const stageText={index:t('busqueda.stageIndex'),model:t('busqueda.stageModel'),embedding:t('busqueda.stageEmbedding'),ranking:t('busqueda.stageRanking')};
        let results=await VerboModules.searchSemanticBible(query,{
          indexType,
          limit:90,
          lang,
          onProgress:p=>{els.panelBody.innerHTML=emptyState('⌛',stageText[p.stage] || t('busqueda.buscando'));}
        });
        results=await resolveResultsToActiveVersion(results, currentVersion, indexSourceLabel);
        const scopeLabel=t('busqueda.scopeDinamica',{tipo:t(indexType==='pericopes'?'busqueda.tipoPericopas':'busqueda.tipoVersiculos')});
        searchState={query, indexType, results, page:0, scopeLabel, semantic:true};
        if(!results.length){ els.panelBody.innerHTML=emptyState('🔎',t('busqueda.sinResultados',{query:escapeHTML(query)})); return; }
        renderSavedSearchResults();
      }catch(error){ console.error(error); els.panelBody.innerHTML=emptyState('⚠️',t('busqueda.errorBusqueda')); }
    });
  }

  function applyTheme(themeId){
    const safeTheme = themes.some(t => t.id === themeId) ? themeId : 'paper';
    document.body.dataset.theme = safeTheme;
    localStorage.setItem('verbo:theme', safeTheme);
  }

  let syncPending = false;
  let syncBusy = false;

  function renderSyncSection(){
    if (!window.VerboSync) {
      return `<div class="ajustes-section">
        <h3>${t('ajustes.syncTitle')}</h3>
        <p>${t('ajustes.syncDescripcion')}</p>
      </div>`;
    }
    if (VerboSync.isLinked()) {
      return `<div class="ajustes-section">
        <h3>${t('ajustes.syncTitle')}</h3>
        <p>${t('ajustes.syncLinkedMsg',{email:escapeHTML(VerboSync.getEmailMasked())})}</p>
        <button class="ajustes-backup-btn" type="button" id="ajustesUnlinkBtn">${t('ajustes.syncUnlinkBtn')}</button>
      </div>`;
    }
    return `<div class="ajustes-section">
      <h3>${t('ajustes.syncTitle')}</h3>
      <p>${t('ajustes.syncDescripcion')}</p>
      <form class="ajustes-sync-form" id="ajustesSyncForm">
        <input class="ajustes-sync-form__input" type="email" id="ajustesSyncEmail" placeholder="${t('ajustes.syncPlaceholder')}" required ${syncBusy?'disabled':''}>
        <button class="ajustes-sync-form__btn" type="submit" ${syncBusy?'disabled':''}>${t('ajustes.syncBtn')}</button>
      </form>
      ${syncPending?`<p class="ajustes-sync-pending">${t('ajustes.syncPendingMsg')}</p>`:''}
    </div>`;
  }

  function renderAjustes(){
    els.panelTitle.textContent=t('ajustes.titulo');
    els.panelToolbar.innerHTML='';
    const currentTheme = document.body.dataset.theme || 'paper';
    els.panelBody.innerHTML=`
      <section class="ajustes-panel">
        ${renderSyncSection()}
        <div class="ajustes-section">
          <h3>${t('ajustes.temaTitle')}</h3>
          <p>${t('ajustes.temaDescripcion')}</p>
          <div class="theme-options">
            ${themes.map(th=>`<button class="theme-option${th.id===currentTheme?' theme-option--active':''}" type="button" data-theme="${th.id}">
              <span class="theme-option__sample" style="background:${th.sample}"></span>
              <span class="theme-option__label">${escapeHTML(t('ajustes.temas.' + th.id))}</span>
            </button>`).join('')}
          </div>
        </div>
        <div class="ajustes-section">
          <h3>${t('ajustes.exportTitle')}</h3>
          <p>${t('ajustes.exportDescripcion')}</p>
          <div class="ajustes-backup-actions">
            <button class="ajustes-backup-btn" type="button" id="ajustesExportBtn">${t('ajustes.exportarBtn')}</button>
            <button class="ajustes-backup-btn" type="button" id="ajustesImportBtn">${t('ajustes.importarBtn')}</button>
            <input type="file" id="ajustesImportInput" accept="application/json" hidden>
          </div>
        </div>
      </section>`;
    els.panelBody.querySelectorAll('.theme-option').forEach(btn=>btn.addEventListener('click',()=>{
      applyTheme(btn.dataset.theme);
      renderAjustes();
    }));
    document.getElementById('ajustesExportBtn')?.addEventListener('click', ()=>{
      VerboBackup.exportDownload();
      toast(t('toast.descargando'));
    });
    const importInput=document.getElementById('ajustesImportInput');
    document.getElementById('ajustesImportBtn')?.addEventListener('click', ()=> importInput?.click());
    importInput?.addEventListener('change', async ()=>{
      const file=importInput.files?.[0];
      if(!file) return;
      try{ await VerboBackup.importFromFile(file); toast(t('toast.datosImportados')); setTimeout(()=>location.reload(), 900); }
      catch(error){ console.error(error); toast(t('toast.noImportar')); }
      importInput.value='';
    });
    document.getElementById('ajustesSyncForm')?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email=document.getElementById('ajustesSyncEmail')?.value.trim();
      if(!email || syncBusy) return;
      syncBusy=true; renderAjustes();
      try{ await VerboSync.requestLink(email); syncPending=true; }
      catch(error){ console.error(error); toast(t('toast.errorSync')); }
      syncBusy=false; renderAjustes();
    });
    document.getElementById('ajustesUnlinkBtn')?.addEventListener('click', async ()=>{
      await VerboSync.unlink();
      syncPending=false;
      renderAjustes();
    });
  }


  function referenceCoversVerse(entry, verseNumber){
    if(!verseNumber) return false;
    const ref = entry.reference || {};
    const chStart = Number(ref.chapterStart ?? currentChapter);
    const chEnd = Number(ref.chapterEnd ?? chStart);
    if(currentChapter < chStart || currentChapter > chEnd) return false;
    let start = Number(ref.verseStart);
    let end = Number(ref.verseEnd ?? ref.verseStart);
    if(!Number.isInteger(start) || start <= 0) start = 1;
    if(!Number.isInteger(end) || end <= 0) end = start;
    if(currentChapter > chStart) start = 1;
    if(currentChapter < chEnd) end = 999;
    return verseNumber >= start && verseNumber <= end;
  }

  function renderLinkedResourceEntries(resource, entries, focus, emptyIcon='📚', emptyText=t('linked.sinEntradas'), manifestPath=null){
    if(!entries.length){ els.panelBody.innerHTML=emptyState(emptyIcon, emptyText); return; }
    els.panelBody.innerHTML=entries.map((entry,index)=>{
      const id=entry.id || `${resource.manifest.id}-${currentBook}-${currentChapter}-${index}`;
      const title=entry.title || `${resource.manifest.name}: ${entry.reference?.verseStart || currentChapter}`;
      const body=entry.content || entry.excerpt || entry.html || entry.definition || entry.data || '';
      const active = referenceCoversVerse(entry, focus) ? ' note-card--active' : '';
      // Entradas de "biblioteca" tipo articulo (ver modules/library/biblioteca-verbo) traen
      // un excerpt corto + articleId en vez del contenido completo, para no duplicar articulos
      // largos en cada verso que citan. El boton carga el articulo completo bajo demanda.
      const readFullBtn = (entry.articleId && manifestPath)
        ? `<button class="note-card__copy" type="button" data-read-full="${index}">${t('linked.leerCompleto')}</button>`
        : '';
      return `<div class="note-card${active}" data-linked-id="${escapeHTML(id)}" data-linked-index="${index}">
        <div class="note-card__ref">${escapeHTML(data.meta.book)} ${data.meta.chapter}${entry.reference?.verseStart ? ':'+escapeHTML(entry.reference.verseStart) : ''}</div>
        <div class="note-card__title" data-linked-title="${index}">${escapeHTML(title)}</div>
        <div class="note-card__author" data-linked-author="${index}">${escapeHTML(entry.author || resource.manifest.name)}</div>
        <button class="note-card__copy" type="button" data-copy-linked="${index}">${t('linked.copiar')}</button>
        ${readFullBtn}
        <div class="note-card__body" data-linked-body="${index}">${body}</div>
      </div>`;
    }).join('');
    translateLinkedResourceEntries(resource, entries, focus);
    els.panelBody.querySelectorAll('[data-copy-linked]').forEach(btn=>btn.addEventListener('click',()=>{
      const entry=entries[Number(btn.dataset.copyLinked)];
      if(!entry) return;
      const body=entry.content || entry.excerpt || entry.html || entry.definition || entry.data || '';
      copyToClipboard(`${entry.title || resource.manifest.name}\n${String(body).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`);
    }));
    els.panelBody.querySelectorAll('[data-read-full]').forEach(btn=>btn.addEventListener('click', async ()=>{
      const entry=entries[Number(btn.dataset.readFull)];
      const bodyEl=els.panelBody.querySelector(`[data-linked-body="${btn.dataset.readFull}"]`);
      if(!entry || !bodyEl) return;
      if(btn.dataset.expanded==='1'){
        bodyEl.innerHTML=entry.excerpt || entry.content || '';
        btn.textContent=t('linked.leerCompleto');
        btn.dataset.expanded='0';
        return;
      }
      btn.textContent=t('linked.cargando'); btn.disabled=true;
      try{
        const article=await VerboModules.loadLinkedArticle(manifestPath, entry.articleId);
        bodyEl.innerHTML=article?.content || entry.excerpt || '';
        btn.textContent=t('linked.verExtracto');
        btn.dataset.expanded='1';
      }catch(error){
        console.error(error);
        btn.textContent=t('linked.errorArticulo');
      }finally{ btn.disabled=false; }
    }));
    if(focus){
      const target=[...els.panelBody.querySelectorAll('[data-linked-index]')].find(card=>referenceCoversVerse(entries[Number(card.dataset.linkedIndex)], focus));
      target?.scrollIntoView({block:'start'});
    }
  }

  // Traducción automática de recursos "enlazados por versículo" (Padres
  // Apostólicos en modo fragmento, Biblioteca, Exégesis) — antes solo el
  // panel "Comentario" y "Padres Apostólicos" en modo documento traducían
  // automáticamente; esta vista compartida se había quedado siempre en el
  // idioma original de la fuente (normalmente español) sin importar el
  // idioma de interfaz. Mismo patrón que applyCommentaryTranslation/
  // applyPatristicTranslation: título/autor vía translateCommentaryHeader,
  // cuerpo vía translateEntry, con caché en localStorage.
  async function translateLinkedResourceEntries(resource, entries, focus=null){
    const source=resource.manifest.language;
    const target=contentLang();
    if(!source || source===target) return;
    const focusIndex=focus ? entries.findIndex(entry=>referenceCoversVerse(entry, focus)) : -1;
    const order=[...entries.keys()].sort((a,b)=>(a===focusIndex?-1:0)-(b===focusIndex?-1:0));
    for(const index of order){
      const entry=entries[index];
      const id=entry.id || `${resource.manifest.id}-${currentBook}-${currentChapter}-${index}`;
      const titleEl=els.panelBody.querySelector(`[data-linked-title="${index}"]`);
      if(titleEl && titleEl.dataset.translated!==target && entry.title){
        titleEl.dataset.translated='pending';
        const translatedTitle=await translateCommentaryHeader(id,'title',entry.title,source,target);
        if(titleEl.dataset.translated==='pending'){ titleEl.textContent=translatedTitle; titleEl.dataset.translated=target; }
      }
      const authorEl=els.panelBody.querySelector(`[data-linked-author="${index}"]`);
      if(authorEl && authorEl.dataset.translated!==target && entry.author){
        authorEl.dataset.translated='pending';
        const translatedAuthor=await translateCommentaryHeader(id,'author',entry.author,source,target);
        if(authorEl.dataset.translated==='pending'){ authorEl.textContent=translatedAuthor; authorEl.dataset.translated=target; }
      }
      const bodyEl=els.panelBody.querySelector(`[data-linked-body="${index}"]`);
      const body=entry.content || entry.excerpt || entry.html || entry.definition || entry.data || '';
      if(bodyEl && bodyEl.dataset.translated!==target && body){
        bodyEl.dataset.translated='pending';
        const translatedBody=await translateEntry(id, body, source, target);
        if(bodyEl.dataset.translated==='pending'){
          bodyEl.innerHTML=`${translatedBody}${originalSourceDetailsHtml(body,source)}`;
          bodyEl.dataset.translated=target;
        }
      }
    }
  }

  const bibleNameAliases = {
    GEN:['gen','genesis','génesis','gn'], EXO:['exo','exodo','éxodo','ex'], LEV:['lev','levitico','levítico','lv'], NUM:['num','numeros','números','nm'], DEU:['deu','deuteronomio','dt'],
    JOS:['jos','josue','josué'], JDG:['jdg','jue','jueces'], RUT:['rut','rt'], '1SA':['1sa','1 sam','1sam','1 s'], '2SA':['2sa','2 sam','2sam','2 s'], '1KI':['1re','1 rey','1rey','1 r'], '2KI':['2re','2 rey','2rey','2 r'],
    '1CH':['1cr','1 cro','1cro'], '2CH':['2cr','2 cro','2cro'], EZR:['esd','esdras'], NEH:['neh','nehemias','nehemías'], EST:['est','ester'], JOB:['job'], PSA:['sal','salmo','salmos'], PRO:['pro','prov','proverbios','pr'], ECC:['ecl','ec','eclesiastes','eclesiastés'], SNG:['cnt','cant','cantares'],
    ISA:['isa','is','isaias','isaías'], JER:['jer','jeremias','jeremías'], LAM:['lam','lamentaciones','lm'], EZK:['eze','ez','ezequiel'], DAN:['dan','dn','daniel'], HOS:['hos','ose','oseas'], JOL:['joe','jl','joel'], AMO:['amo','am','amos'], OBA:['abd','abdias','abdías'], JON:['jon','jonas','jonás'], MIC:['miq','mi','miqueas'], NAM:['nah','nam','nahum'], HAB:['hab','habacuc'], ZEP:['sof','sofonias','sofonías'], HAG:['hag','ageo'], ZEC:['zac','zec','zacarias','zacarías'], MAL:['mal','malaquias','malaquías'],
    MAT:['mat','mt','mateo'], MRK:['mar','mc','mr','marcos'], LUK:['luc','lc','lu','lucas'], JHN:['jua','jn','juan'], ACT:['hch','hech','hechos'], ROM:['rom','ro','roman','romanos'], '1CO':['1co','1 cor','1cor','1 corintios'], '2CO':['2co','2 cor','2cor','2 corintios'], GAL:['gal','gál','galatas','gálatas'], EPH:['efe','ef','efesios'], PHP:['fil','flp','filipenses'], COL:['col','colosenses'], '1TH':['1ts','1 tes','1tes','1 tesalonicenses'], '2TH':['2ts','2 tes','2tes','2 tesalonicenses'], '1TI':['1ti','1 tim','1tim','1 timoteo'], '2TI':['2ti','2 tim','2tim','2 timoteo'], TIT:['tit','tito'], PHM:['flm','film','filemon','filemón'], HEB:['heb','hebreos'], JAS:['stg','sant','santiago'], '1PE':['1pe','1 ped','1ped','1 p','1 pedro'], '2PE':['2pe','2 ped','2ped','2 p','2 pedro'], '1JN':['1jn','1 jn','1 juan'], '2JN':['2jn','2 jn','2 juan'], '3JN':['3jn','3 jn','3 juan'], JUD:['jud','judas'], REV:['ap','apo','apoc','apocalipsis']
  };
  function normalizeBibleName(value){ return String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[._]/g,' ').replace(/\s+/g,' ').trim(); }
  function parseBibleReference(text){
    const clean=normalizeBibleName(text).replace(/[;,)]$/,'');
    const m=clean.match(/^(.+?)\s+(\d+)\s*:\s*(\d+)/);
    if(!m)return null;
    const alias=normalizeBibleName(m[1]);
    const bookId=Object.keys(bibleNameAliases).find(id=>bibleNameAliases[id].some(a=>normalizeBibleName(a)===alias));
    return bookId?{bookId,chapter:Number(m[2]),verse:Number(m[3])}:null;
  }
  async function goToBibleReference(ref){
    currentBook=ref.bookId; currentChapter=ref.chapter;
    els.book.value=currentBook; await refreshChapters(); els.chapter.value=String(currentChapter);
    await loadPassage();
    const row=document.querySelector(`[data-verse-n="${ref.verse}"]`);
    if(row){ document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active')); row.classList.add('verse--active'); row.scrollIntoView({behavior:'smooth',block:'center'}); }
  }
  // Alias en inglés de los mismos libros — solo para reconocer referencias
  // directas escritas en inglés en el buscador (parseSearchReference), no
  // reemplaza bibleNameAliases (que sigue siendo español, usado por los
  // enlaces "a.bible" generados por comentarios/diccionarios).
  const bibleNameAliasesEn = {
    GEN:['gen','genesis'], EXO:['exo','exodus','ex'], LEV:['lev','leviticus','lv'], NUM:['num','numbers','nm'], DEU:['deu','deut','deuteronomy','dt'],
    JOS:['jos','josh','joshua'], JDG:['jdg','judg','judges'], RUT:['rut','ruth','ru'], '1SA':['1sa','1 sam','1sam','1 samuel'], '2SA':['2sa','2 sam','2sam','2 samuel'],
    '1KI':['1ki','1 kgs','1kgs','1 kings'], '2KI':['2ki','2 kgs','2kgs','2 kings'], '1CH':['1ch','1 chr','1chr','1 chronicles'], '2CH':['2ch','2 chr','2chr','2 chronicles'], EZR:['ezr','ezra'],
    NEH:['neh','nehemiah'], EST:['est','esther'], JOB:['job'], PSA:['psa','ps','psalm','psalms'], PRO:['pro','prov','proverbs'],
    ECC:['ecc','eccl','ecclesiastes'], SNG:['sng','song','song of solomon','songs'], ISA:['isa','isaiah'], JER:['jer','jeremiah'], LAM:['lam','lamentations'],
    EZK:['ezk','eze','ezekiel'], DAN:['dan','daniel'], HOS:['hos','hosea'], JOL:['jol','joel'], AMO:['amo','amos'],
    OBA:['oba','obadiah'], JON:['jon','jonah'], MIC:['mic','micah'], NAM:['nam','nah','nahum'], HAB:['hab','habakkuk'],
    ZEP:['zep','zeph','zephaniah'], HAG:['hag','haggai'], ZEC:['zec','zech','zechariah'], MAL:['mal','malachi'],
    MAT:['mat','matt','matthew'], MRK:['mrk','mark'], LUK:['luk','luke'], JHN:['jhn','john'], ACT:['act','acts'],
    ROM:['rom','romans'], '1CO':['1co','1 cor','1cor','1 corinthians'], '2CO':['2co','2 cor','2cor','2 corinthians'], GAL:['gal','galatians'], EPH:['eph','ephesians'],
    PHP:['php','phil','philippians'], COL:['col','colossians'], '1TH':['1th','1 thess','1thess','1 thessalonians'], '2TH':['2th','2 thess','2thess','2 thessalonians'],
    '1TI':['1ti','1 tim','1tim','1 timothy'], '2TI':['2ti','2 tim','2tim','2 timothy'], TIT:['tit','titus'], PHM:['phm','philemon'], HEB:['heb','hebrews'],
    JAS:['jas','james'], '1PE':['1pe','1 pet','1pet','1 peter'], '2PE':['2pe','2 pet','2pet','2 peter'], '1JN':['1jn','1 john'], '2JN':['2jn','2 john'], '3JN':['3jn','3 john'],
    JUD:['jud','jude'], REV:['rev','revelation']
  };
  // Reconocimiento de referencia directa para el buscador (Fase 9): más
  // permisivo que parseBibleReference (acepta "Libro C V" sin dos puntos y
  // "Libro C" solo con capítulo) y bilingüe (español + inglés), porque acá
  // el usuario puede escribir "Jn 3 16", "Romanos 8" o "John 3:16" y no debe
  // gastarse una búsqueda semántica en algo que ya es una navegación directa.
  function parseSearchReference(text){
    const clean=String(text||'').toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[._]/g,' ').replace(/\s+/g,' ').trim().replace(/[;,)]$/,'');
    let bookPart, chapter, verse=null;
    let m=clean.match(/^(.+?)\s+(\d+)\s*(?::|\s)\s*(\d+)(?:-\d+)?$/);
    if(m){ bookPart=m[1]; chapter=Number(m[2]); verse=Number(m[3]); }
    else{
      m=clean.match(/^(.+?)\s+(\d+)$/);
      if(!m) return null;
      bookPart=m[1]; chapter=Number(m[2]);
    }
    const alias=normalizeBibleName(bookPart);
    const bookId=Object.keys(bibleNameAliases).find(id=>bibleNameAliases[id].some(a=>normalizeBibleName(a)===alias) || (bibleNameAliasesEn[id]||[]).some(a=>normalizeBibleName(a)===alias));
    return bookId ? {bookId, chapter, verse} : null;
  }
  function wireDictionaryLinks(root){
    root.querySelectorAll('a.strong').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const m=((a.getAttribute('href')||'')+' '+a.textContent).match(/[GH]\d+/i);if(m)openDictionary(m[0].toUpperCase());}));
    root.querySelectorAll('a.bible').forEach(a=>{
      a.title=t('diccionario.abrirPasajeTitle');
      a.addEventListener('click',async e=>{e.preventDefault();const ref=parseBibleReference(a.textContent);if(ref)await goToBibleReference(ref);else toast(t('toast.refNoReconocida'));});
    });
  }
  // ── Historia de la Iglesia (buscador independiente, sin ancla a versículo) ──
  let churchHistoryEntries=null, churchHistoryQuery='', churchHistoryOpenId=null, churchHistoryResultsToken=0, churchHistoryTocToken=0, churchShelfToken=0;
  let churchHistoryActiveFilter=null;
  let churchHistoryTranslatedQuery='', churchHistoryQueryToken=0, churchHistoryQueryDebounce=null;
  let churchHistorySemanticResults=[], churchHistorySemanticQuery='', churchHistorySemanticToken=0, churchHistorySemanticDebounce=null;
  // ── Estante de portadas (landing de Historia): estante -> overlay -> TOC -> lectura.
  // churchHistoryOpenVolume = id del volumen abierto (TOC); churchHistoryOpenFromShelf
  // marca que la entrada actual se abrió desde el TOC (no desde la búsqueda), para que
  // el botón "volver" de renderChurchHistoryEntry sepa a dónde regresar.
  let churchHistoryShelf=null, churchHistoryOpenVolume=null, churchHistoryOpenFromShelf=false, churchHistorySearchActive=false;

  function normalizeSearchText(value){
    return String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }
  function churchHistoryEditDistance(a,b){
    const previous=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      let diagonal=previous[0]; previous[0]=i;
      for(let j=1;j<=b.length;j++){
        const above=previous[j];
        previous[j]=Math.min(previous[j]+1,previous[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));
        diagonal=above;
      }
    }
    return previous[b.length];
  }
  function churchHistoryTokenMatches(token,words){
    if(words.some(word=>word.includes(token)||(word.length>=3&&token.includes(word)))) return true;
    if(token.length<4) return false;
    const tolerance=1;
    return words.some(word=>Math.abs(word.length-token.length)<=tolerance&&churchHistoryEditDistance(token,word)<=tolerance);
  }

  // ── Buscador rápido (autocomplete) — Padres Apostólicos, Historia de la
  // Iglesia y Costumbres y Tradiciones ────────────────────────────────────────
  // Búsqueda de texto simple (substring/fuzzy, sin semántica ni API externa)
  // contra un índice ligero de títulos ya cargado en el cliente. Reutiliza
  // normalizeSearchText/churchHistoryTokenMatches de arriba (genéricos pese al
  // nombre) para el mismo criterio de coincidencia que ya usa la búsqueda de
  // Historia, en vez de inventar uno nuevo. Cada módulo arma su propio índice
  // más abajo (historiaQuickIndex/patristicQuickIndex/costumbresQuickIndex) y
  // llama a wireQuickSearchInput con un getter que lo entrega — síncrono si ya
  // está en memoria (Historia: churchHistoryEntries ya cargado), o una Promise
  // si hay que construirlo bajo demanda (Padres/Costumbres: requiere cargar
  // cada documento/obra la primera vez que el usuario usa el buscador).
  function quickSearchMatches(index, query, limit=8){
    const normalized=normalizeSearchText(query);
    if(normalized.length<2) return [];
    const queryWords=normalized.split(/\s+/).filter(Boolean);
    return index.map((item,i)=>{
      const candidate=normalizeSearchText(item.label);
      const words=candidate.split(/\s+/);
      if(!queryWords.every(word=>candidate.includes(word)||churchHistoryTokenMatches(word,words))) return null;
      const score=candidate.startsWith(normalized)?0:words.some(w=>w.startsWith(normalized))?1:candidate.includes(normalized)?2:3;
      return {item,score,i};
    }).filter(Boolean).sort((a,b)=>a.score-b.score||a.i-b.i).slice(0,limit).map(r=>r.item);
  }
  // item.prefixPart (autor/obra) nunca se traduce — son básicamente nombres
  // propios (Ireneo, Freeman, Tucker) y mezclarlo en el mismo texto a traducir
  // que el título arriesgaba traducciones de baja calidad sobre una cadena
  // bilingüe. Solo item.titlePart (o item.label si el índice no separa
  // prefijo, como Historia) se traduce bajo demanda — ver wireQuickSearchInput.
  function quickSearchDisplayLabel(item){
    if(item.prefixPart==null) return item.displayLabel||item.label;
    return `${item.prefixPart} — ${item.displayTitlePart||item.titlePart}`;
  }
  function renderQuickSearchDropdown(box, matches, onSelect, loadingLabel){
    if(!box) return;
    if(matches==='loading'){
      box.innerHTML=`<span class="history-prediction history-prediction--loading">${escapeHTML(loadingLabel||'')}</span>`;
      box.classList.add('history-predictions--visible');
      return;
    }
    box.innerHTML=matches.map((item,i)=>`<button type="button" class="history-prediction" data-quick-index="${i}">${escapeHTML(quickSearchDisplayLabel(item))}</button>`).join('');
    box.classList.toggle('history-predictions--visible',matches.length>0);
    box.querySelectorAll('[data-quick-index]').forEach(btn=>btn.addEventListener('mousedown',event=>{
      event.preventDefault();
      onSelect(matches[Number(btn.dataset.quickIndex)]);
    }));
  }
  // sourceLang: idioma real del texto de item.label en este índice (fijo por
  // módulo — Padres Apostólicos 'es', Historia/Costumbres 'en'). Si difiere
  // del idioma de interfaz (contentLang()):
  //  1) si escribir en el idioma de interfaz no encuentra nada, se traduce la
  //     consulta al idioma de origen (texto corto, cacheado) y se reintenta —
  //     mismo patrón que scheduleChurchHistoryQueryTranslation, sin el debounce
  //     porque acá es opcional/best-effort, no la ruta principal;
  //  2) los títulos que SÍ se van a mostrar (máximo `limit`, nunca el índice
  //     completo) se traducen bajo demanda para el dropdown — evita traducir
  //     de antemano los 500+ títulos de un módulo que el usuario tal vez ni
  //     busque. Corrige que las predicciones salían siempre en el idioma
  //     original de la fuente sin importar el idioma de interfaz elegido
  //     (bug reportado por Juan, 2026-08-10).
  function wireQuickSearchInput(input, box, getIndex, onSelect, {loadingLabel, sourceLang, moduleId}={}){
    if(!input||!box) return;
    async function translateShownLabels(matches, target){
      if(!sourceLang || sourceLang===target || !matches.length) return;
      await Promise.all(matches.map(async item=>{
        if(item._translatedLang===target) return;
        const key=item.quickKey || item.label;
        const original=item.titlePart!=null ? item.titlePart : item.label;
        const translated=await translateCommentaryHeader(`quicksearch-label:${moduleId}:${key}`,'label',original,sourceLang,target).catch(()=>original);
        if(item.titlePart!=null) item.displayTitlePart=translated; else item.displayLabel=translated;
        item._translatedLang=target;
      }));
    }
    async function run(){
      const query=input.value;
      let index=getIndex();
      if(index instanceof Promise){
        renderQuickSearchDropdown(box,'loading',onSelect,loadingLabel);
        index=await index;
        if(input.value!==query) return; // el usuario ya siguió escribiendo mientras cargaba
      }
      const target=contentLang();
      let matches=quickSearchMatches(index,query);
      if(!matches.length && sourceLang && sourceLang!==target && query.trim().length>=2){
        const translatedQuery=await translateCommentaryHeader(`quicksearch-query:${moduleId}`,'q',query.trim(),target,sourceLang).catch(()=>'');
        if(input.value!==query) return;
        if(translatedQuery) matches=quickSearchMatches(index,translatedQuery);
      }
      await translateShownLabels(matches,target);
      if(input.value!==query) return;
      renderQuickSearchDropdown(box,matches,onSelect);
    }
    input.addEventListener('input',run);
    input.addEventListener('focus',()=>{
      // Precarga el índice al enfocar (si hace falta red) sin mostrar el
      // dropdown todavía — para cuando el usuario termine de escribir 2
      // letras, el índice ya suele estar listo.
      const maybeIndex=getIndex();
      if(maybeIndex instanceof Promise) maybeIndex.catch(()=>{});
      if(input.value) run();
    });
    input.addEventListener('blur',()=>setTimeout(()=>box.classList.remove('history-predictions--visible'),120));
  }

  // Las 6 épocas de "Historia de la Iglesia" (taxonomía confirmada por Juan,
  // 2026-08-01) — id interno (usado en entries.json) → etiqueta corta ES,
  // en el mismo orden cronológico que CHURCH_HISTORY_EPOCA_ORDER.
  const CHURCH_HISTORY_EPOCA_LABELS={
    iglesia_primitiva: 'Iglesia primitiva',
    era_patristica: 'Era patrística',
    edad_media: 'Edad Media',
    reforma: 'Reforma',
    puritanos_post_reforma: 'Puritanos y post-Reforma',
    iglesia_moderna: 'Iglesia moderna',
  };

  // Texto de búsqueda de una entrada: personaje(s)/evento(s)/periodo (metadata
  // editorial) + etiqueta de época + título + cuerpo completo (texto real de
  // la fuente) — así el buscador funciona como texto completo real aunque
  // personas/eventos no estén poblados para una entrada (evita depender de
  // una extracción automática de entidades que podría etiquetar mal un lugar
  // como persona, por ejemplo), y un chip de época encuentra TODAS las
  // entradas de esa época (la etiqueta queda embebida en cada una).
  // Se cachea en el propio objeto (calculado una sola vez por entrada).
  function churchHistorySearchText(e){
    if(e._searchText==null){
      const parts=[...(e.personas||[]),...(e.eventos||[]),e.periodo||'',CHURCH_HISTORY_EPOCA_LABELS[e.epoca]||e.epoca||'',e.sourceLabel||'',e.sourceName||'',e.concilio||'',e.tipo||'',e.numero||'',e.title||'',htmlToPlainText(e.content||e.excerpt||'')];
      e._searchText=normalizeSearchText(parts.join(' '));
    }
    return e._searchText;
  }

  // Coincidencia por texto (ver churchHistorySearchText) o por año/rango numérico
  // contra anioInicio/anioFin — cualquiera de los dos que matchee incluye la
  // entrada, no hace falta que el usuario indique qué tipo de dato está buscando.
  // El texto fuente (título/cuerpo) está en inglés — un hispanohablante que
  // busque "persecución" no encontraría nada aunque el capítulo hable del tema
  // en inglés. `extraQuery` es la traducción al inglés de la búsqueda (ver
  // scheduleChurchHistoryQueryTranslation) y se combina con la búsqueda literal
  // para cubrir ambos casos sin tener que traducir las 581 entradas de antemano.
  function churchHistorySearchMatches(entries, rawQuery){
    const raw=String(rawQuery||'').trim();
    const q=normalizeSearchText(raw);
    if(!q) return [];
    const stopwords=new Set(['a','al','de','del','el','en','la','las','los','of','the','to']);
    const queryTokens=q.split(' ').filter(token=>token.length>1&&!stopwords.has(token));
    const rangeMatch=raw.match(/^(\d{1,4})\s*-\s*(\d{1,4})$/);
    const yearMatch=raw.match(/^(\d{1,4})$/);
    let yearLo=null, yearHi=null;
    if(rangeMatch){ yearLo=Math.min(+rangeMatch[1],+rangeMatch[2]); yearHi=Math.max(+rangeMatch[1],+rangeMatch[2]); }
    else if(yearMatch){ yearLo=yearHi=+yearMatch[1]; }
    return entries.map((e,index)=>{
      const searchText=churchHistorySearchText(e);
      const metadataText=normalizeSearchText([...(e.personas||[]),...(e.eventos||[]),e.periodo||'',CHURCH_HISTORY_EPOCA_LABELS[e.epoca]||e.epoca||'',e.sourceLabel||'',e.sourceName||'',e.concilio||'',e.tipo||'',e.numero||'',e.title||''].join(' '));
      const titleText=normalizeSearchText(e.title||'');
      const exactMatch=searchText.includes(q);
      const metadataWords=metadataText.split(' ');
      const tokenMatch=queryTokens.length>1 && queryTokens.every(token=>searchText.includes(token)||churchHistoryTokenMatches(token,metadataWords));
      let yearMatches=false;
      if(yearLo!=null){
        const eLo=e.anioInicio ?? e.anioFin, eHi=e.anioFin ?? e.anioInicio;
        yearMatches=eLo!=null && eHi!=null && eHi>=yearLo && eLo<=yearHi;
      }
      if(!exactMatch&&!tokenMatch&&!yearMatches) return null;
      let score=exactMatch?20:0;
      queryTokens.forEach(token=>{
        if(searchText.includes(token)) score+=1;
        if(metadataText.includes(token)) score+=6;
        if(titleText.includes(token)) score+=8;
      });
      if(yearMatches) score+=30;
      return {entry:e,score,index};
    }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).map(result=>result.entry);
  }
  function churchHistorySearch(entries, query, extraQuery=''){
    const primary=churchHistorySearchMatches(entries, query);
    if(!extraQuery || normalizeSearchText(extraQuery)===normalizeSearchText(query)) return primary;
    const extra=churchHistorySearchMatches(entries, extraQuery);
    if(!extra.length) return primary;
    const seen=new Set(primary.map(e=>e.id));
    return [...primary, ...extra.filter(e=>!seen.has(e.id))];
  }
  // Traduce la búsqueda ES→EN (con debounce, para no llamar al endpoint de
  // traducción en cada tecla) y vuelve a renderizar cuando resuelve — así una
  // búsqueda en español encuentra coincidencias en el texto fuente en inglés.
  // Se salta números/rangos de año (no tiene sentido traducirlos) y consultas
  // muy cortas. Un token descarta traducciones de búsquedas ya obsoletas.
  function scheduleChurchHistoryQueryTranslation(query){
    clearTimeout(churchHistoryQueryDebounce);
    const token=++churchHistoryQueryToken;
    const trimmed=String(query||'').trim();
    if(contentLang()!=='es' || trimmed.length<3 || /^\d{1,4}(\s*-\s*\d{1,4})?$/.test(trimmed)){
      churchHistoryTranslatedQuery='';
      return;
    }
    churchHistoryQueryDebounce=setTimeout(async ()=>{
      const translated=await translateCommentaryHeader('historia:searchQuery','q',trimmed,'es','en');
      if(token!==churchHistoryQueryToken) return;
      churchHistoryTranslatedQuery=translated||'';
      if(!churchHistoryOpenId) renderChurchHistoryBody();
    }, 400);
  }

  function scheduleChurchHistorySemanticSearch(query){
    clearTimeout(churchHistorySemanticDebounce);
    const token=++churchHistorySemanticToken;
    const trimmed=String(query||'').trim();
    churchHistorySemanticResults=[];
    churchHistorySemanticQuery='';
    if(trimmed.length<3 || /^\d{1,4}(\s*-\s*\d{1,4})?$/.test(trimmed)) return;
    churchHistorySemanticDebounce=setTimeout(async()=>{
      try{
        const ranked=await VerboModules.searchSemanticChurchHistory(trimmed,{limit:100});
        if(token!==churchHistorySemanticToken || churchHistoryActiveFilter) return;
        churchHistorySemanticResults=ranked;
        churchHistorySemanticQuery=trimmed;
        if(!churchHistoryOpenId) renderChurchHistoryBody();
      }catch(error){
        if(token===churchHistorySemanticToken) console.warn('Búsqueda semántica de Historia no disponible; se conserva la búsqueda textual.',error);
      }
    },350);
  }

  // ---- Exploración del panel vacío en dimensiones separadas. ----
  const CHURCH_HISTORY_EPOCA_ORDER=['iglesia_primitiva','era_patristica','edad_media','reforma','puritanos_post_reforma','iglesia_moderna'];
  const CHURCH_HISTORY_TOPIC_ORDER=['persecucion_martirio','concilios_doctrina','herejias_apologetica','iglesia_gobierno','biblia_canon','culto_sacramentos','mision_expansion','iglesia_estado','personajes_biografias','unidad_divisiones','disciplina_vida','milagros_providencia'];
  const CHURCH_HISTORY_FEATURED_YEARS=[64,250,303,313,325,381,431,451];
  const CHURCH_HISTORY_FEATURED_NAMES=['Jesucristo','Pedro','Pablo','Constantino el Grande','Eusebio de Cesarea','Arrio','Atanasio','Cipriano de Cartago'];
  let churchHistorySuggestions={anios:[],temas:[],nombres:[]};
  let churchHistoryPredictiveCandidates=[];
  function romanNumeral(value){
    const table=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let n=value, result='';
    table.forEach(([amount,symbol])=>{ while(n>=amount){ result+=symbol; n-=amount; } });
    return result;
  }
  function churchHistoryBookKey(entry){ return entry.concilio || entry.sourceCollectionLabel || entry.sourceLabel || entry.sourceName || ''; }
  function churchHistoryBookLabel(value){
    const clean=String(value||'').replace(/^Eusebio,\s*/,'');
    return clean==='Cánones Apostólicos'?`⚖ ${clean}`:clean;
  }
  // A diferencia de churchHistoryBookKey (que usa entry.concilio primero y por
  // eso separa Concilios en 9 secciones), esta clave agrupa por el volumen del
  // estante — para Concilios las 9 secciones son subdivisiones DENTRO de una
  // sola portada, no 9 portadas distintas.
  function churchHistoryVolumeKey(entry){ return entry.sourceId || ''; }
  function churchHistoryVolumeEntries(volumeId){
    return (churchHistoryEntries||[]).filter(entry=>churchHistoryVolumeKey(entry)===volumeId);
  }
  // Agrupa preservando el orden narrativo del array (no reordena ni ordena por
  // clave): cada vez que la clave cambia respecto a la entrada anterior abre un
  // grupo nuevo. Así "Los mártires de Palestina" queda intercalado donde
  // Eusebio lo puso realmente, en vez de ir a parar al final de un "grupo
  // apéndice" artificial.
  function churchHistoryGroupByOrder(entries, keyFn){
    const groups=[]; let current=null;
    entries.forEach(entry=>{
      const key=keyFn(entry);
      if(!current || current.key!==key){ current={key, items:[]}; groups.push(current); }
      current.items.push(entry);
    });
    return groups;
  }
  // Quita el prefijo redundante del título ("Church History, Book I, Chapter I — ",
  // "Sócrates Escolástico, Libro 1, Capítulo 1 — ") ya cubierto por el grupo/subgrupo
  // del TOC, y deja solo la parte descriptiva del capítulo.
  function churchHistoryTocRowLabel(entry){
    const parts=String(entry.title||'').split(' — ');
    return parts.length>1 ? parts.slice(1).join(' — ') : entry.title;
  }
  function churchHistoryTocGroups(volumeId, entries){
    if(volumeId==='eusebio-historia-eclesiastica'){
      return churchHistoryGroupByOrder(entries, entry=>{
        const m=/^eusebio-he-l(\d+)-c\d+$/.exec(entry.id);
        return m ? `${t('historia.toc.libro')} ${romanNumeral(Number(m[1]))}` : t('historia.toc.martiresPalestina');
      }).map(g=>({label:g.key, items:g.items}));
    }
    if(volumeId==='eusebio-vida-constantino'){
      return churchHistoryGroupByOrder(entries, entry=>{
        const m=/^eusebio-voc-l(\d+)-c\d+$/.exec(entry.id);
        if(m) return `${t('historia.toc.libro')} ${romanNumeral(Number(m[1]))}`;
        return entry.id.startsWith('constantino-oracion-') ? t('historia.toc.oracionConstantino') : t('historia.toc.oracionEusebio');
      }).map(g=>({label:g.key, items:g.items}));
    }
    if(volumeId==='npnf214-concilios-ecumenicos'){
      return churchHistoryGroupByOrder(entries, entry=>entry.concilio||entry.title).map(g=>({label:churchHistoryBookLabel(g.key), items:g.items}));
    }
    if(volumeId==='npnf2-continuadores'){
      return churchHistoryGroupByOrder(entries, entry=>entry.autor).map(authorGroup=>({
        label: authorGroup.key,
        subgroups: churchHistoryGroupByOrder(authorGroup.items, entry=>`${t('historia.toc.libro')} ${entry.libro}`).map(g=>({label:g.key, items:g.items})),
      }));
    }
    return [{label:'', items:entries}];
  }
  function churchHistorySuggestionGroups(entries){
    const anios=CHURCH_HISTORY_FEATURED_YEARS.filter(year=>entries.some(entry=>{
      const lo=entry.anioInicio??entry.anioFin, hi=entry.anioFin??entry.anioInicio;
      return lo!=null&&hi!=null&&year>=lo&&year<=hi;
    })).map(year=>({label:String(year),type:'anio',value:String(year)}));
    const activeTopics=new Set(entries.flatMap(entry=>entry.temas||[]));
    const temas=CHURCH_HISTORY_TOPIC_ORDER.slice(0,8).filter(value=>activeTopics.has(value))
      .map(value=>({label:t(`historia.temas.${value}`),type:'tema',value}));
    const nombres=CHURCH_HISTORY_FEATURED_NAMES.map(value=>({label:value,type:'query',value}));
    return {anios,temas,nombres};
  }
  function churchHistoryFilterEntries(entries, filter){
    if(!filter) return entries;
    if(filter.type==='epoca') return entries.filter(e=>e.epoca===filter.value);
    if(filter.type==='libro') return entries.filter(e=>churchHistoryBookKey(e)===filter.value);
    if(filter.type==='anio'){
      const year=Number(filter.value);
      return entries.filter(e=>{
        const lo=e.anioInicio??e.anioFin, hi=e.anioFin??e.anioInicio;
        return lo!=null&&hi!=null&&year>=lo&&year<=hi;
      });
    }
    if(filter.type==='siglo'){
      const century=Number(filter.value), lo=(century-1)*100+1, hi=century*100;
      return entries.filter(e=>{
        const eLo=e.anioInicio??e.anioFin, eHi=e.anioFin??e.anioInicio;
        return eLo!=null && eHi!=null && eHi>=lo && eLo<=hi;
      });
    }
    if(filter.type==='tema') return entries.filter(e=>(e.temas||[]).includes(filter.value));
    return entries;
  }

  function buildChurchHistoryPredictiveCandidates(entries){
    const labels=[];
    entries.forEach(entry=>{
      if(entry.concilio) labels.push(`Concilio de ${entry.concilio}`);
      labels.push(...(entry.eventos||[]),...(entry.personas||[]));
    });
    CHURCH_HISTORY_TOPIC_ORDER.forEach(topic=>labels.push(t(`historia.temas.${topic}`)));
    const unique=new Map();
    labels.filter(Boolean).forEach(label=>unique.set(normalizeSearchText(label),label));
    churchHistoryPredictiveCandidates=[...unique.values()];
  }
  function churchHistoryPredictions(query){
    const normalized=normalizeSearchText(query);
    if(normalized.length<2) return [];
    const queryWords=normalized.split(/\s+/).filter(word=>!['a','al','de','del','el','en','la','las','los','of','the','to'].includes(word));
    return churchHistoryPredictiveCandidates.map((label,index)=>{
      const candidate=normalizeSearchText(label),words=candidate.split(/\s+/);
      if(!queryWords.every(word=>churchHistoryTokenMatches(word,words))) return null;
      const score=candidate.startsWith(normalized)?0:words.some(word=>word.startsWith(normalized))?1:candidate.includes(normalized)?2:3;
      return {label,score,index};
    }).filter(Boolean).sort((a,b)=>a.score-b.score||a.index-b.index).slice(0,6);
  }
  function renderChurchHistoryPredictions(query){
    const box=document.getElementById('churchHistoryPredictions');
    if(!box) return;
    const predictions=churchHistoryPredictions(query);
    box.innerHTML=predictions.map(item=>`<button type="button" class="history-prediction" data-history-prediction="${escapeHTML(item.label)}">${escapeHTML(item.label)}</button>`).join('');
    box.classList.toggle('history-predictions--visible',predictions.length>0);
    box.querySelectorAll('[data-history-prediction]').forEach(button=>button.addEventListener('mousedown',event=>{
      event.preventDefault();
      const value=button.dataset.historyPrediction;
      const input=document.getElementById('churchHistorySearchInput');
      if(input) input.value=value;
      churchHistoryQuery=value;
      churchHistoryActiveFilter=null;
      churchHistoryTranslatedQuery='';
      box.classList.remove('history-predictions--visible');
      renderChurchHistoryBody();
      scheduleChurchHistoryQueryTranslation(value);
      scheduleChurchHistorySemanticSearch(value);
    }));
  }

  // Despacho de 4 estados del panel (ver churchHistoryOpenVolume/churchHistoryOpenId/
  // churchHistorySearchActive arriba): A) estante de portadas (landing) — B) TOC de
  // un volumen abierto — C) lectura de una entrada abierta desde el TOC — D) el
  // flujo de búsqueda/chips ya existente, intacto, solo con un link nuevo para
  // volver al estante. B y C también se re-renderizan aquí para que cambiar de tab
  // y volver a "historia" conserve dónde estaba el usuario (no vuelve al estante).
  async function renderChurchHistoryPanel(){
    els.panelTitle.textContent=t('historia.title');
    if(!churchHistoryEntries || !churchHistoryShelf){
      els.panelToolbar.innerHTML='';
      els.panelBody.innerHTML=emptyState('⌛',t('historia.cargando'));
      const [entries,shelf]=await Promise.all([
        churchHistoryEntries ? Promise.resolve(churchHistoryEntries) : VerboModules.loadChurchHistory().catch(error=>{ console.error(error); return []; }),
        churchHistoryShelf ? Promise.resolve(churchHistoryShelf) : VerboModules.loadChurchHistoryShelf().catch(error=>{ console.error(error); return []; }),
      ]);
      churchHistoryEntries=entries;
      churchHistoryShelf=shelf;
    }

    if(!churchHistorySearchActive && !churchHistoryOpenVolume && !churchHistoryOpenId){
      renderChurchHistoryShelfView();
      return;
    }
    if(churchHistoryOpenVolume && !churchHistoryOpenId){
      renderChurchHistoryTOCView(churchHistoryOpenVolume);
      return;
    }
    if(churchHistoryOpenId && churchHistoryOpenFromShelf){
      els.panelToolbar.innerHTML='';
      renderChurchHistoryEntry(churchHistoryOpenId);
      return;
    }

    churchHistorySuggestions=churchHistoryEntries.length?churchHistorySuggestionGroups(churchHistoryEntries):{anios:[],temas:[],nombres:[]};
    buildChurchHistoryPredictiveCandidates(churchHistoryEntries);
    els.panelToolbar.innerHTML=`<button type="button" class="note-card__copy history-back-to-shelf" id="backToChurchHistoryShelfFromSearch">← ${t('historia.volverEstante')}</button>
    <form class="search-panel-form" id="churchHistorySearchForm">
      <div class="history-search-autocomplete"><input id="churchHistorySearchInput" class="search-panel-input" type="search" placeholder="${t('historia.buscarPlaceholder')}" autocomplete="off" value="${escapeHTML(churchHistoryQuery)}"><div id="churchHistoryPredictions" class="history-predictions"></div></div>
    </form>`;
    document.getElementById('backToChurchHistoryShelfFromSearch')?.addEventListener('click',()=>{
      churchHistorySearchActive=false;
      churchHistoryOpenId=null;
      renderChurchHistoryShelfView();
    });
    const input=document.getElementById('churchHistorySearchInput');
    document.getElementById('churchHistorySearchForm')?.addEventListener('submit',e=>e.preventDefault());
    input?.addEventListener('input',()=>{
      churchHistoryQuery=input.value;
      churchHistoryActiveFilter=null;
      churchHistoryTranslatedQuery='';
      churchHistorySemanticResults=[];
      churchHistorySemanticQuery='';
      renderChurchHistoryBody();
      scheduleChurchHistoryQueryTranslation(churchHistoryQuery);
      scheduleChurchHistorySemanticSearch(churchHistoryQuery);
      renderChurchHistoryPredictions(churchHistoryQuery);
    });
    input?.addEventListener('focus',()=>renderChurchHistoryPredictions(input.value));
    input?.addEventListener('blur',()=>setTimeout(()=>document.getElementById('churchHistoryPredictions')?.classList.remove('history-predictions--visible'),120));
    renderChurchHistoryPredictions(churchHistoryQuery);
    renderChurchHistoryBody();
    if(!churchHistoryOpenId) setTimeout(()=>input?.focus(),0);
  }

  // ── Estante de portadas (landing de Historia) ───────────────────────────────
  function churchHistoryShelfItemHTML(volume){
    return `<div class="church-shelf__item" data-shelf-volume="${escapeHTML(volume.id)}" tabindex="0" role="group" aria-label="${escapeHTML(volume.titulo)}">
      <img class="church-shelf__cover" src="${escapeHTML(volume.cover)}" alt="" loading="lazy">
      <div class="church-shelf__title" data-shelf-title="${escapeHTML(volume.id)}">${escapeHTML(volume.titulo)}</div>
      <div class="church-shelf__overlay">
        ${volume.periodo?`<div class="church-shelf__overlay-period" data-shelf-period="${escapeHTML(volume.id)}">${escapeHTML(volume.periodo)}</div>`:''}
        <p class="church-shelf__overlay-summary" data-shelf-summary="${escapeHTML(volume.id)}">${escapeHTML(volume.resumenBreve||'')}</p>
        <button type="button" class="church-shelf__read-btn" data-shelf-read="${escapeHTML(volume.id)}">${t('historia.leer')} →</button>
      </div>
    </div>`;
  }
  function wireChurchHistoryShelf(){
    els.panelBody.querySelectorAll('[data-shelf-volume]').forEach(item=>{
      const toggle=()=>item.classList.toggle('church-shelf__item--active');
      item.addEventListener('click',event=>{ if(event.target.closest('[data-shelf-read]')) return; toggle(); });
      item.addEventListener('keydown',event=>{
        if(event.target.closest('[data-shelf-read]')) return;
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); toggle(); }
      });
    });
    els.panelBody.querySelectorAll('[data-shelf-read]').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      openChurchHistoryVolume(btn.dataset.shelfRead);
    }));
  }
  // Índice del buscador rápido: churchHistoryEntries ya está cargado siempre
  // que se llega al estante (renderChurchHistoryPanel lo carga antes), así
  // que esto es síncrono — se cachea para no reconstruir el array en cada
  // tecla. volumeKey queda precalculado para que seleccionar un resultado
  // pueda abrir directamente el TOC del volumen correcto si el usuario vuelve.
  let historiaQuickIndexCache=null;
  function historiaQuickIndex(){
    if(!historiaQuickIndexCache || historiaQuickIndexCache.length!==(churchHistoryEntries||[]).length){
      historiaQuickIndexCache=(churchHistoryEntries||[]).map(e=>({label:e.title, quickKey:e.id, id:e.id, volumeKey:churchHistoryVolumeKey(e)}));
    }
    return historiaQuickIndexCache;
  }
  function selectHistoriaQuickResult(item){
    churchHistoryOpenId=item.id;
    churchHistoryOpenFromShelf=true;
    churchHistoryOpenVolume=item.volumeKey;
    renderChurchHistoryPanel();
  }
  function renderChurchHistoryShelfView(){
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML='';
    if(!churchHistoryShelf.length){ els.panelBody.innerHTML=emptyState('⛪',t('historia.sinContenido')); return; }
    els.panelBody.innerHTML=`
      <div class="history-search-autocomplete church-shelf__quicksearch">
        <input id="historiaQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('historia.buscarRapidoPlaceholder')}" autocomplete="off">
        <div id="historiaQuickSearchPredictions" class="history-predictions"></div>
      </div>
      <div class="church-shelf">${churchHistoryShelf.map(churchHistoryShelfItemHTML).join('')}</div>
      <button type="button" class="church-shelf__search-link" id="churchHistoryGoSearch">${t('historia.buscarEnTodo')}</button>`;
    wireChurchHistoryShelf();
    applyChurchShelfTranslation(churchHistoryShelf,'historia');
    document.getElementById('churchHistoryGoSearch')?.addEventListener('click',()=>{
      churchHistorySearchActive=true;
      renderChurchHistoryPanel();
    });
    wireQuickSearchInput(document.getElementById('historiaQuickSearchInput'), document.getElementById('historiaQuickSearchPredictions'), historiaQuickIndex, selectHistoriaQuickResult, {sourceLang:'en', moduleId:'historia'});
  }
  function openChurchHistoryVolume(volumeId){
    churchHistoryOpenVolume=volumeId;
    churchHistoryOpenId=null;
    churchHistoryOpenFromShelf=false;
    renderChurchHistoryTOCView(volumeId);
  }
  function churchHistoryBackToShelf(){
    churchHistoryOpenVolume=null;
    churchHistoryOpenId=null;
    renderChurchHistoryShelfView();
  }

  // ── TOC (índice) de un volumen — agrupado por libro/capítulo o autor/concilio
  // según el volumen (ver churchHistoryTocGroups), preservando el orden narrativo
  // real del array de entries.json (incluye Mártires de Palestina intercalado). ──
  function churchHistoryTocRowHTML(entry){
    return `<li class="history-toc__row" data-history-toc-id="${escapeHTML(entry.id)}" tabindex="0"><span data-history-toc-label="${escapeHTML(entry.id)}">${escapeHTML(churchHistoryTocRowLabel(entry))}</span></li>`;
  }
  function churchHistoryTocGroupHTML(group){
    if(group.subgroups){
      return `<section class="history-toc__group">
        <h3 class="history-toc__group-title">${escapeHTML(group.label)}</h3>
        ${group.subgroups.map(sub=>`<div class="history-toc__subgroup">
          <h4 class="history-toc__subgroup-title">${escapeHTML(sub.label)}</h4>
          <ol class="history-toc__list">${sub.items.map(churchHistoryTocRowHTML).join('')}</ol>
        </div>`).join('')}
      </section>`;
    }
    return `<section class="history-toc__group">
      <h3 class="history-toc__group-title">${escapeHTML(group.label)}</h3>
      <ol class="history-toc__list">${group.items.map(churchHistoryTocRowHTML).join('')}</ol>
    </section>`;
  }
  function openChurchHistoryEntryFromTOC(id){
    churchHistoryOpenId=id;
    churchHistoryOpenFromShelf=true;
    els.side.classList.add('side-panel--history-expanded');
    els.side.offsetHeight; // fuerza reflow — igual patrón que openPanel() para sheets; sin esto
                            // el ancho nuevo quedaba diferido hasta la próxima interacción del usuario
    renderChurchHistoryEntry(id);
    els.panelBody.scrollTop=0;
  }
  function renderChurchHistoryTOCView(volumeId){
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML='';
    const shelfMeta=(churchHistoryShelf||[]).find(v=>v.id===volumeId);
    const entries=churchHistoryVolumeEntries(volumeId);
    const backBtn=`<button type="button" class="note-card__copy" id="backToChurchHistoryShelf">← ${t('historia.volverEstante')}</button>`;
    if(!entries.length){
      els.panelBody.innerHTML=`${backBtn}${emptyState('⛪',t('historia.sinContenido'))}`;
      document.getElementById('backToChurchHistoryShelf')?.addEventListener('click',churchHistoryBackToShelf);
      return;
    }
    const groups=churchHistoryTocGroups(volumeId, entries);
    els.panelBody.innerHTML=`${backBtn}
      <div class="history-toc__header">
        <div class="history-toc__title" data-shelf-title="${escapeHTML(volumeId)}">${escapeHTML(shelfMeta?.titulo || volumeId)}</div>
        ${shelfMeta?.periodo?`<div class="history-toc__period" data-shelf-period="${escapeHTML(volumeId)}">${escapeHTML(shelfMeta.periodo)}</div>`:''}
      </div>
      <div class="history-toc">${groups.map(churchHistoryTocGroupHTML).join('')}</div>`;
    document.getElementById('backToChurchHistoryShelf')?.addEventListener('click',churchHistoryBackToShelf);
    els.panelBody.querySelectorAll('[data-history-toc-id]').forEach(row=>{
      row.addEventListener('click',()=>openChurchHistoryEntryFromTOC(row.dataset.historyTocId));
      row.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); openChurchHistoryEntryFromTOC(row.dataset.historyTocId); }
      });
    });
    applyChurchHistoryTocTranslation(entries);
    if(shelfMeta) applyChurchShelfTranslation([shelfMeta],'historia');
  }

  // Traduce las filas del índice (antes solo se traducía la entrada ya abierta
  // o los resultados de búsqueda — el índice quedó afuera, ver bug reportado
  // por Juan 2026-08-04). Reusa el mismo noteId "historia:<id>" que el resto
  // de las traducciones de Historia para compartir caché, bajo un field propio
  // ("tocLabel") porque el texto es la etiqueta ya recortada del prefijo
  // (churchHistoryTocRowLabel), no el título completo.
  async function applyChurchHistoryTocTranslation(entries){
    const target=contentLang();
    const token=++churchHistoryTocToken;
    let index=0;
    async function worker(){
      while(index<entries.length){
        if(token!==churchHistoryTocToken) return;
        const entry=entries[index++];
        const source=entry.sourceLang||'en';
        if(!source||source===target) continue;
        const labelEl=els.panelBody.querySelector(`[data-history-toc-label="${CSS.escape(entry.id)}"]`);
        if(!labelEl||labelEl.dataset.translated===target) continue;
        const original=churchHistoryTocRowLabel(entry);
        const translated=await translateCommentaryHeader(`historia:${entry.id}`,'tocLabel',original,source,target);
        if(token!==churchHistoryTocToken) return;
        labelEl.textContent=translated;
        labelEl.dataset.translated=target;
      }
    }
    await Promise.all(Array.from({length:Math.min(4,entries.length)},worker));
  }

  // Traduce el título (fijo en el DOM otra vez, ya no dibujado en el SVG de
  // portada — ver decisión revertida el 2026-08-06) y el resumen/periodo de
  // cada tarjeta del estante — se usa para Historia (prefix "historia") y
  // Padres Apostólicos (prefix "padres"). Los tres campos vienen curados a
  // mano por Juan en shelf.json, siempre en español (sourceLang fijo 'es').
  async function applyChurchShelfTranslation(volumes, prefix){
    const target=contentLang();
    if(target==='es') return;
    const token=++churchShelfToken;
    let index=0;
    async function worker(){
      while(index<volumes.length){
        if(token!==churchShelfToken) return;
        const volume=volumes[index++];
        const noteId=`${prefix}:shelf:${volume.id}`;
        const titleEl=els.panelBody.querySelector(`[data-shelf-title="${CSS.escape(volume.id)}"]`);
        if(titleEl && titleEl.dataset.translated!==target && volume.titulo){
          const translated=await translateCommentaryHeader(noteId,'title',volume.titulo,'es',target);
          if(token!==churchShelfToken) return;
          titleEl.textContent=translated;
          titleEl.dataset.translated=target;
        }
        const periodEl=els.panelBody.querySelector(`[data-shelf-period="${CSS.escape(volume.id)}"]`);
        if(periodEl && periodEl.dataset.translated!==target && volume.periodo){
          const translated=await translateCommentaryHeader(noteId,'period',volume.periodo,'es',target);
          if(token!==churchShelfToken) return;
          periodEl.textContent=translated;
          periodEl.dataset.translated=target;
        }
        const summaryEl=els.panelBody.querySelector(`[data-shelf-summary="${CSS.escape(volume.id)}"]`);
        if(summaryEl && summaryEl.dataset.translated!==target && volume.resumenBreve){
          const translated=await translateCommentaryHeader(noteId,'summary',volume.resumenBreve,'es',target);
          if(token!==churchShelfToken) return;
          summaryEl.textContent=translated;
          summaryEl.dataset.translated=target;
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(4,volumes.length)},worker));
  }

  function renderChurchHistorySuggestionChips(){
    const group=(label,items)=>`<section class="history-suggestions__group">
      <div class="history-suggestions__label">${escapeHTML(label)}</div>
      ${items.length?`<div class="history-suggestions__list">${items.map(item=>
        `<button type="button" class="history-suggestions__chip" data-history-filter-type="${escapeHTML(item.type)}" data-history-filter-value="${escapeHTML(item.value)}" data-history-filter-label="${escapeHTML(item.label)}">${escapeHTML(item.label)}</button>`
      ).join('')}</div>`:''}
    </section>`;
    return `<div class="history-suggestions">
      ${group(t('historia.porAnio'),churchHistorySuggestions.anios)}
      ${group(t('historia.porTema'),churchHistorySuggestions.temas)}
      ${group(t('historia.nombresDestacados'),churchHistorySuggestions.nombres)}
    </div>`;
  }
  function wireChurchHistorySuggestionChips(){
    els.panelBody.querySelectorAll('[data-history-filter-type]').forEach(btn=>btn.addEventListener('click',()=>{
      const label=btn.dataset.historyFilterLabel||btn.textContent.trim();
      clearTimeout(churchHistorySemanticDebounce);
      churchHistorySemanticToken++;
      churchHistorySemanticResults=[];
      churchHistorySemanticQuery='';
      const filterType=btn.dataset.historyFilterType;
      churchHistoryActiveFilter=filterType==='query'?null:{type:filterType,value:btn.dataset.historyFilterValue,label};
      churchHistoryQuery=label;
      churchHistoryTranslatedQuery='';
      const input=document.getElementById('churchHistorySearchInput');
      if(input) input.value=label;
      renderChurchHistoryBody();
      if(filterType==='query'){
        scheduleChurchHistoryQueryTranslation(label);
        scheduleChurchHistorySemanticSearch(label);
      }
    }));
  }

  function renderChurchHistoryBody(){
    if(churchHistoryOpenId){ renderChurchHistoryEntry(churchHistoryOpenId); return; }
    if(!churchHistoryEntries.length){ els.panelBody.innerHTML=emptyState('⛪',t('historia.sinContenido')); return; }
    if(!churchHistoryQuery.trim()){
      els.panelBody.innerHTML=renderChurchHistorySuggestionChips();
      wireChurchHistorySuggestionChips();
      return;
    }
    const semanticReady=!churchHistoryActiveFilter
      && normalizeSearchText(churchHistorySemanticQuery)===normalizeSearchText(churchHistoryQuery)
      && churchHistorySemanticResults.length;
    const lexicalResults=churchHistoryActiveFilter?[]:churchHistorySearch(churchHistoryEntries,churchHistoryQuery,churchHistoryTranslatedQuery);
    const entriesById=semanticReady?new Map(churchHistoryEntries.map(entry=>[entry.id,entry])):null;
    const semanticEntries=semanticReady?churchHistorySemanticResults.map(result=>entriesById.get(result.id)).filter(Boolean):[];
    const lexicalIds=new Set(lexicalResults.map(entry=>entry.id));
    const results=churchHistoryActiveFilter
      ? churchHistoryFilterEntries(churchHistoryEntries,churchHistoryActiveFilter)
      : semanticReady
        ? [...lexicalResults,...semanticEntries.filter(entry=>!lexicalIds.has(entry.id))]
        : lexicalResults;
    if(!results.length){ els.panelBody.innerHTML=emptyState('🔎',t('historia.sinResultados',{query:escapeHTML(churchHistoryQuery)})); return; }
    els.panelBody.innerHTML=`<div class="search-results-list">${results.map(e=>{
      const years=e.anioInicio!=null?` · ${e.anioInicio}${e.anioFin && e.anioFin!==e.anioInicio?'–'+e.anioFin:''}`:'';
      const excerptText=htmlToPlainText(e.excerpt||e.content||'').slice(0,180);
      return `<button type="button" class="search-result" data-history-id="${escapeHTML(e.id)}">
        <span class="search-result__ref"><span data-history-title="${escapeHTML(e.id)}">${escapeHTML(e.title)}</span>${escapeHTML(years)}</span>
        <span class="search-result__text" data-history-excerpt="${escapeHTML(e.id)}">${escapeHTML(excerptText)}</span>
      </button>`;
    }).join('')}</div>`;
    els.panelBody.querySelectorAll('[data-history-id]').forEach(btn=>btn.addEventListener('click',()=>{
      churchHistoryOpenId=btn.dataset.historyId;
      churchHistoryOpenFromShelf=false;
      renderChurchHistoryBody();
      els.panelBody.scrollTop=0;
    }));
    applyChurchHistoryResultsTranslation(results);
  }

  // Traduce título + extracto de cada resultado de la lista de búsqueda (antes
  // solo se traducía la entrada ya abierta, ver applyChurchHistoryTranslation).
  // Reutiliza el mismo noteId/caché ("historia:<id>") para que abrir la entrada
  // después no tenga que volver a traducir el título. Concurrencia limitada
  // para no disparar decenas de peticiones simultáneas con búsquedas amplias;
  // un token por render aborta el trabajo de búsquedas ya obsoletas (el usuario
  // sigue escribiendo y cada tecla vuelve a llamar a esta función).
  async function applyChurchHistoryResultsTranslation(results){
    const target=contentLang();
    const token=++churchHistoryResultsToken;
    let index=0;
    async function worker(){
      while(index<results.length){
        if(token!==churchHistoryResultsToken) return;
        const entry=results[index++];
        const source=entry.sourceLang||'en';
        if(!source||source===target) continue;
        const titleEl=els.panelBody.querySelector(`[data-history-title="${CSS.escape(entry.id)}"]`);
        const excerptEl=els.panelBody.querySelector(`[data-history-excerpt="${CSS.escape(entry.id)}"]`);
        if(titleEl && titleEl.dataset.translated!==target){
          const translatedTitle=await translateCommentaryHeader(`historia:${entry.id}`,'title',entry.title,source,target);
          if(token!==churchHistoryResultsToken) return;
          titleEl.textContent=translatedTitle;
          titleEl.dataset.translated=target;
        }
        if(excerptEl && excerptEl.dataset.translated!==target){
          const originalExcerpt=excerptEl.textContent;
          const translatedExcerpt=await translateCommentaryHeader(`historia:${entry.id}`,'excerpt',originalExcerpt,source,target);
          if(token!==churchHistoryResultsToken) return;
          excerptEl.textContent=translatedExcerpt;
          excerptEl.dataset.translated=target;
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(4,results.length)},worker));
  }

  function renderChurchHistoryEntry(id){
    const entry=churchHistoryEntries.find(e=>e.id===id);
    if(!entry){ churchHistoryOpenId=null; els.panelBody.innerHTML=emptyState('⚠️',t('historia.entradaNoEncontrada')); return; }
    const sourceKey=churchHistoryBookKey(entry);
    const sourceEntries=churchHistoryEntries.filter(candidate=>churchHistoryBookKey(candidate)===sourceKey);
    const sourceIndex=sourceEntries.findIndex(candidate=>candidate.id===entry.id);
    const previous=sourceIndex>0?sourceEntries[sourceIndex-1]:null;
    const next=sourceIndex>=0&&sourceIndex<sourceEntries.length-1?sourceEntries[sourceIndex+1]:null;
    const metaParts=[
      entry.personas?.length?`${t('historia.personajes')}: ${entry.personas.map(escapeHTML).join(', ')}`:null,
      entry.eventos?.length?`${t('historia.eventos')}: ${entry.eventos.map(escapeHTML).join(', ')}`:null,
      entry.periodo?`${t('historia.periodo')}: ${escapeHTML(entry.periodo)}`:null,
      entry.anioInicio!=null?`${t('historia.anio')}: ${entry.anioInicio}${entry.anioFin && entry.anioFin!==entry.anioInicio?'–'+entry.anioFin:''}`:null,
      entry.tipo?`${t('historia.tipo')}: ${escapeHTML(entry.tipo.replaceAll('_',' '))}`:null,
    ].filter(Boolean).join(' · ');
    els.panelBody.innerHTML=`<article class="dict-entry${churchHistoryOpenFromShelf?' history-reader':''}">
      <div class="dict-entry__term" data-entry-id="${escapeHTML(entry.id)}">${escapeHTML(entry.title)}</div>
      <div class="dict-entry__source">${escapeHTML(churchHistoryBookLabel(sourceKey))}</div>
      ${metaParts?`<p class="note-card__translation-note">${metaParts}</p>`:''}
      <div class="history-entry-actions">
        <button class="note-card__copy" id="backToChurchHistoryResults" type="button">← ${churchHistoryOpenFromShelf?t('historia.volverIndice'):t('historia.volverResultados')}</button>
        <button id="churchHistoryExpand" class="history-panel-expand" type="button" aria-pressed="${els.side.classList.contains('side-panel--history-expanded')?'true':'false'}">${els.side.classList.contains('side-panel--history-expanded')?t('historia.vistaCompacta'):t('historia.ampliarLectura')}</button>
      </div>
      <div class="dict-entry__def" data-entry-id="${escapeHTML(entry.id)}">${entry.content||entry.excerpt||''}</div>
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-history-neighbor="${escapeHTML(previous.id)}" data-nav-dir="prev">← ${t('historia.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-history-neighbor="${escapeHTML(next.id)}" data-nav-dir="next">${t('historia.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    els.panelBody.offsetHeight; // fuerza reflow — mismo patrón que openChurchHistoryEntryFromTOC/openPanel
                                 // (ver líneas ~682 y ~2330): el reflow de els.side antes de este innerHTML
                                 // cubre el ancho del panel, pero no el pintado del contenido recién insertado
                                 // (ej. el botón #churchHistoryExpand), que quedaba diferido hasta la próxima
                                 // interacción del usuario con el panel.
    document.getElementById('backToChurchHistoryResults')?.addEventListener('click',()=>{
      if(churchHistoryOpenFromShelf){
        churchHistoryOpenId=null;
        els.side.classList.remove('side-panel--history-expanded');
        renderChurchHistoryTOCView(churchHistoryOpenVolume);
        els.panelBody.scrollTop=0;
        return;
      }
      els.side.classList.remove('side-panel--history-expanded');
      churchHistoryOpenId=null;
      renderChurchHistoryBody();
      els.panelBody.scrollTop=0;
    });
    document.getElementById('churchHistoryExpand')?.addEventListener('click',event=>{
      const scrollTop=els.panelBody.scrollTop;
      const expanded=els.side.classList.toggle('side-panel--history-expanded');
      event.currentTarget.setAttribute('aria-pressed',String(expanded));
      event.currentTarget.textContent=expanded?t('historia.vistaCompacta'):t('historia.ampliarLectura');
      requestAnimationFrame(()=>{ els.panelBody.scrollTop=scrollTop; });
    });
    els.panelBody.querySelectorAll('[data-history-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      churchHistoryOpenId=button.dataset.historyNeighbor;
      renderChurchHistoryEntry(churchHistoryOpenId);
      els.panelBody.scrollTop=0;
    }));
    applyChurchHistoryTranslation(entry);
  }

  // Traduce título+cuerpo de una entrada de Historia de la Iglesia reusando el
  // mismo motor de traducción de Comentario (translateEntry/translateCommentaryHeader),
  // así el resultado de traducción automática tiene la misma calidad/caché. Solo
  // corre si el idioma de la entrada (normalmente inglés, ver manifest.language)
  // difiere del idioma de interfaz (botón ES/EN).
  async function applyChurchHistoryTranslation(entry){
    const source=entry.sourceLang||'en';
    const target=contentLang();
    if(!source || source===target) return;
    const termEl=els.panelBody.querySelector(`.dict-entry__term[data-entry-id="${CSS.escape(entry.id)}"]`);
    const defEl=els.panelBody.querySelector(`.dict-entry__def[data-entry-id="${CSS.escape(entry.id)}"]`);
    if(!termEl||!defEl) return;
    if(termEl.dataset.translated!==target){
      termEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`historia:${entry.id}`,'title',entry.title,source,target);
      if(termEl.dataset.translated==='pending'){ termEl.textContent=translatedTitle; termEl.dataset.translated=target; }
    }
    if(defEl.dataset.translated!==target){
      defEl.dataset.translated='pending';
      const original=entry.content||entry.excerpt||'';
      const translated=await translateEntry(`historia:${entry.id}`, original, source, target);
      if(defEl.dataset.translated==='pending'){
        defEl.innerHTML=`${translated}${originalSourceDetailsHtml(original,source)}`;
        defEl.dataset.translated=target;
      }
    }
  }

  function getStrongDictionary(code=null){
    const installed=dictionaryCatalog();
    return installed.find(d=>d.id==='strong-verbo') || installed[0] || null;
  }

  // El HTML de cada entrada Strong (biblia/modules/dictionaries/strong-verbo/
  // entries-G.json y entries-H.json) trae sus encabezados de sección fijos
  // escritos en español porque el dato fuente es español-primero; cuando la
  // interfaz está en inglés (contentLang()==='en') ese HTML se muestra tal
  // cual, sin pasar por traducción automática (ver showEnglish más abajo), y
  // esos encabezados quedaban en español. Esto NO toca el dato (definiciones,
  // glosas, números Strong): solo reemplaza, al momento de mostrarlo en
  // inglés, un puñado fijo de etiquetas de estructura/UI por su equivalente.
  const STRONG_UI_LABELS_EN = {
    'Definición original de Strong': "Original Strong's Definition",
    'Traducciones y usos en la KJV': 'KJV Translations and Usage',
    'Palabras relacionadas': 'Related Words',
    'Pronunciación:': 'Pronunciation:',
    'James Strong, 1890 · Dominio público · Texto estructurado: Open Scriptures (CC BY-SA) · Edición Verbo': 'James Strong, 1890 · Public domain · Structured text: Open Scriptures (CC BY-SA) · Verbo edition',
    'Diccionario Strong': 'Strong Dictionary',
  };
  function localizeStrongUiLabels(html){
    let out=String(html||'');
    for(const [es,en] of Object.entries(STRONG_UI_LABELS_EN)) out=out.split(es).join(en);
    return out;
  }

  function formatStrongEntryHtml(code, entry, html){
    if(!/^G\d+$/i.test(code) || !entry?.term) return html;
    const box=document.createElement('div');
    box.innerHTML=html;
    const heading=box.querySelector('.lexicon-entry-head h3');
    if(!heading || box.querySelector('.lexicon-transliteration')) return html;
    const transliteration=String(entry.term).trim();
    const suffix=` — ${transliteration}`;
    if(heading.textContent.endsWith(suffix)) heading.textContent=heading.textContent.slice(0,-suffix.length);
    const line=document.createElement('p');
    line.className='lexicon-transliteration';
    const label=document.createElement('strong');
    label.textContent='Transliteración:';
    line.append(label,` ${transliteration}`);
    heading.insertAdjacentElement('afterend',line);
    return box.innerHTML;
  }

  // Fila de un versículo de la Biblia Strong: reutiliza .verse__num/.verse__text/
  // .strongs-tag/.word-segment de la Biblia principal para heredar su estilo
  // (ver style.css), pero NO la clase base ".verse" ni ".verse--active" —
  // esas se consultan sin scope en varios lugares de este archivo (navegación
  // con flechas, activeVerse(), etc.) y mezclarían las filas de este panel con
  // las del panel central. Usa ".strong-bible-verse"/"--active" en su lugar
  // (mismo estilo, ver style.css).
  function strongVerseRowHtml(n, verseObj, activeN){
    const segments=verseObj?.segments;
    let inner;
    if(Array.isArray(segments) && segments.length){
      inner=segments.map((seg,index)=>{
        const word=`<span class="word-segment">${index?' ':''}${escapeHTML(seg.text||'')}</span>`;
        const strongCodes=[...(seg.strong?[seg.strong]:[]),...(Array.isArray(seg.strongs)?seg.strongs:[])].filter((code,pos,all)=>code&&all.indexOf(code)===pos);
        const morphs=[...(seg.morph?[seg.morph]:[]),...(Array.isArray(seg.morphs)?seg.morphs:[])];
        const tags=strongCodes.map((code,codeIndex)=>{
          const title=morphs[codeIndex]?t('biblia.morfologiaTitle',{value:morphs[codeIndex]}):t('biblia.abrirDiccionarioTitle');
          return `<button type="button" class="strongs-tag" data-strong-code="${escapeHTML(code)}" title="${escapeHTML(title)}">${escapeHTML(code)}</button>`;
        }).join('');
        return word+tags;
      }).join('');
    } else {
      inner=escapeHTML(verseObj?.text||'');
    }
    return `<div class="strong-bible-verse${n===activeN?' strong-bible-verse--active':''}" data-verse-n="${n}"><span class="verse__num">${n}</span><span class="verse__text">${inner}</span></div>`;
  }

  // Pop-up de definición Strong pendiente de abrir en cuanto termine de pintarse
  // la lista de versículos (ver openDictionary): evita pedir el capítulo dos
  // veces (una vez al abrir el panel, otra al intentar mostrar el pop-up antes
  // de tiempo).
  let pendingStrongPopupCode=null;
  let strongBibleRenderRequest=0;

  // "Biblia Strong": Biblia Verbo + Strong o KJV + Strong según contentLang()
  // (ver strongBiblePath), siempre sincronizada con el libro/capítulo que se
  // esté leyendo (mismo patrón que renderCompare/commentaryContext),
  // independiente de la Biblia seleccionada en el panel central. Reemplaza al
  // viejo panel de Diccionario, que estaba vacío hasta que el usuario tocaba un
  // código Strong en la Biblia principal (ver cambio de 2026-08-07).
  async function renderDictionaryPanel(focus=null){
    const request=++strongBibleRenderRequest;
    panelToolbarEl().innerHTML='';
    panelTitleEl().textContent=t('nav.diccionario');
    const ctx=activeBibleContext();
    const sourcePath=strongBiblePath();
    panelBodyEl().innerHTML=emptyState('⌛',t('diccionario.buscandoEntrada'));
    try{
      const loaded=await VerboModules.loadBible(sourcePath, ctx.book, ctx.chapter);
      if(request!==strongBibleRenderRequest || sourcePath!==strongBiblePath()) return;
      if(!loaded){ panelBodyEl().innerHTML=emptyState('📖','La Biblia Strong todavía no tiene este capítulo.'); return; }
      const nums=Object.keys(loaded.verses).map(Number).sort((a,b)=>a-b);
      const activeN=focus||activeVerse();
      panelBodyEl().innerHTML=`<div class="strong-bible-list">${nums.map(n=>strongVerseRowHtml(n,loaded.verses[String(n)],activeN)).join('')}</div>`;
      panelBodyEl().querySelectorAll('.strongs-tag').forEach(tag=>tag.addEventListener('click', e=>{ e.stopPropagation(); openStrongPopup(tag.dataset.strongCode); }));
      if(activeN) panelBodyEl().querySelector(`[data-verse-n="${activeN}"]`)?.scrollIntoView({block:'center'});
    }catch(error){
      if(request!==strongBibleRenderRequest) return;
      console.error(error);
      panelBodyEl().innerHTML=emptyState('⚠️','No se pudo cargar la Biblia Strong.');
    }finally{
      if(request===strongBibleRenderRequest && pendingStrongPopupCode){ const code=pendingStrongPopupCode; pendingStrongPopupCode=null; openStrongPopup(code); }
    }
  }

  // Nodo del popup actualmente abierto (o null) — sirve tanto de guardia
  // ("ya hay uno abierto, no lo reemplaces", Cambio 3) como de referencia para
  // cerrarlo. Solo puede haber uno a la vez, en el panel normal o en el de
  // sermón, nunca los dos.
  let openStrongPopupRoot=null;
  // Pila de códigos visitados dentro del popup ya abierto (clic en "Palabras
  // relacionadas") — alimenta el botón "atrás". Se reinicia cada vez que el
  // popup se abre desde cero (openStrongPopup) o se cierra.
  let strongPopupHistory=[];

  async function openStrongPopup(code){
    if(openStrongPopupRoot){
      // Ya hay una definición abierta: no la reemplazamos con la nueva (pedido
      // explícito de Juan, Cambio 3) — solo un pequeño "shake" para indicar
      // que hay que cerrar la actual primero. Esto es para códigos Strong
      // clicados FUERA del popup (texto bíblico, panel Biblia Strong); la
      // navegación por "Palabras relacionadas" DENTRO del popup ya abierto no
      // pasa por acá — usa goToStrongPopupEntry() más abajo.
      openStrongPopupRoot.classList.remove('strong-def-popup--shake');
      void openStrongPopupRoot.offsetWidth; // reinicia la animación si ya estaba corriendo
      openStrongPopupRoot.classList.add('strong-def-popup--shake');
      return;
    }
    const p=strongPopupEls();
    if(!p.root) return;
    openStrongPopupRoot=p.root;
    p.root.hidden=false;
    strongPopupHistory=[];
    await renderStrongPopupEntry(code);
  }

  // Navega el popup YA ABIERTO a otro código (clic en un chip de "Palabras
  // relacionadas" dentro del propio popup): reemplaza el contenido en el
  // mismo popup, sin cerrarlo ni abrir uno nuevo encima, y apila el código
  // actual para poder volver con goBackStrongPopup().
  async function goToStrongPopupEntry(code){
    if(!openStrongPopupRoot) return;
    const currentCode=strongPopupEls().code.textContent;
    if(currentCode && currentCode!==code) strongPopupHistory.push(currentCode);
    await renderStrongPopupEntry(code);
  }

  async function goBackStrongPopup(){
    if(!strongPopupHistory.length) return;
    await renderStrongPopupEntry(strongPopupHistory.pop());
  }

  // Núcleo de carga + pintado de una entrada dentro del popup — lo usan tanto
  // openStrongPopup (primera apertura) como goToStrongPopupEntry/
  // goBackStrongPopup (navegación interna). No decide si el popup debe
  // abrirse o no; eso es responsabilidad de quien la llama.
  async function renderStrongPopupEntry(code){
    const p=strongPopupEls();
    if(!p.root) return;
    p.code.textContent=code;
    p.body.innerHTML=emptyState('⌛',t('diccionario.buscandoEntrada'));
    const selected=getStrongDictionary(code);
    currentDictionary=selected?.id||null;
    if(currentDictionary) localStorage.setItem('verbo:lastDictionary', currentDictionary);
    try{
      const result=await VerboModules.getDictionaryEntry(code, currentDictionary);
      if(openStrongPopupRoot!==p.root) return; // se cerró mientras cargaba
      if(!result){ p.body.innerHTML=emptyState('🔎',t('diccionario.sinEntrada',{code})); return; }
      const rawHtml=result.entry.html||result.entry.definition||result.entry.content||'';
      const html=formatStrongEntryHtml(result.code,result.entry,rawHtml);
      const showEnglish=contentLang()==='en';
      const sourceName=showEnglish?localizeStrongUiLabels(result.manifest.name):result.manifest.name;
      const previousCode=strongPopupHistory[strongPopupHistory.length-1];
      const backHtml=previousCode?`<button class="note-card__copy" id="strongPopupBack" type="button">← ${escapeHTML(previousCode)}</button>`:'';
      p.body.innerHTML=`<article class="dict-entry">${backHtml}<div class="dict-entry__term">${result.code}</div><div class="dict-entry__source">${escapeHTML(sourceName)}</div><button class="note-card__copy" id="copyDictEntry" type="button">${t('diccionario.copiarDiccionario')}</button><div class="dict-entry__def" id="dictionaryEntryBody">${showEnglish?localizeStrongUiLabels(html):`<p class="note-card__translating">${t('diccionario.traduciendoEspanol')}</p>${html}`}</div></article>`;
      p.body.querySelector('#strongPopupBack')?.addEventListener('click', e=>{ e.stopPropagation(); goBackStrongPopup(); });
      const body=p.body.querySelector('#dictionaryEntryBody');
      if(!showEnglish && body){
        const translated=await translateDictionaryEntry(result.code,html);
        if(openStrongPopupRoot===p.root && contentLang()==='es' && p.body.querySelector('#dictionaryEntryBody')===body){
          body.innerHTML=translated;
          wireStrongPopupRelatedLinks(body);
        }
      } else if(body) wireStrongPopupRelatedLinks(body);
      p.body.querySelector('#copyDictEntry')?.addEventListener('click',()=>{
        const visible=p.body.querySelector('#dictionaryEntryBody')?.innerHTML||html;
        copyToClipboard(`${result.code}\n${String(visible).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`);
      });
    }catch(error){
      console.error(error);
      if(openStrongPopupRoot===p.root) p.body.innerHTML=emptyState('⚠️',t('diccionario.errorEntrada'));
    }
  }

  // Convierte los enlaces "Palabras relacionadas" del HTML de la entrada
  // (<a class="strong" href="#sG25">) en botones reales (nunca <a href>, que
  // apuntaría a un ancla que no existe dentro del popup) para navegar DENTRO
  // del mismo popup vía goToStrongPopupEntry(). El código se extrae del href
  // — nunca se traduce, a diferencia del texto visible del enlace — para no
  // depender de que la traducción automática deje "G25"/"H26" intactos.
  function wireStrongPopupRelatedLinks(root){
    root.querySelectorAll('a.strong').forEach(a=>{
      const m=((a.getAttribute('href')||'')+' '+a.textContent).match(/[GH]\d+/i);
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='strongs-tag strong-related-btn';
      btn.textContent=m?m[0].toUpperCase():a.textContent;
      if(m) btn.dataset.strongCode=m[0].toUpperCase();
      a.replaceWith(btn);
      btn.addEventListener('click', e=>{ e.stopPropagation(); if(btn.dataset.strongCode) goToStrongPopupEntry(btn.dataset.strongCode); });
    });
  }

  // Se cierra únicamente desde acá: por su botón X (ver wiring más abajo) o al
  // salir de la pestaña/panel "Biblia Strong" — nunca por re-pintar la lista
  // de versículos (cambio de capítulo, clic en otro versículo), para que
  // navegar el capítulo mientras se consulta una palabra no cierre el popup.
  function closeStrongPopup(){
    if(!openStrongPopupRoot) return;
    openStrongPopupRoot.hidden=true;
    openStrongPopupRoot.classList.remove('strong-def-popup--shake');
    openStrongPopupRoot=null;
    strongPopupHistory=[];
  }



  async function renderGospelPanel(){
    els.panelTitle.textContent='Evangelio cronológico de Jesús';
    els.panelToolbar.innerHTML='';
    if(!gospelData){
      els.panelBody.innerHTML=emptyState('⌛','Cargando Evangelio armonizado…');
      try{
        gospelData=await VerboModules.loadGospel();
      }catch(error){console.error(error);}
    }
    if(!gospelData){
      els.panelBody.innerHTML=emptyState('✝️','El Evangelio armonizado está listo para recibir contenido (modules/gospel).');
      return;
    }
    // ¿Hay un capítulo del Evangelio cuya referencia coincide con el libro/capítulo
    // que se está leyendo ahora en la Biblia principal? Si sí, lo destacamos arriba.
    const matching=gospelData.chapters.filter(c=>(c.references||[]).some(r=>r.book===currentBook && r.chapter===currentChapter));

    const matchBanner=matching.length?`
      <div class="gospel-match">
        <div class="gospel-match__label">Relacionado con esta lectura</div>
        ${matching.map(c=>`<button type="button" class="gospel-match__item" data-gospel-chapter="${c.n}">Cap. ${c.n} — ${escapeHTML(c.title)}</button>`).join('')}
      </div>` : '';

    if(gospelOpenChapter){
      renderGospelChapter(gospelOpenChapter, matchBanner);
      return;
    }

    const list=gospelData.chapters.map(c=>`
      <button type="button" class="dictionary-library__item" data-gospel-chapter="${c.n}">
        <span>${c.n}. ${escapeHTML(c.title)}</span>
        <small>${escapeHTML(c.reference_label)}</small>
      </button>`).join('');

    els.panelBody.innerHTML=`
      ${matchBanner}
      <div class="dictionary-library">
        <input class="dictionary-library__search" id="gospelSearch" type="search" placeholder="Buscar capítulo o pasaje…">
        <div class="dictionary-library__count">${gospelData.chapters.length} capítulos</div>
        <div id="gospelList">${list}</div>
      </div>`;

    wireGospelChapterButtons();

    const searchInput=document.getElementById('gospelSearch');
    searchInput?.addEventListener('input', e=>{
      const q=normalizeBibleName(e.target.value);
      const items=document.querySelectorAll('#gospelList [data-gospel-chapter]');
      items.forEach(btn=>{
        const text=normalizeBibleName(btn.textContent);
        btn.style.display=!q||text.includes(q)?'':'none';
      });
    });
  }

  function wireGospelChapterButtons(){
    document.querySelectorAll('[data-gospel-chapter]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        gospelOpenChapter=Number(btn.dataset.gospelChapter);
        renderGospelPanel();
        els.panelBody.scrollTop=0;
      });
    });
  }

  function renderGospelChapter(n, matchBanner=''){
    const chapter=gospelData.chapters.find(c=>c.n===n);
    if(!chapter){ els.panelBody.innerHTML=emptyState('⚠️','No se encontró este capítulo.'); return; }
    els.panelToolbar.innerHTML=`<button class="note-card__copy" id="backToGospelIndex" type="button">← Índice del Evangelio</button>`;
    document.getElementById('backToGospelIndex')?.addEventListener('click',()=>{ gospelOpenChapter=null; renderGospelPanel(); els.panelBody.scrollTop=0; });

    const paralelosBlock=chapter.paralelos?`<div class="note-card__title" style="margin-top:18px;">Paralelos íntegros</div><div class="note-card__body">${nl2p(chapter.paralelos)}</div>`:'';

    els.panelBody.innerHTML=`
      <article class="dict-entry">
        <div class="dict-entry__term">Cap. ${chapter.n} — ${escapeHTML(chapter.title)}</div>
        <div class="dict-entry__source">${escapeHTML(chapter.reference_label)}</div>
        <div class="note-card__title" style="margin-top:14px;">Texto base</div>
        <div class="dict-entry__def">${nl2p(chapter.texto_base)}</div>
        ${paralelosBlock}
        <div class="note-card__title" style="margin-top:18px;">Notas</div>
        <div class="note-card__body">${nl2p(chapter.notas)}</div>
      </article>`;
  }

  // Convierte texto plano con saltos de línea en párrafos HTML simples,
  // sin alterar ni una palabra del contenido — solo estructura visual.
  function nl2p(text){
    if(!text) return '';
    return text.split(/\n\s*\n/).map(p=>`<p>${escapeHTML(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');
  }

  // ── Mapas bíblicos ───────────────────────────────────────────────────────────
  // Mapas 01-14: churchmaps.info (dominio público), recorte y distribución vía
  // FreeBibleimages.org bajo CC0. Los rótulos de esos mapas están en inglés
  // (única versión disponible); los títulos aquí son una traducción propia
  // solo de la ficha, no del contenido cartográfico.
  // Mapas 15-18 (agregados 2026-07-28): Wikimedia Commons. 15 y 16 son
  // CC BY-SA 3.0 (rótulos traducidos al español donde aplicaba) y llevan
  // `credit` con atribución visible obligatoria; 17 también CC BY-SA 3.0
  // (mismo autor tradujo del original en polaco); 18 es dominio público real
  // (Encyclopædia Britannica 1911), `credit` ahí es solo referencia de fuente,
  // no una obligación legal. Ver "Fuentes y licencias".
  const CHURCH_MAPS=[
    {id:'01', title:'El mundo antiguo en tiempos de los patriarcas', subtitle:'2000–1600 a.C.'},
    {id:'02', title:'Canaán y Egipto en tiempos de los patriarcas', subtitle:'2000–1600 a.C.'},
    {id:'03', title:'Mesopotamia en tiempos de los patriarcas', subtitle:'2000–1600 a.C.'},
    {id:'04', title:'Ruta del éxodo y la conquista de Canaán', subtitle:'Recorrido tradicional propuesto'},
    {id:'05', title:'Ruta del éxodo de Israel desde Egipto', subtitle:'Recorrido tradicional propuesto'},
    {id:'06', title:'La conquista de Canaán'},
    {id:'07', title:'Israel en tiempos de Jesús'},
    {id:'08', title:'Norte de Israel, Fenicia y Siria', subtitle:'En tiempos de Jesús'},
    {id:'09', title:'Galilea, Samaria y Judea', subtitle:'En tiempos de Jesús'},
    {id:'10', title:'Samaria, Judea e Idumea', subtitle:'En tiempos de Jesús'},
    {id:'11', title:'Los viajes del apóstol Pablo', subtitle:'Vista general'},
    {id:'12', title:'Primer viaje misionero de Pablo'},
    {id:'13', title:'Los tres viajes misioneros de Pablo'},
    {id:'14', title:'Viajes misioneros de Pablo y su travesía a Roma'},
    {id:'15', title:'El reino dividido: Israel y Judá', subtitle:'Siglo IX a.C.',
      credit:'Mapa de Kordas, Richardprins y FinnWikiNo — Wikimedia Commons, CC BY-SA 3.0'},
    {id:'16', title:'El reparto de las doce tribus de Israel', subtitle:'Según el libro de Josué',
      credit:'Mapa de Richardprins, Kordas, יוסי y Janz — Wikimedia Commons, CC BY-SA 3.0 (tribus traducidas al español)'},
    {id:'17', title:'El tabernáculo de Moisés', subtitle:'Planta del santuario en el desierto',
      credit:'Diagrama de Adik86 — Wikimedia Commons, CC BY-SA 3.0 (etiquetas traducidas al español)'},
    {id:'18', title:'El templo de Herodes en Jerusalén', subtitle:'Planta del templo y sus atrios',
      credit:'Encyclopædia Britannica, 11.ª edición (1911) — dominio público'},
  ];
  const MAPS_BASE='assets/maps/churchmaps';
  let mapsOpenId=null;

  function renderMapsPanel(){
    if(mapsOpenId){ renderMapViewer(mapsOpenId); return; }
    panelTitleEl().textContent='Mapas bíblicos';
    panelToolbarEl().innerHTML='';
    panelBodyEl().innerHTML=`
      <div class="maps-gallery">
        <div class="dictionary-library__count">${CHURCH_MAPS.length} mapas disponibles</div>
        <div class="maps-gallery__grid">
          ${CHURCH_MAPS.map(m=>`
            <button type="button" class="maps-gallery__item" data-map-id="${m.id}">
              <span class="maps-gallery__thumb"><img src="${MAPS_BASE}/thumb/${m.id}.jpg" alt="" loading="lazy"></span>
              <span class="maps-gallery__label">${escapeHTML(m.title)}</span>
            </button>`).join('')}
        </div>
      </div>`;
    panelBodyEl().querySelectorAll('[data-map-id]').forEach(btn=>{
      btn.addEventListener('click',()=>{ mapsOpenId=btn.dataset.mapId; renderMapViewer(mapsOpenId); });
    });
  }

  function renderMapViewer(id){
    const map=CHURCH_MAPS.find(m=>m.id===id);
    if(!map){ mapsOpenId=null; renderMapsPanel(); return; }
    panelTitleEl().textContent=map.title;
    panelToolbarEl().innerHTML=`<button class="note-card__copy" id="backToMapsIndex" type="button">← Mapas bíblicos</button>`;
    document.getElementById('backToMapsIndex')?.addEventListener('click',()=>{ mapsOpenId=null; renderMapsPanel(); });
    panelBodyEl().innerHTML=`
      <div class="map-viewer-page">
        <div class="map-viewer" id="mapViewer">
          <div class="map-viewer__frame" id="mapViewerFrame">
            <img class="map-viewer__img" id="mapViewerImg" src="${MAPS_BASE}/full/${map.id}.jpg" alt="${escapeHTML(map.title)}" draggable="false">
            <button type="button" class="map-viewer__btn map-viewer__expand" id="mapExpandBtn" aria-label="Ver a pantalla completa">⛶</button>
            <div class="map-viewer__controls">
              <button type="button" class="map-viewer__btn" id="mapZoomOut" aria-label="Alejar">−</button>
              <button type="button" class="map-viewer__btn" id="mapZoomReset" aria-label="Restablecer vista">⟲</button>
              <button type="button" class="map-viewer__btn" id="mapZoomIn" aria-label="Acercar">+</button>
            </div>
          </div>
        </div>
        ${map.subtitle?`<div class="maps-gallery__subtitle">${escapeHTML(map.subtitle)}</div>`:''}
        ${map.credit?`<div class="maps-gallery__credit">${escapeHTML(map.credit)}</div>`:''}
        <p class="maps-gallery__hint">Toca ⛶ para ver el mapa a pantalla completa. Ahí puedes acercar/alejar con los botones, la rueda del mouse o pellizcando con dos dedos, y arrastrar para moverte.</p>
      </div>`;
    initMapViewer();
  }

  // Zoom/pan con CSS transform puro (translate + scale), sin librerías.
  // `viewerEl` (#mapViewer) es solo el fondo de pantalla completa; `frame`
  // (#mapViewerFrame) es la caja que de verdad mantiene la proporción 4:3
  // del mapa y contiene la imagen y los botones — así el botón de cerrar
  // queda pegado a la esquina del mapa visible, no de la ventana entera.
  function initMapViewer(){
    const viewerEl=document.getElementById('mapViewer');
    const frame=document.getElementById('mapViewerFrame');
    const img=document.getElementById('mapViewerImg');
    if(!viewerEl||!frame||!img) return;
    const MIN_SCALE=1, MAX_SCALE=5, STEP=1.5;
    let scale=1, tx=0, ty=0;

    function apply(){ img.style.transform=`translate(${tx}px, ${ty}px) scale(${scale})`; }

    function clamp(){
      const cw=frame.clientWidth, ch=frame.clientHeight;
      const iw=img.clientWidth*scale, ih=img.clientHeight*scale;
      const maxX=Math.max(0,(iw-cw)/2), maxY=Math.max(0,(ih-ch)/2);
      tx=Math.min(maxX,Math.max(-maxX,tx));
      ty=Math.min(maxY,Math.max(-maxY,ty));
    }

    function setScale(newScale, anchorX, anchorY){
      newScale=Math.min(MAX_SCALE,Math.max(MIN_SCALE,newScale));
      if(anchorX!==undefined){
        // Mantiene el punto bajo el cursor/dedo fijo mientras cambia la escala.
        const rect=frame.getBoundingClientRect();
        const cx=anchorX-rect.left-rect.width/2;
        const cy=anchorY-rect.top-rect.height/2;
        const ratio=newScale/scale;
        tx=cx-(cx-tx)*ratio;
        ty=cy-(cy-ty)*ratio;
      }
      scale=newScale;
      if(scale===MIN_SCALE){ tx=0; ty=0; }
      clamp();
      apply();
    }

    function reset(){ scale=1; tx=0; ty=0; apply(); }

    // Pantalla completa: el fondo cubre toda la ventana, pero `frame` se
    // encoge para mantener la proporción 4:3 del mapa dentro de ese fondo
    // (ver CSS .map-viewer--fullscreen .map-viewer__frame). Se cierra con
    // el mismo botón o Escape.
    const expandBtn=document.getElementById('mapExpandBtn');
    let isFullscreen=false;
    function setFullscreen(v){
      isFullscreen=v;
      viewerEl.classList.toggle('map-viewer--fullscreen', v);
      document.body.classList.toggle('map-viewer-fullscreen-active', v);
      if(expandBtn){
        expandBtn.textContent=v?'✕':'⛶';
        expandBtn.setAttribute('aria-label', v?'Salir de pantalla completa':'Ver a pantalla completa');
      }
      clamp(); apply();
    }
    expandBtn?.addEventListener('click', ()=>setFullscreen(!isFullscreen));
    function onKeydown(e){
      if(!document.body.contains(viewerEl)){ document.removeEventListener('keydown', onKeydown); return; }
      if(e.key==='Escape' && isFullscreen) setFullscreen(false);
    }
    document.addEventListener('keydown', onKeydown);

    document.getElementById('mapZoomIn')?.addEventListener('click',()=>{
      const r=frame.getBoundingClientRect();
      setScale(scale*STEP, r.left+r.width/2, r.top+r.height/2);
    });
    document.getElementById('mapZoomOut')?.addEventListener('click',()=>{
      const r=frame.getBoundingClientRect();
      setScale(scale/STEP, r.left+r.width/2, r.top+r.height/2);
    });
    document.getElementById('mapZoomReset')?.addEventListener('click', reset);

    // Zoom, arrastre y gestos táctiles solo tienen efecto a pantalla completa
    // (ver setFullscreen arriba) — en el panel chico el mapa es solo vista
    // previa estática, no hay espacio real para explorar con zoom.

    // Rueda del mouse en escritorio.
    frame.addEventListener('wheel', e=>{
      if(!isFullscreen) return;
      e.preventDefault();
      setScale(scale*(e.deltaY<0?1.15:1/1.15), e.clientX, e.clientY);
    }, {passive:false});

    // Doble clic/doble tap: alterna entre vista completa y zoom 2.5x.
    let lastTapTime=0, lastTapX=0, lastTapY=0;
    function toggleZoom(x,y){
      if(scale>MIN_SCALE) reset(); else setScale(2.5,x,y);
    }
    frame.addEventListener('dblclick', e=>{
      if(!isFullscreen) return;
      e.preventDefault(); toggleZoom(e.clientX,e.clientY);
    });

    // Arrastre con mouse (solo aporta cuando hay zoom aplicado).
    let dragging=false, dragStartX=0, dragStartY=0, startTx=0, startTy=0;
    frame.addEventListener('mousedown', e=>{
      if(!isFullscreen || scale<=MIN_SCALE) return;
      dragging=true; dragStartX=e.clientX; dragStartY=e.clientY; startTx=tx; startTy=ty;
      frame.classList.add('map-viewer--dragging');
    });
    window.addEventListener('mousemove', e=>{
      if(!dragging) return;
      tx=startTx+(e.clientX-dragStartX);
      ty=startTy+(e.clientY-dragStartY);
      clamp(); apply();
    });
    window.addEventListener('mouseup', ()=>{ dragging=false; frame.classList.remove('map-viewer--dragging'); });

    // Touch: un dedo para arrastrar, dos dedos para pellizcar y hacer zoom.
    let touchMode=null; // 'pan' | 'pinch'
    let pinchStartDist=0, pinchStartScale=1;
    let panStartX=0, panStartY=0, panStartTx=0, panStartTy=0;

    function touchDist(t0,t1){ return Math.hypot(t1.clientX-t0.clientX, t1.clientY-t0.clientY); }
    function touchMid(t0,t1){ return {x:(t0.clientX+t1.clientX)/2, y:(t0.clientY+t1.clientY)/2}; }

    frame.addEventListener('touchstart', e=>{
      if(!isFullscreen) return;
      if(e.touches.length===2){
        touchMode='pinch';
        pinchStartDist=touchDist(e.touches[0],e.touches[1]);
        pinchStartScale=scale;
      } else if(e.touches.length===1){
        const now=Date.now();
        const t=e.touches[0];
        if(now-lastTapTime<320 && Math.hypot(t.clientX-lastTapX,t.clientY-lastTapY)<24){
          toggleZoom(t.clientX,t.clientY);
          lastTapTime=0;
          touchMode=null;
          return;
        }
        lastTapTime=now; lastTapX=t.clientX; lastTapY=t.clientY;
        touchMode='pan';
        panStartX=t.clientX; panStartY=t.clientY; panStartTx=tx; panStartTy=ty;
      }
    }, {passive:true});

    frame.addEventListener('touchmove', e=>{
      if(touchMode==='pinch' && e.touches.length===2){
        e.preventDefault();
        const dist=touchDist(e.touches[0],e.touches[1]);
        const mid=touchMid(e.touches[0],e.touches[1]);
        setScale(pinchStartScale*(dist/pinchStartDist), mid.x, mid.y);
      } else if(touchMode==='pan' && e.touches.length===1){
        if(scale<=MIN_SCALE) return;
        e.preventDefault();
        const t=e.touches[0];
        tx=panStartTx+(t.clientX-panStartX);
        ty=panStartTy+(t.clientY-panStartY);
        clamp(); apply();
      }
    }, {passive:false});

    frame.addEventListener('touchend', e=>{
      if(e.touches.length<2) touchMode = e.touches.length===1 ? 'pan' : null;
    });

    apply();
  }

  function patristicModeToggleHtml(){
    return `<button type="button" class="note-card__copy${patristicMode==='docs'?' sermon-mode-toggle--active':''}" data-patristic-mode="docs">📖 ${t('padres.modoDocumentos')}</button>
      <button type="button" class="note-card__copy${patristicMode==='verse'?' sermon-mode-toggle--active':''}" data-patristic-mode="verse">🔗 ${t('padres.modoVersiculo')}</button>`;
  }
  function wirePatristicModeToggle(){
    document.querySelectorAll('[data-patristic-mode]').forEach(btn=>btn.addEventListener('click',()=>{
      const mode=btn.dataset.patristicMode;
      if(mode===patristicMode) return;
      patristicMode=mode;
      localStorage.setItem('verbo:patristicMode',mode);
      els.side.classList.remove('side-panel--history-expanded'); // salir de "ampliar lectura" al cambiar de modo (ver renderPatristicSection)
      renderPadresPanel(activeVerse());
    }));
  }

  // ── Estante de portadas de "Explorar documentos" (Padres Apostólicos) ──────
  // Mismo componente visual que el estante de Historia de la Iglesia (clases
  // .church-shelf/.church-shelf__item, ver churchHistoryShelfItemHTML más
  // arriba) — se duplica la plantilla en una función propia en vez de
  // compartirla para no tocar el código ya probado de Historia al conectarlo
  // a una fuente de datos distinta (patristicCatalog + modules/patristic/shelf.json).
  function patristicShelfItemHTML(volume){
    return `<div class="church-shelf__item" data-patristic-shelf-volume="${escapeHTML(volume.id)}" tabindex="0" role="group" aria-label="${escapeHTML(volume.titulo)}">
      <img class="church-shelf__cover" src="${escapeHTML(volume.cover)}" alt="" loading="lazy">
      <div class="church-shelf__title" data-shelf-title="${escapeHTML(volume.id)}">${escapeHTML(volume.titulo)}</div>
      <div class="church-shelf__overlay">
        ${volume.periodo?`<div class="church-shelf__overlay-period" data-shelf-period="${escapeHTML(volume.id)}">${escapeHTML(volume.periodo)}</div>`:''}
        <p class="church-shelf__overlay-summary" data-shelf-summary="${escapeHTML(volume.id)}">${escapeHTML(volume.resumenBreve||'')}</p>
        <button type="button" class="church-shelf__read-btn" data-patristic-shelf-read="${escapeHTML(volume.id)}">${t('historia.leer')} →</button>
      </div>
    </div>`;
  }
  function wirePatristicShelf(){
    els.panelBody.querySelectorAll('[data-patristic-shelf-volume]').forEach(item=>{
      const toggle=()=>item.classList.toggle('church-shelf__item--active');
      item.addEventListener('click',event=>{ if(event.target.closest('[data-patristic-shelf-read]')) return; toggle(); });
      item.addEventListener('keydown',event=>{
        if(event.target.closest('[data-patristic-shelf-read]')) return;
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); toggle(); }
      });
    });
    els.panelBody.querySelectorAll('[data-patristic-shelf-read]').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      patristicOpenDoc=btn.dataset.patristicShelfRead;
      renderPadresPanel();
      els.panelBody.scrollTop=0;
    }));
  }

  async function renderPatristicByVerse(focus=null){
    if(!patristicByVerseCatalog){
      els.panelToolbar.innerHTML=`<div class="compare-toolbar">${patristicModeToggleHtml()}</div>`;
      wirePatristicModeToggle();
      els.panelBody.innerHTML=emptyState('⌛',t('padres.cargandoFuentes'));
      try{
        const registry=await VerboModules.getCatalog();
        patristicByVerseCatalog=(registry.patristicByVerse||[]).map(item=>({id:item.manifest.id,label:item.manifest.abbreviation||item.manifest.name,full:item.manifest.name,path:item.path,manifest:item.manifest}));
      }catch(error){console.error(error);}
    }
    if(!patristicByVerseCatalog || !patristicByVerseCatalog.length){
      els.panelToolbar.innerHTML=`<div class="compare-toolbar">${patristicModeToggleHtml()}</div>`;
      wirePatristicModeToggle();
      els.panelBody.innerHTML=emptyState('🔗',t('padres.sinAncladas'));
      return;
    }

    if(pendingPatristicSources && pendingPatristicSources.length){
      // Preferir, en orden del catálogo, la primera fuente que sí tiene un
      // fragmento anclado a este versículo — así se abre directo (una sola
      // fuente => esa; varias => la primera) sin pasar por el selector.
      const preferred=patristicByVerseCatalog.find(x=>pendingPatristicSources.includes(x.id));
      if(preferred){
        currentPatristicByVerse=preferred.id;
        localStorage.setItem('verbo:lastPatristicByVerse', preferred.id);
      }
      pendingPatristicSources=null;
    } else if(!currentPatristicByVerse || !patristicByVerseCatalog.some(x=>x.id===currentPatristicByVerse)){
      const saved=localStorage.getItem('verbo:lastPatristicByVerse');
      currentPatristicByVerse=patristicByVerseCatalog.some(x=>x.id===saved) ? saved : patristicByVerseCatalog[0].id;
    }
    const selected=patristicByVerseCatalog.find(x=>x.id===currentPatristicByVerse) || patristicByVerseCatalog[0];

    const sourceOptions=patristicByVerseCatalog.map(x=>`<option value="${x.id}" ${x.id===currentPatristicByVerse?'selected':''}>${escapeHTML(x.label)}</option>`).join('');
    els.panelToolbar.innerHTML=`<div class="compare-toolbar">${patristicModeToggleHtml()}</div><div class="compare-toolbar"><span class="compare-toolbar__label">${t('padres.fuenteLabel')}</span><select class="compare-toolbar__select" id="patristicByVerseSelect">${sourceOptions}</select></div>`;
    wirePatristicModeToggle();
    document.getElementById('patristicByVerseSelect')?.addEventListener('change', e=>{
      localStorage.setItem('verbo:lastPatristicByVerse', e.target.value);
      currentPatristicByVerse=e.target.value;
      renderPatristicByVerse(activeVerse());
    });

    els.panelBody.innerHTML=emptyState('⌛',t('padres.cargandoFragmento'));
    try{
      const resource=await VerboModules.loadLinkedEntries(selected.path,currentBook,currentChapter);
      renderLinkedResourceEntries(resource, resource.entries, focus, '🔗', t('padres.sinFragmentos'), selected.path);
    }catch(error){ console.error(error); els.panelBody.innerHTML=emptyState('⚠️',t('padres.errorRecurso')); }
  }

  // Índice del buscador rápido de Padres Apostólicos: a diferencia de Historia,
  // las secciones de cada documento no están precargadas (loadPatristic carga
  // un documento a la vez) — la primera vez que el usuario usa el buscador se
  // cargan TODOS los documentos del catálogo en paralelo (~1MB en total, 11
  // documentos) y se cachean tanto el índice de títulos como los datos
  // completos de cada documento (patristicQuickIndexDocs), para que
  // seleccionar un resultado navegue al instante sin volver a pedirlo por red.
  let patristicQuickIndexCache=null, patristicQuickIndexPromise=null;
  const patristicQuickIndexDocs=new Map();
  function patristicQuickIndex(){
    if(patristicQuickIndexCache) return patristicQuickIndexCache;
    if(patristicQuickIndexPromise) return patristicQuickIndexPromise;
    patristicQuickIndexPromise=(async()=>{
      const docs=await Promise.all((patristicCatalog||[]).map(doc=>VerboModules.loadPatristic(doc.id).catch(error=>{ console.warn(error); return null; })));
      const items=[];
      docs.forEach((data,i)=>{
        if(!data) return;
        const doc=patristicCatalog[i];
        patristicQuickIndexDocs.set(doc.id,data);
        (data.sections||[]).forEach(section=>items.push({
          label:`${doc.label} — ${section.title}`, prefixPart:doc.label, titlePart:section.title,
          quickKey:`${doc.id}:${section.n}`, docId:doc.id, sectionN:section.n
        }));
      });
      patristicQuickIndexCache=items;
      return items;
    })();
    return patristicQuickIndexPromise;
  }
  function selectPatristicQuickResult(item){
    const cached=patristicQuickIndexDocs.get(item.docId);
    if(cached) patristicDocData=cached;
    patristicOpenDoc=item.docId;
    patristicOpenSection=item.sectionN;
    renderPadresPanel();
  }
  async function renderPadresPanel(focus=null){
    els.panelTitle.textContent=t('padres.title');

    if(patristicMode==='verse'){
      await renderPatristicByVerse(focus);
      return;
    }

    els.panelToolbar.innerHTML='';

    if(!patristicCatalog){
      els.panelBody.innerHTML=emptyState('⌛',t('padres.cargandoColeccion'));
      try{
        const registry=await VerboModules.getCatalog();
        patristicCatalog=(registry.patristic||[]).map(item=>({id:item.manifest.id,label:item.manifest.abbreviation||item.manifest.name,full:item.manifest.name,manifest:item.manifest}));
      }catch(error){console.error(error);}
    }
    if(!patristicCatalog || !patristicCatalog.length){
      els.panelBody.innerHTML=emptyState('📜',t('padres.coleccionPreparacion'));
      return;
    }

    // Nivel 3: leyendo una sección específica. Normalmente patristicDocData ya
    // quedó cargado por el Nivel 2 (el usuario vino navegando el índice), pero
    // "Notas de Historia" (historiaNotasOpen) salta directo aquí sin pasar por
    // ese paso — hay que poder cargarlo desde cero también.
    if(patristicOpenDoc && patristicOpenSection!=null){
      if(!patristicDocData || patristicDocData.manifest.id!==patristicOpenDoc){
        els.panelBody.innerHTML=emptyState('⌛',t('padres.cargandoDocumento'));
        try{ patristicDocData=await VerboModules.loadPatristic(patristicOpenDoc); }
        catch(error){ console.error(error); }
      }
      if(!patristicDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('padres.errorDocumento')); return; }
      renderPatristicSection();
      return;
    }

    // Nivel 2: índice de secciones de un documento ya elegido
    if(patristicOpenDoc){
      await renderPatristicIndex();
      return;
    }

    // Nivel 1: estante de portadas de los documentos disponibles en la
    // colección (mismo componente visual que el estante de Historia de la
    // Iglesia, ver patristicShelfItemHTML/wirePatristicShelf más arriba).
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML=`<div class="compare-toolbar">${patristicModeToggleHtml()}</div>`;
    wirePatristicModeToggle();
    if(!patristicShelf){
      try{ patristicShelf=await VerboModules.loadPatristicShelf(); }
      catch(error){ console.error(error); patristicShelf=[]; }
    }
    const shelfVolumes=(patristicShelf||[]).filter(v=>patristicCatalog.some(d=>d.id===v.id));
    els.panelBody.innerHTML=`
      <div class="history-search-autocomplete church-shelf__quicksearch">
        <input id="padresQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('padres.buscarPlaceholder')}" autocomplete="off">
        <div id="padresQuickSearchPredictions" class="history-predictions"></div>
      </div>
      <div class="church-shelf">${shelfVolumes.map(patristicShelfItemHTML).join('')}</div>`;
    wirePatristicShelf();
    applyChurchShelfTranslation(shelfVolumes,'padres');
    wireQuickSearchInput(document.getElementById('padresQuickSearchInput'), document.getElementById('padresQuickSearchPredictions'), patristicQuickIndex, selectPatristicQuickResult, {loadingLabel:t('padres.indiceCargando'), sourceLang:'es', moduleId:'padres'});
  }

  let patristicDocData=null;

  async function renderPatristicIndex(){
    if(!patristicDocData || patristicDocData.manifest.id!==patristicOpenDoc){
      els.panelBody.innerHTML=emptyState('⌛',t('padres.cargandoDocumento'));
      try{
        patristicDocData=await VerboModules.loadPatristic(patristicOpenDoc);
      }catch(error){console.error(error);}
    }
    if(!patristicDocData){
      els.panelBody.innerHTML=emptyState('⚠️',t('padres.errorDocumento'));
      return;
    }
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML=`<button class="note-card__copy" id="backToPatristicDocs" type="button">← ${t('padres.volverColeccion')}</button>`;
    document.getElementById('backToPatristicDocs')?.addEventListener('click',()=>{ patristicOpenDoc=null; patristicDocData=null; renderPadresPanel(); els.panelBody.scrollTop=0; });

    const statusBanner=patristicDocData.manifest.status?`<div class="gospel-match"><div class="gospel-match__label">${t('padres.estadoLabel')}</div><div style="padding:4px 2px;">${escapeHTML(patristicDocData.manifest.status)}</div></div>`:'';

    const list=patristicDocData.sections.map(s=>`
      <button type="button" class="dictionary-library__item" data-patristic-section="${s.n}">
        <span data-patristic-section-title="${s.n}">${escapeHTML(s.title)}</span>
      </button>`).join('');

    els.panelBody.innerHTML=`${statusBanner}<div class="dictionary-library"><div class="dictionary-library__count">${t('padres.seccionesCount',{count:patristicDocData.sections.length})}</div><div>${list}</div></div>`;
    document.querySelectorAll('[data-patristic-section]').forEach(btn=>{
      btn.addEventListener('click',()=>{ patristicOpenSection=Number(btn.dataset.patristicSection); renderPadresPanel(); els.panelBody.scrollTop=0; });
    });
    translatePatristicSectionTitles(patristicDocData);
  }

  // Traduce los títulos de sección del índice de nivel 2 (ej. "Capítulo 5 — La
  // nueva alianza..."). Un solo request para todo el índice (join con
  // delimitador) en vez de uno por sección — documentos como Ireneo tienen
  // decenas de secciones.
  async function translatePatristicSectionTitles(docData){
    const source=docData.manifest.language||'es';
    const target=contentLang();
    if(source===target) return;
    const DELIM='\n@@@\n';
    const cacheKey=translationCacheKey(`patristic-index:${docData.manifest.id}`, docData.sections.map(s=>s.title).join(DELIM), target);
    let translatedTitles=tcacheGet(cacheKey);
    if(!translatedTitles){
      const translated=await verboTranslate(docData.sections.map(s=>s.title).join(DELIM), source, target);
      if(!translated) return;
      const parts=translated.split(/\s*@@@\s*/).map(x=>x.trim());
      if(parts.length!==docData.sections.length) return; // el delimitador se rompió en la traducción; no aplicar nada
      translatedTitles=parts;
      tcacheSet(cacheKey, translatedTitles);
    }
    docData.sections.forEach((s,i)=>{
      const el=els.panelBody.querySelector(`[data-patristic-section-title="${s.n}"]`);
      if(el){ el.textContent=translatedTitles[i]; el.dataset.translated=target; }
    });
  }

  function renderPatristicSection(){
    const sections=patristicDocData.sections;
    const idx=sections.findIndex(s=>s.n===patristicOpenSection);
    const section=sections[idx];
    if(!section){ els.panelBody.innerHTML=emptyState('⚠️',t('padres.seccionNoEncontrada')); return; }
    const previous=idx>0?sections[idx-1]:null;
    const next=idx>=0&&idx<sections.length-1?sections[idx+1]:null;
    els.panelToolbar.innerHTML=`
      <button class="note-card__copy" id="backToPatristicIndex" type="button">← ${t('padres.volverIndice')}</button>
      <button id="patristicExpand" class="history-panel-expand" type="button" aria-pressed="${els.side.classList.contains('side-panel--history-expanded')?'true':'false'}">${els.side.classList.contains('side-panel--history-expanded')?t('historia.vistaCompacta'):t('historia.ampliarLectura')}</button>`;
    document.getElementById('backToPatristicIndex')?.addEventListener('click',()=>{ els.side.classList.remove('side-panel--history-expanded'); patristicOpenSection=null; renderPadresPanel(); els.panelBody.scrollTop=0; });
    document.getElementById('patristicExpand')?.addEventListener('click',event=>{
      const scrollTop=els.panelBody.scrollTop;
      const expanded=els.side.classList.toggle('side-panel--history-expanded');
      event.currentTarget.setAttribute('aria-pressed',String(expanded));
      event.currentTarget.textContent=expanded?t('historia.vistaCompacta'):t('historia.ampliarLectura');
      requestAnimationFrame(()=>{ els.panelBody.scrollTop=scrollTop; });
    });
    const source=patristicDocData.manifest.language||'es';
    const target=contentLang();
    const needsTranslation=source!==target;
    const contentHtml=nl2p(section.content);
    const bodyHtml=needsTranslation
      ? (tcacheGet(translationCacheKey(`patristic:${patristicOpenDoc}:${section.n}`,section.content,target))||`<p class="note-card__translating">${t('comentario.traduciendo')}</p>${contentHtml}`)
      : contentHtml;
    const translationNote=needsTranslation
      ? `<p class="note-card__translation-note">${t('padres.traduccionAuto',{source:source.toUpperCase(),target:target.toUpperCase()})}</p>`
      : '';
    const patristicRef=`${patristicOpenDoc}-${section.n}`;
    els.panelBody.innerHTML=`<article class="dict-entry history-reader">
      <div class="dict-entry__term" data-patristic-title="1" data-entry-id="${escapeHTML(patristicRef)}">${escapeHTML(section.title)}</div>
      <div class="dict-entry__source" data-patristic-docname="1">${escapeHTML(patristicDocData.manifest.name)}</div>
      ${translationNote}
      <div class="dict-entry__def" data-patristic-body="1">${bodyHtml}</div>
      ${historiaNotaControlHTML('padres', patristicRef)}
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-patristic-neighbor="${previous.n}" data-nav-dir="prev">← ${t('padres.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-patristic-neighbor="${next.n}" data-nav-dir="next">${t('padres.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    wireHistoriaNotaControl('padres', patristicRef, {obra:patristicDocData.manifest.abbreviation||patristicDocData.manifest.name, capitulo:section.title});
    els.panelBody.querySelectorAll('[data-patristic-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      patristicOpenSection=Number(button.dataset.patristicNeighbor);
      renderPatristicSection();
      els.panelBody.scrollTop=0;
    }));
    if(needsTranslation) setTimeout(()=>applyPatristicTranslation(section,source,target), 150);
  }

  async function applyPatristicTranslation(section, sourceLang, targetLang){
    const titleEl=els.panelBody.querySelector('[data-patristic-title]');
    if(titleEl && titleEl.dataset.translated!==targetLang){
      titleEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`patristic-title:${patristicOpenDoc}:${section.n}`,'title',section.title,sourceLang,targetLang);
      if(titleEl.dataset.translated==='pending'){ titleEl.textContent=translatedTitle; titleEl.dataset.translated=targetLang; }
    }
    const docNameEl=els.panelBody.querySelector('[data-patristic-docname]');
    if(docNameEl && docNameEl.dataset.translated!==targetLang){
      docNameEl.dataset.translated='pending';
      const translatedName=await translateCommentaryHeader(`patristic-docname:${patristicOpenDoc}`,'name',patristicDocData.manifest.name,sourceLang,targetLang);
      if(docNameEl.dataset.translated==='pending'){ docNameEl.textContent=translatedName; docNameEl.dataset.translated=targetLang; }
    }
    const bodyEl=els.panelBody.querySelector('[data-patristic-body]');
    if(!bodyEl || bodyEl.dataset.translated===targetLang) return;
    bodyEl.dataset.translated='pending';
    const translated=await translateEntry(`patristic:${patristicOpenDoc}:${section.n}`, section.content, sourceLang, targetLang);
    // El usuario pudo haber navegado a otra sección mientras se traducía.
    const stillSameBody=els.panelBody.querySelector('[data-patristic-body]');
    if(stillSameBody===bodyEl && bodyEl.dataset.translated==='pending'){
      bodyEl.innerHTML=translated;
      bodyEl.dataset.translated=targetLang;
    }
  }

  // ── Costumbres y Tradiciones ────────────────────────────────────────────
  // Mismos 3 niveles que Padres Apostólicos (estante → índice de la obra →
  // entrada), reutilizando CSS (.church-shelf, .history-toc, .dictionary-library,
  // .dict-entry) y el motor de traducción de Comentario/Historia. Diferencia:
  // el estante se agrupa por categoría (Israel antiguo / Roma s. I, ver
  // modules/costumbres/shelf.json → volume.categoria).
  function costumbresShelfItemHTML(volume){
    return `<div class="church-shelf__item" data-costumbres-shelf-volume="${escapeHTML(volume.id)}" tabindex="0" role="group" aria-label="${escapeHTML(volume.titulo)}">
      <img class="church-shelf__cover" src="${escapeHTML(volume.cover)}" alt="" loading="lazy">
      <div class="church-shelf__title" data-shelf-title="${escapeHTML(volume.id)}">${escapeHTML(volume.titulo)}</div>
      <div class="church-shelf__overlay">
        ${volume.periodo?`<div class="church-shelf__overlay-period" data-shelf-period="${escapeHTML(volume.id)}">${escapeHTML(volume.periodo)}</div>`:''}
        <p class="church-shelf__overlay-summary" data-shelf-summary="${escapeHTML(volume.id)}">${escapeHTML(volume.resumenBreve||'')}</p>
        <button type="button" class="church-shelf__read-btn" data-costumbres-shelf-read="${escapeHTML(volume.id)}">${t('costumbres.leer')} →</button>
      </div>
    </div>`;
  }
  function wireCostumbresShelf(){
    els.panelBody.querySelectorAll('[data-costumbres-shelf-volume]').forEach(item=>{
      const toggle=()=>item.classList.toggle('church-shelf__item--active');
      item.addEventListener('click',event=>{ if(event.target.closest('[data-costumbres-shelf-read]')) return; toggle(); });
      item.addEventListener('keydown',event=>{
        if(event.target.closest('[data-costumbres-shelf-read]')) return;
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); toggle(); }
      });
    });
    els.panelBody.querySelectorAll('[data-costumbres-shelf-read]').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      costumbresOpenWork=btn.dataset.costumbresShelfRead;
      costumbresOpenId=null;
      costumbresDocData=null;
      renderCostumbresPanel();
      els.panelBody.scrollTop=0;
    }));
  }

  // Índice del buscador rápido de Costumbres y Tradiciones: mismo patrón que
  // patristicQuickIndex — la primera vez que el usuario busca se cargan todas
  // las obras del estante (Freeman + Tucker, ~2MB) y se cachean tanto el
  // índice de títulos como los datos completos de cada obra
  // (costumbresQuickIndexWorks), para navegar al instante sin volver a pedir
  // nada por red.
  let costumbresQuickIndexCache=null, costumbresQuickIndexPromise=null;
  const costumbresQuickIndexWorks=new Map();
  function costumbresQuickIndex(){
    if(costumbresQuickIndexCache) return costumbresQuickIndexCache;
    if(costumbresQuickIndexPromise) return costumbresQuickIndexPromise;
    costumbresQuickIndexPromise=(async()=>{
      if(!costumbresShelf){
        try{ costumbresShelf=await VerboModules.loadCostumbresShelf(); }
        catch(error){ console.error(error); costumbresShelf=[]; }
      }
      const works=await Promise.all(costumbresShelf.map(v=>VerboModules.loadCostumbres(v.id).catch(error=>{ console.warn(error); return null; })));
      const items=[];
      works.forEach((data,i)=>{
        if(!data) return;
        const volume=costumbresShelf[i];
        costumbresQuickIndexWorks.set(volume.id,data);
        (data.entries||[]).forEach(entry=>{
          // capituloTitulo (Tucker, navegación temática) o titulo (Freeman,
          // navegación bíblica) — mismo campo que usa costumbresTocRowHTML/el
          // índice de nivel 2 para mostrar cada entrada.
          const entryTitle=entry.capituloTitulo||entry.titulo||'';
          items.push({
            label:`${volume.titulo} — ${entryTitle}`, prefixPart:volume.titulo, titlePart:entryTitle,
            quickKey:`${volume.id}:${entry.id}`, workId:volume.id, entryId:entry.id
          });
        });
      });
      costumbresQuickIndexCache=items;
      return items;
    })();
    return costumbresQuickIndexPromise;
  }
  function selectCostumbresQuickResult(item){
    const cached=costumbresQuickIndexWorks.get(item.workId);
    if(cached) costumbresDocData=cached;
    costumbresOpenWork=item.workId;
    costumbresOpenId=item.entryId;
    renderCostumbresPanel();
  }
  async function renderCostumbresPanel(){
    els.panelTitle.textContent=t('costumbres.title');
    els.panelToolbar.innerHTML='';

    // Nivel 3: entrada abierta dentro de una obra
    if(costumbresOpenWork && costumbresOpenId){
      if(!costumbresDocData || costumbresDocData.manifest.id!==costumbresOpenWork){
        els.panelBody.innerHTML=emptyState('⌛',t('costumbres.cargandoObra'));
        try{ costumbresDocData=await VerboModules.loadCostumbres(costumbresOpenWork); }
        catch(error){ console.error(error); }
      }
      if(!costumbresDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('costumbres.errorObra')); return; }
      renderCostumbresEntry();
      return;
    }

    // Nivel 2: índice de la obra elegida
    if(costumbresOpenWork){
      await renderCostumbresIndex();
      return;
    }

    // Nivel 1: estante de portadas, agrupado por categoría
    els.side.classList.remove('side-panel--history-expanded');
    if(!costumbresShelf){
      try{ costumbresShelf=await VerboModules.loadCostumbresShelf(); }
      catch(error){ console.error(error); costumbresShelf=[]; }
    }
    if(!costumbresShelf.length){ els.panelBody.innerHTML=emptyState('🏺',t('costumbres.coleccionPreparacion')); return; }
    const categorias=[
      {id:'israel_antiguo', label:t('costumbres.categoriaIsraelAntiguo')},
      {id:'roma_s1', label:t('costumbres.categoriaRomaS1')},
    ];
    const sections=categorias.map(cat=>{
      const volumes=costumbresShelf.filter(v=>v.categoria===cat.id);
      if(!volumes.length) return '';
      return `<div class="costumbres-shelf__category">${escapeHTML(cat.label)}</div><div class="church-shelf">${volumes.map(costumbresShelfItemHTML).join('')}</div>`;
    }).join('');
    els.panelBody.innerHTML=sections
      ? `<div class="history-search-autocomplete church-shelf__quicksearch">
           <input id="costumbresQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('costumbres.buscarPlaceholder')}" autocomplete="off">
           <div id="costumbresQuickSearchPredictions" class="history-predictions"></div>
         </div>${sections}`
      : emptyState('🏺',t('costumbres.coleccionPreparacion'));
    wireCostumbresShelf();
    applyChurchShelfTranslation(costumbresShelf,'costumbres');
    wireQuickSearchInput(document.getElementById('costumbresQuickSearchInput'), document.getElementById('costumbresQuickSearchPredictions'), costumbresQuickIndex, selectCostumbresQuickResult, {loadingLabel:t('costumbres.indiceCargando'), sourceLang:'en', moduleId:'costumbres'});
  }

  function costumbresBackToShelf(){
    costumbresOpenWork=null;
    costumbresOpenId=null;
    costumbresDocData=null;
    els.side.classList.remove('side-panel--history-expanded');
    renderCostumbresPanel();
    els.panelBody.scrollTop=0;
  }

  function costumbresTocRowHTML(entry){
    const label=entry.titulo || (entry.versiculoInicio!=null
      ? `${entry.capitulo}:${entry.versiculoInicio}${entry.versiculoFin && entry.versiculoFin!==entry.versiculoInicio ? '-'+entry.versiculoFin : ''}`
      : `${t('historia.toc.libro')} ${entry.capitulo||''}`);
    return `<li class="history-toc__row" data-costumbres-toc-id="${escapeHTML(entry.id)}" tabindex="0"><span data-costumbres-toc-label="${escapeHTML(entry.id)}">${escapeHTML(label)}</span></li>`;
  }
  function costumbresTocGroupHTML(group){
    return `<section class="history-toc__group">
      <h3 class="history-toc__group-title">${escapeHTML(group.label)}</h3>
      <ol class="history-toc__list">${group.items.map(costumbresTocRowHTML).join('')}</ol>
    </section>`;
  }
  function wireCostumbresIndex(){
    const openEntry=(id)=>{
      costumbresOpenId=id;
      els.side.classList.add('side-panel--history-expanded');
      els.side.offsetHeight; // fuerza reflow, mismo patrón que openChurchHistoryEntryFromTOC
      renderCostumbresEntry();
      els.panelBody.scrollTop=0;
    };
    els.panelBody.querySelectorAll('[data-costumbres-toc-id]').forEach(row=>{
      row.addEventListener('click',()=>openEntry(row.dataset.costumbresTocId));
      row.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); openEntry(row.dataset.costumbresTocId); } });
    });
    els.panelBody.querySelectorAll('[data-costumbres-entry]').forEach(btn=>btn.addEventListener('click',()=>openEntry(btn.dataset.costumbresEntry)));
  }
  async function renderCostumbresIndex(){
    if(!costumbresDocData || costumbresDocData.manifest.id!==costumbresOpenWork){
      els.panelBody.innerHTML=emptyState('⌛',t('costumbres.cargandoObra'));
      try{ costumbresDocData=await VerboModules.loadCostumbres(costumbresOpenWork); }
      catch(error){ console.error(error); }
    }
    if(!costumbresDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('costumbres.errorObra')); return; }
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML=`<button class="note-card__copy" id="backToCostumbresShelf" type="button">← ${t('costumbres.volverEstante')}</button>`;
    document.getElementById('backToCostumbresShelf')?.addEventListener('click',costumbresBackToShelf);

    const entries=costumbresDocData.entries||[];
    if(!entries.length){
      els.panelBody.innerHTML=emptyState('📜',t('costumbres.sinContenido'));
      return;
    }
    if(costumbresDocData.manifest.navegacion==='biblico'){
      const groups=churchHistoryGroupByOrder(entries, entry=>entry.libro)
        .map(g=>({label: catalog.books.find(b=>b.id===g.key)?.name || g.key, items:g.items}));
      els.panelBody.innerHTML=`<div class="history-toc">${groups.map(costumbresTocGroupHTML).join('')}</div>`;
    } else {
      const sorted=[...entries].sort((a,b)=>(a.capituloNumero||0)-(b.capituloNumero||0));
      const list=sorted.map(e=>`
        <button type="button" class="dictionary-library__item" data-costumbres-entry="${escapeHTML(e.id)}">
          <span data-costumbres-index-title="${escapeHTML(e.id)}">${escapeHTML(e.capituloTitulo||e.titulo)}</span>
        </button>`).join('');
      els.panelBody.innerHTML=`<div class="dictionary-library"><div class="dictionary-library__count">${t('padres.seccionesCount',{count:sorted.length})}</div><div>${list}</div></div>`;
    }
    wireCostumbresIndex();
    translateCostumbresIndexTitles(costumbresDocData);
  }

  // Traduce en un solo request todos los títulos del índice visible (fila del
  // TOC bíblico o del listado temático), igual que translatePatristicSectionTitles.
  async function translateCostumbresIndexTitles(docData){
    const source=docData.manifest.language||'en';
    const target=contentLang();
    if(source===target) return;
    const labelEls=[...els.panelBody.querySelectorAll('[data-costumbres-toc-label],[data-costumbres-index-title]')];
    if(!labelEls.length) return;
    const DELIM='\n@@@\n';
    const originals=labelEls.map(el=>el.textContent);
    const cacheKey=translationCacheKey(`costumbres-index:${costumbresOpenWork}`, originals.join(DELIM), target);
    let translated=tcacheGet(cacheKey);
    if(!translated){
      const result=await verboTranslate(originals.join(DELIM), source, target);
      if(!result) return;
      const parts=result.split(/\s*@@@\s*/).map(x=>x.trim());
      if(parts.length!==labelEls.length) return; // el delimitador se rompió en la traducción; no aplicar nada
      translated=parts;
      tcacheSet(cacheKey, translated);
    }
    labelEls.forEach((el,i)=>{ el.textContent=translated[i]; el.dataset.translated=target; });
  }

  function renderCostumbresEntry(){
    const entry=(costumbresDocData.entries||[]).find(e=>e.id===costumbresOpenId);
    if(!entry){ costumbresOpenId=null; els.panelBody.innerHTML=emptyState('⚠️',t('costumbres.entradaNoEncontrada')); return; }
    const entries=costumbresDocData.entries||[];
    const idx=entries.findIndex(e=>e.id===entry.id);
    const previous=idx>0?entries[idx-1]:null;
    const next=idx>=0 && idx<entries.length-1?entries[idx+1]:null;
    els.panelToolbar.innerHTML=`
      <button class="note-card__copy" id="backToCostumbresIndex" type="button">← ${t('costumbres.volverIndice')}</button>
      <button id="costumbresExpand" class="history-panel-expand" type="button" aria-pressed="${els.side.classList.contains('side-panel--history-expanded')?'true':'false'}">${els.side.classList.contains('side-panel--history-expanded')?t('historia.vistaCompacta'):t('historia.ampliarLectura')}</button>`;
    document.getElementById('backToCostumbresIndex')?.addEventListener('click',()=>{
      els.side.classList.remove('side-panel--history-expanded');
      costumbresOpenId=null;
      renderCostumbresPanel();
      els.panelBody.scrollTop=0;
    });
    document.getElementById('costumbresExpand')?.addEventListener('click',event=>{
      const scrollTop=els.panelBody.scrollTop;
      const expanded=els.side.classList.toggle('side-panel--history-expanded');
      event.currentTarget.setAttribute('aria-pressed',String(expanded));
      event.currentTarget.textContent=expanded?t('historia.vistaCompacta'):t('historia.ampliarLectura');
      requestAnimationFrame(()=>{ els.panelBody.scrollTop=scrollTop; });
    });
    els.panelBody.innerHTML=`<article class="dict-entry history-reader">
      <div class="dict-entry__term" data-costumbres-entry-id="${escapeHTML(entry.id)}">${escapeHTML(entry.titulo)}</div>
      <div class="dict-entry__source">${escapeHTML(costumbresDocData.manifest.abbreviation||costumbresDocData.manifest.name)}</div>
      <div class="dict-entry__def" data-costumbres-entry-id="${escapeHTML(entry.id)}">${entry.content||entry.excerpt||''}</div>
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-costumbres-neighbor="${escapeHTML(previous.id)}" data-nav-dir="prev">← ${t('costumbres.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-costumbres-neighbor="${escapeHTML(next.id)}" data-nav-dir="next">${t('costumbres.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    els.panelBody.querySelectorAll('[data-costumbres-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      costumbresOpenId=button.dataset.costumbresNeighbor;
      renderCostumbresEntry();
      els.panelBody.scrollTop=0;
    }));
    applyCostumbresTranslation(entry);
  }

  async function applyCostumbresTranslation(entry){
    const source=costumbresDocData.manifest.language||'en';
    const target=contentLang();
    if(!source || source===target) return;
    const termEl=els.panelBody.querySelector(`.dict-entry__term[data-costumbres-entry-id="${CSS.escape(entry.id)}"]`);
    const defEl=els.panelBody.querySelector(`.dict-entry__def[data-costumbres-entry-id="${CSS.escape(entry.id)}"]`);
    if(!termEl||!defEl) return;
    if(termEl.dataset.translated!==target){
      termEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`costumbres:${entry.id}`,'title',entry.titulo,source,target);
      if(termEl.dataset.translated==='pending'){ termEl.textContent=translatedTitle; termEl.dataset.translated=target; }
    }
    if(defEl.dataset.translated!==target){
      defEl.dataset.translated='pending';
      const translated=await translateEntry(`costumbres:${entry.id}`, entry.content||entry.excerpt||'', source, target);
      if(defEl.dataset.translated==='pending'){ defEl.innerHTML=translated; defEl.dataset.translated=target; }
    }
  }
  // ── Fin Costumbres y Tradiciones ────────────────────────────────────────

  // ── Conversor de medidas ────────────────────────────────────────────────
  // Calculadora de una sola vista (sin estante/índice): categoría → unidad de
  // origen → cantidad, siempre convertida a las unidades modernas fijas de esa
  // categoría (kg+lb, m+pies, L, o el desglose de 3 valores en monedas). Todo
  // el cálculo ocurre en cliente a partir de modules/conversor/unidades.json,
  // cargado una sola vez (ver conversorData).
  function conversorFormatNumber(value, maxDecimals=2){
    if(!Number.isFinite(value)) return '—';
    const rounded=Number(value.toFixed(maxDecimals));
    return rounded.toLocaleString('es', {maximumFractionDigits:maxDecimals});
  }
  // biblia/modules/conversor/unidades.json trae en español los nombres de
  // unidad base (kilogramos/libras/metros/pies/litros) y de metal
  // (plata/oro/cobre) — vocabulario genérico, a diferencia de los nombres de
  // cada unidad bíblica individual (Codo, Siclo, Efa…) que SÍ son decisiones
  // de traducción/transliteración reales y quedan fuera de este alcance. No
  // toca el dato ni ningún factor de conversión: solo traduce ese puñado de
  // etiquetas genéricas al mostrarlas con interfaz en inglés.
  const CONVERSOR_LABELS_EN = {
    'kilogramos':'kilograms', 'libras':'pounds', 'metros':'meters', 'pies':'feet', 'litros':'liters',
    'plata':'silver', 'oro':'gold', 'cobre':'copper'
  };
  function localizeConversorLabel(value){
    if(contentLang()!=='en') return value;
    return CONVERSOR_LABELS_EN[value] || value;
  }
  function conversorCategoriaLabel(cat){
    const map={peso:'categoriaPeso', longitud:'categoriaLongitud', volumen_seco:'categoriaVolumenSeco', volumen_liquido:'categoriaVolumenLiquido', monedas:'categoriaMonedas'};
    return t(`conversor.${map[cat.id]||'categoria'}`) || cat.nombre;
  }
  function conversorResultHTML(categoria, unidad, cantidad){
    if(!Number.isFinite(cantidad)) return '';
    if(categoria.tipo==='moneda'){
      const gramos=cantidad*unidad.gramosMetal;
      const dias=cantidad*unidad.jornalDias;
      const precioGramo=conversorData.metales?.[unidad.metal]?.usdPorGramo || 0;
      const usd=gramos*precioGramo;
      const diasLabel=Math.abs(dias-1)<0.0001 ? t('conversor.diaAbrev') : t('conversor.diasAbrev');
      return `<div class="conversor-result">
        <div class="conversor-result__row"><span>${t('conversor.pesoMetal')}</span><strong>${conversorFormatNumber(gramos,2)} g (${escapeHTML(localizeConversorLabel(unidad.metal))})</strong></div>
        <div class="conversor-result__row"><span>${t('conversor.jornalEquivalente')}</span><strong>${conversorFormatNumber(dias,3)} ${diasLabel}</strong></div>
        <div class="conversor-result__row"><span>${t('conversor.valorUsd')}</span><strong>≈ $${conversorFormatNumber(usd,2)} USD</strong></div>
        <p class="conversor-result__note">${t('conversor.jornalNota')}. ${t('conversor.avisoReferencial',{fecha:conversorData.actualizado})}</p>
      </div>`;
    }
    if(categoria.id==='peso'){
      const kg=cantidad*unidad.factorKg;
      const lb=kg*(categoria.factorKgALb||2.20462);
      return `<div class="conversor-result">
        <div class="conversor-result__row"><span>${escapeHTML(localizeConversorLabel(categoria.unidadBaseNombre))}</span><strong>${conversorFormatNumber(kg,3)} kg</strong></div>
        <div class="conversor-result__row"><span>${escapeHTML(localizeConversorLabel(categoria.unidadBaseImperialNombre))}</span><strong>${conversorFormatNumber(lb,3)} lb</strong></div>
      </div>`;
    }
    if(categoria.id==='longitud'){
      const m=cantidad*unidad.factorM;
      const ft=m*(categoria.factorMAFt||3.28084);
      return `<div class="conversor-result">
        <div class="conversor-result__row"><span>${escapeHTML(localizeConversorLabel(categoria.unidadBaseNombre))}</span><strong>${conversorFormatNumber(m,3)} m</strong></div>
        <div class="conversor-result__row"><span>${escapeHTML(localizeConversorLabel(categoria.unidadBaseImperialNombre))}</span><strong>${conversorFormatNumber(ft,3)} ft</strong></div>
      </div>`;
    }
    // volumen_seco / volumen_liquido: solo litros
    const litros=cantidad*unidad.factorL;
    return `<div class="conversor-result">
      <div class="conversor-result__row"><span>${escapeHTML(localizeConversorLabel(categoria.unidadBaseNombre))}</span><strong>${conversorFormatNumber(litros,3)} L</strong></div>
    </div>`;
  }
  function renderConversorBody(){
    const categoria=conversorData.categorias.find(c=>c.id===conversorCategoria) || conversorData.categorias[0];
    conversorCategoria=categoria.id;
    if(!categoria.unidades.some(u=>u.id===conversorUnidadOrigen)) conversorUnidadOrigen=categoria.unidades[0]?.id || null;
    const catOptions=conversorData.categorias.map(c=>`<option value="${escapeHTML(c.id)}" ${c.id===categoria.id?'selected':''}>${escapeHTML(conversorCategoriaLabel(c))}</option>`).join('');
    const unitOptions=categoria.unidades.map(u=>`<option value="${escapeHTML(u.id)}" ${u.id===conversorUnidadOrigen?'selected':''}>${escapeHTML(u.nombre)}</option>`).join('');
    els.panelBody.innerHTML=`<form class="conversor-form" id="conversorForm">
      <label class="conversor-form__field">
        <span>${t('conversor.categoria')}</span>
        <select id="conversorCategoriaSelect">${catOptions}</select>
      </label>
      <label class="conversor-form__field">
        <span>${t('conversor.unidadOrigen')}</span>
        <select id="conversorUnidadSelect">${unitOptions}</select>
      </label>
      <label class="conversor-form__field">
        <span>${t('conversor.cantidad')}</span>
        <input type="number" id="conversorCantidadInput" min="0" step="any" inputmode="decimal" value="1">
      </label>
    </form>
    <div id="conversorResultado"></div>`;
    const recalc=()=>{
      const unidad=categoria.unidades.find(u=>u.id===conversorUnidadOrigen);
      const cantidad=Number(document.getElementById('conversorCantidadInput')?.value);
      document.getElementById('conversorResultado').innerHTML=unidad?conversorResultHTML(categoria,unidad,cantidad):'';
    };
    document.getElementById('conversorCategoriaSelect')?.addEventListener('change',event=>{
      conversorCategoria=event.target.value;
      conversorUnidadOrigen=null;
      renderConversorBody();
    });
    document.getElementById('conversorUnidadSelect')?.addEventListener('change',event=>{
      conversorUnidadOrigen=event.target.value;
      recalc();
    });
    document.getElementById('conversorCantidadInput')?.addEventListener('input',recalc);
    recalc();
  }
  async function renderConversorPanel(){
    els.panelTitle.textContent=t('conversor.title');
    els.panelToolbar.innerHTML='';
    els.side.classList.remove('side-panel--history-expanded');
    if(!conversorData){
      els.panelBody.innerHTML=emptyState('⌛','…');
      try{ conversorData=await VerboModules.loadConversorUnidades(); }
      catch(error){ console.error(error); }
    }
    if(!conversorData || !conversorData.categorias?.length){
      els.panelBody.innerHTML=emptyState('⚖️',t('conversor.errorCarga'));
      return;
    }
    renderConversorBody();
  }
  // ── Fin Conversor de medidas ─────────────────────────────────────────────

  async function renderExegesis(focus=null){
    els.panelTitle.textContent='Exégesis';
    const installed=exegesisCatalog();
    if(!installed.length){
      els.panelToolbar.innerHTML='';
      els.panelBody.innerHTML=emptyState('✍️','La sección Exégesis está lista. Cuando agregues módulos en modules/exegesis, aparecerán aquí.');
      return;
    }
    if(!installed.some(e=>e.id===currentExegesis)) currentExegesis=installed[0].id;
    const selected=installed.find(e=>e.id===currentExegesis) || installed[0];
    const options=installed.map(e=>`<option value="${e.id}" ${e.id===currentExegesis?'selected':''}>${escapeHTML(e.label)}</option>`).join('');
    els.panelToolbar.innerHTML=`<div class="compare-toolbar"><span class="compare-toolbar__label">Exégesis</span><select class="compare-toolbar__select" id="exegesisSelect">${options}</select></div>`;
    document.getElementById('exegesisSelect')?.addEventListener('change', e=>{
      currentExegesis=e.target.value;
      localStorage.setItem('verbo:lastExegesis', currentExegesis);
      renderExegesis(activeVerse());
    });
    els.panelBody.innerHTML=emptyState('⌛','Cargando exégesis…');
    try{
      const resource=await VerboModules.loadLinkedEntries(selected.path,currentBook,currentChapter);
      renderLinkedResourceEntries(resource, resource.entries, focus, '✍️', 'Este capítulo todavía no tiene exégesis cargada.');
    }catch(error){ console.error(error); els.panelBody.innerHTML=emptyState('⚠️','No se pudo abrir esta exégesis.'); }
  }

  function renderNotes(){
    panelTitleEl().textContent=t('notas.title');
    const key=`${data.meta.bookId}-${data.meta.chapter}`, saved=VerboBackup.getNota(key);
    panelBodyEl().innerHTML=`<label class="personal-note-form__label">${t('notas.label',{ref:`${data.meta.book} ${data.meta.chapter}`})}</label><textarea id="personalNoteArea" class="personal-note-form__area" placeholder="${t('notas.placeholder')}">${saved}</textarea><div class="personal-note-form__status" id="noteSaveStatus">${saved?t('notas.guardado'):''}</div>`;
    const area=document.getElementById('personalNoteArea'), status=document.getElementById('noteSaveStatus'); let timer;
    area.addEventListener('input',()=>{status.textContent=t('notas.escribiendo');clearTimeout(timer);timer=setTimeout(()=>{VerboBackup.setNota(key,area.value);status.textContent=t('notas.guardado');},400);});
  }

  // Punto de entrada para CUALQUIER clic en un código Strong fuera del panel
  // Biblia Strong (ej. .strongs-tag de la Biblia principal si tiene datos
  // Strong propios como KJV+, o un enlace a.strong dentro de un comentario):
  // asegura que el panel Biblia Strong esté abierto y sincronizado, y ahí
  // pide el pop-up — nunca dibuja nada fuera de ese panel (Cambio 3).
  async function openDictionary(code){
    // Mismo criterio que el dock (ver click de .tab-rail__btn más abajo): en
    // modo sermón + escritorio, Diccionario comparte el segundo panel con
    // Comparar/Comentarios/Notas/Mapas/Prédicas en vez de reemplazar la
    // Biblia del panel único. Por debajo de 901px o fuera de modo sermón,
    // sigue usando el panel único de siempre.
    const isSermonSide=sermonMode && window.matchMedia('(min-width: 901px)').matches;
    const alreadyShowing=isSermonSide ? sermonPanelTab==='diccionario' : activeTab==='diccionario';
    if(alreadyShowing){ openStrongPopup(code); return; }
    // El panel todavía no está en 'diccionario': dejamos el código pendiente y
    // lo abrimos recién cuando renderDictionaryPanel termine de pintar la
    // lista del capítulo (la abre openPanel/openSermonSidePanel más abajo) —
    // evita pedir el capítulo dos veces en paralelo.
    pendingStrongPopupCode=code;
    if(isSermonSide) openSermonSidePanel('diccionario'); else openPanel('diccionario');
  }
  function updateNavButtons(){ const idx=catalog.books.findIndex(b=>b.id===currentBook); const atStart=idx===0&&currentChapter===1; const atEnd=idx===catalog.books.length-1&&currentChapter===els.chapter.options.length; els.prev.disabled=atStart; els.next.disabled=atEnd; if(els.innerPrev) els.innerPrev.disabled=atStart; if(els.innerNext) els.innerNext.disabled=atEnd; }
  async function moveChapter(delta){
    const idx=catalog.books.findIndex(b=>b.id===currentBook), count=els.chapter.options.length;
    if(delta<0&&currentChapter>1) currentChapter--; else if(delta>0&&currentChapter<count) currentChapter++; else {
      const nextIdx=idx+delta; if(nextIdx<0||nextIdx>=catalog.books.length)return;
      currentBook=catalog.books[nextIdx].id; els.book.value=currentBook; currentChapter=delta>0?1:(await VerboModules.getBookInfo(currentBook)).chapterCount; await refreshChapters();
    }
    els.chapter.value=String(currentChapter); updateNavButtons(); await loadPassage();
  }
  function setLoading(on){ els.body.classList.toggle('app-loading',on); }
  function showFatal(error){ els.list.innerHTML=emptyState('⚠️',t('biblia.moduloJsonError',{message:error.message})); }

  els.book.addEventListener('change',async()=>{currentBook=els.book.value;currentChapter=1;await refreshChapters();await loadPassage();});
  els.chapter.addEventListener('change',async()=>{currentChapter=Number(els.chapter.value);updateNavButtons();await loadPassage();});
  els.nativeVersionSelect?.addEventListener('change',()=>{ if(els.nativeVersionSelect.value) selectBibleVersion(els.nativeVersionSelect.value); });
  els.prev.addEventListener('click',()=>moveChapter(-1)); els.next.addEventListener('click',()=>moveChapter(1));
  els.innerPrev?.addEventListener('click',()=>moveChapter(-1));
  els.innerNext?.addEventListener('click',()=>moveChapter(1));

  // ── Swipe horizontal para cambiar capítulo en móvil ─────────────────────────
  let swipeStartX=null, swipeStartY=null;
  els.list.addEventListener('touchstart',e=>{
    swipeStartX=e.touches[0].clientX; swipeStartY=e.touches[0].clientY;
  },{passive:true});
  els.list.addEventListener('touchend',e=>{
    if(swipeStartX===null) return;
    const dx=e.changedTouches[0].clientX-swipeStartX;
    const dy=Math.abs(e.changedTouches[0].clientY-swipeStartY);
    swipeStartX=null; swipeStartY=null;
    // Solo activar si gesto principalmente horizontal (dx>60, dy<dx/2) y sin panel abierto
    if(Math.abs(dx)<60||dy>Math.abs(dx)/2||activeTab) return;
    if(window.innerWidth>760) return;
    moveChapter(dx<0?1:-1);
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Swipe horizontal para pasar de entrada/sección en la Librería (Historia
  // de la Iglesia, Padres Apostólicos, Costumbres y Tradiciones) — solo móvil
  // ─────────────────────────────────────────────────────────────────────────
  // Mismo umbral y lógica que el swipe de capítulo de la Biblia de arriba
  // (dx>60px, gesto predominantemente horizontal, solo bajo 760px) para que
  // la sensibilidad se sienta igual en toda la app — funciona sin importar
  // cuánto haya hecho scroll el usuario dentro del panel, porque escucha en
  // #panelBody entero, no cerca de los botones "Anterior"/"Siguiente". No
  // necesita revisar activeTab: los tres lectores marcan sus botones de
  // navegación con data-nav-dir="prev"/"next" dentro de .history-entry-nav
  // (ver renderChurchHistoryEntry/renderPatristicSection/renderCostumbresEntry)
  // — si ese botón no existe (cualquier otra pestaña, o sin página vecina en
  // esa dirección), el swipe simplemente no hace nada. Las flechitas siguen
  // siendo la alternativa visible en cualquier ancho; esto solo agrega el
  // gesto en móvil.
  let librarySwipeStartX=null, librarySwipeStartY=null;
  els.panelBody.addEventListener('touchstart',e=>{
    librarySwipeStartX=e.touches[0].clientX; librarySwipeStartY=e.touches[0].clientY;
  },{passive:true});
  els.panelBody.addEventListener('touchend',e=>{
    if(librarySwipeStartX===null) return;
    const dx=e.changedTouches[0].clientX-librarySwipeStartX;
    const dy=Math.abs(e.changedTouches[0].clientY-librarySwipeStartY);
    librarySwipeStartX=null; librarySwipeStartY=null;
    if(Math.abs(dx)<60||dy>Math.abs(dx)/2) return;
    if(window.innerWidth>760) return; // solo móvil, mismo umbral que el swipe de capítulo de la Biblia
    const dir=dx<0?'next':'prev';
    els.panelBody.querySelector(`.history-entry-nav [data-nav-dir="${dir}"]`)?.click();
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Teclado en desktop ───────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'||e.target.isContentEditable) return;
    if(e.altKey||e.ctrlKey||e.metaKey) return;
    if(e.key==='ArrowLeft') { e.preventDefault(); moveChapter(-1); }
    else if(e.key==='ArrowRight') { e.preventDefault(); moveChapter(1); }
    else if(e.key==='ArrowUp'||e.key==='ArrowDown') {
      e.preventDefault();
      const rows=[...document.querySelectorAll('.verse')];
      if(!rows.length) return;
      const cur=document.querySelector('.verse--active');
      const curIdx=cur?rows.indexOf(cur):-1;
      const nextIdx=e.key==='ArrowDown'?Math.min(curIdx+1,rows.length-1):Math.max(curIdx-1,0);
      const nextRow=rows[nextIdx];
      document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active'));
      nextRow.classList.add('verse--active');
      nextRow.scrollIntoView({block:'nearest'});
      if(activeTab==='comentario'||activeTab==='comparar'||activeTab==='diccionario'||activeTab==='exegesis'){
        const n=Number(nextRow.dataset.verseN);
        const verse=data?.verses?.find(v=>v.n===n);
        if(verse) selectVerse(nextRow,verse);
      }
    }
    else if(e.key==='Enter') {
      const cur=document.querySelector('.verse--active');
      if(!cur) return;
      const n=Number(cur.dataset.verseN);
      const verse=data?.verses?.find(v=>v.n===n);
      if(verse) selectVerse(cur,verse);
    }
    else if(e.key==='Escape') { if(activeTab) closePanel(); }
    else if(e.key==='/') { e.preventDefault(); openPanel('buscar'); }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  els.versionInput.addEventListener('click',()=>{ els.versionInput.readOnly=false; els.versionInput.value=''; openVersionDropdown(); });
  els.versionInput.addEventListener('input',openVersionDropdown);
  els.versionInput.addEventListener('blur',()=>setTimeout(closeVersionDropdown,150));
  els.versionInput.addEventListener('keydown',e=>{
    if(e.key==='Escape'){ closeVersionDropdown(); els.versionInput.blur(); }
    if(e.key==='Enter'){ const first=els.versionDropdown.querySelector('li'); if(first) selectBibleVersion(first.dataset.id); }
  });

  let armedMobileTool = null;
  let armedMobileTimer = null;

  function clearMobileToolArm(){
    if(armedMobileTimer){ clearTimeout(armedMobileTimer); armedMobileTimer=null; }
    els.tabs.forEach(btn=>btn.classList.remove('mobile-tool-btn--armed'));
    armedMobileTool=null;
  }

  els.tabs.forEach(b=>b.addEventListener('click',()=>{
    // "Notas de Historia" es punto de entrada único: si hay un libro de Historia
    // o una obra de Padres Apostólicos abierta en lectura, abre el modal de
    // "Nota rápida" sobre esa entrada en vez de navegar al panel de notas
    // guardadas — así no hace falta cerrar el libro para tomar una nota. Sin
    // nada abierto, se comporta igual que cualquier otro botón del riel.
    // Padres en modo "Por versículo" queda fuera a propósito (no tiene una
    // "entrada de lectura" equivalente y no se debe tocar ese modo).
    // Se evalúa ANTES del gate de "armar" de íconos móviles (isMobileTool más
    // abajo) a propósito: abrir el modal es un overlay, no una navegación que
    // arriesgue perder el lugar de lectura, así que no debe requerir el doble
    // toque de confirmación que sí tiene el resto del dock móvil. Antes de
    // este fix, en el celular el primer toque solo armaba el ícono (sin abrir
    // nada) y hacía falta un segundo toque — Juan lo reportó como que el
    // ícono "no funcionaba" (2026-08-06).
    if(b.dataset.tab==='historia-notas' && window.VerboHistoriaNotaRapida){
      if(activeTab==='historia' && churchHistoryOpenId){
        clearMobileToolArm();
        window.VerboHistoriaNotaRapida.openForCurrentEntry('historia');
        return;
      }
      if(activeTab==='padres' && patristicMode==='docs' && patristicOpenDoc && patristicOpenSection!=null){
        clearMobileToolArm();
        window.VerboHistoriaNotaRapida.openForCurrentEntry('padres');
        return;
      }
    }
    const isMobileTool = b.classList.contains('mobile-tool-btn') && window.matchMedia('(max-width: 760px)').matches;
    if(isMobileTool){
      if(armedMobileTool !== b){
        clearMobileToolArm();
        armedMobileTool=b;
        b.classList.add('mobile-tool-btn--armed');
        b.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
        armedMobileTimer=setTimeout(clearMobileToolArm, 3500);
        return;
      }
      clearMobileToolArm();
    }
    // En modo sermón, Comparar/Comentarios/Notas/Mapas/Mis prédicas/
    // Diccionario no reemplazan el panel de Biblia: comparten un segundo
    // panel lado a lado (ver .sermon-compare-panel), fuera del sistema de
    // panel único que usa el resto de la app. Ese layout de 3 columnas no se
    // resuelve debajo de 900px (.sermon-compare-panel queda display:none —
    // ver style.css), así que por debajo de ese ancho estos seis caen al
    // sistema de panel único de siempre (reemplaza a Biblia), igual que
    // cualquier otra pestaña en móvil — la alternativa era que el ícono no
    // hiciera nada visible ahí.
    if(sermonMode && SERMON_SIDE_PANEL_TABS.includes(b.dataset.tab) && window.matchMedia('(min-width: 901px)').matches){
      resetXrefMode();
      toggleSermonSidePanel(b.dataset.tab);
      return;
    }
    resetXrefMode();
    activeTab===b.dataset.tab ? closePanel() : openPanel(b.dataset.tab);
  }));
  els.search.addEventListener('click',()=>openPanel('buscar'));
  els.close.addEventListener('click',closePanel);
  els.strongDefPopupClose?.addEventListener('click', closeStrongPopup);
  els.sermonStrongDefPopupClose?.addEventListener('click', closeStrongPopup);
  els.copyVerseText?.addEventListener('click', copySelectedText);
  els.copyVerseRef?.addEventListener('click', copySelectedReferences);
  els.closeVerseAction?.addEventListener('click', ()=>{
    selectedVerses.clear();
    document.querySelectorAll('.verse--selected').forEach(x=>x.classList.remove('verse--selected'));
    updateActionBar();
  });
  document.querySelectorAll('.verse-swatch').forEach(swatch=>{
    swatch.addEventListener('click', ()=>{
      if(sermonMode) return; // el resaltado por color no aplica en la Biblia del modo sermón
      const color = swatch.dataset.color;
      selectedVerses.forEach(n=>{
        const key = hlKey(currentBook, currentChapter, n);
        if(color){ highlights[key]=color; } else { delete highlights[key]; }
        const row = els.list.querySelector(`[data-verse-n="${n}"]`);
        if(row){
          row.classList.remove(...HL_COLORS);
          if(color) row.classList.add(color);
        }
      });
      saveHighlights();
      // Soltar la selección tras aplicar el color: si no se limpia acá, el
      // versículo recién coloreado sigue en `selectedVerses` y el próximo
      // color elegido (para OTRO versículo) se le vuelve a aplicar también,
      // sobrescribiéndolo — bug reportado por Juan en tablet (2026-08-07).
      selectedVerses.clear();
      document.querySelectorAll('.verse--selected').forEach(x=>x.classList.remove('verse--selected'));
      updateActionBar();
    });
  });
  window.addEventListener('scroll',()=>{ clearTimeout(commentSyncTimer); commentSyncTimer=setTimeout(syncCommentToReading,120); }, {passive:true});

  // ---- Respaldo local: guardado automático y silencioso en IndexedDB, sin
  // ningún diálogo de permiso. Se refuerza el volcado (incluye el puente
  // nativo de Capacitor, que va debounced) cuando la app pasa a segundo
  // plano o se cierra la pestaña — el equivalente a un botón "Salir" en
  // esta SPA, que no tiene uno explícito.
  (function initBackupAutoSave(){
    const flush=()=>{ VerboBackup.saveNow().catch(()=>{}); };
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flush(); });
    window.addEventListener('pagehide', flush);
  })();

  // ---- Selector de idioma de interfaz: independiente del selector de Biblia ----
  // Cambiar acá NO toca currentVersion/verbo:lastVersion, y elegir una Biblia
  // en el version-picker tampoco toca esto — ver VerboI18n.setUiLang (assets/i18n.js).
  (function initUiLangSwitcher(){
    if(!window.VerboI18n) return;
    const buttons=[...document.querySelectorAll('#uiLangSwitcher [data-lang]')];
    if(!buttons.length) return;
    const markActive=()=>{
      const current=VerboI18n.getUiLang();
      buttons.forEach(btn=>btn.classList.toggle('is-active', btn.dataset.lang===current));
    };
    // Los rótulos estáticos del HTML (data-i18n) ya se re-aplican solos
    // dentro de setUiLang(); lo que queda por refrescar acá es lo que app.js
    // arma con t() en tiempo de render (título del capítulo, panel lateral
    // abierto) — sin esto quedarían en el idioma anterior hasta el próximo
    // cambio de versículo/pestaña.
    const refreshDynamicText=()=>{
      if(data) renderChapter(activeVerse());
      if(sermonPanelTab) renderSermonSidePanel(sermonPanelTab);
      else if(activeTab) renderPanel(activeTab);
      if(openStrongPopupRoot){
        const code=strongPopupEls().code?.textContent;
        if(code) renderStrongPopupEntry(code);
      }
    };
    buttons.forEach(btn=>btn.addEventListener('click',()=>VerboI18n.setUiLang(btn.dataset.lang)));
    document.addEventListener('verbo:uilang-changed', ()=>{ markActive(); refreshDynamicText(); });
    markActive();
  })();
});
