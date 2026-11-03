// /service-areas/ hub + the 6 city pages (content: src/content/areas/<slug>.json).
// Copy comes verbatim from the fact-checked content files; this module only lays it out.
import { readFileSync } from 'node:fs';
import { html } from '../lib/html.mjs';
import { SITE, AREAS, MORE_AREAS, serviceBySlug } from '../site.mjs';
import {
  pageHero, section, sectionHead, readoutCard, prose, toc, relatedLinks, areaCards, chips,
  problemChips, ctaBand, faqSection, directLine, plate, label, two, accent, driveMinutes,
} from '../lib/components.mjs';
import { fig } from '../lib/figures.mjs';
import { serviceNode, faqNode, itemListNode, cityNode } from '../lib/schema.mjs';

const load = (slug) => JSON.parse(readFileSync(new URL(`../content/areas/${slug}.json`, import.meta.url), 'utf8'));

const H1_ACCENT = {
  'rowlett-tx': 'right here in Rowlett',
  'rockwall-tx': 'Rockwall businesses and homes',
  'garland-tx': 'Garland’s small businesses',
  'sachse-tx': 'Sachse homes and businesses',
  'richardson-tx': 'Richardson offices and home offices',
  'plano-tx': 'home Wi‑Fi help in Plano',
};

const driveFact = (c) => c.facts.find((x) => /^Drive from Rowlett/i.test(x.label));

// ─── city page ───────────────────────────────────────────────────────────────────
function cityPage(area) {
  const c = load(area.slug);
  const path = `/service-areas/${area.slug}/`;
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Service areas', href: '/service-areas/' },
    { label: `${c.city}, TX`, href: path },
  ];
  const mins = driveMinutes(c);
  const nSec = c.sections.length;
  const sServices = two(nSec + 1);
  const sCta = two(nSec + 2);
  const sFaq = two(nSec + 3);

  const nearby = c.nearby.map((slug) => {
    const a = AREAS.find((x) => x.slug === slug);
    return { href: `/service-areas/${slug}/`, label: a.city };
  });

  const body = html`${pageHero({
    crumbs,
    eyebrow: c.eyebrow,
    h1: accent(c.h1, H1_ACCENT[area.slug]),
    lead: c.lede,
    aside: readoutCard({ city: c.city, facts: c.facts, drive: mins ? `About ${mins} min` : undefined }),
  })}
${section(
  { cls: 'area-detail' },
  html`<div class="guide-grid">
  <div>${prose(c.sections)}</div>
  <aside class="guide-aside" aria-label="On this page and contact">
    ${toc(c.sections)}
    ${directLine({ compact: true })}
  </aside>
</div>`,
)}
${section(
  { alt: true, labelledby: 'here-h', cls: 'area-services' },
  html`${sectionHead({ num: sServices, label: 'Services', id: 'here-h', title: `How we can help in ${c.city}`, lead: 'Every visit starts with a free consultation and a fixed-price quote in writing.', more: { href: '/services/', label: 'All eight services' } })}
${relatedLinks(
  c.services.map((s) => {
    const svc = serviceBySlug(s.slug);
    return { href: `/services/${svc.slug}/`, title: svc.name, text: s.text, slug: svc.slug };
  }),
  { label: `Services in ${c.city}` },
)}`,
)}
${problemChips({ label: 'Nearby service areas', items: [...nearby, { href: '/service-areas/', label: 'All service areas' }], id: 'near-h' })}
${ctaBand({ num: sCta, lead: `Working in ${c.city}? You’ll get a written scope of work and a fixed-price quote before anything begins, and a reply within one business day.` })}
${faqSection({ num: sFaq, faqs: c.faqs, title: `Questions about ${c.city}`, lead: 'Something not covered here? Call or email us.', more: { href: '/faq/', label: 'All FAQs' } })}`;

  return {
    path,
    title: c.title,
    description: c.description,
    h1: c.h1,
    crumbs,
    bodyClass: 'page-area',
    about: cityNode(c.city),
    schema: [
      serviceNode({ name: `IT support in ${c.city}, TX`, serviceType: 'IT support', description: c.description, path, city: c.city }),
      faqNode(c.faqs, path),
    ],
    body,
  };
}

