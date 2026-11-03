/* /contact/ request form. Loaded only on /contact/ (page.scripts).
   Without JavaScript the form still works: it posts natively, to the Google Form
   when one is configured in src/site.mjs, otherwise as a plain mailto.
   With JavaScript: accessible validation (error summary + inline messages), then
   - data-mode="gform":  POST to the Google Form (no-cors). Google never says whether
     it accepted the answer, so the success text says what we know and gives the
     phone/email fallback. Extra answers are folded into the "Description" entry.
   - data-mode="mailto": compose a structured email and open the visitor's email app,
     then show the address and a copy button in case nothing opened. */
(function () {
  'use strict';

  var doc = document;
  var form = doc.getElementById('request-form');
  if (!form) return;

  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  var mode = form.getAttribute('data-mode');
  var summary = $('#form-errors');
  var summaryList = $('ul', summary);
  var summaryTitle = $('#form-errors-t');
  var status = $('#form-status');
  var submit = $('[type="submit"]', form);
  var submitText = $('span', submit);

  var el = {
    name: $('#f-name'),
    email: $('#f-email'),
    phone: $('#f-phone'),
    city: $('#f-city'),
    details: $('#f-details'),
  };
  var groups = { services: $('#f-services'), forWhom: $('#f-for'), when: $('#f-when'), contact: $('#f-contact') };

  var LABELS = { name: 'Your name', email: 'Email', phone: 'Phone', details: 'What do you need?' };
  // Older Chrome/Edge on Windows dropped mailto URLs over 2,048 characters, and some email apps cut long bodies short.
  var MAILTO_SAFE = 2000;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ?service=<slug> (e.g. from a service page) pre-ticks that service.
  try {
    var pre = new URLSearchParams(location.search).get('service');
    if (pre) $$('input[data-slug]', groups.services).forEach(function (i) { if (i.getAttribute('data-slug') === pre) i.checked = true; });
  } catch (e) { /* old browser: no prefill */ }

  /* ---------- validation ---------- */
  var val = function (input) { return input ? input.value.trim() : ''; };

  function messageFor(key) {
    var v = val(el[key]);
    if (key === 'name' && !v) return 'Enter your name.';
    if (key === 'email') {
      if (!v) return 'Enter your email address so we can reply.';
      if (!EMAIL_RE.test(v)) return 'Enter an email address like name@example.com.';
    }
    if (key === 'phone' && v) {
      var digits = v.replace(/\D/g, '').length;
      if (digits < 10 || digits > 15 || /[^\d\s()+.\-]/.test(v)) return 'Enter a phone number with the area code, like (972) 555-0123, or leave it blank.';
    }
    if (key === 'details' && !v) return 'Tell us a little about the job.';
    return '';
  }

  function setError(key, msg) {
    var input = el[key];
    var err = $('#' + input.id + '-err');
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    if (err) { err.textContent = msg; err.hidden = !msg; }
  }

  function renderSummary(errors) {
    summaryList.textContent = '';
    errors.forEach(function (e) {
      var li = doc.createElement('li');
      var a = doc.createElement('a');
      a.href = '#' + el[e.key].id;
      a.setAttribute('data-key', e.key);
      var label = LABELS[e.key];
      a.textContent = label + (/[?.!]$/.test(label) ? ' ' : ': ') + e.msg;
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    summaryTitle.textContent = errors.length === 1 ? 'Fix 1 thing before sending' : 'Fix ' + errors.length + ' things before sending';
    summary.hidden = errors.length === 0;
  }

  function currentErrors() {
    return ['name', 'email', 'phone', 'details']
      .map(function (key) { return { key: key, msg: messageFor(key) }; })
      .filter(function (e) { return e.msg; });
  }

  // Summary links: move focus to the field (a plain #fragment only scrolls).
  summary.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-key]');
    if (!a) return;
    e.preventDefault();
    var input = el[a.getAttribute('data-key')];
    var field = input.closest('.field') || input;
    field.scrollIntoView({ block: 'start' });
    input.focus({ preventScroll: true });
  });

  Object.keys(LABELS).forEach(function (key) {
    var input = el[key];
    input.addEventListener('blur', function () { if (val(input) || input.getAttribute('aria-invalid') === 'true') setError(key, messageFor(key)); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') !== 'true') return;
      setError(key, messageFor(key));
      // Keep the summary in step while the visitor fixes things.
      if (!summary.hidden) {
        var left = currentErrors().filter(function (e) { return el[e.key].getAttribute('aria-invalid') === 'true'; });
        if (left.length) renderSummary(left); else summary.hidden = true;
      }
    });
  });

  /* ---------- composing the request ---------- */
  var checked = function (fs) { return fs ? $$('input:checked', fs).map(function (i) { return i.value; }) : []; };

  function extraLines() {
    var lines = [];
    var add = function (label, value) { if (value) lines.push(label + ': ' + value); };
    add('Services', checked(groups.services).join(', '));
    add('For', checked(groups.forWhom).join(', '));
    add('City or ZIP', val(el.city));
    add('Timeline', checked(groups.when).join(', '));
    add('Best way to reach me', checked(groups.contact).join(', '));
    return lines;
  }

  function emailText() {
    var lines = ['Name: ' + val(el.name), 'Email: ' + val(el.email)];
    if (val(el.phone)) lines.push('Phone: ' + val(el.phone));
    lines = lines.concat(extraLines());
    lines.push('', 'What I need:', val(el.details).replace(/\r?\n/g, '\r\n'), '', '—', 'Sent from the request form at ' + location.origin + '/contact/');
    return lines.join('\r\n');
  }

  function emailSubject() {
    var services = checked(groups.services);
    return 'Consultation request — ' + (services.length ? services.join(', ') : val(el.name));
  }

  /* ---------- status messages ---------- */
  function showStatus(tplId, variant, beforeShow) {
    var tpl = $('#' + tplId);
    status.className = 'callout form-status' + (variant ? ' ' + variant : '');
    status.innerHTML = tpl ? tpl.innerHTML : '';
    if (beforeShow) beforeShow();
    status.hidden = false;
    status.focus();
  }

  function copyText(text, msgEl, fallbackArea) {
    var done = function () { if (msgEl) msgEl.textContent = 'Copied.'; };
    var manual = function () {
      if (fallbackArea) {
        var d = fallbackArea.closest('details');
        if (d) d.open = true;
        fallbackArea.focus();
        fallbackArea.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        if (msgEl) msgEl.textContent = ok ? 'Copied.' : 'Select the text and copy it.';
      } else if (msgEl) {
        msgEl.textContent = 'Couldn’t copy. Select the address and copy it.';
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, manual);
    else manual();
  }

  function openEmail() {
    var to = form.getAttribute('data-mailto');
    var text = emailText();
    var href = 'mailto:' + to + '?subject=' + encodeURIComponent(emailSubject()) + '&body=' + encodeURIComponent(text);

    showStatus('tpl-mail', 'form-status--mail', function () {
      if (href.length <= MAILTO_SAFE) return;
      var note = $('.mail-long', status), preview = $('details', status);
      if (note) note.hidden = false;
      if (preview) preview.open = true;
    });
    var area = $('textarea', status);
    var msg = $('.copy-msg', status);
    if (area) area.value = 'To: ' + to + '\nSubject: ' + emailSubject() + '\n\n' + text.replace(/\r\n/g, '\n');
    $$('[data-copy]', status).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-copy') === 'address') copyText(to, msg, null);
        else copyText(area ? area.value : text, msg, area);
      });
    });

    // Opening an external handler doesn't unload the page; if no email app is set
    // up, nothing happens and the status above tells the visitor what to do.
    window.location.href = href;
  }

  function sendGoogleForm() {
    var body = new URLSearchParams();
    var details = val(el.details);
    var lines = extraLines();
    body.append(form.getAttribute('data-entry-name'), val(el.name));
    body.append(form.getAttribute('data-entry-email'), val(el.email));
    body.append(form.getAttribute('data-entry-phone'), val(el.phone));
    body.append(form.getAttribute('data-entry-description'), (lines.length ? lines.join('\n') + '\n\n' : '') + details);
    body.append('fvv', '1');
    body.append('pageHistory', '0');

    var label = submitText.textContent;
    submit.disabled = true;
    submitText.textContent = 'Sending…';
    status.hidden = true;

    fetch(form.getAttribute('data-gform'), { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        form.reset();
        form.hidden = true;
        showStatus('tpl-sent', 'form-status--ok');
      })
      .catch(function () {
        showStatus('tpl-fail', 'callout--warn');
      })
      .then(function () {
        submit.disabled = false;
        submitText.textContent = label;
      });
  }

  /* ---------- submit ---------- */
  form.setAttribute('novalidate', '');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = currentErrors();
    ['name', 'email', 'phone', 'details'].forEach(function (key) {
      var hit = errors.filter(function (x) { return x.key === key; })[0];
      setError(key, hit ? hit.msg : '');
    });
    if (errors.length) {
      status.hidden = true;
      renderSummary(errors);
      summary.focus();
      return;
    }
    summary.hidden = true;
    if (mode === 'gform') sendGoogleForm();
    else openEmail();
  });
})();
