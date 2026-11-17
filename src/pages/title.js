// Movie and TV details: hero with poster and your actions, cast and crew,
// seasons and episodes (TV), trailers, images, collection, recommendations
// and similar titles. Everything shown comes from TMDB.

import { h, mount } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import {
  poster, tmdbScore, runtime, longDate, yearOf, starsInput, personCard, titleCard, sectionHead, snapshot,
} from '../ui/components.js';
import { rail } from '../ui/rail.js';
import { errorState, toast, openTrailer, inlineError } from '../ui/feedback.js';
import { openGallery } from '../ui/gallery.js';
import { mochi } from '../ui/mochi.js';
import { pageSignal } from '../ui/lifecycle.js';
import { imageUrl } from '../api/images.js';
import * as tmdb from '../api/tmdb.js';
import { library } from '../state/library.js';
import { href, replaceQuery } from '../router.js';
import { setMeta } from './common.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {import('../api/types.js').MediaType} MediaType */
/** @typedef {import('../api/types.js').MovieDetails} MovieDetails */
/** @typedef {import('../api/types.js').TvDetails} TvDetails */
/** @typedef {import('../api/types.js').Credits} Credits */

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' });
const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export async function render(main, route) {
  /** @type {MediaType} */
  const media = route.name === 'tv' ? 'tv' : 'movie';
  const id = Number(route.params.id);
  const signal = pageSignal(); // aborted if the visitor navigates away while this loads
  /** @type {MovieDetails | TvDetails} */
  let details;
  try {
    details = media === 'movie' ? await tmdb.movie(id) : await tmdb.tv(id);
    if (signal.aborted) return;
  } catch (error) {
    if (signal.aborted) return;
    setMeta('Not found');
    mount(main, h('div', { class: 'container page' }, errorState(error, () => render(main, route), media === 'tv' ? 'this series' : 'this film')));
    return;
  }
  const movie = 'title' in details ? details : null;
  const show = 'title' in details ? null : details;
  const name = movie ? movie.title : show ? show.name : 'Untitled';
  setMeta(name, details.overview || `${name} on purrama.`);

  const page = h('div', { class: 'container page page--title' },
    h('a', { class: 'back-link', href: href(media === 'tv' ? '/tv' : '/movies') }, icon('back', { size: 16 }), media === 'tv' ? 'Back to series' : 'Back to films'),
    hero(details, media, name),
    h('div', { class: 'detail-layout' },
      h('div', { class: 'detail-main' },
        castSection(movie ? movie.credits : show?.aggregate_credits, media),
        crewSection(details),
        show ? seasonsSection(show, route) : null,
        videosSection(details, name),
        imagesSection(details, name)),
      factsCard(details)),
    movie?.belongs_to_collection ? collectionSection(movie.belongs_to_collection.id) : null,
    rail({ title: 'Recommended for you', load: async () => (details.recommendations?.results ?? []).map((t) => titleCard(t, media)) }),
    rail({ title: media === 'tv' ? 'Similar series' : 'More like this', load: async () => (details.similar?.results ?? []).map((t) => titleCard(t, media)) }),
  );
  mount(main, page);
}

/**
 * @param {MovieDetails | TvDetails} d
 * @param {MediaType} media
 * @param {string} name
 */
