# Procurement Investigator -- Project Constitution

## What This Project Is

**Procurement Investigator** (`investigate`) is an open-source TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, CSV evidence tables, and open questions. It uses a multi-agent architecture with Claude AI enhancement at multiple stages.

Built for **Anthropic's Hackathon 2025**, aligned with **Problem Statement #2: "Break the Barriers"** -- taking expert procurement audit methodology (OECD, OCP, World Bank) and putting it in everyone's hands.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim is verified against computed evidence, every run produces a git-committable case folder.

## Why This Matters

Public procurement is one-third of government spending (~$700B/year in the US alone). Corruption and waste in procurement are detected by experts using red-flag indicators -- patterns in bidding, pricing, competition, and contract modifications. But this expertise is locked behind expensive tools and institutional knowledge. We're codifying it into a reproducible, transparent, open-source pipeline that anyone -- journalists, civil society watchdogs, oversight offices, or concerned citizens -- can run.

## The Core Principle: Investigation-as-Code

Every finding must be:
- **Reproducible** -- same input produces same output; provenance.json tracks everything
- **Verifiable** -- every claim links to computed evidence; the verifier agent checks this
- **Non-accusatory** -- red flags are screening indicators, not proof of wrongdoing
- **Transparent** -- all thresholds, data coverage, and methodology documented in the output

---

## Quick Setup (New Machine)

### Prerequisites
- **Node.js 20+** (LTS) -- required for native `fetch`
- **npm** (comes with Node.js)
- **Git**

### Environment Variables (`.env` file in project root)
```bash
# Required for AI features (hypothesis enhancement, investigation agent)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: enables SAM.gov entity verification in --deep mode
SAM_GOV_API_KEY=...

# Optional: enables sanctions/PEP screening in --deep mode
OPENSANCTIONS_API_KEY=...
```

Without `ANTHROPIC_API_KEY`, the tool falls back to template-based hypotheses -- still fully functional for signal detection and evidence generation.

### Install & Verify
```bash
git clone <repo-url>
cd bid-buster
npm install          # Install all dependencies
npm run typecheck    # Should be clean (zero errors)
npm test             # 128 tests, all should pass (~1 second)
```

### Run an Investigation
```bash
# Fast run (no AI, uses cached data if available)
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --charts --no-ai

# Full run with AI investigation
npm run investigate -- run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --deep --charts

# Output: cases/{agency}-{date}/ folder with README.md, case.md, dashboard.html, evidence/
```

### Key CLI Flags
| Flag | What It Does |
|------|-------------|
| `--agency="Name"` | Filter by top-tier agency (e.g., "Department of Defense") |
| `--subtier-agency="Name"` | Filter by sub-tier agency (e.g., "Federal Emergency Management Agency") |
| `--recipient="Name"` | Filter by award recipient (e.g., "MASSACHUSETTS INSTITUTE OF TECHNOLOGY") |
| `--period=YYYY-MM-DD:YYYY-MM-DD` | Time period filter |
| `--deep` | Enable Opus 4.6 investigative agent (SAM.gov, sanctions screening, reasoning trace) |
| `--charts` | Generate Vega-Lite SVG charts |
| `--no-ai` | Skip all Claude API calls (fast, template-only output) |
| `--with-transactions` | Fetch transaction data (enables R005 modification indicator) |
| `--full-evidence` | Write complete per-entity evidence CSVs (larger output) |
| `--no-cache` | Force fresh API calls (ignore cached data) |

---

## Session Startup

When starting a new session on this project:

1. Read this file (CLAUDE.md) for conventions and architecture
2. Read `docs/PROJECT_PLAN.md` for detailed implementation state, decisions, and roadmap
3. Run `npm test` -- 128 tests across 13 files, all should pass
4. Run `npm run typecheck` -- should be clean (zero errors)
5. The `.cache/` directory preserves API data from previous runs (instant re-runs with `--no-ai`)
6. Check `git log --oneline` to see latest work

---

## Project Metrics (current)

