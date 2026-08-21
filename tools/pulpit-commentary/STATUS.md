# Estado de incorporación de The Pulpit Commentary

Última actualización: 2026-08-21 (America/Costa_Rica).

## Estado general

- Meta: 66 libros completos, corregidos contra facsímiles de dominio público,
  sincronizados con Biblia Verbo y validados antes de publicación.
- Fuentes catalogadas: 66 libros, 77 PDF en `sources.json`.
- Borradores estructuralmente sincronizados: 25 libros.
- Libros publicados y aprobados: 5 (Filemón, Abdías, 2 Juan, 3 Juan y Judas),
  por aprobación humana expresa de Juan el 21 de agosto de 2026.
- Entradas aprobadas con `editorialStatus: reviewed`: 264. Entradas todavía
  provisionales con `editorialStatus: ocr-unreviewed`: 5,878.
- El módulo está registrado en `biblia/modules/registry.json`. Su manifest solo
  expone los cinco libros completamente cotejados y aprobados; los otros 20
  permanecen como artefactos internos fuera del catálogo. De las 6,142 entradas
  preparadas, 264 están aprobadas y 5,878 conservan `ocr-unreviewed`.

| Libro | Entradas | Grupos fuente | Capítulos | Errores estructurales | Cola OCR |
| --- | ---: | ---: | ---: | ---: | ---: |
| Génesis | 1,274 | 1,174 | 50 | 0 | 908 |
| Esdras | 264 | 254 | 10 | 0 | 164 |
| Nehemías | 391 | 376 | 13 | 0 | 207 |
| Ester | 312 | 288 | 10 | 0 | 193 |
| Filemón | 56 | 48 | 1 | 0 | 0 |
| Abdías | 75 | 63 | 1 | 0 | 0 |
| 2 Juan | 29 | 25 | 1 | 0 | 0 |
| 3 Juan | 31 | 23 | 1 | 0 | 0 |
| Judas | 73 | 53 | 1 | 0 | 0 |
| Tito | 113 | 103 | 3 | 0 | 84 |
| Santiago | 117 | 103 | 5 | 0 | 106 |
| 2 Pedro | 72 | 68 | 3 | 0 | 66 |
| 2 Timoteo | 108 | 99 | 4 | 0 | 92 |
| 1 Pedro | 167 | 154 | 5 | 0 | 151 |
| 1 Juan | 130 | 115 | 5 | 0 | 127 |
| 1 Timoteo | 192 | 171 | 6 | 0 | 175 |
| 1 Tesalonicenses | 174 | 153 | 5 | 0 | 146 |
| 2 Tesalonicenses | 93 | 80 | 3 | 0 | 83 |
| Efesios | 292 | 269 | 6 | 0 | 267 |
| Filipenses | 223 | 177 | 4 | 0 | 203 |
| Colosenses | 179 | 162 | 4 | 0 | 165 |
| Gálatas | 241 | 218 | 6 | 0 | 224 |
| 2 Corintios | 441 | 416 | 13 | 0 | 396 |
| Romanos | 390 | 340 | 16 | 0 | 370 |
| 1 Corintios | 705 | 639 | 16 | 0 | 625 |

Los conteos de la cola son señales automáticas prioritarias; no sustituyen la
revisión completa de cada entrada contra el facsímil.

## Fuentes y archivos de trabajo

- Génesis usa el facsímil de Theology on the Web documentado en `README.md`.
- Esdras, Nehemías y Ester usan como cotejo el volumen XV aportado por el
  usuario: `Noor-Book.com  تعليق المنبر 2 .pdf` (554 páginas). Su procedencia,
  recompresión y hashes están documentados en `supplemental-sources.json`.
- La capa OCR canónica de Internet Archive para ese volumen fue comprobada con
  el identificador `cu31924101105041`.
- Los stagings y reportes regenerables están en `/tmp`; los 25 pares
  normalizados de libro e índice están en el módulo como artefactos de revisión.
  Ninguno es publicable mientras conserve `ocr-unreviewed` o quede fuera del
  manifest.
- El facsímil de Éxodo, volumen 1, fue descargado y validado temporalmente como
  `/tmp/pulpit-exodus-v1-complete.pdf`, pero Éxodo todavía no se ha convertido.
- El facsímil de Filemón fue descargado y validado (1,148,536 bytes, 31 páginas,
  SHA-256 `65660944faffa6d20676960e2906b241537af8a51c60c09259b55322942cc24b`).
  Su borrador y sus reportes temporales son `/tmp/pulpit-philemon-staging.json`,
  `/tmp/pulpit-philemon-audit.json` y `/tmp/pulpit-philemon-review.json`. Se
  cotejaron y registraron catorce correcciones estructurales o inequívocas del
  OCR en las páginas físicas 14, 16, 17, 19, 20, 23, 24, 25, 27 y 29; la revisión
  integral continúa abierta. La regeneración con `pdftotext -raw` corrigió el
  entrelazado de las dos columnas que sufría el borrador anterior: recuperó los
  25 versículos de la exposición y varios encabezados homiléticos omitidos.
