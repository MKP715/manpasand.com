"""Image pipeline: python -P src/tools/images.py   (Python 3.11+, Pillow; Node on PATH)

1. Photos: reads src/images/images.config.json and the files in
   src/images/originals/, writes responsive WebP variants to assets/img/ and the
   manifest the build uses (src/data/images.json). Re-run after adding a photo.
2. Brand files, drawn from the logo geometry in design-final.md §4 (no source
   art needed): icon.svg, favicon.ico (16/32/48), apple-touch-icon.png,
   assets/img/icon-192.png, icon-512.png, icon-maskable-512.png, logo-512.png.
3. 1200x630 share cards (assets/img/og-*.jpg) set in the brand fonts from
   src/tools/fonts/: default, services, one per service, areas, one per city
   (og-area-<slug>), guides, one per guide (og-guide-<slug>), work, the case
   study (og-work-<slug>), contact, about. Guides and the case study also get
   16:9, 4:3 and 1:1 versions (-16x9, -4x3, -1x1) for Article.image. Name,
   phone, services, cities and guides are read from src/site.mjs (via Node), so
   re-run this after changing them.

src/images/originals/ is published with the repo, so any "redact" boxes in the
config are burned into the original file itself (and removed from the config)
the first time the script sees them. Metadata (EXIF/GPS) is never written out.
"""
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageCms, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ORIG = ROOT / "src" / "images" / "originals"
OUT = ROOT / "assets" / "img"
FONTS = ROOT / "src" / "tools" / "fonts"
CONFIG_PATH = ROOT / "src" / "images" / "images.config.json"
CONFIG = json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {}

# Fixed brand colours for static files (design-final.md §2 / §4.1).
PAPER = (245, 242, 234)      # #F5F2EA
PAPER_2 = (236, 231, 219)    # #ECE7DB
INK = (20, 24, 33)           # #141821
INK_2 = (61, 67, 80)         # #3D4350
MUTED = (90, 96, 108)        # #5A606C
ACCENT = (28, 76, 140)       # #1C4C8C cyanotype blue
SIGNAL = (210, 70, 30)       # #D2461E safelight vermilion
ON_NIGHT_ACCENT = (185, 205, 235)  # #B9CDEB
WHITE = (255, 255, 255)


