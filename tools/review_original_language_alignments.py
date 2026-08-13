#!/usr/bin/env python3
"""Servidor local para revisar y guardar estados de alineación.

Uso: python3 tools/review_original_language_alignments.py --port 8766
Abrir: http://127.0.0.1:8766/
"""
import argparse,json
from datetime import datetime,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[1]; DATA=ROOT/"biblia/modules/original-languages"; UI=ROOT/"review/original-languages/reviewer.html"

class Handler(BaseHTTPRequestHandler):
    def send(self,status,body,kind="application/json; charset=utf-8"):
        body=body if isinstance(body,bytes) else body.encode(); self.send_response(status); self.send_header("Content-Type",kind); self.send_header("Content-Length",len(body)); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        if self.path=="/": return self.send(200,UI.read_bytes(),"text/html; charset=utf-8")
        if not self.path.startswith("/data/"): return self.send(404,b'{}')
        rel=unquote(self.path[6:]).lstrip("/"); path=(DATA/rel).resolve()
        if DATA.resolve() not in path.parents or not path.is_file(): return self.send(404,b'{}')
        self.send(200,path.read_bytes())
    def do_POST(self):
        if self.path!="/api/relation": return self.send(404,b'{}')
        try:
            payload=json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))))
            target=str(payload["target"]); book=str(payload["book"]); chapter=int(payload["chapter"]); relation_id=str(payload["id"]); status=str(payload["status"])
            if target not in {"rv-verbo","bsb"}: raise ValueError("destino inválido")
            if status not in {"automatic","reviewed","approved","ambiguous","unresolved"}: raise ValueError("estado inválido")
            path=(DATA/f"alignments/{target}/{book}/{chapter}.json").resolve()
            if DATA.resolve() not in path.parents: raise ValueError("ruta inválida")
            data=json.loads(path.read_text(encoding="utf-8")); relation=next(x for x in data["relations"] if x["id"]==relation_id)
            relation["status"]=status; relation["reviewMethod"]="local-editor"; relation["reviewedAt"]=datetime.now(timezone.utc).isoformat(); path.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
            self.send(200,json.dumps({"ok":True,"id":relation_id,"status":status}))
        except Exception as exc: self.send(400,json.dumps({"ok":False,"error":str(exc)}))

def main():
    parser=argparse.ArgumentParser(); parser.add_argument("--port",type=int,default=8766); args=parser.parse_args()
    print(f"Revisor: http://127.0.0.1:{args.port}/"); ThreadingHTTPServer(("127.0.0.1",args.port),Handler).serve_forever()
if __name__=="__main__": main()
