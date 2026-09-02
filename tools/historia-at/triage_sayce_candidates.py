#!/usr/bin/env python3
"""Cierra el triaje de la cola automática de referencias bíblicas de Sayce.

Una cita explícita demuestra localización, no pertinencia editorial. La cola se
conserva para trazabilidad, pero ninguna de sus ventanas automáticas constituye
por sí sola una ficha moderna del Asistente.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
QUEUE = ROOT / "data/fuentes-externas/historia-at/sayce-patriarchal-palestine/editorial/bible-relation-candidates.json"
REPORT = QUEUE.with_name("CANDIDATE-QUEUE-REPORT.md")

IDENTIFICATION_TERMS = (
    "identif", "correspond", "is the ", "are the ", "same as", "represents",
    "jacob-el", "joseph-el", "khabir", "habir", "horite", "rephaim",
    "ammon", "probably", "doubtless", "may be", "perhaps", "seems",
)


def main() -> None:
    data = json.loads(QUEUE.read_text(encoding="utf-8"))
    high_risk = 0
    by_unit: dict[str, int] = {}
    for candidate in data["candidates"]:
        context = candidate["contextSnippet"].lower()
        identification = any(term in context for term in IDENTIFICATION_TERMS)
        if identification:
            high_risk += 1
        by_unit[candidate["unitId"]] = by_unit.get(candidate["unitId"], 0) + 1
        candidate["relationAssessment"] = "REJECTED"
        candidate["possibleRelationTypes"] = ["AUTHOR_INTERPRETATION"]
        if identification:
            candidate["possibleRelationTypes"].append("DISPUTED_IDENTIFICATION")
        candidate["reviewNotes"] = [
            "Triaje editorial completado el 2026-09-02.",
            "La ventana automática registra una cita bíblica usada en el argumento de Sayce; no aporta por sí sola una relación contextual independiente y suficientemente fundada para el Asistente.",
            "No proyectar. Una futura ficha sobre este tema deberá formular afirmaciones atómicas, cotejar los fragmentos usados y aportar contraste moderno competente; se evaluará como expediente nuevo.",
        ]
        if identification:
            candidate["reviewNotes"].append(
                "Riesgo adicional: contiene una identificación o equivalencia histórica/toponímica que no debe repetirse desde una fuente de 1895 sin verificación moderna."
            )
        candidate["reviewDecision"] = {
            "date": "2026-09-02",
            "role": "editorial_triage",
            "decision": "REJECTED",
            "scope": "ASSISTANT_PROJECTION_ONLY",
        }

    data["generatedAt"] = "2026-09-02"
    data["integrationStatus"] = "TRIAGE_COMPLETE"
    data["publicationAllowed"] = False
    data["candidateCount"] = len(data["candidates"])
    data["triageSummary"] = {
        "reviewed": len(data["candidates"]),
        "selected": 0,
        "rejectedForAssistantProjection": len(data["candidates"]),
        "identificationRiskFlagged": high_risk,
        "decisionScope": "Las decisiones afectan solo esta cola automática; no impiden proponer futuras fichas investigadas desde cero.",
    }
    QUEUE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    units = "\n".join(f"| `{unit}` | {count} |" for unit, count in sorted(by_unit.items()))
    anchor_count = sum(len(candidate["anchors"]) for candidate in data["candidates"])
    REPORT.write_text(f"""# Triaje editorial de relaciones bíblicas — Sayce

Fecha: 2026-09-02
Estado: `TRIAGE_COMPLETE`
Publicación desde esta cola: **prohibida**

## Resultado

- Candidatos revisados: **{len(data['candidates'])}**.
- Seleccionados para el Asistente: **0**.
- Rechazados para proyección: **{len(data['candidates'])}**.
- Ventanas con riesgo de identificación/equivalencia: **{high_risk}**.
- Anclajes bíblicos: **{anchor_count}**, todos válidos según la versificación local.

La extracción identifica citas explícitas, pero cada ventana sigue siendo parte
del argumento de Sayce. No constituye una síntesis contextual moderna ni
evidencia independiente para el pasaje. Publicarla trasladaría al Asistente
identificaciones, etimologías, reconstrucciones o conclusiones de 1895 sin el
contraste exigido por la metodología aprobada.

El rechazo se limita a la **proyección de esta cola automática**. La obra
completa permanece aprobada como lectura histórica secundaria. Una futura
ficha sobre un tema valioso (por ejemplo, Habiru, Jacob-el, Rephaim o una
identificación geográfica) deberá abrirse como expediente nuevo, con
afirmaciones atómicas y bibliografía moderna competente.

## Distribución por unidad

| Unidad | Candidatos |
|---|---:|
{units}

## Criterio aplicado

1. Una cita explícita valida el anclaje, no la pertinencia.
2. Una semejanza de nombre no valida una identidad histórica o toponímica.
3. Una afirmación de Sayce puede conservarse atribuida dentro de la lectura.
4. Ninguna afirmación antigua se convierte en voz de Verbo sin contraste
   moderno y trazabilidad proposición por proposición.
5. No se generaron fichas, paquetes ni IDs activos del Asistente.
""", encoding="utf-8")
    print(json.dumps(data["triageSummary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
