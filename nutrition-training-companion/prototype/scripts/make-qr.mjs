#!/usr/bin/env node
// Writes prototype/phone-qr.svg from the address in prototype/published-url.txt,
// so the side panel can show a QR code for opening the prototype on a phone.
// Needs the "qrcode" package (npm) resolvable from NODE_PATH. Run build.mjs after.
//
//   NODE_PATH=... node prototype/scripts/make-qr.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(process.env.NODE_PATH || here, 'x'));
const QRCode = require('qrcode');
const url = readFileSync(join(here, '..', 'published-url.txt'), 'utf8').trim();
if (!/^https:\/\//.test(url)) throw new Error('published-url.txt must hold an https address');
const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } });
writeFileSync(join(here, '..', 'phone-qr.svg'), svg.trim() + '\n');
console.log(`phone-qr.svg written for ${url}`);
