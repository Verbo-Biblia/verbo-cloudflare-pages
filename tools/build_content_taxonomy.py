#!/usr/bin/env python3
"""
Genera el índice de metadatos de Recursos y Librería (esquema id/titulo/
seccion/tipo/idioma/temas/fecha_agregado/autor) a partir del HTML existente
(no se duplica contenido, se lee de las páginas ya publicadas) más un par
de tablas de clasificación curadas a mano para los campos que no se pueden
derivar automáticamente (tipo editorial, temas finos).

Salidas:
  - recursos/data/recursos.json
  - libreria/data/libreria.json
  - clasificacion-pendiente-revision.md   (piezas con clasificación ambigua)
  - build/novedades.json                  (top-N combinado, para portada)
  - build/articulos_list.html             (bloque a pegar en articulos-y-reflexiones/index.html)
  - build/libreria_grid.html              (bloque a pegar en libreria/index.html)
  - build/novedades_section.html          (bloque a pegar en index.html raíz)
  - build/matthew_henry/                  (66 páginas lector + índice, listas para copiar a libreria/matthew-henry/)

Nada de esto se aplica automáticamente a los archivos "en vivo": este script
solo genera datos y fragmentos de HTML en build/ para revisión, salvo los
tres archivos JSON/MD de arriba, que sí son la fuente de datos final.
"""
import json
import argparse
import html as html_module
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECURSOS = ROOT / "recursos"
LIBRERIA = ROOT / "libreria"
BUILD = ROOT / "build"

MESES = {
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
    "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12,
}


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def git_add_date(path):
    """Fecha (YYYY-MM-DD) del commit más antiguo que agregó `path`."""
    try:
        out = subprocess.run(
            ["git", "log", "--diff-filter=A", "--format=%ad", "--date=short", "--", str(path)],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip().splitlines()
        return out[-1] if out else None
    except subprocess.CalledProcessError:
        return None


def parse_badge_date(text, fallback_git_date, approx_flags):
    """'27 jul 2026' -> fecha exacta. 'oct 2025' -> primer día del mes (aproximado)."""
    text = text.strip().lower()
    m = re.match(r"^(\d{1,2})\s+([a-zé]{3,4})\.?\s+(\d{4})$", text)
    if m:
        day, mon, year = m.groups()
        mon = mon[:3]
        if mon in MESES:
            return f"{year}-{MESES[mon]:02d}-{int(day):02d}"
    m = re.match(r"^([a-zé]{3,4})\.?\s+(\d{4})$", text)
    if m:
        mon, year = m.groups()
        mon = mon[:3]
        if mon in MESES:
            approx_flags.append(True)
            return f"{year}-{MESES[mon]:02d}-01"
    return fallback_git_date


# ============================================================
# 1. ARTÍCULOS Y REFLEXIONES
# ============================================================

# tipo explícito solo para las piezas que llevaban el rótulo interno
# "Reflexión" (las demás ya vienen clasificadas por su propio badge de tema
# -> Apologética/Teología/Historia de la Biblia/Vida cristiana, que mapea
# 1:1 a tipo="articulo" por su extensión y estructura argumentativa).
TIPO_OVERRIDE = {
    "2corintios-5": "devocional",
    "efesios-2": "devocional",
    "romanos-8": "devocional",
    "permanece-en-la-vid": "devocional",
    "hoy-si-oyes-su-voz": "devocional",
    "aun-no-es-el-fin": "devocional",
    "fe-y-voluntad": "reflexion",
    "desierto-eclesiastes-3": "reflexion",
    "cosas-mejores-vendran": "reflexion",
    "mirada-que-nos-alcanzo": "reflexion",
    "piedad-sin-condescendencia": "reflexion",
    "su-fidelidad-no-la-mia": "reflexion",
    "aceptados-por-cristo": "reflexion",
    # --- las tres siguientes eran ambiguas; confirmadas por Juan el 2026-07-28 ---
    "fe-que-no-negocia": "reflexion",
    "como-agradar-a-dios": "articulo",
    "dios-no-compite-con-el-ruido": "articulo",
}

# Taxonomía de "categoria" (2026-08-04), confirmada por Juan: agrupa las
# piezas en dos secciones visuales -- "devocional" (Reflexiones y
# Devocionales) y "estudio" (Estudios Temáticos) -- para reestructurar
# recursos/articulos-y-reflexiones/index.html. Por defecto sigue "tipo"
# (devocional-reflexion -> devocional, articulo -> estudio), salvo estas 2
# excepciones: llevan tipo="articulo" en el dato editorial pero su propio
# breadcrumb de página dice "Reflexión" y su contenido es exhortación
# devocional en 1a persona, no un ensayo temático estructurado -- prevalece
# el contenido real sobre el campo "tipo".
CATEGORIA_OVERRIDE = {
    "como-agradar-a-dios": "devocional",
    "dios-no-compite-con-el-ruido": "devocional",
}


def categoria_para(slug, tipo):
    default = "devocional" if tipo == "devocional-reflexion" else "estudio"
    return CATEGORIA_OVERRIDE.get(slug, default)

# Piezas con clasificación genuinamente ambigua, pendientes de confirmar con
# Juan. Vacío desde 2026-07-28 (las 3 últimas se confirmaron ese día); se deja
# el mecanismo por si aparecen nuevas piezas ambiguas más adelante.
PENDIENTES = {}

# ============================================================
# Estrategia de traducción (2026-07-29) — español -> inglés on-demand.
# Regla de prioridad: nativo_disponible > auto_traducible > requiere
# traducción manual (arcaísmos/OCR que rompen el traductor automático).
# Por defecto todo el contenido moderno de Juan (Recursos) es
# auto_traducible; las excepciones curadas a mano van aquí, encontradas
# escaneando el texto fuente en busca de caracteres de Área de Uso Privado
# (U+E000-U+F8FF), residuo típico de ligaduras OCR mal decodificadas al
# convertir un PDF escaneado.
# ============================================================

ESTRATEGIA_DEFAULT = {"modo": "auto_traducible"}

ESTRATEGIA_OVERRIDE = {
    "la-mejor-version-de-mi-fue-clavada-en-la-cruz": {"modo": "nativo_disponible"},
    # Librería — patrística ES traducida por Juan desde DOCX (sin OCR),
    # pero basada en Ante-Nicene Fathers (ed. Roberts & Donaldson), que SÍ
    # tiene traducción inglesa nativa de dominio público en newadvent.org/
    # fathers. No la marcamos nativo_disponible porque ese texto inglés no
    # vive en este repo todavía — queda como auto_traducible con nota, para
    # que Juan decida si vale la pena sumarlo como fuente nativa después.
    "la-didache": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "primera-clemente": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "segunda-clemente": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "el-pastor-de-hermas": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "epistola-de-bernabe": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "epistola-a-diogneto": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "fragmentos-de-papias": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "martirio-de-ignacio": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "martirio-de-policarpo": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "policarpo-a-los-filipenses": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},
    "contra-las-herejias": {"modo": "auto_traducible", "nota": "Traducción de Ante-Nicene Fathers (dominio público); existe versión inglesa nativa en newadvent.org/fathers, no incluida aún en el repo."},

    # Librería — Matthew Henry ya es el texto inglés nativo (dominio
    # público), reutilizado del módulo de comentario que ya usa el panel
    # de /biblia/. No hace falta traducir nada hacia inglés.
    "matthew-henry": {"modo": "nativo_disponible", "nativo_ref": "biblia/modules/commentaries/matthew-henry-en", "nota": "El lector de Librería ya sirve el texto inglés nativo; la traducción EN->ES para lectores hispanos usa el mecanismo existente del panel de Comentario, no está conectada todavía en el lector de Librería (gap detectado, fuera de alcance de esta tarea)."},

    # Librería — Chapel Library: dos de los tres folletos tienen residuos
    # de OCR (ligaduras mal decodificadas del PDF original) detectados por
    # escaneo de caracteres U+E000-U+F8FF en el texto fuente.
    "deberes-de-hijos-y-padres": {"modo": "requiere_traduccion_manual", "motivo": "Símbolo residual de OCR en el texto fuente (ligadura mal decodificada del PDF original, U+F065/U+F066 al final del texto) — riesgo de romper la traducción automática."},
    "el-tesoro-de-david-condensado": {"modo": "requiere_traduccion_manual", "motivo": "Símbolo residual de OCR en el texto fuente (ligadura mal decodificada del PDF original, U+F066 al final del texto) — riesgo de romper la traducción automática."},
    # "totalmente-por-gracia" no tiene residuos de OCR detectados -> auto_traducible por defecto.

    # Librería — Evangelio según Jesucristo es texto bíblico (armonía
    # cronológica de los cuatro Evangelios), no un ensayo de Juan. Mismo
    # criterio ya usado en el resto del sitio: el texto bíblico no se
    # traduce automáticamente (ver decisión i18n 2026-07-29).
    "evangelio-segun-jesucristo": {"modo": "requiere_traduccion_manual", "motivo": "Es texto bíblico (armonía cronológica de los Evangelios), no un ensayo — mismo criterio que excluye el texto bíblico de traducción automática en el resto del sitio. Traducir a mano o evaluar una armonía nativa en inglés si Juan lo decide."},
}


