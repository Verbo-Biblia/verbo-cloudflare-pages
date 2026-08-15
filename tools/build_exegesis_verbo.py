#!/usr/bin/env python3
"""Convierte los paquetes fuente de "Comentario Exegético Verbo"
(/home/juan/Verbo/Comentario/Comentario_Exegetico_Verbo_<Libro>/) al módulo
de comentario que consume la app (biblia/modules/commentaries/exegesis-verbo/,
mismo mecanismo que "Comentarios Verbo" y el resto de comentarios — aparece
como opción propia en el selector del panel "Comentario"), agregando en el
camino enlaces reales:

- Códigos Strong (G1586, H430, …) → <a class="strong" href="#sG1586">.
- Referencias bíblicas en prosa ("Efesios 2:8", "1 Corintios 13:4", "Ef 2:8")
  → <a class="bible">, usando exactamente los mismos alias que reconoce
  bibleNameAliases en biblia/assets/app.js (copiados abajo) para no generar
  enlaces que la app no sepa resolver.

Detecta automáticamente cualquier carpeta Comentario_Exegetico_Verbo_* nueva
que se agregue en el directorio fuente — no hace falta tocar este script para
sumar libros, solo volver a correrlo.

Uso: python3 tools/build_exegesis_verbo.py
Después: python3 tools/build_registry_catalog.py
"""
import json
import re
from pathlib import Path

SOURCE_DIR = Path("/home/juan/Verbo/Comentario")
MODULE_DIR = Path(__file__).resolve().parent.parent / "biblia" / "modules" / "commentaries" / "exegesis-verbo"
REGISTRY_PATH = Path(__file__).resolve().parent.parent / "biblia" / "modules" / "registry.json"
MODULE_MANIFEST_REL = "commentaries/exegesis-verbo/manifest.json"
REGISTRY_KEY = "commentaries"

