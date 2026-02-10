# USAspending API Analysis: Field-to-Indicator Mapping

**Date:** 2026-02-10
**Status:** Validated with live API calls (see `exploration/`)

---

## API Overview

- **Base URL:** `https://api.usaspending.gov/api/v2/`
- **Authentication:** None (fully public)
- **Rate limits:** None documented; design defensively (throttle, retry on 429/500)
- **Data range:** FY2008+ (2007-10-01 onward) via search; FY2001+ via bulk download
- **Pagination:** 100 results/page max; cursor-based for >10K results

---

## Endpoint Strategy

### Primary Pipeline (MVP)

| Step | Endpoint | Method | Purpose | Rate |
|------|----------|--------|---------|------|
| 1 | `/search/spending_by_award/` | POST | Search awards by agency, recipient, period | High volume |
| 2 | `/awards/{id}/` | GET | Award detail with competition data | Per-award |
| 3 | `/transactions/` | POST | Modification history | Per-award |
| 4 | `/search/spending_by_category/recipient/` | POST | Vendor concentration | Per-query |

### Supporting Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search/spending_over_time/` | POST | Trend analysis (FY/quarter/month) |
| `/download/awards/` | POST | Bulk CSV export (>10K records) |
| `/recipient/duns/{id}/` | GET | Recipient profile + parent company |
| `/autocomplete/recipient/` | POST | Name resolution |

---

## Field-to-Indicator Mapping

### R001: Single-Bid Competition

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Number of bids | `number_of_offers_received` | `/awards/{id}/` → `latest_transaction_contract_data` | **Low** (often null) |
| Competition type | `extent_competed` | `/awards/{id}/` → `latest_transaction_contract_data` | High |
| Competition description | `extent_competed_description` | `/awards/{id}/` → `latest_transaction_contract_data` | High |

**Implementation note:** `number_of_offers_received` has poor fill rates. For the MVP, we can flag awards where `extent_competed` is a competitive code (A, CDO, D, E, F) but `number_of_offers_received` is 1. When null, we cannot compute this indicator -- report as data gap.

**Competitive extent_competed codes:**
- `A` = Full and Open Competition
- `CDO` = Competitive Delivery Order
- `D` = Full and Open After Exclusion of Sources
- `E` = Follow On to Competed Action
- `F` = Competed Under SAP

---

### R002: Non-Competitive Awards

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Competition status | `extent_competed` | `/awards/{id}/` or filter on search | High |
| Justification | `other_than_full_and_open` | `/awards/{id}/` → `latest_transaction_contract_data` | Medium |
| Solicitation method | `solicitation_procedures` | `/awards/{id}/` → `latest_transaction_contract_data` | Medium |
| Posted publicly? | `fed_biz_opps` | `/awards/{id}/` → `latest_transaction_contract_data` | Medium |

**Implementation note:** Can also filter directly in search: `"extent_competed_type_codes": ["B","C","G","NDO"]`. Validated via call 07.

**Non-competitive codes:**
- `B` = Not Available for Competition
- `C` = Not Competed
- `G` = Not Competed Under SAP
- `NDO` = Non-Competitive Delivery Order

**Live finding:** Top non-competed DOD award in 2023 was $35.1B to Lockheed Martin. Many are major weapons systems with one feasible supplier.

---

### R003: Contract Value Splitting

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Award amount | `Award Amount` | `/search/spending_by_award/` | High |
| Agency | `Awarding Agency` + `Awarding Sub Agency` | Search results | High |
| Recipient | `Recipient Name` + `recipient_id` | Search results | High |
| Date | `Start Date` | Search results | High |

**Implementation note:** No additional detail calls needed. Can use the `award_amounts` filter to pre-screen bands near thresholds. Group by (agency, recipient, quarter) and count awards in threshold bands.

**Key U.S. thresholds:**
- $10,000 (micro-purchase)
- $250,000 (simplified acquisition threshold)
- $7,500,000 (certain set-aside thresholds)

---

### R004: Vendor Concentration

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Recipient spend | `amount` | `/search/spending_by_category/recipient/` | High |
| Recipient identity | `name`, `recipient_id`, `uei` | Same | High |

**Implementation note:** The spending_by_category/recipient endpoint directly provides aggregated spend per recipient. Filter by agency + time period. Compare top recipient's share to total.

**Live finding:** Lockheed Martin received $22.5B from DOD in 2023. Note: same company appears multiple times under different UEI registrations -- need deduplication logic (use `recipient_id` hash or parent company lookup).

