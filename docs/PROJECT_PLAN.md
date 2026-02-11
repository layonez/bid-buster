# Procurement Investigator - Project Plan

> **Last updated:** 2026-02-11
> **Current stage:** Enhanced MVP complete. Next: Opus 4.6 autonomous investigative agent.

## Executive Summary

**`investigate`** is a TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, CSV evidence tables, and open questions. It uses a multi-agent architecture with Claude AI enhancement at multiple stages.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim is verified against computed evidence, every run produces a git-committable case folder with CSV evidence files.

**Next evolution: Autonomous Investigative Agent.** Static rules engines (Cardinal-rs, OCDS Red Flags toolkit) detect patterns. Analysts then spend weeks chasing those patterns through multiple data sources, forming theories, validating them. **Opus 4.6 can do the analyst's job** -- not just flag "high concentration," but autonomously reason: "This looks like a UARC arrangement, let me check SAM.gov entity type to confirm, and if so, reframe the finding as expected rather than suspicious." The differentiator isn't better rules. It's an **autonomous investigative agent that reasons, decides what data it needs, fetches it, iterates, and produces a fully-referenced case file that a human can validate in minutes instead of weeks.**

---

## Current Implementation Status

### What's Built and Working

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| CLI (commander) | 5 | ~420 | Complete -- 3 commands: `run`, `fetch`, `signal`; `--with-transactions` flag |
| Collector (API client) | 4 | ~679 | Complete -- pagination, throttling, caching, detail + transaction enrichment |
| Normalizer | 3 | ~167 | Complete -- search results, award details, transactions |
| Signaler (6 indicators) | 9 | ~1,039 | Complete -- all 6 indicators with configurable thresholds |
| Hypothesis Maker | 2 | ~214 | Complete -- templates + Claude AI executive assessment |
| Prover (evidence tables) | 1 | ~612 | Complete -- CSV evidence per hypothesis (R001-R006) + master summary |
| Narrator + Enhancer | 2 | ~280 | Complete -- case.md with evidence links + AI per-hypothesis enrichment |
| Verifier | 1 | ~103 | Complete -- 10-point claim-evidence cross-check |
| Orchestrator | 1 | ~150 | Complete -- 7-step pipeline with prover + AI narrator |
| Shared utilities | 4 | ~224 | Complete -- logger, fs, provenance, types |
| **Total** | **33 files** | **~3,900 lines** | **33/33 fully implemented (100%)** |

**No stubs remaining.** All agents are fully operational.

### Test Suite

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `config.test.ts` | 3 | Config loading, defaults, threshold merging |
| `indicators.test.ts` | 9 | R001 (single-bid), R002 (non-competitive), R003 (splitting), R004 (concentration), R006 (price outliers) |
| `engine.test.ts` | 3 | Engine initialization, indicator filtering, severity sorting |
| `hypothesis.test.ts` | 4 | Template generation, non-accusatory language, deduplication |
| `report.test.ts` | 7 | Disclaimer, signal table, hypotheses, provenance, methodology refs, evidence links |
| `prover.test.ts` | 5 | Evidence artifact generation, CSV validity, escaping, master summary, executive skip |
| **Total** | **31** | **All passing** |

### Validated on Real Data

**Demo slice:** Department of Defense → MIT, FY2023
- 54 awards fetched and cached from USAspending API
- 54 award details enriched (competition data, offers received, pricing type)
- **3 signals detected:**
  - R004 **HIGH**: 100% vendor concentration ($11.4B across 54 awards)
  - R002 **MEDIUM**: 79.6% non-competitive awards (43/54)
  - R006 **MEDIUM**: 1 price outlier at 3.7x NAICS category mean
- **4 hypotheses generated** (3 templates + 1 AI executive assessment)
- **10/10 claims verified** (verification passed)
- AI executive assessment correctly identified MIT Lincoln Lab as a likely UARC arrangement

### Git History

```
50f22db Add CLAUDE.md project constitution
70add6a Update PROJECT_PLAN.md as comprehensive implementation reference
bd46b7a Add verifier agent, AI enhancement, README, and MIT license
a0446c3 Phase 4-5: Hypothesis generation, report assembly, and full pipeline
abbfe9f Phase 2-3: Collector agent with live API + signal command wired to real data
344ebef Phase 1: TypeScript scaffolding, CLI, and 6 red-flag indicators
b4d3f10 Phase 0: Project plan, API exploration, and hackathon brief
a795bb9 Add knowledge base documents and reference repositories
9cdde71 first commit
```

---

## Architecture

### Current: 7-Step Pipeline

```
investigate run [--agency=<name>] [--recipient=<name>] --period=<start:end> [--with-transactions]

  Step 1: COLLECT       USAspending API → paginate → cache → normalize
  Step 2: SIGNAL        6 indicators × fold/finalize → signal table
  Step 3: HYPOTHESIZE   templates + Claude AI → non-accusatory questions
  Step 4: PROVE         CSV evidence tables per hypothesis → evidence/ directory
  Step 5: ENHANCE       AI-refined per-hypothesis narrative (Claude Sonnet)
  Step 6: REPORT        case.md with disclaimer, signals, hypotheses, evidence links, methodology
  Step 7: VERIFY        10-point claim-evidence cross-check → pass/fail
```

