# Revisión editorial Strong

## Progreso

- El módulo completo fue reconstruido sobre el texto editorial definitivo de Biblia Verbo.
- Los CSV de Génesis conservan las decisiones de la revisión anterior como material de trabajo, pero no se importaron automáticamente porque cambiaron el texto y los identificadores de segmentos.
- Actualmente ninguna asociación se presenta como `editorial-reviewed`. Las decisiones anteriores deben revalidarse contra el módulo reconstruido antes de recuperar ese estado.
- La referencia local `RV1960+.bbl.mybible` se usa únicamente para sugerir y contrastar ubicaciones. No se copia su texto y sus coincidencias no se promueven automáticamente.
- `tools/audit_rv1960_strong_locations.py` compara los 66 libros, filtra cada código contra STEPBible y genera `review/strong/rv1960-location-audit.json` sin modificar el módulo.

## Cruce posicional RV1960+

Línea base del 10 de agosto de 2026:

- 31.097 versículos comparados.
- 432.893 asociaciones presentes en la referencia.
- 388.796 asociaciones también presentes en STEPBible para el mismo versículo.
- 203.022 coincidencias con la ubicación actual de Biblia Verbo después de la fusión conservadora.
- 146.210 de esas coincidencias respaldan ubicaciones que continúan como `provisional-reference`.
- 29.073 candidatos aparecen actualmente en otro segmento y 12.185 todavía no están en la capa actual; ambos grupos requieren revisión contextual y no se importan automáticamente.

Regla editorial: la RV1960+ sugiere una ubicación; STEPBible confirma que el código pertenece al versículo; el texto original, la morfología y el contexto de Biblia Verbo determinan la decisión. Un acuerdo automático entre referencias no equivale por sí solo a `editorial-reviewed`.

Para regenerar el informe:

```bash
python3 tools/audit_rv1960_strong_locations.py \
  --output review/strong/rv1960-location-audit.json \
  --sample-limit 0
```

Cada CSV corresponde a un libro de RV2026+ y puede abrirse en Excel o LibreOffice.

## Columnas que completa el revisor

- `reviewer`: nombre o iniciales.
- `decision`: `approve`, `reject` o `correct`.
- `corrected_strong`: código correcto cuando la decisión sea `correct`.
- `notes`: explicación breve cuando sea útil.

`verified-open` identifica asociaciones reproducibles solo con RV2026 y STEPBible. `provisional-reference` identifica ubicaciones sugeridas por otra versión y confirmadas únicamente a nivel de código por versículo; estas requieren prioridad de revisión.

`cross-verified-open` identifica asociaciones confirmadas además por una relación
palabra–código dominante, observada repetidamente en datos `verified-open`. Se genera
con `tools/promote_strong_evidence.py`; no se presenta como revisión humana. El lote
del 10 de agosto de 2026 exige al menos cinco observaciones, precisión corpus-wide
mínima del 99 % y presencia del código en STEPBible para el mismo versículo. Dos pasadas
promovieron 1.273 asociaciones en total.

La fusión conservadora de RV1960+ añadió 27.070 asociaciones a 25.845 segmentos que
estaban vacíos. Exigió que el código estuviera ausente de todo el versículo y presente
en STEPBible; no movió ni reemplazó asociaciones existentes. El resultado contiene
253.792 asociaciones, alcanza 60,68 % de cobertura y dejó inicialmente 181.635 como
`provisional-reference` antes de la verificación abierta del Nuevo Testamento.

La verificación abierta por glosa exacta del Nuevo Testamento promovió otras 16.202
asociaciones a `verified-open`: 16.088 de código único y 114 en 57 segmentos que
componen exactamente «sino» a partir de las glosas `si` + `no`. Exige coincidencia
literal normalizada con la glosa española STEPBible, la misma ocurrencia del código
en orden y morfología compatible. Después de estos lotes quedan 165.433 asociaciones
`provisional-reference`. Los informes reproducibles están en
`review/strong/step-gloss-nt-report.json` y
`review/strong/step-gloss-nt-composition-report.json`.

No se debe modificar `reference`, `verse_text`, `word`, `strong`, `morphology`, `step_gloss`, `status` ni `confidence`, porque permiten importar después las decisiones de forma reproducible.

`row_id`, `segment_index` y `code_index` identifican de forma inequívoca cada asociación. Tampoco deben editarse. El importador rechazará el CSV si el módulo cambió después de exportarlo.

## Validar o aplicar decisiones

Validar sin escribir archivos:

```bash
python3 tools/import_strong_review.py review/strong/GEN.csv
```

Generar una copia revisada del libro:

```bash
python3 tools/import_strong_review.py review/strong/GEN.csv --output /tmp/GEN.reviewed.json
```

El importador exige `reviewer` para toda decisión, acepta solamente `approve`, `reject` o `correct`, y verifica que cualquier `corrected_strong` exista en el diccionario instalado.

## Asociaciones faltantes

El flujo separado de adiciones compara el módulo contra STEPBible y exporta los grupos todavía no asociados:

```bash
python3 tools/export_strong_additions.py GEN
python3 tools/import_strong_additions.py review/strong/GEN-additions.csv
```

En esos CSV, `decision` acepta `add` o `skip`. `add` exige indicar el `target_segment_index` de la palabra española; `skip` documenta que el elemento hebreo o griego no tiene equivalente explícito en la traducción. Para generar una copia revisada se usa también `--output`.

Para encadenar decisiones sobre asociaciones existentes y adiciones sin modificar la línea base provisional:

```bash
python3 tools/import_strong_review.py review/strong/GEN.csv --output /tmp/GEN.reviewed.json
python3 tools/import_strong_additions.py review/strong/GEN-additions.csv --input /tmp/GEN.reviewed.json --output /tmp/GEN.complete.json
```