---

### R005: Excessive Modifications

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Modification count | Count of `results` | `/transactions/` (paginate all) | High |
| Modification amount | `federal_action_obligation` | `/transactions/` | High |
| Modification type | `action_type`, `action_type_description` | `/transactions/` | High |
| Modification number | `modification_number` | `/transactions/` | High |
| Original amount | `total_obligation` at first transaction | Derived | Medium |
| Current total | `total_obligation` from `/awards/{id}/` | `/awards/{id}/` | High |
| Options vs exercised | `base_exercised_options`, `base_and_all_options` | `/awards/{id}/` | High |

**Implementation note:** Must paginate `/transactions/` to get full modification history. Each transaction has `federal_action_obligation` (can be positive/negative/zero). Sum positive obligations and compare to base award amount.

**Live finding:** Sample MIT contract has modifications numbered through Q6 (alphanumeric), with hasNext=true. Some mods are $0 (administrative), some negative (de-obligations). Will need to filter administrative mods.

**Action type codes:**
- `B` = Supplemental Agreement
- `C` = Funding Only
- `D` = Change Order
- `M` = Other Administrative

---

### R006: Price Outliers

| Need | Field | Source | Fill Rate |
|------|-------|--------|-----------|
| Award amount | `Award Amount` | Search results | High |
| NAICS code | `NAICS Code` | Search results | Medium |
| PSC code | `PSC Code` | Search results | Medium |
| Award type | `Contract Award Type` | Search results | High |

**Implementation note:** Group awards by NAICS or PSC code. Compute mean and standard deviation within each group. Flag outliers. Requires sufficient group size (min 5 awards per group).

**Live finding:** NAICS and PSC codes are available in search results, but may be null for some older contracts. The award detail endpoint provides full NAICS/PSC hierarchies.

---

## Data Volume Estimates

| Slice | Estimated Records | Collection Method |
|-------|-------------------|-------------------|
| DOD → MIT, 2020-2024 | ~50-200 awards | API pagination (2-3 pages) |
| DOD → MIT, all time | ~500 awards | API pagination (5-10 pages) |
| DOD → all recipients, 1 year | ~500K+ awards | Bulk download |
| Single agency, 1 year | 10K-100K awards | Bulk download or cursor pagination |

**Live finding:** DOD-MIT spending grew from $824M/yr (FY2015) to $1.47B/yr (FY2024). The API confirmed hasNext on a limit=1 search, but does not provide total counts -- must paginate to exhaustion or use download endpoints.

---

## Data Quality Issues

1. **`number_of_offers_received` often null** -- poor fill rate even for competed contracts. This is the most critical gap for R001.
2. **Recipient name inconsistency** -- same entity appears under multiple names/UEI registrations (e.g., "LOCKHEED MARTIN CORPORATION" appears twice in top-25 with different amounts). Need deduplication via `recipient_id` or parent company lookup.
3. **No total result counts** -- API doesn't return total matching records. Must paginate or use download endpoints.
4. **Descriptions truncated** in search results (~100 chars). Full text in award detail.
5. **DOD 90-day delay** -- DOD contract data has a 90-day publication lag for national security.
6. **Minimum date 2007-10-01** -- search endpoints don't go further back.

---

## Collection Strategy for MVP

```
1. Search with filters (agency + recipient + period)
   → spending_by_award, 100/page, cursor-based pagination
   → Cache: .cache/responses/{hash}.json

2. For each award: fetch detail
   → /awards/{generated_internal_id}/
   → Gets: competition data, offers received, pricing type
   → Cache: .cache/details/{internal_id}.json

3. For flagged awards: fetch modifications
   → /transactions/ with award_id
   → Paginate all modifications
   → Cache: .cache/transactions/{internal_id}.json

4. Aggregate analytics
   → spending_by_category/recipient for concentration
   → spending_over_time for trends
   → Cache: .cache/analytics/{query_hash}.json

5. Normalize all → NormalizedAward[]
   → Validate with zod schema
   → Export to .cache/normalized/awards.csv + awards.json
```

**Estimated API calls for DOD-MIT slice:**
- 2-3 pages of search results (~200 awards)
- 200 individual award detail calls
- ~50 transaction history calls (for awards with modifications)
- 2-3 aggregate analytics calls
- **Total: ~255 API calls, ~2 minutes at 2 req/sec**
