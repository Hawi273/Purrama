# Purrama — Brand Principles

Read this before you design anything. The colours and fonts are the easy part. These principles are what make something *feel* like Purrama.

---

## The idea in one line

**A cushion with a marker outline.** Purrama is a cozy late-night movie den: soft round shapes, a deep night-green room, one warm lamp (amber), and a sleepy cat who notices everything. Underneath the softness it's confident and graphic, with thick outlines and hard shadows, never blurry or wishy-washy.

## The five principles

### 1. Cozy, not cute
Warm and friendly, but grown-up. Movie nerds take films seriously, so we're playful in tone and serious about clarity. One cat, one joke, then get out of the way.

- ✅ "Your watchlist is napping." ✅ "This page wandered off."
- ❌ "Purr-fect!!" ❌ cat puns in every button ❌ paw prints as decoration

### 2. Intuitive: one obvious next step
Every screen has one primary action, and it's the only amber button on it. If you can't tell what to press in two seconds, there's too much on the screen.

### 3. Fluid: calm motion, soft edges
Things move gently and settle: a button sinks into its shadow, Mochi breathes. No spinning, flashing or bouncing for no reason. Motion always respects the visitor's reduced-motion setting.

### 4. Green is the brand, amber is the spark
Bottle green carries the identity. Amber is rare and precious: the main button, the rating stars, the moon. If amber is everywhere it means nothing.

### 5. Outline + hard shadow on everything that sits on the page
Cards, buttons, chips, posters and inputs all get the 2.5px outline. Things that are *raised* (cards, buttons, posters) cast a solid, unblurred offset shadow. This is the single most recognisable part of the style; without it, it's just a dark green website.

---

## Colour

| Name | Hex | Role |
| --- | --- | --- |
| Night (`surface-000`) | `#0D1714` | page background, dark theme |
| Moss panel (`surface-100`) | `#15231E` | cards, panels, bars |
| Inset (`surface-200`) | `#1D3029` | wells, chips, poster placeholders |
| Bottle green (`brand`) | `#1F6B4F` | the brand; logo badge; card shadows; secondary buttons |
| Stripe green (`brand-soft`) | `#2E7D5B` | selected states, hover |
| Moon amber (`accent`) | `#E8B65A` | primary button, stars, the one highlight |
| Mist (`text-primary`) | `#ECF3EE` | text on dark |
| Sage grey (`text-secondary`) | `#9DB3A8` | secondary text on dark |
| Ink edge (`edge`) | `#050A08` (dark) / `#0E2A20` (light) | outlines |
| Cream | `#F3E9D2` | the cat's fur; illustration, never UI text on light backgrounds |
| Blush | `#E39A86` | the cat's cheeks; tiny accents only |

**Daylight (light theme):** page `#F6F1E6`, cards `#FFFCF5`, insets `#EDE5D3`, text `#0E2A20`, secondary text `#4A5F55`, outlines `#0E2A20`. Green and amber stay the same.

**Rules**

- Dark (Midnight) is home. Use Daylight for print, documents and bright contexts.
- Text on green is white. Text on amber is Night `#0D1714`.
- Body text must reach 4.5:1 contrast. Every pair above does.
- **No gradients, glows, glass or blur.** Flat fields only.
- Never use red, or any colour outside this table, for decoration. `danger` (`#FF8A7A` dark / `#B3261E` light) is for error messages only.

## Typography

- **Fredoka SemiBold**: headings, film titles, the wordmark, big numbers. Round and friendly.
- **Nunito**: everything else. Regular for reading; Bold and ExtraBold for labels, buttons and chips.

| Style | Font | Size / line height |
| --- | --- | --- |
| Display XL | Fredoka 600 | 64 / 1.0 |
| Display L (film title) | Fredoka 600 | 48 / 1.05 |
| Title | Fredoka 600 | 32 / 1.15 |
| Heading | Fredoka 600 | 24 / 1.2 |
| Card title | Fredoka 600 | 20 / 1.25 |
| Body large | Nunito 400 | 17 / 1.65 |
| Body | Nunito 400 | 15 / 1.6 |
| Label / button | Nunito 700 | 15 / 1.2 |
| Meta (year · director) | Nunito 600 | 14 / 1.4 |
| Chip | Nunito 700 | 13 / 1.2 |

