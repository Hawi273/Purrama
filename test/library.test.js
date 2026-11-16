import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage for Node.
const store = new Map();
globalThis.localStorage = /** @type {Storage} */ ({
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
});

const { library, parseStore, STORE_KEY, LEGACY_KEY } = await import('../src/state/library.js');

const dune = { id: 438631, media: /** @type {const} */ ('movie'), title: 'Dune', poster_path: '/d.jpg', date: '2021-09-15' };
const severance = { id: 95396, media: /** @type {const} */ ('tv'), title: 'Severance', poster_path: null, date: '2022-02-17' };

beforeEach(() => { store.clear(); library.load(); });

test('toggle adds and removes titles from a list and persists them', () => {
  assert.equal(library.toggle('watchlist', dune), true);
  assert.equal(library.has('watchlist', 'movie', dune.id), true);
  assert.ok(JSON.parse(store.get(STORE_KEY)).watchlist['movie:438631']);
  assert.equal(library.toggle('watchlist', dune), false);
  assert.equal(library.has('watchlist', 'movie', dune.id), false);
});

test('films and series with the same id are kept apart', () => {
  library.toggle('favorites', dune);
  library.toggle('favorites', { ...severance, id: dune.id });
  assert.equal(library.counts().favorites, 2);
});

test('rating marks a title watched; 0 clears the rating only', () => {
  library.rate(severance, 4);
  assert.equal(library.rating('tv', severance.id), 4);
  assert.equal(library.has('watched', 'tv', severance.id), true);
  library.rate(severance, 0);
  assert.equal(library.rating('tv', severance.id), 0);
  assert.equal(library.has('watched', 'tv', severance.id), true);
});

test('v1 ratings are migrated as movie ratings', () => {
  store.set(LEGACY_KEY, JSON.stringify({ 603: { id: 603, title: 'The Matrix', release_date: '1999-03-30', poster_path: '/m.jpg', rating: 5, ratedAt: 10 } }));
  library.load();
  assert.equal(library.rating('movie', 603), 5);
  assert.equal(library.items('ratings')[0]?.title, 'The Matrix');
});

test('parseStore drops malformed entries instead of failing', () => {
  const data = parseStore({
    watchlist: { a: { id: 'x', media: 'movie' }, b: { id: 1, media: 'book' }, c: { id: 2, media: 'tv', title: 'Ok' } },
    ratings: { d: { id: 3, media: 'movie', rating: 9 }, e: { id: 4, media: 'movie', rating: 3 } },
  }, 'garbage');
  assert.deepEqual(Object.keys(data.watchlist), ['tv:2']);
  assert.deepEqual(Object.keys(data.ratings), ['movie:4']);
});

test('a broken store loads as empty', () => {
  store.set(STORE_KEY, '{not json');
  library.load();
  assert.deepEqual(library.counts(), { watchlist: 0, favorites: 0, watched: 0, ratings: 0 });
});
