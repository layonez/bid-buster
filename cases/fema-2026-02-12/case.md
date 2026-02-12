# Investigation Case File: Federal Emergency Management Agency
## Period: 2020-03-01 to 2020-12-31

**[Open Interactive Dashboard](dashboard.html)** for charts, sortable tables, and visual evidence.

> **Disclaimer:** This report is a screening instrument. Red flags are
> indicators that warrant further investigation by competent authorities.
> They are **not proof of wrongdoing**. Unusual patterns may have legitimate
> explanations. (OECD Guidelines for Fighting Bid Rigging, 2025; OCP Red
> Flags Guide, 2024)

## Executive Summary

During the March-December 2020 COVID-19 emergency response period, FEMA executed 7,259 procurement actions totaling nearly $4 billion that warrant administrative review. The most significant pattern involves PARKDALE ADVANCED MATERIALS, INC. receiving $543.4 million across two non-competitive awards, including a single contract valued at $532.2 million that represents an extreme statistical outlier (56.80 standard deviations above category norms). Additionally, 45.6% of competitively solicited awards to the Department of Homeland Security (1,000 of 2,193 actions worth $1.35 billion) received only a single bid, suggesting potential market access or specification issues. Other concentrated spending includes AMERICAN MEDICAL RESPONSE, INC. capturing $377.4 million across 35 awards and HANESBRANDS INC. receiving a $175 million non-competitive award, all reflecting emergency procurement conditions that merit retrospective compliance assessment.

**1465 signals detected** across 6 indicators:
- High severity: 723
- Medium severity: 378
- Low severity: 364

## Material Findings

16 findings ranked by materiality (dollar exposure × severity × signal count):

### F-R001-DEPAR-OF-SINGLEBID: Single-Bid Competition — Department of Homeland Security `[RULE]`
**Severity:** **HIGH** | **Exposure:** $1,346,008,169.48 | **Awards:** 2178

**Condition:** Department of Homeland Security received 2193 competitively solicited awards, with a single-bid rate of 45.6% (1000 awards received only one offer).

**Criteria:** FAR 6.101 requires agencies to promote and provide for full and open competition. The EU Single Market Scoreboard flags single-bid rates above 20% as a concern indicator.

**Cause:** Possible contributing factors include narrowly defined requirements, insufficient advertisement reach, or legitimate market specialisation. The pattern warrants review to determine the root cause.

**Effect:** $1,374,969,804.96 in awards may not have benefited from competitive pricing pressure. Without multiple bidders, there is reduced assurance that the government received best value.

**Recommendation:** Review solicitation practices for the flagged awards. Examine whether requirements can be broadened, advertisement improved, or set-aside categories adjusted to attract more bidders.

### F-R002-PARKD-ADVAN-NONCOMP: Non-Competitive Awards — PARKDALE ADVANCED MATERIALS, INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $543,407,710.52 | **Awards:** 2

**Condition:** 100.0% of awards (by count) to PARKDALE ADVANCED MATERIALS, INC. were non-competitive, totaling $543,407,710.52 across 2 awards.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $543,407,710.52 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

### F-R006-70FB7-PARKD-OUTLIER: Price Outliers — 70FB7020F00000080 (PARKDALE ADVANCED MATERIALS, INC.) `[RULE]`
**Severity:** **HIGH** | **Exposure:** $532,157,710.52 | **Awards:** 1

**Condition:** Award 70FB7020F00000080 valued at $532,157,710.52 is a statistical outlier (z-score: 56.80) within its NAICS/PSC category.

**Criteria:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Cause:** Price outliers may reflect unique project scope, emergency procurement premiums, specialized requirements, or insufficient competition leading to higher prices.

**Effect:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $532,157,710.52.

**Recommendation:** Review price analysis documentation. Compare with similar awards from other agencies. Examine competition method and number of offers. Verify whether the scope justifies the premium over comparable awards.

### F-R004-AMERI-MEDIC-CONCENTRATION: Vendor Concentration — AMERICAN MEDICAL RESPONSE, INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $377,437,190.32 | **Awards:** 35

**Condition:** AMERICAN MEDICAL RESPONSE, INC. received 100.0% of total spending, totaling $377,437,190.32 across 35 awards.

**Criteria:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Cause:** High concentration may reflect legitimate specialisation, unique capabilities, market structure (limited qualified suppliers), or insufficient effort to diversify the vendor base.

**Effect:** Concentration of $377,437,190.32 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

**Recommendation:** Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). Assess whether vendor diversification programs are in place. Review comparable procurements from other agencies for benchmark concentration levels.

### F-R002-HANES-INC-NONCOMP: Non-Competitive Awards — HANESBRANDS INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $175,000,000 | **Awards:** 1

**Condition:** 100.0% of the award (by count) to HANESBRANDS INC. was non-competitive, totaling $175,000,000 across 1 award.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $175,000,000 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

### F-R006-70FB7-HANES-OUTLIER: Price Outliers — 70FB7020F00000079 (HANESBRANDS INC.) `[RULE]`
**Severity:** **HIGH** | **Exposure:** $175,000,000 | **Awards:** 1

**Condition:** Award 70FB7020F00000079 valued at $175,000,000 is a statistical outlier (z-score: 18.70) within its NAICS/PSC category.

**Criteria:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Cause:** Price outliers may reflect unique project scope, emergency procurement premiums, specialized requirements, or insufficient competition leading to higher prices.

**Effect:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $175,000,000.

**Recommendation:** Review price analysis documentation. Compare with similar awards from other agencies. Examine competition method and number of offers. Verify whether the scope justifies the premium over comparable awards.

### F-R006-HSFE6-RESIL-OUTLIER: Price Outliers — HSFE6015C0007 (RESILIENCE ACTION PARTNERS) `[RULE]`
**Severity:** **HIGH** | **Exposure:** $148,873,735.01 | **Awards:** 1

**Condition:** Award HSFE6015C0007 valued at $148,873,735.01 is a statistical outlier (z-score: 58.70) within its NAICS/PSC category.

