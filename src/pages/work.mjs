// /work/ (portfolio hub) and /work/mahnken-painting-website/ (case study).
//
// Every fact about the Mahnken project comes from the Mahnken repo and lab measurements
// taken 2026-11-03. Rules that shape the copy:
//   - Manpasand built BOTH versions: frame it as "our first version → our rebuild".
//   - The client's own claims (years, insurance, EPA RRP, chamber) are attributed to
//     the client, never stated as our facts. v1's removed claims are not repeated, and the
//     old-site screenshots have their badge and banner text blurred.
//   - Metrics are lab measurements, not field data; no traffic/lead/ranking claims.
//   - No Review / AggregateRating markup. Case study = Article; hub = CollectionPage.

import { html, inline } from '../lib/html.mjs';
import { picture, img } from '../lib/assets.mjs';
import { articleNode, itemListNode } from '../lib/schema.mjs';
import {
  pageHero, directLine, section, sectionHead, caseCard, relatedLinks, steps, more, btn,
  ctaBand, faqSection, table, callout, sourcesList, paragraphs, icon, guideMeta,
} from '../lib/components.mjs';
import { GROUPS } from '../site.mjs';

const CASE_PATH = '/work/mahnken-painting-website/';
const CLIENT = 'Mahnken Painting & More';
const CLIENT_URL = 'https://mahnkenpainting.com/';
const PUBLISHED = '2026-11-03';
const UPDATED = PUBLISHED; // change when the write-up is revised (also switch the hero meta to "Updated")

// ─── local helpers (candidates for components.mjs) ─────────────────────────────

/** Screenshot inside a plate frame, at its natural aspect ratio, with an optional caption. */
function shot(key, { bar = [], note, sizes = '(min-width: 961px) 560px, 100vw', eager = false, cls = '' } = {}) {
  const m = img(key);
  return html`<figure class="plate exhibit wk-shot${cls ? ` ${cls}` : ''}">
  <p class="plate-bar"><span class="label">${bar[0] || 'Plate'}</span>${bar[1] ? html`<span class="label">${bar[1]}</span>` : ''}</p>
  <div class="exhibit-img" style="aspect-ratio:${m.width}/${m.height}">${picture(key, { sizes, eager })}</div>
  ${note ? html`<figcaption>${inline(note)}</figcaption>` : ''}
</figure>`;
}

/** Lettered points: A, B, C … each with an h3 and one or more paragraphs. */
function points(items, { level = 3 } = {}) {
  return html`<ol class="wk-points">${items.map(
    (p, i) => html`<li>
  <p class="label wk-key" aria-hidden="true">${String.fromCharCode(65 + i)}</p>
  <div>${level === 3 ? html`<h3>${p.title}</h3>` : html`<h4>${p.title}</h4>`}${paragraphs(Array.isArray(p.text) ? p.text : [p.text])}</div>
</li>`,
  )}</ol>`;
}

/** Before → after readout cells. items: [{ label, before, after, note }]. */
function metrics(items) {
  return html`<dl class="wk-metrics">${items.map(
    (m) => html`<div>
  <dt>${m.label}</dt>
  <dd><span class="wk-b"><span class="sr-only">Before: </span>${m.before}</span>${icon('arrow', { size: 20, cls: 'wk-arr' })}<span class="wk-a"><span class="sr-only">after: </span>${m.after}</span></dd>
  ${m.note ? html`<dd class="wk-note">${m.note}</dd>` : ''}
</div>`,
  )}</dl>`;
}

/** Project-file card for the case-study hero (reuses the city readout styles). */
function projectCard(rows) {
  return html`<aside class="readout wk-file" aria-label="Project file">
  <p class="plate-bar"><span class="label">Project file</span><span class="label">2025 → 2026</span></p>
  <dl class="readout-dl">${rows.map((r) => html`<div${r.wide ? html` class="wk-wide"` : ''}><dt>${r.label}</dt><dd>${inline(r.value)}</dd></div>`)}</dl>
  <p class="direct-base">${more({ href: CLIENT_URL, label: 'mahnkenpainting.com', newTab: true })}</p>
</aside>`;
}

