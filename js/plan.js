/* 기획 페이지: each tab group (페르소나, 3C 분석, 전략) shows one panel at a time; the section takes that panel's height and
   the title follows the tab (data-t). Arrow keys move between tabs. */
(function () {
  'use strict';
  [].forEach.call(document.querySelectorAll('.pf-tabsec'), function (sec) {
    var tabs = [].slice.call(sec.querySelectorAll('[role="tab"]')), title = sec.querySelector('[data-title]');
    function show(t, focus) {
      tabs.forEach(function (b) {
        var on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
        var p = sec.querySelector('[data-panel="' + b.dataset.tab + '"]'); if (p) p.hidden = !on;
      });
      if (t.dataset.h) sec.style.height = t.dataset.h + 'px';
      if (title && t.dataset.t) title.textContent = t.dataset.t;
      if (focus) t.focus();
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { show(b); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
        e.preventDefault(); show(tabs[(i + k + tabs.length) % tabs.length], true);
      });
      b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
    });
  });
})();
