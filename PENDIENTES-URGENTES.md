# Pendientes urgentes de Verbo

Actualizado el 11 de agosto de 2026. El orden de esta lista define la prioridad.

| Prioridad | Pendiente | Estado actual | Próxima acción |
| --- | --- | --- | --- |
| 1 | Cartas de Rutherford mal etiquetadas en Artículos y Reflexiones | Juan reportó que aparecen en todas las categorías del filtro. Investigación pausada a mitad de camino (2026-08-11): revisé `recursos/data/recursos.json` y el HTML generado (`recursos/articulos-y-reflexiones/index.html`) para las 10 cartas — `data-subtipo` (articulo/reflexion/devocional) y `data-tema` SÍ están variados por carta, no son idénticos entre sí, así que la hipótesis "todas tienen la misma etiqueta" queda descartada. Encontré un defecto puntual real de camino: la carta 29 (`rutherford-carta-29-marion-mnaught`) trae `data-tema="sufrimiento,vida-en-cristo"`, pero el `<select data-filter-group="tema">` de esa página no tiene ninguna opción `vida-en-cristo` (existe `vida-cristiana`, con guion distinto) — ese tag nunca hace match con ningún filtro, así que ese caso queda invisible bajo cualquier tema, no explica por sí solo el síntoma reportado ("aparecen en todas"). No llegué a revisar `recursos/assets/filters.js` en profundidad contra el caso real en navegador, ni descarté que el problema esté en otra vista/índice (no el filtro combinable de esta página) que agrupe por categoría de otra forma. | Reproducir en el navegador filtrando por un tema/subtipo que NINGUNA carta de Rutherford debería tener, confirmar si aparecen igual. Si sí, revisar `initBar()`/`apply()` en `recursos/assets/filters.js` (líneas ~38-53) con las cartas de Rutherford como caso de prueba. Corregir además el typo `vida-en-cristo`→`vida-cristiana` en la carta 29 (`recursos/data/recursos.json` y el HTML ya generado) de paso. |
| 2 | Buscador semántico | Reconstruido y publicado el 2026-08-10. Índice español (Biblia Verbo: 31.097 versículos + 5.677 perícopas de 6 versículos) e índice inglés (BSB, dominio público: 31.102 versículos + 5.678 perícopas) generados y publicados en `biblia/modules/semantic-search/bible-rv-verbo/` y `bible-en-bsb/`. Ranking híbrido semántico+léxico, atajo de referencia directa (Fase 9), Biblia activa del usuario respetada al mostrar/abrir resultados. Evaluado con ~29 consultas es + ~23 en (ansiedad, miedo, perdón, duelo, dinero, etc.): resultados de alta relevancia en ambos idiomas. Ver detalle técnico en `tools/semantic-search/README.md`. | No hay pendiente bloqueante. |

## Resuelto recientemente (2026-08-11)

- **Indicador flotante "Traduciendo para usted…"** durante traducción en vivo sin caché (Biblia, comentarios, historia de la Iglesia, patrística, Librería, páginas estáticas). Dos rondas de fix: la primera cubría abandonar una traducción ya en curso; la segunda (la real, verificada en vivo) cerró dos huecos — un `setTimeout(150ms)` que no se cancelaba al cerrar el panel, y falta de chequeo de generación entre pasos (título→autor→cuerpo) dentro de una misma tarjeta de comentario. Ver commits `03bc9d9`, `11d682f`, `198e0cc`.
- **Tamaño de letra ajustable en Librería** (botones A−/A+ + pellizco con dos dedos en móvil, reflow real vía `--reading-font-size`, no zoom). Ver commit `4c4fe34`.

## Referencias

- Buscador semántico: `tools/semantic-search/README.md`
