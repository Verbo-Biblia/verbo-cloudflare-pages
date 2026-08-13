#!/usr/bin/env python3
"""Extrae sermones históricos de dominio público y genera páginas estáticas
de la sección Sermones Históricos (recursos/sermones-historicos/).

Sección propia, separada de Artículos y Reflexiones (recursos/data/
historical-articles.json): solo sermones propiamente dichos van aquí, no
discursos ni bosquejos (ver PLAN-SERMONES-HISTORICOS.md §0.1).

Las fuentes se descargan fuera del repositorio y se pasan como texto plano
(Gutenberg) u OCR (Internet Archive) por argumento CLI. La salida versionada
conserva el inglés histórico; el español se obtiene mediante el traductor
existente de Verbo (Worker + KV + localStorage) -- este script NO traduce
nada, solo extrae y estructura el texto fuente en inglés.
"""
import argparse
import html
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "recursos" / "sermones-historicos"
DATA = ROOT / "recursos" / "data" / "sermones-historicos.json"
SITEMAP = ROOT / "sitemap.xml"

MOODY_SOURCE = "https://www.gutenberg.org/ebooks/33015"
MOODY_PUBLICATION = "The Overcoming Life, and Other Sermons (Fleming H. Revell Company, 1896)"

# (slug, encabezado real en el texto fuente, título ES, subtítulo editorial ES, temas)
MOODY = [
    ("moody-la-vida-victoriosa", "THE OVERCOMING LIFE.", "La vida victoriosa",
     "Sobre la fe que vence al mundo, a partir de 1 Juan 5", ["fe", "vida-cristiana"]),
    ("moody-frutos-del-arrepentimiento", "RESULTS OF TRUE REPENTANCE.", "Los frutos del arrepentimiento verdadero",
     "Sobre el arrepentimiento genuino y sus frutos visibles en la vida cristiana", ["santidad", "vida-cristiana"]),
    ("moody-la-sabiduria-verdadera", "TRUE WISDOM.", "La sabiduría verdadera",
     "Sobre la sabiduría que viene de Dios y conduce a otros a la justicia", ["evangelismo", "vida-cristiana"]),
    ("moody-entra-en-el-arca", '"COME THOU AND ALL THY HOUSE INTO THE ARK."', "Entra tú, y toda tu casa, en el arca",
     "Sobre el llamado de Dios a la familia entera, a partir del arca de Noé", ["familia", "fe"]),
    ("moody-humildad", "HUMILITY.", "Humildad",
     "Sobre la humildad como la lección más difícil de aprender de Cristo", ["santidad", "vida-cristiana"]),
    ("moody-descanso", "REST.", "Descanso",
     "Sobre el descanso que Cristo promete a los que vienen a Él", ["fe", "seguridad-en-cristo"]),
    ("moody-siete-yo-quiero-de-cristo", 'SEVEN "I WILLS" OF CHRIST.', "Los siete «yo quiero» de Cristo",
     "Sobre las siete promesas de Cristo que Él mismo se compromete a cumplir", ["fidelidad-de-dios", "fe"]),
]

# Título en inglés real de cada pieza (para title_en; el de "Overcoming Life"
# se arma con los 3 subtítulos de PART I/II/III que trae el texto fuente).
MOODY_TITLE_EN = {
    "moody-la-vida-victoriosa": "The Overcoming Life",
    "moody-frutos-del-arrepentimiento": "Results of True Repentance",
    "moody-la-sabiduria-verdadera": "True Wisdom",
    "moody-entra-en-el-arca": '"Come Thou and All Thy House Into the Ark"',
    "moody-humildad": "Humility",
    "moody-descanso": "Rest",
    "moody-siete-yo-quiero-de-cristo": 'Seven "I Wills" of Christ',
}

EDWARDS_SOURCE = "https://www.gutenberg.org/ebooks/34632"
EDWARDS_PUBLICATION = "Selected Sermons of Jonathan Edwards, ed. H. Norman Gardiner (1904)"

# (slug, numeral romano del cuerpo fuente, título ES, título EN -- forma
# breve tradicional, no siempre el título largo real del cuerpo --, subtítulo
# editorial ES, año de predicación, temas)
EDWARDS = [
    ("edwards-dios-glorificado-dependencia-hombre", "I", "Dios es glorificado en la dependencia del hombre",
     "God Glorified in Man's Dependence",
     "Sobre la absoluta dependencia del hombre redimido en Dios para toda su salvación, a partir de 1 Corintios 1",
     "1731", ["gracia", "vida-cristiana"]),
    ("edwards-una-luz-divina-y-sobrenatural", "II", "Una luz divina y sobrenatural",
     "A Divine and Supernatural Light",
     "Sobre la luz espiritual que solo el Espíritu de Dios puede dar al alma, distinta de todo conocimiento natural",
     "1733", ["fe", "vida-cristiana"]),
    ("edwards-la-resolucion-de-rut", "III", "La resolución de Rut",
     "Ruth's Resolution",
     "Sobre la decisión de Rut de permanecer fiel a Noemí y al Dios de Israel, como ejemplo de conversión genuina",
     "1735", ["fe", "perseverancia"]),
    ("edwards-las-muchas-moradas", "IV", "Las muchas moradas",
     "The Many Mansions",
     "Sobre las muchas moradas que Cristo ha ido a preparar para los suyos, a partir de Juan 14",
     "1737", ["esperanza", "seguridad-en-cristo"]),
    ("edwards-pecadores-en-manos-de-un-dios-airado", "V", "Pecadores en manos de un Dios airado",
     "Sinners in the Hands of an Angry God",
     "El sermón más célebre de Edwards, sobre la ira de Dios contra el pecado y la urgencia del arrepentimiento",
     "1741", ["santidad", "fe"]),
    ("edwards-una-vara-fuerte-quebrada-y-marchita", "VI", "Una vara fuerte quebrada y marchita",
     "A Strong Rod Broken and Withered",
     "Sobre la muerte de los ministros piadosos como juicio de Dios sobre un pueblo",
     "1748", ["ministerio", "sufrimiento"]),
    ("edwards-un-sermon-de-despedida", "VII", "Un sermón de despedida",
     "A Farewell Sermon",
     "El último sermón de Edwards a la congregación de Northampton, predicado tras su destitución como pastor",
     "1750", ["ministerio", "perseverancia"]),
]


