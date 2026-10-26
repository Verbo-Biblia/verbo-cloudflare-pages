// Editor de código: CodeMirror 6 con Python, números de línea, autoindentación y colores del tema del juego.
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, EditorState, Compartment, defaultKeymap,
  history, historyKeymap, indentWithTab, python, syntaxHighlighting, HighlightStyle, indentOnInput,
  bracketMatching, indentUnit, closeBrackets, closeBracketsKeymap, tags,
} from './vendor/codemirror.js';

// Los colores salen de variables CSS (css/estilo.css), así el editor sigue el modo claro u oscuro sin recrearse.
const colores = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--cod-clave)', fontWeight: '600' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--cod-cadena)' },
  { tag: tags.comment, color: 'var(--cod-comentario)', fontStyle: 'italic' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--cod-numero)' },
  { tag: [tags.function(tags.variableName), tags.standard(tags.variableName)], color: 'var(--cod-funcion)' },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: 'var(--cod-signo)' },
  { tag: tags.className, color: 'var(--cod-funcion)', fontWeight: '600' },
]);

const tema = EditorView.theme({
  '&': { color: 'var(--cod-texto)', backgroundColor: 'var(--cod-fondo)', fontSize: '1em', borderRadius: '10px' },
  '.cm-content': { fontFamily: 'var(--mono)', caretColor: 'var(--dorado)', padding: '10px 0' },
  '.cm-gutters': { backgroundColor: 'var(--cod-fondo)', color: 'var(--cod-numlinea)', border: 'none', borderRadius: '10px 0 0 10px' },
  '.cm-activeLine': { backgroundColor: 'var(--cod-activa)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--cod-activa)' },
  '&.cm-focused': { outline: '2px solid var(--dorado)' },
  '.cm-cursor': { borderLeftColor: 'var(--dorado)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: 'var(--cod-seleccion) !important' },
  '.cm-linea-error': { backgroundColor: 'var(--cod-error)' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.55' },
});

/** Crea un editor dentro de `padre`. Devuelve {vista, valor(), poner(texto), insertar(texto), enfocar()}. */
export function crearEditor(padre, { texto = '', alCambiar, atajos = [], soloLectura = false } = {}) {
  const lectura = new Compartment();
  const vista = new EditorView({
    parent: padre,
    state: EditorState.create({
      doc: texto,
      extensions: [
        lineNumbers(), history(), drawSelection(), highlightActiveLine(), indentOnInput(), bracketMatching(),
        closeBrackets(), indentUnit.of('    '), EditorState.tabSize.of(4), python(), syntaxHighlighting(colores), tema,
        keymap.of([...atajos, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        lectura.of([EditorState.readOnly.of(soloLectura), EditorView.editable.of(!soloLectura)]),
        EditorView.contentAttributes.of({ 'aria-label': 'Python', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' }),
        EditorView.updateListener.of(u => { if (u.docChanged && alCambiar) alCambiar(u.state.doc.toString()); }),
      ],
    }),
  });
  return {
    vista,
    valor: () => vista.state.doc.toString(),
    poner(t) { vista.dispatch({ changes: { from: 0, to: vista.state.doc.length, insert: t } }); },
    insertar(t) {
      const { from, to } = vista.state.selection.main;
      vista.dispatch({ changes: { from, to, insert: t }, selection: { anchor: from + t.length }, scrollIntoView: true });
      vista.focus();
    },
    enfocar: () => vista.focus(),
    marcarLinea(n) {
      vista.dom.querySelectorAll('.cm-linea-error').forEach(e => e.classList.remove('cm-linea-error'));
      if (!n || n > vista.state.doc.lines) return;
      const linea = vista.state.doc.line(n);
      requestAnimationFrame(() => {
        const { node } = vista.domAtPos(linea.from);
        const el = node.nodeType === 1 ? node.closest('.cm-line') : node.parentElement?.closest('.cm-line');
        el?.classList.add('cm-linea-error');
      });
    },
  };
}
