/* service 전용: 오늘의 미션 플로우 / 성장 슬라이더 */
(function () {
  'use strict';

  /* ---------- 08. 오늘의 미션 ---------- */
  var phone = document.getElementById('dayPhone');
  if (phone) {
    var DATA = {
      A: { title: '창문 열고 환기하기', meta: '약 5분 · 지금 시작할 수 있어요',
        desc: '지금은 밖으로 나가기보다 일상의 작은 리듬을 회복하는 것부터 시작해볼게요.',
        room: '방 안의 창문을 눌러<br>미션을 해보세요', tip: '창문을 눌러 보세요' },
      B: { title: '우체통 확인하기', meta: '약 10분 · 집 앞까지만 다녀와요',
        desc: '이제 집 밖과 조금씩 가까워지는 연습을 해볼게요. 문을 열고 우체통까지만 다녀와요.',
        room: '현관문을 눌러<br>미션을 해보세요', tip: '현관문을 눌러 보세요' }
    };
    var ORDER = ['home', 'room', 'cam', 'verify', 'done'];
    var mode = 'A', step = 0, timer = null;
    var screens = {};
    phone.querySelectorAll('.scr').forEach(function (s) { screens[s.getAttribute('data-s')] = s; });
    var dots = document.querySelectorAll('#dayDots i');
    var room = document.getElementById('miniRoom');
    var win = document.getElementById('miniWin');
    var door = document.getElementById('miniDoor');
    var tip = document.getElementById('miniTip');
    var pulse = document.getElementById('pulse');
    var miniChar = document.getElementById('miniChar');
    var $ = function (id) { return document.getElementById(id); };

    function applyMode() {
      var d = DATA[mode];
      $('mTitle').textContent = d.title; $('mMeta').textContent = d.meta; $('mDesc').textContent = d.desc;
      $('roomTxt').innerHTML = d.room; $('camTitle').textContent = d.title;
      room.setAttribute('data-mode', mode);
    }
    function go(n) {
      step = n;
      ORDER.forEach(function (k, i) { screens[k].classList.toggle('on', i === n); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === n); });
      var waiting = ORDER[n] === 'room';
      pulse.style.display = waiting ? '' : 'none';
      pulse.style.left = mode === 'A' ? '50%' : '83%';
      pulse.style.top = mode === 'A' ? '32%' : '70%';
      tip.textContent = waiting ? DATA[mode].tip : (n === 0 ? '‘활동 시작하기’를 누르면 미션을 시작할 수 있어요' : '');
      if (n === 0) { win.classList.remove('open'); door.classList.remove('open'); miniChar.src = 'assets/char/rest.png'; }
      if (ORDER[n] === 'verify') { timer = setTimeout(function () { go(4); }, 1700); }
      if (ORDER[n] === 'done') {
        miniChar.src = 'assets/char/cheer.png';
        count($('rw1'), 100); count($('rw2'), 20);
      }
    }
    function count(el, to) {
      var t0 = performance.now();
      (function f(t) { var p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    }
    function actOnRoom(which) {
      if (ORDER[step] !== 'room') { OREUM.toast(step === 0 ? '먼저 ‘활동 시작하기’를 눌러주세요' : '지금은 눌러도 변화가 없어요'); return; }
      if ((which === 'win' && mode !== 'A') || (which === 'door' && mode !== 'B')) { OREUM.toast(mode === 'A' ? '창문을 눌러 보세요' : '현관문을 눌러 보세요'); return; }
      (which === 'win' ? win : door).classList.add('open');
      miniChar.src = 'assets/char/hello.png';
      setTimeout(function () { go(2); }, 700);
    }
    $('btnStart').addEventListener('click', function () { go(1); });
    $('btnShot').addEventListener('click', function () { go(3); });
    $('btnAgain').addEventListener('click', function () { go(0); });
    [[win, 'win'], [door, 'door']].forEach(function (p) {
      p[0].addEventListener('click', function () { actOnRoom(p[1]); });
      p[0].addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actOnRoom(p[1]); } });
    });
    document.querySelectorAll('#abTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#abTabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        mode = b.getAttribute('data-mode'); clearTimeout(timer); applyMode(); go(0);
      });
    });
    applyMode(); go(0);
  }

})();
