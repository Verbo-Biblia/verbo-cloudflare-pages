# Contexto permanente de Verbo

## Proyecto y alcance

- Este es el repositorio activo de Verbo: `/home/juan/Verbo/verbo-cloudflare-pages`.
- El sitio público es `verbobiblia.com` y se despliega mediante Cloudflare Pages desde este repositorio.
- La aplicación bíblica está en `biblia/`; las rutas y archivos antiguos que la situaban en la raíz ya no son válidos.
- No trabajar en repositorios anteriores salvo como referencia histórica o editorial. Todo cambio real pertenece a este proyecto.
- Conservar los cambios ajenos presentes en el árbol y no tocar `.wrangler/`.

## Arquitectura y publicación

- `biblia/modules/registry.json` registra módulos y recursos de la aplicación.
- `biblia/modules/bibles/` contiene las Biblias locales; Biblia Verbo está en `rv-verbo`.
- `biblia/modules/commentaries/`, `biblia/modules/dictionaries/` y `biblia/modules/library/` contienen los demás recursos.
- Después de integrar comentarios, reconstruir sus índices con `tools/build_commentary_index.py` y luego el catálogo con `tools/build_registry_catalog.py`.
- Si cambian `biblia/assets/app.js`, `module-loader.js` o `style.css`, revisar y actualizar sus parámetros `?v=` en `biblia/index.html` para invalidar caché.
- Cloudflare Pages se publica desde Git. El Worker de `cloudflare/api-bible-worker/` tiene despliegue separado y manual con Wrangler.
- No modificar API, secretos, KV, cachés, prompts, Worker ni configuración de Cloudflare cuando la tarea sea exclusivamente editorial.

## Biblia Verbo: norma editorial

- Texto base: Biblia Verbo actual.
- RVA1909: referencia histórica, estructural y de versificación; no modelo obligatorio de redacción.
- BSB y ASV: controles textuales principales disponibles localmente.
- En casos delicados se pueden consultar RVG2004, KJV con Strong y los léxicos locales, sin sustituir el juicio contextual.
- Revisar versículo por versículo en contexto y conservar lo que ya cumple el estándar.
- Corregir solo por una razón concreta: error semántico, omisión, adición, contaminación, arcaísmo innecesario, sintaxis artificial, calco, inconsistencia, gramática, sujeto, género, número, tiempo, referencia, cifra, nombre o problema textual real.
- Aplicar la mínima corrección suficiente. No hacer sustituciones globales ciegas ni producir variación estilística para demostrar actividad.
- Priorizar fidelidad semántica, español latinoamericano contemporáneo, naturalidad y dignidad bíblica.
- Conservar cuidadosamente términos teológicos y decisiones exegéticas defendibles.
- Distinguir siempre un error de traducción de una diferencia de tradición textual. No cambiar silenciosamente las lecturas tradicionales adoptadas por el proyecto.
- Cuando dos traducciones legítimas exijan una postura exegética, conservar la lectura defendible o registrar `DECISIÓN EDITORIAL PENDIENTE` y continuar.

## Estado editorial y registros

- Los 66 libros figuran como candidatos editoriales, pendientes de aprobación humana final, en `review/bible-verbo/PROGRESS.md`.
- El detalle de la revisión del Nuevo Testamento, incluidos conteos, variantes preservadas y decisiones sensibles, está en `review/bible-verbo/NT-EDITORIAL-REVIEW.md`.
- No declarar la traducción perfecta, definitiva u oficial sin aprobación humana expresa.
- Antes de retomar o corregir un libro, consultar ambos registros y verificar el texto real; no confiar solo en resúmenes históricos.

## Validación obligatoria de texto bíblico

- Validar JSON, capítulos, versículos, claves, textos vacíos y correspondencia con la versificación adoptada.
- Comprobar que no haya desplazamientos, duplicaciones accidentales, caracteres anómalos, cifras, nombres o referencias dañadas.
- Comparar conteos con las fuentes locales pertinentes y ejecutar `git diff --check`.
- Mantener por libro un registro breve de versículos revisados y modificados, tipos de corrección, casos delicados y decisiones pendientes.

## Strong y contenido histórico

- El módulo `rv-verbo-strong-provisional` es una alineación provisional: una coincidencia automática o una confianza alta no equivale a aprobación editorial.
- Su método y estado se documentan en `biblia/modules/bibles/rv-verbo-strong-provisional/README.md` y `review/strong/README.md`.
- Las fuentes históricas deben traducirse con fidelidad a su autor; no neutralizar ni atribuirles contenido inventado.
- El contenido propio de Verbo debe mantener rigor bíblico y evitar imponer una tradición denominacional como si fuera el texto.
- Verificar licencia y permiso de uso de cada recurso. Que un archivo sea accesible o descargable no implica permiso comercial.

## Criterios de trabajo

- Hablar con el usuario en español claro y dar resultados verificables.
- Preservar documentación de licencias, registros editoriales activos y reportes con decisiones todavía abiertas.
- Preferir contenido preconstruido y versionado cuando corresponda; no regenerar contenido editorial en producción.
- No exponer claves, tokens, correos ni secretos en archivos, comandos, registros o respuestas.
