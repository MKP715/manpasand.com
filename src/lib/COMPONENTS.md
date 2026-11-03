# Components — page-agent reference

Everything a page needs is in `src/lib/components.mjs` (design: "Cyanotype", `design-final.md`).
Import what you use:

```js
import { html } from '../lib/html.mjs';
import { pageHero, section, sectionHead, serviceCards, ctaBand, faqSection } from '../lib/components.mjs';
```

**Conventions**

- Every component returns an `html` fragment. Interpolate it into `body: html\`…\``.
- **Text params** (`lead`, `text`, list items, FAQ answers, fact values) accept inline markdown: `**bold**`, `*em*`, `[label](/path/)`. The build fails on links to pages outside the IA.
- **Titles** (`h1`, `title`) take a plain string or an `html` fragment. Use the fragment for the single italic accent phrase, for example `` html`Network security for <em>small offices</em>` ``. Use one `<em>` per heading at most.
- **Ids** must be unique on a page, because the build checks. Components that need an id take an `id` param with a sensible default (`cta`, `faq`, `fig-<slug>`, `case-h`, `top`). Pass a different one if you render a component twice.
- **Section numbers** (`num: '01'`) count up in order within a page, starting at `§ 01`. The hero has no number.
- **Headings:** exactly one `<h1>` per page, which `pageHero` renders. Section heads are `h2` and cards are `h3` (`level` param where it matters). Mono labels are `<p>`, never headings.
- **Never render** stars, ratings, or "sold in a week" in a heading, title, alt or meta. Never mention cameras, CCTV, alarms or drones as a service (use `cameraDisclosure()` where the compliance brief asks for it).

## Page skeleton (typical inner page)

```js
export default function page() {
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services/' }, { label: 'Web development', href: '/services/web-development/' }];
  return {
    path: '/services/web-development/', title: '…', description: '…', h1: '…', crumbs,
    bodyClass: 'page-service',            // optional: scope src/styles/pages/<page>.css with it
    body: html`${pageHero({ crumbs, eyebrow: 'Service · 05', h1: html`Websites that <em>load fast</em>`, lead: '…', facts: ['Fixed-price quotes', 'Reply in 1 business day'], aside: serviceFigure('web-development') })}
${section({ labelledby: 'inc-h' }, html`${sectionHead({ num: '01', label: 'What’s included', id: 'inc-h', title: 'What’s included' })}${checklist(items)}`)}
${section({ alt: true, labelledby: 'how-h' }, html`${sectionHead({ num: '02', label: 'Process', id: 'how-h', title: 'How a project runs' })}${steps(process)}`)}
${ctaBand({ num: '03', lead: content.cta })}
${faqSection({ num: '04', faqs: content.faqs })}`,
  };
}
```

**Band rhythm:** alternate plain `section()` and `section({ alt: true })`. Don't put two bands with the same background next to each other. Use one `ctaBand` per page, just before the FAQ or the footer.

---

## Layout chrome (automatic — `src/lib/layout.mjs`)

The layout renders these on every page. Page modules don't call them.

- skip link
- sticky header: logo, Services disclosure `#svc-menu`, nav, phone, "Free consultation" CTA, and at ≤1120px the Call and Menu buttons
- mobile drawer `#drawer` (with `#drawer-svc`)
- `<main id="main">`
- footer: masthead, Services / Service areas / Company / Contact columns, NAP, the Auto/Light/Dark switch, Privacy/Terms, ©year
- mobile action bar: Call / Email / Contact

`aria-current="page"` is set on nav links automatically from `page.path`. A section match underlines in vermilion, so `/services/x/` marks "Services".

**Breadcrumbs:** pass `crumbs` to the page object (for the schema) **and** to `pageHero({ crumbs })` (to show them). If the body has no Breadcrumb nav, the layout inserts one above it, so a page without `pageHero` still shows them.

**Action bar:** it hides when the footer is in view (it slides away, then becomes `visibility:hidden`, so the hidden bar also leaves the tab order). At viewport heights of 450px or less (desktop zoomed to 300–400%, landscape phones) the bar is not shown and the header is not sticky. Add the attribute `data-hide-actionbar` to any element that should also hide it, for example the contact `<form>`.

