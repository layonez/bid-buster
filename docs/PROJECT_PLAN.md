# Procurement Investigator - Project Plan

> **Last updated:** 2026-02-11
> **Current stage:** Full pipeline implemented (Phases A-F + QueryContext). Output quality audit complete. Next: Phases G-J (output revolution, visible agent reasoning, traceability).

## Executive Summary

**`investigate`** is a TypeScript CLI tool that converts slices of public procurement data (USAspending) into **auditable case files** with red-flag signals, hypotheses, CSV evidence tables, and open questions. It uses a multi-agent architecture with Claude AI enhancement at multiple stages.

**Key differentiator:** Investigation-as-Code -- every finding is reproducible, every claim is verified against computed evidence, every run produces a git-committable case folder with CSV evidence files.

**Current challenge: From data scan to analyst-grade investigation.** The full technical pipeline works -- 8-step collect→signal→investigate→hypothesize→prove→enhance→report→verify. But an output quality audit revealed the gap: **the tool produces 1,356 signals where it should produce 5-10 material findings.** The output overwhelms rather than informs. The AI agent's reasoning is invisible. Evidence CSVs are generic data dumps rather than entity-specific proof.

**Next evolution:** Close the gap between "red flag detection" (what rules engines do) and "investigation-as-code" (what we promised). This means: (1) material findings with dollar-weighted severity instead of flat signal lists, (2) visible agent reasoning -- a `log_reasoning` tool that makes the AI's investigation narrative a first-class artifact, (3) entity-scoped evidence that traces from finding → evidence → API source, and (4) a concise executive briefing that tells a story in 1 page.

---

## Current Implementation Status

### What's Built and Working

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| CLI (commander) | 5 | ~420 | Complete -- 3 commands: `run`, `fetch`, `signal`; `--with-transactions`, `--deep`, `--charts` flags |
| Collector (API client) | 4 | ~679 | Complete -- pagination, throttling, caching, detail + transaction enrichment |
| Normalizer | 3 | ~167 | Complete -- search results, award details, transactions |
| Signaler (6 indicators) | 9 | ~1,070 | Complete -- all 6 indicators with configurable thresholds + QueryContext awareness |
| Enrichment clients | 4 | ~600 | Complete -- SAM.gov, OpenSanctions, sub-awards clients |
| Investigator (Opus 4.6) | 2 | ~400 | Complete -- autonomous tool-calling agent with enrichment |
| Hypothesis Maker | 2 | ~214 | Complete -- templates + Claude AI executive assessment |
| Prover (evidence + charts) | 3 | ~1,130 | Complete -- CSV evidence + Vega-Lite SVG charts (6 types) |
| Narrator + Enhancer + Dashboard | 3 | ~580 | Complete -- case.md + dashboard.html + AI per-hypothesis enrichment |
| Verifier | 1 | ~120 | Complete -- claim-evidence cross-check + tautology detection |
| Orchestrator | 1 | ~340 | Complete -- 8-step pipeline with QueryContext propagation |
| Shared utilities | 4 | ~240 | Complete -- logger, fs, provenance, types (incl. QueryContext) |
| **Total** | **41+ files** | **~5,960 lines** | **All agents fully operational** |

**No stubs remaining.** All agents are fully operational including the Opus 4.6 investigative agent.

### Test Suite

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `config.test.ts` | 3 | Config loading, defaults, threshold merging |
| `indicators.test.ts` | 12 | R001-R004, R006 indicators + R004 tautology suppression + R006 peer group caveat |
| `engine.test.ts` | 3 | Engine initialization, indicator filtering, severity sorting |
| `hypothesis.test.ts` | 4 | Template generation, non-accusatory language, deduplication |
| `report.test.ts` | 10 | Disclaimer, signals, hypotheses, provenance, evidence links, Data Scope section, verifier tautology detection |
| `prover.test.ts` | 5 | Evidence artifact generation, CSV validity, escaping, master summary, executive skip |
| `charts.test.ts` | 12 | Vega-Lite spec builders (6 chart types), SVG rendering, adaptive log-scale binning |
| `enrichment.test.ts` | 16 | SAM.gov, OpenSanctions, sub-awards clients with mocked HTTP |
| `investigator.test.ts` | 15 | Tool definitions, agent loop, max iteration cap, findings structure |
| **Total** | **80** | **All passing** |

### Validated on Real Data

**Demo slice:** Department of Defense → MIT, FY2023 (full DoD dataset: 10,000 awards)
- 10,000 awards fetched via paginated search, 9,994+ details enriched from cache
- **1,356 signals detected** across 6 indicators on the full DoD dataset
- **613 hypotheses generated**, 874 CSV evidence artifacts, 4 SVG charts
- **2,716/2,716 claims verified** (verification passed, 0 unsupported)
- R004 tautological signal for MIT correctly suppressed (was 100% before QueryContext fix)
- Award distribution chart auto-switches to log scale (data spans $7.9K to $1.59B)
- "Data Scope & Interpretation" section explains cumulative values and filter implications

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

### Current: 8-Step Pipeline (implemented)

