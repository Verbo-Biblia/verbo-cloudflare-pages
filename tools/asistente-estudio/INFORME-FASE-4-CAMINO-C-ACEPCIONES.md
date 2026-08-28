# Fase 4 — Camino C con validación determinista de acepción

**Estado:** prueba terminada  
**Fecha:** 2026-08-28  
**Resultado del experimento:** no usar como filtro obligatorio  
**Decisión editorial posterior:** **FASE 4 APROBADA con los candidatos léxicos de Camino C**

## 1. Regla implementada

El Camino C conserva su generación léxica original y añade una etapa separada
para cada entrada concreta de Easton o Smith:

1. el matching morfológico local genera el candidato y conserva el versículo;
2. se extraen de la definición todas las referencias bíblicas explícitas que
   contienen libro, capítulo y versículo;
3. la entrada se marca `incluir` solamente si una referencia explícita cita el
   versículo que produjo el candidato o un rango que lo contiene;
4. en cualquier otro caso se marca `excluir`.

La regla se aplica por **entrada fuente**, no solo por headword. Easton puede
quedar incluido y Smith excluido para el mismo término si solo Easton demuestra
la acepción mediante una referencia coincidente.

La salida conserva para cada decisión:

- término detectado en BSB;
- headword;
- módulo e ID de la entrada;
- versículos candidatos;
- formas morfológicas compartidas;
- referencias coincidentes de la definición;
- diagnóstico de solapamiento léxico;
- decisión binaria y razón.

## 2. Por qué la regla es generalizable

La regla no contiene libros, pasajes ni términos especiales de los pilotos. El
único catálogo incorporado es la tabla estructural de nombres y abreviaturas de
los 66 libros, necesaria para interpretar referencias como `Rom. 5:1-10` o
`Ps. 23:5`.

No existen blacklists, excepciones por término ni ramas condicionadas por libro
o versículo. La misma prueba se aplica a todas las entradas: la propia fuente
lexicográfica debe vincular explícitamente esa acepción con el uso bíblico.

No se usan Strong, embeddings, búsqueda semántica ni llamadas externas.

## 3. Experimento de solapamiento léxico

También se implementó y probó una evidencia complementaria permitida por el
encargo:

- eliminar stopwords inglesas generales;
- eliminar del solapamiento la familia del propio headword para evitar una
  prueba tautológica;
- comparar raíces Porter significativas entre la definición, el versículo y
  una ventana de ±1 versículo;
- exigir al menos una raíz en el propio versículo y dos en la ventana.

Esta señal **no se usa para incluir**. La prueba admitió entradas cuya acepción
seguía sin estar demostrada, entre ellas `Names`, `Year` y términos demasiado
generales. Dos textos bíblicos pueden compartir nombres, verbos o vocabulario
religioso sin usar el headword en la misma acepción. Subir el umbral elimina
también términos legítimos; bajarlo aumenta el ruido. El diagnóstico queda en
el JSON para auditoría, identificado expresamente como no decisorio.

## 4. Resultados antes y después

Los candidatos “antes” son los headwords únicos del Camino C. Las decisiones
fuente cuentan Easton y Smith por separado. Las entradas finales vuelven a
deduplicarse por headword, conservando únicamente las fuentes incluidas.

| Pasaje | Candidatos C | Decisiones fuente | Fuentes incluidas | Fuentes excluidas | Headwords finales |
|---|---:|---:|---:|---:|---:|
| Romanos 5:1-11 | 21 | 27 | 5 | 22 | 5 |
| Hebreos 7:1-10 | 24 | 35 | 5 | 30 | 4 |
| Génesis 1:1-5 | 14 | 19 | 8 | 11 | 6 |
| Daniel 9:1-27 | 76 | 112 | 8 | 104 | 8 |
| Salmo 23:1-6 | 23 | 29 | 2 | 27 | 2 |
| **Total** | **158** | **222** | **28** | **194** | **25** |

### Resultados finales

- **Romanos 5:** `Death`, `Faith`, `Hope`, `Justification`, `Reconcilation`.
- **Hebreos 7:** `Brother`, `Melchizedek`, `Patriarch`, `Salem`.
- **Génesis 1:** `Day`, `Deep`, `Earth`, `Evening`, `Heaven`, `Light`.
- **Daniel 9:** `Abomination`, `Darius`, `Face`, `Gabriel`, `Jerusalem`,
  `Messiah`, `Seventy weeks`, `Week`.
- **Salmo 23:** `Oil`, `Shepherd`.

## 5. Falsos positivos eliminados

La validación elimina por una regla única y verificable:

- `Tables` en Salmo 23;
- `Calling` y `Saw` en Génesis 1;
- `Wills`, `Names`, `Lie`, `Evening` y otros resultados superficiales del
  Salmo 23;