// ─── shared facts (facts.md §2) ────────────────────────────────────────────────
const HEADLINE_METRICS = [
  { label: 'Indexable pages', before: '1', after: '22', note: 'Separate pages search engines can list' },
  { label: 'Home page, first load', before: '1.39 MB', after: '218 KB', note: '20 requests → 9 (desktop, main frame)' },
  { label: 'Third-party hosts on load', before: '24', after: '0', note: 'Outside servers contacted by the home page' },
  { label: 'Lighthouse mobile, Performance', before: '55', after: '95', note: 'Lab run on a local server' },
];

// ─── /work/ hub ────────────────────────────────────────────────────────────────
const KINDS = {
  it: [
    { href: '/services/small-business-it/', slug: 'small-business-it', title: 'Shop and office IT, set up and looked after', text: 'POS terminals, receipt printers, PCs and the office network, plus on-demand support.' },
    { href: '/services/network-security/', slug: 'network-security', title: 'An office network split in three', text: 'Staff, guest and smart-device Wi‑Fi kept apart behind a firewall.' },
    { href: '/services/conference-room-av/', slug: 'conference-room-av', title: 'A meeting room ready for video calls', text: 'Camera, microphones and display set up for Teams, Zoom or Meet.' },
    { href: '/services/home-network/', slug: 'home-network', title: 'Whole-home Wi‑Fi with a device network', text: 'Mesh Wi‑Fi, a locked-down router, and TVs, speakers and thermostats on their own network.' },
  ],
  'data-web': [
    { href: '/services/database-consulting/', slug: 'database-consulting', title: 'A slow database tuned, or a nightly load built', text: 'SQL Server, PostgreSQL or MySQL design, tuning and ETL, on-site or remote.' },
    { href: '/services/web-development/', slug: 'web-development', title: 'A small-business website, built or rebuilt', text: 'Fast multi-page sites like the Mahnken rebuild, WordPress sites and online stores.' },
    { href: '/services/tech-consulting/', slug: 'tech-consulting', title: 'A second opinion and a written plan', text: 'A plain-English review of your tech, vendors and spending, before you buy.' },
  ],
  photo: [
    { href: '/services/photography/', slug: 'photography', title: 'Listing photos for a home sale', text: 'Ground-level interior and exterior photos for real estate listings.' },
    { href: '/services/photography/', slug: 'photography', title: 'Headshots, events, portraits and products', text: 'Team headshots, corporate events, family portraits and product photos.' },
    { href: '/guides/prepare-home-for-real-estate-photos/', icon: 'book', title: 'Selling soon? Prep the house first', text: 'Our room-by-room checklist for sellers and agents.' },
  ],
};

const KIND_LEADS = {
  it: 'Computers, networks, Wi‑Fi and meeting rooms for small offices, shops and homes.',
  'data-web': 'Databases, websites and planning. Database and web work can be done remotely, wherever you are.',
  photo: 'Homes, people, events and products, photographed at ground level across DFW.',
};

