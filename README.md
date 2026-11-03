# manpasand.com

Website for **Manpasand Technical Services**, a technical services business based in Rowlett, TX 75088, serving Dallas–Fort Worth. It is a plain static site: a small Node script renders the pages to HTML at the repo root, and GitHub Pages serves them as-is. There is no framework, no runtime CDN, no analytics and no cookies.

## Edit, preview, build, publish

```sh
npm run dev          # live preview at http://127.0.0.1:8100 (renders on request, writes nothing)
npm run check        # render + validate every page, write nothing
npm run build        # validate, then write the site to the repo root
git add -A && git commit -m "Update site" && git push
```

Needs Node 20+. Python 3.11+ with Pillow (and fonttools + brotli for fonts) only for `npm run images` / `npm run fonts`.

### Build options

| Command | What it does |
| --- | --- |
| `node src/build.mjs` | Render every page in `src/pages/`, validate, then write output (nothing is written if any check fails) |
| `node src/build.mjs --check` | Same checks, writes nothing |
| `node src/build.mjs --pages=home,contact` | Load only `src/pages/home.mjs` and `contact.mjs`. Links may point at any page in the site plan (`knownPaths()` in `src/site.mjs`) or files on disk; `#anchors` are only verified on pages rendered in this run. Without `--check` it writes just those pages + CSS (no sitemap/robots/manifest). |
| `node src/build.mjs --strict` | Also fail when a page in the site plan hasn't been built (use before publishing) |
| `node src/dev.mjs --port 8100 [--pages=home,contact] [--host 127.0.0.1]` | Dev server: pages are rendered fresh per request (edits show on reload, no restart), `/assets/css/site.css` is bundled fresh from `src/styles/`, everything else is served from the repo root, unknown URLs get the 404 page. Build problems for the page you open print in the terminal. |

**Errors** (build stops): import/render failure (names the module), duplicate path/title/description, a page without exactly one `<h1>`, `<img>` without `alt`, `target="_blank"` without `rel="noopener"`, JSON-LD that doesn't parse or contains Review/AggregateRating/HowTo/SearchAction, a street address or geo, duplicate `id`s, broken internal links/assets/`<script src>`/`#anchors`/`aria-controls` targets (case-sensitive, like GitHub Pages; a full build also treats pages it is about to delete as missing), missing files referenced from CSS, "sold in a week" in a title, description, heading or alt text, an `owner_flags` key in any `src/content/**/*.json`, a service `H1_ACCENT` phrase that isn't in its H1, a filled-in but malformed `SITE.contactForm`.

**Warnings** (build continues): title over 60 characters, description outside 110–160, banned marketing words (see "Voice" below), compliance words to review (licensed, certified, bonded, drone, aerial, forensic, CCTV, surveillance…), a two-hour acknowledgment without "during business hours", pages in the site plan not built yet. The approved camera/alarm disclosure ("…hire a licensed company…") is allowed and doesn't warn.

## Site map (31 pages)

| URL | Built by | Content from |
| --- | --- | --- |
| `/` | `src/pages/home.mjs` | `src/site.mjs` lists + area/guide JSON (drive times, dates) |
| `/services/` + 8 service pages (`small-business-it`, `network-security`, `conference-room-av`, `home-network`, `database-consulting`, `web-development`, `tech-consulting`, `photography`) | `src/pages/services.mjs` | `src/content/services/<slug>.json` |
| `/service-areas/` + 6 city pages (`rowlett-tx`, `rockwall-tx`, `garland-tx`, `sachse-tx`, `richardson-tx`, `plano-tx`) | `src/pages/areas.mjs` | `src/content/areas/<slug>.json` |
| `/guides/` + 4 guides (`texas-data-breach-notification`, `power-outage-protection-office-tech`, `conference-room-video-setup-checklist`, `prepare-home-for-real-estate-photos`) | `src/pages/guides.mjs` | `src/content/guides/<slug>.json` |
| `/work/`, `/work/mahnken-painting-website/` | `src/pages/work.mjs` | text in the module (facts from the Mahnken repo, measured 2026-11-03) |
| `/about/` | `src/pages/about.mjs` | text in the module |
| `/reviews/` | `src/pages/reviews.mjs` | `src/content/reviews.json` |
| `/contact/` (form at `#estimate`) | `src/pages/contact.mjs` + `assets/js/contact.js` | `SITE.contactForm` in `src/site.mjs` |
| `/faq/` | `src/pages/faq.mjs` | text in the module (17 questions in 4 groups) |
| `/privacy/`, `/terms/` (guarantee at `#guarantee`) | `src/pages/legal.mjs` | text in the module |
| `/404.html` | `src/pages/notfound.mjs` | — |

