# The Treasury of David — pendiente para reparar/extender después

Siguiendo el mismo patrón ya acordado en esta ola para Bengel y EGT:
publicar ahora lo que se pudo separar con confianza (Spurgeon vs. sus
citas de otros autores), y dejar documentado lo que falta.

## Qué falta

### Salmo 119 (los 176 versículos)

Este salmo, el más largo, está impreso con una estructura interna
totalmente distinta al resto: en vez de una sola sección "Explanatory
Notes and Quaint Sayings" para todo el salmo, está dividido en 22
subsecciones que corresponden a sus estrofas del acróstico hebreo, cada
una encabezada "NOTES ON VERSES N to M." — una convención de encabezado
que este importador no reconoce todavía.

**Lo que SÍ se publicó** para el Salmo 119: su ensayo introductorio
("Whole Psalm") y su sección de Hints to the Village Preacher (acreditada
en la fuente misma a un colaborador invitado, "C. A. DAVIS, OF
BRADFORD", no a Spurgeon).

**Lo que falta**: la Exposición y las Notas explicativas de los 22
octetos (versículos 1-176). El contenido SÍ está en el OCR (confirmado
por inspección directa — ver PROVENANCE.md), solo falta el parser
específico para esa estructura de 22 secciones.

Para retomarlo: en `tools/import_spurgeon_treasury_of_david.py`, el
Volumen 6 (`v6.txt`) contiene el Salmo 119 en sus primeros ~1.43M
caracteres. Los encabezados de octeto encontrados (18 de 22 esperados,
algunos con variantes OCR "ro"/"to"/"TO", uno con prefijo "SPECIAL",
algunos octetos sin encabezado detectable en absoluto — 1-8, 41-48,
65-72, 89-96, 97-104) están documentados en la sesión que hizo este
import; requiere una función dedicada tipo `parse_psalm_119_special()`
que trate cada octeto como un "salmo virtual" con su propio límite
Exposición/Notas, más un fallback razonable para los octetos sin
encabezado reconocible.

### 6 Salmos con Exposición excluida por contaminación de límite

Salmos 57, 99, 110, 111, 113 (Vol. 5) y el propio 119 (Vol. 6, ver
arriba): un marcador de sección faltante en el OCR significa que el
tramo de "Exposición" de ese Salmo no se puede garantizar libre de
contenido citado de otro autor (confirmado por inspección directa en el
Salmo 57 — el tramo terminaba con una cita atribuida a Franz Delitzsch).
Se excluyó la entrada de Exposición de esos 5 Salmos (más el caso
especial de 119) en vez de arriesgar una mala atribución. Sus entradas de
Notes/Hints, cuando sí se detectaron con límites confiables, SÍ están
publicadas.

Para recuperar estos 5: revisar manualmente el OCR alrededor de cada
"section-marker-missed" en `ANOMALIES.json` (Vol 3, Vol 4, Vol 5 ×3) y
corregir el header perdido a mano, o mejorar la detección de
`NOTES_RE`/`HINTS_RE` para cubrir la variante OCR que causó cada miss.

### 20 notas individuales excluidas por número de verso irresoluble

Documentadas en `ANOMALIES.json` bajo `verse-out-of-range-unresolved-excluded`
— más de un candidato de corrección de dígito válido, sin evidencia de
contenido para desambiguar automáticamente. Requeriría lectura manual
del contenido de cada una (como se hizo para confirmar el patrón general
"N8" → "N", ver PROVENANCE.md) para decidir el verso correcto caso por
caso.

## Reutilizable sin cambios

- `tools/import_spurgeon_treasury_of_david.py` tiene el pipeline completo
  y probado para los 149 Salmos "normales": reconciliación de marcadores
  de sección con máquina de estados tolerante a errores, separación de
  Exposición/Notas/Hints, agrupación por versículo, corrección de OCR
  basada en evidencia (incluyendo el patrón "N8"→"N" documentado), y
  salida directa en formato `chapterSplit` (`books/PSA/<salmo>.json`).
- El identificador de volumen y rango de Salmos por volumen (tabla en
  PROVENANCE.md) ya está confirmado contra la portada real de cada
  volumen — no hace falta rehacer esa investigación.

## Cómo retomar

```bash
python3 tools/import_spurgeon_treasury_of_david.py
```

Regenera todo `biblia/modules/commentaries/spurgeon-treasury-of-david/books/PSA/*.json`
desde cero a partir de los `.txt` en el directorio de scratch de la
sesión (ver `SCRATCH_DIR` en el script). `ANOMALIES.json` en este
directorio documenta cada corrección y exclusión con su razonamiento.
