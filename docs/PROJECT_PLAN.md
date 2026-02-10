# Procurement Investigator - Project Plan

## Executive Summary

Build **`investigate`**, a TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, evidence, and open questions. The tool uses a multi-agent architecture orchestrated by Claude Opus 4.6 to demonstrate frontier model capabilities at Anthropic's hackathon.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim links to evidence, every run produces a git-committable case folder.

---

## Phase Overview

| Phase | Name | Deliverable | Artifact |
|-------|------|-------------|----------|
| 0 | API Discovery & Data Exploration | Live API analysis, field mapping, sample data | `docs/api-analysis.md`, `exploration/` |
| 1 | Repository Setup & Scaffolding | TypeScript project, CLI skeleton, config system | Working `investigate --help` |
| 2 | Collector Agent (Data Ingestion) | Paginated API client, caching, snapshots | `investigate fetch --agency=DoD --recipient=MIT` |
| 3 | Signaler Agent (Red-Flag Engine) | 6 MVP indicators with configurable thresholds | Signal table output |
| 4 | Hypothesis + Prover Agents | AI-generated hypotheses, evidence tables/charts | `evidence/` folder with artifacts |
| 5 | Verifier + Narrator Agents | Claim verification, case.md assembly | Complete case folder |
| 6 | Integration & Demo | End-to-end pipeline, demo case | Hackathon-ready demo |

---

## Phase 0: API Discovery & Data Exploration

**Goal:** Understand the actual data we'll work with. Make real API calls, inspect responses, map fields to red-flag indicators.

### Tasks

1. **Explore USAspending endpoints with live calls**
   - Hit `/api/v2/search/spending_by_award/` with sample filters (DoD + MIT)
   - Hit `/api/v2/awards/{id}/` for individual award detail (competition data, offers received)
   - Hit `/api/v2/transactions/` for modification history
   - Hit `/api/v2/search/spending_by_category/recipient` for vendor concentration
   - Save raw responses to `exploration/` folder

2. **Map API fields to red-flag indicators**
   - For each of the 6 MVP indicators, confirm which endpoint + field provides the data
   - Document data gaps and workarounds
   - Identify which fields require individual award detail calls vs. search-level data

3. **Estimate data volumes for our target slice**
   - DoD → MIT: ~500 prime awards (manageable for MVP)
   - Test pagination mechanics (100 per page, cursor-based for >10K)
   - Measure API response times to calibrate throttling

4. **Document findings**

### Artifact
- `docs/api-analysis.md` -- field-to-indicator mapping, endpoint strategy, data volume estimates
- `exploration/` -- raw sample responses from each endpoint

---

## Phase 1: Repository Setup & Scaffolding

**Goal:** Set up a production-quality TypeScript monorepo with CLI, config system, and module boundaries.

### Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Node.js 20+ | LTS, native fetch, good TypeScript support |
| Language | TypeScript 5.x (strict mode) | Required by hackathon team |
| CLI Framework | `commander` | Most popular, well-maintained, excellent TypeScript types |
| HTTP Client | Native `fetch` + `p-retry` + `p-throttle` | No heavy deps; `p-retry` for backoff, `p-throttle` for rate limiting |
| Config | `cosmiconfig` + `zod` | Config file discovery + runtime validation |
| Testing | `vitest` | Fast, native ESM + TypeScript, Jest-compatible API |
| Logging | `pino` | Structured JSON logging, fast, low overhead |
| Data Processing | Built-in + `simple-statistics` | Quartile/percentile calculations for indicators |
| AI/LLM | `@anthropic-ai/sdk` | Claude API for hypothesis generation and narration |
| Charts | `vega-lite` (JSON spec) + `vl-convert` | Reproducible chart specs, SVG/PNG export |
| Markdown | `unified` + `remark` | Programmatic markdown generation and manipulation |

### Project Structure

