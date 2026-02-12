# Procurement Investigation: Department of Defense → MIT

**Period:** 2023-01-01 to 2023-12-31
**Generated:** 2026-02-12

Department of Defense procurement to MIT-affiliated entities during 2023 totaled $7.58 billion across 10,000 awards, with automated screening identifying 17 material patterns for management review. The most significant pattern involves 262 competitively solicited awards ($2.51 billion) that received only a single bid despite open competition, representing a 33.2% single-bid rate. Two unusually large awards warrant price verification: a $1.60 billion pharmaceutical contract to GLAXOSMITHKLINE, LLC (z-score 8.30) and a $735 million research contract to THE MITRE CORPORATION (z-score 9.80), both representing statistical outliers within their respective service categories. Additionally, MURRAY BENJAMIN ELECTRIC CO LLC received 100% of available spending in its category ($1.37 million across 21 awards), and four Department of Defense contracts were structured just below the $7.5 million threshold, totaling $60.6 million. These patterns merit secondary review to ensure compliance with procurement regulations and competitive practices.

*`[AI-GENERATED]` — narrative produced by Claude Sonnet*

> Red flags are screening indicators, **not proof of wrongdoing**.
> See case.md for full methodology and data quality notes.

## At a Glance

| Metric | Value |
|--------|-------|
| Awards Analyzed | 10,000 |
| Signals Detected | 1,367 |
| Material Findings | 17 |
| High Severity Findings | 16 |
| Total Dollar Exposure | $7,584,103,343.68 |

## Multi-Signal Entities

Entities flagged by **2+ independent indicators** — these are the strongest investigative leads:

| Entity | Indicators | Exposure | Findings |
|--------|-----------|----------|----------|
| Department of Defense | R001, R003 | $2,571,665,500.01 | 2 |

## Top Findings

### [MEDIUM] Contract Value Splitting — Department of Defense

**What:** 4 awards to Department of Defense were valued within 10% below the $7,500,000 threshold, suggesting possible structuring.

**Standard:** FAR 13.003 (Simplified Acquisition Threshold at $250,000) and other regulatory thresholds require additional oversight above certain dollar amounts. OCP Red Flags Guide (2024) identifies clustering below thresholds as a splitting indicator.

**Impact:** $28,560,055.54 in awards may have avoided enhanced competition or oversight requirements that apply above the $7,500,000 threshold.

*Industry: PETROLEUM REFINERIES · Set-aside: NONE · 196 awards in dataset · active 2023-01-11 to 2023-12-30*

*24 awards, $60,612,270.23 total value*

