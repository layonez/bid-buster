# Procurement Investigator: Investigation-as-Code

> One person. Zero procurement expertise. Claude Opus 4.6 as a research team. A working tool in three days that catches what Senate investigations and Inspectors General later confirmed.

**Hackathon 2025 | Problem Statement #2: Break the Barriers**

---

## Real-World Validation: FEMA COVID-19

I pointed the tool at FEMA's 2020 pandemic procurement -- **7,259 contracts, zero prior knowledge of any vendor.** The system independently flagged:

| Vendor | Amount | What Was Found |
|--------|--------|---------------|
| **Parkdale Mills** | $532M | Convergence: vendor concentration + price outlier |
| **Hanesbrands** | $175M | Convergence: concentration + price outlier |
| **3M Company** | $96M | Price outlier in safety equipment |
| **GDIT** | $97M | Vendor concentration in IT services |

**The soda bottle test.** Fillakit LLC was formed 6 days before receiving a $10.16M FEMA contract for COVID test tubes. They shipped miniature soda bottles. The tool flags this automatically -- single-bid urgency pattern, no prior contract history, anomalous pricing. The Senate and DHS Inspector General later investigated the same company.

**1,465 signals -> 16 material findings** (92x noise reduction) | **36/36 claims verified** (100%) | **5.0 MB** git-committable case folder

---

## The Personal Journey

I'm a software engineer. I had never worked in government contracting. Before this project, I didn't know what FAR 6.302 was or why single-bid rates matter.

Claude Opus 4.6 made this possible -- not just as a coding assistant, but as a domain research team. Multiple agents explored OECD bid-rigging methodology, the Open Contracting Partnership's 73-indicator catalogue, and GAO audit standards. Opus analyzed the [Cardinal-rs](https://github.com/open-contracting/cardinal-rs) Rust rule engine and we iterated together on a TypeScript adaptation of its fold/finalize architecture. It introduced me to the GAO Yellow Book's Five C's framework -- that's what gives every finding professional audit structure.

**That's the point.** The same AI that taught me the domain now runs the investigations. If a non-expert can build a professional-grade integrity screening tool in three days, imagine what journalists, watchdogs, and oversight offices can do with it.

---

## Why This Matters

Public procurement represents **one-third of government spending** -- ~$700 billion/year in the US alone. Identifying integrity risks currently requires deep institutional knowledge, access to expensive proprietary tools ($50K+/year), and familiarity with audit methodologies from the OECD, World Bank, and Open Contracting Partnership.

**Before:** Hire a $200K/year forensic auditor with OECD methodology training.
**After:** `npm run investigate -- run --subtier-agency="FEMA" --period=2020-01-01:2020-12-31`

---

## What It Does

```bash
investigate run \
  --subtier-agency="Federal Emergency Management Agency" \
  --period=2020-01-01:2020-12-31 \
  --deep --charts
```

One command. The 8-step pipeline:

1. **Collects** award data from the USAspending API (pagination, caching, detail enrichment)
2. **Signals** 6 red-flag indicators based on OCP/OECD methodology (fold/finalize pattern)
3. **Consolidates** 1,465 raw signals into 16 material findings (dollar-weighted materiality, per-indicator caps)
4. **Investigates** autonomously via Claude Opus 4.6 agent with 8 tools (SAM.gov, sanctions screening, reasoning trace)
5. **Hypothesizes** non-accusatory questions with Five C's audit structure (GAO Yellow Book)
6. **Proves** every finding with entity-scoped CSV evidence + Vega-Lite SVG charts
7. **Enhances** per-hypothesis narrative via Claude Sonnet 4.5
8. **Reports** README.md executive briefing + case.md + interactive dashboard + investigation narrative
9. **Verifies** every claim against computed evidence with tautology detection

Output (5.0 MB, git-committable):
```
cases/fema-{date}/
├── README.md                   Executive briefing (top findings in plain English)
├── case.md                     Full report (<50 KB, inverted pyramid)
├── dashboard.html              Interactive dashboard (277 KB)
├── investigation-narrative.md  Agent reasoning trace (--deep only)
├── provenance.json             Full audit trail (git commit, timestamps, hashes)
├── data/                       Machine-readable JSON (signals, findings, verification)
└── evidence/
    ├── summary/                Entity-scoped CSV evidence tables
    ├── charts/                 SVG visualizations (4 chart types)
    └── detail/                 Complete per-entity CSVs (--full-evidence)
```

Every finding links to its underlying data. Every run is reproducible. The entire case folder is git-committable.

---

## Why This Showcases Opus 4.6

Claude Opus 4.6 is used at **three levels** -- research, build, and runtime:

### Level 1: Domain Research (before writing code)

I used Opus 4.6 as a multi-agent research team to explore a domain I knew nothing about. Multiple agents simultaneously researched OECD bid-rigging methodology, OCP's 73 red-flag indicators, GAO audit standards, and the USAspending API schema. Opus analyzed the Cardinal-rs Rust rule engine source code and we iterated together on a TypeScript architecture. It introduced me to the GAO Yellow Book's Five C's framework. All research outputs are in `docs/` -- they became the knowledge base for the build.

