# Investigation Narrative

> This document records the reasoning process of the Opus 4.6 investigative agent.
> Each step shows the agent's analytical thinking as it examined the procurement data.

## Reasoning Trace

### Step 1: Forming Hypothesis
*2026-02-12T22:02:42.696Z*

The dataset shows 3 awards totaling over $2 billion to FAMILY ENDEAVORS, INC., all non-competitive, from a single agency. The entity context mentions "CHILD AND YOUTH SERVICES" which suggests HHS/ACF (Administration for Children and Families) based on the award ID prefix "75ACF". This is an extraordinarily large sum for a single nonprofit entity receiving sole-source awards. Key questions:
1. What is FAMILY ENDEAVORS, INC.? Is it a legitimate social services organization? What is its SAM.gov registration status?
2. What are these specific awards for? The timing (2021-2022) coincides with the migrant surge at the US-Mexico border and potential emergency shelter needs.
3. Is $2B reasonable for this type of work? Were there emergency/urgency justifications?
4. Are there sub-awards showing pass-through to other organizations?
5. Does this entity appear on any sanctions or exclusion lists?
6. What do comparable awards look like — do other entities receive similar non-competitive awards from ACF?

Initial assessment: The 100% non-competitive rate and $2B value are significant red flags on their face, but the timing and agency context (ACF during the 2021 border surge) may provide legitimate justification. Family Endeavors was widely reported in media as receiving emergency contracts for migrant shelter services.

**Related signals:** `R002`
**Related entities:** FAMILY ENDEAVORS, INC.

### Step 2: Analyzing Results
*2026-02-12T22:03:10.146Z*

Excellent — the award details reveal critical context:

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

**Related signals:** `R002`
**Related entities:** FAMILY ENDEAVORS, INC.

### Step 3: Analyzing Results
*2026-02-12T22:03:29.770Z*

Sub-award data returned empty for both large contracts. This could mean:
1. Sub-award reporting was not required or not yet submitted
2. Family Endeavors performed the work directly without significant subcontracting
3. Data reporting gaps (sub-award reporting has known coverage limitations)

The lack of sub-award data is itself notable for contracts of this magnitude ($1.3B and $714M). For contracts this large, it would be unusual for there to be zero subcontractors, suggesting either a reporting gap or that the entity was performing extensive direct services.

SAM.gov is still rate-limited. The comparable awards search returned no results from the in-memory dataset (which only contains 3 awards), so I need to broaden my search. Let me try the USAspending API for broader comparable data.

Let me also check the statistical patterns in the dataset and try a broader comparable search.

**Related signals:** `R002`
**Related entities:** FAMILY ENDEAVORS, INC.

### Step 4: Analyzing Results
*2026-02-12T22:03:45.415Z*

The comparable awards search returns no results because it's searching the in-memory dataset which only contains these 3 awards. The statistical analysis confirms:
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

**Related signals:** `R002`
**Related entities:** FAMILY ENDEAVORS, INC.

### Step 5: Analyzing Results
*2026-02-12T22:04:02.500Z*

SAM.gov continues to be rate-limited, so I cannot verify the entity registration. However, I can note that:
- The exclusions search also returned empty/rate-limited, not a positive hit
- The sanctions screening returned NO match (score: 0)
- The concentration analysis shows HHI of 0.54 (which is expected since there's only 1 recipient in this dataset — HHI = 1.0 for a monopoly, so 0.54 represents the distribution across the 3 awards by size)

Let me now attempt to summarize what I know and create formal findings. Let me also try one more entity search approach.

**Related signals:** `R002`
**Related entities:** FAMILY ENDEAVORS, INC.

---
*Generated by Procurement Investigator — Opus 4.6 Investigative Agent*