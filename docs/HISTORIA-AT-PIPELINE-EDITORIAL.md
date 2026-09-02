# Historia AT — regla de producción editorial

Estado: metodología aprobada como modelo; producción masiva todavía no iniciada.

Alcance inicial: Pinches, Sayce, H. P. Smith y Maclear. ISBE queda fuera de
esta fase.

Contratos ejecutables:

- `tools/historia-at/schemas/history-reading-unit.schema.json`;
- `tools/historia-at/schemas/assistant-historical-card.schema.json`;
- `tools/historia-at/validate_editorial_record.py` para esquema e invariantes.

## Principio rector: dos productos relacionados, no una sola voz

La obra completa en `Historia` y la ficha contextual del Asistente comparten
identidades y trazabilidad, pero tienen decisiones editoriales independientes.

```text
OBRA HISTÓRICA
  -> UNIDAD ESTRUCTURADA DE LECTURA
  -> POSIBLE RELACIÓN BÍBLICA (candidata, no publicación)
  -> REVISIÓN EDITORIAL
  -> CONTRASTE MODERNO, solo para las afirmaciones que lo requieren
  -> CLASIFICACIÓN DE CADA AFIRMACIÓN
  -> FICHA DEL ASISTENTE
  -> TRAZABILIDAD A LA UNIDAD HISTÓRICA Y A CADA FUENTE DE CONTRASTE
```

Publicar una unidad legible no aprueba sus conclusiones para el Asistente.
Rechazar una ficha contextual tampoco impide publicar la unidad histórica si
esta cumple los requisitos jurídicos, documentales y de transcripción.

### Perfil de las cuatro fuentes

| Fuente | Unidad normal de lectura | Tratamiento en Historia | Riesgo principal al proyectar al Asistente |
|---|---|---|---|
| Pinches (1903) | capítulo o apéndice | conservar traducciones, transliteraciones e interpretaciones como voz de Pinches; controlar OCR donde se use | identificaciones y conclusiones asiriológicas antiguas |
| Sayce (1895) | capítulo | conservar el marco apologético atribuido y advertido | convertir «confirmación» del autor en veredicto arqueológico de Verbo |
| H. P. Smith (1903) | capítulo | conservar su reconstrucción histórico-crítica como posición del autor | presentar composición, fechas o historicidad como hechos no debatidos |
| Maclear (1894) | libro o capítulo | conservar narración confesional, cronologías y armonizaciones atribuidas | tratar un manual narrativo como evidencia histórica independiente |

Los cuatro perfiles utilizan los mismos contratos. Sus advertencias cambian,
pero no se crean esquemas ni estándares de evidencia particulares por autor.

## 1. Clasificación editorial definitiva

### Naturaleza de la afirmación (`claimType`)

- `ARCHAEOLOGICAL_OBJECT`: existencia, inventario, procedencia, datación o
  descripción material de un objeto.
- `ANCIENT_TEXT`: contenido, testimonio, versión o tradición de un texto
  antiguo.
- `INSCRIPTION`: lectura o contenido de una inscripción concreta; puede
  coexistir con `ARCHAEOLOGICAL_OBJECT`.
- `HISTORICAL_CONTEXT`: información contextual no limitada a un solo objeto.
- `LITERARY_PARALLEL`: semejanza literaria descrita sin inferir por sí sola
  dependencia, dirección ni historicidad.
- `AUTHOR_INTERPRETATION`: juicio expresamente atribuido al autor histórico.
- `DISPUTED_IDENTIFICATION`: identificación de persona, lugar, objeto o texto
  cuya aceptación es discutida.
- `HISTORICAL_RECONSTRUCTION`: reconstrucción de hechos, fechas, secuencias o
  desarrollo histórico que va más allá de los datos directamente observables.

Una afirmación puede tener varios tipos; debe designarse uno como `primaryType`.
El tipo describe qué clase de afirmación es, no cuánta certeza posee.

### Estado de evidencia (`evidenceStatus`)

- `FACT_CONFIRMED`: dato acotado directamente confirmado por una fuente
  competente (por ejemplo, número de inventario y custodio).
- `EVIDENCE_CONFIRMED`: el testimonio u objeto citado existe y contiene el dato
  descrito; no confirma automáticamente una interpretación derivada.
