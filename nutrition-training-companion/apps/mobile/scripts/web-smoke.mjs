#!/usr/bin/env node
// Opens every route of the exported web build at iPhone size in headless
// Chromium, fails on any page error, and saves a screenshot of each.
//
//   npx expo export --platform web --output-dir dist-web
//   NODE_PATH=<dir with puppeteer-core> CHROME_BIN=<chromium> node scripts/web-smoke.mjs dist-web [shots-dir]
//
// State is seeded through the web-only debug hook (src/debug.web.ts).
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const root = process.argv[2] || 'dist-web';
const shots = process.argv[3] || join(root, '..', 'web-shots');
mkdirSync(shots, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf' };

const server = createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  const file = existsSync(path) && !path.endsWith('/') && extname(path) ? path : join(root, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

export const ROUTES = (process.env.ROUTES || '').split(',').filter(Boolean);
const DEFAULT_ROUTES = ['/sign-up', '/', '/food', '/training', '/recovery', '/history', '/settings', '/setup', '/setup/health',
  '/setup/training', '/setup/split', '/setup/body', '/setup/goal', '/setup/age', '/setup/weight', '/targets', '/apple-health',
  '/your-data', '/about', '/notifications', '/readiness', '/food/search', '/food/quick-add', '/food/new', '/scanner',
  '/training/review', '/training/edit', '/change-request', '/evidence', '/evidence/hypertrophy.volume.raise_low_weekly_sets'];

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

async function go(route, seed) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !!globalThis.__companion, { timeout: 15000 });
  if (seed) {
    await page.evaluate(seed);
    await new Promise((r) => setTimeout(r, 700)); /* the store saves 300 ms after a change */
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !!globalThis.__companion, { timeout: 15000 });
  }
  await new Promise((r) => setTimeout(r, 600));
}
const onboard = () => {
  const c = globalThis.__companion;
  c.A.completeOnboarding({ goal: 'muscle_gain', birthYear: 1994, weightKg: 82 }, {});
};

let failed = 0;
const list = ROUTES.length ? ROUTES : DEFAULT_ROUTES;
for (const route of list) {
  const before = errors.length;
  try {
    await go(route, route === '/sign-up' ? null : onboard);
    const name = route === '/' ? 'today' : route.replace(/^\//, '').replace(/[/[\].]/g, '_');
    await page.screenshot({ path: join(shots, `${name}.png`) });
    const text = await page.evaluate(() => document.body.innerText);
    const ok = errors.length === before && !/Unmatched Route|This screen doesn't exist/i.test(text);
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${route}${ok ? '' : ` ${errors.slice(before).join(' | ').slice(0, 300) || 'unmatched route'}`}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${route} ${e.message}`);
  }
}
await browser.close();
server.close();
console.log(`${list.length - failed} of ${list.length} routes rendered without errors. Shots in ${shots}`);
process.exit(failed ? 1 : 0);
