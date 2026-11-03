// Home page ("/"). Design: design-final.md §6.3 + design-final-mockup.html. SEO: seo-map.json "/".
// Copy rules: brief.md "Decisions after research" (no camera/alarm/drone offers, verbatim reviews,
// Jane S.'s context note, Mahnken facts only from case-study/facts.md).
import { readFileSync } from 'node:fs';
import { html } from '../lib/html.mjs';
import { AREAS, MORE_AREAS, GUIDES, REVIEWS } from '../site.mjs';
import {
  pageHero, homeFigure, problemChips, section, sectionHead, serviceCards, commitments,
  reviewCard, caseCard, areaCards, chips, guideCards, ctaBand, faqSection, icon, driveMinutes,
} from '../lib/components.mjs';

// ─── content helpers (read-only; the page still builds if a content file is missing) ──
const readJson = (rel) => {
  try {
    return JSON.parse(readFileSync(new URL(`../content/${rel}`, import.meta.url), 'utf8'));
  } catch {
    return null;
  }
};

/** Short drive label for an area card, from the city file's verified "Drive from Rowlett" fact. */
function driveLabel(slug) {
  if (slug === 'rowlett-tx') return 'Home base';
  const m = driveMinutes(readJson(`areas/${slug}.json`));
  return m ? `≈ ${m} min` : '';
}

const guideUpdated = (slug) => readJson(`guides/${slug}.json`)?.updated;

// ─── local component: lab before/after readout for the case study ─────────────
// (Candidate for components.mjs if /work/ wants the same panel.)
// Figures: Mahnken case-study lab measurements, 2026-11-03. Lab data, not traffic or sales.
const CASE_METRICS = [
  { label: 'Pages search engines can list', before: '1', after: '22' },
  { label: 'Home page, first load', before: '1.39 MB', after: '218 KB' },
  { label: 'Requests on first load', before: '20', after: '9' },
  { label: 'Outside servers contacted', before: '24', after: '0' },
];

function measureCard() {
  return html`<figure class="hm-measure" aria-labelledby="hm-measure-cap">
  <p class="plate-bar"><span class="label">Fig. —</span><span class="label" id="hm-measure-cap">Lab readout · v1 → rebuild</span></p>
  <dl class="hm-measure-dl">${CASE_METRICS.map((m) => html`<div>
    <dt>${m.label}</dt>
    <dd><span class="hm-before"><span class="sr-only">Version 1: </span>${m.before}</span>${icon('arrow', { size: 16, cls: 'hm-to' })}<span class="hm-after"><span class="sr-only">, rebuild: </span>${m.after}</span></dd>
  </div>`)}</dl>
  <figcaption class="hm-measure-note">Measured in Chrome on Nov 3, 2026. These are lab measurements of the two builds, not traffic, ranking or sales figures.</figcaption>
</figure>`;
}

// ─── FAQ (general questions; consistent with /faq/ and the business facts) ─────
const FAQS = [
  {
    q: 'Is the first consultation free, and how do quotes work?',
    a: [
      'Yes, the first consultation is free. Call, email or use the [contact form](/contact/) to tell us what you’re working with.',
      'We then send a written scope of work and one fixed price, with any Texas sales tax shown as its own line, before any work begins. No hidden fees.',
    ],
  },
  {
    q: 'When are you available, and how fast do you reply?',
    a: 'Our hours are Monday to Friday, 9 AM – 5 PM Central Time. Every message gets a reply within one business day, and critical support requests are acknowledged within two hours during those hours. We agree a start date with you when we send the quote.',
  },
  {
    q: 'Do you come on-site, or work remotely?',
    a: 'Both. Office IT, networks, Wi‑Fi, conference rooms and photography are on-site across Dallas–Fort Worth, from our base in Rowlett, TX 75088. Database and web work can be done remotely, wherever you are. See our [service areas](/service-areas/).',
  },
  {
    q: 'Do you work with homeowners as well as businesses?',
    a: 'Yes. We work with small businesses and with households. For homes, we set up [home Wi‑Fi and network security](/services/home-network/), photograph homes for listings, take family portraits, and give households a plain-English second opinion through [tech consulting](/services/tech-consulting/).',
  },
  {
    q: 'Is there anything you don’t do?',
    a: [
      'We don’t install security cameras or alarm systems. Texas requires a DPS Private Security license for that work, and we don’t hold one. Hire a licensed company — you can check any installer at [tops.portal.texas.gov](https://tops.portal.texas.gov/).',
      'We also don’t do electrical work such as new power circuits; that needs an electrician. Our cabling is office network cabling for computers, phones and Wi‑Fi.',
    ],
  },
];

