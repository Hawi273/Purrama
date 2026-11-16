// One function per TMDB capability Purrama uses. All go through request().

import { request } from './client.js';

/**
 * @typedef {import('./types.js').TitleSummary} TitleSummary
 * @typedef {import('./types.js').PersonSummary} PersonSummary
 * @typedef {import('./types.js').MultiResult} MultiResult
 * @typedef {import('./types.js').MovieDetails} MovieDetails
 * @typedef {import('./types.js').TvDetails} TvDetails
 * @typedef {import('./types.js').SeasonDetails} SeasonDetails
 * @typedef {import('./types.js').Episode} Episode
 * @typedef {import('./types.js').PersonDetails} PersonDetails
 * @typedef {import('./types.js').Collection} Collection
 * @typedef {import('./types.js').Genre} Genre
 * @typedef {import('./types.js').MediaType} MediaType
 */
/** @template T @typedef {import('./types.js').Paged<T>} Paged */

const LANG = 'en-US';
const HOUR = 60 * 60_000;

/** @typedef {'popular' | 'top_rated' | 'now_playing' | 'upcoming'} MovieList */
/** @typedef {'popular' | 'top_rated' | 'airing_today' | 'on_the_air'} TvList */

/**
 * @param {'all' | MediaType | 'person'} type
 * @param {'day' | 'week'} window
 * @param {number} [page]
 * @returns {Promise<Paged<MultiResult>>}
 */
export function trending(type, window, page = 1) {
  return request(`/trending/${type}/${window}`, { language: LANG, page });
}

/**
 * Keep films and series from a mixed (multi/trending all) result list.
 * @param {MultiResult[]} results
 * @returns {(TitleSummary & { media_type: MediaType })[]}
 */
