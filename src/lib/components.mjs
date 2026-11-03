// Shared page components ("Cyanotype", design-final.md §5–§7).
// Every component returns an html`` fragment. Strings passed as `lead`, `text`,
// list items, FAQ answers etc. accept inline markdown (**bold**, *em*, [label](/path/)).
// Titles/headings accept a plain string or an html`` fragment (for an <em> accent).
// Full API with examples: src/lib/COMPONENTS.md.

import { html, raw, inline, esc, safeHref } from './html.mjs';
import { icon, serviceIcon, logoMark } from './icons.mjs';
import { FIGURES, distanceArt, caseStudyArt } from './figures.mjs';
import { picture, img } from './assets.mjs';
import { SITE, SERVICES, GROUPS, AREAS, MORE_AREAS, telHref, mailHref, locationLine, serviceBySlug } from '../site.mjs';

export { icon, serviceIcon, logoMark };

// ─── helpers ───────────────────────────────────────────────────────────────────
/** Zero-padded two-digit number for § / Q. labels: 3 → "03". */
export const two = (n) => String(n).padStart(2, '0');
const isExternal = (href) => /^https?:\/\//.test(href);
const attr = (name, value) => (value === undefined || value === null || value === false || value === '' ? '' : raw(` ${name}="${esc(value)}"`));
const heading = (level, content, { id, cls } = {}) => raw(`<h${level}${id ? ` id="${esc(id)}"` : ''}${cls ? ` class="${cls}"` : ''}>${html`${content}`.value}</h${level}>`);

/** Wrap one phrase of a heading in <em> (the single italic accent). Falls back to the plain string. */
export function accent(text, phrase) {
  const i = phrase ? text.indexOf(phrase) : -1;
  if (i < 0) return text;
  return html`${text.slice(0, i)}<em>${phrase}</em>${text.slice(i + phrase.length)}`;
}

/** Minutes from an area content file's verified "Drive from Rowlett" fact ("About 13 minutes…"), or null. */
export function driveMinutes(area) {
  const f = area?.facts?.find((x) => /^Drive from Rowlett/i.test(x.label));
  const m = f && /About\s+(\d+)\s+min/i.exec(f.value);
  return m ? Number(m[1]) : null;
}

