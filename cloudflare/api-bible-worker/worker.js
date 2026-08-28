import studyAssistantCatalogData from './study-assistant-catalog.json' with { type: 'json' };

const API_ROOT = 'https://api.scripture.api.bible';
const ALLOWED_BIBLES = new Set([
  'e3f420b9665abaeb-01', // LBLA
  '826f63861180e056-01', // NTV
  'a761ca71e0b3ddcf-01'  // NASB 2020
]);

const LINK_TTL_SECONDS = 30 * 60; // 30 minutos, expiración del magic link
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 año, sesión de dispositivo vinculado

const SYNC_EMAIL = {
  es: {
    subject: 'Confirma tu correo para sincronizar Verbo',
    html: (confirmUrl) => `
      <p>Hola,</p>
      <p>Confirma este correo para mantener tus notas, marcadores y subrayados sincronizados entre tus dispositivos en Verbo.</p>
      <p><a href="${confirmUrl}">Vincular este dispositivo</a></p>
      <p>Este enlace expira en 30 minutos. Si no lo pediste tú, puedes ignorar este correo.</p>
    `
  },
  en: {
    subject: 'Confirm your email to sync Verbo',
    html: (confirmUrl) => `
      <p>Hello,</p>
      <p>Confirm this email to keep your notes, bookmarks, and highlights synced across your devices in Verbo.</p>
      <p><a href="${confirmUrl}">Link this device</a></p>
      <p>This link expires in 30 minutes. If you didn't request it, you can ignore this email.</p>
    `
  }
};

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  const accepted = allowed.includes(origin) ? origin : '';
  return {
    ...(accepted ? { 'Access-Control-Allow-Origin':accepted } : {}),
    'Access-Control-Allow-Methods':'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers':'Accept, Content-Type, Authorization',
    'Vary':'Origin',
    'X-Content-Type-Options':'nosniff'
  };
}

function jsonError(message, status, headers) {
  return new Response(JSON.stringify({ error:message }), {
    status,
    headers:{ ...headers, 'Content-Type':'application/json; charset=utf-8' }
  });
}

function jsonOk(payload, headers, status=200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers:{ ...headers, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
  });
}

async function handleApiBible(request, url, env, headers) {
  if (request.method !== 'GET') return jsonError('Método no permitido', 405, headers);
  if (!env.API_BIBLE_KEY) return jsonError('API_BIBLE_KEY no está configurada', 500, headers);

  const chapter = url.pathname.match(/^\/v1\/bibles\/([^/]+)\/chapters\/([A-Z0-9]+\.\d+)$/);
  const search = url.pathname.match(/^\/v1\/bibles\/([^/]+)\/search$/);
  const match = chapter || search;
  if (!match || !ALLOWED_BIBLES.has(match[1])) return jsonError('Recurso no permitido', 404, headers);

  const upstream = new URL(`${API_ROOT}${url.pathname}`);
  if (chapter) {
    upstream.searchParams.set('content-type', 'html');
    upstream.searchParams.set('include-notes', 'false');
    upstream.searchParams.set('include-titles', 'false');
    upstream.searchParams.set('include-chapter-numbers', 'false');
    upstream.searchParams.set('include-verse-numbers', 'true');
    upstream.searchParams.set('include-verse-spans', 'true');
    upstream.searchParams.set('fums-version', '3');
  } else {
    const query = String(url.searchParams.get('query') || '').trim().slice(0, 120);
    if (query.length < 2) return jsonError('La búsqueda requiere al menos dos caracteres', 400, headers);
    upstream.searchParams.set('query', query);
    upstream.searchParams.set('limit', '100');
    upstream.searchParams.set('offset', '0');
    upstream.searchParams.set('sort', 'canonical');
    const range = url.searchParams.get('range');
    if (range === 'MAT-REV' || range === 'GEN-MAL') upstream.searchParams.set('range', range);
  }

  const response = await fetch(upstream, {
    headers:{ 'api-key':env.API_BIBLE_KEY, Accept:'application/json' }
  });
  const body = await response.text();
  return new Response(body, {
    status:response.status,
    headers:{ ...headers, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }
  });
}

const TRANSLATE_TARGET_NAMES = { es: 'Spanish', en: 'English' };
const MAX_TRANSLATE_CHARS = 20000; // cubre una entrada larga de comentario/costumbres; evita abuso de la cuota de Anthropic
const MAX_SERMON_DOC_CHARS = 30000; // documento completo de Predicación (HTML de TinyMCE, no texto plano) — ver handleTranslateSermonDoc
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// El texto traducido ronda un tamaño similar al de entrada (a veces algo más
// largo, p. ej. inglés -> español), así que el presupuesto de salida se ajusta
// al tamaño de entrada en vez de usar un max_tokens fijo — ni corta traducciones
// largas ni desperdicia cuota en textos cortos (un renglón de diccionario Strong).
function estimateMaxTokens(text) {
  const approxInputTokens = Math.ceil(text.length / 3);
  const withExpansionBuffer = Math.ceil(approxInputTokens * 1.4) + 64;
  return Math.min(8192, Math.max(128, withExpansionBuffer));
}

// Prefijo versionado: si el modelo, el system prompt o la detección de
// preámbulos cambian de forma que invalide traducciones ya cacheadas, subir
// el número fuerza a recalcular todo sin tener que borrar el namespace KV a
// mano (que también guarda datos de sync bajo otros prefijos,
// "link:"/"session:"/"blob:"). Subido a v4 el 2026-08-12: una traducción de
// "Verbo" (nombre de autor de Comentarios Verbo) había quedado cacheada como
// un preámbulo conversacional que PREAMBLE_PATTERNS no atrapaba entonces.
const TRANSLATE_CACHE_PREFIX = 'translate:v5';
const STUDY_TRANSLATE_CACHE_PREFIX = 'study-assistant:v1';
const STUDY_TRANSLATE_MAX_RESOURCES = 100;
const STUDY_TRANSLATE_MAX_RESOURCE_CHARS = 4000;
// 12000, no 20000: con 100 recursos y expansión ES/overhead JSON, un lote de
// 20000 caracteres puede pedir una salida que excede el tope de 8192 tokens
// de estimateMaxTokens() y trunca el JSON de Anthropic (todo el lote se
// perdería). 12000 deja margen para el peor caso (100 recursos cortos).
const STUDY_TRANSLATE_MAX_TOTAL_CHARS = 12000;
const STUDY_TRANSLATE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,199}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
const STUDY_TRANSLATE_LANGUAGES = new Set(['es', 'en']);
const studyTranslationInflight = new Map();
const studyAssistantCatalog = studyAssistantCatalogData?.resources || {};

async function translateCacheKey(text, targetLang) {
  return `${TRANSLATE_CACHE_PREFIX}:${targetLang}:${await sha256Hex(text)}`;
}

