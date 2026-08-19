#!/usr/bin/env python3
"""Extrae OCR auxiliar de un facsímil respetando regiones de lectura verificadas.

La salida sigue siendo un borrador OCR y nunca sustituye el cotejo visual. Requiere
Pillow, RapidOCR/ONNX Runtime y ``pdftoppm``; las dependencias no forman parte de la
aplicación web y pueden instalarse en un entorno temporal.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from rapidocr_onnxruntime import RapidOCR
except ImportError as exc:  # pragma: no cover - depende del entorno editorial
    raise SystemExit(
        "Falta rapidocr_onnxruntime; instálelo en un entorno editorial aislado"
    ) from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--layout", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--dpi", type=int, default=300)
    return parser.parse_args()


def crop_box(region: list[float], width: int, height: int) -> tuple[int, int, int, int]:
    if len(region) != 4 or any(value < 0 or value > 1 for value in region):
        raise ValueError(f"región normalizada inválida: {region!r}")
    left, top, right, bottom = region
    if not (left < right and top < bottom):
        raise ValueError(f"región vacía o invertida: {region!r}")
    return (
        round(left * width),
        round(top * height),
        round(right * width),
        round(bottom * height),
    )


def ocr_region(engine: RapidOCR, image: Image.Image, region: list[float]) -> list[str]:
    cropped = image.crop(crop_box(region, image.width, image.height))
    result, _ = engine(np.asarray(cropped.convert("RGB")))
    if not result:
        return []
    ordered = sorted(
        result,
        key=lambda item: (
            min(point[1] for point in item[0]),
            min(point[0] for point in item[0]),
        ),
    )
    return [str(item[1]).strip() for item in ordered if str(item[1]).strip()]


def main() -> int:
    args = parse_args()
    payload = json.loads(args.layout.read_text(encoding="utf-8"))
    pages = payload.get("pages", [])
    if not pages:
        raise SystemExit("el archivo de disposición no contiene páginas")

    engine = RapidOCR()
    page_texts: list[str] = []
    with tempfile.TemporaryDirectory(prefix="pulpit-ocr-") as directory:
        temp = Path(directory)
        for page in pages:
            number = int(page["physicalPage"])
            prefix = temp / f"page-{number}"
            subprocess.run(
                [
                    "pdftoppm", "-f", str(number), "-l", str(number),
                    "-r", str(args.dpi), "-png", "-singlefile",
                    str(args.pdf), str(prefix),
                ],
                check=True,
            )
            with Image.open(prefix.with_suffix(".png")) as image:
                lines: list[str] = []
                for region in page["regions"]:
                    lines.extend(ocr_region(engine, image, region))
            page_texts.append("\n".join(lines))

    args.output.write_text("\f".join(page_texts) + "\n", encoding="utf-8")
    print(f"{len(page_texts)} páginas extraídas con regiones verificadas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
