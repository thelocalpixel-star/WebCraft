"""SEO regression checks for hierarchy, service coverage, and entity consistency."""
from pathlib import Path
from html.parser import HTMLParser
import json, re
ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.headings=[]; self.links=[]; self.schemas=[]; self.in_schema=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if re.fullmatch('h[1-6]',tag): self.headings.append(int(tag[1]))
        if tag=='a': self.links.append(a.get('href',''))
        if tag=='script' and a.get('type')=='application/ld+json': self.in_schema=True
    def handle_data(self,data):
        if self.in_schema: self.schemas.append(json.loads(data))
    def handle_endtag(self,tag):
        if tag=='script': self.in_schema=False
failures=[]
for f in ROOT.glob('*.html'):
    p=Page(); p.feed(f.read_text())
    for before,after in zip(p.headings,p.headings[1:]):
        if after>before+1: failures.append(f'{f.name}: heading skips H{before} to H{after}')
for service in ['web-design','web-hosting','local-seo','google-ads','analytics']:
    p=Page();p.feed((ROOT/f'{service}.html').read_text())
    for city in json.loads((ROOT/'scripts/city-content-map.json').read_text()):
        if '/'+city['service'] not in p.links: failures.append(f'{service}: missing {city["city"]} path')
    entity=next(s for s in p.schemas if s.get('@type')=='Service')
    if entity.get('provider',{}).get('@id')!='https://localwebcraft.com/#organization': failures.append(f'{service}: inconsistent provider identity')
    if len(entity.get('areaServed',[]))!=24: failures.append(f'{service}: missing service area coverage')
assert not failures, '\n'.join(failures)
print('PASS: heading order on every page; all five services link all 24 communities and share one provider identity.')
