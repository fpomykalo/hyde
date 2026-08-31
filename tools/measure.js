#!/usr/bin/env node
/* ==========================================================================
   Hyde — layout check

     node tools/measure.js            both layouts
     node tools/measure.js desktop    just the 1440 column
     node tools/measure.js mobile     just the 393 frame
     node tools/measure.js fit        just the zoomed band between the two
     node tools/measure.js -v         list what passed as well as what did not

   There is no test suite for a static page, and there is no sensible unit to
   test: what can actually break here is geometry. So this renders the real
   page in headless Chromium at a fixed size and measures it, either against
   the Figma coordinates or against the rule the build is supposed to be
   following. A row is one assertion. Exit code is non-zero if any fails.

   It serves the repo itself on a free port, so nothing needs to be running.
   The only thing it needs installed is Playwright:

     npm install --no-save playwright && npx playwright install chromium

   What it does not cover
   ----------------------
   One engine. Chromium is what measures, so anything only Safari or Firefox
   gets wrong is invisible here — the footer link list closing up after a tap
   was exactly that, and Chromium reports it as correct to this day. It also
   says nothing about colour, type, motion or whether a thing is the right
   thing; it checks that boxes are where they are supposed to be. A green run
   means you have not moved something by accident, which is the mistake this
   page actually invites, and no more than that.

   Reading a failure
   -----------------
   Every expectation below carries the reason it is that number — a Figma
   coordinate, or the rule it encodes. A ✗ means the page and that reason have
   parted company; one of the two is now wrong, and the comment tells you
   which conversation to have. Nothing here is a lint rule, so a failure is
   always worth reading rather than silencing.

   Fonts
   -----
   Two of the three families come over the network (New Science from Typekit,
   IBM Plex Mono from Google), so an offline run falls back and anything sized
   by its own glyph metrics drifts a pixel or so. Rows tagged `font` are the
   ones a glyph decides — button widths, and the legal links, which sit on the
   footer's floor so their y follows their own height. They are checked to 2px
   rather than 0.6, which is the right precision for text across two font
   versions and two rasterisers anyway. The header says which families were
   actually there, so you can tell a real drift from a missing webfont.
   Everything else is box geometry and holds either way.
   ========================================================================== */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* --- Playwright, wherever it happens to live ----------------------------- */

function loadChromium() {
  const tries = [
    'playwright',
    'playwright-core',
    path.join(ROOT, 'node_modules', 'playwright'),
    '/opt/node22/lib/node_modules/playwright',
  ];
  for (const id of tries) {
    try { return require(id).chromium; } catch (e) { /* keep looking */ }
  }
  console.error(
    'Playwright not found. This check needs a browser to measure:\n\n' +
    '  npm install --no-save playwright && npx playwright install chromium\n'
  );
  process.exit(2);
}

/* --- a static server, so the check is one command ------------------------ */

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.otf': 'font/otf', '.json': 'application/json',
};

function serve() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, path.normalize(rel));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ==========================================================================
   Desktop — the 1440 column

   x and y are Figma canvas coordinates, measured from the top-left of .page.
   null means "don't care": widths that only the copy decides, mostly.
   ========================================================================== */

