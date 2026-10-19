/* design 전용: 앱 화면 캐러셀 생성 */
(function () {
  'use strict';
  var box = document.getElementById('appScroll');
  if (!box) return;
  var C = 'assets/char/';
  var SCREENS = [
    ['홈', '<div class="app">oreum</div><h5>오늘도<br>한 걸음 올라가볼까요?</h5><div class="m-card"><div class="row"><img src="' + C + 'hello.png" alt=""><div><b>창문 열고 환기하기</b><span>약 5분</span></div></div></div><div class="m-btn">활동 시작하기</div>'],
    ['자가진단', '<div class="app">자가진단 1/3</div><h5>하루 중 씻거나<br>방을 정리하는 일은?</h5><div class="chips" style="flex-direction:column;margin-top:16px"><i>거의 하지 못해요</i><i class="on">며칠에 한 번 해요</i><i>대부분 하고 있어요</i></div><div class="m-btn">다음</div>'],
    ['자가진단 완료', '<div class="app">시작점</div><h5>지금의 시작점은<br><span class="hl">A</span> 단계예요</h5><img class="done-ch" src="' + C + 'rest.png" alt=""><div class="m-btn">미션 받기</div>'],
    ['미션 인증', '<div class="app">오름 인증</div><h5 style="font-size:16px">창문 열고 환기하기</h5><div class="cam"><img src="' + C + 'peek.png" alt=""></div><div class="shutter"><i></i></div>'],
    ['인증 완료', '<img class="done-ch" src="' + C + 'cheer.png" alt=""><h5 class="center">인증 완료!</h5><div class="reward-row">미션 리워드<b>+P</b></div><div class="reward-row">연속 보너스<b>+P</b></div><div class="m-btn">계속하기</div>'],
    ['연속 활동', '<div class="app">oreum</div><h5>7일째<br>이어가고 있어요</h5><img class="done-ch" src="' + C + 'hello.png" alt=""><div class="cal"><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i><i class="h"></i></div>'],
    ['챕터', '<div class="app">oreum</div><h5>챕터</h5><div class="m-card"><b>01 숨고르기</b></div><div class="m-card"><b>02 둘러보기</b></div><div class="m-card" style="opacity:.6"><b>03 마주하기</b></div><div class="m-card" style="opacity:.4"><b>04 도전하기</b></div>'],
    ['리워드', '<div class="app">oreum · 리워드</div><h5>움직인 만큼,<br>돌아와요</h5><div class="m-card" style="background:var(--orange);color:#fff"><span style="color:#fff">내 리워드</span><b style="font-size:24px">3,200P</b></div><div class="reward-row">위젯 설치 보너스<b>+15%</b></div><div class="reward-row">환급 모드<b>›</b></div>']
  ];
  box.innerHTML = SCREENS.map(function (s) {
    return '<figure class="item"><div class="phone"><div class="phone__bar"><span>9:41</span><span>●●●</span></div><div class="scr">' + s[1] + '</div></div><em>' + s[0] + '</em></figure>';
  }).join('');
})();
