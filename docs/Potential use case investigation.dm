**TL;DR**: Yes—this case is still reproducible from public, official sources in 2026. The prime award record is in USAspending (coverage back to FY2001), the vendor can be resolved via SAM.gov’s Entity Management API (public tier), and the dispute has an official CBCA decision plus an official congressional letter that explicitly references the PO and the USAspending award link. 

## 1) Canonical identifiers you can anchor the whole case on (public)

**Prime award / PIID (purchase order):** `75H71020P01137` (Indian Health Service). The congressional letter explicitly names this PO and points to the USAspending award page. 

**Generated USAspending award identifier (string form):**
`CONT_AWD_75H71020P01137_7527_-NONE-_-NONE-`
This appears both in ProPublica’s contract entry (as the USAspending link) and in the congressional letter’s USAspending reference. 

## 2) What you can refetch today from the official APIs you already use

### A) USAspending (prime award + transactions)

**What’s publicly available (relevant to your indicators):**

* Award amount and modification history (base award + subsequent action)
* Procurement attributes sourced from FPDS (industry codes, place of performance, awarding org, etc.) and generally enough to compute/confirm “concentration”, “timing”, “rapid modifications”, etc. 
* You can drive your pipeline from the award, then pull the award’s transactions and normalize them into your evidence CSV.

**Key implementation detail for your agent:** USAspending’s transactions interface accepts an `award_id` that can be the **generated “natural award id” string** (not only a database surrogate). That maps cleanly to your `CONT_AWD_...` id above. ([GitHub][1])

### B) SAM.gov Entity Management API (vendor identity + registration metadata)

**What’s publicly available via the API (public tier):**

* Entity name, **UEI**, registration details, addresses, business types, NAICS/PSC, and public points-of-contact fields. ([GSA Open Technology][2])
  **Endpoints:** the official production endpoints are documented (v1–v4), e.g. `https://api.sam.gov/entity-information/v4/entities?...&api_key=...` ([GSA Open Technology][2])

**Important constraint (for “verifier-grade”):**

* SAM’s Terms/ToU distinguish “public” vs “sensitive” fields; you should only store and render public-tier fields in your case file. ([sam.gov][3])

### C) SAM.gov subaward data (if you want the optional “where did the money flow next?” branch)

USAspending’s own “About the Data” documentation states that subaward data comes from SAM.gov and is published with a lag (end of the following month). For this 2020 contract, if subawards were reported, they should be accessible historically, subject to what the prime reported. 

## 3) The “already happened, publicly validated” artifacts (perfect for your verifier)

### A) Civilian Board of Contract Appeals decision (official adjudicative record)

CBCA decision **CBCA 7090** is publicly available as a PDF and contains a tight factual core you can cite line-by-line:

* IHS awarded a contract on **April 14, 2020** for **one million KN95 masks**
* IHS later rejected the order (manufacturer mismatch allegation)
* Certified claim submitted **June 22, 2020** for **$3,428,892**
* Contracting officer final decision **June 17, 2021**
* The decision discusses the dispute framing (including mention of SAM.gov registration context) 

This is exactly the kind of “board/court record” that lets your Verifier agent cross-check the narrative claims against an official primary source.

### B) Congressional letter (official oversight record)

The House Select Subcommittee letter (March 30, 2021) explicitly:

* References **ProPublica’s reporting** about the $3M masks case
* Names the **PO 75H71020P01137**
* Links to the **USAspending award page** for that PO 

That gives you an independent, government-authored pointer tying together: media reporting → award identifier → official spending record.

## 4) Do “retention periods” threaten reproducibility right now?

For your specific question—**can you refetch this case now**—the answer is effectively **yes**, with low risk:

### USAspending coverage window (strongest signal)

USAspending’s own “About the Data” document states federal award data on USAspending is available starting **Fiscal Year 2001**. Your case is FY2020, so it’s well inside the published coverage window. 

### FPDS transition risk (worth noting, but doesn’t break your current plan)

SAM.gov announces that FPDS.gov’s ezSearch UI is being decommissioned Feb 24, 2026 and that users should search in SAM.gov going forward (ATOM feed later FY2026). That’s a workflow change for FPDS users—not an indication that FY2020 contract actions vanish from USAspending. ([sam.gov][4])

### SAM entity record availability (moderate uncertainty, but not a blocker)

Even if an entity’s registration status changes (inactive/expired), your case still stands because:

* The prime award and transactions remain accessible via USAspending
* The CBCA decision and congressional letter are independently sufficient to validate identity and timeline
* SAM lookup is “nice to have” for the autonomy moment (UEI + registration metadata), but not the sole pillar

## 5) What your agent can realistically prove end-to-end (and what it cannot)

**Fully provable from public sources you can fetch today:**

* Award existence, amount, modification(s), dates (USAspending / FPDS-derived attributes) 
* Non-competitive posture signals (“only one source / not competed / urgency”) via the already-public contract record (as surfaced in ProPublica’s FPDS-derived view)
* Dispute timeline + claim amount + key factual allegations (CBCA) 
* Oversight reference + explicit link to the PO and USAspending award (House letter) 

**Harder / not guaranteed from your current official-API set:**

* Internal “justification for other than full and open competition” documents (“J&A”), responsibility determinations, acceptance memos, etc. Those typically require FOIA or agency release; the congressional letter requests them, but that doesn’t mean they’re publicly downloadable. 

## 6) One practical note about PDFs

I attempted to use the platform’s PDF screenshot extraction, but the screenshot tool is erroring in this environment; the citations above rely on the PDF text-extract views returned by the web tool.

If you want, I can translate the above into a concrete “case seed → agent steps → expected evidence files” spec aligned to your 8-step orchestrator (using exactly: USAspending → SAM entity → CBCA PDF → congressional letter PDF → final case.md with cross-cited timeline).

[1]: https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/transactions.md?utm_source=chatgpt.com "usaspending-api/usaspending_api/api_contracts/contracts ..."
[2]: https://open.gsa.gov/api/entity-api/ "SAM.gov Entity Management  API | GSA Open Technology"
[3]: https://sam.gov/about/terms-of-use?utm_source=chatgpt.com "Terms of Use"
[4]: https://sam.gov/announcements/fpdsgov-decommissions-february-24-2026-0?utm_source=chatgpt.com "FPDS.gov Decommissions on February 24, 2026"
