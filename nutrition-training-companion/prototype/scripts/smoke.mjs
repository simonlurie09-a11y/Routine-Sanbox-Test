#!/usr/bin/env node
// Opens every registered screen (with its demoParams / demoParamsList) and
// fails if anything errors. Screenshots go to SHOTS_DIR (default prototype/.shots).
//
//   CHROME_BIN=... NODE_PATH=... node prototype/scripts/smoke.mjs [--dist] [screenKeyPrefix ...]

import { launch } from './harness.mjs';

const args = process.argv.slice(2);
const dist = args.includes('--dist');
const only = args.filter((a) => !a.startsWith('--'));

const app = await launch({ dist });
let failures = 0;
try {
  const screens = await app.page.evaluate(() => window.CompanionDebug.screens());
  const selected = screens.filter((s) => !only.length || only.some((p) => s.key.startsWith(p)));
  for (const s of selected) {
    const variants = s.demoParamsList && s.demoParamsList.length ? s.demoParamsList : [s.demoParams || {}];
    for (let i = 0; i < variants.length; i++) {
      const before = app.errors.length;
      await app.show(s.key, variants[i]);
      const name = variants.length > 1 ? `${s.key}--${i + 1}` : s.key;
      const missing = await app.page.evaluate(() => (document.querySelector('.app').innerText || '').includes("This screen isn't in the prototype yet"));
      await app.shot(name);
      const fresh = app.errors.slice(before);
      if (fresh.length || missing) {
        failures++;
        console.log(`FAIL ${name}${missing ? ' (renders the "not built" placeholder)' : ''}\n  ${fresh.join('\n  ')}`);
      } else {
        console.log(`ok   ${name}`);
      }
    }
  }
  console.log(`${selected.length} screens checked, ${failures} failed. Shots in ${app.shotsDir}`);
} finally {
  await app.close();
}
process.exit(failures ? 1 : 0);
