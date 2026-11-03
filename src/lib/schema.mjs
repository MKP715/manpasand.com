// Structured data (JSON-LD @graph). One business node site-wide; every page adds
// its WebPage (+ BreadcrumbList) and whatever page-specific nodes it passes in
// `page.schema`. Rules (brief.md, seo-map.json schema_notes):
//   - ProfessionalService, address WITHOUT street, no geo, no priceRange.
//   - No business sameAs until SITE.social has owner-verified profiles (City nodes do carry Wikipedia sameAs).
//   - No Review / AggregateRating / HowTo / SearchAction, ever.
//   - FAQPage only for FAQs visible on the page.

import { SITE, AREAS, MORE_AREAS, SERVICES } from '../site.mjs';

export const BIZ_ID = `${SITE.origin}/#business`;
export const SITE_ID = `${SITE.origin}/#website`;

export const abs = (path) => new URL(path, SITE.origin).href;
const ref = (id) => ({ '@id': id });

const W = 'https://en.wikipedia.org/wiki/';
const CITY_WIKI = {
  Rowlett: 'Rowlett,_Texas', Rockwall: 'Rockwall,_Texas', Garland: 'Garland,_Texas', Sachse: 'Sachse,_Texas',
  Richardson: 'Richardson,_Texas', Plano: 'Plano,_Texas', Dallas: 'Dallas', Wylie: 'Wylie,_Texas',
  Mesquite: 'Mesquite,_Texas', Murphy: 'Murphy,_Texas', Heath: 'Heath,_Texas', 'Royse City': 'Royse_City,_Texas',
  Fate: 'Fate,_Texas', Frisco: 'Frisco,_Texas', McKinney: 'McKinney,_Texas', Allen: 'Allen,_Texas',
  'Fort Worth': 'Fort_Worth,_Texas', Arlington: 'Arlington,_Texas', Irving: 'Irving,_Texas', Grapevine: 'Grapevine,_Texas',
};
/** City node with its Wikipedia sameAs. Throws for a city without one, so new areas can't ship bare. */
export const cityNode = (name) => {
  if (!CITY_WIKI[name]) throw new Error(`cityNode: no Wikipedia sameAs for "${name}"`);
  return { '@type': 'City', name: `${name}, TX`, sameAs: W + CITY_WIKI[name] };
};
export const areaServedCities = () => [...new Set([...AREAS.map((a) => a.city), ...MORE_AREAS])].map(cityNode);

const hoursSpec = () => [
  { '@type': 'OpeningHoursSpecification', dayOfWeek: SITE.hours.days, opens: SITE.hours.opens, closes: SITE.hours.closes },
];

export function businessNode({ logo = '/assets/img/logo-512.png', image = '/assets/img/og-default.jpg' } = {}) {
  const sameAs = Object.values(SITE.social || {}).filter(Boolean);
  return {
    '@type': 'ProfessionalService',
    '@id': BIZ_ID,
    name: SITE.name,
    alternateName: SITE.shortName,
    slogan: SITE.slogan,
    description: SITE.description,
    url: `${SITE.origin}/`,
    telephone: SITE.phoneE164,
    email: SITE.email,
    logo: { '@type': 'ImageObject', url: abs(logo), width: 512, height: 512 },
    image: abs(image),
    currenciesAccepted: 'USD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postal,
      addressCountry: SITE.address.country,
    },
    areaServed: areaServedCities(),
    openingHoursSpecification: hoursSpec(),
    contactPoint: contactPointNode(),
    knowsAbout: [
      'Small business IT support',
      'Network security',
      'Firewalls',
      'Wi‑Fi networks',
      'Conference room audio-visual setup',
      'SQL Server',
      'PostgreSQL',
      'MySQL',
      'ETL',
      'Web development',
      'WordPress',
      'Technology consulting',
      'Real estate photography',
      'Event photography',
      'Portrait photography',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', '@id': `${abs(`/services/${s.slug}/`)}#service`, name: s.name, url: abs(`/services/${s.slug}/`) },
      })),
    },
    ...(sameAs.length && { sameAs }),
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${SITE.origin}/`,
    name: SITE.name,
    alternateName: SITE.shortName,
    publisher: ref(BIZ_ID),
    inLanguage: 'en-US',
  };
}

/** WebPage node. `type` = WebPage | CollectionPage | AboutPage | ContactPage | FAQPage | ItemPage … */
export function webPageNode(page, type = 'WebPage') {
  const url = abs(page.path);
  return {
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: ref(SITE_ID),
    ...(page.about !== false && { about: page.about || ref(BIZ_ID) }),
    inLanguage: 'en-US',
    ...(page.image && { primaryImageOfPage: { '@type': 'ImageObject', url: abs(page.image) } }),
    ...(page.crumbs && page.crumbs.length > 1 && { breadcrumb: ref(`${url}#breadcrumb`) }),
    ...(page.mainEntity && { mainEntity: page.mainEntity }),
    ...(page.updated && { dateModified: page.updated }),
  };
}