const DESKTOP = [
  // hero
  ['.hero__rule',                       80,   73, 1280,    1, 'Figma'],
  ['.hero__line--one',                  79,  123, null, null, 'Figma'],
  ['.hero__lede',                       80,  684,  423, null, 'Figma'],
  ['.section--hero .logostrip',         80,  820, 1280,   60, 'Figma'],

  // two paths
  ['.section--paths .header-block',     80,  950, 1280,  124, 'Figma'],
  ['.section--paths .h2',              100,  970, null, null, 'Figma'],
  ['.section--paths .eyebrow',         100, 1033, null,   21, 'Figma'],
  ['.paths__card--one',                 80, 1073,  641,  500, 'Figma'],
  ['.paths__card--two',                720, 1073,  640,  500, 'Figma'],
  ['.paths__chip',                     101, 1094, null,   21, 'Figma'],
  ['.paths__title',                    101, 1135, null, null, 'Figma'],
  ['.paths__btn',                      101, 1512, null,   40, 'Figma'],

  // campfire
  ['.section--campfire .header-block',  80, 1622, 1280,  124, 'Figma'],
  ['.campfire__tabs',                   80, 1745, 1280,   54, 'Figma'],
  ['.campfire__panel',                  80, 1798,  321,  600, 'Figma'],
  ['.campfire__stage',                 400, 1798,  961,  600, 'Figma'],
  ['.campfire__pane.is-active .campfire__title',     100, 1819, 288, null, 'Figma'],
  ['.campfire__pane.is-active .campfire__timeline',  100, 1877, 288,    1, 'Figma'],
  // The 1.1/1.2 markers and the copy they label share one wrapper, so the
  // Figma numbers belong to the marker and the paragraph, not the wrapper.
  ['.campfire__pane.is-active .campfire__copy',      100, 1917, 276, null, 'wrapper spans marker + copy'],
  ['.campfire__pane.is-active .campfire__marker',    100, 1919,  40, null, 'Figma'],
  ['.campfire__pane.is-active .campfire__row p',     140, 1917, 236, null, 'Figma'],

  // industries
  ['.section--industries .header-block', 80, 2447, 1280, 124, 'Figma'],
  // 2570, not Figma's 2571: a pixel lower puts the cards' top border beneath
  // the header block's bottom border instead of on it, and two adjacent
  // hairlines read as a 2px rule. Two Paths and Blog already share theirs.
  ['.industries__viewport',             80, 2570, 1280,  500, 'shares the header block border'],
  ['.industries__dots',                691, 3091, null,    7, 'Figma'],

  // careers
  ['.section--careers .header-block',    80, 3148, 1280, 163, 'Figma'],
  ['.careers__cta',                     728, 3241,  260,  40, 'Figma', 'font'],
  ['.section--careers .logostrip',       80, 3310, 1280,  60, 'Figma'],
  ['.careers__list',                     80, 3369, 1280, 371, 'Figma'],

  // blog
  ['.section--blog .header-block',       80, 3790, 1280, 163, 'Figma'],
  ['.blog__cta',                        728, 3883,  225,  40, 'Figma', 'font'],
  ['.blog__card--one',                   80, 3952,  641, 500, 'Figma'],
  ['.blog__card--two',                  720, 3952,  640, 500, 'Figma'],

  // footer
  ['.section--footer',                    0, 4502, 1440, 900, 'Figma'],
  ['.footer__cta-primary',               80, 4598,  208,  40, 'Figma', 'font'],
  ['.footer__cta-secondary',             80, 4653,  155,  40, 'Figma', 'font'],
  ['.footer__col--site',                728, 4598,  200, null, 'Figma'],
  ['.footer__col--company',             944, 4598,  200, null, 'Figma'],
  ['.footer__col--connect',            1160, 4598,  200, null, 'Figma'],
  ['.footer__certs',                    728, 4781,  632, null, 'Figma'],
  ['.footer__mark',                      80, 5125,  191, 220, 'Figma'],
  ['.footer__wordmark',                 728, 5129,  632, 254, 'Figma'],
  // Positioned from the bottom, so y follows the text's own height.
  ['.footer__legal--privacy',            80, 5375, null, null, 'Figma', 'font'],
  ['.footer__legal--terms',             227, 5375, null, null, 'Figma', 'font'],
  ['.footer__legal--sla',               388, 5375, null, null, 'Figma', 'font'],
];

/* ==========================================================================
   Mobile — the 393 frame

   Written as rules rather than coordinates. The mobile frame reflows to any
   phone width, so what matters is the relationship (this is 16px from the
   edge, that is 30px below the thing above it), not an absolute y. Each entry
   is a function returning [label, got, expected] triples, or a single triple.
   ========================================================================== */

