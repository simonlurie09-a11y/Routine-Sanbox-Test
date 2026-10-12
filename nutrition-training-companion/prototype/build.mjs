#!/usr/bin/env node
// Builds the clickable prototype.
//
//   node prototype/build.mjs
//
// 1. src/05-palettes.generated.js  ← design/app-palettes.json
// 2. index.html                    development entry: links the files in place
// 3. dist/index.html               one self-contained page (what gets published);
//                                  React 18.3.1 from cdnjs and htm 3.1.1 from jsDelivr
//
// Source files load in filename order, so 00-data, 05-palettes, 10-domain,
// 20-store, 30-ui, then the screen files (40–89), then 90-main last.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

// 2. Sources in load order
const srcFiles = readdirSync(join(here, 'src')).filter((f) => f.endsWith('.js')).sort();
if (srcFiles[srcFiles.length - 1] !== '90-main.js') throw new Error('90-main.js must load last');

const CSS = ['design/generated/tokens.css', 'design/apple-design-system/bundle.css', 'prototype/app.css'];
const BUNDLE = 'design/apple-design-system/bundle.js';

const body = (scriptsHtml) => `<div class="stage">
  <aside class="intro" aria-label="About this prototype">
    <p class="intro__eyebrow">Clickable prototype</p>
    <h1 class="intro__title">${TITLE}</h1>
    <p class="intro__text">The app design, running in your browser with sample data and built from the Apple Design System. Tap around the phone, or jump to a flow:</p>
    <p class="intro__label">Try</p>
    <div id="tour-root"></div>
    <p class="intro__note">The three cited studies are real publications. Products, numbers, devices and people are sample data. Nothing leaves your browser, and nothing here is medical advice.</p>
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
