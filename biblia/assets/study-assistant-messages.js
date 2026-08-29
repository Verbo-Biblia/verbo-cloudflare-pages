/* Banco de frases del mensaje-resumen del Asistente de Estudio.
   Módulo de datos puro: arma un array de "parts" (texto plano +
   fragmentos de categoría) a partir de los conteos de las 5 categorías.
   study-assistant.js decide cómo pintar cada part (chip clickeable vs.
   texto plano) — este módulo no toca el DOM. */
const VerboStudyMessages = (() => {
  // Orden fijo para listar categorías, siempre en este orden cuando la
  // categoría tiene count>0.
  const CATEGORY_ORDER = ['comentarios', 'crossrefs', 'historia', 'terminos', 'costumbres'];
  // Términos, Historia y Costumbres abren una sección dentro del panel;
  // Comentarios y Referencias cruzadas son solo texto informativo (no
  // hay acción al tocarlas en este panel — viven en otro lado de la UI).
  const ACTIONABLE = new Set(['terminos', 'historia', 'costumbres']);
  const NON_ACTIONABLE = ['comentarios', 'crossrefs'];
  const ACTIONABLE_ORDER = ['historia', 'terminos', 'costumbres'];
  const HIGH_VOLUME_THRESHOLD = 10;

  const LABELS = {
    comentarios: { es: ['comentario', 'comentarios'], en: ['commentary', 'commentaries'] },
    crossrefs: { es: ['referencia cruzada', 'referencias cruzadas'], en: ['cross-reference', 'cross-references'] },
    historia: { es: ['recurso histórico', 'recursos históricos'], en: ['historical resource', 'historical resources'] },
    terminos: { es: ['término', 'términos'], en: ['term', 'terms'] },
    costumbres: { es: ['recurso de costumbres', 'recursos de costumbres'], en: ['customs resource', 'customs resources'] }
  };

  // Etiquetas extendidas SOLO para el bloque "también tenés" del mensaje
  // multi-categoría (situaciones 1/2) — el texto que Juan pidió es más
  // descriptivo ahí ("términos en los diccionarios") que la etiqueta base
  // usada en situación 3 ("términos"). Historia no cambia (misma base).
  const MULTI_ACTIONABLE_LABELS = {
    historia: LABELS.historia,
    terminos: { es: ['término en los diccionarios', 'términos en los diccionarios'], en: ['dictionary term', 'dictionary terms'] },
    costumbres: { es: ['recurso de costumbres y tradiciones', 'recursos de costumbres y tradiciones'], en: ['customs and traditions resource', 'customs and traditions resources'] }
  };

  // Solo estas 3 categorías tienen frase de "volumen alto" (umbral >=10).
  // Términos y Costumbres siempre usan el formato normal.
  const HIGH_VOLUME = {
    comentarios: { es: n => `${n} comentarios (bastante material)`, en: n => `${n} commentaries (substantial material)` },
    crossrefs: { es: n => `${n} referencias cruzadas (ampliamente conectado)`, en: n => `${n} cross-references (broadly connected)` },
    historia: { es: n => `${n} recursos históricos (contexto amplio)`, en: n => `${n} historical resources (extensive context)` }
  };

  const SINGLE_TEMPLATES = [
    {
      id: 'single-1',
      build: (category, count, lang) => {
        const [singular, plural] = LABELS[category][lang];
        const noun = count === 1 ? singular : plural;
        const actionable = ACTIONABLE.has(category);
        const chip = { type: 'category', category, count, actionable, text: noun };
        if (lang === 'es') {
          const adj = count === 1 ? 'disponible' : 'disponibles';
          const parts = [
            { type: 'text', value: `Para este pasaje hay ${count} ` },
            chip,
            { type: 'text', value: ` ${adj}.` }
          ];
          // "Puedes revisarlos aquí" solo tiene sentido para categorías
          // clickeables (viven en este mismo panel); las no-clickeables
          // se consultan en otro lado, así que la frase cambia entera.
          parts.push({ type: 'text', value: actionable ? ' Puedes revisarlos aquí.' : panelsNote(count, 'es') });
          return parts;
        }
        const verb = count === 1 ? 'is' : 'are';
        const parts = [
          { type: 'text', value: `There ${verb} ${count} ` },
          chip,
          { type: 'text', value: ' available for this passage.' }
        ];
        parts.push({ type: 'text', value: actionable ? ' You can review them here.' : panelsNote(count, 'en') });
        return parts;
      }
    },
    {
      id: 'single-2',
      build: (category, count, lang) => {
        const [singular, plural] = LABELS[category][lang];
        const noun = count === 1 ? singular : plural;
        const actionable = ACTIONABLE.has(category);
        const chip = { type: 'category', category, count, actionable, text: noun };
        const prefix = lang === 'es' ? 'Aquí hay una línea de estudio disponible para este texto: ' : 'One study path is available for this text: ';
        const parts = [
          { type: 'text', value: prefix },
          chip,
          { type: 'text', value: ` (${count}).` }
        ];
        if (!actionable) parts.push({ type: 'text', value: panelsNote(count, lang) });
        return parts;
      }
    }
  ];

  const NONE_TEMPLATES = [
    { id: 'none-1', es: 'No hay recursos asociados a este pasaje en estas áreas de estudio.', en: 'There are no resources associated with this passage in these study areas.' },
    { id: 'none-2', es: 'Este pasaje no tiene recursos adicionales vinculados en estas categorías.', en: 'This passage has no additional resources linked in these categories.' }
  ];

  // Última plantilla usada por tipo de situación, en memoria de la sesión
  // (no persiste entre recargas) — evita repetir la misma dos veces
  // seguidas. Situación multi ya no sortea (ver nota en buildMultiParts),
  // pero se mantiene la misma infraestructura para single/none, y para
  // que sea trivial sumar más variantes de multi el día que Juan las dé.
  const lastTemplateId = { multi: null, single: null, none: null };

  function pickWeighted(candidates, lastId) {
    const pool = candidates.length > 1 ? candidates.filter(c => c.id !== lastId) : candidates;
    const totalWeight = pool.reduce((sum, c) => sum + (c.weight ?? 1), 0);
    let roll = Math.random() * totalWeight;
    for (const candidate of pool) {
      roll -= (candidate.weight ?? 1);
      if (roll <= 0) return candidate;
    }
    return pool[pool.length - 1];
  }

  // Sufijo "podés revisarlo(s)..." para categorías NO clickeables — usado
  // en situación 3 (una sola categoría) y en el bloque de Comentarios/
  // Referencias cruzadas de la situación multi. Singular/plural según count
  // (el pedido original solo daba la forma singular; se extiende acá).
  function panelsNote(count, lang) {
    const plural = count !== 1;
    if (lang === 'es') {
      return plural
        ? ' — podés revisarlos en sus paneles respectivos, debajo del versículo o en el panel derecho.'
        : ' — podés revisarlo en su panel respectivo, debajo del versículo o en el panel derecho.';
    }
    return plural
      ? ' — you can review them in their own panels, below the verse or in the right-hand panel.'
      : ' — you can review it in its own panel, below the verse or in the right-hand panel.';
  }

  function categoryFragmentText(category, count, lang, isHighVolume, labelsTable = LABELS) {
    if (isHighVolume) return HIGH_VOLUME[category][lang](count);
    const [singular, plural] = labelsTable[category][lang];
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function joinFragments(fragments, lang) {
    const parts = [];
    fragments.forEach((fragment, index) => {
      if (index > 0) {
        const isLast = index === fragments.length - 1;
        if (lang === 'en') {
          parts.push({ type: 'text', value: fragments.length === 2 ? ' and ' : (isLast ? ', and ' : ', ') });
        } else {
          parts.push({ type: 'text', value: fragments.length === 2 ? ' y ' : (isLast ? ' y ' : ', ') });
        }
      }
      parts.push(fragment);
    });
    return parts;
  }

  // Situaciones 1 (las 5 categorías) y 2 (subset de 2-4): mismo patrón de
  // dos bloques — primero Comentarios/Referencias cruzadas (con la
  // aclaración de dónde revisarlos, porque acá no son clickeables), después
  // "también tenés" con Términos/Historia/Costumbres (clickeables, sin
  // aclaración). Cualquiera de los dos bloques se omite si queda vacío.
  //
  // NOTA: el texto exacto de situación 1 (las 5 categorías) fue dado
  // literal por Juan. Para situación 2 (subset) no se dio texto exacto —
  // se deriva del mismo patrón, cambiando solo la apertura ("recursos
  // disponibles" en vez de "las cinco áreas de estudio", que sería falso
  // con menos de 5). Marcado explícitamente por si el texto de la apertura
  // de situación 2 no es el que Juan tenía en mente.
  function buildMultiParts(counts, lang, ctx, available) {
    const eligible = ['comentarios', 'crossrefs', 'historia'].filter(cat => counts[cat] >= HIGH_VOLUME_THRESHOLD);
    const highVolumeCategory = eligible.length
      ? eligible.reduce((best, cat) => (counts[cat] > counts[best] ? cat : best), eligible[0])
      : null;

    const nonActionableFragments = NON_ACTIONABLE
      .filter(cat => counts[cat] > 0)
      .map(cat => ({
        type: 'category', category: cat, count: counts[cat], actionable: false,
        text: categoryFragmentText(cat, counts[cat], lang, cat === highVolumeCategory)
      }));
    const actionableFragments = ACTIONABLE_ORDER
      .filter(cat => counts[cat] > 0)
      .map(cat => ({
        type: 'category', category: cat, count: counts[cat], actionable: true,
        text: categoryFragmentText(cat, counts[cat], lang, cat === highVolumeCategory, MULTI_ACTIONABLE_LABELS)
      }));

    const opening = available.length === 5
      ? (lang === 'es'
        ? `Para ${ctx.libro} ${ctx.capitulo}:${ctx.versiculo} tenés recursos en las cinco áreas de estudio: `
        : `For ${ctx.libro} ${ctx.capitulo}:${ctx.versiculo}, resources are available across all five study areas: `)
      : (lang === 'es'
        ? `Para ${ctx.libro} ${ctx.capitulo}:${ctx.versiculo} tenés recursos disponibles: `
        : `For ${ctx.libro} ${ctx.capitulo}:${ctx.versiculo}, resources are available: `);

    const parts = [{ type: 'text', value: opening }];

    if (nonActionableFragments.length) {
      parts.push(...joinFragments(nonActionableFragments, lang));
      parts.push({ type: 'text', value: lang === 'es'
        ? ' — podés revisarlos en sus paneles respectivos, debajo del versículo o en el panel derecho.'
        : ' — you can review them in their own panels, below the verse or in the right-hand panel.' });
      if (actionableFragments.length) {
        parts.push({ type: 'text', value: lang === 'es' ? ' También tenés ' : ' You also have ' });
        parts.push(...joinFragments(actionableFragments, lang));
        parts.push({ type: 'text', value: '.' });
      }
    } else {
      // Subset todo-clickeable: sin frase de paneles, sin "también".
      parts.push(...joinFragments(actionableFragments, lang));
      parts.push({ type: 'text', value: '.' });
    }
    return parts;
  }

  // { counts: {comentarios,crossrefs,historia,terminos,costumbres}, lang: 'es'|'en',
  //   libro, capitulo, versiculo } → { parts: [{type:'text',value} | {type:'category',category,count,actionable,text}] }
  function buildMessage({ counts, lang, libro, capitulo, versiculo }) {
    const resolvedLang = lang === 'en' ? 'en' : 'es';
    const available = CATEGORY_ORDER.filter(category => counts[category] > 0);

    if (available.length === 0) {
      const chosen = pickWeighted(NONE_TEMPLATES.map(t => ({ id: t.id, weight: 1 })), lastTemplateId.none);
      lastTemplateId.none = chosen.id;
      const template = NONE_TEMPLATES.find(t => t.id === chosen.id);
      return { parts: [{ type: 'text', value: template[resolvedLang] }] };
    }

    if (available.length === 1) {
      const category = available[0];
      const chosen = pickWeighted(SINGLE_TEMPLATES.map(t => ({ id: t.id, weight: 1 })), lastTemplateId.single);
      lastTemplateId.single = chosen.id;
      const template = SINGLE_TEMPLATES.find(t => t.id === chosen.id);
      return { parts: template.build(category, counts[category], resolvedLang) };
    }

    // Situaciones 1/2: un solo texto por caso (5-de-5 vs. subset), no hay
    // variantes para sortear todavía — Juan dio un texto exacto para el
    // caso de las 5, no un banco. lastTemplateId.multi queda listo para
    // cuando haya más de una variante real entre las que elegir.
    lastTemplateId.multi = available.length === 5 ? 'multi-all-five' : 'multi-subset';
    return { parts: buildMultiParts(counts, resolvedLang, { libro, capitulo, versiculo }, available) };
  }

  return { buildMessage };
})();
window.VerboStudyMessages = VerboStudyMessages;
