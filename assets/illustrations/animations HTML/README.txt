HYDE — ANIMATED DIAGRAMS
========================

Four standalone HTML files. Each contains one inline SVG plus its CSS keyframes.
No JavaScript, no build step, no images.

TIMING
  3s animation, 2s hold on the end state, 5s loop (infinite).
  All four share the same 5s clock, so they stay in sync if shown together.

BACKGROUND
  Transparent. Artwork is pure white (#fff) — intended over a gradient/dark bg.

SIZING
  The SVG scales fluidly: width:100%, height auto, capped at its natural width.
  Change or remove the max-width in .hyde-diagram to size it differently.

TYPE
  JetBrains Mono, loaded from Google Fonts (falls back to system monospace).
  Self-host the font if the client prefers no third-party requests.

EMBEDDING SEVERAL ON ONE PAGE
  Copy the <svg> element and the <style> block into the page.
  The internal ids (clip paths, masks) are already namespaced per diagram
  (d1_, d2_, d3_, d4_) so all four can coexist without collisions.
  The @keyframes only need to be included once.

ACCESSIBILITY
  A prefers-reduced-motion rule is included: motion collapses to the end state.

FILES
  01-cloud-topology.html
  02-run-selection.html
  03-reward-curves.html
  04-run-progress.html
