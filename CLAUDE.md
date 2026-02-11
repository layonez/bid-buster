# Procurement Investigator -- Project Constitution

## What This Project Is

**Procurement Investigator** is an open-source TypeScript CLI tool that converts public procurement data into auditable integrity case files. One command fetches data from USAspending, computes red-flag indicators, generates non-accusatory hypotheses (with optional Claude AI enhancement), assembles a verified case report, and writes it all to a git-committable folder.

Built for **Anthropic's Hackathon 2025**, aligned with **Problem Statement #2: "Break the Barriers"** -- taking expert procurement audit methodology (OECD, OCP, World Bank) and putting it in everyone's hands.

## Why This Matters

Public procurement is one-third of government spending. Corruption and waste in procurement are detected by experts using red-flag indicators -- patterns in bidding, pricing, competition, and contract modifications. But this expertise is locked behind expensive tools and institutional knowledge. We're codifying it into a reproducible, transparent, open-source pipeline that anyone can run.

## The Core Principle: Investigation-as-Code

Every finding must be:
- **Reproducible** -- same input produces same output; provenance.json tracks everything
- **Verifiable** -- every claim links to computed evidence; the verifier agent checks this
- **Non-accusatory** -- red flags are screening indicators, not proof of wrongdoing
- **Transparent** -- all thresholds, data coverage, and methodology documented in the output

---

## Session Startup

When starting a new session on this project:

1. Read `docs/PROJECT_PLAN.md` -- comprehensive implementation state, decisions, and roadmap
2. Run `npm test` -- 31 tests, all should pass
3. Run `npm run typecheck` -- should be clean (zero errors)
4. The `.cache/` directory has API data from previous runs (instant re-runs)
5. Check `git log --oneline` to see latest work

## Where to Find Things

| What | Where |
|------|-------|
| Full implementation state & decisions | `docs/PROJECT_PLAN.md` |
| Hackathon-ready project description | `docs/PROJECT_BRIEF.md` |
| USAspending API field mapping | `docs/api-analysis.md` |
| Red flags methodology research | `docs/Data-Driven Procurement Red Flags...md` |
| Data ingestion strategy | `docs/Ingesting USAspending Award Data.md` |
| Multi-agent design patterns | `docs/Multi-Agent Workflow Systems...md` |
| Hackathon rules & constraints | `docs/Hackathon rules.md` |
| API exploration samples | `exploration/` (7 JSON files + README) |
| Reference repos (local only, gitignored) | `references/cardinal-rs/`, `references/ocdskit/`, `references/kingfisher-collect/` |
| All indicator thresholds | `config/default.yaml` |
| Core types | `src/shared/types.ts` |
| Indicator interface | `src/signaler/types.ts` |
| Normalized data schema | `src/normalizer/schema.ts` |
| API response types | `src/collector/types.ts` |

## Architecture in 30 Seconds

```
investigate run --agency=X --period=Y [--recipient=Z] [--deep] [--charts]

  1. Collector    → USAspending API → paginate → cache → normalize
  2. Signaler     → 6 indicators × fold/finalize → signal table
  3. Investigator → Opus 4.6 agent examines signals, fetches enrichment, iterates (--deep)
  4. Hypothesis   → templates + agent findings → non-accusatory questions
  5. Prover       → CSV tables + SVG charts → evidence/ directory
  6. Enhancer     → AI-refined per-hypothesis narrative (Claude Sonnet)
  7. Narrator     → case.md + dashboard.html (disclaimer, signals, hypotheses, evidence)
  8. Verifier     → cross-check every claim against signal data → pass/fail

Output: cases/case-YYYY-MM-DD/ (case.md + dashboard.html + JSON artifacts + evidence/)
```

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
- Config keys: `snake_case` in YAML, `camelCase` in TypeScript
- Files: `kebab-case.ts` for indicators, `camelCase.ts` for modules

