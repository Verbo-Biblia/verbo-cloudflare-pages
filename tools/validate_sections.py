#!/usr/bin/env python3
"""Validate generated section structure, local links, i18n keys and JSON-LD offline."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json,re
ROOT=Path(__file__).resolve().parents[1]
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
DICTS={l:json.loads((ROOT/f'biblia/assets/i18n/{l}.json').read_text()) for l in ['es','en']}
errors=[]
class Check(HTMLParser):
 def __init__(self,path):super().__init__(convert_charrefs=True);self.path=path;self.stack=[];self.ids=set();self.links=[];self.schema=False;self.payload=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag not in VOID:self.stack.append(tag)
  if 'id'in a:
   if a['id']in self.ids:errors.append(f'{self.path}: duplicate ID {a["id"]}')
   self.ids.add(a['id'])
  if 'data-i18n'in a:
   for lang,d in DICTS.items():
    try:
     for key in a['data-i18n'].split('.'):d=d[key]
    except (KeyError,TypeError):errors.append(f'{self.path}: missing {lang} key {a["data-i18n"]}')
  for attr in ['href','src']:
   if attr in a:self.links.append(a[attr])
  if tag=='script' and a.get('type')=='application/ld+json':self.schema=True;self.payload=''
 def handle_endtag(self,tag):
  if not self.stack or self.stack[-1]!=tag:errors.append(f'{self.path}: mismatched </{tag}> after {self.stack[-3:]}')
  else:self.stack.pop()
  if tag=='script'and self.schema:
   try:json.loads(self.payload)
   except ValueError:errors.append(f'{self.path}: invalid JSON-LD')
   self.schema=False
 def handle_data(self,data):
  if self.schema:self.payload+=data
files=[p for section in ['apps','juegos','imagenes'] for p in (ROOT/section).rglob('*.html')]
for path in files:
 text=path.read_text();c=Check(path.relative_to(ROOT));c.feed(text)
 if c.stack:errors.append(f'{path}: unclosed {c.stack}')
 for link in c.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or not u.path:continue
  p=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else path.parent/unquote(u.path)
  if p.is_dir():p=p/'index.html'
  if not p.exists():errors.append(f'{path.relative_to(ROOT)}: missing {link}')
 if '<!-- verbo:pie -->'not in text:errors.append(f'{path}: missing common footer')
 if not re.search(r'<meta[^>]+name=["\']viewport',text):errors.append(f'{path}: missing viewport')
print(f'{len(files)} HTML files checked; {len(errors)} errors')
for error in errors[:60]:print(error)
raise SystemExit(bool(errors))