Old one-page anchors (`/#services`, `/#contact`, `/#faq`, …, also on `/index.html#…`) are redirected to the new pages by `assets/js/site.js`.

## Where things live

| To change… | Edit |
| --- | --- |
| Phone, email, hours, location, commitments, social links, contact-form settings, services, areas, guides, navigation | `src/site.mjs` |
| Service / city / guide copy | `src/content/services/<slug>.json`, `src/content/areas/<slug>.json`, `src/content/guides/<slug>.json` |
| Testimonials | `src/content/reviews.json` |
| Page templates | `src/pages/*.mjs` (one module can return many pages) |
| `<head>` (meta, social cards, fonts, theme script, structured data) | `src/lib/head.mjs`, `src/lib/schema.mjs` |
| Header, footer, page chrome | `src/lib/layout.mjs` |
| Shared components (heroes, cards, FAQ, CTA band, prose, Fig. schematics, form fields, `two()`, `accent()`, `driveMinutes()`) | `src/lib/components.mjs`, `src/lib/figures.mjs`, `src/lib/icons.mjs` — API and examples in `src/lib/COMPONENTS.md` |
| Styles | `src/styles/*.css` (site-wide, bundled in file-name order) and `src/styles/pages/<page>.css` (one file per page template) |
| Behaviour | `assets/js/site.js` (menu, theme, TOC, old-anchor redirects), `assets/js/contact.js` (form) |

Every page module default-exports a function returning a page object (or an array of them); the full contract is documented at the top of `src/lib/layout.mjs`.

**Generated — don't edit by hand:**
- by `npm run build`: every `index.html` and `404.html`, `assets/css/site.css`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, `src/data/generated.json`, `src/data/lastmod.json`
- by `npm run images`: `icon.svg`, `favicon.ico`, `apple-touch-icon.png`, `assets/img/*` (icons, logo, `og-*.jpg` share cards — one per section, service, city (`og-area-*`), guide (`og-guide-*`, plus `-16x9`/`-4x3`/`-1x1` Article versions) and the case study (`og-work-*`) — photo and screenshot variants), `src/data/images.json`
- by `npm run fonts`: `assets/fonts/*`, `src/styles/00-fonts.css`

**Hand-maintained — don't delete:** `CNAME`, `.nojekyll`, `LICENSE`, `README.md`, `package.json`, `.gitignore`, `assets/js/*.js`, everything in `src/`. `OWNER-NOTES.md` is hand-maintained too but private (git-ignored).

## Editing content

Service, city and guide pages are filled from JSON files. Edit the text, run `npm run check`, look at the page in `npm run dev`, then `npm run build`.

