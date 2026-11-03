import { readFileSync } from 'node:fs';

// Single source of truth for business facts. Every page, the header/footer and
// all structured data read from here, so name/phone/email/hours stay consistent.
// Only facts the owner has confirmed belong here.

export const SITE = {
  origin: 'https://manpasand.com',
  name: 'Manpasand Technical Services',
  shortName: 'Manpasand',
  // Shown only in the footer masthead and the schema `slogan` (design-final.md §0.4).
  slogan: 'Expert Solutions, Masterfully Delivered.',
  meaning: '“Manpasand” means “to one’s liking.”',
  description:
    'Rowlett, Texas–based technical services for small businesses and homes across Dallas–Fort Worth: small business IT, network security, conference room AV, home Wi‑Fi, SQL databases and ETL, web development, tech consulting and photography.',
  phone: '(715) 255-0420',
  phoneE164: '+17152550420',
  email: 'info@manpasand.com',
  // Service-area business: no street address is ever published (owner decision 2026-11-03).
  address: {
    city: 'Rowlett',
    region: 'TX',
    postal: '75088',
    country: 'US',
  },
  serviceArea: 'Dallas–Fort Worth',
  hours: {
    label: 'Mon–Fri, 9 AM – 5 PM Central',
    short: 'Mon–Fri · 9 AM – 5 PM CT',
    range: 'Mon–Fri · 9 AM – 5 PM', // with the zone in its label instead (home running head)
    tz: 'CT',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '17:00',
  },
  // The business's own stated commitments (brief.md). Don't add to these.
  commitments: [
    { key: 'consult', value: 'Free', label: 'Initial consultation' },
    { key: 'quote', value: 'Fixed', label: 'Price quoted before work starts, no hidden fees' },
    { key: 'reply', value: '1 day', label: 'Reply within one business day; critical support acknowledged within two hours during business hours' },
    { key: 'guarantee', value: '14 days', label: 'Workmanship guarantee on the original scope', href: '/terms/#guarantee' },
  ],
  trustLine: ['DFW-based', 'Transparent pricing', 'Insured', 'Confidentiality assured'],
  // Social profiles: intentionally EMPTY. "manpasand" is a common word and the old
  // facebook/twitter/linkedin handles probably belong to someone else. Add only
  // profiles the owner controls, e.g. { linkedin: 'https://www.linkedin.com/company/…' }.
  // Once filled, they appear in the footer and as schema `sameAs`.
  social: {},
  // Contact form → Google Form. Until googleFormUrl AND all four entry IDs are set,
  // the /contact/ form falls back to opening the visitor's email app with a
  // pre-filled message to SITE.email (and says so). How to fill these in:
  //   1. Create a Google Form with four questions: Name (short answer), Email (short
  //      answer), Phone (short answer), Description (paragraph).
  //   2. ⋮ menu → "Get pre-filled link", type a dummy answer in each, "Get link".
  //   3. The link contains entry.NNNNNNN=… for each question: copy each one below in the
  //      form 'entry.NNNNNNN' (keep the 'entry.' prefix).
  //   4. googleFormUrl = the form's public URL ending in /formResponse (replace /viewform);
  //      use the public /viewform link, not the /edit address or a forms.gle short link.
  contactForm: {
    googleFormUrl: null, // e.g. 'https://docs.google.com/forms/d/e/1FAIpQL…/formResponse'
    entries: { name: null, email: null, phone: null, description: null }, // e.g. 'entry.123456789'
  },
  themeColor: { light: '#F5F2EA', dark: '#0E131A' },
};

export const telHref = `tel:${SITE.phoneE164}`;
export const mailHref = `mailto:${SITE.email}`;
// A no-break space sits before the "·" so a wrapped line never starts with the dot.
export const locationLine =`Based in ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal} · Serving ${SITE.serviceArea}`;
export const formConfigured = Boolean(
  SITE.contactForm.googleFormUrl && Object.values(SITE.contactForm.entries).every(Boolean),
);

export const GROUPS = { it: 'IT & networks', 'data-web': 'Data & web', photo: 'Photography' };

