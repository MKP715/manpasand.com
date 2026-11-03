// Tiny HTML templating helpers. `html` escapes interpolated values unless they
// are wrapped with raw() or are the result of another html`` call.

const RAW = Symbol('raw');

export function raw(value) {
  return { [RAW]: true, value: String(value ?? '') };
}

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function render(value) {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (typeof value === 'object' && value[RAW]) return value.value;
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return raw(out);
}

export function toString(fragment) {
  return render(fragment);
}

// Only these link targets may appear in content; anything else fails the build.
export function safeHref(href) {
  if (!/^(https?:\/\/|mailto:|tel:|sms:|\/|#)/.test(href)) throw new Error(`Unsafe link in content: ${href}`);
  return href;
}

const emphasis = (s) =>
  s
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, '$1<em>$2</em>');

// Inline-only markdown: **bold**, *em*, [text](url). Input is escaped first and
// links are pulled out before emphasis so asterisks in URLs are left alone.
export function inline(text) {
  const links = [];
  let s = esc(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    links.push({ label, href: safeHref(href) });
    return `\u0000${links.length - 1}\u0000`;
  });
  s = emphasis(s).replace(/\u0000(\d+)\u0000/g, (_, i) => {
    const { label, href } = links[i];
    const external = /^https?:/.test(href);
    return `<a href="${href}"${external ? ' rel="noopener"' : ''}>${emphasis(label)}</a>`;
  });
  return raw(s);
}

export function jsonLd(data) {
  // Escape "<" so a string can never close the script tag.
  const json = JSON.stringify(data, null, 0).replace(/</g, '\\u003c');
  return raw(`<script type="application/ld+json">${json}</script>`);
}
