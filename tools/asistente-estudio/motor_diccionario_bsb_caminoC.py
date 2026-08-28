#!/usr/bin/env python3
"""Fase 4 — Camino C: matching léxico conservador, local y auditable.

Prototipo aislado. Lee BSB y Easton/Smith, pero solo escribe JSON bajo
tools/asistente-estudio/data/. No usa Strong ni búsqueda semántica.

Principios:
- cada coincidencia debe señalar el versículo y las palabras que la activaron;
- las frases compuestas deben aparecer contiguas dentro de un versículo;
- las palabras de dos letras o menos nunca activan solas una entrada;
- la morfología se limita a transformaciones inglesas explícitas y reversibles;
- no se usa stemming Porter general, para impedir are->Areli, Levi->Levy y
  faith->Faithful.
"""

import argparse
import html
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
BSB_BOOKS_DIR = REPO_ROOT / "biblia" / "modules" / "bibles" / "bsb" / "books"
DICTIONARIES_DIR = REPO_ROOT / "biblia" / "modules" / "diccionarios"
OUTPUT = HERE / "data" / "motor-diccionario-caminoC.json"

sys.path.insert(0, str(HERE / "_vendor"))
from porter_stemmer import PorterStemmer  # noqa: E402

_overlap_stemmer = PorterStemmer()

WORD_RE = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)?")
TAG_RE = re.compile(r"<[^>]+>")

# Metadatos estructurales de los 66 libros. No son excepciones editoriales:
# permiten interpretar las referencias impresas dentro de Easton y Smith.
BOOK_ALIASES = {
    "GEN": ["Genesis", "Gen"], "EXO": ["Exodus", "Exod", "Ex"],
    "LEV": ["Leviticus", "Lev"], "NUM": ["Numbers", "Num"],
    "DEU": ["Deuteronomy", "Deut", "Dt"], "JOS": ["Joshua", "Josh"],
    "JDG": ["Judges", "Judg", "Jdg"], "RUT": ["Ruth", "Ruth"],
    "1SA": ["1 Samuel", "1 Sam", "1Sa"], "2SA": ["2 Samuel", "2 Sam", "2Sa"],
    "1KI": ["1 Kings", "1 Kgs", "1 Ki"], "2KI": ["2 Kings", "2 Kgs", "2 Ki"],
    "1CH": ["1 Chronicles", "1 Chron", "1 Chr"],
    "2CH": ["2 Chronicles", "2 Chron", "2 Chr"],
    "EZR": ["Ezra", "Ezr"], "NEH": ["Nehemiah", "Neh"],
    "EST": ["Esther", "Esth", "Est"], "JOB": ["Job"],
    "PSA": ["Psalms", "Psalm", "Ps"], "PRO": ["Proverbs", "Prov", "Pr"],
    "ECC": ["Ecclesiastes", "Eccl", "Ecc"],
    "SNG": ["Song of Solomon", "Song of Songs", "Canticles", "Song"],
    "ISA": ["Isaiah", "Isa"], "JER": ["Jeremiah", "Jer"],
    "LAM": ["Lamentations", "Lam"], "EZK": ["Ezekiel", "Ezek"],
    "DAN": ["Daniel", "Dan"], "HOS": ["Hosea", "Hos"],
    "JOL": ["Joel", "Joel"], "AMO": ["Amos", "Amos"],
    "OBA": ["Obadiah", "Obad"], "JON": ["Jonah", "Jon"],
    "MIC": ["Micah", "Mic"], "NAM": ["Nahum", "Nah"],
    "HAB": ["Habakkuk", "Hab"], "ZEP": ["Zephaniah", "Zeph"],
    "HAG": ["Haggai", "Hag"], "ZEC": ["Zechariah", "Zech"],
    "MAL": ["Malachi", "Mal"], "MAT": ["Matthew", "Matt", "Mt"],
    "MRK": ["Mark", "Mk"], "LUK": ["Luke", "Lk"],
    "JHN": ["John", "Jn"], "ACT": ["Acts", "Acts"],
    "ROM": ["Romans", "Roman", "Rom"],
    "1CO": ["1 Corinthians", "1 Cor", "1Co"],
    "2CO": ["2 Corinthians", "2 Cor", "2Co"],
    "GAL": ["Galatians", "Gal"], "EPH": ["Ephesians", "Eph"],
    "PHP": ["Philippians", "Phil"], "COL": ["Colossians", "Col"],
    "1TH": ["1 Thessalonians", "1 Thess", "1 Th"],
    "2TH": ["2 Thessalonians", "2 Thess", "2 Th"],
    "1TI": ["1 Timothy", "1 Tim", "1 Ti"],
    "2TI": ["2 Timothy", "2 Tim", "2 Ti"],
    "TIT": ["Titus", "Tit"], "PHM": ["Philemon", "Philem", "Phm"],
    "HEB": ["Hebrews", "Heb"], "JAS": ["James", "Jas"],
    "1PE": ["1 Peter", "1 Pet", "1 Pe"], "2PE": ["2 Peter", "2 Pet", "2 Pe"],
    "1JN": ["1 John", "1 Jn"], "2JN": ["2 John", "2 Jn"],
    "3JN": ["3 John", "3 Jn"], "JUD": ["Jude", "Jud"],
    "REV": ["Revelation", "Revelations", "Rev"],
}

