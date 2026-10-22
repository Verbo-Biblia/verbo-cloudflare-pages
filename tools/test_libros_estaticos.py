#!/usr/bin/env python3
"""Comprueba tools/libros_estaticos.py contra la lógica real de reader.js.

Uso: python3 tools/test_libros_estaticos.py [--chrome] [slug ...]

1. splitIntoParagraphs de Python == el de reader.js (se extrae la función del
   archivo y se ejecuta con node) para casos límite y para cada capítulo de
   todos los libros de la Librería, sin perder texto y sin cambiar los párrafos
   de los capítulos donde la división anterior no perdía nada.
2. El bloque estático de cada página, leído como lo haría el navegador
   (textContent de cada <p> unido por un espacio), se re-divide en JS en los
   mismos párrafos: los resaltados guardados siguen coincidiendo.
3. --chrome: abre una página en Chrome sin interfaz (servidor local) y verifica
   que el lector se arma desde el HTML, sin pedir el sections.json.
"""
from __future__ import annotations

import functools
import http.server
import json
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import libros_estaticos as le  # noqa: E402

ROOT = le.ROOT
READER_JS = ROOT / "libreria/assets/reader.js"

EDGE_CASES = [
    "", "   ", "...", "Hola.", "Hola.\n", "Uno. Dos.\nTres", "Fin sin punto\n",
    "Emoji \U0001f310 " * 60 + "fin.", "a\u00a0b. c\ufeffd. e\u0085f. g\x1fh. i.\u2028j",
    '"¿Quién?" dijo. "Yo." Luego... nada! Otra vez?' * 12,
    ("Oración larga con texto. " * 20) + "\n\nOtra parte.\n\n\nY más",
    "Le dijo: «¿Quién eres?» Y él: «Yo soy.»\nLuego (así fue.) se fue [sic.] lejos.",
    "Cita “final.” Otra ’cosa.’ y \"doble.\" y 'simple.' fin",
    "Cuatro cierres.»”’) aquí. Tres.»”) allá ?! ¿sí? ¡no!  \n  \t",
    ".» al inicio. ) solo ? ok",
    ("«¿Por qué?» " * 40) + "fin",
]

# El splitIntoParagraphs anterior (expresión /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g),
# solo como referencia para comprobar que donde no perdía texto el nuevo da
# exactamente los mismos párrafos (los resaltados guardados siguen alineados).
OLD_SENTENCE_RE = re.compile(r"[^.!?]+[.!?]+(?=[" + le.JS_WS + r"]|\Z)|[^.!?]+\Z")
NON_WS_RE = re.compile(r"[" + le.JS_WS + r"]+")


def old_split(text: str) -> list[str]:
    if not text:
        return []
    paras, buf = [], ""
    for sentence in OLD_SENTENCE_RE.findall(text) or [text]:
        s = le.js_trim(sentence)
        if not s:
            continue
        buf = buf + " " + s if buf else s
        if le.js_len(buf) >= 320:
            paras.append(buf)
            buf = ""
    if buf:
        paras.append(buf)
    return paras or [text]


def visible(text_or_paras) -> str:
    if isinstance(text_or_paras, list):
        text_or_paras = "".join(text_or_paras)
    return NON_WS_RE.sub("", text_or_paras)


def all_books() -> list[str]:
    slugs = []
    for page in sorted(le.LIBRERIA.glob("*/index.html")):
        try:
            le.book_config(page)
        except ValueError:
            continue  # Biblias (bibleManifestUrl) y Mi biblioteca
        slugs.append(page.parent.name)
    return slugs


def check_all_books() -> None:
    """Para los libros de toda la Librería: Python == JS, sin pérdida, y sin
    cambios donde el algoritmo anterior no perdía nada."""
    total = changed = old_lossy = 0
    books = all_books()
    for slug in books:
        page = le.LIBRERIA / slug / "index.html"
        cfg = le.book_config(page)
        data = json.loads((page.parent / cfg["dataUrl"]).resolve().read_text(encoding="utf-8"))
        chapters = le.normalize(data, cfg)
        js = js_split([ch["text"] for ch in chapters])
        for ch, js_paras in zip(chapters, js):
            total += 1
            new = le.split_into_paragraphs(ch["text"])
            where = f"{slug} cap {ch['n']}"
            assert new == js_paras, f"{where}: Python != JS"
            assert visible(new) == visible(ch["text"]), f"{where}: se pierde texto"
            old = old_split(ch["text"])
            if visible(old) == visible(ch["text"]):
                assert new == old, f"{where}: cambió un capítulo que antes no perdía texto"
            else:
                old_lossy += 1
                changed += new != old
    print(f"toda la Librería: {len(books)} libros, {total} capítulos; sin pérdida de texto; "
          f"{old_lossy} capítulos perdían texto antes ({changed} cambian de párrafos); el resto idéntico")


def js_split(texts: list[str]) -> list[list[str]]:
    """Ejecuta splitIntoParagraphs tal como está escrita en reader.js."""
    src = READER_JS.read_text(encoding="utf-8")
    m = re.search(r"\n  function splitIntoParagraphs\(text\) \{.*?\n  \}\n", src, re.S)
    if not m:
        raise SystemExit("no se encontró splitIntoParagraphs en reader.js")
    script = (
        "var cfg = {};\n" + m.group(0) +
        "\nvar input = JSON.parse(require('fs').readFileSync(0, 'utf8'));"
        "\nprocess.stdout.write(JSON.stringify(input.map(splitIntoParagraphs)));"
    )
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(script)
    try:
        out = subprocess.run(["node", f.name], input=json.dumps(texts), capture_output=True,
                             text=True, check=True, encoding="utf-8").stdout
    finally:
        Path(f.name).unlink()
    return json.loads(out)


