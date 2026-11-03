// "Fig." schematic drawings (design-final.md §7). Pure SVG strings drawn with the
// shared .fig-* classes (40-components.css), so every figure follows the theme.
//
// Grammar for every figure: viewfinder crop marks at the corners, ink + accent lines
// only (dashed 4 3 = drops / wireless), ONE subject framed by vermilion autofocus
// brackets, numbered ink markers mirrored in an HTML legend, one dimension line
// with a mono label. Essential text is never only inside the SVG: the legend and
// the description carry it.
//
// Most pages should not import this file directly: use plate() / serviceFigure() /
// homeFigure() from components.mjs. Exports here are for custom figures:
//   FIGURES[key] → { n, caption, desc, legend: [..], viewBox, art }   (key = 'home' or a service slug)
//   fig.crop(w,h) fig.num(x,y,n) fig.af(x1,y1,x2,y2) fig.dim(x1,x2,y,label) fig.text(x,y,s,anchor)
//   distanceArt({ from, to, label })  → art for the 480×120 city strip
//   caseStudyArt()                    → art for the 400×210 stacked-pages wireframe

const r = (n) => Math.round(n * 10) / 10;

export const fig = {
  /** Viewfinder crop marks, 22px legs, 14px in from each corner. */
  crop: (w, h) => `<path class="fig-ink" d="M14 36V14h22M${w - 36} 14h22v22M${w - 14} ${h - 36}v22h-22M36 ${h - 14}H14v-22"/>`,
  /** Numbered ink marker (r=11). */
  num: (x, y, n) => `<g class="fig-num"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y}">${n}</text></g>`,
  /** Vermilion autofocus brackets around the subject. */
  af: (x1, y1, x2, y2, leg = 8) =>
    `<path class="fig-af" d="M${x1} ${y1 + leg}v-${leg}h${leg}M${x2 - leg} ${y1}h${leg}v${leg}M${x2} ${y2 - leg}v${leg}h-${leg}M${x1 + leg} ${y2}h-${leg}v-${leg}"/>`,
  /** Mono label (11px, uppercase). */
  text: (x, y, s, anchor = 'start') => `<text class="fig-text" x="${x}" y="${y}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''} dominant-baseline="central">${s}</text>`,
  /** Horizontal dimension line with end ticks, arrowheads and a knocked-out label. */
  dim: (x1, x2, y, label) => {
    const len = x2 - x1;
    const mid = r(x1 + len / 2);
    const textW = label.length * 7.35;
    // Too short for a knocked-out label: put the label above the line instead.
    if (textW + 40 > len) {
      return `<path class="fig-line" d="M${x1} ${y}h${len}M${x1} ${y - 7}v14M${x2} ${y - 7}v14M${x1} ${y}l8-4v8zM${x2} ${y}l-8-4v8z"/><text class="fig-dim" x="${mid}" y="${y - 14}" text-anchor="middle" dominant-baseline="central">${label}</text>`;
    }
    const mask = r(textW + 12);
    return `<path class="fig-line" d="M${x1} ${y}h${len}M${x1} ${y - 7}v14M${x2} ${y - 7}v14M${x1} ${y}l8-4v8zM${x2} ${y}l-8-4v8z"/><rect class="fig-mask" x="${r(mid - mask / 2)}" y="${y - 9}" width="${mask}" height="18"/><text class="fig-dim" x="${mid}" y="${y}" text-anchor="middle" dominant-baseline="central">${label}</text>`;
  },
};
const { crop, num, af, text: t, dim } = fig;
const ports = (x0, y, count, step = 14, w = 10, h = 8) =>
  `<g class="fig-port">${Array.from({ length: count }, (_, i) => `<rect x="${x0 + i * step}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>`;
const DASH = ' stroke-dasharray="4 3"';

