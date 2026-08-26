# Validación de Matthew Poole

Fecha: 2026-08-26

## Resultado

- 66 libros, 1.188 capítulos con anotaciones y 25.970 entradas.
- 25.970 identificadores únicos; ningún contenido vacío.
- Todas las referencias del módulo pasan los límites de libro, capítulo y
  versículo de `tools/audit_content.py`.
- HTML analizado con `lxml.html`: cero fragmentos inválidos, cero etiquetas
  fuera de `p`, `strong`, `em`, `blockquote`, `ul`, `ol` y `li`; no hay
  `script`, `style` ni URLs `javascript:`.
- Se verificó la frontera de autoría: Isaías 58 se atribuye a Poole e Isaías
  59 a los continuadores.
- Entrada más larga: Génesis 49:10, 19.095 caracteres. No supera el límite
  aproximado de 20.000 caracteres del traductor actual.

La auditoría global también informa diferencias ya existentes y ajenas a este
módulo (conteos de JFB, K&D y Wesley, cobertura del manifest de Pulpit y dos
diferencias de versificación de RV-Verbo). No se modificaron en esta tarea.

## Muestreo contra TEI

Se cotejaron el principio, zona media y final de ambos volúmenes, incluidos:

- introducción de Génesis, Génesis 27:7 y 50:26;
- introducción de Salmos, Salmos 74:8 y 150:6;
- Isaías 58:1, 59:1 y 66:24;
- introducción de Jeremías, Jeremías 26:24 y 52:34;
- introducción de Mateo, Mateo 14:13 y 28:20;
- Apocalipsis 1:1, 12:11 y 22:21.

El orden y el texto de las notas coinciden con los elementos `<note>` del TEI.
Los elementos `<p>` que contienen el texto bíblico impreso no se publican.

## Tamaños y carga

- Contenido JSON: 26.267.856 bytes.
- Índices: 3.296.640 bytes en total, divididos por libro.
- Archivo de contenido mayor: `PSA.json`, 1.837.254 bytes.
- Índice mayor: `PSA.index.json`, 274.334 bytes.
- Manifest: 9.810 bytes.

No se activó `chapterSplit`: ningún libro individual alcanza un tamaño que
justifique alterar el patrón por libro, y el loader descarga solo el libro del
comentario activo. Los demás comentarios siguen usando sus índices livianos.
