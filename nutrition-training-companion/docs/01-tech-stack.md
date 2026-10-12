# 1. Recommended tech stack

**Choice in one paragraph.** A TypeScript monorepo:

* a **React Native + Expo** app, with custom native modules for HealthKit and on-device OCR;
* a **Node.js (Fastify)** API and workers sharing one codebase;
* **PostgreSQL 16** as the only datastore, including the job queue;
* **AWS** under a Business Associate Agreement (BAA), with **Cognito** for auth, **KMS** for per-user envelope encryption and **Textract** as the OCR fallback;
* **Claude** (`claude-opus-5-5`) for language tasks, with structured outputs;
* a research pipeline built on **PubMed E-utilities, Europe PMC, Crossref and the doi.org handle API**. No general web search is in the citation path.

## 1.1 Stack by layer

| Layer | Recommendation | Why | Alternatives considered |
|---|---|---|---|
| **Mobile framework** | React Native + Expo (development builds via EAS, not Expo Go), TypeScript | One codebase for iOS and Android. The domain logic (health rating, volume calculator, validators) is shared with the server, so feedback appears instantly offline and the server still has the final say. Expo config plugins handle entitlements and Info.plist. | **Native Swift + Kotlin**: best HealthKit and camera control, but two apps. **Flutter**: capable, but Dart cannot share code with a TypeScript backend. |
| HealthKit | `@kingstinct/react-native-healthkit` (Expo config plugin), plus a small Swift module for background delivery if the library falls short | HealthKit is on-device only and needs a native app. The library covers authorisation and queries. Background delivery (observer queries, anchored queries, the `com.apple.developer.healthkit.background-delivery` entitlement) is the part most likely to need custom Swift. | `react-native-health`; a fully native iOS companion app |
| Barcode scanning | `react-native-vision-camera` code scanner | Fast EAN/UPC decoding on the device, and frame processors let the same camera pipeline feed OCR. | `expo-camera` barcode scanning (simpler, fewer controls) |
| On-device OCR | Apple Vision text recognition on iOS; Google ML Kit Text Recognition v2 on Android (bundled model) | Free, works offline, and label photos never leave the phone by default. Bundle the Android model so the first scan does not depend on a download. | Cloud OCR only (cost, latency, privacy) |
| Server OCR fallback | Amazon Textract (only for captures the user opts to upload) | Handles hard captures, and is on AWS's HIPAA-eligible list, so it is covered by the same BAA. | Google Cloud Vision (would need a second cloud BAA) |
| Local storage | SQLite with SQLCipher (e.g. `op-sqlite`) for the offline log queue; Keychain/Keystore (`expo-secure-store`) for tokens | Health data at rest on the device is encrypted, and logging works on a plane or in a gym basement. | MMKV (not for health data); plain AsyncStorage (unencrypted, never) |
| **Backend** | Node.js 22 + TypeScript, Fastify, zod contracts in `packages/contracts` | One language end to end. Fastify is fast and schema-first, and the same zod schemas validate on the device, in the API and in LLM structured outputs. | NestJS (more structure, more ceremony); Python FastAPI (good for science work, but splits the codebase) |
| Jobs and scheduling | Worker processes from the same codebase; `pg-boss` queue on Postgres | Retries, back-off, cron and idempotency without adding Redis to the compliance scope. | BullMQ + Redis; SQS + Lambda |
| **Database** | PostgreSQL 16 on Amazon RDS (Multi-AZ, KMS encryption, point-in-time recovery) | Relational integrity for the audit trail. Triggers enforce the evidence gate (see `schema.sql`). Row-level security adds a second tenant boundary. JSONB holds diffs and snapshots, and range partitioning holds wearable time series. | DynamoDB (weak fit for joins and audit queries); TimescaleDB (worth adding only if intraday heart-rate volume grows) |
| Object storage | S3 with SSE-KMS, lifecycle rules (scan images 30 days, exports 7 days) | Short retention by default; signed URLs for exports. | — |
| Field-level encryption | KMS envelope encryption: one data key per user, wrapped by a KMS key; AES-256-GCM for `*_enc` columns | Defence in depth for the most sensitive fields (injury notes, free-text answers, OAuth tokens). Destroying a user's key makes their ciphertext unreadable everywhere, backups included (crypto-shredding). | Postgres `pgcrypto` (keys would sit next to the data) |
| **Auth** | Amazon Cognito user pools: Sign in with Apple, Google, and email (passwordless code or passkey); short-lived JWTs; refresh-token rotation | Covered by the AWS BAA along with everything else. When an app offers third-party social logins, App Review guideline 4.8 requires a privacy-focused login option as well, and Sign in with Apple meets that. Biometric app lock is a local setting on top. | Auth0 (better developer experience; check BAA availability for your plan); Supabase Auth with its HIPAA add-on |
| Hosting | AWS: ECS Fargate behind ALB + WAF, Terraform, separate prod/staging accounts | Sign the AWS BAA and use only HIPAA-eligible services for anything that touches health data. | GCP (equally viable; the BAA and the eligible-service list are what decide it) |
| Food data | Open Food Facts (primary) + USDA FoodData Central Branded Foods (secondary). Both mirrored nightly from bulk exports; live APIs for misses. | Open Food Facts has global coverage, ingredient text, NOVA group and additives. FDC is strong on US branded items. Mirroring gets around tight live-API rate limits (see the risks doc). | Commercial databases (Nutritionix, Edamam, FatSecret): more polished, paid, and with licence restrictions |
| **Research retrieval** | PubMed E-utilities (search, metadata, publication types, abstracts), Europe PMC REST (abstracts, open-access full text, cross-check), Crossref REST (DOI metadata, `update-to` retraction and correction records including Retraction Watch data), doi.org handle API (does the DOI exist) | Every one is an authoritative registry with a stable identifier, so verification is a lookup rather than a judgement. An NCBI API key raises the E-utilities limit from 3 to 10 requests per second. | OpenAlex and Semantic Scholar for de-duplication and citation graphs (optional); **not** general web search, which cannot be audited |
| **LLM** | Claude API, `claude-opus-5-5`, structured outputs (`output_config.format`), adaptive thinking with `effort` tuned per route; model ID and prompt version stored with every result | Strong at messy-text normalisation, schema-constrained extraction, and judging whether a passage supports a statement. Structured outputs give parseable results the server can validate. | — |
| Wearables | Direct integrations: WHOOP API v2, Oura API v2, Google Health API (Fitbit's successor), HealthKit on the device | Three cloud APIs plus one on-device SDK is a manageable number to own, and owning them keeps health data out of an extra processor. | Aggregators such as Terra, Junction, Sahha or Open Wearables (self-hostable). Faster to start, but each is another processor of health data that needs a BAA/DPA, has per-user cost, and does not remove your own Google verification duties if you own the OAuth client. Worth reconsidering when adding Garmin, Polar, etc. |
| Observability | OpenTelemetry → CloudWatch; a log processor that strips health values and free text; error tracking with PII scrubbing (under a BAA, or self-hosted) | Logs are where health data leaks most often. | — |
| Push | APNs / FCM | Payloads are always generic ("You have a new suggestion"). Health values are never sent in a notification. | — |
| Analytics | Opt-in only, event names without health values, no third-party ad SDKs | Under the FTC Health Breach Notification Rule, sharing health data with an ad SDK without authorisation counts as a breach. | — |

## 1.2 How the LLM is used, and how it is not

| Task | Route | Guardrails |
|---|---|---|
| Normalise OCR'd ingredient text (fix line breaks, split compound ingredients, map to taxonomy IDs) | Worker → Claude, structured output: `[{position, raw, canonical_id, percent?}]` | Output is validated against the Open Food Facts taxonomy. Unknown tokens become "needs review", never guesses. |
| Propose macros for ingredient-only scans | Worker → Claude, given the canonical ingredients and the range from similar products | Values must fall inside the prior range and pass the physical checks, otherwise they are rejected. The result is always labelled an estimate, with a range. |
| Parse a request like "I want bigger shoulders" into an intent | API → Claude (low effort), structured output: `{type: 'develop_muscle', muscle: 'side_delts', priority}` | The user confirms the parsed intent before anything is built. The engine, not the LLM, builds the diff. |
| Phrase follow-up questions | Worker → Claude, chosen from a fixed question bank | The LLM only rewords. What is asked and why is fixed in code. |
| Judge whether an abstract supports a stored finding | Worker → Claude (high effort), structured output: `{verdict, quote, population_match, direction_match, issues[]}` | The quote must match the abstract exactly after normalisation. Two independent runs must agree, otherwise the item goes to a human. Never used to *find* sources. |

Data handling for the LLM:

* Use the Claude API under a signed BAA, in Anthropic's HIPAA-ready configuration, with zero data retention where available. Confirm the current list of BAA-eligible features with Anthropic before launch. Anthropic's own guidance notes that the BAA does not extend to every feature, and web search is one stated exclusion.
* Research prompts contain **no user data**. The gate asks about a claim, not about a person.
* Handle the `refusal` stop reason, and treat any failure as "could not verify" (fail closed).

## 1.3 Repository layout (proposed)

```
apps/
  mobile/            React Native + Expo (iOS, Android)
    modules/healthkit-sync/   Swift: observer + anchored queries, background delivery
    modules/label-ocr/        Swift (Vision) + Kotlin (ML Kit v2) frame processors
  api/               Fastify HTTP API, OAuth callbacks, webhook intake
  worker/            Queue consumers + scheduler (food, OCR, evidence, wearables, privacy)
  admin/             Evidence-library review tool (internal, SSO-only)
packages/
  contracts/         zod schemas shared by app, API, workers and LLM outputs
  domain/            health-rating rules, volume calculator, split analyser, readiness model
  evidence/          registry clients (PubMed, Europe PMC, Crossref, doi.org) + checks
  providers/         WHOOP, Oura, Google Health API clients + normalisers
infra/               Terraform (AWS), per-environment
db/                  migrations (schema.sql is the reference)
```
