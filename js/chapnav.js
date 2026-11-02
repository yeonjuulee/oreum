/* 스토리 챕터 진행바: 화면 왼쪽 가운데의 회색 점 7개(= 장면). 지금 챕터의 점만 살짝 길어지고, 그 챕터의 페이지를 넘길수록
   주황으로 채워짐. 점을 누르면 그 챕터의 첫 페이지로 이동. */
(function () {
  'use strict';
  var S = window.OreumStory; if (!S || !S.chapters) return;
  var CH = S.chapters, END = CH[CH.length - 1].start + CH[CH.length - 1].len - 0.0001;
  CH.forEach(function (c) { c.xs = c.beats.map(function (b) { return Math.min(END, c.start + b * c.len); }); });
  var topbar = document.getElementById('topbar');

  var nav = document.createElement('nav');
  nav.id = 'chapNav'; nav.setAttribute('aria-label', '챕터 이동');
  nav.innerHTML = '<ol>' + CH.map(function (c, i) {
    var n = ('0' + (i + 1)).slice(-2);
    return '<li><button type="button" class="cn-i" data-k="' + i + '" aria-label="' + (i + 1) + '. ' + c.name + ' 처음으로 (' + c.xs.length + '페이지)">' +
      '<span class="cn-n">' + n + '</span><span class="cn-t">' + c.name + '</span><span class="cn-c"></span>' +
      '<span class="cn-bar"><i></i></span><span class="cn-pg">' + c.xs.map(function () { return '<b></b>'; }).join('') + '</span></button></li>';
  }).join('') + '</ol><p class="cn-cur" aria-hidden="true"><b></b><span></span></p>';
  document.body.appendChild(nav);
  var items = [].slice.call(nav.querySelectorAll('.cn-i')), curName = nav.querySelector('.cn-cur b'), curCount = nav.querySelector('.cn-cur span');

  items.forEach(function (b) {
    b.addEventListener('click', function () { S.go(CH[+b.dataset.k].xs[0]); });
  });

  var last = '';
  S.onRender(function (P) {
    var key = P.toFixed(4) + (topbar && topbar.classList.contains('on-light'));
    if (key === last) return; last = key;
    nav.classList.toggle('light', !!(topbar && topbar.classList.contains('on-light')));
    nav.style.setProperty('--tbh', (topbar ? topbar.offsetHeight : 64) + 'px');
    CH.forEach(function (c, i) {
      var el = items[i], next = i < CH.length - 1 ? CH[i + 1].start : END + 1;
      var cur = P >= c.start - 1e-6 && P < next - 1e-6, done = P >= next - 1e-6;
      var a = c.xs[0], z = c.xs[c.xs.length - 1];
      var f = done ? 1 : !cur ? 0 : z > a ? Math.max(0, Math.min(1, (P - a) / (z - a))) : 1;
      var pg = 0; c.xs.forEach(function (x) { if (P >= x - 1e-3) pg++; });
      if (done) pg = c.xs.length;
      el.classList.toggle('cur', cur); el.classList.toggle('done', done);
      el.style.setProperty('--f', f.toFixed(4));
      el.style.setProperty('--pages', c.xs.length);
      [].forEach.call(el.querySelectorAll('.cn-pg b'), function (d, k) { d.classList.toggle('on', k < pg); });
      el.querySelector('.cn-c').textContent = Math.max(1, pg) + ' / ' + c.xs.length;
      if (cur) { el.setAttribute('aria-current', 'step'); curName.textContent = c.name; curCount.textContent = Math.max(1, pg) + ' / ' + c.xs.length; }
      else el.removeAttribute('aria-current');
    });
  });

  nav.classList.add('cn-e');
})();