| Metric | Value |
|--------|-------|
| Source files | 47 TypeScript files |
| Source lines | ~9,865 lines |
| Test files | 13 test files |
| Test count | 128 tests (all passing) |
| Test time | ~1 second |
| Dependencies | 11 runtime + 5 dev |
| TypeScript | Strict mode, zero errors |
| License | MIT |
| Node.js | >= 20.0.0 |

---

## Where to Find Things

| What | Where |
|------|-------|
| **This file** (project constitution, conventions) | `CLAUDE.md` |
| Full implementation state, decisions, roadmap | `docs/PROJECT_PLAN.md` |
| Hackathon-ready project description | `docs/PROJECT_BRIEF.md` |
| FEMA demo case selection & validation | `docs/HACKATHON_DEMO_CASE.md` |
| USAspending API field mapping | `docs/api-analysis.md` |
| Red flags methodology research | `docs/Data-Driven Procurement Red Flags...md` |
| Data ingestion strategy | `docs/Ingesting USAspending Award Data.md` |
| Multi-agent design patterns | `docs/Multi-Agent Workflow Systems...md` |
| Hackathon rules & constraints | `docs/Hackathon rules.md` |
| API exploration samples | `exploration/` (7 JSON files + README) |
| All indicator thresholds | `config/default.yaml` |
| Core types + QueryContext | `src/shared/types.ts` |
| Indicator interface | `src/signaler/types.ts` |
| Normalized data schema | `src/normalizer/schema.ts` |
| API response types | `src/collector/types.ts` |
| Enrichment client types | `src/enrichment/types.ts` |
| Investigator agent types | `src/shared/types.ts` (`InvestigationFindings`, `ToolCallRecord`, etc.) |
| Chart spec builders | `src/prover/charts.ts` |
| Pipeline orchestrator | `src/orchestrator/pipeline.ts` |
| Data interpretation issues & fixes | `docs/PROJECT_PLAN.md` -> "Data Interpretation Issues Found & Fixed" |

---

## Architecture

### 8-Step Pipeline

```
investigate run [--agency=<name>] [--subtier-agency=<name>] [--recipient=<name>] \
                --period=<start:end> [--deep] [--charts] [--no-ai] [--full-evidence]

  Step 1:   COLLECT       USAspending API -> paginate -> cache -> normalize
                          -> Construct QueryContext from params (filter awareness)
  Step 2:   SIGNAL        6 indicators x fold/finalize -> signal table (QueryContext-aware)
  Step 2.5: CONSOLIDATE   Group signals -> dollar-weighted materiality -> top-N MaterialFindings
  Step 3:   INVESTIGATE   Opus 4.6 agent (8 tools incl. log_reasoning, create_finding) (--deep)
                          -> Agent findings merged into MaterialFindings
  Step 3.5: CONVERGENCE   Multi-signal convergence analysis (entities flagged by 2+ indicators)
  Step 4:   HYPOTHESIZE   Templates + agent findings merge -> enriched questions
  Step 5:   PROVE         CSV tables + SVG charts (adaptive binning) -> evidence/ directory
  Step 6:   ENHANCE       AI-refined per-hypothesis narrative (Claude Sonnet)
  Step 7:   REPORT        README.md + case.md + dashboard.html + investigation-narrative.md
  Step 8:   VERIFY        Cross-check claims + tautology detection -> pass/fail
```

### Source Layout

