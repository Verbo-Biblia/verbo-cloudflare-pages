#!/usr/bin/env python3
"""Comprueba capítulos representativos y fenómenos difíciles del corpus."""
import json
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; BASE=ROOT/"biblia/modules/original-languages"
CASES=[("GEN",1),("GEN",22),("EXO",20),("PSA",23),("PSA",119),("ISA",53),("JON",1),("MAT",5),("JHN",1),("ROM",8),("HEB",1),("REV",1)]

def load(path): return json.loads(path.read_text(encoding="utf-8"))
def main():
    manifest=load(BASE/"manifest.json"); counts=Counter(); results=[]
    for book,chapter in CASES:
        info=manifest["books"][book]; data=load(BASE/info["chapters"][str(chapter)]); alignment=load(BASE/info["alignments"]["rv-verbo"][str(chapter)]); alignment_en=load(BASE/info["alignments"]["bsb"][str(chapter)])
        tokens=[t for verse in data["verses"].values() for t in verse["tokens"]]
        counts["tokens"]+=len(tokens); counts["relations"]+=len(alignment["relations"])
        results.append({"reference":f"{book}.{chapter}","verses":len(data["verses"]),"tokens":len(tokens),"relationsEs":len(alignment["relations"]),"relationsEn":len(alignment_en["relations"]),
                        "qere":sum(t["sourceReading"].startswith("Q") for t in tokens),"traditionalSupplement":sum(t["textPolicy"]=="K" for t in tokens),
                        "maqaf":sum("־" in t["surface"] for t in tokens),"suffixMorphology":sum("/S" in t["morphology"]["code"] for t in tokens),
                        "participles":sum(t["morphology"]["code"].startswith("V-") and "P-" in t["morphology"]["code"] for t in tokens),
                        "infinitives":sum(t["morphology"]["code"].startswith("V-") and t["morphology"]["code"].split("-")[1].endswith("N") for t in tokens)})
    all_counts=Counter()
    for book,info in manifest["books"].items():
        for rel in info["chapters"].values():
            data=load(BASE/rel)
            for verse in data["verses"].values():
                for token in verse["tokens"]:
                    all_counts["qere"]+=token["sourceReading"].startswith("Q")
                    all_counts["ketivMetadata"]+=book in list(manifest["books"])[:39] and ("K" in token["sourceReading"] or "K=" in json.dumps(token.get("variants",{}),ensure_ascii=False))
                    all_counts["maqaf"]+="־" in token["surface"]
                    all_counts["suffixMorphology"]+="/S" in token["morphology"]["code"]
                    all_counts["traditionalSupplement"]+=token["textPolicy"]=="K"
    print(json.dumps({"representativeChapters":results,"corpusPhenomena":dict(all_counts)},ensure_ascii=False,indent=2))
if __name__=="__main__": main()
