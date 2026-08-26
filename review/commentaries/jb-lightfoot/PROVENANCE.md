# J. B. Lightfoot — Colossians and Philemon

## Fuente concreta

- Obra: *St. Paul's Epistles to the Colossians and to Philemon: A Revised
  Text with Introductions, Notes, and Dissertations*.
- Autor: J. B. Lightfoot (1828–1889).
- Edición: Macmillan and Co., Londres, 1875.
- Digitalización: Project Gutenberg #50857, publicada el 6 de enero de 2016 y
  actualizada el 22 de octubre de 2024.
- Registro: https://www.gutenberg.org/ebooks/50857
- HTML: https://www.gutenberg.org/cache/epub/50857/pg50857-images.html
- Bytes: 1.934.414.
- SHA-256: `27b4b4c4dbf1f74131abb4e480963ae43739ebb570a3c7b7928ae503c5c27b09`.

El registro de Gutenberg identifica esta edición como dominio público en
Estados Unidos. La obra y la edición son de 1875 y Lightfoot murió en 1889.
Los términos de Gutenberg están en
https://www.gutenberg.org/policy/license.html. El módulo no conserva la
cabecera, pie, marca, navegación ni texto de licencia de Gutenberg.

## Tratamiento editorial

- Se excluye el texto griego continuo de Colosenses y Filemón, marcado por la
  fuente como `p.c032`; Verbo presenta sus propios textos bíblicos.
- Se conservan los resúmenes expositivos y las notas filológicas, incluido el
  griego Unicode.
- Las notas al pie citadas se resuelven y se incorporan a la misma entrada;
  no quedan enlaces internos rotos.
- Las introducciones, disertaciones y correcciones se guardan como entradas
  de capítulo/versículo 0. Las secciones largas se dividen únicamente entre
  bloques HTML completos, sin cortar palabras, frases ni etiquetas.
- Se excluyen índice alfabético, números de página, flechas de navegación,
  imágenes decorativas, CSS y elementos de interfaz.
- No se moderniza ni reescribe el inglés.

## Construcción

```bash
python3 tools/import_lightfoot_colossians_philemon.py
```

El importador descarga solo el HTML oficial, verifica tamaño y checksum y
genera los dos archivos de libro. La fuente descargada es reproducible y no se
versiona en el repositorio.
