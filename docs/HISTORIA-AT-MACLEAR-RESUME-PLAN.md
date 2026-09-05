# Maclear y el Asistente — estado para reanudar

Guardado: 2026-09-04
Estado: `VALIDATED_PENDING_PUBLICATION`

## Reanudación y validación — 2026-09-04

El usuario reanudó el trabajo después de la pausa. El catálogo fue regenerado;
validate_maclear.py pasó en los 1.189 paquetes. La comparación contra HEAD
excluyendo Maclear preservó íntegros los recursos anteriores. Las 34 pruebas
locales de Chrome pasaron: 17 fichas en español e inglés, siete categorías,
entrada completa exacta, cero errores JavaScript y cero solicitudes de
traducción para Maclear. Falta subir el commit y verificar Cloudflare Pages.

Los apartados siguientes son el registro histórico de las pausas y no
representan tareas pendientes cuando ya estén completadas arriba.

## Nueva pausa solicitada — 2026-09-04

Estado: `PAUSED_BY_USER`. No publicar ni continuar hasta que el usuario reanude.

- Se cotejaron las 17 fichas con las unidades completas enlazadas. Se concretó
  su aporte contextual, se corrigieron atribuciones y se estrecharon cinco
  rangos: calendario a LEV 23:1–44; monarquía a 1SA 10:17–27;
  Ezequías a 2KI 18:1–19:37; caída de Judá hasta 2KI 25:26;
  Nehemías a NEH 1:1–2:20. Los IDs estables se conservaron.
- Las 17 fichas tienen traducción inglesa preconstruida (`translations.en`),
  proyectada como `traducciones.en` por el ensamblador. El cliente usa este
  texto sin solicitarlo al Worker.
- Se habilitaron en `study-assistant.js` el enlace profundo de Maclear,
  su nombre legible y las seis etiquetas de categoría que faltaban.
  Se actualizaron ambos diccionarios de interfaz y sus versiones en index.html.
- Pasó la validación fuente de IDs, entradas, texto, traducciones,
  versificación y proyección del ensamblador en ambos extremos de las 17 fichas.
- El constructor COMPLETO terminó correctamente: 1.189 capítulos en 403,684 s.
  Pasaron sus pilotos y regresión. La salida actual es completa; no restaurarla
  ni confundirla con la salida parcial descartada el 2 de septiembre.
  El registro temporal está en `/tmp/maclear-build.log`.
- Se creó `tools/asistente-estudio/validate_maclear.py` para verificar todos
  los paquetes, rangos, duplicados, enlaces, traducciones y catálogo.
  Todavía NO se ejecutó: primero debe regenerarse el catálogo.
- Pasó `node --check` en study-assistant.js y service-worker.js.
- Playwright 1.63.0 quedó disponible en
  `/home/juan/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`;
  Google Chrome está instalado. La prueba de navegador aún no se ejecutó.
- No se creó commit, no se subió a Git ni se publicó. No se desplegó el Worker.

### Próximos pasos al reanudar

1. Regenerar `build_catalogo_traducciones.py` y ejecutar `validate_maclear.py`.
2. Comparar los paquetes con HEAD excluyendo únicamente Maclear para asegurar
   que Sayce, Concilios y los demás recursos permanezcan idénticos.
3. Probar en navegador real las siete categorías, enlaces a entradas completas
   y las fichas en inglés sin solicitudes de traducción para Maclear.
4. Ejecutar validación JSON y `git diff --check`, actualizar los registros
   editoriales y de cierre con los resultados reales.
5. Solo tras completar todo, retomar el paso de commit/publicación del plan.

Los apartados siguientes conservan el estado histórico del 2 de septiembre;
esta actualización prevalece cuando haya diferencias.

## Base publicada

- `main` y `origin/main`: `8d7a904e`.
- La obra completa de Maclear ya está publicada en `🏛️ Historia`: 74 unidades,
  índice semántico y navegación por once libros.
- Sayce permanece cerrado con sus tres fichas del Asistente.

## Decisión editorial corregida

El Asistente debe mostrar contenido valioso que no esté inmediatamente visible
en el pasaje cuando esté ligado de manera fundada a acontecimientos, períodos,
lugares, instituciones o personajes. No se exige que todo aporte sea evidencia
arqueológica independiente. Sí se exige utilidad real, atribución, anclaje
preciso y enlace a la unidad completa.