def estrategia_para(slug):
    return ESTRATEGIA_OVERRIDE.get(slug, ESTRATEGIA_DEFAULT)

TEMAS_OVERRIDE = {
    "2corintios-5": ["gracia", "identidad-en-cristo"],
    "efesios-2": ["gracia", "identidad-en-cristo"],
    "romanos-8": ["seguridad-en-cristo"],
    "permanece-en-la-vid": ["vida-en-cristo"],
    "hoy-si-oyes-su-voz": ["fe"],
    "aun-no-es-el-fin": ["escatologia"],
    "fe-y-voluntad": ["fe"],
    "desierto-eclesiastes-3": ["sufrimiento", "esperanza"],
    "cosas-mejores-vendran": ["esperanza"],
    "mirada-que-nos-alcanzo": ["gracia"],
    "piedad-sin-condescendencia": ["santidad"],
    "su-fidelidad-no-la-mia": ["gracia", "fidelidad-de-dios"],
    "aceptados-por-cristo": ["identidad-en-cristo", "gracia"],
    "fe-que-no-negocia": ["fe"],
    "como-agradar-a-dios": ["santidad"],
    "dios-no-compite-con-el-ruido": ["vida-cristiana"],
}

BADGE_RE = re.compile(r'<p class="article-badge">Art[ií]culos y Reflexiones · ([^·]+) · ([^<]+)</p>')
H1_RE = re.compile(r"<h1>(.+?)</h1>", re.S)
AUTHOR_RE = re.compile(r'<article\b[^>]*\bdata-author="([^"]+)"')


