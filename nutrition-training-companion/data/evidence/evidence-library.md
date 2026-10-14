# Evidence library

Generated from `evidence/library.json` (version seed, reviewed 2026-10-12).

Every claim the app could act on is listed here with the studies behind it. A claim is **active**, so the app may use it to change a plan, only when at least 3 strong, peer-reviewed studies support it and each of them passed six checks: its identifier (PMID or DOI) resolves to the paper; its title, authors, journal and year match across independent records; its design is strong (systematic review, meta-analysis, umbrella review, randomised controlled trial, or an evidence-based guideline in a peer-reviewed journal; for device accuracy, validation against a reference standard; for long-term health, meta-analyses of cohort studies); it is peer reviewed and indexed; no retraction or expression of concern was found; and its abstract supports the stated finding. Otherwise the claim stays a **draft** and the app changes nothing.

How this version was checked: one agent searched for evidence for and against each claim. Two further agents, working independently, then re-checked every source: one checked its identity (PubMed, DOI, publisher pages, retraction notices), and the other checked what its abstract actually found. An editor agent then decided each claim's wording and status from the verified sources only. All checks used web search against PubMed, PubMed Central, publisher and DOI pages, because the build environment could not reach the PubMed, Europe PMC or Crossref APIs directly. The production pipeline (docs/06-evidence-gate.md) must re-verify every source through those APIs before the app relies on it, and a human must review each active claim.

| Claim | Status | Verified supporting studies |
|---|---|---|
| [More weekly sets for a low-volume muscle](#hypertrophy-volume-raise-low-weekly-sets) | Enough verified evidence | 3 |
| [Heavier loads for maximal strength](#strength-low-rep-ranges) | Not enough evidence yet | 0 |
| [Limiting weekly running increases](#endurance-weekly-distance-progression) | Not enough evidence yet | 0 |
| [Lifting less on low-HRV days](#recovery-hrv-guided-lifting-volume) | Not enough evidence yet | 0 |
| [Protein for muscle gain](#nutrition-protein-intake-for-muscle-gain) | Not enough evidence yet | 0 |

## More weekly sets for a low-volume muscle
<a id="hypertrophy-volume-raise-low-weekly-sets"></a>

`hypertrophy.volume.raise_low_weekly_sets` · **Enough verified evidence**

**Claim.** Within the ranges studied, more weekly sets per muscle are linked to more muscle growth. Moving a muscle from low volume (under about 10 weekly sets) toward a moderate range is supported; extra benefit above about 20 weekly sets is uncertain.

**Who it applies to.** Mostly young adults; few studies in trained people.

**What the app does with it.** When a muscle gets fewer than 10 hard sets a week and you want it bigger, we can suggest adding sets toward 10, never above 20, within your session time.

**Why this status.** Seed entry.

### Supporting studies

- **Krieger, 2010.** Single vs. multiple sets of resistance exercise for muscle hypertrophy: a meta-analysis. *Journal of Strength and Conditioning Research* 24(4):1150–1159. PMID [20300012](https://pubmed.ncbi.nlm.nih.gov/20300012/) · DOI [10.1519/JSC.0b013e3181d4d436](https://doi.org/10.1519/JSC.0b013e3181d4d436)
  - Design: Meta-analysis.
  - What it found: Multiple sets were linked to about 40% larger muscle-growth effects than single sets, in both trained and untrained people.
  - Limitations: Counts sets per exercise, not weekly sets per muscle, and doesn't show where the benefit levels off.
  - Checks: all six passed, 2026-10-12.
- **Schoenfeld, Ogborn and Krieger, 2017.** Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. *Journal of Sports Sciences* 35:1073–1082 (online July 2016). DOI [10.1080/02640414.2016.1210197](https://doi.org/10.1080/02640414.2016.1210197)
  - Design: Systematic review and meta-analysis.
  - What it found: Across 15 studies (34 treatment groups), each extra weekly set was linked to a small further gain in muscle size, and higher volumes beat lower volumes within studies.
  - Limitations: The top volume group was '10 or more' weekly sets, so it can't say how far the benefit continues. Only 2 of the 15 studies involved people with training experience.
  - Checks: all six passed, 2026-10-12.
- **Baz-Valle et al., 2022.** A systematic review of the effects of different resistance training volumes on muscle hypertrophy. *Journal of Human Kinetics* 81:199–210. PMID [35291645](https://pubmed.ncbi.nlm.nih.gov/35291645/) · DOI [10.2478/hukin-2022-0017](https://doi.org/10.2478/hukin-2022-0017)
  - Design: Systematic review.
  - What it found: Moderate (12–20) and high (more than 20) weekly sets produced similar quadriceps and biceps growth; high volume was favoured only for the triceps.
  - Limitations: Only 7 studies, all in adults aged 18 to 35. The authors frame their 12–20 set recommendation for young trained men.
  - Checks: all six passed, 2026-10-12.



## Heavier loads for maximal strength
<a id="strength-low-rep-ranges"></a>

`strength.low_rep_ranges` · **Not enough evidence yet**

**Claim.** Lower rep ranges on main lifts improve maximal strength more than higher rep ranges.

**Who it applies to.** 

**What the app does with it.** When you ask to get stronger, we can suggest heavier loads (about 3 to 6 reps) on your main multi-joint lifts, with longer rests, and keep other exercises at moderate reps.

**Why this status.** Not yet checked.



## Limiting weekly running increases
<a id="endurance-weekly-distance-progression"></a>

`endurance.weekly_distance_progression` · **Not enough evidence yet**

**Claim.** A gradual weekly distance progression reduces running injuries.

**Who it applies to.** 

**What the app does with it.** Would limit how fast your weekly running distance rises.

**Why this status.** Not yet checked.



## Lifting less on low-HRV days
<a id="recovery-hrv-guided-lifting-volume"></a>

`recovery.hrv_guided_lifting_volume` · **Not enough evidence yet**

**Claim.** Lowering lifting volume on days of low HRV improves results.

**Who it applies to.** 

**What the app does with it.** Would let a low readiness reduce today's lifting. Until the evidence is there, readiness never changes your plan.

**Why this status.** Not yet checked.



## Protein for muscle gain
<a id="nutrition-protein-intake-for-muscle-gain"></a>

`nutrition.protein_intake_for_muscle_gain` · **Not enough evidence yet**

**Claim.** Protein intake target for muscle gain.

**Who it applies to.** 

**What the app does with it.** If your goal is muscle gain and your protein target is under 1.6 g per kg of body weight a day, we can suggest raising it to 1.6 g/kg.

**Why this status.** Not yet checked.



---

General fitness and nutrition information, not medical advice. If you have an injury, a medical condition, are pregnant, or have a history of disordered eating, talk to a qualified healthcare professional before changing your training or diet.