def clean_plain_text(text: str) -> list[str]:
    """Texto plano de Gutenberg: reune líneas envueltas en párrafos, sin
    artefactos de OCR que limpiar. Quita los subrayados de énfasis (_..._)
    del texto fuente sin convertirlos a <em>, igual de simple que el resto
    de piezas históricas ya publicadas."""
    text = text.replace("\r", "")
    blocks = re.split(r"\n\s*\n", text.strip())
    paragraphs = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        joined = " ".join(lines)
        joined = re.sub(r"\s+", " ", joined).strip()
        joined = joined.replace("_", "")
        if joined:
            paragraphs.append(joined)
    return paragraphs


def moody_segments(text: str) -> dict[str, list[str]]:
    """Segmenta el texto fuente (ya recortado a la sección de sermones, sin
    la tabla de contenidos) por los encabezados reales, en el orden en que
    aparecen. 'The Overcoming Life' incluye sus 3 partes (PART I/II/III)
    dentro del mismo encabezado principal: se conserva como un solo sermón,
    tal como fue publicado (una sola dirección continua en 3 lecturas), en
    vez de partirlo en piezas separadas."""
    headers = [h for _, h, *_ in MOODY]
    starts = []
    for header in headers:
        match = re.search(re.escape(header), text)
        if not match:
            raise RuntimeError(f"No se encontró el encabezado de cuerpo para: {header!r}")
        starts.append((header, match.start(), match.end()))
    starts.sort(key=lambda p: p[1])
    result = {}
    for i, (header, _start, body_start) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else None
        body = text[body_start:end] if end else text[body_start:]
        result[header] = clean_plain_text(body)
    return result


EDWARDS_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"]


def edwards_segments(text: str) -> dict[str, list[str]]:
    """Segmenta por numeral romano solo en su línea (patrón real del texto
    fuente: numeral, línea en blanco, título en mayúsculas terminado en el
    marcador de nota '°', línea en blanco, cita bíblica, cuerpo). El título
    real del cuerpo no siempre coincide con el título breve de la tabla de
    contenidos (ej. el sermón II es "A Divine and Supernatural Light,
    Immediately Imparted..." en el cuerpo, "The Reality of Spiritual Light"
    en la tabla de contenidos) -- por eso EDWARDS_TITLE_EN usa la forma breve
    tradicional en vez de repetir el título largo del cuerpo, y este
    segmentador ubica el sermón por numeral, no por texto de título."""
    pattern = re.compile(r"(?m)^(" + "|".join(EDWARDS_NUMERALS) + r")$\n")
    matches = list(pattern.finditer(text))
    notes_match = re.search(r"(?m)^NOTES$", text)
    notes_start = notes_match.start() if notes_match else len(text)
    result = {}
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else notes_start
        chunk = text[start:end]
        title_end = re.search(r"^.*°\s*$", chunk, re.M)
        body = chunk[title_end.end():] if title_end else chunk
        result[match.group(1)] = clean_plain_text(body)
    return result


WESLEY_SOURCE = "https://www.gutenberg.org/ebooks/59743"
WESLEY_PUBLICATION = "The Works of the Rev. John Wesley, Vol. 1 (of 32): Sermons on Several Occasions (1746)"

# (slug, numeral romano del cuerpo fuente, título ES, título EN, subtítulo
# editorial ES, año -- fecha real de predicación tomada de las notas al pie
# del propio libro cuando existe; si el sermón no trae nota de fecha (V, VI)
# se usa el año de publicación del volumen -- temas)
WESLEY = [
    ("wesley-salvacion-por-fe", "I", "Salvación por fe", "Salvation by Faith",
     "El primer sermón publicado de Wesley: la salvación como don gratuito de Dios, recibido por gracia mediante la fe, a partir de Efesios 2",
     "1738", ["gracia", "fe"]),
    ("wesley-el-casi-cristiano", "II", "El casi cristiano", "The Almost Christian",
     "Sobre la diferencia entre una religión de apariencia y la fe genuina que salva, a partir de Hechos 26",
     "1741", ["vida-cristiana", "fe"]),
    ("wesley-cristianismo-biblico", "IV", "Cristianismo bíblico", "Scriptural Christianity",
     "Sobre la obra visible del Espíritu Santo en la vida cristiana genuina, a partir de Hechos 4",
     "1744", ["santidad", "vida-cristiana"]),
    ("wesley-justificacion-por-fe", "V", "Justificación por fe", "Justification by Faith",
     "Sobre cómo el pecador es justificado delante de Dios únicamente por la fe, a partir de Romanos 4",
     "1746", ["gracia", "fe"]),
    ("wesley-la-justicia-de-la-fe", "VI", "La justicia de la fe", "The Righteousness of Faith",
     "Sobre la diferencia entre la justicia de la ley y la justicia que viene por la fe, a partir de Romanos 10",
     "1746", ["gracia", "fe"]),
]

WESLEY_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
                    "XI", "XII", "XIII", "XIV", "XV", "XVI"]


def wesley_segments(text: str) -> dict[str, list[str]]:
    """Segmenta el texto fuente (ya recortado a la sección de cuerpo, después
    de la tabla de contenidos) por encabezados reales 'SERMON <numeral>.'
    (a veces con marcador de nota '[n]'). Se buscan los 16 encabezados reales
    del volumen, no solo los 5 que se extraen, para que los límites de cada
    segmento sean correctos aunque se descarten los sermones intermedios no
    usados (III, VII en adelante)."""
    pattern = re.compile(r"(?m)^\s*SERMON\s+(" + "|".join(WESLEY_NUMERALS) + r")\.(?:\[\d+\])?\s*$")
    matches = list(pattern.finditer(text))
    result = {}
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        result[match.group(1)] = clean_plain_text(text[start:end])
    return result