def article_attr(html, name):
    match = re.search(rf'<article\b[^>]*\b{name}="([^"]*)"', html)
    return match.group(1).strip() if match else None


def build_articulos(approx_flags):
    items = []
    base = RECURSOS / "articulos-y-reflexiones"
    base_en = RECURSOS / "articles-and-reflections-en"
    for d in sorted(base.iterdir()):
        if not d.is_dir():
            continue
        idx = d / "index.html"
        if not idx.exists():
            continue
        html = idx.read_text(encoding="utf-8")
        slug = d.name
        m = BADGE_RE.search(html)
        topic, datestr = (m.group(1).strip(), m.group(2).strip()) if m else ("", "")
        h1_m = H1_RE.search(html)
        titulo_h1 = re.sub(r"\s+", " ", h1_m.group(1)).strip() if h1_m else slug
        titulo = html_module.unescape(article_attr(html, "data-title-es") or titulo_h1)
        author_m = AUTHOR_RE.search(html)
        autor = author_m.group(1).strip() if author_m else None

        # Contraparte nativa en inglés (traducida por Codex, 2026-07-29). Si
        # todavía no existe -> el artículo se queda sin titulo_en/ruta_en y el
        # listado/navegador cae de vuelta al español en silencio (ver
        # lang-aware-list.js / article-lang-redirect.js).
        idx_en = base_en / slug / "index.html"
        titulo_en = article_attr(html, "data-title-en")
        titulo_en = html_module.unescape(titulo_en) if titulo_en else None
        if idx_en.exists():
            html_en = idx_en.read_text(encoding="utf-8")
            h1_en_m = H1_RE.search(html_en)
            titulo_en = re.sub(r"\s+", " ", h1_en_m.group(1)).strip() if h1_en_m else None

        git_date = git_add_date(idx)
        fecha = article_attr(html, "data-date-added") or (parse_badge_date(datestr, git_date, approx_flags) if datestr else git_date)

        declared_category = article_attr(html, "data-category")
        subtipo = article_attr(html, "data-subtype") or TIPO_OVERRIDE.get(slug)
        if subtipo is None:
            subtipo = "devocional" if declared_category == "devocional" else "articulo"
        tipo = subtipo
        if tipo in {"devocional", "reflexion"}:
            tipo = "devocional-reflexion"
        temas = TEMAS_OVERRIDE.get(slug)
        if temas is None:
            declared_topics = article_attr(html, "data-topics")
            temas = [t.strip() for t in declared_topics.split(",") if t.strip()] if declared_topics else ([slugify(topic)] if topic else [])

        categoria = declared_category or categoria_para(slug, tipo)
        source_lang = article_attr(html, "data-source-lang")
        single_source_route = source_lang == "en" and not idx_en.exists()

        items.append({
            "id": slug,
            "titulo": titulo,
            "seccion": "recursos",
            "tipo": tipo,
            "subtipo": subtipo,
            "categoria": categoria,
            "idioma": "es",
            "temas": temas,
            "fecha_agregado": fecha,
            "autor": autor,
            "url": f"/recursos/articulos-y-reflexiones/{slug}/",
            "titulo_es": titulo,
            "titulo_en": titulo_en,
            "ruta_es": f"/recursos/articulos-y-reflexiones/{slug}/",
            "ruta_en": (f"/recursos/articulos-y-reflexiones/{slug}/" if single_source_route else f"/recursos/articles-and-reflections-en/{slug}/") if titulo_en else None,
            "estrategia_traduccion": estrategia_para(slug),
            **({"pendiente_revision": True, "nota_pendiente": PENDIENTES[slug]} if slug in PENDIENTES else {}),
        })
    return items


# ============================================================
# 2. ESCUELA DOMINICAL
# ============================================================

GROUPS_4_7 = {
    "Creación": range(1, 9), "Patriarcas": range(9, 15), "Moisés": range(15, 21),
    "David": range(21, 26), "Profetas": range(26, 29), "Navidad": range(29, 33),
    "Ministerio de Jesús": range(33, 41), "Muerte y resurrección": range(41, 44),
    "La Iglesia": range(44, 48), "Vida cristiana": range(48, 53),
}
LESSON_LINK_RE = re.compile(r'href="(leccion-[^/"]+)/">Lecci[oó]n \d+ (?:—|-) ([^<]+)</a>')


def build_escuela_dominical():
    items = []
    for grupo_edad, group_map in (("4-7", GROUPS_4_7), ("8-10", None)):
        d = RECURSOS / "escuela-dominical" / f"{grupo_edad}-anos"
        idx_html = (d / "index.html").read_text(encoding="utf-8")
        fecha = git_add_date(d)
        # slug -> número de lección, a partir del listado de la página índice
        slug_title = LESSON_LINK_RE.findall(idx_html)
        for slug, titulo in slug_title:
            num = int(re.search(r"leccion-(\d+)-", slug).group(1))
            if group_map:
                tema = next((g for g, rng in group_map.items() if num in rng), None)
                temas = ["escuela-dominical", slugify(tema)] if tema else ["escuela-dominical"]
            else:
                temas = ["escuela-dominical", "vida-de-jesus"]
            items.append({
                "id": slug,
                "titulo": titulo.strip(),
                "seccion": "recursos",
                "tipo": "leccion",
                "idioma": "es",
                "temas": temas,
                "fecha_agregado": fecha,
                "grupo_edad": grupo_edad,
                "url": f"/recursos/escuela-dominical/{grupo_edad}-anos/{slug}/",
                "estrategia_traduccion": estrategia_para(slug),
            })
    return items


