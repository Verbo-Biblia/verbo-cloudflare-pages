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
const TRANSLATE_CACHE_PREFIX = 'translate:v4';

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
  if (html.length > MAX_TRANSLATE_CHARS) return jsonError(`El documento supera el límite de ${MAX_TRANSLATE_CHARS} caracteres`, 400, headers);
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers });
    if (!headers['Access-Control-Allow-Origin']) return jsonError('Origen no autorizado', 403, headers);

    if (url.pathname.startsWith('/v1/sync/')) return handleSync(request, url, env, headers);
    if (url.pathname === '/translate') return handleTranslate(request, env, headers);
    if (url.pathname === '/translate-sermon-doc') return handleTranslateSermonDoc(request, env, headers);
    return handleApiBible(request, url, env, headers);
  }
};
