# Martin Luther — Commentary on Galatians (Graebner Abridged)

## Fuente concreta

- Obra base: Martin Luther, comentario de 1535 sobre Gálatas (lecciones de
  1531).
- Traducción/edición: Theodore Graebner (1876–1950), *A New Abridged
  Translation*.
- Primera edición indicada por CCEL: Zondervan, Grand Rapids, 1939.
- Project Wittenberg describe su copia como la edición Zondervan de 1949.
- Digitalización usada: Project Gutenberg #1549, actualizada el 17 de febrero
  de 2024.
- Registro: https://www.gutenberg.org/ebooks/1549
- HTML exacto:
  https://www.gutenberg.org/cache/epub/1549/pg1549-images.html
- Tamaño: 565.453 bytes.
- SHA-256:
  `49d6b0fe3e3b1bcf79edef1371b80cd3c2d3d24cf5f2503272b950a2e7ba73e7`.

El registro oficial de Gutenberg identifica el eBook concreto como dominio
público en Estados Unidos y nombra expresamente a Graebner como traductor. Sus
términos están en https://www.gutenberg.org/policy/license.html.

Evidencia independiente de edición y carácter abreviado:

- https://www.ccel.org/ccel/luther/galatians.all.html
- https://www.projectwittenberg.org/pub/resources/text/wittenberg/luther/gal/web/gal-inx.html

Project Wittenberg declara además que su transcripción fue preparada por Laura
J. Hoelter y Robert E. Smith y está en dominio público. El módulo se construye
desde el HTML oficial de Gutenberg, no desde PDFs, OCR ni traducciones modernas.

## Tratamiento editorial

- El nombre y los metadatos dicen explícitamente que esta es la traducción
  inglesa abreviada de Graebner; no se presenta como comentario completo.
- Cada bloque que empieza por `VERSE` o `VERSES` determina la referencia de la
  entrada. Se reconocen listas, rangos y encabezados que contienen dos marcas
  `VERSE`.
- Se elimina la cabecera separable que reproduce el texto bíblico base. La
  referencia queda en el título y los metadatos de la entrada.
- Las citas bíblicas, diálogos y frases que forman parte de la exposición de
  Luther/Graebner se conservan.
- Los subtítulos editoriales dentro de una exposición se conservan con énfasis.
- Prefacio e introducción de Luther se conservan como capítulo/versículo 0.
- Se excluyen portada digital, tabla de contenidos, navegación, licencia de
  Gutenberg, CSS y elementos de interfaz.
- No se moderniza, traduce ni reescribe el inglés.

## Construcción

```bash
python3 tools/import_luther_galatians_graebner.py
```

El importador descarga únicamente el HTML oficial, exige el tamaño y SHA-256
documentados y genera un módulo ordinario de Verbo. No modifica esquema,
loader, cliente, Worker, caché ni traducción.