```
investigate run [--agency=<name>] [--recipient=<name>] --period=<start:end> [--deep] [--charts] [--no-ai]

  Step 1: COLLECT       USAspending API → paginate → cache → normalize
                        → Construct QueryContext from params (recipient/agency/period filters)
  Step 2: SIGNAL        6 indicators × fold/finalize → signal table (QueryContext-aware)
  Step 3: INVESTIGATE   Opus 4.6 agent examines signals, fetches enrichment, iterates (--deep)
  Step 4: HYPOTHESIZE   templates + agent findings merge → enriched questions
  Step 5: PROVE         CSV tables + SVG charts (adaptive binning) → evidence/ directory
  Step 6: ENHANCE       AI-refined per-hypothesis narrative (Claude Sonnet)
  Step 7: REPORT        case.md (with Data Scope section) + dashboard.html
  Step 8: VERIFY        cross-check claims + tautology detection → pass/fail
```

The architectural shift (current → target):

```
Current:  Collect → Rules → 1,356 flat signals → 613 template hypotheses → 820KB report

Target:   Collect → Rules → AGENT TRIAGE → Top-N Material Findings → Concise Briefing
                               |
                    +-----------------------------------+
                    |  1. Triages signals by materiality |
                    |  2. log_reasoning: records thinking | <-- visible reasoning trace
                    |  3. search_usaspending: baselines   | <-- comparative data
                    |  4. SAM.gov / OpenSanctions          |
                    |  5. Forms/revises theories            |
                    |  6. Produces Five C's findings        |
                    |  7. Writes investigation narrative    |
                    +-----------------------------------+
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
│   ├── report.ts                 # case.md assembly (Data Scope, signals, hypotheses, evidence)
│   ├── enhancer.ts               # AI per-hypothesis narrative enrichment (Claude Sonnet)
│   └── dashboard.ts              # Interactive HTML dashboard generator
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

**Current (problematic):** `cases/case-YYYY-MM-DD/` -- 550MB, 883 files, date-only name.

**Target (Phase G):** Compact, browsable, git-committable.

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

**Key changes from current:** Folder named by query params. README.md as primary output. Entity-scoped evidence. <10MB default (detail/ only with `--full-evidence`). Agent reasoning as dedicated artifact.

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

### Completed (Phases 0-F + QueryContext)

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

### Next: Phases G-J (Output Quality Revolution)

See "Next Implementation: Phases G-J" section above for detailed specifications.

| Phase | What | Priority | Est. Effort |
|-------|------|----------|-------------|
| **G** | Output quality revolution (consolidation, evidence, briefing, Five C's, folder) | **Critical** | 10-12h |
| **H** | Visible agent reasoning (`log_reasoning`, `search_usaspending`, narrative) | **Critical** | 6-8h |
| **I** | Traceability & reproducibility (conversation log, provenance chain) | Medium | 2-3h |
| **J** | Dashboard & report polish (lightweight, concise, next steps, AI tags) | Medium | 3-4h |

### Long-Term (post-hackathon)

| Enhancement | What |
|-------------|------|
| Period-specific obligation amounts | Use transaction sums instead of cumulative `awardAmount` |
| Cross-agency R004 suppression | Suppress when `--agency` yields single agency |
| Market-wide R006 peer groups | Fetch NAICS peers beyond filtered dataset |
| OCDS data format support | International procurement datasets |
| Beneficial ownership (BODS) | Link suppliers to ultimate owners |
| Network analysis | Entity relationship graphs |
| More indicators | Expand from 6 to OCP's full 73-indicator catalogue |
| Recipient deduplication | Use `recipient_id` hash + parent company lookup |

---

## Session Resumption Protocol

To resume development:

1. **Read this document** -- contains full implementation state, output quality audit, and Phases G-J plan
2. **Check git log** -- `git log --oneline` shows what's committed
3. **Run tests** -- `npm test` (80 tests, all should pass)
4. **Run typecheck** -- `npm run typecheck` (should be clean)
5. **Check cache** -- `.cache/` preserves API data; re-runs are instant with `--no-ai`
6. **Review the output quality issues** -- "Output Quality Audit" section documents what's wrong with current output
7. **Start with Phase G1** (signal consolidation) -- this unblocks most other phases

### Key files for context

| File | Purpose |
|------|---------|
| `docs/PROJECT_PLAN.md` | This document -- full state, audit findings, and Phases G-J specs |
| `docs/PROJECT_BRIEF.md` | Hackathon-ready project description |
| `docs/api-analysis.md` | USAspending field-to-indicator mapping |
| `config/default.yaml` | All configurable thresholds |
| `src/shared/types.ts` | Core types: Signal, QueryContext, InvestigationFindings, etc. |
| `src/signaler/engine.ts` | Signal engine with QueryContext propagation |
| `src/investigator/agent.ts` | Opus 4.6 investigative agent (target for Phase H) |
| `src/investigator/tools.ts` | Agent tool definitions (add `log_reasoning` + `search_usaspending` here) |
| `src/prover/analyzer.ts` | Evidence generation (fix entity scoping in Phase G2) |
| `src/narrator/report.ts` | Report assembly (simplify in Phase J2) |
| `src/orchestrator/pipeline.ts` | 8-step pipeline (add consolidation step in Phase G1) |
| `cases/case-2026-02-11/` | Current output to reference -- the 820KB/550MB problem |
