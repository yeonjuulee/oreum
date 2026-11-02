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

/* SURVEY: answer the app's four questions on the phone; the screen thumbnails follow (the current one washed orange).
   일반군: 외출 4회 이상, 또는 3개월 미만·3~6개월(6개월 미만), 또는 어려움 없음.  A 일상 회복형: 외출 0~1회 + 대화 0~1회.
   B 외출 장벽형: 외출 2~3회 + 대화 2회 이상.  그 밖에는 외출 응답으로: 0~1회 → A, 2~3회 → B. */
(function () {
  'use strict';
  var form = document.getElementById('sqForm'); if (!form) return;
  var steps = [].slice.call(form.querySelectorAll('.sq-s')), prev = document.getElementById('sqPrev'), next = document.getElementById('sqNext');
  var fill = document.getElementById('sqFill'), load = document.getElementById('sqLoad'), res = document.getElementById('sqRes');
  var thumbs = [].slice.call(document.querySelectorAll('.sq-th')), cur = 0, timer = null;
  function val(n) { var e = form.querySelector('input[name="q' + n + '"]:checked'); return e ? e.value : null; }
  function judge() {
    var o = +val(1), t = +val(2), d = +val(3), y = val(4);
    if (o >= 4 || d < 6 || y === 'no') return 'G';
    if (o <= 1 && t <= 1) return 'A';
    if (o === 2 && t >= 2) return 'B';
    return o <= 1 ? 'A' : 'B';
  }
  var R = {
    A: { img: 'assets/service/survey-result-a.webp', pill: '챕터 1 · 숨 고르기', h: '지금은,<br>생활 리듬부터 다시 세울 때예요', sub: '거창한 목표 대신 하루에 하나씩,<br>집 안에서 할 수 있는 행동부터 시작해요', type: 'A 일상 회복형 · 첫 추천 서비스', rec: '<em>1-1</em>기본 자기관리', go: '숨 고르기 시작하기', href: '#sv-steps' },
    B: { img: 'assets/design/pose-run.webp', pill: '챕터 2 · 둘러보기', h: '지금은,<br>집 밖으로 한 걸음 내디딜 때예요', sub: '일상은 이어지고 있으니 1단계는 건너뛰고,<br>집 앞에서 할 수 있는 작은 외출부터 시작해요', type: 'B 외출 장벽형 · 첫 추천 서비스', rec: '<em>2-1</em>집 밖 접촉', go: '둘러보기 시작하기', href: '#sv-steps' },
    G: { img: 'assets/design/pose-cheek.webp', pill: '일반군', g: 1, h: '지금은 오름보다<br>지원 프로그램이 더 잘 맞아요', sub: 'A·B 유형에 해당하지 않아 일반군으로 분류돼요.<br>지역 청년센터의 지원 프로그램을 바로 이용해 보세요', type: '첫 추천 서비스', rec: '서비스 기준 미해당' }
  };
  function mark(k) { thumbs.forEach(function (t, i) { t.classList.toggle('on', i === k); t.disabled = !reachable(i); }); }
  function reachable(i) { for (var n = 1; n <= Math.min(i, 4); n++) if (!val(n)) return false; return true; }
  function show(k) {
    clearTimeout(timer); cur = k;
    var inQ = k < 4;
    form.hidden = !inQ; load.hidden = true; res.hidden = true;
    if (inQ) {
      steps.forEach(function (s, i) { s.hidden = i !== k; });
      fill.style.width = ((k + 1) * 25) + '%';
      prev.disabled = k === 0; next.disabled = !val(k + 1);
    } else {
      load.hidden = false;
      timer = setTimeout(function () {
        var r = R[judge()]; load.hidden = true; res.hidden = false;
        res.innerHTML = '<img src="' + r.img + '" alt=""><span class="pill' + (r.g ? ' g' : '') + '">' + r.pill + '</span><h4>' + r.h + '</h4><p class="sub">' + r.sub + '</p>' +
          '<div class="rec"><small>' + r.type + '</small><b>' + r.rec + '</b></div>' +
          (r.g ? '<button type="button" class="again solid">자가진단 다시하기</button>'      // 일반군: only the restart, as the main button
               : '<a class="go" href="' + r.href + '">' + r.go + '</a><button type="button" class="again">자가진단 다시하기</button>');
        res.querySelector('.again').addEventListener('click', function () { form.reset(); show(0); });
      }, 1600);
    }
    mark(k);
  }
  next.addEventListener('click', function () { if (val(cur + 1)) show(cur + 1); });
  prev.addEventListener('click', function () { if (cur > 0) show(cur - 1); });
  form.addEventListener('change', function () { next.disabled = !val(cur + 1); mark(cur); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  thumbs.forEach(function (t, i) { t.addEventListener('click', function () { if (reachable(i)) show(i); }); });
  show(0);
})();
