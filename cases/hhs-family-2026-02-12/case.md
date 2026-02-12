# Investigation Case File: Department of Health and Human Services → Family Endeavors
## Period: 2021-01-01 to 2022-12-31

**[Open Interactive Dashboard](dashboard.html)** for charts, sortable tables, and visual evidence.

> **Disclaimer:** This report is a screening instrument. Red flags are
> indicators that warrant further investigation by competent authorities.
> They are **not proof of wrongdoing**. Unusual patterns may have legitimate
> explanations. (OECD Guidelines for Fighting Bid Rigging, 2025; OCP Red
> Flags Guide, 2024)

## Executive Summary

Between January 2021 and December 2022, the Department of Health and Human Services awarded Family Endeavors, Inc. three contracts totaling approximately $2.01 billion, with all three awards executed through non-competitive procedures. This procurement pattern represents 100% non-competitive contracting with a single vendor over the two-year period, a level of sole-source reliance that warrants additional review of the justification documentation and competitive feasibility assessments. The dollar magnitude—exceeding $2 billion—and complete absence of competitive awards in this vendor relationship suggests this case merits examination of whether emergency authorities or unique capability determinations were appropriately applied. This screening identifies the pattern for further administrative review to ensure compliance with federal competition requirements.

**1 signals detected** across 6 indicators:
- High severity: 1
- Medium severity: 0
- Low severity: 0

## Material Findings

1 findings ranked by materiality (dollar exposure × severity × signal count):

### F-R002-FAMIL-ENDEA-NONCOMP: Non-Competitive Awards — FAMILY ENDEAVORS, INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $2,013,664,365.4 | **Awards:** 3

**Condition:** 100.0% of awards (by count) to FAMILY ENDEAVORS, INC. were non-competitive, totaling $2,013,664,365.4 across 3 awards.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $2,013,664,365.4 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

## Investigation Notes

*The Opus 4.6 investigative agent recorded the following reasoning during its analysis:*

> **[Hypothesis]** The dataset shows 3 awards totaling over $2 billion to FAMILY ENDEAVORS, INC., all non-competitive, from a single agency. The entity context mentions "CHILD AND YOUTH SERVICES" which suggests HHS/ACF (Administration for Children and Families) based on the award ID prefix "75ACF". This is an extraordinarily large sum for a single nonprofit entity receiving sole-source awards. Key questions:
1. What is FAMILY ENDEAVORS, INC.? Is it a legitimate social services organization? What is its SAM.gov registration status?
2. What are these specific awards for? The timing (2021-2022) coincides with the migrant surge at the US-Mexico border and potential emergency shelter needs.
3. Is $2B reasonable for this type of work? Were there emergency/urgency justifications?
4. Are there sub-awards showing pass-through to other organizations?
5. Does this entity appear on any sanctions or exclusion lists?
6. What do comparable awards look like — do other entities receive similar non-competitive awards from ACF?

Initial assessment: The 100% non-competitive rate and $2B value are significant red flags on their face, but the timing and agency context (ACF during the 2021 border surge) may provide legitimate justification. Family Endeavors was widely reported in media as receiving emergency contracts for migrant shelter services.

> **[Analysis]** Excellent — the award details reveal critical context:

1. **Award 75ACF122C00016** ($1.3B): Influx Care Facility in Pecos, TX for ORR. Not competed, justification: "UNQ" (unique source). This is the largest award. Start date May 2022, appears to be a follow-on.

2. **Award 75ACF121P00005** ($714M): Emergency Intake Site and wraparound care for ORR Unaccompanied Children's Program in Pecos, TX. Not competed under SAP, justification: "SP2" (unusual and compelling urgency per SAP). Started March 2021 — this aligns exactly with the spring 2021 border surge.

3. **Award 75ACF121C00015** ($757K): 20 Youth Care Workers for direct supervision of children. Not competed, justification: "URG" (urgency). Very short period (March-June 2021). This was clearly an emergency staffing need.