def site_data():
    """SITE, SERVICES, GUIDES and AREAS from src/site.mjs, so cards never drift from the site."""
    code = "import('./src/site.mjs').then(m=>process.stdout.write(JSON.stringify({SITE:m.SITE,SERVICES:m.SERVICES,GUIDES:m.GUIDES,AREAS:m.AREAS})))"
    out = subprocess.run(["node", "--input-type=module", "-e", code], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------
def redact(im, box):
    """Pixelate then blur a region so text in it is unreadable."""
    region = im.crop(box)
    w, h = region.size
    small = region.resize((max(1, w // 14), max(1, h // 14)), Image.BILINEAR)
    region = small.resize((w, h), Image.NEAREST).filter(ImageFilter.GaussianBlur(6))
    im.paste(region, box)


def load(path):
    """Open an image upright, in sRGB, with no metadata."""
    im = ImageOps.exif_transpose(Image.open(path))
    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    mode = "RGBA" if has_alpha else "RGB"
    icc = im.info.get("icc_profile")
    if icc:
        src = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        im = ImageCms.profileToProfile(im.convert(mode), src, ImageCms.createProfile("sRGB"), outputMode=mode)
    return im.convert(mode), has_alpha


def bake_redactions(spec):
    """Blur private details into the published original, then forget the boxes."""
    path = ORIG / spec["file"]
    im, _ = load(path)
    for box in spec.pop("redact"):
        redact(im, tuple(box))
    if path.suffix.lower() in (".jpg", ".jpeg"):
        im.convert("RGB").save(path, "JPEG", quality=94, optimize=True)
    else:
        im.save(path)


def process(key, spec):
    if spec.get("redact"):
        bake_redactions(spec)
    im, has_alpha = load(ORIG / spec["file"])
    if "crop" in spec:
        im = im.crop(tuple(spec["crop"]))
    full_w, full_h = im.size
    wanted = spec.get("widths", [480, 800, 1200, 1600])
    widths = sorted({w for w in wanted if w < full_w} | {min(full_w, max(wanted))})
    for w in widths:
        h = round(full_h * w / full_w)
        variant = im.resize((w, h), Image.LANCZOS) if w != full_w else im
        params = {"quality": spec.get("quality", 78), "method": 6}
        if has_alpha:
            params = {"quality": 90, "method": 6, "alpha_quality": 90}
        variant.save(OUT / f"{key}-{w}.webp", "WEBP", **params)
    # Remove variants left over from earlier widths/crops of this key.
    pattern = re.compile(rf"^{re.escape(key)}-(\d+)\.webp$")
    for old in OUT.glob(f"{key}-*.webp"):
        m = pattern.match(old.name)
        if m and int(m.group(1)) not in widths:
            old.unlink()
    top = widths[-1]
    return {"widths": widths, "width": top, "height": round(full_h * top / full_w), "alt": spec["alt"]}


# ---------------------------------------------------------------------------
# Logo mark (design-final.md §4): crop-mark frame + ring + vermilion square.
# Each corner is two rectangles (butt caps, mitred corner) so the raster
# matches the SVG exactly. Drawn 4x and downsampled.
# ---------------------------------------------------------------------------
# grid, frame outer edge, frame inner edge, arm end, ring outer r, ring inner r, square start, square end
MARK_40 = dict(grid=40, a=1.0, b=4.5, arm=11.5, r_out=11.0, r_in=7.5, s0=16.75, s1=23.25)   # §4.1 primary
MARK_16 = dict(grid=16, a=1.2, b=2.8, arm=5.5, r_out=3.9, r_in=2.3, s0=6.75, s1=9.25)       # §4.2 small sizes


def draw_mark(d, ox, oy, size, geo, ink=INK, signal=SIGNAL):
    """Draw the mark into ImageDraw `d` with its grid box at (ox, oy), `size` px wide."""
    g = geo["grid"]
    k = size / g
    a, b, arm = geo["a"], geo["b"], geo["arm"]
    A, B, ARM = g - a, g - b, g - arm
    rects = [
        (a, a, b, arm), (a, a, arm, b),        # top-left
        (ARM, a, A, b), (B, a, A, arm),        # top-right
        (B, ARM, A, A), (ARM, B, A, A),        # bottom-right
        (a, B, arm, A), (a, ARM, b, A),        # bottom-left
    ]
    for x0, y0, x1, y1 in rects:
        d.rectangle((ox + x0 * k, oy + y0 * k, ox + x1 * k - 1, oy + y1 * k - 1), fill=ink)
    c, ro, ri = g / 2, geo["r_out"], geo["r_in"]
    d.ellipse((ox + (c - ro) * k, oy + (c - ro) * k, ox + (c + ro) * k, oy + (c + ro) * k), outline=ink, width=max(1, round((ro - ri) * k)))
    d.rectangle((ox + geo["s0"] * k, oy + geo["s0"] * k, ox + geo["s1"] * k - 1, oy + geo["s1"] * k - 1), fill=signal)


def mark_image(px, geo=MARK_16, bg=None, tile_radius=None, pad=0.0, ink=INK, signal=SIGNAL):
    """Square RGBA image of the mark. bg=None → transparent. tile_radius (grid units) → rounded tile."""
    S = 4
    s = px * S
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0) if bg is None or tile_radius else bg + (255,))
    d = ImageDraw.Draw(im)
    if tile_radius is not None and bg is not None:
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=round(tile_radius * s / geo["grid"]), fill=bg)
    inner = s * (1 - 2 * pad)
    draw_mark(d, (s - inner) / 2, (s - inner) / 2, inner, geo, ink, signal)
    return im.resize((px, px), Image.LANCZOS)


ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <rect width="16" height="16" rx="3" fill="#F5F2EA"/>
  <path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" fill="none" stroke="#141821" stroke-width="1.6"/>
  <circle cx="8" cy="8" r="3.1" fill="none" stroke="#141821" stroke-width="1.6"/>
  <rect x="6.75" y="6.75" width="2.5" height="2.5" fill="#D2461E"/>
</svg>
"""


def save_png(im, path):
    """Flat line-art icons compress far better as 256-colour palette PNGs."""
    if im.mode == "RGBA":
        # MEDIANCUT can't do alpha; FASTOCTREE keeps it as a tRNS palette (rounded tile corners stay transparent).
        im.quantize(colors=64, method=Image.Quantize.FASTOCTREE).save(path, optimize=True)
    else:
        im.quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


def brand_files():
    (ROOT / "icon.svg").write_text(ICON_SVG, encoding="utf-8")
    sizes = [16, 32, 48]
    icos = [mark_image(n, MARK_16, bg=PAPER, tile_radius=3) for n in sizes]
    icos[-1].save(ROOT / "favicon.ico", format="ICO", sizes=[(n, n) for n in sizes], append_images=icos[:-1])
    # iOS masks its own rounded corners, so the touch icon is a full square with extra margin.
    save_png(mark_image(180, MARK_16, bg=PAPER, pad=0.12).convert("RGB"), ROOT / "apple-touch-icon.png")
    save_png(mark_image(192, MARK_16, bg=PAPER, tile_radius=3), OUT / "icon-192.png")
    save_png(mark_image(512, MARK_16, bg=PAPER, tile_radius=3), OUT / "icon-512.png")
    # Maskable: the mark's 16-unit box at 60% of a full-bleed paper square (inside the 80% safe circle).
    save_png(mark_image(512, MARK_16, bg=PAPER, pad=0.2).convert("RGB"), OUT / "icon-maskable-512.png")
    # Schema logo: primary 40-unit mark on white (Google shows logos on white).
    save_png(mark_image(512, MARK_40, bg=WHITE, pad=0.1).convert("RGB"), OUT / "logo-512.png")


# ---------------------------------------------------------------------------
# Share cards
# ---------------------------------------------------------------------------
def font(name, size, **axes):
    """Load a (variable) TTF from src/tools/fonts at `size`, setting axes by tag-ish name."""
    f = ImageFont.truetype(str(FONTS / name), size)
    try:
        info = f.get_variation_axes()
    except OSError:
        return f  # static font
    names = {"wght": "weight", "opsz": "optical", "wdth": "width"}
    values = []
    for axis in info:
        label = axis["name"].decode() if isinstance(axis["name"], bytes) else str(axis["name"])
        value = axis["default"]
        for tag, word in names.items():
            if tag in axes and label.lower().startswith(word):
                value = axes[tag]
        values.append(value)
    f.set_variation_by_axes(values)
    return f


SERIF = lambda size, w=400: font("Newsreader.ttf", size, wght=w, opsz=min(72, size))
ITALIC = lambda size: font("Newsreader-Italic.ttf", size, wght=400, opsz=min(72, size))
SANS = lambda size, w=400: font("InstrumentSans.ttf", size, wght=w, wdth=100)
MONO = lambda size: font("IBMPlexMono-Medium.ttf", size)

W, H = 1200, 630
LEFT = 72
PANEL_X = 792           # cyanotype panel on the right
TEXT_W = PANEL_X - LEFT - 64


def clean(text):
    # The source TTFs have no U+2011 (non-breaking hyphen in "Wi‑Fi"); draw a plain hyphen.
    return text.replace("‑", "-")


def tracked(d, xy, text, f, fill, tracking):
    """Draw text with letter-spacing (px); returns the end x."""
    x, y = xy
    for ch in clean(text):
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + tracking
    return x - tracking


def tracked_len(d, text, f, tracking):
    text = clean(text)
    return sum(d.textlength(ch, font=f) for ch in text) + tracking * (len(text) - 1)


def wrap_runs(d, runs, fonts, max_w):
    """runs: [(text, style)] → lines of [(word, style)] with mixed fonts, greedy wrap."""
    words = []
    for text, style in runs:
        for i, w in enumerate(clean(text).split(" ")):
            if w:
                words.append((w, style))
    lines, line, width = [], [], 0
    space = d.textlength(" ", font=fonts["r"])
    for w, style in words:
        wl = d.textlength(w, font=fonts[style])
        add = wl + (space if line else 0)
        if line and width + add > max_w:
            lines.append(line)
            line, width = [], 0
            add = wl
        line.append((w, style))
        width += add
    if line:
        lines.append(line)
    return lines


def wrap_plain(d, text, f, max_w):
    return [" ".join(w for w, _ in ln) for ln in wrap_runs(d, [(text, "r")], {"r": f}, max_w)]


def blueprint_panel(im, d, caption, h=H):
    """Right-hand cyanotype print: blue field, faint grid, the mark in paper + vermilion, a dimension line."""
    d.rectangle((PANEL_X, 0, W, h), fill=ACCENT)
    grid = Image.new("RGBA", (W - PANEL_X, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = 24
    for x in range(0, W - PANEL_X + 1, step):
        gd.line((x, 0, x, h), fill=(255, 255, 255, 34 if (x // step) % 4 == 0 else 16), width=1)
    for y in range(0, h + 1, step):
        gd.line((0, y, W - PANEL_X, y), fill=(255, 255, 255, 34 if (y // step) % 4 == 0 else 16), width=1)
    im.paste(Image.alpha_composite(im.crop((PANEL_X, 0, W, h)).convert("RGBA"), grid).convert("RGB"), (PANEL_X, 0))
    d = ImageDraw.Draw(im)
    size = 240
    cx = PANEL_X + (W - PANEL_X) // 2
    top = 168 + (h - H) // 2  # centred the same way as on the 630px card
    mark = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), 0, 0, size * 4, MARK_40, ink=PAPER, signal=SIGNAL)
    mark = mark.resize((size, size), Image.LANCZOS)
    im.paste(mark, (cx - size // 2, top), mark)
    # Dimension line under the mark, drafting style.
    y = top + size + 34
    x0, x1 = cx - size // 2, cx + size // 2
    d.line((x0, y, x1, y), fill=ON_NIGHT_ACCENT, width=2)
    for x in (x0, x1):
        d.line((x, y - 9, x, y + 9), fill=ON_NIGHT_ACCENT, width=2)
    m = MONO(15)
    label = clean(caption.upper())
    lw = tracked_len(d, label, m, 2)
    d.rectangle((cx - lw / 2 - 10, y - 12, cx + lw / 2 + 10, y + 12), fill=ACCENT)
    tracked(d, (cx - lw / 2, y - 10), label, m, ON_NIGHT_ACCENT, 2)
    # Corner label.
    tracked(d, (PANEL_X + 28, 34), "MANPASAND.COM", MONO(14), ON_NIGHT_ACCENT, 2)
    return d


def og_card(name, eyebrow, title_runs, sub, caption, phone, size=(W, H), suffix=""):
    """size: (1200, h); taller cards keep the brand row at the top and the footer at the bottom,
    and centre the eyebrow + title block between them."""
    h = size[1]
    dy = (h - H) // 2
    im = Image.new("RGB", (W, h), PAPER)
    d = ImageDraw.Draw(im)
    d = blueprint_panel(im, d, caption, h)

    # Brand row: mark + wordmark + mono subline.
    mk = 46
    mark = Image.new("RGBA", (mk * 4, mk * 4), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), 0, 0, mk * 4, MARK_40)
    mark = mark.resize((mk, mk), Image.LANCZOS)
    im.paste(mark, (LEFT, 58), mark)
    d.text((LEFT + mk + 16, 52), "Manpasand", font=SERIF(38, 500), fill=INK)
    tracked(d, (LEFT + mk + 18, 96), "TECHNICAL SERVICES", MONO(12), MUTED, 2.2)

    # Eyebrow: vermilion square + mono label in accent.
    ey = 178 + dy
    d.rectangle((LEFT, ey + 4, LEFT + 11, ey + 15), fill=SIGNAL)
    tracked(d, (LEFT + 24, ey), eyebrow.upper(), MONO(17), ACCENT, 1.6)

    # Title (auto-fit ≤ 3 lines) and sub line (≤ 3 lines) between y=222 and the rule.
    rule_y = h - 110
    top = 222 + dy
    for fs in (80, 74, 68, 62, 56, 50):
        fonts = {"r": SERIF(fs), "i": ITALIC(fs)}
        lines = wrap_runs(d, title_runs, fonts, TEXT_W)
        sub_f = SANS(25)
        sub_lines = wrap_plain(d, sub, sub_f, TEXT_W) if sub else []
        lh = round(fs * 1.06)
        total = lh * len(lines) + (22 + 36 * len(sub_lines) if sub_lines else 0)
        if len(lines) <= 3 and len(sub_lines) <= 3 and top + total <= rule_y - 26:
            break
    y = top
    space = d.textlength(" ", font=fonts["r"])
    for line in lines:
        x = LEFT
        for i, (w, style) in enumerate(line):
            d.text((x, y), w, font=fonts[style], fill=ACCENT if style == "i" else INK)
            x += d.textlength(w, font=fonts[style]) + space
        y += lh
    if sub_lines:
        y += 22
        for ln in sub_lines:
            d.text((LEFT, y), ln, font=sub_f, fill=INK_2)
            y += 36

    # Footer: 2px ink rule, location + phone in mono.
    d.rectangle((LEFT, rule_y, PANEL_X - 64, rule_y + 1), fill=INK)
    m = MONO(19)
    tracked(d, (LEFT, rule_y + 26), "ROWLETT, TX · DFW", m, INK_2, 1.5)
    pw = tracked_len(d, phone, m, 1.0)
    tracked(d, (PANEL_X - 64 - pw, rule_y + 26), phone, m, INK, 1.0)
    im.save(OUT / f"og-{name}{suffix}.jpg", "JPEG", quality=86, optimize=True, progressive=True)


def og_cards(data):
    site, services = data["SITE"], data["SERVICES"]
    phone = site["phone"]
    R, I = "r", "i"
    cards = [
        ("default", "IT · Networks · Data · Web · AV · Photo", [("Technical work, done", R), ("to your liking.", I)],
         "Small business IT, networks, databases, websites, conference rooms and photography.", "Fig. 0 · Manpasand"),
        ("services", f"§ Services · {len(services):02d}", [("IT, networks, data, web", R), ("& photography", I)],
         "One point of contact for businesses and homes. Free consultation, fixed-price quotes.", "Fig. A · Services"),
        ("areas", "§ Service areas", [("On-site across", R), ("Dallas–Fort Worth", I)],
         "Based in Rowlett, TX 75088. Remote database and web work anywhere.", "Fig. B · Service areas"),
        ("guides", "§ Guides", [("Practical tech advice,", R), ("in plain English", I)],
         "Breach-notice rules, power-outage prep, meeting-room setup and listing-photo prep.", "Fig. C · Guides"),
        ("work", "§ Our work", [("Real projects,", R), ("described plainly", I)],
         "Starting with the Mahnken Painting & More website: our first version, then our rebuild.", "Fig. D · Our work"),
        ("contact", "§ Contact", [("Free consultation.", R), ("Fixed-price quote.", I)],
         "Describe the job and we reply within one business day. Mon–Fri, 9 AM – 5 PM.", "Fig. E · Contact"),
        ("about", "§ About", [("“Manpasand” means", R), ("to one’s liking.", I)],
         "How we work: free consults, fixed-price quotes, plain explanations, a 14-day guarantee.", "Fig. F · About"),
    ]
    for i, s in enumerate(services, 1):
        cards.append((s["slug"], f"Service · {i:02d}", [(s["name"], R)], s["summary"], f"Fig. {i} · {s['short']}"))
    # Detail pages get their own card instead of their hub's (assets.mjs ogImageFor picks them up).
    articles = []
    for i, g in enumerate(data["GUIDES"], 1):
        cards.append((f"guide-{g['slug']}", f"§ Guide · {i:02d}", [(g["title"], R)], g["summary"], f"Fig. C{i} · Guide"))
        articles.append(cards[-1])
    for a in data["AREAS"]:
        cards.append((f"area-{a['slug']}", f"§ Service area · {a['city']}", [("IT support in", R), (f"{a['city']}, TX", I)],
                      "On-site from our base in Rowlett, TX. Free consultation, fixed-price quotes.", f"Fig. B · {a['city']}"))
    cards.append(("work-mahnken-painting-website", "§ Case study · Web development", [("Mahnken Painting & More", R), ("website rebuild", I)],
                  "Our first version, then our rebuild.", "Fig. D · Case study"))
    articles.append(cards[-1])
    for name, eyebrow, runs, sub, caption in cards:
        og_card(name, eyebrow, runs, sub, caption, phone)
    # Article.image wants 16:9, 4:3 and 1:1 (Google): extra versions for guides and the case study.
    for name, eyebrow, runs, sub, caption in articles:
        for suffix, h in (("-16x9", 675), ("-4x3", 900), ("-1x1", 1200)):
            og_card(name, eyebrow, runs, sub, caption, phone, size=(W, h), suffix=suffix)
    return [c[0] for c in cards]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    baked = any(spec.get("redact") for spec in CONFIG.values())
    manifest = {key: process(key, spec) for key, spec in CONFIG.items()}
    if baked:
        CONFIG_PATH.write_text(json.dumps(CONFIG, indent=2) + "\n", encoding="utf-8")
    (ROOT / "src" / "data").mkdir(exist_ok=True)
    (ROOT / "src" / "data" / "images.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    brand_files()
    names = og_cards(site_data())
    print(f"Processed {len(manifest)} photo(s), brand icons and {len(names)} share cards -> {OUT}")


if __name__ == "__main__":
    main()
