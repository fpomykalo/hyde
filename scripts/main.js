/* ==========================================================================
   Hyde — desktop behaviour (v01)

   1. Asset placeholders   — labelled boxes for artwork that isn't uploaded yet
   2. Nav theme            — light/dark lockup driven by the section under the bar
   3. Reveal on scroll     — fade + rise, hero runs on load
   4. Campfire tabs        — 7s timeline per tab, auto-advance, click to jump
   5. Industries carousel  — arrows, dots, drag
   6. Logo marquees        — seamless drift inside a fixed cell frame
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     0. Viewport metrics

     100vw counts the scrollbar, which would push the full-bleed hero video and
     the footer wider than the document and produce a horizontal scroll.
     Publish the real client size instead; the CSS falls back to 100vw/100vh if
     this never runs.
     ---------------------------------------------------------------------- */

  var CANVAS = 1440;   // the desktop column's width, and --canvas-w
  var MOBILE = 900;    // where styles/mobile.css takes over

  function syncViewport() {
    var d = document.documentElement;
    var w = d.clientWidth;
    var h = d.clientHeight;

    // Between the mobile breakpoint and 1440 there is no Figma frame to build
    // from, and the fixed column does not fit. Rather than clip it — which
    // loses the logo off the left and Contact off the right, and leaves the
    // full-bleed video and footer offset, since their `50%` is half the column
    // and not half the window — the whole column is zoomed to fit. `zoom`
    // rather than a transform, because it scales layout rather than paint: the
    // document height, the scrollbar and the fixed bar all follow it.
    var fit = (w > MOBILE && w < CANVAS) ? w / CANVAS : 1;
    d.style.setProperty('--fit', fit);

    // Inside a zoomed box, lengths are in page units. At `fit` the window is
    // exactly one canvas wide by definition, and this is what makes the
    // full-bleed rules land: `calc(50% - var(--vw) / 2)` cancels to zero.
    d.style.setProperty('--vw', (fit === 1 ? w : CANVAS) + 'px');
    d.style.setProperty('--vh', h / fit + 'px');
  }
  syncViewport();

  /* ------------------------------------------------------------------------
     0b. Hero video

     Muted autoplay is normally allowed, but iOS refuses it in Low Power Mode
     and some browsers block it until the page has been interacted with. Retry
     on the first gesture rather than leaving the poster frozen.
     ---------------------------------------------------------------------- */

  (function heroVideo() {
    var v = document.querySelector('.hero__bg video');
    if (!v) return;

    function attempt() {
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    attempt();
    ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach(function (evt) {
      window.addEventListener(evt, function once() {
        window.removeEventListener(evt, once);
        if (v.paused) attempt();
      }, { passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && v.paused) attempt();
    });
  })();

  /* ------------------------------------------------------------------------
     1. Asset placeholders

     Rather than showing broken-image glyphs, swap any image that fails to
     load for a box at the exact same dimensions, labelled with the file it is
     waiting for. Only the two blog card images are outstanding.
     ---------------------------------------------------------------------- */

  function placeholderFor(img) {
    var box = document.createElement('span');
    var src = img.getAttribute('src') || '';
    var w = img.getAttribute('width');
    var h = img.getAttribute('height');

    box.className = 'asset';
    if (img.closest('.card, .hero__bg, .campfire__frames, .logostrip--hero')) {
      box.className += ' asset--onDark';
    }
    if (w) box.style.width = w + 'px';
    if (h) box.style.height = h + 'px';
    box.textContent = src.replace(/^assets\//, '');
    box.setAttribute('data-asset', src);

    // Keep the class list so .card__media img rules still apply to the stand-in
    if (img.className) box.className += ' ' + img.className;

    img.replaceWith(box);
  }

  document.addEventListener(
    'error',
    function (e) {
      var t = e.target;
      if (t && t.tagName === 'IMG' && !t.dataset.placeheld) {
        t.dataset.placeheld = '1';
        placeholderFor(t);
      }
    },
    true
  );

  // Images that already failed before this script ran
  Array.prototype.forEach.call(document.images, function (img) {
    if (img.complete && img.naturalWidth === 0 && !img.dataset.placeheld) {
      img.dataset.placeheld = '1';
      placeholderFor(img);
    }
  });

  /* ------------------------------------------------------------------------
     2. Nav theme

     Sections carry data-bg="dark" | "light". Whichever one sits under the
     middle of the nav bar decides the colourway, so the logo flips black or
     white with the background rather than at one hardcoded scroll offset.
     ---------------------------------------------------------------------- */

  var nav = document.getElementById('nav');
  var themedSections = Array.prototype.slice.call(
    document.querySelectorAll('[data-bg]')
  );
  // Half the bar's height — the line the section under it is measured against.
  function navMid() {
    return nav.getBoundingClientRect().height / 2 || 27;
  }

  function syncNavTheme() {
    // Light is the default: the page ground is white, and the gaps between
    // sections belong to no section at all. Only an explicitly dark section
    // sitting under the bar makes it dark, so the moment the hero's bottom
    // edge passes the bar the lockup flips rather than waiting for the next
    // section to arrive.
    var theme = 'light';
    var mid = navMid();
    for (var i = 0; i < themedSections.length; i++) {
      var el = themedSections[i];
      if (el.getAttribute('data-bg') !== 'dark') continue;
      var r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        theme = 'dark';
        break;
      }
    }
    nav.classList.toggle('is-light', theme === 'light');
  }

  /* ------------------------------------------------------------------------
     2b. Logo colour

     The bar's chrome follows the section it is over, but the mark sits at a
     fixed spot and can end up on a photo inside an otherwise light section.
     So it is decided separately, by measuring what is actually underneath.

     Every surface that can pass beneath the bar is sampled once: images and
     video are drawn to a small canvas and averaged over the strip the mark
     occupies, then darkened by whatever overlay sits on top of them; plain
     surfaces use their background colour. Under 50% relative luminance takes
     the white lockup, at or over it the black one.
     ---------------------------------------------------------------------- */

  var logo = nav.querySelector('.nav__logo');

  function luminanceOf(r, g, b) {
    // sRGB -> linear, then Rec.709 luma
    function lin(c) {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function sampleMedia(el) {
    var w = el.naturalWidth || el.videoWidth;
    var h = el.naturalHeight || el.videoHeight;
    if (!w || !h) return null;
    try {
      var c = document.createElement('canvas');
      c.width = 8;
      c.height = 8;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      // Sample the top eighth — the band the mark actually overlaps
      ctx.drawImage(el, 0, 0, w, Math.max(1, Math.round(h / 8)), 0, 0, 8, 8);
      var d = ctx.getImageData(0, 0, 8, 8).data;
      var sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += luminanceOf(d[i], d[i + 1], d[i + 2]);
      return sum / (d.length / 4);
    } catch (e) {
      return null; // tainted canvas — fall back to the declared value
    }
  }

  function parseBg(el) {
    var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (!m || m.length < 3 || (m.length > 3 && parseFloat(m[3]) === 0)) return null;
    return luminanceOf(+m[0], +m[1], +m[2]);
  }

  // Surfaces, shallowest first. `media` marks the ones covered edge to edge by
  // a photo or video worth sampling; the rest are read from their background
  // colour. Sampling a surface whose only image is a transparent logo would
  // average the empty pixels and call a near-white panel black.
  // `overlay` is the alpha of the dark wash over the media where the mark
  // crosses it.
  var surfaces = [];
  function addSurface(el, opts) {
    if (el) surfaces.push({
      el: el, media: !!opts.media, overlay: opts.overlay || 0,
      lum: opts.fallback, measured: false
    });
  }

  addSurface(document.querySelector('.hero__bg'), { media: true, fallback: 0.05 });
  Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
    // Industries and Blog wash the top at 0.8; Two Paths at 0.4
    var strong = card.querySelector('.card__overlay--strong');
    addSurface(card, { media: true, overlay: strong ? 0.8 : 0.4, fallback: 0.15 });
  });
  addSurface(document.querySelector('.campfire__stage'), { media: true, fallback: 0.45 });
  addSurface(document.querySelector('.section--footer'), { fallback: 0.94 });

  function measureSurfaces() {
    surfaces.forEach(function (s) {
      if (s.measured) return;
      var l = null;
      if (s.media) {
        var el = s.el.querySelector('img, video');
        if (el) l = sampleMedia(el);
      } else {
        l = parseBg(s.el);
      }
      if (l === null || l === undefined) return;
      s.lum = l * (1 - s.overlay);   // composite the dark wash over it
      s.measured = true;
    });
  }

  function syncLogo() {
    if (!logo) return;
    var r = logo.getBoundingClientRect();
    var lum = 1;                      // page ground is white
    for (var i = 0; i < surfaces.length; i++) {
      var b = surfaces[i].el.getBoundingClientRect();
      if (b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top) {
        lum = surfaces[i].lum;        // later surfaces paint over earlier ones
      }
    }
    nav.classList.toggle('is-logo-dark', lum >= 0.5);
  }

  /* ------------------------------------------------------------------------
     3. Reveal on scroll
     ---------------------------------------------------------------------- */

  var hero = document.querySelector('.section--hero');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) {
      el.classList.add('is-in');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0 }
    );

    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) {
      // Hero items animate on load, in sequence, rather than on intersection
      if (hero && hero.contains(el)) return;
      revealObserver.observe(el);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!hero) return;
        Array.prototype.forEach.call(hero.querySelectorAll('.reveal'), function (el) {
          el.classList.add('is-in');
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     3b. Mobile menu

     Figma draws the closed hamburger only, so the open state is built from the
     same links rather than invented.
     ---------------------------------------------------------------------- */

  (function menu() {
    var toggle = document.getElementById('nav-toggle');
    if (!toggle) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.querySelectorAll('.nav__item').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();

  /* ------------------------------------------------------------------------
     3c. Placeholder links

     The social and article links are still href="#" until their destinations
     exist. Left alone, a bare "#" is a jump to the top of the document, so
     clicking one throws you out of the footer. They stay inert until they are
     given somewhere to go.
     ---------------------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ------------------------------------------------------------------------
     4. Campfire tabs

     Each tab reads for 7s: the black bar fills the grey track, then the next
     tab opens. Clicking a tab jumps to it and restarts its timer. The timer
     only runs while the section is on screen.
     ---------------------------------------------------------------------- */

  (function campfire() {
    var section = document.querySelector('.section--campfire');
    if (!section) return;

    // Mobile stacks all four blocks with no tabs, so there is nothing to drive
    var mq = window.matchMedia('(max-width: 900px)');
    if (mq.matches) return;

    var tabs = Array.prototype.slice.call(section.querySelectorAll('.campfire__tab'));
    var panes = Array.prototype.slice.call(section.querySelectorAll('.campfire__pane'));
    var frames = Array.prototype.slice.call(section.querySelectorAll('.campfire__frame'));
    if (!tabs.length) return;

    var DURATION = 7000;
    var index = 0;
    var animation = null;
    var visible = false;

    function startTimer() {
      var bar = panes[index] && panes[index].querySelector('.campfire__progress');
      if (!bar) return;

      if (reduceMotion) {
        bar.style.width = '100%';
        return;
      }

      animation = bar.animate(
        [{ width: '0%' }, { width: '100%' }],
        { duration: DURATION, easing: 'linear', fill: 'forwards' }
      );
      animation.onfinish = function () {
        show((index + 1) % tabs.length);
      };
      if (!visible) animation.pause();
    }

    function stopTimer() {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      panes.forEach(function (p) {
        var bar = p.querySelector('.campfire__progress');
        if (bar) bar.style.width = '';
      });
    }

    function show(next) {
      stopTimer();
      index = next;

      tabs.forEach(function (tab, i) {
        tab.classList.toggle('is-active', i === index);
        tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      panes.forEach(function (pane, i) {
        pane.classList.toggle('is-active', i === index);
        pane.hidden = i !== index;
      });
      frames.forEach(function (frame, i) {
        frame.classList.toggle('is-active', i === index);
      });

      startTimer();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        show(i);
      });
    });

    show(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (!animation) return;
          if (visible) animation.play();
          else animation.pause();
        },
        { threshold: 0.25 }
      ).observe(section);
    } else {
      visible = true;
      if (animation) animation.play();
    }
  })();

  /* ------------------------------------------------------------------------
     5. Industries carousel

     One card per page, 523px step (cards share a 1px border). Arrows appear
     only where there is somewhere to go, dots jump straight to a card, and
     the track can be dragged.
     ---------------------------------------------------------------------- */

  function carousel(opts) {
    var viewport = document.querySelector(opts.viewport);
    var track = document.querySelector(opts.track);
    if (!viewport || !track) return;

    var prev = opts.prev ? document.querySelector(opts.prev) : null;
    var next = opts.next ? document.querySelector(opts.next) : null;
    var dotsHost = document.querySelector(opts.dots);
    var cards = Array.prototype.slice.call(track.querySelectorAll(opts.card));
    if (!cards.length || !dotsHost) return;

    var index = 0;
    var dots = [];
    var step = 0;
    var maxOffset = 0;
    var pageCount = 1;

    // Measured rather than hardcoded: desktop lays the cards out at 524 wide on
    // a 523 step (they share a border), mobile gives each one the full width.
    // offsetWidth/offsetLeft, not getBoundingClientRect: the rect is in real
    // screen pixels, and under `zoom` those are smaller than the page units
    // the transform below is written in. Measuring in one and writing in the
    // other under-scrolls the track by exactly the zoom factor.
    function measure() {
      var vpW = viewport.offsetWidth;
      var firstW = cards[0].offsetWidth;
      step = cards.length > 1
        ? Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) || firstW
        : firstW;
      var trackW = (cards.length - 1) * step + firstW;
      maxOffset = Math.max(0, trackW - vpW);
      // Dots count the positions the track can actually reach. One card per
      // screen makes every card its own page; on desktop the last card cannot
      // reach the left edge, so there are fewer pages than cards.
      pageCount = maxOffset > 0 ? Math.min(cards.length, Math.ceil(maxOffset / step) + 1) : 1;
    }

    // A drag arrives in real screen pixels; the track moves in page units.
    function pageUnits(px) {
      var rect = cards[0].getBoundingClientRect().width;
      var zoom = rect && cards[0].offsetWidth ? rect / cards[0].offsetWidth : 1;
      return zoom ? px / zoom : px;
    }

    function offsetFor(i) {
      return Math.min(i * step, maxOffset);
    }

    function buildDots() {
      dotsHost.innerHTML = '';
      dots = [];
      for (var i = 0; i < pageCount; i++) {
        (function (i) {
          var dot = document.createElement('button');
          dot.className = 'dotnav__dot';
          dot.type = 'button';
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-label', opts.label + ' ' + (i + 1));
          dot.addEventListener('click', function () { goTo(i); });
          dotsHost.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function render(animate) {
      track.classList.toggle('no-anim', !animate);
      track.style.transform = 'translateX(' + -offsetFor(index) + 'px)';
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      if (prev) prev.hidden = index === 0;
      if (next) next.hidden = offsetFor(index) >= maxOffset - 0.5;
    }

    function goTo(i, animate) {
      index = Math.max(0, Math.min(pageCount - 1, i));
      render(animate !== false);
    }

    function relayout() {
      var was = pageCount;
      measure();
      if (pageCount !== was) buildDots();
      goTo(Math.min(index, pageCount - 1), false);
      requestAnimationFrame(function () { track.classList.remove('no-anim'); });
    }

    if (next) next.addEventListener('click', function () { goTo(index + 1); });
    if (prev) prev.addEventListener('click', function () { goTo(index - 1); });

    // Drag / swipe. A touch drag starts undecided: the first few pixels say
    // whether the finger is swiping the track or scrolling the page, and only
    // a horizontal one takes the gesture. Without that the track jitters
    // sideways under every vertical scroll that begins on a card.
    var down = false, locked = false, dragging = false;
    var startX = 0, startY = 0, startOffset = 0, moved = 0, startTime = 0;
    var LOCK = 6;         // px before the gesture commits to an axis
    var TAKE = 0.25;      // a quarter of a card is enough to turn the page
    var FLICK_MS = 300;   // …or any quick flick, however short

    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || maxOffset <= 0) return;
      down = true;
      locked = false;
      dragging = false;
      moved = 0;
      startX = e.clientX;
      startY = e.clientY;
      startOffset = offsetFor(index);
      startTime = Date.now();
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = pageUnits(e.clientX - startX);
      var dy = e.clientY - startY;

      if (!locked) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        locked = true;
        // Vertical wins: let go and leave the page to scroll.
        if (Math.abs(dy) > Math.abs(dx)) { down = false; return; }
        dragging = true;
        viewport.classList.add('is-dragging');
        track.classList.add('no-anim');
        try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
      }

      if (!dragging) return;
      moved = dx;
      var offset = Math.max(0, Math.min(maxOffset, startOffset - moved));
      track.style.transform = 'translateX(' + -offset + 'px)';
    });

    // Snapping on the nearest card means letting go at 49% springs back, which
    // reads as the carousel refusing the swipe. A quarter of a card carries it,
    // and so does a flick of any length; drag further and it still lands on
    // whichever card you dragged to.
    function endDrag() {
      down = false;
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');

      var pages = -moved / step;               // + forward, - back
      var flick = Date.now() - startTime < FLICK_MS && Math.abs(moved) > LOCK;
      var target;

      if (Math.abs(pages) > TAKE || flick) {
        target = index + (pages > 0
          ? Math.max(1, Math.round(pages))
          : Math.min(-1, Math.round(pages)));
      } else {
        target = index;
      }
      goTo(target);
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // A drag shouldn't fire the link underneath it
    viewport.addEventListener('click', function (e) {
      if (Math.abs(moved) > 5) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    measure();
    buildDots();
    render(false);
    requestAnimationFrame(function () { track.classList.remove('no-anim'); });
    window.addEventListener('resize', relayout);
  }

  carousel({
    viewport: '.industries__viewport', track: '#ind-track', card: '.industries__card',
    prev: '#ind-prev', next: '#ind-next', dots: '#ind-dots', label: 'Industry'
  });

  // Blog is two cards side by side on desktop, one at a time on mobile
  carousel({
    viewport: '.blog__viewport', track: '#blog-track', card: '.card',
    dots: '#blog-dots', label: 'Article'
  });

  /* ------------------------------------------------------------------------
     6. Logo marquees

     The 7-cell frame stays put; the logos drift through the masked area
     behind it. Tiles are cloned until the track is wide enough to loop
     without a seam, then translated one full set per cycle.
     ---------------------------------------------------------------------- */

  Array.prototype.forEach.call(
    document.querySelectorAll('.logostrip__track'),
    function (track) {
      var viewportW = track.parentElement.offsetWidth;
      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;

      var setWidth = originals.reduce(function (sum, el) {
        return sum + el.offsetWidth;
      }, 0);
      if (!setWidth) return;

      // Enough copies that a full set can scroll past without emptying the view
      var copies = Math.max(2, Math.ceil((viewportW + setWidth) / setWidth) + 1);
      for (var c = 1; c < copies; c++) {
        originals.forEach(function (el) {
          var clone = el.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
      }

      if (reduceMotion) return;

      var seconds = parseFloat(track.getAttribute('data-speed')) || 45;
      var direction = track.getAttribute('data-marquee') === 'right' ? 'right' : 'left';
      var from = direction === 'left' ? 0 : -setWidth;
      var to = direction === 'left' ? -setWidth : 0;

      var anim = track.animate(
        [
          { transform: 'translateX(' + from + 'px)' },
          { transform: 'translateX(' + to + 'px)' }
        ],
        { duration: seconds * 1000, easing: 'linear', iterations: Infinity }
      );

      // Only where a pointer can actually hover: a tap fires mouseenter and
      // then nothing until you touch elsewhere, which parks the strip.
      if (window.matchMedia('(hover: hover)').matches) {
        var strip = track.closest('.logostrip');
        strip.addEventListener('mouseenter', function () { anim.pause(); });
        strip.addEventListener('mouseleave', function () { anim.play(); });
      }
    }
  );

  /* ------------------------------------------------------------------------
     Scroll wiring
     ---------------------------------------------------------------------- */

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      syncNavTheme();
      syncLogo();
      ticking = false;
    });
  }

  // Media decodes after first paint, so measure again once things settle
  window.addEventListener('load', function () {
    measureSurfaces();
    syncLogo();
  });
  setTimeout(function () { measureSurfaces(); syncLogo(); }, 1200);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    syncViewport();
    onScroll();
  });
  measureSurfaces();
  syncNavTheme();
  syncLogo();
})();