```
bid-buster/
├── src/
│   ├── cli/                    # CLI entry point and commands
│   │   ├── index.ts            # Main entry, commander setup
│   │   ├── commands/
│   │   │   ├── investigate.ts  # Main investigation command
│   │   │   ├── fetch.ts        # Data collection only
│   │   │   └── signal.ts       # Run signals only (on cached data)
│   │   └── config.ts           # Config loading + validation (zod)
│   │
│   ├── collector/              # Collector Agent
│   │   ├── usaspending.ts      # USAspending API client
│   │   ├── paginator.ts        # Pagination + cursor handling
│   │   ├── cache.ts            # Request/response caching
│   │   ├── snapshot.ts         # Snapshot management
│   │   └── types.ts            # API response types
│   │
│   ├── normalizer/             # Data normalization layer
│   │   ├── awards.ts           # Normalize award records
│   │   ├── transactions.ts     # Normalize modification records
│   │   └── schema.ts           # Internal canonical schema (zod)
│   │
│   ├── signaler/               # Signaler Agent
│   │   ├── engine.ts           # Signal computation engine
│   │   ├── indicators/         # Individual indicator modules
│   │   │   ├── base.ts         # Indicator interface (fold/reduce/finalize)
│   │   │   ├── single-bid.ts   # R001: Single-bid competitions
│   │   │   ├── non-competitive.ts # R002: Non-competitive awards
│   │   │   ├── splitting.ts    # R003: Contract value splitting
│   │   │   ├── concentration.ts # R004: Vendor concentration
│   │   │   ├── modifications.ts # R005: Excessive modifications
│   │   │   └── price-outliers.ts # R006: Price outliers
│   │   ├── config.ts           # Indicator thresholds + params
│   │   └── types.ts            # Signal output types
│   │
│   ├── hypothesis/             # Hypothesis Maker Agent
│   │   ├── generator.ts        # Template-based hypothesis generation
│   │   ├── templates.ts        # Non-accusatory language templates
│   │   └── ai-enhance.ts      # Claude API for narrative refinement
│   │
│   ├── prover/                 # Prover Agent
│   │   ├── analyzer.ts         # Statistical analysis runner
│   │   ├── charts.ts           # Chart generation (vega-lite specs)
│   │   ├── tables.ts           # Evidence table generation
│   │   └── types.ts            # Evidence artifact types
│   │
│   ├── verifier/               # Verifier Agent
│   │   ├── checker.ts          # Claim-evidence cross-reference
│   │   └── types.ts            # Verification result types
│   │
│   ├── narrator/               # Narrator Agent
│   │   ├── report.ts           # case.md assembly
│   │   ├── sections.ts         # Section generators
│   │   └── disclaimer.ts       # Ethical disclaimers and caveats
│   │
│   ├── orchestrator/           # Agent orchestration
│   │   ├── pipeline.ts         # Sequential pipeline runner
│   │   └── context.ts          # Shared investigation context
│   │
│   └── shared/                 # Shared utilities
│       ├── logger.ts           # Pino logger setup
│       ├── fs.ts               # File system helpers
│       └── provenance.ts       # provenance.json generation
│
├── config/
│   └── default.yaml            # Default configuration
│
├── tests/
│   ├── unit/                   # Unit tests per module
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test fixtures (sample API responses)
│
├── docs/                       # Documentation
├── references/                 # Reference repos
├── exploration/                # Phase 0 API exploration data
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Tasks

1. **Initialize TypeScript project**
   - `package.json` with ESM configuration
   - `tsconfig.json` with strict mode
   - Vitest configuration
   - ESLint + Prettier (minimal config)

2. **Set up CLI skeleton**
   - Commander-based CLI with `investigate`, `fetch`, `signal` subcommands
   - Global options: `--config`, `--output`, `--verbose`, `--dry-run`
   - Config loading with cosmiconfig + zod validation

3. **Define core types and interfaces**
   - Indicator interface (inspired by Cardinal's `Calculate` trait):
     ```typescript
     interface Indicator {
       id: string;
       name: string;
       description: string;
       configure(settings: IndicatorSettings): void;
       fold(record: NormalizedAward): void;
       reduce(other: IndicatorState): void;
       finalize(): Signal[];
     }
     ```
   - Normalized award schema (zod)
   - Signal output type
   - Case folder structure types

4. **Set up logging and provenance**
   - Structured logging with pino
   - Provenance metadata collection (timestamps, versions, git hash)

### Artifact
- Working `npx investigate --help` command
- All module stubs with interfaces defined
- Passing `vitest` with placeholder tests

---

## Phase 2: Collector Agent (Data Ingestion)

**Goal:** Retrieve, cache, and normalize procurement data from USAspending API.

### Design (inspired by Kingfisher-Collect)

```
USAspending API
    │
    ▼
