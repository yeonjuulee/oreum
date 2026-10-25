/* oreum service page — diagnostic progress, recommended step, and long-page navigation. */
(function () {
  'use strict';

  var form = document.getElementById('quiz');
  var out = document.getElementById('quizResult');
  var countEl = document.getElementById('quizCount');
  var backToTop = document.getElementById('backToTop');
  var topbar = document.getElementById('serviceTopbar');
  var skipLink = document.querySelector('.skip-link');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function selected(name) {
    var input = form && form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : null;
  }

  function answeredCount() {
    if (!form) return 0;
    return ['q1', 'q2', 'q3', 'q4'].filter(function (name) { return !!selected(name); }).length;
  }

  function updateProgress() {
    var count = answeredCount();
    if (countEl) countEl.textContent = String(count);
    if (form) form.dataset.complete = String(count === 4);
  }

  function clearRecommendation() {
    document.body.removeAttribute('data-recommended-step');
    if (form) delete form.dataset.result;
  }

  if (form && out) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var q1 = selected('q1');
      var q2 = selected('q2');
      var q3 = selected('q3');
      var q4 = selected('q4');
      if (!q1 || !q2 || !q3 || !q4) {
        out.textContent = '아직 답하지 않은 질문이 있어요. 네 질문 모두 골라 주세요.';
        return;
      }

      var step = q1 === 'low' ? '1' : '2';
      var stepName = step === '1' ? '1단계 숨고르기' : '2단계 둘러보기';
      var description = step === '1'
        ? '창문 열기처럼 아주 작은 일상부터, 내 속도로 다시 쌓아 봐요.'
        : '일상은 이어지고 있으니, 집 앞에서 시작하는 한 걸음부터 이어 가요.';

      document.body.dataset.recommendedStep = step;
      form.dataset.result = step;
      out.innerHTML = '<strong>' + stepName + '</strong>부터 시작해 보세요. ' + description +
        ' <a class="quiz-next" href="#step-' + step + '">' + stepName + ' 미션 보기 <span aria-hidden="true">→</span></a>';
      out.querySelector('.quiz-next').addEventListener('click', function () {
        var target = document.getElementById('step-' + step);
        window.setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
      });
    });

    form.addEventListener('change', function () {
      updateProgress();
      if (form.dataset.result) {
        clearRecommendation();
        out.textContent = '답변이 바뀌었어요. 시작점을 다시 확인해 볼까요?';
      } else if (out.textContent.indexOf('아직') === 0) {
        out.textContent = '네 질문에 답하면 시작할 계단을 알려드려요.';
      }
    });

    updateProgress();
  }

  if (skipLink) {
    skipLink.addEventListener('click', function () {
      window.setTimeout(function () { document.getElementById('main-content').focus({ preventScroll: true }); }, 0);
    });
  }

  function updateFloatingControls() {
    var show = window.scrollY > 520;
    if (backToTop) backToTop.classList.toggle('is-visible', show);
    if (topbar) topbar.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  window.addEventListener('scroll', updateFloatingControls, { passive: true });
  updateFloatingControls();
})();
