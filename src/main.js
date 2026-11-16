// Boot: shell (search, nav icons), saved lists, router.

import { startRouter, href } from './router.js';
import { initLibrary, library } from './state/library.js';
import { newPage } from './ui/lifecycle.js';
import { icon } from './ui/icons.js';
import { mount, h } from './ui/dom.js';
import { searchBox } from './ui/header-search.js';
import { loadingState, stateCard, toast } from './ui/feedback.js';

/** @typedef {import('./router.js').Route} Route */
/** @typedef {{ render: (main: HTMLElement, route: Route) => Promise<void> | void }} PageModule */

/** @type {Record<string, () => Promise<PageModule>>} */
const PAGES = {
  home: () => import('./pages/home.js'),
  movies: () => import('./pages/browse.js'),
  'tv-shows': () => import('./pages/browse.js'),
  discover: () => import('./pages/discover.js'),
  search: () => import('./pages/search.js'),
  movie: () => import('./pages/title.js'),
  tv: () => import('./pages/title.js'),
  person: () => import('./pages/person.js'),
  library: () => import('./pages/library.js'),
  'not-found': () => import('./pages/not-found.js'),
};

const main = /** @type {HTMLElement} */ (document.getElementById('main'));
let firstRoute = true;

/** @param {Route} route */
function navKey(route) {
  if (route.name === 'library') {
    const tab = route.query.get('tab');
    return tab === 'watchlist' || tab === 'favorites' ? tab : 'library';
  }
  return route.name;
}

/** @param {Route} route */
function highlightNav(route) {
  const key = navKey(route);
  for (const link of document.querySelectorAll('[data-nav]')) {
    const nav = /** @type {HTMLElement} */ (link).dataset.nav;
    const current = nav === key || (nav === 'library' && (key === 'watchlist' || key === 'favorites'));
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

/** @param {Route} route */
async function onRoute(route) {
  newPage();
  // A trailer or image left open must not sit over the next page.
  for (const dialog of document.querySelectorAll('dialog[open]')) /** @type {HTMLDialogElement} */ (dialog).close();
  highlightNav(route);
  document.title = 'purrama';
  mount(main, loadingState('Loading…'));
  if (!firstRoute) {
    window.scrollTo({ top: 0 });
    main.focus({ preventScroll: true });
  }
  firstRoute = false;
  try {
    const load = PAGES[route.name] ?? PAGES['not-found'];
    const page = await /** @type {() => Promise<PageModule>} */ (load)();
    await page.render(main, route);
  } catch (error) {
    console.error(error);
    mount(main, h('div', { class: 'container page' }, stateCard({
      mood: 'sad', eyebrow: 'Error', title: 'Something went wrong',
      body: 'This page hit a snag. Try again, or head back home.',
      action: h('a', { class: 'pr-btn pr-btn--primary', href: '#/', text: 'Back to home' }),
    })));
  }
}

function initShell() {
  for (const slot of document.querySelectorAll('[data-icon]')) {
    slot.appendChild(icon(/** @type {HTMLElement} */ (slot).dataset.icon ?? '', { size: 22 }));
  }
  document.querySelector('.appbar__mobile-discover')?.appendChild(icon('compass'));
  const header = document.getElementById('header-search');
  if (header) {
    const box = searchBox({ id: 'header-q', onSubmit: (q) => { location.hash = href('/search', { q }); } });
    header.appendChild(box.element);
  }
}

initLibrary();
library.addEventListener('savefailed', () => {
  // Shown after the action's own toast, replacing it.
  setTimeout(() => toast("Couldn't save in this browser", { detail: 'Storage is full or blocked, so this change will be lost on reload.' }), 0);
});
initShell();
startRouter(onRoute);