### Dependencies
- Prefer lightweight packages. We chose `p-retry` + `p-throttle` over axios
- `simple-statistics` for quartile/IQR calculations
- `@anthropic-ai/sdk` for Claude API -- always with graceful fallback
- `cosmiconfig` for config discovery; `pino` for structured logging
- **Do not add** heavy frameworks (express, fastify) unless explicitly needed
- **Do not add** chart/visualization deps until the prover agent is actively being built

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
  configure(settings): void;     // Apply thresholds from config
  fold(award): void;             // Process one record at a time
  finalize(): Signal[];          // Produce signals after all records processed
  getMetadata(): IndicatorMetadata;  // Report thresholds used + data coverage
}
```

When adding a new indicator:
1. Create `src/signaler/indicators/{name}.ts` extending `BaseIndicator`
2. Add config key in `src/cli/config.ts` (defaults section + schema)
3. Add entry in `config/default.yaml`
4. Register in `src/signaler/engine.ts` (registry + config key mapping)
5. Add hypothesis template in `src/hypothesis/templates.ts`
6. Add at least one unit test in `tests/unit/indicators.test.ts`
7. Update `docs/PROJECT_PLAN.md` indicator table

Every indicator MUST:
- Be **configurable** (thresholds, enabled flag) via config
- Report **metadata** (thresholds used, data coverage percentage)
- Produce **signals with context** (human-readable explanation of what was found)
- Handle **missing data gracefully** (skip records with null required fields, report coverage)

---

## API Integration Rules

### USAspending API
- Base URL: `https://api.usaspending.gov/api/v2/`
- No auth required. No documented rate limits (throttle to 2 req/sec defensively)
- **Always cache** responses (SHA-256 keyed, file-based). Cache survives sessions
- Handle HTTP 429 (rate limit) and 500 (transient) with exponential backoff
- Use cursor-based pagination (`last_record_unique_id`) for large result sets
- Award detail (`/awards/{id}/`) is the expensive call -- one per award, but provides competition data

### Claude API
- Used for **hypothesis enhancement only** (executive assessment)
- Model: `claude-sonnet-4-5-20250929` with `max_tokens: 512` (cost-efficient)
- **Always** wrap in try/catch with graceful fallback to template-only output
- System prompt enforces non-accusatory tone
- API key loaded from `.env` via `dotenv`

---

## What NOT to Do

- Don't break the 8-step pipeline contract (Collect → Signal → Investigate → Hypothesize → Prove → Enhance → Report → Verify)
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
- **Team size ≤ 2**
- **Problem Statement #2**: "Break the Barriers" -- expert knowledge in everyone's hands
- Resources: Claude Code, Claude API, MCP, Agent Skills (see `docs/Hackathon rules.md`)

---

## Current State (update after each session)

**Enhanced MVP is complete.** 33 TypeScript files, ~3,900 lines, 31 tests passing.

Working 7-step pipeline: `investigate run --agency="Department of Defense" --recipient="MIT" --period=2023-01-01:2023-12-31` produces a verified case folder with:
- CSV evidence tables per hypothesis in `evidence/` directory
- AI-enhanced per-hypothesis narratives (Claude Sonnet)
- AI executive assessment
- Evidence artifact links in case.md
- Transaction support via `--with-transactions` flag for R005

**Completed enhancements:**
1. Prover agent -- CSV evidence tables per hypothesis (all 6 indicators + master summary)
2. AI-enhanced narrator -- Claude refines each hypothesis with balanced analysis
3. Transaction integration -- `--with-transactions` flag feeds R005 indicator
4. Broader demo support -- `--agency` is now optional (at least one of --agency or --recipient required)

**Next: Opus 4.6 Investigative Agent** (see `docs/PROJECT_PLAN.md` → Next Implementation):
- Phase A: Multi-source enrichment clients (SAM.gov, OpenSanctions, sub-awards)
- Phase B: Opus 4.6 autonomous investigative agent (tool-calling loop)
- Phase C: Vega-Lite visual evidence (SVG charts)
- Phase D: Interactive HTML dashboard
- Phase E: Pipeline integration + CLI flags (`--deep`, `--charts`)
- Phase F: Tests for all new components