┌──────────────┐
│  Paginator   │  100 results/page, cursor-based for >10K
│  + Throttle  │  0.3-0.5s delay, exponential backoff on 429/500
│  + Retry     │  3 retries with p-retry
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Cache     │  .cache/requests/ (payload JSON)
│   (fs-based) │  .cache/responses/ (raw response JSON)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Normalizer  │  → NormalizedAward[] (zod-validated)
│              │  .cache/normalized/ (CSV + JSON)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Snapshot   │  provenance.json + manifest
│              │  Frozen dataset for reproducibility
└──────────────┘
```

### Endpoints to Implement

| Priority | Endpoint | Purpose |
|----------|----------|---------|
| P0 | `spending_by_award` (POST) | Primary award search with filters |
| P0 | `awards/{id}` (GET) | Individual award detail (competition data) |
| P1 | `transactions` (POST) | Modification history per award |
| P1 | `spending_by_category/recipient` (POST) | Vendor concentration aggregates |
| P2 | `spending_over_time` (POST) | Time series for trend analysis |
| P2 | `download/awards` (POST) | Bulk download for large slices |

### Normalized Award Schema

```typescript
interface NormalizedAward {
  // Identifiers
  awardId: string;           // PIID or FAIN
  internalId: string;        // USAspending generated ID
  parentAwardId?: string;    // Parent IDV PIID

  // Parties
  recipientName: string;
  recipientUei?: string;
  recipientId?: string;      // Hash for recipient endpoint
  awardingAgency: string;
  awardingSubAgency?: string;
  fundingAgency?: string;

  // Financials
  awardAmount: number;
  totalObligation?: number;
  baseExercisedOptions?: number;
  baseAndAllOptions?: number;

  // Classification
  awardType: string;         // A, B, C, D
  naicsCode?: string;
  pscCode?: string;
  description?: string;

  // Dates
  startDate: string;         // ISO date
  endDate?: string;
  dateModified?: string;

  // Competition (from individual award detail)
  extentCompeted?: string;
  extentCompetedDescription?: string;
  numberOfOffersReceived?: number;
  solicitationProcedures?: string;
  otherThanFullAndOpen?: string;
  typeOfContractPricing?: string;
  fedBizOpps?: string;       // Posted on SAM.gov?

  // Modifications (populated separately)
  modificationCount?: number;
  totalModificationAmount?: number;
}
```

### Tasks

1. **Build USAspending API client**
   - Typed request/response interfaces for each endpoint
   - Native fetch with `p-throttle` (2 requests/second) and `p-retry` (3 retries, exponential backoff)
   - Handle HTTP 429, 500, and transient errors

2. **Build paginator**
   - Page-based pagination (up to 100 pages x 100 results)
   - Cursor-based pagination for >10K results (using `last_record_unique_id`)
   - Progress reporting via logger

3. **Build cache layer**
   - File-based cache keyed by request payload hash (SHA-256)
   - `.cache/requests/` and `.cache/responses/` directories
   - Cache hit/miss logging
   - `--no-cache` flag to force fresh requests

4. **Build normalizer**
   - Transform raw API responses to `NormalizedAward[]`
   - Zod validation for data integrity
   - CSV export for human inspection

5. **Build snapshot manager**
   - Freeze dataset with timestamp
   - Generate `provenance.json` (timestamp, git hash, API version, record counts, file hashes)
   - `manifest.json` with slice parameters and data quality notes

6. **Build detail enrichment pipeline**
   - For each award from search, optionally fetch `/awards/{id}/` for competition details
   - Batch with throttling (this is the expensive step)
   - Cache individual award details

### Artifact
- Working `investigate fetch --agency="Department of Defense" --recipient="MASSACHUSETTS INSTITUTE OF TECHNOLOGY" --period=2020-01-01:2024-12-31`
- Cached data in `.cache/` with provenance
- Normalized CSV/JSON output

---

## Phase 3: Signaler Agent (Red-Flag Engine)

**Goal:** Compute 6 MVP red-flag indicators from cached data, outputting a structured signal table.

### Design (inspired by Cardinal-rs)

Three-phase processing per indicator, mirroring Cardinal's `Calculate` trait:

```typescript
interface Indicator {
  readonly id: string;        // e.g., "R001"
  readonly name: string;      // e.g., "Single-Bid Competition"
  readonly description: string;

