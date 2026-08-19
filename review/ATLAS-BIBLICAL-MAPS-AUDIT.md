# Auditoría de integridad histórica y geográfica del Atlas bíblico de Verbo

Fecha: 2026-08-18

## Alcance y arquitectura comprobada

Se revisaron los siete mapas activos de `biblia/assets/atlas/data/maps-registry.json`, sus siete SVG maestros, los ocho archivos `places-*.json` (incluido el legado no registrado `places-judea-galilea.json`), `place-media.json`, los catálogos bilingües y la lógica de `biblia/assets/atlas/map.js`.

El Atlas activo no almacena latitud/longitud en los siete juegos registrados. Cada lugar usa `mapPosition: [x, y]`, una posición en el sistema de coordenadas del SVG maestro. `map.js` no proyecta coordenadas geográficas ni calcula itinerarios: para cada uso toma `segments`, o en su defecto `stops`, descarta puntos sin `mapPosition` y dibuja una polilínea abierta en el orden literal del array. No une automáticamente el último punto con el primero. Cada segmento recibe solamente una flecha final. Por ello se corrigieron los arrays o el `mode`; no se movió ninguna ciudad para corregir una línea.

`places-judea-galilea.json` es un juego legado no referenciado por el registro actual. Conserva coordenadas geográficas `[longitud, latitud]`, pero el renderizador actual exige `mapPosition`, por lo que no es una fuente activa del mapa publicado.

## Inventario

| Mapa/datos | Lugares | Usos o rutas | Resultado |
|---|---:|---:|---|
| Israel en tiempos del NT | 21 | 10 | Revisado |
| Viajes completos de Pablo | 55 | 11 | Revisado y corregido |
| Éxodo y conquista | 29 | 10 | Revisado y corregido |
| Pablo, Asia Menor y Chipre | 11 | 2 | Revisado; primer viaje correcto |
| Mundo antiguo/patriarcas | 13 | 7 | Revisado y corregido |
| Doce tribus | 10 | 14 | Revisado y corregido |
| Reino dividido | 10 | 4 | Revisado y corregido |
| Judea y Galilea (legado no activo) | 13 | 3 | Revisado y corregido preventivamente |

Total: 162 registros de lugar, 61 usos/rutas y 222 referencias bíblicas. Los registros repetidos entre mapas (por ejemplo, Jerusalén o Jericó) son copias deliberadas en distintos sistemas SVG, no lugares duplicados dentro de una misma ruta.

## Resultado de rutas

### Pablo

- El primer viaje ya tenía el orden correcto en ambos archivos que lo contienen: Antioquía de Siria → Seleucia → Salamina → Pafos → Perge → Antioquía de Pisidia → Iconio → Listra → Derbe → Listra → Iconio → Antioquía de Pisidia → Perge → Atalia → Antioquía de Siria. Se conservó sin cambios. Incluye explícitamente todo el regreso de Hechos 14:21-26 y no produce un segmento Salamina–Pafos espurio.
- El segundo viaje conserva la secuencia de Hechos 15:40–18:22. Las regiones de Siria/Cilicia, Frigia/Galacia y Misia no se convierten artificialmente en ciudades exactas. Las escalas urbanas y marítimas representadas mantienen el orden del texto.
- El tercer viaje conserva la secuencia de Hechos 18:23–21:17. Los tramos regionales iniciales siguen siendo esquemáticos y las escalas marítimas de Hechos 20–21 están en orden.
- El viaje a Roma ahora comienza en Cesarea, donde empieza la navegación de Hechos 27. Jerusalén permanece en el uso separado «Arresto: Jerusalén → Cesarea» (Hechos 21–26).
- Lasea permanece visible como contexto geográfico, pero se retiró del itinerario: Hechos 27:8 dice que Buenos Puertos estaba cerca de Lasea, no que el barco hiciera escala allí.
- La misma corrección se aplicó al segmento romano de «Todos los viajes»; los cuatro segmentos permanecen independientes, por lo que no se crea ninguna línea entre el final de un viaje y el comienzo del siguiente.

### Otros mapas

