"""Interpretación conservadora de los códigos morfológicos TAHOT/TAGNT.

El código crudo siempre es la autoridad. Una interpretación se marca completa
solo cuando todos los componentes relevantes pertenecen al esquema conocido.
"""

HE = {
    "pos": {"A": ("adjetivo", "adjective"), "C": ("conjunción", "conjunction"), "D": ("adverbio", "adverb"),
            "N": ("sustantivo", "noun"), "P": ("pronombre", "pronoun"), "R": ("preposición", "preposition"),
            "S": ("sufijo", "suffix"), "T": ("partícula", "particle"), "V": ("verbo", "verb")},
    "gender": {"m": ("masculino", "masculine"), "f": ("femenino", "feminine"), "b": ("ambos géneros", "both genders"), "c": ("género común", "common gender")},
    "number": {"s": ("singular", "singular"), "p": ("plural", "plural"), "d": ("dual", "dual")},
    "state": {"a": ("absoluto", "absolute"), "c": ("constructo", "construct"), "d": ("determinado", "determined")},
    "stem": {"q": ("qal", "qal"), "N": ("nifal", "niphal"), "p": ("piel", "piel"), "P": ("pual", "pual"),
             "h": ("hifil", "hiphil"), "H": ("hofal", "hophal"), "t": ("hitpael", "hithpael"), "o": ("polel", "polel"),
             "O": ("polal", "polal"), "r": ("hitpolel", "hithpolel"), "m": ("poel", "poel"), "M": ("poal", "poal"),
             "k": ("palel", "palel"), "K": ("pulal", "pulal"), "Q": ("qal pasivo", "qal passive"), "l": ("pilpel", "pilpel"),
             "L": ("polpal", "polpal"), "f": ("hitpalpel", "hithpalpel"), "D": ("nifal", "niphal"), "j": ("peal", "peal"),
             "e": ("itpaal", "ithpaal"), "i": ("afel", "aphel"), "u": ("hofal", "hophal"), "c": ("shafel", "shaphel"),
             "v": ("ishtaafel", "ishtaphel"), "w": ("hitafel", "hithaphel"), "y": ("poel", "poel"), "z": ("itpoel", "ithpoel")},
    "conjugation": {"p": ("perfecto", "perfect"), "q": ("perfecto consecutivo", "sequential perfect"), "i": ("imperfecto", "imperfect"),
                    "w": ("imperfecto consecutivo", "sequential imperfect"), "h": ("cohortativo", "cohortative"), "j": ("yusivo", "jussive"),
                    "v": ("imperativo", "imperative"), "r": ("participio activo", "active participle"), "s": ("participio pasivo", "passive participle"),
                    "a": ("infinitivo absoluto", "infinitive absolute"), "c": ("infinitivo constructo", "infinitive construct")},
}

GR = {
    "pos": {"A": ("adjetivo", "adjective"), "ADV": ("adverbio", "adverb"), "C": ("pronombre recíproco", "reciprocal pronoun"),
            "COND": ("condicional", "conditional"), "CONJ": ("conjunción", "conjunction"), "D": ("pronombre demostrativo", "demonstrative pronoun"),
            "F": ("pronombre reflexivo", "reflexive pronoun"), "HEB": ("forma hebrea", "Hebrew form"), "I": ("pronombre interrogativo", "interrogative pronoun"),
            "INJ": ("interjección", "interjection"), "K": ("pronombre correlativo", "correlative pronoun"), "N": ("sustantivo", "noun"),
            "P": ("pronombre personal", "personal pronoun"), "PREP": ("preposición", "preposition"), "PRT": ("partícula", "particle"),
            "Q": ("pronombre interrogativo/correlativo", "interrogative/correlative pronoun"), "R": ("pronombre relativo", "relative pronoun"),
            "S": ("pronombre posesivo", "possessive pronoun"), "T": ("artículo", "article"), "V": ("verbo", "verb"),
            "X": ("pronombre indefinido", "indefinite pronoun")},
    "case": {"N": ("nominativo", "nominative"), "G": ("genitivo", "genitive"), "D": ("dativo", "dative"), "A": ("acusativo", "accusative"), "V": ("vocativo", "vocative")},
    "number": {"S": ("singular", "singular"), "P": ("plural", "plural")},
    "gender": {"M": ("masculino", "masculine"), "F": ("femenino", "feminine"), "N": ("neutro", "neuter")},
    "tense": {"P": ("presente", "present"), "I": ("imperfecto", "imperfect"), "F": ("futuro", "future"), "A": ("aoristo", "aorist"),
              "X": ("perfecto", "perfect"), "Y": ("pluscuamperfecto", "pluperfect"), "L": ("pluscuamperfecto", "pluperfect"),
              "2A": ("segundo aoristo", "second aorist"), "2F": ("segundo futuro", "second future"), "2X": ("segundo perfecto", "second perfect"), "2Y": ("segundo pluscuamperfecto", "second pluperfect")},
    "voice": {"A": ("voz activa", "active voice"), "M": ("voz media", "middle voice"), "P": ("voz pasiva", "passive voice"),
              "E": ("voz media o pasiva", "middle or passive voice"), "D": ("deponente media", "middle deponent"),
              "O": ("deponente pasiva", "passive deponent"), "N": ("deponente media/pasiva", "middle/passive deponent")},
    "mood": {"I": ("indicativo", "indicative"), "S": ("subjuntivo", "subjunctive"), "O": ("optativo", "optative"),
             "M": ("imperativo", "imperative"), "N": ("infinitivo", "infinitive"), "P": ("participio", "participle")},
}