const MOBILE = String(function collect() {
  const out = [];
  const t = (label, got, exp, tol) => out.push([label, +Number(got).toFixed(3), exp, tol || 0.6]);
  const R = s => { const e = document.querySelector(s); return e && e.getBoundingClientRect(); };
  const W = document.documentElement.clientWidth;

  // --- the page never scrolls sideways -----------------------------------
  t('document does not overflow sideways', document.documentElement.scrollWidth, W);

  // --- one 16px gutter, everywhere ---------------------------------------
  // Figma's own frame mixes x=16 and x=17 (the Two Paths cards run 17/15);
  // the build normalises to a single 16px gutter.
  [
    '.hero__eyebrow', '.hero__line--one', '.section--paths .h2', '.paths__card--one',
    '.campfire__title', '.campfire__timeline', '.industries__viewport',
    '.industries__card', '.blog__viewport',
    '.footer__cta-primary', '.footer__cols', '.footer__legal--privacy',
    '.logostrip--hero', '.logostrip--careers',
  ].forEach(sel => {
    const r = R(sel); if (!r) return;
    t('gutter left  ' + sel, r.left, 16);
    t('gutter right ' + sel, W - r.right, 16);
  });

  // Buttons are as wide as their label, so only the leading edge is on it.
  ['.careers__cta', '.blog__cta', '.hero__lede', '.section-lede'].forEach(sel => {
    const r = R(sel); if (!r) return;
    t('gutter left  ' + sel, r.left, 16);
  });

  // --- and full-bleed where Figma draws it edge to edge -------------------
  ['.campfire__body', '.campfire__frame', '.careers__list'].forEach(sel => {
    const r = R(sel); if (!r) return;
    t('full bleed left  ' + sel, r.left, 0);
    t('full bleed right ' + sel, W - r.right, 0);
  });

  // --- hero ---------------------------------------------------------------
  // 100dvh, not 100vh: on a phone 100vh is the height with the browser chrome
  // retracted, and the strip ends up under the URL bar.
  t('hero fills the viewport', R('.section--hero').height, window.innerHeight, 1);
  t('logo strip clears the hero foot by the gutter',
    R('.section--hero').bottom - R('.logostrip--hero').bottom, 16);
  // The video is scaled and lifted to the mock's framing; it has to keep
  // covering the frame at every phone size while it does.
  const bg = R('.hero__bg');
  const vid = document.querySelector('.hero__bg video, .hero__bg img').getBoundingClientRect();
  t('hero video still covers the top', vid.top <= bg.top ? 1 : 0, 1);
  t('hero video still covers the foot', vid.bottom >= bg.bottom ? 1 : 0, 1);

  // --- logo strips --------------------------------------------------------
  // The tile kept its desktop 60px height inside a 45px strip, which dropped
  // the logos below the centre line.
  ['hero', 'careers'].forEach(which => {
    const strip = R('.logostrip--' + which);
    const label = R('.logostrip--' + which + ' .logostrip__label');
    const logo = R('.logostrip--' + which + ' .logostrip__tile img');
    if (!strip || !label || !logo) return;
    const mid = (strip.top + strip.bottom) / 2;
    t(which + ' strip label is centred', (label.top + label.bottom) / 2, mid, 1);
    t(which + ' strip logos are centred', (logo.top + logo.bottom) / 2, mid, 1);
  });

  // --- two paths ----------------------------------------------------------
  // Ratio, not a fixed height: 361x281 is the desktop card at exactly 393
  // wide, but pinning the height alone flattens it on any wider phone.
  const media = R('.section--paths .card__media');
  t('paths card holds the desktop 641:500 ratio', media.width / media.height, 641 / 500, 0.01);
  // Figma rules the two models apart, 16px clear of each card.
  t('rule between the models sits 16px under card one',
    R('.paths__card--two').top - R('.paths__card--one').bottom, 32);

  // --- campfire -----------------------------------------------------------
  // No tabs here, so no timer to fill the bar under each title.
  t('no part-filled progress bar', R('.campfire__progress').width, 0);

  // --- industries ---------------------------------------------------------
  // Figma gives the dots 16px off the card above and 16px off the rule below,
  // where every other section takes 30.
  t('dots clear the card box above', R('.industries__dots').top - R('.section--industries .card__info').bottom, 16);
  t('dots clear the section rule below', R('.section--industries').bottom - R('.industries__dots').bottom, 16);

  // --- every section pays for the gap below its own content ---------------
  t('rule below Two Paths', R('.section--campfire').top - R('.paths__card--two').bottom, 30);

  // --- cards --------------------------------------------------------------
  // Titles hang from the foot of the image and grow upward, so a title of any
  // depth fills the space above rather than running into the box below.
  ['.section--industries', '.section--blog'].forEach(sec => {
    document.querySelectorAll(sec + ' .card').forEach((c, i) => {
      const title = c.querySelector('.ind__title, .blog__title');
      const m = c.querySelector('.card__media').getBoundingClientRect();
      if (title) t(sec + ' card ' + i + ' title hangs 17px off the image foot',
        m.bottom - title.getBoundingClientRect().bottom, 17, 1);
    });
  });
  // Every box in a set is the height of the tallest, with the slack dropped
  // between the chips and the copy, so the links land on one line.
  ['.section--industries', '.section--blog'].forEach(sec => {
    const cards = [...document.querySelectorAll(sec + ' .card')];
    if (cards.length < 2) return;
    const h0 = cards[0].getBoundingClientRect().height;
    const l0 = cards[0].querySelector('.card-link').getBoundingClientRect().top;
    cards.slice(1).forEach((c, i) => {
      t(sec + ' card ' + (i + 1) + ' is the same height as the first',
        c.getBoundingClientRect().height, h0, 1);
      t(sec + ' card ' + (i + 1) + ' link sits on the same line',
        c.querySelector('.card-link').getBoundingClientRect().top, l0, 1);
    });
  });

  // --- careers ------------------------------------------------------------
  // The job is an <a>; desktop blockifies it by positioning it, so it has to
  // be blockified explicitly here or the padding indents nothing.
  const job = document.querySelectorAll('.job')[1];
  t('job content is padded back into the gutter',
    job.querySelector('.job__title').getBoundingClientRect().left, 16);

  // --- footer -------------------------------------------------------------
  t('footer fills the viewport', R('.section--footer').height, window.innerHeight, 1);
  // Clears the fixed bar so the logo and hamburger sit on their own.
  t('footer clears the nav', parseFloat(getComputedStyle(document.querySelector('.section--footer')).paddingTop), 70);
  // The cap trim sits on the end <li>s, not the <ul>: trimming a block whose
  // lines belong to child blocks is read differently by the two engines, and
  // the first link dropped ~6px into the second after a tap.
  const links = [...document.querySelectorAll('.footer__col--site a')].map(a => a.getBoundingClientRect().top);
  t('footer links are evenly spaced (1)', links[1] - links[0], 22);
  t('footer links are evenly spaced (2)', links[2] - links[1], 22);

  return out;
});

