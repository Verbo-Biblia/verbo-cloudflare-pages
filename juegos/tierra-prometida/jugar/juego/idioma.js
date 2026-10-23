// Idioma del juego: español o inglés. Sigue el idioma de Verbo (misma clave «verbo:uiLang» del sitio), así quien
// elige inglés en la web lo ve todo en inglés; si cambia aquí, cambia también el del sitio.

// Los rivales suelen ser pueblos en plural («Los cananeos», «The Canaanites»): verbo y posesivo concuerdan.
const plural = q => /s$/.test(q);
// En medio de la frase el artículo va en minúscula: «Turno de los cananeos».
const art = q => q.replace(/^(Los|Las|El|La) /, m => m.toLowerCase());
const pos = q => plural(q) ? `${q}'` : `${q}'s`;
const vb = (q, base, tercera = base + 's') => plural(q) ? base : tercera;

const CLAVE = 'verbo:uiLang';

export function idioma() {
  try {
    const l = localStorage.getItem(CLAVE);
    if (l === 'es' || l === 'en') return l;
  } catch {}
  return String(navigator.language || 'es').slice(0, 2).toLowerCase() === 'es' ? 'es' : 'en';
}

export function cambiarIdioma(l) {
  try { localStorage.setItem(CLAVE, l); } catch {}
  document.documentElement.lang = l;
}