function hub() {
  const path = '/work/';
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Work', href: path }];
  return {
    path,
    title: 'Our Work: Websites & Projects | Manpasand',
    description:
      'Real projects, described plainly: what the client needed, what we built and how it runs today. Start with the Mahnken Painting & More website rebuild.',
    h1: 'Our work, described plainly',
    crumbs,
    pageType: 'CollectionPage',
    mainEntity: itemListNode([{ name: `${CLIENT} website`, path: CASE_PATH }], path),
    updated: PUBLISHED,
    bodyClass: 'page-work',
    body: html`${pageHero({
      crumbs,
      eyebrow: 'Portfolio',
      h1: html`Our work, <em>described plainly</em>`,
      lead: 'These are the projects we can show in public. Today that’s one: the Mahnken Painting & More website, which we built in 2025 and rebuilt in 2026. IT and database work happens inside a client’s private systems, so most of it can’t be shown here. We’ll add projects as clients agree to be named.',
      facts: ['Live, public projects only', 'Our own measurements, dated', 'Limits stated'],
      aside: directLine(),
    })}
${section(
  { id: 'case-studies', labelledby: 'cs-h' },
  html`${sectionHead({ num: '01', label: 'Case studies', id: 'cs-h', title: html`One project, <em>written up in full</em>`, lead: 'What the client needed, what we built, what we measured and what is still open — including the mistakes in our own first version.' })}
<div class="split split--7-5 split--stretch">
  ${caseCard({
    title: `${CLIENT} website`,
    text: 'A Rowlett painter’s one-page site, rebuilt as a 24-page site (22 of them listed in search) with service pages, city pages and an estimate form. We built the first version too, and the write-up covers both.',
    href: CASE_PATH,
    site: 'https://mahnkenpainting.com',
    bar: ['Case study 01', 'Web development · 2026'],
    level: 3,
    id: 'case-mahnken-h',
  })}
  <div class="wk-glance">
    <p class="label">At a glance · lab data, Nov 3, 2026</p>
    ${metrics(HEADLINE_METRICS.slice(0, 3))}
    <p class="wk-small">Measured by us on the live site and a saved copy of the old one. These are lab numbers, not traffic or sales.</p>
  </div>
</div>
<div class="wk-next" role="note">
  <p class="label">Case study 02</p>
  <p>Not yet published. The next write-up will follow once a client agrees to be named and the work is live.</p>
</div>`,
)}
${section(
  { alt: true, id: 'kinds', labelledby: 'kinds-h' },
  html`${sectionHead({ num: '02', label: 'What we take on', id: 'kinds-h', title: 'Kinds of projects we take on', lead: 'This is the work we’re set up to do, not a list of past jobs. Each row links to the service page with what’s included and how a project runs.' })}
<div class="wk-kinds">
  ${Object.entries(GROUPS).map(
    ([key, name]) => html`<div class="wk-kind">
    <h3 id="kind-${key}">${name}</h3>
    <p class="wk-kind-lead">${KIND_LEADS[key]}</p>
    ${relatedLinks(KINDS[key], { label: name })}
  </div>`,
  )}
</div>`,
)}
${section(
  { labelledby: 'write-h' },
  html`${sectionHead({
    num: '03',
    label: 'How we write it up',
    id: 'write-h',
    title: 'Every write-up answers the same four questions',
    lead: 'Statements about a client’s business stay theirs, and we say so. For what clients told us in their own words, read [two client reviews](/reviews/).',
  })}
${steps([
  { title: 'What they needed', text: 'The client’s situation and what was wrong before we started, including our own mistakes.' },
  { title: 'What we built', text: 'Pages, features and tools, with screenshots of the live work.' },
  { title: 'What we measured', text: 'Numbers we measured ourselves, dated and labeled lab or field.' },
  { title: 'What’s still open', text: 'Limits, missing data and what we would check next.' },
])}`,
)}
${ctaBand({
  num: '04',
  title: html`Have a project in mind? <em>Start with a free consultation.</em>`,
  lead: 'Tell us what you have today and what you need. You’ll get a written scope of work and a fixed-price quote before anything begins.',
})}`,
  };
}

// ─── /work/mahnken-painting-website/ ───────────────────────────────────────────
const SOURCES = [
  { label: 'Google Search Central — URL structure: fragments', url: 'https://developers.google.com/search/docs/crawling-indexing/url-structure' },
  { label: 'Google Search Central — Meta tags Google understands (keywords meta tag)', url: 'https://developers.google.com/search/docs/crawling-indexing/special-tags' },
  { label: 'Google Search Central — Spam policies: hidden text and link abuse', url: 'https://developers.google.com/search/docs/essentials/spam-policies' },
  { label: 'Google Search Central — Review snippet structured data', url: 'https://developers.google.com/search/docs/appearance/structured-data/review-snippet' },
  { label: 'Tailwind CSS — Play CDN (“designed for development purposes only”)', url: 'https://tailwindcss.com/docs/installation/play-cdn' },
];

