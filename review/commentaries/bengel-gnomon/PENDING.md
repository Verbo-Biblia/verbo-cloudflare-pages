# Bengel's Gnomon — pendiente para reparar después

Decisión de Juan (2026-08-27): publicar solo lo que valida limpio ahora
(Mateo, Marcos, Romanos, 1-2 Corintios — 2295 entradas, 0 anomalías sin
resolver) y dejar el resto bloqueado hasta más trabajo, en vez de forzar
la importación completa. Mismo patrón que Trapp (55/66 libros) en Wave 1.

## Qué falta

**Volumen 2** (Lucas, Juan, Hechos) — el peor. **Volumen 4** (Gálatas...
Hebreos) y **Volumen 5** (Santiago...Apocalipsis) — moderado.

176 entradas sin resolver en Hechos, 30 en Lucas, 20 en Juan, y cantidades
menores repartidas en 1 Tesalonicenses (17), Hebreos (14), Apocalipsis
(12), 1 Timoteo (10), 2 Juan (8), Tito (7), 1 Juan (7), 2 Tesalonicenses
(5), Filipenses (2), Colosenses (2), Filemón (1). Lista completa con
detalle exacto por entrada: `ANOMALIES.json` en este directorio, kind
`verse-out-of-range-unresolved`.

## Por qué no se pudieron autocorregir

El importador (`tools/import_bengel_gnomon.py`) ya intenta, en orden:
1. Reatribuir a capítulo-1/-2/-3 si el versículo cabe ahí.
2. Corrección de un solo dígito confundido por OCR (ej. "Lucas 1:84" →
   "1:34", confirmado por el contenido: "πῶς, how)" = "¿cómo será esto?",
   Lucas 1:34).

Lo que queda sin resolver son casos donde el número de versículo está
claramente **corrompido de forma más compleja que un solo dígito** —
ejemplo real: `Hechos 6:382` (capítulo 6 solo tiene 15 versículos; "382"
huele a dos o tres números fusionados, probablemente una nota al pie o
número de página que se coló en el campo del versículo por un salto de
párrafo no detectado). Adivinar aquí sería inventar una referencia, no
corregir una real — por eso quedan fuera en vez de forzarse.

## Causa raíz probable (para cuando se retome)

El volumen 2 en particular parece tener una degradación de OCR distinta
por tramos — mismo volumen, calidad de escaneo variable. Antes de seguir
parcheando el parser genérico, vale la pena:

1. Revisar si existe un escaneo alternativo de mejor calidad para el
   Volumen 2 específicamente en archive.org (no se buscó a fondo, dado
   que el Volumen 1 y 3 del mismo identificador-base ya dieron buen
   resultado).
2. Mirar directamente el texto crudo alrededor de cada caso en
   `ANOMALIES.json` (ya tengo la infraestructura de debug usada en esta
   sesión — ver el historial de iteración en la conversación, o
   reconstruir con `find_real_start()` + `strip_page_furniture()` +
   `extract_and_strip_footnotes()` aplicado paso a paso).
3. Considerar un tercer nivel de corrección: detectar y separar números
   concatenados (ej. "382" → ¿es "38" + "2" con salto de párrafo perdido
   entre ellos?) — no implementado todavía, sería el siguiente paso obvio.

## Cómo retomar

```bash
python3 tools/import_bengel_gnomon.py
```

Ya procesa los 5 volúmenes completos y escribe `ANOMALIES.json` con TODOS
los volúmenes (publicados o no) — solo `PUBLISHED_BOOKS` (en
`import_bengel_gnomon.py`) controla qué libros realmente se escriben a
`biblia/modules/commentaries/bengel-gnomon/books/`. Para publicar un
libro nuevo una vez limpio, agregarlo a ese set y volver a correr.

No se necesita rehacer la investigación de fuente/licencia/edición — ya
está resuelta y documentada en `PROVENANCE.md` para los 5 volúmenes
completos (los mismos 5 volúmenes cubren tanto lo publicado como lo
pendiente).