### Level 2: Runtime Investigation (`--deep` flag)

The same Opus 4.6 that taught me the domain now powers an autonomous investigative agent with **8 specialized tools**:

| Tool | Purpose |
|------|---------|
| `log_reasoning` | Externalize thinking into transparent reasoning trace |
| `create_finding` | Register novel Five C's structured findings |
| `verify_entity` | SAM.gov entity verification + exclusion screening |
| `screen_sanctions` | OpenSanctions PEP/sanctions fuzzy matching |
| `fetch_comparable_awards` | In-memory comparative analysis against peer groups |
| `get_award_detail` | Deep dive into specific award competition data |
| `get_subawards` | Sub-award data for pass-through detection |
| `summarize_investigation` | Produce final investigation narrative |

**FEMA demo:** 8 iterations, 35 tool calls, $4.15. Every thought, hypothesis, and dead end recorded via `log_reasoning` and rendered as `investigation-narrative.md`.

### Level 3: Narrative Enhancement (Sonnet 4.5) + $0 Fallback

Sonnet 4.5 handles cost-efficient per-hypothesis narrative enrichment + executive assessment (~$0.10 for 14 hypotheses). All signal detection, evidence generation, and verification is **deterministic** -- works without any API key via `--no-ai`.

### Capability Summary

| Capability | How We Use It |
|------------|--------------|
| **Autonomous tool-calling** | 8 domain-specific tools, 10-iteration loop, cost budgeting ($2 cap) |
| **Extended reasoning** | `log_reasoning` externalizes investigation process into readable narrative |
| **Multi-model orchestration** | Opus for investigation, Sonnet for narratives, templates as $0 fallback |
| **Ethical reasoning** | Non-accusatory framing enforced in system prompts and structurally verified |
| **Self-verification** | Verifier agent rejects claims not backed by computed evidence |
| **Graceful degradation** | Three cost tiers ($4 / $0.10 / $0) ensure accessibility |

---

## Red-Flag Indicators

Six indicators grounded in the Open Contracting Partnership's catalogue of 73 recognised indicators:

| ID | Indicator | What It Detects | Data Source |
|----|-----------|-----------------|-------------|
| R001 | **Single-Bid Competition** | Open tenders with only 1 bidder | `number_of_offers_received` from award detail |
| R002 | **Non-Competitive Awards** | Awards bypassing open competition | `extent_competed` codes B, C, G, NDO |
| R003 | **Contract Splitting** | Clusters of awards just below regulatory thresholds | Award amounts near $250K/$7.5M by agency/recipient/period |
| R004 | **Vendor Concentration** | One supplier dominating an agency's spend | Recipient share of total agency contract value |
| R005 | **Excessive Modifications** | Contracts ballooning post-award | Modification count and cost growth via transaction history |
| R006 | **Price Outliers** | Abnormally expensive awards vs. peers | IQR/z-score outlier detection by NAICS/PSC code |

Each indicator is:
- **Configurable** -- thresholds, time windows, and minimum coverage set via `config/default.yaml`
- **Transparent** -- outputs the threshold used, data coverage, and group sizes alongside each signal
- **Non-accusatory** -- framed as screening prompts, not proof of wrongdoing
- **Filter-aware** -- `QueryContext` suppresses tautological signals (e.g., R004 when filtering by recipient)

### Signal Consolidation

Raw signals are consolidated into material findings via dollar-weighted materiality scoring with per-indicator caps (max 5 each) and convergence analysis (entities flagged by 2+ independent indicators). FEMA demo: 1,465 signals -> 16 material findings (92x reduction).

---

## Architecture

```
investigate run [--agency] [--subtier-agency] [--recipient] --period [--deep] [--charts]

  Step 1:    COLLECT        USAspending API -> paginate -> cache -> normalize
                            -> Construct QueryContext from params
  Step 2:    SIGNAL         6 indicators x fold/finalize -> signal table
  Step 2.5:  CONSOLIDATE    Group signals -> materiality scoring -> top-N findings
  Step 3:    INVESTIGATE    Opus 4.6 agent (8 tools, reasoning trace) [--deep]
  Step 3.5:  CONVERGENCE    Multi-signal correlation (entities flagged by 2+ indicators)
  Step 4:    HYPOTHESIZE    Templates + agent findings -> non-accusatory questions
  Step 5:    PROVE          CSV evidence + Vega-Lite SVG charts -> evidence/
  Step 6:    ENHANCE        Sonnet 4.5 per-hypothesis narrative enrichment
  Step 7:    REPORT         README.md + case.md + dashboard.html + narrative
  Step 8:    VERIFY         Claim-evidence cross-check + tautology detection
```

**12 source modules** with clear separation of concerns: `cli/`, `collector/`, `normalizer/`, `signaler/`, `enrichment/`, `investigator/`, `hypothesis/`, `prover/`, `narrator/`, `verifier/`, `orchestrator/`, `shared/`.

