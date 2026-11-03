// /privacy/ and /terms/ — plain-language legal pages (design-final.md §6.15 prose,
// guide-style layout with a sticky "On this page" TOC).
// Honesty: only describe what this static site actually does (no analytics, no cookies,
// one localStorage key for the theme) and only the commitments the business states in
// src/site.mjs. No payment terms, late fees, arbitration or other invented policies —
// owner/legal review is flagged in the build report.
import { html } from '../lib/html.mjs';
import { pageHero, prose, toc, relatedLinks, callout, guideMeta } from '../lib/components.mjs';
import { SITE, telHref, mailHref, formConfigured } from '../site.mjs';

const EFFECTIVE = '2026-11-03';
const PHONE = `[${SITE.phone}](${telHref})`;
const EMAIL = `[${SITE.email}](${mailHref})`;

const legalMeta = (kind, word = 'Updated') => guideMeta({ updated: EFFECTIVE, kind, word });

function legalBody({ sections, intro, related }) {
  return html`<section class="section legal" aria-label="Policy text">
  <div class="wrap guide-grid">
    <div class="legal-main">
      ${intro || ''}
      ${prose(sections, { cls: 'legal-prose' })}
      <div class="legal-more">
        <p class="label">Related pages</p>
        ${relatedLinks(related, { label: 'Related pages' })}
      </div>
    </div>
    <aside class="guide-aside" aria-label="On this page">
      ${toc(sections)}
    </aside>
  </div>
</section>`;
}

// ─── Privacy ───────────────────────────────────────────────────────────────────
const formNow = formConfigured
  ? 'When you send the form, your answers go to a Google Form that we own. Google stores the responses in our Google account and emails us that a new request has arrived. Google’s handling of that data is covered by the [Google Privacy Policy](https://policies.google.com/privacy).'
  : `Right now, sending the form opens your own email app with a message addressed to ${EMAIL}. Nothing is sent until you press send in your email app, and the message then travels like any other email, through your email provider and ours.`;
const formLater = formConfigured
  ? `If you’d rather not use the form, email ${EMAIL} or call ${PHONE} instead.`
  : 'We plan to connect the form to Google Forms. When we do, your answers will be stored by Google in our Google account, under the [Google Privacy Policy](https://policies.google.com/privacy), and this page will be updated to say so.';

const PRIVACY = [
  {
    heading: 'The short version',
    list: [
      'This website has no analytics, no advertising and no tracking. It sets no cookies.',
      'The only thing it stores in your browser is your light or dark theme choice, if you pick one.',
      'What you send us through the contact form, by email or by phone is used to answer you and to do the work you ask for.',
      'We don’t sell personal data.',
      `You can ask us to delete your information at any time: email ${EMAIL}.`,
    ],
  },
  {
    heading: 'What this website collects',
    paragraphs: [
      'The website itself collects nothing about you. There are no analytics or tracking scripts, no advertising, no social media widgets and no cookies. Our fonts and styles are served from this site, so opening a page doesn’t contact Google Fonts or any other outside server.',
    ],
    subsections: [
      {
        heading: 'Your theme choice',
        paragraphs: [
          'If you choose Light or Dark in the footer, your browser remembers that choice in its local storage, under the name “theme”. It stays on your device and is never sent to us. Choosing Auto removes it, and so does clearing this site’s data in your browser.',
        ],
      },
      {
        heading: 'Hosting logs',
        paragraphs: [
          'This site is hosted on GitHub Pages. When you visit, GitHub logs your IP address for security purposes, whether or not you have a GitHub account. We don’t receive or look at those logs. GitHub’s handling of them is covered by the [GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).',
        ],
      },
    ],
  },
  {
    heading: 'What you send us',
    paragraphs: [
      'The [contact form](/contact/) asks for your name, email address, phone number and a description of what you need.',
      formNow,
      formLater,
      'If you email or call us instead, we receive what you send: your email address or phone number, your name and whatever you tell us about the job.',
    ],
  },
  {
    heading: 'How we use it',
    paragraphs: ['We use what you send us to:'],
    list: [
      'reply to you and set up a free consultation',
      'write your scope of work and quote',
      'do the work you ask for, and follow up on it, including the workmanship guarantee',
      'keep ordinary business records of the work we do',
    ],
    after: ['We don’t use it for advertising, and we don’t add you to marketing lists.'],
  },
  {
    heading: 'Who else handles it',
    paragraphs: [
      formConfigured
        ? 'Only the services that carry it: GitHub, which hosts the website; Google, which runs the contact form; and our email and phone providers, which deliver your messages to us.'
        : 'Only the services that carry it: GitHub, which hosts the website, and the email and phone providers that deliver your messages to us.',
      'We don’t share your information with anyone else, unless you ask us to or the law requires it.',
    ],
  },
  {
    heading: 'We don’t sell personal data',
    paragraphs: [
      'We don’t sell personal data to anyone, and that includes sensitive personal data as the [Texas Data Privacy and Security Act](https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm) defines it. We don’t share it for targeted advertising either.',
    ],
  },
  {
    heading: 'Information we see while working for you',
    paragraphs: [
      'IT, network, database and web work can mean seeing your files, passwords, customer records or the inside of your home or office. We use that access only to do the work you asked for, and we keep it confidential.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'We keep messages and project records for as long as we need them to answer you, do the work, honor the guarantee and keep normal business records. When you ask us to delete your information, we do, except for anything the law requires us to keep, such as tax records.',
    ],
  },
  {
    heading: 'Seeing, correcting or deleting your information',
    paragraphs: [
      `To ask what we hold about you, or to have it corrected or deleted, email ${EMAIL} with “Privacy request” in the subject line, or call ${PHONE} (${SITE.hours.label}).`,
      'We reply within one business day and tell you when it’s done. We may need to confirm it’s really you before we change or delete anything.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: ['This website is for adults arranging services. We don’t knowingly collect information from children under 13 through it.'],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: ['If we change how we handle information, we’ll update this page and the date at the top of it.'],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `${SITE.name}, based in ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}. Email ${EMAIL} or call ${PHONE}. Our [terms of service](/terms/) cover the rest of how we work.`,
    ],
  },
];