WHITEFIELD_SOURCE = "https://www.gutenberg.org/ebooks/77041"
WHITEFIELD_PUBLICATION = "The Works of the Reverend George Whitefield, M.A., Vol. 6 (of 6): Containing all his Sermons and Tracts (1772)"

# (slug, numeral romano del cuerpo fuente, título ES, título EN, subtítulo
# editorial ES, año -- solo LVII trae fecha real en el propio texto (predicado
# en Georgia, 28 ene. 1770); los demás no traen fecha de predicación en esta
# edición, se usa "siglo XVIII" igual que Newton/Rutherford para piezas sin
# fecha documentada -- temas)
WHITEFIELD = [
    ("whitefield-el-deber-de-escudrinar-las-escrituras", "XXXVII", "El deber de escudriñar las Escrituras", "The Duty of Searching the Scriptures",
     "Sobre la obligación de todo cristiano de examinar la Escritura por sí mismo en vez de conformarse con lo que otros le enseñan, a partir de Juan 5",
     "siglo XVIII", ["fe", "vida-cristiana"]),
    ("whitefield-la-conversion-de-saulo", "XLI", "La conversión de Saulo", "Saul's Conversion",
     "Sobre la conversión repentina y radical de Saulo de Tarso como evidencia del poder transformador de Cristo, a partir de Hechos 9",
     "siglo XVIII", ["gracia", "fe"]),
    ("whitefield-el-casi-cristiano", "XLIII", "El casi cristiano", "The Almost Christian",
     "Uno de los sermones más conocidos de Whitefield, sobre la diferencia entre una religión de apariencia y la fe genuina que salva, a partir de Hechos 26",
     "siglo XVIII", ["fe", "vida-cristiana"]),
    ("whitefield-sobre-la-regeneracion", "XLIX", "Sobre la regeneración", "On Regeneration",
     "Sobre el nuevo nacimiento como obra sobrenatural de Dios, indispensable para la vida cristiana genuina, a partir de 2 Corintios 5",
     "siglo XVIII", ["gracia", "vida-cristiana"]),
    ("whitefield-el-dia-de-las-pequeneces", "LVII", "El día de las pequeñeces", "Preached before the Governor, and Council, and the House of Assembly, in, Georgia, on January 28, 1770",
     "Uno de los últimos sermones de Whitefield, predicado ante las autoridades de Georgia meses antes de morir, sobre no despreciar los comienzos pequeños de la obra de Dios, a partir de Zacarías 4",
     "1770", ["fidelidad-de-dios", "perseverancia"]),
]

WHITEFIELD_NUMERALS = ["XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL",
                        "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L",
                        "LI", "LII", "LIII", "LIV", "LV", "LVI", "LVII", "LVIII", "LIX"]


def whitefield_segments(text: str) -> dict[str, list[str]]:
    """Segmenta por encabezados reales 'SERMON <numeral>.' solos en su línea
    (mismo patrón que Wesley). Este tomo mezcla la tabla de contenidos (cada
    entrada como '⭘ SERMON <numeral>. <Título>.', con título en la misma
    línea) con los encabezados de cuerpo reales (solo 'SERMON <numeral>.',
    nada más en la línea) -- el regex exige fin de línea justo después del
    punto, así que solo matchea los encabezados de cuerpo, nunca la tabla de
    contenidos, sin necesidad de recortar el texto de antemano. Se buscan los
    28 numerales reales del volumen (XXXII a LIX), no solo los 5 que se
    extraen, para que los límites de cada segmento sean correctos aunque se
    descarten los sermones intermedios no usados."""
    pattern = re.compile(r"(?m)^\s*SERMON\s+(" + "|".join(WHITEFIELD_NUMERALS) + r")\.\s*$")
    matches = list(pattern.finditer(text))
    result = {}
    for i, match in enumerate(matches):
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        result[match.group(1)] = clean_plain_text(text[start:end])
    return result


RYLE_SOURCE = "https://archive.org/details/thechristianrace00ryleuoft"
RYLE_PUBLICATION = "The Christian Race, and Other Sermons, ed. T. J. Madden (Hodder and Stoughton, 1900)"

# (slug, título ES, título EN, subtítulo editorial ES, temas). El OCR de
# Internet Archive es mucho más ruidoso que el texto plano de Gutenberg: los
# encabezados de sermón no siguen un patrón uniforme (a veces numeral+título
# fusionados en una sola línea de "párrafo", a veces en líneas separadas;
# "?" a veces se lee "1"; "REGENERATION (I)" se lee "REGENERATION (If}").
# Por eso, a diferencia de Moody/Edwards/Wesley/Whitefield, acá no hay una
# sola función de segmentación genérica: cada uno de los 5 sermones elegidos
# usa un ancla de inicio y de fin encontrada a mano contra el archivo real
# (ver RYLE_BOUNDS) -- un intento inicial con detección genérica de "próximo
# encabezado" confundió encabezados con dígitos pegados (números de página,
# "?" leído como "1") con contenido normal, y terminó mezclando texto de dos
# sermones distintos en un mismo segmento. Priorizar 5 sermones exactos y
# bien delimitados sobre una función reutilizable para este tomo en particular.
RYLE = [
    ("ryle-un-corazon-malo", "Un corazón malo", "A Bad Heart",
     "Sobre el engaño y la maldad del corazón humano, y el único remedio para ello, a partir de Jeremías 17",
     ["santidad", "gracia"]),
    ("ryle-fe-salvadora", "Fe salvadora", "Saving Faith",
     "Sobre la fe verdadera que salva, distinta de un mero asentimiento intelectual, a partir de Juan 3:16",
     ["fe", "gracia"]),
    ("ryle-la-carrera-cristiana", "La carrera cristiana", "The Christian Race",
     "El sermón que da título al volumen, sobre correr con paciencia la carrera puesta delante de nosotros, a partir de Hebreos 12",
     ["perseverancia", "vida-cristiana"]),
    ("ryle-que-pensais-de-cristo", "¿Qué pensáis de Cristo?", "What Think Ye of Christ?",
     "Un llamado directo a examinar la propia opinión sobre la persona de Cristo, a partir de Mateo 22",
     ["evangelismo", "fe"]),
    ("ryle-el-cristo-inmutable", "El Cristo inmutable", "The Unchanging Christ",
     "Sobre la inmutabilidad de Cristo como fundamento de consuelo y seguridad para el creyente, a partir de Hebreos 13",
     ["seguridad-en-cristo", "fidelidad-de-dios"]),
]

