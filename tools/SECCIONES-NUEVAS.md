# Secciones Apps, Juegos, Imágenes y Software ampliado

Publicadas el 2026-10-22 (commit c6bb341c): unidas a main, con pie común y sitemap (1112 URL). Al añadir imágenes aprobadas: `python3 tools/build_imagenes.py`, agregar las páginas nuevas al sitemap y hacer push.

## Apps y juegos

- `/apps/`, `/apps/verbo-biblia/`, `/apps/la-senda/`, `/apps/efata/`.
- Efatá: prueba cerrada, primeras cinco lecciones gratis y compra única para el resto; no tiene enlace de tienda.
- Capturas de La Senda ES/EN convertidas de los materiales propios de tienda; Verbo usa `/assets/android/`; Efatá usa sus capturas propias de `play/ficha/`.
- `/juegos/` se construye desde `juegos/catalogo.json`: `python3 tools/build_juegos.py` y `python3 tools/pie_comun.py`.
- `/juegos/preguntas-biblicas/` conserva las 100 preguntas del archivo fuente. El juego es en español, como indica su tarjeta; no usa dependencias externas. Referencias y explicaciones conservadas sin reinterpretación editorial.

## Software ampliado

- `/software/`: programas de escritorio Linux; bloque de Apps (Verbo Biblia y La Senda) y Juegos.
- `/verbo-desktop/`: conserva ruta, contenido, capturas y anclajes existentes. Usa el selector común ES/EN en lugar de su controlador separado; requisitos, privacidad y verificación de paquetes añadidos.
- `/software/lumbrera/`: funciones, capturas existentes, requisitos, pruebas pendientes y licencia todavía por definir (`LicenseRef-Verbo` no significa código abierto).
- Fuentes: `~/Verbo/App-Escritorio-Linux/packaging/linux/README.md`, código local, `~/Verbo/App-Lumbrera-Proyector/ESTADO.md` y los LEEME de `~/Verbo/Instaladores-Linux/`.
- `/software/descargas/`: Lumbrera 1.0.1 DEB/RPM (cada uno menor de 25 MiB), clave pública compartida, firmas DEB y manifiestos firmados de ambos programas. Los manifiestos `.asc` son documentos con firma en claro, no firmas separadas: `gpg --output SUMAS.verificado --decrypt ARCHIVO.asc`, seguido de `sha256sum --ignore-missing -c SUMAS.verificado`. No comprobar un manifiesto sin autenticar.
- Desktop local: 0.9.0-dev, compilación del 9 de octubre. Sus paquetes superan 25 MiB y se mantienen los enlaces externos MEGA ya existentes. Juan confirmó el 2026-10-22 que MEGA entrega esos mismos paquetes firmados. No se inventaron enlaces ni se cambiaron los paquetes remotos.
- Verificados offline: firmas GPG de ambos DEB y ambos manifiestos, coincidencia del texto autenticado con el manifiesto y SHA-256 de los cuatro paquetes originales; copias web idénticas. El validador incluye ahora Software y Desktop, anclajes internos y etiquetas HTML autocerradas.
- No se agregaron conexiones desde portada, menú, pie o sitemap; no se publicó ni se cambió Cloudflare. El pie común conserva sus enlaces anteriores.

## Banco

Requiere Python 3 y Pillow. Fuentes predeterminadas: `~/Verbo/Banco-Imagenes/catalogo/*.json`, `estado.json` y `web/<libro>/<id>.jpg`.

```sh
# Vista previa LOCAL, también incluye estado «generada»:
python3 tools/build_imagenes.py --todas
# Producción: solamente estado «aprobada»:
python3 tools/build_imagenes.py
```

Ambos comandos ejecutan `tools/pie_comun.py` al terminar. `--banco /ruta/al/banco` permite usar una copia fija para reproducir una revisión. No modifica las fuentes.

El generador copia originales, crea miniaturas y recortes centrales 9:16, páginas individuales, colecciones e índice de búsqueda. `imagenes/generated.json` registra únicamente los archivos que puede retirar al regenerar: así una imagen que pierda aprobación o una vista previa anterior no permanece publicada por accidente. Los scripts de búsqueda y visor se conservan.

