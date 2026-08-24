# The Pulpit Commentary

Módulo de trabajo independiente para la edición inglesa de *The Pulpit
Commentary*. No forma parte de `Comentarios Verbo`.

El módulo todavía no está registrado. Un archivo presente en `books/` no está
publicado: cada libro se incorpora manualmente a `manifest.json` solamente
después de que Juan apruebe todas sus entradas. El contenido permanece en
inglés; la aplicación solicitará la traducción bajo demanda mediante
`POST /translate` y la caché de `SYNC_KV` cuando el módulo llegue a publicarse.

`editorialStatus: ocr-unreviewed` significa que la entrada no está aprobada
para publicación. `section` distingue `exposition` de `homiletics`.
`editorialNote` es opcional y solo debe añadirse manualmente cuando una
afirmación cronológica, arqueológica o de crítica textual propia de la
erudición histórica necesite cautela; nunca sustituye ni altera `content`.

Los 25 libros estructurados se conservan físicamente en `books/`, cada uno con
su índice, pero deliberadamente ninguno aparece en el arreglo `books` del
manifest. Son artefactos de revisión con 6,038 entradas `ocr-unreviewed`, no
contenido publicado.