```
src/
├── cli/                          # CLI entry point + commands
│   ├── index.ts                  # Entry, dotenv, commander setup
│   ├── config.ts                 # Config schema + defaults merging (347 lines)
│   └── commands/
│       ├── investigate.ts        # `run` -- full 8-step pipeline
│       ├── fetch.ts              # `fetch` -- data collection only
│       └── signal.ts             # `signal` -- indicators on cached data
│
├── collector/                    # Collector Agent
│   ├── index.ts                  # Orchestrates collection + normalization
│   ├── usaspending.ts            # API client (pagination, throttle, retry, cache) (284 lines)
│   ├── cache.ts                  # File-based SHA-256-keyed response cache
│   └── types.ts                  # Full USAspending API type definitions (221 lines)
│
├── normalizer/                   # Data normalization
│   ├── schema.ts                 # NormalizedAward + Transaction (zod schemas)
│   ├── awards.ts                 # Search result + detail enrichment transforms
│   └── transactions.ts           # Transaction/modification normalization
│
├── signaler/                     # Signaler Agent
│   ├── engine.ts                 # Orchestrates all indicators, sorts by severity
│   ├── consolidator.ts           # Signal -> MaterialFinding consolidation (359 lines)
│   ├── types.ts                  # Indicator interface, SignalEngineResult
│   └── indicators/
│       ├── base.ts               # BaseIndicator abstract (fold/finalize pattern)
│       ├── single-bid.ts         # R001: competitive tenders with 1 bidder
│       ├── non-competitive.ts    # R002: awards bypassing open competition
│       ├── splitting.ts          # R003: clusters near regulatory thresholds
│       ├── concentration.ts      # R004: dominant supplier detection (248 lines)
│       ├── modifications.ts      # R005: excessive post-award changes
│       └── price-outliers.ts     # R006: IQR/z-score outlier detection
│
├── hypothesis/                   # Hypothesis Maker Agent
│   ├── generator.ts              # Template + Claude AI executive assessment
│   ├── templates.ts              # 6 indicator-specific non-accusatory templates
│   └── five-cs.ts                # GAO Yellow Book Five C's per-indicator templates (200 lines)
│
├── enrichment/                   # Multi-source enrichment clients
│   ├── index.ts                  # Re-exports all clients
│   ├── types.ts                  # EntityVerification, SanctionsScreenResult, SubAwardData
│   ├── sam-gov.ts                # SAM.gov Entity Management API v3 client (340 lines)
│   ├── open-sanctions.ts         # OpenSanctions Match API client (240 lines)
│   └── subawards.ts              # USAspending sub-awards client (213 lines)
│
├── investigator/                 # Opus 4.6 Investigative Agent
│   ├── agent.ts                  # Autonomous tool-calling investigation loop (786 lines)
│   └── tools.ts                  # 8 tool definitions (559 lines)
│
├── prover/                       # Prover Agent
│   ├── analyzer.ts               # CSV evidence tables per hypothesis (732 lines)
│   ├── charts.ts                 # Vega-Lite chart spec builders (547 lines)
│   └── renderer.ts               # Server-side SVG rendering via Vega
│
├── verifier/                     # Verifier Agent
│   └── checker.ts                # Claim-evidence cross-check + tautology detection (150 lines)
│
├── narrator/                     # Narrator Agent
│   ├── report.ts                 # case.md assembly (337 lines)
│   ├── briefing.ts               # README.md executive briefing generator (348 lines)
│   ├── narrative.ts              # investigation-narrative.md renderer
│   ├── enhancer.ts               # AI per-hypothesis narrative enrichment (Claude Sonnet)
│   └── dashboard.ts              # Interactive HTML dashboard (842 lines)
│
├── orchestrator/                 # Pipeline orchestration
│   └── pipeline.ts               # 8-step pipeline with QueryContext propagation (489 lines)
│
└── shared/                       # Shared utilities
    ├── types.ts                  # Signal, Hypothesis, Evidence, QueryContext, MaterialFinding, etc. (279 lines)
    ├── logger.ts                 # Pino structured logging
    ├── fs.ts                     # Case folder creation, JSON I/O, SHA-256
    ├── provenance.ts             # Git commit, timestamps, versioning
    └── urls.ts                   # USAspending URL builders
```

### Test Suite