### Target: 8-Step Pipeline (with Opus 4.6 Investigative Agent)

```
investigate run [--agency=<name>] [--recipient=<name>] --period=<start:end> [--deep] [--charts]

  Step 1: COLLECT       USAspending API → paginate → cache → normalize
  Step 2: SIGNAL        6 indicators × fold/finalize → signal table
  Step 3: INVESTIGATE   Opus 4.6 agent examines signals, fetches enrichment, iterates (NEW)
  Step 4: HYPOTHESIZE   templates + agent findings merge → enriched questions
  Step 5: PROVE         CSV tables + SVG charts → evidence/ directory (UPDATED)
  Step 6: ENHANCE       AI-refined per-hypothesis narrative (Claude Sonnet)
  Step 7: REPORT        case.md + dashboard.html (UPDATED)
  Step 8: VERIFY        cross-check claims against evidence → pass/fail
```

The architectural shift:

```
Current:  Collect -> Rules -> Template -> Report  (static, one-pass)

Target:   Collect -> Rules -> OPUS INVESTIGATOR -> Report
                               |
                    +----------------------------+
                    |  Examines initial signals   |
                    |  Plans investigation        |
                    |  Fetches enrichment data    | <-- SAM.gov, OpenSanctions,
                    |  Cross-references sources   |     sub-awards
                    |  Tests hypotheses           |
                    |  Iterates if needed         |
                    |  Assembles evidence chain   |
                    +----------------------------+
```

### Source Layout (actual)

```
src/
├── cli/                          # CLI entry point + commands
│   ├── index.ts                  # Entry, dotenv, commander setup
│   ├── config.ts                 # Config schema + defaults merging
│   └── commands/
│       ├── investigate.ts        # `run` -- full pipeline (--with-transactions)
│       ├── fetch.ts              # `fetch` -- data collection only
│       └── signal.ts             # `signal` -- indicators on cached data
│
├── collector/                    # Collector Agent
│   ├── index.ts                  # Orchestrates collection + normalization
│   ├── usaspending.ts            # API client (pagination, throttle, retry, cache)
│   ├── cache.ts                  # File-based SHA-256-keyed response cache
│   └── types.ts                  # Full USAspending API type definitions
│
├── normalizer/                   # Data normalization
│   ├── schema.ts                 # NormalizedAward + Transaction (zod schemas)
│   ├── awards.ts                 # Search result + detail enrichment transforms
│   └── transactions.ts           # Transaction/modification normalization
│
├── signaler/                     # Signaler Agent
│   ├── engine.ts                 # Orchestrates all indicators, sorts by severity
│   ├── types.ts                  # Indicator interface, SignalEngineResult
│   └── indicators/
│       ├── base.ts               # BaseIndicator abstract (fold/finalize pattern)
│       ├── single-bid.ts         # R001: competitive tenders with 1 bidder
│       ├── non-competitive.ts    # R002: awards bypassing open competition
│       ├── splitting.ts          # R003: clusters near regulatory thresholds
│       ├── concentration.ts      # R004: dominant supplier detection
│       ├── modifications.ts      # R005: excessive post-award changes
│       └── price-outliers.ts     # R006: IQR/z-score outlier detection
│
├── hypothesis/                   # Hypothesis Maker Agent
│   ├── generator.ts              # Template + Claude AI executive assessment
│   └── templates.ts              # 6 indicator-specific non-accusatory templates
│
├── prover/                       # Prover Agent
│   └── analyzer.ts               # CSV evidence tables per hypothesis (all 6 indicators)
│
├── verifier/                     # Verifier Agent
│   └── checker.ts                # 10-point claim-evidence cross-check
│
├── narrator/                     # Narrator Agent
│   ├── report.ts                 # case.md assembly (all sections + evidence links)
│   └── enhancer.ts               # AI per-hypothesis narrative enrichment
│
├── orchestrator/                 # Pipeline orchestration
│   └── pipeline.ts               # 7-step sequential pipeline runner
│
└── shared/                       # Shared utilities
    ├── types.ts                  # Signal, Hypothesis, Evidence, Provenance, etc.
    ├── logger.ts                 # Pino structured logging
    ├── fs.ts                     # Case folder creation, JSON I/O, SHA-256
    └── provenance.ts             # Git commit, timestamps, versioning
```

### Case Folder Output

Each run of `investigate run` produces:

