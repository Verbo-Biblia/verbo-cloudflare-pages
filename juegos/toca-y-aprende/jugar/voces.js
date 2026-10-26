// Todo lo que dice la voz: clave → { es, en }. Lo usan el juego (voces/<idioma>/<clave>.mp3, o la voz del navegador
// si falta) y herramientas/voces_lista.mjs, que le pasa la lista a Chatterbox.
import { FRUTAS, BEBE, MUSICA, DIOS, COLORES, FORMAS, NUMEROS, NUMEROS_EN, LETRAS, COSAS, PALABRA_LETRA, FRASES, SECCIONES } from './datos.js';

const NOMBRE_LETRA = {
  es: { A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'efe', G: 'ge', H: 'hache', I: 'i', J: 'jota', K: 'ka', L: 'ele',
    M: 'eme', N: 'ene', 'Ñ': 'eñe', O: 'o', P: 'pe', Q: 'cu', R: 'erre', S: 'ese', T: 'te', U: 'u', V: 'uve', W: 'uve doble',
    X: 'equis', Y: 'ye', Z: 'zeta' },
  en: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', H: 'H', I: 'I', J: 'J', K: 'K', L: 'L', M: 'M', N: 'N',
    O: 'O', P: 'P', Q: 'Q', R: 'R', S: 'S', T: 'T', U: 'U', V: 'V', W: 'W', X: 'X', Y: 'Y', Z: 'Z' },
};
// artículo en español de cada cosa (para «¿Dónde está la fresa?»)
const ART = {
  manzana: 'la', platano: 'el', fresa: 'la', naranja: 'la', uvas: 'las', sandia: 'la', pina: 'la', pera: 'la',
  cerezas: 'las', limon: 'el', mango: 'el', durazno: 'el', kiwi: 'el',
  biberon: 'el', chupete: 'el', sonajero: 'el', osito: 'el', pelota: 'la', zapatitos: 'los', cobija: 'la', cuna: 'la',
  patito: 'el', cubos: 'los', babero: 'el', cochecito: 'el',
  piano: 'el', guitarra: 'la', violin: 'el', trompeta: 'la', flauta: 'la', tambor: 'el', xilofono: 'el',
  maracas: 'las', pandereta: 'la', campanas: 'las', estrella: 'la',
};
const PLURAL_EN = new Set(['uvas', 'cerezas', 'zapatitos', 'cubos', 'maracas', 'campanas']);

export const claveLetra = (L) => (L === 'Ñ' ? 'enie' : L.toLowerCase());

// cosa (de cualquier sección) por id: { es, en, emoji }
// voz del nombre de una cosa (la de su sección, o cosa_<id> si solo la usan las letras)
export function vozCosa(id) {
  for (const [sec, l] of [['frutas', FRUTAS], ['bebe', BEBE], ['musica', MUSICA]]) if (l.some((x) => x.id === id)) return `${sec}_${id}`;
  return `cosa_${id}`;
}
export function cosa(id) {
  return [...FRUTAS, ...BEBE, ...MUSICA].find((x) => x.id === id) || COSAS[id];
}

function construir() {
  const v = {};
  const poner = (k, es, en) => { v[k] = { es, en }; };
  const dondeEs = (art, nombre) => `¿Dónde ${art.endsWith('s') ? 'están' : 'está'} ${art} ${nombre.toLowerCase()}?`;
  const dondeEn = (id, nombre) => `Where ${PLURAL_EN.has(id) ? 'are' : 'is'} the ${nombre.toLowerCase()}?`;
  for (const [sec, lista] of [['frutas', FRUTAS], ['bebe', BEBE], ['musica', MUSICA]]) for (const x of lista) {
    poner(`${sec}_${x.id}`, x.es, x.en);
    poner(`donde_${sec}_${x.id}`, dondeEs(ART[x.id], x.es), dondeEn(x.id, x.en));
  }
  for (const x of DIOS) { poner(`dios_${x.id}`, x.es, x.en); poner(`diosf_${x.id}`, x.frase.es, x.frase.en); }
  for (const x of COLORES) {
    poner(`colores_${x.id}`, x.es, x.en);
    poner(`donde_colores_${x.id}`, `¿Dónde está el ${x.es.toLowerCase()}?`, `Where is ${x.en.toLowerCase()}?`);
    poner(`globo_${x.id}`, `¡Toca el globo ${x.es.toLowerCase()}!`, `Pop the ${x.en.toLowerCase()} balloon!`);
  }
  for (const x of FORMAS) {
    poner(`formas_${x.id}`, x.es, x.en);
    poner(`donde_formas_${x.id}`, dondeEs(ART[x.id] || 'el', x.es), dondeEn(x.id, x.en));
  }
  NUMEROS.forEach((n, i) => {
    const es = n[0].toUpperCase() + n.slice(1), en = NUMEROS_EN[i][0].toUpperCase() + NUMEROS_EN[i].slice(1);
    poner(`num_${i + 1}`, es, en);
    poner(`donde_numeros_${i + 1}`, `¿Dónde está el ${n}?`, `Where is number ${NUMEROS_EN[i]}?`);
  });
  for (const lang of ['es', 'en']) for (const [L, id] of LETRAS[lang]) {
    const k = claveLetra(L), c = cosa(id), palabra = PALABRA_LETRA[lang][id] || c[lang].toLowerCase(), nom = NOMBRE_LETRA[lang][L];
    const frase = lang === 'es' ? (L === 'Ñ' ? 'Eñe, como en piñata.' : `${nom[0].toUpperCase() + nom.slice(1)}, de ${palabra}.`) : `${L} is for ${palabra}.`;
    const donde = lang === 'es' ? `¿Dónde está la ${nom}?` : `Where is the letter ${L}?`;
    const sola = lang === 'es' ? nom[0].toUpperCase() + nom.slice(1) : L;   // solo el nombre de la letra
    for (const [kk, t] of [[`letra_${k}`, frase], [`letrasola_${k}`, sola], [`donde_letras_${k}`, donde]]) { v[kk] ??= { es: null, en: null }; v[kk][lang] = t; }
  }
  for (const [id, c] of Object.entries(COSAS)) poner(`cosa_${id}`, c.es[0].toUpperCase() + c.es.slice(1), c.en[0].toUpperCase() + c.en.slice(1));
  for (const [k, f] of Object.entries(FRASES)) poner(`frase_${k}`, f.es, f.en);
  for (const s of SECCIONES) poner(`sec_${s.id}`, s.es, s.en);
  poner('sec_xilo', 'Xilófono de colores', 'Rainbow xylophone');
  return v;
}
export const VOCES = construir();
