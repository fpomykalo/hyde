# Assets

Everything the site renders but doesn't ship with. Drop files in at the paths
below, keeping the **exact filenames** — the page already points at them.

Any slot whose file is missing renders as a labelled dashed box at the correct
dimensions, so you can see at a glance what's still outstanding. Nothing breaks
while a file is absent, and nothing needs changing in the code once it lands.

Sizes are the Figma dimensions at 1x. **Export raster images at 2x** (the page
draws them at the 1x box). SVGs should be exported with no fixed `fill` on the
paths where a colour is noted, or in the noted colour.

---

## `fonts/`

New Science and Neue Montreal are licensed and aren't on any CDN, so they have
to be self-hosted. Until they're here the page falls back to Helvetica/Arial —
the layout is correct but the letterforms and line breaks are not.

| File | Notes |
|---|---|
| `NewScience-Medium.woff2` | Display face — all section headings and the hero |
| `NeueMontreal-Regular.woff2` | Body face — paragraphs, card titles, nav-adjacent copy |

IBM Plex Mono (Regular + Medium) is pulled from Google Fonts in `index.html`.
Swap that `<link>` for local `@font-face` rules if you'd rather self-host it.

## `logo/`

| File | Size | Notes |
|---|---|---|
| `hyde-logo-white.svg` | 105 × 31 | Full lockup (mark + wordmark), **white**. Shown over the dark hero. |
| `hyde-logo-black.svg` | 105 × 31 | Same lockup, **black**. Shown over every light section. |
| `campfire-mark.svg` | 72 × 43 | The pixel-fire glyph beside the "Campfire" heading |
| `hyde-mark-outline.svg` | 191 × 220 | Large isometric mark, footer bottom-left (light grey in the design) |
| `hyde-wordmark-outline.svg` | 632 × 254 | Large "Hyde" wordmark, footer bottom-right (light grey) |

Both logo colourways are needed — the nav cross-fades between them as the
background under the bar changes.

## `backgrounds/`

| File | Size |
|---|---|
| `hero.png` | 1440 × 900 |

## `partners/` — hero strip, **white** logos on transparent

| File | Size |
|---|---|
| `palantir.svg` | 85 × 20 |
| `nvidia.svg` | 106 × 20 |
| `bain.svg` | 155 × 17 |
| `aws.svg` | 43 × 26 |
| `general-catalyst.svg` | 132 × 17 |
| `bcv.svg` | 94 × 17 |

Extra logos just get added to the track in `index.html` — the strip is a
marquee, so the row keeps its seven fixed cells however many logos there are.

## `careers/` — "built by the top minds" strip, **black** logos on transparent

| File | Size |
|---|---|
| `palantir.svg` | 85 × 20 |
| `optiver.svg` | 93.5 × 19.42 |
| `deepmind.svg` | 144 × 18 |
| `tower.svg` | 84.87 × 17.26 |
| `mckinsey.svg` | 99.25 × 30.92 |
| `kkr.svg` | 63.54 × 15.39 |

## `two-paths/`

| File | Size |
|---|---|
| `training-rig.jpg` | 641 × 500 |
| `embedded-team.jpg` | 640 × 500 |

## `campfire/`

Each tab is an HTML animation with its own background. The page loads the
`.html` in an iframe when its tab first opens; the `.jpg` shows until then and
stays if the `.html` isn't there yet, so you can add the stills first and the
animations later.

The animation should fill 959 × 598 and paint its own background — no
transparency, no scrollbars, no margin on `body`.

| Tab | Animation | Still |
|---|---|---|
| 1.0 Infrastructure | `01-infrastructure.html` | `01-infrastructure.jpg` (959 × 598) |
| 2.0 Training | `02-training.html` | `02-training.jpg` |
| 3.0 Evals | `03-evals.html` | `03-evals.jpg` |
| 4.0 Learning | `04-learning.html` | `04-learning.jpg` |

The `+ …` caption lines sit on top of the animation in white, bottom-left, so
keep that corner reasonably dark.

## `industries/`

| File | Size |
|---|---|
| `financial-services.jpg` | 524 × 500 |
| `retail-cpg.jpg` | 524 × 500 |
| `defense.jpg` | 524 × 500 |

Figma draws four pagination dots but only three industries exist in the file.
Send the remaining industry (or industries) — copy, tags, image, link — and
they slot straight in; the carousel derives its dots from the content.

## `blog/`

| File | Size |
|---|---|
| `manifesto.jpg` | 641 × 500 |
| `great-migration.jpg` | 640 × 500 |

## `certifications/`

| File | Size |
|---|---|
| `soc2.svg` | ~80 × 33 |
| `hipaa.svg` | ~70 × 33 |