**Reserved ids:** `main`, `svc-menu`, `drawer`, `drawer-svc`. Don't reuse them.

---

## Type, links, buttons

| Component | Params | Notes |
|---|---|---|
| `label({ num?, text, id?, cls?, tag='p' })` | | Mono label. With `num`: `§ 01  Text` (the number is in accent). |
| `eyebrow(text)` | | Signal square + mono label. Used above an H1. |
| `btn({ href, label, variant='primary'\|'ghost', iconLeft?, iconRight?, arrow?, lg?, block?, tel?, cls?, attrs? })` | | 48px tall, 56px with `lg`. `arrow: true` adds a trailing arrow that nudges on hover. Off-site hrefs get `rel="noopener"`. |
| `more({ href, label, newTab? })` | | Text link with an arrow. An off-site href shows ↗; `newTab` adds `target="_blank"`, which the spec allows only for case-study links. |
| `primaryActions({ label='Book a free consultation', href='/contact/', call=true })` | | Primary CTA plus a ghost "Call (715) 255-0420". Both go full width at ≤640px. |
| `icon(name, { size=20, cls, label? })` | | 24-grid stroke icons: phone, mail, chat, pin, clock, check, arrow, arrow-up-right, menu, close, chevron, external, calendar, file, info, alert, lock, users, quote, book, image, bolt, thermometer, cloud, wifi, server, database, shield, video, code, camera, home, home-wifi, compass, briefcase, store, chart, layers, plug, printer, monitor, key, refresh, search, star-outline, sun, moon. Decorative unless you pass `label`. There is no CCTV icon. |
| `serviceIcon(slugOrIconName, { size=44 })` | | 32-grid service drawings (ink + one accent detail). Takes a slug (`'web-development'`) or the SERVICES `icon` name (`'code'`). |
| `logoMark({ label? })` | | The logo SVG. Rarely needed. |

```js
btn({ href: '/contact/', label: 'Book a free consultation', arrow: true, lg: true })
more({ href: '/services/', label: 'See all services' })
```

## Chips and tags

| Component | Notes |
|---|---|
| `chips([{ href?, label }], { arrow=true })` | 44px bordered chips. Entries without `href` render as plain text. One per row at ≤560px. |
| `areaChips({ linked=true, moreAreas=true, exclude=[] })` | The six city pages (linked) followed by MORE_AREAS (plain). Pass `exclude: ['garland-tx']` on that city's page. |
| `problemChips({ label?, items?, id='starts-h' })` | The full-width "→ Start with the problem" strip (`nav.starts`). It draws its own `.wrap`, so place it **between** sections, not inside one. The 8 default chips each link to a service. |
| `tags(['Topic', { text: 'Businesses', aud: true }])` | Mono tags. `aud` gives the tinted audience tag. |
| `tag(text, { aud })` | A single inline tag. |
| `statusChip('Updated Nov 3, 2026')` | Mono label with a signal square. |

## Heroes

### `pageHero(opts)` — every page's H1 lives here

| Param | Notes |
|---|---|
| `crumbs` | The same array as `page.crumbs`. Rendered above the eyebrow. |
| `eyebrow` | e.g. `'Service · 02'`, `'Garland, TX'`, `'Guide'` |
| `h1` | String or html with one `<em>`. Keep it to about 45 characters or less. |
| `lead` | Inline markdown. Max width 38em. |
| `meta` | Optional html under the lead, e.g. `guideMeta({ updated, minutes })`. |
| `actions` | `true` (default) gives `primaryActions()`. Pass an object to customise it (`{ label, href, call }`) or `false` to hide it. |
| `facts` | Array of short strings, rendered as mono square bullets. |
| `define` | `true` adds the "man·pa·sand" dictionary entry (Home, About). |
| `aside` | Right column (5fr): `serviceFigure(slug)`, `readoutCard({…})`, `directLine()` or `plate({…})`. Omit it for a single-column hero (guides). |
| `after` | Extra html at the end of the left column. |
| `home` | `true` gives the home variant: display-size H1, running head (`runhead`) on top, no bottom rule. |
| `runhead` | Force the "Based in / On-site / Remote / Hours" readout on or off. It defaults to `home`. |
| `id` | Section id (default `'top'`). |

