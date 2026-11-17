// Gallery navigation (#8): moving past the first or last image stops there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepIndex } from '../src/ui/gallery.js';

test('next and previous move one image', () => {
  assert.equal(stepIndex(3, 1, 10), 4);
  assert.equal(stepIndex(3, -1, 10), 2);
});

test('the first and last images do not wrap around', () => {
  assert.equal(stepIndex(0, -1, 10), 0);
  assert.equal(stepIndex(9, 1, 10), 9);
  assert.equal(stepIndex(0, -1, 1), 0);
  assert.equal(stepIndex(0, 1, 1), 0);
});

test('a start index outside the list is clamped', () => {
  assert.equal(stepIndex(15, 0, 10), 9);
  assert.equal(stepIndex(-2, 0, 10), 0);
  assert.equal(stepIndex(0, 1, 0), 0);
});
