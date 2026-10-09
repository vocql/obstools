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
  //  1. YouTube API (if youtubeApiKey is set): checks your channel every minute and
  //     gets the exact stream, title, thumbnail, viewers and start time.
  //  2. status.json from the GitHub Action, if the API isn't available.
  //  3. Your schedule, if neither is available.
  // =====================================================================
  var override = store.get('vq-preview', true), remote = null, api = null, subs = [], state = null, offStreak = 0;
  // Don't guess on page load: wait for a real answer (YouTube API or status.json) before showing
  // live or offline. This stops the badge flashing on for a second and disappearing.
  var booting = !!((C.youtubeApiKey || C.statusFile) && (override || C.liveMode || 'auto') === 'auto');
  var bootTimer = booting ? setTimeout(function () { booting = false; update(); }, 6000) : 0;
  function ready() { if (booting) { booting = false; clearTimeout(bootTimer); } }
  try {   // last answer from another page of the site (under 5 min old) is shown instantly while we re-check
    var cachedApi = JSON.parse(store.get('vq-api', true) || 'null');
    if (cachedApi && Date.now() - cachedApi.t < 5 * 60000) { api = cachedApi; booting = false; clearTimeout(bootTimer); }
  } catch (e) {}
  var ytBase = 'https://www.googleapis.com/youtube/v3/';
  var handle = (String(C.youtube || '').match(/@([\w.-]+)/) || [])[1] || '';

  function setStatus(el, live, offText, info) {
    if (!el) return;
    el.querySelector('span').textContent = live ? 'LIVE NOW' : offText;
    if (live) { el.href = info.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.href = '/pages/schedule/'; el.removeAttribute('target'); }
  }
  function bestThumb(t) { t = t || {}; var x = t.maxres || t.standard || t.high || t.medium || t.default; return x ? x.url : ''; }

  function update() {
    var now = Date.now(), mode = override || C.liveMode || 'auto', occ = occurrences(now);
    var cur = occ.filter(function (o) { return o.start <= now && now < o.end; })[0];
    var next = occ.filter(function (o) { return o.start > now; })[0];

    // pick the best source we have
    var src = null;
    if (api && now - api.t < 5 * 60000) src = api;
    else if (remote && typeof remote.live === 'boolean' && !(remote.live && remote.since && now - Date.parse(remote.since) > 18 * 3600000)) {
      src = { live: remote.live, id: remote.videoId, title: remote.title, thumb: remote.thumbnail, from: 'action' };
    }
    var checking = mode === 'auto' && booting && !src;
    var live = mode === 'live' || (mode === 'auto' && !checking && (src ? src.live : !!cur));
    var use = live && src && src.live && mode !== 'live' ? src : null;
    var bucket = Math.floor(now / 300000);   // live thumbnails change during the stream: refresh every 5 min
    var info = {
      title: (use && use.title) || C.live.title || (cur && cur.s.title) || 'Live now',
      platform: C.live.platform || 'YouTube',
      videoId: (use && use.id) || ((String(C.live.url || '').match(/[?&]v=([\w-]{11})/) || [])[1]) || null,
      viewers: live ? (use && use.viewers != null ? use.viewers : (C.live.viewers != null ? C.live.viewers : null)) : null,
      startedAt: (use && use.startedAt) || null,
      thumbnail: (use && use.thumb ? use.thumb + (use.thumb.indexOf('?') < 0 ? '?v=' + bucket : '') : '') || C.live.thumbnail || '',
      channelId: store.get('vq-ch:' + handle) || null
    };
    info.url = info.videoId ? 'https://www.youtube.com/watch?v=' + info.videoId : (C.live.url || C.youtube);
    body.classList.toggle('is-live', live);
    body.classList.toggle('is-checking', checking);

    setStatus($('navstatus'), live, checking ? 'Checking…' : 'Offline', info);
    setStatus($('cardstatus'), live, checking ? 'Checking…' : next ? 'Offline · next ' + dayWord(next.start, true) + ' ' + fTime.format(new Date(next.start)) : 'Offline', info);
    var fl = $('footlive');
    if (fl) {
      fl.querySelector('span').textContent = live ? 'LIVE NOW · Watch on ' + info.platform : (next ? 'Next stream ' + dayWord(next.start) + ', ' + fTime.format(new Date(next.start)) : 'Live on YouTube');
      if (live) { fl.href = info.url; fl.target = '_blank'; fl.rel = 'noopener noreferrer'; } else { fl.href = '/pages/schedule/'; fl.removeAttribute('target'); }
    }

    state = { live: live, checking: checking, cur: cur, next: next, occ: occ, now: now, info: info, mode: mode, source: use ? (use.from || 'api') : (live ? mode : 'none') };
    subs.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  // ---------- 1. YouTube API: find the stream that's live on your channel right now ----------
  // About 2 quota units per check, at most once a minute per open tab, shared between pages.
  function yt(path, params) {
    params.key = C.youtubeApiKey;
    var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(ytBase + path + '?' + q).then(function (r) { if (!r.ok) throw new Error('YouTube API ' + r.status); return r.json(); });
  }
  function channelId() {
    var saved = store.get('vq-ch:' + handle);
    if (saved) return Promise.resolve(saved);
    return yt('channels', { part: 'id', forHandle: '@' + handle }).then(function (j) {
      var id = j.items && j.items[0] && j.items[0].id;
      if (!id) throw new Error('Channel not found');
      store.set('vq-ch:' + handle, id); return id;
    });
  }
  var checking = false;
  function checkApi() {
    if (!C.youtubeApiKey || !handle || !window.fetch || document.hidden || checking) return;
    try {
      var cached = JSON.parse(store.get('vq-api', true) || 'null');
      if (cached && Date.now() - cached.t < 55000) { api = cached; ready(); update(); return; }
    } catch (e) {}
    checking = true;
    channelId()
      .then(function (ch) { return yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + ch.slice(2), maxResults: 10 }); })
      .then(function (j) {
        var ids = (j.items || []).map(function (i) { return i.contentDetails.videoId; });
        if (remote && remote.videoId && ids.indexOf(remote.videoId) < 0) ids.unshift(remote.videoId);  // also check what the Action found
        if (api && api.id && ids.indexOf(api.id) < 0) ids.unshift(api.id);                             // and the stream we last saw live
        if (!ids.length) return { items: [] };
        return yt('videos', { part: 'snippet,liveStreamingDetails', id: ids.slice(0, 50).join(',') });
      })
      .then(function (j) {
        var v = (j.items || []).filter(function (x) {
          var d = x.liveStreamingDetails || {};
          return x.snippet.liveBroadcastContent === 'live' && d.actualStartTime && !d.actualEndTime;
        })[0];
        var d = v && v.liveStreamingDetails;
        if (!v && api && api.live) {
          // we had a live stream a minute ago: only go offline if YouTube says it ended,
          // or if it's missing twice in a row (one glitchy answer won't hide the badge)
          var last = (j.items || []).filter(function (x) { return x.id === api.id; })[0];
          var ended = last && last.liveStreamingDetails && last.liveStreamingDetails.actualEndTime;
          if (!ended && ++offStreak < 2) { api.t = Date.now(); store.set('vq-api', JSON.stringify(api), true); ready(); update(); return; }
        }
        offStreak = 0;
        api = v ? {
          live: true, id: v.id, title: v.snippet.title, thumb: bestThumb(v.snippet.thumbnails),
          viewers: d.concurrentViewers != null ? +d.concurrentViewers : null, startedAt: d.actualStartTime, t: Date.now()
        } : { live: false, t: Date.now() };
        store.set('vq-api', JSON.stringify(api), true);
        ready(); update();
      })
      .catch(function (e) { console.warn('Live check:', e.message); ready(); update(); })    // quota or network problem: status.json takes over
      .then(function () { checking = false; });
  }

  // ---------- 2. status.json from the GitHub Action ----------
  function poll() {
    if (!C.statusFile || !window.fetch) return;
    fetch(url(C.statusFile) + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { remote = j; if (!C.youtubeApiKey) ready(); update(); })
      .catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { poll(); checkApi(); } });

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
    fit: fit, reveal: reveal, refresh: update, checkNow: checkApi,
    ART: '<div class="art"><div class="eq"><b></b><b></b><b></b><b></b></div></div>',
    on: function (fn) { subs.push(fn); if (state) fn(state); },
    get state() { return state; }
  };

  update();
  poll();
  checkApi();
  setInterval(update, 15000);
  setInterval(poll, 60000);
  setInterval(checkApi, 60000);
})();
