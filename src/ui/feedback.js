// States and feedback from the kit's states template: empty, loading, error,
// toast and the dialog used for trailers. Mochi appears at most once.

import { h } from './dom.js';
import { icon } from './icons.js';
import { ApiError } from '../api/client.js';
import { mochi as cat } from './mochi.js';

/** @typedef {import('./mochi.js').MochiMood} MochiMood */

/**
 * A centred state card: Mochi, a heading, one sentence, one action.
 * @param {{ mood: MochiMood, eyebrow?: string, title: string, body: string, action?: Node | null, compact?: boolean }} s
 */
export function stateCard(s) {
  return h('section', { class: `pr-card state${s.compact ? ' state--compact' : ''}` },
    s.eyebrow ? h('p', { class: 'eyebrow', text: s.eyebrow }) : null,
    cat(s.mood, s.compact ? 120 : 160),
    h('h2', { class: 'state__title', text: s.title }),
    h('p', { class: 'state__body', text: s.body }),
    s.action ?? null);
}

/**
 * Error state with "Try again".
 * @param {unknown} error
 * @param {() => void} retry
 * @param {string} [what]  e.g. "this film"
 */
export function errorState(error, retry, what = 'this page') {
  const notFound = error instanceof ApiError && error.kind === 'not-found';
  if (notFound) {
    return stateCard({
      mood: 'peek', eyebrow: '404', title: 'This page wandered off',
      body: `TMDB doesn't know ${what}. The link might be old. Let's get you back to the good stuff.`,
      action: h('a', { class: 'pr-btn pr-btn--primary', href: '#/', text: 'Back to home' }),
    });
  }
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';
  return stateCard({
    mood: 'sad', eyebrow: 'Error', title: `We couldn't load ${what}`,
    body: `${message} Your lists and ratings are safe.`,
    action: h('button', { type: 'button', class: 'pr-btn pr-btn--primary', text: 'Try again', on: { click: retry } }),
  });
}

/** Loading block with Mochi's loading dots. @param {string} [text] */
export function loadingState(text = 'Fetching films…') {
  return h('div', { class: 'loading', role: 'status' },
    cat('loading', 96),
    h('div', {},
      h('p', { class: 'loading__title', text }),
      h('p', { class: 'loading__body', text: 'This only takes a moment.' })));
}

/** Small inline error inside a row or section. @param {unknown} error @param {() => void} retry */
export function inlineError(error, retry) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';
  return h('div', { class: 'inline-error', role: 'alert' },
    h('span', { text: `Couldn't load this row. ${message}` }),
    h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--sm', text: 'Try again', on: { click: retry } }));
}

// ---- Toast ----------------------------------------------------------------

/** @type {HTMLElement | null} */
let toastRegion = null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let toastTimer;

/**
 * @param {string} message
 * @param {{ detail?: string, mood?: MochiMood, action?: { label: string, run: () => void } }} [options]
 */
export function toast(message, options = {}) {
  if (!toastRegion) {
    toastRegion = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(toastRegion);
  }
  clearTimeout(toastTimer);
  const close = () => toastRegion?.replaceChildren();
  toastRegion.replaceChildren(h('div', { class: 'toast' },
    options.mood ? cat(options.mood, 48) : null,
    h('div', { class: 'toast__text' },
      h('strong', { text: message }),
      options.detail ? h('span', { text: options.detail }) : null),
    options.action
      ? h('button', { type: 'button', class: 'toast__action', text: options.action.label, on: { click: () => { options.action?.run(); close(); } } })
      : null));
  toastTimer = setTimeout(close, 4000);
}

// ---- Dialog ---------------------------------------------------------------

/**
 * Open a modal dialog. Focus moves in, Escape and the close button close it,
 * and focus returns to the opener.
 * @param {string} title
 * @param {Node} body
 * @param {{ wide?: boolean }} [options]
 */
export function openDialog(title, body, options = {}) {
  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  const dialog = h('dialog', { class: `dialog${options.wide ? ' dialog--wide' : ''}`, 'aria-labelledby': 'dialog-title' },
    h('div', { class: 'dialog__head' },
      h('h2', { id: 'dialog-title', class: 'dialog__title', text: title }),
      h('button', { type: 'button', class: 'pr-btn pr-btn--quiet pr-btn--icon', 'aria-label': 'Close', on: { click: () => dialog.close() } }, icon('close'))),
    body);
  dialog.addEventListener('close', () => { dialog.remove(); opener?.focus(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.body.appendChild(dialog);
  dialog.showModal();
  return dialog;
}

/**
 * Trailer in a privacy-enhanced YouTube player, only loaded on request.
 * @param {string} key   YouTube video id
 * @param {string} title
 */
export function openTrailer(key, title) {
  if (!/^[\w-]{6,20}$/.test(key)) return;
  const frame = h('iframe', {
    class: 'trailer-frame',
    src: `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`,
    title: `Trailer: ${title}`,
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    referrerpolicy: 'strict-origin-when-cross-origin',
  });
  openDialog(title, h('div', { class: 'trailer' }, frame), { wide: true });
}
