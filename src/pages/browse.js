// Movies and TV series: curated lists (popular, trending, top rated, …) and
// filters (genre, year, minimum rating, sort, TV network) via TMDB discover.
// Filter state lives in the URL so it survives reloads and can be shared.

import { h, mount } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { titleCard, chip } from '../ui/components.js';
import { errorState, stateCard, inlineError } from '../ui/feedback.js';
import * as tmdb from '../api/tmdb.js';
import { replaceQuery } from '../router.js';
import { setMeta } from './common.js';
import { pageSignal } from '../ui/lifecycle.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {import('../api/types.js').MediaType} MediaType */
/** @typedef {import('../api/types.js').TitleSummary} TitleSummary */

/** @type {Record<MediaType, [string, string][]>} */
const LISTS = {
  movie: [['popular', 'Popular'], ['trending', 'Trending'], ['top_rated', 'Top rated'], ['upcoming', 'Upcoming'], ['now_playing', 'Now playing']],
  tv: [['popular', 'Popular'], ['trending', 'Trending'], ['top_rated', 'Top rated'], ['airing_today', 'Airing today'], ['on_the_air', 'On the air']],
};

const SORTS = /** @type {const} */ ({
  movie: [['popularity.desc', 'Most popular'], ['vote_average.desc', 'Highest rated'], ['primary_release_date.desc', 'Newest'], ['primary_release_date.asc', 'Oldest'], ['title.asc', 'Title A–Z']],
  tv: [['popularity.desc', 'Most popular'], ['vote_average.desc', 'Highest rated'], ['first_air_date.desc', 'Newest'], ['first_air_date.asc', 'Oldest'], ['name.asc', 'Title A–Z']],
});

/** TMDB network ids offered as a filter; names and logos come from TMDB. */
const NETWORK_IDS = [213, 49, 2552, 1024, 2739, 453, 4, 174, 88];

