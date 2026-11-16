// Tiny DOM builder. Text always goes in as textContent, never parsed as HTML,
// because TMDB titles, overviews and biographies are untrusted.

/** @typedef {Node | string | number | null | undefined | false} Child */
/** @typedef {Child | Child[]} Children */

/**
 * @typedef {object} Props
 * @property {string} [class]
 * @property {string} [text]
 * @property {Record<string, (event: any) => void>} [on]
 * @property {Record<string, string>} [data]
 * Any other key is set as an attribute: strings and numbers as-is, true as "",
 * false/null/undefined skipped.
 */

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Props & Record<string, unknown>} [props]
 * @param {...Children} children
 * @returns {HTMLElementTagNameMap[K]}
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else if (key === 'on') {
      for (const [type, fn] of Object.entries(/** @type {Record<string, EventListener>} */ (value))) {
        el.addEventListener(type, fn);
      }
    } else if (key === 'data') {
      for (const [k, v] of Object.entries(/** @type {Record<string, string>} */ (value))) el.dataset[k] = v;
    } else if (key === 'href' || key === 'src') {
      el.setAttribute(key, safeUrl(String(value)));
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(el, children);
  return el;
}

/**
 * @param {Node} parent
 * @param {Children[]} children
 */
export function append(parent, children) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/**
 * Only our own hash links, same-origin paths and https URLs are allowed.
 * @param {string} url
 */
export function safeUrl(url) {
  if (url.startsWith('#') || url.startsWith('./') || url.startsWith('assets/')) return url;
  try {
    const parsed = new URL(url, location.href);
    if (parsed.protocol === 'https:' || parsed.origin === location.origin) return parsed.href;
  } catch {
    /* fall through */
  }
  return '#';
}

/**
 * Replace an element's children.
 * @param {Element} el
 * @param {...Children} children
 */
export function mount(el, ...children) {
  el.replaceChildren();
  append(el, children);
}

/**
 * Debounce a function.
 * @template {unknown[]} A
 * @param {(...args: A) => void} fn
 * @param {number} ms
 * @returns {((...args: A) => void) & { cancel: () => void }}
 */
export function debounce(fn, ms) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const wrapped = /** @type {((...args: A) => void) & { cancel: () => void }} */ ((...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  });
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

/** @returns {boolean} */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
