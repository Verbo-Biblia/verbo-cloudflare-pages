#!/usr/bin/env python3
"""Importa TAHOT/TAGNT al formato capitular y estático de Verbo."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from original_language_morphology import parse_morphology

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STEP = ROOT.parent / "Archivos Verbo/STEPBible-Data-master"
DEFAULT_OUT = ROOT / "biblia/modules/original-languages"
BOOK_IDS = {
    "Gen":"GEN","Exo":"EXO","Lev":"LEV","Num":"NUM","Deu":"DEU","Jos":"JOS","Jdg":"JDG","Rut":"RUT","1Sa":"1SA","2Sa":"2SA","1Ki":"1KI","2Ki":"2KI","1Ch":"1CH","2Ch":"2CH","Ezr":"EZR","Neh":"NEH","Est":"EST","Job":"JOB","Psa":"PSA","Pro":"PRO","Ecc":"ECC","Sng":"SNG","Isa":"ISA","Jer":"JER","Lam":"LAM","Ezk":"EZK","Dan":"DAN","Hos":"HOS","Jol":"JOL","Amo":"AMO","Oba":"OBA","Jon":"JON","Mic":"MIC","Nam":"NAH","Hab":"HAB","Zep":"ZEP","Hag":"HAG","Zec":"ZEC","Mal":"MAL",
    "Mat":"MAT","Mrk":"MRK","Luk":"LUK","Jhn":"JHN","Act":"ACT","Rom":"ROM","1Co":"1CO","2Co":"2CO","Gal":"GAL","Eph":"EPH","Php":"PHP","Col":"COL","1Th":"1TH","2Th":"2TH","1Ti":"1TI","2Ti":"2TI","Tit":"TIT","Phm":"PHM","Heb":"HEB","Jas":"JAS","1Pe":"1PE","2Pe":"2PE","1Jn":"1JN","2Jn":"2JN","3Jn":"3JN","Jud":"JUD","Rev":"REV",
}
BOOK_ORDER = list(BOOK_IDS.values())
OT = set(BOOK_ORDER[:39]); NT = set(BOOK_ORDER[39:])
REF = re.compile(r"^((?:[1-3])?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\(([^)]*)\))?#(\d+)=([^\t]+)\t")
CODE = re.compile(r"([HG])0*(\d+)([A-Z]*)", re.I)
HEBREW_LEMMA = re.compile(r"\{(H\d+[A-Z]*)(?:#\d+)?=([^=}{]+)=", re.I)
MORPH_LABEL_ES={"Function":"Función","Stem":"Raíz verbal","Action":"Acción","Voice":"Voz","Form":"Forma","Tense":"Tiempo","Mood":"Modo","Person":"Persona","Gender":"Género","Number":"Número","State":"Estado","Case":"Caso","Name type":"Tipo de nombre","Extra":"Detalle"}
MORPH_VALUE_ES={"Verb":"Verbo","Noun":"Sustantivo","Adjective":"Adjetivo","Adverb":"Adverbio","Article":"Artículo","Conjunction":"Conjunción","Preposition":"Preposición","Particle":"Partícula","Personal pronoun":"Pronombre personal","Relative pronoun":"Pronombre relativo","Demonstrative pronoun":"Pronombre demostrativo","Indefinite pronoun":"Pronombre indefinido","Interrogative pronoun":"Pronombre interrogativo","Infinitive":"Infinitivo","Participle":"Participio","Indicative":"Indicativo","Subjunctive":"Subjuntivo","Imperative":"Imperativo","Optative":"Optativo","Active":"Activa","Passive":"Pasiva","Middle":"Media","Present":"Presente","Imperfect":"Imperfecto","Future":"Futuro","Aorist":"Aoristo","Perfect":"Perfecto","Pluperfect":"Pluscuamperfecto","Nominative":"Nominativo","Genitive":"Genitivo","Dative":"Dativo","Accusative":"Acusativo","Vocative":"Vocativo","Singular":"Singular","Plural":"Plural","Dual":"Dual","Masculine":"Masculino","Feminine":"Femenino","Neuter":"Neutro","Common":"Común","Absolute":"Absoluto","Construct":"Constructo","Determined":"Determinado","First":"Primera","Second":"Segunda","Third":"Tercera","Individual":"Persona","Location":"Lugar","Title":"Título"}


def dump(path, value, compact=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":") if compact else None,
                               indent=None if compact else 2) + "\n", encoding="utf-8")


def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").casefold()


def classic_codes(raw, prefix):
    classic, extended = [], []
    maximum = 8674 if prefix == "H" else 5624
    for found_prefix, number, suffix in CODE.findall(raw):
        if found_prefix.upper() != prefix or not 1 <= int(number) <= maximum: continue
        base=f"{prefix}{int(number)}"; ext=f"{base}{suffix.upper()}" if suffix else base
        if base not in classic: classic.append(base)
        if ext not in extended: extended.append(ext)
    return classic, extended


def source_revision(step):
    try:
        commit=subprocess.check_output(["git","-C",str(step),"rev-parse","HEAD"],text=True).strip()
        date=subprocess.check_output(["git","-C",str(step),"show","-s","--format=%cs","HEAD"],text=True).strip()
    except (OSError,subprocess.CalledProcessError): commit,date="unknown","unknown"
    return {"commit":commit,"date":date}


def load_morphology_definitions(step):
    directory=step/"Morphology codes"; definitions={"step-hebrew":{},"step-robinson":{}}
    for scheme,pattern in (("step-hebrew","TEHMC*.txt"),("step-robinson","TEGMC*.txt")):
        paths=list(directory.glob(pattern))
        if len(paths)!=1: raise SystemExit(f"No se encontró una definición única para {scheme}")
        for line in paths[0].open(encoding="utf-8-sig",errors="strict"):
            if "\tFunction=" not in line: continue
            code,expansion=line.rstrip("\r\n").split("\t",1)
            definitions[scheme][code.strip()]=expansion.strip()
    return definitions


def translate_morph_features(expansion):
    en={}; es={}
    for field in expansion.split(";"):
        if "=" not in field: continue
        key,value=(x.strip() for x in field.split("=",1))
        en[key]=value
        translated=value
        for source,target in sorted(MORPH_VALUE_ES.items(),key=lambda x:-len(x[0])):
            translated=re.sub(rf"\b{re.escape(source)}\b",target,translated,flags=re.I)
        es[MORPH_LABEL_ES.get(key,key)]=translated
    return en,es


def morphology_entry(code,scheme,definitions):
    lookup=definitions[scheme]; expansions=[]
    if code in lookup: expansions=[lookup[code]]
    elif scheme=="step-hebrew":
        language=code[0] if code and code[0] in "HA" else "H"
        keys=[]
        first=True
        for alternative in code.split("//"):
            for part in alternative.split("/"):
                keys.append(part if first and part[:1] in "HA" else language+part)
                first=False
        if all(key in lookup for key in keys): expansions=[lookup[key] for key in keys]
    else:
        keys=[]
        for part in code.split(" + "):
            part=re.sub(r"^[GH]\d+[A-Z]*=","",part.strip())
            keys.append(part)
        if all(key in lookup for key in keys): expansions=[lookup[key] for key in keys]
    if expansions:
        features_en=[]; features_es=[]
        for expansion in expansions:
            en,es=translate_morph_features(expansion); features_en.append(en); features_es.append(es)
        return {"code":code,"scheme":scheme,"recognized":True,"sourceExpansion":expansions,"features":{"en":features_en,"es":features_es},"unknown":[]}
    return parse_morphology(code,scheme)


def clean_hebrew_surface(raw):
    value=re.sub(r"\\\s*\\?[פס](?=\s|$)","",raw)
    return value.replace("/","").replace("\\","").strip()


def clean_greek_surface(raw):
    match=re.match(r"^(.*?)\s+\(([^()]*)\)$",raw.strip())
    surface=(match.group(1) if match else raw).replace("[[","").replace("]]","").strip()
    transliteration=(match.group(2) if match else "").strip()
    return surface,transliteration


def greek_main_family(reading):
    """Familia mostrada por defecto: N; K solo en suplementos sin N."""
    main=reading.split("(",1)[0]
    if "N" in main.upper(): return "N"
    if "K" in main.upper(): return "K"
    if "O" in main.upper(): return "O"
    return None


def parse_sources(step, selected_books, selected_chapter=None):
    base=step/"Translators Amalgamated OT+NT"
    paths=sorted(base.glob("TAHOT *.txt"))+sorted(base.glob("TAGNT *.txt"))
    if len(paths)!=6: raise SystemExit(f"Se esperaban 6 fuentes TAHOT/TAGNT y se encontraron {len(paths)}")
    raw=defaultdict(list)
    for path in paths:
        language="el" if path.name.startswith("TAGNT") else "he"
        for line in path.open(encoding="utf-8-sig",errors="strict"):
            match=REF.match(line)
            if not match: continue
            source_book,chapter,verse,alternate,source_position,reading=match.groups()
            book=BOOK_IDS.get(source_book)
            if book not in selected_books or (selected_chapter and int(chapter)!=selected_chapter): continue
            fields=line.rstrip("\r\n").split("\t")
            raw[(book,int(chapter),int(verse),language)].append({"sourcePosition":int(source_position),"reading":reading,"alternateReference":alternate,"fields":fields})
    return raw


def select_greek_rows(rows):
    families={greek_main_family(row["reading"]) for row in rows}
    family="N" if "N" in families else "K" if "K" in families else "O"
    selected=[row for row in rows if greek_main_family(row["reading"])==family]
    # Algunas diferencias minúsculas están solo entre paréntesis, pero no crean
    # otra posición. Completar cualquier hueco con la única fila de esa posición.
    by_position={row["sourcePosition"]:row for row in selected}
    all_by_position=defaultdict(list)
    for row in rows: all_by_position[row["sourcePosition"]].append(row)
    for position,options in all_by_position.items():
        if position not in by_position and len(options)==1: by_position[position]=options[0]
    return [by_position[pos] for pos in sorted(by_position)], family


def token_from_row(book,chapter,verse,position,row,language,policy):
    fields=row["fields"]
    if language=="he":
        if len(fields)<12: raise ValueError(f"Fila TAHOT incompleta en {book}.{chapter}.{verse}")
        surface=clean_hebrew_surface(fields[1]); transliteration=fields[2].strip(); gloss=fields[3].strip(); strong_raw=fields[4]; morph=fields[5].strip(); expanded=fields[11]
        lemmas=[]
        for _,lemma in HEBREW_LEMMA.findall(expanded):
            lemma=lemma.split("»",1)[0].split(":",1)[0].strip()
            if lemma and lemma not in lemmas: lemmas.append(lemma)
        variant_meta={}
        if fields[6].strip(): variant_meta["meaning"]=fields[6].strip()
        if fields[7].strip(): variant_meta["spelling"]=fields[7].strip()
    else:
        if len(fields)<13: raise ValueError(f"Fila TAGNT incompleta en {book}.{chapter}.{verse}")
        surface,transliteration=clean_greek_surface(fields[1]); gloss=fields[2].strip()
        analyses=re.findall(r"([HG]\d+[A-Z]*)=([^+]+?)(?=\s+\+\s+[HG]\d|$)",fields[3])
        if analyses:
            strong_raw=" ".join(item[0] for item in analyses); morph=" + ".join(item[1].strip() for item in analyses)
        else: strong_raw,morph=fields[3].split("=",1)
        lemmas=[x.strip() for x in fields[4].split("=",1)[0].split(",") if x.strip()]
        variant_meta={"editions":fields[5].strip()}
        if fields[6].strip(): variant_meta["meaning"]=fields[6].strip()
        if fields[7].strip(): variant_meta["spelling"]=fields[7].strip()
        if len(fields)>13 and fields[13].strip(): variant_meta["note"]=fields[13].strip()
    prefix="H" if language=="he" else "G"; strong,extended=classic_codes(strong_raw,prefix)
    token={"id":f"{book}.{chapter}.{verse}.t{position}","position":position,"sourcePosition":row["sourcePosition"],"surface":surface,
           "normalized":normalized(surface),"lemma":lemmas[0] if lemmas else None,"lemmas":lemmas,"transliteration":transliteration,
           "gloss":gloss,
           "morphology":{"code":morph,"scheme":"step-hebrew" if language=="he" else "step-robinson"},"strong":strong,
           "extendedStrong":extended,"sourceReading":row["reading"],"textPolicy":policy}
    if row["alternateReference"]: token["alternateReference"]=row["alternateReference"]
    if variant_meta: token["variants"]=variant_meta
    return token


def build_corpus(raw,out,revision,morph_definitions):
    books=defaultdict(lambda:{"chapters":{},"language":None,"direction":None,"dataset":None})
    morph_codes=defaultdict(Counter); stats=Counter(); chapter_sizes=[]
    for (book,chapter,verse,language),rows in sorted(raw.items(),key=lambda x:(BOOK_ORDER.index(x[0][0]),x[0][1],x[0][2])):
        if language=="el": selected,policy=select_greek_rows(rows); dataset="TAGNT-N" if policy=="N" else "TAGNT-traditional-supplement"
        else: selected,policy=sorted(rows,key=lambda r:r["sourcePosition"]),"TAHOT-main"; dataset="TAHOT"
        candidates=[token_from_row(book,chapter,verse,i,row,language,policy) for i,row in enumerate(selected,1)]
        omissions=[{"sourcePosition":token["sourcePosition"],"sourceReading":token["sourceReading"],"variants":token.get("variants",{})}
                   for token in candidates if not token["surface"]]
        tokens=[token for token in candidates if token["surface"]]
        for position,token in enumerate(tokens,1):
            token["position"]=position; token["id"]=f"{book}.{chapter}.{verse}.t{position}"
        if not tokens: continue
        entry=books[book]; entry["language"]=language; entry["direction"]="rtl" if language=="he" else "ltr"; entry["dataset"]="TAHOT" if language=="he" else "TAGNT"
        verse_payload={"text":" ".join(t["surface"] for t in tokens),"tokens":tokens}
        if omissions: verse_payload["sourceOmissions"]=omissions
        entry.setdefault("verseData",defaultdict(dict))[chapter][str(verse)]=verse_payload
        stats["verses"]+=1; stats["tokens"]+=len(tokens); stats[f"tokens_{language}"]+=len(tokens); stats[f"policy_{policy}"]+=len(tokens)
        for token in tokens: morph_codes[token["morphology"]["scheme"]][token["morphology"]["code"]]+=1
    manifest_books={}
    for book in BOOK_ORDER:
        if book not in books: continue
        entry=books[book]; chapter_map={}
        for chapter,verses in sorted(entry.pop("verseData").items()):
            rel=f"data/{'hebrew' if entry['language']=='he' else 'greek'}/{book}/{chapter}.json"
            payload={"schemaVersion":2,"book":book,"chapter":chapter,"language":entry["language"],"direction":entry["direction"],"dataset":entry["dataset"],"verses":verses}
            dump(out/rel,payload,compact=True); chapter_sizes.append((out/rel).stat().st_size); chapter_map[str(chapter)]=rel
        manifest_books[book]={"language":entry["language"],"direction":entry["direction"],"dataset":entry["dataset"],"chapters":chapter_map,"alignment":{}}
    morph_entries={}; unknown=[]
    for scheme,codes in morph_codes.items():
        for code,count in codes.items():
            parsed=morphology_entry(code,scheme,morph_definitions); parsed["count"]=count; morph_entries[f"{scheme}:{code}"]=parsed
            if not parsed["recognized"]: unknown.append({"scheme":scheme,"code":code,"count":count,"unknown":parsed["unknown"]})
    dump(out/"morphology.json",{"schemaVersion":1,"entries":morph_entries},compact=True)
    stats.update({"books":len(manifest_books),"chapters":sum(len(x["chapters"]) for x in manifest_books.values()),"morphologyCodes":len(morph_entries),
                  "unknownMorphologyCodes":len(unknown),"unknownMorphologyTokens":sum(x["count"] for x in unknown),
                  "chapterBytes":sum(chapter_sizes),"averageChapterBytes":round(sum(chapter_sizes)/max(1,len(chapter_sizes)))})
    report={"schemaVersion":1,"statistics":dict(stats),"unknownMorphology":sorted(unknown,key=lambda x:-x["count"])}
    dump(out/"import-report.json",report)
    manifest={"schemaVersion":2,"id":"original-languages-step","type":"original-languages","name":"Texto original e Interlineal Verbo",
              "license":"CC BY 4.0","attribution":"STEP Bible (STEPBible.org), based on work at Tyndale House Cambridge",
              "source":{"repository":"https://github.com/STEPBible/STEPBible-Data",**revision},
              "textPolicy":{"hebrew":"TAHOT main reading (L/Q/R/X as identified by source)","greek":"TAGNT N-family by default; K/O only for traditional verses without an N-family reading","translationAlignments":{"es":"Biblia Verbo","en":"Berean Standard Bible (BSB)"}},
              "morphologyFile":"morphology.json","importReport":"import-report.json","books":manifest_books}
    dump(out/"manifest.json",manifest)
    return report


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--step-root",type=Path,default=DEFAULT_STEP); parser.add_argument("--output",type=Path,default=DEFAULT_OUT)
    parser.add_argument("--testament",choices=("all","ot","nt"),default="all"); parser.add_argument("--book",choices=BOOK_ORDER)
    parser.add_argument("--chapter",type=int); args=parser.parse_args()
    if args.chapter and not args.book: parser.error("--chapter requiere --book")
    step=args.step_root.resolve(); selected=set(BOOK_ORDER)
    if args.testament=="ot": selected=OT
    elif args.testament=="nt": selected=NT
    if args.book: selected={args.book}
    raw=parse_sources(step,selected,args.chapter); report=build_corpus(raw,args.output.resolve(),source_revision(step),load_morphology_definitions(step))
    s=report["statistics"]
    print(f"Importados {s['books']} libros, {s['chapters']} capítulos, {s['verses']} versículos y {s['tokens']} tokens")
    print(f"Morfología: {s['morphologyCodes']} códigos; {s['unknownMorphologyCodes']} desconocidos ({s['unknownMorphologyTokens']} tokens)")


if __name__=="__main__": main()
