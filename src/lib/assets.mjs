import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { html, raw } from './html.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STYLES_DIR = join(ROOT, 'src', 'styles');

const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 10);

// ---------------------------------------------------------------------------
// CSS bundle: src/styles/*.css (sorted by file name) then src/styles/pages/*.css
// (sorted) → /assets/css/site.css. Computed from the SOURCES on every call, so the
// ?v= hash always matches the CSS this build/dev request actually serves.
//
// Dark tokens: design-final.md §2 needs the same dark declarations twice (system
// dark via prefers-color-scheme, and manual [data-theme="dark"]). Write them once
// inside `:root:not([data-theme="light"]){ … }` and put the marker comment
// `/* @dark-tokens */` inside `:root[data-theme="dark"]{ }`; the bundler copies
// the declarations in.
// ---------------------------------------------------------------------------
export function cssFiles() {
  const list = (dir) =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isFile() && e.name.endsWith('.css'))
          .map((e) => e.name)
          .sort()
          .map((n) => join(dir, n))
      : [];
  return [...list(STYLES_DIR), ...list(join(STYLES_DIR, 'pages'))];
}

function block(css, selector) {
  const start = css.indexOf(selector);
  if (start < 0) return null;
  const open = css.indexOf('{', start + selector.length);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return null;
}

// Light minify: drop comments, collapse whitespace. Quoted strings (content:" › ",
// font names, urls) are protected so their spacing survives.
export function minifyCss(css) {
  const strings = [];
  const out = css
    .replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (m) => {
      if (m.startsWith('/*')) return '';
      strings.push(m);
      return `\u0000${strings.length - 1}\u0000`;
    })
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/:\s+/g, ':')
    .trim();
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => strings[i]) + '\n';
}

/** @returns {{ css: string, version: string, files: string[] }} */
export function bundleCss() {
  const files = cssFiles();
  let css = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  if (css.includes('/* @dark-tokens */')) {
    const dark = block(css, ':root:not([data-theme="light"])');
    if (dark == null) throw new Error('CSS: "/* @dark-tokens */" used but no :root:not([data-theme="light"]) block found');
    css = css.split('/* @dark-tokens */').join(dark);
  }
  css = minifyCss(css);
  return { css, version: hash(css), files };
}

export const cssVersion = () => bundleCss().version;

const TEXT_ASSET = /\.(?:js|mjs|css|json|svg|webmanifest|txt|xml|html)$/i;
/** Version hash for a file under the repo root ("/assets/js/site.js"); 'missing' if absent.
 *  Text assets are hashed with CRLF normalised to LF, so a Windows (core.autocrlf) checkout
 *  gives the same ?v= as the LF blob GitHub Pages serves. */
export function fileVersion(webPath) {
  const file = join(ROOT, webPath.replace(/^\//, ''));
  if (!existsSync(file)) return 'missing';
  const buf = readFileSync(file);
  return hash(TEXT_ASSET.test(file) ? buf.toString('utf8').replace(/\r\n/g, '\n') : buf);
}

/** Append ?v=<hash> to a local /assets/ URL (leaves other URLs untouched). */
export function versioned(src) {
  return src.startsWith('/assets/') && !src.includes('?') ? `${src}?v=${fileVersion(src)}` : src;
}

// ---------------------------------------------------------------------------
// Fonts: only these two are preloaded (design-final.md §3).
// ---------------------------------------------------------------------------
export const FONT_PRELOADS = ['/assets/fonts/newsreader-var.woff2', '/assets/fonts/instrument-sans-var.woff2'];

// ---------------------------------------------------------------------------
// Share images (1200×630, made by src/tools/images.py). A page may set
// `image`/`imageAlt`; otherwise ogImageFor(path) picks the section card.
// ---------------------------------------------------------------------------
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_DEFAULT = {
  src: '/assets/img/og-default.jpg',
  alt: 'Manpasand Technical Services: IT, networks, data, web and photography. Based in Rowlett, TX, serving Dallas–Fort Worth.',
};

const OG_SECTIONS = [
  ['/services/', 'og-services', 'Services'],
  ['/service-areas/', 'og-areas', 'Service areas'],
  ['/guides/', 'og-guides', 'Guides'],
  ['/work/', 'og-work', 'Our work'],
  ['/contact/', 'og-contact', 'Contact'],
  ['/about/', 'og-about', 'About'],
];

// Detail pages with their own card: /services/<slug>/ → og-<slug>.jpg,
// /guides/<slug>/ → og-guide-<slug>.jpg, /service-areas/<slug>/ → og-area-<slug>.jpg,
// /work/<slug>/ → og-work-<slug>.jpg. alt: null → head.mjs describes the page by its H1.
const OG_DETAIL = { services: '', guides: 'guide-', 'service-areas': 'area-', work: 'work-' };

export function ogImageFor(path) {
  const m = path.match(/^\/(services|guides|service-areas|work)\/([a-z0-9-]+)\/$/);
  if (m) {
    const key = `og-${OG_DETAIL[m[1]]}${m[2]}`;
    if (existsSync(join(ROOT, 'assets', 'img', `${key}.jpg`))) return { src: `/assets/img/${key}.jpg`, alt: null };
  }
  for (const [prefix, key, label] of OG_SECTIONS) {
    if (path.startsWith(prefix)) return { src: `/assets/img/${key}.jpg`, alt: `${label}: Manpasand Technical Services, Rowlett, TX` };
  }
  return OG_DEFAULT;
}

// ---------------------------------------------------------------------------
// Responsive photos. Manifest written by src/tools/images.py:
// { key: { widths: [..], width, height, alt } } → /assets/img/<key>-<w>.webp
// ---------------------------------------------------------------------------
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'images.json');
export const IMAGES = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};

export function img(key) {
  const meta = IMAGES[key];
  if (!meta) throw new Error(`Unknown image key: ${key}`);
  return meta;
}

const srcFor = (key, w) => `/assets/img/${key}-${w}.webp`;

export function srcset(key) {
  return img(key).widths.map((w) => `${srcFor(key, w)} ${w}w`).join(', ');
}

export function largest(key, max = 1600) {
  const ws = img(key).widths.filter((w) => w <= max);
  return srcFor(key, ws[ws.length - 1]);
}

/** Entry for page.preload (LCP image). */
export function preloadFor(key, sizes, media) {
  const meta = img(key);
  return { href: srcFor(key, meta.widths[Math.min(1, meta.widths.length - 1)]), imagesrcset: srcset(key), imagesizes: sizes, media };
}

/** Responsive <img>. `sizes` should describe the rendered width. `eager`: true = the
 *  page's LCP image (eager + high priority); any other truthy value = eager only. */
export function picture(key, { alt, sizes = '100vw', cls = '', eager = false } = {}) {
  const meta = img(key);
  const fallback = srcFor(key, meta.widths[Math.min(1, meta.widths.length - 1)]);
  return html`<img src="${fallback}" srcset="${srcset(key)}" sizes="${sizes}" width="${meta.width}" height="${meta.height}" alt="${alt ?? meta.alt}"${cls ? raw(` class="${cls}"`) : ''} ${eager === true ? raw('loading="eager" fetchpriority="high"') : eager ? raw('loading="eager"') : raw('loading="lazy"')} decoding="async">`;
}
