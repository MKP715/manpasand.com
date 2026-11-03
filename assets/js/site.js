/* Manpasand Technical Services — progressive enhancements. Vanilla, no dependencies,
   no analytics, no cookies. Every page and every link works with JavaScript off
   (the footer carries the full navigation). Theme is applied before paint by the
   inline script in <head>; this file wires the Auto/Light/Dark switch. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };

  /* ---------- Legacy one-page anchors → real pages ---------- */
  var LEGACY = {
    about: '/about/', services: '/services/', industries: '/services/#industries', 'why-us': '/about/#why-us',
    guarantees: '/about/#commitments', portfolio: '/work/', testimonials: '/reviews/', faq: '/faq/',
    'service-area': '/service-areas/', contact: '/contact/', legal: '/privacy/'
  };
  if ((location.pathname === '/' || location.pathname === '/index.html') && location.hash) {
    var key = location.hash.slice(1);
    try { key = decodeURIComponent(key); } catch (e) { /* malformed %-escape: not a legacy id */ }
    if (Object.prototype.hasOwnProperty.call(LEGACY, key)) { location.replace(LEGACY[key]); return; }
  }

  var params = new URLSearchParams(location.search);

  /* ---------- Header shadow after scrolling ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Theme switch (Auto / Light / Dark) ---------- */
  var KEY = 'theme';
  var metas = $$('meta[name="theme-color"]');
  metas.forEach(function (m) { m.setAttribute('data-auto', m.getAttribute('content')); });
  var COLORS = { light: '#F5F2EA', dark: '#0E131A' };
  function applyTheme(v) {
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v);
    else root.removeAttribute('data-theme');
    metas.forEach(function (m) { m.setAttribute('content', v === 'light' || v === 'dark' ? COLORS[v] : m.getAttribute('data-auto')); });
    $$('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-set') === (v || 'auto'))); });
  }
  applyTheme(root.getAttribute('data-theme'));
  $$('[data-theme-set]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-theme-set');
      try { if (v === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: theme still applies for this page */ }
      applyTheme(v === 'auto' ? null : v);
    });
  });

  /* ---------- Services disclosure (desktop) ---------- */
  var ddBtn = $('.nav-dd');
  var ddPanel = ddBtn && doc.getElementById(ddBtn.getAttribute('aria-controls'));
  var ddItem = ddBtn && ddBtn.parentElement;
  function setDD(open) {
    if (!ddBtn || !ddPanel) return;
    ddBtn.setAttribute('aria-expanded', String(open));
    ddPanel.hidden = !open;
  }
  if (ddBtn && ddPanel) {
    ddBtn.addEventListener('click', function () { setDD(ddBtn.getAttribute('aria-expanded') !== 'true'); });
    ddItem.addEventListener('focusout', function (e) { if (e.relatedTarget && !ddItem.contains(e.relatedTarget)) setDD(false); });
    doc.addEventListener('click', function (e) { if (!ddItem.contains(e.target)) setDD(false); });
    if (params.get('svc') === 'open') setDD(true); // screenshot/debug state
  }

  /* ---------- Mobile drawer ---------- */
  var menuBtn = $('.menu-btn');
  var drawer = $('#drawer');
  var closeTimer = null;
  function setInert(on) {
    $$('main, .site-footer, .actionbar').forEach(function (el) {
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function setMenu(open, opts) {
    if (!menuBtn || !drawer) return;
    var isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    if (open === isOpen) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    doc.body.classList.toggle('drawer-open', open);
    setInert(open);
    clearTimeout(closeTimer);
    if (open) {
      setDD(false);
      drawer.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add('is-open'); }); });
      var first = $('a, button', drawer);
      if (first && !(opts && opts.noFocus)) first.focus({ preventScroll: true });
    } else {
      drawer.classList.remove('is-open');
      closeTimer = setTimeout(function () { drawer.hidden = true; }, mq('(prefers-reduced-motion: reduce)') ? 0 : 200);
      if (!(opts && opts.noFocus)) menuBtn.focus();
    }
  }
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false, { noFocus: true }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1120) setMenu(false, { noFocus: true }); });
    // The skip link sits outside the inert set, so it stays reachable while the drawer is open.
    // Close the drawer first (listeners run before the link's default action) so #main is no longer inert when the browser focuses it.
    var skip = $('.skip');
    if (skip) skip.addEventListener('click', function () { setMenu(false, { noFocus: true }); });
    // Nested "Services" disclosure inside the drawer.
    $$('[aria-controls="drawer-svc"]', drawer).forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        doc.getElementById('drawer-svc').hidden = !open;
      });
    });
    if (params.get('menu') === 'open') {
      setMenu(true, { noFocus: true }); // screenshot/debug state
      if (params.get('svc') === 'open') { var sb = $('[aria-controls="drawer-svc"]', drawer); if (sb) sb.click(); }
    }
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); return; }
    if (ddBtn && ddBtn.getAttribute('aria-expanded') === 'true') { setDD(false); ddBtn.focus(); }
  });

  /* ---------- Mobile action bar: hide over the footer / contact form ---------- */
  var bar = $('.actionbar');
  var hideFor = $$('.site-footer, [data-hide-actionbar]');
  if (bar && hideFor.length && 'IntersectionObserver' in window) {
    var visible = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = visible.indexOf(en.target);
        if (en.isIntersecting && i < 0) visible.push(en.target);
        if (!en.isIntersecting && i >= 0) visible.splice(i, 1);
      });
      bar.classList.toggle('is-hidden', visible.length > 0);
    });
    hideFor.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Guide TOC: collapse on small screens, highlight current section ---------- */
  var tocD = $('.toc-d');
  if (tocD) {
    // Normally already closed before paint by the inline script in toc(); kept as a fallback.
    if (mq('(max-width: 960px)')) tocD.open = false;
    // "Back to contents" links (guides): reopen the collapsed list so the reader lands on it.
    $$('a[href="#contents"]').forEach(function (a) { a.addEventListener('click', function () { tocD.open = true; }); });
    var links = $$('.toc a[href^="#"]');
    var targets = links.map(function (a) { return doc.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        var t = targets[i];
        if (!t || mq('(prefers-reduced-motion: reduce)')) return;
        e.preventDefault();
        // Collapse first: the TOC sits above the article at 960px and below, so closing it after
        // the scroll starts would shift the target up by the list height.
        if (mq('(max-width: 960px)')) tocD.open = false;
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', a.getAttribute('href'));
        // Native fragment navigation moves focus (and the next Tab) to the target; do the same.
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      });
    });
    /* Current section = the last heading whose top has passed a reading line 25% down the
       viewport, never above where a TOC jump or deep link parks a heading (scroll-padding-top).
       Position-based, so End/Home, TOC clicks (incl. reduced motion), deep links and reloads
       land on the right entry. rAF-throttled, passive listeners. */
    var current = -1, ticking = false, line = 0;
    var measure = function () {
      var pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      line = Math.max(window.innerHeight * 0.25, pad + 16);
    };
    var spy = function () {
      ticking = false;
      var idx = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= line) idx = i;
      }
      if (idx === current) return;
      current = idx;
      links.forEach(function (a, i) { if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    var queue = function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } };
    measure();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', function () { measure(); queue(); }, { passive: true });
    window.addEventListener('load', queue);
    spy();
  }
})();
