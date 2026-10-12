# Clickable prototype

The app design from `docs/`, running in a browser with sample data. It uses the Apple Design System's own component bundle and tokens, in the Readable theme, inside a 390 × 844 phone frame. Below 760 px wide it fills the screen.

## What it covers

| Area | Screens |
|---|---|
| Onboarding | Welcome, disclaimer, sign-in (simulated), privacy choices, age check, goal, body basics, health and safety, training, current split, targets, devices, notifications |
| Today | Nutrition and training gauges, readiness, pending suggestions, data sources |
| Food | Food log by meal, search, food detail with the plain-language health rating, barcode scanner (sample barcodes: Open Food Facts hit, FoodData Central fallback, not found), typed barcode with check-digit validation, label photo fallback with low-confidence fields and corrections, quick add, editing an entry |
| Training | Split and weekly sets per muscle, descriptive split review, change requests through the evidence gate (proposed, not enough evidence, safety pause, no room), suggestion detail with the diff, volume change and citations, split editor ("Your edit"), split versions and going back, workout logging with the pain follow-up |
| Recovery | Readiness against each device's own 28-night baseline, last 7 nights, how readiness works, and why readiness never changes the plan while its claim lacks 3 verified studies |
| History | Split timeline, nutrition target changes, and what was not changed and why |
| Settings | Profile and safety flags, targets, connected devices (connect, pause, reconnect, disconnect), privacy choices, export and deletion, about and disclaimer |

The evidence gate is the one in `src/10-domain.js`, and it runs for real: a change is proposed only when its claim is active and at least 3 of its sources pass every check, and accepting re-checks the gate. The three cited studies are real publications. Products, numbers, devices and people are sample data. Claude's request parsing is replaced by a keyword matcher. Sign-in, cameras, device connections and downloads are simulated, and state is kept in this browser's `localStorage` only.

## Run it

Open `dist/index.html` in a browser. It is one self-contained page. React 18.3.1 and htm 3.1.1 load from public CDNs.

To work on the source, serve the `nutrition-training-companion/` folder (for example `python3 -m http.server` in that folder) and open `/prototype/`. That page links the files in `src/` in place.

After any change:

```sh
node prototype/build.mjs                  # regenerates src/05-palettes.generated.js, index.html and dist/index.html
node prototype/scripts/smoke.mjs --dist   # opens every screen and variant, fails on any page error
```

The smoke test needs Playwright and Chromium. `scripts/harness.mjs` answers the CDN requests from local `react`, `react-dom` and `htm` packages, so it runs offline.

`CONTRACT.md` describes the file layout, the screen registry and the rules for adding screens.
