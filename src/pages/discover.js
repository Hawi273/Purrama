// Discover: pick films or series, a genre and a decade, and get three rails
// (most popular, highest rated, newest) from TMDB discover.

import { h, mount } from '../ui/dom.js';
import { chip, titleCard } from '../ui/components.js';
import { rail } from '../ui/rail.js';
import { errorState } from '../ui/feedback.js';
import { mochi } from '../ui/mochi.js';
import * as tmdb from '../api/tmdb.js';
import { replaceQuery, href } from '../router.js';
import { setMeta } from './common.js';
import { pageSignal } from '../ui/lifecycle.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {import('../api/types.js').MediaType} MediaType */

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960];

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export async function render(main, route) {
  setMeta('Discover', 'Discover films and series by genre and decade: the most popular, the highest rated and the newest.');
  const q = route.query;
  /** @type {{ media: MediaType, genre: number, decade: number }} */
  const state = {
    media: q.get('type') === 'tv' ? 'tv' : 'movie',
    genre: Number(q.get('genre')) || 0,
    decade: DECADES.includes(Number(q.get('decade'))) ? Number(q.get('decade')) : 0,
  };

  /** @type {Record<MediaType, import('../api/types.js').Genre[]>} */
  let genreLists;
  const signal = pageSignal(); // aborted if the visitor navigates away while this loads
  try {
    const [movie, tv] = await Promise.all([tmdb.genres('movie'), tmdb.genres('tv')]);
    if (signal.aborted) return;
    genreLists = { movie: movie.genres, tv: tv.genres };
  } catch (error) {
    if (signal.aborted) return;
    mount(main, h('div', { class: 'container page' }, errorState(error, () => render(main, route), 'genres')));
    return;
  }

  const typeChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Films or series' });
  const genreChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Genre' });
  const decadeChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Decade' });
  const rails = h('div', { class: 'rails' });

  mount(main, h('div', { class: 'container page' },
    h('header', { class: 'page-head page-head--mascot' },
      h('div', {},
        h('h1', { class: 'page-title', text: 'Discover' }),
        h('p', { class: 'page-lede', text: 'Pick a mood. Mochi will dig through TMDB for the good stuff.' })),
      mochi('curious', 120)),
    h('section', { class: 'pr-card discover-controls', 'aria-label': 'What to discover' },
      typeChips,
      h('h2', { class: 'filters__title', text: 'Genre' }), genreChips,
      h('h2', { class: 'filters__title', text: 'Decade' }), decadeChips),
    rails));

  const paint = () => {
    typeChips.replaceChildren(
      chip('Films', state.media === 'movie', () => { state.media = 'movie'; state.genre = fixGenre(); update(); }),
      chip('Series', state.media === 'tv', () => { state.media = 'tv'; state.genre = fixGenre(); update(); }));
    genreChips.replaceChildren(
      chip('All genres', !state.genre, () => { state.genre = 0; update(); }),
      ...genreLists[state.media].map((g) => chip(g.name, state.genre === g.id, () => { state.genre = g.id; update(); })));
    decadeChips.replaceChildren(
      chip('Any time', !state.decade, () => { state.decade = 0; update(); }),
      ...DECADES.map((d) => chip(`${d}s`, state.decade === d, () => { state.decade = d; update(); })));
  };
  // Genre ids differ between films and series; keep the genre only if it exists in both.
  const fixGenre = () => (genreLists[state.media].some((g) => g.id === state.genre) ? state.genre : 0);

  const showRails = () => {
    const genreName = genreLists[state.media].find((g) => g.id === state.genre)?.name ?? '';
    const noun = state.media === 'tv' ? 'series' : 'films';
    const label = [state.decade ? `${state.decade}s` : '', genreName.toLowerCase(), noun].filter(Boolean).join(' ');
    const dateKey = state.media === 'tv' ? 'first_air_date' : 'primary_release_date';
    /** @param {string} sort @param {string} title */
    const make = (sort, title) => rail({
      title,
      more: href(state.media === 'tv' ? '/tv' : '/movies', { genre: state.genre || '', sort }),
      load: async () => {
        const { results } = await discoverInDecade(state.media, state.genre, state.decade, sort, dateKey);
        return results.map((t) => titleCard(t, state.media));
      },
    });
    rails.replaceChildren(
      make('popularity.desc', `Most popular ${label}`),
      make('vote_average.desc', `Highest rated ${label}`),
      make(`${dateKey}.desc`, `Newest ${label}`));
  };

  const update = () => {
    replaceQuery({ type: state.media === 'tv' ? 'tv' : '', genre: state.genre || '', decade: state.decade || '' });
    paint();
    showRails();
  };
  paint();
  showRails();
}

/**
 * Discover with an optional decade window. Newest never shows future dates.
 * @param {MediaType} media
 * @param {number} genre
 * @param {number} decade
 * @param {string} sort
 * @param {string} dateKey
 */
function discoverInDecade(media, genre, decade, sort, dateKey) {
  const today = new Date().toISOString().slice(0, 10);
  const from = decade ? `${decade}-01-01` : '';
  const toYear = decade ? `${decade + 9}-12-31` : today;
  const to = toYear > today ? today : toYear;
  return tmdb.discoverRange(media, { genres: genre ? [genre] : [], sort, from, to, dateKey });
}
