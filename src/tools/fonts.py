"""Font build: python -P src/tools/fonts.py   (needs: pip install fonttools brotli)

Makes the four self-hosted web fonts from the OFL source files in
src/tools/fonts/ (downloaded from github.com/google/fonts, see the URLs below):
pins / trims each variable font's axes to the range the CSS uses, subsets to
Latin, writes WOFF2 to assets/fonts/ (with the licence texts), and writes
src/styles/00-fonts.css: the @font-face rules plus metric-matched local
fallbacks (Georgia, Georgia Italic, Segoe UI/Arial, Consolas/Courier New) so text doesn't jump
when the web fonts finish loading. Re-run only if the fonts or ranges change.

Sources (verified 2026-11-03):
  https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader%5Bopsz,wght%5D.ttf
  https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/Newsreader-Italic%5Bopsz,wght%5D.ttf
  https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentsans/InstrumentSans%5Bwdth,wght%5D.ttf
  https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf
  (+ OFL.txt from each family folder, saved as OFL-<Family>.txt)
"""
import shutil
from io import BytesIO
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "tools" / "fonts"
OUT = ROOT / "assets" / "fonts"
CSS = ROOT / "src" / "styles" / "00-fonts.css"
WIN_FONTS = Path("C:/Windows/Fonts")

# design-final.md §3. Includes § · ‑ (U+2011, "Wi‑Fi") – — ’ “ ” → ↗.
LATIN = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,"
    "U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+2197,U+00A7,U+00B7,U+FEFF,U+FFFD"
)
FEATURES = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "onum", "lnum", "tnum", "case", "ss01", "rvrn"]

# family, style, weight range (CSS), source, output, axis limits, instance used to
# measure fallback metrics, fallback family name, fallback local() names (the first
# one is the font the metrics are matched to), fallback file for measuring
FONTS = [
    # opsz floor 18 = smallest roman serif size (.page-work .wk-kind .related-t strong, 1.125rem,
    # src/styles/pages/work.css). 18 is also the font's default opsz; anything smaller just clamps
    # to opsz 18. Lower this if serif text under 18px is ever added.
    dict(family="Newsreader", style="normal", weight="400 500", src="Newsreader.ttf", out="newsreader-var.woff2",
         limits={"wght": (400, 500), "opsz": (18, 72)}, measure={"wght": 400, "opsz": 48},
         fb="Newsreader Fallback", locals=["Georgia"], fb_file="georgia.ttf"),
    dict(family="Newsreader", style="italic", weight="400", src="Newsreader-Italic.ttf", out="newsreader-italic.woff2",
         # Italic is only used for display-size accents (H1 tail, CTA em, footer tagline), so
         # opsz is pinned at 48: 23 KB instead of 59 KB, keeping the set near the 150 KB budget.
         # Its own italic fallback face (Georgia Italic, metric-matched) so the H1 accent doesn't
         # rewrap when the italic arrives (an upright fallback is ~9% wider).
         limits={"wght": 400, "opsz": 48}, measure={"wght": 400, "opsz": 48},
         fb="Newsreader Fallback", locals=["Georgia Italic", "Georgia-Italic"], fb_file="georgiai.ttf"),
    dict(family="Instrument Sans", style="normal", weight="400 600", src="InstrumentSans.ttf", out="instrument-sans-var.woff2",
         limits={"wdth": 100, "wght": (400, 600)}, measure={"wdth": 100, "wght": 400},
         fb="Instrument Sans Fallback", locals=["Segoe UI", "Arial"], fb_file="segoeui.ttf"),
    dict(family="IBM Plex Mono", style="normal", weight="500", src="IBMPlexMono-Medium.ttf", out="plex-mono-500.woff2",
         limits=None, measure={}, fb="IBM Plex Mono Fallback", locals=["Consolas", "Courier New"], fb_file="consola.ttf"),
]
LICENCES = ["OFL-Newsreader.txt", "OFL-InstrumentSans.txt", "OFL-IBMPlexMono.txt"]

