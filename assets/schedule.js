/* VOQCL — schedule page: week list with click-to-open day boxes */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc, fTime = VQ.fTime, range = VQ.range;
  var slot = $('schedule-slot');
  var tz = 'your time zone';
  try { tz = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) {}
  var DAYN = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
  function listDays(sch) {
    var order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], d = [];
    sch.forEach(function (x) { var k = String(x.day).slice(0, 3); if (!x.off && d.indexOf(k) < 0) d.push(k); });
    d.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    if (d.length === 5 && d.join() === 'Mon,Tue,Wed,Thu,Fri') return 'on weekdays';
    if (d.length === 7) return 'every day';
    var n = d.map(function (k) { return DAYN[k]; });
    return 'on ' + (n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : n[0]);
  }
  VQ.onCreator(function (c) {
    $('schedhead').textContent = c.owner ? 'When I\'m live.' : 'When ' + c.name + ' is live.';
    var who = c.owner ? 'I stream' : c.name + ' streams';
    $('schedlead').innerHTML = (c.schedule.length ? esc(who) + ' on YouTube ' + listDays(c.schedule) + '. ' : '') +
      'Times are shown in your time zone (' + esc(tz) + ').' +
      (c.owner ? ' Subscribe and turn on the bell to get a notification the moment I go live.' : '');
    openDay = null; lastHtml = '';
  });
  var fDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  var openDay = null, lastHtml = '', lastState = null;
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  

  function btn(cls, href, text) { return '<a class="dp-btn' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + text + '</a>'; }

  // the compact box that opens under a day
  function dayBox(list, st) {
    var o = list && list[0], now = st.now, info = st.info, next = st.next;
    if (!o) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>No stream this day</b><small>' +
        (next ? 'Next stream ' + esc(VQ.when(next, false, ' at ')) : 'Check back soon') +
        '</small></div>' + btn('', st.creator.youtube, 'Get notified') + '</div>';
    }
    var during = o.start <= now && now < o.end;
    if (during && st.live) {
      var th = '<a class="dp-th" href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer" aria-label="Watch the stream">' +
        (info.thumbnail ? '<img src="' + esc(info.thumbnail) + '" alt="" loading="lazy">' : VQ.ART) + '<span class="lc-tag">LIVE</span></a>';
      return '<div class="dp live">' + th + '<div class="dp-txt"><b>' + (st.creator.owner ? 'I\'m' : esc(st.creator.name) + ' is') + ' live right now</b><small>' +
        esc(info.title) + (info.viewers != null ? ' &middot; ' + VQ.viewers(info.viewers) + ' watching' : '') + '</small></div>' +
        btn(' red', info.url, '<svg viewBox="0 0 24 24"><use href="#i-play"/></svg>Watch live') + '</div>';
    }
    if (o.allDay) {
      var isToday = during || VQ.dayWord(o.ref) === 'today';
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>' + (isToday ? 'Streams today' : 'Streams ' + esc(VQ.dayWord(o.ref))) + '</b><small>' +
        'Time varies. The LIVE badge turns on by itself when the stream starts.</small></div>' + btn('', st.creator.youtube, 'Get notified') + '</div>';
    }
    if (during) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starting soon</b><small>Scheduled now, ' +
        esc(range(o)) + '</small></div>' + btn('', st.creator.youtube, 'Check YouTube') + '</div>';
    }
    return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starts in ' + VQ.inTime(o.start - now) + '</b><small>' +
      esc(fDate.format(new Date(o.start))) + ', ' + esc(range(o)) + '</small></div>' + btn('', st.creator.youtube, 'Get notified') + '</div>';
  }

  function render(st) {
    lastState = st;
    if (!st.creator.schedule.length) {
      var c0 = st.creator, h0 = st.live
        ? '<div class="panel empty-state"><h2 class="h3">' + esc(c0.name) + ' is live right now</h2><p class="lead">No set schedule, but they\'re streaming at the moment.</p><div class="btn-row" style="justify-content:center"><a class="btn primary" href="' + esc(st.info.url) + '" target="_blank" rel="noopener noreferrer"><svg class="ico"><use href="#i-play"/></svg> Watch live</a></div></div>'
        : '<div class="panel empty-state"><h2 class="h3">No set schedule</h2><p class="lead">' + (c0.owner ? 'No fixed times yet. Subscribe on YouTube and you\'ll get notified whenever I go live.' : esc(c0.name) + ' streams whenever. The LIVE badge turns on by itself when they go live.') + '</p><div class="btn-row" style="justify-content:center"><a class="btn primary" href="' + esc(c0.youtube) + '" target="_blank" rel="noopener noreferrer"><svg class="ico"><use href="#i-yt"/></svg> ' + esc(c0.name) + ' on YouTube</a></div></div>';
      if (h0 !== lastHtml) { slot.innerHTML = h0; lastHtml = h0; VQ.fit(); }
      return;
    }
    var now = st.now, seen = {}, byDay = {};
    st.occ.forEach(function (o) {
      if (o.end <= now || seen[o.i]) return; seen[o.i] = 1;
      var wd = o.allDay ? o.wd : new Date(o.start).getDay(); (byDay[wd] = byDay[wd] || []).push(o);
    });
    var today = new Date().getDay(), i = 0;
    var html = '<div class="days">' + [1, 2, 3, 4, 5, 6, 0].map(function (wd) {
      var name = VQ.fDay.format(new Date(2024, 0, 7 + wd, 12)), list = byDay[wd];
      var isNow = !!list && st.live && list[0].start <= now && now < list[0].end;
      var cls = 'day' + (wd === today ? ' today' : '') + (!list ? ' off' : '') + (isNow ? ' live' : '');
      var t = list ? list.map(function (o) { return esc(o.s.title); }).join(', ') : 'No stream';
      var h = list ? list.map(range).join(', ') : 'Off';
      var open = openDay === wd;
      return '<div class="dwrap' + (open ? ' open' : '') + '" data-wd="' + wd + '">' +
        '<button class="' + cls + '" type="button" style="--d:' + (i++) + '" aria-expanded="' + open + '" aria-controls="dp-' + wd + '">' +
          '<span class="d">' + esc(name) + '</span><span class="t">' + t + '</span><span class="h">' + esc(h) + CHEV + '</span>' +
        '</button>' +
        '<div class="dpanel" id="dp-' + wd + '" role="region"><div class="dpin">' + dayBox(list, st) + '</div></div>' +
      '</div>';
    }).join('') + '</div>';
    if (html === lastHtml) return;
    var f = document.activeElement && document.activeElement.closest && document.activeElement.closest('.dwrap');
    var fwd = f && slot.contains(f) ? f.getAttribute('data-wd') : null;
    slot.innerHTML = html; lastHtml = html;
    if (fwd != null) { var b = slot.querySelector('.dwrap[data-wd="' + fwd + '"] .day'); if (b) b.focus({ preventScroll: true }); }
    VQ.fit();
  }

  slot.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && e.target.parentNode.classList.contains('dp-th')) e.target.outerHTML = VQ.ART;
  }, true);
  slot.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button.day');
    if (!b) return;
    var wrap = b.parentNode, wd = +wrap.getAttribute('data-wd'), willOpen = !wrap.classList.contains('open');
    [].forEach.call(slot.querySelectorAll('.dwrap.open'), function (w) { w.classList.remove('open'); w.firstChild.setAttribute('aria-expanded', 'false'); });
    if (willOpen) { wrap.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    openDay = willOpen ? wd : null;
    lastHtml = '';
    setTimeout(VQ.fit, 430);
  });

  VQ.on(render);
})();