function hero(d, media, name) {
  const isMovie = 'title' in d;
  const date = isMovie ? d.release_date : d.first_air_date;
  const year = yearOf(date);
  const length = isMovie
    ? runtime(d.runtime)
    : [d.number_of_seasons ? `${d.number_of_seasons} season${d.number_of_seasons > 1 ? 's' : ''}` : '', d.number_of_episodes ? `${d.number_of_episodes} episodes` : ''].filter(Boolean).join(' · ');
  const cert = certification(d);
  const original = isMovie ? d.original_title : d.original_name;
  const directors = isMovie
    ? (d.credits?.crew ?? []).filter((c) => c.job === 'Director')
    : (d.created_by ?? []);
  const item = snapshot({ id: d.id, title: name, poster_path: d.poster_path, release_date: date }, media);

  return h('article', { class: 'pr-card pr-card--hero title-hero', 'aria-labelledby': 'title-name' },
    h('div', { class: 'title-hero__poster' }, poster(d.poster_path, name, { eager: true, sizes: '(max-width: 700px) 50vw, 260px' })),
    h('div', { class: 'title-hero__body' },
      h('div', { class: 'chips' },
        year ? h('span', { class: 'pr-chip pr-chip--accent', text: year }) : null,
        length ? h('span', { class: 'pr-chip', text: length }) : null,
        cert ? h('span', { class: 'pr-chip', title: 'Certification', text: cert }) : null,
        ...d.genres.slice(0, 4).map((g) => h('a', { class: 'pr-chip chip-link', href: href(media === 'tv' ? '/tv' : '/movies', { genre: g.id }), text: g.name }))),
      h('h1', { class: 'title-hero__name', id: 'title-name', text: name }),
      original && original !== name ? h('p', { class: 'meta', text: `Original title: ${original}` }) : null,
      d.tagline ? h('p', { class: 'tagline', text: d.tagline }) : null,
      directors.length ? h('p', { class: 'meta' }, isMovie ? 'Directed by ' : 'Created by ',
        ...directors.slice(0, 3).flatMap((p, i) => [i ? ', ' : '', h('a', { href: href(`/person/${p.id}`), text: p.name })])) : null,
      h('p', { class: 'meta score-line' }, tmdbScore(d.vote_average), d.vote_count ? ` ${d.vote_count.toLocaleString()} votes on TMDB` : ' Not rated on TMDB yet'),
      d.overview ? h('p', { class: 'overview', text: d.overview }) : h('p', { class: 'overview muted', text: 'TMDB has no overview for this title yet.' }),
      actionPanel(d, media, name, item)));
}

/**
 * Your rating, lists and sharing. Mochi reacts to the rating.
 * @param {MovieDetails | TvDetails} d
 * @param {MediaType} media
 * @param {string} name
 * @param {Omit<import('../state/library.js').SavedTitle, 'addedAt'>} item
 */
function actionPanel(d, media, name, item) {
  const signal = pageSignal();
  const current = library.rating(media, d.id);
  /** @param {number} r @returns {import('../ui/mochi.js').MochiMood} */
  const moodFor = (r) => (r === 0 ? 'curious' : r >= 8 ? 'rated' : r >= 5 ? 'blink' : 'sad');
  const cat = h('div', { class: 'action-panel__cat' }, mochi(moodFor(current), 88));
  const hint = h('p', { class: 'action-panel__hint', text: current ? 'Tap your rating again to clear it.' : 'Tap a star to rate it.' });
  const stars = starsInput(current, (value) => {
    library.rate(item, value);
    cat.replaceChildren(mochi(moodFor(value), 88, value ? `Mochi reacting to your ${value}-star rating` : undefined));
    hint.textContent = value ? 'Saved. Tap your rating again to clear it.' : 'Rating cleared.';
    toast(value ? `Rating saved` : 'Rating cleared', { detail: value ? `${name} · ${value}/10` : name });
  }, `Your rating for ${name}`);

  const watchlist = h('button', { type: 'button', class: 'pr-btn pr-btn--primary' });
  const watched = h('button', { type: 'button', class: 'pr-btn pr-btn--brand' });
  const favourite = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon' }, icon('heart'));
  const share = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon', 'aria-label': `Share ${name}` }, icon('share'));
  const trailer = tmdb.pickTrailer(d.videos);

  const paint = () => {
    const inList = library.has('watchlist', media, d.id);
    watchlist.replaceChildren(icon(inList ? 'check' : 'bookmark'), inList ? 'On your watchlist' : 'Add to watchlist');
    watchlist.setAttribute('aria-pressed', String(inList));
    const seen = library.has('watched', media, d.id);
    watched.replaceChildren(icon(seen ? 'check' : 'sparkle'), seen ? 'Watched' : 'Mark as watched');
    watched.setAttribute('aria-pressed', String(seen));
    const fav = library.has('favorites', media, d.id);
    favourite.setAttribute('aria-pressed', String(fav));
    favourite.setAttribute('aria-label', fav ? `Remove ${name} from favourites` : `Add ${name} to favourites`);
    favourite.classList.toggle('is-on', fav);
  };
  watchlist.addEventListener('click', () => {
    const on = library.toggle('watchlist', item);
    toast(on ? 'Added to your watchlist' : 'Removed from your watchlist', { detail: name });
  });
  watched.addEventListener('click', () => {
    const on = library.toggle('watched', item);
    toast(on ? 'Marked as watched' : 'Removed from watched', { detail: name });
  });
  favourite.addEventListener('click', () => {
    const on = library.toggle('favorites', item);
    toast(on ? 'Added to favourites' : 'Removed from favourites', { detail: name });
  });
  share.addEventListener('click', () => shareTitle(name));
  library.addEventListener('change', paint, { signal });
  paint();

  return h('div', { class: 'action-panel' },
    cat,
    h('div', { class: 'action-panel__rate' }, h('p', { class: 'label', text: 'Your rating' }), stars, hint),
    h('div', { class: 'actions' },
      watchlist, watched,
      trailer ? h('button', { type: 'button', class: 'pr-btn pr-btn--quiet', on: { click: () => openTrailer(trailer.key, name) } }, icon('play'), 'Trailer') : null,
      favourite, share));
}

