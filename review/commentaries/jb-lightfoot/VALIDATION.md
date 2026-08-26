# Validación — J. B. Lightfoot, Colossians and Philemon

Fecha: 2026-08-26

## Resultado

- Módulo: `lightfoot-colossians-philemon`.
- Libros: Colosenses y Filemón.
- Entradas: 195, todas con ID único y contenido no vacío.
- Colosenses: 163 entradas (45 de introducción/apéndices/correcciones y 118
  entradas exegéticas); cobertura de los 95 versículos canónicos.
- Filemón: 32 entradas (5 de introducción y 27 exegéticas); cobertura de los
  25 versículos canónicos.
- Referencias ausentes o fuera de rango: 0.
- Caracteres griegos Unicode conservados: 95.578.
- Notas al pie incorporadas desde referencias de la fuente: 765.
- Mayor entrada: 17.996 caracteres. Las secciones mayores se dividieron entre
  bloques HTML completos; ninguna palabra, frase ni etiqueta fue cortada.

## Tamaños

| Archivo | Bytes |
|---|---:|
| `books/COL.json` | 1.290.731 |
| `books/COL.index.json` | 21.965 |
| `books/PHM.json` | 134.716 |
| `books/PHM.index.json` | 4.326 |
| `manifest.json` | 1.352 |
| `coverage.json` | 397 |

Contenido completo de libros: 1.425.447 bytes. Índices livianos: 26.291
bytes. No se activó `chapterSplit`: ninguno de los dos archivos de libro
justifica apartarse de la convención normal existente.

## Comandos y comprobaciones

```bash
python3 -m py_compile tools/import_lightfoot_colossians_philemon.py
python3 tools/import_lightfoot_colossians_philemon.py --cache /tmp
python3 tools/build_commentary_index.py
python3 tools/build_registry_catalog.py
python3 tools/validate_commentary_module.py lightfoot-colossians-philemon
git diff --check
```

El validador específico devolvió `entries=195 errors=0`. También se comparó
la cobertura con `asv-1901`, la versificación local de control: no faltó ni
sobró ningún versículo en COL o PHM. El HTML fue parseado de nuevo y solo usa
`p`, `strong`, `em`, `blockquote`, `ul`, `ol` y `li`, sin atributos, scripts,
CSS, navegación ni marcas de Project Gutenberg.

Se ejecutó una reconstrucción completa adicional. El SHA-256 combinado de
todos los archivos del módulo fue idéntico antes y después:
`84a028fcb8e1c5e55fc33d3875c0788b1355295b3dc6499ecf76afb802aadac0`.

`tools/audit_content.py` reconoce el módulo y no produjo errores para
Lightfoot. La auditoría global terminó con seis incidencias preexistentes y
ajenas a esta integración: HOS 11, JON 1 y los conteos registrados de JFB,
K&D, Wesley y Pulpit. No se modificaron esos recursos.

## Muestreo contra la fuente oficial

Se localizaron y compararon directamente en el HTML Gutenberg los párrafos
fuente de estas entradas:

- COL 1:1–2 (comienzo);
- COL 2:19 (zona media);
- COL 4:18 (final);
- PHM 1:1–3 (comienzo);
- PHM 1:12 (zona media);
- PHM 1:25 (final).

Los seis comienzos textuales coinciden con los bloques `c033`/`c034` de la
fuente. El texto griego continuo `c032` no fue publicado. Las citas y palabras
griegas que forman parte de la argumentación sí se conservaron.

## Comprobación web y móvil

Se sirvió el repositorio localmente y se probó con Chrome mediante el mismo
front-end de Verbo, usando BSB, Colosenses 1:1:

| Vista | Resultado |
|---|---|
| 390×844 | Selector abierto, opción `● Lightfoot`, 13 comentarios, 84 tarjetas de COL 1 cargadas |
| 1440×900 | Selector abierto, opción `● Lightfoot`, 13 comentarios, 84 tarjetas de COL 1 cargadas |

En ambos casos se seleccionó `lightfoot-colossians-philemon`, se mostró el
autor correcto y se abrió la primera sección editorial. La traza de recursos
confirmó carga del manifiesto/índice y de `books/COL.json` al activar el
comentario; `books/PHM.json` no se solicitó. Android usa este mismo front-end
web empaquetado, y no existe una implementación nativa separada que requiera
adaptación.

## Traducción

El módulo permanece en inglés (`language: en`). No se cambió el sistema común
de traducción ni su caché. La segmentación editorial del corpus deja cada
entrada por debajo de 18.000 caracteres, de modo que se ajusta al límite ya
existente sin modificar cliente, Worker ni los once comentarios anteriores.