// Red de seguridad: pese a que el prompt exige "no preamble", el modelo a
// veces rompe el personaje y responde con una negativa conversacional en vez
// de traducir — sobre todo con fragmentos cortos y sin contexto (una sola
// palabra, un término griego/hebreo, un encabezado) como los que manda el
// diccionario Strong. Confirmado en vivo el 2026-08-07: "soldier", "agapao"
// y "strateuomai" solos disparaban "I'm ready to translate... please
// provide the actual text" en vez de traducir. Se detecta por patrones
// conocidos de negativa/aclaración y se reintenta una vez; si persiste, se
// falla la petición (502) en vez de cachear o devolver el preámbulo.
// Confirmado en vivo el 2026-08-12: el campo "author" de Comentarios Verbo
// manda la palabra sola "Verbo" — que también es el nombre de la app citado
// en el system prompt — y el modelo respondió hablando de la app en vez de
// traducir ("I see you've typed 'Verbo,' which is the name of the Bible
// study application..." / "I await the source text to translate. Please
// provide the content..."), ninguna de las dos atrapada por los patrones
// de entonces.
const PREAMBLE_PATTERNS = [
  /^i'?m (?:ready|a translation engine|prepared)\b/i,
  /^i am (?:ready|a translation engine|prepared)\b/i,
  /^please provide\b/i,
  /^i don'?t see\b/i,
  /^i notice\b/i,
  /^i see you\b/i,
  /^i await\b/i,
  /^you'?ve (?:provided|sent|given)\b/i,
  /^this (?:appears to be|is not|doesn't appear|does not appear)\b/i,
  /^it (?:appears|looks like) (?:you|this)\b/i,
  /^i appreciate\b/i,
  /^i must (?:note|point out|clarify)\b/i,
  /^i'?m designed to\b/i,
  /^according to my (?:role|instructions)\b/i,
  /^what you'?ve (?:provided|given|sent)\b/i,
  /doesn'?t appear to be (?:content|text|part) from\b/i,
  /please provide the (?:text|content|source text)\b/i,
  /what would you like me to translate\b/i,
  /(?:my|the) system instructions\b/i,
  /^estoy list[oa]\b/i,
  /^por favor (?:proporcion|env[ií]a)/i,
  /^no veo\b/i,
  /^aqu[ií] (?:est[aá]|tienes) la traducci[oó]n/i,
];

function looksLikeConversationalPreamble(text) {
  return PREAMBLE_PATTERNS.some(re => re.test(text.trim()));
}

async function callAnthropicTranslate(text, systemPrompt, env) {
  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: estimateMaxTokens(text),
        system: systemPrompt,
        messages: [{ role: 'user', content: text }]
      })
    });
  } catch {
    return { error: 'No se pudo contactar a la API de Anthropic' };
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    console.error('Anthropic /translate error', upstream.status, errText.slice(0, 500));
    return { error: 'Error del proveedor de traducción' };
  }

  const data = await upstream.json();
  const translation = Array.isArray(data?.content) ? data.content.map(block => block?.text || '').join('') : '';
  return { translation };
}

async function handleTranslate(request, env, headers) {
  if (request.method !== 'POST') return jsonError('Método no permitido', 405, headers);
  if (!env.ANTHROPIC_API_KEY) return jsonError('ANTHROPIC_API_KEY no está configurada', 500, headers);
  if (!env.SYNC_KV) return jsonError('SYNC_KV no está configurada', 500, headers);

  const body = await readJson(request);
  const text = typeof body?.text === 'string' ? body.text : '';
  const targetLang = body?.targetLang;
  const targetLangName = TRANSLATE_TARGET_NAMES[targetLang];

  if (!text.trim()) return jsonError('Falta el texto a traducir', 400, headers);
  if (text.length > MAX_TRANSLATE_CHARS) return jsonError(`El texto supera el límite de ${MAX_TRANSLATE_CHARS} caracteres`, 400, headers);
  if (!targetLangName) return jsonError('targetLang debe ser "es" o "en"', 400, headers);

  // El mismo texto de origen (un versículo de comentario, una entrada de
  // diccionario) se traduce igual sin importar qué usuario lo pida — cachear
  // en KV, compartido entre todos los visitantes, evita pagar la llamada a
  // Claude una vez por navegador. El caché de localStorage en el cliente
  // sigue existiendo encima de este (evita incluso el viaje de red).
  const cacheKey = await translateCacheKey(text, targetLang);
  const cached = await env.SYNC_KV.get(cacheKey);
  if (cached !== null) return jsonOk({ translation: cached, cached: true }, headers);

  const systemPrompt = `You are the translation engine embedded in "Verbo", a Bible study application.

Your task is to translate source content into ${targetLangName} with maximum semantic fidelity while producing natural, clear, grammatically correct language.

TRANSLATION PRIORITIES

Follow these priorities in this order:

1. Preserve the full meaning of the source.
2. Preserve the author's theological, doctrinal, historical, rhetorical, and stylistic intent.
3. Preserve all meaningful details. Do not omit, add, summarize, simplify, expand, explain, or reinterpret content.
4. Produce natural language in the target language.
5. Do not preserve source-language syntax when doing so would create awkward, unnatural, or misleading language in the target language.

Faithfulness does NOT mean reproducing the source word-for-word or copying its syntax mechanically.

Translate the meaning faithfully and completely, using the wording and grammar that naturally express that same meaning in ${targetLangName}.

AUTHORIAL AND DOCTRINAL FIDELITY

Many source texts are historical theological works, Bible commentaries, Church Fathers, historical documents, biblical studies, or material written from a particular theological tradition.

Preserve exactly the position expressed by the original author.

Do not:

* soften the author's theological claims;
* strengthen them;
* harmonize them with another tradition;
* neutralize controversial statements;
* modernize the author's doctrine;
* correct the author's theology;
* add qualifications that the author did not provide;
* remove qualifications the author did provide.

If the source is Reformed, Arminian, Catholic, Orthodox, Baptist, Methodist, Lutheran, dispensational, or represents any other tradition, preserve that voice and position as written.

Verbo's editorial neutrality applies to Verbo's own editorial content. It must never alter the meaning or doctrinal position of historical source material.

AMBIGUITY

If the original text is intentionally or genuinely ambiguous, preserve the ambiguity whenever reasonably possible.

Do not resolve a theological, historical, lexical, or interpretive ambiguity unless the source itself resolves it.

When more than one valid translation is possible, choose the wording that best preserves the author's intended meaning in context without adding interpretation.

NATURAL LANGUAGE

The translation must read as natural, professional, contemporary ${targetLangName}.

When translating into Spanish, use natural contemporary Latin American Spanish unless the source itself requires a different historical, regional, technical, or stylistic register.

Do not imitate English or other source-language word order when that structure sounds unnatural in Spanish.

Never coin a hybrid word by attaching a target-language ending to a source-language root (e.g. adapting an English word with a Spanish suffix to invent a word that does not exist in Spanish). If a precise natural equivalent is uncertain, choose the closest real, established word in the target language rather than inventing one.

Do not deliberately archaize the translation merely because the source is old.

However, do not erase historical tone, rhetorical force, technical vocabulary, or stylistic distinctions that are meaningful to the text.

BIBLICAL AND THEOLOGICAL TERMINOLOGY

Preserve biblical, theological, historical, and technical terminology accurately.

Use established target-language terminology when there is a clear conventional equivalent.

Do not replace a technical term with a simpler expression if doing so loses important meaning.

Do not introduce denominational terminology that is not present in the source.

When a Greek, Hebrew, Latin, Aramaic, or other original-language term appears in the source:

* preserve it if the source deliberately presents the original term;
* preserve any transliteration already supplied unless translation clearly requires otherwise;
* translate its explanation normally;
* do not invent etymologies or explanations;
* do not transliterate a term that the source itself does not present as such unless necessary for faithful translation.

BIBLE QUOTATIONS

When the source directly quotes Scripture, translate the quotation faithfully from the text actually provided.

Do not replace the quotation with the wording of a known Bible translation such as Reina-Valera, LBLA, NVI, NASB, KJV, or any other published version.

Treat the quotation as part of the author's source text.

Do not harmonize quotations with parallel passages.

Do not silently correct a biblical quotation because it differs from a familiar Bible version.

BIBLE REFERENCES

References such as:

Romans 8:28
Rom. 8:28
John 3:16
1 Cor. 13:4–7

must remain references, not be expanded into quotations or explanatory prose.

Translate book names only when appropriate for the target language and according to Verbo's existing conventions.

Preserve chapter numbers, verse numbers, ranges, punctuation, and reference structure.

QUOTATIONS FROM OTHER AUTHORS

When the source quotes theologians, Church Fathers, historians, or other authors, translate those quotations with the same fidelity as the surrounding text.

Do not summarize or reinterpret them.

Preserve attribution and quotation structure.

SHORT FRAGMENTS

The input may sometimes be:

* a single word;
* a proper name;
* a heading;
* a title;
* a technical term;
* a Greek or Hebrew term;
* a date;
* a date range;
* a Bible reference;
* a short phrase;
* a fragment extracted from a larger work.

Treat the input as intentional content.

Do not ask for more context.

Do not comment that the text is incomplete.

Do not invent missing context.

Translate only what can be faithfully derived from the supplied text.

For isolated words or genuinely context-dependent terms, choose the most contextually neutral and conventional translation available.

Do not invent theological specificity that the fragment itself does not contain.

CONTENT ALREADY IN THE TARGET LANGUAGE

If the supplied text is already fully written in ${targetLangName}, return it unchanged unless translation is clearly required by mixed-language content.

Do not paraphrase, rewrite, modernize, or "improve" text that is already in the requested target language.

If the text contains a mixture of languages, translate only the portions requiring translation and preserve the rest appropriately.

NAMES, NUMBERS, DATES, AND DATA

Preserve:

* proper names;
* personal names;
* place names;
* numbers;
* dates;
* verse numbers;
* chapter numbers;
* percentages;
* measurements;
* abbreviations;
* sigla and acronyms;
* citations;
* bibliographic references;

unless there is an established target-language equivalent that is clearly appropriate.

Never silently alter a number, date, reference, quantity, or proper noun.

FORMATTING

Preserve the meaningful structure of the source.

Preserve paragraphs, lists, headings, numbering, references, and punctuation when possible.

If HTML tags are present:

* preserve all tags;
* do not remove, add, rename, or corrupt them;
* translate only textual content;
* tags may move only when necessary to preserve the same semantic association in natural target-language grammar.

Do not expose or explain HTML tags in the output.

If no HTML tags are present, the source is plain text — output plain text only. Do not introduce Markdown syntax (**bold**, *italic*, __underline__, # headings, - bullet lists, or any other markup) that was not literally present in the source, even when the content has natural emphasis or structure that might tempt you to mark it up. The caller renders this output as plain text, never as Markdown — any such syntax you add will appear literally on screen, not formatted.

NO ADDITIONS OR OMISSIONS

Before producing the final output, internally verify that:

* no meaningful sentence, phrase, qualification, negation, number, name, reference, or doctrinal statement was omitted;
* no explanation, commentary, interpretation, qualification, or information was added;
* negations remain negations;
* subjects remain correctly identified;
* gender and number remain accurate where semantically relevant;
* tense and aspect remain faithful;
* quotations remain quotations;
* references remain references.

OUTPUT RULE

Return ONLY the translated content.

Do not include:

* introductions;
* explanations;
* translator notes;
* warnings;
* analysis;
* comments;
* labels such as "Translation:";
* surrounding quotation marks unless they belong to the source;
* Markdown fences;
* Markdown formatting syntax not literally present in the source (**bold**, *italic*, # headings, - bullet lists);
* apologies;
* requests for clarification.

Do not discuss the translation.

Do not explain your choices.

Translate the supplied content and output only the result.`;

  let result = await callAnthropicTranslate(text, systemPrompt, env);
  if (result.error) return jsonError(result.error, 502, headers);
  let translation = result.translation;

  if (!translation || looksLikeConversationalPreamble(translation)) {
    console.error('Anthropic /translate preámbulo o respuesta vacía, reintentando', text.slice(0, 200));
    result = await callAnthropicTranslate(text, systemPrompt, env);
    if (result.error) return jsonError(result.error, 502, headers);
    translation = result.translation;
  }

  if (!translation || looksLikeConversationalPreamble(translation)) {
    console.error('Anthropic /translate sigue devolviendo preámbulo tras reintento', text.slice(0, 200));
    return jsonError('El proveedor de traducción no devolvió una traducción válida', 502, headers);
  }

  await env.SYNC_KV.put(cacheKey, translation);
  return jsonOk({ translation, cached: false }, headers);
}