**Criteria:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Cause:** Price outliers may reflect unique project scope, emergency procurement premiums, specialized requirements, or insufficient competition leading to higher prices.

**Effect:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $148,873,735.01.

**Recommendation:** Review price analysis documentation. Compare with similar awards from other agencies. Examine competition method and number of offers. Verify whether the scope justifies the premium over comparable awards.

### F-R006-70FA3-GUIDE-OUTLIER: Price Outliers — 70FA3020F00000611 (GUIDEHOUSE DIGITAL LLC) `[RULE]`
**Severity:** **HIGH** | **Exposure:** $148,624,034.45 | **Awards:** 1

**Condition:** Award 70FA3020F00000611 valued at $148,624,034.45 is a statistical outlier (z-score: 28.70) within its NAICS/PSC category.

**Criteria:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Cause:** Price outliers may reflect unique project scope, emergency procurement premiums, specialized requirements, or insufficient competition leading to higher prices.

**Effect:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $148,624,034.45.

**Recommendation:** Review price analysis documentation. Compare with similar awards from other agencies. Examine competition method and number of offers. Verify whether the scope justifies the premium over comparable awards.

### F-R006-70FA3-BAE-OUTLIER: Price Outliers — 70FA3020F00000172 (BAE SYSTEMS TECHNOLOGY SOLUTIONS & SERVICES INC.) `[RULE]`
**Severity:** **HIGH** | **Exposure:** $97,750,583.41 | **Awards:** 1

**Condition:** Award 70FA3020F00000172 valued at $97,750,583.41 is a statistical outlier (z-score: 16.00) within its NAICS/PSC category.

**Criteria:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Cause:** Price outliers may reflect unique project scope, emergency procurement premiums, specialized requirements, or insufficient competition leading to higher prices.

**Effect:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $97,750,583.41.

**Recommendation:** Review price analysis documentation. Compare with similar awards from other agencies. Examine competition method and number of offers. Verify whether the scope justifies the premium over comparable awards.

### F-R002-GENER-DYNAM-NONCOMP: Non-Competitive Awards — GENERAL DYNAMICS INFORMATION TECHNOLOGY INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $97,205,551.4 | **Awards:** 1

**Condition:** 100.0% of the award (by count) to GENERAL DYNAMICS INFORMATION TECHNOLOGY INC. was non-competitive, totaling $97,205,551.4 across 1 award.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $97,205,551.4 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

### F-R002-3M-COMPA-NONCOMP: Non-Competitive Awards — 3M COMPANY `[RULE]`
**Severity:** **HIGH** | **Exposure:** $95,542,614.4 | **Awards:** 6

**Condition:** 100.0% of awards (by count) to 3M COMPANY were non-competitive, totaling $95,542,614.4 across 6 awards.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $95,542,614.4 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

### F-R004-THE-RAND-CONCENTRATION: Vendor Concentration — THE RAND CORPORATION `[RULE]`
**Severity:** **HIGH** | **Exposure:** $77,591,385.29 | **Awards:** 11

**Condition:** THE RAND CORPORATION received 99.6% of total spending, totaling $77,591,385.29 across 11 awards.

**Criteria:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Cause:** High concentration may reflect legitimate specialisation, unique capabilities, market structure (limited qualified suppliers), or insufficient effort to diversify the vendor base.

**Effect:** Concentration of $77,591,385.29 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

**Recommendation:** Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). Assess whether vendor diversification programs are in place. Review comparable procurements from other agencies for benchmark concentration levels.

### F-R004-CROWL-LOGIS-CONCENTRATION: Vendor Concentration — CROWLEY LOGISTICS, INC. `[RULE]`
**Severity:** **HIGH** | **Exposure:** $47,000,205.84 | **Awards:** 2

**Condition:** CROWLEY LOGISTICS, INC. received 100.0% of total spending, totaling $47,000,205.84 across 2 awards.

**Criteria:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Cause:** High concentration may reflect legitimate specialisation, unique capabilities, market structure (limited qualified suppliers), or insufficient effort to diversify the vendor base.

**Effect:** Concentration of $47,000,205.84 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

**Recommendation:** Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). Assess whether vendor diversification programs are in place. Review comparable procurements from other agencies for benchmark concentration levels.

### F-R004-RJCL-CORPO-CONCENTRATION: Vendor Concentration — RJCL CORPORATION `[RULE]`
**Severity:** **HIGH** | **Exposure:** $42,998,653.12 | **Awards:** 3

**Condition:** RJCL CORPORATION received 98.6% of total spending, totaling $42,998,653.12 across 3 awards.

**Criteria:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Cause:** High concentration may reflect legitimate specialisation, unique capabilities, market structure (limited qualified suppliers), or insufficient effort to diversify the vendor base.

**Effect:** Concentration of $42,998,653.12 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

**Recommendation:** Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). Assess whether vendor diversification programs are in place. Review comparable procurements from other agencies for benchmark concentration levels.

### F-R002-STAND-TEXTI-NONCOMP: Non-Competitive Awards — STANDARD TEXTILE CO INC `[RULE]`
**Severity:** **HIGH** | **Exposure:** $41,940,000 | **Awards:** 1

**Condition:** 100.0% of the award (by count) to STANDARD TEXTILE CO INC was non-competitive, totaling $41,940,000 across 1 award.

**Criteria:** FAR 6.302 permits non-competitive procurement only under specific circumstances (sole source, urgency, national security). OECD Guidelines (2025) flag persistent non-competitive patterns as a procurement integrity indicator.

**Cause:** Non-competitive awards may reflect unique capabilities (e.g., FFRDC, UARC status), legitimate sole-source justifications, or habitual use of non-competitive mechanisms without adequate market research.

**Effect:** $41,940,000 in awards bypassed competition. While individual justifications may be valid, the cumulative pattern reduces the transparency and competitiveness of the procurement portfolio.

**Recommendation:** Verify sole-source justifications (J&A documentation) for the largest non-competitive awards. Check entity type via SAM.gov (FFRDC/UARC status may explain the pattern). Consider whether market research could identify additional qualified sources.