- Las seis ciudades de refugio y los centros de culto se cambiaron a `mode: sites`: son conjuntos legales/históricos, no viajes consecutivos.
- «Elías y Eliseo» y «La caída de los dos reinos» se cambiaron a `sites`: agrupaban episodios, personas, campañas y siglos distintos; las líneas sugerían itinerarios inexistentes.
- Se retiró Damasco del llamado de Abram: Génesis 11:27–12:9 no lo presenta como escala. Damasco continúa visible para Génesis 14 y 15:2.
- «Abram en Egipto», «José y la familia en Egipto», «Abraham dentro de Canaán» y «Jacob: Harán y regreso» se presentan como sitios temáticos. Los textos no permiten convertir todos esos lugares y períodos en una sola polilínea completa; Menfis y Gosén son contexto egipcio, no escalas expresamente narradas para cada desplazamiento.
- La entrada de Josué se limitó a Hesbón → Jericó → Gilgal bajo Josué 1–6. Jerusalén, Laquis y Hebrón siguen visibles y disponibles en los usos de las campañas, pero ya no se conectan bajo una referencia que no narra esa secuencia.
- Se retiró Sicar del recorrido sinóptico Galilea–Jerusalén de Lucas 9:51–19:28; Sicar pertenece al episodio de Juan 4 y permanece visible en otros usos.
- El antiguo «Ministerio en Galilea» se cambió a `sites`, y el uso legado de nacimiento/niñez se corrigió a Belén → Jerusalén → Nazaret.

## Ubicaciones y grado de certeza

Las posiciones de los sitios grecorromanos identificables, capitales, puertos principales y ciudades con identificación ampliamente aceptada se conservaron. La comparación incluyó la coherencia regional del SVG maestro y gazetteers históricos; no apareció una discrepancia sólida que justificara mover quirúrgicamente un punto activo.

Las siguientes clases no deben leerse como coordenadas arqueológicas exactas:

- Ruta del Éxodo: Ramesés como propuesta cartográfica; Etam, Pi-hahirot, Baal-zefón, Mara, Elim, Dofca, Alús, Refidim, Kibrot-hataava y Hazerot son inciertos o dependen de una reconstrucción; el Sinaí es una identificación tradicional discutida. Los datos y/o el SVG ya usan descripciones prudentes y signos de interrogación.
- Cades se representa según la identificación habitual de Ain el-Qudeirat, pero el recorrido que la conecta con otras estaciones continúa siendo esquemático.
- Ai/Hai, valle de Escol y Sodoma están marcados explícitamente como aproximados o inciertos.
- Emaús, Betsaida y la región de los gerasenos tienen propuestas competidoras; los puntos sirven para orientación regional y no resuelven la discusión.
- Salem se muestra según la identificación tradicional con Jerusalén y así lo declara su descripción.
- Derbe tiene historia de propuestas de identificación; se mantuvo el punto de la cartografía maestra, sin convertir la discusión en certeza adicional.

No se añadieron latitudes/longitudes aparentes a datos que trabajan en píxeles del SVG. Hacerlo habría introducido una precisión falsa y una segunda arquitectura de proyección que la interfaz no utiliza.

## Referencias bíblicas

Todos los `scriptureRefs` usan nombres internos de libros en inglés (`Acts`, `Genesis`, `Joshua`, etc.); no se encontraron nombres españoles mezclados. Se aceptan guiones y rayas en rangos porque el analizador existente los normaliza. La traducción visible continúa a cargo de la capa de idioma; no se modificó esa arquitectura.

## Auditoría de imágenes

`place-media.json` contiene 66 grupos y 134 entradas, todas declaradas como dominio público o CC0 y enlazadas a una página `File:` de Wikimedia Commons. Todos los lugares de los ocho archivos apuntan a un grupo existente.

Se encontraron siete nombres de archivo repetidos entre grupos. Son reutilizaciones deliberadas y defendibles: Sardis y Laodicea como contexto de Anatolia occidental; Mira y Pátara como contexto de Licia; un pozo de Beerseba como contexto del sur de Palestina; y dos paisajes del Egeo compartidos con Patmos. Los grupos regionales activan el rótulo visible de imagen representativa.

Se corrigieron dos alcances engañosos:

- Ai/Hai usa el grupo fotográfico de Jericó, pero ahora `mediaScope` es `regional`, no `exact`.
- Emaús usa el grupo de Jerusalén, pero ahora se muestra igualmente como material regional/representativo.

