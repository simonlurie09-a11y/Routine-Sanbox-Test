# Releasing Companion on the App Store

The iPhone app is in [`../apps/mobile`](../apps/mobile). This folder holds everything App Store Connect asks for, plus the steps from here to "Ready for Sale".

| File | What it's for |
|---|---|
| [metadata.md](metadata.md) | Name, subtitle, description, keywords, categories, screenshots, review contact. |
| [privacy-policy.md](privacy-policy.md) · [privacy-policy.html](privacy-policy.html) | The privacy policy. Host the HTML page publicly and use its address. |
| [app-privacy-answers.md](app-privacy-answers.md) | The App Privacy questionnaire: "Data Not Collected", and why. |
| [age-rating.md](age-rating.md) | The age rating questionnaire. |
| [review-notes.md](review-notes.md) | Notes for the App Review team. |
| [screenshots/](screenshots/) | 6.9-inch iPhone screenshots (1320 × 2868). |

## What you need first

1. **An Apple Developer Program membership** (99 USD a year) at https://developer.apple.com/programs/. Enrol as an individual, or as an organisation if you have a company (that needs a D-U-N-S number). Apple's approval can take a day or two.
2. **An Expo account** (free) at https://expo.dev/signup, for the cloud build service (EAS). EAS builds on Apple hardware, so you don't need a Mac.
3. **A public web page for the privacy policy, and one for support.** GitHub Pages is free:
   * put `privacy-policy.html` in a public repository;
   * turn on Pages;
   * use the address it gives you.

   The support page can be a short page with your email address.

## 1. Fill in the placeholders

In `apps/mobile/app.json`:

| Key | Now | Change to |
|---|---|---|
| `expo.ios.bundleIdentifier` | `com.example.companion` | A reverse-domain ID you control, such as `com.yourname.companion`. It can't be changed after the first upload. |
| `expo.extra.supportEmail` | `support@example.com` | Your support email (Open Food Facts also asks apps to send a contact address). |
| `expo.extra.privacyPolicyUrl` | `https://example.com/companion/privacy` | Your hosted privacy policy. |
| `expo.extra.supportUrl` | `https://example.com/companion/support` | Your support page. |
| `expo.name` | `Companion` | The name under the icon, if you want a different one. |

In `privacy-policy.md` and `.html`, replace:

* the bracketed parts (your name or company, your email, the date);
* the copyright line in `metadata.md`.

## 2. Build in the cloud and send it to TestFlight

From `apps/mobile`, on any computer with Node.js 20 or later:

```bash
npm install
npx eas-cli@latest login                          # your Expo account
npx eas-cli@latest init                           # links the project; adds extra.eas.projectId to app.json
npx eas-cli@latest build --platform ios --profile production
```

The first build asks you to sign in with your Apple ID. EAS then does three things:

* creates the distribution certificate and provisioning profile;
* registers the bundle ID;
* turns on the **HealthKit** and **Data Protection** capabilities the app's entitlements need.

A build takes about 15 to 30 minutes. Then:

```bash
npx eas-cli@latest submit --platform ios --latest
```

This uploads the build to App Store Connect. If you haven't created the app record yet, it creates one with the name in `app.json`; rename it in App Store Connect to the store name in `metadata.md`. Processing takes a few minutes. The build then appears under **TestFlight**.

## 3. Test on your iPhone with TestFlight

Install TestFlight from the App Store, add yourself as an internal tester in App Store Connect, and install the build. Check, on a real iPhone:

- [ ] Sign-up, start to finish:
  - [ ] Connect Apple Health shows Apple's permission sheet with only the read types listed;
  - [ ] age and weight fill in from Health when they're set there;
  - [ ] a birth year under 18 stops sign-up.
- [ ] Today shows the *Finish setting up* card. Each item opens its page and saves.
- [ ] Food → Scan a barcode:
  - [ ] the camera permission prompt appears with the app's wording;
  - [ ] a real product is found in Open Food Facts;
  - [ ] an unknown barcode offers "Add it from its label";
  - [ ] a pack QR code with a GS1 Digital Link works.
- [ ] Training → Ask for a change → "A bigger back":
  - [ ] before the health questions: "Answer the health questions first";
  - [ ] after: the evidence answer.
- [ ] Recovery: with a few weeks of sleep, HRV and resting heart rate in Health (an Apple Watch, or entries added in the Health app), readiness appears; with fewer than 14 nights it says there aren't enough yet.
- [ ] Settings → Your data:
  - [ ] Export opens the share sheet;
  - [ ] Delete everything returns to sign-up.
- [ ] Turn on airplane mode: logging, search of your foods, the split and history all still work; scanning says it can't reach Open Food Facts.

## 4. Fill in App Store Connect and submit

In App Store Connect → your app:

1. **App Information**: name, subtitle, categories, content rights and the privacy policy URL, all from [metadata.md](metadata.md).
2. **Pricing and Availability**: free, or a price, and the countries.
3. **App Privacy**: follow [app-privacy-answers.md](app-privacy-answers.md) and publish it.
4. **Age Rating**: follow [age-rating.md](age-rating.md).
5. **The 1.0 version page**:
   * screenshots from [screenshots/](screenshots/) (6.9-inch);
   * promotional text, description, keywords, support URL and copyright;
   * the build from TestFlight;
   * App Review information, with "Sign-in required" off and the notes from [review-notes.md](review-notes.md).
6. **Export compliance**: `ITSAppUsesNonExemptEncryption` is set to false in the build, so App Store Connect won't ask. The app's only encryption is iOS's own Data Protection and HTTPS.
7. **Add for Review**, then **Submit**. Review usually takes one to three days.

## Rules this version is built to meet

| App Review Guideline | How the app meets it |
|---|---|
| 1.4.1 Medical (inaccurate data, health claims) | General fitness information only, with the medical disclaimer at sign-up, with suggestions and in Settings → About. Every suggestion shows the verified studies behind it, and the evidence library shows the method. Readiness is never presented as a diagnosis. |
| 2.1 App completeness | Every screen works without a server; the empty first-time states all have a next step. |
| 2.3 Accurate metadata | The description and screenshots show only what's in the build: no Oura, WHOOP, label photos or AI features. |
| 4.2 Minimum functionality | Food logging with barcode and QR scanning, a training plan with versions, the evidence gate, and HealthKit readiness. |
| 5.1.1 Data collection and storage | No account (none is needed: 5.1.1(v)). Data stays on the device, and the person can export and delete it. The privacy policy is linked in the app and in the store. |
| 5.1.1(v) Account deletion | Not applicable (no accounts). "Delete everything" is in Settings anyway. |
| 5.1.2 Data use and sharing | Nothing is shared. No tracking, so no App Tracking Transparency prompt. |
| 5.1.3 Health and health research | HealthKit is read-only. The app uses no iCloud storage (no CloudKit, iCloud Drive or key-value store), sends nothing anywhere, and never uses Health data for advertising. HealthKit features are clearly identified as Apple Health in the app. The usage text says exactly what is read and why. |
| 4.8 Login services | Not applicable (no sign-in). |
| Privacy manifest | Declares no tracking and no collected data, plus the required-reason APIs. |

## Later versions

Each of these needs its own work and review notes:

* **Accounts and sync** (and with them Sign in with Apple and account deletion).
* **Oura, WHOOP and Fitbit**, which need a server for OAuth.
* **Label-photo OCR.**
* **AI request parsing** (with the AI consent).
* **Push notifications.**

Update [app-privacy-answers.md](app-privacy-answers.md) when any of them ship.
