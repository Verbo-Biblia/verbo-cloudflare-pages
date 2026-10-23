/* ==========================================================================
   Reglas de un caso de Coldfolio: las comparten el juego (app.js), el editor
   (editor.js) y el validador de consola (tools/validar-casos.mjs).
   Cambiar aquí un límite lo cambia en todas partes.
   ========================================================================== */

// Huecos de la pizarra: máximo de pruebas que el jugador puede clavar a la vez.
export const MAX_PINS = 20;

// Material por caso: pruebas con imagen (perfil, personas, lugares, objetos, galería)
// y recompensas que se desbloquean al resolverlo.
export const MAX_EVIDENCE_IMAGES = 26;
export const REWARD_IMAGES = 4;

export const MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'mp4'];

export const SECTIONS = [['persona', 'Personas'], ['lugares', 'Lugares'], ['objetos', 'Objetos'], ['documentos', 'Documentos'], ['galeria', 'Galería']];

export const DOC_KINDS = ['nota', 'carta', 'fax', 'ticket', 'documento', 'atestado', 'croquis', 'periodico', 'contestador'];

// Sección del expediente en la que aparece una prueba.
export function sectionOf(item) {
  if (item.section) return item.section;
  if (item.doc) return 'documentos';
  if (item.id.startsWith('perfil') || item.id.startsWith('persona')) return 'persona';
  if (item.id.startsWith('lugar')) return 'lugares';
  if (item.id.startsWith('objeto')) return 'objetos';
  return 'galeria';
}

// Sospechosos: personas con foto. Solo a ellas se les puede poner el sello de culpable.
export const isSuspect = (item) => Boolean(item?.id) && !item.doc && sectionOf(item) === 'persona';


/* Revisa un caso. Devuelve [{ level: 'error' | 'warn' | 'info', text }].
   Los errores impiden jugar o resolver el caso; los avisos son recomendaciones. */
export function validateCase(data, allCases = [data]) {
  const issues = [];
  const add = (level, text) => issues.push({ level, text });
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];
  const ids = new Set();

  if (!data.code) add('error', 'Falta el código del expediente.');
  if (data.code && !/^[A-Za-z0-9._-]+$/.test(data.code)) add('error', `El código «${data.code}» solo puede llevar letras sin acentos, números, punto, guion y guion bajo (da nombre a la carpeta de imágenes).`);
  if (allCases.filter((item) => item.code === data.code).length > 1) add('error', `Hay otro expediente con el código ${data.code}.`);
  if (!data.title) add('error', 'Falta el título.');
  if (!data.objective) add('warn', 'Falta el objetivo para el jugador.');
  if (!Array.isArray(data.evidence)) add('error', 'Falta la lista «evidence».');
  if (evidence.length < 6) add('warn', `Solo hay ${evidence.length} pruebas: con menos de 6 el caso se adivina.`);
  if (!evidence.some((item) => item.id === 'perfil')) add('warn', 'No hay prueba «perfil»: la carpeta de la mesa saldrá sin foto.');

  const images = evidence.filter((item) => item?.id && !item.doc).length;
  if (images > MAX_EVIDENCE_IMAGES) add('error', `Hay ${images} pruebas con imagen: el máximo es ${MAX_EVIDENCE_IMAGES}. Convierte alguna en documento.`);

  const sectionKeys = SECTIONS.map(([key]) => key);
  evidence.forEach((item, index) => {
    if (!item || !item.id) return add('error', `La prueba nº ${index + 1} no tiene id.`);
    if (ids.has(item.id)) add('error', `El id «${item.id}» está repetido.`);
    ids.add(item.id);
    if (!/^[a-z0-9_-]+$/.test(item.id)) add('error', `El id «${item.id}» solo puede llevar minúsculas sin acentos, números, guion y guion bajo (es el nombre del archivo).`);
    if (!item.title) add('error', `La prueba ${item.id} no tiene título.`);
    if (item.section && !sectionKeys.includes(item.section)) add('error', `La prueba ${item.id} tiene una sección que no existe: «${item.section}». Usa ${sectionKeys.join(', ')}.`);
    if (item.doc && !DOC_KINDS.includes(item.doc.kind)) add('error', `El documento ${item.id} tiene un tipo que no existe: «${item.doc.kind}». Usa ${DOC_KINDS.join(', ')}.`);
  });
  SECTIONS.forEach(([key, label]) => {
    const count = evidence.filter((item) => item?.id && sectionOf(item) === key).length;
    if (count > 20) add('error', `La sección ${label} tiene ${count} pruebas: no caben en pantalla (máximo 20, ideal 10 o menos).`);
    else if (count > 12) add('warn', `La sección ${label} tiene ${count} pruebas: se verán pequeñas. Mejor 12 o menos por sección.`);
  });

  // «answer»: el sello va sobre cualquier prueba con imagen (objeto, lugar, persona…). «culprit»: solo personas.
  if (data.answer) {
    const answer = evidence.find((item) => item?.id === data.answer);
    const candidates = evidence.filter((item) => item?.id && !item.doc);
    if (!answer) add('error', `La respuesta «${data.answer}» no es ninguna prueba del caso.`);
    else if (answer.doc) add('error', `La respuesta «${data.answer}» tiene que ser una prueba con imagen, no un documento.`);
    if (candidates.length < 3) add('error', `Solo hay ${candidates.length} pruebas con imagen: hacen falta al menos 3 para que la respuesta no se adivine.`);
  } else {
    const suspects = evidence.filter(isSuspect);
    const culprit = evidence.find((item) => item?.id === data.culprit);
    if (!data.culprit) add('error', 'Falta «culprit» (id de la persona culpable) o «answer» (id de la prueba que resuelve el caso).');
    else if (!culprit) add('error', `El culpable «${data.culprit}» no es ninguna prueba del caso.`);
    else if (!isSuspect(culprit)) add('error', `El culpable «${data.culprit}» tiene que ser una persona con foto (perfil, persona1…), no un documento ni un lugar.`);
    if (suspects.length < 3) add('error', `Solo hay ${suspects.length} personas con foto: hacen falta al menos 3 (culpable, testigos y sospechosos) para que no se adivine. Añade persona1, persona2…`);
  }
  if (!data.reward?.title) add('warn', 'Falta el título de la revelación final.');
  if (!data.reward?.copy) add('error', 'Falta la revelación final (qué pasó realmente).');
  const rewards = data.reward?.assets?.length || 0;
  if (rewards > REWARD_IMAGES) add('error', `Hay ${rewards} recompensas: el máximo es ${REWARD_IMAGES}.`);
  else if (rewards < REWARD_IMAGES) add('warn', `Hay ${rewards} recompensas: cada caso debería desbloquear ${REWARD_IMAGES}.`);
  return issues;
}