const RATINGS = [['', 'Any'], ['6', '6+'], ['7', '7+'], ['8', '8+']];

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export async function render(main, route) {
  /** @type {MediaType} */
  const media = route.name === 'tv-shows' ? 'tv' : 'movie';
  const noun = media === 'tv' ? 'TV series' : 'Movies';
  setMeta(noun, media === 'tv'
    ? 'Browse TV series: popular, trending, top rated, airing today, with genre, year, rating and network filters.'
    : 'Browse movies: popular, trending, top rated, upcoming and in cinemas, with genre, year and rating filters.');

  const q = route.query;
  const state = {
    list: LISTS[media].some(([k]) => k === q.get('list')) ? /** @type {string} */ (q.get('list')) : 'popular',
    genres: (q.get('genre') ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0),
    year: /^\d{4}$/.test(q.get('year') ?? '') ? Number(q.get('year')) : 0,
    rating: ['6', '7', '8'].includes(q.get('rating') ?? '') ? /** @type {string} */ (q.get('rating')) : '',
    sort: SORTS[media].some(([k]) => k === q.get('sort')) ? /** @type {string} */ (q.get('sort')) : 'popularity.desc',
    network: Number(q.get('network')) || 0,
    page: 1,
  };
  const filtered = () => Boolean(state.genres.length || state.year || state.rating || state.network || state.sort !== 'popularity.desc');

  const signal = pageSignal(); // aborted if the visitor navigates away while this loads
  let genreList;
  try {
    genreList = (await tmdb.genres(media)).genres;
    if (signal.aborted) return;
  } catch (error) {
    if (signal.aborted) return;
    mount(main, h('div', { class: 'container page' }, errorState(error, () => render(main, route), noun.toLowerCase())));
    return;
  }

  const listChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Lists' });
  const genreChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Genres' });
  const ratingChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Minimum TMDB rating' });
  const yearSelect = h('select', { id: 'f-year', class: 'select' },
    h('option', { value: '', text: 'Any year' }),
    ...Array.from({ length: new Date().getFullYear() + 2 - 1920 }, (_, i) => {
      const y = new Date().getFullYear() + 1 - i;
      return h('option', { value: String(y), text: String(y) });
    }));
  const sortSelect = h('select', { id: 'f-sort', class: 'select' },
    ...SORTS[media].map(([value, label]) => h('option', { value, text: label })));
  const networkSelect = h('select', { id: 'f-network', class: 'select' }, h('option', { value: '', text: 'Any network' }));
  const grid = h('ul', { class: 'grid', 'aria-live': 'polite' });
  const summary = h('p', { class: 'results-summary', role: 'status' });
  const more = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet', text: `Show more ${media === 'tv' ? 'series' : 'films'}` });
  const clear = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--sm', text: 'Clear filters' });

  const filters = h('aside', { class: 'pr-card filters', 'aria-label': 'Filters' },
    h('h2', { class: 'filters__title', text: 'Genre' }), genreChips,
    h('div', { class: 'field' }, h('label', { for: 'f-year', text: 'Year' }), yearSelect),
    h('h2', { class: 'filters__title', text: 'TMDB rating' }), ratingChips,
    h('div', { class: 'field' }, h('label', { for: 'f-sort', text: 'Sort by' }), sortSelect),
    media === 'tv' ? h('div', { class: 'field' }, h('label', { for: 'f-network', text: 'Network' }), networkSelect) : null,
    clear);

  // On phones and tablets the filters fold away behind a "Filters" toggle;
  // on laptops they're a sticky sidebar (the toggle is hidden by CSS).
  const filterCount = h('span', { class: 'meta' });
  const filtersBox = h('details', { class: 'filters-box' },
    h('summary', {}, h('span', {}, 'Filters ', filterCount), icon('down', { size: 18 })),
    filters);
  if (window.matchMedia('(min-width: 900px)').matches || filtered()) filtersBox.open = true;

  mount(main, h('div', { class: 'container page' },
    h('header', { class: 'page-head' }, h('h1', { class: 'page-title', text: noun })),
    listChips,
    h('div', { class: 'browse' }, filtersBox, h('div', { class: 'browse__results' }, summary, grid, h('div', { class: 'more-row' }, more)))));

  if (media === 'tv') {
    Promise.allSettled(NETWORK_IDS.map((id) => tmdb.network(id))).then((results) => {
      for (const r of results) {
        if (r.status === 'fulfilled') networkSelect.appendChild(h('option', { value: String(r.value.id), text: r.value.name }));
      }
      networkSelect.value = state.network ? String(state.network) : '';
    });
  }

  const syncUrl = () => replaceQuery(filtered()
    ? { genre: state.genres.join(','), year: state.year || '', rating: state.rating, sort: state.sort !== 'popularity.desc' ? state.sort : '', network: state.network || '' }
    : { list: state.list !== 'popular' ? state.list : '' });

  const paintControls = () => {
    listChips.replaceChildren(...LISTS[media].map(([key, label]) => chip(label, !filtered() && state.list === key, () => {
      Object.assign(state, { list: key, genres: [], year: 0, rating: '', sort: 'popularity.desc', network: 0 });
      reload();
    })));
    genreChips.replaceChildren(...genreList.map((g) => chip(g.name, state.genres.includes(g.id), () => {
      state.genres = state.genres.includes(g.id) ? state.genres.filter((id) => id !== g.id) : [...state.genres, g.id];
      reload();
    })));
    ratingChips.replaceChildren(...RATINGS.map(([value, label]) => chip(label, state.rating === value, () => { state.rating = value; reload(); })));
    yearSelect.value = state.year ? String(state.year) : '';
    sortSelect.value = state.sort;
    clear.hidden = !filtered();
    const active = state.genres.length + (state.year ? 1 : 0) + (state.rating ? 1 : 0) + (state.network ? 1 : 0) + (state.sort !== 'popularity.desc' ? 1 : 0);
    filterCount.textContent = active ? `· ${active} on` : '';
  };

  /** @returns {Promise<import('../api/types.js').Paged<TitleSummary>>} */
  const fetchPage = () => {
    if (filtered()) {
      return tmdb.discover(media, {
        genres: state.genres, year: state.year, minRating: Number(state.rating) || undefined,
        sort: state.sort, network: state.network || undefined, page: state.page,
      });
    }
    if (state.list === 'trending') return tmdb.trendingTitles(media, 'week', state.page);
    return media === 'movie'
      ? tmdb.movieList(/** @type {import('../api/tmdb.js').MovieList} */ (state.list), state.page)
      : tmdb.tvList(/** @type {import('../api/tmdb.js').TvList} */ (state.list), state.page);
  };

  let seq = 0;
  const load = async (append = false) => {
    const mine = ++seq;
    more.disabled = true;
    if (!append) { grid.replaceChildren(); summary.textContent = 'Loading…'; }
    grid.parentElement?.querySelector('.inline-error')?.remove();
    try {
      const data = await fetchPage();
      if (mine !== seq) return;
      grid.append(...data.results.map((t) => h('li', {}, titleCard(t, media, { eager: !append }))));
      const shown = grid.children.length;
      const total = Math.min(data.total_results, 10_000);
      summary.textContent = shown ? `Showing ${shown.toLocaleString()} of ${total.toLocaleString()}` : '';
      more.hidden = data.page >= Math.min(data.total_pages, 500);
      more.disabled = false;
      if (!shown) {
        grid.replaceChildren(h('li', { class: 'grid__wide' }, stateCard({
          mood: 'curious', compact: true, title: 'Nothing matches these filters',
          body: 'Try fewer genres, another year or a lower rating.',
          action: h('button', { type: 'button', class: 'pr-btn pr-btn--brand', text: 'Clear filters', on: { click: () => clear.click() } }),
        })));
        more.hidden = true;
      }
    } catch (error) {
      if (mine !== seq) return;
      summary.textContent = '';
      more.hidden = true;
      grid.parentElement?.insertBefore(inlineError(error, () => load(append)), grid);
    }
  };

  const reload = () => { state.page = 1; paintControls(); syncUrl(); load(); };

  yearSelect.addEventListener('change', () => { state.year = Number(yearSelect.value) || 0; reload(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; reload(); });
  networkSelect.addEventListener('change', () => { state.network = Number(networkSelect.value) || 0; reload(); });
  clear.addEventListener('click', () => {
    Object.assign(state, { genres: [], year: 0, rating: '', sort: 'popularity.desc', network: 0 });
    reload();
  });
  more.addEventListener('click', () => { state.page += 1; load(true); });

  paintControls();
  await load();
}
