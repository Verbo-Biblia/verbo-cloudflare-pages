#!/usr/bin/env python3
"""Escribe el texto completo de un libro de la Librería como HTML estático.

Uso: python3 tools/libros_estaticos.py [slug ...]
Sin argumentos convierte los libros de LIBROS (traducciones propias de Juan).

Para cada libro lee window.__LIBRERIA_BOOK__ de libreria/<slug>/index.html,
carga su dataUrl y aplica la misma normalización que libreria/assets/reader.js
(normalize, htmlToPlainText, splitIntoParagraphs). El resultado queda dentro de
#reader-root como <div data-reader-static>: un <section data-n> por
capítulo con su <h2> y un <p> por párrafo. reader.js arma los capítulos desde
ese bloque sin pedir el JSON; los párrafos re-divididos son idénticos, así
los resaltados guardados ("capítulo:párrafo" + offsets) siguen coincidiendo.

Idempotente: al volver a ejecutarlo se reemplaza el bloque anterior.
Ejecutarlo de nuevo cada vez que cambie el sections.json de uno de estos libros.
"""
from __future__ import annotations

import html
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIBRERIA = ROOT / "libreria"

LIBROS = [
    "primera-clemente",
    "segunda-clemente",
    "la-didache",
    "epistola-de-bernabe",
    "epistola-a-diogneto",
    "el-pastor-de-hermas",
    "fragmentos-de-papias",
    "policarpo-a-los-filipenses",
    "martirio-de-policarpo",
    "martirio-de-ignacio",
    "contra-las-herejias",
    "evangelio-segun-jesucristo",
]

START, END = "<!-- verbo:libro-estatico -->", "<!-- /verbo:libro-estatico -->"
ROOT_RE = re.compile(
    r'(<div class="reader" id="reader-root">)\s*'
    r"(?:" + re.escape(START) + r".*?" + re.escape(END) + r"\s*)?"
    r"(</div>)",
    re.S,
)
CFG_RE = re.compile(r"window\.__LIBRERIA_BOOK__\s*=\s*(\{.*?\});\s*</script>", re.S)

# Equivalentes exactos de JavaScript: \s y String.prototype.trim usan este
# conjunto (no el de str.isspace de Python), y $ sin bandera m es solo el
# final del texto (\Z, no el $ de Python, que acepta un \n final).
# Python no admite lookbehind de largo variable: se miran los 4 caracteres
# previos a cada tramo de espacios, igual que reader.js.
JS_WS = "\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
WS_RUN_RE = re.compile(r"[" + JS_WS + r"]+")
SENTENCE_END_RE = re.compile(r"[.!?][»”’\"')\]]{0,3}\Z")
TRIM_RE = re.compile(r"^[" + JS_WS + r"]+|[" + JS_WS + r"]+\Z")


def js_trim(s: str) -> str:
    return TRIM_RE.sub("", s)


def js_len(s: str) -> int:
    """String.length de JS: unidades UTF-16 (un emoji cuenta 2)."""
    return len(s.encode("utf-16-le")) // 2


def js_str(v) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def split_into_paragraphs(text: str) -> list[str]:
    """splitIntoParagraphs de reader.js (rama de prosa, no la de Biblia)."""
    if not text:
        return []
    # Corte sin pérdida: en el espacio que sigue a . ! ? (+ hasta 3 cierres).
    sentences, last = [], 0
    for m in WS_RUN_RE.finditer(text):
        if SENTENCE_END_RE.search(text[max(0, m.start() - 4):m.start()]):
            sentences.append(text[last:m.start()])
            last = m.end()
    sentences.append(text[last:])
    paras, buf = [], ""
    for sentence in sentences:
        s = js_trim(sentence)
        if not s:
            continue
        buf = buf + " " + s if buf else s
        if js_len(buf) >= 320:
            paras.append(buf)
            buf = ""
    if buf:
        paras.append(buf)
    return paras or [text]


class _TextContent(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data):
        self.parts.append(data)


def html_to_plain_text(source: str) -> str:
    """htmlToPlainText de reader.js; textContent se aproxima con HTMLParser."""
    with_breaks = re.sub(r"</p>|<br[" + JS_WS + r"]*/?>", "\n\n", source, flags=re.I)
    parser = _TextContent()
    parser.feed(with_breaks.replace("\r\n", "\n").replace("\r", "\n"))
    parser.close()
    return js_trim(re.sub(r"\n{3,}", "\n\n", "".join(parser.parts)))


def normalize(raw: dict, cfg: dict) -> list[dict]:
    chapters = []
    for i, item in enumerate(raw.get(cfg["dataKey"]) or []):
        text = item.get(cfg["textField"]) or ""
        if cfg.get("htmlSource"):
            text = html_to_plain_text(text)
        n = item.get("n") or i + 1
        title = item.get(cfg["titleField"]) or f'{cfg["unitLabel"]} {js_str(n)}'
        chapters.append({"n": js_str(n), "title": js_str(title), "text": text})
    return chapters


def esc(s: str) -> str:
    # El parser HTML convierte \r en \n; &#13; lo conserva tal cual en textContent.
    return html.escape(s, quote=False).replace("\r", "&#13;")


def static_block(chapters: list[dict]) -> str:
    # <div>, no <article>: site-chrome.js elige su capa 3D según haya o no
    # "main article", y recursos.css estiliza "article h2/p" de otra forma.
    out = [START, '<div class="reader-static" data-reader-static="1">']
    for ch in chapters:
        paras = split_into_paragraphs(ch["text"])
        if split_into_paragraphs(" ".join(paras)) != paras:
            raise ValueError(f'capítulo {ch["n"]}: los párrafos no se re-dividen igual')
        out.append(f'<section class="reader-static-chapter" data-n="{html.escape(ch["n"])}">')
        out.append(f'<h2>{esc(ch["title"])}</h2>')
        out.extend(f"<p>{esc(p)}</p>" for p in paras)
        out.append("</section>")
    out += ["</div>", END]
    return "\n".join(out)


def book_config(page: Path) -> dict:
    m = CFG_RE.search(page.read_text(encoding="utf-8"))
    if not m:
        raise ValueError("no tiene window.__LIBRERIA_BOOK__")
    cfg = json.loads(m.group(1))
    if cfg.get("bibleManifestUrl") or not cfg.get("dataUrl"):
        raise ValueError("no es un libro con dataUrl (¿Biblia?)")
    return cfg


def convert(slug: str) -> tuple[int, int]:
    page = LIBRERIA / slug / "index.html"
    cfg = book_config(page)
    data = json.loads((page.parent / cfg["dataUrl"]).resolve().read_text(encoding="utf-8"))
    chapters = normalize(data, cfg)
    if not chapters:
        raise ValueError("el JSON no tiene capítulos")
    source = page.read_text(encoding="utf-8")
    block = static_block(chapters)
    new, count = ROOT_RE.subn(lambda m: f"{m.group(1)}\n{block}\n{m.group(2)}", source, count=1)
    if count != 1:
        raise ValueError('no se encontró <div class="reader" id="reader-root">')
    page.write_text(new, encoding="utf-8")
    return len(chapters), len(new.encode("utf-8"))


def main(argv: list[str]) -> int:
    failed = 0
    for slug in argv or LIBROS:
        try:
            n, size = convert(slug)
            print(f"{slug}: {n} capítulos, {size / 1024:.0f} KB")
        except (OSError, ValueError) as exc:
            failed += 1
            print(f"{slug}: ERROR {exc}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
