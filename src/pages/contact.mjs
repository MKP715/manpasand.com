// /contact/ — the request form (#estimate) plus the direct line.
//
// The form has three ways to send, chosen at build time from SITE.contactForm:
//   1. Google Form configured (googleFormUrl + all four entry IDs set):
//      assets/js/contact.js validates, folds the extra answers into "Description"
//      and POSTs to the Google Form (no-cors). Without JS the form posts natively
//      to the same Google Form (the extra fields are hidden then, since only the
//      four mapped questions would arrive).
//   2. Not configured (today): contact.js composes a structured email and opens
//      mailto:SITE.email, and says so before the button. Afterwards it shows the
//      address and a copy button in case no email app opened.
//   3. No JavaScript + not configured: a plain mailto POST (enctype text/plain),
//      so every field still reaches the inbox as "Label=value" lines.
//
// Field `name`s are human labels in mailto mode because the no-JS email body is
// made of them. contact.js finds fields by id, never by name.

import { html, raw, inline } from '../lib/html.mjs';
import { pageHero, section, sectionHead, directLine, faqSection, icon, more } from '../lib/components.mjs';
import { BIZ_ID } from '../lib/schema.mjs';
import { SITE, SERVICES, telHref, mailHref } from '../site.mjs';

const PATH = '/contact/';

// Evaluated per render (not the import-time `formConfigured`) so a test harness can
// switch modes by changing SITE.contactForm before calling this module.
function googleForm() {
  const { googleFormUrl: url, entries = {} } = SITE.contactForm || {};
  const keys = ['name', 'email', 'phone', 'description'];
  if (!url || !keys.every((k) => entries[k])) return null;
  // Fully filled in but malformed → fail the build rather than post to the wrong place.
  const URL_RE = /^https:\/\/docs\.google\.com\/forms(?:\/u\/\d+)?\/d\/e\/[\w-]+\/(?:viewform|formResponse)(?:\?.*)?$/;
  const badUrl = !URL_RE.test(url);
  const badKeys = keys.filter((k) => !/^entry\.\d+$/.test(String(entries[k]).trim()));
  if (badUrl || badKeys.length) {
    throw new Error(
      'SITE.contactForm is misconfigured: ' +
        [
          badUrl && `googleFormUrl must be the public https://docs.google.com/forms/d/e/…/viewform (or …/formResponse) link, not the /edit or forms.gle link (got ${url})`,
          badKeys.length && `entries.${badKeys.join(', entries.')} must look like 'entry.123456789'`,
        ].filter(Boolean).join('; ') +
        '. See README "Contact form (Google Form)".',
    );
  }
  return { url: url.replace(/\/viewform(\?.*)?$/, '/formResponse'), ...entries };
}

// ─── local form helpers (field() in components.mjs covers text/email/tel/textarea;
//     these add a select with an empty first option and checkbox/radio groups) ────
const attr = (name, value) => (value ? raw(` ${name}="${String(value).replace(/"/g, '&quot;')}"`) : '');

function textField({ id, name, label, type = 'text', required, help, autocomplete, inputmode, half, rows, extra, maxlength, cls = '' }) {
  const described = [help && `${id}-help`, `${id}-err`].filter(Boolean).join(' ');
  const common = html` id="${id}" name="${name}"${required ? raw(' required') : ''}${attr('autocomplete', autocomplete)}${attr('inputmode', inputmode)}${attr('maxlength', maxlength)}${extra ? raw(extra) : ''} aria-describedby="${described}"`;
  const control = type === 'textarea' ? html`<textarea${common} rows="${rows || 6}"></textarea>` : html`<input type="${type}"${common}>`;
  return html`<div class="field${half ? ' field--half' : ''}${cls ? ` ${cls}` : ''}">
  <label for="${id}">${label}${required ? html`<span class="req"> (required)</span>` : ''}</label>
  ${control}
  ${help ? html`<p class="help" id="${id}-help">${inline(help)}</p>` : ''}
  <p class="err" id="${id}-err" hidden></p>
</div>`;
}

