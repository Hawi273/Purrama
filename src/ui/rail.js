// Horizontal carousel ("rail"): native scrolling with snap points, so touch,
// trackpad and keyboard all work; arrow buttons page through on larger screens.

import { h } from './dom.js';
import { icon } from './icons.js';
import { sectionHead, skeletonTiles } from './components.js';
import { inlineError } from './feedback.js';

/**
 * @param {{
 *   title: string,
 *   load: () => Promise<Node[]>,
 *   more?: string,
 *   moreLabel?: string,
 *   variant?: 'posters' | 'people' | 'wide',
 *   hideWhenEmpty?: boolean,
 * }} options
 * @returns {HTMLElement}
 */
export function rail(options) {
  const { title, load, more, moreLabel, variant = 'posters', hideWhenEmpty = true } = options;
  const id = `rail-${Math.random().toString(36).slice(2, 9)}`;
  const list = h('ul', { class: `rail rail--${variant}`, tabindex: '0', 'aria-labelledby': id });
  const prev = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon rail__nav', 'aria-label': `Scroll ${title} back` }, icon('left'));
  const next = h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon rail__nav', 'aria-label': `Scroll ${title} forward` }, icon('right'));
  const body = h('div', { class: 'rail-wrap' }, list);
  const section = h('section', { class: 'section', 'aria-labelledby': id },
    h('div', { class: 'section-head-row' }, sectionHead(title, { more, moreLabel, id }), h('div', { class: 'rail__controls' }, prev, next)),
    body);

  /** @param {number} dir */
  const page = (dir) => list.scrollBy({ left: dir * list.clientWidth * 0.85, behavior: 'smooth' });
  prev.addEventListener('click', () => page(-1));
  next.addEventListener('click', () => page(1));
  const updateButtons = () => {
    const max = list.scrollWidth - list.clientWidth - 2;
    prev.disabled = list.scrollLeft <= 2;
    next.disabled = list.scrollLeft >= max;
  };
  list.addEventListener('scroll', updateButtons, { passive: true });

  const run = async () => {
    list.replaceChildren(...(variant === 'people' ? [] : skeletonTiles(6)));
    body.querySelector('.inline-error')?.remove();
    try {
      const items = await load();
      if (!items.length && hideWhenEmpty) { section.remove(); return; }
      list.replaceChildren(...items.map((item) => h('li', { class: 'rail__item' }, item)));
      requestAnimationFrame(updateButtons);
    } catch (error) {
      list.replaceChildren();
      body.appendChild(inlineError(error, run));
    }
  };
  run();
  return section;
}
