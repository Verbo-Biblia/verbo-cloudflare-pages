# Staging de fuentes para Historia del Antiguo Testamento

Este directorio conserva copias fuente y expedientes de adquisición para el
proyecto propuesto en `docs/COMPENDIO-HISTORICO-AT-FASE-1.md`.

Nada dentro de este directorio está registrado en `biblia/modules/registry.json`
ni es consumido por la aplicación. El staging no autoriza por sí mismo la
publicación de una obra, una traducción, una imagen ni un derivado.

La muestra manual no publicable de Génesis 1–11 está en
`pilot-genesis-1-11.json`. Su adaptación se guía por los formatos activos de
Historia y del Asistente; este staging no define un esquema alternativo.

## Reglas

- Conservar cada archivo `original/` sin modificaciones y registrar SHA-256.
- Identificar la edición concreta; no atribuir los datos de una edición a otra.
- Separar derechos del texto, OCR, traducción, notas, mapas e imágenes.
- No procesar una fuente marcada `LEGAL_REVIEW_REQUIRED`.
- Generar derivados únicamente mediante scripts reproducibles.
- No convertir asociaciones automáticas en anclajes editoriales aprobados.
- No copiar este staging a `biblia/modules/` sin la aprobación expresa exigida
  por `AGENTS.md`.

## Fuentes iniciadas

| ID | Obra | Estado | Integración prevista |
|---|---|---|---|
| `sayce-patriarchal-palestine` | A. H. Sayce, *Patriarchal Palestine* | facsímil de 1895 identificado; inventario completo y 9 expedientes `REVIEW_REQUIRED`; prefacio y cronología cotejados inicialmente | `🏛️ Historia` + selección curada para el Asistente |
| `maclear-class-book-ot-history` | G. F. Maclear, *A Class-Book of Old Testament History* | texto adquirido; análisis inicial pendiente | `🏛️ Historia` + selección curada para el Asistente |
| `pinches-ot-historical-records-1903` | T. G. Pinches, *The Old Testament in the Light of the Historical Records and Legends of Assyria and Babylonia*, 2.ª ed. rev. | facsímil y OCR institucional adquiridos; advertencias documentadas | por decidir tras aprobación; staging únicamente |
| `hp-smith-ot-history-1903` | H. P. Smith, *Old Testament History* | facsímil y OCR de LOC adquiridos; marco crítico documentado | por decidir tras aprobación; staging únicamente |
