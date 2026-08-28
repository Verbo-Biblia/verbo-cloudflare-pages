#!/usr/bin/env python3
"""Regenera el informe de Fase 5 insertando sin abreviar los tres JSON piloto."""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
OUTPUT = HERE / "INFORME-FASE-5-ENSAMBLADO.md"

PILOTS = [
    ("Romanos 5:1-11", DATA / "ensamblado-rom-5-1-11.json"),
    ("Mateo 2:1-12", DATA / "ensamblado-mat-2-1-12.json"),
    ("Salmo 23:1-6", DATA / "ensamblado-psa-23-1-6.json"),
]


def json_block(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    return "```json\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n```"


def main():
    sections = []
    for title, path in PILOTS:
        sections.append(f"### {title}\n\n{json_block(path)}")

    report = """# Fase 5 — Ensamblado completo por pasaje

**Estado:** implementado y validado como prototipo offline  
**Alcance:** solo `tools/asistente-estudio/`; sin integración en producción

## 1. Implementación

`ensamblador.py` recibe `book`, `chapterStart`, `verseStart`, `chapterEnd` y
`verseEnd`, y devuelve un único objeto con `pasaje`, `diccionario`, `historia`
y `costumbres`.

El ensamblador:

- consume los candidatos léxicos aprobados de Camino C, sin aplicar el filtro
  experimental de acepción;
- usa el motor existente de Eusebio, que solo devuelve IDs curados como
  `alta`;
- cruza los rangos conciliares mediante solapamiento inclusivo;
- toma el contexto histórico de las clasificaciones locales;
- añade Freeman por solapamiento bíblico fino;
- añade Tucker por solapamiento de época con su ventana 54–68 d.C. y solo sus
  capítulos `alta`;
- activa el bloque subapostólico únicamente en 90–150 d.C. y Diogneto en
  130–200 d.C.;
- deja vacía cualquier capa sin fuente aplicable.

La función general `ranges_overlap` compara los extremos `(capítulo,
versículo)` y cubre rangos contenidos, parciales y transcapítulo.

## 2. JSON completos de los pilotos

""" + "\n\n".join(sections) + """

## 3. Auditoría de fuentes

### Diccionario

Cada asociación procede directamente de `entradasDiccionario`, la salida
léxica aprobada de Camino C. Para cada resultado se verificó que el headword
existe realmente en el módulo Easton o Smith indicado. No se usa el diagnóstico
estricto de acepción y no se afirma certeza semántica.

Conteos por asociación fuente/headword:

| Pasaje | Asociaciones |
|---|---:|
| Romanos 5:1-11 | 27 |
| Mateo 2:1-12 | 52 |
| Salmo 23:1-6 | 29 |

### Historia

Todas las entradas tienen `fuente.modulo` y `fuente.libroSeccion` no vacíos.

- El contexto procede de `book-classification-nt.json` o
  `book-classification-ot.json` y reproduce su `fuenteReferencia`.
- Los eventos proceden de títulos reales de
  `eusebio-historia-eclesiastica`; el motor previo verifica que sus IDs están
  curados como `alta`.
- La recepción doctrinal, cuando exista, reproduce la `razon` del mapeo local y
  enlaza el tema y los concilios de `concilios-temas.json`.

No se generó ningún texto histórico sin fuente. Ninguno de los tres pilotos
solapa un rango conciliar: Romanos 5:1-11 termina inmediatamente antes del
anclaje pelagiano curado en Romanos 5:12-21.

### Costumbres

Todas las entradas tienen `fuente.modulo` y `fuente.entradaId` no vacíos.

- Mateo 2 obtiene dos entradas reales de Freeman (`freeman-630` y
  `freeman-631`).
- Salmo 23 obtiene `freeman-429`, una entrada fina sobre la unción de huéspedes.
- Romanos 5 activa los 19 capítulos `alta` de Tucker por la fecha de escritura
  57–58 d.C., dentro de la ventana 54–68 d.C. El texto mostrado es el excerpt
  real de cada capítulo fuente.
- Ningún piloto activa el bloque subapostólico ni Diogneto.

No se generó ninguna costumbre sin fuente.

## 4. Solapamientos y posibles tensiones en Historia

### Mateo 2:1-12

El contexto de clasificación y Eusebio I.5 se solapan en cronología general.
Eusebio I.6 y I.8 se solapan directamente con Herodes; I.8 es el anclaje más
específico a la matanza de los niños. No apareció una entrada separada sobre el
censo: los datos reales no la activaron.

I.7 (genealogía), I.9 (Pilato), I.10 (sumos sacerdotes) e I.11 (Juan el
Bautista) son resultados `alta` del cruce por la ventana narrativa amplia
−6–30 d.C., pero no todos describen Mateo 2:1-12 de manera inmediata. Se
conservan y reportan porque ocultarlos exigiría alterar el motor curado de Fase
1 o introducir una excepción. No se detectó contradicción textual entre ellos,
pero sí amplitud y repetición cronológica.

### Romanos 5:1-11

El contexto fecha la escritura en 57–58 d.C. Las 14 entradas de Eusebio cubren
un rango amplio 33–100 d.C. y, por ello, se superponen cronológicamente con la
clasificación. II.22 (Pablo enviado a Roma) y II.25 (Pablo y Pedro bajo Nerón)
son las conexiones más cercanas al contexto romano/paulino; las demás son
trasfondo contemporáneo amplio, no comentarios directos de Romanos 5.

No se detectó contradicción explícita, pero el conjunto de Eusebio presenta
solapamiento temporal y posible sobreabundancia. Se mantiene visible en el
informe porque todas las entradas están marcadas `alta` por la curación
existente y Fase 5 no tiene autoridad para recurarla.

### Concilios

No hubo solapamiento con Eusebio o contexto en los tres pilotos porque ninguno
activó un tema conciliar. La función de rangos sí fue probada en solapamientos
del mismo capítulo, parciales, contenidos y transcapítulo.

## 5. Vacíos encontrados

- **Salmo 23 — Historia:** `[]`. Vacío esperado: el libro está clasificado como
  `ninguna`, sin una época única, y Eusebio no cubre el AT.
- **Salmo 23 — Costumbres amplias:** vacío esperado por falta de ventana de
  época. La categoría total no queda vacía porque existe Freeman 429 como capa
  fina específica.
- **Mateo 2 — Costumbres amplias:** vacío esperado; su ventana narrativa −6–30
  d.C. no coincide con Tucker, el bloque subapostólico ni Diogneto. Freeman sí
  aporta dos entradas finas.
- **Romanos 5 — Freeman:** vacío esperado; no hay entrada fina de Freeman para
  ese rango. Tucker sí aporta la capa amplia.
- **Tres pilotos — recepción conciliar:** vacío esperado según los rangos
  curados. En particular, Romanos 5:1-11 no solapa Romanos 5:12-21.

No se rellenó ninguno de estos vacíos.

## 6. Resultado

Fase 5 queda implementada como prototipo offline y los tres pilotos satisfacen
el contrato. La principal observación para una revisión posterior es la
amplitud del cruce temporal de Eusebio, especialmente en Romanos; se reporta
sin ocultarla ni modificar la curación previa.

No se avanzó a UI ni se modificó producción.
"""
    OUTPUT.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