ALIAS_TO_BOOK = {
    alias.lower(): book for book, aliases in BOOK_ALIASES.items() for alias in aliases
}
ALIAS_PATTERN = "|".join(
    re.escape(alias) for alias in sorted(ALIAS_TO_BOOK, key=len, reverse=True)
)
REFERENCE_RE = re.compile(
    rf"(?<![A-Za-z0-9])(?P<book>{ALIAS_PATTERN})\.?\s+"
    r"(?P<chapter>\d{1,3}):(?P<verse_start>\d{1,3})"
    r"(?:\s*[-–—]\s*(?:(?P<chapter_end>\d{1,3}):)?(?P<verse_end>\d{1,3}))?",
    re.IGNORECASE,
)

# Lista lingüística general, no editorial ni bíblica. Se usa exclusivamente
# para que artículos, pronombres y auxiliares no cuenten como prueba de acepción.
STOPWORDS = {
    "a", "about", "after", "again", "against", "all", "also", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "between",
    "both", "but", "by", "can", "could", "did", "do", "does", "doing", "down", "during",
    "each", "few", "for", "from", "further", "had", "has", "have", "having", "he",
    "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in",
    "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself",
    "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our",
    "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
    "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "will", "with", "would", "you", "your", "yours", "yourself", "yourselves",
}

PILOT = [
    ("ROM", 5, 1, 5, 11),
    ("HEB", 7, 1, 7, 10),
    ("GEN", 1, 1, 1, 5),
    ("DAN", 9, 1, 9, 27),
    ("PSA", 23, 1, 23, 6),
]


def tokens(text):
    return [m.group(0) for m in WORD_RE.finditer(text)]


def normalized(word):
    return word.lower().replace("’", "'")


def morphological_forms(word):
    """Formas conservadoras; no pretende ser un lematizador completo."""
    w = normalized(word)
    forms = {w}

    if w.endswith("ies") and len(w) > 4:
        forms.add(w[:-3] + "y")
    if w.endswith("es") and len(w) > 4:
        forms.add(w[:-2])
        forms.add(w[:-1])
    elif w.endswith("s") and len(w) > 4 and not w.endswith("ss"):
        forms.add(w[:-1])

    if w.endswith("ied") and len(w) > 4:
        forms.add(w[:-3] + "y")
    if w.endswith("ed") and len(w) > 4:
        base = w[:-2]
        forms.add(base)
        forms.add(base + "e")
        if len(base) > 2 and base[-1] == base[-2]:
            forms.add(base[:-1])

    if w.endswith("ing") and len(w) > 5:
        base = w[:-3]
        forms.add(base)
        forms.add(base + "e")
        if len(base) > 2 and base[-1] == base[-2]:
            forms.add(base[:-1])

    # Familia derivacional regular que motivó la comparación A/B.
    if w.endswith("ification") and len(w) > 9:
        forms.add(w[:-7] + "y")
    if w.endswith("ified") and len(w) > 6:
        forms.add(w[:-4] + "y")

    # Sustantivos de acción en -ation frente a verbos en -e. También recupera
    # el headword histórico mal escrito "Reconcilation" de Easton.
    if w.endswith("ation") and len(w) > 7:
        forms.add(w[:-5] + "e")

    return forms


