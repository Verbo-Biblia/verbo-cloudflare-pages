#!/usr/bin/env python3
"""Valida contratos e invariantes de expedientes editoriales de Historia AT."""

import argparse
import hashlib
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parent
SCHEMAS = {
    "assistant": ROOT / "schemas" / "assistant-historical-card.schema.json",
    "reading": ROOT / "schemas" / "history-reading-unit.schema.json",
}
ATTRIBUTION_REQUIRED = {
    "AUTHOR_INTERPRETATION",
    "DISPUTED_IDENTIFICATION",
    "HISTORICAL_RECONSTRUCTION",
}
FINAL_EVIDENCE_STATES = {
    "FACT_CONFIRMED",
    "EVIDENCE_CONFIRMED",
    "INTERPRETATION_WELL_SUPPORTED",
    "INTERPRETATION_DEBATED",
}


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def schema_errors(record, kind):
    schema = load(SCHEMAS[kind])
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    return [
        f"schema {'.'.join(str(part) for part in error.absolute_path) or '<root>'}: {error.message}"
        for error in sorted(validator.iter_errors(record), key=lambda item: list(item.absolute_path))
    ]


def duplicates(values):
    seen = set()
    return sorted({value for value in values if value in seen or seen.add(value)})


def validate_assistant(record):
    errors = []
    claims = {claim["claimId"]: claim for claim in record.get("claims", []) if "claimId" in claim}
    claim_ids = list(claims)
    if len(claim_ids) != len(record.get("claims", [])):
        errors.append("claimId duplicado")

    sources = {source["sourceId"]: source for source in record.get("contrastSources", []) if "sourceId" in source}
    if len(sources) != len(record.get("contrastSources", [])):
        errors.append("sourceId de contraste duplicado")
    known_evidence = set(sources) | {record.get("historicalSource", {}).get("sourceId")}

    statement_ids = [statement.get("statementId") for statement in record.get("assistantStatements", [])]
    if duplicates(statement_ids):
        errors.append("statementId duplicado")
    for statement in record.get("assistantStatements", []):
        missing = set(statement.get("claimIds", [])) - set(claims)
        if missing:
            errors.append(f"{statement.get('statementId')}: claimIds inexistentes: {sorted(missing)}")

    assembled = " ".join(statement.get("text", "") for statement in record.get("assistantStatements", []))
    if record.get("assistantText") != assembled:
        errors.append("assistantText debe ser la concatenación exacta de assistantStatements")

    source_claims = {claim_id for source in sources.values() for claim_id in source.get("claimIds", [])}
    for source in sources.values():
        missing = set(source.get("claimIds", [])) - set(claims)
        if missing:
            errors.append(f"{source.get('sourceId')}: claimIds inexistentes: {sorted(missing)}")

    for claim_id, claim in claims.items():
        missing = set(claim.get("evidenceLinks", [])) - known_evidence
        if missing:
            errors.append(f"{claim_id}: evidenceLinks inexistentes: {sorted(missing)}")
        types = {claim.get("primaryType"), *claim.get("secondaryTypes", [])}
        if types & ATTRIBUTION_REQUIRED and not claim.get("attribution"):
            errors.append(f"{claim_id}: el tipo interpretativo exige attribution explícita")
        if claim.get("requiresModernContrast") and claim.get("evidenceStatus") in FINAL_EVIDENCE_STATES:
            if claim_id not in source_claims:
                errors.append(f"{claim_id}: estado final sin fuente moderna de contraste vinculada")

    status = record.get("reviewStatus")
    if status in {"REVIEW_REQUIRED", "REJECTED"} and not record.get("reviewNotes"):
        errors.append(f"{status} exige reviewNotes concretas")
    if status == "APPROVED":
        if record.get("integrationStatus") == "STAGING_ONLY":
            errors.append("APPROVED no puede conservar integrationStatus=STAGING_ONLY")
        if not record.get("historicalSource", {}).get("unitContentSha256"):
            errors.append("APPROVED exige historicalSource.unitContentSha256")
        for claim_id, claim in claims.items():
            if claim.get("evidenceStatus") not in FINAL_EVIDENCE_STATES:
                errors.append(f"{claim_id}: APPROVED no admite evidencia {claim.get('evidenceStatus')}")
            if claim.get("requiresModernContrast") and claim_id not in source_claims:
                errors.append(f"{claim_id}: APPROVED exige contraste moderno")
    return errors


def validate_reading(record):
    errors = []
    content = record.get("text", {}).get("content", "")
    expected = hashlib.sha256(content.encode("utf-8")).hexdigest()
    actual = record.get("integrity", {}).get("contentSha256")
    if actual and actual != expected:
        errors.append(f"integrity.contentSha256 incorrecto: esperado {expected}")

    status = record.get("readingReviewStatus")
    if status in {"REVIEW_REQUIRED", "REJECTED"} and not record.get("reviewNotes"):
        errors.append(f"{status} exige reviewNotes concretas")
    if status == "APPROVED":
        if record.get("provenance", {}).get("legalStatus") not in {"CLEARED", "CLEARED_TEXT_ONLY"}:
            errors.append("APPROVED exige estado legal reutilizable")
        if record.get("textualControl", {}).get("ocrStatus") == "UNREVIEWED":
            errors.append("APPROVED exige OCR razonablemente validado")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("record", type=Path)
    parser.add_argument("--kind", choices=SCHEMAS)
    args = parser.parse_args()
    record = load(args.record)
    kind = args.kind or ("assistant" if "assistantStatements" in record else "reading")
    errors = schema_errors(record, kind)
    if not errors:
        errors.extend(validate_assistant(record) if kind == "assistant" else validate_reading(record))
    result = {"record": str(args.record), "kind": kind, "ok": not errors, "errors": errors}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
