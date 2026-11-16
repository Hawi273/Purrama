# Using the kit, tool by tool

Pick the section for what you're making. Each one is self-contained.

---

## 1. A plain website (HTML/CSS)

1. Copy `css/`, `js/` and `assets/` into your project.
2. In every page's `<head>`:
   ```html
   <link rel="stylesheet" href="css/purrama.css">
   <link rel="icon" href="assets/logo/purrama-logo.svg">
   ```
3. Put `class="pr-root"` on `<body>` (or your page wrapper). It sets the background, text colour and font.
4. Build with the components in `docs/COMPONENTS.md`. Every class starts with `pr-` (components) or `pm-` (mascot).
5. Optional: add `<script src="js/purrama.js"></script>` before `</body>` for working star ratings, toggle chips, `Purrama.setTheme()` and `Purrama.mochi()`.

**Theme:** Midnight (dark) is the default. For light, add `data-theme="daylight"` to `<html>`, or to any wrapper to make just that part light.

**Starting fast:** copy a file from `templates/` (for example `templates/film.html`) and change the content. See `docs/TEMPLATES.md`.

## 2. React, Vue, Svelte, Next.js and similar

- Import the stylesheet once at the app root: `import './css/purrama.css'`.
- Use the same class names (`className="pr-btn pr-btn--primary"` in React).
- Wrap them in your own components, for example a `<Button variant="primary">` that renders `pr-btn pr-btn--primary`. Keep the class names; don't restyle them.
- For Mochi, turn `assets/mascot/mochi-rig.svg` into a component that takes an `anim` prop and sets `className={"pm pm--" + anim}` on the `<svg>`. (In JSX, rename `class` → `className` and the dashed SVG attributes to camelCase, e.g. `stroke-width` → `strokeWidth`.)
- `purrama.js` is optional. In a framework, write the star and chip behaviour in your own state instead.

## 3. Tailwind CSS

1. Load `css/purrama-tokens.css` globally (the CSS variables live there, so theme switching still works).
2. In `tailwind.config.js`:
   ```js
   module.exports = {
     presets: [require('./tokens/purrama.tailwind.js')],
     content: ['./src/**/*.{html,js,jsx,ts,tsx,vue,svelte}'],
   };
   ```
3. Use it: `bg-surface-100 text-text-primary border-edge border-edge rounded-lg shadow-card font-display`.
4. For the full component styles, also load `css/purrama-components.css`. You can mix its `pr-` classes with Tailwind utilities.

## 4. SCSS / Sass

`@use 'tokens/purrama' as p;` then `background: p.$surface-100;`. Light-theme values end in `-day` (`p.$surface-000-day`). For runtime theme switching, prefer the CSS variables in `purrama-tokens.css`.

## 5. Figma

1. Install the fonts **Fredoka** and **Nunito** on your computer from Google Fonts.
2. Install the free **Tokens Studio for Figma** plugin, then import `tokens/purrama.dtcg.json`. You get two colour sets (`color` = Midnight, `color-daylight` = Daylight), plus spacing, radius, border width and shadows.
3. Or set up by hand: create colour styles from the table in `PRINCIPLES.md`, and text styles from its Typography table.
4. Build the signature look in Figma: stroke **2.5px, inside**, colour `edge`; drop shadow **X 6, Y 6, blur 0, spread 0, 100% opacity**, colour `#1F6B4F` (cards) or the edge colour at X 4, Y 4 (buttons).
5. Logo: drag in `assets/logo/purrama-logo.svg`. Mochi: drag in any file from `assets/mascot/animated/` (Figma shows the first frame as a still).
6. For reference, open the `templates/*.html` files in a browser and screenshot them, or use an HTML-to-Figma plugin.

## 6. Non-code tools: Canva, Keynote, PowerPoint, Google Slides, social posts, posters

1. **Fonts:** Fredoka (headings) and Nunito (text). Canva and Google Slides both have them built in. For Keynote and PowerPoint, install them first.
2. **Colours:** add these to your brand palette in this order: `#0D1714` `#15231E` `#1F6B4F` `#2E7D5B` `#E8B65A` `#ECF3EE` `#9DB3A8` `#F3E9D2`. For light layouts use `#F6F1E6` `#FFFCF5` `#0E2A20` `#4A5F55`.
3. **The look:** dark night-green background, rounded rectangles with a dark outline, and a solid offset "shadow" made by duplicating the shape in bottle green and moving it 6px right and 6px down behind the original. No blur, no gradients.
4. **Logo:** `assets/logo/purrama-logo.png` (or the SVG where the tool supports it).
5. **Mochi:** `assets/mascot/animated/*.svg` are animated in browsers. For tools that only take still images, open one in a browser and screenshot it, or ask for PNG exports. In Keynote and PowerPoint, SVGs import as stills.
6. **Slides:** one idea per slide, a big Fredoka heading, short Nunito text, and amber for the single most important number or call to action.
7. **Social posts:** night-green background, one card with outline and green shadow, Mochi in the corner, and the logo bottom-right with clear space.

## 7. Print (flyers, stickers, merch)

- Use the **Daylight** palette for paper (cream `#F6F1E6`, ink `#0E2A20`) unless the piece is meant to be dark.
- Keep the outlines thick: 2.5px on screen is about 1pt in print.
- Convert colours with your printer's profile. Green `#1F6B4F` and amber `#E8B65A` are the two that must look right, so ask for a proof.
- Logo minimum: 10mm.

## 8. Another AI tool (Claude, ChatGPT, v0, Cursor, Lovable…)

Paste the whole of `docs/AI-BRIEF.md` at the start of the conversation, and attach `css/purrama.css` and a template if the tool accepts files. Ask it to "follow the Purrama brief". Then check its output against the checklist at the end of `PRINCIPLES.md`.

---

## Keeping things in sync

The source of truth is the Purrama design system in Claude Design. `tokens/purrama.tokens.json` mirrors it. If you change a colour or size, change it there, export a fresh kit, and replace this folder. Don't hand-edit hex values in several places.
