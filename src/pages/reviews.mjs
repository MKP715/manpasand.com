// /reviews/ — the two real testimonials, verbatim, framed as "What two clients told us".
// No stars, no ratings, no Review/AggregateRating schema (compliance.md §6–§7).
// Jane S.'s sale-timing note renders beside her quote (reviewCard shows review.note).
// No Google Business Profile link until the profile exists.
import { html, inline } from '../lib/html.mjs';
import { REVIEWS, SITE, mailHref, serviceBySlug } from '../site.mjs';
import {
  pageHero, directLine, section, sectionHead, reviewCard, caseCard, relatedLinks, callout, ctaBand, two,
} from '../lib/components.mjs';


// Per-review presentation: topic shown in the card header and the related-service link.
const CONTEXT = {
  'database-consulting': { topic: 'Database work', link: 'About our SQL database & ETL work' },
  photography: { topic: 'Real estate photography', link: 'About our real estate photography' },
};

const POLICY = [
  {
    title: 'Real words, with permission',
    text: 'We publish only what a client actually told us, and only with their permission.',
  },
  {
    title: 'Quoted exactly',
    text: 'No trimming, no tidying, no stitching sentences together. Each quote appears exactly as the client wrote it, with their first name, last initial and role.',
  },
  {
    title: 'No stars or scores',
    text: 'Two quotes are two quotes, not an average. We don’t show star ratings, totals or badges.',
  },
  {
    title: 'Context where it matters',
    text: 'If a quote mentions a result we can’t promise, such as how quickly a home sold, we put a note beside it that says so.',
  },
];

function testimonials() {
  return html`<ol class="rv-list">${REVIEWS.map((r, i) => {
    const ctx = CONTEXT[r.service] || {};
    const svc = r.service ? serviceBySlug(r.service) : null;
    return html`<li class="rv-item">
  <p class="label rv-idx">No. ${two(i + 1)}<span>${r.name}</span></p>
  ${reviewCard(r, {
    topic: ctx.topic,
    more: svc ? { href: `/services/${svc.slug}/`, label: ctx.link || `About our ${svc.name.toLowerCase()} work` } : undefined,
  })}
</li>`;
  })}</ol>`;
}

function policy() {
  return html`<ol class="rv-policy">${POLICY.map((p, i) => html`<li>
  <p class="label">${two(i + 1)}</p>
  <div><h3>${p.title}</h3><p>${inline(p.text)}</p></div>
</li>`)}</ol>`;
}

export default function reviews() {
  const path = '/reviews/';
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Reviews', href: path }];
  const count = REVIEWS.length;
  return {
    path,
    title: 'Client Reviews & Testimonials | Manpasand',
    description:
      'What two clients told us about our database and real estate photography work, quoted word for word. No star ratings, no edits, just their words.',
    h1: 'What two clients told us',
    crumbs,
    bodyClass: 'pg-reviews',
    body: html`${pageHero({
      crumbs,
      eyebrow: 'Client reviews',
      h1: html`What two clients <em>told us</em>`,
      lead: 'Here is what two clients said about our work, quoted exactly as they wrote it, next to the service each one hired us for. No star ratings, no edits.',
      facts: [`${two(count)} testimonials`, 'Quoted word for word', 'No star ratings'],
      aside: directLine(),
    })}
${section(
  { labelledby: 'said-h' },
  html`${sectionHead({
    num: '01',
    label: 'Testimonials',
    id: 'said-h',
    title: html`In their words, <em>unedited.</em>`,
    lead: 'One small business owner on database work, and one real estate agent on listing photos.',
  })}
${testimonials()}`,
)}
${section(
  { alt: true, labelledby: 'policy-h' },
  html`${sectionHead({
    num: '02',
    label: 'Our approach',
    id: 'policy-h',
    title: html`How we handle <em>reviews.</em>`,
    lead: 'Testimonials only help you if you can trust them. These are the rules we follow for every quote on this site.',
  })}
<div class="split split--7-5 rv-policy-grid">
  ${policy()}
  ${callout({
    title: 'Where can I leave a review?',
    body: html`<p>Our Google Business Profile isn’t live yet. Once it is, we’ll link it here so you can leave a review there.</p>
<p>Until then, you can send comments to <a href="${mailHref}">${SITE.email}</a>. We’ll ask before quoting you anywhere.</p>`,
    cls: 'rv-leave',
  })}
</div>`,
)}
${section(
  { labelledby: 'check-h' },
  html`${sectionHead({
    num: '03',
    label: 'Work you can check',
    id: 'check-h',
    title: html`A testimonial is one view. <em>A live site is another.</em>`,
    lead: 'Open the website we built and judge it yourself, or read more about the work behind each quote.',
  })}
<div class="split split--7-5 split--stretch">
  ${caseCard({
    title: 'Mahnken Painting & More website',
    text: 'We built the first version of this Rowlett painter’s website in October 2025, then rebuilt it in November 2026 as a multi-page static site. Its build stops on broken links, missing images or duplicate page titles before anything is published.',
    href: '/work/mahnken-painting-website/',
    site: 'https://mahnkenpainting.com',
  })}
  <div class="rv-related">
    ${relatedLinks(
      [
        'database-consulting',
        'photography',
        { href: '/work/', title: 'All our work', text: 'Projects we can show you in full, with what we did and why.', icon: 'layers' },
      ],
      { label: 'Related services and work' },
    )}
  </div>
</div>`,
)}
${ctaBand({ num: '04' })}`,
  };
}
