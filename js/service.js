/* oreum service page (Figma "서비스 소개_수정본").
   The page is drawn at 1920 px wide and scaled to the window; every .sv-rot holds a stack of screens that change every 2 s. */
(function () {
  'use strict';
  var root = document.documentElement;
  // fit.js zooms the whole page by window/1440 on desktop; this scales the 1920 canvas the rest of the way to the window width
  function scale() { root.style.setProperty('--svz', (window.innerWidth / (1920 * (window.__zoom || 1))).toFixed(5)); }
  scale(); window.addEventListener('resize', scale);

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // hero phone + the oreumi beside it change together; the survey phone and the 꾸미기 phone on their own
  var hero = document.querySelector('.sv-rot'), oru = [].slice.call(document.querySelectorAll('.sv-hero-oru img'));
  [].forEach.call(document.querySelectorAll('.sv-rot'), function (box) {
    var shots = [].slice.call(box.querySelectorAll('.sv-rot-i')); if (shots.length < 2) return;
    var i = shots.findIndex(function (s) { return s.classList.contains('on'); }); if (i < 0) i = 0;
    if (reduced) return;
    setInterval(function () {
      shots[i].classList.remove('on'); if (box === hero && oru[i]) oru[i].classList.remove('on');
      i = (i + 1) % shots.length;
      shots[i].classList.add('on'); if (box === hero && oru[i]) oru[i].classList.add('on');
    }, 2000);
  });

  // footer names: until a portfolio address is filled in (href=""), a click does nothing
  [].forEach.call(document.querySelectorAll('.sv-name'), function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') { a.removeAttribute('href'); a.setAttribute('role', 'link'); a.setAttribute('aria-disabled', 'true'); }
    else { a.target = '_blank'; a.rel = 'noopener'; }
  });
})();
