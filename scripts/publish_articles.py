"""Build a Pages artifact containing only articles whose release time has arrived."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from html import escape
import json
from pathlib import Path
import re
from shutil import copy2, copytree
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://localwebcraft.com'
EDITORIAL_TIME = ZoneInfo('America/New_York')
FIRST_DAY = date(2026, 11, 23)
RELEASE_TIME = time(9, 17)
SERVICES = {
    'web-design': 'Web design',
    'web-hosting': 'Website hosting',
    'local-seo': 'Local SEO',
    'google-ads': 'Google Ads',
    'analytics': 'Analytics and tracking',
}
EXTRA_MARKETS = {
    'cumming-web-design': 'Cumming, GA',
    'decatur-web-design': 'Decatur, GA',
    'east-cobb-web-design': 'East Cobb, GA',
    'johns-creek-web-design': 'Johns Creek, GA',
    'lilburn-web-design': 'Lilburn, GA',
    'marietta-web-design': 'Marietta, GA',
    'milton-web-design': 'Milton, GA',
    'roswell-web-design': 'Roswell, GA',
}


@dataclass(frozen=True)
class Article:
    slug: str
    service: str
    markets: tuple[str, ...]
    title: str
    lead: str
    sections: tuple[tuple[str, str], ...]
    sources: tuple[tuple[str, str], ...]
    publish_at: datetime

    @property
    def filename(self):
        return self.slug + '.html'

    @property
    def url(self):
        return ORIGIN + '/' + self.filename


def load_articles(source):
    cities = json.loads((source / 'scripts/city-content-map.json').read_text(encoding='utf-8'))
    market_names = {Path(row['service']).stem: row['city'] for row in cities}
    market_names.update(EXTRA_MARKETS)
    articles = []
    used = set()
    bodies = set()
    for batch in sorted((source / '_editorial/daily').glob('*.txt')):
        day = date.fromisoformat(batch.stem)
        if not FIRST_DAY <= day < FIRST_DAY + timedelta(days=30):
            raise ValueError(f'Batch outside the publication window: {batch.name}')
        raw = batch.read_text(encoding='utf-8').strip()
        records = re.split(r'^@@ ', raw, flags=re.M)[1:]
        coverage = Counter()
        for record in records:
            lines = record.strip().splitlines()
            slug, service, markets_raw = [value.strip() for value in lines[0].split('|')]
            markets = tuple(value.strip() for value in markets_raw.split(','))
            if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug) or slug in used or (source / (slug+'.html')).exists():
                raise ValueError(f'Invalid, existing, or duplicate article slug: {slug}')
            if service not in SERVICES or len(markets) != 1 or markets[0] not in market_names:
                raise ValueError(f'Unknown service or location for {slug}')
            if len(lines) < 9 or not lines[1].startswith('# ') or lines[2].startswith(('#', '@')):
                raise ValueError(f'Missing article title, lead, or sections: {slug}')

            sections = []
            references = []
            body = lines[3:]
            while body and body[0].startswith('## '):
                if len(body) < 2 or body[1].startswith(('#', '@')):
                    raise ValueError(f'Empty article section: {slug}')
                sections.append((body[0][3:], body[1]))
                body = body[2:]
            for reference in body:
                if not reference.startswith('@ '):
                    raise ValueError(f'Unexpected article line: {slug}')
                name, url = [value.strip() for value in reference[2:].split('|', 1)]
                if not url.startswith('https://'):
                    raise ValueError(f'Unsafe reference URL: {slug}')
                references.append((name, url))
            if len(sections) < 3:
                raise ValueError(f'Expected at least three sections: {slug}')

            publish_at = datetime.combine(day, RELEASE_TIME, EDITORIAL_TIME)
            articles.append(Article(slug, service, markets, lines[1][2:], lines[2], tuple(sections), tuple(references), publish_at))
            used.add(slug)
            coverage.update(markets)
            signature = re.sub(r'[^a-z0-9]+', ' ', ' '.join(copy for _, copy in sections).casefold()).strip()
            if signature in bodies:
                raise ValueError(f'Duplicate article copy: {slug}')
            bodies.add(signature)
        if coverage != Counter(market_names.keys()):
            raise ValueError(f'{batch.name} must contain one article per location')
    if not articles:
        raise ValueError('No article batches found')
    return articles, market_names


def one_match(pattern, text):
    match = re.search(pattern, text, re.S)
    if not match:
        raise ValueError(f'Could not locate site template marker: {pattern}')
    return match.group()


def snippet(article, location, teaser=False):
    day = article.publish_at.date()
    stamp = f'{day:%b} {day.day}, {day.year}'
    description = f'<span class="library-card-description">{escape(article.lead)}</span>' if teaser else ''
    return (
        f'<li data-guide><a href="/{article.filename}"><span class="library-card-meta">'
        f'<span>{escape(location)}</span><time datetime="{day}">{stamp}</time></span>'
        f'<strong>{escape(article.title)}</strong>{description}'
        f'<span class="library-arrow" aria-hidden="true">↗</span></a></li>'
    )


def article_html(article, labels, shell):
    head, header, footer = shell
    title = article.title + ' | WebCraft'
    # Use the complete first sentence in link previews.
    first_sentence = re.split(r'(?<=[.!?])\s+', article.lead, maxsplit=1)[0]
    day = article.publish_at.date()
    head = re.sub(r'<title>.*?</title>', lambda _: f'<title>{escape(title)}</title>', head)
    values = {
        'description': first_sentence, 'og:url': article.url, 'og:title': title,
        'og:description': first_sentence, 'twitter:title': title, 'twitter:description': first_sentence,
        'article:published_time': str(day), 'article:modified_time': str(day),
    }
    for attr, value in values.items():
        head = re.sub(r'((?:name|property)="' + attr + r'" content=")[^"]*', lambda m: m[1]+escape(value), head)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1]+article.url, head)
    schema = {
        '@context': 'https://schema.org', '@type': 'Article', 'headline': article.title,
        'description': first_sentence, 'datePublished': article.publish_at.isoformat(),
        'dateModified': article.publish_at.isoformat(), 'mainEntityOfPage': article.url,
        'image': ORIGIN + '/assets/webcraft-digital-sculpture.jpg',
        'author': {'@type': 'Organization', 'name': 'WebCraft', 'url': ORIGIN+'/'},
        'publisher': {'@type': 'Organization', 'name': 'WebCraft', 'url': ORIGIN+'/'},
    }
    head += '<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>'
    sections = ''.join(
        f'<section><h2>{escape(heading)}</h2><p>{escape(copy)}</p></section>'
        for heading, copy in article.sections
    )
    if article.sources:
        references = ''.join(f'<li><a href="{escape(url)}">{escape(label)}</a></li>' for label, url in article.sources)
        sections += f'<section><h2>References</h2><ul>{references}</ul></section>'
    city_links = ''.join(f'<li><a href="/{city}.html">{escape(labels[city])}</a></li>' for city in article.markets)
    category = SERVICES[article.service]
    market = ' · '.join(labels[key] for key in article.markets)
    return f'''{head}</head>
<body class="studio-layout studio-article">
<a class="skip" href="#main">Skip to content</a>
{header}
<main id="main"><article class="wrap article">
<a class="article-back textlink" href="/insights.html">← All guides</a>
<p class="eyebrow">{escape(market)}</p>
<h1>{escape(article.title)}</h1>
<p class="lead">{escape(article.lead)}</p>
<p class="article-meta">By WebCraft · Published <time datetime="{day}">{day:%B} {day.day}, {day.year}</time> · {category}</p>
{sections}
<section class="related"><h2>WebCraft services</h2>
<p><a href="/{article.service}.html">{category}</a> · <a href="/{article.service}.html#contact">Ask about your project ↗</a></p>
<ul>{city_links}</ul>
</section>
</article></main>
{footer}
</body></html>
'''


def update_indexes(output, articles, labels):
    by_page = defaultdict(list)
    for article in articles:
        for page in (*article.markets, article.service):
            by_page[page].append(article)

    def location(article):
        return ' · '.join(labels[key] for key in article.markets)

    updated = {}
    newest = list(reversed(articles))
    cards = ''.join(snippet(article, location(article)) for article in newest[:6])
    older = ''.join(snippet(article, location(article)) for article in newest[6:])
    disclosure = ''
    if older:
        disclosure = (f'<details class="library-topic" data-library-section data-topic="Daily guides">'
                      f'<summary><span>Earlier daily guides</span><span class="library-count">{len(newest[6:])}</span></summary>'
                      f'<ul class="library-cards">{older}</ul></details>')
    featured = (f'<section class="library-section" id="daily-guides" data-library-section data-topic="Daily guides">'
                f'<header class="section-title"><h2>New from WebCraft</h2></header>'
                f'<ul class="library-cards">{cards}</ul>{disclosure}</section>')
    insights = output / 'insights.html'
    marker = one_match(r'<section class="library-section" id="service-guides"[^>]*>', insights.read_text())
    insights.write_text(insights.read_text().replace(marker, featured + '\n' + marker, 1))
    updated['/insights.html'] = articles[-1].publish_at.date()

    for page, items in by_page.items():
        path = output / (page + '.html')
        text = path.read_text()
        links = ''.join(f'<li><a href="/{item.filename}">{escape(item.title)}</a></li>' for item in reversed(items))
        list_html = f'<ul class="city-guide-links" aria-label="New from WebCraft">{links}</ul>'
        if page in EXTRA_MARKETS:
            start = '<section class="guide-services">'
            block = f'<section class="related"><h2>New from WebCraft</h2>{list_html}</section>'
            replacement = block + start
        else:
            start = one_match(r'<section class="wrap section city-reading"[^>]*>\s*(?:<header class="section-title">.*?</header>|<h2>.*?</h2>)', text)
            replacement = start + list_html
        if text.count(start) != 1:
            raise ValueError(f'Expected one article listing on {page}')
        path.write_text(text.replace(start, replacement, 1))
        updated['/' + path.name] = items[-1].publish_at.date()
    return updated


def build(source, output, now):
    if now.utcoffset() is None:
        raise ValueError('Publication check requires a timezone-aware time')
    articles, labels = load_articles(source)
    due = [article for article in articles if article.publish_at <= now]
    output.mkdir(parents=True, exist_ok=False)
    public_suffixes = {'.html', '.css', '.js', '.txt', '.xml', '.ico', '.webmanifest'}
    for path in source.iterdir():
        if path.is_file() and not path.name.startswith('.') and (path.suffix in public_suffixes or path.name == 'CNAME'):
            copy2(path, output / path.name)
    copytree(source / 'assets', output / 'assets')
    (output / '.nojekyll').touch()
    if not due:
        return []

    template = (source / 'cleveland-website-cost.html').read_text()
    head = template.split('</head>', 1)[0]
    head = re.sub(r'<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)
    chrome = (
        head,
        one_match(r'<header class="wrap nav">.*?</header>', template),
        one_match(r'<footer class="wrap">.*?</footer>', template),
    )
    for article in due:
        (output / article.filename).write_text(article_html(article, labels, chrome), encoding='utf-8')
    touched = update_indexes(output, due, labels)

    sitemap = output / 'sitemap.xml'
    text = sitemap.read_text()
    for page, day in touched.items():
        pattern = r'(<loc>' + re.escape(ORIGIN+page) + r'</loc>\s*<lastmod>)[^<]+'
        text, replacements = re.subn(pattern, lambda m: m[1]+str(day), text)
        if replacements != 1:
            raise ValueError(f'Could not find unique sitemap entry for {page}')
    urls = ''.join(f'  <url><loc>{article.url}</loc><lastmod>{article.publish_at.date()}</lastmod></url>\n' for article in due)
    sitemap.write_text(text.replace('</urlset>', urls+'</urlset>', 1))
    return [article.filename for article in due]


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('_site'))
    parser.add_argument('--at', type=datetime.fromisoformat, default=datetime.now(timezone.utc))
    parser.add_argument('--calendar', action='store_true')
    args = parser.parse_args()
    if args.calendar:
        articles, labels = load_articles(ROOT)
        for article in articles:
            markets = ' / '.join(labels[key] for key in article.markets)
            print(f'{article.publish_at:%Y-%m-%d %H:%M %Z} | {markets} | {article.title}')
        return
    due = build(ROOT, args.output.resolve(), args.at)
    print(f'Built {args.output} with {len(due)} scheduled articles so far.')


if __name__ == '__main__':
    main()
