// Image gallery dialog (#8): previous/next buttons beside the image (never on
// it), keyboard arrows, swipe on touch, a counter, neighbours preloaded.
// The first and last images do not wrap around.

import { h } from './dom.js';
import { icon } from './icons.js';
import { openDialog } from './feedback.js';

/**
 * Next index after moving by delta, clamped to the ends (no wrap-around).
 * @param {number} index
 * @param {number} delta
 * @param {number} length
 */
export function stepIndex(index, delta, length) {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.max(0, index + delta));
}

/**
 * @param {{ src: string, alt: string }[]} images  large image URLs, in order
 * @param {number} start
 * @param {string} title
 */
export function openGallery(images, start, title) {
  if (!images.length) return;
  let index = stepIndex(start, 0, images.length);
  const img = h('img', { class: 'gallery__image', alt: '', decoding: 'async' });
  const counter = h('p', { class: 'gallery__counter', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon gallery__nav', 'aria-label': 'Previous image' }, icon('left'));
  const next = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon gallery__nav', 'aria-label': 'Next image' }, icon('right'));

  const show = () => {
    const current = images[index];
    if (!current) return;
    img.src = current.src;
    img.alt = current.alt;
    counter.textContent = `Image ${index + 1} of ${images.length}`;
    prev.disabled = index === 0;
    next.disabled = index === images.length - 1;
    for (const n of [index - 1, index + 1]) {
      const neighbour = images[n];
      if (neighbour) new Image().src = neighbour.src; // preload so moving is instant
    }
  };
  /** @param {number} delta */
  const move = (delta) => {
    const target = stepIndex(index, delta, images.length);
    if (target === index) return;
    index = target;
    show();
  };

  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  // Swipe: a mostly horizontal drag of 40px+ moves one image.
  let startX = 0;
  let startY = 0;
  img.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
  img.addEventListener('pointerup', (e) => {
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - startY)) move(dx < 0 ? 1 : -1);
  });
  img.draggable = false;

  const body = h('div', { class: 'gallery' },
    h('div', { class: 'gallery__stage' }, prev, h('div', { class: 'gallery__frame' }, img), next),
    counter);
  const dialog = openDialog(title, body, { wide: true });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
  });
  show();
  (index < images.length - 1 ? next : prev).focus();
}