- `INTERPRETATION_WELL_SUPPORTED`: interpretación respaldada de manera amplia
  por bibliografía moderna pertinente, formulada con su alcance y límites.
- `INTERPRETATION_DEBATED`: interpretación defendida pero discutida; siempre se
  atribuye y nunca se formula como hecho.
- `HYPOTHESIS`: propuesta posible con apoyo insuficiente para voz afirmativa de
  Verbo.
- `UNKNOWN`: no se encontró evidencia suficiente o no se completó el contraste.

No se usará un estado compuesto ambiguo como
`CONFIRMED_FOR_EXISTENCE_DEBATED_FOR_RELATION`: cada proposición atómica tendrá
su propio tipo y estado.

### Tipo de relación bíblica (`relationType`)

Como mínimo: `LITERARY_PARALLEL`, `HISTORICAL_CONTEXT`,
`ARCHAEOLOGICAL_CONTEXT`, `TEXTUAL_WITNESS` y `AUTHOR_INTERPRETATION`. La
relación expresa por qué la ficha es pertinente al pasaje, no certifica la
afirmación ni la historicidad del pasaje.

## 2. Campos de una ficha histórica del Asistente

El expediente editorial, previo a su proyección al paquete activo, tendrá:

- `schemaVersion`, `id`, `integrationStatus`, `reviewStatus` y
  `reviewHistory`;
- `passage` con libro y límites inclusivos exactos;
- `relationType`, `title` y `assistantText`;
- `historicalSource` con `sourceId`, `module`, `entryId`, sección, páginas
  impresas, páginas del escaneo, localizador OCR y fragmentos usados;
- `claims[]`, divididas en proposiciones atómicas, con `claimId`, texto,
  `primaryType`, tipos secundarios, `evidenceStatus`, atribución, cautela y
  `evidenceLinks`;
- `contrastSources[]`, normalizadas como se define abajo;
- `editorialLimits[]`: lo que la ficha no afirma;
- `projection` con categoría activa, regla de rango e ID determinista;
- `sourceHash`, hashes de fragmentos y versión del método;
- responsable y fecha de revisión editorial y, cuando aplique, de revisión
  especializada.

El `assistantText` solo podrá expresar proposiciones presentes en `claims[]`.
Los detalles ricos permanecen en el expediente aunque el paquete compacto solo
reciba el texto, la fuente histórica y el enlace a `entryId`.

## 3. Campos de una unidad de lectura en Historia

Cada unidad estructurada tendrá:

- identidad: `id`, `sourceId`, título, ordinal y unidades anterior/siguiente;
- bibliografía: autor, título, edición, editor, lugar y fecha;
- procedencia y derechos: original preservado, URL de procedencia,
  `acquisitionId`, `legalStatus`, atribución y restricciones de imágenes;
- estructura: tipo de unidad, encabezados y límites de página;
- texto: idioma original, contenido fiel y aviso editorial visible de fuente
  histórica secundaria;
- localización: páginas impresas, páginas del escaneo y localizadores del
  derivado OCR;
- integridad: hashes del original, derivado y contenido de la unidad;
- control textual: estado de OCR, anomalías, correcciones explícitas
  `antes/después/razón` y alcance del cotejo;
- `readingReviewStatus` y notas.

La unidad puede conservar afirmaciones anticuadas o controvertidas del autor.
No se modernizan, corrigen ni interpolan silenciosamente. El aviso editorial y
la atribución distinguen esa voz de Verbo.

## 4. Registro de fuentes modernas de contraste

Cada registro de `contrastSources[]` tendrá `sourceId`, `sourceType`, cita
bibliográfica completa, institución/editorial, autores o editores, fecha,
URL/DOI/identificador estable, fecha de consulta, páginas o sección usadas,
alcance (`supports`, `qualifies`, `disputes` o `background_only`), `claimIds`
y notas de licencia cuando se reproduzca contenido.

Orden preferente, según la afirmación: institución custodiante y catálogo del
objeto; catálogo arqueológico; edición académica moderna del texto antiguo;
estudio especializado; publicación universitaria o arbitrada; otras fuentes
académicas justificadas. Ninguna fuente tiene que resolver preguntas para las
que no es competente. El catálogo de un museo puede confirmar objeto,
inventario y procedencia sin decidir dependencia literaria.

