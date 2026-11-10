import * as params from '@params';

const input = document.getElementById('searchInput');
const list = document.getElementById('searchResults');
const box = document.getElementById('searchbox');
const empty = document.querySelector('.search-empty');
const error = document.querySelector('.search-error');
let pages = [];
let fuse;
const fold = text => String(text || '').normalize('NFKD').toLocaleLowerCase().replace(/\p{M}/gu, '');

// Keep offsets into the original text so accents, Persian and CJK characters
// can be highlighted without changing the visitor's language or inserting HTML.
function matchingRanges(text, words) {
  let normalized = '', offset = 0;
  const starts = [], ends = [];
  for (const character of text) {
    const normalizedCharacter = fold(character);
    for (let i = 0; i < normalizedCharacter.length; i++) {
      starts.push(offset); ends.push(offset + character.length);
    }
    normalized += normalizedCharacter;
    offset += character.length;
  }
  const ranges = [];
  for (const word of words) {
    let at = normalized.indexOf(word);
    while (at !== -1) {
      ranges.push([starts[at], ends[at + word.length - 1]]);
      at = normalized.indexOf(word, at + Math.max(1, word.length));
    }
  }
  return mergeRanges(ranges);
}

function mergeRanges(ranges) {
  const merged = [];
  ranges.sort((a, b) => a[0] - b[0]);
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

function appendHighlighted(element, text, ranges) {
  let position = 0;
  for (const [start, end] of ranges) {
    element.append(document.createTextNode(text.slice(position, start)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(start, end);
    element.append(mark);
    position = end;
  }
  element.append(document.createTextNode(text.slice(position)));
}

function snippet(text, ranges) {
  const length = 210;
  let start = 0;
  if (ranges.length) {
    // Prefer the passage with the most query matches rather than the page lead.
    let bestScore = -1;
    for (const [matchStart] of ranges) {
      const candidate = Math.max(0, matchStart - 55);
      const score = ranges.filter(([a, b]) => a >= candidate && b <= candidate + length)
        .reduce((sum, [a, b]) => sum + 15 + b - a, 0);
      if (score > bestScore) { bestScore = score; start = candidate; }
    }
    if (start) {
      const boundary = text.slice(start, start + 25).search(/[\s。！？.!?،؛]/u);
      if (boundary >= 0 && start + boundary < ranges.find(([a]) => a >= start)?.[0]) start += boundary + 1;
    }
  }
  start = Math.min(start, Math.max(0, text.length - length));
  if (start > 0 && /[\uDC00-\uDFFF]/.test(text[start])) start--;
  let end = Math.min(text.length, start + length);
  if (end < text.length) {
    const tail = text.slice(Math.max(start, end - 25), end);
    const boundaries = [...tail.matchAll(/[\s。！？.!?،؛]/gu)];
    const boundary = boundaries[boundaries.length - 1];
    if (boundary) end = end - tail.length + boundary.index;
  }
  if (end < text.length && /[\uDC00-\uDFFF]/.test(text[end])) end--;
  const clipped = ranges.filter(([a, b]) => b > start && a < end)
    .map(([a, b]) => [Math.max(0, a - start), Math.min(end, b) - start]);
  return { text: text.slice(start, end), ranges: clipped, before: start > 0, after: end < text.length };
}

function search() {
  const query = fold(input.value.trim());
  list.replaceChildren();
  if (!query) { empty.hidden = true; return; }
  const words = [...new Set(query.split(/\s+/).filter(Boolean))];
  const direct = pages.filter(page => words.every(word => fold(page.title + ' ' + page.content + ' ' + page.summary).includes(word)));
  const titleScore = page => words.filter(word => fold(page.title).includes(word)).length;
  direct.sort((a, b) => titleScore(b) - titleScore(a));
  const matches = direct.length ? direct.map(item => ({ item })) : fuse.search(query);
  matches.forEach(result => {
    const page = result.item;
    const titleRanges = matchingRanges(page.title, words);
    let text = page.content || page.summary || '';
    let ranges = matchingRanges(text, words);
    if (!ranges.length && page.summary && matchingRanges(page.summary, words).length) {
      text = page.summary; ranges = matchingRanges(text, words);
    }
    // Fuzzy matches can still show the relevant passage when the query has a typo.
    if (!ranges.length) {
      const fuzzy = result.matches?.find(match => match.key === 'content' || match.key === 'summary');
      if (fuzzy) { text = page[fuzzy.key]; ranges = mergeRanges(fuzzy.indices.map(([a, b]) => [a, b + 1])); }
    }
    const li = document.createElement('li');
    const title = document.createElement('h2');
    title.className = 'search-result-title';
    const link = document.createElement('a');
    link.className = 'entry-link';
    link.href = page.permalink;
    appendHighlighted(link, page.title, titleRanges);
    title.append(link); li.append(title);
    const excerpt = document.createElement('p');
    excerpt.className = 'search-result-excerpt';
    const preview = snippet(text, ranges);
    if (preview.before) excerpt.append(document.createTextNode('…'));
    appendHighlighted(excerpt, preview.text, preview.ranges);
    if (preview.after) excerpt.append(document.createTextNode('…'));
    li.append(excerpt); list.append(li);
  });
  empty.hidden = matches.length > 0;
}

async function initialize() {
  if (!input || !box) return;
  try {
    const response = await fetch(box.dataset.index);
    if (!response.ok) throw new Error('Search index unavailable');
    pages = await response.json();
    fuse = new Fuse(pages, {
      ...params.fuseOpts, keys: ['title', 'content', 'summary'], includeMatches: true,
      ignoreLocation: true, minMatchCharLength: 1, threshold: 0.3
    });
    input.disabled = false;
    input.addEventListener('input', search);
    input.addEventListener('search', search);
    document.querySelectorAll('.search-suggest button').forEach(button => {
      button.addEventListener('click', () => { input.value = button.dataset.q; search(); input.focus(); });
    });
    const query = new URLSearchParams(location.search).get('q');
    if (query) { input.value = query; search(); }
  } catch (err) {
    error.hidden = false;
    document.querySelectorAll('.search-suggest button').forEach(button => { button.disabled = true; });
  }
}

document.addEventListener('keydown', event => {
  if (!box?.contains(document.activeElement)) return;
  const links = [...list.querySelectorAll('a')];
  const current = links.indexOf(document.activeElement);
  if (event.key === 'Escape') { input.value = ''; list.replaceChildren(); empty.hidden = true; input.focus(); }
  if (event.key === 'ArrowDown' && links.length) { event.preventDefault(); links[Math.min(current + 1, links.length - 1)].focus(); }
  if (event.key === 'ArrowUp') { event.preventDefault(); if (current > 0) links[current - 1].focus(); else input.focus(); }
});

initialize();
