// Contenido de «Toca y aprende»: cada sección con sus botones, en español e inglés. Las imágenes son de Codex
// (arte/codex/*.png → img/*.webp en armar.sh); mientras falta una, el botón muestra el emoji de reserva.
// La voz de cada botón es voces/{es,en}/<seccion>_<id>.mp3 (herramientas/voces.sh); si falta, habla el navegador.

export const FRUTAS = [
  { id: 'manzana', es: 'Manzana', en: 'Apple', emoji: '🍎' },
  { id: 'platano', es: 'Plátano', en: 'Banana', emoji: '🍌' },
  { id: 'fresa', es: 'Fresa', en: 'Strawberry', emoji: '🍓' },
  { id: 'naranja', es: 'Naranja', en: 'Orange', emoji: '🍊' },
  { id: 'uvas', es: 'Uvas', en: 'Grapes', emoji: '🍇' },
  { id: 'sandia', es: 'Sandía', en: 'Watermelon', emoji: '🍉' },
  { id: 'pina', es: 'Piña', en: 'Pineapple', emoji: '🍍' },
  { id: 'pera', es: 'Pera', en: 'Pear', emoji: '🍐' },
  { id: 'cerezas', es: 'Cerezas', en: 'Cherries', emoji: '🍒' },
  { id: 'limon', es: 'Limón', en: 'Lemon', emoji: '🍋' },
  { id: 'mango', es: 'Mango', en: 'Mango', emoji: '🥭' },
  { id: 'durazno', es: 'Durazno', en: 'Peach', emoji: '🍑' },
  { id: 'kiwi', es: 'Kiwi', en: 'Kiwi', emoji: '🥝' },
];

export const BEBE = [
  { id: 'biberon', es: 'Biberón', en: 'Bottle', emoji: '🍼' },
  { id: 'chupete', es: 'Chupete', en: 'Pacifier', emoji: '👶' },
  { id: 'sonajero', es: 'Sonajero', en: 'Rattle', emoji: '🪇' },
  { id: 'osito', es: 'Osito', en: 'Teddy bear', emoji: '🧸' },
  { id: 'pelota', es: 'Pelota', en: 'Ball', emoji: '⚽' },
  { id: 'zapatitos', es: 'Zapatitos', en: 'Little shoes', emoji: '👟' },
  { id: 'cobija', es: 'Cobija', en: 'Blanket', emoji: '🛏️' },
  { id: 'cuna', es: 'Cuna', en: 'Crib', emoji: '🛏️' },
  { id: 'patito', es: 'Patito de hule', en: 'Rubber duck', emoji: '🦆' },
  { id: 'cubos', es: 'Cubos', en: 'Blocks', emoji: '🧱' },
  { id: 'babero', es: 'Babero', en: 'Bib', emoji: '👕' },
  { id: 'cochecito', es: 'Cochecito', en: 'Stroller', emoji: '👶' },
];

// Música: cada instrumento suena con su frase (sonidos/inst/<id>.ogg, del banco General MIDI del Compositor).
export const MUSICA = [
  { id: 'piano', es: 'Piano', en: 'Piano', emoji: '🎹' },
  { id: 'guitarra', es: 'Guitarra', en: 'Guitar', emoji: '🎸' },
  { id: 'violin', es: 'Violín', en: 'Violin', emoji: '🎻' },
  { id: 'trompeta', es: 'Trompeta', en: 'Trumpet', emoji: '🎺' },
  { id: 'flauta', es: 'Flauta', en: 'Flute', emoji: '🪈' },
  { id: 'tambor', es: 'Tambor', en: 'Drum', emoji: '🥁' },
  { id: 'xilofono', es: 'Xilófono', en: 'Xylophone', emoji: '🎼' },
  { id: 'maracas', es: 'Maracas', en: 'Maracas', emoji: '🪇' },
  { id: 'pandereta', es: 'Pandereta', en: 'Tambourine', emoji: '🪘' },
  { id: 'campanas', es: 'Campanitas', en: 'Bells', emoji: '🔔' },
];

