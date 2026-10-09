/* VOQCL — schedule page: week list with click-to-open day boxes */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc, fTime = VQ.fTime, range = VQ.range;
  var slot = $('schedule-slot');
  try { $('tzname').textContent = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) {}
  var fDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  var openDay = null, lastHtml = '', lastState = null;
  var CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var yt = C.youtube || 'https://www.youtube.com';

  function btn(cls, href, text) { return '<a class="dp-btn' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + text + '</a>'; }

  // the compact box that opens under a day
  function dayBox(list, st) {
    var o = list && list[0], now = st.now, info = st.info, next = st.next;
    if (!o) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>No stream this day</b><small>' +
        (next ? 'Next stream ' + esc(VQ.dayWord(next.start)) + ' at ' + esc(fTime.format(new Date(next.start))) : 'Check back soon') +
        '</small></div>' + btn('', yt, 'Get notified') + '</div>';
    }
    var during = o.start <= now && now < o.end;
    if (during && st.live) {
      var th = '<a class="dp-th" href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer" aria-label="Watch the stream">' +
        (info.thumbnail ? '<img src="' + esc(info.thumbnail) + '" alt="" loading="lazy">' : VQ.ART) + '<span class="lc-tag">LIVE</span></a>';
      return '<div class="dp live">' + th + '<div class="dp-txt"><b>I\'m live right now</b><small>' +
        esc(info.title) + (info.viewers != null ? ' &middot; ' + VQ.viewers(info.viewers) + ' watching' : '') + '</small></div>' +
        btn(' red', info.url, '<svg viewBox="0 0 24 24"><use href="#i-play"/></svg>Watch live') + '</div>';
    }
    if (during) {
      return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starting soon</b><small>Scheduled now, ' +
        esc(range(o)) + '</small></div>' + btn('', yt, 'Check YouTube') + '</div>';
    }
    return '<div class="dp"><span class="dp-dot"></span><div class="dp-txt"><b>Starts in ' + VQ.inTime(o.start - now) + '</b><small>' +
      esc(fDate.format(new Date(o.start))) + ', ' + esc(range(o)) + '</small></div>' + btn('', yt, 'Get notified') + '</div>';
  }

  function render(st) {
    lastState = st;
    if (!C.schedule.length) {
      slot.innerHTML = '<div class="panel empty-state"><h2 class="h3">Schedule coming soon</h2><p class="lead">No fixed times yet. Subscribe on YouTube and you\'ll get notified whenever I go live.</p></div>';
      return;
    }
    var now = st.now, seen = {}, byDay = {};
    st.occ.forEach(function (o) {
      if (o.end <= now || seen[o.i]) return; seen[o.i] = 1;
      var wd = new Date(o.start).getDay(); (byDay[wd] = byDay[wd] || []).push(o);
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