def shared_morphological_forms(a, b):
    return sorted(morphological_forms(a) & morphological_forms(b))


def words_match(a, b):
    a_norm, b_norm = normalized(a), normalized(b)
    if a_norm == b_norm:
        return True, "exact"
    if min(len(a_norm), len(b_norm)) < 4:
        return False, None
    if morphological_forms(a) & morphological_forms(b):
        return True, "morphology"
    return False, None


def title_token_variants(title):
    """Devuelve órdenes plausibles del headword, incluida inversión por coma."""
    variants = []

    def add(text):
        value = tokens(text)
        key = tuple(normalized(x) for x in value)
        if value and key not in {tuple(normalized(x) for x in v) for v in variants}:
            variants.append(value)

    add(title)
    if "," in title:
        left, right = (part.strip() for part in title.split(",", 1))
        add(f"{right} {left}")
    return variants


def find_evidence(title_variants, verse_tokens):
    evidence = []
    for title_tokens in title_variants:
        if len(title_tokens) == 1 and len(normalized(title_tokens[0])) <= 2:
            continue
        width = len(title_tokens)
        for start in range(0, len(verse_tokens) - width + 1):
            surface = verse_tokens[start:start + width]
            kinds = []
            for expected, actual in zip(title_tokens, surface):
                matched, kind = words_match(expected, actual)
                if not matched:
                    break
                kinds.append(kind)
            else:
                evidence.append({
                    "texto": " ".join(surface),
                    "tipo": "exact" if all(k == "exact" for k in kinds) else "morphology",
                    "formaHeadword": " ".join(title_tokens),
                    "formasCompartidas": [
                        shared_morphological_forms(expected, actual)
                        for expected, actual in zip(title_tokens, surface)
                    ],
                })
    # Evita duplicados si el título original e invertido son iguales en la práctica.
    unique = []
    seen = set()
    for item in evidence:
        key = (item["texto"].lower(), item["tipo"], item["formaHeadword"].lower())
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def load_passage(book, chapter_start, verse_start, chapter_end, verse_end):
    data = json.loads((BSB_BOOKS_DIR / f"{book}.json").read_text(encoding="utf-8"))["chapters"]
    verses = []
    for chapter in range(chapter_start, chapter_end + 1):
        for verse_text, text in sorted(data[str(chapter)].items(), key=lambda x: int(x[0])):
            verse = int(verse_text)
            if chapter == chapter_start and verse < verse_start:
                continue
            if chapter == chapter_end and verse > verse_end:
                continue
            verses.append({"chapter": chapter, "verse": verse, "text": text, "tokens": tokens(text)})
    return verses


def plain_text(value):
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", value))).strip()


def significant_token_map(text_or_tokens, excluded_stems=frozenset()):
    source_tokens = tokens(text_or_tokens) if isinstance(text_or_tokens, str) else text_or_tokens
    result = {}
    for token in source_tokens:
        norm = normalized(token)
        if len(norm) < 4 or norm in STOPWORDS:
            continue
        stem = _overlap_stemmer.stem(norm)
        if stem in excluded_stems:
            continue
        result.setdefault(stem, set()).add(norm)
    return result