```js
pageHero({ crumbs, eyebrow: 'Rowlett, TX', h1: html`Tech help in <em>Rowlett</em>`, lead: content.lede,
  aside: readoutCard({ city: 'Rowlett', facts: content.facts }) })
```

### Hero asides and related cards

| Component | Notes |
|---|---|
| `directLine({ title='Direct line', compact? })` | Surface card with a phone row and an email row (60px tap rows), plus the base line. For About, Contact, FAQ, Reviews and the Work hub. |
| `readoutCard({ city, facts: [{label, value}], drive?, id? })` | City card. A mono header reads "Fig. — Rowlett → City", then a 2-column `dl` of **verified** facts. `drive` (e.g. `'About 15 min'`) draws the Rowlett → City dimension strip. For the home-base city (`SITE.address.city`) the header reads "Fig. — Rowlett · Home base" and no strip is drawn. Leave `drive` out if the time is unverified. |
| `runningHead()` | The 4-cell location/hours readout on its own. |
| `heroFacts(items)` | Mono checklist with outlined squares. |
| `definition()` | The "man·pa·sand" entry: `div.define` with a mono label and a `<dl>`. |
| `guideMeta({ updated: 'YYYY-MM-DD', minutes, kind='Guide' })` | Renders "Guide · Updated Nov 3, 2026 · 9 min read". |
| `formatDate('2026-11-03')` | Returns "Nov 3, 2026". |

## Sections

| Component | Notes |
|---|---|
| `section({ id?, labelledby?, alt?, tight?, cls?, wrapCls? }, inner)` | Gives `<section class="section">` with a `.wrap` inside. `alt` uses the paper-2 band. `tight` uses the smaller padding. `wrapCls: 'wrap--narrow'` (880px) or `'wrap--prose'`. |
| `sectionHead({ num, label, title, lead?, more?: {href,label}, id, level=2, cls? })` | 3/9 grid with the § label and an H2 (stacks at ≤800px). Set `id` and pass the same value as the section's `labelledby`. `cls: 'sec-head--compact'` reduces the bottom margin. |

Layout helpers (CSS classes):

- Splits: `.split.split--7-5` / `--5-7` / `--8-4` / `--4-8` / `--6-6`, plus `.split--stretch`. These collapse at 960px (4-8 collapses at 800px).
- Card grids: `.grid.grid--2` / `--3` / `--4`.
- Spacing: `.stack` (vertical rhythm through `--stack`), and `.mt-s` / `.mt-m` / `.mt-l` (16 / 32 / 40–64px).
- Width: `.measure` (68ch).

## Services and cards

| Component | Notes |
|---|---|
| `serviceCards({ services=SERVICES, grouped=false, level=3 })` | The hairline 4×2 grid: 2 columns at ≤1100px, 1 at ≤640px. Each cell has its index, service icon, title (the whole cell is one link), summary, an audience tag and a topic tag. `grouped: true` gives three grids (IT & networks / Data & web / Photography) with ids `group-it`, `group-data-web`, `group-photo`. Overriding entries can add `topic`. |
| `relatedLinks(items, { label })` | Ruled list of rows with an icon, title, text and arrow. `items` are service slugs (`'network-security'`) or `{ href, title, text?, slug? \| icon? }`. |
| `areaCards([{ slug, city, county, summary, drive? }])` | The service-areas hub grid: 3 columns, then 2, then 1. Each card ends in a "{City} service area →" row (§6.18). |
| `guideCard(g, { minutes?, updated?, level })` / `guideCards(GUIDES, opts \| g => opts)` | Ruled, stretched-link cards in 2 columns (1 at ≤800px). |
| `caseCard({ title, text, href, site?, bar=['Case study','Web development'], level, id='case-h' })` | Case-study card with the stacked-pages wireframe. `site` is the external URL. |
| `reviewCard(review, { topic?, more?: {href,label}, note=true })` | The quote is **verbatim** from `REVIEWS`. No stars and no schema. A review's `note` (Jane S.) is shown under the quote automatically. Keep `note: true` wherever Jane S. appears. |

## Commitments

