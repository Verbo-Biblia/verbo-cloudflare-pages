# Estado — Biblia Verbo — 2026-08-07

## Los 66 libros están completos como candidatos editoriales

Con Apocalipsis (22 capítulos, 404 versículos), cerrado y publicado el
2026-08-07, la Biblia Verbo (BV2026) tiene sus 66 libros revisados
verso a verso y publicados como **candidatos editoriales**. Esto NO
significa que la Biblia sea oficial: falta la aprobación final expresa
de Juan (ver "Publicación" abajo). No se ha hecho todavía un muestreo
de auditoría dedicado a buscar arcaísmos residuales en los libros ya
cerrados — cada libro reveló categorías nuevas de error que las
pasadas anteriores no habían detectado, así que no se puede garantizar
cero arcaísmos restantes sin una revisión dedicada a eso.

## Cambio de repositorio

Este proyecto arrancó en `verbo-github-pages-v1` (Génesis–Malaquías comiteado y
publicado ahí). Ese repo ya no despliega a producción — lo hace
`verbo-cloudflare-pages` desde 2026-08-04. Mateo 1–2 se había revisado en el
repo viejo pero quedó **sin comitear**; se rescató del working tree y se aplicó
aquí. Desde esa sesión, todo el trabajo del Nuevo Testamento continuó en
`verbo-cloudflare-pages`.

## Los 66 libros, cerrados y publicados (2026-08-07)

Mateo, 28 capítulos y 1.071 versículos; Marcos, 16 capítulos y 678
versículos; Lucas, 24 capítulos y 1.151 versículos; Juan, 21 capítulos y
879 versículos; Hechos, 28 capítulos y 1.006 versículos; Romanos, 16
capítulos y 433 versículos; 1 Corintios, 16 capítulos y 437 versículos;
2 Corintios, 13 capítulos y 256 versículos; Gálatas, 6 capítulos y 149
versículos; Efesios, 6 capítulos y 155 versículos; Filipenses, 4
capítulos y 104 versículos; Colosenses, 4 capítulos y 95 versículos;
1 Tesalonicenses, 5 capítulos y 89 versículos; 2 Tesalonicenses, 3
capítulos y 47 versículos; 1 Timoteo, 6 capítulos y 113 versículos;
2 Timoteo, 4 capítulos y 83 versículos; Tito, 3 capítulos y 46
versículos; Filemón, 1 capítulo y 25 versículos; Hebreos, 13 capítulos y
303 versículos; Santiago, 5 capítulos y 108 versículos; 1 Pedro, 5
capítulos y 105 versículos; 2 Pedro, 3 capítulos y 61 versículos;
1 Juan, 5 capítulos y 105 versículos; 2 Juan, 1 capítulo y 13 versículos;
3 Juan, 1 capítulo y 14 versículos; Judas, 1 capítulo y 25 versículos;
Apocalipsis, 22 capítulos y 404 versículos; todo el Antiguo Testamento
(Génesis–Malaquías, ver detalle abajo). Todos con validación de calidad
sobre el libro completo, 0 problemas (sin desajuste de conteo vs.
RVA1909, sin campos vacíos, sin arcaísmos "vosotros" residuales, sin
comillas indebidas).

**Instrucción de Juan que motivó terminar el NT sin pausar (2026-08-07):**
"intenta terminar la biblia, no se si los tokens me alcanzan". El trabajo
avanzó de forma continua por todas las epístolas hasta Apocalipsis,
publicando cada libro al cerrarlo.

## Notas de método acumuladas (para cualquier auditoría futura)

- Varios versículos con lectura Textus Receptus/RVA1909 sin paralelo en
  el texto crítico moderno (BSB/ASV) se preservaron íntegros, conforme al
  método (RVA1909 controla estructura y variantes textuales): Hechos
  8:37, 15:34, 18:21, 24:6-8, 28:29; Romanos 16:24 (doxología final);
  1 Corintios 10:28, 11:24, 15:47; Gálatas 5:19; Efesios 5:30; Colosenses
  2:2; 1 Timoteo 3:16 ("Dios ha sido manifestado en carne"); 1 Timoteo
  1:11 ("de los gentiles"); 2 Timoteo 1:11 ("de los gentiles"); 1 Juan
  5:7 (Comma Johanneum completo); Juan 21:15-17 ("hijo de Jonás").
- "Caridad" (RVA1909) se modernizó a "amor" de forma sistemática en todo
  el NT donde aparecía (1 Corintios 13, Gálatas 5:6/5:22, Colosenses
  3:14, 1 Tesalonicenses 3:6/5:8, 2 Tesalonicenses 1:3, 1 Timoteo 1:5 y
  otros, Tito 2:2, 2 Timoteo 2:22/3:10, Santiago (no tenía), 1 Pedro
  1:22/4:8/5:14, 2 Pedro 1:7, 1 Juan 2:5, Judas, Apocalipsis 2:19).
- "Obispo(s)" se modernizó a "supervisor(es)" cuando se refiere al oficio
  neotestamentario de *episkopos* (Filipenses 1:1, 1 Timoteo 3:1-2, Tito
  1:7, 1 Pedro 2:25) — pero se preservó "obispo" en los colofones finales
  de 2 Timoteo y Tito, que describen el oficio episcopal posterior de la
  iglesia primitiva (distinto uso histórico, no el término técnico
  neotestamentario).
