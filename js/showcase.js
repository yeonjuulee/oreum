/* SERVICE · DESIGN pages (css/showcase.css): scroll reveal, the self-check phone and the goal door.
   Scaling to the window, the changing hero screens and the footer names are js/service.js. */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function all(sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); }
  function shown(sec) { sec.classList.add('shown'); sec.dispatchEvent(new CustomEvent('sx:shown')); }

  // reveal: a section (.sx) reaching the screen gets .shown, and its .rvl pieces rise in one after another
  var secs = all('.shx .sx');
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('rv-on');
    secs.forEach(function (s) {
      all('.rvl', s).forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i * 0.07, 0.9).toFixed(2) + 's'); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { shown(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -15% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  } else secs.forEach(shown);

  // cards that lean toward the pointer
  all('.shx [data-tilt]').forEach(function (el) {
    var max = +el.getAttribute('data-tilt') || 6;
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(1400px) rotateY(' + (x * max).toFixed(2) + 'deg) rotateX(' + (-y * max).toFixed(2) + 'deg)';
    });
    el.addEventListener('mouseleave', function () { el.style.transform = ''; });
  });

  /* SURVEY: the app's four questions on the phone (1~4 → loading → result). The phone opens on the first
     question; the result is the app's own result screen. Thumbnails below jump between reachable screens. */
  var sec = document.querySelector('.shx .sq-live');
  if (sec) (function () {
    var form = sec.querySelector('.sqf'), steps = all('fieldset', form), fill = sec.querySelector('.prog i');
    var prev = sec.querySelector('.prev'), next = sec.querySelector('.next');
    var load = sec.querySelector('.sqload'), res = sec.querySelector('.sqres');
    var thumbs = all('.sqt', sec), cur = 0, timer = null, W = [95, 179, 263, 346];
    function val(n) { var e = form.querySelector('input[name="q' + n + '"]:checked'); return e ? e.value : null; }
    function reachable(i) { for (var n = 1; n <= Math.min(i, 4); n++) if (!val(n)) return false; return true; }
    function mark(k) { thumbs.forEach(function (t, i) { t.classList.toggle('cur', i === k); t.disabled = !reachable(i); }); }
    function show(k) {
      clearTimeout(timer); cur = k;
      sec.classList.add('run');
      form.hidden = k > 3; load.hidden = k !== 4; res.hidden = k !== 5;
      if (k <= 3) {
        steps.forEach(function (s, i) { s.hidden = i !== k; });
        fill.style.width = W[k] + 'px';
        prev.disabled = k === 0;
        next.disabled = !val(k + 1);
      }
      if (k === 4) timer = setTimeout(function () { show(5); }, 1800);
      mark(Math.min(k, 4));
    }
    next.addEventListener('click', function () { if (val(cur + 1)) show(cur + 1); });
    prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
    form.addEventListener('change', function () { next.disabled = !val(cur + 1); mark(cur); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    res.querySelector('.again').addEventListener('click', function () { form.reset(); show(0); });
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { if (reachable(i)) show(i); }); });
    show(0);
  })();

  // logo: the wordmark video plays once when its section shows, then rests on the last frame (no loop, no controls)
  all('.shx video.lgv').forEach(function (v) {
    var box = v.parentNode;
    v.muted = true; v.loop = false; v.controls = false;
    function fail() { box.classList.add('lgv-off'); }
    v.addEventListener('error', fail);
    if (v.error) fail();
    function play() {
      if (reduced) { v.addEventListener('loadedmetadata', function () { v.currentTime = Math.max(0, v.duration - 0.05); }); if (v.readyState >= 1) v.currentTime = Math.max(0, v.duration - 0.05); return; }
      try { v.currentTime = 0; } catch (e) {}
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    // start once most of the video is on screen (after the card has risen in)
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { vio.disconnect(); setTimeout(play, reduced ? 0 : 350); }
      }, { threshold: 0.6 });
      vio.observe(v);
    } else play();
  });

  // customize: the right phone's screen changes every 2 s and the left phone's sheet picks the matching background tile;
  // picking a tile shows that screen and the 2 s cycle carries on from it (악세사리 · 소품 are only shown, not clickable)
  var cz = document.querySelector('.shx .cz-live');
  if (cz) (function () {
    var cards = all('.czc', cz), L = cards[0], R = cards[1];
    var order = all('button.czt', L).map(function (t) { return t.dataset.bg; });
    var bg = 'cinema', timer = null;
    function paint() {
      [L, R].forEach(function (c) {
        all('.czt', c).forEach(function (t) {
          var on = t.dataset.bg === bg;
          t.classList.toggle('on', on); if (t.tagName === 'BUTTON') t.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
      all('.czsc', R).forEach(function (im) { im.classList.toggle('on', im.dataset.bg === bg); });
    }
    function run() {
      clearInterval(timer); if (reduced) return;
      timer = setInterval(function () { bg = order[(order.indexOf(bg) + 1) % order.length]; paint(); }, 2000);
    }
    all('button.czt', L).forEach(function (t) {
      t.addEventListener('click', function () { bg = t.dataset.bg; paint(); run(); });
    });
    paint(); run();
  })();

  // goal: the door opens once the stairs are up; pointing at it or clicking it opens it too
  var door = document.querySelector('.shx .door');
  if (door) {
    door.addEventListener('click', function () { door.classList.toggle('open'); });
    var gsec = door.closest('.sx');
    var open = function () { setTimeout(function () { door.classList.add('open'); }, reduced ? 0 : 1600); };
    if (gsec && gsec.classList.contains('shown')) open(); else if (gsec) gsec.addEventListener('sx:shown', open);
  }
})();