```
cases/case-YYYY-MM-DD/
├── case.md               # Full investigation report (markdown)
├── signals.json          # Structured signal data
├── hypotheses.json       # Generated hypotheses with evidence needs
├── evidence-manifest.json # Evidence artifact metadata and references
├── verification.json     # Claim-by-claim verification results
├── awards.json           # Normalized award data (full dataset)
├── provenance.json       # Audit trail (timestamp, git hash, versions)
├── evidence/             # CSV evidence tables per hypothesis
│   ├── awards-summary.csv              # Master dataset with all key fields
│   ├── H-R002-*-competition-breakdown.csv  # Competition type distribution
│   ├── H-R002-*-non-competed-awards.csv    # Non-competed awards detail
│   ├── H-R004-*-vendor-concentration.csv   # Vendor share analysis
│   ├── H-R006-*-price-analysis.csv         # Price outlier statistics
│   └── ...                                  # Per-hypothesis evidence files
├── queries/              # (future: raw API request/response pairs)
└── analysis/             # (future: reproducible analysis scripts)
```

**Target case folder (after Phase E):**

```
cases/case-YYYY-MM-DD/
├── case.md                        # Full report with chart references
├── dashboard.html                 # Interactive single-file dashboard (NEW)
├── signals.json
├── hypotheses.json
├── investigation.json             # Opus agent findings + tool call log (NEW)
├── evidence-manifest.json
├── verification.json
├── awards.json
├── provenance.json
├── evidence/
│   ├── awards-summary.csv
│   ├── H-R002-*-*.csv
│   ├── award-distribution.svg     # (NEW) Vega-Lite charts
│   ├── vendor-concentration.svg   # (NEW)
│   ├── competition-breakdown.svg  # (NEW)
│   └── ...
├── enrichment/                    # (NEW) Raw enrichment data
│   ├── sam-gov-entities.json
│   ├── sanctions-screening.json
│   └── subawards.json
├── queries/
└── analysis/
```

---

## Next Implementation: Opus 4.6 Investigative Agent

### Vision

What makes this impossible without Opus 4.6: The model decides what to investigate deeper, which sources to query, when findings change the interpretation, and when the investigation is complete. No static pipeline can do this.

**Key shifts:**

1. **From Rules Engine to Reasoning Agent** -- Opus 4.6 looks at initial signals, plans an investigation strategy, requests additional data, revises hypotheses based on enrichment data, and decides when it is done.

2. **From CSV Tables to a Verifiable Evidence Package** -- Visual charts (Vega-Lite SVG) embedded directly in the report, interactive HTML dashboard, pinpoint references with cross-reference matrix showing which sources support which claims.

3. **From Single-Source to Multi-Source Intelligence** -- USAspending alone has limited fields. Real investigations cross-reference SAM.gov (entity type, FFRDC status), OpenSanctions (sanctions/PEP screening), USAspending sub-awards (pass-through arrangements).

4. **Iterative Deepening** -- The killer feature no rules engine has:
   - Iteration 1: Run signals on USAspending data -> 3 signals detected
   - Iteration 2: Opus examines signals -> "Concentration is 100% but let me check entity type" -> Fetches SAM.gov -> "MIT Lincoln Lab is a UARC (FFRDC)" -> Revises hypothesis: "Concentration is structurally expected"
   - Iteration 3: Opus notices non-competitive rate is high -> "Let me check if these use sole-source justifications allowed for FFRDCs" -> Fetches competition justification data -> Conclusion: "Pattern is consistent with FFRDC designation, but 3 awards lack proper justification codes -- THESE are the ones worth investigating"

### Implementation Phases

#### Phase A: Multi-Source Enrichment Clients (4 new files)

Build API clients for external data sources using existing caching/throttling infrastructure.

**A1: `src/enrichment/types.ts`** -- Shared types for all enrichment results:
- `EntityVerification` -- SAM.gov entity data (type, status, exclusions, CAGE, parent company)
- `SanctionsScreenResult` -- OpenSanctions match (score, datasets, topics, matched name)
- `SubAwardData` -- Sub-award recipient, amount, description, link to prime
- `EnrichmentResult` -- Union of all enrichment types with source provenance

**A2: `src/enrichment/sam-gov.ts`** -- SAM.gov Entity Management API v3 client:
- `searchEntity(name: string)` -- Search by legal business name
- `lookupByUei(uei: string)` -- Direct UEI lookup
- `checkExclusions(name: string)` -- Search exclusions/debarment list
- Auth: API key from `.env` (`SAM_GOV_API_KEY`), graceful fallback if missing
- Rate limit: Cache aggressively (entity data changes rarely), max 1000 req/day
- Reuse: `ResponseCache` from `src/collector/cache.ts`, `p-retry` + `p-throttle`

**A3: `src/enrichment/open-sanctions.ts`** -- OpenSanctions Match API client:
- `screenEntity(name: string, schema?: "Company" | "Person")` -- Fuzzy match against sanctions/PEP lists
- Scoring: `algorithm=logic-v2`, threshold 0.7
- Auth: API key from `.env` (`OPENSANCTIONS_API_KEY`), optional
- Graceful fallback: if no API key, skip with warning

