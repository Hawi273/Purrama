// The visitor's library: watchlist, favourites, watched and ratings, saved in
// this browser. Filter by films or series; remove items; rate from the list.

import { h, mount } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { filmRow, starsDisplay, chip, yearOf } from '../ui/components.js';
import { stateCard, toast } from '../ui/feedback.js';
import { pageSignal } from '../ui/lifecycle.js';
import { library } from '../state/library.js';
import { href, replaceQuery } from '../router.js';
import { setMeta } from './common.js';

/** @typedef {import('../router.js').Route} Route */
/** @typedef {'watchlist' | 'favorites' | 'watched' | 'ratings'} Tab */

/** @type {[Tab, string][]} */
const TABS = [['watchlist', 'Watchlist'], ['favorites', 'Favourites'], ['watched', 'Watched'], ['ratings', 'Ratings']];

/** @type {Record<Tab, { title: string, body: string, mood: import('../ui/mochi.js').MochiMood }>} */
const EMPTY = {
  watchlist: { title: 'Your watchlist is napping', body: "Save films and series you want to see and they'll wait here for a cozy night in.", mood: 'sleep' },
  favorites: { title: 'No favourites yet', body: 'Tap the heart on any film or series you love and it will live here.', mood: 'love' },
  watched: { title: 'Nothing marked as watched', body: 'Mark what you have seen, or rate it, and it shows up here.', mood: 'popcorn' },
  ratings: { title: 'No ratings yet', body: 'Open any film or series and tap a star. Your ratings stay in this browser.', mood: 'rated' },
};

/**
 * @param {HTMLElement} main
 * @param {Route} route
 */
export function render(main, route) {
  const q = route.query;
  /** @type {{ tab: Tab, media: 'all' | 'movie' | 'tv' }} */
  const state = {
    tab: TABS.some(([k]) => k === q.get('tab')) ? /** @type {Tab} */ (q.get('tab')) : 'watchlist',
    media: q.get('media') === 'movie' || q.get('media') === 'tv' ? /** @type {'movie' | 'tv'} */ (q.get('media')) : 'all',
  };
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Your lists' });
  const filters = h('div', { class: 'chips', role: 'group', 'aria-label': 'Show' });
  const panel = h('div', { role: 'tabpanel', id: 'library-panel', class: 'library-panel' });
  const counts = h('div', { class: 'chips profile-counts' });

  mount(main, h('div', { class: 'container page' },
    h('article', { class: 'pr-card pr-card--hero profile', 'aria-labelledby': 'library-title' },
      h('div', { class: 'profile__body' },
        h('p', { class: 'eyebrow', text: 'Your library' }),
        h('h1', { class: 'page-title', id: 'library-title', text: 'Your lists' }),
        h('p', { class: 'meta', text: 'Saved in this browser only. There are no accounts yet, so your lists stay on this device and don’t sync anywhere.' }),
        counts)),
    tabs, filters, panel));

  const paint = () => {
    const n = library.counts();
    setMeta(TABS.find(([k]) => k === state.tab)?.[1] ?? 'Library', 'Your watchlist, favourites, watched titles and ratings on purrama.');
    counts.replaceChildren(
      h('span', { class: 'pr-chip pr-chip--selected', text: `${n.ratings} rated` }),
      h('span', { class: 'pr-chip', text: `${n.watchlist} on watchlist` }),
      h('span', { class: 'pr-chip', text: `${n.favorites} favourite${n.favorites === 1 ? '' : 's'}` }),
      h('span', { class: 'pr-chip', text: `${n.watched} watched` }));
    tabs.replaceChildren(...TABS.map(([key, label]) => h('button', {
      type: 'button', role: 'tab', class: 'tab', id: `tab-${key}`, 'aria-selected': String(state.tab === key), 'aria-controls': 'library-panel',
      tabindex: state.tab === key ? '0' : '-1', text: `${label} ${n[key]}`,
      on: { click: () => { state.tab = key; sync(); paint(); }, keydown: onTabKey },
    })));
    panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
    filters.replaceChildren(
      chip('All', state.media === 'all', () => { state.media = 'all'; sync(); paint(); }),
      chip('Films', state.media === 'movie', () => { state.media = 'movie'; sync(); paint(); }),
      chip('Series', state.media === 'tv', () => { state.media = 'tv'; sync(); paint(); }));

    const items = library.items(state.tab).filter((i) => state.media === 'all' || i.media === state.media);
    if (!items.length) {
      const empty = EMPTY[state.tab];
      panel.replaceChildren(stateCard({
        mood: empty.mood, compact: true, title: empty.title, body: empty.body,
        action: h('a', { class: 'pr-btn pr-btn--brand', href: '#/discover', text: 'Find something to watch' }),
      }));
      return;
    }
    panel.replaceChildren(h('ul', { class: 'rows' }, ...items.map((item) => {
      const rating = 'rating' in item ? item.rating : 0;
      const remove = h('button', {
        type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon row-item__save', 'aria-label': `Remove ${item.title} from ${state.tab === 'ratings' ? 'ratings' : 'this list'}`,
        on: {
          click: () => {
            const tab = state.tab;
            if (tab === 'ratings') library.rate(item, 0);
            else library.toggle(tab, item, false);
            toast('Removed', {
              detail: item.title,
              action: { label: 'Undo', run: () => (tab === 'ratings' ? library.rate(item, rating) : library.toggle(tab, item, true)) },
            });
          },
        },
      }, icon('close'));
      const row = filmRow({
        url: href(`/${item.media}/${item.id}`), posterPath: item.poster_path, title: item.title,
        meta: [yearOf(item.date), item.media === 'tv' ? 'Series' : 'Film'].filter(Boolean).join(' · '),
        right: rating ? starsDisplay(rating) : null,
      });
      row.appendChild(remove);
      return row;
    })));
  };

  /** Arrow keys move between tabs (ARIA tabs pattern). @param {KeyboardEvent} event */
  const onTabKey = (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const index = TABS.findIndex(([k]) => k === state.tab);
    const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    if (!next) return;
    state.tab = next[0];
    sync();
    paint();
    /** @type {HTMLElement | null} */ (tabs.querySelector(`#tab-${state.tab}`))?.focus();
  };
  const sync = () => replaceQuery({ tab: state.tab, media: state.media !== 'all' ? state.media : '' });

  library.addEventListener('change', paint, { signal: pageSignal() });
  paint();
}
