/* oreum story — one screen.
   Wheel / swipe / keys / buttons move a virtual position P along the whole story (no page scroll).
   P is split into scenes by data-len; the active scene gets a local progress p (0 → 1). */
(function () {
    'use strict';

    var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a || 0, v)); };
    var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
    var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.documentElement.classList.add('story-root');

    /* ---------- stage scaling ---------- */
    function fitStages() {
        $$('.stage-wrap').forEach(function (wrap) {
            var s = Math.min(wrap.clientWidth / 960, wrap.clientHeight / 540);
            wrap.querySelector('.stage').style.setProperty('--s', Math.max(0.2, s).toFixed(4));
        });
    }

    /* ======================================================
       01 HOOK: dots gather → school → stadium → Jeju → 4.7만 spill over
       (canvas keeps animating while this scene is on screen)
       ====================================================== */
    var cv = $('#dots'), ctx = cv.getContext('2d'), hks = $$('.hk'), hookN = $('#hookN');
    var hookScene = $('.scene-hook');
    var MAXP = 7170;
    var W = 0, H = 0, hookStage = 0, stageAt = 0, R = 14, la = 0, hookShownAt = 0;
    var seedH = 11;
    function rndH() { seedH = (seedH * 16807) % 2147483647; return seedH / 2147483647; }
    var HOOK_FONT = '"Pretendard", "Noto Sans KR", sans-serif';

    var STAGES = [
        { n: 0, r: 14 },
        { n: 1, r: 14 },
        { n: 1000, r: 2.6, shape: 'school', label: '1,000명 · 한 학교 전교생', legend: '● 1개 = 1명' },
        { n: 2400, r: 1.9, shape: 'stadium', label: '2.4만 명 · 잠실야구장 가득', legend: '● 1개 = 10명' },
        { n: 6700, r: 1.35, shape: 'jeju', label: '67만 명 · 제주도 전체 인구', legend: '● 1개 = 100명' },
        { n: 7170, r: 1.35, shape: 'jeju', spill: true, label: '67만 명 · 제주도 전체 인구', legend: '● 1개 = 100명' },
        { n: 7170, r: 1.35, shape: 'jeju', spill: true, dim: true },
        { n: 1, r: 1.35, shape: 'jeju', leave: true }            // 점들이 흩어지고 도희만 창문으로 이동
    ];
    var LEAVE_AT = 0.9;
    function stageOf(p) { return p < 0.05 ? 0 : p < 0.17 ? 1 : p < 0.35 ? 2 : p < 0.57 ? 3 : p < 0.79 ? 4 : p < 0.85 ? 5 : p < LEAVE_AT ? 6 : 7; }
    var hookP = 0, leaveFrom = null;

    var JEJU = [[-1, -.02], [-.97, -.12], [-.88, -.2], [-.76, -.26], [-.6, -.31], [-.4, -.36], [-.2, -.39], [0, -.41], [.2, -.4], [.4, -.37], [.58, -.33], [.72, -.3], [.84, -.3], [.93, -.34], [.99, -.27], [.98, -.17], [.92, -.08], [.84, .02], [.7, .14], [.52, .24], [.32, .32], [.12, .37], [-.08, .39], [-.28, .37], [-.48, .32], [-.66, .25], [-.82, .17], [-.94, .09]];
    function inPoly(x, y, P, k) {
        k = k || 1;
        var c = false;
        for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
            var xi = P[i][0] * k, yi = P[i][1] * k, xj = P[j][0] * k, yj = P[j][1] * k;
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
        }
        return c;
    }
    var HOME = [0, .62];
    function segDist(px_, py_, ax, ay, bx, by) {
        var dx = bx - ax, dy = by - ay, t = clamp(((px_ - ax) * dx + (py_ - ay) * dy) / (dx * dx + dy * dy));
        return Math.hypot(px_ - ax - t * dx, py_ - ay - t * dy);
    }
    function fieldDist(x, y) {
        var dx = x - HOME[0], dy = y - HOME[1], r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        if (a <= -Math.PI / 4 && a >= -3 * Math.PI / 4) return r - 1;
        var c = Math.SQRT1_2;
        return Math.min(segDist(x, y, HOME[0], HOME[1], HOME[0] - c, HOME[1] - c), segDist(x, y, HOME[0], HOME[1], HOME[0] + c, HOME[1] - c));
    }
    function inStadium(x, y) { var d = fieldDist(x, y); return d > .07 && d < .42 && y < .95; }
    function sample(n, test, box, anchor) {
        var out = [], guard = 0;
        while (out.length < n && guard++ < n * 600) {
            var x = box[0] + rndH() * (box[2] - box[0]), y = box[1] + rndH() * (box[3] - box[1]);
            if (test(x, y)) out.push([x, y]);
        }
        out.sort(function (a, b) { return a[0] - b[0]; });
        var best = 0, bd = 1e9;
        out.forEach(function (q, i) { var d = Math.hypot(q[0] - anchor[0], q[1] - anchor[1]); if (d < bd) { bd = d; best = i; } });
        var tmp = out[0]; out[0] = out[best]; out[best] = tmp;   // 도희(0번)는 눈에 띄는 자리로
        return out;
    }
    var SHAPES = {
        school: (function () { var o = []; for (var j = 0; j < 20; j++) for (var i = 0; i < 50; i++) o.push([-.8 + i * (1.6 / 49), -.3 + j * (.6 / 19)]); var t = o[0]; o[0] = o[525]; o[525] = t; return o; })(),
        stadium: sample(2400, inStadium, [-1.2, -.85, 1.2, .95], [0, -.6]),
        jeju: sample(6700, function (x, y) { return inPoly(x, y, JEJU); }, [-1, -.42, 1, .4], [0, 0]),
        spill: sample(470, function (x, y) { return x > .15 && inPoly(x, y, JEJU, 1.2) && !inPoly(x, y, JEJU, 1.04); }, [-.2, -.5, 1.25, .5], [1, 0])
    };
    var dpx = new Float32Array(MAXP), dpy = new Float32Array(MAXP), dpa = new Float32Array(MAXP);
    var outPos = [], spd = new Float32Array(MAXP), ph = new Float32Array(MAXP);
    for (var di = 0; di < MAXP; di++) { var ang = rndH() * 6.2832; outPos.push([Math.cos(ang) * 2.6, Math.sin(ang) * 2.6]); spd[di] = .045 + rndH() * .05; ph[di] = rndH() * 6.2832; }
    var hcx = 0, hcy = 0, HB = 1;

    function sizeHook() {
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        W = cv.clientWidth; H = cv.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var wide = W > 760;
        hcx = wide ? W * .66 : W / 2; hcy = wide ? H * .45 : H * .3;
        HB = wide ? Math.min(W * .26, H * .38) : Math.min(W * .4, H * .2);
        for (var i = 0; i < MAXP; i++) if (dpa[i] < .01) { dpx[i] = hcx + outPos[i][0] * HB * 2; dpy[i] = hcy + outPos[i][1] * HB * 2; }
    }
    function dotTarget(i, st) {
        var S = STAGES[st];
        if (i >= S.n) return null;
        if (st === 1) return [0, 0];
        if (S.spill && i >= 6700) return SHAPES.spill[i - 6700];
        return SHAPES[S.shape][i];
    }
    function hookLabel(txt, legend, x, y, a) {
        ctx.font = '700 14px ' + HOOK_FONT;
        var tw = ctx.measureText(txt).width;
        ctx.font = '600 12px ' + HOOK_FONT;
        var lw = legend ? ctx.measureText(legend).width + 14 : 0;
        ctx.fillStyle = 'rgba(23,19,15,' + (.85 * a) + ')';
        ctx.fillRect(x - 2, y - 20, tw + lw + 18, 26);
        ctx.font = '700 14px ' + HOOK_FONT;
        ctx.fillStyle = 'rgba(255,233,217,' + a + ')';
        ctx.fillText(txt, x + 7, y - 2);
        if (legend) { ctx.font = '600 12px ' + HOOK_FONT; ctx.fillStyle = 'rgba(255,170,110,' + a + ')'; ctx.fillText(legend, x + tw + 21, y - 2); }
    }

    // 1층 창문(캐릭터 자리)의 화면 좌표 — 캔버스는 화면 전체를 덮으므로 그대로 쓴다
    function windowSpot() {
        var w = $('.u-a .w').getBoundingClientRect();
        return { x: w.left + w.width / 2, y: w.top + w.height / 2, size: w.width };
    }

    function drawHook(now) {
        var S = STAGES[hookStage];
        // 떠나는 단계: 도희의 위치는 스크롤 진행도로 직접 정한다 (제주 위 자리 → 1층 창문)
        var leaveT = 0, spot = null;
        if (S.leave) {
            leaveFrom = { x: hcx + SHAPES.jeju[0][0] * HB, y: hcy + SHAPES.jeju[0][1] * HB };   // 제주 위 도희 자리
            spot = windowSpot();
            leaveT = ease(seg(hookP, LEAVE_AT + 0.02, 1));
            dpx[0] = lerp(leaveFrom.x, spot.x, leaveT);
            dpy[0] = lerp(leaveFrom.y, spot.y, leaveT);
        } else {
            leaveFrom = null;
        }
        R += (S.r * clamp(HB / 360, .6, 1) - R) * .08;
        la += ((now - stageAt > 700 ? 1 : 0) - la) * .08;
        ctx.clearRect(0, 0, W, H);

        if (S.shape === 'stadium') {
            var c = Math.SQRT1_2, X = function (u) { return hcx + u * HB; }, Y = function (v) { return hcy + v * HB; };
            ctx.strokeStyle = 'rgba(255,106,0,' + (.45 * la) + ')'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(X(HOME[0] - c), Y(HOME[1] - c)); ctx.lineTo(X(HOME[0]), Y(HOME[1])); ctx.lineTo(X(HOME[0] + c), Y(HOME[1] - c));
            ctx.arc(X(HOME[0]), Y(HOME[1]), HB, -Math.PI / 4, -3 * Math.PI / 4, true);
            ctx.stroke();
            var d = .3;
            ctx.beginPath();
            ctx.moveTo(X(0), Y(HOME[1])); ctx.lineTo(X(d), Y(HOME[1] - d)); ctx.lineTo(X(0), Y(HOME[1] - 2 * d)); ctx.lineTo(X(-d), Y(HOME[1] - d)); ctx.closePath();
            ctx.stroke();
        }
        if (S.shape === 'jeju' && !S.leave) {
            ctx.strokeStyle = 'rgba(255,106,0,' + (.35 * la) + ')'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            JEJU.forEach(function (q, i) { var x = hcx + q[0] * HB * 1.02, y = hcy + q[1] * HB * 1.02; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
            ctx.closePath(); ctx.stroke();
        }

        // 도희 주변의 은은한 빛 (숨 쉬듯 커졌다 작아짐)
        if (dpa[0] > .02) {
            var gx = dpx[0], gy = dpy[0], pulse = .5 + .5 * Math.sin(now / 650);
            var gr = Math.max(R * 2.2, 10) * (3.2 + pulse * 1.2) + (S.dim ? 24 : 0);
            if (spot) gr = lerp(gr, spot.size * 1.3, leaveT);     // 창문 크기만큼 빛이 넓어지며 도착
            var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
            glow.addColorStop(0, 'rgba(255,140,50,' + (.45 * dpa[0]) + ')');
            glow.addColorStop(.45, 'rgba(255,106,0,' + (.18 * dpa[0]) + ')');
            glow.addColorStop(1, 'rgba(255,106,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill();
        }

        var wob = R > 6 ? 0 : .7, t = now * .0012;
        ctx.fillStyle = 'rgba(255,233,217,.85)';
        ctx.beginPath();
        var solo = [];
        for (var i = 0; i < MAXP; i++) {
            var tg = dotTarget(i, hookStage);
            var tx = hcx + (tg ? tg[0] : outPos[i][0]) * HB, ty = hcy + (tg ? tg[1] : outPos[i][1]) * HB;
            var k = reduced ? 1 : spd[i];
            if (!(S.leave && i === 0)) { dpx[i] += (tx - dpx[i]) * k; dpy[i] += (ty - dpy[i]) * k; }
            dpa[i] += ((tg ? 1 : 0) - dpa[i]) * (reduced ? 1 : .07);
            if (dpa[i] < .02) continue;
            var x = dpx[i] + Math.sin(t + ph[i]) * wob, y = dpy[i] + Math.cos(t * .9 + ph[i]) * wob;
            if (i === 0 || (S.spill && i >= 6700) || dpa[i] < .95 || S.dim) { solo.push(i, x, y); continue; }
            ctx.rect(x - R, y - R, R * 2, R * 2);
        }
        ctx.fill();
        for (var s = 0; s < solo.length; s += 3) {
            var si = solo[s], sx = solo[s + 1], sy = solo[s + 2];
            var a = dpa[si], col = '255,233,217';
            if (si === 0) col = '255,106,0';
            else if (S.spill && si >= 6700) col = '255,178,122';
            if (S.dim && si !== 0) a *= .22;
            ctx.fillStyle = 'rgba(' + col + ',' + a + ')';
            if (si === 0 || R > 4) { ctx.beginPath(); ctx.arc(sx, sy, si === 0 ? Math.max(R, 2.2) : R, 0, 6.2832); ctx.fill(); }
            else ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
        }

        if (S.label && la > .02) {
            var top = { school: -.3, stadium: -.85, jeju: -.42 }[S.shape];
            var left = { school: -.8, stadium: -1.1, jeju: -1 }[S.shape];
            hookLabel(S.label, S.legend, hcx + left * HB, hcy + top * HB - 12, la);
            if (S.spill) hookLabel('+ 4.7만 명 · 섬에 다 담기지 못해요', '', Math.min(W - 270, hcx + .3 * HB), hcy + .62 * HB, la);
        }

        if (dpa[0] > .02) {
            var x0 = dpx[0], y0 = dpy[0], rr = Math.max(R * 2.2, 10) + (S.dim ? 14 : 0);
            ctx.strokeStyle = 'rgba(255,106,0,' + dpa[0] + ')'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(x0, y0, rr, 0, 6.2832); ctx.stroke();
            if (hookStage <= 2 || S.dim || (S.leave && leaveT < .6)) {
                ctx.font = '800 15px ' + HOOK_FONT; ctx.fillStyle = '#fff';
                ctx.fillText('도희', x0 + rr + 8, y0 + 5);
            }
        }
    }

    // 숫자: 진행도에 맞춰 점 수 × 점 1개가 나타내는 사람 수로
    var KP = [[0, 0], [.05, 0], [.07, 1], [.17, 1], [.23, 1000], [.35, 1000], [.41, 24000], [.57, 24000], [.65, 670000], [.79, 670000], [.85, 717000], [1, 717000]];
    function countAt(p) {
        for (var i = 1; i < KP.length; i++) if (p <= KP[i][0]) {
            var p0 = KP[i - 1][0], a = KP[i - 1][1], p1 = KP[i][0], b = KP[i][1], f = ease(clamp((p - p0) / (p1 - p0 || 1)));
            return Math.round(a > 0 ? a * Math.pow(b / a, f) : a + (b - a) * f);
        }
        return 717000;
    }
    function fmt(n) { if (n < 10000) return n.toLocaleString('ko-KR'); var v = Math.floor(n / 1000) / 10; return (v % 1 ? v.toFixed(1) : v.toFixed(0)) + '만'; }

    var hkShown = -1;
    function updateHook(scene, p) {
        hookP = p;
        scene.classList.toggle('leaving', p >= LEAVE_AT);
        var st = stageOf(p);
        if (st !== hookStage) { hookStage = st; stageAt = performance.now(); la = 0; }
        if (st !== hkShown) { hkShown = st; hks.forEach(function (e) { e.classList.toggle('on', e.dataset.k === String(st)); }); }
        var txt = fmt(countAt(p));
        if (hookN.textContent !== txt) hookN.textContent = txt;
        hookShownAt = performance.now();
    }

    // the canvas only draws while the hook scene is visible (plus its fade-out)
    function hookLoop(now) {
        if (hookScene.classList.contains('active') || now - hookShownAt < 900) drawHook(now);
        requestAnimationFrame(hookLoop);
    }

    /* ======================================================
       S00–S02 apartment: camera moves to each window
       ====================================================== */
    var CAM = [
        { z: 1, tx: 0, ty: 10 },
        { z: 2.2, tx: 480 - 480 * 2.2, ty: 290 - 452 * 2.2 },
        { z: 2.2, tx: 480 - 480 * 2.2, ty: 290 - 364 * 2.2 }
    ];
    function updateBuilding(scene, p) {
        var ph = p < 0.3 ? 0 : (p < 0.65 ? 1 : 2);
        if (scene.dataset.phase !== String(ph)) {
            scene.dataset.phase = ph;
            var apt = $('#apt');
            apt.style.setProperty('--z', CAM[ph].z);
            apt.style.setProperty('--tx', CAM[ph].tx + 'px');
            apt.style.setProperty('--ty', CAM[ph].ty + 'px');
        }
    }

    /* ======================================================
       S03–S04 wall: the oreum symbol flies in and hits the wall,
       the wall shakes and collapses, only the staircase stays
       ====================================================== */
    /* 20 × 16 pixel tiles (24px). Step s (0–4) = columns 4s–4s+3, 3(s+1) tiles high.
       Steps 0–3 = 1~4단계, step 4 = the landing where the 청년 지원 프로그램 door stands. */
    var GROUND = 500, B = 24, COLS = 20, ROWS = 16, X0 = 360;
    var WALL_TONES = ['#2F2723', '#362D28', '#3D332C', '#2A231F'];
    var STEP_TONES = [
        ['#B8430A', '#C9500F', '#D85A12', '#A63A08'],
        ['#E85D04', '#FF6A00', '#F27A1E', '#FF7A14'],
        ['#FF8A3D', '#FF9A52', '#FFA766', '#FF8F45'],
        ['#FFB27A', '#FFC294', '#FFD3B0', '#FFBB88'],
        ['#FFE9D9', '#FFF1E6', '#FFDCC2', '#FFE4CF']
    ];
    var blocksEl = $('#blocks');
    var blocks = [];
    (function buildBlocks() {
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                var stepIdx = Math.floor(c / 4);
                var keep = r < 3 * (stepIdx + 1);
                var seed = (r * 31 + c * 17 + r * c) % 23;
                var d = document.createElement('div');
                d.className = 'blk' + (keep ? ' keep' : '');
                d.style.setProperty('--wc', WALL_TONES[seed % 4]);
                if (keep) d.style.setProperty('--sc', STEP_TONES[stepIdx][(seed * 7) % 4]);
                blocksEl.appendChild(d);
                blocks.push({
                    el: d, r: r, c: c, keep: keep, step: stepIdx,
                    x: X0 + c * B, y: GROUND - B * (r + 1),
                    delay: (ROWS - r) * 0.03 + seed * 0.008,
                    drift: (seed - 11) * 4,
                    spin: (seed - 11) * 9
                });
            }
        }
    })();

    var HIT = { x: 410, y: 300 };                 // where the symbol strikes the wall
    var FLY_FROM = { x: -120, y: 40 };
    var DOOR_X = X0 + 18 * B - 22;                 // door (44px wide) centred on the landing step (cols 16–19)

    // camera move at the end: 1·2단계 grow until they match the step-1 scene (scale ×2.14)
    var ZOOM = { s: 2.14, tx: 620 - 456 * 2.14, ty: 420 - 428 * 2.14 };

    function updateWall(scene, pRaw) {
        var p = clamp(pRaw / 0.88);                  // wall story runs on the first 88%
        var zoom = ease(seg(pRaw, 0.9, 1));          // last 10%: zoom into 1·2단계
        var cam = $('#wallCam');
        cam.style.transform = 'translate(' + (ZOOM.tx * zoom).toFixed(1) + 'px,' + (ZOOM.ty * zoom).toFixed(1) + 'px) scale(' + lerp(1, ZOOM.s, zoom).toFixed(4) + ')';
        var fadeOut = 1 - seg(zoom, 0, 0.5);
        $('#wallOru').style.opacity = fadeOut;
        $('#wallOru2').style.opacity = fadeOut;
        $('.corner', scene).style.opacity = fadeOut;
        $('#stepLabels').style.opacity = p > 0.92 ? fadeOut : 0;

        var built = seg(p, 0.02, 0.3) * blocks.length;
        var fly = seg(p, 0.5, 0.6);                  // symbol flies in
        var hit = seg(p, 0.6, 0.68);                 // impact: shake + crack
        var fallT = seg(p, 0.68, 0.88);              // non-stair tiles fall
        var shake = (p >= 0.6 && p < 0.68) ? Math.sin(p * 1400) * 7 * (1 - hit) : 0;

        blocks.forEach(function (b, i) {
            var appear = clamp(built - i);
            var x = b.x + shake, y = b.y - (1 - appear) * 24, r = 0, o = appear;
            if (!b.keep) {
                if (hit > 0 && fallT === 0) { x += Math.sin(i * 1.7 + p * 420) * 2.4; y += Math.cos(i * 2.3 + p * 380) * 1.2; }
                var t = clamp((fallT - b.delay * 0.6) / 0.45);
                if (t > 0) {
                    y = b.y + 520 * t * t;
                    x = b.x + b.drift * t;
                    r = b.spin * t;
                    o = 1 - seg(t, 0.5, 1);
                }
            }
            b.el.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + r + 'deg)';
            b.el.style.opacity = o;
            if (b.keep) b.el.classList.toggle('lit', p > 0.86 + b.step * 0.015);
        });

        // door: appears on top of the wall, then settles onto the landing step as the top row falls away
        var door = $('#wallDoor');
        var doorIn = seg(p, 0.27, 0.32);
        var doorY = lerp(52, 76, ease(seg(fallT, 0, 0.35))) - (1 - doorIn) * 24;
        door.style.opacity = doorIn * fadeOut;
        door.style.transform = 'translate(' + (DOOR_X + shake) + 'px,' + doorY + 'px)';

        // oreum symbol: flies in on an arc, strikes the wall, bounces back and fades
        var sym = $('#wallSymbol');
        if (p < 0.5 || p > 0.74) {
            sym.style.opacity = 0;
        } else {
            var sx, sy, rot, sc = 1, so = 1;
            if (fly < 1) {
                var f = fly * fly;                       // accelerates into the wall
                sx = lerp(FLY_FROM.x, HIT.x, f);
                sy = lerp(FLY_FROM.y, HIT.y, f) - Math.sin(fly * Math.PI) * 90;
                rot = 720 * fly;
            } else {
                var bk = ease(seg(p, 0.6, 0.7));
                sx = HIT.x - 60 * bk; sy = HIT.y - 50 * bk + 30 * bk * bk;
                rot = 720 + 40 * bk; sc = 1 + 0.25 * bk; so = 1 - seg(p, 0.66, 0.74);
            }
            sym.style.opacity = so;
            sym.style.transform = 'translate(' + (sx - 35) + 'px,' + (sy - 35) + 'px) rotate(' + rot + 'deg) scale(' + sc + ')';
        }

        // impact ring
        var ring = $('#impact');
        if (hit > 0 && hit < 1) {
            ring.style.opacity = 1 - hit;
            ring.style.transform = 'translate(' + (HIT.x - 40) + 'px,' + (HIT.y - 40) + 'px) scale(' + (0.4 + hit * 2.6) + ')';
        } else {
            ring.style.opacity = 0;
        }

        $('#statMin').textContent = Math.round(282 + 90 * seg(p, 0.06, 0.3));
        $('#stats').classList.toggle('off', p >= 0.5);
    }

    /* ======================================================
       S05–S07 step 1: thin layers against the next step
       ====================================================== */
    var MISSIONS = ['창문 열고 환기', '양치하기', '8시 기상', '샤워하기', '방 정리', '간단한 요리', '가족과 사진'];
    var S1 = { ground: 420, riser: 620, pitch: 22, left0: 140, dx: 62 };
    // one ramp, darkest at the bottom → lightest at the top (like light rising)
    /* one continuous colour ramp for the whole staircase (S05–S08).
       Level 0 = 1단계 tread, 1 = 2단계, 2 = 3단계, 3 = 4단계. Big steps and the thin layers between them
       take the colour of their own height, so the stairs read as separate steps but one gradient. */
    var RAMP = [[0xB0, 0x40, 0x08], [0xF2, 0x63, 0x10], [0xFF, 0x96, 0x4C], [0xFF, 0xC8, 0x9C]];
    function rampRGB(L) {
        L = clamp(L, 0, RAMP.length - 1);
        var i = Math.min(RAMP.length - 2, Math.floor(L)), f = L - i;
        return RAMP[i].map(function (v, j) { return Math.round(lerp(v, RAMP[i + 1][j], f)); });
    }
    function rampColor(L, darken) {
        var c = rampRGB(L), k = 1 - (darken || 0);
        return 'rgb(' + c.map(function (v) { return Math.round(v * k); }).join(',') + ')';
    }
    function rampText(L) { var c = rampRGB(L); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 150 ? '#FFF1E6' : '#2A1608'; }
    function paintStep(el, L) {                     // big step: its level colour, a touch darker toward the ground
        el.style.background = 'linear-gradient(180deg, ' + rampColor(L) + ' 0%, ' + rampColor(L, 0.14) + ' 100%)';
    }
    var slabsEl = $('#slabs');
    MISSIONS.forEach(function (m, k) {
        var d = document.createElement('div');
        d.className = 'slab pending';
        d.style.left = (S1.left0 + k * S1.dx) + 'px';
        d.style.width = (S1.riser - S1.left0 - k * S1.dx) + 'px';
        d.style.top = (S1.ground - (k + 1) * S1.pitch) + 'px';
        var lv = (k + 1) / (MISSIONS.length + 1);      // between 1단계 (0) and 2단계 (1)
        d.style.setProperty('--c', rampColor(lv));
        d.style.setProperty('--tc', rampText(lv));
        d.innerHTML = '<span class="habit">' + m + '</span>';
        slabsEl.appendChild(d);
    });
    var slabEls = $$('.slab', slabsEl);
    var stepOru = $('#stepOru');

    // big steps as tiles: the wall grid (24px from x=360, ground y=500) after the ×2.14 zoom
    (function buildBigTiles() {
        var box = $('#bigTiles'), P = B * ZOOM.s;
        var x0 = X0 * ZOOM.s + ZOOM.tx, ground = GROUND * ZOOM.s + ZOOM.ty;
        for (var k = -Math.ceil(x0 / P); x0 + k * P < 960; k++) {
            var x = x0 + k * P, step = x < 619 ? 0 : 1, rows = step === 0 ? 3 : 6;
            for (var r = 0; r < rows; r++) {
                var seed = Math.abs((r * 31 + k * 17 + r * k) % 23);
                var t = document.createElement('span');
                t.className = 'btile';
                t.style.left = x.toFixed(1) + 'px';
                t.style.top = (ground - P * (r + 1)).toFixed(1) + 'px';
                t.style.setProperty('--sc', STEP_TONES[step][(seed * 7) % 4]);
                t.dataset.fade = (0.02 + ((seed * 13 + Math.abs(k) * 5) % 23) / 23 * 0.12).toFixed(3);   // each tile dissolves at its own moment
                box.appendChild(t);
            }
        }
    })();
    var lastStage1Img = 1;

    function step1Count(p) {
        if (p < 0.06) return 0;
        if (p < 0.42) return Math.min(4, 1 + Math.floor(seg(p, 0.06, 0.42) * 4));
        if (p < 0.58) return 4;
        return Math.min(7, 5 + Math.floor(seg(p, 0.58, 0.78) * 3));
    }

    paintStep($('.solid-1'), 0);
    paintStep($('.solid-2'), 1);
    var bTiles = null;
    function updateStep1(scene, p) {
        // tiles dissolve one by one into the solid gradient steps
        if (!bTiles) bTiles = $$('.btile', scene);
        bTiles.forEach(function (t) { t.style.opacity = (1 - seg(p, +t.dataset.fade, +t.dataset.fade + 0.03)).toFixed(3); });
        var n = step1Count(p);
        var resting = p >= 0.42 && p < 0.58;
        var top = p >= 0.8;
        slabEls.forEach(function (el, k) {
            el.classList.toggle('pending', k >= n);
            el.classList.toggle('named', p >= 0.84);
        });

        var x, y;
        if (top) { x = 700; y = S1.ground - 7 * S1.pitch; }
        else if (n === 0) { x = 50; y = S1.ground; }
        else { x = S1.left0 + (n - 1) * S1.dx + 10; y = S1.ground - n * S1.pitch; }
        stepOru.style.left = x + 'px';
        stepOru.style.top = y + 'px';
        stepOru.style.setProperty('--flip', p >= 0.84 ? -1 : 1);

        var want = p >= 0.9 ? 2 : 1;
        if (want !== lastStage1Img) { stepOru.src = 'assets/oreumi-' + want + '.png'; lastStage1Img = want; }

        scene.classList.toggle('resting', resting);
        var zz = $('.zz', scene);
        zz.style.left = (x + 70) + 'px';
        zz.style.top = (y - 70) + 'px';

        $('#mcLabel').textContent = resting ? '오늘은 쉬는 날' : (n === 0 ? '오늘의 미션' : '미션 ' + n + ' 클리어');
        $('#mcName').textContent = resting ? '쌓은 층 4개, 그대로' : MISSIONS[Math.max(0, n - 1)];
        $('#mcPoint').textContent = n === 0 ? '+1,000P' : '누적 ' + (n * 1000).toLocaleString('ko-KR') + 'P';
        $('#missionCard').style.opacity = top ? 0 : 1;

        var days = n + (p >= 0.42 ? 1 : 0);
        $('#dday').textContent = top ? '1단계 완료' : (resting ? 'D+' + days + ' · 쉬는 날' : 'D+' + days);
        $('#compare').classList.toggle('on', p >= 0.9);
    }

    /* ======================================================
       S08 montage
       ====================================================== */
    var mSlabsEl = $('#mSlabs');
    var M = [{ ground: 430, riser: 360, left0: 50, level: 1 }, { ground: 320, riser: 660, left0: 380, level: 2 }];
    M.forEach(function (g) {
        for (var k = 0; k < 5; k++) {
            var d = document.createElement('div');
            d.className = 'slab pending';
            d.style.left = (g.left0 + k * 54) + 'px';
            d.style.width = (g.riser - g.left0 - k * 54) + 'px';
            d.style.top = (g.ground - (k + 1) * 22) + 'px';
            var lv = g.level + (k + 1) / 6;              // 5 layers between two big steps
            d.style.setProperty('--c', rampColor(lv));
            d.style.setProperty('--tc', rampText(lv));
            mSlabsEl.appendChild(d);
        }
    });
    var mSlabEls = $$('.slab', mSlabsEl);
    paintStep($('.m-s2'), 1);
    paintStep($('.m-s3'), 2);
    paintStep($('.m-s4'), 3);
    var mOru = $('#mOru');
    var lastMImg = 2, lastName = '';
    // dusk → evening: the room darkens so the door's light stands out
    var BG = [[0x5A, 0x44, 0x36], [0xA8, 0x4A, 0x15], [0x2A, 0x1C, 0x14]];
    function mixBg(t) {
        var a = t < 0.5 ? BG[0] : BG[1], b = t < 0.5 ? BG[1] : BG[2], u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        return 'rgb(' + a.map(function (v, i) { return Math.round(lerp(v, b[i], u)); }).join(',') + ')';
    }
    // camera move at the end: the door grows and slides into place as the door scene's door
    var MZ = { s: 2.3, tx: 415 - 840 * 2.3, ty: 40 - 110 * 2.3 };
    function updateMontage(scene, pRaw) {
        var p = clamp(pRaw / 0.85);                  // the climb runs on the first 85%
        var zoom = ease(seg(pRaw, 0.87, 1));
        $('#mCam').style.transform = 'translate(' + (MZ.tx * zoom).toFixed(1) + 'px,' + (MZ.ty * zoom).toFixed(1) + 'px) scale(' + lerp(1, MZ.s, zoom).toFixed(4) + ')';
        var fade = 1 - seg(zoom, 0, 0.4);
        mOru.style.opacity = fade;
        $('#stageName').style.opacity = fade;
        $('#mDoor .ld-sign').style.opacity = fade;
        // door stays just ajar: the next scene opens it the rest of the way
        $('#mDoor').style.setProperty('--open', (0.2 + 0.15 * ease(seg(p, 0.6, 1))).toFixed(3));
        scene.style.background = mixBg(seg(p, 0.1, 0.95));

        var nA = p < 0.2 ? 0 : Math.min(5, 1 + Math.floor(seg(p, 0.2, 0.46) * 5));
        var nB = p < 0.56 ? 0 : Math.min(5, 1 + Math.floor(seg(p, 0.56, 0.84) * 5));
        mSlabEls.forEach(function (el, i) { el.classList.toggle('pending', i < 5 ? i >= nA : i - 5 >= nB); });

        var x, y;
        if (p < 0.2) { x = 30; y = 430; }
        else if (p < 0.48) { x = M[0].left0 + (nA - 1) * 54 + 8; y = 430 - nA * 22; }
        else if (p < 0.56) { x = 400; y = 320; }
        else if (p < 0.88) { x = M[1].left0 + (Math.max(1, nB) - 1) * 54 + 8; y = 320 - Math.max(1, nB) * 22; }
        else { x = 720; y = 210; }
        mOru.style.left = x + 'px';
        mOru.style.top = y + 'px';

        var img = p >= 0.5 ? 3 : 2;
        if (img !== lastMImg) { mOru.src = 'assets/oreumi-' + img + '.png'; lastMImg = img; }
        var name = p < 0.5 ? '2단계 둘러보기' : (p < 0.86 ? '3단계 마주하기' : '4단계 도전하기');
        var nameEl = $('#stageName');
        if (name !== lastName) {
            nameEl.textContent = name;
            nameEl.classList.remove('flash'); void nameEl.offsetWidth; nameEl.classList.add('flash');
            lastName = name;
        }
    }

    /* ======================================================
       S09 door, S10 epilogue
       ====================================================== */
    // the door swings open in the dark, then its light floods the room and the programs appear
    function updateDoor(scene, p) {
        $('#bigDoor').style.setProperty('--open', (0.35 + 0.65 * ease(seg(p, 0.05, 0.4))).toFixed(3));
        var flood = ease(seg(p, 0.42, 0.7));
        scene.style.setProperty('--flood', flood.toFixed(3));
        scene.classList.toggle('flooded', flood > 0.5);
    }
    var town = $('#town');
    [5, 7, 4, 6, 5].forEach(function (rows) {
        var h = document.createElement('div');
        h.className = 'house';
        for (var i = 0; i < rows * 3; i++) { var w = document.createElement('span'); w.className = 'win'; h.appendChild(w); }
        town.appendChild(h);
    });
    var wins = $$('.win', town);
    var order = wins.map(function (_, i) { return i; }).sort(function (a, b) { return ((a * 29) % 41) - ((b * 29) % 41); });
    function updateEpilogue(scene, p) {
        var lit = Math.round(seg(p, 0.05, 0.6) * wins.length * 0.55) + 3;
        order.forEach(function (idx, k) { wins[idx].classList.toggle('lit', k < lit); });
    }
    $('#shareBtn').addEventListener('click', function () {
        var msg = $('#shareMsg');
        var url = location.href.split('#')[0];
        function fallback() { msg.textContent = '이 주소를 복사해 전해 주세요: ' + url; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () { msg.textContent = '링크를 복사했어요. 안부와 함께 전해 주세요.'; }, fallback);
        } else { fallback(); }
    });

    /* ======================================================
       One-screen engine
       ====================================================== */
    var scenes = $$('.scene');
    var handlers = { hook: updateHook, building: updateBuilding, wall: updateWall, step1: updateStep1, montage: updateMontage, door: updateDoor, epilogue: updateEpilogue };
    var starts = [], total = 0;
    scenes.forEach(function (s) { starts.push(total); total += parseFloat(s.dataset.len); });
    var END = total - 0.0001;
    var P = 0, T = 0, active = -1;
    var topbar = $('#topbar'), ui = $('#storyUi'), bar = $('#progressBar'), chapter = $('#chapter');
    var logo = $('.topbar .logo'), logoMode = 'white';
    var hint = $('#hint');

    function go(delta) {
        T = clamp(T + delta, 0, END);
        hint.classList.add('off');
        kick();
    }

    function render() {
        var idx = 0;
        for (var i = 0; i < scenes.length; i++) if (P >= starts[i]) idx = i;
        var scene = scenes[idx];
        var p = clamp((P - starts[idx]) / parseFloat(scene.dataset.len));
        if (idx !== active) {
            scenes.forEach(function (s, k) { s.classList.toggle('active', k === idx); s.setAttribute('aria-hidden', k === idx ? 'false' : 'true'); });
            chapter.textContent = scene.dataset.chapter;
            active = idx;
        }
        $$('[data-in]', scene).forEach(function (el) {
            var a = parseFloat(el.dataset.in), b = el.dataset.out ? parseFloat(el.dataset.out) : 1.01;
            el.classList.toggle('on', p >= a && p < b);
        });
        handlers[scene.dataset.scene](scene, p);

        var onLight = scene.dataset.scene === 'door' && p > 0.56;
        topbar.classList.toggle('on-light', onLight);
        ui.classList.toggle('on-light', onLight);
        var mode = onLight ? 'orange' : 'white';
        if (mode !== logoMode) { logo.src = 'assets/logo-' + mode + '.png'; logoMode = mode; }
        bar.style.width = (P / END * 100).toFixed(2) + '%';
        $('#prevBtn').disabled = T <= 0;
        $('#nextBtn').disabled = T >= END;
    }

    var running = false;
    function tick() {
        var d = T - P;
        P = reduced || Math.abs(d) < 0.0005 ? T : P + d * 0.14;
        render();
        if (P !== T) requestAnimationFrame(tick); else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

    /* inputs */
    window.addEventListener('wheel', function (e) {
        e.preventDefault();
        var dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        go(clamp(dy, -160, 160) * 0.0022);
    }, { passive: false });

    var touchY = null;
    window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchmove', function (e) {
        if (touchY === null) return;
        var y = e.touches[0].clientY;
        go((touchY - y) * 0.006);
        touchY = y;
    }, { passive: true });
    window.addEventListener('touchend', function () { touchY = null; });

    window.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && e.target === document.body)) { e.preventDefault(); go(0.6); }
        else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); go(-0.6); }
        else if (k === 'Home') { e.preventDefault(); go(-END); }
        else if (k === 'End') { e.preventDefault(); go(END); }
    });
    $('#nextBtn').addEventListener('click', function () { go(0.6); });
    $('#prevBtn').addEventListener('click', function () { go(-0.6); });
    $('#homeLink').addEventListener('click', function (e) { e.preventDefault(); go(-END); });
    $('#restBtn').addEventListener('click', function () {
        var i = scenes.indexOf($('.scene-step1'));
        T = starts[i] + parseFloat(scenes[i].dataset.len) * 0.6; kick();
    });

    window.addEventListener('resize', function () { fitStages(); sizeHook(); });
    fitStages();
    sizeHook();
    render();
    requestAnimationFrame(hookLoop);
})();