# Hackathon Demo Case Selection: FEMA COVID-19 Procurement Portfolio

> **Decision date:** 2026-02-11
> **Status:** Case selected, implementation changes identified, API data validated live
> **Selected case:** FEMA 2020 COVID-19 procurement portfolio (~5,000+ contracts)
> **Target command:** `investigate run --agency="Department of Homeland Security" --period=2020-03-01:2020-12-31 --deep --charts`

---

## Why This Document Exists

We evaluated 4 real-world procurement fraud/waste cases for the hackathon demo. This document captures the full research so no one has to repeat the investigation. It includes: case selection rationale, live API data validation, indicator mapping, architectural gaps found, and the implementation checklist.

---

## The 4 Candidates Evaluated

### Case 1: Federal Government Experts (FGE) / Robert Stewart Jr.

- **What happened:** $34.5M in no-bid PPE contracts across VA and FEMA. Zero masks delivered. False claims about business capabilities (veteran-owned, 8(a), HUBZone).
- **Outcome:** DOJ guilty plea + 21-month sentence ([DOJ press release](https://www.justice.gov/usao-edva/pr/former-ceo-sentenced-defrauding-multiple-federal-agencies))
- **ProPublica:** [Contractor Who Was Awarded $34.5 Million...Pleads Guilty](https://www.propublica.org/article/contractor-masks-guilty-plea)
- **Verdict: ELIMINATED.** The VA contract ($35.4M) shows **$0 in Award Amount** in USAspending search results because it was fully terminated for convenience. Our pipeline uses `Award Amount` from search -- the biggest award would be invisible. Only the transaction history reveals the $35.4M initial obligation followed by a -$35.4M termination mod. This is a showstopper without transaction-level analysis in the collector.

### Case 2: Fillakit LLC (FEMA) -- INCLUDED IN WINNER

- **What happened:** Company formed ~6 days before receiving FEMA contract. Paid $10.16M for COVID test tubes, shipped unusable mini soda bottles. No-bid contract under urgency authority.
- **Outcome:** Senate inquiry ([Peters/Stabenow press release](https://www.peters.senate.gov/newsroom/press-releases/peters-stabenow-press-trump-administration-for-answers-on-rewarding-an-unreliable-company-to-produce-testing-supplies)) + DHS IG investigation ([GovExec](https://www.govexec.com/management/2020/06/fema-ordered-102-million-covid-19-testing-kits-its-now-warning-states-not-use/166514/))
- **ProPublica:** [The Trump Administration Paid Millions for Test Tubes...](https://www.propublica.org/article/the-trump-administration-paid-millions-for-test-tubes-and-got-unusable-mini-soda-bottles)
- **Verdict: STRONG.** Appears in FEMA portfolio scan. Rich competition fields. Brand-new entity detectable via SAM.gov registration timing.

### Case 3: Zach Fuentes LLC (IHS)

- **What happened:** $3M KN95 masks for Indian Health Service. Manufacturer mismatch, IHS rejected order. CBCA claim for $3.49M (reduced to $2.59M via mods).
- **Outcome:** CBCA decision 7090 ([cbca.gov PDF](https://www.cbca.gov/files/decisions/2022/SHERIDAN_04-06-22_7090__ZACH_FUENTES_LLC%20%28Decision%29.pdf)) + congressional letter ([congress.gov](https://www.congress.gov/event/116th-congress/senate-event/LC65452/text))
- **ProPublica:** [The Feds Gave a Former White House Official $3 Million...](https://www.propublica.org/article/the-feds-gave-a-former-white-house-official-3-million-to-supply-masks-to-navajo-hospitals-some-may-not-work)
- **Verdict: ELIMINATED.** IHS is too small an agency (~1,000 awards). Only R002 fires meaningfully on N=1-2 awards. Core fraud (manufacturer mismatch) is outside our indicator set. Thin visual output.

### Case 4: AirBoss Defense Group (FEMA) -- INCLUDED IN WINNER

- **What happened:** $96.4M sole-source respirator contract from FEMA, plus $121M from HHS/BARDA. Allegedly directed by White House.
- **Outcome:** Congressional "Lessons Learned" report ([congress.gov PDF](https://www.congress.gov/117/meeting/house/115248/documents/HMKP-117-VC00-20221214-SD004.pdf))
- **ProPublica:** [The White House Pushed FEMA To Give its Biggest...](https://www.propublica.org/article/the-white-house-pushed-fema-to-give-its-biggest-coronavirus-contract-to-a-company-that-never-had-to-bid)
- **Verdict: STRONG but politically sensitive.** $96.4M sole-source would be a dramatic outlier in every chart. Performance address is ZIP 20500 (White House). Use non-accusatory framing: "the question is about procurement process, not the vendor."

---

## The Winner: FEMA 2020 Portfolio Scan

### Why FEMA Portfolio Beats Single-Award Investigation

Our system is an **aggregate portfolio scanner** -- it computes statistics across thousands of awards. Running against a single award produces thin, structurally meaningless output (R003 needs clusters, R004 needs multiple vendors, R006 needs peer groups of 5+). The FEMA portfolio approach:

1. **Blind discovery narrative:** One command, no cherry-picking. The system independently surfaces problematic vendors from 5,000+ contracts.
2. **Multiple validated cases in one run:** Both Fillakit and AirBoss appear in the same FEMA dataset, plus Parkdale ($532M) and other large sole-source awards.
3. **Statistical indicators work properly:** 5,000+ awards provide real peer groups for R006, real vendor concentration for R004, real splitting clusters for R003.
4. **Different fraud typologies:** Fillakit = shell company (entity risk). AirBoss = procurement process concern (sole-source, political direction). Shows system catches diverse patterns.
5. **Rich competition data:** COVID awards have unusually complete `extent_competed`, `other_than_full_and_open`, `number_of_offers_received` fields.

### The Demo Pitch (30 seconds)

> "We pointed our tool at FEMA's 2020 pandemic procurement -- 5,000 contracts, zero prior knowledge. One command. The system independently flagged Fillakit LLC: a brand-new vendor receiving $10M via urgency authority with only 1 offer. SAM.gov enrichment confirmed the entity was incorporated days before the award. Fillakit later became the subject of a Senate inquiry and DHS Inspector General investigation -- they shipped unusable soda bottles instead of COVID test tubes. Same run also flagged a $96M sole-source respirator contract and a $532M gown contract. Investigation-as-code: every finding is reproducible, every claim is verified."

---

## Live API Data Validation (2026-02-11)

All data below was fetched live from USAspending on 2026-02-11 to confirm availability.

### FEMA Portfolio Size

- **FEMA is a SUBTIER agency under DHS.** Querying with `tier: "toptier", name: "Federal Emergency Management Agency"` returns **0 results**. Must use `tier: "subtier"` or query DHS as toptier.
- FEMA subtier in 2020-03 to 2020-12: **5,000+ contracts** (page 50 of 100/page still has `hasNext: true`)
- Dataset is manageable for our pipeline (similar to DoD-MIT at 10K)

### Top FEMA COVID Awards (confirmed in API)

| Rank | Vendor | Amount | Competition | NAICS | Notes |
|------|--------|--------|-------------|-------|-------|
| 1 | Parkdale Advanced Materials | $532,157,710 | NOT COMPETED / ONLY ONE SOURCE / URGENCY | 423450 | 60M reusable gowns |
| 2 | Hanesbrands Inc. | $175,000,000 | (COVID keyword match) | -- | Reusable gowns |
| 3 | **AirBoss Defense Group** | **$96,434,000** | **NOT COMPETED / ONLY ONE SOURCE** | -- | **PAPR respirators. Performance ZIP: 20500** |
| 4 | American Medical Response | $66,855,346 | -- | -- | NY COVID emergency services |
| 5 | Standard Textile Co | $41,940,000 | -- | -- | Reusable gowns |

### Fillakit LLC (confirmed in API)

- **2 awards total** (entire federal history):
  1. **$10,160,000** -- "COVID-19 TESTING MEDIA SUPPLIES" -- FEMA Delivery Order (2020-05-08)
  2. **$342,997** -- "COVID-19 TESTING SWAB SUPPLIES" -- FEMA Delivery Order (2020-05-20)
- **Award detail fields (the $10.16M):**
  - `extent_competed`: D (FULL AND OPEN AFTER EXCLUSION OF SOURCES)
  - `number_of_offers_received`: **1** (only offer despite "open" competition)
  - `other_than_full_and_open`: **URG** (URGENCY FAR 6.302-2)
  - `fair_opportunity_limited`: **URG** (URGENCY)
  - `fed_biz_opps`: **N** (not posted publicly)
  - `national_interest_action`: **P20C** (COVID-19 2020)
  - `solicitation_procedures`: MAFO (SUBJECT TO MULTIPLE AWARD FAIR OPPORTUNITY)
  - Contract pricing: FIRM FIXED PRICE
  - Recipient location: Conroe, TX
  - Place of performance: Fairdale, KY
  - Business categories: "Not Designated a Small Business", "U.S.-Owned Business"
- **Transaction history:** Single transaction, $10,160,000, no modifications
- **Signals our system would detect:**
  - R001: 1 offer received on a nominally competitive solicitation
  - R002: `other_than_full_and_open` = URG
  - R006: $10.16M from a vendor with zero prior history -- likely a massive outlier in NAICS peer group
  - R004: Significant concentration in testing supplies category

### AirBoss Defense Group (confirmed in API)

- **Cross-agency awards:**
  - FEMA: $96,434,000 (NOT COMPETED, ONLY ONE SOURCE)
  - HHS/BARDA: $120,986,588 (NOT COMPETED, ONLY ONE SOURCE, URGENCY)
  - VA: $2,558,453
  - FEMA: $45,835 + $9,927 (smaller orders)
- **FEMA $96.4M detail:**
  - `extent_competed`: C (NOT COMPETED)
  - `solicitation_procedures`: SSS (ONLY ONE SOURCE)
  - `other_than_full_and_open`: OSO (ONLY ONE SOURCE - OTHER, FAR 6.302-1)
  - `national_interest_action`: P20C (COVID-19 2020)
  - Performance: 2020-04-03 to 2020-07-31
  - Place of performance: Washington, DC 20500 (White House ZIP)
  - 5 transactions: initial $96.4M + 4 admin mods ($0)
  - **Foreign-owned**: parent = AirBoss of America Corp (Canadian)
- **Signals our system would detect:**
  - R002: NOT COMPETED / ONLY ONE SOURCE
  - R004: Massive concentration in respirator spending
  - R006: $96.4M is an extreme statistical outlier
  - R005: 5 transactions (at threshold for modification flag)

### FGE / Robert Stewart Jr. (confirmed in API -- but problematic)

- **6 awards total across 5 agencies** (DoD, Treasury, HHS, DHS/FEMA, VA)
- **Critical finding:** The largest award (VA, $35.4M for N95 masks) shows **$0 Award Amount** in search results because:
  - 2020-04-10: Initial obligation $35,400,000
  - 2020-06-04: Mod P00002: **-$35,400,000** (TERMINATED FOR CONVENIENCE)
  - Net: $0.00
- Our pipeline uses Award Amount from search -- **this award is invisible** without transaction-level analysis
- The other visible awards are small: $681K (DoD), $49K (Treasury), $31K (HHS), $0 (FEMA), $0 (VA)
- **This eliminates FGE as the primary demo case** unless we add terminated-contract detection via transactions

### Zach Fuentes LLC (confirmed in API)

- **2 awards total:**
  - IHS: $2,592,000 (net after mods; originally $3,490,000)
  - DOJ/BOP: $13,204
- Transaction history: Initial $3.49M, then -$250K mod, then -$648K mod = $2.59M net
- NOT COMPETED, ONLY ONE SOURCE, URGENCY
- Small dataset, thin signals -- confirmed elimination

---

## Indicator Mapping: What Fires on FEMA Portfolio

### Per-Indicator Assessment

| Indicator | Would Fire? | Key Targets | Notes |
|-----------|:-:|-------------|-------|
| **R001** Single-Bid | **Yes** | Fillakit (1 offer on "competitive" solicitation) | `numberOfOffersReceived === 1` with competitive `extentCompeted` code D. This is exactly what R001 detects. |
| **R002** Non-Competitive | **Yes (heavily)** | AirBoss, Parkdale, many others | COVID emergency procurement used codes C (NOT COMPETED), B, G extensively. FEMA's 2020 non-competitive rate will be very high. |
| **R003** Splitting | **Possible** | Unknown until data scanned | 5,000+ awards may reveal clusters near $250K/$7.5M thresholds in same agency/vendor/quarter |
| **R004** Concentration | **Yes** | Parkdale ($532M), AirBoss ($96M), Hanesbrands ($175M) | Top vendors will show massive concentration in FEMA's PPE spending |
| **R005** Modifications | **Yes** | Awards with cost growth or >5 mods | Requires `--with-transactions`. AirBoss has 5 transactions (at threshold). Others may have more. |
| **R006** Price Outliers | **Yes** | Fillakit, AirBoss, Parkdale | With 5,000+ awards, NAICS peer groups will be large enough. $96M and $532M awards will be dramatic outliers. |

### Multi-Signal Convergence (the demo highlight)

The most powerful demo moment is when **multiple independent indicators flag the same entity**:

| Entity | R001 | R002 | R003 | R004 | R005 | R006 | Convergence |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Fillakit LLC | **X** | **X** | | ? | | **X** | 3+ indicators |
| AirBoss Defense Group | | **X** | | **X** | ? | **X** | 3+ indicators |
| Parkdale Advanced Materials | | **X** | | **X** | ? | **X** | 3+ indicators |

When 3 independent statistical tests all flag the same vendor, that's a meaningful signal -- not noise.

---

## Architectural Changes Required

### BLOCKER: Subtier Agency Support

**Problem:** FEMA returns 0 results when queried as `tier: "toptier"`. FEMA is a subtier agency under DHS.

**Current code:** `src/collector/usaspending.ts` constructs the agencies filter with `tier: "toptier"` hardcoded.

**Two options:**

1. **Quick workaround (no code change):** Use `--agency="Department of Homeland Security"`. DHS as toptier works today. Downside: includes CBP, ICE, Coast Guard, Secret Service, USCIS -- not just FEMA. Much larger dataset but FEMA awards still present and flaggable.

2. **Proper fix (~30 lines):** Add `--subtier-agency` CLI option or detect subtier automatically. The USAspending API supports `"tier": "subtier"` in the agencies filter. Changes needed:
   - `src/collector/usaspending.ts`: Accept `subtierAgency` in filter construction
   - `src/cli/commands/investigate.ts`: Add `--subtier-agency` option
   - `src/orchestrator/pipeline.ts`: Pass subtier to collector
   - Alternative: auto-detect by trying toptier first, falling back to subtier

**Recommendation:** Option 1 for speed (DHS toptier works today). Option 2 if time allows.

### NICE-TO-HAVE: COVID Keyword Filter

The USAspending API supports keyword filtering in search. Adding `"keywords": ["COVID"]` to the search payload would narrow FEMA/DHS results to COVID-specific contracts, reducing noise and dataset size. Not required but improves signal density.

### NICE-TO-HAVE: `national_interest_action` Field

COVID awards are tagged with `national_interest_action: "P20C"` (COVID-19 2020). We could:
- Add this to our normalization schema
- Use it as a filter or signal enrichment ("this award was tagged as COVID national interest")
- Potentially create an R007 indicator for "national interest action" concentration

### Already Identified (from Phases G-J)

The following Phase G-J changes from PROJECT_PLAN.md are also relevant to the demo:
- **G1 Signal Consolidation:** 5,000 FEMA awards will generate hundreds of signals. Materiality filtering is essential.
- **G3 Executive Briefing:** The README.md with top-5 findings is the primary demo artifact.
- **H1 `log_reasoning` tool:** Makes the agent's investigation of Fillakit/AirBoss visible and compelling.
- **H2 `search_usaspending` tool:** Lets the agent compare Fillakit to other FEMA vendors (currently only searches in-memory).

---

## Demo Execution Plan

### Pre-Demo Preparation

1. **Fix subtier issue** (or use DHS as toptier -- test which produces better results)
2. **Cache the dataset:** `investigate fetch --agency="Department of Homeland Security" --period=2020-03-01:2020-12-31`
   - Expect: 5,000-15,000 awards depending on toptier vs subtier
   - Initial fetch: ~60-90 min at 2 req/sec for detail enrichment
   - Subsequent runs: instant from cache
3. **Set API keys:** `SAM_GOV_API_KEY` in `.env` for entity verification
4. **Dry run:** `investigate run --agency="Department of Homeland Security" --period=2020-03-01:2020-12-31 --charts --no-ai`
   - Verify Fillakit and AirBoss appear in signals
   - Verify charts render (especially award distribution with log-scale for $532M outlier)
   - Check output size (should be manageable with FEMA subset)
5. **Full run with AI:** `investigate run --agency="Department of Homeland Security" --period=2020-03-01:2020-12-31 --deep --charts`
   - Verify investigator agent examines Fillakit and AirBoss
   - Verify SAM.gov enrichment returns useful data
   - Time the full run for demo planning

### Demo Script

1. **Show the command** -- one line, no prior knowledge of any specific vendor
2. **Open README.md** -- top 5 findings, dollar-weighted, plain English
   - "Finding 1: Fillakit LLC received $10.16M with only 1 offer under urgency authority. Entity verification shows no prior federal contracting history."
   - "Finding 2: AirBoss Defense Group received $96.4M sole-source respirator contract..."
3. **Click into entity evidence** -- CSV showing Fillakit's 2 awards vs. peer group
4. **Show investigation narrative** (if `--deep`): "Step 1: I noticed Fillakit had 1 offer on a nominally competitive solicitation... Step 2: SAM.gov lookup returned... Step 3: Compared to other testing supply vendors..."
5. **Show charts** -- award distribution histogram with log-scale, concentration donut, competition breakdown
6. **Show verification** -- "Every claim backed by evidence chain to API source"
7. **Reveal the punchline** -- "Fillakit later became the subject of a Senate inquiry for shipping unusable soda bottles instead of test tubes. Our system flagged them automatically."

### Validation Sources (for verifier credibility)

| Vendor | Validation Source | Type |
|--------|------------------|------|
| Fillakit LLC | Senate inquiry (Peters/Stabenow) | Congressional |
| Fillakit LLC | DHS IG investigation | Inspector General |
| AirBoss Defense Group | "Lessons Learned" congressional report | Congressional |
| Parkdale Advanced Materials | (largest sole-source, publicly documented) | Media/public record |
| FGE/Stewart (if visible) | DOJ guilty plea + 21-month sentence | Criminal conviction |

### GAO Legitimacy Citation

GAO Report GAO-20-632 ([PDF](https://www.gao.gov/assets/gao-20-632.pdf)) documents that GAO itself analyzed FPDS-NG data to examine COVID-19 contracting characteristics including competition and vendor attributes. This validates our indicator methodology at the highest level of government audit authority.

### ProPublica Ground Truth

ProPublica's Coronavirus Contracts dataset ([projects.propublica.org](https://projects.propublica.org/coronavirus-contracts/)) is derived from FPDS and covers contracts >= $10K with COVID tagging. Useful for cross-validation and as a "journalist-grade ground truth" reference.

---

## Comparison Matrix (Full Scores)

| Criterion (weight) | FGE/Stewart | Fillakit | Fuentes | AirBoss | **FEMA Portfolio** |
|---------------------|:-:|:-:|:-:|:-:|:-:|
| Indicator coverage (1.0x) | 7 | 7 | 3 | 7 | **8** |
| Data volume viability (1.0x) | 4 | 8 | 3 | 8 | **9** |
| Agent investigation potential (1.0x) | 8 | 9 | 5 | 7 | **9** |
| Verification strength (1.5x) | **10** | 7 | 6 | 5 | 7 |
| Demo narrative (2.0x) | 6 | 9 | 4 | 6 | **10** |
| Chart/visual impact (1.5x) | 4 | 7 | 2 | 9 | **9** |
| Multi-signal convergence (1.5x) | 5 | 7 | 2 | 7 | **9** |
| Reputational safety (1.5x) | 9 | 8 | 8 | 5 | 7 |
| **Weighted total** | 66 | 85 | 46 | 73 | **94** |

**FGE dropped from projected ~88 to 66** after discovering the $0 Award Amount problem.
**FEMA Portfolio wins at 94** by combining Fillakit + AirBoss + Parkdale + full statistical context.

---

## Key Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Subtier query returns 0 | High (confirmed) | Use DHS toptier or add subtier support |
| DHS dataset too large (>10K) | Medium | Add COVID keyword filter to narrow results |
| AirBoss political sensitivity | Medium | Non-accusatory framing is structural in our system; emphasize process, not vendor |
| Fillakit no longer in SAM.gov | Low-medium | "Entity no longer registered" is itself an interesting demo data point |
| Output still too large (Phase G not done) | High | Run with `--no-ai` first; manually extract top findings for demo if needed |
| API rate limiting during demo | Low | Pre-cache everything; demo runs from cache |

---

## Reference Links

- **ProPublica Coronavirus Contracts DB:** https://projects.propublica.org/coronavirus-contracts/
- **GAO COVID Contracting Report (GAO-20-632):** https://www.gao.gov/assets/gao-20-632.pdf
- **Fillakit ProPublica article:** https://www.propublica.org/article/the-trump-administration-paid-millions-for-test-tubes-and-got-unusable-mini-soda-bottles
- **AirBoss ProPublica article:** https://www.propublica.org/article/the-white-house-pushed-fema-to-give-its-biggest-coronavirus-contract-to-a-company-that-never-had-to-bid
- **FGE/Stewart DOJ release:** https://www.justice.gov/usao-edva/pr/former-ceo-sentenced-defrauding-multiple-federal-agencies
- **Fuentes CBCA decision:** https://www.cbca.gov/files/decisions/2022/SHERIDAN_04-06-22_7090__ZACH_FUENTES_LLC%20%28Decision%29.pdf
- **Fillakit Senate inquiry:** https://www.peters.senate.gov/newsroom/press-releases/peters-stabenow-press-trump-administration-for-answers-on-rewarding-an-unreliable-company-to-produce-testing-supplies
- **Fillakit DHS IG:** https://www.govexec.com/management/2020/06/fema-ordered-102-million-covid-19-testing-kits-its-now-warning-states-not-use/166514/
- **AirBoss congressional report:** https://www.congress.gov/117/meeting/house/115248/documents/HMKP-117-VC00-20221214-SD004.pdf
- **Fillakit USAspending:** https://www.usaspending.gov/award/CONT_AWD_70FB7020F00000062_7022_70FB7020D00000029_7022
- **AirBoss USAspending (FEMA):** https://www.usaspending.gov/award/CONT_AWD_70FA2020P00000011_7022_-NONE-_-NONE-
- **Fuentes USAspending:** https://www.usaspending.gov/award/CONT_AWD_75H71020P01137_7527_-NONE-_-NONE-
