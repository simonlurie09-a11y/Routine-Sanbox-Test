# Evidence library

Generated from `evidence/library.json` (version 2026-10-14, reviewed 2026-10-14).

Every claim the app could act on is listed here with the studies behind it. A claim is **active**, so the app may use it to change a plan, only when at least 3 strong, peer-reviewed studies support it and each of them passed six checks: its identifier (PMID or DOI) resolves to the paper; its title, authors, journal and year match across independent records; its design is strong (systematic review, meta-analysis, umbrella review, randomised controlled trial, or an evidence-based guideline in a peer-reviewed journal; for device accuracy, validation against a reference standard; for long-term health, meta-analyses of cohort studies); it is peer reviewed and indexed; no retraction or expression of concern was found; and its abstract supports the stated finding. Otherwise the claim stays a **draft** and the app changes nothing.

How this version was checked: one agent searched for evidence for and against each claim. Two further agents, working independently, then re-checked every source: one checked its identity (PubMed, DOI, publisher pages, retraction notices), and the other checked what its abstract actually found. An editor agent then decided each claim's wording and status from the verified sources only. All checks used web search against PubMed, PubMed Central, publisher and DOI pages, because the build environment could not reach the PubMed, Europe PMC or Crossref APIs directly. The production pipeline (docs/06-evidence-gate.md) must re-verify every source through those APIs before the app relies on it, and a human must review each active claim.

