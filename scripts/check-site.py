#!/usr/bin/env python3
"""Check multilingual page coverage, equivalents, search indexes and local URLs.

Run after a Hugo build: python3 scripts/check-site.py public
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'public').resolve()
SOURCE = Path(__file__).resolve().parent.parent
LANGUAGES = ('en', 'zh-hans', 'zh-hant', 'ko', 'ja', 'fr', 'fa', 'pt-br')
PAGE_NAMES = ('', 'about-us', 'products', 'nutrition', 'services', 'puppy-kindergarten', 'deliveries', 'contact-us', 'search')
BASE_URL = 'https://david-williston.github.io/simply-natural-raw-pet-food/'
PREFIX = urlsplit(BASE_URL).path
errors = []

def check(condition, message):
    if not condition:
        errors.append(message)

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.refs, self.alternates, self.switches = set(), [], {}, {}
        self.language, self.direction = '', ''
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.language, self.direction = a.get('lang'), a.get('dir')
        if 'id' in a:
            self.ids.add(a['id'])
        self.refs.extend(a[k] for k in ('src', 'href') if k in a)
        self.refs.extend(s.strip().split()[0] for s in a.get('srcset', '').split(',') if s.strip())
        if tag == 'link' and a.get('rel') == 'alternate' and a.get('hreflang'):
            self.alternates[a['hreflang']] = a.get('href')
        if tag == 'a' and a.get('hreflang'):
            self.switches[a['hreflang']] = a.get('href')

pages = {path: Page(path.read_text()) for path in ROOT.rglob('*.html')}
reference_count = 0
for path, page in pages.items():
    for reference in page.refs:
        u = urlsplit(reference)
        if u.netloc and u.netloc != urlsplit(BASE_URL).netloc:
            continue
        if u.scheme and u.scheme not in ('http', 'https'):
            continue
        target_path = unquote(u.path)
        if target_path.startswith('/'):
            check(target_path.startswith(PREFIX), f'{path}: URL outside project path: {reference}')
            if not target_path.startswith(PREFIX):
                continue
            target = ROOT / target_path[len(PREFIX):]
        else:
            target = path.parent / target_path if target_path else path
        target = target.resolve()
        if target.is_dir():
            target /= 'index.html'
        reference_count += 1
        check(target.exists(), f'{path}: missing file for {reference}')
        if u.fragment and target in pages:
            check(u.fragment in pages[target].ids, f'{path}: missing anchor for {reference}')

english = json.loads((SOURCE / 'i18n/en.json').read_text())
for language in LANGUAGES:
    dictionary = SOURCE / f'i18n/{language}.json'
    check(dictionary.exists(), f'Missing UI dictionary: {language}')
    if dictionary.exists():
        translated = json.loads(dictionary.read_text())
        for key, message in english.items():
            check(bool(translated.get(key, {}).get('other')), f'{language}: missing UI message {key}')
            expected = re.findall(r'{{.*?}}', message['other'])
            actual = re.findall(r'{{.*?}}', translated.get(key, {}).get('other', ''))
            check(expected == actual, f'{language}: changed interpolation in {key}')
    relative = '' if language == 'en' else language + '/'
    for name in PAGE_NAMES:
        path = ROOT / relative / name / 'index.html'
        check(path in pages, f'Missing {language} page: {name or "home"}')
        if path not in pages:
            continue
        page = pages[path]
        check(page.language.lower() == language, f'{path}: incorrect HTML language')
        check(page.direction == ('rtl' if language == 'fa' else 'ltr'), f'{path}: incorrect text direction')
        check('main' in page.ids, f'{path}: missing skip-link target')
        check(set(page.switches) == set(LANGUAGES), f'{path}: missing language-switch links')
        check(set(LANGUAGES) <= set(page.alternates), f'{path}: missing hreflang alternatives')
        for alternate_language, url in page.switches.items():
            expected_path = PREFIX + ('' if alternate_language == 'en' else alternate_language + '/') + (name + '/' if name else '')
            check(urlsplit(url).path == expected_path, f'{path}: language switch leaves equivalent page')
    index_path = ROOT / relative / 'index.json'
    check(index_path.exists(), f'{language}: missing search index')
    if index_path.exists():
        entries = json.loads(index_path.read_text())
        check(len(entries) == 9, f'{language}: expected nine search entries')
        expected_root = BASE_URL + relative
        for entry in entries:
            check(entry['permalink'].startswith(expected_root), f'{language}: search points outside current language')
            check(bool(entry.get('content')), f'{language}: search entry lacks excerpt text')
    if language != 'en':
        for name in PAGE_NAMES:
            source = SOURCE / 'content' / f'{name or "_index"}.{language}.md'
            check(source.exists(), f'Missing translated source: {source}')

if errors:
    for message in errors:
        print('ERROR:', message)
    sys.exit(1)
print(f'Passed: {len(LANGUAGES)} languages, {len(LANGUAGES) * len(PAGE_NAMES)} pages, {reference_count} local URLs/assets/anchors, UI dictionaries, language equivalents and search indexes.')