/* ==========================================================================
   Between the breakpoints — the column zoomed to fit

   There is no Figma frame between 900 and 1440 and the fixed column does not
   fit, so it is zoomed down to the window. Before that, three things disagreed
   about where centre was: the bar was centred on the window, the column pinned
   itself left because auto margins cannot centre a box wider than its
   container, and the full-bleed video and footer took `50%` of the column
   rather than of the window. The logo went off the left, Contact off the
   right, and the video sat inset. These check it stays honest.
   ========================================================================== */

const FIT = String(function fit() {
  const out = [];
  const t = (label, got, exp, tol) => out.push([label, +Number(got).toFixed(3), exp, tol || 0.6]);
  const W = document.documentElement.clientWidth;
  const R = s => document.querySelector(s).getBoundingClientRect();

  t('the column is zoomed to the window',
    +getComputedStyle(document.documentElement).getPropertyValue('--fit'), W / 1440, 0.002);

  // Everything that is meant to span the window actually does.
  ['.nav', '.hero__bg', '.section--footer'].forEach(sel => {
    t(sel + ' starts at the left edge', R(sel).left, 0);
    t(sel + ' ends at the right edge', R(sel).right, W);
  });

  // …and the two ends of the bar are on screen, which is what you lose first.
  t('the logo is on screen', R('.nav__logo').left > 0 ? 1 : 0, 1);
  t('Contact is on screen', R('.nav__item--contact').right <= W + 0.5 ? 1 : 0, 1);

  t('nothing overflows sideways', document.documentElement.scrollWidth, W);
  t('hero fills the viewport', R('.section--hero').height, window.innerHeight, 1);
  t('footer fills the viewport', R('.section--footer').height, window.innerHeight, 1);

  return out;
});

/* ==========================================================================
   Illustrations — centred on the drawing, not on the SVG's bounding box

   The labels sit outside the artwork and lopsidedly, so the centre that
   matters is the union of the shapes, ignoring <text>. --art-shift cancels
   whatever is left, and has to ride --art-scale or a nudge tuned at full size
   stays full size when the diagram is scaled down for mobile.
   ========================================================================== */

