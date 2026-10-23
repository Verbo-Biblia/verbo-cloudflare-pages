// Notas de pronunciación. Cada una aparece la primera vez que una lección la necesita
// (bloque {t:'nota', v:'<id>'}) y todas juntas en la guía de pronunciación.
// Los ejemplos son los del libro; las explicaciones son propias.
const FONETICA = {
  leer: {
    titulo: 'Cómo leer la pronunciación',
    texto: 'Debajo de cada palabra inglesa va su pronunciación escrita con letras del español. Léela tal como suena en español, con tres detalles:',
    ejemplos: [
      ['Hello', 'jeloU', 'Hola (con respeto)', 'Las letras pálidas y pequeñas se dicen apenas, casi sin voz: la «u» final de «jelou» casi no se oye.'],
      ['Hi', 'jái', 'Hola (entre amigos)', 'La letra con tilde lleva el golpe de voz: «JÁI».'],
      ['Music', 'miúzic', 'Música', 'La «z» no es la z de España: es una «s» que zumba, como una abeja. Si te sale «s», igual se entiende.'],
    ],
  },
  j: {
    titulo: 'La j es suave',
    texto: 'La «j» de la pronunciación no raspa la garganta como en «jamón»: es un soplo suave, como cuando empañas un vidrio con el aliento.',
    ejemplos: [['Hospital', 'jóspitAl', 'Hospital'], ['Hotel', 'joUtél', 'Hotel']],
  },
  calma: {
    titulo: 'Sin prisa con la pronunciación',
    texto: 'Al principio tu pronunciación no será perfecta, y no importa. Lección tras lección irás recibiendo indicaciones para afinarla. No te detengas: di cada palabra lo mejor que puedas, en voz alta, y toca 🔊 para oírla.',
  },
  y: {
    titulo: 'La y fuerte',
    texto: 'En la pronunciación, la «y» es siempre una consonante firme, como en «yanqui», «yegua» o «yugos», nunca una «i» ni una «ll» suave. **También al final de la palabra**: en spány o stréiny no termines en «i»; cierra con esa «y» firme, como si fueras a decir «yo». Es el sonido de la j inglesa de John y de June.',
    ejemplos: [['Sponge', 'spány', 'Esponja'], ['Strange', 'stréiny', 'Extraño']],
  },
  sh: {
    titulo: 'La sh',
    texto: 'Las letras sh (en negrita) suenan como cuando pides silencio con el dedo en los labios: «shhh». Es el sonido de WaSHington, SHanghai o SHakespeare.',
    ejemplos: [['Shock', 'SHok', 'Choque, golpe']],
  },
  dz: {
    titulo: 'La th suave (sonido DZ)',
    texto: 'La «th» de they, that o the se parece mucho a la **d suave** que ya dices en español entre vocales: la de «na**d**a», «ca**d**a» o «to**d**o». Dila así, pero con la punta de la lengua un poco más afuera, rozando los dientes de arriba, y dejando salir la voz.\n\nEn la pronunciación la verás como una **d subrayada**. Mientras aprendes, una «d» normal también se entiende.',
    ejemplos: [['They', 'ëéi', 'Ellos, ellas'], ['That', 'ëát', 'Eso, ese, aquel, que']],
  },
  doble: {
    titulo: 'Letras dobles',
    texto: 'Si en la pronunciación ves dos letras iguales seguidas, no las digas dos veces: es un solo sonido, estirado.',
    ejemplos: [['Tree', 'tríi', 'Árbol', 'Una sola «i», larga: «trííí».'], ['Father', 'fáaëeR', 'Padre']],
  },
  z: {
    titulo: 'La th fuerte',
    texto: 'La otra «th», la de thin o three, no es una «s». Pon la punta de la lengua entre los dientes y sopla aire, sin voz, como cuando en España dicen «**c**ielo» o «**z**apato». En la pronunciación la verás como una **z subrayada**.\n\nLa **z sin subrayar** (is, music) es otro sonido: una «s» que zumba, como una abeja. Si te sale como «s», igual se entiende.',
    ejemplos: [['Thin', 'þin', 'Delgado'], ['Thursday', 'þéeRzdEi', 'Jueves']],
  },
  gui: {
    titulo: 'gui y gue',
    texto: 'En «guív» y «guét» la u no suena: la g es la de «guía» y la de «guerra».',
    ejemplos: [['Give', 'guív', 'Dar'], ['Get', 'guét', 'Conseguir']],
  },
};