# (slug, regex de inicio, regex de fin -- se busca la primera ocurrencia de
# cada patrón sin dígitos cerca, para no confundir con encabezados de página
# repetidos que sí llevan número de página pegado)
RYLE_BOUNDS = {
    "ryle-un-corazon-malo": (r"A\s+BAD\s+HEART", r"REGENERATION"),
    "ryle-fe-salvadora": (r"V\s*\n\s*SAVING\s+FAITH", r"VI\s*\n\s*\"\s*COME\s+UNTO\s+ME\s*\""),
    "ryle-la-carrera-cristiana": (r"XII\s*\n\s*THE\s+CHRISTIAN\s+RACE", r"XIII\s*\n\s*\"WHAT\s+THINK\s+YE\s+OF\s+CHRIST\s+1\"?"),
    "ryle-que-pensais-de-cristo": (r"XIII\s*\n\s*\"WHAT\s+THINK\s+YE\s+OF\s+CHRIST\s+1\"?", r"XIV\s*\n\s*THE\s+UNCHANGING\s+CHRIST"),
    "ryle-el-cristo-inmutable": (r"XIV\s*\n\s*THE\s+UNCHANGING\s+CHRIST", r"XV\s*\n\s*THE\s+SECOND\s+ADVENT"),
}


def _norm_title(s: str) -> str:
    s = re.sub(r"[^A-Za-z ]", "", s).upper()
    return re.sub(r"\s+", " ", s).strip()


def _strip_numeral(p: str) -> str:
    return re.sub(r"^[IVXLCDM]+\.?\s+", "", p.strip())


def _is_ryle_junk(p: str, title_en: str) -> bool:
    """Descarta encabezados de página repetidos (con número de página pegado)
    y fragmentos de OCR demasiado cortos para ser un párrafo real -- nunca
    descarta contenido real del sermón, que siempre son oraciones largas."""
    if len(p) < 15:
        return True
    if len(p) > 60:
        return False
    if re.search(r"\d", p):
        return True
    return _norm_title(_strip_numeral(p)) == _norm_title(title_en)


def ryle_segments(text: str) -> dict[str, list[str]]:
    body_start = re.search(r"A\s+BAD\s+HEART", text[5000:])
    if not body_start:
        raise RuntimeError("No se encontró el inicio del cuerpo de Ryle (tras la tabla de contenidos)")
    body = text[5000 + body_start.start():]
    result = {}
    for slug, title_es, title_en, subtitle, topics in RYLE:
        start_pat, end_pat = RYLE_BOUNDS[slug]
        m_start = re.search(start_pat, body)
        if not m_start:
            raise RuntimeError(f"No se encontró el inicio de Ryle {slug!r}: {start_pat!r}")
        # Los patrones de fin ya son suficientemente específicos (numeral
        # romano + título, o "REGENERATION" sola) -- el chequeo de "sin
        # dígitos cerca" solo hace falta para descartar encabezados de
        # página repetidos ADYACENTES al match, nunca para dígitos que son
        # parte del propio patrón buscado (ej. el "1" que reemplaza el "?"
        # de "WHAT THINK YE OF CHRIST" en el OCR).
        m_end = None
        for m in re.finditer(end_pat, body[m_start.end():], re.I):
            abs_pos = m_start.end() + m.start()
            before = body[max(0, abs_pos - 15):abs_pos]
            after_start = abs_pos + len(m.group(0))
            after = body[after_start:after_start + 15]
            if not re.search(r"\d", before) and not re.search(r"\d", after):
                m_end = m
                break
        if not m_end:
            raise RuntimeError(f"No se encontró el fin de Ryle {slug!r}: {end_pat!r}")
        raw = body[m_start.end():m_start.end() + m_end.start()]
        paragraphs = [p for p in clean_plain_text(raw) if not _is_ryle_junk(p, title_en)]
        result[slug] = paragraphs
    return result


SPURGEON_VOL_SOURCE = {
    1: "https://archive.org/details/SpurgeonNewParkPt01",
    2: "https://archive.org/details/SpurgeonNewParkPt02",
    3: "https://archive.org/details/SpurgeonNewParkPt03",
}
SPURGEON_VOL_LABEL = {
    1: "Internet Archive, SpurgeonNewParkPt01",
    2: "Internet Archive, SpurgeonNewParkPt02",
    3: "Internet Archive, SpurgeonNewParkPt03",
}
SPURGEON_VOL_PUBLICATION = {
    1: "The New Park Street Pulpit, vol. I (1855)",
    2: "The New Park Street Pulpit, vol. II (1856)",
    3: "The New Park Street Pulpit, vol. III (1856-1857)",
}