```
tests/unit/
├── config.test.ts           #  3 tests - Config loading, defaults, threshold merging
├── indicators.test.ts       # 13 tests - R001-R004, R006 indicators + tautology suppression
├── engine.test.ts           #  3 tests - Engine initialization, indicator filtering
├── consolidator.test.ts     # 22 tests - Signal grouping, materiality, per-indicator caps, convergence
├── hypothesis.test.ts       #  4 tests - Template generation, non-accusatory language
├── five-cs.test.ts          #  6 tests - All 6 indicator templates, unknown indicator fallback
├── report.test.ts           # 10 tests - Disclaimer, signals, hypotheses, provenance, evidence links
├── briefing.test.ts         #  6 tests - README.md structure, findings display, next steps
├── prover.test.ts           #  9 tests - Entity-scoped evidence, CSV validity, --full-evidence gating
├── charts.test.ts           # 15 tests - Vega-Lite spec builders, SVG rendering, log-scale binning
├── enrichment.test.ts       # 16 tests - SAM.gov, OpenSanctions, sub-awards with mocked HTTP
├── investigator.test.ts     # 15 tests - 8 tool definitions, agent loop, max iteration cap
└── collector.test.ts        #  6 tests - buildSearchFilters, toptier/subtier agency, recipient
                             ─────
                             128 tests total, all passing
```

### Case Folder Output Structure

```
cases/{agency}-{date}/                   # Query-param naming, git-committable
├── README.md                            # 1-page executive briefing (TOP 5-10 FINDINGS)
├── case.md                              # Concise report (inverted pyramid, <50 KB)
├── dashboard.html                       # Lightweight interactive dashboard (<300 KB)
├── investigation-narrative.md           # Agent reasoning trace (--deep only)
├── provenance.json                      # Audit trail
├── data/                                # Machine-readable artifacts
│   ├── signals.json                     # Consolidated signals
│   ├── findings.json                    # Top-N material findings (Five C's structured)
│   ├── hypotheses.json                  # All generated hypotheses
│   ├── convergence.json                 # Multi-indicator convergence entities
│   ├── verification.json                # Claim verification results
│   ├── evidence-manifest.json           # Evidence file inventory
│   ├── investigation.json               # Agent tool calls + reasoning (--deep)
│   └── investigation-conversation.json  # Full Claude conversation (--deep)
├── evidence/
│   ├── summary/                         # Top findings only (entity-scoped CSVs)
│   ├── charts/                          # SVG visualizations (4 chart types)
│   └── detail/                          # Full per-entity CSVs (--full-evidence only)
└── evidence-manifest.json
```

---

## Claude AI Integration (3 Tiers)

### Tier 1: Investigative Agent (Opus 4.6) -- `--deep` flag
- Model: `claude-opus-4-6` with `max_tokens: 4096`
- Autonomous tool-calling loop (up to 10 iterations)
- **8 tools available:**
  1. `log_reasoning` -- externalize thinking (visible reasoning trace)
  2. `create_finding` -- register novel Five C's findings
  3. `verify_entity` -- SAM.gov entity verification
  4. `screen_sanctions` -- OpenSanctions PEP/sanctions check
  5. `fetch_comparable_awards` -- in-memory comparative analysis
  6. `get_award_detail` -- deep dive into specific awards
  7. `get_subawards` -- sub-award data for pass-through detection
  8. `summarize_investigation` -- produce final narrative
- Cost cap: $2.00 per investigation (configurable)
- FEMA demo: 8 iterations, 35 tool calls, $4.15

### Tier 2: Hypothesis Enhancement (Sonnet 4.5)
- Model: `claude-sonnet-4-5-20250929` with `max_tokens: 512`
- Per-hypothesis narrative enrichment (only material-finding-linked hypotheses)
- AI executive assessment for README.md
- Cost-efficient: ~$0.10 for 14 hypotheses

### Tier 3: Template Fallback (no AI)
- Works without any API key
- Template-based hypotheses with non-accusatory framing
- All signal detection and evidence generation is deterministic (no AI needed)

---

## Technical Conventions

### Language & Runtime
- **TypeScript in strict mode**, ESM (`"type": "module"` in package.json)
- **Node.js 20+** with native `fetch`
- All imports use `.js` extension (NodeNext module resolution)
- `tsconfig.json` target: ES2022, module: NodeNext

