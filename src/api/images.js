// TMDB image URLs. Paths are validated so a strange value from the API can
// never become a URL to somewhere else; a missing image returns null and the
// UI shows its placeholder instead.

const BASE = 'https://image.tmdb.org/t/p/';

export const SIZES = /** @type {const} */ ({
  poster: { sm: 'w154', md: 'w342', lg: 'w500', xl: 'w780' },
  backdrop: { sm: 'w300', md: 'w780', lg: 'w1280', xl: 'original' },
  profile: { sm: 'w45', md: 'w185', lg: 'h632' },
  still: { sm: 'w185', md: 'w300' },
  logo: { sm: 'w92', md: 'w154' },
});

/** @typedef {keyof typeof SIZES} ImageKind */

/**
 * @template {ImageKind} K
 * @param {string | null | undefined} path
 * @param {K} kind
 * @param {keyof (typeof SIZES)[K]} size
 * @returns {string | null}
 */
export function imageUrl(path, kind, size) {
  if (typeof path !== 'string' || !/^\/[\w.-]+\.(jpg|jpeg|png|svg|webp)$/i.test(path)) return null;
  return BASE + /** @type {string} */ (SIZES[kind][size]) + path;
}

/**
 * srcset for a poster so the browser picks the right size.
 * @param {string | null | undefined} path
 * @returns {string | null}
 */
export function posterSrcset(path) {
  const sm = imageUrl(path, 'poster', 'sm');
  if (!sm) return null;
  return `${sm} 154w, ${imageUrl(path, 'poster', 'md')} 342w, ${imageUrl(path, 'poster', 'lg')} 500w`;
}

/**
 * @param {string | null | undefined} path
 * @returns {string | null}
 */
export function backdropSrcset(path) {
  const md = imageUrl(path, 'backdrop', 'md');
  if (!md) return null;
  return `${imageUrl(path, 'backdrop', 'sm')} 300w, ${md} 780w, ${imageUrl(path, 'backdrop', 'lg')} 1280w`;
}