/** @param {string} name */
async function shareTitle(name) {
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: `${name} on purrama`, url }); } catch { /* cancelled */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied', { detail: name });
  } catch {
    toast('Copy this link to share', { detail: url });
  }
}

/** US certification (MPAA / TV rating), when TMDB has one. @param {MovieDetails | TvDetails} d */
function certification(d) {
  if ('release_dates' in d && d.release_dates) {
    const us = d.release_dates.results.find((r) => r.iso_3166_1 === 'US');
    return us?.release_dates.find((r) => r.certification)?.certification ?? '';
  }
  if ('content_ratings' in d && d.content_ratings) {
    return d.content_ratings.results.find((r) => r.iso_3166_1 === 'US')?.rating ?? '';
  }
  return '';
}

/**
 * @param {Credits | undefined} credits
 * @param {MediaType} media
 */
function castSection(credits, media) {
  const cast = (credits?.cast ?? []).slice(0, 20);
  if (!cast.length) return null;
  return rail({
    title: media === 'tv' ? 'Series cast' : 'Cast',
    variant: 'people',
    load: async () => cast.map((c) => {
      const role = c.character ?? c.roles?.[0]?.character ?? '';
      const episodes = c.total_episode_count ? `${c.total_episode_count} ep.` : '';
      return personCard(c, [role, episodes].filter(Boolean).join(' · '));
    }),
  });
}

/** Key crew, grouped by job. @param {MovieDetails | TvDetails} d */
function crewSection(d) {
  const crew = 'credits' in d && d.credits ? d.credits.crew : 'aggregate_credits' in d && d.aggregate_credits ? d.aggregate_credits.crew : [];
  const KEY_JOBS = ['Director', 'Screenplay', 'Writer', 'Novel', 'Story', 'Producer', 'Executive Producer', 'Original Music Composer', 'Director of Photography', 'Editor'];
  /** @type {Map<string, { id: number, name: string }[]>} */
  const byJob = new Map();
  for (const person of crew) {
    const jobs = person.job ? [person.job] : (person.jobs ?? []).map((j) => j.job);
    for (const job of jobs) {
      if (!KEY_JOBS.includes(job)) continue;
      const list = byJob.get(job) ?? [];
      if (list.length < 4 && !list.some((p) => p.id === person.id)) list.push({ id: person.id, name: person.name });
      byJob.set(job, list);
    }
  }
  const rows = KEY_JOBS.filter((job) => byJob.has(job)).slice(0, 8);
  if (!rows.length) return null;
  return h('section', { class: 'section', 'aria-labelledby': 'crew-title' },
    sectionHead('Crew', { id: 'crew-title' }),
    h('dl', { class: 'pr-card crew' }, ...rows.flatMap((job) => [
      h('dt', { text: job }),
      h('dd', {}, ...(byJob.get(job) ?? []).flatMap((p, i) => [i ? ', ' : '', h('a', { href: href(`/person/${p.id}`), text: p.name })])),
    ])));
}

/** @param {MovieDetails | TvDetails} d @param {string} name */
function videosSection(d, name) {
  const videos = (d.videos?.results ?? []).filter((v) => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key)).slice(0, 8);
  if (!videos.length) return null;
  return h('section', { class: 'section', 'aria-labelledby': 'videos-title' },
    sectionHead('Trailers and clips', { id: 'videos-title' }),
    h('ul', { class: 'videos' }, ...videos.map((v) => h('li', {},
      h('button', { type: 'button', class: 'video-btn', on: { click: () => openTrailer(v.key, `${name}: ${v.name}`) } },
        h('span', { class: 'video-btn__icon' }, icon('play')),
        h('span', { class: 'video-btn__text' }, h('span', { class: 'video-btn__name', text: v.name }), h('span', { class: 'meta', text: v.type })))))));
}

