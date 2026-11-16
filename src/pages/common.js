// Helpers shared by pages.

/**
 * Per-route document title and description (for tabs, history and sharing).
 * @param {string} title
 * @param {string} [description]
 */
export function setMeta(title, description) {
  document.title = title ? `${title} · purrama` : 'purrama · Cozy movie and TV discovery for night owls';
  const meta = document.querySelector('meta[name="description"]');
  if (meta && description) meta.setAttribute('content', description.slice(0, 200));
}

/** Greeting for the eyebrow label, by the visitor's local time. */
export function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} key
 * @returns {T[]}
 */
export function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
