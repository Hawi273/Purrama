// Home: tonight's featured pick, then rails of trending, popular, top rated
// and upcoming titles, plus picks based on the visitor's own lists.

import { h, mount } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { rail } from '../ui/rail.js';
import { titleCard, titleOf, dateOf, yearOf, tmdbScore, snapshot, watchlistButton } from '../ui/components.js';
import { errorState, openTrailer } from '../ui/feedback.js';
import { mochi } from '../ui/mochi.js';
import { backdropSrcset, imageUrl } from '../api/images.js';
import * as tmdb from '../api/tmdb.js';
import { library } from '../state/library.js';
import { href } from '../router.js';
import { setMeta, greeting } from './common.js';

/** @typedef {import('../api/types.js').TitleSummary} TitleSummary */
/** @typedef {import('../api/types.js').MediaType} MediaType */

/**
 * @param {HTMLElement} main
 */
export async function render(main) {
  setMeta('', 'Find something to watch tonight: trending films and series, top rated picks and what is coming soon.');
  const heroSlot = h('div', { class: 'hero-slot' }, h('div', { class: 'pr-card pr-card--hero hero hero--skeleton', 'aria-hidden': 'true' }));
  const page = h('div', { class: 'container page page--home' },
    h('h1', { class: 'visually-hidden', text: 'purrama home' }),
    heroSlot,
    personalRails(),
    rail({ title: 'Trending films this week', more: href('/movies', { list: 'trending' }), load: () => cards(tmdb.trendingTitles('movie', 'week'), 'movie', true) }),
    rail({ title: 'Trending series this week', more: href('/tv', { list: 'trending' }), load: () => cards(tmdb.trendingTitles('tv', 'week'), 'tv') }),
    rail({ title: 'Popular films', more: href('/movies', { list: 'popular' }), load: () => cards(tmdb.movieList('popular'), 'movie') }),
    rail({ title: 'Popular series', more: href('/tv', { list: 'popular' }), load: () => cards(tmdb.tvList('popular'), 'tv') }),
    rail({ title: 'Top rated films', more: href('/movies', { list: 'top_rated' }), load: () => cards(tmdb.movieList('top_rated'), 'movie') }),
    rail({ title: 'Top rated series', more: href('/tv', { list: 'top_rated' }), load: () => cards(tmdb.tvList('top_rated'), 'tv') }),
    rail({ title: 'Coming soon to cinemas', more: href('/movies', { list: 'upcoming' }), load: () => upcoming() }),
  );
  mount(main, page);
  await loadHero(heroSlot);
}

/**
 * @param {Promise<{ results: TitleSummary[] }>} promise
 * @param {MediaType} media
 * @param {boolean} [eager]
 */
async function cards(promise, media, eager = false) {
  const { results } = await promise;
  return results.map((t, i) => titleCard(t, media, { eager: eager && i < 4 }));
}

/** Upcoming films, soonest first, only those not released yet. */
async function upcoming() {
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await tmdb.movieList('upcoming');
  return results
    .filter((t) => (t.release_date ?? '') >= today)
    .sort((a, b) => (a.release_date ?? '').localeCompare(b.release_date ?? ''))
    .map((t) => titleCard(t, 'movie', { meta: t.release_date ? `Out ${shortDate(t.release_date)}` : undefined }));
}

/** @param {string} date */
function shortDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Rails from the visitor's own lists: their watchlist, and picks based on a title they liked. */
function personalRails() {
  const box = h('div', { class: 'personal' });
  const watchlist = library.items('watchlist');
  if (watchlist.length) {
    box.appendChild(rail({
      title: 'From your watchlist',
      more: href('/library', { tab: 'watchlist' }),
      moreLabel: 'Open watchlist',
      load: async () => watchlist.slice(0, 20).map((s) => titleCard(
        { id: s.id, title: s.title, poster_path: s.poster_path, release_date: s.date }, s.media,
        { meta: [yearOf(s.date), s.media === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · ') })),
    }));
  }
  // Recommendations seeded by the most recent title rated 4+ stars, favourited or saved.
  const seed = [
    ...library.items('ratings').filter((r) => 'rating' in r && r.rating >= 4),
    ...library.items('favorites'),
    ...watchlist,
  ][0];
  if (seed) {
    box.appendChild(rail({
      title: `Because you liked ${seed.title}`,
      load: async () => {
        const details = seed.media === 'movie' ? await tmdb.movie(seed.id) : await tmdb.tv(seed.id);
        return (details.recommendations?.results ?? []).slice(0, 20).map((t) => titleCard(t, seed.media));
      },
    }));
  }
  return box;
}

/** @param {HTMLElement} slot */
async function loadHero(slot) {
  try {
    const { results } = await tmdb.trending('all', 'day');
    const titles = tmdb.titlesOnly(results);
    const pick = titles.find((r) => r.backdrop_path) ?? titles[0];
    if (!pick) { slot.remove(); return; }
    const media = pick.media_type;
    const [details, genreNames] = await Promise.all([
      media === 'movie' ? tmdb.movie(pick.id) : tmdb.tv(pick.id),
      tmdb.genreMap(media),
    ]);
    mount(slot, hero(pick, media, details, genreNames));
  } catch (error) {
    mount(slot, errorState(error, () => loadHero(slot), "tonight's pick"));
  }
}

/**
 * @param {TitleSummary} pick
 * @param {MediaType} media
 * @param {import('../api/types.js').MovieDetails | import('../api/types.js').TvDetails} details
 * @param {Map<number, string>} genreNames
 */
function hero(pick, media, details, genreNames) {
  const name = titleOf(pick);
  const genres = (pick.genre_ids ?? []).map((id) => genreNames.get(id)).filter(Boolean).slice(0, 3);
  const trailer = tmdb.pickTrailer(details.videos);
  const url = href(`/${media}/${pick.id}`);
  const backdrop = imageUrl(pick.backdrop_path, 'backdrop', 'lg');
  return h('article', { class: 'pr-card pr-card--hero hero', 'aria-labelledby': 'hero-title' },
    h('div', { class: 'hero__text' },
      h('p', { class: 'eyebrow', text: `${greeting()} · Tonight's pick` }),
      h('h2', { class: 'hero__title', id: 'hero-title' }, h('a', { href: url, text: name })),
      h('p', { class: 'meta-line' },
        [yearOf(dateOf(pick)), media === 'tv' ? 'Series' : 'Film', genres.join(', ')].filter(Boolean).join(' · '), ' ', tmdbScore(pick.vote_average)),
      pick.overview ? h('p', { class: 'hero__overview', text: pick.overview }) : null,
      h('div', { class: 'actions' },
        h('a', { class: 'pr-btn pr-btn--primary', href: url, text: 'See details' }),
        trailer ? h('button', { type: 'button', class: 'pr-btn pr-btn--brand', on: { click: () => openTrailer(trailer.key, name) } }, icon('play'), 'Watch trailer') : null,
        watchlistButton(snapshot(pick, media), 'hero__save'))),
    h('div', { class: 'hero__art' },
      backdrop
        ? h('img', { src: backdrop, srcset: backdropSrcset(pick.backdrop_path), sizes: '(max-width: 900px) 100vw, 640px', alt: '', fetchpriority: 'high', width: 1280, height: 720 })
        : mochi('night', 220, 'Mochi stargazing')));
}
