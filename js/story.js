/* story 전용: STORY 02 페이지 슬라이드 / 카운트업 / 돋보기 / 자가진단 / 램프 줄 / 스텝 폰 */
(function () {
  'use strict';

  /* ---------- 02. 페이지 단위 스토리텔링 ---------- */
  var pager = document.getElementById('pager');
  if (pager) {
    var stick = pager.querySelector('.pager__stick');
    var pgSlides = Array.prototype.slice.call(pager.querySelectorAll('.pg-slide'));
    var pgSteps = Array.prototype.slice.call(pager.querySelectorAll('.pg-step'));
    var pgDots = Array.prototype.slice.call(pager.querySelectorAll('.pager__dots button'));
    var pgCounter = document.getElementById('pgCount');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pgCur = -1;

    /* 카운트업: <span class="count-up" data-count="8">8</span>
       Page 4 슬라이드가 활성화될 때 1 → data-count 까지 차오르고,
       다른 페이지로 벗어나면 최종 값으로 되돌려 둡니다(다시 오면 재생). */
    var raf = 0, countTimer = 0;
    function runCountUp(el) {
      var to = parseInt(el.getAttribute('data-count'), 10) || 0;
      cancelAnimationFrame(raf); clearTimeout(countTimer);
      if (reduce) { el.textContent = to; return; }
      var from = 1, dur = 1500;
      el.textContent = from;
      countTimer = setTimeout(function () {
        var t0 = performance.now();
        (function frame(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.max(from, Math.round(from + (to - from) * e));
          if (p < 1) raf = requestAnimationFrame(frame);
          else el.textContent = to;
        })(t0);
      }, 450);
    }
    function resetCountUp(el) {
      cancelAnimationFrame(raf); clearTimeout(countTimer);
      el.textContent = parseInt(el.getAttribute('data-count'), 10) || 0;
    }

    function activate(i) {
      if (i === pgCur || i < 0) return;
      pgCur = i;
      pgSlides.forEach(function (s, n) {
        s.classList.toggle('is-active', n === i);
        s.classList.toggle('is-past', n < i);
        s.setAttribute('aria-hidden', n === i ? 'false' : 'true');
      });
      pgDots.forEach(function (d, n) { d.classList.toggle('on', n === i); d.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      stick.setAttribute('data-slide', i);
      pgCounter.textContent = (i + 1) + ' / ' + pgSlides.length;
      pager.querySelectorAll('.count-up').forEach(function (el) {
        if (pgSlides[i].contains(el)) runCountUp(el); else resetCountUp(el);
      });
    }

    function goTo(i) {
      i = Math.max(0, Math.min(pgSlides.length - 1, i));
      var top = pager.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + i * pgSteps[0].offsetHeight + 2, behavior: 'smooth' });
    }
    document.getElementById('pgPrev').addEventListener('click', function () { goTo(pgCur - 1); });
    document.getElementById('pgNext').addEventListener('click', function () { goTo(pgCur + 1); });
    pgDots.forEach(function (d, n) { d.addEventListener('click', function () { goTo(n); }); });
    window.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var r = pager.getBoundingClientRect();
      if (r.top > 2 || r.bottom < window.innerHeight - 2) return; // 슬라이드가 화면을 차지할 때만
      goTo(pgCur + (e.key === 'ArrowRight' ? 1 : -1));
    });

    activate(0);
    if ('IntersectionObserver' in window) {
      var pio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) activate(pgSteps.indexOf(en.target)); });
      }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
      pgSteps.forEach(function (s) { pio.observe(s); });
    }

    /* 오르미 SVG 부위별 인터랙션 훅 — 커스텀 SVG에 data-part 그룹을 만들면 자동 연결 */
    pager.querySelectorAll('.svg-slot [data-part]').forEach(function (part) {
      part.addEventListener('mouseenter', function () { part.classList.add('is-hover'); });
      part.addEventListener('mouseleave', function () { part.classList.remove('is-hover'); });
      part.addEventListener('click', function () {
        var slot = part.closest('.svg-slot');
        slot.dispatchEvent(new CustomEvent('ormi:part', { bubbles: true, detail: { part: part.getAttribute('data-part'), slot: slot.getAttribute('data-ormi-slot') } }));
      });
    });
  }

  /* ---------- 03. 도시 속 숨은 오르미 : 돋보기 탐색 ---------- */
  var ctSvg = document.getElementById('citySvg');
  if (ctSvg) {
    var NS = 'http://www.w3.org/2000/svg';
    var ctFar = document.getElementById('ctFar'), ctNear = document.getElementById('ctNear');
    var ctMarks = document.getElementById('ctMarks'), ctLens = document.getElementById('ctLens');
    var ctClip = document.getElementById('ctClip'), ctNote = document.getElementById('cityNote');
    var CT_W = 1200, CT_H = 440, CT_R = 96, CT_Z = 2.5;      // 장면 크기 / 돋보기 반지름 / 확대 배율
    var ctX = 220, ctY = 170, ctTouched = false, ctVisible = false;
    var ctFound = {}, ctCount = 0;

    ctNear.innerHTML = ctFar.innerHTML;                      // 선명한 확대용 복제본
    var ctRestFar = ctFar.querySelectorAll('.oz.rest');
    var ctRestNear = ctNear.querySelectorAll('.oz.rest');

    function ctPlace(x, y) {
      ctX = Math.max(0, Math.min(CT_W, x)); ctY = Math.max(0, Math.min(CT_H, y));
      ctClip.setAttribute('cx', ctX); ctClip.setAttribute('cy', ctY);
      ctLens.setAttribute('transform', 'translate(' + ctX + ' ' + ctY + ')');
      ctNear.setAttribute('transform', 'translate(' + (ctX * (1 - CT_Z)) + ' ' + (ctY * (1 - CT_Z)) + ') scale(' + CT_Z + ')');
      if (ctTouched) ctDetect();
    }
    function ctRing(parent, cx, cy) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'ct-ring'); c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', 30);
      parent.appendChild(c);
    }
    function ctDetect() {
      for (var i = 0; i < ctRestFar.length; i++) {
        if (ctFound[i]) continue;
        var cx = parseFloat(ctRestFar[i].getAttribute('data-cx')), cy = parseFloat(ctRestFar[i].getAttribute('data-cy'));
        if (Math.hypot(cx - ctX, cy - ctY) < 40) {
          ctFound[i] = true; ctCount++;
          ctRestFar[i].classList.add('found'); ctRestNear[i].classList.add('found');
          ctRing(ctMarks, cx, cy); ctRing(ctNear, cx, cy);
          ctNote.classList.add('found');
          ctNote.textContent = ctCount === 1
              ? '웅크리고 있는 오르미를 한 마리 발견했어요'
              : '웅크리고 있는 오르미 두 마리를 모두 발견했어요';
        }
      }
    }
    function ctToSvg(e) {
      var pt = ctSvg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = ctSvg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : null;
    }
    ctSvg.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;                  // 터치는 탭으로 이동 (가로 스크롤과 충돌 방지)
      var p = ctToSvg(e); if (!p) return; ctTouched = true; ctPlace(p.x, p.y);
    });
    ctSvg.addEventListener('pointerdown', function (e) {
      var p = ctToSvg(e); if (!p) return; ctTouched = true; ctPlace(p.x, p.y);
    });
    ctSvg.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: [-28, 0], ArrowRight: [28, 0], ArrowUp: [0, -28], ArrowDown: [0, 28] }[e.key];
      if (!d) return; e.preventDefault(); ctTouched = true; ctPlace(ctX + d[0], ctY + d[1]);
    });

    /* 아직 만지지 않았다면 돋보기가 도시 위를 천천히 훑으며 안내 (이때는 '발견' 처리 안 함) */
    new IntersectionObserver(function (en) { ctVisible = en[0].isIntersecting; }, { threshold: .25 }).observe(ctSvg);
    (function drift(t) {
      if (!ctTouched && ctVisible) ctPlace(600 + Math.sin(t * 0.00035) * 420, 190 + Math.sin(t * 0.0006) * 70);
      requestAnimationFrame(drift);
    })(0);
    ctPlace(ctX, ctY);
    if (window.matchMedia('(hover:none)').matches) ctNote.textContent = '좌우로 밀어 도시를 살피고, 눌러서 돋보기를 옮겨보세요';
  }

  /* ---------- 05. 자가진단 : assets/app 이미지 + 클릭 영역 ---------- */
  var diagShot = document.getElementById('diagShot');
  if (diagShot) {
    var APP = 'assets/app/', IW = 402, IH = 874;           // 이미지 원본 크기 (좌표 기준)
    var BTN_NEXT = [211, 766, 161, 56], BTN_PREV = [30, 766, 161, 56];
    var Q = [                                              // 스텝 1~4 : 이미지 / 옵션 라벨 / 옵션 줄의 y 좌표
      { img: '자가진단1.png', rows: [254, 320, 386, 452], opts: ['거의 하지 않음 (0회)', '1회', '2회~ 3회', '4회 이상'] },
      { img: '자가진단2.png', rows: [254, 320, 386, 452], opts: ['거의 하지 않음 (0회)', '1회', '2회~ 3회', '4회 이상'] },
      { img: '자가진단3.png', rows: [227, 293, 359],      opts: ['3개월 미만', '3개월 ~ 6개월', '6개월 이상'] },
      { img: '자가진단4.png', rows: [254, 320],           opts: ['예', '아니오'] }
    ];
    var RESULT_IMG = '자가진단_완료.png';
    var dAns = [-1, -1, -1, -1], dCur = 0, dSteps = [];
    function pos(x, y, w, h) {                             // 이미지 좌표 → % 위치
      return 'left:' + (x / IW * 100) + '%;top:' + (y / IH * 100) + '%;width:' + (w / IW * 100) + '%;height:' + (h / IH * 100) + '%';
    }
    function hs(cls, label, box, fn) {                     // 투명 버튼(클릭 영역)
      var b = document.createElement('button');
      b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); b.style.cssText = pos.apply(null, box);
      if (fn) b.addEventListener('click', fn);
      return b;
    }
    function mkStep(img) {
      var d = document.createElement('div'); d.className = 'dg-step';
      var im = document.createElement('img'); im.src = APP + img; im.alt = ''; im.draggable = false; d.appendChild(im);
      diagShot.appendChild(d); return d;
    }
    Q.forEach(function (q, qi) {
      var el = mkStep(q.img); dSteps.push(el);
      q.opts.forEach(function (label, oi) {
        var b = hs('dg-opt', label, [30, q.rows[oi], 342, 56], function () {
          dAns[qi] = oi;
          el.classList.add('has-sel');
          el.querySelectorAll('.dg-opt').forEach(function (o, i) { o.classList.toggle('on', i === oi); o.setAttribute('aria-pressed', i === oi); });
        });
        b.innerHTML = '<span class="dg-sel"><span class="dg-chk"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg></span><em>' + label + '</em></span>';
        b.setAttribute('aria-pressed', 'false');
        el.appendChild(b);
      });
      if (qi > 0) el.appendChild(hs('dg-btn', '이전', BTN_PREV, function () { dGo(dCur - 1); }));
      el.appendChild(hs('dg-btn', '다음', BTN_NEXT, function () {
        if (dAns[qi] < 0) {                                // 선택 전에는 넘어가지 않고 살짝 흔들어 안내
          OREUM.toast('하나를 골라주세요');
          el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return;
        }
        dGo(dCur + 1);
      }));
    });
    var res = mkStep(RESULT_IMG); dSteps.push(res);        // 작성 완료 → 결과 화면
    res.appendChild(hs('dg-btn', '숨 고르기 시작하기', [30, 738, 342, 56], function () {
      var t = document.getElementById('s06'); if (t) t.scrollIntoView({ behavior: 'smooth' });
    }));
    res.appendChild(hs('dg-btn', '자가진단 다시하기', [120, 804, 162, 28], function () {
      dAns = [-1, -1, -1, -1];
      dSteps.forEach(function (s) { s.classList.remove('has-sel'); s.querySelectorAll('.dg-opt').forEach(function (o) { o.classList.remove('on'); o.setAttribute('aria-pressed', 'false'); }); });
      dGo(0);
    }));
    function dGo(n) {
      dCur = Math.max(0, Math.min(dSteps.length - 1, n));
      dSteps.forEach(function (s, i) { s.classList.toggle('on', i === dCur); });
    }
    dGo(0);
  }

  /* ---------- 06. 램프 줄 ---------- */
  var lamp = document.getElementById('lamp');
  var pull = document.getElementById('pull'), pBtn = document.getElementById('pullBtn');
  if (lamp && pull) {
    var on = false, sy = 0, dragging = false;
    function toggle(v) {
      on = v; lamp.classList.toggle('lit', on);
      lamp.style.setProperty('--on', on ? 1 : 0);
    }
    pBtn.addEventListener('pointerdown', function (e) { dragging = true; sy = e.clientY; pBtn.setPointerCapture(e.pointerId); });
    pBtn.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var d = Math.max(0, Math.min(46, e.clientY - sy));
      pull.style.height = (90 + d) + 'px';
      if (d > 34 && !pull._fired) { pull._fired = true; toggle(!on); }
    });
    function release() { dragging = false; pull._fired = false; pull.style.transition = 'height .4s cubic-bezier(.3,1.6,.5,1)'; pull.style.height = '90px'; setTimeout(function () { pull.style.transition = ''; }, 420); }
    pBtn.addEventListener('pointerup', release);
    pBtn.addEventListener('pointercancel', release);
    pBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { toggle(!on); e.preventDefault(); } });
    /* 처음 한 번은 스크롤해서 보이면 자동으로 켜서 힌트 */
    var hinted = false;
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !hinted) { hinted = true; setTimeout(function () { if (!on) toggle(true); }, 1400); }
    }, { threshold: .6 }).observe(lamp);
  }

  /* ---------- 06. 스텝 리스트(왼쪽 스크롤) ↔ 폰 이미지(오른쪽 고정) ---------- */
  var list = document.getElementById('stepList');
  var sp = document.getElementById('stepPhone');
  if (list && sp) {
    var items = list.querySelectorAll('li');
    var shots = sp.querySelectorAll('.shot img');
    var dots = document.querySelectorAll('#stepDots i');
    var narrow = window.matchMedia('(max-width:980px)').matches;   // 모바일은 폰이 위에 고정되므로 판정선을 아래로
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(items, en.target);
        items.forEach(function (it, i) { it.classList.toggle('on', i === idx); });
        shots.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
        dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
      });
    }, { rootMargin: narrow ? '-64% 0px -24% 0px' : '-45% 0px -45% 0px', threshold: 0 });
    items.forEach(function (it) { sio.observe(it); });
  }

  /* ---------- 07. 연속 활동 : 성장 슬라이더 ---------- */
  var range = document.getElementById('gRange');
  if (range) {
    var stage = document.getElementById('growStage');
    var imgs = stage.querySelectorAll('img');
    var ticks = document.querySelectorAll('#gTicks span');
    var NAMES = ['웅크림', '빼꼼', '살며시', '펼침', '활짝'];
    var daysEl = document.getElementById('gDays'), nameEl = document.getElementById('gName');
    function stageOf(v) { return v >= 50 ? 4 : v >= 30 ? 3 : v >= 14 ? 2 : v >= 7 ? 1 : 0; }
    function update() {
      var v = parseInt(range.value, 10), s = stageOf(v);
      daysEl.textContent = v; nameEl.textContent = NAMES[s];
      stage.style.setProperty('--g', v / 50);
      range.style.setProperty('--p', (v / 50 * 100) + '%');
      imgs.forEach(function (im, i) { im.classList.toggle('on', i === s); });
      ticks.forEach(function (t, i) { t.classList.toggle('on', i === s); });
    }
    range.addEventListener('input', update);
    update();
  }
})();
