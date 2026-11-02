/* 탑버튼 (service · plan · design): a round button at the bottom right that takes the page back to the top.
   It shows once the page has scrolled half a screen; the look is css/style.css .totop (Figma "서비스 소개_수정본"). */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'totop'; b.setAttribute('aria-label', '맨 위로');
  b.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><path fill="#fff" d="M26 21L27.5 21L27.5 19L26 19L24.5 19L24.5 21L26 21ZM27.0607 17.9393C26.4749 17.3536 25.5251 17.3536 24.9393 17.9393L15.3934 27.4853C14.8076 28.0711 14.8076 29.0208 15.3934 29.6066C15.9792 30.1924 16.9289 30.1924 17.5147 29.6066L26 21.1213L34.4853 29.6066C35.0711 30.1924 36.0208 30.1924 36.6066 29.6066C37.1924 29.0208 37.1924 28.0711 36.6066 27.4853L27.0607 17.9393Z"/></svg>';
  document.body.appendChild(b);
  function check() { b.classList.toggle('on', window.scrollY > window.innerHeight / 2); }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
  b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
})();
