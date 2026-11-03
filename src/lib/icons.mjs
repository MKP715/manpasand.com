// Icon set (design-final.md §4).
//
//   icon(name, { size = 20, cls = '', label })   UI icon: 24×24 grid (arrow, arrow-up-right and
//                                                chevron use a 16×16 grid), stroke 1.75, round caps.
//                                                Decorative (aria-hidden) unless `label` is given.
//   serviceIcon(slugOrName, { size = 44, cls }) Service icon: 32×32 grid, stroke 1.5, square joins.
//                                                Outer form in ink, the one meaningful detail (.acc)
//                                                in accent (colours come from CSS: .svc-icon).
//                                                Accepts a service slug or its SERVICES `icon` name.
//   logoMark({ cls, label })                     The crop-mark + ring + safelight-square logo.
//
// No CCTV / camera-surveillance / lock / alarm icon exists on purpose (compliance §1).
import { raw, esc } from './html.mjs';

// 24-unit icons.
const UI = {
  phone: '<path d="M5.5 3.5h3.2l1.6 4.3-2.1 1.4a11.5 11.5 0 0 0 6.6 6.6l1.4-2.1 4.3 1.6v3.2a1.9 1.9 0 0 1-2 1.9A16.6 16.6 0 0 1 3.6 5.5a1.9 1.9 0 0 1 1.9-2z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  check: '<path d="M4.5 12.5l4.5 4.5 10-10"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h12"/>',
  close: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.7v.1"/>',
  alert: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="1"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3M12 14.5V17"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.3c2.1.7 3.5 2.9 3.5 5.7"/>',
  quote: '<path d="M5 18v-5c0-4 2-6.3 5-7l.6 1.6C8.7 8.4 8 10 8 12h3v6zM14 18v-5c0-4 2-6.3 5-7l.6 1.6C17.7 8.4 17 10 17 12h3v6z"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="1"/><circle cx="9" cy="10" r="1.6"/><path d="M3.5 17l5-5 4 4 2.5-2.5 5.5 5.5"/>',
  bolt: '<path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z"/>',
  thermometer: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 10v6.5"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z"/>',
  wifi: '<path d="M3 9.5a13 13 0 0 1 18 0M6 13a8 8 0 0 1 12 0M9 16.3a3.5 3.5 0 0 1 6 0M12 19.3v.1"/>',
  server: '<rect x="4" y="4" width="16" height="7" rx="1"/><rect x="4" y="13" width="16" height="7" rx="1"/><path d="M7.5 7.5h.1M7.5 16.5h.1M11 7.5h6M11 16.5h6"/>',
  database: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  shield: '<path d="M12 3l7.5 2.8v6c0 4.6-3.1 7.9-7.5 9.4-4.4-1.5-7.5-4.8-7.5-9.4v-6z"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="1"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>',
  code: '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14"/>',
  camera: '<path d="M3.5 8.5H7l1.8-2.5h6.4L17 8.5h3.5V19h-17z"/><circle cx="12" cy="13.3" r="3.5"/>',
  home: '<path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
  'home-wifi': '<path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5"/><path d="M9.2 14.2a4 4 0 0 1 5.6 0M12 17v.1"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="1"/><path d="M9 7.5V5h6v2.5M3.5 12.5h17"/>',
  store: '<path d="M4.5 10V20h15V10M3 9.5l1.5-5h15l1.5 5zM10 20v-5h4v5"/>',
  chart: '<path d="M4 4v16h16M8 16v-4M12 16V8M16 16v-6"/>',
  layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
  plug: '<path d="M9 3.5v4M15 3.5v4M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0zM12 16v4.5"/>',
  printer: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="1"/><path d="M7 14h10v6.5H7z"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="1"/><path d="M12 16.5V20M8 20h8"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L19 4M15.5 7.5L18 10M17.5 5.5l2 2"/>',
  refresh: '<path d="M19.5 8A8 8 0 0 0 5 9.5M4.5 16A8 8 0 0 0 19 14.5M19.5 3.5V8H15M4.5 20.5V16H9"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  'star-outline': '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
};

// 16-unit icons (drawn on the mockup's 16 grid).
const UI16 = {
  arrow: '<path d="M2 8h11M9 4l4 4-4 4"/>',
  'arrow-up-right': '<path d="M4.5 11.5l7-7M6 4.5h5.5V10"/>',
  chevron: '<path d="M4 6l4 4 4-4"/>',
};

export const ICON_NAMES = [...Object.keys(UI), ...Object.keys(UI16)].sort();