/** "Texas data breach: who to notify" → "texas-data-breach-who-to-notify" */
export function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'"“”]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Unique ids for a list of headings (shared by prose() and toc()). */
export function sectionIds(sections) {
  const used = new Map();
  return sections.map((s) => {
    const base = s.id || slugify(s.heading || 'section');
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

export const paragraphs = (list = []) => list.map((p) => html`<p>${inline(p)}</p>`);

// ─── type + links ──────────────────────────────────────────────────────────────
/** Mono label: label({ num: '01', text: 'Services' }) → "§ 01  Services". */
export function label({ num, text, cls = '', id, tag = 'p' } = {}) {
  return raw(`<${tag} class="label${cls ? ` ${cls}` : ''}"${id ? ` id="${esc(id)}"` : ''}>${num ? `<b>§ ${esc(num)}</b>&nbsp; ` : ''}${esc(text)}</${tag}>`);
}

/** Eyebrow: 10px signal square + mono label. */
export const eyebrow = (text) => html`<p class="eyebrow label">${text}</p>`;

/** Button. variant 'primary' | 'ghost'. `iconLeft` = icon name before the label; `arrow` adds the trailing arrow. */
export function btn({ href, label: text, variant = 'primary', iconLeft, iconRight, arrow = false, lg = false, block = false, cls = '', tel = false, attrs = '' }) {
  const ext = isExternal(href);
  const classes = ['btn', `btn-${variant}`, lg && 'btn-lg', block && 'btn-block', tel && 'tel', cls].filter(Boolean).join(' ');
  return html`<a class="${classes}" href="${safeHref(href)}"${ext ? raw(' rel="noopener"') : ''}${raw(attrs ? ` ${attrs}` : '')}>${iconLeft ? icon(iconLeft, { size: 16 }) : ''}<span>${text}</span>${iconRight ? icon(iconRight, { size: 16 }) : ''}${arrow ? icon('arrow', { size: 16, cls: 'arr' }) : ''}</a>`;
}

/** Text link with an arrow (or ↗ for off-site links). */
export function more({ href, label: text, cls = '', newTab = false }) {
  const ext = isExternal(href);
  return html`<a class="more${cls ? ` ${cls}` : ''}" href="${safeHref(href)}"${ext ? raw(newTab ? ' rel="noopener" target="_blank"' : ' rel="noopener"') : ''}><span>${text}</span>${icon(ext ? 'arrow-up-right' : 'arrow', { size: 16 })}${ext && newTab ? html`<span class="sr-only"> (opens in a new tab)</span>` : ''}</a>`;
}

/** Primary CTA + ghost Call button. */
export function primaryActions({ label: text = 'Book a free consultation', href = '/contact/', call = true, cls = '' } = {}) {
  return html`<div class="cta-row${cls ? ` ${cls}` : ''}">
  ${btn({ href, label: text, arrow: true })}
  ${call ? btn({ href: telHref, label: `Call ${SITE.phone}`, variant: 'ghost', iconLeft: 'phone', tel: true }) : ''}
</div>`;
}

// ─── chips / tags ──────────────────────────────────────────────────────────────
/** Topic tags (mono). items: strings or { text, aud: true } (audience tag, tinted). */
export function tags(items = []) {
  return html`<ul class="tags">${items.filter(Boolean).map((t) => (typeof t === 'string' ? html`<li>${t}</li>` : html`<li${t.aud ? raw(' class="aud"') : ''}>${t.text}</li>`))}</ul>`;
}
export const tag = (text, { aud = false } = {}) => html`<span class="tag${aud ? ' aud' : ''}">${text}</span>`;
/** "Updated Nov 3, 2026" status chip with a signal square. */
export const statusChip = (text) => html`<span class="status">${text}</span>`;

/** Link chips with a trailing arrow. items: [{ href, label }]. */
export function chips(items, { arrow = true, cls = '' } = {}) {
  return html`<ul class="chips${cls ? ` ${cls}` : ''}">${items.map((c) =>
    c.href ? html`<li><a href="${safeHref(c.href)}">${c.label}${arrow ? icon('arrow', { size: 14 }) : ''}</a></li>` : html`<li><span>${c.label}</span></li>`,
  )}</ul>`;
}

/** City chips: the 6 city pages (linked) + MORE_AREAS (plain text). */
export function areaChips({ linked = true, moreAreas = true, exclude = [] } = {}) {
  const cities = AREAS.filter((a) => !exclude.includes(a.slug)).map((a) => (linked ? { href: `/service-areas/${a.slug}/`, label: a.city } : { label: a.city }));
  const extra = moreAreas ? MORE_AREAS.map((c) => ({ label: c })) : [];
  return chips([...cities, ...extra], { arrow: false, cls: 'chips--area' });
}

const PROBLEMS = [
  ['small-business-it', 'Setting up a new office'],
  ['network-security', 'Office Wi‑Fi keeps dropping', 'office-wifi'],
  ['conference-room-av', 'Nobody can hear us on calls'],
  ['database-consulting', 'We’ve outgrown our spreadsheets'],
  ['web-development', 'Our website looks dated'],
  ['photography', 'Photos for a listing'],
  ['home-network', 'Dead zones in the house'],
  ['tech-consulting', 'Not sure what to buy'],
];
/** Full-width "Start with the problem" strip (§6.7). Place directly after a hero. */
export function problemChips({ label: text = 'Start with the problem', items, id = 'starts-h' } = {}) {
  const list = items || PROBLEMS.map(([slug, l, hash]) => ({ href: `/services/${slug}/${hash ? `#${hash}` : ''}`, label: l }));
  return html`<nav class="starts" aria-labelledby="${id}">
  <div class="wrap starts-in">
    <p class="label" id="${id}"><b aria-hidden="true">→</b>&nbsp; ${text}</p>
    ${chips(list)}
  </div>
</nav>`;
}

// ─── heroes ────────────────────────────────────────────────────────────────────
/** 4-cell location/hours line (§6.2). */
export function runningHead() {
  const cells = [
    ['Based in', `${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}`],
    ['On-site', SITE.serviceArea],
    ['Remote', 'Database & web'],
    [`Hours (${SITE.hours.tz})`, SITE.hours.range],
  ];
  return html`<dl class="runhead" aria-label="Location and hours">${cells.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
}

/** Mono checklist with outlined squares (hero facts). */
export const heroFacts = (items, { label: aria = 'What you can count on' } = {}) =>
  html`<ul class="facts" aria-label="${aria}">${items.map((i) => html`<li>${i}</li>`)}</ul>`;

/** Dictionary entry "man·pa·sand" (home hero, About). */
export function definition() {
  return html`<div class="define">
  <p class="label">About the name</p>
  <dl>
    <dt>man·pa·sand</dt>
    <dd>Urdu/Hindi — well-liked; to one’s liking.</dd>
  </dl>
</div>`;
}

/** Breadcrumbs (§6.13). crumbs: [{ label, href }]; the last item is the current page. */
export function breadcrumbs(crumbs) {
  if (!crumbs || crumbs.length < 2) return '';
  return html`<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((c, i) =>
    i === crumbs.length - 1 ? html`<li><span aria-current="page">${c.label}</span></li>` : html`<li><a href="${safeHref(c.href)}">${c.label}</a></li>`,
  )}</ol></nav>`;
}

/**
 * Page hero (§6.3 / §6.4).
 * { crumbs, eyebrow, h1, lead, actions = true | {label, href, call}, facts: [..], define, meta,
 *   aside: html (plate, directLine(), readoutCard()…), home: false, runhead: home, after: html }
 */
export function pageHero({ crumbs, eyebrow: eb, h1, lead, actions = true, facts, define = false, meta, aside, home = false, runhead = home, after, id = 'top' }) {
  return html`<section class="hero${home ? ' hero--home' : ' hero--page'}" id="${id}">
  <div class="wrap">
    ${runhead ? runningHead() : ''}
    ${breadcrumbs(crumbs)}
    <div class="hero-grid${aside ? '' : ' hero-grid--solo'}">
      <div class="hero-main">
        ${eb ? eyebrow(eb) : ''}
        <h1>${h1}</h1>
        ${lead ? html`<p class="lead">${inline(lead)}</p>` : ''}
        ${meta || ''}
        ${actions ? primaryActions(actions === true ? {} : actions) : ''}
        ${facts && facts.length ? heroFacts(facts) : ''}
        ${define ? definition() : ''}
        ${after || ''}
      </div>
      ${aside ? html`<div class="hero-aside">${aside}</div>` : ''}
    </div>
  </div>
</section>`;
}

/** "Direct line" aside card (About, Contact, FAQ, Reviews, Work hub). */
export function directLine({ title = 'Direct line', compact = false } = {}) {
  return html`<aside class="direct${compact ? ' direct--compact' : ''}" aria-label="${title}">
  <p class="plate-bar"><span class="label">${title}</span><span class="label">${SITE.address.city}, ${SITE.address.region}</span></p>
  <a class="direct-row tel" href="${telHref}"><span class="direct-ic">${icon('phone', { size: 20 })}</span><span><strong>${SITE.phone}</strong><span>${SITE.hours.label}</span></span></a>
  <a class="direct-row" href="${mailHref}"><span class="direct-ic">${icon('mail', { size: 20 })}</span><span><strong>${SITE.email}</strong><span>Reply within one business day</span></span></a>
  <p class="direct-base">${locationLine}</p>
</aside>`;
}

/** City readout card: facts dl + a Rowlett → city dimension strip (the home-base city gets a "· Home base" header and no strip). facts: [{label, value}]; drive: short strip label e.g. 'About 15 min'. */
export function readoutCard({ city, facts = [], drive, id }) {
  const fid = id || `readout-${slugify(city)}`;
  const home = city === SITE.address.city;
  const cap = home ? `${city} · Home base` : `${SITE.address.city} → ${city}`;
  return html`<figure class="readout" aria-labelledby="${fid}-cap">
  <p class="plate-bar"><span class="label">Fig. —</span><span class="label" id="${fid}-cap">${cap}</span></p>
  <dl class="readout-dl">${facts.map((f) => html`<div><dt>${f.label}</dt><dd>${inline(f.value)}</dd></div>`)}</dl>
  ${drive && !home ? html`<svg class="readout-strip" viewBox="0 0 480 120" aria-hidden="true" focusable="false">${raw(distanceArt({ to: city, label: drive }))}</svg>` : ''}
</figure>`;
}

/** Guide meta row: "Guide · Updated Nov 3, 2026 · 9 min read". updated = 'YYYY-MM-DD'; word = 'Effective' for legal pages. */
export function guideMeta({ updated, minutes, kind = 'Guide', word = 'Updated' } = {}) {
  return html`<p class="guide-meta label"><span>${kind}</span>${updated ? html`<span><time datetime="${updated}">${word} ${formatDate(updated)}</time></span>` : ''}${minutes ? html`<span>${minutes} min read</span>` : ''}</p>`;
}
export function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// ─── sections ──────────────────────────────────────────────────────────────────
/** <section class="section"> + .wrap. opts: { id, labelledby, alt, band, tight, cls, wrapCls } */
export function section({ id, labelledby, alt = false, tight = false, cls = '', wrapCls = '' } = {}, inner) {
  const c = ['section', alt && 'alt', tight && 'section--tight', cls].filter(Boolean).join(' ');
  return html`<section class="${c}"${attr('id', id)}${attr('aria-labelledby', labelledby)}>
  <div class="wrap${wrapCls ? ` ${wrapCls}` : ''}">
${inner}
  </div>
</section>`;
}

/** Section head (§5): § label left, H2 + lead + optional more link right. */
export function sectionHead({ num, label: text, title, lead, more: m, id, level = 2, cls = '' }) {
  return html`<div class="sec-head${cls ? ` ${cls}` : ''}">
  ${label({ num, text })}
  <div>
    ${heading(level, title, { id })}
    ${lead ? html`<p class="lead">${inline(lead)}</p>` : ''}
    ${m ? more(m) : ''}
  </div>
</div>`;
}

// ─── services ──────────────────────────────────────────────────────────────────
const TOPIC = {
  'small-business-it': 'POS',
  'network-security': 'Firewalls',
  'conference-room-av': 'Video calls',
  'home-network': 'Mesh Wi‑Fi',
  'database-consulting': 'SQL Server',
  'web-development': 'Responsive',
  'tech-consulting': 'Planning',
  photography: 'Listings',
};

function serviceCell(s, i, level) {
  return html`<li class="svc">
  <div class="svc-top"><span class="label">${two(i + 1)}</span>${serviceIcon(s.slug)}</div>
  ${raw(`<h${level}>`)}<a href="/services/${s.slug}/">${s.name}</a>${raw(`</h${level}>`)}
  <p>${s.summary}</p>
  ${tags([{ text: s.audience, aud: true }, s.topic || TOPIC[s.slug]])}
  ${icon('arrow', { size: 20, cls: 'go' })}
</li>`;
}

/**
 * Hairline service grid (§6.6). services: SERVICES (default) or a subset/override list
 * (each { slug, name, summary, audience, topic? }). grouped: three grouped grids (hub).
 */
export function serviceCards({ services = SERVICES, grouped = false, level = 3 } = {}) {
  const index = (s) => SERVICES.findIndex((x) => x.slug === s.slug);
  if (!grouped) return html`<ul class="services">${services.map((s, i) => serviceCell(s, index(s) >= 0 ? index(s) : i, level))}</ul>`;
  return html`<div class="svc-groups">${Object.entries(GROUPS).map(([key, name]) => {
    const list = services.filter((s) => s.group === key);
    if (!list.length) return '';
    return html`<div class="svc-group" id="group-${key}">
  <p class="label svc-group-h">${name}<span>${two(list.length)}</span></p>
  <ul class="services services--auto">${list.map((s) => serviceCell(s, index(s), level))}</ul>
</div>`;
  })}</div>`;
}

/** Ruled list of links with service icons (§6.18). items: service slugs or { href, title, text?, slug? }. */
export function relatedLinks(items, { label: aria = 'Related' } = {}) {
  const list = items.map((it) => {
    if (typeof it === 'string') {
      const s = serviceBySlug(it);
      return { href: `/services/${s.slug}/`, title: s.name, text: s.summary, slug: s.slug };
    }
    return it;
  });
  return html`<ul class="related" aria-label="${aria}">${list.map((it) => html`<li><a href="${safeHref(it.href)}">${it.slug ? serviceIcon(it.slug, { size: 32 }) : it.icon ? icon(it.icon, { size: 24, cls: 'related-ic' }) : ''}<span class="related-t"><strong>${it.title}</strong>${it.text ? html`<span>${inline(it.text)}</span>` : ''}</span>${icon('arrow', { size: 16, cls: 'go' })}</a></li>`)}</ul>`;
}

// ─── commitments ───────────────────────────────────────────────────────────────
export const TERMS = [
  { key: 'Quote', letter: 'A', value: 'Fixed price', sub: 'Free consultation first', text: 'We write up the scope of work and give you one price before anything begins. Any Texas sales tax is its own line. No hidden fees.' },
  { key: 'Response', letter: 'B', value: '1 day', sub: 'Reply within 1 business day', text: 'Every message gets a reply within one business day. Critical support requests are acknowledged within two hours during business hours.' },
  { key: 'Guarantee', letter: 'C', value: '14 days', sub: 'Workmanship', text: 'If a defect within the original scope is reported within 14 days of completion, we fix it at no cost. [Guarantee terms](/terms/#guarantee).' },
  { key: 'Coverage', letter: 'D', value: 'Insured', sub: 'Confidentiality assured', text: 'We carry insurance, and your data, passwords and premises are kept confidential.' },
];

/** Ruler tick strip (decorative). */
export const ruler = ({ sm = false } = {}) => html`<div class="ruler${sm ? ' ruler--sm' : ''}" aria-hidden="true"></div>`;

/** "DFW-based · Transparent pricing · Insured · Confidentiality assured" */
export const trustLine = () => html`<p class="trust">${SITE.trustLine.map((t) => html`<span class="label">${t}</span>`)}</p>`;

/** The 4 stated commitments as ruled cells + ruler + trust line (§6.8). Wrap in section({ alt: true }) with a sectionHead. */
export function commitments({ ruler: showRuler = true, trust = true } = {}) {
  return html`<ul class="terms">${TERMS.map((t) => html`<li class="term">
  <p class="label"><span>${t.key}</span><span>${t.letter}</span></p>
  <p class="val">${t.value}</p>
  <p class="sub">${t.sub}</p>
  <p>${inline(t.text)}</p>
</li>`)}</ul>
${showRuler ? ruler() : ''}
${trust ? trustLine() : ''}`;
}

// ─── lists ─────────────────────────────────────────────────────────────────────
/** "What's included" checklist (2 columns ≥800px unless cols: 1). */
export const checklist = (items, { cols = 2 } = {}) =>
  html`<ul class="checklist${cols === 1 ? ' checklist--1' : ''}">${items.map((i) => html`<li>${icon('check', { size: 16 })}<span>${inline(i)}</span></li>`)}</ul>`;

/** Process steps (4 columns). items: [{ title, text }]. */
export function steps(items, { ruler: showRuler = true, level = 3 } = {}) {
  return html`<ol class="steps">${items.map((s, i) => html`<li class="step"><p class="label">Step ${i + 1}</p>${raw(`<h${level}>`)}${s.title}${raw(`</h${level}>`)}<p>${inline(s.text)}</p></li>`)}</ol>${showRuler ? ruler() : ''}`;
}

/** Facts dl (mono dt, sans 600 dd). items: [{ label, value }]. */
export const factsList = (items, { cols = 2 } = {}) =>
  html`<dl class="factlist${cols === 1 ? ' factlist--1' : ''}">${items.map((f) => html`<div><dt>${f.label}</dt><dd>${inline(f.value)}</dd></div>`)}</dl>`;

/** Key takeaways panel (guides). */
export const keyTakeaways = (items, { title = 'Key takeaways' } = {}) =>
  html`<aside class="takeaways" aria-label="${title}"><p class="label">${title}</p><ol>${items.map((i) => html`<li><span>${inline(i)}</span></li>`)}</ol></aside>`;

/** Callout (§6.12). variant 'info' | 'warn'. text: inline markdown; or pass `body` html. */
export function callout({ title, text, body, variant = 'info', id, cls = '' }) {
  return html`<aside class="callout${variant === 'warn' ? ' callout--warn' : ''}${cls ? ` ${cls}` : ''}"${attr('id', id)}${title ? '' : raw(' aria-label="Note"')}>
  ${title ? html`<p class="callout-t">${icon(variant === 'warn' ? 'alert' : 'info', { size: 16 })}<span>${title}</span></p>` : ''}
  ${text ? html`<p>${inline(text)}</p>` : ''}${body || ''}
</aside>`;
}

/** The camera/alarm licensing disclosure (compliance §1). Used as a callout on small-business-it, the services hub and the FAQ;
 *  network-security and home-network carry the disclosure in their own content (inline paragraph / FAQ answer). */
export function cameraDisclosure() {
  return callout({
    title: 'Security cameras and alarms',
    body: html`<p>We don’t install security cameras or alarm systems. Texas requires a DPS Private Security license for that work, and we don’t hold one. Hire a licensed company — you can check any installer at <a href="https://tops.portal.texas.gov/" rel="noopener">tops.portal.texas.gov</a>.</p>`,
  });
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
/** details/summary list (§6.14). items: [{ q, a, body? }] (a = inline markdown, or array of paragraphs;
 *  body = an html`` fragment used instead of `a`, e.g. to place cameraDisclosure() in an answer).
 *  start = first Q. number, so numbering can run across several lists. */
export function faqList(items, { openFirst = false, start = 1 } = {}) {
  return html`<div class="faq">${items.map((f, i) => html`<details${openFirst && i === 0 ? raw(' open') : ''}>
  <summary><span class="q">Q.${two(start + i)}</span><span class="qt">${f.q}</span><span class="pm" aria-hidden="true"></span></summary>
  <div class="a">${f.body ? f.body : (Array.isArray(f.a) ? f.a : [f.a]).map((p) => html`<p>${inline(p)}</p>`)}</div>
</details>`)}</div>`;
}

/** Full FAQ section: sticky intro (4fr) + list (8fr). */
export function faqSection({ num, label: text = 'Questions', title = 'Plain answers to common questions.', lead, more: m, faqs, openFirst = true, id = 'faq', alt = false }) {
  return section(
    { id, labelledby: `${id}-h`, alt },
    html`<div class="faq-grid">
  <div class="faq-intro">
    ${label({ num, text })}
    <h2 id="${id}-h">${title}</h2>
    ${lead ? html`<p class="lead">${inline(lead)}</p>` : ''}
    ${m ? more(m) : ''}
  </div>
  ${faqList(faqs, { openFirst })}
</div>`,
  );
}

// ─── CTA band ──────────────────────────────────────────────────────────────────
const BAND_MARK = '<svg class="band-mark" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="200" cy="200" r="120"/><circle cx="200" cy="200" r="80"/><path d="M200 0v400M0 200h400"/><rect x="180" y="180" width="40" height="40"/></svg>';

/** Dark CTA band (§6.17). Once per page, before the FAQ or the footer. */
export function ctaBand({
  num,
  label: text = 'Start here',
  title = html`Tell us what you’re working with. <em>We’ll tell you what it takes.</em>`,
  lead = 'Book a free consultation. You’ll get a written scope of work and a fixed-price quote before anything begins — and a reply within one business day.',
  primary = 'Book a free consultation',
  href = '/contact/',
  id = 'cta',
} = {}) {
  return html`<section class="section band" id="${id}" aria-labelledby="${id}-h">
  ${raw(BAND_MARK)}
  <div class="wrap band-grid">
    <div>
      ${label({ num, text })}
      <h2 id="${id}-h">${title}</h2>
      ${lead ? html`<p class="lead">${inline(lead)}</p>` : ''}
    </div>
    <div class="band-actions">
      ${btn({ href, label: primary, iconRight: 'arrow', cls: 'btn-band' })}
      ${btn({ href: telHref, label: `Call ${SITE.phone}`, variant: 'ghost', iconRight: 'phone', tel: true, cls: 'btn-band' })}
      <div class="band-meta"><a href="${mailHref}">${SITE.email}</a><span class="label">${SITE.hours.short}</span></div>
    </div>
  </div>
</section>`;
}

// ─── reviews + cards ───────────────────────────────────────────────────────────
const QUOTE_MARK = '<svg class="quote-mark" viewBox="0 0 44 34" aria-hidden="true" focusable="false"><path d="M0 34V20C0 8.5 6 1.8 17 0l1.6 4.6C12.2 6.6 9.4 10.5 9.2 16H18v18zm26 0V20C26 8.5 32 1.8 43 0l1.6 4.6C38.2 6.6 35.4 10.5 35.2 16H44v18z"/></svg>';

/** Review card (§6.9). Verbatim text, NO stars, no schema. Shows review.note (context) when present. */
export function reviewCard(review, { topic, more: m, note = true, cls = '' } = {}) {
  const t = topic || (review.service ? serviceBySlug(review.service).name : '');
  return html`<figure class="quote${cls ? ` ${cls}` : ''}">
  <p class="label"><span>Client review</span>${t ? html`<span>${t}</span>` : ''}</p>
  ${raw(QUOTE_MARK)}
  <blockquote><p>${review.text}</p></blockquote>
  <figcaption>
    <span class="who"><strong>${review.name}</strong><span>${review.role}</span></span>
    ${m ? more(m) : ''}
  </figcaption>
  ${note && review.note ? html`<p class="quote-note">${icon('info', { size: 16 })}<span>${review.note}</span></p>` : ''}
</figure>`;
}

/** Case-study card (§6.18). */
export function caseCard({ title, text, href, site, bar = ['Case study', 'Web development'], level = 3, id = 'case-h' }) {
  return html`<article class="case" aria-labelledby="${id}">
  <p class="plate-bar"><span class="label">${bar[0]}</span><span class="label">${bar[1]}</span></p>
  <div class="case-fig"><svg viewBox="0 0 400 210" aria-hidden="true" focusable="false">${raw(caseStudyArt())}</svg></div>
  <div class="case-body">
    ${heading(level, title, { id })}
    ${text ? html`<p>${inline(text)}</p>` : ''}
    <div class="case-links">${href ? more({ href, label: 'Read the case study' }) : ''}${site ? more({ href: site, label: site.replace(/^https?:\/\//, '').replace(/\/$/, '') }) : ''}</div>
  </div>
</article>`;
}

/** Guide card (§6.18). g: { slug, title, summary }. */
export function guideCard(g, { minutes, updated, level = 3 } = {}) {
  return html`<article class="gcard">
  <p class="gcard-top"><span class="label">Guide${minutes ? ` · ${minutes} min` : ''}</span>${updated ? statusChip(`Updated ${formatDate(updated)}`) : ''}</p>
  ${raw(`<h${level}>`)}<a href="/guides/${g.slug}/">${g.title}</a>${raw(`</h${level}>`)}
  ${g.summary ? html`<p>${inline(g.summary)}</p>` : ''}
  <span class="more" aria-hidden="true"><span>Read the guide</span>${icon('arrow', { size: 16 })}</span>
</article>`;
}
export const guideCards = (guides, opts = {}) => html`<div class="gcards">${guides.map((g) => guideCard(g, typeof opts === 'function' ? opts(g) : opts))}</div>`;

/** Area cards (hub). items: [{ slug, city, county, summary, drive? }]. */
export function areaCards(items, { level = 3 } = {}) {
  return html`<ul class="services areas">${items.map((a) => html`<li class="svc">
  <div class="svc-top"><span class="label">${a.county || ''}</span>${a.drive ? html`<span class="label">${a.drive}</span>` : ''}</div>
  ${raw(`<h${level}>`)}<a href="/service-areas/${a.slug}/">${a.city}</a>${raw(`</h${level}>`)}
  ${a.summary ? html`<p>${inline(a.summary)}</p>` : ''}
  <span class="more" aria-hidden="true"><span>${a.city} service area</span>${icon('arrow', { size: 16 })}</span>
</li>`)}</ul>`;
}

// ─── long-form ─────────────────────────────────────────────────────────────────
/** Data table (§6.11). numeric: column indexes to right-align with tabular figures. */
// Keep phone numbers on one line in table cells (text between tags only, so hrefs are untouched).
const keepPhones = (f) => raw(f.value.replace(/(^|>)([^<]+)/g, (_, p, t) => p + t.replace(/\b(?:1-)?\d{3}-\d{3}-\d{4}\b/g, '<span class="nowrap">$&</span>')));

export function table({ caption, head = [], rows = [], numeric = [] }) {
  const al = (i) => (numeric.includes(i) ? raw(' class="num"') : '');
  return html`<div class="table-wrap" role="region" tabindex="0"${attr('aria-label', caption || 'Table')}>
<table>
  ${caption ? html`<caption>${caption}</caption>` : ''}
  ${head.length ? html`<thead><tr>${head.map((h, i) => html`<th scope="col"${al(i)}>${h}</th>`)}</tr></thead>` : ''}
  <tbody>${rows.map((r) => html`<tr>${r.map((c, i) => (i === 0 ? html`<th scope="row"${al(i)}>${keepPhones(inline(c))}</th>` : html`<td${al(i)}>${keepPhones(inline(c))}</td>`))}</tr>`)}</tbody>
</table>
</div>`;
}

function proseBlock(s) {
  return html`${paragraphs(s.paragraphs)}
${s.list && s.list.length ? (s.ordered ? html`<ol>${s.list.map((i) => html`<li>${inline(i)}</li>`)}</ol>` : html`<ul>${s.list.map((i) => html`<li>${inline(i)}</li>`)}</ul>`) : ''}
${s.table ? table(s.table) : ''}
${s.callout ? callout({ title: s.callout.title, text: s.callout.text, variant: s.callout.variant }) : ''}
${paragraphs(s.after)}`;
}

/**
 * Long-form prose (§6.15) from the content contract:
 * sections: [{ heading, id?, paragraphs, list, ordered, table, callout, after, subsections: [{ heading, …same }] }]
 * Each H2 gets an id (sectionIds) and an automatic "§ 0N" label (turn off with counter: false).
 */
export function prose(sections, { counter = true, cls = '', backTo } = {}) {
  const ids = sectionIds(sections);
  return html`<div class="prose${counter ? ' prose--count' : ''}${cls ? ` ${cls}` : ''}">
${sections.map((s, i) => html`<section aria-labelledby="${ids[i]}">
${s.heading ? html`<h2 id="${ids[i]}">${s.heading}</h2>` : ''}
${proseBlock(s)}
${(s.subsections || []).map((sub) => html`<h3>${sub.heading}</h3>${proseBlock(sub)}`)}
${backTo ? html`<p class="back-to"><a href="${backTo}">Back to contents <span aria-hidden="true">↑</span></a></p>` : ''}
</section>`)}
</div>`;
}

/** "On this page" TOC for prose sections (guides). A <details> collapsed before paint at ≤960px by the inline
 *  script (no layout shift when site.js arrives); site.js highlights the current section and moves focus to it. */
export function toc(sections, { title = 'On this page', id } = {}) {
  const ids = sectionIds(sections);
  const list = html`<ol>${sections.map((s, i) => html`<li><a href="#${ids[i]}">${s.heading}</a></li>`)}</ol>`;
  return html`<nav class="toc"${attr('id', id)} aria-label="${title}">
  <details class="toc-d" open><summary class="label">${title}</summary>${list}</details><script>if(matchMedia('(max-width: 960px)').matches)document.currentScript.previousElementSibling.open=false</script>
</nav>`;
}

/** Hostname shown as a source's link text (the full URL stays in href, and print shows it). */
const srcHost = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
};

/** Numbered sources (§6.15). items: [{ label, url }] (or { claim, url }). */
export function sourcesList(items, { title = 'Sources', id = 'sources' } = {}) {
  return html`<section class="sources" aria-labelledby="${id}"><h2 id="${id}" class="label">${title}</h2><ol>${items.map((s) => html`<li><span>${s.label || s.claim} <a href="${safeHref(s.url)}" rel="noopener">${srcHost(s.url)}${icon('arrow-up-right', { size: 14 })}</a></span></li>`)}</ol></section>`;
}

// ─── figures ───────────────────────────────────────────────────────────────────
/**
 * Fig. plate (§7.1). A framed schematic with a header bar ("Fig. N" + caption), an
 * accessible SVG (role=img, labelled by the visible caption, described by `desc`)
 * and an HTML legend for the numbered markers.
 * { n, caption, desc, legend: [..], art: svg markup string, viewBox, id, cls }
 */
export function plate({ n, caption, desc, legend = [], art, viewBox = '0 0 480 400', id, cls = '' }) {
  const pid = id || `fig-${slugify(caption)}`;
  return html`<figure class="plate${cls ? ` ${cls}` : ''}" aria-labelledby="${pid}-cap">
  <p class="plate-bar"><span class="label">Fig. ${n ?? '—'}</span><span class="label" id="${pid}-cap">${caption}</span></p>
  <svg viewBox="${viewBox}" role="img" aria-labelledby="${pid}-cap" aria-describedby="${pid}-desc"><desc id="${pid}-desc">${desc}</desc><g aria-hidden="true">${raw(art)}</g></svg>
  ${legend.length ? html`<figcaption><ol class="legend">${legend.map((l) => html`<li>${l}</li>`)}</ol></figcaption>` : ''}
</figure>`;
}

/** Built-in figure by key: 'home' (Fig. 1) or a service slug (Fig. 2–9). Override `n` to renumber. */
export function figure(key, { n, id, cls } = {}) {
  const f = FIGURES[key];
  if (!f) throw new Error(`Unknown figure: ${key} (have: ${Object.keys(FIGURES).join(', ')})`);
  return plate({ ...f, n: n ?? f.n, id: id || `fig-${key}`, cls });
}
export const serviceFigure = (slug, opts) => figure(slug, opts);
export const homeFigure = (opts) => figure('home', opts);

/** Photo exhibit inside a plate (§7.3) via the image manifest. Never full-bleed. */
export function exhibit(key, { caption, label: bar = 'Plate', alt, sizes = '(min-width: 960px) 520px, 100vw', ratio = '3/2', eager = false } = {}) {
  img(key); // throws for unknown keys
  return html`<figure class="plate exhibit">
  <p class="plate-bar"><span class="label">${bar}</span>${caption ? html`<span class="label">${caption}</span>` : ''}</p>
  <div class="exhibit-img" style="aspect-ratio:${ratio}">${picture(key, { alt, sizes, eager })}</div>
</figure>`;
}

// ─── forms ─────────────────────────────────────────────────────────────────────
/**
 * Form field (§6.16). { id, name, label, type = 'text' | 'email' | 'tel' | 'textarea' | 'select',
 * required, help, autocomplete, inputmode, placeholder, options: [..], rows, half }
 * Renders label, control, help text (aria-describedby) and an empty error slot (#<id>-err).
 */
export function field({ id, name = id, label: text, type = 'text', required = false, help, autocomplete, inputmode, placeholder, options = [], rows = 6, half = false, value }) {
  const described = [help && `${id}-help`, `${id}-err`].filter(Boolean).join(' ');
  const common = html` id="${id}" name="${name}"${required ? raw(' required') : ''}${attr('autocomplete', autocomplete)}${attr('inputmode', inputmode)}${attr('placeholder', placeholder)} aria-describedby="${described}"`;
  const control =
    type === 'textarea'
      ? html`<textarea${common} rows="${rows}">${value || ''}</textarea>`
      : type === 'select'
        ? html`<select${common}>${options.map((o) => html`<option>${o}</option>`)}</select>`
        : html`<input type="${type}"${common}${attr('value', value)}>`;
  return html`<div class="field${half ? ' field--half' : ''}">
  <label for="${id}">${text}${required ? html`<span class="req"> (required)</span>` : ''}</label>
  ${control}
  ${help ? html`<p class="help" id="${id}-help">${help}</p>` : ''}
  <p class="err" id="${id}-err" hidden></p>
</div>`;
}
