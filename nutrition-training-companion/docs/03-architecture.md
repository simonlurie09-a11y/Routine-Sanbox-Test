# 3. Architecture

This document has six diagrams: one system overview, then the four flows the brief asks for (barcode lookup, OCR fallback, research verification, wearable sync), plus the wearable connection lifecycle. Each diagram is followed by the rules that do not fit in a picture.

## 3.1 System overview

```mermaid
flowchart LR
  subgraph Device["Phone: React Native + Expo"]
    UI["App UI"]
    Scan["Barcode scanner"]
    OCR["On-device OCR<br/>Apple Vision / ML Kit v2"]
    HK["HealthKit module<br/>(iOS only)"]
    Local[("Encrypted SQLite<br/>offline queue")]
  end

  subgraph AWS["AWS account covered by a BAA"]
    Edge["WAF + load balancer"]
    API["API service<br/>Node.js + Fastify"]
    Worker["Workers<br/>food, OCR fallback,<br/>evidence, wearable sync"]
    Sched["Scheduler<br/>re-verification, token refresh,<br/>webhook renewal, mirror import"]
    PG[("PostgreSQL 16<br/>RDS, KMS-encrypted,<br/>job queue")]
    S3[("S3<br/>scan images, exports")]
    KMS["KMS<br/>per-user data keys"]
    Auth["Cognito<br/>sign-in"]
    Textract["Textract<br/>OCR fallback"]
  end

  subgraph Food["Food databases"]
    OFF["Open Food Facts"]
    FDC["USDA FoodData Central"]
  end

  subgraph Research["Research registries"]
    PubMed["PubMed E-utilities"]
    EPMC["Europe PMC"]
    Crossref["Crossref REST<br/>incl. Retraction Watch"]
    DOI["doi.org handle API"]
  end

  subgraph Wear["Wearable clouds"]
    WHOOP["WHOOP API v2"]
    Oura["Oura API v2"]
    GH["Google Health API<br/>Fitbit successor"]
  end

  Claude["Claude API<br/>HIPAA-ready configuration"]

  Scan --> UI
  OCR --> UI
  UI <--> Local
  UI -- "sign in" --> Auth
  UI --> Edge --> API
  HK -- "daily aggregates" --> Edge
  API --> PG
  API --> S3
  API --> KMS
  Sched --> PG
  Worker --> PG
  Worker --> S3
  Worker --> Textract
  Worker --> OFF
  Worker --> FDC
  Worker --> PubMed & EPMC & Crossref & DOI
  Worker --> Claude
  API -. "intent parsing" .-> Claude
  Worker <--> WHOOP & Oura & GH
  WHOOP & Oura & GH -- "webhooks" --> Edge
```

**What runs where**

| Component | Responsibility | Why it lives there |
|---|---|---|
| Phone | Barcode decoding, first-pass OCR, HealthKit reads, offline food log, encrypted local cache | Fast and private: label photos and Apple Health data are processed on the device by default, and HealthKit has no server API. |
| API service | Auth checks, validation, reads/writes, OAuth callbacks, webhook intake (verify, store, return 202) | Stateless, so it scales horizontally. Inside a user request it calls a third party in only two places, each with a time budget: the barcode path (behind the cache) and parsing a short change request into an intent with Claude. |
| Workers | Everything slow or retryable: food-source fallbacks, server OCR, LLM calls, evidence verification, wearable fetches, exports, deletions | A Postgres-backed queue (pg-boss) keeps jobs in the same encrypted, backed-up database, with no extra datastore to bring into compliance scope. |
| Scheduler | Periodic jobs: weekly retraction sweep, monthly full re-verification, Oura webhook renewal, proactive token refresh, nightly Open Food Facts and FDC mirror import | Cron-style jobs enqueued into the same queue. |
| Claude API | Ingredient normalisation, constrained macro estimates, parsing a user's request into a structured intent, phrasing follow-up questions, judging whether an abstract supports a finding | Called from workers, except intent parsing, which the API calls directly with a short time budget. Always uses structured outputs. Research prompts never include user data. |

**Domain engines.** These are pure TypeScript functions in `packages/domain`, used by both the app and the server:

