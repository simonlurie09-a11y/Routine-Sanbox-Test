// Headless test harness for the prototype.
//
//   import { launch } from './harness.mjs';
//   const app = await launch({ dist: false });       // dev entry, or dist: true for dist/index.html
//   const app = await launch({ files: ['60-food.js'] }); // core + only these screen files (or PROTOTYPE_FILES=a.js,b.js)
//   await app.show('food-detail', { foodId: 'p-oat-bar' });
//   await app.tap('Log 1 bar');                      // clicks the first visible element whose text contains this
//   await app.shot('after-log');                     // PNG of the phone into SHOTS_DIR
//   console.log(app.errors);                         // page errors, console errors, failed requests
//   await app.close();
//
// Needs puppeteer-core, react@18.3.1, react-dom@18.3.1 and htm@3.1.1 resolvable
// from NODE_PATH, and CHROME_BIN pointing at Chromium. CDN requests are served
// from those local packages, so no network is needed.

import { createServer } from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(here, '..', '..')); // nutrition-training-companion/

const packageFile = (spec) => {
  const [name, ...rest] = spec.split('/');
  const dir = require.resolve.paths(name).map((p) => join(p, name)).find((d) => existsSync(join(d, 'package.json')));
  if (!dir) throw new Error(`cannot find package ${name} (set NODE_PATH)`);
  return join(dir, ...rest);
};
const CDN = {
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js': 'react/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js': 'htm/dist/htm.umd.js'
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png' };

export async function launch(opts = {}) {
  const puppeteer = require('puppeteer-core');
  const chrome = process.env.CHROME_BIN;
  if (!chrome) throw new Error('Set CHROME_BIN');
  const shotsDir = process.env.SHOTS_DIR || join(here, '..', '.shots');
  mkdirSync(shotsDir, { recursive: true });

  /* Isolated mode: only core files plus the listed screen files (so one
     builder's half-written file can't break another's tests). */
  const CORE = ['00-data.js', '01-evidence.generated.js', '02-downloads.generated.js', '05-palettes.generated.js', '10-domain.js', '20-store.js', '30-ui.js'];
  const isolatedFiles = opts.files || (process.env.PROTOTYPE_FILES ? process.env.PROTOTYPE_FILES.split(',').filter(Boolean) : null);
  const isolatedHtml = () => {
    const files = [...CORE, ...isolatedFiles.filter((f) => !CORE.includes(f) && f !== '90-main.js').sort(), '90-main.js'];
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>isolated</title>
<link rel="stylesheet" href="../design/generated/tokens.css"><link rel="stylesheet" href="../design/apple-design-system/bundle.css"><link rel="stylesheet" href="app.css">
</head><body><div class="stage"><div class="device"><div id="app-root"></div></div></div>
${Object.keys(CDN).map((u) => `<script src="${u}"></script>`).join('')}
<script src="../design/apple-design-system/bundle.js"></script>
${files.map((f) => `<script src="src/${f}"></script>`).join('')}
</body></html>`;
  };

  const server = createServer(async (req, res) => {
    if (isolatedFiles && req.url.startsWith('/prototype/__isolated.html')) {
      return res.writeHead(200, { 'content-type': 'text/html' }).end(isolatedHtml());
    }
    const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!path.startsWith(root)) return res.writeHead(403).end();
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;

  const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  const errors = [];
  await page.setRequestInterception(true);
  page.on('request', async (r) => {
    const url = r.url();
    if (CDN[url]) return r.respond({ status: 200, contentType: 'text/javascript', body: await readFile(packageFile(CDN[url])) });
    if (url.startsWith(base)) return r.continue();
    if (url.startsWith('data:')) return r.continue();
    return r.abort();
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  /* Failed loads are reported once, by the response handler below (favicon excluded). */
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });

  const width = opts.width || 1280;
  const height = opts.height || 1000;
  await page.setViewport({ width, height, deviceScaleFactor: opts.scale || 2 });
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* ignore */ } });
  const entry = isolatedFiles ? `${base}/prototype/__isolated.html` : opts.dist ? `${base}/prototype/dist/index.html` : `${base}/prototype/index.html`;
  await page.goto(entry, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.COMPANION_READY === true);

  const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));
  const api = {
    page, browser, errors, base, shotsDir,
    settle,
    async show(key, params, o) {
      await page.evaluate((k, p, oo) => window.CompanionDebug.show(k, p, oo), key, params || null, o || null);
      await settle();
    },
    /* Click the first visible button/link/role=button/listitem/switch whose text includes `text`. */
    async tap(text, { exact = false } = {}) {
      const ok = await page.evaluate((t, ex) => {
        const scope = document.querySelector('.app') || document;
        const els = [...scope.querySelectorAll('button, a, [role="button"], [role="switch"], [role="menuitem"], label')];
        const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const match = (el) => { const s = (el.innerText || el.getAttribute('aria-label') || '').trim(); return ex ? s === t : s.includes(t); };
        /* Prefer the top-most layer: overlays, then modals, then the screen. */
        const ordered = [...els].reverse();
        const el = ordered.find((e) => visible(e) && match(e));
        if (!el) return false;
        el.scrollIntoView({ block: 'center' });
        el.click();
        return true;
      }, text, exact);
      if (!ok) throw new Error(`tap: nothing visible matching "${text}"`);
      await settle();
    },
    async type(selectorOrLabel, value) {
      const handle = await page.evaluateHandle((s) => {
        const byLabel = [...document.querySelectorAll('.app label')].find((l) => (l.innerText || '').trim().startsWith(s));
        if (byLabel) return byLabel.querySelector('input, textarea');
        return document.querySelector(s);
      }, selectorOrLabel);
      const el = handle.asElement();
      if (!el) throw new Error(`type: no input for "${selectorOrLabel}"`);
      /* Replace, don't append: focus, select everything, delete, then type. */
      await el.focus();
      await page.evaluate((input) => input.select && input.select(), el);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await el.type(String(value));
      await settle(200);
    },
    text: () => page.evaluate(() => document.querySelector('.app').innerText),
    state: () => page.evaluate(() => window.CompanionDebug.state()),
    async shot(name, { full = false } = {}) {
      const el = await page.$('.device');
      const path = join(shotsDir, `${name}.png`);
      await el.screenshot({ path });
      return path;
    },
    async close() {
      await browser.close();
      server.close();
    }
  };
  return api;
}