- Los facsímiles de Abdías, 2 Juan, 3 Juan y Judas también fueron descargados,
  validados y convertidos temporalmente. Sus límites de capítulo único fueron
  cotejados visualmente y sus borradores no tienen errores estructurales.
- Tito, Santiago y 2 Pedro fueron delimitados capítulo por capítulo contra sus
  facsímiles y convertidos a borradores temporales sin errores estructurales.
  Cuatro encabezados numéricos degradados por el OCR fueron corregidos con
  evidencia visual registrada en sus archivos de correcciones.
- 2 Timoteo, 1 Pedro y 1 Juan fueron delimitados capítulo por capítulo contra
  sus facsímiles y convertidos a borradores temporales sin errores
  estructurales.
- 1 Timoteo, 1 Tesalonicenses y 2 Tesalonicenses fueron delimitados capítulo
  por capítulo y convertidos sin errores estructurales. En 2 Tesalonicenses se
  corrigió con evidencia visual un `Ver. 18` espurio a `Ver. 13`.
- Efesios, Filipenses y Colosenses fueron delimitados y convertidos sin errores
  estructurales. Se corrigieron visualmente `Efesios 5:32` y el rango
  discontinuo `Filipenses 3:15, 16`, ambos degradados por el OCR.
- Gálatas y 2 Corintios fueron delimitados y convertidos sin errores
  estructurales. La diferencia entre los 14 versículos del facsímil inglés de
  2 Corintios 13 y los 13 de Biblia Verbo quedó documentada explícitamente.
- Romanos fue delimitado en sus 16 capítulos y convertido sin errores
  estructurales; dos encabezados numéricos degradados se corrigieron contra el
  facsímil.
- 1 Corintios fue delimitado en sus 16 capítulos, convertido y auditado sin
  errores estructurales. El facsímil temporal `/tmp/pulpit-1co.pdf` fue descargado y
  validado (22,550,075 bytes, 591 páginas, SHA-256
  `90ca786144e05f022e67fcdfd0167510f6c96fe491d713293ce5a4a870fa9097`).
  Su OCR está en `/tmp/pulpit-1co.txt`. Los límites de sus 16 capítulos fueron
  cotejados visualmente en las páginas físicas 8, 65, 99, 139, 172, 200, 232,
  271, 295, 331, 370, 405, 431, 465, 492 y 558. El borrador y el reporte están
  en `/tmp/pulpit-1co-staging.json` y `/tmp/pulpit-1co-audit.json`.

## Evidencia versionada

- Límites verificados: `boundaries/GEN.json`, `boundaries/EZR.json`,
  `boundaries/NEH.json`, `boundaries/EST.json`, `boundaries/OBA.json`,
  `boundaries/PHM.json`, `boundaries/2JN.json`, `boundaries/3JN.json` y
  `boundaries/JUD.json`, además de `boundaries/TIT.json`,
  `boundaries/JAS.json`, `boundaries/2PE.json`, `boundaries/2TI.json`,
  `boundaries/1PE.json`, `boundaries/1JN.json`, `boundaries/1TI.json`,
  `boundaries/1TH.json`, `boundaries/2TH.json`, `boundaries/EPH.json`,
  `boundaries/PHP.json`, `boundaries/COL.json`, `boundaries/GAL.json` y
  `boundaries/2CO.json`, `boundaries/ROM.json` y `boundaries/1CO.json`.
- Correcciones de referencias: `corrections/GEN.json`, `corrections/EZR.json`,
  `corrections/NEH.json`, `corrections/EST.json`, `corrections/OBA.json`,
  `corrections/PHM.json`, `corrections/2JN.json`, `corrections/3JN.json` y
  `corrections/JUD.json`, además de `corrections/TIT.json`,
  `corrections/JAS.json`, `corrections/2PE.json`, `corrections/2TI.json`,
  `corrections/1PE.json`, `corrections/1JN.json`, `corrections/1TI.json`,
  `corrections/1TH.json`, `corrections/2TH.json`, `corrections/EPH.json`,
  `corrections/PHP.json`, `corrections/COL.json`, `corrections/GAL.json` y
  `corrections/2CO.json`, `corrections/ROM.json` y `corrections/1CO.json`.
- Herramientas: `discover_sources.py`, `audit_ocr.py`, `build_book.py` y
  `audit_staging.py`. `build_book.py` admite correcciones exactas del cuerpo OCR
  documentadas con página y razón en `bodyTextCorrections`.
- `git diff --check` estaba limpio al terminar las últimas validaciones.

## Reanudación (2026-08-17)

