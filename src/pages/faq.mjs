// /faq/ — business-process questions only (seo-map.json: service-specific Q&As live on
// their service pages). Every answer uses only facts in src/site.mjs / brief.md. Questions
// we can't answer honestly yet (payment methods, deposits, travel fees, after-hours rates)
// are deliberately left out — see the "Don’t see your question?" note instead.
import { html } from '../lib/html.mjs';
import { pageHero, directLine, label, ctaBand, cameraDisclosure, more, two, faqList } from '../lib/components.mjs';
import { faqQuestions } from '../lib/schema.mjs';
import { SITE, telHref, mailHref } from '../site.mjs';

const PATH = '/faq/';
const H = SITE.hours.label; // Mon–Fri, 9 AM – 5 PM Central

// The camera/alarm disclosure, worded exactly as compliance requires (also rendered as
// the shared callout inside the answer, so the visible wording is the component's).
const CAMERA_TEXT =
  'We don’t install security cameras or alarm systems. Texas requires a DPS Private Security license for that work, and we don’t hold one. Hire a licensed company — you can check any installer at tops.portal.texas.gov.';

// a: inline-markdown string or array of paragraphs. body: optional html that replaces
// the rendered answer (the schema still uses `a`).
const GROUPS = [
  {
    id: 'getting-started',
    title: 'Getting started & quotes',
    faqs: [
      {
        q: 'How do I get started?',
        a: [
          `Call [${SITE.phone}](${telHref}), email [${SITE.email}](${mailHref}) or use the [contact form](/contact/). Tell us what you’re working with and what’s going wrong, or what you’d like to build.`,
          'We reply within one business day and set up a free initial consultation.',
        ],
      },
      {
        q: 'Is the first consultation really free?',
        a: 'Yes. The initial consultation costs nothing and doesn’t commit you to anything. We use it to understand the problem, look at what you already have and work out what the job involves.',
      },
      {
        q: 'How does a fixed-price quote work?',
        a: [
          'After the consultation we write up a scope of work: what we’ll do, what’s included and what isn’t. You get one fixed price for that written scope before any work begins. If Texas sales tax applies, it’s shown as its own line on the quote. No hidden fees.',
          'Nothing starts until you’ve read the scope and agreed to it. The [terms of service](/terms/#quotes-and-scope) explain how the scope and price fit together.',
        ],
      },
      {
        q: 'Do you work with businesses, homes or both?',
        a: [
          'Both. For small businesses we handle office IT and point-of-sale systems, network security, conference rooms, SQL databases, websites and photography.',
          'For homes we set up whole-home Wi‑Fi and a locked-down home network, take family photos and give plain-English tech advice. [See every service](/services/).',
        ],
      },
    ],
  },
  {
    id: 'scheduling-and-support',
    title: 'Scheduling & support',
    faqs: [
      {
        q: 'What are your hours?',
        a: `${H}. That’s US Central Time, the same as Dallas–Fort Worth. Messages that arrive outside those hours are answered on the next business day.`,
      },
      {
        q: 'How quickly will you reply?',
        a: [
          'Every message gets a reply within one business day. Critical support requests are acknowledged within two hours during business hours.',
          'Acknowledged means a person has your request and is working out the next step with you. It doesn’t mean every problem is fixed within two hours.',
        ],
      },
      {
        q: 'What counts as a critical support request?',
        a: [
          'Something that stops your business from working: the office network is down, the point-of-sale system won’t take payments, a database or website is offline, or you think someone has broken into your systems.',
          `For anything critical, call [${SITE.phone}](${telHref}) rather than emailing, and say it’s critical.`,
        ],
      },
      {
        q: 'Do you work on-site or remotely?',
        a: 'Both. We come on-site across the Dallas–Fort Worth metroplex. Database and web work can also be done remotely, wherever you are.',
      },
      {
        q: 'Which areas do you cover on-site?',
        a: 'We’re based in Rowlett, TX 75088 and work on-site across Dallas–Fort Worth, including Rowlett, Rockwall, Garland, Sachse, Richardson and Plano. [See all service areas](/service-areas/).',
      },
    ],
  },
  {
    id: 'services-and-limits',
    title: 'Services & limits',
    faqs: [
      {
        q: 'Do you install security cameras or alarm systems?',
        a: [CAMERA_TEXT, 'That also rules out video doorbells, smart locks and access control. What we can do is put smart TVs, speakers, thermostats and printers on their own separate network, so they can’t reach your computers.'],
        body: html`${cameraDisclosure()}<p>That also rules out video doorbells, smart locks and access control. What we can do is put smart TVs, speakers, thermostats and printers on their own separate network, so they can’t reach your computers. See <a href="/services/network-security/">network security</a> and <a href="/services/home-network/">home networks</a>.</p>`,
      },
      {
        q: 'Where are your photos taken from?',
        a: 'From the ground. Our [photography](/services/photography/) covers interiors and exteriors shot from inside the home and from the yard or street, plus headshots, events, family portraits and products. We don’t offer overhead shots from above the property.',
      },
      {
        q: 'What if we think we’ve been hacked?',
        a: [
          `Call [${SITE.phone}](${telHref}) and say it’s critical. We help you contain the problem, restore what you need, review the logs and close the gap that let it in.`,
          'If personal information may have been exposed, Texas law sets notification deadlines. Our [Texas data breach guide](/guides/texas-data-breach-notification/) explains them.',
        ],
      },
      {
        q: 'How do you handle confidential information?',
        a: 'Confidentiality is one of our commitments. Anything we see while working for you — files, passwords, customer records, the inside of your office or home — stays between us and is used only to do the work you asked for. If you need a signed confidentiality agreement, raise it at the consultation.',
      },
    ],
  },
  {
    id: 'pricing-and-guarantee',
    title: 'Pricing & guarantee',
    faqs: [
      {
        q: 'Will the price change after work starts?',
        a: 'Not for the written scope: the price we quoted is the price for that work. If you ask for something outside the scope, we talk it through and agree the addition with you before doing it.',
      },
      {
        q: 'What does the 14-day workmanship guarantee cover?',
        a: 'If a defect in our work turns up within the original written scope, we fix it at no cost, as long as you report it within 14 days of project completion. [Read the guarantee terms](/terms/#guarantee).',
      },
      {
        q: 'How do I report a problem under the guarantee?',
        a: `Call [${SITE.phone}](${telHref}) or email [${SITE.email}](${mailHref}) within 14 days of project completion. Tell us which project it is, what isn’t working and when you noticed it. We reply within one business day.`,
      },
      {
        q: 'Is equipment made by other companies covered?',
        a: 'Our guarantee covers our workmanship. Routers, access points, displays, software and other products made by other companies carry their manufacturers’ warranties. If the fault is in how we set something up, that’s ours to fix.',
      },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.faqs);

export default function faq() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'FAQ', href: PATH },
  ];
  let n = 1;
  const groups = GROUPS.map((g, gi) => {
    const start = n;
    n += g.faqs.length;
    return { ...g, num: two(gi + 1), start, end: n - 1 };
  });

  return {
    path: PATH,
    title: 'FAQ: Quotes, Scheduling, Support & Guarantee | Manpasand',
    description:
      'Straight answers on how quotes work, where we travel, response times, remote vs on-site work, confidentiality and our 14-day workmanship guarantee.',
    h1: 'Frequently asked questions',
    crumbs,
    pageType: 'FAQPage',
    mainEntity: faqQuestions(ALL),
    updated: '2026-11-03',
    bodyClass: 'page-faq',
    body: html`${pageHero({
      crumbs,
      eyebrow: 'FAQ',
      h1: html`Frequently asked <em>questions</em>`,
      lead: 'Straight answers about how quotes work, when we’re available, what we do and don’t do, and what the workmanship guarantee covers. Questions about a specific service are answered on [that service’s page](/services/).',
      facts: ['Free consultation', 'Fixed-price quotes', 'Reply in 1 business day', '14-day guarantee'],
      aside: directLine(),
    })}
<section class="section faqp" aria-label="Questions and answers">
  <div class="wrap faq-grid">
    <div class="faq-intro faqp-intro">
      ${label({ text: `${ALL.length} questions · 4 topics`, id: 'faqp-topics' })}
      <nav class="faqp-nav" aria-labelledby="faqp-topics">
        <ol>${groups.map((g) => html`<li><a href="#${g.id}"><span class="label">§ ${g.num}</span><span class="faqp-nav-t">${g.title}</span><span class="label faqp-nav-n">Q.${two(g.start)}–${two(g.end)}</span></a></li>`)}</ol>
      </nav>
      <div class="faqp-ask">
        <p class="faqp-ask-t">Don’t see your question?</p>
        <p>Payment options, travel, a particular device — call or email and ask. We reply within one business day.</p>
        ${more({ href: '/contact/', label: 'Contact us' })}
      </div>
    </div>
    <div class="faqp-groups">
      ${groups.map((g) => html`<section class="faqp-group" id="${g.id}" aria-labelledby="${g.id}-h">
        ${label({ num: g.num, text: `${g.faqs.length} questions` })}
        <h2 id="${g.id}-h">${g.title}</h2>
        ${faqList(g.faqs, { openFirst: g.start === 1, start: g.start })}
      </section>`)}
    </div>
  </div>
</section>
${ctaBand({ num: '05' })}`,
  };
}
