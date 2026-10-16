#!/usr/bin/env node
// Renders the App Store screenshots (6.9-inch iPhone, 1320 × 2868) from the
// exported web build, with realistic sample data seeded through the web-only
// debug hook. The web build uses the system's line icons where the iPhone
// shows SF Symbols; retake them in the iOS Simulator for pixel-exact symbols.
//
//   EXPO_OFFLINE=1 npx expo export --platform web --output-dir dist-web
//   NODE_PATH=<dir with puppeteer-core> CHROME_BIN=<chromium> node scripts/store-screenshots.mjs dist-web ../../app-store/screenshots
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const root = process.argv[2] || 'dist-web';
const out = process.argv[3] || 'store-screenshots';
mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  const file = existsSync(path) && extname(path) ? path : join(root, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
/* 440 × 956 points at 3x = 1320 × 2868 pixels. */
await page.setViewport({ width: 440, height: 956, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const ready = () => page.waitForFunction(() => !!globalThis.__companion, { timeout: 20000 });
await page.goto(`${base}/sign-up`, { waitUntil: 'networkidle0' });
await ready();
const recId = await page.evaluate(() => {
  const { A, data: D, domain: M, getState } = globalThis.__companion;
  const DAY = 86400000;
  const today = D.startOfToday();
  const at = (days, h, m = 0) => today - days * DAY + (h * 60 + m) * 60000;
  A.acknowledgeDisclaimer();
  A.agreeToHealthData();
  A.completeOnboarding(
    { goal: 'muscle_gain', birthYear: 1994, birthDate: '1994-03-08', weightKg: 82.4, heightCm: 180, sexForEquations: 'male', experience: 'intermediate', daysPerWeek: 4, sessionMinutes: 60 },
    { setup: { health: true, training: true, split: true, targets: true, body: true, devices: true } }
  );
  A.chooseSplit('sample');
  A.setTargets({ energyKcal: 2300, proteinG: 160, carbohydrateG: 260, fatG: 75, fiberG: 30 });
  const food = (id) => M.findFood(id, getState().customFoods);
  const yogurt = { id: 'food-yogurt', name: 'Greek-style yogurt', brand: null, source: 'user', attribution: 'Entered from the label', confidence: 'high',
    serving: { grams: 150, label: '1 pot (150 g)' }, nutrients: { energyKcal: 97, proteinG: 9, carbohydrateG: 4, sugarsG: 4, fatG: 5, saturatedFatG: 3.4, fiberG: 0, sodiumMg: 40 },
    ingredients: 'Milk, cream, live cultures', nova: 1, additives: [] };
  A.saveCustomFood(yogurt);
  A.logFood({ food: food('g-oats'), grams: 60, meal: 'breakfast', at: at(0, 7, 40) });
  A.logFood({ food: food('food-yogurt'), grams: 150, meal: 'breakfast', at: at(0, 7, 41) });
  A.logFood({ food: food('g-banana'), grams: 120, meal: 'breakfast', at: at(0, 7, 42) });
  A.logFood({ food: food('g-chicken'), grams: 150, meal: 'lunch', at: at(0, 12, 50) });
  A.logFood({ food: food('g-rice'), grams: 180, meal: 'lunch', at: at(0, 12, 50) });
  A.logFood({ food: food('g-broccoli'), grams: 100, meal: 'lunch', at: at(0, 12, 51) });
  A.logFood({ food: food('g-olive-oil'), grams: 10, meal: 'lunch', at: at(0, 12, 51) });
  const def = getState().split.versions[0].definition;
  const sets = (key) => def.days.find((d) => d.key === key).items.map((it) => ({ exercise: it.exercise, setsDone: it.sets }));
  A.logSession({ dayKey: 'upper_b', version: 1, sets: sets('upper_b'), rpe: 8, soreness: 3, at: at(4, 18) });
  A.logSession({ dayKey: 'lower_b', version: 1, sets: sets('lower_b'), rpe: 8, soreness: 4, at: at(3, 18) });
  A.logSession({ dayKey: 'upper_a', version: 1, sets: sets('upper_a'), rpe: 7, soreness: 2, at: at(1, 18) });
  A.setAppleHealth({ status: 'active', connectedAt: at(60, 9), lastSync: Date.now(), dataTypes: { sleep: true, hrv: true, resting_hr: true } });
  const text = 'I want a bigger back';
  const draft = M.evaluateChange(M.parseIntent(text), getState(), { requestText: text });
  return A.createRecommendation(draft, { requestText: text });
});
await new Promise((r) => setTimeout(r, 800));

const SHOTS = [
  ['1-today', '/'],
  ['2-food', '/food'],
  ['3-food-detail', '/food/food-yogurt'],
  ['4-suggestion', `/recommendation/${recId}`],
  ['5-training', '/training'],
  ['6-recovery', '/recovery'],
  ['7-evidence', '/evidence']
];
for (const [name, route] of SHOTS) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
  await ready();
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`saved ${name}.png (${route})`);
}
await browser.close();
server.close();
if (errors.length) {
  console.error(`page errors:\n${errors.join('\n')}`);
  process.exit(1);
}