### Pausa guardada (2026-08-18)

- Trabajo pausado por solicitud del usuario después de cotejar íntegramente las
  exposiciones de Filemón 1:1–4. Hay 4 de 50 entradas con estado individual
  `reviewed`; las 46 restantes y el libro completo conservan
  `ocr-unreviewed`.
- Siguiente unidad exacta: exposición `Ver. 5.`, página física 14 del
  facsímil canónico de Filemón.
- Temporales regenerados: `/tmp/pulpit-philemon.pdf`,
  `/tmp/pulpit-philemon.txt`, `/tmp/pulpit-philemon-staging.json` y
  `/tmp/pulpit-philemon-audit.json`. Si desaparecen, regenerarlos según este
  documento; el facsímil verificado conserva SHA-256
  `65660944faffa6d20676960e2906b241537af8a51c60c09259b55322942cc24b`.
- Última validación: 50 entradas, 45 grupos fuente, 0 errores estructurales,
  39 señales automáticas y `publishable: false`. No se modificaron catálogo,
  índices ni módulo público.

- Se reanudó la revisión integral de Filemón y se descubrió que la extracción
  `-layout` entrelazaba las columnas del facsímil. El flujo documentado usa
  ahora `pdftotext -raw`; los borradores anteriores de otros libros deben
  comprobar su orden de columnas antes de considerarlos estructuralmente
  fiables.
- Filemón conserva ahora 50 entradas en 45 grupos, 0 errores estructurales y 39
  entradas todavía señaladas para revisión; no debe cambiarse el estado global
  `ocr-unreviewed`. Las exposiciones de los versículos 1–4 están ya cotejadas
  íntegramente y marcadas individualmente como `reviewed`; quedan 46
  entradas por cotejar, incluidas las que no aparecen en la cola automática.
- Ya quedaron versionadas catorce correcciones estructurales o inequívocas y
  cuatro reemplazos de entrada cotejados en `corrections/PHM.json`. Al reanudar,
  continuar con la exposición de `Ver. 5.` en la página física 14 y después con
  las demás señales del reporte `/tmp/pulpit-philemon-audit.json`, cotejando
  también las entradas no señaladas contra el facsímil.
- Los archivos de `/tmp` pueden desaparecer entre sesiones. Si faltan, volver a
  descargar el facsímil de Filemón indicado en `sources.json`, extraerlo con
  `pdftotext -layout` y regenerar el borrador y la auditoría antes de continuar.
- No se modificaron el catálogo, los índices, el módulo público ni Cloudflare.

### Reanudación (2026-08-20)

- Se regeneraron el facsímil, la capa de texto `-raw`, el borrador y la auditoría
  temporales de Filemón. El PDF volvió a coincidir con el tamaño, las 31 páginas
  y el SHA-256 ya documentados.
- La exposición de `Ver. 5.` se cotejó íntegramente contra las dos columnas de
  la página física 14 y quedó registrada como `reviewed`, incluidas las
  expresiones griegas que el OCR había degradado.
- La evidencia versionada de Filemón cubre ahora las 25 exposiciones completas y
  veintiuna entradas homiléticas; quedan 7 entradas del módulo por
  cotejar. Los 24 reemplazos de exposición
  producen 25 entradas porque `Vers. 23, 24.` se divide en dos rangos bíblicos.
  El staging temporal previo solo reflejaba las primeras 8, por lo que
  la preparación del piloto aplica los reemplazos más recientes de
  `corrections/PHM.json`. El libro completo y sus 53 entradas en el módulo se
  mantienen deliberadamente como `ocr-unreviewed` hasta decisión manual de
  Juan. La última auditoría del staging regenerado generó 11 señales
  automáticas, 46 grupos fuente y 0 errores estructurales.
- También se cotejaron íntegramente las exposiciones de `Ver. 6.` y `Ver. 7.`
  contra la columna derecha de la página física 14, restaurando el griego, las
  citas latinas y las referencias dañadas por el OCR.
- También se cotejó la exposición de `Ver. 8.` entre las páginas físicas 14–15.
- También se cotejaron las exposiciones de `Ver. 9.` a `Ver. 14.` y se
  versionaron sus reemplazos completos en `corrections/PHM.json`.
- La exposición de `Ver. 15.` se cotejó íntegramente contra la columna izquierda
  de la página física 16 y se restauraron palabras, puntuación, referencias y
  la frase latina degradadas por el OCR.
- Las exposiciones de `Ver. 16.` y `Ver. 17.` también se cotejaron íntegramente
  contra la columna izquierda de la página física 16, restaurando palabras,
  puntuación, referencias y términos griegos degradados por el OCR.
- La exposición de `Ver. 18.` se cotejó íntegramente contra la columna izquierda
  de la página física 16, restaurando palabras, puntuación, siglas de códices y
  el término transliterado degradados por el OCR.