Key observations:
- All awards relate to HHS/ACF Office of Refugee Resettlement (ORR) unaccompanied children program
- Pecos, TX location is consistent with the well-documented 2021 border crisis emergency facilities
- The justifications vary: urgency (URG), unique source (UNQ), and SAP urgency (SP2)
- The progression suggests: emergency start (March 2021 small staffing contract + larger purchase order), then a follow-on definitive contract in 2022
- Sanctions screening: NO match found — clean
- SAM.gov: Rate limited, need to retry
- NAICS codes: 624110 (Child and Youth Services) and 624230 (Emergency and Other Relief Services)

The pattern of non-competition has a plausible explanation: these were emergency procurements during the 2021 unaccompanied minor crisis. However, the follow-on in 2022 for $1.3B using "unique source" rather than urgency is worth examining — by May 2022, the initial urgency may have subsided enough to allow competition.

I need to:
1. Retry SAM.gov entity verification
2. Look at sub-awards for the large contracts
3. Find comparable awards to benchmark — did other ORR emergency shelter providers also get non-competitive awards?

> **[Analysis]** Sub-award data returned empty for both large contracts. This could mean:
1. Sub-award reporting was not required or not yet submitted
2. Family Endeavors performed the work directly without significant subcontracting
3. Data reporting gaps (sub-award reporting has known coverage limitations)

The lack of sub-award data is itself notable for contracts of this magnitude ($1.3B and $714M). For contracts this large, it would be unusual for there to be zero subcontractors, suggesting either a reporting gap or that the entity was performing extensive direct services.

SAM.gov is still rate-limited. The comparable awards search returned no results from the in-memory dataset (which only contains 3 awards), so I need to broaden my search. Let me try the USAspending API for broader comparable data.

Let me also check the statistical patterns in the dataset and try a broader comparable search.

> **[Analysis]** The comparable awards search returns no results because it's searching the in-memory dataset which only contains these 3 awards. The statistical analysis confirms:
- All 3 awards are non-competitive (2 coded "C" = Not Competed, 1 coded "G" = Not Competed under SAP)
- Mean award amount is $671M with high standard deviation ($531M)
- No statistical outliers flagged within this small 3-award dataset (too few data points)

Let me try one more time with SAM.gov and also attempt a broader comparable search with different parameters. I also want to note what I've learned from the award details about the justification codes:

Award progression:
1. March 2021: $757K for 20 Youth Care Workers (URG - urgency) - 75-day period
2. March 2021: $714M for Emergency Intake Site and wrap-around care (SP2 - SAP urgency) - extended to Feb 2025
3. May 2022: $1.3B for Influx Care Facility continuation (UNQ - unique source) - through Nov 2023

The shift from "urgency" to "unique source" justification between 2021 and 2022 is analytically significant. By 2022, the initial emergency justification may have been harder to sustain, so the justification shifted to "only one responsible source" — potentially because Family Endeavors had already established the facility and built institutional knowledge, making them the de facto sole source.

This is a well-documented pattern in government contracting: emergency awards create incumbency advantages that perpetuate non-competitive follow-ons. The question is whether ACF made adequate efforts to transition to competitive procurement.

