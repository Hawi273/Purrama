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
- **Your library** (watchlist, favourites, watched, and ratings from 1 to 10 stars) is saved in your browser's `localStorage`. There are no accounts, so it stays on that device and browser. Older ratings (1–5 stars, from earlier versions) are converted once to the 1–10 scale.

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

**Production stays production-only.** The committed files carry no local settings:

- `index.html`'s CSP allows only the production Worker. `npm run dev:site` adds `http://127.0.0.1:8787` to it when serving pages locally.
- `worker/wrangler.toml`'s top-level `[vars]` (what Cloudflare deploys) allow only `https://hawi273.github.io`. `npm run dev:api` runs the `[env.dev]` environment, which allows only `localhost:8000` and `127.0.0.1:8000` and is never deployed.
- `test/production.test.js` fails if either picks up a local address.

If port 8787 is taken, end the leftover `wrangler`/`workerd` processes, or temporarily change the port in `package.json`, `config.js` and `scripts/serve.mjs` (don't commit that change).

### Checks

```bash
npm run check     # TypeScript (strict, checkJs), ESLint, tests, and "index.html is current"
npm run release   # after changing anything in src/, config.js or styles/
```

| Test file | Covers |
|---|---|
| `test/worker.test.js` | Worker against a fake TMDB: origin lock, route allowlist, query validation, token only in the `Authorization` header |
| `test/client.test.js` | API client: URL building, shared in-flight requests, cache, error kinds |
| `test/tmdb.test.js` | request building: discover filters, details `append_to_response`, decade ranges, trailer choice |
| `test/images-router.test.js` | TMDB image URL validation, hash routes |
| `test/library.test.js` | lists and ratings, v1 migration, damaged storage |
| `test/release.test.js` | import map covers every module, CSP hash matches, `index.html` is current |

Pages, UI components and styles have no unit tests; they are checked in a real browser (gstack `/qa`, reports in `.gstack/qa-reports/`, git-ignored).

### Releasing a change (cache busting)

GitHub Pages lets browsers cache files for 10 minutes and there is no build step, so `scripts/release.mjs` versions everything in `index.html` by a hash of the source files:

- an inline **import map** maps every module (`./src/**/*.js`, `./config.js`) to `…?v=<hash>`, so relative and lazy imports are versioned too;
- the stylesheet and `src/main.js` links get the same `?v=`;
- the CSP's `script-src` carries the import map's `sha256`, so the inline map is allowed and nothing else is.

Run `npm run release` before committing source changes; `npm run check` fails if you forget. `.gitattributes` keeps files LF so the hash matches on every checkout.

### gstack

This repo uses [gstack](https://github.com/garrytan/gstack) in team mode (`CLAUDE.md`, `.claude/`). Its test mapping for `/verify` and `/ship` (which test covers which file) lives outside the repo in `~/.gstack/projects/Hawi273-Purrama/pregate.json`, because `.gstack/` is git-ignored and policy is read from `main`.

## Deploy

All work happens on `dev`. Nothing goes live until `dev` is merged into `main`, which deploys both:

- **Site:** GitHub Pages builds from `main`, repo root (no build step). Versions in `index.html` come from `npm run release`.
- **Worker:** Cloudflare Workers Builds deploys `worker/` from `main` on every push. The token is the Worker secret `TMDB_TOKEN` (Cloudflare → Workers & Pages → purrama-api → Settings → Variables and Secrets).

## Keeping the token secret

- Never put the token in `config.js` or any file the site serves, and never commit `worker/.dev.vars` or `.env` (both are git-ignored).
- Turn on **secret scanning** and **push protection** in GitHub → Settings → Code security.
- If the token is ever committed or shared, regenerate it on TMDB right away.

## Design

The look comes from the Purrama brand kit in `design/purrama-brand-kit/` (Midnight Cushion: night-green surfaces, 2.5px outlines, hard offset shadows, one amber action per screen, Fredoka + Nunito, Mochi the cat). The Figma screens (`*.figcraft`) are kept locally and are git-ignored.

Accessibility: visible focus rings, a skip link, real buttons and links, 44px touch targets on phones, and all motion stops under the system's reduced-motion setting.

## Attribution

Data and images: [TMDB](https://www.themoviedb.org/). The TMDB logo in the footer is less prominent than the purrama logo, as TMDB's terms require.