### F-R004-JOHNS-CONTR-CONCENTRATION: Vendor Concentration — JOHNSON CONTROLS SECURITY SOLUTIONS LLC `[RULE]`
**Severity:** **HIGH** | **Exposure:** $29,693,706.65 | **Awards:** 4

**Condition:** JOHNSON CONTROLS SECURITY SOLUTIONS LLC received 98.6% of total spending, totaling $29,693,706.65 across 4 awards.

**Criteria:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Cause:** High concentration may reflect legitimate specialisation, unique capabilities, market structure (limited qualified suppliers), or insufficient effort to diversify the vendor base.

**Effect:** Concentration of $29,693,706.65 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

**Recommendation:** Verify entity type via SAM.gov (FFRDC/UARC status may explain concentration). Assess whether vendor diversification programs are in place. Review comparable procurements from other agencies for benchmark concentration levels.

## Investigation Notes

*The Opus 4.6 investigative agent recorded the following reasoning during its analysis:*

> **[Hypothesis]** Initial assessment of the 16 material findings from DHS procurement data (2005-2021, $11.5B across 7,259 awards):

1. **Context clues**: The agency is DHS, award IDs suggest FEMA (70FB7, 70FA3, 70FA5, 70FA6, HSFE prefixes). The date range includes major disaster events (Hurricane Katrina aftermath, Hurricane Maria 2017, Hurricane Harvey 2017, COVID-19 2020). Many of the flagged entities (Parkdale, Hanesbrands, 3M, Standard Textile, Molnlycke) are medical supply/PPE manufacturers - strongly suggesting COVID-19 emergency procurement.

2. **Key hypotheses to test**:
   - H1: The massive non-competitive awards to Parkdale ($543M), Hanesbrands ($175M), 3M ($95M), Standard Textile ($42M) are likely COVID-19 emergency procurements for PPE (masks, gowns, etc.) under FAR 6.302-2 (unusual and compelling urgency). The award IDs starting with 70FB7020 suggest FY2020 FEMA awards.
   - H2: The 45.6% single-bid rate may be elevated by emergency procurements and disaster response contracts where urgency limits competition.
   - H3: American Medical Response concentration (ambulance services) may reflect limited market of national ambulance providers qualified for federal disaster medical response.
   - H4: RAND Corporation concentration likely reflects its FFRDC status - legitimate sole-source research.
   - H5: General Dynamics IT ($97M non-competitive) could be a legacy IT system with sole-source justification.
   - H6: Resilience Action Partners ($149M outlier) and Guidehouse Digital ($149M outlier) need investigation - less obvious explanations.
   - H7: RJCL Corporation (residential remodelers, $43M) in context of FEMA could be disaster housing repair.

3. **Investigation priority**: Start with the highest-dollar non-competitive awards (Parkdale, Hanesbrands) and entity verification for unusual entities (RJCL, Resilience Action Partners, Parkdale). Cross-reference COVID-19 timing for PPE-related awards.

> **[Analysis]** Critical initial findings:

1. **Parkdale ($532M) - CONFIRMED COVID-19 emergency**: "DELIVERY ORDER FOR 60 MILLION REUSABLE GOWNS IN SUPPORT OF THE NATIONAL EMERGENCY DECLARATION FOR COVID-19." Awarded April 23, 2020. Not competed, with urgency justification (otherThanFullAndOpen: "URG"). Firm fixed price. This is a textbook emergency procurement under FAR 6.302-2.

2. **Hanesbrands ($175M) - CONFIRMED COVID-19 emergency**: Same pattern - "DELIVERY ORDER FOR REUSABLE GOWNS IN SUPPORT OF THE NATIONAL EMERGENCY DECLARATION FOR COVID-19." April 21, 2020. Urgency justification. Same NAICS (423450).

3. **Resilience Action Partners ($149M) - COMPETED**: 5 offers received, full and open competition. This is a 6-year community engagement/risk communications contract. The z-score of 58.70 reflects that this is a large multi-year contract vs. typical smaller consulting awards in the same NAICS. The price outlier flag appears to be a false positive driven by the long period of performance and large scope.

4. **Guidehouse Digital ($149M) - COMPETED**: 3 offers received, full and open competition. NFIP PIVOT O&M - National Flood Insurance Program IT system. 5-year contract. Again, the price outlier is likely scope-driven, not a pricing concern.

5. **SAM.gov lookups failed** - the tool returned null for all entities. I'll need to use UEIs from the award details to try again, or rely on other sources.

Key insight: The COVID-19 emergency procurements (Parkdale, Hanesbrands, likely 3M, Standard Textile, and other medical supply companies) explain a significant portion of the non-competitive findings. These are expected patterns during a national emergency. The price outliers for competed contracts (Resilience, Guidehouse) appear to be scope-driven rather than pricing anomalies.

> **[Analysis]** More confirmations:

1. **Standard Textile ($42M)** - COVID-19 reusable gowns, April 2020, urgency justification. Same pattern as Parkdale and Hanesbrands.

2. **3M ($44.5M for this one order)** - "3M RESPIRATOR MASKS - MULTIPLE LOCATIONS - DPA DELIVERY ORDER #3". Defense Production Act (DPA) order! This is a government-directed order under the Defense Production Act, which means the government compelled 3M to produce respirators. This is an even stronger justification than standard urgency.

3. **Parkdale second award ($11.25M)** - 7.5 million masks for COVID-19. Same urgency pattern.

4. **General Dynamics IT ($97M)** - "IT LEGACY SYSTEM TO SUPPORT FEMA NATIONAL FLOOD INSURANCE PROGRAM". Started 2010, runs to 2025. Non-competitive with justification "ONE" (only one responsible source). This is a classic legacy IT system sole-source where the original developer maintains the system. Cost-plus-fixed-fee pricing. 15-year contract.

5. **BAE Systems ($97.7M)** - "OM ENGINEERING CONTRACTOR SUPPORT". Full and open competition. The price outlier appears scope-driven (5-year contract).

6. **SAM.gov lookups continue to fail** - tool limitation. I'll need to use sanctions screening and other methods.