def lexical_overlap_evidence(entry, found, verses):
    """Busca prueba no tautológica en el versículo y una ventana ±1."""
    headword_stems = set()
    for variant in entry["titleVariants"]:
        headword_stems.update(significant_token_map(variant))
    definition_map = significant_token_map(entry["definition"], headword_stems)
    by_location = {(v["chapter"], v["verse"]): i for i, v in enumerate(verses)}
    evidence = []

    for item in found:
        index = by_location[(item["chapter"], item["verse"])]
        exact_map = significant_token_map(verses[index]["tokens"], headword_stems)
        window_tokens = []
        for nearby in verses[max(0, index - 1):min(len(verses), index + 2)]:
            window_tokens.extend(nearby["tokens"])
        window_map = significant_token_map(window_tokens, headword_stems)
        exact_shared = sorted(set(exact_map) & set(definition_map))
        window_shared = sorted(set(window_map) & set(definition_map))

        # Una coincidencia debe estar en el propio versículo y recibir apoyo
        # independiente de al menos otra raíz significativa en la ventana.
        if exact_shared and len(window_shared) >= 2:
            evidence.append({
                "chapter": item["chapter"],
                "verse": item["verse"],
                "raicesEnVersiculo": exact_shared,
                "raicesEnVentana": window_shared,
                "terminosContexto": {
                    stem: sorted(window_map[stem]) for stem in window_shared
                },
                "terminosDefinicion": {
                    stem: sorted(definition_map[stem]) for stem in window_shared
                },
            })
    return evidence


def extract_explicit_references(definition):
    references = []
    for match in REFERENCE_RE.finditer(definition):
        chapter_start = int(match.group("chapter"))
        verse_start = int(match.group("verse_start"))
        chapter_end = int(match.group("chapter_end") or chapter_start)
        verse_end = int(match.group("verse_end") or verse_start)
        # Si aparece un rango descendente sin capítulo final explícito, es más
        # seguro no interpretarlo que fabricar una cobertura.
        if chapter_end == chapter_start and verse_end < verse_start:
            continue
        references.append({
            "book": ALIAS_TO_BOOK[match.group("book").lower()],
            "chapterStart": chapter_start,
            "verseStart": verse_start,
            "chapterEnd": chapter_end,
            "verseEnd": verse_end,
            "texto": match.group(0),
        })
    return references


def reference_covers(reference, book, chapter, verse):
    if reference["book"] != book:
        return False
    point = (chapter, verse)
    return ((reference["chapterStart"], reference["verseStart"]) <= point
            <= (reference["chapterEnd"], reference["verseEnd"]))


def load_entries(folder, dictionary):
    raw = json.loads((DICTIONARIES_DIR / folder / "entries.json").read_text(encoding="utf-8"))
    entries = []
    for entry in raw["entries"]:
        definition = plain_text(entry.get("content") or entry.get("excerpt") or "")
        entries.append({
            "diccionario": dictionary,
            "id": entry["id"],
            "headword": entry["titulo"],
            "titleVariants": title_token_variants(entry["titulo"]),
            "definition": definition,
            "referencias": extract_explicit_references(definition),
        })
    return entries


