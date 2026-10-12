#!/usr/bin/env node
// Renders every screen in design/mockups/ to design/screens/<key>.png, plus an
// overview contact sheet, using headless Chromium.
//
//   CHROME_BIN=/path/to/chrome node design/scripts/render-mockups.mjs
//
// Needs puppeteer-core, react@18.3.1, react-dom@18.3.1 and htm@3.1.1 resolvable
// from NODE_PATH (or installed next to this script). CDN requests from the page
// are answered from those local packages, so no network access is required.

import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const here = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(here, '..', '..')); // nutrition-training-companion/
const outDir = join(root, 'design', 'screens');
const chrome = process.env.CHROME_BIN;
if (!chrome) throw new Error('Set CHROME_BIN to a Chromium or Chrome executable');

const CDN = {
  'react@18.3.1/umd/react.production.min.js': 'react/umd/react.production.min.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js',
  'htm@3.1.1/dist/htm.umd.js': 'htm/dist/htm.umd.js'
};
// Package folders are located directly: their "exports" maps hide the UMD files.
const packageFile = (spec) => {
  const [name, ...rest] = spec.split('/');
  const dir = require.resolve.paths(name).map((p) => join(p, name)).find((d) => existsSync(join(d, 'package.json')));
  if (!dir) throw new Error(`cannot find package ${name}`);
  return join(dir, ...rest);
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(path.endsWith('/') ? join(path, 'index.html') : path);
    res.writeHead(200, { 'content-type': TYPES[extname(path) || '.html'] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}/design/mockups/`;

const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox', '--disable-gpu'] });
try {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', async (request) => {
    const url = request.url();
    const hit = Object.keys(CDN).find((k) => url === `https://cdn.jsdelivr.net/npm/${k}`);
    if (hit) {
      return request.respond({ status: 200, contentType: 'text/javascript', body: await readFile(packageFile(CDN[hit])) });
    }
    if (url.startsWith('http://127.0.0.1')) return request.continue();
    return request.abort();
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`);
  });

  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-screen]');
  const screens = await page.evaluate(() => window.COMPANION_SCREENS);
  if (errors.length) throw new Error(`page errors:\n${errors.join('\n')}`);

  for (const { key } of screens) {
    await page.setViewport({ width: 480, height: 1000, deviceScaleFactor: 2 });
    await page.goto(`${base}?screen=${key}`, { waitUntil: 'networkidle0' });
    const phone = await page.waitForSelector(`[data-screen="${key}"] .phone`);
    await page.evaluate(() => document.fonts.ready);
    await phone.screenshot({ path: join(outDir, `${key}.png`) });
    console.log(`design/screens/${key}.png`);
  }

  // Overview: the first screenful (390 × 844) of every phone, five to a row.
  await page.setViewport({ width: 2200, height: 1200, deviceScaleFactor: 0.75 });
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.addStyleTag({ content: '.phone { height: 844px; } .sheet-page { width: 2100px; }' });
  const sheet = await page.waitForSelector('.sheet-page');
  await sheet.screenshot({ path: join(outDir, 'overview.png') });
  console.log('design/screens/overview.png');
  if (errors.length) throw new Error(`page errors:\n${errors.join('\n')}`);
} finally {
  await browser.close();
  server.close();
}
