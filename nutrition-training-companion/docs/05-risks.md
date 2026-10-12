# 5. Key risks

Third-party facts in this document were checked on **2026-10-12** (sources at the end). They change often, so re-check them at the start of each phase.

## 5.1 Risk register

| # | Risk | Likelihood | Impact | Main mitigation | Phase |
|---|---|---|---|---|---|
| R1 | **Fitbit Web API is shut off** (2026-10-30). Building on it would break on arrival. | Certain | High | Build on the Google Health API from the start; budget for Google OAuth verification and an annual CASA assessment. | 0, 4 |
| R2 | **WHOOP approval delays**: apps are capped at 10 members until WHOOP approves them, and developers report long, unanswered waits. | High | High | Apply in week 1 with a privacy policy and a test account. Design the launch so WHOOP is not a launch-blocker. Keep an aggregator as plan B. | 0 → 4 |
| R3 | **Oura access limits**: OAuth only; Gen3 owners without an active membership lose API data; apps reportedly need approval beyond 10 users. | High | Medium | Apply early; explain the membership requirement in the connect screen; handle "no data" as a known state rather than an error. | 0 → 4 |
| R4 | **HealthKit is iOS-only, on-device only**, and background delivery is not guaranteed. | Certain | Medium | Native module with observer and anchored queries; sync on app open as a fallback; Android parity via Health Connect (stretch); show "last synced" honestly. | 4 |
| R5 | **OCR on ingredient lists is unreliable**, and ingredients alone cannot give accurate calories. | High | High | Ask for the nutrition panel; ranges and confidence levels; validator; user correction; benchmark set with exit criteria. | 1b |
| R6 | **Automatic citation verification is only partly possible**: identity checks are reliable, claim-support checks are not. | Certain | High | Curated claim library with human review; deterministic quote matching; dual LLM-judge runs; fail closed; scheduled re-verification. | 3 |
| R7 | **The 3-source rule blocks many useful changes**, and the product feels inert. | High | Medium | Design the "insufficient evidence" state as a first-class, honest answer; invest in the library for the most common requests first; user edits always remain available. | 3 |
| R8 | **Regulatory misclassification**: HIPAA probably does not apply, but the FTC Health Breach Notification Rule and state consumer-health-data laws probably do. | Medium | High | Counsel review in Phase 0; consent-first design; no ad SDKs; breach-response runbook that follows the Health Breach Notification Rule. | 0 |
| R9 | **Food API rate limits and licences** (Open Food Facts reads limited to about 15/min per IP; ODbL share-alike). | High | Medium | Nightly mirrors; live API only for misses; attribution in the UI; legal review of ODbL obligations for any derived database. | 1 |
| R10 | **Safety**: calorie suggestions harming users with eating-disorder history; training suggestions aggravating injuries. | Medium | High | Hard safety rules (18+, flags, calorie floor); "talk to a professional" path; disclaimer everywhere. | 1–4 |
| R11 | **Cross-device data misread as comparable** (HRV SDNN vs RMSSD; proprietary recovery scores). | High | Medium | Separate metrics per statistic; per-device baselines; vendor-labelled scores; drivers always shown. | 4 |
| R12 | **LLM errors or vendor changes** (model updates, refusals, outages). | Medium | Medium | Structured outputs with server-side validation; pinned model ID recorded per result; evaluation sets re-run on every change; graceful degradation (no LLM = no estimate or proposal, never a guess). | 1–4 |

## 5.2 Wearable API access and approval (WHOOP, Fitbit, Oura)

**WHOOP (API v2).**

* v1 is retired, and webhooks must be set to v2 in the developer dashboard.
* Apps work for **up to 10 WHOOP members** until WHOOP approves them. Approval asks for a privacy policy, accurate contact details, testing with at least one member, and adherence to WHOOP's design guidelines.
* Community reports describe approval requests going unanswered for weeks or months. Treat approval as uncertain and outside our control.
* Default rate limits are 100 requests per minute and 10,000 per day per app, with `X-RateLimit-*` headers; increases are on request.
* Refreshing replaces both the access and refresh tokens. A concurrent refresh therefore logs the user out, and the design handles this with a per-connection lock.

*Mitigation:*

* Apply in week 1 of Phase 0.
* Keep WHOOP behind a feature flag so the app can launch without it.
* Use webhooks plus a daily reconcile poll to stay inside daily limits.
* Plan B is an aggregator that already holds WHOOP approval, accepting the extra processor and cost.

**Fitbit → Google Health API.**

