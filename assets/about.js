/* VOQCL — about page: your bio, or a page about the creator that's selected */
(function () {
  var VQ = window.VQ, $ = VQ.$, esc = VQ.esc;
  var ids = ['aboutname', 'aboutlead', 'aboutbtns', 'aboutfacts'], original = {};
  ids.forEach(function (id) { original[id] = $(id).innerHTML; });
  var extra = [].slice.call(document.querySelectorAll('.owner-only'));

  VQ.onCreator(function (c) {
    if (c.owner) {                                  // your own About, exactly as written in the HTML
      ids.forEach(function (id) { $(id).innerHTML = original[id]; });
      extra.forEach(function (el) { el.hidden = false; });
    } else {
      $('aboutname').textContent = 'This is ' + c.name + '.';
      $('aboutlead').innerHTML = c.about ? esc(c.about)
        : esc(c.name) + ' streams on YouTube' + (c.handle ? ' as <b style="color:#fff;font-weight:600">@' + esc(c.handle) + '</b>' : '') +
          '. Watch the live stream right here, check when they\'re on next, and find all their links.';
      $('aboutbtns').innerHTML =
        '<a class="btn primary" href="/pages/videos/">Watch ' + esc(c.name) + ' <svg class="ico" style="fill:none"><use href="#i-arrow"/></svg></a>' +
        '<a class="btn" href="' + (c.email ? '/pages/contact/' : '/') + '">' + (c.email ? 'Contact' : 'Their links') + '</a>';
      $('aboutfacts').innerHTML =
        '<div class="fact"><b>' + (c.handle ? '@' + esc(c.handle) : esc(c.name)) + '</b><small>On YouTube</small></div>' +
        '<div class="fact"><b>' + c.socials.length + '</b><small>' + (c.socials.length === 1 ? 'Platform' : 'Platforms') + '</small></div>' +
        '<div class="fact"><b>' + (c.schedule.length ? c.schedule.length + ' days' : 'Any time') + '</b><small>' + (c.schedule.length ? 'A week on stream' : 'No set schedule') + '</small></div>';
      extra.forEach(function (el) { el.hidden = true; });
    }
    VQ.fit();
  });
})();