**A4: `src/enrichment/subawards.ts`** -- USAspending Sub-Awards client:
- `fetchSubAwards(awardId: string)` -- Get sub-awards for a prime award
- No auth required (same as main API)
- Reuse: existing `USAspendingClient` throttle/cache infrastructure

#### Phase B: Opus 4.6 Investigative Agent (2 new files) -- THE CENTERPIECE

**B1: `src/investigator/tools.ts`** -- Tool definitions for the agent:

| Tool | Description | Maps To |
|------|-------------|---------|
| `verify_entity` | Look up entity in SAM.gov (type, status, exclusions, parent company) | `sam-gov.ts` |
| `screen_sanctions` | Screen entity against sanctions/PEP lists | `open-sanctions.ts` |
| `fetch_subawards` | Get sub-contracting data for a specific award | `subawards.ts` |
| `fetch_comparable_awards` | Get similar awards from other agencies/recipients for comparison | USAspending search API |
| `analyze_statistical_pattern` | Run statistical analysis on a subset of awards | In-memory computation |
| `lookup_award_detail` | Get full details for a specific award by ID | Existing `USAspendingClient` |

Each tool returns structured JSON with source provenance embedded (which API, endpoint, timestamp, cache status).

**B2: `src/investigator/agent.ts`** -- The autonomous investigation loop:

```
Input: signals, awards, config, logger
Output: InvestigationFindings (enriched hypotheses + cross-references + evidence chain)
```

**Flow:**
1. Build initial prompt with all signals, award summary stats, and data quality notes
2. System prompt establishes the agent as a procurement integrity analyst with strict non-accusatory rules
3. Agent receives tools and decides what to investigate
4. Loop: call API -> check `stop_reason` -> if `tool_use`, execute tools, append results -> repeat
5. Max iterations cap (configurable, default 10) to prevent runaway loops
6. Agent produces structured findings as final text output (parsed via JSON block)

**Key design decisions:**
- Model: `claude-opus-4-6` (not Sonnet -- this is where the reasoning power matters)
- `max_tokens: 4096` per turn (agent needs room to reason)
- `tool_choice: { type: "auto" }` -- agent decides when and which tools to use
- System prompt enforces: non-accusatory language, cite every source, explain innocent alternatives, reference specific data points
- Each tool result includes `{ source, endpoint, timestamp, cacheHit }` provenance

**Example agent reasoning (DoD-MIT investigation):**
1. "R004 shows 100% concentration. Let me check SAM.gov for MIT's entity type." -> `verify_entity("MASSACHUSETTS INST OF TECHNOLOGY")`
2. Discovers MIT Lincoln Lab is registered as FFRDC -> "Concentration is structurally expected for FFRDCs"
3. "R002 shows 79.6% non-competitive. Let me check if this rate is normal for FFRDCs." -> `fetch_comparable_awards({ naics: "541715", excludeRecipient: "MIT" })`
4. Finds other FFRDC recipients have similar rates -> "Pattern consistent with FFRDC designation"
5. "Let me screen MIT against sanctions lists as a baseline check." -> `screen_sanctions("Massachusetts Institute of Technology")`
6. Clean result -> "No sanctions concerns"
7. "3 awards lack proper competition codes despite FFRDC status. These warrant review." -> Final findings

#### Phase C: Vega-Lite Visual Evidence (2 new files)

**C1: `src/prover/charts.ts`** -- Vega-Lite specification builders:

| Chart | Spec Builder | When Generated |
|-------|-------------|----------------|
| Award Distribution Histogram | `buildAwardDistributionSpec(awards)` | Always |
| Vendor Concentration Pie | `buildVendorConcentrationSpec(awards)` | When R004 fires |
| Competition Breakdown Bar | `buildCompetitionBreakdownSpec(awards)` | When R001 or R002 fires |
| Price Outlier Scatter | `buildPriceOutlierSpec(awards, signals)` | When R006 fires |
| Modification Timeline | `buildModificationTimelineSpec(transactions)` | When R005 fires + transactions available |
| Threshold Clustering | `buildThresholdClusteringSpec(awards)` | When R003 fires |

Each returns a Vega-Lite JSON spec with inline data (no external references).

**C2: `src/prover/renderer.ts`** -- Server-side SVG rendering:
- Uses `vega` + `vega-lite` packages (SVG mode -- no system dependencies)
- `renderChartToSvg(spec: VegaLiteSpec): Promise<string>` -- compile to Vega, render via View API
- Writes SVG files to `evidence/` directory
- Graceful fallback: if Vega import fails, skip charts with warning (CSV evidence still works)

**New dependencies:** `npm install vega vega-lite` (SVG-only, no `node-canvas` needed)

#### Phase D: Interactive HTML Dashboard (1 new file)

**D1: `src/narrator/dashboard.ts`** -- Generate a self-contained `dashboard.html`:
- Loads Vega/Vega-Lite/Vega-Embed from jsDelivr CDN
- All data embedded inline as JSON (awards, signals, hypotheses, evidence manifest)
- Sections: Executive Summary, interactive signal table, charts per hypothesis, evidence links, provenance trail
- Template approach: build HTML string with interpolated data
- Single file, opens in any browser, no server needed

