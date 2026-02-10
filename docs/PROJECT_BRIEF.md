# Procurement Investigator: Investigation-as-Code

> Open-source CLI that turns public spending data into auditable integrity reports -- putting anti-corruption expertise in everyone's hands.

---

## Problem Statement

Public procurement represents **one-third of government spending** globally and roughly **12% of GDP** in OECD countries. Identifying integrity risks in this data currently requires deep institutional knowledge, access to expensive proprietary tools, and familiarity with audit methodologies from the OECD, World Bank, and Open Contracting Partnership.

**Procurement Investigator** breaks these barriers. It packages decades of anti-corruption methodology into a single command-line tool that anyone -- journalists, civil society watchdogs, oversight offices, or concerned citizens -- can run against publicly available data to produce a professional-grade integrity screening report.

**Hackathon alignment:** Problem Statement Two -- *"Break the Barriers"* -- take something powerful that's locked behind expertise and put it in everyone's hands.

---

## What It Does

```
investigate --agency="Department of Defense" \
            --recipient="ACME Corp" \
            --period=2020-01-01:2024-12-31
```

One command. The tool:

1. **Collects** award data from the USAspending API (pagination, caching, snapshots)
2. **Computes** 6 red-flag indicators based on recognised integrity methodologies
3. **Generates** plain-language hypotheses (non-accusatory, OECD-aligned)
4. **Produces** evidence artifacts (statistical tables, distribution charts)
5. **Verifies** every claim in the report is backed by evidence
6. **Assembles** a complete case folder ready for human review

Output:
```
case-2024-02-10/
├── case.md           # Narrative report with footnoted evidence links
├── evidence/         # Charts, tables, CSV extracts
├── queries/          # Raw API payloads and responses
├── analysis/         # Reproducible analysis scripts
└── provenance.json   # Full audit trail (timestamps, versions, hashes)
```

Every finding links to its underlying data. Every run is reproducible. The entire case folder is git-committable.

---

## How It Uses Claude Opus 4.6

The tool is architected as **6 specialised agents** orchestrated in a pipeline:

| Agent | Role | Opus 4.6 Capability |
|-------|------|---------------------|
| **Collector** | Data ingestion, pagination, caching | -- (deterministic) |
| **Signaler** | Compute red-flag indicators | -- (deterministic) |
| **Hypothesis Maker** | Convert signals into questions | Long-context reasoning over full dataset; structured output; ethical tone calibration |
| **Prover** | Generate evidence artifacts | Code generation for statistical analysis; multi-step reasoning |
| **Verifier** | Cross-check claims vs evidence | Verification and self-correction; structured output |
| **Narrator** | Assemble final report | Long-context synthesis; non-accusatory narrative with citations |

**Key model capabilities demonstrated:**
- **Multi-agent orchestration** -- 6 agents with distinct roles and handoffs
- **Long-context processing** -- feeding hundreds of award records with full detail into analysis
- **Structured output** -- typed JSON signals, hypotheses, verification results
- **Self-verification** -- the Verifier catches unsupported claims and triggers revision
- **Ethical reasoning** -- maintaining non-accusatory framing per OECD/OCP guidance
- **Reproducibility** -- every AI-generated artifact includes its prompt, model version, and parameters

---

## Red-Flag Indicators (MVP)

Six indicators implementable end-to-end with USAspending data, grounded in the Open Contracting Partnership's catalogue of 73 recognised indicators:

| # | Indicator | What It Detects | Data Source |
|---|-----------|-----------------|-------------|
| R001 | **Single-Bid Competition** | Open tenders with only 1 bidder (restricted competition) | `number_of_offers_received` from award detail |
| R002 | **Non-Competitive Awards** | Awards bypassing open competition | `extent_competed` codes B, C, G, NDO |
| R003 | **Contract Splitting** | Clusters of awards just below regulatory thresholds | Award amounts near $250K grouped by agency/recipient/period |
| R004 | **Vendor Concentration** | One supplier dominating an agency's spend | Recipient share of total agency contract value |
| R005 | **Excessive Modifications** | Contracts ballooning post-award | Modification count and cost growth via transaction history |
| R006 | **Price Outliers** | Abnormally expensive awards vs. peers | Cross-category comparison using NAICS/PSC codes |

Each indicator is:
- **Configurable** -- thresholds, time windows, and minimum coverage set via `config.yaml`
- **Transparent** -- outputs the threshold used, data coverage, and group sizes alongside each signal
- **Non-accusatory** -- framed as screening prompts, not proof of wrongdoing

**Future indicators** (require additional data): beneficial ownership conflicts, collusive bidding patterns, tender timing manipulation, and more from the full OCP catalogue.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI (commander)                       │
│  investigate --agency=X --period=Y --recipient=Z --output=.  │
└──────────┬──────────────────────────────────────────────────┘
           │
     ┌─────▼──────┐
     │ Orchestrator│  Sequential pipeline with shared context
     └─────┬──────┘
           │
  ┌────────▼─────────┐    ┌──────────────────┐
  │  1. Collector     │───▶│  USAspending API  │
  │  (fetch + cache)  │    │  SAM.gov (future) │
  └────────┬─────────┘    └──────────────────┘
           │
  ┌────────▼─────────┐
  │  2. Normalizer    │  Raw JSON → canonical schema (zod-validated)
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │  3. Signaler      │  6 indicators × fold/finalize pattern
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │  4. Hypothesis    │  Templates + Claude Opus 4.6 refinement
  │     Maker         │
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │  5. Prover        │  Statistical analysis → charts + tables
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │  6. Verifier      │  Claim ↔ evidence cross-check
  └────────┬─────────┘
           │
  ┌────────▼─────────┐
  │  7. Narrator      │  Assemble case.md with footnotes
  └────────┬─────────┘
           │
           ▼
     case-{date}/
