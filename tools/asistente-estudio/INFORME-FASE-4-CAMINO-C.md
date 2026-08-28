# Fase 4 — Resultado del Camino C

**Estado:** **APROBADA — Camino C, candidatos léxicos auditables con ambigüedad aceptada**  
**Fecha:** 2026-08-28

## 1. Qué se construyó

`motor_diccionario_bsb_caminoC.py` implementa un generador determinista de
candidatos con estas propiedades:

- trabaja por versículo, no contra toda la perícopa concatenada;
- cada resultado conserva capítulo, versículo y texto que lo activó;
- no usa Strong ni similitud semántica;
- evita el stemming Porter general;
- solo acepta transformaciones morfológicas inglesas explícitas;
- conserva la equivalencia `-ification` ↔ `-ify` que recupera
  `Justification` a partir de `justified`;
- exige que un headword compuesto aparezca como frase contigua dentro de un
  versículo;
- reconoce la inversión editorial por coma de títulos como `Spirit, Holy`;
- una palabra de dos letras o menos no puede activar sola una entrada;
- no equipara palabras cortas mediante morfología, evitando `are` → `Areli` y
  `Levi` → `Levy`.

El resultado reproducible está en `data/motor-diccionario-caminoC.json`.

## 2. Resultados cuantitativos

| Pasaje | Base | Camino A | Camino C |
|---|---:|---:|---:|
| Romanos 5:1-11 | 30 | 31 | 21 |
| Hebreos 7:1-10 | 34 | 34 | 24 |
| Génesis 1:1-5 | 18 | 18 | 14 |
| Daniel 9:1-27 | 120 | 120 | 76 |
| Salmo 23:1-6 | 31 | 31 | 23 |

C reduce los candidatos únicos de 233 a 158: 75 menos que la base, una
reducción del 32.2 %. A diferencia del Camino B, la reducción no depende de un
umbral variable entre libros.

## 3. Mejoras verificadas

El Camino C:

- recupera `Justification` en Romanos 5;
- conserva términos centrales como `Faith`, `Grace`, `Hope`, `Love`,
  `Reconcilation` (ortografía del headword fuente) y `Spirit, Holy`;
- elimina `Areli` de Hebreos 7 y Salmo 23;
- elimina `Levy`, `A`, `By`, `On`, `So` y `By and by`;
- elimina `Water of separation` de Génesis 1;
- elimina `Lords Day, The` de Salmo 23;
- en Daniel 9 conserva anclajes concretos que el umbral semántico perdía:
  `Daniel`, `Darius`, `Mede`, `Jeremiah`, `Jerusalem`, `Gabriel`, `Messiah`,
  `Seventy weeks`, `Atonement`, `Covenant`, `Prayer`, `Fast`, `Sackcloth` y
  `Sacrifice`.

Además, cada uno puede auditarse contra una evidencia local. Ejemplo:

```json
{
  "headword": "Justification",
  "evidencia": [
    {
      "chapter": 5,
      "verse": 1,
      "texto": "justified",
      "tipo": "morphology",
      "formaHeadword": "Justification"
    }
  ]
}
```

## 4. Problema que permanece

C todavía no es suficientemente preciso para producir por sí solo el JSON
visible de la aplicación.

### Palabras genéricas

Daniel 9 aún produce 76 entradas. Entre ellas hay coincidencias léxicas que no
son ayudas de estudio valiosas en ese pasaje: `Ear`, `Face`, `Hand`, `Put`,
`Year`, `End`, `Book` y otras.

### Acepción incorrecta

Una palabra explícita puede coincidir con el headword y, aun así, señalar la
entrada equivocada:

- `Tables` en Salmo 23 se activa por “table”, aunque la entrada del diccionario
  puede referirse a las tablas de la ley y no a la mesa del salmo;
- `Calling` en Génesis 1 se activa por “called”, aunque la acepción doctrinal
  del headword no corresponde necesariamente al acto de poner nombre;
- nombres o títulos genéricos como `Names`, `Wills` y `Presents` pueden tener
  una acepción distinta de la palabra superficial del pasaje.

### Conceptos reales no expresados como frase exacta

La regla de contigüidad favorece precisión, pero puede perder formulaciones
reales. Daniel 9 dice “the abomination that causes desolation”, no la frase
contigua exacta `Abomination of Desolation`. C conserva las palabras simples,
pero no debe inferir automáticamente que la entrada compuesta aplica.

## 5. Dictamen

El Camino C es mejor que A y B como **generador auditable de candidatos**:

- recupera la omisión doctrinal emblemática;
- elimina las colisiones mecánicas más graves;
- explica cada resultado;
- se comporta de forma estable sin umbral semántico.

No debe aprobarse como selector final automático. La evidencia demuestra que
la relevancia depende también de la acepción de la entrada, algo que la forma
de la palabra no puede resolver de manera confiable.

## 6. Flujo recomendado para cerrar Diccionario

1. Ejecutar C offline para producir candidatos con evidencia.
2. Revisar el excerpt o contenido real de cada candidato y clasificarlo como
   `incluir`, `excluir` o `decisión pendiente` para el pasaje/perícopa.
3. Guardar la decisión y su evidencia en datos estáticos versionados.
4. Hacer que el ensamblador use únicamente entradas marcadas `incluir`.
5. Permitir que una perícopa termine con cero entradas.

Esta revisión puede prepararse offline con ayuda de IA, pero la aprobación
editorial sigue siendo de Juan. No habría IA ni matching dinámico en
producción.

## 7. Decisión editorial final

La categoría no afirma que la entrada corresponda con certeza a la acepción
exacta del versículo. Presenta **términos para explorar** asociados de forma
auditable mediante:

`texto BSB → evidencia morfológica Camino C → headword real Easton/Smith`.

La validación estricta de acepción se conserva como diagnóstico, pero no filtra
la salida destinada al ensamblador: su pérdida de cobertura (158 candidatos a
25 headwords en los pilotos) fue editorialmente inaceptable. Tampoco se usa el
solapamiento léxico de definiciones, que volvió a admitir casos dudosos.

## 8. Estado de la fase

- Motor C: construido y reproducible.
- Cinco pilotos: ejecutados.
- Validación técnica: Python compila, JSON válido y `git diff --check` limpio.
- Integración en producción: no realizada.
- Fase 4: **APROBADA** con Camino C como detector de candidatos léxicos
  auditables y ambigüedad exploratoria aceptada.
