// Integration test of the Worker against a fake TMDB: origin lock, route
// allowlist, query-parameter validation and that the token is only ever sent
// to TMDB as a Bearer header.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';

const env = { TMDB_TOKEN: 'test-token', ALLOWED_ORIGINS: 'https://hawi273.github.io,http://localhost:8000' };
const ctx = { waitUntil() {} };
/** @type {{ url: string, auth: string | null }[]} */
let upstream = [];

beforeEach(() => {
  upstream = [];
  globalThis.fetch = async (url, init) => {
    upstream.push({ url: String(url), auth: new Headers(init?.headers).get('Authorization') });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
});

/** @param {string} path @param {RequestInit & { origin?: string | null }} [init] */
function call(path, init = {}) {
  const headers = new Headers(init.headers);
  const origin = init.origin === undefined ? 'https://hawi273.github.io' : init.origin;
  if (origin) headers.set('Origin', origin);
  return worker.fetch(new Request(`https://purrama-api.example.dev${path}`, { method: init.method ?? 'GET', headers }), env, ctx);
}

test('allowed origins get data with CORS; others are refused', async () => {
  const ok = await call('/tv/1399/season/1');
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'https://hawi273.github.io');
  assert.equal((await call('/tv/1399', { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/tv/1399', { origin: null })).status, 403);
});

test('every new read-only route is allowed', async () => {
  for (const path of ['/trending/all/day', '/tv/airing_today', '/tv/1/season/2/episode/3', '/person/287', '/person/287/combined_credits',
    '/search/multi', '/discover/tv', '/genre/tv/list', '/collection/10', '/network/213', '/movie/603/images']) {
    assert.equal((await call(path)).status, 200, path);
  }
});

test('unknown paths and methods are refused without calling TMDB', async () => {
  for (const path of ['/account/1/lists', '/movie/603/account_states', '/authentication/token/new', '/movie/603/../../account', '/list/1']) {
    assert.equal((await call(path)).status, 404, path);
  }
  assert.equal((await call('/movie/603', { method: 'POST' })).status, 405);
  assert.equal(upstream.length, 0);
});

test('query parameters are validated; the token only goes in the Authorization header', async () => {
  await call('/discover/movie?with_genres=28,12&sort_by=vote_average.desc&vote_count.gte=150&api_key=x&session_id=y&page=999');
  await call('/movie/603?append_to_response=credits,videos,account_states');
  await call('/search/multi?query=dune&include_adult=true');
  const [discover, details, search] = upstream;
  assert.equal(discover?.url, 'https://api.themoviedb.org/3/discover/movie?sort_by=vote_average.desc&vote_count.gte=150&with_genres=28%2C12');
  assert.equal(details?.url, 'https://api.themoviedb.org/3/movie/603'); // invalid append dropped entirely
  assert.equal(search?.url, 'https://api.themoviedb.org/3/search/multi?query=dune');
  for (const u of upstream) {
    assert.equal(u.auth, 'Bearer test-token');
    assert.ok(!u.url.includes('test-token'));
  }
});

test('TMDB being unreachable is a clean 502', async () => {
  globalThis.fetch = async () => { throw new TypeError('down'); };
  assert.equal((await call('/movie/603')).status, 502);
});