// Dios y yo: cada idea con una imagen que la muestra de verdad (amor no es un corazón: es un abrazo).
export const DIOS = [
  { id: 'creo', es: 'Dios lo creó', en: 'God made it', emoji: '🌄',
    frase: { es: 'Dios hizo todo: el sol, las flores y a ti.', en: 'God made everything: the sun, the flowers, and you.' } },
  { id: 'jesus', es: 'Jesús', en: 'Jesus', emoji: '🙂',
    frase: { es: 'Jesús ama a los niños.', en: 'Jesus loves the little children.' } },
  { id: 'amor', es: 'Amor', en: 'Love', emoji: '🤗',
    frase: { es: 'Amor es un abrazo.', en: 'Love is a hug.' } },
  { id: 'luz', es: 'Luz', en: 'Light', emoji: '🪔',
    frase: { es: 'Jesús es la luz del mundo.', en: 'Jesus is the light of the world.' } },
  { id: 'orar', es: 'Orar', en: 'Pray', emoji: '🙏',
    frase: { es: 'Orar es hablar con Dios.', en: 'Praying is talking with God.' } },
  { id: 'gracias', es: 'Gracias', en: 'Thank you', emoji: '🍞',
    frase: { es: 'Gracias, Dios, por la comida.', en: 'Thank you, God, for our food.' } },
  { id: 'compartir', es: 'Compartir', en: 'Share', emoji: '🥖',
    frase: { es: 'Compartir es dar con alegría.', en: 'Sharing is giving with joy.' } },
  { id: 'ayudar', es: 'Ayudar', en: 'Help', emoji: '🤝',
    frase: { es: 'Ayudar es dar la mano.', en: 'Helping is lending a hand.' } },
  { id: 'perdon', es: 'Perdonar', en: 'Forgive', emoji: '🤝',
    frase: { es: 'Perdonar es volver a ser amigos.', en: 'Forgiving is being friends again.' } },
  { id: 'alegria', es: 'Alegría', en: 'Joy', emoji: '😄',
    frase: { es: 'Con Dios cantamos de alegría.', en: 'With God we sing for joy.' } },
  { id: 'biblia', es: 'La Biblia', en: 'The Bible', emoji: '📖',
    frase: { es: 'La Biblia es la Palabra de Dios.', en: 'The Bible is God’s Word.' } },
  { id: 'familia', es: 'Familia', en: 'Family', emoji: '👨‍👩‍👧',
    frase: { es: 'Mi familia es un regalo de Dios.', en: 'My family is a gift from God.' } },
  { id: 'cuida', es: 'Dios me cuida', en: 'God cares for me', emoji: '🌙',
    frase: { es: 'Dios me cuida de día y de noche.', en: 'God takes care of me day and night.' } },
];

// Imágenes que solo usan las letras (las demás se toman de las otras secciones).
export const COSAS = {
  avion: { es: 'avión', en: 'airplane', emoji: '✈️' }, barco: { es: 'barco', en: 'boat', emoji: '⛵' },
  casa: { es: 'casa', en: 'house', emoji: '🏠' }, dado: { es: 'dado', en: 'dice', emoji: '🎲' },
  estrella: { es: 'estrella', en: 'star', emoji: '⭐' }, flor: { es: 'flor', en: 'flower', emoji: '🌼' },
  globo: { es: 'globo', en: 'balloon', emoji: '🎈' }, helado: { es: 'helado', en: 'ice cream', emoji: '🍦' },
  iglu: { es: 'iglú', en: 'igloo', emoji: '🧊' }, jugo: { es: 'jugo', en: 'juice', emoji: '🧃' },
  luna: { es: 'luna', en: 'moon', emoji: '🌙' }, nube: { es: 'nube', en: 'cloud', emoji: '☁️' },
  queso: { es: 'queso', en: 'cheese', emoji: '🧀' }, robot: { es: 'robot', en: 'robot', emoji: '🤖' },
  sol: { es: 'sol', en: 'sun', emoji: '☀️' }, tren: { es: 'tren', en: 'train', emoji: '🚂' },
  yoyo: { es: 'yoyo', en: 'yo-yo', emoji: '🪀' }, wafle: { es: 'wafle', en: 'waffle', emoji: '🧇' },
  pinata: { es: 'piñata', en: 'piñata', emoji: '🪅' }, carro: { es: 'carro', en: 'car', emoji: '🚗' },
  huevo: { es: 'huevo', en: 'egg', emoji: '🥚' }, nido: { es: 'nido', en: 'nest', emoji: '🪺' },
  paraguas: { es: 'paraguas', en: 'umbrella', emoji: '☂️' }, calabacin: { es: 'calabacín', en: 'zucchini', emoji: '🥒' },
};

// Letra → imagen de su palabra (en piñata la Ñ va en medio: «Ñ, como en piñata»).
export const LETRAS = {
  es: [['A', 'avion'], ['B', 'barco'], ['C', 'casa'], ['D', 'dado'], ['E', 'estrella'], ['F', 'flor'], ['G', 'globo'],
    ['H', 'helado'], ['I', 'iglu'], ['J', 'jugo'], ['K', 'kiwi'], ['L', 'luna'], ['M', 'manzana'], ['N', 'nube'],
    ['Ñ', 'pinata'], ['O', 'osito'], ['P', 'pelota'], ['Q', 'queso'], ['R', 'robot'], ['S', 'sol'], ['T', 'tren'],
    ['U', 'uvas'], ['V', 'violin'], ['W', 'wafle'], ['X', 'xilofono'], ['Y', 'yoyo'], ['Z', 'zapatitos']],
  en: [['A', 'avion'], ['B', 'barco'], ['C', 'carro'], ['D', 'dado'], ['E', 'huevo'], ['F', 'flor'], ['G', 'guitarra'],
    ['H', 'casa'], ['I', 'iglu'], ['J', 'jugo'], ['K', 'kiwi'], ['L', 'limon'], ['M', 'luna'], ['N', 'nido'],
    ['O', 'naranja'], ['P', 'pina'], ['Q', 'cobija'], ['R', 'robot'], ['S', 'sol'], ['T', 'tren'], ['U', 'paraguas'],
    ['V', 'violin'], ['W', 'sandia'], ['X', 'xilofono'], ['Y', 'yoyo'], ['Z', 'calabacin']],
};
// palabra de la letra cuando no es la del objeto en sí (Q de quilt, no de blanket; zapato, no zapatitos)
export const PALABRA_LETRA = { en: { cobija: 'quilt', luna: 'moon', casa: 'house', sandia: 'watermelon' }, es: { zapatitos: 'zapato', osito: 'oso' } };

