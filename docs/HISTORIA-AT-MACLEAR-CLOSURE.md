# Historia AT — cierre de Maclear

Fecha: 2026-09-04
Estado: integración completa y validada localmente; publicación del Asistente por verificar

## Alcance aprobado y resultado

La aprobación expresa del usuario autorizó la adaptación de *A Class-Book of
Old Testament History* de George Frederick Maclear, edición de 1894. El texto
completo autorizado quedó disponible en `🏛️ Historia`, dividido en 74 unidades:
el aviso y material preliminar, 71 capítulos, el apéndice cronológico y el
índice con las notas editoriales de la transcripción.

La lectura conserva el inglés original y utiliza la traducción diferida de la
aplicación. Cada unidad muestra un aviso que atribuye a Maclear sus
cronologías, armonizaciones, etimologías y conclusiones decimonónicas. No se
incluyeron mapas ni ilustraciones.

## Asistente de estudio

La evaluación quedó cerrada con **17 fichas**. Se incorporaron explicaciones
valiosas ligadas a acontecimientos, períodos, lugares e instituciones que no
están inmediatamente visibles en el pasaje, siempre atribuidas a Maclear y con
límites explícitos para su cronología y reconstrucciones de 1894. Se excluyó la
mera repetición narrativa. La decisión reproducible se conserva en
`data/fuentes-externas/historia-at/maclear-class-book-ot-history/editorial/ASSISTANT-REVIEW.md`.

## Artefactos y validación

- Módulo: `biblia/modules/church-history/maclear-class-book-ot-history/`.
- Expedientes fuente: 74 registros `APPROVED`, validados contra el esquema de
  unidades de lectura.
- Registro y estante: módulo y cubierta incorporados; tabla de contenido
  agrupada por los once libros de la obra.
- Índice semántico de Historia: 1.660 registros, 384 dimensiones y 637.440
  bytes; 74 registros pertenecen a Maclear.
- Caché: `app.js` usa `20260902-maclear-history` y el Service Worker usa
  `verbo-biblia-v76-maclear-assistant`.
- Navegador local: el cargador confirmó el volumen en el estante, 74 entradas,
  primer y último ID correctos y el aviso editorial visible.
- Asistente: 17 fichas bilingües en 53 capítulos, 1.547 apariciones por
  versículo; 1.189 paquetes completos y catálogo de 7.070 recursos únicos.
- Enlaces profundos y etiquetas: incorporados en study-assistant.js y en ambos
  diccionarios de interfaz; versiones `20260904-maclear-assistant`.
- Prueba local final: 34 casos en Chrome, todas las fichas en ambos idiomas y
  sus entradas exactas, siete categorías, sin errores JavaScript ni solicitudes
  de traducción de Maclear al Worker.
- Regresión: los demás recursos de cada paquete permanecen idénticos a HEAD.
- Publicación: pendiente de verificar después de subir el commit.
- No se tocaron Biblia, API, secretos, KV ni `.wrangler/`; el catálogo estático
  del Worker cambió únicamente como artefacto generado del Asistente.

## Reproducción

```bash
python3 tools/historia-at/build_maclear_module.py

cd tools/semantic-search
ONLY_SOURCE_ID=maclear-class-book-ot-history BATCH_SIZE=4 \
  node build-church-history-index.mjs
```

La siguiente fuente sigue requiriendo una propuesta y aprobación independiente
conforme a `AGENTS.md`.
