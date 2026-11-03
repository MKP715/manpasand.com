// Static site build.
//
//   node src/build.mjs                    render + validate every page, then write output
//   node src/build.mjs --check            render + validate only; writes nothing
//   node src/build.mjs --pages=home,about only load src/pages/home.mjs + about.mjs
//                                         (links are then checked against knownPaths() +
//                                         files on disk; anchors only on rendered pages).
//                                         Without --check it writes just those pages + CSS.
//   node src/build.mjs --strict           also fail when an IA page (knownPaths) is not built
//
// Output (repo root, served as-is by GitHub Pages): <path>/index.html for every
// page, 404.html, assets/css/site.css (bundled from src/styles), sitemap.xml,
// robots.txt, site.webmanifest. Nothing is written unless every check passes.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { toString } from './lib/html.mjs';
import { ROOT, bundleCss } from './lib/assets.mjs';
import { SITE, knownPaths } from './site.mjs';

const SRC = join(ROOT, 'src');
const PAGES_DIR = join(SRC, 'pages');
const GENERATED_LIST = join(SRC, 'data', 'generated.json');
const LASTMOD_CACHE = join(SRC, 'data', 'lastmod.json');
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
// Files the build itself writes; treated as present when validating links.
const BUILD_OUTPUTS = ['/assets/css/site.css', '/sitemap.xml', '/robots.txt', '/site.webmanifest'];

export const outFileFor = (path) => (path.endsWith('.html') ? join(ROOT, path) : join(ROOT, path, 'index.html'));

export function parseArgs(argv = process.argv.slice(2)) {
  const opts = { check: false, strict: false, pages: null };
  for (const a of argv) {
    if (a === '--check') opts.check = true;
    else if (a === '--strict') opts.strict = true;
    else if (a.startsWith('--pages=')) opts.pages = a.slice(8).split(',').map((s) => s.trim().replace(/\.mjs$/, '')).filter(Boolean);
  }
  return opts;
}

/**
 * Import page modules. `only` = module base names (['home', 'about']) or null for all.
 * `bust` appends a query so a long-running process re-imports edited page modules.
 * Import/render failures are collected per module so one bad page can't hide the others.
 */
export async function loadPages(only = null, { bust = '' } = {}) {
  const errors = [];
  const available = existsSync(PAGES_DIR) ? readdirSync(PAGES_DIR).filter((f) => f.endsWith('.mjs')).sort() : [];
  let files = available;
  if (only) {
    files = [];
    for (const name of only) {
      if (available.includes(`${name}.mjs`)) files.push(`${name}.mjs`);
      else errors.push(`--pages: no module src/pages/${name}.mjs`);
    }
  }
  const pages = [];
  for (const f of files) {
    let mod;
    try {
      mod = await import(pathToFileURL(join(PAGES_DIR, f)).href + bust);
    } catch (err) {
      errors.push(`src/pages/${f}: failed to import: ${err?.stack || err}`);
      continue;
    }
    try {
      const exp = mod.default;
      if (exp === undefined) throw new Error('no default export (expected a function returning a page object or an array of them)');
      const result = typeof exp === 'function' ? await exp() : exp;
      for (const p of Array.isArray(result) ? result : [result]) {
        if (!p || typeof p.path !== 'string') throw new Error('returned a page without a string `path`');
        pages.push({ ...p, module: f });
      }
    } catch (err) {
      errors.push(`src/pages/${f}: failed to build page data: ${err?.stack || err}`);
    }
  }
  return { pages, errors };
}

/** Render pages through the layout (imported fresh when `bust` is given). */
export async function renderPages(pages, { bust = '' } = {}) {
  const { layout } = await import(pathToFileURL(join(SRC, 'lib', 'layout.mjs')).href + bust);
  const rendered = new Map();
  const errors = [];
  for (const p of pages) {
    try {
      rendered.set(p.path, layout(p, p.body));
    } catch (err) {
      errors.push(`${p.path} (src/pages/${p.module}): failed to render: ${err?.stack || err}`);
    }
  }
  return { rendered, errors };
}

