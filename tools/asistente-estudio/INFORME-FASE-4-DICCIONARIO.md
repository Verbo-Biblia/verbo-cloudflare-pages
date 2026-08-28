# Fase 4 — Informe comparativo del motor de Diccionario

**Estado:** borrador para revisión de Juan  
**Fecha del análisis:** 2026-08-28  
**Alcance:** comparación de los caminos A y B sobre los cinco pasajes piloto ya procesados. Este informe no aprueba todavía un motor para producción.

## 1. Pregunta evaluada

El primer prototipo comparó por stemming el texto BSB del pasaje con los *headwords* de Easton y Smith. La prueba mostró dos problemas distintos:

1. falsos negativos morfológicos, en especial `justified` frente a `Justification` en Romanos 5:1;
2. numerosos falsos positivos por colisión de raíces o por palabras incidentales, por ejemplo `Areli` frente a `are`.

Se compararon dos respuestas posibles:

- **Camino A:** conservar el método léxico y añadir una regla morfológica general para la familia inglesa `-ification` ↔ `-ify`;
- **Camino B:** conservar los candidatos del stemming original y filtrarlos mediante similitud semántica con el modelo local ya existente.

El criterio rector es precisión antes que cantidad. Una sección vacía es preferible a una lista extensa de coincidencias dudosas.

## 2. Material examinado

- `data/motor-diccionario-prueba-piloto.json`: resultado base sin filtro;
- `data/motor-diccionario-caminoA.json`: resultado del Camino A;
- `data/motor-diccionario-caminoB.json`: puntuaciones del Camino B;
- `motor_diccionario_bsb_caminoA.py` y `motor_diccionario_bsb_caminoB.mjs`;
- texto BSB real de los cinco pasajes piloto.

Pasajes:

1. Romanos 5:1-11;
2. Hebreos 7:1-10;
3. Génesis 1:1-5;
4. Daniel 9:1-27;
5. Salmo 23:1-6.

## 3. Camino A: resultado

La regla morfológica general recuperó correctamente `Justification` a partir de `justified`. Fue el único cambio frente al resultado base en los cinco pasajes:

| Pasaje | Base | Camino A | Diferencia |
|---|---:|---:|---|
| Romanos 5:1-11 | 30 | 31 | añade `Justification` |
| Hebreos 7:1-10 | 34 | 34 | ninguna |
| Génesis 1:1-5 | 18 | 18 | ninguna |
| Daniel 9:1-27 | 120 | 120 | ninguna |
| Salmo 23:1-6 | 31 | 31 | ninguna |

### Evaluación

La regla `-ification` ↔ `-ify` es lingüísticamente general y resuelve el falso negativo emblemático sin una lista doctrinal manual. Por tanto, es una mejora válida del **recall** léxico.

Sin embargo, no mejora la precisión. Permanecen, entre otros:

- `Areli`, activado accidentalmente por `are`;
- `A`, `By`, `On`, `So` y `No`;
- `Levy`, activado en el contexto de Levi;
- `Water of separation` en Génesis 1 por palabras que aparecen separadamente en el pasaje;
- `Lords Day, The` en el Salmo 23;
- 120 resultados en Daniel 9, muchos de ellos incidentales o claramente ajenos al tema del pasaje.

**Conclusión sobre A:** conservar la regla morfológica como mejora puntual y reutilizable, pero rechazar el Camino A por sí solo como motor final. Recupera una omisión real, pero no resuelve el problema principal de precisión.

## 4. Camino B: análisis de umbrales

El JSON del Camino B cuenta candidatos por fuente de diccionario; una misma palabra puede aparecer una vez en Easton y otra en Smith. Para evaluar lo que vería una persona, se recalcularon también los *headwords* únicos.

### Cantidad de headwords únicos que sobreviven

| Pasaje | Candidatos base | ≥ 0.3 | ≥ 0.4 | ≥ 0.5 |
|---|---:|---:|---:|---:|
| Romanos 5:1-11 | 30 | 24 | 9 | 5 |
| Hebreos 7:1-10 | 34 | 27 | 18 | 1 |
| Génesis 1:1-5 | 18 | 13 | 10 | 5 |
| Daniel 9:1-27 | 120 | 26 | 1 | 0 |
| Salmo 23:1-6 | 31 | 21 | 6 | 2 |

### Umbral 0.3

Reduce mucho Daniel 9, pero sigue dejando ruido inequívoco:

- `Areli` sobrevive en Hebreos 7 y Salmo 23;
- `So`, `Levy`, `Collection` y `By and by` sobreviven en Hebreos 7;
- `Put`, `By and by`, `Lords Prayer` y `Wars of the Lord, The Book of the` sobreviven en Daniel 9;
- `Lords Day, The`, `No` y `Lie` sobreviven en Salmo 23.

Al mismo tiempo elimina términos directamente presentes y relevantes. En Daniel 9 quedan fuera `Daniel`, `Darius`, `Mede`, `Jerusalem`, `Gabriel`, `Seventy weeks`, `Covenant`, `Abomination of Desolation`, `Fast`, `Sackcloth`, `Atonement` y `Sacrifice`, entre otros.

