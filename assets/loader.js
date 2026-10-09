/* VOQCL — intro loading screen (home page only) */
// ===== 3D loading screen: particle globe + rings, text decode, warp, iris reveal =====
(function () {
  var loader = document.getElementById('loader');
  var cv = document.getElementById('gl');
  var ctx = cv.getContext('2d');
  var bar = document.getElementById('bar');
  var pctEl = document.getElementById('pct');
  var stat = document.getElementById('ldstatus');
  var center = document.getElementById('ldcenter');
  var letters = document.querySelectorAll('#ldword span');

  // the intro only plays once per visit; moving between pages skips it
  var seen = false;
  try { seen = sessionStorage.getItem('vq-intro') === '1'; sessionStorage.setItem('vq-intro', '1'); } catch (e) {}
  if (seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove(); document.body.classList.remove('loading'); document.body.classList.add('ready'); return;
  }

  var WORD = 'voqcl', CH = 'abcdefghijklmnopqrstuvwxyz0123456789#%&@$*+=?';
  var MIN = 2900;                 // minimum time on screen (ms)
  var W, H, DPR, CX, CY, R, FOV;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = (W * DPR) | 0; cv.height = (H * DPR) | 0;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W / 2; CY = H / 2;
    R = Math.min(W, H) * (W < 600 ? 0.31 : 0.3);
    FOV = Math.max(W, H) * 0.9;
  }
  resize();
  window.addEventListener('resize', resize);

  // ---- build particles (unit coordinates, scaled by R at render) ----
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function randDir() {
    var u = Math.random() * 2 - 1, th = Math.random() * 6.2832, r = Math.sqrt(1 - u * u);
    return [Math.cos(th) * r, u, Math.sin(th) * r];
  }
  var N = W < 600 ? 700 : 1300, pts = [], i, d, s;
  var nSphere = Math.floor(N * 0.58), nRing = Math.floor(N * 0.28);
  for (i = 0; i < N; i++) {
    var p = { k: 0, x: 0, y: 0, z: 0, a: 0, j: 0, rr: 1 };
    if (i < nSphere) {                       // fibonacci sphere
      var y = 1 - 2 * (i + 0.5) / nSphere, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      p.x = Math.cos(th) * r; p.y = y; p.z = Math.sin(th) * r;
    } else if (i < nSphere + nRing) {        // two tilted rings
      p.k = (i % 2) + 1; p.a = Math.random() * 6.2832; p.j = rnd(-0.03, 0.03);
      p.rr = p.k === 1 ? 1.45 : 1.75;
    } else {                                  // star dust
      p.k = 3; d = randDir(); s = rnd(2.2, 5.5); p.x = d[0] * s; p.y = d[1] * s; p.z = d[2] * s;
    }
    d = randDir(); s = rnd(3, 9);             // scatter start position
    p.sx = d[0] * s; p.sy = d[1] * s; p.sz = d[2] * s;
    pts.push(p);
  }
  var C1 = Math.cos(1.15), S1 = Math.sin(1.15), C2 = Math.cos(0.9), S2 = Math.sin(0.9);

  // ---- projection ----
  var PX, PY, PS, PZ;
  function proj(x, y, z, ca, sa, cb, sb) {
    var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    var y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
    PZ = z2; PS = FOV / (FOV + z2); PX = CX + x1 * PS; PY = CY + y1 * PS;
  }

  // ---- input parallax ----
  var tx = 0, ty = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / W - 0.5; ty = e.clientY / H - 0.5;
  });

  // ---- state ----
  var t0 = performance.now(), loaded = false, state = 'load';
  var prog = 0, warp = 0, warpStart = 0, irised = false, lastTxt = 0, raf = 0;
  var lockAt = [900, 1200, 1500, 1800, 2100];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ready() { return document.readyState === 'complete'; }
  if (ready()) loaded = true;
  window.addEventListener('load', function () { loaded = true; });
  setTimeout(function () { loaded = true; }, 6500); // failsafe

  function updateText(now, el) {
    if (now - lastTxt < 55) return; lastTxt = now;
    for (var n = 0; n < 5; n++) {
      var locked = state !== 'load' || el >= lockAt[n];
      letters[n].textContent = locked ? WORD[n] : CH[(Math.random() * CH.length) | 0];
      letters[n].className = locked ? '' : 'dim';
    }
    var pv = Math.round(prog);
    pctEl.textContent = (pv < 10 ? '00' : pv < 100 ? '0' : '') + pv + '%';
    stat.textContent = prog < 30 ? 'initializing' : prog < 62 ? 'loading assets' : prog < 94 ? 'syncing' : 'ready';
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var el = now - t0, t = el / 1000;

    // progress + state machine
    if (state === 'load') {
      var tgt = loaded ? Math.min(100, el / MIN * 100) : Math.min(88, el / MIN * 88);
      prog += (tgt - prog) * 0.1;
      if (loaded && el >= MIN && prog > 98.5) {
        prog = 100; state = 'warp'; warpStart = now; center.classList.add('out');
        stat.textContent = 'ready';
      }
    } else if (state === 'warp') {
      var wv = clamp((now - warpStart) / 950, 0, 1);
      warp = wv * wv;
      if (wv >= 0.78 && !irised) {
        irised = true; loader.classList.add('done');
        document.body.classList.remove('loading'); document.body.classList.add('ready');
        setTimeout(function () { cancelAnimationFrame(raf); loader.style.display = 'none'; }, 1300);
      }
    }
    bar.style.setProperty('--p', (prog / 100).toFixed(3));
    updateText(now, el);

    // ---- draw ----
    ctx.clearRect(0, 0, W, H);
    var intro = clamp(t / 1.7, 0, 1), k = 1 - Math.pow(1 - intro, 3);
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    var ay = t * 0.38 + mx * 0.9, ax = -0.38 + my * 0.55;
    var ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);
    var breath = 1 + Math.sin(t * 2) * 0.015;
    var wk = 1 + warp * 9, wkPrev = 1 + warp * 9 * 0.8 + 0.0001;
    var pr = prog / 100, scan = Math.sin(t * 1.4) * 0.95;
    var fadeIn = Math.min(1, intro * 2);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';

    // wireframe globe (lat / long)
    var wf = (1 - warp * 3) * 0.13 * fadeIn;
    if (wf > 0.005) {
      ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.globalAlpha = wf;
      var a, b, rr, yy, ux, uy, uz, seg = 56;
      ctx.beginPath();
      for (a = -3; a <= 3; a++) {          // latitudes
        yy = a / 4; rr = Math.sqrt(1 - yy * yy);
        for (b = 0; b <= seg; b++) {
          var an = b / seg * 6.2832;
          proj(Math.cos(an) * rr * R * breath * k, yy * R * breath * k, Math.sin(an) * rr * R * breath * k, ca, sa, cb, sb);
          b ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY);
        }
      }
      for (a = 0; a < 8; a++) {            // longitudes
        var lon = a / 8 * 3.14159;
        for (b = 0; b <= seg; b++) {
          var an2 = b / seg * 6.2832;
          ux = Math.cos(an2) * Math.cos(lon); uy = Math.sin(an2); uz = Math.cos(an2) * Math.sin(lon);
          proj(ux * R * breath * k, uy * R * breath * k, uz * R * breath * k, ca, sa, cb, sb);
          b ? ctx.lineTo(PX, PY) : ctx.moveTo(PX, PY);
        }
      }
      ctx.stroke();
    }

    // particles
    for (i = 0; i < pts.length; i++) {
      var q = pts[i], hx, hy, hz;
      if (q.k === 1) {
        var an1 = q.a + t * 0.9, rx = Math.cos(an1) * q.rr, rz = Math.sin(an1) * q.rr;
        hx = rx; hy = q.j * C1 - rz * S1; hz = q.j * S1 + rz * C1;
      } else if (q.k === 2) {
        var an3 = q.a - t * 0.6, rx2 = Math.cos(an3) * q.rr, rz2 = Math.sin(an3) * q.rr;
        hx = rx2 * C2 - q.j * S2; hy = rx2 * S2 + q.j * C2; hz = rz2;
      } else { hx = q.x; hy = q.y; hz = q.z; }
      var X = (q.sx + (hx - q.sx) * k) * R * breath, Y = (q.sy + (hy - q.sy) * k) * R * breath, Z = (q.sz + (hz - q.sz) * k) * R * breath;

      proj(X * wk, Y * wk, Z * wk, ca, sa, cb, sb);
      if (FOV + PZ < 40) continue;
      var depth = clamp(0.5 - PZ / (R * 3.4), 0, 1);
      var al = (0.2 + 0.8 * depth) * fadeIn, size = (q.k === 0 ? 1.8 : q.k === 3 ? 1.1 : 1.5) * PS;
      if (q.k === 0) {
        al *= ((q.y + 1) / 2 <= pr) ? 1 : 0.28;                 // fills bottom -> top with progress
        if (Math.abs(q.y - scan) < 0.1) { al = 1; size *= 1.9; } // scanning band
      }
      if (warp > 0.02) {                                           // streak toward camera
        var x0 = PX, y0 = PY;
        proj(X * wkPrev, Y * wkPrev, Z * wkPrev, ca, sa, cb, sb);
        ctx.globalAlpha = al * (1 - warp * 0.4); ctx.lineWidth = Math.max(0.6, size * 0.7);
        ctx.beginPath(); ctx.moveTo(PX, PY); ctx.lineTo(x0, y0); ctx.stroke();
      } else {
        ctx.globalAlpha = al; ctx.fillRect(PX - size / 2, PY - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }
  raf = requestAnimationFrame(frame);
})();