#### Phase E: Pipeline Integration + CLI (3 file updates)

**E1: Update `src/orchestrator/pipeline.ts`** -- Expand to 8-step pipeline with investigator as step 3

**E2: Update `src/cli/commands/investigate.ts`** -- New flags:
- `--deep` enables the Opus investigative agent (default: off for fast runs)
- `--no-ai` disables all AI features (templates only)
- `--charts` enables Vega-Lite chart generation (default: on if vega installed)

**E3: Update `src/narrator/report.ts`** -- Include SVG chart references, investigator findings section, dashboard link

#### Phase F: Tests (3 new + 2 updated)

**F1: `tests/unit/enrichment.test.ts`** -- SAM.gov, OpenSanctions, sub-awards clients with mocked HTTP; graceful fallback when API keys missing

**F2: `tests/unit/investigator.test.ts`** -- Tool definition schema validity; agent loop with mocked Anthropic responses; max iteration cap; findings structure

**F3: `tests/unit/charts.test.ts`** -- Vega-Lite spec generation; schema validation; SVG rendering produces valid output

**F4: Update `tests/unit/report.test.ts`** -- Verify chart references appear in case.md

**F5: Update `tests/unit/prover.test.ts`** -- Verify SVG artifacts in evidence manifest

### Implementation Order

| Step | Phase | Files | Depends On | Parallelizable |
|------|-------|-------|------------|----------------|
| 1 | A (Enrichment types + clients) | 4 new files | Nothing | Yes (with step 3) |
| 2 | B (Investigative agent) | 2 new files | Phase A | No |
| 3 | C (Charts) | 2 new files | Nothing | Yes (with step 1) |
| 4 | D (Dashboard) | 1 new file | Phase C | No |
| 5 | E (Pipeline + CLI integration) | 3 file updates | Phases A-D | No |
| 6 | F (Tests) | 3 new + 2 updated | Phases A-E | No |

Steps 1 and 3 can run in parallel. Total: ~13 new/modified files.

### New Dependencies

```
npm install vega vega-lite    # Chart rendering (SVG mode, no system deps)
```

### New Environment Variables (`.env`)

```
ANTHROPIC_API_KEY=...          # (existing) For Opus 4.6 agent + Sonnet enhancement
SAM_GOV_API_KEY=...            # (new, optional) Register at sam.gov/profile/details
OPENSANCTIONS_API_KEY=...      # (new, optional) Register at opensanctions.org/account/
```

---

## Multi-Source Enrichment API Reference

### SAM.gov Entity Management API

**Base URL:** `https://api.sam.gov/entity-information/v3/entities`

**Authentication:** Free API key from `https://sam.gov/profile/details`. Sent as query parameter `api_key=KEY`.

**Rate Limits:**

| User Type | Requests/Day |
|---|---|
| Non-federal, no role | 10 |
| Non-federal/Federal with roles | 1,000 |
| Federal System accounts | 10,000 |

**Key Endpoints:**

| Endpoint | Use |
|----------|-----|
| `GET /v3/entities?api_key=KEY&legalBusinessName=QUERY` | Search by business name |
| `GET /v3/entities?api_key=KEY&ueiSAM=UEI` | Look up by Unique Entity Identifier (up to 100 comma-separated) |
| `GET /v3/entities?api_key=KEY&cageCode=CODE` | Look up by CAGE code (up to 100) |
| `GET /v4/exclusions?api_key=KEY&exclusionName=QUERY` | Search exclusions/debarment by name |
| `GET /v4/exclusions?api_key=KEY&ueiSAM=UEI` | Look up exclusions by UEI |

**Data Returned:**
- **Entity Registration:** UEI, CAGE code, legal business name, DBA name, registration status, exclusion status flag, entity structure, registration dates
- **Core Data:** Physical/mailing address, business type codes, NAICS/PSC codes, entity hierarchy (parent UEI, parent legal business name), congressional district, state/country of incorporation
- **Integrity Information (v3+):** Proceedings data (date, type, description) -- must be explicitly requested via query parameters
- **Exclusions API:** Classification type (Individual, Firm, Vessel), exclusion type (Ineligible, Prohibition/Restriction, Voluntary), excluding agency, activation/termination dates, UEI, CAGE, record status

**Cost:** Free. Government-operated.

**Value for Investigation:** Entity verification, debarment/exclusion screening, business size classification, CAGE code cross-referencing, integrity proceedings discovery, parent company relationships.

### OpenSanctions Match API

**Base URL:** `https://api.opensanctions.org/match/{dataset}`

**Authentication:** API key in `Authorization` header. Register at `https://www.opensanctions.org/account/` for a 30-day trial key. Non-commercial use is free.

**Dataset Collections:**

