// Header search with live suggestions across movies, series and people.
// ARIA combobox: arrows move through suggestions, Enter opens one (or the full
// results page), Escape closes.

import { h, debounce } from './dom.js';
import { icon } from './icons.js';
import { searchMulti } from '../api/tmdb.js';
import { imageUrl } from '../api/images.js';
import { href } from '../router.js';
import { titleOf, dateOf, yearOf } from './components.js';

/** @typedef {import('../api/types.js').MultiResult} MultiResult */

/** @param {MultiResult} r */
function describe(r) {
  if (r.media_type === 'person') {
    return { url: href(`/person/${r.id}`), title: r.name, meta: r.known_for_department ?? 'Person', img: imageUrl(r.profile_path, 'profile', 'sm') };
  }
  const kind = r.media_type === 'tv' ? 'Series' : 'Film';
  return {
    url: href(`/${r.media_type}/${r.id}`),
    title: titleOf(r),
    meta: [yearOf(dateOf(r)), kind].filter(Boolean).join(' · '),
    img: imageUrl(r.poster_path, 'poster', 'sm'),
  };
}

/**
 * @param {{ onSubmit: (query: string) => void, placeholder?: string, id?: string, large?: boolean, value?: string, suggestions?: boolean, signal?: AbortSignal }} options
 *   signal: removes the box's window listeners (pass the page signal for boxes inside a page)
 */
export function searchBox(options) {
  const id = options.id ?? 'search';
  const listId = `${id}-suggestions`;
  const input = h('input', {
    type: 'search', id, name: 'q', placeholder: options.placeholder ?? 'Search films, series, people…',
    autocomplete: 'off', spellcheck: 'false', maxlength: '100', role: 'combobox',
    'aria-label': 'Search films, series and people', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': listId,
  });
  if (options.value) input.value = options.value;
  const list = h('ul', { class: 'suggest', id: listId, role: 'listbox', 'aria-label': 'Suggestions', hidden: true });
  const status = h('span', { class: 'visually-hidden', 'aria-live': 'polite' });
  const wrap = h('div', { class: `search-box${options.large ? ' search-box--large' : ''}` },
    h('label', { class: 'pr-search' }, icon('search', { size: 18 }), input), list, status);

  /** @type {string[]} urls of the options, in order (the last is "See all") */
  let items = [];
  let active = -1;
  let seq = 0;

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  /** @param {number} index */
  const highlight = (index) => {
    active = index;
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === index)));
    if (index >= 0) input.setAttribute('aria-activedescendant', `${listId}-${index}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const suggest = debounce(async (/** @type {string} */ query) => {
    const mine = ++seq;
    if (query.length < 2) { close(); return; }
    try {
      const data = await searchMulti(query);
      if (mine !== seq) return; // a newer keystroke won
      const results = data.results
        .filter((r) => r.media_type === 'movie' || r.media_type === 'tv' || r.media_type === 'person')
        .slice(0, 6)
        .map(describe);
      const allUrl = href('/search', { q: query });
      items = [...results.map((r) => r.url), allUrl];
      const options = results.map((r, i) => h('li', { id: `${listId}-${i}`, role: 'option', 'aria-selected': 'false' },
        h('a', { href: r.url, tabindex: '-1', on: { click: close } },
          r.img
            ? h('img', { src: r.img, alt: '', width: 32, height: 48, loading: 'lazy' })
            : h('span', { class: 'suggest__thumb', 'aria-hidden': 'true' }),
          h('span', { class: 'suggest__text' },
            h('span', { class: 'suggest__title', text: r.title }),
            h('span', { class: 'suggest__meta', text: r.meta })))));
      list.replaceChildren(...options,
        h('li', { class: 'suggest__all', role: 'option', id: `${listId}-${results.length}`, 'aria-selected': 'false' },
          h('a', { href: allUrl, tabindex: '-1', on: { click: close }, text: `See all results for “${query}”` })));
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      highlight(-1);
      status.textContent = results.length ? `${results.length} suggestions` : 'No suggestions';
    } catch {
      if (mine === seq) close();
    }
  }, 250);

  if (options.suggestions !== false) input.addEventListener('input', () => suggest(input.value.trim()));
  else {
    input.removeAttribute('role');
    input.removeAttribute('aria-autocomplete');
    input.removeAttribute('aria-expanded');
    input.removeAttribute('aria-controls');
  }
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && !list.hidden) { event.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
    else if (event.key === 'ArrowUp' && !list.hidden) { event.preventDefault(); highlight(Math.max(active - 1, -1)); }
    else if (event.key === 'Escape') { close(); }
    else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = active >= 0 ? items[active] : null;
      seq++; // an in-flight suggestion request must not reopen the list
      suggest.cancel();
      close();
      if (chosen) location.hash = chosen;
      else if (input.value.trim()) options.onSubmit(input.value.trim());
    }
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
  // On navigation, drop pending and in-flight suggestions so they can't reopen over the next page.
  window.addEventListener('hashchange', () => { seq++; suggest.cancel(); close(); }, { signal: options.signal });
  return { element: wrap, input, close };
}
