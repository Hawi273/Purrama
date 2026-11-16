# Page templates

Seven ready-made pages in `templates/`, plain HTML that opens straight in a browser. They use only `css/purrama.css`, `css/templates.css` and the optional `js/purrama.js`. Every page works from phone width up to desktop.

| File | What it is | Mochi |
| --- | --- | --- |
| `home.html` | Home / discover: welcome banner, films waiting for your rating, fresh picks, recent ratings, watchlist card, footer | stargazing, popcorn, tail |
| `film.html` | Film page: poster, chips, synopsis, **working star rating**, watchlist and favourite, voice cast, notes, details, "More like this" | reacts to your rating |
| `search.html` | Search results: big search field, genre and decade filters, sort, results with rate buttons | look around |
| `ratings.html` | Profile / my ratings: header, list tabs, star filters, rated films, watchlist card, top genres | sleep |
| `sign-in.html` | Sign in: email, password, forgot password, create account | wave |
| `onboarding.html` | Step 2 of 3: pick favourite genres (chips toggle with `purrama.js`) | curious |
| `states.html` | Every "nothing here / waiting / went wrong" screen: 404, no results, empty list, error, loading skeleton, rate dialog, "Rating saved" toast | peek, curious, sleep, sad, loading, star burst |
| `mascot-gallery.html` | All 15 Mochi animations, labelled | all |

## How to adapt a template

1. **Copy** the file and keep the `<head>` links (adjust the `../` paths if you move it).
2. **Swap the content.** The films, years and directors are real, so the pages look believable. Anything the app fills in for the user is in brackets, such as `[Your name]` and `[n] films rated`.
3. **Swap the placeholders.** Coloured poster blocks (`<div class="pr-poster …">`) become `<img class="pr-poster" src="…" alt="…">`.
4. **Keep the structure:** one hero card, one amber button, rows stacked with 16px gaps, sections 48px apart.
5. **Theme:** add `data-theme="daylight"` to `<html>` to see any page in the light theme.

## Notes for developers

- The templates are static markup with no framework. Turn repeated blocks (film tile, film row, app bar) into components in your stack.
- The `pt-` classes in `css/templates.css` are small layout helpers (form fields, tile layout, section headings). Use them or replace them; they're not part of the core system.
- Interactive behaviour (stars, chip toggles) comes from `js/purrama.js`. In a real app, replace it with your own state handling and API calls.
- Form fields are real `<label>` + `<input>` pairs; keep them that way.
