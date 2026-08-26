# Wave 1 — estado para reanudar

Fecha de pausa: 2026-08-26 (actualizado antes de reiniciar el equipo)

## 1. Matthew Poole — completado

- Commit: `7279abda` (`feat(commentary): add Matthew Poole annotations`).
- Módulo: `matthew-poole-annotations`.
- Cobertura: 66 libros, 1.188 capítulos con notas, 25.970 entradas.
- Fuente: EEBO-TCP A55363 y A55368, ambos CC0.
- Validación y procedencia: `review/commentaries/matthew-poole/`.
- No se modificó el esquema, loader, interfaz, Worker, caché ni sistema de
  traducción de Verbo.

## 2. John Trapp — detenido por cobertura incompleta

Se completó el inventario TCP y se descargaron temporalmente seis XML para
inspección. No se generó ni registró ningún módulo Trapp.

| TCP | Cobertura comprobada | Edición | Bytes | SHA-256 |
|---|---|---|---:|---|
| A94797 | Génesis–Deuteronomio | Londres, 1649/1650 | 2.546.397 | `a1b0ef079a728f6ff40b8bc3d80bf5a413dca2cd6e08433eee4a62be293b05d5` |
| A63066 | Esdras, Nehemías, Ester, Job, Salmos | Londres, 1657 | 5.977.533 | `8899d8ef3b1af3be79b96feba3a19857f2c485854e98ab5e5789f22d0e991d4f` |
| A63069 | Proverbios–Daniel | Londres, 1660 | 5.785.516 | `0622c547e10058daae32da35e8cedef3e9cd5cc5e8eecf8c65315b8973248744` |
| A63068 | Doce Profetas Menores | Londres, 1654 | 5.622.895 | `1433f8113cb45b34400e1effacb259cdc15ff4789993ddff9348699457cab69b` |
| A63067 | Mateo, Marcos y Lucas solamente | Londres, 1647 | 4.838.972 | `63d2f9a9e54439cce653aa8e3bac1bc5a6f622ef0d4fd74321dd8d02d7957c1f` |
| A63065 | Romanos–Apocalipsis | Londres, 1647 | 2.919.407 | `440b7caa1fc282bccd576ad0559dd29ac2fe6d788dcce7d9fbbf00756834dcf0` |

Cada XML está disponible en:

`https://raw.githubusercontent.com/textcreationpartnership/<TCP>/master/<TCP>.xml`

Cada registro bibliográfico y su evidencia de derechos está en:

`https://name.umdl.umich.edu/<TCP>.0001.001`

Los seis encabezados TEI declaran CC0 1.0 para la transcripción codificada; la
renuncia no se extiende a imágenes de página ni archivos suplementarios.

### Motivo de la detención

Los TEI CC0 localizados cubren 55 de los 66 libros. Faltan:

- Josué, Jueces, Rut, 1–2 Samuel, 1–2 Reyes y 1–2 Crónicas;
- Juan y Hechos.

A63067 lleva un título que promete los cuatro Evangelios y Hechos, pero el XML
concreto contiene solo tres divisiones `commentary` y termina al final de Lucas
24:53. Por tanto, no se debe inferir cobertura desde el título del registro.

No se usarán StudyLight, Truth According to Scripture, SermonIndex, PDFs
modernos ni otros sitios secundarios para rellenar los once libros sin una
procedencia y licencia del texto digital equivalentes. Tampoco se publicarán
los 55 libros como `Complete Commentary` sin una decisión editorial explícita.

## Punto exacto de reanudación

1. Mantener Trapp detenido; decidir posteriormente entre importar los 55
   libros con un nombre inequívocamente parcial o esperar fuentes CC0 para los
   once faltantes.
2. Continuar Wave 1 con J. B. Lightfoot, solamente *Colossians & Philemon*,
   Project Gutenberg #50857.
3. No tocar arquitectura de Verbo: cada comentario debe adaptarse al esquema
   existente. Si no puede hacerlo fielmente, detenerlo y documentarlo.

El único archivo ajeno/no rastreado observado antes de esta tarea es
`DIAGNOSTICO-INDEXACION-2026-08-26.md`; debe preservarse y no incluirse en
commits de comentarios.

## 3. J. B. Lightfoot — trabajo local en curso, todavía no integrado

La importación de *St. Paul's Epistles to the Colossians and to Philemon* está
pausada antes de su validación e integración definitiva. No hay cambios en el
registro de módulos ni commit de Lightfoot.

Archivos de trabajo no rastreados que deben conservarse:

- `tools/import_lightfoot_colossians_philemon.py`
- `review/commentaries/jb-lightfoot/`
- `biblia/modules/commentaries/lightfoot-colossians-philemon/`

Fuente comprobada:

- Project Gutenberg #50857: `https://www.gutenberg.org/ebooks/50857`
- HTML: `https://www.gutenberg.org/cache/epub/50857/pg50857-images.html`
- Edición: Macmillan, Londres, 1875.
- Archivo temporal usado: `/tmp/pg50857-images.html` (no sobrevivirá
  necesariamente al reinicio).
- Tamaño: 1.934.414 bytes.
- SHA-256:
  `27b4b4c4dbf1f74131abb4e480963ae43739ebb570a3c7b7928ae503c5c27b09`.

Estado técnico pendiente:

1. El importador fue corregido para inferir capítulos desde los anclajes del
   texto base excluido y recuperar Colosenses 4:1, pero todavía debe
   regenerarse y validarse después de esa corrección.
2. Revisar el recorrido editorial para conservar bloques significativos
   centrados sin duplicar listas o elementos anidados.
3. Dividir únicamente entradas mayores de unos 18.000 caracteres por bloques
   HTML semánticos, manteniendo la misma referencia; no modificar cliente,
   Worker, caché, loader ni esquema de Verbo.
4. Regenerar el módulo, comprobar cobertura canónica completa de COL y PHM,
   IDs, referencias, HTML, Unicode/griego y muestras de inicio/medio/final.
5. Crear `VALIDATION.md`; solo después registrar el manifiesto, ejecutar
   `tools/build_commentary_index.py` y `tools/build_registry_catalog.py`,
   comprobar carga y realizar el commit lógico.

Resultado provisional anterior a la última corrección (no tomar como final):
190 entradas y 1.422.231 bytes; faltaba COL 4:1 y la entrada COL 1:15 excedía
20.000 caracteres. El módulo generado actual debe considerarse provisional y
regenerarse mediante el importador, no editarse a mano.

Regla reafirmada por el usuario: no modificar nada de Verbo para acomodar un
comentario. El corpus y su conversión deben ajustarse a las convenciones ya
existentes; si no es posible con fidelidad, detener y documentar.