// Case-sensitive set of every servable file ("/assets/css/site.css", …). GitHub
// Pages is case-sensitive even though Windows file checks are not.
export function servableFiles() {
  const out = new Set(BUILD_OUTPUTS);
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (prefix === '' && ['.git', 'node_modules', 'src'].includes(entry.name)) continue;
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), rel);
      else out.add(rel);
    }
  };
  walk(ROOT, '');
  return out;
}

// Voice rules (brief.md). The tagline is the one allowed "Masterfully".
const BANNED = [
  /\belite\b/i, /\bpremier\b/i, /\bmasterfully\b/i, /\bcutting[-‑ ]edge\b/i, /\bseamless(ly)?\b/i, /\bleverag(e|es|ed|ing)\b/i,
  /\bempower(s|ed|ing)?\b/i, /\bunlock(s|ed|ing)?\b/i, /\belevat(e|es|ed|ing)\b/i, /\brobust\b/i, /\bsynerg(y|ies)\b/i,
  /\bworld[-‑ ]class\b/i, /\bstate[-‑ ]of[-‑ ]the[-‑ ]art\b/i, /\bgame[-‑ ]?changer\b/i, /\bbespoke\b/i,
  /in today[’']s digital age/i, /look no further/i,
];
// Compliance words (compliance.md / brief decisions). Warnings for a human to review.
const COMPLIANCE = [
  /\blicensed\b/i, /\bcertified\b/i, /\bbonded\b/i, /\bdrones?\b/i, /\baerial\b/i, /\bbird[’']s[-‑ ]eye\b/i, /\bFAA\b/,
  /\bforensics?\b/i, /\bCCTV\b/i, /\bsurveillance\b/i, /\balarm (system )?install/i, /\bcamera install/i, /\bAggregateRating\b/,
];
// The approved DPS disclosure (“Hire a licensed company…”) appears mid-sentence on some pages too.
const ALLOWED_PHRASES = [SITE.slogan, /hire a licensed company/gi];

const stripScripts = (s) => s.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
export const visibleText = (htmlText) => {
  let body = htmlText.replace(/^[\s\S]*?<body\b[^>]*>/i, '');
  body = stripScripts(body).replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ').replace(/<[^>]+>/g, ' ');
  let text = decode(body).replace(/\s+/g, ' ');
  for (const p of ALLOWED_PHRASES) text = typeof p === 'string' ? text.split(p).join(' ') : text.replace(p, ' ');
  return text;
};
const snippet = (text, m) => text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).trim();

// The two-hour acknowledgment is a business-hours promise everywhere; keep it qualified.
const TWO_HOUR_UNQUALIFIED = /acknowledg[^.]{0,60}within (?:two|2) hours(?! during (?:business|those) hours)/i;

// Content JSON is published with the repo (src/ is served by GitHub Pages), so owner-only notes
// must never live there. Returns one error per file that still has an `owner_flags` key.
export function contentNoteErrors(dir = join(SRC, 'content')) {
  const errors = [];
  const walk = (d) => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith('.json')) {
        try {
          const data = JSON.parse(readFileSync(f, 'utf8'));
          if (data && typeof data === 'object' && !Array.isArray(data) && 'owner_flags' in data) {
            errors.push(`${f.slice(ROOT.length + 1).replace(/\\/g, '/')}: has "owner_flags" — owner notes belong in the private OWNER-NOTES.md, not in published content`);
          }
        } catch (err) {
          errors.push(`${f.slice(ROOT.length + 1)}: JSON does not parse: ${err.message}`);
        }
      }
    }
  };
  walk(dir);
  return errors;
}

/**
 * Validate page data + rendered HTML.
 * partial: links may also point at knownPaths()/files on disk; anchors only verified on rendered pages.
 */