function studyTranslationKV(env) {
  // Para separar esta caché en el futuro basta añadir el binding
  // STUDY_TRANSLATIONS_KV; el contrato y las claves no cambian.
  return env.STUDY_TRANSLATIONS_KV || env.SYNC_KV;
}

function studyTranslationKey(item, targetLanguage) {
  return `${STUDY_TRANSLATE_CACHE_PREFIX}:${item.sourceLanguage}-${targetLanguage}:${item.resourceId}:${item.sourceHash}`;
}

function parseStudyCachedValue(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  try {
    const value = JSON.parse(raw);
    return typeof value?.translation === 'string' && value.translation.trim()
      ? value.translation.trim()
      : null;
  } catch {
    return null;
  }
}

function parseStructuredStudyTranslations(raw, requestedIds) {
  if (typeof raw !== 'string' || !raw.trim()) return new Map();
  let parsed;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return new Map();
  }
  const rows = Array.isArray(parsed) ? parsed : parsed?.translations;
  if (!Array.isArray(rows)) return new Map();
  const result = new Map();
  for (const row of rows) {
    const id = row?.resourceId;
    const translation = typeof row?.translation === 'string' ? row.translation.trim() : '';
    if (!requestedIds.has(id) || !translation || result.has(id)) continue;
    if (looksLikeConversationalPreamble(translation)) continue;
    result.set(id, translation);
  }
  return result;
}

async function callAnthropicStudyBatch(items, targetLanguage, env) {
  const targetName = TRANSLATE_TARGET_NAMES[targetLanguage];
  const systemPrompt = `You translate Bible-study resource previews into ${targetName}.
Preserve the complete meaning, theological position, historical claims, names, references, and qualifications of every source. Use natural contemporary Latin American Spanish when translating into Spanish. Do not summarize, explain, correct, censor, or add content.
The user message is a JSON array. Return only valid JSON in this exact form: {"translations":[{"resourceId":"the unchanged input ID","translation":"the translated text"}]}.
Return exactly one object per input resource. Never translate or alter resourceId. Do not use Markdown fences or any text outside the JSON object.`;
  const payload = items.map(item => ({ resourceId:item.resourceId, text:item.text }));
  const requestedIds = new Set(items.map(item => item.resourceId));
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await callAnthropicTranslate(JSON.stringify(payload), systemPrompt, env);
    if (result.error) {
      if (attempt === 1) return new Map();
      continue;
    }
    const parsed = parseStructuredStudyTranslations(result.translation, requestedIds);
    if (parsed.size || attempt === 1) return parsed;
  }
  return new Map();
}

function validateStudyTranslationRequest(body) {
  const targetLanguage = body?.targetLanguage;
  const resources = body?.resources;
  if (!STUDY_TRANSLATE_LANGUAGES.has(targetLanguage)) {
    return { error:'targetLanguage debe ser "es" o "en"' };
  }
  if (!Array.isArray(resources) || resources.length < 1 || resources.length > STUDY_TRANSLATE_MAX_RESOURCES) {
    return { error:`resources debe contener entre 1 y ${STUDY_TRANSLATE_MAX_RESOURCES} elementos` };
  }
  const seen = new Set();
  let totalChars = 0;
  const validated = [];
  for (const resource of resources) {
    const resourceId = resource?.resourceId;
    const sourceLanguage = resource?.sourceLanguage;
    const sourceHash = resource?.sourceHash;
    const text = resource?.text;
    if (typeof resourceId !== 'string' || !STUDY_TRANSLATE_ID_RE.test(resourceId)) {
      return { error:'resourceId inválido' };
    }
    if (seen.has(resourceId)) return { error:`resourceId duplicado: ${resourceId}` };
    seen.add(resourceId);
    if (!STUDY_TRANSLATE_LANGUAGES.has(sourceLanguage) || sourceLanguage === targetLanguage) {
      return { error:`Dirección de idioma inválida para ${resourceId}` };
    }
    if (typeof sourceHash !== 'string' || !SHA256_RE.test(sourceHash)) {
      return { error:`sourceHash inválido para ${resourceId}` };
    }
    if (typeof text !== 'string' || !text.trim() || text.length > STUDY_TRANSLATE_MAX_RESOURCE_CHARS) {
      return { error:`Texto inválido o demasiado largo para ${resourceId}` };
    }
    totalChars += text.length;
    if (totalChars > STUDY_TRANSLATE_MAX_TOTAL_CHARS) {
      return { error:`El lote supera ${STUDY_TRANSLATE_MAX_TOTAL_CHARS} caracteres` };
    }
    const allowed = studyAssistantCatalog[resourceId];
    if (!allowed || allowed.sourceLanguage !== sourceLanguage || allowed.sourceHash !== sourceHash) {
      return { error:`Recurso no permitido: ${resourceId}` };
    }
    validated.push({ resourceId, sourceLanguage, sourceHash, text });
  }
  return { targetLanguage, resources:validated };
}

