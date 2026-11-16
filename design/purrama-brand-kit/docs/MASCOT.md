# Mochi, the Purrama mascot

Mochi is the sleeping cat from the logo, awake and sitting up: cream fur, a bottle-green outline, green stripes and rosy cheeks. He has **15 looping animations**. Open `templates/mascot-gallery.html` to see them all moving.

## Two ways to use him

### A. On a website, as inline SVG (best)
Paste the contents of `assets/mascot/mochi-rig.svg` into your HTML and load `css/purrama.css`. The animation is **one class on the `<svg>`**:

```html
<svg class="pm pm--wave" viewBox="0 0 240 240" width="160" height="160" role="img" aria-label="Mochi waving hello">…</svg>
```

Change it any time from code:

```js
Purrama.mochi(document.querySelector('#hello-cat'), 'hop');   // needs js/purrama.js
// or: el.setAttribute('class', 'pm pm--hop');
```

Inline Mochi follows the theme. For example, his Zzz text turns dark in Daylight.

### B. Anywhere else, as a self-contained file
`assets/mascot/animated/mochi-<name>.svg`: 15 files with their animation built in. They animate as an `<img>` in any browser, in email clients that support SVG, and in Notion. Design tools (Figma, Canva, Keynote) show them as a still. These files use fixed colours that work on both dark and light backgrounds.

```html
<img src="assets/mascot/animated/mochi-sleep.svg" width="160" height="160" alt="Mochi asleep">
```

## The 15 animations

| Class / file | What he does | Use it for |
| --- | --- | --- |
| `pm--idle` · mochi-idle.svg | breathes, blinks, slight head bob | default resting state |
| `pm--blink` · mochi-blink.svg | quick double blink | hover on a card, tiny reactions |
| `pm--sleep` · mochi-sleep.svg | eyes closed, dozing, floating Zzz | empty watchlist, night mode, "nothing new" |
| `pm--tail` · mochi-tail.svg | tail swish | footer, about page |
| `pm--wave` · mochi-wave.svg | raises a paw and waves | welcome, sign in, onboarding |
| `pm--curious` · mochi-curious.svg | head tilt with a bobbing "?" | no search results, help, unknown film |
| `pm--hop` · mochi-hop.svg | squash-and-stretch hop | success, saved, signed up |
| `pm--rated` · mochi-rated.svg | stars pop around him | right after rating a film |
| `pm--love` · mochi-love.svg | blushes, hearts float up | added to favourites |
| `pm--look` · mochi-look.svg | eyes dart left and right | while a search runs |
| `pm--loading` · mochi-loading.svg | three amber dots bounce over his head | fetching films |
| `pm--peek` · mochi-peek.svg | rises from the bottom edge and ducks back | 404, page corners, easter eggs |
| `pm--sad` · mochi-sad.svg | head droops, a tear falls | errors, offline, "couldn't save" |
| `pm--popcorn` · mochi-popcorn.svg | munching, kernels pop from a bucket | now playing, "watch tonight" |
| `pm--night` · mochi-night.svg | gazes up at a glowing moon and twinkling stars | hero banners, late-night picks |

## Sizes

| Where | Size |
| --- | --- |
| Toasts, inline rows, buttons | 48–80px |
| Cards, loading blocks | 96–140px |
| Empty and error states | 140–200px |
| Hero banners, 404 pages | 220–320px |

## Rules

1. **One Mochi per screen.** He's a moment, not decoration.
2. **Match the animation to the feeling.** Don't use the happy hop on an error.
3. **Give him words for screen readers.** `role="img"` plus an `aria-label` that says what he's doing. If he's beside text that already says it, use `aria-hidden="true"` instead.
4. **Reduced motion is automatic.** When a visitor's system asks for less motion, Mochi stands still.
5. **Don't change him.** No new colours, outfits, props, poses, redraws, or putting him inside the logo badge. If you need a new pose, add it to the design system first so it stays consistent.
6. **Peek needs a cropped container.** Put `pm--peek` inside a box with `overflow: hidden` and a bottom edge so he rises from behind it.
