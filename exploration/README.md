# USAspending API Exploration

**Date:** 2026-02-10
**Base URL:** `https://api.usaspending.gov/api/v2/`
**Auth:** None required (public API)

---

## Files

### 01-award-search-dod-mit.json
**Endpoint:** `POST /search/spending_by_award/`
**Purpose:** Search for DOD contract awards to MIT (2020-2024), sorted by amount descending, limit 10.
**Key findings:**
- Returns 10 results; `hasNext: true` confirms more pages exist.
- All top MIT awards are from **Department of the Air Force** (MIT Lincoln Laboratory).
- Largest single award: **$1.59 billion** (contract 0007, delivery order under FA8702-15-D-0001).
- Fields returned include: `Award ID`, `Recipient Name`, `Award Amount`, `Total Outlays`, `Description`, `Start Date`, `End Date`, `Awarding Agency`, `Awarding Sub Agency`, `Contract Award Type`, `recipient_id`, `Recipient UEI`, `NAICS Code`, `PSC Code`.
- Bonus fields always included: `internal_id`, `awarding_agency_id`, `agency_slug`, `generated_internal_id`.
- `generated_internal_id` is the key for fetching award detail (call 3) and transactions (call 4).
- Pagination uses `page_metadata.last_record_unique_id` and `last_record_sort_value` for cursor-based paging.

### 02-award-count-dod-mit.json
**Endpoint:** `POST /search/spending_by_award/` (limit=1)
**Purpose:** Estimate total volume of DOD-MIT awards.
**Key findings:**
- `hasNext: true` with limit=1 confirms there are at least 2 matching awards.
- The API does **not** return a total count in the response metadata. You must paginate to count all results or use a different endpoint.
- To get exact counts, consider `/search/spending_by_category/` or the download endpoints.

### 03-award-detail-sample.json
**Endpoint:** `GET /awards/{generated_internal_id}/`
**Purpose:** Full detail for the top MIT contract (CONT_AWD_0007_9700_FA870215D0001_9700).
**Key findings:**
- **69 fields** in `latest_transaction_contract_data` -- extremely rich contract metadata.
- Critical red-flag fields available:
  - `extent_competed`: "C" (NOT COMPETED) -- this $1.59B contract was sole-source.
  - `type_of_contract_pricing`: "S" (COST NO FEE).
  - `number_of_offers_received`: null (not populated for this award).
  - `solicitation_procedures`: "SSS" (sole source).
  - `cost_or_pricing_data`: "N".
  - `type_set_aside`: null.
  - `subcontracting_plan`: "C".
  - `fair_opportunity_limited`: null.
  - `multi_year_contract`: "N".
- `period_of_performance`: 2016-06-03 to 2030-02-28 (14 years).
- `parent_award` links to the parent IDV (FA8702-15-D-0001).
- `executive_details.officers` lists top 5 compensated officers.
- `recipient` includes UEI, DUNS, address, business categories, and a `recipient_hash` for cross-referencing.
- `psc_hierarchy` and `naics_hierarchy` provide classification trees.
- `subaward_count` and `total_subaward_amount` are available.

### 04-transactions-sample.json
**Endpoint:** `POST /transactions/`
**Purpose:** Modification history for the sample award (10 most recent).
**Key findings:**
- `hasNext: true` -- this contract has many modifications.
- Each transaction includes: `modification_number`, `action_date`, `action_type`, `action_type_description`, `federal_action_obligation`, `description`.
- Modification numbers use alphanumeric codes (P6, P7, ..., Q1, Q2, ..., Q6).
- Some modifications have $0 obligation (administrative changes).
- Some have negative obligations (de-obligations: e.g., -$86,440.52).
- `face_value_loan_guarantee` and `original_loan_subsidy_cost` are null for contracts (loan-specific fields).
- Pagination: `page_metadata` has `next`, `previous`, `hasNext`, `hasPrevious`.

### 05-spending-by-recipient-dod.json
**Endpoint:** `POST /search/spending_by_category/recipient/`
**Purpose:** Top 25 DOD contract recipients in 2023.
**Key findings:**
- Top recipient: **Lockheed Martin** at **$22.46 billion** in 2023.
- Some companies appear multiple times (e.g., Lockheed Martin, Boeing) -- likely different DUNS/UEI registrations or subsidiaries.
- Each result includes: `amount`, `recipient_id`, `name`, `code` (DUNS), `uei`, `total_outlays`.
- `recipient_id` can be used to look up recipient profiles.
- `hasNext: true` -- many more recipients available.
- API message warns that `subawards` parameter is being deprecated in favor of `spending_level`.