* Google released the Google Health API on 2026-03-24 as the successor to the Fitbit Web API.
* Google's release notes say legacy Fitbit Web API support ended on 2026-09-30 and the API is **switched off on 2026-10-30**. Some secondary sources quote only the September date; plan around the shutoff date.
* Existing Fitbit OAuth tokens do not carry over: users must re-consent through Google OAuth.
* Google classifies the health scopes as **restricted**. That means:
  * Trust & Safety review of the app, with a separate written justification per scope;
  * an in-app disclosure (not only on the website);
  * an **annual third-party CASA security assessment** based on OWASP ASVS. Google's page estimates 2–3 weeks for Tier 2 and 4–6 weeks for Tier 3. A third-party vendor blog quotes fees of roughly $500–$4,500; this is unconfirmed.
* Whoever owns the Google OAuth client carries the assessment.

*Mitigation:*

* Never write code against the Fitbit Web API.
* Budget CASA time and fees.
* Build security controls to ASVS from Phase 0, so the assessment is a check rather than a project.
* Develop with Google's test-user mode while verification runs.

**Oura (API v2).**

* Personal access tokens were retired at the end of 2025; access is OAuth 2.0 only.
* Oura's support article says **Gen3 ring owners without an active Oura Membership cannot access their data through the API**, including via partner apps.
* A third-party guide reports that apps are limited to 10 users before Oura approves them. Confirm this on Oura's developer portal.
* Webhook subscriptions are per data type and event, are verified with a challenge on creation, carry thin payloads (an ID, not the data), and **expire**, so they must be renewed. Deliveries are signed with HMAC.

*Mitigation:*

* Apply early.
* Show the membership requirement before the user starts connecting.
* Run a scheduled renewal job that alerts before any subscription lapses.

## 5.3 HealthKit is iOS-only

* HealthKit has **no server API**. Data reaches the backend only through our iOS app, so Apple Watch support requires a native iOS app. React Native with a Swift module meets that.
* **Background delivery is best-effort.** It needs the `com.apple.developer.healthkit.background-delivery` entitlement and observer queries. iOS decides when to wake the app. Developers report that observer queries stop after the user force-quits the app. The app also syncs on every foreground, and shows "last synced" so stale data is visible.
* **Read authorisation is opaque.** The app cannot tell whether the user denied read access to a type; missing data is shown as "no data", not as an error.
* **App Review rules.** Guideline 5.1.3 forbids storing personal health information in iCloud and using HealthKit data for advertising or data mining unrelated to health. Our design stores it only in our backend, encrypted, and never shares it for advertising.
* **Android has no HealthKit.** Android users get the cloud integrations and, as a stretch goal, Health Connect. By default Health Connect gives an app the last 30 days, with separate permissions for older history and for background reads.
* **Different statistics.** HealthKit HRV is SDNN; most wearables report RMSSD. Comparing them would be wrong, so they are stored as separate metrics.

## 5.4 OCR accuracy on ingredient lists

Why it is hard:

* small, condensed fonts;
* curved and shiny packaging (glare);
* text wrapping around seams;
* several languages on one pack;
* allergens in bold (which OCR may split);
* percentages and decimal commas ("12,5 %");
* look-alike characters (0/O, 1/l, 5/S, rn/m);
* E-numbers;
* nested sub-ingredients in brackets.

The deeper limit: **an ingredient list has no quantities.** Even perfect OCR cannot give accurate calories without the nutrition panel.

Mitigations in the design:

* **Capture:** guided capture with live text-region detection, glare and blur checks, and a prompt to flatten or rotate the pack. Several frames are combined where possible.
* **Panel first:** ask for the nutrition panel. With a clean panel, accuracy depends on OCR of digits, which validation can catch.
* **Parsing:** a deterministic parser and taxonomy matching, then the LLM for normalisation only. Unknown tokens are flagged, never invented.
* **Estimation:** ranges from similar products, physical-consistency checks, and explicit confidence with reasons. Ingredient-only results are never `high`.
* **Correction:** the user corrects values, and each correction is stored. With consent, confirmed data goes back to Open Food Facts, so the next scan of that product hits the database.
* **Measurement:** a 300-photo benchmark with proposed exit criteria (see the build plan), re-run on every OCR or model change.

## 5.5 Automatically verifying research citations

| What can be automated reliably | What cannot, and how the design handles it |
|---|---|
| The identifier exists (doi.org handle, Crossref, PubMed) | **Whether the summary accurately reflects the study.** Abstracts compress findings, and the full text may be paywalled. The design uses a verbatim quote match (deterministic), two independent LLM-judge runs that must agree, and human sign-off at curation. Disagreement goes to a human. |
| Title, authors, year and journal match | **Whether three sources are independent.** Meta-analyses often pool the same trials. A reviewer confirms independence per claim, and this is listed as a limitation on the claim page. |
| Publication type (meta-analysis, systematic review, RCT) and indexing | **Study quality beyond type.** A weak RCT is still an RCT. The reviewer can exclude a source, with a recorded reason; formal risk-of-bias grading is a later enhancement. |
| Retractions and corrections (Crossref `update-to`, which includes Retraction Watch data; PubMed publication types) | **Retractions after the fact.** Weekly sweeps; the claim is suspended, open proposals withdrawn and affected users alerted. |
| | **Population fit.** Most training studies involve young, often untrained men. Each claim records the population it covers; users outside it see a note, and safety flags block. |
| | **Evidence that simply does not exist at the 3-source level.** Many reasonable coaching heuristics (specific exercise choices, autoregulating lifting volume from wearable recovery data, popular running-mileage rules) may not clear the bar. The app says "insufficient evidence" and leaves the decision to the user. This is the rule working, not a defect, but it has to be designed well (R7). |

