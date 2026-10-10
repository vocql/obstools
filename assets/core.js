/* =====================================================================
   VOQCL — shared code for every page
   creators + theme switching, nav, live status (badge, footer, glow),
   timezone math, fit-to-screen, reveal animations, preview switch.
   Page files (home.js, schedule.js, live.js) subscribe with
   VQ.on(function (state) { … }) and VQ.onCreator(function (creator) { … }).
   ===================================================================== */
(function () {
  var C = window.CONFIG || {};
  C.live = C.live || {};
  var body = document.body, root = document.documentElement, PAGE = body.getAttribute('data-page');
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(f) { return !f ? '' : /^(https?:)?\//.test(f) ? f : '/' + f; }   // site files always load from the root
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} },
    del: function (k, s) { try { (s ? sessionStorage : localStorage).removeItem(k); } catch (e) {} }
  };
  function getJSON(k, s) { try { return JSON.parse(store.get(k, s) || 'null'); } catch (e) { return null; } }
  function viewers(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n); }

  if (!$('loader')) { body.classList.remove('loading'); body.classList.add('ready'); }
  var yr = $('year'); if (yr) yr.textContent = new Date().getFullYear();

  // =====================================================================
  // CREATORS — the first one in the list is you (the site owner)
  // =====================================================================
  var CREATORS = (C.creators && C.creators.length ? C.creators : [{ id: 'me', name: 'me', youtube: C.youtube }]).map(function (c, i) {
    var o = {};
    for (var k in c) o[k] = c[k];
    o.owner = i === 0;
    o.handle = (String(o.youtube || '').match(/@([\w.-]+)/) || [])[1] || '';
    o.timezone = o.timezone || C.timezone || 'America/Chicago';
    if (o.owner && !o.schedule) o.schedule = C.schedule || [];
    o.schedule = o.schedule || [];
    o.socials = o.socials && o.socials.length ? o.socials : [{ type: 'youtube', url: o.youtube }];
    return o;
  });
  function byId(id) { return CREATORS.filter(function (c) { return c.id === id; })[0]; }
  // which creator to show: a ?u= link > what you picked this visit > your saved theme > the owner
  var qp = (location.search.match(/[?&]u=([\w-]+)/) || [])[1];
  var saved = byId(store.get('vq-theme'));
  var cur = byId(qp) || byId(store.get('vq-creator', true)) || saved || CREATORS[0];
  if (qp && byId(qp)) store.set('vq-creator', cur.id, true);
  var creatorSubs = [];

  // channel profile (picture + banner + channel id), fetched from YouTube once a day per creator
  function profile(c) { return getJSON('vq-prof:' + c.handle) || {}; }
  function pfpOf(c) { return c.pfp || profile(c).avatar || ''; }
  function bgOf(c) { return c.background || profile(c).banner || ''; }

  function applyTheme() {
    var bg = bgOf(cur);
    if (bg) root.style.setProperty('--bg-img', 'url("' + bg.replace(/"/g, '%22') + '")'); else root.style.removeProperty('--bg-img');
    [].forEach.call(document.querySelectorAll('[data-cpfp]'), function (img) {
      var src = pfpOf(cur), box = img.closest('.pfp');
      if (box) box.classList.toggle('empty', !src);
      if (src && img.getAttribute('src') !== src) img.src = src;
      if (!src) img.removeAttribute('src');
    });
    [].forEach.call(document.querySelectorAll('[data-cname]'), function (el) { el.textContent = cur.name; });
    [].forEach.call(document.querySelectorAll('[data-cinitial]'), function (el) { el.textContent = cur.name.charAt(0).toLowerCase(); });
    [].forEach.call(document.querySelectorAll('[data-chandle]'), function (el) { el.textContent = '@' + cur.handle; });
    renderSwitcher();
  }
  function setCreator(id) {
    var c = byId(id); if (!c || c === cur) return;
    cur = c; store.set('vq-creator', c.id, true);   // just for this visit until they press Save
    try { history.replaceState(null, '', location.pathname + (c.owner ? '' : '?u=' + c.id) + location.hash); } catch (e) {}
    switchedAt = Date.now();
    applyTheme();
    creatorSubs.forEach(function (fn) { try { fn(cur); } catch (e) { console.error(e); } });
    update(); checkApi(true); VQ.fit();
  }

  // a picture that fails to load falls back to the first letter of the name
  document.addEventListener('error', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG') return;
    if (t.hasAttribute('data-cpfp')) { var box = t.closest('.pfp'); if (box) box.classList.add('empty'); }
    else if (t.parentNode && t.parentNode.classList && t.parentNode.classList.contains('cs-av')) {
      var item = t.closest('[data-id]'), c = item ? byId(item.getAttribute('data-id')) : cur;
      t.outerHTML = '<b>' + esc((c || cur).name.charAt(0)) + '</b>';
    }
  }, true);

  // ---------- creator switcher in the navbar ----------
  var sw = $('cswitch'), swBtn = $('csbtn'), swMenu = $('csmenu');
  function renderSwitcher() {
    if (!sw) return;
    if (CREATORS.length < 2) { sw.hidden = true; return; }
    var p = pfpOf(cur);
    swBtn.querySelector('.cs-av').innerHTML = p ? '<img src="' + esc(p) + '" alt="">' : '<b>' + esc(cur.name.charAt(0)) + '</b>';
    swBtn.querySelector('.cs-name').textContent = cur.name;
    swBtn.classList.toggle('live', !!liveOf(cur));
    swMenu.innerHTML = CREATORS.map(function (c) {
      var pp = pfpOf(c), on = !!liveOf(c);
      return '<button type="button" role="option" class="cs-item' + (c === cur ? ' on' : '') + (on ? ' live' : '') + '" data-id="' + esc(c.id) + '" aria-selected="' + (c === cur) + '">' +
        '<span class="cs-av">' + (pp ? '<img src="' + esc(pp) + '" alt="">' : '<b>' + esc(c.name.charAt(0)) + '</b>') + '</span>' +
        '<span class="cs-txt"><b>' + esc(c.name) + (saved === c ? ' <i class="cs-star" title="Your saved theme">✓</i>' : '') + '</b><small>@' + esc(c.handle) + '</small></span>' +
        (on ? '<span class="cs-live">LIVE</span>' : '<span class="cs-off">Offline</span>') +
      '</button>';
    }).join('') +
    '<div class="cs-save">' + (saved === cur
      ? '<span class="cs-saved"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg><span>Saved as your theme</span></span>' + (saved !== CREATORS[0] ? '<button type="button" class="cs-reset" data-act="reset">Reset</button>' : '')
      : '<button type="button" class="cs-savebtn" data-act="save" title="Open the site as ' + esc(cur.name) + ' every time"><svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>Save as my theme</button>') +
    '</div>';
  }
  if (sw) {
    swBtn.addEventListener('click', function (e) { e.stopPropagation(); var o = sw.classList.toggle('open'); swBtn.setAttribute('aria-expanded', String(o)); });
    swMenu.addEventListener('click', function (e) {
      var act = e.target.closest && e.target.closest('[data-act]');
      if (act) {
        e.stopPropagation();
        if (act.getAttribute('data-act') === 'save') { saved = cur; store.set('vq-theme', cur.id); }
        else { saved = null; store.del('vq-theme'); store.del('vq-creator', true); setCreator(CREATORS[0].id); }
        renderSwitcher(); return;
      }
      var b = e.target.closest && e.target.closest('.cs-item'); if (!b) return;
      sw.classList.remove('open'); swBtn.setAttribute('aria-expanded', 'false');
      setCreator(b.getAttribute('data-id'));
    });
    document.addEventListener('click', function (e) { if (!sw.contains(e.target)) { sw.classList.remove('open'); swBtn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sw.classList.remove('open'); });
  }

  // ---------- time: a creator's schedule (their zone) -> real moments -> visitor's local time ----------
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], fmts = {};
  function partsIn(ts, tz) {
    var pf = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    var o = {}; pf.formatToParts(new Date(ts)).forEach(function (p) { o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: (+o.hour) % 24, mi: +o.minute, s: +o.second };
  }
  function offsetAt(ts, tz) { ts = Math.floor(ts / 1000) * 1000; var p = partsIn(ts, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - ts; }
  function zoned(y, m, d, h, mi, tz) { var g = Date.UTC(y, m - 1, d, h, mi), t = g - offsetAt(g, tz); return g - offsetAt(t, tz); }
  function occurrences(now, c) {
    var tz = c.timezone, p = partsIn(now, tz), out = [];
    for (var k = -1; k <= 8; k++) {
      var b = new Date(Date.UTC(p.y, p.m - 1, p.d + k)), wd = b.getUTCDay();
      c.schedule.forEach(function (s, i) {
        if (s.off || WD.indexOf(String(s.day).slice(0, 3)) !== wd) return;
        var y = b.getUTCFullYear(), m = b.getUTCMonth() + 1, d = b.getUTCDate();
        if (!s.start || !s.end) {
          // a day with no set time: "streams on Tuesdays, time varies"
          out.push({ s: s, i: i, allDay: true, wd: wd, start: zoned(y, m, d, 0, 0, tz), end: zoned(y, m, d + 1, 0, 0, tz), ref: zoned(y, m, d, 12, 0, tz) });
          return;
        }
        var a = s.start.split(':').map(Number), z = s.end.split(':').map(Number);
        var st = zoned(y, m, d, a[0], a[1] || 0, tz), en = zoned(y, m, d, z[0], z[1] || 0, tz);
        if (en <= st) en += 86400000;
        out.push({ s: s, i: i, start: st, end: en, ref: st });
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
  function range(o) { return o.allDay ? 'Time varies' : fTime.format(new Date(o.start)) + ' – ' + fTime.format(new Date(o.end)); }
  // "today", "Tuesday 7:00 PM", or just "Tuesday" for days without a set time
  function when(o, short, sep) { return dayWord(o.ref, short) + (o.allDay ? '' : (sep || ' ') + fTime.format(new Date(o.start))); }
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

  // ---------- fit to screen ----------
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
  function reveal(r) { [].forEach.call((r || document).querySelectorAll('.reveal'), function (el) { if (io) io.observe(el); else el.classList.add('in'); }); }
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
  // LIVE STATE
  //  1. YouTube API (youtubeApiKey): checks the creator you're viewing every minute and the
  //     others every few minutes, and gets the exact stream, title, thumbnail, viewers, start time.
  //  2. status.json from the GitHub Action (only for you, the owner), if the API isn't available.
  //  3. The creator's schedule, if neither is available.
  // =====================================================================
  var override = store.get('vq-preview', true), remote = null, subs = [], state = null;
  var apiMap = getJSON('vq-api2', true) || {};        // creator id -> last API answer (shared between pages)
  var streak = {}, answered = {}, lastCheck = {}, switchedAt = Date.now(), checking = false;
  var ytBase = 'https://www.googleapis.com/youtube/v3/';
  setTimeout(function () { switchedAt = 0; update(); }, 6500);

  function apiFresh(c) { var a = apiMap[c.id]; return a && Date.now() - a.t < 5 * 60000 ? a : null; }
  function liveOf(c) {
    var a = apiFresh(c);
    if (a) return a.live ? a : null;
    if (c.owner && remote && remote.live && !(remote.since && Date.now() - Date.parse(remote.since) > 18 * 3600000))
      return { live: true, id: remote.videoId, title: remote.title, thumb: remote.thumbnail, from: 'action' };
    return null;
  }
  function setStatus(el, live, offText, info) {
    if (!el) return;
    el.querySelector('span').textContent = live ? 'LIVE NOW' : offText;
    if (live) { el.href = info.url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    else { el.href = '/pages/schedule/'; el.removeAttribute('target'); }
  }
  function bestThumb(t) { t = t || {}; var x = t.maxres || t.standard || t.high || t.medium || t.default; return x ? x.url : ''; }

  function update() {
    var now = Date.now(), c = cur, occ = occurrences(now, c);
    var mode = c.owner ? (override || C.liveMode || 'auto') : (override === 'live' || override === 'offline' ? override : 'auto');
    var sched = occ.filter(function (o) { return !o.allDay && o.start <= now && now < o.end; })[0];   // only timed slots count as 'probably live'
    var next = occ.filter(function (o) { return o.allDay ? o.end > now : o.start > now; })[0];

    var src = apiFresh(c);
    if (!src && c.owner && remote && typeof remote.live === 'boolean' && !(remote.live && remote.since && now - Date.parse(remote.since) > 18 * 3600000))
      src = { live: remote.live, id: remote.videoId, title: remote.title, thumb: remote.thumbnail, from: 'action' };
    var canCheck = !!(C.youtubeApiKey || (c.owner && C.statusFile));
    var isChecking = mode === 'auto' && !src && canCheck && !answered[c.id] && now - switchedAt < 6500;
    var live = mode === 'live' || (mode === 'auto' && !isChecking && (src ? src.live : !!sched));
    var use = live && src && src.live && mode !== 'live' ? src : null;
    var bucket = Math.floor(now / 300000);
    var info = {
      title: (use && use.title) || (c.owner && C.live.title) || (sched && sched.s.title) || c.name + ' is live',
      platform: (c.owner && C.live.platform) || 'YouTube',
      videoId: (use && use.id) || (c.owner ? ((String(C.live.url || '').match(/[?&]v=([\w-]{11})/) || [])[1]) : null) || null,
      viewers: live ? (use && use.viewers != null ? use.viewers : (c.owner && C.live.viewers != null ? C.live.viewers : null)) : null,
      startedAt: (use && use.startedAt) || null,
      thumbnail: (use && use.thumb ? use.thumb + (use.thumb.indexOf('?') < 0 ? '?v=' + bucket : '') : '') || (c.owner && C.live.thumbnail) || '',
      channelId: profile(c).channelId || null
    };
    info.url = info.videoId ? 'https://www.youtube.com/watch?v=' + info.videoId : ((c.owner && C.live.url) || c.youtube.replace(/\/+$/, '') + '/live');

    body.classList.toggle('is-live', live);
    body.classList.toggle('is-checking', isChecking);
    setStatus($('navstatus'), live, isChecking ? 'Checking…' : 'Offline', info);
    setStatus($('cardstatus'), live, isChecking ? 'Checking…' : next ? 'Offline · next ' + when(next, true) : 'Offline', info);
    var fl = $('footlive');
    if (fl) {
      fl.querySelector('span').textContent = live ? 'LIVE NOW · ' + c.name + ' on ' + info.platform : (next ? (c.owner ? 'Next stream ' : c.name + ' next live ') + when(next, false, ', ') : (c.owner ? 'Live on YouTube' : c.name + ' on YouTube'));
      if (live) { fl.href = info.url; fl.target = '_blank'; fl.rel = 'noopener noreferrer'; } else { fl.href = '/pages/schedule/'; fl.removeAttribute('target'); }
    }
    renderSwitcher();
    state = { creator: c, live: live, checking: isChecking, cur: sched, next: next, occ: occ, now: now, info: info, mode: mode };
    subs.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } });
  }

  // ---------- YouTube API ----------
  function yt(path, params) {
    params.key = C.youtubeApiKey;
    var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(ytBase + path + '?' + q).then(function (r) { if (!r.ok) throw new Error('YouTube API ' + r.status); return r.json(); });
  }
  // picture, banner and channel id (1 quota unit, cached for a day)
  function loadProfile(c) {
    var p = getJSON('vq-prof:' + c.handle);
    if (p && p.channelId && Date.now() - p.t < 86400000) return Promise.resolve(p);
    return yt('channels', { part: 'snippet,brandingSettings', forHandle: '@' + c.handle }).then(function (j) {
      var it = j.items && j.items[0];
      if (!it) throw new Error('Channel @' + c.handle + ' not found');
      var b = it.brandingSettings && it.brandingSettings.image && it.brandingSettings.image.bannerExternalUrl;
      p = { channelId: it.id, avatar: bestThumb(it.snippet.thumbnails), banner: b ? b + '=w2560-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj' : '', title: it.snippet.title, t: Date.now() };
      store.set('vq-prof:' + c.handle, JSON.stringify(p));
      if (c === cur) applyTheme(); else renderSwitcher();
      return p;
    });
  }
  // Each check: 1 unit per creator checked + 1 for the batch. The creator you're viewing is
  // checked every minute, the others every 3 minutes (for the LIVE dots in the switcher).
  function checkApi(force) {
    if (!C.youtubeApiKey || !window.fetch || document.hidden || checking) return;
    var now = Date.now();
    var due = CREATORS.filter(function (c) {
      if (!c.handle) return false;
      var gap = c === cur ? 55000 : 180000, a = apiMap[c.id];
      return (force && c === cur && !(a && now - a.t < 20000)) || !a || now - a.t >= gap;
    });
    if (!due.length) { CREATORS.forEach(function (c) { if (apiMap[c.id]) answered[c.id] = true; }); update(); return; }
    checking = true;
    Promise.all(due.map(function (c) {
      return loadProfile(c)
        .then(function (p) { return yt('playlistItems', { part: 'contentDetails', playlistId: 'UU' + p.channelId.slice(2), maxResults: 8 }); })
        .then(function (j) {
          var ids = (j.items || []).map(function (i) { return i.contentDetails.videoId; });
          var prev = apiMap[c.id];
          if (prev && prev.id && ids.indexOf(prev.id) < 0) ids.unshift(prev.id);
          if (c.owner && remote && remote.videoId && ids.indexOf(remote.videoId) < 0) ids.unshift(remote.videoId);
          return { c: c, ids: ids };
        })
        .catch(function (e) { console.warn('Live check (' + c.name + '):', e.message); answered[c.id] = true; return null; });
    })).then(function (lists) {
      lists = lists.filter(Boolean);
      var all = [];
      lists.forEach(function (l) { l.ids.forEach(function (id) { if (all.indexOf(id) < 0) all.push(id); }); });
      if (!all.length) return;
      return yt('videos', { part: 'snippet,liveStreamingDetails', id: all.slice(0, 50).join(',') }).then(function (j) {
        var items = j.items || [];
        lists.forEach(function (l) {
          var c = l.c, mine = items.filter(function (x) { return l.ids.indexOf(x.id) >= 0; });
          var v = mine.filter(function (x) { var d = x.liveStreamingDetails || {}; return x.snippet.liveBroadcastContent === 'live' && d.actualStartTime && !d.actualEndTime; })[0];
          var prev = apiMap[c.id];
          answered[c.id] = true;
          if (!v && prev && prev.live) {
            // one missing answer won't hide the badge: only go offline if the stream ended or it's missing twice
            var last = mine.filter(function (x) { return x.id === prev.id; })[0];
            var ended = last && last.liveStreamingDetails && last.liveStreamingDetails.actualEndTime;
            if (!ended && (streak[c.id] = (streak[c.id] || 0) + 1) < 2) { prev.t = Date.now(); return; }
          }
          streak[c.id] = 0;
          var d = v && v.liveStreamingDetails;
          apiMap[c.id] = v ? { live: true, id: v.id, title: v.snippet.title, thumb: bestThumb(v.snippet.thumbnails), viewers: d.concurrentViewers != null ? +d.concurrentViewers : null, startedAt: d.actualStartTime, t: Date.now() } : { live: false, t: Date.now() };
        });
      });
    }).catch(function (e) { console.warn('Live check:', e.message); due.forEach(function (c) { answered[c.id] = true; }); })
      .then(function () { checking = false; store.set('vq-api2', JSON.stringify(apiMap), true); update(); });
  }

  // ---------- status.json from the GitHub Action (owner only) ----------
  function poll() {
    if (!C.statusFile || !window.fetch) return;
    fetch(url(C.statusFile) + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { remote = j; if (!C.youtubeApiKey) answered[CREATORS[0].id] = true; update(); })
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
    mark();
  } else if (pv) pv.remove();

  window.VQ = {
    C: C, PAGE: PAGE, $: $, esc: esc, url: url, store: store, viewers: viewers,
    fTime: fTime, fDay: fDay, dayWord: dayWord, range: range, when: when, inTime: inTime,
    fit: fit, reveal: reveal, refresh: update, checkNow: function () { checkApi(true); },
    creators: CREATORS, setCreator: setCreator, pfpOf: pfpOf,
    get creator() { return cur; },
    ART: '<div class="art"><div class="eq"><b></b><b></b><b></b><b></b></div></div>',
    on: function (fn) { subs.push(fn); if (state) fn(state); },
    onCreator: function (fn) { creatorSubs.push(fn); fn(cur); },
    get state() { return state; }
  };

  CREATORS.forEach(function (c) { if (apiFresh(c)) answered[c.id] = true; });
  applyTheme();
  update();
  poll();
  checkApi(true);
  setInterval(update, 15000);
  setInterval(poll, 60000);
  setInterval(checkApi, 30000);
})();
