# Components

All components are plain HTML with classes from `css/purrama.css`. Copy, paste and change the text. Each one works in both themes.

---

## Page wrapper

```html
<body class="pr-root">…</body>                         <!-- dark (Midnight) -->
<html data-theme="daylight"> … <body class="pr-root">   <!-- light (Daylight) -->
```

## Button

```html
<button type="button" class="pr-btn pr-btn--primary">Rate this film</button>   <!-- amber: ONE per screen -->
<button type="button" class="pr-btn pr-btn--brand">Add to watchlist</button>   <!-- green: second action -->
<button type="button" class="pr-btn pr-btn--quiet">Share</button>              <!-- everything else -->
<button type="button" class="pr-btn pr-btn--primary pr-btn--sm">Rate</button>  <!-- 40px tall, for rows -->
<button type="button" class="pr-btn pr-btn--quiet pr-btn--icon" aria-label="Add to favourites">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
</button>
```

Links can look like buttons too: `<a class="pr-btn pr-btn--brand" href="…">`. Hover lifts the button 1px; pressing sinks it into its shadow.

## Chip

```html
<span class="pr-chip pr-chip--accent">2001</span>   <!-- amber: only the release year in a film header -->
<span class="pr-chip">2h 5m</span>
<button type="button" class="pr-chip" aria-pressed="false">Horror</button>   <!-- filter; purrama.js toggles it -->
```

## Search field

```html
<label class="pr-search">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
  <input type="search" aria-label="Search films" placeholder="Search films, people…">
</label>
```

For the invalid state, add `aria-invalid="true"` to the input. The outline turns red; put a helpful message below it.

## Card

```html
<section class="pr-card">
  <h3 class="pr-card__title">Watchlist</h3>
  <p class="pr-card__body">Films you saved for a rainy evening.</p>
</section>

<article class="pr-card pr-card--hero">…</article>   <!-- the ONE big card per page; no padding, 8px shadow -->
```

Don't put a card inside a card. Inside, use `var(--surface-200)` insets and `var(--hairline)` dividers.

## Poster

```html
<img class="pr-poster" src="poster.jpg" alt="Spirited Away poster">             <!-- 170px wide, 2:3 -->
<img class="pr-poster pr-poster--sm" src="poster.jpg" alt="">                   <!-- 48px, for rows -->
<div class="pr-poster pr-poster--brand" role="img" aria-label="No poster"></div> <!-- placeholder tints: --brand, --accent -->
```

Set `style="width: 220px"` to resize; it stays 2:3.

## Rating stars

Display (read-only):

```html
<span class="pr-stars" role="img" aria-label="4 out of 5 stars">
  <span class="is-on"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.2 6.6L12 17.4l-5.8 3.2 1.2-6.6L2.5 9.4l6.6-.8z"/></svg></span>
  <!-- repeat 5×; add class="is-on" to the filled ones -->
</span>
```

Input (works with `purrama.js`):

```html
<span class="pr-stars" role="group" aria-label="Your rating">
  <button type="button" aria-label="1 star"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.2 6.6L12 17.4l-5.8 3.2 1.2-6.6L2.5 9.4l6.6-.8z"/></svg></button>
  <!-- … 2 stars … 5 stars -->
</span>
```

Listen for the rating: `document.addEventListener('purrama:rate', e => save(e.detail.value))`.

Add `pr-stars--sm` for 20px stars in rows. Ratings use whole stars only.

## Film row

```html
<a class="pr-film-row" href="/film/alien">
  <img class="pr-poster pr-poster--sm" src="alien.jpg" alt="">
  <div class="pr-film-row__text">
    <span class="pr-film-row__title">Alien</span>
    <span class="pr-film-row__meta">1979 · Ridley Scott</span>
  </div>
  <span class="pr-stars pr-stars--sm" role="img" aria-label="4 out of 5 stars">…</span>
</a>
```

Stack rows with a 16px gap. Each row is its own cushion, so don't merge them into one box.

## App bar

```html
<header class="pr-appbar">
  <a class="pr-appbar__brand" href="/">
    <img class="pr-appbar__logo" src="assets/logo/purrama-logo.svg" alt="">
    <span class="pr-appbar__wordmark">purrama</span>
  </a>
  <nav class="pr-appbar__nav" aria-label="Main">
    <a href="/films" aria-current="page">Films</a>
    <a href="/ratings">Ratings</a>
    <a href="/watchlist">Watchlist</a>
  </nav>
  <label class="pr-search">…</label>
</header>
```

## Text styles

Use these classes on any element: `display-xl` `display-l` `title` `heading` `card-title` `body-lg` `body` `label` `meta` `chip`. Or use the variables directly: `font-family: var(--font-display)` / `var(--font-body)`.

## Tokens as CSS variables

Colours: `--surface-000/100/200` `--edge` `--hairline` `--text-primary` `--text-secondary` `--brand` `--on-brand` `--brand-soft` `--accent` `--on-accent` `--cream` `--blush` `--cat-ink` `--star-off` `--focus` `--danger`
Space: `--space-1` … `--space-8` (4 → 64px) · Radius: `--radius-sm/md/lg/xl/pill` · Border: `--border-edge` `--border-hair`
Shadow: `--shadow-card` `--shadow-hero` `--shadow-control` `--shadow-pressed`

Every token, with its intended use, is in `tokens/purrama.tokens.json`.