/** @param {MovieDetails | TvDetails} d @param {string} name */
function imagesSection(d, name) {
  // The main backdrop leads the gallery now that it no longer sits above the hero (#10).
  const paths = [d.backdrop_path, ...(d.images?.backdrops ?? []).map((b) => b.file_path)]
    .filter((p, i, all) => typeof p === 'string' && all.indexOf(p) === i)
    .slice(0, 12);
  const backdrops = /** @type {string[]} */ (paths);
  if (!backdrops.length) return null;
  const large = backdrops.map((p, i) => ({ src: imageUrl(p, 'backdrop', 'lg') ?? '', alt: `Still ${i + 1} from ${name}` }));
  return rail({
    title: 'Images',
    variant: 'wide',
    load: async () => backdrops.map((path, i) => h('button', {
      type: 'button', class: 'still', 'aria-label': `Open image ${i + 1} of ${backdrops.length}`,
      on: { click: () => openGallery(large, i, name) },
    }, h('img', { src: imageUrl(path, 'backdrop', 'sm') ?? '', alt: '', loading: 'lazy', width: 300, height: 169 }))),
  });
}

/** Details card (the Figma "Details" aside). @param {MovieDetails | TvDetails} d */
function factsCard(d) {
  const isMovie = 'title' in d;
  /** @type {[string, Node | string][]} */
  const rows = [];
  /** @param {string} label @param {Node | string | null | undefined} value */
  const add = (label, value) => { if (value) rows.push([label, value]); };
  add('Status', d.status);
  if (isMovie) {
    add('Released', longDate(d.release_date));
    add('Runtime', runtime(d.runtime));
    add('Budget', d.budget ? MONEY.format(d.budget) : '');
    add('Revenue', d.revenue ? MONEY.format(d.revenue) : '');
  } else {
    add('First aired', longDate(d.first_air_date));
    add('Last aired', longDate(d.last_air_date));
    add('Episode length', runtime(d.episode_run_time?.[0]));
    if (d.networks?.length) {
      add('Networks', h('span', { class: 'networks' }, ...d.networks.slice(0, 4).map((n) => {
        const logo = imageUrl(n.logo_path, 'logo', 'sm');
        return logo
          ? h('span', { class: 'network' }, h('img', { src: logo, alt: n.name, loading: 'lazy', height: 20 }))
          : h('span', { class: 'network', text: n.name });
      })));
    }
  }
  add('Original language', languageName(d.original_language));
  add('Countries', (d.production_countries ?? []).map((c) => c.name).join(', '));
  add('Production', (d.production_companies ?? []).slice(0, 4).map((c) => c.name).join(', '));
  add('Genres', d.genres.map((g) => g.name).join(', '));
  if (!rows.length) return null;
  return h('aside', { class: 'pr-card facts', 'aria-labelledby': 'facts-title' },
    h('h2', { class: 'pr-card__title', id: 'facts-title', text: 'Details' }),
    h('dl', {}, ...rows.flatMap(([label, value]) => [h('dt', { text: label }), h('dd', {}, value)])));
}

/** @param {string | undefined} code */
function languageName(code) {
  if (!code) return '';
  try { return LANGUAGES.of(code) ?? code; } catch { return code; }
}

