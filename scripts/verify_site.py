"""Static and local HTTP checks: python3 scripts/verify_site.py."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
import json
import re
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
class Page(HTMLParser):
 def __init__(self):super().__init__();self.h1=0;self.canonical=[];self.ids=[];self.links=[];self.honeypots=[];self.json_text=[];self.schema=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if 'id' in a:self.ids.append(a['id'])
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href'))
  if tag=='input' and a.get('name')=='botcheck':self.honeypots.append(a)
  if tag=='script' and a.get('type')=='application/ld+json':self.schema=True
  for k in ['href','src']:
   if k in a:self.links.append(a[k])
 def handle_endtag(self,tag):
  if tag=='script':self.schema=False
 def handle_data(self,data):
  if self.schema:self.json_text.append(data)
pages={}
# 404.html is GitHub Pages' error page: intentionally noindex and NOT in the sitemap.
for f in ROOT.glob('*.html'):
 if f.name == '404.html':
  continue
 p=Page();s=f.read_text();p.feed(s);pages[f.name]=p
 assert p.h1==1,(f.name,'H1 count')
 assert len(p.canonical)==1,(f.name,'canonical count')
 expected='https://localwebcraft.com/'+('' if f.name=='index.html' else f.name)
 assert p.canonical[0]==expected,(f.name,'wrong canonical')
 assert len(set(p.ids))==len(p.ids),(f.name,'duplicate IDs')
 assert '/webcraft-analytics.js?v=' in s,(f.name,'GA4 loader missing')
 assert 'googletagmanager.com/gtag/js' not in s,(f.name,'unguarded GA4 script')
 for h in p.honeypots:assert 'hidden' in h and h.get('aria-hidden')=='true' and h.get('tabindex')=='-1',(f.name,'honeypot attributes')
 for schema in p.json_text:json.loads(schema)
 # 2026-11-18: the Nov 17 position pass left the homepage WebSite JSON outside its
 # <script> tag, rendering as visible text — and this checker never saw it, because
 # it only parsed JSON inside ld+json blocks. Catch that class of bug here.
 assert len(re.findall(r'<script\b', s)) == len(re.findall(r'</script>', s)),(f.name,'unbalanced script tags')
 stripped = re.sub(r'<script[^>]*>.*?</script>', '', s, flags=re.S)
 assert '"@context"' not in stripped and '{"@type"' not in stripped,(f.name,'JSON-LD text outside script tag')
 # 2026-11-18: the Nov 15 local-enrichment run mangled 20 city pages —
 # 2 FAQs appended after </body></html> (with </html>'s '>' eaten), the FAQ
 # section's opening tag destroyed, a stray </section> left behind — and this
 # checker passed every run for 3 days because it never checked document
 # structure. Catch that class of bug here.
 assert len(re.findall(r'<head(\s|>)', s)) == 1,(f.name,'head count')
 assert s.count('</head>') == 1,(f.name,'head close count')
 assert s.count('</body>') == 1,(f.name,'body close count')
 assert s.count('</html>') == 1,(f.name,'html close count')
 _depth = 0
 for _m in re.finditer(r'<section\b|</section>', s):
  _depth += -1 if _m.group(0).startswith('</') else 1
  assert _depth >= 0,(f.name,'section close before open')
 assert _depth == 0,(f.name,'unbalanced sections')
for name,p in pages.items():
 for link in p.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  path=u.path.lstrip('/')
  target='index.html' if u.path=='/' else path or name
  assert (ROOT/target).exists(),(name,'missing target',link)
  if u.fragment and target in pages:assert u.fragment in pages[target].ids,(name,'missing anchor',link)
urls=[n.text for n in ET.parse(ROOT/'sitemap.xml').findall('{*}url/{*}loc')]
assert set(urls)=={p.canonical[0] for p in pages.values()},'Sitemap mismatch'
def fetch(name):return urlopen('http://127.0.0.1:4173/'+name,timeout=10).status
assert all(s==200 for s in ThreadPoolExecutor(max_workers=8).map(fetch,pages))
print(f'PASS: {len(pages)} pages, HTTP 200, canonicals, headings, IDs, links/anchors, assets, JSON-LD, GA4, hidden-control attributes and sitemap coverage.')
