# Reorganización web de Software de Verbo — 2026-10-08

## Resultado

- `/software/`: landing central con secciones amplias de Verbo Desktop,
  Lumbrera y Android; Linux tiene protagonismo desde el hero.
- `/software/lumbrera/`: landing propia con canciones, Biblia, importaciones,
  búsqueda de letras, preparación de reuniones y descargas Linux.
- Home: bloque de software inmediatamente después del hero. Las secciones
  originales de Desktop, Android, preguntas y recursos se conservaron.
- Navegación: Software sustituye al acceso independiente a Desktop en la
  home, Historias y Preguntas cristianas. Las plantillas de sus generadores
  recibieron el mismo cambio para conservarlo en futuras regeneraciones.
- `/verbo-desktop/` y todos sus anclajes y descargas permanecen funcionando.
  Se añadió una salida a Software, se precisó el estado de las plataformas
  y se sustituyeron los enlaces ficticios de las plataformas futuras por avisos.
- Android no tenía una página independiente: se conservan `/#android`, sus
  capturas originales y Google Play con `id=com.verbobiblia.app`.
- No fue necesario eliminar páginas ni agregar redirecciones. `_redirects`
  permanece intacto, al igual que el proyector web existente.

## Diseño, idiomas y rendimiento

Se reutilizan directamente `biblia/assets/theme-tokens.css` y
`verbo-desktop/styles.css`. El nuevo CSS adapta su distribución sin
inventar una paleta. Botones, fondos, gradientes, tarjetas, bordes,
tipografía y sombras pertenecen a la identidad de Desktop.

Contenido completo en español e inglés mediante los diccionarios
compartidos del sitio. Nuevas páginas con título, descripción, canonical,
Open Graph, imagen social, datos estructurados y sitemap. Se actualizaron
las versiones de los assets afectados en la home y las nuevas páginas.

Las cinco capturas reales proporcionadas de Lumbrera se usan completas;
se prepararon WebP de 800 y 1600 píxeles, con selección responsive,
carga diferida fuera del hero y enlaces para ampliar. También se
optimizaron dos capturas de Desktop. Los originales existentes se conservan.

Se corrigió el contraste de texto pequeño en secciones claras de la home
usando el azul marino existente, sin alterar el contenido editorial.

## Descargas y plataformas

### Verbo Desktop

Se mantienen exactamente las dos URLs de MEGA de
`verbo-desktop/version.json`: Linux `.deb` y `.rpm`, versión de desarrollo
`0.9.0-dev`. La API de MEGA confirmó que ambos archivos existen:
269393480 y 293636563 bytes, respectivamente. Los generadores del workspace
preparan `.deb` para Linux Mint/familia Debian, arquitectura amd64, y
`.rpm` para openSUSE, arquitectura x86_64. No se afirma compatibilidad
universal con otras distribuciones.

### Lumbrera

Dos enlaces reales de MEGA proporcionados por el autor:

- `lumbrera_1.0.0_all.deb`: Linux Mint 22+; 7919492 bytes.
- `lumbrera-1.0.0-1.noarch.rpm`: openSUSE Tumbleweed / Leap 16; 7676484 bytes.

Ambos botones están en `/software/lumbrera/#descargas`. No se alojan
instaladores en el repositorio web ni se ofrecen builds locales. La home y
Software muestran Lumbrera disponible para Linux. Las familias compatibles
se verificaron contra el generador local; no se afirma compatibilidad
universal de paquetes Debian o RPM.

### Disponibilidad

Linux: Desktop y Lumbrera disponibles. Android: Verbo en Google Play (HTTP 200).
Windows, macOS e iOS: próximamente, sin descarga ni botones falsos.

## Funciones de Lumbrera verificadas

Se inspeccionó el código de la aplicación exclusivamente como referencia,
sin modificar ningún archivo fuera de este repositorio web.

- Biblioteca local, crear/editar/guardar canciones y vista previa.
- SongbookPro: copias `.sbp` y `.sbpbackup`.
- ChordPro: `.cho`, `.chopro`, `.chordpro`, `.pro` y `.crd`; se retiran acordes.
- Copias JSON de canciones y respaldos compatibles del proyector web.
- PDF: extracción de texto seleccionable; no se atribuye OCR a escaneos.
- Búsqueda en Internet, revisión en el editor y guardado local; se aclara
  que algunas fuentes abren el navegador y que la búsqueda necesita red.
- Biblia principal y segunda versión, navegación y selección de pasajes.
- Importación directa compatible de MySword `.bbl.mybible`/`.mybible`,
  e-Sword `.bblx`/`.bbli`, y XML Zefania, OSIS o Holy Bible XML.
- Preparar, guardar y abrir orden del culto; segunda pantalla, fondos,
  tamaño de letra, pantalla negra y quitar texto.

Las fuentes exactas y los nombres originales de las cinco capturas
están en `software/lumbrera/assets/README.md`.

## Verificación

- Chromium/Playwright: home, Software y Lumbrera a 320, 390, 768, 1024,
  1440 y 1920 píxeles (18 combinaciones). Sin desbordamientos horizontales
  ni imágenes rotas; revisión visual a 390 y 1440 píxeles.
