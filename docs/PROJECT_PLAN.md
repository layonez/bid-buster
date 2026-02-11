# Procurement Investigator - Project Plan

> **Last updated:** 2026-02-11
> **Current stage:** MVP complete (Phases 0-6 done). Ready for enhancement.

## Executive Summary

**`investigate`** is a TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, evidence, and open questions. It uses a multi-agent architecture with optional Claude AI enhancement.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim is verified against computed evidence, every run produces a git-committable case folder.

---

## Current Implementation Status

### What's Built and Working

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| CLI (commander) | 5 | ~405 | Complete -- 3 commands: `run`, `fetch`, `signal` |
| Collector (API client) | 4 | ~679 | Complete -- pagination, throttling, caching, detail enrichment |
| Normalizer | 3 | ~167 | Complete -- search results, award details, transactions |
| Signaler (6 indicators) | 9 | ~1,039 | Complete -- all 6 indicators with configurable thresholds |
| Hypothesis Maker | 2 | ~214 | Complete -- templates + Claude AI executive assessment |
| Narrator | 1 | ~156 | Complete -- full case.md with disclaimer, methodology, provenance |
| Verifier | 1 | ~103 | Complete -- 10-point claim-evidence cross-check |
| Orchestrator | 1 | ~118 | Complete -- 5-step pipeline: Collect → Signal → Hypothesize → Report → Verify |
| Shared utilities | 4 | ~224 | Complete -- logger, fs, provenance, types |
| **Total** | **31 files** | **~3,100 lines** | **30/31 fully implemented (97%)** |

**One stub remaining:** `src/prover/analyzer.ts` (evidence chart/table generation -- stretch goal).

### Test Suite

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `config.test.ts` | 3 | Config loading, defaults, threshold merging |
| `indicators.test.ts` | 9 | R001 (single-bid), R002 (non-competitive), R003 (splitting), R004 (concentration), R006 (price outliers) |
| `engine.test.ts` | 3 | Engine initialization, indicator filtering, severity sorting |
| `hypothesis.test.ts` | 4 | Template generation, non-accusatory language, deduplication |
| `report.test.ts` | 5 | Disclaimer, signal table, hypotheses, provenance, methodology refs |
| **Total** | **24** | **All passing** |

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

### 5-Step Pipeline

```
investigate run --agency=<name> --period=<start:end> [--recipient=<name>]

  Step 1: COLLECT    USAspending API → paginate → cache → normalize
  Step 2: SIGNAL     6 indicators × fold/finalize → signal table
  Step 3: HYPOTHESIZE  templates + Claude AI → non-accusatory questions
  Step 4: REPORT     case.md with disclaimer, signals, hypotheses, methodology
  Step 5: VERIFY     10-point claim-evidence cross-check → pass/fail
```

### Source Layout (actual)

```
src/
├── cli/                          # CLI entry point + commands
│   ├── index.ts                  # Entry, dotenv, commander setup
│   ├── config.ts                 # Config schema + defaults merging
│   └── commands/
│       ├── investigate.ts        # `run` -- full pipeline
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
│   ├── generator.ts              # Template + Claude AI enhancement
│   └── templates.ts              # 6 indicator-specific non-accusatory templates
│
├── prover/                       # Prover Agent (stub)
│   └── analyzer.ts               # TODO: evidence chart/table generation
│
├── verifier/                     # Verifier Agent
│   └── checker.ts                # 10-point claim-evidence cross-check
│
├── narrator/                     # Narrator Agent
│   └── report.ts                 # case.md assembly (all sections)
│
├── orchestrator/                 # Pipeline orchestration
│   └── pipeline.ts               # 5-step sequential pipeline runner
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
├── case.md              # Full investigation report (markdown)
├── signals.json         # Structured signal data
├── hypotheses.json      # Generated hypotheses with evidence needs
├── verification.json    # Claim-by-claim verification results
├── awards.json          # Normalized award data (full dataset)
├── provenance.json      # Audit trail (timestamp, git hash, versions)
├── evidence/            # (future: charts, tables, CSV extracts)
├── queries/             # (future: raw API request/response pairs)
└── analysis/            # (future: reproducible analysis scripts)
```

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
| AI | `@anthropic-ai/sdk` | Claude API for hypothesis enhancement | 0.74.x |
| Statistics | `simple-statistics` | Quartile/percentile for indicators | 7.x |
| Logging | `pino` | Structured JSON, fast | 10.x |
| Testing | `vitest` | Fast, ESM-native, Jest-compatible | 4.x |
| Env | `dotenv` | Load ANTHROPIC_API_KEY from .env | |