// ─── Terms ─────────────────────────────────────────────────────────────────────
const TERMS = [
  {
    heading: 'About these terms',
    paragraphs: [
      `These terms cover your use of manpasand.com and set out the commitments ${SITE.name} (“we”, “us”) makes on every project. By using this website, you agree to the website terms below.`,
      'For any project, the written scope of work and quote we give you describe that particular job in detail.',
    ],
  },
  {
    heading: 'Using this website',
    paragraphs: [
      'You’re welcome to read, print and share pages from this site. Please don’t try to disrupt it, get around its security, or present its content as your own.',
    ],
  },
  {
    heading: 'Guides and general information',
    paragraphs: [
      'Our [guides](/guides/), service pages and FAQ are general information, written to help you understand your options. They aren’t legal, tax or financial advice, and they aren’t a quote.',
      'Laws, products and prices change. Each guide shows the date it was last updated and lists its sources. Check those sources, or ask a qualified professional, before relying on a guide for an important decision.',
    ],
  },
  {
    heading: 'Content on this site',
    paragraphs: [
      `The text, drawings and photos on this site belong to ${SITE.name} unless we say otherwise. The fonts are used under the SIL Open Font License. You may quote short passages with a link back to the page; please ask before copying more.`,
    ],
  },
  {
    heading: 'Links to other websites',
    paragraphs: [
      'We link to other websites, such as government sources and mahnkenpainting.com, a client website we built. We don’t control those sites and aren’t responsible for their content or how they handle your information.',
    ],
  },
  {
    heading: 'Quotes and scope',
    list: [
      'The initial consultation is free and doesn’t commit you to anything.',
      'Before any project begins, we give you a written scope of work and a fixed price for it. If Texas sales tax applies to the work, it’s shown as its own line on the quote. No hidden fees.',
      'The fixed price covers the work in that written scope. If you ask for something outside it, we talk it through and agree the addition with you before doing it.',
      'Work starts once you’ve agreed to the scope and the price.',
    ],
  },
  {
    heading: 'Service commitments',
    id: 'guarantee',
    paragraphs: ['These are the commitments we make on every project.'],
    subsections: [
      {
        heading: 'Response times',
        paragraphs: [
          `We reply to every message within one business day. Critical support requests are acknowledged within two hours during business hours (${SITE.hours.label}).`,
          'Acknowledging a request means we’ve received it and are working out the next step with you. It isn’t a promise that the problem will be fixed within that time.',
        ],
      },
      {
        heading: 'Workmanship guarantee',
        paragraphs: [
          'If a defect turns up in work within the original written scope of a project, we remediate it at no cost to you, as long as you report it within 14 days of project completion.',
        ],
        list: [
          '**Defect:** something we did that doesn’t work the way the written scope says it should.',
          '**Original written scope:** the work described in the scope of work you agreed to before the project began.',
          '**Project completion:** the day we finish the work in that scope and tell you it’s done.',
        ],
      },
      {
        heading: 'What the guarantee doesn’t cover',
        list: [
          'Work outside the original written scope. New requests are scoped and quoted separately.',
          'Products made by other companies, such as hardware and software. They carry their manufacturers’ warranties, not ours. If the fault is in how we installed or set up the product, the guarantee covers that workmanship.',
          'Defects reported more than 14 days after project completion.',
        ],
        after: ['This guarantee doesn’t limit any rights you have under Texas law.'],
      },
      {
        heading: 'How to report a defect',
        ordered: true,
        list: [
          `Call ${PHONE} or email ${EMAIL} within 14 days of project completion.`,
          'Tell us which project it is, what isn’t working and when you noticed it. Photos or screenshots help.',
          'We reply within one business day and arrange the fix with you, remotely or on-site.',
        ],
      },
      {
        heading: 'Confidentiality',
        paragraphs: [
          'We keep what we see while working for you confidential, including files, passwords, customer records and your premises, and we use it only to do the work you asked for. Our [privacy policy](/privacy/) explains how we handle information sent through this website.',
        ],
      },
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: ['We may update this page from time to time. The date at the top shows when it last changed.'],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `${SITE.name}, based in ${SITE.address.city}, ${SITE.address.region} ${SITE.address.postal}. Email ${EMAIL} or call ${PHONE}, ${SITE.hours.label}. Common questions are answered in our [FAQ](/faq/).`,
    ],
  },
];