# Copia exacta de bibleNameAliases (biblia/assets/app.js) — si esa lista
# cambia allá, hay que reflejarlo acá para que los enlaces generados sigan
# siendo resolubles por parseBibleReference().
BIBLE_NAME_ALIASES = {
    "GEN": ["gen", "genesis", "génesis", "gn"],
    "EXO": ["exo", "exodo", "éxodo", "ex"],
    "LEV": ["lev", "levitico", "levítico", "lv"],
    "NUM": ["num", "numeros", "números", "nm"],
    "DEU": ["deu", "deuteronomio", "dt"],
    "JOS": ["jos", "josue", "josué"],
    "JDG": ["jdg", "jue", "jueces"],
    "RUT": ["rut", "rt"],
    "1SA": ["1sa", "1 sam", "1sam", "1 s"],
    "2SA": ["2sa", "2 sam", "2sam", "2 s"],
    "1KI": ["1re", "1 rey", "1rey", "1 r"],
    "2KI": ["2re", "2 rey", "2rey", "2 r"],
    "1CH": ["1cr", "1 cro", "1cro"],
    "2CH": ["2cr", "2 cro", "2cro"],
    "EZR": ["esd", "esdras"],
    "NEH": ["neh", "nehemias", "nehemías"],
    "EST": ["est", "ester"],
    "JOB": ["job"],
    "PSA": ["sal", "salmo", "salmos"],
    "PRO": ["pro", "prov", "proverbios", "pr"],
    "ECC": ["ecl", "ec", "eclesiastes", "eclesiastés"],
    "SNG": ["cnt", "cant", "cantares"],
    "ISA": ["isa", "is", "isaias", "isaías"],
    "JER": ["jer", "jeremias", "jeremías"],
    "LAM": ["lam", "lamentaciones", "lm"],
    "EZK": ["eze", "ez", "ezequiel"],
    "DAN": ["dan", "dn", "daniel"],
    "HOS": ["hos", "ose", "oseas"],
    "JOL": ["joe", "jl", "joel"],
    "AMO": ["amo", "am", "amos"],
    "OBA": ["abd", "abdias", "abdías"],
    "JON": ["jon", "jonas", "jonás"],
    "MIC": ["miq", "mi", "miqueas"],
    "NAM": ["nah", "nam", "nahum"],
    "HAB": ["hab", "habacuc"],
    "ZEP": ["sof", "sofonias", "sofonías"],
    "HAG": ["hag", "ageo"],
    "ZEC": ["zac", "zec", "zacarias", "zacarías"],
    "MAL": ["mal", "malaquias", "malaquías"],
    "MAT": ["mat", "mt", "mateo"],
    "MRK": ["mar", "mc", "mr", "marcos"],
    "LUK": ["luc", "lc", "lu", "lucas"],
    "JHN": ["jua", "jn", "juan"],
    "ACT": ["hch", "hech", "hechos"],
    "ROM": ["rom", "ro", "roman", "romanos"],
    "1CO": ["1co", "1 cor", "1cor", "1 corintios"],
    "2CO": ["2co", "2 cor", "2cor", "2 corintios"],
    "GAL": ["gal", "gál", "galatas", "gálatas"],
    "EPH": ["efe", "ef", "efesios"],
    "PHP": ["fil", "flp", "filipenses"],
    "COL": ["col", "colosenses"],
    "1TH": ["1ts", "1 tes", "1tes", "1 tesalonicenses"],
    "2TH": ["2ts", "2 tes", "2tes", "2 tesalonicenses"],
    "1TI": ["1ti", "1 tim", "1tim", "1 timoteo"],
    "2TI": ["2ti", "2 tim", "2tim", "2 timoteo"],
    "TIT": ["tit", "tito"],
    "PHM": ["flm", "film", "filemon", "filemón"],
    "HEB": ["heb", "hebreos"],
    "JAS": ["stg", "sant", "santiago"],
    "1PE": ["1pe", "1 ped", "1ped", "1 p", "1 pedro"],
    "2PE": ["2pe", "2 ped", "2ped", "2 p", "2 pedro"],
    "1JN": ["1jn", "1 jn", "1 juan"],
    "2JN": ["2jn", "2 jn", "2 juan"],
    "3JN": ["3jn", "3 jn", "3 juan"],
    "JUD": ["jud", "judas"],
    "REV": ["ap", "apo", "apoc", "apocalipsis"],
}

# Dos formatos reales conviven en el corpus: "..., G1249)" (Efesios/Filipenses/
# Mateo: el código va suelto justo antes del paréntesis de cierre) y
# "(<em>G2098</em>)" (Marcos: el código va envuelto en su propia etiqueta). El
# lookahead admite cero o más etiquetas de cierre entre el código y el ")".
STRONG_CODE_RE = re.compile(r"\b([GH]\d{1,4})\b(?=(?:</\w+>)*\))")

# Alternativas ordenadas de más larga a más corta para que el regex prefiera
# "1 corintios" sobre intentar matchear fragmentos más cortos primero.
_ALIAS_ALTERNATION = sorted(
    {alias for aliases in BIBLE_NAME_ALIASES.values() for alias in aliases},
    key=len,
    reverse=True,
)
# El grupo final captura un rango final ("–14", "-18") por separado: goToBibleReference()
# solo puede saltar a UN versículo (el primero del rango), así que un enlace sobre
# "Juan 1:1–3" llevaría al lector a pensar que abre el rango completo cuando en
# realidad solo abre 1:1 — mejor no enlazar esos casos y dejarlos como texto plano.
BIBLE_REF_RE = re.compile(
    r"\b(" + "|".join(re.escape(a) for a in _ALIAS_ALTERNATION) + r")"
    r"\s+(\d{1,3})\s*:\s*(\d{1,3})(\s*[–‒-]\s*\d{1,3})?",
    re.IGNORECASE,
)


def link_strong_codes(html: str) -> str:
    return STRONG_CODE_RE.sub(r'<a class="strong" href="#s\1">\1</a>', html)


