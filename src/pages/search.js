// Search across films, series and people. Debounced as you type, with
// category tabs and counts, loading, empty and error states.

import { h, mount, debounce } from '../ui/dom.js';
import { filmRow, titleOf, dateOf, yearOf, tmdbScore, watchlistButton, snapshot } from '../ui/components.js';
import { stateCard, inlineError } from '../ui/feedback.js';
import { mochi } from '../ui/mochi.js';
import { searchBox } from '../ui/header-search.js';
import { rail } from '../ui/rail.js';
import { titleCard } from '../ui/components.js';
import * as tmdb from '../api/tmdb.js';
import { href, replaceQuery } from '../router.js';
import { setMeta } from './common.js';
import { pageSignal } from '../ui/lifecycle.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {import('../api/types.js').MultiResult} MultiResult */
/** @typedef {'all' | 'movie' | 'tv' | 'person'} Tab */

const TABS = /** @type {const} */ ([['all', 'All'], ['movie', 'Films'], ['tv', 'Series'], ['person', 'People']]);

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export async function render(main, route) {
  const initial = (route.query.get('q') ?? '').trim().slice(0, 100);
  const tabParam = route.query.get('type');
  /** @type {{ query: string, tab: Tab, page: number }} */
  const state = { query: initial, tab: TABS.some(([k]) => k === tabParam) ? /** @type {Tab} */ (tabParam) : 'all', page: 1 };

  const cat = h('div', { class: 'search-cat' }, mochi('look', 110));
  const tabs = h('div', { class: 'chips', role: 'group', 'aria-label': 'Result type' });
  const summary = h('p', { class: 'results-summary', role: 'status' });
  const results = h('ul', { class: 'rows' });
  const more = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet', text: 'Show more results', hidden: true });
  const extra = h('div', {});
  /** @type {Record<Tab, number>} */
  let counts = { all: 0, movie: 0, tv: 0, person: 0 };

  const box = searchBox({ id: 'page-q', large: true, suggestions: false, signal: pageSignal(), value: initial, placeholder: 'Search films, series, people…', onSubmit: (q) => { typed.cancel(); run(q); } });
  mount(main, h('div', { class: 'container page' },
    h('header', { class: 'page-head page-head--mascot' },
      h('div', { class: 'page-head__main' }, h('h1', { class: 'page-title', text: 'Find a film' }), box.element),
      cat),
    tabs, summary, results, h('div', { class: 'more-row' }, more), extra));
  box.input.addEventListener('input', () => typed(box.input.value.trim()));

  const paintTabs = () => tabs.replaceChildren(...TABS.map(([key, label]) => {
    const count = state.query && key !== 'all' ? ` ${counts[key] > 999 ? '999+' : counts[key]}` : '';
    return h('button', {
      type: 'button', class: 'pr-chip', 'aria-pressed': String(state.tab === key), text: `${label}${count}`,
      on: { click: () => { state.tab = key; state.page = 1; sync(); load(); } },
    });
  }));
  const sync = () => replaceQuery({ q: state.query, type: state.tab !== 'all' ? state.tab : '' });

  let seq = 0;
  const load = async (append = false) => {
    const mine = ++seq;
    paintTabs();
    extra.replaceChildren();
    results.parentElement?.querySelector('.inline-error')?.remove();
    if (!state.query) { showStart(); return; }
    if (!append) { results.replaceChildren(); summary.textContent = 'Searching…'; cat.replaceChildren(mochi('look', 110, 'Mochi looking around')); }
    more.hidden = true;
    try {
      const data = state.tab === 'all'
        ? await tmdb.searchMulti(state.query, state.page)
        : await tmdb.search(state.tab, state.query, state.page);
      if (mine !== seq) return;
      /** @type {MultiResult[]} */
      const items = state.tab === 'all'
        ? /** @type {MultiResult[]} */ (data.results).filter((r) => ['movie', 'tv', 'person'].includes(r.media_type))
        : data.results.map((r) => /** @type {MultiResult} */ ({ ...r, media_type: state.tab }));
      results.append(...items.map(resultRow));
      const shown = results.children.length;
      summary.textContent = shown ? `${data.total_results.toLocaleString()} results for “${state.query}”` : '';
      more.hidden = data.page >= Math.min(data.total_pages, 500);
      if (!shown) {
        cat.replaceChildren();
        results.replaceChildren(h('li', {}, stateCard({
          mood: 'curious', compact: true, title: `No ${state.tab === 'person' ? 'people' : 'films'} match “${state.query}”`,
          body: 'Try a title, a person or a year. Spelling close enough usually works.',
          action: h('button', { type: 'button', class: 'pr-btn pr-btn--quiet', text: 'Clear search', on: { click: () => { box.input.value = ''; run(''); box.input.focus(); } } }),
        })));
      } else {
        cat.replaceChildren(mochi('curious', 110));
      }
    } catch (error) {
      if (mine !== seq) return;
      summary.textContent = '';
      cat.replaceChildren(mochi('sad', 110));
      results.parentElement?.insertBefore(inlineError(error, () => load(append)), results);
    }
  };

  const loadCounts = async () => {
    if (!state.query) { counts = { all: 0, movie: 0, tv: 0, person: 0 }; paintTabs(); return; }
    const query = state.query;
    const settled = await Promise.allSettled([tmdb.search('movie', query), tmdb.search('tv', query), tmdb.search('person', query)]);
    if (query !== state.query) return;
    const [m, t, p] = settled.map((s) => (s.status === 'fulfilled' ? s.value.total_results : 0));
    counts = { all: (m ?? 0) + (t ?? 0) + (p ?? 0), movie: m ?? 0, tv: t ?? 0, person: p ?? 0 };
    paintTabs();
  };

  /** @param {string} query */
  const run = (query) => {
    state.query = query.slice(0, 100);
    state.page = 1;
    setMeta(state.query ? `Search: ${state.query}` : 'Search', 'Search films, series and people on purrama.');
    sync();
    load();
    loadCounts();
  };
  const typed = debounce(run, 350);
  // A pending keystroke must not fire after the visitor has left this page.
  pageSignal().addEventListener('abort', () => typed.cancel());

  const showStart = () => {
    results.replaceChildren();
    summary.textContent = '';
    more.hidden = true;
    cat.replaceChildren(mochi('look', 110));
    extra.replaceChildren(rail({ title: 'Trending today', load: async () => {
      const { results: list } = await tmdb.trending('all', 'day');
      return tmdb.titlesOnly(list).map((r) => titleCard(r, r.media_type));
    } }));
  };

  more.addEventListener('click', () => { state.page += 1; load(true); });
  run(initial);
  if (!initial) box.input.focus();
}

/** @param {MultiResult} r */
function resultRow(r) {
  if (r.media_type === 'person') {
    const known = (r.known_for ?? []).slice(0, 2).map(titleOf).join(', ');
    return filmRow({
      url: href(`/person/${r.id}`), posterPath: r.profile_path, profile: true, title: r.name,
      meta: [r.known_for_department, known].filter(Boolean).join(' · '),
    });
  }
  const kind = r.media_type === 'tv' ? 'Series' : 'Film';
  const row = filmRow({
    url: href(`/${r.media_type}/${r.id}`), posterPath: r.poster_path, title: titleOf(r),
    meta: [yearOf(dateOf(r)), kind].filter(Boolean).join(' · '),
    right: tmdbScore(r.vote_average),
  });
  const title = /** @type {import('../api/types.js').TitleSummary} */ (/** @type {unknown} */ (r)); // narrowed above: not a person
  row.appendChild(watchlistButton(snapshot(title, r.media_type), 'row-item__save'));
  return row;
}
