#!/usr/bin/env python3
"""Build the "Easton's Bible Dictionary" (M.G. Easton, 1897, public domain)
costumbres module from CCEL's ThML XML.

Same reproducible spirit as tools/build_npnf105_augustine_antipelagian.py:
acquisition (fetch + cache), cleaning and segmentation are kept as separate,
auditable steps. Only stdlib is used.

Source: https://ccel.org/ccel/easton/ebd2.xml — ThML document, entries laid
out as <div2 title="A">...<glossary><term>Word</term><def><p>...</p></def>
<term>Next</term><def>...</def>...</glossary></div2> for each letter A-Z.
Two trailing div2 sections ("Index of Scripture References", "Index of
Scripture Commentary") are cross-reference tables, not dictionary entries,
and are skipped.
"""
from __future__ import annotations

import html
import json
import re
import time
import urllib.request
from pathlib import Path

SOURCE_URL = "https://ccel.org/ccel/easton/ebd2.xml"
CACHE_FILE = Path(__file__).parent / ".cache" / "easton" / "ebd2.xml"
OUT_DIR = Path(__file__).parent.parent / "biblia" / "modules" / "costumbres" / "easton-bible-dictionary"
USER_AGENT = "VerboBiblia/1.0 (open public-domain Bible reader; contact: juanjosevenegas78@gmail.com)"

LETTER_TITLES = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")

DIV2_RE = re.compile(r'<div2 title="([^"]*)"[^>]*>(.*?)</div2>', re.S)
TERM_OR_DEF_RE = re.compile(r'<term[^>]*>(.*?)</term>|<def[^>]*>(.*?)</def>', re.S)

TAG_A_RE = re.compile(r'<a\b[^>]*>(.*?)</a>', re.S)
TAG_SCRIPREF_RE = re.compile(r'<scripRef\b[^>]*>(.*?)</scripRef>', re.S)
TAG_SCRIPCOM_SELFCLOSE_RE = re.compile(r'<scripCom\b[^>]*/>')
TAG_SCRIPCOM_RE = re.compile(r'<scripCom\b[^>]*>(.*?)</scripCom>', re.S)
TAG_I_OPEN_RE = re.compile(r'<i\b[^>]*>')
TAG_I_CLOSE_RE = re.compile(r'</i>')
TAG_BR_RE = re.compile(r'<br\s*/?>')
TAG_P_ATTR_RE = re.compile(r'<p\b[^>]*>')
ANY_TAG_RE = re.compile(r'<[^>]+>')
WS_RE = re.compile(r'[ \t\r\f\v]+')
MULTI_NEWLINE_RE = re.compile(r'\n{2,}')


def fetch_source() -> str:
    if CACHE_FILE.exists():
        return CACHE_FILE.read_text(encoding='utf-8')
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(SOURCE_URL, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read().decode('utf-8')
    CACHE_FILE.write_text(data, encoding='utf-8')
    time.sleep(1)
    return data


def clean_inline(fragment: str) -> str:
    """Unwrap known inline tags to their visible text, keep <p>/<br>/<em>."""
    fragment = TAG_SCRIPREF_RE.sub(lambda m: m.group(1), fragment)
    fragment = TAG_SCRIPCOM_SELFCLOSE_RE.sub('', fragment)
    fragment = TAG_SCRIPCOM_RE.sub(lambda m: m.group(1), fragment)
    fragment = TAG_A_RE.sub(lambda m: m.group(1), fragment)
    fragment = TAG_I_OPEN_RE.sub('<em>', fragment)
    fragment = TAG_I_CLOSE_RE.sub('</em>', fragment)
    fragment = TAG_BR_RE.sub('<br>', fragment)
    fragment = TAG_P_ATTR_RE.sub('<p>', fragment)
    fragment = html.unescape(fragment)
    fragment = WS_RE.sub(' ', fragment)
    fragment = MULTI_NEWLINE_RE.sub('\n', fragment)
    return fragment.strip()


def plain_text(html_fragment: str) -> str:
    text = ANY_TAG_RE.sub(' ', html_fragment)
    text = html.unescape(text)
    text = WS_RE.sub(' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def make_excerpt(plain: str, limit: int = 280) -> str:
    if len(plain) <= limit:
        return plain
    cut = plain[:limit]
    last_space = cut.rfind(' ')
    if last_space > 0:
        cut = cut[:last_space]
    return cut + '…'


def clean_term(raw: str) -> str:
    text = ANY_TAG_RE.sub('', raw)
    text = html.unescape(text)
    return WS_RE.sub(' ', text).strip()


def parse_entries(xml_text: str) -> list[dict]:
    entries = []
    n = 0
    for title, body in DIV2_RE.findall(xml_text):
        if title not in LETTER_TITLES:
            continue
        pending_term = None
        for term_match, def_match in TERM_OR_DEF_RE.findall(body):
            if term_match:
                pending_term = clean_term(term_match)
            elif def_match:
                if pending_term is None:
                    continue
                n += 1
                content_html = clean_inline(def_match)
                plain = plain_text(content_html)
                entries.append({
                    'id': f'easton-{n}',
                    'capituloNumero': n,
                    'capituloTitulo': pending_term,
                    'titulo': pending_term,
                    'excerpt': make_excerpt(plain),
                    'content': content_html,
                })
                pending_term = None
    return entries


def build():
    xml_text = fetch_source()
    entries = parse_entries(xml_text)
    if not entries:
        raise SystemExit('No se extrajo ninguna entrada — revisar el parser.')

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / 'entries.json').write_text(
        json.dumps({'entries': entries}, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8'
    )

    manifest = {
        'schemaVersion': 2,
        'id': 'easton-bible-dictionary',
        'type': 'costumbres',
        'name': "Easton's Bible Dictionary",
        'abbreviation': 'Easton, Diccionario Bíblico',
        'language': 'en',
        'author': 'M.G. Easton',
        'year': 1897,
        'categoria': 'diccionario_biblico',
        'navegacion': 'tematico',
        'description': (
            "Illustrated Bible Dictionary de M. G. Easton, 3ª edición (1897, "
            f"póstuma), {len(entries)} entradas de la A a la Z sobre personas, "
            "lugares, objetos y términos bíblicos. Dominio público. El texto se "
            "muestra en inglés y se traduce automáticamente al español en "
            "tiempo de lectura (igual que Matthew Henry / Historia de la Iglesia)."
        ),
        'license': 'Dominio público (1897, 3ª edición).',
        'sourceUrl': 'https://ccel.org/ccel/easton/ebd2',
        'entriesFile': 'entries.json',
        'totalEntries': len(entries),
    }
    (OUT_DIR / 'manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(json.dumps({'entries': len(entries)}, ensure_ascii=False))


if __name__ == '__main__':
    build()
