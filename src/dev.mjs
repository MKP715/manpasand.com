// Zero-dependency dev server: renders pages ON REQUEST, writes nothing.
//
//   node src/dev.mjs [--port 8100] [--host 127.0.0.1] [--pages=home,contact]
//
// - Page URLs (/, /services/, /404.html …) are rendered fresh for every request in a
//   short-lived child process, so edits to src/pages, src/lib, src/site.mjs and
//   src/content show up on reload without restarting the server.
// - /assets/css/site.css is bundled fresh from src/styles/ on every request.
// - Every other URL is served from the repo root (fonts, images, site.js …).
// - Unknown URLs get the rendered 404 page with status 404.
// - --pages limits which src/pages modules load (faster; lets agents preview their own
//   pages in parallel). notfound.mjs is always added so 404s still render.
// - Problems the build would flag on a rendered page are printed to this console.

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { join, resolve, extname, sep, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const MARK = '\n@@dev-result@@'; // separates page-module console output from the child's JSON
const ROOT = resolve(SELF, '..', '..');
const REAL_ROOT = realpathSync.native(ROOT); // canonical case, junctions resolved

function args(argv = process.argv.slice(2)) {
  const o = { port: 8100, host: '127.0.0.1', pages: null, render: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => (a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[++i]);
    if (a.startsWith('--port')) o.port = Number(val());
    else if (a.startsWith('--host')) o.host = val();
    else if (a.startsWith('--pages')) o.pages = val().split(',').map((s) => s.trim().replace(/\.mjs$/, '')).filter(Boolean);
    else if (a.startsWith('--render')) o.render = val();
  }
  return o;
}

// ---------------------------------------------------------------------------
// Child mode: render one path and print { status, html?, redirect?, problems, errors } as JSON.
// ---------------------------------------------------------------------------
async function renderChild(path, only) {
  const build = await import(pathToFileURL(join(ROOT, 'src', 'build.mjs')).href);
  const list = only ? [...new Set([...only, 'notfound'])] : null;
  const { pages, errors } = await build.loadPages(list);
  const find = (p) => pages.find((x) => x.path === p);
  let page = find(path) || (path === '/index.html' ? find('/') : null);
  if (!page && !path.endsWith('/') && !extname(path) && find(`${path}/`)) {
    return { status: 301, redirect: `${path}/`, errors };
  }
  let status = 200;
  if (!page) {
    page = find('/404.html');
    status = 404;
    if (!page) return { status: 404, html: null, errors };
  }
  const { rendered, errors: renderErrors } = await build.renderPages([page]);
  const html = rendered.get(page.path);
  const problems = html ? build.check([page], rendered, { partial: true }) : { errors: [], warnings: [] };
  return { status, html, page: page.path, errors: [...errors, ...renderErrors], problems };
}

// ---------------------------------------------------------------------------
// Server mode
// ---------------------------------------------------------------------------
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf',
};

function staticFile(pathname) {
  const file = resolve(ROOT, '.' + pathname);
  if (!(file === ROOT || file.startsWith(ROOT + sep))) return null;
  let real;
  try {
    real = realpathSync.native(file); // true on-disk case, 8.3 short names expanded
  } catch {
    return null; // missing file
  }
  const rel = relative(REAL_ROOT, real);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  // Checked on canonical names, so .git/ is blocked however the URL spells it (.GIT, GIT~1), plus .gitignore etc.
  if (rel.split(sep).some((seg) => /^\.git/i.test(seg))) return null;
  if (statSync(real).isDirectory()) {
    const idx = join(real, 'index.html');
    return existsSync(idx) ? idx : null;
  }
  return real;
}

function runChild(pathname, pages) {
  const childArgs = [SELF, '--render', pathname, ...(pages ? [`--pages=${pages.join(',')}`] : [])];
  return new Promise((done) => {
    execFile(process.execPath, childArgs, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }, (err, stdout, stderr) => {
      if (stderr) process.stderr.write(stderr);
      const at = stdout.lastIndexOf(MARK);
      if (at > 0) process.stdout.write(stdout.slice(0, at) + '\n'); // console output from page modules
      try {
        if (at < 0) throw new Error('no result');
        done(JSON.parse(stdout.slice(at + MARK.length)));
      } catch {
        done({ status: 500, errors: [`render process failed: ${err?.message || 'no output'}`], html: null });
      }
    });
  });
}

const errorPage = (errors) =>
  `<!doctype html><meta charset="utf-8"><title>Render error</title><body style="font:14px/1.5 ui-monospace,Consolas,monospace;padding:24px;background:#fff;color:#111"><h1 style="font-size:18px">Render error</h1><pre style="white-space:pre-wrap">${errors
    .map((e) => String(e).replace(/&/g, '&amp;').replace(/</g, '&lt;'))
    .join('\n\n')}</pre>`;

function serve({ port, host, pages }) {
  const assets = import(pathToFileURL(join(ROOT, 'src', 'lib', 'assets.mjs')).href);
  const server = createServer(async (req, res) => {
    const send = (status, type, body, extra = {}) => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    } catch {
      return send(400, 'text/plain', 'Bad request');
    }
    const t0 = Date.now();
    const log = (status, note = '') => console.log(`${status} ${req.method} ${req.url} ${Date.now() - t0}ms${note}`);

    try {
      if (pathname === '/assets/css/site.css') {
        const { bundleCss } = await assets;
        const { css } = bundleCss();
        log(200);
        return send(200, TYPES['.css'], css);
      }
      const ext = extname(pathname);
      const pageLike = pathname.endsWith('/') || ext === '' || ext === '.html';
      if (pageLike) {
        const r = await runChild(pathname, pages);
        if (r.errors?.length) r.errors.forEach((e) => console.error(`  error ${e}`));
        if (r.problems) {
          r.problems.errors.forEach((e) => console.error(`  error ${e}`));
          r.problems.warnings.forEach((w) => console.warn(`  warn  ${w}`));
        }
        if (r.status === 301) {
          log(301);
          return send(301, 'text/plain', '', { Location: r.redirect });
        }
        if (r.status === 200 && r.html) {
          log(200);
          return send(200, TYPES['.html'], r.html);
        }
        // No page module for this path: fall back to a file on disk (e.g. an older build).
        const file = staticFile(pathname);
        if (file && r.status === 404) {
          log(200, ' (static)');
          return send(200, TYPES[extname(file).toLowerCase()] || 'application/octet-stream', readFileSync(file));
        }
        if (r.html) {
          log(r.status);
          return send(r.status, TYPES['.html'], r.html);
        }
        log(500);
        return send(500, TYPES['.html'], errorPage(r.errors || ['unknown error']));
      }
      const file = staticFile(pathname);
      if (file) {
        log(200);
        return send(200, TYPES[extname(file).toLowerCase()] || 'application/octet-stream', readFileSync(file));
      }
      const r = await runChild('/404.html', pages);
      log(404);
      return send(404, TYPES['.html'], r.html || 'Not found');
    } catch (err) {
      log(500);
      return send(500, TYPES['.html'], errorPage([err?.stack || String(err)]));
    }
  });
  server.listen(port, host, () => {
    console.log(`Dev server: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/${pages ? `  (pages: ${pages.join(', ')} + notfound)` : ''}`);
  });
}

const opts = args();
if (opts.render) {
  renderChild(opts.render, opts.pages)
    .then((r) => process.stdout.write(MARK + JSON.stringify(r)))
    .catch((err) => process.stdout.write(MARK + JSON.stringify({ status: 500, errors: [err?.stack || String(err)] })));
} else {
  serve(opts);
}