export default function home() {
  const john = REVIEWS.find((r) => r.name === 'John D.');
  const jane = REVIEWS.find((r) => r.name === 'Jane S.');
  const reviews = [john, jane].filter(Boolean);

  const areaItems = AREAS.map((a) => ({ slug: a.slug, city: a.city, county: a.county, drive: driveLabel(a.slug) }));

  return {
    path: '/',
    title: 'Manpasand Technical Services | IT, Web & Photography in DFW',
    description:
      'Rowlett-based IT support, network security, databases, websites and photography for DFW businesses and homes. Free consult, fixed-price quotes.',
    h1: 'Technical work, done to your liking.',
    bodyClass: 'page-home',
    body: html`${pageHero({
      home: true,
      eyebrow: 'IT · Networks · Data · Web · AV · Photography',
      h1: html`Technical work, done <em>to your liking.</em>`,
      lead: 'We set up and look after the technology a small business runs on — computers, networks, Wi‑Fi, databases, websites and conference rooms — and we photograph homes, people and events. Based in Rowlett, TX, on-site across Dallas–Fort Worth.',
      facts: ['Fixed-price quotes', 'Reply in 1 business day', 'Insured', 'Confidentiality assured'],
      define: true,
      aside: homeFigure(),
    })}
${problemChips()}
${section(
  { id: 'home-services', labelledby: 'svc-h' },
  html`${sectionHead({
    num: '01', label: 'Services', id: 'svc-h',
    title: 'Eight services. One local point of contact.',
    lead: 'Hire us for a single job or for the whole setup. Every project starts with a free consultation and a written, fixed-price quote.',
    more: { href: '/services/', label: 'See all services' },
  })}
${serviceCards()}`,
)}
${section(
  { alt: true, labelledby: 'how-h' },
  html`${sectionHead({
    num: '02', label: 'How we work', id: 'how-h',
    title: 'Clear terms, in writing, before any work starts.',
    lead: 'A one-hour network fix and a month-long database project run the same way: free consultation, written scope, one price, and a guarantee on the work.',
  })}
${commitments()}`,
)}
${section(
  { id: 'home-reviews', labelledby: 'rev-h', cls: 'hm-reviews' },
  html`${sectionHead({
    num: '03', label: 'Client reviews', id: 'rev-h',
    title: html`What two clients <em>told us.</em>`,
    lead: 'Quoted word for word. We don’t use star ratings.',
    more: { href: '/reviews/', label: 'Read the reviews page' },
  })}
<div class="split split--6-6 split--stretch hm-quotes">
  ${reviews.map((r) => reviewCard(r))}
</div>`,
)}
${section(
  { alt: true, id: 'home-work', labelledby: 'work-h', cls: 'hm-work' },
  html`${sectionHead({
    num: '04', label: 'Work you can check', id: 'work-h',
    title: html`Our first version, <em>then our rebuild.</em>`,
    lead: 'We built the first website for Mahnken Painting & More, a Rowlett painter, in October 2025. In November 2026 we rebuilt it from scratch. The case study shows what we got wrong the first time and what changed.',
  })}
<div class="split split--7-5 split--stretch">
  ${caseCard({
    title: 'Mahnken Painting & More website',
    text: 'Our one-page site became a full website: seven service pages, six city pages, a photo gallery and a working estimate form. Before anything goes live, the build checks every page, so a broken link or missing photo can’t be published.',
    href: '/work/mahnken-painting-website/',
    site: 'https://mahnkenpainting.com',
  })}
  ${measureCard()}
</div>`,
)}
${section(
  { id: 'home-areas', labelledby: 'area-h', cls: 'hm-areas' },
  html`${sectionHead({
    num: '05', label: 'Service area', id: 'area-h',
    title: html`Based in Rowlett. <em>On-site across DFW.</em>`,
    lead: 'We come to homes and offices across the Dallas–Fort Worth metroplex. Database and web projects can run remotely, wherever you are.',
    more: { href: '/service-areas/', label: 'All service areas' },
  })}
${areaCards(areaItems)}
<div class="hm-more-areas">
  <p class="label" id="more-areas-h">Also on-site in</p>
  <div aria-labelledby="more-areas-h">${chips(MORE_AREAS.map((c) => ({ label: c })), { arrow: false, cls: 'chips--area' })}</div>
</div>`,
)}
${section(
  { alt: true, id: 'home-guides', labelledby: 'guides-h' },
  html`${sectionHead({
    num: '06', label: 'Guides', id: 'guides-h',
    title: html`Plain-English guides, <em>free to read.</em>`,
    lead: 'Answers to common small-business and home tech questions, with sources you can check.',
    more: { href: '/guides/', label: 'All guides' },
  })}
${guideCards(GUIDES, (g) => ({ updated: guideUpdated(g.slug) }))}`,
)}
${ctaBand({ num: '07' })}
${faqSection({
  num: '08',
  id: 'home-faq',
  faqs: FAQS,
  lead: 'Something not covered here? Call or email us.',
  more: { href: '/faq/', label: 'All FAQs' },
})}`,
  };
}
