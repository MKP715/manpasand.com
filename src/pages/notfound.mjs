// 404 page: GitHub Pages serves /404.html for every missing URL, so it is
// noindex and claims no canonical URL. Links only — no search box.
import { html } from '../lib/html.mjs';
import { SITE, telHref } from '../site.mjs';
import { primaryActions, relatedLinks, directLine } from '../lib/components.mjs';

export default function notFound() {
  return {
    path: '/404.html',
    title: 'Page Not Found | Manpasand',
    description:
      'That page moved or never existed. Try our services, service areas or guides, or call (715) 255-0420 and we’ll point you to the right place.',
    h1: 'Page not found',
    noindex: true,
    canonical: false,
    body: html`<section class="nf">
  <div class="wrap split split--7-5">
    <div>
      <p class="eyebrow label">Error 404 · Page not found</p>
      <p class="nf-code" aria-hidden="true">4<em>0</em>4</p>
      <h1 class="mt-m">This page isn’t here.</h1>
      <p class="lead">It moved or never existed. If you followed a link to our old one-page site, that content now lives on its own page. Or call <a class="tel" href="${telHref}">${SITE.phone}</a> and we’ll point you to the right place.</p>
      ${primaryActions()}
    </div>
    <div>
      <p class="label">Try one of these</p>
      ${relatedLinks([
        { href: '/services/', title: 'Our services', text: 'IT, networks, conference rooms, databases, websites and photography.', icon: 'layers' },
        { href: '/contact/', title: 'Contact us', text: 'Book a free consultation. We reply within one business day.', icon: 'mail' },
        { href: '/', title: 'Home page', text: 'Start from the top.', icon: 'home' },
      ])}
      <div class="mt-m">${directLine()}</div>
    </div>
  </div>
</section>`,
  };
}
