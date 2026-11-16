# Purrama Brand Kit

Everything you need to make something that looks and feels like Purrama, in any tool: a website, an app, a slide deck, a social post, a poster, or a prompt for another AI.

**Purrama**: cozy movie ratings for night owls. A web app where movie nerds rate what they watched and check the basics about a film.
**Style name**: Midnight Cushion. Round, outlined shapes with hard offset shadows on a deep night-green ground, lit by one amber spark.
**Three words**: cozy · intuitive · fluid.

---

## Start here (2 minutes)

1. **Open `index.html`** in your browser. It's a one-page overview of the logo, colours, type, components and mascot, with links to everything else.
2. **Read `PRINCIPLES.md`.** It holds the rules that make something look like Purrama and not just *use* its colours.
3. **Then pick what you're making** below.

## What's in the box

```
purrama-brand-kit/
├── index.html                  ← visual overview, open this first
├── README.md                   ← you are here
├── PRINCIPLES.md               ← the brand rules: voice, colour, type, shape, mascot
├── docs/
│   ├── USING-THE-KIT.md        ← step-by-step for web, React/Vue, Tailwind, Figma, Canva, slides, print
│   ├── COMPONENTS.md           ← copy-paste HTML for every component
│   ├── MASCOT.md               ← Mochi: 15 animations and when to use each
│   ├── TEMPLATES.md            ← the 7 page templates and how to adapt them
│   └── AI-BRIEF.md             ← paste into any AI tool so it designs "in Purrama"
├── css/
│   ├── purrama.css             ← ONE file: fonts + tokens + components + mascot
│   ├── purrama-tokens.css      ← just the variables and text-style classes
│   ├── purrama-components.css  ← components + mascot (load after tokens)
│   └── templates.css           ← small helpers used by the templates
├── js/
│   └── purrama.js              ← optional ~1 KB helpers (star rating, chips, theme, mascot)
├── tokens/
│   ├── purrama.tokens.json     ← source of truth (with usage notes for every token)
│   ├── purrama.dtcg.json       ← W3C format for Figma Tokens Studio / Style Dictionary
│   ├── purrama.tailwind.js     ← Tailwind preset
│   └── _purrama.scss           ← SCSS variables
├── assets/
│   ├── logo/                   ← purrama-logo.svg (master), purrama-logo.png (1024px)
│   └── mascot/
│       ├── mochi-rig.svg       ← the inline SVG to paste into web pages (animated by purrama.css)
│       └── animated/           ← 15 self-contained animated SVGs (work anywhere, even as <img>)
└── templates/                  ← 7 page templates + mascot gallery, plain HTML
```

## Fastest possible use (a web page)

```html
<link rel="stylesheet" href="css/purrama.css">
<body class="pr-root">
  <button class="pr-btn pr-btn--primary">Rate this film</button>
</body>
```

That's it: fonts, colours, the outline and the hard shadow all come with the one stylesheet. Add `data-theme="daylight"` on `<html>` for the light theme.

## Not making a web page?

| You're making… | Use |
| --- | --- |
| Slides, social posts, posters, Canva or Keynote | `PRINCIPLES.md` for the rules, the hex values in the Colour table, Fredoka + Nunito from Google Fonts, the logo PNG/SVG, and the animated mascot SVGs (or screenshots of them). See `docs/USING-THE-KIT.md`, "Non-code tools". |
| A Figma file | Import `tokens/purrama.dtcg.json` with Tokens Studio, then follow `docs/USING-THE-KIT.md`, "Figma". |
| A React, Vue or Svelte app | `css/purrama.css` plus the class names in `docs/COMPONENTS.md`. |
| A Tailwind project | `tokens/purrama.tailwind.js` plus `css/purrama-tokens.css`. |
| Something with an AI tool | Paste `docs/AI-BRIEF.md` into the chat first. |

## Fonts

Both are free on Google Fonts:

- [Fredoka](https://fonts.google.com/specimen/Fredoka) SemiBold for headings.
- [Nunito](https://fonts.google.com/specimen/Nunito) Regular, Bold and ExtraBold for everything else.

`purrama.css` loads them automatically when online. For desktop tools (Figma, Canva, Keynote, Word), install them on your computer from those links.

## Version

v1.0 · November 2026. This kit is a snapshot of the Purrama design system in Claude Design. When the system changes, export a new kit and replace this folder, rather than editing values here by hand.