- Las exposiciones de `Ver. 19.` a `Ver. 22.` se cotejaron íntegramente en las
  páginas físicas 16–17, restaurando citas latinas y griegas, siglas de códices,
  referencias, nombres y puntuación.
- Las exposiciones combinadas de `Vers. 23, 24.` y la de `Ver. 25.` se cotejaron
  íntegramente contra ambas columnas de la página física 17. Con ello quedó
  terminada la sección de exposición.
- El pipeline identifica ahora cada reemplazo por capítulo, encabezado y sección
  para impedir colisiones entre exposición y homilética; los reemplazos antiguos
  sin `section` siguen correspondiendo a exposición.
- Las homilías `Ven. 1-3.` (encabezado corregido a `Vers. 1-3.` para
  referencias) y `Ver. 3.` se cotejaron íntegramente en las páginas físicas
  17–18; ambas se registran con `section: homiletics` para distinguirlas de las
  exposiciones con encabezados coincidentes.
- La homilía `Vers. 4, 5.` se cotejó íntegramente entre las páginas físicas
  18–19 y produce correctamente dos entradas del módulo, una por cada
  versículo.
- El cotejo de la página física 19 demostró además que el encabezado siguiente
  dice `Vers. 5, 6.`, no `Ver. 6.` como afirmaba una corrección anterior. El
  rango quedó reparado y Filemón pasó de 50 a 51 entradas válidas.
- La homilía OCR `Vere. 6, 6.` se cotejó íntegramente contra la página física 19
  y quedó asociada al rango demostrado `Vers. 5, 6.`, produciendo dos entradas
  válidas del módulo.
- Las homilías OCR `Vera. 8-10.` (corregida a `Vers. 8-10.`) y `Ver. 11.` se
  cotejaron íntegramente entre las páginas físicas 19–20, restaurando fechas,
  citas, referencias, numeración y puntuación.
- La homilía `Ver. 15.` y las dos homilías consecutivas con encabezado
  `Ver. 16.` se cotejaron íntegramente entre las páginas físicas 20–22. La
  primera de `Ver. 16.` conserva una nota editorial adicional sobre cifras e
  interpretación histórica del siglo XIX, sin alterar el texto original.
- El preparador del módulo admite ahora ocurrencias repetidas del mismo
  encabezado y las consume por grupo fuente en orden, preservando correctamente
  rangos divididos como `Vers. 23, 24.`.
- La homilía `Ver. 19.` se cotejó íntegramente entre las páginas físicas 22–23.
  Después se cotejaron las primeras homilías firmadas por colaboradores:
  `Vers. 1, 2.` y `Ver. 4.`, ambas de `W. M. S.` en la página física 23. El
  autor individual queda conservado en el módulo.
- El pipeline admite ahora `author` y `editorialNote` por reemplazo. Dos notas
  históricas quedaron incorporadas sin modificar el texto inglés: las cifras y
  lectura histórica sobre esclavitud, y la anécdota de la Guerra de Crimea.
- El cotejo de la página física 24 descubrió una homilía `Vers. 9, 10.` omitida
  por el staging porque el OCR había degradado el encabezado a `Vel'll.`. Se
  recuperó el grupo completo, elevando Filemón de 51 a 53 entradas y el total de
  los 25 libros de 6,039 a 6,041.
- Las homilías `Vers. 9, 10.`, `Vers. 19, 20.` y `Ver. 22.`, todas firmadas por
  `W. M. S.`, quedaron cotejadas contra la página física 24. La última conserva
  una nota editorial sobre las tradiciones decimonónicas acerca de la muerte de
  Pablo.
- La homilía OCR `Vera. 1-3.` (corregida a `Vers. 1-3.`), firmada por `T. C.`,
  quedó cotejada entre las páginas físicas 24–25. Conserva una nota editorial
  sobre las identificaciones tradicionales de Filemón, Apfia y Arquipo.
- Siguiente unidad exacta: homilética OCR `Vere. 4--7.` (corregida a
  `Vers. 4-7.`), página física 25 del
  el facsímil canónico de Filemón.
  facsímil canónico de Filemón. No se modificaron registro ni catálogos.
- La homilía `Vere. 4--7.` quedó cotejada íntegramente. El cotejo visual de las
  páginas físicas 26 y 28 descubrió además dos homilías que el OCR había
  absorbido dentro de entradas vecinas: `Vers. 8-11.` y `Vers. 18, 19.`. Ambas
  se recuperaron mediante correcciones textuales reproducibles.
- Se cotejaron las cinco homilías finales (`Ver. 17.`, `Vers. 18, 19.`,
  `Ver. 20.`, `Vers. 21, 22.` y `Vers. 23-25.`) hasta la página física 30.
  Filemón queda completo en la capa de staging: 56 entradas, 48 grupos fuente,
  0 errores estructurales y 0 señales pendientes. Las 56 entradas del módulo
  siguen deliberadamente en `ocr-unreviewed`; Juan no ha aprobado el libro ni
  se ha agregado al manifest.
