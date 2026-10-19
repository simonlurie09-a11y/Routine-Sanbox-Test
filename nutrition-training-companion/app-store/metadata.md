# App Store Connect: listing text

Copy these into App Store Connect → your app → the version page and App Information. Character limits are Apple's; the counts in brackets are for the text below.

## App Information

| Field | Value |
|---|---|
| Name (30) | **Companion: Food & Training** (26). Check it's free when you create the app record; if it's taken, try "Companion Food & Lifting" or your own brand. The name under the icon on the phone is set separately, in `app.json` (`expo.name`, currently "Companion"). |
| Subtitle (30) | **Food, lifting, real evidence** (28) |
| Primary category | Health & Fitness |
| Secondary category | Food & Drink |
| Content rights | Doesn't contain, show or access third-party content that needs rights you don't hold. Product data comes from Open Food Facts under the Open Database Licence; the app shows that attribution. |
| Age rating | See [age-rating.md](age-rating.md). |
| Privacy policy URL | Where you host [privacy-policy.html](privacy-policy.html). It must be public, and must match `extra.privacyPolicyUrl` in `apps/mobile/app.json`. |

## Version page

**Promotional text (170).** Log food by barcode, keep your training plan, and see only changes that at least 3 verified studies support. Works with Apple Health. Your data stays on your iPhone. (165)

**Keywords (100, comma-separated, no spaces).** `nutrition,calorie,macro,barcode,protein,workout,split,hypertrophy,strength,gym,HRV,sleep,recovery` (97)

**Support URL.** Where you host a support page, matching `extra.supportUrl`. A page with your contact email is enough.

**Marketing URL.** Optional.

**Copyright.** `2026 [your name or company]`

**Description (4000).**

```
Companion keeps your food, your training plan and your recovery in one place, and it only suggests a change when the research supports it.

TRACK FOOD
• Scan the barcode, or the QR code on newer packs, and the product comes up from Open Food Facts.
• Search foods, add your own from the label, or quick-add calories.
• See calories, protein, carbs, fat and fibre against the daily targets you set.
• Every product shows a plain-language rating of sugar, salt, saturated fat, fibre and processing, with the reason for each line.

KEEP YOUR TRAINING PLAN
• Start from a four-day upper/lower template or build your own split.
• See weekly sets per muscle, session length and rest days at a glance.
• Log workouts and how hard they felt.
• Every change is saved as a version, so you can always go back.

CHANGES BACKED BY RESEARCH
Ask for what you want, like "a bigger back" or "get stronger". Companion checks its evidence library and suggests a change only when at least 3 verified, peer-reviewed studies support it. Otherwise it says so and changes nothing. You can read every study it relies on, with links to PubMed or the journal.

RECOVERY, COMPARED WITH YOU
With your permission, Companion reads your sleep, heart rate variability and resting heart rate from Apple Health. It compares last night with your own usual range, never with anyone else's.

PRIVATE BY DESIGN
• No account, no ads and no tracking.
• Everything you log stays on your iPhone, encrypted by iOS.
• Companion never writes to Apple Health and never stores what it reads from it.
• Export or delete everything at any time in Settings.

SAFETY FIRST
Tell Companion about an injury, a medical condition, a pregnancy or a history of disordered eating, and it pauses the suggestions that could affect it. It's for adults (18 and over).

Companion provides general fitness and nutrition information. It is not medical advice and does not diagnose, treat or prevent any condition. Talk to a qualified healthcare professional before changing your training or diet.
```

## Screenshots

App Store Connect needs at least one set for the largest iPhone size: **6.9-inch, 1320 × 2868 pixels** (portrait). The app is iPhone-only (`supportsTablet: false`), so no iPad screenshots are needed. [screenshots/](screenshots/) has a set rendered from the app's own screens with sample data. You can use them as they are, or retake them on an iPhone 16 Pro Max or 17 Pro Max simulator (`Cmd+S` in Simulator) for pixel-exact SF Symbols.

## App Review Information

* **Sign-in required:** No.
* **Notes:** paste [review-notes.md](review-notes.md).
* **Contact:** your name, phone and email.

## App Privacy

See [app-privacy-answers.md](app-privacy-answers.md): **Data Not Collected**.
