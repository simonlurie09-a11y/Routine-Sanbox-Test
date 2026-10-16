# 6. Evidence gate specification

The brief's rule is that every proposed change to a workout split or nutrition target needs at least three strong, verified research sources. If there are fewer, the app makes no change and says the evidence is insufficient. This document turns that rule into checks that can be implemented and audited.

## 6.1 Terms

| Term | Meaning |
|---|---|
| **Change** | Anything the *app* proposes that would alter the user's split or nutrition targets: volume, frequency, intensity or rep range, rest, exercise addition or removal, training style, calorie or macro targets. It includes session-level adjustments driven by recovery data. |
| **User edit** | A change the user specifies exactly ("add 3×10 Bulgarian split squats on Monday"). It is applied as instructed, labelled *Your edit* in the history, and is not gated because the app is not recommending it. Any descriptive findings it triggers are still shown. |
| **Claim** | A reviewed, reusable statement a rule depends on, with a population scope. Example: `hypertrophy.volume.raise_low_weekly_sets@1`. Claims are versioned; editing one creates a new version. |
| **Source** | One publication, identified by DOI and/or PMID. |
| **Strong source** | A source that passes checks 3 and 4 in §6.3. |
| **Verified source** | A source that passes all six checks for a given claim in the latest run, and whose cached result is fresh enough (§6.5). |

**The rule as implemented.** A change may reach `proposed` only if *every* claim it relies on is `active` and has **at least 3 distinct verified sources**. The database enforces the same rule (see [`schema.sql`](../schema/schema.sql), `enforce_recommendation_gate`).

## 6.2 Mapping changes to claims

