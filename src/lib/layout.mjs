// Document shell: <head> comes from ./head.mjs (foundation); this file renders the
// body chrome around each page's `body` (design-final.md §6.1, §6.19, §6.20):
// skip link · sticky header (logo, Services disclosure, nav, phone, CTA, mobile Call +
// Menu buttons) · full-height mobile drawer · <main id="main"> · footer · mobile action bar.
//
// ─── Page object contract ──────────────────────────────────────────────────────
// Every module in src/pages/*.mjs default-exports a function (sync or async)
// returning one page object or an array of them:
//
// {
//   path:        '/services/web-development/'  // site path; trailing slash, or '/404.html'
//   title:       '… | Manpasand'               // <title>, og/twitter title (warn > 60 chars)
//   description: '…'                           // meta description (warn outside 110–160 chars)
//   h1?:         '…'                           // used for default og:image:alt; the body renders the real <h1>
//   crumbs?:     [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services/' }, …]
//                                              // ≥2 items → BreadcrumbList schema. Render them visibly by
//                                              // passing the SAME array to pageHero({ crumbs }); if the body
//                                              // has no Breadcrumb nav, the layout inserts one above it.
//   pageType?:   'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'ItemPage'
//                                              // schema.org type of the page's WebPage node (default 'WebPage')
//   about?:      {…}                           // WebPage.about (default → the business @id)
//   mainEntity?: {…}                           // WebPage.mainEntity (e.g. itemListNode(), contact point)
//   updated?:    'YYYY-MM-DD'                  // WebPage.dateModified
//   image?:      '/assets/img/og-….jpg'        // 1200×630 share image (default: section card via ogImageFor)
//   imageAlt?:   '…'
//   ogType?:     'website' | 'article'         // default 'website'
//   ogTitle?:    '…'                           // default = title
//   schema?:     [node, …]                     // extra JSON-LD nodes (serviceNode, faqNode, articleNode …)
//   scripts?:    ['/assets/js/x.js']           // extra deferred scripts (local ones get ?v=hash)
//   preload?:    [{ href, as?: 'image', imagesrcset?, imagesizes?, media?, type? }]
//   noindex?:    true                          // robots noindex + left out of sitemap
//   canonical?:  false                         // no canonical / og:url / WebPage node (404 page)
//   bodyClass?:  'page-contact'                // extra class on <body> (scope page CSS with it)
//   body:        html`…`                       // main content; MUST contain exactly one <h1>
// }
// ───────────────────────────────────────────────────────────────────────────────

import { html, raw, toString } from './html.mjs';
import { head } from './head.mjs';
import { icon, logoMark } from './icons.mjs';
import { breadcrumbs } from './components.mjs';
import { SITE, NAV, SERVICES, AREAS, FOOTER_COMPANY, servicesByGroup, telHref, mailHref, locationLine } from '../site.mjs';

const current = (href, path) => (href === path ? raw(' aria-current="page"') : '');
const inSection = (href, path) => href !== '/' && path.startsWith(href);

function brand() {
  return html`<a class="brand" href="/" aria-label="${SITE.name} — home">
  ${logoMark()}
  <span class="brand-name"><strong>${SITE.shortName}</strong> <small>Technical Services</small></span>
</a>`;
}

function servicesPanel(path) {
  const groups = servicesByGroup();
  return html`<div class="dd-panel" id="svc-menu" hidden>
  ${groups.map(
    (g, i) => html`<div class="dd-col">
    <p class="label">${g.label}</p>
    <ul>${g.services.map((s) => html`<li><a href="/services/${s.slug}/"${current(`/services/${s.slug}/`, path)}>${s.name}</a></li>`)}</ul>
    ${i === groups.length - 1 ? html`<a class="more" href="/services/"${current('/services/', path)}><span>All services</span>${icon('arrow', { size: 16 })}</a>` : ''}
  </div>`,
  )}
</div>`;
}

function desktopNav(path) {
  return html`<nav class="nav" aria-label="Main">
  <ul>
    ${NAV.map((item) =>
      item.groups
        ? html`<li class="has-dd"><a class="nav-svc${inSection(item.href, path) && item.href !== path ? ' is-current' : ''}" href="${item.href}"${current(item.href, path)}>${item.label}</a><button class="nav-dd${inSection(item.href, path) ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="svc-menu">${item.label}${icon('chevron', { size: 14 })}</button>
      ${servicesPanel(path)}</li>`
        : html`<li><a href="${item.href}"${current(item.href, path)}${inSection(item.href, path) && item.href !== path ? raw(' class="is-current"') : ''}>${item.label}</a></li>`,
    )}
  </ul>
</nav>`;
}

