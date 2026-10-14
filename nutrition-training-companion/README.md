# Nutrition & Training Companion: design package

This is the design for a mobile app that:

* logs food by barcode (Open Food Facts, then USDA FoodData Central), with an ingredient-photo fallback;
* explains how healthy a food is in plain language;
* reviews and adapts the user's workout split;
* refuses to propose any change to a split or nutrition target unless it is backed by **at least 3 verified, peer-reviewed sources**;
* uses WHOOP, Oura, Fitbit (through the Google Health API) and Apple Watch (through HealthKit) data to inform its suggestions.

This folder contains design documents, a tested reference database schema, UI mockups built with the Apple Design System, and a clickable browser prototype that runs on sample data. It is not a production implementation, and it is unrelated to the AI Passport code at the repository root.

## Deliverables

| # | Deliverable | Where |
|---|---|---|
| 1 | Recommended tech stack, with reasons | [docs/01-tech-stack.md](docs/01-tech-stack.md) |
| 2 | Data model and key API endpoints | [docs/02-data-model-and-api.md](docs/02-data-model-and-api.md), [schema/schema.sql](schema/schema.sql), [schema/schema_test.sql](schema/schema_test.sql) |
| 3 | Architecture diagrams: barcode lookup, OCR fallback, research verification, wearable sync | [docs/03-architecture.md](docs/03-architecture.md) |
| 4 | Phased build plan: MVP → splits → research gate → wearables | [docs/04-build-plan.md](docs/04-build-plan.md) |
| 5 | Key risks | [docs/05-risks.md](docs/05-risks.md) |
| + | Evidence gate specification, with a worked example | [docs/06-evidence-gate.md](docs/06-evidence-gate.md) |
| + | Onboarding, dashboard, history view, health-rating rules, split-review rules, safety rules | [docs/07-product-flows.md](docs/07-product-flows.md) |
| + | UI design using the Apple Design System: theme, status palettes, 13 screen mockups, icons, copy, React Native notes | [docs/08-ui-design.md](docs/08-ui-design.md), [design/](design/) |
| + | Clickable prototype of every flow, with the real evidence gate, on sample data | [prototype/](prototype/), published at <https://claude.ai/artifact/GDGfHTP6UzXPAv3v8YoSzm> |
| + | Evidence library (claims, studies, verification) and a catalogue of datasets to download, as JSON, CSV, RIS, BibTeX and Markdown | [data/](data/) |

## The decisions that shape everything else

1. **"Fitbit" now means the Google Health API.**
   * Google's release notes say the legacy Fitbit Web API is switched off on 2026-10-30.
   * Its replacement uses restricted Google OAuth scopes, which bring an app review and an annual third-party security assessment (CASA).
   * Nothing in this design touches the Fitbit Web API.
2. **The LLM never supplies a citation.**
   * Sources come only from PubMed, Europe PMC and Crossref, by identifier.
   * Claude (`claude-opus-5-5`, structured outputs) may rank, summarise and judge records the pipeline retrieved. Any quote it gives must appear word for word in the abstract.
3. **Claims are curated, sources are verified, and both are re-checked at decision time.**
   * A human-reviewed library of claims, each backed by at least 3 sources that pass six automated checks, makes user requests fast and auditable.
   * Identifier and retraction checks re-run when stale.
   * If the research registries are unreachable, the app proposes nothing (it fails closed).
4. **The gate is enforced twice.**
   * The application enforces it.
   * PostgreSQL triggers enforce it as well: a recommendation cannot become `proposed` or `accepted`, and no app-originated split version or nutrition target can exist, unless every claim it relies on is active and has at least 3 verified sources.
   * See [schema/schema_test.sql](schema/schema_test.sql).
5. **User edits and app proposals are different things.**
   * An exact edit the user asks for is applied, and labelled *Your edit*.
   * A change the app designs (for example "help me grow my back") goes through the evidence gate.
6. **An ingredient list alone cannot give accurate calories.**
   * The fallback asks for the nutrition panel too, shows ranges with confidence levels and reasons, and lets the user correct them.
7. **Food databases are mirrored, not proxied.** Open Food Facts allows about 15 product reads per minute per IP, so nightly bulk imports serve most scans, and the live APIs handle misses.
8. **Wearable data is compared to the user's own baseline, one device at a time.**
   * Apple reports HRV as SDNN, while WHOOP, Oura and Fitbit use RMSSD, so values are never compared across devices.
   * Vendor recovery scores keep their vendor's name.
   * Every suggestion lists the data that drove it.
9. **Order of work.** Until the research gate ships in Phase 3, the app logs, analyses and applies user edits, but does not propose changes.
10. **The UI is the Apple Design System, in its Readable theme.**
    * One Action Blue accent, pill CTAs, no shadows, 400/600/700 weights, gauges for metrics, and the system's own alerts and sheets.
    * Small text carries health meaning ("High", "Reduced", "Verified"), so the Readable theme, which meets AA contrast, is used app-wide.
    * Every state carries its word, and food is described, never judged.

## Medical disclaimer (as shown in the app)

> This app provides general fitness and nutrition information. It is not medical advice and does not diagnose, treat or prevent any condition. If you have an injury, a medical condition, are pregnant, or have a history of disordered eating, talk to a qualified healthcare professional before changing your training or diet.

## Verification status of this package

* `schema/schema.sql` loads cleanly on PostgreSQL 16, and `schema/schema_test.sql` passes. The tests cover the evidence gate (including the rule that every named claim needs 3 verified sources), immutability, the audit hash chain, row-level security, crypto-shredding and deletion cascades.
* Every Mermaid diagram in `docs/` renders with mermaid-cli.
* The 13 screens in `design/screens/` are rendered from the Apple Design System's own component bundle and tokens, without page errors. `design/generated/theme.ts` is generated from the system's `tokens.json` and typechecks under `tsc --strict`.
* The prototype's smoke test (`prototype/scripts/smoke.mjs --dist`) opens every registered screen and variant in Chromium without page errors.
* Platform facts (API limits, approval processes, shutdown dates) were checked on 2026-10-12 against the sources listed in [docs/05-risks.md §5.7](docs/05-risks.md#57-sources-for-the-platform-facts-above-checked-2026-10-12). Where only third-party sources were available, the text says so.
* The three citations in the worked example ([docs/06-evidence-gate.md §6.8](docs/06-evidence-gate.md#68-worked-example)) were checked by hand via web search, not by the automated pipeline. The build environment could not reach PubMed or Crossref directly. The pipeline must re-verify them before production use.
