// Purrama API proxy (Cloudflare Worker).
//
// The browser never sees the TMDB token: the site calls this Worker, the
// Worker adds the token and forwards a small allowlist of read-only TMDB
// endpoints. The token lives in a Worker secret (`wrangler secret put
// TMDB_TOKEN`), never in this repo.

const TMDB = 'https://api.themoviedb.org/3';

// [path pattern, cache seconds]. Anything else gets a 404.
const ROUTES = [
  [/^\/configuration$/, 86400],
  [/^\/genre\/movie\/list$/, 86400],
  [/^\/trending\/movie\/(day|week)$/, 600],
  [/^\/movie\/(popular|top_rated|now_playing|upcoming)$/, 1800],
  [/^\/movie\/\d{1,10}$/, 3600],
  [/^\/movie\/\d{1,10}\/(credits|videos|recommendations)$/, 3600],
  [/^\/search\/movie$/, 600],
];

// Query parameters passed on to TMDB; everything else is dropped.
const QUERY_PARAMS = new Set([
  'query', 'page', 'language', 'region', 'year', 'primary_release_year', 'include_adult',
]);

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
      if (QUERY_PARAMS.has(key) && value.length <= 200) upstream.searchParams.set(key, value);
    }
    upstream.searchParams.sort();

    // The cache key is the TMDB URL, which never contains the token.
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = new Request(upstream.toString());
    let res = cache ? await cache.match(cacheKey) : undefined;
    if (!res) {
      const tmdb = await fetch(upstream, {
        headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, Accept: 'application/json' },
      });
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
