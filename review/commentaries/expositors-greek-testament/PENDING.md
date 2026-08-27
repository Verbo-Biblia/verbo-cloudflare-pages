# The Expositor's Greek Testament — pendiente para reparar/extender después

Decisión (2026-08-27, siguiendo el mismo patrón ya acordado para Bengel):
publicar solo el Volumen 1 (los cuatro Evangelios) ahora, y dejar los
Volúmenes 2-5 (el resto del NT) para más adelante.

## Qué falta

**Volumen 2**: Hechos, Romanos (y probablemente 1 Corintios — la
partición exacta de volúmenes 2-3 no se investigó todavía).
**Volumen 3**: resto de Corintios, Gálatas, Efesios, Filipenses,
Colosenses (aprox.).
**Volumen 4**: Tesalonicenses hasta Filemón (aprox.).
**Volumen 5**: Hebreos hasta Apocalipsis (aprox.).

La partición exacta libro-por-volumen no está confirmada — solo se
investigó el Volumen 1 en detalle. Antes de retomar, hay que:

1. Descargar los djvu.txt de los volúmenes 2-5 desde archive.org (mismo
   identificador base: `expositorsgreekt0{2,3,4,5}nicouoft`).
2. Confirmar qué libro empieza y termina cada volumen (leyendo la
   portada/tabla de contenidos de cada uno, igual que se hizo para el
   Volumen 1).
3. Identificar el comentarista real de cada libro (obra colectiva — cada
   volumen tiene 3-5 autores distintos; NUNCA atribuir a Nicoll, que es
   solo editor general).
4. Confirmar el patrón de encabezado griego de cada libro nuevo (ej.
   "KATA ΛΟΥΚΑΝ" ya confirmado para Lucas, pero Hechos/Romanos/etc.
   tendrán sus propios patrones que hay que verificar contra el texto
   crudo, no asumir).

## Reutilizable sin cambios

- `tools/import_expositors_greek_testament.py` ya tiene el pipeline
  completo (detección de límites de libro vía encabezado griego,
  extracción de entradas "Ver. N.", limpieza de furniture de página,
  corrección automática basada en evidencia, exclusión de referencias
  irreparables). Para un volumen nuevo, solo hace falta:
  - agregar los libros de ese volumen a `BOOKS` con su `header_re` y
    autor real,
  - cambiar `VOLUME1_FILE`/`VOLUME1_IDENTIFIER` (o generalizar a una
    lista de volúmenes, como hace `import_bengel_gnomon.py`),
  - correr y validar igual que se hizo aquí.
- La lección más importante para el próximo volumen: **la señal de
  "el verso bajó ⇒ nuevo capítulo" solo debe dispararse cuando el verso
  nuevo es plausible como inicio real de capítulo (≤10)** — un chequeo
  laxo ("cualquier baja") falla con corrupción de OCR de un solo dígito
  dentro del mismo capítulo (caso confirmado: Juan 1:37 leído como
  "Ver. 27", i.e. 37→27 parece una "baja" respecto a 36, y sin esta
  guarda arruinó capítulos enteros aguas abajo).

## Cómo retomar

```bash
python3 tools/import_expositors_greek_testament.py
```

Actualmente solo procesa el Volumen 1. `ANOMALIES.json` en este
directorio documenta todo lo encontrado en el Volumen 1 (incluidas las 2
entradas excluidas por corrupción irreparable: Juan 1:52 y Juan 17:209).

No hace falta rehacer la investigación de fuente/licencia — ya está
resuelta y documentada en `PROVENANCE.md`: mismo identificador base de
archive.org, mismo régimen legal (dominio público, sin "corrección" de
griego vía referencia externa, dado que EGT es una obra de crítica
textual).
