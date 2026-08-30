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
     1. Asset placeholders

     Nothing in assets/ is committed yet. Rather than showing broken-image
     glyphs, swap any image that fails to load for a box at the exact same
     dimensions, labelled with the file it's waiting for.
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
  var NAV_MID = 27; // half of the 53px bar

  function syncNavTheme() {
    var theme = 'dark';
    for (var i = 0; i < themedSections.length; i++) {
      var r = themedSections[i].getBoundingClientRect();
      if (r.top <= NAV_MID && r.bottom > NAV_MID) {
        theme = themedSections[i].getAttribute('data-bg');
        break;
      }
    }
    nav.classList.toggle('is-light', theme === 'light');
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
     4. Campfire tabs

     Each tab reads for 7s: the black bar fills the grey track, then the next
     tab opens. Clicking a tab jumps to it and restarts its timer. The timer
     only runs while the section is on screen.
     ---------------------------------------------------------------------- */

  (function campfire() {
    var section = document.querySelector('.section--campfire');
    if (!section) return;

    var tabs = Array.prototype.slice.call(section.querySelectorAll('.campfire__tab'));
    var panes = Array.prototype.slice.call(section.querySelectorAll('.campfire__pane'));
    var frames = Array.prototype.slice.call(section.querySelectorAll('.campfire__frame'));
    if (!tabs.length) return;

    var DURATION = 7000;
    var index = 0;
    var animation = null;
    var visible = false;

    function loadAnimation(frame) {
      var src = frame.getAttribute('data-anim');
      if (!src || frame.dataset.loaded) return;
      frame.dataset.loaded = '1';

      // Probe first: if the HTML animation isn't uploaded yet, keep the still.
      fetch(src, { method: 'HEAD' })
        .then(function (res) {
          if (!res.ok) return;
          var iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.setAttribute('loading', 'lazy');
          iframe.setAttribute('title', '');
          iframe.setAttribute('aria-hidden', 'true');
          iframe.setAttribute('scrolling', 'no');
          frame.insertBefore(iframe, frame.firstChild);
          var still = frame.querySelector('img, .asset');
          if (still) still.remove();
        })
        .catch(function () {
          /* offline or file:// — the still stays */
        });
    }

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

      loadAnimation(frames[index]);
      startTimer();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        show(i);
      });
    });

    loadAnimation(frames[0]);
    startTimer();

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

  (function carousel() {
    var viewport = document.querySelector('.industries__viewport');
    var track = document.getElementById('ind-track');
    var prev = document.getElementById('ind-prev');
    var next = document.getElementById('ind-next');
    var dotsHost = document.getElementById('ind-dots');
    if (!viewport || !track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.industries__card'));
    var STEP = 523;
    var CARD_W = 524;
    var viewportW = 1280;
    var trackW = (cards.length - 1) * STEP + CARD_W;
    var maxOffset = Math.max(0, trackW - viewportW);

    // Pages are the positions the track can actually reach, not the number of
    // cards — otherwise the last dots all resolve to the same offset and do
    // nothing when clicked. Adding industries adds pages automatically.
    var pageCount = maxOffset > 0 ? Math.ceil(maxOffset / STEP) + 1 : 1;
    var index = 0;
    var dots = [];

    function offsetFor(i) {
      return Math.min(i * STEP, maxOffset);
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

    for (var i = 0; i < pageCount; i++) {
      (function (i) {
        var dot = document.createElement('button');
        dot.className = 'industries__dot';
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Industry ' + (i + 1));
        dot.addEventListener('click', function () {
          goTo(i);
        });
        dotsHost.appendChild(dot);
        dots.push(dot);
      })(i);
    }

    if (next) next.addEventListener('click', function () { goTo(index + 1); });
    if (prev) prev.addEventListener('click', function () { goTo(index - 1); });

    // Drag / swipe
    var dragging = false;
    var startX = 0;
    var startOffset = 0;
    var moved = 0;

    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true;
      moved = 0;
      startX = e.clientX;
      startOffset = offsetFor(index);
      viewport.classList.add('is-dragging');
      track.classList.add('no-anim');
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = e.clientX - startX;
      var offset = Math.max(0, Math.min(maxOffset, startOffset - moved));
      track.style.transform = 'translateX(' + -offset + 'px)';
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      var offset = Math.max(0, Math.min(maxOffset, startOffset - moved));
      goTo(Math.min(pageCount - 1, Math.round(offset / STEP)));
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // A drag shouldn't fire the link underneath it
    viewport.addEventListener(
      'click',
      function (e) {
        if (Math.abs(moved) > 5) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    render(false);
    requestAnimationFrame(function () { track.classList.remove('no-anim'); });
  })();

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

      var strip = track.closest('.logostrip');
      strip.addEventListener('mouseenter', function () { anim.pause(); });
      strip.addEventListener('mouseleave', function () { anim.play(); });
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
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  syncNavTheme();
})();
