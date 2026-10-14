#!/usr/bin/env node
// Builds the clickable prototype.
//
//   node prototype/build.mjs
//
// 1. src/05-palettes.generated.js  ← design/app-palettes.json
//    src/01-evidence.generated.js  ← data/evidence/library.json, data/catalogue/catalogue.json
//    src/02-downloads.generated.js ← the files data/build.mjs writes (run it first)
// 2. index.html                    development entry: links the files in place
// 3. dist/index.html               one self-contained page (what gets published);
//                                  React 18.3.1 from cdnjs and htm 3.1.1 from jsDelivr
//
// If prototype/published-url.txt holds the published page's address and
// prototype/phone-qr.svg exists (scripts/make-qr.mjs writes it), the side
// panel shows a QR code for opening the prototype on a phone.
//
// Source files load in filename order, so 00-data, 05-palettes, 10-domain,
// 20-store, 30-ui, then the screen files (40–89), then 90-main last.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..'); // nutrition-training-companion/
const read = (p) => readFileSync(join(root, p), 'utf8');

const TITLE = 'Nutrition & Training Companion';
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js'
];

// 1. Palettes
const palettes = JSON.parse(read('design/app-palettes.json'));
delete palettes.$comment;
writeFileSync(
  join(here, 'src/05-palettes.generated.js'),
  `/* Generated from design/app-palettes.json by prototype/build.mjs. Do not edit. */\n` +
    `(function () {\n  'use strict';\n  window.Companion.palettes = ${JSON.stringify(palettes, null, 2).replace(/\n/g, '\n  ')};\n})();\n`
);

// Evidence library and dataset catalogue: the app reads these as data.
/* JSON for an inline <script>: never let a string close the tag. */
const js = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');
const generated = (from, body) => `/* Generated from ${from} by prototype/build.mjs. Do not edit. */\n(function () {\n  'use strict';\n${body}\n})();\n`;
const library = JSON.parse(read('data/evidence/library.json'));
const catalogue = JSON.parse(read('data/catalogue/catalogue.json'));
writeFileSync(
  join(here, 'src/01-evidence.generated.js'),
  generated('data/evidence/library.json and data/catalogue/catalogue.json',
    `  const C = window.Companion;\n  Object.assign(C.data, ${js({
      SOURCES: library.sources.map(({ verification, ...s }) => ({ ...s, verificationMethod: verification ? verification.method : null })),
      CLAIMS: library.claims,
      EVIDENCE: { version: library.version, reviewedAt: library.reviewedAt, method: library.method },
      CATALOGUE: catalogue
    })});`)
);

// Downloadable copies of data/ (only extensions the artifact viewer allows).
const DOWNLOADS = [
  { key: 'sources-csv', file: 'data/evidence/sources.csv', filename: 'companion-evidence-studies.csv', label: 'Studies', format: 'CSV', detail: 'Every study with its links, findings and the six checks. Opens in Excel, Numbers or Google Sheets.' },
  { key: 'claims-csv', file: 'data/evidence/claims.csv', filename: 'companion-evidence-claims.csv', label: 'Claims', format: 'CSV', detail: 'Each claim, its status and the studies behind it.' },
  { key: 'report-md', file: 'data/evidence/evidence-library.md', filename: 'companion-evidence-library.md', label: 'Evidence report', format: 'Markdown', detail: 'The whole library as a readable report.' },
  { key: 'library-json', file: 'data/evidence/library.json', filename: 'companion-evidence-library.json', label: 'Evidence library', format: 'JSON', detail: 'Claims and studies, with verification notes, for developers.' },
  { key: 'datasets-csv', file: 'data/catalogue/datasets.csv', filename: 'companion-datasets.csv', label: 'Datasets to download', format: 'CSV', detail: 'Food, barcode, research and wearable data sources, with licences and links.' },
  { key: 'datasets-md', file: 'data/catalogue/what-to-download.md', filename: 'companion-what-to-download.md', label: 'What to download', format: 'Markdown', detail: 'Which files to get first, and the hosts to allow.' }
].filter((d) => existsSync(join(root, d.file)));
writeFileSync(
  join(here, 'src/02-downloads.generated.js'),
  generated('the files in data/', `  window.Companion.downloads = ${js(DOWNLOADS.map(({ file, ...d }) => ({ ...d, source: file, content: read(file) })))};`)
);