- Al iniciar Abdías se regeneró su staging desde la capa OCR canónica con el
  conversor actualizado. El staging antiguo había perdido grupos que el flujo
  actual sí reconoce; el libro pasó de 52 entradas/43 grupos a 67 entradas/57
  grupos, con 0 errores estructurales y 53 señales automáticas. El módulo y su
  índice se sincronizaron en estado `ocr-unreviewed`; el cotejo integral de sus
  57 grupos queda en curso desde la página física 14.
- En la primera página de exposición de Abdías se recuperaron tres encabezados
  que el OCR había absorbido (`Vers. 3, 4.`, `Ver. 3.` y `Vers. 5, 6.`), por lo
  que el estado estructural actual es 72 entradas y 60 grupos. Ya están
  cotejados los cinco primeros grupos (`Vers. 1-16.`, `Vers. 1-9.`, `Ver. 1.`,
  `Ver. 2.` y `Vers. 3, 4.`), que producen seis entradas por los rangos
  divididos. Después se cotejaron `Ver. 3.`, `Ver. 4.`, `Vers. 5, 6.`,
  `Ver. 5.` y `Ver. 6.`. A continuación quedaron cotejados `Ver. 7.`,
  `Vers. 8, 9.`, `Ver. 8.`, `Ver. 9.` y el sumario recuperado
  `Vers. 10-14.`. Después se cotejaron las exposiciones de `Ver. 10.` a
  `Ver. 15.` y el sumario `Vers. 15, 16.`. Después quedaron cotejados
  `Ver. 16.`, los encabezados `Vers. 17-21.` y `Vers. 17-20.`, y las
  exposiciones de `Ver. 17.` a `Ver. 21.`. Con ello se completó toda la sección
  de exposición: el avance actual es 30 de 60 grupos fuente cotejados,
  34 entradas de staging revisadas y 30 grupos homiléticos pendientes. Las dos
  homilías consecutivas de `Ver. 1.` (`The servant of Jehovah` y `The vision`)
  también quedaron cotejadas entre las páginas físicas 20–21; el avance total
  llegó entonces a 32 de 60 grupos. Después se cotejaron las homilías
  `Vers. 3, 4.`, `Ver. 7.`, `Vers. 8, 9.`, `Vers. 10-14.`, `Vers. 15, 16.`,
  `Ver. 17.` y `Ver. 21.`. El encabezado OCR de `The treacherous betrayed`
  quedó corregido de `Ver. 1.` a `Ver. 7.` contra el facsímil. El avance actual
  llegó entonces a 39 de 60 grupos. La primera homilía de colaboradores,
  `Vers. 1, 2.—The vision of Obadiah`, quedó cotejada en las páginas físicas
  24–26 y conserva la firma `A. C. T.`. El avance actual es 40 de 60 grupos,
  48 entradas revisadas y 20 grupos pendientes. Después se cotejó íntegramente
  `Vers. 1-4.—Edom subdued` en las páginas físicas 26–28, también firmado por
  `A. C. T.`. El avance actual es 41 de 60 grupos, 49 entradas revisadas y
  19 grupos pendientes. Después se cotejó `Ver. 6.—The things of Esau searched
  out` en las páginas físicas 28–30, también firmado por `A. C. T.` y con una
  nota editorial sobre sus ilustraciones contemporáneas de ejecución y violencia
  en Irlanda. El avance actual es 42 de 60 grupos, 50 entradas revisadas y
  18 grupos pendientes. Después se cotejó `Ver. 7.—Unholy alliances` en las
  páginas físicas 30–32, preservando su poema final, la firma `A. C. T.` y una
  nota sobre sus atribuciones históricas. El avance actual es 43 de 60 grupos,
  51 entradas revisadas y 17 grupos pendientes. Después se cotejaron
  `Vers. 8, 9.—False confidences` (páginas físicas 32–33) y
  `Vers. 10-14.—Edom's cruelty` (33–34), ambas firmadas por `A. C. T.`. La
  segunda conserva la clave OCR sin espacio para distinguirla de otra homilía
  anterior con el mismo rango. El avance actual es 45 de 60 grupos,
  54 entradas revisadas y 15 grupos pendientes. Después se cotejó
  `Ver. 11.—Edom as Babylon` en las páginas físicas 34–36, preservando su serie
  de nueve ejemplos y la firma `A. C. T.`. El avance actual es 46 de 60 grupos,
  55 entradas revisadas y 14 grupos pendientes. Después se cotejó
  `Ver. 15.—Recompense is sure` en las páginas físicas 36–38, preservando su
  poema final, la firma `A. C. T.` y una nota contextual para la secuencia
  histórica citada de Pusey y su discusión decimonónica del juicio futuro. El
  avance llegó entonces a 47 de 60 grupos. Después se cotejó
  `Ver. 17.—Safety, sanctity, and sufficiency` en las páginas físicas 38–39. El
  cotejo descubrió además que `Ver. 18.—Truth triumphant` estaba totalmente
  absorbido porque el OCR convirtió el encabezado en `Ver. UL`; se recuperó y
  cotejó en las páginas 39–40. Después se cotejaron
  `Vers. 19, 20.—“Rehoboth.”` (páginas físicas 40–41) y la primera homilía de
  `Ver. 21.—Saviours and judges` (42–43), ambas firmadas por `A. C. T.` y con
  notas editoriales puntuales para sus afirmaciones históricas. Abdías tiene
  entonces 73 entradas y 61 grupos. Después se cotejaron la segunda homilía
  de `Ver. 21.—The kingdom` (páginas 43–44), `Ver. 1.—God and bad men`
  (44–45) y `Vers. 2-5.—Pride` (45–46), las tres firmadas por `D. T.` salvo
  la primera, firmada por `A. C. T.`. El último cotejo descubrió que el OCR
  `Ver& 2-5.` había absorbido por completo la homilía dentro de Ver. 1; la
  corrección estructural elevó Abdías a 74 entradas y 62 grupos. El avance
  entonces fue 54 de 62 grupos. Después se cotejaron `Vers. 6-9.—God in
  retribution` (páginas físicas 46–48) y `Vers. 10-16.—Social cruelty: 1`
  (48–49). El cotejo siguiente descubrió otra omisión: el apóstrofo OCR inicial
  de `Vers. 10-14.—A neighbour's cruelty` impedía reconocer la homilía de
  W. J. Deane, mientras la sustitución de A. C. T. ocupaba accidentalmente el
  encabezado defectuoso de `An old sin`, de D. T. Se separaron y verificaron
  las tres entradas de ese rango, y se cotejó además `Vers. 10, 11.—Social
  cruelty: 2` (página 50). Abdías tiene ahora 75 entradas y 63 grupos; el avance
  entonces fue 58 de 63 grupos. Finalmente se cotejaron `Vers. 12-16.—Social
  cruelty: 3` (páginas físicas 50–51), `Ver. 15.—Social retribution`
  (51–53) y la serie final de D. T., `Ver. 17`, `Ver. 18` y `Vers. 19, 20`
  (53–55). Abdías queda completo para revisión humana de aprobación: 75 de 75
  entradas y 63 de 63 grupos cotejados contra el facsímil, con 0 errores
  estructurales y cola OCR 0. El artefacto del módulo mantiene, no obstante,
  las 75 entradas como `ocr-unreviewed`.