async function translateStudyMisses(items, targetLanguage, env, kv) {
  const waiting = new Map();
  const fresh = [];
  for (const item of items) {
    const key = studyTranslationKey(item, targetLanguage);
    const inflight = studyTranslationInflight.get(key);
    if (inflight) waiting.set(item.resourceId, inflight);
    else fresh.push({ ...item, key });
  }

  if (fresh.length) {
    const batchPromise = callAnthropicStudyBatch(fresh, targetLanguage, env);
    for (const item of fresh) {
      let promise;
      promise = batchPromise.then(async translations => {
        const translation = translations.get(item.resourceId) || null;
        if (!translation) return null;
        await kv.put(item.key, JSON.stringify({
          translation,
          createdAt:new Date().toISOString(),
        }));
        return translation;
      }).finally(() => {
        if (studyTranslationInflight.get(item.key) === promise) {
          studyTranslationInflight.delete(item.key);
        }
      });
      studyTranslationInflight.set(item.key, promise);
      waiting.set(item.resourceId, promise);
    }
  }

  const resolved = new Map();
  await Promise.all([...waiting].map(async ([resourceId, promise]) => {
    const translation = await promise.catch(() => null);
    if (translation) resolved.set(resourceId, translation);
  }));
  return resolved;
}

async function handleTranslateStudyAssistant(request, env, headers) {
  if (request.method !== 'POST') return jsonError('Método no permitido', 405, headers);
  if (!env.ANTHROPIC_API_KEY) return jsonError('Servicio de traducción no configurado', 500, headers);
  const kv = studyTranslationKV(env);
  if (!kv) return jsonError('Caché de traducción no configurada', 500, headers);

  const validation = validateStudyTranslationRequest(await readJson(request));
  if (validation.error) return jsonError(validation.error, 400, headers);
  const { targetLanguage, resources } = validation;
  for (const item of resources) {
    if (await sha256Hex(item.text) !== item.sourceHash) {
      return jsonError(`El texto no coincide con sourceHash para ${item.resourceId}`, 400, headers);
    }
  }

  const keys = resources.map(item => studyTranslationKey(item, targetLanguage));
  const cachedValues = await kv.get(keys);
  const translations = {};
  const misses = [];
  resources.forEach((item, index) => {
    const raw = cachedValues instanceof Map ? cachedValues.get(keys[index]) : null;
    const translation = parseStudyCachedValue(raw);
    if (translation) translations[item.resourceId] = { translation, cached:true };
    else misses.push(item);
  });

  if (misses.length) {
    const generated = await translateStudyMisses(misses, targetLanguage, env, kv);
    for (const item of misses) {
      const translation = generated.get(item.resourceId);
      if (translation) translations[item.resourceId] = { translation, cached:false };
    }
  }
  const failed = resources
    .map(item => item.resourceId)
    .filter(resourceId => !translations[resourceId]);
  return jsonOk({ translations, failed }, headers);
}

// ── /translate-sermon-doc ───────────────────────────────────────────────
//
// Caso de uso distinto a /translate: un pastor traduce su propia prédica
// (editor de "Predicación" en /biblia/), preparada con el editor rich-text,
// para predicar con ayuda de un intérprete en vivo. Endpoint separado con
// su propio system prompt porque las prioridades son distintas de la
// traducción general del sitio:
//   - Fidelidad literal de correspondencia oración-por-oración (para que el
//     intérprete pueda seguir el documento en paralelo), por encima de la
//     naturalidad idiomática que /translate prioriza para el resto del sitio.
//   - Es contenido propio del usuario, no una fuente histórica de terceros —
//     igual se preserva su voz/postura tal cual, sin neutralizarla.
// A propósito NO usa el caché compartido en SYNC_KV: es contenido personal
// del pastor, no material público reutilizado por otros visitantes — se
// traduce y se devuelve directo, sin leer ni escribir KV.
function buildSermonTranslateSystemPrompt(targetLangName, bibleRefs) {
  let referenceBlock = '';
  if (Array.isArray(bibleRefs) && bibleRefs.length) {
    const lines = bibleRefs
      .filter(entry => entry && typeof entry.reference === 'string' && typeof entry.text === 'string')
      .map(entry => `${entry.reference} → "${entry.text}"`)
      .join('\n');
    if (lines) {
      referenceBlock = `

AUTHORITATIVE BIBLE TEXT

The following table gives the authoritative ${targetLangName} wording (from Verbo's own Bible text) for specific Bible references that appear in the source document:

${lines}

When the source document quotes one of these references as an actual Scripture quotation, use the supplied wording verbatim instead of producing your own translation of it. If the source only paraphrases or alludes to the passage without quoting it directly, do not force the exact supplied wording — translate the paraphrase normally.`;
    }
  }

  return `You are the translation engine embedded in "Verbo", a Bible study application, handling one specific and narrow case: translating a pastor's own sermon document, written in Verbo's "Predicación" (sermon prep) editor, so the pastor can preach with the help of a live interpreter.

TRANSLATION PRIORITIES

1. Preserve the full meaning of the source exactly as the pastor wrote it. This is the pastor's own theological voice and content, not third-party material — never soften, strengthen, neutralize, modernize, or otherwise editorialize the pastor's claims or emphasis.
2. LITERAL, SENTENCE-LEVEL CORRESPONDENCE FOR LIVE INTERPRETATION. This is the priority that makes this case different from ordinary translation: the pastor will preach from this translated document while a live interpreter follows along or interprets from it in real time. Keep a close, literal correspondence between each source sentence and its ${targetLangName} counterpart — same sentence boundaries, same order of ideas, same paragraph and sentence count wherever target-language grammar allows it. Do not merge, split, reorder, paraphrase, or restructure sentences for stylistic fluency. Favor a translation that is easy to track sentence-by-sentence against the original over one that reads as polished, idiomatic prose.
3. Do not omit, add, summarize, simplify, expand, explain, or reinterpret content.
4. The translation must still be grammatical and understandable in ${targetLangName} — literal correspondence never means broken or nonsensical language. When source-language word order would be truly unreadable in ${targetLangName}, adjust only as much as required for grammaticality, and no more.

FORMATTING

The source is HTML from a rich-text editor (headings, bold, colors, tables, lists).

* Preserve every HTML tag and every attribute (including inline style="..." and color attributes) exactly as given.
* Do not remove, add, rename, or corrupt any tag or attribute.
* Translate only the human-readable text content inside the tags.
* Do not expose, explain, or comment on the HTML markup in the output.

BIBLICAL REFERENCES AND QUOTATIONS

Preserve Bible references (e.g., "Romans 8:28", "Rom. 8:28") as references, not expanded quotations. When the source quotes Scripture directly, translate the quotation faithfully from the text actually provided — do not substitute the wording of a published Bible version unless instructed to by the reference table below.${referenceBlock}

OUTPUT RULE

Return ONLY the translated HTML. Do not include introductions, explanations, translator notes, warnings, labels such as "Translation:", or Markdown fences. Do not discuss the translation or explain your choices. Translate the supplied content and output only the result.`;
}

