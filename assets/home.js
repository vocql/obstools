/* VOQCL — home page: card tilt, live card, announcement */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc, store = VQ.store, body = document.body;

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

  // ---------- live card (only while live) ----------
  var lc = $('lcard'), wasLive = null, lastThumb = null;
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

  // ---------- announcement ----------
  var A = C.announcement, ann = $('ann'), scrim = $('annscrim'), annKey = A ? 'voqcl-ann:' + A.id : '', annTimer = 0;
  if (!A) { ann.remove(); scrim.remove(); return; }
  $('anntitle').textContent = A.title;
  $('annshort').textContent = A.short;
  $('anndetail').innerHTML =
    (A.date ? '<span class="ann-date">' + esc(A.date) + '</span>' : '') +
    (A.details || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
    (A.list && A.list.length ? '<ul>' + A.list.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
    (A.link ? '<a class="btn primary" href="' + esc(A.link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(A.link.label) + ' <svg class="ico" style="fill:none"><use href="#i-arrow"/></svg></a>' : '');
  function show() {
    if (store.get(annKey)) return;
    clearTimeout(annTimer);
    (function wait() {
      if (!body.classList.contains('ready')) { annTimer = setTimeout(wait, 150); return; }
      annTimer = setTimeout(function () { ann.classList.add('show'); ann.tabIndex = 0; }, 900);
    })();
  }
  function collapse() { ann.classList.remove('open'); scrim.classList.remove('on'); ann.setAttribute('aria-expanded', 'false'); }
  ann.addEventListener('click', function () { if (ann.classList.contains('open')) return; ann.classList.add('open'); scrim.classList.add('on'); ann.setAttribute('aria-expanded', 'true'); });
  ann.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === ann) { e.preventDefault(); ann.click(); } });
  $('annx').addEventListener('click', function (e) { e.stopPropagation(); store.set(annKey, '1'); collapse(); ann.classList.remove('show'); ann.tabIndex = -1; });
  scrim.addEventListener('click', collapse);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') collapse(); });
  VQ.showAnn = show;
  show();
})();