def query_passage(spec, entries):
    book, cs, vs, ce, ve = spec
    verses = load_passage(*spec)
    grouped = {}
    lexical_grouped = {}
    decisions = []
    for entry in entries:
        found = []
        for verse in verses:
            for evidence in find_evidence(entry["titleVariants"], verse["tokens"]):
                found.append({
                    "chapter": verse["chapter"],
                    "verse": verse["verse"],
                    **evidence,
                })
        if not found:
            continue

        lexical_record = lexical_grouped.setdefault(entry["headword"], {
            "headword": entry["headword"], "fuentes": [], "evidencia": []
        })
        lexical_record["fuentes"].append({
            "diccionario": entry["diccionario"], "id": entry["id"]
        })
        for item in found:
            if item not in lexical_record["evidencia"]:
                lexical_record["evidencia"].append(item)

        matching_references = []
        for reference in entry["referencias"]:
            if any(reference_covers(reference, book, item["chapter"], item["verse"])
                   for item in found):
                matching_references.append(reference)

        # El solapamiento se conserva como diagnóstico auditable, pero no decide:
        # las pruebas mostraron que dos palabras compartidas todavía aceptan
        # acepciones genéricas (Names, Year, God). Precisión antes que cantidad.
        overlap_evidence = lexical_overlap_evidence(entry, found, verses)
        include = bool(matching_references)
        decision = {
            "terminos": sorted({item["texto"] for item in found}, key=str.lower),
            "headword": entry["headword"],
            "modulo": entry["diccionario"],
            "id": entry["id"],
            "versiculos": sorted({f"{book} {item['chapter']}:{item['verse']}" for item in found}),
            "evidenciaMorfologica": found,
            "evidenciaAcepcion": {
                "regla": (
                    "referencia_biblica_explicita_cubre_versiculo_candidato"
                ),
                "referenciasCoincidentes": matching_references,
                "solapamientoLexicoDiagnosticoNoDecisorio": overlap_evidence,
            },
            "decision": "incluir" if include else "excluir",
            "razon": (
                "La definición cita explícitamente el versículo candidato o un rango que lo contiene."
                if include else
                "La definición no cita explícitamente ninguno de los versículos que activaron el candidato."
            ),
        }
        decisions.append(decision)

        if include:
            record = grouped.setdefault(entry["headword"], {
                "headword": entry["headword"], "fuentes": [], "evidencia": []
            })
            record["fuentes"].append({
                "diccionario": entry["diccionario"],
                "id": entry["id"],
                "referenciasCoincidentes": matching_references,
            })
            for item in found:
                if item not in record["evidencia"]:
                    record["evidencia"].append(item)

    dictionary_entries = sorted(lexical_grouped.values(), key=lambda x: x["headword"].lower())
    strict_entries = sorted(grouped.values(), key=lambda x: x["headword"].lower())
    candidate_headwords = len({item["headword"] for item in decisions})
    return {
        "pasaje": {"book": book, "chapterStart": cs, "verseStart": vs,
                    "chapterEnd": ce, "verseEnd": ve},
        "totalCandidatosAntes": candidate_headwords,
        "totalDecisionesFuente": len(decisions),
        "totalIncluidosFuente": sum(d["decision"] == "incluir" for d in decisions),
        "totalExcluidosFuente": sum(d["decision"] == "excluir" for d in decisions),
        # Salida aprobada para Fase 5: candidatos léxicos auditables. No afirma
        # certeza de acepción; la futura UI los presentará como términos para explorar.
        "totalEntradasDiccionario": len(dictionary_entries),
        "entradasDiccionario": dictionary_entries,
        # Diagnóstico experimental conservado, pero NO consumido por el ensamblador.
        "diagnosticoAcepciones": {
            "totalEntradasConReferenciaExplicita": len(strict_entries),
            "entradasConReferenciaExplicita": strict_entries,
        },
        "decisiones": sorted(decisions, key=lambda x: (x["headword"].lower(), x["modulo"])),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="imprime JSON en lugar del resumen")
    parser.add_argument("--write", action="store_true", help=f"escribe {OUTPUT.relative_to(REPO_ROOT)}")
    args = parser.parse_args()

    entries = (
        load_entries("easton-bible-dictionary", "easton")
        + load_entries("smith-bible-dictionary", "smith")
    )
    output = {
        "_metadata": {
            "metodo": "matching lexico conservador por versiculo y validacion de acepcion por referencia explicita",
            "usaStrong": False,
            "usaSemantica": False,
            "decisionBinaria": True,
            "solapamientoLexicoDecisorio": False,
        },
        "resultados": [query_passage(spec, entries) for spec in PILOT],
    }

    serialized = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        OUTPUT.write_text(serialized, encoding="utf-8")
    if args.json:
        print(serialized, end="")
    else:
        for result in output["resultados"]:
            p = result["pasaje"]
            print(f"{p['book']} {p['chapterStart']}:{p['verseStart']}-{p['chapterEnd']}:{p['verseEnd']} "
                  f"[{result['totalEntradasDiccionario']} candidatos léxicos]")
            print(" | ".join(e["headword"] for e in result["entradasDiccionario"]))


if __name__ == "__main__":
    main()
