#!/usr/bin/env python3
"""Exercise publication gates and stale preview cleanup in an isolated fixture."""
import json,sys,tempfile
from pathlib import Path
from PIL import Image
import build_imagenes as b
import section_builder as h
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);bank=root/'bank'
 (bank/'catalogo').mkdir(parents=True);(bank/'web/mateo').mkdir(parents=True)
 (root/'biblia/assets/i18n').mkdir(parents=True)
 record={'id':'test-one','libro':'Mateo','testamento':'NT','capitulo':1,'versiculos':'1','paralelos':[],'titulo':'Prueba','title_en':'Test','tipo':'escena','tags':['fe'],'descripcion':'Prueba'}
 (bank/'catalogo/one.json').write_text(json.dumps([record]))
 (bank/'estado.json').write_text(json.dumps({'test-one':{'estado':'generada'}}))
 Image.new('RGB',(160,90)).save(bank/'web/mateo/test-one.jpg')
 h.R=b.R=root
 for mode,expected in [(['--todas'],1),([],0)]:
  sys.argv=['build_imagenes.py','--banco',str(bank)]+mode
  b.build()
  assert len(json.loads((root/'imagenes/indice.json').read_text()))==expected
 assert not (root/'imagenes/mateo/test-one.jpg').exists()
 (bank/'estado.json').write_text(json.dumps({'test-one':{'estado':'aprobada'}}))
 b.build()
 assert len(json.loads((root/'imagenes/indice.json').read_text()))==1
 assert 'noindex' not in (root/'imagenes/mateo/test-one/index.html').read_text()
 print('Generador: aprobación, vista previa y limpieza verificadas.')