export const COLORES = [
  { id: 'rojo', es: 'Rojo', en: 'Red', hex: '#e8443a' },
  { id: 'azul', es: 'Azul', en: 'Blue', hex: '#3a7be8' },
  { id: 'amarillo', es: 'Amarillo', en: 'Yellow', hex: '#ffd23a' },
  { id: 'verde', es: 'Verde', en: 'Green', hex: '#45b84a' },
  { id: 'anaranjado', es: 'Anaranjado', en: 'Orange', hex: '#ff8f2e' },
  { id: 'morado', es: 'Morado', en: 'Purple', hex: '#8e4fd1' },
  { id: 'rosado', es: 'Rosado', en: 'Pink', hex: '#ff7eb6' },
  { id: 'cafe', es: 'Café', en: 'Brown', hex: '#9a6236' },
  { id: 'negro', es: 'Negro', en: 'Black', hex: '#2b2b33' },
  { id: 'blanco', es: 'Blanco', en: 'White', hex: '#ffffff' },
];

export const FORMAS = [
  { id: 'circulo', es: 'Círculo', en: 'Circle', hex: '#ff6b6b' },
  { id: 'cuadrado', es: 'Cuadrado', en: 'Square', hex: '#4d9de0' },
  { id: 'triangulo', es: 'Triángulo', en: 'Triangle', hex: '#7bc950' },
  { id: 'estrella', es: 'Estrella', en: 'Star', hex: '#ffc93c' },
  { id: 'corazon', es: 'Corazón', en: 'Heart', hex: '#ff7eb6' },
  { id: 'rectangulo', es: 'Rectángulo', en: 'Rectangle', hex: '#a06cd5' },
  { id: 'ovalo', es: 'Óvalo', en: 'Oval', hex: '#ff9f43' },
  { id: 'rombo', es: 'Rombo', en: 'Diamond', hex: '#26c6b9' },
];

export const NUMEROS = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
export const NUMEROS_EN = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Frases cortas que dice la voz (voces/<idioma>/frase_<clave>.mp3)
export const FRASES = {
  muybien: { es: '¡Muy bien!', en: 'Great job!' },
  bravo: { es: '¡Bravo!', en: 'Hooray!' },
  excelente: { es: '¡Excelente!', en: 'Excellent!' },
  lologaste: { es: '¡Lo lograste!', en: 'You did it!' },
  otravez: { es: 'Mmm, intenta otra vez.', en: 'Hmm, try again.' },
  cuantos: { es: '¿Cuántos hay?', en: 'How many are there?' },
  conmigo: { es: '¡Toca conmigo! Sigue la luz.', en: 'Play with me! Follow the light.' },
  cancion: { es: '¡Tocaste la canción!', en: 'You played the song!' },
  hola: { es: '¡Hola! Toca un botón.', en: 'Hi! Tap a button.' },
};

// Secciones del menú (orden, color del botón y su imagen de portada)
export const SECCIONES = [
  { id: 'numeros', es: 'Números', en: 'Numbers', color: '#ff8f2e', icono: '123' },
  { id: 'letras', es: 'Letras', en: 'Letters', color: '#3a7be8', icono: 'ABC' },
  { id: 'frutas', es: 'Frutas', en: 'Fruits', color: '#e8443a', img: 'manzana', emoji: '🍎' },
  { id: 'colores', es: 'Colores', en: 'Colors', color: '#8e4fd1', icono: 'colores' },
  { id: 'formas', es: 'Formas', en: 'Shapes', color: '#26c6b9', icono: 'formas' },
  { id: 'bebe', es: 'Cosas de bebé', en: 'Baby things', color: '#ff7eb6', img: 'osito', emoji: '🧸' },
  { id: 'musica', es: 'Música', en: 'Music', color: '#ffb020', img: 'tambor', emoji: '🥁' },
  { id: 'dios', es: 'Dios y yo', en: 'God and me', color: '#45b84a', img: 'amor', emoji: '🤗' },
  { id: 'burbujas', es: 'Burbujas', en: 'Bubbles', color: '#4fc3f7', icono: 'burbujas' },
  { id: 'globos', es: 'Globos', en: 'Balloons', color: '#f06292', icono: 'globos' },
];