| Collection | Contents |
|---|---|
| `default` | Full database: hundreds of sources including government watchlists, research databases |
| `sanctions` | Government-issued sanctions lists only |
| `peps` | Politically Exposed Persons only |
| `us_sanctions` | US federal watchlists (OFAC SDN, etc.) |

**Fuzzy Matching Request:**
```json
POST /match/default
{
  "queries": {
    "q1": {
      "schema": "Company",
      "properties": {
        "name": ["Raytheon Technologies"],
        "jurisdiction": ["US"]
      }
    }
  }
}
```

**Scoring:** `algorithm=logic-v2` (rule-based, fuzzy name + identifiers), threshold 0.7.

**Pricing:** 0.10 EUR per API call. Free tier for non-commercial users. 30-day free trial sufficient for hackathon.

### USAspending Sub-Awards

**Endpoint:** `POST https://api.usaspending.gov/api/v2/subawards/`

**Request:**
```json
{
  "page": 1,
  "limit": 10,
  "sort": "subaward_number",
  "order": "desc",
  "award_id": "25882628"
}
```

**Also available via search:** The existing `/search/spending_by_award/` endpoint accepts `"subawards": true` to switch from prime awards to subawards. Fields include: Sub-Award ID, Sub-Awardee Name, Subawardee UEI, Sub-Award Amount, Sub-Award Date, Sub-Award Description, Prime Award ID, Prime Recipient Name, NAICS/PSC codes.

**Auth:** None required. **Rate Limits:** None documented.

**Value:** Pass-through detection, concentration analysis at sub-award level, self-dealing detection, award fragmentation analysis, potential new indicator R007 "Sub-Award Concentration."

### Integration Priority

| Priority | API | Rationale |
|---|---|---|
| **1 (Highest)** | SAM.gov Entity + Exclusions | Free, directly relevant, enables debarment screening and entity verification |
| **2** | USAspending Sub-Awards | Same API infrastructure, enables pass-through detection |
| **3** | OpenSanctions | Sanctions/PEP screening adds international risk dimension. 30-day trial sufficient |

---

## Visual Evidence Strategy

### Approach: Vega-Lite SVG + Self-Contained HTML Dashboard

**Server-side rendering (CLI output):**
- NPM packages: `vega`, `vega-lite`
- SVG export works without `node-canvas` (no system dependencies)
- Pattern: Create Vega-Lite spec -> compile to Vega -> initialize server-side View (renderer: 'none') -> export via `.toSVG()`
- SVG files written to `evidence/` directory alongside CSV tables

**Chart types per indicator:**

| Chart | Indicator | Vega-Lite Mark |
|-------|-----------|----------------|
| Award Distribution Histogram | Always | `bin` + `bar` |
| Vendor Concentration Pie/Donut | R004 | `arc` |
| Competition Breakdown Stacked Bar | R001, R002 | `bar` (stacked) |
| Price Outlier Scatter | R006 | `point` |
| Modification Timeline | R005 | `line` |
| Threshold Clustering Histogram | R003 | `bin` + `bar` + `rule` |

**Interactive HTML Dashboard (`dashboard.html`):**
- Vega-Lite + Vega-Embed loaded from jsDelivr CDN
- All data embedded inline as JSON (awards, signals, hypotheses)
- `simple-datatables` CDN for interactive signal table (sortable, filterable)
- Sections: Executive Summary, interactive signal table, charts per hypothesis, evidence links, provenance
- Single self-contained HTML file, opens in any browser, no server needed
- Template approach: build HTML string with interpolated data, write to case folder

---

## Technology Stack (implemented)

| Concern | Choice | Why | Version |
|---------|--------|-----|---------|
| Runtime | Node.js 20+ | LTS, native fetch | v20.19.4 |
| Language | TypeScript (strict, ESM) | Team requirement | 5.x |
| CLI | `commander` | Popular, excellent TS types | 14.x |
| HTTP | Native `fetch` + `p-retry` + `p-throttle` | Lightweight; backoff + rate limiting | |
| Config | `cosmiconfig` | Auto-discovers config files | 9.x |
| Validation | `zod` | Runtime schema validation | 4.x (compat layer) |
| AI | `@anthropic-ai/sdk` | Claude API for hypothesis + narrative enhancement | 0.74.x |
| Statistics | `simple-statistics` | Quartile/percentile for indicators | 7.x |
| Logging | `pino` | Structured JSON, fast | 10.x |
| Testing | `vitest` | Fast, ESM-native, Jest-compatible | 4.x |
| Env | `dotenv` | Load ANTHROPIC_API_KEY from .env | |

**Planned additions:** `vega` + `vega-lite` (SVG chart rendering, no system deps).

---

## Indicator Design (Cardinal-rs inspired)

Each indicator follows a **fold/finalize** pattern adapted from Cardinal-rs's `Calculate` trait:

