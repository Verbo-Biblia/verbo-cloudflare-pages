// Idioma y textos de la interfaz. El idioma es el mismo valor que guarda Verbo (verbo:uiLang), así el juego abre
// en el idioma que la persona eligió en el sitio. Cada juego puede cambiar cualquier texto desde su cases.json
// (game.textos), y en inglés desde cases.en.json: así un mismo motor sirve para un archivo policial o una excavación.

const CLAVE_IDIOMA = 'verbo:uiLang';

export function idioma() {
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_IDIOMA); } catch { /* sin almacenamiento */ }
  if (guardado === 'es' || guardado === 'en') return guardado;
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function cambiarIdioma(lang) {
  try { localStorage.setItem(CLAVE_IDIOMA, lang); } catch { /* sin almacenamiento */ }
}

const TEXTOS = {
  es: {
    escenaMesa: 'Mesa', escenaExpediente: 'Expediente', escenaPizarra: 'Pizarra',
    mesaCabecera: 'Mesa de investigación · Otoño de 1994', mesaTitulo: 'Los expedientes que nadie cerró.',
    mesaIntro: 'Cada carpeta guarda fotografías, cintas y papeles sin ordenar. Abre una, reconstruye el hilo y archiva lo que encuentres.',
    volverInicio: 'Volver al inicio', progreso: 'Hilos', sonidoSi: 'Sonido: sí', sonidoNo: 'Sonido: no',
    coleccion: 'Colección', salir: 'Salir', resueltos: 'Resueltos', reputacion: 'Reputación',
    recorrer: 'Recorrer expedientes', anteriores: 'Expedientes anteriores', siguientes: 'Expedientes siguientes',
    carpetas: 'Carpetas', pila: 'Expedientes apilados', rangoDe: (a, b, n) => `${a}–${b} de ${n}`,
    expediente: 'Expediente', objetivo: 'Objetivo', irPizarra: 'Ir a la pizarra', enPizarra: 'En pizarra',
    seccionesExp: 'Secciones del expediente', pistaExaminar: 'Toca para examinar · «Clavar» la lleva a la pizarra',
    pizarraVacia: 'La pizarra está vacía.', clavaDesde: 'Clava pruebas desde el expediente',
    notaInicial: 'Une pruebas con hilos para ordenar tus ideas. Cuando lo tengas claro, pon el sello de culpable sobre una persona. Toca dos veces una ficha para verla de cerca.',
    notaReinicio: 'Une pruebas con hilos para ordenar tus ideas. Cuando lo tengas claro, pon el sello de culpable sobre una persona.',
    hilos: n => `${n} ${n === 1 ? 'hilo' : 'hilos'}`, reiniciar: 'Reiniciar', unir: 'Unir pruebas', cortar: 'Cortar hilo',
    sello: 'Sello de culpable', selloTitulo: 'Toca y luego la foto del culpable', casoCerrado: 'Caso cerrado',
    casoCerradoTitulo: 'Caso resuelto: toca «Reiniciar» para jugarlo de nuevo', marcaSello: 'Culpable',
    abrir: 'Abrir el archivo', salirJuego: 'Salir del juego', puedesCerrar: 'Puedes cerrar esta ventana.',
    aviso: 'Ficción para adultos · 18+', fechaVhs: 'OCT 14 1994 · 23:40',
    archivoPersonal: 'Archivo personal', materialDesbloqueado: 'Material desbloqueado',
    clavarPizarra: 'Clavar en la pizarra', quitarPizarra: 'Quitar de la pizarra', volverMesa: 'Volver a la mesa',
    docAmpliado: 'Documento ampliado', alejar: 'Alejar', ajustar: 'Ajustar', acercar: 'Acercar', cerrar: 'Cerrar',
    zoomPista: 'Pellizca o toca dos veces para ampliar · arrastra para moverte', tocaAmpliar: '🔍 Toca para ampliar',
    faltaArchivo: 'Falta archivo', cerrarVentana: 'Puedes cerrar esta ventana.',
    rangos: ['Novato', 'Investigador en prácticas', 'Detective', 'Detective de primera', 'Inspector', 'Inspector jefe', 'Profesional'],
    sinSellos: 'Sin sellos que perder', masSello: '+1 sello de reconocimiento', menosSello: '−1 sello de reconocimiento',
    nuevaMedalla: '¡Nueva medalla!', pierdesMedalla: 'Pierdes una medalla', ascenso: 'Ascenso', degradado: 'Degradado', rango: 'Rango',
    hojaServicio: 'Hoja de servicio', merito: 'Mérito', medallaMerito: 'Medalla al mérito', sinMedallas: 'Sin medallas todavía',
    sellosFaltan: (n, f) => `${n} ${n === 1 ? 'sello' : 'sellos'} · faltan ${f} para la próxima medalla`,
    sellosBarra: (a, b) => `Sellos de reconocimiento: ${a} de ${b} para la próxima medalla`,
    estadoResuelto: 'Resuelto', estadoFallido: n => `Fallido${n > 1 ? ` ×${n}` : ''}`, estadoAbierto: 'Abierto', estadoConfidencial: 'Confidencial',
    resumenPila: (p, n) => `${p} pruebas · ${n} personas`, examinar: titulo => `Examinar ${titulo}`, clavar: 'Clavar',
    personaConSello: 'Esta persona lleva el sello de culpable: no se puede quitar.',
    pizarraLlena: n => `La pizarra está llena (${n}). Quita alguna prueba antes.`,
    pruebaN: n => `PRUEBA ${n}`,
    ya_hilo: 'Ya hay un hilo entre estas pruebas. Toca «Cortar hilo» para quitarlo.', tiendeHilo: 'Toca «Unir pruebas» para tender el hilo.',
    segunda: 'Elige una segunda prueba.', eligeDos: 'Elige dos pruebas para tender un hilo.',
    hiloCortado: 'Hilo cortado.', hiloTendido: 'Hilo tendido. Cuando lo tengas claro, pon el sello de culpable.',
    selloEnMano: 'Sello en la mano: toca la foto de la persona culpable. Toca de nuevo el sello para guardarlo.',
    sinCandidatos: 'No hay ninguna persona en la pizarra. Clava primero a quien sospeches.',
    soloPersonas: 'El sello solo va sobre la foto de una persona.', selloPuesto: 'Sello puesto. Revisando el expediente…',
    casoResueltoNota: 'Caso resuelto. Toca «Reiniciar» para empezarlo de nuevo.',
    progresoRecuperado: 'Progreso recuperado. Cuando lo tengas claro, pon el sello de culpable.',
    errorTitulo: titulo => `${titulo} no es quien buscas`, errorCabecera: code => `Acusación errónea · Expediente ${code}`,
    errorPorDefecto: 'Esa persona no encaja con las pruebas.',
    errorRepeticion: 'Ya habías resuelto este caso: tu reputación no cambia.',
    errorFondo: 'El expediente vuelve al fondo de la pila: podrás reabrirlo más adelante, desde cero.',
    errorSinCambios: 'Caso ya resuelto · sin cambios en tu reputación',
    errorAmable: 'Revisa otra vez las pistas e inténtalo de nuevo: no pierdes nada.',
    examen: tipo => `Examen de prueba · ${tipo}`, resueltoCabecera: 'Caso resuelto · Archivo completo',
    guardadoColeccion: c => `Guardado en colección · ${c}`,
    resueltoNota: 'Caso resuelto. El material está en tu colección. Toca «Reiniciar» para jugarlo de nuevo.',
    coleccionVacia: 'Aún no hay piezas desbloqueadas.', coleccionVaciaPista: 'Resuelve un expediente para comenzar la colección.',
    noCarga: e => `No se pudo cargar el juego: ${e}`, otroIdioma: '🌐 English', volverJuegos: '← Juegos de Verbo',
    secciones: { persona: 'Personas', lugares: 'Lugares', objetos: 'Objetos', documentos: 'Documentos', galeria: 'Galería' },
    doc: { para: 'PARA:', de: 'DE:', mensaje: 'MENSAJE', transcripcion: 'TRANSCRIPCIÓN', contestador: 'CONTESTADOR', caraA: 'CARA A',
      informe: 'INFORME', informePolicial: 'INFORME POLICIAL', exposicion: 'EXPOSICIÓN DE HECHOS:', numInforme: 'Nº INFORME',
      institucion: 'DIRECCIÓN GRAL. DE LA POLICÍA', dependencia: 'COMISARÍA DISTRITO CENTRO', sucesos: 'SUCESOS',
      ticket: '*** PARKING ***', archivo: 'ARCHIVO UMBRAL', fax: 'FAX' },
  },
  en: {
    escenaMesa: 'Desk', escenaExpediente: 'File', escenaPizarra: 'Board',
    mesaCabecera: 'Investigation desk · Autumn 1994', mesaTitulo: 'The files nobody closed.',
    mesaIntro: 'Each folder holds photos, tapes and papers in no order. Open one, rebuild the thread and file what you find.',
    volverInicio: 'Back to start', progreso: 'Threads', sonidoSi: 'Sound: on', sonidoNo: 'Sound: off',
    coleccion: 'Collection', salir: 'Exit', resueltos: 'Solved', reputacion: 'Reputation',
    recorrer: 'Browse files', anteriores: 'Previous files', siguientes: 'Next files',
    carpetas: 'Folders', pila: 'Stacked files', rangoDe: (a, b, n) => `${a}–${b} of ${n}`,
    expediente: 'File', objetivo: 'Goal', irPizarra: 'Go to the board', enPizarra: 'On board',
    seccionesExp: 'File sections', pistaExaminar: 'Tap to examine · «Pin» sends it to the board',
    pizarraVacia: 'The board is empty.', clavaDesde: 'Pin evidence from the file',
    notaInicial: 'Join evidence with threads to sort out your ideas. When you are sure, put the guilty stamp on a person. Double-tap a card to look closer.',
    notaReinicio: 'Join evidence with threads to sort out your ideas. When you are sure, put the guilty stamp on a person.',
    hilos: n => `${n} ${n === 1 ? 'thread' : 'threads'}`, reiniciar: 'Restart', unir: 'Join evidence', cortar: 'Cut thread',
    sello: 'Guilty stamp', selloTitulo: 'Tap it, then the photo of the guilty one', casoCerrado: 'Case closed',
    casoCerradoTitulo: 'Case solved: tap «Restart» to play it again', marcaSello: 'Guilty',
    abrir: 'Open the archive', salirJuego: 'Quit game', puedesCerrar: 'You can close this window.',
    aviso: 'Fiction for adults · 18+', fechaVhs: 'OCT 14 1994 · 23:40',
    archivoPersonal: 'Personal archive', materialDesbloqueado: 'Unlocked material',
    clavarPizarra: 'Pin to the board', quitarPizarra: 'Remove from the board', volverMesa: 'Back to the desk',
    docAmpliado: 'Enlarged document', alejar: 'Zoom out', ajustar: 'Fit', acercar: 'Zoom in', cerrar: 'Close',
    zoomPista: 'Pinch or double-tap to zoom · drag to move', tocaAmpliar: '🔍 Tap to enlarge',
    faltaArchivo: 'Missing file', cerrarVentana: 'You can close this window.',
    rangos: ['Rookie', 'Trainee investigator', 'Detective', 'First-class detective', 'Inspector', 'Chief inspector', 'Professional'],
    sinSellos: 'No stamps to lose', masSello: '+1 merit stamp', menosSello: '−1 merit stamp',
    nuevaMedalla: 'New medal!', pierdesMedalla: 'You lose a medal', ascenso: 'Promoted', degradado: 'Demoted', rango: 'Rank',
    hojaServicio: 'Service record', merito: 'Merit', medallaMerito: 'Medal of merit', sinMedallas: 'No medals yet',
    sellosFaltan: (n, f) => `${n} ${n === 1 ? 'stamp' : 'stamps'} · ${f} more for the next medal`,
    sellosBarra: (a, b) => `Merit stamps: ${a} of ${b} for the next medal`,
    estadoResuelto: 'Solved', estadoFallido: n => `Failed${n > 1 ? ` ×${n}` : ''}`, estadoAbierto: 'Open', estadoConfidencial: 'Confidential',
    resumenPila: (p, n) => `${p} pieces of evidence · ${n} people`, examinar: titulo => `Examine ${titulo}`, clavar: 'Pin',
    personaConSello: 'This person carries the guilty stamp: it cannot be removed.',
    pizarraLlena: n => `The board is full (${n}). Remove something first.`,
    pruebaN: n => `EXHIBIT ${n}`,
    ya_hilo: 'There is already a thread between these. Tap «Cut thread» to remove it.', tiendeHilo: 'Tap «Join evidence» to tie the thread.',
    segunda: 'Choose a second piece.', eligeDos: 'Choose two pieces to tie a thread.',
    hiloCortado: 'Thread cut.', hiloTendido: 'Thread tied. When you are sure, use the guilty stamp.',
    selloEnMano: 'Stamp in hand: tap the photo of the guilty person. Tap the stamp again to put it away.',
    sinCandidatos: 'There is no person on the board. Pin your suspect first.',
    soloPersonas: 'The stamp only goes on a person’s photo.', selloPuesto: 'Stamp placed. Reviewing the file…',
    casoResueltoNota: 'Case solved. Tap «Restart» to start it again.',
    progresoRecuperado: 'Progress restored. When you are sure, use the guilty stamp.',
    errorTitulo: titulo => `${titulo} is not the one`, errorCabecera: code => `Wrong accusation · File ${code}`,
    errorPorDefecto: 'That person does not fit the evidence.',
    errorRepeticion: 'You had already solved this case: your reputation does not change.',
    errorFondo: 'The file goes back to the bottom of the pile: you can reopen it later, from scratch.',
    errorSinCambios: 'Case already solved · no change to your reputation',
    errorAmable: 'Look at the clues again and try once more: you lose nothing.',
    examen: tipo => `Examining evidence · ${tipo}`, resueltoCabecera: 'Case solved · File complete',
    guardadoColeccion: c => `Saved to collection · ${c}`,
    resueltoNota: 'Case solved. The material is in your collection. Tap «Restart» to play it again.',
    coleccionVacia: 'No pieces unlocked yet.', coleccionVaciaPista: 'Solve a file to start the collection.',
    noCarga: e => `The game could not load: ${e}`, otroIdioma: '🌐 Español', volverJuegos: '← Verbo games',
    secciones: { persona: 'People', lugares: 'Places', objetos: 'Objects', documentos: 'Documents', galeria: 'Gallery' },
    doc: { para: 'TO:', de: 'FROM:', mensaje: 'MESSAGE', transcripcion: 'TRANSCRIPT', contestador: 'ANSWERING MACHINE', caraA: 'SIDE A',
      informe: 'REPORT', informePolicial: 'POLICE REPORT', exposicion: 'STATEMENT OF FACTS:', numInforme: 'REPORT No.',
      institucion: 'GENERAL POLICE DEPARTMENT', dependencia: 'CENTRAL DISTRICT STATION', sucesos: 'LOCAL NEWS',
      ticket: '*** PARKING ***', archivo: 'UMBRAL ARCHIVE', fax: 'FAX' },
  },
};

// Textos propios del juego (game.textos de cases.json, ya combinado con cases.en.json en inglés).
let propios = {};
export function fijarTextosJuego(textos) { propios = textos || {}; }

// t('clave', ...args): texto del juego si lo trae, si no el del motor. Los textos con datos son funciones;
// en cases.json se escriben con {0}, {1}… («{0} pruebas · {1} personas»).
export function t(clave, ...args) {
  const valor = clave.split('.').reduce((o, k) => o?.[k], propios) ?? clave.split('.').reduce((o, k) => o?.[k], TEXTOS[idioma()]) ?? clave;
  if (typeof valor === 'function') return valor(...args);
  if (typeof valor === 'string' && args.length) return valor.replace(/\{(\d+)\}/g, (_, i) => args[i] ?? '');
  return valor;
}