### 06-spending-over-time-dod-mit.json
**Endpoint:** `POST /search/spending_over_time/`
**Purpose:** DOD spending on MIT contracts by fiscal year (FY2015-FY2025).
**Key findings:**
- Clear upward trend: MIT DOD spending grew from **$824M (FY2015)** to **$1.47B (FY2024)**.
- FY2025 shows $293M (partial year as of data collection date).
- Each result breaks down by obligation type: `Contract_Obligations`, `Grant_Obligations`, `Idv_Obligations`, etc.
- Also includes outlay breakdowns: `Contract_Outlays`, `Grant_Outlays`, etc.
- `aggregated_amount` is the total across all types.
- 11 fiscal years returned for a 10-year date range (FY alignment -- fiscal years span Oct-Sep).

### 07-non-competed-dod.json
**Endpoint:** `POST /search/spending_by_award/`
**Purpose:** Largest non-competed DOD contracts in 2023 (extent_competed_type_codes: B, C, G, NDO).
**Key findings:**
- Enormous non-competed awards: top result is **$35.1B** to Lockheed Martin (Navy).
- Electric Boat (submarine manufacturer) has two entries totaling ~$54B non-competed.
- These are major weapons systems where there is effectively one supplier.
- The `extent_competed_type_codes` filter works: B=Not Available for Competition, C=Not Competed, G=Not Competed under SAP, NDO=Non-Domestic Offer.
- `hasNext: true` -- many more non-competed awards exist.

---

## API Observations

### Authentication & Rate Limits
- No API key required for any endpoint tested.
- All 7 calls succeeded with HTTP 200.
- No rate limiting encountered during sequential calls.

### Pagination
- `/search/spending_by_award/` uses **cursor-based** pagination via `last_record_unique_id` and `last_record_sort_value` in `page_metadata`.
- `/transactions/` uses **page-number** pagination with `next`/`previous` in `page_metadata`.
- `/search/spending_by_category/` uses **page-number** pagination.
- **No endpoint returns a total result count.** You must paginate to exhaustion or use download endpoints for full datasets.

### Data Quality
- **Descriptions are truncated** in search results (cut off at ~100 chars). Full descriptions available in award detail.
- **`number_of_offers_received` is often null**, even for competed contracts. This field has poor fill rates.
- **Recipient names are inconsistent** -- e.g., "MASSACHUSETTS INSTITUTE OF TECHNOLOGY" appears under multiple subsidiaries/registrations. The `recipient_id` (hash) helps deduplicate.
- **Some companies appear multiple times** in spending-by-recipient due to different UEI registrations (e.g., Lockheed Martin, Boeing).
- **Dollar amounts are precise** to the cent (not rounded).
- **Date formats** are consistent: YYYY-MM-DD.

### Key Fields for Red Flag Detection
From the award detail endpoint (`/awards/{id}/`), the following fields are most relevant for procurement anomaly detection:

| Field | Description | Fill Rate |
|-------|-------------|-----------|
| `extent_competed` | Competition status (A/B/C/D/E/F/G/CDO/NDO) | High |
| `type_of_contract_pricing` | Pricing type (FFP/CPFF/CPIF/T&M/etc.) | High |
| `number_of_offers_received` | Bids received | Low (often null) |
| `solicitation_procedures` | How solicited (NP/SP/SSS) | Medium |
| `type_set_aside` | Small business set-aside type | Medium |
| `fair_opportunity_limited` | Fair opportunity exceptions | Low |
| `cost_or_pricing_data` | Whether cost data was obtained | Medium |
| `subcontracting_plan` | Subcontracting requirements | Medium |

### API Limitations
- **Time period**: Search endpoints are limited to data from **2007-10-01** onward. Older data requires bulk download.
- **No total counts**: Must paginate or use download endpoints for complete datasets.
- **Search text matching**: `recipient_search_text` does fuzzy/substring matching, which may return false positives.
- **Field selection**: Only `/search/spending_by_award/` supports a `fields` parameter. Other endpoints return fixed schemas.

### Recommended Next Steps
1. **Bulk download** via `/bulk_download/` for comprehensive analysis (search endpoints paginate slowly for large result sets).
2. **Recipient profile API** (`/recipient/{id}/`) to deduplicate companies and understand corporate hierarchies.
3. **Subaward data** via `/subawards/` for subcontractor analysis.
4. **Federal account data** via `/awards/{id}/accounts/` for funding source analysis.
5. **FPDS comparison** -- cross-reference with FPDS-NG for fields not available in USAspending (e.g., protest history, past performance ratings).
