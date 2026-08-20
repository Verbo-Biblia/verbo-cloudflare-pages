/* Texto a voz compartido de Verbo (Web Speech API / SpeechSynthesis).
   Módulo aislado — Paso 1: define normalizarTexto() y leerBloque(), sin
   conectarse todavía a ninguna página de Recursos ni Librería. La
   integración por página (qué elementos leer, botón, "siguiente artículo/
   capítulo") vive en cada sitio, no aquí — este módulo no sabe nada de
   Recursos ni de Librería.
   Mismo patrón que el resto de /biblia/assets/ (window.VerboXxx, sin
   import/export ES — ver backup.js, sync.js). */
window.VerboTTS = (() => {

  // ── Tabla de libros bíblicos: sinónimos/abreviaturas -> nombre canónico
  // por idioma. Incluye al menos los libros pedidos por la tarea original;
  // se agregó Amós porque el caso de prueba de las cartas de Rutherford
  // ("Amós ix. 9") lo necesita, aunque no estaba en la lista mínima.
  const LIBROS = [
    { es: 'Génesis', en: 'Genesis', abbr: ['Gn', 'Gen'] },
    { es: 'Éxodo', en: 'Exodus', abbr: ['Ex', 'Exo'] },
    { es: 'Salmos', en: 'Psalms', abbr: ['Sal', 'Salmo', 'Ps', 'Psa', 'Psalm'] },
    { es: 'Proverbios', en: 'Proverbs', abbr: ['Pr', 'Prov'] },
    { es: 'Isaías', en: 'Isaiah', abbr: ['Is', 'Isa', 'Isaias'] },
    { es: 'Amós', en: 'Amos', abbr: ['Am', 'Amos'] },
    { es: 'Mateo', en: 'Matthew', abbr: ['Mt', 'Matt'] },
    { es: 'Marcos', en: 'Mark', abbr: ['Mr', 'Mc'] },
    { es: 'Lucas', en: 'Luke', abbr: ['Lc', 'Lk'] },
    { es: 'Juan', en: 'John', abbr: ['Jn'] },
    { es: 'Hechos', en: 'Acts', abbr: ['Hch', 'Hech'] },
    { es: 'Romanos', en: 'Romans', abbr: ['Ro', 'Rom'] },
    { es: '1 Corintios', en: '1 Corinthians', abbr: ['1 Co', '1 Cor'] },
    { es: '2 Corintios', en: '2 Corinthians', abbr: ['2 Co', '2 Cor'] },
    { es: 'Gálatas', en: 'Galatians', abbr: ['Gá', 'Gál', 'Ga', 'Gal'] },
    { es: 'Efesios', en: 'Ephesians', abbr: ['Ef', 'Eph'] },
    { es: 'Filipenses', en: 'Philippians', abbr: ['Fil', 'Phil'] },
    { es: 'Colosenses', en: 'Colossians', abbr: ['Col'] },
    { es: '1 Tesalonicenses', en: '1 Thessalonians', abbr: ['1 Ts', '1 Tes', '1 Thess'] },
    { es: '2 Tesalonicenses', en: '2 Thessalonians', abbr: ['2 Ts', '2 Tes', '2 Thess'] },
    { es: '1 Timoteo', en: '1 Timothy', abbr: ['1 Ti', '1 Tim'] },
    { es: '2 Timoteo', en: '2 Timothy', abbr: ['2 Ti', '2 Tim'] },
    { es: 'Tito', en: 'Titus', abbr: ['Tit'] },
    { es: 'Filemón', en: 'Philemon', abbr: ['Flm', 'Filem', 'Philem'] },
    { es: 'Hebreos', en: 'Hebrews', abbr: ['He', 'Heb'] },
    { es: 'Santiago', en: 'James', abbr: ['Stg', 'Sant', 'Jas'] },
    { es: '1 Pedro', en: '1 Peter', abbr: ['1 P', '1 Ped', '1 Pet'] },
    { es: '2 Pedro', en: '2 Peter', abbr: ['2 P', '2 Ped', '2 Pet'] },
    { es: '1 Juan', en: '1 John', abbr: ['1 Jn'] },
    { es: '2 Juan', en: '2 John', abbr: ['2 Jn'] },
    { es: '3 Juan', en: '3 John', abbr: ['3 Jn'] },
    { es: 'Judas', en: 'Jude', abbr: ['Jud'] },
    { es: 'Apocalipsis', en: 'Revelation', abbr: ['Ap', 'Apoc', 'Rev'] }
  ];

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Alternativas de nombre de libro para las regex, más largas primero para
  // que "1 Corintios" no quede truncado por "1 Co" al hacer match.
  const ALIAS_LIBRO = (() => {
    const set = new Set();
    LIBROS.forEach(libro => {
      set.add(libro.es);
      set.add(libro.en);
      (libro.abbr || []).forEach(a => set.add(a));
    });
    return Array.from(set).sort((a, b) => b.length - a.length);
  })();

  const ALTERNATIVA_LIBROS = ALIAS_LIBRO.map(escapeRegExp).join('|');

  const LIBRO_POR_ALIAS = (() => {
    const mapa = new Map();
    LIBROS.forEach(libro => {
      [libro.es, libro.en].concat(libro.abbr || []).forEach(alias => {
        mapa.set(alias.toLowerCase(), libro);
      });
    });
    return mapa;
  })();

  function buscarLibro(token) {
    return LIBRO_POR_ALIAS.get(token.trim().toLowerCase()) || null;
  }

  // ── a. Numerales romanos de capítulo en referencias tipo Rutherford
  // ("Isa. liii. 10", "Amós ix. 9") -> arábigo, antes de la normalización
  // general (paso b). Solo numerales romanos en minúscula (i, v, x, l, c),
  // suficiente para el rango 1–150 que exige la tarea; no usa flag "i" en
  // la regex a propósito, para no confundir "III" en mayúsculas (que no es
  // este patrón) con el numeral en minúscula que sí queremos convertir.
  function romanoAArabigo(str) {
    const valores = { i: 1, v: 5, x: 10, l: 50, c: 100 };
    const s = str.toLowerCase();
    if (!/^[ivxlc]+$/.test(s)) return null;
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const actual = valores[s[i]];
      const siguiente = valores[s[i + 1]];
      if (siguiente && actual < siguiente) total -= actual;
      else total += actual;
    }
    if (total < 1 || total > 150) return null;
    return total;
  }

  function pasoRomanosCapitulo(texto) {
    const re = new RegExp(
      '\\b(' + ALTERNATIVA_LIBROS + ')(\\.?)(\\s+)([ivxlc]{1,7})(\\.)(\\s+)(\\d+(?:\\s*[-–,]\\s*\\d+)*)',
      'g'
    );
    return texto.replace(re, (m, libro, punto1, esp1, romano, punto2, esp2, versos) => {
      const arabigo = romanoAArabigo(romano);
      if (arabigo === null) return m;
      return libro + punto1 + esp1 + arabigo + punto2 + esp2 + versos;
    });
  }

  // ── b. Normalización general de referencias bíblicas ("Libro Cap:Vers" o
  // "Libro Cap. Vers", con o sin paréntesis alrededor). El separador de
  // capítulo/versículo acepta ":" (formato normal) o "." (formato antiguo,
  // como el que deja el paso a ya resuelto: "Isa. 53. 10"). Multi-referencia
  // separada por ";" no necesita lógica extra: cada referencia matchea por
  // su cuenta con el replace global.
  function formatearListaVersiculos(versosStr, idioma) {
    const partes = versosStr.split(/\s*,\s*/).map(p => p.trim());
    const frases = partes.map(p => {
      const rango = p.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (rango) return idioma === 'en' ? `${rango[1]} to ${rango[2]}` : `${rango[1]} al ${rango[2]}`;
      return p;
    });
    const esPlural = frases.length > 1 || /( al | to )/.test(frases[0]);
    const etiqueta = idioma === 'en' ? (esPlural ? 'verses' : 'verse') : (esPlural ? 'versículos' : 'versículo');
    let lista;
    if (frases.length === 1) {
      lista = frases[0];
    } else {
      const ultima = frases[frases.length - 1];
      const resto = frases.slice(0, -1).join(', ');
      lista = resto + (idioma === 'en' ? ' and ' : ' y ') + ultima;
    }
    return `${etiqueta} ${lista}`;
  }

  function pasoReferenciasGenerales(texto, idioma) {
    const re = new RegExp(
      '\\b(' + ALTERNATIVA_LIBROS + ')\\.?\\s+(\\d{1,3})\\s*[:.]\\s*(\\d{1,3}(?:\\s*[-–,]\\s*\\d{1,3})*)',
      'g'
    );
    return texto.replace(re, (m, bookToken, capitulo, versos) => {
      const libro = buscarLibro(bookToken);
      if (!libro) return m;
      const nombre = idioma === 'en' ? libro.en : libro.es;
      const capLabel = idioma === 'en' ? 'chapter' : 'capítulo';
      return `${nombre} ${capLabel} ${capitulo}, ${formatearListaVersiculos(versos, idioma)}`;
    });
  }

  // ── c. Palabras enteras en mayúsculas de 4+ letras -> capitalización
  // normal (personajes de Progreso del peregrino: CRISTIANO, EVANGELISTA).
  // No toca acrónimos de 1-3 letras (ONU, ADN). Los límites usan lookaround
  // en vez de \b porque \b de JS no reconoce vocales acentuadas como parte
  // de la palabra.
  const LETRA = 'A-Za-zÀ-ÖØ-öø-ÿ';
  const RE_MAYUSCULAS = new RegExp(`(?<![${LETRA}])[A-ZÁÉÍÓÚÑÜ]{4,}(?![${LETRA}])`, 'g');

  function pasoMayusculasSostenidas(texto) {
    return texto.replace(RE_MAYUSCULAS, palabra => palabra.charAt(0) + palabra.slice(1).toLowerCase());
  }

  // ── d. Guion largo de diálogo al inicio de línea/párrafo -> se elimina
  // (solo el de apertura; el guion de cierre de una acotación intermedia,
  // "—dijo Evangelista—,", no está al inicio de línea y no se toca).
  function pasoGuionInicial(texto) {
    return texto.replace(/(^|\n)\s*—\s*/g, '$1');
  }

  function normalizarTexto(texto, idioma) {
    const idiomaFinal = idioma === 'en' ? 'en' : 'es';
    let t = String(texto || '');
    t = pasoRomanosCapitulo(t);
    t = pasoReferenciasGenerales(t, idiomaFinal);
    t = pasoMayusculasSostenidas(t);
    t = pasoGuionInicial(t);
    return t;
  }

  // ── leerBloque: arma utterances desde un elemento del DOM (título +
  // párrafos de cuerpo), aplica normalizarTexto() a cada una y las encola
  // en speechSynthesis con una pausa entre ellas. No decide "siguiente" —
  // eso vive en la integración de cada página (Recursos/Librería, Paso 2).
  function leerBloque(elemento, opciones) {
    opciones = opciones || {};
    const idioma = opciones.idioma === 'en' ? 'en' : 'es';
    const pausaMs = typeof opciones.pausaMs === 'number' ? opciones.pausaMs : 350;
    const tituloSelector = opciones.tituloSelector || 'h1, h2';
    const cuerpoSelector = opciones.cuerpoSelector || 'p';

    const controller = { onFinished: typeof opciones.onFinished === 'function' ? opciones.onFinished : null };

    if (!('speechSynthesis' in window)) {
      console.error('VerboTTS: speechSynthesis no está disponible en este navegador.');
      controller.pause = () => {};
      controller.resume = () => {};
      controller.stop = () => {};
      return controller;
    }

    const textos = [];
    const tituloEl = elemento.querySelector(tituloSelector);
    if (tituloEl && tituloEl.textContent.trim()) textos.push(tituloEl.textContent.trim());
    elemento.querySelectorAll(cuerpoSelector).forEach(p => {
      const t = p.textContent.trim();
      if (t) textos.push(t);
    });

    const utterances = textos.map(t => {
      const u = new SpeechSynthesisUtterance(normalizarTexto(t, idioma));
      u.lang = idioma === 'en' ? 'en-US' : 'es-419';
      if (opciones.voz) u.voice = opciones.voz;
      if (opciones.velocidad) u.rate = opciones.velocidad;
      if (opciones.tono) u.pitch = opciones.tono;
      return u;
    });

    let indice = -1;
    let detenido = false;

    function hablarSiguiente() {
      if (detenido) return;
      indice++;
      if (indice >= utterances.length) {
        if (typeof controller.onFinished === 'function') controller.onFinished();
        return;
      }
      const u = utterances[indice];
      u.addEventListener('end', () => {
        if (detenido) return;
        if (indice < utterances.length - 1) setTimeout(hablarSiguiente, pausaMs);
        else hablarSiguiente();
      });
      u.addEventListener('error', () => {
        if (detenido) return;
        hablarSiguiente();
      });
      window.speechSynthesis.speak(u);
    }

    hablarSiguiente();

    controller.pause = () => window.speechSynthesis.pause();
    controller.resume = () => window.speechSynthesis.resume();
    controller.stop = () => {
      detenido = true;
      window.speechSynthesis.cancel();
    };

    return controller;
  }

  return { normalizarTexto, leerBloque };

})();