### Code Style
- No classes unless the abstraction genuinely helps (indicators use classes; most other code is functional)
- Types go in dedicated `types.ts` files per module, or in `src/shared/types.ts` for cross-cutting concerns
- Zod schemas for runtime validation of external data (API responses, config files); plain TypeScript interfaces for internal types
- Use `import type` for type-only imports
- Keep files focused -- one responsibility per file

### Naming
- Indicator IDs: `R001` through `R006` (and future `R007+`)
- Hypothesis IDs: `H-{indicatorId}-{entityId}` (e.g., `H-R002-MASSACHU`)
- Finding IDs: `F-001` through `F-N` (materiality-ranked)
- Config keys: `snake_case` in YAML, `camelCase` in TypeScript
- Files: `kebab-case.ts` for indicators, `camelCase.ts` for modules

### Dependencies
- Prefer lightweight packages. We chose `p-retry` + `p-throttle` over axios
- `simple-statistics` for quartile/IQR calculations
- `@anthropic-ai/sdk` for Claude API -- always with graceful fallback
- `cosmiconfig` for config discovery; `pino` for structured logging
- `vega` + `vega-lite` for SVG chart rendering (no `node-canvas` needed)
- **Do not add** heavy frameworks (express, fastify) unless explicitly needed

### Testing
- `vitest` (ESM-native, fast)
- Tests in `tests/unit/` mirroring `src/` structure
- Focus on: indicator logic correctness, config defaults, report structure, non-accusatory language
- Don't over-test -- cover the things that would be bad to silently break
- Run before every commit: `npm test && npm run typecheck`

### Git Conventions
- Descriptive commit messages explaining *what* and *why*
- Group related changes into logical commits (not one giant commit, not one per file)
- Always include `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`
- Commit at the end of each meaningful phase or feature

---

## Evidence Discipline

These rules apply to **all generated output** (case.md, hypotheses, AI-generated text):

### DO
- Frame findings as **questions**, not accusations ("Does this pattern warrant review?" not "This is corrupt")
- Include **context and innocent explanations** alongside risk interpretations
- Report **data quality** -- coverage percentages, missing fields, caveats
- Link every claim to its **computed evidence** (signal ID, threshold, value)
- Include the **disclaimer** in every case.md: "Red flags are not proof of wrongdoing"
- Cite **methodology sources** (OCP Red Flags Guide 2024, OECD Bid Rigging Guidelines 2025)
- Record **provenance** for every run (timestamp, git commit, tool version, parameters)

### DON'T
- Never use words like "corrupt", "fraud", "guilty", "criminal" in generated output
- Never present a red flag as conclusive evidence of wrongdoing
- Never omit the disclaimer or data quality notes
- Never generate claims that aren't backed by computed signal data
- Never hardcode entity names in templates -- always use variables from signal data

---

## Indicator Design Rules

Indicators follow the **fold/finalize** pattern (inspired by Cardinal-rs):

```typescript
interface Indicator {
  configure(settings): void;          // Apply thresholds from config
  setQueryContext?(ctx): void;        // Receive filter context (optional, for filter-aware behavior)
  fold(award): void;                  // Process one record at a time
  foldTransactions?(id, txns): void;  // Optional: process transaction data (R005)
  finalize(): Signal[];               // Produce signals after all records processed
  getMetadata(): IndicatorMetadata;   // Report thresholds used + data coverage
}
```

When adding a new indicator:
1. Create `src/signaler/indicators/{name}.ts` extending `BaseIndicator`
2. Add config key in `src/cli/config.ts` (defaults section + schema)
3. Add entry in `config/default.yaml`
4. Register in `src/signaler/engine.ts` (registry + config key mapping)
5. Add hypothesis template in `src/hypothesis/templates.ts`
6. Add Five C's template in `src/hypothesis/five-cs.ts`
7. Add at least one unit test in `tests/unit/indicators.test.ts`
8. Update `docs/PROJECT_PLAN.md` indicator table

Every indicator MUST:
- Be **configurable** (thresholds, enabled flag) via config
- Report **metadata** (thresholds used, data coverage percentage)
- Produce **signals with context** (human-readable explanation of what was found)
- Handle **missing data gracefully** (skip records with null required fields, report coverage)
- Be **filter-aware** when relevant -- use `this.queryContext` to suppress tautological signals or add caveats when operating on a filtered dataset

