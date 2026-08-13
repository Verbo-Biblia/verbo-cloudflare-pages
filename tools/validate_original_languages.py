#!/usr/bin/env python3
"""Validación integral del corpus original y sus alineaciones."""
import json,re,unicodedata
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; BASE=ROOT/"biblia/modules/original-languages"; VERBO=ROOT/"biblia/modules/bibles/rv-verbo"
TOKEN_ID=re.compile(r"^([1-3]?[A-Z]{2,3})\.(\d+)\.(\d+)\.t(\d+)$"); STRONG=re.compile(r"^[HG]\d+$")
STATUSES={"automatic","reviewed","approved","ambiguous","unresolved"}; RELATIONS={"1:1","1:n","n:1","n:n","unresolved"}
EXPECTED_BOOKS=66

def load(path): return json.loads(path.read_text(encoding="utf-8"))

def validate(base=BASE):
    errors=[]; stats=Counter(); ids=set(); chapter_ids={}; manifest=load(base/"manifest.json"); morphology=load(base/manifest["morphologyFile"])["entries"]
    verbo_manifest=load(VERBO/"manifest.json"); verbo_files={book["id"]:VERBO/book["file"] for book in verbo_manifest["books"]}; verbo_files["NAH"]=verbo_files.get("NAM",verbo_files.get("NAH"))
    if len(manifest["books"])!=EXPECTED_BOOKS: errors.append(f"libros: {len(manifest['books'])}, esperados {EXPECTED_BOOKS}")
    for book,info in manifest["books"].items():
        if info["direction"] != ("rtl" if info["language"]=="he" else "ltr"): errors.append(f"dirección inválida {book}")
        verbo=load(verbo_files[book])["chapters"]
        for chapter,rel in info["chapters"].items():
            path=base/rel
            try: data=load(path)
            except Exception as exc: errors.append(f"JSON {path}: {exc}"); continue
            if data["book"]!=book or str(data["chapter"])!=chapter: errors.append(f"referencia interna {rel}")
            current_chapter_ids=set(); chapter_ids[(book,chapter)]=current_chapter_ids
            for verse,payload in data["verses"].items():
                stats["verses"]+=1
                if verse not in verbo.get(chapter,{}): stats["sourceOnlyVerses"]+=1
                positions=[]
                for token in payload.get("tokens",[]):
                    stats["tokens"]+=1; positions.append(token.get("position")); match=TOKEN_ID.fullmatch(token.get("id",""))
                    if not match or match.groups()[:3]!=(book,chapter,verse): errors.append(f"ID inválido {token.get('id')}")
                    if token.get("id") in ids: errors.append(f"ID duplicado {token.get('id')}")
                    ids.add(token.get("id")); current_chapter_ids.add(token.get("id"))
                    for key in ("surface","normalized","lemma","transliteration"):
                        if not token.get(key): errors.append(f"{token.get('id')} vacío: {key}")
                    if unicodedata.normalize("NFD",token["surface"])!=token["surface"]: stats["nonNfdSurface"]+=1
                    morph=token.get("morphology",{}); morph_key=f"{morph.get('scheme')}:{morph.get('code')}"
                    if morph_key not in morphology: errors.append(f"morfología sin índice {token.get('id')}: {morph_key}")
                    elif not morphology[morph_key].get("recognized"): stats["unknownMorphologyTokens"]+=1
                    if any(not STRONG.fullmatch(code) for code in token.get("strong",[])): errors.append(f"Strong inválido {token.get('id')}")
                if positions!=list(range(1,len(positions)+1)): errors.append(f"posiciones {book}.{chapter}.{verse}")
                if not payload.get("text") or not payload.get("tokens"): errors.append(f"versículo vacío {book}.{chapter}.{verse}")
        alignments=info.get("alignments",{})
        if set(alignments)!={"rv-verbo","bsb"}: errors.append(f"capas de alineación incompletas {book}: {sorted(alignments)}")
        for target,target_chapters in alignments.items():
          for chapter,rel in target_chapters.items():
            alignment=load(base/rel); segment_ids={s["id"] for values in alignment["targetSegments"].values() for s in values}; relation_ids=set()
            chapter_token_ids=chapter_ids.get((book,chapter),set())
            if alignment.get("targetBible")!=target: errors.append(f"destino interno inválido {rel}")
            for relation in alignment["relations"]:
                stats[f"{target}:relations"]+=1; stats[f"{target}:status:{relation['status']}"]+=1; stats[f"{target}:relation:{relation['relation']}"]+=1
                if relation["id"] in relation_ids: errors.append(f"relación duplicada {relation['id']}")
                relation_ids.add(relation["id"])
                if relation["status"] not in STATUSES or relation["relation"] not in RELATIONS: errors.append(f"estado/tipo inválido {relation['id']}")
                if any(x not in chapter_token_ids for x in relation["originalTokens"]): errors.append(f"token roto {relation['id']}")
                if any(x not in segment_ids for x in relation["verboSegments"]): errors.append(f"segmento roto {relation['id']}")
                if relation["status"] in {"automatic","ambiguous"} and not 0<=relation.get("confidence",-1)<=1: errors.append(f"confianza inválida {relation['id']}")
    stats["books"]=len(manifest["books"]); stats["chapters"]=sum(len(x["chapters"]) for x in manifest["books"].values()); stats["uniqueTokens"]=len(ids)
    if errors: raise SystemExit("VALIDACIÓN FALLIDA\n"+"\n".join(errors[:100])+f"\nTotal: {len(errors)}")
    print(json.dumps(dict(stats),ensure_ascii=False,indent=2)); return stats

if __name__=="__main__": validate()