/** crumbs: [{ label, href }] starting with Home. */
export function breadcrumbNode(page) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${abs(page.path)}#breadcrumb`,
    itemListElement: page.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: abs(c.href) })),
  };
}

/**
 * Service node for a service page (or a city page's local service).
 * remote: true adds the United States to areaServed (database / web work).
 * city: 'Garland' limits areaServed to that city.
 */
export function serviceNode({ name, serviceType = name, description, path, city, remote = false }) {
  const url = abs(path);
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    serviceType,
    description,
    url,
    provider: ref(BIZ_ID),
    areaServed: city ? cityNode(city) : [...areaServedCities(), ...(remote ? [{ '@type': 'Country', name: 'United States' }] : [])],
  };
}

const plain = (text) => String(text).replace(/\*\*|\*|\[([^\]]+)\]\([^)]+\)/g, (m, label) => label || '');

// `a` may be one inline-markdown string or an array of paragraphs (faqList renders each as its own <p>).
const answerText = (a) => (Array.isArray(a) ? a.map(plain).join(' ') : plain(a));

export const faqQuestions = (faqs) =>
  faqs.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: answerText(f.a) } }));

/** FAQ block on a page whose main topic is something else (service, city, guide). Only for VISIBLE FAQs. */
export function faqNode(faqs, path) {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    url: abs(path),
    isPartOf: ref(`${abs(path)}#webpage`),
    mainEntity: faqQuestions(faqs),
  };
}

/**
 * Article (guides, case study). dates are 'YYYY-MM-DD'.
 * extra: e.g. { about: {...}, mentions: [...] } for the case study.
 */
export function articleNode({ path, headline, description, datePublished, dateModified, image = '/assets/img/og-default.jpg', extra = {} }) {
  const url = abs(path);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: String(headline).slice(0, 110),
    description,
    image: [].concat(image).map(abs),
    datePublished,
    dateModified: dateModified || datePublished,
    author: ref(BIZ_ID),
    publisher: ref(BIZ_ID),
    mainEntityOfPage: ref(`${url}#webpage`),
    isPartOf: ref(SITE_ID),
    inLanguage: 'en-US',
    ...extra,
  };
}

/** ItemList for hub pages: items [{ name, path }]. Use as page.mainEntity or in page.schema. */
export function itemListNode(items, path) {
  return {
    '@type': 'ItemList',
    '@id': `${abs(path)}#list`,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(it.path), name: it.name })),
  };
}

/** The business's ContactPoint (phone, email, hours), shown in every page's footer. */
export function contactPointNode() {
  return {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: SITE.phoneE164,
    email: SITE.email,
    areaServed: 'US-TX',
    availableLanguage: 'English',
    hoursAvailable: hoursSpec(),
  };
}

export function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
