/* 디자인·기획 페이지: 섹션(.dz-sec, .pf-s)이 화면에 들어올 때 아래에서 살짝 올라오며 나타남. 한 번 나타난 섹션은 그대로 둠. */
(function () {
  'use strict';
  var secs = [].slice.call(document.querySelectorAll('.dz-sec, .plf > .pf-s'));
  if (!secs.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('dz-reveal');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  secs.forEach(function (s) { io.observe(s); });
})();