const ART = String(function art() {
  const out = [];
  document.querySelectorAll('.campfire__frame').forEach((fr, i) => {
    const svg = fr.querySelector('svg.hyde-diagram');
    if (!svg) return;
    let x0 = Infinity, x1 = -Infinity;
    svg.querySelectorAll('circle,path,line,rect,polyline,polygon,ellipse').forEach(el => {
      if (el.closest('defs')) return;
      let bb; try { bb = el.getBBox(); } catch (e) { return; }
      if (!bb || (!bb.width && !bb.height)) return;
      const sw = parseFloat(getComputedStyle(el).strokeWidth) || 0;
      x0 = Math.min(x0, bb.x - sw / 2);
      x1 = Math.max(x1, bb.x + bb.width + sw / 2);
    });
    if (!isFinite(x0)) return;
    const vb = svg.viewBox.baseVal;
    const svgB = svg.getBoundingClientRect();
    const frB = fr.getBoundingClientRect();
    const scale = svgB.width / vb.width;
    const inkCentre = svgB.left + ((x0 + x1) / 2 - vb.x) * scale;
    out.push(['campfire illustration ' + (i + 1) + ' is centred on its drawing',
      +(inkCentre - (frB.left + frB.width / 2)).toFixed(1), 0, 1.5]);
  });
  return out;
});

/* --- running it ---------------------------------------------------------- */

async function open(browser, url, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: width < 900,
    isMobile: width < 900,
  });
  await page.goto(url, { waitUntil: 'load' });
  // Reveals are scroll-triggered and carry a transform, which moves things.
  // Land them all before measuring anything.
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
  await page.waitForTimeout(1400);
  return page;
}

// A family is only really there if it measures differently from a fallback
// it shares nothing with. document.fonts.check() answers true either way.
async function missingFonts(page) {
  return page.evaluate(() => {
    const probe = fam => {
      const s = document.createElement('span');
      s.textContent = 'HAMBURGEFONTSIV 0123456789';
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-size:40px;font-family:' + fam;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width;
      s.remove();
      return w;
    };
    const gone = [];
    if (probe('"new-science", monospace') === probe('monospace')) gone.push('New Science');
    if (probe('"IBM Plex Mono", cursive') === probe('cursive')) gone.push('IBM Plex Mono');
    if (probe('"Neue Montreal", monospace') === probe('monospace')) gone.push('Neue Montreal');
    return gone;
  });
}

// Failures and skips always; the passes only when asked, since a hundred
// green ticks is scrollback rather than a report.
const VERBOSE = process.argv.includes('-v') || process.argv.includes('--verbose');

// Enough precision for a ratio, no trailing zeros for a pixel count.
const num = v => String(+Number(v).toFixed(3));

function report(rows, tally) {
  for (const r of rows) {
    if (r.skip) { console.log('  ·  ' + r.label + '   skipped — ' + r.skip); tally.skipped++; continue; }
    if (r.ok) { if (VERBOSE) console.log('  ✓  ' + r.label); tally.pass++; continue; }
    console.log('  ✗  ' + r.label + '\n       ' + r.detail + (r.why ? '\n       expected because: ' + r.why : ''));
    tally.fail++;
  }
}

async function desktop(browser, url, tally) {
  const page = await open(browser, url, 1440, 900);
  const gone = await missingFonts(page);
  console.log('\nDesktop — 1440 x 900, against the Figma desktop frame');
  if (gone.length) console.log('  (no network: ' + gone.join(', ') + ' fell back — text-metric rows are looser)');
  const rows = await page.evaluate(([spec, gone]) => {
    const page = document.querySelector('.page').getBoundingClientRect();
    const ox = page.left, oy = page.top + window.scrollY;
    return spec.map(([sel, ex, ey, ew, eh, why, tag]) => {
      const tol = tag === 'font' ? 2 : 0.6;
      const el = document.querySelector(sel);
      if (!el) return { label: sel, ok: false, detail: 'no element matches this selector', why };
      const r = el.getBoundingClientRect();
      const got = { x: r.left - ox, y: r.top - oy, w: r.width, h: r.height };
      const bad = [];
      for (const [k, exp] of [['x', ex], ['y', ey], ['w', ew], ['h', eh]]) {
        if (exp === null) continue;
        const d = +(got[k] - exp).toFixed(1);
        if (Math.abs(d) > tol) bad.push(k + ' ' + got[k].toFixed(1) + ', expected ' + exp + ' (' + (d > 0 ? '+' : '') + d + ')');
      }
      return bad.length ? { label: sel, ok: false, detail: bad.join('   '), why } : { label: sel, ok: true };
    });
  }, [DESKTOP, gone]);
  report(rows, tally);

  const artRows = (await page.evaluate('(' + ART + ')()')).map(([label, got, exp, tol]) =>
    Math.abs(got - exp) <= tol
      ? { label, ok: true }
      : { label, ok: false, detail: 'off by ' + got + 'px, tolerance ' + tol });
  report(artRows, tally);
  await page.close();
}