## 5. Afirmaciones que requieren contraste moderno

Lo requieren antes de entrar en la voz del Asistente:

- identificación, procedencia, datación o estado de un objeto;
- lectura, traducción, reconstrucción o datación de un texto antiguo;
- relaciones entre tradiciones o textos, incluida dependencia o dirección;
- consenso, aceptación, rechazo o vigencia académica;
- reconstrucciones históricas, cronologías y armonizaciones;
- equivalencias de personas, pueblos, topónimos y episodios;
- cualquier conclusión antigua reformulada como información de Verbo;
- cualquier dato cuya formulación pueda haber cambiado sustancialmente desde
  la publicación de la fuente histórica.

La mera semejanza puede justificar investigar un `LITERARY_PARALLEL`, pero no
aprobarlo automáticamente.

## 6. Afirmaciones que pueden permanecer atribuidas al autor

Dentro de la lectura completa pueden conservarse, sin contraste moderno previo,
las conclusiones, conjeturas, terminología, apologética, crítica, cronologías y
reconstrucciones propias de la obra, siempre que:

- el texto sea fiel al original y no una interpolación de Verbo;
- autor, edición y fecha sean visibles;
- exista el aviso de fuente histórica secundaria;
- un problema de OCR no altere materialmente la afirmación;
- cualquier nota añadida por Verbo esté separada y rotulada.

Estas condiciones autorizan la lectura de Pinches como Pinches; no autorizan
reutilizar sus conclusiones en el Asistente.

## 7. Estados editoriales

Los estados se asignan por producto.

`APPROVED` para una unidad de lectura exige derechos utilizables, procedencia y
original preservados, estructura correcta, OCR razonablemente validado,
errores evidentes controlados, atribución, fecha y aviso editorial. No exige
validar modernamente cada conclusión del autor.

`APPROVED` para una ficha exige relación bíblica específica y útil, fragmentos
históricos usados cotejados con el facsímil disponible, proposiciones atómicas,
contraste moderno suficiente para cada afirmación que Verbo adopta, lenguaje
proporcional a la evidencia, enlace exacto a la lectura y revisión editorial
humana.

`REVIEW_REQUIRED` indica trabajo concreto pendiente: cotejo de fragmentos,
fuente moderna insuficiente, clasificación o formulación por resolver,
revisión especializada o trazabilidad incompleta. Debe registrar la causa; no
es sinónimo de rechazo.

`REJECTED` para una ficha significa relación forzada, evidencia inadecuada,
formulación engañosa, fuente no utilizable o imposibilidad de trazabilidad. La
unidad de lectura puede seguir siendo publicable. Una unidad se rechaza si no
puede satisfacer legalidad, procedencia, fidelidad o estructura mínimas.

## 8. Trazabilidad completa

La cadena mínima será:

```text
assistantResourceId
  -> editorialCardId + claimIds
  -> historical sourceId + entryId
  -> fragmentId(s): página impresa + página de escaneo + localizador OCR
  -> hash del fragmento + hash de la unidad
  -> hash del derivado + hash del original preservado
  -> evidenceLinks
  -> contrastSourceId + páginas/secciones + función frente a cada claim
  -> revisión, fecha, decisión y versión del método
```

Una corrección de OCR cambia el hash de la unidad y deja registro. Una
actualización bibliográfica puede cambiar el estado de una afirmación sin
alterar el texto histórico ni su hash.

## 9. Barreras contra la falsa voz factual de Verbo

- Separar técnicamente `historicalQuotation`/`authorPosition` de
  `assistantText`.
- Prohibir que `AUTHOR_INTERPRETATION`, `DISPUTED_IDENTIFICATION` o
  `HISTORICAL_RECONSTRUCTION` se proyecten sin atribución explícita.
- Prohibir `FACT_CONFIRMED` cuando la fuente solo apoya una interpretación.
- Exigir que cada oración factual del texto proyectado apunte a uno o más
  `claimId` aprobados.
- Usar verbos de atribución y marcadores de incertidumbre cuando correspondan.
- Revisar expresamente inferencias de dependencia, demostración, confirmación,
  prueba, consenso e historicidad.
