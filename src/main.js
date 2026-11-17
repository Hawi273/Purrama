// Boot: shell (search, nav icons), saved lists, router.

import { startRouter, href } from './router.js';
import { initLibrary, library } from './state/library.js';
import { newPage } from './ui/lifecycle.js';
import { highlightLibraryTab } from './ui/nav.js';
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
function highlightNav(route) {
  for (const link of document.querySelectorAll('[data-nav]')) {
    if (/** @type {HTMLElement} */ (link).dataset.nav === route.name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  highlightLibraryTab(route.name === 'library' ? route.query.get('tab') ?? 'watchlist' : '');
}

/** Counts next to each list in the "Your library" menu. */
function paintLibraryCounts() {
  const counts = library.counts();
  for (const el of document.querySelectorAll('[data-count]')) {
    const key = /** @type {keyof typeof counts} */ (/** @type {HTMLElement} */ (el).dataset.count);
    el.textContent = String(counts[key] ?? 0);
  }
}

/** Escape closes the hover/focus menu by moving focus back to its trigger. */
function initNavMenu() {
  const menu = document.querySelector('.navmenu');
  menu?.addEventListener('keydown', (event) => {
    if (/** @type {KeyboardEvent} */ (event).key !== 'Escape') return;
    menu.classList.add('navmenu--closed');
    /** @type {HTMLElement | null} */ (menu.querySelector('.navmenu__trigger'))?.focus();
  });
  menu?.addEventListener('mouseleave', () => menu.classList.remove('navmenu--closed'));
  menu?.addEventListener('focusout', () => menu.classList.remove('navmenu--closed'));
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
initNavMenu();
paintLibraryCounts();
library.addEventListener('change', paintLibraryCounts);
startRouter(onRoute);
