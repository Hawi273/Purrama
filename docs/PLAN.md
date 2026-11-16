# Purrama v2: movie and TV discovery (plan)

Branch: `dev` only. Nothing is merged to `main` or deployed to production by this work.

## Product

Purrama is "cozy movie ratings for night owls": a calm, late-night den for film and TV nerds to find something to watch, keep lists and rate what they saw. v2 grows the v1 trending + search + star ratings page into a full discovery app on genuine TMDB data, in the Purrama "Midnight Cushion" design system.

**Distinctive value:** not another Netflix clone. Purrama is the calm, personal alternative: one clear next step per screen, the user's own lists and ratings front and centre, Mochi (the mascot) for feelings, no autoplay, no infinite noise.

**Primary journeys (priority order)**
1. Open the app → see tonight's featured pick and trending rows → open a title → save it to the watchlist or rate it.
2. Search for anything (movie, series, person) from any screen → preview → open.
3. Browse movies or TV by list (popular, top rated, upcoming / airing today...) or filter by genre, year, rating, sort.
4. Read a title in depth: overview, cast and crew, trailer, seasons and episodes (TV), similar and recommended.
5. Open a person → their credits → another title.
6. Come back to My library: watchlist, favourites, watched, ratings; get recommendations based on it.

**Out of scope for v2:** accounts and sign in (no backend persistence exists; TMDB account login is a later option), reviews and social, streaming availability, offline mode.

## Constraints

- Design: `design/purrama-brand-kit/` is authoritative. Figma screens: `Purrama-Website.figcraft` (Home, Film, Search, My ratings, States). No gradients, glows or blur; outlines + hard shadows; one amber primary action per screen; Mochi at most once per screen.
- TMDB terms: TMDB logo in the app, less prominent than Purrama's; the notice "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB." placed prominently. Never fabricate metadata.
- Security: the TMDB token stays a Cloudflare Worker secret; the browser only knows the Worker URL.
- Deployment: GitHub Pages serves `main` from the repo root with no build ("legacy" Pages). Cloudflare Workers Builds deploys `worker/` from `main`. Keep both working unchanged.

## Architecture

**No-build static SPA, type-checked.** Native ES modules served as-is by Pages. Types in JSDoc, checked by `tsc --noEmit` in strict `checkJs` mode; ESLint; `node:test` unit tests. Dev tooling lives in `package.json` devDependencies only, nothing ships to the browser. A Vite/TS build was rejected because Pages would need an Actions workflow and a settings change on production.

```
index.html                 shell: header, main, footer, mobile tab bar
config.js                  Worker URL (existing)
src/
  main.js                  boot: router, shell, theme
  router.js                hash router (#/movie/603, #/tv/1399/season/2, #/person/287, #/search?q=)
  api/
    types.js               JSDoc typedefs for TMDB responses used
    client.js              request(): Worker base URL, query building, de-duplication of in-flight requests,
                           in-memory LRU cache with TTL, timeout, error normalisation (ApiError)
    tmdb.js                one function per capability (trending, lists, details, credits, seasons, people,
                           multi search, discover, genres, similar, recommendations, videos, images)
    images.js              image URL helpers per size, null fallback
  state/
    library.js             watchlist / favourites / watched / ratings in localStorage (versioned,
                           migrates v1 ratings), change events, cross-tab sync
  ui/                      design-system components (pure functions returning DOM nodes, textContent only)
    dom.js icons.js mochi.js poster-card.js carousel.js stars.js chips.js states.js
    modal.js toast.js title-actions.js
  pages/
    home.js movies.js tv.js discover.js search.js title.js season.js person.js library.js not-found.js
styles/
  purrama.css              the kit's stylesheet, copied unchanged
  app.css                  layout, page and app-specific components built from kit tokens only
assets/                    logo + Mochi rig from the kit; TMDB logo
worker/                    existing Worker; the route allowlist grows to the new read-only endpoints
test/                      unit tests (client, images, library, router) and a Worker test with a fake TMDB
```

**Data flow:** page → `tmdb.js` → `client.js` → Worker (adds token, allowlist, origin check, rate limit, edge cache) → TMDB. Images load directly from `image.tmdb.org`.

**Worker changes (backward compatible, read-only GET only):** add `/tv/*` lists and details, `/tv/{id}/season/{n}`, `/tv/{id}/season/{n}/episode/{e}`, `/person/{id}` (+ `combined_credits`), `/search/multi|tv|person`, `/discover/movie|tv`, `/genre/tv/list`, `/movie/{id}/(images|similar|release_dates)`, `append_to_response` limited to an allowlist; allow the `discover` query parameters (with_genres, primary_release_year, first_air_date_year, vote_average.gte, vote_count.gte, sort_by, with_networks). Raise the per-IP limit to 120/min since a details page now makes several calls.

**Persistence:** `localStorage` only, clearly labelled "Saved in this browser". No cross-device sync is claimed.

**Trailers:** YouTube via `youtube-nocookie.com` in a modal, loaded only on click. CSP `frame-src` allows only that host.

**Fonts:** Google Fonts as the kit does (CSP allows fonts.googleapis.com and fonts.gstatic.com).

## Phases

1. Foundations: tooling, Worker routes + tests, API client, library state, router.
2. Design-system components and the app shell (desktop nav, mobile tab bar, footer with TMDB attribution).
3. Pages: Home → Movies/TV lists with filters → Search → Title details (movie, TV) → Season → Person → Library.
4. Review, browser QA at 375 / 768 / 1440, fix, repeat. Commit and push to `dev`.

## Risks

- TMDB rate limits: each details page needs 1 request using `append_to_response`; client cache + Worker edge cache.
- Locally the app talks to `wrangler dev` (token in the git-ignored `worker/.dev.vars`); production stays on the old Worker until `dev` is merged.
- Hash routing limits SEO; titles and descriptions are set per route; a real fix needs server rendering, out of scope.