# ============================================================
# 3. LIBRERÍA
# ============================================================

LIBRERIA_META = {
    "evangelio-segun-jesucristo": {"autor": "Versión Cronológica Fluida — Verbo", "temas": ["evangelios", "armonia-evangelica"]},
    "la-didache": {"autor": "Enseñanza de los Doce Apóstoles", "temas": ["patristica", "siglo-1"]},
    "primera-clemente": {"autor": "Clemente de Roma", "temas": ["patristica", "siglo-1"]},
    "segunda-clemente": {"autor": "Atribuida a Clemente de Roma", "temas": ["patristica", "siglo-2"]},
    "el-pastor-de-hermas": {"autor": "Hermas", "temas": ["patristica", "siglo-2"]},
    "epistola-de-bernabe": {"autor": "Atribuida a Bernabé", "temas": ["patristica", "siglo-1", "siglo-2"]},
    "epistola-a-diogneto": {"autor": "Autor anónimo (Mathietes)", "temas": ["patristica", "apologetica", "siglo-2"]},
    "fragmentos-de-papias": {"autor": "Papías de Hierápolis", "temas": ["patristica", "siglo-2"]},
    "martirio-de-ignacio": {"autor": "Ignacio de Antioquía", "temas": ["patristica", "siglo-2"]},
    "martirio-de-policarpo": {"autor": "Iglesia de Esmirna", "temas": ["patristica", "siglo-2"]},
    "policarpo-a-los-filipenses": {"autor": "Policarpo de Esmirna", "temas": ["patristica", "siglo-2"]},
    "contra-las-herejias": {"autor": "Ireneo de Lyon", "temas": ["patristica", "apologetica", "siglo-2"]},
    "deberes-de-hijos-y-padres": {"autor": "Richard Adams", "temas": ["vida-cristiana", "familia", "chapel-library", "siglo-17"]},
    "totalmente-por-gracia": {"autor": "Charles Spurgeon", "temas": ["gracia", "evangelismo", "chapel-library", "siglo-19"]},
    "el-tesoro-de-david-condensado": {"autor": "Charles Spurgeon", "temas": ["salmos", "devocional", "chapel-library", "siglo-19"]},
    "matthew-henry": {
        "autor": "Matthew Henry (1662–1714)",
        "temas": ["comentario-biblico", "teologia"],
        "idioma": "en",
        "fecha_agregado": "2026-07-28",
    },
}

BOOK_ROW_RE = re.compile(
    r'<a class="r-book-row" href="([^/"]+)/"[^>]*>'
    r'(?:(?!<a class="r-book-row").)*?'
    r'<span class="book-cover-title"[^>]*>([^<]+)</span>',
    re.S,
)


def build_libreria():
    items = []
    idx_html = (LIBRERIA / "index.html").read_text(encoding="utf-8")
    catalog_path = LIBRERIA / "data" / "libreria.json"
    existing_by_id = {}
    if catalog_path.exists():
        existing_by_id = {
            item["id"]: item
            for item in json.loads(catalog_path.read_text(encoding="utf-8"))
            if item.get("id")
        }
    for slug, titulo in BOOK_ROW_RE.findall(idx_html):
        # Preserve imported-book metadata when this taxonomy is regenerated.
        # Curated overrides continue to take precedence for legacy titles.
        meta = {**existing_by_id.get(slug, {}), **LIBRERIA_META.get(slug, {})}
        fecha = meta.get("fecha_agregado") or git_add_date(LIBRERIA / slug)
        item = {
            "id": slug,
            "titulo": titulo.strip(),
            "seccion": "libreria",
            "tipo": "libro",
            "idioma": meta.get("idioma", "es"),
            "temas": meta.get("temas", []),
            "fecha_agregado": fecha,
            "autor": meta.get("autor"),
            "url": f"/libreria/{slug}/",
            "estrategia_traduccion": estrategia_para(slug),
        }
        for field in ("fuente", "licencia", "traductor"):
            if meta.get(field):
                item[field] = meta[field]
        items.append(item)
    return items


MESES_LARGO = {1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun",
               7: "jul", 8: "ago", 9: "sep", 10: "oct", 11: "nov", 12: "dic"}


def fmt_fecha_corta(iso):
    y, m, d = iso.split("-")
    return f"{int(d)} {MESES_LARGO[int(m)]} {y}"


TIPO_LABEL = {"devocional-reflexion": "Devocional y reflexión", "articulo": "Artículo"}
TIPO_I18N_KEY = {"devocional-reflexion": "filtros.devocionalReflexion", "articulo": "filtros.articulo"}
TEMA_LABEL = {
    "apologetica": "Apologética", "teologia": "Teología", "vida-cristiana": "Vida cristiana",
    "historia-de-la-biblia": "Historia de la Biblia", "gracia": "Gracia", "fe": "Fe",
    "esperanza": "Esperanza", "sufrimiento": "Sufrimiento", "identidad-en-cristo": "Identidad en Cristo",
    "santidad": "Santidad", "seguridad-en-cristo": "Seguridad en Cristo", "escatologia": "Escatología",
    "vida-en-cristo": "Vida en Cristo", "fidelidad-de-dios": "Fidelidad de Dios",
    "patristica": "Patrística", "chapel-library": "Chapel Library", "salmos": "Salmos",
    "devocional": "Devocional", "familia": "Familia", "evangelismo": "Evangelismo",
    "evangelios": "Evangelios", "armonia-evangelica": "Armonía evangélica",
    "comentario-biblico": "Comentario bíblico",
    "ministerio": "Ministerio", "unidad": "Unidad", "oracion": "Oración",
    "perseverancia": "Perseverancia", "juventud": "Juventud", "predicacion": "Predicación",
    "iglesia": "Iglesia", "doctrina": "Doctrina", "escritura": "Escritura",
    "cultura": "Cultura", "liderazgo": "Liderazgo",
    "siglo-1": "Siglo I", "siglo-2": "Siglo II", "siglo-17": "Siglo XVII", "siglo-19": "Siglo XIX",
}