### Red-Flag Indicators (implemented)

| ID | Indicator | What It Detects | Key Fields |
|----|-----------|-----------------|------------|
| R001 | Single-Bid Competition | Open tenders with only 1 bidder | `numberOfOffersReceived`, `extentCompeted` |
| R002 | Non-Competitive Awards | Awards bypassing open competition | `extentCompeted` codes B,C,G,NDO |
| R003 | Contract Splitting | Award clusters near regulatory thresholds ($250K/$7.5M) | `awardAmount` by agency/recipient/period |
| R004 | Vendor Concentration | One supplier dominating agency spend (>30% share) | `awardAmount` per recipient/agency |
| R005 | Excessive Modifications | Contracts ballooning post-award (>5 mods or >2x growth) | Transaction count + cost growth |
| R006 | Price Outliers | Abnormally expensive awards vs NAICS/PSC peers | IQR/z-score outlier detection |

### QueryContext Pattern

`QueryContext` (`src/shared/types.ts`) is constructed once in the pipeline from CLI params and threaded to:
- **SignalEngine** -> each indicator via `setQueryContext()` (e.g., R004 suppresses tautological signals, R006 adds peer group caveats)
- **Consolidator** -> convergence analysis with filter awareness
- **Report assembler** -> generates "Data Scope & Interpretation" section with filter notes
- **Verifier** -> tautology detection safety net (flags R004 signals matching the recipient filter)

When adding new filter-aware behavior, use `this.queryContext?.isRecipientFiltered` / `this.queryContext?.isAgencyFiltered` rather than parsing params independently.

---

## API Integration Rules

### USAspending API
- Base URL: `https://api.usaspending.gov/api/v2/`
- No auth required. No documented rate limits (throttle to 2 req/sec defensively)
- **Always cache** responses (SHA-256 keyed, file-based). Cache survives sessions
- Handle HTTP 429 (rate limit) and 500 (transient) with exponential backoff
- Use cursor-based pagination (`last_record_unique_id`) for large result sets
- Award detail (`/awards/{id}/`) is the expensive call -- one per award, but provides competition data
- Subtier agency support: `--subtier-agency` uses `"tier": "subtier"` in API filter
- **CRITICAL: `time_period` filter is activity-based** -- selects awards with any modification during the period, not just awards starting in it. A 2013 contract modified in 2023 appears in 2023 results. `awardAmount` is always cumulative from contract inception, not period spending.

### Enrichment APIs (used by `--deep` investigative agent)
- **SAM.gov** (`src/enrichment/sam-gov.ts`): Entity verification, exclusion/debarment screening. Free API key from `SAM_GOV_API_KEY` env var. Rate limit: 1000 req/day.
- **OpenSanctions** (`src/enrichment/open-sanctions.ts`): Sanctions/PEP fuzzy screening. API key from `OPENSANCTIONS_API_KEY` env var. Optional -- skipped gracefully if missing.
- **Sub-Awards** (`src/enrichment/subawards.ts`): USAspending sub-award data. No auth required.

### Claude API
- **Investigative agent** (`--deep`): `claude-opus-4-6` with `max_tokens: 4096` and tool-calling
- **Hypothesis enhancement**: `claude-sonnet-4-5-20250929` with `max_tokens: 512` (cost-efficient)
- **Always** wrap in try/catch with graceful fallback to template-only output
- System prompts enforce non-accusatory tone
- API key loaded from `.env` via `dotenv`
- Use `--no-ai` flag to skip all AI calls (fast runs, template-only output)

---

## What NOT to Do