Further safeguards:

* The LLM never supplies citations; it only works on retrieved records.
* There is no web search in the citation path.
* Every run is stored, append-only, with the registry responses.
* If a registry is down, the system fails closed.

## 5.6 Regulatory and privacy context ("HIPAA-adjacent")

* **HIPAA** applies to covered entities (health plans, most providers) and their business associates. A direct-to-consumer app is usually neither, unless it is offered on behalf of a provider or plan. The design still follows HIPAA-style safeguards: encryption at rest and in transit, access control, audit logging, minimum necessary data, and BAAs with vendors. A future clinic or insurer partnership would then not need a rebuild.
* **FTC Health Breach Notification Rule.** The FTC's 2021 policy statement says the rule covers health apps that can draw data from more than one source, including an app that syncs with a fitness tracker through an API. This app qualifies. The FTC reads "breach" broadly: it includes unauthorised *disclosure*, such as sharing with an analytics or ad SDK without authorisation, not only hacking. Hence no ad SDKs, and opt-in, value-free analytics.
* **US state consumer-health-data laws** (for example Washington's My Health My Data Act) require separate consent to collect and share consumer health data, and give users deletion rights. **GDPR** treats health data as a special category (Art. 9) for EU users, and the data export doubles as GDPR data portability. Counsel confirms the launch-market list in Phase 0.
* **Not a medical device.** Keep the claims to general wellness: no diagnosis and no treatment of conditions. The disclaimer and safety rules support this. Any feature that interprets data for a medical purpose needs regulatory review first.

## 5.7 Sources for the platform facts above (checked 2026-10-12)

* Google Health API release notes (Fitbit Web API turndown dates; Google Health API release): <https://developers.google.com/health/release-notes>
* Google Health API app verification (restricted scopes, CASA, timelines): <https://developers.google.com/health/app-verification>
* Google Health API webhooks and scope mapping: <https://developers.google.com/health/webhooks> · <https://developers.google.com/health/migration/api-specifications>
* Google CASA cost discussion (third-party, unconfirmed): <https://openwearables.io/blog/google-casa-oauth-verification-health-apps>
* WHOOP rate limits: <https://developer.whoop.com/docs/developing/rate-limiting>
* WHOOP access limits and approval (third-party guide and community reports): <https://tryterra.co/blog/whoop-api-data-access-permissions-limitations-2026> · <https://www.community.whoop.com/t/app-approval-to-raise-the-10-user-limit-3-submissions-since-april-still-no-response-today-ai/15779>
* Oura API and the membership requirement: <https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API>
* Oura personal access token retirement, user limit and webhooks (third-party): <https://tryterra.co/blog/oura-api-ai-apps-access-permissions-commercial-restrictions> · <https://hookdeck.com/webhooks/platforms/guide-to-oura-webhooks-features-and-best-practices>
* Open Food Facts API rate limits and usage conditions: <https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/>
* USDA FoodData Central API guide (rate limits): <https://fdc.nal.usda.gov/api-guide>
* NCBI E-utilities API keys and rate limits: <https://www.ncbi.nlm.nih.gov/books/NBK25497/>
* Crossref Retraction Watch data in the REST API: <https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/>
* Health Connect background and history reads: <https://android-developers.googleblog.com/2025/03/health-connect-jetpack-sdk-now-in-beta.html>
* Apple developer forum on HealthKit storage under Guideline 5.1.3: <https://developer.apple.com/forums/thread/838022>
* HealthKit observer queries after force-quit (developer forum report): <https://developer.apple.com/forums/topics/health-and-fitness?page=2>
* FTC Health Breach Notification Rule and health apps: <https://www.ftc.gov/node/77764> · <https://www.healthlawadvisor.com/ftc-warns-that-health-apps-may-be-subject-to-the-health-breach-notification-rule>
* Anthropic API data retention and HIPAA-ready access: <https://platform.claude.com/docs/manage-claude/api-and-data-retention> · <https://privacy.claude.com/en/articles/8956058-i-need-to-be-hipaa-compliant-can-i-use-claude>
* UK front-of-pack nutrition labelling guidance: <https://www.food.gov.uk/sites/default/files/media/document/fop-guidance_0.pdf>
* Regulation (EC) No 1924/2006, Annex (nutrition claims): <https://legislation.gov.uk/eur/2006/1924/annexes/2006-12-20> · <https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en>
