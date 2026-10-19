/* index 전용: 히어로 스크롤 스토리 + 블라인드 드래그 */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;
  var lines = Array.prototype.slice.call(hero.querySelectorAll('[data-line]'));
  var dots = hero.querySelectorAll('#heroDots i');
  var room = document.getElementById('room');
  var handle = document.getElementById('blindHandle');
  var charImg = document.getElementById('roomChar');
  var winEl = hero.querySelector('.window');

  var blind = 0, idx = -1, autoRaised = false, dragging = false, anim = null;

  function setBlind(v) {
    blind = Math.max(0, Math.min(1, v));
    room.style.setProperty('--blind', blind);
    hero.style.setProperty('--light', blind);
  }
  function animateTo(target) {
    cancelAnimationFrame(anim);
    (function step() {
      if (dragging) return;
      var d = target - blind;
      if (Math.abs(d) < 0.004) { setBlind(target); return; }
      setBlind(blind + d * 0.07);
      anim = requestAnimationFrame(step);
    })();
  }

  function show(i) {
    if (i === idx) return;
    idx = i;
    lines.forEach(function (el, n) {
      el.classList.toggle('on', n === i);
      el.classList.toggle('past', n < i);
    });
    dots.forEach(function (d, n) { d.classList.toggle('on', n === i); });
    var last = i === lines.length - 1;
    charImg.src = last ? 'assets/char/peek.png' : 'assets/char/rest.png';
    charImg.classList.toggle('peek', last);
    charImg.alt = last ? '창문을 바라보는 오르미' : '침대 위에 웅크린 오르미';
    if (last && blind < 0.99) { autoRaised = true; animateTo(1); }
    else if (!last && autoRaised) { autoRaised = false; animateTo(0); }
  }

  function progress() {
    var r = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / total));
    show(Math.min(lines.length - 1, Math.floor(p * lines.length * 0.9999)));
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  /* Enter / → / ↓ 로 다음 장면 */
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var r = hero.getBoundingClientRect();
    if (r.top > 40 || r.bottom < window.innerHeight) return;
    var total = hero.offsetHeight - window.innerHeight;
    var step = total / lines.length;
    var next = Math.min(lines.length, idx + 1);
    var y = hero.offsetTop + next * step + step * 0.25;
    window.scrollTo({ top: Math.min(y, hero.offsetTop + hero.offsetHeight), behavior: 'smooth' });
  });

  /* 블라인드 드래그 */
  var startY = 0, startBlind = 0;
  handle.addEventListener('pointerdown', function (e) {
    dragging = true; autoRaised = false;
    cancelAnimationFrame(anim);
    startY = e.clientY; startBlind = blind;
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  handle.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var h = winEl.clientHeight || 300;
    setBlind(startBlind + (startY - e.clientY) / h);
  });
  function end() { dragging = false; }
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  /* 키보드: 손잡이에 포커스 후 ↑/↓ */
  handle.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { setBlind(blind + 0.12); e.preventDefault(); }
    if (e.key === 'ArrowDown') { setBlind(blind - 0.12); e.preventDefault(); }
  });
})();
