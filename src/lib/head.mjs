// Everything inside <head>. Owned by the foundation; the presentation layer
// (layout.mjs body chrome) calls head(page) and should not duplicate any of this.

import { html, raw, jsonLd } from './html.mjs';
import { SITE } from '../site.mjs';
import { abs, graph, businessNode, websiteNode, webPageNode, breadcrumbNode } from './schema.mjs';
import { cssVersion, versioned, FONT_PRELOADS, OG_SIZE, ogImageFor } from './assets.mjs';

// Applies the saved Auto/Light/Dark choice before first paint (design-final.md §0.3).
// localStorage key 'theme' = 'light' | 'dark' (absent = Auto). `?theme=light|dark`
// in the URL forces a theme for screenshots without saving it. Also marks <html class="js">.
export const THEME_KEY = 'theme';
const THEME_SCRIPT = `(function(d){d.classList.add('js');var t=null;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}var m=/[?&]theme=(light|dark)(&|$)/.exec(location.search);if(m)t=m[1];if(t==='light'||t==='dark')d.setAttribute('data-theme',t)})(document.documentElement)`;

/**
 * The complete inner HTML of <head> for a page object (contract: see layout.mjs).
 * @returns an html`` fragment
 */
export function head(page) {
  const url = abs(page.path);
  const canonical = page.canonical !== false; // the 404 page claims no canonical identity
  const fallback = ogImageFor(page.path);
  const ogSrc = page.image || fallback.src;
  const ogAlt = page.imageAlt || fallback.alt || `${page.h1 || page.title}: Manpasand Technical Services, Rowlett, TX`;
  const nodes = [
    businessNode(),
    websiteNode(),
    canonical ? webPageNode({ ...page, image: ogSrc }, page.pageType) : null,
    page.crumbs && page.crumbs.length > 1 ? breadcrumbNode(page) : null,
    ...(page.schema || []),
  ];

  return html`<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
${canonical ? html`<link rel="canonical" href="${url}">\n` : ''}${page.noindex ? raw('<meta name="robots" content="noindex, follow">') : raw('<meta name="robots" content="index, follow, max-image-preview:large">')}
<meta name="theme-color" content="${SITE.themeColor.light}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${SITE.themeColor.dark}" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="format-detection" content="telephone=no">
<script>${raw(THEME_SCRIPT)}</script>
${FONT_PRELOADS.map((href) => html`<link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin>\n`)}${(page.preload || []).map(
    (p) =>
      html`<link rel="preload" as="${p.as || 'image'}" href="${p.href}"${p.imagesrcset ? html` imagesrcset="${p.imagesrcset}"` : ''}${p.imagesizes ? html` imagesizes="${p.imagesizes}"` : ''}${p.media ? html` media="${p.media}"` : ''}${p.type ? html` type="${p.type}"` : ''} fetchpriority="high">\n`,
  )}<link rel="stylesheet" href="/assets/css/site.css?v=${cssVersion()}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${page.ogTitle || page.title}">
<meta property="og:description" content="${page.description}">
${canonical ? html`<meta property="og:url" content="${url}">\n` : ''}<meta property="og:image" content="${abs(ogSrc)}">
<meta property="og:image:alt" content="${ogAlt}">
<meta property="og:image:width" content="${OG_SIZE.width}">
<meta property="og:image:height" content="${OG_SIZE.height}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${page.ogTitle || page.title}">
<meta name="twitter:description" content="${page.description}">
<meta name="twitter:image" content="${abs(ogSrc)}">
<meta name="twitter:image:alt" content="${ogAlt}">
${jsonLd(graph(nodes))}
<script src="${versioned('/assets/js/site.js')}" defer></script>
${(page.scripts || []).map((src) => html`<script src="${versioned(src)}" defer></script>\n`)}`;
}
