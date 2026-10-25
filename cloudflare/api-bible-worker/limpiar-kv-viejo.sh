#!/bin/bash
# Borra hasta 1000 traducciones viejas (translate:v2/v3/v4) del KV SYNC_KV por corrida: el plan gratis permite
# 1000 borrados al día. Nunca toca translate:v5, study-assistant ni los datos de sync/iglesia. Correr una vez al
# día hasta que diga «Quedan 0».
set -e
cd "$(dirname "$0")"
NS=a1a2e2765ff34bc7b3abd1dbd17dfb71
T=$(mktemp -d)
for v in v2 v3 v4; do npx wrangler kv key list --namespace-id $NS --remote --prefix "translate:$v:" > "$T/$v.json"; done
python3 - "$T" <<'PY'
import json,sys,pathlib
t=pathlib.Path(sys.argv[1])
k=[x['name'] for v in ('v2','v3','v4') for x in json.load(open(t/f'{v}.json'))]
assert all(n.startswith(('translate:v2:','translate:v3:','translate:v4:')) for n in k)
json.dump(k[:1000],open(t/'lote.json','w'));print(f'Viejas: {len(k)}. Se borran {min(len(k),1000)}.')
PY
[ "$(cat "$T/lote.json")" = "[]" ] || npx wrangler kv bulk delete "$T/lote.json" --namespace-id $NS --remote --force
rm -rf "$T"