Excluir únicamente:

- la mera repetición o paráfrasis del relato bíblico;
- asociaciones débiles;
- fechas de 1894 presentadas como certezas de Verbo;
- reconstrucciones obsoletas o discutibles sin atribución y límites.

## Trabajo fuente ya preparado, no publicado

- `tools/asistente-estudio/data/historia-at-maclear.json`: 17 fichas
  `APPROVED`.
- `tools/asistente-estudio/ensamblador.py`: carga y proyecta esas fichas.
- `tools/asistente-estudio/build_paquetes_asistente.py`: registra el módulo con
  idioma fuente `es`, porque las fichas editoriales están redactadas en español.
- `data/.../editorial/ASSISTANT-REVIEW.md`: decisión y criterios.
- `biblia/service-worker.js`: versión prevista
  `verbo-biblia-v76-maclear-assistant`.

Las 17 fichas cubren: tabernáculo, sacerdocio, sacrificios, calendario sagrado,
fiestas, legislación civil, distribución territorial, período de los jueces,
transición a la monarquía, Jerusalén como capital, templo, reino dividido,
caída de Samaria, Ezequías y Asiria, caída de Judá, restauración persa y
reorganización bajo Nehemías.

## Punto exacto de interrupción

Se inició el constructor completo y se interrumpió por solicitud del usuario
después de `150/1189` capítulos. El constructor elimina el directorio de salida
al comenzar; por eso los paquetes parciales fueron descartados y se restauró
`biblia/modules/study-assistant/chapters/` desde `HEAD`. No debe conservarse ni
publicarse aquella salida parcial. No hay proceso en ejecución.

## Orden obligatorio al reanudar

1. Revisar las 17 fichas contra sus capítulos completos de Maclear y comprobar
   texto, rango, categoría y `sourceEntryId`. Ajustar cualquier ficha demasiado
   amplia o que solo parafrasee el pasaje.
2. Validar JSON e IDs únicos de `historia-at-maclear.json`; comprobar que cada
   entrada exista en el módulo y que cada rango esté dentro de la versificación
   local BSB usada por el constructor.
3. Ejecutar el ensamblador para una muestra de cada ficha y verificar el enlace
   profundo (`modulo`, `entradaId`, `fichaId`, `recursoId`).
4. Reconstruir los 1.189 paquetes sin interrumpir:

   ```bash
   python3 tools/asistente-estudio/build_paquetes_asistente.py
   ```

   Parámetros previstos: salida predeterminada
   `biblia/modules/study-assistant/chapters/`; no usar `--pilots-only`; no usar
   `--keep-output`. La ejecución observada tarda varios minutos y primero corre
   pilotos y regresión.
5. Regenerar el catálogo de traducción solo después de terminar los paquetes:

   ```bash
   python3 tools/asistente-estudio/build_catalogo_traducciones.py
   ```

6. Verificar exactamente 1.189 paquetes, ausencia de duplicados y presencia de
   las 17 fichas únicamente en sus rangos. Confirmar que Sayce y Concilios no
   sufran regresiones.
7. Ejecutar `node --check` sobre los JS modificados, validación JSON,
   `git diff --check` y prueba local en navegador de al menos una ficha de cada
   categoría y sus enlaces a la entrada completa.
8. Actualizar `ASSISTANT-REVIEW.md`, `HISTORIA-AT-MACLEAR-CLOSURE.md` y
   `HISTORIA-AT-RESUME-STATE.md` de `PENDING_BUILD` a cerrado únicamente cuando
   todas las verificaciones anteriores pasen.
9. Crear un commit separado para esta corrección, subirlo a `main`, esperar el
   éxito de Cloudflare Pages y comprobar los recursos en producción.

## Límites

- No avanzar a Pinches ni H. P. Smith antes de cerrar Maclear.
- No tocar Biblia, prompts, secretos, KV, API ni configuración de Cloudflare.
- El catálogo estático del Worker solo cambia como artefacto generado por el
  Asistente; el Worker no se despliega.
- Preservar los directorios de staging sin seguimiento de las otras fuentes.
