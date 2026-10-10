/* VOQCL — home page: card tilt, creator links, live card */
(function () {
  var VQ = window.VQ, $ = VQ.$, esc = VQ.esc, lastThumb = null;

  // ---------- card spotlight + subtle 3D tilt (desktop only) ----------
  var card = $('card'), inner = $('inner');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, px = 0, py = 0;
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
  document.querySelector('.links').addEventListener('pointermove', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var r = a.getBoundingClientRect();
    a.style.setProperty('--lx', (e.clientX - r.left) + 'px');
    a.style.setProperty('--ly', (e.clientY - r.top) + 'px');
  });

  // ---------- the creator's links on the card (from config.js → creators → socials) ----------
  var TYPES = {
    youtube: ['YouTube', 'yt'], twitch: ['Twitch', 'tw'], tiktok: ['TikTok', 'tt'], instagram: ['Instagram', 'ig'],
    x: ['X', 'x'], twitter: ['X', 'x'], email: ['Email', 'mail']
  };
  var ARROW = '<svg class="arrow stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  VQ.onCreator(function (c) {
    $('clinks').innerHTML = c.socials.map(function (s, i) {
      var t = TYPES[String(s.type || '').toLowerCase()] || [s.label || 'Website', 'link'];
      var href = s.type === 'email' && !/^mailto:/.test(s.url) ? 'mailto:' + s.url : s.url;
      var ext = s.type === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"';
      return '<li style="--i:' + i + '"><a href="' + esc(href) + '"' + ext + '><span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + t[1] + '"/></svg></span>' +
        '<span class="name">' + esc(s.label || t[0]) + '</span>' + ARROW + '</a></li>';
    }).join('');
    lastThumb = null;
    VQ.fit();
  });

  // ---------- live card (only while live) ----------
  var lc = $('lcard'), wasLive = null;
  VQ.on(function (st) {
    var L = st.info;
    if (st.live) {
      lc.href = L.url;
      $('lctitle').textContent = L.title;
      $('lcmeta').innerHTML = '<svg><use href="#i-' + (/twitch/i.test(L.platform) ? 'tw' : 'yt') + '"/></svg>' + esc(L.platform) +
        (L.viewers != null ? ' &middot; <svg><use href="#i-eye"/></svg>' + VQ.viewers(L.viewers) + ' watching' : '');
      if (lastThumb !== L.thumbnail) {
        lastThumb = L.thumbnail;
        $('lcthumb').innerHTML = (L.thumbnail ? '<img src="' + esc(L.thumbnail) + '" alt="">' : VQ.ART) + '<span class="lc-tag">LIVE</span>';
        var im = $('lcthumb').querySelector('img');
        if (im) im.addEventListener('error', function () { im.outerHTML = VQ.ART; });
      }
      if (wasLive !== true) { lc.hidden = false; lc.classList.remove('pop'); void lc.offsetWidth; lc.classList.add('pop'); }
    } else { lc.hidden = true; lastThumb = null; }
    if (wasLive !== st.live) { wasLive = st.live; VQ.fit(); }
  });

})();
