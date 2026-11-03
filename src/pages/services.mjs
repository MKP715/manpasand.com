// /services/ hub + the 8 service pages (content: src/content/services/<slug>.json).
// Copy comes verbatim from the fact-checked content files; this module only lays it out.
import { readFileSync } from 'node:fs';
import { html, inline } from '../lib/html.mjs';
import { SITE, SERVICES, REVIEWS, servicesByGroup } from '../site.mjs';
import {
  pageHero, section, sectionHead, serviceCards, serviceFigure, checklist, steps, prose, toc,
  relatedLinks, reviewCard, caseCard, ctaBand, faqSection, commitments, cameraDisclosure,
  callout, problemChips, chips, icon, directLine, two, accent,
} from '../lib/components.mjs';
import { serviceNode, faqNode, itemListNode, abs } from '../lib/schema.mjs';

const load = (slug) => JSON.parse(readFileSync(new URL(`../content/services/${slug}.json`, import.meta.url), 'utf8'));

// The italic accent phrase of each service H1 (must be a substring of the content h1).
// accentStrict() fails the build if a phrase no longer matches, so a copy edit can't silently drop it.
const H1_ACCENT = {
  'small-business-it': 'without an IT person',
  'network-security': 'for a small business',
  'conference-room-av': 'everyone can see and hear',
  'home-network': 'reaches the far rooms',
  'database-consulting': 'fast and documented',
  'web-development': 'you can keep current',
  'tech-consulting': 'a second pair of eyes',
  photography: 'headshots and portraits',
};
const accentStrict = (text, phrase, slug) => {
  if (phrase && !text.includes(phrase)) throw new Error(`H1_ACCENT['${slug}'] ("${phrase}") is not in the H1 "${text}"`);
  return accent(text, phrase);
};

// "How a project runs" lead, per service (fallback for the IT services).
const PROCESS_LEAD = {
  photography: 'Four steps, from the first call to delivered photos.',
  'web-development': 'Four steps, from the first call to launch.',
  'tech-consulting': 'Four steps, from the first call to written recommendations.',
  'database-consulting': 'Four steps, from the first call to a written runbook.',
};

// Pages that get the camera/alarm licensing callout (compliance §1). network-security and
// home-network carry the disclosure in their own content (an inline paragraph / FAQ), so
// they don't repeat it as a callout.
const DISCLOSE = new Set(['small-business-it']);
// Remote work anywhere is a stated business fact for database and web work only.
const REMOTE = new Set(['database-consulting', 'web-development']);

// ─── local helpers (candidates for components.mjs) ──────────────────────────────
/** "Who this is for": non-interactive audience chips beside a mono label, on the sec-head grid. */
function audienceRow(items, { id = 'aud-h' } = {}) {
  return html`<div class="svc-aud">
  <p class="label" id="${id}">Who it’s for</p>
  <ul class="aud-chips" aria-labelledby="${id}">${items.map((a) => html`<li>${inline(a)}</li>`)}</ul>
</div>`;
}

/** Guarantee line under the process steps (links the full terms). */
const guaranteeNote = () =>
  html`<p class="svc-guarantee">${icon('check', { size: 16 })}<span>Every project is covered by our 14-day workmanship guarantee: if a defect within the original scope is reported within 14 days of completion, we fix it at no cost. ${inline('[Read the guarantee terms](/terms/#guarantee).')}</span></p>`;

// ─── service page ────────────────────────────────────────────────────────────────
function servicePage(svc, index) {
  const c = load(svc.slug);
  const path = `/services/${svc.slug}/`;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services/' },
    { label: svc.name, href: path },
  ];
  const nSec = c.sections.length;
  let n = 1;
  const num = () => two(n++);

  const facts = ['Free consultation', 'Fixed-price quote', 'Reply in 1 business day', REMOTE.has(svc.slug) ? 'On-site in DFW or remote' : 'On-site across DFW'];

  // Proof: the matching real testimonial (verbatim) or the Mahnken case study.
  const review = REVIEWS.find((r) => r.service === svc.slug);
  let proof = '';
  if (review) proof = reviewCard(review, { topic: svc.name, more: { href: '/reviews/', label: 'Read both reviews' } });
  else if (svc.slug === 'web-development')
    proof = caseCard({
      title: 'Mahnken Painting & More website',
      text: 'A Rowlett painter’s website we built twice: a single page in October 2025, then a multi-page static rebuild in November 2026 that went from 1 page search engines could list to 22. The case study covers what we changed and the lab numbers behind it.',
      href: '/work/mahnken-painting-website/',
      site: 'https://mahnkenpainting.com',
    });

  const contactHref = `/contact/?service=${svc.slug}`; // contact.js pre-ticks this service on the form

  const s1 = num();
  const sProcess = num();
  const proseStart = n; // prose H2s continue the page numbering (§ 03 …)
  n += nSec;
  const sProof = num();
  const sCta = num();
  const sFaq = num();

  const body = html`${pageHero({
    crumbs,
    eyebrow: `Service ${two(index + 1)} · ${c.eyebrow}`,
    h1: accentStrict(c.h1, H1_ACCENT[svc.slug], svc.slug),
    lead: c.lede,
    actions: { href: contactHref },
    facts,
    aside: serviceFigure(svc.slug),
  })}
${section(
  { alt: true, labelledby: 'inc-h', cls: 'svc-included' },
  html`${sectionHead({ num: s1, label: 'Scope', id: 'inc-h', title: 'What’s included', lead: c.summary })}
