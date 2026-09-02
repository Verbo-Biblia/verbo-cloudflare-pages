# Historia AT — modelo de dos capas y piloto Génesis 1–11

Estado: propuesta documentada en staging; implementación productiva no autorizada.

## Decisión aprobada

Cada fuente histórica tendrá dos productos separados y enlazados:

1. **Documento de lectura en `🏛️ Historia`.** Conserva la voz, estructura, notas, edición y procedencia de la obra. Se divide en unidades cargables bajo demanda y admite enlace profundo.
2. **Proyección contextual del Asistente.** Contiene únicamente selecciones revisadas vinculadas a un rango bíblico. No copia automáticamente el documento, no publica por coincidencia léxica y siempre vuelve a la unidad exacta de lectura.

No se crea un contrato alternativo. El modelo canónico es el que ya utiliza
Verbo y cualquier fuente nueva deberá adaptarse a él con la mínima extensión
necesaria.

## Precedentes activos que gobiernan la adaptación

La revisión directa del repositorio establece estos formatos como guía:

- `biblia/modules/church-history/eusebio-historia-eclesiastica/manifest.json`:
  manifiesto `schemaVersion: 2`, `type: churchHistory`, `id`, `name`,
  `abbreviation`, `language`, atribución, licencia, `sourceUrl`, `entriesFile`
  y `totalEntries`.
- `biblia/modules/church-history/eusebio-historia-eclesiastica/entries.json`:
  objeto raíz `entries`; cada entrada posee `id`, `title`, `excerpt`, `content`
  y metadatos opcionales que la vista ya sabe mostrar.
- `biblia/modules/church-history/shelf.json`: `schemaVersion: 1` y `volumes`
  con `id`, `titulo`, `periodo`, `resumenBreve` y `cover`.
- `biblia/assets/module-loader.js`: carga `entriesFile`, añade desde el
  manifiesto `sourceId`, etiquetas e idioma, y clasifica temas. Registrar una
  obra aquí no la incorpora al Asistente.
- `biblia/assets/app.js`: el lector usa el `entry.id`, presenta `content`,
  conserva anterior/siguiente y abre el volumen por `sourceId`. Esa identidad,
  no una URL nueva, es el precedente de navegación que deberá reutilizarse.
- `biblia/modules/study-assistant/chapters/GEN/1.json`: paquete activo
  `schemaVersion: 2`, `resources` por categoría y `verses` con listas de IDs
  internados por versículo.
- `tools/asistente-estudio/build_paquetes_asistente.py`: crea IDs
  deterministas, exige identidad de traducción y produce `resourceId`,
  `sourceLanguage` y `sourceHash`.
- `tools/asistente-estudio/ensamblador.py`: ya contiene solapamiento inclusivo
  de rangos entre capítulos. Es el precedente correcto para proyectar una
  perícopa curada a los versículos seleccionados.

## Identidad y navegación propuestas

Patrón propuesto de `entry.id`, siguiendo los IDs simples y estables existentes:

```text
pinches-1903-c03
hp-smith-1903-c02
```

No se propone una sintaxis de URL nueva. El enlace contextual deberá activar
la pestaña Historia y entregar el `entry.id` por la misma navegación interna
que ya usa `churchHistoryOpenId`. Si la mecánica actual del Asistente no puede
abrir ese ID directamente, ese faltante se presentará como cambio específico
antes de tocar `app.js`.

## Documento de lectura por obra

| Fuente | Unidad primaria | Carga propuesta | Advertencia persistente |
|---|---|---|---|
| Pinches | capítulo/apéndice | una unidad por solicitud | traducciones e identificaciones asiriológicas de 1903; cotejar transliteraciones |
| Sayce | capítulo | una unidad por solicitud | marco apologético y arqueología de 1895 |
| H. P. Smith | capítulo | una unidad por solicitud | reconstrucción histórico-crítica atribuible al autor, no voz factual de Verbo |
| Maclear | libro/capítulo | una unidad por solicitud | manual confesional, cronologías y armonizaciones antiguas |

Cada unidad futura deberá conservar página impresa, página del escaneo cuando exista, notas y hash del texto. Corregir OCR exigirá un registro explícito `antes/después/razón`, nunca sustitución silenciosa.

## Proyección del Asistente

Durante la curación puede existir información más rica, pero la proyección al
paquete activo debe terminar exactamente en la forma que ya consume Verbo:

```yaml
resources:
  historia:
    h-<hash-determinista>:
      tipo: contexto-historico | paralelo-literario | contexto-arqueologico
      texto: texto editorial aprobado
      fuente:
        modulo: <source-id>
        entradaId: <entry.id existente en Historia>
        libroSeccion: <etiqueta legible>
      traduccion:
        resourceId: <entry.id>
        sourceLanguage: en | es
        sourceHash: <sha256 del texto>
verses:
  "<versiculo>":
    historia: [h-<hash-determinista>]
```

Los campos de trazabilidad más ricos (`relationType`, certeza, revisión moderna,
página y `claim_ids`) deben permanecer en el archivo editorial fuente que
alimente al ensamblador. No se deben añadir silenciosamente al paquete activo:
solo se proyectarán si una ampliación de su esquema se propone y aprueba.

No se fusionarán voces. Si tres obras se relacionan con Génesis 6–9, el
Asistente puede anunciar tres fuentes, pero cada recurso conservará su propio
`modulo` y `entradaId`.

## Piloto manual

`pilot-genesis-1-11.json` registra diez candidatos:

1. Génesis 1:1–2:3 — tradiciones de creación.
2. Génesis 2:4–3:24 — Edén, ríos y paralelos.
3. Génesis 4 — Caín, genealogía y memoria cultural.
4. Génesis 5 — genealogías y cronologías textuales.
5. Génesis 6:1–4 — hijos de Dios y tradiciones de héroes.
6. Génesis 6:5–9:29 — tradiciones mesopotámicas del diluvio.
7. Génesis 9:1–17 — desenlace y pacto en comparación narrativa; candidato posiblemente débil.
8. Génesis 10 — pueblos y geografía.
9. Génesis 11:1–9 — Babilonia, ladrillo y torres-templo.
10. Génesis 11:10–32 — Ur, Harán y rutas mesopotámicas.

Todos permanecen `RESEARCH_REQUIRED`. Las ubicaciones OCR sirven para volver al material, pero antes de aprobar se deberán verificar contra el facsímil, corregir los límites de cada unidad y contrastar con fuentes modernas.

## Decisiones que deja visibles el piloto

- Una perícopa puede abarcar capítulos completos; `ranges_overlap()` ya ofrece
  el precedente para proyectarla por versículo sin cambiar el formato activo.
- `CONFIRMED` puede aplicar a la existencia de una tablilla, variante o ciudad, pero no necesariamente a la relación propuesta con el pasaje.
- Génesis 9:1–17 podría quedar solo en el documento de lectura si el contraste no produce contenido suficientemente específico.
- Smith solo debe aparecer cuando su reconstrucción sea relevante y claramente atribuida; no debe llenar el Asistente de opiniones críticas por defecto.
- Maclear aporta navegación narrativa, pero rara vez evidencia histórica independiente.
- Para 4 GB de RAM, las unidades estáticas pequeñas y la carga bajo demanda son preferibles a cargar los cuatro corpus o generar embeddings localmente.

## Próxima puerta de aprobación

Antes de producir texto de lectura o fichas del Asistente se necesita aprobación expresa de:

- los diez rangos candidatos y sus tipos de relación;
- el patrón de `entry.id` y la forma concreta de abrirlo desde el Asistente;
- la advertencia visible de cada obra;
- qué candidato se utilizará para una única prueba editorial completa.

Hasta entonces no se generan entradas finales, traducciones, paquetes, índices ni cambios en `biblia/`.

## Muestra aprobada: Génesis 6–9

La primera muestra se preparó en
`data/fuentes-externas/historia-at/pilot-genesis-6-9/`. Incluye una entrada de
lectura compatible en forma con Historia, el expediente editorial trazable y
la proyección compacta compatible en forma con `resources.historia`.

Continúa en `REVIEW_REQUIRED` mientras se completa el contraste moderno de las
afirmaciones de la ficha. No se exige cotejar el capítulo completo ni adoptar
una edición crítica moderna de Pinches: solo los fragmentos utilizados por la
ficha se cotejan con el facsímil. Ese cotejo limitado se registró en
`pilot-genesis-6-9/FACSIMILE-VERIFICATION.md`. La regla escalable resultante está
en `docs/HISTORIA-AT-PIPELINE-EDITORIAL.md`. No se reutilizaron fotografías del
British Museum.
