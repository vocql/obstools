/* =====================================================================
   VOQCL — shared code for every page
   nav, live status (badge, footer, glow), timezone math, fit-to-screen,
   reveal animations, preview switch. Page files (home.js, schedule.js, …)
   subscribe with VQ.on(function (state) { … }).
   ===================================================================== */
(function () {
  var C = window.CONFIG || {};
  C.live = C.live || {};
  C.schedule = C.schedule || [];
  var body = document.body, PAGE = body.getAttribute('data-page');
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(f) { return !f ? '' : /^(https?:)?\//.test(f) ? f : '/' + f; }   // site files always load from the root
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
    del: function (k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) {} }
  };
  function viewers(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n); }

  // pages without the intro loader are ready straight away
  if (!$('loader')) { body.classList.remove('loading'); body.classList.add('ready'); }
  var yr = $('year'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- time: your schedule (your zone) -> real moments -> visitor's local time ----------
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var pf = new Intl.DateTimeFormat('en-US', { timeZone: C.timezone || 'America/Chicago', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
  function dayWord(ts, short) {
    var d = new Date(ts), n = new Date(), t = new Date(); t.setDate(n.getDate() + 1);
    return sameDay(d, n) ? 'today' : sameDay(d, t) ? 'tomorrow' : (short ? fDayS : fDay).format(d);
  }
  function range(o) { return fTime.format(new Date(o.start)) + ' – ' + fTime.format(new Date(o.end)); }
  function inTime(ms) {
    var m = Math.max(1, Math.round(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + mm + 'm' : mm + 'm';
  }

  // ---------- navbar ----------
  var nav = $('nav'), burger = $('burger'), menu = $('menu'), pill = $('pill');
  function closeMenu() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  [].forEach.call(menu.querySelectorAll('a[data-r]'), function (a) {
    if (a.getAttribute('data-r') === PAGE) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
  });
  function movePill() {
    var a = menu.querySelector('a.active');
    if (!a || window.innerWidth <= 720) { pill.style.opacity = 0; return; }
    pill.style.transition = 'none'; pill.style.opacity = 1;
    pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  movePill();
  window.addEventListener('resize', movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  // ---------- fit to screen: shrink the page a little if it's taller than the window ----------
  var pageEl = document.querySelector('.page');
  function fit() {
    if (!pageEl) return;
    var el = PAGE === 'home' ? $('card') : pageEl;
    if (!el) return;
    el.style.zoom = '';
    var avail = pageEl.clientHeight, need;
    if (PAGE === 'home') need = el.offsetHeight;
    else {
      var f = pageEl.firstElementChild, l = pageEl.lastElementChild;
      if (!f || !l) return;
      need = (l.offsetTop + l.offsetHeight) - f.offsetTop;
    }
    if (need > avail && avail > 0) el.style.zoom = Math.max(0.5, (avail / need) * 0.97).toFixed(3);
  }
  var fitT = 0;
  window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fit, 80); });
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  // ---------- reveal animations ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in'); io.unobserve(el);
      el.addEventListener('transitionend', function done(ev) {
        if (ev.target !== el || ev.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', done); el.classList.remove('reveal', 'in');
      });
    });
  }, { threshold: 0.12 }) : null;
  function reveal(root) {
    [].forEach.call((root || document).querySelectorAll('.reveal'), function (el) { if (io) io.observe(el); else el.classList.add('in'); });
  }
  reveal();

  // ---------- spotlight on panels / cards ----------
  var view = $('view'), spotRaf = 0, spotE = null;
  view.addEventListener('pointermove', function (e) {
    spotE = e; if (spotRaf) return;
    spotRaf = requestAnimationFrame(function () {
      spotRaf = 0;
      var t = spotE.target.closest && spotE.target.closest('.panel, .pcard, .day');
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (spotE.clientX - r.left) + 'px');
      t.style.setProperty('--my', (spotE.clientY - r.top) + 'px');
    });
  });

  // =====================================================================
  // LIVE STATE (shared by every page)
  // =====================================================================
  var override = store.get('vq-preview', true), remote = null, liveViewers = null, subs = [], state = null;
  function setStatus(el, live, offText, info) {
    if (!el) return;
    el.querySelector('span').textContent = live ? 'LIVE NOW' : offText;
    if (live) { el.href = info.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.href = '/pages/schedule/'; el.removeAttribute('target'); }
  }
  function update() {
    var now = Date.now(), mode = override || C.liveMode || 'auto', occ = occurrences(now);
    var cur = occ.filter(function (o) { return o.start <= now && now < o.end; })[0];
    var next = occ.filter(function (o) { return o.start > now; })[0];
    // status.json is written by the GitHub Action (.github/workflows/live-check.yml); without it 'auto' uses the schedule
    var detected = remote && typeof remote.live === 'boolean';
    if (detected && remote.live && remote.since && now - Date.parse(remote.since) > 18 * 3600000) detected = false;
    var live = mode === 'live' || (mode === 'auto' && (detected ? remote.live : !!cur));
    var useRemote = live && detected && remote.live && mode !== 'live';
    if (!live) liveViewers = null;
    var info = {
      title: (useRemote && remote.title) || C.live.title || (cur && cur.s.title) || 'Live now',
      platform: C.live.platform || 'YouTube',
      url: (useRemote && remote.url) || C.live.url || C.youtube,
      viewers: live ? (liveViewers != null ? liveViewers : C.live.viewers) : null,
      thumbnail: (useRemote && remote.thumbnail ? remote.thumbnail + '?v=' + Math.floor(now / 300000) : '') || C.live.thumbnail || '',
      videoId: (useRemote && remote.videoId) || ((String(C.live.url || '').match(/[?&]v=([\w-]{11})/) || [])[1]) || null
    };
    body.classList.toggle('is-live', live);

    setStatus($('navstatus'), live, 'Offline', info);
    setStatus($('cardstatus'), live, next ? 'Offline · next ' + dayWord(next.start, true) + ' ' + fTime.format(new Date(next.start)) : 'Offline', info);
    var fl = $('footlive');
    if (fl) {
      fl.querySelector('span').textContent = live ? 'LIVE NOW · Watch on ' + info.platform : (next ? 'Next stream ' + dayWord(next.start) + ', ' + fTime.format(new Date(next.start)) : 'Live on YouTube');
      if (live) { fl.href = info.url; fl.target = '_blank'; fl.rel = 'noopener noreferrer'; } else { fl.href = '/pages/schedule/'; fl.removeAttribute('target'); }
    }

    state = { live: live, cur: cur, next: next, occ: occ, now: now, info: info, mode: mode };
    subs.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  function poll() {
    if (!C.statusFile || !window.fetch) return;
    fetch(url(C.statusFile) + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var was = remote && remote.videoId;
        remote = j; update();
        if (j && j.videoId && j.videoId !== was) pollViewers();
      })
      .catch(function () {});
  }
  // viewer count: 1 YouTube API quota unit per check, only while live and the tab is visible
  function pollViewers() {
    if (!C.youtubeApiKey || !window.fetch || document.hidden || !state || !state.live || !state.info.videoId) return;
    fetch('https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=' + encodeURIComponent(state.info.videoId) + '&key=' + encodeURIComponent(C.youtubeApiKey))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var d = j && j.items && j.items[0] && j.items[0].liveStreamingDetails;
        var nv = d && d.concurrentViewers != null ? +d.concurrentViewers : null;
        if (nv !== liveViewers) { liveViewers = nv; update(); }
      })
      .catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { poll(); pollViewers(); } });

  // ---------- preview switch (hidden unless showPreviewSwitch is true) ----------
  var pv = $('preview');
  if (pv && C.showPreviewSwitch) {
    pv.hidden = false;
    var btns = [].slice.call(pv.querySelectorAll('[data-mode]'));
    var mark = function () { btns.forEach(function (b) { b.classList.toggle('on', b.dataset.mode === (override || C.liveMode || 'auto')); }); };
    btns.forEach(function (b) { b.addEventListener('click', function () { override = b.dataset.mode; store.set('vq-preview', override, true); mark(); update(); }); });
    var rp = $('replay');
    if (rp) rp.addEventListener('click', function () {
      if (C.announcement) store.del('voqcl-ann:' + C.announcement.id);
      if (PAGE !== 'home') location.href = '/'; else if (window.VQ.showAnn) window.VQ.showAnn();
    });
    mark();
  } else if (pv) pv.remove();

  window.VQ = {
    C: C, PAGE: PAGE, $: $, esc: esc, url: url, store: store, viewers: viewers,
    fTime: fTime, fDay: fDay, dayWord: dayWord, range: range, inTime: inTime,
    fit: fit, reveal: reveal, refresh: update,
    ART: '<div class="art"><div class="eq"><b></b><b></b><b></b><b></b></div></div>',
    on: function (fn) { subs.push(fn); if (state) fn(state); },
    get state() { return state; }
  };

  update();
  poll();
  setTimeout(pollViewers, 1500);
  setInterval(update, 15000);
  setInterval(poll, 60000);
  setInterval(pollViewers, 60000);
})();
