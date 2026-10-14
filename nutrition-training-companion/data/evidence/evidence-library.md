# Evidence library

Generated from `evidence/library.json` (version 2026-10-14, reviewed 2026-10-14).

Every claim the app could act on is listed here with the studies behind it. A claim is **active**, so the app may use it to change a plan, only when at least 3 strong, peer-reviewed studies support it and each of them passed six checks: its identifier (PMID or DOI) resolves to the paper; its title, authors, journal and year match across independent records; its design is strong (systematic review, meta-analysis, umbrella review, randomised controlled trial, or an evidence-based guideline in a peer-reviewed journal; for device accuracy, validation against a reference standard; for long-term health, meta-analyses of cohort studies); it is peer reviewed and indexed; no retraction or expression of concern was found; and its abstract supports the stated finding. Otherwise the claim stays a **draft** and the app changes nothing.

How this version was checked: one agent searched for evidence for and against each claim. Two further agents, working independently, then re-checked every source: one checked its identity (PubMed, DOI, publisher pages, retraction notices), and the other checked what its abstract actually found. An editor agent then decided each claim's wording and status from the verified sources only. All checks used web search against PubMed, PubMed Central, publisher and DOI pages, because the build environment could not reach the PubMed, Europe PMC or Crossref APIs directly. The production pipeline (docs/06-evidence-gate.md) must re-verify every source through those APIs before the app relies on it, and a human must review each active claim.