/** Checkbox / radio group as a nested fieldset. items: [{ value, label?, slug? }] */
// layout: 'list' (1 column, 2 at ≥720 with cols: 2) | 'row' (equal tiles in one row) | 'quad' (4 in a row, 2×2 below 720px)
function choiceGroup({ id, name, legend, type, items, help, half, cols = 1, layout = 'list', extra, cls = '' }) {
  return html`<fieldset class="field choices${half ? ' field--half' : ''}${cls ? ` ${cls}` : ''}" id="${id}"${help ? raw(` aria-describedby="${id}-help"`) : ''}>
  <legend>${legend}</legend>
  ${help ? html`<p class="help" id="${id}-help">${inline(help)}</p>` : ''}
  <div class="choice-grid${cols === 2 ? ' choice-grid--2' : ''}${layout !== 'list' ? ` choice-grid--${layout}` : ''}">
    ${items.map(
      (it, i) => html`<label class="choice" for="${id}-${i + 1}"><input type="${type}" id="${id}-${i + 1}" name="${name}" value="${it.value}"${it.slug ? raw(` data-slug="${it.slug}"`) : ''}${extra ? raw(extra) : ''}><span>${it.label || it.value}</span></label>`,
    )}
  </div>
</fieldset>`;
}

function requestForm() {
  const gf = googleForm();
  // In Google mode the extra answers are detached from the native submit (they'd be
  // dropped) and shown only when JS can fold them into "Description".
  const extra = gf ? ' form="request-extras"' : '';
  const extraCls = gf ? 'js-only' : '';
  const n = gf
    ? { name: gf.name, email: gf.email, phone: gf.phone, details: gf.description }
    : { name: 'Name', email: 'Email', phone: 'Phone', details: 'Details' };
  const action = gf ? gf.url : `${mailHref}?subject=${encodeURIComponent('Consultation request from manpasand.com')}`;
  const formAttrs = gf
    ? html` action="${action}" method="post" data-mode="gform" data-gform="${gf.url}" data-entry-name="${gf.name}" data-entry-email="${gf.email}" data-entry-phone="${gf.phone}" data-entry-description="${gf.description}"`
    : html` action="${action}" method="post" enctype="text/plain" data-mode="mailto" data-mailto="${SITE.email}"`;

  return html`<div class="request" data-hide-actionbar>
<div class="callout callout--warn form-errors" id="form-errors" tabindex="-1" hidden>
  <p class="callout-t">${icon('alert', { size: 16 })}<span id="form-errors-t">Check these fields</span></p>
  <ul></ul>
</div>
<form class="form" id="request-form"${formAttrs}>
  ${gf ? raw('<input type="hidden" name="fvv" value="1"><input type="hidden" name="pageHistory" value="0">') : ''}
  <fieldset>
    <legend>About you</legend>
    <div class="fields">
      ${textField({ id: 'f-name', name: n.name, label: 'Your name', required: true, autocomplete: 'name', half: true })}
      ${textField({ id: 'f-email', name: n.email, label: 'Email', type: 'email', required: true, autocomplete: 'email', half: true })}
      ${textField({ id: 'f-phone', name: n.phone, label: 'Phone', type: 'tel', autocomplete: 'tel', inputmode: 'tel', half: true, help: 'Optional. Include the area code.' })}
      ${choiceGroup({ id: 'f-contact', name: 'Preferred contact', legend: 'Best way to reach you', type: 'radio', half: true, layout: 'row', extra, cls: extraCls, items: [{ value: 'Email' }, { value: 'Phone' }, { value: 'Either' }] })}
    </div>
  </fieldset>
  <fieldset>
    <legend>The job</legend>
    <div class="fields">
      ${choiceGroup({
        id: 'f-services',
        name: 'Services',
        legend: 'Which services? Pick any that fit.',
        type: 'checkbox',
        cols: 2,
        extra,
        cls: extraCls,
        help: 'Not sure? Leave these blank and describe the problem below, or [see all services](/services/).',
        items: SERVICES.map((s) => ({ value: s.name, slug: s.slug })),
      })}
      ${choiceGroup({ id: 'f-for', name: 'For', legend: 'Is this for a business or a home?', type: 'radio', half: true, layout: 'row', extra, cls: extraCls, items: [{ value: 'Business' }, { value: 'Home' }] })}
      ${textField({ id: 'f-city', name: 'City or ZIP', label: 'City or ZIP code', autocomplete: 'address-level2', half: true, extra, cls: extraCls, help: 'Where the work is. Database and web work can be remote.' })}
      ${choiceGroup({ id: 'f-when', name: 'Timeline', legend: 'When would you like it done?', type: 'radio', layout: 'quad', extra, cls: extraCls, items: [{ value: 'Right away' }, { value: 'Within a month' }, { value: 'In 1–3 months' }, { value: 'Just planning' }] })}
      ${textField({
        id: 'f-details',
        name: n.details,
        label: 'What do you need?',
        type: 'textarea',
        rows: 7,
        required: true,
        maxlength: 4000,
        help: 'What isn’t working or what you want built, roughly how many people, devices or rooms, and any deadline. Please don’t include passwords or account numbers.',
      })}
    </div>
  </fieldset>
  <div class="form-actions">
    ${gf
      ? ''
      : html`<div class="callout send-note" id="send-note">
      <p class="callout-t">${icon('mail', { size: 16 })}<span>This opens your email app</span></p>
      <p>The button opens a new email to <strong>${SITE.email}</strong> with your request filled in. Check it and press Send. No email app on this device? Email us directly or call <a class="tel" href="${telHref}">${SITE.phone}</a>.</p>
    </div>`}
    <button class="btn btn-primary btn-lg" type="submit"${gf ? '' : raw(' aria-describedby="send-note"')}><span>${gf ? 'Send request' : 'Open email with my request'}</span>${icon(gf ? 'arrow' : 'mail', { size: 16, cls: gf ? 'arr' : '' })}</button>
    <p class="form-privacy" id="privacy-note">${icon('lock', { size: 16 })}<span>We use what you send to answer you and to do the work you ask for. We don’t sell it. See our ${raw('<a href="/privacy/">privacy policy</a>')}.</span></p>
  </div>
</form>
${gf ? raw('<form id="request-extras" hidden></form>') : ''}
<div class="callout form-status" id="form-status" tabindex="-1" hidden></div>
<template id="tpl-mail">
  <p class="callout-t">${icon('mail', { size: 16 })}<span>Check your email app</span></p>
  <p>A new email to <strong>${SITE.email}</strong> should have opened with your request filled in. Press Send there. We don’t receive anything until you do.</p>
  <p>Nothing opened? Copy your request, paste it into an email to ${SITE.email}, or call <a class="tel" href="${telHref}">${SITE.phone}</a>.</p>
  <p class="mail-long" hidden>Your request is long, and some email apps cut long messages short. Check that all of it is in the new email. If part is missing, use Copy my request and paste it in.</p>
  <div class="copy-row">
    <button class="btn btn-ghost" type="button" data-copy="request">${icon('file', { size: 16 })}<span>Copy my request</span></button>
    <button class="btn btn-ghost" type="button" data-copy="address">${icon('mail', { size: 16 })}<span>Copy email address</span></button>
    <span class="copy-msg" role="status"></span>
  </div>
  <details class="mail-preview">
    <summary>Show the request text</summary>
    <textarea readonly rows="10" aria-label="Your request, as text"></textarea>
  </details>
</template>
<template id="tpl-sent">
  <p class="callout-t">${icon('check', { size: 16 })}<span>Request sent</span></p>
  <p>Thanks. We reply within one business day (${SITE.hours.label}).</p>
  <p>If you haven’t heard from us by then, call <a class="tel" href="${telHref}">${SITE.phone}</a> or email <a href="${mailHref}">${SITE.email}</a>.</p>
</template>
<template id="tpl-fail">
  <p class="callout-t">${icon('alert', { size: 16 })}<span>We couldn’t send your request</span></p>
  <p>Your answers are still in the form. Check your connection and try again, or email <a href="${mailHref}">${SITE.email}</a> or call <a class="tel" href="${telHref}">${SITE.phone}</a>.</p>
</template>
</div>`;
}