- Al iniciar el cotejo de 2 Juan, la regeneración estricta reveló que el
  artefacto preliminar de 20 entradas y 17 grupos estaba incompleto. El
  facsímil confirmó que `Ver. 18` en la exposición era en realidad `Ver. 13`;
  corregida esa referencia, la estructura real contiene 28 entradas y 24
  grupos. Se cotejaron los siete primeros grupos de exposición —`Vers. 1-4`,
  `Ver. 1`, `Ver. 3`, `Ver. 4`, `Vers. 5-11`, `Ver. 5` y `Ver. 6`— en las
  páginas físicas 2–3. Después se cotejaron `Ver. 7`, `Ver. 8`, `Ver. 9`,
  `Ver. 10`, `Ver. 11`, `Vers. 12, 13`, `Ver. 12` y el `Ver. 13` recuperado
  en las páginas físicas 3–5. La exposición queda completa: 15 de 15 grupos.
  Después se cotejaron `Vers. 1-13.—An apostolic pastoral, to a Christian
  family` de C. Clemance (páginas físicas 5–7), `Vers. 1-3.—An exemplary
  Christian greeting` de W. Jones (7–8) y `Ver. 4.—The rejoicing of the good`
  (8–9). Después se cotejó `Vers. 5, 6.—Mutual love` (9–11). Este cotejo
  descubrió que `Yer. 7.—The exhortation and condemnation of heretics` estaba
  absorbida por el encabezado OCR defectuoso; se recuperó y cotejó en la página
  11, elevando el libro a 29 entradas y 25 grupos. También se cotejaron `Ver. 8`
  (12–13), `Ver. 9` (13–14), `Vers. 10, 11` (14–15), `Vers. 12, 13`
  (15–16) y la segunda homilía de `Vers. 1-3`, firmada por R. Finlayson
  (16–19). 2 Juan queda completo para revisión humana de aprobación: 29 de 29
  entradas y 25 de 25 grupos cotejados contra el facsímil, con 0 errores
  estructurales y cola OCR 0. El artefacto del módulo mantiene las 29 entradas
  como `ocr-unreviewed`.
