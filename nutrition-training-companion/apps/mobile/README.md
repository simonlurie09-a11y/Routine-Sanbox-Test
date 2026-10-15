# Companion for iPhone

The App Store version of the companion: food logging with barcode and pack-QR scanning, a training plan with versions, training suggestions that pass the evidence gate, and readiness from Apple Health. Built with Expo SDK 57 (React Native 0.86, Expo Router, TypeScript).

* **Releasing it:** see [../../app-store/README.md](../../app-store/README.md), the step-by-step guide from this folder to the App Store.
* **How the code is organised and the rules for screens:** see [CONTRACT.md](CONTRACT.md).
* **The design and product rules:** [docs/07](../../docs/07-product-flows.md) and [docs/08](../../docs/08-ui-design.md).

## Version 1 at a glance

| | |
|---|---|
| Devices | iPhone, iOS 16.4 or later. Portrait. No iPad layout. |
| Account | None. Everything is stored on the phone, encrypted by iOS Data Protection. Export and delete are in Settings → Your data. |
| Apple Health | Read-only: date of birth, sex, height, weight, sleep, HRV (SDNN), resting heart rate. Nothing read is saved by the app. |
| Food data | Open Food Facts (barcode lookup and search, online), the bundled generic foods, and the person's own foods. |
| Evidence | The verified evidence library from [`data/evidence`](../../data/evidence), bundled. |
| Not yet | Accounts and sync, Oura / WHOOP / Fitbit, label-photo OCR, AI request parsing, push notifications. |

## Run it

You need Node.js 20 or later. To run on an iPhone or the iOS Simulator you also need either a Mac with Xcode, or an EAS development build. HealthKit and the camera don't work in Expo Go or on the web.

```bash
npm install
npm run sync          # copy the prototype's domain logic, evidence library and design tokens into src/
npx expo run:ios      # on a Mac: builds and opens the Simulator (HealthKit works in the Simulator)
npm run web           # a browser preview; Apple Health uses sample data there
```

## Check it

```bash
npm run check         # generated files up to date, typecheck, unit tests
EXPO_OFFLINE=1 npx expo export --platform web --output-dir dist-web
NODE_PATH=<folder with puppeteer-core> CHROME_BIN=<chromium> node scripts/web-smoke.mjs dist-web   # renders every route
```

`scripts/web-smoke.mjs` opens every screen in headless Chromium at iPhone size, fails on any error, and saves a screenshot of each. `scripts/store-screenshots.mjs` renders the App Store screenshots (1320 × 2868) the same way.

## The shared code

The domain logic is written once, in [`prototype/src/10-domain.js`](../../prototype/src/10-domain.js), and covered by the prototype's end-to-end tests:

* the evidence gate;
* the health rating;
* split review and diffs;
* readiness;
* GS1 barcode and QR parsing.

`npm run sync` copies it here (`src/shared/companion.generated.js`), with the exercise catalogue, the generic foods and the evidence library. After changing the prototype's logic or the evidence library, run `node prototype/build.mjs` and then `npm run sync`.
