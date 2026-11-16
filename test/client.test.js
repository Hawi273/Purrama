import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl, request, errorForStatus, ApiError, clearCache } from '../src/api/client.js';

test('buildUrl sorts keys, drops empty values and keeps the path', () => {
  const url = buildUrl('/discover/movie', { page: 2, with_genres: '28,12', year: '', region: null, sort_by: 'popularity.desc' }, 'https://api.example.dev/');
  assert.equal(url, 'https://api.example.dev/discover/movie?page=2&sort_by=popularity.desc&with_genres=28%2C12');
});

test('buildUrl rejects paths without a leading slash', () => {
  assert.throws(() => buildUrl('movie/1', {}, 'https://x.dev'), TypeError);
});

test('errorForStatus maps HTTP codes to kinds the UI can explain', () => {
  assert.equal(errorForStatus(404).kind, 'not-found');
  assert.equal(errorForStatus(429).kind, 'rate-limit');
  assert.equal(errorForStatus(500).kind, 'server');
});

test('request shares one fetch between identical in-flight calls and caches the result', async () => {
  clearCache();
  let calls = 0;
  /** @type {typeof fetch} */
  const fetchImpl = async () => { calls++; return new Response(JSON.stringify({ ok: 1 }), { status: 200 }); };
  const [a, b] = await Promise.all([request('/movie/1', {}, { fetchImpl }), request('/movie/1', {}, { fetchImpl })]);
  assert.deepEqual(a, { ok: 1 });
  assert.deepEqual(b, { ok: 1 });
  await request('/movie/1', {}, { fetchImpl });
  assert.equal(calls, 1);
});

test('request turns failures into ApiError', async () => {
  clearCache();
  await assert.rejects(request('/movie/2', {}, { fetchImpl: async () => new Response('{}', { status: 404 }) }),
    (e) => e instanceof ApiError && e.kind === 'not-found');
  await assert.rejects(request('/movie/3', {}, { fetchImpl: async () => { throw new TypeError('offline'); } }),
    (e) => e instanceof ApiError && e.kind === 'network');
  await assert.rejects(request('/movie/4', {}, { fetchImpl: async () => new Response('not json', { status: 200 }) }),
    (e) => e instanceof ApiError && e.kind === 'bad-response');
});

test('failed requests are not cached', async () => {
  clearCache();
  let fail = true;
  /** @type {typeof fetch} */
  const fetchImpl = async () => (fail ? new Response('{}', { status: 500 }) : new Response('{"v":2}', { status: 200 }));
  await assert.rejects(request('/movie/5', {}, { fetchImpl }));
  fail = false;
  assert.deepEqual(await request('/movie/5', {}, { fetchImpl }), { v: 2 });
});
