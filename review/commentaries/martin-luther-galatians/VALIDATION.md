# Validación — Martin Luther, Galatians (Graebner Abridged)

Fecha: 2026-08-26

## Resultado

- Módulo: `luther-galatians-graebner`.
- Cobertura: Gálatas 1–6, los 149 versículos canónicos.
- Entradas: 231 (229 entradas expositivas y 2 de prefacio/introducción).
- IDs duplicados, contenidos vacíos o referencias inválidas: 0.
- Mayor entrada: 12.603 caracteres; no fue necesario dividir ninguna nota.
- Cabeceras separables `VERSE`/`VERSES` conservadas como texto bíblico: 0.

| Capítulo | Entradas expositivas |
|---:|---:|
| 1 | 36 |
| 2 | 42 |
| 3 | 53 |
| 4 | 41 |
| 5 | 35 |
| 6 | 22 |

La suma de entradas expositivas es mayor que 149 porque la edición comenta
varias veces un mismo versículo bajo encabezados distintos. No se fusionaron
esas unidades editoriales.

## Tamaños

| Archivo | Bytes |
|---|---:|
| `books/GAL.json` | 523.262 |
| `books/GAL.index.json` | 30.604 |
| `manifest.json` | 1.383 |
| `coverage.json` | 438 |

El libro completo queda en 511 KiB y el índice liviano en 30 KiB. No se usa
`chapterSplit`: el archivo único es pequeño y sigue la convención normal de
Verbo.

## Comandos y reproducibilidad

```bash
python3 -m py_compile tools/import_luther_galatians_graebner.py
python3 tools/import_luther_galatians_graebner.py --cache /tmp
python3 tools/build_commentary_index.py
python3 tools/build_registry_catalog.py
python3 tools/validate_commentary_module.py luther-galatians-graebner
git diff --check
```

El validador devolvió `entries=231 errors=0`. Una reconstrucción completa
produjo dos veces el mismo SHA-256 combinado del módulo:
`8cad5517382bbcd9a0b0976412936a74669dbfb4f748571ed8aa58de437a6cb3`.

La auditoría global `tools/audit_content.py` no produjo errores para Luther.
Conserva seis incidencias preexistentes y ajenas: HOS 11, JON 1 y los conteos
registrados de JFB, K&D, Wesley y Pulpit.

## Contenido y muestreo

El HTML resultante se parseó de nuevo. Solo contiene `p`, `strong`, `em`,
`blockquote`, `ul`, `ol` y `li`, sin atributos, scripts, CSS, navegación ni
marcas de Project Gutenberg. La cobertura se comparó con `asv-1901`: no falta
ni sobra ningún versículo.

Se compararon directamente contra el HTML oficial:

- GAL 1:1 (comienzo);
- GAL 3:13 (zona media);
- GAL 6:18 (final).

En los tres casos el primer párrafo de exposición coincide con la fuente. El
encabezado previo que reproduce el versículo se excluyó. Los subtítulos,
diálogos y citas insertos en el razonamiento se conservaron.

## Web, móvil, Android y traducción

Prueba local con BSB, Gálatas 1:1:

| Vista | Resultado |
|---|---|
| 390×844 | Opción `● Luther (Galatians)`, 14 comentarios, 38 tarjetas cargadas |
| 1440×900 | Opción `● Luther (Galatians)`, 14 comentarios, 38 tarjetas cargadas |

En ambas vistas se abrió el comentario correcto, con autor y prefacio, y la
traza solicitó solo manifiesto, índice y `books/GAL.json`. La TWA Android
consume la misma aplicación web, por lo que no hay un módulo nativo separado.

El corpus permanece en inglés. No se cambió cliente, Worker, caché ni sistema
de traducción; todas las entradas están por debajo del límite existente.