```typescript
interface Indicator {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  configure(settings: IndicatorConfig): void;   // Apply thresholds from config
  fold(award: NormalizedAward): void;            // Process one record
  foldTransactions?(id: string, txns: Transaction[]): void;  // Optional
  finalize(): Signal[];                          // Produce signals
  getMetadata(): IndicatorMetadata;              // Transparency: thresholds, coverage
}
```

**Why this pattern:** It's stateless per-record, configurable, and produces metadata alongside results for transparency. The `SignalEngine` orchestrates all indicators, runs them in sequence, and sorts results by severity.

### Indicator Details

| ID | Indicator | Key Fields | Thresholds | Data Coverage (DoD-MIT) |
|----|-----------|------------|------------|------------------------|
| R001 | Single-Bid Competition | `numberOfOffersReceived`, `extentCompeted` | >20% rate = high severity | 39% (field often null) |
| R002 | Non-Competitive Awards | `extentCompeted` codes B,C,G,NDO | >80% rate = high | 100% |
| R003 | Contract Splitting | `awardAmount` near $250K/$7.5M | 3+ awards in 10% band | 100% |
| R004 | Vendor Concentration | `awardAmount` per recipient/agency | >30% share = flag | 100% |
| R005 | Excessive Modifications | Transaction count + cost growth | >5 mods OR >2x growth | Requires `--with-transactions` |
| R006 | Price Outliers | `awardAmount` by NAICS/PSC | Q3 + 1.5*IQR | 100% |

All configurable via `config/default.yaml`.

---

## Key Decisions & Rationale

### Architecture Decisions

1. **fold/finalize instead of fold/reduce/finalize** -- Cardinal-rs uses reduce for parallel processing across rayon threads. We don't need parallelism in Node.js, so we simplified to fold → finalize.

2. **zod v3 compat layer, not v4 direct** -- zod v4's `.default({})` on nested objects requires full output-typed defaults. The compat layer (`import { z } from "zod"`) allows `.default({})` with field-level defaults. We use explicit defaults merging in `config.ts` instead.

3. **Claude Sonnet for enhancement, Opus for investigation** -- Sonnet is cost-efficient for per-hypothesis narrative enrichment (`max_tokens: 384-512`). Opus 4.6 is reserved for the investigative agent where reasoning power matters (`max_tokens: 4096`).

4. **File-based cache with SHA-256 keys** -- Simple, filesystem-only, no dependencies. Cache survives across sessions. `--no-cache` flag for fresh API calls.

5. **Cursor-based pagination** -- USAspending's search API uses `last_record_unique_id` for cursor pagination beyond page 100. We handle both page-based and cursor-based in the same loop.

6. **Non-accusatory language is structural, not just a prompt** -- Templates are hard-coded to use question form ("Does the pattern warrant review?"), the AI system prompts explicitly require non-accusatory tone, and the verifier checks for disclaimer presence.

7. **CSV evidence over charts for MVP** -- CSV tables are universally accessible, need no visualization dependencies, and provide auditable raw data. Vega-Lite SVG charts are the next enhancement.

8. **7-step pipeline (expanded from 5, expanding to 8)** -- Added Prover (evidence generation) and Enhancer (AI narrative) as distinct steps. The investigative agent will become step 3, expanding to 8 steps.

9. **Agent tool-calling over prompt-stuffing** -- The Opus investigative agent uses structured tool definitions (`Tool` type from Anthropic SDK) rather than asking the model to generate API calls as text. This gives typed inputs/outputs and reliable execution.

### Data Decisions

1. **DoD → MIT as demo slice** -- ~54 awards in 2023, manageable volume, all from Air Force (Lincoln Lab), low reputational risk for demo purposes.

2. **`number_of_offers_received` is often null** -- Discovered during Phase 0 API exploration. This limits R001 coverage to ~39%. The signal engine reports coverage gaps transparently in metadata.

3. **Recipient deduplication not yet implemented** -- Same company can appear under multiple UEI registrations (e.g., Lockheed Martin). The `recipient_id` hash can be used for deduplication in a future pass.

4. **Detail enrichment is the expensive step** -- Fetching `/awards/{id}/` for each award requires one API call per award (throttled to 2/sec). For 54 awards, this takes ~27 seconds on first run, then instant from cache.

---

## USAspending API Reference (validated)

**Base URL:** `https://api.usaspending.gov/api/v2/`
**Auth:** None required. **Rate limits:** None documented (design defensively).

### Endpoints Used

| Endpoint | Method | Use | Implemented |
|----------|--------|-----|-------------|
| `/search/spending_by_award/` | POST | Primary award search (filters, pagination) | Yes |
| `/awards/{id}/` | GET | Individual award detail (competition data, offers) | Yes |
| `/transactions/` | POST | Modification history per award | Yes |
| `/search/spending_by_category/recipient/` | POST | Vendor concentration aggregates | Yes |
| `/subawards/` | POST | Sub-award data per prime award | Planned (Phase A) |
| `/search/spending_over_time/` | POST | Time series for trend analysis | Not yet |
| `/download/awards/` | POST | Bulk CSV export (>10K records) | Not yet |