export function check(pages, rendered, { partial = false, strict = false, cssText = '', stale = [] } = {}) {
  const errors = [...contentNoteErrors()];
  const warnings = [];
  const known = new Set(knownPaths());
  const seen = { title: new Map(), description: new Map(), path: new Set() };

  for (const p of pages) {
    if (seen.path.has(p.path)) errors.push(`Duplicate path ${p.path} (src/pages/${p.module})`);
    seen.path.add(p.path);
    if (!(p.path.endsWith('/') || p.path.endsWith('.html')) || !p.path.startsWith('/')) errors.push(`${p.path}: path must start with / and end with / or .html`);
    if (!known.has(p.path)) warnings.push(`${p.path}: not in the IA (knownPaths() in src/site.mjs)`);
    for (const k of ['title', 'description']) {
      if (!p[k]) {
        errors.push(`${p.path}: missing ${k}`);
        continue;
      }
      if (p.noindex) continue;
      if (seen[k].has(p[k])) errors.push(`${p.path}: duplicate ${k} (also on ${seen[k].get(p[k])})`);
      else seen[k].set(p[k], p.path);
    }
    if (p.title && p.title.length > 60) warnings.push(`${p.path}: title is ${p.title.length} chars (> 60)`);
    if (p.description && (p.description.length < 110 || p.description.length > 160)) warnings.push(`${p.path}: description is ${p.description.length} chars (want 110–160)`);
    for (const k of ['title', 'description', 'imageAlt', 'ogTitle']) {
      if (p[k] && /sold in a week/i.test(p[k])) errors.push(`${p.path}: "sold in a week" must not appear in ${k}`);
    }
  }

  if (!partial) {
    const missing = [...known].filter((k) => !rendered.has(k));
    if (missing.length) (strict ? errors : warnings).push(`IA pages not built yet (${missing.length}): ${missing.join(' ')}`);
  }

  const files = servableFiles();
  // Pages a previous build wrote that this build will delete must not satisfy links.
  for (const rel of stale) files.delete(rel.endsWith('/') ? `${rel}index.html` : rel);
  const pageIds = new Map();
  const idsOf = (htmlText) => {
    if (!pageIds.has(htmlText)) pageIds.set(htmlText, new Set([...stripScripts(htmlText).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return pageIds.get(htmlText);
  };

  // CSS url(...) references (fonts, images) must exist.
  for (const m of cssText.matchAll(/url\(\s*["']?(\/[^"')?#]+)/g)) {
    if (!files.has(m[1])) errors.push(`site.css: missing file ${m[1]}`);
  }

  for (const [path, htmlText] of rendered) {
    const markup = stripScripts(htmlText);
    const h1s = (markup.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) errors.push(`${path}: has ${h1s} <h1> elements (want exactly 1)`);

    for (const m of markup.matchAll(/<img\b[^>]*>/gi)) if (!/\salt="/i.test(m[0])) errors.push(`${path}: <img> without alt: ${m[0].slice(0, 120)}`);

    for (const m of markup.matchAll(/<a\b[^>]*\starget="_blank"[^>]*>/gi)) {
      const rel = /\srel="([^"]*)"/i.exec(m[0]);
      if (!rel || !/\bnoopener\b/.test(rel[1])) errors.push(`${path}: target="_blank" without rel="noopener": ${m[0].slice(0, 120)}`);
    }

    for (const m of htmlText.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const data = JSON.parse(m[1]);
        const s = JSON.stringify(data);
        if (/"@type":"(AggregateRating|Review|HowTo|SearchAction)"/.test(s)) errors.push(`${path}: JSON-LD contains a forbidden type (Review/AggregateRating/HowTo/SearchAction)`);
        if (/"streetAddress"|"geo"/.test(s)) errors.push(`${path}: JSON-LD must not publish a street address or geo coordinates`);
      } catch (err) {
        errors.push(`${path}: JSON-LD does not parse: ${err.message}`);
      }
    }

    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (dup.length) errors.push(`${path}: duplicate id(s): ${dup.join(', ')}`);

    // Internal links, assets and #fragments (case-sensitive).
    const refs = [...markup.matchAll(/\s(?:href|src|action|poster|data)="(\/[^"#?]*)(?:\?[^"#]*)?(?:#([^"]*))?"/g)].map((m) => ({ ref: m[1], frag: m[2] }));
    const srcsets = [...markup.matchAll(/\s(?:srcset|imagesrcset)="([^"]+)"/g)].flatMap((m) =>
      m[1].split(',').map((s) => ({ ref: s.trim().split(/\s+/)[0].split('?')[0] })),
    );
    // External scripts: stripScripts() removed them from `markup`, so read their src from htmlText.
    const scripts = [...htmlText.matchAll(/<script\b[^>]*?\ssrc="(\/[^"#?]*)(?:\?[^"#]*)?"/gi)].map((m) => ({ ref: m[1] }));
    // Absolute URLs on our own origin (og:image, twitter:image, canonical).
    const own = [...htmlText.matchAll(new RegExp(`\\s(?:content|href)="${SITE.origin.replace(/\./g, '\\.')}(/[^"#?]*)`, 'g'))].map((m) => ({ ref: m[1], own: true }));
    for (const { ref, frag, own: isOwn } of [...refs, ...srcsets, ...scripts, ...own]) {
      if (!ref.startsWith('/') || ref.startsWith('//')) continue;
      let decoded;
      try {
        decoded = decodeURIComponent(ref);
      } catch {
        errors.push(`${path}: malformed URL ${ref}`);
        continue;
      }
      const target = rendered.get(decoded);
      const onDisk = decoded.endsWith('/') ? files.has(`${decoded}index.html`) : files.has(decoded);
      const plannedPage = known.has(decoded);
      if (target === undefined && !onDisk) {
        if (plannedPage && !partial && !strict) warnings.push(`${path}: links to ${decoded} (IA page not built yet)`);
        else if (!(plannedPage && partial)) errors.push(`${path}: broken ${isOwn ? 'absolute URL' : 'link/asset'} ${ref}`);
        continue;
      }
      if (frag && target !== undefined && !idsOf(target).has(frag)) errors.push(`${path}: link to missing anchor ${ref}#${frag}`);
    }
    for (const m of markup.matchAll(/\shref="#([^"]+)"/g)) {
      if (!idsOf(htmlText).has(m[1])) errors.push(`${path}: link to missing anchor #${m[1]}`);
    }
    for (const m of markup.matchAll(/\saria-(?:controls|labelledby|describedby)="([^"]+)"/g)) {
      for (const id of m[1].split(/\s+/)) if (!idsOf(htmlText).has(id)) errors.push(`${path}: aria reference to missing id "${id}"`);
    }

    // Copy warnings (visible text only).
    const text = visibleText(htmlText);
    for (const re of BANNED) {
      const m = re.exec(text);
      if (m) warnings.push(`${path}: banned word "${m[0]}" in "…${snippet(text, m)}…"`);
    }
    for (const re of COMPLIANCE) {
      const m = re.exec(text);
      if (m) warnings.push(`${path}: compliance word "${m[0]}" — review: "…${snippet(text, m)}…"`);
    }
    const two = TWO_HOUR_UNQUALIFIED.exec(text);
    if (two) warnings.push(`${path}: two-hour acknowledgment without "during business hours": "…${snippet(text, two)}…"`);
    const alts = [...markup.matchAll(/\salt="([^"]*)"/g)].map((m) => m[1]).join(' ');
    const headings = [...markup.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/g)].map((m) => m[1]).join(' ');
    if (/sold in a week/i.test(alts + ' ' + headings)) errors.push(`${path}: "sold in a week" used in a heading or alt text`);
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

// lastmod changes only when a page's own content changes (not on CSS/JS tweaks).
function lastmods(pages) {
  const cache = existsSync(LASTMOD_CACHE) ? JSON.parse(readFileSync(LASTMOD_CACHE, 'utf8')) : {};
  const next = {};
  for (const p of pages) {
    const hash = createHash('sha256').update(`${p.title}\n${p.description}\n${toString(p.body)}`).digest('hex').slice(0, 16);
    next[p.path] = cache[p.path]?.hash === hash ? cache[p.path] : { hash, date: BUILD_DATE };
  }
  return next;
}

function sitemap(pages, dates) {
  const urls = pages
    .filter((p) => !p.noindex && p.canonical !== false && !p.path.endsWith('.html'))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((p) => `  <url>\n    <loc>${new URL(p.path, SITE.origin).href}</loc>\n    <lastmod>${dates[p.path].date}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const robots = () => `# ${SITE.name}\nUser-agent: *\nAllow: /\nDisallow: /src/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`;

const manifest = () =>
  JSON.stringify(
    {
      name: SITE.name,
      short_name: SITE.shortName,
      description: SITE.description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: SITE.themeColor.light,
      theme_color: SITE.themeColor.light,
      icons: [
        { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/assets/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ) + '\n';

async function main() {
  const opts = parseArgs();
  const partial = Boolean(opts.pages);
  const { pages, errors: loadErrors } = await loadPages(opts.pages);
  const { rendered, errors: renderErrors } = await renderPages(pages);
  let css = { css: '', version: '', files: [] };
  const cssErrors = [];
  try {
    css = bundleCss();
  } catch (err) {
    cssErrors.push(`CSS bundle: ${err.message}`);
  }

  // Validate everything before touching the working tree, so a failed build
  // never leaves half-broken HTML behind to be committed.
  const previous = existsSync(GENERATED_LIST) ? JSON.parse(readFileSync(GENERATED_LIST, 'utf8')) : [];
  const stale = partial ? [] : previous.filter((rel) => !rendered.has(rel));
  const { errors, warnings } = check(pages, rendered, { partial, strict: opts.strict, cssText: css.css, stale });
  const allErrors = [...loadErrors, ...renderErrors, ...cssErrors, ...errors];
  warnings.forEach((w) => console.warn(`warn  ${w}`));
  if (allErrors.length) {
    allErrors.forEach((e) => console.error(`error ${e}`));
    console.error(`Build failed with ${allErrors.length} error(s), ${warnings.length} warning(s); no files were written.`);
    process.exit(1);
  }
  const summary = `${rendered.size} page(s), ${css.files.length} CSS file(s) (${(css.css.length / 1024).toFixed(1)} KB, v=${css.version}), ${warnings.length} warning(s)`;
  if (opts.check) {
    console.log(`Check passed: ${summary}. No files written.`);
    return;
  }

  mkdirSync(join(ROOT, 'assets', 'css'), { recursive: true });
  writeFileSync(join(ROOT, 'assets', 'css', 'site.css'), css.css);
  for (const [path, htmlText] of rendered) {
    const file = outFileFor(path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, htmlText);
  }
  if (partial) {
    console.log(`Built ${summary}. Partial build (--pages): sitemap.xml, robots.txt, site.webmanifest and cleanup skipped.`);
    return;
  }

  // Remove pages generated by a previous build that no longer exist. Only paths
  // this script wrote (listed in generated.json) are ever deleted.
  for (const rel of stale) {
    const file = outFileFor(rel);
    if (existsSync(file)) rmSync(file);
    const dir = dirname(file);
    if (dir !== ROOT && existsSync(dir) && statSync(dir).isDirectory() && readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
  }
  const dates = lastmods(pages);
  mkdirSync(dirname(GENERATED_LIST), { recursive: true });
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap(pages, dates));
  writeFileSync(join(ROOT, 'robots.txt'), robots());
  writeFileSync(join(ROOT, 'site.webmanifest'), manifest());
  writeFileSync(GENERATED_LIST, JSON.stringify([...rendered.keys()].sort(), null, 2) + '\n');
  writeFileSync(LASTMOD_CACHE, JSON.stringify(dates, null, 2) + '\n');
  console.log(`Built ${summary}.`);
}

// Run only when executed directly (dev.mjs imports the functions above).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