${checklist(c.included)}
${audienceRow(c.audience)}`,
)}
${section(
  { labelledby: 'how-h' },
  html`${sectionHead({ num: sProcess, label: 'Process', id: 'how-h', title: 'How a project runs', lead: PROCESS_LEAD[svc.slug] ?? 'Four steps, the same for a one-hour fix or a month-long project.' })}
${steps(c.process)}
${c.process.some((p) => p.text.includes('/terms/')) ? '' : guaranteeNote()}`,
)}
${section(
  { cls: 'svc-detail' },
  html`<div class="guide-grid">
  <div class="svc-prose" style="--sec-start:${proseStart - 1}">
    ${prose(c.sections)}
    ${DISCLOSE.has(svc.slug) ? html`<div class="mt-m">${cameraDisclosure()}</div>` : ''}
  </div>
  <aside class="guide-aside" aria-label="On this page and contact">
    ${toc(c.sections)}
    ${directLine({ compact: true })}
  </aside>
</div>`,
)}
${section(
  { alt: true, labelledby: 'rel-h', cls: 'svc-proof' },
  proof
    ? html`${sectionHead({ num: sProof, label: review ? 'Client review' : 'Our work', id: 'rel-h', title: review ? 'What a client told us' : 'A website we built, twice', cls: 'sec-head--compact' })}
<div class="split split--7-5">
  ${proof}
  <div class="svc-related"><p class="label">Related services</p>${relatedLinks(c.related, { label: 'Related services' })}</div>
</div>`
    : html`${sectionHead({ num: sProof, label: 'Related', id: 'rel-h', title: 'Services that often go with this one', cls: 'sec-head--compact' })}
<div class="svc-related svc-related--grid">${relatedLinks(c.related, { label: 'Related services' })}</div>`,
)}
${ctaBand({ num: sCta, lead: c.cta, href: contactHref })}
${faqSection({ num: sFaq, faqs: c.faqs, title: `${svc.name} questions`, lead: 'Something not covered here? Call or email us.', more: { href: '/faq/', label: 'All FAQs' } })}`;

  return {
    path,
    title: c.title,
    description: c.description,
    h1: c.h1,
    crumbs,
    bodyClass: 'page-service',
    image: `/assets/img/og-${svc.slug}.jpg`,
    imageAlt: `${svc.name}: Manpasand Technical Services, Rowlett, TX`,
    about: { '@id': `${abs(path)}#service` },
    schema: [
      serviceNode({ name: svc.name, serviceType: c.eyebrow, description: c.description, path, remote: REMOTE.has(svc.slug) }),
      faqNode(c.faqs, path),
    ],
    body,
  };
}

// ─── hub ─────────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    icon: 'store',
    title: 'Retail & hospitality',
    text: 'Shops, cafés and salons run on a card terminal, a few screens and Wi‑Fi that customers expect to work. We set up the network your POS runs on, guest Wi‑Fi that can’t reach it, and the screens and players for digital signage.',
    links: [
      { label: 'POS networks', href: '/services/small-business-it/' },
      { label: 'Guest Wi‑Fi', href: '/services/network-security/' },
      { label: 'Digital signage', href: '/services/small-business-it/' },
    ],
  },
  {
    icon: 'key',
    title: 'Real estate & development',
    text: 'Agents, builders and property managers need listing photos that show a space as it is, and an office that keeps working. We take ground-level interior and exterior listing photos and look after the back-office computers, printers and network.',
    links: [
      { label: 'Listing photography', href: '/services/photography/' },
      { label: 'Back-office IT', href: '/services/small-business-it/' },
    ],
  },
  {
    icon: 'briefcase',
    title: 'Professional services',
    text: 'Accounting, legal and consulting offices hold client data that has to stay confidential. We tune and back up SQL databases, build the ETL behind your reports, plan a move to the cloud with access limited to the right people, and build clear websites.',
    links: [
      { label: 'SQL & ETL', href: '/services/database-consulting/' },
      { label: 'Secure cloud', href: '/services/tech-consulting/' },
      { label: 'Websites', href: '/services/web-development/' },
    ],
  },
];

