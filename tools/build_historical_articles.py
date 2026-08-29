#!/usr/bin/env python3
"""Extrae cartas históricas verificadas y genera páginas estáticas de Recursos.

Las fuentes se descargan fuera del repositorio y se pasan como texto OCR. La
salida versionada conserva el inglés histórico; el español se obtiene mediante
el traductor existente de Verbo (Worker + KV + localStorage).
"""
import argparse
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "recursos" / "articulos-y-reflexiones"
DATA = ROOT / "recursos" / "data" / "historical-articles.json"
SITEMAP = ROOT / "sitemap.xml"

NEWTON_SOURCE = "https://archive.org/details/cu31924029450982"
RUTHERFORD_SOURCE = "https://www.gutenberg.org/ebooks/42557"
PRINCETON_SOURCE = "https://commons.ptsem.edu/"

NEWTON = [
    ("newton-carta-whitford-oposicion", "the Rev. Mr. Whitford", "I", "Carta a Mr. Whitford", "Sobre soportar la oposición con el espíritu correcto", ["ministerio", "vida-cristiana"]),
    ("newton-carta-whitford-disputas", "the Rev. Mr. Whitford", "II", "Carta a Mr. Whitford", "Sobre la inutilidad y el peligro de las disputas religiosas", ["unidad", "vida-cristiana"]),
    ("newton-carta-wilberforce-afliccion", "Mrs. Wilberforce", "V", "Carta a Mrs. Wilberforce", "Sobre el beneficio espiritual de la aflicción", ["sufrimiento", "fe"]),
    ("newton-carta-cowper-dudas", "William Cowper, Esq.", "I", "Carta a William Cowper", "Sobre dudas y temores espirituales", ["fe", "seguridad-en-cristo"]),
    ("newton-carta-symonds-evidencias", "the Rev. Joshua Symonds", "II", "Carta a Rev. Joshua Symonds", "Sobre las evidencias del estado espiritual", ["fe", "vida-cristiana"]),
    ("newton-carta-place-oracion", "Mrs. Place", "I", "Carta a Mrs. Place", "Sobre la oración en tiempos peligrosos", ["oracion", "perseverancia"]),
    ("newton-carta-thornton-diferencias", "Mrs. Thornton", "I", "Carta a Mrs. Thornton", "Sobre la actitud hacia quienes piensan diferente", ["unidad", "vida-cristiana"]),
    ("newton-carta-thornton-compasion-jesus", "Mrs. Thornton", "II", "Carta a Mrs. Thornton", "Sobre la simpatía y compasión de Jesús", ["sufrimiento", "gracia"]),
    ("newton-carta-coffin-fe-sencilla", "the Rev. James Coffin and Mrs. Coffin", "II", "Carta a Rev. James y Mrs. Coffin", "Sobre la fe sencilla", ["fe", "gracia"]),
    ("newton-carta-coffin-deberes-ordinarios", "the Rev. James Coffin and Mrs. Coffin", "VI", "Carta a Rev. James y Mrs. Coffin", "Sobre servir a Dios en los deberes ordinarios de la vida", ["vida-cristiana", "perseverancia"]),
]

NEWTON_TITLE_MATCH = {
    "newton-carta-whitford-oposicion": "bearing opposition",
    "newton-carta-whitford-disputas": "religious disputation",
    "newton-carta-wilberforce-afliccion": "benefits of affliction",
    "newton-carta-cowper-dudas": "doubts and fears",
    "newton-carta-symonds-evidencias": "evidences of our spiritual state",
    "newton-carta-place-oracion": "prayer in perilous times",
    "newton-carta-thornton-diferencias": "right spirit toward those who differ",
    "newton-carta-thornton-compasion-jesus": "sympathy of jesus",
    "newton-carta-coffin-fe-sencilla": "simple faith",
    "newton-carta-coffin-deberes-ordinarios": "serving god in the ord",
}

