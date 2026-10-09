/* VOQCL — videos page: past streams from videos.json (filled by the GitHub Action) + in-page player */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc, viewers = VQ.viewers;
  C.vods = C.vods || [];
  C.youtube = C.youtube || 'https://www.youtube.com';

  // ---------- videos: past streams from videos.json (filled by the GitHub Action) ----------
  var SHADES = ['linear-gradient(135deg,#2a2a2a,#0d0d0d)', 'linear-gradient(200deg,#303030,#111)', 'linear-gradient(160deg,#1a1a1a,#333)', 'linear-gradient(120deg,#383838,#121212)'];
  var autoVids = null, vPage = 0, vKey = '';
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }) : null;
  var fShort = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  function ago(iso) {
    var t = Date.parse(iso); if (!t) return '';
    var days = Math.round((Date.now() - t) / 86400000);
    if (!rtf || days > 27) return fShort.format(new Date(t));
    if (days < 7) return rtf.format(-days, 'day');
    return rtf.format(-Math.round(days / 7), 'week');
  }
  var st = null;
  function vidList() {
    var list = (autoVids && autoVids.length) ? autoVids : C.vods.map(function (v) {
      var id = (String(v.url).match(/[?&]v=([\w-]{11})|youtu\.be\/([\w-]{11})/) || []);
      return { id: id[1] || id[2] || null, title: v.title, duration: v.duration, dateText: v.date, url: v.url, thumb: v.thumb };
    });
    if (st && st.live) {
      list = [{ live: true, id: st.info.videoId, title: st.info.title || 'Live now', url: st.info.url, thumb: st.info.thumbnail }]
        .concat(list.filter(function (v) { return !v.id || v.id !== st.info.videoId; }));
    }
    return list;
  }
  function pages(list) {
    var narrow = window.innerWidth <= 900, first = narrow ? 3 : 5, rest = narrow ? 4 : 6, out = [list.slice(0, first)];
    for (var i = first; i < list.length; i += rest) out.push(list.slice(i, i + rest));
    return out;
  }
  function vcard(v, i, featured) {
    var thumb = v.thumb || (v.id ? 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg' : '');
    var meta = v.live ? (st.info.viewers != null ? viewers(st.info.viewers) + ' watching now' : 'Streaming now')
      : (v.date ? 'Streamed ' + ago(v.date) : (v.dateText || ''));
    var tag = v.live ? '<span class="vtag red">Live</span>' : (featured ? '<span class="vtag">Latest</span>' : '');
    return '<a class="pcard vcard' + (featured ? ' featured' : '') + (v.live ? ' is-live' : '') + '" href="' + esc(v.url || (v.id ? 'https://www.youtube.com/watch?v=' + v.id : C.youtube)) + '"' +
      ' target="_blank" rel="noopener noreferrer" data-i="' + i + '">' +
      '<div class="vthumb" style="--g:' + SHADES[i % SHADES.length] + '">' + (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy">' : '') +
        tag + (v.duration && !v.live ? '<span class="dur">' + esc(v.duration) + '</span>' : '') +
        '<span class="play"><span><svg class="ico"><use href="#i-play"/></svg></span></span></div>' +
      '<h3>' + esc(v.title) + '</h3><small>' + esc(meta) + '</small></a>';
  }
  var shown = [];
  function renderVideos(animate) {
    var list = vidList(), pg = pages(list), grid = $('vgrid');
    vPage = Math.min(vPage, pg.length - 1);
    shown = pg[vPage] || [];
    var html = shown.length
      ? shown.map(function (v, i) { return vcard(v, i, vPage === 0 && i === 0); }).join('')
      : '<div class="panel vempty"><h2 class="h3">No streams yet</h2><p class="lead" style="margin-left:auto;margin-right:auto">Past streams show up here automatically once they\'re on YouTube.</p></div>';
    if (html !== vKey) {
      vKey = html; grid.innerHTML = html;
      if (animate) { grid.classList.remove('flip'); void grid.offsetWidth; grid.classList.add('flip'); }
    }
    $('vpager').hidden = pg.length < 2;
    $('vpage').textContent = (vPage + 1) + ' / ' + pg.length;
    $('vprev').disabled = vPage === 0;
    $('vnext').disabled = vPage >= pg.length - 1;
    VQ.fit();
  }
  $('vprev').addEventListener('click', function () { if (vPage > 0) { vPage--; renderVideos(true); } });
  $('vnext').addEventListener('click', function () { vPage++; renderVideos(true); });
  $('vgrid').addEventListener('error', function (e) { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
  var lastNarrow = window.innerWidth <= 900;
  window.addEventListener('resize', function () { var n = window.innerWidth <= 900; if (n !== lastNarrow) { lastNarrow = n; vPage = 0; renderVideos(); } });
  $('allvids').href = C.youtube.replace(/\/+$/, '') + '/streams';
  function loadVideos() {
    if (!C.videosFile || !window.fetch) return renderVideos();
    fetch(VQ.url(C.videosFile) + '?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { autoVids = j && j.videos; renderVideos(); })
      .catch(function () { renderVideos(); });
  }

  // ---------- video player popup ----------
  var player = $('player'), lastFocus = null;
  function openPlayer(v) {
    lastFocus = document.activeElement;
    $('plframe').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1&rel=0&modestbranding=1" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    $('pltitle').textContent = v.title;
    $('plmeta').textContent = v.live ? 'Live now' : [v.duration, v.date ? 'Streamed ' + ago(v.date) : v.dateText].filter(Boolean).join(' · ');
    $('plyt').href = 'https://www.youtube.com/watch?v=' + v.id;
    player.hidden = false; void player.offsetWidth; player.classList.add('on');
    $('plclose').focus();
  }
  function closePlayer() {
    if (player.hidden) return;
    player.classList.remove('on');
    setTimeout(function () { player.hidden = true; $('plframe').innerHTML = ''; }, 350);   // removing the iframe stops the video
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('vgrid').addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.vcard');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // ctrl/cmd-click still opens YouTube in a new tab
    var v = shown[+a.getAttribute('data-i')];
    if (!v || !v.id) return;                                                    // no video id: just open the link
    e.preventDefault(); openPlayer(v);
  });
  $('plclose').addEventListener('click', closePlayer);
  player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePlayer(); });

  var liveSeen = null, lastViewers;
  VQ.on(function (s) {
    st = s;
    if (liveSeen !== s.live || lastViewers !== s.info.viewers) { liveSeen = s.live; lastViewers = s.info.viewers; renderVideos(); }
  });
  loadVideos();
  setInterval(loadVideos, 10 * 60000);
})();