Awards: [SPE60523FSF3T](https://www.usaspending.gov/award/CONT_AWD_SPE60523FSF3T_9700_SPE60521D1004_9700), [SPE60523FSQ4S](https://www.usaspending.gov/award/CONT_AWD_SPE60523FSQ4S_9700_SPE60521D1004_9700), [SPE60523FSN7C](https://www.usaspending.gov/award/CONT_AWD_SPE60523FSN7C_9700_SPE60521D1004_9700), and 21 more
`[RULE]`

### [HIGH] Vendor Concentration — MURRAY BENJAMIN ELECTRIC CO LLC

**What:** MURRAY BENJAMIN ELECTRIC CO LLC received 100.0% of total spending, totaling $1,365,970.05 across 21 awards.

**Standard:** The EU Single Market Scoreboard tracks vendor concentration as a key procurement health indicator. Vendor shares exceeding 30% warrant review for market diversity. FAR 6.101 promotes full and open competition to prevent vendor lock-in.

**Impact:** Concentration of $1,365,970.05 with one vendor creates dependency risk and reduces competitive pricing leverage. Disruption to this vendor could significantly impact operations.

*Industry: NONFERROUS METAL (EXCEPT COPPER AND ALUMINUM) ROLLING, DRAWING, AND EXTRUDING · Set-aside: NONE · 107 awards in dataset · active 2019-09-30 to 2023-09-28*

*54 awards, $8,074,569.91 total value*

Awards: [SPE7M123P6398](https://www.usaspending.gov/award/CONT_AWD_SPE7M123P6398_9700_-NONE-_-NONE-), [SPE7M123P2581](https://www.usaspending.gov/award/CONT_AWD_SPE7M123P2581_9700_-NONE-_-NONE-), [SPE7M123P5594](https://www.usaspending.gov/award/CONT_AWD_SPE7M123P5594_9700_-NONE-_-NONE-), and 51 more
`[RULE]`

### [HIGH] Single-Bid Competition — Department of Defense

**What:** Department of Defense received 788 competitively solicited awards, with a single-bid rate of 33.2% (262 awards received only one offer).

**Standard:** FAR 6.101 requires agencies to promote and provide for full and open competition. The EU Single Market Scoreboard flags single-bid rates above 20% as a concern indicator.

**Impact:** $2,511,137,973.78 in awards may not have benefited from competitive pricing pressure. Without multiple bidders, there is reduced assurance that the government received best value.

*Industry: SHIP BUILDING AND REPAIRING · Set-aside: NONE · 9 awards in dataset · active 2020-07-30 to 2023-08-29*

*786 awards, $2,511,053,229.78 total value*

Awards: [W58P0522C0002](https://www.usaspending.gov/award/CONT_AWD_W58P0522C0002_9700_-NONE-_-NONE-), [FA872119F0004](https://www.usaspending.gov/award/CONT_AWD_FA872119F0004_9700_GS00Q14OADS315_4732), [SPE60324C5001](https://www.usaspending.gov/award/CONT_AWD_SPE60324C5001_9700_-NONE-_-NONE-), and 783 more
`[RULE]`

### [HIGH] Price Outliers — W58P0522C0002 (GLAXOSMITHKLINE, LLC)

**What:** Award W58P0522C0002 valued at $1,597,461,996 is a statistical outlier (z-score: 8.30) within its NAICS/PSC category.

**Standard:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Impact:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $1,597,461,996.

*Industry: PHARMACEUTICAL PREPARATION MANUFACTURING · Set-aside: NONE · 9 awards in dataset · active 2020-07-30 to 2023-08-29*

*1 award, $1,597,461,996 total value*

Awards: [W58P0522C0002](https://www.usaspending.gov/award/CONT_AWD_W58P0522C0002_9700_-NONE-_-NONE-)
`[RULE]`

### [HIGH] Price Outliers — W56KGU23F0006 (THE MITRE CORPORATION)

**What:** Award W56KGU23F0006 valued at $735,300,741.32 is a statistical outlier (z-score: 9.80) within its NAICS/PSC category.

**Standard:** Statistical pricing analysis per OECD bid rigging guidelines. Awards exceeding 1.5x IQR above Q3 or z-score > 2.0 are flagged for price reasonableness review. FAR 15.404 requires price analysis for contract actions.

**Impact:** An award valued significantly above comparable procurements may indicate insufficient price negotiation or lack of competitive pricing pressure. Total exposure: $735,300,741.32.

*Industry: RESEARCH AND DEVELOPMENT IN THE PHYSICAL, ENGINEERING, AND LIFE SCIENCES (EXCEPT NANOTECHNOLOGY AND BIOTECHNOLOGY) · 65 awards in dataset · active 2010-10-01 to 2023-10-20*

*1 award, $735,300,741.32 total value*

Awards: [W56KGU23F0006](https://www.usaspending.gov/award/CONT_AWD_W56KGU23F0006_9700_W56KGU18D0004_9700)
`[RULE]`

## Next Steps

- **R003:** Examine whether near-threshold awards represent split requirements
- **R004:** Check SAM.gov entity type (FFRDC/UARC) and assess vendor diversification
- **R001:** Review solicitation practices and advertisement reach for single-bid awards
- **R006:** Compare prices with similar procurements from other agencies
- Run without `--recipient` to see the full agency portfolio

## Files in This Case Folder

| File | Description |
|------|-------------|
| `case.md` | Full investigation report with all signals and hypotheses |
| `dashboard.html` | Interactive HTML dashboard with charts |
| `evidence/` | CSV evidence tables and SVG charts |
| `data/` | Raw JSON data files (awards, signals, hypotheses) |
| `provenance.json` | Run metadata and audit trail |

---
*Generated by [Procurement Investigator](https://github.com/) (Investigation-as-Code)*