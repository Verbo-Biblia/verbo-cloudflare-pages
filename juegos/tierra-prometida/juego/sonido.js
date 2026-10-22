// Efectos de sonido de la base (fijos para todas las temáticas). Se pueden silenciar; la elección se recuerda.

const CARPETA = new URL('./sonidos/', import.meta.url).href;
const SONIDOS = {
  jugar: ['jugar-1.mp3', 'jugar-2.mp3', 'jugar-3.mp3'],
  robar: ['diamantes-1.mp3', 'diamantes-2.mp3'],
  barajar: ['reiniciar-1.mp3'],
  mano: ['comodin-1.mp3'],
  descartar: ['descartar-1.mp3', 'descartar-2.mp3', 'descartar-3.mp3'],
  preparar: ['drawKnife1.ogg', 'drawKnife2.ogg'],
  efectoListo: ['bloqueo-1.mp3', 'chain_01.ogg'],
  quitar: ['ceder-1.mp3'],
  recurso: ['reclutar-1.mp3'],
  confirmar: ['corazones-1.mp3'],
  avance: ['victoriaParcial-1.mp3'],
  combo: ['combo-1.mp3'],
  enemigo: ['nuevaEnemiga-1.mp3'],
  defensa: ['defensa-1.mp3', 'defensa-2.mp3'],
  contraataque: ['contraataque-1.mp3', 'contraataque-2.mp3'],
  vidrio: ['inmunidad-1.mp3', 'inmunidad-2.mp3'],
  metal: ['clicMetalico-1.mp3'],
  seleccion: ['seleccion-1.mp3'],
  cancelar: ['cancelar-1.mp3'],
  error: ['error-1.mp3'],
  ataque: ['espada_aire.ogg', 'st_espada.mp3'],
  golpe: ['espada_corte.ogg', 'st_golpe.mp3', 'st_punio.mp3', 'impacto-1.mp3', 'impacto-2.mp3', 'treboles-1.mp3', 'treboles-2.mp3'],
  fortaleza: ['escudo_impacto.ogg'],
  murallaSube: ['stones_01.ogg', 'stones_02.ogg', 'item_stone_01.ogg'],
  edificio: ['item_wood_01.ogg', 'wood_01.ogg', 'impactWood_medium_000.ogg'],
  murallaCae: ['bfh1_breaking_01.ogg', 'st_derrumbe.mp3', 'impactMining_000.ogg'],
  cae: ['bfh1_falling_01.ogg'],
  hechizo: ['hechizo_lanzar.ogg', 'st_tactica.mp3'],
  afliccion: ['st_afliccion.mp3', 'spell_fire_01.ogg'],
  trueno: ['st_trueno.mp3'],
  tierra: ['st_tierra.mp3'],
  cura: ['bendicion.ogg', 'st_cura.mp3'],
  escudo: ['toque_luz.ogg'],
  flecha: ['flecha_vuelo.mp3'],
  monedas: ['monedas.ogg', 'item_coins_01.ogg', 'item_coins_02.ogg', 'handleCoins2.ogg'],
  premio: ['item_gem_01.ogg', 'impactBell_heavy_001.ogg'],
  boton: ['click1.ogg'],
  pasar: ['rollover2.ogg'],
  pagina: ['book_01.ogg'],
  victoria: ['victoria-1.mp3'],
  derrota: ['derrota-1.mp3'],
};
const VOLUMEN = { golpe: 0.6, fortaleza: 0.7, murallaCae: 0.6, cae: 0.5, toque_luz: 0.4, escudo: 0.4, robar: 0.5 };

let activo = true;
try { activo = localStorage.getItem('baseCartas.sonido') !== 'no'; } catch {}
const cache = {};
let ultimo = {};

export function sonar(nombre) {
  if (!activo || !SONIDOS[nombre]) return;
  // Evita que el mismo sonido se amontone (p. ej. varias chispas a la vez).
  const ahora = performance.now();
  if (ahora - (ultimo[nombre] || 0) < 90) return;
  ultimo[nombre] = ahora;
  const lista = SONIDOS[nombre];
  const archivo = lista[Math.floor(Math.random() * lista.length)];
  const base = (cache[archivo] ||= new Audio(CARPETA + archivo));
  const a = base.cloneNode();
  a.volume = VOLUMEN[nombre] ?? 0.8;
  a.play().catch(() => {});
}

export const sonidoActivo = () => activo;

export function alternarSonido() {
  activo = !activo;
  try { localStorage.setItem('baseCartas.sonido', activo ? 'si' : 'no'); } catch {}
  return activo;
}

// Sonidos de los eventos del motor de reglas.
export function sonarEventos(eventos) {
  for (const e of eventos) {
    switch (e.tipo) {
      case 'juega': sonar('jugar'); break;
      case 'entra': if (e.zona === 'estructuras') sonar('edificio'); break;
      case 'turno': sonar(e.j === 0 ? 'mano' : 'enemigo'); break;
      case 'declara': sonar('preparar'); break;
      case 'prepara': sonar('efectoListo'); break;
      case 'devuelve': sonar('quitar'); break;
      case 'retira': sonar('descartar'); break;
      case 'recursos': if (e.j === 0) sonar('recurso'); break;
      case 'refuerzo': sonar('combo'); break;
      case 'quema': case 'mazoVacio': sonar('descartar'); break;
      case 'roba': if (e.j === 0) sonar('robar'); break;
      case 'ataca': sonar('ataque'); break;
      case 'daño': sonar('golpe'); break;
      case 'dañoFortaleza': sonar('fortaleza'); break;
      case 'muralla': sonar(e.n > 0 ? 'murallaSube' : 'murallaCae'); break;
      case 'muere': sonar('cae'); break;
      case 'dispara': sonar('hechizo'); break;
      case 'maldicion': sonar('afliccion'); break;
      case 'cura': sonar('cura'); break;
      case 'vence': sonar('vidrio'); break;
      case 'disparo': sonar('flecha'); break;
      case 'victoria': sonar(e.j === 0 ? 'victoria' : 'derrota'); break;
    }
  }
}