  // Phase 1: Configure with settings from config
  configure(settings: IndicatorConfig): void;

  // Phase 2: Process each record (fold)
  fold(award: NormalizedAward): void;

  // Phase 3: Finalize and produce signals
  finalize(): Signal[];

  // Metadata for transparency
  getMetadata(): IndicatorMetadata;
}

interface Signal {
  indicatorId: string;
  indicatorName: string;
  severity: 'low' | 'medium' | 'high';
  entityType: 'award' | 'recipient' | 'agency';
  entityId: string;
  entityName: string;
  value: number;           // Measured value
  threshold: number;       // Threshold that was exceeded
  context: string;         // Human-readable context
  affectedAwards: string[]; // Award IDs involved
}
```

### 6 MVP Indicators

| ID | Name | Data Source | Logic |
|----|------|-----------|-------|
| R001 | Single-Bid Competition | `numberOfOffersReceived` from award detail | Flag awards where offers = 1 AND extent_competed includes competitive types |
| R002 | Non-Competitive Awards | `extentCompeted` from award detail | Flag awards with codes B (Not Available), C (Not Competed), G (Not Competed Under SAP), NDO |
| R003 | Contract Value Splitting | `awardAmount` grouped by agency + recipient + period | Detect clusters of awards just below federal thresholds ($250K SAT) |
| R004 | Vendor Concentration | `awardAmount` aggregated by recipient per agency | Flag where single vendor >30% of agency's annual spend |
| R005 | Excessive Modifications | Transaction history from `/transactions/` | Flag contracts with >5 modifications OR >100% cost growth |
| R006 | Price Outliers | `awardAmount` grouped by NAICS/PSC | Flag awards >2 standard deviations above mean for same category |

### Indicator Implementation Details

**R001 - Single-Bid Competition:**
- Requires: `numberOfOffersReceived`, `extentCompeted`
- Logic: If `extentCompeted` in [A, CDO, D, E, F] (competitive) AND `numberOfOffersReceived == 1`
- Aggregation: Track percentage per agency as performance indicator
- Benchmark: EU considers >20% single-bid rate as high-risk

**R003 - Contract Value Splitting:**
- Requires: `awardAmount`, `awardingAgency`, `recipientName`, `startDate`
- Logic: Group awards by (agency, recipient, quarter). Within each group, count awards in threshold bands:
  - $225K-$250K (micro-purchase to SAT boundary)
  - $7M-$7.5M (for larger thresholds)
- Statistical test: Compare observed frequency near threshold vs. expected uniform distribution
- Configurable: threshold values, band width, minimum cluster size

**R004 - Vendor Concentration:**
- Requires: `awardAmount`, `recipientName`, `awardingAgency`, fiscal year
- Logic: Compute Herfindahl-Hirschman Index (HHI) per agency, flag vendors with >30% share
- Also flag sudden concentration spikes (year-over-year change)

**R005 - Excessive Modifications:**
- Requires: Transaction data from `/api/v2/transactions/`
- Logic: For each award, count modifications and sum `federal_action_obligation` changes
- Flag: mod_count > threshold OR (current_total / original_amount) > growth_threshold
- Configurable: modification count threshold (default: 5), growth threshold (default: 2.0x)

**R006 - Price Outliers:**
- Requires: `awardAmount`, `naicsCode` or `pscCode`
- Logic: Within each NAICS/PSC group, compute mean and std dev of award amounts
- Flag: awards > mean + 2*stddev (IQR method also available, configurable)
- Cardinal-inspired: use quartile method (Q3 + 1.5*IQR) as alternative

### Configuration Schema

```yaml
# config/default.yaml
signals:
  R001_single_bid:
    enabled: true
    severity_threshold: 0.20  # >20% single-bid rate = high severity
    require_competitive_type: true

  R002_non_competitive:
    enabled: true
    codes_to_flag: ["B", "C", "G", "NDO"]

  R003_splitting:
    enabled: true
    thresholds: [250000, 7500000]
    band_width_pct: 0.10  # 10% below threshold
    min_cluster_size: 3
    period: "quarter"

  R004_concentration:
    enabled: true
    vendor_share_threshold: 0.30
    spike_threshold: 0.15  # 15% year-over-year increase

  R005_modifications:
    enabled: true
    max_modification_count: 5
    max_growth_ratio: 2.0

  R006_price_outliers:
    enabled: true
    method: "iqr"  # "iqr" or "zscore"
    iqr_multiplier: 1.5
    zscore_threshold: 2.0
    min_group_size: 5