// ─── hub ─────────────────────────────────────────────────────────────────────────
/** Fig. — drive times from Rowlett (verified "Drive from Rowlett" facts, no traffic). */
function drivePlate(rows) {
  const x0 = 132;
  const scale = 300 / Math.max(...rows.map((r) => r.mins));
  const top = 88;
  const gap = 46;
  const h = top + gap * (rows.length - 1) + 64;
  const art = `${fig.crop(480, h)}
<path class="fig-ink" d="M${x0} 58V${h - 40}"/><circle class="fig-ink" cx="${x0}" cy="46" r="10"/><circle class="fig-fill" cx="${x0}" cy="46" r="3"/>
${fig.text(x0 + 18, 46, 'ROWLETT · HOME BASE')}
${rows
  .map((r, i) => {
    const y = top + gap * i;
    const x2 = Math.round(x0 + r.mins * scale);
    return `${fig.text(x0 - 14, y, r.city.toUpperCase(), 'end')}${fig.dim(x0, x2, y, `${r.mins} MIN`)}<rect class="fig-node" x="${x2 - 6}" y="${y - 6}" width="12" height="12"/>`;
  })
  .join('\n')}
${fig.text(x0, h - 26, 'MINUTES BY CAR, NO TRAFFIC')}`;
  return plate({
    n: '—',
    caption: 'Drive from Rowlett',
    id: 'fig-drive',
    viewBox: `0 0 480 ${h}`,
    desc: `Drive from Rowlett without traffic: ${rows.map((r) => `${r.city}, ${r.fact.replace(/^About/, 'about')}`).join('; ')}.`,
    art,
    cls: 'plate--drive',
  });
}

function hubPage() {
  const path = '/service-areas/';
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Service areas', href: path },
  ];
  const cities = AREAS.map((a) => {
    const c = load(a.slug);
    const mins = driveMinutes(c);
    return { ...a, c, mins, summary: c.summary, drive: mins ? `About ${mins} min` : 'Home base' };
  });
  const rows = cities.filter((x) => x.mins).sort((a, b) => a.mins - b.mins).map((x) => ({ city: x.city, mins: x.mins, fact: driveFact(x.c).value }));

  const onsite = ['small-business-it', 'network-security', 'conference-room-av', 'home-network', 'photography', 'tech-consulting'];
  const remote = ['database-consulting', 'web-development'];

  const body = html`${pageHero({
    crumbs,
    eyebrow: 'Service areas · DFW',
    h1: html`Where <em>we work</em>`,
    lead: `We’re based in ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}. We visit homes and offices across Dallas–Fort Worth, and database and web projects can be done remotely, wherever you are.`,
    facts: [`Based in Rowlett, TX ${SITE.address.postal}`, 'On-site across DFW', 'Remote: database & web', SITE.hours.short],
    aside: drivePlate(rows),
  })}
${section(
  { id: 'cities', labelledby: 'cities-h' },
  html`${sectionHead({ num: '01', label: 'Cities', id: 'cities-h', title: 'Six nearby cities, each with its own page', lead: 'Each page covers what’s local: who supplies the power, which ZIP codes and counties apply, and which of our services fit there.' })}
${areaCards(cities)}
<div class="area-more">
  ${label({ text: 'Also on-site in', id: 'more-h' })}
  <div>${chips(MORE_AREAS.map((m) => ({ label: m })), { arrow: false, cls: 'chips--area' })}<p class="area-more-note">No separate page for these cities: the same services and terms apply. Not on the list? <a href="/contact/">Ask us</a>.</p></div>
</div>`,
)}
${section(
  { id: 'onsite-remote', alt: true, labelledby: 'or-h' },
  html`${sectionHead({ num: '02', label: 'On-site vs remote', id: 'or-h', title: 'What needs a visit, and what doesn’t', lead: 'Networks, rooms and photo shoots happen where you are. Database and web work can be done from anywhere.' })}
<div class="split split--6-6 area-or">
  <div>
    <p class="area-or-h"><span class="label">On-site</span><span class="label">Dallas–Fort Worth</span></p>
    <p class="area-or-t">We come to your home or office anywhere in the metroplex for the work that depends on the building: network cabling, Wi‑Fi coverage, meeting rooms, printers and photo shoots.</p>
    ${relatedLinks(onsite, { label: 'On-site services' })}
  </div>
  <div>
    <p class="area-or-h"><span class="label">Remote</span><span class="label">Anywhere</span></p>
    <p class="area-or-t">Database and web work doesn’t depend on the building, so we can do it remotely for clients anywhere. If you’re in DFW, we can still meet on-site.</p>
    ${relatedLinks(remote, { label: 'Remote services' })}
  </div>
</div>`,
)}
${ctaBand({ num: '03', lead: `Tell us where you are and what you need. We reply within one business day, ${SITE.hours.label}.` })}`;

  return {
    path,
    title: 'Service Areas: Rowlett, Rockwall, Garland & DFW | Manpasand',
    description: 'Based in Rowlett, TX 75088. On-site visits across Dallas–Fort Worth, with remote database and web work anywhere. See the cities we cover.',
    h1: 'Where we work',
    crumbs,
    pageType: 'CollectionPage',
    bodyClass: 'page-areas',
    image: '/assets/img/og-areas.jpg',
    mainEntity: itemListNode(AREAS.map((a) => ({ name: `${a.city}, TX`, path: `/service-areas/${a.slug}/` })), path),
    body,
  };
}

export default function areas() {
  return [hubPage(), ...AREAS.map(cityPage)];
}