`--todas` imprime y muestra la advertencia de vista previa, marca las páginas `noindex,nofollow` y distingue las imágenes pendientes de las revisadas. **No desplegar esa compilación**. `noindex` no es un control de acceso: quien conozca la URL puede abrirla. Antes de publicar, reconstruir sin `--todas` y revisar su resultado.

Títulos ingleses: catálogo original. Descripciones inglesas: `description_en` si existe; en caso contrario, síntesis del título, cita y temas traducidos (no traducción íntegra de la descripción española). Etiquetas traducidas en `TAGS`, ampliable al añadir libros; conviene incorporar `description_en` en las fuentes para enriquecer la prosa inglesa. Las colecciones incluyen texto propio en ambos idiomas. No se incorporan recursos al lector ni al Asistente de estudio.

El buscador cruza el intervalo solicitado con el pasaje principal y los paralelos. Ejemplos: `Mt 14`, `Mateo 14:13`, `Mr 6:30-44`, `Matthew 14`. Solo aparecen imágenes con archivo y estado permitido. Una búsqueda sin resultados puede indicar que todavía no hay una imagen producida para esa cita.

Licencia de descarga declarada por el proyecto: gratis para cualquier uso, también comercial; atribución opcional y agradecida. Aviso IA por estado. Los recortes verticales pueden omitir personas o elementos y requieren revisión antes de usarlos como representación de una escena.

No se incluye código publicitario. Solo hay comentarios `verbo:anuncio:banco-entre-filas` y `verbo:anuncio:imagen-lectura`, este último después de las relacionadas, lejos de las descargas. Los encabezados y pies nuevos se ocultan mediante `ocultarSalidas()` en Android; no se cambian las rutas del lector embebido.

## Validación

```sh
python3 tools/validate_sections.py
python3 tools/test_imagenes.py
node tools/check_sections.cjs
node --check imagenes/visor.js
node --check imagenes/buscador.js
git diff --check
```

Validación estática: estructura HTML, IDs, enlaces/recursos locales, claves i18n, JSON-LD, viewport y pie. Pruebas funcionales de búsqueda, 100 preguntas y puerta de aprobación/limpieza del generador. La revisión visual en navegador y los gestos reales en teléfono quedan pendientes: este entorno no permite iniciar un servidor local (socket bloqueado).

## Conexión posterior

Revisar imágenes y prosa inglesa; reconstruir solo aprobadas; agregar accesos a `/apps/`, `/juegos/` y `/imagenes/` en portada/menú/pie y agregar al sitemap únicamente páginas listas. Esta tarea no cambia la configuración de Cloudflare ni publica.

Los commits solicitados quedaron bloqueados por permisos: el índice de este worktree está en `/home/juan/Verbo/Sitio-Web-verbobiblia/.git/worktrees/Sitio-Web-verbobiblia-secciones/`, fuera de la zona permitida. No se cambió la rama ni se hizo push.

## Pulido del banco · 2026-10-21

- Diseño propio en `imagenes/banco.css`, sobre papel crema y azul Verbo. Mosaico 16:9, búsqueda protagonista, sugerencias bilingües, filtros y colecciones con portada.
- El generador añade `-media.jpg` (hasta 640 px), `srcset`, resolución/peso del original, nombres de descarga legibles, navegación bíblica y fichas con panel lateral. Visor modal con rueda, doble clic, pellizco, arrastre, teclado y restauración de foco.
- Compilación final sin `--todas`: 164 aprobadas y 386 colecciones. Se ejecutó el pie común; se retiraron sus reescrituras ajenas al alcance sobre páginas previamente limpias.
- Validaciones estáticas y funcionales de esta guía superadas.
- **Revisión visual pendiente, no se declara terminado:** `python3 -m http.server 8782` falla al crear el socket (`Operation not permitted`). Chrome headless con perfil en `/tmp` también falla en `setsockopt: Operation not permitted`. No hay capturas finales válidas ni comprobación de gestos en dispositivo real. Verificar portada, ficha y colección a 1400 y 420 px en un entorno que permita Chrome y servidor local.