const CHALLENGE = [
  {
    title: 'One URL pretending to be six pages',
    text: 'Home, services, gallery, testimonials, about and contact were hidden sections of a single page, switched by script. With JavaScript off, only the home section could be reached. The sitemap listed 28 addresses, but all of them were the same page: seven #fragment links times four http/https and www variants. [Google generally doesn’t support URL fragments](https://developers.google.com/search/docs/crawling-indexing/url-structure).',
  },
  {
    title: 'More metadata than content',
    text: 'The head section took 56% of the HTML: 286 meta tags, two keyword lists with 147 terms (some for services the business doesn’t offer), seven separate structured-data blocks (one of them [rating markup Google doesn’t show for a business’s own site](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)) and two canonical tags. The footer held hidden SEO text that sighted visitors couldn’t see and screen readers skipped. [Google doesn’t use the keywords tag](https://developers.google.com/search/docs/crawling-indexing/special-tags), and its [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) name hidden text. We wrote that version, so this one is our lesson.',
  },
  {
    title: 'Everything loaded on every visit',
    text: 'Styles came from Tailwind’s Play CDN, which [Tailwind says is for development only](https://tailwindcss.com/docs/installation/play-cdn), as a render-blocking script. Fonts came from Google Fonts, and six of the seven images were hotlinked from Google Drive (the seventh from another website). Hidden sections still loaded two large gallery photos, a Google Forms iframe and TikTok and Instagram embeds.',
  },
  {
    title: 'Rough edges for visitors',
    text: 'On load, the script jumped the page 123 px, so the headline sat under the sticky header. The mobile menu controls weren’t buttons, so they didn’t work from the keyboard, and four files the page referenced didn’t exist.',
  },
];

const BUILT = [
  {
    title: '24 real pages instead of one',
    text: 'Home, a services hub with 7 service pages (interior, exterior, cabinet painting, drywall repair, deck and fence staining, wallpaper removal, commercial), a service-areas hub with 6 city pages (Rowlett, Rockwall, Garland, Sachse, Wylie, East Dallas), plus gallery, about, contact, FAQ, reviews, privacy, a color visualizer and a 404 page. 22 of them are in the sitemap, at clean addresses.',
  },
  {
    title: 'A small build that refuses to publish mistakes',
    text: 'A dependency-free Node script renders the pages to static HTML for GitHub Pages. Copy lives in JSON files, and one file holds the name, phone, email and hours. Before it writes anything, the build stops on a broken link or #anchor (checked case-sensitively, as GitHub Pages is), a missing image, a duplicated title or description, or a page without exactly one H1.',
  },
  {
    title: 'A design built around the client’s own emblem',
    text: 'The client’s pen-and-ink emblem leads the design. Fonts are self-hosted, trimmed to Latin characters and the weights the CSS uses, and preloaded, with metric-matched fallbacks so text doesn’t jump. On phones, a bar with Call, Text and Free estimate stays in reach, and steps aside near the form and footer.',
  },
];

const DETAILS = [
  {
    title: 'One structured-data graph per page, and no review markup',
    text: 'Each page carries a single JSON-LD graph (business, website, breadcrumbs, services, FAQs). There are no keyword tags, no hidden text and no rating or review markup anywhere on the site. The reviews page is built but stays out of search and the menu until the client adds reviews.',
  },
  {
    title: 'No third-party code until a visitor asks for it',
    text: 'No page loads a script, style, image or frame from another server. The TikTok and Instagram videos are click-to-load: the outside player is created only when someone presses play.',
  },
  {
    title: 'Old links still land in the right place',
    text: 'Links to the old one-page site, like /#services or /#contact, redirect to the matching new page, so bookmarks and old shares keep working.',
  },
  {
    title: 'An owner’s manual in the repository',
    text: 'The README explains how to edit copy, build, add photos (with redaction), add client reviews with permission, and keep the estimate form working.',
  },
];

const RESULTS_ROWS = [
  ['Indexable pages', '1 (28 sitemap entries, all versions of the same page)', '22, plus 2 kept out of search (reviews, 404)'],
  ['Home page, first load (desktop, main frame)', 'About 1.39 MB, 20 requests', 'About 218 KB, 9 requests'],
  ['Home page, including embedded frames', 'About 8.8 MB, 204 requests', 'About 218 KB, 9 requests'],
  ['Third-party hosts contacted on load', '24', '0'],
  ['Meta tags on the home page', '286', '17'],
  ['Lighthouse mobile: Performance', '55', '95'],
  ['Lighthouse mobile: Accessibility', '91', '100'],
  ['Lighthouse mobile: Best Practices', '75', '100'],
  ['Lighthouse mobile: SEO', '100', '100'],
];

