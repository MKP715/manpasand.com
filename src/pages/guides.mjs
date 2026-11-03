// /guides/ hub + the 4 guides (content: src/content/guides/<slug>.json).
// Copy comes verbatim from the fact-checked content files; this module only lays it out.
import { readFileSync } from 'node:fs';
import { html } from '../lib/html.mjs';
import { GUIDES, serviceBySlug } from '../site.mjs';
import {
  pageHero, section, sectionHead, guideMeta, guideCards, keyTakeaways, prose, toc, faqList,
  callout, sourcesList, relatedLinks, directLine, ctaBand, label, chips, accent, two,
} from '../lib/components.mjs';
import { articleNode, faqNode, itemListNode, abs } from '../lib/schema.mjs';

const load = (slug) => JSON.parse(readFileSync(new URL(`../content/guides/${slug}.json`, import.meta.url), 'utf8'));
const HUB_IMAGE = '/assets/img/og-guides.jpg';
// Article images per guide (made by src/tools/images.py): 16:9, 4:3 and 1:1 versions of its card.
const articleImages = (slug) => ['-16x9', '-4x3', '-1x1'].map((s) => `/assets/img/og-guide-${slug}${s}.jpg`);
const BACK = html`<p class="back-to"><a href="#contents">Back to contents <span aria-hidden="true">↑</span></a></p>`;

const H1_ACCENT = {
  'texas-data-breach-notification': 'who to tell, and by when',
  'power-outage-protection-office-tech': 'from power outages',
  'conference-room-video-setup-checklist': 'video setup checklist',
  'prepare-home-for-real-estate-photos': 'for real estate photos',
};

/** Reading time at ~220 words a minute over everything rendered in the article. */
function readingMinutes(c) {
  let words = 0;
  const walk = (v) => {
    if (typeof v === 'string') words += v.replace(/\]\([^)]*\)/g, ']').split(/\s+/).filter(Boolean).length;
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk([c.lede, c.keyTakeaways, c.sections, c.faqs || [], c.disclaimer || '']);
  return Math.max(1, Math.round(words / 220));
}

// ─── guide page ─────────────────────────────────────────────────────────────────
function guidePage(g) {
  const c = load(g.slug);
  const path = `/guides/${g.slug}/`;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Guides', href: '/guides/' },
    { label: g.title, href: path },
  ];
  const minutes = readingMinutes(c);
  const faqs = c.faqs && c.faqs.length ? c.faqs : null;
  const tocItems = [...c.sections, ...(faqs ? [{ heading: 'Questions', id: 'faq' }] : []), { heading: 'Sources', id: 'sources' }];
  const sCta = two(c.sections.length + (faqs ? 1 : 0) + 1); // CTA continues the prose/FAQ § counter

  const body = html`${pageHero({
    crumbs,
    eyebrow: serviceBySlug(c.relatedServices[0]).name,
    h1: accent(c.h1, H1_ACCENT[g.slug]),
    lead: c.lede,
    meta: guideMeta({ updated: c.updated, minutes }),
    actions: false,
  })}
<section class="section guide-body">
  <div class="wrap guide-grid">
    <div class="guide-main">
      ${keyTakeaways(c.keyTakeaways)}
      <div class="mt-l">${prose(c.sections, { backTo: '#contents' })}</div>
      ${faqs ? html`<section class="prose prose--count guide-faq" style="counter-reset:sec ${c.sections.length}" aria-labelledby="faq">
        <h2 id="faq">Questions</h2>
        ${faqList(faqs)}
        ${BACK}
      </section>` : ''}
      ${c.disclaimer ? html`<div class="guide-disclaimer">${callout({ title: 'Before you rely on this', text: c.disclaimer })}</div>` : ''}
      ${sourcesList(c.sources)}
    </div>
    <aside class="guide-aside" aria-label="On this page and related services">
      <div class="toc-rail">${toc(tocItems, { id: 'contents' })}</div>
      <div class="guide-related">${label({ text: 'Related services' })}${relatedLinks(c.relatedServices, { label: 'Related services' })}</div>
      ${directLine({ compact: true })}
    </aside>
  </div>
</section>
${ctaBand({ num: sCta, label: 'Need a hand?', title: html`Rather have us look at it? <em>Start with a free consultation.</em>` })}`;

  return {
    path,
    title: c.title,
    description: c.description,
    h1: c.h1,
    crumbs,
    bodyClass: 'page-guide',
    ogType: 'article',
    updated: c.updated,
    about: false, // the guide is about its topic, not the business; mainEntity → the Article
    mainEntity: { '@id': `${abs(path)}#article` },
    schema: [
      articleNode({ path, headline: c.h1, description: c.description, datePublished: c.updated, dateModified: c.updated, image: articleImages(g.slug) }),
      faqs ? faqNode(faqs, path) : null,
    ].filter(Boolean),
    body,
  };
}

// ─── hub ─────────────────────────────────────────────────────────────────────────
function hubPage() {
  const path = '/guides/';
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Guides', href: path },
  ];
  const list = GUIDES.map((g) => {
    const c = load(g.slug);
    return { slug: g.slug, title: c.h1, summary: c.summary, updated: c.updated, minutes: readingMinutes(c), related: c.relatedServices };
  });

  const body = html`${pageHero({
    crumbs,
    eyebrow: `Guides · ${String(GUIDES.length).padStart(2, '0')}`,
    h1: 'Guides',
    lead: 'Plain-English guides for DFW small businesses and homeowners: Texas breach-notice rules, power-outage prep, meeting-room setup and listing-photo prep. Each one lists its sources and the date it was last updated.',
    facts: ['Sources listed', 'Updated date on each guide', 'No sign-up'],
    actions: false,
  })}
${section(
  { id: 'all', labelledby: 'g-h' },
  html`${sectionHead({ num: '01', label: 'All guides', id: 'g-h', title: 'Four practical guides, sources included.', lead: 'Read them start to finish or jump to the checklist. They’re free, and you don’t need to hire us to use them.' })}
${guideCards(list, (g) => ({ minutes: g.minutes, updated: g.updated }))}`,
)}
${section(
  { alt: true, labelledby: 'topics-h', tight: true },
  html`<div class="guides-topics">
  ${label({ num: '02', text: 'Related services', id: 'topics-h' })}
  <div>${chips([
    { href: '/services/network-security/', label: 'Network security' },
    { href: '/services/small-business-it/', label: 'Small business IT' },
    { href: '/services/conference-room-av/', label: 'Conference room AV' },
    { href: '/services/home-network/', label: 'Home Wi‑Fi' },
    { href: '/services/photography/', label: 'Photography' },
  ])}</div>
</div>`,
)}
${ctaBand({ num: '03' })}`;

  return {
    path,
    title: 'Guides: Practical Tech Advice for DFW | Manpasand',
    description: 'Plain-English guides for DFW small businesses and homeowners: Texas breach notice rules, power-outage prep, meeting-room setup and listing-photo prep.',
    h1: 'Guides',
    crumbs,
    pageType: 'CollectionPage',
    bodyClass: 'page-guides',
    image: HUB_IMAGE,
    mainEntity: itemListNode(list.map((g) => ({ name: g.title, path: `/guides/${g.slug}/` })), path),
    body,
  };
}

export default function guides() {
  return [hubPage(), ...GUIDES.map(guidePage)];
}
