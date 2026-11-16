// The visitor's own lists: watchlist, favourites, watched and star ratings.
// Saved in this browser's localStorage only. There are no accounts, so
// nothing syncs between devices, and the UI says so.

/** @typedef {import('../api/types.js').MediaType} MediaType */
/** @typedef {'watchlist' | 'favorites' | 'watched'} ListName */

/**
 * A saved title. We keep a small snapshot so lists render without a request.
 * @typedef {object} SavedTitle
 * @property {number} id
 * @property {MediaType} media
 * @property {string} title
 * @property {string | null} poster_path
 * @property {string} date          release or first air date, may be ""
 * @property {number} addedAt
 */

/** @typedef {SavedTitle & { rating: number }} RatedTitle */

/**
 * @typedef {object} LibraryData
 * @property {2} version
 * @property {Record<string, SavedTitle>} watchlist
 * @property {Record<string, SavedTitle>} favorites
 * @property {Record<string, SavedTitle>} watched
 * @property {Record<string, RatedTitle>} ratings
 */

export const STORE_KEY = 'purrama:library:v2';
export const LEGACY_KEY = 'purrama:ratings:v1';
export const LISTS = /** @type {const} */ (['watchlist', 'favorites', 'watched']);

/** @returns {LibraryData} */
function empty() {
  return { version: 2, watchlist: {}, favorites: {}, watched: {}, ratings: {} };
}

/**
 * @param {MediaType} media
 * @param {number} id
 */
export function keyOf(media, id) {
  return `${media}:${id}`;
}

/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Keep only well-formed entries, so a damaged or hand-edited store can't break the app.
 * @param {unknown} value
 * @returns {SavedTitle | null}
 */
function cleanTitle(value) {
  if (!isObject(value)) return null;
  const { id, media, title, poster_path, date, addedAt } = value;
  if (typeof id !== 'number' || !Number.isInteger(id) || (media !== 'movie' && media !== 'tv')) return null;
  return {
    id,
    media,
    title: typeof title === 'string' ? title : 'Untitled',
    poster_path: typeof poster_path === 'string' ? poster_path : null,
    date: typeof date === 'string' ? date : '',
    addedAt: typeof addedAt === 'number' ? addedAt : 0,
  };
}

/**
 * @param {unknown} raw   parsed JSON of the v2 store
 * @param {unknown} legacy parsed JSON of the v1 ratings store
 * @returns {LibraryData}
 */
export function parseStore(raw, legacy) {
  const data = empty();
  if (isObject(raw)) {
    for (const list of LISTS) {
      const source = raw[list];
      if (!isObject(source)) continue;
      for (const value of Object.values(source)) {
        const item = cleanTitle(value);
        if (item) data[list][keyOf(item.media, item.id)] = item;
      }
    }
    if (isObject(raw.ratings)) {
      for (const value of Object.values(raw.ratings)) {
        const item = cleanTitle(value);
        const rating = isObject(value) ? value.rating : undefined;
        if (item && typeof rating === 'number' && rating >= 1 && rating <= 5) {
          data.ratings[keyOf(item.media, item.id)] = { ...item, rating: Math.round(rating) };
        }
      }
    }
  }
  // v1 stored movie ratings as { [id]: { id, title, release_date, poster_path, rating, ratedAt } }.
  if (isObject(legacy)) {
    for (const value of Object.values(legacy)) {
      if (!isObject(value) || typeof value.id !== 'number') continue;
      const key = keyOf('movie', value.id);
      const rating = value.rating;
      if (data.ratings[key] || typeof rating !== 'number' || rating < 1 || rating > 5) continue;
      data.ratings[key] = {
        id: value.id,
        media: 'movie',
        title: typeof value.title === 'string' ? value.title : 'Untitled',
        poster_path: typeof value.poster_path === 'string' ? value.poster_path : null,
        date: typeof value.release_date === 'string' ? value.release_date : '',
        addedAt: typeof value.ratedAt === 'number' ? value.ratedAt : 0,
        rating: Math.round(rating),
      };
    }
  }
  return data;
}

/** @param {string} key @returns {unknown} */
function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

class Library extends EventTarget {
  constructor() {
    super();
    /** @type {LibraryData} */
    this.data = empty();
    /** true when the browser refused to save (private mode, storage full) */
    this.saveFailed = false;
  }

  load() {
    const legacy = readJson(LEGACY_KEY);
    this.data = parseStore(readJson(STORE_KEY), legacy);
    // Migrate v1 once: write v2, then drop the old key so a rating cleared
    // later is not restored from it on the next load.
    if (legacy !== null && this.persist()) {
      try { localStorage.removeItem(LEGACY_KEY); } catch { /* keep it; parseStore ignores duplicates */ }
    }
    return this;
  }

  /** Write to localStorage. @returns {boolean} whether it was saved */
  persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
      this.saveFailed = false;
    } catch {
      this.saveFailed = true;
    }
    return !this.saveFailed;
  }

  /**
   * Save and notify. A failed save (private mode, storage full) fires
   * "savefailed" so the UI can say the change won't survive a reload.
   * @returns {boolean}
   */
  save() {
    const ok = this.persist();
    this.dispatchEvent(new Event('change'));
    if (!ok) this.dispatchEvent(new Event('savefailed'));
    return ok;
  }

  /**
   * @param {ListName} list
   * @param {MediaType} media
   * @param {number} id
   */
  has(list, media, id) {
    return Boolean(this.data[list][keyOf(media, id)]);
  }

  /**
   * @param {ListName} list
   * @param {Omit<SavedTitle, 'addedAt'>} title
   * @param {boolean} [on]  force on or off; toggles when omitted
   * @returns {boolean} whether the title is now in the list
   */
  toggle(list, title, on) {
    const key = keyOf(title.media, title.id);
    const next = on ?? !this.data[list][key];
    if (next) this.data[list][key] = { ...title, addedAt: Date.now() };
    else delete this.data[list][key];
    this.save();
    return next;
  }

  /**
   * @param {MediaType} media
   * @param {number} id
   */
  rating(media, id) {
    return this.data.ratings[keyOf(media, id)]?.rating ?? 0;
  }

  /**
   * Rate 1–5, or 0 to clear. Rating a title also marks it watched.
   * @param {Omit<SavedTitle, 'addedAt'>} title
   * @param {number} value
   */
  rate(title, value) {
    const key = keyOf(title.media, title.id);
    if (value >= 1 && value <= 5) {
      this.data.ratings[key] = { ...title, rating: Math.round(value), addedAt: Date.now() };
      if (!this.data.watched[key]) this.data.watched[key] = { ...title, addedAt: Date.now() };
    } else {
      delete this.data.ratings[key];
    }
    this.save();
  }

  /**
   * @param {ListName | 'ratings'} list
   * @returns {(SavedTitle | RatedTitle)[]} newest first
   */
  items(list) {
    return Object.values(this.data[list]).sort((a, b) => b.addedAt - a.addedAt);
  }

  counts() {
    return {
      watchlist: Object.keys(this.data.watchlist).length,
      favorites: Object.keys(this.data.favorites).length,
      watched: Object.keys(this.data.watched).length,
      ratings: Object.keys(this.data.ratings).length,
    };
  }
}

export const library = new Library();

/** Load the store and follow changes made in other tabs. */
export function initLibrary() {
  library.load();
  window.addEventListener('storage', (event) => {
    if (event.key === STORE_KEY || event.key === null) {
      library.load();
      library.dispatchEvent(new Event('change'));
    }
  });
}
