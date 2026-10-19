# Companion iPhone app: build contract

The App Store version of the companion. Expo SDK 57, React Native 0.86, Expo Router, TypeScript (strict). It is the clickable prototype (`../../prototype`) made native. Read this before writing a screen.

## What version 1 is

* **iPhone only, on-device.** No account and no server: everything is stored on the phone (`src/store/persistence.ts`) and can be exported or deleted from Settings. Apple's rule 5.1.1(v) says an app without account-based features must work without a login, so sign-in comes back with a sync server in a later version.
* **Sign-up:** splash, three slides, the disclaimer, the health-data consent (a tick box), Connect Apple Health (optional), age, weight, goal. Then Today, with a *Finish setting up* card (`src/features/setup.tsx`).
* **Apple Health is real** (`src/services/healthSync.ts`, `src/services/health.ts`). The app reads date of birth, sex, height and weight, plus sleep, HRV (SDNN) and resting heart rate for readiness. It never writes to Health, and it never saves anything it reads.
* **Food:**
  * barcodes and pack QR codes are scanned with the camera (`expo-camera`), parsed with `M.parseScan`, and looked up in Open Food Facts (`src/services/openFoodFacts.ts`);
  * Open Food Facts can also be searched online;
  * the bundled generic foods, your own foods, and quick add work offline.
  * There's no label-photo OCR in v1. "Add a food from its label" is a form where the person types the label's nutrition panel (per 100 g).
* **Training:** the split, split review, change requests through the evidence gate, suggestions with citations, accept and decline, the split editor, versions, and workout logging.
  * Requests are read **on the phone** by `M.parseIntent` (simple rules), not by an AI service. Say so plainly; don't mention Claude or AI features.
* **Not in v1:**
  * Oura, WHOOP and Fitbit (they need a server for OAuth);
  * push notifications;
  * AI features;
  * optional privacy choices (v1 collects nothing).

  The Notifications screen is an in-app list.

## Commands (run from `apps/mobile/`)

```bash
npx tsc --noEmit                                   # must be clean for your files
EXPO_OFFLINE=1 CI=1 npx expo export --platform web --output-dir /tmp/…/app-web
NODE_PATH=/tmp/claude-0/-home-user-Routine-Sanbox-Test/05a1b295-63f7-55c3-8a0a-b47b44d46cdc/scratchpad/tools/node_modules \
  CHROME_BIN=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  ROUTES=/your/route,/other node scripts/web-smoke.mjs /tmp/…/app-web /tmp/…/shots
```

`EXPO_OFFLINE=1` is needed because this sandbox can't reach Expo's servers. Never run `npm install`/`expo install` (ask the lead instead). Never create `ios/` or `android/`.

## Files

| Path | Owner | What |
|---|---|---|
| `src/shared/` | lead (generated) | `domain` (alias `M`) and `data` (alias `D`): the prototype's tested logic and data, the same API as `Companion.domain` / `Companion.data` in `prototype/src/10-domain.js` and `00-data.js`. Never edit; never import the `.generated.js` directly. |
| `src/theme/` | lead | Tokens: `colors`, `spacing`, `radius`, `textStyle`, `palettes`, `GUTTER`, `curve`. |
| `src/ui/` | lead | The design system in React Native (see below). |
| `src/store/` | lead | State, actions `A`, selectors `S`, `useApp`, `getState`, types. Ported from `prototype/src/20-store.js`. |
| `src/services/` | lead | `healthSync` (connect/sync/disconnect Apple Health), `health` (HealthKit readers), `openFoodFacts` (lookup and search), `exportData` (share sheet). |
| `src/features/setup.tsx` | lead | `SETUP_ITEMS`, `isDone`, `remaining`, `SetupCard`. |
| `src/features/shared.tsx` | lead | `RecBadge`, `EXTRA_LABELS`, `verifiedCount`, `isTargetRec`, `plural`, `longDate`, `whenText`. |
| `src/features/<area>/` | each builder | Components shared within your area. |
| `src/app/**` | builders, per the table below | Routes: every file is a screen. |

If you need something in a lead-owned file, don't edit it. Write a local helper in `src/features/<area>/`, and say so in your report.

### Routes and owners

