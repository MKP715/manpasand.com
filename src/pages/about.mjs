// /about/ — who Manpasand is, from the brief's facts only (name, what we do, Rowlett base,
// how we work). No biography, years, credentials, team size or client counts.
// Sections: hero (definition + direct line) · §01 who we are · §02 #why-us ·
// §03 #commitments · §04 what we don't do · §05 work you can check · §06 CTA band.
import { html, inline } from '../lib/html.mjs';
import { servicesByGroup } from '../site.mjs';
import { BIZ_ID } from '../lib/schema.mjs';
import {
  pageHero, directLine, section, sectionHead, commitments, cameraDisclosure, callout,
  relatedLinks, ctaBand, icon, two,
} from '../lib/components.mjs';


// What each service group covers (plain description; service names/links come from SERVICES).
const GROUP_COPY = {
  it: {
    title: 'Offices, meeting rooms and homes',
    text: 'We set up and look after the computers, networks, Wi‑Fi and POS systems a small business runs on, get meeting rooms ready for video calls, and secure home networks.',
  },
  'data-web': {
    title: 'Databases, websites and plans',
    text: 'We design and tune SQL Server, PostgreSQL and MySQL databases, move data with ETL, build websites and web apps, and help you plan what to buy next.',
  },
  photo: {
    title: 'Listings, people and events',
    text: 'We photograph homes for sale, inside and out, plus headshots, corporate events, family portraits and products.',
  },
};

const WHY = [
  {
    icon: 'pin',
    key: 'Local',
    title: 'Based in Rowlett',
    text: 'We work on-site across Dallas–Fort Worth, Monday to Friday. Database and web projects can be handled remotely, wherever you are. See our [service areas](/service-areas/).',
  },
  {
    icon: 'chat',
    key: 'One contact',
    title: 'One point of contact',
    text: 'The same business can handle your network, your database, your website and your photos. You explain your setup once, not to three different vendors.',
  },
  {
    icon: 'book',
    key: 'Plain words',
    title: 'Plain explanations',
    text: 'We tell you what we found, what we changed and what the trade-offs are, in words you don’t have to look up afterwards.',
  },
  {
    icon: 'file',
    key: 'In writing',
    title: 'Written quotes',
    text: 'Before any work begins you get a written scope of work and a fixed-price quote, with any Texas sales tax shown as its own line. No hidden fees.',
  },
];

const DONT = [
  cameraDisclosure(),
  callout({
    title: 'Photos from the ground only',
    text: 'Every photo we take, inside and out, is taken from the ground: from the street, the driveway, the yard and the back patio. That’s where buyers stand at a showing, too.',
  }),
  callout({
    title: 'Smart devices: the network only',
    text: 'Our smart-home work stays at the network level. We put TVs, speakers, thermostats and printers on their own network, walled off from your computers. See [home network & Wi‑Fi security](/services/home-network/).',
  }),
];

function groups() {
  return html`<ul class="ab-groups">${servicesByGroup().map((g) => {
    const c = GROUP_COPY[g.key];
    return html`<li class="ab-group">
  <p class="label"><span>${g.label}</span><span>${two(g.services.length)}</span></p>
  <h3>${c.title}</h3>
  <p>${c.text}</p>
  <ul class="ab-links" aria-label="${g.label} services">${g.services.map((s) => html`<li><a href="/services/${s.slug}/"><span>${s.name}</span>${icon('arrow', { size: 16, cls: 'go' })}</a></li>`)}</ul>
</li>`;
  })}</ul>`;
}

function why() {
  return html`<ul class="ab-why">${WHY.map((w, i) => html`<li>
  <p class="label"><span>${two(i + 1)} · ${w.key}</span><span class="ab-why-ic">${icon(w.icon, { size: 20 })}</span></p>
  <h3>${w.title}</h3>
  <p>${inline(w.text)}</p>
</li>`)}</ul>`;
}

