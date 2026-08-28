#!/usr/bin/env python3
"""Genera el catálogo permitido del endpoint de traducción del Asistente.

La fuente de verdad son los paquetes estáticos ya construidos. El catálogo no
contiene textos: solo identidad, idioma y SHA-256 exacto del original. Esto
permite al Worker rechazar texto arbitrario sin duplicar el corpus.
"""

import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
DEFAULT_PACKAGES = REPO_ROOT / "biblia/modules/study-assistant/chapters"
DEFAULT_OUTPUT = REPO_ROOT / "cloudflare/api-bible-worker/study-assistant-catalog.json"
CATEGORIES = ("diccionario", "historia", "costumbres")


def build_catalog(packages_dir):
    catalog = {}
    package_count = 0
    resource_count = 0
    for path in sorted(packages_dir.glob("*/*.json")):
        package = json.loads(path.read_text(encoding="utf-8"))
        if package.get("schemaVersion") != 2:
            raise ValueError(f"Schema no compatible en {path}")
        package_count += 1
        for category in CATEGORIES:
            for resource in package["resources"][category].values():
                resource_count += 1
                metadata = resource.get("traduccion") or {}
                resource_id = metadata.get("resourceId")
                allowed = {
                    "sourceLanguage": metadata.get("sourceLanguage"),
                    "sourceHash": metadata.get("sourceHash"),
                }
                if not resource_id or allowed["sourceLanguage"] not in {"es", "en"}:
                    raise ValueError(f"Metadatos incompletos en {path}: {metadata}")
                if not isinstance(allowed["sourceHash"], str) or len(allowed["sourceHash"]) != 64:
                    raise ValueError(f"Hash inválido en {path}: {metadata}")
                previous = catalog.get(resource_id)
                if previous is not None and previous != allowed:
                    raise ValueError(
                        f"resourceId ambiguo: {resource_id}: {previous} != {allowed}"
                    )
                catalog[resource_id] = allowed
    if package_count == 0:
        raise ValueError(f"No se encontraron paquetes en {packages_dir}")
    return dict(sorted(catalog.items())), package_count, resource_count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--packages-dir", type=Path, default=DEFAULT_PACKAGES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    catalog, packages, appearances = build_catalog(args.packages_dir)
    payload = {
        "schemaVersion": 1,
        "resources": catalog,
    }
    serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
    json.loads(serialized)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(serialized, encoding="utf-8")
    print(json.dumps({
        "paquetes": packages,
        "aparicionesRecursos": appearances,
        "recursosUnicos": len(catalog),
        "bytesCatalogo": len(serialized.encode("utf-8")),
        "salida": str(args.output),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
