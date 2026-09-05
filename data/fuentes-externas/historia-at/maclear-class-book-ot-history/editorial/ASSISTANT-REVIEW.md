# Evaluación para el Asistente — Maclear (1894)

Fecha: 2026-09-04
Estado: `APPROVED_VALIDATED`
Fichas publicables: **17**

## Resultado

Se revisó la naturaleza editorial de las 71 unidades narrativas, el aviso del
autor, el apéndice cronológico y el índice. Se seleccionaron 17 síntesis que
aportan contexto institucional, legal, geográfico, político, cronológico o
imperial no inmediatamente visible en el pasaje. Cada ficha está anclada a una
perícopa explícita, atribuye el planteamiento a Maclear y enlaza a la unidad
exacta de la obra completa.

Se excluyeron las secciones que únicamente vuelven a narrar el texto bíblico,
las aplicaciones confesionales sin contenido contextual adicional y las fechas
de 1894 cuando solo podían repetirse como certezas. La ausencia de contraste
moderno no convierte estas fichas en evidencia arqueológica: su tipo y su texto
las presentan expresamente como síntesis históricas atribuidas.

## Criterios aplicados

1. Una paráfrasis del pasaje no se publica como contexto histórico del mismo,
   pero una explicación valiosa de acontecimientos, períodos o instituciones sí.
2. Las fechas `B.C.` de Maclear no se convierten en cronología de Verbo.
3. Las interpretaciones tipológicas o doctrinales permanecen atribuidas al
   autor dentro del documento completo.
4. Las referencias cruzadas bíblicas no producen anclajes automáticamente.
5. El valor contextual no exige que la obra sea evidencia arqueológica
   independiente; sí exige atribución, utilidad real y un anclaje defendible.

Las fichas canónicas están en
`tools/asistente-estudio/data/historia-at-maclear.json`.

## Cotejo final y validación — 2026-09-04

Se cotejaron las 17 fichas con sus entradas completas. Se reemplazaron
presentaciones genéricas del contenido por aportes concretos del autor y se
corrigieron las atribuciones: la entrada de Jueces explica la continuidad del
gobierno tribal; la de elección de Saúl relaciona 1 Samuel 10:25 con
Deuteronomio 17. No se atribuye a esas entradas contenido de otros capítulos.

Se estrecharon cinco rangos, conservando los IDs estables:

- Calendario: Levítico 23:1–44, sin extenderlo a todo el capítulo 24.
- Monarquía: 1 Samuel 10:17–27, según la unidad enlazada.
- Ezequías: 2 Reyes 18:1–19:37, limitado a la amenaza asiria.
- Caída de Judá: 2 Reyes 23:31–25:26, sin el epílogo sobre Joaquín.
- Nehemías: 1:1–2:20, para la comisión real y la fortificación de Jerusalén.

Las 17 traducciones inglesas se prepararon junto con el texto español y se
publican dentro de los paquetes. No requieren regeneración en producción ni
actualizar el Worker para mostrarse. La lectura completa conserva su mecanismo
previo de traducción diferida; esta revisión no sustituye la transcripción.

Validación: 1.189 paquetes, 17 fichas, 53 recursos por capítulo y 1.547
apariciones por versículo, todas dentro de sus rangos. Los 53 paquetes
modificados son idénticos a HEAD al excluir únicamente Maclear: se preservan
Sayce, Concilios y los demás recursos. El catálogo reúne 7.070 recursos únicos.
Las 34 pruebas locales en Chrome cubrieron las 17 fichas en ambos idiomas,
siete categorías y la apertura de cada entrada exacta, con cero errores de
JavaScript y cero solicitudes de traducción de Maclear al Worker.

Comprobaciones reproducibles:

```bash
python3 tools/asistente-estudio/validate_maclear.py
# Playwright debe estar instalado; PLAYWRIGHT_PATH admite la ruta al paquete.
PLAYWRIGHT_PATH=/ruta/a/node_modules/playwright node tools/asistente-estudio/test_maclear_browser.cjs
```

El navegador usa un servidor local en 127.0.0.1:8765 por defecto. BASE_URL
permite comprobar la publicación; CHROME_PATH permite indicar otro ejecutable.
Las solicitudes a servicios externos se bloquean en la prueba para verificar
que la traducción de las fichas está disponible por sí misma.
