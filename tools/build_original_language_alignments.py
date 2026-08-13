#!/usr/bin/env python3
"""Genera propuestas conservadoras original ↔ Biblia Verbo por capítulo."""
import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"biblia/modules/original-languages"
VERBO=ROOT/"biblia/modules/bibles/rv-verbo"
VERBO_STRONG=ROOT/"biblia/modules/bibles/rv-verbo-strong-provisional"
BSB=ROOT/"biblia/modules/bibles/bsb"

def load(path): return json.loads(path.read_text(encoding="utf-8"))
def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")

def preserve_editorial_decisions(path,relations):
    """Conserva decisiones humanas si se regenera una propuesta equivalente."""
    if not path.is_file(): return relations
    previous=load(path)
    reviewed={
        (tuple(item.get("originalTokens",[])),tuple(item.get("verboSegments",[]))):item
        for item in previous.get("relations",[])
        if item.get("reviewMethod")=="local-editor"
    }
    for item in relations:
        old=reviewed.get((tuple(item.get("originalTokens",[])),tuple(item.get("verboSegments",[]))))
        if not old: continue
        item["status"]=old["status"]
        item["reviewMethod"]="local-editor"
        if old.get("reviewedAt"): item["reviewedAt"]=old["reviewedAt"]
    return relations

def norm(value):
    value="".join(c for c in unicodedata.normalize("NFD",value.casefold()) if unicodedata.category(c)!="Mn")
    return "".join(c for c in value if c.isalnum() or c in "'-’")

def gloss_words(value):
    value=re.sub(r"[\[\]<>]"," ",value or "").replace("/"," ")
    return [norm(x) for x in re.findall(r"[\w’'-]+",value,flags=re.UNICODE) if norm(x)]

def bsb_segments(book,chapter,verse,text):
    return [{"id":f"{book}.{chapter}.{verse}.s{i}","position":i,"text":m.group(0),"normalized":norm(m.group(0))}
            for i,m in enumerate(re.finditer(r"[\w’'-]+",text,flags=re.UNICODE),1)]

def build_bsb_verse(book,chapter,verse,original,text):
    segments=bsb_segments(book,chapter,verse,text); words=[s["normalized"] for s in segments]; used=set(); relations=[]
    total=max(1,len(original["tokens"]))
    for index,token in enumerate(original["tokens"]):
        phrase=gloss_words(token.get("gloss"))
        candidates=[]
        if phrase:
            for start in range(len(words)-len(phrase)+1):
                positions=range(start,start+len(phrase))
                if any(pos in used for pos in positions): continue
                if words[start:start+len(phrase)]==phrase: candidates.append(start)
        if not candidates: continue
        expected=index*max(0,len(words)-1)/max(1,total-1); start=min(candidates,key=lambda x:abs(x-expected)); positions=list(range(start,start+len(phrase)))
        used.update(positions); targets=[segments[pos]["id"] for pos in positions]; status="automatic" if len(candidates)==1 else "ambiguous"
        relations.append({"originalTokens":[token["id"]],"verboSegments":targets,"relation":"1:1" if len(targets)==1 else "1:n","status":status,
                          "confidence":.92 if status=="automatic" else .5,"method":"step-english-gloss-exact","evidence":{"gloss":token.get("gloss")}})
    used_tokens={x for r in relations for x in r["originalTokens"]}; used_segments={x for r in relations for x in r["verboSegments"]}
    missing_tokens=[t["id"] for t in original["tokens"] if t["id"] not in used_tokens]
    if missing_tokens: relations.append({"originalTokens":missing_tokens,"verboSegments":[],"relation":"unresolved","status":"unresolved","method":"no-exact-gloss-match"})
    missing_segments=[s["id"] for s in segments if s["id"] not in used_segments]
    if missing_segments: relations.append({"originalTokens":[],"verboSegments":missing_segments,"relation":"unresolved","status":"unresolved","method":"translation-only-segment"})
    for i,item in enumerate(relations,1): item["id"]=f"{book}.{chapter}.{verse}.a{i}"; item["verse"]=verse
    return segments,relations

def segment_codes(segment):
    return list(dict.fromkeys(([segment.get("strong")] if segment.get("strong") else [])+(segment.get("strongs") or [])))