// Twice, at two widths. Several of these only break away from 393 — a card
// with its height pinned instead of its ratio is exactly right at 393 and
// visibly flat at 430, which is the phone most people are holding.
// The carousel measures in layout units and writes them back; under zoom the
// rect it would otherwise have measured is smaller by the zoom factor, so a
// page turn would fall short. Driven rather than measured, because that is the
// only way to catch it.
async function fitBand(browser, url, tally, width) {
  const page = await open(browser, url, width, 900);
  console.log('\nBetween the breakpoints — ' + width + ' x 900, column zoomed to fit');
  const rows = (await page.evaluate('(' + FIT + ')()')).map(([label, got, exp, tol]) =>
    Math.abs(got - exp) <= tol
      ? { label, ok: true }
      : { label, ok: false, detail: 'got ' + got + ', expected ' + num(exp) + ' (off by ' + num(got - exp) + ')' });
  report(rows, tally);

  const LABEL = 'a carousel page turn moves exactly one card';
  try {
    await page.evaluate(() => document.querySelector('.industries__viewport').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => document.querySelector('.industries__card').getBoundingClientRect().left);
    // 4s, not the 30s default: when this fails it is usually because the arrow
    // has been pushed off screen, and a broken layout should report rather
    // than hang.
    await page.click('#ind-next', { timeout: 4000 });
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({
      left: document.querySelector('.industries__card').getBoundingClientRect().left,
      cardW: document.querySelector('.industries__card').getBoundingClientRect().width,
    }));
    const moved = before - after.left;
    report([Math.abs(moved - after.cardW) <= 2
      ? { label: LABEL, ok: true }
      : { label: LABEL, ok: false,
          detail: 'moved ' + Math.round(moved) + 'px, a card is ' + Math.round(after.cardW) + 'px' }], tally);
  } catch (e) {
    report([{ label: LABEL, ok: false,
      detail: 'could not drive the carousel — ' + String(e.message).split('\n')[0]
              + '\n       (the arrow is usually off screen when the column does not fit)' }], tally);
  }
  await page.close();
}

async function mobile(browser, url, tally, width, height) {
  const page = await open(browser, url, width, height);
  const gone = await missingFonts(page);
  console.log('\nMobile — ' + width + ' x ' + height
    + (width === 393 ? ', against the Figma mobile frame' : ', the same rules on a wider phone'));
  if (gone.length) console.log('  (no network: ' + gone.join(', ') + ' fell back — text-metric rows are looser)');
  const raw = await page.evaluate('(' + MOBILE + ')()');
  const artRaw = await page.evaluate('(' + ART + ')()');
  const rows = raw.concat(artRaw).map(([label, got, exp, tol]) =>
    Math.abs(got - exp) <= tol
      ? { label, ok: true }
      : { label, ok: false, detail: 'got ' + got + ', expected ' + exp + ' (off by ' + num(got - exp) + ')' });
  report(rows, tally);
  await page.close();
}

(async () => {
  const which = (process.argv.slice(2).find(a => !a.startsWith('-')) || 'both').toLowerCase();
  const chromium = loadChromium();
  const { server, port } = await serve();
  const url = 'http://127.0.0.1:' + port + '/index.html';
  const browser = await chromium.launch();
  const tally = { pass: 0, fail: 0, skipped: 0 };
  try {
    if (which !== 'mobile') await desktop(browser, url, tally);
    if (which === 'both' || which === 'fit') await fitBand(browser, url, tally, 1100);
    if (which !== 'desktop' && which !== 'fit') {
      await mobile(browser, url, tally, 393, 852);
      await mobile(browser, url, tally, 430, 932);
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log('\n' + tally.pass + ' passed, ' + tally.fail + ' failed'
    + (tally.skipped ? ', ' + tally.skipped + ' skipped' : '') + '\n');
  process.exit(tally.fail ? 1 : 0);
})();