```

### Tasks

1. **Build indicator base class and registry**
   - Interface matching Cardinal's fold/finalize pattern
   - Dynamic indicator loading from config
   - Signal output type with severity levels

2. **Implement each indicator (R001-R006)**
   - Unit tests with fixture data per indicator
   - Configurable thresholds from config.yaml
   - Metadata output (thresholds used, data coverage, group sizes)

3. **Build signal aggregation engine**
   - Run all enabled indicators across the dataset
   - Produce combined signal table (sorted by severity)
   - Cross-reference: when multiple signals affect same entity, boost severity
   - Output as structured JSON + human-readable table

4. **Add signal CLI command**
   - `investigate signal --input=<snapshot-dir>` runs signals on cached data
   - `--indicator=R001,R003` to run specific indicators
   - Output to stdout (table) and `signals.json`

### Artifact
- Working `investigate signal` command producing signal table
- 6 indicators with passing unit tests
- Configurable via `config.yaml`

---

## Phase 4: Hypothesis + Prover Agents

**Goal:** Convert signals into narrative hypotheses, then produce evidence artifacts (tables, charts) to test them.

### Hypothesis Maker Design

**Template-based generation + AI enhancement:**

```typescript
interface Hypothesis {
  id: string;                // e.g., "H001"
  signalIds: string[];       // Signals that triggered this hypothesis
  question: string;          // Non-accusatory question form
  context: string;           // Background explaining why this matters
  evidenceNeeded: string[];  // What analysis would help assess this
  severity: 'low' | 'medium' | 'high';
}
```

**Templates (non-accusatory, following OECD guidance):**

| Signal Pattern | Hypothesis Template |
|----------------|---------------------|
| R001 high rate for agency | "Are contract opportunities from {agency} reaching a sufficiently broad supplier base? {pct}% of competitively-solicited contracts received only one bid." |
| R002 clustered on recipient | "Does {recipient}'s award portfolio from {agency} warrant review? {count} of {total} awards ({pct}%) were made without full competition." |
| R003 detected | "Are there patterns in award sizing near the ${threshold} simplified acquisition threshold for {agency}? {count} awards from {agency} to {recipient} fall within {band}% of the threshold during {period}." |
| R004 triggered | "Is there an unusual concentration of spending? {recipient} received {pct}% of {agency}'s contract value in {year}, totaling ${amount}." |
| R005 flagged | "Have contract terms for {awardId} changed substantially post-award? The contract has undergone {count} modifications, with total obligations growing from ${original} to ${current} ({growth}% increase)." |
| R006 flagged | "Is the award amount for {awardId} (${amount}) unusual for {naics} category contracts? It exceeds the category median by {factor}x." |

**Claude API enhancement (optional but impressive for hackathon):**
- Feed signals + templates to Claude Opus 4.6
- Ask for refined narrative that:
  - Maintains non-accusatory tone
  - Adds relevant context about procurement practices
  - Suggests specific follow-up questions
  - Notes potential innocent explanations

### Prover Design

For each hypothesis, generate evidence artifacts:

| Evidence Type | Format | Example |
|---------------|--------|---------|
| Distribution chart | Vega-Lite JSON → SVG | Award amount distribution by recipient |
| Time series | Vega-Lite JSON → SVG | Award modifications over time |
| Summary table | CSV + Markdown | Top recipients by agency spend |
| Cross-tab | CSV + Markdown | Competition type by agency |
| Anomaly highlight | JSON + Markdown | Specific flagged records with details |

### Tasks

1. **Build hypothesis generator**
   - Template engine with variable interpolation
   - Signal-to-hypothesis mapping rules
   - Combine related signals into composite hypotheses
   - Output structured `Hypothesis[]`

2. **Integrate Claude API for narrative enhancement**
   - Use `@anthropic-ai/sdk` to call Claude
   - System prompt enforcing non-accusatory tone
   - Pass signal data + templates, receive enhanced narrative
   - Fallback to template-only if API unavailable

3. **Build evidence generator (Prover)**
   - For each hypothesis, determine required analyses
   - Generate Vega-Lite chart specifications
   - Generate summary statistics tables (markdown + CSV)
   - Store all artifacts in `evidence/` with consistent naming

4. **Build chart renderer**
   - Vega-Lite JSON specs for reproducibility
   - SVG/PNG export via `vl-convert`
   - Consistent styling and labeling

### Artifact
- Working hypothesis generation from signal table
- Evidence folder with charts and tables
- Claude-enhanced narrative (when API key available)

---

## Phase 5: Verifier + Narrator Agents

**Goal:** Verify all claims are backed by evidence, then assemble the final case.md report.

### Verifier Design

```typescript
interface VerificationResult {
  claimId: string;
  claim: string;
  status: 'supported' | 'unsupported' | 'partial';
  evidenceRefs: string[];  // Paths to evidence files
  notes?: string;
}
```

The verifier:
1. Parses `case.md` (or the structured report data before rendering)
2. For each factual claim (signal value, count, percentage):
   - Checks that a corresponding evidence file exists
   - Verifies the number in the claim matches the evidence
3. For each hypothesis:
   - Checks that at least one evidence artifact addresses it
4. Produces a verification report
5. Fails the build if unsupported claims remain (CI-friendly exit code)

### Narrator Design

Assembles the final case report:

```markdown
# Investigation Case File: {agency} → {recipient}
## Investigation Period: {start} to {end}

