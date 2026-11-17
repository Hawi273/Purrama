// Purrama design-system components built on the kit's pr-* classes.

import { h } from './dom.js';
import { icon, starIcon } from './icons.js';
import { imageUrl, posterSrcset } from '../api/images.js';
import { href } from '../router.js';
import { library } from '../state/library.js';
import { toast } from './feedback.js';
import { pageSignal } from './lifecycle.js';

/** @typedef {import('../api/types.js').TitleSummary} TitleSummary */
/** @typedef {import('../api/types.js').MediaType} MediaType */
/** @typedef {import('../state/library.js').SavedTitle} SavedTitle */

/** @param {{ title?: string, name?: string }} t */
export const titleOf = (t) => t.title ?? t.name ?? 'Untitled';
/** @param {{ release_date?: string, first_air_date?: string }} t */
export const dateOf = (t) => t.release_date ?? t.first_air_date ?? '';
/** @param {string | null | undefined} date */
export const yearOf = (date) => (date && /^\d{4}/.test(date) ? date.slice(0, 4) : '');

/**
 * @param {TitleSummary} t
 * @param {MediaType} media
 * @returns {Omit<SavedTitle, 'addedAt'>}
 */
export function snapshot(t, media) {
  return { id: t.id, media, title: titleOf(t), poster_path: t.poster_path ?? null, date: dateOf(t) };
}

