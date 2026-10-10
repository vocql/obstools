/* VOQCL — contact page: your contact info, or the selected creator's links */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$, esc = VQ.esc;
  var slot = $('contact-form-slot'), grid = $('contact-grid');
  var ids = ['contacthead', 'contactlead', 'contactsub', 'contactstack'], original = {};
  ids.forEach(function (id) { original[id] = $(id).innerHTML; });
  var TYPES = { youtube: ['YouTube', 'yt'], twitch: ['Twitch', 'tw'], tiktok: ['TikTok', 'tt'], instagram: ['Instagram', 'ig'], x: ['X', 'x'], twitter: ['X', 'x'], email: ['Email', 'mail'], discord: ['Discord', 'dc'] };
  var ARROW = '<svg class="ico" style="fill:none;width:15px;height:15px"><use href="#i-arrow"/></svg>';

  function showForm(email, name) {
    if (!email) { slot.hidden = true; grid.classList.add('solo'); return; }
    slot.hidden = false; grid.classList.remove('solo');
    slot.innerHTML =
      '<h2 class="h3" style="margin-bottom:16px">Send ' + (name ? esc(name) + ' ' : '') + 'an email</h2>' +
      '<form class="form" id="cform">' +
        '<label class="field">Your name<input name="name" required autocomplete="name" maxlength="80"></label>' +
        '<label class="field">Message<textarea name="msg" required maxlength="2000"></textarea></label>' +
        '<button class="btn primary" type="submit" style="justify-content:center">Open in my email app</button>' +
      '</form>';
    $('cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      window.location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Hello from ' + f.name.value.trim()) + '&body=' + encodeURIComponent(f.msg.value.trim());
    });
  }
  function handleOf(u) { if (/discord\.(gg|com)/.test(u)) return u.replace(/^https?:\/\/(www\.)?/, ''); var m = String(u).match(/@[\w.-]+/) || String(u).match(/(?:\.com|\.tv)\/([\w.-]+)\/?$/); return m ? (m[1] ? '@' + m[1] : m[0]) : u.replace(/^https?:\/\/(www\.)?/, ''); }

  VQ.onCreator(function (c) {
    if (c.owner) {                                   // your own Contact page, exactly as written in the HTML
      ids.forEach(function (id) { $(id).innerHTML = original[id]; });
      showForm(C.contactEmail, '');
    } else {
      $('contacthead').textContent = 'Reach ' + c.name + '.';
      $('contactlead').textContent = c.email ? 'Message ' + c.name + ' on their socials, or send an email.' : 'The best way to reach ' + c.name + ' is on their socials.';
      $('contactsub').textContent = c.name + '\u2019s links';
      var rows = c.socials.slice();
      if (c.email) rows.unshift({ type: 'email', url: c.email });
      $('contactstack').innerHTML = rows.map(function (s) {
        var t = TYPES[String(s.type || '').toLowerCase()] || [s.label || 'Website', 'link'];
        var isMail = s.type === 'email', href = isMail && !/^mailto:/.test(s.url) ? 'mailto:' + s.url : s.url;
        return '<a class="row" href="' + esc(href) + '"' + (isMail ? '' : ' target="_blank" rel="noopener noreferrer"') + '>' +
          '<span class="badge"><svg class="ico"><use href="#i-' + t[1] + '"/></svg></span>' +
          '<span class="grow">' + esc(s.label || t[0]) + '<br><small>' + esc(isMail ? s.url.replace(/^mailto:/, '') : handleOf(s.url)) + '</small></span>' + ARROW + '</a>';
      }).join('');
      showForm(c.email, c.name);
    }
    VQ.fit();
  });
})();