# (número de sermón, volumen, slug, título ES, subtítulo editorial ES, año, temas).
# Selección de 31 sermones de los volúmenes I-III de New Park Street Pulpit
# (de un corpus real de 3.563 -- ver PENDIENTES-URGENTES.md para lo que falta).
# Cada uno fue verificado individualmente contra el texto fuente real: el
# primer párrafo extraído coincide con la cita bíblica exacta de la
# referencia del título -- un primer intento de segmentación genérica
# ("todo número+título+referencia que aparece en su propia línea marca un
# sermón nuevo") producía núcleos de sermón mezclados con el contenido del
# sermón SIGUIENTE cuando la numeración de la OCR saltaba números (varios
# sermones de cada volumen no tienen encabezado de página reconocible, y la
# heurística genérica los "absorbía" dentro del sermón anterior). La lista
# de abajo usa solo sermones donde el número siguiente detectado en el
# volumen es exactamente número+1 (frontera de página confirmada, sin
# huecos) -- ver spurgeon_segments() para el detalle técnico.
SPURGEON = [
    (1, 1, "spurgeon-la-inmutabilidad-de-dios", "La inmutabilidad de Dios", "Sobre la constancia del carácter de Dios como fundamento de toda esperanza, a partir de Malaquías 3:6", "1855", ["teologia", "fidelidad-de-dios"]),
    (15, 1, "spurgeon-la-biblia", "La Biblia", "Sobre la Escritura como la ley de Dios entregada por escrito, a partir de Oseas 8:12", "1855", ["fe", "teologia"]),
    (18, 1, "spurgeon-la-tumba-de-jesus", "La tumba de Jesús", "Sobre la resurrección de Cristo y el sepulcro vacío, a partir de Mateo 28:6", "1855", ["esperanza", "fe"]),
    (24, 1, "spurgeon-el-perdon", "El perdón", "Sobre el perdón de Dios que borra las transgresiones por amor de sí mismo, a partir de Isaías 43:25", "1855", ["gracia", "fe"]),
    (27, 1, "spurgeon-el-nombre-eterno", "El nombre eterno", "Sobre la permanencia del nombre de Cristo por todas las generaciones, a partir del Salmo 72:17", "1855", ["fidelidad-de-dios", "esperanza"]),
    (34, 1, "spurgeon-predicar-el-evangelio", "Predicar el evangelio", "Sobre la necesidad ineludible que siente el predicador de anunciar el evangelio, a partir de 1 Corintios 9:16", "1855", ["predicacion", "evangelismo"]),
    (35, 1, "spurgeon-el-pueblo-de-dios-en-el-horno", "El pueblo de Dios en el horno", "Sobre la aflicción como el horno donde Dios escoge y purifica a los suyos, a partir de Isaías 48:10", "1855", ["sufrimiento", "fidelidad-de-dios"]),
    (37, 1, "spurgeon-ley-y-gracia", "Ley y gracia", "Sobre cómo la ley expone el pecado mientras la gracia sobreabunda, a partir de Romanos 5:20", "1855", ["gracia", "teologia"]),
    (43, 1, "spurgeon-la-muerte-del-cristiano", "La muerte del cristiano", "Sobre la muerte del creyente como una siega en sazón, a partir de Job 5:26", "1855", ["esperanza", "sufrimiento"]),
    (47, 1, "spurgeon-la-oracion-de-cristo-por-los-suyos", "La oración de Cristo por los suyos", "Sobre la intercesión de Jesús para que los suyos sean guardados del mal en medio del mundo, a partir de Juan 17:15", "1855", ["oracion", "seguridad-en-cristo"]),
    (48, 1, "spurgeon-la-disciplina-de-dios", "La disciplina de Dios", "Sobre la disciplina paternal de Dios hacia sus hijos, a partir de Hebreos 12:5", "1855", ["santidad", "sufrimiento"]),
    (52, 1, "spurgeon-el-libre-albedrio-un-esclavo", "El libre albedrío: un esclavo", "Sobre la incapacidad moral del hombre caído para venir a Cristo por sí mismo, a partir de Juan 5:40", "1855", ["gracia", "teologia"]),
    (54, 2, "spurgeon-cristo-nuestra-pascua", "Cristo, nuestra Pascua", "Sobre Cristo como el Cordero pascual sacrificado por nosotros, a partir de 1 Corintios 5:7", "1856", ["gracia", "teologia"]),
    (60, 2, "spurgeon-soberania-y-salvacion", "Soberanía y salvación", "Sobre el llamado universal a mirar a Dios y ser salvos, a partir de Isaías 45:22", "1856", ["evangelismo", "gracia"]),
    (70, 2, "spurgeon-buenas-obras", "Buenas obras", "Sobre el propósito de la redención: un pueblo celoso de buenas obras, a partir de Tito 2:14", "1856", ["santidad", "vida-cristiana"]),
    (76, 2, "spurgeon-misiones-del-evangelio", "Misiones del evangelio", "Sobre la expansión de la Palabra del Señor por toda la región, a partir de Hechos 13:49", "1856", ["evangelismo", "predicacion"]),
    (84, 2, "spurgeon-salvacion-hasta-lo-sumo", "Salvación hasta lo sumo", "Sobre la intercesión perpetua de Cristo que salva completamente a los que se acercan a Dios por él, a partir de Hebreos 7:25", "1856", ["gracia", "seguridad-en-cristo"]),
    (85, 2, "spurgeon-la-omnisciencia-de-dios", "La omnisciencia de Dios", "Sobre Dios que todo lo ve, a partir de Génesis 16:13", "1856", ["teologia", "santidad"]),
    (88, 2, "spurgeon-el-ruego-de-la-fe", "El ruego de la fe", "Sobre la oración que toma a Dios por su propia palabra, a partir de 2 Samuel 7:25", "1856", ["oracion", "fe"]),
    (93, 2, "spurgeon-dios-en-el-pacto", "Dios en el pacto", "Sobre la promesa de Dios de ser el Dios de su pueblo en el nuevo pacto, a partir de Jeremías 31:33", "1856", ["fidelidad-de-dios", "teologia"]),
    (95, 2, "spurgeon-el-dia-de-la-expiacion", "El día de la expiación", "Sobre el estatuto perpetuo de la expiación como sombra de la obra de Cristo, a partir de Levítico 16:34", "1856", ["teologia", "gracia"]),
    (97, 2, "spurgeon-orgullo-y-humildad", "Orgullo y humildad", "Sobre cómo la soberbia precede a la destrucción y la humildad precede a la honra, a partir de Proverbios 18:12", "1856", ["santidad", "vida-cristiana"]),
    (103, 2, "spurgeon-cristo-en-el-pacto", "Cristo en el pacto", "Sobre Cristo dado como pacto para el pueblo, a partir de Isaías 49:8", "1856", ["fidelidad-de-dios", "gracia"]),
    (104, 2, "spurgeon-la-demostracion-del-amor-de-dios", "La demostración del amor de Dios", "Sobre cómo Dios demuestra su amor en que Cristo murió por nosotros siendo aún pecadores, a partir de Romanos 5:8", "1856", ["gracia", "seguridad-en-cristo"]),
    (114, 3, "spurgeon-el-evangelio-predicado-a-los-pobres", "El evangelio predicado a los pobres", "Sobre las buenas nuevas anunciadas a los pobres como señal mesiánica, a partir de Mateo 11:5", "1856", ["evangelismo", "predicacion"]),
    (118, 3, "spurgeon-el-derramamiento-de-sangre", "El derramamiento de sangre", "Sobre la necesidad del derramamiento de sangre para la remisión de los pecados, a partir de Hebreos 9:22", "1857", ["gracia", "teologia"]),
    (126, 3, "spurgeon-justificacion-por-gracia", "Justificación por gracia", "Sobre la justificación gratuita del pecador por la gracia mediante la redención en Cristo, a partir de Romanos 3:24", "1857", ["gracia", "teologia"]),
    (127, 3, "spurgeon-resurreccion-espiritual", "Resurrección espiritual", "Sobre el nuevo nacimiento como resurrección de la muerte espiritual, a partir de Efesios 2:1", "1857", ["gracia", "vida-cristiana"]),
    (130, 3, "spurgeon-la-regeneracion", "La regeneración", "Sobre la necesidad absoluta de nacer de nuevo para ver el reino de Dios, a partir de Juan 3:3", "1857", ["gracia", "vida-cristiana"]),
    (143, 3, "spurgeon-un-predicador-de-entre-los-muertos", "Un predicador de entre los muertos", "Sobre la suficiencia de las Escrituras frente al deseo de señales extraordinarias, a partir de Lucas 16:31", "1857", ["apologetica", "evangelismo"]),
    (144, 3, "spurgeon-esperar-solo-en-dios", "Esperar solo en Dios", "Sobre el alma que descansa únicamente en Dios en medio de la adversidad, a partir del Salmo 62:6", "1857", ["perseverancia", "fe"]),
]