- 37 enlaces internos y sus anclajes: todos accesibles.
- Sin errores de JavaScript. Cambio ES/EN correcto y todas las claves
  traducibles presentes en ambos diccionarios.
- axe-core WCAG 2 A/AA y 2.1 AA: cero incidencias en las tres páginas,
  evaluadas con las secciones reveladas y visibles.
- Teclado y enlace de salto; menú Software visible en móvil; movimiento
  reducido y contenido de nuevas páginas visible sin JavaScript.
- Se comprobó el flujo de descarga local durante la inspección inicial;
  estos builds fueron retirados por indicación del usuario.
- Verificación de existencia de las dos descargas Desktop y las dos
  descargas Lumbrera en MEGA, y de la ficha de Android en Google Play.
- JSON de traducciones y datos estructurados; XML de sitemap; IDs únicos,
  ALT y anclajes internos; `git diff --check`.
- `node --check assets/home/portal.js` y compilación sintáctica de
  `tools/build_histories.py` y `tools/build_christian_questions.py`.
- El sitio raíz es HTML/CSS estático y no tiene `package.json` ni comando
  de build o lint general. No se ejecutaron los builds ajenos del Worker
  ni del buscador semántico.

Las herramientas de prueba se instalaron y ejecutaron en
`/tmp/verbo-software-check/`, sin agregar dependencias al sitio.

## Estado de entrega

Implementado y validado localmente. El usuario autorizó el commit y el
push a `main` para publicar mediante Git/Cloudflare Pages. Los instaladores públicos de Lumbrera se enlazan desde MEGA. No se alojan
builds locales en la web.
Los cambios ajenos iniciales, `.wrangler/`, Worker, API, secretos y
contenido editorial bíblico permanecen intactos.

## Archivos creados

- `software/assets/desktop-biblioteca-1600.webp`
- `software/assets/desktop-biblioteca-800.webp`
- `software/assets/desktop-estudio-1600.webp`
- `software/assets/desktop-estudio-800.webp`
- `software/assets/software.css`
- `software/index.html`
- `software/lumbrera/assets/README.md`
- `software/lumbrera/assets/biblia-dos-idiomas-1600.webp`
- `software/lumbrera/assets/biblia-dos-idiomas-800.webp`
- `software/lumbrera/assets/buscar-letras-1600.webp`
- `software/lumbrera/assets/buscar-letras-800.webp`
- `software/lumbrera/assets/culto-en-vivo-1600.webp`
- `software/lumbrera/assets/culto-en-vivo-800.webp`
- `software/lumbrera/assets/culto-tema-claro-1600.webp`
- `software/lumbrera/assets/culto-tema-claro-800.webp`
- `software/lumbrera/assets/editor-canciones-1600.webp`
- `software/lumbrera/assets/editor-canciones-800.webp`
- `software/lumbrera/assets/lumbrera.svg`
- `software/lumbrera/index.html`
- `docs/SOFTWARE-REORGANIZATION-2026-10-08.md` (este registro).

## Archivos modificados

- `assets/home/portal.css`
- `biblia/assets/i18n/en.json`
- `biblia/assets/i18n/es.json`
- `historias/amy-carmichael/index.html`
- `historias/billy-graham/index.html`
- `historias/casiodoro-de-reina/index.html`
- `historias/charles-spurgeon/index.html`
- `historias/corrie-ten-boom/index.html`
- `historias/dietrich-bonhoeffer/index.html`
- `historias/elisabeth-elliot/index.html`
- `historias/george-muller/index.html`
- `historias/hudson-taylor/index.html`
- `historias/index.html`
- `historias/jim-elliot/index.html`
- `historias/john-bunyan/index.html`
- `historias/john-newton/index.html`
- `historias/john-wesley/index.html`
- `historias/pandita-ramabai/index.html`
- `historias/samuel-morris/index.html`
- `historias/william-carey/index.html`
- `historias/william-tyndale/index.html`
- `historias/william-wilberforce/index.html`
- `index.html`
- `preguntas-cristianas/ansiedad-falta-de-fe-cristiano/index.html`
- `preguntas-cristianas/apostoles-profetas-hoy-discernimiento/index.html`
- `preguntas-cristianas/guerras-senales-fin-tiempos/index.html`
- `preguntas-cristianas/index.html`
- `preguntas-cristianas/israel-iglesia-promesas-dios/index.html`
- `preguntas-cristianas/matrimonio-cristiano-crisis/index.html`
- `preguntas-cristianas/musica-cristiana-inteligencia-artificial/index.html`
- `preguntas-cristianas/por-que-dios-no-responde-oraciones/index.html`
- `preguntas-cristianas/predestinacion-libertad-responder-dios/index.html`
- `preguntas-cristianas/segundo-bautismo-espiritu-santo/index.html`
- `preguntas-cristianas/soy-salvo-si-sigo-pecando/index.html`
- `sitemap.xml`
- `tools/build_christian_questions.py`
- `tools/build_histories.py`
- `verbo-desktop/index.html`