export function icon(name, { size = 20, cls = '', label } = {}) {
  const small = UI16[name];
  const body = small || UI[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return raw(
    `<svg class="icon${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" viewBox="0 0 ${small ? 16 : 24} ${small ? 16 : 24}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`,
  );
}

// 32-unit service icons, as drawn in design-final-mockup.html.
const SVC = {
  'small-business-it': '<rect x="3" y="6" width="17" height="12" rx="1"/><path d="M11.5 18v4M7 22.5h9"/><rect class="acc" x="23" y="10" width="6" height="15" rx="1"/><path class="acc" d="M25 14h2M25 18h2M25 21h2"/>',
  'network-security': '<path d="M16 3l11 4v8c0 7-4.7 11.6-11 14-6.3-2.4-11-7-11-14V7z"/><path class="acc" d="M12 13l4 7 4-7z"/><circle class="acc" cx="12" cy="13" r="1.6"/><circle class="acc" cx="20" cy="13" r="1.6"/><circle class="acc" cx="16" cy="20" r="1.6"/>',
  'conference-room-av': '<rect x="5" y="4" width="22" height="13" rx="1"/><circle class="acc" cx="16" cy="7" r="1.2"/><path d="M16 17v3"/><ellipse class="acc" cx="16" cy="25" rx="11" ry="3.2"/>',
  'database-consulting': '<ellipse cx="13" cy="7" rx="9" ry="3"/><path d="M4 7v17c0 1.7 4 3 9 3s9-1.3 9-3V7"/><path d="M4 15.5c0 1.7 4 3 9 3s9-1.3 9-3"/><path class="acc" d="M24.5 12H30M27.5 9l3 3-3 3M30 21h-5.5M27 18l-3 3 3 3"/>',
  'web-development': '<rect x="3" y="5" width="26" height="22" rx="1"/><path d="M3 10h26"/><path d="M6.5 7.5h.01M9.5 7.5h.01" stroke-width="2.2"/><path class="acc" d="M13 15l-4 3.5 4 3.5M19 15l4 3.5-4 3.5"/>',
  photography: '<path d="M3 10h6l2.5-3.5h9L23 10h6v16H3z"/><circle class="acc" cx="16" cy="17.5" r="5.2"/><circle cx="16" cy="17.5" r="2"/><path d="M24.5 13.5h1.5"/>',
  'home-network': '<path d="M3.5 15L16 4.5 28.5 15"/><path d="M7 12.5V27h18V12.5"/><path class="acc" d="M11.2 19.3a6.8 6.8 0 0 1 9.6 0M13.6 21.8a3.4 3.4 0 0 1 4.8 0"/><circle class="acc" cx="16" cy="24" r=".6" stroke-width="2"/>',
  'tech-consulting': '<rect x="6" y="5" width="20" height="24" rx="1"/><path d="M12 3h8v4h-8z"/><path class="acc" d="M10 14l2 2 3.5-3.5M10 21l2 2 3.5-3.5"/><path d="M18.5 15h4M18.5 22h4"/>',
};
// SERVICES[].icon names (src/site.mjs) → drawing.
const SVC_ALIAS = {
  briefcase: 'small-business-it',
  shield: 'network-security',
  video: 'conference-room-av',
  database: 'database-consulting',
  code: 'web-development',
  camera: 'photography',
  'home-wifi': 'home-network',
  compass: 'tech-consulting',
};

export function serviceIcon(slugOrName, { size = 44, cls = '' } = {}) {
  const key = SVC[slugOrName] ? slugOrName : SVC_ALIAS[slugOrName];
  if (!key) throw new Error(`Unknown service icon: ${slugOrName}`);
  return raw(
    `<svg class="svc-icon${cls ? ` ${cls}` : ''}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${SVC[key]}</svg>`,
  );
}

/** Logo mark (40-unit grid). Ring + crop marks follow currentColor; the square follows --signal. */
export function logoMark({ cls = '', label } = {}) {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true" focusable="false"';
  return raw(
    `<svg class="logo-mark${cls ? ` ${cls}` : ''}" viewBox="0 0 40 40" ${a11y}><path d="M2.75 11.5V2.75h8.75M28.5 2.75h8.75v8.75M37.25 28.5v8.75H28.5M11.5 37.25H2.75V28.5" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="20" cy="20" r="9.25" fill="none" stroke="currentColor" stroke-width="3.5"/><rect class="logo-sq" x="16.75" y="16.75" width="6.5" height="6.5"/></svg>`,
  );
}
