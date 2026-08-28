#!/usr/bin/env python3

import json
import unittest
from pathlib import Path

from ensamblador import ranges_overlap

HERE = Path(__file__).resolve().parent
DATA = HERE / "data"


class RangeOverlapTests(unittest.TestCase):
    def test_same_chapter_partial_overlap(self):
        self.assertTrue(ranges_overlap(5, 1, 5, 11, 5, 10, 5, 20))

    def test_contained_range(self):
        self.assertTrue(ranges_overlap(5, 1, 6, 20, 5, 3, 5, 7))

    def test_cross_chapter_overlap(self):
        self.assertTrue(ranges_overlap(4, 20, 5, 5, 5, 1, 6, 2))

    def test_touching_endpoint(self):
        self.assertTrue(ranges_overlap(2, 1, 2, 12, 2, 12, 2, 20))

    def test_disjoint_ranges(self):
        self.assertFalse(ranges_overlap(2, 1, 2, 12, 2, 13, 3, 1))


class PilotOutputTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rom = json.loads((DATA / "ensamblado-rom-5-1-11.json").read_text())
        cls.mat = json.loads((DATA / "ensamblado-mat-2-1-12.json").read_text())
        cls.psa = json.loads((DATA / "ensamblado-psa-23-1-6.json").read_text())

    def test_required_contract(self):
        for result in (self.rom, self.mat, self.psa):
            self.assertEqual(set(result), {"pasaje", "diccionario", "historia", "costumbres"})
            for item in result["historia"]:
                self.assertTrue(item["texto"])
                self.assertTrue(item["fuente"]["modulo"])
                self.assertTrue(item["fuente"]["libroSeccion"])
            for item in result["costumbres"]:
                self.assertTrue(item["texto"])
                self.assertTrue(item["fuente"]["modulo"])
                self.assertTrue(item["fuente"]["entradaId"])

    def test_dictionary_uses_real_headwords(self):
        easton = {
            entry["titulo"] for entry in json.loads(
                (HERE.parents[1] / "biblia/modules/diccionarios/easton-bible-dictionary/entries.json").read_text()
            )["entries"]
        }
        smith = {
            entry["titulo"] for entry in json.loads(
                (HERE.parents[1] / "biblia/modules/diccionarios/smith-bible-dictionary/entries.json").read_text()
            )["entries"]
        }
        dictionaries = {"Easton": easton, "Smith": smith}
        for result in (self.rom, self.mat, self.psa):
            for item in result["diccionario"]:
                source = item["fuente"]
                self.assertEqual(item["termino"], source["headword"])
                self.assertIn(source["headword"], dictionaries[source["modulo"]])

    def test_matthew_herod_entries_are_real_and_high(self):
        sections = {item["fuente"]["libroSeccion"] for item in self.mat["historia"]}
        self.assertIn("I.6", sections)
        self.assertIn("I.8", sections)

    def test_psalm_expected_empty_broad_history(self):
        self.assertEqual(self.psa["historia"], [])
        self.assertEqual(len(self.psa["costumbres"]), 1)
        self.assertEqual(self.psa["costumbres"][0]["fuente"]["modulo"], "freeman-manners-customs")


if __name__ == "__main__":
    unittest.main()
