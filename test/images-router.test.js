import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageUrl, posterSrcset } from '../src/api/images.js';
import { parseHash, href } from '../src/router.js';

test('imageUrl builds TMDB URLs for valid paths only', () => {
  assert.equal(imageUrl('/abc123.jpg', 'poster', 'md'), 'https://image.tmdb.org/t/p/w342/abc123.jpg');
  assert.equal(imageUrl(null, 'poster', 'md'), null);
  assert.equal(imageUrl('', 'poster', 'md'), null);
  assert.equal(imageUrl('//evil.example/x.jpg', 'poster', 'md'), null);
  assert.equal(imageUrl('/a/../b.jpg', 'poster', 'md'), null);
  assert.equal(imageUrl('/x.jpg" onerror="1', 'poster', 'md'), null);
});

test('posterSrcset lists three widths', () => {
  assert.match(posterSrcset('/p.jpg') ?? '', /w154\/p\.jpg 154w, .*w342\/p\.jpg 342w, .*w500\/p\.jpg 500w/);
  assert.equal(posterSrcset(undefined), null);
});

test('parseHash recognises every route', () => {
  assert.equal(parseHash('').name, 'home');
  assert.equal(parseHash('#/').name, 'home');
  assert.equal(parseHash('#/movies?list=top_rated').query.get('list'), 'top_rated');
  assert.equal(parseHash('#/tv').name, 'tv-shows');
  const tv = parseHash('#/tv/1399?season=2');
  assert.equal(tv.name, 'tv');
  assert.equal(tv.params.id, '1399');
  assert.equal(tv.query.get('season'), '2');
  assert.deepEqual(parseHash('#/person/287').params, { id: '287' });
  assert.equal(parseHash('#/search?q=dune%20part%20two').query.get('q'), 'dune part two');
  assert.equal(parseHash('#/movie/abc').name, 'not-found');
  assert.equal(parseHash('#/nope').name, 'not-found');
});

test('href encodes the query and skips empty values', () => {
  assert.equal(href('/search', { q: 'a&b', type: '' }), '#/search?q=a%26b');
  assert.equal(href('/movie/603'), '#/movie/603');
});