* **Health-rating engine.** Turns nutrients, ingredients and NOVA group into explained dimensions. The rules are versioned; see [07 §7.4](07-product-flows.md#74-health-rating-explainer).
* **Split analyser.** Computes weekly weighted sets per muscle, frequency, recovery spacing, overlaps and goal fit, and produces *descriptive* findings.
* **Recommendation engine.** Turns an intent or finding into a candidate diff and names the claims it relies on. It cannot publish anything: only the evidence gate can move a recommendation to `proposed`.
* **Readiness model.** Compares today's HRV, resting HR and sleep with the user's own rolling baseline, separately per device, and records which inputs drove the result.

## 3.2 Barcode lookup

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant App as Mobile app
  participant API as API service
  participant DB as Postgres catalogue + cache
  participant OpenFF as Open Food Facts
  participant FDC as USDA FDC
  U->>App: Scan barcode
  App->>App: Validate check digit, normalise to GTIN-14
  App->>API: GET /v1/foods/barcode/{gtin}
  API->>DB: barcode_lookups + food_items (includes nightly mirrors)
  alt Cached and fresh
    DB-->>API: Food item + health rating
  else Miss or stale
    API->>OpenFF: GET product by code (identifying User-Agent)
    alt Found with core nutrients
      OpenFF-->>API: Product JSON
    else Not found or missing core nutrients
      API->>FDC: foods/search, dataType Branded, query = UPC
      FDC-->>API: Candidates
      API->>API: Keep only an exact gtinUpc match after normalisation
    end
    API->>API: Normalise nutrients, compute health rating (ruleset vN)
    API->>DB: Upsert food_items, health_ratings, barcode_lookups with TTL
  end
  alt Found
    API-->>App: 200 food, nutrients, explained rating, source + licence
    App-->>U: Calories, macros, rating, Log button
  else Not found anywhere
    API-->>App: 404 not_found, fallback = ingredient_scan
    App-->>U: Offer to photograph the ingredient list
  end
```

Rules:

1. **Normalise first.** UPC-A (12 digits), EAN-13 and GTIN-14 for the same product differ only by leading zeros. Validate the check digit on the device, zero-pad to 14 digits, and use that as the key everywhere. Open Food Facts and FDC store codes in different lengths, so match on the normalised value only.
2. **Use a local mirror.** The Open Food Facts documentation (as of October 2026) limits product reads to about 15 requests per minute per IP and search to 10, and FDC allows 1,000 requests per hour per IP. A server that forwards every scan would hit those limits with a few hundred active users. So:
   * Import the Open Food Facts and FDC Branded Foods bulk exports nightly into `food_items`. Most scans are answered locally.
   * Use the live API only for cache misses, with a token-bucket limiter below the published limits.
   * Cache negative results with a short TTL (24 hours) so a burst of scans of an unknown product does not fan out.
   * Optional: on a mirror miss, let the device query Open Food Facts directly. Its docs say limits then apply per user rather than to our server. Results still go through the server for normalisation and rating.
3. **Never mix nutrient sources silently.** If Open Food Facts has the product but lacks core nutrients and FDC has a match, use FDC's nutrients, keep Open Food Facts' ingredients and NOVA group, and record both sources on the item.
4. **Time budget.** The barcode endpoint has 2.5 s end to end. If upstream is slow, the API returns `202 pending` and the app polls. The user is never stuck on a spinner.
5. **Licence and attribution.** Items from Open Food Facts carry `ODbL-1.0` and an attribution string that the UI shows. FDC data is public domain (CC0).

## 3.3 Ingredient-photo (OCR) fallback

```mermaid
flowchart TD
  A["Barcode not found,<br/>or user taps 'scan label'"] --> B["Guided capture<br/>ingredient list (required)<br/>nutrition panel (strongly suggested)"]
  B --> C["On-device OCR<br/>Apple Vision / ML Kit v2"]
  C --> D{"Capture good enough?<br/>confidence, text length,<br/>'ingredients' keyword found"}
  D -- "No" --> E{"User allows<br/>image upload?"}
  E -- "Yes" --> F["Server OCR<br/>Textract"]
  E -- "No" --> R["Retake tips<br/>glare, focus, flatten, crop"]
  R --> B
  F --> G
  D -- "Yes" --> G["Parse ingredients<br/>deterministic parser + OFF taxonomy,<br/>Claude structured output for messy text"]
  G --> H{"Nutrition panel<br/>captured?"}
  H -- "Yes" --> I["Read panel values<br/>per 100 g and per serving"]
  H -- "No" --> J["Estimate from ingredients<br/>similar products by ingredient order<br/>+ constrained LLM proposal = ranges"]
  I --> K["Validate<br/>energy close to 4P + 4C + 9F + 2 fibre<br/>macros at most 100 g per 100 g<br/>sugars at most carbs, sat fat at most fat"]
  J --> K
  K --> L["Confidence: high / medium / low<br/>with reasons"]
  L --> M["Health rating on the estimate<br/>estimated dimensions marked"]
  M --> N["Review screen<br/>low-confidence fields highlighted,<br/>editable, ranges shown"]
  N --> O{"User confirms<br/>or corrects"}
  O -- "Corrects" --> K
  O -- "Confirms" --> P["Save private food item;<br/>log entries carry the confidence"]
  P --> Q["Optional, with consent:<br/>contribute to Open Food Facts"]
```

Rules:

1. **An ingredient list alone cannot give an accurate calorie count.** It lists ingredients in descending order of weight, and only sometimes gives percentages. It never gives quantities. The app therefore asks for the nutrition panel as well, and when it can only see ingredients it shows **ranges** and marks the result `low` confidence. It never shows false precision.
2. **How ingredient-only estimation works.**
   * (a) Parse and canonicalise the ingredients using the Open Food Facts ingredient taxonomy.
   * (b) Find mirror products whose canonical ingredient prefixes and stated percentages are most similar.
   * (c) Take the spread of their per-100 g nutrients as a prior.
   * (d) Ask Claude for a point estimate inside that prior, using structured output with a fixed JSON schema.
   * (e) Reject any value that breaks the physical constraints in node K.

   The LLM narrows a range. It never invents a value outside the range.
3. **Confidence rules** (all configurable):
   * `high` needs a panel that was read cleanly and an energy cross-check within 15%.
   * `medium` means a panel read with at most two corrected fields, or ingredient-only with at least 5 close mirror neighbours and a narrow range.
   * Everything else is `low`.

   Every `low_confidence_reason` is shown to the user in plain words.
4. **Privacy.** Photos stay on the device unless the user turns on `scan_image_upload`. Uploaded images are deleted by S3 lifecycle after 30 days, or sooner when the scan is confirmed.

## 3.4 Research verification (the evidence gate)

### Decision path for a change

```mermaid
flowchart TD
  T["Change trigger<br/>user request, split-review finding,<br/>low-recovery streak, check-in answer"] --> S{"Safety rules<br/>injury, condition, age,<br/>pregnancy, eating-disorder history"}
  S -- "Stop" --> SB["blocked_safety<br/>'Please talk to a professional'"]
  S -- "Continue" --> E["Recommendation engine<br/>builds the candidate diff and<br/>names every claim it relies on"]
  E --> C{"Each claim active<br/>in the evidence library?"}
  C -- "No" --> IE["blocked_insufficient_evidence"]
  C -- "Yes" --> V["Verification run, per source<br/>1 identifier resolves<br/>2 metadata matches<br/>3 study design is strong<br/>4 indexed, peer reviewed, not a preprint<br/>5 not retracted<br/>6 finding supported by the abstract"]
  V --> X{"Registries<br/>reachable?"}
  X -- "No" --> VU["blocked_verification_unavailable<br/>fail closed, retry later"]
  X -- "Yes" --> N{"At least 3 verified<br/>sources for every claim?"}
  N -- "No" --> IE
  N -- "Yes" --> P["proposed<br/>diff, drivers, citations,<br/>limitations, disclaimer"]
  P --> U{"User decides"}
  U -- "Accept" --> A["accepted<br/>new split version or target,<br/>DB trigger re-checks the gate"]
  U -- "Reject" --> RJ["rejected"]
  SB --> AU[("Hash-chained<br/>audit log")]
  IE --> AU
  VU --> AU
  P --> AU
  A --> AU
  RJ --> AU
```

### How claims get into the library (offline, human-reviewed)

```mermaid
flowchart LR
  D["Evidence editor drafts a claim<br/>statement + population scope"] --> R["Candidate retrieval<br/>PubMed and Europe PMC queries<br/>with publication-type filters"]
  R --> T["Triage assist<br/>Claude ranks retrieved records and drafts<br/>finding, limitations, verbatim quote"]
  T --> V["Automated checks 1-6"]
  V --> H["Human review<br/>qualified reviewer approves<br/>each claim-source link"]
  H --> A["Claim active<br/>at least 3 verified sources"]
  A --> W["Scheduled sweeps<br/>weekly retraction check,<br/>monthly full re-verification"]
  W -- "Problem found" --> SU["Suspend claim, withdraw open proposals,<br/>alert users who accepted a change"]
```

The principles are below. [06-evidence-gate.md](06-evidence-gate.md) has the full specification.

* **The LLM never originates a citation.** Records come only from PubMed, Europe PMC and Crossref by identifier. Claude may rank, summarise and judge records it is given, and every quote it produces must match the abstract character for character.
* **Curate claims, verify sources, re-check at decision time.** Library curation is slow and human-reviewed. A user request is fast because it reuses active claims, but the identifier and retraction checks are re-run if the cached result is older than 7 days.
* **Fail closed.** If the registries cannot be reached, nothing is proposed.
* **Enforced twice.** The application enforces the gate, and so does the database. Triggers in [`schema.sql`](../schema/schema.sql) refuse `proposed` or `accepted` unless every named claim is active and has at least 3 verified sources. They also refuse any app-originated split version or nutrition target that lacks an accepted recommendation.

## 3.5 Wearable sync

### Cloud providers (WHOOP, Oura, Google Health API)

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant App as Mobile app
  participant API as API service
  participant P as Provider cloud
  participant W as Sync worker
  participant DB as Postgres
  U->>App: Connect provider, pick data types to share
  App->>API: POST /v1/integrations/{provider}/connect
  API-->>App: Authorize URL with state + PKCE
  App->>P: OAuth consent in system browser
  P-->>API: Redirect with code to callback
  API->>P: Exchange code for tokens
  API->>DB: Encrypted tokens, scopes granted, status active
  API->>W: Enqueue backfill, default 30 days
  Note over P,API: Later, data changes at the provider
  P->>API: Webhook, thin payload with type + id
  API->>API: Verify signature, dedupe on event id
  API->>DB: Insert webhook_inbox, return 202
  W->>DB: Claim job, take per-connection advisory lock
  opt Access token expired or near expiry
    W->>P: Refresh token
    P-->>W: New access + refresh token, old refresh token now invalid
    W->>DB: Save both atomically, token_version + 1
  end
  W->>P: Fetch changed records by id or time window
  alt 401 or invalid_grant
    W->>DB: status needs_reauth
    W-->>App: Push 'Reconnect' with no health data in payload
  else 429
    W->>W: Back off using rate-limit headers, requeue
  else 200
    W->>W: Drop data types the user switched off, normalise units
    W->>DB: Upsert metrics and workouts, advance cursor
    W->>W: Recompute readiness against personal baseline
    opt Readiness crosses a configured threshold
      W->>API: Create recommendation, which must pass the evidence gate
    end
  end
```

### Apple Health (on-device only)

```mermaid
sequenceDiagram
  autonumber
  participant HK as HealthKit on iPhone
  participant App as iOS app, native module
  participant API as API service
  participant DB as Postgres
  App->>HK: Request read authorisation per data type
  Note over App,HK: Apps cannot tell whether read access was denied, so missing data is shown as unknown
  App->>HK: Enable background delivery + observer query per type
  HK-->>App: Observer fires, app woken in background
  App->>HK: Anchored query from the last saved anchor
  HK-->>App: New and deleted samples + new anchor
  App->>App: Aggregate to daily metrics, keep HRV as SDNN
  App->>API: POST /v1/integrations/apple-health/batches with idempotency key
  API->>DB: Upsert metrics, record anchor per type
  API-->>App: 200, then the app persists the anchor
  App->>HK: Call the observer completion handler
```

### Connection lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending: user starts connect
  pending --> active: tokens stored
  pending --> [*]: user cancels
  active --> active: refresh succeeds
  active --> needs_reauth: refresh fails, scope removed or 401
  needs_reauth --> active: user reconnects
  active --> paused: user pauses sharing
  paused --> active: user resumes
  active --> error: repeated provider errors
  error --> active: provider recovers
  active --> revoked: user disconnects
  paused --> revoked: user disconnects
  needs_reauth --> revoked: user disconnects
  revoked --> [*]: tokens deleted, provider revoke called, data kept or purged by user choice
```

Rules:

1. **Webhooks first, polling as a safety net.** All three cloud providers send webhooks. A daily reconciliation poll per connection catches missed deliveries. Oura webhook subscriptions expire and are renewed by the scheduler.
2. **Refresh-token rotation is a race.** On refresh, WHOOP replaces both tokens and invalidates the old refresh token. Two workers refreshing at once will log the user out. Every refresh therefore runs under a per-connection Postgres advisory lock with an optimistic `token_version` check.
3. **The user controls the data.**
   * `data_types_enabled` is enforced at ingest: values the user switched off are never written.
   * It is enforced again at recommendation time: a disabled metric can never be a driver.
   * Pausing stops fetching. Disconnecting revokes at the provider where an endpoint exists, deletes the tokens, and asks whether to keep or purge the history.
4. **Normalisation that does not lie.**
   * HealthKit reports HRV as **SDNN**. WHOOP, Oura and Fitbit report **RMSSD**-based values measured during sleep. They are stored as different metrics and never compared across devices.
   * Vendor recovery and readiness scores are proprietary. They are shown with the vendor's name and are not converted to a common scale.
   * Readiness is computed per device, against that device's own 28-day baseline, and the UI shows the drivers. For example: "HRV 41 ms vs your Oura baseline 52 ± 6 ms."
5. **Precedence.** When two devices report the same metric, the user picks a primary source per metric. The default order is: the device worn overnight for sleep and HRV, then the phone for steps.