export function titlesOnly(results) {
  return /** @type {(TitleSummary & { media_type: MediaType })[]} */ (
    results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv'));
}

/**
 * Trending films or series only (no people), typed as title summaries.
 * @param {MediaType} type
 * @param {'day' | 'week'} window
 * @param {number} [page]
 * @returns {Promise<Paged<TitleSummary>>}
 */
export function trendingTitles(type, window, page = 1) {
  return request(`/trending/${type}/${window}`, { language: LANG, page });
}

/**
 * @param {MovieList} list
 * @param {number} [page]
 * @returns {Promise<Paged<TitleSummary>>}
 */
export function movieList(list, page = 1) {
  return request(`/movie/${list}`, { language: LANG, page });
}

/**
 * @param {TvList} list
 * @param {number} [page]
 * @returns {Promise<Paged<TitleSummary>>}
 */
export function tvList(list, page = 1) {
  return request(`/tv/${list}`, { language: LANG, page });
}

/**
 * @param {number} id
 * @returns {Promise<MovieDetails>}
 */
export function movie(id) {
  return request(`/movie/${id}`, {
    language: LANG,
    append_to_response: 'credits,videos,images,similar,recommendations,release_dates',
    include_image_language: 'en,null',
  }, { ttl: HOUR });
}

/**
 * @param {number} id
 * @returns {Promise<TvDetails>}
 */
export function tv(id) {
  return request(`/tv/${id}`, {
    language: LANG,
    append_to_response: 'aggregate_credits,videos,images,similar,recommendations,content_ratings',
    include_image_language: 'en,null',
  }, { ttl: HOUR });
}

/**
 * @param {number} tvId
 * @param {number} seasonNumber
 * @returns {Promise<SeasonDetails>}
 */
export function season(tvId, seasonNumber) {
  return request(`/tv/${tvId}/season/${seasonNumber}`, { language: LANG }, { ttl: HOUR });
}

/**
 * @param {number} tvId
 * @param {number} seasonNumber
 * @param {number} episodeNumber
 * @returns {Promise<Episode>}
 */
export function episode(tvId, seasonNumber, episodeNumber) {
  return request(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, { language: LANG }, { ttl: HOUR });
}

/**
 * @param {number} id
 * @returns {Promise<PersonDetails>}
 */
export function person(id) {
  return request(`/person/${id}`, { language: LANG, append_to_response: 'combined_credits' }, { ttl: HOUR });
}

/**
 * @param {number} id
 * @returns {Promise<Collection>}
 */
export function collection(id) {
  return request(`/collection/${id}`, { language: LANG }, { ttl: HOUR });
}

/**
 * @param {string} query
 * @param {number} [page]
 * @returns {Promise<Paged<MultiResult>>}
 */
export function searchMulti(query, page = 1) {
  return request('/search/multi', { query, page, include_adult: 'false', language: LANG }, { ttl: 10 * 60_000 });
}

/**
 * @param {MediaType | 'person'} type
 * @param {string} query
 * @param {number} [page]
 * @returns {Promise<Paged<TitleSummary & PersonSummary>>}
 */
export function search(type, query, page = 1) {
  return request(`/search/${type}`, { query, page, include_adult: 'false', language: LANG }, { ttl: 10 * 60_000 });
}

/**
 * @typedef {object} DiscoverFilters
 * @property {number[]} [genres]
 * @property {number} [year]
 * @property {number} [minRating]   0–10
 * @property {string} [sort]        e.g. "popularity.desc"
 * @property {number} [network]     TV only
 * @property {number} [page]
 */

/**
 * @param {MediaType} type
 * @param {DiscoverFilters} filters
 * @returns {Promise<Paged<TitleSummary>>}
 */
export function discover(type, filters) {
  const { genres = [], year, minRating, sort = 'popularity.desc', network, page = 1 } = filters;
  /** @type {import('./client.js').Params} */
  const params = { language: LANG, page, sort_by: sort, include_adult: 'false' };
  if (genres.length) params.with_genres = genres.join(',');
  if (year) params[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
  if (minRating) params['vote_average.gte'] = minRating;
  // Without a vote floor, rating sorts are topped by titles with one 10/10 vote.
  if (minRating || sort.startsWith('vote_average')) params['vote_count.gte'] = 150;
  if (type === 'tv' && network) params.with_networks = network;
  return request(`/discover/${type}`, params);
}

/**
 * Discover within a date range (used by the Discover page's decades).
 * @param {MediaType} type
 * @param {{ genres: number[], sort: string, from: string, to: string, dateKey: string }} options
 * @returns {Promise<Paged<TitleSummary>>}
 */
export function discoverRange(type, options) {
  /** @type {import('./client.js').Params} */
  const params = { language: LANG, page: 1, sort_by: options.sort, include_adult: 'false' };
  if (options.genres.length) params.with_genres = options.genres.join(',');
  if (options.from) params[`${options.dateKey}.gte`] = options.from;
  if (options.to) params[`${options.dateKey}.lte`] = options.to;
  params['vote_count.gte'] = options.sort.startsWith('vote_average') ? 200 : 20;
  return request(`/discover/${type}`, params);
}

/**
 * @param {MediaType} type
 * @returns {Promise<{ genres: Genre[] }>}
 */
export function genres(type) {
  return request(`/genre/${type}/list`, { language: LANG }, { ttl: 24 * HOUR });
}

/**
 * Genre id → name, for lists that only carry genre_ids.
 * @param {MediaType} type
 * @returns {Promise<Map<number, string>>}
 */
export async function genreMap(type) {
  const { genres: list } = await genres(type);
  return new Map(list.map((g) => [g.id, g.name]));
}

/**
 * @param {number} id
 * @returns {Promise<{ id: number, name: string, logo_path: string | null }>}
 */
export function network(id) {
  return request(`/network/${id}`, {}, { ttl: 24 * HOUR });
}

/**
 * The best YouTube trailer in a videos list, or null.
 * @param {{ results: import('./types.js').Video[] } | undefined} videos
 */
export function pickTrailer(videos) {
  const youtube = (videos?.results ?? []).filter((v) => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key));
  const score = (/** @type {import('./types.js').Video} */ v) =>
    (v.type === 'Trailer' ? 4 : v.type === 'Teaser' ? 2 : 0) + (v.official ? 1 : 0);
  return youtube.sort((a, b) => score(b) - score(a))[0] ?? null;
}
