// Hash router. GitHub Pages serves one index.html, so every page lives after
// the "#": #/movie/603, #/tv/1399?season=2, #/person/287, #/search?q=dune.

/**
 * @typedef {object} Route
 * @property {string} name
 * @property {Record<string, string>} params   path parameters
 * @property {URLSearchParams} query
 */

/** @type {[string, RegExp, string[]][]} */
const TABLE = [
  ['home', /^\/?$/, []],
  ['movies', /^\/movies\/?$/, []],
  ['tv-shows', /^\/tv\/?$/, []],
  ['discover', /^\/discover\/?$/, []],
  ['search', /^\/search\/?$/, []],
  ['library', /^\/library\/?$/, []],
  ['movie', /^\/movie\/(\d{1,10})\/?$/, ['id']],
  ['tv', /^\/tv\/(\d{1,10})\/?$/, ['id']],
  ['person', /^\/person\/(\d{1,10})\/?$/, ['id']],
];

/**
 * @param {string} hash  location.hash, with or without "#"
 * @returns {Route}
 */
export function parseHash(hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path = '/', search = ''] = raw.split('?');
  const query = new URLSearchParams(search);
  for (const [name, pattern, keys] of TABLE) {
    const match = pattern.exec(path);
    if (!match) continue;
    /** @type {Record<string, string>} */
    const params = {};
    keys.forEach((key, i) => { params[key] = match[i + 1] ?? ''; });
    return { name, params, query };
  }
  return { name: 'not-found', params: { path }, query };
}

/**
 * Build a hash link.
 * @param {string} path  e.g. "/movie/603"
 * @param {Record<string, string | number | undefined | null>} [query]
 */
export function href(path, query = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

/**
 * Change only the query of the current route without adding a history entry
 * (filters, tabs, season picker).
 * @param {Record<string, string | number | undefined | null>} query
 */
export function replaceQuery(query) {
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0] ?? '/';
  history.replaceState(null, '', href(path, query));
}

/**
 * @param {(route: Route) => void} onRoute
 */
export function startRouter(onRoute) {
  const run = () => onRoute(parseHash(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