- Don't break the 8-step pipeline contract (Collect -> Signal -> Consolidate -> Investigate -> Hypothesize -> Prove -> Enhance -> Report -> Verify)
- Don't bypass the verifier -- if claims are unsupported, fix the narrator, don't disable verification
- Don't commit `.env`, `.cache/`, `cases/`, or `node_modules/`
- Don't commit `references/cardinal-rs/`, `references/kingfisher-collect/`, `references/ocdskit/` (gitignored, local-only)
- Don't add features without updating `docs/PROJECT_PLAN.md`
- Don't change indicator thresholds without documenting the reasoning
- Don't use accusatory language anywhere in the codebase

---

## Hackathon Constraints

- **Open source**: MIT license, all components
- **New work only**: git history proves clean start
- **Team size <= 2**
- **Problem Statement #2**: "Break the Barriers" -- expert knowledge in everyone's hands
- Resources: Claude Code, Claude API, MCP, Agent Skills (see `docs/Hackathon rules.md`)

---

## Validated Demo Cases

### Demo Case: FEMA COVID-19 Procurement (hackathon showcase)

**Command:** `investigate run --subtier-agency="Federal Emergency Management Agency" --period=2020-01-01:2020-12-31 --deep --charts`

**Results:**
- **7,259 FEMA awards** fetched (73 paginated API calls)
- **1,465 signals** across 4 indicators: R001, R002, R004, R006
- **16 material findings** via consolidation (92x reduction)
- **2 convergence entities** (Parkdale, Hanesbrands) -- multi-indicator flags
- **Opus 4.6 agent:** 8 iterations, 35 tool calls, $4.15
- **14 AI-enhanced hypotheses** + AI narrative
- **4 SVG charts**, 22 evidence CSVs
- **36/36 verification** passing (100%)
- **5.0 MB** total folder size (git-committable)

**Known vendors auto-detected:** Parkdale ($532M), Hanesbrands ($175M), 3M ($96M), GDIT ($97M)

### Secondary Case: DoD -> MIT, FY2023

**Command:** `investigate run --agency="Department of Defense" --recipient="MIT" --period=2023-01-01:2023-12-31 --charts`

- 10,000 awards, 20 material findings, 2,716/2,716 verification passing

---

## Current State (2026-02-12)

**All phases complete. Demo-ready.**

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| CLI (commander) | 5 | ~480 | Complete |
| Collector (API client) | 4 | ~750 | Complete |
| Normalizer | 3 | ~167 | Complete |
| Signaler (6 indicators + consolidator) | 10 | ~1,300 | Complete |
| Enrichment clients | 4 | ~600 | Complete |
| Investigator (Opus 4.6) | 2 | ~1,345 | Complete |
| Hypothesis Maker + Five C's | 3 | ~370 | Complete |
| Prover (evidence + charts) | 3 | ~1,300 | Complete |
| Narrator + Dashboard + Briefing | 6 | ~1,100 | Complete |
| Verifier | 1 | ~150 | Complete |
| Orchestrator | 1 | ~489 | Complete |
| Shared utilities | 5 | ~350 | Complete |
| **Total** | **47 files** | **~9,865 lines** | **All operational** |

**128 tests passing across 13 test files. Zero TypeScript errors in strict mode.**

### Remaining Known Issues

| Issue | Impact | Workaround |
|-------|--------|------------|
| SAM.gov API key needed for entity verification | `--deep` returns empty without key | Set `SAM_GOV_API_KEY` env var |
| OpenSanctions API key needed for sanctions screening | Screening skipped without key | Set `OPENSANCTIONS_API_KEY` env var |
| R005 requires `--with-transactions` | Transaction data not fetched by default | Use `--with-transactions` flag |
| R003 zero on FEMA data | Legitimate: emergency procurement doesn't cluster near thresholds | Expected behavior |

### Post-Hackathon Roadmap

- Period-specific obligation amounts via transaction sums
- Cross-agency R004 suppression when `--agency` yields single agency
- Market-wide R006 peer groups (fetch NAICS peers beyond filtered dataset)
- `search_usaspending` tool for agent (real API queries for baselines)
- Recipient deduplication via `recipient_id` hash + SAM.gov parent company
- OCDS data format support (international procurement datasets)
- Network analysis and entity relationship graphs
- Expand from 6 to OCP's full 73-indicator catalogue
