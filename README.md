# Purrama

Webapp for movie rating, using data from [TMDB](https://www.themoviedb.org/).

## How it fits together

```
Browser (GitHub Pages: index.html, app.js)  →  worker/ (Cloudflare Worker, holds the TMDB token)  →  api.themoviedb.org
```

- The site is static and public. It contains **no keys**; it only knows the Worker's URL (`config.js`).
- The Worker adds the TMDB **API Read Access Token** as a `Bearer` header. The token is a Worker secret, never a file in this repo.
- The Worker only forwards a short list of read-only TMDB endpoints, only answers requests from the origins in `worker/wrangler.toml`, rate-limits each visitor IP, and caches responses.
- Ratings are stored in the visitor's browser (`localStorage`).

## Setup

### 1. Deploy the Worker (once)

You need a free Cloudflare account and your TMDB **API Read Access Token** (TMDB → Settings → API).

```bash
cd worker
npx wrangler login
npx wrangler secret put TMDB_TOKEN     # paste the token when asked
npx wrangler deploy
```

`deploy` prints the Worker URL, like `https://purrama-api.<subdomain>.workers.dev`.

### 2. Point the site at it

- In `config.js`, replace `https://purrama-api.YOUR-SUBDOMAIN.workers.dev` with that URL.
- In `index.html`, narrow the CSP's `connect-src https://*.workers.dev` to that exact URL.
- If the site is served from somewhere other than `https://hawi273.github.io`, add that origin to `ALLOWED_ORIGINS` in `worker/wrangler.toml` and deploy again.

### 3. Publish

Push to the branch GitHub Pages builds from. The site is served from the repo root.

## Run it locally

```bash
cd worker
echo "TMDB_TOKEN=<your token>" > .dev.vars   # git-ignored
npx wrangler dev                              # API on http://localhost:8787
```

In another terminal, from the repo root:

```bash
npx serve -l 8000 .
```

Open http://localhost:8000. `config.js` uses the local Worker automatically.

## Keeping the token secret

- Never put the token in `config.js`, `app.js` or any other file the site serves, and never commit `.dev.vars` or `.env` (both are in `.gitignore`).
- Turn on **secret scanning** and **push protection** in GitHub → Settings → Code security.
- If the token is ever committed or shared, regenerate it on TMDB right away: deleting the commit is not enough.

## Attribution

TMDB's terms require crediting TMDB. The footer does this in text; add TMDB's official logo from their [logos page](https://www.themoviedb.org/about/logos-attribution) as well.
