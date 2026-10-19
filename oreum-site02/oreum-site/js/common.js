/* oreum · 공통 스크립트 (모든 페이지에서 로드)
   - 네비게이션/푸터 주입 (수정은 이 파일 한 곳에서)
   - 스크롤 리빌, 숫자 카운트업, 진행 바, 커서 글로우, 틸트, 색상 복사
   - 페이지 스크립트에서 쓰는 헬퍼는 window.OREUM 으로 노출 */
(function () {
  'use strict';
  var PAGE = document.body.getAttribute('data-page') || '';
  var LINKS = [
    ['story', 'STORY', 'story.html'],
    ['service', 'SERVICE', 'service.html'],
    ['support', 'SUPPORT', 'support.html'],
    ['design', 'DESIGN', 'design.html']
  ];

  var SUN = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="6" fill="currentColor"/>' +
    '<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round">' +
    '<path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/></g></svg>';

  var nav = '<header class="nav" id="nav">' +
    '<a class="nav__logo" href="index.html" aria-label="oreum 홈">' + SUN + 'oreum</a>' +
    '<nav class="nav__links" aria-label="주요 메뉴">' +
    LINKS.map(function (l) {
      return '<a href="' + l[2] + '"' + (l[0] === PAGE ? ' class="on" aria-current="page"' : '') + '>' + l[1] + '</a>';
    }).join('') +
    '</nav><button class="nav__btn" aria-label="메뉴 열기" aria-expanded="false"><i></i><i></i></button></header>' +
    '<div class="progress"><i></i></div><div class="cursor-glow"></div><div class="toast" id="toast" role="status"></div>';

  var footer = '<footer class="footer"><div class="aurora"><i class="blob o" style="width:520px;height:520px;left:-10%;bottom:-40%;opacity:.35"></i>' +
    '<i class="blob p" style="width:380px;height:380px;right:-6%;bottom:-30%;opacity:.18"></i></div>' +
    '<div class="wrap"><div class="footer__top"><div class="footer__brand"><div class="logo">oreum</div><p>작은 움직임이, 다시 세상으로.</p></div>' +
    '<nav class="footer__nav"><a href="index.html">HOME</a>' +
    LINKS.map(function (l) { return '<a href="' + l[2] + '">' + l[1] + '</a>'; }).join('') + '</nav>' +
    '<div class="footer__src"><h6>자료 출처</h6><ul>' +
    '<li>국가데이터처 경제활동인구조사, 한국경영자총협회 재분석</li>' +
    '<li>한국직업능력연구원, 「쉬는 청년의 하루」</li>' +
    '<li>보건복지부·한국보건사회연구원, 「고립·은둔 청년 실태조사 연구」, 2023</li>' +
    '<li>국회예산정책처, NABO Focus 제85호 「고립·은둔 청년 지원사업 현황과 고려사항」</li>' +
    '<li>관계부처 합동, 「청년층 노동시장 유입 촉진방안」, 2023.11.15.</li>' +
    '<li>청년패널 분석 대상 6,022명, 2016~2023년 추적조사</li></ul></div></div>' +
    '<div class="footer__bot"><span>캡스톤디자인 · 팀 레츠기니</span><span>© oreum 2026</span></div></div></footer>';

  document.body.insertAdjacentHTML('afterbegin', nav);
  document.body.insertAdjacentHTML('beforeend', footer);

  var navEl = document.getElementById('nav');
  var btn = navEl.querySelector('.nav__btn');
  btn.addEventListener('click', function () {
    var open = navEl.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navEl.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', function () { navEl.classList.remove('open'); });
  });

  /* 진행 바 + 네비 상태 */
  var bar = document.querySelector('.progress i');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    navEl.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 토스트 */
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* 카운트업 */
  function countUp(el) {
    if (el._done) return;
    el._done = true;
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var dur = parseInt(el.getAttribute('data-dur') || '1600', 10);
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var t0 = performance.now();
    (function f(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* 스크롤 리빌 */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]:not(.count-up)').forEach(countUp);
      if (en.target.hasAttribute('data-count') && !en.target.classList.contains('count-up')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv,[data-count]:not(.count-up),.bar-cmp').forEach(function (el) { io.observe(el); });

  /* 커서 글로우 (마우스 환경에서만) */
  var glow = document.querySelector('.cursor-glow');
  if (window.matchMedia('(hover:hover)').matches) {
    var gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); });
    (function loop() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* 틸트 */
  document.querySelectorAll('[data-tilt]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-y * 8) + 'deg)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });

  /* 클릭하여 복사 */
  document.querySelectorAll('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function () {
      var v = el.getAttribute('data-copy');
      var done = function () { toast(v + ' 복사했어요'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, done);
      else done();
    });
  });

  /* 드래그 가로 스크롤 */
  document.querySelectorAll('[data-hscroll]').forEach(function (el) {
    var down = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;
      down = true; sx = e.clientX; sl = el.scrollLeft; el.classList.add('drag');
    });
    window.addEventListener('pointerup', function () { down = false; el.classList.remove('drag'); });
    window.addEventListener('pointermove', function (e) { if (down) el.scrollLeft = sl - (e.clientX - sx); });
  });

  window.OREUM = { toast: toast, countUp: countUp };
})();