// Textos de la interfaz. Las funciones reciben los valores que van dentro de la frase.
const TEXTOS = {
  es: {
    comenzar: 'Comenzar', continuar: 'Continuar', nuevaPartida: 'Nueva partida', seguroBorrar: '¿Seguro? Se borra el progreso guardado',
    comoSeJuega: 'Cómo se juega', creador: 'Creador', sonidoSi: '🔊 Sonido activado', sonidoNo: '🔇 Sonido apagado', otroIdioma: '🌐 English',
    tematica: 'Temática', inicio: 'Inicio', volverJuegos: '← Juegos de Verbo',
    pueblo: 'El pueblo', taller: 'Taller de mazos', tienda: 'Tienda', cronista: 'Casa del cronista', arena: 'Arena', mapa: 'Mapa',
    puerta: 'Puerta al mapa', campana: 'Campaña', escaramuza: 'Partida rápida', moneda: 'monedas',
    conquistadas: (n, m) => `${n}/${m}`,
    estadoConquistada: 'Conquistada', estadoBloqueada: 'Todavía no hay camino hasta aquí.',
    estadoDisponible: (k, n) => `Partida ${k} de ${n}`, estadoRecuperar: 'El enemigo la recuperó: reconquístala con una sola partida.',
    rival: 'Rival', premioConquista: (c, m) => `Premio al conquistarla: <b>${c}</b> y ${m}`, jugar: 'Jugar', alaBatalla: 'A la batalla',
    reconquista: 'Reconquista', partidaDe: (k, n) => `Partida ${k} de ${n}`, acto: n => `Acto ${n}`,
    racha: (a, b) => `Derrotas seguidas: ${a}/${b}`,
    mazoNoListo: 'Tu mazo no está listo', arreglaloTaller: 'Arréglalo en el taller de mazos.',
    victoria: '¡Victoria!', derrota: 'Derrota', conquista: '¡Conquista!', reconquistaTitulo: '¡Reconquista!',
    faltan: (n, lugar) => `Faltan ${n} ${n === 1 ? 'partida' : 'partidas'} para conquistar ${lugar}.`,
    nuevasEnTienda: l => `Nuevas cartas en la tienda: ${l}.`, premio: 'Premio:',
    recupero: l => `El enemigo recuperó ${l}.`, reconquistaUna: 'Puedes reconquistarla con una sola partida.',
    cuidado: (n, l) => `Cuidado: ${n === 1 ? 'una derrota más seguida' : `${n} derrotas más seguidas`} y el enemigo recuperará ${l}.`,
    reunefuerzas: 'Reúne fuerzas e inténtalo otra vez.', tiendaAbierta: 'Toda la tienda está abierta.',
    nuevaCronica: l => `Nueva crónica: ${l}.`,
    tallerAyuda: n => `Toca una carta para agregarla al mazo. Tienes ${n} cartas.`, copiar: '+ Copiar', borrar: 'Borrar', seguro: '¿Seguro?',
    nombre: 'Nombre', cartasMazo: (n, m) => `${n} / ${m} cartas`, mazoListo: 'Mazo listo. Es el que usarás en la campaña y en la arena.',
    tocaQuitar: 'Toca una carta de la lista para quitarla.', copiaDe: n => `${n} (copia)`, mazo: 'Mazo', tuMazo: 'Tu mazo',
    tiendaAyuda: n => `Cartas sueltas, sin sorpresas. Cada mazmorra conquistada trae cartas nuevas. Máximo ${n} copias de cada una.`,
    tiendaVacia: 'No hay nada nuevo por ahora. Conquista mazmorras para traer más cartas.', tienes: (a, b) => `Tienes ${a}/${b}`,
    porDescubrir: n => `${n} por descubrir…`, sinCronicas: 'Todavía no hay crónicas.', sinTitulo: 'Sin título',
    arenaAyuda: m => `Sin territorio en juego. Ganas 5 ${m} si vences y 1 si pierdes.`, llevas: (a, b) => `Llevas ${a} victorias en ${b} partidas.`,
    conquistaPie: 'Conquista',
    // Mesa
    tocaJugar: c => `${c}: tócala otra vez para jugarla, o toca fuera para elegir otra.`,
    pistaTactil: 'Toca una carta para verla en grande.\nTócala otra vez para jugarla. Si tocas fuera, eliges otra.',
    tu: 'Tú', tuTurno: 'Tu turno', turnoDe: n => `Turno de ${art(n)}`, preparacion: 'Tu turno · Preparación', atacando: 'Tu turno · Atacando…',
    ataqueHecho: 'Tu turno · Ataque hecho', turnoDeRival: n => `Turno de ${art(n)}…`, alAtaque: '⚔ Al ataque', terminarTurno: 'Terminar turno',
    guiaJugables: 'Juega las cartas que brillan en dorado.', guiaAtacar: c => `Toca a tus ${c} con brillo verde y elige a quién atacan.`,
    guiaListo: 'Todo listo: pulsa «Al ataque».', guiaNada: 'No queda nada por hacer: termina el turno.', guiaAtaqueHecho: 'Ataque hecho: termina el turno.',
    planTitulo: 'Plan de ataque', planQuitar: 'Toca algo del plan para quitarlo.', elRival: 'el rival',
    laMuralla: m => `la ${m}`, laFortaleza: f => `la ${f}`, muralla_rival: m => `la ${m} rival`, frente_rival: f => `el ${f} rival`,
    mano: 'Mano', mazoHud: 'Mazo',
    objetivoCarta: n => `${n}: elige el objetivo (toca fuera para cancelar).`,
    prepararla: 'prepararla (se dispara al pulsar «Al ataque»)', usarla: 'usarla', tocaOtraVez: (n, r, acc) => `${n}: ${r} Toca la carta otra vez para ${acc}.`,
    vuelveMano: n => `${n} vuelve a tu mano y recuperas su costo.`, ataqueQuitado: 'Ataque quitado del plan. Si lo vuelves a marcar, queda al final.',
    noPuedeAtacar: 'Este combatiente todavía no puede atacar (los recién jugados esperan un turno).',
    eligeAtaque: n => `${n}: elige a quién atacará. El ataque ocurre al pulsar «Al ataque».`,
    nadieAtaca: 'Nadie ataca este turno. Pulsa «Terminar turno».', ataqueTerminado: 'Ataque terminado. Pulsa «Terminar turno».',
    faltanRecursos: (n, r) => `Te faltan ${n} ${r}.`, unRecolector: r => `Solo puedes jugar un ${r} por turno.`,
    frenteLleno: f => `Tu ${f} está lleno.`, aldeaLlena: a => `Tu ${a} está llena.`, sinEspacio: e => `No caben más ${e}.`, sinObjetivo: 'No hay un objetivo válido para esta carta.',
    laUnidad: 'la unidad',
    // Registro
    rJuega: (q, c) => `${q} ${plural(q) ? 'juegan' : 'juega'} <i>${c}</i>.`, rJuegas: c => `Juegas <i>${c}</i>.`,
    rAtaca: (a, b) => `<i>${a}</i> ataca a ${b}.`, rCae: c => `<i>${c}</i> cae.`,
    rPrepara: (q, c) => `${q} ${plural(q) ? 'preparan' : 'prepara'} <i>${c}</i>.`, rPreparas: c => `Preparas <i>${c}</i>.`,
    rDispara: c => `Se dispara <i>${c}</i>.`, rDevuelve: c => `<i>${c}</i> vuelve a la mano.`, rDisparoTorre: c => `Una torre dispara a <i>${c}</i>.`,
    rPierde: c => `<i>${c}</i> se pierde: su objetivo ya no está.`,
    rSufre: (q, c) => `${q} ${plural(q) ? 'sufren' : 'sufre'} <i>${c}</i>.`, rSufres: c => `Sufres <i>${c}</i>.`,
    rMazoVacio: (q, f) => `${q} ${plural(q) ? 'no tienen' : 'no tiene'} cartas: su ${f} recibe 2 de daño.`, rMazoVacioTu: f => `No te quedan cartas: tu ${f} recibe 2 de daño.`,
    rQuema: (q, c) => `${q} ${plural(q) ? 'tienen la mano llena y pierden' : 'tiene la mano llena y pierde'} <i>${c}</i>.`, rQuemaTu: c => `Tienes la mano llena y pierdes <i>${c}</i>.`,
    rVence: (c, q) => `Termina <i>${c}</i> sobre ${art(q)}.`, ti: 'ti',
    girar: 'Gira el teléfono para jugar en horizontal', pantallaCompleta: 'Pantalla completa',
    tipos: { recolector: 'Recolector', constructor: 'Constructor', combatiente: 'Combatiente', estructura: 'Estructura', efecto: 'Efecto', maldicion: 'Maldición' },
  },
  en: {
    comenzar: 'Start', continuar: 'Continue', nuevaPartida: 'New game', seguroBorrar: 'Sure? Your saved progress will be erased',
    comoSeJuega: 'How to play', creador: 'Creator', sonidoSi: '🔊 Sound on', sonidoNo: '🔇 Sound off', otroIdioma: '🌐 Español',
    tematica: 'Theme', inicio: 'Home', volverJuegos: '← Verbo games',
    pueblo: 'The town', taller: 'Deck workshop', tienda: 'Shop', cronista: "Chronicler's house", arena: 'Arena', mapa: 'Map',
    puerta: 'Gate to the map', campana: 'Campaign', escaramuza: 'Quick match', moneda: 'coins',
    conquistadas: (n, m) => `${n}/${m}`,
    estadoConquistada: 'Conquered', estadoBloqueada: 'There is no road here yet.',
    estadoDisponible: (k, n) => `Battle ${k} of ${n}`, estadoRecuperar: 'The enemy took it back: reconquer it with a single battle.',
    rival: 'Rival', premioConquista: (c, m) => `Reward for conquering it: <b>${c}</b> and ${m}`, jugar: 'Play', alaBatalla: 'To battle',
    reconquista: 'Reconquest', partidaDe: (k, n) => `Battle ${k} of ${n}`, acto: n => `Part ${n}`,
    racha: (a, b) => `Defeats in a row: ${a}/${b}`,
    mazoNoListo: 'Your deck is not ready', arreglaloTaller: 'Fix it in the deck workshop.',
    victoria: 'Victory!', derrota: 'Defeat', conquista: 'Conquered!', reconquistaTitulo: 'Reconquered!',
    faltan: (n, lugar) => `${n} more ${n === 1 ? 'battle' : 'battles'} to conquer ${lugar}.`,
    nuevasEnTienda: l => `New cards in the shop: ${l}.`, premio: 'Reward:',
    recupero: l => `The enemy took back ${l}.`, reconquistaUna: 'You can reconquer it with a single battle.',
    cuidado: (n, l) => `Careful: ${n === 1 ? 'one more defeat in a row' : `${n} more defeats in a row`} and the enemy will take back ${l}.`,
    reunefuerzas: 'Gather your strength and try again.', tiendaAbierta: 'The whole shop is now open.',
    nuevaCronica: l => `New chronicle: ${l}.`,
    tallerAyuda: n => `Tap a card to add it to the deck. You have ${n} cards.`, copiar: '+ Copy', borrar: 'Delete', seguro: 'Sure?',
    nombre: 'Name', cartasMazo: (n, m) => `${n} / ${m} cards`, mazoListo: 'Deck ready. It is the one you will use in the campaign and the arena.',
    tocaQuitar: 'Tap a card in the list to remove it.', copiaDe: n => `${n} (copy)`, mazo: 'Deck', tuMazo: 'Your deck',
    tiendaAyuda: n => `Single cards, no surprises. Every conquered dungeon brings new cards. Up to ${n} copies of each.`,
    tiendaVacia: 'Nothing new for now. Conquer dungeons to bring more cards.', tienes: (a, b) => `You have ${a}/${b}`,
    porDescubrir: n => `${n} still to discover…`, sinCronicas: 'No chronicles yet.', sinTitulo: 'Untitled',
    arenaAyuda: m => `No territory at stake. You win 5 ${m} if you win and 1 if you lose.`, llevas: (a, b) => `${a} wins in ${b} battles so far.`,
    conquistaPie: 'Conquest',
    tocaJugar: c => `${c}: tap it again to play it, or tap elsewhere to choose another.`,
    pistaTactil: 'Tap a card to see it up close.\nTap it again to play it. Tap elsewhere to choose another.',
    tu: 'You', tuTurno: 'Your turn', turnoDe: n => `${pos(n)} turn`, preparacion: 'Your turn · Preparation', atacando: 'Your turn · Attacking…',
    ataqueHecho: 'Your turn · Attack done', turnoDeRival: n => `${pos(n)} turn…`, alAtaque: '⚔ Attack!', terminarTurno: 'End turn',
    guiaJugables: 'Play the cards that glow gold.', guiaAtacar: c => `Tap your ${c} that glow green and choose whom they attack.`,
    guiaListo: 'All set: press «Attack!».', guiaNada: 'Nothing left to do: end your turn.', guiaAtaqueHecho: 'Attack done: end your turn.',
    planTitulo: 'Battle plan', planQuitar: 'Tap something in the plan to remove it.', elRival: 'the rival',
    laMuralla: m => `the ${m}`, laFortaleza: f => `the ${f}`, muralla_rival: m => `the rival ${m}`, frente_rival: f => `the rival ${f}`,
    mano: 'Hand', mazoHud: 'Deck',
    objetivoCarta: n => `${n}: choose the target (tap elsewhere to cancel).`,
    prepararla: 'prepare it (it fires when you press «Attack!»)', usarla: 'use it', tocaOtraVez: (n, r, acc) => `${n}: ${r} Tap the card again to ${acc}.`,
    vuelveMano: n => `${n} returns to your hand and you get its cost back.`, ataqueQuitado: 'Attack removed from the plan. If you mark it again, it goes last.',
    noPuedeAtacar: 'This fighter cannot attack yet (newly played ones wait one turn).',
    eligeAtaque: n => `${n}: choose whom it will attack. The attack happens when you press «Attack!».`,
    nadieAtaca: 'Nobody attacks this turn. Press «End turn».', ataqueTerminado: 'Attack finished. Press «End turn».',
    faltanRecursos: (n, r) => `You need ${n} more ${r}.`, unRecolector: r => `You can only play one ${r} per turn.`,
    frenteLleno: f => `Your ${f} is full.`, aldeaLlena: a => `Your ${a} is full.`, sinEspacio: e => `No room for more ${e}.`, sinObjetivo: 'There is no valid target for this card.',
    laUnidad: 'the unit',
    rJuega: (q, c) => `${q} ${vb(q, 'play')} <i>${c}</i>.`, rJuegas: c => `You play <i>${c}</i>.`,
    rAtaca: (a, b) => `<i>${a}</i> attacks ${b}.`, rCae: c => `<i>${c}</i> falls.`,
    rPrepara: (q, c) => `${q} ${vb(q, 'prepare')} <i>${c}</i>.`, rPreparas: c => `You prepare <i>${c}</i>.`,
    rDispara: c => `<i>${c}</i> fires.`, rDevuelve: c => `<i>${c}</i> returns to the hand.`, rDisparoTorre: c => `A tower shoots at <i>${c}</i>.`,
    rPierde: c => `<i>${c}</i> is lost: its target is gone.`,
    rSufre: (q, c) => `${q} ${vb(q, 'suffer')} <i>${c}</i>.`, rSufres: c => `You suffer <i>${c}</i>.`,
    rMazoVacio: (q, f) => `${q} ${vb(q, 'have', 'has')} no cards left: their ${f} takes 2 damage.`, rMazoVacioTu: f => `You have no cards left: your ${f} takes 2 damage.`,
    rQuema: (q, c) => `${q} ${vb(q, 'have', 'has')} a full hand and ${vb(q, 'lose')} <i>${c}</i>.`, rQuemaTu: c => `Your hand is full and you lose <i>${c}</i>.`,
    rVence: (c, q) => `<i>${c}</i> ends on ${q.replace(/^The /, "the ")}.`, ti: 'you',
    girar: 'Turn your phone sideways to play', pantallaCompleta: 'Full screen',
    tipos: { recolector: 'Gatherer', constructor: 'Builder', combatiente: 'Fighter', estructura: 'Structure', efecto: 'Effect', maldicion: 'Curse' },
  },
};

export function t(clave, ...args) {
  const v = TEXTOS[idioma()][clave] ?? TEXTOS.es[clave];
  return typeof v === 'function' ? v(...args) : v;
}
