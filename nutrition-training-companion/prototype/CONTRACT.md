# Prototype build contract

The clickable prototype of the Nutrition & Training Companion. It is plain browser JavaScript: React 18 UMD, `htm` for markup, and the Apple Design System bundle (`window.AppleDS`). There is no build step except `node prototype/build.mjs`, which concatenates the files.

Read these before writing a screen:

* `docs/08-ui-design.md`: design rules, palettes, screen specs, copy.
* `docs/07-product-flows.md`: onboarding, dashboard, history, health rating, split review, safety rules.
* `docs/06-evidence-gate.md`: what the gate does and what the user sees.
* `design/mockups/screens.js`: static versions of 13 screens. Match them where they overlap.
* `design/apple-design-system/bundle.js` and `components/*` READMEs (via `design/README.md`): the components.

## Files and load order

`src/*.js` load in filename order:

| File | Owner | What |
|---|---|---|
| `00-data.js` | core | sample data, exercise catalogue, products, label samples, wearable series |
| `01-evidence.generated.js` | build | `Companion.data.SOURCES`, `CLAIMS`, `EVIDENCE` and `CATALOGUE` from `data/evidence/library.json` and `data/catalogue/catalogue.json` (never edit) |
| `02-downloads.generated.js` | build | `Companion.downloads`: the files in `data/` the page offers for download (never edit) |
| `05-palettes.generated.js` | build | `Companion.palettes` from `design/app-palettes.json` (never edit) |
| `10-domain.js` | core | pure logic: health rating, barcode check digit and lookup, label parsing and estimates, weekly volume, split review, diffs, intent parsing, **evidence gate**, readiness |
| `20-store.js` | core | state, `Companion.actions`, navigation, overlays, persistence, `Companion.selectors` |
| `30-ui.js` | core | `Companion.ui` kit and `Companion.registerScreen` |
| `33-health-import.js` | core | `Companion.healthImport`: reads an Apple Health export (`export.zip` or `export.xml`) in the browser, as a stream, and the simulated HealthKit result |
| `35-setup.js` | core | `Companion.setup`: the sign-up page layout (`FormPage`), the *Finish setting up* list and card, and the setup pages (health and safety, training, split, height and sex, goal, age, weight, notifications, Health import) |
| `40-onboarding.js` | builder A | sign-up: disclaimer, account and consent, Apple Health, age, weight, goal |
| `50-today.js`, `55-recovery.js` | builder B | Today tab, Recovery tab, readiness detail |
| `60-food.js` | builder C | Food tab and every food flow |
| `70-training.js` | builder D | Training tab, split, change requests, recommendation detail, workouts |
| `80-history.js`, `85-settings.js` | builder E | History, notifications, Settings and everything under it |
| `87-evidence.js` | core | Evidence library: claims, their studies, the dataset catalogue and downloads |
| `90-main.js` | core | router, shell, overlays, side-panel tour, debug hook, mount (loads last) |

**Only edit the files you own.** If you need something from core (a new action, selector or UI piece), do not edit core files. Implement a local helper in your own file, and list the request in your final report.

## Writing a screen

```js
(function () {
  'use strict';
  const C = window.Companion;
  const { html, T, Card, Button, Input, StatGauge, Chip, Screen, PlainScreen, Section, Sections, Facts, Rows,
          Badge, Caption, Callout, Body, Micro, H2, CardTitle, LinkButton, IconButton, Switch, Glyph,
          EmptyAnswer, DisclaimerBand, Actions, NutritionCard, HealthRatingList, CitationCard, ClaimCard,
          DiffCard, VolumeCard, DriversList, ChoiceChips, Stepper, useScreen, isoDate } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;

  function FoodDetail({ params }) {
    const s = C.useApp();                    // whole state; re-renders on any change
    const food = M.findFood(params.foodId, s.customFoods);
    return html`<${Screen} title=${food.name} subtitle=${food.brand}>
      <${Sections}> … <//>
    <//>`;
  }
  C.registerScreen('food-detail', FoodDetail, {
    title: 'Food detail', tab: 'food', presentation: 'push',
    demoParams: { foodId: 'p-oat-bar' },               // used by the smoke test
    demoParamsList: [{ foodId: 'p-oat-bar' }, { foodId: 'p-orange-drink' }]   // optional extra variants
  });
})();
```

* `htm`: `<${Comp} prop=${x}>…<//>`. Use `className`, camelCase SVG attributes, and a `key` on list items.
* **Screen scaffolds.**
  * `Screen` is the collapsing large-title `AppHeader`. It gives tab roots the settings button and bell, pushed screens a back chevron, and modal roots a "Close" link (set `closeLabel`, e.g. "Cancel").
  * `PlainScreen` is the plain skeleton (title2 + subtitle, content, then actions pushed to the bottom). Use it for onboarding steps and form sheets. Props: `topLeft` / `topRight` slots, `footer` for the bottom actions, and `dark` for camera covers.
  * Today has its own fixed hero (see the mockup). Apply `padding-top: var(--safe-top)` yourself there via the `.screen` class.