- **Text fields** accept inline markdown: `**bold**`, `*italic*` and `[link text](/path/)`. Internal links must be a real page path ending in `/` (the build fails on a broken link or `#anchor`).
- **Use typographic punctuation:** ’ “ ” and – for ranges (e.g. `Mon–Fri`).
- **Keys** (all three types): `title` (≤ 60 characters incl. "| Manpasand"), `description` (110–160), `h1`, `lede`, `summary` (used on cards), `sections` (`heading` + `body` paragraphs), `faqs` (`q` + `a`; they're shown on the page *and* marked up as FAQPage, so keep them visible), `sources` (every outside fact needs one).
  - services also have `audience`, `included`, `process` (exactly 4 steps), `related` (service slugs) and `cta`;
  - cities have `facts` (the readout card; the "Drive from Rowlett" fact feeds the drive-time figures on the home page and `/service-areas/`), `services` and `nearby`;
  - guides have `updated` (`YYYY-MM-DD`; change it whenever you change the guide — it's the date shown and the Article `dateModified`), `keyTakeaways`, `relatedServices` and `disclaimer`.
- **No owner notes in content files.** Everything in `src/` is published with the site, so to-dos and unconfirmed claims go in the private `OWNER-NOTES.md`. Outside facts are cited in each file's `sources`.
- **The blue italic phrase** in each H1 is set per page in `H1_ACCENT` at the top of `services.mjs`, `areas.mjs` and `guides.mjs`. If you reword a service H1 so the phrase no longer appears, the build fails until you update the phrase; on city and guide pages the heading simply shows without italics. Keep service H1s to about 45 characters so they fit in three lines on a phone.
- **Business facts** (phone, hours, commitments, services list, areas) live only in `src/site.mjs`. After changing the phone number or service names, run `npm run images` to redraw the share cards.
- **Never add** facts that aren't true and confirmed (years in business, client counts, certifications, licences, prices, partners), and never offer security cameras, alarms, access control, drone/aerial photos or electrical work. See "Voice and honesty rules".

### Styles

`src/styles/*.css` are concatenated in file-name order (`00-fonts.css`, `10-tokens.css`, `20-base.css`, `30-layout.css`, `35-chrome.css`, `40-components.css`, `45-prose.css`, `50-forms.css`, `90-utilities.css`), then `src/styles/pages/*.css` in name order, lightly minified, and written to `assets/css/site.css`. The `?v=` cache-buster in every page is the hash of that bundle.

Dark-theme tokens are written once inside `@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ … } }`; put `/* @dark-tokens */` inside `:root[data-theme="dark"]{ }` and the bundler copies the same declarations there (the manual Dark switch).

### Fonts

Newsreader (roman variable + italic), Instrument Sans and IBM Plex Mono Medium, all SIL Open Font License (texts in `assets/fonts/OFL-*.txt`). `npm run fonts` trims the source files in `src/tools/fonts/` to Latin WOFF2 (≈130 KB in total) and writes the `@font-face` rules plus metric-matched local fallbacks to `src/styles/00-fonts.css`. Only `newsreader-var.woff2` and `instrument-sans-var.woff2` are preloaded. You shouldn't need to re-run it.

### Theme

Light is the default; dark follows the device setting. The Auto/Light/Dark switch stores `light` or `dark` in `localStorage` key `theme` (Auto = no key). A tiny script in `<head>` applies it before the page paints. Add `?theme=dark` or `?theme=light` to any URL to force a theme (handy for screenshots). If you ever store anything else in the browser, update `/privacy/`, which says the theme is the only thing stored.

## Voice and honesty rules

Plain, specific, "we" voice. The build warns on: elite, premier, masterfully (except the tagline), cutting-edge, seamless(ly), leverage, empower, unlock, elevate, robust, synergy, world-class, state-of-the-art, game-changer, bespoke, "in today's digital age", "look no further". Never add facts about the business that aren't in `src/site.mjs` or confirmed by the owner (years in business, client counts, certifications, prices, partners). Never offer security cameras, alarms, access control or drone work (Texas licensing). Don't use the words "licensed", "certified" or "bonded" about the business. Jane S.'s testimonial is quoted in full, but "sold in a week" must never become a heading, title, pull quote, alt text or share text, and her quote always shows the sale-timing note.

## Adding testimonials

Add only words a client actually wrote, with their permission, quoted exactly. No star ratings (and no review structured data — Google ignores self-hosted reviews and it can look like fake-review markup). Keep the original message and the written permission on file.

```json
[
  { "name": "Pat R.", "role": "Office Manager", "service": "small-business-it", "text": "Exact words from the client." }
]
```

`service` is a slug from `SERVICES` in `src/site.mjs`. Add an optional `note` to show a short context note beside a quote (required whenever a quote mentions a result you can't promise).

## Adding photos

`src/images/originals/` is **published** along with the rest of the repo, so never add a photo there that shows something private (house numbers, faces, screens, documents, other companies' signs) unless you list it under `redact` — the script blurs those boxes into the original file itself the first time it runs and then removes them from the config. Strip camera metadata (EXIF/GPS) before adding a photo: the script never writes metadata into the variants it makes, but an original without `redact` boxes is published as you added it.

1. Put the original in `src/images/originals/`.
2. Add an entry to `src/images/images.config.json`:
   ```json
   { "office-rack": { "file": "office-rack.jpg", "alt": "Accurate, standalone description", "widths": [480, 800, 1200], "quality": 78 } }
   ```
   Optional: `crop` `[left, top, right, bottom]`, `redact` (list of boxes to blur), both in pixels of the upright original.
3. Run `npm run images`, then use the key in a page with `picture('office-rack', { sizes: '…' })` from `src/lib/assets.mjs`.

`npm run images` also redraws the icons and the 1200×630 share cards (`assets/img/og-*.jpg`) from `src/site.mjs`, so re-run it after changing the phone number or service names.

## Contact form (Google Form)

**Today** (nothing configured) the form on `/contact/` builds a structured email and opens the visitor's email app addressed to info@manpasand.com. The page says so before the button, and afterwards shows the address plus "Copy my request" / "Copy email address" buttons in case no email app opened. Nothing reaches you unless the visitor presses Send. Without JavaScript the form is a plain `mailto:` post.

**To receive submissions in a Google Form instead:**

1. Go to [forms.google.com](https://forms.google.com) while signed in to the Google account that should receive requests, and create a blank form (e.g. "Manpasand — consultation requests").
2. Add exactly four questions, in this order:
   1. **Name** — Short answer, Required.
   2. **Email** — Short answer, Required. (Optional: Response validation › Text › Email.)
   3. **Phone** — Short answer, not required.
   4. **Description** — Paragraph, Required.
3. **Settings › Responses:** leave "Collect email addresses" **off** and "Limit to 1 response" **off** (both would force visitors to sign in to Google, which breaks the website form). Leave "Accepting responses" on.
4. **Responses tab ›** ⋮ **› Get email notifications for new responses**, so each request arrives in your inbox. Optionally link a Google Sheet.
5. Click **Publish** (newer Forms) so the form accepts responses.
6. Open ⋮ **› Get pre-filled link**. Type a dummy answer into each question — `NAME`, `EMAIL`, `PHONE`, `DESC` — then **Get link › Copy link**.
7. Paste the link into a text editor. It looks like
   `https://docs.google.com/forms/d/e/1FAIpQLSf…/viewform?usp=pp_url&entry.111111111=NAME&entry.222222222=EMAIL&entry.333333333=PHONE&entry.444444444=DESC`
8. In `src/site.mjs`, fill in `contactForm`:
   ```js
   contactForm: {
     googleFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSf…/formResponse', // the part before "?", with /viewform → /formResponse
     entries: { name: 'entry.111111111', email: 'entry.222222222', phone: 'entry.333333333', description: 'entry.444444444' },
   },
   ```
   Match each `entry.` number to the dummy answer that followed it (`=NAME` → `name`, and so on), keeping the `entry.` prefix. The switch happens only when the URL **and all four** entries are filled in; once they are, the build fails if the URL isn't a public `docs.google.com/forms/…/viewform` or `…/formResponse` link (not `/edit` or `forms.gle`) or an entry doesn't look like `entry.123456789`.
9. Run `npm run build`. The contact page now posts to Google ("Send request" button), the extra questions (services, business/home, city, timeline, best way to reach you) are folded into the Description answer, and `/privacy/` automatically switches its form paragraphs to describe Google Forms and link Google's privacy policy.
10. Publish, open https://manpasand.com/contact/, send a test request and confirm it appears in the form's **Responses** tab and your email.

Google Forms never tells the website whether a submission was accepted, so after sending the page shows "Request sent" plus your phone and email to use if no reply arrives; a network failure keeps the visitor's answers and shows a warning. Keep "Accepting responses" on, don't change or reorder the four questions (if you do, repeat steps 6–9), and send yourself a test request about once a month.

## Owner checklist (private)

The owner's pre-launch checklist and per-page notes are kept in `OWNER-NOTES.md` at the repo root. That file is git-ignored, so it is never committed or published. Everything that *is* committed — this README and all of `src/` — is public, because GitHub Pages serves the whole repository. Never put owner-only notes, unconfirmed claims or to-dos in this README or in `src/content/*.json` (the build fails if a content file has an `owner_flags` key).

## Maintenance

- **Monthly:** send a test request through `/contact/` and check that it arrives.
- **Every few months:** re-check dates, prices and figures in the guides and on the service pages against their sources, and change each guide's `updated` date when you edit it.
- **When analytics or any outside resource is added:** update `/privacy/` (it says there are no analytics, cookies or outside resources, and that the theme is the only thing stored).
- **New reviews:** add to `src/content/reviews.json` only with the client's permission and the original message on file.