def tema_label(slug):
    return TEMA_LABEL.get(slug, slug.replace("-", " ").capitalize())


def tema_i18n_key(slug):
    """slug kebab-case -> clave camelCase de biblia/assets/i18n/{es,en}.json
    (namespace "temas"), ej. "historia-de-la-biblia" -> "historiaDeLaBiblia"."""
    parts = slug.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def esc(s):
    return (
        (s or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


# ---------- bloque: lista filtrable de Artículos y Reflexiones ----------
#
# Dos secciones visuales separadas por "categoria" (2026-08-04, confirmado
# por Juan): "devocional" -> Reflexiones y Devocionales, "estudio" ->
# Estudios Temáticos. Cada sección tiene su propia barra de filtro por tema
# (solo los temas presentes en esa sección) y su propia lista con id propio
# -- filters.js ya es genérico por barra (data-filter-target), así que dos
# barras independientes funcionan sin tocar ese archivo. El badge de "tipo"
# por fila (Devocional y reflexión / Artículo) se conserva para no perder
# esa información editorial, aunque ya no exista un filtro global por tipo.

CATEGORIA_SECTIONS = (
    ("devocional", "devocional-list", "articulosIndex.devocionalHeading", "Reflexiones y Devocionales"),
    ("estudio", "estudio-list", "articulosIndex.estudioHeading", "Estudios Temáticos"),
)


def render_articulo_row(it):
    temas_attr = ",".join(it["temas"])
    if not it.get("autor"):
        raise ValueError(f"Artículo sin autor para tarjeta: {it['id']}")
    # El listado es una sola página física (recursos/articulos-y-reflexiones/
    # index.html) que sirve ambos idiomas: lang-aware-list.js reescribe
    # título+href en tiempo de ejecución según VerboI18n.getUiLang(),
    # leyendo data-titulo-es/en y data-ruta-es/en. href/texto impresos
    # abajo son el español -> comportamiento correcto sin JS (progresivo)
    # y fallback silencioso si algún día falta la traducción de un
    # artículo nuevo (no se imprime data-ruta-en/data-titulo-en).
    ruta_en_attr = ""
    titulo_en_attr = ""
    if it.get("ruta_en") and it.get("titulo_en"):
        ruta_en_rel = (f"{it['id']}/" if it["ruta_en"] == it["ruta_es"]
                       else f"../articles-and-reflections-en/{it['id']}/")
        ruta_en_attr = f' data-ruta-en="{ruta_en_rel}"'
        titulo_en_attr = f' data-titulo-en="{esc(it["titulo_en"])}"'
    primary_topic = it["temas"][0] if it["temas"] else "vida-cristiana"
    subtype_labels = {"articulo": "Artículo", "reflexion": "Reflexión", "devocional": "Devocional"}
    subtype_keys = {"articulo": "filtros.articulo", "reflexion": "filtros.reflexion", "devocional": "filtros.devocional"}
    subtype = it["subtipo"]
    icon = (
        '<svg class="article-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">'
        '<path d="M5 19h14M7 16l8.8-8.8a1.7 1.7 0 0 1 2.4 2.4L9.4 18.4 6 19l.6-3Z"/></svg>'
        if it["categoria"] == "devocional" else
        '<svg class="article-cover-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">'
        '<path d="M4 5h7a3 3 0 0 1 3 3v12a4 4 0 0 0-4-4H4V5Zm16 0h-3a3 3 0 0 0-3 3v12a4 4 0 0 1 4-4h2V5Z"/></svg>'
    )
    return (
        f'    <a class="r-article-row" data-item data-tipo="{it["tipo"]}" '
        f'data-subtipo="{subtype}" '
        f'data-categoria="{it["categoria"]}" '
        f'data-tema="{temas_attr}" data-titulo-es="{esc(it["titulo_es"])}" '
        f'data-ruta-es="{it["id"]}/"{titulo_en_attr}{ruta_en_attr} href="{it["id"]}/">'
        f'<span class="article-cover">{icon}'
        f'<span class="article-cover-kicker" data-i18n="{subtype_keys[subtype]}">{subtype_labels[subtype]}</span>'
        f'<span class="r-article-row-title">{esc(it["titulo"])}</span>'
        f'<span class="article-cover-rule"></span>'
        f'<span class="article-cover-author">{esc(it["autor"])}</span>'
        f'</span>'
        f'<span class="article-card-meta">'
        f'<span class="article-card-topic" data-i18n="temas.{tema_i18n_key(primary_topic)}">{tema_label(primary_topic)}</span>'
        f'<span class="r-article-row-date">{fmt_fecha_corta(it["fecha_agregado"])}</span>'
        f'</span></a>'
    )


def render_articulos_block(items):
    items_sorted = sorted(items, key=lambda it: it["fecha_agregado"], reverse=True)
    out = ['<!-- CONTENT-FILTERS:START -->']
    temas = sorted({t for it in items_sorted for t in it["temas"]})
    out.append('<section class="r-content-group">')
    out.append('  <div class="r-filterbar" data-filter-bar data-filter-target="#articulos-grid">')
    out.append('    <select class="r-filter-select" data-filter-group="subtipo" data-i18n-attr="aria-label:filtros.filtrarPorTipo" aria-label="Filtrar por tipo">')
    out.append('      <option value="todos" data-i18n="filtros.todos">Todos</option>')
    out.append('      <option value="articulo" data-i18n="filtros.articulos">Artículos</option>')
    out.append('      <option value="reflexion" data-i18n="filtros.reflexiones">Reflexiones</option>')
    out.append('      <option value="devocional" data-i18n="filtros.devocionales">Devocionales</option>')
    out.append('    </select>')
    out.append('    <select class="r-filter-select" data-filter-group="tema" data-i18n-attr="aria-label:filtros.filtrarPorTema" aria-label="Filtrar por tema">')
    out.append('      <option value="todos" data-i18n="filtros.todosLosTemas">Todos los temas</option>')
    for t in temas:
        out.append(f'      <option value="{t}" data-i18n="temas.{tema_i18n_key(t)}">{tema_label(t)}</option>')
    out.append('    </select>')
    out.append('  </div>')
    out.append('  <div class="r-article-list r-article-grid" id="articulos-grid">')
    for it in items_sorted:
        out.append(render_articulo_row(it))
    out.append('  </div>')
    out.append('  <p class="r-filter-empty" hidden data-i18n="filtros.sinResultadosArticulos">No hay piezas que coincidan con estos filtros.</p>')
    out.append('</section>')
    out.append('<!-- CONTENT-FILTERS:END -->')
    return "\n".join(out)


# ---------- bloque: grid filtrable de Librería ----------

BOOK_COVER_RE = re.compile(
    r'(<a class="r-book-row" href="([^/"]+)/">\s*<div class="book-cover">)(.*?)(</div>\s*<p class="r-book-title">)',
    re.S,
)


def render_libreria_filterbar(items):
    temas = sorted({t for it in items for t in it["temas"]})
    out = []
    out.append('<!-- CONTENT-FILTERS:START -->')
    out.append('<div class="r-filterbar" data-filter-bar data-filter-target="#libreria-grid">')
    out.append('  <div class="r-filter-group" data-filter-group="idioma">')
    out.append('    <span class="r-filter-group-label">Idioma</span>')
    out.append('    <button type="button" class="r-filter-pill is-active" data-value="todos">Todos</button>')
    out.append('    <button type="button" class="r-filter-pill" data-value="es">🇪🇸 Español</button>')
    out.append('    <button type="button" class="r-filter-pill" data-value="en">🇺🇸 English</button>')
    out.append('  </div>')
    out.append('  <select class="r-filter-select" data-filter-group="tema" aria-label="Filtrar por tema">')
    out.append('    <option value="todos">Todos los temas</option>')
    for t in temas:
        out.append(f'    <option value="{t}">{tema_label(t)}</option>')
    out.append('  </select>')
    out.append('</div>')
    out.append('<p class="r-filter-empty" hidden>No hay libros que coincidan con estos filtros.</p>')
    out.append('<!-- CONTENT-FILTERS:END -->')
    return "\n".join(out)


# ---------- bloque: novedades combinadas (portada) ----------

SECCION_LABEL = {"recursos": "Recursos", "libreria": "Librería"}


def render_novedades_block(combined, n=6):
    out = ['<!-- NOVEDADES:START -->']
    out.append('<section class="novedades" id="novedades">')
    out.append('  <div class="sections-head">')
    out.append('    <h2>Novedades</h2>')
    out.append('    <span>lo último agregado</span>')
    out.append('  </div>')
    out.append('  <div class="novedades-grid">')
    for it in combined[:n]:
        seccion_path = "biblia" if it["seccion"] == "biblia" else it["seccion"]
        href = it["url"].lstrip("/")
        out.append(
            f'    <a class="novedad-card" href="{href}">'
            f'<span class="novedad-seccion">{SECCION_LABEL.get(it["seccion"], it["seccion"])}</span>'
            f'<span class="novedad-title">{esc(it["titulo"])}</span>'
            f'<span class="novedad-date">{fmt_fecha_corta(it["fecha_agregado"])}</span>'
            f'</a>'
        )
    out.append('  </div>')
    out.append('</section>')
    out.append('<!-- NOVEDADES:END -->')
    return "\n".join(out)


# ============================================================
# 4. MATTHEW HENRY — 66 páginas lector + 1 selector, dentro de Librería,
#    leyendo directamente el JSON que ya usa el panel de Comentario
#    (biblia/modules/commentaries/matthew-henry-en/books/*.json).
#    No se duplica contenido: mismo archivo, dos puntos de entrada.
# ============================================================

MH_MODULE = ROOT / "biblia" / "modules" / "commentaries" / "matthew-henry-en"
MH_OUT = LIBRERIA / "matthew-henry"

NAV_SVG = {
    "biblia": '<path d="M12 5C10 3.5 6.5 3 4 3.5v15c2.5-.5 6 0 8 1.5m0-15c2-1.5 5.5-2 8-1.5v15c-2.5-.5-6 0-8 1.5m0-15v15"/>',
    "libreria": '<path d="M4 4h3v16H4zM9 4h3v16H9zM14 5l3-.5 2 15.5-3 .5z"/>',
    "recursos": '<path d="M4 4h16v4H4zM4 10h16v10H4z"/><path d="M9 14h6"/>',
}


def nav_block(root_rel, current):
    items = [("biblia", "Biblia"), ("libreria", "Librería"), ("recursos", "Recursos")]
    out = [f'  <nav class="quick-nav" aria-label="Otras áreas de Verbo">']
    for key, label in items:
        cur = ' class="is-current"' if key == current else ""
        out.append(f'    <a href="{root_rel}{key}/"{cur}>')
        out.append(f'      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">{NAV_SVG[key]}</svg>')
        out.append(f'      {label}')
        out.append('    </a>')
    out.append('  </nav>')
    return "\n".join(out)


def page_shell(root_rel, title, description, back_href, back_label, body_html, extra_head="",
                body_class="static-page recursos-page recursos-index"):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://verbobiblia.com/libreria/matthew-henry/">
<link rel="manifest" href="{root_rel}biblia/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="{root_rel}biblia/assets/icons/icon-192.png">
<link rel="apple-touch-icon" href="{root_rel}biblia/assets/icons/icon-192.png">
<meta name="theme-color" content="#7f2d35">
<link rel="stylesheet" href="{root_rel}biblia/assets/style.css?v=20260730">
<link rel="stylesheet" href="{root_rel}recursos/assets/recursos.css?v=20260813-compact-catalog-headings">
{extra_head}</head>
<body class="{body_class}">

  <header class="static-page__header">
    <a class="static-page__brand" href="{root_rel}">Verbo</a>
    <a class="static-page__back" href="{back_href}">← {back_label}</a>
  </header>

{nav_block(root_rel, "libreria")}

{body_html}
</body>
</html>
"""


def generate_matthew_henry():
    manifest = json.loads((MH_MODULE / "manifest.json").read_text(encoding="utf-8"))
    books = manifest["books"]
    OT_COUNT = 39
    MH_OUT.mkdir(exist_ok=True)

    # ---- índice: selector de 66 libros, agrupado AT/NT ----
    def book_rows(subset):
        rows = []
        for b in subset:
            slug = slugify(b["name"])
            rows.append(f'      <a class="r-article-row" href="{slug}/"><span class="r-article-row-title">{esc(b["name"])}</span></a>')
        return "\n".join(rows)

    body = f'''  <main class="static-page__main recursos-index">
    <span class="r-eyebrow">Librería · Matthew Henry</span>
    <h1>Comentario Bíblico de Matthew Henry</h1>
    <p class="r-lede">Comentario completo, versículo a versículo, de toda la Biblia (1708–1714). Mismo texto que el panel de Comentario en la Biblia — aquí en modo lectura continua, libro por libro. En inglés, dominio público.</p>

    <div class="r-section-label"><h2>Antiguo Testamento</h2></div>
    <div class="r-article-list">
{book_rows(books[:OT_COUNT])}
    </div>

    <div class="r-section-label"><h2>Nuevo Testamento</h2></div>
    <div class="r-article-list">
{book_rows(books[OT_COUNT:])}
    </div>
  </main>'''

    html = page_shell(
        root_rel="../../",
        title="Comentario Bíblico de Matthew Henry | Librería | Verbo",
        description="Comentario completo de Matthew Henry sobre toda la Biblia, libro por libro, en modo lectura.",
        back_href="../",
        back_label="Librería",
        body_html=body,
    )
    (MH_OUT / "index.html").write_text(html, encoding="utf-8")

    # ---- 66 páginas lector ----
    for b in books:
        slug = slugify(b["name"])
        d = MH_OUT / slug
        d.mkdir(exist_ok=True)
        cfg = {
            "id": f"matthew-henry-{slug}",
            "title": f"Matthew Henry — {b['name']}",
            "author": "Matthew Henry (1662–1714)",
            "dataUrl": f"../../../biblia/modules/commentaries/matthew-henry-en/{b['file']}",
            "dataKey": "entries",
            "textField": "content",
            "titleField": "title",
            "unitLabel": "Entrada",
            "htmlSource": True,
        }
        body = f'''  <main class="static-page__main">
    <div class="reader" id="reader-root"></div>
  </main>

  <script>
    window.__LIBRERIA_BOOK__ = {json.dumps(cfg, ensure_ascii=False, indent=2)};
  </script>
  <script src="../../assets/reader.js?v=7"></script>'''
        html = page_shell(
            root_rel="../../../",
            title=f"Matthew Henry — {b['name']} | Librería | Verbo",
            description=f"Comentario de Matthew Henry sobre {b['name']}, versículo a versículo.",
            back_href="../",
            back_label="Matthew Henry",
            body_html=body,
            extra_head='<link rel="stylesheet" href="../../assets/reader.css?v=7">\n',
            body_class="static-page recursos-page",
        )
        (d / "index.html").write_text(html, encoding="utf-8")

    print(f"Matthew Henry: generadas {len(books)} páginas lector + 1 índice en {MH_OUT.relative_to(ROOT)}/")


# ============================================================
# main
# ============================================================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply-articles", action="store_true", help="Actualiza también el bloque filtrable del índice vivo de Artículos")
    args = parser.parse_args()
    approx_flags = []
    articulos = build_articulos(approx_flags)
    escuela = build_escuela_dominical()
    libreria = build_libreria()

    recursos_json = articulos + escuela
    ids = [it["id"] for it in recursos_json + libreria]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise SystemExit(f"IDs duplicados entre recursos/libreria: {dupes}")

    (RECURSOS / "data").mkdir(exist_ok=True)
    (LIBRERIA / "data").mkdir(exist_ok=True)
    (RECURSOS / "data" / "recursos.json").write_text(
        json.dumps(recursos_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (LIBRERIA / "data" / "libreria.json").write_text(
        json.dumps(libreria, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # pendientes: solo se escribe el archivo si hay algo pendiente de verdad
    # (si no, no se recrea clasificacion-pendiente-revision.md tras borrarlo).
    pendientes_path = ROOT / "clasificacion-pendiente-revision.md"
    if any(it.get("pendiente_revision") for it in articulos):
        lines = [
            "# Clasificación pendiente de revisión\n",
            "Piezas donde la línea entre Artículo/Reflexión no fue clara por definición",
            "estricta (ver AGENTS.md / tarea de taxonomía). Se les asignó un `tipo` por",
            "defecto para que el filtro funcione, marcado con `pendiente_revision: true`",
            "en `recursos/data/recursos.json`. Confirmar o corregir con Juan.\n",
        ]
        for it in articulos:
            if it.get("pendiente_revision"):
                lines.append(f"## {it['titulo']} (`{it['id']}`)")
                lines.append(f"- Asignado por defecto: **{it['tipo']}**")
                lines.append(f"- Motivo de la duda: {it['nota_pendiente']}")
                lines.append(f"- Revisar en: {it['url']}\n")
        pendientes_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    elif pendientes_path.exists():
        pendientes_path.unlink()

    # novedades combinadas
    combined = sorted(recursos_json + libreria, key=lambda it: it["fecha_agregado"], reverse=True)
    BUILD.mkdir(exist_ok=True)
    (BUILD / "novedades.json").write_text(
        json.dumps(combined[:12], ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    articles_block = render_articulos_block(articulos)
    (BUILD / "articulos_list.html").write_text(articles_block + "\n", encoding="utf-8")
    if args.apply_articles:
        index_path = RECURSOS / "articulos-y-reflexiones" / "index.html"
        index_html = index_path.read_text(encoding="utf-8")
        pattern = re.compile(r'<!-- CONTENT-FILTERS:START -->.*?<!-- CONTENT-FILTERS:END -->', re.S)
        if len(pattern.findall(index_html)) != 1:
            raise SystemExit("No se encontró exactamente un bloque CONTENT-FILTERS en el índice")
        index_html = pattern.sub(articles_block, index_html)
        index_html = re.sub(
            r'(<div class="r-section-label"><h2>)\d+( <span data-i18n="articulosIndex\.piezas">)',
            rf'\g<1>{len(articulos)}\g<2>', index_html, count=1,
        )
        index_path.write_text(index_html, encoding="utf-8")
        print(f"Aplicado: {index_path.relative_to(ROOT)} ({len(articulos)} piezas)")

        # La portada de Recursos conserva cifras visibles, pero nunca
        # hardcodeadas sin control: se actualizan en build desde los mismos
        # inventarios que alimentan el catálogo. No añade fetch ni JS en vivo.
        recursos_index_path = RECURSOS / "index.html"
        recursos_index = recursos_index_path.read_text(encoding="utf-8")

        def update_card_count(source, count, noun):
            nonlocal recursos_index
            pattern = re.compile(
                rf'(<a class="r-card"[^>]*data-count-source="{re.escape(source)}"[^>]*>)(.*?)(</a>)',
                re.S,
            )
            matches = pattern.findall(recursos_index)
            if len(matches) != 1:
                raise SystemExit(f"No se encontró exactamente una tarjeta de conteo: {source}")
            recursos_index = pattern.sub(
                lambda m: m.group(1) + re.sub(rf'\d+\s+{noun}', f'{count} {noun}', m.group(2)) + m.group(3),
                recursos_index,
                count=1,
            )

        update_card_count("escuela-dominical", len(escuela), "lecciones")
        update_card_count("articulos-y-reflexiones", len(articulos), "piezas")
        recursos_index_path.write_text(recursos_index, encoding="utf-8")
        print(f"Aplicado: {recursos_index_path.relative_to(ROOT)} ({len(escuela)} lecciones, {len(articulos)} piezas)")
    (BUILD / "libreria_filterbar.html").write_text(render_libreria_filterbar(libreria) + "\n", encoding="utf-8")
    (BUILD / "novedades_section.html").write_text(render_novedades_block(combined) + "\n", encoding="utf-8")

    generate_matthew_henry()

    print(f"Artículos y Reflexiones: {len(articulos)} ({sum(1 for i in articulos if i['tipo']=='devocional-reflexion')} devocional/reflexión, "
          f"{sum(1 for i in articulos if i['tipo']=='articulo')} artículo, "
          f"{sum(1 for i in articulos if i.get('pendiente_revision'))} pendientes)")
    print(f"  categoria: {sum(1 for i in articulos if i['categoria']=='devocional')} devocional, "
          f"{sum(1 for i in articulos if i['categoria']=='estudio')} estudio")
    print(f"Escuela Dominical: {len(escuela)} lecciones")
    print(f"Librería: {len(libreria)} entradas")
    print(f"Fechas aproximadas (solo mes/año en el badge original): {len(approx_flags)}")
    print("Escrito: recursos/data/recursos.json, libreria/data/libreria.json, "
          "clasificacion-pendiente-revision.md, build/novedades.json")


if __name__ == "__main__":
    main()
