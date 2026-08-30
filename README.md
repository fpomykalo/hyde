# Hyde — website

Desktop build (v01) of the Hyde marketing site, from the Figma file
*Hyde — Web* › page **Page 4.2** › frame **Desktop** (1440 × 5505).

Static HTML, CSS and vanilla JS. No build step, no dependencies — open
`index.html`, or serve the folder:

```sh
npx http-server -p 8080 .
```

## Layout

The Figma canvas is kept 1:1. The page is a fixed 1440px column, each section
is a block of the exact height Figma gives it, and elements inside a section are
positioned at their exact offset from that section's top-left corner. Section
tops therefore land on the Figma y-coordinates:

| Section | Top | Height |
|---|---|---|
| Hero | 0 | 900 |
| Two Paths to Specialist AI | 1053 | 623 |
| Campfire | 1725 | 776 |
| Industries | 2550 | 651 |
| Careers | 3251 | 592 |
| Blog | 3893 | 662 |
| Footer | 4605 | 900 |

Two details make the numbers line up exactly, and both are worth knowing before
editing:

- **Text is cap-height trimmed** (`text-box-trim`), the way Figma measures it.
  A `top` value is the top of the capital letters, not the top of the line box.
  `text-box-trim` doesn't apply to flex containers, so chips, buttons and nav
  items set an explicit cap-height `line-height` instead.
- **Outlines are inset shadows, not borders.** Figma draws strokes inside the
  frame; a CSS border would add 2px to every chip and button, and would shift
  the children of every bordered block 1px in. Blocks that contain positioned
  children draw their hairline as a `::after` ring for the same reason.

## Files

```
index.html          markup for the whole page
styles/tokens.css   colours, type stacks, canvas metrics, motion
styles/main.css     layout and components
scripts/main.js     nav theme, reveals, campfire tabs, carousel, marquees
assets/             artwork — see assets/README.md
```

## Behaviour

**Hero** — the logo, nav, top rule and "your model. your weights. your
advantage." are present on load. "Stop Renting", "Intelligence.", the lede and
the partner strip then rise and fade in, in that order. Sections below the fold
use the same treatment as they scroll into view.

**Nav** — fixed, with two colourways. Sections carry `data-bg="dark"` or
`"light"`, and whichever sits under the middle of the bar decides the theme, so
the logo flips black/white with the background rather than at one hardcoded
scroll offset. Adding a dark section later needs nothing but the attribute.

**Logo strips** — the seven-cell frame is fixed; the logos drift through the
masked area behind it, cloned so the loop has no seam. The hero drifts left, the
careers strip right. Both pause on hover. Add logos by adding tiles.

**Campfire** — four tabs, 7s each. The black bar fills the grey track as you
read, then the next tab opens. Clicking a tab jumps to it and restarts its
timer. The timer only runs while the section is on screen. Each illustration is
an HTML animation loaded on first open, with a still as fallback.

**Industries** — a carousel: chevrons appear only where there's somewhere to go,
dots jump to a card, and the track can be dragged. Pages are derived from the
reachable scroll positions, so adding industries adds pages.

**Cards** — Two Paths, Industries and Blog share one hover: the overlay darkens,
the artwork scales to 1.0857, and on the Two Paths cards the chip goes solid
white and the CTA goes solid accent, per the Figma component variants.

Everything respects `prefers-reduced-motion`.

## Not in this build

Mobile. The Figma file has a 393px frame; this build is desktop only, per
scope. Sections are ordinary blocks in normal flow, so a mobile pass restacks
them without touching the desktop geometry.