- La regeneración estricta inicial de 3 Juan reveló que el artefacto preliminar
  de 18 entradas y 14 grupos también estaba incompleto. El cotejo recuperó las
  exposiciones `Ver. 5` y `Ver. 6` y las homilías `Vers. 9, 10` y
  `Vers. 11, 12`, cuyos encabezados habían sido deformados por el OCR. La
  estructura real contiene ahora 31 entradas y 23 grupos, con 0 errores
  estructurales. Sus 31 entradas y 23 grupos quedaron cotejados íntegramente
  contra las páginas físicas 2–17; la página 18 es únicamente el índice
  homilético. La auditoría terminó con cola OCR 0 y 0 errores fatales. El
  artefacto del módulo conserva sus 31 entradas como `ocr-unreviewed`.
- La regeneración estricta de Judas reveló diez grupos omitidos por encabezados
  OCR deformados: los sumarios expositivos `Vers. 5–7`, `Ver. 11` y
  `Vers. 24, 25`, y siete grupos homiléticos (`Vers. 1, 2`, `Vers. 3, 4`,
  `Vers. 14–19`, `Ver. 10`, `Vers. 17, 18`, `Vers. 17–21` y
  `Vers. 22, 23`). Tras recuperarlos, la estructura real contiene 71 entradas
  y 52 grupos, con 0 errores estructurales. Se cotejaron el encabezado de
  `Vers. 1, 2` y las exposiciones de `Ver. 1`, `Ver. 2` y `Ver. 3` contra las
  páginas físicas 11–14: son 5 entradas revisadas y 66 todavía pendientes. La
  cola de señales OCR quedó en 54. El artefacto del módulo mantiene sus 71
  entradas como `ocr-unreviewed`.
- Al reanudar Judas el 21 de agosto, la regeneración desde el facsímil catalogado
  confirmó que la evidencia versionada ya cubría 47 grupos, aunque el resumen
  anterior solo consignaba el inicio del cotejo. El flujo actual detectó además
  un grupo que el conteo anterior no incluía, de modo que la estructura real es
  de 73 entradas y 53 grupos. Se cotejó íntegramente la homilía
  `Vers. 1-4.—Christian co-operation desired in the defence of the gospel`, de
  `J. S. B.`, en las páginas físicas 43–44, y se corrigió su encabezado OCR
  `Vere. 1-4.`. Después se cotejaron las cuatro homilías restantes de `J. S. B.`:
  `Vers. 6-16`, `Vers. 17-21`, `Vers. 22, 23` y `Vers. 24, 25`, en las páginas
  físicas 44–47. Finalmente se cotejó la homilía extensa
  `Vers. 1-25.—The Letter`, de `R. Finlayson`, contra las páginas físicas 47–54;
  una transcripción pública auxiliar se contrastó con el facsímil para restaurar
  las unidades que la capa OCR canónica había degradado. Judas queda completo
  para revisión humana de aprobación: 73 de 73 entradas y 53 de 53 grupos
  cotejados, con 0 errores estructurales y cola OCR 0. El módulo conserva las 73
  entradas como `ocr-unreviewed`; no se modificaron manifest, registro ni
  catálogos.
- Al continuar con Tito, se comprobó que su staging preliminar de 90 entradas y
  80 grupos procedía de una extracción `-layout` que entrelazaba las columnas y
  había omitido exposiciones. Se actualizó el límite OCR del capítulo 3 contra el
  facsímil para usar la extracción canónica `-raw` y se recuperaron los
  encabezados degradados de las exposiciones de 1:1, 1:5 y 1:10. La estructura
  provisional parecía contener 112 entradas y 102 grupos. Al comenzar el cotejo
  se comprobó que la capa OCR había representado la inicial de `Ver. 5` mediante
  la secuencia literal `\\\"`; la corrección anterior no incluía la barra y por
  ello Tito 1:5 seguía absorbido dentro de 1:4. Separado el encabezado contra el
  facsímil, la estructura real contiene 113 entradas y 103 grupos. Las
  exposiciones de `Ver. 1` a `Ver. 16` quedaron cotejadas íntegramente contra las
  páginas físicas 2–5, incluidas las notas al pie de 1:1, 1:6, 1:8 y 1:11; se restauraron palabras
  inglesas, referencias, puntuación y expresiones griegas degradadas por el OCR.
  También quedaron cotejadas las homilías `Vers. 1-16.—The ministry of
  character` (página física 6) y `Vers. 1-4.—Apostolic address and salutation`
  (páginas físicas 6–8), esta última firmada por `T. C.`; se corrigieron sus
  encabezados OCR. El encabezado de la unidad siguiente se comprobó visualmente
  como `Ver. 5.—Titus’s commission in Crete`, no `Ver. 6` como decía el OCR. El
  Después quedaron cotejadas `Ver. 5.—Titus’s commission in Crete` (páginas
  físicas 8–9), `Vers. 6, 7.—The character of bishops—their negative
  qualifications` (9–10), `Ver. 8.—The bishop’s positive qualifications`
  (10–11) y `Ver. 9.—The bishop’s qualification as to doctrine` (11), todas
  firmadas por `T. C.`. El avance actual es 22 de 103 grupos fuente y 23 de 113
  entradas revisadas, con 0 errores estructurales y 84 entradas en la cola
  automática. El artefacto del
  módulo conserva deliberadamente las 113 entradas como `ocr-unreviewed`; el
  siguiente paso es cotejar la homilía `Vers. 10-13.—The character of the
  adversaries at Crete`, que comienza en la página física 11, y mantener la
  búsqueda visual de otros encabezados
  ocultos.