* **Navigation** (`C.actions`):
  * `go(tab)`, `push(key, params)`, `pop()`, `replace(key, params)`, `popToRoot()`;
  * `present(key, params, 'sheet' | 'cover')`, `dismiss()`, `dismissAll()`;
  * `openIn(tab, key, params)` closes any modal, switches tab and opens a screen.

  Inside a modal, `push` and `pop` work within that modal's stack.
* **Overlays.**
  * `A.alert({title, message, buttons: [{label, style: 'default' | 'cancel' | 'destructive', onPress}]})`
  * `A.sheet({options: [{label, style, onPress}], title?})`. Cancel is added for you.
  * `A.toast(message, 'info' | 'success' | 'error')`. Toast copy is one line of plain fact, never health values in notifications.

  Handlers run after the overlay closes. Never use `window.alert` / `confirm`.
* **Data changes go through `C.actions` only.** See `20-store.js` for the full list:
  * food: `logFood`, `updateLogEntry`, `deleteLogEntry`, `saveCustomFood`, `setTargets`;
  * training: `saveSplitEdit`, `revertToVersion`, `logSession`;
  * recommendations: `createRecommendation`, `acceptRecommendation`, `rejectRecommendation`;
  * devices: `toggleDataType`, `pauseDevice`, `connectDevice`, `disconnectDevice`;
  * profile and privacy: `updateProfile`, `completeOnboarding`, `acknowledgeDisclaimer`, `setConsent`, `markNotificationsRead`, `requestExport`, `requestDeletion`, `cancelDeletion`, `resetPrototype`.
* **Selectors** (`C.selectors`): `todayEntries`, `todayTotals`, `currentVersion`, `currentDefinition`, `weekSessions`, `weekDoneVolume`, `unreadNotifications`, `recommendation(s, id)`.
* **The evidence gate is domain logic, not UI.**
  * Call `M.parseIntent(text)`, then `M.evaluateChange(intent, state, {requestText})`, then `A.createRecommendation(draft, {trigger, requestText})`.
  * Show whatever status comes back: `proposed`, `blocked_insufficient_evidence`, `blocked_safety`, `blocked_constraints`, `not_needed` (a target already meets the evidence), `not_understood`, or `user_edit`.
  * Split changes have `kind: 'split_change'`; daily nutrition target suggestions (protein, fibre) have `kind: 'target_change'` and carry `proposal.targets: [{ key, label, before, after, unit }]`. Accepting one updates the targets and records a target-history entry with `origin: 'app_recommendation'`.
  * Never fabricate a proposal the gate did not return. Never show a source that `M.isVerified` rejects.

## Screen keys (fixed, so screens can link to each other)

| Key | Owner | Presentation | Params |
|---|---|---|---|
| `onboarding` | A | root when `!state.onboarded` | reads `state.onboardingDemo.step` (debug start step) |
| `today` | B | tab root | |
| `recovery` | B | tab root | |
| `readiness` | B | push | |
| `food` | C | tab root | |
| `food-search` | C | push | `{ meal? }` |
| `food-detail` | C | push (or inside a modal stack) | `{ foodId, grams?, meal?, entryId? }` |
| `scanner` | C | cover | |
| `barcode-entry` | C | sheet | |
| `barcode-not-found` | C | push inside the scanner modal | `{ gtin }` |
| `label-capture` | C | cover | |
| `label-review` | C | push inside its modal | `{ sampleId }` |
| `quick-add` | C | sheet | `{ meal? }` |
| `log-entry` | C | push | `{ id }` |
| `training` | D | tab root | |
| `split-day` | D | push | `{ dayKey }` |
| `split-review` | D | push | |
| `split-edit` | D | sheet | `{ dayKey? }` |
| `change-request` | D | sheet | `{ text? }` (prefills the request) |
| `recommendation` | D | push | `{ id }` |
| `split-version` | D | push | `{ number }` |
| `workout` | D | sheet | `{ dayKey }` |
| `history` | E | tab root | |
| `notifications` | E | push | |
| `settings` | E | push | |
| `profile` | E | push | |
| `targets` | E | push | |
| `devices` | E | push | |
| `device` | E | push | `{ provider }` (`apple_health`, `oura`, `whoop`, `google_health`) |
| `privacy` | E | push | |
| `your-data` | E | push | |
| `about` | E | push | |

