#!/usr/bin/env python3
"""Audita una fuente de Historia AT en staging sin generar contenido activo."""

import argparse
import hashlib
import json
from pathlib import Path


ALLOWED_LEGAL_STATES = {
    "CLEARED",
    "CLEARED_TEXT_ONLY",
    "CITATION_ONLY",
    "LEGAL_REVIEW_REQUIRED",
    "REJECTED",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_metrics(path: Path, include_text_metrics=False):
    raw = path.read_bytes()
    metrics = {
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
    }
    if include_text_metrics:
        text = raw.decode("utf-8")
        metrics.update({
            "lines": len(text.splitlines()),
            "words": len(text.split()),
        })
    return metrics


def require(condition, message, errors):
    if not condition:
        errors.append(message)


def audit(source_dir: Path):
    errors = []
    warnings = []
    acquisition_path = source_dir / "acquisition.json"
    legal_path = source_dir / "legal.json"
    require(acquisition_path.is_file(), "Falta acquisition.json", errors)
    require(legal_path.is_file(), "Falta legal.json", errors)
    if errors:
        return errors, warnings, []

    acquisition = load_json(acquisition_path)
    legal = load_json(legal_path)
    require(acquisition.get("integrationStatus") == "STAGING_ONLY",
            "integrationStatus debe ser STAGING_ONLY", errors)
    require(legal.get("review_status") in ALLOWED_LEGAL_STATES,
            "review_status legal inválido", errors)
    for field in (
        "title", "author", "original_publication_year", "edition_used",
        "source_repository", "source_url", "copyright_status_US",
        "copyright_status_Costa_Rica", "evidence_for_status",
        "full_text_reuse_allowed", "translation_allowed", "images_allowed",
        "verified_date", "review_status",
    ):
        require(field in legal, f"Falta campo legal obligatorio: {field}", errors)

    reports = []
    for expected in acquisition.get("files", []):
        relative = expected.get("path", "")
        path = source_dir / relative
        if not path.is_file():
            errors.append(f"Falta archivo fuente: {relative}")
            continue
        text_metrics = "lines" in expected or "words" in expected
        try:
            actual = file_metrics(path, include_text_metrics=text_metrics)
        except UnicodeDecodeError:
            errors.append(f"{relative}: no es UTF-8 aunque declara métricas de texto")
            continue
        for key in ("bytes", "lines", "words", "sha256"):
            if key not in expected:
                continue
            require(actual.get(key) == expected.get(key),
                    f"{relative}: {key} esperado={expected.get(key)!r} actual={actual.get(key)!r}",
                    errors)
        reports.append({"path": relative, **actual})

    if legal.get("images_allowed") is not False:
        warnings.append("Revisar images_allowed: el staging textual no debe autorizar imágenes implícitamente.")
    if not acquisition.get("files"):
        errors.append("acquisition.json no registra archivos")
    warnings.extend(acquisition.get("auditWarnings", []))
    if legal.get("review_status") in {"CITATION_ONLY", "LEGAL_REVIEW_REQUIRED"}:
        warnings.append(f"Estado legal restrictivo: {legal['review_status']}")
    return errors, warnings, reports


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source_dir", type=Path)
    args = parser.parse_args()
    errors, warnings, reports = audit(args.source_dir)
    status = "FAIL" if errors else "WARNING" if warnings else "PASS"
    print(json.dumps({
        "source": str(args.source_dir),
        "status": status,
        "ok": not errors,
        "files": reports,
        "warnings": warnings,
        "errors": errors,
    }, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