| Claim | Status | Verified supporting studies |
|---|---|---|
| [More weekly sets for a low-volume muscle](#hypertrophy-volume-raise-low-weekly-sets) | Enough verified evidence | 6 |
| [Heavier loads for maximal strength](#strength-low-rep-ranges) | Enough verified evidence | 7 |
| [Light or heavy loads grow muscle similarly](#hypertrophy-load-range-similar-growth) | Not enough evidence yet | 0 |
| [Spreading the same sets over more days](#training-frequency-volume-equated) | Not enough evidence yet | 0 |
| [Stopping sets short of failure](#training-proximity-to-failure) | Not enough evidence yet | 0 |
| [Longer rests between sets](#training-inter-set-rest) | Not enough evidence yet | 0 |
| [Strength training on 2 or more days a week](#general-health-muscle-strengthening-twice-weekly) | Not enough evidence yet | 0 |
| [Planned lighter weeks](#training-deload-periods) | Not enough evidence yet | 0 |
| [Adding cardio to strength training](#training-concurrent-aerobic-compatible) | Not enough evidence yet | 0 |
| [Limiting weekly running increases](#endurance-weekly-distance-progression) | Not enough evidence yet | 0 |
| [Lifting less on low-HRV days](#recovery-hrv-guided-lifting-volume) | Not enough evidence yet | 0 |
| [HRV-guided endurance training](#recovery-hrv-guided-endurance-training) | Not enough evidence yet | 0 |
| [Short sleep and next-day performance](#recovery-sleep-loss-impairs-performance) | Not enough evidence yet | 0 |
| [How accurate wearables are](#wearables-measurement-validity) | Not enough evidence yet | 0 |
| [Protein for muscle gain](#nutrition-protein-intake-for-muscle-gain) | Not enough evidence yet | 0 |
| [Daily fibre](#nutrition-fibre-intake-target) | Not enough evidence yet | 0 |
| [Protein and kidney function](#nutrition-high-protein-kidney-function-healthy) | Not enough evidence yet | 0 |
| [Free sugars](#nutrition-free-sugars-and-health) | Not enough evidence yet | 0 |
| [Salt and blood pressure](#nutrition-sodium-reduction-blood-pressure) | Not enough evidence yet | 0 |
| [Saturated fat and heart disease](#nutrition-saturated-fat-replacement-cvd) | Not enough evidence yet | 0 |
| [Ultra-processed food](#nutrition-ultra-processed-food-associations) | Not enough evidence yet | 0 |

## More weekly sets for a low-volume muscle
<a id="hypertrophy-volume-raise-low-weekly-sets"></a>

`hypertrophy.volume.raise_low_weekly_sets` · **Enough verified evidence**

**Claim.** In healthy adults (mostly young men, untrained and trained), more weekly sets per muscle lead to more muscle growth on average, but each extra set adds less than the one before. Raising a muscle from low volume (single sets, or fewer than about 10 weekly sets) to about 10 or more weekly sets is likely to give a modest extra gain in muscle size; whether going above about 20 weekly sets adds more is uncertain.

**Who it applies to.** Healthy adults doing resistance training to build muscle size, mostly young men, both untrained and resistance-trained. Evidence in women, older adults and people with medical conditions was not verified here, so the claim should not be assumed to apply to them in the same way.

**What the app does with it.** When a muscle gets fewer than 10 hard sets a week and you want it bigger, we can suggest adding sets toward 10, never above 20, within your session time.

**Why this status.** Six counted sources agree that more weekly sets give more muscle growth on average, with smaller gains for each extra set. They come from at least three separate research groups: the Krieger 2010 and Schoenfeld 2017 meta-analyses, the large Pelland 2026 meta-regression (67 studies), the Bernardez-Vazquez 2022 umbrella review, and two RCTs (Schoenfeld 2019 and Radaelli 2015) in which single-set training grew muscle less than 3 or 5 sets. The main contrary result is Heaselgrave 2019, where 9 weekly biceps sets grew the muscle as much as 18 or 27 in trained men over 6 weeks. It is one short trial, and volume was mixed up with how often people trained, so it does not outweigh the pooled data, but it does show the extra gain can be small. The exact 10-set target rests mainly on the umbrella review and on a non-significant category trend in Schoenfeld 2017, so it is treated as approximate. The benefit above 20 sets stays uncertain (Schoenfeld 2019 leans towards more growth; Baz-Valle 2022 and Heaselgrave 2019 lean towards a plateau), so the active claim covers only raising low volume towards about 10 sets.

### Supporting studies

- **Krieger, 2010.** Single vs. multiple sets of resistance exercise for muscle hypertrophy: a meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2010 Apr;24(4):1150-9. PMID [20300012](https://pubmed.ncbi.nlm.nih.gov/20300012/) · DOI [10.1519/JSC.0b013e3181d4d436](https://doi.org/10.1519/JSC.0b013e3181d4d436)
  - Design: Meta-analysis using multilevel meta-regression: 55 effect sizes nested within 19 treatment groups and 8 studies, comparing single vs multiple sets per exercise (J Strength Cond Res 2010, Krieger) (8 studies, 19 treatment groups, 55 effect sizes (participant total not seen)).
  - What it found: Pooling 8 studies, doing multiple sets per exercise gave slightly more muscle growth than doing a single set (effect size difference 0.10, 95% CI 0.02 to 0.19, p = 0.016). Doing 2-3 and 4-6 sets both did better than 1 set but did not differ from each other.
  - Limitations: It has only 8 studies, and it counted volume as sets per exercise per session rather than weekly sets per muscle, so it cannot test the 10- or 20-set thresholds directly.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2017.** Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2017;35(11):1073-1082. PMID [27433992](https://pubmed.ncbi.nlm.nih.gov/27433992/) · DOI [10.1080/02640414.2016.1210197](https://doi.org/10.1080/02640414.2016.1210197)
  - Design: Systematic review and meta-analysis (meta-regression) of 15 studies, 34 treatment groups (J Sports Sci 2017; Schoenfeld, Ogborn, Krieger) (15 studies, 34 treatment groups (participant total not seen)).
  - What it found: Across 15 studies (34 training groups), each extra weekly set per muscle was linked to about 0.37% more muscle growth (P = 0.002). Higher-volume groups grew about 3.9 percentage points more than lower-volume groups in the same studies.
  - Limitations: Comparing under 5, 5-9 and 10 or more weekly sets showed only a non-significant trend (P = 0.074), so the 10-set cut-off is not backed by a significant category comparison, and it shares an author with Krieger 2010.
  - Checks: all six passed, 2026-10-14.
- **Pelland et al., 2026.** The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains. *Sports Medicine* Sports Med. 2026 Feb;56(2):481-505 (published online 4 Dec 2025). PMID [41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/) · DOI [10.1007/s40279-025-02344-w](https://doi.org/10.1007/s40279-025-02344-w)
  - Design: Systematic review with multilevel Bayesian meta-regressions of 67 studies, 2,058 participants, adjusted for intervention duration and training status (Sports Medicine; Pelland, Remmert, Robinson, Hinson, Zourdos; DOI 10.1007/s40279-025-02344-w) (67 studies, 2,058 participants (hypertrophy and strength combined)).
  - What it found: Pooling 67 studies and 2,058 participants, the authors found a 100% posterior probability that more weekly sets lead to more muscle growth, with each extra set adding less than the one before. Counting indirect sets from compound exercises as a fraction of a set fitted the data best.
  - Limitations: Participants were reported to be mostly untrained or recreationally trained, in studies of about 5-12 weeks, and the study and participant totals were not seen in the verified abstract text.
  - Checks: all six passed, 2026-10-14.
- **Bernárdez-Vázquez et al., 2022.** Resistance training variables for optimization of muscle hypertrophy: an umbrella review. *Frontiers in Sports and Active Living* Front Sports Act Living. 2022;4:949021. PMCID PMC9302196 · DOI [10.3389/fspor.2022.949021](https://doi.org/10.3389/fspor.2022.949021)
  - Design: Umbrella review of meta-analyses (PRISMA; PubMed/MEDLINE, SPORTDiscus, Web of Science): 14 of 52 meta-analyses included, covering 178 primary studies and 4,784 participants (Front Sports Act Living 2022; DOI 10.3389/fspor.2022.949021; PMC9302196; published as a Mini Review) (14 meta-analyses included (of 52 screened); 9 rated high quality (81-88%), the rest moderate (63-75%)).
  - What it found: This review of 14 meta-analyses (178 primary studies, 4,784 participants) concluded that at least 10 sets per muscle group per week is optimal for muscle growth. Light or heavy loads both work when sets are taken to or near failure.
  - Limitations: It pools overlapping meta-analyses, including Schoenfeld 2017, so it is not independent evidence and does not itself test a precise 10-set threshold.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2019.** Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2019 Jan;51(1):94-103. PMID [30153194](https://pubmed.ncbi.nlm.nih.gov/30153194/) · PMCID PMC6303131 · DOI [10.1249/MSS.0000000000001764](https://doi.org/10.1249/MSS.0000000000001764)
  - Design: Randomised controlled trial: 34 healthy resistance-trained men randomised to 1 set (n=11), 3 sets (n=12) or 5 sets (n=11) per exercise per session, 3 sessions a week for 8 weeks (Med Sci Sports Exerc 2019;51(1):94-103; PMC6303131) (34 participants (1 RCT)).
  - What it found: In 34 trained men training 3 times a week for 8 weeks, doing 3 or 5 sets per exercise grew the elbow flexors, mid-thigh and lateral thigh more than doing 1 set. Gains in strength and endurance did not differ between the groups.
  - Limitations: It is a small trial in trained men only, shares authors with the Krieger and Schoenfeld meta-analyses, and its top group went well above 20 weekly sets, so it cannot show where gains level off.
  - Checks: all six passed, 2026-10-14.
- **Radaelli et al., 2015.** Dose-Response of 1, 3, and 5 Sets of Resistance Exercise on Strength, Local Muscular Endurance, and Hypertrophy. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2015 May;29(5):1349-1358. PMID [25546444](https://pubmed.ncbi.nlm.nih.gov/25546444/) · DOI [10.1519/JSC.0000000000000758](https://doi.org/10.1519/JSC.0000000000000758)
  - Design: Randomised trial: 48 men with no weight-training experience randomised to 1-SET, 3-SET or 5-SET training groups, 3 sessions a week for about 6 months (J Strength Cond Res 2015;29(5):1349-58; Radaelli et al.) (48 participants (1 RCT)).
  - What it found: In 48 untrained men training 3 times a week for about 6 months, elbow flexor thickness rose in the 3-set and 5-set groups, most at 5 sets. Only the 5-set group increased elbow extensor thickness.
  - Limitations: It is a single trial in untrained men only, and a published critical letter about the paper was not reviewed.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Heaselgrave et al., 2019.** Dose-Response Relationship of Weekly Resistance-Training Volume and Frequency on Muscular Adaptations in Trained Men. *International Journal of Sports Physiology and Performance* Int J Sports Physiol Perform. 2019;14(3):360-368. PMID [30160627](https://pubmed.ncbi.nlm.nih.gov/30160627/) · DOI [10.1123/ijspp.2018-0427](https://doi.org/10.1123/ijspp.2018-0427)
  - Design: Randomised controlled trial (PubMed publication type RCT): 49 resistance-trained men randomised to LOW (n=17; 9 weekly biceps sets, 1 session a week), MOD (n=15; 18 sets, 2 sessions) or HIGH (n=17; 27 sets, 2 sessions) for 6 weeks (Int J Sports Physiol Perform 2019;14(3):360-368) (49 participants (1 RCT; about 17/15/17 per group)).
  - What it found: In 49 trained men over 6 weeks, 9 weekly biceps sets increased muscle thickness about as much as 18 or 27 sets, with no statistically significant difference between groups. The higher-volume groups may have gained more strength.
  - Limitations: It is a short trial on one muscle, and the 9-set group also trained less often (once a week against twice), so the effect of volume cannot be separated from frequency.
  - Checks: the abstract supports the stated finding: fail.

### Context

- **Baz-Valle et al., 2022.** A Systematic Review of The Effects of Different Resistance Training Volumes on Muscle Hypertrophy. *Journal of Human Kinetics* J Hum Kinet. 2022;81:199-210. PMID [35291645](https://pubmed.ncbi.nlm.nih.gov/35291645/) · PMCID PMC8884877 · DOI [10.2478/hukin-2022-0017](https://doi.org/10.2478/hukin-2022-0017)
  - Design: Systematic review with quantitative synthesis: 7 studies in the qualitative synthesis, 6 in the quantitative. Low-volume groups (<12 weekly sets) were excluded from the quantitative analysis, which compared moderate (12-20) with high (>20) weekly sets in trained men (J Hum Kinet 2022;81:199-210; Baz-Valle, Balsalobre-Fernandez, Alix-Fages, Santos-Concejero) (7 studies in the qualitative synthesis, 6 in the quantitative analysis (participant total not seen)).
  - What it found: In 6 studies of trained men, moderate (12-20) and high (more than 20) weekly volumes gave similar growth in the quadriceps (p = 0.19) and biceps (p = 0.59), but high volume did better for the triceps (p = 0.01). The authors suggested 12-20 weekly sets as a standard recommendation for trained men.
  - Limitations: It left low-volume groups out of its pooled analysis, so it cannot speak to raising volume from under 10 sets, and it covers only young trained men.
  - Checks: the abstract supports the stated finding: fail.

**What would change the status.** 1. No verified trial compares about 9 with 10-12 weekly sets head to head, so the exact 10-set threshold comes from the umbrella review and from pooled, non-significant categories. A direct comparison would firm up or move the trigger and target. 2. The benefit above 20 weekly sets is unresolved: Schoenfeld 2019 and Pelland 2026 suggest gains continue, while Heaselgrave 2019 and Baz-Valle 2022 suggest a plateau. Well-controlled trials that separate volume from frequency are needed before the app goes above 20. 3. Evidence in women, older adults and clinical groups was not verified. These groups need their own data before the claim covers them. 4. Unverified leads that could strengthen or qualify the claim: the ACSM 2026 resistance-training position stand, the Currier 2023 Br J Sports Med network meta-analysis, Brigatto 2022 (PMID 31868813), Aube 2022 (PMID 32058362), Enes 2024 (PMID 37796222) and the Ralston 2017 meta-analysis. 5. No dedicated retraction database check was run. The Barbalho group trials thought to be retracted must not be used without checking. The critical letter on Radaelli 2015 was not read. 6. The 0.5 weight for indirect sets was taken from the researcher's description of Pelland 2026. The verified text confirms only that fractional counting fitted the data best, so the exact weight should be checked. 7. Bernardez-Vazquez 2022 has no verified PMID. The study and participant totals for Pelland 2026, and the Schoenfeld 2019 elbow extensor effect sizes, were not seen in verified abstract text. 8. The sources overlap heavily (shared authors, pooled meta-analyses), so the number of truly independent lines of evidence is about three or four, not six.

## Heavier loads for maximal strength
<a id="strength-low-rep-ranges"></a>

`strength.low_rep_ranges` · **Enough verified evidence**

**Claim.** In healthy adults, training with heavier loads (about 80% of 1RM or more, roughly 8 or fewer reps per set) gives larger gains in 1RM strength on the trained lifts than training with light loads (about 60% of 1RM or less, roughly 15 or more reps per set). An advantage over moderate loads (about 9-15 reps) is not established. When sets are taken to muscular failure, muscle growth is similar with light, moderate and heavy loads.

**Who it applies to.** Healthy adults aged 18 and over. Most were young, untrained or recreationally trained, and more were men than women. The 1RM advantage of heavier loads was smaller in older adults (Refalo 2021: effect size 0.20 vs 0.34 in younger adults). Very few highly trained or elite athletes were studied, and the results in trained men are mixed: one RCT found load mostly did not change strength gains (Morton 2016), and a small RCT found larger squat gains with heavier loads (Schoenfeld 2015).

**What the app does with it.** When you ask to get stronger, we can suggest heavier loads (about 3 to 6 reps) on your main multi-joint lifts, with longer rests, and keep other exercises at moderate reps.

**Why this status.** The narrowed claim is active. Seven counted sources support it, and five syntheses from at least four separate author groups agree that heavier loads give larger 1RM gains than light loads. These are Lopez 2021 and Currier 2023 (network meta-analyses), Refalo 2021 and Schoenfeld 2017 (pairwise meta-analyses) and Mcleod 2024 (umbrella review). The 2026 ACSM position stand and a small RCT (Schoenfeld 2015) back them up. The same syntheses find similar muscle growth across loads when sets go to failure. Morton 2016 runs against the strength half in trained men, and Hammert 2026 found the heavy-load edge on untested (isometric or isokinetic) strength inconclusive. Neither outweighs the pooled evidence, but they limit the claim to 1RM on the trained lifts. Lopez 2021 found moderate loads also beat light loads, so heavy over moderate, the specific 3-6 rep range, reps in reserve and rest lengths are not supported. The pairwise and network meta-analyses share many primary trials, and Currier 2023, Mcleod 2024 and ACSM 2026 come from overlapping McMaster authors, so the sources are less independent than their count suggests.

### Supporting studies

- **Lopez et al., 2021.** Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2021 Jun;53(6):1206-1216. doi:10.1249/MSS.0000000000002585. Corrigendum: Med Sci Sports Exerc. 2022;54(2):370 (PMID 35029596).. PMID [33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/) · PMCID PMC8126497 · DOI [10.1249/MSS.0000000000002585](https://doi.org/10.1249/MSS.0000000000002585)
  - Design: Systematic review and network meta-analysis (random effects) of 28 studies involving 747 healthy adults. Training was to volitional failure, comparing low-, moderate- and high-load RT. A corrigendum (PMID 35029596) corrected effect sizes for three studies in one figure. The authors say the main findings and conclusions did not change. (28 studies, 747 healthy adults).
  - What it found: A network meta-analysis of 28 studies with 747 healthy adults training to failure. Heavy (8 reps or fewer) and moderate (9-15 reps) loads both improved strength more than light loads, and muscle growth did not differ between loads.
  - Limitations: The verifier did not see the exact effect sizes, including the non-significant heavy-versus-moderate difference, and a corrigendum changed three study effect sizes, though not the conclusions.
  - Checks: all six passed, 2026-10-14.
- **Currier et al., 2023.** Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *British Journal of Sports Medicine* Br J Sports Med. 2023 Sep;57(18):1211-1220. Epub 2023 Jul 6.. PMID [37414459](https://pubmed.ncbi.nlm.nih.gov/37414459/) · PMCID PMC10579494 · DOI [10.1136/bjsports-2023-106807](https://doi.org/10.1136/bjsports-2023-106807)
  - Design: Systematic review with Bayesian network meta-analysis comparing RT prescriptions with non-exercise control. The strength network had 178 studies (n=5097; 45% women). The hypertrophy network had 119 studies (n=3364; 47% women). Br J Sports Med 2023;57(18):1211-1220, PMID 37414459. (Strength network: 178 studies, 5,097 participants. Hypertrophy network: 119 studies, 3,364 participants).
  - What it found: A Bayesian network meta-analysis of 178 studies (5,097 participants, 45% women) for strength and 119 studies (3,364 participants) for muscle size. Programmes using loads above 80% of 1RM gave the largest strength gains, and all programmes built muscle about equally.
  - Limitations: Loads were compared indirectly through non-exercise control groups, and the analysis was not limited to sets taken to failure.
  - Checks: all six passed, 2026-10-14.
- **Refalo et al., 2021.** Influence of resistance training load on measures of skeletal muscle hypertrophy and improvements in maximal strength and neuromuscular task performance: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2021 Aug;39(15):1723-1745.. PMID [33874848](https://pubmed.ncbi.nlm.nih.gov/33874848/) · DOI [10.1080/02640414.2021.1898094](https://doi.org/10.1080/02640414.2021.1898094)
  - Design: Systematic review with meta-analysis of 45 studies (4,713 records identified). It compared higher-load (>60% 1RM or <15RM) with lower-load (<=60% 1RM or >=15RM) RT. (45 studies (from 4,713 screened records); participant total not seen).
  - What it found: A meta-analysis of 45 studies. Higher loads gave larger 1RM gains (effect size 0.34, 95% CI 0.15 to 0.52) and isometric gains (0.41, 0.07 to 0.76). Muscle growth was similar (whole-muscle effect size 0.06, -0.11 to 0.24), and the 1RM advantage was smaller in older adults (0.20 vs 0.34).
  - Limitations: It defined higher load broadly (above 60% of 1RM or fewer than 15 reps), so it cannot confirm the 80% threshold specifically.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2017.** Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2017 Dec;31(12):3508-3523. doi:10.1519/JSC.0000000000002200.. PMID [28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) · DOI [10.1519/JSC.0000000000002200](https://doi.org/10.1519/JSC.0000000000002200)
  - Design: Systematic review and meta-analysis of 21 studies (PubMed/MEDLINE, Cochrane Library, Scopus). It compared low-load (<=60% 1RM) with high-load (>60% 1RM) training, all sets to momentary muscular failure, for at least 6 weeks. (21 studies; participant total not seen).
  - What it found: A meta-analysis of 21 studies in which all sets went to failure for at least 6 weeks. 1RM gains were greater with loads above 60% of 1RM than with lighter loads, isometric strength did not differ, and muscle growth was similar.
  - Limitations: It defined high load as above 60% of 1RM, and its growth conclusion rests only on whole-muscle measures.
  - Checks: all six passed, 2026-10-14.
- **Mcleod et al., 2024.** The influence of resistance exercise training prescription variables on skeletal muscle mass, strength, and physical function in healthy adults: An umbrella review. *Journal of Sport and Health Science* J Sport Health Sci. 2024 Jan;13(1):47-60. doi:10.1016/j.jshs.2023.06.005. Epub 2023 Jun 28.. PMID [37385345](https://pubmed.ncbi.nlm.nih.gov/37385345/) · PMCID PMC10818109 · DOI [10.1016/j.jshs.2023.06.005](https://doi.org/10.1016/j.jshs.2023.06.005)
  - Design: Umbrella review of 44 systematic reviews in healthy adults (Mcleod, Currier, Lowisz, Phillips; J Sport Health Sci 2024;13(1):47-60). (44 systematic reviews).
  - What it found: An umbrella review of 44 systematic reviews in healthy adults. Training load and weekly frequency affected strength gains but not muscle growth, and set volume affected both.
  - Limitations: It names no specific load threshold, and much of its evidence overlaps with the meta-analyses above.
  - Checks: all six passed, 2026-10-14.
- **Currier et al., 2026.** American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2026 Apr 1;58(4):851-872. Epub 2026 Mar 5.. DOI [10.1249/MSS.0000000000003897](https://doi.org/10.1249/MSS.0000000000003897)
  - Design: ACSM position stand: an evidence-based overview of reviews in Med Sci Sports Exerc 2026;58(4):851-872 (doi:10.1249/MSS.0000000000003897), updating the 2009 ACSM position stand. Search results describe it as synthesising 137 systematic reviews (over 30,000 participants per ACSM). (Press release: evidence from 137 studies (exact unit, reviews or trials, not confirmed from the abstract)).
  - What it found: The 2026 ACSM position stand, an overview of reviews. It summarises that maximal strength is improved by heavier loads (80% of 1RM or more), along with full range of motion, 2-3 sets, doing the lift early in the session and training at least twice a week.
  - Limitations: No PubMed record or full abstract was seen, the details came through secondary records, and it supports only the strength half of the claim.
  - Checks: all six passed, 2026-10-14.
- **Schoenfeld et al., 2015.** Effects of Low- vs. High-Load Resistance Training on Muscle Strength and Hypertrophy in Well-Trained Men. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2015 Oct;29(10):2954-2963. doi:10.1519/JSC.0000000000000958.. PMID [25853914](https://pubmed.ncbi.nlm.nih.gov/25853914/) · DOI [10.1519/JSC.0000000000000958](https://doi.org/10.1519/JSC.0000000000000958)
  - Design: Randomised trial: 18 young men experienced in RT, matched on baseline strength and randomly assigned to low load (25-35 reps/set) or high load (8-12 reps/set), 9 per group, 3 sessions/week for 8 weeks. J Strength Cond Res 2015;29(10):2954-63. (Not seen in search results).
  - What it found: A randomised trial in 18 trained young men over 8 weeks, with all sets to failure. Back squat 1RM rose more with 8-12 reps than with 25-35 reps (19.6% vs 8.8%), bench press showed only a trend (6.5% vs 2.0%), and muscle thickness gains did not differ.
  - Limitations: It is very small, and its heavy condition (8-12 reps, about 70-80% of 1RM) falls below the 80% threshold.
  - Checks: all six passed, 2026-10-14.

### Contradicting or mixed evidence

- **Morton et al., 2016.** Neither load nor systemic hormones determine resistance training-mediated hypertrophy or strength gains in resistance-trained young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2016 Jul 1;121(1):129-38. doi:10.1152/japplphysiol.00154.2016.. PMID [27174923](https://pubmed.ncbi.nlm.nih.gov/27174923/) · PMCID PMC4967245 · DOI [10.1152/japplphysiol.00154.2016](https://doi.org/10.1152/japplphysiol.00154.2016)
  - Design: Randomised trial, n=49 resistance-trained young men (23±1 yr), 12 weeks of whole-body RT. Higher-repetition group: ~30-50% 1RM, 20-25 reps/set. Lower-repetition group: ~75-90% 1RM, 8-12 reps/set. All sets to volitional failure. PMID 27174923, PMCID PMC4967245. Group sizes conflict between sources (24/25 vs 29/27). (49 participants).
  - What it found: A randomised trial in 49 resistance-trained young men over 12 weeks, with all sets to failure. Lifting 20-25 reps (about 30-50% of 1RM) or 8-12 reps (about 75-90% of 1RM) gave similar muscle growth and, for the most part, similar strength gains. Bench press was the one measure that favoured heavier loads.
  - Limitations: It is a single trial in trained men only, its heavy condition was mostly below 80% of 1RM, and sources disagree on the group sizes.
  - Checks: the abstract supports the stated finding: fail.

### Context

- **Hammert et al., 2026.** Non-Specific Strength Changes Between High- and Low-Load Isotonic Resistance Training: A Systematic Review and Meta-Analysis. *Sports Medicine* Sports Med. 2026;56:763-773 (published online 12 Dec 2025).. PMID [41381816](https://pubmed.ncbi.nlm.nih.gov/41381816/) · PMCID PMC13018011 · DOI [10.1007/s40279-025-02370-8](https://doi.org/10.1007/s40279-025-02370-8)
  - Design: Systematic review and meta-analysis (PubMed, Scopus, Embase searched to 14 June 2025): 10 studies from 7,885 unique articles, 44 effect sizes, 245 participants (high load n=114, low load n=131). Full-text snippet: high load >60% 1RM, low load <=40% 1RM. (10 studies, 44 effect sizes, 245 participants (high load n=114, low load n=131)).
  - What it found: A meta-analysis of 10 studies with 245 participants. On strength tests not used in training (isometric or isokinetic), the advantage of heavy loads was inconclusive: d=0.32, 95% CI -0.08 to 0.72, p=0.10.
  - Limitations: It is small, and it addresses carry-over to untested strength rather than 1RM, so it narrows the claim rather than contradicting it.
  - Checks: the abstract supports the stated finding: unknown.

**What would change the status.** More evidence is needed in five areas. (1) Direct, volume-equated RCTs of heavy loads (about 3-6 reps) against moderate loads (about 8-12 reps), such as Mangine 2015 and Schoenfeld 2014 (not searched). These would be needed before the app could favour 3-6 reps over moderate loading. (2) Trials testing 2-3 reps in reserve and longer rests for strength. No verified source covers either, and the umbrella review found insufficient evidence on set end point and rest. (3) Evidence that similar growth across loads holds when sets stop short of failure. (4) More trials in trained and elite lifters, where results are mixed (Morton 2016 vs Schoenfeld 2015) and such lifters are about 2.3% of the evidence base. Also more trials in women and older adults, where the 1RM advantage looked smaller. (5) Better evidence on whether heavy-load gains carry over to strength tests that were not trained (Hammert 2026 was inconclusive). Several sources still need checking: Lopez 2021's effect sizes (high vs low SMD 0.60; high vs moderate non-significant) against its abstract or tables; ACSM 2026's PMID, abstract and hypertrophy recommendations; and the Currier 2023 and Mcleod 2024 identifiers on their own PubMed records. These leads were not verified or examined and were not used: Csapo & Alegre on older adults (PMID 26302881); the APNM volume-matched loads meta-analysis (doi 10.1139/apnm-2021-0515); the ACSM 2009 stand; the Schoenfeld 2016 Eur J Sport Sci meta-analysis (PMID 25530577); the 2026 paper on regional muscle and tendon growth (PMID 42319300), which may challenge similar growth in particular muscle regions; and a bioRxiv preprint. No dedicated retraction search was run for each paper.

## Light or heavy loads grow muscle similarly
<a id="hypertrophy-load-range-similar-growth"></a>

`hypertrophy.load_range_similar_growth` · **Not enough evidence yet**

**Claim.** In healthy young adults, training with loads from about 30% to about 85% of 1RM appears to give similar gains in whole-muscle size when sets are taken to momentary failure, while heavier loads still give larger gains in maximal (1RM) strength. This is not established for loads below about 30% of 1RM, or for light-load sets stopped well short of failure.

**Who it applies to.** Healthy adults, untrained or resistance-trained. Most data come from young men aged about 18-35 in 6-12 week programmes. The claim is not established for women, older adults or highly trained athletes.

**What the app does with it.** Lets us keep or change rep ranges for comfort or time without expecting less muscle growth, and explains why a strength change shouldn't cost muscle.

**Why this status.** No source counts toward this claim. Verification of all 15 sources stopped when the shared web-search budget ran out, so no abstract or finding was checked against the claim, and every design, direction and finding check is unknown. The candidate evidence looks consistent: meta-analyses from four groups (Schoenfeld 2017, Lopez 2021, Refalo 2021, Carvalho 2022) and trials such as Mitchell 2012, Morton 2016 and Lees all report similar growth across loads. But the app's 3-source rule cannot be met until at least three of them pass verification. Even then the claim has limits: 20% 1RM gave about half the growth of 80% (Lasevicius 2018); light-load sets stopped short of failure appear to give less growth (Lasevicius 2022, identity not yet confirmed); fibre-level data lean non-significantly towards heavy loads (Grgic 2020); and heavier loads consistently give larger strength gains.

### Context

- **Schoenfeld et al., 2017.** Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. *Journal of Strength and Conditioning Research* J Strength Cond Res. 2017 Dec;31(12):3508-3523. doi:10.1519/JSC.0000000000002200.. PMID [28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) · DOI [10.1519/JSC.0000000000002200](https://doi.org/10.1519/JSC.0000000000002200)
  - Design: Systematic review and meta-analysis of 21 studies (PubMed/MEDLINE, Cochrane Library, Scopus). It compared low-load (<=60% 1RM) with high-load (>60% 1RM) training, all sets to momentary muscular failure, for at least 6 weeks. (21 studies; participant total not seen).
  - What it found: A meta-analysis of 21 studies in which all sets went to failure for at least 6 weeks. 1RM gains were greater with loads above 60% of 1RM than with lighter loads, isometric strength did not differ, and muscle growth was similar.
  - Limitations: It defined high load as above 60% of 1RM, and its growth conclusion rests only on whole-muscle measures.
  - Checks: all six passed, 2026-10-14.
- **Lopez et al., 2021.** Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine & Science in Sports & Exercise* Med Sci Sports Exerc. 2021 Jun;53(6):1206-1216. doi:10.1249/MSS.0000000000002585. Corrigendum: Med Sci Sports Exerc. 2022;54(2):370 (PMID 35029596).. PMID [33433148](https://pubmed.ncbi.nlm.nih.gov/33433148/) · PMCID PMC8126497 · DOI [10.1249/MSS.0000000000002585](https://doi.org/10.1249/MSS.0000000000002585)
  - Design: Systematic review and network meta-analysis (random effects) of 28 studies involving 747 healthy adults. Training was to volitional failure, comparing low-, moderate- and high-load RT. A corrigendum (PMID 35029596) corrected effect sizes for three studies in one figure. The authors say the main findings and conclusions did not change. (28 studies, 747 healthy adults).
  - What it found: A network meta-analysis of 28 studies with 747 healthy adults training to failure. Heavy (8 reps or fewer) and moderate (9-15 reps) loads both improved strength more than light loads, and muscle growth did not differ between loads.
  - Limitations: The verifier did not see the exact effect sizes, including the non-significant heavy-versus-moderate difference, and a corrigendum changed three study effect sizes, though not the conclusions.
  - Checks: all six passed, 2026-10-14.
- **Refalo et al., 2021.** Influence of resistance training load on measures of skeletal muscle hypertrophy and improvements in maximal strength and neuromuscular task performance: A systematic review and meta-analysis. *Journal of Sports Sciences* J Sports Sci. 2021 Aug;39(15):1723-1745.. PMID [33874848](https://pubmed.ncbi.nlm.nih.gov/33874848/) · DOI [10.1080/02640414.2021.1898094](https://doi.org/10.1080/02640414.2021.1898094)
  - Design: Systematic review with meta-analysis of 45 studies (4,713 records identified). It compared higher-load (>60% 1RM or <15RM) with lower-load (<=60% 1RM or >=15RM) RT. (45 studies (from 4,713 screened records); participant total not seen).
  - What it found: A meta-analysis of 45 studies. Higher loads gave larger 1RM gains (effect size 0.34, 95% CI 0.15 to 0.52) and isometric gains (0.41, 0.07 to 0.76). Muscle growth was similar (whole-muscle effect size 0.06, -0.11 to 0.24), and the 1RM advantage was smaller in older adults (0.20 vs 0.34).
  - Limitations: It defined higher load broadly (above 60% of 1RM or fewer than 15 reps), so it cannot confirm the 80% threshold specifically.
  - Checks: all six passed, 2026-10-14.
- **Carvalho et al., 2022.** Muscle hypertrophy and strength gains after resistance training with different volume-matched loads: a systematic review and meta-analysis. *Applied Physiology, Nutrition, and Metabolism* Appl Physiol Nutr Metab. 2022 Apr;47(4):357-368. doi:10.1139/apnm-2021-0515. PMID [35015560](https://pubmed.ncbi.nlm.nih.gov/35015560/) · DOI [10.1139/apnm-2021-0515](https://doi.org/10.1139/apnm-2021-0515)
  - Design: Not verified: web search budget exhausted. (Number of studies and participants not seen in search results).
  - What it found: Compared different loads with total training volume matched and reported no difference in muscle growth between them.
  - Limitations: Not yet verified, and the number of studies was not seen. Because volume was matched, sets may not have gone to failure, so it tests the 'to failure' condition only indirectly.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Mcleod et al., 2024.** The influence of resistance exercise training prescription variables on skeletal muscle mass, strength, and physical function in healthy adults: An umbrella review. *Journal of Sport and Health Science* J Sport Health Sci. 2024 Jan;13(1):47-60. doi:10.1016/j.jshs.2023.06.005. Epub 2023 Jun 28.. PMID [37385345](https://pubmed.ncbi.nlm.nih.gov/37385345/) · PMCID PMC10818109 · DOI [10.1016/j.jshs.2023.06.005](https://doi.org/10.1016/j.jshs.2023.06.005)
  - Design: Umbrella review of 44 systematic reviews in healthy adults (Mcleod, Currier, Lowisz, Phillips; J Sport Health Sci 2024;13(1):47-60). (44 systematic reviews).
  - What it found: An umbrella review of 44 systematic reviews in healthy adults. Training load and weekly frequency affected strength gains but not muscle growth, and set volume affected both.
  - Limitations: It names no specific load threshold, and much of its evidence overlaps with the meta-analyses above.
  - Checks: all six passed, 2026-10-14.
- **Morton et al., 2016.** Neither load nor systemic hormones determine resistance training-mediated hypertrophy or strength gains in resistance-trained young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2016 Jul 1;121(1):129-38. doi:10.1152/japplphysiol.00154.2016.. PMID [27174923](https://pubmed.ncbi.nlm.nih.gov/27174923/) · PMCID PMC4967245 · DOI [10.1152/japplphysiol.00154.2016](https://doi.org/10.1152/japplphysiol.00154.2016)
  - Design: Randomised trial, n=49 resistance-trained young men (23±1 yr), 12 weeks of whole-body RT. Higher-repetition group: ~30-50% 1RM, 20-25 reps/set. Lower-repetition group: ~75-90% 1RM, 8-12 reps/set. All sets to volitional failure. PMID 27174923, PMCID PMC4967245. Group sizes conflict between sources (24/25 vs 29/27). (49 participants).
  - What it found: A randomised trial in 49 resistance-trained young men over 12 weeks, with all sets to failure. Lifting 20-25 reps (about 30-50% of 1RM) or 8-12 reps (about 75-90% of 1RM) gave similar muscle growth and, for the most part, similar strength gains. Bench press was the one measure that favoured heavier loads.
  - Limitations: It is a single trial in trained men only, its heavy condition was mostly below 80% of 1RM, and sources disagree on the group sizes.
  - Checks: the abstract supports the stated finding: fail.
- **Lees et al., 2026.** Resistance training load does not determine resistance training-induced hypertrophy across upper and lower limbs in healthy young males. *The Journal of Physiology* J Physiol. 2026 (Epub 2025 Dec 31). doi:10.1113/JP289684. Volume/pages not seen.. PMID [41474371](https://pubmed.ncbi.nlm.nih.gov/41474371/) · DOI [10.1113/JP289684](https://doi.org/10.1113/JP289684)
  - Design: Not verified: web search budget exhausted. (20 participants).
  - What it found: In 20 healthy young men training three times a week for 10 weeks, this trial compared lighter (about 30-40% 1RM) and heavier (about 70-80% 1RM) loads within the same people. It reportedly found that load did not determine muscle growth in either the arms or the legs.
  - Limitations: It is small, men-only and from the same laboratory as Mitchell 2012 and Morton 2016. Its results were not yet verified, and it was published online in December 2025 with the 2026 issue unconfirmed.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Mitchell et al., 2012.** Resistance exercise load does not determine training-mediated hypertrophic gains in young men. *Journal of Applied Physiology* J Appl Physiol (1985). 2012 Jul;113(1):71-77. doi:10.1152/japplphysiol.00307.2012. PMID [22518835](https://pubmed.ncbi.nlm.nih.gov/22518835/) · PMCID PMC3404827 · DOI [10.1152/japplphysiol.00307.2012](https://doi.org/10.1152/japplphysiol.00307.2012)
  - Design: Not verified: web search budget exhausted. (Participant number not confirmed in search snippets).
  - What it found: A randomised trial in untrained young men that reported similar muscle growth from light and heavy loads when sets were taken to failure.
  - Limitations: Not yet verified: the participant number and results were not checked. It covered untrained young men only.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Grgic, 2020.** The Effects of Low-Load Vs. High-Load Resistance Training on Muscle Fiber Hypertrophy: A Meta-Analysis. *Journal of Human Kinetics* J Hum Kinet. 2020;74:51-58. doi:10.2478/hukin-2020-0013. PMID [33312275](https://pubmed.ncbi.nlm.nih.gov/33312275/) · PMCID PMC7706639 · DOI [10.2478/hukin-2020-0013](https://doi.org/10.2478/hukin-2020-0013)
  - Design: Not verified: web search budget exhausted. (10 study groups (participant total not seen)).
  - What it found: Pooled studies of single muscle fibres and found a non-significant trend towards greater growth of fast-twitch (type II) fibres with heavy loads (SMD 0.30, p = 0.089), with very wide uncertainty.
  - Limitations: It measures fibre size, not whole-muscle size, the trend is not statistically significant, and the findings are not yet verified.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.
- **Lasevicius et al., 2018.** Effects of different intensities of resistance training with equated volume load on muscle strength and hypertrophy. *European Journal of Sport Science* Eur J Sport Sci. 2018;18(6):772-780. doi:10.1080/17461391.2018.1450898. PMID [29564973](https://pubmed.ncbi.nlm.nih.gov/29564973/) · DOI [10.1080/17461391.2018.1450898](https://doi.org/10.1080/17461391.2018.1450898)
  - Design: Not verified: web search budget exhausted. (30 participants).
  - What it found: 30 men trained twice a week for 12 weeks, with each limb assigned to 20%, 40%, 60% or 80% of 1RM and volume load matched. The 20% load reportedly gave about half the muscle growth of 80%, while 40-80% were broadly similar.
  - Limitations: The result values were not yet verified. Volume-matched sets were not necessarily taken to failure, and the trial included men only.
  - Checks: title, authors, journal and year match: unknown; strong study design: unknown; no retraction or expression of concern found: unknown; the abstract supports the stated finding: unknown.

**What would change the status.** The decisive gap is verification, not evidence. Re-run verification in a turn with search budget available. At least three of Schoenfeld 2017, Lopez 2021, Refalo 2021, Carvalho 2022, Morton 2016, Lees and Mitchell 2012 must pass every check (identifier, metadata on a second independent page, peer review, retraction status, strong design, and a finding that supports the claim) before the status can be active. Because the meta-analyses share most of their primary trials, and Mitchell, Morton and Lees come from one laboratory, the counted set should include reviews from different groups, or at least one RCT from another laboratory (e.g. Schoenfeld 2015), so the agreement is not the same data counted twice. Lasevicius 2022 needs its identity confirmed to support the rule that light-load sets must end at or within about 1 rep of failure, and direct trials of light loads at 1-3 reps in reserve would be needed to extend the claim from 'to failure' to 'close to failure'. Lasevicius 2018 should be verified to fix the lower bound at about 30% 1RM. The upper bound above about 85-90% 1RM rests only on a small 2025 trial (Cumming et al.) with an unconfirmed PMID. Applying the claim beyond young men would need trials in women, older adults and highly trained athletes. The type II fibre question (Grgic 2020) remains open.

## Spreading the same sets over more days
<a id="training-frequency-volume-equated"></a>

`training.frequency_volume_equated` · **Not enough evidence yet**

**Claim.** In healthy adults, when weekly sets per muscle are kept the same, training a muscle once a week or spreading those sets over two or three sessions a week appears to give similar muscle growth. This has not yet been confirmed by verified sources, and no claim is made about strength.

**Who it applies to.** Healthy adults, mostly young (pooled mean age about 25) and mostly male (about 79%), untrained or resistance-trained, doing supervised programmes of about 6 to 12 weeks (some up to about 30) at 1 to 3 sessions per muscle per week. The evidence does not reliably cover women, adults over 60, clinical groups, more than 3 sessions per muscle per week, or programmes much longer than 12 weeks.

**What the app does with it.** Lets us move sets between days, for example to fit your session time, without expecting less growth.

**Why this status.** None of the nine candidate sources counts: the shared search budget ran out before any checks ran, so for every source the identity, peer-review status, retraction status, design and reported finding are all unknown. The submitted evidence looks consistent for hypertrophy (Schoenfeld 2019, Pelland 2026, Tao 2026, Ramos-Campo 2024 and Pedersen 2024 all report no meaningful difference at equal volume), but none of it is verified, so the claim must stay a draft. Two sources point the other way: Schoenfeld 2016 found twice a week beat once a week, and the small Zaroni 2019 trial found more growth with 5 sessions a week. Both favour more frequent training, so they do not suggest splitting sets would cause harm. The strength part, including the 'mainly through extra volume' clause, is contested: Grgic 2018 and Cuthbert 2021 found no volume-equated effect, while Tao 2026, Pelland 2026 and Pedersen 2024 report a small independent benefit. So it is left out of the statement.

**What would change the status.** 1) Verification has to be re-run, ideally in a turn with search budget left. At least 3 of Schoenfeld 2019, Pelland 2026, Tao 2026, Ramos-Campo 2024 and Pedersen 2024 must pass every check (identifier, metadata, peer review, no retraction, strong design) with a confirmed volume-equated hypertrophy finding. Specific items to resolve: the Grgic 2018 PMID conflict (29470825 vs 28444646), the journal and peer-review status of Tao 2026, the full citation for Pelland 2026, and whether every trial in Ramos-Campo 2024 equated volume. 2) The volume-equated RCTs the researcher cited (Hamarsland 2022, Gomes 2019, Saric 2019, Gentil 2018, Brigatto 2019) were never put forward for verification. Verifying them would add primary evidence that does not rely on overlapping meta-analyses. 3) Even once verified, the meta-analyses draw on the same pool of small trials and often share authors. At least one source from an independent group, or independent primary trials, would strengthen any activation. 4) Supporting 4 or more sessions per muscle per week would need more volume-equated trials at those frequencies. 5) Trials in women, adults over 60, clinical groups, and programmes longer than 12 weeks are needed before the claim can be extended to them. 6) A strength statement would need agreement between Grgic 2018 and Cuthbert 2021 on one side and Tao 2026, Pelland 2026 and Pedersen 2024 on the other. The question is whether frequency helps strength independently of volume or through extra practice of the tested lift. 7) No source gives a maximum number of sets per session, so the app has no basis for a per-session cap.

## Stopping sets short of failure
<a id="training-proximity-to-failure"></a>

`training.proximity_to_failure` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Our plans use 1 to 3 reps in reserve and never ask you to train to failure on every set.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Longer rests between sets
<a id="training-inter-set-rest"></a>

`training.inter_set_rest` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Session times assume about 2 minutes' rest on main lifts, and we don't cut rests below about a minute to fit a time limit.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Strength training on 2 or more days a week
<a id="general-health-muscle-strengthening-twice-weekly"></a>

`general_health.muscle_strengthening_twice_weekly` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** For the general health goal, if your plan has fewer than 2 strength days, we can suggest adding one.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Planned lighter weeks
<a id="training-deload-periods"></a>

`training.deload_periods` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Would let us suggest planned lighter (deload) weeks.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Adding cardio to strength training
<a id="training-concurrent-aerobic-compatible"></a>

`training.concurrent_aerobic_compatible` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** When you ask to add running, we can add runs on separate days without cutting your lifting.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Limiting weekly running increases
<a id="endurance-weekly-distance-progression"></a>

`endurance.weekly_distance_progression` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Would limit how fast your weekly running distance rises.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Lifting less on low-HRV days
<a id="recovery-hrv-guided-lifting-volume"></a>

`recovery.hrv_guided_lifting_volume` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Would let a low readiness reduce today's lifting. Until the evidence is there, readiness never changes your plan.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## HRV-guided endurance training
<a id="recovery-hrv-guided-endurance-training"></a>

`recovery.hrv_guided_endurance_training` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Would let us swap a hard run for an easy one on a low-HRV day.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Short sleep and next-day performance
<a id="recovery-sleep-loss-impairs-performance"></a>

`recovery.sleep_loss_impairs_performance` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains your readiness: short sleep can make a session feel harder. It never changes your plan by itself.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## How accurate wearables are
<a id="wearables-measurement-validity"></a>

`wearables.measurement_validity` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains why we compare each device only with its own baseline and keep each maker's score under its own name.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Protein for muscle gain
<a id="nutrition-protein-intake-for-muscle-gain"></a>

`nutrition.protein_intake_for_muscle_gain` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** If your goal is muscle gain and your protein target is under 1.6 g per kg of body weight a day, we can suggest raising it to 1.6 g/kg.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Daily fibre
<a id="nutrition-fibre-intake-target"></a>

`nutrition.fibre_intake_target` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** If your fibre target is under 25 g a day, we can suggest 25 to 30 g. It also explains the fibre line in food ratings.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Protein and kidney function
<a id="nutrition-high-protein-kidney-function-healthy"></a>

`nutrition.high_protein_kidney_function_healthy` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains why we hold protein suggestions if you tell us about a medical condition, until a professional supervises your plan.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Free sugars
<a id="nutrition-free-sugars-and-health"></a>

`nutrition.free_sugars_and_health` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains the sugar line in food ratings.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Salt and blood pressure
<a id="nutrition-sodium-reduction-blood-pressure"></a>

`nutrition.sodium_reduction_blood_pressure` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains the salt line in food ratings.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Saturated fat and heart disease
<a id="nutrition-saturated-fat-replacement-cvd"></a>

`nutrition.saturated_fat_replacement_cvd` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains the saturated fat line in food ratings.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



## Ultra-processed food
<a id="nutrition-ultra-processed-food-associations"></a>

`nutrition.ultra_processed_food_associations` · **Not enough evidence yet**

**Claim.** Not yet checked.

**Who it applies to.** 

**What the app does with it.** Explains the processing line in food ratings. We describe processing; we never judge a food.

**Why this status.** We have not finished checking the evidence for this claim, so the app treats it as unsupported and changes nothing.



---

General fitness and nutrition information, not medical advice. If you have an injury, a medical condition, are pregnant, or have a history of disordered eating, talk to a qualified healthcare professional before changing your training or diet.