# English letter frequencies (incl. space), as used by Capsize, to average glyph widths.
FREQ = {
    " ": 0.1818, "a": 0.0668, "b": 0.0122, "c": 0.0228, "d": 0.0348, "e": 0.1039, "f": 0.0182, "g": 0.0165,
    "h": 0.0499, "i": 0.057, "j": 0.0013, "k": 0.0063, "l": 0.0329, "m": 0.0197, "n": 0.0552, "o": 0.0614,
    "p": 0.0158, "q": 0.0008, "r": 0.049, "s": 0.0518, "t": 0.0741, "u": 0.0225, "v": 0.008, "w": 0.0193,
    "x": 0.0012, "y": 0.0162, "z": 0.0006,
}


def avg_width(font):
    cmap, hmtx = font.getBestCmap(), font["hmtx"]
    total = sum(FREQ.values())
    return sum(hmtx[cmap[ord(ch)]][0] * w for ch, w in FREQ.items()) / total


def instance(path, limits):
    font = TTFont(path)
    if limits and "fvar" in font:
        tags = {a.axisTag for a in font["fvar"].axes}
        font = instancer.instantiateVariableFont(font, {k: v for k, v in limits.items() if k in tags})
    return font


def alias_nb_hyphen(font):
    """None of the source fonts map U+2011 (non-breaking hyphen, used in "Wi‑Fi"), so
    browsers would draw it from a fallback font. Point it at the font's own hyphen."""
    for table in font["cmap"].tables:
        if table.isUnicode() and 0x2011 not in table.cmap:
            glyph = table.cmap.get(0x2010) or table.cmap.get(0x2D)
            if glyph:
                table.cmap[0x2011] = glyph


def build(spec):
    font = instance(SRC / spec["src"], spec["limits"])
    alias_nb_hyphen(font)
    # Round-trip through memory so every table is fully decompiled before subsetting.
    buf = BytesIO()
    font.save(buf)
    font = TTFont(BytesIO(buf.getvalue()), lazy=False)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = FEATURES
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(LATIN))
    sub.subset(font)
    font.flavor = "woff2"
    font.save(OUT / spec["out"])
    return (OUT / spec["out"]).stat().st_size


def fallback_rule(spec):
    web = instance(SRC / spec["src"], spec["measure"])
    fb = TTFont(WIN_FONTS / spec["fb_file"])
    upm, fb_upm = web["head"].unitsPerEm, fb["head"].unitsPerEm
    size_adjust = (avg_width(web) / upm) / (avg_width(fb) / fb_upm)
    hhea = web["hhea"]
    pct = lambda v: f"{abs(v) / (upm * size_adjust) * 100:.2f}%"
    src = ", ".join(f'local("{n}")' for n in spec["locals"])
    # Upright rules stay as they were; an italic fallback is a separate face in the same family.
    style = "" if spec["style"] == "normal" else f'font-style:{spec["style"]};'
    return (
        f'@font-face{{font-family:"{spec["fb"]}";{style}src:{src};'
        f"size-adjust:{size_adjust * 100:.2f}%;ascent-override:{pct(hhea.ascent)};"
        f"descent-override:{pct(hhea.descent)};line-gap-override:{pct(hhea.lineGap)}}}"
    )


def face_rule(spec):
    return (
        f'@font-face{{font-family:"{spec["family"]}";font-style:{spec["style"]};font-weight:{spec["weight"]};'
        f'font-display:swap;src:url("/assets/fonts/{spec["out"]}") format("woff2")}}'
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    CSS.parent.mkdir(parents=True, exist_ok=True)
    faces, fallbacks, total = [], [], 0
    for spec in FONTS:
        size = build(spec)
        total += size
        print(f"{spec['out']}: {size / 1024:.1f} KB")
        faces.append(face_rule(spec))
        if spec.get("fb"):
            fallbacks.append(fallback_rule(spec))
    for name in LICENCES:
        shutil.copyfile(SRC / name, OUT / name)
    print(f"total: {total / 1024:.1f} KB")
    CSS.write_text(
        "/* Generated by src/tools/fonts.py - do not edit by hand.\n"
        "   Self-hosted OFL fonts (licences in /assets/fonts/OFL-*.txt) and metric-matched\n"
        "   local fallbacks. Only newsreader-var and instrument-sans-var are preloaded. */\n"
        + "\n".join(faces) + "\n"
        + "\n".join(fallbacks) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {CSS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