async function handleTranslateSermonDoc(request, env, headers) {
  if (request.method !== 'POST') return jsonError('Método no permitido', 405, headers);
  if (!env.ANTHROPIC_API_KEY) return jsonError('ANTHROPIC_API_KEY no está configurada', 500, headers);

  const body = await readJson(request);
  const html = typeof body?.html === 'string' ? body.html : '';
  const targetLang = body?.targetLang;
  const targetLangName = TRANSLATE_TARGET_NAMES[targetLang];
  const bibleRefs = Array.isArray(body?.bibleRefs) ? body.bibleRefs.slice(0, 40) : [];

  if (!html.trim()) return jsonError('Falta el documento a traducir', 400, headers);
  // Límite propio, más alto que MAX_TRANSLATE_CHARS (pensado para fragmentos
  // sueltos de comentario/diccionario): el HTML real de TinyMCE (style=,
  // colores, spans) infla mucho el conteo de caracteres frente al texto
  // visible de una prédica normal — con 20000 rechazaba documentos reales.
  if (html.length > MAX_SERMON_DOC_CHARS) return jsonError(`El documento supera el límite de ${MAX_SERMON_DOC_CHARS} caracteres. Acortalo o traducilo por partes.`, 400, headers);
  if (!targetLangName) return jsonError('targetLang debe ser "es" o "en"', 400, headers);

  const systemPrompt = buildSermonTranslateSystemPrompt(targetLangName, bibleRefs);

  let result = await callAnthropicTranslate(html, systemPrompt, env);
  if (result.error) return jsonError(result.error, 502, headers);
  let translation = result.translation;

  if (!translation || looksLikeConversationalPreamble(translation)) {
    console.error('Anthropic /translate-sermon-doc preámbulo o respuesta vacía, reintentando');
    result = await callAnthropicTranslate(html, systemPrompt, env);
    if (result.error) return jsonError(result.error, 502, headers);
    translation = result.translation;
  }

  if (!translation || looksLikeConversationalPreamble(translation)) {
    console.error('Anthropic /translate-sermon-doc sigue devolviendo preámbulo tras reintento');
    return jsonError('El proveedor de traducción no devolvió una traducción válida', 502, headers);
  }

  return jsonOk({ translation }, headers);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function maskEmail(email) {
  const [user, domain] = String(email).split('@');
  const maskedUser = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(user.length - 2) + user.slice(-1);
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0][0] + '*'.repeat(Math.max(domainParts[0].length - 1, 1));
  return `${maskedUser}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function bearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function handleLinkRequest(request, env, headers) {
  const body = await readJson(request);
  const email = String(body?.email || '').trim().toLowerCase();
  const deviceId = String(body?.deviceId || '').trim();
  const lang = body?.lang === 'en' ? 'en' : 'es';
  if (!isValidEmail(email)) return jsonError('Correo inválido', 400, headers);
  if (!deviceId) return jsonError('Falta identificador de dispositivo', 400, headers);
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  if (!env.RESEND_API_KEY) return jsonError('RESEND_API_KEY no está configurada', 500, headers);

  const token = crypto.randomUUID();
  await env.SYNC_KV.put(`link:${token}`, JSON.stringify({ email, deviceId }), { expirationTtl: LINK_TTL_SECONDS });

  const appUrl = String(env.APP_URL || 'https://verbobiblia.com/biblia/').replace(/\/+$/, '') + '/';
  const confirmUrl = `${appUrl}?syncToken=${encodeURIComponent(token)}`;
  const template = SYNC_EMAIL[lang];

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'Verbo <no-reply@verbobiblia.com>',
      to: [email],
      subject: template.subject,
      html: template.html(confirmUrl)
    })
  });
  if (!resendResponse.ok) {
    await env.SYNC_KV.delete(`link:${token}`);
    return jsonError('No se pudo enviar el correo', 502, headers);
  }
  return jsonOk({ ok:true }, headers);
}

async function handleLinkConfirm(request, env, headers) {
  const body = await readJson(request);
  const token = String(body?.token || '').trim();
  if (!token) return jsonError('Falta el token', 400, headers);
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);

  const raw = await env.SYNC_KV.get(`link:${token}`);
  if (!raw) return jsonError('El enlace expiró o ya se usó', 400, headers);
  await env.SYNC_KV.delete(`link:${token}`);

  const { email } = JSON.parse(raw);
  const emailHash = await sha256Hex(email);
  const sessionToken = crypto.randomUUID();
  await env.SYNC_KV.put(`session:${sessionToken}`, JSON.stringify({ emailHash }), { expirationTtl: SESSION_TTL_SECONDS });

  return jsonOk({ sessionToken, emailMasked: maskEmail(email) }, headers);
}

async function requireSession(request, env, headers) {
  const token = bearerToken(request);
  if (!token) return { error: jsonError('Falta la sesión de sincronización', 401, headers) };
  const raw = await env.SYNC_KV.get(`session:${token}`);
  if (!raw) return { error: jsonError('Sesión inválida o expirada', 401, headers) };
  const { emailHash } = JSON.parse(raw);
  return { emailHash, sessionToken: token };
}

async function handleDataGet(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireSession(request, env, headers);
  if (session.error) return session.error;
  const raw = await env.SYNC_KV.get(`blob:${session.emailHash}`);
  if (!raw) return jsonOk({ data: null, updatedAt: null }, headers);
  const stored = JSON.parse(raw);
  return jsonOk({ data: stored.data, updatedAt: stored.updatedAt }, headers);
}

// Mismo shape que emptyData() en biblia/assets/backup.js: sin fecha_guardado
// y sin ningún arreglo de contenido real. Se usa como última línea de
// defensa (CAPA 3) contra cualquier bug futuro del cliente que intente subir
// un blob vacío/por defecto encima de datos reales ya guardados.
function isEmptyBlob(data) {
  if (!data || typeof data !== 'object') return true;
  if (data.fecha_guardado) return false;
  const notas = Array.isArray(data.notas) ? data.notas.length : 0;
  const resaltados = Array.isArray(data.resaltados) ? data.resaltados.length : 0;
  const marcadores = Array.isArray(data.marcadores) ? data.marcadores.length : 0;
  return notas === 0 && resaltados === 0 && marcadores === 0;
}

async function handleDataPut(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireSession(request, env, headers);
  if (session.error) return session.error;
  const body = await readJson(request);
  if (!body || typeof body.data !== 'object') return jsonError('Datos inválidos', 400, headers);
  if (!body.updatedAt) return jsonError('Falta updatedAt', 400, headers);
  const updatedAt = String(body.updatedAt);

  const existingRaw = await env.SYNC_KV.get(`blob:${session.emailHash}`);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    const incomingTime = Date.parse(updatedAt) || 0;
    const existingTime = Date.parse(existing.updatedAt) || 0;
    if (incomingTime < existingTime) {
      return jsonError('El dato remoto guardado es más nuevo que el enviado', 409, headers);
    }
    if (isEmptyBlob(body.data) && !isEmptyBlob(existing.data)) {
      return jsonError('Se rechazó sobrescribir datos existentes con un blob vacío', 409, headers);
    }
  }

  await env.SYNC_KV.put(`blob:${session.emailHash}`, JSON.stringify({ data: body.data, updatedAt }));
  return jsonOk({ ok:true, updatedAt }, headers);
}

async function handleUnlink(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const token = bearerToken(request);
  if (token) await env.SYNC_KV.delete(`session:${token}`);
  return jsonOk({ ok:true }, headers);
}

async function handleSync(request, url, env, headers) {
  if (url.pathname === '/v1/sync/link-request' && request.method === 'POST') return handleLinkRequest(request, env, headers);
  if (url.pathname === '/v1/sync/link-confirm' && request.method === 'POST') return handleLinkConfirm(request, env, headers);
  if (url.pathname === '/v1/sync/unlink' && request.method === 'POST') return handleUnlink(request, env, headers);
  if (url.pathname === '/v1/sync/data' && request.method === 'GET') return handleDataGet(request, env, headers);
  if (url.pathname === '/v1/sync/data' && request.method === 'PUT') return handleDataPut(request, env, headers);
  return jsonError('Recurso no permitido', 404, headers);
}

// ── /v1/iglesia/* ────────────────────────────────────────────────────
//
// Sincronización de iglesia (publicador/miembro): namespace propio y
// paralelo al sync de usuario de arriba, sin tocarlo. A propósito NO
// comparte prefijo de clave con link:/session: (aunque la forma del
// dato es idéntica) — así el propio KV queda inequívoco sobre qué es
// de usuario y qué es de iglesia, y este flujo puede divergir a futuro
// (otro TTL, otra validación) sin volver a tocar el código de arriba.
const IGLESIA_LINK_TTL_SECONDS = 30 * 60; // 30 minutos, igual que el link de usuario
const IGLESIA_SESSION_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 año, igual que el de usuario
const IGLESIA_FEED_MAX_ITEMS = 30;
const IGLESIA_POST_TEXTO_MAX_CHARS = 2000;
const IGLESIA_POST_FONDOID_MAX_CHARS = 80;
const IGLESIA_POST_EMBED_MAX_CHARS = 500;
const IGLESIA_POST_TIPOS = new Set(['texto', 'fondo-svg', 'embed']);
// Whitelist de fuentes del sistema (ids cortos, no strings CSS crudos) —
// debe mantenerse sincronizada a mano con IGLESIA_FONTS en iglesia/panel.js
// (ver comentario ahí). Ningún archivo de fuente nuevo, solo las que ya
// trae cada plataforma; el id es lo único que viaja en el post.
const IGLESIA_FONT_IDS = new Set(['system', 'arial', 'helvetica', 'georgia', 'times', 'verdana', 'trebuchet', 'courier', 'palatino', 'comic-sans']);
const IGLESIA_POST_FONT_SIZE_MIN = 16;
const IGLESIA_POST_FONT_SIZE_MAX = 200; // unidades relativas al viewBox lógico de 1080 (ver fondos/manifest.json)
const IGLESIA_POST_SCALE_MIN = 0.3;
const IGLESIA_POST_SCALE_MAX = 4;
const IGLESIA_POST_ROTATION_MIN = -180;
const IGLESIA_POST_ROTATION_MAX = 180;
const IGLESIA_POST_XY_MIN = -20; // % del canvas — algo de margen fuera de 0-100 para texto que sobresale al arrastrar
const IGLESIA_POST_XY_MAX = 120;
const IGLESIA_COLOR_RE = /^#[0-9a-f]{6}$/i;
// Solo YouTube/Facebook, igual que valida iglesia/panel.js del lado
// cliente (defensa en profundidad: el cliente ya restringe el picker,
// esto evita que cualquier otra URL quede guardada como si fuera un
// embed válido). fb.watch = dominio de enlaces cortos de Facebook.
const IGLESIA_EMBED_RE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|facebook\.com\/|fb\.watch\/)/;

const IGLESIA_EMAIL = {
  es: {
    subject: 'Confirma tu correo — panel de iglesia en Verbo',
    html: (confirmUrl) => `
      <p>Hola,</p>
      <p>Confirma este correo para entrar al panel de publicaciones de tu iglesia en Verbo.</p>
      <p><a href="${confirmUrl}">Entrar al panel de iglesia</a></p>
      <p>Este enlace expira en 30 minutos. Si no lo pediste tú, puedes ignorar este correo.</p>
    `
  },
  en: {
    subject: 'Confirm your email — church panel on Verbo',
    html: (confirmUrl) => `
      <p>Hello,</p>
      <p>Confirm this email to access your church's post panel on Verbo.</p>
      <p><a href="${confirmUrl}">Open the church panel</a></p>
      <p>This link expires in 30 minutes. If you didn't request it, you can ignore this email.</p>
    `
  }
};

// Copia deliberada de handleLinkRequest, no una llamada a ella: la
// original arma confirmUrl con env.APP_URL (fijo, apunta a /biblia/) y
// usa SYNC_EMAIL ("notas, marcadores y subrayados") — ambos incorrectos
// para un publicador de iglesia. Todo lo demás (validar email/deviceId,
// generar token, enviar por Resend) es la misma forma.
async function handleIglesiaLinkRequest(request, env, headers) {
  const body = await readJson(request);
  const email = String(body?.email || '').trim().toLowerCase();
  const deviceId = String(body?.deviceId || '').trim();
  const lang = body?.lang === 'en' ? 'en' : 'es';
  if (!isValidEmail(email)) return jsonError('Correo inválido', 400, headers);
  if (!deviceId) return jsonError('Falta identificador de dispositivo', 400, headers);
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  if (!env.RESEND_API_KEY) return jsonError('RESEND_API_KEY no está configurada', 500, headers);

  const token = crypto.randomUUID();
  await env.SYNC_KV.put(`iglesia-link:${token}`, JSON.stringify({ email, deviceId }), { expirationTtl: IGLESIA_LINK_TTL_SECONDS });

  const appUrl = String(env.APP_URL_IGLESIA || 'https://verbobiblia.com/iglesia/publicador.html').replace(/\/+$/, '');
  const confirmUrl = `${appUrl}?syncToken=${encodeURIComponent(token)}`;
  const template = IGLESIA_EMAIL[lang];

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'Verbo <no-reply@verbobiblia.com>',
      to: [email],
      subject: template.subject,
      html: template.html(confirmUrl)
    })
  });
  if (!resendResponse.ok) {
    await env.SYNC_KV.delete(`iglesia-link:${token}`);
    return jsonError('No se pudo enviar el correo', 502, headers);
  }
  return jsonOk({ ok:true }, headers);
}

// Copia de handleLinkConfirm sobre iglesia-link:/iglesia-session: en vez
// de link:/session: — misma forma exacta, namespace separado.
async function handleIglesiaLinkConfirm(request, env, headers) {
  const body = await readJson(request);
  const token = String(body?.token || '').trim();
  if (!token) return jsonError('Falta el token', 400, headers);
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);

  const raw = await env.SYNC_KV.get(`iglesia-link:${token}`);
  if (!raw) return jsonError('El enlace expiró o ya se usó', 400, headers);
  await env.SYNC_KV.delete(`iglesia-link:${token}`);

  const { email } = JSON.parse(raw);
  const emailHash = await sha256Hex(email);
  const sessionToken = crypto.randomUUID();
  await env.SYNC_KV.put(`iglesia-session:${sessionToken}`, JSON.stringify({ emailHash }), { expirationTtl: IGLESIA_SESSION_TTL_SECONDS });

  return jsonOk({ sessionToken, emailMasked: maskEmail(email) }, headers);
}

async function handleIglesiaUnlink(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const token = bearerToken(request);
  if (token) await env.SYNC_KV.delete(`iglesia-session:${token}`);
  return jsonOk({ ok:true }, headers);
}

// Copia de requireSession() sobre iglesia-session: — mismo shape
// { emailHash }, namespace separado del de usuario.
async function requireIglesiaSession(request, env, headers) {
  const token = bearerToken(request);
  if (!token) return { error: jsonError('Falta la sesión de publicador', 401, headers) };
  const raw = await env.SYNC_KV.get(`iglesia-session:${token}`);
  if (!raw) return { error: jsonError('Sesión inválida o expirada', 401, headers) };
  const { emailHash } = JSON.parse(raw);
  return { emailHash };
}

function iglesiaNumEnRango(valor, min, max) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= min && valor <= max;
}

// Editor de texto libre (bloque 3, corrección de Juan): fondo-svg ya no
// guarda textZone/textContrast fijos, guarda la transformación real que
// dejó el publicador — x/y/scale/rotation/fontFamily/fontSize/color, todo
// dato, nunca imagen horneada. textZone/textContrast del manifest solo
// sugieren el punto de partida del lado cliente, el Worker no los ve.
function iglesiaPostValido(body) {
  if (!body || typeof body !== 'object') return false;
  if (!IGLESIA_POST_TIPOS.has(body.tipo)) return false;
  if (body.texto != null && (typeof body.texto !== 'string' || body.texto.length > IGLESIA_POST_TEXTO_MAX_CHARS)) return false;
  if (body.tipo === 'texto' && !body.texto) return false;
  if (body.tipo === 'embed' && (typeof body.embedUrl !== 'string' || body.embedUrl.length > IGLESIA_POST_EMBED_MAX_CHARS || !IGLESIA_EMBED_RE.test(body.embedUrl))) return false;
  if (body.tipo === 'fondo-svg') {
    if (typeof body.fondoId !== 'string' || !body.fondoId || body.fondoId.length > IGLESIA_POST_FONDOID_MAX_CHARS) return false;
    if (!body.texto) return false;
    if (!IGLESIA_FONT_IDS.has(body.fontFamily)) return false;
    if (!iglesiaNumEnRango(body.fontSize, IGLESIA_POST_FONT_SIZE_MIN, IGLESIA_POST_FONT_SIZE_MAX)) return false;
    if (typeof body.color !== 'string' || !IGLESIA_COLOR_RE.test(body.color)) return false;
    if (!iglesiaNumEnRango(body.x, IGLESIA_POST_XY_MIN, IGLESIA_POST_XY_MAX)) return false;
    if (!iglesiaNumEnRango(body.y, IGLESIA_POST_XY_MIN, IGLESIA_POST_XY_MAX)) return false;
    if (!iglesiaNumEnRango(body.scale, IGLESIA_POST_SCALE_MIN, IGLESIA_POST_SCALE_MAX)) return false;
    if (!iglesiaNumEnRango(body.rotation, IGLESIA_POST_ROTATION_MIN, IGLESIA_POST_ROTATION_MAX)) return false;
  }
  return true;
}

const IGLESIA_NOMBRE_MAX_CHARS = 80;

// Nombre visible de la iglesia (perfil del publicador) — necesario para
// que iglesia/index.html pueda mostrar "¿Aceptar seguir las
// publicaciones de <nombre>?" antes de vincular al miembro (corrección
// de Juan: el enlace de invitación abre una confirmación explícita, no
// vincula solo ni pide pegar un código). Clave propia y chica, separada
// del feed/invite para no forzar una escritura grande solo por esto.
async function handleIglesiaPerfilSet(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireIglesiaSession(request, env, headers);
  if (session.error) return session.error;
  const body = await readJson(request);
  const nombre = String(body?.nombre || '').trim();
  if (!nombre || nombre.length > IGLESIA_NOMBRE_MAX_CHARS) return jsonError('Nombre inválido', 400, headers);
  await env.SYNC_KV.put(`iglesia:${session.emailHash}:perfil`, JSON.stringify({ nombre }));
  return jsonOk({ nombre }, headers);
}

// Público, sin sesión: el código de invitación es la única credencial
// que necesita un miembro. Resuelve código -> emailHash -> feed en una
// sola llamada, para que el cliente miembro nunca maneje el emailHash.
// Incluye el nombre de la iglesia para la pantalla de confirmación del
// miembro — se pide ANTES de vincular, así que tiene que ser público.
async function handleIglesiaFeedGet(request, url, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const code = String(url.searchParams.get('code') || '').trim();
  if (!code) return jsonError('Falta el código de invitación', 400, headers);
  const inviteRaw = await env.SYNC_KV.get(`iglesia-invite:${code}`);
  if (!inviteRaw) return jsonError('No encontramos esa iglesia', 404, headers);
  const { emailHash } = JSON.parse(inviteRaw);
  const [feedRaw, perfilRaw] = await Promise.all([
    env.SYNC_KV.get(`iglesia:${emailHash}:feed`),
    env.SYNC_KV.get(`iglesia:${emailHash}:perfil`),
  ]);
  const posts = feedRaw ? JSON.parse(feedRaw) : [];
  const nombre = perfilRaw ? JSON.parse(perfilRaw).nombre : null;
  return jsonOk({ posts, nombre }, headers);
}

async function handleIglesiaMine(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireIglesiaSession(request, env, headers);
  if (session.error) return session.error;
  const [feedRaw, inviteRaw, perfilRaw] = await Promise.all([
    env.SYNC_KV.get(`iglesia:${session.emailHash}:feed`),
    env.SYNC_KV.get(`iglesia:${session.emailHash}:invite`),
    env.SYNC_KV.get(`iglesia:${session.emailHash}:perfil`),
  ]);
  const posts = feedRaw ? JSON.parse(feedRaw) : [];
  const invite = inviteRaw ? JSON.parse(inviteRaw) : null;
  const nombre = perfilRaw ? JSON.parse(perfilRaw).nombre : null;
  return jsonOk({ feed: posts, invite, nombre }, headers);
}

// Un solo código por publicador: si ya existe, lo devuelve tal cual (no
// expira, no se regenera solo). iglesia:<emailHash>:invite es el puntero
// directo (para que el publicador vea su propio código sin buscarlo);
// iglesia-invite:<código> es el inverso, el que usa handleIglesiaFeedGet.
async function handleIglesiaInvite(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireIglesiaSession(request, env, headers);
  if (session.error) return session.error;

  const existingRaw = await env.SYNC_KV.get(`iglesia:${session.emailHash}:invite`);
  if (existingRaw) return jsonOk(JSON.parse(existingRaw), headers);

  let code = '';
  for (let intento = 0; intento < 5 && !code; intento += 1) {
    const candidato = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const taken = await env.SYNC_KV.get(`iglesia-invite:${candidato}`);
    if (!taken) code = candidato;
  }
  if (!code) return jsonError('No se pudo generar un código de invitación', 500, headers);

  await env.SYNC_KV.put(`iglesia-invite:${code}`, JSON.stringify({ emailHash: session.emailHash }));
  await env.SYNC_KV.put(`iglesia:${session.emailHash}:invite`, JSON.stringify({ code }));
  return jsonOk({ code }, headers);
}

// Rotación FIFO en una sola escritura: agrega la publicación nueva y,
// si supera las 30 vigentes, descarta la más antigua antes del PUT —
// nunca hay más de un PUT por publicación, igual que handleDataPut.
async function handleIglesiaPostCreate(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireIglesiaSession(request, env, headers);
  if (session.error) return session.error;
  const body = await readJson(request);
  if (!iglesiaPostValido(body)) return jsonError('Publicación inválida', 400, headers);

  const feedRaw = await env.SYNC_KV.get(`iglesia:${session.emailHash}:feed`);
  const posts = feedRaw ? JSON.parse(feedRaw) : [];
  posts.push({
    id: crypto.randomUUID(),
    tipo: body.tipo,
    texto: body.texto || null,
    fondoId: body.tipo === 'fondo-svg' ? body.fondoId : null,
    embedUrl: body.tipo === 'embed' ? body.embedUrl : null,
    fontFamily: body.tipo === 'fondo-svg' ? body.fontFamily : null,
    fontSize: body.tipo === 'fondo-svg' ? body.fontSize : null,
    color: body.tipo === 'fondo-svg' ? body.color : null,
    x: body.tipo === 'fondo-svg' ? body.x : null,
    y: body.tipo === 'fondo-svg' ? body.y : null,
    scale: body.tipo === 'fondo-svg' ? body.scale : null,
    rotation: body.tipo === 'fondo-svg' ? body.rotation : null,
    fecha: new Date().toISOString(),
  });
  while (posts.length > IGLESIA_FEED_MAX_ITEMS) posts.shift();

  await env.SYNC_KV.put(`iglesia:${session.emailHash}:feed`, JSON.stringify(posts));
  return jsonOk({ feed: posts }, headers);
}

// POST en vez de DELETE a propósito: corsHeaders() (compartido con todo
// el Worker) no lista DELETE entre los métodos permitidos, y agregarlo
// ahí para esta sola función no vale el riesgo de tocar código
// compartido — más simple que este handler use POST.
async function handleIglesiaPostDelete(request, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const session = await requireIglesiaSession(request, env, headers);
  if (session.error) return session.error;
  const body = await readJson(request);
  const id = String(body?.id || '').trim();
  if (!id) return jsonError('Falta el id de la publicación', 400, headers);

  const feedRaw = await env.SYNC_KV.get(`iglesia:${session.emailHash}:feed`);
  const posts = feedRaw ? JSON.parse(feedRaw) : [];
  const filtered = posts.filter(p => p.id !== id);

  await env.SYNC_KV.put(`iglesia:${session.emailHash}:feed`, JSON.stringify(filtered));
  return jsonOk({ feed: filtered }, headers);
}

async function handleIglesia(request, url, env, headers) {
  if (url.pathname === '/v1/iglesia/link-request' && request.method === 'POST') return handleIglesiaLinkRequest(request, env, headers);
  if (url.pathname === '/v1/iglesia/link-confirm' && request.method === 'POST') return handleIglesiaLinkConfirm(request, env, headers);
  if (url.pathname === '/v1/iglesia/unlink' && request.method === 'POST') return handleIglesiaUnlink(request, env, headers);
  if (url.pathname === '/v1/iglesia/mine' && request.method === 'GET') return handleIglesiaMine(request, env, headers);
  if (url.pathname === '/v1/iglesia/perfil' && request.method === 'POST') return handleIglesiaPerfilSet(request, env, headers);
  if (url.pathname === '/v1/iglesia/invite' && request.method === 'POST') return handleIglesiaInvite(request, env, headers);
  if (url.pathname === '/v1/iglesia/post' && request.method === 'POST') return handleIglesiaPostCreate(request, env, headers);
  if (url.pathname === '/v1/iglesia/post-delete' && request.method === 'POST') return handleIglesiaPostDelete(request, env, headers);
  if (url.pathname === '/v1/iglesia/feed' && request.method === 'GET') return handleIglesiaFeedGet(request, url, env, headers);
  return jsonError('Recurso no permitido', 404, headers);
}

// ── /proyector/estado ───────────────────────────────────────────────────
//
// Relay simple de comando/estado entre control.html (PC) y el futuro
// remoto.html (celular), identificados por un código de sala de 6 dígitos.
// Nada de WebRTC ni señalización propia: ambos lados hacen polling (GET
// cada ~800ms) y escriben con POST — el Worker es solo un buzón compartido
// en KV. No hay requisito de latencia real-time para play/pausa/volumen.
const PROYECTOR_ROOM_TTL_SECONDS = 5 * 60; // 5 minutos, renovado en cada POST
const PROYECTOR_ESTADO_CAMPOS = [
  'reproduciendo', 'volumen', 'itemActivo', 'origen',
  // Orden del culto y diapositiva activa (letra/versículo), para que el
  // remoto navegue lo mismo que ve el operador en control.html — no solo
  // el audio de fondo.
  'ordenCulto', 'ordenActivoIndex',
  'diapositivaTexto', 'diapositivaReferencia', 'diapositivaIndex', 'diapositivaTotal',
  'diapositivas',
];
const PROYECTOR_ESTADO_POR_DEFECTO = {
  reproduciendo: false, volumen: 100, itemActivo: null, origen: null,
  ordenCulto: [], ordenActivoIndex: -1,
  diapositivaTexto: null, diapositivaReferencia: null, diapositivaIndex: -1, diapositivaTotal: 0,
  diapositivas: [],
};
const PROYECTOR_ORDEN_MAX_ITEMS = 100;
const PROYECTOR_ORDEN_CAMPO_MAX_CHARS = 200;
const PROYECTOR_DIAPOSITIVA_TEXTO_MAX_CHARS = 4000;
const PROYECTOR_DIAPOSITIVA_REF_MAX_CHARS = 300;
const PROYECTOR_DIAPOSITIVAS_MAX_ITEMS = 200;
const PROYECTOR_DIAPOSITIVA_TAG_MAX_CHARS = 20;
const PROYECTOR_DIAPOSITIVA_SNIPPET_MAX_CHARS = 200;

function proyectorOrdenValido(valor) {
  if (!Array.isArray(valor) || valor.length > PROYECTOR_ORDEN_MAX_ITEMS) return false;
  return valor.every((item) =>
    item && typeof item === 'object' &&
    typeof item.tag === 'string' && item.tag.length <= PROYECTOR_ORDEN_CAMPO_MAX_CHARS &&
    typeof item.descripcion === 'string' && item.descripcion.length <= PROYECTOR_ORDEN_CAMPO_MAX_CHARS
  );
}

function proyectorDiapositivasValidas(valor) {
  if (!Array.isArray(valor) || valor.length > PROYECTOR_DIAPOSITIVAS_MAX_ITEMS) return false;
  return valor.every((item) =>
    item && typeof item === 'object' &&
    typeof item.tag === 'string' && item.tag.length <= PROYECTOR_DIAPOSITIVA_TAG_MAX_CHARS &&
    typeof item.snippet === 'string' && item.snippet.length <= PROYECTOR_DIAPOSITIVA_SNIPPET_MAX_CHARS
  );
}

function proyectorCampoValido(campo, valor) {
  if (campo === 'reproduciendo') return typeof valor === 'boolean';
  if (campo === 'volumen') return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor <= 100;
  if (campo === 'itemActivo') return valor === null || typeof valor === 'string';
  if (campo === 'origen') return typeof valor === 'string';
  if (campo === 'ordenCulto') return proyectorOrdenValido(valor);
  if (campo === 'ordenActivoIndex') return typeof valor === 'number' && Number.isInteger(valor) && valor >= -1;
  if (campo === 'diapositivaTexto') return valor === null || (typeof valor === 'string' && valor.length <= PROYECTOR_DIAPOSITIVA_TEXTO_MAX_CHARS);
  if (campo === 'diapositivaReferencia') return valor === null || (typeof valor === 'string' && valor.length <= PROYECTOR_DIAPOSITIVA_REF_MAX_CHARS);
  if (campo === 'diapositivaIndex') return typeof valor === 'number' && Number.isInteger(valor) && valor >= -1;
  if (campo === 'diapositivaTotal') return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0;
  if (campo === 'diapositivas') return proyectorDiapositivasValidas(valor);
  return false;
}

async function handleProyectorEstado(request, url, env, headers) {
  if (!env.SYNC_KV) return jsonError('Sincronización no está configurada', 500, headers);
  const room = String(url.searchParams.get('room') || '').trim();
  if (!/^\d{6}$/.test(room)) return jsonError('El código de sala debe tener 6 dígitos', 400, headers);
  const clave = `room:${room}:estado`;

  if (request.method === 'GET') {
    const raw = await env.SYNC_KV.get(clave);
    if (!raw) return jsonError('Sala no encontrada', 404, headers);
    return jsonOk(JSON.parse(raw), headers);
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    if (!body || typeof body !== 'object') return jsonError('Cuerpo inválido', 400, headers);

    const raw = await env.SYNC_KV.get(clave);
    const actual = raw ? JSON.parse(raw) : { ...PROYECTOR_ESTADO_POR_DEFECTO };

    for (const campo of PROYECTOR_ESTADO_CAMPOS) {
      if (campo in body && proyectorCampoValido(campo, body[campo])) actual[campo] = body[campo];
    }
    actual.ts = Date.now();

    await env.SYNC_KV.put(clave, JSON.stringify(actual), { expirationTtl: PROYECTOR_ROOM_TTL_SECONDS });
    return jsonOk(actual, headers);
  }

  return jsonError('Método no permitido', 405, headers);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers });
    if (!headers['Access-Control-Allow-Origin']) return jsonError('Origen no autorizado', 403, headers);

    if (url.pathname.startsWith('/v1/sync/')) return handleSync(request, url, env, headers);
    if (url.pathname.startsWith('/v1/iglesia/')) return handleIglesia(request, url, env, headers);
    if (url.pathname === '/translate-study-assistant') return handleTranslateStudyAssistant(request, env, headers);
    if (url.pathname === '/translate') return handleTranslate(request, env, headers);
    if (url.pathname === '/translate-sermon-doc') return handleTranslateSermonDoc(request, env, headers);
    if (url.pathname === '/proyector/estado') return handleProyectorEstado(request, url, env, headers);
    return handleApiBible(request, url, env, headers);
  }
};
