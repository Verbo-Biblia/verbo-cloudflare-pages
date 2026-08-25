#!/usr/bin/env python3
"""Build the "Smith's Bible Dictionary" (William Smith, 1863, public domain)
costumbres module from CCEL's ThML XML.

Same reproducible spirit as tools/build_easton.py: acquisition (fetch +
cache), cleaning and segmentation are kept as separate, auditable steps.
Only stdlib is used.

Source: https://ccel.org/ccel/smith_w/bibledict.xml — ThML document, entries
laid out as <div2 title="A">...<glossary><term>Word</term><def><p>...</p>
</def><term>Next</term><def>...</def>...</glossary></div2> for each letter
A-Z (same shape as Easton's ebd2.xml). One trailing div2 ("Index of
Scripture References") is a cross-reference table, not dictionary entries,
and is skipped.
"""
from __future__ import annotations

import html
import json
import re
import time
import urllib.request
from pathlib import Path

SOURCE_URL = "https://ccel.org/ccel/smith_w/bibledict.xml"
CACHE_FILE = Path(__file__).parent / ".cache" / "smith" / "bibledict.xml"
OUT_DIR = Path(__file__).parent.parent / "biblia" / "modules" / "costumbres" / "smith-bible-dictionary"
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
                    'id': f'smith-{n}',
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
        'id': 'smith-bible-dictionary',
        'type': 'costumbres',
        'name': "Smith's Bible Dictionary",
        'abbreviation': 'Smith, Diccionario Bíblico',
        'language': 'en',
        'author': 'William Smith',
        'year': 1863,
        'categoria': 'diccionario_biblico',
        'navegacion': 'tematico',
        'description': (
            "A Dictionary of the Bible de William Smith (1863), "
            f"{len(entries)} entradas de la A a la Z sobre personas, lugares, "
            "objetos y términos bíblicos — uno de los diccionarios bíblicos "
            "más influyentes del s. XIX. Dominio público. El texto se muestra "
            "en inglés y se traduce automáticamente al español en tiempo de "
            "lectura (igual que Matthew Henry / Historia de la Iglesia)."
        ),
        'license': 'Dominio público (1863).',
        'sourceUrl': 'https://ccel.org/ccel/smith_w/bibledict',
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