function nextSteps() {
  const steps = [
    ['We reply', 'Within one business day, Mon–Fri. We may ask a question or two so we come prepared.'],
    ['Free consultation', 'We talk through what you have and what you need, and tell you plainly what it would take.'],
    ['Written quote', 'A scope of work and a fixed price before anything begins, with any Texas sales tax on its own line. No hidden fees.'],
    ['You decide', 'Nothing starts until you approve the quote.'],
  ];
  return html`<section class="side-card" aria-labelledby="next-h">
  <p class="plate-bar"><span class="label">After you write</span><span class="label">4 steps</span></p>
  <h3 id="next-h" class="side-h">What happens next</h3>
  <ol class="next-steps">${steps.map(([t, d], i) => html`<li><span class="next-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span><strong>${t}</strong>${d}</span></li>`)}</ol>
  <p class="side-foot">Finished work comes with a 14-day workmanship guarantee on the original scope. ${raw('<a href="/terms/#guarantee">Guarantee terms</a>')}.</p>
</section>`;
}

function whereCard() {
  return html`<section class="side-card" aria-labelledby="where-h">
  <p class="plate-bar"><span class="label">Where we work</span><span class="label">DFW</span></p>
  <h3 id="where-h" class="side-h">On-site across Dallas–Fort Worth</h3>
  <p>We’re based in Rowlett and work on-site across the metroplex. Database and web projects can be handled remotely from anywhere.</p>
  ${more({ href: '/service-areas/', label: 'See our service areas' })}
</section>`;
}

const FAQS = [
  {
    q: 'How fast will you respond?',
    a: [
      `We reply within one business day. Our hours are ${SITE.hours.label}, so a request sent on a weekend is answered on the next business day.`,
      `Critical support requests are acknowledged within two hours during business hours. For those, call [${SITE.phone}](${telHref}) rather than using the form.`,
    ],
  },
  {
    q: 'Is the first consultation really free?',
    a: 'Yes. The initial consultation costs nothing and doesn’t commit you to anything. If you want to go ahead, you get a written scope of work and a fixed-price quote, with any Texas sales tax shown as its own line, before any work begins. No hidden fees.',
  },
  {
    q: 'What should I include in my request?',
    a: [
      'What isn’t working or what you want built, roughly how many people, devices or rooms are involved, where the work is, and any deadline. A photo of an error message or a list of your equipment helps too, and you can send those by email.',
      'Please don’t send passwords, account numbers or other sensitive details through the form or by email. If the job needs access to a system, we’ll arrange it with you directly.',
    ],
  },
  {
    q: 'Do you come to us, or work remotely?',
    a: 'Both. We work on-site across Dallas–Fort Worth from our base in Rowlett. Database and web work can be done remotely for clients anywhere. See [our service areas](/service-areas/) for the cities we cover.',
  },
];

export default function contact() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contact', href: PATH },
  ];
  return {
    path: PATH,
    title: 'Contact Us & Free Consultation | Manpasand',
    description:
      'Call (715) 255-0420 or describe the job in a short form. We reply within one business day, Mon–Fri 9–5 CT, and quote a fixed price before work starts.',
    h1: 'Tell us what you need',
    crumbs,
    pageType: 'ContactPage',
    mainEntity: { '@id': BIZ_ID },
    bodyClass: 'page-contact',
    scripts: ['/assets/js/contact.js'],
    body: html`${pageHero({
      crumbs,
      eyebrow: 'Contact · Free consultation',
      h1: html`Tell us what <em>you need</em>`,
      lead: 'Describe the job in the form below, or call if it’s easier to talk it through. We reply within one business day, and every project starts with a free consultation.',
      actions: { label: 'Write to us', href: '#estimate', call: false },
      facts: ['Free consultation', 'Fixed-price quotes', 'Reply in 1 business day', 'Insured'],
      aside: directLine(),
    })}
${section(
  { id: 'estimate', labelledby: 'estimate-h', alt: true, cls: 'contact-form-sec' },
  html`${sectionHead({
    num: '01',
    label: 'Request',
    id: 'estimate-h',
    title: html`Describe the job in <em>your own words.</em>`,
    lead: 'Only your name, email and a few lines about the job are required. The rest helps us come prepared.',
  })}
  <div class="split split--8-4 contact-split">
    ${requestForm()}
    <div class="contact-side">
      ${nextSteps()}
      ${whereCard()}
    </div>
  </div>`,
)}
${faqSection({
  num: '02',
  title: 'Before you write',
  lead: 'Short answers about replies, the free consultation and what to send.',
  more: { href: '/faq/', label: 'All questions' },
  faqs: FAQS,
})}`,
  };
}