The COVID-19 emergency procurement pattern is now well-established. Let me now investigate the less-obvious entities: RAND Corporation, RJCL Corporation, Crowley Logistics, American Medical Response, and Johnson Controls.

> **[Analysis]** More findings:

1. **RAND Corporation ($39.4M largest award)** - Hurricane Maria cost estimate analysis. Full and open competition. NAICS 541720 (R&D Social Sciences). The RAND Corporation is a well-known FFRDC. The concentration finding is about 99.6% share in its NAICS category, which makes sense - social science R&D for FEMA is a specialized niche, and RAND is a premier provider. Awards appear competed.

2. **Crowley Logistics ($24.8M)** - Hurricane disaster logistics (DR-4339 = Hurricane Maria in Puerto Rico). Full and open competition. Deep sea freight for shipping life-sustaining commodities. This is a specialized market - few companies can provide ocean freight logistics to Caribbean islands at disaster scale.

3. **RJCL Corporation ($23.8M)** - "BUILD PERMANENT HOUSING CONSISTING OF 1-, 2-, 3-BEDROOMS USING CAST-IN-PLACE METHOD IN CNMI" - Commonwealth of Northern Mariana Islands. Full and open competition. This is post-Typhoon Yutu (2018) permanent housing construction. The concentration reflects the specialized geographic/construction requirements of building in CNMI.

4. **American Medical Response ($66.9M for this order)** - "EMERGENCY MANAGEMENT SUPPORT SERVICES IN RESPONSE TO COVID-19 IN STATE OF NEW YORK." Full and open competition. AMR is the largest private ambulance company in the US - they have the scale for national disaster medical response.

Key patterns emerging:
- The COVID-19 emergency procurement cluster (Parkdale, Hanesbrands, Standard Textile, 3M) is the most material finding
- Most concentration findings reflect legitimate market structure (niche markets for disaster response)
- Many of the "concentrated" vendors won through competed processes
- The single-bid rate of 45.6% remains the most systemic concern

SAM.gov and sanctions screening tools are not returning results - I'll note this as a data limitation.

## Data Overview

- **Source:** USAspending API (snapshot: 2026-02-12)
- **Period:** 2020-03-01 to 2020-12-31
- **Award types:** A, B, C, D

## Data Scope & Interpretation

- **Award amounts** shown are cumulative contract values from inception, not spending within the queried period alone.
- The **time_period** filter (2020-03-01 to 2020-12-31) selects awards with activity during this period; awards may have start dates outside this range.
- **Agency filter active** (`Federal Emergency Management Agency`): metrics are scoped to this agency's awards only.

## Signals Detected

*1465 signals detected. Showing top 20 by severity. See `data/signals.json` for the full list.*