// Order here is the order used in navigation, footers and the services hub (ia.json).
// `icon` names a service icon in src/lib/icons.mjs. No camera/CCTV/alarm work:
// Tex. Occ. Code ch. 1702 requires a DPS license to even offer it.
export const SERVICES = [
  {
    slug: 'small-business-it',
    name: 'Small business IT',
    short: 'Small business IT',
    group: 'it',
    icon: 'briefcase',
    audience: 'Businesses',
    summary: 'On-demand IT for small offices and shops: networks, POS systems, computers, printers and day-to-day tech support.',
  },
  {
    slug: 'network-security',
    name: 'Network & cybersecurity',
    short: 'Network security',
    group: 'it',
    icon: 'shield',
    audience: 'Businesses',
    summary: 'Firewalls, segmented Wi‑Fi, guest networks and a walled-off network for smart devices, with every change explained.',
  },
  {
    slug: 'conference-room-av',
    name: 'Conference room AV',
    short: 'Conference room AV',
    group: 'it',
    icon: 'video',
    audience: 'Businesses',
    summary: 'Cameras, microphones, displays and tidy cabling for small meeting rooms, set up for Teams, Zoom or Meet.',
  },
  {
    slug: 'home-network',
    name: 'Home network & Wi‑Fi security',
    short: 'Home Wi‑Fi',
    group: 'it',
    icon: 'home-wifi',
    audience: 'Homes',
    summary: 'Whole-home Wi‑Fi, a locked-down router and a separate network for smart TVs, speakers, thermostats and printers.',
  },
  {
    slug: 'database-consulting',
    name: 'SQL database & ETL',
    short: 'SQL & ETL',
    group: 'data-web',
    icon: 'database',
    audience: 'Remote or on-site',
    summary: 'SQL Server, PostgreSQL and MySQL design, tuning and ETL, on-site in Dallas–Fort Worth or remotely anywhere.',
  },
  {
    slug: 'web-development',
    name: 'Web development',
    short: 'Web development',
    group: 'data-web',
    icon: 'code',
    audience: 'Remote or on-site',
    summary: 'Fast, mobile-friendly websites, WordPress, online stores and web apps for small businesses.',
  },
  {
    slug: 'tech-consulting',
    name: 'Tech consulting',
    short: 'Tech consulting',
    group: 'data-web',
    icon: 'compass',
    audience: 'Homes & businesses',
    summary: 'A plain-English review of your tech, vendors and spending, then a written plan you can act on.',
  },
  {
    slug: 'photography',
    name: 'Photography',
    short: 'Photography',
    group: 'photo',
    icon: 'camera',
    audience: 'Homes & businesses',
    summary: 'Real estate listing photos, headshots, corporate events, family portraits and product photos across DFW.',
  },
];

export const servicesByGroup = () =>
  Object.entries(GROUPS).map(([key, label]) => ({ key, label, services: SERVICES.filter((s) => s.group === key) }));

export const serviceBySlug = (slug) => {
  const s = SERVICES.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown service slug: ${slug}`);
  return s;
};

export const AREAS = [
  { slug: 'rowlett-tx', city: 'Rowlett', county: 'Dallas & Rockwall Counties' },
  { slug: 'rockwall-tx', city: 'Rockwall', county: 'Rockwall County' },
  { slug: 'garland-tx', city: 'Garland', county: 'Dallas County' },
  { slug: 'sachse-tx', city: 'Sachse', county: 'Dallas & Collin Counties' },
  { slug: 'richardson-tx', city: 'Richardson', county: 'Dallas & Collin Counties' },
  { slug: 'plano-tx', city: 'Plano', county: 'Collin & Denton Counties' },
];

export const areaBySlug = (slug) => {
  const a = AREAS.find((x) => x.slug === slug);
  if (!a) throw new Error(`Unknown area slug: ${slug}`);
  return a;
};

// Served on-site without a dedicated page.
export const MORE_AREAS = ['Dallas', 'Wylie', 'Mesquite', 'Murphy', 'Heath', 'Royse City', 'Fate', 'Frisco', 'McKinney', 'Allen', 'Fort Worth', 'Arlington', 'Irving', 'Grapevine'];

export const GUIDES = [
  {
    slug: 'texas-data-breach-notification',
    title: 'Texas data breach notification law, explained',
    summary: 'Who a Texas business must notify after a data breach, and by when.',
  },
  {
    slug: 'power-outage-protection-office-tech',
    title: 'Protecting office tech from power outages',
    summary: 'What to put on a UPS, how to size it, and what to do before and after an outage.',
  },
  {
    slug: 'conference-room-video-setup-checklist',
    title: 'Conference room video setup checklist',
    summary: 'Camera, microphones, display, cabling and network for a meeting room that just works.',
  },
  {
    slug: 'prepare-home-for-real-estate-photos',
    title: 'How to prep your home for real estate photos',
    summary: 'A room-by-room checklist for sellers and agents before the photographer arrives.',
  },
];

// Testimonials the owner confirmed are real. Quote verbatim; never add ratings.
export const REVIEWS = JSON.parse(readFileSync(new URL('./content/reviews.json', import.meta.url), 'utf8'));

// Header navigation (design-final.md §6.1). The primary CTA ("Free consultation" → /contact/)
// and the phone link are rendered separately by the layout.
export const NAV = [
  { href: '/services/', label: 'Services', hint: String(SERVICES.length).padStart(2, '0'), groups: true },
  { href: '/work/', label: 'Work', hint: 'Case study' },
  { href: '/service-areas/', label: 'Service areas', hint: 'DFW' },
  { href: '/guides/', label: 'Guides', hint: String(GUIDES.length).padStart(2, '0') },
  { href: '/about/', label: 'About' },
  { href: '/faq/', label: 'FAQ' },
];

export const FOOTER_COMPANY = [
  { href: '/work/', label: 'Our work' },
  { href: '/reviews/', label: 'Reviews' },
  { href: '/guides/', label: 'Guides' },
  { href: '/about/', label: 'About' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/contact/', label: 'Contact' },
];

const STATIC_PATHS = [
  '/',
  '/services/',
  '/service-areas/',
  '/work/',
  '/work/mahnken-painting-website/',
  '/reviews/',
  '/about/',
  '/contact/',
  '/faq/',
  '/guides/',
  '/privacy/',
  '/terms/',
  '/404.html',
];

/** Every page path in the final IA (ia.json). Used by partial builds to validate links. */
export function knownPaths() {
  return [
    ...STATIC_PATHS,
    ...SERVICES.map((s) => `/services/${s.slug}/`),
    ...AREAS.map((a) => `/service-areas/${a.slug}/`),
    ...GUIDES.map((g) => `/guides/${g.slug}/`),
  ];
}
