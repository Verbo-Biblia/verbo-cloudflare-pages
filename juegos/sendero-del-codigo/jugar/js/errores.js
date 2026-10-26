// Traduce los errores de Python a una explicación sencilla y una pista, en el idioma del jugador.
const CONOCIDOS = ['print', 'input', 'int', 'str', 'float', 'bool', 'len', 'type', 'round', 'range', 'list', 'dict',
  'True', 'False', 'None', 'if', 'else', 'elif', 'for', 'while', 'def', 'return', 'import', 'sorted', 'sum', 'max', 'min'];

/** error: {tipo, mensaje, linea, texto} del arnés · t: función de textos · codigo: el programa entero. */
export function explicar(error, t) {
  const E = (k, v) => t('errores.' + k, v);
  const P = (k, v) => t('errores.pistas.' + k, v);
  const { tipo, mensaje = '', texto = '' } = error;
  let explicacion = E(tipo in DESCRIPCION ? tipo : 'otro');
  let pista = '';

  if (tipo === 'SyntaxError') {
    if (/unterminated string|EOL while scanning|unterminated triple/.test(mensaje)) pista = P('comillas_abiertas');
    else if (/was never closed/.test(mensaje)) pista = P('parentesis_abierto');
    else if (/unmatched '\)'/.test(mensaje)) pista = P('parentesis_sobra');
    else if (/Missing parentheses in call to 'print'/.test(mensaje)) pista = P('print_sin_parentesis');
    else if (/forgot a comma/.test(mensaje)) pista = P('falta_coma');
    else if (/expected ':'/.test(mensaje)) pista = P('dos_puntos');
    else if (/^\s*print\s+["'\w]/.test(texto)) pista = P('print_sin_parentesis');
    else pista = P('generico_sintaxis');
  } else if (tipo === 'IndentationError') {
    pista = /unexpected indent/.test(mensaje) ? P('sangria_inesperada') : P('sangria_falta');
  } else if (tipo === 'NameError') {
    const nombre = (mensaje.match(/name '([^']+)'/) || [])[1] || '?';
    explicacion = E('NameError', { nombre });
    const correcto = CONOCIDOS.find(c => c.toLowerCase() === nombre.toLowerCase() && c !== nombre);
    if (correcto) pista = P('mayusculas', { correcto, nombre });
    else if (/^[A-ZÁÉÍÓÚÑ]/.test(nombre) || new RegExp('print\\(\\s*' + nombre + '\\b').test(texto))
      pista = P('texto_sin_comillas', { nombre });
    else pista = P('nombre_no_definido');
  } else if (tipo === 'TypeError') {
    if (/can only concatenate str|unsupported operand type.*'str'|must be str, not/.test(mensaje)) pista = P('concatenar_numero');
  } else if (tipo === 'ValueError') {
    if (/invalid literal for int/.test(mensaje)) pista = P('int_invalido');
  }
  const titulo = error.linea ? E('titulo', { tipo, n: error.linea }) : E('titulo_sin_linea', { tipo });
  return { titulo, explicacion, pista };
}

const DESCRIPCION = Object.fromEntries(['SyntaxError', 'IndentationError', 'TabError', 'NameError', 'TypeError',
  'ValueError', 'ZeroDivisionError', 'IndexError', 'KeyError', 'AttributeError', 'SalidaLarga'].map(k => [k, 1]));