const CASE_FAQS = [
  {
    q: 'Did you build the original Mahnken website too?',
    a: 'Yes. The one-page version from October 2025 was ours; its footer carried our credit. This write-up covers what we got wrong in it and how the November 2026 rebuild fixed it.',
  },
  {
    q: 'Is a static website a good fit for a small business?',
    a: [
      'Often, when the site is mostly pages that change a few times a year: services, areas served, photos and a contact form. Static pages are quick to serve and there’s no server software or plugins to keep patched.',
      'The trade-off is that edits go through a build step, so it suits an owner who doesn’t need daily changes or has someone to make them. A large store or a daily blog may be better on a content system such as WordPress. We build both; see [web development](/services/web-development/).',
    ],
  },
  {
    q: 'What should a painting contractor’s website include?',
    a: 'From this project: a page for each service and each city you actually work in, real photos of your own jobs, a phone number one tap away on mobile, and an estimate form that works without JavaScript.',
  },
  {
    q: 'How much faster is the rebuilt site?',
    a: 'In our lab tests on Nov 3, 2026, the home page’s first load went from about 1.39 MB over 20 requests to about 218 KB over 9, and Lighthouse’s mobile Performance score went from 55 to 95. Those are lab numbers, not measurements from real visitors.',
  },
];

function caseStudy() {
  const path = CASE_PATH;
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Work', href: '/work/' }, { label: 'Mahnken Painting website', href: path }];
  const title = 'Case Study: Mahnken Painting & More Website | Manpasand';
  const description =
    'How we rebuilt a Rowlett painter’s one-page site as a fast multi-page static site with service pages, city pages and an estimate form. See it live.';
  const h1 = 'Rebuilding the Mahnken Painting & More website';
  const client = { '@type': 'Organization', '@id': `${CLIENT_URL}#organization`, name: CLIENT, url: CLIENT_URL };
  const shotSizes = '(min-width: 1240px) 456px, (min-width: 961px) 37vw, calc(100vw - 32px)'; // split--7-5 right column
  const gallerySizes = '(min-width: 1240px) 640px, (min-width: 961px) 52vw, calc(100vw - 32px)'; // .wk-row 7fr column
  const pairSizes = '(min-width: 1240px) 580px, (min-width: 801px) 46vw, calc(100vw - 32px)';
  const phonePairSizes = '(min-width: 700px) 306px, 46vw'; // .wk-pair--phones (max-width 640)
  const phoneSoloSizes = '300px'; // .wk-phone (max-width 300)

  return {
    path,
    title,
    description,
    h1,
    crumbs,
    updated: PUBLISHED,
    ogType: 'article',
    image: '/assets/img/og-work-mahnken-painting-website.jpg',
    imageAlt: `Case study: the ${CLIENT} website rebuild, by Manpasand Technical Services.`,
    bodyClass: 'page-work page-case',
    about: { '@type': 'WebSite', name: `${CLIENT} website`, url: CLIENT_URL },
    schema: [
      articleNode({
        path,
        headline: h1,
        description,
        datePublished: PUBLISHED,
        dateModified: UPDATED,
        image: ['-16x9', '-4x3', '-1x1'].map((s) => `/assets/img/og-work-mahnken-painting-website${s}.jpg`),
        extra: {
          about: { '@type': 'WebSite', name: `${CLIENT} website`, url: CLIENT_URL, publisher: { '@id': client['@id'] } },
          mentions: [client],
          articleSection: 'Case studies',
        },
      }),
    ],
    body: html`${pageHero({
      crumbs,
      eyebrow: 'Case study · Web development',
      h1: html`Rebuilding the <em>Mahnken Painting & More</em> website`,
      lead: 'Mahnken Painting & More is an owner-operated painting company in Rowlett, TX. We built its first website in October 2025, as a single page. On November 3, 2026 we replaced it with a 24-page static site. This is what was wrong with our first version, what we changed, and what we measured.',
      meta: guideMeta({ updated: PUBLISHED, kind: 'Case study', word: 'Published' }),
      actions: false,
      after: html`<div class="cta-row">
  ${btn({ href: CLIENT_URL, label: 'Visit mahnkenpainting.com', iconRight: 'arrow-up-right' })}
  ${btn({ href: '/services/web-development/', label: 'Our web development service', variant: 'ghost', arrow: true })}
</div>`,
      aside: projectCard([
        { label: 'Client', value: 'Owner-operated painter' },
        { label: 'Based in', value: '[Rowlett, TX](/service-areas/rowlett-tx/)' },
        { label: 'First version', value: 'Oct 2025 · 1 page' },
        { label: 'Rebuild live', value: 'Nov 3, 2026' },
        { label: 'Pages', value: '24 (22 indexable)' },
        { label: 'Hosting', value: 'GitHub Pages, static HTML' },
        { label: 'Our role', value: 'Design and build, both versions', wide: true },
      ]),
    })}
${section(
  { id: 'challenge', labelledby: 'challenge-h' },
  html`${sectionHead({ num: '01', label: 'The challenge', id: 'challenge-h', title: html`Our first version <em>was one page</em>`, lead: 'In October 2025 we shipped the whole site as a single index.html file. It looked busy and complete. Underneath, it worked against the client in four ways.' })}
<div class="split split--7-5">
  ${points(CHALLENGE)}
  <div class="wk-sticky">
    ${shot('work-old-home-landed', { bar: ['Before · 2025', 'As it loaded'], note: 'Our 2025 version, as Chrome showed it right after loading. The page had already jumped 123 px, cutting off the headline under the header. Badge and banner text blurred.', sizes: shotSizes })}
  </div>
</div>`,
)}
${section(
  { alt: true, id: 'built', labelledby: 'built-h' },
  html`${sectionHead({ num: '02', label: 'What we built', id: 'built-h', title: html`A real multi-page site, <em>kept honest by its build</em>`, lead: 'The rebuild replaced the single page in one commit that changed 158 files. Here are the three decisions that shaped it.' })}
<div class="split split--7-5">
  ${points(BUILT)}
  <div class="wk-sticky">
    ${shot('work-new-service-desktop', { bar: ['After · 2026', 'Service page'], note: 'One of the seven new service pages: its own address, breadcrumb, heading and real project photo.', sizes: shotSizes })}
  </div>
</div>`,
)}
${section(
  { id: 'details', labelledby: 'details-h' },
  html`${sectionHead({ num: '03', label: 'Details', id: 'details-h', title: 'Details worth a closer look', lead: 'Small decisions that make the site faster, more private and easier for the owner to keep running.' })}
<div class="wk-rows">
  <div class="wk-row">
    <div class="wk-row-text">
      <p class="label">Photos</p>
      <h3>Real photos, kept private and light</h3>
      <p>The photos are real ones from the client’s own jobs. Before publishing, the image script blurred house numbers, family photos and another company’s sign in the originals, and it never writes out camera metadata such as GPS location. Each photo is served as WebP in several sizes, so a phone downloads a phone-sized file, and photos below the fold load only when scrolled to.</p>
    </div>
    ${shot('work-new-gallery-desktop', { bar: ['After · 2026', 'Gallery'], note: 'The gallery’s before-and-after pair, served as responsive WebP.', sizes: gallerySizes })}
  </div>
  <div class="wk-row wk-row--phone">
    <div class="wk-row-text">
      <p class="label">Estimate form</p>
      <h3>An estimate form that works without JavaScript</h3>
      <p>The form is a plain HTML form that posts to the client’s existing Google Form, so it still sends with scripts turned off. Script adds inline error messages and folds the extra fields into the form’s description answer. Every field has a visible label, required ones are marked, and autocomplete is set so phones can fill them in.</p>
      <p>One limit, written into the README: Google Forms doesn’t tell the website whether a submission arrived, so the page always says thanks.</p>
    </div>
    ${shot('work-new-contact-mobile', { bar: ['After · 2026', 'Contact, phone'], sizes: phoneSoloSizes, cls: 'wk-phone' })}
  </div>
</div>
<div class="wk-more-details">
  ${points(DETAILS)}
</div>`,
)}
${section(
  { alt: true, id: 'results', labelledby: 'results-h' },
  html`${sectionHead({ num: '04', label: 'Results', id: 'results-h', title: html`What we can measure <em>so far</em>`, lead: 'We measured both versions on Nov 3, 2026: the live rebuild, and a saved copy of our 2025 page with its outside resources fetched live. These are lab numbers, not traffic, rankings or leads.' })}
${metrics(HEADLINE_METRICS)}
<div class="wk-table">
${table({
  caption: 'Lab measurements, Nov 3, 2026',
  head: ['Measure', 'Our 2025 version', 'Rebuild, 2026'],
  rows: RESULTS_ROWS,
})}
</div>
<div class="split split--6-6 wk-notes">
  ${callout({
    title: 'Lab, not field data',
    text: 'Lighthouse 12.8.2 ran in mobile mode against a local server that sends no compression or cache headers. GitHub Pages does both, so the rebuild’s lab score is conservative. Field data from real visitors isn’t available yet.',
  })}
  ${callout({
    title: 'Why the SEO score didn’t move',
    text: 'Our 2025 page also scored 100. Lighthouse’s SEO audit doesn’t catch keyword lists, hidden text, one-URL sites or misused review markup. The real change is structure: 22 indexable pages, a clean sitemap and one schema graph per page.',
  })}
</div>
<div class="wk-compare" role="group" aria-labelledby="compare-h">
  <h3 id="compare-h">Before and after, side by side</h3>
  <p class="wk-small">Screenshots of mahnkenpainting.com. The emblem, project photos and business details shown belong to Mahnken Painting & More.</p>
  <div class="wk-pair">
    ${shot('work-old-home-desktop', { bar: ['Before', 'Our 2025 version'], note: 'Scrolled to the top: an emoji logo, a busy hero and a gradient banner. Badge and banner text blurred.', sizes: pairSizes })}
    ${shot('work-new-home-desktop', { bar: ['After', 'Rebuild, Nov 2026'], note: 'The client’s emblem, a plain headline, two clear actions.', sizes: pairSizes })}
  </div>
  <div class="wk-pair wk-pair--phones">
    ${shot('work-old-home-mobile', { bar: ['Before', 'Phone'], note: 'Badge and banner text blurred.', sizes: phonePairSizes })}
    ${shot('work-new-home-mobile', { bar: ['After', 'Phone'], sizes: phonePairSizes })}
  </div>
</div>`,
)}
${section(
  { id: 'limits', labelledby: 'limits-h' },
  html`${sectionHead({ num: '05', label: 'Limits and next steps', id: 'limits-h', title: html`What this write-up <em>can’t tell you yet</em>` })}
<div class="split split--6-6">
  <div>
    <h3 class="wk-h3">Open limits</h3>
    <ul class="wk-list">
      <li>${inline('**No traffic, ranking or lead data.** The rebuild went live on Nov 3, 2026, the day we measured it. We make no claim about calls or estimates.')}</li>
      <li>${inline('**The reviews page has no reviews yet.** It stays out of search and the menu until the client adds reviews, with permission.')}</li>
      <li>${inline('**Google Forms can’t confirm a submission.** The README explains how the owner can check that requests are arriving.')}</li>
      <li>${inline('**Lab numbers only.** Measured on one day in a lab setup. Real visitors’ phones and connections vary.')}</li>
    </ul>
  </div>
  <div>
    <h3 class="wk-h3">What we’d look at next</h3>
    <ul class="wk-list">
      <li>${inline('Google Search Console, to confirm the 22 pages are crawled and indexed at their new addresses.')}</li>
      <li>${inline('Core Web Vitals from real visits, once there’s enough traffic to report.')}</li>
      <li>${inline('Client reviews on the reviews page, once the client adds them.')}</li>
    </ul>
  </div>
</div>
${callout({
  title: 'About the client’s details',
  text: 'Statements about the business on mahnkenpainting.com (years of experience, insurance, EPA lead-safe (RRP) certification and chamber membership) come from the client.',
})}
${sourcesList(SOURCES, { title: 'Sources', id: 'sources' })}`,
)}
${ctaBand({
  num: '06',
  label: 'Your website',
  title: html`Is your site one page doing six jobs? <em>Let’s look at it together.</em>`,
  lead: 'Start with a free consultation about the site you have. You’ll get a written scope and a fixed-price quote before any work starts.',
  primary: 'See web development',
  href: '/services/web-development/',
})}
${faqSection({
  num: '07',
  faqs: CASE_FAQS,
  title: 'Questions about this project',
  lead: 'Anything else? Call or email — we reply within one business day.',
  more: { href: '/work/', label: 'Back to all work' },
})}`,
  };
}

export default function work() {
  return [hub(), caseStudy()];
}

