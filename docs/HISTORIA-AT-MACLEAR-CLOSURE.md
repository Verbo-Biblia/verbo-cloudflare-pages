# Historia AT — cierre de Maclear

Fecha: 2026-09-02
Estado: integración completa y validada

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

La evaluación quedó cerrada con **cero fichas**. Maclear vuelve a narrar y
comentar los pasajes bíblicos; sus referencias localizan su exposición, pero
no aportan evidencia histórica independiente ni contexto moderno adicional.
No se modificaron ni regeneraron los paquetes del Asistente porque no existe
ningún recurso nuevo que proyectar. La decisión reproducible se conserva en
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
  `verbo-biblia-v75-maclear-history`.
- Navegador local: el cargador confirmó el volumen en el estante, 74 entradas,
  primer y último ID correctos y el aviso editorial visible.
- No se tocaron Biblia, Worker, API, secretos, KV ni `.wrangler/`.

## Reproducción

```bash
python3 tools/historia-at/build_maclear_module.py

cd tools/semantic-search
ONLY_SOURCE_ID=maclear-class-book-ot-history BATCH_SIZE=4 \
  node build-church-history-index.mjs
```

La siguiente fuente sigue requiriendo una propuesta y aprobación independiente
conforme a `AGENTS.md`.
