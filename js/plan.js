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

/* 기획 페이지 섹션 이동: one wheel step (or ↓ ↑, PageDown PageUp, Space) glides straight to the next or previous section.
   Stops are worked out from what each section draws (not its padded box): content that fits under the top bar is centred
   there; taller content stops first with its top just under the bar, then with its lower rows in view, at a point
   where the bar does not cut through any block (the block it would cut goes under the bar whole), and may rest
   anywhere between the two. The very top and the footer are stops too. A scrollbar drag or a touch swipe that
   comes to rest between sections eases to the nearest stop. */
(function () {
  'use strict';
  var secs = [].slice.call(document.querySelectorAll('.plf > .pf-s')); if (!secs.length) return;
  var bar = document.querySelector('.topbar');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idle = null, down = false, busy = false, goal = 0, guard = null, lastWheel = 0, lastMag = 0;

  // the blocks a section draws, as [top, bottom] on screen; a child as big as the section is a wrapper (a tab panel)
  // or a backdrop (.pf-sun), so look inside it instead; hidden tab panels have no size and drop out
  function blocks(el, H, depth, list) {
    [].forEach.call(el.children, function (c) {
      var q = c.getBoundingClientRect(); if (!q.height || !q.width) return;
      if (q.height >= H * 0.98) { if (depth < 3) blocks(c, H, depth + 1, list); return; }
      list.push([q.top, q.bottom]);
    });
    return list;
  }
  function stops() {
    var y = window.scrollY, under = bar ? bar.getBoundingClientRect().bottom : 0, room = window.innerHeight - under;
    var max = document.documentElement.scrollHeight - window.innerHeight, out = { at: [], free: [] };
    var gap = Math.max(16, room * 0.03);   // what is kept clear under the top bar and above the window's bottom edge
    var all = [], list = secs.map(function (s) {
      var r = s.getBoundingClientRect(), t = getComputedStyle(s).transform;
      // the reveal (js/design.js) slides a section up from 56px below; measure where it rests, not where it is now
      var lift = t && t !== 'none' ? new DOMMatrix(t).m42 * (r.height / s.offsetHeight) : 0;
      var bl = blocks(s, r.height, 0, []).map(function (p) { return [p[0] + y - lift, p[1] + y - lift]; });
      if (!bl.length) bl = [[r.top + y - lift, r.bottom + y - lift]];
      all = all.concat(bl);
      return bl;
    });
    function cutAt(v, from) { var line = v + under; return from.filter(function (p) { return p[0] < line - 1 && p[1] > line + 1; }); }
    list.forEach(function (bl) {
      var ct = Math.min.apply(null, bl.map(function (p) { return p[0]; }));
      var cb = Math.max.apply(null, bl.map(function (p) { return p[1]; }));
      var h = cb - ct;
      if (h <= room) {
        // fits: centred under the bar. If the bar's edge then cuts the next-door section's last (or first) block,
        // slide within the slack this section leaves so that block clears the bar whole
        var c = ct - under - (room - h) / 2, lo = Math.min(c, cb - window.innerHeight + gap), hi = Math.max(c, ct - under - gap);
        for (var m = 0; m < 6; m++) {
          var cut = cutAt(c, all); if (!cut.length) break;
          var past = Math.max.apply(null, cut.map(function (p) { return p[1]; })) - under + 1;
          var before = Math.min.apply(null, cut.map(function (p) { return p[0]; })) - under - 1;
          if (past <= hi) c = past; else if (before >= lo) c = before; else break;
        }
        out.at.push(c); return;
      }
      var a = ct - under - gap, b = cb - window.innerHeight + gap;
      // move the lower stop on until the bar's edge falls between blocks, so a block it would cut goes under the
      // bar whole and the rows below it show in full
      for (var n = 0; n < 8; n++) {
        var cut = cutAt(b, bl); if (!cut.length) break;
        b = Math.max.apply(null, cut.map(function (p) { return p[1]; })) - under + 1;
      }
      out.at.push(a); if (b - a > 40 && b < cb - under) { out.at.push(b); out.free.push([a, b]); }
    });
    out.at = out.at.map(function (v) { return Math.min(max, Math.max(0, Math.round(v))); })
      .sort(function (a, b) { return a - b; });
    // the page top and the footer are stops of their own only when they are not (almost) a section's stop already
    if (out.at[0] > 40) out.at.unshift(0);
    if (max - out.at[out.at.length - 1] > 40) out.at.push(max);
    return out;
  }
  function go(y) {
    busy = true; goal = y; clearTimeout(guard);
    guard = setTimeout(function () { busy = false; }, 1200);   // in case the browser never reports the end
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  function step(dir) {
    var y = window.scrollY, at = stops().at, next = null;
    // within 40px of a stop counts as being on it, so a step never spends itself on a few pixels
    if (dir > 0) { for (var i = 0; i < at.length; i++) if (at[i] > y + 40) { next = at[i]; break; } }
    else { for (var j = at.length - 1; j >= 0; j--) if (at[j] < y - 40) { next = at[j]; break; } }
    if (next !== null) go(next);
  }
  function settle() { busy = false; clearTimeout(guard); }
  function snap() {
    if (down || busy) return;
    var y = window.scrollY, s = stops();
    if (s.free.some(function (f) { return y > f[0] && y < f[1]; })) return;
    var best = s.at.reduce(function (m, v) { return Math.abs(v - y) < Math.abs(m - y) ? v : m; }, s.at[0]);
    if (Math.abs(best - y) >= 2) go(best);
  }

  // one wheel gesture = one section, at once. A gesture is a run of wheel events less than 180ms apart; a trackpad's
  // fading inertia stays in the same gesture, a fresh flick (a clearly bigger delta) starts a new one.
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    var now = Date.now(), mag = Math.abs(e.deltaY), fresh = now - lastWheel > 180 || mag > lastMag * 1.6 + 4;
    lastWheel = now; lastMag = mag;
    if (!busy && fresh) step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    var t = e.target, k = e.key;
    if (e.altKey || e.ctrlKey || e.metaKey || (t && t.closest && t.closest('input, textarea, select, button, a, [contenteditable]'))) return;
    var dir = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) ? 1 : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    if (!busy) step(dir);
  });
  window.addEventListener('scrollend', function () { if (busy) settle(); });
  window.addEventListener('scroll', function () {
    if (busy) { if (Math.abs(window.scrollY - goal) < 1) settle(); return; }
    clearTimeout(idle); idle = setTimeout(snap, 200);
  }, { passive: true });
  window.addEventListener('pointerdown', function () { down = true; });
  window.addEventListener('pointerup', function () { down = false; clearTimeout(idle); idle = setTimeout(snap, 200); });
})();