---

## Technology Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript (strict, ESM) | Type safety, modern ecosystem |
| Runtime | Node.js 20+ | LTS, native fetch |
| AI | `@anthropic-ai/sdk` | Claude Opus 4.6 + Sonnet 4.5, graceful fallback |
| CLI | `commander` | Most popular, excellent TS types |
| Validation | `zod` | Runtime schema validation for API data and config |
| HTTP | Native `fetch` + `p-retry` + `p-throttle` | Lightweight; backoff + rate limiting |
| Statistics | `simple-statistics` | Quartile/percentile calculations for indicators |
| Charts | `vega` + `vega-lite` | Reproducible SVG specs, server-side rendering |
| Config | `cosmiconfig` | Automatic config file discovery |
| Testing | `vitest` | Fast, native ESM + TypeScript |
| Logging | `pino` | Structured JSON, low overhead |

---

## Project Metrics

| Metric | Value |
|--------|-------|
| TypeScript source | 47 files, ~9,865 lines |
| Tests | 128 across 13 files, all passing in < 1 second |
| TypeScript strict mode | Zero errors |
| FEMA demo output | 5.0 MB (git-committable) |
| Output size optimization | 99.1% reduction (543 MB -> 5.0 MB) |
| Signal reduction | 92x (1,465 signals -> 16 material findings) |
| Verification | 36/36 claims verified (100%) |

---

## Data Sources

### Primary: USAspending API

**Source:** [USAspending.gov](https://www.usaspending.gov) -- no authentication required.

| Endpoint | Purpose | Key Fields |
|----------|---------|------------|
| `/search/spending_by_award/` | Primary award search | Award ID, amount, recipient, agency, dates, NAICS, PSC |
| `/awards/{id}/` | Individual award detail | Competition data: offers received, extent competed, pricing type |
| `/transactions/` | Modification history | Action type, modification number, obligation change |
| `/subawards/` | Sub-award data | Sub-awardee, amount, pass-through detection |

### Enrichment (--deep mode)

| Source | Purpose | Auth |
|--------|---------|------|
| **SAM.gov** | Entity verification, exclusion/debarment screening | Free API key |
| **OpenSanctions** | Sanctions/PEP fuzzy screening | Free trial key |
| **Sub-Awards** | Pass-through detection via USAspending | None required |

---

## Ethical Framework

- **Screening, not accusation.** Every report opens with a disclaimer: red flags are prompts for further review, not proof of wrongdoing.
- **Non-accusatory language.** Hypotheses use question form, enforced structurally in templates and AI system prompts.
- **Self-verifying.** The Verifier agent rejects reports with unsupported claims. Tautology detection catches structural bias.
- **Data quality transparency.** Reports note coverage gaps, missing fields, and minimum sample sizes.
- **Public data only.** No FOUO or sensitive-level API access.
- **Reproducibility.** Every claim links to evidence. Every run produces `provenance.json` with full audit trail.

---

## What Makes This Novel

1. **Triple-layer Opus 4.6 story:** The AI researched the domain, helped architect the tool, and now powers the investigations. Most AI tools only have one layer.

2. **Self-verifying AI:** Every claim the agent makes must survive a verification pass against computed evidence. The Verifier rejects unsupported assertions and catches tautological reasoning.

3. **Investigation-as-Code:** The entire audit methodology is codified, version-controlled, and reproducible. Every run produces a git-committable case folder with full provenance.

4. **Multi-signal convergence:** When multiple independent indicators flag the same entity, that's a meaningful signal. Parkdale was flagged by both R004 (concentration) AND R006 (price outlier) independently.

5. **Transparent reasoning:** The `log_reasoning` tool externalizes the agent's thinking into a readable investigation narrative. Users see the process, not just conclusions.

6. **Open methodology:** 6 indicators from recognised frameworks (OCP, OECD, GAO) with configurable thresholds -- not black-box scoring.

---

## References

- [Open Contracting Partnership, *Red Flags in Public Procurement* (2024)](https://www.open-contracting.org/resources/red-flags-in-public-procurement/) -- 73 indicators catalogue
- [OECD, *Guidelines for Fighting Bid Rigging in Public Procurement* (2025)](https://www.oecd.org/en/publications/2025/09/)
- [GAO Yellow Book (Government Auditing Standards)](https://www.gao.gov/yellowbook) -- Five C's finding structure
- [GAO Report GAO-20-632](https://www.gao.gov/assets/gao-20-632.pdf) -- GAO's COVID-19 contracting analysis
- [USAspending API](https://api.usaspending.gov) -- Public federal spending data
- [OCP Cardinal Library](https://github.com/open-contracting/cardinal-rs) -- fold/finalize pattern inspiration
- [OpenSanctions](https://www.opensanctions.org/) -- Global sanctions and PEP database

---

*The same AI that taught me procurement methodology now runs the investigations. Open source. TypeScript. MIT License. Built for Anthropic's Hackathon 2025.*