/** @param {number} id */
function collectionSection(id) {
  const wrap = h('div', {});
  tmdb.collection(id).then((c) => {
    const parts = [...c.parts].sort((a, b) => (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999'));
    if (parts.length < 2) return;
    wrap.appendChild(rail({ title: `Part of ${c.name}`, load: async () => parts.map((t) => titleCard(t, 'movie')) }));
  }).catch(() => { /* the rest of the page is still useful without the collection */ });
  return wrap;
}

// ---- TV seasons and episodes ---------------------------------------------

/**
 * @param {TvDetails} d
 * @param {Route} route
 */
function seasonsSection(d, route) {
  const seasons = (d.seasons ?? []).filter((s) => s.episode_count);
  if (!seasons.length) return null;
  // Specials (season 0) go last; default to the requested season or the first real one.
  const ordered = [...seasons.filter((s) => s.season_number > 0), ...seasons.filter((s) => s.season_number === 0)];
  const seasonParam = route.query.get('season');
  const requested = seasonParam !== null && /^\d{1,4}$/.test(seasonParam) ? Number(seasonParam) : -1;
  let current = ordered.find((s) => s.season_number === requested)?.season_number ?? ordered[0]?.season_number ?? 1;

  const select = h('select', { id: 'season-select', class: 'select' },
    ...ordered.map((s) => h('option', { value: String(s.season_number), text: `${s.name}${s.episode_count ? ` (${s.episode_count} episodes)` : ''}` })));
  select.value = String(current);
  const info = h('div', { class: 'season-info' });
  const list = h('ol', { class: 'episodes' });
  const section = h('section', { class: 'section', 'aria-labelledby': 'seasons-title' },
    h('div', { class: 'section-head' },
      h('h2', { class: 'section-title', id: 'seasons-title', text: 'Seasons and episodes' }),
      h('div', { class: 'field field--inline' }, h('label', { for: 'season-select', text: 'Season' }), select)),
    info, list);

  let seq = 0;
  const load = async () => {
    const mine = ++seq;
    list.replaceChildren(h('li', { class: 'muted', text: 'Loading episodes…' }));
    section.querySelector('.inline-error')?.remove();
    try {
      const season = await tmdb.season(d.id, current);
      if (mine !== seq) return;
      mount(info,
        season.air_date ? h('p', { class: 'meta', text: `${season.name} · ${yearOf(season.air_date)} · ${season.episodes.length} episodes` }) : null,
        season.overview ? h('p', { class: 'season-overview', text: season.overview }) : null);
      list.replaceChildren(...season.episodes.map((ep) => episodeItem(d.id, ep)));
      if (!season.episodes.length) list.replaceChildren(h('li', { class: 'muted', text: 'TMDB has no episodes listed for this season yet.' }));
    } catch (error) {
      if (mine !== seq) return;
      list.replaceChildren();
      section.appendChild(inlineError(error, load));
    }
  };
  select.addEventListener('change', () => {
    current = Number(select.value);
    replaceQuery({ season: current });
    load();
  });
  load();
  return section;
}

/**
 * One episode as a disclosure; opening it loads directors, writers and guest stars.
 * @param {number} tvId
 * @param {import('../api/types.js').Episode} ep
 */
function episodeItem(tvId, ep) {
  const extra = h('div', { class: 'episode__extra' });
  let loaded = false;
  const still = imageUrl(ep.still_path, 'still', 'md');
  const details = h('details', { class: 'episode' },
    h('summary', {},
      h('span', { class: 'episode__num', text: `E${ep.episode_number}` }),
      h('span', { class: 'episode__head' },
        h('span', { class: 'episode__name', text: ep.name || `Episode ${ep.episode_number}` }),
        h('span', { class: 'meta', text: [longDate(ep.air_date), runtime(ep.runtime)].filter(Boolean).join(' · ') || 'Air date not announced' })),
      ep.vote_average ? tmdbScore(ep.vote_average) : null,
      h('span', { class: 'episode__chevron' }, icon('down', { size: 18 }))),
    h('div', { class: 'episode__body' },
      still ? h('img', { class: 'episode__still', src: still, alt: '', loading: 'lazy', width: 300, height: 169 }) : null,
      h('div', {},
        h('p', { class: ep.overview ? 'overview' : 'overview muted', text: ep.overview || 'TMDB has no description for this episode yet.' }),
        extra)));
  details.addEventListener('toggle', async () => {
    if (!details.open || loaded) return;
    loaded = true;
    try {
      const full = await tmdb.episode(tvId, ep.season_number, ep.episode_number);
      const directors = (full.crew ?? []).filter((c) => c.job === 'Director');
      const writers = (full.crew ?? []).filter((c) => c.job === 'Writer' || c.job === 'Teleplay' || c.job === 'Screenplay');
      const guests = (full.guest_stars ?? []).slice(0, 6);
      /** @param {string} label @param {{ id: number, name: string }[]} people */
      const line = (label, people) => people.length
        ? h('p', { class: 'meta' }, `${label}: `, ...people.flatMap((p, i) => [i ? ', ' : '', h('a', { href: href(`/person/${p.id}`), text: p.name })]))
        : null;
      mount(extra, line('Directed by', directors), line('Written by', writers), line('Guest stars', guests));
    } catch {
      loaded = false;
    }
  });
  return h('li', {}, details);
}