// 2. Sources in load order
const srcFiles = readdirSync(join(here, 'src')).filter((f) => f.endsWith('.js')).sort();
if (srcFiles[srcFiles.length - 1] !== '90-main.js') throw new Error('90-main.js must load last');

const CSS = ['design/generated/tokens.css', 'design/apple-design-system/bundle.css', 'prototype/app.css'];
const BUNDLE = 'design/apple-design-system/bundle.js';

/* QR code for opening the published page on a phone (see the header). */
function phoneQr() {
  const urlFile = join(here, 'published-url.txt');
  const svgFile = join(here, 'phone-qr.svg');
  if (!existsSync(urlFile) || !existsSync(svgFile)) return '';
  const url = readFileSync(urlFile, 'utf8').trim();
  const svg = readFileSync(svgFile, 'utf8').trim().replace('<svg ', '<svg class="phone-qr__code" role="img" aria-label="QR code for this prototype" ');
  return `<div class="phone-qr">
      ${svg}
      <div class="phone-qr__text">
        <p class="intro__label">Open it on your phone</p>
        <p class="intro__note">Scan with your phone's camera, or go to <span class="phone-qr__url">${url.replace(/^https:\/\//, '')}</span></p>
      </div>
    </div>`;
}

const body = (scriptsHtml) => `<div class="stage">
  <aside class="intro" aria-label="About this prototype">
    <p class="intro__eyebrow">Clickable prototype</p>
    <h1 class="intro__title">${TITLE}</h1>
    <p class="intro__text">The app design, running in your browser with sample data and built from the Apple Design System. Tap around the phone, or jump to a flow:</p>
    <p class="intro__label">Try</p>
    <div id="tour-root"></div>
    <p class="intro__label">Download the data</p>
    <div id="downloads-root"></div>
    ${phoneQr()}
    <p class="intro__note">The ${library.sources.length} cited studies are real publications. Products, numbers, devices and people are sample data. Nothing leaves your browser, and nothing here is medical advice.</p>
  </aside>
  <div class="device"><div id="app-root"></div></div>
</div>
${scriptsHtml}`;

// Development entry (served from nutrition-training-companion/)
const devScripts = [
  ...CDN.map((u) => `<script src="${u}"></script>`),
  `<script src="../${BUNDLE}"></script>`,
  ...srcFiles.map((f) => `<script src="src/${f}"></script>`)
].join('\n');
writeFileSync(
  join(here, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${TITLE}</title>
${CSS.map((c) => `<link rel="stylesheet" href="${relative('prototype', c)}">`).join('\n')}
</head>
<body>
${body(devScripts)}
</body>
</html>
`
);

// 3. Single-file page for publishing (the publish step adds doctype/head/body).
const guard = (name, text) => {
  if (/<\/script/i.test(text) || /<!--/.test(text)) throw new Error(`${name} contains "</script" or "<!--"; it cannot be inlined`);
  return text;
};
const css = CSS.map((c) => `/* ${c} */\n${read(c)}`).join('\n');
if (/<\/style/i.test(css)) throw new Error('CSS contains "</style"');
const inlineScripts = [
  ...CDN.map((u) => `<script src="${u}"></script>`),
  `<script>\n${guard(BUNDLE, read(BUNDLE))}\n</script>`,
  `<script>\n${srcFiles.map((f) => `/* src/${f} */\n${guard(f, readFileSync(join(here, 'src', f), 'utf8'))}`).join('\n')}\n</script>`
].join('\n');
const dist = `<title>${TITLE}</title>
<style>
${css}
</style>
${body(inlineScripts)}
`;
writeFileSync(join(here, 'dist/index.html'), dist);
console.log(`built: ${srcFiles.length} source files, dist/index.html ${(dist.length / 1024).toFixed(0)} KB`);