/** Hero aside for the hub: an index of the groups and sections on the page. */
function hubIndex() {
  const rows = [
    ...servicesByGroup().map((g) => ({ href: `#group-${g.key}`, text: g.label, meta: `${two(g.services.length)} services` })),
    { href: '#industries', text: 'Industries', meta: '03 sectors' },
    { href: '#not-offered', text: 'What we don’t do', meta: 'Read first' },
  ];
  return html`<nav class="svc-index" aria-labelledby="svc-index-h">
  <p class="plate-bar"><span class="label" id="svc-index-h">Index</span><span class="label">${two(SERVICES.length)} services</span></p>
  <ol>${rows.map((r, i) => html`<li><a href="${r.href}"><span class="label">${two(i + 1)}</span><span class="svc-index-t">${r.text}</span><span class="label">${r.meta}</span>${icon('arrow', { size: 16, cls: 'go' })}</a></li>`)}</ol>
  <p class="direct-base">${SITE.hours.label} · Free consultation</p>
</nav>`;
}

function hubPage() {
  const path = '/services/';
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: path },
  ];
  const body = html`${pageHero({
    crumbs,
    eyebrow: `Services · ${two(SERVICES.length)}`,
    h1: html`Services for DFW <em>businesses and homes</em>`,
    lead: 'Eight services in three groups: IT and networks, data and web, and photography. Hire us for one job or for the whole setup. Every project starts with a free consultation and a written, fixed-price quote.',
    facts: ['Fixed-price quotes', 'Reply in 1 business day', 'On-site across DFW', 'Database & web work remote'],
    aside: hubIndex(),
  })}
${problemChips()}
${section(
  { id: 'all', labelledby: 'svc-h' },
  html`${sectionHead({ num: '01', label: 'Services', id: 'svc-h', title: 'Eight services, one local point of contact.', lead: 'IT and photography visits happen on-site across Dallas–Fort Worth. Database and web work can also be done remotely, wherever you are.' })}
${serviceCards({ grouped: true })}`,
)}
${section(
  { id: 'industries', alt: true, labelledby: 'ind-h' },
  html`${sectionHead({ num: '02', label: 'Industries', id: 'ind-h', title: 'Services by industry', lead: 'Many small organizations need a few of these at once. Here is how they can fit together.' })}
<ul class="ind-grid">${INDUSTRIES.map((x, i) => html`<li class="ind">
  <p class="ind-top"><span class="label">${two(i + 1)}</span>${icon(x.icon, { size: 24 })}</p>
  <h3>${x.title}</h3>
  <p>${x.text}</p>
  ${chips(x.links)}
</li>`)}</ul>`,
)}
${section(
  { id: 'not-offered', labelledby: 'no-h', tight: true },
  html`${sectionHead({ num: '03', label: 'Limits', id: 'no-h', title: 'What we don’t do', lead: 'Some work needs a license we don’t hold, so we don’t offer it.', cls: 'sec-head--compact' })}
<div class="split split--6-6 svc-limits">
  ${cameraDisclosure()}
  ${callout({ title: 'Electrical work', text: 'We don’t wire anything into your electrical panel or run power circuits. That’s a job for an electrician. Office network cabling for computers, phones and Wi‑Fi is work we do.' })}
</div>`,
)}
${section(
  { alt: true, labelledby: 'terms-h' },
  html`${sectionHead({ num: '04', label: 'How we work', id: 'terms-h', title: 'Clear terms, in writing, before any work starts.', lead: 'Every service runs the same way: a free consultation, a written scope, one price and a guarantee on the work.' })}
${commitments()}`,
)}
${ctaBand({ num: '05' })}`;

  return {
    path,
    title: 'Services: IT, Networks, Web, Data & Photography | Manpasand',
    description: 'Eight services, one point of contact: small business IT, network security, meeting rooms, SQL databases, websites, photography and home Wi‑Fi in DFW.',
    h1: 'Services for DFW businesses and homes',
    crumbs,
    pageType: 'CollectionPage',
    bodyClass: 'page-services',
    image: '/assets/img/og-services.jpg',
    mainEntity: itemListNode(SERVICES.map((s) => ({ name: s.name, path: `/services/${s.slug}/` })), path),
    body,
  };
}

export default function services() {
  return [hubPage(), ...SERVICES.map((s, i) => servicePage(s, i))];
}