class StaticReader(HTMLParser):
    """Lee el bloque estático como readStaticChapters() (textContent)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.chapters, self.tag = [], None

    def handle_starttag(self, tag, attrs):
        if tag == "section" and dict(attrs).get("data-n") is not None:
            self.chapters.append({"n": dict(attrs)["data-n"], "title": "", "paras": []})
        elif tag in ("h2", "p") and self.chapters:
            self.tag = tag
            if tag == "p":
                self.chapters[-1]["paras"].append("")

    def handle_endtag(self, tag):
        if tag == self.tag:
            self.tag = None

    def handle_data(self, data):
        if self.tag == "h2":
            self.chapters[-1]["title"] += data
        elif self.tag == "p":
            self.chapters[-1]["paras"][-1] += data


def read_static(page: Path) -> list[dict]:
    text = page.read_text(encoding="utf-8")
    m = re.search(re.escape(le.START) + r"(.*?)" + re.escape(le.END), text, re.S)
    if not m:
        raise AssertionError("la página no tiene bloque estático")
    # El parser HTML del navegador convierte \r\n y \r en \n antes de leer.
    block = m.group(1).replace("\r\n", "\n").replace("\r", "\n")
    parser = StaticReader()
    parser.feed(block)
    return parser.chapters


def check_book(slug: str) -> tuple[int, int]:
    page = le.LIBRERIA / slug / "index.html"
    cfg = le.book_config(page)
    data = json.loads((page.parent / cfg["dataUrl"]).resolve().read_text(encoding="utf-8"))
    chapters = le.normalize(data, cfg)
    original = js_split([ch["text"] for ch in chapters])
    for ch, js in zip(chapters, original):
        assert le.split_into_paragraphs(ch["text"]) == js, f"{slug} cap {ch['n']}: Python != JS"
    static = read_static(page)
    assert len(static) == len(chapters), f"{slug}: {len(static)} secciones, {len(chapters)} capítulos"
    rebuilt = [" ".join(s["paras"]) for s in static]
    resplit = js_split(rebuilt)
    for ch, st, js, again in zip(chapters, static, original, resplit):
        assert st["n"] == ch["n"] and st["title"] == ch["title"], f"{slug} cap {ch['n']}: n/título"
        assert st["paras"] == js, f"{slug} cap {ch['n']}: párrafos del HTML != JS"
        assert again == js, f"{slug} cap {ch['n']}: re-dividir el texto del HTML cambia los párrafos"
    same_text = sum(1 for ch, t in zip(chapters, rebuilt) if ch["text"] == t)
    return len(chapters), same_text


def check_chrome(slug: str) -> None:
    chrome = next((c for c in ("google-chrome", "chromium", "chromium-browser") if shutil.which(c)), None)
    if not chrome:
        print("chrome: no disponible, se omite")
        return
    requested = []

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, fmt, *args):
            requested.append(self.path)

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/libreria/{slug}/#2"
    try:
        with tempfile.TemporaryDirectory() as profile:
            dom = subprocess.run(
                [chrome, "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={profile}",
                 "--virtual-time-budget=8000", "--dump-dom", url],
                capture_output=True, text=True, timeout=90, encoding="utf-8").stdout
    finally:
        server.shutdown()
    page = le.LIBRERIA / slug / "index.html"
    cfg = le.book_config(page)
    expected = read_static(page)[1]
    assert "data-reader-static" not in dom, "chrome: el bloque estático no fue reemplazado"
    assert 'class="reader-content"' in dom, "chrome: no se armó el lector"
    paras = re.findall(r'<p class="reader-para" data-para="(\d+)">(.*?)</p>', dom, re.S)
    got = [le.html_to_plain_text(p) for _, p in paras]
    assert got == expected["paras"], "chrome: los párrafos del capítulo 2 no coinciden"
    data_file = cfg["dataUrl"].split("/")[-1]
    assert not any(data_file in r and "modules" in r for r in requested), "chrome: se pidió el JSON"
    print(f"chrome: {slug}#2 armado desde el HTML ({len(got)} párrafos, sin pedir {data_file})")


def main(argv: list[str]) -> int:
    use_chrome = "--chrome" in argv
    slugs = [a for a in argv if not a.startswith("--")] or le.LIBROS
    edge = js_split(EDGE_CASES)
    for text, js in zip(EDGE_CASES, edge):
        assert le.split_into_paragraphs(text) == js, f"caso límite {text[:30]!r}: Python != JS"
        assert visible(js) == visible(text), f"caso límite {text[:30]!r}: se pierde texto"
        assert js_split([" ".join(js)])[0] == js or not text.strip(), f"caso límite {text[:30]!r}: re-división"
    print(f"casos límite: {len(EDGE_CASES)} OK")
    check_all_books()
    html_books = [s for s in slugs if le.book_config(le.LIBRERIA / s / "index.html").get("htmlSource")]
    if not html_books:
        print("htmlSource: ningún libro de la lista lo usa, se omite")
    for slug in slugs:
        n, same = check_book(slug)
        print(f"{slug}: {n} capítulos OK ({same} con texto idéntico al JSON)")
    if use_chrome:
        check_chrome(slugs[0] if len(slugs) == 1 else "la-didache")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