## Design rules (from the Apple Design System; reviewers check every one)

* **Tokens only.** No raw hex, px font sizes or ad-hoc radii in screens.
  * Use `T` (ThemedText) for every string, with `size`, `font` (regular / semiBold / bold, never 500) and a `color` token.
  * Use `style` only for layout (`gap`, `padding` with `var(--spacing-*)`).
  * Use the helper classes `stack`, `stack-sm`, `stack-xs`, `stack-xxs`, `sections`, `row`, `row--between`, `row--wrap`, `grow`, `spacer`, `grid2`, `tabular`, `hairline-top`, `band`, `photo`, `facts`.
* **One accent.** Interactive = `primary` (`primaryOnDark` on dark). `success`, `warning` and `danger` appear only as states, with their word, using `Badge` and the app palettes.
* **Pills** for the main action, search fields and filter chips: one primary `Button` per screen, full width at the bottom. `outline` for the second action, `ghost` for a tertiary one, `danger` only for destruction.
* **No shadows.** Cards are `Card` (1px hairline). Lists are `Rows` / `Facts`. Separate sections by spacing or a surface change (`DisclaimerBand`, `.band`).
* **Metrics on Today are `StatGauge`s**, never plain number cards. Gauges never turn red when over target.
* **Icons** come from `Glyph` by SF Symbol name (see the stand-in list in `30-ui.js`). Interactive icons are `primary`, structural ones `ink`, muted ones `inkMuted48`.
* **Every interactive element is a real `<button>` or `<a href>`**, with an `aria-label` on icon-only buttons. Touch targets are at least 44px where possible.
* **Motion** is already in the shell. Don't add more.

## Copy rules

* Sentence case. "You" for the person, "we" for the app.
* Buttons name the outcome: "Log 1 bar, 165 kcal", "Apply change", "Reconnect WHOOP". Never "Submit" or "OK".
* No emoji, no exclamation marks. One-line plain-fact subtitles.
* Status by word, never colour alone. Describe food; never judge it.
* Say what is estimated, and show ranges for estimates.
* This is a prototype: actions that would leave the app (real camera, OAuth, email) are **simulated**. Say so briefly where it matters, e.g. "In the app this opens your camera. Here, pick a sample photo."

## Testing your screens

```bash
cd /home/user/Routine-Sanbox-Test/nutrition-training-companion
node prototype/build.mjs                       # after adding or renaming files
S=/tmp/claude-0/-home-user-Routine-Sanbox-Test/05a1b295-63f7-55c3-8a0a-b47b44d46cdc/scratchpad
export NODE_PATH=$S/tools/node_modules CHROME_BIN=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
# Isolated: load only the core plus YOUR files, so other builders' work in progress can't break your run
PROTOTYPE_FILES=60-food.js SHOTS_DIR=$S/shots/<your-letter> node prototype/scripts/smoke.mjs <key-prefix> ...   # must print 0 failed
```

Always test with `PROTOTYPE_FILES` set to your own file(s). Links to other builders' screens show the "not built yet" placeholder in isolation, which is expected. The shared `index.html` / `dist/` is rebuilt by whoever runs `build.mjs`; don't rely on it while others are working.

Cross-file hooks, so files don't depend on each other's internals:

* Builder C defines `C.flows.openAddFood(meal?)`. It opens the "Add food" sheet (Scan a barcode / Photograph a label / Search foods / Quick add calories). Today calls it.
* Everyone else navigates by screen key only.

Guard every hook call, e.g. `(C.flows && C.flows.openAddFood) ? C.flows.openAddFood() : A.go('food')`. Create the namespace with `C.flows = C.flows || {}`.

* `prototype/scripts/harness.mjs` exposes `launch()` with `show(key, params)`, `tap(text)`, `type(labelOrSelector, value)`, `shot(name)`, `state()` and `errors`. Write a small flow script in the scratchpad (not in the repo) to click through your flows end to end.
* **Look at your screenshots** with the Read tool. Fix anything clipped, overlapping, off-token or unreadable.
* Run `node --check` on your file.
* The final smoke run over your keys must report 0 failures.