def link_bible_references(html: str) -> str:
    def repl(m: re.Match) -> str:
        if m.group(4):  # referencia de rango ("1:1–3") — no enlazar, ver comentario arriba
            return m.group(0)
        return f'<a class="bible" href="#">{m.group(0)}</a>'
    return BIBLE_REF_RE.sub(repl, html)


def add_links(html: str) -> str:
    return link_bible_references(link_strong_codes(html))


def build_book(book_dir: Path):
    manifest = json.loads((book_dir / "manifest.json").read_text(encoding="utf-8"))
    book_id = manifest["book"]["id"]
    book_name = manifest["book"]["nameEs"]
    unit_files = sorted(
        f for f in manifest["files"] if re.match(rf"^{re.escape(book_id)}-\d+\.json$", f)
    )
    entries = []
    for fname in unit_files:
        chapter_data = json.loads((book_dir / fname).read_text(encoding="utf-8"))
        for unit in chapter_data["units"]:
            entries.append({
                "id": unit["id"],
                "title": unit["title"],
                "author": unit.get("author", "Verbo"),
                "reference": unit["reference"],
                "content": add_links(unit["content"]),
            })
    strong_links = sum(e["content"].count('class="strong"') for e in entries)
    bible_links = sum(e["content"].count('class="bible"') for e in entries)
    print(f"  {book_id} ({book_name}): {len(entries)} unidades, "
          f"{strong_links} enlaces Strong, {bible_links} enlaces bíblicos")
    return book_id, book_name, entries


def main():
    book_dirs = sorted(SOURCE_DIR.glob("Comentario_Exegetico_Verbo_*"))
    if not book_dirs:
        print(f"No se encontraron paquetes fuente en {SOURCE_DIR}")
        return

    books_manifest = []
    (MODULE_DIR / "books").mkdir(parents=True, exist_ok=True)
    for book_dir in book_dirs:
        if not (book_dir / "manifest.json").exists():
            continue
        book_id, book_name, entries = build_book(book_dir)
        out_path = MODULE_DIR / "books" / f"{book_id}.json"
        out_path.write_text(
            json.dumps({"entries": entries}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        books_manifest.append({"id": book_id, "name": book_name, "file": f"books/{book_id}.json"})

    # Limpia archivos huérfanos de libros que ya no están en la carpeta fuente
    # (ej. Juan sacó Efesios para reescribirlo) — sin esto quedarían servidos
    # datos viejos sin ninguna entrada en manifest.json que los referencie.
    current_ids = {b["id"] for b in books_manifest}
    for stale in (MODULE_DIR / "books").glob("*.json"):
        stem_id = stale.stem.split(".")[0]
        if stem_id not in current_ids:
            stale.unlink()
            print(f"  (eliminado archivo huérfano: books/{stale.name})")

    manifest = {
        "schemaVersion": 2,
        "id": "exegesis-verbo",
        "type": "commentary",
        "name": "Comentario Exegético Verbo",
        "abbreviation": "Exegético Verbo",
        "language": "es",
        "author": "Verbo",
        "description": "Comentario exegético académico de Verbo: contexto literario, histórico y lingüístico, análisis del idioma original, crítica textual e implicaciones teológicas por perícopa.",
        "license": "Todos los derechos reservados por Verbo.",
        "books": books_manifest,
    }
    (MODULE_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    if MODULE_MANIFEST_REL not in registry.get(REGISTRY_KEY, []):
        registry.setdefault(REGISTRY_KEY, []).append(MODULE_MANIFEST_REL)
        REGISTRY_PATH.write_text(
            json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"registry.json: agregado {MODULE_MANIFEST_REL} a \"{REGISTRY_KEY}\"")
    else:
        print(f"registry.json: {MODULE_MANIFEST_REL} ya estaba en \"{REGISTRY_KEY}\"")

    print(f"\nMódulo escrito en {MODULE_DIR}")
    print("Ahora correr: python3 tools/build_registry_catalog.py")


if __name__ == "__main__":
    main()