> **[Analysis]** SAM.gov continues to be rate-limited, so I cannot verify the entity registration. However, I can note that:
- The exclusions search also returned empty/rate-limited, not a positive hit
- The sanctions screening returned NO match (score: 0)
- The concentration analysis shows HHI of 0.54 (which is expected since there's only 1 recipient in this dataset — HHI = 1.0 for a monopoly, so 0.54 represents the distribution across the 3 awards by size)

Let me now attempt to summarize what I know and create formal findings. Let me also try one more entity search approach.

## Data Overview

- **Source:** USAspending API (snapshot: 2026-02-12)
- **Agency:** Department of Health and Human Services
- **Recipient:** Family Endeavors
- **Period:** 2021-01-01 to 2022-12-31
- **Award types:** A, B, C, D

## Data Scope & Interpretation

- **Award amounts** shown are cumulative contract values from inception, not spending within the queried period alone.
- The **time_period** filter (2021-01-01 to 2022-12-31) selects awards with activity during this period; awards may have start dates outside this range.
- **Recipient filter active** (`Family Endeavors`): all metrics (concentration, peer groups, competition rates) reflect only this recipient's awards, not the full agency portfolio.
- **Agency filter active** (`Department of Health and Human Services`): metrics are scoped to this agency's awards only.

## Signals Detected

| # | Indicator | Severity | Entity | Value | Context |
|---|-----------|----------|--------|-------|---------|
| 1 | Non-Competitive Awards (R002) | **HIGH** | FAMILY ENDEAVORS, INC. | 100 | 3 of 3 awards (100.0%) to FAMILY ENDEAVORS, INC. were non-competitive. Non-compe... |

## Hypotheses & Evidence

### H-R002-FAMILY E: Does the pattern of non-competitive awards to FAMILY ENDEAVORS, INC. warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

**Refined Analysis:**

All three awards to Family Endeavors, Inc., totaling approximately $2.01 billion, were executed non-competitively, representing 100% of the contracting portfolio with this vendor. This concentration could reflect legitimate urgent operational needs—such as emergency humanitarian services requiring immediate mobilization of established providers with specialized facilities and clearances—or statutory authorities permitting sole-source awards under specific circumstances. However, the pattern raises questions about whether competitive alternatives were adequately explored, particularly for follow-on awards, or if market research identified this vendor as genuinely unique across all three procurements. 

**Recommended Next Steps:** Reviewers should examine the Justification & Approval (J&A) documentation for each award to verify the stated rationale, assess whether urgency or unique capability claims were substantiated, and determine if the procuring agency conducted periodic market research to confirm ongoing lack of viable competitors.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-FAMIL-ENDEA-NONCOMP-competition-breakdown.csv) -- Breakdown of 3 awards by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-FAMIL-ENDEA-NONCOMP-non-competed-awards.csv) -- 3 non-competed awards sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

## Investigator Findings

*Opus 4.6 agent completed 10 iteration(s) with 21 tool call(s).*

Investigation completed after 10 iterations (max iterations reached). 21 tool calls executed.

## Data Quality & Coverage

| Indicator | Records with Required Fields | Coverage |
|-----------|----------------------------|----------|
| R001 Single-Bid Competition | 3/3 | 100% |
| R002 Non-Competitive Awards | 3/3 | 100% |
| R003 Contract Value Splitting | 3/3 | 100% |
| R004 Vendor Concentration | 3/3 | 100% |
| R005 Excessive Modifications | 0/3 | 0% |
| R006 Price Outliers | 3/3 | 100% |

**Notes:**
- `number_of_offers_received` has poor fill rates in USAspending data, limiting R001 coverage.
- R005 (Modifications) requires transaction data fetched with `--with-transactions` flag.
- R004 (Concentration) signals for the filtered recipient are suppressed as structurally inevitable.

## Methodology

Indicators are based on the Open Contracting Partnership's [Red Flags in Public
Procurement](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) (2024)
and the OECD's [Guidelines for Fighting Bid Rigging](https://www.oecd.org/en/publications/2025/09/) (2025).

**Thresholds used:**
- R001: severityThreshold=0.2
- R002: codesToFlagCount=4
- R003: bandWidthPct=0.1, minClusterSize=3, threshold_0=250000, threshold_1=7500000
- R004: vendorShareThreshold=0.3, spikeThreshold=0.15
- R005: maxModificationCount=5, maxGrowthRatio=2
- R006: minGroupSize=5, iqrMultiplier=1.5

## Provenance

- **Generated:** 2026-02-12T22:04:25.782Z
- **Tool version:** 0.1.0
- **Git commit:** 5ddf8bce162a7afe61265fe5e0f706f40888699c
- **Node.js:** v20.19.4

---
*Generated by Procurement Investigator (Investigation-as-Code)*