### Disclaimer
> This report is a screening instrument. Red flags are indicators that
> warrant further investigation by competent authorities. They are not
> proof of wrongdoing. (OECD 2025, OCP 2024)

### Executive Summary
{AI-generated summary of key findings}

### Data Overview
- **Source:** USAspending API (snapshot: {date})
- **Scope:** {count} awards, ${total} total value
- **Coverage:** {coverage notes}

### Signals Detected
| ID | Indicator | Severity | Entity | Value | Threshold |
|----|-----------|----------|--------|-------|-----------|
{signal_table}

### Hypotheses & Evidence

#### H001: {hypothesis_question}
**Triggered by:** {signal_ids}
**Context:** {context}
**Evidence:**
- [Distribution Chart](evidence/h001-distribution.svg) [^1]
- [Summary Table](evidence/h001-summary.csv) [^2]
**Assessment:** {evidence_summary}

{...repeat for each hypothesis...}

### Open Questions
- {items requiring human follow-up}

### Data Quality Notes
- {coverage gaps, missing fields, caveats}

### Methodology
- Indicators based on OCP Red Flags Guide (2024) [^ref]
- Thresholds: {configurable values used}
- Tool version: {version}, commit: {hash}

### References
[^1]: evidence/h001-distribution.svg (generated {timestamp})
[^2]: evidence/h001-summary.csv ({row_count} records)
```

### Tasks

1. **Build verifier**
   - Parse structured report data
   - Cross-reference claims to evidence files
   - Numeric verification (claim value matches evidence)
   - Produce verification report JSON
   - Exit code 1 if unsupported claims found

2. **Build narrator**
   - Section generators for each report section
   - Footnote management (auto-numbering, linking)
   - Provenance section with tool metadata
   - Claude API for executive summary generation

3. **Build case folder assembler**
   - Create output directory structure:
     ```
     case-{timestamp}/
     ├── case.md
     ├── evidence/
     ├── queries/
     ├── analysis/
     └── provenance.json
     ```
   - Copy/symlink cached queries into `queries/`
   - Generate provenance.json

### Artifact
- Complete case folder generation
- Verified case.md with evidence links
- provenance.json with full metadata

---

## Phase 6: Integration & Demo

**Goal:** Wire everything together, polish the end-to-end flow, prepare hackathon demo.

### End-to-End Pipeline

```
investigate --agency="Department of Defense" \
            --recipient="MASSACHUSETTS INSTITUTE OF TECHNOLOGY" \
            --period=2020-01-01:2024-12-31 \
            --output=./cases/dod-mit-2024