**Resultado:** demasiados falsos positivos y falsos negativos para el estándar del proyecto.

### Umbral 0.4

Produce una lista razonable solo en algunos textos cortos o temáticamente concentrados, especialmente Génesis 1:1-5. No se comporta de manera estable entre pasajes:

- en Romanos 5 conserva `Faithful`, pero elimina `Faith`, `Hope`, `Love`, `Reconciliation` y `Justification`;
- en Hebreos 7 conserva términos centrales como `Melchizedek`, `Priest` y `Abraham`, pero también `So` y `Levy`;
- en Daniel 9 conserva únicamente `Lord`;
- en Salmo 23 elimina `Shepherd`, `Oil`, `Cup`, `Valley` y `Anointing`, pero conserva `Lords Day, The` y `Comforter`.

**Resultado:** precisión desigual y pérdida grave de términos centrales.

### Umbral 0.5

Es demasiado restrictivo:

- Hebreos 7 queda solo con `Abraham`;
- Daniel 9 queda vacío;
- Salmo 23 queda con `Lord` y `Psalms`, pero pierde `Shepherd`;
- Romanos 5 conserva cinco términos, pero no `Faith`, `Justification` ni `Reconciliation`.

**Resultado:** no es utilizable como filtro general.

## 5. Limitaciones estructurales del Camino B

El problema no se corrige eligiendo otro número entre 0.3 y 0.5.

1. **No recupera falsos negativos del generador de candidatos.** `Justification` no está en la entrada del Camino B porque el stemming original no la propuso. Ningún umbral puede recuperarla.
2. **La similitud no equivale a mención o aplicabilidad.** El modelo puede valorar como “temáticamente cercana” una entrada no referida por el pasaje y rebajar un nombre o elemento concreto que sí aparece.
3. **El texto completo diluye pasajes largos.** Daniel 9 contiene oración, personajes, lugares, objetos, profecía y cronología. Un único vector para todo el capítulo no conserva bien cada anclaje local.
4. **Las puntuaciones no son comparables de forma estable entre géneros y longitudes.** El umbral que funciona aceptablemente para Génesis 1 destruye Daniel 9.
5. **El resultado depende del contenido y redacción del excerpt del diccionario, no solo de que el término esté realmente anclado en el pasaje.**

## 6. Dictamen comparativo

| Criterio | Camino A | Camino B |
|---|---|---|
| Recupera `Justification` | Sí | No |
| Elimina colisiones como `Areli` | No | No de manera confiable |
| Mantiene términos explícitos importantes | Sí, con mucho ruido | No de manera estable |
| Tiene un umbral general viable | No aplica | No |
| Cumple “precisión antes que cantidad” como solución final | No | No |

**Decisión recomendada:** no aprobar ninguno de los dos caminos como motor final.

- Del Camino A conviene **conservar la expansión morfológica general** `-ification` ↔ `-ify`.
- El Camino B debe **descartarse como filtro final global**. Los cinco pilotos no sostienen ningún umbral común y el diseño no puede recuperar candidatos omitidos.
- No debe adoptarse búsqueda semántica en el matching final a partir de estos resultados.

## 7. Próximo experimento recomendado

Antes de ensamblar la Fase 5 hace falta una tercera iteración, determinista y auditable, enfocada directamente en precisión. Propuesta:

1. generar variantes morfológicas con reglas generales, incluida la mejora del Camino A;
2. exigir evidencia léxica local y guardar para cada resultado la palabra o frase exacta del pasaje que lo activó;
3. distinguir headwords de una palabra de headwords compuestos: una entrada compuesta no debe activarse solo porque sus palabras aparezcan dispersas en cualquier parte de un pasaje largo;
4. impedir que una palabra funcional muy corta produzca por sí sola una entrada (`A`, `By`, `On`, `So`, etc.) mediante una regla lingüística general, no mediante una lista doctrinal;
5. tratar con especial cautela los nombres propios: una coincidencia por stemming no basta para equiparar `are` con `Areli` ni `Levi` con `Levy`;
6. probar por ventanas de versículo, no únicamente contra el texto concatenado de toda la perícopa;
7. devolver pocos resultados con evidencia explicable y permitir cero resultados.

Esta tercera iteración debe volver a probarse con los mismos cinco pasajes y con una tabla manual mínima de resultados **obligatorios**, **aceptables** y **prohibidos**. Esa tabla no sería una lista maestra doctrinal para producción: sería únicamente el conjunto de evaluación necesario para medir precisión y falsos negativos del algoritmo.

## 8. Estado de la fase

La comparación A/B queda terminada, pero la Fase 4 **no está cerrada editorialmente**. El resultado verificable es negativo y útil: el mejor stemmer con una sola expansión no basta, y el filtro semántico global tampoco satisface la precisión requerida.

Juan autorizó construir el Camino C. Su implementación y primera evaluación se
documentan en `INFORME-FASE-4-CAMINO-C.md`.