- **Sentence case everywhere**: "Rate this film", never "RATE THIS FILM" or "Rate This Film". The only uppercase is small letter-spaced eyebrow labels ("GOOD EVENING").
- The wordmark is always lowercase: **purrama**.
- For slides and posters, scale up but keep the pairing: Fredoka for anything big, Nunito for anything you read.

## Shape

| Thing | Corner radius | Outline | Shadow |
| --- | --- | --- | --- |
| Card, list row, poster | 22px | 2.5px edge | 6px 6px 0 bottle green |
| Hero card (one per page) | 28px | 2.5px edge | 8px 8px 0 bottle green |
| Button | pill (fully round) | 2.5px edge | 4px 4px 0 edge colour |
| Chip, search field | pill | 2–2.5px edge | none |
| Small thumbnail, input | 14px | 2–2.5px edge | none |

- Shadows are **hard**: no blur, offset down and to the right, always the same direction.
- Leave at least 24px between shadowed things, with the extra room on the right and bottom.
- Pressed buttons slide 3px into their shadow.
- Spacing steps: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64**. Card padding is 24, gaps between rows 16, between sections 48.

## Voice and copy

- **Warm, brief, a little sleepy-cat.** Talk like a friend who loves films.
- **Say what to do next.** "No films match "zzzz". Try a title or a director." Not "Error: no results".
- **Film metadata** always follows one pattern: `2001 · 2h 5m · Animation, Fantasy` and `1979 · Ridley Scott`.
- **Verbs on buttons**: Rate this film · Add to watchlist · Save rating · Try again.
- **No emoji in the product UI.** Mochi does the emotional work.

## Iconography

- Line icons: 2.2px stroke, round caps and joins, 24px grid, drawn in the current text colour.
- The **rating star** is the only filled icon: rounded points, amber fill, edge-coloured outline.
- No icon fonts with sharp or overly detailed styles; keep icons as simple as the outlines.

## The logo

The cat badge: a bottle-green rounded square, a curled-up sleeping cat in cream, an amber moon. It has no lettering.

- Use the files in `assets/logo/` as supplied. Never redraw, recolour, stretch, crop, outline or shadow the logo.
- Minimum size is 24px. Leave clear space of a quarter of the badge's width on every side.
- Next to the name, pair it with the lowercase **purrama** wordmark in Fredoka SemiBold.
- It works on both dark and light backgrounds as is, because it's its own green tile.

## Mochi, the mascot

The cat from the logo, awake and sitting up. He's how Purrama shows feelings without words.

- **One Mochi per screen.** He appears in empty states, loading, success, errors and the occasional corner peek. He's never wallpaper.
- Pick the animation that matches the moment (see `docs/MASCOT.md`): wave to welcome, sleep for empty, hop for success, sad for errors, star burst after a rating.
- Sizes: 48–80px inline (toasts, rows), 120–200px for empty states, up to 320px in heroes.
- Don't redraw, recolour, add props or costumes, or put him inside the logo badge.

## Accessibility (non-negotiable)

- Text contrast of 4.5:1 (3:1 for 24px+ and for icons and outlines). Every token pair in this kit passes.
- Every interactive thing is a real button, link or input, with a visible 3px focus ring (amber on dark, green on light).
- Touch targets are at least 44px.
- Mochi gets a real `aria-label` ("Mochi waving hello"), or `aria-hidden="true"` when he's decoration next to text.
- All motion stops when the visitor's system asks for reduced motion. `purrama.css` handles this.

## Quick checklist before you ship anything

- [ ] Night-green (or Daylight cream) ground, no gradients
- [ ] Only one amber button / highlight on the screen
- [ ] Outlines on cards, buttons, chips and inputs; hard green shadows on raised things
- [ ] Fredoka headings, Nunito text, sentence case
- [ ] Copy is warm, short and says what to do next
- [ ] At most one Mochi, with the right animation for the moment
- [ ] Logo untouched, with clear space
- [ ] Contrast and focus states checked