RUTHERFORD = [
    ("rutherford-carta-3-lady-kenmure", "III", "Carta 3 a Lady Kenmure", "Sobre enfermedad y depresión espiritual", ["sufrimiento", "fe"], "devocional"),
    ("rutherford-carta-4-lady-kenmure", "IV", "Carta 4 a Lady Kenmure", "Sobre la muerte de su hija y el sufrimiento", ["sufrimiento", "esperanza"], "devocional"),
    ("rutherford-carta-13-marion-mnaught", "XIII", "Carta 13 a Marion M'Naught", "Sobre la paciencia frente al reproche", ["perseverancia", "vida-cristiana"], "reflexion"),
    ("rutherford-carta-19-lady-kenmure", "XIX", "Carta 19 a Lady Kenmure", "Sobre la fe y la inmutabilidad de Cristo", ["fe", "fidelidad-de-dios"], "devocional"),
    ("rutherford-carta-20-lady-kenmure", "XX", "Carta 20 a Lady Kenmure", "Sobre la seguridad del amor de Cristo durante las pruebas", ["sufrimiento", "seguridad-en-cristo"], "devocional"),
    ("rutherford-carta-23-lady-kenmure", "XXIII", "Carta 23 a Lady Kenmure", "Sobre la tribulación y la esperanza futura", ["sufrimiento", "esperanza"], "devocional"),
    ("rutherford-carta-29-marion-mnaught", "XXIX", "Carta 29 a Marion M'Naught", "Sobre Cristo con su pueblo en la aflicción", ["sufrimiento", "vida-en-cristo"], "devocional"),
    ("rutherford-carta-61-lady-kenmure", "LXI", "Carta 61 a Lady Kenmure", "Desde el destierro en Aberdeen", ["perseverancia", "sufrimiento"], "reflexion"),
    ("rutherford-carta-65-robert-gordon", "LXV", "Carta 65 a Robert Gordon", "Sobre cómo Dios sostiene durante el camino", ["fe", "perseverancia"], "devocional"),
    ("rutherford-carta-142-william-livingstone", "CXLII", "Carta 142 a William Livingstone", "Consejo espiritual a un joven", ["juventud", "vida-cristiana"], "reflexion"),
]


def clean_ocr(text: str) -> list[str]:
    text = text.replace("\r", "")
    text = re.sub(r"\n\s*\d+\s+Letters of Newton\.\s*\n", "\n", text, flags=re.I)
    text = re.sub(r"\n\s*To .{1,70}?\.\s+\d+\s*\n", "\n", text, flags=re.I)
    text = re.sub(r"\n\s*[A-Z]\s*\n", "\n", text)
    blocks = re.split(r"\n\s*\n", text.strip())
    paragraphs = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        joined = ""
        for line in lines:
            if joined.endswith("-") and line[:1].islower():
                joined = joined[:-1] + line
            else:
                joined += (" " if joined else "") + line
        joined = re.sub(r"\s+", " ", joined).strip()
        if joined:
            paragraphs.append(joined)
    return paragraphs


def clean_princeton_ocr(text: str) -> list[str]:
    """Normaliza el OCR de fascículos originales sin reescribir el texto."""
    text = text.replace("\r", "")
    text = re.sub(r"-\s*\n\s*(?=[a-z])", "", text)
    text = re.sub(r"(?m)^\s*(?:THE PRINCETON THEOLOGICAL REVIEW|CHRISTIANITY AND CULTURE)\s*$", "", text, flags=re.I)
    text = re.sub(r"(?m)^\s*\d{1,3}\s*$", "", text)
    paragraphs = clean_ocr(text)
    cleaned = []
    for paragraph in paragraphs:
        paragraph = re.sub(r"\s+([,.;:?!])", r"\1", paragraph)
        paragraph = paragraph.replace("WJE may", "We may").replace("T T thing", "thing")
        paragraph = paragraph.replace("A. tenement", "Atonement").replace("Prixcetox", "Princeton")
        paragraph = paragraph.replace("PRIXCETON", "PRINCETON").replace("TUE ", "THE ")
        cleaned.append(paragraph)
    return cleaned


