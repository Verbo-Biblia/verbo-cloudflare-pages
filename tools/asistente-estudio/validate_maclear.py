#!/usr/bin/env python3
"""Valida las fichas de Maclear y su proyección exhaustiva en los paquetes."""
import hashlib
import json
from collections import Counter
from pathlib import Path
from build_paquetes_asistente import load_books

ROOT = Path(__file__).resolve().parents[2]
MODULE = 'maclear-class-book-ot-history'

def read(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            assert key not in result, f'Clave duplicada: {path}: {key}'
            result[key] = value
        return result
    return json.loads(path.read_text(), object_pairs_hook=unique)

def main():
    cards = read(ROOT / 'tools/asistente-estudio/data/historia-at-maclear.json')['cards']
    by_id = {card['id']: card for card in cards}
    assert len(cards) == len(by_id) == 17
    entries = read(ROOT / f'biblia/modules/church-history/{MODULE}/entries.json')['entries']
    assert len(entries) == len({e['id'] for e in entries}) == 74
    entry_ids = {e['id'] for e in entries}
    books = dict(load_books())
    expected = {}
    for card in cards:
        p = card['passage']
        assert card['reviewStatus'] == 'APPROVED'
        assert card['sourceEntryId'] in entry_ids
        assert card['text'].strip() and card['translations']['en'].strip()
        assert '\ufffd' not in card['text'] + card['translations']['en']
        start = (p['chapterStart'], p['verseStart'])
        end = (p['chapterEnd'], p['verseEnd'])
        assert start <= end
        for chapter, verse in (start, end):
            assert verse in books[p['book']][chapter][0]
        expected[card['id']] = {
            (p['book'], chapter, verse)
            for chapter, (verses, _) in books[p['book']].items()
            for verse in verses if start <= (chapter, verse) <= end
        }
    paths = list((ROOT / 'biblia/modules/study-assistant/chapters').glob('*/*.json'))
    assert len(paths) == 1189
    expected_chapters = {(b, c) for b, chapters in books.items() for c in chapters}
    actual_chapters = set()
    appearances = {identifier: set() for identifier in by_id}
    categories = ('diccionario', 'historia', 'costumbres')
    occurrences = Counter()
    for path in paths:
        package = read(path)
        book, chapter = package['book'], package['chapter']
        assert path.parent.name == book and path.stem == str(chapter)
        assert (book, chapter) not in actual_chapters
        actual_chapters.add((book, chapter))
        assert set(map(int, package['verses'])) == set(books[book][chapter][0])
        for category in categories:
            resources = package['resources'][category]
            used = set()
            for verse, refs in package['verses'].items():
                identifiers = refs[category]
                assert len(identifiers) == len(set(identifiers))
                for identifier in identifiers:
                    assert identifier in resources
                    used.add(identifier)
                    resource = resources[identifier]
                    source = resource['fuente']
                    if source['modulo'] == MODULE:
                        assert category == 'historia'
                        card = by_id[source['fichaId']]
                        assert source['entradaId'] == card['sourceEntryId']
                        assert source['recursoId'] == card['id']
                        assert resource['texto'] == card['text']
                        assert resource['traducciones'] == card['translations']
                        assert resource['tipo'] == card['relationType'].lower().replace('_', '-')
                        assert resource['traduccion'] == {
                            'resourceId': card['id'], 'sourceLanguage': 'es',
                            'sourceHash': hashlib.sha256(card['text'].encode()).hexdigest(),
                        }
                        appearances[card['id']].add((book, chapter, int(verse)))
            assert used == set(resources), f'Recursos sin uso: {path} / {category}'
            for resource in resources.values():
                occurrences[resource['fuente']['modulo']] += 1
    assert actual_chapters == expected_chapters
    assert appearances == expected, 'Fichas ausentes o fuera de rango'
    catalog = read(ROOT / 'cloudflare/api-bible-worker/study-assistant-catalog.json')['resources']
    for card in cards:
        assert catalog[card['id']] == {
            'sourceLanguage': 'es',
            'sourceHash': hashlib.sha256(card['text'].encode()).hexdigest(),
        }
    print(json.dumps({'packages': len(paths), 'cards': len(cards),
        'verseAppearances': sum(map(len, appearances.values())),
        'maclearChapterResources': occurrences[MODULE],
        'sayceChapterResources': occurrences['sayce-patriarchal-palestine'],
        'councilChapterResources': occurrences['npnf214-concilios-ecumenicos'],
        'status': 'PASS'}, indent=2))

if __name__ == '__main__':
    main()
