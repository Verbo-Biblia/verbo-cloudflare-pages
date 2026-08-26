# Validación — Juan Crisóstomo, Homilías sobre Mateo (NPNF1-10)

Fecha: 2026-08-26

## Resultado

- 86 homilías, 1 introducción general (Homilía I, capítulo/versículo 0) + 85
  ancladas a Mateo 1–28.
- 2 homilías sin cierre de rango seguro (Homilía II y Homilía XXXVI, ver
  PROVENANCE.md) — quedaron como un solo versículo en vez de inventar un
  final.
- Cobertura: los 28 capítulos de Mateo tienen al menos una homilía.
- IDs únicos: 86/86. Contenido no vacío: 86/86.
- `tools/validate_commentary_module.py chrysostom-mateo`: `entries=86
  errors=0`.
- `tools/audit_content.py`: mismas 6 incidencias preexistentes y ajenas a
  esta importación (HOS 11, JON 1, jfb/kd/wesley/pulpit-commentary) — sin
  regresiones nuevas. El módulo no aparece en esta auditoría porque solo
  recorre `registry.commentaries`, y Crisóstomo se registró en
  `patristicByVerse` por indicación de Juan (ver PROVENANCE.md).

## Bugs encontrados y corregidos durante la validación

Los cuatro se detectaron comparando la salida contra el XML fuente, no por
inspección superficial:

1. **Palabras pegadas al eliminar notas al pie.** `For<note/>we are` se
   convertía en "Forwe are" al descartar la etiqueta `<note>` sin dejar un
   espacio. Corregido en `Cleaner.inline()`.
2. **Portada del volumen dentro de la Homilía I.** El `<div2>` de la primera
   homilía contiene, antes de su propio encabezado "Homily I.", el título
   del volumen completo ("Homilies of St. John Chrysostom, archbishop of
   constantinople, on the gospel according to st. matthew."). La detección
   original de encabezado asumía que el encabezado siempre era el primer
   párrafo; ahora busca "Homily N." en cualquier posición y descarta todo lo
   anterior.
3. **Etiqueta `<sup>` no permitida.** `tools/validate_commentary_module.py`
   solo permite `p, strong, em, blockquote, ul, ol, li`; el conversor emitía
   `<sup>` para exponentes numéricos. Se cambió a texto plano en línea.
4. **Fuga de párrafo de cita en 2 homilías.** La detección de "es solo la
   cita, sin cuerpo" comparaba el texto completo del párrafo (incluida
   cualquier nota anidada) contra el texto del `<scripRef>`; cuando la nota
   iba dentro de un `<span>` (Homilía LXXV) o pegada al número de homilía
   (Homilía XX: "Homily XX.[Or Homily XXI. in the Latin versions...]"), la
   comparación fallaba y el párrafo entero terminaba en el cuerpo. Se agregó
   `text_excluding_notes()`, recursiva, para ambas comparaciones.

Las cuatro correcciones están en `tools/import_chrysostom_matthew.py`; el
script se re-ejecutó completo después de cada una y se repitió la batería de
comprobaciones (JSON, referencias, balance de HTML, sin basura, sin fuga de
etiquetas) antes de continuar.

## Comprobaciones automáticas

```bash
python3 -m py_compile tools/import_chrysostom_matthew.py
python3 tools/import_chrysostom_matthew.py
python3 tools/build_commentary_index.py
python3 tools/build_registry_catalog.py
python3 tools/validate_commentary_module.py chrysostom-mateo
python3 tools/audit_content.py
```

Además, un script ad-hoc (no versionado) verificó sobre las 86 entradas:
JSON válido, IDs únicos, contenido no vacío, `chapterStart/verseStart/
chapterEnd/verseEnd` dentro del rango real de cada capítulo (comparado
contra `kjv-strong/books/MAT.json`), balance de etiquetas HTML, ausencia de
`Page_NNN`/CCEL/`<script>`/`<style>`, y presencia de Unicode griego. Mismas
comprobaciones repetidas sobre los 6 `sections.json` del lado `patristic`
(sin fuga de etiquetas HTML — ese esquema es texto plano).

## Tamaños