def extract_princeton(path: Path, start: str, end: str) -> list[str]:
    text = path.read_text(encoding="utf-8")
    candidates = []
    for beginning in re.finditer(start, text, flags=re.I | re.S):
        closing = re.search(end, text[beginning.end():], flags=re.I | re.S)
        if closing:
            section = text[beginning.end():beginning.end() + closing.start()]
            # Descarta menciones del índice y capturas que atraviesan artículos.
            if 4_000 <= len(section) <= 100_000:
                candidates.append(section)
    if not candidates:
        raise RuntimeError(f"No se encontró el artículo de Princeton en {path}")
    # Los encabezados de página repiten el título; el tramo más largo es el
    # que empieza en el título editorial completo y termina en la firma.
    return clean_princeton_ocr(max(candidates, key=len))


def newton_segments(text: str) -> dict[tuple[str, str], tuple[str, list[str]]]:
    header = re.compile(
        r"\nTo\s+([^\n]{2,90})\s*\n\s*(?:L\w{3,8})\s+([IVXivxn]+)[.;]\s*[—-]\s*(.+?)\n\s*\n",
        re.I | re.S,
    )
    matches = list(header.finditer(text))
    result = {}
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        recipient = re.sub(r"\s+", " ", match.group(1)).strip().rstrip(".").lower()
        numeral = match.group(2).upper().replace("N", "II")
        body = text[match.end():end]
        result[(recipient, numeral)] = (match.group(3).strip(), clean_ocr(body))
    return result


def strip_rutherford_notes(section: str) -> str:
    # Quita notas del editor entre corchetes (incluidas las multilínea) y
    # marcadores de ilustración; conserva íntegra la carta del remitente.
    section = re.sub(r"\n\s*\[[^\]]+\]\s*", "\n", section, flags=re.S)
    section = re.sub(r"\[(\d+)\]", "", section)
    return section


def rutherford_segments(text: str) -> dict[str, list[str]]:
    header = re.compile(r"(?m)^([IVXLCDM]+)\.--")
    matches = list(header.finditer(text))
    result = {}
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        section = text[match.end():end]
        # El cuerpo comienza después del subtítulo editorial entre paréntesis.
        body_start = re.search(r"\n\(_[^\n]*(?:\n[^\n]*)*?_\)\s*\n", section)
        if not body_start:
            continue
        body = section[body_start.end():]
        dated_close = re.search(r"(?m)^  [A-Z][A-Z ]+, _[^_\n]+_\.\s*$", body)
        if dated_close:
            body = body[:dated_close.end()]
        body = strip_rutherford_notes(body)
        result[match.group(1)] = clean_ocr(body)
    return result


NEWTON_END = {
    "newton-carta-whitford-oposicion": r"I am, etc\.",
    "newton-carta-whitford-disputas": r"Yours, etc\.",
    "newton-carta-wilberforce-afliccion": r"John Newton\.",
    "newton-carta-cowper-dudas": r"Dear Sir, your affectionate servant\.",
    "newton-carta-symonds-evidencias": r"Yours, in the best bonds, etc\.",
    "newton-carta-place-oracion": r"I am, etc\.",
    "newton-carta-thornton-diferencias": r"I am, etc\.",
    "newton-carta-thornton-compasion-jesus": r"I am, etc\.",
    "newton-carta-coffin-fe-sencilla": r"December 28, 1793\.",
    "newton-carta-coffin-deberes-ordinarios": r"May 25, 1797\.\s+JoHN NeWTON\.",
}