### Critical API Findings

- **100 results/page max** on search; cursor-based pagination for >10K
- **`number_of_offers_received` often null** -- even for competed contracts
- **Recipient names inconsistent** -- same entity under multiple registrations
- **No total result counts** -- must paginate to exhaustion
- **DOD data has 90-day publication delay**
- **Minimum date: 2007-10-01** for search endpoints

Full field mapping in `docs/api-analysis.md`.

---

## Configuration Reference

All thresholds in `config/default.yaml`:

```yaml
api:
  baseUrl: "https://api.usaspending.gov/api/v2"
  requestsPerSecond: 2          # Throttle
  maxRetries: 3                 # Exponential backoff
  pageSize: 100                 # Max per API

cache:
  directory: ".cache"
  enabled: true

ai:
  enabled: true                 # Falls back to templates if no API key
  model: "claude-opus-4-6-20250219"

signals:
  R001_single_bid:
    severityThreshold: 0.20     # >20% = high (EU benchmark)
    requireCompetitiveType: true

  R002_non_competitive:
    codesToFlag: ["B", "C", "G", "NDO"]

  R003_splitting:
    thresholds: [250000, 7500000]
    bandWidthPct: 0.10          # 10% below threshold
    minClusterSize: 3
    period: "quarter"

  R004_concentration:
    vendorShareThreshold: 0.30  # >30% of agency spend
    spikeThreshold: 0.15        # YoY increase

  R005_modifications:
    maxModificationCount: 5
    maxGrowthRatio: 2.0         # >2x original

  R006_price_outliers:
    method: "iqr"               # or "zscore"
    iqrMultiplier: 1.5          # Standard outlier
    minGroupSize: 5
```

---

## Hackathon Compliance

| Requirement | Status |
|-------------|--------|
| Open source (all components) | MIT license |
| New work only (started during hackathon) | Yes -- git history proves it |
| Team size ≤ 2 | Yes |
| No banned content | Public data only, non-accusatory framing |
| Problem statement alignment | **#2 "Break the Barriers"** -- expert procurement audit methodology in everyone's hands |

---

## Enhancement Roadmap

### Completed

| Enhancement | Status |
|-------------|--------|
| **Prover agent** -- CSV evidence tables per hypothesis | Done |
| **Transaction integration** -- `--with-transactions` flag for R005 | Done |
| **AI-enhanced narrator** -- Claude refines per-hypothesis text | Done |
| **Broader demo support** -- `--agency` is now optional | Done |

### Next: Opus 4.6 Investigative Agent (Phases A-F)

| Phase | What | Files | Status |
|-------|------|-------|--------|
| A | Multi-source enrichment clients (SAM.gov, OpenSanctions, sub-awards) | 4 new | Planned |
| B | Opus 4.6 investigative agent (tool-calling loop) | 2 new | Planned |
| C | Vega-Lite visual evidence (chart specs + SVG renderer) | 2 new | Planned |
| D | Interactive HTML dashboard | 1 new | Planned |
| E | Pipeline integration + CLI flags (`--deep`, `--charts`) | 3 updates | Planned |
| F | Tests (enrichment, investigator, charts) | 3 new + 2 updates | Planned |

### Long-Term (post-hackathon)

| Enhancement | What |
|-------------|------|
| OCDS data format support | International procurement datasets |
| Beneficial ownership (BODS) | Link suppliers to ultimate owners |
| Network analysis | Entity relationship graphs |
| More indicators | Expand from 6 to OCP's full 73-indicator catalogue |
| CI/CD integration | Auto-run on schedule, alert on new signals |
| Recipient deduplication | Use `recipient_id` hash + parent company lookup |
| Bulk download fallback | `/download/awards/` for >10K record slices |

---

## Session Resumption Protocol

To resume development:

1. **Read this document** -- contains full implementation state and decisions
2. **Check git log** -- `git log --oneline` shows what's committed
3. **Run tests** -- `npm test` (31 tests, all should pass)
4. **Run typecheck** -- `npm run typecheck` (should be clean)
5. **Check cache** -- `.cache/` preserves API data; re-runs are instant
6. **Check cases/** -- previous investigation outputs preserved

### Key files for context

| File | Purpose |
|------|---------|
| `docs/PROJECT_PLAN.md` | This document -- full implementation state |
| `docs/PROJECT_BRIEF.md` | Hackathon-ready project description |
| `docs/api-analysis.md` | USAspending field-to-indicator mapping |
| `config/default.yaml` | All configurable thresholds |
| `src/signaler/types.ts` | Core Indicator interface |
| `src/shared/types.ts` | All shared type definitions |
| `src/prover/analyzer.ts` | Evidence generation per hypothesis |
| `src/narrator/enhancer.ts` | AI narrative enrichment |
| `src/orchestrator/pipeline.ts` | 7-step pipeline runner (expanding to 8) |
| `exploration/README.md` | API exploration findings |