| Component | Notes |
|---|---|
| `commitments({ ruler=true, trust=true })` | The 4 stated commitments: Fixed price / 1 day / 14 days / Insured, each with its qualifier. The guarantee item links to `/terms/#guarantee`. Place it in `section({ alt: true })` with a `sectionHead` such as "How we work". `TERMS` holds the data. |
| `ruler({ sm })` | Decorative tick strip. |
| `trustLine()` | "DFW-based · Transparent pricing · Insured · Confidentiality assured" |

> `/terms/` **must** carry `id="guarantee"` on the guarantee section, because `commitments()` links to it.

## Lists, FAQ, CTA

| Component | Notes |
|---|---|
| `checklist(items, { cols=2 })` | "What's included". Check icons, 2 columns at ≥800px. |
| `steps([{ title, text }], { ruler=true, level=3 })` | Process steps, `STEP 1…`. 4 columns, then 2, then 1. Use exactly 4. |
| `factsList([{ label, value }], { cols=2 })` | Ruled `dl`: mono label, bold value. |
| `keyTakeaways(items, { title })` | Guides. Numbered `01–05`. |
| `callout({ title?, text? \| body?, variant='info'\|'warn', id? })` | Surface box with a 3px left rule. Use `warn` for cautions. |
| `cameraDisclosure()` | **Required** on network-security, small-business-it and home-network, and on the FAQ. The exact compliance wording, linking tops.portal.texas.gov. |
| `faqList([{ q, a }], { openFirst=false, start=1 })` | `details`/`summary` rows numbered Q.01. `a` may be a string or an array of paragraphs. No JS needed. |
| `faqSection({ num, label='Questions', title, lead?, more?, faqs, openFirst=true, id='faq', alt? })` | Full section: sticky intro (4fr) beside the list (8fr). Pair it with `faqNode(faqs, path)` from schema.mjs for visible FAQs only. |
| `ctaBand({ num, label='Start here', title?, lead?, primary?, href='/contact/', id='cta' })` | Dark band with a registration-mark watermark and night buttons. Pass the content's `cta` sentence as `lead`. Use once per page. |

## Long-form (guides, legal, service and city sections)

| Component | Notes |
|---|---|
| `prose(sections, { counter=true, cls, backTo })` | Renders the content contract `sections: [{ heading, id?, paragraphs, list, ordered, table: {caption, head, rows, numeric}, callout: {title, text, variant}, after, subsections: [{ heading, … }] }]`. Each H2 gets an id from `sectionIds()` and an automatic "§ 0N" counter label (`counter: false` turns this off, e.g. for legal pages). H3s come from `subsections`. `backTo: '#contents'` adds a "Back to contents" link after each section (guides; shown at ≤960px). |
| `toc(sections, { title='On this page', id })` | TOC links matching `prose()` ids. Sticky in `.guide-aside` at ≥961px, collapsed `details` below that (closed before paint by an inline script, so nothing shifts). site.js highlights the current section and moves focus to the chosen heading. `id` lets "Back to contents" links target it. |
| `table({ caption, head, rows, numeric: [colIdx] })` | Wrapped in a scrollable region (only the table scrolls, never the page). The first column renders as row headers. |
| `sourcesList([{ label, url }], { title='Sources', id='sources' })` | Numbered mono list; each label is followed by its site's hostname, linked to the full URL (↗; print shows the URL). Guides render all sources. |
| `slugify(s)`, `sectionIds(sections)`, `paragraphs(list)` | Helpers. |

Guide layout markup (shared CSS exists for it):

```js
html`<section class="section"><div class="wrap guide-grid">
  <div>${keyTakeaways(c.keyTakeaways)}<div class="mt-l">${prose(c.sections)}</div>${c.disclaimer ? callout({ text: c.disclaimer }) : ''}${sourcesList(c.sources)}</div>
  <aside class="guide-aside" aria-label="On this page and related services">${toc(c.sections)}${relatedLinks(c.relatedServices)}${directLine({ compact: true })}</aside>
</div></section>`
```

## Figures ("Fig." plates)

