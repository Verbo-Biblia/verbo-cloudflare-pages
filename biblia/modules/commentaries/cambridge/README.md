# Cambridge Bible for Schools and Colleges

Integración inglesa de la serie de comentarios publicada por Cambridge
University Press entre 1878 y 1918 (dominio público).

## Procedencia

- Texto normalizado desde las páginas por capítulo de
  `https://biblehub.com/commentaries/cambridge/`.
- Comprobación puntual de omisiones contra escaneos de dominio público de
  Internet Archive; por ejemplo, *The Book of Deuteronomy* de George Adam
  Smith (1918), marcado como Public Domain.
- Los HTML descargados se usan únicamente como insumo temporal del importador
  y no forman parte de la aplicación publicada.

## Conversión

`tools/import_cambridge_complete.py` descarga o reutiliza una caché temporal,
elimina navegación, versículos duplicados, scripts, estilos y otros elementos
de la página, conserva párrafos, énfasis y texto hebreo/griego, y escribe el
formato nativo de comentarios de Verbo.

Las referencias publicadas usan los IDs canónicos de Verbo. Cuando Cambridge
agrupa varios versículos, una sola entrada cubre el rango hasta la siguiente
nota real. Las diferencias conocidas de versificación KJV/Verbo se convierten
mediante reglas explícitas en el importador y se conserva `sourceReference`
para auditoría.

La ausencia de una entrada no se rellena artificialmente. Puede significar que
la obra impresa no ofrece una nota independiente para ese versículo. La vista
agregada usada como fuente no expone comentarios para Deuteronomio 23; ese
capítulo se recupera como una sección completa desde el OCR del volumen impreso
de George Adam Smith conservado por Internet Archive.

La fuente no ofrece una nota independiente para `LEV 15:1`, `1CH 23:1`,
`2CH 15:1`, `EST 7:1`, `EST 8:1-2`, `PRO 13:1`, `PRO 28:1` y `EZK 3:1-3`.
Esos silencios se conservan deliberadamente: asociarles la nota posterior
falsearía el alcance editorial del comentario.

## Idioma y traducción

El contenido versionado permanece en inglés. Verbo puede ofrecer la traducción
automática bajo demanda ya existente en el panel, pero el importador no traduce
ni guarda traducciones del corpus.