export default function about() {
  const path = '/about/';
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'About', href: path }];
  return {
    path,
    title: 'About Us: Rowlett-Based Tech Services | Manpasand',
    description:
      'Manpasand means “to one’s liking.” How we work: free consults, fixed-price quotes, plain explanations and a 14-day workmanship guarantee.',
    h1: 'About Manpasand',
    crumbs,
    pageType: 'AboutPage',
    mainEntity: { '@id': BIZ_ID },
    bodyClass: 'pg-about',
    body: html`${pageHero({
      crumbs,
      eyebrow: 'About · Rowlett, TX',
      h1: html`About <em>Manpasand</em>`,
      lead: 'Manpasand Technical Services is based in Rowlett, TX 75088. We set up and look after the technology small businesses and homes run on, build databases and websites, and take photographs, on-site across Dallas–Fort Worth.',
      define: true,
      aside: directLine(),
    })}
${section(
  { alt: true, labelledby: 'who-h' },
  html`${sectionHead({
    num: '01',
    label: 'Who we are',
    id: 'who-h',
    title: html`Technology and photography, <em>from one local business.</em>`,
    lead: '“Manpasand” is an Urdu and Hindi word for something well-liked, or to one’s liking. We treat it as the test for each job: the network, database, website or photo set should end up the way you wanted it, and you should understand what you paid for.',
    more: { href: '/services/', label: 'See all services' },
  })}
${groups()}`,
)}
${section(
  { id: 'why-us', labelledby: 'why-h' },
  html`${sectionHead({
    num: '02',
    label: 'Why us',
    id: 'why-h',
    title: html`Local, one contact, and <em>everything in writing.</em>`,
    lead: 'Four things you can expect whichever service you hire us for.',
  })}
${why()}`,
)}
${section(
  { id: 'commitments', alt: true, labelledby: 'terms-h' },
  html`${sectionHead({
    num: '03',
    label: 'How we work',
    id: 'terms-h',
    title: html`Four commitments, <em>stated up front.</em>`,
    lead: 'A free consultation first, a fixed price before work starts, a reply within one business day, and a 14-day workmanship guarantee on the original scope. The guarantee has written terms, so you know exactly what it covers.',
    more: { href: '/terms/#guarantee', label: 'Read the guarantee terms' },
  })}
${commitments()}`,
)}
${section(
  { labelledby: 'dont-h' },
  html`${sectionHead({
    num: '04',
    label: 'What we don’t do',
    id: 'dont-h',
    title: html`Where our work <em>stops.</em>`,
    lead: 'Knowing this up front saves you a call. If your project needs one of these, we’ll say so at the consultation.',
  })}
<div class="ab-dont">${DONT}</div>`,
)}
${section(
  { alt: true, tight: true, labelledby: 'check-h' },
  html`${sectionHead({
    num: '05',
    label: 'Check for yourself',
    id: 'check-h',
    title: html`Work and words <em>you can check.</em>`,
    cls: 'sec-head--compact',
  })}
<div class="ab-check">${relatedLinks(
    [
      { href: '/work/mahnken-painting-website/', title: 'Mahnken Painting & More website', text: 'A Rowlett painter’s website: our first version in October 2025, and our rebuild in November 2026.', icon: 'layers' },
      { href: '/reviews/', title: 'What two clients told us', text: 'Two testimonials, quoted word for word, with no star ratings.', icon: 'quote' },
      { href: '/service-areas/', title: 'Where we work', text: 'Rowlett, Rockwall, Garland, Sachse, Richardson, Plano and the rest of Dallas–Fort Worth.', icon: 'pin' },
      { href: '/contact/', title: 'Talk to us', text: 'Book a free consultation by phone, email or the contact form.', icon: 'mail' },
    ],
    { label: 'Our work, reviews and service areas' },
  )}</div>`,
)}
${ctaBand({ num: '06' })}`,
  };
}