def build_verse(book,chapter,verse,original,strong_verse):
    segments=[]
    for i,segment in enumerate(strong_verse.get("segments",[]),1):
        text=segment.get("text","").strip()
        if not text: continue
        sid=f"{book}.{chapter}.{verse}.s{len(segments)+1}"
        segments.append({"id":sid,"position":len(segments)+1,"text":text,"strong":segment_codes(segment),"strongMeta":segment.get("strongMeta")})
    token_by_code=defaultdict(list)
    for token in original["tokens"]:
        for code in token.get("strong",[]): token_by_code[code].append(token["id"])
    segment_by_code=defaultdict(list)
    for segment in segments:
        for code in segment["strong"]: segment_by_code[code].append(segment["id"])
    relations=[]; used_tokens=set(); used_segments=set()
    for code in sorted(set(token_by_code)&set(segment_by_code)):
        token_ids=token_by_code[code]; segment_ids=segment_by_code[code]
        # Una repetición del mismo Strong en ambos lados no permite emparejar
        # ocurrencias con seguridad solo por el número.
        if len(token_ids)>1 and len(segment_ids)>1:
            status="ambiguous"; confidence=0.45
        else:
            metas=[s.get("strongMeta") or {} for s in segments if s["id"] in segment_ids]
            source_conf=min([float(m.get("confidence",0.5)) for m in metas] or [0.5])
            source_status={m.get("status") for m in metas}
            confidence=round(min(.94,.55+.4*source_conf),3)
            status="automatic" if source_status <= {"provisional","automatic",None} or source_status else "automatic"
        relation="1:1" if len(token_ids)==len(segment_ids)==1 else "1:n" if len(token_ids)==1 else "n:1" if len(segment_ids)==1 else "n:n"
        relations.append({"originalTokens":token_ids,"verboSegments":segment_ids,"relation":relation,"status":status,"confidence":confidence,"method":"explicit-strong-match","evidence":{"strong":code,"spanishLayer":"rv-verbo-strong-provisional"}})
        used_tokens.update(token_ids); used_segments.update(segment_ids)
    unresolved_tokens=[token["id"] for token in original["tokens"] if token["id"] not in used_tokens]
    if unresolved_tokens:
        relations.append({"originalTokens":unresolved_tokens,"verboSegments":[],"relation":"unresolved","status":"unresolved","method":"no-reliable-match"})
    unresolved_segments=[segment["id"] for segment in segments if segment["id"] not in used_segments]
    if unresolved_segments:
        relations.append({"originalTokens":[],"verboSegments":unresolved_segments,"relation":"unresolved","status":"unresolved","method":"translation-only-segment"})
    for i,item in enumerate(relations,1): item["id"]=f"{book}.{chapter}.{verse}.a{i}"
    return segments,relations

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--book"); parser.add_argument("--chapter",type=int); args=parser.parse_args()
    manifest=load(BASE/"manifest.json"); strong_manifest=load(VERBO_STRONG/"manifest.json"); bsb_manifest=load(BSB/"manifest.json")
    strong_files={b["id"]:VERBO_STRONG/b["file"] for b in strong_manifest["books"]}
    if "NAM" in strong_files: strong_files["NAH"]=strong_files["NAM"]
    bsb_files={b["id"]:BSB/b["file"] for b in bsb_manifest["books"]}
    reports={}
    for target in ("rv-verbo","bsb"):
      totals=Counter(); by_book={}; by_chapter={}
      for book,info in manifest["books"].items():
        if args.book and book!=args.book: continue
        target_book=load(strong_files[book] if target=="rv-verbo" else bsb_files[book]); book_stats=Counter()
        for chapter,rel in info["chapters"].items():
            if args.chapter and int(chapter)!=args.chapter: continue
            original=load(BASE/rel); target_segments={}; target_texts={}; relations=[]; chapter_stats=Counter()
            for verse,payload in original["verses"].items():
                target_verse=target_book["chapters"].get(chapter,{}).get(verse)
                if target=="rv-verbo":
                    if not isinstance(target_verse,dict): continue
                    segments,verse_relations=build_verse(book,int(chapter),int(verse),payload,target_verse)
                    target_texts[verse]=target_verse.get("text","")
                else:
                    if not isinstance(target_verse,str): continue
                    segments,verse_relations=build_bsb_verse(book,int(chapter),int(verse),payload,target_verse)
                    target_texts[verse]=target_verse
                target_segments[verse]=segments; relations.extend(verse_relations)
            out_rel=f"alignments/{target}/{book}/{chapter}.json"; out_path=BASE/out_rel
            relations=preserve_editorial_decisions(out_path,relations)
            for item in relations:
                chapter_stats["relations"]+=1; chapter_stats[f"status:{item['status']}"]+=1; chapter_stats[f"relation:{item['relation']}"]+=1
                chapter_stats["alignedTokens"]+=len(item["originalTokens"]) if item["verboSegments"] else 0
                chapter_stats["unresolvedOriginalTokens"]+=len(item["originalTokens"]) if not item["verboSegments"] else 0
            method="explicit Strong match; Spanish Strong is auxiliary provisional evidence" if target=="rv-verbo" else "exact STEPBible English gloss match against fixed BSB text"
            output={"schemaVersion":2,"book":book,"chapter":int(chapter),"sourceModule":manifest["id"],"targetBible":target,"proposalMethod":method,"targetTexts":target_texts,"targetSegments":target_segments,"relations":relations}
            dump(out_path,output); info.setdefault("alignments",{}).setdefault(target,{})[chapter]=out_rel
            if target=="rv-verbo": info["alignment"][chapter]=out_rel
            by_chapter[f"{book}.{chapter}"]=dict(chapter_stats); book_stats.update(chapter_stats)
        by_book[book]=dict(book_stats); totals.update(book_stats)
      report_name=f"alignment-report-{target}.json"; dump(BASE/report_name,{"schemaVersion":1,"targetBible":target,"statistics":dict(totals),"byBook":by_book,"byChapter":by_chapter})
      reports[target]=report_name; print(target); print(json.dumps(dict(totals),ensure_ascii=False,indent=2))
    manifest["alignmentReports"]=reports; manifest["alignmentReport"]=reports["rv-verbo"]; dump(BASE/"manifest.json",manifest)

if __name__=="__main__": main()
