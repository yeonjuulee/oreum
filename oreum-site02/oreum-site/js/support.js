/* support 전용: 운영 구조 순차 하이라이트 / 문의 버튼 */
(function () {
  'use strict';

  var flow = document.getElementById('flow');
  if (flow) {
    var nodes = flow.querySelectorAll('.node');
    var i = 0, running = false;
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting && !running) {
        running = true;
        setInterval(function () {
          nodes.forEach(function (n, k) { n.style.transform = k === i ? 'translateY(-10px) scale(1.03)' : ''; n.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1)'; });
          i = (i + 1) % nodes.length;
        }, 1400);
      }
    }, { threshold: .4 }).observe(flow);
  }

  var btn = document.getElementById('sponsorBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      OREUM.toast('메일 앱이 열려요 (임시 주소: hello@oreum.example)');
    });
  }
})();
