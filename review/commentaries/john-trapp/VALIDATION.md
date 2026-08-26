# Validación — John Trapp, Commentary (55 of 66 books)

Fecha: 2026-08-26

## Resultado

- 55 libros, 18.969 entradas, IDs únicos, contenido no vacío.
- 22 anomalías de numeración de capítulo/versículo, todas revisadas a
  mano y documentadas en `PROVENANCE.md` (ninguna se "adivinó" sin
  evidencia; cuando la corrección era segura se aplicó, cuando no, se
  excluyó el versículo).
- `tools/validate_commentary_module.py trapp-commentary`: `entries=18969
  errors=0`.
- `tools/audit_content.py`: mismas 6 incidencias preexistentes y ajenas a
  esta integración (HOS 11, JON 1, jfb/kd/wesley/pulpit-commentary) — sin
  regresiones nuevas.
- Comprobación ad-hoc sobre las 18.969 entradas: JSON válido, IDs únicos,
  balance de etiquetas HTML, solo `p/strong/em` (Trapp no usa
  blockquote/listas en este corpus), sin `Page_NNN`/`<script>`/`<style>`,
  referencias `book/chapterStart/verseStart/chapterEnd/verseEnd` dentro
  del rango real de cada capítulo (comparado contra `kjv-strong` con el
  alias NAM→NAH documentado, ya que los módulos de comentario de Verbo
  usan "NAM" para Nahúm y la Biblia KJV usa "NAH" — inconsistencia
  preexistente, no introducida aquí).

## Bugs de parseo encontrados y corregidos

Ver el detalle completo en `PROVENANCE.md`; resumen:

1. "Ver 3." (sin "s/ſ") no se reconocía como marcador de versículo →
   +44% de entradas al corregirlo (11.874 → 17.060 antes del ajuste de
   los Evangelios).
2. Nota marginal intercalada entre "Verſ." y el número parseaba un verso
   "1000" a partir de la letra "M" de "Martial." (cita al poeta latino).
3. Mismo tipo de colisión letra/numeral en el encabezado de capítulo.
4. IDs duplicados en los Evangelios (dos `<div type="verse">` con el
   mismo número) — fusionados en una sola entrada.

Cada corrección se re-verificó re-ejecutando el importador completo y
repitiendo la batería de comprobaciones.

## Tamaños

| Archivo | Tamaño |
|---|---:|
| Todos los `books/*.json` (55 archivos) | 21,0 MB |
| Mayor libro individual: `PSA.json` | 2,2 MB |
| `MAT.json` | 2,0 MB |
| `JOB.json` | 2,0 MB |
| `manifest.json` | 12 KB |
| `coverage.json` (incluye las 22 anomalías) | 24 KB |

`tools/build_commentary_index.py` generó los `.index.json` livianos
automáticamente (Trapp está en `registry.json → commentaries`, la lista
que ese script sí recorre): 21.445 KB de contenido completo →
2.399 KB de índice. No se activó `chapterSplit`: ningún libro individual
lo justifica frente al resto de comentarios ya cargados (Calvin en
Jeremías pesa 4,8 MB, por ejemplo).

## Muestreo contra la fuente oficial

Comparado directamente contra los 6 XML de TCP (mismos archivos
verificados por SHA-256):

- **Romanos 1:1** (comienzo del volumen de Epístolas, A63065): el
  contenido publicado coincide párrafo por párrafo con el `<div
  type="chapter" n="1">` fuente, incluyendo la nota marginal "(Pult.)"
  renderizada en línea y el `<gap reason="foreign">` como "[ilegible]".
- **Mateo 1:1** (comienzo del volumen de Evangelios, A63067, la
  estructura por frases): coincide con los 2 `<div type="phrase">`
  ("Of the generations]", "Of Jesus Christ]") de la fuente, cada uno con
  su lema en negrita seguido de la exposición.
- **Apocalipsis 22** (final del volumen de Epístolas): cobertura completa
  confirmada, sin truncar antes del último capítulo.
- **Génesis 50** (final del Pentateuco): cobertura completa.

## Comprobación web

Servido el repositorio localmente y probado con Chrome real vía
Playwright, en `1440×900`:

| Superficie | Resultado |
|---|---|
| Comentario, Romanos 1 | "Trapp" aparece en el selector de comentarios junto a los 14 ya existentes; al seleccionarlo, entradas Romans 1:1/1:2/1:3 con autor "John Trapp (1601–1669)" y traducción automática EN→ES activada |
| Consola del navegador | 0 errores de JavaScript. Los únicos `error` de red son bloqueos CORS del Worker de traducción de producción al probar desde `localhost` — no relacionados con esta integración |

No se modificó ningún archivo de `assets/*.js`: a diferencia de
Crisóstomo, Trapp usa exactamente el mecanismo ya existente para
`registry.json → commentaries` (índice liviano + comentario activo
completo), sin necesidad de la extensión de `loadLinkedEntries` que sí
requirió Crisóstomo.

## Traducción

El módulo permanece en inglés (`language: en`). No se tocó el sistema
común de traducción ni su caché.
