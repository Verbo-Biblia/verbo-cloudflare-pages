# Criterios de examen — Exegesis Verbo

> Este documento aplica **exclusivamente** al módulo `exegesis-verbo`
> (`biblia/modules/commentaries/exegesis-verbo/`). **No es lo mismo que
> "Exégesis Canónico Verbo"** — son proyectos distintos con estándares
> propios. No reutilizar estos criterios para ese otro proyecto sin
> revisarlos primero.

Referencia de calidad: **Efesios** (`books/EPH.json`), esquema **CEV-1.0**.
Cualquier libro nuevo o regenerado se compara contra esa vara, no contra el
promedio del corpus actual (buena parte del corpus está por debajo de ella).

## 1. Schema JSON obligatorio (no negociable)

El sitio solo consume esta forma exacta — cualquier otra estructura no
carga sin reescritura previa:

```json
{
  "entries": [
    {
      "id": "cev-{libro}-{cap}-{vIni}-{vFin}",
      "title": "...",
      "author": "Verbo",
      "reference": {
        "book": "XXX",
        "chapterStart": 1, "verseStart": 1,
        "chapterEnd": 1, "verseEnd": 2
      },
      "content": "<section>...</section>"
    }
  ]
}
```

- Va acompañado de un `books/{ID}.index.json` paralelo (solo `id` + `reference`).
- Rechazar de plano cualquier entrega con forma distinta (p. ej. clave raíz
  `units` en vez de `entries`, campos sueltos como `unit`, `syntaxAndGrammar`,
  `theologicalImplications`, `bibliography` fuera de `content`, archivos
  partidos por capítulo tipo `TIT-1.json`). Eso indica una herramienta de
  generación distinta al pipeline real del sitio.

## 2. Estructura interna de cada `content` (secciones `<h3>`)

Fijas (deben aparecer en casi toda perícopa, salvo saludos/cierres muy cortos):
- Contexto literario
- Comentario exegético
- Intertextualidad
- Historia de la redención
- Implicaciones teológicas
- Dificultades interpretativas

Condicionales (solo si el pasaje las amerita — su ausencia NO es defecto):
- Contexto histórico
- Lengua original (solo si hay término griego con peso exegético real)
- Sintaxis y gramática
- Crítica textual (solo si existe variante textual real)
- Relación pactual

**Red flag:** un libro entero donde una sección fija nunca aparece (0/N
entradas) no es "el pasaje no lo ameritaba" — es un libro de una generación
de esquema distinta (más vieja/más pobre) que necesita regenerarse.

## 3. Densidad mínima (proxy de profundidad real)

Medir por perícopa y comparar contra Efesios como techo:

| Métrica | Efesios (referencia) | Piso aceptable |
|---|---|---|
| h3 por entrada | 7.00 | ≥ 4.0 |
| caracteres por entrada | ~4165 | ≥ 1800 |
| caracteres por versículo cubierto | ~537 | ≥ 150 |

Por debajo del piso, el libro cae en "nivel bajo" (ver conversación previa:
TIT, JAS, PHM, 1PE, 2PE, 1JN, 2JN, 3JN eran así antes de borrarse).

**Ojo con la densidad falsa:** un conteo alto de caracteres no basta. Si el
contenido "denso" es la misma oración-resumen parafraseada en 8 subtítulos
distintos, cuenta como relleno, no como profundidad. Ver §5.

## 4. Contenido verificable, no genérico

Cada perícopa debe tener, cuando aplique:
- Términos griegos **reales**, con enlace Strong (`#sG####`) y explicación
  ligada al contexto concreto del versículo — no una glosa de diccionario
  suelta.
- Referencias cruzadas con **cita exacta** (libro capítulo:versículo), no
  alusiones vagas ("el corpus paulino en otros lugares...").
- Variantes textuales **reales**, nombrando testigos o al menos la
  naturaleza concreta de la variante — no una mención abstracta de que
  "existe una discusión textual".
- Prueba de fuego: ¿la sección "Comentario exegético" podría copiarse a
  cualquier otra perícopa de cualquier otro libro cambiando solo el título,
  sin que se note? Si sí, no pasa.

## 5. Neutralidad doctrinal en pasajes disputados

En los puntos donde el texto es terreno de disputa histórica real
(elección/predestinación, roles de género, esclavitud, ley/gracia,
apostasía, etc.):
- Sostener las lecturas en tensión que el propio corpus canónico sostiene,
  en vez de forzar la conclusión de un sistema posterior (calvinismo,
  arminianismo, complementarismo, etc.).
- Cuando el pasaje deja algo genuinamente abierto, decirlo explícitamente
  en "Dificultades interpretativas" — no fingir certeza ni usar `disputed`
  como refugio perezoso sin argumentar por qué sigue abierto.

## 6. Señales de generación mecánica (descalifican de inmediato)

Encontradas en el intento de agosto 2026 para los 8 libros de nivel bajo:
- La misma frase-resumen de una línea repetida, parafraseada, en 5–10
  subtítulos distintos de la misma entrada (relleno para inflar conteo de
  caracteres).
- Errores de sustitución de plantilla: texto insertado en minúscula a mitad
  de oración (p. ej. "...desplaza el foco hacia **tito** debe completar...").
- Metacomentario metodológico genérico sobre "cómo se debe hacer exégesis"
  en vez de exégesis real del pasaje específico.
- Un `editorialStatus: "needs-review"` autodeclarado en el 100% de las
  entradas — es una admisión de que la fuente no verificó su propio trabajo
  antes de entregarlo.

## Veredicto

Un libro **pasa** si: usa el schema correcto (§1), cumple secciones fijas
con contenido específico no genérico (§2, §4), alcanza el piso de densidad
real (§3), mantiene neutralidad en lo disputado (§5), y no muestra señales
de plantilla mecánica (§6).

Si falla §1 o §6, se descarta sin necesidad de revisar el resto.