```

---

## Technology Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript (strict, ESM) | Type safety, modern ecosystem |
| Runtime | Node.js 20+ | LTS, native fetch |
| CLI | `commander` | Most popular, excellent TS types |
| Validation | `zod` | Runtime schema validation for API data and config |
| HTTP | Native `fetch` + `p-retry` + `p-throttle` | Lightweight; backoff + rate limiting |
| Config | `cosmiconfig` | Automatic config file discovery |
| Statistics | `simple-statistics` | Quartile/percentile calculations for indicators |
| AI | `@anthropic-ai/sdk` | Claude API for hypothesis generation and narration |
| Charts | `vega-lite` + `vl-convert` | Reproducible specs, SVG/PNG export |
| Testing | `vitest` | Fast, native ESM + TypeScript |
| Logging | `pino` | Structured JSON, low overhead |

---

## Project Stages

### Stage 1: POC (Proof of Concept)

**Goal:** Demonstrate the core loop works end-to-end with real data.

**Scope:**
- Fetch a small slice of USAspending data (single agency + recipient, ~50 awards)
- Compute 2-3 indicators (single-bid, non-competitive, vendor concentration)
- Generate a basic signal table and text-based hypothesis output
- Manual report assembly to validate the concept

**Deliverable:** Script that fetches data, computes signals, and prints findings to stdout.

**Success criteria:** Real red-flag signals detected from real USAspending data.

---

### Stage 2: MVP (Minimum Viable Product)

**Goal:** A polished, installable CLI tool that produces complete case folders.

**Scope:**
- Full Collector with pagination, caching, snapshots, and detail enrichment
- All 6 MVP indicators with configurable thresholds
- Template-based hypothesis generation + Claude API narrative enhancement
- Evidence generation (Vega-Lite charts, statistical tables, CSV extracts)
- Verifier ensuring claim-evidence traceability
- Narrator assembling `case.md` with footnotes and disclaimers
- `provenance.json` for full reproducibility
- Unit tests for all indicators

**Deliverable:** `npx investigate --agency=X --period=Y` producing a complete case folder.

**Success criteria:** A compelling case folder for DoD procurement that a journalist or auditor would find genuinely useful.

---

### Stage 3: Enhancement (Post-Hackathon)

**Goal:** Expand data sources, indicators, and output formats.

**Scope:**
- SAM.gov Entity Management API integration (entity verification, business type enrichment)
- OpenSanctions screening (sanctions lists, PEP matching)
- Additional indicators from OCP's 73-indicator catalogue
- OCDS data format support (international procurement datasets)
- Interactive web dashboard (evidence explorer)
- Bulk download support for large-scale analysis
- Beneficial ownership integration (BODS format)

---

## Data Source

**USAspending API** (https://api.usaspending.gov) -- no authentication required.

| Endpoint | Purpose | Key Fields for Red Flags |
|----------|---------|--------------------------|
| `/search/spending_by_award/` | Primary award search | Award ID, amount, recipient, agency, dates, NAICS, PSC |
| `/awards/{id}/` | Individual award detail | **Competition data**: offers received, extent competed, pricing type, solicitation procedures |
| `/transactions/` | Modification history | Action type, modification number, obligation change, dates |
| `/search/spending_by_category/recipient/` | Aggregate analytics | Recipient share of agency spend |
| `/search/spending_over_time/` | Time series | Trend detection |

**MVP data slice:** Department of Defense → MIT, FY2020-2024 (~500 awards). Chosen for manageable volume and low reputational risk.

---

## Ethical Framework

- **Screening, not accusation.** Every report opens with a disclaimer: red flags are prompts for further review, not proof of wrongdoing (per OECD 2025 guidelines).
- **Non-accusatory language.** Hypotheses use question form: *"Are contract amounts unusually concentrated?"* not *"This agency is corrupt."*
- **Data quality transparency.** Reports note coverage gaps, missing fields, and minimum sample sizes before raising indicators.
- **Public data only.** No FOUO or sensitive-level API access. No personal data in reports.
- **Reproducibility.** Every claim links to evidence. Every run produces `provenance.json`.

---

## What Makes This Novel

1. **Investigation-as-Code:** The entire audit methodology is codified, version-controlled, and reproducible -- not locked in a PDF manual or institutional knowledge.

2. **AI-powered but evidence-grounded:** Claude Opus 4.6 generates hypotheses and narratives, but every claim must pass verification against computed evidence. The AI amplifies human judgment without replacing it.

3. **Multi-agent architecture:** Six specialised agents with distinct roles mirror how a real investigation team operates -- but automated and consistent.

4. **Self-verifying:** The Verifier agent rejects reports with unsupported claims. This is a built-in quality gate most AI tools lack.

5. **Open methodology:** Red-flag indicators are drawn from recognised frameworks (OCP, OECD, World Bank) with configurable thresholds -- not black-box scoring.

---

## References

- Open Contracting Partnership, *Red Flags in Public Procurement* (2024) -- 73 indicators catalogue
- OECD, *Guidelines for Fighting Bid Rigging in Public Procurement* (2025 Update)
- OCP Cardinal library -- open-source red-flag computation
- USAspending API -- public federal spending data
- SAM.gov Entity Management API -- entity verification
- OpenSanctions -- global sanctions and PEP database

---

*Open source. TypeScript. Built for Anthropic's Hackathon 2025.*
