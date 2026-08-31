# Hyde — website

Desktop build (v01) of the Hyde marketing site, from the Figma file
*Hyde — Web* › page **Page 4.2** › frame **Desktop** (1440 × 5505).

Static HTML, CSS and vanilla JS. No build step, no dependencies — open
`index.html`, or serve the folder:

```sh
npx http-server -p 8080 .
```

## Layout

The body is a fixed 1440px column: each section is a block of the exact height
Figma gives it, and elements inside sit at their exact offset from that
section's top-left corner. At a 1440 x 900 window the whole page is Figma to
the pixel.

| Section | Height | Behaviour |
|---|---|---|
| Hero | 100vh | Content in the column; only the video is full-bleed |
| Two Paths to Specialist AI | 623 | Fixed 1440 column |
| Campfire | 776 | Fixed 1440 column |
| Industries | 651 | Fixed 1440 column |
| Careers | 592 | Fixed 1440 column |
| Blog | 662 | Fixed 1440 column |
| Footer | 100vh | Full-bleed, rearranges |

**Hero** is as tall as the viewport, and the video behind it spans the viewport's
full width at any size. Everything else — logo, nav, headline, subtext, partner
strip — stays at Figma's sizes inside the 1440 column. The content sits in two
groups, one pinned to the top of the hero and one to the bottom, each holding
its exact Figma coordinates; a taller window simply opens more space between
them. At 1440 x 900 it is Figma to the pixel.

**Footer** also fills the viewport, but only the two marks scale. Type keeps its
size and the elements rearrange. The governing measure is `--rb`, the
right-hand block: in Figma it runs 728 to 1360, which is both the combined width
of the three columns and the width of the wordmark. Widen the window and the
block widens, the wordmark grows with it, and the columns stretch to match.

Two details make the numbers line up exactly, and both are worth knowing before
editing:

- **Text is cap-height trimmed** (`text-box-trim`), the way Figma measures it.
  A `top` value is the top of the capital letters, not the top of the line box.
  `text-box-trim` doesn't apply to flex containers, so chips, buttons and nav
  items set an explicit cap-height `line-height` instead.
- **Headings are weight 400, and font synthesis is off.** Neue Montreal ships
  Regular only. Headings default to bold, and a browser asked for a weight it
  doesn't have synthesises one by drawing every glyph twice, slightly offset —
  which reads as doubled, smeared text and runs wider than it should. Figma
  specifies Regular throughout.
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

**Logo strips** — one long box with a fixed outer edge and a fixed label at the
left. Everything right of the label scrolls, and the dividers between logos are
carried on the tiles so they travel with the logos rather than sitting still in
front of them. Tiles are cloned so the loop has no seam. Both strips drift left
at the same speed and pause on hover; direction is the `data-marquee`
attribute on each track (`left` or `right`). Add logos by adding tiles.

**Campfire** — four tabs, 7s each. The black bar fills the grey track as you
read, then the next tab opens. Clicking a tab jumps to it and restarts its
timer. The timer only runs while the section is on screen. Each illustration is
a gradient with its animated diagram inlined over it; the diagrams' keyframes
live in `styles/diagrams.css`.

**Industries** — a carousel: chevrons appear only where there's somewhere to go,
dots jump to a page, and the track can be dragged or swiped. A swipe turns the
page once it passes a quarter of a card, or on any quick flick; drag further and
it lands on whichever card you dragged to. The gesture commits to an axis over
the first 6px, so a vertical scroll that starts on a card scrolls the page. Dots count the positions the
track can actually reach rather than the cards, since the last card can't scroll
to the left edge — four industries give three pages. Adding industries adds
pages.

**Cards** — Two Paths, Industries and Blog share one hover: the overlay darkens,
the artwork scales to 1.0857, and on the Two Paths cards the chip goes solid
white and the CTA goes solid accent, per the Figma component variants.

Everything respects `prefers-reduced-motion`.

## Mobile

Below 900px `styles/mobile.css` takes over, from the Figma frame *Mobile*
(393 × 6353). Each section becomes a flex column with a 16px gutter and a
full-bleed rule between sections, reordered with `order` so the running order
is eyebrow → heading → lede → CTA → content.

What changes beyond type and spacing:

- **Nav** collapses to the logo and a hamburger. Figma draws only the closed
  state, so the open panel is built from the same links: a half-transparent
  white ground with the page blurred behind it, the buttons themselves solid.
- **Campfire** drops the tabs: all four blocks stack, each with its
  illustration full-bleed above its own text.
- **Industries and Blog cards** move their chips, copy and link out from over
  the image into a bordered box beneath it; only the index and title stay on
  the photo. Both become one-card carousels — four dots for four industries,
  two for the two articles.
- **Two Paths cards** keep their text over the image, and hold the desktop
  card's 641:500 ratio by `aspect-ratio` rather than a fixed height, so they
  don't flatten on a phone wider than 393. A full-bleed rule separates the two.
- **Card titles** hang from the foot of the image and grow upward, so a title
  of any depth fills the space above rather than running into the box below.
- **Logo strips** sit inside the gutter with four cells instead of seven, and
  their labels drop to the eyebrow's 10px.
- **Campfire** shows the rule under each title as a plain hairline — there are
  no tabs here, so there is no timer to fill it.
- **Careers** rules run edge to edge between jobs, with the job text padded
  back into the gutter.
- **Footer** fills the viewport and signs off with the full lockup, mark and
  wordmark side by side, as the mobile frame draws it.

See `CLAUDE.md` for the traps in maintaining both layouts from one document.