function drawer(path) {
  const groups = servicesByGroup();
  return html`<nav class="drawer" id="drawer" aria-label="Mobile" hidden>
  <div class="drawer-nav">
    <ul>
      ${NAV.map((item) =>
        item.groups
          ? html`<li class="drawer-svc">
        <button class="drawer-row" type="button" aria-expanded="false" aria-controls="drawer-svc"><span>${item.label}</span><span class="drawer-hint" aria-hidden="true">${item.hint}${icon('chevron', { size: 16 })}</span></button>
        <div class="drawer-sub" id="drawer-svc" hidden>
          ${groups.map((g) => html`<p class="label">${g.label}</p><ul>${g.services.map((s) => html`<li><a href="/services/${s.slug}/"${current(`/services/${s.slug}/`, path)}>${s.name}</a></li>`)}</ul>`)}
          <a class="more" href="/services/"><span>All services</span>${icon('arrow', { size: 16 })}</a>
        </div>
      </li>`
          : html`<li><a class="drawer-row" href="${item.href}"${current(item.href, path)}><span>${item.label}</span>${item.hint ? html`<span class="drawer-hint" aria-hidden="true">${item.hint}</span>` : ''}</a></li>`,
      )}
    </ul>
  </div>
  <a class="btn btn-primary btn-lg btn-block" href="/contact/"><span>Book a free consultation</span>${icon('arrow', { size: 16, cls: 'arr' })}</a>
  <dl class="drawer-contact">
    <div><dt>Phone</dt><dd><a class="tel" href="${telHref}">${SITE.phone}</a></dd></div>
    <div><dt>Email</dt><dd><a href="${mailHref}">${SITE.email}</a></dd></div>
    <div><dt>Hours</dt><dd>${SITE.hours.short}</dd></div>
  </dl>
</nav>`;
}

function header(path) {
  return html`<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap hdr">
    ${brand()}
    ${desktopNav(path)}
    <div class="hdr-cta">
      <a class="hdr-tel tel" href="${telHref}">${icon('phone', { size: 18 })}${SITE.phone}</a>
      <a class="btn btn-primary hdr-btn" href="/contact/"><span>Free consultation</span>${icon('arrow', { size: 16, cls: 'arr' })}</a>
      <a class="icon-btn" href="${telHref}" aria-label="Call ${SITE.phone}">${icon('phone', { size: 20 })}</a>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Open menu">${icon('menu', { size: 20, cls: 'i-menu' })}${icon('close', { size: 20, cls: 'i-close' })}</button>
    </div>
  </div>
</header>
${drawer(path)}`;
}

function footer() {
  const social = Object.entries(SITE.social || {}).filter(([, url]) => url);
  return html`<footer class="site-footer">
  <div class="wrap">
    <div class="masthead">
      <p class="big">${logoMark()}<span>${SITE.shortName}</span></p>
      <p class="tagline">${SITE.slogan}</p>
    </div>
    <div class="fcols">
      <div class="fabout">
        <h2>${SITE.name}</h2>
        <p>Small-business IT, networks, data, websites, conference rooms and photography. ${SITE.meaning} ${locationLine}. Remote database and web work anywhere.</p>
        ${social.length ? html`<ul class="fsocial">${social.map(([k, url]) => html`<li><a href="${url}" rel="noopener me">${k[0].toUpperCase() + k.slice(1)}${icon('arrow-up-right', { size: 14 })}</a></li>`)}</ul>` : ''}
        <p class="label">${SITE.trustLine.join(' · ')}</p>
      </div>
      <nav aria-label="Services">
        <h2>Services</h2>
        <ul>${SERVICES.map((s) => html`<li><a href="/services/${s.slug}/">${s.name}</a></li>`)}<li><a href="/services/">All services</a></li></ul>
      </nav>
      <nav aria-label="Service areas">
        <h2>Service areas</h2>
        <ul>${AREAS.map((a) => html`<li><a href="/service-areas/${a.slug}/">${a.city}</a></li>`)}<li><a href="/service-areas/">All of ${SITE.serviceArea}</a></li></ul>
      </nav>
      <nav aria-label="Company">
        <h2>Company</h2>
        <ul>${FOOTER_COMPANY.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
      </nav>
      <div class="fcontact">
        <h2>Contact</h2>
        <ul>
          <li><span class="k">Phone</span><a class="v tel" href="${telHref}">${SITE.phone}</a></li>
          <li><span class="k">Email</span><a class="v" href="${mailHref}">${SITE.email}</a></li>
          <li><span class="k">Hours</span><span class="v">${SITE.hours.label}</span></li>
          <li><span class="k">Based in</span><span class="v">${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}</span></li>
        </ul>
      </div>
    </div>
    <div class="fbar">
      <span>© ${new Date().getFullYear()} ${SITE.name}</span>
      <span class="fbar-r">
        <span class="theme" role="group" aria-label="Color theme"><button type="button" data-theme-set="auto" aria-pressed="true">Auto</button><button type="button" data-theme-set="light" aria-pressed="false">Light</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button></span>
        <a href="/privacy/">Privacy</a><a href="/terms/">Terms</a>
      </span>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Quick contact">
  <a class="btn btn-primary tel" href="${telHref}">${icon('phone', { size: 16 })}<span>Call</span></a>
  <a class="btn btn-ghost" href="${mailHref}">${icon('mail', { size: 16 })}<span>Email</span></a>
  <a class="btn btn-ghost" href="/contact/">${icon('chat', { size: 16 })}<span>Contact</span></a>
</nav>`;
}

export function layout(page, body) {
  const bodyHtml = toString(body);
  const crumbs = page.crumbs && page.crumbs.length > 1 && !bodyHtml.includes('aria-label="Breadcrumb"') ? html`<div class="wrap crumbs-wrap">${breadcrumbs(page.crumbs)}</div>\n` : '';
  return toString(html`<!doctype html>
<html lang="en-US">
<head>
${head(page)}</head>
<body${page.bodyClass ? raw(` class="${page.bodyClass}"`) : ''}>
${header(page.path)}
<main id="main" tabindex="-1">
${crumbs}${raw(bodyHtml)}
</main>
${footer()}
</body>
</html>
`);
}
