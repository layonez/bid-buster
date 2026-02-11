# Procurement Investigator - Project Plan

> **Last updated:** 2026-02-11 (evening session)
> **Current stage:** Phases G-J implemented (consolidation, Five C's, briefing, narrative, dashboard polish). 100 tests passing. Next: Phase K (entity-scoped evidence, dashboard <1 MB, finding diversity, bug fixes).

## Executive Summary

**`investigate`** is a TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, CSV evidence tables, and open questions. It uses a multi-agent architecture with Claude AI enhancement at multiple stages.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim is verified against computed evidence, every run produces a git-committable case folder with CSV evidence files.

**Phases G-J complete:** Signals now consolidate from 1,356 → 20 material findings with Five C's audit structure. README.md briefing provides a 1-page entry point. Dashboard halved from 19 MB → 10 MB. Agent reasoning tools (`log_reasoning`, `create_finding`) are operational. 100 tests passing.

**Current challenge: File size.** The analytical framework is solid but the output folder is still 543 MB because evidence CSVs remain global 10K-row dumps (518 MB) and the dashboard still inlines all data (10 MB). Phase K addresses this: entity-scoped evidence filtering, dashboard external data loading, and report truncation will bring the case folder under 10 MB.

**Secondary challenge: Finding diversity.** 19 of 20 findings are R006 price outliers because single mega-dollar awards dominate the materiality score. Phase K adds per-indicator caps to force diversity across indicator types.

---

## Current Implementation Status

### What's Built and Working

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| CLI (commander) | 5 | ~430 | Complete -- 3 commands: `run`, `fetch`, `signal`; `--with-transactions`, `--deep`, `--charts`, `--full-evidence` flags |
| Collector (API client) | 4 | ~679 | Complete -- pagination, throttling, caching, detail + transaction enrichment |
| Normalizer | 3 | ~167 | Complete -- search results, award details, transactions |
| Signaler (6 indicators + consolidator) | 10 | ~1,170 | Complete -- all 6 indicators + MaterialFinding consolidation with materiality scoring |
| Enrichment clients | 4 | ~600 | Complete -- SAM.gov, OpenSanctions, sub-awards clients |
| Investigator (Opus 4.6) | 2 | ~510 | Complete -- 8 tools (incl. `log_reasoning`, `create_finding`), reasoning steps, agent findings |
| Hypothesis Maker + Five C's | 3 | ~370 | Complete -- templates + Five C's per-indicator structure + AI executive assessment |
| Prover (evidence + charts) | 3 | ~1,130 | Complete -- CSV evidence + Vega-Lite SVG charts (entity-scoped filtering pending K1) |
| Narrator + Enhancer + Dashboard + Briefing + Narrative | 6 | ~900 | Complete -- case.md + dashboard.html + README.md briefing + investigation-narrative.md |
| Verifier | 1 | ~120 | Complete -- claim-evidence cross-check + tautology detection |
| Orchestrator | 1 | ~420 | Complete -- 8-step pipeline + consolidation + briefing + narrative + data dir |
| Shared utilities | 4 | ~290 | Complete -- logger, fs (query-param naming), provenance (file hashes), types (MaterialFinding, InvestigationStep, etc.) |
| **Total** | **46 files** | **~6,790 lines** | **All agents fully operational** |

**No stubs remaining.** All agents fully operational. Phase K will address evidence scoping and output size reduction.

### Test Suite

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `config.test.ts` | 3 | Config loading, defaults, threshold merging (incl. materiality config) |
| `indicators.test.ts` | 12 | R001-R004, R006 indicators + R004 tautology suppression + R006 peer group caveat |
| `engine.test.ts` | 3 | Engine initialization, indicator filtering, severity sorting |
| `hypothesis.test.ts` | 4 | Template generation, non-accusatory language, deduplication |
| `report.test.ts` | 10 | Disclaimer, signals, hypotheses, provenance, evidence links, Data Scope section, verifier tautology detection |
| `prover.test.ts` | 5 | Evidence artifact generation, CSV validity, escaping, master summary, executive skip |
| `charts.test.ts` | 12 | Vega-Lite spec builders (6 chart types), SVG rendering, adaptive log-scale binning |
| `enrichment.test.ts` | 16 | SAM.gov, OpenSanctions, sub-awards clients with mocked HTTP |
| `investigator.test.ts` | 15 | 8 tool definitions, agent loop, max iteration cap, findings structure |
| `consolidator.test.ts` | 8 | Signal grouping, materiality scoring, maxFindings cap, severity escalation, source tags |
| `five-cs.test.ts` | 6 | All 6 indicator templates, non-accusatory language, unknown indicator fallback |
| `briefing.test.ts` | 6 | README.md structure, findings display, next steps, disclaimer, AI tags |
| **Total** | **100** | **All passing** |

### Validated on Real Data

**Demo slice:** Department of Defense → MIT, FY2023 (full DoD dataset: 10,000 awards)
- 10,000 awards fetched via paginated search, 9,994+ details enriched from cache
- **1,356 signals detected** across 6 indicators on the full DoD dataset
- **→ 20 material findings** via consolidation (68x reduction from raw signals)
- **613 hypotheses generated**, 874 CSV evidence artifacts, 4 SVG charts
- **2,716/2,716 claims verified** (verification passed, 0 unsupported -- no regression after G-J)
- R004 tautological signal for MIT correctly suppressed (was 100% before QueryContext fix)
- Award distribution chart auto-switches to log scale (data spans $7.9K to $1.59B)
- "Data Scope & Interpretation" section explains cumulative values and filter implications
- README.md briefing shows top 5 findings with Five C's structure and dollar exposure
- Dashboard halved from 19 MB → 10 MB (awards array stripped from inline data)
- Case folder named `dod-mit-2026-02-11` (query-param naming)

**Data audit findings (DoD-MIT slice):**
- 66.7% of the 54 MIT awards have `startDate` outside the 2023 query range (2013-2022 contracts with 2023 activity)
- Award amounts are cumulative contract values from inception, not period spending
- Amount range spans 201,785x ($7.9K to $1.59B) -- requires log-scale binning
- All 54 awards are MIT (expected: `--recipient` filter), so R004 concentration was structurally 100%
- See "Data Interpretation Issues Found & Fixed" below for full analysis

**Output quality audit findings (critical -- drives next phases):**
- case.md is **820KB / 10,907 lines** -- unreadable by any human
- dashboard.html is **19MB** -- chokes most browsers
- **883 evidence files / 550MB** -- not git-committable as promised
- **1,356 signals** listed flat without materiality hierarchy -- a $7.9K sole-source gets same "HIGH" as $1.59B
- **613 hypotheses** with identical template language (352 R006 + 260 R002) -- no prioritization or narrative arc
- Evidence CSVs are **generic, not entity-specific**: every R002 hypothesis links to the same 10K-row global CSV
- **Zero visible AI contribution** in the default run (no `--deep`, no investigation section)
- No "so what?" context: missing industry benchmarks, justification codes, dollar-weighted severity, next steps
- See "Output Quality Audit" section below for full analysis and fix plan

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

### Current: 8-Step Pipeline + Consolidation (implemented)

```
investigate run [--agency=<name>] [--recipient=<name>] --period=<start:end> [--deep] [--charts] [--no-ai] [--full-evidence]

  Step 1:   COLLECT       USAspending API → paginate → cache → normalize
                          → Construct QueryContext from params (recipient/agency/period filters)
  Step 2:   SIGNAL        6 indicators × fold/finalize → signal table (QueryContext-aware)
  Step 2.5: CONSOLIDATE   Group signals → dollar-weighted materiality → top-N MaterialFindings (Five C's)
  Step 3:   INVESTIGATE   Opus 4.6 agent (8 tools incl. log_reasoning, create_finding) (--deep)
                          → Agent findings merged into MaterialFindings
  Step 4:   HYPOTHESIZE   templates + agent findings merge → enriched questions
  Step 5:   PROVE         CSV tables + SVG charts (adaptive binning) → evidence/ directory
  Step 6:   ENHANCE       AI-refined per-hypothesis narrative (Claude Sonnet)
  Step 7:   REPORT        README.md + case.md + dashboard.html + investigation-narrative.md
  Step 8:   VERIFY        cross-check claims + tautology detection → pass/fail
```

The architectural shift achieved (Phases G-J):

```
Before:   Collect → Rules → 1,356 flat signals → 613 template hypotheses → 820KB report (550MB folder)

After:    Collect → Rules → CONSOLIDATE → 20 Material Findings (Five C's) → README.md + case.md + dashboard
                     |           |
                     |    +------------------+
                     |    | Group by entity   |
                     |    | Dollar-weighted   |
                     |    | Top-N ranked      |
                     |    | Five C's per GAO  |
                     |    +------------------+
                     |
              (--deep mode)
                     |
              +-----------------------------------+
              |  1. log_reasoning: records thinking | <-- visible reasoning trace
              |  2. SAM.gov / OpenSanctions         |
              |  3. fetch_comparable_awards          |
              |  4. create_finding: Five C's         | <-- agent creates findings
              |  5. Writes investigation narrative   |
              +-----------------------------------+

Remaining (Phase K): Entity-scoped evidence CSVs + dashboard <1MB → folder <10MB
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
│   ├── consolidator.ts           # Signal → MaterialFinding consolidation (Phase G1)
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
│   ├── templates.ts              # 6 indicator-specific non-accusatory templates
│   └── five-cs.ts                # GAO Yellow Book Five C's per-indicator templates (Phase G4)
│
├── enrichment/                   # Multi-source enrichment clients
│   ├── index.ts                  # Re-exports all clients
│   ├── types.ts                  # EntityVerification, SanctionsScreenResult, SubAwardData
│   ├── sam-gov.ts                # SAM.gov Entity Management API v3 client
│   ├── open-sanctions.ts         # OpenSanctions Match API client
│   └── subawards.ts              # USAspending sub-awards client
│
├── investigator/                 # Opus 4.6 Investigative Agent
│   ├── agent.ts                  # Autonomous tool-calling investigation loop
│   └── tools.ts                  # Tool definitions (verify_entity, screen_sanctions, etc.)
│
├── prover/                       # Prover Agent
│   ├── analyzer.ts               # CSV evidence tables per hypothesis (all 6 indicators)
│   ├── charts.ts                 # Vega-Lite chart spec builders (6 chart types)
│   └── renderer.ts               # Server-side SVG rendering via Vega
│
├── verifier/                     # Verifier Agent
│   └── checker.ts                # Claim-evidence cross-check + tautology detection
│
├── narrator/                     # Narrator Agent
│   ├── report.ts                 # case.md assembly (material findings, Data Scope, signals, hypotheses)
│   ├── briefing.ts               # README.md executive briefing generator (Phase G3)
│   ├── narrative.ts              # investigation-narrative.md renderer (Phase H3)
│   ├── enhancer.ts               # AI per-hypothesis narrative enrichment (Claude Sonnet)
│   └── dashboard.ts              # Interactive HTML dashboard (signal pagination, lightweight data)
│
├── orchestrator/                 # Pipeline orchestration
│   └── pipeline.ts               # 8-step pipeline with QueryContext propagation
│
└── shared/                       # Shared utilities
    ├── types.ts                  # Signal, Hypothesis, Evidence, QueryContext, InvestigationFindings, etc.
    ├── logger.ts                 # Pino structured logging
    ├── fs.ts                     # Case folder creation, JSON I/O, SHA-256
    └── provenance.ts             # Git commit, timestamps, versioning
```

### Case Folder Output

**Current (post-G-J):** `cases/dod-mit-2026-02-11/` -- 543 MB, query-param naming, README.md entry point, material findings. Evidence still 518 MB (entity-scoped filtering pending Phase K1).

**Target (Phase K):** Compact, browsable, git-committable (<10 MB default).

```
cases/dod-mit-2023_20260211T1629/       # Agency-recipient-period_timestamp
├── README.md                            # 1-page executive briefing (TOP 5-10 FINDINGS)
├── case.md                              # Concise report (inverted pyramid, <5 pages)
├── dashboard.html                       # Lightweight interactive dashboard (<1MB)
├── investigation-narrative.md           # Agent reasoning trace (--deep only)
├── data/                                # Machine-readable artifacts
│   ├── signals.json                     # Consolidated signals (materiality-filtered)
│   ├── findings.json                    # Top-N material findings (Five C's structured)
│   ├── hypotheses.json
│   ├── awards.json
│   ├── investigation.json               # Agent tool calls + reasoning log (--deep)
│   ├── investigation-conversation.json  # Full Claude conversation (--deep)
│   ├── verification.json
│   └── provenance.json
├── evidence/
│   ├── summary/                         # Top findings only (5-10 CSVs)
│   │   ├── mit-competition-breakdown.csv
│   │   ├── mit-price-outliers.csv
│   │   └── mit-vendor-context.csv
│   ├── charts/                          # SVG visualizations
│   │   ├── chart-award-distribution.svg
│   │   ├── chart-competition-breakdown.svg
│   │   └── chart-vendor-concentration.svg
│   └── detail/                          # Full per-entity CSVs (--full-evidence flag)
│       ├── R002/
│       ├── R003/
│       └── R006/
└── evidence-manifest.json
```

**What's done (G-J):** Folder named by query params. README.md as primary output. `data/` subdirectory for JSON. `evidence/summary/`, `evidence/detail/`, `evidence/charts/` subdirectories created. Agent reasoning as dedicated artifact (`investigation-narrative.md`).

**What's pending (Phase K):** Entity-scoped evidence CSVs (K1). Dashboard external data loading (K2). `--full-evidence` gating of large files (K6). Target: <10MB default.

---

## Next Implementation: Phases G-J (Output Quality Revolution)

### The Problem We're Solving

An output quality audit (domain expert + agentic architect + end-user advocate) revealed:

> The tool currently does "red flag detection" (Cardinal-rs level) but aspires to "investigation-as-code" (analyst level). The gap is the analytical reasoning layer that converts statistical signals into prioritized, contextualized, actionable findings with clear next steps.

**Specific problems identified:**

| Problem | Current | Target |
|---------|---------|--------|
| Signal overload | 1,356 flat signals, no hierarchy | Top 10-20 material findings, dollar-weighted |
| No materiality | $7.9K sole-source = same "HIGH" as $1.59B | Minimum thresholds: $100K total, 3+ awards |
| Template repetition | 613 hypotheses, 352 identical R006 templates | Entity-level aggregation, ~20 unique findings |
| Evidence not scoped | Every R002 CSV has same 10K rows | Entity-specific evidence per finding |
| Agent invisible | Zero visible AI reasoning in default output | Investigation narrative as first-class artifact |
| No "so what?" | Statistical anomaly with no context | Five C's: Condition, Criteria, Cause, Effect, Recommendation |
| Report unreadable | 820KB / 10,907 lines | 1-page briefing + concise report + detail appendix |
| Not git-committable | 550MB / 883 files | <10MB default, `--full-evidence` for complete data |
| No traceability | Can't trace finding → API call | Provenance chain: finding → evidence → cache key → API URL |

### Phase G: Output Quality Revolution (HIGHEST PRIORITY)

This phase transforms the output from a data dump to an analyst-grade briefing. **This is the highest-impact work for the hackathon demo.**

#### G1: Signal Consolidation & Materiality Filtering

**Problem:** 1,356 signals where most are trivial (1-award vendors, sub-$10K amounts).

**Changes:**
- Add materiality config: `min_award_count: 3`, `min_total_amount: 100000` to `config/default.yaml`
- New `src/signaler/consolidator.ts`: groups signals by entity, computes aggregate risk scores (dollar-weighted severity), ranks by materiality
- Output: `MaterialFinding[]` -- top-N findings replacing flat signal list
- Pipeline step 2.5: consolidate after signal computation, before investigation

**New type:**
```typescript
interface MaterialFinding {
  id: string;                    // "F-001"
  rank: number;                  // 1-N by materiality score
  entityName: string;
  entityType: EntityType;
  signals: Signal[];             // All signals for this entity
  totalDollarValue: number;      // Sum of affected award amounts
  materialityScore: number;      // dollar × severity × signal_count
  primaryIndicator: string;      // Highest-severity indicator for this entity
  awardCount: number;
}
```

**Test:** Verify that DoD-MIT produces ~10-20 material findings, not 1,356 signals.

#### G2: Entity-Scoped Evidence (Fix CSV Duplication)

**Problem:** Every R002 hypothesis links to the same 10K-row global CSV. Evidence is generic, not targeted.

**Changes:**
- Update `src/prover/analyzer.ts`: filter evidence CSVs to only the relevant entity's awards
- R002 CSV: show only that entity's awards with competition codes and justification fields
- R006 CSV: show the flagged award vs. its NAICS peers (10-20 rows, not thousands)
- R004 CSV: show top-10 vendors in the agency portfolio for comparison

**Test:** Verify evidence CSV row count matches entity's award count, not global dataset.

#### G3: Executive Briefing (README.md)

**Problem:** case.md opens with a disclaimer then a 1,356-row table. First page should tell the story.

**Changes:**
- New `src/narrator/briefing.ts`: generates `README.md` as the primary human output
- Structure:
  1. Title + scope (1 line: "MIT — DoD Procurement Screening, 2023")
  2. Key stats (awards count, total value, period)
  3. **Top 5 findings** -- each with: what was found, why it matters, link to evidence
  4. What this means (2-3 sentences of AI-generated context)
  5. Next steps (concrete follow-up actions)
- Max length: ~100 lines (1 printed page)

**Test:** Verify README.md is generated, contains top findings, and is <200 lines.

#### G4: Five C's Finding Structure

**Problem:** Hypotheses are template-generated questions without cause, effect, or recommendations.

**Changes:**
- New `src/hypothesis/five-cs.ts`: generates GAO-standard finding structure for each material finding
- **Condition:** Specific quantified metric from signal data
- **Criteria:** Standard being compared against, with citation (FAR, OCP, OECD)
- **Cause:** Available justification data OR "not available in dataset"
- **Effect:** Dollar amount at risk, % of agency spend
- **Recommendation:** Per-indicator follow-up template (e.g., "Review sole-source justifications")
- Surface `other_than_full_and_open` / `reason_not_competed` from award detail data for R002 Cause

**Test:** Verify each material finding has all 5 components populated.

#### G5: Case Folder Redesign

**Problem:** `case-YYYY-MM-DD` collides on reruns, 550MB not git-committable.

**Changes:**
- Update `src/shared/fs.ts`: folder name = `{agency_slug}-{recipient_slug}-{period}_{timestamp}`
- Default output: summary evidence only (<10MB). Full per-entity CSVs only with `--full-evidence`
- Reorganize: `data/` for JSON artifacts, `evidence/summary/` + `evidence/charts/` + `evidence/detail/`
- Add `--full-evidence` CLI flag

**Test:** Verify folder name includes query params, default size <10MB.

### Phase H: Visible Agent Reasoning (THE DEMO DIFFERENTIATOR)

This phase makes the AI agent's investigation process transparent and verifiable. **This is what makes the hackathon demo compelling -- showing the AI's investigation narrative, not just its conclusions.**

#### H1: `log_reasoning` Tool

**Problem:** The agent's reasoning is trapped inside the Claude API call. `toolCallLog` captures what tools were called, but not WHY or what conclusions were drawn.

**Changes:**
- Add `log_reasoning` tool to `src/investigator/tools.ts`:
  ```typescript
  {
    name: "log_reasoning",
    description: "Record your investigative reasoning. Call BEFORE and AFTER each tool use.",
    input_schema: {
      properties: {
        observation: { type: "string" },    // What caught your attention
        hypothesis: { type: "string" },     // Your current theory
        action_plan: { type: "string" },    // What you plan to check next
        finding: { type: "string" },        // What previous tool revealed (omit on first)
        confidence: { type: "number" },     // 0-1: how significant is this lead
      }
    }
  }
  ```
- Tool implementation: just pushes to `InvestigationStep[]` array (zero cost)
- Update system prompt to require reasoning logging at each step

**New types:**
```typescript
interface InvestigationStep {
  stepNumber: number;
  timestamp: string;
  observation: string;
  hypothesis: string;
  action: string;
  toolCallIds: string[];
  finding: string;
  conclusion: string;
  confidenceDelta: number;
  evidenceStrength: "strong" | "moderate" | "weak" | "absent";
}

interface InvestigationNarrative {
  steps: InvestigationStep[];
  deadEnds: Array<{ hypothesis: string; investigation: string; conclusion: string }>;
  discoveries: Array<{ description: string; novelty: "expected" | "unexpected" | "contradictory" }>;
}
```

**Test:** Verify agent produces `InvestigationStep[]` entries between tool calls.

#### H2: `search_usaspending` Tool (Comparative Data)

**Problem:** `fetch_comparable_awards` only searches the in-memory dataset. When investigating DoD→MIT, it compares MIT awards to other MIT awards -- circular.

**Changes:**
- New tool in `src/investigator/tools.ts`: `search_usaspending` -- makes new API queries via existing `USAspendingClient`
- Agent can: pull all DoD R&D awards (not just MIT's) for baseline rates, pull MIT's awards from other agencies, pull same-NAICS awards government-wide
- Limit: 100 results per query, max 3 queries per investigation (cost control)
- Returns: summary stats (count, total $, non-competitive rate, avg amount) + top-5 individual awards

**Test:** Verify tool can fetch awards outside the initial query scope.

#### H3: Investigation Narrative Rendering

**Problem:** Agent findings appear as a flat summary paragraph in case.md. The reasoning chain is invisible.

**Changes:**
- New `src/narrator/narrative.ts`: renders `InvestigationNarrative` as `investigation-narrative.md`
- Structure: chronological investigation story with for each step: "I noticed X → checked Y → found Z → concluded W"
- Include dead ends: "I checked SAM.gov for FFRDC status but found no match"
- Include discoveries: "Cross-referencing reveals MIT and JHU have similar non-competitive rates"
- Embed in case.md as "Investigation Notes" section (prominent, not appendix)

**Test:** Verify narrative.md is generated with step-by-step reasoning.

#### H4: New Hypothesis Generation by Agent

**Problem:** Agent can only enrich pre-computed hypotheses. Can't surface discoveries the rule engine missed.

**Changes:**
- Add `create_finding` tool to `src/investigator/tools.ts`: agent registers novel discoveries
- Creates new `MaterialFinding` entries with source = "investigator_agent"
- Merged into findings list with visual tag: "AI-discovered finding"

**Test:** Verify agent can create findings not in original signal set.

### Phase I: Traceability & Reproducibility

#### I1: Full Conversation Log

- Write `investigation-conversation.json` with all Claude messages, tool calls, responses
- Set `temperature: 0` for investigative agent (deterministic with cached data)
- Record cache keys hit during investigation for reproducibility

#### I2: ToolCallRecord Enhancement

- Add `id: string` for cross-referencing from findings
- Add `cacheKey?: string` for cache file lookup
- Add `agentReasoning?: { priorObservation, expectedOutcome, actualConclusion }`

#### I3: USAspending Direct Links

- Every award ID in reports hyperlinks to `https://www.usaspending.gov/award/{internal_id}`
- Award IDs in evidence CSVs include the link column

#### I4: Provenance Chain Completion

- Fill `fileHashes` in provenance.json (currently empty `{}`)
- Add cache staleness indicator: "Data cached on YYYY-MM-DD" in report header
- Record individual API calls in provenance (endpoint + params + response hash)

### Phase J: Dashboard & Report Polish

#### J1: Lightweight Dashboard

- Paginate signal table (top 50, load more on click) instead of rendering all 1,356
- Lazy-load hypothesis cards
- Target: <1MB HTML file (currently 19MB)
- Embed only summary data inline; full data via linked JSON files

#### J2: Concise case.md (Inverted Pyramid)

- Page 1: executive summary + top findings (material findings only)
- Page 2-3: detailed findings with Five C's structure
- Appendix: full signal table (collapsed/linked, not inline)
- Target: <50KB (currently 820KB)

#### J3: "Next Steps" Section

- Per-finding concrete follow-up actions:
  - R002: "Review sole-source justifications in FPDS for awards X, Y, Z"
  - R004: "Assess market structure for NAICS 541712"
  - R006: "Compare pricing to Independent Government Cost Estimate"
- Include command to re-run with different scope: `investigate run --agency=DoD --recipient=JHU`

#### J4: AI vs Template Visual Tags

- In case.md and dashboard: mark each finding source
  - `[RULE]` -- detected by indicator engine
  - `[AI-ENHANCED]` -- enriched by Sonnet narrative
  - `[AI-DISCOVERED]` -- found by investigative agent (not in original signals)

### Implementation Order (Phases G-J)

| Step | Phase | Est. Effort | Depends On | Impact |
|------|-------|-------------|------------|--------|
| 1 | G1: Signal consolidation | 2-3h | Nothing | **Critical** -- transforms the demo |
| 2 | G2: Entity-scoped evidence | 2h | G1 | **Critical** -- fixes broken evidence |
| 3 | G3: Executive briefing | 2h | G1 | **Critical** -- the 1-page output |
| 4 | G4: Five C's structure | 2-3h | G1 | High -- professional audit format |
| 5 | G5: Case folder redesign | 1-2h | G1-G3 | High -- git-committable output |
| 6 | H1: `log_reasoning` tool | 1-2h | Nothing | **Critical** -- visible AI reasoning |
| 7 | H2: `search_usaspending` tool | 2-3h | Nothing | High -- agent can discover new data |
| 8 | H3: Investigation narrative | 2h | H1 | High -- reasoning as artifact |
| 9 | H4: New hypothesis generation | 1-2h | H1, G1 | Medium -- agent creates findings |
| 10 | I1-I4: Traceability | 2-3h | G1 | Medium -- reproducibility |
| 11 | J1-J4: Dashboard & polish | 3-4h | G1-G4 | Medium -- UX refinement |

**Steps 1-3 and 6-7 can run in parallel.** G1 + H1 are the two critical-path items.

### The Demo Narrative (target)

```
1. Run: investigate run --agency=DoD --recipient=MIT --period=2023 --deep --charts
2. Open README.md → 5 key findings, plain English, dollar-weighted
   "Finding 1: 72% non-competitive rate ($11.4B) — expected for FFRDC, but 3 awards lack justification"
3. Click finding → entity-specific evidence CSV (MIT's 54 awards, not 10,000)
4. Investigation Notes section shows AI reasoning:
   "Step 1: I noticed R002 flagged 72% non-competitive → checked SAM.gov → MIT is FFRDC →
    Step 2: Compared to JHU (similar FFRDC): 68% non-competitive → Pattern is structural →
    Step 3: But awards FA8702-23-F0001, N6600123C4506, N6600123C4513 have no justification code →
    Conclusion: These 3 awards ($48M total) warrant manual review of sole-source justification"
5. Open dashboard.html → lightweight, <1MB, paginated, interactive
6. verification.json → every finding backed by evidence chain → API source
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

## Visual Evidence Strategy (Implemented)

**Server-side rendering:** `vega` + `vega-lite` packages, SVG mode (no `node-canvas` needed). Adaptive log-scale binning for skewed data (>100x range).

**6 chart types:** Award Distribution Histogram (always), Vendor Concentration Donut (R004), Competition Breakdown Bar (R001/R002), Price Outlier Scatter (R006), Modification Timeline (R005), Threshold Clustering (R003).

**Dashboard:** `dashboard.html` -- self-contained HTML with Vega-Embed from CDN, inline JSON data, sortable tables. **Note:** Currently 19MB due to embedding all 10K awards. Phase J1 will fix this with pagination and lazy-loading.

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

All dependencies installed and operational.

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

## Data Interpretation Issues Found & Fixed

Case output validation on the DoD-MIT slice revealed five systemic issues caused by downstream pipeline stages operating blind to the collector's query filters. All were fixed via **QueryContext propagation** -- a lightweight `QueryContext` type constructed once in the pipeline and threaded to every component that needs filter awareness.

### Issues Discovered

| # | Issue | Root Cause | Impact |
|---|-------|-----------|--------|
| 1 | **R004 tautological signal** | `--recipient=MIT` means 100% of filtered awards go to MIT by definition | R004 flagged MIT at 100% concentration -- structurally inevitable, not suspicious |
| 2 | **Cumulative values misrepresented as period spending** | USAspending `awardAmount` is cumulative from contract inception | A $1.59B award from 2016 appeared as if it was 2023 spending |
| 3 | **Awards outside query period** | `time_period` filter selects awards with *activity* during the period, not awards starting in it | 66.7% of MIT awards had `startDate` before 2023 (2013-2022 contracts with 2023 modifications) |
| 4 | **Fixed chart bins on skewed data** | Linear histogram bins with 201,785x data range ($7.9K to $1.59B) | All awards in a single bin; chart useless |
| 5 | **R006 peer group limited to filtered cohort** | IQR computed on recipient-filtered dataset only | Small peer groups (n<20) don't represent the full NAICS market |

### Fixes Applied (QueryContext Propagation)

| Fix | File(s) | What Changed |
|-----|---------|-------------|
| `QueryContext` type | `src/shared/types.ts` | New interface: `recipientFilter`, `agencyFilter`, `periodStart/End`, `isRecipientFiltered`, `isAgencyFiltered` |
| Indicator interface | `src/signaler/types.ts`, `indicators/base.ts` | Optional `setQueryContext()` method on `Indicator`, default impl in `BaseIndicator` |
| Engine threading | `src/signaler/engine.ts` | `initialize(config, filter?, queryContext?)` forwards context to each indicator |
| R004 suppression | `src/signaler/indicators/concentration.ts` | `finalize()` skips signals where entity matches the active recipient filter |
| R006 peer caveat | `src/signaler/indicators/price-outliers.ts` | Appends "peer group limited to filtered dataset" when recipient-filtered and n<20 |
| Adaptive binning | `src/prover/charts.ts` | `buildAwardDistributionSpec()` switches to log₁₀ scale when data range >100x |
| Data Scope section | `src/narrator/report.ts` | New "Data Scope & Interpretation" section between Data Overview and Signals |
| Tautology detection | `src/verifier/checker.ts` | Safety-net check: flags R004 signals matching recipient filter as "unsupported" |
| Pipeline wiring | `src/orchestrator/pipeline.ts` | Constructs `QueryContext` from params, passes to engine, report, and verifier |

### Remaining Data Interpretation Concerns (future work)

These issues are now **documented in the report output** but not yet structurally resolved:

1. **Cumulative vs. period obligation amounts** -- The report now explains that amounts are cumulative, but a future enhancement could use transaction data to compute period-specific obligations instead.
2. **Awards with start dates outside the query range** -- Documented in the Data Scope section. Could add a "period_obligation" field by summing transactions within the date range.
3. **Cross-agency R004 when `--agency` is used** -- Concentration is computed per agency already, but with `--agency` filter, there's only one agency in the dataset. Not yet suppressed (less obvious tautology than recipient filtering).
4. **R006 IQR on filtered data** -- The caveat is now shown, but a future enhancement could fetch market-wide peer data for the same NAICS codes to compute a true market IQR.

---

## Output Quality Audit (2026-02-11)

Three-perspective deep-dive (domain expert, agentic architect, end-user advocate) analyzing the DoD-MIT case output. Full findings drive Phases G-J above.

### Domain Expert: Audit Methodology Gaps

**Key finding:** The report lacks the GAO Yellow Book's **Five C's framework** (Condition, Criteria, Cause, Effect, Recommendation). Current output provides Condition (partially) but completely lacks Cause, Effect, and Recommendation.

**Signal-to-finding escalation missing:** Professional auditors distinguish observation → flag → finding → material finding. All 1,356 signals are treated equally regardless of dollar significance.

**Context that turns anomalies into leads (currently absent):**
- Justification codes: WHY was this sole-sourced? (`other_than_full_and_open` available in data but not surfaced)
- Entity type: Is sole-source expected? (FFRDC, Foreign Military Sales, UARC)
- Contract type: IDIQ delivery orders vs. new standalone contracts
- Comparative baselines: How does this compare to agency/NAICS averages?

### Agentic Architecture Expert: Agent Reasoning Gaps

**Key finding:** The agent is a **well-structured API caller** but lacks **reasoning visibility**. The investigation process is opaque -- users see conclusions but not the path to them.

**Four architectural gaps:**
1. **No theory formation:** Agent receives pre-computed hypotheses, can't form its own
2. **No iterative refinement:** No structural checkpoint where agent re-evaluates its plan
3. **No discovery-driven branching:** `fetch_comparable_awards` only searches in-memory data (circular when investigating a single recipient)
4. **No negative evidence tracking:** Dead ends are not recorded

**Highest-ROI change:** `log_reasoning` tool (zero implementation cost, transforms output). The agent calls it before/after each tool use to externalize its thinking. This produces a transparent audit trail of the investigation process.

### End-User Advocate: Output UX Problems

**Key finding:** The output is built for completeness, not comprehension. A journalist, auditor, or citizen would close the folder within 30 seconds.

**Critical metrics:**
- case.md: 820KB / 10,907 lines (unreadable)
- dashboard.html: 19MB (chokes browsers)
- Evidence: 883 files / 550MB (unnavigable, not git-committable)
- Evidence CSVs are duplicated: every R002 hypothesis links to same 10K-row CSV

**The inverted pyramid principle:** Most important information first, progressive disclosure for detail. Currently the opposite -- firehose of undifferentiated data that buries the 3 genuinely interesting findings under 610 identical ones.

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

10. **QueryContext propagation over per-component filter logic** -- Rather than have each component independently parse CLI params to determine filter state, we construct a `QueryContext` once in the pipeline and thread it as an optional parameter. This is additive (existing tests pass unchanged) and gives every component a single source of truth about what filters are active.

### Data Decisions

1. **DoD → MIT as demo slice** -- ~54 awards in 2023, manageable volume, all from Air Force (Lincoln Lab), low reputational risk for demo purposes.

2. **`number_of_offers_received` is often null** -- Discovered during Phase 0 API exploration. This limits R001 coverage to ~39%. The signal engine reports coverage gaps transparently in metadata.

3. **Recipient deduplication not yet implemented** -- Same company can appear under multiple UEI registrations (e.g., Lockheed Martin). The `recipient_id` hash can be used for deduplication in a future pass.

4. **Detail enrichment is the expensive step** -- Fetching `/awards/{id}/` for each award requires one API call per award (throttled to 2/sec). For 10,000 awards, first run takes ~90 min (mostly cached after that).

5. **USAspending `time_period` filter is activity-based, not inception-based** -- Discovered during data audit: the `time_period` filter in `/search/spending_by_award/` selects awards with *any activity* (including modifications) during the period. This means a contract from 2013 with a 2023 modification appears in 2023 results. The `awardAmount` is cumulative from inception. This is now documented in every case report's "Data Scope & Interpretation" section.

6. **Tautological signals must be suppressed, not just documented** -- When `--recipient=MIT` is used, R004 concentration for MIT is 100% by construction. Rather than just adding a note, the signaler now actively suppresses these signals via QueryContext. The verifier provides a safety-net check in case suppression is bypassed.

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
- **`time_period` filter is activity-based** -- selects awards with any modification during the period, not just awards starting in it. A 2013 contract modified in 2023 appears in 2023 results. `awardAmount` is cumulative from inception, not period spending.
- **`number_of_offers_received` often null** -- even for competed contracts
- **Recipient names inconsistent** -- same entity under multiple registrations
- **No total result counts** -- must paginate to exhaustion
- **DOD data has 90-day publication delay**
- **Minimum date: 2007-10-01** for search endpoints
- **`--recipient` search returns all agency awards** -- the search API returns awards matching the recipient keyword across the agency, but detail enrichment fetches all 10K even though only 54 are MIT (the rest are other DoD vendors matched by the broad agency filter)

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

### Completed (Phases 0-F + QueryContext + G-J)

| Phase | Enhancement | Status |
|-------|-------------|--------|
| 0 | Project plan, API exploration, hackathon brief | Done |
| 1-5 | Core pipeline: collector, signaler, hypothesizer, prover, narrator, verifier | Done |
| -- | Prover agent, transaction integration, AI narrator, broader demo support | Done |
| A | Multi-source enrichment clients (SAM.gov, OpenSanctions, sub-awards) | Done |
| B | Opus 4.6 investigative agent (tool-calling loop, `--deep`) | Done |
| C | Vega-Lite visual evidence (6 chart types + SVG renderer) | Done |
| D | Interactive HTML dashboard (`dashboard.html`) | Done |
| E | Pipeline integration + CLI flags (`--deep`, `--charts`, `--no-ai`) | Done |
| F | Tests (enrichment, investigator, charts) -- 80 total | Done |
| -- | QueryContext propagation (5 data interpretation fixes) | Done |
| G1 | Signal consolidation & materiality filtering (`consolidator.ts`) | Done |
| G3 | Executive briefing (`briefing.ts` → `README.md`) | Done |
| G4 | Five C's finding structure (`five-cs.ts`) | Done |
| G5 | Case folder redesign (query-param naming, `data/`, split `evidence/`) | Done |
| H1 | `log_reasoning` tool (agent externalizes thinking) | Done |
| H3 | Investigation narrative rendering (`narrative.ts`) | Done |
| H4 | `create_finding` tool (agent creates Five C's findings) | Done |
| I1-I4 | Traceability (file hashes, conversation log, tool IDs) | Done (partial) |
| J1 | Dashboard awards stripped, signal pagination | Done (partial) |
| J2 | case.md inverted pyramid (material findings first, collapsible signals) | Done |
| J3 | Next Steps section in README.md | Done |
| J4 | AI tags (`[RULE]`, `[AI-ENHANCED]`, `[AI-DISCOVERED]`) | Done |

### Phases G-J: Impact Assessment (2026-02-11)

Comparative run with identical parameters: DoD → MIT, FY2023, `--charts --no-ai`.

| Metric | Before (pre-G-J) | After (post-G-J) | Change | Target | Hit? |
|--------|-------------------|-------------------|--------|--------|------|
| **Folder name** | `case-2026-02-11` | `dod-mit-2026-02-11` | Descriptive | Query-param naming | Yes |
| **README.md** | None | 8 KB (1-page briefing) | New entry point | Exists, <200 lines | Yes |
| **Material findings** | None (1,356 flat signals) | **20 ranked findings** | **68x reduction** | 10-20 findings | Yes |
| **Five C's structure** | None | All 20 findings have Condition/Criteria/Cause/Effect/Rec | Audit-grade | All findings structured | Yes |
| **case.md** | 824 KB | 844 KB (+findings section) | +2.4% | <50 KB | **No** |
| **dashboard.html** | **19 MB** | **10 MB** | **-47%** | <1 MB | **No** |
| **evidence/** | 518 MB / 883 files | 518 MB / 881 files | Unchanged | <10 MB default | **No** |
| **Total folder** | 550 MB | 543 MB | -1.3% | <10 MB | **No** |
| **Verification** | 2,716/2,716 (100%) | 2,716/2,716 (100%) | No regression | 100% | Yes |
| **File hashes** | Empty `{}` | 2 hashes populated | Improved | All output files | Partial |
| **Agent tools** | 6 | 8 (+log_reasoning, +create_finding) | Ready for `--deep` | 8 tools | Yes |
| **Tests** | 80 | 100 | +25% | All pass | Yes |
| **AI tags** | None | `[RULE]` on all rule findings | Working | 3 tag types | Yes |

**Verdict:** The intellectual framework is solid (consolidation, Five C's, briefing, narrative, tags). But the **file size targets were largely missed** because the two biggest offenders -- entity-scoped evidence filtering (G2) and dashboard external data loading -- were not completed. These are the highest priority for Phase K.

### Next: Phase K (Output Size Revolution + Quality Fixes)

Phase K addresses the unfinished size targets from G-J and the bugs discovered during the comparison run. **This is what transforms a 543 MB case folder into a <10 MB git-committable artifact.**

See detailed specifications in the section below.

### Long-Term (post-hackathon)

| Enhancement | What |
|-------------|------|
| Period-specific obligation amounts | Use transaction sums instead of cumulative `awardAmount` |
| Cross-agency R004 suppression | Suppress when `--agency` yields single agency |
| Market-wide R006 peer groups | Fetch NAICS peers beyond filtered dataset |
| H2: `search_usaspending` tool | Agent makes real API queries for baselines (not just in-memory) |
| OCDS data format support | International procurement datasets |
| Beneficial ownership (BODS) | Link suppliers to ultimate owners |
| Network analysis | Entity relationship graphs |
| More indicators | Expand from 6 to OCP's full 73-indicator catalogue |
| Recipient deduplication | Use `recipient_id` hash + parent company lookup |

---

## Phase K: Output Size Revolution + Quality Fixes

### K1: Entity-Scoped Evidence Filtering (CRITICAL -- biggest size win)

**Problem:** Evidence CSVs are global 10K-row dumps (518 MB, 881 files). Every hypothesis links to the same unfiltered dataset. This is the #1 file size offender and the most misleading aspect of the current output.

**Root cause:** `ProverInput` now has a `findings?: MaterialFinding[]` field (added in G-J), but the `produceR00XEvidence()` functions in `src/prover/analyzer.ts` do not yet consume it. They still iterate all `awards` and `hypotheses` unfiltered.

**Required changes in `src/prover/analyzer.ts`:**

1. When `input.findings` is present, produce evidence per-finding instead of per-hypothesis:
   - Each `MaterialFinding` has `affectedAwardIds: string[]` -- use this to filter the award dataset
   - R001: filter `competedAwards` to only the finding's affected awards
   - R002: filter `competitionBreakdown` and `nonCompeted` to finding's awards
   - R003: filter `nearThreshold` to finding's awards
   - R004: still use all awards (vendor share needs full context) but highlight the finding's entity
   - R005: filter `modifiedAwards` to finding's awards
   - R006: filter `byNaics` groups to only include the finding's award and its immediate peers

2. Write summary evidence to `caseFolder.summaryEvidenceDir` (top findings only)
3. Write full detail to `caseFolder.detailEvidenceDir` only when `--full-evidence` is set
4. Skip the master `awards-summary.csv` in default mode (move to `--full-evidence`)

**Expected result:** ~20 findings × ~5-50 rows each = ~200-1,000 total CSV rows instead of 881 files × 10K rows. Evidence directory shrinks from 518 MB to <5 MB.

**Test:** Add assertion in `tests/unit/prover.test.ts`: when `findings` are provided, evidence CSV row counts match entity award counts, not global dataset.

**Files:**
- `src/prover/analyzer.ts` -- major refactor of `produceEvidence()` and all `produceR00XEvidence()` functions
- `src/orchestrator/pipeline.ts` -- pass `caseFolder.summaryEvidenceDir` vs `detailEvidenceDir` based on `--full-evidence`
- `tests/unit/prover.test.ts` -- new entity-scoped evidence tests

### K2: Dashboard External Data Loading (CRITICAL -- 10 MB → <1 MB)

**Problem:** Dashboard is 10 MB because it inlines all signal/hypothesis/evidence data as JSON in a `<script>` tag. Stripping the awards array (J1) halved it from 19 MB, but the remaining inline data (1,356 signals with full context strings, 613 hypotheses with full text, 874 evidence manifests) is still ~10 MB.

**Root cause:** The dashboard was designed as a self-contained single file. This was fine at 100 signals but breaks at 1,000+.

**Required changes in `src/narrator/dashboard.ts`:**

1. Move `__DASHBOARD_DATA__` to an external `dashboard-data.json` file in the case folder
2. Dashboard HTML loads it with `fetch('dashboard-data.json')` on page open
3. Inline only the summary stats needed for initial render (signal count, severity breakdown, top-10 signals, hypothesis count)
4. Lazy-load remaining signals and hypotheses on scroll/click
5. The HTML template itself (CSS + JS + structure) should be <200 KB

**Alternative (simpler, may be sufficient):** Keep inline but truncate:
- Signals: inline only top 50 by severity, add "Load all N signals" button that fetches from `data/signals.json`
- Hypotheses: inline only those matching material findings, not all 613
- Evidence manifest: inline only IDs and titles, not full metadata

**Expected result:** dashboard.html <1 MB (ideally <500 KB).

**Files:**
- `src/narrator/dashboard.ts` -- restructure data embedding
- `src/orchestrator/pipeline.ts` -- write `dashboard-data.json` alongside `dashboard.html`

### K3: Consolidator Finding Diversity (HIGH -- fixes R006 dominance)

**Problem:** 19 of 20 material findings are R006 price outliers. The R002 non-competitive signals (281 of them) don't appear in the top 20 because individual mega-dollar R006 outliers ($1.6B, $735M, etc.) dominate the materiality score.

**Root cause:** The materiality formula `totalDollarValue × severityWeight × signalCount` rewards single enormous awards over patterns across many smaller awards. A $1.6B single outlier scores higher than 50 non-competitive awards totaling $200M.

**Required changes in `src/signaler/consolidator.ts`:**

1. **Cap per-indicator findings:** Add `maxPerIndicator: number` to `MaterialityConfig` (default: 5). After sorting by materiality, enforce a per-indicator cap so no single indicator monopolizes the results.
2. **Adjust the formula for R006:** For R006 (individual-award signals), use a diminishing returns multiplier: the 2nd R006 finding scores at 70% of its raw score, 3rd at 50%, etc. This naturally diversifies.
3. **Group R002 by entity, not per-signal:** R002 currently produces many signals per entity (one per non-competitive code). The consolidator already groups by `(entityName, indicatorId)`, but R002's 281 signals across ~50 entities still produce 50 findings competing against 1,068 R006 signals from ~800 entities. Ensure R002 entity groups get aggregate dollar values from all their affected awards.

**Expected result:** Top 20 findings include a mix: ~5 R006, ~5 R002, ~3 R003, with remaining slots for other indicators that fire.

**Config change in `config/default.yaml`:**
```yaml
materiality:
  minAwardCount: 1
  minTotalAmount: 0
  maxFindings: 20
  maxPerIndicator: 5     # NEW: prevent single indicator from dominating
```

**Files:**
- `src/signaler/consolidator.ts` -- add per-indicator cap + diminishing returns
- `src/cli/config.ts` -- add `maxPerIndicator` to `MaterialityConfig` and schema
- `config/default.yaml` -- add `maxPerIndicator: 5`
- `tests/unit/consolidator.test.ts` -- test per-indicator diversity

### K4: R003 Threshold Display Bug (MEDIUM -- fixes wrong $ value)

**Problem:** The R003 finding says "within 10% below the $3 threshold." The Five C's template uses `signal.threshold` which contains `3` (the `minClusterSize` config value), not the dollar threshold ($250,000 or $7,500,000).

**Root cause:** The `Signal.threshold` field for R003 carries the `minClusterSize` rather than the dollar threshold. The Five C's template in `src/hypothesis/five-cs.ts` assumes `signal.threshold` is a dollar value.

**Fix options:**

Option A (quick): In the R003 Five C's template, don't use `signal.threshold` for the dollar value. Instead, parse the dollar threshold from `signal.context` string, which already contains it (e.g., "7 awards near the $250,000 threshold").

Option B (proper): Fix the R003 indicator (`src/signaler/indicators/splitting.ts`) to set `signal.threshold` to the dollar threshold value, and use a different field or context for the cluster size. This requires checking what other code reads `signal.threshold` for R003.

**Recommended:** Option B -- fix at the source. The `threshold` field semantically should be the dollar threshold for R003. The `minClusterSize` is config metadata, not a threshold that signals exceed.

**Files:**
- `src/signaler/indicators/splitting.ts` -- set `threshold` to dollar value
- `src/hypothesis/five-cs.ts` -- verify template reads correctly after fix
- `tests/unit/indicators.test.ts` -- verify R003 signal threshold is dollar value
- `tests/unit/five-cs.test.ts` -- verify R003 Five C's shows correct dollar threshold

### K5: case.md Size Reduction (MEDIUM -- 844 KB → <50 KB)

**Problem:** case.md is 844 KB. The material findings section added ~20 KB of value, but the remaining 824 KB is unchanged: 1,356-row signal table + 613 hypothesis sections with full template text.

**Required changes in `src/narrator/report.ts`:**

1. **Signal table:** Already wrapped in `<details>` for >50 signals (done in J2). But the signals are still all rendered as Markdown table rows inside the details tag. For >100 signals, replace with: "1,356 signals detected. See `data/signals.json` for full list. Top 20 by severity shown below:" then show only top 20.

2. **Hypothesis section:** Currently renders all 613 hypotheses. When `materialFindings` is present, render only hypotheses that correspond to material findings (match by `indicatorId` + `entityName`). Add a note: "613 hypotheses generated. Showing the 20 corresponding to material findings. Full list in `data/hypotheses.json`."

3. **Evidence links:** Currently every hypothesis lists its evidence files. Most are duplicates pointing to the same global CSVs. After K1 (entity-scoped evidence), this becomes correct automatically -- each finding links to its own scoped CSV.

**Expected result:** case.md drops from 844 KB to ~30-50 KB.

**Files:**
- `src/narrator/report.ts` -- truncate signals, filter hypotheses to material findings

### K6: JSON Data Deduplication (LOW -- cleanup)

**Problem:** The pipeline currently writes JSON files to both `data/` and the root folder for backwards compatibility:
- `signals.json` exists at both `cases/dod-mit-.../signals.json` and `cases/dod-mit-.../data/signals.json`
- Same for `hypotheses.json`, `verification.json`
- `awards.json` is in `data/` only (11 MB) but should also be gated by `--full-evidence`

**Required changes in `src/orchestrator/pipeline.ts`:**
1. Remove root-level duplicate JSON files (`signals.json`, `hypotheses.json`, `verification.json` at folder root)
2. Gate `awards.json` behind `--full-evidence` (it's 11 MB of raw data)
3. Always write `findings.json` and `provenance.json` (small, essential)

**Expected result:** Data directory becomes the single source for JSON artifacts. Root folder contains only: `README.md`, `case.md`, `dashboard.html`, `provenance.json`, and subdirectories.

**Files:**
- `src/orchestrator/pipeline.ts` -- remove duplicate writes, gate large files

### K7: USAspending Award Links in Reports (LOW -- traceability)

**Problem:** Award IDs in reports and evidence CSVs are plain text. They should be clickable links to USAspending.

**Required changes:**
1. In `src/narrator/report.ts`: for any award ID in the material findings section, render as `[{awardId}](https://www.usaspending.gov/award/{internalId})`
2. In `src/prover/analyzer.ts`: add a "USAspending Link" column to evidence CSVs with the URL
3. Need to maintain a mapping of `awardId` → `internalId` since the USAspending URL uses the internal ID

**Files:**
- `src/narrator/report.ts` -- award ID links in findings section
- `src/prover/analyzer.ts` -- URL column in CSVs

---

### Phase K Implementation Order

| Step | Item | Priority | Est. Effort | Impact |
|------|------|----------|-------------|--------|
| 1 | **K1: Entity-scoped evidence** | **Critical** | 3-4h | 518 MB → <5 MB evidence |
| 2 | **K2: Dashboard external data** | **Critical** | 2-3h | 10 MB → <1 MB dashboard |
| 3 | **K3: Finding diversity** | **High** | 1-2h | 19 R006 → mixed indicators |
| 4 | **K4: R003 threshold bug** | **High** | 30min | Correct dollar values |
| 5 | **K5: case.md truncation** | **Medium** | 1-2h | 844 KB → <50 KB report |
| 6 | **K6: JSON dedup** | **Low** | 30min | Cleaner folder structure |
| 7 | **K7: Award links** | **Low** | 1h | Better traceability |

**K1 + K2 are the critical path** -- they deliver the promised <10 MB case folder. K3 + K4 fix the most visible quality issues. K5-K7 are polish.

**Total estimated effort:** 9-13h for the full phase.

---

## Session Resumption Protocol

To resume development:

1. **Read this document** -- contains full implementation state, G-J results, and Phase K plan
2. **Check git log** -- `git log --oneline` shows what's committed
3. **Run tests** -- `npm test` (100 tests, all should pass)
4. **Run typecheck** -- `npm run typecheck` (should be clean)
5. **Check cache** -- `.cache/` preserves API data; re-runs are instant with `--no-ai`
6. **Review the Phase K plan above** -- K1 (entity-scoped evidence) is the critical first step
7. **Compare output folders:**
   - `cases/case-2026-02-11/` -- pre-G-J baseline (550 MB, no findings, no README)
   - `cases/dod-mit-2026-02-11/` -- post-G-J run (543 MB, 20 findings, README.md)

### Key files for Phase K

| File | What to do |
|------|------------|
| `src/prover/analyzer.ts` | **K1:** Refactor `produceR00XEvidence()` to filter by `findings.affectedAwardIds` |
| `src/narrator/dashboard.ts` | **K2:** Move data to external JSON or truncate inline to top-50 |
| `src/signaler/consolidator.ts` | **K3:** Add `maxPerIndicator` cap + diminishing returns for R006 |
| `src/signaler/indicators/splitting.ts` | **K4:** Fix `threshold` field to carry dollar value, not cluster size |
| `src/hypothesis/five-cs.ts` | **K4:** Verify R003 template after threshold fix |
| `src/narrator/report.ts` | **K5:** Truncate signal table, filter hypotheses to material findings only |
| `src/orchestrator/pipeline.ts` | **K1/K2/K6:** Route evidence to summary vs detail dirs, remove JSON dupes |
| `src/cli/config.ts` | **K3:** Add `maxPerIndicator` to MaterialityConfig |
| `config/default.yaml` | **K3:** Add `maxPerIndicator: 5` |

### New files added in Phases G-J

| File | Purpose |
|------|---------|
| `src/signaler/consolidator.ts` | Signal → MaterialFinding consolidation with materiality scoring |
| `src/hypothesis/five-cs.ts` | GAO Yellow Book Five C's templates per indicator |
| `src/narrator/briefing.ts` | README.md executive briefing generator |
| `src/narrator/narrative.ts` | Investigation narrative renderer (for `--deep` mode) |
| `tests/unit/consolidator.test.ts` | 8 tests for consolidation logic |
| `tests/unit/five-cs.test.ts` | 6 tests for Five C's templates |
| `tests/unit/briefing.test.ts` | 6 tests for briefing generation |
