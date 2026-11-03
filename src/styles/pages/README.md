# Page styles

One CSS file per page template, named after the module in `src/pages/`: `contact.css`, `service.css`, `guide.css` and so on. The bundler picks up `*.css` here **after** the shared `src/styles/*.css`, in name order. This README is not bundled.

- Keep these files small. Shared components (`src/lib/components.mjs`) already carry their own styles.
- Scope every rule to the page's `bodyClass` or a page-specific class.
- Use tokens from `10-tokens.css` only. No raw colours, because everything must work in light and dark.
- Use the literal breakpoints: 1120 / 1100 / 960 / 800 / 720 / 640 / 560.
- Don't edit shared files from a page task. Report what's missing instead.

Full rules: `src/lib/COMPONENTS.md` → "CSS rules for page agents".