**Not yet used (planned for stretch):** `vega-lite` + `vl-convert` (charts), `unified` + `remark` (markdown processing).

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
| R005 | Excessive Modifications | Transaction count + cost growth | >5 mods OR >2x growth | 0% (needs `--with-transactions`) |
| R006 | Price Outliers | `awardAmount` by NAICS/PSC | Q3 + 1.5*IQR | 100% |

All configurable via `config/default.yaml`.

---

## Key Decisions & Rationale

### Architecture Decisions

1. **fold/finalize instead of fold/reduce/finalize** -- Cardinal-rs uses reduce for parallel processing across rayon threads. We don't need parallelism in Node.js, so we simplified to fold → finalize.

2. **zod v3 compat layer, not v4 direct** -- zod v4's `.default({})` on nested objects requires full output-typed defaults. The compat layer (`import { z } from "zod"`) allows `.default({})` with field-level defaults. We use explicit defaults merging in `config.ts` instead.

3. **Claude Sonnet for hypothesis enhancement, not Opus** -- Cost efficiency. The executive assessment uses `claude-sonnet-4-5-20250929` with `max_tokens: 512` to keep API costs low while still producing high-quality interpretive text.

4. **File-based cache with SHA-256 keys** -- Simple, filesystem-only, no dependencies. Cache survives across sessions. `--no-cache` flag for fresh API calls.

5. **Cursor-based pagination** -- USAspending's search API uses `last_record_unique_id` for cursor pagination beyond page 100. We handle both page-based and cursor-based in the same loop.

6. **Non-accusatory language is structural, not just a prompt** -- Templates are hard-coded to use question form ("Does the pattern warrant review?"), and the AI system prompt explicitly requires non-accusatory tone. The verifier checks for disclaimer presence.

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

## Next Stages (Enhancement Roadmap)

### Near-Term (high impact, moderate effort)

| Enhancement | What | Why |
|-------------|------|-----|
| **Prover agent** | Generate Vega-Lite charts + CSV evidence tables per hypothesis | Visual evidence makes the case folder dramatically more compelling |
| **Broader demo** | Run on agency-only (no recipient filter) to get diverse signals | Current demo is single-recipient which limits R003/R004 interest |
| **Transaction integration** | Default `--with-transactions` for R005 coverage | Currently 0% coverage on modifications indicator |
| **AI-enhanced narrator** | Use Claude to refine each hypothesis section, not just executive summary | More natural prose, better context per finding |

### Medium-Term (stretch goals)

| Enhancement | What | Why |
|-------------|------|-----|
| **SAM.gov integration** | Entity Management API for UEI verification, business type enrichment | Cross-reference recipients, detect shell companies |
| **OpenSanctions screening** | Fuzzy-match suppliers against sanctions/PEP lists | Critical for anti-corruption use case |
| **Recipient deduplication** | Use `recipient_id` hash + parent company lookup | Same company under multiple registrations inflates concentration |
| **Interactive dashboard** | Streamlit or web-based evidence explorer | Hackathon demo impact |
| **Bulk download fallback** | `/download/awards/` for >10K record slices | Scale beyond API pagination limits |

### Long-Term (post-hackathon)

| Enhancement | What |
|-------------|------|
| OCDS data format support | International procurement datasets |
| Beneficial ownership (BODS) | Link suppliers to ultimate owners |
| Network analysis | Entity relationship graphs |
| More indicators | Expand from 6 to OCP's full 73-indicator catalogue |
| CI/CD integration | Auto-run on schedule, alert on new signals |

---

## Session Resumption Protocol

To resume development:

1. **Read this document** -- contains full implementation state and decisions
2. **Check git log** -- `git log --oneline` shows what's committed
3. **Run tests** -- `npm test` (24 tests, all should pass)
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
| `exploration/README.md` | API exploration findings |
