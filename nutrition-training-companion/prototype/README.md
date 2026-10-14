# Clickable prototype

The app design from `docs/`, running in a browser with sample data. It uses the Apple Design System's own component bundle and tokens, in the Readable theme, inside a 390 × 844 phone frame. Below 760 px wide it fills the screen.

## What it covers

| Area | Screens |
|---|---|
| Sign-up | Welcome, disclaimer, sign-in (simulated) with the health-data consent, Connect Apple Health (simulated) or import a real Health export, age check, weight, goal |
| Finish setting up | From Today, Training, Food or Settings: health and safety, training, current split, targets, height and sex, devices, notifications, privacy choices. Each is one page in the sign-up layout |
| Today | Nutrition and training gauges, readiness, pending suggestions, data sources |
| Food | Food log by meal, search, food detail with the plain-language health rating, barcode scanner (sample barcodes: Open Food Facts hit, FoodData Central fallback, not found), typed barcode with check-digit validation, label photo fallback with low-confidence fields and corrections, quick add, editing an entry |
| Training | Split and weekly sets per muscle, descriptive split review, change requests through the evidence gate (proposed, not enough evidence, safety pause, no room), suggestion detail with the diff, volume change and citations, split editor ("Your edit"), split versions and going back, workout logging with the pain follow-up |
| Recovery | Readiness against each device's own 28-night baseline, last 7 nights, how readiness works, and why readiness never changes the plan while its claim lacks 3 verified studies |
| History | Split timeline, nutrition target changes, and what was not changed and why |
| Settings | One page each for goal, age, weight, height and sex, health and safety, training and targets; connected devices (connect, pause, reconnect, disconnect, import a Health export), notifications, privacy choices, export and deletion, about and disclaimer |
| Evidence library | Every claim the app could act on, its status, the studies that count and the evidence against, the datasets the app would use, and downloads (CSV, JSON, Markdown) |

The evidence gate is the one in `src/10-domain.js`, and it runs for real: a change is proposed only when its claim is active and at least 3 of its sources pass every check, and accepting re-checks the gate. The claims and studies come from `../data/evidence/library.json`; every cited study is a real publication. The scanner also reads pack QR codes (GS1 Digital Link and GS1 element strings) as barcodes. Products, numbers, devices and people are sample data. Claude's request parsing is replaced by a keyword matcher. Sign-in, cameras, device connections and the account export are simulated; the evidence and dataset downloads are real files. A web page can't read Apple Health (HealthKit has no web API), so connecting it is simulated too, but a real Health export (`export.zip` from the Health app) can be read on the device to fill in age, weight and height; nothing is uploaded. State is kept in this browser's `localStorage` only.

## Run it

The published prototype: <https://claude.ai/artifact/GDGfHTP6UzXPAv3v8YoSzm> (private to its owner until shared). On a desktop, the side panel shows a QR code for opening it on a phone, and buttons for downloading the evidence library and the dataset catalogue. On a phone, the same downloads are under Settings → Evidence library.

Or open `dist/index.html` in a browser. It is one self-contained page. React 18.3.1 and htm 3.1.1 load from public CDNs.

To work on the source, serve the `nutrition-training-companion/` folder (for example `python3 -m http.server` in that folder) and open `/prototype/`. That page links the files in `src/` in place.

After any change:

```sh
node data/build.mjs                       # CSV, RIS, BibTeX and Markdown copies of data/*.json
node prototype/build.mjs                  # generated modules, index.html and dist/index.html
node prototype/scripts/smoke.mjs --dist   # opens every screen and variant, fails on any page error
```

If the page is published somewhere new, put its address in `published-url.txt` and run `node prototype/scripts/make-qr.mjs` (it needs the `qrcode` npm package) before building.

The smoke test needs Playwright and Chromium. `scripts/harness.mjs` answers the CDN requests from local `react`, `react-dom` and `htm` packages, so it runs offline.

`CONTRACT.md` describes the file layout, the screen registry and the rules for adding screens.
