# Wave 1 — estado para reanudar

Fecha de pausa: 2026-08-26 (actualizado antes de reiniciar el equipo)

## 1. Matthew Poole — completado

- Commit: `7279abda` (`feat(commentary): add Matthew Poole annotations`).
- Módulo: `matthew-poole-annotations`.
- Cobertura: 66 libros, 1.188 capítulos con notas, 25.970 entradas.
- Fuente: EEBO-TCP A55363 y A55368, ambos CC0.
- Validación y procedencia: `review/commentaries/matthew-poole/`.
- No se modificó el esquema, loader, interfaz, Worker, caché ni sistema de
  traducción de Verbo.

## 2. John Trapp — completado (55 de 66 libros, decisión de Juan)

Juan decidió explícitamente publicar la cobertura disponible en vez de
seguir esperando fuentes CC0 para los 11 libros faltantes ("se sube lo
que aya, preparalo", 2026-08-26). Módulo:
`biblia/modules/commentaries/trapp-commentary/`, registrado en
`registry.json → commentaries` (Trapp no es Padre de la Iglesia; a
diferencia de Crisóstomo va en la lista normal de comentarios). Nombre:
"John Trapp — Commentary (55 of 66 books)" — nunca "Complete Commentary".
18.969 entradas, 22 anomalías de numeración documentadas y corregidas o
excluidas con evidencia (nunca adivinadas). Detalle completo:
`review/commentaries/john-trapp/PROVENANCE.md` y `VALIDATION.md`.

Se completó el inventario TCP y se descargaron los seis XML para inspección.

| TCP | Cobertura comprobada | Edición | Bytes | SHA-256 |
|---|---|---|---:|---|
| A94797 | Génesis–Deuteronomio | Londres, 1649/1650 | 2.546.397 | `a1b0ef079a728f6ff40b8bc3d80bf5a413dca2cd6e08433eee4a62be293b05d5` |
| A63066 | Esdras, Nehemías, Ester, Job, Salmos | Londres, 1657 | 5.977.533 | `8899d8ef3b1af3be79b96feba3a19857f2c485854e98ab5e5789f22d0e991d4f` |
| A63069 | Proverbios–Daniel | Londres, 1660 | 5.785.516 | `0622c547e10058daae32da35e8cedef3e9cd5cc5e8eecf8c65315b8973248744` |
| A63068 | Doce Profetas Menores | Londres, 1654 | 5.622.895 | `1433f8113cb45b34400e1effacb259cdc15ff4789993ddff9348699457cab69b` |
| A63067 | Mateo, Marcos y Lucas solamente | Londres, 1647 | 4.838.972 | `63d2f9a9e54439cce653aa8e3bac1bc5a6f622ef0d4fd74321dd8d02d7957c1f` |
| A63065 | Romanos–Apocalipsis | Londres, 1647 | 2.919.407 | `440b7caa1fc282bccd576ad0559dd29ac2fe6d788dcce7d9fbbf00756834dcf0` |

Cada XML está disponible en:

`https://raw.githubusercontent.com/textcreationpartnership/<TCP>/master/<TCP>.xml`

Cada registro bibliográfico y su evidencia de derechos está en:

`https://name.umdl.umich.edu/<TCP>.0001.001`

Los seis encabezados TEI declaran CC0 1.0 para la transcripción codificada; la
renuncia no se extiende a imágenes de página ni archivos suplementarios.

### Motivo de la detención

Los TEI CC0 localizados cubren 55 de los 66 libros. Faltan:

- Josué, Jueces, Rut, 1–2 Samuel, 1–2 Reyes y 1–2 Crónicas;
- Juan y Hechos.

A63067 lleva un título que promete los cuatro Evangelios y Hechos, pero el XML
concreto contiene solo tres divisiones `commentary` y termina al final de Lucas
24:53. Por tanto, no se debe inferir cobertura desde el título del registro.

No se usarán StudyLight, Truth According to Scripture, SermonIndex, PDFs
modernos ni otros sitios secundarios para rellenar los once libros sin una
procedencia y licencia del texto digital equivalentes. Tampoco se publicarán
los 55 libros como `Complete Commentary` sin una decisión editorial explícita.

## Punto exacto de reanudación (histórico — ver estado real al final del archivo)

1. ~~Mantener Trapp detenido~~ — resuelto, ver sección 2 arriba: Juan pidió
   publicar los 55 libros disponibles, ya hecho.
2. Lightfoot quedó completado; continuar Wave 1 con Martin Luther,
   *Commentary on Galatians*, edición inglesa abreviada de Theodore Graebner.
3. No tocar arquitectura de Verbo: cada comentario debe adaptarse al esquema
   existente. Si no puede hacerlo fielmente, detenerlo y documentarlo.

El único archivo ajeno/no rastreado observado antes de esta tarea es
`DIAGNOSTICO-INDEXACION-2026-08-26.md`; debe preservarse y no incluirse en
commits de comentarios.

## 3. J. B. Lightfoot — completado

La importación de *St. Paul's Epistles to the Colossians and to Philemon* se
completó y validó con la arquitectura existente. Archivos versionados:

- `tools/import_lightfoot_colossians_philemon.py`
- `review/commentaries/jb-lightfoot/`
- `biblia/modules/commentaries/lightfoot-colossians-philemon/`

Fuente comprobada:

- Project Gutenberg #50857: `https://www.gutenberg.org/ebooks/50857`
- HTML: `https://www.gutenberg.org/cache/epub/50857/pg50857-images.html`
- Edición: Macmillan, Londres, 1875.
- Archivo temporal usado: `/tmp/pg50857-images.html` (no sobrevivirá
  necesariamente al reinicio).
- Tamaño: 1.934.414 bytes.
- SHA-256:
  `27b4b4c4dbf1f74131abb4e480963ae43739ebb570a3c7b7928ae503c5c27b09`.

Resultado final: 195 entradas; cobertura completa de los 95 versículos de
Colosenses y los 25 de Filemón; 50 entradas editoriales en capítulo 0; índices
livianos por libro; ninguna entrada supera 18.000 caracteres. Las pruebas web
y móvil confirmaron selector, indicador de disponibilidad y carga exclusiva
del libro activo. Detalle completo en
`review/commentaries/jb-lightfoot/VALIDATION.md`.

Regla reafirmada por el usuario: no modificar nada de Verbo para acomodar un
comentario. El corpus y su conversión deben ajustarse a las convenciones ya
existentes; si no es posible con fidelidad, detener y documentar.

## 4. Martin Luther — completado

- Módulo: `luther-galatians-graebner`.
- Fuente: Project Gutenberg #1549, traducción inglesa abreviada de Theodore
  Graebner; 565.453 bytes; SHA-256
  `49d6b0fe3e3b1bcf79edef1371b80cd3c2d3d24cf5f2503272b950a2e7ba73e7`.
- Cobertura: los 149 versículos de Gálatas 1–6.
- Entradas: 231; dos corresponden a prefacio/introducción en capítulo 0.
- Se eliminaron las cabeceras separables que reproducían el texto base, no las
  citas integradas en la exposición.
- Validación, tamaños, muestras y pruebas de interfaz:
  `review/commentaries/martin-luther-galatians/VALIDATION.md`.

## 5. Juan Crisóstomo — Homilías sobre Mateo: completado (1 de 17 libros)

Corrección de arquitectura de Juan a mitad de tarea: Crisóstomo es Padre de
la Iglesia, va en `biblia/modules/patristic/` (lectura completa, 6 volúmenes
por tamaño) + sincronizado en `patristicByVerse` (nunca en la lista plana
`commentaries`) — mismo patrón que Ignacio, Policarpo, Ireneo, etc. Detalle
completo: `review/commentaries/chrysostom-mateo/PROVENANCE.md` y
`VALIDATION.md`.

- Fuente: CCEL NPNF1-10, ThML/XML, SHA-256
  `e110c98b1f444147bf7baf79e46e56ae6c6a1f0b2983e6fc52f2356fac7f858f`.
- 86 homilías, 28 capítulos de Mateo cubiertos, 2 sin cierre de rango seguro
  (documentadas, no inventadas).
- Módulos: `biblia/modules/patristic/chrysostom-mateo-1..6/` (lectura
  completa) + `biblia/modules/commentaries/chrysostom-mateo/` (por
  versículo, solo en `patristicByVerse`).
- Importador: `tools/import_chrysostom_matthew.py` (reutilizable para los
  próximos libros de Crisóstomo, con ajustes por volumen).
- Probado en navegador real (Chrome vía Playwright): badges por versículo,
  estante, buscador, apertura de homilía y traducción EN→ES bajo demanda,
  todo sin cambios de código ni errores de consola.
- **Limitación de rendimiento — resuelta el mismo día**: se extendió
  `loadLinkedEntries()` con un parámetro opcional `lightweight` (ver
  `perf(patristic): lightweight index path...`, commit `b0d16280`);
  `chrysostom-mateo` ahora tiene `books/MAT.index.json` (11,7 KB) y el
  cálculo del badge por versículo ya no descarga los 2,5 MB completos.
  Mecanismo disponible para los próximos libros de Crisóstomo.

## 6. John Trapp — completado (55 de 66 libros)

Ver sección 2 (arriba, actualizada) y
`review/commentaries/john-trapp/PROVENANCE.md` /`VALIDATION.md`.

## 7. John Gill — detenido, sin fuente utilizable localizada

Juan pidió revisar Gill después de Trapp. El único módulo SWORD/e-Sword de
Gill fácilmente localizable (`gill.conf`, repo `mjdenham/sword-modules`,
el mismo que circula en e-Sword/SwordSearcher) declara explícitamente:

```
About: The New John Gill's Exposition... Modernised and adapted for the
       computer. Editor: Larry Pierce
       All Rightes Reserved, Larry Pierce, Winterbourne, Ontario
```

Sin `DistributionLicense=Public Domain` y con "All Rights Reserved"
explícito del editor de la versión modernizada — bloqueado por la regla
original de Wave 1 ("si el .conf no confirma claramente dominio público,
no importar"). No se encontró una transcripción alternativa CC0/dominio
público de calidad comparable a EEBO-TCP (la que sí existe para Poole y
Trapp); la fuente serían escaneos crudos del impreso original de
1809–1810 sin transcripción moderna verificada. Juan indicó explícitamente
no querer nada que no esté medianamente digitalizado por ahora ("no
quiero nada que no este medianamente digitalizado por ahora",
2026-08-26). **Gill queda detenido sin fecha; no reintentar salvo que
aparezca una transcripción digital verificable y con licencia clara.**

## Estado real y punto de reanudación (2026-08-26, fin de esta sesión)

Orden de Wave 1: Poole ✅ · Trapp ✅ (55/66) · Lightfoot ✅ · Luther ✅ ·
Crisóstomo 🔄 (solo Mateo, 1 de 17 libros previstos) · Gill ⏸️ detenido
(sin fuente utilizable, ver sección 7).

Punto de reanudación, en orden:

1. Los 16 libros restantes de Crisóstomo (Juan, Hechos, Romanos, 1–2
   Corintios, Gálatas, Efesios, Filipenses, Colosenses, 1–2 Tesalonicenses,
   1–2 Timoteo, Tito, Filemón, Hebreos), mismo patrón dual patristic +
   patristicByVerse ya establecido y el índice liviano ya disponible.
2. Gill: solo si Juan aporta o autoriza una fuente digital concreta y
   verificable con licencia clara (ver sección 7).
3. No tocar arquitectura de Verbo salvo necesidad verificada y documentada
   (como la extensión de `loadLinkedEntries`, quirúrgica y retrocompatible).
