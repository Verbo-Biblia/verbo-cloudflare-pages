# Traducción al inglés de Comentarios Verbo

## Objetivo

Traducir al inglés todas las entradas existentes de Comentarios Verbo y conservar
un solo módulo bilingüe: `biblia/modules/commentaries/comentarios-verbo/`.

Hebreos es el modelo estructural. Cada entrada debe mantener un solo `id`, una
sola referencia bíblica y un solo autor, mientras `title` y `content` contienen
las versiones `es` y `en`. La aplicación selecciona directamente el idioma de
la interfaz; cuando ambos idiomas existen, no debe utilizar traducción automática
en tiempo de ejecución.

Esta tarea cubre las entradas que ya existen. No implica completar la cobertura
expositiva de los libros que todavía tengan pocos pasajes comentados.

## Estado general

| Libro | Entradas | Español | Inglés | Estado |
|---|---:|---:|---:|---|
| Génesis | 6 | 6 | 6 | Bilingüe |
| 1 Juan | 21 | 21 | 0 | Pendiente |
| Judas | 10 | 10 | 0 | Pendiente |
| Filipenses | 19 | 19 | 0 | Pendiente |
| Romanos | 65 | 65 | 0 | Pendiente |
| 1 Corintios | 58 | 58 | 0 | Pendiente |
| 2 Corintios | 39 | 39 | 0 | Pendiente |
| **Total pendiente** | **212** | **212** | **0** | **Pendiente** |
| Hebreos (modelo terminado) | 46 | 46 | 46 | Bilingüe |

## Formato obligatorio

Antes:

```json
{
  "title": "Romanos 1:1-7 — Título en español",
  "content": "<p>Contenido en español.</p>"
}
```

Después:

```json
{
  "title": {
    "es": "Romanos 1:1-7 — Título en español",
    "en": "Romans 1:1–7 — English Title"
  },
  "content": {
    "es": "<p>Contenido en español.</p>",
    "en": "<p>English content.</p>"
  }
}
```

No se deben cambiar `id`, `author` ni `reference`. El texto español actual debe
preservarse exactamente, salvo que se abra y documente una corrección editorial
separada.

## Criterios de traducción

- Traducir el sentido completo con inglés natural, claro y digno.
- Conservar el argumento, los matices exegéticos y la orientación pastoral del
  original; no resumir, ampliar ni introducir posturas nuevas.
- Mantener intacta la estructura HTML: párrafos, énfasis, encabezados, listas y
  demás etiquetas.
- Traducir los rótulos editoriales de forma consistente, por ejemplo:
  `Aplicación` → `Application`, `Síntesis espiritual` → `Spiritual synthesis` y
  `Oración` → `Prayer`.
- Usar nombres bíblicos y terminología teológica naturales en inglés, sin copiar
  mecánicamente la sintaxis española.
- Revisar las citas bíblicas en contexto. No atribuir una cita textual a una
  versión inglesa específica si el original no lo hace.
- Mantener nombres propios, cifras, capítulos, versículos y referencias sin
  alteraciones accidentales.
- No reemplazar el módulo por una copia inglesa ni crear otro manifiesto: ambos
  idiomas pertenecen a la misma entrada.
- Una vez incorporado `en`, esa entrada no debe depender del traductor automático
  de la aplicación.

## Orden de trabajo

- [x] 1. Génesis — 6 entradas bilingües; terminado 2026-08-12
- [ ] 2. Judas — 10 entradas
- [ ] 3. Filipenses — 19 entradas
- [ ] 4. 1 Juan — 21 entradas
- [ ] 5. 2 Corintios — 39 entradas
- [ ] 6. 1 Corintios — 58 entradas
- [ ] 7. Romanos — 65 entradas

El orden comienza con lotes pequeños para validar el método y termina con los
libros de mayor volumen. Cada libro debe revisarse y validarse antes de marcarlo
como terminado.

## Registro por libro

Al completar un libro, anotar debajo de su casilla:

- fecha de terminación;
- cantidad de entradas traducidas;
- cantidad de títulos y contenidos con `es` y `en`;
- términos o pasajes delicados;
- decisiones editoriales pendientes;
- validaciones ejecutadas.

Si una decisión no puede resolverse responsablemente, registrar
`DECISIÓN EDITORIAL PENDIENTE`, conservar una traducción defendible y continuar
con el resto del lote.

## Validación obligatoria

Por cada libro:

1. Validar que el JSON sea correcto.
2. Confirmar que el número de entradas no cambió.
3. Confirmar que todos los `title` y `content` contienen valores no vacíos para
   `es` y `en`.
4. Comparar los `id` y `reference` antes y después para comprobar que no cambiaron.
5. Buscar texto vacío, HTML roto, caracteres anómalos y referencias dañadas.
6. Probar la visualización en español e inglés y confirmar que cambiar el idioma
   selecciona el contenido ya almacenado, sin mostrar el indicador de traducción.
7. Reconstruir los índices con `tools/build_commentary_index.py` y después el
   catálogo con `tools/build_registry_catalog.py`.
8. Ejecutar `git diff --check` y revisar el diff completo del libro.

## Condición de finalización

La tarea estará terminada cuando las 218 entradas pendientes tengan títulos y
contenidos completos en `es` y `en`, las siete filas estén registradas como
bilingües, los índices y el catálogo estén actualizados, y la selección de ambos
idiomas haya sido verificada en la aplicación.

Esto no constituye aprobación humana final del contenido editorial. La traducción
inglesa seguirá siendo candidata editorial hasta su revisión y aprobación.
