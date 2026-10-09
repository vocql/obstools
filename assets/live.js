/* VOQCL — Videos page: shows your live stream, pulled straight from YouTube */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc;
  var slot = $('lvslot'), head = $('lvhead'), shownKey = null, wasLive = null;
  var yt = C.youtube || 'https://www.youtube.com';

  function since(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var m = Math.max(1, Math.round((Date.now() - t) / 60000)), h = Math.floor(m / 60);
    return 'live for ' + (h ? h + 'h ' + (m % 60) + 'm' : m + 'm');
  }
  function meta(info) {
    var bits = [];
    if (info.viewers != null) bits.push('<svg class="ico s"><use href="#i-eye"/></svg>' + VQ.viewers(info.viewers) + ' watching');
    if (info.startedAt) bits.push(since(info.startedAt));
    if (!bits.length) bits.push('Streaming now on ' + esc(info.platform));
    return bits.join('<i class="sep"></i>');
  }

  function render(st) {
    var info = st.info;
    if (st.live) {
      // which player to show: the exact stream, or your channel's live stream if we only know the channel
      var src = info.videoId ? 'https://www.youtube.com/embed/' + encodeURIComponent(info.videoId)
        : info.channelId ? 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(info.channelId) : '';
      var key = 'live:' + src;
      if (key !== shownKey) {                       // only rebuild the player when the stream changes
        shownKey = key;
        slot.innerHTML =
          '<div class="lv">' +
            '<div class="lv-frame">' + (src
              ? '<iframe src="' + src + (src.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1&mute=1&rel=0&playsinline=1" title="Live stream" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
              : '<a class="lv-poster" href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer">' + (info.thumbnail ? '<img src="' + esc(info.thumbnail) + '" alt="">' : VQ.ART) + '<span class="lv-play"><svg class="ico"><use href="#i-play"/></svg></span></a>') +
            '</div>' +
            '<div class="lv-bar">' +
              '<span class="lv-tag">LIVE</span>' +
              '<div class="lv-txt"><b id="lvtitle"></b><small id="lvmeta"></small></div>' +
              '<a class="btn primary lv-btn" id="lvopen" target="_blank" rel="noopener noreferrer"><svg class="ico"><use href="#i-yt"/></svg> Watch on YouTube</a>' +
            '</div>' +
          '</div>';
        VQ.fit();
      }
      $('lvtitle').textContent = info.title;     // title, viewers and time update in place without reloading the player
      $('lvmeta').innerHTML = meta(info);
      $('lvopen').href = info.url;
      head.textContent = 'Live now.';
    } else {
      var next = st.next;
      var key2 = 'off:' + (next ? next.start : '') + ':' + Math.floor(Date.now() / 60000);
      if (key2 !== shownKey) {
        shownKey = key2;
        slot.innerHTML =
          '<div class="panel lv-off">' +
            '<span class="lv-offdot"></span>' +
            '<h2 class="h3">I\'m not live right now</h2>' +
            '<p class="lead">' + (next
              ? 'Next stream ' + esc(VQ.dayWord(next.start)) + ' at ' + esc(VQ.fTime.format(new Date(next.start))) + ' (in ' + VQ.inTime(next.start - Date.now()) + '). This page switches to the stream on its own when I go live.'
              : 'This page switches to the stream on its own when I go live.') + '</p>' +
            '<div class="btn-row"><a class="btn primary" href="' + esc(yt) + '" target="_blank" rel="noopener noreferrer"><svg class="ico"><use href="#i-yt"/></svg> Subscribe on YouTube</a>' +
            '<a class="btn" href="/pages/schedule/">See the schedule</a></div>' +
          '</div>';
        VQ.fit();
      }
      head.textContent = 'Live stream.';
    }
    if (wasLive !== st.live) { wasLive = st.live; document.title = (st.live ? '🔴 Live now' : 'Live') + ' — voqcl'; }
  }

  VQ.on(render);
  setInterval(function () { if (VQ.state) render(VQ.state); }, 30000);   // keeps "live for 1h 20m" ticking
})();