def trim_newton(slug: str, paragraphs: list[str]) -> list[str]:
    text = "\n\n".join(paragraphs)
    match = re.search(NEWTON_END[slug], text, flags=re.I)
    if not match:
        raise RuntimeError(f"No se encontró el cierre de {slug}")
    text = text[:match.end()]
    if slug == "newton-carta-coffin-deberes-ordinarios":
        text = re.sub(r"^we can\.\s*", "", text, flags=re.I)
    # Nota biográfica de Josiah Bull intercalada por el OCR entre “Take
    # encouragement” y “hence to hope”; no forma parte de la carta.
    text = re.sub(r"♦ The whole subject is f.?villy discussed.*?285, and 364\.\s*", "", text, flags=re.I | re.S)
    fixes = {
        "Deae Sib": "Dear Sir", "Deab Sir": "Dear Sir", "Deae Sir": "Dear Sir",
        "coniidence": "confidence", "eitlier": "either", "BJave": "Have",
        "ask^": "ask", "JLord": "Lord", " Hve": " live", "o£": "of",
        "wiU": "will", "G-od": "God", "enoygh": "enough", "Indeedj": "Indeed,",
        " tbe ": " the ", "ministry'?": "ministry?", "Eom. viii": "Rom. viii",
        "Mohg,minedans": "Mohammedans", "tO'": "to", "Jias": "has",
        "vaxious": "various", "historieSj": "histories,", "areplain": "are plain",
        "JoHN NeWTON": "John Newton", "ordLaary": "ordinary", "^Prayer": "Prayer",
        "■": "", "Eom.": "Rom.",
    }
    for wrong, right in fixes.items():
        text = text.replace(wrong, right)
    return [p.strip() for p in text.split("\n\n") if p.strip()]


def html_page(item: dict) -> str:
    body = "\n\n".join(f"      <p>{html.escape(p)}</p>" for p in item["paragraphs"])
    source = html.escape(item["source_url"], quote=True)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(item['title_en'])} | Verbo</title>
<meta name="description" content="{html.escape(item['subtitle_es'])}. Texto histórico de dominio público.">
<link rel="canonical" href="https://verbobiblia.com/recursos/articulos-y-reflexiones/{item['id']}/">
<link rel="manifest" href="../../../biblia/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="../../../biblia/assets/icons/icon-192.png">
<meta name="theme-color" content="#7f2d35">
<link rel="stylesheet" href="../../../biblia/assets/style.css?v=20260730-rail-center">
<link rel="stylesheet" href="../../../recursos/assets/recursos.css?v=20260813-compact-catalog-headings">
</head>
<body class="static-page recursos-page">
  <header class="static-page__header">
    <a class="static-page__brand" href="../../../">Verbo</a>
    <div class="ui-lang-switcher" id="uiLangSwitcher" role="group" data-i18n-attr="aria-label:header.uiLangAria"><button type="button" class="ui-lang-switcher__btn" data-lang="es">ES</button><button type="button" class="ui-lang-switcher__btn" data-lang="en">EN</button></div>
    <a class="static-page__back" href="../">Artículos y Reflexiones</a>
  </header>
  <main class="static-page__main">
    <article data-author="{html.escape(item['author'])}" data-source-lang="en" data-i18n-strategy="auto" data-title-es="{html.escape(item['title_es'], quote=True)}" data-title-en="{html.escape(item['title_en'], quote=True)}" data-topics="{','.join(item['topics'])}" data-category="{item['category']}" data-subtype="{item['subtype']}" data-date-added="2026-08-10">
      <p class="article-badge">Artículos y Reflexiones · Documento histórico · {item['year_label']}</p>
      <h1>{html.escape(item['title_en'])}</h1>
      <p class="historical-editorial-subtitle"><span>Subtítulo editorial de Verbo:</span> {html.escape(item['subtitle_es'])}</p>

