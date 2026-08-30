# Assets

The folder structure here is the source of truth — the site points at these
paths, rather than the files being renamed to suit the code. If you re-export
from Figma over the top of these, nothing needs changing.

## What's here

| Folder | Contents |
|---|---|
| `fonts/` | `NeueMontreal-Regular.otf`, self-hosted (see below) |
| `gradients/` | `1.jpg`–`6.jpg`, 2400 × 1792 — grounds for the Campfire tabs |
| `illustrations/` | Static diagram SVGs, plus `animations HTML/` (the live versions) |
| `photos/` | 2400 × 1792 photography for the cards |
| `vectors/` | Logo lockups, marks, arrows, ellipses |
| `vectors/logos/` | Partner / employer / certification logos, `-black` and `-white` pairs |
| `videos/` | `hero-video.mp4` plus `hero stills/` |

## Fonts

Two of the three are wired up here; the third is not a file at all.

- **New Science** — Adobe Fonts, loaded over the network from
  `https://use.typekit.net/wvh4zss.css` (linked in `index.html`). The family
  name Typekit publishes is `new-science`, Medium is weight 500. Nothing to
  put in this folder.
- **Neue Montreal** — self-hosted from `fonts/NeueMontreal-Regular.otf`.
  Converting it to `.woff2` would cut it from ~40 KB to ~20 KB and is better
  supported; the OTF works fine in the meantime.
- **IBM Plex Mono** — Google Fonts, Regular + Medium, linked in `index.html`.

`JetBrains Mono` is also pulled from Google Fonts — the campfire diagram
labels use it, per the animation files.

## Campfire tabs

Each tab is a gradient with a white line-art animation centred on it:

| Tab | Gradient | Animation |
|---|---|---|
| 1.0 Infrastructure | `gradients/6.jpg` | `01-cloud-topology` |
| 2.0 Training | `gradients/1.jpg` | `02-run-selection` |
| 3.0 Evals | `gradients/3.jpg` | `03-reward-curves` |
| 4.0 Learning | `gradients/5.jpg` | `04-run-progress` |

**The gradient pairings are a best guess** matched against the Figma reference
render — six gradients were supplied for four tabs, with no numbering to say
which goes where. To re-pair one, change the number in its `<img
class="campfire__gradient" src="assets/gradients/N.jpg">` in `index.html`.
`2.jpg` and `4.jpg` are currently unused.

The four animations are inlined into `index.html` rather than iframed, as their
own README recommends when several share a page; their keyframes are collected
in `styles/diagrams.css`. **If you re-export the animations, those two need
regenerating together** — say the word and it's a two-minute job.

The static `illustrations/*.svg` files aren't referenced; the animated versions
supersede them. They're kept as a fallback.

## Compression

Everything here has been re-encoded for the web. The originals are not kept in
the working tree — they are in git history at commit `950c97b`, recoverable
with `git checkout 950c97b -- assets/`.

**Video** — the source was 1664 x 1248, 24fps, 11s, 13.9 Mbps, with a 316 kbps
AAC track the page never plays (the element is muted). Audio stripped, then
encoded twice; the browser takes the first it supports:

| File | Encode | Size |
|---|---|---|
| `hero-video.webm` | VP9, CRF 34, `-b:v 0` | 780 KB |
| `hero-video.mp4` | H.264 high, CRF 24, `-preset slow`, `+faststart` | 2.9 MB |

Both measure SSIM 0.97 against the source, which is past the point of visible
difference. `+faststart` puts the index at the head of the mp4 so it starts
playing before it has finished downloading. Full frame is kept rather than
cropped to the hero's 16:10 window, so changing the hero height later doesn't
need a re-encode.

**Stills** — resized to roughly 2x the largest box each is drawn into, then
JPEG re-encoded (progressive, optimized):

| Set | Size | Quality | Result |
|---|---|---|---|
| `photos/` | 1400 x 1045 | 82 | 3.1–3.5 MB → 220–290 KB each |
| `gradients/` | 1600 x 1195 | 80 | ~1 MB → 190–260 KB each |
| `videos/hero stills/` | 1664 x 1242 | 80 | 0.7–1 MB → 137–210 KB |

First paint went from **43.4 MB to 3.3 MB**. Re-run the same settings after any
re-export, or ask and it'll be done.

## Still missing

- **Blog card images** — `photos/blog-manifesto.jpg` and
  `photos/blog-great-migration.jpg` (641 × 500 and 640 × 500 boxes). These are
  the only two slots still rendering as labelled placeholders.