## Publicación piloto para revisión en línea (2026-08-21)

- Estructura creada: `biblia/modules/commentaries/pulpit-commentary/`.
- `manifest.json` registra Filemón, Abdías, 2 Juan, 3 Juan y Judas, con sus
  archivos completos e índices livianos.
- Los 25 pares `books/<ID>.json` y `books/<ID>.index.json` son artefactos de
  revisión. Las 264 entradas pertenecientes a los cinco libros cotejados y
  aprobados están marcadas `reviewed` y son visibles; las otras 5,878 conservan
  `ocr-unreviewed` y permanecen fuera del manifest.
- Las capas OCR se regeneraron desde los facsímiles catalogados. Cuando una
  extracción alternativa no reutilizó correcciones ligadas textualmente a otra
  capa OCR, el conversor permitió dejarlas sin aplicar, pero nunca relajó la
  validación de capítulos y rangos. Los 25 libros terminaron con cero errores
  estructurales y conservan sus colas completas de revisión visual.
- Filemón conserva 56 entradas derivadas de 48 grupos fuente. Los 48 grupos
  tienen evidencia de cotejo contra el facsímil y la auditoría no conserva
  señales pendientes.
- Por instrucción expresa de Juan, el módulo se añadió al registro y se
  reconstruyeron los índices y el catálogo para permitir la revisión desde la
  interfaz. Tras comprobar el piloto en línea, Juan aprobó expresamente los cinco
  libros; sus 264 entradas pasaron a `reviewed`.

## Plan de reanudación

1. Conservar el registro de aprobación de los cinco libros publicados y atender
   cualquier corrección humana posterior como una nueva revisión versionada.
2. Continuar la corrección integral del OCR de Génesis, Esdras, Nehemías y
   Ester, manteniéndolos fuera del catálogo hasta completar el cotejo.
3. Preparar y convertir los restantes 41 libros con el mismo control de
   licencias, límites, rangos y estado editorial.
4. Preparar cada libro terminado en el módulo independiente y publicarlo solo
   después de aprobación manual, siguiendo el orden recomendado documentado en
   `README.md`. La reconstrucción de índices, catálogo y registro pertenece al
   paso de publicación autorizado, no a esta preparación.

No agregar al manifest otros libros con OCR sin revisar integralmente.

## Pausa guardada: preparación de los 25 libros (2026-08-20)

Registro histórico, superado por la publicación piloto autorizada el 21 de
agosto de 2026.

- Los 25 libros estructurados están materializados en
  `biblia/modules/commentaries/pulpit-commentary/books/`, cada uno con su JSON
  completo y su índice liviano: 50 archivos y 6,141 entradas en total.
- Las 6,141 entradas conservan `editorialStatus: ocr-unreviewed`; ninguna fue
  aprobada durante la preparación.
- Los 25 pares libro/índice tienen identificadores únicos, correspondencia
  exacta entre índice y contenido, capítulos y rangos válidos contra Biblia
  Verbo, contenido no vacío y cero errores estructurales en
  `audit_staging.py`.
- `biblia/modules/commentaries/pulpit-commentary/manifest.json` conserva
  `books: []`. El módulo no está en `biblia/modules/registry.json`, no es
  visible en la aplicación y no debe presentarse todavía como publicado.
- No se ejecutaron `tools/build_commentary_index.py` ni
  `tools/build_registry_catalog.py`; tampoco se hicieron operaciones de staging,
  commit o push en Git.
- Los facsímiles, capas OCR, stagings y auditorías regenerables de esta sesión
  están temporalmente en `/tmp`. Los artefactos valiosos que deben conservarse
  a largo plazo son el módulo, las herramientas, límites, correcciones y esta
  documentación dentro del repositorio.
- Próxima decisión de Juan: escoger entre guardar en Git solamente la
  infraestructura y los artefactos de revisión todavía invisibles, o continuar
  primero el cotejo editorial de Filemón. Registrar o hacer visible cualquier
  libro requiere una instrucción posterior explícita.