No se eliminaron imágenes repetidas válidas. Tampoco se descargaron ni duplicaron archivos: el catálogo usa URLs remotas de Commons.

## Fuentes principales

- Texto local de Biblia Verbo, especialmente Hechos 13–28; control del itinerario con [Hechos 15 (USCCB)](https://bible.usccb.org/bible/acts/15) y los capítulos consecutivos.
- [Itinerario del segundo viaje, ESV Global Study Bible](https://www.esv.org/resources/esv-global-study-bible/chart-44-08b/), usado como control secundario, no como sustituto de Hechos.
- [Pleiades, gazetteer académico de lugares antiguos](https://pleiades.stoa.org/places), y sus referencias al *Barrington Atlas* para el mundo grecorromano.
- [Pleiades: actualización de Derbe/Claudioderbe](https://pleiades.stoa.org/news/blog/last-week-in-pleiades-4-11-november-2024), que documenta la distinción entre registros y la identificación de Kerti Hüyük.
- [The Route Through Sinai, Itzhaq Beit-Arieh](https://cojs.org/the_route_through_sinai-_itzhaq_beit-arieh-_bar_14-03-_may-jun_1988/), para la identificación habitual de Cades-barnea.
- [Bible Mapper: The Route of the Exodus](https://biblemapper.com/blog/index.php/2023/05/30/the-route-of-the-exodus/), para el carácter discutido de la mayoría de las referencias geográficas del Éxodo.
- Páginas individuales de Wikimedia Commons registradas en `place-media.json`, usadas para procedencia y licencia de cada imagen.

## Archivos modificados

- `biblia/assets/atlas/data/places-pablo-completo.json`
- `biblia/assets/atlas/data/places-doce-tribus.json`
- `biblia/assets/atlas/data/places-reino-dividido.json`
- `biblia/assets/atlas/data/places-mundo-antiguo.json`
- `biblia/assets/atlas/data/places-exodo-conquista.json`
- `biblia/assets/atlas/data/places-israel-nuevo-testamento.json`
- `biblia/assets/atlas/data/places-judea-galilea.json` (legado no activo)
- `biblia/assets/atlas/map.js`, `biblia/assets/atlas/atlas.html`, `biblia/assets/app.js` y `biblia/index.html` (solo invalidación de caché)
- `tools/audit_atlas_data.py`
- `review/ATLAS-BIBLICAL-MAPS-AUDIT.md`

No se modificaron la lógica de dibujo, los SVG maestros, estilos, controles, Worker, Cloudflare ni `.wrangler/`. Se actualizaron únicamente la constante de versión de datos y los parámetros `?v=` necesarios para invalidar caché.

## Pruebas ejecutadas

- Parseo JSON de todos los archivos `places-*.json`, registro y catálogo multimedia.
- `python3 tools/audit_atlas_data.py`: 7 mapas activos, 8 archivos de lugares, 162 registros, 61 usos/rutas, 222 referencias, 66 grupos multimedia y 134 entradas; sin errores.
- Verificación de archivos SVG y JSON registrados, lugares referenciados, coordenadas/posiciones finitas, nombres bilingües, modos, segmentos no vacíos, rutas con al menos dos puntos y ausencia de repeticiones adyacentes.
- Recorrido automatizado en Chrome de los siete mapas y todos sus usos, en español e inglés y en 1440×900 y 390×844: 232 combinaciones renderizadas correctamente.
- El primer viaje renderiza una única polilínea abierta y diez pines únicos; la repetición de Listra, Iconio, Antioquía de Pisidia y Perge permanece dentro de la secuencia para representar el regreso.
- El viaje a Roma renderiza una única polilínea abierta y trece pines, comenzando en Cesarea y sin convertir Lasea en escala.
- `git diff --check`: correcto.

## Resultado final

Los mapas conservan su cartografía y diseño. Las correcciones eliminan conexiones que afirmaban recorridos no narrados, preservan ciudades de contexto, mantienen explícito el regreso del primer viaje y distinguen imágenes exactas de material regional. Las ubicaciones inciertas continúan presentándose prudentemente, sin transformar propuestas arqueológicas en coordenadas supuestamente definitivas.
