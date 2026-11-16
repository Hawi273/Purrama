// Request building in src/api/tmdb.js: which Worker URL each capability asks
// for, and the discover rules (year key per type, vote floor for rating sorts).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { clearCache } from '../src/api/client.js';
import * as tmdb from '../src/api/tmdb.js';

/** @type {URL[]} */
let calls = [];
beforeEach(() => {
  clearCache();
  calls = [];
  globalThis.fetch = async (url) => {
    calls.push(new URL(String(url)));
    return new Response(JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0, genres: [] }), { status: 200 });
  };
});

test('discover uses the right year key per type and adds a vote floor for rating sorts', async () => {
  await tmdb.discover('movie', { genres: [27, 53], year: 1999, minRating: 7, sort: 'vote_average.desc' });
  await tmdb.discover('tv', { year: 2008, network: 49 });
  const [movie, tv] = calls;
  assert.equal(movie?.pathname, '/discover/movie');
  assert.equal(movie?.searchParams.get('with_genres'), '27,53');
  assert.equal(movie?.searchParams.get('primary_release_year'), '1999');
  assert.equal(movie?.searchParams.get('vote_average.gte'), '7');
  assert.equal(movie?.searchParams.get('vote_count.gte'), '150');
  assert.equal(tv?.pathname, '/discover/tv');
  assert.equal(tv?.searchParams.get('first_air_date_year'), '2008');
  assert.equal(tv?.searchParams.get('with_networks'), '49');
  assert.equal(tv?.searchParams.get('vote_count.gte'), null); // popularity sort needs no floor
});

test('details pages ask for everything in one request', async () => {
  await tmdb.movie(27205);
  await tmdb.tv(1399);
  assert.equal(calls[0]?.searchParams.get('append_to_response'), 'credits,videos,images,similar,recommendations,release_dates');
  assert.equal(calls[1]?.searchParams.get('append_to_response'), 'aggregate_credits,videos,images,similar,recommendations,content_ratings');
});

test('discoverRange bounds dates with the given key', async () => {
  await tmdb.discoverRange('movie', { genres: [], sort: 'popularity.desc', from: '1990-01-01', to: '1999-12-31', dateKey: 'primary_release_date' });
  assert.equal(calls[0]?.searchParams.get('primary_release_date.gte'), '1990-01-01');
  assert.equal(calls[0]?.searchParams.get('primary_release_date.lte'), '1999-12-31');
});

test('pickTrailer prefers official YouTube trailers and ignores bad keys', () => {
  const pick = tmdb.pickTrailer({ results: [
    { key: 'teaser12345', name: 'Teaser', site: 'YouTube', type: 'Teaser', official: true },
    { key: 'vimeo123456', name: 'Trailer', site: 'Vimeo', type: 'Trailer', official: true },
    { key: 'bad key"><', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true },
    { key: 'trailer1234', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: false },
    { key: 'official123', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true },
  ] });
  assert.equal(pick?.key, 'official123');
  assert.equal(tmdb.pickTrailer(undefined), null);
});

test('titlesOnly drops people from mixed results', () => {
  const mixed = /** @type {import('../src/api/types.js').MultiResult[]} */ ([
    { id: 1, media_type: 'movie', title: 'A' }, { id: 2, media_type: 'person', name: 'P' }, { id: 3, media_type: 'tv', name: 'B' },
  ]);
  assert.deepEqual(tmdb.titlesOnly(mixed).map((r) => r.id), [1, 3]);
});
