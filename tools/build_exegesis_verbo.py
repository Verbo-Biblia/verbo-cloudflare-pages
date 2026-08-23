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
     python3 tools/build_exegesis_verbo.py --package /ruta/al/paquete [...]
Después: python3 tools/build_registry_catalog.py
"""
import argparse
import html
import json
import re
import unicodedata
from pathlib import Path

SOURCE_DIR = Path("/home/juan/Verbo/Comentario")
MODULE_DIR = Path(__file__).resolve().parent.parent / "biblia" / "modules" / "commentaries" / "exegesis-verbo"
REGISTRY_PATH = Path(__file__).resolve().parent.parent / "biblia" / "modules" / "registry.json"
MODULE_MANIFEST_REL = "commentaries/exegesis-verbo/manifest.json"
REGISTRY_KEY = "commentaries"

# Nombres en español para los paquetes fuente cuyo manifest.json no trae
# "book": {"nameEs": ...} (ver build_book) — mismo catálogo que ya usa
# "Comentarios Verbo" para los 66 libros, para no duplicar la lista a mano.
_COMENTARIOS_VERBO_MANIFEST = (
    MODULE_DIR.parent / "comentarios-verbo" / "manifest.json"
)
BOOK_NAMES_ES = {
    b["id"]: b["name"]
    for b in json.loads(_COMENTARIOS_VERBO_MANIFEST.read_text(encoding="utf-8"))["books"]
} if _COMENTARIOS_VERBO_MANIFEST.exists() else {}


def _normalize_for_typo_check(name: str) -> str:
    """"1_Corintios" / "Filemon" -> "1corintios" / "filemon", para comparar
    contra el catálogo canónico ignorando guiones bajos, espacios y tildes."""
    decomposed = unicodedata.normalize("NFKD", name)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"[\s_]+", "", without_accents).lower()

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

# Los paquetes fuente usan más de una convención tipográfica: códigos entre
# paréntesis, dentro de <em> o entre corchetes. Como esta función solo recibe el
# contenido fuente (aún sin enlaces generados), se enlaza toda aparición válida.
STRONG_CODE_RE = re.compile(r"\b([GH]\d{1,4})\b")
# Cuenta CUALQUIER código Strong en el texto fuente, sin el lookahead de
# arriba — sirve para detectar si algún libro nuevo usa un formato de
# puntuación distinto (como pasó con Marcos) que STRONG_CODE_RE no reconoce.
STRONG_CODE_RAW_RE = re.compile(r"\b[GH]\d{1,4}\b")

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
    def repl(m: re.Match) -> str:
        # Strong usa códigos canónicos sin ceros iniciales (G386, no G0386).
        code = f"{m.group(1)[0]}{int(m.group(1)[1:])}"
        return f'<a class="strong" href="#s{code}">{code}</a>'
    return STRONG_CODE_RE.sub(repl, html)


# Nadie que no lea griego/hebreo sabe qué dice una palabra como "λόγος" con solo
# mirarla — pero el código Strong de al lado ya abre su definición. Este segundo
# paso envuelve la palabra en negrita (el término léxico) con el MISMO enlace que
# su código, para que también se pueda tocar la palabra en sí, no solo "G3056".
# Busca <strong>PALABRA</strong> seguida —antes del próximo ")" y sin que se
# interponga otro <strong>— de un enlace a.strong ya generado por
# link_strong_codes(); cubre los dos formatos reales del corpus (código suelto
# antes del paréntesis, o código envuelto en su propia <em>).
GREEK_WORD_WRAP_RE = re.compile(
    r'<strong>([^<]+)</strong>'
    r'((?:(?!<strong>|\)).)*?<a class="strong" href="(#s[GH]\d+)">[GH]\d+</a>(?:(?!<strong>).)*?\))',
    re.DOTALL,
)

BRACKETED_GREEK_WORD_RE = re.compile(
    r'<strong>([^<]+?)\s*\[<a class="strong" href="(#s[GH]\d+)">([GH]\d+)</a>\]\.?</strong>'
)


def link_bracketed_greek_words(html: str) -> str:
    """Admite la convención nueva ``<strong>λόγος [G3056].</strong>``."""
    def repl(m: re.Match) -> str:
        word, href, code = m.group(1), m.group(2), m.group(3)
        punctuation = "." if m.group(0).endswith(".</strong>") else ""
        return (
            f'<a class="strong" href="{href}"><strong>{word}</strong></a> '
            f'[<a class="strong" href="{href}">{code}</a>]{punctuation}'
        )
    return BRACKETED_GREEK_WORD_RE.sub(repl, html)


def link_greek_words(html: str) -> str:
    def repl(m: re.Match) -> str:
        word, middle, href = m.group(1), m.group(2), m.group(3)
        return f'<a class="strong" href="{href}"><strong>{word}</strong></a>{middle}'
    return GREEK_WORD_WRAP_RE.sub(repl, html)


# link_greek_words() solo engancha la mención CITADA junto a su código (la que
# trae "(transliteración, G1586)" al lado). La misma palabra suele repetirse
# después en el resto de la unidad sin repetir la cita (ej. "τοῦτο" mencionado
# 3 veces más tras introducirse una vez) — antes esas repeticiones quedaban en
# negrita pero sin enlazar. Esta pasada arma, dentro de cada unidad, un mapa
# palabra→href a partir de lo que YA se enlazó, y reutiliza ese mismo enlace en
# cualquier otra mención textual idéntica de esa palabra que haya quedado
# suelta — nunca inventa un código para una palabra que no lo tuvo ni una vez.
def link_repeated_greek_words(html: str) -> str:
    word_href = {}
    for m in re.finditer(r'<a class="strong" href="(#s[GH]\d+)"><strong>([^<]+)</strong></a>', html):
        word_href.setdefault(m.group(2), m.group(1))
    if not word_href:
        return html

    def repl(m: re.Match) -> str:
        already_linked, word = m.group(1), m.group(2)
        if already_linked:
            return m.group(0)
        href = word_href.get(word)
        if not href:
            return m.group(0)
        return f'<a class="strong" href="{href}"><strong>{word}</strong></a>'
    return re.sub(r'(<a class="strong"[^>]*>)?<strong>([^<]+)</strong>', repl, html)


def link_bible_references(html: str) -> str:
    def repl(m: re.Match) -> str:
        if m.group(4):  # referencia de rango ("1:1–3") — no enlazar, ver comentario arriba
            return m.group(0)
        return f'<a class="bible" href="#">{m.group(0)}</a>'
    return BIBLE_REF_RE.sub(repl, html)


STRUCTURED_PARAGRAPH_RE = re.compile(r"<p>(\{.*?\})</p>")
CANONICAL_PATTERN_NAMES = {
    "exodus-pattern": "éxodo",
    "creation-new-creation": "creación–nueva creación",
    "temple-presence": "templo–presencia",
}


def render_structured_paragraphs(content: str) -> str:
    """Convierte metadatos JSON incrustados por algunos paquetes nuevos en
    prosa HTML legible, sin alterar el contenido semántico de la fuente."""
    def repl(m: re.Match) -> str:
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            return m.group(0)
        if data.get("author") and data.get("summary"):
            author = html.escape(str(data["author"]))
            work = html.escape(str(data.get("work", "")))
            date = data.get("date") or {}
            start, end = date.get("yearStart"), date.get("yearEnd")
            years = f"{start}–{end}" if start and end and start != end else str(start or end or "")
            citation = author
            if work:
                citation += f", <em>{work}</em>"
            if years:
                citation += f" (c. {years})"
            return f'<p><strong>{citation}.</strong> {html.escape(str(data["summary"]))}</p>'
        if data.get("type") and data.get("basis"):
            pattern = CANONICAL_PATTERN_NAMES.get(data["type"], str(data["type"]).replace("-", " "))
            return f'<p><strong>Patrón canónico: {html.escape(pattern)}.</strong> {html.escape(str(data["basis"]))}</p>'
        return m.group(0)
    return STRUCTURED_PARAGRAPH_RE.sub(repl, content)


def link_structured_lemmas(html: str, original_language_analysis: list) -> str:
    """Paquetes nuevos (schema CEV-1.0) no incrustan el código Strong como texto
    plano en el content — lo traen aparte en originalLanguageAnalysis[].strong,
    ya validado contra el resto del proyecto. Enlaza la primera mención de cada
    lema (<strong>λόγος</strong> sin enlazar todavía) con ese código; las
    repeticiones las toma después link_repeated_greek_words()."""
    for ola in original_language_analysis or []:
        codes = ola.get("strong") or []
        lemma = ola.get("lemma")
        if not codes or not lemma:
            continue
        target = f"<strong>{lemma}</strong>"
        # Algunos paquetes (ej. Profetas Menores) además citan el código
        # suelto en el texto ("...δράσω (H1875)..."), que el resto de
        # add_links() ya enlaza por su cuenta más abajo — sin este chequeo,
        # esta pasada envolvía el <strong> otra vez encima de ese enlace ya
        # puesto, dejando un <a><a>...</a></a> anidado.
        if re.search(rf'<a class="strong"[^>]*>{re.escape(target)}</a>', html):
            continue
        replacement = f'<a class="strong" href="#s{codes[0]}">{target}</a>'
        html = html.replace(target, replacement, 1)
    return html


def add_links(html: str, original_language_analysis: list | None = None) -> str:
    linked = render_structured_paragraphs(html)
    # Los enlaces "clásicos" (código suelto citado en el propio texto, ej.
    # "(H1875)") van primero: si un paquete además trae ese mismo lema en
    # originalLanguageAnalysis, link_structured_lemmas() lo detecta ya
    # enlazado (ver su chequeo) y no lo envuelve una segunda vez — al revés
    # (estructurado primero) el <strong> ya envuelto vuelve a matchear el
    # regex de estas pasadas, que no miran qué lo rodea, y anida <a><a>.
    linked = link_strong_codes(linked)
    linked = link_bracketed_greek_words(linked)
    linked = link_greek_words(linked)
    linked = link_repeated_greek_words(linked)
    linked = link_structured_lemmas(linked, original_language_analysis)
    return link_bible_references(linked)


def build_book(book_dir: Path):
    manifest = json.loads((book_dir / "manifest.json").read_text(encoding="utf-8"))
    book_field = manifest["book"]
    if "bookId" in manifest:
        # Tercer formato: {"book": "Génesis", "bookId": "GEN", ...} — "book"
        # ya es el nombre en español (no hace falta BOOK_NAMES_ES), y no hay
        # "files": los capítulos siempre viven en chapters/<bookId>/*.json.
        book_id = manifest["bookId"]
        book_name = book_field
        unit_files = sorted(
            str(p.relative_to(book_dir))
            for p in (book_dir / "chapters" / book_id).glob("*.json")
        )
    elif isinstance(book_field, dict):
        # Formato original: {"book": {"id": "ACT", "nameEs": "Hechos..."}, "files": [...]}
        book_id = book_field["id"]
        source_name = book_field["nameEs"]
        # nameEs a veces trae un typo evidente frente al catálogo canónico
        # (guion bajo en vez de espacio como "1_Corintios", o falta de tilde
        # como "Filemon" en vez de "Filemón") — se detecta comparando ambos
        # nombres sin espacios/guiones/tildes y, si coinciden, se usa el
        # canónico. Si nameEs es un nombre genuinamente distinto (más largo,
        # como "Hechos de los Apóstoles"), se respeta tal cual: es una
        # elección editorial del paquete, no un error a corregir.
        canonical_name = BOOK_NAMES_ES.get(book_id)
        if canonical_name and canonical_name != source_name and _normalize_for_typo_check(canonical_name) == _normalize_for_typo_check(source_name):
            book_name = canonical_name
        else:
            book_name = source_name
        unit_files = sorted(
            f for f in manifest["files"] if re.match(rf"^{re.escape(book_id)}-\d+\.json$", f)
        )
    else:
        # Formato alterno: {"book": "ROM", ...}. Los paquetes nuevos declaran
        # capítulos anidados ("chapters/BOOK/01.json" + "files": {"chapters":
        # "chapters/BOOK/", "crossChapter": "cross-chapter/"} en vez de una
        # lista plana) y pueden traer unidades que atraviesan capítulos en
        # archivos sueltos dentro de "crossChapter"; los paquetes anteriores
        # no traían "files" y guardaban ROM-XX.json directamente en la carpeta.
        book_id = book_field
        book_name = BOOK_NAMES_ES.get(book_id, book_id)
        files_field = manifest.get("files")
        if isinstance(files_field, dict):
            unit_files = sorted(
                str(p.relative_to(book_dir))
                for p in (book_dir / files_field["chapters"]).glob("*.json")
            )
            cross_chapter_rel = files_field.get("crossChapter")
            if cross_chapter_rel:
                cross_dir = book_dir / cross_chapter_rel
                if cross_dir.is_dir():
                    unit_files += sorted(
                        str(p.relative_to(book_dir)) for p in cross_dir.glob("*.json")
                    )
        else:
            unit_files = files_field or sorted(
                f.name for f in book_dir.glob(f"{book_id}-*.json")
            )
    entries = []
    raw_strong_count = 0
    for fname in unit_files:
        chapter_data = json.loads((book_dir / fname).read_text(encoding="utf-8"))
        for unit in chapter_data["units"]:
            raw_strong_count += len(STRONG_CODE_RAW_RE.findall(unit["content"]))
            linked_content = add_links(unit["content"], unit.get("originalLanguageAnalysis"))
            # Los paquetes CEV-1.0 no traen el código como texto plano en el
            # content (ver link_structured_lemmas) — no pueden contarse con
            # STRONG_CODE_RAW_RE arriba. Se valida aparte: cada lema con
            # "strong" no vacío debe haber quedado enlazado al menos una vez.
            for ola in unit.get("originalLanguageAnalysis") or []:
                codes = ola.get("strong") or []
                lemma = ola.get("lemma")
                if not codes or not lemma:
                    continue
                if f'<a class="strong" href="#s{codes[0]}"><strong>{lemma}</strong></a>' not in linked_content:
                    print(f"  *** AVISO: {book_id}/{unit['id']} lema '{lemma}' ({codes[0]}) "
                          f"no quedó enlazado en content — revisar coincidencia de texto.")
            entries.append({
                "id": unit["id"],
                "title": unit["title"],
                "author": unit.get("author", "Verbo"),
                "reference": unit["reference"],
                "content": linked_content,
            })
    # code_links: enlaces cuyo texto visible ES el código ("...">G1586</a>). Es
    # el número que debe coincidir 1:1 con raw_strong_count. greek_word_links:
    # el mismo código, pero envolviendo la palabra griega/hebrea en negrita en
    # vez del código — ver link_greek_words(). Total real de <a class="strong">
    # en el HTML es la suma de ambos (cuenta doble a propósito: la palabra y su
    # código apuntan al mismo lugar).
    code_links = 0
    greek_word_links = sum(
        len(re.findall(r'<a class="strong" href="#s[GH]\d+"><strong>', e["content"])) for e in entries
    )
    for e in entries:
        for m in re.finditer(r'<a class="strong" href="#s([GH]\d+)">([GH]\d+)</a>', e["content"]):
            code_links += 1
            if m.group(1) != m.group(2):
                print(f"  *** AVISO: {book_id}/{e['id']} enlace Strong con href/texto distintos: {m.group(0)}")
    bible_links = sum(e["content"].count('class="bible"') for e in entries)
    print(f"  {book_id} ({book_name}): {len(entries)} unidades, "
          f"{code_links} enlaces Strong ({greek_word_links} también sobre la palabra griega/hebrea), "
          f"{bible_links} enlaces bíblicos")
    # Verificación automática: todo código Strong presente en la fuente debe
    # haber terminado enlazado (revisión que Juan pidió correr siempre, no
    # solo cuando la pide explícitamente) y cada href debe coincidir con su
    # texto visible.
    if raw_strong_count != code_links:
        print(f"  *** AVISO: {book_id} tiene {raw_strong_count} códigos Strong en la fuente "
              f"pero solo {code_links} quedaron enlazados — revisar formato.")
    return book_id, book_name, entries


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--package",
        action="append",
        type=Path,
        help="Importa solo este paquete y conserva los demás libros del módulo. Repetible.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    targeted = bool(args.package)
    book_dirs = args.package if targeted else sorted(SOURCE_DIR.glob("Comentario_Exegetico_Verbo_*"))
    if not book_dirs:
        print(f"No se encontraron paquetes fuente en {SOURCE_DIR}")
        return

    manifest_path = MODULE_DIR / "manifest.json"
    if targeted and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        books_by_id = {book["id"]: book for book in manifest.get("books", [])}
    else:
        manifest = None
        books_by_id = {}
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
        # Al reemplazar un libro existente, se reinserta en el orden explícito
        # de --package; los libros no seleccionados conservan su orden actual.
        books_by_id.pop(book_id, None)
        books_by_id[book_id] = {"id": book_id, "name": book_name, "file": f"books/{book_id}.json"}

    # Limpia archivos huérfanos de libros que ya no están en la carpeta fuente
    # (ej. Juan sacó Efesios para reescribirlo) — sin esto quedarían servidos
    # datos viejos sin ninguna entrada en manifest.json que los referencie.
    if not targeted:
        current_ids = set(books_by_id)
        for stale in (MODULE_DIR / "books").glob("*.json"):
            stem_id = stale.stem.split(".")[0]
            if stem_id not in current_ids:
                stale.unlink()
                print(f"  (eliminado archivo huérfano: books/{stale.name})")

    if manifest is None:
        manifest = {
            "schemaVersion": 2,
            "id": "exegesis-verbo",
            "type": "commentary",
            "name": "Exegesis Verbo",
            "abbreviation": "Exegesis Verbo",
            "language": "es",
            "author": "Verbo",
            "description": "Comentario exegético académico de Verbo: contexto literario, histórico y lingüístico, análisis del idioma original, crítica textual e implicaciones teológicas por perícopa.",
            "license": "Todos los derechos reservados por Verbo.",
        }
    manifest["books"] = list(books_by_id.values())
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