- "Salud" (RVA1909, arcaísmo por "salvación") se corrigió a "salvación"
  en decenas de apariciones a través de Hebreos, Santiago, 1-2 Pedro,
  Judas — con cuidado de NO tocarlo donde de verdad significa salud
  física (3 Juan 1:2).
- Se encontraron y corrigieron varios **errores de concordancia de
  género** heredados del script de modernización original: "la poder" →
  "el poder" (2 Pedro 1:3/1:16, Apocalipsis 7:12/18:3); "creó/crió"
  confundidos (1 Timoteo 5:10 "creó hijos"→"crió hijos"; Apocalipsis 4:11
  y 10:6 "criaste/criado"→"creaste/creado", sentido correcto era
  "crear" no "criar").
- Formas subjuntivo futuro arcaicas residuales (que el script de
  conversión "vosotros"→"ustedes" no detectó por no ser vosotros
  propiamente) aparecieron sueltas en varios libros: 1 Timoteo 4:6
  ("propusieres"), 3 Juan 1:6 ("ayudares"). Y un residuo de "vosotros"
  fundido en un solo verbo (conjuro+os) en 1 Tesalonicenses 5:27
  ("Conjúroos").
- Nota de estilo (ya presente antes de esta sesión, confirmada en Juan
  1–17, Marcos, Lucas): las comillas curvas “” SÍ se usan, pero solo
  para citas o discurso anidado dentro de otro discurso. El discurso
  directo de primer nivel sigue sin comillas (dos puntos + mayúscula).
  El script de validación de calidad debe filtrar comillas curvas “” y
  solo marcar guillemets «» como problema.
- Los colofones finales de cada epístola (quién la escribió, desde dónde
  se envió) se conservan como parte del último versículo en todas las
  epístolas paulinas y generales.

## Decisión de estilo ya resuelta (2026-08-07)

Mateo 1–2 había introducido comillas angulares/curvas para todo el discurso
directo, distinto del estilo del AT ya publicado ("y dijo Dios: Sea la
luz", dos puntos + mayúscula, sin comillas). Juan decidió mantener
consistencia total con el AT: se quitaron las comillas de Mateo 1–2 y el
resto del NT sigue el mismo patrón sin comillas.

## Cierres del Antiguo Testamento (ya completados antes de esta sesión)

Génesis, Éxodo, Levítico, Números, Deuteronomio, Josué, Jueces, Rut,
1 Samuel–2 Crónicas, Esdras, Nehemías, Ester, Job, Salmos, Proverbios,
Eclesiastés, Cantares, Isaías, Jeremías, Lamentaciones, Ezequiel, Daniel,
Oseas, Joel, Amós, Abdías, Jonás, Miqueas, Nahúm, Habacuc, Sofonías,
Hageo, Zacarías, Malaquías — todos candidatos editoriales publicados.
Detalle capítulo por capítulo en `review/bible-verbo/PROGRESS.md`.

## Método usado en toda la revisión

1. Usar BV2026 como texto base; RVA1909 solo para controlar estructura,
   numeración e historia textual, nunca como modelo de redacción.
2. Usar BSB y ASV como guías textuales principales disponibles (ambas ya están
   en `biblia/modules/bibles/` de este repo); contrastar también LBLA cuando
   sea accesible y RVG u otras versiones conocidas para alternativas léxicas,
   sin copiar la redacción de ninguna como base.
3. Corregir errores, conversiones defectuosas, arcaísmos y nombres anticuados
   mediante revisión contextual, nunca con sustituciones globales ciegas.
4. Verificar estructura, numeración, textos no vacíos, cifras, negaciones,
   sujetos, términos teológicos, referencias y JSON.
5. Cuidado especial en genealogías y listas: no introducir distinciones que el
   texto original no marca.

## Nota de calidad — revisión de Mateo 1–2 (Claude, 2026-08-07)

Ver informe completo en `review/bible-verbo/OPINION-MATEO-1-2.md`. Resumen: la
traducción es de buena calidad, natural y fiel al griego; corrige bien nombres
propios arcaicos y reestructura la genealogía de forma legible.

## Pendiente para una fase futura (no bloquea nada, pero no está hecho)

- Un muestreo/auditoría dedicado a buscar arcaísmos residuales en libros
  ya cerrados, en vez de encontrarlos de rebote mientras se revisa el
  siguiente libro (que es como se encontraron casi todos los errores de
  este historial).
- Revisión del Antiguo Testamento con el mismo nivel de detalle línea por
  línea que se aplicó al Nuevo Testamento en esta sesión (el AT se cerró
  en sesiones anteriores con un proceso que puede no haber sido igual de
  exhaustivo verso a verso).

## Publicación

- Juan autorizó comitear y subir cada libro terminado, y cada uno se
  publicó en GitHub → Cloudflare Pages al cerrarse.
- **La Biblia completa (66/66 libros) todavía no está aprobada ni debe
  marcarse como oficial.** Cada libro es un "candidato editorial" —
  la aprobación final ("aprobado") requiere una decisión expresa de Juan,
  no solo que el trabajo mecánico/editorial esté terminado.