| Component | Notes |
|---|---|
| `serviceFigure(slug, { n?, id?, cls? })` | The service's schematic: Fig. 2–9 (small-business-it 2, network-security 3, conference-room-av 4, database-consulting 5, web-development 6, photography 7, home-network 8, tech-consulting 9). Each comes with an HTML legend and an accessible description, and themes automatically. Override `n` to renumber. |
| `homeFigure()` / `figure('home')` | Fig. 1, "Small office · one system". |
| `figure(key, opts)` | Any built-in figure by key. |
| `plate({ n, caption, desc, legend: [..], art, viewBox='0 0 480 400', id?, cls? })` | **Custom figures** (e.g. inline guide figures at `viewBox '0 0 480 320'`). `art` is raw SVG markup using the `.fig-*` classes. Accessibility is built in: the svg is `role="img"`, labelled by the visible caption and described by `desc`, the art is `aria-hidden`, and the legend is real HTML. |
| `exhibit(imageKey, { caption, label='Plate', alt, sizes, ratio='3/2', eager })` | A real photo inside a plate frame (never full-bleed). It needs an entry in the image manifest (`npm run images`). |

**Drawing your own** (`import { fig } from '../lib/figures.mjs'`):

- `fig.crop(w, h)`: corner crop marks.
- `fig.num(x, y, n)`: numbered marker.
- `fig.af(x1, y1, x2, y2)`: vermilion autofocus brackets. Use them once, around THE subject.
- `fig.dim(x1, x2, y, 'LABEL')`: dimension line. Too short for the label, and it moves the label above the line.
- `fig.text(x, y, 'LABEL', anchor)`

Classes:

| Class | Draws |
|---|---|
| `fig-line` | Accent connections. Add `stroke-dasharray="4 3"` for drops and wireless links. |
| `fig-node` | Boxes with a surface fill. |
| `fig-ink` | Plain ink lines. |
| `fig-port` | Accent detail. |
| `fig-fill` | Ink fill. |
| `fig-signal` | Vermilion mark, max 1–2 per figure. |
| `fig-accent` / `fig-head` | Accent fill. |
| `fig-ghost` | `rule-ui` outline. |
| `fig-mask` | Surface knock-out. |

Never use raw colours: everything is a CSS variable, so dark mode works. Keep the essential information in the legend or the description, not only in the SVG.

## Forms (contact page)

`field({ id, name=id, label, type='text'|'email'|'tel'|'textarea'|'select', required, help?, autocomplete?, inputmode?, placeholder?, options?, rows=6, half?, value? })` renders:

- a label, with " (required)" when needed
- the control, with `aria-describedby` set to `<id>-help <id>-err`
- the help text
- an empty error slot `#<id>-err` (hidden). Set its text, unhide it and set `aria-invalid` from JS.

Wrap the fields in `<form class="form" data-hide-actionbar><fieldset><legend>…</legend><div class="fields">…</div></fieldset><div class="form-actions">…</div></form>`.

- `half: true` fields sit 2-up at ≥720px.
- Use `callout({ variant: 'warn', … })` for the error summary.
- For the success state, use `callout({ title: 'Message sent', cls: 'form-status form-status--ok', … })`. The title turns `--ok` green.
- The form's submit/mailto JS belongs to the contact page (add it through `page.scripts`).

---

## CSS rules for page agents

1. **Write only `src/styles/pages/<page>.css`**, named after your module (`services.css`, `service.css`, `area.css`, `guide.css`, `contact.css` …). It is bundled after all shared CSS, in name order.
2. **Scope every rule** with `bodyClass` (`.page-contact …`) or a page-specific class, so pages can't affect each other.
3. **Use tokens only**: `var(--ink)`, `var(--accent)`, `var(--rule)`, `var(--fs-h2)`, `var(--section)` … Never hard-code a colour. Every colour must work in light **and** dark. Check with `?theme=dark`.
4. Use the literal breakpoints `1120 / 1100 / 960 / 800 / 720 / 640 / 560`.
5. Radius is `var(--radius)` (2px), never pills. No shadows on cards, no gradients, no new fonts. Use mono only for short UPPERCASE labels, and never put vermilion (`--signal`) on text (use `--signal-ink`).
6. If something is missing from the shared components, prefer composing existing classes. If a change really belongs in a shared file (`src/styles/[0-9]*.css` or `components.mjs`), report it rather than editing it.
7. Check: `node src/build.mjs --check --pages=<module>`, then `node src/dev.mjs --port <port> --pages=<module>`, plus screenshots at 1440 / 390 / 360 in light and dark. There must be no horizontal overflow at 360px.