// ─── Fig. 1 — home hero: small office, one system (from the approved mockup) ───
const home = {
  n: 1,
  caption: 'Small office · one system',
  desc: 'Line diagram: an internet connection runs to a firewall, then a PoE switch that feeds a Wi‑Fi access point, an office printer, a SQL database server, a point-of-sale workstation and a conference-room display.',
  legend: ['Firewall & router', 'PoE switch', 'Wi‑Fi access point', 'Office printer', 'SQL database server', 'Workstation / POS', 'Conference room display'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-node" x="190" y="34" width="100" height="30"/>${t(240, 49, 'WAN · ISP', 'middle')}
<path class="fig-line" d="M240 64v32"/>
<rect class="fig-node" x="156" y="96" width="168" height="40"/><rect class="fig-signal" x="168" y="112" width="8" height="8"/>${t(186, 116, 'FIREWALL')}${ports(262, 112, 4)}
${num(134, 116, 1)}
<path class="fig-line" d="M240 136v28"/>
<rect class="fig-node" x="64" y="164" width="352" height="36"/>${t(78, 182, 'POE SWITCH')}${ports(196, 178, 12, 16)}
${num(42, 182, 2)}
<path class="fig-line" d="M100 200v44M170 200v50M240 200v45M310 200v46M380 200v46"${DASH}/>
<circle class="fig-node" cx="100" cy="262" r="18"/><circle class="fig-ink" cx="100" cy="262" r="6"/>
<path class="fig-line" d="M77 250a24 24 0 0 0 0 24M70 244a32 32 0 0 0 0 36M123 250a24 24 0 0 1 0 24M130 244a32 32 0 0 1 0 36"/>
<rect class="fig-node" x="156" y="244" width="28" height="12"/><rect class="fig-node" x="148" y="256" width="44" height="20" rx="1"/><rect class="fig-node" x="156" y="268" width="28" height="14"/><circle class="fig-fill" cx="184" cy="262" r="2"/>
<path class="fig-node" d="M218 253v30a22 7 0 0 0 44 0v-30"/><ellipse class="fig-node" cx="240" cy="253" rx="22" ry="7"/><path class="fig-ink" d="M218 268a22 7 0 0 0 44 0"/>
${af(206, 235, 274, 301)}
<rect class="fig-node" x="288" y="246" width="44" height="30" rx="1"/><path class="fig-ink" d="M310 276v9M298 285h24"/><path class="fig-port" d="M296 256h20M296 263h28"/>
<rect class="fig-node" x="348" y="246" width="64" height="36" rx="1"/><circle class="fig-fill" cx="380" cy="251.5" r="2"/><ellipse class="fig-ink" cx="380" cy="298" rx="32" ry="6"/>
${num(100, 326, 3)}${num(170, 326, 4)}${num(240, 326, 5)}${num(310, 326, 6)}${num(380, 326, 7)}
${dim(64, 416, 360, 'ONE POINT OF CONTACT')}`,
};

// ─── Fig. 2 — small business IT: the front counter ───
const sbit = {
  n: 2,
  caption: 'Front counter',
  desc: 'Line diagram of a shop’s front counter: a router and a network switch feed a back-office PC, a point-of-sale terminal with its cash drawer, and a receipt printer, all on one network.',
  legend: ['Router & firewall', 'Network switch', 'Office PC', 'POS terminal & cash drawer', 'Receipt printer'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-node" x="176" y="38" width="128" height="34"/><rect class="fig-signal" x="188" y="51" width="8" height="8"/>${t(204, 55, 'ROUTER')}${ports(258, 51, 3)}
${num(152, 55, 1)}
<path class="fig-line" d="M240 72v34"/>
<rect class="fig-node" x="96" y="106" width="288" height="30"/>${t(110, 121, 'SWITCH')}${ports(232, 117, 9, 16)}
${num(72, 121, 2)}
<path class="fig-line" d="M134 136v58M240 136v50M340 136v54"${DASH}/>
<rect class="fig-node" x="106" y="194" width="52" height="36" rx="1"/><path class="fig-ink" d="M132 230v8M120 238h24"/>
<rect class="fig-node" x="166" y="200" width="16" height="38" rx="1"/><path class="fig-port" d="M170 208h8M170 214h8"/>
<rect class="fig-node" x="212" y="186" width="56" height="38" rx="1"/><path class="fig-port" d="M220 196h26M220 204h40M220 212h18"/>
<path class="fig-ink" d="M234 224l-4 14h20l-4-14"/><rect class="fig-node" x="204" y="238" width="72" height="16"/><path class="fig-ink" d="M232 246h16"/>
${af(194, 176, 286, 262)}
<path class="fig-node" d="M324 212v-22h32v22"/><path class="fig-port" d="M330 198h20M330 204h14"/>
<rect class="fig-node" x="314" y="212" width="52" height="30" rx="1"/><path class="fig-ink" d="M322 222h36"/>
<path class="fig-ink" d="M84 262h312M96 262v38M384 262v38"/>
${num(140, 322, 3)}${num(240, 322, 4)}${num(340, 322, 5)}
${dim(84, 396, 362, 'ONE NETWORK')}`,
};

// ─── Fig. 3 — network security: three networks ───
const netsec = {
  n: 3,
  caption: 'Three networks',
  desc: 'Line diagram: the internet connection enters a firewall, which splits the office into three separate networks: staff computers and files, guest Wi‑Fi for phones, and a devices network for TVs, speakers, thermostats and printers.',
  legend: ['Firewall & router', 'Staff network: computers and files', 'Guest Wi‑Fi', 'Devices network: TVs, speakers, thermostats, printers'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-node" x="186" y="34" width="108" height="28"/>${t(240, 48, 'INTERNET', 'middle')}
<path class="fig-line" d="M240 62v24"/>
<rect class="fig-node" x="150" y="86" width="180" height="42"/><rect class="fig-signal" x="162" y="103" width="8" height="8"/>${t(178, 107, 'FIREWALL')}${ports(266, 103, 4)}
${af(140, 76, 340, 138)}
${num(118, 107, 1)}
<path class="fig-line" d="M200 128v22H100v26M240 128v48M280 128v22h100v26"/>
<rect class="fig-node" x="40" y="176" width="120" height="132"/><rect class="fig-node" x="180" y="176" width="120" height="132"/><rect class="fig-node" x="320" y="176" width="120" height="132"/>
${t(100, 193, 'STAFF', 'middle')}${t(240, 193, 'GUEST', 'middle')}${t(380, 193, 'DEVICES', 'middle')}
<path class="fig-ink" d="M40 208h120M180 208h120M320 208h120"/>
<rect class="fig-node" x="58" y="224" width="44" height="28" rx="1"/><path class="fig-port" d="M64 232h22M64 239h30"/><path class="fig-ink" d="M52 258h56"/>
<rect class="fig-node" x="112" y="226" width="34" height="24" rx="1"/><path class="fig-ink" d="M129 250v6M121 256h16"/>
<rect class="fig-node" x="66" y="272" width="68" height="12"/><rect class="fig-node" x="66" y="286" width="68" height="12"/><path class="fig-port" d="M74 278h6M74 292h6M114 278h12M114 292h12"/>
<rect class="fig-node" x="210" y="222" width="18" height="32" rx="3"/><rect class="fig-node" x="252" y="222" width="18" height="32" rx="3"/><path class="fig-port" d="M215 248h8M257 248h8"/>
<path class="fig-line" d="M222 286a26 26 0 0 1 36 0M229 293a15 15 0 0 1 22 0"/><circle class="fig-fill" cx="240" cy="299" r="2.2"/>
<rect class="fig-node" x="334" y="224" width="48" height="30" rx="1"/><path class="fig-ink" d="M358 254v6M348 260h20"/>
<rect class="fig-node" x="396" y="222" width="26" height="40" rx="4"/><circle class="fig-port" cx="409" cy="248" r="7"/><circle class="fig-port" cx="409" cy="232" r="2.5"/>
<circle class="fig-node" cx="350" cy="286" r="12"/><circle class="fig-port" cx="350" cy="286" r="5"/>
<rect class="fig-node" x="376" y="282" width="46" height="18"/><rect class="fig-node" x="384" y="274" width="30" height="8"/>
${num(100, 330, 2)}${num(240, 330, 3)}${num(380, 330, 4)}
${dim(40, 440, 364, 'SEPARATED')}`,
};

// ─── Fig. 4 — conference room AV: room plan, top-down ───
const confav = {
  n: 4,
  caption: 'Room plan · top-down',
  desc: 'Top-down plan of a meeting room: a display and camera on the front wall with the camera’s field of view spreading across the table, and a table microphone in the centre whose pickup radius covers every seat.',
  legend: ['Display', 'Camera & field of view', 'Table microphone', 'Microphone pickup radius'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<path class="fig-ink" d="M60 40h360v290H150M110 330H60V40"/><path class="fig-ink" d="M110 330v-40"/><path class="fig-port" d="M110 290a40 40 0 0 1 40 40"/>
<rect class="fig-node" x="176" y="44" width="128" height="10"/>
<rect class="fig-node" x="230" y="58" width="20" height="10"/><circle class="fig-fill" cx="240" cy="63" r="2"/>
<path class="fig-line" d="M240 68L100 312M240 68L380 312"${DASH}/>
<circle class="fig-line" cx="240" cy="206" r="124"${DASH}/>
<ellipse class="fig-node" cx="240" cy="206" rx="84" ry="44"/>
<rect class="fig-node" x="196" y="146" width="20" height="12"/><rect class="fig-node" x="230" y="146" width="20" height="12"/><rect class="fig-node" x="264" y="146" width="20" height="12"/>
<rect class="fig-node" x="196" y="254" width="20" height="12"/><rect class="fig-node" x="230" y="254" width="20" height="12"/><rect class="fig-node" x="264" y="254" width="20" height="12"/>
<rect class="fig-node" x="138" y="196" width="12" height="20"/><rect class="fig-node" x="330" y="196" width="12" height="20"/>
<circle class="fig-node" cx="240" cy="206" r="8"/><circle class="fig-fill" cx="240" cy="206" r="2.5"/>
${af(224, 190, 256, 222, 6)}
${num(326, 49, 1)}${num(206, 80, 2)}${num(280, 206, 3)}${num(328, 118, 4)}
<path class="fig-port" d="M364 212v138"${DASH}/>
${dim(240, 364, 362, 'PICKUP RADIUS')}`,
};

// ─── Fig. 5 — database & ETL: the nightly load ───
const db = {
  n: 5,
  caption: 'ETL flow',
  desc: 'Line diagram of an ETL flow: three source systems (point of sale, CRM and spreadsheets) feed a transform step, which loads a data warehouse, which feeds reports.',
  legend: ['Source systems: POS, CRM, spreadsheets', 'Transform: clean, match, de-duplicate', 'Data warehouse', 'Reports & dashboards'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-node" x="40" y="110" width="70" height="30"/><rect class="fig-node" x="40" y="160" width="70" height="30"/><rect class="fig-node" x="40" y="210" width="70" height="30"/>
${t(75, 125, 'POS', 'middle')}${t(75, 175, 'CRM', 'middle')}${t(75, 225, 'SHEETS', 'middle')}
${num(75, 88, 1)}
<path class="fig-line" d="M110 125h24v60M110 175h24M110 225h24v-40M134 185h26"/>
<rect class="fig-node" x="160" y="160" width="96" height="50"/>${t(208, 185, 'TRANSFORM', 'middle')}
${num(208, 138, 2)}
<path class="fig-line" d="M256 185h42"/><path class="fig-head" d="M300 185l-9-4.5v9z"/>
<path class="fig-node" d="M310 148v74a36 10 0 0 0 72 0v-74"/><ellipse class="fig-node" cx="346" cy="148" rx="36" ry="10"/><path class="fig-ink" d="M310 172a36 10 0 0 0 72 0M310 196a36 10 0 0 0 72 0"/>
${af(298, 128, 394, 244)}
${num(418, 185, 3)}
<path class="fig-line" d="M346 244v24"/>
<rect class="fig-node" x="300" y="268" width="92" height="50"/><g class="fig-port"><rect x="314" y="296" width="8" height="14"/><rect x="328" y="286" width="8" height="24"/><rect x="342" y="292" width="8" height="18"/><rect x="356" y="280" width="8" height="30"/><rect x="370" y="290" width="8" height="20"/></g>
${num(418, 293, 4)}
${dim(40, 392, 362, 'NIGHTLY LOAD')}`,
};

// ─── Fig. 6 — web development: site map ───
const webChild = (c) =>
  `<rect class="fig-node" x="${c - 36}" y="220" width="72" height="58"/><path class="fig-ink" d="M${c - 36} 230h72"/><path class="fig-port" d="M${c - 28} 242h40M${c - 28} 250h52M${c - 28} 258h30"/>`;
const web = {
  n: 6,
  caption: 'Site map',
  desc: 'Line diagram of a multi-page website: a home page at the top branches into separate service pages, service-area pages, guides and a contact page.',
  legend: ['Home page', 'Service pages', 'Service-area pages', 'Guides', 'Contact page'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-ghost" x="156" y="30" width="180" height="120"/><rect class="fig-ghost" x="148" y="38" width="180" height="120"/>
<rect class="fig-node" x="140" y="46" width="180" height="120"/>
<path class="fig-ink" d="M140 60h180"/><circle class="fig-fill" cx="148" cy="53" r="2"/><circle class="fig-fill" cx="155" cy="53" r="2"/><circle class="fig-fill" cx="162" cy="53" r="2"/>
<rect class="fig-signal" x="150" y="68" width="7" height="7"/><path class="fig-port" d="M162 72h30M250 72h14M270 72h14M290 72h14"/>
<path class="fig-ink" d="M150 90h90M150 100h70" stroke-width="4"/><path class="fig-port" d="M150 114h100M150 121h80"/>
<rect class="fig-accent" x="150" y="130" width="34" height="10"/>
<rect class="fig-ink" x="262" y="84" width="48" height="40"/><path class="fig-port" d="M262 124l16-16 10 10 8-8 14 14"/>
<path class="fig-port" d="M150 150h46v10h-46zM204 150h46v10h-46zM258 150h52v10h-52z"/>
${af(128, 34, 332, 178)}
${num(108, 106, 1)}
<path class="fig-line" d="M230 166v30M84 196h312M84 196v24M188 196v24M292 196v24M396 196v24"/>
${webChild(84)}${webChild(188)}${webChild(292)}${webChild(396)}
${t(84, 294, 'SERVICES', 'middle')}${t(188, 294, 'AREAS', 'middle')}${t(292, 294, 'GUIDES', 'middle')}${t(396, 294, 'CONTACT', 'middle')}
${num(84, 322, 2)}${num(188, 322, 3)}${num(292, 322, 4)}${num(396, 322, 5)}
${dim(48, 432, 362, 'MULTI-PAGE')}`,
};

// ─── Fig. 7 — photography: contact sheet ───
const FR = [
  [58, 72],
  [184, 72],
  [310, 72],
  [58, 186],
  [184, 186],
  [310, 186],
];
const photo = {
  n: 7,
  caption: 'Contact sheet',
  desc: 'A contact sheet of six frames, with the pick marked: a listing exterior, a headshot, a corporate event, a listing interior, a family portrait and a product photo.',
  legend: ['Listing exterior', 'Headshot', 'Corporate event', 'Listing interior', 'Family portrait', 'Product photo'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<rect class="fig-node" x="40" y="46" width="400" height="268"/>
<g class="fig-port">${Array.from({ length: 19 }, (_, i) => `<rect x="${52 + i * 20}" y="53" width="8" height="6"/><rect x="${52 + i * 20}" y="301" width="8" height="6"/>`).join('')}</g>
${FR.map(([x, y]) => `<rect class="fig-ink" x="${x}" y="${y}" width="112" height="84"/>`).join('')}
<path class="fig-ink" d="M80 146v-30l34-22 34 22v30zM106 146v-18h14v18M66 146h96"/><rect class="fig-port" x="128" y="118" width="12" height="10"/>
<circle class="fig-ink" cx="240" cy="104" r="14"/><path class="fig-ink" d="M212 152c0-18 12-28 28-28s28 10 28 28"/>
<rect class="fig-port" x="340" y="80" width="34" height="22"/><circle class="fig-ink" cx="396" cy="100" r="7"/><path class="fig-ink" d="M384 130c0-12 5-18 12-18s12 6 12 18"/><rect class="fig-node" x="380" y="124" width="32" height="28"/>
<rect class="fig-ink" x="88" y="198" width="26" height="32"/><path class="fig-port" d="M101 198v32M88 214h26"/><path class="fig-ink" d="M122 256v-18h40v18M118 256h48M126 238v-6h32v6M66 262h96"/>
<circle class="fig-ink" cx="216" cy="214" r="10"/><circle class="fig-ink" cx="240" cy="207" r="11"/><circle class="fig-ink" cx="264" cy="214" r="10"/><path class="fig-ink" d="M198 266c0-16 8-26 18-26M226 266c0-18 6-30 14-30s14 12 14 30M264 240c10 0 18 10 18 26"/>
<path class="fig-ink" d="M346 252v-30l20-10 20 10v30l-20 10zM346 222l20 10 20-10M366 232v30"/><path class="fig-port" d="M330 262h72"/>
${af(50, 64, 178, 164)}
${t(114, 172, 'LISTING', 'middle')}${t(240, 172, 'HEADSHOT', 'middle')}${t(366, 172, 'EVENT', 'middle')}
${t(114, 284, 'INTERIOR', 'middle')}${t(240, 284, 'FAMILY', 'middle')}${t(366, 284, 'PRODUCT', 'middle')}
${FR.map(([x, y], i) => num(x + 13, y + 13, i + 1)).join('')}
${dim(58, 422, 358, 'DELIVERED SIZES')}`,
};

// ─── Fig. 8 — home network: house section ───
const homenet = {
  n: 8,
  caption: 'House section',
  desc: 'Cross-section of a two-storey house: the main router downstairs and a mesh node upstairs cover the whole home, family laptops use the main network, and TVs, speakers and thermostats sit on their own separate network.',
  legend: ['Main router (mesh base)', 'Upstairs mesh node', 'Separate network for TVs, speakers and thermostats', 'Family laptops and phones'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
<path class="fig-ink" d="M64 150L240 54l176 96M84 139V330h312V139M84 236h312M48 330h384"/>
<circle class="fig-node" cx="304" cy="196" r="13"/><circle class="fig-ink" cx="304" cy="196" r="4"/>
<path class="fig-line" d="M284 186a22 22 0 0 0 0 20M324 186a22 22 0 0 1 0 20"/>
<rect class="fig-node" x="128" y="194" width="40" height="26" rx="1"/><path class="fig-port" d="M134 202h20M134 208h26"/><path class="fig-ink" d="M120 226h56"/>
<rect class="fig-node" x="150" y="286" width="60" height="20" rx="1"/><path class="fig-ink" d="M162 286v-12M198 286v-12"/><path class="fig-port" d="M160 296h6M172 296h6M184 296h6"/>
${af(138, 262, 222, 316)}
<path class="fig-line" d="M210 284L290 206M210 296h52"${DASH}/>
<rect class="fig-port" x="262" y="252" width="122" height="68"${DASH}/>${t(272, 266, 'DEVICES')}
<rect class="fig-node" x="274" y="280" width="42" height="26" rx="1"/><path class="fig-ink" d="M295 306v6"/>
<rect class="fig-node" x="326" y="278" width="18" height="32" rx="3"/><circle class="fig-port" cx="335" cy="298" r="5"/>
<circle class="fig-node" cx="365" cy="294" r="10"/><circle class="fig-port" cx="365" cy="294" r="4"/>
${num(114, 296, 1)}${num(344, 168, 2)}${num(384, 240, 3)}${num(108, 182, 4)}
${dim(84, 396, 362, 'WHOLE-HOME')}`,
};

// ─── Fig. 9 — tech consulting: roadmap ───
const card = (x) =>
  `<rect class="fig-node" x="${x}" y="96" width="80" height="70"/><path class="fig-port" d="M${x + 12} 114h56M${x + 12} 126h44M${x + 12} 138h52M${x + 12} 150h36"/><path class="fig-line" d="M${x + 40} 166v44"/>`;
const consult = {
  n: 9,
  caption: 'Roadmap',
  desc: 'A timeline from now to next to later. A decision point between now and next weighs two options before the plan continues, and each stage lists what to do.',
  legend: ['What to fix now', 'Decision point: options and costs side by side', 'Next step', 'Later upgrades'],
  viewBox: '0 0 480 400',
  art: `${crop(480, 400)}
${card(50)}${card(250)}${card(350)}
<path class="fig-ink" d="M56 220h360"/><path class="fig-ink" d="M424 220l-9-4.5v9z"/>
<circle class="fig-node" cx="90" cy="220" r="10"/><circle class="fig-fill" cx="90" cy="220" r="3.5"/>
<path class="fig-node" d="M190 200l20 20-20 20-20-20z"/>${t(190, 220, '?', 'middle')}
${af(162, 192, 218, 248)}${t(190, 178, 'DECIDE', 'middle')}
<circle class="fig-node" cx="290" cy="220" r="10"/><circle class="fig-node" cx="390" cy="220" r="10"/>
${t(90, 264, 'NOW', 'middle')}${t(290, 264, 'NEXT', 'middle')}${t(390, 264, 'LATER', 'middle')}
<path class="fig-line" d="M190 240v58h96"${DASH}/><rect class="fig-node" x="286" y="284" width="100" height="28"/>${t(336, 298, 'OPTION B', 'middle')}
${num(90, 76, 1)}${num(234, 198, 2)}${num(290, 76, 3)}${num(390, 76, 4)}
${dim(56, 424, 362, 'WRITTEN PLAN')}`,
};

/** Every built-in figure, keyed by 'home' or a service slug. */
export const FIGURES = {
  home,
  'small-business-it': sbit,
  'network-security': netsec,
  'conference-room-av': confav,
  'database-consulting': db,
  'web-development': web,
  photography: photo,
  'home-network': homenet,
  'tech-consulting': consult,
};

/** City strip (480×120): ring marker "ROWLETT" → square marker for the city, with a dimension label. */
export function distanceArt({ from = 'ROWLETT', to, label }) {
  return `${crop(480, 120).replace(/M14 36V14h22/, 'M14 30V14h16').replace(/h22v22M/, 'h16v16M')}
<circle class="fig-ink" cx="60" cy="54" r="12"/><circle class="fig-fill" cx="60" cy="54" r="3.5"/>
<rect class="fig-node" x="408" y="42" width="24" height="24"/><rect class="fig-signal" x="415" y="49" width="10" height="10"/>
${dim(78, 402, 54, String(label).toUpperCase())}
${t(60, 90, String(from).toUpperCase(), 'middle')}${t(420, 90, String(to).toUpperCase(), 'middle')}`;
}

/** Stacked browser pages on the blueprint grid (case-study card, 400×210). Decorative. */
export function caseStudyArt() {
  return `<rect class="fig-ghost" x="78" y="22" width="250" height="160"/><rect class="fig-ghost" x="70" y="30" width="250" height="160"/>
<rect class="fig-node" x="62" y="38" width="250" height="160"/><path class="fig-ink" d="M62 54h250"/>
<circle class="fig-fill" cx="72" cy="46" r="2.2"/><circle class="fig-fill" cx="80" cy="46" r="2.2"/><circle class="fig-fill" cx="88" cy="46" r="2.2"/>
<rect class="fig-signal" x="74" y="64" width="8" height="8"/><path class="fig-port" d="M88 68h40M210 68h20M238 68h20M266 68h20"/>
<path class="fig-ink" d="M74 90h120M74 102h96" stroke-width="5"/><path class="fig-port" d="M74 118h140M74 126h120"/>
<rect class="fig-accent" x="74" y="138" width="44" height="12"/>
<rect class="fig-ink" x="226" y="84" width="74" height="66"/><path class="fig-port" d="M226 150l24-24 14 14 12-12 24 22"/>
<path class="fig-port" d="M74 164h66v22H74zM150 164h66v22h-66zM226 164h74v22h-74z"/>
<path class="fig-line" d="M346 22v176M340 22h12M340 198h12"/>
<text class="fig-dim" x="362" y="110" text-anchor="middle" dominant-baseline="central" transform="rotate(90 362 110)">MULTI-PAGE</text>
<path class="fig-line" d="M24 38h20M24 198h20M34 38v160"/>
<text class="fig-dim" x="18" y="118" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 18 118)">STATIC HTML</text>`;
}