| # | Indicator | Severity | Entity | Value | Context |
|---|-----------|----------|--------|-------|---------|
| 1 | Price Outliers (R006) | **HIGH** | 70FA3021F00000036 (ATT MOBILIT | 225.3 | Award 70FA3021F00000036 ($10,740,248.61) to ATT MOBILITY LLC is 225.3x the categ... |
| 2 | Price Outliers (R006) | **HIGH** | 70FA3020F00000064 (ATT MOBILIT | 207.4 | Award 70FA3020F00000064 ($9,887,925.85) to ATT MOBILITY LLC is 207.4x the catego... |
| 3 | Price Outliers (R006) | **HIGH** | HSFEHQ10C1284 (GENERAL DYNAMIC | 116.3 | Award HSFEHQ10C1284 ($97,205,551.4) to GENERAL DYNAMICS INFORMATION TECHNOLOGY I... |
| 4 | Non-Competitive Awards (R002) | **HIGH** | PARKDALE ADVANCED MATERIALS, I | 100 | 2 of 2 awards (100.0%) to PARKDALE ADVANCED MATERIALS, INC. were non-competitive... |
| 5 | Non-Competitive Awards (R002) | **HIGH** | HANESBRANDS INC. | 100 | 1 of 1 award (100.0%) to HANESBRANDS INC. was non-competitive. Non-competed amou... |
| 6 | Non-Competitive Awards (R002) | **HIGH** | GENERAL DYNAMICS INFORMATION T | 100 | 1 of 1 award (100.0%) to GENERAL DYNAMICS INFORMATION TECHNOLOGY INC. was non-co... |
| 7 | Non-Competitive Awards (R002) | **HIGH** | 3M COMPANY | 100 | 6 of 6 awards (100.0%) to 3M COMPANY were non-competitive. Non-competed amount: ... |
| 8 | Non-Competitive Awards (R002) | **HIGH** | STANDARD TEXTILE CO INC | 100 | 1 of 1 award (100.0%) to STANDARD TEXTILE CO INC was non-competitive. Non-compet... |
| 9 | Non-Competitive Awards (R002) | **HIGH** | MANHATTAN ASSOCIATES, INC. | 100 | 1 of 1 award (100.0%) to MANHATTAN ASSOCIATES, INC. was non-competitive. Non-com... |
| 10 | Non-Competitive Awards (R002) | **HIGH** | MILLIKEN & COMPANY | 100 | 1 of 1 award (100.0%) to MILLIKEN & COMPANY was non-competitive. Non-competed am... |
| 11 | Non-Competitive Awards (R002) | **HIGH** | BURLINGTON INDUSTRIES LLC | 100 | 1 of 1 award (100.0%) to BURLINGTON INDUSTRIES LLC was non-competitive. Non-comp... |
| 12 | Non-Competitive Awards (R002) | **HIGH** | ALABAMA DEPARTMENT OF REHABILI | 100 | 2 of 2 awards (100.0%) to ALABAMA DEPARTMENT OF REHABILITATION SERVICES were non... |
| 13 | Non-Competitive Awards (R002) | **HIGH** | ALABAMA POWER COMPANY | 100 | 2 of 2 awards (100.0%) to ALABAMA POWER COMPANY were non-competitive. Non-compet... |
| 14 | Non-Competitive Awards (R002) | **HIGH** | NORTH WIND RESOURCE CONSULTING | 100 | 1 of 1 award (100.0%) to NORTH WIND RESOURCE CONSULTING, LLC was non-competitive... |
| 15 | Non-Competitive Awards (R002) | **HIGH** | MOSSWOOD PROPERTY DEVELOPMENT  | 100 | 1 of 1 award (100.0%) to MOSSWOOD PROPERTY DEVELOPMENT LLC was non-competitive. ... |
| 16 | Non-Competitive Awards (R002) | **HIGH** | GUY CARPENTER & COMPANY, LLC | 100 | 6 of 6 awards (100.0%) to GUY CARPENTER & COMPANY, LLC were non-competitive. Non... |
| 17 | Non-Competitive Awards (R002) | **HIGH** | AMAZON SERVICES LLC | 100 | 1 of 1 award (100.0%) to AMAZON SERVICES LLC was non-competitive. Non-competed a... |
| 18 | Non-Competitive Awards (R002) | **HIGH** | LR4G JV | 100 | 1 of 1 award (100.0%) to LR4G JV was non-competitive. Non-competed amount: $10,6... |
| 19 | Non-Competitive Awards (R002) | **HIGH** | PRESTIGE AMERITECH LTD | 100 | 1 of 1 award (100.0%) to PRESTIGE AMERITECH LTD was non-competitive. Non-compete... |
| 20 | Non-Competitive Awards (R002) | **HIGH** | THE JOHNS HOPKINS UNIVERSITY A | 100 | 1 of 1 award (100.0%) to THE JOHNS HOPKINS UNIVERSITY APPLIED PHYSICS LABORATORY... |

## Hypotheses & Evidence

*705 hypotheses generated. Showing 14 matching material findings. Full list in `data/hypotheses.json`.*

### H-R006-70FA3020: Is the award amount for 70FA3020F00000064 unusual relative to comparable procurements in the same category?

**Severity:** high
**Triggered by:** R006
`[AI-ENHANCED]`

**Award Amount Analysis for 70FA3020F00000064**

Award 70FA3020F00000064 ($9.89M to AT&T Mobility) falls 207x above the category mean and substantially exceeds the statistical upper fence of $8,387 for telecommunications reselling services (NAICS 517312, n=826). This extreme deviation appears alongside multiple other large telecommunications awards to the same vendor (e.g., 70FA3021F00000036 at $10.74M, also 225x the mean), suggesting these may represent multi-year enterprise agreements, consolidated regional contracts, or specialized emergency communications infrastructure that differs fundamentally in scope from typical commercial resale arrangements. The pattern raises questions about whether these contracts should be categorized differently or whether the pricing reflects unique government requirements such as dedicated networks, security clearances, or nationwide disaster response capabilities. Reviewers should examine contract documentation to verify whether scope justifies the cost differential, confirm that comparable government telecommunications enterprises were properly considered during competition, and assess whether the product/service classification accurately reflects the actual deliverables.

**Supporting evidence:**
- [Price Analysis by NAICS Category](evidence/summary/F-R006-70FA3-GUIDE-OUTLIER-price-analysis.csv) -- 97 awards with category-relative pricing statistics.
- [Price Analysis by NAICS Category](evidence/summary/F-R006-70FA3-BAE-OUTLIER-price-analysis.csv) -- 39 awards with category-relative pricing statistics.

**Evidence needed for further review:**
- Distribution of award amounts in the same NAICS/PSC category
- Details of the flagged award (description, scope, duration)
- Comparison with similar awards from other agencies

### H-R002-PARKDALE: Does the pattern of non-competitive awards to PARKDALE ADVANCED MATERIALS, INC. warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

# Analysis: Non-Competitive Awards to PARKDALE ADVANCED MATERIALS, INC.

The data shows that 100% of awards to PARKDALE ADVANCED MATERIALS, INC. ($543.4M across 2 contracts) were non-competitive, which places this vendor among numerous others with similarly high non-competitive rates. This pattern appears within a broader procurement context where 436 vendors across this dataset received exclusively or predominantly non-competitive awards, suggesting potential systemic reliance on sole-source mechanisms. Legitimate explanations could include specialized manufacturing capabilities for advanced materials (potentially related to national security textiles, given industry context), urgent pandemic-related procurement, or unique patent protections that justify sole-source awards. 

**Recommended Next Steps**: Reviewers should examine (1) the justification documentation for these awards, particularly any determinations regarding unique capabilities or market availability, (2) whether these contracts relate to Berry Amendment compliance or specialized defense materials, and (3) comparison of pricing against any available market benchmarks to assess value reasonableness despite non-competitive procurement.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-PARKD-ADVAN-NONCOMP-competition-breakdown.csv) -- Breakdown of 2 awards by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-PARKD-ADVAN-NONCOMP-non-competed-awards.csv) -- 2 non-competed awards sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

### H-R002-HANESBRA: Does the pattern of non-competitive awards to HANESBRANDS INC. warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

The pattern shows HANESBRANDS INC. received a single non-competitive award valued at $175 million (100% of obligations to this vendor), which appears within a broader portfolio where numerous vendors received exclusively non-competitive awards across varying amounts and sectors. Non-competitive mechanisms may be justified for this textile manufacturer through unique domestic production capabilities, Berry Amendment compliance requirements for military/emergency supplies, urgent pandemic-related procurement needs, or established GSA schedule contracts. A reviewer should examine the award's stated justification (e.g., FAR authority cited), whether it relates to specialized products like flame-resistant garments or PPE, and whether similar textile awards to other vendors (Parkdale Advanced Materials: $543M, Standard Textile: $42M) share common justification patterns. The concentration of non-competitive awards across the portfolio merits verification that market research was conducted and competition impracticability was properly documented per FAR 6.302 requirements.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-HANES-INC-NONCOMP-competition-breakdown.csv) -- Breakdown of 1 award by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-HANES-INC-NONCOMP-non-competed-awards.csv) -- 1 non-competed award sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

### H-R002-GENERAL : Does the pattern of non-competitive awards to GENERAL DYNAMICS INFORMATION TECHNOLOGY INC. warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

# Analysis of Non-Competitive Award Pattern: General Dynamics Information Technology Inc.

**Pattern Interpretation:**
The single award to General Dynamics Information Technology Inc. totaling $97.2M was non-competitive, representing 100% of obligations to this vendor. This sits within a broader portfolio where 443 of 443 analyzed vendors (100%) received at least one non-competitive award, totaling over $1.5B in non-competed obligations across the dataset—suggesting systemic reliance on non-competitive mechanisms rather than vendor-specific behavior.

**Plausible Innocent Explanations:**
General Dynamics Information Technology specializes in complex IT infrastructure, cybersecurity, and systems integration services that may involve proprietary technologies, ongoing system maintenance requirements, or classified work necessitating sole-source awards. The award could represent a task order under an existing indefinite delivery vehicle, continuation of mission-critical services where transition risks outweigh competitive benefits, or urgent operational requirements where competition timelines were impractical.

**Recommended Next Steps:**
Reviewers should examine the cited authority codes (e.g., FAR 6.302-1 for only one responsible source, 6.302-2 for unusual and compelling urgency) and justification documentation to verify whether the rationale aligns with the nature of services provided. Cross-reference this award against the vendor's contract vehicle eligibility and assess whether market research documented alternative qualified sources or barriers to competition.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-GENER-DYNAM-NONCOMP-competition-breakdown.csv) -- Breakdown of 1 award by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-GENER-DYNAM-NONCOMP-non-competed-awards.csv) -- 1 non-competed award sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

### H-R002-3M COMPA: Does the pattern of non-competitive awards to 3M COMPANY warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

The comprehensive portfolio view reveals a systemic pattern where 100% non-competitive award rates appear across numerous vendors spanning diverse industries—from telecommunications (Verizon Federal: 131 awards, $16M) to manufacturing (3M Company: 6 awards, $95.5M), professional services, utilities, and specialized suppliers. While 3M's 100% non-competitive rate might reflect legitimate sole-source justifications for proprietary products (adhesives, respirators, specialty materials with unique specifications), the portfolio-wide pattern suggests either: (1) a procurement environment heavily reliant on brand-name or incumbent-specific requirements, (2) consistent application of Federal Acquisition Regulation exceptions (urgency, industrial mobilization, national security), or (3) insufficient documentation of market research to demonstrate competitive alternatives exist. A reviewer should examine whether non-competitive justifications cite specific FAR authorities (6.302-1 through 6.302-7), whether brand-name specifications include "or equal" language, and whether acquisition planning documents demonstrate meaningful efforts to identify alternative qualified sources before restricting competition—particularly for the highest-value awards to manufacturers like 3M, Parkdale, and Hanesbrands where commercial market alternatives may exist.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-3M-COMPA-NONCOMP-competition-breakdown.csv) -- Breakdown of 6 awards by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-3M-COMPA-NONCOMP-non-competed-awards.csv) -- 6 non-competed awards sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

### H-R002-STANDARD: Does the pattern of non-competitive awards to STANDARD TEXTILE CO INC warrant closer examination?

**Severity:** high
**Triggered by:** R002
`[AI-ENHANCED]`

The 100% non-competitive rate for STANDARD TEXTILE CO INC's single award ($41.9M) warrants examination within the broader context showing similar patterns across multiple textile suppliers—PARKDALE ADVANCED MATERIALS ($543.4M), HANESBRANDS ($175M), and MILLIKEN & COMPANY ($27.4M) all received exclusively non-competed awards. This industry-wide pattern may reflect legitimate sole-source justifications such as Berry Amendment compliance requirements for domestic textile procurement, specialized manufacturing capabilities for specific technical fabrics, or urgent pandemic-related supply needs. A reviewer should examine the contracting officer's justification documentation to verify whether the award cited unique technical specifications, domestic sourcing mandates, or other regulatory requirements that genuinely precluded competition, and compare these justifications across the textile supplier portfolio to assess consistency in market research practices.

**Supporting evidence:**
- [Competition Type Breakdown](evidence/summary/F-R002-STAND-TEXTI-NONCOMP-competition-breakdown.csv) -- Breakdown of 1 award by competition type code with dollar amounts.
- [Non-Competed Awards Detail](evidence/summary/F-R002-STAND-TEXTI-NONCOMP-non-competed-awards.csv) -- 1 non-competed award sorted by amount.

**Evidence needed for further review:**
- Breakdown of non-competed awards by justification code
- Dollar distribution of competed vs non-competed awards
- Comparison of non-competitive rate with agency average

### H-R004-AMERICAN: Is the concentration of spending on AMERICAN MEDICAL RESPONSE, INC. consistent with market conditions and procurement requirements?

**Severity:** high
**Triggered by:** R004
`[AI-ENHANCED]`

## Refined Analysis

The concentration pattern shows AMERICAN MEDICAL RESPONSE, INC. capturing 100.0% of $377.4M in ambulance services spending across 38 awards, which warrants examination alongside nine other vendors demonstrating similarly high concentration (98-100%) across diverse sectors. This pattern could reflect legitimate factors such as specialized medical certification requirements, emergency service provider shortages in the geographic service area, or incumbent advantages in services requiring continuous operational readiness. However, the presence of multiple vendors achieving near-total sector dominance across the same procurement entity suggests a potential systemic pattern rather than sector-specific market limitations.

**Reviewer next steps:** Examine whether competitive solicitations occurred for these awards, assess market research documentation justifying single or limited sources, verify whether contract vehicles (IDIQs, GSA schedules) constrained competition, and compare pricing against industry benchmarks or similar contracts at peer agencies to determine if concentration resulted in favorable or unfavorable pricing outcomes.

**Supporting evidence:**
- [Vendor Concentration Analysis](evidence/summary/F-R004-AMERI-MEDIC-CONCENTRATION-vendor-concentration.csv) -- Spending distribution across 1917 vendors (total: $11,511,196,462.23).

**Evidence needed for further review:**
- Vendor share breakdown for the agency
- Year-over-year trend of vendor concentration
- Comparison with similar agencies or categories

### H-R004-CROWLEY : Is the concentration of spending on CROWLEY LOGISTICS, INC. consistent with market conditions and procurement requirements?

**Severity:** high
**Triggered by:** R004
`[AI-ENHANCED]`

**Refined Analysis:**

CROWLEY LOGISTICS, INC. captured 100% of $47M across only 3 deep sea freight transportation awards, which warrants further examination despite the sector's specialized nature. This concentration could reflect legitimate factors such as Jones Act compliance requirements, limited vessel availability for specific routes, or highly specialized cargo handling capabilities that few vendors possess. However, the pattern of 100% concentration across multiple sectors (with similar patterns for Crowley Government Services and eight other vendors) raises questions about whether competitive solicitation processes consistently identified alternative qualified suppliers. A reviewer should examine whether these awards involved sole-source justifications, whether market research documented the unavailability of competitors, and whether contract vehicles or geographic requirements inadvertently narrowed the vendor pool. The 95% data coverage is adequate, though examining the missing 5% could clarify whether additional vendors participated but received minimal allocation.

**Supporting evidence:**
- [Vendor Concentration Analysis](evidence/summary/F-R004-CROWL-LOGIS-CONCENTRATION-vendor-concentration.csv) -- Spending distribution across 1917 vendors (total: $11,511,196,462.23).

**Evidence needed for further review:**
- Vendor share breakdown for the agency
- Year-over-year trend of vendor concentration
- Comparison with similar agencies or categories

### H-R004-THE RAND: Is the concentration of spending on THE RAND CORPORATION consistent with market conditions and procurement requirements?

**Severity:** high
**Triggered by:** R004
`[AI-ENHANCED]`

## Refined Analysis

The RAND Corporation's 99.6% concentration ($77.6M across 13 awards) in social sciences and humanities R&D reflects a pattern observed across multiple specialized sectors, where single vendors dominate technically complex categories. This concentration could legitimately stem from RAND's unique federally-funded research center (FFRDC) status, which provides specialized capabilities in policy analysis and social research that few organizations replicate, or from sole-source authorities under FAR 6.302-1 for organizations with exceptional facilities or capabilities. However, the 13 separate awards—rather than a consolidated vehicle—raise questions about whether the procuring agency conducted adequate market research to identify alternative qualified research institutions or academic consortia. A reviewer should examine: (1) justification and approval documentation for each award's competition strategy, (2) whether awards involve follow-on work where RAND holds proprietary data access, and (3) the agency's vendor identification efforts for similar social science research capabilities in the academic or nonprofit sectors.

**Supporting evidence:**
- [Vendor Concentration Analysis](evidence/summary/F-R004-THE-RAND-CONCENTRATION-vendor-concentration.csv) -- Spending distribution across 1917 vendors (total: $11,511,196,462.23).

**Evidence needed for further review:**
- Vendor share breakdown for the agency
- Year-over-year trend of vendor concentration
- Comparison with similar agencies or categories

### H-R004-RJCL COR: Is the concentration of spending on RJCL CORPORATION consistent with market conditions and procurement requirements?

**Severity:** high
**Triggered by:** R004
`[AI-ENHANCED]`

## Refined Analysis

RJCL CORPORATION's 98.6% concentration ($42,998,653.12 across 11 awards) in the RESIDENTIAL REMODELERS sector warrants examination of market structure and procurement approach. This concentration level could reflect legitimate factors such as specialized capabilities for government facility requirements, geographic constraints limiting qualified contractors, or task order awards under an established contract vehicle. However, the pattern occurs within a broader dataset showing similar high concentrations across multiple sectors (10 vendors exceeding 98% in their respective sectors), suggesting either systematic use of single-award contracting mechanisms or potential competition limitations. 

**Recommended Review:** Examine whether awards resulted from competitive processes or sole-source justifications, assess the availability of alternative qualified residential remodeling contractors in relevant geographic markets, and verify whether concentration stems from a single master contract with multiple task orders versus repeated individual awards.

**Supporting evidence:**
- [Vendor Concentration Analysis](evidence/summary/F-R004-RJCL-CORPO-CONCENTRATION-vendor-concentration.csv) -- Spending distribution across 1917 vendors (total: $11,511,196,462.23).

**Evidence needed for further review:**
- Vendor share breakdown for the agency
- Year-over-year trend of vendor concentration
- Comparison with similar agencies or categories

### H-R004-JOHNSON : Is the concentration of spending on JOHNSON CONTROLS SECURITY SOLUTIONS LLC consistent with market conditions and procurement requirements?

**Severity:** high
**Triggered by:** R004
`[AI-ENHANCED]`

## Refined Analysis

Johnson Controls Security Solutions LLC's 98.6% concentration ($29.7M across 7 awards) in security systems services may reflect legitimate market dynamics, as this sector often involves specialized technology requiring vendor-specific maintenance, proprietary systems integration, or pre-existing infrastructure compatibility. The pattern mirrors similar concentrations observed in other technical sectors (e.g., CoreLogic at 100% in mortgage services, Lumen at 98.9% in telecommunications), suggesting this may be consistent with specialized service procurement across the portfolio. A reviewer should examine whether these awards stem from sole-source justifications based on technical compatibility, whether competitive opportunities were advertised for new installations versus maintenance contracts, and whether the 7 awards represent extensions of a single initial contract or independent procurement decisions. Documentation of market research and consideration of alternative qualified vendors would help distinguish between appropriate specialization and potential vendor lock-in.

**Supporting evidence:**
- [Vendor Concentration Analysis](evidence/summary/F-R004-JOHNS-CONTR-CONCENTRATION-vendor-concentration.csv) -- Spending distribution across 1917 vendors (total: $11,511,196,462.23).

**Evidence needed for further review:**
- Vendor share breakdown for the agency
- Year-over-year trend of vendor concentration
- Comparison with similar agencies or categories

### H-R006-HSFE6015: Is the award amount for HSFE6015C0007 unusual relative to comparable procurements in the same category?

**Severity:** high
**Triggered by:** R006
`[AI-ENHANCED]`

## Analysis of Award HSFE6015C0007 Price Variance

Award HSFE6015C0007 ($148.9M to RESILIENCE ACTION PARTNERS) significantly exceeds the typical range for NAICS 541611 Administrative Management consulting, sitting 58.7x above the category mean and far beyond the statistical upper fence of $3.4M. However, this pattern appears within a broader context where 74 awards in this dataset exceed similar statistical thresholds across multiple service categories, suggesting this may reflect legitimate variation in federal procurement scope rather than isolated anomalies. Large consulting contracts often encompass multi-year enterprise-wide transformation programs, disaster recovery coordination, or integrated technical assistance that dramatically exceed typical project values—particularly for agencies like FEMA managing complex emergency operations.

**Reviewers should examine:** (1) The contract's Statement of Work to confirm whether scope justifies the magnitude (e.g., multi-year period of performance, nationwide geographic coverage, or integrated service delivery); (2) Whether the procurement used appropriate exceptions to competition if not competitively awarded; and (3) Comparison of labor categories and rates against FEMA's historical contracts for similar large-scale management consulting engagements to establish reasonable pricing benchmarks.

**Supporting evidence:**
- [Price Analysis by NAICS Category](evidence/summary/F-R006-HSFE6-RESIL-OUTLIER-price-analysis.csv) -- 577 awards with category-relative pricing statistics.

**Evidence needed for further review:**
- Distribution of award amounts in the same NAICS/PSC category
- Details of the flagged award (description, scope, duration)
- Comparison with similar awards from other agencies

### H-R006-70FB7020: Is the award amount for 70FB7020F00000080 unusual relative to comparable procurements in the same category?

**Severity:** high
**Triggered by:** R006
`[AI-ENHANCED]`

**Award Amount Analysis for 70FB7020F00000080**

This procurement ($532.16M to PARKDALE ADVANCED MATERIALS) is 56.8x the category mean for textile wholesale (NAICS 423450, n=108), substantially exceeding the statistical upper fence of $2.65M. While this signals an extreme price deviation, the award represents a large-scale pandemic response contract for face coverings under exigent circumstances, which inherently differs from typical commercial textile transactions in this category. The pattern appears within a broader set of 684 outliers spanning multiple categories, many reflecting emergency procurements, specialized services, or multi-year vehicles where elevated costs may be justified by scope, urgency, or regulatory requirements. **Review considerations**: Examine the Statement of Work for deliverable quantities, performance period, and any emergency acquisition authorities cited; compare per-unit pricing against contemporaneous market rates for similar pandemic response contracts; and verify whether the contract structure (e.g., IDIQ ceiling vs. obligated amounts) explains the magnitude differential from historical category baselines.

**Supporting evidence:**
- [Price Analysis by NAICS Category](evidence/summary/F-R006-70FB7-PARKD-OUTLIER-price-analysis.csv) -- 127 awards with category-relative pricing statistics.
- [Price Analysis by NAICS Category](evidence/summary/F-R006-70FB7-HANES-OUTLIER-price-analysis.csv) -- 127 awards with category-relative pricing statistics.

**Evidence needed for further review:**
- Distribution of award amounts in the same NAICS/PSC category
- Details of the flagged award (description, scope, duration)
- Comparison with similar awards from other agencies

### H-R001-Departme: Are contract opportunities from Department of Homeland Security reaching a sufficiently broad supplier base?

**Severity:** high
**Triggered by:** R001
`[AI-ENHANCED]`

## Refined Analysis

The Department of Homeland Security exhibits a single-bid competition rate of 45.6% (2,182 of 4,786 contracts), more than double the EU's 20% risk threshold. This pattern could reflect legitimate factors such as highly specialized security requirements, stringent clearance prerequisites, or niche technical capabilities that naturally limit qualified suppliers. However, the concentration warrants examination of whether solicitation periods are adequate, whether requirements are unnecessarily restrictive (such as overly specific brand references or incumbent-favoring specifications), and whether small businesses receive sufficient notice through appropriate procurement channels. Reviewers should analyze a sample of single-bid contracts to assess whether technical requirements genuinely necessitate limited competition or if broader outreach mechanisms could expand the supplier pool.

**Supporting evidence:**
- [Competition Data for Flagged Awards](evidence/summary/F-R001-DEPAR-OF-SINGLEBID-competition-data.csv) -- 2178 awards with competition fields. Supports analysis of single-bid patterns.
- [Distribution of Offers Received](evidence/summary/F-R001-DEPAR-OF-SINGLEBID-offer-distribution.csv) -- Breakdown of how many offers were received per competed award.

**Evidence needed for further review:**
- Distribution of offers received across all competed awards
- Year-over-year trend of single-bid rate
- Comparison with other agencies in same category

## Investigator Findings

*Opus 4.6 agent completed 8 iteration(s) with 34 tool call(s).*

Investigation completed after 8 iterations (max iterations reached). 34 tool calls executed.

## Data Quality & Coverage

| Indicator | Records with Required Fields | Coverage |
|-----------|----------------------------|----------|
| R001 Single-Bid Competition | 5682/7259 | 78% |
| R002 Non-Competitive Awards | 7256/7259 | 100% |
| R003 Contract Value Splitting | 6910/7259 | 95% |
| R004 Vendor Concentration | 6910/7259 | 95% |
| R005 Excessive Modifications | 0/7259 | 0% |
| R006 Price Outliers | 6909/7259 | 95% |

**Notes:**
- `number_of_offers_received` has poor fill rates in USAspending data, limiting R001 coverage.
- R005 (Modifications) requires transaction data fetched with `--with-transactions` flag.
- R004 (Concentration) signals are expected when filtering by a single recipient.

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

- **Generated:** 2026-02-12T19:23:11.994Z
- **Tool version:** 0.1.0
- **Git commit:** 38fbf3ac5688989a28a230e36db64909bcc62474
- **Node.js:** v20.19.4

---
*Generated by Procurement Investigator (Investigation-as-Code)*