The recommendation engine is a set of versioned rules. Each rule declares the claim keys it depends on, and each diff operation carries the claims that justify it (see the example payload in [02 §2.5](02-data-model-and-api.md#25-example-payloads)). This has four consequences:

* A goal-level request ("I want bigger lats") is turned into training-variable changes (more weekly sets for lats) that rest on a volume claim. Exercise *selection* then comes from the reviewed exercise catalogue: muscle credits, the user's equipment and their time limit.
* A claim about a specific exercise ("exercise X grows the glutes more than Y") needs its own claim with its own three sources. Many such claims will not clear the bar, and the app should say so.
* A rule whose claim is `draft`, `suspended` or `retired` cannot fire.
* Descriptive findings ("your chest gets 20 weekly sets and your back gets 8") are facts about the user's plan and need no evidence. The evidence gate starts at the point where the app *suggests doing something* about a finding.

## 6.3 Per-source checks

Every check writes a row to `source_checks` with its inputs and outputs in `detail`.

| # | Check | How it is decided | Pass condition |
|---|---|---|---|
| 1 | `identifier_resolves` | DOI: `GET https://doi.org/api/handles/{doi}` (the handle record exists) **and** `GET https://api.crossref.org/works/{doi}` returns a work. PMID: E-utilities `esummary` returns a record with no error. A publisher landing page that blocks bots is not treated as a failure, because the registries are the authority. | At least one identifier resolves, and if both exist, the PubMed record lists the same DOI. |
| 2 | `metadata_matches` | Compare the stored title, authors, year and journal with Crossref and PubMed: normalised title similarity (case, punctuation, diacritics folded); first-author family name; year; ISSN. | Title similarity ≥ 0.95, first author exact, year within ±1 (online-first vs print dates often differ by a year), ISSN or journal match. |
| 3 | `study_design_strong` | PubMed publication types and Crossref `type`. | Counts: Meta-Analysis, Systematic Review, Randomized Controlled Trial, Controlled Clinical Trial, or another peer-reviewed primary study (e.g. a prospective cohort) that a reviewer has approved for this claim. Never counts: narrative reviews, editorials, letters, comments, case reports, conference abstracts, position stands, preprints. |
| 4 | `peer_reviewed_indexed` | A PubMed record (PMID) is present; or Crossref type is `journal-article` and the ISSN is on the editor-maintained allowlist of indexed journals. | Indexed journal article. Crossref `posted-content` and known preprint servers (bioRxiv, medRxiv, SportRxiv, SSRN, etc.) are rejected. |
| 5 | `not_retracted` | Crossref `GET /works?filter=updates:{doi}`, reading `update-to[].type` (Crossref's REST API includes Retraction Watch records and labels them `source: retraction-watch`), plus PubMed publication types *Retracted Publication* and *Expression of Concern*. | No retraction or withdrawal. An expression of concern or a correction gives `needs_human`: a reviewer decides whether it affects the finding. |
| 6 | `finding_supported` | (a) `supporting_quote` must appear verbatim in the abstract fetched from PubMed or Europe PMC, after whitespace and Unicode normalisation (deterministic). (b) Claude judges whether the abstract supports the stored `finding_summary` and whether the finding agrees in direction with the claim. It returns `{verdict, quote, population_match, direction_match, issues[]}`, and its quote must also match verbatim. Two independent judge runs must both say `supports`. (c) At curation time, a human reviewer has signed off on the claim-source pair. | (a) passes, both judge runs say `supports`, `direction_match` is true, and a reviewer has signed off. Any disagreement becomes `needs_human`. |

**Distinctness.** Three sources means three different publications. Two reports of the same trial count once. A meta-analysis and one of the trials it pooled may both count, but the reviewer must confirm on the claim that the three are not just repackaged copies of a single dataset. This independence check needs human judgement; it is listed as a known limitation in [05-risks.md](05-risks.md).

**Population fit.** `claims.applies_to` records who the evidence covers (e.g. "mostly young adults; few trained participants"). If the user falls outside that scope (age, training status, sex, condition), the recommendation shows a "the studies mostly involved people unlike you" note. If a safety flag applies, it is blocked.

## 6.4 Where the citations come from

```
PubMed / Europe PMC search ──► records with PMID / DOI ──► stored in `sources`
                                                       │
Claude ranks and drafts ◄──────────────────────────────┘
(summary, limitations and quote, drawn only from the retrieved abstract)
```

* Claude is never asked to "find studies about X". It is given records the pipeline retrieved and can only refer to them by their stored ID. A record ID it returns that is not in the input set is a hard error.
* Claude's server-side web search tool is not used in this path. That keeps it auditable, and keeps it inside the BAA's scope.
* Paywalled full text is not required. All automated checks run against the abstract and registry metadata, and the reviewer has institutional access when needed.

## 6.5 When verification runs

| When | What runs | On failure |
|---|---|---|
| Curation (claim review) | All six checks plus human sign-off | The claim stays `draft` or `in_review`. |
| Recommendation time | Reuses the latest run for checks 2, 3, 4 and 6 if it is less than 30 days old. Re-runs checks 1 and 5 synchronously if their last pass is more than 7 days old. | `blocked_insufficient_evidence` if a source fails. `blocked_verification_unavailable` if the registries are unreachable (fail closed). |
| Weekly sweep | Checks 1 and 5 for every source behind an active claim. | The claim drops below 3 verified sources: it is suspended, open proposals that use it are withdrawn, `evidence_alerts` rows are created for accepted recommendations, and those users are notified in the app. |
| Monthly sweep | All automated checks, and a metadata-hash comparison to catch silent upstream edits. | As above. A metadata change with no other failure goes to a reviewer. |

## 6.6 What the user sees

* **Every proposal** shows:
  * the diff;
  * the drivers (the data behind it, with sources and dates);
  * a short rationale;
  * for each claim, its statement and **each cited study as a card**: title, authors, journal, year, a DOI or PMID link, what it found, its limitations, and "Verified on ⟨date⟩" with the six checks expandable;
  * the disclaimer.
* **Insufficient evidence:** "We couldn't find 3 verified studies showing this change would help, so we haven't changed your plan." Any verified sources that were found are listed, so the user sees why. Unverified sources are never shown. Options: edit the split yourself, keep the current split, or ask a professional.
* **Verification unavailable:** "We couldn't check the research right now, so we haven't suggested a change. We'll try again later."
* **Retraction after acceptance:** a banner on the dashboard and in the history, naming the source and offering to revert to the previous version.

## 6.7 Audit trail

For any recommendation, the system can show, as of the date it was made:

* which data drove it (`recommendations.drivers`, frozen);
* which claims and sources it cited, exactly as shown (`recommendation_evidence.snapshot`, immutable);
* the result of every check on every source, with registry responses and the judge's verdicts (`source_checks`, append-only, linked by `verification_run_id`);
* which engine version, model ID and prompt version produced it;
* each state change and who made it, with timestamps (`audit_events`, hash-chained so tampering is detectable).

`GET /v1/recommendations/{id}` returns this to the user, and the data export includes it.

## 6.8 Worked example

> **How this example was checked.** The identifiers below were checked by hand on 2026-10-12 using web search: PubMed/PMC pages for Krieger 2010 and Baz-Valle 2022, and the DOI for Schoenfeld 2017. The automated pipeline was not run, because the build environment's network policy blocked direct access to PubMed and Crossref. Its PMID for Schoenfeld 2017 could not be confirmed, so the example gives the DOI only. That is the rule in action: an identifier that was not verified is not shown. In production the pipeline must re-verify all of this before any citation reaches a user.

**Trigger.** The user asks, "I want a bigger back." The intent parser returns `develop_muscle: lats` and the user confirms it. The split analyser reports that lats get 6 weighted sets per week, the lowest pulling volume in the plan.

**Candidate change.** Add 3 sets of lat pulldown to Upper A, and raise chest-supported row on Upper B from 2 to 3 sets. Lats go from 6 to 9.5 weighted sets per week and Upper A from 52 to 58 minutes (limit 60).

**Claim.** `hypertrophy.volume.raise_low_weekly_sets@1`: "Within the ranges studied, more weekly sets per muscle are associated with more muscle growth. Moving a muscle from low volume toward a moderate range is supported; extra benefit above about 20 weekly sets is uncertain."

**Citations as the user would see them:**

1. **Krieger JW (2010).** Single vs. multiple sets of resistance exercise for muscle hypertrophy: a meta-analysis. *Journal of Strength and Conditioning Research* 24(4):1150–1159. PMID [20300012](https://pubmed.ncbi.nlm.nih.gov/20300012/) · doi:[10.1519/JSC.0b013e3181d4d436](https://doi.org/10.1519/JSC.0b013e3181d4d436)
   *Found:* multiple sets were associated with about 40% larger hypertrophy effect sizes than single sets, in both trained and untrained participants.
   *Limitations:* compares sets per exercise rather than weekly sets per muscle, and does not say where the benefit levels off.

2. **Schoenfeld BJ, Ogborn D, Krieger JW (2017).** Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. *Journal of Sports Sciences* 35:1073–1082 (online July 2016). doi:[10.1080/02640414.2016.1210197](https://doi.org/10.1080/02640414.2016.1210197)
   *Found:* across 15 studies (34 treatment groups), each additional weekly set was associated with a small further gain: an effect-size increase of 0.023, which the authors equate to a 0.37% increase in percentage gain. Higher volumes also beat lower volumes within studies.
   *Limitations:* the top volume category was "10 or more" weekly sets, so it cannot say how far the benefit continues beyond that. Only 2 of the 15 studies involved people with prior training experience.

3. **Baz-Valle E, Balsalobre-Fernández C, Alix-Fages C, Santos-Concejero J (2022).** A systematic review of the effects of different resistance training volumes on muscle hypertrophy. *Journal of Human Kinetics* 81:199–210. PMID [35291645](https://pubmed.ncbi.nlm.nih.gov/35291645/) · PMC8884877 · doi:[10.2478/hukin-2022-0017](https://doi.org/10.2478/hukin-2022-0017)
   *Found:* in randomised trials of at least 6 weeks with young adults, moderate (12–20) and high (more than 20) weekly sets produced similar quadriceps and biceps growth; high volume was favoured only for the triceps. The authors suggest 12–20 weekly sets per muscle as a standard recommendation for young trained men.
   *Limitations:* only 7 studies (6 in the quantitative analysis), all in adults aged 18–35, and the authors frame their recommendation for young trained men only.

**What the example shows about the checks:**

* Schoenfeld 2017 has an online date of 2016 and a print date of 2017. Without the ±1-year tolerance in check 2 it would fail as a mismatch.
* None of the three studies covers older adults or people with injuries. For those users the population-fit note would appear, and a relevant safety flag would block the change.
* The claim says "uncertain above about 20 sets" because Baz-Valle found no clear extra benefit there for two of three muscles. The claim says only what its sources support.

**Disclaimer shown with it:** "General fitness information, not medical advice. If you have an injury or a medical condition, check with a qualified professional before changing your training."
