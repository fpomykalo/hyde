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

## Still missing

- **Blog card images** — `photos/blog-manifesto.jpg` and
  `photos/blog-great-migration.jpg` (641 × 500 and 640 × 500 boxes). These are
  the only two slots still rendering as labelled placeholders.
