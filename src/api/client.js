// The one place the app talks to the network. Every TMDB call goes through
// request(): it builds the Worker URL, shares identical in-flight requests,
// keeps a small in-memory cache, applies a timeout and turns every failure
// into an ApiError with a kind the UI can explain.

import { API_BASE } from '../../config.js';

/** @typedef {'network' | 'timeout' | 'not-found' | 'rate-limit' | 'server' | 'bad-response'} ApiErrorKind */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {ApiErrorKind} kind
   * @param {number} [status]
   */
  constructor(message, kind, status) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

/** @typedef {Record<string, string | number | boolean | undefined | null>} Params */

const TIMEOUT_MS = 12_000;
const MAX_ENTRIES = 250;
const DEFAULT_TTL_MS = 5 * 60_000;

/** @type {Map<string, { expires: number, value: unknown }>} */
const cache = new Map();
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

/**
 * Build the Worker URL for a TMDB path. Empty params are dropped and keys are
 * sorted so the same request always has the same cache key.
 * @param {string} path  TMDB path, e.g. "/movie/603"
 * @param {Params} [params]
 * @param {string} [base]
 */
export function buildUrl(path, params = {}, base = API_BASE) {
  if (!path.startsWith('/')) throw new TypeError('path must start with "/"');
  const url = new URL(base.replace(/\/$/, '') + path);
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * @param {number} status
 * @returns {ApiError}
 */
export function errorForStatus(status) {
  if (status === 404) return new ApiError('Not found on TMDB.', 'not-found', status);
  if (status === 429) return new ApiError('Too many requests. Wait a moment and try again.', 'rate-limit', status);
  return new ApiError(`The server answered ${status}.`, 'server', status);
}

/**
 * Fetch JSON from the Worker.
 * @template T
 * @param {string} path
 * @param {Params} [params]
 * @param {{ ttl?: number, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<T>}
 */
export function request(path, params = {}, options = {}) {
  const { ttl = DEFAULT_TTL_MS, fetchImpl = fetch } = options;
  const url = buildUrl(path, params);

  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) {
    cache.delete(url); // refresh LRU position
    cache.set(url, hit);
    return Promise.resolve(/** @type {T} */ (hit.value));
  }
  const pending = inflight.get(url);
  if (pending) return /** @type {Promise<T>} */ (pending);

  const promise = (async () => {
    /** @type {Response} */
    let res;
    try {
      res = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      const timedOut = err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
      throw timedOut
        ? new ApiError('TMDB took too long to answer.', 'timeout')
        : new ApiError('Could not reach the server. Check your connection.', 'network');
    }
    if (!res.ok) throw errorForStatus(res.status);
    /** @type {unknown} */
    let body;
    try {
      body = await res.json();
    } catch {
      throw new ApiError('The server sent something unexpected.', 'bad-response', res.status);
    }
    if (ttl > 0) {
      cache.set(url, { expires: Date.now() + ttl, value: body });
      while (cache.size > MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest === undefined) break;
        cache.delete(oldest);
      }
    }
    return body;
  })().finally(() => inflight.delete(url));

  inflight.set(url, promise);
  return /** @type {Promise<T>} */ (promise);
}

/** Empty the cache (used by tests and "Try again"). */
export function clearCache() {
  cache.clear();
}
