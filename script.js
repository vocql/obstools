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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.style.display = 'none'; document.body.className = 'ready'; return;
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

(function () {
  var card = document.getElementById('card');
  var inner = document.getElementById('inner');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, px = 0, py = 0;

  // card spotlight + subtle 3D tilt (desktop only)
  inner.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = inner.getBoundingClientRect();
      inner.style.setProperty('--mx', (px - r.left) + 'px');
      inner.style.setProperty('--my', (py - r.top) + 'px');
      if (fine && !calm) {
        var nx = (px - r.left) / r.width - .5, ny = (py - r.top) / r.height - .5;
        card.classList.add('tilting');
        card.style.setProperty('--ry', (nx * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-ny * 7).toFixed(2) + 'deg');
      }
    });
  });
  inner.addEventListener('pointerleave', function () {
    card.classList.remove('tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });

  // per-button glow follows the cursor
  var links = document.querySelector('.links');
  links.addEventListener('pointermove', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var r = a.getBoundingClientRect();
    a.style.setProperty('--lx', (e.clientX - r.left) + 'px');
    a.style.setProperty('--ly', (e.clientY - r.top) + 'px');
  });
})();

// =====================================================================
// SITE — router, navbar, live status, live card, announcement, schedule, videos, contact
// =====================================================================
(function () {
  // settings live in config.js
  var CONFIG = window.CONFIG;

  var C = CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;
  var view = $('view'), nav = $('nav'), burger = $('burger'), menu = $('menu'), pill = $('pill');
  var links = [].slice.call(menu.querySelectorAll('a[data-r]'));
  var pages = {};
  [].forEach.call(document.querySelectorAll('.page'), function (p) { pages[p.dataset.page] = p; });

  var TITLES = { home: 'voqcl', about: 'About — voqcl', videos: 'Videos — voqcl', schedule: 'Schedule — voqcl', contact: 'Contact — voqcl', '404': 'Not found — voqcl' };
  var ROUTES = { '/': 'home', '/about': 'about', '/videos': 'videos', '/content': 'videos', '/schedule': 'schedule', '/contact': 'contact' };
  var current = null, first = true, pillFirst = true;

  $('year').textContent = new Date().getFullYear();
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ---------- time: your schedule (your zone) -> real moments -> visitor's local time ----------
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var pf = new Intl.DateTimeFormat('en-US', { timeZone: C.timezone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function partsIn(ts) { var o = {}; pf.formatToParts(new Date(ts)).forEach(function (p) { o[p.type] = p.value; }); return { y: +o.year, m: +o.month, d: +o.day, h: (+o.hour) % 24, mi: +o.minute, s: +o.second }; }
  function offsetAt(ts) { ts = Math.floor(ts / 1000) * 1000; var p = partsIn(ts); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - ts; }
  function zoned(y, m, d, h, mi) { var g = Date.UTC(y, m - 1, d, h, mi), t = g - offsetAt(g); return g - offsetAt(t); }
  function occurrences(now) {
    var p = partsIn(now), out = [];
    for (var k = -1; k <= 8; k++) {
      var b = new Date(Date.UTC(p.y, p.m - 1, p.d + k)), wd = b.getUTCDay();
      C.schedule.forEach(function (s, i) {
        if (s.off || WD.indexOf(String(s.day).slice(0, 3)) !== wd) return;
        var a = s.start.split(':').map(Number), z = s.end.split(':').map(Number);
        var y = b.getUTCFullYear(), m = b.getUTCMonth() + 1, d = b.getUTCDate();
        var st = zoned(y, m, d, a[0], a[1] || 0), en = zoned(y, m, d, z[0], z[1] || 0);
        if (en <= st) en += 86400000;
        out.push({ s: s, i: i, start: st, end: en });
      });
    }
    return out.sort(function (x, y) { return x.start - y.start; });
  }
  var fTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  var fDay = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
  var fDayS = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  try { $('tzname').textContent = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) {}
  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
  function dayWord(ts, short) {
    var d = new Date(ts), n = new Date(), t = new Date(); t.setDate(n.getDate() + 1);
    return sameDay(d, n) ? 'today' : sameDay(d, t) ? 'tomorrow' : (short ? fDayS : fDay).format(d);
  }
  function range(o) { return fTime.format(new Date(o.start)) + ' – ' + fTime.format(new Date(o.end)); }
  function viewers(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n); }

  // ---------- live state ----------
  var override = null, wasLive = null, remote = null, liveInfo = C.live, liveViewers = null, lastThumb = null;
  var ART = '<div class="art"><div class="eq"><b></b><b></b><b></b><b></b></div></div>';
  function setStatus(el, live, offText) {
    el.querySelector('span').textContent = live ? 'LIVE NOW' : offText;
    if (live) { el.href = liveInfo.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.href = '#/schedule'; el.removeAttribute('target'); }
  }
  function update() {
    var now = Date.now(), mode = override || C.liveMode, occ = occurrences(now);
    var cur = occ.filter(function (o) { return o.start <= now && now < o.end; })[0];
    var next = occ.filter(function (o) { return o.start > now; })[0];
    // status.json is written by the GitHub Action (.github/workflows/live-check.yml).
    // If it's missing or broken, 'auto' falls back to your schedule.
    var detected = remote && typeof remote.live === 'boolean';
    if (detected && remote.live && remote.since && now - Date.parse(remote.since) > 18 * 3600000) detected = false; // stale safety net
    var live = mode === 'live' || (mode === 'auto' && (detected ? remote.live : !!cur));
    var useRemote = live && detected && remote.live && mode !== 'live';
    liveInfo = {
      title: (useRemote && remote.title) || C.live.title,
      platform: C.live.platform,
      url: (useRemote && remote.url) || C.live.url,
      viewers: live ? (liveViewers != null ? liveViewers : C.live.viewers) : null,
      // YouTube refreshes live thumbnails during the stream, so re-fetch it every 5 minutes
      thumbnail: (useRemote && remote.thumbnail ? remote.thumbnail + '?v=' + Math.floor(now / 300000) : '') || C.live.thumbnail,
      videoId: (useRemote && remote.videoId) || ((String(C.live.url).match(/[?&]v=([\w-]{11})/) || [])[1]) || null
    };
    if (!live) liveViewers = null;
    body.classList.toggle('is-live', live);

    var nextShort = next ? 'Offline · next ' + dayWord(next.start, true) + ' ' + fTime.format(new Date(next.start)) : 'Offline';
    setStatus($('navstatus'), live, 'Offline');
    setStatus($('cardstatus'), live, nextShort);
    var fl = $('footlive');
    fl.querySelector('span').textContent = live ? 'LIVE NOW · Watch on ' + C.live.platform : (next ? 'Next stream ' + dayWord(next.start) + ', ' + fTime.format(new Date(next.start)) : 'Live on YouTube · weekdays');
    if (live) { fl.href = liveInfo.url; fl.target = '_blank'; fl.rel = 'noopener noreferrer'; } else { fl.href = '#/schedule'; fl.removeAttribute('target'); }

    // live card
    var lc = $('lcard');
    if (live) {
      var L = liveInfo;
      lc.href = L.url;
      $('lctitle').textContent = L.title || (cur && cur.s.title) || 'Live now';
      $('lcmeta').innerHTML = '<svg><use href="#i-' + (/twitch/i.test(L.platform) ? 'tw' : 'yt') + '"/></svg>' + esc(L.platform) +
        (L.viewers != null ? ' &middot; <svg><use href="#i-eye"/></svg>' + viewers(L.viewers) + ' watching' : '');
      if (lastThumb !== L.thumbnail) {               // only redraw the thumbnail when it actually changes
        lastThumb = L.thumbnail;
        $('lcthumb').innerHTML = (L.thumbnail ? '<img src="' + esc(L.thumbnail) + '" alt="">' : ART) + '<span class="lc-tag">LIVE</span>';
        var im = $('lcthumb').querySelector('img');
        if (im) im.addEventListener('error', function () { im.outerHTML = ART; });
      }
      if (wasLive !== true) { lc.hidden = false; lc.classList.remove('pop'); void lc.offsetWidth; lc.classList.add('pop'); }
    } else lc.hidden = true;
    if (wasLive !== live) { wasLive = live; fit(); }

    renderSchedule(occ, now, live);
  }

  // ---------- schedule ----------
  var fDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  function inTime(ms) {
    var m = Math.max(1, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + mm + 'm' : mm + 'm';
  }
  var openDay = null, lastSched = '';
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  // the compact box that opens under a day
  function dayBox(list, now, live, next) {
    var o = list && list[0], btn = function (cls, href, text, ext) {
      return '<a class="dp-btn' + cls + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + text + '</a>';
    };
    if (!o) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>No stream this day</b><small>' +
        (next ? 'Next stream ' + esc(dayWord(next.start)) + ' at ' + esc(fTime.format(new Date(next.start))) : 'Check back soon') +
        '</small></div>' + btn('', C.youtube, 'Get notified', true) + '</div>';
    }
    var during = o.start <= now && now < o.end;
    if (during && live) {
      var th = '<a class="dp-th" href="' + esc(liveInfo.url) + '" target="_blank" rel="noopener noreferrer" aria-label="Watch the stream">' +
        (liveInfo.thumbnail ? '<img src="' + esc(liveInfo.thumbnail) + '" alt="" loading="lazy">' : ART) + '<span class="lc-tag">LIVE</span></a>';
      return '<div class="dp live">' + th + '<div class="dp-txt"><b>I\'m live right now</b><small>' +
        esc(liveInfo.title || o.s.title) + (liveInfo.viewers != null ? ' &middot; ' + viewers(liveInfo.viewers) + ' watching' : '') + '</small></div>' +
        btn(' red', liveInfo.url, '<svg viewBox="0 0 24 24"><use href="#i-play"/></svg>Watch live', true) + '</div>';
    }
    if (during) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starting soon</b><small>Scheduled now, ' +
        esc(range(o)) + '</small></div>' + btn('', C.youtube, 'Check YouTube', true) + '</div>';
    }
    return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starts in ' + inTime(o.start - now) + '</b><small>' +
      esc(fDate.format(new Date(o.start))) + ', ' + esc(range(o)) + '</small></div>' + btn('', C.youtube, 'Get notified', true) + '</div>';
  }

  function renderSchedule(occ, now, live) {
    var slot = $('schedule-slot');
    if (!C.schedule.length) {
      slot.innerHTML =
        '<div class="panel empty-state reveal in" style="--d:1">' +
          '<h2 class="h3">Schedule coming soon</h2>' +
          '<p class="lead">No fixed times yet. Subscribe on YouTube and you\'ll get notified whenever I go live.</p>' +
        '</div>';
      return;
    }
    var seen = {}, byDay = {};
    occ.forEach(function (o) {
      if (o.end <= now || seen[o.i]) return; seen[o.i] = 1;
      var wd = new Date(o.start).getDay(); (byDay[wd] = byDay[wd] || []).push(o);
    });
    var next = occ.filter(function (o) { return o.start > now; })[0];
    var today = new Date().getDay(), i = 0;
    var html = '<div class="days">' + [1, 2, 3, 4, 5, 6, 0].map(function (wd) {
      var name = fDay.format(new Date(2024, 0, 7 + wd, 12)), list = byDay[wd];
      var isNow = !!list && live && list[0].start <= now && now < list[0].end;
      var cls = 'day' + (wd === today ? ' today' : '') + (!list ? ' off' : '') + (isNow ? ' live' : '');
      var t = list ? list.map(function (o) { return esc(o.s.title); }).join(', ') : 'No stream';
      var h = list ? list.map(range).join(', ') : 'Off';
      var open = openDay === wd;
      return '<div class="dwrap' + (open ? ' open' : '') + '" data-wd="' + wd + '">' +
        '<button class="' + cls + '" type="button" style="--d:' + (i++) + '" aria-expanded="' + open + '" aria-controls="dp-' + wd + '">' +
          '<span class="d">' + esc(name) + '</span><span class="t">' + t + '</span><span class="h">' + esc(h) + CHEV + '</span>' +
        '</button>' +
        '<div class="dpanel" id="dp-' + wd + '" role="region"><div class="dpin">' + dayBox(list, now, live, next) + '</div></div>' +
      '</div>';
    }).join('') + '</div>';
    if (html === lastSched) return;                       // nothing changed, keep the page as is
    var focused = document.activeElement && document.activeElement.closest && document.activeElement.closest('.dwrap');
    var focusWd = focused && slot.contains(focused) ? focused.getAttribute('data-wd') : null;
    slot.innerHTML = html; lastSched = html;
    if (focusWd != null) { var b = slot.querySelector('.dwrap[data-wd="' + focusWd + '"] .day'); if (b) b.focus({ preventScroll: true }); }
  }

  // if a live thumbnail fails to load, fall back to the animated placeholder
  $('schedule-slot').addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && e.target.parentNode.classList.contains('dp-th')) e.target.outerHTML = ART;
  }, true);

  // click a day: open its box (one at a time), click again to close
  $('schedule-slot').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button.day');
    if (!b) return;
    var wrap = b.parentNode, wd = +wrap.getAttribute('data-wd'), willOpen = !wrap.classList.contains('open');
    [].forEach.call(this.querySelectorAll('.dwrap.open'), function (w) { w.classList.remove('open'); w.firstChild.setAttribute('aria-expanded', 'false'); });
    if (willOpen) { wrap.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    openDay = willOpen ? wd : null;
    setTimeout(fit, 430);
  });

  // ---------- videos ----------
  var SHADES = ['linear-gradient(135deg,#2a2a2a,#0d0d0d)', 'linear-gradient(200deg,#303030,#111)', 'linear-gradient(160deg,#1a1a1a,#333)', 'linear-gradient(120deg,#383838,#121212)'];
  $('vgrid').innerHTML = C.vods.map(function (v, i) {
    return '<a class="pcard vcard reveal" style="--d:' + (i + 1) + '" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="vthumb" style="--g:' + SHADES[i % SHADES.length] + '">' + (v.thumb ? '<img src="' + esc(v.thumb) + '" alt="" loading="lazy">' : '') +
      '<span class="dur">' + esc(v.duration) + '</span><span class="play"><span><svg class="ico"><use href="#i-play"/></svg></span></span></div>' +
      '<h3>' + esc(v.title) + '</h3><small>' + esc(v.date) + '</small></a>';
  }).join('');
  $('allvids').href = C.youtube;

  // ---------- contact form (only when contactEmail is set) ----------
  (function renderContact() {
    var slot = $('contact-form-slot'), grid = $('contact-grid');
    if (!C.contactEmail) { slot.remove(); grid.classList.add('solo'); return; }
    slot.innerHTML =
      '<h2 class="h3" style="margin-bottom:16px">Send an email</h2>' +
      '<form class="form" id="cform">' +
        '<label class="field">Your name<input name="name" required autocomplete="name" maxlength="80"></label>' +
        '<label class="field">Message<textarea name="msg" required maxlength="2000"></textarea></label>' +
        '<button class="btn primary" type="submit" style="justify-content:center">Open in my email app</button>' +
      '</form>';
    $('cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, name = f.name.value.trim(), msg = f.msg.value.trim();
      window.location.href = 'mailto:' + C.contactEmail + '?subject=' + encodeURIComponent('Hello from ' + name) + '&body=' + encodeURIComponent(msg);
    });
  })();

  // ---------- announcement ----------
  var A = C.announcement, ann = $('ann'), scrim = $('annscrim'), annKey = A ? 'voqcl-ann:' + A.id : '', annTimer = 0;
  if (A) {
    $('anntitle').textContent = A.title;
    $('annshort').textContent = A.short;
    $('anndetail').innerHTML =
      (A.date ? '<span class="ann-date">' + esc(A.date) + '</span>' : '') +
      (A.details || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (A.list && A.list.length ? '<ul>' + A.list.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (A.link ? '<a class="btn primary" href="' + esc(A.link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(A.link.label) + ' <svg class="ico" style="fill:none"><use href="#i-arrow"/></svg></a>' : '');
  }
  function annShow() {
    if (!A || store.get(annKey)) return;
    clearTimeout(annTimer);
    (function wait() {
      if (!body.classList.contains('ready')) { annTimer = setTimeout(wait, 150); return; }
      annTimer = setTimeout(function () { if (current === 'home') { ann.classList.add('show'); ann.tabIndex = 0; } }, 900);
    })();
  }
  function annCollapse() { ann.classList.remove('open'); scrim.classList.remove('on'); ann.setAttribute('aria-expanded', 'false'); }
  function annHide() { clearTimeout(annTimer); annCollapse(); ann.classList.remove('show'); ann.tabIndex = -1; }
  ann.addEventListener('click', function () { if (ann.classList.contains('open')) return; ann.classList.add('open'); scrim.classList.add('on'); ann.setAttribute('aria-expanded', 'true'); });
  ann.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === ann) { e.preventDefault(); ann.click(); } });
  $('annx').addEventListener('click', function (e) { e.stopPropagation(); store.set(annKey, '1'); annHide(); });
  scrim.addEventListener('click', annCollapse);

  // ---------- scroll reveal ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in'); io.unobserve(el);
      el.addEventListener('transitionend', function done(ev) {
        if (ev.target !== el || ev.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', done); el.classList.remove('reveal', 'in');
      });
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  function reveal(page) {
    [].forEach.call(page.querySelectorAll('.reveal'), function (el) {
      el.classList.remove('in');
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  // ---------- navbar ----------
  function movePill() {
    var a = menu.querySelector('a.active');
    if (!a || window.innerWidth <= 720) { pill.style.opacity = 0; return; }
    if (pillFirst) pill.style.transition = 'none';
    pill.style.opacity = 1;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    if (pillFirst) { void pill.offsetWidth; pill.style.transition = ''; pillFirst = false; }
  }
  function closeMenu() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); annCollapse(); } });
  window.addEventListener('resize', movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  // ---------- fit to screen: shrink a page slightly if it is taller than the window ----------
  function fit() {
    var pg = pages[current]; if (!pg) return;
    var el = current === 'home' ? $('card') : pg;
    el.style.zoom = '';
    var avail = pg.clientHeight, need;
    if (current === 'home') need = el.offsetHeight;
    else {
      var f = pg.firstElementChild, l = pg.lastElementChild;
      if (!f || !l) return;
      need = (l.offsetTop + l.offsetHeight) - f.offsetTop;
    }
    if (need > avail && avail > 0) el.style.zoom = Math.max(0.5, (avail / need) * 0.97).toFixed(3);
  }
  window.addEventListener('resize', fit);
  window.addEventListener('load', function () { fit(); setTimeout(fit, 300); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  // ---------- router ----------
  function show(name) {
    if (name === current) return;
    if (current && pages[current]) pages[current].hidden = true;
    var pg = pages[name]; pg.hidden = false;
    if (!first && name !== 'home') { pg.classList.remove('enter'); void pg.offsetWidth; pg.classList.add('enter'); }
    current = name;
    document.title = TITLES[name] || 'voqcl';
    view.classList.toggle('is-home', name === 'home');
    links.forEach(function (l) {
      var on = l.dataset.r === name;
      l.classList.toggle('active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    movePill(); reveal(pg); closeMenu(); fit();
    if (name === 'home') annShow(); else annHide();
    if (!first) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
    first = false;
  }
  function onRoute() {
    var h = (window.location.hash || '#/').slice(1) || '/';
    if (h.charAt(0) !== '/') h = '/' + h;
    if (h.length > 1) h = h.replace(/\/+$/, '');
    show(ROUTES[h] || '404');
  }
  window.addEventListener('hashchange', onRoute);

  // ---------- preview switch ----------
  if (C.showPreviewSwitch) {
    var pv = $('preview'); pv.hidden = false;
    var btns = [].slice.call(pv.querySelectorAll('[data-mode]'));
    var mark = function () { btns.forEach(function (b) { b.classList.toggle('on', b.dataset.mode === (override || C.liveMode)); }); };
    btns.forEach(function (b) { b.addEventListener('click', function () { override = b.dataset.mode; mark(); update(); }); });
    $('replay').addEventListener('click', function () {
      if (!A) return;
      store.del(annKey); annHide();
      if (current !== 'home') location.hash = '#/'; else annShow();
    });
    mark();
  }

  // ---------- live detection: read status.json written by the GitHub Action ----------
  function poll() {
    if (!C.statusFile || !window.fetch) return;
    fetch(C.statusFile + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var was = remote && remote.videoId;
        remote = j; update();
        if (j && j.videoId && j.videoId !== was) pollViewers();   // new stream detected: get its viewer count right away
      })
      .catch(function () {});
  }

  // ---------- viewer count: asks YouTube how many people are watching (needs youtubeApiKey) ----------
  // Costs 1 quota unit per check. Only runs while you're live and the tab is open.
  function pollViewers() {
    if (!C.youtubeApiKey || !window.fetch || document.hidden || !body.classList.contains('is-live') || !liveInfo.videoId) return;
    fetch('https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=' + encodeURIComponent(liveInfo.videoId) + '&key=' + encodeURIComponent(C.youtubeApiKey))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var d = j && j.items && j.items[0] && j.items[0].liveStreamingDetails;
        var v = d && d.concurrentViewers;
        var nv = v != null ? +v : null;
        if (nv !== liveViewers) { liveViewers = nv; update(); }
      })
      .catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pollViewers(); });

  update();
  onRoute();
  poll();
  setTimeout(pollViewers, 1500);
  setInterval(update, 15000);
  setInterval(poll, 60000);
  setInterval(pollViewers, 60000);

  // ---------- spotlight on panels / cards ----------
  view.addEventListener('pointermove', function (e) {
    var t = e.target.closest && e.target.closest('.panel, .pcard, .day');
    if (!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
})();