| Archivo | Tamaño |
|---|---:|
| `commentaries/chrysostom-mateo/books/MAT.json` | 2,5 MB |
| `patristic/chrysostom-mateo-1/sections.json` | 492 KB |
| `patristic/chrysostom-mateo-2/sections.json` | 484 KB |
| `patristic/chrysostom-mateo-3/sections.json` | 392 KB |
| `patristic/chrysostom-mateo-4/sections.json` | 452 KB |
| `patristic/chrysostom-mateo-5/sections.json` | 416 KB |
| `patristic/chrysostom-mateo-6/sections.json` | 252 KB |

`build_commentary_index.py` no generó `.index.json` para `chrysostom-mateo`
porque solo recorre `registry.commentaries`, y este módulo vive en
`patristicByVerse` (mismo comportamiento que los 11 módulos patrísticos
existentes: ninguno tiene índice liviano). Ver "Limitación de rendimiento
conocida" en PROVENANCE.md — el archivo completo de 2,5 MB se descarga la
primera vez que se abre cualquier capítulo de Mateo en la sesión.

## Muestreo contra la fuente oficial

Comparado directamente contra `/tmp/npnf110.xml` (mismo archivo verificado
por SHA-256):

- **Homilía I** (comienzo del volumen): confirmado que ya no incluye "Homilies
  of St. John Chrysostom, archbishop of constantinople..." y empieza en "It
  were indeed meet for us...", igual que el `<div2 id="iii.iv">` fuente.
- **Homilía XLIII** (zona media, Mateo 12:38-39): contenido cotejado con
  `<div2 id="iii.XLIII">` — coincide párrafo por párrafo, notas al editor
  incluidas al final.
- **Homilía LXXXVI** (final del volumen, Mateo 28:11-14): coincide con
  `<div2 id="iii.LXXXVI">`; termina con las notas del editor sobre Mateo
  28:18-20, igual que la fuente.
- Texto griego: verificado que "παρλκοντα" (Homilía II) se conserva
  idéntico al XML fuente, incluyendo el defecto de origen documentado en
  PROVENANCE.md (no se intentó corregir Griego antiguo sin fuente
  adicional).

## Comprobación web

Servido el repositorio localmente (`python3 -m http.server`) y probado con
Chrome real vía Playwright (Python), en `1440×900` y `390×844`:

| Superficie | Resultado |
|---|---|
| Comentario, Mateo 1 (per-verse badges) | Verso 1 muestra "🕮 3" (Homilía I introducción + Homilía II + Homilía III, ambas ancladas a 1:1), verso 2 muestra "🕮 1" (solo la introducción, que cubre todo el capítulo) — coincide exactamente con lo esperado según `coverage.json` |
| Padres Apostólicos → Explorar documentos | Las 6 tarjetas de "Juan Crisóstomo — Homilías sobre Mateo, vol. 1..6" aparecen con su rango de homilías, tapa propia y resumen; "Leer →" abre el índice de secciones del volumen correspondiente (15 para el vol. 1) |
| Buscador del panel (`Crisóstomo`) | Autocompleta las 86 homilías con su título y referencia (ej. "Crisóstomo Mateo 1 — Homilía V — Mateo 1:22–1:23") |
| Abrir Homilía I | Título, nombre del volumen, banner "Traducción automática EN→ES", contenido correcto (mismo texto verificado contra la fuente), navegación anterior/siguiente |
| Consola del navegador | 0 errores de JavaScript en toda la sesión. Los únicos `error` de red observados son bloqueos CORS del Worker de traducción de producción al probar desde `localhost` — no reproducibles en producción (mismo origen) y no relacionados con esta importación |

No se tocó ningún archivo de `assets/*.js`: la integración se apoya
enteramente en `registry.json`, `shelf.json` y los módulos nuevos.

## Traducción

Los 7 módulos (`chrysostom-mateo` comentario + 6 volúmenes patrísticos)
quedan en inglés (`language: en`). No se modificó el sistema de traducción
ni su caché — el flujo EN→ES bajo demanda ya existente en
`translatePatristicSection`/`applyCommentaryTranslation` los recogió sin
cambios de código, confirmado en la comprobación web. Ninguna entrada
individual del lado comentario se fragmentó por tamaño (instrucción
explícita: "una homilía = una entrada"); si alguna homilía larga excede el
límite de ~20.000 caracteres por solicitud de `/translate`, la segmentación
queda pendiente de resolverse en el cliente si Juan la pide — no se tocó el
Worker ni el mecanismo común.