- `Put`, `Presents`, `Ear`, `Bear`, `Book` y muchas coincidencias genéricas de
  Daniel 9;
- las colisiones ya resueltas por el Camino C (`Areli`, `Levy`, `A`, `By`,
  `On`, `So`) permanecen ausentes.

La reducción de 158 a 25 headwords es deliberadamente conservadora.

## 6. Justification en Romanos 5

`Justification` se mantiene.

- BSB aporta `justified` en Romanos 5:1 y 5:9;
- la regla morfológica comparte la forma `justify`;
- Easton cita explícitamente `Rom. 5:1-10`;
- la definición y el contexto comparten además `faith`, `Christ`, `Jesus`,
  `Lord` y la familia de `justify`, aunque ese solapamiento no es necesario
  para decidir.

La inclusión queda demostrada por dos vías textuales transparentes, sin una
excepción para Romanos.

## 7. Tables en Salmo 23

`Tables` se excluye.

- BSB aporta `table` en Salmo 23:5;
- la morfología léxica genera correctamente el candidato `Tables`;
- la entrada Easton recuperada describe banquetas, mesas y la costumbre judía
  de reclinarse, pero solo cita explícitamente Marcos 7:4 y otros contextos
  ajenos;
- no cita Salmo 23:5 ni un rango que lo contenga;
- tras retirar la familia `table`, no hay solapamiento léxico contextual
  suficiente entre la definición y la ventana del salmo.

Desaparece por la regla general, no por blacklist ni parche de pasaje.

## 8. Falsos negativos y regresiones

La precisión mejora con claridad, pero el costo de recall es demasiado alto
para recomendar el cierre de la fase.

Entre los términos legítimos o probablemente legítimos excluidos están:

- Romanos 5: `Christ`, `Grace`, `Glory`, `Love`, `Spirit, Holy` y `Blood`;
- Hebreos 7: `Abraham`, `Priest`, `Levi`, `Law`, `Righteousness` y
  `Son of God`;
- Génesis 1: `Create`, `Darkness` y `Spirit`;
- Daniel 9: `Daniel`, `Prayer`, `Covenant`, `Atonement`, `Jeremiah`, `Moses`,
  `Sacrifice`, `Righteousness` y `Sin`;
- Salmo 23: `Goodness`, `Mercy`, `Righteousness`, `Cup` y `Anointing`.

No todos tienen necesariamente una acepción útil en la entrada recuperada,
pero varios son pérdidas inequívocamente importantes. Por ejemplo, la entrada
Smith `Create` define correctamente “causar que exista lo que antes no
existía”, pero no cita Génesis 1:1 ni comparte suficientes palabras de contexto
después de retirar el headword. La evidencia disponible no permite aceptarla
con la misma regla que rechaza sentidos incorrectos de forma segura.

También existen redirects lexicográficos muy breves, como `Righteousness` →
`JUSTIFICATION` y `Spirit, Holy` → `HOLY GHOST`. Resolver el redirect puede
aportar una definición más extensa, pero no garantiza que esa definición cite
el uso candidato; por sí solo no resuelve el problema general de acepción.

## 9. Limitaciones reales

1. Easton y Smith no fueron redactados como diccionarios con identificadores de
   sentido y cobertura exhaustiva de pasajes.
2. Muchas entradas válidas no citan todas las apariciones bíblicas de su
   acepción.
3. Algunas definiciones son redirects de una sola línea.
4. El solapamiento de vocabulario no distingue confiablemente una acepción de
   otra en prosa bíblica y teológica.
5. La ausencia de una cita demuestra falta de evidencia suficiente, no que la
   entrada sea incorrecta.
6. El parser solo acepta referencias explícitas con libro, capítulo y
   versículo. Omitir referencias abreviadas dependientes del contexto favorece
   precisión y puede aumentar falsos negativos.

Con las fuentes locales permitidas no se encontró una regla puramente léxica
que a la vez rechace sentidos como `Tables`, conserve sistemáticamente los
términos importantes y no admita nuevos falsos positivos.

## 10. Recomendación del experimento y decisión editorial final

El experimento recomendó **no aprobar su filtro estricto** como salida final.

Se cumplen la auditabilidad, la reducción de falsos positivos, la conservación
de `Justification`, la resolución general de `Tables` y todas las prohibiciones
técnicas. No se cumple el requisito de ausencia de regresiones graves.

La decisión editorial posterior cerró la fase con un contrato distinto y más
preciso sobre lo que afirma la UI: Camino C ofrece **posibles términos útiles
para explorar**, no certeza de acepción. Por ello, el diagnóstico de este
informe se conserva, pero no filtra la salida que consume Fase 5.

**Estado definitivo de Fase 4:** **APROBADA — Camino C, candidatos léxicos
auditables con ambigüedad aceptada.**
