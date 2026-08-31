# Hyde — working notes

Static HTML/CSS/JS, no build step. Open `index.html` or `npx http-server -p 8080 .`

Source of truth is the Figma file **Hyde — Web**, page *Page 4.2*:
desktop frame `4752:36` (1440 × 5505), mobile frame `4752:386` (393 × 6353).
File key `eoNXhJ9QDTwnSOQf0ae9AX`.

## Files

```
index.html          one document, both layouts
styles/tokens.css   colours, type stacks, viewport metrics
styles/main.css     desktop (the 1440 column)
styles/mobile.css   everything under 900px
styles/diagrams.css keyframes for the four campfire animations
scripts/main.js     nav theme + logo luminance, reveals, campfire tabs,
                    carousels, logo marquees
assets/             see assets/README.md
```

## Things that will bite you

- **Text is cap-height trimmed** (`text-box-trim`), as Figma measures it. A
  `top` is the top of the capitals, not the line box. It does not apply to
  flex containers, so chips, buttons and nav items set a cap-height
  `line-height` instead.
- **Outlines are inset shadows, not borders.** Figma strokes sit inside the
  frame; a border adds 2px to a chip and shifts a bordered block's children.
- **Headings are weight 400 and `font-synthesis-weight: none`.** Neue Montreal
  ships Regular only; asking for bold makes the browser draw every glyph twice.
- **Never switch a wrapper to `position: static` for mobile** if it has
  absolutely positioned children — they escape to the section and stack. Use
  `position: relative; inset: auto;` instead. This caused four separate bugs.
- **`position: relative` needs `inset: auto` with it**, for the mirror reason:
  the desktop rule's `left`/`top` stop being ignored and start applying as
  relative offsets. The hero headline slid 79px across the screen this way.
- **`position: static` un-blockifies.** `.job` is an `<a>`; desktop blockifies
  it by positioning it absolutely, so setting it static on mobile left it
  `display: inline`, where horizontal padding doesn't indent block children
  and a border wraps the text rather than the row. Set `display: block` too.
- **An absolutely positioned sibling paints above in-flow content**, so mobile
  content that used to be positioned must be given `position: relative` and a
  `z-index` — see the hero, where the video covered the headline. A `.reveal`
  masks this until it finishes: its `translateY` makes a stacking context, and
  the text vanishes at the exact moment the transform is cleared.
- **Carousels need `touch-action: pan-y`.** Without it the browser claims a
  horizontal swipe as a scroll and kills the drag with `pointercancel` after
  the first `pointermove`.
- **The hero and footer use `100dvh`**, not `100vh`: on a phone `100vh` is the
  height with the browser chrome retracted, so the foot of the hero sits under
  the URL bar until you scroll.
- **An absolutely positioned background paints above in-flow content.** The
  footer ground is a background on the section, not a positioned child, for
  exactly this reason.
- **A full-section wrapper eats clicks behind it.** `.campfire__body` is
  `inset: 0` so its two halves can be placed into the panel and the stage; as a
  later sibling it covered the tabs and swallowed every click. It carries
  `pointer-events: none`, and `.campfire__pane` / `.campfire__frame` take them
  back.
- **Card offsets live in CSS, not inline styles** — inline `left` beats any
  stylesheet and cannot be undone at a breakpoint.

## Layout model

Desktop is a fixed 1440 column; sections are blocks at their Figma heights with
children absolutely positioned at their Figma offsets. At 1440 × 900 the page
is Figma to the pixel. Two exceptions are viewport-tall: the hero (content
stays in the column, only the video bleeds full width) and the footer (spans
the viewport; only the two marks scale, sized off `--rb`, the right-hand block
that is both the three columns' combined width and the wordmark's width).

Mobile turns each section into a flex column with a 16px gutter and reorders
with `order`, since the running order is eyebrow → heading → lede → CTA →
content. Some markup carries both layouts: `.campfire__item` pairs an
illustration with its text (`display: contents` on desktop so each half lands
in its own box, a block on mobile so they stack), and `.card__info` groups the
chips, copy and link that overlay the image on desktop and sit in a bordered
box beneath it on mobile.

## Verification

There is no test suite. Changes are checked by rendering in headless Chromium
and measuring against the Figma coordinates. Note the sandbox has no network,
so Google Fonts and Typekit do not load there and text metrics fall back —
button widths read 1–2px wide and nothing else should differ.

## Decided

- **AI Natives copy.** Figma's editorial note read "the training control plane
  (or: exoskeleton/workbench)". Resolved to *exoskeleton*.
- **The fixed nav overlaps section headings** when scrolling past them. Figma
  has no nav background and no scrolled state; left as drawn.
- **Campfire tab numbers.** The active tab's index is solid black, the other
  three sit at 30% (`--ink-30`).

## Open

- Figma's mobile frame is inconsistent about the gutter — eyebrows and ledes
  sit at x=16, headings and the Two Paths cards at x=17 (so those cards run
  17/15). The build normalises everything to a 16px gutter; full-bleed items
  (campfire illustrations, the rules between jobs) stay edge to edge as drawn.
- Figma's mobile careers list shows three jobs; the build carries the desktop
  frame's five.