| Builder | Routes (`src/app/…`) | Port from (`prototype/src/…`) |
|---|---|---|
| A, sign-up and settings | `sign-up.tsx`, `settings.tsx`, `setup/index.tsx`, `setup/health.tsx`, `setup/training.tsx`, `setup/split.tsx`, `setup/body.tsx`, `setup/goal.tsx`, `setup/age.tsx`, `setup/weight.tsx`, `targets.tsx`, `apple-health.tsx`, `your-data.tsx`, `about.tsx` | `40-onboarding.js`, `35-setup.js`, `85-settings.js` |
| B, Today and Recovery | `(tabs)/index.tsx`, `(tabs)/recovery.tsx`, `readiness.tsx`, `notifications.tsx` | `50-today.js`, `55-recovery.js`, the Notifications part of `80-history.js` |
| C, Food | `(tabs)/food.tsx`, `food/search.tsx`, `food/[id].tsx`, `food/entry/[id].tsx`, `food/quick-add.tsx`, `food/new.tsx`, `scanner.tsx` | `60-food.js` |
| D, Training | `(tabs)/training.tsx`, `training/day/[key].tsx`, `training/review.tsx`, `training/edit.tsx`, `change-request.tsx`, `recommendation/[id].tsx`, `training/version/[n].tsx`, `workout/[key].tsx` | `70-training.js` |
| E, History and evidence | `(tabs)/history.tsx`, `evidence/index.tsx`, `evidence/[key].tsx` | `80-history.js` (not Notifications), `87-evidence.js` |

Every route above already exists as a placeholder, so links between areas work from the start. Link to other areas by path:

* `router.push('/recommendation/' + id)`
* `router.push('/apple-health')`
* `router.push('/food/search')`
* `router.push('/setup/health')`

## Porting a screen

* **Port the prototype screen's behaviour and words.** Keep the same titles, captions, button labels and order. The prototype's copy follows docs/08 §8.7: plain words, sentence case, buttons that name the outcome, and British spelling.
* **Then adapt it for a real first-time user.**
  * There is no sample data. The food log, sessions and recommendations start empty.
  * `state.split` is `null` until the person picks one in `/setup/split`.
  * Targets are `null` until set: `S.hasTargets(s)`.
  * Apple Health may not be connected.

  Every screen needs a good empty state, using `EmptyAnswer` with a button to the fix.
* **Drop anything outside v1** (see above), and the prototype-only captions such as "In the prototype, …". Keep "simulated" wording only where something really is simulated.
* **React (`src/ui`).**
  * `T` for every string. Use the type sizes the prototype uses: `title2`/`title3`/`headline`/`body`/`callout`/`caption`/`micro`.
  * Other pieces: `Card`, `Button`, `LinkButton`, `IconButton`, `Chip`, `ChoiceChips`, `MultiChips`, `Input`, `Field`, `Switch`, `Check`, `Stepper`, `Rows`, `Facts`, `Badge`, `StatGauge`, `Grid2`, `EmptyAnswer`, `Section`, `Stack`, `Row`, `HairlineTop`, `DisclaimerBand`, `OptionCard`, `FromHealth`, `Icon` (SF Symbol names), `overlay.alert` / `overlay.sheet` / `overlay.toast`.
  * Never write a hex colour or a font size, never call `Alert.alert` or `ActionSheetIOS`, and never set shadows.
* **Screen scaffolds.**
  * `TabScreen` for the five tab roots (it adds the Settings gear and the bell).
  * `Screen` for content screens (back chevron automatically).
  * `FormPage` for sign-up steps, setup pages and any form with one main action at the bottom. That's the sign-up page layout: back chevron, large title, grey subtitle, fields, then the primary pill in `footer`.
  * In modals (`change-request`, `training/edit`, `workout/[key]`, `food/quick-add`, `scanner`), pass your own `left={<LinkButton label="Cancel" onPress={goBack} />}` (or `topLeft` on `FormPage`).
* **State.**
  * Read with `useApp()` for the whole state, or `useApp((s) => s.someField)` for one field. Never return a new object or array from a selector (`useApp((s) => ({…}))` loops forever in zustand 5); derive it in the component instead.
  * Change state only through `A.*`.
  * Domain functions take the whole state: `M.evaluateChange(intent, getState(), { requestText })`.
* **Navigation.** `import { router, useLocalSearchParams } from 'expo-router'`, plus `goBack()` from `@/ui`. Params are strings: parse numbers yourself.
* **Accessibility.**
  * Give every icon-only control an `accessibilityLabel`.
  * Make touch targets at least 44 pt.
  * Use `Title`/`H2`/`CardTitle` (they set `accessibilityRole="header"`).
* **Safety rules stay exactly as the prototype has them** (docs/07 §7.9). The domain enforces them; screens show its answers:
  * the health-answers gate;
  * the under-18 stop;
  * the pregnancy, condition and injury holds;
  * no calorie suggestions with a history of disordered eating.

## Done means

1. `npx tsc --noEmit` shows no errors in your files.
2. The web build renders every one of your routes with no page errors (`scripts/web-smoke.mjs` with `ROUTES=` your routes). Also test the empty first-time state and a state with data, seeded through `globalThis.__companion` (`A`, `getState`, `router`).
3. Your report lists:
   * every route;
   * anything from the prototype you left out, and why;
   * anything you needed from a lead-owned file.
