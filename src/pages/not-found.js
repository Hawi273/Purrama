import { h, mount } from '../ui/dom.js';
import { stateCard } from '../ui/feedback.js';
import { setMeta } from './common.js';

/** @param {HTMLElement} main */
export function render(main) {
  setMeta('Page not found');
  mount(main, h('div', { class: 'container page' }, h('h1', { class: 'visually-hidden', text: 'Page not found' }), stateCard({
    mood: 'peek', eyebrow: '404', title: 'This page wandered off',
    body: "The link might be old, or the page moved. Let's get you back to the good stuff.",
    action: h('a', { class: 'pr-btn pr-btn--primary', href: '#/', text: 'Back to home' }),
  })));
}
