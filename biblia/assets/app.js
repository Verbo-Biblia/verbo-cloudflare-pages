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
    tabs: [...document.querySelectorAll('.tab-rail__btn[data-tab], .library-rail__btn[data-tab]')],
    verseActionBar: document.getElementById('verseActionBar'),
    copyVerseText: document.getElementById('copyVerseText'),
    copyVerseRef: document.getElementById('copyVerseRef'),
    shareVerse: document.getElementById('shareVerse'),
    closeVerseAction: document.getElementById('closeVerseAction'),
    backdrop: document.getElementById('sheetBackdrop'),
    sermonToggle: document.getElementById('sermonModeToggle'),
    readingPane: document.getElementById('readingPane'),
    editorPane: document.getElementById('editorPane'),
    editorSurface: document.getElementById('editorSurface'),
    editorToolbar: document.getElementById('editorToolbar'),
    predicaEsquemaBtn: document.getElementById('predicaEsquemaBtn'),
    predicaEsquemaResults: document.getElementById('predicaEsquemaResults'),
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

  // Estado del popup unificado de notas (ver npBuild/openNotasPopup más
  // abajo). Declarado acá arriba, ANTES de la carga inicial de la Biblia
  // (loadPassage más abajo llama a npRefreshIfOpen): app.js entero corre
  // dentro de un único callback de DOMContentLoaded, así que un `let`/`const`
  // declarado más abajo en el archivo todavía no está inicializado (temporal
  // dead zone) la primera vez que loadPassage corre en el arranque -- eso
  // rompía la carga inicial de la Biblia con un ReferenceError (reportado por
  // Juan, 2026-08-26: "la biblia principal no carga" / "al recargar
  // desaparece"). Sacarlo de acá arriba lo evita de raíz.
  const NP_TABS=[
    {id:'capitulo', label:'notasPopup.tabCapitulo'},
    {id:'historia', label:'notasPopup.tabHistoria'},
    {id:'costumbres', label:'notasPopup.tabCostumbres'},
    {id:'extracanonico', label:'notasPopup.tabExtracanonico'},
    {id:'diccionarios', label:'notasPopup.tabDiccionarios'},
    {id:'idiomas', label:'notasPopup.tabIdiomas'},
  ];
  const NP_TIPOS_POR_TAB={
    capitulo:['biblia'], historia:['historia','padres'], costumbres:['costumbres'],
    extracanonico:['extracanonico'], diccionarios:['diccionarios'], idiomas:['idiomas'],
  };
  let npEl=null, npHeaderEl=null, npTabsEl=null, npBodyEl=null;
  let npActiveTab='capitulo', npOpenNoteId=null, npQuery='';
  let npDrag=null;

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
  const sharedPassageParams = new URLSearchParams(location.search);
  const sharedVersion = sharedPassageParams.get('version');
  const sharedBook = sharedPassageParams.get('book');
  const sharedChapter = Number(sharedPassageParams.get('chapter'));
  const sharedVerse = Number(String(sharedPassageParams.get('verse') || '').split(',')[0]);
  let catalog, data, activeTab = null, currentVersion = sharedVersion || localStorage.getItem('verbo:lastVersion') || VerboBackup.getPosicionBiblia()?.version || null, compareVersion = null;
  let xrefTarget = null, xrefData = null;
  function resetXrefMode(){ xrefTarget = null; xrefData = null; }
  let sermonMode = false;
  let sermonEditor = null;
  let sermonEditorContent = null;
  let sermonDirty = false;
  let sermonBible = null;
  let currentPredicaId = null;
  let selectedVerses = new Set();
  let highlights = VerboBackup.getResaltadosMap();
  let suppressCommentSync = false;
  let commentSyncTimer = null;
  let searchState = null;
  let currentCommentary = localStorage.getItem('verbo:lastCommentary') || null;
  let currentDictionary = localStorage.getItem('verbo:lastDictionary') || null;
  let languageStudyMode = localStorage.getItem('verbo:languageStudyMode') || 'interlinear';
  let currentExegesis = localStorage.getItem('verbo:lastExegesis') || null;
  let gospelData=null;
  let gospelOpenChapter=null;
  let patristicCatalog=null;
  let patristicShelf=null;
  let patristicOpenDoc=null;
  let patristicOpenSection=null;
  let patristicIndexToken=0;
  let patristicMode=localStorage.getItem('verbo:patristicMode') || 'docs';
  let patristicByVerseCatalog=null;
  let currentPatristicByVerse=null;
  // Fuente(s) que sí tienen fragmento para el versículo que el usuario acaba de
  // clickear (ver indicador 📜 por versículo) — se consume una sola vez al
  // abrir el panel, para saltar directo al documento correcto en vez de dejar
  // al usuario adivinar en el selector "Fuente".
  let pendingPatristicSources=null;
  // Costumbres y Tradiciones: mismo patrón de 3 niveles que Padres Apostólicos
  // (estante → índice de la obra → entrada).
  let costumbresShelf=null;
  let costumbresOpenWork=null;
  let costumbresDocData=null;
  let costumbresOpenId=null;
  let costumbresIndexToken=0;
  // Diccionarios (Easton/Smith/Hitchcock): mismo patrón de 3 niveles, sección
  // propia separada de Costumbres (ver renderDiccionariosPanel).
  let diccionariosShelf=null;
  let diccionariosOpenWork=null;
  let diccionariosDocData=null;
  let diccionariosOpenId=null;
  let diccionariosIndexToken=0;
  // Literatura Extracanónica (1 Enoc, Asunción de Moisés, Jubileos): mismo
  // patrón de 3 niveles que Costumbres/Diccionarios (estante → índice de la
  // obra → entrada). Sección propia, no comentario verso-a-versículo.
  let extracanonicoShelf=null;
  let extracanonicoOpenWork=null;
  let extracanonicoDocData=null;
  let extracanonicoOpenId=null;
  let extracanonicoIndexToken=0;
  // Conversor de medidas: datos fijos cargados una sola vez (no hay estados
  // de navegación tipo estante/índice, es una calculadora de una sola vista).
  let conversorData=null;
  let conversorCategoria=null;
  let conversorUnidadOrigen=null;
  const posicionBiblia = VerboBackup.getPosicionBiblia();
  let currentBook = sharedBook || posicionBiblia?.libro || 'ROM';
  let currentChapter = sharedChapter > 0 ? sharedChapter : (Number(posicionBiblia?.capitulo) || 7);
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
  const SELECTED_PASSAGE_EVENT = 'verbo:selected-passage-changed';
  let lastSelectedPassageSignature;

  /* Contrato canónico para consumidores del pasaje seleccionado. `book` es
     el ID de catalog.books/ModuleLoader (USFM: ROM, MAT, PSA…), que coincide
     con el identificador de los datos offline del Asistente. La UI actual
     solo selecciona dentro de un capítulo, pero se conserva el contrato de
     rango completo que usa el ensamblador de Fase 5. */
  function getSelectedPassageContext(){
    // El Asistente pertenece a la Biblia principal y está oculto en modo
    // sermón; el selector bíblico interno de ese modo mantiene otro estado.
    if(sermonMode) return null;
    const explicit = selectedVerseNumbers();
    const active = activeVerse();
    const verses = explicit.length ? explicit : (active ? [active] : []);
    if(!verses.length) return null;

    const ranges=[];
    let start=verses[0];
    let end=verses[0];
    for(let index=1; index<verses.length; index++){
      const verse=verses[index];
      if(verse===end+1){ end=verse; continue; }
      ranges.push({chapterStart:currentChapter,verseStart:start,chapterEnd:currentChapter,verseEnd:end});
      start=verse;
      end=verse;
    }
    ranges.push({chapterStart:currentChapter,verseStart:start,chapterEnd:currentChapter,verseEnd:end});
    return {book:currentBook,ranges};
  }

  function notifySelectedPassageChange(){
    const context=getSelectedPassageContext();
    const signature=JSON.stringify(context);
    if(signature===lastSelectedPassageSignature) return;
    lastSelectedPassageSignature=signature;
    document.dispatchEvent(new CustomEvent(SELECTED_PASSAGE_EVENT,{detail:context}));
  }

  window.VerboPassageSelection=Object.freeze({
    eventName:SELECTED_PASSAGE_EVENT,
    getContext:getSelectedPassageContext,
    getBookLabel:(bookId=currentBook)=>{
      const spanish=catalog?.books?.find(book=>book.id===bookId)?.name || bookId;
      return (window.VerboI18n?.getUiLang()==='en' ? NASB_BOOK_NAMES[bookId] : spanish) || spanish;
    }
  });
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
  // Vistas virtuales del selector principal. Reutilizan las Biblias y la capa
  // de idiomas originales existentes; no se registran como traducciones ni
  // participan en comparación, búsqueda o modo prédica.
  const INTERLINEAR_VIEWS = [
    { id:'interlinear-rv-verbo', label:'INT · VERBO', full:'Interlineal Verbo — Hebreo/Griego + Biblia Verbo', lang:'es', targetId:'rv-verbo', interlinear:true },
    { id:'interlinear-bsb', label:'INT · BSB', full:'Interlinear BSB — Hebrew/Greek + BSB', lang:'en', targetId:'bsb', interlinear:true }
  ];
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
  const bibleCatalog = () => catalog.bibles.map(item => ({ id:item.manifest.id, label:item.manifest.abbreviation || item.manifest.name, full:item.manifest.name, path:item.path, lang:item.manifest.language || 'es', remote:Boolean(item.remote || item.manifest.remote), manifest:item.manifest }));
  const mainBibleCatalog = () => [...bibleCatalog(), ...INTERLINEAR_VIEWS];
  const interlinearView = id => INTERLINEAR_VIEWS.find(view => view.id === id) || null;
  const effectiveBibleVersionId = id => interlinearView(id)?.targetId || id;
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
  // Nomenclatura estándar en inglés de los 66 libros, mismos ids/orden que
  // bookAbbr — solo para NASB 2020 (registry.apiBible.bibles, id 'api-nasb2020'),
  // la única Biblia remota en inglés. No hace falta esto para LBLA/NTV (remotas
  // en español, ya coinciden con el fallback de nombres en español del
  // desplegable) ni para las locales (resuelven su propio nombre vía
  // resolveBibleBooks, ver populateBooks). Nombres fijos, sin ambigüedad
  // editorial ni mantenimiento futuro — verificados contra la respuesta real
  // de API.Bible (campo "reference") antes de escribir esta tabla.
  const NASB_BOOK_NAMES = { GEN:'Genesis', EXO:'Exodus', LEV:'Leviticus', NUM:'Numbers', DEU:'Deuteronomy', JOS:'Joshua', JDG:'Judges', RUT:'Ruth', '1SA':'1 Samuel', '2SA':'2 Samuel', '1KI':'1 Kings', '2KI':'2 Kings', '1CH':'1 Chronicles', '2CH':'2 Chronicles', EZR:'Ezra', NEH:'Nehemiah', EST:'Esther', JOB:'Job', PSA:'Psalms', PRO:'Proverbs', ECC:'Ecclesiastes', SNG:'Song of Solomon', ISA:'Isaiah', JER:'Jeremiah', LAM:'Lamentations', EZK:'Ezekiel', DAN:'Daniel', HOS:'Hosea', JOL:'Joel', AMO:'Amos', OBA:'Obadiah', JON:'Jonah', MIC:'Micah', NAM:'Nahum', HAB:'Habakkuk', ZEP:'Zephaniah', HAG:'Haggai', ZEC:'Zechariah', MAL:'Malachi', MAT:'Matthew', MRK:'Mark', LUK:'Luke', JHN:'John', ACT:'Acts', ROM:'Romans', '1CO':'1 Corinthians', '2CO':'2 Corinthians', GAL:'Galatians', EPH:'Ephesians', PHP:'Philippians', COL:'Colossians', '1TH':'1 Thessalonians', '2TH':'2 Thessalonians', '1TI':'1 Timothy', '2TI':'2 Timothy', TIT:'Titus', PHM:'Philemon', HEB:'Hebrews', JAS:'James', '1PE':'1 Peter', '2PE':'2 Peter', '1JN':'1 John', '2JN':'2 John', '3JN':'3 John', JUD:'Jude', REV:'Revelation' };
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
    await loadPassage({restoreVerse: sharedVerse > 0 ? sharedVerse : null});
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
    const activeEntry = catalog.bibles.find(b => b.manifest.id === effectiveBibleVersionId(currentVersion));
    const activeManifestBooks = activeEntry ? await VerboModules.resolveBibleBooks(activeEntry) : null;
    const nameById = Array.isArray(activeManifestBooks)
      ? new Map(activeManifestBooks.map(b => [b.id, b.name]))
      : null;
    // NASB 2020 es remota (registry.apiBible.bibles) y resolveBibleBooks()
    // no tiene de dónde traer sus 66 nombres en inglés de una sola vez (su
    // manifest.books es un fallback en español, ver getCatalog en
    // module-loader.js) — se usa la tabla fija NASB_BOOK_NAMES en su lugar.
    // LBLA/NTV (remotas en español) y las Biblias locales no entran acá.
    const isNasb2020 = currentVersion === 'api-nasb2020';
    els.book.innerHTML = catalog.books.map(b => `<option value="${b.id}">${escapeHTML(isNasb2020 ? (NASB_BOOK_NAMES[b.id] || b.name) : (nameById?.get(b.id) || b.name))}</option>`).join('');
  }

  async function refreshChapters() {
    const info = await VerboModules.getBookInfo(currentBook);
    currentChapter = Math.max(1, Math.min(currentChapter, info.chapterCount));
    els.chapter.innerHTML = Array.from({length: info.chapterCount}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('');
    els.chapter.value = String(currentChapter);
    updateNavButtons();
  }

  async function loadPassage({preserveVersion=true, restoreVerse=null}={}) {
    setLoading(true);
    resetXrefMode();
    selectedVerses.clear();
    document.querySelectorAll('.verse--active,.verse--selected').forEach(row=>row.classList.remove('verse--active','verse--selected'));
    updateActionBar();
    notifySelectedPassageChange();
    try {
      const previous = preserveVersion ? currentVersion : null;
      data = await VerboModules.buildChapterData({bookId: currentBook, chapter: currentChapter, commentaryId: currentCommentary, bibleId: previous || currentVersion});
      if (previous && mainBibleCatalog().some(version => version.id === previous)) {
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
      renderChapter(restoreVerse);
      updateActionBar();
      notifySelectedPassageChange();
      VerboBackup.setPosicionBiblia(currentBook, currentChapter, currentVersion);
      gospelOpenChapter=null;
      if (activeTab) renderPanel(activeTab);
      npRefreshIfOpen(); // la pestaña Capítulo del popup de notas debe reflejar el nuevo capítulo
      window.scrollTo({top:0, behavior:'smooth'});
      if(restoreVerse){
        requestAnimationFrame(()=>els.list.querySelector(`[data-verse-n="${restoreVerse}"]`)?.scrollIntoView({block:'center'}));
      }
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
    const selected = mainBibleCatalog().find(version => version.id === versionId);
    if (!selected) return false;
    if (selected.interlinear) {
      await ensureVersionLoaded(selected.targetId, {targetData:target, bookId, chapter});
      const original = await VerboModules.loadOriginalLanguage(bookId, chapter, selected.targetId);
      if (!original?.chapter) throw new Error(`El texto original no está disponible para ${bookId} ${chapter}`);
      target.interlinear = target.interlinear || {};
      target.interlinear[versionId] = original;
      target.versions[versionId] = {
        label:selected.label,
        full:selected.full,
        hasStrongs:false,
        remote:false,
        copyright:`STEP Bible · CC BY 4.0${original.linguistic?.layers?.length ? ` · ${original.linguistic.layers.map(layer=>`${layer.manifest?.name||layer.id} · ${layer.manifest?.license||''}`).join(' · ')}` : ''}`,
        fumsToken:''
      };
      target.verses.forEach(verse => { verse.text[versionId] = verse.text[selected.targetId] || ''; });
      return true;
    }
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
    const lang = contentLang();
    const pick = f => (f && typeof f === 'object') ? (f[lang] || f.es || f.en || '') : (f || '');
    entries.forEach(e => {
      if (!e.id) return;
      const id = `${commentaryId}::${e.id}`;
      const bilingual = Boolean(e.content && typeof e.content === 'object');
      target.notes[id] = { ...(target.notes[id]||{}), title:pick(e.title), author:e.author||entry.manifest.author||entry.manifest.name||'', body:pick(e.content), commentaryId, bilingual };
    });
    target.loadedCommentaries.add(commentaryId);
    return true;
  }

  function populateVersions() {
    const all = mainBibleCatalog();
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
    const all = mainBibleCatalog(); // incluye las dos vistas interlineales virtuales
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
    const cur = mainBibleCatalog().find(v => v.id === currentVersion);
    els.versionInput.value = cur?.label || currentVersion || '';
    els.versionInput.readOnly = true;
  }

  async function selectBibleVersion(id) {
    const v = activeVerse();
    closeVersionDropdown();
    // Si la versión seleccionada no tiene el libro actual, navegar a su primer libro
    const bibleEntry = catalog.bibles.find(b => b.manifest.id === effectiveBibleVersionId(id));
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

  function renderMainInterlinearVerse(container, verse, view, original) {
    const originalVerse=original?.chapter?.verses?.[String(verse.n)];
    const stack=document.createElement('div');
    stack.className='main-interlinear';
    if(originalVerse?.tokens?.length){
      const words=document.createElement('div');
      words.className='main-interlinear__original';
      words.dir=original.chapter.direction;
      originalVerse.tokens.forEach(token=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='main-interlinear__token';
        button.dir=original.chapter.direction;
        button.textContent=token.surface;
        button.addEventListener('click',event=>{
          event.stopPropagation();
          words.querySelectorAll('.main-interlinear__token').forEach(item=>item.classList.toggle('is-active',item===button));
          detail.innerHTML=originalTokenDetail(token,original.alignment,original.morphology,original.linguistic);
          detail.querySelectorAll('[data-strong-code]').forEach(tag=>tag.addEventListener('click',strongEvent=>{strongEvent.stopPropagation();openDictionary(tag.dataset.strongCode);}));
        });
        words.appendChild(button);
      });
      stack.appendChild(words);
    } else {
      const unavailable=document.createElement('small');
      unavailable.className='main-interlinear__unavailable';
      unavailable.textContent=contentLang()==='es'?'Texto original no disponible para este versículo.':'Original text is unavailable for this verse.';
      stack.appendChild(unavailable);
    }
    const translation=document.createElement('div');
    translation.className='main-interlinear__translation';
    const label=document.createElement('small');
    label.textContent=view.targetId==='rv-verbo'?'Biblia Verbo':'BSB';
    const body=document.createElement('span');
    body.textContent=verse.text[view.targetId] || verse.text[view.id] || '';
    translation.append(label,body);
    stack.appendChild(translation);
    const detail=document.createElement('div');
    detail.className='original-detail-slot main-interlinear__detail';
    stack.appendChild(detail);
    container.appendChild(stack);
  }

  function renderChapter(restoreVerse=null) {
    const activeInterlinear=interlinearView(currentVersion);
    const original=activeInterlinear ? data.interlinear?.[currentVersion] : null;
    els.eyebrow.textContent = data.versions[currentVersion]?.full || data.meta.versionFull;
    els.title.textContent = `${data.meta.book} ${data.meta.chapter}`;
    // populateBooks() nombra el desplegable con el arreglo "books" de la Biblia
    // activa (resolveBibleBooks) — para las Biblias remotas de API.Bible ese
    // arreglo es un fallback en español (ver getCatalog en module-loader.js) y
    // no refleja el idioma real de la versión elegida. data.meta.book ya viene
    // resuelto correctamente (local o remoto, ver buildChapterData), así que
    // se usa para corregir solo la opción del libro que se está leyendo ahora
    // — el resto del desplegable sigue en español hasta navegar a ese libro.
    const activeBookOption = els.book?.querySelector(`option[value="${data.meta.bookId}"]`);
    if (activeBookOption) activeBookOption.textContent = data.meta.book;
    els.list.innerHTML = '';
    data.verses.forEach(v => {
      const row = document.createElement('div'); row.className='verse'; row.dataset.verseN=v.n;
      if (v.n === restoreVerse) row.classList.add('verse--active');
      if (selectedVerses.has(v.n)) row.classList.add('verse--selected');
      const savedHl = highlights[hlKey(currentBook, currentChapter, v.n)];
      if (savedHl) row.classList.add(savedHl);
      const num=document.createElement('span'); num.className='verse__num'; num.textContent=v.n;
      const text=document.createElement(activeInterlinear?'div':'span'); text.className='verse__text'+(v.hasNote?' verse__text--has-note':''); text.tabIndex=0;
      const verseSegments=v.segments?.[currentVersion];
      if(activeInterlinear){
        renderMainInterlinearVerse(text,v,activeInterlinear,original);
      } else if(verseSegments?.length){
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
    notifySelectedPassageChange();
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
    copyToClipboard(selectedVerseText(ctx, nums));
  }

  function selectedVerseText(ctx, nums){
    return nums.map(n=>{
      const verse=ctx.data.verses.find(v=>v.n===n);
      const text=verse?.text?.[ctx.version] || Object.values(verse?.text || {})[0] || '';
      return `${compactRef(ctx.book,ctx.chapter,[n])} ${String(text).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`;
    }).join('\n');
  }

  async function shareSelectedVerses(){
    const nums=selectedVerseNumbers();
    if(!nums.length) return;
    const ctx=activeBibleContext();
    const text=selectedVerseText(ctx, nums);
    const title=compactRef(ctx.book,ctx.chapter,nums);
    // El enlace siempre debe ser público. En la app nativa `location.origin`
    // puede ser capacitor://localhost y no serviría para quien lo recibe.
    const url=new URL('https://verbobiblia.com/biblia/');
    url.searchParams.set('version', ctx.version);
    url.searchParams.set('book', ctx.book);
    url.searchParams.set('chapter', String(ctx.chapter));
    url.searchParams.set('verse', nums.join(','));
    const shareUrl=url.toString();
    try {
      if(window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.Share){
        await window.Capacitor.Plugins.Share.share({title,text,url:shareUrl});
        return;
      }
      if(navigator.share){
        await navigator.share({title,text,url:shareUrl});
        return;
      }
    } catch(error) {
      if(error?.name==='AbortError') return;
    }
    await copyToClipboard(`${text}\n${shareUrl}`);
  }

  // Antes solo Comentario/Comparar/Diccionario usaban la hoja parcial (72vh);
  // Biblioteca ya usaba el panel completo y a Juan le pareció que se veía mejor,
  // así que en mobile los tres pasan a comportarse igual que Biblioteca (2026-07-24).
  const SHEET_TABS = [];
  function isMobileSheet(){ return window.innerWidth<=760 && SHEET_TABS.includes(activeTab); }

  function openPanel(tab, focus=null, verseCommentaries=null) {
    // Cambiar de pestaña o reabrir el panel deja atrás lo que se estaba
    // viendo antes: cualquier traducción en curso para ESE contenido ya no
    // debe mantener visible el indicador (sigue corriendo en segundo plano,
    // solo deja de contar — ver abandonPendingTranslations).
    abandonPendingTranslations();
    const panelWasClosed=!els.side.classList.contains('side-panel--open');
    // El pop-up de definición Strong nunca debe quedar flotando sobre OTRO
    // panel (Cambio 3) — se cierra acá al salir de 'diccionario', pero no al
    // reabrir la misma pestaña (openDictionary ya evita llamar a openPanel en
    // ese caso).
    if(activeTab==='diccionario' && tab!=='diccionario') closeStrongPopup();
    activeTab=tab;
    if(tab!=='historia') els.side.classList.remove('side-panel--history-expanded');
    els.side.classList.toggle('side-panel--atlas-expanded', tab==='mapas');
    const isSheet=window.innerWidth<=760 && SHEET_TABS.includes(tab);
    els.side.classList.toggle('side-panel--left', ['historia','padres','licencias','costumbres','diccionarios','conversor','extracanonico'].includes(tab));
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
    // Cerrar el panel sin abrir nada más también abandona lo que estuviera
    // traduciéndose — este es justo el caso que openPanel() no cubre.
    abandonPendingTranslations();
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
    // CSS: translateY(105%) para sheets. side-panel--left se quita en un
    // frame aparte a propósito: .side-panel--left tiene transition:none (el
    // panel izquierdo desaparece al instante, sin animar), pero si se quita
    // en el mismo classList.remove() que side-panel--open, el navegador ya
    // no ve esa clase al calcular la transición y aplica en su lugar la
    // regla base .side-panel{transition:width 0.28s} — se veía la animación
    // de "colapso de ancho" del panel derecho al cerrar Historia/Padres en
    // vez de desaparecer al instante (bug reportado por Juan, 2026-08-06).
    els.side.classList.remove('side-panel--open','side-panel--history-expanded','side-panel--atlas-expanded');
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

  function openResourceNavigation({panel,moduleId,entryId}={}){
    if(typeof panel!=='string' || typeof moduleId!=='string' || entryId==null) return false;
    if(panel==='historia' && moduleId==='eusebio-historia-eclesiastica'){
      churchHistoryOpenVolume=null;
      churchHistoryOpenId=String(entryId);
      churchHistoryOpenFromShelf=true;
      churchHistorySearchActive=false;
      openPanel('historia');
      return true;
    }
    if(panel==='costumbres'){
      costumbresOpenWork=moduleId;
      costumbresOpenId=String(entryId);
      costumbresDocData=null;
      openPanel('costumbres');
      return true;
    }
    if(panel==='diccionarios'){
      diccionariosOpenWork=moduleId;
      diccionariosOpenId=String(entryId);
      diccionariosDocData=null;
      openPanel('diccionarios');
      return true;
    }
    if(panel==='padres'){
      const section=Number(entryId);
      if(!Number.isInteger(section) || section<1) return false;
      patristicMode='docs';
      patristicOpenDoc=moduleId;
      patristicOpenSection=section;
      patristicDocData=null;
      openPanel('padres');
      return true;
    }
    return false;
  }

  window.VerboResourceNavigation=Object.freeze({open:openResourceNavigation});

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
  // 'comentario', renderMapsPanel,
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
      const selectedVerse = commentCtx.data?.verses?.find(v => v.n === commentCtx.activeVerseN);
      if(!focus && !verseCommentaries){
        const moduleInfo=selectedVerse?.commentaries?.find(c=>c.commentaryId===currentCommentary);
        focus = moduleInfo?.noteIds?.[0] || null;
      }
      panelTitleEl().textContent=t('comentario.title');
      const installed=commentaryCatalog();
      const currentManifest=catalog?.commentaries?.find(c=>c.manifest.id===currentCommentary)?.manifest;
      const commentarySourceLang=currentManifest?.language||null;
      const currentCommentaryIsBilingual=Object.values(commentCtx.data.notes).some(n=>n.commentaryId===currentCommentary && n.bilingual);
      const needsCommentaryTranslation=Boolean(commentarySourceLang) && commentarySourceLang!==contentLang() && !currentCommentaryIsBilingual;
      if(installed.length){
        // "● " antepuesto al texto visible cuando ya sabemos (sin verificación
        // extra: selectedVerse.commentaries ya viene filtrado por buildChapterData)
        // que ese comentarista tiene contenido para el versículo activo.
        const options=installed.map(c=>{
          const hasContent=selectedVerse?.commentaries?.some(sc=>sc.commentaryId===c.id);
          return `<option value="${c.id}" ${c.id===currentCommentary?'selected':''}>${hasContent?'● ':''}${escapeHTML(c.label)}</option>`;
        }).join('');
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
      wireDictionaryLinks(panelBodyEl());
      if(focus){ if(delayScroll) setTimeout(()=>scrollCommentToNote(focus),320); else scrollCommentToNote(focus); }
      // El guard de abajo (activeTab==='comentario' && panel abierto) es lo
      // que realmente evita el bug reportado: sin él, cerrar el panel (o
      // cambiar de pestaña) DENTRO de los 150ms no cancela este timer —
      // dispara igual, y como abandonPendingTranslations() ya está adentro
      // de applyCommentaryTranslation, esa llamada se ve a sí misma como
      // "legítima" (ella misma es quien fija la generación vigente) aunque
      // el usuario ya se haya ido. Sin este chequeo previo, el indicador
      // reaparecía para un panel que ya no estaba en pantalla.
      if(needsCommentaryTranslation) setTimeout(()=>{
        if(activeTab==='comentario' && els.side?.classList.contains('side-panel--open')) applyCommentaryTranslation(focus, commentarySourceLang);
      }, 150);
    }
    if(tab==='comparar'){ els.panelTitle.textContent=t('nav.compararVersiones'); renderCompare(focus||activeVerse()); }
    if(tab==='sermon-biblia') renderSermonBiblePanel(focus||activeVerse());
    if(tab==='diccionario') renderLanguagesPanel(focus || activeVerse());
    if(tab==='historia') renderChurchHistoryPanel();
    if(tab==='padres') renderPadresPanel(focus || activeVerse());
    if(tab==='predicas') renderPredicasPanel();
    if(tab==='costumbres') renderCostumbresPanel();
    if(tab==='extracanonico') renderExtracanonicoPanel();
    if(tab==='diccionarios') renderDiccionariosPanel();
    if(tab==='conversor') renderConversorPanel();
    if(tab==='exegesis') renderExegesis(focus || activeVerse());
    if(tab==='ajustes') renderAjustes();
    if(tab==='mapas') renderMapsPanel();
    if(tab==='atlas-bible') renderAtlasBiblePanel();
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
  function tcacheDelete(key){ try{ localStorage.removeItem(T_PREFIX+key); }catch{} }
  // v5: invalida respuestas explicativas o negativas que el traductor remoto
  // pudo haber almacenado como si fueran traducciones válidas.
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
    return `v5:${targetLang}:${noteId}:${(hash>>>0).toString(16)}`;
  }
  function htmlToPlainText(html){ return html.replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim(); }
  function htmlToTranslationBlocks(html){
    const box=document.createElement('div');
    box.innerHTML=html;
    const nodes=[...box.querySelectorAll('p,li,blockquote,h1,h2,h3,h4,h5,h6')].filter(node=>node.textContent.trim());
    const blocks=nodes.length ? nodes.map(node=>htmlToPlainText(node.innerHTML)) : [htmlToPlainText(html)];
    return blocks.map(block=>block.trim()).filter(block=>block.length>=2);
  }
  // htmlToTranslationBlocks() de arriba extrae solo texto plano antes de
  // traducir (ver esa función) — cualquier <a class="strong">/<a class="bible">
  // que hubiera en el original se pierde ahí. El traductor no suele alterar
  // códigos tipo "G1586" ni nombres de libros bíblicos, así que después de
  // traducir se puede re-detectar el mismo patrón y reconstruir el enlace
  // (incluida la regla de no enlazar rangos, "Juan 1:1–3": el navegador de
  // referencias solo puede saltar al primer versículo).
  function relinkStrongCodes(text){
    return text.replace(/\b([GH]\d{1,4})\b/g, (m,code)=>`<a class="strong" href="#s${code}">${code}</a>`);
  }
  let _bibleRefRelinkRe=null;
  function bibleRefRelinkRe(){
    if(_bibleRefRelinkRe) return _bibleRefRelinkRe;
    const names=[...new Set([...Object.values(bibleNameAliases).flat(), ...Object.values(bibleNameAliasesEn).flat()])]
      .sort((a,b)=>b.length-a.length)
      .map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    _bibleRefRelinkRe=new RegExp(`\\b(${names.join('|')})\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})\\b(?!\\s*[–‒-]\\s*\\d)`,'gi');
    return _bibleRefRelinkRe;
  }
  function relinkBibleReferences(text){
    return text.replace(bibleRefRelinkRe(), m=>`<a class="bible" href="#">${m}</a>`);
  }
  function translatedBlocksToHtml(blocks){
    return blocks.map(block=>`<p>${relinkBibleReferences(relinkStrongCodes(escapeHTML(block)))}</p>`).join('');
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

  // Indicador flotante "Traduciendo para usted…" mientras verboTranslate()
  // espera una respuesta en vivo (sin caché) de POST /translate — comentario,
  // Strong, Historia de la Iglesia y Padres Apostólicos comparten este mismo
  // punto de entrada. Un solo elemento reutilizado + contador de llamadas
  // activas: translateEntry() dispara varias verboTranslate() en paralelo
  // (pool de workers) para un solo bloque de texto y eso debe mostrar un
  // único indicador, no uno por bloque. Delay antes de mostrarlo para no
  // parpadear en respuestas rápidas (KV hit en el Worker); timeout de
  // seguridad por si algo se queda colgado.
  const TRANSLATE_INDICATOR_DELAY_MS = 180;
  const TRANSLATE_INDICATOR_SAFETY_MS = 18000;
  let translateIndicatorEl = null;
  let translateActiveCalls = 0;
  let translateShowTimer = null;
  let translateSafetyTimer = null;
  // Se incrementa cada vez que el usuario deja de esperar una traducción en
  // curso (cambia de versículo/panel/documento/idioma) — ver
  // abandonPendingTranslations(). La traducción de fondo sigue corriendo
  // (sigue siendo útil: calienta el caché en KV para el próximo lector) pero
  // deja de contar para el indicador, que solo debe reflejar lo que el
  // usuario tiene delante ahora mismo, no trabajo abandonado.
  let translateGeneration = 0;

  function ensureTranslateIndicatorEl(){
    if(translateIndicatorEl) return translateIndicatorEl;
    const el = document.createElement('div');
    el.className = 'verbo-translate-indicator';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="verbo-translate-indicator__spinner" aria-hidden="true"></span><span class="verbo-translate-indicator__text"></span>';
    document.body.appendChild(el);
    translateIndicatorEl = el;
    return el;
  }

  function hideTranslateIndicatorNow(){
    clearTimeout(translateShowTimer);
    if(translateIndicatorEl) translateIndicatorEl.classList.remove('verbo-translate-indicator--show');
  }

  // Devuelve la generación vigente en el momento de la llamada — el llamador
  // (verboTranslate) debe guardarla y pasarla de vuelta a
  // hideTranslatingIndicator() al terminar, para que una traducción
  // abandonada a mitad de camino no apague el indicador de una traducción
  // nueva y legítima que haya empezado después.
  function showTranslatingIndicator(){
    const gen = translateGeneration;
    translateActiveCalls++;
    if(translateActiveCalls === 1){
      clearTimeout(translateShowTimer);
      translateShowTimer = setTimeout(() => {
        if(gen !== translateGeneration || translateActiveCalls < 1) return;
        const el = ensureTranslateIndicatorEl();
        el.querySelector('.verbo-translate-indicator__text').textContent = t('site.translatingIndicator');
        el.classList.add('verbo-translate-indicator--show');
      }, TRANSLATE_INDICATOR_DELAY_MS);
      clearTimeout(translateSafetyTimer);
      translateSafetyTimer = setTimeout(() => {
        if(gen !== translateGeneration) return;
        translateActiveCalls = 0;
        hideTranslateIndicatorNow();
      }, TRANSLATE_INDICATOR_SAFETY_MS);
    }
    return gen;
  }

  function hideTranslatingIndicator(gen){
    if(gen !== translateGeneration) return; // generación ya abandonada, nada que hacer
    translateActiveCalls = Math.max(0, translateActiveCalls - 1);
    if(translateActiveCalls === 0){
      clearTimeout(translateSafetyTimer);
      hideTranslateIndicatorNow();
    }
  }

  // Llamar en cada punto donde el usuario deja de esperar la traducción que
  // estaba en curso (navega a otro versículo/sección/documento, cambia de
  // idioma, cierra el panel). No cancela los fetch en curso — solo deja de
  // contarlos para el indicador, que se oculta de inmediato.
  function abandonPendingTranslations(){
    translateGeneration++;
    translateActiveCalls = 0;
    clearTimeout(translateShowTimer);
    clearTimeout(translateSafetyTimer);
    hideTranslateIndicatorNow();
  }

  // silent=true: llamada de fondo para una generación ya abandonada (ver
  // translateEntry) — sigue pidiendo la traducción para calentar el caché,
  // pero sin pasar por showTranslatingIndicator()/hideTranslatingIndicator().
  // Sin esto, una llamada vieja que sigue en vuelo se ve indistinguible de
  // una traducción nueva y legítima (ambas leen translateGeneration como
  // "vigente" en el momento en que arrancan) y termina prolongando o
  // reactivando el indicador de un panel que ya no describe — el bug que
  // 198e0cc2 quiso cerrar. La generación abandonada ya no puede alimentar
  // el indicador, pero sí puede seguir traduciendo en silencio.
  function translateCompactMetadata(text, sourceLang, targetLang){
    const match=String(text||'').trim().match(/^(\d+)\s+(cap[ií]tulos?|fragmentos?|secciones?|chapters?|fragments?|sections?)$/i);
    if(!match || sourceLang===targetLang) return null;
    const count=Number(match[1]);
    const noun=match[2].toLocaleLowerCase();
    const kind=/cap[ií]t|chapter/.test(noun) ? 'chapter' : /fragment/.test(noun) ? 'fragment' : 'section';
    const translatedNoun=targetLang==='en'
      ? `${kind}${count===1?'':'s'}`
      : kind==='chapter' ? (count===1?'capítulo':'capítulos')
      : kind==='fragment' ? (count===1?'fragmento':'fragmentos')
      : (count===1?'sección':'secciones');
    return `${count} ${translatedNoun}`;
  }
  function isUsableTranslation(source, translated){
    if(typeof translated!=='string' || !translated.trim()) return false;
    const clean=translated.trim();
    const metaReply=/(?:i need (?:the )?source (?:text|content)|please provide (?:the )?(?:actual |source )?(?:text|content)|you(?:'ve| have) provided only|i (?:can(?:not|'t)|am unable to) translate|as an ai|necesito (?:el )?(?:texto|contenido) (?:fuente|original)|por favor (?:proporcione|facilite|env[ií]e) (?:el )?(?:texto|contenido))/i;
    if(metaReply.test(clean)) return false;
    const sourceLength=String(source||'').trim().length;
    if(sourceLength<=80 && clean.length>Math.max(180,sourceLength*6)) return false;
    return true;
  }

  async function verboTranslate(text, sourceLang='en', targetLang='es', {silent=false}={}){
    const compactTranslation=translateCompactMetadata(text,sourceLang,targetLang);
    if(compactTranslation) return compactTranslation;
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
    async function run(){
      if(text.length<=4500){
        const result=await fetchTranslate(text);
        if(!isUsableTranslation(text,result)) return null;
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
        if(!isUsableTranslation(chunk,r)) return null;
        parts.push(r);
      }
      return fixKnownBookNameMistranslations(parts.join(' '), targetLang);
    }
    if(silent) return run();
    const translateIndicatorGen = showTranslatingIndicator();
    try{ return await run(); }
    finally{ hideTranslatingIndicator(translateIndicatorGen); }
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
    // myGen: si el llamador (applyCommentaryTranslation, etc.) ya viene con
    // la generación abandonada al invocar esto, arranca igual pero en modo
    // silencioso (ver abajo) — sigue calentando el caché aunque el usuario
    // ya se haya ido, sin tocar el indicador de una traducción nueva y
    // legítima que haya empezado después (bug cerrado en 198e0cc2: una
    // llamada vieja que sigue en vuelo se ve indistinguible de una
    // traducción nueva para translateGeneration).
    const myGen=translateGeneration;
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
          // silent: esta generación ya fue abandonada (el usuario navegó a
          // otra sección/documento mientras este bloque o uno anterior del
          // mismo pool seguía en vuelo) — sigue pidiendo el resto de los
          // bloques para poder cachear la entrada completa, pero sin pasar
          // por showTranslatingIndicator(), que si no reactivaría el rótulo
          // "Traduciendo…" para un panel que el usuario ya cerró.
          const silent=myGen!==translateGeneration;
          const translated=await verboTranslate(blocks[i], sourceLang, targetLang, {silent});
          translatedBlocks[i]=translated!=null ? translated : blocks[i];
        }
      }
      await Promise.all(Array.from({length:Math.min(4,blocks.length)},worker));
      // A diferencia del indicador (que solo debe reflejar la generación
      // vigente), el resultado traducido sigue siendo válido y reutilizable
      // aunque la generación haya cambiado mientras se traducía — se cachea
      // siempre, para que la próxima visita a esta misma entrada (aunque
      // esta se haya abandonado a mitad de camino) lo encuentre ya listo en
      // vez de volver a pedirlo. Solo el valor que se le DEVUELVE al
      // llamador respeta la generación: si ya no es la vigente, se devuelve
      // el original sin traducir, igual que antes — el llamador nunca debe
      // aplicar al DOM un resultado de una generación que ya abandonó.
      const result=translatedBlocksToHtml(translatedBlocks);
      tcacheSet(cacheKey, result);
      return myGen===translateGeneration ? result : htmlContent;
    }catch{ return htmlContent; }
  }

  async function translateCommentaryHeader(noteId, field, text, sourceLang='en', targetLang='es'){
    if(!text) return text;
    const cacheKey=translationCacheKey(`${noteId}:${field}`,text,targetLang);
    const cached=tcacheGet(cacheKey);
    if(cached && isUsableTranslation(text,cached)) return cached;
    if(cached) tcacheDelete(cacheKey);
    const translated=await verboTranslate(text,sourceLang,targetLang);
    if(!isUsableTranslation(text,translated)) return text;
    tcacheSet(cacheKey,translated);
    return translated;
  }

  async function applyCommentaryTranslation(focusNoteId=null, sourceLang=null){
    abandonPendingTranslations();
    // abandonPendingTranslations() ya cambió la generación — esta es la
    // "propia" de esta llamada. Si alguien más la abandona a mitad de
    // camino (otra tarjeta, otro panel), translateGeneration vuelve a
    // cambiar y myGen queda desactualizada: el bucle de abajo debe cortar
    // ahí mismo, o cada tarjeta siguiente dispararía una traducción nueva
    // que reactivaría el indicador para un panel que el usuario ya cerró.
    const myGen=translateGeneration;
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
      if(myGen!==translateGeneration) return;
      const noteId=card.dataset.noteId;
      const bodyEl=card.querySelector('.note-card__body');
      if(!bodyEl||bodyEl.dataset.translated===target) continue;
      const note=commentaryContext().data.notes[noteId];
      if(!note) continue;
      if(note.bilingual) continue;
      for(const field of ['title','author']){
        if(myGen!==translateGeneration) return;
        const headerEl=card.querySelector(`[data-commentary-header="${field}"]`);
        if(!headerEl||headerEl.dataset.translated===target||!note[field]) continue;
        headerEl.dataset.translated='pending';
        const translatedHeader=await translateCommentaryHeader(noteId,field,note[field],source,target);
        if(myGen!==translateGeneration) return;
        if(headerEl.dataset.translated==='pending'){
          headerEl.textContent=translatedHeader;
          headerEl.dataset.translated=target;
        }
      }
      if(myGen!==translateGeneration) return;
      bodyEl.dataset.translated='pending';
      const translated=await translateEntry(noteId, note.body, source, target);
      if(myGen!==translateGeneration) return;
      if(bodyEl.dataset.translated==='pending'){
        const prevTop = noteId===focusNoteId ? card.getBoundingClientRect().top : null;
        bodyEl.innerHTML=`${translated}${originalSourceDetailsHtml(note.body,source)}`;
        wireDictionaryLinks(bodyEl);
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
    // myGen: capturada al entrar, no al llamar abandonPendingTranslations()
    // acá — eso ya lo hizo renderStrongPopupEntry() antes de invocar esta
    // función. Solo hace falta enterarse si alguien la abandona DESPUÉS
    // (usuario cierra el popup a mitad de esta entrada), para no seguir
    // traduciendo nodo por nodo y reactivar el indicador sin querer.
    const myGen=translateGeneration;
    const cacheKey=translationCacheKey(`strong:${code}`,htmlContent);
    const cached=tcacheGet(cacheKey); if(cached) return cached;
    const box=document.createElement('div'); box.innerHTML=htmlContent;
    const paragraphs=[...box.querySelectorAll('.lexicon-section > p')];
    for(const paragraph of paragraphs){
      if(myGen!==translateGeneration) return htmlContent;
      // Traducir solo el texto fuente. Los enlaces Strong quedan como nodos
      // independientes para que sigan abriendo sus respectivas entradas.
      const textNodes=[];
      const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) if(walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
      for(const node of textNodes){
        if(myGen!==translateGeneration) return htmlContent;
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
  // Comentarios/Notas/Mis prédicas/Diccionario (hasta entonces reemplazaban
  // el contenido de #sidePanel, tapando la Biblia), se generalizó para que
  // las cinco pestañas compartan este panel — mutuamente excluyentes entre
  // sí. Mapas queda fuera deliberadamente: usa el panel ancho normal y
  // reemplaza los demás paneles incluso dentro del modo predicación.
  // Se reutilizan las funciones de renderizado que ya existían mediante
  // renderPanel('comentario',…) y renderPredicasPanel, a través del redirect
  // panelTitleEl()/panelToolbarEl()/panelBodyEl() (ver justo antes de
  // renderPanel), en vez de duplicar esa lógica. "notas" no forma parte de
  // este panel: el ícono se intercepta antes (ver els.tabs.forEach) y abre
  // siempre el popup unificado de notas, global y fuera de este sistema —
  // así es el mismo componente en modo estudio y en modo predicación.
  const SERMON_SIDE_PANEL_TABS = ['comparar','comentario','predicas','diccionario'];
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
    else if(tab==='predicas') renderPredicasPanel();
    else if(tab==='diccionario') renderPanel('diccionario');
  }
  function isSermonSidePanelOpen(){
    return !!els.sermonComparePanel?.classList.contains('sermon-compare-panel--open');
  }
  function openSermonSidePanel(tab){
    if(sermonPanelTab==='diccionario' && tab!=='diccionario') closeStrongPopup();
    // Si el Atlas normal estaba abierto en #sidePanel, cualquier herramienta
    // secundaria vuelve primero al layout de paneles propio de predicación.
    if(activeTab==='mapas') closePanel();
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
    // Mismo patrón que verbo:uilang-changed (i18n.js): permite que módulos
    // aditivos reaccionen al modo sermón sin acoplarse a esta función.
    document.dispatchEvent(new CustomEvent('verbo:sermon-mode-changed', {detail:{sermonMode}}));
    if(els.readingPane) els.readingPane.hidden = sermonMode;
    if(els.editorPane) els.editorPane.hidden = !sermonMode;
    if(sermonMode) await initSermonEditor();
    if(data) renderChapter(activeVerse());
    notifySelectedPassageChange();
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
            // Cierra el índice de encabezados en cualquier cambio de contenido:
            // la lista se arma a partir de los <h1>-<h6> presentes al momento de
            // abrirla, así que puede quedar desactualizada si el usuario sigue
            // escribiendo (agrega/borra encabezados) con el panel abierto.
            editor.on('input change undo redo', ()=>{ sermonEditorContent=editor.getContent(); sermonDirty=true; closeSermonOutline(); });
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

  // ── Índice de encabezados de la prédica actual — desplegable para saltar
  // dentro de un bosquejo largo sin depender del Ctrl+F del navegador, que no
  // sabe hacer scroll dentro de un panel angosto ni resaltar temporalmente.
  // Lista los <h1>-<h6> reales del documento (los mismos "Encabezado 1"…
  // "Encabezado 6" del selector de bloque de la barra de herramientas):
  // un bosquejo que no usa encabezados no tiene nada que listar.
  const SERMON_OUTLINE_TAGS = ['H1','H2','H3','H4','H5','H6'];

  function sermonOutlineHeadings(){
    if(!sermonEditor) return [];
    const body = sermonEditor.getBody();
    if(!body) return [];
    return Array.from(body.querySelectorAll(SERMON_OUTLINE_TAGS.join(',')))
      .filter(el => el.textContent.trim());
  }

  function closeSermonOutline(){
    if(!els.predicaEsquemaResults) return;
    els.predicaEsquemaResults.hidden = true;
    els.predicaEsquemaResults.innerHTML = '';
    els.predicaEsquemaBtn?.setAttribute('aria-expanded', 'false');
  }

  // Resalta el encabezado elegido SIN dejarlo marcado en el contenido
  // guardado: envuelve su contenido en un <mark data-mce-bogus="1"> (TinyMCE
  // excluye siempre los nodos "bogus" de editor.getContent(), aunque el
  // usuario guarde justo en ese instante) dentro de undoManager.ignore()
  // (no genera un paso de deshacer ni ensucia el documento), y lo retira
  // solo después de un momento.
  function flashSermonOutlineHit(headingEl){
    if(!sermonEditor || !headingEl?.isConnected) return;
    try{
      const rng = document.createRange();
      rng.selectNodeContents(headingEl);
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
    }catch(error){ console.warn('No se pudo resaltar el encabezado en la prédica', error); }
  }

  // El nivel real del heading (h1..h6) solo decide la clase --hN aplicada;
  // el tamaño de cada fila ya NO reproduce el tamaño real del heading en el
  // editor — ver .editor-pane__outline-item--hN en style.css, que tiene su
  // propia escala fija en px (lista de navegación compacta, no vista previa
  // del texto). El orden de niveles sigue siendo el mismo, así que la
  // jerarquía se percibe igual aunque los tamaños ya no coincidan 1:1.
  function renderSermonOutline(){
    if(!els.predicaEsquemaResults) return;
    const headings = sermonOutlineHeadings();
    if(!headings.length){
      els.predicaEsquemaResults.innerHTML = `<div class="editor-pane__outline-empty">${t('predicas.esquemaVacio')}</div>`;
    }else{
      els.predicaEsquemaResults.innerHTML = headings.map((h,i) => {
        const level = h.tagName.slice(1);
        return `<button type="button" role="option" class="editor-pane__outline-item editor-pane__outline-item--h${level}" data-outline="${i}">${escapeHTML(h.textContent.trim())}</button>`;
      }).join('');
      els.predicaEsquemaResults.querySelectorAll('[data-outline]').forEach(btn => {
        // mousedown, no click: dispara antes que el listener de "click fuera"
        // (más abajo) cierre el desplegable.
        btn.addEventListener('mousedown', e => {
          e.preventDefault();
          flashSermonOutlineHit(headings[Number(btn.dataset.outline)]);
          closeSermonOutline();
        });
      });
    }
    els.predicaEsquemaResults.hidden = false;
    els.predicaEsquemaBtn?.setAttribute('aria-expanded', 'true');
  }

  els.predicaEsquemaBtn?.addEventListener('click', () => {
    if(els.predicaEsquemaResults && !els.predicaEsquemaResults.hidden){ closeSermonOutline(); return; }
    renderSermonOutline();
  });
  els.predicaEsquemaBtn?.addEventListener('keydown', e => {
    if(e.key !== 'Escape') return;
    closeSermonOutline();
    els.predicaEsquemaBtn.blur();
  });
  document.addEventListener('click', e => {
    if(!els.predicaEsquemaResults || els.predicaEsquemaResults.hidden) return;
    if(els.predicaEsquemaBtn?.contains(e.target) || els.predicaEsquemaResults.contains(e.target)) return;
    closeSermonOutline();
  });

  // ── Guardar (persistencia real de la prédica: local + push inmediato) ─────
  // Única vía de guardado hoy: no hay autoguardado por inactividad ni botón
  // "Salir" todavía (confirmado con Juan 2026-08-01) — mientras tanto, si el
  // pastor recarga sin haber tocado "Guardar", el contenido en el editor se
  // pierde (sermonEditorContent es solo memoria volátil). Por eso sermonDirty
  // + el beforeunload de más abajo: no evita la pérdida, pero al menos avisa
  // antes de recargar/cerrar con cambios sin guardar.
  document.getElementById('predicaTituloInput')?.addEventListener('input', ()=>{ sermonDirty=true; });
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
      sermonDirty = false;
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

  // Advertencia nativa del navegador (recargar/cerrar) si hay cambios de la
  // prédica sin guardar — no evita la pérdida (sigue sin haber autoguardado),
  // pero al menos le da al pastor la chance de cancelar y tocar "Guardar"
  // primero. Los navegadores ignoran el texto custom de returnValue y
  // muestran su propio diálogo genérico; no hace nada en móvil, que en su
  // mayoría no soporta beforeunload.
  window.addEventListener('beforeunload', e=>{
    if(!sermonMode || !sermonDirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // ── Traducir predicación (fidelidad literal, pensado para predicar con
  // intérprete en vivo) ───────────────────────────────────────────────────
  // Distinto del resto de la traducción del sitio: llama a POST
  // /translate-sermon-doc (sin caché KV — ver worker.js), y el resultado se
  // guarda como una prédica NUEVA en "Mis prédicas" (id:null fuerza una
  // entrada nueva) en vez de reemplazar la que está abierta en el editor —
  // si la traducción sale mal, el original nunca se tocó.
  // El idioma destino de "Traducir" se detecta a partir del contenido real
  // de la prédica (no del idioma de interfaz, VerboI18n.getUiLang()): la
  // interfaz de un pastor puede quedar fija en un idioma mientras escribe
  // prédicas en el otro, así que asumir que ambos coinciden traducía
  // siempre hacia el mismo idioma sin importar el de la prédica real.
  // Heurística simple por señales léxicas (tildes/ñ/¿¡ + palabras función
  // muy comunes) — suficiente para distinguir ES/EN en un documento
  // completo; si el texto es demasiado corto o ambiguo, getUiLang() sigue
  // sirviendo de respaldo razonable.
  const SERMON_LANG_ES_WORDS=/\b(que|de|la|el|en|y|los|las|un|una|para|con|por|no|se|su|es|como|más|pero|si|ya|muy|también|entre|sobre|desde|hasta|cuando|porque|dios|señor|jesús|cristo|nuestro|nuestra)\b/g;
  const SERMON_LANG_EN_WORDS=/\b(the|and|of|to|in|is|that|it|for|on|with|as|was|at|by|an|be|this|which|or|from|but|not|are|were|have|has|god|lord|jesus|christ|our)\b/g;
  function detectSermonSourceLang(text){
    const sample=(text||'').toLowerCase().trim();
    if(!sample) return null;
    if(/[ñ¿¡]|[áéíóúü]/.test(sample)) return 'es';
    const esHits=(sample.match(SERMON_LANG_ES_WORDS)||[]).length;
    const enHits=(sample.match(SERMON_LANG_EN_WORDS)||[]).length;
    if(esHits===0 && enHits===0) return null;
    return esHits>=enHits ? 'es' : 'en';
  }
  function sermonTranslateTargetLang(plainText){
    const detectedSource=detectSermonSourceLang(plainText);
    if(detectedSource) return detectedSource==='es' ? 'en' : 'es';
    // Contenido demasiado corto/ambiguo para detectar un idioma (p.ej. una
    // prédica de prueba de pocas palabras): igual que antes de la detección
    // por contenido, se usa el idioma de interfaz como pista razonable.
    return window.VerboI18n?.getUiLang()==='es' ? 'en' : 'es';
  }
  async function handleTranslateSermon(){
    const btn=document.getElementById('traducirPredicaBtn');
    if(!sermonEditor || btn?.disabled) return;
    const originalLabel=btn.textContent;
    btn.disabled=true;
    btn.textContent=t('predicas.traduciendoBtn');
    try{
      const html=sermonEditor.getContent();
      const plainText=sermonEditor.getBody()?.textContent || '';
      const targetLang=sermonTranslateTargetLang(plainText);
      const bibleRefs=await resolveBibleRefsForTranslation(plainText, targetLang).catch(()=>[]);
      const base=translateWorkerBase();
      if(!base) throw new Error('worker-base-unavailable');
      const controller=new AbortController();
      // Traducir un documento entero (sin caché, prioridad de fidelidad
      // literal que no comprime la salida) tarda bastante más que un
      // fragmento suelto — 30s cortaba prédicas largas reales antes de
      // que Anthropic terminara de responder.
      const timeoutId=setTimeout(()=>controller.abort(), 90000);
      let resp;
      try{
        resp=await fetch(`${base}/translate-sermon-doc`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ html, targetLang, bibleRefs }),
          signal:controller.signal
        });
      } finally { clearTimeout(timeoutId); }
      if(!resp.ok){
        // 400 = error de validación (documento vacío/demasiado largo, etc.):
        // el Worker manda un mensaje puntual, más útil que el toast genérico.
        if(resp.status===400){
          const errJson=await resp.json().catch(()=>null);
          throw new Error(errJson?.error || `translate-sermon-doc ${resp.status}`, {cause:'validation'});
        }
        throw new Error(`translate-sermon-doc ${resp.status}`);
      }
      const json=await resp.json();
      const translation=typeof json?.translation==='string' ? json.translation : '';
      if(!translation.trim()) throw new Error('empty-translation');
      const tituloInput=document.getElementById('predicaTituloInput');
      const suffix=targetLang==='en' ? ' (EN)' : ' (ES)';
      const baseTitulo=(tituloInput?.value || '').trim();
      // Sin título propio, dejamos que savePredica derive uno del contenido
      // traducido (mismo criterio que el botón "Guardar") en vez de guardar
      // el texto del placeholder como si fuera un título real.
      const titulo=baseTitulo ? baseTitulo + suffix : '';
      VerboBackup.savePredica({ id:null, titulo, contenido:translation, pasaje_base:'' });
      if(sermonPanelTab==='predicas') renderPredicasPanel();
      toast(t('predicas.traducirExitoToast'));
    }catch(error){
      console.error('[sermon] no se pudo traducir la prédica', error);
      toast(error?.cause==='validation' && error.message ? error.message : t('predicas.traducirErrorToast'));
    } finally {
      btn.disabled=false;
      btn.textContent=originalLabel;
    }
  }
  els.editorPane?.querySelector('#traducirPredicaBtn')?.addEventListener('click', handleTranslateSermon);

  // ── Panel "Mis prédicas" (guardar/abrir/eliminar, modo sermón) ─────────────

  function newPredica(){
    if(!sermonEditor) return;
    currentPredicaId = null;
    sermonEditorContent = '';
    sermonEditor.setContent('');
    sermonDirty = false;
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
    sermonDirty = false;
    const tituloInput = document.getElementById('predicaTituloInput');
    if(tituloInput) tituloInput.value = p.titulo || '';
    closeSermonSidePanel();
    // Por debajo de 901px, "Mis prédicas" no vive en .sermon-compare-panel
    // (closeSermonSidePanel() de arriba no le hace nada ahí) sino en
    // #sidePanel, el panel único de siempre (ver app.js, listener de los
    // íconos del riel: SERMON_SIDE_PANEL_TABS cae a openPanel()/closePanel()
    // bajo min-width:901px). Cerrarlo con closePanel() es seguro sin
    // importar su estado (no-op si ya estaba cerrado). Solo por debajo de
    // 860px (mismo umbral que style.css:1467) #sidePanel se vuelve overlay
    // fijo que tapa el editor — entre 761-900px sigue siendo panel lateral
    // y no hace falta cerrarlo. Desktop (≥901px) no entra acá: ese caso ya
    // quedó resuelto arriba por closeSermonSidePanel().
    if(window.matchMedia('(max-width: 860px)').matches) closePanel();
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

  // ── Popup unificado de notas (reemplaza los tres patrones de UI que
  // convivían: textarea único de "Mis notas", editor embebido de Padres, y
  // modal "Nota rápida" + panel "Notas de Historia" separados) por un solo
  // overlay flotante, arrastrable y redimensionable, con seis pestañas.
  // Mismo componente en modo estudio y en modo predicación: se intercepta el
  // click del ícono "notas" ANTES de la rama de modo sermón (ver
  // els.tabs.forEach más abajo), así nunca pasa por openSermonSidePanel — es
  // un overlay de nivel superior (document.body), no anidado en #panelBody ni
  // en #sermonComparePanelBody.
  // Las seis pestañas (Capítulo incluida) comparten EXACTAMENTE el mismo
  // modelo: lista + búsqueda + "Nueva nota" siempre visible + edición inline
  // (getNotas/addNota/getNotaById/updateNotaById/deleteNotaById) -- ya no hay
  // reglas distintas por pestaña (Capítulo dejó de ser un textarea único con
  // setNota/getNota; ahora admite varias notas por capítulo igual que el
  // resto, a pedido de Juan 2026-08-26: "no pueden trabajar cada uno
  // diferente"). Ver PLAN-POPUP-NOTAS-UNIFICADO.md para el análisis de
  // migración de datos original. ──
  // Estado y constantes declarados arriba del todo (ver bloque cerca de
  // "els" al inicio del archivo) -- NP_TABS/NP_TIPOS_POR_TAB/npEl/etc.

  function npBuild(){
    if(npEl) return;
    npEl=document.createElement('div');
    npEl.className='np-popup';
    npEl.hidden=true;
    npEl.innerHTML=`
      <div class="np-popup__header" id="npHeader">
        <h3 class="np-popup__title" data-i18n="notasPopup.title">${t('notasPopup.title')}</h3>
        <button type="button" class="np-popup__close" id="npClose" aria-label="${t('notasPopup.cerrarAria')}" data-i18n-attr="aria-label:notasPopup.cerrarAria">×</button>
      </div>
      <div class="np-popup__tabs" id="npTabsBar"></div>
      <div class="np-popup__body" id="npBodyEl"></div>`;
    document.body.appendChild(npEl);
    // Posición/tamaño inicial, distinto en móvil (casi toda la pantalla) que
    // en escritorio (ventana chica arriba a la derecha) — una sola vez: a
    // partir de acá, arrastrar/redimensionar reemplaza estos valores con
    // estilos inline que persisten mientras dure la sesión de navegación
    // (no hace falta guardarlos en ningún lado para eso).
    if(window.matchMedia('(max-width: 760px)').matches){
      Object.assign(npEl.style,{left:'8px',right:'8px',top:'64px',bottom:'8px',width:'auto',height:'auto'});
    } else {
      Object.assign(npEl.style,{top:'90px',right:'24px',width:'380px',height:'520px'});
    }
    npHeaderEl=npEl.querySelector('#npHeader');
    npTabsEl=npEl.querySelector('#npTabsBar');
    npBodyEl=npEl.querySelector('#npBodyEl');
    npEl.querySelector('#npClose').addEventListener('click', closeNotasPopup);
    // Arrastre por pointer events (mousedown+touch unificados) — no existe
    // ningún precedente de drag en el repo, se construye desde cero. El
    // resize usa la propiedad nativa CSS resize:both (ver notas-popup.css) en
    // vez de lógica propia: cubre "redimensionable desde al menos una
    // esquina" sin código adicional que pueda introducir bugs.
    npHeaderEl.addEventListener('pointerdown', npDragStart);
    npHeaderEl.addEventListener('pointermove', npDragMove);
    npHeaderEl.addEventListener('pointerup', npDragEnd);
    npHeaderEl.addEventListener('pointercancel', npDragEnd);
  }
  function npDragStart(e){
    if(e.target.closest('.np-popup__close')) return;
    const rect=npEl.getBoundingClientRect();
    npEl.style.left=rect.left+'px'; npEl.style.top=rect.top+'px';
    npEl.style.right='auto'; npEl.style.bottom='auto';
    npDrag={dx:e.clientX-rect.left, dy:e.clientY-rect.top};
    npHeaderEl.setPointerCapture(e.pointerId);
  }
  function npDragMove(e){
    if(!npDrag) return;
    const left=Math.min(Math.max(0,e.clientX-npDrag.dx), window.innerWidth-Math.min(120,npEl.offsetWidth));
    const top=Math.min(Math.max(0,e.clientY-npDrag.dy), window.innerHeight-40);
    npEl.style.left=left+'px'; npEl.style.top=top+'px';
  }
  function npDragEnd(){ npDrag=null; }

  function npRenderTabs(){
    npTabsEl.innerHTML=NP_TABS.map(tabDef=>`<button type="button" class="np-popup__tab${tabDef.id===npActiveTab?' np-popup__tab--active':''}" data-np-tab="${tabDef.id}">${t(tabDef.label)}</button>`).join('');
    npTabsEl.querySelectorAll('[data-np-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      npActiveTab=btn.dataset.npTab; npOpenNoteId=null; npQuery='';
      npRenderTabs(); npRenderBody();
    }));
  }

  function openNotasPopup(){
    npBuild();
    npEl.hidden=false;
    document.querySelectorAll('.tab-rail__btn[data-tab="notas"]').forEach(b=>b.classList.add('tab-rail__btn--active'));
    npRenderTabs();
    npRenderBody();
  }
  function closeNotasPopup(){
    if(!npEl) return;
    npEl.hidden=true;
    document.querySelectorAll('.tab-rail__btn[data-tab="notas"]').forEach(b=>b.classList.remove('tab-rail__btn--active'));
  }
  function toggleNotasPopup(){ (npEl && !npEl.hidden) ? closeNotasPopup() : openNotasPopup(); }
  function isNotasPopupOpen(){ return !!(npEl && !npEl.hidden); }
  // Refresca el contenido del popup si está abierto -- necesario porque el
  // popup es un overlay independiente que no pasa por openPanel/renderPanel
  // al navegar (cambiar de capítulo, abrir otra entrada de Costumbres/
  // Extracanónico/Diccionarios/Historia/Padres, abrir/cerrar el popup de
  // Strong): sin este gancho, "Nueva nota" quedaba invisible o la nota de
  // Capítulo mostraba el capítulo viejo hasta cerrar y reabrir el popup a
  // mano (reportado por Juan, 2026-08-26).
  function npRefreshIfOpen(){ if(isNotasPopupOpen()) npRenderBody(); }

  // ── "Entrada actual" por pestaña: lee el mismo estado interno que ya usan
  // los paneles de lectura de cada sección (evita el problema que sorteaba
  // historia-nota-rapida.js leyendo atributos del DOM para esquivar el
  // aislamiento de IIFE — acá no hace falta, este código vive en la misma
  // función que ese estado). Usado por el botón "Nueva nota" y para fijar
  // contexto.obra/workId al crear una nota nueva. ──
  function npCurrentEntry(tab){
    if(tab==='capitulo'){
      if(!data?.meta) return null;
      const ref=`${data.meta.bookId}-${data.meta.chapter}`;
      const label=`${data.meta.book} ${data.meta.chapter}`;
      return { tipo:'biblia', ref, titulo:label, contexto:{ obra:label } };
    }
    if(tab==='historia'){
      if(activeTab==='historia' && churchHistoryOpenId){
        const entry=(churchHistoryEntries||[]).find(e=>e.id===churchHistoryOpenId);
        if(!entry) return null;
        return { tipo:'historia', ref:churchHistoryOpenId, titulo:entry.title, contexto:{ obra:churchHistoryBookLabel(churchHistoryBookKey(entry)) } };
      }
      if(activeTab==='padres' && patristicMode==='docs' && patristicOpenDoc && patristicOpenSection!=null && patristicDocData){
        const section=(patristicDocData.sections||[]).find(s=>s.n===patristicOpenSection);
        if(!section) return null;
        return { tipo:'padres', ref:`${patristicOpenDoc}-${patristicOpenSection}`, titulo:section.title, contexto:{ obra:patristicDocData.manifest.abbreviation||patristicDocData.manifest.name, capitulo:section.title } };
      }
      return null;
    }
    if(tab==='costumbres'){
      if(!costumbresOpenId || !costumbresDocData) return null;
      const entry=(costumbresDocData.entries||[]).find(e=>e.id===costumbresOpenId);
      if(!entry) return null;
      return { tipo:'costumbres', ref:costumbresOpenId, titulo:entry.titulo, contexto:{ obra:costumbresDocData.manifest.abbreviation||costumbresDocData.manifest.name, workId:costumbresOpenWork } };
    }
    if(tab==='extracanonico'){
      if(!extracanonicoOpenId || !extracanonicoDocData) return null;
      const entry=(extracanonicoDocData.entries||[]).find(e=>e.id===extracanonicoOpenId);
      if(!entry) return null;
      return { tipo:'extracanonico', ref:extracanonicoOpenId, titulo:entry.titulo, contexto:{ obra:extracanonicoDocData.manifest.abbreviation||extracanonicoDocData.manifest.name, workId:extracanonicoOpenWork } };
    }
    if(tab==='diccionarios'){
      if(!diccionariosOpenId || !diccionariosDocData) return null;
      const entry=(diccionariosDocData.entries||[]).find(e=>e.id===diccionariosOpenId);
      if(!entry) return null;
      return { tipo:'diccionarios', ref:diccionariosOpenId, titulo:entry.titulo, contexto:{ obra:diccionariosDocData.manifest.abbreviation||diccionariosDocData.manifest.name, workId:diccionariosOpenWork } };
    }
    if(tab==='idiomas'){
      const code=openStrongPopupRoot ? strongPopupEls().code?.textContent : null;
      if(!code) return null;
      return { tipo:'idiomas', ref:code, titulo:code, contexto:{ obra:code } };
    }
    return null;
  }

  function npContextoLabel(item){
    const c=item.contexto;
    if(c?.obra && c?.capitulo) return `${c.obra} — ${c.capitulo}`;
    if(c?.obra) return c.obra;
    const tipo=item.ubicacion?.tipo;
    if(tipo==='biblia') return item.ubicacion?.ref||'';
    if(tipo==='historia') return t('rail.historia');
    if(tipo==='padres') return t('rail.padres');
    if(tipo==='costumbres') return t('rail.costumbres');
    if(tipo==='extracanonico') return t('rail.extracanonico');
    if(tipo==='diccionarios') return t('rail.diccionarios');
    if(tipo==='idiomas') return item.ubicacion?.ref||'';
    return '';
  }
  function npMatches(item, displayTitle, query){
    if(!query) return true;
    const haystack=normalizeSearchText(`${displayTitle} ${npContextoLabel(item)} ${htmlToPlainText(item.texto||'')}`);
    return normalizeSearchText(query).split(/\s+/).filter(Boolean).every(word=>haystack.includes(word));
  }
  function npRowHTML(item, kind){
    const displayTitle=item.titulo || npContextoLabel(item);
    const snippet=kind==='nota' ? htmlToPlainText(item.texto||'').slice(0,140) : npContextoLabel(item);
    return `<div class="predicas-list__item" data-np-id="${escapeHTML(item.id)}" data-np-kind="${kind}">
      <div class="predicas-list__info">
        <p class="predicas-list__title">${kind==='nota'?'✎':'★'} ${escapeHTML(displayTitle)}</p>
        <span class="predicas-list__date">${escapeHTML(snippet)}</span>
      </div>
      <div class="predicas-list__actions">
        <button type="button" class="predicas-list__btn" data-np-open="1">${t('notasPopup.abrir')}</button>
        ${kind==='nota'?`<button type="button" class="predicas-list__btn predicas-list__btn--danger" data-np-delete="1">${t('notasPopup.eliminarNota')}</button>`:''}
      </div>
    </div>`;
  }

  // Navega a la entrada de origen de una nota/marcador y cierra el popup —
  // mismo mecanismo que historiaNotasOpen() tenía antes para historia/padres,
  // generalizado a costumbres/extracanónico/diccionarios (que ahora guardan
  // contexto.workId al crear la nota, justamente para poder recargar la obra
  // acá) e idiomas (abre el panel de Idiomas y el popup de definición Strong
  // para ese código).
  async function npOpenContextFor(tab, item){
    const ref=item.ubicacion.ref;
    if(tab==='capitulo'){
      const lastDash=ref.lastIndexOf('-');
      currentBook=ref.slice(0,lastDash);
      currentChapter=Number(ref.slice(lastDash+1));
      els.book.value=currentBook;
      await refreshChapters();
      await loadPassage();
      if(sermonMode && window.matchMedia('(min-width: 901px)').matches) openSermonSidePanel('comparar');
      else openPanel('comparar');
    } else if(tab==='historia'){
      if(item.ubicacion.tipo==='padres'){
        const lastDash=ref.lastIndexOf('-');
        patristicMode='docs';
        patristicOpenDoc=ref.slice(0,lastDash);
        patristicOpenSection=Number(ref.slice(lastDash+1));
        patristicDocData=null;
        openPanel('padres');
      } else {
        churchHistoryOpenId=ref;
        churchHistoryOpenFromShelf=true;
        openPanel('historia');
      }
    } else if(tab==='costumbres'){
      costumbresOpenWork=item.contexto?.workId||null; costumbresOpenId=ref; costumbresDocData=null; openPanel('costumbres');
    } else if(tab==='extracanonico'){
      extracanonicoOpenWork=item.contexto?.workId||null; extracanonicoOpenId=ref; extracanonicoDocData=null; openPanel('extracanonico');
    } else if(tab==='diccionarios'){
      diccionariosOpenWork=item.contexto?.workId||null; diccionariosOpenId=ref; diccionariosDocData=null; openPanel('diccionarios');
    } else if(tab==='idiomas'){
      if(sermonMode && window.matchMedia('(min-width: 901px)').matches) openSermonSidePanel('diccionario');
      else openPanel('diccionario');
      openStrongPopup(ref);
    }
    closeNotasPopup();
  }

  // Vista de detalle: siempre editable inline (título+texto, autoguardado
  // debounce 400ms vía VerboBackup.updateNotaById) — nunca un formulario
  // aparte que haya que reabrir, a diferencia del modal viejo que solo creaba
  // notas nuevas y no permitía editar las ya guardadas.
  // "Ver en contexto/definición" solo tiene sentido si el ref de la nota
  // apunta a algo navegable: Capítulo e Idiomas siempre lo son (el ref es
  // siempre un libro-capítulo o un código Strong válido); las demás
  // categorías solo cuando la nota se creó con una entrada realmente abierta
  // (contexto truthy) -- una nota suelta (creada sin entrada abierta, ref
  // genérico) no tiene a dónde navegar.
  function npCanNavigate(item, tab){
    return tab==='capitulo' || !!item.contexto;
  }
  function npDetailHTML(item, tab){
    return `<button type="button" class="note-card__copy" id="npDetailBack">${t('notasPopup.volver')}</button>
      <div class="np-note-edit">
        <input type="text" id="npDetailTitulo" class="editor-pane__title-input" placeholder="${t('notasPopup.tituloPlaceholder')}" value="${escapeHTML(item.titulo||'')}">
        <textarea id="npDetailTexto" class="personal-note-form__area" placeholder="${t('notasPopup.notaPlaceholder')}">${escapeHTML(item.texto||'')}</textarea>
        <div class="personal-note-form__status" id="npDetailStatus">${item.texto?t('notasPopup.guardado'):''}</div>
        <div class="history-entry-actions">
          <button type="button" class="note-card__copy" id="npDetailCopy">${t('notasPopup.copiar')}</button>
          ${npCanNavigate(item,tab)?`<button type="button" class="note-card__copy" id="npDetailContext">${t(tab==='idiomas'?'notasPopup.verDefinicion':'notasPopup.verContexto')}</button>`:''}
          <button type="button" class="predicas-list__btn predicas-list__btn--danger" id="npDetailDelete">${t('notasPopup.eliminarNota')}</button>
        </div>
      </div>`;
  }
  function npWireDetail(item, tab){
    document.getElementById('npDetailBack')?.addEventListener('click',()=>{ npOpenNoteId=null; npRenderBody(); });
    const tituloInput=document.getElementById('npDetailTitulo');
    const textoArea=document.getElementById('npDetailTexto');
    const status=document.getElementById('npDetailStatus');
    let timer;
    const save=()=>{
      VerboBackup.updateNotaById(item.id, textoArea.value, { titulo: tituloInput.value, contexto: item.contexto });
      if(status) status.textContent=t('notasPopup.guardado');
    };
    const scheduleSave=()=>{ if(status) status.textContent=t('notasPopup.escribiendo'); clearTimeout(timer); timer=setTimeout(save,400); };
    textoArea?.addEventListener('input',scheduleSave);
    tituloInput?.addEventListener('input',scheduleSave);
    document.getElementById('npDetailCopy')?.addEventListener('click',()=>{
      const titulo=tituloInput.value?`${tituloInput.value}\n\n`:'';
      copyToClipboard(`${titulo}${textoArea.value||''}`);
    });
    document.getElementById('npDetailContext')?.addEventListener('click',()=>npOpenContextFor(tab, item));
    document.getElementById('npDetailDelete')?.addEventListener('click',()=>{
      if(!window.confirm(t('notasPopup.eliminarNotaConfirm'))) return;
      VerboBackup.deleteNotaById(item.id);
      npOpenNoteId=null; npRenderBody();
    });
  }

  // "Nueva nota": siempre visible en las seis pestañas -- ya no depende de
  // tener una entrada abierta ahora mismo en otro lado (eso generaba
  // comportamiento distinto por pestaña y confundía: "Nueva nota" aparecía o
  // no según lo que Juan tuviera abierto detrás del popup, 2026-08-26). Si
  // hay una entrada actual (npCurrentEntry), la nota nueva se ancla a ella
  // (permite "Ver en contexto" después); si no, se guarda como nota suelta
  // de esa categoría, sin ancla de navegación. Idiomas sigue siendo la única
  // con campo de código a mano, por ser un glosario plano.
  function npNewNoteHTML(){
    return `<div class="np-new-note"><button type="button" class="predicas-list__btn" id="npNewSave">${t('notasPopup.nuevaNota')}</button></div>`;
  }
  function npWireNewNote(tab){
    document.getElementById('npNewSave')?.addEventListener('click',()=>{
      // Sin entrada/código actual detectado (npCurrentEntry): nota suelta de
      // la categoría, sin ancla de navegación (contexto null -- npDetailHTML
      // no ofrece "Ver en contexto/definición" para estas). tipo por defecto
      // = el primero de la lista de tipos de la pestaña.
      const current=npCurrentEntry(tab) || { tipo:NP_TIPOS_POR_TAB[tab][0], ref:'general', titulo:'', contexto:null };
      const nota=VerboBackup.addNota(current.ref, '', { tipo:current.tipo, titulo:current.titulo, contexto:current.contexto });
      npOpenNoteId=nota.id; npRenderBody();
    });
  }

  function npRenderBody(){
    if(npOpenNoteId){
      const item=VerboBackup.getNotaById(npOpenNoteId);
      if(item){ npBodyEl.innerHTML=npDetailHTML(item, npActiveTab); npWireDetail(item, npActiveTab); return; }
      npOpenNoteId=null; // borrada en otra pestaña/sesión — cae a la lista
    }
    const tipos=NP_TIPOS_POR_TAB[npActiveTab];
    const query=npQuery.trim();
    let notas=VerboBackup.getNotas(tipos);
    const marcadores=npActiveTab==='historia' ? VerboBackup.getMarcadores().filter(m=>tipos.includes(m.ubicacion?.tipo)) : [];
    // Idiomas: si hay un popup de definición Strong abierto y ya existe una
    // nota para ese código, se destaca arriba (fuera de la lista normal) para
    // no perder el acceso rápido "la nota de lo que estoy viendo ahora"
    // dentro del glosario global — solo mientras no haya una búsqueda activa.
    let pinnedHTML='';
    if(npActiveTab==='idiomas' && !query){
      const code=openStrongPopupRoot ? strongPopupEls().code?.textContent : null;
      const pinned=code ? notas.find(n=>n.ubicacion.ref===code) : null;
      if(pinned){
        notas=notas.filter(n=>n!==pinned);
        pinnedHTML=`<div class="dictionary-library__count">${escapeHTML(t('notasPopup.notaDeActual'))}</div><div class="dictionary-library">${npRowHTML(pinned,'nota')}</div>`;
      }
    }
    const notasFiltradas=notas.filter(n=>npMatches(n, n.titulo||npContextoLabel(n), query));
    const marcadoresFiltrados=marcadores.filter(m=>npMatches(m, npContextoLabel(m), query));
    const hasAny=pinnedHTML || notasFiltradas.length || marcadoresFiltrados.length;
    npBodyEl.innerHTML=`<input type="search" class="search-panel-input" id="npSearch" placeholder="${t('notasPopup.buscarPlaceholder')}" autocomplete="off" value="${escapeHTML(npQuery)}">${npNewNoteHTML()}${pinnedHTML}
      ${!hasAny ? emptyState('📝', query?t('notasPopup.sinResultados',{query:escapeHTML(query)}):t('notasPopup.vacio')) : `
      ${notasFiltradas.length?`<div class="dictionary-library__count">${escapeHTML(t('notasPopup.seccionNotas'))} (${notasFiltradas.length})</div><div class="dictionary-library">${notasFiltradas.map(n=>npRowHTML(n,'nota')).join('')}</div>`:''}
      ${marcadoresFiltrados.length?`<div class="dictionary-library__count">${escapeHTML(t('notasPopup.seccionMarcadores'))} (${marcadoresFiltrados.length})</div><div class="dictionary-library">${marcadoresFiltrados.map(m=>npRowHTML(m,'marcador')).join('')}</div>`:''}
      `}`;
    document.getElementById('npSearch')?.addEventListener('input',e=>{ npQuery=e.target.value; npRenderBody(); });
    npWireNewNote(npActiveTab);
    npBodyEl.querySelectorAll('[data-np-open]').forEach(btn=>{
      const row=btn.closest('[data-np-id]');
      if(row.dataset.npKind==='nota'){
        btn.addEventListener('click',()=>{ npOpenNoteId=row.dataset.npId; npRenderBody(); });
      } else {
        const item=marcadores.find(m=>m.id===row.dataset.npId);
        btn.addEventListener('click',()=>{ if(item) npOpenContextFor(npActiveTab, item); });
      }
    });
    npBodyEl.querySelectorAll('[data-np-delete]').forEach(btn=>{
      const row=btn.closest('[data-np-id]');
      btn.addEventListener('click',()=>{
        if(!window.confirm(t('notasPopup.eliminarNotaConfirm'))) return;
        VerboBackup.deleteNotaById(row.dataset.npId);
        npRenderBody();
      });
    });
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
      notifySelectedPassageChange();
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
        notifySelectedPassageChange();
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
    if(row){ document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active')); row.classList.add('verse--active'); row.scrollIntoView({behavior:'smooth',block:'center'}); notifySelectedPassageChange(); }
  }

  // La lista de resultados debe mostrar el texto en la Biblia ACTIVA del
  // usuario, no en la Biblia base del índice — salvo que la activa sea
  // remota (API.Bible), donde traer el texto de hasta ~90 resultados
  // dispararía demasiadas peticiones y podría chocar con el límite de la
  // API; en ese caso se deja el texto de la Biblia base como vista previa
  // (marcado con previewSource) y se resuelve a la Biblia real recién al
  // abrir un resultado puntual (openSearchResult ya usa currentVersion).
  async function resolveResultsToActiveVersion(results, versionId, previewLabel){
    const active=bibleCatalog().find(v=>v.id===effectiveBibleVersionId(versionId));
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
    wireDictionaryLinks(els.panelBody);
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
          wireDictionaryLinks(bodyEl);
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
    if(row){ document.querySelectorAll('.verse--active').forEach(x=>x.classList.remove('verse--active')); row.classList.add('verse--active'); row.scrollIntoView({behavior:'smooth',block:'center'}); notifySelectedPassageChange(); }
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

  // ── Escaneo de referencias bíblicas dentro de un texto largo (traducción
  // de Predicación) ───────────────────────────────────────────────────────
  // A diferencia de parseSearchReference (asume que TODO el input es una
  // única referencia), esto encuentra cualquier cantidad de referencias
  // sueltas dentro de un documento normal — para resolverlas contra la
  // Biblia local del idioma destino antes de traducir una prédica completa.
  let bibleAliasScanPattern = null;
  function buildBibleAliasScanPattern(){
    if(bibleAliasScanPattern) return bibleAliasScanPattern;
    const aliasToBook = new Map();
    for(const dict of [bibleNameAliases, bibleNameAliasesEn]){
      for(const bookId of Object.keys(dict)){
        for(const alias of dict[bookId]){
          const norm = normalizeBibleName(alias);
          if(norm) aliasToBook.set(norm, bookId);
        }
      }
    }
    const sorted=[...aliasToBook.keys()].sort((a,b)=>b.length-a.length);
    const escaped=sorted.map(a=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    const regex=new RegExp(`\\b(${escaped.join('|')})\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?`,'gi');
    bibleAliasScanPattern={regex,aliasToBook};
    return bibleAliasScanPattern;
  }
  function findBibleReferencesInPlainText(text){
    const {regex,aliasToBook}=buildBibleAliasScanPattern();
    const normalized=normalizeBibleName(String(text||''));
    regex.lastIndex=0;
    const results=[];
    const seen=new Set();
    let m;
    while((m=regex.exec(normalized))){
      const bookId=aliasToBook.get(m[1]);
      if(!bookId) continue;
      const chapter=Number(m[2]);
      const verseStart=Number(m[3]);
      const verseEnd=m[4] ? Number(m[4]) : verseStart;
      const key=`${bookId}.${chapter}.${verseStart}-${verseEnd}`;
      if(seen.has(key)) continue;
      seen.add(key);
      results.push({bookId,chapter,verseStart,verseEnd});
    }
    return results;
  }
  // Resuelve cada referencia encontrada contra la Biblia local del idioma
  // destino (BV2026 en español, BSB en inglés — mismo par que usa el índice
  // del buscador semántico, VerboModules.semanticSearch.basePaths) para que
  // las citas bíblicas de la prédica traducida coincidan con lo que Verbo ya
  // publica, en vez de que el modelo improvise su propia traducción de la
  // cita. Si una referencia no se puede resolver (libro/capítulo fuera de
  // rango, error de red), se omite sin romper el resto de la traducción.
  const SERMON_BIBLE_MANIFEST_BY_LANG = { es:'modules/bibles/rv-verbo/manifest.json', en:'modules/bibles/bsb/manifest.json' };
  async function resolveBibleRefsForTranslation(plainText, targetLang){
    const manifestPath=SERMON_BIBLE_MANIFEST_BY_LANG[targetLang];
    if(!manifestPath) return [];
    const refs=findBibleReferencesInPlainText(plainText).slice(0,40);
    const chapterCache=new Map();
    const out=[];
    for(const ref of refs){
      const cacheKey=`${ref.bookId}.${ref.chapter}`;
      let loaded=chapterCache.get(cacheKey);
      if(loaded===undefined){
        loaded=await VerboModules.loadBible(manifestPath, ref.bookId, ref.chapter).catch(()=>null);
        chapterCache.set(cacheKey, loaded);
      }
      if(!loaded?.verses) continue;
      const parts=[];
      for(let v=ref.verseStart; v<=ref.verseEnd; v++){
        const verseText=loaded.verses[String(v)];
        if(verseText) parts.push(verseText);
      }
      if(!parts.length) continue;
      const bookName=loaded.bookInfo?.name || ref.bookId;
      const reference=ref.verseStart===ref.verseEnd
        ? `${bookName} ${ref.chapter}:${ref.verseStart}`
        : `${bookName} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
      out.push({reference, text:parts.join(' ')});
    }
    return out;
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
    // El estante solo necesita shelf.json. Antes se descargaban y analizaban
    // también los cinco entries.json (casi 10 MiB) antes de mostrar una sola
    // portada, haciendo que abrir el panel pareciera bloquear toda la app.
    if(!churchHistoryShelf){
      els.panelToolbar.innerHTML='';
      els.panelBody.innerHTML=emptyState('⌛',t('historia.cargando'));
      churchHistoryShelf=await VerboModules.loadChurchHistoryShelf().catch(error=>{ console.error(error); return []; });
    }

    const needsEntries=churchHistorySearchActive || churchHistoryOpenVolume || churchHistoryOpenId;
    if(needsEntries && !churchHistoryEntries){
      els.panelToolbar.innerHTML='';
      els.panelBody.innerHTML=emptyState('⌛',t('historia.cargando'));
      churchHistoryEntries=await VerboModules.loadChurchHistory().catch(error=>{ console.error(error); return []; });
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
  // Índice del buscador rápido. Después de la primera búsqueda o de abrir un
  // volumen, churchHistoryEntries queda cacheado y este índice es síncrono.
  // En la primera visita el corpus todavía no se descarga: renderShelfView
  // deriva al buscador completo cuando el usuario enfoca este campo.
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
    const quickSearch=document.getElementById('historiaQuickSearchInput');
    if(churchHistoryEntries){
      wireQuickSearchInput(quickSearch, document.getElementById('historiaQuickSearchPredictions'), historiaQuickIndex, selectHistoriaQuickResult, {sourceLang:'en', moduleId:'historia'});
    }else{
      quickSearch?.addEventListener('focus',()=>{
        churchHistorySearchActive=true;
        renderChurchHistoryPanel();
      },{once:true});
    }
  }
  function openChurchHistoryVolume(volumeId){
    churchHistoryOpenVolume=volumeId;
    churchHistoryOpenId=null;
    churchHistoryOpenFromShelf=false;
    renderChurchHistoryPanel();
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
    abandonPendingTranslations();
    const myGen=translateGeneration; // ver comentario en applyCommentaryTranslation
    const target=contentLang();
    const token=++churchHistoryTocToken;
    let index=0;
    async function worker(){
      while(index<entries.length){
        if(token!==churchHistoryTocToken||myGen!==translateGeneration) return;
        const entry=entries[index++];
        const source=entry.sourceLang||'en';
        if(!source||source===target) continue;
        const labelEl=els.panelBody.querySelector(`[data-history-toc-label="${CSS.escape(entry.id)}"]`);
        if(!labelEl||labelEl.dataset.translated===target) continue;
        const original=churchHistoryTocRowLabel(entry);
        const translated=await translateCommentaryHeader(`historia:${entry.id}`,'tocLabel',original,source,target);
        if(token!==churchHistoryTocToken||myGen!==translateGeneration) return;
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
    abandonPendingTranslations();
    const myGen=translateGeneration; // ver comentario en applyCommentaryTranslation
    const target=contentLang();
    const token=++churchHistoryResultsToken;
    let index=0;
    async function worker(){
      while(index<results.length){
        if(token!==churchHistoryResultsToken||myGen!==translateGeneration) return;
        const entry=results[index++];
        const source=entry.sourceLang||'en';
        if(!source||source===target) continue;
        const titleEl=els.panelBody.querySelector(`[data-history-title="${CSS.escape(entry.id)}"]`);
        const excerptEl=els.panelBody.querySelector(`[data-history-excerpt="${CSS.escape(entry.id)}"]`);
        if(titleEl && titleEl.dataset.translated!==target){
          const translatedTitle=await translateCommentaryHeader(`historia:${entry.id}`,'title',entry.title,source,target);
          if(token!==churchHistoryResultsToken||myGen!==translateGeneration) return;
          titleEl.textContent=translatedTitle;
          titleEl.dataset.translated=target;
        }
        if(excerptEl && excerptEl.dataset.translated!==target){
          const originalExcerpt=excerptEl.textContent;
          const translatedExcerpt=await translateCommentaryHeader(`historia:${entry.id}`,'excerpt',originalExcerpt,source,target);
          if(token!==churchHistoryResultsToken||myGen!==translateGeneration) return;
          excerptEl.textContent=translatedExcerpt;
          excerptEl.dataset.translated=target;
        }
      }
    }
    await Promise.all(Array.from({length:Math.min(4,results.length)},worker));
  }

  function renderChurchHistoryEntry(id){
    npRefreshIfOpen(); // sincroniza la pestaña Historia/Padres del popup si ya estaba abierto
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
    abandonPendingTranslations();
    const myGen=translateGeneration; // ver comentario en applyCommentaryTranslation
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
    if(myGen!==translateGeneration) return;
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

  function languagesToolbar(){
    const es=contentLang()==='es';
    return `<div class="language-study-tabs" role="tablist" aria-label="${es?'Herramientas de idiomas bíblicos':'Biblical language tools'}">
      <button type="button" class="language-study-tab${languageStudyMode==='original'?' is-active':''}" data-language-mode="original" role="tab" aria-selected="${languageStudyMode==='original'}">${es?'Texto original':'Original text'}</button>
      <button type="button" class="language-study-tab${languageStudyMode==='interlinear'?' is-active':''}" data-language-mode="interlinear" role="tab" aria-selected="${languageStudyMode==='interlinear'}">${es?'Interlineal':'Interlinear'}</button>
      <button type="button" class="language-study-tab${languageStudyMode==='strong'?' is-active':''}" data-language-mode="strong" role="tab" aria-selected="${languageStudyMode==='strong'}">Strong</button>
    </div>`;
  }

  function wireLanguagesToolbar(focus){
    panelToolbarEl().querySelectorAll('[data-language-mode]').forEach(button=>button.addEventListener('click',()=>{
      languageStudyMode=button.dataset.languageMode;
      localStorage.setItem('verbo:languageStudyMode',languageStudyMode);
      renderLanguagesPanel(focus);
    }));
  }

  function morphDescription(morph){
    const code=String(morph?.code||'');
    const es=contentLang()==='es';
    const direct={PREP:["preposición","preposition"],CONJ:["conjunción","conjunction"],ADV:["adverbio","adverb"],INJ:["interjección","interjection"]};
    if(direct[code]) return direct[code][es?0:1];
    const greek=code.match(/^([NATPX])[-]([NGDAV])([SPD])([MFN])/);
    if(greek){
      const pos={N:['sustantivo','noun'],A:['adjetivo','adjective'],T:['artículo','article'],P:['pronombre','pronoun'],X:['pronombre indefinido','indefinite pronoun']}[greek[1]];
      const cases={N:['nominativo','nominative'],G:['genitivo','genitive'],D:['dativo','dative'],A:['acusativo','accusative'],V:['vocativo','vocative']}[greek[2]];
      const number=greek[3]==='S'?["singular","singular"]:["plural","plural"];
      const gender={M:['masculino','masculine'],F:['femenino','feminine'],N:['neutro','neuter']}[greek[4]];
      return [pos,cases,number,gender].map(x=>x[es?0:1]).join(', ');
    }
    const verb=code.match(/^V-([PIFAXY2])([AMPEDON])([ISOMNP])-(\d)([SP])/);
    if(verb){
      const tense={P:['presente','present'],I:['imperfecto','imperfect'],F:['futuro','future'],A:['aoristo','aorist'],X:['perfecto','perfect'],Y:['pluscuamperfecto','pluperfect'],2:['segundo aoristo','second aorist']}[verb[1]]||[verb[1],verb[1]];
      const voice={A:['activa','active'],M:['media','middle'],P:['pasiva','passive'],E:['media o pasiva','middle or passive'],D:['deponente','deponent'],O:['media o pasiva','middle or passive'],N:['media o pasiva','middle or passive']}[verb[2]]||[verb[2],verb[2]];
      const mood={I:['indicativo','indicative'],S:['subjuntivo','subjunctive'],O:['optativo','optative'],M:['imperativo','imperative'],N:['infinitivo','infinitive'],P:['participio','participle']}[verb[3]]||[verb[3],verb[3]];
      return `${es?'verbo':'verb'}, ${tense[es?0:1]}, ${voice[es?0:1]}, ${mood[es?0:1]}, ${verb[4]}${es?'ª':'th'} ${verb[5]==='S'?(es?'singular':'singular'):(es?'plural':'plural')}`;
    }
    if(morph?.scheme==='step-hebrew'){
      const parts=[];
      if(code.includes('N')) parts.push(es?'sustantivo':'noun');
      else if(code.includes('V')) parts.push(es?'verbo':'verb');
      else if(code.includes('R')) parts.push(es?'preposición':'preposition');
      else if(code.includes('C')) parts.push(es?'conjunción':'conjunction');
      if(code.includes('m')) parts.push(es?'masculino':'masculine');
      if(code.includes('f')) parts.push(es?'femenino':'feminine');
      if(code.includes('s')) parts.push(es?'singular':'singular');
      if(code.includes('p')) parts.push(es?'plural':'plural');
      return parts.length?parts.join(', '):(es?'Código hebreo STEPBible':'STEPBible Hebrew code');
    }
    return es?'Código morfológico de la fuente':'Source morphology code';
  }

  function importedMorphDescription(token,morphology){
    const entry=morphology?.entries?.[`${token.morphology?.scheme}:${token.morphology?.code}`];
    if(!entry?.recognized) return morphDescription(token.morphology);
    const language=contentLang()==='es'?'es':'en';
    const groups=entry.features?.[language]||[];
    const values=groups.flatMap(group=>Object.values(group||{})).filter(Boolean);
    return values.join(', ')||morphDescription(token.morphology);
  }

  function alignmentForToken(alignment,tokenId){
    return (alignment?.relations||[]).filter(item=>item.originalTokens?.includes(tokenId));
  }

  function linguisticTokenHtml(linguistic,tokenId){
    const es=contentLang()==='es';
    const matches=(linguistic?.layers||[]).map(layer=>({layer,token:layer.data?.tokens?.[tokenId]})).filter(item=>item.token);
    if(!matches.length)return '';
    return matches.map(({layer,token})=>{
      const sourceMorphs=token.morphs||[token.sourceToken].filter(Boolean);
      const morphs=sourceMorphs.map(morph=>{
        const form=morph.unicode||morph.text||morph.lemma||'—';
        const description=[morph.pos,morph.morph,morph.lemma,morph.english||morph.gloss].filter(Boolean).join(' · ');
        const relation=[morph.role,morph.class,morph.frame].filter(Boolean).join(' · ');
        return `<li><b dir="auto">${escapeHTML(form)}</b><span>${escapeHTML(description)}</span>${relation?`<small>${escapeHTML(relation)}</small>`:''}</li>`;
      }).join('');
      const semantic=[...(token.semantics?.sdbh||[]),...(token.semantics?.lexicalDomains||[]),...(token.semantics?.coreDomains||[]),...(token.semantics?.contextualDomains||[]),...(token.sourceToken?.domain?.split(' ')||[]),...(token.sourceToken?.ln?.split(' ')||[])];
      const participants=token.semantics?.participants||[];
      const metadata=[semantic.length?`${es?'Dominios':'Domains'}: ${semantic.join(', ')}`:'',participants.length?`${es?'Participantes':'Participants'}: ${participants.join(', ')}`:''].filter(Boolean).join(' · ');
      return `<section class="original-token-detail__linguistic"><strong>${es?'Análisis lingüístico':'Linguistic analysis'} · ${escapeHTML(layer.manifest?.name||layer.id)}</strong><ul>${morphs}</ul>${metadata?`<small>${escapeHTML(metadata)}</small>`:''}<small>${es?'Fuente':'Source'}: ${escapeHTML(layer.manifest?.attribution||layer.id)} · ${escapeHTML(layer.manifest?.license||'')}</small></section>`;
    }).join('');
  }

  function originalTokenDetail(token,alignment,morphology,linguistic=null){
    const es=contentLang()==='es';
    const relations=alignmentForToken(alignment,token.id);
    const alignmentHtml=relations.length?relations.map(item=>`<span class="original-status original-status--${escapeHTML(item.status)}">${escapeHTML(item.status)} · ${escapeHTML(item.relation)}</span>`).join(''):`<span class="original-status original-status--unresolved">unresolved</span>`;
    const strongButtons=(token.strong||[]).map(code=>`<button type="button" class="strongs-tag" data-strong-code="${escapeHTML(code)}">${escapeHTML(code)}</button>`).join(' ');
    return `<article class="original-token-detail" dir="ltr">
      <div class="original-token-detail__surface" dir="${token.morphology?.scheme==='step-hebrew'?'rtl':'ltr'}">${escapeHTML(token.surface)}</div>
      <div class="original-token-detail__translit">${escapeHTML(token.transliteration||'—')}</div>
      <dl><dt>${es?'Lema':'Lemma'}</dt><dd dir="auto">${escapeHTML(token.lemma||'—')}</dd><dt>${es?'Morfología':'Morphology'}</dt><dd>${escapeHTML(importedMorphDescription(token,morphology))}<code>${escapeHTML(token.morphology?.code||'—')}</code></dd><dt>Strong</dt><dd>${strongButtons||'—'}</dd><dt>${es?'Fuente':'Source'}</dt><dd>${escapeHTML(token.sourceReading||'—')} · ${escapeHTML(token.textPolicy||'—')}</dd></dl>
      <div class="original-token-detail__alignment"><strong>${es?'Alineación':'Alignment'}:</strong> ${alignmentHtml}</div>
      ${linguisticTokenHtml(linguistic,token.id)}
    </article>`;
  }

  async function renderOriginalLanguagePanel(focus=null){
    const request=++strongBibleRenderRequest;
    const ctx=activeBibleContext();
    panelBodyEl().innerHTML=emptyState('⌛',contentLang()==='es'?'Cargando texto original…':'Loading original text…');
    try{
      const targetBible=contentLang()==='es'?'rv-verbo':'bsb';
      const loaded=await VerboModules.loadOriginalLanguage(ctx.book,ctx.chapter,targetBible);
      if(request!==strongBibleRenderRequest) return;
      if(!loaded?.chapter){ panelBodyEl().innerHTML=emptyState('א',contentLang()==='es'?'No hay texto original para este pasaje.':'Original text is unavailable for this passage.'); return; }
      const verses=loaded.chapter.verses;
      const linguisticLabel=loaded.linguistic?.layers?.length?` · ${loaded.linguistic.layers.map(layer=>escapeHTML(layer.manifest?.name||layer.id)).join(' · ')}`:'';
      panelBodyEl().innerHTML=`<div class="original-language-source" dir="ltr">${escapeHTML(loaded.chapter.dataset)} · CC BY 4.0 · STEP Bible${linguisticLabel}</div><div class="original-language-list">${Object.entries(verses).map(([number,verse])=>`<section class="original-verse${Number(number)===(focus||activeVerse())?' original-verse--active':''}" data-original-verse="${number}"><div class="original-verse__number" dir="ltr">${number}</div><div class="original-token-row" dir="${loaded.chapter.direction}">${verse.tokens.map(token=>`<button type="button" class="original-token" data-token-id="${escapeHTML(token.id)}" dir="${loaded.chapter.direction}">${escapeHTML(token.surface)}</button>`).join('')}</div><div class="original-detail-slot"></div></section>`).join('')}</div>`;
      const byId=new Map(Object.values(verses).flatMap(verse=>verse.tokens).map(token=>[token.id,token]));
      panelBodyEl().querySelectorAll('.original-token').forEach(button=>button.addEventListener('click',()=>{
        const section=button.closest('.original-verse');
        section.querySelectorAll('.original-token').forEach(x=>x.classList.toggle('is-active',x===button));
        const slot=section.querySelector('.original-detail-slot');
        slot.innerHTML=originalTokenDetail(byId.get(button.dataset.tokenId),loaded.alignment,loaded.morphology,loaded.linguistic);
        slot.querySelectorAll('[data-strong-code]').forEach(tag=>tag.addEventListener('click',event=>{ event.stopPropagation(); openStrongPopup(tag.dataset.strongCode); }));
      }));
      if(focus) panelBodyEl().querySelector(`[data-original-verse="${focus}"]`)?.scrollIntoView({block:'center'});
    }catch(error){
      console.error(error);
      if(request===strongBibleRenderRequest) panelBodyEl().innerHTML=emptyState('⚠️',contentLang()==='es'?'No se pudo cargar el texto original.':'Original text could not be loaded.');
    }
  }

  function interlinearUnitHtml(relation,tokens,segments,direction,morphology){
    const es=contentLang()==='es';
    const originals=(relation.originalTokens||[]).map(id=>tokens.get(id)).filter(Boolean);
    const targets=(relation.verboSegments||[]).map(id=>segments.get(id)).filter(Boolean);
    const strong=[...new Set(originals.flatMap(token=>token.strong||[]))];
    const originalHtml=originals.length?originals.map(token=>`<button type="button" class="interlinear-token" data-token-id="${escapeHTML(token.id)}" dir="${direction}">${escapeHTML(token.surface)}</button>`).join(' '):`<span class="interlinear-unit__empty">∅</span>`;
    const transliteration=originals.map(token=>token.transliteration).filter(Boolean).join(' · ');
    const spanish=targets.map(segment=>segment.text).join(' ');
    const meta=strong.map(code=>`<button type="button" class="strongs-tag" data-strong-code="${escapeHTML(code)}">${escapeHTML(code)}</button>`).join(' ');
    const statusLabel=relation.status==='automatic'
      ?(es?'Alineación automática':'Automatic alignment')
      :relation.status==='approved'
        ?(es?'Alineación aprobada':'Approved alignment')
        :relation.status==='reviewed'
          ?(es?'Alineación revisada':'Reviewed alignment')
          :relation.status==='ambiguous'
            ?(es?'Correspondencia posible':'Possible correspondence')
            :(es?'Sin correspondencia segura':'No reliable correspondence');
    return `<article class="interlinear-unit interlinear-unit--${escapeHTML(relation.status)}" data-relation-id="${escapeHTML(relation.id)}">
      <div class="interlinear-unit__source"><div class="interlinear-unit__original" dir="${direction}">${originalHtml}</div>${transliteration?`<div class="interlinear-unit__translit" dir="ltr">${escapeHTML(transliteration)}</div>`:''}</div>
      <div class="interlinear-unit__arrow" aria-hidden="true">↓</div>
      <div class="interlinear-unit__target"><div class="interlinear-unit__spanish" dir="ltr">${escapeHTML(spanish||(es?'Sin equivalente separado':'No separate equivalent'))}</div><div class="interlinear-unit__meta" dir="ltr">${meta}<span>${escapeHTML(statusLabel)}</span></div></div>
      <div class="original-detail-slot"></div>
    </article>`;
  }

  async function renderInterlinearPanel(focus=null){
    const request=++strongBibleRenderRequest; const ctx=activeBibleContext(); const es=contentLang()==='es';
    panelBodyEl().innerHTML=emptyState('⌛',es?'Cargando Interlineal Verbo…':'Loading Verbo Interlinear…');
    try{
      const targetBible=contentLang()==='es'?'rv-verbo':'bsb';
      const loaded=await VerboModules.loadOriginalLanguage(ctx.book,ctx.chapter,targetBible);
      if(request!==strongBibleRenderRequest)return;
      if(!loaded?.chapter){panelBodyEl().innerHTML=emptyState('א',es?'No hay texto original para este pasaje.':'Original text is unavailable for this passage.');return;}
      const tokens=new Map(Object.values(loaded.chapter.verses).flatMap(v=>v.tokens).map(token=>[token.id,token]));
      const segments=new Map(Object.values(loaded.alignment?.targetSegments||{}).flat().map(segment=>[segment.id,segment]));
      const byVerse=new Map();
      (loaded.alignment?.relations||[]).forEach(relation=>{const verse=String(relation.verse||relation.id.split('.')[2]);if(!byVerse.has(verse))byVerse.set(verse,[]);byVerse.get(verse).push(relation);});
      const targetLabel=es?'Biblia Verbo':'BSB';
      panelBodyEl().innerHTML=`<div class="interlinear-source" dir="ltr"><strong>${es?'Interlineal Verbo':'Verbo Interlinear'}</strong><span>${es?'Texto original y correspondencias aproximadas con':'Original text and approximate correspondences with'} ${targetLabel}</span><small>${es?'Toca una palabra para ver lema, morfología y Strong.':'Tap a word to see its lemma, morphology, and Strong.'} · ${escapeHTML(loaded.chapter.dataset)} · CC BY 4.0</small></div><div class="interlinear-list">${Object.entries(loaded.chapter.verses).map(([verse,payload])=>`<section class="interlinear-verse${Number(verse)===(focus||activeVerse())?' interlinear-verse--active':''}" data-interlinear-verse="${verse}"><div class="interlinear-verse__heading">${verse}</div><div class="interlinear-verse__original" dir="${loaded.chapter.direction}">${payload.tokens.map(token=>escapeHTML(token.surface)).join(' ')}</div><div class="interlinear-verse__translation"><span>${targetLabel}</span><p>${escapeHTML(loaded.alignment?.targetTexts?.[verse]||(loaded.alignment?.targetSegments?.[verse]||[]).map(segment=>segment.text).join(' '))}</p></div><details class="interlinear-verse__word-study"><summary>${es?'Ver correspondencias palabra por palabra':'See word-by-word correspondences'}</summary><div class="interlinear-units">${(byVerse.get(verse)||[]).map(relation=>interlinearUnitHtml(relation,tokens,segments,loaded.chapter.direction,loaded.morphology)).join('')}</div></details></section>`).join('')}</div>`;
      panelBodyEl().querySelectorAll('.interlinear-token').forEach(button=>button.addEventListener('click',()=>{const unit=button.closest('.interlinear-unit');unit.querySelectorAll('.interlinear-token').forEach(x=>x.classList.toggle('is-active',x===button));const slot=unit.querySelector('.original-detail-slot');slot.innerHTML=originalTokenDetail(tokens.get(button.dataset.tokenId),loaded.alignment,loaded.morphology,loaded.linguistic);slot.querySelectorAll('[data-strong-code]').forEach(tag=>tag.addEventListener('click',event=>{event.stopPropagation();openStrongPopup(tag.dataset.strongCode);}));}));
      panelBodyEl().querySelectorAll('.interlinear-unit > .interlinear-unit__meta [data-strong-code]').forEach(tag=>tag.addEventListener('click',event=>{event.stopPropagation();openStrongPopup(tag.dataset.strongCode);}));
      if(focus)panelBodyEl().querySelector(`[data-interlinear-verse="${focus}"]`)?.scrollIntoView({block:'center'});
    }catch(error){console.error(error);if(request===strongBibleRenderRequest)panelBodyEl().innerHTML=emptyState('⚠️',es?'No se pudo cargar el interlineal.':'Interlinear could not be loaded.');}
  }

  function renderLanguagesPanel(focus=null){
    panelTitleEl().textContent=contentLang()==='es'?'Idiomas bíblicos':'Biblical languages';
    panelToolbarEl().innerHTML=languagesToolbar();
    wireLanguagesToolbar(focus);
    if(languageStudyMode==='strong') renderDictionaryPanel(focus,true);
    else if(languageStudyMode==='interlinear') renderInterlinearPanel(focus);
    else renderOriginalLanguagePanel(focus);
  }

  // "Biblia Strong": Biblia Verbo + Strong o KJV + Strong según contentLang()
  // (ver strongBiblePath), siempre sincronizada con el libro/capítulo que se
  // esté leyendo (mismo patrón que renderCompare/commentaryContext),
  // independiente de la Biblia seleccionada en el panel central. Reemplaza al
  // viejo panel de Diccionario, que estaba vacío hasta que el usuario tocaba un
  // código Strong en la Biblia principal (ver cambio de 2026-08-07).
  async function renderDictionaryPanel(focus=null,keepToolbar=false){
    const request=++strongBibleRenderRequest;
    if(!keepToolbar) panelToolbarEl().innerHTML='';
    if(!keepToolbar) panelTitleEl().textContent=t('nav.diccionario');
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
    npRefreshIfOpen(); // la pestaña Idiomas del popup de notas destaca el código recién abierto
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
    npRefreshIfOpen();
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
    abandonPendingTranslations();
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
    abandonPendingTranslations();
    openStrongPopupRoot.hidden=true;
    openStrongPopupRoot.classList.remove('strong-def-popup--shake');
    openStrongPopupRoot=null;
    strongPopupHistory=[];
    npRefreshIfOpen();
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
  const ATLAS_BIBLE_MANIFEST={es:'modules/bibles/rv-verbo/manifest.json',en:'modules/bibles/bsb/manifest.json'};
  let atlasBibleState=null;
  let atlasBibleRenderToken=0;

  async function resolveAtlasText({entry,language,fallback,scope,mapId,placeId,journeyId}){
    if(!entry || typeof entry!=='object') return fallback;
    if(typeof entry[language]==='string' && entry[language].trim()) return entry[language];
    const sourceLang=language==='es'?'en':'es';
    const source=entry[sourceLang];
    if(typeof source!=='string' || !source.trim()) return fallback;
    const id=['atlas',scope,mapId,placeId,journeyId].filter(Boolean).join(':');
    const cacheKey=translationCacheKey(id,source,language);
    const cached=tcacheGet(cacheKey);
    if(cached) return cached;
    const translated=await verboTranslate(source,sourceLang,language);
    if(!translated) return fallback;
    tcacheSet(cacheKey,translated);
    return translated;
  }

  function connectAtlasFrame(frame){
    let attempts=0;
    const connect=()=>{
      if(!frame.isConnected) return;
      const api=frame.contentWindow?.VerboAtlas;
      if(!api){
        if(++attempts<50) setTimeout(connect,100);
        else console.error('Atlas Verbo no expuso su API después de cargar el iframe.');
        return;
      }
      api.setLanguage(contentLang());
      api.setTextResolver(resolveAtlasText);
      api.setBibleResolver(({reference})=>openAtlasBibleReference(reference));
      requestAnimationFrame(()=>api.fitMapFrame?.());
    };
    connect();
  }

  function renderMapsPanel(){
    const appHeader=document.querySelector('.app-header');
    if(appHeader) els.side.style.setProperty('--atlas-panel-top', `${Math.ceil(appHeader.getBoundingClientRect().bottom)}px`);
    panelTitleEl().textContent=t('nav.mapasBiblicos');
    panelToolbarEl().innerHTML='';
    panelBodyEl().innerHTML=`
      <div class="atlas-embed">
        <iframe
          class="atlas-embed__frame"
          id="verboAtlasFrame"
          src="assets/atlas/atlas.html?v=20260827-biblical-media"
          title="${escapeHTML(t('nav.mapasBiblicos'))}"
          loading="eager"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
        </iframe>
      </div>`;
    const frame=panelBodyEl().querySelector('#verboAtlasFrame');
    frame?.addEventListener('load',()=>connectAtlasFrame(frame),{once:true});
    if(frame?.contentDocument?.readyState==='complete') connectAtlasFrame(frame);
    const hostPanel=frame?.closest('.side-panel, .sermon-compare-panel');
    const refit=()=>frame?.contentWindow?.VerboAtlas?.fitMapFrame?.();
    requestAnimationFrame(()=>requestAnimationFrame(refit));
    hostPanel?.addEventListener('transitionend',refit,{once:true});
  }

  async function atlasRangeEndChapter(parsed){
    if(parsed.end.chapter!==null) return parsed.end.chapter;
    return (await VerboModules.getBookInfo(parsed.end.id)).chapterCount;
  }

  async function atlasBibleCanMove(delta){
    if(!atlasBibleState) return false;
    const {parsed,bookIndex,chapter}=atlasBibleState;
    if(delta<0) return bookIndex>parsed.start.index || chapter>parsed.start.chapter;
    const endChapter=await atlasRangeEndChapter(parsed);
    return bookIndex<parsed.end.index || chapter<endChapter;
  }

  async function moveAtlasBible(delta){
    if(!atlasBibleState || !(await atlasBibleCanMove(delta))) return;
    const books=VerboAtlasReferenceParser.BOOKS;
    let {bookIndex,chapter}=atlasBibleState;
    if(delta>0){
      const count=(await VerboModules.getBookInfo(books[bookIndex][1])).chapterCount;
      if(chapter<count) chapter++;
      else{ bookIndex++; chapter=1; }
    }else if(chapter>1) chapter--;
    else{
      bookIndex--;
      chapter=(await VerboModules.getBookInfo(books[bookIndex][1])).chapterCount;
    }
    atlasBibleState.bookIndex=bookIndex;
    atlasBibleState.chapter=chapter;
    await renderAtlasBiblePanel();
  }

  async function openAtlasBibleReference(reference){
    const parsed=window.VerboAtlasReferenceParser?.parse(reference);
    if(!parsed){ toast(contentLang()==='es'?'No se pudo interpretar esta referencia.':'This reference could not be parsed.'); return; }
    atlasBibleState={parsed,bookIndex:parsed.start.index,chapter:parsed.start.chapter};
    if(sermonMode && isSermonSidePanelOpen()) closeSermonSidePanel();
    closePanel();
    openPanel('atlas-bible');
  }

  async function renderAtlasBiblePanel(){
    if(!atlasBibleState) return;
    const token=++atlasBibleRenderToken;
    const lang=contentLang();
    const books=VerboAtlasReferenceParser.BOOKS;
    const bookId=books[atlasBibleState.bookIndex][1];
    const chapter=atlasBibleState.chapter;
    const parsed=atlasBibleState.parsed;
    panelTitleEl().textContent=lang==='es'?'Biblia secundaria':'Secondary Bible';
    panelToolbarEl().innerHTML=`<div class="atlas-bible-toolbar">
      <button class="note-card__copy" id="backToAtlas" type="button">← ${lang==='es'?'Volver al Atlas':'Back to Atlas'}</button>
      <span class="atlas-bible-toolbar__range">${escapeHTML(parsed.reference)}</span>
      <button class="note-card__copy" id="atlasBiblePrev" type="button" aria-label="${lang==='es'?'Capítulo anterior':'Previous chapter'}">‹</button>
      <button class="note-card__copy" id="atlasBibleNext" type="button" aria-label="${lang==='es'?'Capítulo siguiente':'Next chapter'}">›</button>
    </div>`;
    panelBodyEl().innerHTML=emptyState('⌛',lang==='es'?'Cargando pasaje…':'Loading passage…');
    document.getElementById('backToAtlas')?.addEventListener('click',()=>openPanel('mapas'));
    const prev=document.getElementById('atlasBiblePrev');
    const next=document.getElementById('atlasBibleNext');
    if(prev){ prev.disabled=!(await atlasBibleCanMove(-1)); prev.addEventListener('click',()=>moveAtlasBible(-1)); }
    if(next){ next.disabled=!(await atlasBibleCanMove(1)); next.addEventListener('click',()=>moveAtlasBible(1)); }
    const manifestPath=ATLAS_BIBLE_MANIFEST[lang]||ATLAS_BIBLE_MANIFEST.es;
    const loaded=await VerboModules.loadBible(manifestPath,bookId,chapter).catch(error=>{ console.error(error); return null; });
    if(token!==atlasBibleRenderToken || activeTab!=='atlas-bible') return;
    if(!loaded){ panelBodyEl().innerHTML=emptyState('⚠️',lang==='es'?'No se pudo cargar este pasaje.':'This passage could not be loaded.'); return; }
    const numbers=Object.keys(loaded.verses||{}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const first=atlasBibleState.bookIndex===parsed.start.index && chapter===parsed.start.chapter ? (parsed.start.verse||numbers[0]) : numbers[0];
    const endChapter=await atlasRangeEndChapter(parsed);
    const last=atlasBibleState.bookIndex===parsed.end.index && chapter===endChapter ? (parsed.end.verse||numbers.at(-1)) : numbers.at(-1);
    const versionLabel=lang==='es'?'Biblia Verbo':'BSB';
    panelBodyEl().innerHTML=`<article class="atlas-bible-passage">
      <header class="atlas-bible-passage__header"><h3>${escapeHTML(loaded.bookInfo?.name||bookId)} ${chapter}</h3><span>${versionLabel}</span></header>
      ${numbers.map(n=>`<div class="compare-verse${n>=first&&n<=last?' compare-verse--active':''}" data-verse-n="${n}"><span class="compare-verse__num">${n}</span><span class="compare-verse__text">${escapeHTML(loaded.verses[String(n)]||'')}</span></div>`).join('')}
    </article>`;
    panelBodyEl().querySelector(`[data-verse-n="${first}"]`)?.scrollIntoView({block:'start'});
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

    // "● " antepuesto cuando la fuente ya tiene un fragmento anclado a este
    // versículo (verse.patristicSources ya viene calculado por buildChapterData,
    // el mismo dato que alimenta el contador de la burbuja 📜 del versículo).
    const activeVerseSources=data?.verses?.find(v=>v.n===activeVerse())?.patristicSources || [];
    const sourceOptions=patristicByVerseCatalog.map(x=>`<option value="${x.id}" ${x.id===currentPatristicByVerse?'selected':''}>${activeVerseSources.includes(x.id)?'● ':''}${escapeHTML(x.label)}</option>`).join('');
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
    // el popup de notas (npOpenContextFor) salta directo aquí sin pasar por
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
  // nueva alianza...") uno por uno con un pool de workers concurrentes —
  // mismo patrón que translateCostumbresIndexTitles/applyChurchHistoryTocTranslation.
  // Antes se armaba un solo request con todo el índice unido por un
  // delimitador ("@@@"); para documentos largos (Clemente 1: 65 secciones,
  // ~9000 caracteres; Hermas Pastor: 108 secciones, ~5500) ese texto superaba
  // el umbral de envío directo, se troceaba en fragmentos que Claude
  // traducía sin noción del delimitador, el conteo de partes ya no coincidía
  // con el de secciones y el índice completo se quedaba sin traducir en
  // silencio — mismo bug que translateCostumbresIndexTitles (Freeman,
  // reportado por Juan, 2026-08-13).
  async function translatePatristicSectionTitles(docData){
    const source=docData.manifest.language||'es';
    const target=contentLang();
    if(source===target) return;
    const sections=docData.sections;
    const token=++patristicIndexToken;
    let index=0;
    async function worker(){
      while(index<sections.length){
        if(token!==patristicIndexToken) return;
        const s=sections[index++];
        const el=els.panelBody.querySelector(`[data-patristic-section-title="${s.n}"]`);
        if(!el || el.dataset.translated===target || !s.title) continue;
        const translated=await translateCommentaryHeader(`patristic-index:${docData.manifest.id}:${s.n}`,'title',s.title,source,target);
        if(token!==patristicIndexToken) return;
        el.textContent=translated;
        el.dataset.translated=target;
      }
    }
    await Promise.all(Array.from({length:Math.min(4,sections.length)},worker));
  }

  function renderPatristicSection(){
    npRefreshIfOpen(); // sincroniza la pestaña Historia/Padres del popup si ya estaba abierto
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
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-patristic-neighbor="${previous.n}" data-nav-dir="prev">← ${t('padres.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-patristic-neighbor="${next.n}" data-nav-dir="next">${t('padres.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    els.panelBody.querySelectorAll('[data-patristic-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      patristicOpenSection=Number(button.dataset.patristicNeighbor);
      renderPatristicSection();
      els.panelBody.scrollTop=0;
    }));
    // Mismo guard y mismo motivo que en renderPanel('comentario') más
    // arriba: sin comprobar que seguimos en 'padres' y en la MISMA sección
    // al disparar el timer, cerrar el panel (o pasar a otra sección) dentro
    // de los 150ms no lo cancela, y applyPatristicTranslation() se ve a sí
    // misma como legítima aunque el usuario ya se haya ido.
    if(needsTranslation) setTimeout(()=>{
      if(activeTab==='padres' && patristicOpenSection===section.n && els.side?.classList.contains('side-panel--open')) applyPatristicTranslation(section,source,target);
    }, 150);
  }

  async function applyPatristicTranslation(section, sourceLang, targetLang){
    abandonPendingTranslations();
    const myGen=translateGeneration; // ver comentario en applyCommentaryTranslation
    const titleEl=els.panelBody.querySelector('[data-patristic-title]');
    if(titleEl && titleEl.dataset.translated!==targetLang){
      titleEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`patristic-title:${patristicOpenDoc}:${section.n}`,'title',section.title,sourceLang,targetLang);
      if(titleEl.dataset.translated==='pending'){ titleEl.textContent=translatedTitle; titleEl.dataset.translated=targetLang; }
    }
    if(myGen!==translateGeneration) return;
    const docNameEl=els.panelBody.querySelector('[data-patristic-docname]');
    if(docNameEl && docNameEl.dataset.translated!==targetLang){
      docNameEl.dataset.translated='pending';
      const translatedName=await translateCommentaryHeader(`patristic-docname:${patristicOpenDoc}`,'name',patristicDocData.manifest.name,sourceLang,targetLang);
      if(docNameEl.dataset.translated==='pending'){ docNameEl.textContent=translatedName; docNameEl.dataset.translated=targetLang; }
    }
    if(myGen!==translateGeneration) return;
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
    // Los diccionarios alfabéticos (Easton/Smith/Hitchcock) viven aparte, en
    // la pestaña "Diccionarios" (ver renderDiccionariosPanel) — acá solo
    // quedan las obras de costumbres propiamente dichas (Freeman, Tucker),
    // en una sola cuadrícula (antes cada una en su categoría quedaba sola en
    // su fila con espacio vacío al lado).
    const shelfHTML=costumbresShelf.length ? `<div class="church-shelf">${costumbresShelf.map(costumbresShelfItemHTML).join('')}</div>` : '';
    els.panelBody.innerHTML=shelfHTML
      ? `<div class="history-search-autocomplete church-shelf__quicksearch">
           <input id="costumbresQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('costumbres.buscarPlaceholder')}" autocomplete="off">
           <div id="costumbresQuickSearchPredictions" class="history-predictions"></div>
         </div>${shelfHTML}`
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
      <h3 class="history-toc__group-title" data-costumbres-toc-group="${escapeHTML(group.key)}">${escapeHTML(group.label)}</h3>
      <ol class="history-toc__list">${group.items.map(costumbresTocRowHTML).join('')}</ol>
    </section>`;
  }
  function openCostumbresEntryFromIndex(id){
    costumbresOpenId=id;
    els.side.classList.add('side-panel--history-expanded');
    els.side.offsetHeight; // fuerza reflow, mismo patrón que openChurchHistoryEntryFromTOC
    renderCostumbresEntry();
    els.panelBody.scrollTop=0;
  }
  function wireCostumbresIndex(){
    els.panelBody.querySelectorAll('[data-costumbres-toc-id]').forEach(row=>{
      row.addEventListener('click',()=>openCostumbresEntryFromIndex(row.dataset.costumbresTocId));
      row.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); openCostumbresEntryFromIndex(row.dataset.costumbresTocId); } });
    });
    els.panelBody.querySelectorAll('[data-costumbres-entry]').forEach(btn=>btn.addEventListener('click',()=>openCostumbresEntryFromIndex(btn.dataset.costumbresEntry)));
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
    let biblicalGroups=null;
    // Solo tiene sentido para obras con muchas entradas (Easton/Smith/Hitchcock,
    // miles) — con pocas (Tucker, 24 capítulos; Freeman, agrupado por libro) el
    // buscador es puro ruido sobre una lista ya corta o ya navegable.
    const COSTUMBRES_SEARCH_MIN_ENTRIES=100;
    const searchHTML=entries.length>COSTUMBRES_SEARCH_MIN_ENTRIES
      ? `<div class="history-search-autocomplete">
           <input class="search-panel-input" id="costumbresIndexSearch" type="search" placeholder="${escapeHTML(t('costumbres.buscarEnObraPlaceholder'))}" autocomplete="off">
           <div id="costumbresIndexSearchPredictions" class="history-predictions"></div>
         </div>`
      : '';
    if(costumbresDocData.manifest.navegacion==='biblico'){
      biblicalGroups=churchHistoryGroupByOrder(entries, entry=>entry.libro)
        .map(g=>({key:g.key, label: catalog.books.find(b=>b.id===g.key)?.name || g.key, items:g.items}));
      els.panelBody.innerHTML=`<div class="dictionary-library">${searchHTML}</div><div class="history-toc">${biblicalGroups.map(costumbresTocGroupHTML).join('')}</div>`;
    } else {
      const sorted=[...entries].sort((a,b)=>(a.capituloNumero||0)-(b.capituloNumero||0));
      const list=sorted.map(e=>`
        <button type="button" class="dictionary-library__item" data-costumbres-entry="${escapeHTML(e.id)}">
          <span data-costumbres-index-title="${escapeHTML(e.id)}">${escapeHTML(e.capituloTitulo||e.titulo)}</span>
        </button>`).join('');
      els.panelBody.innerHTML=`<div class="dictionary-library">${searchHTML}<div class="dictionary-library__count">${t('padres.seccionesCount',{count:sorted.length})}</div><div>${list}</div></div>`;
    }
    wireCostumbresIndex();
    wireCostumbresIndexSearch();
    translateCostumbresIndexTitles(costumbresDocData);
    if(biblicalGroups) translateCostumbresGroupLabels(biblicalGroups);
  }

  // Buscador predictivo dentro del índice de UNA obra ya abierta (ej. las
  // ~4000 entradas de Easton) — misma infraestructura que el buscador del
  // estante (wireQuickSearchInput/quickSearchMatches), pero con un índice
  // síncrono acotado a costumbresDocData (ya en memoria, sin promesa) en vez
  // de todas las obras. Distinto de costumbresQuickSearchInput (nivel 1,
  // busca en TODAS las obras a la vez).
  function costumbresIndexQuickItems(){
    return (costumbresDocData.entries||[]).map(e=>({label:e.capituloTitulo||e.titulo||'', entryId:e.id}));
  }
  function wireCostumbresIndexSearch(){
    const input=document.getElementById('costumbresIndexSearch');
    const box=document.getElementById('costumbresIndexSearchPredictions');
    if(!input||!box) return;
    wireQuickSearchInput(input, box, costumbresIndexQuickItems, item=>{
      input.value='';
      box.classList.remove('history-predictions--visible');
      openCostumbresEntryFromIndex(item.entryId);
    }, {sourceLang:costumbresDocData.manifest.language||'en', moduleId:`costumbres-index:${costumbresDocData.manifest.id}`});
  }
  // Encabezados de grupo del índice bíblico (nombre del libro, ej. "Génesis"):
  // a diferencia del resto del índice (traducido en translateCostumbresIndexTitles
  // con el idioma de la OBRA como origen — inglés para Freeman/Tucker), estos
  // vienen de catalog.books, que solo existe en español (es metadata de la
  // versión de la Biblia, no de la obra) — por eso quedaban sin traducir cuando
  // la interfaz estaba en inglés (bug reportado por Juan, 2026-08-13). Se
  // traducen aparte, con sourceLang fijo 'es', igual que applyChurchShelfTranslation.
  async function translateCostumbresGroupLabels(groups){
    const target=contentLang();
    if(target==='es') return;
    for(const group of groups){
      const el=els.panelBody.querySelector(`[data-costumbres-toc-group="${CSS.escape(group.key)}"]`);
      if(!el || el.dataset.translated===target || !group.label) continue;
      const translated=await translateCommentaryHeader(`costumbres-group:${group.key}`,'label',group.label,'es',target);
      el.textContent=translated;
      el.dataset.translated=target;
    }
  }

  // Traduce cada título del índice visible (fila del TOC bíblico o del
  // listado temático) por separado, con un pool de workers concurrentes —
  // mismo patrón que applyChurchHistoryTocTranslation. Antes se armaba UN
  // solo request con los ~892 títulos de Freeman unidos por un delimitador
  // ("@@@"), pero ese texto (~19000 caracteres) superaba el umbral de
  // envío directo (4500) y se troceaba en fragmentos que Claude traducía
  // por separado sin noción del delimitador — el recuento de partes ya no
  // coincidía con el de títulos y el resultado completo se descartaba en
  // silencio, dejando TODO el índice sin traducir (bug reportado por Juan,
  // 2026-08-13). Por título separado no hay techo de tamaño de lote, cada
  // uno cachea aparte, y si uno falla el resto igual se traduce.
  async function translateCostumbresIndexTitles(docData){
    const source=docData.manifest.language||'en';
    const target=contentLang();
    if(source===target) return;
    const labelEls=[...els.panelBody.querySelectorAll('[data-costumbres-toc-label],[data-costumbres-index-title]')];
    if(!labelEls.length) return;
    const token=++costumbresIndexToken;
    let index=0;
    async function worker(){
      while(index<labelEls.length){
        if(token!==costumbresIndexToken) return;
        const el=labelEls[index++];
        if(el.dataset.translated===target) continue;
        const original=el.textContent;
        if(!original) continue;
        const id=el.dataset.costumbresTocLabel || el.dataset.costumbresIndexTitle;
        const translated=await translateCommentaryHeader(`costumbres-index:${docData.manifest.id}:${id}`,'label',original,source,target);
        if(token!==costumbresIndexToken) return;
        el.textContent=translated;
        el.dataset.translated=target;
      }
    }
    await Promise.all(Array.from({length:Math.min(4,labelEls.length)},worker));
  }

  function renderCostumbresEntry(){
    npRefreshIfOpen(); // sincroniza la pestaña Costumbres del popup si ya estaba abierto
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

  // ── Literatura Extracanónica ─────────────────────────────────────────────
  // Apócrifos/pseudoepígrafos del AT (1 Enoc, Asunción de Moisés, Jubileos)
  // — mismos 3 niveles y misma infraestructura de traducción bajo demanda
  // que Costumbres y Tradiciones (ver bloque anterior). No es un comentario
  // anclado a versículo: es lectura corrida, como patristic/library.
  function extracanonicoShelfItemHTML(volume){
    return `<div class="church-shelf__item" data-extracanonico-shelf-volume="${escapeHTML(volume.id)}" tabindex="0" role="group" aria-label="${escapeHTML(volume.titulo)}">
      <img class="church-shelf__cover" src="${escapeHTML(volume.cover)}" alt="" loading="lazy">
      <div class="church-shelf__title" data-shelf-title="${escapeHTML(volume.id)}">${escapeHTML(volume.titulo)}</div>
      <div class="church-shelf__overlay">
        ${volume.periodo?`<div class="church-shelf__overlay-period" data-shelf-period="${escapeHTML(volume.id)}">${escapeHTML(volume.periodo)}</div>`:''}
        <p class="church-shelf__overlay-summary" data-shelf-summary="${escapeHTML(volume.id)}">${escapeHTML(volume.resumenBreve||'')}</p>
        <button type="button" class="church-shelf__read-btn" data-extracanonico-shelf-read="${escapeHTML(volume.id)}">${t('extracanonico.leer')} →</button>
      </div>
    </div>`;
  }
  function wireExtracanonicoShelf(){
    els.panelBody.querySelectorAll('[data-extracanonico-shelf-volume]').forEach(item=>{
      const toggle=()=>item.classList.toggle('church-shelf__item--active');
      item.addEventListener('click',event=>{ if(event.target.closest('[data-extracanonico-shelf-read]')) return; toggle(); });
      item.addEventListener('keydown',event=>{
        if(event.target.closest('[data-extracanonico-shelf-read]')) return;
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); toggle(); }
      });
    });
    els.panelBody.querySelectorAll('[data-extracanonico-shelf-read]').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      extracanonicoOpenWork=btn.dataset.extracanonicoShelfRead;
      extracanonicoOpenId=null;
      extracanonicoDocData=null;
      renderExtracanonicoPanel();
      els.panelBody.scrollTop=0;
    }));
  }

  // Índice del buscador rápido del estante: mismo patrón que
  // costumbresQuickIndex — la primera vez que el usuario busca se cargan las
  // 3 obras del estante y se cachean tanto el índice de títulos como los
  // datos completos de cada obra (extracanonicoQuickIndexWorks), para
  // navegar al instante sin volver a pedir nada por red.
  let extracanonicoQuickIndexCache=null, extracanonicoQuickIndexPromise=null;
  const extracanonicoQuickIndexWorks=new Map();
  function extracanonicoQuickIndex(){
    if(extracanonicoQuickIndexCache) return extracanonicoQuickIndexCache;
    if(extracanonicoQuickIndexPromise) return extracanonicoQuickIndexPromise;
    extracanonicoQuickIndexPromise=(async()=>{
      if(!extracanonicoShelf){
        try{ extracanonicoShelf=await VerboModules.loadExtracanonicoShelf(); }
        catch(error){ console.error(error); extracanonicoShelf=[]; }
      }
      const works=await Promise.all(extracanonicoShelf.map(v=>VerboModules.loadExtracanonico(v.id).catch(error=>{ console.warn(error); return null; })));
      const items=[];
      works.forEach((data,i)=>{
        if(!data) return;
        const volume=extracanonicoShelf[i];
        extracanonicoQuickIndexWorks.set(volume.id,data);
        (data.entries||[]).forEach(entry=>{
          if(entry.capituloNumero===0) return; // nota editorial, no es resultado de búsqueda
          items.push({
            label:`${volume.titulo} — ${entry.titulo}`, prefixPart:volume.titulo, titlePart:entry.titulo,
            quickKey:`${volume.id}:${entry.id}`, workId:volume.id, entryId:entry.id
          });
        });
      });
      extracanonicoQuickIndexCache=items;
      return items;
    })();
    return extracanonicoQuickIndexPromise;
  }
  function selectExtracanonicoQuickResult(item){
    const cached=extracanonicoQuickIndexWorks.get(item.workId);
    if(cached) extracanonicoDocData=cached;
    extracanonicoOpenWork=item.workId;
    extracanonicoOpenId=item.entryId;
    renderExtracanonicoPanel();
  }
  async function renderExtracanonicoPanel(){
    els.panelTitle.textContent=t('extracanonico.title');
    els.panelToolbar.innerHTML='';

    // Nivel 3: entrada abierta dentro de una obra
    if(extracanonicoOpenWork && extracanonicoOpenId){
      if(!extracanonicoDocData || extracanonicoDocData.manifest.id!==extracanonicoOpenWork){
        els.panelBody.innerHTML=emptyState('⌛',t('extracanonico.cargandoObra'));
        try{ extracanonicoDocData=await VerboModules.loadExtracanonico(extracanonicoOpenWork); }
        catch(error){ console.error(error); }
      }
      if(!extracanonicoDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('extracanonico.errorObra')); return; }
      renderExtracanonicoEntry();
      return;
    }

    // Nivel 2: índice de la obra elegida
    if(extracanonicoOpenWork){
      await renderExtracanonicoIndex();
      return;
    }

    // Nivel 1: estante de portadas
    els.side.classList.remove('side-panel--history-expanded');
    if(!extracanonicoShelf){
      try{ extracanonicoShelf=await VerboModules.loadExtracanonicoShelf(); }
      catch(error){ console.error(error); extracanonicoShelf=[]; }
    }
    if(!extracanonicoShelf.length){ els.panelBody.innerHTML=emptyState('📜',t('extracanonico.coleccionPreparacion')); return; }
    const shelfHTML=`<div class="church-shelf">${extracanonicoShelf.map(extracanonicoShelfItemHTML).join('')}</div>`;
    els.panelBody.innerHTML=`<div class="history-search-autocomplete church-shelf__quicksearch">
         <input id="extracanonicoQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('extracanonico.buscarPlaceholder')}" autocomplete="off">
         <div id="extracanonicoQuickSearchPredictions" class="history-predictions"></div>
       </div>${shelfHTML}`;
    wireExtracanonicoShelf();
    applyChurchShelfTranslation(extracanonicoShelf,'extracanonico');
    wireQuickSearchInput(document.getElementById('extracanonicoQuickSearchInput'), document.getElementById('extracanonicoQuickSearchPredictions'), extracanonicoQuickIndex, selectExtracanonicoQuickResult, {loadingLabel:t('extracanonico.indiceCargando'), sourceLang:'en', moduleId:'extracanonico'});
  }

  function extracanonicoBackToShelf(){
    extracanonicoOpenWork=null;
    extracanonicoOpenId=null;
    extracanonicoDocData=null;
    els.side.classList.remove('side-panel--history-expanded');
    renderExtracanonicoPanel();
    els.panelBody.scrollTop=0;
  }

  function openExtracanonicoEntryFromIndex(id){
    extracanonicoOpenId=id;
    els.side.classList.add('side-panel--history-expanded');
    els.side.offsetHeight; // fuerza reflow, mismo patrón que openCostumbresEntryFromIndex
    renderExtracanonicoEntry();
    els.panelBody.scrollTop=0;
  }
  function wireExtracanonicoIndex(){
    els.panelBody.querySelectorAll('[data-extracanonico-entry]').forEach(btn=>btn.addEventListener('click',()=>openExtracanonicoEntryFromIndex(btn.dataset.extracanonicoEntry)));
  }
  async function renderExtracanonicoIndex(){
    if(!extracanonicoDocData || extracanonicoDocData.manifest.id!==extracanonicoOpenWork){
      els.panelBody.innerHTML=emptyState('⌛',t('extracanonico.cargandoObra'));
      try{ extracanonicoDocData=await VerboModules.loadExtracanonico(extracanonicoOpenWork); }
      catch(error){ console.error(error); }
    }
    if(!extracanonicoDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('extracanonico.errorObra')); return; }
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML=`<button class="note-card__copy" id="backToExtracanonicoShelf" type="button">← ${t('extracanonico.volverEstante')}</button>`;
    document.getElementById('backToExtracanonicoShelf')?.addEventListener('click',extracanonicoBackToShelf);

    const entries=extracanonicoDocData.entries||[];
    if(!entries.length){ els.panelBody.innerHTML=emptyState('📜',t('extracanonico.sinContenido')); return; }
    const sorted=[...entries].sort((a,b)=>(a.capituloNumero||0)-(b.capituloNumero||0));
    // La nota editorial (capituloNumero 0) ya está en español (contenido
    // propio de Verbo, no de la fuente histórica en inglés) — se etiqueta
    // con la cadena i18n normal en vez de pasar por el traductor de índice
    // (ver translateExtracanonicoIndexTitles, que solo recorre entradas
    // capituloNumero>0).
    const list=sorted.map(e=>e.capituloNumero===0
      ? `<button type="button" class="dictionary-library__item" data-extracanonico-entry="${escapeHTML(e.id)}">
        <span>📖 ${escapeHTML(t('extracanonico.notaEditorial'))}</span>
      </button>`
      : `<button type="button" class="dictionary-library__item" data-extracanonico-entry="${escapeHTML(e.id)}">
        <span data-extracanonico-index-title="${escapeHTML(e.id)}">${escapeHTML(e.titulo)}</span>
      </button>`).join('');
    els.panelBody.innerHTML=`<div class="dictionary-library"><div class="dictionary-library__count">${t('padres.seccionesCount',{count:sorted.length-1})}</div><div>${list}</div></div>`;
    wireExtracanonicoIndex();
    translateExtracanonicoIndexTitles(extracanonicoDocData);
  }

  // Traduce cada título del índice por separado, con un pool de workers
  // concurrentes — mismo patrón que translateCostumbresIndexTitles (evita el
  // bug de lote único reportado por Juan el 2026-08-13: ver comentario allí).
  async function translateExtracanonicoIndexTitles(docData){
    const source=docData.manifest.language||'en';
    const target=contentLang();
    if(source===target) return;
    const labelEls=[...els.panelBody.querySelectorAll('[data-extracanonico-index-title]')];
    if(!labelEls.length) return;
    const token=++extracanonicoIndexToken;
    let index=0;
    async function worker(){
      while(index<labelEls.length){
        if(token!==extracanonicoIndexToken) return;
        const el=labelEls[index++];
        if(el.dataset.translated===target) continue;
        const original=el.textContent;
        if(!original) continue;
        const id=el.dataset.extracanonicoIndexTitle;
        const translated=await translateCommentaryHeader(`extracanonico-index:${docData.manifest.id}:${id}`,'label',original,source,target);
        if(token!==extracanonicoIndexToken) return;
        el.textContent=translated;
        el.dataset.translated=target;
      }
    }
    await Promise.all(Array.from({length:Math.min(4,labelEls.length)},worker));
  }

  function renderExtracanonicoEntry(){
    npRefreshIfOpen(); // sincroniza la pestaña Extracanónico del popup si ya estaba abierto
    const entry=(extracanonicoDocData.entries||[]).find(e=>e.id===extracanonicoOpenId);
    if(!entry){ extracanonicoOpenId=null; els.panelBody.innerHTML=emptyState('⚠️',t('extracanonico.entradaNoEncontrada')); return; }
    const entries=extracanonicoDocData.entries||[];
    const idx=entries.findIndex(e=>e.id===entry.id);
    const previous=idx>0?entries[idx-1]:null;
    const next=idx>=0 && idx<entries.length-1?entries[idx+1]:null;
    els.panelToolbar.innerHTML=`
      <button class="note-card__copy" id="backToExtracanonicoIndex" type="button">← ${t('extracanonico.volverIndice')}</button>
      <button id="extracanonicoExpand" class="history-panel-expand" type="button" aria-pressed="${els.side.classList.contains('side-panel--history-expanded')?'true':'false'}">${els.side.classList.contains('side-panel--history-expanded')?t('historia.vistaCompacta'):t('historia.ampliarLectura')}</button>`;
    document.getElementById('backToExtracanonicoIndex')?.addEventListener('click',()=>{
      els.side.classList.remove('side-panel--history-expanded');
      extracanonicoOpenId=null;
      renderExtracanonicoPanel();
      els.panelBody.scrollTop=0;
    });
    document.getElementById('extracanonicoExpand')?.addEventListener('click',event=>{
      const scrollTop=els.panelBody.scrollTop;
      const expanded=els.side.classList.toggle('side-panel--history-expanded');
      event.currentTarget.setAttribute('aria-pressed',String(expanded));
      event.currentTarget.textContent=expanded?t('historia.vistaCompacta'):t('historia.ampliarLectura');
      requestAnimationFrame(()=>{ els.panelBody.scrollTop=scrollTop; });
    });
    // Fase 5 (aparato editorial): la nota fija de la obra (entrada
    // capituloNumero 0) debe ser visible ANTES del cuerpo del texto sin
    // importar por dónde navegue el usuario (índice, buscador rápido,
    // anterior/siguiente) — no basta con que sea el primer ítem del índice,
    // porque ese primer ítem es saltable. Se repite como aviso plegable
    // (visible, no forzado a expandirse cada vez) encima de cada capítulo,
    // salvo cuando la entrada abierta ES la propia nota.
    const editorialNote=entry.capituloNumero===0 ? null : entries.find(e=>e.capituloNumero===0);
    const editorialBannerHtml=editorialNote?`<details class="gospel-match" data-extracanonico-editorial-note>
        <summary style="cursor:pointer;font-weight:600;">${t('extracanonico.notaEditorial')}</summary>
        <div style="padding-top:8px;" data-extracanonico-editorial-body>${editorialNote.content}</div>
      </details>`:'';
    els.panelBody.innerHTML=`<article class="dict-entry history-reader">
      ${editorialBannerHtml}
      <div class="dict-entry__term" data-extracanonico-entry-id="${escapeHTML(entry.id)}">${escapeHTML(entry.titulo)}</div>
      <div class="dict-entry__source">${escapeHTML(extracanonicoDocData.manifest.abbreviation||extracanonicoDocData.manifest.name)}</div>
      <div class="dict-entry__def" data-extracanonico-entry-id="${escapeHTML(entry.id)}">${entry.content||''}</div>
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-extracanonico-neighbor="${escapeHTML(previous.id)}" data-nav-dir="prev">← ${t('extracanonico.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-extracanonico-neighbor="${escapeHTML(next.id)}" data-nav-dir="next">${t('extracanonico.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    els.panelBody.querySelectorAll('[data-extracanonico-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      extracanonicoOpenId=button.dataset.extracanonicoNeighbor;
      renderExtracanonicoEntry();
      els.panelBody.scrollTop=0;
    }));
    // La nota editorial (capituloNumero 0) ya está escrita en español por
    // Verbo, no en el idioma de la fuente histórica del manifiesto — se
    // traduce con sourceLang fijo 'es' en vez del 'en' de la obra (ver
    // applyExtracanonicoTranslation). El aviso plegable repetido en cada
    // capítulo (editorialBannerHtml) se traduce aparte, más abajo.
    applyExtracanonicoTranslation(entry, entry.capituloNumero===0?'es':null);
    if(editorialNote) applyExtracanonicoEditorialBanner(editorialNote);
  }

  async function applyExtracanonicoTranslation(entry, sourceOverride=null){
    // sourceOverride='es' se usa para la nota editorial (capituloNumero 0):
    // es contenido propio de Verbo en español, no la fuente histórica en
    // inglés del manifiesto — mismo patrón que translateCostumbresGroupLabels
    // (sourceLang fijo 'es' para metadata curada a mano por Juan).
    const source=sourceOverride||extracanonicoDocData.manifest.language||'en';
    const target=contentLang();
    if(!source || source===target) return;
    const termEl=els.panelBody.querySelector(`.dict-entry__term[data-extracanonico-entry-id="${CSS.escape(entry.id)}"]`);
    const defEl=els.panelBody.querySelector(`.dict-entry__def[data-extracanonico-entry-id="${CSS.escape(entry.id)}"]`);
    if(!termEl||!defEl) return;
    if(termEl.dataset.translated!==target){
      termEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`extracanonico:${entry.id}`,'title',entry.titulo,source,target);
      if(termEl.dataset.translated==='pending'){ termEl.textContent=translatedTitle; termEl.dataset.translated=target; }
    }
    if(defEl.dataset.translated!==target){
      defEl.dataset.translated='pending';
      const translated=await translateEntry(`extracanonico:${entry.id}`, entry.content||'', source, target);
      if(defEl.dataset.translated==='pending'){ defEl.innerHTML=translated; defEl.dataset.translated=target; }
    }
  }

  // Traduce el aviso plegable de nota editorial que se repite encima de cada
  // capítulo (ver renderExtracanonicoEntry) — sourceLang fijo 'es' porque es
  // contenido propio de Verbo, igual que applyExtracanonicoTranslation con
  // sourceOverride para la nota abierta como entrada.
  async function applyExtracanonicoEditorialBanner(editorialNote){
    const target=contentLang();
    if(target==='es') return;
    const bodyEl=els.panelBody.querySelector('[data-extracanonico-editorial-body]');
    if(!bodyEl || bodyEl.dataset.translated===target) return;
    bodyEl.dataset.translated='pending';
    const translated=await translateEntry(`extracanonico-banner:${editorialNote.id}`, editorialNote.content||'', 'es', target);
    if(bodyEl.dataset.translated==='pending'){ bodyEl.innerHTML=translated; bodyEl.dataset.translated=target; }
  }
  // ── Fin Literatura Extracanónica ─────────────────────────────────────────

  // ── Diccionarios ──────────────────────────────────────────────────────────
  // Diccionarios bíblicos alfabéticos (Easton, Smith, Hitchcock) — antes
  // vivían dentro de Costumbres y Tradiciones bajo la categoría "Diccionario
  // bíblico", separados a su propia sección porque son un tipo de obra
  // distinto (por palabra, no por versículo/capítulo). Mismos 3 niveles que
  // Padres Apostólicos/Costumbres (estante → índice de la obra → entrada),
  // reutilizando el mismo CSS (.church-shelf, .history-toc,
  // .dictionary-library, .dict-entry) y el motor de traducción de
  // Comentario/Historia.
  function diccionariosShelfItemHTML(volume){
    return `<div class="church-shelf__item" data-diccionarios-shelf-volume="${escapeHTML(volume.id)}" tabindex="0" role="group" aria-label="${escapeHTML(volume.titulo)}">
      <img class="church-shelf__cover" src="${escapeHTML(volume.cover)}" alt="" loading="lazy">
      <div class="church-shelf__title" data-shelf-title="${escapeHTML(volume.id)}">${escapeHTML(volume.titulo)}</div>
      <div class="church-shelf__overlay">
        ${volume.periodo?`<div class="church-shelf__overlay-period" data-shelf-period="${escapeHTML(volume.id)}">${escapeHTML(volume.periodo)}</div>`:''}
        <p class="church-shelf__overlay-summary" data-shelf-summary="${escapeHTML(volume.id)}">${escapeHTML(volume.resumenBreve||'')}</p>
        <button type="button" class="church-shelf__read-btn" data-diccionarios-shelf-read="${escapeHTML(volume.id)}">${t('diccionarios.leer')} →</button>
      </div>
    </div>`;
  }
  function wireDiccionariosShelf(){
    els.panelBody.querySelectorAll('[data-diccionarios-shelf-volume]').forEach(item=>{
      const toggle=()=>item.classList.toggle('church-shelf__item--active');
      item.addEventListener('click',event=>{ if(event.target.closest('[data-diccionarios-shelf-read]')) return; toggle(); });
      item.addEventListener('keydown',event=>{
        if(event.target.closest('[data-diccionarios-shelf-read]')) return;
        if(event.key==='Enter'||event.key===' '){ event.preventDefault(); toggle(); }
      });
    });
    els.panelBody.querySelectorAll('[data-diccionarios-shelf-read]').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      diccionariosOpenWork=btn.dataset.diccionariosShelfRead;
      diccionariosOpenId=null;
      diccionariosDocData=null;
      renderDiccionariosPanel();
      els.panelBody.scrollTop=0;
    }));
  }

  // Índice del buscador rápido del estante de Diccionarios: mismo patrón que
  // patristicQuickIndex/costumbresQuickIndex — la primera vez que el usuario
  // busca se cargan las 3 obras del estante (Easton/Smith/Hitchcock, ~10MB
  // en total) y se cachean tanto el índice de títulos como los datos
  // completos de cada obra (diccionariosQuickIndexWorks), para navegar al
  // instante sin volver a pedir nada por red.
  let diccionariosQuickIndexCache=null, diccionariosQuickIndexPromise=null;
  const diccionariosQuickIndexWorks=new Map();
  function diccionariosQuickIndex(){
    if(diccionariosQuickIndexCache) return diccionariosQuickIndexCache;
    if(diccionariosQuickIndexPromise) return diccionariosQuickIndexPromise;
    diccionariosQuickIndexPromise=(async()=>{
      if(!diccionariosShelf){
        try{ diccionariosShelf=await VerboModules.loadDiccionariosShelf(); }
        catch(error){ console.error(error); diccionariosShelf=[]; }
      }
      const works=await Promise.all(diccionariosShelf.map(v=>VerboModules.loadDiccionarios(v.id).catch(error=>{ console.warn(error); return null; })));
      const items=[];
      works.forEach((data,i)=>{
        if(!data) return;
        const volume=diccionariosShelf[i];
        diccionariosQuickIndexWorks.set(volume.id,data);
        (data.entries||[]).forEach(entry=>{
          // capituloTitulo (navegación temática, el único modo que usan estos
          // 3 diccionarios) o titulo — mismo campo que usa el índice de nivel
          // 2 para mostrar cada entrada.
          const entryTitle=entry.capituloTitulo||entry.titulo||'';
          items.push({
            label:`${volume.titulo} — ${entryTitle}`, prefixPart:volume.titulo, titlePart:entryTitle,
            quickKey:`${volume.id}:${entry.id}`, workId:volume.id, entryId:entry.id
          });
        });
      });
      diccionariosQuickIndexCache=items;
      return items;
    })();
    return diccionariosQuickIndexPromise;
  }
  function selectDiccionariosQuickResult(item){
    const cached=diccionariosQuickIndexWorks.get(item.workId);
    if(cached) diccionariosDocData=cached;
    diccionariosOpenWork=item.workId;
    diccionariosOpenId=item.entryId;
    renderDiccionariosPanel();
  }
  async function renderDiccionariosPanel(){
    els.panelTitle.textContent=t('diccionarios.title');
    els.panelToolbar.innerHTML='';

    // Nivel 3: entrada abierta dentro de una obra
    if(diccionariosOpenWork && diccionariosOpenId){
      if(!diccionariosDocData || diccionariosDocData.manifest.id!==diccionariosOpenWork){
        els.panelBody.innerHTML=emptyState('⌛',t('diccionarios.cargandoObra'));
        try{ diccionariosDocData=await VerboModules.loadDiccionarios(diccionariosOpenWork); }
        catch(error){ console.error(error); }
      }
      if(!diccionariosDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('diccionarios.errorObra')); return; }
      renderDiccionariosEntry();
      return;
    }

    // Nivel 2: índice de la obra elegida
    if(diccionariosOpenWork){
      await renderDiccionariosIndex();
      return;
    }

    // Nivel 1: estante de portadas (Easton, Smith, Hitchcock — una sola
    // cuadrícula, sin agrupar por categoría, las 3 son el mismo tipo de obra).
    els.side.classList.remove('side-panel--history-expanded');
    if(!diccionariosShelf){
      try{ diccionariosShelf=await VerboModules.loadDiccionariosShelf(); }
      catch(error){ console.error(error); diccionariosShelf=[]; }
    }
    if(!diccionariosShelf.length){ els.panelBody.innerHTML=emptyState('📖',t('diccionarios.coleccionPreparacion')); return; }
    const shelfHTML=diccionariosShelf.length ? `<div class="church-shelf">${diccionariosShelf.map(diccionariosShelfItemHTML).join('')}</div>` : '';
    els.panelBody.innerHTML=shelfHTML
      ? `<div class="history-search-autocomplete church-shelf__quicksearch">
           <input id="diccionariosQuickSearchInput" class="search-panel-input" type="search" placeholder="${t('diccionarios.buscarPlaceholder')}" autocomplete="off">
           <div id="diccionariosQuickSearchPredictions" class="history-predictions"></div>
         </div>${shelfHTML}`
      : emptyState('📖',t('diccionarios.coleccionPreparacion'));
    wireDiccionariosShelf();
    applyChurchShelfTranslation(diccionariosShelf,'diccionarios');
    wireQuickSearchInput(document.getElementById('diccionariosQuickSearchInput'), document.getElementById('diccionariosQuickSearchPredictions'), diccionariosQuickIndex, selectDiccionariosQuickResult, {loadingLabel:t('diccionarios.indiceCargando'), sourceLang:'en', moduleId:'diccionarios'});
  }

  function diccionariosBackToShelf(){
    diccionariosOpenWork=null;
    diccionariosOpenId=null;
    diccionariosDocData=null;
    els.side.classList.remove('side-panel--history-expanded');
    renderDiccionariosPanel();
    els.panelBody.scrollTop=0;
  }

  function diccionariosTocRowHTML(entry){
    const label=entry.titulo || (entry.versiculoInicio!=null
      ? `${entry.capitulo}:${entry.versiculoInicio}${entry.versiculoFin && entry.versiculoFin!==entry.versiculoInicio ? '-'+entry.versiculoFin : ''}`
      : `${t('historia.toc.libro')} ${entry.capitulo||''}`);
    return `<li class="history-toc__row" data-diccionarios-toc-id="${escapeHTML(entry.id)}" tabindex="0"><span data-diccionarios-toc-label="${escapeHTML(entry.id)}">${escapeHTML(label)}</span></li>`;
  }
  function diccionariosTocGroupHTML(group){
    return `<section class="history-toc__group">
      <h3 class="history-toc__group-title" data-diccionarios-toc-group="${escapeHTML(group.key)}">${escapeHTML(group.label)}</h3>
      <ol class="history-toc__list">${group.items.map(diccionariosTocRowHTML).join('')}</ol>
    </section>`;
  }
  function openDiccionariosEntryFromIndex(id){
    diccionariosOpenId=id;
    els.side.classList.add('side-panel--history-expanded');
    els.side.offsetHeight; // fuerza reflow, mismo patrón que openChurchHistoryEntryFromTOC
    renderDiccionariosEntry();
    els.panelBody.scrollTop=0;
  }
  function wireDiccionariosIndex(){
    els.panelBody.querySelectorAll('[data-diccionarios-toc-id]').forEach(row=>{
      row.addEventListener('click',()=>openDiccionariosEntryFromIndex(row.dataset.diccionariosTocId));
      row.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){ event.preventDefault(); openDiccionariosEntryFromIndex(row.dataset.diccionariosTocId); } });
    });
    els.panelBody.querySelectorAll('[data-diccionarios-entry]').forEach(btn=>btn.addEventListener('click',()=>openDiccionariosEntryFromIndex(btn.dataset.diccionariosEntry)));
  }
  async function renderDiccionariosIndex(){
    if(!diccionariosDocData || diccionariosDocData.manifest.id!==diccionariosOpenWork){
      els.panelBody.innerHTML=emptyState('⌛',t('diccionarios.cargandoObra'));
      try{ diccionariosDocData=await VerboModules.loadDiccionarios(diccionariosOpenWork); }
      catch(error){ console.error(error); }
    }
    if(!diccionariosDocData){ els.panelBody.innerHTML=emptyState('⚠️',t('diccionarios.errorObra')); return; }
    els.side.classList.remove('side-panel--history-expanded');
    els.panelToolbar.innerHTML=`<button class="note-card__copy" id="backToDiccionariosShelf" type="button">← ${t('diccionarios.volverEstante')}</button>`;
    document.getElementById('backToDiccionariosShelf')?.addEventListener('click',diccionariosBackToShelf);

    const entries=diccionariosDocData.entries||[];
    if(!entries.length){
      els.panelBody.innerHTML=emptyState('📜',t('diccionarios.sinContenido'));
      return;
    }
    let biblicalGroups=null;
    // Umbral heredado de Costumbres (ver renderCostumbresIndex): con pocas
    // entradas el buscador es puro ruido. Los 3 diccionarios de acá (miles de
    // entradas cada uno) siempre lo superan, pero se deja el mismo chequeo
    // por si algún día se suma uno más chico.
    const DICCIONARIOS_SEARCH_MIN_ENTRIES=100;
    const searchHTML=entries.length>DICCIONARIOS_SEARCH_MIN_ENTRIES
      ? `<div class="history-search-autocomplete">
           <input class="search-panel-input" id="diccionariosIndexSearch" type="search" placeholder="${escapeHTML(t('diccionarios.buscarEnObraPlaceholder'))}" autocomplete="off">
           <div id="diccionariosIndexSearchPredictions" class="history-predictions"></div>
         </div>`
      : '';
    if(diccionariosDocData.manifest.navegacion==='biblico'){
      biblicalGroups=churchHistoryGroupByOrder(entries, entry=>entry.libro)
        .map(g=>({key:g.key, label: catalog.books.find(b=>b.id===g.key)?.name || g.key, items:g.items}));
      els.panelBody.innerHTML=`<div class="dictionary-library">${searchHTML}</div><div class="history-toc">${biblicalGroups.map(diccionariosTocGroupHTML).join('')}</div>`;
    } else {
      const sorted=[...entries].sort((a,b)=>(a.capituloNumero||0)-(b.capituloNumero||0));
      const list=sorted.map(e=>`
        <button type="button" class="dictionary-library__item" data-diccionarios-entry="${escapeHTML(e.id)}">
          <span data-diccionarios-index-title="${escapeHTML(e.id)}">${escapeHTML(e.capituloTitulo||e.titulo)}</span>
        </button>`).join('');
      els.panelBody.innerHTML=`<div class="dictionary-library">${searchHTML}<div class="dictionary-library__count">${t('padres.seccionesCount',{count:sorted.length})}</div><div>${list}</div></div>`;
    }
    wireDiccionariosIndex();
    wireDiccionariosIndexSearch();
    translateDiccionariosIndexTitles(diccionariosDocData);
    if(biblicalGroups) translateDiccionariosGroupLabels(biblicalGroups);
  }

  // Buscador predictivo dentro del índice de UNA obra ya abierta (ej. las
  // ~4000 entradas de Easton) — misma infraestructura que el buscador del
  // estante (wireQuickSearchInput/quickSearchMatches), pero con un índice
  // síncrono acotado a diccionariosDocData (ya en memoria, sin promesa) en vez
  // de todas las obras. Distinto de diccionariosQuickSearchInput (nivel 1,
  // busca en TODAS las obras a la vez).
  function diccionariosIndexQuickItems(){
    return (diccionariosDocData.entries||[]).map(e=>({label:e.capituloTitulo||e.titulo||'', entryId:e.id}));
  }
  function wireDiccionariosIndexSearch(){
    const input=document.getElementById('diccionariosIndexSearch');
    const box=document.getElementById('diccionariosIndexSearchPredictions');
    if(!input||!box) return;
    wireQuickSearchInput(input, box, diccionariosIndexQuickItems, item=>{
      input.value='';
      box.classList.remove('history-predictions--visible');
      openDiccionariosEntryFromIndex(item.entryId);
    }, {sourceLang:diccionariosDocData.manifest.language||'en', moduleId:`diccionarios-index:${diccionariosDocData.manifest.id}`});
  }
  // Encabezados de grupo del índice bíblico (nombre del libro, ej. "Génesis"):
  // ninguno de los 3 diccionarios de acá usa navegación "biblico" hoy, pero
  // se deja la misma lógica que Costumbres por si se suma uno que sí — a
  // diferencia del resto del índice (traducido en translateDiccionariosIndexTitles
  // con el idioma de la OBRA como origen), estos encabezados
  // vienen de catalog.books, que solo existe en español (es metadata de la
  // versión de la Biblia, no de la obra) — por eso quedaban sin traducir cuando
  // la interfaz estaba en inglés (bug reportado por Juan, 2026-08-13). Se
  // traducen aparte, con sourceLang fijo 'es', igual que applyChurchShelfTranslation.
  async function translateDiccionariosGroupLabels(groups){
    const target=contentLang();
    if(target==='es') return;
    for(const group of groups){
      const el=els.panelBody.querySelector(`[data-diccionarios-toc-group="${CSS.escape(group.key)}"]`);
      if(!el || el.dataset.translated===target || !group.label) continue;
      const translated=await translateCommentaryHeader(`diccionarios-group:${group.key}`,'label',group.label,'es',target);
      el.textContent=translated;
      el.dataset.translated=target;
    }
  }

  // Traduce cada título del índice visible por separado, con un pool de
  // workers concurrentes — mismo patrón que translateCostumbresIndexTitles/
  // applyChurchHistoryTocTranslation. En Costumbres, armar UN solo request
  // con todos los títulos de una obra unidos por un delimitador ("@@@")
  // rompía en obras grandes (el texto superaba el umbral de envío directo y
  // se troceaba en fragmentos que Claude traducía sin noción del delimitador,
  // descartando TODO el índice sin traducir — bug reportado por Juan,
  // 2026-08-13). Con miles de entradas cada uno, Easton/Smith/Hitchcock son
  // exactamente el caso que rompía eso; por título separado no hay techo de
  // tamaño de lote, cada uno cachea aparte, y si uno falla el resto igual se
  // traduce.
  async function translateDiccionariosIndexTitles(docData){
    const source=docData.manifest.language||'en';
    const target=contentLang();
    if(source===target) return;
    const labelEls=[...els.panelBody.querySelectorAll('[data-diccionarios-toc-label],[data-diccionarios-index-title]')];
    if(!labelEls.length) return;
    const token=++diccionariosIndexToken;
    let index=0;
    async function worker(){
      while(index<labelEls.length){
        if(token!==diccionariosIndexToken) return;
        const el=labelEls[index++];
        if(el.dataset.translated===target) continue;
        const original=el.textContent;
        if(!original) continue;
        const id=el.dataset.diccionariosTocLabel || el.dataset.diccionariosIndexTitle;
        const translated=await translateCommentaryHeader(`diccionarios-index:${docData.manifest.id}:${id}`,'label',original,source,target);
        if(token!==diccionariosIndexToken) return;
        el.textContent=translated;
        el.dataset.translated=target;
      }
    }
    await Promise.all(Array.from({length:Math.min(4,labelEls.length)},worker));
  }

  function renderDiccionariosEntry(){
    npRefreshIfOpen(); // sincroniza la pestaña Diccionarios del popup si ya estaba abierto
    const entry=(diccionariosDocData.entries||[]).find(e=>e.id===diccionariosOpenId);
    if(!entry){ diccionariosOpenId=null; els.panelBody.innerHTML=emptyState('⚠️',t('diccionarios.entradaNoEncontrada')); return; }
    const entries=diccionariosDocData.entries||[];
    const idx=entries.findIndex(e=>e.id===entry.id);
    const previous=idx>0?entries[idx-1]:null;
    const next=idx>=0 && idx<entries.length-1?entries[idx+1]:null;
    els.panelToolbar.innerHTML=`
      <button class="note-card__copy" id="backToDiccionariosIndex" type="button">← ${t('diccionarios.volverIndice')}</button>
      <button id="diccionariosExpand" class="history-panel-expand" type="button" aria-pressed="${els.side.classList.contains('side-panel--history-expanded')?'true':'false'}">${els.side.classList.contains('side-panel--history-expanded')?t('historia.vistaCompacta'):t('historia.ampliarLectura')}</button>`;
    document.getElementById('backToDiccionariosIndex')?.addEventListener('click',()=>{
      els.side.classList.remove('side-panel--history-expanded');
      diccionariosOpenId=null;
      renderDiccionariosPanel();
      els.panelBody.scrollTop=0;
    });
    document.getElementById('diccionariosExpand')?.addEventListener('click',event=>{
      const scrollTop=els.panelBody.scrollTop;
      const expanded=els.side.classList.toggle('side-panel--history-expanded');
      event.currentTarget.setAttribute('aria-pressed',String(expanded));
      event.currentTarget.textContent=expanded?t('historia.vistaCompacta'):t('historia.ampliarLectura');
      requestAnimationFrame(()=>{ els.panelBody.scrollTop=scrollTop; });
    });
    els.panelBody.innerHTML=`<article class="dict-entry history-reader">
      <div class="dict-entry__term" data-diccionarios-entry-id="${escapeHTML(entry.id)}">${escapeHTML(entry.titulo)}</div>
      <div class="dict-entry__source">${escapeHTML(diccionariosDocData.manifest.abbreviation||diccionariosDocData.manifest.name)}</div>
      <div class="dict-entry__def" data-diccionarios-entry-id="${escapeHTML(entry.id)}">${entry.content||entry.excerpt||''}</div>
      <nav class="history-entry-nav" aria-label="${t('historia.navegacionLectura')}">
        ${previous?`<button type="button" class="history-entry-nav__button" data-diccionarios-neighbor="${escapeHTML(previous.id)}" data-nav-dir="prev">← ${t('diccionarios.anterior')}</button>`:'<span></span>'}
        ${next?`<button type="button" class="history-entry-nav__button" data-diccionarios-neighbor="${escapeHTML(next.id)}" data-nav-dir="next">${t('diccionarios.siguiente')} →</button>`:'<span></span>'}
      </nav>
    </article>`;
    els.panelBody.querySelectorAll('[data-diccionarios-neighbor]').forEach(button=>button.addEventListener('click',()=>{
      diccionariosOpenId=button.dataset.diccionariosNeighbor;
      renderDiccionariosEntry();
      els.panelBody.scrollTop=0;
    }));
    applyDiccionariosTranslation(entry);
  }

  async function applyDiccionariosTranslation(entry){
    const source=diccionariosDocData.manifest.language||'en';
    const target=contentLang();
    if(!source || source===target) return;
    const termEl=els.panelBody.querySelector(`.dict-entry__term[data-diccionarios-entry-id="${CSS.escape(entry.id)}"]`);
    const defEl=els.panelBody.querySelector(`.dict-entry__def[data-diccionarios-entry-id="${CSS.escape(entry.id)}"]`);
    if(!termEl||!defEl) return;
    if(termEl.dataset.translated!==target){
      termEl.dataset.translated='pending';
      const translatedTitle=await translateCommentaryHeader(`diccionarios:${entry.id}`,'title',entry.titulo,source,target);
      if(termEl.dataset.translated==='pending'){ termEl.textContent=translatedTitle; termEl.dataset.translated=target; }
    }
    if(defEl.dataset.translated!==target){
      defEl.dataset.translated='pending';
      const translated=await translateEntry(`diccionarios:${entry.id}`, entry.content||entry.excerpt||'', source, target);
      if(defEl.dataset.translated==='pending'){ defEl.innerHTML=translated; defEl.dataset.translated=target; }
    }
  }
  // ── Fin Diccionarios y Tradiciones ────────────────────────────────────────

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
  // El nombre de cada unidad bíblica (Mina, Siclo, Talento…) queda sin
  // traducir a propósito — ver comentario de CONVERSOR_LABELS_EN arriba.
  // Pero el texto explicativo entre paréntesis ("50 siclos", "6 codos") no
  // es una decisión de transliteración del nombre propio, es solo la
  // cantidad+unidad de referencia — sí debería traducirse. Vocabulario
  // genérico y chico (nunca crece salvo que se agreguen categorías nuevas
  // al conversor), por eso alcanza con diccionario estático en vez de
  // mandarlo a /translate (evita el mismo tipo de fragmento corto y sin
  // contexto que ya rompió otra traducción — ver bug de "10 fragmentos").
  const CONVERSOR_PAREN_WORDS_EN = {
    'medio':'half', 'siclo':'shekel', 'siclos':'shekels',
    'codo':'cubit', 'codos':'cubits',
    'coro':'cor', 'efa':'ephah', 'efas':'ephahs',
    'moneda':'coin', 'monedas':'coins',
    'dracma':'drachma', 'dracmas':'drachmas',
    'ómer':'omer', 'tetradracma':'tetradrachm', 'blanca':'mite'
  };
  function localizeConversorNombre(nombre){
    if(contentLang()!=='en') return nombre;
    return nombre.replace(/\(([^)]+)\)/, (match, inner) =>
      `(${inner.replace(/[A-Za-zÀ-ÿ]+/g, w => CONVERSOR_PAREN_WORDS_EN[w.toLowerCase()] || w)})`
    );
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
    const unitOptions=categoria.unidades.map(u=>`<option value="${escapeHTML(u.id)}" ${u.id===conversorUnidadOrigen?'selected':''}>${escapeHTML(localizeConversorNombre(u.nombre))}</option>`).join('');
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

  // Punto de entrada para CUALQUIER clic en un código Strong fuera del panel
  // Biblia Strong (ej. .strongs-tag de la Biblia principal si tiene datos
  // Strong propios como KJV+, o un enlace a.strong dentro de un comentario):
  // abre directamente el pop-up flotante (.strong-def-popup, superpuesto
  // dentro del panel actual — ver strongPopupEls()) SIN cambiar de pestaña.
  // Antes forzaba la pestaña "Idiomas bíblicos"; eso perdía el scroll del
  // panel de origen (ej. Comentario) al volver — pedido explícito de Juan.
  async function openDictionary(code){
    await openStrongPopup(code);
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
    if(e.target.closest?.('#studyAssistant')) return;
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
      } else notifySelectedPassageChange();
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
    // El ícono "notas" es el único punto de entrada al popup unificado de
    // notas (ver npBuild/openNotasPopup más arriba): se intercepta ANTES del
    // gate de "armar" de íconos móviles y ANTES de la rama de modo sermón a
    // propósito — abrir el popup es un overlay global, no una navegación que
    // arriesgue perder el lugar de lectura ni deba desviarse al segundo panel
    // de predicación (mismo componente en ambos modos). Mismo razonamiento
    // que tenía antes el ícono ya retirado de "Notas de Historia".
    if(b.dataset.tab==='notas'){
      clearMobileToolArm();
      toggleNotasPopup();
      return;
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
    // En modo sermón, Comparar/Comentarios/Mis prédicas/
    // Diccionario no reemplazan el panel de Biblia: comparten un segundo
    // panel lado a lado (ver .sermon-compare-panel), fuera del sistema de
    // panel único que usa el resto de la app. Ese layout de 3 columnas no se
    // resuelve debajo de 900px (.sermon-compare-panel queda display:none —
    // ver style.css), así que por debajo de ese ancho estos cinco caen al
    // sistema de panel único de siempre (reemplaza a Biblia), igual que
    // cualquier otra pestaña en móvil — la alternativa era que el ícono no
    // hiciera nada visible ahí.
    // Mapas es la excepción deliberada: usa exactamente el panel ancho del
    // modo normal. Cierra los otros paneles y deja el editor en el espacio
    // residual, como la lectura bíblica normal cuando abre el Atlas.
    if(sermonMode && b.dataset.tab==='mapas'){
      resetXrefMode();
      closeSermonSidePanel();
      activeTab==='mapas' ? closePanel() : openPanel('mapas');
      return;
    }
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
  els.shareVerse?.addEventListener('click', shareSelectedVerses);
  els.closeVerseAction?.addEventListener('click', ()=>{
    selectedVerses.clear();
    document.querySelectorAll('.verse--selected').forEach(x=>x.classList.remove('verse--selected'));
    updateActionBar();
    notifySelectedPassageChange();
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
      notifySelectedPassageChange();
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
      if(sermonPanelTab==='mapas') document.querySelector('#verboAtlasFrame')?.contentWindow?.VerboAtlas?.setLanguage(contentLang());
      else if(sermonPanelTab) renderSermonSidePanel(sermonPanelTab);
      else if(activeTab==='mapas') document.querySelector('#verboAtlasFrame')?.contentWindow?.VerboAtlas?.setLanguage(contentLang());
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
