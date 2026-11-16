// Purrama API proxy (Cloudflare Worker).
//
// The browser never sees the TMDB token: the site calls this Worker, the
// Worker adds the token and forwards an allowlist of read-only TMDB
// endpoints. The token lives in a Worker secret (`wrangler secret put
// TMDB_TOKEN`, or `worker/.dev.vars` locally), never in this repo.

const TMDB = 'https://api.themoviedb.org/3';

const DAY = 86400;
const HOUR = 3600;

// [path pattern, cache seconds]. Anything else gets a 404.
export const ROUTES = [
  [/^\/configuration$/, DAY],
  [/^\/genre\/(movie|tv)\/list$/, DAY],
  [/^\/trending\/(all|movie|tv|person)\/(day|week)$/, 600],
  [/^\/movie\/(popular|top_rated|now_playing|upcoming)$/, 1800],
  [/^\/tv\/(popular|top_rated|airing_today|on_the_air)$/, 1800],
  [/^\/person\/popular$/, 1800],
  [/^\/movie\/\d{1,10}$/, HOUR],
  [/^\/movie\/\d{1,10}\/(credits|videos|images|similar|recommendations|release_dates|keywords)$/, HOUR],
  [/^\/tv\/\d{1,10}$/, HOUR],
  [/^\/tv\/\d{1,10}\/(credits|aggregate_credits|videos|images|similar|recommendations|content_ratings)$/, HOUR],
  [/^\/tv\/\d{1,10}\/season\/\d{1,4}$/, HOUR],
  [/^\/tv\/\d{1,10}\/season\/\d{1,4}\/episode\/\d{1,5}$/, HOUR],
  [/^\/person\/\d{1,10}$/, HOUR],
  [/^\/person\/\d{1,10}\/(combined_credits|movie_credits|tv_credits|images)$/, HOUR],
  [/^\/collection\/\d{1,10}$/, DAY],
  [/^\/network\/\d{1,10}$/, DAY],
  [/^\/search\/(movie|tv|person|multi)$/, 600],
  [/^\/discover\/(movie|tv)$/, 1800],
];

// Query parameters passed on to TMDB, each with the values it may take.
// Everything else is dropped.
const SAFE = /^[\w.,|:-]{1,100}$/; // ids, dates, lists like "28,12" or "28|12"
const APPEND = new Set([
  'credits', 'aggregate_credits', 'videos', 'images', 'similar', 'recommendations',
  'release_dates', 'content_ratings', 'keywords', 'external_ids', 'combined_credits',
]);
const SORT = /^(popularity|vote_average|vote_count|primary_release_date|first_air_date|revenue|title|name)\.(asc|desc)$/;

export const QUERY_PARAMS = {
  query: (v) => v.length >= 1 && v.length <= 200,
  page: (v) => /^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= 500,
  language: (v) => /^[a-z]{2}(-[A-Z]{2})?$/.test(v),
  region: (v) => /^[A-Z]{2}$/.test(v),
  year: (v) => /^\d{4}$/.test(v),
  primary_release_year: (v) => /^\d{4}$/.test(v),
  first_air_date_year: (v) => /^\d{4}$/.test(v),
  include_adult: (v) => v === 'false',
  include_image_language: (v) => /^([a-z]{2}|null)(,([a-z]{2}|null)){0,3}$/.test(v),
  append_to_response: (v) => v.split(',').length <= 6 && v.split(',').every((p) => APPEND.has(p)),
  sort_by: (v) => SORT.test(v),
  with_genres: (v) => SAFE.test(v),
  without_genres: (v) => SAFE.test(v),
  with_networks: (v) => SAFE.test(v),
  with_original_language: (v) => /^[a-z]{2}$/.test(v),
  'vote_average.gte': (v) => /^\d{1,2}(\.\d)?$/.test(v),
  'vote_average.lte': (v) => /^\d{1,2}(\.\d)?$/.test(v),
  'vote_count.gte': (v) => /^\d{1,6}$/.test(v),
  'primary_release_date.gte': (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
  'primary_release_date.lte': (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
  'first_air_date.gte': (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
  'first_air_date.lte': (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
};

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, { Vary: 'Origin' });
    }
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Accept, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405, { ...cors, Allow: 'GET, OPTIONS' });
    }

    const url = new URL(request.url);
    const route = ROUTES.find(([pattern]) => pattern.test(url.pathname));
    if (!route) return json({ error: 'Not found' }, 404, cors);
    if (!env.TMDB_TOKEN) return json({ error: 'Server not configured' }, 500, cors);

    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return json({ error: 'Too many requests' }, 429, { ...cors, 'Retry-After': '60' });
    }

    const upstream = new URL(TMDB + url.pathname);
    for (const [key, value] of url.searchParams) {
      const check = Object.hasOwn(QUERY_PARAMS, key) ? QUERY_PARAMS[key] : null;
      if (check && check(value)) upstream.searchParams.set(key, value);
    }
    upstream.searchParams.sort();

    // The cache key is the TMDB URL, which never contains the token.
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = new Request(upstream.toString());
    let res = cache ? await cache.match(cacheKey) : undefined;
    if (!res) {
      let tmdb;
      try {
        tmdb = await fetch(upstream, {
          headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, Accept: 'application/json' },
        });
      } catch {
        return json({ error: 'TMDB unreachable' }, 502, cors);
      }
      res = new Response(tmdb.body, {
        status: tmdb.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': tmdb.ok ? `public, max-age=${route[1]}` : 'no-store',
        },
      });
      if (tmdb.ok && cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    const out = new Response(res.body, res);
    for (const [key, value] of Object.entries(cors)) out.headers.set(key, value);
    out.headers.set('X-Content-Type-Options', 'nosniff');
    return out;
  },
};