SPURGEON_HEADER_RE = re.compile(r'^(\d{1,4})[ \t]+(.+?)[ \t]+[-—][ \t]+([A-Za-z0-9.:\'’ ]+?\d)[ \t]*$', re.M)
SPURGEON_PAGE_NUM_RE = re.compile(r'^\d{1,4}[ \t]*$', re.M)
SPURGEON_CREDIT_RE = re.compile(r'^.*ClassicChristianLibrary\.com.*$', re.M | re.I)
SPURGEON_VOLTITLE_RE = re.compile(r"^Spurgeon.s Sermons\s*[-—]\s*Vol\.?\s*[IVXLCDM]+\s*$", re.M | re.I)


def _spurgeon_flexible(s: str) -> str:
    """Convierte un título/referencia capturado en un patrón que tolera que
    el mismo texto aparezca partido en dos líneas en el OCR (encabezados de
    página repetidos que a veces se reflowan a mitad de frase)."""
    return r"\s+".join(re.escape(tok) for tok in s.split())


def spurgeon_find_transitions(text: str) -> tuple[dict[int, tuple[int, int, str, str]], list[int]]:
    """Ubica cada aparición de un encabezado de página real (no de la tabla
    de contenidos, que siempre trae un número de página final pegado) y
    devuelve la primera ocurrencia de cada número de sermón detectado, en
    orden de aparición -- la frontera de fin de un sermón es el inicio del
    siguiente número detectado (por eso solo se usan en SPURGEON los que
    tienen el siguiente número consecutivo confirmado, ver comentario en
    SPURGEON arriba)."""
    first_deliv = re.search(r"Delivered on Sabbath", text)
    if not first_deliv:
        raise RuntimeError("No se encontró el inicio del cuerpo de Spurgeon (tras la tabla de contenidos)")
    offset = first_deliv.start() - 200
    body = text[offset:]
    seen: dict[int, tuple[int, int, str, str]] = {}
    order: list[int] = []
    for m in SPURGEON_HEADER_RE.finditer(body):
        n = int(m.group(1))
        if n not in seen:
            seen[n] = (offset + m.start(), offset + m.end(), m.group(2).strip(), m.group(3).strip())
            order.append(n)
    return seen, order


def spurgeon_extract(text: str, seen: dict[int, tuple[int, int, str, str]], order: list[int], number: int) -> list[str]:
    idx = order.index(number)
    title, ref = seen[number][2], seen[number][3]
    start = seen[number][1]
    end = seen[order[idx + 1]][0] if idx + 1 < len(order) else len(text)
    raw = text[start:end]
    # El bloque "A Sermon / Delivered on ... / by the / REV. C.H. SPURGEON /
    # <lugar>" precede al texto real -- se descarta hasta el final del
    # nombre del predicador y la línea de lugar que sigue.
    preamble = re.search(r"SPURGEON,?\s*\n+(.+?)\n\n", raw, re.S)
    if preamble:
        raw = raw[preamble.end():]
    wrapped_header_re = re.compile(
        rf"\d{{1,4}}\s+{_spurgeon_flexible(title)}\s*[-—]\s*{_spurgeon_flexible(ref)}\.?", re.I
    )
    raw = wrapped_header_re.sub("", raw)
    raw = SPURGEON_HEADER_RE.sub("", raw)
    raw = SPURGEON_VOLTITLE_RE.sub("", raw)
    raw = SPURGEON_PAGE_NUM_RE.sub("", raw)
    raw = SPURGEON_CREDIT_RE.sub("", raw)
    paragraphs = []
    for block in re.split(r"\n\s*\n", raw.strip()):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        joined = re.sub(r"\s+", " ", " ".join(lines)).strip()
        if len(joined) < 2:
            continue
        paragraphs.append(joined)
    return paragraphs