{body}

      <footer class="article-attribution">
        <p><span data-i18n="articleMeta.author">Author</span>: <strong>{html.escape(item['author'])}</strong></p>
        <p><span data-i18n="articleMeta.documentType">Document type</span>: {html.escape(item['document_type'])}</p>
        <p><span data-i18n="articleMeta.originalPublication">Original publication</span>: {html.escape(item['publication'])}</p>
        <p><span data-i18n="articleMeta.translation">Spanish translation</span>: Verbo (mediante la infraestructura de traducción del sitio)</p>
        <p><span data-i18n="articleMeta.historicalSource">Historical source</span>: <a href="{source}" rel="external noopener">{html.escape(item['source_label'])}</a></p>
      </footer>

      <hr>
      <p class="lesson-nav"><a href="../">Índice</a></p>
    </article>
  </main>
  <script src="../../../biblia/assets/i18n.js?v=20260729-shared-dict2"></script>
  <script src="../../../biblia/assets/site-translate.js?v=20260807-translate-worker"></script>
  <script src="../../../biblia/assets/content-translate.js?v=20260810-source-lang"></script>
  <script src="../../../biblia/assets/site-chrome.js?v=20260810-source-lang"></script>
</body>
</html>
'''


def update_sitemap(items: list[dict]) -> None:
    xml = SITEMAP.read_text(encoding="utf-8")
    blocks = []
    for item in items:
        url = f"https://verbobiblia.com/recursos/articulos-y-reflexiones/{item['id']}/"
        if f"<loc>{url}</loc>" in xml:
            continue
        blocks.append(
            "  <url>\n"
            f"    <loc>{url}</loc>\n"
            "    <lastmod>2026-08-10</lastmod>\n"
            "    <changefreq>yearly</changefreq>\n"
            "    <priority>0.5</priority>\n"
            "  </url>\n"
        )
    if blocks:
        xml = xml.replace("</urlset>", "".join(blocks) + "</urlset>")
        SITEMAP.write_text(xml, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--newton", type=Path)
    parser.add_argument("--rutherford", type=Path, required=True)
    parser.add_argument("--warfield-1903", type=Path)
    parser.add_argument("--vos-1903", type=Path)
    parser.add_argument("--vos-1906", type=Path)
    parser.add_argument("--machen-1913", type=Path)
    args = parser.parse_args()
    newton = newton_segments(args.newton.read_text(encoding="utf-8")) if args.newton else {}
    rutherford = rutherford_segments(args.rutherford.read_text(encoding="utf-8"))
    items = []
    for slug, recipient, numeral, title_es, subtitle, topics in (NEWTON if args.newton else []):
        needle = NEWTON_TITLE_MATCH[slug]
        candidates = [k for k, value in newton.items() if k[1] == numeral and needle in re.sub(r"\s+", " ", value[0]).lower()]
        if len(candidates) != 1:
            raise RuntimeError(f"No se pudo identificar Newton {recipient} {numeral}: {candidates}")
        key = candidates[0]
        editorial_heading, paragraphs = newton[key]
        editorial_heading = editorial_heading.replace("■", "").replace("ordLaary", "ordinary").replace("^Prayer", "Prayer")
        paragraphs = trim_newton(slug, paragraphs)
        items.append({"id": slug, "author": "John Newton", "title_es": title_es, "title_en": f"Letter to {recipient.replace('the Rev. ', 'Rev. ')}", "subtitle_es": subtitle, "topics": topics, "category": "devocional", "subtype": "devocional", "year_label": "siglo XVIII", "document_type": "Carta original", "publication": f"Carta conservada en la edición histórica de Josiah Bull; encabezado del editor: {editorial_heading}", "source_url": NEWTON_SOURCE, "source_label": "Cornell University Library / Internet Archive, cu31924029450982", "rights": "Dominio público; texto de la carta solamente", "paragraphs": paragraphs})
    for slug, numeral, title_es, subtitle, topics, subtype in RUTHERFORD:
        paragraphs = rutherford.get(numeral)
        if not paragraphs:
            raise RuntimeError(f"No se pudo identificar Rutherford {numeral}")
        items.append({"id": slug, "author": "Samuel Rutherford", "title_es": title_es, "title_en": title_es.replace("Carta", "Letter").replace(" a ", " to "), "subtitle_es": subtitle, "topics": topics, "category": "devocional", "subtype": subtype, "year_label": "siglo XVII", "document_type": "Carta original", "publication": f"Letter {numeral}, Letters of Samuel Rutherford, tercera edición, ed. Andrew A. Bonar", "source_url": RUTHERFORD_SOURCE, "source_label": "Project Gutenberg eBook 42557", "rights": "Public domain in the USA (Project Gutenberg)", "paragraphs": paragraphs})
    princeton_specs = [
        (args.warfield_1903, "warfield-modern-theories-atonement", "B. B. Warfield", "Modern Theories of the Atonement", "Teorías modernas de la expiación", "Sobre las teorías modernas de la expiación", ["teologia"], "1903", r"MODERN\s+THEORIES\s+OF\s+THE\s+ATONEMENT[^\n]*\n", r"B\.\s*B\.\s*Warfield\.\s*\n\s*Princeton\.", "Princeton Theological Review, vol. 1 (1903), pp. 571–592", "https://archive.org/details/princetontheolog1119arms"),
        (args.vos_1903, "vos-alleged-legalism-justification", "Geerhardus Vos", "The Alleged Legalism in Paul's Doctrine of Justification", "El supuesto legalismo en la doctrina paulina de la justificación", "Sobre la justificación paulina y la acusación de legalismo", ["teologia"], "1903", r"THE\s+ALLEGED\s+LEGALISM\s+IN\s+PAUL.S\s+DOC-?\s*TRINE\s+OF\s+JUSTIFICATION\.\s*", r"Geerhardus\s+Vos\.", "Princeton Theological Review, vol. 1, no. 2 (1903)", "https://archive.org/details/princetontheolog1219arms"),
        (args.vos_1906, "vos-faith-truthfulness-bible-history", "Geerhardus Vos", "Christian Faith and the Truthfulness of Bible History", "La fe cristiana y la veracidad de la historia bíblica", "Sobre la historicidad bíblica y la fe cristiana", ["apologetica", "historia-de-la-biblia"], "1906", r"CHRISTIAN\s+FAITH\s+AND\s+THE\s+TRUTHFULNESS\s+OF\s+BIBLE\s+HISTORY[^\n]*\n", r"Geerhardus\s+Vos\.", "Princeton Theological Review, vol. 4 (1906)", "https://archive.org/details/princetontheolog4319arms"),
        (args.machen_1913, "machen-christianity-and-culture", "J. Gresham Machen", "Christianity and Culture", "Cristianismo y cultura", "Sobre la fe cristiana, el conocimiento y la cultura", ["apologetica", "teologia"], "1913", r"CHRISTIANITY\s+AND\s+CULTURE\.\*\s*", r"Princeton\.\s*J\.\s*Gresham\s+Machen\.", "Princeton Theological Review, vol. 11 (1913), pp. 1–15", "https://archive.org/details/princetontheolog1111arms"),
    ]
    for path, slug, author, title_en, title_es, subtitle, topics, year, start, end, publication, source_url in princeton_specs:
        if not path:
            continue
        paragraphs = extract_princeton(path, start, end)
        items.append({"id": slug, "author": author, "title_es": title_es, "title_en": title_en, "subtitle_es": subtitle, "topics": topics, "category": "estudio", "subtype": "articulo", "year_label": year, "document_type": "Artículo académico", "publication": publication, "source_url": source_url, "source_label": "Princeton Theological Seminary / Internet Archive, fascículo histórico", "rights": "No Copyright - United States (Theological Commons)", "paragraphs": paragraphs})
    for item in items:
        if len(" ".join(item["paragraphs"])) < 500:
            raise RuntimeError(f"Texto sospechosamente corto: {item['id']}")
        d = OUT / item["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(html_page(item), encoding="utf-8")
    DATA.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_sitemap(items)
    newton_count = len(NEWTON) if args.newton else 0
    print(f"Históricos: {len(items)} documentos generados ({newton_count} Newton, {len(RUTHERFORD)} Rutherford, {len(items) - newton_count - len(RUTHERFORD)} Princeton).")


if __name__ == "__main__":
    main()