- Mantener visibles `editorialLimits[]` en el expediente y comprobarlos antes
  de generar el recurso.

## 10. Automatización y revisión humana

Puede automatizarse: adquisición y hashes; auditoría de manifiestos; extracción
de estructura candidata; segmentación preliminar; localizadores OCR; detección
de referencias bíblicas como candidatos; IDs estables; validación de esquemas,
enlaces y enumeraciones; expansión de rangos; construcción de paquetes e
índices; informes de cobertura y elementos pendientes.

Requiere revisión editorial humana: límites y fidelidad de unidades dudosas;
correcciones de OCR que alteren sentido, nombres, cifras, transliteración o
notas; pertinencia bíblica; descomposición y tipo de afirmaciones; selección y
competencia de fuentes modernas; evaluación de evidencia; redacción del
Asistente; atribución, cautelas y decisión final. Una identificación técnica o
textual sensible puede requerir además revisión especializada.

No se publicarán candidatos generados por coincidencia léxica. La automatización
puede preparar expedientes y señalar inconsistencias, pero no otorgar
`APPROVED` editorial.

### Operación por lotes, sin nuevos pilotos aislados

Una vez autorizada la producción, el trabajo se organiza por obra y por lotes
de unidades, no por una sucesión indefinida de demostraciones:

1. generar el inventario completo de unidades estructurales de una obra;
2. preparar automáticamente los expedientes de lectura en
   `REVIEW_REQUIRED`, con procedencia, páginas, hashes y alertas de OCR;
3. revisar y aprobar unidades de lectura por lotes, sin investigar modernamente
   cada conclusión del autor;
4. extraer posibles relaciones bíblicas a una cola de candidatos que no se
   proyecta al Asistente;
5. descartar automáticamente solo duplicados y candidatos inválidos por forma;
   la pertinencia se decide editorialmente;
6. para candidatos seleccionados, cotejar únicamente los fragmentos utilizados,
   atomizar afirmaciones y buscar contraste moderno por competencia;
7. validar el expediente, someterlo a decisión humana y proyectar únicamente
   fichas `APPROVED`;
8. conservar informes de cobertura, pendientes y rechazos para reanudar el
   lote sin repetir trabajo.

El orden permite publicar lectura histórica a su propio ritmo mientras la
curación contextual avanza de manera independiente. No se requiere terminar
las fichas de una obra para aprobar sus unidades de lectura, ni terminar toda
la lectura para revisar una ficha cuyos fragmentos ya están identificados.

### Puertas automáticas mínimas

El validador comprueba además del esquema: unicidad y resolución de IDs;
correspondencia exacta entre `assistantText` y sus declaraciones trazables;
vínculos entre declaraciones, afirmaciones y fuentes; atribución obligatoria
de interpretaciones, identificaciones discutidas y reconstrucciones; contraste
moderno para todo estado de evidencia final que lo requiera; hash del contenido
de lectura; causas explícitas para `REVIEW_REQUIRED`/`REJECTED`; y requisitos
adicionales antes de aceptar `APPROVED`. Estas puertas detectan incoherencias,
pero no sustituyen la decisión humana.

## Aplicación a la muestra Génesis 6–9

La muestra sigue `REVIEW_REQUIRED` mientras se completa su contraste moderno y
se adapta su expediente a este esquema. El modelo y `LITERARY_PARALLEL` quedan
aprobados. Para validar la ficha solo se cotejan los fragmentos efectivamente
utilizados, no todo Pinches: páginas impresas 89–91 (presentación y recuperación
del relato) y 101–107 (texto traducido por Pinches: embarcación, seres vivos,
monte Nisir, aves y sacrificio), correspondientes a páginas PDF 101–103 y
113–119 del facsímil preservado. El resultado del cotejo queda registrado junto
al piloto.

Validación reproducible de las dos muestras editoriales:

```bash
python3 tools/historia-at/validate_editorial_record.py \
  data/fuentes-externas/historia-at/pilot-genesis-6-9/reading-unit-editorial.sample.json
python3 tools/historia-at/validate_editorial_record.py \
  data/fuentes-externas/historia-at/pilot-genesis-6-9/assistant-editorial.sample.json
```
