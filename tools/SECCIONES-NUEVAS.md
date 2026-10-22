# Secciones preparadas, todavía sin conectar

Rama: `secciones-nuevas`. No agregar enlaces desde portada, menú, pie ni sitemap hasta autorizar su conexión.

## Apps y juegos

- `/apps/`, `/apps/verbo-biblia/`, `/apps/la-senda/`, `/apps/efata/`.
- Efatá: prueba cerrada, primeras cinco lecciones gratis y compra única para el resto; no tiene enlace de tienda.
- Capturas de La Senda ES/EN convertidas de los materiales propios de tienda; Verbo usa `/assets/android/`; Efatá usa sus capturas propias de `play/ficha/`.
- `/juegos/` se construye desde `juegos/catalogo.json`: `python3 tools/build_juegos.py` y `python3 tools/pie_comun.py`.
- `/juegos/preguntas-biblicas/` conserva las 100 preguntas del archivo fuente. El juego es en español, como indica su tarjeta; no usa dependencias externas. Referencias y explicaciones conservadas sin reinterpretación editorial.

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