def html_page(item: dict) -> str:
    body = "\n\n".join(f"      <p>{html.escape(p)}</p>" for p in item["paragraphs"])
    source = html.escape(item["source_url"], quote=True)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(item['title_en'])} | Verbo</title>
<meta name="description" content="{html.escape(item['subtitle_es'])}. Sermón histórico de dominio público.">
<link rel="canonical" href="https://verbobiblia.com/recursos/sermones-historicos/{item['id']}/">
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
    <a class="static-page__back" href="../">← Sermones Históricos</a>
  </header>
  <main class="static-page__main">
    <article data-author="{html.escape(item['author'])}" data-source-lang="en" data-i18n-strategy="auto" data-title-es="{html.escape(item['title_es'], quote=True)}" data-title-en="{html.escape(item['title_en'], quote=True)}" data-topics="{','.join(item['topics'])}" data-category="{item['category']}" data-subtype="{item['subtype']}" data-date-added="2026-08-13">
      <p class="article-badge">Sermones Históricos · Sermón · {item['year_label']}</p>
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
  <script src="../../../biblia/assets/site-translate.js?v=20260811-translate-abandon"></script>
  <script src="../../../biblia/assets/content-translate.js?v=20260810-source-lang"></script>
  <script src="../../../biblia/assets/site-chrome.js?v=20260810-source-lang"></script>
