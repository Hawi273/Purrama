# Purrama: brief for AI tools

> Copy everything below the line into Claude, ChatGPT, v0, Cursor, Lovable, Midjourney (the visual parts) or any other AI tool before asking it to design or build something for Purrama. If the tool accepts files, also attach `css/purrama.css` and one file from `templates/`.

---

You are designing for **Purrama**, a web app where movie nerds rate films they've watched and check basic film info (year, runtime, genre, director, cast). Follow this brand exactly.

**Feel:** cozy, intuitive, fluid. A late-night movie den: soft round shapes, a deep night-green room, one warm amber lamp. Playful in tone, serious about clarity. Style name: "Midnight Cushion", soft cushions with thick marker outlines and hard offset shadows (soft neobrutalism).

**Colours (dark theme, default):** page `#0D1714`; cards `#15231E`; insets `#1D3029`; outline `#050A08`; dividers `#2A4038`; text `#ECF3EE`; secondary text `#9DB3A8`; brand bottle green `#1F6B4F` (white text on it); selected/hover green `#2E7D5B`; accent moon amber `#E8B65A` (text `#0D1714` on it); cream `#F3E9D2` and blush `#E39A86` for illustration only.
**Light theme ("Daylight"):** page `#F6F1E6`, cards `#FFFCF5`, insets `#EDE5D3`, text and outlines `#0E2A20`, secondary text `#4A5F55`. Green and amber unchanged.
**Colour rules:** green is the brand; amber is rare (one primary button per screen, rating stars, highlights). No gradients, glows, glassmorphism or blur. Body text ≥ 4.5:1 contrast.

**Type:** Fredoka SemiBold (600) for headings, titles, the wordmark and big numbers; Nunito for everything else (400 reading, 700–800 labels and buttons). Scale: 64 / 48 / 32 / 24 / 20 for headings; 17 / 15 for body; 14 for meta; 13 for chips. Sentence case everywhere. Wordmark always lowercase: "purrama".

**Shape:** everything on the page has a 2.5px outline in the outline colour. Raised things cast a HARD offset shadow with no blur: cards `6px 6px 0 #1F6B4F`, the one hero card `8px 8px 0 #1F6B4F`, buttons and posters `4px 4px 0` in the outline colour. Radius 22px for cards, 28px for the hero card, fully round pills for buttons, chips and search, 14px for small thumbnails and inputs. Pressed buttons move 3px down-right into their shadow. Spacing scale 4/8/12/16/24/32/48/64; card padding 24; 24px+ between shadowed elements.

**Components to use:** pill buttons (primary amber, secondary green, quiet outlined); outlined pill chips; pill search field with a magnifier icon; cards; 2:3 posters with outline; rating as five rounded amber stars with an outline (whole stars only); film rows (small poster, title in Fredoka, "year · director" meta, stars on the right); an app bar with the cat badge logo, the lowercase wordmark, nav and search. If `purrama.css` is available, use its classes (`pr-btn pr-btn--primary`, `pr-card`, `pr-chip`, `pr-film-row`, `pr-stars`, `pr-appbar`, `pr-poster`, `pr-search`) instead of inventing styles.

**Icons:** simple line icons, 2.2px stroke, round caps, 24px grid. No emoji in the UI.

**Logo:** a bottle-green rounded-square badge with a curled-up sleeping cream cat and an amber crescent moon. No text in it. Never redraw or recolour it; use the supplied file.

**Mascot: Mochi.** The logo's cat, awake and sitting up (cream fur, green outline, two green back stripes, pink cheeks). Use at most one per screen, only in empty states, loading, success, errors or a hero. Available moods: idle, blink, sleep, tail swish, wave, curious, happy hop, star burst (after rating), love, look around, loading, peek-a-boo, sad, popcorn, stargazing. Don't invent new outfits or props.

**Voice:** warm, brief, a little sleepy-cat, like a friend who loves films. Buttons are verbs ("Rate this film", "Add to watchlist"). Errors say what to do next ("No films match "zzzz". Try a title or a director."). Film meta reads `2001 · 2h 5m · Animation, Fantasy`. No cat puns in every line.

**Accessibility:** real buttons, links and inputs with labels; visible 3px focus ring (amber on dark, green on light); touch targets ≥ 44px; respect reduced motion.

**Before you finish, check:** night-green or cream ground, no gradients · one amber action · outlines plus hard green shadows · Fredoka headings, Nunito text, sentence case · at most one Mochi · logo untouched.
