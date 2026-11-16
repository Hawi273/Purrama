# purrama

Cozy movie and TV discovery for night owls. Browse films and series, search across titles and people, read the details, keep a watchlist and favourites, and rate what you watched. Movie, TV and people data come from [TMDB](https://www.themoviedb.org/).

This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.

## How it fits together

```
Browser (GitHub Pages: index.html, src/, styles/)  →  worker/ (Cloudflare Worker, holds the TMDB token)  →  api.themoviedb.org
                                                    →  image.tmdb.org (posters, backdrops, photos)
```

- **The site is static and public.** No build step: GitHub Pages serves the repo root as-is. It contains **no keys**; it only knows the Worker's URL (`config.js`).
- **The Worker** adds the TMDB **API Read Access Token** as a `Bearer` header. The token is a Worker secret, never a file in this repo. The Worker only forwards an allowlist of read-only TMDB endpoints and validated query parameters, only answers the origins in `worker/wrangler.toml`, limits each visitor IP to 120 requests a minute, and caches answers at the edge.
- **Your lists** (watchlist, favourites, watched, 1–5 star ratings) are saved in your browser's `localStorage`. There are no accounts, so they stay on that device and browser. Ratings from purrama v1 carry over automatically.

### Project layout

```
index.html              app shell: header, main, footer (TMDB logo + notice), mobile tab bar
config.js               Worker URL (local and production)
src/main.js             boot: shell, library, router
src/router.js           hash routes (#/movie/603, #/tv/1399?season=2, #/person/287, #/search?q=)
src/api/                TMDB client: types (JSDoc), request (dedupe, cache, timeout, errors), image URLs, endpoints
src/state/library.js    watchlist / favourites / watched / ratings in localStorage
src/ui/                 design-system components (poster card, rail, stars, chips, Mochi, states, toast, dialog)
src/pages/              home, browse (movies + TV), discover, search, title (movie + TV), person, library
styles/purrama.css      the brand kit's stylesheet, unchanged
styles/app.css          app layout, built only from the kit's tokens
assets/                 logo and Mochi animations from the kit, TMDB logo
design/purrama-brand-kit/  the extracted brand kit (source of truth for the design system)
worker/                 Cloudflare Worker (TMDB proxy)
test/                   unit tests and a Worker test against a fake TMDB
```

## Develop locally

Requires Node.js 20+.

```bash
npm install
```

1. Put your TMDB **API Read Access Token** (TMDB → Settings → API, the long value starting with `eyJ`) in `worker/.dev.vars`, one line, no quotes or brackets. The file is git-ignored.
   ```
   TMDB_TOKEN=eyJ...
   ```
2. Start the Worker (port 8787) and the site (port 8000) in two terminals:
   ```bash
   npm run dev:api
   ```
   ```bash
   npm run dev:site
   ```
3. Open http://localhost:8000. `config.js` uses the local Worker automatically.

### Checks

```bash
npm run check   # TypeScript (strict, checkJs), ESLint, unit + Worker tests
```

## Deploy

- **Site:** GitHub Pages builds from `main`, repo root. Bump `?v=` on the CSS and JS links in `index.html` with each release so browsers never mix new and cached files.
- **Worker:** Cloudflare Workers Builds deploys `worker/` from `main` on every push. The token is the Worker secret `TMDB_TOKEN` (Cloudflare → Workers & Pages → purrama-api → Settings → Variables and Secrets).

## Keeping the token secret

- Never put the token in `config.js` or any file the site serves, and never commit `worker/.dev.vars` or `.env` (both are git-ignored).
- Turn on **secret scanning** and **push protection** in GitHub → Settings → Code security.
- If the token is ever committed or shared, regenerate it on TMDB right away.

## Design

The look comes from the Purrama brand kit in `design/purrama-brand-kit/` (Midnight Cushion: night-green surfaces, 2.5px outlines, hard offset shadows, one amber action per screen, Fredoka + Nunito, Mochi the cat). Figma screens: `Purrama-Website.figcraft`.

## Attribution

Data and images: [TMDB](https://www.themoviedb.org/). The TMDB logo in the footer is less prominent than the purrama logo, as TMDB's terms require.