</body>
</html>
'''


def update_sitemap(items: list[dict]) -> None:
    xml = SITEMAP.read_text(encoding="utf-8")
    blocks = []
    urls = [f"https://verbobiblia.com/recursos/sermones-historicos/{item['id']}/" for item in items]
    urls.append("https://verbobiblia.com/recursos/sermones-historicos/")
    for url in urls:
        if f"<loc>{url}</loc>" in xml:
            continue
        blocks.append(
            "  <url>\n"
            f"    <loc>{url}</loc>\n"
            "    <lastmod>2026-08-13</lastmod>\n"
            "    <changefreq>yearly</changefreq>\n"
            "    <priority>0.5</priority>\n"
            "  </url>\n"
        )
    if blocks:
        xml = xml.replace("</urlset>", "".join(blocks) + "</urlset>")
        SITEMAP.write_text(xml, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--moody", type=Path)
    parser.add_argument("--edwards", type=Path)
    parser.add_argument("--wesley", type=Path)
    parser.add_argument("--whitefield", type=Path)
    parser.add_argument("--ryle", type=Path)
    parser.add_argument("--spurgeon-vol1", type=Path)
    parser.add_argument("--spurgeon-vol2", type=Path)
    parser.add_argument("--spurgeon-vol3", type=Path)
    args = parser.parse_args()
    items = []

    if args.moody:
        text = args.moody.read_text(encoding="utf-8")
        # Recorta a la sección de sermones: desde "THE OVERCOMING LIFE."
        # (único encabezado con punto -- la tabla de contenidos lo lista
        # sin punto final) hasta antes de "THE RED LIBRARY" (catálogo
        # publicitario de Gutenberg al final del libro).
        body_start = text.index("THE OVERCOMING LIFE.")
        body_end = text.index("THE RED LIBRARY")
        text = text[body_start:body_end]
        segments = moody_segments(text)
        for slug, header, title_es, subtitle, topics in MOODY:
            paragraphs = segments.get(header)
            if not paragraphs:
                raise RuntimeError(f"No se pudo segmentar Moody: {header!r}")
            items.append({
                "id": slug,
                "author": "D. L. Moody",
                "title_es": title_es,
                "title_en": MOODY_TITLE_EN[slug],
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": "1896",
                "document_type": "Sermón",
                "publication": MOODY_PUBLICATION,
                "source_url": MOODY_SOURCE,
                "source_label": "Project Gutenberg eBook 33015",
                "rights": "Public domain in the USA (Project Gutenberg)",
                "paragraphs": paragraphs,
            })

    if args.edwards:
        text = args.edwards.read_text(encoding="utf-8")
        segments = edwards_segments(text)
        for slug, numeral, title_es, title_en, subtitle, year_label, topics in EDWARDS:
            paragraphs = segments.get(numeral)
            if not paragraphs:
                raise RuntimeError(f"No se pudo segmentar Edwards: sermón {numeral!r}")
            items.append({
                "id": slug,
                "author": "Jonathan Edwards",
                "title_es": title_es,
                "title_en": title_en,
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": year_label,
                "document_type": "Sermón",
                "publication": EDWARDS_PUBLICATION,
                "source_url": EDWARDS_SOURCE,
                "source_label": "Project Gutenberg eBook 34632",
                "rights": "Public domain in the USA (Project Gutenberg)",
                "paragraphs": paragraphs,
            })

    if args.wesley:
        text = args.wesley.read_text(encoding="utf-8")
        # Recorta la tabla de contenidos: el cuerpo real empieza después del
        # único encabezado de sección "SERMONS ON SEVERAL OCCASIONS." (la
        # tabla de contenidos lista los títulos antes, sin este encabezado).
        body_start = text.index("SERMONS ON SEVERAL OCCASIONS.") + len("SERMONS ON SEVERAL OCCASIONS.")
        body_end = text.index("*** END OF THE PROJECT GUTENBERG")
        text = text[body_start:body_end]
        segments = wesley_segments(text)
        for slug, numeral, title_es, title_en, subtitle, year_label, topics in WESLEY:
            paragraphs = segments.get(numeral)
            if not paragraphs:
                raise RuntimeError(f"No se pudo segmentar Wesley: sermón {numeral!r}")
            # El primer bloque del cuerpo es el título en mayúsculas del propio
            # texto fuente (ej. "SALVATION BY FAITH."), redundante con el <h1>
            # que ya muestra la página -- se descarta, igual que Moody/Edwards
            # arrancan su primer párrafo en la cita bíblica, no en el título.
            if paragraphs and paragraphs[0].strip().rstrip(".").upper() == title_en.rstrip(".").upper():
                paragraphs = paragraphs[1:]
            items.append({
                "id": slug,
                "author": "John Wesley",
                "title_es": title_es,
                "title_en": title_en,
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": year_label,
                "document_type": "Sermón",
                "publication": WESLEY_PUBLICATION,
                "source_url": WESLEY_SOURCE,
                "source_label": "Project Gutenberg eBook 59743",
                "rights": "Public domain in the USA (Project Gutenberg)",
                "paragraphs": paragraphs,
            })

    if args.whitefield:
        text = args.whitefield.read_text(encoding="utf-8")
        segments = whitefield_segments(text)
        for slug, numeral, title_es, title_en, subtitle, year_label, topics in WHITEFIELD:
            paragraphs = segments.get(numeral)
            if not paragraphs:
                raise RuntimeError(f"No se pudo segmentar Whitefield: sermón {numeral!r}")
            # El primer bloque del cuerpo es el título propio del sermón (ej.
            # "The Duty of searching the Scriptures."), redundante con el <h1>
            # -- se descarta, mismo criterio que Wesley. A diferencia de
            # Moody/Edwards/Wesley, en este tomo la referencia bíblica y la
            # cita van en líneas separadas (dos párrafos cortos propios en vez
            # de uno combinado) -- se conservan tal cual, es la tipografía
            # real de la fuente, mismo criterio que los subencabezados de
            # Moody ("PART I.", "Appetite.", etc.).
            first_norm = paragraphs[0].strip().rstrip(".").lower().replace("’", "'") if paragraphs else ""
            title_norm = title_en.rstrip(".").lower().replace("’", "'")
            if first_norm == title_norm:
                paragraphs = paragraphs[1:]
            items.append({
                "id": slug,
                "author": "George Whitefield",
                "title_es": title_es,
                "title_en": title_en,
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": year_label,
                "document_type": "Sermón",
                "publication": WHITEFIELD_PUBLICATION,
                "source_url": WHITEFIELD_SOURCE,
                "source_label": "Project Gutenberg eBook 77041",
                "rights": "Public domain in the USA (Project Gutenberg)",
                "paragraphs": paragraphs,
            })

    if args.ryle:
        text = args.ryle.read_text(encoding="utf-8")
        segments = ryle_segments(text)
        for slug, title_es, title_en, subtitle, topics in RYLE:
            paragraphs = segments.get(slug)
            if not paragraphs:
                raise RuntimeError(f"No se pudo segmentar Ryle: {slug!r}")
            items.append({
                "id": slug,
                "author": "J. C. Ryle",
                "title_es": title_es,
                "title_en": title_en,
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": "1900",
                "document_type": "Sermón",
                "publication": RYLE_PUBLICATION,
                "source_url": RYLE_SOURCE,
                "source_label": "Internet Archive, thechristianrace00ryleuoft (NOT_IN_COPYRIGHT)",
                "rights": "Not in copyright (Internet Archive)",
                "paragraphs": paragraphs,
            })

    spurgeon_vol_paths = {1: args.spurgeon_vol1, 2: args.spurgeon_vol2, 3: args.spurgeon_vol3}
    spurgeon_vols_used = [v for v, p in spurgeon_vol_paths.items() if p]
    if spurgeon_vols_used:
        vol_data = {}
        for vol in spurgeon_vols_used:
            text = spurgeon_vol_paths[vol].read_text(encoding="utf-8")
            vol_data[vol] = (text, *spurgeon_find_transitions(text))
        for number, vol, slug, title_es, subtitle, year_label, topics in SPURGEON:
            if vol not in vol_data:
                continue
            text, seen, order = vol_data[vol]
            if number not in seen:
                raise RuntimeError(f"No se pudo ubicar Spurgeon #{number} en el volumen {vol}")
            # title_en real tal como aparece en el propio encabezado de
            # página del volumen -- no se hardcodea aparte, para que quede
            # imposible que el título mostrado se desincronice del texto
            # realmente extraído (la lección de los intentos fallidos de
            # segmentación genérica: cada dato mostrado debe salir del mismo
            # match que ancla la extracción, nunca de una lista paralela).
            title_en = seen[number][2]
            paragraphs = spurgeon_extract(text, seen, order, number)
            if len(" ".join(paragraphs)) < 2500:
                raise RuntimeError(f"Texto sospechosamente corto para Spurgeon #{number} ({slug!r}) -- no se debería haber seleccionado")
            items.append({
                "id": slug,
                "author": "Charles H. Spurgeon",
                "title_es": title_es,
                "title_en": title_en,
                "subtitle_es": subtitle,
                "topics": topics,
                "category": "sermon",
                "subtype": "sermon",
                "year_label": year_label,
                "document_type": "Sermón",
                "publication": SPURGEON_VOL_PUBLICATION[vol],
                "source_url": SPURGEON_VOL_SOURCE[vol],
                "source_label": SPURGEON_VOL_LABEL[vol],
                "rights": "Not in copyright (Internet Archive)",
                "paragraphs": paragraphs,
            })

    for item in items:
        if len(" ".join(item["paragraphs"])) < 500:
            raise RuntimeError(f"Texto sospechosamente corto: {item['id']}")
        d = OUT / item["id"]
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(html_page(item), encoding="utf-8")

    existing = json.loads(DATA.read_text(encoding="utf-8")) if DATA.exists() else []
    existing_by_id = {it["id"]: it for it in existing}
    for item in items:
        existing_by_id[item["id"]] = item
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(list(existing_by_id.values()), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    update_sitemap(items)
    counts = []
    if args.moody: counts.append(f"{len(MOODY)} Moody")
    if args.edwards: counts.append(f"{len(EDWARDS)} Edwards")
    if args.wesley: counts.append(f"{len(WESLEY)} Wesley")
    if args.whitefield: counts.append(f"{len(WHITEFIELD)} Whitefield")
    if args.ryle: counts.append(f"{len(RYLE)} Ryle")
    if spurgeon_vols_used: counts.append(f"{len([s for s in SPURGEON if s[1] in spurgeon_vols_used])} Spurgeon")
    print(f"Sermones Históricos: {len(items)} piezas generadas ({', '.join(counts)}).")


if __name__ == "__main__":
    main()