def localized(items, index):
    return [item[index] if isinstance(item, tuple) else item for item in items]


def parse_hebrew(code):
    parts = code.split("/")
    es, en, unknown = [], [], []
    for index, raw in enumerate(parts):
        part = raw
        if part and part[0] in "HA":
            language = part[0]
            part = part[1:]
            if language == "A":
                es.append("arameo"); en.append("Aramaic")
        if not part:
            unknown.append(raw); continue
        pos = part[0]
        if pos not in HE["pos"]:
            unknown.append(raw); continue
        es.append(HE["pos"][pos][0]); en.append(HE["pos"][pos][1])
        tail = part[1:]
        if pos == "V" and len(tail) >= 2:
            stem, conjugation, rest = tail[0], tail[1], tail[2:]
            if stem in HE["stem"]: es.append(HE["stem"][stem][0]); en.append(HE["stem"][stem][1])
            else: unknown.append(f"stem:{stem}")
            if conjugation in HE["conjugation"]: es.append(HE["conjugation"][conjugation][0]); en.append(HE["conjugation"][conjugation][1])
            else: unknown.append(f"conjugation:{conjugation}")
            if rest and rest[0] in "123":
                es.append(f"{rest[0]}.ª persona"); en.append(f"{rest[0]} person")
                rest = rest[1:]
            for char, table in zip(rest[-3:], (HE["gender"], HE["number"], HE["state"])) if len(rest) >= 3 else []:
                if char in table: es.append(table[char][0]); en.append(table[char][1])
        elif pos in "AN" and len(tail) >= 3:
            for char, table in zip(tail[-3:], (HE["gender"], HE["number"], HE["state"])):
                if char in table: es.append(table[char][0]); en.append(table[char][1])
                else: unknown.append(char)
        elif pos in "SP" and tail:
            rest = tail[1:] if len(tail) > 1 else ""
            if rest and rest[0] in "123": es.append(f"{rest[0]}.ª persona"); en.append(f"{rest[0]} person"); rest=rest[1:]
            if len(rest) >= 2:
                for char, table in ((rest[-2], HE["gender"]), (rest[-1], HE["number"])):
                    if char in table: es.append(table[char][0]); en.append(table[char][1])
    return {"recognized": not unknown, "es": es, "en": en, "unknown": unknown}


def parse_greek(code):
    chunks = code.split("-")
    pos = chunks[0]
    es, en, unknown = [], [], []
    if pos not in GR["pos"]:
        return {"recognized": False, "es": [], "en": [], "unknown": [pos]}
    es.append(GR["pos"][pos][0]); en.append(GR["pos"][pos][1])
    if pos == "V" and len(chunks) >= 2:
        form = chunks[1]
        tense = form[:-2]
        voice = form[-2:-1]
        mood = form[-1:] or ""
        for value, table, name in ((tense, GR["tense"], "tense"), (voice, GR["voice"], "voice"), (mood, GR["mood"], "mood")):
            if value in table: es.append(table[value][0]); en.append(table[value][1])
            elif value: unknown.append(f"{name}:{value}")
        tail = chunks[2:]
    else:
        tail = chunks[1:]
    for chunk in tail:
        if chunk in {"1", "2", "3"}: es.append(f"{chunk}.ª persona"); en.append(f"{chunk} person"); continue
        if len(chunk) == 2 and chunk[0] in "123" and chunk[1] in GR["number"]:
            es.extend([f"{chunk[0]}.ª persona", GR["number"][chunk[1]][0]]); en.extend([f"{chunk[0]} person", GR["number"][chunk[1]][1]]); continue
        if len(chunk) >= 3 and chunk[0] in GR["case"] and chunk[1] in GR["number"] and chunk[2] in GR["gender"]:
            es.extend([GR["case"][chunk[0]][0], GR["number"][chunk[1]][0], GR["gender"][chunk[2]][0]])
            en.extend([GR["case"][chunk[0]][1], GR["number"][chunk[1]][1], GR["gender"][chunk[2]][1]])
            # Sufijos P/L/T/G y similares son clasificaciones semánticas de nombres.
            continue
        if chunk in {"N", "C", "S", "PRI", "LI", "NUI", "HEB", "ARAM", "ATT"}: continue
        unknown.append(chunk)
    return {"recognized": not unknown, "es": es, "en": en, "unknown": unknown}


def parse_morphology(code, scheme):
    result = parse_hebrew(code) if scheme == "step-hebrew" else parse_greek(code)
    result.update({"code": code, "scheme": scheme})
    return result