export default function legal() {
  const privacyCrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Privacy policy', href: '/privacy/' },
  ];
  const termsCrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Terms of service', href: '/terms/' },
  ];

  return [
    {
      path: '/privacy/',
      title: 'Privacy Policy | Manpasand',
      description:
        'What information our website and contact form collect, how we use it to answer your request, who else handles it, and how to ask us to delete it.',
      h1: 'Privacy policy',
      crumbs: privacyCrumbs,
      updated: EFFECTIVE,
      bodyClass: 'page-legal',
      body: html`${pageHero({
        crumbs: privacyCrumbs,
        eyebrow: 'Legal',
        h1: html`Privacy <em>policy</em>`,
        lead: 'What our website and contact form collect, what we do with it, who else handles it and how to ask us to delete it. The short version: very little, used only to answer you and do the work you ask for, and we never sell it.',
        meta: legalMeta('Privacy policy'),
        actions: false,
      })}
${legalBody({
  sections: PRIVACY,
  related: [
    { href: '/terms/', title: 'Terms of service', text: 'Quotes, scope and the guarantee.', icon: 'file' },
    { href: '/contact/', title: 'Contact us', text: 'Ask a question or book a consultation.', icon: 'mail' },
  ],
})}`,
    },
    {
      path: '/terms/',
      title: 'Terms of Service | Manpasand',
      description:
        'The terms behind our quotes and projects: how fixed-price scope works, how changes are handled, confidentiality, and the 14-day workmanship guarantee.',
      h1: 'Terms of service',
      crumbs: termsCrumbs,
      updated: EFFECTIVE,
      bodyClass: 'page-legal',
      body: html`${pageHero({
        crumbs: termsCrumbs,
        eyebrow: 'Legal',
        h1: html`Terms of <em>service</em>`,
        lead: 'The ground rules for using this website, and the commitments behind our quotes and projects, including the full terms of the 14-day workmanship guarantee.',
        meta: legalMeta('Terms of service', 'Effective'),
        actions: false,
      })}
${legalBody({
  sections: TERMS,
  intro: callout({
    title: 'Plain-language summary',
    text: 'We’ve written these terms in plain English so they’re easy to follow. They summarize how we work; the written scope of work and quote for your project set out the details of that job.',
  }),
  related: [
    { href: '/privacy/', title: 'Privacy policy', text: 'What we collect and how to delete it.', icon: 'lock' },
    { href: '/faq/', title: 'FAQ', text: 'Quotes, scheduling, support and the guarantee.', icon: 'info' },
    { href: '/contact/', title: 'Contact us', text: 'Ask a question or book a consultation.', icon: 'mail' },
  ],
})}`,
    },
  ];
}