| Claim | Status | Verified supporting studies |
|---|---|---|
| [More weekly sets for a low-volume muscle](#hypertrophy-volume-raise-low-weekly-sets) | Enough verified evidence | 6 |
| [Heavier loads for maximal strength](#strength-low-rep-ranges) | Enough verified evidence | 7 |
| [Stopping sets short of failure](#training-proximity-to-failure) | Enough verified evidence | 4 |
| [Light or heavy loads grow muscle similarly](#hypertrophy-load-range-similar-growth) | Not enough evidence yet | 0 |
| [Spreading the same sets over more days](#training-frequency-volume-equated) | Not enough evidence yet | 0 |
| [Longer rests between sets](#training-inter-set-rest) | Not enough evidence yet | 3 |
| [Strength training on 2 or more days a week](#general-health-muscle-strengthening-twice-weekly) | Not enough evidence yet | 0 |
| [Planned lighter weeks](#training-deload-periods) | Not enough evidence yet | 0 |
| [Adding cardio to strength training](#training-concurrent-aerobic-compatible) | Not enough evidence yet | 0 |
| [Limiting weekly running increases](#endurance-weekly-distance-progression) | Not enough evidence yet | 0 |
| [Lifting less on low-HRV days](#recovery-hrv-guided-lifting-volume) | Not enough evidence yet | 0 |
| [HRV-guided endurance training](#recovery-hrv-guided-endurance-training) | Not enough evidence yet | 0 |
| [Short sleep and next-day performance](#recovery-sleep-loss-impairs-performance) | Not enough evidence yet | 0 |
| [How accurate wearables are](#wearables-measurement-validity) | Not enough evidence yet | 0 |
| [Free sugars](#nutrition-free-sugars-and-health) | Enough verified evidence | 4 |
| [Salt and blood pressure](#nutrition-sodium-reduction-blood-pressure) | Enough verified evidence | 3 |
| [Ultra-processed food](#nutrition-ultra-processed-food-associations) | Enough verified evidence | 7 |
| [Protein for muscle gain](#nutrition-protein-intake-for-muscle-gain) | Not enough evidence yet | 0 |
| [Daily fibre](#nutrition-fibre-intake-target) | Not enough evidence yet | 0 |
| [Protein and kidney function](#nutrition-high-protein-kidney-function-healthy) | Not enough evidence yet | 0 |
| [Saturated fat and heart disease](#nutrition-saturated-fat-replacement-cvd) | Not enough evidence yet | 0 |

## More weekly sets for a low-volume muscle
<a id="hypertrophy-volume-raise-low-weekly-sets"></a>

`hypertrophy.volume.raise_low_weekly_sets` · **Enough verified evidence**

**Claim.** In healthy adults training for muscle size (mostly young men, untrained or trained), more weekly sets per muscle give more muscle growth on average, but each extra set adds less than the one before. That supports raising a muscle from low volume (single sets, or under about 10 weekly sets) to about 10 weekly sets. Expect only a modest extra gain in size, with no promised strength benefit. Whether going above about 20 weekly sets adds anything more is uncertain.

**Who it applies to.** Healthy adults doing resistance training to build muscle size. Most of the evidence comes from young men, both untrained and resistance-trained. Direct evidence in women, older adults and clinical groups was not verified, so the claim should not be presented as tested in those groups.

**What the app does with it.** When a muscle gets fewer than 10 hard sets a week and you ask for it to grow, we can suggest adding sets toward 10, never above 20, within your session time.

**Why this status.** Active. Six counted sources all point the same way: more volume gives more growth, with diminishing returns. They are the meta-analyses by Krieger 2010, Schoenfeld 2017 and Pelland 2026, the Bernárdez-Vázquez 2022 umbrella review, and the trials by Schoenfeld 2019 and Radaelli 2015. At least three of them come from independent research groups: Schoenfeld/Krieger, Pelland/Zourdos and Radaelli. The exact 10-set target comes from the umbrella review's conclusion and from the continuous dose-response models, not from a head-to-head trial. In Schoenfeld 2017 the under-10 versus 10+ category contrast was only a trend (P = 0.074). The main contrary result is Heaselgrave 2019: in trained men, 9 weekly biceps sets matched 18 or 27. But that trial covered one muscle over 6 weeks, mixed up volume with training frequency, and does not outweigh the pooled evidence. It, Baz-Valle 2022 and Schoenfeld 2019 (which favoured about 30+ sets) together leave the benefit above 20 sets uncertain.

### Supporting studies

- **Krieger, 2010.** Single vs. multiple sets of resistance exercise for muscle hypertrophy: a meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2010 Apr;24(4):1150-9. PMID [20300012](https://pubmed.ncbi.nlm.nih.gov/20300012/) · DOI [10.1519/JSC.0b013e3181d4d436](https://doi.org/10.1519/JSC.0b013e3181d4d436)
  - Design: Meta-analysis using multilevel meta-regression: 55 effect sizes nested within 19 treatment groups and 8 studies, comparing single vs multiple sets per exercise (J Strength Cond Res 2010, Krieger) (8 studies, 19 treatment groups, 55 effect sizes (participant total not seen)).
  - What it found: Pooling 8 studies, multiple sets per exercise produced somewhat more muscle growth than single sets (effect size difference 0.10, 95% CI 0.02 to 0.19). 2 to 3 sets and 4 to 6 sets did not differ significantly.
  - Limitations: It is based on only 8 small studies and counts sets per exercise per session rather than weekly sets per muscle, so it cannot test the 10 or 20 weekly-set thresholds.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2017.** Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2017;35(11):1073-1082. PMID [27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/) · DOI [10.1080/02640414.2016.1210197](https://doi.org/10.1080/02640414.2016.1210197)
  - Design: Systematic review and meta-analysis (meta-regression) of 15 studies, 34 treatment groups (J Sports Sci 2017; Schoenfeld, Ogborn, Krieger) (15 studies, 34 treatment groups (participant total not seen)).
  - What it found: Across 15 studies (34 training groups), each extra weekly set per muscle was linked to about 0.37% more muscle growth (P = 0.002). Grouping studies into under 5, 5 to 9 and 10 or more weekly sets showed only a non-significant trend favouring 10 or more (P = 0.074).
  - Limitations: It is a small pool of mostly young men that shares authors and data with Krieger 2010, and the 10-set cut-off rests on the overall trend rather than a significant group comparison.
  - Checks: all six passed, 2026-10-14.
- **Pelland et al., 2026.** The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains. *Sports Medicine* Sports Med. 2026 Feb;56(2):481-505 (published online 4 Dec 2025). PMID [41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/) · DOI [10.1007/s40279-025-02344-w](https://doi.org/10.1007/s40279-025-02344-w)
  - Design: Systematic review with multilevel Bayesian meta-regressions of 67 studies, 2,058 participants, adjusted for intervention duration and training status (Sports Medicine; Pelland, Remmert, Robinson, Hinson, Zourdos; DOI 10.1007/s40279-025-02344-w) (67 studies, 2,058 participants (hypertrophy and strength combined)).
  - What it found: Pooling 67 studies with 2,058 participants, the estimated chance that more weekly sets give more muscle growth was 100%, but each extra set added less than the one before. Counting indirect sets from compound exercises as partial sets fitted the data best.
  - Limitations: It shows an average trend rather than an exact best number of sets, and participants were reportedly mostly untrained or recreationally trained, in studies lasting 5 to 12 weeks.
  - Checks: all six passed, 2026-10-14.
- **Bernárdez-Vázquez et al., 2022.** Resistance training variables for optimization of muscle hypertrophy: an umbrella review. *Frontiers in Sports and Active Living* Front Sports Act Living. 2022;4:949021. PMCID PMC9302196 · DOI [10.3389/fspor.2022.949021](https://doi.org/10.3389/fspor.2022.949021)
  - Design: Umbrella review of meta-analyses (PRISMA; PubMed/MEDLINE, SPORTDiscus, Web of Science): 14 of 52 meta-analyses included, covering 178 primary studies and 4,784 participants (Front Sports Act Living 2022; DOI 10.3389/fspor.2022.949021; PMC9302196; published as a Mini Review) (14 meta-analyses included (of 52 screened); 9 rated high quality (81-88%), the rest moderate (63-75%)).
  - What it found: This review of 14 meta-analyses (178 studies, 4,784 participants) concluded that at least 10 sets per muscle group per week is optimal for growth. It found that light or heavy loads both work when sets are taken to or near failure.
  - Limitations: It re-pools overlapping meta-analyses, including Schoenfeld 2017, so it is not independent evidence, and it sets no upper limit.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2019.** Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2019 Jan;51(1):94-103. PMID [30153194](https://pubmed.ncbi.nlm.nih.gov/30153194/) · PMCID PMC6303131 · DOI [10.1249/MSS.0000000000001764](https://doi.org/10.1249/MSS.0000000000001764)
  - Design: Randomised controlled trial: 34 healthy resistance-trained men randomised to 1 set (n=11), 3 sets (n=12) or 5 sets (n=11) per exercise per session, 3 sessions a week for 8 weeks (Med Sci Sports Exerc 2019;51(1):94-103; PMC6303131) (34 participants (1 RCT)).
  - What it found: In 34 trained men over 8 weeks, doing 3 or 5 sets per exercise three times a week grew the upper arm and thigh muscles more than doing 1 set. The 5-set group (roughly 30 or more weekly sets per muscle) did best at several sites. Strength gains did not differ between groups.
  - Limitations: It is a small, short trial in young trained men, and its suggestion that gains continue above 20 weekly sets is not consistently seen in other studies.
  - Checks: all six passed, 2026-10-14.
- **Radaelli et al., 2015.** Dose-Response of 1, 3, and 5 Sets of Resistance Exercise on Strength, Local Muscular Endurance, and Hypertrophy. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2015 May;29(5):1349-1358. PMID [25546444](https://pubmed.ncbi.nlm.nih.gov/25546444/) · DOI [10.1519/JSC.0000000000000758](https://doi.org/10.1519/JSC.0000000000000758)
  - Design: Randomised trial: 48 men with no weight-training experience randomised to 1-SET, 3-SET or 5-SET training groups, 3 sessions a week for about 6 months (J Strength Cond Res 2015;29(5):1349-58; Radaelli et al.) (48 participants (1 RCT)).
  - What it found: In 48 untrained men training three times a week for about 6 months, the 5-set group gained the most upper-arm muscle thickness. 3 sets also grew the elbow flexors, while the 1-set group showed no reported increase.
  - Limitations: It covers untrained men from a single research group and counts sets per exercise rather than weekly sets per muscle, so it does not pin down the 10-set threshold.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Heaselgrave et al., 2019.** Dose-Response Relationship of Weekly Resistance-Training Volume and Frequency on Muscular Adaptations in Trained Men. *International Journal of Sports Physiology and Performance* Int J Sports Physiol Perform. 2019;14(3):360-368. PMID [30160627](https://pubmed.ncbi.nlm.nih.gov/30160627/) · DOI [10.1123/ijspp.2018-0427](https://doi.org/10.1123/ijspp.2018-0427)
  - Design: Randomised controlled trial (PubMed publication type RCT): 49 resistance-trained men randomised to LOW (n=17; 9 weekly biceps sets, 1 session a week), MOD (n=15; 18 sets, 2 sessions) or HIGH (n=17; 27 sets, 2 sessions) for 6 weeks (Int J Sports Physiol Perform 2019;14(3):360-368) (49 participants (1 RCT; about 17/15/17 per group)).
  - What it found: In 49 trained men over 6 weeks, 9 weekly biceps sets increased muscle thickness about as much as 18 or 27 sets. The higher volumes may have produced more strength.
  - Limitations: It covered one muscle over only 6 weeks, and the low-volume group also trained less often, so the effect of volume cannot be separated from frequency.
  - Checks: the abstract supports the stated finding: fail.

### Context

- **Baz-Valle et al., 2022.** A Systematic Review of The Effects of Different Resistance Training Volumes on Muscle Hypertrophy. *Journal of Human Kinetics* J Hum Kinet. 2022;81:199-210. PMID [35291645](https://pubmed.ncbi.nlm.nih.gov/35291645/) · PMCID PMC8884877 · DOI [10.2478/hukin-2022-0017](https://doi.org/10.2478/hukin-2022-0017)
  - Design: Systematic review with quantitative synthesis: 7 studies in the qualitative synthesis, 6 in the quantitative. Low-volume groups (<12 weekly sets) were excluded from the quantitative analysis, which compared moderate (12-20) with high (>20) weekly sets in trained men (J Hum Kinet 2022;81:199-210; Baz-Valle, Balsalobre-Fernandez, Alix-Fages, Santos-Concejero) (7 studies in the qualitative synthesis, 6 in the quantitative analysis (participant total not seen)).
  - What it found: In 6 studies of trained men, moderate (12 to 20) and high (over 20) weekly sets gave similar growth in the quadriceps and biceps, but high volume grew the triceps more (p = 0.01). The authors suggested 12 to 20 weekly sets as a standard recommendation.
  - Limitations: It excluded low-volume groups, so it cannot test raising volume from low to moderate, and it covers young trained men only.
  - Checks: the abstract supports the stated finding: fail.

**What would change the status.** 1. There is no head-to-head trial of about 5 to 9 versus 10 to 12 weekly sets per muscle, so the exact 10-set target rests on pooled trends and the umbrella review's conclusion. 2. Direct evidence in women, older adults and clinical groups was not verified. 3. These leads have not been checked yet: the ACSM 2026 position stand, Currier 2023 (the Br J Sports Med Bayesian network meta-analysis), Brigatto 2022 (PMID 31868813), Aubé 2022 (PMID 32058362) and Enes 2024 (PMID 37796222). If any of them showed no benefit from moving low volume up to about 10 sets, the status should be reconsidered. 4. No dedicated retraction check (for example Retraction Watch) was run on the eight sources, and the reportedly retracted Barbalho trials must not be used. 5. The effect above 20 weekly sets needs longer trials in trained people that do not mix up volume and frequency. Today those trials conflict: Schoenfeld 2019 against Heaselgrave 2019 and Baz-Valle 2022. 6. Several identifiers are still missing, such as the PMID for Bernárdez-Vázquez 2022. Most quotes were not seen word for word. 7. The strength outcome is mixed: Pelland 2026 found a positive slope with sharper diminishing returns, while Schoenfeld 2019 found no difference. The app should not claim any strength benefit from this claim.

## Heavier loads for maximal strength
<a id="strength-low-rep-ranges"></a>

`strength.low_rep_ranges` · **Enough verified evidence**

**Claim.** In healthy adults, training with heavier loads (about 80% of 1RM or more, roughly 8 or fewer reps per set) gives larger gains in 1RM strength on the trained lifts than training with light loads (about 60% of 1RM or less, roughly 15 or more reps per set). An advantage over moderate loads (about 9-15 reps) is not established. When sets are taken to muscular failure, muscle growth is similar with light, moderate and heavy loads.

**Who it applies to.** Healthy adults aged 18 and over. Most were young, untrained or recreationally trained, and more were men than women. The 1RM advantage of heavier loads was smaller in older adults (Refalo 2021: effect size 0.20 vs 0.34 in younger adults). Very few highly trained or elite athletes were studied, and the results in trained men are mixed: one RCT found load mostly did not change strength gains (Morton 2016), and a small RCT found larger squat gains with heavier loads (Schoenfeld 2015).

**What the app does with it.** When you ask to get stronger, we can suggest heavier loads (about 8 reps or fewer) for main lifts you train with light loads (15 reps or more). We don't push lifts that are already moderate or heavy, because the evidence doesn't show that helps more.

**Why this status.** The narrowed claim is active. Seven counted sources support it, and five syntheses from at least four separate author groups agree that heavier loads give larger 1RM gains than light loads. These are Lopez 2021 and Currier 2023 (network meta-analyses), Refalo 2021 and Schoenfeld 2017 (pairwise meta-analyses) and Mcleod 2024 (umbrella review). The 2026 ACSM position stand and a small RCT (Schoenfeld 2015) back them up. The same syntheses find similar muscle growth across loads when sets go to failure. Morton 2016 runs against the strength half in trained men, and Hammert 2026 found the heavy-load edge on untested (isometric or isokinetic) strength inconclusive. Neither outweighs the pooled evidence, but they limit the claim to 1RM on the trained lifts. Lopez 2021 found moderate loads also beat light loads, so heavy over moderate, the specific 3-6 rep range, reps in reserve and rest lengths are not supported. The pairwise and network meta-analyses share many primary trials, and Currier 2023, Mcleod 2024 and ACSM 2026 come from overlapping McMaster authors, so the sources are less independent than their count suggests.

### Supporting studies

- **Lopez et al., 2021.** Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2021 Jun;53(6):1206-1216. doi:10.1249/MSS.0000000000002585. Corrigendum: Med Sci Sports Exerc. 2022;54(2):370 (PMID 35029596). PMID [33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/) · PMCID PMC8126497 · DOI [10.1249/MSS.0000000000002585](https://doi.org/10.1249/MSS.0000000000002585)
  - Design: Systematic review and network meta-analysis (random effects) of 28 studies involving 747 healthy adults. Training was to volitional failure, comparing low-, moderate- and high-load RT. A corrigendum (PMID 35029596) corrected effect sizes for three studies in one figure. The authors say the main findings and conclusions did not change (28 studies, 747 healthy adults).
  - What it found: A network meta-analysis of 28 studies with 747 healthy adults training to failure. Heavy (8 reps or fewer) and moderate (9-15 reps) loads both improved strength more than light loads, and muscle growth did not differ between loads.
  - Limitations: The verifier did not see the exact effect sizes, including the non-significant heavy-versus-moderate difference, and a corrigendum changed three study effect sizes, though not the conclusions.
  - Checks: all six passed, 2026-10-14.
- **Currier et al., 2023.** Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *British Journal of Sports Medicine* Br J Sports Med. 2023 Sep;57(18):1211-1220. Epub 2023 Jul 6. PMID [37414459](https://pubmed.ncbi.nlm.nih.gov/37414459/) · PMCID PMC10579494 · DOI [10.1136/bjsports-2023-106807](https://doi.org/10.1136/bjsports-2023-106807)
  - Design: Systematic review with Bayesian network meta-analysis comparing RT prescriptions with non-exercise control. The strength network had 178 studies (n=5097; 45% women). The hypertrophy network had 119 studies (n=3364; 47% women). Br J Sports Med 2023;57(18):1211-1220, PMID 37414459 (Strength network: 178 studies, 5,097 participants. Hypertrophy network: 119 studies, 3,364 participants).
  - What it found: A Bayesian network meta-analysis of 178 studies (5,097 participants, 45% women) for strength and 119 studies (3,364 participants) for muscle size. Programmes using loads above 80% of 1RM gave the largest strength gains, and all programmes built muscle about equally.
  - Limitations: Loads were compared indirectly through non-exercise control groups, and the analysis was not limited to sets taken to failure.
  - Checks: all six passed, 2026-10-14.
- **Refalo et al., 2021.** Influence of resistance training load on measures of skeletal muscle hypertrophy and improvements in maximal strength and neuromuscular task performance: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2021 Aug;39(15):1723-1745. PMID [33874848](https://pubmed.ncbi.nlm.nih.gov/33874848/) · DOI [10.1080/02640414.2021.1898094](https://doi.org/10.1080/02640414.2021.1898094)
  - Design: Systematic review with meta-analysis of 45 studies (4,713 records identified). It compared higher-load (>60% 1RM or <15RM) with lower-load (<=60% 1RM or >=15RM) RT (45 studies (from 4,713 screened records); participant total not seen).
  - What it found: A meta-analysis of 45 studies. Higher loads gave larger 1RM gains (effect size 0.34, 95% CI 0.15 to 0.52) and isometric gains (0.41, 0.07 to 0.76). Muscle growth was similar (whole-muscle effect size 0.06, -0.11 to 0.24), and the 1RM advantage was smaller in older adults (0.20 vs 0.34).
  - Limitations: It defined higher load broadly (above 60% of 1RM or fewer than 15 reps), so it cannot confirm the 80% threshold specifically.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2017.** Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2017 Dec;31(12):3508-3523. doi:10.1519/JSC.0000000000002200. PMID [28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) · DOI [10.1519/JSC.0000000000002200](https://doi.org/10.1519/JSC.0000000000002200)
  - Design: Systematic review and meta-analysis of 21 studies (PubMed/MEDLINE, Cochrane Library, Scopus). It compared low-load (<=60% 1RM) with high-load (>60% 1RM) training, all sets to momentary muscular failure, for at least 6 weeks (21 studies; participant total not seen).
  - What it found: A meta-analysis of 21 studies in which all sets went to failure for at least 6 weeks. 1RM gains were greater with loads above 60% of 1RM than with lighter loads, isometric strength did not differ, and muscle growth was similar.
  - Limitations: It defined high load as above 60% of 1RM, and its growth conclusion rests only on whole-muscle measures.
  - Checks: all six passed, 2026-10-14.
- **Mcleod et al., 2024.** The influence of resistance exercise training prescription variables on skeletal muscle mass, strength, and physical function in healthy adults: An umbrella review. *Journal of Sport and Health Science* J Sport Health Sci. 2024 Jan;13(1):47-60. doi:10.1016/j.jshs.2023.06.005. Epub 2023 Jun 28. PMID [37385345](https://pubmed.ncbi.nlm.nih.gov/37385345/) · PMCID PMC10818109 · DOI [10.1016/j.jshs.2023.06.005](https://doi.org/10.1016/j.jshs.2023.06.005)
  - Design: Umbrella review of 44 systematic reviews in healthy adults (Mcleod, Currier, Lowisz, Phillips; J Sport Health Sci 2024;13(1):47-60) (44 systematic reviews).
  - What it found: An umbrella review of 44 systematic reviews in healthy adults. Training load and weekly frequency affected strength gains but not muscle growth, and set volume affected both.
  - Limitations: It names no specific load threshold, and much of its evidence overlaps with the meta-analyses above.
  - Checks: all six passed, 2026-10-14.
- **Currier et al., 2026.** American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2026 Apr 1;58(4):851-872. Epub 2026 Mar 5. DOI [10.1249/MSS.0000000000003897](https://doi.org/10.1249/MSS.0000000000003897)
  - Design: ACSM position stand: an evidence-based overview of reviews in Med Sci Sports Exerc 2026;58(4):851-872 (doi:10.1249/MSS.0000000000003897), updating the 2009 ACSM position stand. Search results describe it as synthesising 137 systematic reviews (over 30,000 participants per ACSM) (Press release: evidence from 137 studies (exact unit, reviews or trials, not confirmed from the abstract)).
  - What it found: The 2026 ACSM position stand, an overview of reviews. It summarises that maximal strength is improved by heavier loads (80% of 1RM or more), along with full range of motion, 2-3 sets, doing the lift early in the session and training at least twice a week.
  - Limitations: No PubMed record or full abstract was seen, the details came through secondary records, and it supports only the strength half of the claim.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2015.** Effects of Low- vs. High-Load Resistance Training on Muscle Strength and Hypertrophy in Well-Trained Men. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2015 Oct;29(10):2954-2963. doi:10.1519/JSC.0000000000000958. PMID [25853914](https://pubmed.ncbi.nlm.nih.gov/25853914/) · DOI [10.1519/JSC.0000000000000958](https://doi.org/10.1519/JSC.0000000000000958)
  - Design: Randomised trial: 18 young men experienced in RT, matched on baseline strength and randomly assigned to low load (25-35 reps/set) or high load (8-12 reps/set), 9 per group, 3 sessions/week for 8 weeks. J Strength Cond Res 2015;29(10):2954-63.
  - What it found: A randomised trial in 18 trained young men over 8 weeks, with all sets to failure. Back squat 1RM rose more with 8-12 reps than with 25-35 reps (19.6% vs 8.8%), bench press showed only a trend (6.5% vs 2.0%), and muscle thickness gains did not differ.
  - Limitations: It is very small, and its heavy condition (8-12 reps, about 70-80% of 1RM) falls below the 80% threshold.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Morton et al., 2016.** Neither load nor systemic hormones determine resistance training-mediated hypertrophy or strength gains in resistance-trained young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2016 Jul 1;121(1):129-38. doi:10.1152/japplphysiol.00154.2016. PMID [27174923](https://pubmed.ncbi.nlm.nih.gov/27174923/) · PMCID PMC4967245 · DOI [10.1152/japplphysiol.00154.2016](https://doi.org/10.1152/japplphysiol.00154.2016)
  - Design: Randomised trial, n=49 resistance-trained young men (23±1 yr), 12 weeks of whole-body RT. Higher-repetition group: ~30-50% 1RM, 20-25 reps/set. Lower-repetition group: ~75-90% 1RM, 8-12 reps/set. All sets to volitional failure. PMID 27174923, PMCID PMC4967245. Group sizes conflict between sources (24/25 vs 29/27) (49 participants).
  - What it found: A randomised trial in 49 resistance-trained young men over 12 weeks, with all sets to failure. Lifting 20-25 reps (about 30-50% of 1RM) or 8-12 reps (about 75-90% of 1RM) gave similar muscle growth and, for the most part, similar strength gains. Bench press was the one measure that favoured heavier loads.
  - Limitations: It is a single trial in trained men only, its heavy condition was mostly below 80% of 1RM, and sources disagree on the group sizes.
  - Checks: the abstract supports the stated finding: fail.

### Context

- **Hammert et al., 2026.** Non-Specific Strength Changes Between High- and Low-Load Isotonic Resistance Training: A Systematic Review and Meta-Analysis. *Sports Medicine* Sports Med. 2026;56:763-773 (published online 12 Dec 2025). PMID [41381816](https://pubmed.ncbi.nlm.nih.gov/41381816/) · PMCID PMC13018011 · DOI [10.1007/s40279-025-02370-8](https://doi.org/10.1007/s40279-025-02370-8)
  - Design: Systematic review and meta-analysis (PubMed, Scopus, Embase searched to 14 June 2025): 10 studies from 7,885 unique articles, 44 effect sizes, 245 participants (high load n=114, low load n=131). Full-text snippet: high load >60% 1RM, low load <=40% 1RM (10 studies, 44 effect sizes, 245 participants (high load n=114, low load n=131)).
  - What it found: A meta-analysis of 10 studies with 245 participants. On strength tests not used in training (isometric or isokinetic), the advantage of heavy loads was inconclusive: d=0.32, 95% CI -0.08 to 0.72, p=0.10.
  - Limitations: It is small, and it addresses carry-over to untested strength rather than 1RM, so it narrows the claim rather than contradicting it.
  - Checks: the abstract supports the stated finding: unknown.

**What would change the status.** More evidence is needed in five areas. (1) Direct, volume-equated RCTs of heavy loads (about 3-6 reps) against moderate loads (about 8-12 reps), such as Mangine 2015 and Schoenfeld 2014 (not searched). These would be needed before the app could favour 3-6 reps over moderate loading. (2) Trials testing 2-3 reps in reserve and longer rests for strength. No verified source covers either, and the umbrella review found insufficient evidence on set end point and rest. (3) Evidence that similar growth across loads holds when sets stop short of failure. (4) More trials in trained and elite lifters, where results are mixed (Morton 2016 vs Schoenfeld 2015) and such lifters are about 2.3% of the evidence base. Also more trials in women and older adults, where the 1RM advantage looked smaller. (5) Better evidence on whether heavy-load gains carry over to strength tests that were not trained (Hammert 2026 was inconclusive). Several sources still need checking: Lopez 2021's effect sizes (high vs low SMD 0.60; high vs moderate non-significant) against its abstract or tables; ACSM 2026's PMID, abstract and hypertrophy recommendations; and the Currier 2023 and Mcleod 2024 identifiers on their own PubMed records. These leads were not verified or examined and were not used: Csapo & Alegre on older adults (PMID 26302881); the APNM volume-matched loads meta-analysis (doi 10.1139/apnm-2021-0515); the ACSM 2009 stand; the Schoenfeld 2016 Eur J Sport Sci meta-analysis (PMID 25530577); the 2026 paper on regional muscle and tendon growth (PMID 42319300), which may challenge similar growth in particular muscle regions; and a bioRxiv preprint. No dedicated retraction search was run for each paper.

## Stopping sets short of failure
<a id="training-proximity-to-failure"></a>

`training.proximity_to_failure` · **Enough verified evidence**

**Claim.** In healthy, mostly young adults, training to failure is not needed: stopping sets short of failure gives similar, and sometimes slightly greater, strength gains, and similar or only slightly smaller muscle growth. For muscle growth, ending sets closer to failure tends to give a little more growth; for strength, how close to failure sets end matters little.

**Who it applies to.** Healthy adults, mostly young (about 18 to 35), both untrained and resistance-trained, in supervised programmes lasting roughly 6 to 14 weeks. Evidence in older adults and in highly trained or elite lifters is limited.

**What the app does with it.** Explains why our plans never ask you to train to failure: stopping a little short works about as well.

**Why this status.** Four counted sources support the narrowed claim. For strength, Grgic 2022, Davies 2016 and Robinson 2024 agree that stopping short of failure gives similar or slightly better gains. For muscle growth, Grgic 2022, Refalo 2023 and Robinson 2024 agree that failure gives at most a small advantage, and Robinson finds growth rises as sets end closer to failure. The main contrary evidence is Vieira 2021, which found a moderate growth advantage for failure (SMD 0.75); that advantage disappears when training volumes are matched, and it does not outweigh the larger, later analyses. The draft's '1 to 3 reps in reserve' range and the researcher's '0 to 2 RIR, 3 at most' limits are not set by any counted source, so those numbers are dropped. The reviews also share many of the same small, short trials, so they are less independent than four sources suggests.

### Supporting studies

- **Grgic et al., 2022.** Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy: A systematic review and meta-analysis. *Journal of Sport and Health Science* J Sport Health Sci. 2022;11(2):202-211. doi:10.1016/j.jshs.2021.01.007. PMID [33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/) · PMCID PMC9068575 · DOI [10.1016/j.jshs.2021.01.007](https://doi.org/10.1016/j.jshs.2021.01.007)
  - Design: Systematic review and meta-analysis of 15 studies, all in young adults (J Sport Health Sci 2022, Grgic, Schoenfeld, Orazem, Sabol) (15 studies (total participants not seen)).
  - What it found: Pooling 15 studies in young adults, training to failure and stopping short showed no significant difference in strength (effect size -0.09) or muscle growth (0.22, 95% CI -0.11 to 0.55). Stopping short was better for strength when total volume was not matched, and in resistance-trained people failure gave a small growth advantage (0.15, 95% CI 0.03 to 0.26).
  - Limitations: All the studies were short and in young adults, and 'non-failure' was defined in different ways, so it cannot say how many reps short of failure is best.
  - Checks: all six passed, 2026-10-14.
- **Refalo et al., 2023.** Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis. *Sports Medicine* Sports Med. 2023;53(3):649-665. doi:10.1007/s40279-022-01784-y (Epub 2022 Nov 5). PMID [36334240](https://pubmed.ncbi.nlm.nih.gov/36334240/) · PMCID PMC9935748 · DOI [10.1007/s40279-022-01784-y](https://doi.org/10.1007/s40279-022-01784-y)
  - Design: Systematic review with meta-analysis of 15 studies in healthy adults (Sports Med 2023;53:649-665, Epub Nov 2022; Refalo et al.) (15 studies (total participants not seen)).
  - What it found: Across 15 studies, training to failure gave a trivial muscle-growth advantage over stopping short (effect size 0.19, 95% CI 0.00 to 0.37), and training volume or load did not change this. Splitting studies by how failure was defined showed no advantage, and the authors suggest the relationship may not be a straight line.
  - Limitations: The advantage was borderline and fragile, and the review cannot point to a specific number of reps in reserve because few studies measured it.
  - Checks: all six passed, 2026-10-14.
- **Robinson et al., 2024.** Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions. *Sports Medicine* Sports Med. 2024;54(9):2209-2231. doi:10.1007/s40279-024-02069-2 (published online 6 July 2024). PMID [38970765](https://pubmed.ncbi.nlm.nih.gov/38970765/) · DOI [10.1007/s40279-024-02069-2](https://doi.org/10.1007/s40279-024-02069-2)
  - Design: Systematic review with a series of meta-regressions, modelling proximity to failure as continuous estimated RIR and adjusting for load, volume-equating method, intervention duration and training status (Sports Med 2024;54:2209-2231).
  - What it found: Treating reps in reserve as a sliding scale, this series of meta-regressions found that muscle growth rose as sets ended closer to failure. Strength gains were barely affected by how close to failure sets ended.
  - Limitations: Reps in reserve were estimated after the fact rather than measured, the models fitted the data only modestly, and it shares authors and data with Refalo 2023, so it is not a fully independent check.
  - Checks: all six passed, 2026-10-14.
- **Davies et al., 2016.** Effect of Training Leading to Repetition Failure on Muscular Strength: A Systematic Review and Meta-Analysis. *Sports Medicine* Sports Med. 2016;46(4):487-502. doi:10.1007/s40279-015-0451-3. Erratum in: Sports Med. 2016;46(4):605-610, doi:10.1007/s40279-016-0509-x. PMID [26666744](https://pubmed.ncbi.nlm.nih.gov/26666744/) · DOI [10.1007/s40279-015-0451-3](https://doi.org/10.1007/s40279-015-0451-3)
  - Design: Systematic review and meta-analysis of 8 studies on strength only, 4 volume-controlled and 4 volume-uncontrolled (Sports Med 2016;46(4):487-502; erratum 46(4):605-610) (8 studies (4 volume-controlled, 4 volume-uncontrolled); participants not seen).
  - What it found: Across 8 strength-only studies, stopping short of failure gave a small but significant strength advantage over training to failure (effect size 0.34, roughly 0.6 to 1.3% more strength gain), including for compound lifts and in trained participants.
  - Limitations: It looks at strength only and includes few studies. It has a published correction whose content was not checked, and larger later reviews have overtaken it.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Vieira et al., 2021.** Effects of Resistance Training Performed to Failure or Not to Failure on Muscle Strength, Hypertrophy, and Power Output: A Systematic Review With Meta-Analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2021;35(4):1165-1175. doi:10.1519/JSC.0000000000003936. DOI [10.1519/JSC.0000000000003936](https://doi.org/10.1519/JSC.0000000000003936)
  - Design: Systematic review with meta-analysis of 13 studies (J Strength Cond Res 2021;35(4):1165-1175; Vieira, Umpierre, Teodoro, Lisboa, Baroni, Izquierdo, Cadore).
  - What it found: Across 13 studies, strength and power gains were similar overall and greater when stopping short if volumes were not matched. Muscle growth was moderately greater with failure overall (SMD 0.75), but there was no difference when training volumes were matched.
  - Limitations: The overall growth advantage may reflect failure groups simply doing more total work, and this review is older and smaller than the later analyses that found only trivial differences.
  - Checks: the abstract supports the stated finding: unknown.

### Context

- **Refalo et al., 2024.** Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve in resistance-trained individuals. *Journal of Sports Sciences* J Sports Sci. 2024;42(1):85-101. doi:10.1080/02640414.2024.2321021 (Epub 2024 Feb 23). PMID [38393985](https://pubmed.ncbi.nlm.nih.gov/38393985/) · DOI [10.1080/02640414.2024.2321021](https://doi.org/10.1080/02640414.2024.2321021)
  - Design: 8-week within-participant (one leg per condition) training trial in resistance-trained adults, n = 18 (12 men, 6 women): failure vs 2 RIR (leg press) / 1 RIR (leg extension); J Sports Sci 2024;42(1):85-101, doi 10.1080/02640414.2024.2321021. Randomisation of limbs not verified.
  - What it found: In 18 resistance-trained adults, one leg trained to momentary failure and the other stopped 1 to 2 reps short for 8 weeks. Quadriceps thickness grew almost identically in both legs (about 0.18 cm), but training to failure caused more short-term fatigue.
  - Limitations: It is a single small study of one muscle group in trained lifters, and it was not confirmed whether the legs were randomly allocated.
  - Checks: strong study design: unknown; the abstract supports the stated finding: unknown.
- **Pelland et al., 2022.** Methods for Controlling and Reporting Resistance Training Proximity to Failure: Current Issues and Future Directions. *Sports Medicine* Sports Med. 2022;52(7):1461-1472. doi:10.1007/s40279-022-01667-2 (Epub 2022 Mar 5). PMID [35247203](https://pubmed.ncbi.nlm.nih.gov/35247203/) · DOI [10.1007/s40279-022-01667-2](https://doi.org/10.1007/s40279-022-01667-2)
  - Design: Narrative/methodological review (Sports Med 2022;52(7):1461-1472; Pelland, Robinson, Helms, Zourdos and colleagues).
  - What it found: This methods review shows there is no consistent way to measure how close to failure a set ends, and that studies define failure differently. This makes precise reps-in-reserve recommendations for growth and strength hard to give.
  - Limitations: It is a narrative review with no new data, so it explains the uncertainty but does not test any effect.
  - Checks: strong study design: fail; the abstract supports the stated finding: unknown.

**What would change the status.** 1. Specific reps-in-reserve targets need at least three counted sources that test or estimate outcomes at defined RIR values. Examples are head-to-head trials of about 1 to 3 RIR against failure for growth, or verified per-RIR predictions from the Robinson 2024 full text. No trial yet compares 3 RIR directly with 0 RIR for growth. 2. Verifying the Wu 2026 metadata (authors, volume, PMID) would add a fourth independent-analysis source for strength and growth. 3. Checking that limbs were randomly allocated in Refalo 2024 would let that trial count for the 1 to 2 RIR finding. 4. The content of the Davies 2016 erratum and of the comment on Refalo 2023 is unknown. 5. The reviews share many of the same primary trials, and Robinson 2024 shares authors and data with Refalo 2023. Independent, larger and longer trials (over 12 weeks) with measured rather than estimated RIR would strengthen the evidence. 6. Evidence is sparse for older adults and for highly trained or elite lifters, so the statement should not be extended to them without dedicated studies. 7. No dedicated retraction-database search was run.

## Light or heavy loads grow muscle similarly
<a id="hypertrophy-load-range-similar-growth"></a>

`hypertrophy.load_range_similar_growth` · **Not enough evidence yet**

**Claim being tested.** In healthy young adults, training with loads from about 30% to about 85% of 1RM appears to give similar gains in whole-muscle size when sets are taken to momentary failure, while heavier loads still give larger gains in maximal (1RM) strength. This is not established for loads below about 30% of 1RM, or for light-load sets stopped well short of failure.

**Who it applies to.** Healthy adults, untrained or resistance-trained. Most data come from young men aged about 18-35 in 6-12 week programmes. The claim is not established for women, older adults or highly trained athletes.

**What the app does with it.** Would let us say that a change of load shouldn't cost you muscle. Until then, we don't say it.

**Why this status.** No source counts toward this claim. Verification of all 15 sources stopped when the shared web-search budget ran out, so no abstract or finding was checked against the claim, and every design, direction and finding check is unknown. The candidate evidence looks consistent: meta-analyses from four groups (Schoenfeld 2017, Lopez 2021, Refalo 2021, Carvalho 2022) and trials such as Mitchell 2012, Morton 2016 and Lees all report similar growth across loads. But the app's 3-source rule cannot be met until at least three of them pass verification. Even then the claim has limits: 20% 1RM gave about half the growth of 80% (Lasevicius 2018); light-load sets stopped short of failure appear to give less growth (Lasevicius 2022, identity not yet confirmed); fibre-level data lean non-significantly towards heavy loads (Grgic 2020); and heavier loads consistently give larger strength gains.

### Context

- **Schoenfeld et al., 2017.** Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2017 Dec;31(12):3508-3523. doi:10.1519/JSC.0000000000002200. PMID [28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) · DOI [10.1519/JSC.0000000000002200](https://doi.org/10.1519/JSC.0000000000002200)
  - Design: Systematic review and meta-analysis of 21 studies (PubMed/MEDLINE, Cochrane Library, Scopus). It compared low-load (<=60% 1RM) with high-load (>60% 1RM) training, all sets to momentary muscular failure, for at least 6 weeks (21 studies; participant total not seen).
  - What it found: A meta-analysis of 21 studies in which all sets went to failure for at least 6 weeks. 1RM gains were greater with loads above 60% of 1RM than with lighter loads, isometric strength did not differ, and muscle growth was similar.
  - Limitations: It defined high load as above 60% of 1RM, and its growth conclusion rests only on whole-muscle measures.
  - Checks: all six passed, 2026-10-14.
- **Lopez et al., 2021.** Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2021 Jun;53(6):1206-1216. doi:10.1249/MSS.0000000000002585. Corrigendum: Med Sci Sports Exerc. 2022;54(2):370 (PMID 35029596). PMID [33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/) · PMCID PMC8126497 · DOI [10.1249/MSS.0000000000002585](https://doi.org/10.1249/MSS.0000000000002585)
  - Design: Systematic review and network meta-analysis (random effects) of 28 studies involving 747 healthy adults. Training was to volitional failure, comparing low-, moderate- and high-load RT. A corrigendum (PMID 35029596) corrected effect sizes for three studies in one figure. The authors say the main findings and conclusions did not change (28 studies, 747 healthy adults).
  - What it found: A network meta-analysis of 28 studies with 747 healthy adults training to failure. Heavy (8 reps or fewer) and moderate (9-15 reps) loads both improved strength more than light loads, and muscle growth did not differ between loads.
  - Limitations: The verifier did not see the exact effect sizes, including the non-significant heavy-versus-moderate difference, and a corrigendum changed three study effect sizes, though not the conclusions.
  - Checks: all six passed, 2026-10-14.
- **Refalo et al., 2021.** Influence of resistance training load on measures of skeletal muscle hypertrophy and improvements in maximal strength and neuromuscular task performance: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2021 Aug;39(15):1723-1745. PMID [33874848](https://pubmed.ncbi.nlm.nih.gov/33874848/) · DOI [10.1080/02640414.2021.1898094](https://doi.org/10.1080/02640414.2021.1898094)
  - Design: Systematic review with meta-analysis of 45 studies (4,713 records identified). It compared higher-load (>60% 1RM or <15RM) with lower-load (<=60% 1RM or >=15RM) RT (45 studies (from 4,713 screened records); participant total not seen).
  - What it found: A meta-analysis of 45 studies. Higher loads gave larger 1RM gains (effect size 0.34, 95% CI 0.15 to 0.52) and isometric gains (0.41, 0.07 to 0.76). Muscle growth was similar (whole-muscle effect size 0.06, -0.11 to 0.24), and the 1RM advantage was smaller in older adults (0.20 vs 0.34).
  - Limitations: It defined higher load broadly (above 60% of 1RM or fewer than 15 reps), so it cannot confirm the 80% threshold specifically.
  - Checks: all six passed, 2026-10-14.
- **Carvalho et al., 2022.** Muscle hypertrophy and strength gains after resistance training with different volume-matched loads: a systematic review and meta-analysis. *Applied Physiology, Nutrition, and Metabolism* Appl Physiol Nutr Metab. 2022 Apr;47(4):357-368. doi:10.1139/apnm-2021-0515. PMID [35015560](https://pubmed.ncbi.nlm.nih.gov/35015560/) · DOI [10.1139/apnm-2021-0515](https://doi.org/10.1139/apnm-2021-0515)
  - Design: Systematic review with meta-analysis (Number of studies and participants not seen in search results).
  - What it found: Compared different loads with total training volume matched and reported no difference in muscle growth between them.
  - Limitations: Not yet verified, and the number of studies was not seen. Because volume was matched, sets may not have gone to failure, so it tests the 'to failure' condition only indirectly.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Mcleod et al., 2024.** The influence of resistance exercise training prescription variables on skeletal muscle mass, strength, and physical function in healthy adults: An umbrella review. *Journal of Sport and Health Science* J Sport Health Sci. 2024 Jan;13(1):47-60. doi:10.1016/j.jshs.2023.06.005. Epub 2023 Jun 28. PMID [37385345](https://pubmed.ncbi.nlm.nih.gov/37385345/) · PMCID PMC10818109 · DOI [10.1016/j.jshs.2023.06.005](https://doi.org/10.1016/j.jshs.2023.06.005)
  - Design: Umbrella review of 44 systematic reviews in healthy adults (Mcleod, Currier, Lowisz, Phillips; J Sport Health Sci 2024;13(1):47-60) (44 systematic reviews).
  - What it found: An umbrella review of 44 systematic reviews in healthy adults. Training load and weekly frequency affected strength gains but not muscle growth, and set volume affected both.
  - Limitations: It names no specific load threshold, and much of its evidence overlaps with the meta-analyses above.
  - Checks: all six passed, 2026-10-14.
- **Morton et al., 2016.** Neither load nor systemic hormones determine resistance training-mediated hypertrophy or strength gains in resistance-trained young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2016 Jul 1;121(1):129-38. doi:10.1152/japplphysiol.00154.2016. PMID [27174923](https://pubmed.ncbi.nlm.nih.gov/27174923/) · PMCID PMC4967245 · DOI [10.1152/japplphysiol.00154.2016](https://doi.org/10.1152/japplphysiol.00154.2016)
  - Design: Randomised trial, n=49 resistance-trained young men (23±1 yr), 12 weeks of whole-body RT. Higher-repetition group: ~30-50% 1RM, 20-25 reps/set. Lower-repetition group: ~75-90% 1RM, 8-12 reps/set. All sets to volitional failure. PMID 27174923, PMCID PMC4967245. Group sizes conflict between sources (24/25 vs 29/27) (49 participants).
  - What it found: A randomised trial in 49 resistance-trained young men over 12 weeks, with all sets to failure. Lifting 20-25 reps (about 30-50% of 1RM) or 8-12 reps (about 75-90% of 1RM) gave similar muscle growth and, for the most part, similar strength gains. Bench press was the one measure that favoured heavier loads.
  - Limitations: It is a single trial in trained men only, its heavy condition was mostly below 80% of 1RM, and sources disagree on the group sizes.
  - Checks: the abstract supports the stated finding: fail.
- **Lees et al., 2026.** Resistance training load does not determine resistance training-induced hypertrophy across upper and lower limbs in healthy young males. *The Journal of Physiology* J Physiol. 2026 (Epub 2025 Dec 31). doi:10.1113/JP289684. Volume/pages not seen. PMID [41474371](https://pubmed.ncbi.nlm.nih.gov/41474371/) · DOI [10.1113/JP289684](https://doi.org/10.1113/JP289684)
  - Design: Randomised within-subject (contralateral limb) trial (20 participants).
  - What it found: In 20 healthy young men training three times a week for 10 weeks, this trial compared lighter (about 30-40% 1RM) and heavier (about 70-80% 1RM) loads within the same people. It reportedly found that load did not determine muscle growth in either the arms or the legs.
  - Limitations: It is small, men-only and from the same laboratory as Mitchell 2012 and Morton 2016. Its results were not yet verified, and it was published online in December 2025 with the 2026 issue unconfirmed.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Mitchell et al., 2012.** Resistance exercise load does not determine training-mediated hypertrophic gains in young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2012 Jul;113(1):71-77. doi:10.1152/japplphysiol.00307.2012. PMID [22518835](https://pubmed.ncbi.nlm.nih.gov/22518835/) · PMCID PMC3404827 · DOI [10.1152/japplphysiol.00307.2012](https://doi.org/10.1152/japplphysiol.00307.2012)
  - Design: Randomised within-subject (unilateral leg) trial (Participant number not confirmed in search snippets).
  - What it found: A randomised trial in untrained young men that reported similar muscle growth from light and heavy loads when sets were taken to failure.
  - Limitations: Not yet verified: the participant number and results were not checked. It covered untrained young men only.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Grgic, 2020.** The Effects of Low-Load Vs. High-Load Resistance Training on Muscle Fiber Hypertrophy: A Meta-Analysis. *Journal of Human Kinetics* J Hum Kinet. 2020;74:51-58. doi:10.2478/hukin-2020-0013. PMID [33312275](https://pubmed.ncbi.nlm.nih.gov/33312275/) · PMCID PMC7706639 · DOI [10.2478/hukin-2020-0013](https://doi.org/10.2478/hukin-2020-0013)
  - Design: Systematic review with meta-analysis (10 study groups (participant total not seen)).
  - What it found: Pooled studies of single muscle fibres and found a non-significant trend towards greater growth of fast-twitch (type II) fibres with heavy loads (SMD 0.30, p = 0.089), with very wide uncertainty.
  - Limitations: It measures fibre size, not whole-muscle size, the trend is not statistically significant, and the findings are not yet verified.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Lasevicius et al., 2018.** Effects of different intensities of resistance training with equated volume load on muscle strength and hypertrophy. *European Journal of Sport Science* Eur J Sport Sci. 2018;18(6):772-780. doi:10.1080/17461391.2018.1450898. PMID [29564973](https://pubmed.ncbi.nlm.nih.gov/29564973/) · DOI [10.1080/17461391.2018.1450898](https://doi.org/10.1080/17461391.2018.1450898)
  - Design: Randomised within-subject trial (30 participants).
  - What it found: 30 men trained twice a week for 12 weeks, with each limb assigned to 20%, 40%, 60% or 80% of 1RM and volume load matched. The 20% load reportedly gave about half the muscle growth of 80%, while 40-80% were broadly similar.
  - Limitations: The result values were not yet verified. Volume-matched sets were not necessarily taken to failure, and the trial included men only.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.

**What would change the status.** The decisive gap is verification, not evidence. Re-run verification in a turn with search budget available. At least three of Schoenfeld 2017, Lopez 2021, Refalo 2021, Carvalho 2022, Morton 2016, Lees and Mitchell 2012 must pass every check (identifier, metadata on a second independent page, peer review, retraction status, strong design, and a finding that supports the claim) before the status can be active. Because the meta-analyses share most of their primary trials, and Mitchell, Morton and Lees come from one laboratory, the counted set should include reviews from different groups, or at least one RCT from another laboratory (e.g. Schoenfeld 2015), so the agreement is not the same data counted twice. Lasevicius 2022 needs its identity confirmed to support the rule that light-load sets must end at or within about 1 rep of failure, and direct trials of light loads at 1-3 reps in reserve would be needed to extend the claim from 'to failure' to 'close to failure'. Lasevicius 2018 should be verified to fix the lower bound at about 30% 1RM. The upper bound above about 85-90% 1RM rests only on a small 2025 trial (Cumming et al.) with an unconfirmed PMID. Applying the claim beyond young men would need trials in women, older adults and highly trained athletes. The type II fibre question (Grgic 2020) remains open.

## Spreading the same sets over more days
<a id="training-frequency-volume-equated"></a>

`training.frequency_volume_equated` · **Not enough evidence yet**

**Claim being tested.** In healthy adults, when weekly sets per muscle are kept the same, training a muscle once a week or spreading those sets over two or three sessions a week appears to give similar muscle growth. This has not yet been confirmed by verified sources, and no claim is made about strength.

**Who it applies to.** Healthy adults, mostly young (pooled mean age about 25) and mostly male (about 79%), untrained or resistance-trained, doing supervised programmes of about 6 to 12 weeks (some up to about 30) at 1 to 3 sessions per muscle per week. The evidence does not reliably cover women, adults over 60, clinical groups, more than 3 sessions per muscle per week, or programmes much longer than 12 weeks.

**What the app does with it.** Would let us move sets between days to fit your session time. Until then, we only move them when you edit your plan.

**Why this status.** None of the nine candidate sources counts: the shared search budget ran out before any checks ran, so for every source the identity, peer-review status, retraction status, design and reported finding are all unknown. The submitted evidence looks consistent for hypertrophy (Schoenfeld 2019, Pelland 2026, Tao 2026, Ramos-Campo 2024 and Pedersen 2024 all report no meaningful difference at equal volume), but none of it is verified, so the claim must stay a draft. Two sources point the other way: Schoenfeld 2016 found twice a week beat once a week, and the small Zaroni 2019 trial found more growth with 5 sessions a week. Both favour more frequent training, so they do not suggest splitting sets would cause harm. The strength part, including the 'mainly through extra volume' clause, is contested: Grgic 2018 and Cuthbert 2021 found no volume-equated effect, while Tao 2026, Pelland 2026 and Pedersen 2024 report a small independent benefit. So it is left out of the statement.

**What would change the status.** 1) Verification has to be re-run, ideally in a turn with search budget left. At least 3 of Schoenfeld 2019, Pelland 2026, Tao 2026, Ramos-Campo 2024 and Pedersen 2024 must pass every check (identifier, metadata, peer review, no retraction, strong design) with a confirmed volume-equated hypertrophy finding. Specific items to resolve: the Grgic 2018 PMID conflict (29470825 vs 28444646), the journal and peer-review status of Tao 2026, the full citation for Pelland 2026, and whether every trial in Ramos-Campo 2024 equated volume. 2) The volume-equated RCTs the researcher cited (Hamarsland 2022, Gomes 2019, Saric 2019, Gentil 2018, Brigatto 2019) were never put forward for verification. Verifying them would add primary evidence that does not rely on overlapping meta-analyses. 3) Even once verified, the meta-analyses draw on the same pool of small trials and often share authors. At least one source from an independent group, or independent primary trials, would strengthen any activation. 4) Supporting 4 or more sessions per muscle per week would need more volume-equated trials at those frequencies. 5) Trials in women, adults over 60, clinical groups, and programmes longer than 12 weeks are needed before the claim can be extended to them. 6) A strength statement would need agreement between Grgic 2018 and Cuthbert 2021 on one side and Tao 2026, Pelland 2026 and Pedersen 2024 on the other. The question is whether frequency helps strength independently of volume or through extra practice of the tested lift. 7) No source gives a maximum number of sets per session, so the app has no basis for a per-session cap.

## Longer rests between sets
<a id="training-inter-set-rest"></a>

`training.inter_set_rest` · **Not enough evidence yet**

**Claim being tested.** When the number of sets stays the same, resting more than about 60 seconds between sets may give slightly more muscle growth than resting 60 seconds or less. There seems to be no clear extra benefit beyond about 90 seconds, and the difference is small and uncertain. For strength, resistance-trained lifters gain more with rests longer than about 2 minutes, while untrained people do about as well with 60-120 seconds.

**Who it applies to.** Healthy adults doing resistance training, mostly young men. The finding that rests over 2 minutes help strength applies only to resistance-trained lifters. For untrained people, 60-120 seconds appears to be enough for strength. The evidence covers exercises in general and has nothing specific to multi-joint lifts. Women, older adults and programmes longer than about 10-12 weeks are barely represented.

**What the app does with it.** Would let us suggest rest times between sets. Until then, your rests are whatever your plan says, and we use them only to estimate session length.

**Why this status.** Draft. Only three sources pass every check (Singer 2024, Grgic 2018 and Schoenfeld 2016), and each backs a different part of the claim. Muscle growth is supported only by Singer 2024 (small effect, credible intervals crossing zero) and Schoenfeld 2016. Strength in trained lifters is supported only by Grgic 2018 and Schoenfeld 2016. So no single statement has three counted sources, and the Schoenfeld trial probably also sits inside both reviews, which share an author. The original draft's claim that 2 minutes or more gives more growth is not supported beyond about 90 seconds, and nothing isolates multi-joint lifts. Volume-matched trials (Longo 2022, Attarieh 2026) suggest any advantage comes from the extra volume that longer rests allow. Fink 2018 found the opposite, but rest was confounded with load. The ACSM 2026 stand reportedly found no strength effect of rest, but that is unverified.

### Supporting studies

- **Singer et al., 2024.** Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Frontiers in Sports and Active Living* Front Sports Act Living. 2024;6:1429789 (published 14 Aug 2024). doi:10.3389/fspor.2024.1429789. PMID [39205815](https://pubmed.ncbi.nlm.nih.gov/39205815/) · PMCID PMC11349676 · DOI [10.3389/fspor.2024.1429789](https://doi.org/10.3389/fspor.2024.1429789)
  - Design: Systematic review with Bayesian meta-analysis of randomised studies comparing inter-set rest durations in healthy adults, with other training variables controlled; 19 measurements (thigh, arm, whole body) from 9 studies. Singer, Wolf, Schoenfeld et al., Front Sports Act Living 2024 (published 14 Aug 2024), doi:10.3389/fspor.2024.1429789 (9 studies; 19 measurements (10 thigh, 6 arm, 3 whole body); total participants not seen).
  - What it found: A Bayesian meta-analysis of 19 measurements from 9 randomised studies found a small muscle-growth benefit from resting more than 60 s rather than 60 s or less. This was possibly because longer rests let people lift more total volume. There was no appreciable extra benefit beyond about 90 s, and the whole-body estimate was -0.08 (95% credible interval -0.45 to 0.29).
  - Limitations: The studies were few, small and varied, and the credible intervals cross zero, so the benefit is uncertain; it also does not look at strength.
  - Checks: all six passed, 2026-10-14.
- **Grgic et al., 2018.** Effects of Rest Interval Duration in Resistance Training on Measures of Muscular Strength: A Systematic Review. *Sports Medicine* Sports Med. 2018;48(1):137-151. doi:10.1007/s40279-017-0788-x. PMID [28933024](https://pubmed.ncbi.nlm.nih.gov/28933024/) · DOI [10.1007/s40279-017-0788-x](https://doi.org/10.1007/s40279-017-0788-x)
  - Design: Systematic review (PRISMA, 5 databases, no pooled meta-analysis seen) of chronic training studies comparing rest interval durations; 23 studies, 491 participants (413 males, 78 females); studies rated good-to-moderate methodological quality. Grgic, Schoenfeld, Skrepnik, Davies, Mikulic. Sports Med 2018;48(1):137-151 (23 studies; 491 participants).
  - What it found: A systematic review of 23 training studies (491 participants, mostly men) concluded that resistance-trained people need rests longer than 2 minutes to maximise strength gains. For untrained people, 60-120 s is enough, and rests under 60 s still produce solid gains.
  - Limitations: It covers strength only and gives no pooled effect size, so it cannot say how large the advantage is or whether it applies to muscle growth.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2016.** Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2016;30(7):1805-1812. doi:10.1519/JSC.0000000000001272. PMID [26605807](https://pubmed.ncbi.nlm.nih.gov/26605807/) · DOI [10.1519/JSC.0000000000001272](https://doi.org/10.1519/JSC.0000000000001272)
  - Design: Randomised controlled trial (parallel groups): 21 resistance-trained young men randomly assigned to 1-min (SHORT) vs 3-min (LONG) inter-set rest for 8 weeks. Schoenfeld et al., J Strength Cond Res 2016 (21 participants (1-min SHORT vs 3-min LONG groups)).
  - What it found: In 21 resistance-trained young men over 8 weeks, resting 3 minutes rather than 1 minute led to larger gains in squat and bench press 1RM and in front-thigh muscle thickness. Muscular endurance improved similarly in both groups.
  - Limitations: It is one small, short trial in trained young men that is probably also included in the reviews above, so it adds little independent evidence.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Fink et al., 2018.** Effects of rest intervals and training loads on metabolic stress and muscle hypertrophy. *Clinical Physiology and Functional Imaging* Clin Physiol Funct Imaging. 2018;38(2):261-268 (online 28 Dec 2016). doi:10.1111/cpf.12409. PMID [28032435](https://pubmed.ncbi.nlm.nih.gov/28032435/) · DOI [10.1111/cpf.12409](https://doi.org/10.1111/cpf.12409)
  - Design: Two-group, volume-matched training study, 20 subjects. SL: 30-s rest with 20RM, n=10. LH: 3-min rest with 8RM, n=10. 8 weeks, MRI upper-arm CSA. One summary described it as randomised, but I did not see random allocation in the abstract text. Rest and load were confounded. Fink, Kikuchi, Nakazato, Clin Physiol Funct Imaging 2018 (online Dec 2016) (20 participants (10 per group)).
  - What it found: In 20 people over 8 weeks with total volume matched, 30-second rests with light loads (20RM) increased upper-arm muscle area more (about 9.9%) than 3-minute rests with heavier loads (8RM, about 4.7%).
  - Limitations: Rest length was changed together with load, so the effect of rest on its own cannot be separated, and the groups were small.
  - Checks: strong study design: unknown; the abstract supports the stated finding: fail.

### Context

- **Grgic et al., 2017.** The effects of short versus long inter-set rest intervals in resistance training on measures of muscle hypertrophy: A systematic review. *European Journal of Sport Science* Eur J Sport Sci. 2017 Sep;17(8):983-993. doi:10.1080/17461391.2017.1340524. PMID [28641044](https://pubmed.ncbi.nlm.nih.gov/28641044/) · DOI [10.1080/17461391.2017.1340524](https://doi.org/10.1080/17461391.2017.1340524)
  - Design: Systematic review (no meta-analysis) of 6 studies comparing inter-set rest of <=60 s vs >60 s, with a muscle-mass outcome over at least 4 weeks. Searched PubMed/MEDLINE, Scopus, Web of Science, Cochrane Library and PEDro. Grgic, Lazinica, Mikulic, Krieger, Schoenfeld; Eur J Sport Sci 2017;17(8):983-993; DOI 10.1080/17461391.2017.1340524 (seen in a search summary) (6 trials; total participants not seen).
  - What it found: A systematic review of 6 trials concluded that both short (60 s or less) and long (more than 60 s) rests can build muscle, with a possible advantage for longer rests in trained people.
  - Limitations: It covers only six small trials with no meta-analysis, and the possible advantage in trained people was seen only in a secondary summary.
  - Checks: the abstract supports the stated finding: unknown.
- **Buresh et al., 2009.** The effect of resistive exercise rest interval on hormonal response, strength, and hypertrophy with training. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2009;23(1):62-71 (issue number as indexed; DOI not seen). PMID [19077743](https://pubmed.ncbi.nlm.nih.gov/19077743/)
  - Design: Two-group parallel training study, 12 untrained men (about 6 per group), 1-min vs 2.5-min rest for 10 weeks. Random allocation is not stated in the abstract text I saw. Buresh, Berg, French, J Strength Cond Res 2009 (12 participants (about 6 per group)).
  - What it found: In 12 untrained men over 10 weeks, upper-arm muscle area grew more with 2.5-minute rests (about 12%) than with 1-minute rests (about 5%). Strength gains did not differ.
  - Limitations: With about 6 people per group and random allocation not confirmed, it cannot give a reliable estimate.
  - Checks: strong study design: unknown; the abstract supports the stated finding: unknown.
- **Attarieh et al., 2026.** Comparison between 20-s and 2-min inter-set rest intervals on changes in muscle cross-sectional area and maximum strength under volume-load-equated resistance training. *Sport Sciences for Health* Sport Sci Health. 2026;22(1): article 32 (online October 2025). doi:10.1007/s11332-025-01605-5. DOI [10.1007/s11332-025-01605-5](https://doi.org/10.1007/s11332-025-01605-5)
  - Design: Within-subject training study: 17 untrained young men (mean age 25.3), each leg doing a different condition. LONG: 10RM, 3-4 sets to failure, 2-min rest. SHORT: 10RM, sets to failure until reps matched LONG, 20-s rest. Unilateral knee extension, 2x/week for 10 weeks. Randomisation of legs not confirmed. Attarieh et al., Sport Sci Health 2026;22: article 32. A Correction notice exists (doi:10.1007/s11332-026-01758-x) (17 participants).
  - What it found: In 17 untrained men doing knee extensions for 10 weeks, one leg rested 20 s and did extra sets to match the volume of the other leg, which rested 2 minutes. Thigh muscle growth did not differ (rectus femoris +14.3% vs +16.7%), and neither did strength gain (1RM +42.4% vs +41.5%).
  - Limitations: It used one single-joint exercise in untrained men, leg allocation was not confirmed as random, and a published correction exists whose content was not seen.
  - Checks: strong study design: unknown; the abstract supports the stated finding: unknown.
- **Longo et al., 2022.** Volume Load Rather Than Resting Interval Influences Muscle Hypertrophy During High-Intensity Resistance Training. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2022 Jun;36(6):1554-1559. doi:10.1519/JSC.0000000000003668 (online first 5 June 2020). PMID [35622106](https://pubmed.ncbi.nlm.nih.gov/35622106/) · DOI [10.1519/JSC.0000000000003668](https://doi.org/10.1519/JSC.0000000000003668)
  - Design: Within-subject training study: 28 subjects, each leg allocated to 1 of 4 unilateral knee-extension protocols at 80% 1RM, 2x/week for 10 weeks. LI: 3-min rest. SI: 1-min rest. VLI-SI: 1-min rest with volume load matched to LI. VSI-LI: 3-min rest with volume load matched to SI. Random allocation not confirmed in the text I saw. Longo et al., J Strength Cond Res 2022;36(6):1554-1559 (epub 2020) (28 participants).
  - What it found: In 28 young people training knee extensions at 80% 1RM for 10 weeks, 3-minute rests gave more quadriceps growth than 1-minute rests with the same sets (13.1% vs 6.8%). However, 1-minute rests with extra volume matched it (12.9%), and 3-minute rests held to the lower volume grew less (6.6%). Strength rose similarly in all groups.
  - Limitations: It used a single single-joint exercise in untrained people, and randomisation of legs was not confirmed, so it may not apply to multi-joint lifts or trained lifters.
  - Checks: strong study design: unknown; the abstract supports the stated finding: unknown.

**What would change the status.** The status could change to active if each part of the statement had at least 3 counted, reasonably independent sources. For muscle growth, a further strong source is needed. The status could change if randomisation is confirmed in Buresh 2009, if the Grgic 2017 abstract wording on trained participants is checked, or if a new well-powered randomised trial or independent meta-analysis with sets held equal is found. For strength in trained lifters, the lead PMID 19811949 (1, 3 and 5-minute rests in trained men) should be verified, along with any other independent randomised trial. The study lists of Singer 2024 and Grgic 2017/2018 need to be compared to see how far they reuse the same trials, including Schoenfeld 2016. The primary text of the ACSM 2026 stand must be checked: if it reports no effect of rest on strength, that would weigh against the claim. The following checks are still to do: the Attarieh 2026 correction, randomisation in Longo 2022, and dedicated retraction searches. No study compares multi-joint with single-joint exercises, so the draft's multi-joint wording cannot be tested. Data on women, older adults and training longer than about 12 weeks are needed before the claim is applied to those users.

## Strength training on 2 or more days a week
<a id="general-health-muscle-strengthening-twice-weekly"></a>

`general_health.muscle_strengthening_twice_weekly` · **Not enough evidence yet**

**Claim being tested.** Not yet verified: WHO (2020) and US (2018) guidelines are reported to recommend that adults do muscle-strengthening activity on 2 or more days a week, alongside aerobic activity, and observational studies are reported to link any such activity with lower all-cause mortality. None of the sources has been verified, so this stays a draft and the app changes nothing.

**Who it applies to.** Adults aged 18 and over in the general, non-clinical population. This is the proposed scope and has not been verified. The guideline part would cover adults aged 18 to 64 and those aged 65 and over. The mortality evidence would come mostly from middle-aged and older adults in prospective cohorts.

**What the app does with it.** Would let us suggest a second strength day for the general health goal.

**Why this status.** No source counts towards this claim. The shared web-search budget ran out before any check could run, so all 9 sources, including the two guidelines (Bull 2020, Piercy 2018) and the main meta-analyses (Momma 2022, Shailendra 2022, Saeidifard 2019), have every check marked unknown. With zero of the 3 required sources verified, the claim stays a draft, however plausible it is. Even the researcher's own description of the evidence would narrow the claim. It shows null or borderline results for cancer and cardiovascular mortality (Saeidifard 2019; Nascimento 2021 high vs low HR 0.87, 0.73-1.02), J- or U-shaped dose curves, no hard-outcome trials and heavy overlap between the meta-analyses.

**What would change the status.** 1) Verification has to run before anything else. At least 3 sources must pass every check (identifier, metadata, peer review, not retracted, strong design, finding supported) with the direction 'supports'. Re-check the most likely ones first: Bull 2020 (WHO) and Piercy 2018 (US PAG) for the 2-days-a-week recommendation, then Momma 2022, Shailendra 2022 and Saeidifard 2019 for the mortality link. Confirm the Shailendra PMID (35599175 vs 36528354) and look for retraction or correction notices on all of them. 2) Even if these pass, the statement probably needs narrowing. On the reported findings, the evidence is strongest for the guideline recommendation and for lower all-cause mortality. It is weak or null for total cancer mortality (Nascimento high vs low; Saeidifard) and borderline for cardiovascular mortality, so 'chronic disease' should not be stated without qualification. 3) The meta-analyses probably pool many of the same cohorts, and the guidelines draw on the same evidence base. A check of study-by-study overlap is needed before treating them as independent. 4) The pooled dose-response data is in minutes per week, not days per week. Direct evidence that 2 or more days beats 1 day exists only for total cancer mortality (Nascimento, HR 0.81), so the 2-day threshold rests on guideline consensus. 5) All hard-outcome evidence is observational and self-reported. Randomised trials, or well-controlled cohorts with device-measured activity, would be needed to support any causal framing. 6) The dose ceiling is uncertain: the reported peak is 30-60 min/week in Momma and about 60 min/week in Shailendra, against a plateau above 120 min/week in Zhang 2026. This needs resolving before the app sets any volume figure.

## Planned lighter weeks
<a id="training-deload-periods"></a>

`training.deload_periods` · **Not enough evidence yet**

**Claim being tested.** Not established: there is no verified evidence that planned deload weeks improve strength or muscle gains compared with continuous resistance training.

**Who it applies to.** Healthy adults doing resistance training. The trials, none of them verified yet, mostly studied untrained or detrained young adults. Only one studied resistance-trained adults (39 people). There are no data for older adults or competitive athletes, and none beyond 6 months.

**What the app does with it.** Would let us suggest planned lighter (deload) weeks. Until then, we never add them.

**Why this status.** Draft: no source passed verification. The web search budget ran out before any identifier, metadata, retraction or design check could run, so 0 sources count against the 3 required. Even taken at face value, none of the reported trials shows a benefit, so the draft claim that deloads "improve" gains would fail anyway. The direct trials are Coleman 2024 and Pancar 2026. The break-versus-continuous trials are Ogasawara 2011 and 2013, Gentil 2015 and Halonen 2024. All report similar overall gains, and Coleman 2024 reports somewhat smaller lower-body strength gains after a full week off. The researcher's narrower "little or no cost, no benefit" statement cannot be activated until at least three of these trials pass verification. Coleman 2024's direction label is also inconsistent: it is labelled as contradicting, but its finding supports the narrower statement, so it needs rechecking.

### Context

- **Coleman et al., 2024.** Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations. *PeerJ* PeerJ. 2024;12:e16777. Published 22 January 2024. PMID [38274324](https://pubmed.ncbi.nlm.nih.gov/38274324/) · PMCID PMC10809978 · DOI [10.7717/peerj.16777](https://doi.org/10.7717/peerj.16777)
  - Design: Randomized controlled trial, two parallel groups (1 RCT; 39 participants (29 men, 10 women)).
  - What it found: In 39 resistance-trained adults, stopping all training for one week midway through a 9-week programme gave similar gains in thigh muscle size, muscular endurance and power to training straight through. Lower-body strength gains were somewhat larger with continuous training.
  - Limitations: It tested a full week off rather than the reduced-volume week most lifters use, in a small sample over 9 weeks, and its identifiers, design and findings have not yet been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Pancar et al., 2026.** Effects of deload periods in resistance training on muscle hypertrophy and strength endurance in untrained young men using a randomized within subject design. *Scientific Reports* Sci Rep. 2026;16:10299. PMCID PMC13031491 · DOI [10.1038/s41598-026-40612-5](https://doi.org/10.1038/s41598-026-40612-5)
  - Design: Randomized within-subject controlled trial (limbs randomly allocated to continuous or deload condition) (1 trial; 19 participants).
  - What it found: In 19 untrained young men who trained one limb each way, cutting to 2 sets per exercise once a week in weeks 4 and 8 of an 8-week programme gave the same gains in muscle thickness and 10-rep max as continuous training (leg 10-rep max +17.6 kg vs +16.8 kg).
  - Limitations: It is a small study in untrained men, and its limb-versus-limb design can blur differences between conditions. The published paper could not be located (only the trial registration was found), so none of its details are verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Halonen et al., 2024.** Does Taking a Break Matter—Adaptations in Muscle Strength and Size Between Continuous and Periodic Resistance Training. *Scandinavian Journal of Medicine & Science in Sports* Scand J Med Sci Sports. 2024;34(10):e14739. PMID [39364857](https://pubmed.ncbi.nlm.nih.gov/39364857/) · DOI [10.1111/sms.14739](https://doi.org/10.1111/sms.14739)
  - Design: Randomized controlled trial (1 RCT; 55 randomized (20 periodic and 22 continuous completed)).
  - What it found: In 55 untrained adults, a 10-week break between two 10-week training blocks caused losses in strength and muscle size that were quickly regained, and overall gains ended up similar to continuous training.
  - Limitations: It tested a long break in untrained people rather than a short deload week, and it has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Ogasawara et al., 2013.** Comparison of muscle hypertrophy following 6-month of continuous and periodic strength training. *European Journal of Applied Physiology* Eur J Appl Physiol. 2013;113(4):975-985. Epub 6 October 2012. PMID [23053130](https://pubmed.ncbi.nlm.nih.gov/23053130/) · DOI [10.1007/s00421-012-2511-9](https://doi.org/10.1007/s00421-012-2511-9)
  - Design: Randomized controlled trial (1 RCT; 14 participants).
  - What it found: In 14 untrained men over 24 weeks, three 3-week breaks gave similar overall gains in muscle size and strength to continuous training. Gains slowed in the continuous group over time, while the break group picked up again after each break.
  - Limitations: It is a very small study of untrained men that used 3-week breaks rather than deload weeks, and it has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Ogasawara et al., 2011.** Effects of periodic and continued resistance training on muscle CSA and strength in previously untrained men. *Clinical Physiology and Functional Imaging* Clin Physiol Funct Imaging. 2011;31(5):399-404. PMID [21771261](https://pubmed.ncbi.nlm.nih.gov/21771261/) · DOI [10.1111/j.1475-097X.2011.01031.x](https://doi.org/10.1111/j.1475-097X.2011.01031.x)
  - Design: Controlled trial with two parallel groups (abstract text seen says participants were 'divided into' groups; randomization not confirmed) (1 trial; 15 participants).
  - What it found: In 15 untrained men, a 3-week break after 6 weeks of training caused no significant loss of muscle size or one-rep max strength, and gains at 15 weeks were similar to continuous training.
  - Limitations: It is very small, may not have been randomised, used a 3-week break rather than a deload week, and has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Gentil et al., 2015.** Effects of Periodic and Continuous Resistance Training on Muscle Strength in Detrained Women. *Perceptual and Motor Skills* Percept Mot Skills. 2015; pp. 810-821. PMID [26595206](https://pubmed.ncbi.nlm.nih.gov/26595206/) · DOI [10.2466/29.30.PMS.121c23x3](https://doi.org/10.2466/29.30.PMS.121c23x3)
  - Design: Randomized controlled trial (1 RCT; 60 participants).
  - What it found: In 60 detrained women, each given 20 sessions, a 2-week break midway through 10 weeks of training gave similar knee and elbow strength gains to training without a break.
  - Limitations: It measured only strength, in women returning to training, used a 2-week break rather than a deload week, and its citation details have not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Bosquet et al., 2013.** Effect of training cessation on muscular performance: a meta-analysis. *Scandinavian Journal of Medicine & Science in Sports* Scand J Med Sci Sports. 2013;23(3):e140-e149. PMID [23347054](https://pubmed.ncbi.nlm.nih.gov/23347054/) · DOI [10.1111/sms.12047](https://doi.org/10.1111/sms.12047)
  - Design: Systematic review with meta-analysis (103 studies included (of 284 screened); participant total not seen).
  - What it found: A meta-analysis of 103 studies found that stopping resistance training reduces strength and power (maximal force SMD -0.46), with larger losses the longer the stop.
  - Limitations: It looked at stopping training, not planned deloads, so it only hints at the cost of a full week off, and it has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Bell et al., 2023.** Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach. *Sports Medicine - Open* Sports Med Open. 2023;9:87. PMID [37730925](https://pubmed.ncbi.nlm.nih.gov/37730925/) · PMCID PMC10511399 · DOI [10.1186/s40798-023-00633-0](https://doi.org/10.1186/s40798-023-00633-0)
  - Design: Delphi expert consensus (3 rounds) (34 coaches in round 1, 29 in round 2, 21 in round 3; 138 statements in 4 domains).
  - What it found: An international expert panel agreed that deloading is widely used but under-researched. It defined a deload as a period of reduced training stress to manage fatigue and aid recovery.
  - Limitations: It is expert opinion with no data on whether deloads change strength or muscle gains, and it has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Rogerson et al., 2024.** Deloading Practices in Strength and Physique Sports: A Cross-sectional Survey. *Sports Medicine - Open* Sports Med Open. 2024;10:26. PMID [38499934](https://pubmed.ncbi.nlm.nih.gov/38499934/) · PMCID PMC10948666 · DOI [10.1186/s40798-024-00691-y](https://doi.org/10.1186/s40798-024-00691-y)
  - Design: Cross-sectional survey (55-item web survey) (246 athletes).
  - What it found: In a survey of 246 strength and physique athletes, all reported deloading, typically for about 6 days every 5 to 6 weeks, mainly by cutting training volume and load.
  - Limitations: It describes what athletes do, not whether deloads work, and it has not been verified.
  - Checks: identifier resolves to this paper: unknown; title, authors, journal and year match: unknown; strong study design: unknown; peer-reviewed and indexed: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.

**What would change the status.** Before any deload statement can become active, at least three trials must pass every check: PMID or DOI, metadata, peer review, retraction status, randomised design, and that the reported findings match the paper. The best candidates are Coleman 2024 (PMID 38274324 / PMC10809978), Pancar 2026 (a published record must first be found), Halonen 2024, Ogasawara 2013 and Gentil 2015. Ogasawara 2011 also needs its randomisation confirmed. Supporting the original claim that deloads improve gains would take something much stronger: randomised trials in resistance-trained lifters showing that roughly one-week reduced-volume deloads produce larger strength or muscle gains than continuous training, ideally pooled in a systematic review. Those trials would also need follow-up beyond 6 months and outcomes such as injury, overreaching and adherence. Registered trials NCT06825052 and NCT06573086 (TraDeRe2024) may help fill this gap.

## Adding cardio to strength training
<a id="training-concurrent-aerobic-compatible"></a>

`training.concurrent_aerobic_compatible` · **Not enough evidence yet**

**Claim being tested.** Adding aerobic training to resistance training does not meaningfully reduce muscle growth or maximal strength, though it may blunt explosive strength.

**What the app does with it.** Would let us add runs without cutting your lifting.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Limiting weekly running increases
<a id="endurance-weekly-distance-progression"></a>

`endurance.weekly_distance_progression` · **Not enough evidence yet**

**Claim being tested.** A gradual weekly distance progression (for example no more than 10% a week) reduces running injuries.

**What the app does with it.** Would let us limit how fast your weekly running distance rises. Until then, we don't plan your running.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Lifting less on low-HRV days
<a id="recovery-hrv-guided-lifting-volume"></a>

`recovery.hrv_guided_lifting_volume` · **Not enough evidence yet**

**Claim being tested.** Lowering lifting volume on days of low HRV improves results.

**What the app does with it.** Would let a low readiness reduce today's lifting. Until then, readiness never changes your plan; we show it so you can decide.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## HRV-guided endurance training
<a id="recovery-hrv-guided-endurance-training"></a>

`recovery.hrv_guided_endurance_training` · **Not enough evidence yet**

**Claim being tested.** Adjusting endurance training day to day based on HRV gives similar or slightly better fitness and performance gains than a fixed plan.

**What the app does with it.** Would let us swap a hard run for an easy one on a low-HRV day. Until then, readiness never changes your plan.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Short sleep and next-day performance
<a id="recovery-sleep-loss-impairs-performance"></a>

`recovery.sleep_loss_impairs_performance` · **Not enough evidence yet**

**Claim being tested.** Acute sleep loss (a night of restricted or no sleep) reduces next-day physical performance on average.

**What the app does with it.** Would explain how short sleep affects a session.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## How accurate wearables are
<a id="wearables-measurement-validity"></a>

`wearables.measurement_validity` · **Not enough evidence yet**

**Claim being tested.** Consumer wearables estimate night-time heart rate and HRV with reasonable agreement against ECG, but sleep staging is less accurate; HRV metrics from different devices (RMSSD versus SDNN) are not interchangeable.

**What the app does with it.** Would explain how far to trust each device's numbers.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Free sugars
<a id="nutrition-free-sugars-and-health"></a>

`nutrition.free_sugars_and_health` · **Enough verified evidence**

**Claim.** Higher free sugar intake is linked to worse health, though most evidence beyond weight and tooth decay is observational and low quality. In adults on unrestricted diets, cutting free sugars lowers weight only slightly (about 0.8 kg on average, through eating fewer calories overall), and keeping free sugars below 10% of daily energy is linked to less tooth decay (moderate-quality evidence).

**Who it applies to.** Weight effect: adults on unrestricted (ad libitum) diets. Trials in children showed no overall weight change. Tooth decay (caries) link: children and adults. The wider links to disease come mostly from observational studies in general populations.

**What the app does with it.** Explains the sugar line in food ratings.

**Why this status.** Active, but narrowed. Four counted sources agree in direction. Te Morenga 2013 found about 0.8 kg less weight in adults on unrestricted diets, explained by lower calorie intake, with no overall effect in children. Moynihan & Kelly 2014 and its update Moores 2022 found moderate-quality evidence of less tooth decay below 10% of energy. The Huang 2023 umbrella review found mostly harmful associations, largely from low-quality observational data. The support is less independent than the count of four suggests: Moores updates Moynihan with overlapping data, Huang pools earlier meta-analyses, and the weight figure rests on one meta-analysis. So the statement stays modest and leaves out the WHO recommendation (not a peer-reviewed journal source) and the 5% target (low or very-low-quality evidence). Erickson 2017 (industry-funded) and Yan 2022 (a narrative review) question how strong the guideline evidence is, but they do not reverse the direction of effect, so they do not outweigh the counted sources.

### Supporting studies

- **Te Morenga et al., 2013.** Dietary sugars and body weight: systematic review and meta-analyses of randomised controlled trials and cohort studies. *BMJ* BMJ. 2013;346:e7492 (PubMed lists e-publication 2012 Jan 15). PMID [23321486](https://pubmed.ncbi.nlm.nih.gov/23321486/) · DOI [10.1136/bmj.e7492](https://doi.org/10.1136/bmj.e7492)
  - Design: Systematic review and meta-analyses of randomised controlled trials and prospective cohort studies in free-living adults and children (Te Morenga, Mallard, Mann; BMJ 2013;346:e7492, PMID 23321486; PubMed lists the date as 2012 Jan 15). My searches did not show the counts of 30 RCTs and 38 cohort studies (30 RCTs (of 7,895 trials screened) and 38 cohort studies (of 9,445 screened); a secondary DARE-based summary reports about 4,960 trial participants).
  - What it found: Pooling randomised trials and cohort studies, it found that adults on unrestricted diets who cut sugars lost about 0.8 kg on average (95% CI 0.39 to 1.21 kg), and those who added sugars gained about 0.75 kg. Swapping sugars for other carbohydrates at the same calories made no difference (0.04 kg), so the effect seems to come from eating fewer calories, and trials in children showed no overall weight change.
  - Limitations: Most trials were short (around 10 weeks) and unblinded, publication bias was detected, and the adult weight figure comes from this single meta-analysis.
  - Checks: all six passed, 2026-10-14.
- **Moynihan and Kelly, 2014.** Effect on caries of restricting sugars intake: systematic review to inform WHO guidelines. *Journal of Dental Research* J Dent Res. 2014;93(1):8-18. PMID [24323509](https://pubmed.ncbi.nlm.nih.gov/24323509/) · PMCID PMC3872848 · DOI [10.1177/0022034513508954](https://doi.org/10.1177/0022034513508954)
  - Design: Systematic review commissioned to inform WHO guidelines, following PRISMA with GRADE assessment. Of 5,990 papers, 55 studies were eligible: 3 intervention, 8 cohort, 20 population and 24 cross-sectional (the DARE summary gives 21 population and 23 cross-sectional). Variability in the data limited meta-analysis. Per DARE, GRADE was applied to the cohort studies only. Moynihan PJ, Kelly SA. J Dent Res 2014;93(1):8-18, PMID 24323509, PMC3872848 (Number of included studies and participants not seen in search results).
  - What it found: This review of 55 studies, commissioned to inform WHO guidelines, found moderate-quality evidence that tooth decay is lower when free sugars are below 10% of energy. At least one link between sugar and decay appeared in 42 of 50 child studies and all 5 adult studies, while evidence for a further benefit below 5% was rated very low quality.
  - Limitations: Most included studies were observational and too varied to pool, so it shows an association rather than proof that cutting sugar prevents decay.
  - Checks: all six passed, 2026-10-14.
- **Moores et al., 2022.** Systematic Review of the Effect on Caries of Sugars Intake: Ten-Year Update. *Journal of Dental Research* J Dent Res. 2022;101(9):1034-1045. DOI [10.1177/00220345221082918](https://doi.org/10.1177/00220345221082918)
  - Design: Systematic review, a ten-year update covering studies from about 2011 to 2020, with GRADE profiles of new and original cohort data. Moores CJ, Kelly SAM, Moynihan PJ. J Dent Res 2022;101(9):1034-1045, DOI 10.1177/00220345221082918. I did not see a PMID or the number of included studies (Number of included studies and participants not seen in search results).
  - What it found: This 10-year update (studies from about 2011 to 2020) again found moderate-quality evidence for less tooth decay when sugars are below 10% of energy. New cohort data upgraded the evidence for below 5% from very low to low quality.
  - Limitations: It comes from the same research group and reuses cohort data from the 2014 review, so it is not independent confirmation.
  - Checks: all six passed, 2026-10-14.
- **Huang et al., 2023.** Dietary sugar consumption and health: umbrella review. *BMJ* BMJ. 2023 Apr 5;381:e071609. doi: 10.1136/bmj-2022-071609. PMID [37019448](https://pubmed.ncbi.nlm.nih.gov/37019448/) · PMCID PMC10074550 · DOI [10.1136/bmj-2022-071609](https://doi.org/10.1136/bmj-2022-071609)
  - Design: Umbrella review of 73 meta-analyses of observational studies and RCTs, covering 83 health outcomes from 8,601 unique articles (Huang Y et al., BMJ 2023, published 5 April 2023, doi 10.1136/bmj-2022-071609, PMID 37019448, PMC10074550) (73 meta-analyses covering 83 health outcomes, drawn from 8,601 unique articles (74 outcomes from observational meta-analyses, 9 from RCT meta-analyses)).
  - What it found: This umbrella review of 73 meta-analyses covering 83 health outcomes found 45 significant harmful links between dietary sugar and disease, mostly cardiometabolic, and 4 beneficial ones. The authors concluded that high sugar intake is generally more harmful than beneficial and suggested keeping free or added sugars under 25 g a day.
  - Limitations: Most of the evidence it pools is observational and low quality, it overlaps with earlier reviews, and the 25 g limit is the authors' suggestion rather than a tested threshold.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Erickson et al., 2017.** The Scientific Basis of Guideline Recommendations on Sugar Intake: A Systematic Review. *Annals of Internal Medicine* Ann Intern Med. 2017;166(4):257-267. PMID [27992898](https://pubmed.ncbi.nlm.nih.gov/27992898/) · DOI [10.7326/M16-2020](https://doi.org/10.7326/M16-2020)
  - Design: Systematic review of dietary guidelines on sugar intake. MEDLINE, EMBASE, Web of Science, guideline registries and grey literature were searched for English-language guidelines from 1995 to 2016. 9 guidelines with 12 recommendations were included. Guideline quality was rated with AGREE II by three independent reviewers, and evidence quality with GRADE. Erickson J et al. Ann Intern Med 2017;166(4):257-267, PMID 27992898, DOI 10.7326/M16-2020 (Number of guidelines not seen in search results).
  - What it found: This review of 9 sugar guidelines (12 recommendations, 1995 to 2016) found that they scored poorly on standard quality criteria and rested on low to very-low quality evidence. It concluded that they do not meet criteria for trustworthy recommendations.
  - Limitations: It judges how the guidelines were made rather than testing whether sugar harms health, it was funded by an industry body (ILSI North America), and an accompanying editorial disputed its methods.
  - Checks: the abstract supports the stated finding: unknown.
- **Yan et al., 2022.** Current WHO recommendation to reduce free sugar intake from all sources to below 10% of daily energy intake for supporting overall health is not well supported by available evidence. *American Journal of Clinical Nutrition* Am J Clin Nutr. 2022 Jul 6;116(1):15-39. doi: 10.1093/ajcn/nqac084. PMID [35380611](https://pubmed.ncbi.nlm.nih.gov/35380611/) · PMCID PMC9307988 · DOI [10.1093/ajcn/nqac084](https://doi.org/10.1093/ajcn/nqac084)
  - Design: Narrative review (Yan RR, Chan CB, Louie JCY. Am J Clin Nutr 2022, DOI 10.1093/ajcn/nqac084, PMC9307988). This is not a strong design.
  - What it found: This review argues that the 10% limit is poorly supported for overall health. In its account, the evidence linking sugar to obesity comes mostly from sugary drinks, and studies of sugar in solid foods mostly found no effect.
  - Limitations: It is a narrative rather than a systematic review, a correction was later published, and other researchers said it misrepresented their work.
  - Checks: strong study design: fail; the abstract supports the stated finding: fail.

### Context

- **Malik et al., 2013.** Sugar-sweetened beverages and weight gain in children and adults: a systematic review and meta-analysis. *American Journal of Clinical Nutrition* Am J Clin Nutr. 2013 Oct;98(4):1084-102. doi: 10.3945/ajcn.113.058362. Epub 2013 Aug 21. PMID [23966427](https://pubmed.ncbi.nlm.nih.gov/23966427/) · DOI [10.3945/ajcn.113.058362](https://doi.org/10.3945/ajcn.113.058362)
  - Design: Systematic review and meta-analysis of prospective cohort studies and RCTs on SSB intake and weight (PubMed, EMBASE and Cochrane searched through March 2013). Malik VS, Pan A, Willett WC, Hu FB. Am J Clin Nutr 2013;98(4):1084-102, doi 10.3945/ajcn.113.058362. I did not see the number of included studies.
  - What it found: This meta-analysis of cohort studies and trials concluded that sugar-sweetened drinks promote weight gain in children and adults. In child trials, cutting these drinks slowed the gain in BMI.
  - Limitations: It covers sugary drinks only, not free sugars in general, and our checks did not confirm its pooled effect sizes.
  - Checks: the abstract supports the stated finding: fail.
- **World Health Organization, 2015.** Guideline: Sugars intake for adults and children. *World Health Organization guideline (NCBI Bookshelf); not a peer-reviewed journal article* Geneva: WHO; 2015. 
  - Design: WHO guideline using GRADE (Guideline: Sugars intake for adults and children, WHO, Geneva 2015; indexed in PubMed as PMID 25905159 and on NCBI Bookshelf). It is not published in a peer-reviewed journal (Based on the WHO-commissioned systematic reviews (including Te Morenga 2013 and Moynihan & Kelly 2014)).
  - What it found: The WHO strongly recommends keeping free sugars below 10% of total energy for adults and children and conditionally suggests going below 5%. The recommendations rest mainly on evidence about weight gain and tooth decay.
  - Limitations: It is a guideline, not a peer-reviewed journal article, so it explains the official advice but does not count as independent evidence for the claim.
  - Checks: identifier resolves to this paper: unknown; strong study design: fail; peer-reviewed and indexed: fail; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.

**What would change the status.** The active status rests on few independent bodies of evidence: one trial meta-analysis for weight (Te Morenga 2013) and, for tooth decay, one review plus its own non-independent update (Moynihan 2014, Moores 2022). Huang 2023 largely re-pools earlier work. The following would strengthen or test the claim:
(1) A recent independent or Cochrane meta-analysis of randomised trials on free sugars and body weight, ideally separating sugars in drinks from sugars in solid food. This would test Yan 2022's argument directly.
(2) An independent caries review, or causal evidence. The Mendelian randomisation study (PMID 41430990) found no strong evidence that genetically predicted sugar intake causes caries. Its journal and year need confirming and it should be properly assessed, because a robust null result would weaken the caries element.
(3) Missing details: Malik 2013's pooled effect sizes and Moores 2022's PMID. A dedicated Retraction Watch check was not run for each paper, although title searches found no retraction notices.
What would change the claim:
- Adding the WHO under-10% recommendation to the statement would need a peer-reviewed source that states it.
- Presenting the under-5% target as evidence-backed would need moderate-quality or better evidence.
- The status should return to draft if an independent high-quality review or strong causal evidence found no weight or caries benefit from keeping free sugars below 10% of energy.

## Salt and blood pressure
<a id="nutrition-sodium-reduction-blood-pressure"></a>

`nutrition.sodium_reduction_blood_pressure` · **Enough verified evidence**

**Claim.** Eating less salt lowers blood pressure on average in adults. In pooled randomised trials, systolic pressure fell by about 3 to 4 mm Hg.

**Who it applies to.** Adults in randomised trials, mostly in high-income countries, including people with and without high blood pressure. The statement does not give a separate effect for people with normal blood pressure. It has not been verified for children or for people with chronic kidney disease.

**What the app does with it.** Explains the salt line in food ratings.

**Why this status.** Three verified BMJ meta-analyses of randomised trials (He 2013, Huang 2020 and Aburto 2013) agree that eating less salt lowers blood pressure in adults. Their pooled systolic falls are about 3.4 to 4.3 mm Hg, so this narrowed statement is active for explanatory use. Only two counted reviews (He 2013 and Huang 2020) back the researcher's split by blood pressure status and the dose-response finding. Aburto 2013 did not confirm the split, and the older Midgley 1996 analysis found only about 1.0/0.1 mm Hg per 100 mmol in trials of people with normal blood pressure, so the claim and its size for people without high blood pressure stay out of the active statement. The three reviews pool overlapping trials and results vary a lot between trials (I² up to 75%). No evidence against lower blood pressure was seen, but the Graudal Cochrane review, the main source arguing the effect is small, was not checked.

### Supporting studies

- **He et al., 2013.** Effect of longer term modest salt reduction on blood pressure: Cochrane systematic review and meta-analysis of randomised trials. *BMJ* BMJ. 2013 Apr 3;346:f1325. (Also published as Cochrane Database Syst Rev 2013, Issue 4, Art. No. CD004937, doi 10.1002/14651858.CD004937.pub2). PMID [23558162](https://pubmed.ncbi.nlm.nih.gov/23558162/) · DOI [10.1136/bmj.f1325](https://doi.org/10.1136/bmj.f1325)
  - Design: Cochrane systematic review and meta-analysis of randomised trials of modest salt reduction lasting 4 or more weeks (BMJ 2013;346:f1325, PMID 23558162; also Cochrane CD004937.pub2). The trial count and participant total (34 trials, 3230 participants per the researcher) did not appear in my search results (34 trials, 3230 participants).
  - What it found: In trials lasting at least four weeks, eating about 4.4 g less salt a day lowered systolic blood pressure by about 4.2 mm Hg and diastolic by about 2.1 mm Hg. The fall was larger in people with high blood pressure (about 5.4 mm Hg systolic) than in those with normal blood pressure (about 2.4 mm Hg).
  - Limitations: Results varied a lot between trials (I² 75%), and many of its trials are also in the other reviews, so it is not fully independent evidence.
  - Checks: all six passed, 2026-10-14.
- **Huang et al., 2020.** Effect of dose and duration of reduction in dietary sodium on blood pressure levels: systematic review and meta-analysis of randomised trials. *BMJ* BMJ. 2020;368:m315. doi:10.1136/bmj.m315. PMCID PMC7190039 · DOI [10.1136/bmj.m315](https://doi.org/10.1136/bmj.m315)
  - Design: Systematic review and dose-response meta-analysis of randomised trials of reduced vs usual dietary sodium (BMJ 2020;368:m315, doi 10.1136/bmj.m315, PMC7190039). A citing protocol paper (PMC8724716) describes it as 133 randomised trials with 12,197 participants. I did not see those totals in the abstract itself (Number of trials and participants not seen in search results).
  - What it found: Each 50 mmol a day less sodium (about 2.9 g of salt) went with about 1.1 mm Hg lower systolic blood pressure, in people with and without high blood pressure. The fall was larger in older people, non-white people and people who started with higher blood pressure, and short trials underestimated the effect.
  - Limitations: It includes very short trials and shares many trials with He 2013, and its trial and participant totals were confirmed only from a paper that cites it.
  - Checks: all six passed, 2026-10-14.
- **Aburto et al., 2013.** Effect of lower sodium intake on health: systematic review and meta-analyses. *BMJ* BMJ. 2013 Apr 3;346:f1326. PMID [23558163](https://pubmed.ncbi.nlm.nih.gov/23558163/) · DOI [10.1136/bmj.f1326](https://doi.org/10.1136/bmj.f1326)
  - Design: Systematic review and meta-analyses of randomised controlled trials and prospective cohort studies in non-acutely ill adults and children (outcomes: BP, renal function, blood lipids, catecholamines; mortality and cardiovascular outcomes in adults). BMJ 2013;346:f1326, PMID 23558163. Trial and participant counts were not seen (37 RCTs in adults for BP, renal function, blood lipids and catecholamines; participant total not seen).
  - What it found: In adults, eating less sodium lowered systolic blood pressure by about 3.4 mm Hg and diastolic by about 1.5 mm Hg, and going below 2 g of sodium a day lowered systolic pressure by about 3.5 mm Hg. It found no significant harm to blood fats.
  - Limitations: The split between people with and without high blood pressure was not confirmed from this review, and its main figure was seen in a UK government report that cites it rather than in the abstract itself.
  - Checks: all six passed, 2026-10-14.

### Context

- **Midgley et al., 1996.** Effect of reduced dietary sodium on blood pressure: a meta-analysis of randomized controlled trials. *JAMA* JAMA. 1996 May;275(20):1590-7. doi:10.1001/jama.1996.03530440070039. PMID [8622251](https://pubmed.ncbi.nlm.nih.gov/8622251/) · DOI [10.1001/jama.1996.03530440070039](https://doi.org/10.1001/jama.1996.03530440070039)
  - Design: Meta-analysis of 56 randomised controlled trials (28 trials, 1131 hypertensive subjects; 28 trials, 2374 normotensive subjects) with timed urinary sodium monitoring. Midgley JP, Matthew AG, Greenwood CM, Logan AG. JAMA 1996;275(20):1590-7, PMID 8622251.
  - What it found: An older pooled analysis of 56 trials found that 100 mmol a day less sodium (about 6 g of salt) lowered blood pressure by about 3.7/0.9 mm Hg in people with high blood pressure, but only about 1.0/0.1 mm Hg in people with normal blood pressure.
  - Limitations: It dates from 1996, includes short trials and showed signs of publication bias, and the statistical significance of the normal-blood-pressure result was not seen.
  - Checks: the abstract supports the stated finding: unknown.

**What would change the status.** 1. To say the effect holds for people with normal blood pressure, and to give separate sizes for people with and without high blood pressure, the app needs a third verified source with results for people with normal blood pressure. Candidates are the Graudal Cochrane review (low- vs high-sodium diet), Filippini 2021 (Circulation, dose-response) and the DASH-Sodium trial (Sacks 2001, NEJM). The Graudal review must be checked either way, because it is the strongest likely mixed or contradicting source.
2. The dose-response figure (about 1.1 mm Hg per 50 mmol) and the claim that longer trials show bigger effects each need a third verified source, such as Filippini 2021 or Gupta 2023 (JAMA crossover trial).
3. Children, people with chronic kidney disease and populations in low- and middle-income countries are not covered. The children's meta-analysis (IJE 2018) was dropped as unverified.
4. Effects on heart attack, stroke or death, including the J-curve debate about very low sodium, were not assessed. Any app claim about these needs separate evidence.
5. A numeric salt target needs peer-reviewed support. The WHO under 5 g salt a day target was seen only on a web page that is not peer-reviewed, and He 2013's 3 g target was not verified.
6. Mizuta 2025 (Hypertension Research) needs its identifier, metadata and retraction status verified.
7. Huang 2020's PMID, Aburto 2013's PMCID and participant counts, and some confidence intervals were not confirmed.
8. Dedicated retraction searches were limited.
9. The three counted reviews pool overlapping trials, so a fully independent confirmation, such as a large well-run trial, would strengthen the claim.

## Ultra-processed food
<a id="nutrition-ultra-processed-food-associations"></a>

`nutrition.ultra_processed_food_associations` · **Enough verified evidence**

**Claim.** In meta-analyses of observational studies in adults, diets higher in ultra-processed foods (NOVA group 4) are associated with higher risk of several adverse outcomes. These include cardiovascular disease and death, death from any cause, type 2 diabetes, overweight and obesity, and depression or other common mental disorders. Certainty is mostly rated low or very low (one review rates type 2 diabetes as moderate). These studies show association, not cause, and they describe whole diets, not individual foods. Trial evidence is sparse and short-term. In one inpatient trial (20 adults, 2 weeks per diet), people ate about 500 kcal/day more on an ultra-processed diet than on an unprocessed diet matched for presented nutrients. In an 8-week trial in 55 adults, both diets followed healthy-eating guidance; weight fell on both, but less on the ultra-processed diet.

**Who it applies to.** Adults in the prospective observational cohorts pooled by the meta-analyses. Ultra-processed food intake was classified with NOVA from reported diet. The Mendoza 2024 cohorts are US health professionals, and the reviews pool many of the same cohorts. Trial findings come from 20 weight-stable US adults on an inpatient ward (Hall 2019) and from 55 adults in England with BMI 25 to under 40 and high habitual ultra-processed food intake (Dicken 2025). Not established for children, pregnancy, individual foods or subgroups of ultra-processed foods.

**What the app does with it.** Explains the processing line in food ratings. We describe processing; we never judge a food.

**Why this status.** The status is active, for explanatory use only. Four counted observational syntheses agree that higher ultra-processed food intake is linked to worse outcomes: Lane 2024, Dai 2024, Pagliai 2021 and Mendoza 2024. Hall 2019 and Dicken 2025 support the trial description. However, the reviews pool overlapping cohorts, most certainty ratings are low or very low, and none can show cause. Aramburu 2024 found only 4 small, short randomised trials, with no significant effect for 30 of 42 outcomes. Dicken 2025 found that LDL cholesterol fell more on the ultra-processed diet. The 2025 US Dietary Guidelines Advisory Committee review is not counted because it failed verification; it rated the evidence in children as only 'limited'. The statement therefore stays associative and says nothing about individual foods.

### Supporting studies

- **Lane et al., 2024.** Ultra-processed food exposure and adverse health outcomes: umbrella review of epidemiological meta-analyses. *BMJ* BMJ. 2024;384:e077310. PMID [38418082](https://pubmed.ncbi.nlm.nih.gov/38418082/) · PMCID PMC10899807 · DOI [10.1136/bmj-2023-077310](https://doi.org/10.1136/bmj-2023-077310)
  - Design: Umbrella review of epidemiological meta-analyses (mostly observational, largely prospective cohort data), with evidence-class grading (I-IV/V) plus GRADE; 45 unique pooled analyses (13 dose-response, 32 non-dose-response), n=9,888,373. BMJ 2024;384:e077310, PMID 38418082 (14 meta-analyses, 45 unique pooled analyses (13 dose-response, 32 non-dose-response); n = 9,888,373).
  - What it found: This umbrella review pooled 45 analyses covering about 9.9 million people. Higher ultra-processed food intake was linked to higher risk of cardiovascular death (RR 1.50, very low certainty), type 2 diabetes (RR 1.12 in dose-response analysis, moderate certainty) and anxiety. Evidence was weaker for death from any cause (RR 1.21, low certainty), depression and obesity.
  - Limitations: It rests on observational studies with mostly self-reported diet and overlapping cohorts, so it shows association, not cause, and most outcomes were rated low or very low certainty.
  - Checks: all six passed, 2026-10-14.
- **Dai et al., 2024.** Ultra-processed foods and human health: An umbrella review and updated meta-analyses of observational evidence. *Clinical Nutrition* Clin Nutr. 2024 Jun;43(6):1386-1394. PMID [38688162](https://pubmed.ncbi.nlm.nih.gov/38688162/) · DOI [10.1016/j.clnu.2024.04.016](https://doi.org/10.1016/j.clnu.2024.04.016)
  - Design: Umbrella review with updated meta-analyses of observational studies: 39 meta-analyses identified, updated with 122 individual articles covering 49 unique health outcomes; credibility classes I-IV plus GRADE. Clin Nutr 2024;43(6):1386-1394, PMID 38688162 (39 meta-analyses updated with 122 individual articles covering 49 unique health outcomes).
  - What it found: It updated 39 meta-analyses with 122 studies on 49 outcomes and found 25 outcomes linked to ultra-processed food intake. The strongest evidence was for decline in kidney function (OR 1.25) and childhood wheezing (OR 1.42). Diabetes, overweight, obesity, depression and common mental disorders had highly suggestive evidence.
  - Limitations: It is observational and draws on many of the same cohorts as other reviews; wheezing lost its top rating in sensitivity analyses, and certainty was low for several outcomes.
  - Checks: all six passed, 2026-10-14.
- **Pagliai et al., 2021.** Consumption of ultra-processed foods and health status: a systematic review and meta-analysis. *British Journal of Nutrition* Br J Nutr. 2021;125(3):308-318 (Epub 2020 Aug 14). PMID [32792031](https://pubmed.ncbi.nlm.nih.gov/32792031/) · PMCID PMC7844609 · DOI [10.1017/S0007114520002688](https://doi.org/10.1017/S0007114520002688)
  - Design: Systematic review and meta-analysis of observational studies: 23 studies (10 cross-sectional, 13 prospective cohort); cohorts included 183,491 participants followed 3.5-19 years. Br J Nutr 2021;125(3):308-318, PMID 32792031 (23 studies (10 cross-sectional, 13 prospective cohort); 19 in quantitative analysis; cohorts pooled 183,491 participants).
  - What it found: Across 23 studies, cross-sectional data linked the highest intake to more overweight/obesity (+39%), large waist size (+39%), low HDL cholesterol and metabolic syndrome. In cohorts, higher intake was linked to cerebrovascular disease (RR 1.34) and depression (RR 1.20). No significant link was found with high blood pressure, high blood sugar or high triglycerides.
  - Limitations: The obesity findings come only from cross-sectional studies, which cannot show which came first, and each cohort result rests on just two studies.
  - Checks: all six passed, 2026-10-14.
- **Mendoza et al., 2024.** Ultra-processed foods and cardiovascular disease: analysis of three large US prospective cohorts and a systematic review and meta-analysis of prospective cohort studies. *The Lancet Regional Health - Americas* Lancet Reg Health Am. 2024;37:100859. PMID [39286398](https://pubmed.ncbi.nlm.nih.gov/39286398/) · PMCID PMC11403639 · DOI [10.1016/j.lana.2024.100859](https://doi.org/10.1016/j.lana.2024.100859)
  - Design: Prospective cohort analysis of NHS (n=75,735), NHSII (n=90,813) and HPFS (n=40,409), plus a systematic review and random-effects meta-analysis of prospective cohort studies. Lancet Reg Health Am 2024;37:100859, PMID 39286398 (206,958 participants in the 3 US cohorts; meta-analysis reported (secondary sources) as 22 prospective studies, about 1.26 million participants, 63,666 CVD cases).
  - What it found: Three large US cohorts covered about 207,000 health professionals. People with the highest ultra-processed food intake had 17% higher risk of cardiovascular disease, 23% higher risk of coronary heart disease and 9% higher risk of stroke than those with the lowest. The authors rated the evidence from their meta-analysis as high for coronary heart disease, moderate for cardiovascular disease and low for stroke.
  - Limitations: The cohorts are US health professionals and also feed other reviews; results for different types of ultra-processed food were not verified.
  - Checks: all six passed, 2026-10-14.
- **Hall et al., 2019.** Ultra-Processed Diets Cause Excess Calorie Intake and Weight Gain: An Inpatient Randomized Controlled Trial of Ad Libitum Food Intake. *Cell Metabolism* Cell Metab. 2019 Jul 2;30(1):67-77.e3 (Epub 2019 May 16). PMID [31105044](https://pubmed.ncbi.nlm.nih.gov/31105044/) · PMCID PMC7946062 · DOI [10.1016/j.cmet.2019.05.008](https://doi.org/10.1016/j.cmet.2019.05.008)
  - Design: Inpatient randomised crossover controlled feeding trial, ad libitum intake, n=20 weight-stable adults (mean age 31.2, mean BMI 27), 14 days on each diet at the NIH Clinical Center (NCT03407053). Cell Metab 2019;30(1):67-77.e3, PMID 31105044 (20 participants; 2 weeks on each diet).
  - What it found: Twenty weight-stable adults lived on a research ward and ate as much as they wanted. They ate about 508 kcal/day more on an ultra-processed diet than on an unprocessed diet matched for presented calories, sugar, fat, sodium and fibre. Over 2 weeks per diet, they gained 0.9 kg on the ultra-processed diet and lost 0.9 kg on the unprocessed one.
  - Limitations: The trial was small, short and run in a controlled inpatient setting, so it cannot show long-term health effects or which features of processing cause the extra eating.
  - Checks: all six passed, 2026-10-14.
- **Dicken et al., 2025.** Ultraprocessed or minimally processed diets following healthy dietary guidelines on weight and cardiometabolic health: a randomized, crossover trial. *Nature Medicine* Nat Med. 2025;31(10):3297-3308 (Epub 2025 Aug 4). PMID [40760353](https://pubmed.ncbi.nlm.nih.gov/40760353/) · PMCID PMC12532614 · DOI [10.1038/s41591-025-03842-0](https://doi.org/10.1038/s41591-025-03842-0)
  - Design: Randomised 2x2 crossover controlled feeding trial, free-living, ad libitum, all food provided; two 8-week diets (both following the UK Eatwell Guide) with a 4-week washout; n=55 adults in England with BMI 25 to <40 and high habitual UPF intake (UPDATE trial, NCT05627570). Nat Med 2025;31(10):3297-3308, PMID 40760353 (55 randomised (28 MPF-first, 27 UPF-first); 50 in intention-to-treat sample).
  - What it found: The trial included 55 adults in England with overweight or obesity. Both 8-week diets followed UK healthy-eating guidance and led to weight loss, but less on the ultra-processed diet (-1.05% vs -2.06%). Triglycerides improved more on the minimally processed diet, whereas LDL cholesterol fell more on the ultra-processed diet.
  - Limitations: It was a short trial of moderate size in one population, it has published critiques of its conclusions, and differences in energy intake were not verified.
  - Checks: all six passed, 2026-10-14.
- **Aramburu et al., 2024.** Ultra-processed foods consumption and health-related outcomes: a systematic review of randomized controlled trials. *Frontiers in Nutrition* Front Nutr. 2024;11:1421728 (published 26 June 2024). PMCID PMC11233771 · DOI [10.3389/fnut.2024.1421728](https://doi.org/10.3389/fnut.2024.1421728)
  - Design: Systematic review of randomised controlled trials with GRADE: 4 RCTs (3 educational interventions, 1 controlled feeding trial), 455 participants, median follow-up 12 weeks; searches of six databases to 22 April 2024. Front Nutr 2024;11:1421728, PMC11233771 (4 RCTs; 455 participants; median follow-up 12 weeks).
  - What it found: This review found only 4 randomised trials, with 455 participants followed for a median of 12 weeks: 3 education programmes and 1 controlled feeding trial. There was no significant effect for 30 of 42 outcomes. Eating less ultra-processed food lowered energy intake and weight in the feeding trial, and weight and waist size in the education trials, at low to varying certainty.
  - Limitations: The trials are too few, small and short to confirm or rule out health effects, and the single feeding trial is probably Hall 2019, so it is not independent evidence.
  - Checks: all six passed, 2026-10-14.

**What would change the status.** 1) Causal evidence is missing. Larger, longer randomised trials are needed that measure health outcomes, not just energy intake and weight, and that separate processing from nutrient content, energy density and palatability. The planned replication by Hall's group (NCT05290064) has no published results.
2) Observational exposure is weak. Cohorts that measure ultra-processed food intake better (repeated or objective measures rather than one self-report), and independent cohorts outside the US and Europe, would reduce the overlap between Lane, Dai, Pagliai and Mendoza.
3) Subgroup results are unverified. Mendoza 2024 subgroup hazard ratios (including the reported inverse links for bread/cold cereals and yoghurt/dairy desserts) need checking before the app says anything about types of ultra-processed food.
4) Some figures need checking before they can be cited: Pagliai 2021 all-cause mortality RR 1.25 and CVD RR 1.29, and the Lane 2024 effect sizes for anxiety and common mental disorders.
5) Identifier gaps: the PMID for Aramburu 2024, the PMCID for Hall 2019 and the standalone PubMed page for Mendoza 2024.
6) Children and pregnancy need peer-reviewed, verified evidence. The DGAC report graded the evidence in children as only limited and could not reach a conclusion for pregnancy.
7) The Matters Arising critiques of Dicken 2025, the authors' reply (PMID 41495410) and the BMJ rapid responses on Lane 2024's grading methods have not been read.

Status would move back to draft if a core source were retracted or corrected, or if a high-quality synthesis showed that the associations disappear after better adjustment or exposure measurement.

## Protein for muscle gain
<a id="nutrition-protein-intake-for-muscle-gain"></a>

`nutrition.protein_intake_for_muscle_gain` · **Not enough evidence yet**

**Claim being tested.** For adults doing resistance training, a protein intake around 1.6 g per kg of body weight per day maximises gains in muscle mass on average; intakes up to about 2.2 g/kg are reasonable for those who want to be sure.

**What the app does with it.** Would let us suggest a protein target for muscle gain. Until then, your targets are yours to set.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Daily fibre
<a id="nutrition-fibre-intake-target"></a>

`nutrition.fibre_intake_target` · **Not enough evidence yet**

**Claim being tested.** Eating at least 25 to 29 g of dietary fibre a day is linked to lower risk of death, heart disease, type 2 diabetes and colorectal cancer, with greater benefit at higher intakes.

**What the app does with it.** Would let us suggest a daily fibre target. Until then, your targets are yours to set.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Protein and kidney function
<a id="nutrition-high-protein-kidney-function-healthy"></a>

`nutrition.high_protein_kidney_function_healthy` · **Not enough evidence yet**

**Claim being tested.** In adults with healthy kidneys, higher protein intakes do not harm kidney function; people with kidney disease need individual advice.

**What the app does with it.** Would explain whether higher protein is safe for healthy kidneys. Until then, we don't suggest raising protein.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Saturated fat and heart disease
<a id="nutrition-saturated-fat-replacement-cvd"></a>

`nutrition.saturated_fat_replacement_cvd` · **Not enough evidence yet**

**Claim being tested.** Not yet verified: in adults, replacing saturated fat with polyunsaturated fat (vegetable oils, nuts, seeds) for at least 2 years may modestly lower the risk of cardiovascular events, but cutting saturated fat has not been shown to help people live longer.

**Who it applies to.** Adults, mostly middle-aged, with or without existing cardiovascular disease, in trials lasting at least 2 years (many older trials enrolled mostly men). Any benefit is expected to be larger in absolute terms for people at higher cardiovascular risk. Not established for children or for mortality outcomes. Applies to no one in the app until the sources are verified.

**What the app does with it.** Would explain why saturated fat is on the food rating.

**Why this status.** None of the nine sources could be verified: the shared web search budget was used up before any check ran, so no source counts towards the claim and the status has to stay draft. If the proposed supporting sources are confirmed, they would back a narrow statement about swapping saturated fat for polyunsaturated fat and fewer cardiovascular events. Those sources are Hooper 2020 Cochrane (pub3), Mozaffarian 2010 and Jakobsen 2009, with Sacks 2017 as a position statement. They would not back any claim about mortality. Hamley 2017, which kept only adequately controlled trials and found no effect, and Steen 2026, where every pooled confidence interval crossed 1, show the trial evidence is genuinely contested. The supporting trial meta-analyses also draw on largely the same old trials, so they are not independent of each other.

**What would change the status.** 1. Re-run verification. At least 3 sources that all support the claim have to pass every check (identifier, metadata, peer review, not retracted, strong design, finding supported). The likeliest are Hooper 2020 pub3 (PMID 32827219; also check it is not the May 2020 pub2, PMID 32428300), Mozaffarian 2010 (PMID 20351774) and Jakobsen 2009 (PMID 19211817). Sacks 2017 may fail the strong-design check because it is a position statement.
2. Even after verification, independence is a concern. Hooper and Mozaffarian pool largely the same trials from the 1960s to 1990s, so a third source with a separate evidence base would make the case stronger. Jakobsen's cohorts could be that source, but they are observational. The verified 2026 AHA guidance (PMID 41914202) or a new large trial would also help.
3. Verify the contradicting and mixed sources (Hamley 2017, Steen 2026, Siri-Tarino 2010, Chowdhury 2014, de Souza 2015) and weigh them. This applies especially to Steen 2026, the most recent and largest risk-stratified review, whose existence and figures are unconfirmed. For Chowdhury 2014, check whether it has been corrected or retracted.
4. Resolve the disagreement over which trials to include (the Finnish Mental Hospital Study, Oslo, STARS, and the Minnesota Coronary Experiment re-analysis). It drives the difference between the positive analyses and the null ones.
5. Confirm the missing confidence intervals (Hooper pub3 mortality, the Steen stroke result, the Mozaffarian per-5%-of-energy estimate).
6. A verified primary source for any numeric intake cap, such as less than 10% of energy, before the app uses a threshold.

---

General fitness and nutrition information, not medical advice. If you have an injury, a medical condition, are pregnant, or have a history of disordered eating, talk to a qualified healthcare professional before changing your training or diet.
