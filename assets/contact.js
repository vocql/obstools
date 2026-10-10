/* VOQCL — contact page: email form (opens the visitor's email app) */
(function () {
  var VQ = window.VQ, C = VQ.C, $ = VQ.$;
  var slot = $('contact-form-slot'), grid = $('contact-grid');
  if (!C.contactEmail) { slot.remove(); grid.classList.add('solo'); return; }
  slot.innerHTML =
    '<h2 class="h3" style="margin-bottom:16px">Send an email</h2>' +
    '<form class="form" id="cform">' +
      '<label class="field">Your name<input name="name" required autocomplete="name" maxlength="80"></label>' +
      '<label class="field">Message<textarea name="msg" required maxlength="2000"></textarea></label>' +
      '<button class="btn primary" type="submit" style="justify-content:center">Open in my email app</button>' +
    '</form>';
  $('cform').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    window.location.href = 'mailto:' + C.contactEmail + '?subject=' + encodeURIComponent('Hello from ' + f.name.value.trim()) + '&body=' + encodeURIComponent(f.msg.value.trim());
  });
  VQ.fit();
})();