/** @param {number | null | undefined} minutes */
export function runtime(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

/** @param {string | null | undefined} date */
export function longDate(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Poster image or the kit's outlined placeholder.
 * @param {string | null | undefined} path
 * @param {string} title
 * @param {{ size?: 'sm' | 'md', sizes?: string, eager?: boolean }} [options]
 */
export function poster(path, title, options = {}) {
  const { size = 'md', sizes = '(max-width: 600px) 40vw, 180px', eager = false } = options;
  const small = size === 'sm';
  const src = imageUrl(path, 'poster', small ? 'sm' : 'md');
  const cls = `pr-poster${small ? ' pr-poster--sm' : ''}`;
  if (!src) {
    return h('div', { class: `${cls} poster-missing`, role: 'img', 'aria-label': `No poster for ${title}` },
      small ? null : icon('film', { size: 32 }), small ? null : h('span', { text: 'No poster yet' }));
  }
  return h('img', {
    class: cls,
    src,
    srcset: small ? undefined : posterSrcset(path),
    sizes: small ? undefined : sizes,
    alt: small ? '' : `Poster for ${title}`,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    width: small ? 48 : 342,
    height: small ? 72 : 513,
  });
}

/** TMDB average shown as a small amber star and one decimal. @param {number | undefined} vote */
export function tmdbScore(vote) {
  if (!vote) return null;
  return h('span', { class: 'score', 'aria-label': `TMDB rating ${vote.toFixed(1)} out of 10` },
    h('span', { class: 'score__star' }, starIcon()), vote.toFixed(1));
}

/**
 * Watchlist toggle used on cards and rows.
 * @param {Omit<SavedTitle, 'addedAt'>} item
 * @param {string} [className]
 */
export function watchlistButton(item, className = 'tile__save') {
  const button = h('button', { type: 'button', class: `pr-btn pr-btn--quiet pr-btn--icon ${className}` });
  const paint = () => {
    const on = library.has('watchlist', item.media, item.id);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`);
    button.replaceChildren(icon(on ? 'check' : 'bookmark'));
  };
  button.addEventListener('click', () => {
    const on = library.toggle('watchlist', item);
    toast(on ? 'Added to your watchlist' : 'Removed from your watchlist', { detail: item.title });
  });
  library.addEventListener('change', paint, { signal: pageSignal() });
  paint();
  return button;
}

/**
 * Poster card for a movie or TV show.
 * @param {TitleSummary} t
 * @param {MediaType} media
 * @param {{ eager?: boolean, save?: boolean, meta?: string }} [options]
 */
export function titleCard(t, media, options = {}) {
  const { eager = false, save = true, meta } = options;
  const name = titleOf(t);
  const year = yearOf(dateOf(t));
  const kind = media === 'tv' ? 'Series' : 'Film';
  return h('article', { class: 'tile' },
    h('a', { class: 'tile__link', href: href(`/${media}/${t.id}`) },
      poster(t.poster_path, name, { eager }),
      h('span', { class: 'tile__title', text: name }),
      h('span', { class: 'tile__meta' },
        h('span', { text: meta ?? [year, kind].filter(Boolean).join(' · ') }),
        tmdbScore(t.vote_average))),
    save ? watchlistButton(snapshot(t, media)) : null);
}

/**
 * Person card (cast, search results).
 * @param {{ id: number, name: string, profile_path?: string | null }} p
 * @param {string} [role]
 */
export function personCard(p, role) {
  const src = imageUrl(p.profile_path, 'profile', 'md');
  const initials = p.name.split(/\s+/).map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  return h('article', { class: 'person' },
    h('a', { class: 'person__link', href: href(`/person/${p.id}`) },
      src
        ? h('img', { class: 'person__photo', src, alt: '', loading: 'lazy', decoding: 'async', width: 185, height: 278 })
        : h('span', { class: 'person__photo person__photo--empty', 'aria-hidden': 'true', text: initials }),
      h('span', { class: 'person__name', text: p.name }),
      role ? h('span', { class: 'person__role', text: role }) : null));
}

/**
 * Film/series row (kit's pr-film-row): small poster, title, meta, right slot.
 * @param {{ url: string, posterPath: string | null | undefined, title: string, meta: string, right?: Node | null, profile?: boolean }} row
 */
export function filmRow(row) {
  const thumb = row.profile
    ? (imageUrl(row.posterPath, 'profile', 'md')
      ? h('img', { class: 'pr-poster pr-poster--sm', src: imageUrl(row.posterPath, 'profile', 'md'), alt: '', loading: 'lazy', width: 48, height: 72 })
      : h('div', { class: 'pr-poster pr-poster--sm', 'aria-hidden': 'true' }))
    : poster(row.posterPath, row.title, { size: 'sm' });
  return h('li', { class: 'row-item' },
    h('a', { class: 'pr-film-row', href: row.url },
      thumb,
      h('span', { class: 'pr-film-row__text' },
        h('span', { class: 'pr-film-row__title', text: row.title }),
        h('span', { class: 'pr-film-row__meta', text: row.meta })),
      row.right ?? null));
}

/** Ratings are whole stars out of 10 (#9; a deliberate exception to the kit's 5). */
export const RATING_MAX = 10;

/**
 * Your rating in a list row: one amber star and "8/10" (ten stars don't fit a phone row).
 * @param {number} value 1–10
 */
export function starsDisplay(value) {
  return h('span', { class: 'rating-badge', role: 'img', 'aria-label': `Your rating: ${value} out of ${RATING_MAX}` },
    h('span', { class: 'pr-stars pr-stars--sm' }, h('span', { class: 'is-on' }, starIcon())),
    `${value}/${RATING_MAX}`);
}

/**
 * Interactive rating, 1–10 whole stars (the kit's star style). Click the
 * current star again to clear. Shows "8/10" beside the stars.
 * @param {number} value
 * @param {(value: number) => void} onRate
 * @param {string} label
 */
export function starsInput(value, onRate, label) {
  const group = h('span', { class: 'pr-stars stars-10', role: 'group', 'aria-label': label });
  const readout = h('span', { class: 'stars-10__value', 'aria-hidden': 'true' });
  let current = value;
  const buttons = Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((n) => h('button', {
    type: 'button',
    'aria-label': `${n} out of ${RATING_MAX}`,
    on: { click: () => { current = n === current ? 0 : n; paint(); onRate(current); } },
  }, starIcon()));
  const paint = () => {
    buttons.forEach((b, i) => {
      b.classList.toggle('is-on', i < current);
      b.setAttribute('aria-pressed', String(i + 1 === current));
    });
    readout.textContent = current ? `${current}/${RATING_MAX}` : `–/${RATING_MAX}`;
  };
  group.append(...buttons);
  paint();
  return h('span', { class: 'stars-10__wrap' }, group, readout);
}

/**
 * Section heading with an optional "See all" link.
 * @param {string} title
 * @param {{ more?: string, moreLabel?: string, id?: string }} [options]
 */
export function sectionHead(title, options = {}) {
  return h('div', { class: 'section-head' },
    h('h2', { class: 'section-title', id: options.id, text: title }),
    options.more ? h('a', { class: 'section-link', href: options.more, text: options.moreLabel ?? 'See all' }) : null);
}

/**
 * Toggle chip.
 * @param {string} label
 * @param {boolean} pressed
 * @param {() => void} onClick
 */
export function chip(label, pressed, onClick) {
  return h('button', { type: 'button', class: 'pr-chip', 'aria-pressed': String(pressed), text: label, on: { click: onClick } });
}

/** Skeleton tiles while a row loads. @param {number} count */
export function skeletonTiles(count) {
  return Array.from({ length: count }, () => h('li', { class: 'rail__item', 'aria-hidden': 'true' },
    h('div', { class: 'tile tile--skeleton' }, h('div', { class: 'pr-poster skeleton' }), h('div', { class: 'skeleton skeleton--line' }))));
}