Pipeline:
  1. Collector  → fetch + cache + normalize
  2. Signaler   → compute 6 indicators → signal table
  3. Hypothesis  → generate questions from signals
  4. Prover     → produce evidence artifacts
  5. Verifier   → validate all claims
  6. Narrator   → assemble case.md

Output: cases/dod-mit-2024/
```

### Tasks

1. **Wire orchestrator pipeline**
   - Sequential agent execution with shared context
   - Progress reporting (spinner + structured logs)
   - Error handling and partial-run recovery
   - `--dry-run` mode that shows what would happen

2. **Polish CLI experience**
   - Colored output with progress indicators
   - `--verbose` and `--quiet` modes
   - Helpful error messages with suggestions
   - Example commands in `--help`

3. **Create demo case**
   - Run full investigation on DoD → MIT slice
   - Review and curate the output
   - Ensure the case.md is compelling and clear
   - Screenshot/record the demo flow

4. **Write README**
   - Installation and quickstart
   - Architecture overview with diagram
   - Example output
   - API key setup instructions

5. **Ensure hackathon compliance**
   - Open source license (MIT or Apache 2.0)
   - Clean git history
   - No pre-existing code
   - Ethical disclaimers in README and output

### Artifact
- Working end-to-end `investigate` command
- Demo case folder with real data
- Hackathon-ready README

---

## Opus 4.6 Capabilities to Showcase

The project should demonstrate these frontier model features:

1. **Multi-agent orchestration:** 6 specialized agents (Collector, Signaler, Hypothesis Maker, Prover, Verifier, Narrator) with clear responsibilities and handoffs.

2. **Long-context processing:** Feed entire dataset slices (hundreds of awards with full detail) into the hypothesis and narration steps.

3. **Structured output:** Generate typed JSON (signals, hypotheses, verification results) from Claude API calls, not just free-text.

4. **Code generation:** Prover agent generates analysis scripts/queries dynamically based on the specific signals detected.

5. **Verification and self-correction:** Verifier agent catches unsupported claims and triggers revision.

6. **Ethical reasoning:** Hypothesis Maker maintains non-accusatory tone, considers alternative explanations, follows OECD guidance.

7. **Reproducibility:** Every AI-generated artifact includes the prompt, model version, and parameters used, making the analysis auditable.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API instability / rate limits | Aggressive caching, offline mode from snapshots, bulk download fallback |
| Data quality gaps | Minimum coverage thresholds per indicator, data quality notes in report |
| False positives | Multiple severity levels, combination scoring, clear disclaimers |
| Time pressure (hackathon) | Phases 0-3 are core; Phases 4-5 can use simpler templates without Claude API; Phase 6 can skip polish |
| Claude API costs | Cache API responses, use templates as fallback, minimize token usage |

---

## Execution Order & Dependencies

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6
  │            │            │            │            │            │            │
  │            │            │            │            │            │            │
  API          CLI          Fetch        Signals      Hypotheses   Case.md      Demo
  analysis     skeleton     working      working      + Evidence   verified     ready
```

**Parallelization opportunities:**
- Phase 0 exploration + Phase 1 scaffolding can overlap
- Within Phase 3, indicators R001-R006 can be developed in parallel
- Phase 4 hypothesis templates can be drafted while Phase 3 indicators are being coded
- Phase 5 narrator templates can be drafted during Phase 4

---

## Session Resumption Protocol

Each phase produces artifacts that serve as checkpoints. To resume:

1. Check `docs/PROJECT_PLAN.md` for overall status
2. Check `docs/phase-{N}-complete.md` for phase completion notes
3. Check git log for latest committed work
4. The `.cache/` directory preserves all API data across sessions
5. `provenance.json` in any case folder describes the exact state of that run

After completing each phase, we'll create a `docs/phase-{N}-complete.md` file documenting:
- What was accomplished
- Key decisions made
- Any deviations from plan
- Starting point for next phase
